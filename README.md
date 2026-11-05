# Brahmaputra FloodWatch

> **NASA Space Apps Challenge 2026**  
> **Challenge:** [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/)  
> **Primary Satellite Observatory:** NASA–ISRO NISAR (L-band & S-band Synthetic Aperture Radar)  
> **Target Region:** Brahmaputra River Basin, Assam, India (Track 019 / Frame 075)

---

## 1. Project Overview

**Brahmaputra FloodWatch** is an interactive, satellite-based flood monitoring and water-body change detection web application designed to track severe monsoon inundation across the Brahmaputra River valley in Assam, India.

During peak monsoon months, chronic cloud cover blinds conventional optical satellites (such as Landsat and Sentinel-2). By leveraging the **NASA–ISRO Synthetic Aperture Radar (NISAR)** observatory, FloodWatch penetrates through cloud cover, rain, and darkness using active microwave sensing.

---

## 2. Core Capabilities

1. **Interactive Region Selection:** Select vulnerable river reaches along the Brahmaputra:
   - **Kaziranga National Park & Floodplains:** UNESCO World Heritage wetland wildlife habitat.
   - **Tezpur & Middle Brahmaputra Reach:** Urban, agricultural, and Kaliabhomora bridge corridor.
   - **Majuli Island Reach:** The world's largest populated river island, prone to severe erosion.
   - **Guwahati & Kamrup Flood Corridor:** Major economic hub and narrow river constriction.
   - **Full Track 019 Swath:** Complete 240 km NISAR radar corridor.
2. **12-Day Revisit Orbit Timeline:** Explores observations along NISAR's exact 12-day orbital repeat cycle (Cycles 022 to 028, spanning June to August 2026).
3. **Candidate Event Verification:**
   - **Baseline (Pre-Flood):** 27 June 2026 (Cycle 024, Track 019, Frame 075).
   - **Event (Peak Flood):** 09 July 2026 (Cycle 025, Track 019, Frame 075 — Candidate Scene `NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_...`).
4. **Before-and-After Swipe Comparator:** Interactive curtain slider comparing pre-flood SAR backscatter vs flood inundation maps.
5. **Multi-Class Radar Change Detection:**
   - Permanent river channels
   - Newly emerged open inundation (specular reflection drop, $\le -18.5\text{ dB}$, $\Delta \text{dB} \le -4.5\text{ dB}$)
   - Flooded emergent vegetation (double-bounce backscatter surge)
   - Marginal inundation / saturated soil
6. **Quantitative Impact Analytics:** Real-time calculation of submerged area in $\text{km}^2$ and hectares, inundation percentage, and multi-cycle flood hydrograph evolution curves.
7. **Transparent Scientific Explanations:** Real-time physics explanations and uncertainty disclosures in compliance with rigorous SAR standards.

---

## 3. Technology Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Leaflet / React-Leaflet, Recharts, Lucide Icons.
* **Backend:** Python 3.11, FastAPI, Pydantic, Uvicorn.
* **Numerical & Geospatial Processing:** NumPy, SciPy.
* **SAR Data Standard:** NISAR Level 2 GCOV (Geocoded Polarimetric Covariance), CF-compliant HDF5 structure, UTM Zone 46N (`EPSG:32646`).

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+) and pip

### Running the Application

#### Option A: Quick Scripts (Windows)
1. Double-click `run_backend.bat` (starts FastAPI on `http://127.0.0.1:8000`).
2. Double-click `run_frontend.bat` (starts Vite on `http://localhost:5173`).
3. Open `http://localhost:5173` in your browser.

#### Option B: Manual Terminal Execution

**Terminal 1 — Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 5. Project Directory Structure

```text
NASA SPACE APP 2026/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # FastAPI REST endpoints
│   │   ├── core/
│   │   │   └── config.py             # Application parameters & CRID specifications
│   │   ├── services/
│   │   │   ├── change_detector.py    # SAR log-ratio & multi-class thresholding
│   │   │   ├── nisar_metadata.py     # 12-day orbital repeat catalog & AOI definitions
│   │   │   └── sar_processing.py     # Decibel conversions & calibrated radar matrices
│   │   └── main.py                   # FastAPI server entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsPanel.jsx    # Area accounting & hydrograph evolution chart
│   │   │   ├── DateSelector.jsx      # 12-day orbital timeline picker
│   │   │   ├── MapViewer.jsx         # Interactive Leaflet GIS viewer with overlays
│   │   │   ├── Navbar.jsx            # Telemetry bar & mission info modal
│   │   │   ├── RegionSelector.jsx    # Brahmaputra reach cards
│   │   │   ├── ScientificExplain.jsx # Physical explanations & limitations
│   │   │   └── SwipeSlider.jsx       # Interactive curtain before-after swipe slider
│   │   ├── App.jsx                   # Application root
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── run_backend.bat / .ps1
├── run_frontend.bat / .ps1
└── README.md
```

---

## 6. Scientific Compliance (Section 6 Requirements)

* **No Double Calibration/Terrain Correction:** Uses Level 2 GCOV products where radiometric terrain correction (RTC) and geocoding to UTM Zone 46N have already been performed by the official NISAR science pipeline.
* **Exact Orbit Geometry Matching:** Both before and after scenes are constrained to Track 019 and Frame 075 (12-day repeat), eliminating baseline parallax artifacts.
* **Physical Scattering Differentiation:** Explicitly separates specular open water from double-bounce flooded vegetation and unflooded smooth terrain.
