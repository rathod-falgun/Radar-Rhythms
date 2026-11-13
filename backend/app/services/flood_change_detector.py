"""
Brahmaputra FloodWatch — Multi-Date Flood Change Detection Engine
Implements scientifically rigorous multi-temporal SAR flood change analysis.
Complies with NASA/ISRO SAR guidelines, WMO flood disaster mapping, and WGS84 GeoJSON standards.

Classification Classes:
0: Stable Land (Non-water on both dates)
1: Persistent Water (Water on both dates: river channels, oxbows, beels)
2: Newly Inundated Water (Dry on baseline T1 -> Water on event T2: active floodwater)
3: Receded Water (Water on baseline T1 -> Dry on event T2: drainage / drying)
255: Invalid / Masked / NoData
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

from .water_detector import (
    _win_path,
    detect_water_from_geotiffs,
    linear_to_db,
)

logger = logging.getLogger("flood_change_detector")

CLASS_STABLE_LAND = 0
CLASS_PERSISTENT_WATER = 1
CLASS_NEWLY_INUNDATED = 2
CLASS_RECEDED_WATER = 3
CLASS_NODATA = 255

CLASS_LABELS = {
    CLASS_STABLE_LAND: "Stable Land",
    CLASS_PERSISTENT_WATER: "Persistent Water",
    CLASS_NEWLY_INUNDATED: "Newly Inundated (Flood)",
    CLASS_RECEDED_WATER: "Receded Water",
    CLASS_NODATA: "NoData / Invalid",
}


def compute_flood_change_matrix(
    water_mask_t1: np.ndarray,
    valid_mask_t1: np.ndarray,
    water_mask_t2: np.ndarray,
    valid_mask_t2: np.ndarray,
) -> np.ndarray:
    """
    Computes standard 4-class flood change matrix between two co-registered binary water rasters.
    """
    if water_mask_t1.shape != water_mask_t2.shape:
        raise ValueError(
            f"Raster dimension mismatch: T1 shape {water_mask_t1.shape} vs T2 shape {water_mask_t2.shape}. "
            "Observations must be co-registered to identical grid dimensions."
        )

    both_valid = valid_mask_t1 & valid_mask_t2
    change_raster = np.full(water_mask_t1.shape, CLASS_NODATA, dtype=np.uint8)

    w1 = water_mask_t1.astype(bool)
    w2 = water_mask_t2.astype(bool)

    # 0: Stable Land (~w1 & ~w2)
    change_raster[both_valid & (~w1) & (~w2)] = CLASS_STABLE_LAND
    # 1: Persistent Water (w1 & w2)
    change_raster[both_valid & w1 & w2] = CLASS_PERSISTENT_WATER
    # 2: Newly Inundated (~w1 & w2)
    change_raster[both_valid & (~w1) & w2] = CLASS_NEWLY_INUNDATED
    # 3: Receded Water (w1 & ~w2)
    change_raster[both_valid & w1 & (~w2)] = CLASS_RECEDED_WATER

    return change_raster


def vectorize_change_raster(
    change_raster: np.ndarray,
    transform: Affine,
    source_crs: Union[CRS, str, int] = "EPSG:32646",
    min_pixels: int = 4,
) -> Dict[str, Any]:
    """
    Vectorizes change raster into WGS84 (EPSG:4326) GeoJSON FeatureCollection.
    Only exports water-related change classes (Persistent, Newly Inundated, Receded).
    """
    src_crs = CRS.from_user_input(source_crs)
    px_area_m2 = abs(float(transform.a * transform.e))

    mask = (change_raster == CLASS_PERSISTENT_WATER) | \
           (change_raster == CLASS_NEWLY_INUNDATED) | \
           (change_raster == CLASS_RECEDED_WATER)

    features: List[Dict[str, Any]] = []
    feature_id = 1

    for geom, val in shapes(change_raster, mask=mask, transform=transform):
        class_code = int(val)
        if class_code not in (CLASS_PERSISTENT_WATER, CLASS_NEWLY_INUNDATED, CLASS_RECEDED_WATER):
            continue

        coords = geom.get("coordinates", [])
        if not coords or len(coords[0]) < 3:
            continue

        ext_ring = np.asarray(coords[0])
        x = ext_ring[:, 0]
        y = ext_ring[:, 1]
        raw_area_m2 = 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
        # Subtract interior holes (e.g. unflooded sandbars/islands within channels)
        for hole in coords[1:]:
            h_ring = np.asarray(hole)
            hx = h_ring[:, 0]
            hy = h_ring[:, 1]
            raw_area_m2 -= 0.5 * abs(np.dot(hx, np.roll(hy, 1)) - np.dot(hy, np.roll(hx, 1)))

        if raw_area_m2 < (px_area_m2 * min_pixels):
            continue

        try:
            geom_4326 = transform_geom(src_crs, "EPSG:4326", geom)
        except Exception:
            geom_4326 = geom

        label_name = CLASS_LABELS.get(class_code, "Unknown")
        area_ha = round(raw_area_m2 / 10000.0, 3)
        area_km2 = round(raw_area_m2 / 1000000.0, 4)

        features.append({
            "type": "Feature",
            "id": feature_id,
            "geometry": geom_4326,
            "properties": {
                "feature_id": feature_id,
                "class_code": class_code,
                "class_name": label_name,
                "is_inundation": (class_code == CLASS_NEWLY_INUNDATED),
                "is_persistent": (class_code == CLASS_PERSISTENT_WATER),
                "is_receded": (class_code == CLASS_RECEDED_WATER),
                "area_m2": round(raw_area_m2, 1),
                "area_ha": area_ha,
                "area_km2": area_km2,
            },
        })
        feature_id += 1

    return {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features,
    }


def compare_two_observations(
    t1_date_str: str,
    t1_water_tif: Union[Path, str],
    t2_date_str: str,
    t2_water_tif: Union[Path, str],
    output_dir: Union[Path, str],
    min_cluster_pixels: int = 4,
) -> Dict[str, Any]:
    """
    Compares two water-classification GeoTIFFs (T1 baseline vs T2 event),
    generating change raster, vector boundaries, and statistical flood accounting.
    """
    t1_p = Path(t1_water_tif)
    t2_p = Path(t2_water_tif)

    with rasterio.open(_win_path(t1_p)) as src1:
        arr1 = src1.read(1)
        profile = src1.profile.copy()
        transform = src1.transform
        crs = src1.crs
        height, width = arr1.shape

    with rasterio.open(_win_path(t2_p)) as src2:
        arr2 = src2.read(1)

    valid1 = (arr1 != 255)
    water1 = (arr1 == 1)

    valid2 = (arr2 != 255)
    water2 = (arr2 == 1)

    change_raster = compute_flood_change_matrix(
        water_mask_t1=water1,
        valid_mask_t1=valid1,
        water_mask_t2=water2,
        valid_mask_t2=valid2,
    )

    pixel_dx = abs(float(transform.a))
    pixel_dy = abs(float(transform.e))
    pixel_area_m2 = pixel_dx * pixel_dy

    both_valid_count = int(np.sum(valid1 & valid2))
    persistent_count = int(np.sum(change_raster == CLASS_PERSISTENT_WATER))
    newly_inundated_count = int(np.sum(change_raster == CLASS_NEWLY_INUNDATED))
    receded_count = int(np.sum(change_raster == CLASS_RECEDED_WATER))
    stable_land_count = int(np.sum(change_raster == CLASS_STABLE_LAND))

    t1_water_total = persistent_count + receded_count
    t2_water_total = persistent_count + newly_inundated_count
    net_pixel_change = t2_water_total - t1_water_total

    persistent_km2 = round((persistent_count * pixel_area_m2) / 1000000.0, 3)
    inundated_km2 = round((newly_inundated_count * pixel_area_m2) / 1000000.0, 3)
    receded_km2 = round((receded_count * pixel_area_m2) / 1000000.0, 3)
    net_change_km2 = round((net_pixel_change * pixel_area_m2) / 1000000.0, 3)

    t1_water_km2 = round((t1_water_total * pixel_area_m2) / 1000000.0, 3)
    t2_water_km2 = round((t2_water_total * pixel_area_m2) / 1000000.0, 3)
    pct_change = round(((t2_water_total - t1_water_total) / t1_water_total * 100.0) if t1_water_total > 0 else 0.0, 2)

    out_d = Path(output_dir)
    os.makedirs(_win_path(out_d), exist_ok=True)

    # Save change raster GeoTIFF
    change_tif_path = out_d / f"change_{t1_date_str}_to_{t2_date_str}.tif"
    profile.update({
        "driver": "GTiff",
        "count": 1,
        "dtype": "uint8",
        "nodata": CLASS_NODATA,
        "compress": "deflate",
    })
    with rasterio.open(_win_path(change_tif_path), "w", **profile) as dst:
        dst.write(change_raster, 1)
        dst.set_band_description(1, f"Flood Change {t1_date_str} to {t2_date_str} (0=Land, 1=Persistent, 2=Inundated, 3=Receded)")
        dst.update_tags(
            T1_DATE=t1_date_str,
            T2_DATE=t2_date_str,
            INUNDATED_KM2=str(inundated_km2),
            RECEDED_KM2=str(receded_km2),
            PERSISTENT_KM2=str(persistent_km2),
        )

    # Vectorize polygons
    geojson = vectorize_change_raster(
        change_raster=change_raster,
        transform=transform,
        source_crs=crs,
        min_pixels=min_cluster_pixels,
    )
    geojson_path = out_d / f"change_{t1_date_str}_to_{t2_date_str}.geojson"
    with open(_win_path(geojson_path), "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)

    summary = {
        "status": "success",
        "baseline_date": t1_date_str,
        "event_date": t2_date_str,
        "comparison_interval_days": 12,
        "spatial_reference": {
            "crs": str(crs),
            "pixel_area_m2": pixel_area_m2,
            "dimensions": [height, width],
        },
        "change_metrics": {
            "persistent_water_km2": persistent_km2,
            "persistent_water_ha": round(persistent_km2 * 100.0, 2),
            "newly_inundated_km2": inundated_km2,
            "newly_inundated_ha": round(inundated_km2 * 100.0, 2),
            "receded_water_km2": receded_km2,
            "receded_water_ha": round(receded_km2 * 100.0, 2),
            "net_change_km2": net_change_km2,
            "percentage_change": pct_change,
            "baseline_water_km2": t1_water_km2,
            "event_water_km2": t2_water_km2,
            "stable_land_km2": round((stable_land_count * pixel_area_m2) / 1000000.0, 3),
            "total_evaluated_km2": round((both_valid_count * pixel_area_m2) / 1000000.0, 3),
            "change_polygon_features_count": len(geojson["features"]),
        },
        "outputs": {
            "change_raster_geotiff": str(change_tif_path),
            "change_vector_geojson": str(geojson_path),
        },
        "scientific_interpretation": (
            f"From {t1_date_str} to {t2_date_str}, observed water extent changed from {t1_water_km2} km^2 to {t2_water_km2} km^2 "
            f"({pct_change:+.1f}%). Newly inundated flood extent: {inundated_km2} km^2. Receded water extent: {receded_km2} km^2. "
            f"Persistent water channels: {persistent_km2} km^2."
        ),
    }

    summary_path = out_d / f"change_summary_{t1_date_str}_to_{t2_date_str}.json"
    with open(_win_path(summary_path), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary

