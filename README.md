# 🌍 Radar Rhythms
### Brahmaputra FloodWatch | NASA Space Apps Challenge 2026
**Challenge:** Dancing with the SARs  
**Team:** FloodWatch SAR Team

> **Listening to Earth's changing waters through the rhythm of radar.**

Brahmaputra FloodWatch is an interactive Earth-observation platform that uses NASA–ISRO NISAR Synthetic Aperture Radar (SAR) data to explore water distribution and flood-related changes across the Brahmaputra River region in Assam, India.

By using radar observations rather than relying exclusively on optical satellite imagery, the platform demonstrates how Earth observation can support water monitoring even when cloud cover limits conventional optical observations.

---

## 🚀 Project Overview

Flooding is a recurring challenge across the Brahmaputra River basin. Monsoon rainfall, changing river channels and extensive floodplains make it difficult to monitor water distribution using ground observations alone.

**Radar Rhythms** explores how satellite radar data can help address this challenge through two distinct scientific studies:

### 1. Majuli Island — Single-Date Water Classification

- **Satellite data:** NASA–ISRO NISAR Level-2 GCOV
- **Track / Frame:** 015 / 3700
- **Observation date:** 27 August 2026
- **Raster grid:** 8,948 × 10,008 pixels
- **Pixel spacing:** 10 metres
- **Classified water area:** 797.55 km²
- **Vector output:** 13,821 water polygon features

This study uses HHHH-named GCOV backscatter data and adaptive thresholding to distinguish water-like radar responses from surrounding land.

### 2. Barpeta — Multi-Temporal Water Change Classification

- **Satellite data:** NISAR Level-2 GCOV
- **Track / Frame:** 019 / 075
- **Baseline observation:** 27 June 2026
- **Event observation:** 9 July 2026
- **Observation interval:** 12 days
- **Evaluated corridor:** 9.152 km²

| Measurement | Result |
|---|---:|
| Baseline classified water | 1.660 km² |
| Event classified water | 3.997 km² |
| Newly classified inundation | 2.337 km² |
| Relative classified water-area increase | +140.77% |

**Scientific qualification:** These results represent an empirical algorithmic classification for the evaluated Barpeta corridor. They are not an independently ground-validated or official mission-calibrated flood measurement, and they must not be interpreted as a basin-wide flood increase.

---

## 🛰️ Why NISAR?

The NASA–ISRO Synthetic Aperture Radar (NISAR) mission observes Earth's surface using active radar instruments.

The mission carries two radar systems:

- **L-band:** approximately 24 cm wavelength.
- **S-band:** approximately 9.3 cm wavelength.

Radar observations offer important advantages for environmental monitoring:

- Radar can acquire observations through ordinary cloud cover.
- It can operate during both daytime and nighttime.
- Radar backscatter responds to surface roughness, moisture, vegetation and water conditions.
- Longer-wavelength L-band observations can provide information about vegetation structure and interactions between vegetation and water.

Smooth open water often produces relatively low radar backscatter because much of the incoming radar energy is reflected away from the sensor. However, radar responses depend on surface conditions, vegetation, incidence angle and other factors. A dark radar pixel is not automatically proof of flooding.

---

## 🔬 Scientific Methodology

### 1. Adaptive Otsu Thresholding

Otsu thresholding separates a histogram into two classes by maximizing between-class variance.

For the Majuli study, an adaptive bimodal thresholding approach was used to distinguish water-like and land-like backscatter responses.

The reported threshold for this scene was approximately **-15.0 dB**.

### 2. Lee Speckle Filtering

SAR imagery contains speckle, a granular pattern caused by coherent radar signal interference.

A 3 × 3 local adaptive Lee filter is used to reduce speckle while attempting to preserve important spatial boundaries.

### 3. Multi-Temporal Change Classification

For the Barpeta study, two observations from the same track and frame are compared on a common raster grid.

The backscatter difference is expressed using a logarithmic ratio:

\[
\Delta \gamma^0 =
10\log_{10}
\left(
\frac{\gamma^0_{\mathrm{event}}}
{\gamma^0_{\mathrm{baseline}}}
\right)
\]

The implemented classification uses a change threshold and event-date backscatter conditions to identify pixels classified as newly inundated.

The resulting classes are:

| Class | Meaning |
|---|---|
| Stable land | Classified as land in both observations |
| Persistent water | Classified as water in both observations |
| Newly inundated | Classified as land initially and water in the event observation |
| Receded water | Classified as water initially and land in the event observation |

