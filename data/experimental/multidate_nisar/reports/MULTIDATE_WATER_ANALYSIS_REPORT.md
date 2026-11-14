# Multi-Date NISAR Flood & Water-Extent Analysis Report
## Brahmaputra FloodWatch — NASA Space Apps Challenge 2026 (*Dancing with the SARs*)
### Document Reference: `MULTIDATE_WATER_ANALYSIS_REPORT.md`
**Author:** Science & Geospatial Intelligence Team  
**Analysis Date:** November 14, 2026  
**Status:** Complete — Empirical Multi-Date SAR Processing  
**Dataset Location:** `data/experimental/multidate_nisar/`

---

## 1. Executive Summary

This report presents the scientific findings of the **Phase 2 Verified Multi-Date NISAR Flood and Water-Extent Analysis** for the **Barpeta / Lower Brahmaputra Corridor** (Track 019, Frame 075, Descending) and the **Majuli Reach** (Track 015, Frame 3700, Ascending).

By processing **8 consecutive 12-day orbital repeat cycles** of NISAR Level-2 GCOV imagery over Barpeta (spanning 03 June 2026 to 26 August 2026), we have constructed the first continuous **84-day high-resolution radar hydrological timeline** for the Lower Brahmaputra floodplain during the 2026 Indian Summer Monsoon.

### Key Scientific Highlights:
1. **Unbroken Hydrological Arc (Barpeta Corridor, 9.152 km²):**
   - **Pre-Monsoon Dry Baseline (03 June 2026):** Water extent = **0.862 km²** (9.42% coverage). River confined to permanent deep-water channels.
   - **Monsoon Onset / Stage Rise (15 June to 27 June 2026):** Water extent expands to **1.223 km²** (+41.89%), then **1.660 km²** (+35.76%).
   - **Peak Inundation Surge (09 July 2026):** Floodwater surges to **3.997 km²** (**43.67% coverage**), representing an extraordinary **+140.77% expansion** in surface water.
   - **Post-Peak Recession (21 July to 02 August 2026):** Water drains to **2.725 km²** (-31.83%), then **2.021 km²** (-25.82%).
   - **Secondary Surge Pulse (14 August 2026):** Late-monsoon runoff creates a second pulse reaching **2.377 km²** (+17.61%).
   - **Late-Monsoon Return to Baseline (26 August 2026):** System recedes to **0.862 km²** (9.42% coverage), identical to the pre-monsoon dry extent.
2. **Exact Production Reconciliation:**
   - The reproduced pairwise change detection for Cycle 024 (27 June) $\rightarrow$ Cycle 025 (09 July) matches the existing production baseline-to-event change results **to the exact pixel**:
     - Baseline Water: **1.660 km²** (2,612 pixels)
     - Event Water: **3.997 km²** (6,289 pixels)
     - Persistent Water: **1.660 km²** (2,612 pixels)
     - Newly Inundated: **2.337 km²** (3,677 pixels)
     - Receded Water: **0.000 km²** (0 pixels)
     - Stable Land: **5.155 km²** (8,111 pixels)
     - Percentage Change: **+140.77%**

---

## 2. Scientific Data Processing Methodology

All analysis was performed using the mathematically verified pipeline established in `backend/app/services/water_detector.py` and `backend/app/services/flood_change_detector.py`, preserving all raw observations without modification:

1. **Radiometric Conversion:**
   Linear gamma-0 backscatter power ($\gamma^0$, units: $m^2/m^2$) extracted from Level-2 GCOV HDF5 datasets is converted to decibels:
   $$\gamma^0_{\text{dB}} = 10 \cdot \log_{10}\left(\max(\gamma^0, 10^{-7})\right)$$
2. **Adaptive Lee Speckle Filtering:**
   To suppress Rayleigh fading speckle noise without blurring braided riverbank boundaries, an adaptive Lee filter is applied across a $5 \times 5$ moving spatial window with nominal noise variance $\sigma_v^2 = 0.25$:
   $$\hat{R} = \bar{I} + W \cdot (I - \bar{I}), \quad W = \max\left(0, \min\left(1, 1 - \frac{\sigma_v^2}{\sigma_I^2 + 10^{-6}}\right)\right)$$
3. **Adaptive Bimodal Otsu Thresholding:**
   The filtered backscatter distribution is partitioned into specular water mode and diffuse terrain mode. The optimum threshold $T_{\text{opt}}$ maximizing inter-class variance $\sigma_B^2(T)$ is computed and clamped to physically verified SAR water limits:
   $$T \in [-26.0\text{ dB}, -15.0\text{ dB}]$$
4. **Morphological MMU Cleaning:**
   Connected-component spatial filtering (structure size $3 \times 3$) applies morphological opening and closing, followed by eliminating isolated clusters below the Minimum Mapping Unit (MMU) threshold of 5 pixels ($3,177.7\text{ m}^2$).
