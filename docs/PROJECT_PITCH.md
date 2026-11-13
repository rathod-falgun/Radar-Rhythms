# Dancing with the SARs: Brahmaputra FloodWatch
## NASA Space Apps Challenge 2026 Pitch Document

---

### One-Sentence Hook
> **When optical satellites are blinded by monsoon clouds, Brahmaputra FloodWatch unleashes NASA-ISRO NISAR radar to cut through storms 24/7, tracking flood surges with zero geometric parallax and pinpointing inundation across 79,000+ hectares of the world's most vulnerable river basin.**

---

### The Problem: Monsoonal Cloud Blindness & The Brahmaputra Crisis

Every monsoon season, the Brahmaputra River in Assam, India transforms from a majestic braided waterway into an unstoppable natural hazard. Over **30 million people**, hundreds of thousands of smallholder farmers living on shifting alluvial sandbars (*chars*), and the UNESCO World Heritage wetlands of Kaziranga National Park face life-threatening catastrophic inundation.

When emergency managers need satellite intelligence most, **conventional optical satellites (Landsat, Sentinel-2) are 100% blind**. South Asian monsoon cloud cover persists uninterrupted for weeks. Optical sensors see only white cloud decks while villages submerge below.

Disaster managers are left flying blind, relying on delayed river gauge reports that cannot map 2D spatial overland breach paths, animal corridor drownings, or embankment collapses.

---

### The Innovation: Dancing with the SARs — The NASA-ISRO NISAR Leap

The **NASA-ISRO Synthetic Aperture Radar (NISAR)** observatory fundamentally changes disaster science:

1. **Active Microwave Physics (All-Weather / 24-7):**
   - Transmitting active microwave radar pulses (L-band 24 cm and S-band 9.3 cm), NISAR penetrates heavy monsoonal rain, dense clouds, and total nighttime darkness.
   - Smooth standing water acts as a specular reflector, bouncing radar pulses away from the antenna into space, creating high-contrast, jet-black signatures (mean backscatter -18.63 dB vs. -8.91 dB for dry land).

2. **Exact 12-Day Orbital Invariance (Zero Geometric Parallax):**
   - Traditional satellite change detection struggles with variable look angles that distort terrain and create false flood detections along steep river bluffs.
   - NISAR flies an exact 12-day repeat orbit. By pairing **Track 019 / Frame 075** acquisitions across a 12-day interval (27 June vs. 09 July 2026), FloodWatch achieves **0.0-pixel geometric parallax**, unlocking direct decibel log-ratio subtraction ($\Delta\gamma^0 = 10 \log_{10}(\gamma^0_{evt} / \gamma^0_{base})$).

3. **Remote Bandwidth Revolution (99.34% Data Savings):**
   - NISAR Level-2 GCOV containers are massive (up to 30 GB per HDF5 file). Downloading complete granules during an active disaster overwhelms emergency internet bandwidth in rural Assam.
   - Brahmaputra FloodWatch pioneers a **remote HTTP Range streaming pipeline** from ISRO's Bhoonidhi archive. By reading only the HDF5 metadata tree and targeted bounding box byte offsets, we extract local study rasters while downloading **less than 0.66% of the raw file**, delivering mission intelligence in seconds over mobile networks.

---

### The Proof: Two Breakthrough Scientific Benchmarks

Brahmaputra FloodWatch proves its operational readiness with two verified, data-driven studies:

| Scientific Dimension | Study 1: Majuli Island Water Detection | Study 2: Barpeta Flood Change Dynamics |
|:---|:---|:---|
| **Satellite Mission** | NASA-ISRO NISAR Level-2 GCOV | NASA-ISRO NISAR Level-2 GCOV |
| **Orbit & Frame** | Track 015 / Frame 3700 (Ascending) | Track 019 / Frame 075 (Descending) |
| **Observation Dates** | 27 August 2026 (Single-Date Swath) | 27 June 2026 (Baseline) vs 09 July 2026 (Event) |
| **Analyzed Coverage** | 8,955.16 km² UTM 46N raster window | 9.152 km² active floodway corridor |
| **Measured Water Extent** | **797.55 km²** (79,755 hectares; 8.91% of swath) | Baseline: 1.660 km² ➔ Event: 3.997 km² |
| **Extracted Deliverables** | **13,821 georeferenced vector polygons** | **+140.77% Flood Surge** (+2.337 km² newly inundated) |
| **Key Scientific Insight** | High-density braiding & channel geometry mapped through cloud cover with Otsu thresholding (-15.0 dB). | Matched orbital geometry reveals true agricultural char submergence with 5.80 dB threshold exceedance margin. |

---

### Operational Impact & Personas

Brahmaputra FloodWatch is engineered for immediate adoption across three operational tiers:

- **🚨 Disaster First Responders (ASDMA / NDRF):**
  - Instant flood danger categorizations, automated highway inundation alerts (NH-715 speed limits), Kaziranga animal corridor safety monitoring (Panbari, Haldibari, Kanchanjuri), and 1-click RFC 7946 GeoJSON vector downloads for tactical GIS deployment in rescue boats.
- **🔬 Remote Sensing Radar Scientists:**
  - Full transparency into $\gamma^0_{HH}$ decibel distributions, bimodal Otsu separation, nominal ENL speckle weighting, live pixel-interrogation cursor with acoustic decibel sonification, and native EPSG:32646 32-bit floating-point GeoTIFF exports.
- **🎓 Citizens & Students:**
  - Plain-language science cards ("Why Water Looks Dark in Radar", "Why Trees Glow Green via Double-Bounce"), interactive SAR ray-tracing wavelength simulator (comparing L-band 24 cm, S-band 9.3 cm, and C-band 5.6 cm), and an interactive knowledge quiz.

---

### Scalability: From the Brahmaputra to the World

While calibrated on the Brahmaputra, the FloodWatch engine is globally generalizable:
- **Plug-and-Play NISAR Ingestion:** Natively reads standard NASA Alaska Satellite Facility (ASF) and ISRO Bhoonidhi Level-2 GCOV HDF5 formats.
- **Any Braided River or Floodplain:** Instantly re-targetable to the Mississippi, Ganges, Mekong, Amazon, or Danube basins by updating bounding box coordinates.
- **Sub-Second Performance:** Client-side Leaflet Canvas rendering displays 13,821 vector polygons smoothly at 60 FPS without server tile lag.

### The Pitch in Numbers
- **797.55 km²** verified water mapped in a single NISAR swath.
- **13,821** authentic vector polygons generated from 10 m radar pixels.
- **+140.77%** flood expansion detected with 0.0-pixel geometric parallax.
- **99.34%** bandwidth reduction via remote HTTP range streaming.
- **100%** all-weather operational capability — rain, clouds, night, or storm.

**Brahmaputra FloodWatch brings the power of NASA-ISRO NISAR down to the ground where lives are saved.**
