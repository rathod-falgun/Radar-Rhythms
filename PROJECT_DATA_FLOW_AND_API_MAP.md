# Brahmaputra FloodWatch — Project Data Flow & API Architecture Map
**NASA Space Apps Challenge 2026** | *Challenge: Dancing with the SARs*  
**Document Reference:** `PROJECT_DATA_FLOW_AND_API_MAP.md`  
**Investigation Date:** November 15, 2026  
**Scope:** Exhaustive end-to-end request tracing, computation classification, and external API verification.

---

## 1. High-Level System Architecture & Request Lifecycle

```
[ Web Browser Client ]
        │
        ├── UI State: Persona (Citizen, Scientist, Disaster Manager)
        ├── Navigation: Home, Flood Monitor, Methodology, How It Works, About
        └── Active Reach: Majuli Island Reach vs Barpeta Flood Corridor
        │
        ▼ HTTP REST / Static Asset Fetch (via src/utils/apiConfig.js)
[ React 18 + Vite SPA Frontend (Port 5173 / Static Hosting) ]
        │
        ▼ HTTP REST Endpoints (JSON / GeoJSON / CSV / ArrayBuffer)
[ FastAPI ASGI Backend Service (Port 8000 / Container Host, configurable via PORT env var) ]
  ├── [1] In-Memory Static Metadata Catalogs (Reaches, Cycles, Observation IDs)
  ├── [2] HDF5 Group Tree Accessor (h5py parsing cropped Level-2 GCOV products)
  ├── [3] On-the-Fly Radar Preprocessor (Scipy Lee filter, Decibel conversion)
  ├── [4] Dynamic Change Detector (Log-ratio subtraction, Otsu bimodal threshold)
  └── [5] ISRO Bhoonidhi STAC Service (Auxiliary on-demand token-bucket rate limiter)
        │
        ▼ Local Filesystem Access (Read-Only)
[ Scientific Data Layer ]
  ├── backend/app/data/nisar_products/*.h5 (Level-2 GCOV cropped granules)
  ├── data/experimental/multidate_nisar/barpeta/backscatter/*.npy (Calibrated arrays)
  ├── data/experimental/multidate_nisar/barpeta/change_maps/*.json (Change metrics)
  ├── data/experimental/multidate_nisar/barpeta/statistics/*.json (Timeseries summaries)
  ├── data/output/subsets/.../water_boundaries.geojson (51.66 MB, 13,821 vector flood polygons)
  └── data/output/change/2026-06-27_to_2026-07-09/*.tif (Barpeta change rasters)
```

---

## 2. Exhaustive Feature-by-Feature Data Flow Tracing

Below is the concrete, code-verified trace for every major user-facing feature in Brahmaputra FloodWatch.

### 1. Majuli Water Map
- **User Action:** User navigates to the Flood Monitor and selects **Majuli Island** reach (`selectedRegion = 'majuli'`).
- **React Component:** [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L95-L140) and [MajuliStudyHeader.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MajuliStudyHeader.jsx).
- **API Request:** `GET /api/water/majuli/boundaries` (dispatched via `apiUrl('/api/water/majuli/boundaries')` in [apiConfig.js](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/utils/apiConfig.js)).
- **FastAPI Endpoint:** `@router.get("/water/majuli/boundaries")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L1326-L1333).
- **Python Service/Function:** `get_majuli_water_boundaries()`.
- **Source Data File:** `data/output/subsets/NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001/subset_20261111T120648Z_6ee0444d/water_boundaries.geojson` (51,661,494 bytes, 13,821 vector polygons, RFC 7946 GeoJSON, Track 015 / Frame 3700, 27 August 2026).
  *(Note: `data/output/NISAR_Flood_Extent_20260709.geojson` is an exploratory 1.92 KB bounding box artifact and not the production Majuli water layer).*
- **Computation Classification:** **Precomputed & Pre-generated Static GeoJSON**. The backend simply opens the GeoJSON file from disk, loads it into memory or streams the file bytes directly, and returns `Response(content=f.read(), media_type="application/geo+json")`. No raster thresholding is executed during the HTTP request.
- **Frontend Visualization:** Leaflet GeoJSON layer parses coordinates and renders vector polygons with cyan stroke (`#38bdf8`) and translucent fill ($45\%$ opacity) overlaid on Esri Dark Canvas tiles.

---

### 2. Barpeta Water Map
- **User Action:** User selects **Barpeta / Lower Brahmaputra** reach.
- **React Component:** [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L145-L210) and [BarpetaStudyHeader.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/BarpetaStudyHeader.jsx).
- **API Request:** `GET /api/compare?region_id=barpeta&baseline_date=2026-06-27&event_date=2026-07-09&apply_speckle_filter=true&filter_window=5&use_adaptive_otsu=true` and `GET /api/flood/barpeta/boundaries`.
- **FastAPI Endpoint:** `@router.get("/compare")` (lines 181–609) and `@router.get("/flood/barpeta/boundaries")` (lines 1363–1379).
- **Python Service/Function:** `compare_observations()` invoking `perform_sar_change_detection()` in `routes.py`.
- **Source Data Files:**
  - `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_24_2026-06-27.npy` ($120\times120$ float array)
  - `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_25_2026-07-09.npy` ($120\times120$ float array)
- **Computation Classification:** **Runtime Processing of Preprocessed Arrays**. The source arrays are preprocessed calibrated backscatter grids (UTM Zone 46N). When requested, the backend dynamically applies the adaptive Lee speckle filter using `scipy.ndimage.uniform_filter`, computes log-ratio differencing ($\Delta \text{dB} = \text{event}_{\text{dB}} - \text{baseline}_{\text{dB}}$), runs bimodal Otsu water thresholding, and classifies pixels into persistent water ($1.660\text{ km}^2$) vs newly inundated water ($2.337\text{ km}^2$).
- **Frontend Visualization:** Rendered as classified raster bounds on Leaflet and visual statistics chips in `WhatChangedCard.jsx`.

---

### 3. Barpeta Timeline Hydrograph
- **User Action:** User inspects the flood hydrograph along the 8-epoch observation sequence.
- **React Component:** [AnalyticsPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/AnalyticsPanel.jsx#L250-L380) (SVG Multi-Temporal Hydrograph).
- **API Request:** `GET /api/timeline-stats?region_id=barpeta`.
- **FastAPI Endpoint:** `@router.get("/timeline-stats")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L725-L794).
- **Python Service/Function:** `get_timeline_stats(region_id="barpeta")`.
- **Source Data File:** `data/experimental/multidate_nisar/barpeta/statistics/timeseries_summary.json` (3.5 KB) and `timeseries_table.csv`.
- **Computation Classification:** **Precomputed Statistics**. The backend reads the precalculated multi-temporal JSON summary, which indexes Cycles 022 through 029 (June 3 to August 26, 2026), area values ($0.379\text{ km}^2$ to $3.997\text{ km}^2$), inundation percentages ($4.14\%$ to $43.67\%$), and river discharge estimates ($16,200\text{ m}^3/\text{s}$ to $48,500\text{ m}^3/\text{s}$).
- **Frontend Visualization:** Interactive SVG curve with animated gradient fill, hover tooltips showing date and discharge, and peak marker at Cycle 025 (09 July 2026).

---

### 4. Date Selection & Observation Detail
- **User Action:** User clicks a specific cycle chip in the timeline (e.g., Cycle 025: `2026-07-09`).
- **React Component:** [DateSelector.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/DateSelector.jsx#L15-L80).
- **API Request:** `GET /api/observations?region_id=barpeta&only_processed=true` (initial catalog) and `GET /api/observations/2026-07-09`.
- **FastAPI Endpoint:** `@router.get("/observations")` (lines 154–162) and `@router.get("/observations/{date_str}")` (lines 164–168).
- **Python Service/Function:** `get_observations_for_region()` and `get_observation_by_date()`.
- **Source Data File:** Hardcoded static in-memory data structures in `routes.py`: `BARPETA_OBSERVATIONS_8_CYCLES` and `NISAR_OBSERVATION_CATALOG`.
- **Computation Classification:** **Static In-Memory Catalog Data**. Granule IDs, orbit paths (Track 019 / Frame 075), descending passes, start/end UTC times, and sensor modes (`SSAR_GCOV`) are served instantly from memory.
- **Frontend Visualization:** Highlights selected timeline node, updates date range display, and triggers map refresh.

---

### 5. Baseline / Event Dual-Observation Comparison
- **User Action:** User clicks "Run Change Analysis" or moves the slider in the split-screen view.
- **React Component:** [AnalyticsPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/AnalyticsPanel.jsx#L420-L510) and [SwipeSlider.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/SwipeSlider.jsx).
- **API Request:** `GET /api/compare?region_id=barpeta&baseline_date=2026-06-27&event_date=2026-07-09`.
- **FastAPI Endpoint:** `@router.get("/compare")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L181-L609).
- **Python Service/Function:** `compare_observations()`.
- **Source Data Files:**
  - `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_24_2026-06-27.npy`
  - `data/experimental/multidate_nisar/barpeta/backscatter/hh_db_cycle_25_2026-07-09.npy`
  - Auxiliary summary: `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-06-27_to_2026-07-09.json`
