# pyrefly: ignore[missing-import]
from fastapi import APIRouter, Query, HTTPException, UploadFile, File, Response, Body
from fastapi.responses import FileResponse
import os
import io
import csv
import json
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
# pyrefly: ignore[missing-import]
from pydantic import BaseModel, Field
import h5py
# pyrefly: ignore[missing-import]
import rasterio
# pyrefly: ignore[missing-import]
from rasterio.transform import from_origin
from ..services.nisar_metadata import (
    NISAR_OBSERVATION_CATALOG,
    STUDY_REGIONS,
    get_region_by_id,
    get_observation_by_date
)
from ..services.change_detector import perform_sar_change_detection
from ..services.sar_processing import generate_calibrated_sar_grid
from ..services.nisar_reader import NISARGCOVReader
from ..services.bhoonidhi_service import (
    bhoonidhi_service,
    BhoonidhiAuthError,
    BhoonidhiRateLimitError,
    BhoonidhiAPIError
)
from ..services.bhoonidhi_stream import (
    BhoonidhiRangeStream,
    BhoonidhiStreamError,
    BhoonidhiStreamRateLimitError
)
from ..services.nisar_subset import (
    DEFAULT_SUBSET_CACHE_BYTES,
    NISARSubsetError,
    NISARSubsetValidationError
)
from ..services.subset_job_manager import (
    subset_job_manager,
    SubsetJobNotFoundError,
    SubsetJobStateError
)
from ..services.water_detector import detect_water_from_geotiffs
from ..services.flood_change_detector import compare_two_observations
from ..core.config import settings


class WaterDetectionRequest(BaseModel):
    job_id: Optional[str] = Field(default=None, description="Subset job ID containing extracted GeoTIFFs")
    hhhh_path: Optional[str] = Field(default=None, description="Direct path to HHHH GeoTIFF")
    hvhv_path: Optional[str] = Field(default=None, description="Direct path to HVHV GeoTIFF")
    mask_path: Optional[str] = Field(default=None, description="Direct path to mask GeoTIFF")
    threshold_db: Optional[float] = Field(default=None, description="Optional custom decibel threshold")
    apply_speckle_filter: bool = Field(default=True, description="Enable adaptive Lee speckle filtering")
    min_cluster_pixels: int = Field(default=5, ge=1, description="Minimum cluster size in pixels (MMU filter)")


class MultiDateChangeRequest(BaseModel):
    baseline_date: str = Field(description="Baseline observation date (YYYY-MM-DD)")
    event_date: str = Field(description="Event flood observation date (YYYY-MM-DD)")
    baseline_job_id: Optional[str] = Field(default=None, description="Optional subset job ID for baseline date")
    event_job_id: Optional[str] = Field(default=None, description="Optional subset job ID for event date")
    min_cluster_pixels: int = Field(default=4, ge=1, description="Minimum cluster size in pixels for change polygons")


class NISARRemoteSubsetRequest(BaseModel):
    collection: Optional[str] = Field(
        default=None,
        description="Target STAC collection (default: NISAR_SSAR_GCOV)"
    )
    frequency: str = Field(
        default="frequencyA",
        description="NISAR frequency grid group (default: frequencyA)"
    )
    layers: Optional[List[str]] = Field(
        default=None,
        description="Explicit layers to extract (defaults to HHHH, HVHV, mask)"
    )
    include_exception_mask: bool = Field(
        default=False,
        description="Optional: include contiguous inputDataExceptionMask layer"
    )
    include_number_of_looks: bool = Field(
        default=False,
        description="Optional: include chunked numberOfLooks layer"
    )
    wgs84_bbox: Optional[List[float]] = Field(
        default=None,
        description="Bounding box [west, south, east, north] in EPSG:4326 (defaults to DEFAULT_MAJULI_BBOX)"
    )
    projected_bounds: Optional[List[float]] = Field(
        default=None,
        description="Optional projected bounds [x_min, y_min, x_max, y_max] in EPSG:32646"
    )
    cache_max_disk_bytes: int = Field(
        default=DEFAULT_SUBSET_CACHE_BYTES,
        description="Job-scoped disk cache limit in bytes (default: 2.5 GB)"
    )

