# Brahmaputra FloodWatch — Polished 3-Minute Competition Demo Script

**Project:** Dancing with the SARs: Brahmaputra FloodWatch  
**Challenge:** NASA Space Apps Challenge 2026 — Earth Science  
**Target Duration:** Exactly 3 Minutes (180 Seconds)  
**Presenter Roles:** Lead Presenter (Speaking) & Screen Navigator (UI Interaction)  

---

## [0:00 – 0:30] Opening: The Monsoon Cloud Barrier & Challenge Introduction

*(Visual: Screen begins on Brahmaputra FloodWatch homepage showing the Prussian Blue brand banner with "All-Weather Radar Flood Observation Portal".)*

**Presenter:**  
"Hello, judges! Welcome to **Brahmaputra FloodWatch**, our solution for NASA Space Apps Challenge 2026: *Dancing with the SARs*.

Every monsoon season, the Brahmaputra River in Assam, India swells into an inland sea, displacing millions of vulnerable farming families. But when disaster managers need satellite imagery the most, **optical satellites like Landsat and Sentinel-2 are 100% blind** due to weeks of unbroken monsoon cloud cover.

Our mission is to pierce through that cloud deck. Using authentic data from the **NASA-ISRO Synthetic Aperture Radar (NISAR)** observatory, Brahmaputra FloodWatch turns multi-gigabyte microwave radar telemetry into accessible, all-weather flood intelligence through an intuitive four-step workflow."

---

## [0:30 – 1:05] Step 1: Majuli Island — High-Resolution Single-Date Delineation

*(Visual: Screen navigator clicks "Majuli River Island (Track 015 / Frame 3700)" in Step 1. The map updates to show the Majuli bounding swath.)*

**Presenter:**  
"Let's begin with our first study area: **Majuli River Island**, the world's largest inhabited river island. 

Notice Step 2: exactly one observation pass is available in our processed archive—**27 August 2026**. Because only one pass is ready for Track 015, the interface automatically runs in single-date water extent mode, never fabricating a fake comparison.

Looking at the map, our adaptive Otsu thresholding algorithm at minus 15.0 decibels has mapped **797.55 square kilometers** of surface water across the 8,955 square kilometer bounding window—covering approximately 8.91% of the swath. 

Through dense monsoon storm clouds, the radar has cleanly extracted **13,821 discrete water polygons**, tracing the main braided channel, northern wetlands, and the critical Subansiri river confluence."

---

## [1:05 – 1:55] Step 2: Barpeta Floodplain — Before & After Multi-Temporal Comparison

*(Visual: Screen navigator clicks "Barpeta Floodplain (Track 019 / Frame 075)" in Step 1. Both observation dates [27 June 2026 Baseline and 09 July 2026 Event] light up in Step 2. The Leaflet map renders with the interactive swipe comparison slider.)*

**Presenter:**  
"Now let's examine our central innovation: **Multi-Temporal Change Detection** along the Barpeta river corridor.

Here we have two co-registered observations separated by a **12-day interval between available passes**: 27 June 2026 baseline, and 09 July 2026 event observation, both flying along Track 019 / Frame 075.

Watch the comparison slider. On the left is the pre-flood baseline: the permanent Brahmaputra channel occupies **1.660 square kilometers** or about 18% of this 9.152 square kilometer corridor.

Now, as I slide right to reveal the 09 July event pass, observe the dramatic expansion. Standing floodwater jumps to **3.997 square kilometers**, submerging low-lying agricultural sandbars (*chars*). That represents an increase in classified surface water of **plus 140.77%**—an expansion of **2.337 square kilometers** of newly inundated land."

---

## [1:55 – 2:25] Step 3: Transparent Attribution & Unsupported-Area Fallback

*(Visual: Screen navigator scrolls down to the "What Changed?" summary card, highlighting the attribution guardrail, and then clicks on an unsupported reach like "Guwahati Urban Reach" in the region selector.)*

**Presenter:**  
"Scientific honesty is central to FloodWatch. 

Our 'What Changed?' panel clearly explains that this plus 140.77% expansion is strictly confined to the evaluated **9.152 square kilometer Barpeta corridor**; it is not a basin-wide flood statistic. Nor do we claim ground truth—this is an observational proxy based on specular microwave reflection.

Notice what happens when I select an area where processed NISAR rasters are not yet available, such as **Guwahati Urban Reach**. Instead of displaying broken images or fabricating synthetic dates, the system presents a clear status banner explaining data availability and provides a one-click return to our verified study areas."

---

## [2:25 – 3:00] Conclusion & Spatial Deliverables

*(Visual: Screen navigator clicks back to Barpeta, showing the 'Complete 4-Class GeoTIFF' and 'Export Change GeoJSON' download buttons, then zooms out on the dark Prussian Blue / Space Indigo interface.)*

**Presenter:**  
"Finally, FloodWatch provides complete, open spatial deliverables. With one click, disaster response coordinators can download standardized, continuous 4-class GeoTIFF rasters for QGIS or lightweight OGC GeoJSON vectors for mobile deployment.

Behind the scenes, our HTTP Range streaming architecture downloads less than 1% of raw HDF5 files from ISRO's Bhoonidhi archive, delivering flood intelligence in seconds over rural mobile networks.

Brahmaputra FloodWatch turns the complex dance of radar waves into life-saving, cloud-penetrating clarity. Thank you!"

