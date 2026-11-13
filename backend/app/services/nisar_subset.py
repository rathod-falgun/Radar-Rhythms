"""
Remote NISAR Level-2 GCOV Spatial Subset Extractor
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Extracts a geographic bounding-box subset (default: Majuli Island / DEFAULT_MAJULI_BBOX)
from a remote ~12.67 GB NISAR HDF5 container over Bhoonidhi HTTP Range requests without
downloading the full file or loading entire raster datasets into memory.

Key design guarantees:
- Reuses BhoonidhiRangeStream, BhoonidhiBlockCache, and global_download_rate_limiter.
- Uses a job-configurable BhoonidhiBlockCache (default 2.5 GB disk limit) sharing the
  range-block directory without altering global_block_cache's 500 MB default.
- Reads 1D coordinate vectors and 0-D scalar spacings accurately (handling descending
  yCoordinates and scalar dataset indexing ds[()]).
- Streams chunk-boundary-aligned row strips (512 rows) directly into tiled,
  deflate-compressed EPSG:32646 GeoTIFFs via rasterio, keeping peak RAM ~100 MB.
- Verifies available disk space and GeoTIFF georeferencing before transfer.
- Supports cooperative cancellation, persistent per-strip progress callbacks, and
  atomic per-layer completion (.tmp -> .tif) for safe job resumption.
"""

import logging
import os
import re
import shutil
import threading
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import h5py
import numpy as np
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.crs import CRS
# pyrefly: ignore[missing-import]
from rasterio.transform import from_origin
# pyrefly: ignore[missing-import]
from rasterio.warp import transform_bounds
# pyrefly: ignore[missing-import]
from rasterio.windows import Window

from ..core.config import settings
from .bhoonidhi_stream import (
    BLOCK_SIZE,
    BhoonidhiBlockCache,
    BhoonidhiRateLimiter,
    BhoonidhiRangeStream,
    BhoonidhiStreamError,
    global_block_cache,
    global_download_rate_limiter,
)

logger = logging.getLogger("nisar_subset")

# Subset extraction defaults
DEFAULT_SUBSET_CACHE_BYTES: int = int(2.5 * 1024 * 1024 * 1024)  # 2.5 GB
DEFAULT_STRIP_ROWS: int = 512
DEFAULT_SUBSET_OUTPUT_DIR: Path = (
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "output" / "subsets"
)

DEFAULT_EXTRACTION_LAYERS: Tuple[str, ...] = ("HHHH", "HVHV", "mask")
OPTIONAL_EXTRACTION_LAYERS: Tuple[str, ...] = ("inputDataExceptionMask", "numberOfLooks")
ALL_SUPPORTED_LAYERS: Tuple[str, ...] = DEFAULT_EXTRACTION_LAYERS + OPTIONAL_EXTRACTION_LAYERS

# Minimum free disk headroom when space cannot be estimated from dataset headers
DEFAULT_MIN_FREE_DISK_BYTES: int = int(3.0 * 1024 * 1024 * 1024)  # 3.0 GB


class NISARSubsetError(Exception):
    """Base error raised during remote NISAR subset extraction."""


class NISARSubsetValidationError(NISARSubsetError):
    """Raised when bounds, layers, coordinates, georeferencing, or disk checks fail."""


def _sanitize_name(value: str) -> str:
    return re.sub(r"[^\w\-.]", "_", value.strip())


def _win_path(path: Union[Path, str]) -> str:
    """Returns a Windows extended-length path string if on Windows and path is absolute."""
    p_str = os.fspath(path)
    if os.name == "nt" and os.path.isabs(p_str) and not p_str.startswith("\\\\?\\"):
        norm = os.path.normpath(p_str)
        if norm.startswith("\\\\"):
            return "\\\\?\\UNC\\" + norm[2:]
        return "\\\\?\\" + norm
    return p_str


def _safe_exists(path: Union[Path, str, None]) -> bool:
    if path is None:
        return False
    try:
        return os.path.exists(_win_path(path))
    except Exception:
        return False


def _safe_unlink(path: Union[Path, str, None]) -> bool:
    if path is None:
        return False
    try:
        w_path = _win_path(path)
        if os.path.exists(w_path):
            os.remove(w_path)
            return True
    except Exception:
        pass
    return False


def _safe_replace(src: Union[Path, str], dst: Union[Path, str]) -> None:
    w_src = _win_path(src)
    w_dst = _win_path(dst)
    if os.path.exists(w_dst):
        try:
            os.remove(w_dst)
        except Exception:
            pass
    os.replace(w_src, w_dst)


def resolve_extraction_layers(
    layers: Optional[List[str]] = None,
    include_exception_mask: bool = False,
    include_number_of_looks: bool = False,
) -> List[str]:
    """
    Resolves and validates the ordered list of HDF5 grid layers to extract.
    Default layers: HHHH, HVHV, mask.
    Optional layers (disabled by default): inputDataExceptionMask, numberOfLooks.
    """
    if layers is not None:
        if not layers:
            raise NISARSubsetValidationError("At least one extraction layer must be specified.")
        resolved: List[str] = []
        for layer in layers:
            if layer not in ALL_SUPPORTED_LAYERS:
                raise NISARSubsetValidationError(
                    f"Unsupported extraction layer '{layer}'. "
                    f"Supported layers: {list(ALL_SUPPORTED_LAYERS)}"
                )
            if layer not in resolved:
                resolved.append(layer)
        return resolved

    resolved = list(DEFAULT_EXTRACTION_LAYERS)
    if include_exception_mask:
        resolved.append("inputDataExceptionMask")
    if include_number_of_looks:
        resolved.append("numberOfLooks")
    return resolved


def resolve_projected_bounds(
    wgs84_bbox: Optional[List[float]] = None,
    projected_bounds: Optional[Tuple[float, float, float, float]] = None,
    target_epsg: int = 32646,
) -> Tuple[float, float, float, float]:
    """
    Resolves target bounds in projected coordinates (x_min, y_min, x_max, y_max).
    Uses projected_bounds directly if provided; otherwise transforms wgs84_bbox
    (defaulting to settings.DEFAULT_MAJULI_BBOX) from EPSG:4326 into EPSG:{target_epsg}.
    """
    if projected_bounds is not None:
        if len(projected_bounds) != 4:
            raise NISARSubsetValidationError("projected_bounds must have 4 values: [x_min, y_min, x_max, y_max].")
        x_min, y_min, x_max, y_max = [float(v) for v in projected_bounds]
        if not all(np.isfinite([x_min, y_min, x_max, y_max])):
            raise NISARSubsetValidationError("projected_bounds must contain finite numbers.")
        if x_min >= x_max or y_min >= y_max:
            raise NISARSubsetValidationError(
                f"Invalid projected_bounds ({x_min}, {y_min}, {x_max}, {y_max}): require x_min < x_max and y_min < y_max."
            )
        return (x_min, y_min, x_max, y_max)

    bbox = wgs84_bbox if wgs84_bbox is not None else list(settings.DEFAULT_MAJULI_BBOX)
    if len(bbox) != 4:
        raise NISARSubsetValidationError("wgs84_bbox must have 4 values: [west, south, east, north].")
    west, south, east, north = [float(v) for v in bbox]
    if west >= east or south >= north:
        raise NISARSubsetValidationError(
            f"Invalid WGS84 bbox [{west}, {south}, {east}, {north}]: require west < east and south < north."
        )

    dst_crs = CRS.from_epsg(target_epsg)
    px_min, py_min, px_max, py_max = transform_bounds("EPSG:4326", dst_crs, west, south, east, north)
    return (float(px_min), float(py_min), float(px_max), float(py_max))


def _nearest_existing_anchor(path: Path) -> Path:
    anchor = path.resolve()
    while not _safe_exists(anchor) and anchor != anchor.parent:
        anchor = anchor.parent
    return anchor


def check_available_disk_space(paths: List[Path], required_bytes: int) -> Dict[str, int]:
    """
    Verifies sufficient free disk space on every unique filesystem anchor used by
    cache and GeoTIFF outputs before initiating any upstream transfers.
    """
    if required_bytes < 0:
        raise NISARSubsetValidationError(f"required_bytes must be non-negative, got {required_bytes}")

    checked: Dict[str, int] = {}
    seen_anchors: Dict[str, Path] = {}
    for p in paths:
        anchor = _nearest_existing_anchor(p)
        drive_key = os.path.splitdrive(str(anchor))[0] or str(anchor)
        seen_anchors[drive_key] = anchor

    for drive_key, anchor in seen_anchors.items():
        usage = shutil.disk_usage(anchor)
        checked[drive_key or str(anchor)] = int(usage.free)
        if usage.free < required_bytes:
            raise NISARSubsetValidationError(
                f"Insufficient free disk space on '{anchor}': "
                f"available {usage.free / (1024 ** 3):.2f} GB, "
                f"required {required_bytes / (1024 ** 3):.2f} GB."
            )
    return checked


