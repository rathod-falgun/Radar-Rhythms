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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#1a1f3d] via-[#222950] to-[#1a1f3d] text-[#c6e9f1] rounded-xl border border-[#587ebb]/40 p-6 sm:p-8 shadow-lg shadow-[#1a1f3d]/60 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#87b8e8] animate-pulse"></span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c] font-mono">
              Earth Observation & Radar Remote Sensing
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            About Radar Rhythms
          </h2>
          <p className="text-sm text-[#c6e9f1] leading-relaxed">
            Radar Rhythms is an open-science platform designed to transform NASA–ISRO NISAR Synthetic Aperture Radar (SAR) observations into accessible water maps and multi-temporal flood change intelligence across the Brahmaputra floodplains.
          </p>
        </div>
      </div>

      {/* 4 Core Scientific Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Why the Brahmaputra Region Matters */}
        <div className="p-5 rounded-xl bg-[#1a1f3d] border border-[#587ebb]/40 shadow-md space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c] flex items-center justify-center font-bold font-mono">
              01
            </div>
            <h3 className="text-sm font-semibold text-white">The Brahmaputra Floodplain Context</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The Brahmaputra River is one of the world's most dynamic braided river systems. During the annual South Asian summer monsoon, extreme rainfall in the Eastern Himalayas causes widespread river swelling, submerging agricultural sandbars (chars) and cutting off transport across Majuli Island and surrounding districts.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Persistent cloud cover during the monsoon renders conventional optical satellites (such as Landsat or Sentinel-2) virtually blind. Satellite radar is the only remote-sensing technology capable of penetrating cloud decks to image surface water reliably.
          </p>
        </div>

        {/* Pillar 2: How NISAR Contributes */}
        <div className="p-5 rounded-xl bg-[#1a1f3d] border border-[#587ebb]/40 shadow-md space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c] flex items-center justify-center font-bold font-mono">
              02
            </div>
            <h3 className="text-sm font-semibold text-white">The NASA–ISRO NISAR Advantage</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The joint NASA–ISRO NISAR satellite carries dual-frequency Synthetic Aperture Radar: an L-band (24 cm wavelength) payload developed by NASA JPL and an S-band (9.3 cm wavelength) payload developed by ISRO SAC.
          </p>
          <p className="text-slate-300 leading-relaxed">
            The long 24 cm L-band microwave pulses penetrate dense vegetation canopies and flooded grasslands, while its repeat-pass orbit provides consistent geometry for rigorous multi-temporal surface water comparison.
          </p>
        </div>

        {/* Pillar 3: What Users Can Explore */}
        <div className="p-5 rounded-xl bg-[#1a1f3d] border border-[#587ebb]/40 shadow-md space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c] flex items-center justify-center font-bold font-mono">
              03
            </div>
            <h3 className="text-sm font-semibold text-white">What You Can Explore</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Through the Flood Monitor, users can investigate authentic processed NISAR Level-2 satellite observations:
          </p>
          <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
            <li>
              <strong className="text-white">Majuli River Island Reach (Track 015):</strong> High-resolution single-date water delineation mapping 797.55 km² of surface water across 13,821 extracted water polygons on 27 August 2026.
            </li>
            <li>
              <strong className="text-white">Barpeta & Lower Floodplain Reach (Track 019):</strong> Two-date multi-temporal flood comparison evaluating an increase in classified water area from 1.660 km² (27 June) to 3.997 km² (09 July 2026) within the evaluated corridor (+140.77% relative change).
            </li>
          </ul>
        </div>

        {/* Pillar 4: Scientific Scope & Limitations */}
        <div className="p-5 rounded-xl bg-[#1a1f3d] border border-[#587ebb]/40 shadow-md space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#222950] text-amber-400 border border-[#3b4a8c] flex items-center justify-center font-bold font-mono">
              04
            </div>
            <h3 className="text-sm font-semibold text-white">Scientific Scope & Limitations</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Radar Rhythms is an observational satellite remote-sensing analysis platform. It is <strong>NOT</strong> an operational real-time emergency warning system, nor does it provide flood forecasting or predictive hydrological simulation.
          </p>
          <p className="text-slate-300 leading-relaxed">
            All presented water classifications represent satellite-detected surface water extent derived from single-polarization HHHH backscatter thresholding. Results are not independently validated ground-truth surveys and apply specifically to the analyzed reach corridors rather than the entire Brahmaputra basin.
          </p>
        </div>
      </div>

      {/* Citations & Open Science Acknowledgments */}
      <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/40 p-5 shadow-lg space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-white">
          Institutional Acknowledgments & Open Data Sources
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-300">
          <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/50">
            <strong className="text-white block mb-1">NASA / JPL-Caltech</strong>
            <span>NISAR L-band Radar Science Team, Science Data System (SDS), and GCOV product specifications.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/50">
            <strong className="text-white block mb-1">ISRO / NRSC</strong>
            <span>S-band SAR Payload, Space Applications Centre (SAC), and Bhoonidhi Open Data Access Portal.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/50">
            <strong className="text-white block mb-1">NASA Earthdata / ASF</strong>
            <span>Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC) SAR distribution.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#222950] border border-[#3b4a8c]/50">
            <strong className="text-white block mb-1">ASDMA Assam</strong>
            <span>Assam State Disaster Management Authority flood reporting and Kaziranga wildlife habitat context.</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#3b4a8c]/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Open-Source Geospatial Implementation • Apache License 2.0</span>
          <span>Earth Radar Science Initiative • Dancing with the SARs</span>
        </div>
      </div>
    </div>
  );
}
