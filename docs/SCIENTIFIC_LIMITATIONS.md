# Scientific Limitations, Processing Caveats & Methodological Disclosures
## Brahmaputra FloodWatch — NASA Space Apps Challenge 2026: *Dancing with the SARs*

---

### Executive Statement on Scientific Integrity

The **Brahmaputra FloodWatch** platform is built on principles of open, transparent, and rigorous remote sensing science. In compliance with NASA Earth Science Data and Information System (ESDIS) standards and ISRO open-science protocols, this document details all mathematical assumptions, sensor boundaries, polarimetric choices, and spatial attribution limits governing the analysis.

Satellite-derived flood extents presented in this project are **observational remote sensing estimates**, not independent ground truth surveys.

---

### 1. Polarization Scope: Single-Polarization HHHH Processing

#### 1.1 Implementation Reality
- **Majuli Island (Track 015 / Frame 3700):** Processed strictly using **Single-Polarization Horizontal-Transmit Horizontal-Receive (HHHH)** backscatter ($\gamma^0_{HH}$).
- **Barpeta Floodplain (Track 019 / Frame 075):** Processed strictly using **Single-Polarization Horizontal-Transmit Horizontal-Receive (HHHH)** backscatter ($\gamma^0_{HH}$).
- **Source Verification:** In both study areas, the active rasters analyzed by the backend pipeline (`water_detector.py` and `flood_change_detector.py`) are `frequencyA_HHHH.tif`.

#### 1.2 Polarimetric Caveats
- **Dual-Polarization (HVHV) Status:** While the NISAR mission supports dual-polarization (HH/HV) and quad-polarization modes, cross-polarization ($HV$) processing was **deferred** in our operational water classification pipeline. In the Majuli scene extraction, HVHV extraction reached 55.3% before download truncation, and Barpeta processing utilized verified HHHH data only.
- **Vegetation Volume Scattering:** Cross-polarization ($HV$) is physically sensitive to volume scattering from unflooded forest canopies and agricultural crops. Without active $HV$ suppression, some false-positive water classifications may occur in low-backscatter smooth agricultural surfaces, and flooded vegetation detection relies on elevated HH backscatter rather than polarimetric decomposition.
- **Dual-Pol C2 Covariance Matrix:** Although the backend metadata structures and theoretical documentation describe the $2 \times 2$ covariance matrix $C_2 = \begin{bmatrix} \langle |S_{HH}|^2 \rangle & \langle S_{HH} S_{HV}^* \rangle \\ \langle S_{HV} S_{HH}^* \rangle & \langle |S_{HV}|^2 \rangle \end{bmatrix}$, the executed classification in this release is mathematically single-channel scalar backscatter ($C_1 = [\gamma^0_{HH}]$). Dual-polarization Radar Vegetation Index ($RVI = \frac{4\sigma^0_{HV}}{\sigma^0_{HH} + \sigma^0_{HV}}$) is modeled in the regional simulator but not derived from co-registered dual-channel rasters in the primary studies.

---

### 2. Radiometric Calibration & Equivalent Number of Looks (ENL)

#### 2.1 Level-2 GCOV Pre-Calibration
- Both input datasets are **NASA-ISRO NISAR Level-2 GCOV (Geocoded Polarimetric Covariance)** products.
- Level-2 GCOV products are natively processed to $\gamma^0$ (gamma naught) with **Radiometric Terrain Correction (RTC)** and map projection to UTM Zone 46N (`EPSG:32646`) already applied by the NISAR Science Data System (SDS).
- Our processing pipeline does not apply additional secondary terrain flattening or antenna pattern correction, avoiding destructive double-correction.

#### 2.2 ENL (Equivalent Number of Looks) Disclosure
- **Nominal vs. Measured:** The Equivalent Number of Looks value of $ENL = 14.2$ referenced in early design documentation represents a **nominal literature baseline** for multi-looked Level-2 GCOV data.
- **Scene Status:** In the active Majuli and Barpeta operational rasters, local ENL was **not independently measured** from homogeneous open-water test regions.
- **Lee Filter Formulation:** The speckle suppression algorithm utilizes adaptive Lee spatial window weighting based on local variance ($\hat{I} = \bar{I} + W(I - \bar{I})$). The filtering formulation assumes fully developed Rayleigh speckle statistics. In the UI Scientist Panel, ENL is accurately identified as **"Nominal / Not Independently Measured"**.

#### 2.3 Radiometric Stability Assumption Across 12-Day Revisit
- For the Barpeta change detection (27 June vs 09 July 2026), zero geometric parallax is guaranteed by the identical orbital track (Track 019 / Frame 075).
- However, absolute radiometric calibration stability across the 12-day inter-observation interval has **not been independently ground-calibrated** using corner reflectors or active transponders in the Brahmaputra valley.
- Environmental variables such as ionospheric scintillation (common at low geomagnetic latitudes for L-band) and subtle soil moisture baseline drift outside the flood corridor are assumed to be second-order compared to the large specular attenuation ($\Delta\gamma^0 < -4.50\text{ dB}$).

---

### 3. Spatial Attribution & Requisite Scope Isolation

