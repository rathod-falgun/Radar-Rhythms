# Brahmaputra FloodWatch — Project Submission Brief
## NASA Space Apps Challenge 2026 | Challenge: Dancing with the SARs

### Project Overview
**Brahmaputra FloodWatch** is an operational, satellite-based flood monitoring and water-body change detection web platform developed for the Brahmaputra River Basin in Assam, India. Powered by active radar observations from the **NASA–ISRO NISAR** mission (L-band and S-band SAR), the system penetrates chronic monsoon clouds and darkness to map flood inundation, detect flooded vegetation via double-bounce scattering, and deliver explainable decision support for disaster responders.

---

### Key Innovations
1. **12-Day Matched Geometry Pipeline:**
   Leverages NISAR's exact 12-day orbital repeat (Track 019 / Frame 075, Descending) between the **27 June 2026 pre-flood baseline** and the **09 July 2026 peak flood candidate scene**, eliminating viewing parallax.
2. **Adaptive Bimodal Otsu & Log-Ratio Inundation Engine:**
   Dynamically isolates water thresholds and computes decibel drops ($\Delta \sigma^0 \le -4.5\text{ dB}$).
3. **Polarimetric Double-Bounce Extraction:**
   Separates specular open water from flooded emergent reeds/canopies ($+3.0\text{ dB}$ surge), mapping $68.0\text{ km}^2$ of inundated vegetation across Kaziranga National Park.
4. **Adaptive Lee Speckle Filtering ($5\times 5$):**
   Suppresses coherent radar speckle while preserving crisp riverbanks, dikes, and roads.
5. **Interactive GIS Dashboard & Multi-Reach Matrix:**
   Curtain swipe comparator, real-time pixel probe, Leaflet satellite overlays, Recharts flood hydrographs, and 1-click RFC 7946 GeoJSON / CSV exports.

---

### Ground-Truth Hydrological Validation
* **CWC River Gauge Synchronization:** Validated against Tezpur gauge danger level ($65.23\text{ m}$) and peak discharge ($56,400\text{ m}^3/\text{s}$) on July 8–9, 2026.
* **Kaziranga Wildlife Safety:** $33.4\%$ of Kaziranga submerged ($286.8\text{ km}^2$ total water affectation), confirming animal corridor cut-offs along NH-715.

---

### Quick Launch Instructions
1. **Backend:** Run `.\run_backend.bat` (FastAPI on `http://127.0.0.1:8001`)
2. **Frontend:** Run `.\run_frontend.bat` (Vite on `http://localhost:5173`)
3. Open `http://localhost:5173` in your browser. Click **Judges Pitch Deck** in the top navbar to view the interactive presentation!
