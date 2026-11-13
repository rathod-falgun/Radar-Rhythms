"""
Remote NISAR HDF5 Stream & Block Cache Service
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Implements a seekable, read-only file-like object (io.RawIOBase) backed by HTTP
Range requests against ISRO's Bhoonidhi /download endpoint for large NISAR Level 2
GCOV HDF5 containers (~12.67 GB).

Architecture & Constraints:
- Rate Limiting: Minimum 30 seconds between actual upstream request starts across threads.
  NOTE: This rate limiter coordinates threads within a single Python process. If multi-process
  workers (e.g. Uvicorn multi-worker mode) are deployed, an external distributed lock
  is required.
  NOTE: Existing Bhoonidhi preflight requests in bhoonidhi_service.py are not yet connected
  to this limiter and must be linked in a subsequent integration step. This limiter protects
  all requests dispatched through BhoonidhiRangeStream.
- 8 MB persistent disk-backed block cache with in-memory LRU (4 blocks) and 500 MB disk cap.
- Cache keys incorporate collection, item ID, total file size, and block index to prevent version collisions.
- In-flight request deduplication with safe reference-counted lock cleanup.
- Strict HTTP 206 Partial Content validation, exact Content-Range verification (no wildcards),
  and Content-Length verification when supplied.
- Robust socket stream reading until expected byte count is reached or EOF occurs.
- Memory protection capping maximum single read allocation (32 MB) while permitting normal h5py operations.
- Full compatibility with h5py's fileobj driver (read, readinto, seek, tell, seekable).
"""

import os
import re
import time
import io
import logging
import threading
from datetime import timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from collections import OrderedDict, deque
from typing import Dict, Any, Optional, Tuple, List, Union, Deque
import requests

from .bhoonidhi_service import bhoonidhi_service, BhoonidhiRateLimitError, BhoonidhiAPIError
from ..core.config import settings

logger = logging.getLogger("bhoonidhi_stream")

# Block and Cache Constants
BLOCK_SIZE: int = 8 * 1024 * 1024               # 8 MB per block
MAX_MEMORY_BLOCKS: int = 4                       # Maximum 4 blocks kept in RAM (32 MB)
MAX_DISK_CACHE_BYTES: int = 500 * 1024 * 1024   # 500 MB maximum disk cache
DEFAULT_RATE_LIMIT_INTERVAL: float = 35.0        # Minimum seconds after completion before next request
DEFAULT_RATE_LIMIT_WINDOW: float = 65.0          # Rolling monotonic window length in seconds
DEFAULT_RATE_LIMIT_MAX_REQUESTS: int = 2         # Maximum upstream /download requests per rolling window
MAX_429_COOLDOWN_SECONDS: float = 300.0          # Cap automatic Retry-After wait during retries (5 minutes)
MAX_SINGLE_READ_BYTES: int = 32 * 1024 * 1024    # 32 MB max individual read allocation


class BhoonidhiStreamError(Exception):
    """Raised for remote HDF5 stream errors, protocol violations, or network failures."""
    pass


class BhoonidhiStreamRateLimitError(BhoonidhiStreamError, BhoonidhiRateLimitError):
    """Raised when upstream rate limits (HTTP 429) or precondition limits (HTTP 412) are hit."""
    pass


class _RetryableHTTP429(Exception):
    """Internal control-flow exception signaling an HTTP 429 that applied cooldown."""

    def __init__(self, cooldown: float):
        super().__init__(f"HTTP 429 cooldown {cooldown:.1f}s")
        self.cooldown = cooldown


class _RetryableHTTP5xx(Exception):
    """Internal control-flow exception signaling a transient upstream 5xx error."""

    def __init__(self, status_code: int):
        super().__init__(f"HTTP {status_code} transient server error")
        self.status_code = status_code


def parse_retry_after(header_value: Optional[str]) -> Optional[float]:
    """
    Parses an HTTP Retry-After header (delta-seconds or HTTP-date).
    Uses wall-clock time (time.time()) ONLY to convert an HTTP-date into relative seconds.
    Returns non-negative seconds to wait, or None if missing/invalid.
    """
    if header_value is None:
        return None
    raw = str(header_value).strip()
    if not raw:
        return None

    # 1. Numeric delay-seconds
    try:
        secs = float(raw)
        if secs != secs or secs in (float("inf"), float("-inf")):
            return None
        return max(0.0, secs)
    except ValueError:
        pass

    # 2. HTTP-date (converted against wall-clock time)
    try:
        dt = parsedate_to_datetime(raw)
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = dt.timestamp() - time.time()
        return max(0.0, delta)
    except Exception:
        return None


# =============================================================================
# 1. Global Thread-Safe Rate Limiter
# =============================================================================

