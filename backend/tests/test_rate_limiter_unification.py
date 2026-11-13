"""
Automated Test Suite for Unified Bhoonidhi Download Rate Limiter (Step 3)
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Tests:
1. Preflight requests acquire the shared rate limiter.
2. Range requests acquire the same shared rate limiter.
3. Alternating preflight and Range requests respect the 30-second schedule.
4. Concurrent requests cannot bypass the rate limiter.
5. Failed requests (network errors, timeouts) still consume a scheduled request slot.
"""

import os
import sys
import io
import time
import threading
import unittest
from unittest.mock import patch, MagicMock
import requests

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

from app.services.bhoonidhi_service import bhoonidhi_service
from app.services.bhoonidhi_stream import (
    BhoonidhiRateLimiter,
    global_download_rate_limiter,
    BhoonidhiBlockCache,
    BhoonidhiRangeStream,
    BhoonidhiStreamRateLimitError
)


class TestUnifiedDownloadRateLimiting(unittest.TestCase):

    def setUp(self):
        # Reset limiter state before each test
        global_download_rate_limiter.reset()
        global_download_rate_limiter.min_interval = 35.0

    def tearDown(self):
        global_download_rate_limiter.reset()
        global_download_rate_limiter.min_interval = 35.0

    # -------------------------------------------------------------------------
    # 1. Preflight Acquires Shared Limiter
    # -------------------------------------------------------------------------

    def test_preflight_acquires_shared_limiter(self):
        """Verifies check_download_preflight calls acquire() on global_download_rate_limiter."""
        global_download_rate_limiter.min_interval = 0.001

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {
            "Content-Type": "application/octet-stream",
            "Content-Length": "12666974812",
            "Content-Disposition": 'filename="test.h5"'
        }

        with patch.object(global_download_rate_limiter, "acquire", wraps=global_download_rate_limiter.acquire) as spy_acquire, \
             patch("requests.get", return_value=mock_resp), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_token"):

            res = bhoonidhi_service.check_download_preflight("NISAR_TEST_PREFLIGHT_001")

            self.assertEqual(spy_acquire.call_count, 1)
            self.assertTrue(res["success"])
            self.assertEqual(res["content_length_bytes"], 12666974812)

    # -------------------------------------------------------------------------
    # 2. Range Requests Acquire Same Limiter
    # -------------------------------------------------------------------------

    def test_range_request_acquires_same_limiter(self):
        """Verifies BhoonidhiRangeStream acquires the same global_download_rate_limiter on cache miss."""
        global_download_rate_limiter.min_interval = 0.001

        # Unique item ID and isolated cache
        item_id = f"RANGE_LIMITER_TEST_{time.time_ns()}"
        mock_cache = MagicMock()
        # Simulate cache miss
        mock_cache.block_size = 8 * 1024 * 1024
        mock_cache.get_or_fetch.side_effect = lambda collection, item_id, total_file_size, block_index, fetch_fn: (fetch_fn(block_index), False)

        stream = BhoonidhiRangeStream(
            item_id=item_id,
            total_size=1000,
            cache=mock_cache
        )

        mock_resp = MagicMock()
        mock_resp.status_code = 206
        mock_resp.headers = {
            "Content-Range": "bytes 0-999/1000",
            "Content-Length": "1000",
            "Content-Type": "application/octet-stream"
        }
        mock_resp.raw = io.BytesIO(b"X" * 1000)

        with patch.object(global_download_rate_limiter, "acquire", wraps=global_download_rate_limiter.acquire) as spy_acquire, \
             patch("requests.get", return_value=mock_resp), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_token"):

            data = stream.read(100)
            self.assertEqual(len(data), 100)
            self.assertEqual(spy_acquire.call_count, 1)

            stream.close()

    # -------------------------------------------------------------------------
    # 3. Alternating Preflight and Range Requests Respect 30s Spacing
    # -------------------------------------------------------------------------

    def test_alternating_preflight_and_range_requests_respect_35s_spacing(self):
        """
        Verifies interleaved preflight and Range requests share the exact same queue
        and schedule consecutive request starts at least 35 seconds apart.
        """
        global_download_rate_limiter.min_interval = 35.0

        mock_resp_preflight = MagicMock()
        mock_resp_preflight.status_code = 200
        mock_resp_preflight.headers = {
            "Content-Type": "application/octet-stream",
            "Content-Length": "1000",
            "Content-Disposition": 'filename="test.h5"'
        }

        mock_resp_range = MagicMock()
        mock_resp_range.status_code = 206
        mock_resp_range.headers = {
            "Content-Range": "bytes 0-999/1000",
            "Content-Length": "1000",
            "Content-Type": "application/octet-stream"
        }
        mock_resp_range.raw = io.BytesIO(b"Y" * 1000)

        simulated_time = [1000.0]

        def fake_monotonic():
            return simulated_time[0]

        def fake_sleep(duration):
            simulated_time[0] += duration

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep), \
             patch("requests.get", side_effect=[mock_resp_preflight, mock_resp_range, mock_resp_preflight]), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_token"):

            # 1. First request: Preflight at t=1000.0
            t_start_1 = simulated_time[0]
            bhoonidhi_service.check_download_preflight("ITEM_1")
            # Next allowed starts at 1035.0
            self.assertEqual(global_download_rate_limiter._next_allowed_start, 1035.0)

            # Advance simulated clock by 5s (now t=1005.0)
            simulated_time[0] = 1005.0

            # 2. Second request: Range fetch
            mock_cache = MagicMock()
            mock_cache.block_size = 1000
            mock_cache.get_or_fetch.side_effect = lambda collection, item_id, total_file_size, block_index, fetch_fn: (fetch_fn(block_index), False)
            stream = BhoonidhiRangeStream(item_id="ITEM_2", total_size=1000, cache=mock_cache)

            stream.read(50)
            # Must have slept 30s (until t=1035.0) and scheduled next start for t=1070.0
            self.assertEqual(simulated_time[0], 1035.0)
            self.assertEqual(global_download_rate_limiter._next_allowed_start, 1070.0)
            stream.close()

            # Advance clock by 10s (now t=1045.0)
            simulated_time[0] = 1045.0

            # 3. Third request: Preflight again
            bhoonidhi_service.check_download_preflight("ITEM_3")
            # Must have slept 25s (until t=1070.0) and scheduled next start for t=1105.0
            self.assertEqual(simulated_time[0], 1070.0)
            self.assertEqual(global_download_rate_limiter._next_allowed_start, 1105.0)

    # -------------------------------------------------------------------------
    # 4. Concurrent Requests Cannot Bypass Limiter
    # -------------------------------------------------------------------------

    def test_concurrent_requests_cannot_bypass_limiter(self):
        """Verifies concurrent threads competing for slots receive strictly serialized, non-colliding start times."""
        limiter = global_download_rate_limiter
        limiter.min_interval = 0.05  # 50 ms for fast concurrency test

        scheduled_starts = []
        lock = threading.Lock()

        def worker():
            with patch("time.sleep"):  # Do not actually sleep in test
                with limiter._lock:
                    now = time.monotonic()
                    start = now if now >= limiter._next_allowed_start else limiter._next_allowed_start
                    limiter._next_allowed_start = start + limiter.min_interval
                with lock:
                    scheduled_starts.append(start)

        threads = [threading.Thread(target=worker) for _ in range(6)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(scheduled_starts), 6)
        scheduled_starts.sort()

        # Check that every consecutive start is separated by at least min_interval
        for i in range(len(scheduled_starts) - 1):
            gap = scheduled_starts[i + 1] - scheduled_starts[i]
            self.assertGreaterEqual(gap + 1e-6, limiter.min_interval)

    # -------------------------------------------------------------------------
    # 5. Failed Requests Consume a Scheduled Slot
    # -------------------------------------------------------------------------

    def test_failed_request_consumes_scheduled_slot(self):
        """Verifies that an upstream failure (e.g. network timeout) still consumes the 35s slot."""
        global_download_rate_limiter.min_interval = 35.0

        simulated_time = [2000.0]

        def fake_monotonic():
            return simulated_time[0]

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep"), \
             patch("requests.get", side_effect=requests.exceptions.ConnectionError("Connection reset by peer")), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_token"):

            # Request fails
            result = bhoonidhi_service.check_download_preflight("ITEM_FAIL_TEST")

            self.assertFalse(result["success"])
            self.assertEqual(result["preflight_status"], "network_error")

            # But the rate limiter slot MUST STILL HAVE ADVANCED to 2035.0
            self.assertEqual(global_download_rate_limiter._next_allowed_start, 2035.0)

    # -------------------------------------------------------------------------
    # 6. Rolling 65s Window, Post-Completion Spacing, OS Sleep & Delays
    # -------------------------------------------------------------------------

    def test_rolling_65s_window_and_post_completion_35s_spacing(self):
        """
        Verifies NO MORE than 2 upstream requests occur in any rolling 65s monotonic
        window, and at least 35s elapses after each completed download before next start.
        """
        from app.services.bhoonidhi_stream import DEFAULT_RATE_LIMIT_WINDOW

        limiter = BhoonidhiRateLimiter(min_interval_seconds=35.0, window_seconds=65.0, max_requests_per_window=2)
        self.assertEqual(limiter.effective_window, DEFAULT_RATE_LIMIT_WINDOW)

        sim_now = [1000.0]
        dispatches = []

        def fake_monotonic():
            return sim_now[0]

        def fake_sleep(d):
            sim_now[0] += d

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep):
            # Request 1: starts at 1000, takes 10s to complete (finishes 1010)
            limiter.acquire(timeout=200.0)
            dispatches.append(sim_now[0])
            sim_now[0] += 10.0
            limiter.record_completion()

            # Request 2: must wait >= 35s after completion at 1010 -> starts at 1045, finishes at 1050
            limiter.acquire(timeout=200.0)
            dispatches.append(sim_now[0])
            self.assertGreaterEqual(dispatches[1] - 1010.0, 35.0)
            sim_now[0] += 5.0
            limiter.record_completion()

            # Request 3: must wait >= 35s after 1050 (1085) AND >= 65s after 1010 (1075) -> 1085
            limiter.acquire(timeout=200.0)
            dispatches.append(sim_now[0])
            self.assertGreaterEqual(dispatches[2] - 1050.0, 35.0)
            self.assertGreaterEqual(dispatches[2] - dispatches[0], 65.0)

        # Also test strict rolling 65s cap even if min_interval were smaller (e.g. 20s)
        tight_limiter = BhoonidhiRateLimiter(min_interval_seconds=20.0, window_seconds=65.0, max_requests_per_window=2)
        sim_now[0] = 2000.0
        tight_dispatches = []
        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep):
            for _ in range(4):
                tight_limiter.acquire(timeout=200.0)
                tight_dispatches.append(sim_now[0])
                tight_limiter.record_completion()

        for i in range(len(tight_dispatches) - 2):
            self.assertGreaterEqual(tight_dispatches[i + 2] - tight_dispatches[i], 65.0)

    def test_os_sleep_gap_and_delayed_transfer_do_not_burst(self):
        """
        Reproduces the 12-minute gap failure mode:
        If a request stalls during sleep or transfer for 720s, the NEXT request must still
        wait 35s after completion (never firing back-to-back with 0s wait).
        """
        global_download_rate_limiter.reset()
        global_download_rate_limiter.min_interval = 35.0

        sim_now = [1000.0]
        request_times = []

        def fake_monotonic():
            return sim_now[0]

        def fake_sleep(d):
            # Simulate OS sleep during the first sleep wait (12 minutes!)
            if sim_now[0] < 1100.0 and d > 0:
                sim_now[0] += d + 720.0
            else:
                sim_now[0] += d

        def fake_get(url, params, headers, stream, allow_redirects, timeout):
            request_times.append(sim_now[0])
            # Simulate a 4-second block download
            sim_now[0] += 4.0
            rng = headers.get("Range", "bytes=0-99").replace("bytes=", "").split("-")
            start, end = int(rng[0]), int(rng[1])
            length = end - start + 1
            resp = MagicMock()
            resp.status_code = 206
            resp.headers = {
                "Content-Range": f"bytes {start}-{end}/1000",
                "Content-Length": str(length),
            }
            resp.raw = io.BytesIO(b"Z" * length)
            return resp

        mock_cache = MagicMock()
        mock_cache.block_size = 100
        mock_cache.get_or_fetch.side_effect = (
            lambda collection, item_id, total_file_size, block_index, fetch_fn: (fetch_fn(block_index), False)
        )

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep), \
             patch("requests.get", side_effect=fake_get), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_tok"):
            stream = BhoonidhiRangeStream(item_id="OS_SLEEP_TEST", total_size=1000, cache=mock_cache)
            # Req 1 at t=1000, finishes 1004
            stream.read(50)
            # Req 2 sleeps 35s + 720s OS sleep -> wakes at 1759, finishes 1763
            stream.seek(100)
            stream.read(50)
            # Req 3 must wait >= 35s after 1763 -> starts at 1798 (NOT 1763!)
            stream.seek(200)
            stream.read(50)
            stream.close()

        self.assertEqual(len(request_times), 3)
        self.assertGreaterEqual(request_times[1] - (request_times[0] + 4.0), 35.0)
        self.assertGreaterEqual(request_times[2] - (request_times[1] + 4.0), 35.0)
        self.assertGreaterEqual(request_times[2] - request_times[0], 65.0)

    def test_token_refresh_delay_occurs_before_slot_claim(self):
        """Verifies slow OAuth token refresh runs BEFORE rate limiter claims the slot."""
        global_download_rate_limiter.reset()
        global_download_rate_limiter.min_interval = 35.0

        sim_now = [5000.0]
        call_order = []

        def fake_monotonic():
            return sim_now[0]

        def fake_sleep(d):
            sim_now[0] += d

        def slow_token():
            call_order.append(("token_start", sim_now[0]))
            sim_now[0] += 15.0  # Simulate 15s token refresh
            call_order.append(("token_end", sim_now[0]))
            return "refreshed_tok"

        def fake_get(url, params, headers, stream, allow_redirects, timeout):
            call_order.append(("http_get", sim_now[0]))
            rng = headers.get("Range", "bytes=0-99").replace("bytes=", "").split("-")
            start, end = int(rng[0]), int(rng[1])
            length = end - start + 1
            resp = MagicMock()
            resp.status_code = 206
            resp.headers = {"Content-Range": f"bytes {start}-{end}/1000", "Content-Length": str(length)}
            resp.raw = io.BytesIO(b"T" * length)
            return resp

        mock_cache = MagicMock()
        mock_cache.block_size = 100
        mock_cache.get_or_fetch.side_effect = (
            lambda collection, item_id, total_file_size, block_index, fetch_fn: (fetch_fn(block_index), False)
        )

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep), \
             patch("requests.get", side_effect=fake_get), \
             patch.object(bhoonidhi_service, "get_valid_access_token", side_effect=slow_token):
            stream = BhoonidhiRangeStream(item_id="TOK_DELAY", total_size=1000, cache=mock_cache)
            stream.read(10)
            stream.seek(100)
            stream.read(10)
            stream.close()

        http_times = [t for name, t in call_order if name == "http_get"]
        # First HTTP GET at 5015; second token refresh takes 15s (5015->5030), then limiter waits remaining 20s -> 5050!
        self.assertEqual(http_times[0], 5015.0)
        self.assertEqual(http_times[1], 5050.0)
        self.assertGreaterEqual(http_times[1] - http_times[0], 35.0)

    def test_concurrent_acquire_callers_strictly_serialized(self):
        """Verifies concurrent callers using real acquire()/record_completion() never collide."""
        limiter = BhoonidhiRateLimiter(min_interval_seconds=0.03, window_seconds=0.06, max_requests_per_window=2)
        dispatches = []
        dlock = threading.Lock()

        def worker():
            limiter.acquire(timeout=5.0)
            try:
                with dlock:
                    dispatches.append(time.monotonic())
            finally:
                limiter.record_completion()

        threads = [threading.Thread(target=worker) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(dispatches), 4)
        dispatches.sort()
        for i in range(len(dispatches) - 1):
            self.assertGreaterEqual(dispatches[i + 1] - dispatches[i], 0.025)
        for i in range(len(dispatches) - 2):
            self.assertGreaterEqual(dispatches[i + 2] - dispatches[i], 0.055)

    def test_retry_after_parsing_and_bounded_429_retries_via_limiter(self):
        """
        Tests numeric & HTTP-date Retry-After parsing, global cooldown on HTTP 429,
        and bounded automatic retries passing through the same global limiter.
        """
        from email.utils import formatdate
        from app.services.bhoonidhi_stream import parse_retry_after, BhoonidhiRateLimiter

        self.assertEqual(parse_retry_after("75"), 75.0)
        self.assertEqual(parse_retry_after("65.5"), 65.5)
        self.assertIsNone(parse_retry_after(None))
        self.assertIsNone(parse_retry_after("not-a-header"))

        with patch("time.time", return_value=1700000000.0):
            future_http_date = formatdate(1700000080.0, usegmt=True)
            parsed = parse_retry_after(future_http_date)
            self.assertIsNotNone(parsed)
            self.assertAlmostEqual(parsed, 80.0, delta=1.0)

        # Bounded retry on 429 with Retry-After: 80 passing through global limiter
        global_download_rate_limiter.reset()
        global_download_rate_limiter.min_interval = 35.0
        sim_now = [3000.0]
        attempt_times = []

        def fake_monotonic():
            return sim_now[0]

        def fake_sleep(d):
            sim_now[0] += d

        resp_429 = MagicMock()
        resp_429.status_code = 429
        resp_429.headers = {"Retry-After": "80"}

        resp_206 = MagicMock()
        resp_206.status_code = 206
        resp_206.headers = {"Content-Range": "bytes 0-99/100", "Content-Length": "100"}
        resp_206.raw = io.BytesIO(b"R" * 100)

        def fake_get(url, params, headers, stream, allow_redirects, timeout):
            attempt_times.append(sim_now[0])
            return resp_429 if len(attempt_times) == 1 else resp_206

        mock_cache = MagicMock()
        mock_cache.block_size = 100
        mock_cache.put = MagicMock()

        with patch("time.monotonic", side_effect=fake_monotonic), \
             patch("time.sleep", side_effect=fake_sleep), \
             patch("requests.get", side_effect=fake_get), \
             patch.object(bhoonidhi_service, "get_valid_access_token", return_value="mock_tok"):
            stream = BhoonidhiRangeStream(
                item_id="RETRY_429_TEST",
                cache=mock_cache,
                rate_limiter=global_download_rate_limiter,
                max_429_retries=2,
            )
            self.assertEqual(stream.total_size, 100)
            self.assertEqual(len(attempt_times), 2)
            # Retry waited full Retry-After (80s >= 65s cooldown) through global_download_rate_limiter
            self.assertGreaterEqual(attempt_times[1] - attempt_times[0], 80.0)
            self.assertEqual(stream.get_telemetry()["upstream_requests_made"], 2)
            stream.close()


if __name__ == "__main__":
    unittest.main()
