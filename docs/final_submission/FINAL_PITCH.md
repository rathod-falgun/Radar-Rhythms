# Brahmaputra FloodWatch — Final Competition Pitch Narrative

**Project:** Dancing with the SARs: Brahmaputra FloodWatch  
**Challenge:** NASA Space Apps Challenge 2026 — Earth Science / *Dancing with the SARs*  

---

## 1. Problem: The Monsoonal Cloud Blindfold
In the Brahmaputra Basin of Assam, Northeast India, catastrophic annual monsoon floods threaten over 30 million people and delicate ecosystems like Kaziranga National Park. During peak emergency windows, **conventional optical satellites (Landsat, Sentinel-2) are 100% blind** due to continuous cloud decks. Emergency managers are left flying blind without 2D spatial maps of breach pathways or submerged settlements.

---

## 2. Solution: Dancing with the SARs
**Brahmaputra FloodWatch** leverages active microwave radar from the **NASA-ISRO Synthetic Aperture Radar (NISAR)** observatory to penetrate heavy storm clouds, rain, and darkness 24/7. It delivers an intuitive, user-driven web platform that translates multi-gigabyte radar datasets into high-contrast water delineations, before-and-after change comparisons, and open GIS downloads.

---

## 3. Data: Authentic NASA-ISRO Products
Our pipeline operates exclusively on authentic satellite products:
- **Level-2 GCOV (Geocoded Polarimetric Covariance):** Radiometrically terrain-corrected ($\gamma^0_{HH}$) and projected to UTM Zone 46N (`EPSG:32646`).
- **Archive Source:** ISRO Bhoonidhi Open Data Portal and NASA Science Data System (SDS).
- **Physical Granules:**
  - Majuli Island: 27 August 2026 (Track 015 / Frame 3700, 10m grid).
  - Barpeta Corridor: 27 June 2026 Baseline & 09 July 2026 Event (Track 019 / Frame 075, 25.21m grid).

---

## 4. Method: Rigorous Radar Processing
1. **Linear-to-dB Conversion:** $\gamma^0_{\text{dB}} = 10 \log_{10}(\gamma^0_{\text{linear}})$.
2. **Speckle Suppression:** Adaptive $5 \times 5$ spatial Lee filter preserving sharp riverbanks while smoothing water noise.
3. **Adaptive Thresholding:** Automatic Otsu bimodal segmentation identifying the $-15.00\text{ dB}$ water cutoff.
4. **Repeat-Pass Change Detection:** Co-registered decibel log-ratio subtraction ($\Delta\gamma^0 = 10 \log_{10}(\gamma^0_{\text{event}} / \gamma^0_{\text{base}})$) with a $-4.50\text{ dB}$ flood threshold.
5. **Topology-Corrected Vectorization:** Polygon area calculation using the Shoelace formula with complete interior hole subtraction.

---

## 5. Results: Verified Physical Metrics
- **Majuli Island (Single-Date Delineation):**
  - Classified water area: **797.55 km²** (~8.91% of the 8,955.16 km² bounding window).
  - Cleanly extracted **13,821 discrete water polygons** through dense monsoonal clouds.
- **Barpeta Corridor (Two-Date Flood Change):**
  - Evaluated corridor: **9.152 km²** (14,400 pixels).
  - Baseline water: **1.660 km²** (18.14%) $\to$ Event water: **3.997 km²** (43.67%).
  - Newly inundated ground: **+2.337 km²** (**+140.77% water expansion**).
  - Stable land: **5.155 km²** (56.33%); Receded water: **0.000 km²** (0.00%).

---

## 6. Innovation: Why It Stands Out
1. **Remote HTTP Range Streaming:** Reads byte offsets and HDF5 metadata directly from ISRO's Bhoonidhi archive, downloading less than **0.66% of raw 30 GB files** (99.34% bandwidth reduction).
2. **Co-Registered Orbital Invariance:** Leverages matched tracks and look angles (Track 019 / Frame 075) across 12-day intervals to minimize geometric parallax.
3. **Dual Spatial Dissemination:** Continuous 4-class GeoTIFF rasters for GIS professionals plus lightweight OGC GeoJSON vectors for mobile deployment.
4. **Transparent Attribution:** Clear guardrails prevent misinterpreting satellite proxies as in-situ depth measurements or localized metrics as basin-wide totals.

---

## 7. Impact: Humanitarian and Environmental
- **Disaster Response:** Enables the Assam State Disaster Management Authority (ASDMA) and rescue teams to map breach locations and marooned char settlements through unbroken cloud cover.
- **Ecological Protection:** Monitors seasonal inundation patterns across wetlands adjacent to Kaziranga National Park.
- **Community Empowerment:** Provides smallholder farmers and community leaders with objective spatial evidence for relief distribution.

---

## 8. Limitations: Honest Scientific Guardrails
- **No In-Situ Depth:** Radar detects surface specular water extent; it does not measure water column depth, flow velocity, or river discharge.
- **Single-Polarization:** Operates on single-polarization HHHH backscatter; cross-polarization ($HV$) decomposition was deferred.
- **Localized Change Scope:** The +140.77% expansion metric is strictly confined to the evaluated 9.152 km² Barpeta corridor.
- **Discrete Timing:** Captures surface conditions at the exact moment of satellite overpasses rather than continuous hydrograph peaks.

---

## 9. Future Potential: Scaling the Architecture
- **Automated Processing Pipeline:** Scale the Bhoonidhi HTTP Range extraction daemon across all 14 river reaches in the Brahmaputra Valley as new NISAR granules are published.
- **Hydrological Model Coupling:** Integrate NISAR water masks into 2D hydrodynamic models (e.g., HEC-RAS / LISFLOOD-FP) to invert surface water extent into water column depth.
- **Dual-Pol Polarimetric Decomposition:** Integrate co-registered HV backscatter to detect flooded vegetation beneath tree canopies via double-bounce scattering.

