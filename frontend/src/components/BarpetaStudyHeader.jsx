import React from 'react';
import { Download } from 'lucide-react';

export default function BarpetaStudyHeader({ thresholdDb, onThresholdChange, speckleFilter, onToggleSpeckleFilter }) {
  const handleDownloadGeoJSON = () => {
    window.open('/api/flood/barpeta/boundaries', '_blank');
  };

  const handleDownloadChangeGeoTIFF = () => {
    window.open('/api/flood/barpeta/change-raster', '_blank');
  };

  const handleDownloadBaselineGeoTIFF = () => {
    window.open('/api/flood/barpeta/baseline-raster', '_blank');
  };

  const handleDownloadEventGeoTIFF = () => {
    window.open('/api/flood/barpeta/event-raster', '_blank');
  };

  return (
    <div className="card-outer rounded p-5 shadow-sm space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-outer)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-editorial font-semibold text-white tracking-wide">
              Barpeta Floodplain — Multi-Temporal NISAR Water Change Analysis
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded card-highlight text-[#fca311]">
              +140.77% Water Increase (Experimental Classification)
            </span>
          </div>
          <p className="text-xs text-[#e5e5e5]/70 font-mono mt-0.5">
            NISAR Level-2 GCOV • Track 019 / Frame 075 (HHHH-named GCOV from CRNA product) • 27 June vs 09 July 2026 (12-Day Observation Interval)
          </p>
          <p className="text-[10px] text-[#fca311]/80 font-mono mt-0.5">
            ⚠ Scientific Notice: Official Level-2 GCOV subswath mask contains all-zero values across this reach; quantitative results reflect empirical algorithmic classification rather than ground-truth validated measurement.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#fca311] hover:bg-white text-black font-semibold transition-all cursor-pointer"
            title="Download water & flood change vector features (EPSG:4326 GeoJSON)"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export GeoJSON (Vectors)</span>
          </button>
          <button
            onClick={handleDownloadChangeGeoTIFF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded box-inner hover:border-[#fca311] text-[#e5e5e5] transition-all cursor-pointer"
            title="Download complete 4-class spatial change raster as GeoTIFF"
          >
            <Download className="w-3.5 h-3.5 text-[#fca311]" />
            <span>4-Class GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadBaselineGeoTIFF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded box-inner hover:border-[#fca311] text-[#e5e5e5]/80 transition-all cursor-pointer"
            title="Download baseline water classification (27 June 2026 GeoTIFF)"
          >
            <span>Base T1 GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadEventGeoTIFF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded box-inner hover:border-[#fca311] text-[#fca311] transition-all cursor-pointer"
            title="Download event observation water classification (09 July 2026 GeoTIFF)"
          >
            <span>Event T2 GeoTIFF</span>
          </button>
        </div>
      </div>

      {/* Orbit & Temporal Comparison Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded box-inner space-y-1.5">
          <div className="flex items-center justify-between text-[#e5e5e5]/70 font-mono text-xs font-semibold">
            <span>T1 Baseline (Pre-Flood)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border-outer)]">Cycle 024</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">2026-06-27</div>
          <div className="text-[11px] text-[#e5e5e5]/80 font-sans">
            Water Area: <strong className="text-white font-mono">1.660 km²</strong> (166.0 ha)<br />
            Stage: Pre-breach braided flow.
          </div>
        </div>

        <div className="p-3.5 rounded card-highlight space-y-1.5">
          <div className="flex items-center justify-between text-[#fca311] font-mono text-xs font-semibold">
            <span>T2 Event Observation</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--highlight-border)]">Cycle 025</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">2026-07-09</div>
          <div className="text-[11px] text-[#e5e5e5]/90 font-sans">
            Water Area: <strong className="text-[#fca311] font-mono">3.997 km²</strong> (399.7 ha)<br />
            Stage: High-discharge event with char inundation.
          </div>
        </div>

        <div className="p-3.5 rounded box-inner space-y-1.5">
          <div className="flex items-center justify-between text-white font-mono text-xs font-semibold">
            <span>Consistent Orbital Geometry</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border-outer)] text-[#fca311]">Δt = 12 Days</span>
          </div>
          <p className="text-[#e5e5e5]/80 leading-relaxed text-[11px] font-sans">
            Matched orbit track and look angle minimize geometric parallax, enabling direct log-ratio subtraction: <span className="font-mono text-[#fca311] font-bold">Δγ° = 10 log₁₀(γ°_evt / γ°_base)</span>.
          </p>
        </div>
      </div>

      {/* 4 Standard WMO / NASA Flood Change Classes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {/* Class 1: Newly Inundated (Level 3 Highlight) */}
        <div className="p-3 rounded card-highlight">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#fca311] shrink-0"></span>
            <span className="text-[10px] text-[#fca311] uppercase font-mono font-bold">Newly Inundated</span>
          </div>
          <div className="text-xl font-bold text-white font-editorial">
            +2.337 <span className="text-xs font-normal font-mono text-[#fca311]">km²</span>
          </div>
          <div className="text-[10px] text-[#fca311] font-mono font-bold mt-0.5">
            +140.77% Water Expansion
          </div>
        </div>

        {/* Class 2: Persistent Water */}
        <div className="p-3 rounded box-inner">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shrink-0"></span>
            <span className="text-[10px] text-white uppercase font-mono font-bold">Persistent Water</span>
          </div>
          <div className="text-xl font-bold text-white font-editorial">
            1.660 <span className="text-xs font-normal font-mono text-[#e5e5e5]/70">km²</span>
          </div>
          <div className="text-[10px] text-[#e5e5e5]/60 font-mono mt-0.5">
            Permanent Brahmaputra channel
          </div>
        </div>

        {/* Class 3: Receded Water */}
        <div className="p-3 rounded box-inner">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#e5e5e5]/40 shrink-0"></span>
            <span className="text-[10px] text-[#e5e5e5]/70 uppercase font-mono font-bold">Receded Water</span>
          </div>
          <div className="text-xl font-bold text-white font-editorial">
            0.000 <span className="text-xs font-normal font-mono text-[#e5e5e5]/70">km²</span>
          </div>
          <div className="text-[10px] text-[#e5e5e5]/60 font-mono mt-0.5">
            Zero recession during 09 July event
          </div>
        </div>

        {/* Class 4: Stable Land */}
        <div className="p-3 rounded box-inner">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#e5e5e5]/20 shrink-0"></span>
            <span className="text-[10px] text-[#e5e5e5]/70 uppercase font-mono font-bold">Stable Land</span>
          </div>
          <div className="text-xl font-bold text-white font-editorial">
            5.155 <span className="text-xs font-normal font-mono text-[#e5e5e5]/70">km²</span>
          </div>
          <div className="text-[10px] text-[#e5e5e5]/60 font-mono mt-0.5">
            Total Corridor: 9.152 km²
          </div>
        </div>
      </div>

      {/* Vector vs Raster Coverage Clarification */}
      <div className="p-3 rounded box-inner text-[11px] text-[#e5e5e5]/80 font-sans leading-relaxed">
        <strong className="text-white font-semibold">Vector vs Raster Distinction:</strong> The <strong>Export GeoJSON</strong> contains 3 hydrological vector features (2 newly inundated flood polygons + 1 persistent channel polygon) deliberately omitting dry stable land to optimize vector transmission. The <strong>4-Class GeoTIFF</strong> raster provides full continuous pixel classification (5.155 km² stable land, 1.660 km² persistent water, 2.337 km² newly inundated, 0.000 km² receded water; 9.152 km² total corridor).
      </div>

      {/* Critical Scientific Attribution Notice */}
      <div className="p-3 rounded box-inner text-[11px] text-[#e5e5e5]/80 font-sans leading-relaxed">
        <strong className="text-white font-semibold">Scientific Attribution Guardrail:</strong> This <strong>+140.77% water increase</strong> (+2.337 km² newly inundated land) was measured strictly for the <strong>Lower Brahmaputra / Barpeta reach</strong> (91.09°E–91.12°E, 26.63°N–26.66°N) across Track 019 / Frame 075 using single-polarization HHHH backscatter (Δγ° &lt; -4.50 dB threshold exceedance margin).
      </div>
    </div>
  );
}

