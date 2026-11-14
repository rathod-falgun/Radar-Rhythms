# Next Phase Recommendations & Implementation Roadmap (Audited & Revised)
## Brahmaputra FloodWatch — NASA Space Apps Challenge 2026 (*Dancing with the SARs*)
### Document Reference: `NEXT_PHASE_RECOMMENDATIONS.md`
**Author:** Science & Geospatial Intelligence Team  
**Audit & Revision Date:** November 14, 2026  
**Status:** Strategic Planning & Implementation Roadmap  
**Target:** Phase 3 Operationalization and Multi-Mission Data Fusion

---

## 1. Executive Summary

Building on the audited, controlled findings of the Phase 2 analysis, this document establishes a scientifically defensible roadmap for **Phase 3**.

The primary objectives are:
1. Complete the multi-date observation sequence for **Majuli Reach** by executing an authorized, cloud-optimized range-subsetting acquisition of the remaining 6 orbital repeats.
2. Ingest external hydrological and meteorological datasets (GPM IMERG multi-satellite precipitation, Central Water Commission river stage gauges).
3. Validate NISAR water masks against contemporaneous Sentinel-1 C-band SAR and cloud-free Sentinel-2/Landsat-9 optical imagery.
4. Resolve the `CRNA` compact-polarimetry metadata contradiction and advance polarimetric decomposition research for flooded vegetation detection.
5. Operationalize the multi-epoch pipeline into the web application backend without altering existing production routes.

---

## 2. Priority 1: Majuli Reach Data Ingestion Protocol

In the Phase 1 & 2 audit, 6 additional repeat cycles sharing identical orbital geometry with the Majuli production reference were confirmed via ISRO Bhoonidhi STAC and NASA Earthdata CMR catalogues:
- **Orbital Configuration:** Track 015, Frame 3700, Relative Orbit 040, Ascending pass, DHNA mode.
- **Reference Observation:** Cycle 029 (27 August 2026) — Processed local subset available in `data/output/subsets/`.

| Cycle | Date (UTC) | Pass Interval | Target Hydrological Regime | Catalogue Verification Source | Estimated Granule Size | Estimated Subset Size | Local Availability |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **025** | 2026-07-10 | -48 days | July high monsoonal stage | ISRO Bhoonidhi / NASA Earthdata | ~12.6 GB | ~850 MB | Remote Only |
| **026** | 2026-07-22 | -36 days | Late July drainage phase | ISRO Bhoonidhi / NASA Earthdata | ~12.6 GB | ~850 MB | Remote Only |
| **027** | 2026-08-03 | -24 days | Early August intermediate stage | ISRO Bhoonidhi / ASF Vertex | ~12.6 GB | ~850 MB | Remote Only |
| **028** | 2026-08-15 | -12 days | Mid-August elevated stage | ISRO Bhoonidhi / ASF Vertex | ~12.6 GB | ~850 MB | Remote Only |
| **029** | 2026-08-27 | Reference | Late August baseline | ISRO Bhoonidhi / Local Store | ~12.6 GB | 850 MB (measured) | **Locally Processed** |
| **030** | 2026-09-08 | +12 days | September post-monsoon recession | ISRO Bhoonidhi / NASA Earthdata | ~12.6 GB | ~850 MB | Remote Only |
| **031** | 2026-09-20 | +24 days | Autumn low-flow regime | ISRO Bhoonidhi STAC API | ~12.6 GB | ~850 MB | Remote Only |

### Protocol for Authorized Acquisition:
- **Cloud-Optimized Subsetting:** Do **not** download the full 12.6 GB HDF5 granules (>75 GB total). Use server-side range-subsetting via the ASF DAAC or ISRO Bhoonidhi API to crop specifically to the Majuli Island study bounds ($X \in [559370, 659450\text{ m}]$, $Y \in [2931200, 3020680\text{ m}]$ in EPSG:32646).
- **Subsetting Size Notice:** Estimated subset sizes (~850 MB) are derived from the spatial extent of the Cycle 029 production GeoTIFFs; actual download payloads will depend on the compression and channel selection chosen during server-side extraction.

---

## 3. Priority 2: Precipitation Forcing Integration (NASA GPM IMERG)