- **Computation Classification:** **Runtime Processing**. The backend applies the mathematical filtering and differencing pipeline, computes histogram frequency counts across 30 decibel bins, and derives change statistics ($+140.77\%$ change) dynamically during the request.
- **Frontend Visualization:** Populates [WhatChangedCard.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/WhatChangedCard.jsx), renders the decibel backscatter distribution chart, and configures the interactive swipe divider.

---

### 6. Newly Inundated & Persistent Water Layers
- **User Action:** User toggles "Newly Inundated Layer" or "Permanent Water Layer" checkboxes on the map.
- **React Component:** [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L220-L290).
- **API Request:** Embedded raster matrix inside `/api/compare` (`raster_data.change_grid`) or `GET /api/flood/barpeta/change-raster`.
- **FastAPI Endpoint:** `@router.get("/flood/barpeta/change-raster")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L1515-L1529).
- **Python Service/Function:** `get_barpeta_change_raster()`.
- **Source Data File:** `data/experimental/multidate_nisar/barpeta/change_maps/change_2026-06-27_to_2026-07-09.npy` ($120\times120$ array with integer values: 0=land, 1=persistent water, 2=new flood, 3=receded).
- **Computation Classification:** **Preprocessed Matrix Array**.
- **Frontend Visualization:** Color-coded pixel overlays rendered on an HTML5 Canvas layer in Leaflet: Deep Prussian Blue for persistent water, High-Visibility Orange (`#fca311`) for active flood water.

---

### 7. Water-Area Statistics & Regional Ranking
- **User Action:** User views the summary table or switches between Citizen and Disaster Manager personas.
- **React Component:** [ReachSummaryTable.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/ReachSummaryTable.jsx) and [DisasterAlertPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/DisasterAlertPanel.jsx).
- **API Request:** `GET /api/reaches/summary` and `GET /api/water/majuli/summary`.
- **FastAPI Endpoint:** `@router.get("/reaches/summary")` (lines 796–855) and `@router.get("/water/majuli/summary")` (lines 1335–1361).
- **Python Service/Function:** `get_all_reaches_summary()`.
- **Source Data Files:**
  - `data/output/NISAR_Flood_Timeseries_Report.json` (Majuli: 797.55 km² permanent water, 8.91% inundation).
  - `data/experimental/multidate_nisar/barpeta/change_maps/change_summary_2026-06-27_to_2026-07-09.json` (Barpeta: 1.660 km² baseline, 3.997 km² event, +140.77% increase).
- **Computation Classification:** **Precomputed Verified Metrics**.
- **Frontend Visualization:** Multi-reach comparison matrix ranking all 5 monitored reaches by flood vulnerability, accompanied by ASDMA (Assam State Disaster Management Authority) action levels (Advisory, Alert, Warning).

---

### 8. GeoJSON Vector Downloads
- **User Action:** User clicks "Download GeoJSON" in the analytics header.
- **React Component:** [AnalyticsPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/AnalyticsPanel.jsx#L180-L210).
- **API Request:** `GET /api/export/geojson?region_id=majuli` or `GET /api/export/geojson?region_id=barpeta`.
- **FastAPI Endpoint:** `@router.get("/export/geojson")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L610-L697).
- **Python Service/Function:** `export_geojson()`.
- **Source Data File:**
  - For Majuli: Returns file stream of `data/output/NISAR_Flood_Extent_20260709.geojson`.
  - For Barpeta: Dynamically generates an RFC 7946 FeatureCollection polygon set from bounding coordinates.
- **Computation Classification:** **Static File Stream (Majuli) / Dynamic Serialization (Barpeta)**.
- **Frontend Visualization:** Triggers direct browser download with `Content-Disposition: attachment; filename=NISAR_flood_{region_id}_{event_date}.geojson`.

---

### 9. CSV Statistics Downloads
- **User Action:** User clicks "Export Timeseries CSV".
- **React Component:** [AnalyticsPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/AnalyticsPanel.jsx#L215-L240).
- **API Request:** `GET /api/export/csv?region_id=barpeta`.
- **FastAPI Endpoint:** `@router.get("/export/csv")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L699-L723).
- **Python Service/Function:** `export_csv(region_id="barpeta")`.
- **Source Data File:** Dynamically formatted from `get_timeline_stats(region_id)`.
- **Computation Classification:** **Dynamic CSV Formatting**. The backend iterates over the timeseries JSON dictionary and formats rows with CSV headers (`Cycle, Acquisition_Date, Hydrological_Stage, Discharge_m3s, New_Inundation_km2, Permanent_Water_km2, Total_Water_km2, Inundation_Percent`).
- **Frontend Visualization:** Triggers direct browser download with `Content-Disposition: attachment; filename=Brahmaputra_NISAR_timeline_barpeta.csv`.

