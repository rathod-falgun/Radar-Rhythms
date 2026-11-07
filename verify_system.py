"""
Brahmaputra FloodWatch - End-to-End System & Science Verification Test
Validates all backend services, algorithms, and API endpoints locally.
"""
import sys
import os
import json

# Ensure stdout supports UTF-8 on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ensure backend package is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

def test_nisar_metadata():
    print("[1/6] Testing NISAR Metadata & Orbital Catalog...")
    # pyrefly: ignore[missing-import]
    from app.services.nisar_metadata import (
        NISAR_OBSERVATION_CATALOG,
        STUDY_REGIONS,
        get_region_by_id,
        get_observation_by_date
    )
    assert len(NISAR_OBSERVATION_CATALOG) == 7, "Catalog must have 7 12-day revisit cycles"
    assert len(STUDY_REGIONS) == 5, "Must have 5 study reaches along Brahmaputra"

    kaziranga = get_region_by_id("kaziranga")
    assert kaziranga["id"] == "kaziranga"
    assert kaziranga["center"]["lat"] > 26.0

    flood_obs = get_observation_by_date("2026-07-09")
    assert flood_obs["cycle"] == 25
    assert flood_obs["is_candidate"] is True
    print("      ✓ Metadata and 12-day orbit repeat catalog verified.")

def test_radar_preprocessing():
    print("[2/6] Testing Radar Preprocessing (Adaptive Lee Filter & Indices)...")
    import numpy as np
    # pyrefly: ignore[missing-import]
    from app.services.radar_preprocessing import (
        apply_lee_speckle_filter,
        compute_polarimetric_indices
    )
    # Synthetic noisy speckle grid
    np.random.seed(42)
    clean_grid = np.full((30, 30), 0.05)
    noise = np.random.exponential(1.0, size=(30, 30))
    speckled = clean_grid * noise

    filtered = apply_lee_speckle_filter(speckled, window_size=5)
    assert filtered.shape == (30, 30)
    assert np.var(filtered) < np.var(speckled), "Speckle filter must reduce local variance"

    # Test RVI & PDI
    hh_db = np.full((10, 10), -15.0)
    hv_db = np.full((10, 10), -23.0)
    indices = compute_polarimetric_indices(hh_db, hv_db)
    assert "rvi" in indices
    assert "pdi_db" in indices
    assert 0.0 <= np.mean(indices["rvi"]) <= 1.0, "RVI must be in [0, 1]"
    assert np.mean(indices["pdi_db"]) > 0.0, "HH dB - HV dB should be positive"
    print("      ✓ Adaptive Lee Filter (5x5) and polarimetric RVI/PDI verified.")

def test_change_detection_physics():
    print("[3/6] Testing Multi-Temporal SAR Change Detection & 6-Class Taxonomy...")
    import numpy as np
    # pyrefly: ignore[missing-import]
    from app.services.change_detector import perform_sar_change_detection
    result = perform_sar_change_detection(
        region_id="kaziranga",
        baseline_date="2026-06-27",
        event_date="2026-07-09",
        threshold_db=-4.5,
        apply_speckle_filter=True
    )
    assert "statistics" in result
    assert "scientific_explanation" in result
    assert "raster_data" in result

    stats = result["statistics"]
    assert stats["newly_inundated_km2"] > 0
    assert stats["flooded_vegetation_km2"] > 0
    assert stats["inundation_percent_of_region"] > 30.0

    mask = np.array(result["raster_data"]["classification_mask"])
    unique_classes = set(np.unique(mask))
    # Must include permanent water (1), open flood (2), flooded vegetation (4), and stable land (0)
    assert {0, 1, 2, 4}.issubset(unique_classes), f"Taxonomy missing expected classes: {unique_classes}"
    print(f"      ✓ Change detection complete. Flooded Area: {stats['newly_inundated_km2']:.1f} km² ({stats['inundation_percent_of_region']:.1f}%).")

def test_nisar_hdf5_architecture():
    print("[4/6] Testing NISAR Level 2 GCOV HDF5 Container & Reader...")
    # pyrefly: ignore[missing-import]
    from app.services.nisar_reader import NISARGCOVReader
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        test_h5 = os.path.join(tmpdir, "test_nisar.h5")
        NISARGCOVReader.generate_reference_h5_product(
            filepath=test_h5,
            granule_id="NISAR_S2_PR_GCOV_025_019_D_075_TEST",
            region_id="kaziranga",
            date_str="2026-07-09",
            dim=32
        )
        assert os.path.exists(test_h5), "HDF5 file must be created"

        # Inspect structure
        info = NISARGCOVReader.inspect_hdf5_structure(test_h5)
        assert info["epsg_code"] == 32646
        assert "frequencyA" in info["frequencies"]
        assert "frequencyA" in info["bands"]
        band_names = [b["name"] for b in info["bands"]["frequencyA"]]
        assert "HHHH" in band_names
        assert "HVHV" in band_names
        print("      ✓ HDF5 Level 2 GCOV structure conforms to EPSG:32646 and contains HHHH/HVHV.")

def test_fastapi_endpoints():
    print("[5/6] Testing FastAPI REST Endpoints via TestClient...")
    from fastapi.testclient import TestClient
    # pyrefly: ignore[missing-import]
    from app.main import app

    client = TestClient(app)
    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Regions
    res = client.get("/api/regions")
    assert res.status_code == 200
    assert len(res.json()) == 5

    # 3. Observations
    res = client.get("/api/observations")
    assert res.status_code == 200
    assert len(res.json()) == 7

    # 4. Compare
    res = client.get("/api/compare?region_id=kaziranga&baseline_date=2026-06-27&event_date=2026-07-09")
    assert res.status_code == 200
    data = res.json()
    assert "statistics" in data

    # 5. Timeline Stats
    res = client.get("/api/timeline-stats?region_id=kaziranga")
    assert res.status_code == 200
    assert len(res.json()["timeline"]) == 7

    # 6. Reaches Summary
    res = client.get("/api/reaches/summary")
    assert res.status_code == 200
    assert len(res.json()) == 5

    # 7. GeoJSON Export
    res = client.get("/api/export/geojson?region_id=kaziranga")
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 2

    # 8. CSV Export
    res = client.get("/api/export/csv?region_id=kaziranga")
    assert res.status_code == 200
    assert "Acquisition_Date" in res.text

    # 9. Bhoonidhi Status
    res = client.get("/api/nisar/status")
    assert res.status_code == 200
    assert "service" in res.json()
    assert res.json()["service"] == "Bhoonidhi"
    print("      ✓ All FastAPI REST API routes (including Bhoonidhi integration) responded with 200 OK.")

def test_frontend_dist():
    print("[6/6] Verifying Frontend Production Distribution...")
    dist_html = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")
    assert os.path.exists(dist_html), "Frontend dist/index.html must exist"
    print("      ✓ Frontend production build bundle is ready for immediate deployment.")

if __name__ == "__main__":
    print("=====================================================================")
    print("BRAHMAPUTRA FLOODWATCH - NASA SPACE APPS 2026 VERIFICATION SUITE")
    print("=====================================================================")
    test_nisar_metadata()
    test_radar_preprocessing()
    test_change_detection_physics()
    test_nisar_hdf5_architecture()
    test_fastapi_endpoints()
    test_frontend_dist()
    print("=====================================================================")
    print(">>> ALL 6 SUITES PASSED PERFECTLY! SYSTEM IS 100% OPERATIONAL! <<<")
    print("=====================================================================")
