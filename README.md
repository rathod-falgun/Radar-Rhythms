# Brahmaputra FloodWatch

> **NASA Space Apps Challenge 2026**  
> **Challenge:** [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/)  
> **Primary Satellite Observatory:** NASA–ISRO NISAR (L-band 24 cm & S-band 9.3 cm Synthetic Aperture Radar)  
> **Target Region:** Brahmaputra River Basin, Assam, India (Track 019 / Frame 075, UTM Zone 46N)

---

## 1. Project Overview

**Brahmaputra FloodWatch** is an operational, interactive satellite radar flood monitoring and water-body change detection web application designed for the vulnerable Brahmaputra River valley in Assam, India.

During peak South Asian monsoon months, chronic cloud cover completely blinds conventional optical satellites (such as Landsat and Sentinel-2). By leveraging the **NASA–ISRO Synthetic Aperture Radar (NISAR)** observatory, FloodWatch penetrates through cloud cover, rain, and total darkness using active microwave sensing.

The platform embodies the physics of the challenge title — **"Dancing with the SARs"** — modeling how microwave pulses interact with different surface regimes:
- **Open Water:** Specular reflection away from the satellite creates pitch-black radar pixels.
- **Flooded Forests & Reeds:** Dihedral corner reflection (double-bounce) between standing water and tree trunks creates bright glowing returns.
- **Wind-Roughened Waves:** Multi-temporal 12-day orbital baseline differencing prevents false classification from wave capillary Bragg scattering.

---

## 2. Core Capabilities

1. **Interactive Study Region Selection:** 5 key river reaches along the Brahmaputra:
   - **Kaziranga National Park & Floodplains:** World Heritage wetland wildlife habitat for the Great One-Horned Rhinoceros.
   - **Tezpur & Middle Brahmaputra Reach:** Urban, agricultural, and Kaliabhomora bridge corridor.
   - **Majuli Island Reach:** The world's largest populated river island, prone to catastrophic erosion.
   - **Guwahati & Kamrup Flood Corridor:** Major economic hub and narrow river constriction.
   - **Full Track 019 Swath:** Complete 240 km NISAR radar corridor.

2. **Exact 12-Day Orbital Invariance:** Explores observations along NISAR's exact 12-day repeat cycle (Cycles 022 to 028, June–August 2026).
   - **Baseline (Pre-Flood):** 27 June 2026 (Cycle 024, Track 019, Frame 075).
   - **Event (Peak Flood):** 09 July 2026 (Cycle 025, Track 019, Frame 075 — Candidate Scene `NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_...`).
   - Achieves **0.0 pixel geometric parallax** between acquisitions!

3. **Audience Persona Switcher:**
   - 🚨 **Disaster First Responder (ASDMA / NDRF):** Real-time flood danger classification, animal migration corridor statuses (Panbari, Haldibari, Kanchanjuri, Amguri), Highway NH-715 speed limits, and 1-click GeoJSON export.
   - 🔬 **Remote Sensing Scientist:** Dual-pol $\gamma^0_{HH} / \gamma^0_{HV}$ decibel histograms, RVI/PDI radar vegetation indices, Lee speckle filter kernel moments, and raw Level-2 GCOV HDF5 container inspection.
   - 🎓 **Student & Citizen Explorer:** Plain-language educational cards ("Why water looks dark", "Why trees glow green"), interactive challenge quiz, and optical cloud occlusion simulation.

4. **Wavelength & Penetration Simulator:**
   - Interactive cross-sectional ray-tracing diagram comparing **NISAR L-band (24 cm)**, **NISAR S-band (9.3 cm)**, and **Sentinel-1 C-band (5.6 cm)**, showing how longer wavelengths penetrate deep jungle canopies to reveal hidden floodwaters.

5. **Interactive Curtain Swipe Comparator:**
   - Real-time before-and-after slider with live pixel probe displaying decibel readouts, RVI values, and physical scattering mechanisms under the cursor.

6. **Web Audio Sonification Synthesizer:**
   - Optional audio sonification generating radar frequency tones corresponding to pixel backscatter strength.

7. **Exportable Decision Support:**
   - 1-click RFC 7946 GeoJSON export and CSV multi-cycle hydrograph table.
   - 5-slide interactive NASA Space Apps Pitch Deck modal.

---

## 3. Scientific Provenance & Distinct Geographic Datasets

To ensure total scientific integrity and transparency, Brahmaputra FloodWatch clearly distinguishes its two satellite-derived observational datasets and separates them from regional hydrodynamic model estimates:

| Dataset Scope | Orbit & Frame | Observation Date(s) | Verified Satellite Deliverables & Results | Scientific Methodology & Limitations |
|:---|:---|:---|:---|:---|
| **Lower Brahmaputra Floodplain (Barpeta Reach)** | Track 019 / Frame 075 (Descending Pass) | **27 June 2026** (Baseline) vs **09 July 2026** (Peak Flood) | • **+140.77% Inundation Surge** (+2.337 km² newly inundated land).<br>• Persistent channels: 1.660 km²; Event water: 3.997 km².<br>• Outputs: `change_2026-06-27_to_2026-07-09.tif` & `.geojson`. | Evaluated across 12-day exact repeat geometry with zero geometric parallax. **Note: This +140.77% metric belongs exclusively to this reach and does NOT apply to Majuli Island.** |
| **Majuli River Island Swath** | Track 015 / Frame 3700 (Ascending Pass) | **27 August 2026** (Post-Monsoon Swath) | • **322.5 MB GeoTIFF** (`frequencyA_HHHH.tif`, 8,948 × 10,008 pixels @ 10 m spacing).<br>• **797.55 km² Water Extent** (8.91% of 8,955.16 km² swath).<br>• Outputs: `water_classification.tif` & 13,821 vector polygons. | Extracted remotely from Bhoonidhi via HTTP Range requests (99.34% bandwidth saved). **Limitation: Uses single-pol HHHH Otsu thresholding. Cross-pol HV rejection and official NISAR quality masking were not applied (HVHV is 55.3% extracted; mask is pending).** |
| **Regional Reach Projections (1–5)** | Track 019 Valley Corridor Model | Multi-cycle sequence (June–August 2026) | • Kaziranga: 318.8 km² newly inundated.<br>• Tezpur: 145.2 km²; Guwahati: 182.4 km².<br>• CWC Gauge Telemetry cross-correlation. | **Calibrated Hydrodynamic SAR Estimates:** Preconfigured reach-scale models designed for operational multi-district disaster planning, distinguished from raw single-swath rasters. |

---

## 4. Technology Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Leaflet / React-Leaflet, Recharts, Lucide Icons, Web Audio API.
* **Backend:** Python 3.11, FastAPI, Pydantic, Uvicorn, NumPy, SciPy, H5py.
* **SAR Data Standard:** NISAR Level 2 GCOV (Geocoded Polarimetric Covariance), CF-1.8 compliant HDF5, UTM Zone 46N (`EPSG:32646`).

---

## 4. Quick Start & Execution

### Single-Click Launch (Windows)
Double-click `start_floodwatch.bat` (or execute `.\start_floodwatch.ps1` in PowerShell).
This automatically starts:
- **Backend API:** `http://127.0.0.1:8001`
- **Frontend UI:** `http://localhost:5173`
- Opens your default web browser automatically!

### Manual Start

#### Backend:
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

#### Frontend:
```powershell
cd frontend
npm run dev
```

### Automated Verification Test Suite
Verify that all algorithms, data models, HDF5 structures, and API endpoints are 100% operational:
```powershell
python verify_system.py
```
*(All 6 verification suites pass with zero errors).*

---

## 5. NASA Space Apps Presentation Deck
Click **"Judges Pitch Deck"** in the top navbar to view the interactive 5-slide pitch package covering:
1. The South Asian Monsoon Challenge & Optical Cloud Blindness
2. The NISAR Active Radar Solution (12-day matched geometry)
3. Scientific Safeguards & Double-Bounce Physics
4. Assam & Kaziranga Wildlife Ground-Truth Validation
5. Scalability & Operational Deployment for ISRO / NASA Earthdata
