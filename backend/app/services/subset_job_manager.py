"""
Persistent Background Job Manager for Remote NISAR Subset Extraction
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Coordinates asynchronous spatial subset extractions in a serialized background worker
(1 worker thread so jobs never race against the 35s Bhoonidhi rate limiter), persists
job state atomically to JSON on disk after every strip, detects interrupted jobs across
process restarts, and supports cooperative cancellation and cache-backed resumption.
"""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import threading
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from ..core.config import settings
from .bhoonidhi_stream import (
    BLOCK_SIZE,
    BhoonidhiRateLimiter,
    global_block_cache,
    global_download_rate_limiter,
)
from .nisar_subset import (
    DEFAULT_MIN_FREE_DISK_BYTES,
    DEFAULT_STRIP_ROWS,
    DEFAULT_SUBSET_CACHE_BYTES,
    DEFAULT_SUBSET_OUTPUT_DIR,
    NISARSubsetValidationError,
    check_available_disk_space,
    extract_nisar_subset,
    resolve_extraction_layers,
    resolve_projected_bounds,
)

logger = logging.getLogger("subset_job_manager")

DEFAULT_SUBSET_JOBS_DIR: Path = DEFAULT_SUBSET_OUTPUT_DIR / "_jobs"


class SubsetJobNotFoundError(Exception):
    """Raised when a requested subset job_id does not exist."""


class SubsetJobStateError(Exception):
    """Raised when a state transition (e.g. resume/cancel) is invalid for the job's state."""


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sanitize_id(value: str) -> str:
    return "".join(c if (c.isalnum() or c in "-_.") else "_" for c in value.strip())


class SubsetJobManager:
    """
    Thread-safe, disk-persisted manager for remote NISAR subset extraction jobs.
    """

    def __init__(
        self,
        jobs_dir: Optional[Union[str, Path]] = None,
        output_base_dir: Optional[Union[str, Path]] = None,
        cache_dir: Optional[Union[str, Path]] = None,
        rate_limiter: Optional[BhoonidhiRateLimiter] = None,
        min_free_disk_bytes: Optional[int] = None,
    ):
        self.jobs_dir: Path = Path(jobs_dir) if jobs_dir is not None else DEFAULT_SUBSET_JOBS_DIR
        self.output_base_dir: Path = Path(output_base_dir) if output_base_dir is not None else DEFAULT_SUBSET_OUTPUT_DIR
        self.cache_dir: Path = Path(cache_dir) if cache_dir is not None else global_block_cache.cache_dir
        self.rate_limiter: Optional[BhoonidhiRateLimiter] = rate_limiter
        self.min_free_disk_bytes: Optional[int] = min_free_disk_bytes

        self.jobs_dir.mkdir(parents=True, exist_ok=True)
        self.output_base_dir.mkdir(parents=True, exist_ok=True)

        self._lock = threading.RLock()
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="nisar_subset_worker")
        self._active_jobs: set = set()
        self._cancel_events: Dict[str, threading.Event] = {}

    def _job_path(self, job_id: str) -> Path:
        safe = _sanitize_id(job_id)
        return self.jobs_dir / f"{safe}.json"

    def _persist_job(self, job: Dict[str, Any]) -> None:
        job_path = self._job_path(job["job_id"])
        tmp_path = job_path.with_name(
            f"{job_path.stem}.{os.getpid()}_{threading.get_ident()}.tmp"
        )
        with self._lock:
            job["updated_at"] = _utc_now_iso()
            payload = json.dumps(job, indent=2)
            try:
                tmp_path.write_text(payload, encoding="utf-8")
                os.replace(tmp_path, job_path)
            finally:
                if tmp_path.exists():
                    try:
                        tmp_path.unlink()
                    except Exception:
                        pass

    def _load_job_raw(self, job_path: Path) -> Optional[Dict[str, Any]]:
        if not job_path.exists():
            return None
        try:
            job = json.loads(job_path.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning(f"Failed reading subset job file '{job_path}': {e}")
            return None

        # Detect jobs orphaned by a previous server process restart
        with self._lock:
            is_active = job.get("job_id") in self._active_jobs
            if job.get("status") in ("running", "queued") and not is_active:
                job["status"] = "interrupted"
                if not job.get("error"):
                    job["error"] = "Job was interrupted before completion (e.g. server restart). Resume to continue from cached blocks."
                self._persist_job(job)
        return job

    def get_job(self, job_id: str) -> Dict[str, Any]:
        with self._lock:
            job = self._load_job_raw(self._job_path(job_id))
            if job is None:
                raise SubsetJobNotFoundError(f"Subset extraction job '{job_id}' not found.")
            return job

    def list_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        with self._lock:
            for p in self.jobs_dir.glob("*.json"):
                loaded = self._load_job_raw(p)
                if loaded is not None:
                    jobs.append(loaded)
        jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)
        return jobs[:max(1, limit)]

    def create_and_start_job(
        self,
        item_id: str,
        collection: Optional[str] = None,
        frequency: str = "frequencyA",
        layers: Optional[List[str]] = None,
        include_exception_mask: bool = False,
        include_number_of_looks: bool = False,
        wgs84_bbox: Optional[List[float]] = None,
        projected_bounds: Optional[Tuple[float, float, float, float]] = None,
        cache_max_disk_bytes: int = DEFAULT_SUBSET_CACHE_BYTES,
        strip_rows: int = DEFAULT_STRIP_ROWS,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Synchronously validates inputs, study area bounds, layers, cache size,
        and free disk space before queueing the background extraction worker.
        """
        if not item_id or not item_id.strip():
            raise NISARSubsetValidationError("item_id must not be empty.")
        clean_item_id = item_id.strip()

        target_collection = collection or settings.DEFAULT_COLLECTION
        if target_collection not in settings.ALLOWED_COLLECTIONS:
            raise NISARSubsetValidationError(
                f"Collection '{target_collection}' is not supported. Allowed: {settings.ALLOWED_COLLECTIONS}"
            )

        if cache_max_disk_bytes < BLOCK_SIZE:
            raise NISARSubsetValidationError(
                f"cache_max_disk_bytes ({cache_max_disk_bytes}) must be at least 1 block ({BLOCK_SIZE} bytes)."
            )

        resolved_layers = resolve_extraction_layers(
            layers=layers,
            include_exception_mask=include_exception_mask,
            include_number_of_looks=include_number_of_looks,
        )
        effective_wgs84 = (
            list(wgs84_bbox)
            if (wgs84_bbox is not None and projected_bounds is None)
            else (list(settings.DEFAULT_MAJULI_BBOX) if projected_bounds is None else None)
        )
        resolved_proj = resolve_projected_bounds(
            wgs84_bbox=effective_wgs84,
            projected_bounds=projected_bounds,
        )

        job_id = f"subset_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:8]}"
        job_output_dir = self.output_base_dir / _sanitize_id(clean_item_id) / job_id
        job_output_dir.mkdir(parents=True, exist_ok=True)

        req_disk = (
            self.min_free_disk_bytes
            if self.min_free_disk_bytes is not None
            else min(DEFAULT_MIN_FREE_DISK_BYTES, int(cache_max_disk_bytes) + 512 * 1024 * 1024)
        )
        disk_status = check_available_disk_space([job_output_dir, self.cache_dir], req_disk)

        now = _utc_now_iso()
        job: Dict[str, Any] = {
            "job_id": job_id,
            "item_id": clean_item_id,
            "collection": target_collection,
            "frequency": frequency,
            "layers": resolved_layers,
            "include_exception_mask": "inputDataExceptionMask" in resolved_layers,
            "include_number_of_looks": "numberOfLooks" in resolved_layers,
            "wgs84_bbox": effective_wgs84,
            "projected_bounds": list(resolved_proj),
            "output_dir": str(job_output_dir),
            "cache_dir": str(self.cache_dir),
            "cache_max_disk_bytes": int(cache_max_disk_bytes),
            "strip_rows": int(strip_rows),
            "timeout": timeout,
            "disk_free_bytes_at_start": disk_status,
            "status": "queued",
            "created_at": now,
            "started_at": None,
            "updated_at": now,
            "completed_at": None,
            "total_file_size": None,
            "progress": {
                "progress_percent": 0.0,
                "current_layer": None,
                "status_message": "Queued for remote subset extraction.",
                "completed_rows": 0,
                "total_rows": 0,
                "completed_chunks": 0,
                "total_chunks": 0,
            },
            "window": None,
            "cost_estimate": None,
            "outputs": {},
            "telemetry": {
                "bytes_served_to_reader": 0,
                "bytes_fetched_remote": 0,
                "upstream_requests_made": 0,
                "cache_hits": 0,
                "cache_misses": 0,
            },
            "cumulative_telemetry": {
                "bytes_fetched_remote": 0,
                "upstream_requests_made": 0,
                "cache_hits": 0,
                "cache_misses": 0,
                "attempts": 0,
            },
            "error": None,
        }

        self._submit_job(job)
        return job

    def resume_job(self, job_id: str) -> Dict[str, Any]:
        """Resumes an interrupted, failed, or cancelled job using persisted outputs & cached blocks."""
        with self._lock:
            job = self.get_job(job_id)
            if job["status"] in ("queued", "running"):
                raise SubsetJobStateError(f"Job '{job_id}' is already {job['status']}.")
            if job["status"] == "completed":
                raise SubsetJobStateError(f"Job '{job_id}' is already completed.")

            job["status"] = "queued"
            job["error"] = None
            job["completed_at"] = None
            job["progress"]["status_message"] = "Re-queued for resumption from cached blocks."
            self._submit_job(job)
            return job

    def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """Requests cooperative cancellation for a queued or running job."""
        with self._lock:
            job = self.get_job(job_id)
            if job["status"] in ("completed", "failed", "cancelled"):
                raise SubsetJobStateError(f"Cannot cancel job '{job_id}' in state '{job['status']}'.")
            ev = self._cancel_events.get(job_id)
            if ev is not None:
                ev.set()
            job["progress"]["status_message"] = "Cancellation requested; halting at next chunk strip boundary."
            self._persist_job(job)
            return job

    def _submit_job(self, job: Dict[str, Any]) -> None:
        job_id = job["job_id"]
        with self._lock:
            cancel_ev = threading.Event()
            self._cancel_events[job_id] = cancel_ev
            self._active_jobs.add(job_id)
            self._persist_job(job)

        self._executor.submit(self._run_job_worker, job_id, cancel_ev)

    def _run_job_worker(self, job_id: str, cancel_ev: threading.Event) -> None:
        baseline_cum = {}
        try:
            with self._lock:
                job = self.get_job(job_id)
                if cancel_ev.is_set():
                    raise InterruptedError("Extraction job cancelled before start.")
                job["status"] = "running"
                if not job.get("started_at"):
                    job["started_at"] = _utc_now_iso()
                job["progress"]["status_message"] = "Initializing BhoonidhiRangeStream..."
                baseline_cum = dict(job.get("cumulative_telemetry") or {
                    "bytes_fetched_remote": 0,
                    "upstream_requests_made": 0,
                    "cache_hits": 0,
                    "cache_misses": 0,
                    "attempts": 0,
                })
                baseline_cum["attempts"] = int(baseline_cum.get("attempts", 0)) + 1
                self._persist_job(job)

            def _on_progress(snapshot: Dict[str, Any]) -> None:
                with self._lock:
                    cur = self._load_job_raw(self._job_path(job_id))
                    if cur is None:
                        return
                    telem = snapshot.get("telemetry") or {}
                    if not snapshot.get("final_cleanup"):
                        cur["progress"] = {
                            "progress_percent": snapshot.get("progress_percent", 0.0),
                            "current_layer": snapshot.get("current_layer"),
                            "status_message": snapshot.get("status_message", ""),
                            "completed_rows": snapshot.get("completed_rows", 0),
                            "total_rows": snapshot.get("total_rows", 0),
                            "completed_chunks": snapshot.get("completed_chunks", 0),
                            "total_chunks": snapshot.get("total_chunks", 0),
                        }
                    if snapshot.get("window"):
                        cur["window"] = snapshot["window"]
                    if snapshot.get("cost_estimate"):
                        cur["cost_estimate"] = snapshot["cost_estimate"]
                    if snapshot.get("completed_layers"):
                        cur["outputs"] = snapshot["completed_layers"]
                    if telem.get("total_remote_size_bytes"):
                        cur["total_file_size"] = telem["total_remote_size_bytes"]
                    cur["telemetry"] = telem
                    cur["cumulative_telemetry"] = {
                        "bytes_fetched_remote": baseline_cum["bytes_fetched_remote"] + int(telem.get("bytes_fetched_remote", 0)),
                        "upstream_requests_made": baseline_cum["upstream_requests_made"] + int(telem.get("upstream_requests_made", 0)),
                        "cache_hits": baseline_cum["cache_hits"] + int(telem.get("cache_hits", 0)),
                        "cache_misses": baseline_cum["cache_misses"] + int(telem.get("cache_misses", 0)),
                        "attempts": baseline_cum["attempts"],
                    }
                    self._persist_job(cur)

            result = extract_nisar_subset(
                item_id=job["item_id"],
                collection=job["collection"],
                frequency=job["frequency"],
                layers=job["layers"],
                projected_bounds=tuple(job["projected_bounds"]),
                output_dir=job["output_dir"],
                cache_dir=job["cache_dir"],
                cache_max_disk_bytes=job["cache_max_disk_bytes"],
                rate_limiter=self.rate_limiter or global_download_rate_limiter,
                timeout=job.get("timeout"),
                min_free_disk_bytes=self.min_free_disk_bytes,
                strip_rows=job["strip_rows"],
                progress_callback=_on_progress,
                cancel_event=cancel_ev,
                already_completed_outputs=job.get("outputs") or {},
                total_size=job.get("total_file_size"),
            )

            with self._lock:
                final_job = self._load_job_raw(self._job_path(job_id)) or job
                telem = result["telemetry"]
                final_job["status"] = "completed"
                final_job["completed_at"] = _utc_now_iso()
                final_job["total_file_size"] = telem.get("total_remote_size_bytes") or final_job.get("total_file_size")
                final_job["window"] = result["window"]
                final_job["cost_estimate"] = result["cost_estimate"]
                final_job["outputs"] = result["outputs"]
                final_job["telemetry"] = telem
                final_job["cumulative_telemetry"] = {
                    "bytes_fetched_remote": baseline_cum["bytes_fetched_remote"] + int(telem.get("bytes_fetched_remote", 0)),
                    "upstream_requests_made": baseline_cum["upstream_requests_made"] + int(telem.get("upstream_requests_made", 0)),
                    "cache_hits": baseline_cum["cache_hits"] + int(telem.get("cache_hits", 0)),
                    "cache_misses": baseline_cum["cache_misses"] + int(telem.get("cache_misses", 0)),
                    "attempts": baseline_cum["attempts"],
                }
                final_job["progress"]["progress_percent"] = 100.0
                final_job["progress"]["current_layer"] = None
                final_job["progress"]["status_message"] = "Completed all requested Majuli GeoTIFF layers."
                final_job["error"] = None
                self._persist_job(final_job)

        except InterruptedError as exc:
            with self._lock:
                cur = self._load_job_raw(self._job_path(job_id))
                if cur is not None:
                    cur["status"] = "cancelled"
                    cur["error"] = str(exc)
                    cur["progress"]["status_message"] = "Cancelled; progress and cached blocks preserved."
                    self._persist_job(cur)
        except Exception as exc:
            logger.exception(f"Subset extraction job '{job_id}' failed: {exc}")
            with self._lock:
                cur = self._load_job_raw(self._job_path(job_id))
                if cur is not None:
                    cur["status"] = "failed"
                    cur["error"] = str(exc)
                    cur["progress"]["status_message"] = f"Failed: {str(exc)}"
                    self._persist_job(cur)
        finally:
            with self._lock:
                self._active_jobs.discard(job_id)
                self._cancel_events.pop(job_id, None)

    def shutdown(self, wait: bool = True) -> None:
        self._executor.shutdown(wait=wait)


# Singleton background subset job manager for FastAPI endpoints
subset_job_manager = SubsetJobManager()

