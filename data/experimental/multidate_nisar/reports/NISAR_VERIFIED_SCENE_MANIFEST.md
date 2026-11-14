# NISAR Verified Scene Manifest
## Brahmaputra FloodWatch — NASA Space Apps Challenge 2026 (*Dancing with the SARs*)
### Document Reference: `NISAR_VERIFIED_SCENE_MANIFEST.md`
**Author:** Science & Geospatial Intelligence Team  
**Verification Date:** November 14, 2026  
**Status:** Complete — Phase 2 Verified Scientific Dataset  
**Scope:** Multi-epoch NISAR Level-2 GCOV observations for Majuli Reach and Barpeta Corridor

---

## 1. Overview and Purpose

This manifest documents all verified NASA-ISRO Synthetic Aperture Radar (**NISAR**) Level-2 Geocoded Polarimetric Covariance (**GCOV**) scenes evaluated for extending the multi-date flood inundation and surface water dynamics monitoring system in the Brahmaputra River Basin, Assam, India.

Every scene listed below has been evaluated for:
1. Physical availability (local HDF5 file / local GIS subset / authoritative STAC catalogue record).
2. Orbital geometry compatibility (Track, Frame, Relative Orbit, Pass Direction, Look Vector).
3. Coordinate reference system and pixel grid consistency.
4. Polarization layer contents, metadata attributes, and physical interpretation.
5. Data validity and mask coverage.

---

## 2. Complete Candidate Scene Inventory

### 2.1 Barpeta Study Corridor — Track 019, Frame 075, Descending Pass (Lower Brahmaputra Floodplain)
- **Reference Grid:** EPSG:32646 (WGS 84 / UTM zone 46N)
- **Pixel Spacing:** 25.210084 m $\times$ 25.210084 m (Pixel Area: 635.5483 m²)
- **Raster Dimensions:** 120 rows $\times$ 120 columns (14,400 pixels = 9.1519 km²)
- **Center Coordinates:** ~91.105°E, 26.645°N

