# Brahmaputra FloodWatch — Project Story: Dancing with the SARs

**Project:** Dancing with the SARs: Brahmaputra FloodWatch  
**Challenge:** NASA Space Apps Challenge 2026  

---

## The Great River of Assam and the Monsoonal Blindfold

Every summer, the South Asian monsoon sweeps across the eastern Himalayas, channeling trillions of liters of water into the Brahmaputra River. Flowing through the state of Assam in Northeast India, the Brahmaputra transforms from a braided alluvial network into a colossal inland sea. Over 30 million people, hundreds of thousands of smallholder farmers living on shifting alluvial sandbars known as *chars*, and the world-renowned wildlife of Kaziranga National Park—home to the world's largest population of the great Indian one-horned rhinoceros—face annual life-threatening inundation.

Yet, precisely when disaster managers, rescue teams, and district commissioners need satellite intelligence the most, **they are struck blind**. 

Conventional optical Earth-observing satellites like Landsat, Sentinel-2, and MODIS rely on visible light. During the monsoon, dense tropical storm clouds blanket the Brahmaputra valley uninterrupted for weeks. Optical sensors see only white cloud decks while villages and livestock submerge below. By the time the skies clear, days or weeks later, floodwaters have already crested, subsided, and caused irreversible humanitarian and ecological destruction.

---

## Dancing with the SARs: The NASA-ISRO NISAR Breakthrough

To see through the clouds, we turn to the stars and the science of active radar. The **NASA-ISRO Synthetic Aperture Radar (NISAR)** observatory does not need sunlight or clear skies. Orbiting 747 kilometers above Earth, NISAR transmits active microwave pulses that pierce through cloud cover, torrential monsoonal downpours, and total nighttime darkness.

When these microwave pulses hit calm, standing floodwaters, the smooth water behaves like an electromagnetic mirror. The radar beam bounces forward into space, away from the satellite antenna. The sensor records an absence of returned signal—a signature known to radar scientists as **specular reflection**, appearing as a high-contrast, jet-black expanse against the gray diffuse scattering of dry land.

By matching the satellite's exact orbital repeat tracks across time, the Earth's surface appears frozen in identical geometry. This precise orbital repeatability unlocks a mathematical dance: **decibel log-ratio subtraction** ($\Delta\gamma^0 = 10 \log_{10}(\gamma^0_{\text{event}} / \gamma^0_{\text{base}})$), allowing us to measure exactly where water pushed into dry farmland from one pass to the next.

---

## Why the Brahmaputra Valley?

The Brahmaputra was chosen because it represents one of the most dynamic, high-stakes hydrologic environments on Earth:
1. **Extreme Braiding & Unstable Chars:** The riverbed spans up to 18 kilometers in width, constantly shifting its sandbars. Satellite water detection must operate at high spatial resolution (10 to 25 meters) to delineate intricate channels.
2. **Persistent Cloud Gaps:** Optical sensors fail here more consistently than almost anywhere else during July and August.
3. **Dual Global Scientific Collaboration:** As a joint mission between NASA and ISRO, deploying NISAR to protect communities along India's Brahmaputra embodies the core international partnership of the observatory.

---

## What Our Two Study Areas Demonstrate

### Study Area 1: Majuli Island — High-Resolution Water Extent
Majuli is the world's largest inhabited river island, surrounded by the main Brahmaputra channel to the south and the Kherkatia Suti / Subansiri rivers to the north. 
- Using a single NISAR Level-2 GCOV observation from **27 August 2026 (Track 015 / Frame 3700)**, our pipeline mapped **797.55 km²** of surface water across an 8,955.16 km² bounding swath (~8.91% swath coverage).
- It extracted **13,821 discrete water polygons**, demonstrating how adaptive Otsu thresholding (-15.00 dB cutoff) can cleanly separate intricate braided river channels, tributary junctions, and island wetlands through dense cloud cover.

### Study Area 2: Barpeta Floodplain — Multi-Temporal Change
Downstream in the Lower Brahmaputra corridor of Barpeta, low-lying agricultural chars face severe seasonal breach risks.
- Comparing two co-registered passes separated by a **12-day interval**—**27 June 2026 (Baseline T1)** versus **09 July 2026 (Event Observation T2)** along Track 019 / Frame 075—our multi-temporal change algorithm detected a dramatic expansion of surface water.
- Classified water area expanded from **1.660 km²** to **3.997 km²**, representing an increase in classified water area of **+140.77%** (+2.337 km² of newly inundated ground) across the evaluated 9.152 km² corridor.

---

## What the Results Mean — And What They Do NOT Mean

In the spirit of rigorous science, Brahmaputra FloodWatch establishes clear boundaries on what these numbers represent:

### What the Results Mean:
- They confirm that single-polarization HHHH radar backscatter provides an all-weather, day-and-night remote sensing proxy for surface water distribution.
- They prove that repeat-pass radar change detection can quantify surface water expansion across low-lying agricultural sandbars during active monsoon periods without cloud interference.
- They show that complex HDF5 satellite containers can be streamed via HTTP Range requests and translated into accessible web maps for non-technical users.

### What the Results Do NOT Mean:
- **Not Ground Truth:** Radar backscatter classification is an observational remote-sensing calculation; it is not an independently validated in-situ stream gauge or ground survey.
- **Not Flood Depth or Flow Velocity:** Radar backscatter measures surface roughness and dielectric contrast; it cannot determine whether floodwater is 10 centimeters or 3 meters deep, nor how fast it is flowing.
- **Not a Basin-Wide Statistic:** The +140.77% water increase applies **strictly to the evaluated 9.152 km² Barpeta corridor**. It must never be sensationalized as an Assam-wide or Brahmaputra-wide flood metric.
- **Not Continuous Real-Time Monitoring:** NISAR observations represent discrete temporal snapshots captured at the exact moment of satellite overpasses.

---

## How People Can Use Brahmaputra FloodWatch

Brahmaputra FloodWatch replaces complex command-line scripts and massive file downloads with an intuitive 4-step web workflow:
1. **Select an Area:** Choose between Majuli Island, Barpeta Floodplain, or upload a custom GeoJSON boundary.
2. **Select Observation Dates:** View authentic satellite acquisition dates available in the archive.
3. **Compare Water Maps:** Slide the interactive comparison tool back and forth to inspect pre-flood baseline water versus flood event inundation.
4. **Understand What Changed:** Read plain-English scientific summaries and download standardized 4-class GeoTIFF rasters and OGC GeoJSON vector files for local disaster planning in QGIS, ArcGIS, or mobile web tools.

By transforming raw radar telemetry into open, accessible, and scientifically grounded intelligence, Brahmaputra FloodWatch puts the power of NASA-ISRO radar directly into the hands of those who need it most.

