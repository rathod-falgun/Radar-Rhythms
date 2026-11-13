"""
Brahmaputra FloodWatch — Water-Body Detection Engine
Implements scientifically grounded radar water extraction for NISAR Level 2 GCOV imagery.
Complies with NASA/ISRO SAR physics, CF metadata conventions, and WGS84/UTM 46N georeferencing.

Methodology:
1. Radiometric calibration check: linear gamma-0 power (m^2/m^2) converted to decibels (dB).
2. Data validity masking: NISAR mask + nodata + NaN filtering.
3. Adaptive Lee speckle filtering: suppress granular radar noise while preserving riverbank boundaries.
4. Adaptive bimodal Otsu thresholding: optimal separation of specular water mode from diffuse land mode.
5. Dual-polarization confirmation: cross-polarization HV backscatter suppresses bare soil false alarms.
6. Morphological MMU (Minimum Mapping Unit) cleaning: connected-component clustering eliminates speckle false positives.
7. Surface area calculation: pixel-level accounting in km^2 and hectares.
8. Georeferenced vector polygonization: produces WGS84 GeoJSON feature collections for GIS and map display.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.crs import CRS
# pyrefly: ignore[missing-import]
from rasterio.features import shapes
# pyrefly: ignore[missing-import]
from rasterio.transform import Affine
# pyrefly: ignore[missing-import]
from rasterio.warp import transform_geom
from scipy.ndimage import binary_closing, binary_opening, label, uniform_filter

logger = logging.getLogger("water_detector")

# SAR backscatter physics bounds for water in decibels (dB)
MIN_SAR_WATER_DB: float = -26.0
MAX_SAR_WATER_DB: float = -15.0
DEFAULT_WATER_THRESHOLD_DB: float = -18.5
EPSILON_LINEAR: float = 1e-7


def _win_path(path: Union[Path, str]) -> str:
    """Returns a Windows extended-length path string if on Windows and path is absolute."""
    p_str = os.fspath(path)
    if os.name == "nt" and os.path.isabs(p_str) and not p_str.startswith("\\\\?\\"):
        norm = os.path.normpath(p_str)
        if norm.startswith("\\\\"):
            return "\\\\?\\UNC\\" + norm[2:]
        return "\\\\?\\" + norm
    return p_str


def linear_to_db(linear_array: np.ndarray, eps: float = EPSILON_LINEAR) -> np.ndarray:
    """Converts linear radar backscatter (gamma-0 power) to decibels (dB)."""
    clipped = np.clip(linear_array, eps, None)
    return 10.0 * np.log10(clipped)


def apply_lee_filter(
    image_db: np.ndarray,
    valid_mask: np.ndarray,
    window_size: int = 5,
    noise_variance: float = 0.25,
) -> np.ndarray:
    """
    Applies adaptive Lee Speckle Filter to SAR backscatter imagery,
    preserving sharp water-land boundaries while smoothing speckle over open water and fields.
    """
    img = np.copy(image_db).astype(np.float64)
    # Fill invalid with mean to avoid edge divergence
    if np.any(valid_mask):
        valid_mean = float(np.mean(img[valid_mask]))
        img[~valid_mask] = valid_mean
    else:
        valid_mean = DEFAULT_WATER_THRESHOLD_DB

    eps = 1e-6
    local_mean = uniform_filter(img, size=window_size)
    local_sq_mean = uniform_filter(img**2, size=window_size)
    local_var = np.maximum(0.0, local_sq_mean - local_mean**2)

    weight = np.maximum(0.0, 1.0 - (noise_variance / (local_var + eps)))
    weight = np.minimum(1.0, weight)

    filtered = local_mean + weight * (img - local_mean)
    filtered[~valid_mask] = np.nan
    return filtered


def compute_otsu_threshold(
    image_db: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    bins: int = 120,
    min_db: float = MIN_SAR_WATER_DB,
    max_db: float = MAX_SAR_WATER_DB,
) -> float:
    """
    Computes optimal bimodal threshold on decibel SAR backscatter using Otsu's method.
    Separates the low-backscatter water mode from the high-backscatter land mode.
    Clamps the result to physically verified SAR water limits.
    """
    if valid_mask is not None:
        values = image_db[valid_mask & ~np.isnan(image_db)]
    else:
        values = image_db[~np.isnan(image_db)]

    if len(values) < 50:
        return DEFAULT_WATER_THRESHOLD_DB

    hist, bin_edges = np.histogram(values, bins=bins, range=(min_db - 5.0, max_db + 15.0))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0

    total = np.sum(hist)
    if total == 0:
        return DEFAULT_WATER_THRESHOLD_DB

    prob = hist / float(total)
    weight1 = np.cumsum(prob)
    weight2 = 1.0 - weight1

    mean_val = np.cumsum(prob * bin_centers)
    mean_total = mean_val[-1]

    valid_idx = (weight1 > 0.01) & (weight2 > 0.01)
    if not np.any(valid_idx):
        return DEFAULT_WATER_THRESHOLD_DB

    variance_between = np.zeros_like(prob)
    variance_between[valid_idx] = (
        (mean_total * weight1[valid_idx] - mean_val[valid_idx]) ** 2
    ) / (weight1[valid_idx] * weight2[valid_idx])

    optimal_idx = np.argmax(variance_between)
    threshold = float(bin_centers[optimal_idx])
    clamped = float(np.clip(threshold, min_db, max_db))
    return clamped


def apply_morphological_mmu(
    mask: np.ndarray,
    min_cluster_pixels: int = 5,
    struct_size: int = 3,
) -> np.ndarray:
    """
    Removes isolated single-pixel speckle noise using morphological opening,
    closes small interior gaps using closing, and eliminates clusters below
    the Minimum Mapping Unit (MMU) via connected component analysis.
    """
    struct = np.ones((struct_size, struct_size), dtype=bool)
    cleaned = binary_opening(mask, structure=struct)
    cleaned = binary_closing(cleaned, structure=struct)

    if min_cluster_pixels > 1:
        labeled, num_features = label(cleaned, structure=struct)
        if num_features > 0:
            sizes = np.bincount(labeled.ravel())
            too_small = sizes < min_cluster_pixels
            cleaned[too_small[labeled]] = False

    return cleaned


def extract_water_polygons(
    water_mask: np.ndarray,
    transform: Affine,
    source_crs: Union[CRS, str, int] = "EPSG:32646",
    min_area_m2: float = 500.0,
    simplify_tolerance: float = 0.0,
) -> Dict[str, Any]:
    """
    Vectorizes a binary water raster into a GeoJSON FeatureCollection in WGS84 (EPSG:4326),
    computing polygon surface area in m^2, hectares, and km^2.
    """
    src_crs = CRS.from_user_input(source_crs)
    px_area_m2 = abs(float(transform.a * transform.e))

    mask_uint8 = np.ascontiguousarray(water_mask.astype(np.uint8))
    shapes_gen = shapes(mask_uint8, mask=water_mask, transform=transform)

    features: List[Dict[str, Any]] = []
    feature_id = 1

    for geom, val in shapes_gen:
        if val != 1:
            continue

        # Approximate polygon area in projected coordinate space
        # Estimate from coordinate exterior ring or raster pixel count
        coords = geom.get("coordinates", [])
        if not coords or len(coords[0]) < 3:
            continue

        # Shoelace formula on outer ring
        ring = np.asarray(coords[0])
        x = ring[:, 0]
        y = ring[:, 1]
        raw_area_m2 = 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

        if raw_area_m2 < min_area_m2:
            continue

        # Reproject geometry to WGS84 (EPSG:4326) for universal web map display
        try:
            geom_4326 = transform_geom(src_crs, "EPSG:4326", geom)
        except Exception:
            geom_4326 = geom

        area_ha = round(raw_area_m2 / 10000.0, 3)
        area_km2 = round(raw_area_m2 / 1000000.0, 4)

        features.append({
            "type": "Feature",
            "id": feature_id,
            "geometry": geom_4326,
            "properties": {
                "feature_id": feature_id,
                "type": "water_body",
                "area_m2": round(raw_area_m2, 1),
                "area_ha": area_ha,
                "area_km2": area_km2,
            },
        })
        feature_id += 1

    return {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": features,
    }


def detect_water_from_geotiffs(
    hhhh_path: Union[Path, str],
    hvhv_path: Optional[Union[Path, str]] = None,
    mask_path: Optional[Union[Path, str]] = None,
    output_dir: Optional[Union[Path, str]] = None,
    threshold_db: Optional[float] = None,
    apply_speckle_filter: bool = True,
    min_cluster_pixels: int = 5,
) -> Dict[str, Any]:
    """
    Main entry point for Phase 2: Scientific SAR Water Detection.
    Reads input GeoTIFFs, performs calibration, masking, filtering,
    adaptive thresholding, and exports GeoTIFF water mask, GeoJSON polygons, and statistics.
    """
    hhhh_p = Path(hhhh_path)
    if not os.path.exists(_win_path(hhhh_p)):
        raise FileNotFoundError(f"HHHH GeoTIFF not found: {hhhh_path}")

    # Read HHHH
    with rasterio.open(_win_path(hhhh_p)) as src_hh:
        hh_raw = src_hh.read(1)
        profile = src_hh.profile.copy()
        transform = src_hh.transform
        crs = src_hh.crs
        nodata = src_hh.nodata
        height, width = hh_raw.shape

    # Read HVHV if provided
    hv_raw: Optional[np.ndarray] = None
    if hvhv_path and os.path.exists(_win_path(hvhv_path)):
        with rasterio.open(_win_path(hvhv_path)) as src_hv:
            hv_raw = src_hv.read(1)

    # Read NISAR mask if provided
    mask_raw: Optional[np.ndarray] = None
    if mask_path and os.path.exists(_win_path(mask_path)):
        with rasterio.open(_win_path(mask_path)) as src_m:
            mask_raw = src_m.read(1)

    # 1. Establish valid data mask
    valid_mask = np.isfinite(hh_raw) & (hh_raw > 0)
    if nodata is not None:
        valid_mask &= (hh_raw != nodata)

    if mask_raw is not None:
        # In NISAR GCOV, mask > 0 with 255 typically indicates valid data or mask==0
        # If mask is all 0, it means completely valid
        if np.any(mask_raw == 255):
            valid_mask &= (mask_raw != 255)
        elif np.all(mask_raw == 0):
            pass
        else:
            valid_mask &= (mask_raw > 0)

    # 2. Convert linear power to decibels
    hh_db = np.full_like(hh_raw, np.nan, dtype=np.float32)
    hh_db[valid_mask] = linear_to_db(hh_raw[valid_mask])

    # 3. Adaptive speckle filtering
    if apply_speckle_filter:
        hh_filtered = apply_lee_filter(hh_db, valid_mask, window_size=5)
    else:
        hh_filtered = hh_db

    # 4. Threshold determination
    if threshold_db is not None:
        optimal_threshold = float(threshold_db)
        method = "manual_user_specified"
    else:
        optimal_threshold = compute_otsu_threshold(hh_filtered, valid_mask)
        method = "adaptive_bimodal_otsu"

    # 5. Preliminary binary water classification
    water_binary = valid_mask & (hh_filtered <= optimal_threshold)

    # 6. Cross-polarization confirmation if HV is available
    if hv_raw is not None:
        hv_valid = np.isfinite(hv_raw) & (hv_raw > 0)
        hv_db = np.full_like(hv_raw, np.nan, dtype=np.float32)
        hv_db[hv_valid] = linear_to_db(hv_raw[hv_valid])
        # Open water has very low HV backscatter (depolarization minimal).
        # Reject pixels where HV is unusually high (e.g. > -15 dB) as likely dense vegetation
        water_binary &= ~(valid_mask & hv_valid & (hv_db > -15.0))

    # 7. Morphological cleaning & MMU filtering
    water_cleaned = apply_morphological_mmu(water_binary, min_cluster_pixels=min_cluster_pixels)

    # 8. Pixel & surface area metrics
    pixel_dx = abs(float(transform.a))
    pixel_dy = abs(float(transform.e))
    pixel_area_m2 = pixel_dx * pixel_dy

    total_pixels = int(height * width)
    valid_pixels = int(np.sum(valid_mask))
    water_pixels = int(np.sum(water_cleaned))
    land_pixels = valid_pixels - water_pixels

    water_area_m2 = float(water_pixels * pixel_area_m2)
    water_area_ha = round(water_area_m2 / 10000.0, 2)
    water_area_km2 = round(water_area_m2 / 1000000.0, 3)

    valid_area_km2 = round((valid_pixels * pixel_area_m2) / 1000000.0, 3)
    water_fraction_pct = round((water_pixels / valid_pixels * 100.0) if valid_pixels > 0 else 0.0, 2)

    # Decibel backscatter stats over water vs land
    hh_water_vals = hh_filtered[water_cleaned & np.isfinite(hh_filtered)]
    hh_land_vals = hh_filtered[valid_mask & (~water_cleaned) & np.isfinite(hh_filtered)]

    water_stats = {
        "hh_water_mean_db": round(float(np.mean(hh_water_vals)), 2) if len(hh_water_vals) > 0 else None,
        "hh_water_std_db": round(float(np.std(hh_water_vals)), 2) if len(hh_water_vals) > 0 else None,
        "hh_land_mean_db": round(float(np.mean(hh_land_vals)), 2) if len(hh_land_vals) > 0 else None,
        "hh_land_std_db": round(float(np.std(hh_land_vals)), 2) if len(hh_land_vals) > 0 else None,
    }

    # 9. Output directory setup
    out_dir = Path(output_dir) if output_dir else hhhh_p.parent
    os.makedirs(_win_path(out_dir), exist_ok=True)

    # 10. Write GeoTIFF water mask (0=land, 1=water, 255=nodata)
    water_raster = np.full((height, width), 255, dtype=np.uint8)
    water_raster[valid_mask & (~water_cleaned)] = 0
    water_raster[water_cleaned] = 1

    water_tif_path = out_dir / "water_classification.tif"
    profile.update({
        "driver": "GTiff",
        "count": 1,
        "dtype": "uint8",
        "nodata": 255,
        "compress": "deflate",
    })

    with rasterio.open(_win_path(water_tif_path), "w", **profile) as dst:
        dst.write(water_raster, 1)
        dst.set_band_description(1, "NISAR SAR Water Classification (0=Land, 1=Water, 255=NoData)")
        dst.update_tags(
            METHOD=method,
            THRESHOLD_DB=str(optimal_threshold),
            WATER_KM2=str(water_area_km2),
            WATER_HA=str(water_area_ha),
        )

    # 11. Extract and save vector boundaries (GeoJSON in EPSG:4326)
    geojson_features = extract_water_polygons(
        water_mask=water_cleaned,
        transform=transform,
        source_crs=crs,
        min_area_m2=pixel_area_m2 * min_cluster_pixels,
    )
    geojson_path = out_dir / "water_boundaries.geojson"
    with open(_win_path(geojson_path), "w", encoding="utf-8") as f:
        json.dump(geojson_features, f, indent=2)

    # 12. Summary documentation & statistics
    summary = {
        "status": "success",
        "methodology": {
            "algorithm": method,
            "threshold_db": optimal_threshold,
            "speckle_filter": "adaptive_lee" if apply_speckle_filter else "none",
            "min_cluster_pixels": min_cluster_pixels,
            "units": "linear gamma-0 converted to decibels (10*log10)",
        },
        "spatial_reference": {
            "crs": str(crs),
            "pixel_size_x_m": pixel_dx,
            "pixel_size_y_m": pixel_dy,
            "pixel_area_m2": pixel_area_m2,
            "raster_dimensions": [height, width],
        },
        "extent_metrics": {
            "total_raster_pixels": total_pixels,
            "valid_pixels": valid_pixels,
            "water_pixels": water_pixels,
            "land_pixels": land_pixels,
            "water_area_km2": water_area_km2,
            "water_area_ha": water_area_ha,
            "valid_area_km2": valid_area_km2,
            "water_coverage_percent": water_fraction_pct,
            "polygon_features_count": len(geojson_features["features"]),
        },
        "sar_statistics": water_stats,
        "outputs": {
            "water_mask_geotiff": str(water_tif_path),
            "water_boundaries_geojson": str(geojson_path),
        },
        "limitations": [
            "Smooth specular dry surfaces (e.g. smooth airport runways or calm sandbars) may occasionally display low backscatter similar to water.",
            "Flooded vegetation with emergent canopy exhibits double-bounce enhancement rather than specular attenuation.",
            "Steep terrain shadow can produce radar dark spots (minimized over Brahmaputra floodplain).",
            "Provides satellite-based flood monitoring and decision support, not official flood warnings or guaranteed ground-level gauges.",
        ],
    }

    summary_path = out_dir / "water_summary.json"
    with open(_win_path(summary_path), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary

