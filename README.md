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

## 3. Technology Stack

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