Satellite radar captures instantaneous surface water extent, which reflects cumulative catchment precipitation:
1. **Dataset:** NASA Global Precipitation Measurement (GPM) Integrated Multi-satellitE Retrievals for GPM (IMERG) Final Run L3 daily $0.1^\circ \times 0.1^\circ$ (V07B).
2. **Analysis:** Compute cumulative basin-averaged precipitation for 3-day, 5-day, and 10-day antecedent windows across the Upper Brahmaputra (Tibetan Plateau/Tsangpo) and Middle Brahmaputra (Assam-Meghalaya Hills).
3. **Hypothesis Testing:** Quantify whether the large water extent expansion observed on 09 July (+140.77% relative to 27 June) was driven by an antecedent precipitation extreme in the catchment between 01 July and 07 July 2026.

---

## 4. Priority 3: Cross-Sensor Scientific Validation

Independent satellite observations are required to validate classification boundaries:
1. **Copernicus Sentinel-1 C-band SAR:**
   - Ingest Sentinel-1 IW GRD scenes acquired over Barpeta and Majuli within $\pm 24\text{ hours}$ of NISAR passes.
   - Compare S-band ($\lambda \approx 9.3\text{ cm}$) vs C-band ($\lambda \approx 5.6\text{ cm}$) backscatter responses to evaluate canopy penetration and surface roughness sensitivity.
2. **Cloud-Free Optical Imagery (Sentinel-2 MSI / Landsat-9 OLI-2):**
   - Identify cloud-free optical acquisitions during low-water periods (June 03 and August 26).
   - Derive the Modified Normalized Difference Water Index (MNDWI):
     $$\text{MNDWI} = \frac{\rho_{\text{Green}} - \rho_{\text{SWIR}}}{\rho_{\text{Green}} + \rho_{\text{SWIR}}}$$
   - Construct confusion matrices and calculate Producer's Accuracy, User's Accuracy, and Cohen's Kappa against the NISAR water mask.

---

## 5. Priority 4: Ground River Gauge Integration (CWC Hydrometry)

Satellite flood extents measure horizontal water area, not stage or discharge:
- **Target Gauges:** Central Water Commission (CWC) and Brahmaputra Board gauging stations:
  - **Lower Reach (Barpeta):** Goalpara, Jogighopa, Guwahati (Pandu).
  - **Upper Reach (Majuli):** Nematighat (Jorhat), Dibrugarh, Tezpur.
- **Hydraulic Analysis:** Compare daily water level measurements against Danger Level (DL) and Warning Level (WL). Correlate the 8-epoch satellite water extent curve with the daily river stage hydrograph to verify whether the 09 July maximum extent coincided with the peak river stage crest.

---

## 6. Priority 5: Advanced Polarimetric Research (Flooded Vegetation)

Resolving the `CRNA` compact-polarimetry metadata contradiction is a prerequisite for multi-polarization processing:
1. **Verification Action:** Request authoritative product ICD clarification from the ISRO NRSC / NASA SDS team regarding whether the Level-2 `CRNA` products contain synthesized pseudo-linear terms or raw compact-polarimetry covariances.
2. **Stokes Parameter Inversion:** If confirmed as compact-polarimetry, compute the 4 Stokes parameters $(g_0, g_1, g_2, g_3)$ and derive:
   - Degree of Polarization ($m$)
   - Relative Phase ($\delta$)
   - $m-\chi$ or $H-\alpha$ compact decomposition parameters
3. **Flooded Vegetation Delineation:** Use the cross-polarization channel or degree of polarization to separate emergent flooded vegetation (which produces strong double bounce) from bare land and open water.

---

## 7. Priority 6: Operationalization & Architecture Roadmap

To migrate these multi-date capabilities into production safely:
1. **Isolated Backend Extension:**
   - Introduce a new endpoint: `GET /api/nisar/timeseries?region=barpeta` that serves the verified `data/experimental/multidate_nisar/barpeta/statistics/timeseries_summary.json`.
   - Maintain `/api/nisar/change` and `/api/nisar/water-extent` unchanged.
2. **Frontend Temporal Scrubbing:**
   - Add a multi-date slider component allowing users to inspect all 8 verified observation dates.
   - Display the verified 4-class change animation showing surface water progression across the monsoon season.
