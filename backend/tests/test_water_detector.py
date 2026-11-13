"""
Unit and regression tests for Phase 2: Water-Body Detection Engine.
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
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.transform import from_origin

from app.services.water_detector import (
    apply_lee_filter,
    apply_morphological_mmu,
    compute_otsu_threshold,
    detect_water_from_geotiffs,
    extract_water_polygons,
    linear_to_db,
)


class TestWaterDetector(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp_dir.name)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_linear_to_db(self):
        # 1.0 linear = 0.0 dB
        # 0.1 linear = -10.0 dB
        # 0.01 linear = -20.0 dB
        arr = np.array([1.0, 0.1, 0.01, 0.0], dtype=np.float32)
        db = linear_to_db(arr)
        np.testing.assert_allclose(db[0], 0.0, atol=1e-3)
        np.testing.assert_allclose(db[1], -10.0, atol=1e-3)
        np.testing.assert_allclose(db[2], -20.0, atol=1e-3)
        self.assertTrue(db[3] <= -70.0)  # clipped by eps

    def test_otsu_thresholding_bimodal(self):
        # Bimodal distribution: water peak at -22 dB, land peak at -10 dB
        rng = np.random.RandomState(42)
        water = rng.normal(-22.0, 1.0, size=1000)
        land = rng.normal(-10.0, 1.5, size=2000)
        combined = np.concatenate([water, land])
        mask = np.ones_like(combined, dtype=bool)

        threshold = compute_otsu_threshold(combined, mask)
        # Threshold should clearly separate the two distributions (-20 to -16 dB)
        self.assertTrue(-21.0 <= threshold <= -15.0)

    def test_morphological_mmu_removes_single_pixels(self):
        # Grid with isolated 1-pixel noise and one solid 5x5 water block
        grid = np.zeros((20, 20), dtype=bool)
        grid[2, 2] = True  # isolated pixel
        grid[15, 15] = True  # isolated pixel
        grid[5:10, 5:10] = True  # 5x5 = 25 pixels block

        cleaned = apply_morphological_mmu(grid, min_cluster_pixels=5)
        self.assertFalse(cleaned[2, 2])
        self.assertFalse(cleaned[15, 15])
        self.assertTrue(np.all(cleaned[6:9, 6:9]))

    def test_end_to_end_water_detection_geotiff(self):
        # Create synthetic GeoTIFFs with georeferencing in EPSG:32646 (Majuli area)
        h, w = 60, 60
        transform = from_origin(560000.0, 2940000.0, 10.0, 10.0)

        # Land ~ 0.08 linear (-11 dB), Water channel ~ 0.005 linear (-23 dB)
        hh_data = np.full((h, w), 0.08, dtype=np.float32)
        hh_data[20:40, :] = 0.005  # river channel across middle

        hv_data = hh_data * 0.15  # HV is lower
        mask_data = np.zeros((h, w), dtype=np.uint8)  # 0 = valid

        hh_path = self.root / "frequencyA_HHHH.tif"
        hv_path = self.root / "frequencyA_HVHV.tif"
        m_path = self.root / "frequencyA_mask.tif"
        out_dir = self.root / "water_out"

        kwargs = {
            "driver": "GTiff",
            "height": h,
            "width": w,
            "count": 1,
            "crs": "EPSG:32646",
            "transform": transform,
            "compress": "deflate",
        }

        with rasterio.open(hh_path, "w", dtype="float32", **kwargs) as dst:
            dst.write(hh_data, 1)
        with rasterio.open(hv_path, "w", dtype="float32", **kwargs) as dst:
            dst.write(hv_data, 1)
        with rasterio.open(m_path, "w", dtype="uint8", **kwargs) as dst:
            dst.write(mask_data, 1)

        result = detect_water_from_geotiffs(
            hhhh_path=hh_path,
            hvhv_path=hv_path,
            mask_path=m_path,
            output_dir=out_dir,
        )

        self.assertEqual(result["status"], "success")
        self.assertIn("water_mask_geotiff", result["outputs"])
        self.assertIn("water_boundaries_geojson", result["outputs"])
        self.assertTrue(Path(result["outputs"]["water_mask_geotiff"]).exists())
        self.assertTrue(Path(result["outputs"]["water_boundaries_geojson"]).exists())

        metrics = result["extent_metrics"]
        # 20 rows * 60 cols = 1200 water pixels * 100 m^2 = 120,000 m^2 = 0.12 km^2
        self.assertAlmostEqual(metrics["water_area_km2"], 0.12, delta=0.03)
        self.assertTrue(metrics["water_area_ha"] > 10.0)

        # Verify GeoJSON is valid and reprojected to EPSG:4326
        with open(result["outputs"]["water_boundaries_geojson"], "r", encoding="utf-8") as f:
            geojson = json.load(f)
        self.assertEqual(geojson["type"], "FeatureCollection")
        self.assertTrue(len(geojson["features"]) >= 1)
        # Coordinates should be longitude around 93-94, latitude around 26-27
        first_coord = geojson["features"][0]["geometry"]["coordinates"][0][0]
        self.assertTrue(90.0 <= first_coord[0] <= 96.0)
        self.assertTrue(24.0 <= first_coord[1] <= 29.0)


if __name__ == "__main__":
    unittest.main()