def read_grid_coordinates(freq_grp: h5py.Group) -> Dict[str, Any]:
    """
    Reads 1D xCoordinates, yCoordinates, 0-D scalar spacing datasets (via ds[()]),
    and EPSG projection code from a NISAR GCOV frequency group.
    """
    if "xCoordinates" not in freq_grp or "yCoordinates" not in freq_grp:
        raise NISARSubsetValidationError("Frequency group missing required 'xCoordinates' or 'yCoordinates' datasets.")

    x_coords = np.asarray(freq_grp["xCoordinates"][:], dtype=np.float64)
    y_coords = np.asarray(freq_grp["yCoordinates"][:], dtype=np.float64)

    def _read_scalar_spacing(name: str) -> Optional[float]:
        if name not in freq_grp:
            return None
        ds = freq_grp[name]
        raw = ds[()] if ds.shape == () else ds[0]
        return float(raw)

    dx = _read_scalar_spacing("xCoordinateSpacing")
    dy = _read_scalar_spacing("yCoordinateSpacing")

    if dx is None and len(x_coords) > 1:
        dx = float(x_coords[1] - x_coords[0])
    if dy is None and len(y_coords) > 1:
        dy = float(y_coords[1] - y_coords[0])

    epsg_code = 32646
    if "projection" in freq_grp:
        proj_ds = freq_grp["projection"]
        epsg_code = int(proj_ds.attrs.get("epsg_code", 32646))

    return {
        "x_coords": x_coords,
        "y_coords": y_coords,
        "dx": dx,
        "dy": dy,
        "epsg_code": epsg_code,
    }


