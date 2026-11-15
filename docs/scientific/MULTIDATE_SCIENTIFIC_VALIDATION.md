# Multi-Date Scientific Validation & Quality Assessment (Audit & Correction)
## Brahmaputra FloodWatch — NASA Space Apps Challenge 2026 (*Dancing with the SARs*)
### Document Reference: `MULTIDATE_SCIENTIFIC_VALIDATION.md`
**Author:** Science & Geospatial Intelligence Team  
**Audit & Revision Date:** November 14, 2026  
**Status:** Audited, Corrected, and Empirically Validated  
**Subject:** Rigorous Geodetic, Radiometric, and Hydrological Validation of Multi-Epoch NISAR Observations

---

## 1. Executive Summary of Corrections

Following an independent scientific audit, this document corrects previous overstatements and establishes a verified, reproducible validation record for the multi-epoch NISAR Level-2 GCOV analysis over **Barpeta / Lower Brahmaputra** (Track 019, Frame 075, Descending) and **Majuli Island Reach** (Track 015, Frame 3700, Ascending).

### Key Audit Corrections Implemented:
1. **Geometric Fidelity Terminology Corrected:**
   - *Previous claim:* "Zero geometric distortion across all repeat cycles."
   - *Corrected scientific finding:* **Zero map-grid registration offset (identical discrete UTM Zone 46N grid alignment with $0.00000000\text{ m}$ coordinate difference across all 14,400 cells)**. Geometric distortion (e.g., local terrain-induced layover, foreshortening, and DEM geocoding error) is inherent to radar physics; what is verified is exact geodetic raster co-registration, which enables pixel-by-pixel change detection without resampling artifacts.
2. **Mask Decoding & Specification-Based Verification:**
   - *Previous claim:* Assumed `mask == 0` meant valid without citing the product specification.
   - *Corrected scientific finding:* Decoded the NISAR Level-2 GCOV 8-bit mask bitmask specification. Confirmed that Bit 0 (value 0) designates unimpeded valid radiometric observations, while non-zero values flag radar shadow, geometric layover, and NoData bounds. All 8 Barpeta scenes were individually audited: each contains exactly 14,400 pixels with mask value 0 (100.00% valid observation data).
3. **Polarization Disambiguation (`CRNA` vs `HHHH`/`HVHV`):**
   - *Previous claim:* Informally referenced Barpeta as a dual-pol HH/HV dataset.
   - *Corrected scientific finding:* Documented the contradiction between the `CRNA` filename token (Compact Polarimetry Right-circular transmit) and the internal datasets (`HHHH` and `HVHV`). Because compact-pol dual-channel data require Stokes parameter decomposition and cannot be treated as standard linear dual-pol, **only the verified single-pol `HHHH` covariance dataset was ingested for automated water classification**. Cross-polarization indices (RVI, depolarization ratio) were not calculated and are not claimed.
4. **Hydrological Claims Refined:**
   - *Previous claim:* Described 09 July as the "confirmed seasonal flood peak" and the 8-epoch dataset as a "complete hydrological hydrograph."
   - *Corrected scientific finding:* Replaced with **"highest observed water extent within the 8-epoch 12-day discrete satellite observation sequence."** Without continuous ground-level river gauge hydrographs (e.g. CWC hydrometry), satellite passes spaced 12 days apart cannot confirm whether the absolute crest occurred on 09 July or during the intervening sampling intervals.
5. **Threshold Sensitivity Range Recomputed:**
   - *Previous report:* Reported a sensitivity range of $1.451\text{ km}^2$ for Cycle 025 by comparing only the four fixed thresholds and omitting the adaptive Otsu result.
   - *Corrected scientific finding:* When the adaptive Otsu result ($-16.40\text{ dB}$, yielding $3.997\text{ km}^2$) is included in the comparison across all candidate methods, the true sensitivity spread for Cycle 025 is **$3.142\text{ km}^2$ ($34.33\%$ of the corridor area)**, demonstrating the profound impact of threshold selection during widespread inundation.

---

## 2. Geodetic Alignment Audit (Barpeta Scenes, Cycles 022–029)

### 2.1 Coordinate Comparison against Production Baseline (Cycle 024)
Each of the 8 local Barpeta HDF5 files was evaluated against the production reference baseline:
- **Reference Granule:** `NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001.h5`
- **CRS:** WGS 84 / UTM Zone 46N (`EPSG:32646`)
- **Dimensions:** 120 rows $\times$ 120 columns ($14,400$ pixels)
- **Pixel Spacing:** $\Delta X = +25.2100840336\text{ m}$, $\Delta Y = -25.2100840337\text{ m}$
- **Pixel Area:** $635.54833698\text{ m}^2$

| Cycle | Acquisition Date | Granule Identifier | Max Coordinate Difference ($\text{m}$) | Spatial Overlap | CRS Match | Alignment Status |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|
| **022** | 2026-06-03 | `NISAR_..._022_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **023** | 2026-06-15 | `NISAR_..._023_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **024** | 2026-06-27 | `NISAR_..._024_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Reference Baseline)** |
| **025** | 2026-07-09 | `NISAR_..._025_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **026** | 2026-07-21 | `NISAR_..._026_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **027** | 2026-08-02 | `NISAR_..._027_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **028** | 2026-08-14 | `NISAR_..._028_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |
| **029** | 2026-08-26 | `NISAR_..._029_019_D_075_...` | **0.0000000000 m** | 100.00% | True | **PASS (Exact Co-Registration)** |

**Conclusion:** All 8 scenes coincide on the exact same UTM Zone 46N grid down to sub-nanometre numerical precision. Pixel-by-pixel differencing is geometrically valid without requiring spatial interpolation or resampling.

---

## 3. Mask Decoding & Data Validity Audit

### 3.1 Specification Definition
In the official NASA/ISRO SAR Mission Level-2 GCOV specification (JPL D-102275), `/science/SSAR/GCOV/grids/frequencyA/mask` is an 8-bit unsigned integer bitmask:
- `Value 0`: Valid radiometric radar observation (unobstructed by terrain, inside valid radar swath).
- `Bit 0 (1)`: Radar shadow.
- `Bit 1 (2)`: Geometric layover.
- `Bit 2 (4)`: Radiometric or processing invalidity.
- `Bit 3 (8)`: Out of swath / NoData.

### 3.2 Observed Distribution
Every scene was parsed element-by-element across all 14,400 cells:

| Cycle | Acquisition Date | Raw Mask Distribution | Valid Pixels (`mask == 0`) | Invalid Pixels (`mask != 0`) | Non-Positive / NaN HH Pixels | Combined Valid Pixels | Excluded Pixels |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **022** | 2026-06-03 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **023** | 2026-06-15 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **024** | 2026-06-27 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **025** | 2026-07-09 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **026** | 2026-07-21 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **027** | 2026-08-02 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **028** | 2026-08-14 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |
| **029** | 2026-08-26 | `{0: 14400}` | 14,400 | 0 | 0 | **14,400 (100.0%)** | **0** |

All raw linear $\gamma^0_{HH}$ values are strictly positive finite numbers ($0.0024 \le \gamma^0_{HH} \le 0.7534$), with zero NaNs, zeros, or negative values. The combined valid dataset across all 8 dates is **100.00% complete**.

---

## 4. Polarization Disambiguation: `CRNA` vs `HHHH`/`HVHV`

### 4.1 Specification Contradiction
The file identifier contains the mode token `CRNA`:
- `CR` designates **Compact Polarimetry** (Right-circular transmission, linear H and V reception).
- Under standard compact polarimetry, raw measurements are $S_{RH}$ and $S_{RV}$, yielding covariance elements $C_{11} = \langle |S_{RH}|^2 \rangle$, $C_{22} = \langle |S_{RV}|^2 \rangle$, and $C_{12} = \langle S_{RH} S_{RV}^* \rangle$.
- In the local HDF5 files, however, datasets are labeled `HHHH` and `HVHV` with attributes:
  - `HHHH: long_name = "Co-polarized HH gamma-0 backscatter power"`
  - `HVHV: long_name = "Cross-polarized HV gamma-0 backscatter power"`

### 4.2 Scientific Protocol Implemented
Until ISRO/NASA documentation clarifies whether these layers represent:
- A naming misdesignation in test-run Level-2 metadata, OR
- Pseudo-linear synthesized terms reconstructed from the compact-pol Stokes vector,

**the following scientific constraints are enforced:**
1. The analysis is strictly designated a **Single-Polarization $HHHH$ Analysis**.
2. No automated cross-polarization ($HV$) water classifier is implemented.
3. No polarimetric decomposition indices (RVI, depolarization ratio, FVI) are derived.
4. Raw $HVHV$ values are preserved in the archive without modification.

---

## 5. Threshold Sensitivity & Methodological Comparison

To evaluate classification stability, we compared the adaptive Otsu threshold against four fixed thresholds across all 8 dates.

> **Important Scientific Principle:** Threshold sensitivity measures the dispersion of classified area across candidate threshold selections; it does **not** represent classification error or ground-truth accuracy.

| Cycle | Acquisition Date | Adaptive Otsu Threshold | Otsu Water ($\text{km}^2$) | Fixed -18.5 dB Water ($\text{km}^2$) | Fixed -20.0 dB Water ($\text{km}^2$) | Fixed -20.28 dB Water ($\text{km}^2$) | Fixed -22.0 dB Water ($\text{km}^2$) | Spread Across All 5 Methods ($\text{km}^2$) | Spread (% of Corridor) | Spread Across Fixed Only ($\text{km}^2$) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **022** | 2026-06-03 | -20.54 dB | **0.862** | 0.862 | 0.862 | 0.862 | 0.771 | **0.091 km²** | 0.99% | 0.091 km² |
| **023** | 2026-06-15 | -17.70 dB | **1.223** | 1.223 | 1.223 | 1.222 | 1.102 | **0.121 km²** | 1.32% | 0.121 km² |
| **024** | 2026-06-27 | -20.28 dB | **1.660** | 1.660 | 1.660 | 1.660 | 1.124 | **0.536 km²** | 5.86% | 0.536 km² |
| **025** | 2026-07-09 | -16.40 dB | **3.997** | 3.997 | 3.975 | 3.953 | 0.855 | **3.142 km²** | **34.33%** | 3.142 km² |
| **026** | 2026-07-21 | -16.40 dB | **2.725** | 2.705 | 1.961 | 1.461 | 0.760 | **1.965 km²** | 21.47% | 1.945 km² |
| **027** | 2026-08-02 | -16.66 dB | **2.021** | 2.018 | 1.858 | 1.631 | 0.770 | **1.251 km²** | 13.67% | 1.248 km² |
| **028** | 2026-08-14 | -16.66 dB | **2.377** | 2.376 | 2.254 | 2.102 | 0.914 | **1.463 km²** | 15.99% | 1.462 km² |
| **029** | 2026-08-26 | -20.28 dB | **0.862** | 0.862 | 0.862 | 0.862 | 0.753 | **0.109 km²** | 1.19% | 0.109 km² |

### Sensitivity Analysis Findings:
1. **Low-Water Regimes Show Exceptional Robustness:**
   During pre-monsoon low flow (June 03) and late-monsoon drainage (August 26), the spread across all five candidate methods is less than **$0.12\text{ km}^2$ (<1.3% of the corridor)**. The radiometric contrast between the calm river thalweg ($\approx -22.7\text{ dB}$) and dry floodplain surfaces ($\approx -11.1\text{ dB}$) is over $11.6\text{ dB}$, making water delineation largely insensitive to threshold choice.
2. **Inundation Regimes Show High Sensitivity:**
   During the 09 July observation, when shallow, wind-roughened floodwaters cover the floodplain, water backscatter rises toward $-18\text{ dB}$ to $-16\text{ dB}$.
   - Otsu selects $-16.40\text{ dB}$, capturing $3.997\text{ km}^2$.
   - A conservative threshold of $-22.0\text{ dB}$ captures only $0.855\text{ km}^2$ (the deep-water channel), demonstrating a sensitivity spread of **$3.142\text{ km}^2$ ($34.33\%$ of the corridor)**.
   - This reinforces the necessity of adaptive thresholding over fixed thresholding in monsoonal floodplain environments.

---

## 6. Controlled Consecutive Pairwise Change Accounting

The 7 consecutive pairwise transitions were recomputed under strict validity rules:
- Stable land, persistent water, newly inundated water, and receded water are assigned **only** within common valid pixels (`v1 & v2`).
- Invalid pixels are assigned `255` (NoData) and never counted as land or water.
- Intervals are computed dynamically from exact UTC timestamps.

| Transition | Baseline Date | Event Date | Interval (Days) | Persistent Water ($\text{km}^2$) | Newly Inundated ($\text{km}^2$) | Receded Water ($\text{km}^2$) | Stable Land ($\text{km}^2$) | Common Valid ($\text{km}^2$) | NoData ($\text{km}^2$) | Net Change ($\text{km}^2$) | % Change |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **P-1** | 2026-06-03 | 2026-06-15 | 12.0000 d | 0.862 | 0.361 | 0.000 | 7.929 | 9.152 | 0.000 | **+0.361** | **+41.89%** |
| **P-2** | 2026-06-15 | 2026-06-27 | 12.0000 d | 1.030 | 0.630 | 0.193 | 7.299 | 9.152 | 0.000 | **+0.437** | **+35.76%** |
| **P-3** | 2026-06-27 | 2026-07-09 | 12.0000 d | 1.660 | 2.337 | 0.000 | 5.155 | 9.152 | 0.000 | **+2.337** | **+140.77%** |
| **P-4** | 2026-07-09 | 2026-07-21 | 12.0000 d | 2.634 | 0.091 | 1.363 | 5.064 | 9.152 | 0.000 | **-1.272** | **-31.83%** |
| **P-5** | 2026-07-21 | 2026-08-02 | 12.0000 d | 2.021 | 0.000 | 0.704 | 6.427 | 9.152 | 0.000 | **-0.704** | **-25.82%** |
| **P-6** | 2026-08-02 | 2026-08-14 | 12.0000 d | 2.021 | 0.356 | 0.000 | 6.775 | 9.152 | 0.000 | **+0.356** | **+17.62%** |
| **P-7** | 2026-08-14 | 2026-08-26 | 12.0000 d | 0.862 | 0.000 | 1.515 | 6.775 | 9.152 | 0.000 | **-1.515** | **-63.74%** |

In all 7 transitions, the mathematical identity holds:
$$\text{Persistent} + \text{Newly Inundated} + \text{Receded} + \text{Stable Land} = \text{Common Valid} = 9.152\text{ km}^2 \quad (\text{NoData} = 0.000\text{ km}^2)$$

---

## 7. Remaining Scientific Limitations & Uncertainties

1. **Discrete 12-Day Sampling vs Continuous Hydrograph:**
   The satellite time series provides discrete 12-day snapshots. Ephemeral hydrograph peaks that occurred between satellite passes (e.g., between 27 June and 09 July) are not recorded.
2. **Emergent Flooded Vegetation:**
   In single-pol $HHHH$, flooded vegetation exhibits double-bounce enhancement, elevating backscatter into the land range. These areas are classified as non-water.
3. **Specular Non-Water Confusion:**
   Extremely smooth, dry sandbars or paved runways can produce specular reflection mimicking open water.
4. **Lack of In-Situ Hydrometric Gauging:**
   Water extents have not been calibrated against Central Water Commission (CWC) stage gauges. Satellite water area must not be conflated with river discharge ($m^3/s$) or flood danger levels.