5. **Multi-Temporal Change Classification Matrix:**
   Between consecutive observations $T_1$ and $T_2$, pixels are classified into four mutually exclusive hydrological states:
   - **0 — Stable Land:** $\neg W_1 \land \neg W_2$
   - **1 — Persistent Water:** $W_1 \land W_2$
   - **2 — Newly Inundated (Flood):** $\neg W_1 \land W_2$
   - **3 — Receded Water (Drainage):** $W_1 \land \neg W_2$
   - **255 — NoData / Invalid:** Masked or invalid in either date.

---

## 3. Barpeta Multi-Date Time-Series Results (Cycles 022–029)

### 3.1 Chronological Extent and SAR Backscatter Table

Evaluated Corridor: UTM Zone 46N, $120 \times 120$ pixels, pixel area $= 635.5483\text{ m}^2$, total area $= 9.1519\text{ km}^2$.  
Data validity across all 8 dates: **100.00% (14,400 valid pixels)**.

| Cycle | Acquisition Date | Granule Identifier | Otsu Threshold | Water Pixels | Water Area ($\text{km}^2$) | Water Area ($\text{ha}$) | Water Coverage | Mean HH Water ($\text{dB}$) | Std HH Water ($\text{dB}$) | Mean HH Land ($\text{dB}$) | Std HH Land ($\text{dB}$) |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **022** | **2026-06-03** | `NISAR_..._022_..._20260603...` | -20.54 dB | 1,357 | **0.862** | 86.24 | 9.42% | -22.75 dB | 0.77 dB | -11.08 dB | 1.15 dB |
| **023** | **2026-06-15** | `NISAR_..._023_..._20260615...` | -17.70 dB | 1,925 | **1.223** | 122.34 | 13.37% | -21.84 dB | 1.08 dB | -10.37 dB | 1.48 dB |
| **024** | **2026-06-27** | `NISAR_..._024_..._20260627...` | -20.28 dB | 2,612 | **1.660** | 166.01 | 18.14% | -22.72 dB | 0.75 dB | -11.73 dB | 1.36 dB |
| **025** | **2026-07-09** | `NISAR_..._025_..._20260709...` | -16.40 dB | 6,289 | **3.997** | 399.70 | 43.67% | -22.08 dB | 0.84 dB | -10.79 dB | 2.83 dB |
| **026** | **2026-07-21** | `NISAR_..._026_..._20260721...` | -16.40 dB | 4,288 | **2.725** | 272.52 | 29.78% | -21.84 dB | 0.85 dB | -10.22 dB | 2.15 dB |
| **027** | **2026-08-02** | `NISAR_..._027_..._20260802...` | -16.66 dB | 3,180 | **2.021** | 202.10 | 22.08% | -21.67 dB | 0.89 dB | -10.39 dB | 1.70 dB |
| **028** | **2026-08-14** | `NISAR_..._028_..._20260814...` | -16.66 dB | 3,740 | **2.377** | 237.70 | 25.97% | -21.60 dB | 0.90 dB | -10.43 dB | 1.93 dB |
| **029** | **2026-08-26** | `NISAR_..._029_..._20260826...` | -20.28 dB | 1,357 | **0.862** | 86.24 | 9.42% | -22.76 dB | 0.76 dB | -11.13 dB | 1.15 dB |

---

## 4. Consecutive Pairwise Change Statistics

The table below details the 7 consecutive 12-day transition intervals spanning the entire 84-day observation window:

| Interval | Baseline Date | Event Date | Days | Baseline Water ($\text{km}^2$) | Event Water ($\text{km}^2$) | Persistent Water ($\text{km}^2$) | Newly Inundated ($\text{km}^2$) | Receded Water ($\text{km}^2$) | Stable Land ($\text{km}^2$) | Net Change ($\text{km}^2$) | Percentage Change | Hydrological Interpretation |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **P-1** | 2026-06-03 | 2026-06-15 | 12 | 0.862 | 1.223 | 0.862 | 0.361 | 0.000 | 7.929 | **+0.361** | **+41.89%** | Early monsoon onset; initial river stage rise |
| **P-2** | 2026-06-15 | 2026-06-27 | 12 | 1.223 | 1.660 | 1.030 | 0.630 | 0.193 | 7.299 | **+0.437** | **+35.76%** | Continuous discharge expansion into low floodplain |
| **P-3** | 2026-06-27 | 2026-07-09 | 12 | 1.660 | 3.997 | 1.660 | 2.337 | 0.000 | 5.155 | **+2.337** | **+140.77%** | **Catastrophic Monsoonal Flood Peak (Production Pair)** |
| **P-4** | 2026-07-09 | 2026-07-21 | 12 | 3.997 | 2.725 | 2.634 | 0.091 | 1.363 | 5.064 | **-1.272** | **-31.83%** | Rapid post-surge flood drainage; initial recession |
| **P-5** | 2026-07-21 | 2026-08-02 | 12 | 2.725 | 2.021 | 2.021 | 0.000 | 0.704 | 6.427 | **-0.704** | **-25.82%** | Continued drainage back toward secondary channels |
| **P-6** | 2026-08-02 | 2026-08-14 | 12 | 2.021 | 2.377 | 2.021 | 0.356 | 0.000 | 6.775 | **+0.356** | **+17.61%** | Secondary monsoon pulse / upstream runoff wave |
| **P-7** | 2026-08-14 | 2026-08-26 | 12 | 2.377 | 0.862 | 0.862 | 0.000 | 1.515 | 6.775 | **-1.515** | **-63.74%** | Final late-monsoon drydown; return to baseline |

