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
    <div className="card-outer rounded p-5 shadow-sm space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-outer)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-editorial font-semibold text-white tracking-wide">
              Majuli Island — High-Resolution NISAR Water Detection
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded box-inner text-[#fca311]">
              Single-Date Satellite Extraction
            </span>
          </div>
          <p className="text-xs text-[#e5e5e5]/70 font-mono mt-0.5">
            NISAR Level-2 GCOV • Track 015 / Frame 3700 (Ascending Pass) • 27 August 2026
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#fca311] hover:bg-white text-black font-semibold transition-all cursor-pointer"
            title="Download verified 13,821 vector water polygons (GeoJSON)"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export GeoJSON (13,821 Polygons)</span>
          </button>
          <button
            onClick={handleDownloadWaterGeoTIFF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded box-inner hover:border-[#fca311] text-[#e5e5e5] transition-all cursor-pointer"
            title="Download classified water raster as GeoTIFF"
          >
            <Download className="w-3.5 h-3.5 text-[#fca311]" />
            <span>Water GeoTIFF</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded box-inner hover:border-[#fca311] text-[#e5e5e5]/80 transition-all cursor-pointer"
            title="Download source Level 2 GCOV HHHH backscatter raster (322.5 MB GeoTIFF, optional asset)"
          >
            <span>Source HHHH (322 MB, Optional)</span>
          </button>
        </div>
      </div>

      {/* Scientific Purpose & Why SAR for Water */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded box-inner space-y-1.5">
          <div className="text-[#fca311] font-editorial font-semibold text-sm">
            Why SAR Detects Water
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed text-[11px]">
            Water acts as a specular reflector to microwave radar pulses. Signal scatters away from the satellite, producing low backscatter (mean <span className="font-mono text-[#fca311] font-bold">-18.63 dB</span>) contrasting sharply with rough dry land (<span className="font-mono text-white font-bold">-8.91 dB</span>).
          </p>
        </div>

        <div className="p-3.5 rounded box-inner space-y-1.5">
          <div className="text-white font-editorial font-semibold text-sm">
            All-Weather Penetration
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed text-[11px]">
            Microwave radar (S-band 9.4 cm / L-band 24 cm) penetrates cloud cover and precipitation day and night, providing uninterrupted surface mapping even during heavy monsoon cloud conditions.
          </p>
        </div>

        <div className="p-3.5 rounded box-inner space-y-1.5">
          <div className="text-[#fca311] font-editorial font-semibold text-sm">
            Scope & Processing Parameters
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed text-[11px]">
            High-resolution water detection from Track 015 / Frame 3700 using single-pol HHHH backscatter with Adaptive Otsu (-15.0 dB) and Lee speckle noise suppression across the 8,955.16 km² swath.
          </p>
        </div>
      </div>

      {/* 4 Quantitative Metric Cards (Level 3 for Key Result 797.55 km², Level 2 for Others) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded card-highlight">
          <span className="text-[10px] text-[#e5e5e5]/80 uppercase tracking-wider font-mono font-medium block">Water Extent</span>
          <span className="text-xl font-bold text-[#fca311] font-editorial">797.55 <span className="text-xs font-normal font-mono text-[#e5e5e5]/70">km²</span></span>
          <span className="text-[10px] font-mono text-[#e5e5e5]/70 block mt-0.5">≈ 79,755 hectares</span>
        </div>

        <div className="p-3 rounded box-inner">
          <span className="text-[10px] text-[#e5e5e5]/60 uppercase tracking-wider font-mono font-medium block">Swath Coverage</span>
          <span className="text-xl font-bold text-white font-editorial">8.91<span className="text-xs font-normal font-mono text-[#e5e5e5]/70">%</span></span>
          <span className="text-[10px] font-mono text-[#e5e5e5]/50 block mt-0.5">of 8,955.16 km² UTM 46N raster</span>
        </div>

        <div className="p-3 rounded box-inner">
          <span className="text-[10px] text-[#e5e5e5]/60 uppercase tracking-wider font-mono font-medium block">Vector Polygons</span>
          <span className="text-xl font-bold text-white font-editorial">13,821</span>
          <span className="text-[10px] font-mono text-[#e5e5e5]/50 block mt-0.5">EPSG:4326 GeoJSON features</span>
        </div>

        <div className="p-3 rounded box-inner">
          <span className="text-[10px] text-[#e5e5e5]/60 uppercase tracking-wider font-mono font-medium block">Algorithm & Mode</span>
          <span className="text-sm font-bold text-white block font-mono mt-0.5">Otsu -15.0 dB</span>
          <span className="text-[10px] font-mono text-[#e5e5e5]/50 block">Single-Pol HHHH + Lee Filter</span>
        </div>
      </div>

      {/* Critical Scientific Attribution Notice */}
      <div className="p-3 rounded box-inner text-[11px] text-[#e5e5e5]/80 leading-relaxed font-sans">
        <strong className="text-white font-semibold">Scientific Distinction:</strong> Majuli represents our authentic single-date SAR water classification. It is a single-date baseline and is not conflated with the multi-date Barpeta change detection results.
      </div>
    </div>
  );
}

