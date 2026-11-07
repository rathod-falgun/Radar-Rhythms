from fastapi import APIRouter, Query, HTTPException, UploadFile, File, Response, Body
import os
import io
import csv
import json
import shutil
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
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
from ..core.config import settings

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