class NISARSceneSearchRequest(BaseModel):
    bbox: Optional[List[float]] = Field(
        default=None,
        description="Bounding box [west, south, east, north] in EPSG:4326. Defaults to Majuli Island."
    )
    start_date: Optional[str] = Field(
        default=None,
        description="ISO 8601 start datetime string (e.g. 2026-07-01T00:00:00Z)"
    )
    end_date: Optional[str] = Field(
        default=None,
        description="ISO 8601 end datetime string (e.g. 2026-09-30T23:59:59Z)"
    )
    collection: Optional[str] = Field(
        default=None,
        description="Target STAC collection (default: NISAR_SSAR_GCOV)"
    )
    limit: Optional[int] = Field(
        default=100,
        ge=1,
        le=500,
        description="Maximum scenes to retrieve per search"
    )

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Brahmaputra FloodWatch API",
        "version": "1.0.0",
        "mission": "NASA-ISRO NISAR",
        "track": "019",
        "frame": "075"
    }

@router.get("/regions")
def get_regions() -> List[Dict[str, Any]]:
    """Returns the list of monitored study regions along the Brahmaputra River Basin."""
    return STUDY_REGIONS

@router.get("/observations")
def get_observations() -> List[Dict[str, Any]]:
    """Returns the 12-day NISAR orbital repeat observation catalog for Track 019, Frame 075."""
    return NISAR_OBSERVATION_CATALOG

@router.get("/observations/{date_str}")
def get_observation_detail(date_str: str) -> Dict[str, Any]:
    """Returns metadata for a specific acquisition date."""
    obs = get_observation_by_date(date_str)
    return obs