def compute_subset_window(
    x_coords: np.ndarray,
    y_coords: np.ndarray,
    dx: Optional[float],
    dy: Optional[float],
    projected_bounds: Tuple[float, float, float, float],
    epsg_code: int = 32646,
) -> Dict[str, Any]:
    """
    Converts projected bounds (x_min, y_min, x_max, y_max) into verified row/column
    slices [r0:r1, c0:c1] and validates the pixel-center-adjusted GeoTIFF Affine transform.

    Handles descending yCoordinates (typical in north-up NISAR GCOV grids) as well as
    ascending yCoordinates, checking monotonic spacing and GeoTIFF corner accuracy.
    """
    if x_coords.ndim != 1 or y_coords.ndim != 1 or len(x_coords) < 2 or len(y_coords) < 2:
        raise NISARSubsetValidationError("Coordinate vectors must be 1D arrays with at least 2 entries each.")

    x_diffs = np.diff(x_coords)
    y_diffs = np.diff(y_coords)

    x_ascending = bool(np.all(x_diffs > 0))
    x_descending = bool(np.all(x_diffs < 0))
    y_ascending = bool(np.all(y_diffs > 0))
    y_descending = bool(np.all(y_diffs < 0))

    if not (x_ascending or x_descending):
        raise NISARSubsetValidationError("xCoordinates is not strictly monotonic.")
    if not (y_ascending or y_descending):
        raise NISARSubsetValidationError("yCoordinates is not strictly monotonic.")

    inferred_dx = float(np.median(x_diffs))
    inferred_dy = float(np.median(y_diffs))
    dx_val = float(dx) if dx is not None else inferred_dx
    dy_val = float(dy) if dy is not None else inferred_dy

    if abs(dx_val) <= 0 or abs(dy_val) <= 0:
        raise NISARSubsetValidationError(f"Invalid non-positive coordinate spacing magnitude: dx={dx_val}, dy={dy_val}")
    if not np.allclose(x_diffs, dx_val, rtol=1e-4, atol=1e-3):
        raise NISARSubsetValidationError("xCoordinates spacing is non-uniform or inconsistent with xCoordinateSpacing.")
    if not np.allclose(y_diffs, dy_val, rtol=1e-4, atol=1e-3):
        raise NISARSubsetValidationError("yCoordinates spacing is non-uniform or inconsistent with yCoordinateSpacing.")

    x_min_b, y_min_b, x_max_b, y_max_b = projected_bounds
    scene_x_min, scene_x_max = float(np.min(x_coords)), float(np.max(x_coords))
    scene_y_min, scene_y_max = float(np.min(y_coords)), float(np.max(y_coords))

    if x_max_b < scene_x_min or x_min_b > scene_x_max or y_max_b < scene_y_min or y_min_b > scene_y_max:
        raise NISARSubsetValidationError(
            f"Requested bounds X=[{x_min_b:.1f}, {x_max_b:.1f}], Y=[{y_min_b:.1f}, {y_max_b:.1f}] "
            f"do not overlap scene extent X=[{scene_x_min:.1f}, {scene_x_max:.1f}], "
            f"Y=[{scene_y_min:.1f}, {scene_y_max:.1f}]."
        )

    col_indices = np.where((x_coords >= x_min_b) & (x_coords <= x_max_b))[0]
    row_indices = np.where((y_coords >= y_min_b) & (y_coords <= y_max_b))[0]

    if len(col_indices) == 0 or len(row_indices) == 0:
        raise NISARSubsetValidationError(
            "Requested bounding box selects 0 pixels on the target coordinate grid."
        )

    c0, c1 = int(col_indices[0]), int(col_indices[-1]) + 1
    r0, r1 = int(row_indices[0]), int(row_indices[-1]) + 1

    # Ensure selection is contiguous
    if (c1 - c0) != len(col_indices) or (r1 - r0) != len(row_indices):
        raise NISARSubsetValidationError("Selected row/column indices are non-contiguous.")

    height = r1 - r0
    width = c1 - c0

    # GeoTIFF north-up Affine transform assumes row 0 is north (y decreasing with row index).
    # Verify yCoordinates orientation (if ascending, caller must flip rows or reject).
    if y_ascending:
        raise NISARSubsetValidationError(
            "Ascending yCoordinates orientation is not north-up; cannot emit north-up GeoTIFF without row inversion."
        )
    if x_descending:
        raise NISARSubsetValidationError(
            "Descending xCoordinates orientation is not west-to-east."
        )

    # Pixel-center to outer pixel-edge half-pixel adjustment
    px_w = abs(dx_val)
    px_h = abs(dy_val)
    x_west_edge = float(x_coords[c0]) - px_w / 2.0
    y_north_edge = float(y_coords[r0]) + px_h / 2.0

    crs = CRS.from_epsg(epsg_code)
    transform = from_origin(x_west_edge, y_north_edge, px_w, px_h)

    # Validate transform against actual HDF5 pixel centers at top-left and bottom-right
    tl_x, tl_y = transform @ (0.5, 0.5)
    br_x, br_y = transform @ (width - 0.5, height - 0.5)
    if abs(tl_x - float(x_coords[c0])) > 1e-3 or abs(tl_y - float(y_coords[r0])) > 1e-3:
        raise NISARSubsetValidationError(
            f"GeoTIFF top-left pixel-center check failed: got ({tl_x}, {tl_y}), expected ({x_coords[c0]}, {y_coords[r0]})."
        )
    if abs(br_x - float(x_coords[c1 - 1])) > 1e-3 or abs(br_y - float(y_coords[r1 - 1])) > 1e-3:
        raise NISARSubsetValidationError(
            f"GeoTIFF bottom-right pixel-center check failed: got ({br_x}, {br_y}), expected ({x_coords[c1 - 1]}, {y_coords[r1 - 1]})."
        )

    return {
        "row_start": r0,
        "row_end": r1,
        "col_start": c0,
        "col_end": c1,
        "height": height,
        "width": width,
        "dx": dx_val,
        "dy": dy_val,
        "epsg_code": epsg_code,
        "crs": crs.to_string(),
        "transform": transform,
        "transform_tuple": tuple(transform)[:6],
        "actual_bounds": {
            "x_min_edge": x_west_edge,
            "x_max_edge": x_west_edge + width * px_w,
            "y_min_edge": y_north_edge - height * px_h,
            "y_max_edge": y_north_edge,
            "x_center_min": float(x_coords[c0]),
            "x_center_max": float(x_coords[c1 - 1]),
            "y_center_min": float(y_coords[r1 - 1]),
            "y_center_max": float(y_coords[r0]),
        },
    }


def estimate_layer_cost(
    ds: h5py.Dataset,
    window: Dict[str, Any],
    block_size: int = BLOCK_SIZE,
) -> Dict[str, Any]:
    """
    Estimates chunk count or contiguous byte/block span for a single HDF5 dataset
    within the target spatial window without reading pixel data.
    """
    r0, r1 = window["row_start"], window["row_end"]
    c0, c1 = window["col_start"], window["col_end"]
    n_rows = r1 - r0
    n_cols = c1 - c0
    uncompressed_bytes = n_rows * n_cols * int(ds.dtype.itemsize)

    if ds.chunks is not None:
        ch_r, ch_c = int(ds.chunks[0]), int(ds.chunks[1])
        cr0, cr1 = r0 // ch_r, (r1 - 1) // ch_r
        cc0, cc1 = c0 // ch_c, (c1 - 1) // ch_c
        chunk_rows = cr1 - cr0 + 1
        chunk_cols = cc1 - cc0 + 1
        total_chunks = chunk_rows * chunk_cols

        full_chunk_rows = (ds.shape[0] + ch_r - 1) // ch_r
        full_chunk_cols = (ds.shape[1] + ch_c - 1) // ch_c
        full_chunks = full_chunk_rows * full_chunk_cols

        storage_bytes = 0
        try:
            storage_bytes = int(ds.id.get_storage_size())
        except Exception:
            pass

        est_payload_bytes = (
            int(storage_bytes * (total_chunks / full_chunks)) if storage_bytes > 0 and full_chunks > 0 else uncompressed_bytes
        )
        # Chunks in each chunk-row are contiguous across cc0..cc1, while rows are separated by swath strides.
        blocks_per_row = max(1, int(np.ceil((est_payload_bytes / max(1, chunk_rows)) / block_size)))
        est_blocks = chunk_rows * blocks_per_row if est_payload_bytes > block_size else max(1, int(np.ceil(est_payload_bytes / block_size)))
        return {
            "layout": "chunked",
            "chunks": [ch_r, ch_c],
            "compression": str(ds.compression) if ds.compression else None,
            "chunk_rows": chunk_rows,
            "chunk_cols": chunk_cols,
            "total_chunks": total_chunks,
            "estimated_payload_bytes": est_payload_bytes,
            "estimated_blocks_8mb": est_blocks,
            "output_uncompressed_bytes": uncompressed_bytes,
        }

    # Contiguous dataset
    row_stride_bytes = int(ds.shape[1]) * int(ds.dtype.itemsize)
    offset = None
    try:
        off = ds.id.get_offset()
        if off is not None and off >= 0:
            offset = int(off)
    except Exception:
        pass

    span_bytes = (r1 - r0 - 1) * row_stride_bytes + c1 * int(ds.dtype.itemsize)
    if offset is not None:
        b_start = (offset + r0 * row_stride_bytes) // block_size
        b_end = (offset + (r1 - 1) * row_stride_bytes + c1 * int(ds.dtype.itemsize) - 1) // block_size
        exact_blocks = int(b_end - b_start + 1)
    else:
        exact_blocks = max(1, int(np.ceil(span_bytes / block_size)))

    return {
        "layout": "contiguous",
        "chunks": None,
        "compression": None,
        "chunk_rows": None,
        "chunk_cols": None,
        "total_chunks": None,
        "estimated_payload_bytes": span_bytes,
        "estimated_blocks_8mb": exact_blocks,
        "output_uncompressed_bytes": uncompressed_bytes,
    }


def _layer_nodata_and_dtype(ds: h5py.Dataset, layer_name: str) -> Tuple[np.dtype, Any]:
    if layer_name in ("mask", "inputDataExceptionMask") or np.issubdtype(ds.dtype, np.unsignedinteger):
        return np.dtype("uint8"), 255
    return np.dtype("float32"), float("nan")


