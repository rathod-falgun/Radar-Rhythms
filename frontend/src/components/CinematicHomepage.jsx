import React from 'react';
import NisarCinematicEarth from './NisarCinematicEarth';
import GlassGridOverlay from './GlassGridOverlay';
import { ArrowRight } from 'lucide-react';

/**
 * CinematicHomepage — "Night-pass radar" editorial instrument layout
 * - Soft warm light bloom in top-left seamlessly blended into pure black background
 * - Thin 1px rgba(229,229,229,0.10) grid-line overlay across the hero at 4% opacity
 * - 3D Earth on pure black centered in fit manner
 * - Expanded glass tile grid overlaid over the top-right of Earth (1 row higher on top, 2 rows below)
 * - Drifting scan square with orange corner brackets and genuine NISAR metadata label
 * - Seamless natural text contrast on black background with zero artificial card borders
 * - Compact, cohesive vertical layout with zero dead space above the bottom bar
 */
export default function CinematicHomepage({ onExplore, onHowItWorks }) {
  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden bg-transparent text-[#e5e5e5] py-2 sm:py-4 select-none">
      {/* ========================================================================= */}
      {/* TOP HERO BAR: OBSERVATION BADGE                                           */}
      {/* ========================================================================= */}
      <div className="relative z-30 page-container flex items-center justify-between gap-4 pb-2">
        {/* Left: Small Upper Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded box-inner border border-[var(--border-outer)] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#fca311]"></span>
          <span className="text-xs font-mono tracking-widest text-[#e5e5e5]/90 uppercase">
            NASA–ISRO SAR OBSERVATION
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN HERO CONTENT & TIGHTLY CONNECTED BOTTOM BAR                       */}
      {/* ========================================================================= */}
      <div className="relative z-10 page-container w-full flex flex-col justify-center space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative">
          
          {/* ======================================================================= */}
          {/* LEFT COLUMN: EDITORIAL CONTENT (SEAMLESSLY BLENDED INTO BACKGROUND)    */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 space-y-4 lg:space-y-5 text-left relative z-20">
            {/* Giant Editorial Serif Headline */}
            <div className="space-y-1.5">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-editorial font-normal tracking-tight text-white leading-[1.02]">
                From Orbit<br />
                <span className="text-[#fca311] italic font-light">
                  to Insight.
                </span>
              </h1>
              <span className="text-xs font-mono tracking-widest text-[#e5e5e5]/60 uppercase block pt-1">
                RADAR RHYTHMS • ALL-WEATHER EARTH MONITOR
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#e5e5e5]/85 font-light leading-relaxed max-w-xl">
              Understanding dynamic water movements across the Brahmaputra floodplain through all-weather NISAR satellite observations.
            </p>

            {/* Two-Column Challenge / Solution Row with Orange Hairline */}
            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="box-inner rounded p-3.5 sm:p-4 border border-[var(--border-outer)] border-l-2 border-l-[#fca311] space-y-1.5 shadow-sm">
                <span className="text-xs font-mono tracking-widest uppercase text-white font-semibold block">
                  The Challenge
                </span>
                <p className="text-xs sm:text-[13px] text-[#e5e5e5]/75 leading-relaxed font-light">
                  Monsoon cloud cover conceals active floodwater from optical cameras. Penetrating radar is required to trace water boundaries through dense weather.
                </p>
              </div>

              <div className="box-inner rounded p-3.5 sm:p-4 border border-[var(--border-outer)] border-l-2 border-l-[#38bdf8] space-y-1.5 shadow-sm">
                <span className="text-xs font-mono tracking-widest uppercase text-[#38bdf8] font-semibold block">
                  The Solution
                </span>
                <p className="text-xs sm:text-[13px] text-[#e5e5e5]/75 leading-relaxed font-light">
                  Radar Rhythms processes NISAR L-band and S-band radar backscatter to delineate surface water extent and quantify multi-temporal inundation change.
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN: 3D EARTH + EXPANDED TOP-RIGHT GLASS GRID (+1 TOP, +2 BOT) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative w-full h-full min-h-[360px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[540px]">
            {/* Earth Canvas Shifted Left to Fit in Clean Manner */}
            <div className="relative w-full h-full flex items-center justify-center">
              <NisarCinematicEarth
                onExplore={onExplore}
                onHowItWorks={onHowItWorks}
              />
              {/* Glass Tile Grid located in Top-Right Corner of Earth (expanded +1 row top, +2 below) */}
              <div className="absolute top-[2%] right-[4%] sm:top-[3%] sm:right-[5%] md:top-[4%] md:right-[6%] w-[260px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] pointer-events-none z-20">
                <GlassGridOverlay />
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* 4. BOTTOM BAR: METADATA / NOTICE (LEFT) & ACTION BUTTONS (RIGHT)        */}
        {/* Placed directly below the content to eliminate any awkward gap          */}
        {/* ======================================================================= */}
        <div className="pt-3 sm:pt-4 border-t border-[#e5e5e5]/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Bottom-Left: Technical Metadata and Scientific Notice */}
            <div className="space-y-1 max-w-xl text-left">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tracking-wider text-[#e5e5e5]/60 uppercase">
                <span className="text-white font-semibold">NASA–ISRO NISAR</span>
                <span>•</span>
                <span>L-Band (24 cm) & S-Band (9.3 cm)</span>
                <span>•</span>
                <span className="text-[#fca311] font-medium">Open Science</span>
              </div>
              <p className="text-xs font-mono text-[#e5e5e5]/50 leading-relaxed">
                Scientific Notice: Observational remote-sensing water classifications. Not an operational emergency forecast system.
              </p>
            </div>

            {/* Bottom-Right: Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 self-start lg:self-auto">
              <button
                onClick={onExplore}
                className="px-7 py-3 rounded bg-[#fca311] text-black hover:bg-white text-xs sm:text-sm font-mono tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:translate-x-0.5"
              >
                <span>Launch Monitor</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                onClick={onHowItWorks}
                className="px-7 py-3 rounded border border-[#e5e5e5]/30 text-white hover:border-[#fca311] hover:text-[#fca311] text-xs sm:text-sm font-mono tracking-wider uppercase font-medium transition-all flex items-center justify-center cursor-pointer hover:translate-x-0.5"
              >
                <span>How It Works</span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