---

### 10. GeoTIFF / Raster Downloads
- **User Action:** User clicks "Download Classified GeoTIFF" from the methodology section.
- **React Component:** [DataMethodologyView.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/DataMethodologyView.jsx#L310-L340).
- **API Request:** `GET /api/layers/download?reach_id=barpeta&layer=change`.
- **FastAPI Endpoint:** `@router.get("/layers/download")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L1789-L1818).
- **Python Service/Function:** `download_layer_raster()`.
- **Source Data File:** Looks for `data/output/NISAR_Flood_Classification_*.tif` or fallback `.npy` file.
- **Computation Classification:** **Pre-generated File Stream**.
- **Frontend Visualization:** Browser file stream or fallback informative 404 explaining that full $250\text{ MB}$ raw GeoTIFFs are excluded from Git deployment.

---

### 11. Interactive HDF5 Inspector
- **User Action:** User opens the "HDF5 Inspector" tab under Scientist mode to inspect real Level-2 NISAR metadata.
- **React Component:** [HDF5Inspector.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/HDF5Inspector.jsx).
- **API Request:** `GET /api/nisar/inspect?granule_id=NISAR_S2_PR_GCOV_025_019_D_075_20260709.h5`.
- **FastAPI Endpoint:** `@router.get("/nisar/inspect")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L857-L884).
- **Python Service/Function:** `inspect_nisar_hdf5()`.
- **Source Data File:** `backend/app/data/nisar_products/NISAR_S2_PR_GCOV_025_019_D_075_20260709.h5` (100 KB real cropped HDF5 granule).
- **Computation Classification:** **Runtime Dynamic HDF5 Tree Traversal**. The backend invokes `h5py.File()` in real time, recursively walks the HDF5 hierarchy (`/science/SSAR/GCOV/grids/frequencyA/HHHH`), extracts dimensions (`(120, 120)`), data types (`float32`), attributes (`long_name`, `units`, `scale_factor`), and chunks, and returns the full JSON hierarchy.
- **Frontend Visualization:** Collapsible interactive tree view displaying dataset branches, radiometric attributes, and geodetic coordinate grids.

---