def extract_nisar_subset(
    item_id: str,
    collection: Optional[str] = None,
    frequency: str = "frequencyA",
    layers: Optional[List[str]] = None,
    include_exception_mask: bool = False,
    include_number_of_looks: bool = False,
    wgs84_bbox: Optional[List[float]] = None,
    projected_bounds: Optional[Tuple[float, float, float, float]] = None,
    output_dir: Optional[Union[str, Path]] = None,
    cache_dir: Optional[Union[str, Path]] = None,
    cache_max_disk_bytes: int = DEFAULT_SUBSET_CACHE_BYTES,
    rate_limiter: Optional[BhoonidhiRateLimiter] = None,
    timeout: Optional[float] = None,
    min_free_disk_bytes: Optional[int] = None,
    strip_rows: int = DEFAULT_STRIP_ROWS,
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    cancel_event: Optional[threading.Event] = None,
    already_completed_outputs: Optional[Dict[str, str]] = None,
    total_size: Optional[int] = None,
    max_429_retries: int = 2,
) -> Dict[str, Any]:
    """
    Extracts only the requested spatial window and selected layers from a remote NISAR HDF5
    file via BhoonidhiRangeStream, writing one georeferenced EPSG:32646 GeoTIFF per layer.

    Atomic output & resume semantics:
    - Each layer writes to `<layer>.tif.tmp` and renames to `<layer>.tif` only on completion.
    - If `already_completed_outputs` contains a layer whose final `.tif` already exists on disk
      with matching dimensions, that layer is skipped immediately (zero upstream work).
    """
    if not item_id or not item_id.strip():
        raise NISARSubsetValidationError("item_id must not be empty.")
    if strip_rows < 1:
        raise NISARSubsetValidationError(f"strip_rows must be >= 1, got {strip_rows}.")

    target_collection = collection or settings.DEFAULT_COLLECTION
    if target_collection not in settings.ALLOWED_COLLECTIONS:
        raise NISARSubsetValidationError(
            f"Collection '{target_collection}' is not supported. Allowed: {settings.ALLOWED_COLLECTIONS}"
        )

    target_layers = resolve_extraction_layers(
        layers=layers,
        include_exception_mask=include_exception_mask,
        include_number_of_looks=include_number_of_looks,
    )

    resolved_bounds = resolve_projected_bounds(
        wgs84_bbox=wgs84_bbox,
        projected_bounds=projected_bounds,
    )

    out_root = Path(output_dir) if output_dir is not None else (DEFAULT_SUBSET_OUTPUT_DIR / _sanitize_name(item_id))
    os.makedirs(_win_path(out_root), exist_ok=True)

    # Job-scoped block cache pointing to shared cache_dir (defaults to global cache directory)
    # without altering global_block_cache.max_disk_bytes (500 MB).
    effective_cache_dir = Path(cache_dir) if cache_dir is not None else global_block_cache.cache_dir
    job_cache = BhoonidhiBlockCache(
        cache_dir=effective_cache_dir,
        block_size=BLOCK_SIZE,
        max_disk_bytes=cache_max_disk_bytes,
    )
    effective_limiter = rate_limiter or global_download_rate_limiter

    # Pre-transfer disk space verification
    disk_requirement = min_free_disk_bytes if min_free_disk_bytes is not None else min(
        DEFAULT_MIN_FREE_DISK_BYTES,
        int(cache_max_disk_bytes) + 512 * 1024 * 1024,
    )
    disk_status = check_available_disk_space([out_root, effective_cache_dir], disk_requirement)

    stream = None
    h5_file = None
    outputs: Dict[str, str] = dict(already_completed_outputs or {})
    layer_costs: Dict[str, Any] = {}
    last_emitted_snapshot: Dict[str, Any] = {}

    try:
        stream = BhoonidhiRangeStream(
            item_id=item_id.strip(),
            total_size=total_size,
            collection=target_collection,
            cache=job_cache,
            rate_limiter=effective_limiter,
            timeout=timeout or settings.BHOONIDHI_TIMEOUT_SECONDS,
            max_429_retries=max_429_retries,
        )
        h5_file = h5py.File(stream, "r", driver="fileobj")

        science_grp = h5_file.get("science")
        if science_grp is None:
            raise NISARSubsetValidationError("Invalid NISAR HDF5: missing '/science' group.")
        instrument = "SSAR" if "SSAR" in science_grp else "LSAR"
        grids_grp = science_grp[instrument]["GCOV"]["grids"]
        if frequency not in grids_grp:
            raise NISARSubsetValidationError(
                f"Frequency '{frequency}' not found in HDF5 grids. Available: {list(grids_grp.keys())}"
            )
        freq_grp = grids_grp[frequency]

        # Validate target layers exist
        for layer_name in target_layers:
            if layer_name not in freq_grp:
                raise NISARSubsetValidationError(
                    f"Requested layer '{layer_name}' not found under '{frequency}'. "
                    f"Available: {list(freq_grp.keys())}"
                )

        # Read coordinates and verify bounds + GeoTIFF georeferencing
        coord_info = read_grid_coordinates(freq_grp)
        window = compute_subset_window(
            x_coords=coord_info["x_coords"],
            y_coords=coord_info["y_coords"],
            dx=coord_info["dx"],
            dy=coord_info["dy"],
            projected_bounds=resolved_bounds,
            epsg_code=coord_info["epsg_code"],
        )

        r0, r1 = window["row_start"], window["row_end"]
        c0, c1 = window["col_start"], window["col_end"]
        out_height = window["height"]
        out_width = window["width"]

        # Estimate costs and re-verify disk space against actual uncompressed output size
        total_est_output = 0
        total_est_blocks = 0
        for layer_name in target_layers:
            cost = estimate_layer_cost(freq_grp[layer_name], window, block_size=job_cache.block_size)
            layer_costs[layer_name] = cost
            total_est_output += cost["output_uncompressed_bytes"]
            total_est_blocks += cost["estimated_blocks_8mb"]

        if min_free_disk_bytes is None:
            check_available_disk_space([out_root], total_est_output + 128 * 1024 * 1024)

        total_rows_all_layers = out_height * len(target_layers)
        total_chunks_all_layers = sum(
            (c["total_chunks"] or 0) for c in layer_costs.values()
        )
        completed_rows_global = 0
        completed_chunks_global = 0

        def _emit_progress(current_layer: Optional[str], status_msg: str) -> None:
            telem = stream.get_telemetry()
            pct = (
                round(completed_rows_global / total_rows_all_layers * 100.0, 2)
                if total_rows_all_layers > 0
                else 100.0
            )
            snapshot = {
                "current_layer": current_layer,
                "status_message": status_msg,
                "progress_percent": min(100.0, pct),
                "completed_rows": completed_rows_global,
                "total_rows": total_rows_all_layers,
                "completed_chunks": completed_chunks_global,
                "total_chunks": total_chunks_all_layers,
                "completed_layers": dict(outputs),
                "window": {
                    "row_start": r0,
                    "row_end": r1,
                    "col_start": c0,
                    "col_end": c1,
                    "height": out_height,
                    "width": out_width,
                    "epsg_code": window["epsg_code"],
                    "actual_bounds": window["actual_bounds"],
                },
                "cost_estimate": {
                    "estimated_blocks_8mb": total_est_blocks,
                    "layers": layer_costs,
                },
                "telemetry": telem,
            }
            last_emitted_snapshot.clear()
            last_emitted_snapshot.update(snapshot)
            if progress_callback is not None:
                progress_callback(snapshot)

        _emit_progress(None, "Validated coordinates, GeoTIFF transform, and disk space.")

        for layer_name in target_layers:
            if cancel_event is not None and cancel_event.is_set():
                raise InterruptedError("Extraction job cancelled.")

            # Shorten output filenames to avoid repeating the long scene ID when parent dir already identifies the scene/job
            final_tif = out_root / f"{frequency}_{layer_name}.tif"
            tmp_tif = out_root / f"{frequency}_{layer_name}.tif.tmp"
            legacy_final = out_root / f"{_sanitize_name(item_id)}_{frequency}_{layer_name}.tif"
            legacy_tmp = out_root / f"{_sanitize_name(item_id)}_{frequency}_{layer_name}.tif.tmp"

            # Skip already-completed layer on resume if output GeoTIFF is valid
            existing_path = outputs.get(layer_name) or (
                str(final_tif) if _safe_exists(final_tif) else (str(legacy_final) if _safe_exists(legacy_final) else None)
            )
            if existing_path and _safe_exists(existing_path):
                try:
                    with rasterio.open(_win_path(existing_path)) as existing_ds:
                        if existing_ds.width == out_width and existing_ds.height == out_height:
                            outputs[layer_name] = str(existing_path)
                            completed_rows_global += out_height
                            completed_chunks_global += layer_costs[layer_name]["total_chunks"] or 0
                            _emit_progress(layer_name, f"Skipped already completed layer '{layer_name}'.")
                            continue
                except Exception:
                    pass

            ds = freq_grp[layer_name]
            np_dtype, nodata_val = _layer_nodata_and_dtype(ds, layer_name)

            # Pre-open cleanup of any orphaned or partial temporary file to prevent GDAL Delete failures
            _safe_unlink(tmp_tif)
            _safe_unlink(legacy_tmp)

            # Align strip height to HDF5 chunk height so each chunk row is decompressed once
            step_rows = int(ds.chunks[0]) if ds.chunks is not None else strip_rows
            chunk_cols_for_layer = layer_costs[layer_name]["chunk_cols"] or 0

            gtiff_kwargs: Dict[str, Any] = {
                "driver": "GTiff",
                "height": out_height,
                "width": out_width,
                "count": 1,
                "dtype": str(np_dtype),
                "crs": window["crs"],
                "transform": window["transform"],
                "nodata": nodata_val,
                "compress": "deflate",
            }
            if out_width >= 16 and out_height >= 16:
                gtiff_kwargs.update({
                    "tiled": True,
                    "blockxsize": min(512, (out_width // 16) * 16),
                    "blockysize": min(512, (out_height // 16) * 16),
                })

            try:
                with rasterio.open(_win_path(tmp_tif), "w", **gtiff_kwargs) as dst:
                    dst.set_band_description(1, f"NISAR {instrument} L2 GCOV {frequency}/{layer_name}")
                    dst.update_tags(
                        ITEM_ID=item_id,
                        COLLECTION=target_collection,
                        LAYER=layer_name,
                        EPSG=str(window["epsg_code"]),
                        MASK_VALID_RULE="mask > 0 and mask != 255" if layer_name == "mask" else "",
                    )

                    curr_r = r0
                    while curr_r < r1:
                        if cancel_event is not None and cancel_event.is_set():
                            raise InterruptedError("Extraction job cancelled.")

                        if ds.chunks is not None:
                            next_boundary = ((curr_r // step_rows) + 1) * step_rows
                            strip_end = min(r1, next_boundary)
                        else:
                            strip_end = min(r1, curr_r + step_rows)

                        strip_arr = np.asarray(ds[curr_r:strip_end, c0:c1], dtype=np_dtype)
                        win = Window(
                            col_off=0,
                            row_off=curr_r - r0,
                            width=out_width,
                            height=strip_end - curr_r,
                        )
                        dst.write(strip_arr, 1, window=win)

                        rows_done = strip_end - curr_r
                        completed_rows_global += rows_done
                        if ds.chunks is not None:
                            completed_chunks_global += chunk_cols_for_layer

                        _emit_progress(
                            layer_name,
                            f"Extracted {layer_name} rows {curr_r}:{strip_end} ({completed_rows_global}/{total_rows_all_layers} rows).",
                        )
                        curr_r = strip_end

                _safe_replace(tmp_tif, final_tif)
                outputs[layer_name] = str(final_tif)
                _emit_progress(layer_name, f"Completed GeoTIFF export for '{layer_name}'.")
            except Exception:
                _safe_unlink(tmp_tif)
                _safe_unlink(legacy_tmp)
                raise

        h5_file.close()
        h5_file = None
        stream.close()
        telemetry = stream.get_telemetry()

        return {
            "status": "completed",
            "item_id": item_id.strip(),
            "collection": target_collection,
            "frequency": frequency,
            "layers": target_layers,
            "cache_max_disk_bytes": cache_max_disk_bytes,
            "disk_free_bytes_at_start": disk_status,
            "window": {
                "row_start": r0,
                "row_end": r1,
                "col_start": c0,
                "col_end": c1,
                "height": out_height,
                "width": out_width,
                "dx": window["dx"],
                "dy": window["dy"],
                "epsg_code": window["epsg_code"],
                "crs": window["crs"],
                "transform_tuple": list(window["transform_tuple"]),
                "actual_bounds": window["actual_bounds"],
            },
            "cost_estimate": {
                "estimated_blocks_8mb": total_est_blocks,
                "layers": layer_costs,
            },
            "outputs": outputs,
            "telemetry": telemetry,
        }

    finally:
        if h5_file is not None:
            try:
                h5_file.close()
            except Exception:
                pass
        if stream is not None:
            try:
                stream.close()
            except Exception:
                pass
            if progress_callback is not None:
                try:
                    final_snapshot = dict(last_emitted_snapshot) if last_emitted_snapshot else {}
                    final_snapshot["final_cleanup"] = True
                    final_snapshot["telemetry"] = stream.get_telemetry()
                    progress_callback(final_snapshot)
                except Exception:
                    pass
