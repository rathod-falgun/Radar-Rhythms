import React from 'react';
import { Download } from 'lucide-react';

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
    <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/50 p-4 shadow-xl space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Majuli Island — High-Resolution NISAR Water Detection
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#222950] text-[#c6e9f1] border border-[#587ebb]">
              Single-Date Satellite Extraction
            </span>
          </div>
          <p className="text-xs text-[#87b8e8]">
            NISAR Level-2 GCOV • Track 015 / Frame 3700 (Ascending Pass) • 27 August 2026
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#587ebb] hover:bg-[#87b8e8] text-white shadow-md transition-all cursor-pointer"
            title="Download verified 13,821 vector water polygons (GeoJSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export GeoJSON (13,821 Polygons)</span>
          </button>
          <button
            onClick={handleDownloadWaterGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-[#c6e9f1] border border-[#587ebb]/50 transition-all cursor-pointer"
            title="Download classified water raster as GeoTIFF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Water GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-[#87b8e8] border border-[#3b4a8c] transition-all cursor-pointer"
            title="Download source Level 2 GCOV HHHH backscatter raster (322.5 MB GeoTIFF)"
          >
            <span>Source HHHH (322 MB)</span>
          </button>
        </div>
      </div>

      {/* Scientific Purpose & Why SAR for Water */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="text-[#87b8e8] font-bold">
            Why SAR Detects Water
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Water acts as a specular reflector to microwave radar pulses. Signal scatters away from the satellite, producing low backscatter (mean <span className="font-mono text-[#87b8e8] font-bold">-18.63 dB</span>) contrasting sharply with rough dry land (<span className="font-mono text-slate-300 font-bold">-8.91 dB</span>).
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="text-[#c6e9f1] font-bold">
            All-Weather Penetration
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Microwave radar (S-band 9.4 cm / L-band 24 cm) penetrates cloud cover and precipitation day and night, providing uninterrupted surface mapping even during heavy monsoon cloud conditions.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/60 space-y-1">
          <div className="text-amber-300 font-bold">
            Scope & Processing Parameters
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            High-resolution water detection from Track 015 / Frame 3700 using single-pol HHHH backscatter with Adaptive Otsu (-15.0 dB) and Lee speckle noise suppression across the 8,955.16 km² swath.
          </p>
        </div>
      </div>

      {/* 4 Quantitative Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/50">
          <span className="text-[10px] text-[#87b8e8] uppercase font-semibold block">Water Extent</span>
          <span className="text-xl font-bold text-white font-mono">797.55 <span className="text-xs font-normal text-[#87b8e8]">km²</span></span>
          <span className="text-[10px] text-slate-400 block mt-0.5">≈ 79,755 hectares</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/50">
          <span className="text-[10px] text-[#87b8e8] uppercase font-semibold block">Swath Coverage</span>
          <span className="text-xl font-bold text-white font-mono">8.91<span className="text-xs font-normal text-[#87b8e8]">%</span></span>
          <span className="text-[10px] text-slate-400 block mt-0.5">of 8,955.16 km² UTM 46N raster</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/50">
          <span className="text-[10px] text-[#87b8e8] uppercase font-semibold block">Vector Polygons</span>
          <span className="text-xl font-bold text-white font-mono">13,821</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">EPSG:4326 GeoJSON features</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/50">
          <span className="text-[10px] text-[#87b8e8] uppercase font-semibold block">Algorithm & Mode</span>
          <span className="text-sm font-bold text-[#c6e9f1] block font-mono mt-0.5">Otsu -15.0 dB</span>
          <span className="text-[10px] text-slate-400 block">Single-Pol HHHH + Lee Filter</span>
        </div>
      </div>

      {/* Critical Scientific Attribution Notice */}
      <div className="p-2.5 rounded-lg bg-[#222950] border border-[#587ebb]/40 text-[11px] text-[#c6e9f1]">
        <strong className="text-white">Scientific Distinction:</strong> Majuli represents our authentic single-date SAR water classification. It is a single-date baseline and is not conflated with the multi-date Barpeta change detection results.
      </div>
    </div>
  );
}
    </div>
  );
}