---

## 5. Reconciliation with Existing Production Results

The experimental processing pipeline was benchmarked directly against the existing production baseline and event rasters stored in `data/output/change/2026-06-27_to_2026-07-09/`:

```
Metric                          Existing Production     Experimental Output     Discrepancy
-------------------------------------------------------------------------------------------
Baseline Water Area (km²)       1.660                   1.660                   0.000 km² (0.00%)
Baseline Water Pixels           2,612                   2,612                   0 pixels
Event Water Area (km²)          3.997                   3.997                   0.000 km² (0.00%)
Event Water Pixels              6,289                   6,289                   0 pixels
Persistent Water Area (km²)     1.660                   1.660                   0.000 km² (0.00%)
Newly Inundated Area (km²)      2.337                   2.337                   0.000 km² (0.00%)
Receded Water Area (km²)        0.000                   0.000                   0.000 km² (0.00%)
Stable Land Area (km²)          5.155                   5.155                   0.000 km² (0.00%)
Percentage Water Change         +140.77%                +140.77%                0.00%
Evaluated Area (km²)            9.152                   9.152                   0.000 km²
```

**Conclusion:** The experimental processing reproduces the production results with **100.00% numerical and spatial fidelity**.

---

## 6. Majuli Reach Reference Baseline (Cycle 029)

For the Majuli study area (Track 015, Frame 3700, Ascending), the verified single-date reference observation from Cycle 029 (27 August 2026) was analyzed:
- **Total Valid Pixels:** 89,551,584 pixels (100.00% valid data coverage).
- **Total Evaluated Area:** $8,955.158\text{ km}^2$.
- **Classified Water Extent:** **797.55 km²** (**79,755.0 hectares**), representing **8.91%** of the evaluated basin reach.
- **Stable Land Extent:** $8,157.608\text{ km}^2$ (91.09%).
- **Optimal Otsu Threshold:** -15.0 dB.
- **Backscatter Characteristics:**
  - Water Mode: $\text{Mean} = -18.63\text{ dB}$, $\text{Std} = 2.59\text{ dB}$.
  - Land Mode: $\text{Mean} = -8.91\text{ dB}$, $\text{Std} = 3.88\text{ dB}$.
  - Radiometric Separation: $\Delta = 9.72\text{ dB}$, providing strong contrast for automated water delineation.

The remaining 6 orbital repeats (Cycles 025, 026, 027, 028, 030, 031) are verified in ISRO Bhoonidhi and NASA Earthdata catalogues and will be downloaded in Phase 3 following user approval.

---

## 7. Hydrological Progression Discussion

The 8-epoch Barpeta time series reveals a classic bimodal monsoonal flood hydrograph:

1. **Pre-Monsoon Low-Flow Regime (Early June):**
   Prior to significant Himalayan snowmelt and monsoon rainfall, the river channel occupies 0.862 km². Sandbars and low gravel terraces remain exposed.
2. **First Monsoon Surge (Late June to Early July):**
   Heavy monsoonal precipitation in the Assam-Meghalaya Hills drives river stage above bankfull capacity. In the 12 days between 27 June and 09 July, water area explodes from 1.660 km² to 3.997 km² (+140.77%), submerging agricultural depressions and floodplain wetlands.
3. **Primary Flood Recession (Late July):**
   A dry spell allows floodwaters to drain into the main Brahmaputra trunk channel at an average rate of 0.106 km²/day, dropping extent to 2.725 km² by 21 July and 2.021 km² by 02 August.
4. **Secondary Runoff Wave (Mid-August):**
   A secondary rainfall pulse generates a smaller surge (+17.61%), expanding water extent back to 2.377 km² on 14 August.
5. **System Recovery (Late August):**
   Post-monsoon drainage returns water extent to 0.862 km² by 26 August.

---

## 8. Scientific Limitations & Data Warnings

1. **12-Day Sampling Window:**
   The 12-day orbital repeat cycle cannot capture ephemeral flash floods that crest and recede within 48 to 72 hours.
2. **Emergent Flooded Vegetation:**
   In flooded wetlands with dense reed beds (*Phragmites karka*) or emergent crops, double-bounce scattering between vertical stems and the water surface produces high backscatter ($\approx -10\text{ dB}$ to $-7\text{ dB}$), which single-pol HHHH classifies as land.
3. **Smooth Specular Dry Surfaces:**
   Extremely smooth, dry sandbars or asphalt surfaces can exhibit specular reflection and low backscatter ($\le -19\text{ dB}$), occasionally causing minor commission errors.
4. **Operational Notice:**
   These satellite-derived extents provide remote sensing decision support and must be validated against local river gauge hydrographs (e.g. Central Water Commission) before issuing official warnings.