#### 3.1 Strict Reach Attribution
- **+140.77% Flood Surge Metric:** This percentage surge (+2.337 km² newly inundated land over a 1.660 km² baseline channel) was measured strictly for the **Lower Brahmaputra / Barpeta reach corridor** (91.09°E–91.12°E, 26.63°N–26.66°N; 9.152 km² evaluated corridor).
- **Non-Transferability:** This metric **does NOT apply** to Majuli Island (Track 015 / Frame 3700), Kaziranga National Park, or the Brahmaputra Basin as a whole.
- **Majuli Swath:** The Majuli extraction covers an 8,955.16 km² UTM 46N raster window (8,948 × 10,008 pixels @ 10 m spacing), revealing **797.55 km²** of classified surface water (~8.91% swath coverage). This represents a single-date post-monsoon standing water extent, **not** a multi-date flood surge.

#### 3.2 Vector (GeoJSON) vs. Raster (GeoTIFF) Class Coverage
- **GeoTIFF Spatial Completeness:** The exported Barpeta change GeoTIFF (`change_2026-06-27_to_2026-07-09.tif`) contains the complete 4-class continuous spatial classification:
  - Class 0: Stable Unchanged Land (5.155 km²)
  - Class 1: Persistent Water (1.660 km²)
  - Class 2: Newly Inundated Floodwater (2.337 km²)
  - Class 3: Receded Floodwater (0.000 km²)
- **GeoJSON Optimization:** The Barpeta GeoJSON export (`change_2026-06-27_to_2026-07-09.geojson`) contains **3 vector polygon features**:
  - Feature #1: Newly inundated flood polygon (1.168 km²)
  - Feature #2: Persistent water channel polygon (2.088 km²)
  - Feature #3: Newly inundated flood polygon (1.169 km²)
  *(Totaling 2.337 km² new flood and 2.088 km² persistent channel geometry)*.
- **Design Rationale:** The vectorizer intentionally filters for active hydrological risk classes (`Persistent Water`, `Newly Inundated`, `Receded Water`), omitting dry stable land to prevent multi-megabyte payload bloat and ensure sub-second rendering on mobile web mapping clients.

---

### 4. Hydrological & Temporal Event Characterization

#### 4.1 Temporal Sampling (12-Day Revisit)
- NISAR operates on a fixed **12-day orbital repeat cycle**.
- The 09 July 2026 acquisition represents a **high-discharge flood event observation**, captured during the active July monsoonal surge.
- **Non-Peak Disclaimer:** Satellite passes cannot guarantee capture of the hydrological *instantaneous peak stage* (which may occur in hours between passes). The 09 July 2026 data is scientifically characterized as an **event observation**, not verified as the absolute seasonal flood peak.

#### 4.2 Quality Mask Deferred
- Official NISAR Level-2 GCOV products include auxiliary layers such as local incidence angle masks, layover/shadow masks, and quality flags.
- In the current single-band geotiff processing pipeline, ingestion of the official NISAR SDS quality mask was deferred. Pixels in deep radar shadow (rare in flat floodplains, but possible near steep river bluffs or embankments) may exhibit low backscatter that mimics specular water.

---

### 5. Physical Radar Backscatter Limitations

| Environmental Condition | Physical SAR Effect | Potential Classification Impact | Mitigation in FloodWatch |
|:---|:---|:---|:---|
| **High Wind (> 8 m/s)** | Surface capillary waves cause Bragg scattering, elevating water backscatter from -20 dB to -11 dB. | Wind-roughened open water may exceed the Otsu threshold (-15.0 dB) and be misclassified as land. | Multi-temporal differencing ($\Delta\gamma^0$) suppresses static rough water; future release adds wind-vector reclassification. |
| **Dense Closed Forest Canopy** | Microwave energy scatters in upper foliage; fails to reach ground water underneath dense multi-layer jungle. | Flooded jungle interior may be mapped as dry forest. | L-band (24 cm) exhibits ~4× deeper canopy penetration than C-band (5.6 cm); highlighted in Wavelength Simulator. |
| **Emergent Aquatic Vegetation** | Can cause double-bounce (HH enhancement) or diffuse scattering depending on plant density. | Thin reeds appear as water; dense reeds appear as bright land/vegetation. | 4-tier classification scheme separates open water from emergent saturated zones. |
| **Smooth Dry Sandbars (Chars)** | Smooth dry sand has low dielectric constant and low roughness, scattering specularly. | Sandy river chars can occasionally exhibit low backscatter mimicking water. | Multi-temporal differencing eliminates false positives because dry chars maintain constant backscatter over time. |

---

### 6. Summary of Safeguards Implemented

1. **No Data Fabrication:** All metrics displayed in the Majuli and Barpeta workspaces derive directly from actual raster pixel counts and GeoJSON polygon integrations.
2. **Clear UI Disclosures:** Every workspace header, analytics card, and scientist panel explicitly labels single-pol HHHH processing, nominal ENL status, and precise geographic boundaries.
3. **Transparent Export Metadata:** Downloaded GeoTIFFs preserve native EPSG:32646 georeferencing, floating-point units, and nodata headers; GeoJSON files preserve WGS84 coordinates and precise feature properties.