class BhoonidhiRateLimiter:
    """
    Thread-safe global rate limiter enforcing Bhoonidhi's rolling download policy:
    - Uses time.monotonic() exclusively for elapsed intervals, completion spacing,
      rolling-window enforcement, and cooldowns.
    - Guarantees at most `max_requests_per_window` (2) upstream /download requests
      within any rolling `effective_window` (65s) monotonic window.
    - Guarantees at least `min_interval` (35s) between completed request finish time
      and the next request start, preventing bursts after OS sleep or slow transfers.
    - Re-checks monotonic clock AFTER sleeping outside the lock before claiming a slot.
    - Enforces global cooldowns on HTTP 429 / Retry-After across all callers and retries.
    """

    def __init__(
        self,
        min_interval_seconds: float = DEFAULT_RATE_LIMIT_INTERVAL,
        window_seconds: Optional[float] = None,
        max_requests_per_window: int = DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    ):
        if min_interval_seconds <= 0:
            raise ValueError(f"min_interval_seconds must be positive, got {min_interval_seconds}")
        if max_requests_per_window < 1:
            raise ValueError(f"max_requests_per_window must be at least 1, got {max_requests_per_window}")
        if window_seconds is not None and window_seconds <= 0:
            raise ValueError(f"window_seconds must be positive, got {window_seconds}")

        self.min_interval: float = float(min_interval_seconds)
        self._explicit_window: Optional[float] = float(window_seconds) if window_seconds is not None else None
        self.max_requests_per_window: int = int(max_requests_per_window)

        self._lock = threading.Lock()
        self._next_allowed_start: float = 0.0
        self._last_completed_at: float = 0.0
        self._cooldown_until: float = 0.0
        self._request_history: Deque[float] = deque(maxlen=self.max_requests_per_window)

    @property
    def effective_window(self) -> float:
        """
        Rolling window duration in seconds (65s for >=35s min_interval; scales
        proportionally only if a test explicitly lowers min_interval below 35s).
        """
        if self._explicit_window is not None:
            return self._explicit_window
        if self.min_interval >= DEFAULT_RATE_LIMIT_INTERVAL:
            return DEFAULT_RATE_LIMIT_WINDOW
        return DEFAULT_RATE_LIMIT_WINDOW * (self.min_interval / DEFAULT_RATE_LIMIT_INTERVAL)

    def _earliest_allowed_locked(self, now: float) -> float:
        earliest = max(self._next_allowed_start, self._cooldown_until)
        if self._last_completed_at > 0.0:
            earliest = max(earliest, self._last_completed_at + self.min_interval)
        if len(self._request_history) >= self.max_requests_per_window:
            oldest = self._request_history[-self.max_requests_per_window]
            earliest = max(earliest, oldest + self.effective_window)
        return earliest

    def acquire(self, timeout: float = 120.0) -> float:
        """
        Waits until BOTH post-completion spacing (>= 35s) and rolling window
        (<= 2 requests / 65s) permit an upstream request, then claims the slot.
        Sleeps outside the lock and re-verifies monotonic time upon waking so
        OS sleep gaps or concurrent waiters cannot double-claim or burst.
        """
        deadline = time.monotonic() + timeout
        total_slept = 0.0

        while True:
            with self._lock:
                now = time.monotonic()
                earliest = self._earliest_allowed_locked(now)
                if earliest <= now:
                    self._next_allowed_start = now + self.min_interval
                    self._request_history.append(now)
                    return total_slept

                wait_time = earliest - now
                if (now + wait_time) > deadline:
                    raise BhoonidhiStreamRateLimitError(
                        f"Rate limiter wait time ({wait_time:.1f}s) exceeds timeout ({timeout}s) for Bhoonidhi request."
                    )

            # Sleep outside self._lock
            logger.info(
                f"[RateLimiter] Waiting {wait_time:.2f}s outside lock "
                f"(spacing>={self.min_interval:.1f}s, max {self.max_requests_per_window}/{self.effective_window:.1f}s)..."
            )
            time.sleep(wait_time)
            total_slept += wait_time

    def record_completion(self, cooldown_seconds: Optional[float] = None) -> None:
        """
        Records actual upstream request completion timestamp in monotonic time so
        delayed transfers, OS sleep pauses, or HTTP 429 cooldowns push subsequent
        requests forward cleanly.
        """
        with self._lock:
            now = time.monotonic()
            self._last_completed_at = max(self._last_completed_at, now)
            self._next_allowed_start = max(self._next_allowed_start, now + self.min_interval)
            if self._request_history:
                latest = self._request_history.pop()
                self._request_history.append(max(latest, now))
            else:
                self._request_history.append(now)

            if cooldown_seconds is not None and cooldown_seconds > 0:
                cooldown_until = now + float(cooldown_seconds)
                self._cooldown_until = max(self._cooldown_until, cooldown_until)
                self._next_allowed_start = max(self._next_allowed_start, cooldown_until)

    def apply_http_429_cooldown(self, retry_after_header: Optional[str] = None) -> float:
        """
        Parses optional Retry-After header and imposes a global cooldown of at least
        one full rolling window (65s) or Retry-After, whichever is larger.
        """
        parsed = parse_retry_after(retry_after_header)
        cooldown = max(self.effective_window, parsed if parsed is not None else 0.0)
        self.record_completion(cooldown_seconds=cooldown)
        logger.warning(
            f"[RateLimiter] HTTP 429 received (Retry-After={retry_after_header!r}). "
            f"Applied global cooldown of {cooldown:.1f}s."
        )
        return cooldown

    def get_time_until_next_allowed(self) -> float:
        """Returns monotonic seconds remaining before a new request could start without waiting."""
        with self._lock:
            now = time.monotonic()
            return max(0.0, self._earliest_allowed_locked(now) - now)

    def reset(self):
        """Resets the rate limiter state (useful for testing and re-initialization)."""
        with self._lock:
            self._next_allowed_start = 0.0
            self._last_completed_at = 0.0
            self._cooldown_until = 0.0
            self._request_history.clear()


