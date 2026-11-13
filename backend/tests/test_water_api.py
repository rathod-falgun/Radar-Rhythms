"""
Unit and integration tests for Phase 4: Water Detection and Flood Change API Endpoints.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import numpy as np
from fastapi.testclient import TestClient
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.transform import from_origin

from app.main import app
from app.services.subset_job_manager import subset_job_manager


class TestWaterAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp_dir.name)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def _create_synthetic_job_outputs(self, job_id: str) -> Path:
        job_dir = Path("data/output/subsets") / "TEST_SCENE" / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        h, w = 30, 30
        transform = from_origin(560000.0, 2940000.0, 10.0, 10.0)
        profile = {
            "driver": "GTiff",
            "height": h,
            "width": w,
            "count": 1,
            "crs": "EPSG:32646",
            "transform": transform,
            "compress": "deflate",
        }

        hh = (job_dir / "frequencyA_HHHH.tif")
        hv = (job_dir / "frequencyA_HVHV.tif")
        mask = (job_dir / "frequencyA_mask.tif")

        # Half water, half land
        hh_data = np.full((h, w), 0.08, dtype=np.float32)
        hh_data[10:20, :] = 0.005

        with rasterio.open(hh, "w", dtype="float32", **profile) as d:
            d.write(hh_data, 1)
        with rasterio.open(hv, "w", dtype="float32", **profile) as d:
            d.write(hh_data * 0.15, 1)
        with rasterio.open(mask, "w", dtype="uint8", **profile) as d:
            d.write(np.zeros((h, w), dtype=np.uint8), 1)

        # Mock persisted job in subset_job_manager
        mock_job = {
            "job_id": job_id,
            "item_id": "TEST_SCENE",
            "collection": "NISAR_SSAR_GCOV",
            "status": "completed",
            "output_dir": str(job_dir),
            "outputs": {
                "HHHH": str(hh),
                "HVHV": str(hv),
                "mask": str(mask),
            },
            "progress": {"status_message": "Completed"},
        }
        jobs_file = Path("data/output/subsets/_jobs") / f"{job_id}.json"
        jobs_file.parent.mkdir(parents=True, exist_ok=True)
        with open(jobs_file, "w", encoding="utf-8") as f:
            json.dump(mock_job, f)

        return job_dir

    def test_water_detect_endpoint(self):
        import numpy as np
        job_id = "test_job_api_water_01"
        self._create_synthetic_job_outputs(job_id)

        try:
            res = self.client.post("/api/water/detect", json={"job_id": job_id})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "success")
            self.assertIn("extent_metrics", data)
            self.assertTrue(data["extent_metrics"]["water_area_km2"] > 0)
            self.assertIn("outputs", data)
            self.assertTrue(Path(data["outputs"]["water_mask_geotiff"]).exists())

            # Test boundaries GeoJSON endpoint
            b_res = self.client.get(f"/api/water/jobs/{job_id}/boundaries")
            self.assertEqual(b_res.status_code, 200)
            gj = b_res.json()
            self.assertEqual(gj["type"], "FeatureCollection")
            self.assertTrue(len(gj["features"]) > 0)
        finally:
            shutil.rmtree(Path("data/output/subsets") / "TEST_SCENE", ignore_errors=True)
            job_file = Path("data/output/subsets/_jobs") / f"{job_id}.json"
            if job_file.exists():
                job_file.unlink()

    def test_water_compare_endpoint(self):
        # Compare two dates using local sample data or calibrated grid fallback
        res = self.client.post(
            "/api/water/compare",
            json={
                "baseline_date": "2026-06-27",
                "event_date": "2026-07-09",
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["baseline_date"], "2026-06-27")
        self.assertEqual(data["event_date"], "2026-07-09")
        self.assertIn("change_metrics", data)

    def test_layer_download_security(self):
        # Downloading a path outside data/output must return 403 Forbidden
        res = self.client.get("/api/layers/download", params={"path": "C:\\Windows\\System32\\calc.exe"})
        self.assertEqual(res.status_code, 403)


if __name__ == "__main__":
    import numpy as np
    unittest.main()
