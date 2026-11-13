"""
Unit and Integration Tests for Remote NISAR HDF5 Metadata Inspection (Step 2)
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Tests:
1. Reusable metadata helper with local HDF5 file.
2. Metadata helper with an already-open h5py.File object.
3. h5py.File(stream, "r", driver="fileobj") compatibility with BhoonidhiRangeStream.
4. Arbitrary seek/read operations across block boundaries.
5. Verification that no dataset pixel arrays are read into memory during inspection.
6. Resource cleanup on both success and failure (h5_file.close() and stream.close()).
7. Existing local inspection behavior preservation.
8. Remote inspection FastAPI endpoint (POST /api/nisar/scenes/{item_id}/remote-inspect).
"""

import os
import sys
import io
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import numpy as np
import h5py

# Configure UTF-8 stdout on Windows
if sys.platform == "win32" and hasattr(sys.stdout, "buffer") and not getattr(sys.stdout, "_is_utf8_wrapped", False):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        setattr(sys.stdout, "_is_utf8_wrapped", True)
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient

from app.main import app
from app.services.nisar_reader import NISARGCOVReader
from app.services.bhoonidhi_stream import (
    BhoonidhiRateLimiter,
    BhoonidhiBlockCache,
    BhoonidhiRangeStream,
    BhoonidhiStreamError,
    BhoonidhiStreamRateLimitError
)


def create_synthetic_nisar_h5_bytes(granule_id: str = "NISAR_S2_PR_GCOV_SYNTHETIC_001") -> bytes:
    """Creates an in-memory NISAR Level-2 GCOV HDF5 file and returns its raw bytes."""
    bio = io.BytesIO()
    with h5py.File(bio, "w") as h5:
        # CF-compliant NISAR hierarchy
        science = h5.create_group("science")
        ssar = science.create_group("SSAR")
        gcov = ssar.create_group("GCOV")
        grids = gcov.create_group("grids")
        freq_a = grids.create_group("frequencyA")

        # Create polarimetric backscatter datasets with chunking and compression
        data_hh = np.ones((120, 120), dtype=np.float32) * 0.05
        ds_hh = freq_a.create_dataset(
            "HHHH",
            data=data_hh,
            chunks=(40, 40),
            compression="gzip",
            compression_opts=4
        )
        ds_hh.attrs["units"] = "linear power (gamma-0)"
        ds_hh.attrs["description"] = "Calibrated co-polarized backscatter"

        data_hv = np.ones((120, 120), dtype=np.float32) * 0.01
        ds_hv = freq_a.create_dataset(
            "HHHV",
            data=data_hv,
            chunks=(40, 40)
        )
        ds_hv.attrs["units"] = "linear power (gamma-0)"

        # Coordinates and Projection
        freq_a.create_dataset("xCoordinates", data=np.linspace(400000, 403000, 120, dtype=np.float64))
        freq_a.create_dataset("yCoordinates", data=np.linspace(2900000, 2897000, 120, dtype=np.float64))

        proj_ds = freq_a.create_dataset("projection", data=np.int32(0))
        proj_ds.attrs["epsg_code"] = np.int32(32646)
        proj_ds.attrs["spatial_ref"] = "WGS 84 / UTM zone 46N"

        # Identification metadata
        ident = gcov.create_group("identification")
        ident.attrs["granule_id"] = granule_id
        ident.attrs["track"] = np.int32(19)
        ident.attrs["frame"] = np.int32(75)

    return bio.getvalue()


