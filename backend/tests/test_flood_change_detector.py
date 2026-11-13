"""
Unit and regression tests for Phase 3: Multi-Date Flood Change Detection Engine.
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

from app.services.flood_change_detector import (
    CLASS_NEWLY_INUNDATED,
    CLASS_PERSISTENT_WATER,
    CLASS_RECEDED_WATER,
    CLASS_STABLE_LAND,
    compare_two_observations,
    compute_flood_change_matrix,
)


class TestFloodChangeDetector(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp_dir.name)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_flood_change_matrix_logic(self):
        # 4 pixels:
        # P0: dry -> dry (stable land)
        # P1: water -> water (persistent)
        # P2: dry -> water (newly inundated)
        # P3: water -> dry (receded)
        w1 = np.array([[False, True], [False, True]])
        v1 = np.ones((2, 2), dtype=bool)

        w2 = np.array([[False, True], [True, False]])
        v2 = np.ones((2, 2), dtype=bool)

        matrix = compute_flood_change_matrix(w1, v1, w2, v2)

        self.assertEqual(matrix[0, 0], CLASS_STABLE_LAND)
        self.assertEqual(matrix[0, 1], CLASS_PERSISTENT_WATER)
        self.assertEqual(matrix[1, 0], CLASS_NEWLY_INUNDATED)
        self.assertEqual(matrix[1, 1], CLASS_RECEDED_WATER)

    def test_end_to_end_observation_comparison(self):
        h, w = 40, 40
        transform = from_origin(560000.0, 2940000.0, 10.0, 10.0)
        profile = {
            "driver": "GTiff",
            "height": h,
            "width": w,
            "count": 1,
            "dtype": "uint8",
            "crs": "EPSG:32646",
            "transform": transform,
            "nodata": 255,
        }

        # Baseline T1: River across rows 15:25
        t1_water = np.zeros((h, w), dtype=np.uint8)
        t1_water[15:25, :] = 1

        # Event T2: Flood expansion across rows 10:30 (rows 10:15 and 25:30 are new flood!)
        t2_water = np.zeros((h, w), dtype=np.uint8)
        t2_water[10:30, :] = 1

        t1_path = self.root / "t1_water.tif"
        t2_path = self.root / "t2_water.tif"
        out_dir = self.root / "change_out"

        with rasterio.open(t1_path, "w", **profile) as dst:
            dst.write(t1_water, 1)
        with rasterio.open(t2_path, "w", **profile) as dst:
            dst.write(t2_water, 1)

        result = compare_two_observations(
            t1_date_str="2026-06-27",
            t1_water_tif=t1_path,
            t2_date_str="2026-07-09",
            t2_water_tif=t2_path,
            output_dir=out_dir,
        )

        self.assertEqual(result["status"], "success")
        metrics = result["change_metrics"]

        # Pixel area = 100 m^2
        # Persistent: 10 rows * 40 cols = 400 pixels = 40,000 m^2 = 0.04 km^2
        self.assertAlmostEqual(metrics["persistent_water_km2"], 0.04, delta=0.005)
        # Newly inundated: 10 rows * 40 cols = 400 pixels = 40,000 m^2 = 0.04 km^2
        self.assertAlmostEqual(metrics["newly_inundated_km2"], 0.04, delta=0.005)
        # Receded: 0 pixels = 0.0 km^2
        self.assertEqual(metrics["receded_water_km2"], 0.0)

        # Output files exist
        self.assertTrue(Path(result["outputs"]["change_raster_geotiff"]).exists())
        self.assertTrue(Path(result["outputs"]["change_vector_geojson"]).exists())

        # Inspect GeoJSON
        with open(result["outputs"]["change_vector_geojson"], "r", encoding="utf-8") as f:
            gj = json.load(f)
        self.assertEqual(gj["type"], "FeatureCollection")
        self.assertTrue(len(gj["features"]) > 0)


if __name__ == "__main__":
    unittest.main()

