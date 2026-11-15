# Brahmaputra FloodWatch — Complete File-by-File Repository Inventory
**NASA Space Apps Challenge 2026** | *Challenge: Dancing with the SARs*  
**Document Reference:** `PROJECT_COMPLETE_FILE_INVENTORY.md`  
**Total Tracked Files Documented:** 211  
**Date:** November 15, 2026  

---

## Executive Inventory Summary

- **Total Tracked Files:** 211
- **Total Runtime-Required Files:** 34
- **Total Build-Only Files:** 7
- **Total Documentation & Evidence Files:** 47
- **Total Scientific Datasets & Outputs:** 81
- **Total Scripts & Utilities:** 14

---

## Complete File-by-File Catalog

| Exact Relative Path | Size | Classification | Track in Git? | Req. in Prod? | Functional Purpose & Connectivity |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `.agents/skills/ralph-loop/SKILL.md` | 4.0 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `.agents/skills/ralph-loop/resources/PRD.template.md` | 0.4 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `.env.example` | 0.8 KB | Required configuration | **YES** | NO | Sanitized environment template or Git exclusion specification. |
| `.gitignore` | 1.1 KB | Required configuration | **YES** | NO | Sanitized environment template or Git exclusion specification. |
| `FINAL_PROJECT_AUDIT_AND_FILE_DOCUMENTATION.md` | 44.7 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `MULTIDATE_SCIENTIFIC_VALIDATION.md` | 14.4 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `MULTIDATE_WATER_ANALYSIS_REPORT.md` | 12.7 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `NEXT_PHASE_RECOMMENDATIONS.md` | 7.5 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `NISAR_SCENE_AVAILABILITY_AUDIT.md` | 27.5 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `NISAR_VERIFIED_SCENE_MANIFEST.md` | 10.0 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `README.md` | 19.4 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `SUBMISSION_BRIEF.md` | 9.1 KB | Documentation/reference | **YES** | NO | Primary architectural, scientific, and challenge submission documentation. |
| `backend/.env.example` | 0.8 KB | Required configuration | **YES** | NO | Sanitized environment template or Git exclusion specification. |
| `backend/app/api/routes.py` | 77.8 KB | Essential application source | **YES** | **YES** | FastAPI REST API route handlers. |
| `backend/app/core/config.py` | 2.3 KB | Essential application source | **YES** | **YES** | Pydantic application settings and environment loader. |
| `backend/app/data/nisar_products/NISAR_S2_PR_GCOV_024_019_D_075_20260627.h5` | 95.0 KB | Required scientific data | **YES** | **YES** | Cropped NISAR Level-2 GCOV HDF5 product for structure inspection. |
| `backend/app/data/nisar_products/NISAR_S2_PR_GCOV_025_019_D_075_20260709.h5` | 97.8 KB | Required scientific data | **YES** | **YES** | Cropped NISAR Level-2 GCOV HDF5 product for structure inspection. |
| `backend/app/main.py` | 1.9 KB | Essential application source | **YES** | **YES** | FastAPI application entrypoint and CORS middleware setup. |
| `backend/app/services/bhoonidhi_service.py` | 41.2 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/bhoonidhi_stream.py` | 45.0 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/change_detector.py` | 12.5 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/flood_change_detector.py` | 10.6 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/nisar_metadata.py` | 21.0 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/nisar_reader.py` | 11.3 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/nisar_subset.py` | 33.1 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/radar_preprocessing.py` | 5.7 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/sar_processing.py` | 5.1 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/subset_job_manager.py` | 18.1 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/app/services/water_detector.py` | 15.9 KB | Essential application source | **YES** | **YES** | FastAPI backend scientific or catalog processing service. |
| `backend/requirements.txt` | 0.1 KB | Required configuration | **YES** | **YES** | Production Python dependency manifest. |
| `backend/scripts/audit_metadata.py` | 5.0 KB | Development/testing support | **YES** | NO | Developer offline preprocessing and metadata extraction script. |
| `backend/scripts/process_multidate_nisar.py` | 33.4 KB | Development/testing support | **YES** | NO | Developer offline preprocessing and metadata extraction script. |
| `backend/tests/test_bhoonidhi.py` | 26.6 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_flood_change_detector.py` | 3.9 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_nisar_subset.py` | 17.2 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_rate_limiter_unification.py` | 21.7 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_remote_inspect.py` | 30.9 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_subset_jobs.py` | 17.9 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_water_api.py` | 4.8 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `backend/tests/test_water_detector.py` | 5.1 KB | Development/testing support | **YES** | NO | Automated unit test suite verifying backend logic. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_22_2026-06-03.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_23_2026-06-15.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_24_2026-06-27.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_25_2026-07-09.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_26_2026-07-21.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_27_2026-08-02.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_28_2026-08-14.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_29_2026-08-26.npy` | 112.6 KB | Required scientific data | **YES** | **YES** | Calibrated single-look radar backscatter array for real-time comparison. |
| `data/experimental/multidate_nisar/barpeta/change_maps/all_consecutive_changes.csv` | 0.9 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/all_consecutive_changes.json` | 9.3 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-06-03_to_2026-06-15.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-06-15_to_2026-06-27.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-06-27_to_2026-07-09.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-07-09_to_2026-07-21.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-07-21_to_2026-08-02.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-08-02_to_2026-08-14.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-08-14_to_2026-08-26.npy` | 14.2 KB | Required scientific data | **YES** | **YES** | Classified flood change raster matrix for Barpeta corridor. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-06-03_to_2026-06-15.json` | 1.2 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-06-15_to_2026-06-27.json` | 1.3 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-06-27_to_2026-07-09.json` | 1.2 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-07-09_to_2026-07-21.json` | 1.3 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-07-21_to_2026-08-02.json` | 1.2 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-08-02_to_2026-08-14.json` | 1.2 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-08-14_to_2026-08-26.json` | 1.2 KB | Required scientific data | **YES** | **YES** | Precomputed change statistics JSON summary. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/grid_alignment_audit.json` | 2.8 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/mask_value_audit.json` | 2.7 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/metadata_audit_raw.json` | 33.0 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/reference_grid.json` | 0.4 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/reference_grid_audit.json` | 0.5 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/reproducibility_report.json` | 2.4 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/source_metadata/source_scene_manifest.json` | 10.2 KB | Documentation/reference | **YES** | NO | Reproducibility metadata, grid alignment audit, and scene manifests. |
| `data/experimental/multidate_nisar/barpeta/statistics/threshold_sensitivity_table.csv` | 0.9 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/timeseries_summary.json` | 23.3 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/timeseries_table.csv` | 2.0 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_22_2026-06-03.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_23_2026-06-15.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_24_2026-06-27.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_25_2026-07-09.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_26_2026-07-21.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_27_2026-08-02.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_28_2026-08-14.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/statistics/water_summary_cycle_29_2026-08-26.json` | 2.7 KB | Required scientific data | **YES** | **YES** | Multi-temporal timeseries inundation summary table and metrics. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_22_2026-06-03.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_23_2026-06-15.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_24_2026-06-27.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_25_2026-07-09.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_26_2026-07-21.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_27_2026-08-02.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_28_2026-08-14.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/barpeta/water_masks/water_mask_cycle_29_2026-08-26.npy` | 14.2 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/majuli/source_metadata/candidate_scenes_audit.json` | 5.7 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/majuli/statistics/water_summary_cycle_029_2026-08-27.json` | 1.9 KB | Development/testing support | **YES** | NO | Supporting project file. |
| `data/experimental/multidate_nisar/reports/MULTIDATE_SCIENTIFIC_VALIDATION.md` | 14.4 KB | Unnecessary/obsolete | NO (Duplicate) | NO | Duplicate copy of root scientific reports (retained locally, safe to untrack). |
| `data/experimental/multidate_nisar/reports/MULTIDATE_WATER_ANALYSIS_REPORT.md` | 12.7 KB | Unnecessary/obsolete | NO (Duplicate) | NO | Duplicate copy of root scientific reports (retained locally, safe to untrack). |
| `data/experimental/multidate_nisar/reports/NEXT_PHASE_RECOMMENDATIONS.md` | 7.5 KB | Unnecessary/obsolete | NO (Duplicate) | NO | Duplicate copy of root scientific reports (retained locally, safe to untrack). |
| `data/experimental/multidate_nisar/reports/NISAR_VERIFIED_SCENE_MANIFEST.md` | 10.0 KB | Unnecessary/obsolete | NO (Duplicate) | NO | Duplicate copy of root scientific reports (retained locally, safe to untrack). |
| `data/output/NISAR_Flood_Extent_20260709.geojson` | 1.9 KB | Required scientific data | **YES** | **YES** | 13,821 vector flood polygons for Majuli reach served by /api/water/majuli/boundaries. |
| `data/output/footprint_map_brahmaputra.png` | 118.5 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_backscatter_difference_histogram.png` | 74.8 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_change_detection_map.png` | 244.1 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_change_detection_metrics.json` | 0.9 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_flood_hydrograph.png` | 254.8 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_flood_timeseries.csv` | 0.7 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_flood_timeseries_report.json` | 3.5 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_metadata_summary.json` | 2.7 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_sar_temporal_strip.png` | 151.4 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/nisar_temporal_mosaic.png` | 166.1 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/radar_backscatter_hh_grayscale.png` | 169.9 KB | Documentation/reference | **YES** | NO | Static visual inspection strips, hydrographs, and change charts. |
| `data/output/viewers/NISAR_Flood_Classification_20260709_preview.png` | 70.9 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_GCOV_025_019_D_075_HH_preview.png` | 118.1 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001_histogram.png` | 48.8 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001_preview.png` | 259.9 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001_report.html` | 6.9 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001_histogram.png` | 53.6 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001_preview.png` | 251.8 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001_report.html` | 6.9 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_029_019_D_075_2500_CRNA_A_20260826T124208_20260826T124245_P00500_M_F_I_001_histogram.png` | 47.3 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_029_019_D_075_2500_CRNA_A_20260826T124208_20260826T124245_P00500_M_F_I_001_preview.png` | 260.2 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `data/output/viewers/NISAR_S2_PR_GCOV_029_019_D_075_2500_CRNA_A_20260826T124208_20260826T124245_P00500_M_F_I_001_report.html` | 6.9 KB | Documentation/reference | **YES** | NO | Static visual preview PNGs, histograms, and HTML inspection reports. |
| `docs/ARCHITECTURE.md` | 10.0 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/DEMO_SCRIPT.md` | 8.4 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/NISAR_SCENE_AVAILABILITY_AUDIT.md` | 27.5 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/PROJECT_PITCH.md` | 6.2 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/SCIENTIFIC_LIMITATIONS.md` | 9.8 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/DATA_EVIDENCE.md` | 10.0 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/DEMO_SCRIPT.md` | 5.3 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/FINAL_COMPLETION_REPORT.md` | 9.6 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/FINAL_PITCH.md` | 5.3 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/FINAL_VERIFICATION.md` | 8.1 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/METHODOLOGY.md` | 8.6 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/NASA_CHALLENGE_ALIGNMENT.md` | 9.1 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/PROJECT_OVERVIEW.md` | 6.6 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/PROJECT_STORY.md` | 7.1 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/REFERENCES.md` | 4.3 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/final_submission/SCIENTIFIC_RESEARCH.md` | 11.9 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/barpeta_comparison_screenshot.png` | 198.2 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/barpeta_scientist_mode.png` | 184.1 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/barpeta_screenshot.png` | 178.2 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_about_project.png` | 231.5 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_data_methodology.png` | 226.6 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_flood_monitor.png` | 7.0 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_flood_monitor_barpeta.png` | 119.9 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_flood_monitor_majuli.png` | 116.5 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/bright_how_it_works.png` | 273.2 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/inspector_screenshot.png` | 145.9 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/journey_a_majuli.png` | 113.4 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/journey_b_barpeta.png` | 119.6 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/journey_c_unsupported.png` | 107.5 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/majuli_scientist_mode.png` | 183.2 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/majuli_scientist_screenshot.png` | 150.8 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/majuli_screenshot.png` | 417.5 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/methodology_screenshot.png` | 183.8 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `docs/screenshots/overview_screenshot.png` | 131.1 KB | Documentation/reference | **YES** | NO | Evaluation documentation, pitch presentations, and challenge narratives. |
| `frontend/.env.example` | 0.5 KB | Required configuration | **YES** | NO | Sanitized environment template or Git exclusion specification. |
| `frontend/index.html` | 1.2 KB | Essential application source | **YES** | **YES** | Core React root, styling, or HTML entrypoint. |
| `frontend/package-lock.json` | 104.0 KB | Required configuration | **YES** | Build Only | Vite/Tailwind/PostCSS bundler build configuration. |
| `frontend/package.json` | 0.6 KB | Required configuration | **YES** | Build Only | Vite/Tailwind/PostCSS bundler build configuration. |
| `frontend/postcss.config.js` | 0.1 KB | Required configuration | **YES** | Build Only | Vite/Tailwind/PostCSS bundler build configuration. |
| `frontend/public/assets/earth_clouds.png` | 3.2 KB | Required deployment asset | **YES** | **YES** | Static visual texture or logo asset bundled into dist/. |
| `frontend/public/assets/earth_daymap.jpg` | 452.2 KB | Required deployment asset | **YES** | **YES** | Static visual texture or logo asset bundled into dist/. |
| `frontend/public/assets/nisar_satellite.png` | 563.2 KB | Required deployment asset | **YES** | **YES** | Static visual texture or logo asset bundled into dist/. |
| `frontend/public/assets/radar_rhythms_logo.jpg` | 66.4 KB | Required deployment asset | **YES** | **YES** | Static visual texture or logo asset bundled into dist/. |
| `frontend/src/App.jsx` | 20.0 KB | Essential application source | **YES** | **YES** | Core React root, styling, or HTML entrypoint. |
| `frontend/src/components/AboutProjectView.jsx` | 8.3 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/AnalyticsPanel.jsx` | 18.3 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/BarpetaStudyHeader.jsx` | 9.6 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/CinematicHomepage.jsx` | 8.5 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/DataMethodologyView.jsx` | 8.8 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/DateSelector.jsx` | 20.2 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/DisasterAlertPanel.jsx` | 9.6 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/ErrorBoundary.jsx` | 1.8 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/GlassGridOverlay.jsx` | 5.5 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/HDF5Inspector.jsx` | 8.5 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/HowItWorksView.jsx` | 4.8 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/MajuliStudyHeader.jsx` | 6.7 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/MapViewer.jsx` | 29.4 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/Navbar.jsx` | 4.2 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/NisarCinematicEarth.jsx` | 18.4 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/PersonaSwitcher.jsx` | 2.6 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/PresentationModal.jsx` | 12.0 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/ReachSummaryTable.jsx` | 5.1 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/RegionSelector.jsx` | 8.8 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/ScientificExplain.jsx` | 4.0 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/ScientistRadarPanel.jsx` | 10.1 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/StudentCitizenPanel.jsx` | 6.6 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/SwipeSlider.jsx` | 16.6 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/WavelengthSimulator.jsx` | 9.4 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/WhatChangedCard.jsx` | 11.0 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/components/WorkspaceTabs.jsx` | 4.1 KB | Essential application source | **YES** | **YES** | React UI presentation and interaction component. |
| `frontend/src/index.css` | 6.4 KB | Essential application source | **YES** | **YES** | Core React root, styling, or HTML entrypoint. |
| `frontend/src/main.jsx` | 0.3 KB | Essential application source | **YES** | **YES** | Core React root, styling, or HTML entrypoint. |
| `frontend/src/utils/apiConfig.js` | 0.9 KB | Essential application source | **YES** | **YES** | Frontend utility for network, audio, or configuration. |
| `frontend/src/utils/audio.js` | 0.2 KB | Essential application source | **YES** | **YES** | Frontend utility for network, audio, or configuration. |
| `frontend/tailwind.config.js` | 1.3 KB | Required configuration | **YES** | Build Only | Vite/Tailwind/PostCSS bundler build configuration. |
| `frontend/vite.config.js` | 0.3 KB | Required configuration | **YES** | Build Only | Vite/Tailwind/PostCSS bundler build configuration. |
| `new_timeline_product.py` | 2.9 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |
| `nisar_change_detection.py` | 19.1 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |
| `nisar_dataset_inspection.py` | 12.2 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |
| `nisar_timeseries_analysis.py` | 30.7 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |
| `notebooks/nisar_change_detection.ipynb` | 7.2 KB | Documentation/reference | **YES** | NO | Jupyter exploratory notebooks documenting scientific workflows. |
| `notebooks/nisar_dataset_exploration.ipynb` | 3.7 KB | Documentation/reference | **YES** | NO | Jupyter exploratory notebooks documenting scientific workflows. |
| `notebooks/nisar_timeseries_analysis.ipynb` | 4.2 KB | Documentation/reference | **YES** | NO | Jupyter exploratory notebooks documenting scientific workflows. |
| `notebooks/test_range_access.py` | 2.7 KB | Documentation/reference | **YES** | NO | Jupyter exploratory notebooks documenting scientific workflows. |
| `run_backend.bat` | 0.3 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `run_backend.ps1` | 0.3 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `run_frontend.bat` | 0.1 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `run_frontend.ps1` | 0.1 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `start_floodwatch.bat` | 1.3 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `start_floodwatch.ps1` | 1.8 KB | Development/testing support | **YES** | NO | One-click developer launcher and full-stack startup script. |
| `verify_system.py` | 7.5 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |
| `view_nisar_data.py` | 19.3 KB | Development/testing support | **YES** | NO | Offline scientific processing and validation utility script. |