"""
Integration & Persistence Tests for Remote NISAR Subset Background Jobs (Stage 2)
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

All HTTP requests are mocked; zero live Bhoonidhi network calls are made.
"""

import io
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import rasterio

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

from app.main import app
from app.services.bhoonidhi_stream import BhoonidhiRateLimiter
from app.services.nisar_subset import DEFAULT_SUBSET_CACHE_BYTES
from app.services.subset_job_manager import SubsetJobManager
from tests.test_nisar_subset import create_nisar_real_schema_h5_bytes


class TestSubsetBackgroundJobs(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp_dir.name)
        self.jobs_dir = self.root / "jobs"
        self.out_dir = self.root / "outputs"
        self.cache_dir = self.root / "cache"
        self.fast_limiter = BhoonidhiRateLimiter(min_interval_seconds=0.001)

        self.manager = SubsetJobManager(
            jobs_dir=self.jobs_dir,
            output_base_dir=self.out_dir,
            cache_dir=self.cache_dir,
            rate_limiter=self.fast_limiter,
            min_free_disk_bytes=1024 * 1024,
        )
        self.client = TestClient(app)
        (
            self.h5_bytes,
            self.x_coords,
            self.y_coords,
            self.hh,
            self.hv,
            self.mask,
            _,
            _,
        ) = create_nisar_real_schema_h5_bytes()

    def tearDown(self):
        self.manager.shutdown(wait=True)
        self.tmp_dir.cleanup()

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

    def _wait_for_terminal_status(self, job_id: str, timeout_s: float = 10.0):
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            res = self.client.get(f"/api/nisar/subset-jobs/{job_id}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            if data["status"] in ("completed", "failed", "cancelled", "interrupted"):
                return data
            time.sleep(0.05)
        self.fail(f"Job {job_id} did not reach terminal state within {timeout_s}s.")

    def test_job_creation_execution_and_status_endpoints(self):
        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]

        with patch("app.api.routes.subset_job_manager", self.manager), \
             patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):

            start_res = self.client.post(
                "/api/nisar/scenes/NISAR_JOB_TEST_001/remote-subset",
                json={"projected_bounds": sub_bounds},
            )
            self.assertEqual(start_res.status_code, 202)
            start_body = start_res.json()
            self.assertTrue(start_body["accepted"])
            job_id = start_body["job"]["job_id"]
            self.assertEqual(start_body["job"]["layers"], ["HHHH", "HVHV", "mask"])
            self.assertEqual(start_body["job"]["cache_max_disk_bytes"], DEFAULT_SUBSET_CACHE_BYTES)

            final_job = self._wait_for_terminal_status(job_id)

            self.assertEqual(final_job["status"], "completed")
            self.assertTrue(final_job["telemetry"]["is_closed"])
            self.assertEqual(final_job["progress"]["progress_percent"], 100.0)
            self.assertEqual(final_job["progress"]["completed_rows"], 64 * 3)
            self.assertEqual(final_job["progress"]["total_rows"], 64 * 3)
            self.assertGreater(final_job["progress"]["completed_chunks"], 0)
            self.assertGreater(final_job["telemetry"]["upstream_requests_made"], 0)
            self.assertGreater(final_job["telemetry"]["bytes_fetched_remote"], 0)
            self.assertEqual(set(final_job["outputs"].keys()), {"HHHH", "HVHV", "mask"})

            for tif_path in final_job["outputs"].values():
                self.assertTrue(os.path.exists(tif_path))

            # List jobs endpoint
            list_res = self.client.get("/api/nisar/subset-jobs")
            self.assertEqual(list_res.status_code, 200)
            self.assertEqual(list_res.json()["count"], 1)
            self.assertEqual(list_res.json()["jobs"][0]["job_id"], job_id)

            # Completed job cannot be resumed (409)
            resume_completed = self.client.post(f"/api/nisar/subset-jobs/{job_id}/resume")
            self.assertEqual(resume_completed.status_code, 409)

    def test_interrupted_job_detection_and_resume_with_cached_blocks(self):
        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]

        # 1. Run a real job to completion so cached blocks + HHHH GeoTIFF exist on disk
        with patch("app.api.routes.subset_job_manager", self.manager), \
             patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            res = self.client.post(
                "/api/nisar/scenes/NISAR_RESUME_TEST_001/remote-subset",
                json={"projected_bounds": sub_bounds},
            )
            job_id = res.json()["job"]["job_id"]
            completed = self._wait_for_terminal_status(job_id)

        # 2. Mutate persisted JSON to simulate crash mid-job after HHHH finished (HVHV & mask pending)
        job_json_path = self.jobs_dir / f"{job_id}.json"
        persisted = json.loads(job_json_path.read_text(encoding="utf-8"))
        persisted["status"] = "running"
        persisted["completed_at"] = None
        persisted["outputs"] = {"HHHH": completed["outputs"]["HHHH"]}
        os.remove(completed["outputs"]["HVHV"])
        os.remove(completed["outputs"]["mask"])
        job_json_path.write_text(json.dumps(persisted, indent=2), encoding="utf-8")
        hhhh_mtime_before = os.path.getmtime(completed["outputs"]["HHHH"])

        # 3. Simulate fresh manager after server restart -> detects orphaned 'running' job as 'interrupted'
        restarted_manager = SubsetJobManager(
            jobs_dir=self.jobs_dir,
            output_base_dir=self.out_dir,
            cache_dir=self.cache_dir,
            rate_limiter=self.fast_limiter,
            min_free_disk_bytes=1024 * 1024,
        )
        try:
            with patch("app.api.routes.subset_job_manager", restarted_manager), \
                 patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)) as spy_get, \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):

                status_res = self.client.get(f"/api/nisar/subset-jobs/{job_id}")
                self.assertEqual(status_res.status_code, 200)
                self.assertEqual(status_res.json()["status"], "interrupted")

                resume_res = self.client.post(f"/api/nisar/subset-jobs/{job_id}/resume")
                self.assertEqual(resume_res.status_code, 202)

                resumed_final = self._wait_for_terminal_status(job_id)
                self.assertEqual(resumed_final["status"], "completed")
                self.assertEqual(set(resumed_final["outputs"].keys()), {"HHHH", "HVHV", "mask"})
                # Zero new upstream requests because total_file_size and block 0+ were cached!
                self.assertEqual(spy_get.call_count, 0)
                self.assertEqual(os.path.getmtime(completed["outputs"]["HHHH"]), hhhh_mtime_before)
                with rasterio.open(resumed_final["outputs"]["HVHV"]) as src_hv:
                    self.assertEqual((src_hv.height, src_hv.width), (64, 80))
        finally:
            restarted_manager.shutdown(wait=True)

    def test_validation_and_disk_checks_before_queueing(self):
        with patch("app.api.routes.subset_job_manager", self.manager):
            # Unsupported layer -> 422
            bad_layer = self.client.post(
                "/api/nisar/scenes/NISAR_BAD/remote-subset",
                json={"layers": ["HHHH", "NO_SUCH_LAYER"]},
            )
            self.assertEqual(bad_layer.status_code, 422)

            # Unsupported collection -> 422
            bad_coll = self.client.post(
                "/api/nisar/scenes/NISAR_BAD/remote-subset",
                json={"collection": "BAD_COLLECTION"},
            )
            self.assertEqual(bad_coll.status_code, 422)

            # Low disk space -> 422
            low_disk = SimpleNamespace(total=10**9, used=9.9 * 10**8, free=100)
            with patch("shutil.disk_usage", return_value=low_disk):
                no_space = self.client.post(
                    "/api/nisar/scenes/NISAR_BAD/remote-subset",
                    json={},
                )
                self.assertEqual(no_space.status_code, 422)
                self.assertIn("Insufficient free disk space", no_space.json()["detail"])

            # Unknown job ID -> 404
            missing = self.client.get("/api/nisar/subset-jobs/DOES_NOT_EXIST")
            self.assertEqual(missing.status_code, 404)

    def test_job_failure_records_error_cleanly(self):
        mock_429 = MagicMock()
        mock_429.status_code = 429
        mock_429.headers = {}

        with patch("app.api.routes.subset_job_manager", self.manager), \
             patch("requests.get", return_value=mock_429), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):

            res = self.client.post("/api/nisar/scenes/NISAR_FAIL_429/remote-subset", json={})
            self.assertEqual(res.status_code, 202)
            job_id = res.json()["job"]["job_id"]

            failed = self._wait_for_terminal_status(job_id)
            self.assertEqual(failed["status"], "failed")
            self.assertIn("429", failed["error"])

    def test_mid_stream_failure_closes_telemetry_preserves_cache_and_resumes(self):
        """
        Verifies that when a job fails mid-extraction after opening BhoonidhiRangeStream:
        1. Final telemetry records is_closed=True and exact upstream request counts.
        2. Cached blocks on disk remain intact and total_file_size is preserved.
        3. Resuming recovers from cached blocks and completes cleanly.
        """
        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]

        with patch("app.api.routes.subset_job_manager", self.manager), \
             patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            # Force failure on HVHV open/write via rasterio mock? Better: fail on 2nd layer via wrapper that preserves real stream close
            real_open = rasterio.open
            open_count = [0]

            def fail_on_second_layer(*args, **kwargs):
                open_count[0] += 1
                if open_count[0] == 2 and len(args) > 1 and args[1] == "w":
                    raise RuntimeError("Simulated mid-job failure during HVHV")
                return real_open(*args, **kwargs)

            with patch("app.services.nisar_subset.rasterio.open", side_effect=fail_on_second_layer):
                res = self.client.post(
                    "/api/nisar/scenes/NISAR_MIDFAIL_001/remote-subset",
                    json={"projected_bounds": sub_bounds},
                )
                self.assertEqual(res.status_code, 202)
                job_id = res.json()["job"]["job_id"]
                failed = self._wait_for_terminal_status(job_id)

        self.assertEqual(failed["status"], "failed")
        self.assertTrue(failed["telemetry"]["is_closed"])
        self.assertEqual(failed["telemetry"]["upstream_requests_made"], 1)
        self.assertEqual(failed["total_file_size"], len(self.h5_bytes))
        self.assertIn("HHHH", failed["outputs"])
        self.assertNotIn("HVHV", failed["outputs"])
        # No orphan .tmp files left behind
        out_files = list(Path(failed["output_dir"]).glob("*.tmp"))
        self.assertEqual(out_files, [])

        # Resume must skip HHHH and finish HVHV + mask with 0 new upstream requests
        with patch("app.api.routes.subset_job_manager", self.manager), \
             patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)) as spy_get, \
             patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
            res2 = self.client.post(f"/api/nisar/subset-jobs/{job_id}/resume")
            self.assertEqual(res2.status_code, 202)
            done = self._wait_for_terminal_status(job_id)

        self.assertEqual(done["status"], "completed")
        self.assertTrue(done["telemetry"]["is_closed"])
        self.assertEqual(spy_get.call_count, 0)
        self.assertEqual(set(done["outputs"].keys()), {"HHHH", "HVHV", "mask"})

    def test_cancelled_job_records_closed_telemetry_and_recovers(self):
        """
        Verifies cancelled job records telemetry.is_closed=True, removes .tif.tmp,
        preserves cached blocks, and resumes cleanly.
        """
        sub_bounds = [
            float(self.x_coords[10]),
            float(self.y_coords[75]),
            float(self.x_coords[89]),
            float(self.y_coords[12]),
        ]
        slow_manager = SubsetJobManager(
            jobs_dir=self.jobs_dir,
            output_base_dir=self.out_dir,
            cache_dir=self.cache_dir,
            rate_limiter=self.fast_limiter,
            min_free_disk_bytes=1024 * 1024,
        )
        try:
            real_open = rasterio.open
            first_strip_started = [False]

            with patch("app.api.routes.subset_job_manager", slow_manager), \
                 patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)), \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):

                job_id_holder = []

                class _SlowWriter:
                    def __init__(self, inner):
                        self._inner = inner
                    def __enter__(self):
                        self._inner.__enter__()
                        return self
                    def __exit__(self, *a):
                        return self._inner.__exit__(*a)
                    def write(self, *a, **kw):
                        if not first_strip_started[0] and job_id_holder:
                            first_strip_started[0] = True
                            slow_manager.cancel_job(job_id_holder[0])
                        return self._inner.write(*a, **kw)
                    def __getattr__(self, name):
                        return getattr(self._inner, name)

                def wrapped_open(*args, **kwargs):
                    ds = real_open(*args, **kwargs)
                    if len(args) > 1 and args[1] == "w":
                        return _SlowWriter(ds)
                    return ds

                with patch("app.services.nisar_subset.rasterio.open", side_effect=wrapped_open):
                    res = self.client.post(
                        "/api/nisar/scenes/NISAR_CANCEL_001/remote-subset",
                        json={"projected_bounds": sub_bounds},
                    )
                    self.assertEqual(res.status_code, 202)
                    job_id = res.json()["job"]["job_id"]
                    job_id_holder.append(job_id)
                    cancelled = self._wait_for_terminal_status(job_id)

            self.assertEqual(cancelled["status"], "cancelled")
            self.assertTrue(cancelled["telemetry"]["is_closed"])
            self.assertEqual(list(Path(cancelled["output_dir"]).glob("*.tmp")), [])

            # Resume recovers cleanly from cached blocks
            with patch("app.api.routes.subset_job_manager", slow_manager), \
                 patch("requests.get", side_effect=self._make_mock_get(self.h5_bytes)) as spy_get, \
                 patch("app.services.bhoonidhi_service.bhoonidhi_service.get_valid_access_token", return_value="mock_tok"):
                r_res = self.client.post(f"/api/nisar/subset-jobs/{job_id}/resume")
                self.assertEqual(r_res.status_code, 202)
                done = self._wait_for_terminal_status(job_id)

            self.assertEqual(done["status"], "completed")
            self.assertTrue(done["telemetry"]["is_closed"])
            self.assertEqual(spy_get.call_count, 0)
        finally:
            slow_manager.shutdown(wait=True)


if __name__ == "__main__":
    unittest.main()

