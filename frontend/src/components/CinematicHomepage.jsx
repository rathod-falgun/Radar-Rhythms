import React from 'react';
import NisarCinematicEarth from './NisarCinematicEarth';
import { ArrowRight } from 'lucide-react';

/**
 * CinematicHomepage
 * 
 * Radar Rhythms: The Cinematic Introduction
 * Deep-space aesthetic built with the Astro palette:
 * Port Gore (#1a1f3d), Chambray (#3b4a8c), Steel Blue (#587ebb), Cornflower (#87b8e8), Link Water (#c6e9f1).
 */
export default function CinematicHomepage({ onExplore, onHowItWorks }) {
  return (
    <div className="flex flex-col justify-center relative overflow-x-clip bg-gradient-to-b from-[#1a1f3d] via-[#1a1f3d] to-[#252f5e] text-[#c6e9f1]">
      {/* Background Starfield and Radial Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none bg-space-gradient star-field-subtle opacity-80"></div>
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#3b4a8c]/30 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#1a1f3d] blur-3xl pointer-events-none"></div>

      {/* Main Two-Column Editorial Hero Container */}
      <div className="relative z-10 max-w-[1536px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: EDITORIAL CONTENT & CALLS TO ACTION                         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-4 text-left">
            {/* Small Upper Label */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#222950] border border-[#587ebb]/50 shadow-sm">
              <img
                src="/assets/radar_rhythms_logo.jpg"
                alt="Logo"
                className="w-4 h-4 rounded-full object-cover border border-[#87b8e8]/50"
              />
              <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider text-[#c6e9f1] uppercase">
                NASA–ISRO EARTH OBSERVATION
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                FROM ORBIT<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#87b8e8] via-[#c6e9f1] to-white">
                  TO INSIGHT.
                </span>
              </h1>
              <div className="pt-1">
                <span className="text-xs sm:text-sm font-mono font-semibold text-[#87b8e8] tracking-widest uppercase block">
                  RADAR RHYTHMS
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-[#c6e9f1] font-medium leading-relaxed">
              Understanding dynamic water movements across the Brahmaputra floodplain through all-weather NISAR satellite observations.
            </p>

            {/* Problem Statement & Solution Editorial */}
            <div className="space-y-2.5 pt-0.5">
              <div className="border-l-2 border-[#587ebb] pl-3 space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#87b8e8] font-bold block">
                  The Observation Challenge
                </span>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  Monsoon cloud cover prevents optical satellites from observing active inundation. Flooding across the Brahmaputra floodplain requires penetrating radar wavelengths to map water boundaries through heavy weather.
                </p>
              </div>

              <div className="border-l-2 border-[#87b8e8] pl-3 space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#c6e9f1] font-bold block">
                  The Radar Solution
                </span>
                <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">
                  Radar Rhythms processes NISAR L-band and S-band radar backscatter to delineate surface water extent, track braided river corridor dynamics, and measure multi-temporal inundation change between orbital passes.
                </p>
              </div>
            </div>

            {/* Primary & Secondary CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5">
              <button
                onClick={onExplore}
                className="px-6 py-2.5 rounded-lg bg-[#87b8e8] hover:bg-[#c6e9f1] text-[#1a1f3d] font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#87b8e8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>LAUNCH RADAR MONITOR</span>
                <ArrowRight className="w-4 h-4 text-[#1a1f3d]" />
              </button>

              <button
                onClick={onHowItWorks}
                className="px-5 py-2.5 rounded-lg bg-[#222950] hover:bg-[#283262] text-white font-semibold text-xs sm:text-sm tracking-wide border border-[#587ebb]/50 hover:border-[#87b8e8] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>HOW IT WORKS</span>
              </button>
            </div>

            {/* Small Supporting Label & Open Science Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-y-1.5 gap-x-2.5 text-[10px] sm:text-[11px] font-mono text-[#87b8e8] border-t border-[#3b4a8c]/50">
              <span className="font-semibold text-white">POWERED BY NASA–ISRO NISAR</span>
              <span className="text-[#587ebb] hidden sm:inline">•</span>
              <span>L-band (24 cm) & S-band (9.3 cm)</span>
              <span className="text-[#587ebb] hidden sm:inline">•</span>
              <span className="text-[#c6e9f1]">Open Earth Science</span>
            </div>

            {/* Restrained Scientific Scope Disclaimer */}
            <p className="text-[9px] sm:text-[10px] text-slate-400 leading-normal max-w-xl">
              Scientific Notice: Radar Rhythms provides observational satellite remote-sensing water classifications. It is not an operational real-time emergency alert or predictive hydrological forecast system.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: FULL 3D EARTH & NISAR SATELLITE ORBIT (EXPANSIVE)           */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative w-full h-full min-h-[380px] sm:min-h-[480px] md:min-h-[560px] lg:min-h-[640px] xl:min-h-[680px]">
            <NisarCinematicEarth onExplore={onExplore} onHowItWorks={onHowItWorks} />
          </div>

        </div>
      </div>
    </div>
  );
}