### 12. NISAR Catalogue & Bhoonidhi Status
- **User Action:** Scientist persona checks ISRO Bhoonidhi portal connectivity.
- **React Component:** [ScientistRadarPanel.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/ScientistRadarPanel.jsx#L45-L90).
- **API Request:** `GET /api/nisar/status`.
- **FastAPI Endpoint:** `@router.get("/nisar/status")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L886-L902).
- **Python Service/Function:** `get_bhoonidhi_status()` in `bhoonidhi_service.py`.
- **Source Data File:** In-memory configuration variables (`settings.BHOONIDHI_USER_ID`, `settings.BHOONIDHI_PASSWORD`).
- **Computation Classification:** **In-Memory Configuration State**. Does not make live external HTTP requests on view load.
- **Frontend Visualization:** Displays integration badge: `BHOONIDHI READY (OFFLINE SIMULATION)` or `AUTHENTICATED`.

---

### 13. Unsupported Region Handling
- **User Action:** User selects a candidate floodplain reach without processed SAR coverage (e.g., "Guwahati Reach" or "Dhubri Border").
- **React Component:** [RegionSelector.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/RegionSelector.jsx) and [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L310-L340).
- **API Request:** `GET /api/observations?region_id=guwahati&only_processed=true`.
- **FastAPI Endpoint:** `@router.get("/observations")` in [routes.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/api/routes.py#L154-L162).
- **Python Service/Function:** `get_observations_for_region("guwahati", only_processed=True)`.
- **Source Data File:** Hardcoded static catalog in `routes.py`.
- **Computation Classification:** **Static Empty State Filtering**. Returns empty array `[]` because `is_processed=False` for candidate reaches.
- **Frontend Visualization:** Map centers on Guwahati's coordinates with a prominent, honest scientific notice: *"No validated Level-2 NISAR observations available for this reach. Showing baseline river geometry only. Synthetic inundation is deliberately omitted to prevent scientific fabrication."*

---

## 3. Data Source Classification Summary

| Classification Tier | Specific Files & Folders | Total Size | When & How Used |
| :--- | :--- | :---: | :--- |
| **A. Pre-downloaded Raw Data** | `backend/app/data/nisar_products/NISAR_S2_PR_GCOV_024_019_D_075_20260627.h5`, `...20260709.h5` | 197 KB | Parsed on-the-fly by `h5py` for the HDF5 Inspector feature (`/api/nisar/inspect`). |
| **B. Preprocessed Scientific Data** | `data/experimental/multidate_nisar/barpeta/backscatter/*.npy` (8 files) | 1.15 MB | Ingested by `/api/compare` for real-time Lee filtering, Otsu thresholding, and difference calculation. |
| **C. Precomputed Statistics & Vectors** | `data/experimental/multidate_nisar/barpeta/statistics/timeseries_summary.json`, `data/output/subsets/.../water_boundaries.geojson` | 51.7 MB | Streamed directly to client to power the multi-temporal hydrograph and Majuli 13,821-polygon map. |
| **D. Runtime Processing** | Dynamic calculations inside `/api/compare`, `/api/export/csv`, `/api/export/geojson` | N/A (RAM) | Computes Scipy uniform filter convolution, Otsu threshold, log-ratio differencing, and CSV string serialization. |
| **E. Live External Data** | Optional Bhoonidhi STAC API (`/api/nisar/scenes`) & Esri/OSM basemap tiles | External | Basemap tiles load from Esri/OSM in browser; Bhoonidhi STAC is only called on explicit user query. |

### Answers to Core Data-Origin Questions
1. **Is flood information calculated from new satellite observations when the user opens the website?**  
   **No.** Flood extents and backscatter matrices are based on pre-downloaded, verified Level-2 NISAR datasets spanning the 2026 monsoon observation sequence.
2. **Is the website primarily displaying previously downloaded and processed NISAR data?**  
   **Yes.** The system was purposefully designed to showcase validated scientific evidence from NASA-ISRO Track 019 / Frame 075 and Track 015 / Frame 3700.
3. **Does the backend perform any calculations dynamically?**  
   **Yes.** When a user performs dual-date comparison in the Flood Monitor, the backend executes adaptive Lee speckle noise suppression ($5\times5$ window), logarithmic decibel differencing, and dynamic Otsu thresholding on the fly.
4. **Can the website operate without internet access to external NASA/ISRO catalogues?**  
   **Yes, 100%.** All core flood monitoring, map visualization, timeline charting, and HDF5 inspection features run completely offline from local packaged datasets.
5. **Can it operate without Bhoonidhi credentials?**  
   **Yes, 100%.** Without credentials, the system automatically runs in offline simulation mode without error.

---

## 4. Verification of External APIs & Data Providers

| Provider | Actual Endpoint / Service | Source File | Function Calling It | Auth Type | Used by Live App? | Purpose in Project |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **ISRO Bhoonidhi** | `https://bhoonidhi-api.nrsc.gov.in/oauth/token` | [bhoonidhi_service.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/services/bhoonidhi_service.py#L220) | `authenticate()` | HTTP Bearer (User/Pass) | **Auxiliary Only** | Optional on-demand authentication to ISRO data portal. |
| **ISRO Bhoonidhi** | `https://bhoonidhi-api.nrsc.gov.in/stac/search` | [bhoonidhi_service.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/services/bhoonidhi_service.py#L320) | `search_scenes()` | HTTP Bearer Token | **Auxiliary Only** | On-demand search for newly cataloged NISAR scenes. |
| **ISRO Bhoonidhi** | `https://bhoonidhi-api.nrsc.gov.in/download` | [bhoonidhi_stream.py](file:///e:/NASA%20SPACE%20APP%202026/backend/app/services/bhoonidhi_stream.py#L880) | `stream_byte_range()` | HTTP Range + Bearer | **Auxiliary Only** | Partial HTTP range-byte streaming of remote HDF5 headers. |
| **Esri ArcGIS** | `https://server.arcgisonline.com/.../Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}` | [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L48) | Leaflet `tileLayer()` | None (Public) | **YES (Browser)** | Primary dark canvas basemap for high-contrast radar visualization. |
| **Esri ArcGIS** | `https://server.arcgisonline.com/.../World_Imagery/MapServer/tile/{z}/{y}/{x}` | [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L55) | Leaflet `tileLayer()` | None (Public) | **YES (Browser)** | High-resolution optical satellite basemap for optical comparison. |
| **OpenStreetMap** | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | [MapViewer.jsx](file:///e:/NASA%20SPACE%20APP%202026/frontend/src/components/MapViewer.jsx#L62) | Leaflet `tileLayer()` | None (Public) | **YES (Browser)** | Fallback standard street and river topology basemap. |
| **NASA Earthdata / CMR / ASF** | None | N/A | None | N/A | **NO** | No live API calls to CMR or ASF DAAC are implemented in application code. |

