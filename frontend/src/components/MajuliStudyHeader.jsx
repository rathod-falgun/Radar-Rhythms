import React from 'react';
import { Waves, Sparkles, Download, ShieldCheck, AlertCircle, Eye, Info, CheckCircle2 } from 'lucide-react';

export default function MajuliStudyHeader() {
  const handleDownloadGeoJSON = () => {
    window.open('/api/water/majuli/boundaries', '_blank');
  };

  const handleDownloadWaterGeoTIFF = () => {
    window.open('/api/water/majuli/classification-raster', '_blank');
  };

  const handleDownloadSourceRadar = () => {
    window.open('/api/water/majuli/source-raster', '_blank');
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-cyan-500/40 p-4 shadow-xl space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Study 1: Majuli Island — High-Resolution NISAR Water Detection
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Single-Date Satellite Extraction
              </span>
            </div>
            <p className="text-xs text-slate-400">
              NASA-ISRO NISAR Level-2 GCOV • Track 015 / Frame 3700 (Ascending Pass) • 27 August 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all"
            title="Download verified 13,821 vector water polygons (51.7 MB WGS84 GeoJSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export GeoJSON (13,821 Polygons)</span>
          </button>
          <button
            onClick={handleDownloadWaterGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/60 transition-all"
            title="Download classified water raster as GeoTIFF (EPSG:32646)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Water GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Download source Level 2 GCOV HHHH backscatter raster (322.5 MB GeoTIFF)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Source HHHH (322 MB)</span>
          </button>
        </div>
      </div>

      {/* Scientific Purpose & Why SAR for Water */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>Why SAR Detects Water</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Water acts as a specular (mirror) reflector to microwave radar. Pulses scatter away from the sensor, producing low backscatter (mean <span className="font-mono text-cyan-300 font-bold">-18.63 dB</span>) contrasting with rough dry land (<span className="font-mono text-slate-300 font-bold">-8.91 dB</span>).
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All-Weather Penetration</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Microwave radar (S-band 9.4 cm / L-band 24 cm) penetrates monsoon cloud cover, monsoonal rain, and smoke 24/7 without requiring sunlight, providing uninterrupted flood mapping when optical satellites are blinded.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Scope & Limitations</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            This is a single-date water detection study from Track 015 / Frame 3700. It uses single-pol HHHH with Adaptive Otsu (-15.0 dB) + Lee filter. Cross-pol (HVHV) suppression and official quality mask were deferred.
          </p>
        </div>
      </div>

      {/* 4 Quantitative Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60">
          <span className="text-[10px] text-cyan-300 uppercase font-semibold block">Water Extent</span>
          <span className="text-xl font-bold text-white font-mono">797.55 <span className="text-xs font-normal text-cyan-400">km²</span></span>
          <span className="text-[10px] text-slate-400 block mt-0.5">≈ 79,755 hectares</span>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/60">
          <span className="text-[10px] text-blue-300 uppercase font-semibold block">Swath Coverage</span>
          <span className="text-xl font-bold text-white font-mono">8.91<span className="text-xs font-normal text-blue-400">%</span></span>
          <span className="text-[10px] text-slate-400 block mt-0.5">of 8,955.16 km² UTM 46N raster</span>
        </div>

        <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/60">
          <span className="text-[10px] text-purple-300 uppercase font-semibold block">Vector Polygons</span>
          <span className="text-xl font-bold text-white font-mono">13,821</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">EPSG:4326 GeoJSON features</span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-300 uppercase font-semibold block">Algorithm & Mode</span>
          <span className="text-sm font-bold text-emerald-300 block font-mono mt-0.5">Otsu -15.0 dB</span>
          <span className="text-[10px] text-slate-400 block">Single-Pol HHHH + Lee Filter</span>
        </div>
      </div>

      {/* Critical Scientific Guardrail Notice */}
      <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-700/80 text-[11px] text-cyan-200 flex items-center gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <div>
          <strong className="text-white">Scientific Distinction:</strong> Majuli represents our authentic single-date SAR water classification. It is <strong>NOT</strong> a multi-date flood change result, and must never be associated with the +140.77% Barpeta flood expansion metric.
        </div>
      </div>
    </div>
  );
}

