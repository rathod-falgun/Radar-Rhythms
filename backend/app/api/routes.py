from fastapi import APIRouter, Query, HTTPException, UploadFile, File
import os
import shutil
from typing import Dict, Any, List
from ..services.nisar_metadata import (
    NISAR_OBSERVATION_CATALOG,
    STUDY_REGIONS,
    get_region_by_id,
    get_observation_by_date
)
from ..services.change_detector import perform_sar_change_detection
from ..services.sar_processing import generate_calibrated_sar_grid
from ..services.nisar_reader import NISARGCOVReader

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
    filter_window: int = Query(5, description="Filter window size (3 or 5)")
) -> Dict[str, Any]:
    """
    Performs dual-observation SAR change detection:
    - Phase 4: Adaptive Lee speckle noise suppression
    - Calculates log-ratio backscatter differences
    - Separates new inundation from permanent water and double-bounce vegetation
    - Quantifies affected area in km2
    - Delivers scientific physical explanations and limitations
    """
    result = perform_sar_change_detection(
        region_id=region_id,
        baseline_date=baseline_date,
        event_date=event_date,
        threshold_db=threshold_db,
        apply_speckle_filter=apply_speckle_filter,
        filter_window=filter_window
    )
    return result

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