| Granule Reference | Granule Identifier | Cycle | Date (UTC) | UTC Time | Orbit / Track / Frame | Pass | Mode | Pol Layers | Local Status | Catalogue Verification | Compatibility Category | Processing Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **B-01** | `NISAR_S2_PR_GCOV_022_019_D_075_2500_CRNA_A_20260603T124208_20260603T124245_P00500_M_F_I_001` | 022 | 2026-06-03 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |
| **B-02** | `NISAR_S2_PR_GCOV_023_019_D_075_2500_CRNA_A_20260615T124208_20260615T124245_P00500_M_F_I_001` | 023 | 2026-06-15 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |
| **REF-B1** | `NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001` | 024 | 2026-06-27 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Production Baseline** |
| **REF-B2** | `NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001` | 025 | 2026-07-09 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Production Event** |
| **B-03** | `NISAR_S2_PR_GCOV_026_019_D_075_2500_CRNA_A_20260721T124208_20260721T124245_P00500_M_F_I_001` | 026 | 2026-07-21 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |
| **B-04** | `NISAR_S2_PR_GCOV_027_019_D_075_2500_CRNA_A_20260802T124208_20260802T124245_P00500_M_F_I_001` | 027 | 2026-08-02 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |
| **B-05** | `NISAR_S2_PR_GCOV_028_019_D_075_2500_CRNA_A_20260814T124208_20260814T124245_P00500_M_F_I_001` | 028 | 2026-08-14 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |
| **B-06** | `NISAR_S2_PR_GCOV_029_019_D_075_2500_CRNA_A_20260826T124208_20260826T124245_P00500_M_F_I_001` | 029 | 2026-08-26 | 12:42:08Z | 019 / 019 / 075 | Desc | CRNA | HHHH, HVHV | Local H5 (`data/nisar_products/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Processed (Phase 2)** |

---

### 2.2 Majuli Study Reach — Track 015, Frame 3700, Ascending Pass (Upper/Central Brahmaputra River Island)
- **Reference Grid:** EPSG:32646 (WGS 84 / UTM zone 46N)
- **Pixel Spacing:** 10.0 m $\times$ 10.0 m (Pixel Area: 100.0 m²)
- **Raster Dimensions:** 8,948 rows $\times$ 10,008 columns (89,551,584 pixels = 8,955.158 km²)
- **Center Coordinates:** ~94.10°E, 26.95°N

| Granule Reference | Granule Identifier | Cycle | Date (UTC) | UTC Time | Orbit / Track / Frame | Pass | Mode | Pol Layers | Local Status | Catalogue Verification | Compatibility Category | Processing Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **REF-M** | `NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001` | 029 | 2026-08-27 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Local Subset (`data/output/subsets/`) | ISRO Bhoonidhi / ASF DAAC | **A (Strongly Compatible)** | **Production Reference** |
| **M-01** | `NISAR_S2_PR_GCOV_031_040_A_015_3700_DHNA_A_20260920T230526_20260920T230602_P00500_M_F_I_001` | 031 | 2026-09-20 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi STAC API | **A (Strongly Compatible)** | **Pending Download Approval** |
| **M-02** | `NISAR_S2_PR_GCOV_030_040_A_015_3700_DHNA_A_20260908T230526_20260908T230602_P00500_M_F_I_001` | 030 | 2026-09-08 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi / NASA Earthdata | **A (Strongly Compatible)** | **Pending Download Approval** |
| **M-03** | `NISAR_S2_PR_GCOV_028_040_A_015_3700_DHNA_A_20260815T230526_20260815T230602_P00500_M_F_I_001` | 028 | 2026-08-15 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi / ASF Vertex | **A (Strongly Compatible)** | **Pending Download Approval** |
| **M-04** | `NISAR_S2_PR_GCOV_027_040_A_015_3700_DHNA_A_20260803T230526_20260803T230602_P00500_M_F_I_001` | 027 | 2026-08-03 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi / ASF Vertex | **A (Strongly Compatible)** | **Pending Download Approval** |
| **M-05** | `NISAR_S2_PR_GCOV_026_040_A_015_3700_DHNA_A_20260722T230526_20260722T230602_P00500_M_F_I_001` | 026 | 2026-07-22 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi / NASA Earthdata | **A (Strongly Compatible)** | **Pending Download Approval** |
| **M-06** | `NISAR_S2_PR_GCOV_025_040_A_015_3700_DHNA_A_20260710T230526_20260710T230602_P00500_M_F_I_001` | 025 | 2026-07-10 | 23:05:26Z | 040 / 015 / 3700 | Asc | DHNA | HHHH, HVHV | Remote (~12.6 GB raw / 850 MB subset) | ISRO Bhoonidhi / NASA Earthdata | **A (Strongly Compatible)** | **Pending Download Approval** |

---

## 3. Physical Metadata and Compatibility Verification

### 3.1 Spatial Grid Alignment (Zero Parallax Verification)
- **Barpeta Scenes (B-01 to B-06, REF-B1, REF-B2):**
  - All 8 scenes share the exact spatial grid:
    - $X \in [310000.0, 313000.0\text{ m}]$, $\Delta X = +25.2100840336\text{ m}$ (120 columns)
    - $Y \in [2950000.0, 2947000.0\text{ m}]$, $\Delta Y = -25.2100840336\text{ m}$ (120 rows)
  - Coordinate difference between scenes across all 14,400 cells is identically $0.00000000\text{ m}$.
  - Spatial overlap is **100.00%**.
- **Majuli Reference Grid:**
  - $X \in [559370.0, 659450.0\text{ m}]$, $\Delta X = +10.0\text{ m}$ (10,008 columns)
  - $Y \in [3020680.0, 2931200.0\text{ m}]$, $\Delta Y = -10.0\text{ m}$ (8,948 rows)
  - Bounding box: $8,955.158\text{ km}^2$.

### 3.2 Data Validity and Mask Layers
- In all 8 Barpeta H5 files, the internal dataset `/science/SSAR/GCOV/grids/frequencyA/mask` (`uint8`) was evaluated.
- In all 8 scenes, exactly 14,400 out of 14,400 pixels possess mask value `0` (valid data). No shadow, layover, or NoData artifacts exist inside the study corridor.
- In the Majuli reference subset, 89,551,584 pixels (100.00%) have valid mask bits.

### 3.3 Polarization Disambiguation: `CRNA` vs `DHNA`
- The file naming convention for Barpeta uses `CRNA` (Compact Right-circular Normal-bandwidth Frequency A).
- However, physical inspection of the internal HDF5 containers confirms that the stored 2D datasets are:
  - `HHHH`: `long_name: "Co-polarized HH gamma-0 backscatter power"`, `units: "1"` (linear float32)
  - `HVHV`: `long_name: "Cross-polarized HV gamma-0 backscatter power"`, `units: "1"` (linear float32)
- For this scientific data processing phase:
  - Only the verified `HHHH` channel is ingested for direct comparison against the established production algorithm.
  - The `HVHV` cross-polarization channel is recorded and archived for statistical evaluation, but not used as a water classifier.
  - No channel has been renamed, relabeled, or misrepresented.

---

## 4. Processing Eligibility Summary

1. **Barpeta Multi-Date Sequence (Cycles 022–029):**
   - **Status:** **100% Processed and Verified.**
   - All 8 epochs processed from local H5 granules. Single-date water masks, backscatter decibel rasters, and consecutive pairwise change matrices generated and saved in `data/experimental/multidate_nisar/barpeta/`.
2. **Majuli Single-Date Reference (Cycle 029):**
   - **Status:** **100% Verified and Documented.**
   - Production reference metrics (797.55 km² water, 8.91% coverage) ingested into `data/experimental/multidate_nisar/majuli/statistics/`.
3. **Majuli Remote Multi-Epoch Sequence (Cycles 025, 026, 027, 028, 030, 031):**
   - **Status:** **Catalogue Verified; Download Pending User Approval.**
   - Download details, endpoints, and estimated payloads documented (~12.6 GB per granule, or ~850 MB per cropped spatial subset). In compliance with scientific protocol, zero unauthorized bulk downloads were executed.

