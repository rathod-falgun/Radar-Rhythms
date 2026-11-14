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
    <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/50 p-4 shadow-xl space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Barpeta Floodplain — Multi-Temporal NISAR Water Change Analysis
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#881337] text-white border border-[#f43f5e]">
              +140.77% Water Increase
            </span>
          </div>
          <p className="text-xs text-[#87b8e8]">
            NISAR Level-2 GCOV • Track 019 / Frame 075 (Single-Pol HHHH) • 27 June vs 09 July 2026 (12-Day Orbital Repeat)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#587ebb] hover:bg-[#87b8e8] text-white shadow-md transition-all cursor-pointer"
            title="Download water & flood change vector features (EPSG:4326 GeoJSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export GeoJSON (Vectors)</span>
          </button>
          <button
            onClick={handleDownloadChangeGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-[#c6e9f1] border border-[#587ebb]/50 transition-all cursor-pointer"
            title="Download complete 4-class spatial change raster as GeoTIFF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4-Class GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadBaselineGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-[#87b8e8] border border-[#3b4a8c] transition-all cursor-pointer"
            title="Download baseline water classification (27 June 2026 GeoTIFF)"
          >
            <span>Base T1 GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadEventGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-[#f43f5e] border border-[#881337] transition-all cursor-pointer"
            title="Download event observation water classification (09 July 2026 GeoTIFF)"
          >
            <span>Event T2 GeoTIFF</span>
          </button>
        </div>
      </div>

      {/* Orbit & Temporal Comparison Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="flex items-center justify-between text-[#87b8e8] font-bold">
            <span>T1 Baseline (Pre-Flood)</span>
            <span className="text-[10px] font-mono bg-[#1a1f3d] px-1.5 py-0.5 rounded border border-[#3b4a8c]">Cycle 024</span>
          </div>
          <div className="text-sm font-bold text-white">2026-06-27</div>
          <div className="text-[11px] text-slate-300">
            Water Area: <strong className="text-white font-mono">1.660 km²</strong> (166.0 ha)<br />
            Stage: Pre-breach braided flow.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="flex items-center justify-between text-[#f43f5e] font-bold">
            <span>T2 Event Observation</span>
            <span className="text-[10px] font-mono bg-[#1a1f3d] px-1.5 py-0.5 rounded border border-[#881337]">Cycle 025</span>
          </div>
          <div className="text-sm font-bold text-white">2026-07-09</div>
          <div className="text-[11px] text-slate-300">
            Water Area: <strong className="text-[#f43f5e] font-mono">3.997 km²</strong> (399.7 ha)<br />
            Stage: High-discharge event with char inundation.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="flex items-center justify-between text-[#c6e9f1] font-bold">
            <span>Consistent Orbital Geometry</span>
            <span className="text-[10px] font-mono bg-[#1a1f3d] px-1.5 py-0.5 rounded border border-[#587ebb]">Δt = 12 Days</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Matched orbit track and look angle minimize geometric parallax, enabling direct log-ratio subtraction: <span className="font-mono text-[#87b8e8] font-bold">Δγ° = 10 log₁₀(γ°_evt / γ°_base)</span>.
          </p>
        </div>
      </div>

      {/* 4 Standard WMO / NASA Flood Change Classes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        {/* Class 1: Newly Inundated */}
        <div className="p-2.5 rounded-lg bg-[#881337]/30 border border-[#f43f5e]/70">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shrink-0"></span>
            <span className="text-[10px] text-[#f43f5e] uppercase font-bold">Newly Inundated</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            +2.337 <span className="text-xs font-normal text-[#f43f5e]">km²</span>
          </div>
          <div className="text-[10px] text-[#f43f5e] font-bold mt-0.5">
            +140.77% Water Expansion
          </div>
        </div>

        {/* Class 2: Persistent Water */}
        <div className="p-2.5 rounded-lg bg-[#1a1f3d] border border-[#587ebb]/70">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#87b8e8] shrink-0"></span>
            <span className="text-[10px] text-[#87b8e8] uppercase font-bold">Persistent Water</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            1.660 <span className="text-xs font-normal text-[#87b8e8]">km²</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            Permanent Brahmaputra channel
          </div>
        </div>

        {/* Class 3: Receded Water */}
        <div className="p-2.5 rounded-lg bg-[#1a1f3d] border border-amber-500/50">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="text-[10px] text-amber-300 uppercase font-bold">Receded Water</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            0.000 <span className="text-xs font-normal text-amber-400">km²</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            Zero recession during 09 July event
          </div>
        </div>

        {/* Class 4: Stable Land */}
        <div className="p-2.5 rounded-lg bg-[#1a1f3d] border border-slate-700">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></span>
            <span className="text-[10px] text-slate-300 uppercase font-bold">Stable Land</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            5.155 <span className="text-xs font-normal text-slate-400">km²</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total Corridor: 9.152 km²
          </div>
        </div>
      </div>

      {/* Vector vs Raster Coverage Clarification */}
      <div className="p-2.5 rounded-lg bg-[#222950] border border-[#3b4a8c] text-[11px] text-slate-300">
        <strong className="text-white">Vector vs Raster Distinction:</strong> The <strong>Export GeoJSON</strong> contains 3 hydrological vector features (2 newly inundated flood polygons + 1 persistent channel polygon) deliberately omitting dry stable land to optimize vector transmission. The <strong>4-Class GeoTIFF</strong> raster provides full continuous pixel classification (5.155 km² stable land, 1.660 km² persistent water, 2.337 km² newly inundated, 0.000 km² receded water; 9.152 km² total corridor).
      </div>

      {/* Critical Scientific Attribution Notice */}
      <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/40 text-[11px] text-[#c6e9f1]">
        <strong className="text-white">Scientific Attribution Guardrail:</strong> This <strong>+140.77% water increase</strong> (+2.337 km² newly inundated land) was measured strictly for the <strong>Lower Brahmaputra / Barpeta reach</strong> (91.09°E–91.12°E, 26.63°N–26.66°N) across Track 019 / Frame 075 using single-polarization HHHH backscatter (Δγ° &lt; -4.50 dB threshold exceedance margin).
      </div>
    </div>
  );
}
    </div>
  );
}

