import React from 'react';

/**
 * AboutProjectView
 * 
 * Scientific overview of Radar Rhythms:
 * - Mission & purpose of radar Earth observation
 * - Why the Brahmaputra floodplain requires microwave radar
 * - NASA–ISRO NISAR dual-frequency advantage
 * - Investigated study reaches (Majuli & Barpeta)
 * - Scope and scientific limitations
 * - Open Science acknowledgments
 */
export default function AboutProjectView() {
  return (
    <div className="space-y-8 w-full">
      {/* Hero Banner */}
      <div className="card-outer text-[#e5e5e5] rounded p-6 sm:p-10 relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fca311]"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded box-inner text-[#fca311] font-medium">
              Earth Observation & Radar Remote Sensing
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial tracking-tight text-white">
            About <span className="text-[#fca311] font-normal italic">Radar Rhythms</span>
          </h2>
          <p className="text-sm sm:text-base text-[#e5e5e5]/80 font-sans leading-relaxed pt-1">
            Radar Rhythms is an open-science platform designed to transform NASA–ISRO NISAR Synthetic Aperture Radar (SAR) observations into accessible water maps and multi-temporal flood change intelligence across the Brahmaputra floodplains.
          </p>
        </div>
      </div>

      {/* 4 Core Scientific Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pillar 1: Why the Brahmaputra Region Matters */}
        <div className="p-6 rounded card-outer space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-editorial font-bold text-white/40">
              01
            </span>
            <h3 className="text-base font-editorial font-semibold text-white">The Brahmaputra Floodplain Context</h3>
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            The Brahmaputra River is one of the world's most dynamic braided river systems. During the annual South Asian summer monsoon, extreme rainfall in the Eastern Himalayas causes widespread river swelling, submerging agricultural sandbars (chars) and cutting off transport across Majuli Island and surrounding districts.
          </p>
          <div className="p-3 rounded box-inner text-[11px] font-mono text-[#e5e5e5]/70">
            Persistent cloud cover blinds optical satellites. Microwave radar penetrates cloud decks to map surface water reliably.
          </div>
        </div>

        {/* Pillar 2: How NISAR Contributes */}
        <div className="p-6 rounded card-outer space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-editorial font-bold text-white/40">
              02
            </span>
            <h3 className="text-base font-editorial font-semibold text-white">The NASA–ISRO NISAR Advantage</h3>
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            The joint NASA–ISRO NISAR satellite carries dual-frequency Synthetic Aperture Radar: an L-band (24 cm wavelength) payload developed by NASA JPL and an S-band (9.3 cm wavelength) payload developed by ISRO SAC.
          </p>
          <div className="p-3 rounded box-inner text-[11px] font-mono text-[#e5e5e5]/70">
            Long 24 cm L-band penetrates dense canopies; 12-day repeat pass orbit provides consistent geometry for change detection.
          </div>
        </div>

        {/* Pillar 3: What Users Can Explore */}
        <div className="p-6 rounded card-outer space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-editorial font-bold text-white/40">
              03
            </span>
            <h3 className="text-base font-editorial font-semibold text-white">What You Can Explore</h3>
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            Through the Flood Monitor, users can investigate authentic processed NISAR Level-2 satellite observations:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded box-inner">
              <strong className="text-white block font-sans mb-1">• Majuli River Island Reach (Track 015):</strong>
              <span className="text-[#e5e5e5]/70 text-[11px]">Single-date water delineation mapping <span className="px-1.5 py-0.5 rounded card-highlight text-[#fca311] font-mono font-bold inline-block">797.55 km²</span> of surface water across 13,821 vector polygons.</span>
            </div>
            <div className="p-3 rounded box-inner">
              <strong className="text-white block font-sans mb-1">• Barpeta & Lower Floodplain Reach (Track 019):</strong>
              <span className="text-[#e5e5e5]/70 text-[11px]">Multi-temporal comparison evaluating an expansion from 1.660 km² to 3.997 km² (<span className="px-1.5 py-0.5 rounded card-highlight text-[#fca311] font-mono font-bold inline-block">+140.77%</span> water surge).</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Scientific Scope & Limitations */}
        <div className="p-6 rounded card-outer space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-editorial font-bold text-white/40">
              04
            </span>
            <h3 className="text-base font-editorial font-semibold text-white">Scientific Scope & Limitations</h3>
          </div>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            Radar Rhythms is an observational satellite remote-sensing analysis platform. It is <strong>NOT</strong> an operational real-time emergency warning system, nor does it provide flood forecasting or predictive hydrological simulation.
          </p>
          <div className="p-3 rounded box-inner text-[11px] font-mono text-[#fca311]">
            Classifications are remote-sensing estimates from single-pol HHHH backscatter, specific to the analyzed reach corridors.
          </div>
        </div>
      </div>

      {/* Citations & Open Science Acknowledgments */}
      <div className="card-outer rounded p-6 space-y-4 text-xs">
        <h3 className="text-base font-editorial font-semibold text-white">
          Institutional Acknowledgments & Open Data Sources
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[#e5e5e5]/80 font-sans">
          <div className="p-4 rounded box-inner">
            <strong className="text-white block font-editorial text-sm mb-1.5">NASA / JPL-Caltech</strong>
            <span className="text-xs text-[#e5e5e5]/70">NISAR L-band Radar Science Team, Science Data System (SDS), and GCOV product specifications.</span>
          </div>
          <div className="p-4 rounded box-inner">
            <strong className="text-white block font-editorial text-sm mb-1.5">ISRO / NRSC</strong>
            <span className="text-xs text-[#e5e5e5]/70">S-band SAR Payload, Space Applications Centre (SAC), and Bhoonidhi Open Data Access Portal.</span>
          </div>
          <div className="p-4 rounded box-inner">
            <strong className="text-white block font-editorial text-sm mb-1.5">NASA Earthdata / ASF</strong>
            <span className="text-xs text-[#e5e5e5]/70">Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC) SAR distribution.</span>
          </div>
          <div className="p-4 rounded box-inner">
            <strong className="text-white block font-editorial text-sm mb-1.5">ASDMA Assam</strong>
            <span className="text-xs text-[#e5e5e5]/70">Assam State Disaster Management Authority flood reporting and Kaziranga wildlife habitat context.</span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#e5e5e5]/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-[#e5e5e5]/50">
          <span>Open-Source Geospatial Implementation • Apache License 2.0</span>
          <span>Earth Radar Science Initiative • Dancing with the SARs</span>
        </div>
      </div>
    </div>
  );
}
