"""
Unit Tests for Remote NISAR Spatial Subset Extraction (Stage 1)
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

All HTTP requests are mocked; zero live Bhoonidhi network calls are made.
"""

import io
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import h5py
import numpy as np
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.crs import CRS

# Configure UTF-8 stdout on Windows
if sys.platform == "win32" and hasattr(sys.stdout, "buffer") and not getattr(sys.stdout, "_is_utf8_wrapped", False):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        setattr(sys.stdout, "_is_utf8_wrapped", True)
    except Exception:
        pass

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.bhoonidhi_stream import (
    MAX_DISK_CACHE_BYTES,
    BhoonidhiRateLimiter,
    global_block_cache,
)
from app.services.nisar_subset import (
    DEFAULT_SUBSET_CACHE_BYTES,
    NISARSubsetValidationError,
    _win_path,
    check_available_disk_space,
    compute_subset_window,
    extract_nisar_subset,
    read_grid_coordinates,
    resolve_extraction_layers,
    resolve_projected_bounds,
)


def create_nisar_real_schema_h5_bytes(
    rows: int = 96,
    cols: int = 128,
    chunk_size: int = 32,
):
    """
    Creates an in-memory NISAR L2 GCOV HDF5 conforming to real ISRO/JPL layout:
    - xCoordinates ascending (+10.0 m)
    - yCoordinates descending (-10.0 m)
    - xCoordinateSpacing / yCoordinateSpacing as 0-D scalar datasets
    - HHHH, HVHV, numberOfLooks chunked (chunk_size x chunk_size) + gzip
    - mask, inputDataExceptionMask contiguous uint8 (chunks=None)
    """
    x_coords = 559375.0 + np.arange(cols, dtype=np.float64) * 10.0
    y_coords = 3020675.0 - np.arange(rows, dtype=np.float64) * 10.0

    yy, xx = np.mgrid[0:rows, 0:cols]
    hh = (0.02 + 0.001 * yy + 0.0005 * xx).astype(np.float32)
    hv = (0.005 + 0.0002 * yy + 0.0001 * xx).astype(np.float32)
    looks = np.full((rows, cols), 16.0, dtype=np.float32)

    mask = np.ones((rows, cols), dtype=np.uint8)
    mask[0:4, :] = 255  # Outside radar extent
    mask[4:8, :] = 0    # Partially focused / invalid

    exc_mask = np.zeros((rows, cols), dtype=np.uint8)
    exc_mask[10:20, 10:20] = 64

    bio = io.BytesIO()
    with h5py.File(bio, "w") as h5:
        freq_a = h5.create_group("science/SSAR/GCOV/grids/frequencyA")
        freq_a.create_dataset("HHHH", data=hh, chunks=(chunk_size, chunk_size), compression="gzip")
        freq_a.create_dataset("HVHV", data=hv, chunks=(chunk_size, chunk_size), compression="gzip")
        freq_a.create_dataset("numberOfLooks", data=looks, chunks=(chunk_size, chunk_size), compression="gzip")
        freq_a.create_dataset("mask", data=mask)
        freq_a.create_dataset("inputDataExceptionMask", data=exc_mask)

        freq_a.create_dataset("xCoordinates", data=x_coords)
        freq_a.create_dataset("yCoordinates", data=y_coords)
        freq_a.create_dataset("xCoordinateSpacing", data=np.float64(10.0))
        freq_a.create_dataset("yCoordinateSpacing", data=np.float64(-10.0))

        proj = freq_a.create_dataset("projection", data=np.uint32(32646))
        proj.attrs["epsg_code"] = np.int32(32646)
        proj.attrs["spatial_ref"] = b"WGS 84 / UTM zone 46N"

    return bio.getvalue(), x_coords, y_coords, hh, hv, mask, exc_mask, looks