class TestRemoteNISARInspection(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.h5_bytes = create_synthetic_nisar_h5_bytes("NISAR_TEST_GRANULE_999")
        self.h5_path = os.path.join(self.tmp_dir.name, "test_nisar.h5")
        with open(self.h5_path, "wb") as f:
            f.write(self.h5_bytes)

    def tearDown(self):
        self.tmp_dir.cleanup()

    # -------------------------------------------------------------------------
    # 1. Local File Inspection Helper
    # -------------------------------------------------------------------------

    def test_inspect_hdf5_structure_local_file(self):
        """Verifies inspect_hdf5_structure inspects a local HDF5 file correctly."""
        result = NISARGCOVReader.inspect_hdf5_structure(self.h5_path)

        self.assertEqual(result["filepath"], self.h5_path)
        self.assertEqual(result["instrument"], "SSAR")
        self.assertEqual(result["product_type"], "L2_GCOV (Geocoded Polarimetric Covariance)")
        self.assertEqual(result["granule_id"], "NISAR_TEST_GRANULE_999")
        self.assertEqual(result["epsg_code"], 32646)
        self.assertIn("frequencyA", result["frequencies"])

        bands = result["bands"]["frequencyA"]
        band_names = [b["name"] for b in bands]
        self.assertIn("HHHH", band_names)
        self.assertIn("HHHV", band_names)

        hhhh_info = next(b for b in bands if b["name"] == "HHHH")
        self.assertEqual(hhhh_info["shape"], [120, 120])
        self.assertEqual(hhhh_info["dtype"], "float32")
        self.assertEqual(hhhh_info["units"], "linear power (gamma-0)")
        self.assertEqual(hhhh_info["chunks"], [40, 40])
        self.assertEqual(hhhh_info["compression"], "gzip")
        self.assertIsNotNone(hhhh_info["storage_size_bytes"])
        self.assertEqual(hhhh_info["path"], "/science/SSAR/GCOV/grids/frequencyA/HHHH")

    # -------------------------------------------------------------------------
    # 2. Already-Open h5py.File Inspection Helper
    # -------------------------------------------------------------------------

    def test_inspect_open_h5_reusability(self):
        """Verifies inspect_open_h5 operates on an already-open h5py.File handle."""
        with h5py.File(self.h5_path, "r") as h5:
            result = NISARGCOVReader.inspect_open_h5(
                h5,
                source_id="virtual_open_test",
                file_size_bytes=len(self.h5_bytes)
            )

        self.assertEqual(result["filepath"], "virtual_open_test")
        self.assertEqual(result["instrument"], "SSAR")
        self.assertEqual(result["granule_id"], "NISAR_TEST_GRANULE_999")
        self.assertEqual(result["epsg_code"], 32646)
        self.assertIn("projection_attributes", result)
        self.assertIn("identification", result)

    # -------------------------------------------------------------------------
    # 3. h5py driver="fileobj" Compatibility with BhoonidhiRangeStream
    # -------------------------------------------------------------------------

    def test_h5py_fileobj_stream_compatibility(self):
        """Demonstrates h5py.File(stream, 'r', driver='fileobj') works with BhoonidhiRangeStream."""
        total_len = len(self.h5_bytes)
        cache_dir = os.path.join(self.tmp_dir.name, "cache")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir, block_size=16384)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        stream = BhoonidhiRangeStream(
            item_id="NISAR_STREAM_TEST",
            total_size=total_len,
            collection="NISAR_SSAR_GCOV",
            cache=custom_cache,
            rate_limiter=fast_limiter,
            timeout=10.0
        )

        # Mock requests.get returning exact requested byte slices
        def mock_requests_get(url, params, headers, stream, allow_redirects, timeout):
            rng = headers.get("Range", "")
            # parse "bytes=start-end"
            parts = rng.replace("bytes=", "").split("-")
            start = int(parts[0])
            end = int(parts[1])
            expected_slice = self.h5_bytes[start : end + 1]

            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = {
                "Content-Range": f"bytes {start}-{end}/{total_len}",
                "Content-Length": str(len(expected_slice)),
                "Content-Type": "application/octet-stream"
            }
            # Socket stream mock
            mock_resp.raw = io.BytesIO(expected_slice)
            return mock_resp

        with patch("requests.get", side_effect=mock_requests_get), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            h5_file = h5py.File(stream, "r", driver="fileobj")
            try:
                metadata = NISARGCOVReader.inspect_open_h5(
                    h5_file,
                    source_id="NISAR_STREAM_TEST",
                    file_size_bytes=total_len
                )
            finally:
                h5_file.close()
                stream.close()

            # Verify inspection succeeded over stream
            self.assertEqual(metadata["instrument"], "SSAR")
            self.assertEqual(metadata["granule_id"], "NISAR_TEST_GRANULE_999")
            self.assertEqual(metadata["epsg_code"], 32646)

            # Verify telemetry
            telemetry = stream.get_telemetry()
            self.assertTrue(telemetry["is_closed"])
            self.assertGreater(telemetry["bytes_served_to_reader"], 0)
            self.assertGreater(telemetry["bytes_fetched_remote"], 0)
            self.assertGreater(telemetry["upstream_requests_made"], 0)

    # -------------------------------------------------------------------------
    # 4. Arbitrary Seek/Read Operations Across Block Boundaries
    # -------------------------------------------------------------------------

    def test_seek_and_read_across_block_boundaries(self):
        """Verifies arbitrary seeks and multi-block reads yield exact byte fidelity."""
        test_payload = (b"ABCDEFGHIJKLMNOPQRSTUVWXYZ012345" * 100)  # 3200 bytes
        total_len = len(test_payload)
        cache_dir = os.path.join(self.tmp_dir.name, "cache_boundaries")
        small_cache = BhoonidhiBlockCache(cache_dir=cache_dir, block_size=256)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        stream = BhoonidhiRangeStream(
            item_id="BOUNDARY_TEST",
            total_size=total_len,
            cache=small_cache,
            rate_limiter=fast_limiter
        )

        def mock_fetch(url, params, headers, stream, allow_redirects, timeout):
            rng = headers.get("Range", "")
            parts = rng.replace("bytes=", "").split("-")
            start = int(parts[0])
            end = int(parts[1])
            expected_slice = test_payload[start : end + 1]

            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = {
                "Content-Range": f"bytes {start}-{end}/{total_len}",
                "Content-Length": str(len(expected_slice))
            }
            mock_resp.raw = io.BytesIO(expected_slice)
            return mock_resp

        with patch("requests.get", side_effect=mock_fetch), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            # Seek to byte 200 (inside block 0) and read 400 bytes (crossing into block 1 and block 2)
            stream.seek(200)
            self.assertEqual(stream.tell(), 200)
            read_bytes = stream.read(400)
            self.assertEqual(len(read_bytes), 400)
            self.assertEqual(read_bytes, test_payload[200:600])

            # Seek to byte 1000 and read 10 bytes
            stream.seek(1000)
            self.assertEqual(stream.read(10), test_payload[1000:1010])

            # Seek from current position
            stream.seek(50, os.SEEK_CUR)
            self.assertEqual(stream.tell(), 1060)

            # Seek from end
            stream.seek(-100, os.SEEK_END)
            self.assertEqual(stream.tell(), total_len - 100)
            self.assertEqual(stream.read(100), test_payload[-100:])

            # Read past EOF returns empty
            self.assertEqual(stream.read(50), b"")

            stream.close()

    # -------------------------------------------------------------------------
    # 5. Verification: No Dataset Pixel Arrays Read Into Memory
    # -------------------------------------------------------------------------

    def test_no_pixel_arrays_read_during_inspection(self):
        """Verifies that inspecting metadata never invokes __getitem__ on dataset pixel arrays."""
        with h5py.File(self.h5_path, "r") as h5:
            dataset = h5["science/SSAR/GCOV/grids/frequencyA/HHHH"]

            # Wrap __getitem__ in a mock to spy on pixel reads
            original_getitem = dataset.__getitem__
            read_spy = MagicMock(side_effect=original_getitem)
            dataset.__getitem__ = read_spy

            NISARGCOVReader.inspect_open_h5(
                h5,
                source_id="no_read_spy_test",
                file_size_bytes=len(self.h5_bytes)
            )

            # Assert __getitem__ was NEVER invoked on the 2D array
            self.assertEqual(read_spy.call_count, 0)

    # -------------------------------------------------------------------------
    # 6. Resource Cleanup on Success and Failure
    # -------------------------------------------------------------------------

    def test_stream_resource_cleanup_and_post_close_errors(self):
        """Verifies close() releases resources and all post-close I/O calls raise ValueError."""
        stream = BhoonidhiRangeStream(
            item_id="CLEANUP_TEST",
            total_size=1000
        )
        self.assertFalse(stream.closed)
        self.assertTrue(stream.readable())
        self.assertTrue(stream.seekable())

        stream.close()
        self.assertTrue(stream.closed)
        self.assertFalse(stream.readable())
        self.assertFalse(stream.seekable())

        with self.assertRaises(ValueError):
            stream.read(10)

        with self.assertRaises(ValueError):
            stream.seek(0)

        with self.assertRaises(ValueError):
            stream.tell()

    # -------------------------------------------------------------------------
    # 7. Existing Local Inspection Behavior Unchanged
    # -------------------------------------------------------------------------

    def test_existing_local_inspection_behavior_unchanged(self):
        """Verifies GET /api/nisar/inspect remains 100% operational."""
        response = self.client.get("/api/nisar/inspect?date_str=2026-07-09")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("filepath", data)
        self.assertIn("file_size_mb", data)
        self.assertIn("instrument", data)
        self.assertIn("product_type", data)
        self.assertIn("granule_id", data)
        self.assertIn("frequencies", data)
        self.assertIn("bands", data)
        self.assertIn("epsg_code", data)
        self.assertIn("projection", data)

    # -------------------------------------------------------------------------
    # 8. Step 4D: Dynamic HDF5 File Size Discovery via HTTP Range
    # -------------------------------------------------------------------------

    def test_default_rate_limit_interval_is_35_seconds(self):
        """Verifies DEFAULT_RATE_LIMIT_INTERVAL is set to 35 seconds for safe 2 req/min spacing."""
        from app.services.bhoonidhi_stream import DEFAULT_RATE_LIMIT_INTERVAL
        self.assertEqual(DEFAULT_RATE_LIMIT_INTERVAL, 35.0)

    def test_first_range_request_discovers_total_size_correctly(self):
        """
        Test 1: First Range request (bytes=0-8388607) discovers total file size
        from Content-Range denominator and initializes stream cleanly.
        """
        block_size = 8 * 1024 * 1024  # 8 MB
        simulated_total = 12666974812
        payload_block_0 = b"A" * block_size
        cache_dir = os.path.join(self.tmp_dir.name, "cache_discover_1")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir, block_size=block_size)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "Content-Range": f"bytes 0-{block_size - 1}/{simulated_total}",
            "Content-Length": str(block_size),
            "Content-Type": "application/octet-stream"
        }
        mock_resp.raw = io.BytesIO(payload_block_0)

        with patch("requests.get", return_value=mock_resp) as spy_get, \
             patch.object(fast_limiter, "acquire", wraps=fast_limiter.acquire) as spy_acquire, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            stream = BhoonidhiRangeStream(
                item_id="NISAR_DISCOVER_TEST_001",
                collection="NISAR_SSAR_GCOV",
                cache=custom_cache,
                rate_limiter=fast_limiter
            )
            try:
                self.assertEqual(stream.total_size, simulated_total)
                self.assertEqual(spy_acquire.call_count, 1)
                self.assertEqual(spy_get.call_count, 1)
                sent_headers = spy_get.call_args.kwargs["headers"]
                self.assertEqual(sent_headers["Range"], f"bytes=0-{block_size - 1}")
                mock_resp.close.assert_called_once()
            finally:
                stream.close()

    def test_first_block_reused_from_cache_no_duplicate_request(self):
        """
        Tests 2 & 4: Block 0 retrieved during size discovery is cached and reused;
        subsequent reads from block 0 hit cache and NEVER issue a duplicate request.
        """
        block_size = 8 * 1024 * 1024
        simulated_total = 12666974812
        payload_block_0 = (b"NISAR_HEADER_DATA_" * (block_size // 18 + 1))[:block_size]
        cache_dir = os.path.join(self.tmp_dir.name, "cache_reuse_0")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir, block_size=block_size)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "Content-Range": f"bytes 0-{block_size - 1}/{simulated_total}",
            "Content-Length": str(block_size),
        }
        mock_resp.raw = io.BytesIO(payload_block_0)

        with patch("requests.get", return_value=mock_resp) as spy_get, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            stream = BhoonidhiRangeStream.open(
                item_id="NISAR_REUSE_BLOCK0_TEST",
                collection="NISAR_SSAR_GCOV",
                cache=custom_cache,
                rate_limiter=fast_limiter
            )
            try:
                # Read from offset 0
                head = stream.read(1024)
                self.assertEqual(head, payload_block_0[:1024])

                # Seek within block 0 and read again
                stream.seek(500000)
                mid = stream.read(2048)
                self.assertEqual(mid, payload_block_0[500000:502048])

                # Assert ONLY 1 upstream request occurred across init + 2 reads
                self.assertEqual(spy_get.call_count, 1)
                telemetry = stream.get_telemetry()
                self.assertEqual(telemetry["upstream_requests_made"], 1)
                self.assertEqual(telemetry["cache_hits"], 2)
                self.assertEqual(telemetry["cache_misses"], 0)
            finally:
                stream.close()

    def test_h5py_compatibility_with_dynamically_discovered_size(self):
        """
        Test 10: Existing h5py file-object compatibility remains intact when
        total_size is discovered dynamically from Content-Range.
        """
        total_len = len(self.h5_bytes)
        cache_dir = os.path.join(self.tmp_dir.name, "cache_h5py_dyn")
        # 8 MB block size >= synthetic h5_bytes, so entire file fits in block 0
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "Content-Range": f"bytes 0-{total_len - 1}/{total_len}",
            "Content-Length": str(total_len),
        }
        mock_resp.raw = io.BytesIO(self.h5_bytes)

        with patch("requests.get", return_value=mock_resp) as spy_get, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            stream = BhoonidhiRangeStream(
                item_id="NISAR_H5PY_DYNAMIC_TEST",
                collection="NISAR_SSAR_GCOV",
                cache=custom_cache,
                rate_limiter=fast_limiter
            )
            h5_file = h5py.File(stream, "r", driver="fileobj")
            try:
                metadata = NISARGCOVReader.inspect_open_h5(
                    h5_file,
                    source_id="NISAR_H5PY_DYNAMIC_TEST",
                    file_size_bytes=stream.total_size
                )
            finally:
                h5_file.close()
                stream.close()

            self.assertEqual(metadata["granule_id"], "NISAR_TEST_GRANULE_999")
            self.assertEqual(metadata["epsg_code"], 32646)
            self.assertEqual(spy_get.call_count, 1)

    def test_invalid_content_range_rejected(self):
        """Test 5: Malformed Content-Range or start/end mismatches are strictly rejected."""
        cache_dir = os.path.join(self.tmp_dir.name, "cache_bad_cr")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        invalid_headers = [
            "bytes 0-100",                   # missing /total
            "invalid-header",                # garbage
            "bytes 10-8388607/12666974812",  # start != 0
            "bytes 0-100/12666974812",       # end != min(total-1, block_size-1)
            "bytes 0-0/0",                   # total size == 0
        ]

        for bad_cr in invalid_headers:
            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = {"Content-Range": bad_cr}
            mock_resp.raw = io.BytesIO(b"")

            with patch("requests.get", return_value=mock_resp), \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

                with self.assertRaises(BhoonidhiStreamError):
                    BhoonidhiRangeStream(
                        item_id="BAD_CR_TEST",
                        cache=custom_cache,
                        rate_limiter=fast_limiter
                    )
                mock_resp.close.assert_called_once()

    def test_missing_or_wildcard_total_size_rejected(self):
        """Test 8: Missing Content-Range or wildcard '*' total size is rejected."""
        cache_dir = os.path.join(self.tmp_dir.name, "cache_wildcard")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        for headers in [{}, {"Content-Range": "bytes 0-8388607/*"}]:
            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = headers
            mock_resp.raw = io.BytesIO(b"")

            with patch("requests.get", return_value=mock_resp), \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

                with self.assertRaises(BhoonidhiStreamError):
                    BhoonidhiRangeStream(
                        item_id="WILDCARD_CR_TEST",
                        cache=custom_cache,
                        rate_limiter=fast_limiter
                    )
                mock_resp.close.assert_called_once()

    def test_http_200_rejected_not_downloaded(self):
        """Test 6: HTTP 200 Full Content is rejected immediately without reading response body."""
        cache_dir = os.path.join(self.tmp_dir.name, "cache_200")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {"Content-Length": "12666974812"}

        with patch("requests.get", return_value=mock_resp), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

            with self.assertRaises(BhoonidhiStreamError) as ctx:
                BhoonidhiRangeStream(
                    item_id="HTTP_200_REJECT_TEST",
                    cache=custom_cache,
                    rate_limiter=fast_limiter
                )
            self.assertIn("HTTP 200", str(ctx.exception))
            mock_resp.raw.read.assert_not_called()
            mock_resp.close.assert_called_once()

    def test_http_429_and_412_handled_correctly(self):
        """Test 7: HTTP 429 and 412 raise BhoonidhiStreamRateLimitError and close response."""
        cache_dir = os.path.join(self.tmp_dir.name, "cache_429")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        for code in (429, 412):
            mock_resp = MagicMock()
            mock_resp.status_code = code
            mock_resp.headers = {}

            with patch("requests.get", return_value=mock_resp), \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

                with self.assertRaises(BhoonidhiStreamRateLimitError):
                    BhoonidhiRangeStream(
                        item_id=f"HTTP_{code}_TEST",
                        cache=custom_cache,
                        rate_limiter=fast_limiter
                    )
                mock_resp.close.assert_called_once()

    def test_incorrect_content_length_rejected(self):
        """Test 9: Content-Length mismatch or non-numeric Content-Length is rejected."""
        cache_dir = os.path.join(self.tmp_dir.name, "cache_bad_cl")
        custom_cache = BhoonidhiBlockCache(cache_dir=cache_dir)
        fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        for bad_cl in ("999", "not-a-number"):
            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = {
                "Content-Range": f"bytes 0-{custom_cache.block_size - 1}/12666974812",
                "Content-Length": bad_cl
            }
            mock_resp.raw = io.BytesIO(b"")

            with patch("requests.get", return_value=mock_resp), \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"):

                with self.assertRaises(BhoonidhiStreamError):
                    BhoonidhiRangeStream(
                        item_id="BAD_CL_TEST",
                        cache=custom_cache,
                        rate_limiter=fast_limiter
                    )
                mock_resp.close.assert_called_once()

    def test_remote_inspect_endpoint_discovers_size_with_single_request_no_preflight(self):
        """
        Tests 3 & 4 (Endpoint integration): POST /api/nisar/scenes/{item_id}/remote-inspect
        discovers total size via first HTTP Range request, NEVER calls check_download_preflight(),
        NEVER requires STAC product_size, and inspects HDF5 metadata in 1 upstream request.
        """
        import time
        item_id = f"NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_TEST_{time.time_ns()}"
        total_len = len(self.h5_bytes)

        def mock_fetch(url, params, headers, stream, allow_redirects, timeout):
            rng = headers.get("Range", "")
            parts = rng.replace("bytes=", "").split("-")
            start = int(parts[0])
            requested_end = int(parts[1])
            actual_end = min(total_len - 1, requested_end)
            expected_slice = self.h5_bytes[start : actual_end + 1]

            mock_resp = MagicMock()
            mock_resp.status_code = 206
            mock_resp.headers = {
                "Content-Range": f"bytes {start}-{actual_end}/{total_len}",
                "Content-Length": str(len(expected_slice)),
                "Content-Type": "application/octet-stream"
            }
            mock_resp.raw = io.BytesIO(expected_slice)
            return mock_resp

        with patch("app.services.bhoonidhi_service.bhoonidhi_service.get_scene_details") as spy_details, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.check_download_preflight") as spy_preflight, \
             patch("requests.get", side_effect=mock_fetch) as spy_get, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"), \
             patch("app.services.bhoonidhi_stream.global_download_rate_limiter.min_interval", 0.001):

            response = self.client.post(f"/api/nisar/scenes/{item_id}/remote-inspect")

            self.assertEqual(response.status_code, 200)
            body = response.json()

            # Critical assertions:
            # 1. No preflight and no dependency on STAC details
            self.assertEqual(spy_preflight.call_count, 0)
            self.assertEqual(spy_details.call_count, 0)
            # 2. Only ONE upstream HTTP request total (block 0 discovery + cache reuse)
            self.assertEqual(spy_get.call_count, 1)

            self.assertEqual(body["status"], "success")
            self.assertEqual(body["item_id"], item_id)
            self.assertEqual(body["collection"], "NISAR_SSAR_GCOV")
            self.assertEqual(body["file_summary"]["source"], "http_content_range_discovery")
            self.assertEqual(body["file_summary"]["content_length_bytes"], total_len)
            self.assertIn("metadata", body)
            self.assertIn("telemetry", body)

            # Metadata assertions
            meta = body["metadata"]
            self.assertEqual(meta["instrument"], "SSAR")
            self.assertEqual(meta["granule_id"], "NISAR_TEST_GRANULE_999")
            self.assertEqual(meta["epsg_code"], 32646)

            # Telemetry assertions
            telem = body["telemetry"]
            self.assertEqual(telem["total_remote_size_bytes"], total_len)
            self.assertEqual(telem["upstream_requests_made"], 1)
            self.assertGreater(telem["bytes_served_to_reader"], 0)
            self.assertEqual(telem["bytes_fetched_remote"], total_len)
            self.assertGreater(telem["cache_hits"], 0)
            self.assertEqual(telem["cache_misses"], 0)
            self.assertTrue(telem["is_closed"])

    def test_remote_inspect_endpoint_maps_429_rate_limit(self):
        """Verifies remote-inspect returns HTTP 429 if initial Range request hits upstream 429."""
        item_id = "NISAR_TEST_429_001"
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.headers = {}

        with patch("requests.get", return_value=mock_resp), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_token"), \
             patch("app.services.bhoonidhi_stream.global_download_rate_limiter.min_interval", 0.001):

            response = self.client.post(f"/api/nisar/scenes/{item_id}/remote-inspect")
            self.assertEqual(response.status_code, 429)


if __name__ == "__main__":
    unittest.main()
