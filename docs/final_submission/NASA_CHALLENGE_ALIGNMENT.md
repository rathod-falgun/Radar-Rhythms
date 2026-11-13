# Brahmaputra FloodWatch — NASA Challenge Alignment & Synthesis

**Project:** Dancing with the SARs: Brahmaputra FloodWatch  
**Challenge:** NASA Space Apps Challenge 2026 — Earth Science / *Dancing with the SARs*  

---

## 1. Challenge Objectives to Implementation Mapping

| NASA Challenge Objective | Brahmaputra FloodWatch Implementation | Actual Evidence in Project | Remaining Limitation / Guardrail |
| :--- | :--- | :--- | :--- |
| **Track Earth's Surface Changes Using SAR** | Operationalizes NASA-ISRO NISAR Level-2 GCOV repeat-pass acquisitions to track surface water dynamics across the Brahmaputra Basin. | `data/output/change/2026-06-27_to_2026-07-09/` contains verified 4-class change raster and vector outputs. | Evaluated change is currently demonstrated on a 9.152 km² Barpeta corridor, not the entire 580,000 km² basin. |
| **Bridge the Gap Between Satellite Telemetry & Public Understanding** | Simplified 4-step user workflow (`Select Area -> Select Dates -> Compare Map -> Understand Changes`) with plain-English scientific explanations. | React frontend (`App.jsx`, `WhatChangedCard.jsx`, `MapViewer.jsx`) with interactive before-and-after swipe comparison slider. | Radar water detection is a surface proxy and does not measure water column depth or river discharge. |
| **Demonstrate All-Weather Radar Capabilities** | Highlights microwave cloud penetration during peak South Asian monsoons when optical satellites (Landsat, Sentinel-2) are 100% cloud-blind. | Majuli water delineation (27 Aug 2026) maps 797.55 km² water through dense cloud cover with 13,821 extracted water polygons. | Calibrated against radar specular reflection, not direct in-situ ground gauge truth. |
| **Quantify Surface Changes Over Time ("Dancing with the SARs")** | Decibel log-ratio change detection ($\Delta\gamma^0 = 10 \log_{10}(\gamma^0_{\text{event}} / \gamma^0_{\text{base}})$) across a 12-day orbital interval (Track 019 / Frame 075). | Barpeta change metrics: Baseline 1.660 km² $\to$ Event 3.997 km² = **+140.77% water increase** (+2.337 km² newly inundated land). | 09 July 2026 is an authentic satellite observation pass, not an asserted seasonal flood peak discharge. |
| **Provide Open, Actionable Spatial Data Deliverables** | Standardized continuous 4-class GeoTIFF rasters and OGC GeoJSON vector boundaries downloadable directly from the interface. | Live download endpoints `/api/flood/barpeta/change-raster` and `/api/flood/barpeta/boundaries` deliver standard GIS files. | GeoJSON vector files export only water classes (3 polygons) to optimize bandwidth; 4-class accounting is in the GeoTIFF. |
| **Ensure High Scientific Integrity & Transparency** | Strict attribution guardrails; explicit fallbacks for unsupported study reaches without processed satellite data. | Selecting Guwahati or Kaziranga displays an informative status banner without fabricating dates or synthetic data. | Scene extraction requires pre-discovered NISAR acquisitions in the target coordinate bounding box. |

---

## 2. Answers to Core Challenge Research Questions

### Q1: What exact problem is the challenge asking participants to solve?
Earth's surface is constantly moving and changing due to natural disasters (floods, earthquakes, volcanic eruptions, landslides) and human activities. However, raw Synthetic Aperture Radar (SAR) data products—such as complex multi-gigabyte NISAR containers—are mathematically dense, visually unintuitive to non-specialists, and difficult to access over limited internet bandwidth. The challenge asks participants to build an interactive application that translates radar remote sensing observations into clear, engaging, and accessible tools that track and communicate dynamic Earth surface changes.

### Q2: Why are SAR observations useful for tracking Earth's surface changes?
Unlike optical sensors that depend on reflected sunlight and are blinded by atmospheric clouds, rain, and nighttime darkness, SAR is an active microwave instrument that emits its own electromagnetic pulses ($\lambda \approx 1 - 30\text{ cm}$). Because microwave wavelengths are vastly larger than cloud droplets, radar waves penetrate storm systems unhindered, providing guaranteed, all-weather, day-and-night observation of Earth's changing surface.

### Q3: What does NISAR measure?
The NASA-ISRO Synthetic Aperture Radar (NISAR) measures the amplitude and phase of radar echoes backscattered from the Earth's surface in both L-band (24 cm, NASA) and S-band (9.3 cm, ISRO). By recording the complex polarimetric scattering matrix ($S_{HH}, S_{HV}, S_{VH}, S_{VV}$) and repeating observations along identical orbital tracks, NISAR measures surface roughness, moisture, dielectric properties, vegetation structure, and millimetric surface displacement through radar interferometry (InSAR).

### Q4: What are the capabilities and limitations of NISAR Level-2 GCOV data?
- **Capabilities:** GCOV (Geocoded Polarimetric Covariance) products provide multi-looked, Radiometric Terrain Corrected (RTC) $\gamma^0$ backscatter values projected directly onto standard cartographic grids (UTM Zone 46N), eliminating the need for complex secondary Doppler terrain flattening or geometric rectification by end users.
- **Limitations:** GCOV containers are large (multi-gigabyte HDF5 structures), contain speckle noise requiring spatial filtering, and collapse phase information into covariance powers, meaning they are intended for backscatter intensity and polarimetric analysis rather than phase interferometric line-of-sight displacement.

### Q5: What can HHHH co-polarized backscatter reveal about surface-water changes?
Calm open water acts as an electromagnetic specular reflector, bouncing incident microwave pulses forward away from the antenna and creating an exceptionally low backscatter return ($\gamma^0_{HH} < -18.0\text{ dB}$). Co-polarized HHHH backscatter reveals the precise geographical extent of standing surface water, tracks channel bifurcation, and detects newly flooded ground when a location transitions from rough soil ($\approx -9.0\text{ dB}$) to specular water ($\approx -20.0\text{ dB}$, yielding a drop $\Delta\gamma^0 < -4.50\text{ dB}$).

### Q6: What can HHHH backscatter NOT establish without additional data?
1. It **cannot** measure water column depth ($m$), flow velocity ($m/s$), or volumetric river discharge ($m^3/s$).
2. It **cannot** detect floodwaters beneath dense emergent tree canopies, where double-bounce scattering elevates backscatter instead of decreasing it.
3. It **cannot** easily distinguish wind-roughened water (where Bragg waves reflect energy back to the antenna) from wet soil without auxiliary wind speed data.
4. It **cannot** distinguish very smooth dry surfaces (e.g. airport runways or smooth sand) from water on a single date without multi-temporal baseline subtraction.

### Q7: Why is multi-temporal comparison important?
Single-date radar observations only reveal current surface roughness. Without a baseline, smooth dry ground can be mistaken for water, and permanent river channels cannot be separated from seasonal flood inundation. Multi-temporal comparison across matched orbital repeat passes isolates dynamic hydrologic expansion from permanent geography, enabling automated 4-class accounting (stable land, persistent water, newly inundated land, and receded water).

### Q8: How does an interactive map and before/after comparison make radar observations easier to understand?
Raw radar images appear as grainy, grayscale arrays of decibel values that are difficult for the public or emergency managers to interpret. An interactive swipe comparison slider allows users to physically peel back the flood event layer to reveal the pre-flood baseline beneath, providing immediate visual intuition of where water overtopped natural banks.

### Q9: How does Brahmaputra FloodWatch directly satisfy the challenge?
Brahmaputra FloodWatch takes authentic NISAR Level-2 GCOV data over one of the most flood-vulnerable and cloud-covered river basins on Earth (the Brahmaputra in Assam), applies verified scientific algorithms (speckle filtering, adaptive Otsu thresholding, decibel log-ratio subtraction), and presents the results in an accessible 4-step web portal with downloadable GIS evidence.

### Q10: What is genuinely innovative about the current implementation compared with simply displaying satellite imagery?
1. **Remote HTTP Range Streaming:** Rather than requiring users or servers to download complete 30 GB HDF5 containers, our pipeline streams only targeted byte-range bounding boxes from ISRO's Bhoonidhi archive (achieving up to 99.34% bandwidth savings).
2. **True Co-Registered Decibel Differencing:** Rather than qualitative visual overlay, our backend performs quantitative pixel-level decibel differencing ($\Delta\gamma^0$) backed by verified physical thresholds.
3. **Dual Spatial Dissemination:** It simultaneously produces continuous 4-class GeoTIFF rasters for GIS professionals and topology-corrected OGC GeoJSON vectors with hole subtraction for lightweight web delivery.
4. **Transparent Scientific Attribution:** It explicitly refuses to extrapolate localized char inundation (+140.77% across 9.152 km²) to the whole basin and gracefully alerts users when observations are unavailable for other reaches.