class TestNISARSubsetExtraction(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        (
            self.h5_bytes,
            self.x_coords,
            self.y_coords,
            self.hh,
            self.hv,
            self.mask,
            self.exc_mask,
            self.looks,
        ) = create_nisar_real_schema_h5_bytes()

    def tearDown(self):
        try:
            self.tmp_dir.cleanup()
        except Exception:
            # Fallback for Windows MAX_PATH directories
            try:
                w_path = _win_path(Path(self.tmp_dir.name))
                for root, dirs, files in os.walk(w_path, topdown=False):
                    for f in files:
                        try:
                            os.remove(os.path.join(root, f))
                        except Exception:
                            pass
                    for d in dirs:
                        try:
                            os.rmdir(os.path.join(root, d))
                        except Exception:
                            pass
                os.rmdir(w_path)
            except Exception:
                pass

    def _make_mock_get(self, payload: bytes):
        total_len = len(payload)

        def _mock_get(url, params, headers, stream, allow_redirects, timeout):
            rng = headers.get("Range", "")
            parts = rng.replace("bytes=", "").split("-")
            start = int(parts[0])
            end = min(total_len - 1, int(parts[1]))
            chunk = payload[start : end + 1]

            resp = MagicMock()
            resp.status_code = 206
            resp.headers = {
                "Content-Range": f"bytes {start}-{end}/{total_len}",
                "Content-Length": str(len(chunk)),
                "Content-Type": "application/octet-stream",
            }
            resp.raw = io.BytesIO(chunk)
            return resp

        return _mock_get

    def test_resolve_extraction_layers_defaults_and_options(self):
        self.assertEqual(resolve_extraction_layers(), ["HHHH", "HVHV", "mask"])
        self.assertEqual(
            resolve_extraction_layers(include_exception_mask=True, include_number_of_looks=True),
            ["HHHH", "HVHV", "mask", "inputDataExceptionMask", "numberOfLooks"],
        )
        with self.assertRaises(NISARSubsetValidationError):
            resolve_extraction_layers(layers=["HHHH", "INVALID_BAND"])

    def test_resolve_projected_bounds_default_majuli_bbox(self):
        x_min, y_min, x_max, y_max = resolve_projected_bounds()
        self.assertAlmostEqual(x_min, 559370.96, delta=2.0)
        self.assertAlmostEqual(x_max, 659452.91, delta=2.0)
        self.assertAlmostEqual(y_min, 2931197.29, delta=2.0)
        self.assertAlmostEqual(y_max, 3020677.84, delta=2.0)

    def test_compute_subset_window_real_nisar_scale_descending_y(self):
        # Match real observed NISAR grid vectors: X=416165..761755 (34560), Y=3124795..2790725 (33408)
        x_full = 416165.0 + np.arange(34560, dtype=np.float64) * 10.0
        y_full = 3124795.0 - np.arange(33408, dtype=np.float64) * 10.0

        win = compute_subset_window(
            x_coords=x_full,
            y_coords=y_full,
            dx=10.0,
            dy=-10.0,
            projected_bounds=(559370.0, 2931197.3, 659452.9, 3020677.8),
            epsg_code=32646,
        )
        self.assertEqual(win["row_start"], 10412)
        self.assertEqual(win["row_end"], 19360)
        self.assertEqual(win["col_start"], 14321)
        self.assertEqual(win["col_end"], 24329)
        self.assertEqual(win["height"], 8948)
        self.assertEqual(win["width"], 10008)
        self.assertEqual(win["actual_bounds"]["x_min_edge"], 559370.0)
        self.assertEqual(win["actual_bounds"]["y_max_edge"], 3020680.0)

    def test_read_grid_coordinates_handles_scalar_spacings(self):
        with h5py.File(io.BytesIO(self.h5_bytes), "r") as h5:
            info = read_grid_coordinates(h5["science/SSAR/GCOV/grids/frequencyA"])
        self.assertEqual(info["dx"], 10.0)
        self.assertEqual(info["dy"], -10.0)
        self.assertEqual(info["epsg_code"], 32646)
        self.assertEqual(len(info["x_coords"]), 128)
        self.assertEqual(len(info["y_coords"]), 96)

    def test_out_of_bounds_rejected_before_extraction(self):
        with self.assertRaises(NISARSubsetValidationError):
            compute_subset_window(
                x_coords=self.x_coords,
                y_coords=self.y_coords,
                dx=10.0,
                dy=-10.0,
                projected_bounds=(100000.0, 2000000.0, 150000.0, 2050000.0),
                epsg_code=32646,
            )

    def test_disk_space_check_rejects_insufficient_space(self):
        low_disk = SimpleNamespace(total=10**9, used=9 * 10**8, free=100 * 1024 * 1024)
        with patch("shutil.disk_usage", return_value=low_disk):
            with self.assertRaises(NISARSubsetValidationError) as ctx:
                check_available_disk_space([Path(self.tmp_dir.name)], required_bytes=2 * 1024**3)
            self.assertIn("Insufficient free disk space", str(ctx.exception))

    def test_extract_nisar_subset_geotiffs_and_cache_isolation(self):
        out_dir = Path(self.tmp_dir.name) / "subsets"
        cache_dir = Path(self.tmp_dir.name) / "cache"
        limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)
        progress_events = []

        # Sub-window strictly inside the 96x128 grid
        sub_bounds = (
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        )

        with patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            result = extract_nisar_subset(
                item_id="NISAR_TEST_SUBSET_001",
                collection="NISAR_SSAR_GCOV",
                projected_bounds=sub_bounds,
                output_dir=out_dir,
                cache_dir=cache_dir,
                cache_max_disk_bytes=DEFAULT_SUBSET_CACHE_BYTES,
                rate_limiter=limiter,
                min_free_disk_bytes=1024 * 1024,
                strip_rows=32,
                progress_callback=progress_events.append,
            )

        # Global block cache limit (500 MB) must remain untouched
        self.assertEqual(global_block_cache.max_disk_bytes, MAX_DISK_CACHE_BYTES)
        self.assertEqual(result["cache_max_disk_bytes"], DEFAULT_SUBSET_CACHE_BYTES)
        self.assertEqual(result["layers"], ["HHHH", "HVHV", "mask"])
        self.assertEqual(set(result["outputs"].keys()), {"HHHH", "HVHV", "mask"})

        r0, r1 = result["window"]["row_start"], result["window"]["row_end"]
        c0, c1 = result["window"]["col_start"], result["window"]["col_end"]
        self.assertEqual((r0, r1, c0, c1), (12, 76, 10, 90))

        # Verify GeoTIFF georeferencing, CRS, and exact raster values
        with rasterio.open(result["outputs"]["HHHH"]) as src:
            self.assertEqual(src.crs, CRS.from_epsg(32646))
            self.assertEqual(src.height, 64)
            self.assertEqual(src.width, 80)
            tl_x, tl_y = src.transform @ (0.5, 0.5)
            self.assertAlmostEqual(tl_x, float(self.x_coords[10]), places=5)
            self.assertAlmostEqual(tl_y, float(self.y_coords[12]), places=5)
            arr = src.read(1)
            np.testing.assert_allclose(arr, self.hh[12:76, 10:90], rtol=1e-6)

        with rasterio.open(result["outputs"]["mask"]) as src_m:
            self.assertEqual(src_m.dtypes[0], "uint8")
            self.assertEqual(src_m.nodata, 255.0)
            np.testing.assert_array_equal(src_m.read(1), self.mask[12:76, 10:90])

        self.assertGreater(len(progress_events), 3)
        self.assertEqual(progress_events[-1]["completed_rows"], 64 * 3)
        self.assertEqual(progress_events[-1]["total_rows"], 64 * 3)
        self.assertTrue(result["telemetry"]["is_closed"])

    def test_extract_optional_layers_and_resume_skips_completed(self):
        out_dir = Path(self.tmp_dir.name) / "subsets_opt"
        cache_dir = Path(self.tmp_dir.name) / "cache_opt"
        limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)
        sub_bounds = (
            float(self.x_coords[5]),
            float(self.y_coords[50]),
            float(self.x_coords[60]),
            float(self.y_coords[5]),
        )

        with patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            first = extract_nisar_subset(
                item_id="NISAR_TEST_OPT_001",
                include_exception_mask=True,
                include_number_of_looks=True,
                projected_bounds=sub_bounds,
                output_dir=out_dir,
                cache_dir=cache_dir,
                rate_limiter=limiter,
                min_free_disk_bytes=1024 * 1024,
            )

        self.assertEqual(
            set(first["outputs"].keys()),
            {"HHHH", "HVHV", "mask", "inputDataExceptionMask", "numberOfLooks"},
        )

        # Resume pretending only HHHH and mask were completed prior to interruption,
        # passing previously persisted total_size so block 0 also hits disk cache.
        resumed_progress = []
        with patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)) as spy_get, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            resumed = extract_nisar_subset(
                item_id="NISAR_TEST_OPT_001",
                projected_bounds=sub_bounds,
                output_dir=out_dir,
                cache_dir=cache_dir,
                rate_limiter=limiter,
                min_free_disk_bytes=1024 * 1024,
                already_completed_outputs={
                    "HHHH": first["outputs"]["HHHH"],
                    "mask": first["outputs"]["mask"],
                },
                total_size=first["telemetry"]["total_remote_size_bytes"],
                progress_callback=resumed_progress.append,
            )

        self.assertTrue(any("Skipped already completed layer 'HHHH'" in p["status_message"] for p in resumed_progress))
        self.assertTrue(any("Skipped already completed layer 'mask'" in p["status_message"] for p in resumed_progress))
        self.assertEqual(spy_get.call_count, 0)
        self.assertEqual(resumed["telemetry"]["cache_misses"], 0)

    def test_stale_partial_tmp_file_cleaned_up_before_write(self):
        """
        Regression test: An orphaned or partial .tif.tmp file left by a previous crash
        is safely unlinked before rasterio.open, avoiding GDAL 'delete fails' errors.
        """
        out_dir = Path(self.tmp_dir.name) / "orphan_test"
        out_dir.mkdir(parents=True, exist_ok=True)
        cache_dir = Path(self.tmp_dir.name) / "cache_orphan"
        cache_dir.mkdir(parents=True, exist_ok=True)
        limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001, window_seconds=0.001)

        # Plant orphaned .tif.tmp files (both short and legacy naming)
        (out_dir / "frequencyA_HHHH.tif.tmp").write_bytes(b"corrupted_prior_tmp_bytes")
        (out_dir / "NISAR_TEST_ORPHAN_001_frequencyA_HHHH.tif.tmp").write_bytes(b"legacy_corrupted_bytes")

        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]

        with patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            res = extract_nisar_subset(
                item_id="NISAR_TEST_ORPHAN_001",
                projected_bounds=sub_bounds,
                output_dir=out_dir,
                cache_dir=cache_dir,
                rate_limiter=limiter,
                min_free_disk_bytes=1024 * 1024,
            )

        self.assertEqual(res["status"], "completed")
        self.assertTrue(Path(res["outputs"]["HHHH"]).exists())
        self.assertFalse((out_dir / "frequencyA_HHHH.tif.tmp").exists())
        self.assertFalse((out_dir / "NISAR_TEST_ORPHAN_001_frequencyA_HHHH.tif.tmp").exists())

    def test_windows_long_path_output_handling(self):
        """
        Regression test: Extraction succeeds when output_dir exceeds Windows MAX_PATH (260 chars).
        """
        deep_dir = Path(self.tmp_dir.name) / ("sub_" + "x" * 120) / ("job_" + "y" * 120)
        cache_dir = Path(self.tmp_dir.name) / "cache_longpath"
        cache_dir.mkdir(parents=True, exist_ok=True)
        limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001, window_seconds=0.001)

        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]

        with patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            res = extract_nisar_subset(
                item_id="NISAR_TEST_LONG_PATH_001",
                projected_bounds=sub_bounds,
                output_dir=deep_dir,
                cache_dir=cache_dir,
                rate_limiter=limiter,
                min_free_disk_bytes=1024 * 1024,
            )

        self.assertEqual(res["status"], "completed")
        self.assertTrue(len(str(deep_dir)) > 240)
        for layer, path_str in res["outputs"].items():
            self.assertTrue(len(path_str) > 260)
            with rasterio.open(path_str) as ds:
                self.assertEqual(ds.count, 1)


if __name__ == "__main__":
    unittest.main()