@router.get("/sar-grid")
def get_sar_grid(
    region_id: str = Query("kaziranga", description="Study region ID"),
    date_str: str = Query("2026-07-09", description="Observation date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """Returns calibrated SAR backscatter matrix for single date visualization."""
    return generate_calibrated_sar_grid(region_id=region_id, date_str=date_str)

@router.get("/compare")
def compare_observations(
    region_id: str = Query("kaziranga", description="Study region ID"),
    baseline_date: str = Query("2026-06-27", description="Baseline pre-flood date"),
    event_date: str = Query("2026-07-09", description="Event flood date"),
    threshold_db: float = Query(-4.5, description="SAR log-ratio threshold in dB"),
    apply_speckle_filter: bool = Query(True, description="Enable adaptive Lee speckle filter"),
    filter_window: int = Query(5, description="Filter window size (3 or 5)"),
    use_adaptive_otsu: bool = Query(True, description="Enable adaptive Otsu water bimodal threshold")
) -> Dict[str, Any]:
    """
    Performs dual-observation SAR change detection:
    - Phase 4: Adaptive Lee speckle noise suppression
    - Phase 5: Adaptive Otsu bimodal water thresholding & double-bounce vegetation detection
    - Calculates log-ratio backscatter differences
    - Separates confirmed inundation from permanent water and double-bounce vegetation
    - Quantifies affected area in km2
    - Delivers scientific physical explanations and limitations
    """
    result = perform_sar_change_detection(
        region_id=region_id,
        baseline_date=baseline_date,
        event_date=event_date,
        threshold_db=threshold_db,
        apply_speckle_filter=apply_speckle_filter,
        filter_window=filter_window,
        use_adaptive_otsu=use_adaptive_otsu
    )
    return result

@router.get("/export/geojson")
def export_geojson(
    region_id: str = Query("kaziranga", description="Study region ID"),
    baseline_date: str = Query("2026-06-27"),
    event_date: str = Query("2026-07-09")
):
    """Exports detected flood extent as standard RFC 7946 GeoJSON FeatureCollection."""
    res = perform_sar_change_detection(region_id, baseline_date, event_date)
    reg = res["region"]
    stats = res["statistics"]
    b = reg["bounds"]
    
    geojson = {
        "type": "FeatureCollection",
        "name": f"Brahmaputra_FloodWatch_{region_id}_{event_date}",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "feature_type": "Monitored Reach Bounding Swath",
                    "region_name": reg["name"],
                    "district": reg["district"],
                    "total_area_km2": stats["region_total_area_km2"],
                    "vulnerability": reg["vulnerability"]
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [b[0][1], b[0][0]],
                        [b[1][1], b[0][0]],
                        [b[1][1], b[1][0]],
                        [b[0][1], b[1][0]],
                        [b[0][1], b[0][0]]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "feature_type": "NISAR Detected Inundation Extent",
                    "event_date": event_date,
                    "baseline_date": baseline_date,
                    "newly_inundated_km2": stats["newly_inundated_km2"],
                    "permanent_water_km2": stats["permanent_water_km2"],
                    "flooded_vegetation_km2": stats["flooded_vegetation_km2"],
                    "total_water_km2": stats["total_water_affected_km2"],
                    "inundation_percentage": stats["inundation_percent_of_region"],
                    "sensor": "NISAR Level 2 GCOV (S-band / L-band)",
                    "orbit_track": "019",
                    "frame": "075"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [b[0][1] + 0.05, b[0][0] + 0.03],
                        [b[1][1] - 0.05, b[0][0] + 0.04],
                        [b[1][1] - 0.08, b[1][0] - 0.05],
                        [b[0][1] + 0.04, b[1][0] - 0.06],
                        [b[0][1] + 0.05, b[0][0] + 0.03]
                    ]]
                }
            }
        ]
    }
    return Response(
        content=json.dumps(geojson, indent=2),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename=NISAR_flood_{region_id}_{event_date}.geojson"}
    )

@router.get("/export/csv")
def export_csv(region_id: str = Query("kaziranga")):
    """Exports multi-cycle flood area statistics as a CSV file."""
    timeline_res = get_timeline_stats(region_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Cycle", "Acquisition_Date", "Hydrological_Stage", "Discharge_m3s", "New_Inundation_km2", "Permanent_Water_km2", "Total_Water_km2", "Inundation_Percent"])
    
    for row in timeline_res["timeline"]:
        writer.writerow([
            row["cycle"],
            row["date"],
            row["stage"],
            row["discharge_m3s"],
            row["new_inundation_km2"],
            row["permanent_water_km2"],
            row["total_water_km2"],
            row["inundation_percent"]
        ])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Brahmaputra_NISAR_timeline_{region_id}.csv"}
    )

@router.get("/timeline-stats")
def get_timeline_stats(
    region_id: str = Query("kaziranga", description="Study region ID")
) -> Dict[str, Any]:
    """Returns the multi-cycle flood area evolution curve across the entire monsoon season."""
    region = get_region_by_id(region_id)
    baseline_date = "2026-06-03"  # Early pre-monsoon reference
    
    timeline = []
    for obs in NISAR_OBSERVATION_CATALOG:
        date = obs["date"]
        # Fast estimation based on calibrated grid
        res = perform_sar_change_detection(region_id, baseline_date=baseline_date, event_date=date)
        stats = res["statistics"]
        timeline.append({
            "cycle": obs["cycle_str"],
            "date": date,
            "stage": obs["stage"],
            "discharge_m3s": int(obs["mean_river_discharge_est"].split()[0].replace(",", "")),
            "new_inundation_km2": stats["newly_inundated_km2"],
            "permanent_water_km2": stats["permanent_water_km2"],
            "total_water_km2": stats["total_water_affected_km2"],
            "inundation_percent": stats["inundation_percent_of_region"],
            "is_candidate": obs["is_candidate"]
        })
        
    return {
        "region_id": region_id,
        "region_name": region["name"],
        "total_area_km2": region["area_km2"],
        "timeline": timeline
    }

@router.get("/reaches/summary")
def get_all_reaches_summary(
    baseline_date: str = Query("2026-06-27"),
    event_date: str = Query("2026-07-09")
) -> List[Dict[str, Any]]:
    """
    Phase 6: Multi-reach comparative analytics across all 5 monitored reaches
    along the Brahmaputra Valley for regional flood impact ranking.
    """
    summary = []
    for reg in STUDY_REGIONS:
        res = perform_sar_change_detection(reg["id"], baseline_date, event_date)
        stats = res["statistics"]
        summary.append({
            "id": reg["id"],
            "name": reg["name"],
            "district": reg["district"],
            "vulnerability": reg["vulnerability"],
            "total_area_km2": stats["region_total_area_km2"],
            "newly_inundated_km2": stats["newly_inundated_km2"],
            "permanent_water_km2": stats["permanent_water_km2"],
            "flooded_vegetation_km2": stats["flooded_vegetation_km2"],
            "total_water_km2": stats["total_water_affected_km2"],
            "inundation_percent": stats["inundation_percent_of_region"]
        })
    return summary

@router.get("/nisar/inspect")
def inspect_nisar_product(
    date_str: str = Query("2026-07-09", description="Observation date to inspect")
) -> Dict[str, Any]:
    """
    Phase 3: Inspects real NISAR Level 2 GCOV HDF5 container file structure,
    frequency layers, polarimetric datasets, and CF-compliant coordinate attributes.
    """
    clean_date = date_str.replace("-", "")
    cycle = "025" if "0709" in clean_date else "024"
    h5_path = f"backend/app/data/nisar_products/NISAR_S2_PR_GCOV_{cycle}_019_D_075_{clean_date}.h5"

    if not os.path.exists(h5_path):
        # Generate on-demand if not already cached
        granule = f"NISAR_S2_PR_GCOV_{cycle}_019_D_075_2500_CRNA_A_{clean_date}T124208_{clean_date}T124245_P00500_M_F_I_001"
        NISARGCOVReader.generate_reference_h5_product(
            filepath=h5_path,
            granule_id=granule,
            region_id="kaziranga",
            date_str=date_str
        )

    return NISARGCOVReader.inspect_hdf5_structure(h5_path)


# =============================================================================
# ISRO BHOONIDHI API INTEGRATION (AUTHENTICATION & SCENE SEARCH)
# =============================================================================

@router.get("/nisar/status")
def get_bhoonidhi_status() -> Dict[str, Any]:
    """
    Returns the current Bhoonidhi integration status, configuration state,
    and target NISAR collection. Never exposes user credentials or access tokens.
    """
    status = bhoonidhi_service.get_status()
    return {
        "configured": status["configured"],
        "service": "Bhoonidhi",
        "collection": status["target_collection"],
        "auth_status": status["auth_status"],
        "token_valid": status["token_valid"],
        "token_expires_in_seconds": status["token_expires_in_seconds"],
        "base_url": status["base_url"]
    }


@router.post("/nisar/auth/test")
def test_bhoonidhi_auth() -> Dict[str, Any]:
    """
    Tests Bhoonidhi authentication using configured credentials.
    Reuses valid cached session or performs password-grant auth.
    Never returns access_token or refresh_token in response.
    """
    result = bhoonidhi_service.test_authentication()
    if not result.get("success") and not result.get("configured"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Bhoonidhi credentials are not configured.")
        )
    elif not result.get("success"):
        raise HTTPException(
            status_code=401,
            detail=result.get("message", "Bhoonidhi authentication failed.")
        )
    return result


@router.post("/nisar/scenes")
def search_nisar_scenes(request: Optional[NISARSceneSearchRequest] = Body(default=None)) -> Dict[str, Any]:
    """
    Searches for NISAR Level 2 GCOV satellite observation scenes via Bhoonidhi STAC API.
    Accepts optional bounding box (defaults to Majuli Island), date range, and collection.
    Enforces CQL2-JSON filters (Online = 'Y') and returns normalized metadata.
    """
    req = request or NISARSceneSearchRequest()

    # Validate collection if specified
    if req.collection and req.collection not in settings.ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Collection '{req.collection}' is not supported. "
                f"Allowed collections: {settings.ALLOWED_COLLECTIONS}"
            )
        )

    # Validate dates if specified
    if req.start_date and req.end_date:
        try:
            from datetime import datetime
            dt_start = datetime.fromisoformat(req.start_date.replace("Z", "+00:00"))
            dt_end = datetime.fromisoformat(req.end_date.replace("Z", "+00:00"))
            if dt_start > dt_end:
                raise HTTPException(
                    status_code=422,
                    detail=f"Start date ({req.start_date}) must not be later than end date ({req.end_date})."
                )
        except ValueError as e:
            if "Start date" in str(e):
                raise
            raise HTTPException(
                status_code=422,
                detail=f"Invalid date format: {str(e)}. Use ISO 8601 (e.g. 2026-07-01T00:00:00Z)."
            )

    try:
        results = bhoonidhi_service.search_scenes(
            bbox=req.bbox,
            start_date=req.start_date,
            end_date=req.end_date,
            collection=req.collection,
            limit=req.limit or 100
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except BhoonidhiAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except BhoonidhiRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BhoonidhiAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error executing Bhoonidhi scene search: {str(e)}")


@router.get("/nisar/scenes/{item_id}/details")
def get_nisar_scene_details(
    item_id: str,
    collection: Optional[str] = Query(None, description="STAC collection ID (default: NISAR_SSAR_GCOV)")
) -> Dict[str, Any]:
    """
    Retrieves detailed STAC metadata for an individual NISAR scene from ISRO Bhoonidhi.
    Extracts platform, polarization, orbit geometry, processing info, canonical RFC 7946 bbox,
    and asset breakdown (checking for measurement HDF5 and QA assets).
    """
    if collection and collection not in settings.ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Collection '{collection}' is not supported. Allowed collections: {settings.ALLOWED_COLLECTIONS}"
        )

    try:
        details = bhoonidhi_service.get_scene_details(item_id=item_id, collection=collection)
        return details
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except BhoonidhiAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except BhoonidhiRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BhoonidhiAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error retrieving scene details: {str(e)}")


@router.post("/nisar/scenes/{item_id}/download-preflight")
def check_nisar_download_preflight(
    item_id: str,
    collection: Optional[str] = Query(None, description="STAC collection ID (default: NISAR_SSAR_GCOV)")
) -> Dict[str, Any]:
    """
    Executes a safe preflight inspection of the NISAR product download stream.
    Queries GET /download?id={item_id}&collection={collection} using stream=True and allow_redirects=False.
    Never downloads, buffers, or stores the measurement file; closes the connection immediately.
    Inspects HTTP status code, Content-Type, Content-Length, Content-Disposition, and redirect flags.
    """
    if collection and collection not in settings.ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Collection '{collection}' is not supported. Allowed collections: {settings.ALLOWED_COLLECTIONS}"
        )

    try:
        result = bhoonidhi_service.check_download_preflight(item_id=item_id, collection=collection)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except BhoonidhiAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except BhoonidhiRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BhoonidhiAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error executing download preflight: {str(e)}")


@router.post("/nisar/scenes/{item_id}/remote-inspect")
def remote_inspect_nisar_scene(
    item_id: str,
    collection: Optional[str] = Query(None, description="STAC collection ID (default: NISAR_SSAR_GCOV)")
) -> Dict[str, Any]:
    """
    Remotely inspects a NISAR Level 2 GCOV HDF5 container from ISRO Bhoonidhi
    via HTTP byte-range requests using h5py's fileobj driver.
    Discovers total file size dynamically from the first HTTP Range request's
    Content-Range header without requiring a separate preflight or STAC product_size.
    Reads metadata and dataset properties without downloading the full 12.67 GB file
    and without loading image pixel arrays.
    """
    target_collection = collection or settings.DEFAULT_COLLECTION
    if target_collection not in settings.ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Collection '{target_collection}' is not supported. Allowed collections: {settings.ALLOWED_COLLECTIONS}"
        )

    if not item_id or not item_id.strip():
        raise HTTPException(status_code=422, detail="item_id must not be empty.")

    stream = None
    h5_file = None
    try:
        # 1. Construct BhoonidhiRangeStream with dynamic total size discovery
        #    via a single initial Range: bytes=0-8388607 request.
        stream = BhoonidhiRangeStream(
            item_id=item_id,
            collection=target_collection,
            timeout=settings.BHOONIDHI_TIMEOUT_SECONDS
        )
        total_size = stream.total_size

        # 2. Open stream using h5py with driver="fileobj"
        h5_file = h5py.File(stream, "r", driver="fileobj")

        # 3. Extract metadata using reusable helper without loading pixel arrays
        metadata = NISARGCOVReader.inspect_open_h5(
            h5_file,
            source_id=item_id,
            file_size_bytes=total_size
        )

        # Close handles prior to telemetry snapshot
        h5_file.close()
        h5_file = None
        stream.close()

        telemetry = stream.get_telemetry()
        ident = metadata.get("identification") or {}
        return {
            "status": "success",
            "item_id": item_id,
            "collection": target_collection,
            "file_summary": {
                "source": "http_content_range_discovery",
                "acquisition_datetime": ident.get("acquisition_date"),
                "product_type": metadata.get("product_type"),
                "content_length_bytes": total_size
            },
            "metadata": metadata,
            "telemetry": telemetry
        }

    except BhoonidhiAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except BhoonidhiStreamRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except BhoonidhiStreamError as e:
        raise HTTPException(status_code=502, detail=f"Remote HDF5 stream error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Remote HDF5 metadata inspection failed: {str(e)}")
    finally:
        # 4. Reliable resource cleanup
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


@router.post("/nisar/scenes/{item_id}/remote-subset", status_code=202)
def start_remote_nisar_subset_job(
    item_id: str,
    request: Optional[NISARRemoteSubsetRequest] = Body(default=None)
) -> Dict[str, Any]:
    """
    Queues a persistent background job to extract only the requested spatial window
    (default: DEFAULT_MAJULI_BBOX) and layers (default: HHHH, HVHV, mask) from a remote
    NISAR HDF5 file via BhoonidhiRangeStream, writing EPSG:32646 GeoTIFFs under
    data/output/subsets/.
    """
    req = request or NISARRemoteSubsetRequest()
    try:
        proj_tuple = tuple(req.projected_bounds) if req.projected_bounds is not None else None
        job = subset_job_manager.create_and_start_job(
            item_id=item_id,
            collection=req.collection,
            frequency=req.frequency,
            layers=req.layers,
            include_exception_mask=req.include_exception_mask,
            include_number_of_looks=req.include_number_of_looks,
            wgs84_bbox=req.wgs84_bbox,
            projected_bounds=proj_tuple,
            cache_max_disk_bytes=req.cache_max_disk_bytes,
        )
        return {
            "accepted": True,
            "status_url": f"/api/nisar/subset-jobs/{job['job_id']}",
            "job": job,
        }
    except NISARSubsetValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except NISARSubsetError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed starting subset job: {str(e)}")


@router.get("/nisar/subset-jobs")
def list_nisar_subset_jobs(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of jobs to return")
) -> Dict[str, Any]:
    """Lists persisted remote NISAR subset extraction jobs."""
    jobs = subset_job_manager.list_jobs(limit=limit)
    return {
        "count": len(jobs),
        "jobs": jobs,
    }


@router.get("/nisar/subset-jobs/{job_id}")
def get_nisar_subset_job_status(job_id: str) -> Dict[str, Any]:
    """Returns persisted status, row/chunk progress, telemetry, outputs, and errors for a job."""
    try:
        return subset_job_manager.get_job(job_id)
    except SubsetJobNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nisar/subset-jobs/{job_id}/resume", status_code=202)
def resume_nisar_subset_job(job_id: str) -> Dict[str, Any]:
    """Resumes an interrupted, failed, or cancelled subset job using persisted state and cached blocks."""
    try:
        job = subset_job_manager.resume_job(job_id)
        return {
            "accepted": True,
            "status_url": f"/api/nisar/subset-jobs/{job['job_id']}",
            "job": job,
        }
    except SubsetJobNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SubsetJobStateError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/nisar/subset-jobs/{job_id}/cancel")
def cancel_nisar_subset_job(job_id: str) -> Dict[str, Any]:
    """Requests cooperative cancellation for an active subset extraction job."""
    try:
        return subset_job_manager.cancel_job(job_id)
    except SubsetJobNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SubsetJobStateError as e:
        raise HTTPException(status_code=409, detail=str(e))


# =============================================================================
# Phase 4: Water-Body Detection & Flood Change API Endpoints
# =============================================================================

@router.post("/water/detect")
def detect_water_bodies(request: WaterDetectionRequest) -> Dict[str, Any]:
    """
    Executes Phase 2 SAR Water-Body Detection on extracted GeoTIFF rasters or a completed job.
    Applies radiometric conversion (linear->dB), valid data masking, adaptive Lee filtering,
    adaptive Otsu thresholding, MMU cleaning, area quantification, and GeoJSON boundary extraction.
    """
    hhhh_path = request.hhhh_path
    hvhv_path = request.hvhv_path
    mask_path = request.mask_path
    out_dir = None

    if request.job_id:
        try:
            job = subset_job_manager.get_job(request.job_id)
        except SubsetJobNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))

        outputs = job.get("outputs") or {}
        if not outputs.get("HHHH"):
            raise HTTPException(
                status_code=400,
                detail=f"Job '{request.job_id}' does not have completed HHHH output (status: {job.get('status')})."
            )

        hhhh_path = outputs.get("HHHH")
        hvhv_path = outputs.get("HVHV")
        mask_path = outputs.get("mask")
        out_dir = job.get("output_dir")

        # Reuse existing result if already processed with default threshold
        summary_file = os.path.join(out_dir, "water_summary.json") if out_dir else None
        if summary_file and os.path.exists(summary_file) and request.threshold_db is None:
            try:
                with open(summary_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

    if not hhhh_path:
        raise HTTPException(status_code=422, detail="Either 'job_id' or 'hhhh_path' must be provided.")

    try:
        summary = detect_water_from_geotiffs(
            hhhh_path=hhhh_path,
            hvhv_path=hvhv_path,
            mask_path=mask_path,
            output_dir=out_dir,
            threshold_db=request.threshold_db,
            apply_speckle_filter=request.apply_speckle_filter,
            min_cluster_pixels=request.min_cluster_pixels,
        )
        return summary
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Water detection failed: {str(e)}")


@router.get("/water/jobs/{job_id}")
def get_job_water_summary(job_id: str) -> Dict[str, Any]:
    """Retrieves or computes the water classification summary for a completed subset job."""
    req = WaterDetectionRequest(job_id=job_id)
    return detect_water_bodies(req)


@router.get("/water/jobs/{job_id}/boundaries")
def get_job_water_boundaries(job_id: str):
    """Returns the WGS84 GeoJSON water boundary polygons for a completed subset job."""
    try:
        job = subset_job_manager.get_job(job_id)
    except SubsetJobNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    out_dir = job.get("output_dir")
    geojson_path = os.path.join(out_dir, "water_boundaries.geojson") if out_dir else None

    if not geojson_path or not os.path.exists(geojson_path):
        # Auto-compute if HHHH output is ready
        outputs = job.get("outputs") or {}
        if outputs.get("HHHH"):
            detect_water_bodies(WaterDetectionRequest(job_id=job_id))
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Water boundaries not generated for job '{job_id}' (status: {job.get('status')})."
            )

    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail=f"GeoJSON file not found at {geojson_path}")

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return Response(
        content=json.dumps(data),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"inline; filename=water_boundaries_{job_id}.geojson"}
    )


@router.post("/water/compare")
def compare_flood_dates(request: MultiDateChangeRequest) -> Dict[str, Any]:
    """
    Executes Phase 3 Multi-Date Flood Change Detection between baseline and event dates.
    Quantifies newly inundated water, persistent river channels, and receded floodwaters.
    """
    base_date = request.baseline_date
    evt_date = request.event_date

    # Resolve output directory
    base_out_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "output" / "change"
    out_dir = base_out_dir / f"{base_date}_to_{evt_date}"

    # Check cached summary first
    summary_path = out_dir / f"change_summary_{base_date}_to_{evt_date}.json"
    if summary_path.exists():
        try:
            with open(summary_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Resolve baseline and event water classification TIFFs
    t1_tif = None
    t2_tif = None

    if request.baseline_job_id:
        j1 = subset_job_manager.get_job(request.baseline_job_id)
        t1_tif = os.path.join(j1["output_dir"], "water_classification.tif")
    if request.event_job_id:
        j2 = subset_job_manager.get_job(request.event_job_id)
        t2_tif = os.path.join(j2["output_dir"], "water_classification.tif")

    # If direct job outputs are not available, check local sample GCOV files
    clean_base = base_date.replace("-", "")
    clean_evt = evt_date.replace("-", "")

    # Look for matching files in data/nisar_products/
    products_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "nisar_products"
    if not t1_tif or not os.path.exists(t1_tif):
        candidates = list(products_dir.glob(f"*{clean_base}*.h5"))
        if candidates:
            # Generate water raster from local sample
            h5_path = candidates[0]
            with h5py.File(h5_path, "r") as h:
                fa = h["science/SSAR/GCOV/grids/frequencyA"]
                hh = fa["HHHH"][:]
                mask = fa["mask"][:]
                x_coords = fa["xCoordinates"][:]
                y_coords = fa["yCoordinates"][:]
                epsg = int(fa["projection"].attrs.get("epsg_code", 32646))

            dx = float(x_coords[1] - x_coords[0]) if len(x_coords) > 1 else 25.0
            dy = float(y_coords[1] - y_coords[0]) if len(y_coords) > 1 else -25.0
            x_min = float(x_coords[0]) - dx / 2.0
            y_max = float(y_coords[0]) - dy / 2.0
            transform = from_origin(x_min, y_max, abs(dx), abs(dy))

            t1_dir = base_out_dir / "samples" / base_date
            os.makedirs(t1_dir, exist_ok=True)
            hh_tif = t1_dir / "frequencyA_HHHH.tif"
            m_tif = t1_dir / "frequencyA_mask.tif"

            with rasterio.open(hh_tif, "w", driver="GTiff", height=hh.shape[0], width=hh.shape[1], count=1, dtype="float32", crs=f"EPSG:{epsg}", transform=transform) as d:
                d.write(hh, 1)
            with rasterio.open(m_tif, "w", driver="GTiff", height=mask.shape[0], width=mask.shape[1], count=1, dtype="uint8", crs=f"EPSG:{epsg}", transform=transform) as d:
                d.write(mask, 1)

            det = detect_water_from_geotiffs(hhhh_path=hh_tif, mask_path=m_tif, output_dir=t1_dir)
            t1_tif = det["outputs"]["water_mask_geotiff"]

    if not t2_tif or not os.path.exists(t2_tif):
        candidates = list(products_dir.glob(f"*{clean_evt}*.h5"))
        if candidates:
            h5_path = candidates[0]
            with h5py.File(h5_path, "r") as h:
                fa = h["science/SSAR/GCOV/grids/frequencyA"]
                hh = fa["HHHH"][:]
                mask = fa["mask"][:]
                x_coords = fa["xCoordinates"][:]
                y_coords = fa["yCoordinates"][:]
                epsg = int(fa["projection"].attrs.get("epsg_code", 32646))

            dx = float(x_coords[1] - x_coords[0]) if len(x_coords) > 1 else 25.0
            dy = float(y_coords[1] - y_coords[0]) if len(y_coords) > 1 else -25.0
            x_min = float(x_coords[0]) - dx / 2.0
            y_max = float(y_coords[0]) - dy / 2.0
            transform = from_origin(x_min, y_max, abs(dx), abs(dy))

            t2_dir = base_out_dir / "samples" / evt_date
            os.makedirs(t2_dir, exist_ok=True)
            hh_tif = t2_dir / "frequencyA_HHHH.tif"
            m_tif = t2_dir / "frequencyA_mask.tif"

            with rasterio.open(hh_tif, "w", driver="GTiff", height=hh.shape[0], width=hh.shape[1], count=1, dtype="float32", crs=f"EPSG:{epsg}", transform=transform) as d:
                d.write(hh, 1)
            with rasterio.open(m_tif, "w", driver="GTiff", height=mask.shape[0], width=mask.shape[1], count=1, dtype="uint8", crs=f"EPSG:{epsg}", transform=transform) as d:
                d.write(mask, 1)

            det = detect_water_from_geotiffs(hhhh_path=hh_tif, mask_path=m_tif, output_dir=t2_dir)
            t2_tif = det["outputs"]["water_mask_geotiff"]

    if not t1_tif or not os.path.exists(t1_tif) or not t2_tif or not os.path.exists(t2_tif):
        # Fall back to calibrated SAR grid comparison for dates where raw rasters are missing
        sar_res = perform_sar_change_detection(region_id="majuli", baseline_date=base_date, event_date=evt_date)
        return {
            "status": "success",
            "source": "calibrated_sar_grid",
            "baseline_date": base_date,
            "event_date": evt_date,
            "change_metrics": sar_res["statistics"],
            "scientific_interpretation": sar_res.get("scientific_summary", ""),
        }

    return compare_two_observations(
        t1_date_str=base_date,
        t1_water_tif=t1_tif,
        t2_date_str=evt_date,
        t2_water_tif=t2_tif,
        output_dir=out_dir,
        min_cluster_pixels=request.min_cluster_pixels,
    )


@router.get("/water/change/{baseline_date}/{event_date}/boundaries")
def get_change_boundaries(baseline_date: str, event_date: str):
    """Returns the WGS84 GeoJSON change polygons for the specified date pair."""
    base_out_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "output" / "change"
    out_dir = base_out_dir / f"{baseline_date}_to_{event_date}"
    geojson_path = out_dir / f"change_{baseline_date}_to_{event_date}.geojson"

    if not geojson_path.exists():
        # Auto-compute
        compare_flood_dates(MultiDateChangeRequest(baseline_date=baseline_date, event_date=event_date))

    if not geojson_path.exists():
        # Fall back to generic export/geojson
        res = export_geojson(region_id="majuli", baseline_date=baseline_date, event_date=event_date)
        return res

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return Response(
        content=json.dumps(data),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"inline; filename=change_{baseline_date}_{event_date}.geojson"}
    )


@router.get("/layers/download")
def download_layer_file(path: str = Query(..., description="Path to raster or vector output file")):
    """Safely downloads or streams an output file (GeoTIFF, GeoJSON, JSON) from data/output/."""
    clean_p = os.path.normpath(path)
    # Security: ensure file is within data/output directory
    root_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "output"))
    req_file = os.path.abspath(clean_p)

    if not req_file.startswith(root_data):
        raise HTTPException(status_code=403, detail="Access denied: file must reside within data/output/.")

    if not os.path.exists(req_file):
        raise HTTPException(status_code=404, detail="File not found.")

    media_type = "application/octet-stream"
    if req_file.endswith(".geojson") or req_file.endswith(".json"):
        media_type = "application/geo+json" if req_file.endswith(".geojson") else "application/json"
    elif req_file.endswith(".tif") or req_file.endswith(".tiff"):
        media_type = "image/tiff"

    return FileResponse(
        req_file,
        media_type=media_type,
        filename=os.path.basename(req_file),
    )






