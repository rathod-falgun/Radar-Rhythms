import React from 'react';
import { TrendingUp, Sparkles, Download, Layers, AlertTriangle, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';

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
    <div className="bg-[#1a0f18] rounded-xl border border-rose-500/40 p-4 shadow-xl space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Study 2: Barpeta Floodplain — Multi-Temporal NISAR Flood Change
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                +140.77% Water Increase
              </span>
            </div>
            <p className="text-xs text-slate-400">
              NASA-ISRO NISAR Level-2 GCOV • Track 019 / Frame 075 (Single-Pol HHHH) • 27 June vs 09 July 2026 (12-Day Interval)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-600/20 transition-all"
            title="Download water & flood change vector features (EPSG:4326 GeoJSON; 3 polygons: persistent water & newly inundated)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Change GeoJSON (Vectors)</span>
          </button>
          <button
            onClick={handleDownloadChangeGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-700/60 transition-all"
            title="Download complete 4-class spatial change raster including stable land as GeoTIFF (EPSG:32646)"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Complete 4-Class GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadBaselineGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 transition-all"
            title="Download baseline water classification (27 June 2026 GeoTIFF)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Base T1 GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadEventGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-700/60 transition-all"
            title="Download event observation water classification (09 July 2026 GeoTIFF)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Event T2 GeoTIFF</span>
          </button>
        </div>
      </div>

      {/* Orbit & Temporal Comparison Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span>T1 Baseline (Pre-Flood)</span>
            <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">Cycle 024</span>
          </div>
          <div className="text-sm font-bold text-white">2026-06-27</div>
          <div className="text-[11px] text-slate-300">
            Water Area: <strong className="text-emerald-300 font-mono">1.660 km²</strong> (166.0 ha)<br />
            Stage: Pre-breach braided flow.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-rose-400 font-bold">
            <span>T2 Event Observation</span>
            <span className="text-[10px] font-mono bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">Cycle 025</span>
          </div>
          <div className="text-sm font-bold text-white">2026-07-09</div>
          <div className="text-[11px] text-slate-300">
            Water Area: <strong className="text-rose-300 font-mono">3.997 km²</strong> (399.7 ha)<br />
            Stage: High-discharge event with char inundation (not asserted as seasonal peak).
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-cyan-400 font-bold">
            <span>Consistent Orbital Geometry</span>
            <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">Δt = 12 Days</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Matched orbit track and look angle minimize geometric parallax, enabling direct log-ratio subtraction: <span className="font-mono text-cyan-300 font-bold">Δγ° = 10 log₁₀(γ°_evt / γ°_base)</span>.
          </p>
        </div>
      </div>

      {/* 4 Standard WMO / NASA Flood Change Classes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        {/* Class 1: Newly Inundated */}
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/80">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
            <span className="text-[10px] text-rose-300 uppercase font-bold">Newly Inundated</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            +2.337 <span className="text-xs font-normal text-rose-400">km²</span>
          </div>
          <div className="text-[10px] text-rose-300/80 font-bold mt-0.5">
            +140.77% Water Expansion
          </div>
        </div>

        {/* Class 2: Persistent Water */}
        <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/80">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="text-[10px] text-cyan-300 uppercase font-bold">Persistent Water</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            1.660 <span className="text-xs font-normal text-cyan-400">km²</span>
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">
            Permanent Brahmaputra channel
          </div>
        </div>

        {/* Class 3: Receded Water */}
        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/80">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="text-[10px] text-amber-300 uppercase font-bold">Receded Water</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            0.000 <span className="text-xs font-normal text-amber-400">km²</span>
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">
            Zero recession during 09 July event
          </div>
        </div>

        {/* Class 4: Stable Land */}
        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-600/80">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
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
      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 flex items-start gap-2">
        <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Vector vs Raster Distinction:</strong> The <strong>Export Change GeoJSON</strong> contains 3 hydrological vector features (2 newly inundated flood polygons + 1 persistent channel polygon) deliberately omitting dry stable land to optimize vector transmission. The <strong>Complete 4-Class GeoTIFF</strong> raster provides full continuous pixel classification (5.155 km² stable land, 1.660 km² persistent water, 2.337 km² newly inundated, 0.000 km² receded water; 9.152 km² total corridor).
        </div>
      </div>

      {/* Critical Scientific Guardrail Notice */}
      <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700/80 text-[11px] text-rose-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        <div>
          <strong className="text-white">Scientific Attribution Guardrail:</strong> This <strong>+140.77% water increase</strong> (+2.337 km² newly inundated land) was measured strictly for the <strong>Lower Brahmaputra / Barpeta reach</strong> (91.09°E–91.12°E, 26.63°N–26.66°N) across Track 019 / Frame 075 using single-polarization HHHH backscatter (Δγ° &lt; -4.50 dB threshold exceedance margin). Dual-pol (HVHV) cross-polarization was not utilized. It does <strong>NOT</strong> apply to Majuli Island (Track 015 / Frame 3700).
        </div> (+2.337 km² newly inundated land) was measured strictly for the <strong>Lower Brahmaputra / Barpeta reach</strong> (91.09°E–91.12°E, 26.63°N–26.66°N) across Track 019 / Frame 075 using single-polarization HHHH backscatter (Δγ° &lt; -4.50 dB threshold exceedance margin). Dual-pol (HVHV) cross-polarization was not utilized. It does <strong>NOT</strong> apply to Majuli Island (Track 015 / Frame 3700).
        </div>
      </div>
    </div>
  );
}