# Global rate limiter instance shared across stream operations
global_download_rate_limiter = BhoonidhiRateLimiter()


# =============================================================================
# 2. 8 MB Persistent Disk-Backed LRU Block Cache
# =============================================================================

class BhoonidhiBlockCache:
    """
    Two-tier block cache for remote HDF5 data:
    - Tier 1: In-memory LRU cache limited to 4 blocks (32 MB RAM).
    - Tier 2: Persistent on-disk cache limited to 500 MB.

    Cache Identity:
    - Keyed by (collection, item_id, total_file_size, block_index).
    - Incorporating total_file_size guarantees blocks cannot be reused across
      incompatible file revisions or different granule versions.

    Concurrency & Robustness:
    - Uses reference-counted in-flight locks to deduplicate concurrent block fetches
      and cleans up lock dictionary entries once all waiting threads finish.
    - Atomic disk writes via process-unique temporary files and atomic replace.
    - Thread-safe disk pruning protecting directory structures.
    """

    def __init__(
        self,
        cache_dir: Optional[Union[str, Path]] = None,
        block_size: int = BLOCK_SIZE,
        max_mem_blocks: int = MAX_MEMORY_BLOCKS,
        max_disk_bytes: int = MAX_DISK_CACHE_BYTES
    ):
        if block_size <= 0:
            raise ValueError(f"block_size must be positive, got {block_size}")
        if max_mem_blocks < 1:
            raise ValueError(f"max_mem_blocks must be at least 1, got {max_mem_blocks}")
        if max_disk_bytes < block_size:
            raise ValueError(f"max_disk_bytes ({max_disk_bytes}) must be at least block_size ({block_size})")

        self.block_size: int = block_size
        self.max_mem_blocks: int = max_mem_blocks
        self.max_disk_bytes: int = max_disk_bytes

        if cache_dir is None:
            base_dir = Path(__file__).resolve().parent.parent / "data" / "cache" / "range_blocks"
            self.cache_dir = base_dir
        else:
            self.cache_dir = Path(cache_dir)

        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Memory cache: OrderedDict[(collection, item_id, total_file_size, block_index), bytes]
        self._mem_cache: OrderedDict[Tuple[str, str, int, int], bytes] = OrderedDict()
        self._mem_lock = threading.Lock()

        # In-flight download deduplication: Dict[key, [threading.Lock, ref_count: int]]
        self._inflight_locks: Dict[Tuple[str, str, int, int], List[Any]] = {}
        self._inflight_meta_lock = threading.Lock()

        # Disk operation mutex (prevents concurrent pruning/replacing collisions)
        self._disk_lock = threading.Lock()

    def _get_block_path(self, collection: str, item_id: str, total_file_size: int, block_index: int) -> Path:
        """Generates a safe hierarchical disk path incorporating total_file_size."""
        safe_coll = re.sub(r"[^\w\-.]", "_", collection)
        safe_item = re.sub(r"[^\w\-.]", "_", item_id)
        block_dir = self.cache_dir / safe_coll / safe_item / f"size_{total_file_size}"
        block_dir.mkdir(parents=True, exist_ok=True)
        return block_dir / f"block_{block_index:06d}.bin"

    def _validate_block_size(self, data: bytes, block_index: int, total_file_size: int) -> bool:
        """Validates that block byte length matches expected size, especially the final block."""
        start = block_index * self.block_size
        end = min(total_file_size, start + self.block_size)
        expected_len = end - start
        return len(data) == expected_len

    def _validate_block_params(self, total_file_size: int, block_index: int) -> None:
        """Validates total_file_size and block_index bounds."""
        if total_file_size <= 0:
            raise ValueError(f"total_file_size must be positive, got {total_file_size}")
        if block_index < 0:
            raise ValueError(f"block_index cannot be negative, got {block_index}")

        max_valid_index = (total_file_size - 1) // self.block_size
        if block_index > max_valid_index:
            raise ValueError(
                f"block_index {block_index} out of range for total_file_size {total_file_size} "
                f"(max index is {max_valid_index})."
            )

    def _store_verified_block(
        self,
        cache_key: Tuple[str, str, int, int],
        block_path: Path,
        data: bytes
    ) -> None:
        """Atomically writes a validated block to disk, enforces disk cap, and updates memory LRU."""
        with self._disk_lock:
            temp_path = block_path.with_name(
                f"{block_path.stem}.{os.getpid()}_{threading.get_ident()}_{time.time_ns()}.tmp"
            )
            try:
                temp_path.write_bytes(data)
                os.replace(temp_path, block_path)
            finally:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception:
                        pass

            self._enforce_disk_limit()

        self._put_in_memory(cache_key, data)

    def put(
        self,
        collection: str,
        item_id: str,
        total_file_size: int,
        block_index: int,
        data: bytes
    ) -> None:
        """
        Stores an externally fetched block into both persistent disk cache and memory LRU.
        Validates block parameters and byte length before persisting.
        """
        self._validate_block_params(total_file_size, block_index)

        if not self._validate_block_size(data, block_index, total_file_size):
            start = block_index * self.block_size
            end = min(total_file_size, start + self.block_size)
            expected_len = end - start
            raise BhoonidhiStreamError(
                f"Block {block_index} has invalid length {len(data)} (expected {expected_len})."
            )

        cache_key = (collection, item_id, total_file_size, block_index)
        block_path = self._get_block_path(collection, item_id, total_file_size, block_index)
        self._store_verified_block(cache_key, block_path, data)

    def get_or_fetch(
        self,
        collection: str,
        item_id: str,
        total_file_size: int,
        block_index: int,
        fetch_fn
    ) -> Tuple[bytes, bool]:
        """
        Retrieves a block from memory or disk, or fetches it via fetch_fn if missing.
        Returns a tuple: (block_data: bytes, was_cache_hit: bool).
        Guarantees that concurrent requests for the same block execute fetch_fn exactly once.
        Safely removes in-flight lock entries upon completion.
        """
        self._validate_block_params(total_file_size, block_index)

        cache_key = (collection, item_id, total_file_size, block_index)

        # 1. Fast path: check memory cache
        with self._mem_lock:
            if cache_key in self._mem_cache:
                self._mem_cache.move_to_end(cache_key)
                return self._mem_cache[cache_key], True

        # 2. Fast path: check disk cache
        block_path = self._get_block_path(collection, item_id, total_file_size, block_index)
        if block_path.exists():
            try:
                data = block_path.read_bytes()
                if self._validate_block_size(data, block_index, total_file_size):
                    self._put_in_memory(cache_key, data)
                    block_path.touch(exist_ok=True)
                    return data, True
                else:
                    logger.warning(
                        f"Corrupted block file {block_path.name} (size mismatch). Removing..."
                    )
                    with self._disk_lock:
                        block_path.unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed reading disk block {block_path}: {e}")
                with self._disk_lock:
                    block_path.unlink(missing_ok=True)

        # 3. Slow path: Acquire reference-counted in-flight lock for this block
        with self._inflight_meta_lock:
            if cache_key not in self._inflight_locks:
                self._inflight_locks[cache_key] = [threading.Lock(), 1]
            else:
                self._inflight_locks[cache_key][1] += 1
            block_entry = self._inflight_locks[cache_key]

        block_lock = block_entry[0]

        try:
            with block_lock:
                # Re-check memory cache inside lock (another thread may have finished fetching)
                with self._mem_lock:
                    if cache_key in self._mem_cache:
                        self._mem_cache.move_to_end(cache_key)
                        return self._mem_cache[cache_key], True

                # Re-check disk cache inside lock
                if block_path.exists():
                    try:
                        data = block_path.read_bytes()
                        if self._validate_block_size(data, block_index, total_file_size):
                            self._put_in_memory(cache_key, data)
                            return data, True
                    except Exception:
                        pass

                # Cache Miss: Execute fetch_fn (runs network request)
                logger.info(
                    f"[BlockCache] Cache MISS for {item_id} [block {block_index}]. Fetching from upstream..."
                )
                data = fetch_fn(block_index)

                # Validate fetched data length
                if not self._validate_block_size(data, block_index, total_file_size):
                    start = block_index * self.block_size
                    end = min(total_file_size, start + self.block_size)
                    expected_len = end - start
                    raise BhoonidhiStreamError(
                        f"Fetched block {block_index} has invalid length {len(data)} (expected {expected_len})."
                    )

                # Persist to disk atomically and place in memory cache
                self._store_verified_block(cache_key, block_path, data)
                return data, False

        finally:
            # Safely decrement reference count and remove in-flight lock entry
            with self._inflight_meta_lock:
                block_entry[1] -= 1
                if block_entry[1] <= 0:
                    self._inflight_locks.pop(cache_key, None)

    def _put_in_memory(self, cache_key: Tuple[str, str, int, int], data: bytes):
        """Stores block in memory LRU cache, evicting oldest if count exceeds max_mem_blocks."""
        with self._mem_lock:
            self._mem_cache[cache_key] = data
            self._mem_cache.move_to_end(cache_key)
            while len(self._mem_cache) > self.max_mem_blocks:
                self._mem_cache.popitem(last=False)

    def _enforce_disk_limit(self):
        """Scans disk cache and prunes oldest accessed files if total exceeds max_disk_bytes."""
        try:
            bin_files = list(self.cache_dir.glob("*/*/*/*.bin"))
            total_bytes = sum(f.stat().st_size for f in bin_files)

            if total_bytes <= self.max_disk_bytes:
                return

            logger.info(
                f"[BlockCache] Disk cache exceeded {self.max_disk_bytes / 1e6:.1f} MB "
                f"(current: {total_bytes / 1e6:.1f} MB). Pruning oldest blocks..."
            )

            # Sort files by modification time (oldest first)
            bin_files.sort(key=lambda f: f.stat().st_mtime)

            target_bytes = int(self.max_disk_bytes * 0.85)  # Prune down to 85%
            for f in bin_files:
                if total_bytes <= target_bytes:
                    break
                try:
                    f_size = f.stat().st_size
                    f.unlink(missing_ok=True)
                    total_bytes -= f_size
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Error during disk cache pruning: {e}")


# Singleton block cache shared across application
global_block_cache = BhoonidhiBlockCache()


# =============================================================================
# 3. Seekable Remote HDF5 Stream Adapter (io.RawIOBase)
# =============================================================================

class BhoonidhiRangeStream(io.RawIOBase):
    """
    Seekable, read-only binary stream compatible with h5py's fileobj driver.
    Intercepts seek() and read()/readinto() calls, mapping requested byte ranges
    onto fixed 8 MB blocks backed by BhoonidhiBlockCache and BhoonidhiRateLimiter.

    Guarantees:
    - Never reads or downloads the complete file.
    - Requires HTTP 206 Partial Content on every upstream request.
    - Strict Content-Range validation (start, end, and exact total size; wildcards rejected).
    - Validates Content-Length header against requested span when supplied.
    - Robust socket read loop reading exact byte count or raising on unexpected EOF.
    - Aborts immediately on HTTP 200, 412, or 429.
    - Memory protection limiting individual read sizes to 32 MB max.
    - Thread-safe telemetry tracking for bytes served, remote bytes fetched, and cache efficiency.
    - Safe close() behavior failing all subsequent I/O operations.
    """

    def __init__(
        self,
        item_id: str,
        total_size: Optional[int] = None,
        collection: Optional[str] = None,
        cache: Optional[BhoonidhiBlockCache] = None,
        rate_limiter: Optional[BhoonidhiRateLimiter] = None,
        timeout: Optional[float] = None,
        max_429_retries: int = 0
    ):
        super().__init__()
        if not item_id or not item_id.strip():
            raise ValueError("item_id must be a non-empty string.")
        if max_429_retries < 0:
            raise ValueError(f"max_429_retries must be non-negative, got {max_429_retries}.")

        self.item_id: str = item_id.strip()
        self.collection: str = collection or settings.DEFAULT_COLLECTION
        self.cache: BhoonidhiBlockCache = cache or global_block_cache
        self.rate_limiter: BhoonidhiRateLimiter = rate_limiter or global_download_rate_limiter
        self.timeout: float = float(timeout or settings.BHOONIDHI_TIMEOUT_SECONDS)
        self.max_429_retries: int = int(max_429_retries)

        # Stream cursor and state
        self._cursor: int = 0
        self._closed: bool = False
        self._lock = threading.RLock()

        # Telemetry metrics (all accessed under self._lock)
        self.bytes_served: int = 0
        self.bytes_read_remote: int = 0
        self.upstream_requests_made: int = 0
        self.cache_hits: int = 0
        self.cache_misses: int = 0

        if total_size is not None:
            if total_size <= 0:
                raise ValueError(f"total_size must be positive, got {total_size}.")
            self.total_size: int = total_size
        else:
            # Dynamic discovery via first HTTP Range request (bytes=0-{block_size - 1})
            self.total_size = self._discover_size_and_prime_cache()

    @classmethod
    def open(
        cls,
        item_id: str,
        collection: Optional[str] = None,
        cache: Optional[BhoonidhiBlockCache] = None,
        rate_limiter: Optional[BhoonidhiRateLimiter] = None,
        timeout: Optional[float] = None,
        max_429_retries: int = 0
    ) -> "BhoonidhiRangeStream":
        """
        Factory helper that opens a BhoonidhiRangeStream with dynamic total file
        size discovery via the first HTTP Range request.
        """
        return cls(
            item_id=item_id,
            total_size=None,
            collection=collection,
            cache=cache,
            rate_limiter=rate_limiter,
            timeout=timeout,
            max_429_retries=max_429_retries
        )

    # -------------------------------------------------------------------------
    # Stream Properties & Capabilities
    # -------------------------------------------------------------------------

    @property
    def closed(self) -> bool:
        with self._lock:
            return self._closed

    def readable(self) -> bool:
        with self._lock:
            return not self._closed

    def seekable(self) -> bool:
        with self._lock:
            return not self._closed

    def writable(self) -> bool:
        return False

    def tell(self) -> int:
        with self._lock:
            if self._closed:
                raise ValueError("I/O operation on closed BhoonidhiRangeStream.")
            return self._cursor

    # -------------------------------------------------------------------------
    # Positioning
    # -------------------------------------------------------------------------

    def seek(self, offset: int, whence: int = os.SEEK_SET) -> int:
        """
        Positions stream cursor without performing any network I/O.
        Supports SEEK_SET (0), SEEK_CUR (1), and SEEK_END (2).
        Fails if stream is closed.
        """
        with self._lock:
            if self._closed:
                raise ValueError("I/O operation on closed BhoonidhiRangeStream.")

            if whence == os.SEEK_SET:
                target = offset
            elif whence == os.SEEK_CUR:
                target = self._cursor + offset
            elif whence == os.SEEK_END:
                target = self.total_size + offset
            else:
                raise ValueError(f"Unsupported whence: {whence}")

            if target < 0:
                raise ValueError(f"Negative seek position: {target}")

            self._cursor = target
            return self._cursor

    # -------------------------------------------------------------------------
    # Reading Data
    # -------------------------------------------------------------------------

    def readinto(self, b) -> int:
        """
        Reads bytes directly into pre-allocated buffer b (bytearray or memoryview).
        Essential for h5py's C-level fileobj driver.
        Fails if stream is closed or if requested buffer exceeds safe memory limit.
        """
        with self._lock:
            if self._closed:
                raise ValueError("I/O operation on closed BhoonidhiRangeStream.")

            buf_len = len(b)
            if buf_len > MAX_SINGLE_READ_BYTES:
                raise BhoonidhiStreamError(
                    f"Requested readinto buffer size ({buf_len} bytes) exceeds maximum "
                    f"safe allocation limit ({MAX_SINGLE_READ_BYTES} bytes)."
                )

            if self._cursor >= self.total_size:
                return 0

            to_read = min(buf_len, self.total_size - self._cursor)
            if to_read <= 0:
                return 0

            data = self._read_range_locked(self._cursor, to_read)
            read_len = len(data)
            b[:read_len] = data
            self._cursor += read_len
            self.bytes_served += read_len
            return read_len

    def read(self, size: int = -1) -> bytes:
        """
        Reads up to size bytes from current stream position.
        Prevents unbounded reads (size < 0 or None) and excessive memory allocations.
        """
        with self._lock:
            if self._closed:
                raise ValueError("I/O operation on closed BhoonidhiRangeStream.")

        if size is None or size < 0:
            raise BhoonidhiStreamError(
                "Unbounded read() is prohibited on remote NISAR HDF5 stream. "
                "Explicit chunk/metadata size is required to prevent full file transfer."
            )

        if size > MAX_SINGLE_READ_BYTES:
            raise BhoonidhiStreamError(
                f"Requested read size ({size} bytes) exceeds maximum safe single read "
                f"allocation ({MAX_SINGLE_READ_BYTES} bytes)."
            )

        buf = bytearray(size)
        n = self.readinto(buf)
        return bytes(buf[:n])

    # -------------------------------------------------------------------------
    # Range Mapping & Upstream Fetching
    # -------------------------------------------------------------------------

    def _read_range_locked(self, offset: int, size: int) -> bytes:
        """
        Internal range reader called while holding self._lock.
        Maps byte range [offset, offset + size) onto 8 MB cache blocks.
        """
        block_size = self.cache.block_size
        first_block = offset // block_size
        last_block = (offset + size - 1) // block_size

        result = bytearray()
        bytes_needed = size

        for b_idx in range(first_block, last_block + 1):
            if bytes_needed <= 0:
                break

            def fetch_block(idx: int) -> bytes:
                return self._fetch_remote_block(idx)

            block_data, was_hit = self.cache.get_or_fetch(
                collection=self.collection,
                item_id=self.item_id,
                total_file_size=self.total_size,
                block_index=b_idx,
                fetch_fn=fetch_block
            )

            if was_hit:
                self.cache_hits += 1
            else:
                self.cache_misses += 1

            block_start_byte = b_idx * block_size
            slice_start = max(0, offset - block_start_byte)
            slice_end = min(len(block_data), offset + bytes_needed - block_start_byte)

            chunk = block_data[slice_start:slice_end]
            result.extend(chunk)

            offset += len(chunk)
            bytes_needed -= len(chunk)

        return bytes(result)

    def _discover_size_and_prime_cache(self) -> int:
        """
        Discovers total remote HDF5 file size by requesting block 0 (Range: bytes=0-{block_size - 1}).
        - Acquires the shared global_download_rate_limiter.
        - Strictly validates HTTP 206, Content-Range (no wildcard '*'), and Content-Length.
        - Stores block 0 directly in the block cache under the discovered total size
          so subsequent reads hit cache without a duplicate request.
        Returns the discovered positive total file size in bytes.
        """
        first_block_end = self.cache.block_size - 1
        data, discovered_total = self._execute_range_request(
            start_byte=0,
            end_byte=first_block_end,
            expected_total_size=None
        )
        self.cache.put(
            collection=self.collection,
            item_id=self.item_id,
            total_file_size=discovered_total,
            block_index=0,
            data=data
        )
        logger.info(
            f"[RangeStream] Discovered total size {discovered_total} bytes for '{self.item_id}' "
            f"and cached block 0 ({len(data)} bytes)."
        )
        return discovered_total

    def _fetch_remote_block(self, block_index: int) -> bytes:
        """Executes a single HTTP Range request for block_index against a known total_size."""
        start_byte = block_index * self.cache.block_size
        end_byte = min(self.total_size - 1, start_byte + self.cache.block_size - 1)
        data, _ = self._execute_range_request(
            start_byte=start_byte,
            end_byte=end_byte,
            expected_total_size=self.total_size
        )
        return data

    def _execute_range_request(
        self,
        start_byte: int,
        end_byte: int,
        expected_total_size: Optional[int] = None
    ) -> Tuple[bytes, int]:
        """
        Shared HTTP Range requester used by both size discovery and block fetches.
        Enforces global rate limiter, Retry-After cooldowns, and bounded HTTP 429 retries.
        """
        max_attempts = self.max_429_retries + 1
        for attempt in range(max_attempts):
            try:
                return self._execute_single_range_attempt(
                    start_byte=start_byte,
                    end_byte=end_byte,
                    expected_total_size=expected_total_size,
                )
            except _RetryableHTTP429 as retry_exc:
                if attempt >= self.max_429_retries or retry_exc.cooldown > MAX_429_COOLDOWN_SECONDS:
                    raise BhoonidhiStreamRateLimitError(
                        "Bhoonidhi download rate limit reached (HTTP 429). Max 2 requests per minute permitted."
                    ) from retry_exc
                logger.warning(
                    f"[RangeStream] Retrying byte range {start_byte}-{end_byte} for '{self.item_id}' "
                    f"(attempt {attempt + 2}/{max_attempts}) after {retry_exc.cooldown:.1f}s global cooldown..."
                )
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as net_err:
                if attempt >= self.max_429_retries:
                    raise BhoonidhiStreamError(f"Network error during HTTP Range fetch: {str(net_err)}") from net_err
                backoff = 5.0 * (attempt + 1)
                logger.warning(
                    f"[RangeStream] Transient network error ({type(net_err).__name__}) fetching {start_byte}-{end_byte}. "
                    f"Retrying in {backoff:.1f}s (attempt {attempt + 2}/{max_attempts})..."
                )
                time.sleep(backoff)
            except _RetryableHTTP5xx as server_err:
                if attempt >= self.max_429_retries:
                    raise BhoonidhiStreamError(
                        f"Bhoonidhi download endpoint returned unexpected status HTTP {server_err.status_code}."
                    ) from server_err
                backoff = 10.0 * (attempt + 1)
                logger.warning(
                    f"[RangeStream] Upstream server error HTTP {server_err.status_code} on {start_byte}-{end_byte}. "
                    f"Retrying in {backoff:.1f}s (attempt {attempt + 2}/{max_attempts})..."
                )
                time.sleep(backoff)

        raise BhoonidhiStreamRateLimitError(
            "Bhoonidhi download rate limit reached (HTTP 429). Max 2 requests per minute permitted."
        )

    def _execute_single_range_attempt(
        self,
        start_byte: int,
        end_byte: int,
        expected_total_size: Optional[int] = None
    ) -> Tuple[bytes, int]:
        """Executes one rate-limited HTTP Range attempt and records completion/cooldown."""
        logger.info(
            f"[RangeStream] Requesting byte range {start_byte}-{end_byte} "
            f"for '{self.item_id}'..."
        )

        # 1. Refresh/fetch Bearer token BEFORE claiming the /download rate-limiter slot
        #    so token-refresh network latency cannot shrink /download spacing.
        token = bhoonidhi_service.get_valid_access_token()

        # 2. Enforce global rate limiter (waits outside lock, re-checks monotonic time on wake)
        acquire_timeout = max(
            120.0,
            self.timeout * 2,
            self.rate_limiter.get_time_until_next_allowed()
            + self.rate_limiter.effective_window
            + self.rate_limiter.min_interval
            + 30.0,
        )
        self.rate_limiter.acquire(timeout=acquire_timeout)

        url = f"{bhoonidhi_service.base_url}/download"
        params = {"id": self.item_id, "collection": self.collection}
        headers = {
            "Authorization": f"Bearer {token}",
            "Range": f"bytes={start_byte}-{end_byte}",
            "Accept-Encoding": "identity",
            "Accept": "*/*"
        }

        response = None
        cooldown_applied = False
        with self._lock:
            self.upstream_requests_made += 1

        try:
            response = requests.get(
                url,
                params=params,
                headers=headers,
                stream=True,
                allow_redirects=False,
                timeout=self.timeout
            )
            status = response.status_code

            # ABORT CONDITION: HTTP 200 (Server ignored Range, returning full file)
            if status == 200:
                raise BhoonidhiStreamError(
                    "Bhoonidhi server returned HTTP 200 (Full Content) instead of HTTP 206 (Partial Content). "
                    "Connection aborted immediately to prevent transferring the full 12.67 GB file."
                )

            # RATE LIMIT CONDITION: Apply global cooldown + Retry-After before retry/abort
            if status == 429:
                cooldown = self.rate_limiter.apply_http_429_cooldown(
                    response.headers.get("Retry-After")
                )
                cooldown_applied = True
                raise _RetryableHTTP429(cooldown)
            if status == 412:
                raise BhoonidhiStreamRateLimitError(
                    "Bhoonidhi precondition failed (HTTP 412). Concurrent download limit or unready product."
                )

            if status in (500, 502, 503, 504):
                raise _RetryableHTTP5xx(status)

            # ABORT CONDITION: Any other non-206 status
            if status != 206:
                raise BhoonidhiStreamError(
                    f"Bhoonidhi download endpoint returned unexpected status HTTP {status}."
                )

            # VALIDATE Content-Range HEADER (wildcards strictly rejected)
            cr_header = response.headers.get("Content-Range")
            if not cr_header:
                raise BhoonidhiStreamError(
                    "HTTP 206 response missing required 'Content-Range' header."
                )

            # Expected format: "bytes <start>-<end>/<total>" (digits only, no wildcard '*')
            match = re.match(r"^bytes\s+(\d+)-(\d+)/(\d+)$", cr_header.strip())
            if not match:
                raise BhoonidhiStreamError(
                    f"Invalid or wildcard Content-Range header from Bhoonidhi: '{cr_header}'. "
                    "Exact numeric total file size is required."
                )

            resp_start = int(match.group(1))
            resp_end = int(match.group(2))
            resp_total = int(match.group(3))

            if resp_total <= 0:
                raise BhoonidhiStreamError(
                    f"Content-Range reported invalid non-positive total file size: {resp_total}."
                )

            if expected_total_size is not None:
                if resp_total != expected_total_size:
                    raise BhoonidhiStreamError(
                        f"Content-Range total size mismatch: expected {expected_total_size}, got {resp_total}."
                    )
                expected_end = end_byte
            else:
                # In discovery mode, start_byte is 0; server clamps end at resp_total - 1 if file < block_size
                expected_end = min(resp_total - 1, end_byte)

            if resp_start != start_byte or resp_end != expected_end:
                raise BhoonidhiStreamError(
                    f"Content-Range byte span mismatch: expected {start_byte}-{expected_end}, got {resp_start}-{resp_end}."
                )

            expected_len = resp_end - resp_start + 1

            # VALIDATE Content-Length HEADER IF SUPPLIED
            cl_header = response.headers.get("Content-Length")
            if cl_header is not None:
                cl_str = str(cl_header).strip()
                if not cl_str.isdigit():
                    raise BhoonidhiStreamError(
                        f"Invalid Content-Length header from Bhoonidhi: '{cl_header}'."
                    )
                cl_val = int(cl_str)
                if cl_val != expected_len:
                    raise BhoonidhiStreamError(
                        f"Content-Length mismatch: expected {expected_len} bytes, header reported {cl_val}."
                    )

            # ROBUST STREAM READ: Read until expected_len is received or EOF occurs
            chunks = []
            bytes_received = 0
            while bytes_received < expected_len:
                chunk_to_read = min(65536, expected_len - bytes_received)
                try:
                    chunk = response.raw.read(chunk_to_read, decode_content=False)
                except TypeError:
                    chunk = response.raw.read(chunk_to_read)
                if not chunk:
                    break
                chunks.append(chunk)
                bytes_received += len(chunk)

            data = b"".join(chunks)

            if len(data) != expected_len:
                raise BhoonidhiStreamError(
                    f"Short read from Bhoonidhi: received {len(data)} bytes, expected {expected_len}."
                )

            with self._lock:
                self.bytes_read_remote += len(data)

            return data, resp_total

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            raise
        except requests.exceptions.RequestException as e:
            raise BhoonidhiStreamError(f"Network error during HTTP Range fetch: {str(e)}") from e
        finally:
            if response is not None:
                try:
                    response.close()
                except Exception:
                    pass
            if not cooldown_applied:
                self.rate_limiter.record_completion()

    # -------------------------------------------------------------------------
    # Telemetry & Cleanup
    # -------------------------------------------------------------------------

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns thread-safe structured audit metrics for this stream instance."""
        with self._lock:
            saved_bytes = max(0, self.total_size - self.bytes_read_remote)
            pct_saved = (saved_bytes / self.total_size * 100.0) if self.total_size > 0 else 0.0

            return {
                "item_id": self.item_id,
                "collection": self.collection,
                "total_remote_size_bytes": self.total_size,
                "bytes_served_to_reader": self.bytes_served,
                "bytes_fetched_remote": self.bytes_read_remote,
                "upstream_requests_made": self.upstream_requests_made,
                "cache_hits": self.cache_hits,
                "cache_misses": self.cache_misses,
                "bandwidth_saved_bytes": saved_bytes,
                "bandwidth_saved_percent": round(pct_saved, 2),
                "is_closed": self._closed
            }

    def close(self):
        """Closes the stream. All subsequent I/O operations will fail."""
        with self._lock:
            self._closed = True
        super().close()