The two observations are aligned on a common grid. This supports pixel-wise comparison, but does not independently establish zero geometric error or eliminate every possible source of registration uncertainty.

---

## ⚠️ Scientific Integrity and Limitations

Transparency is essential when presenting satellite-derived environmental information.

The following limitations apply to the current studies:

- **Single-polarization processing:** Both operational study workflows currently use HHHH-named GCOV data values. HV-based cross-polarization analysis was not integrated into these results.
- **Polarization interpretation:** The physical polarization interpretation of the Barpeta CRNA-labelled products remains unresolved. Dataset names alone are not sufficient to establish the acquisition polarization.
- **Quality masks:** Official NISAR quality-mask filtering has not been established for the current production results. The Barpeta mask values require cautious interpretation.
- **ENL:** The nominal Equivalent Number of Looks value of 14.2 is a literature reference, not an independently measured scene-specific value.
- **No ground-truth validation:** The classified water areas and changes are remote-sensing algorithm outputs, not verified field measurements.
- **Barpeta scope:** The +140.77% result applies only to the evaluated 9.152 km² Barpeta corridor.
- **Event observation:** The 9 July 2026 observation is an event-date acquisition, not a verified seasonal flood peak.
- **Discharge:** Historical hydrological gauge estimates, where displayed, are not direct NISAR radar measurements.

For further details, see `docs/SCIENTIFIC_LIMITATIONS.md` if included in the repository.

---

## 🗺️ Application Features

The website brings satellite radar information into an interactive monitoring experience.

Key capabilities include:

- **Regional overview:** Explore selected Brahmaputra study reaches.
- **Majuli water classification:** View classified water extent and vector boundaries.
- **Barpeta change comparison:** Explore baseline and event observations.
- **Interactive maps:** Inspect geospatial classification outputs.
- **Data exports:** Download available GeoJSON, GeoTIFF and CSV products.
- **NISAR data inspection:** Explore available product metadata and observations.
- **Methodology:** Understand the radar principles and classification methods used.

Feature and download availability depends on which scientific assets are included in the deployed environment.

---

## 📡 Data Sources and Provenance

The project uses NASA–ISRO NISAR Level-2 GCOV products and related Earth-observation resources.

| Source | Purpose |
|---|---|
| NASA–ISRO NISAR | Satellite radar mission and science data |
| ISRO NRSC Bhoonidhi | NISAR data discovery and access |
| Alaska Satellite Facility (ASF) DAAC | NISAR data access and documentation |
| NASA Earthdata | Earth science data resources |

### Study datasets

**Majuli**
- Track 015 / Frame 3700
- Observation: 27 August 2026
- Product: Level-2 GCOV
- Grid: 8,948 × 10,008
- CRS: EPSG:32646

**Barpeta**
- Track 019 / Frame 075
- Baseline: 27 June 2026
- Event: 9 July 2026
- Product: Level-2 GCOV
- Evaluated corridor: 9.152 km²

### Remote data access

The project includes a remote HTTP Range-based data access workflow for retrieving selected portions of large remote HDF5 products.

This approach is intended to reduce unnecessary data transfer by accessing the requested portions rather than downloading an entire large granule.

---

## 📦 Technology Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Leaflet / React-Leaflet
- Recharts
- Lucide React

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- NumPy
- SciPy
- Rasterio
- H5py
- Pydantic

### Geospatial and data formats
- NISAR Level-2 GCOV
- HDF5
- GeoTIFF
- GeoJSON
- CSV
- UTM Zone 46N — EPSG:32646

---

## 🏗️ System Architecture

Radar Rhythms uses a React frontend and a Python FastAPI backend.

```text
             User / Web Browser
                     |
                     v
           React + Vite Frontend
                     |
                     v
              FastAPI Backend
                     |
          +----------+----------+
          |          |          |
          v          v          v
       NISAR       Water      Flood Change
      Metadata   Detection    Classification
          |          |          |
          +----------+----------+
                     |
                     v
             Scientific Data
          HDF5 / GeoTIFF / GeoJSON
                     |
                     v
            Interactive Map
             and Data Exports
```

The backend provides API endpoints for study summaries, observations, spatial boundaries, classification rasters and data exports.

---

## ⚙️ Installation and Local Setup

### Prerequisites

Install the following:

- Python 3.11 or later
- Node.js 18 or later
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/rathod-falgun/Radar-Rhythms.git
cd Radar-Rhythms
```

### 2. Backend setup

From the repository root:

```bash
python -m venv backend/.venv
```

Activate the virtual environment on Windows:

```powershell
backend\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Configure environment variables

Configure the frontend API base URL when using a separately hosted backend.

For local development, the Vite proxy is configured to forward API requests to the backend on port 8000.

For production, configure `VITE_API_BASE_URL` with the deployed backend URL before building the frontend.

---

## ▶️ Running the Application

Open two terminals from the repository root.

### Terminal 1 — Backend

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend API runs on port 8000.

---

## 🔗 API Reference

The backend exposes REST endpoints for the application's data and study results.

| Endpoint | Description |
|---|---|
| `GET /api/health` | Backend health check |
| `GET /api/regions` | Available study reaches |
| `GET /api/observations` | Available NISAR observations |
| `GET /api/compare` | Observation comparison |
| `GET /api/nisar/status` | NISAR service status |
| `GET /api/nisar/inspect` | Product metadata inspection |
| `GET /api/water/majuli/summary` | Majuli classification summary |
| `GET /api/water/majuli/boundaries` | Majuli water polygons |
| `GET /api/water/majuli/classification-raster` | Majuli classified GeoTIFF |
| `GET /api/water/majuli/source-raster` | Optional source HHHH GeoTIFF |
| `GET /api/flood/barpeta/summary` | Barpeta change summary |
| `GET /api/flood/barpeta/boundaries` | Barpeta change vectors |
| `GET /api/flood/barpeta/change-raster` | Barpeta change GeoTIFF |
| `GET /api/flood/barpeta/baseline-raster` | Baseline classification |
| `GET /api/flood/barpeta/event-raster` | Event classification |

The optional full-swath Majuli source HHHH raster is approximately 322.5 MB and is not part of the essential deployment package. Its endpoint may return HTTP 404 when the optional asset is not deployed.

---

## 🧪 Testing and Production Build

Run the backend test suite from the repository root:

```bash
python -m unittest discover -s backend/tests -v
```

Build the frontend for production:

```bash
npm --prefix frontend run build
```

The production frontend files are generated in:

```text
frontend/dist/
```

---

## ☁️ Deployment

The planned deployment architecture is:

| Component | Hosting |
|---|---|
| Source code | GitHub |
| Frontend | Netlify |
| Backend | Render |
| Custom domain | GoDaddy |

### Important data-packaging requirement

Some scientific output directories are excluded from Git to avoid committing large generated datasets.

A fresh Git clone therefore requires the relevant scientific output assets to be supplied separately before deploying the backend.

The deployment must include the required contents of:

```text
data/output/subsets/
data/output/change/
```

Ensure these directories are copied into the backend deployment environment at the expected paths.

The optional 322.5 MB source HHHH raster does not need to be included in the essential deployment package.

Configure production CORS origins and the frontend API base URL before deployment.

---

## 🏆 NASA Space Apps Challenge Alignment

**Dancing with the SARs** explores how synthetic aperture radar observations reveal changes on Earth's surface.

Radar Rhythms demonstrates this through:

- Exploring NISAR radar observations.
- Mapping water-like backscatter responses.
- Comparing observations from different dates.
- Visualizing classified water changes.
- Making geospatial outputs accessible through an interactive web application.
- Explaining the physical principles behind radar-based Earth observation.

The project aims to make complex satellite radar information easier to explore, understand and communicate.

---

## 📚 References

- [NASA–ISRO NISAR Mission](https://science.nasa.gov/mission/nisar/)
- [NASA NISAR Mission Overview](https://science.nasa.gov/mission/nisar/mission-overview/)
- [NASA NISAR About the Satellite](https://science.nasa.gov/mission/nisar/about-the-satellite/)
- [Alaska Satellite Facility DAAC](https://asf.alaska.edu/)
- [ISRO Bhoonidhi](https://bhoonidhi.nrsc.gov.in/)
- [NASA Earthdata](https://www.earthdata.nasa.gov/)

---

## 👥 Team

**FloodWatch SAR Team**

Developed for the **NASA Space Apps Challenge 2026**.

**Project:** Radar Rhythms — Brahmaputra FloodWatch  
**Challenge:** Dancing with the SARs

---

## 📄 License

See the repository's `LICENSE` file for licensing terms.

