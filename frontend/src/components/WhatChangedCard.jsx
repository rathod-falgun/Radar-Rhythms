import React from 'react';
import { HelpCircle, TrendingUp, Waves, AlertTriangle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export default function WhatChangedCard({ selectedRegionId, comparisonData, baselineDate, eventDate }) {
  const isMajuli = selectedRegionId === 'majuli';
  const isBarpeta = selectedRegionId === 'barpeta';

  return (
    <div className="bg-[#1C2541] rounded-xl border border-[#3A506B]/50 p-5 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#3A506B]/40">
        <div className="w-7 h-7 rounded-md bg-[#0B132B] text-[#5BC0BE] border border-[#3A506B]/60 flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-[#5BC0BE]" />
        </div>
        <h3 className="text-base font-semibold text-[#F4F6F8] tracking-tight">
          What Changed?
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0B132B] text-slate-300 border border-[#3A506B]/50">
          Plain-English Scientific Summary
        </span>
      </div>

      {/* Content for Barpeta Two-Date Comparison */}
      {isBarpeta && (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-[#24314D] border border-[#3A506B]/50 text-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#E11D48] text-sm">
              <TrendingUp className="w-4 h-4 text-[#E11D48]" />
              <span>Observed +140.77% Increase in Classified Water Area (+2.337 km²)</span>
            </div>
            <p>
              Between <strong className="text-[#F4F6F8]">27 June 2026</strong> and <strong className="text-[#F4F6F8]">09 July 2026</strong> (a 12-day interval between available observations), the classified surface water area inside the evaluated 9.152 km² Barpeta river corridor increased from <strong className="text-[#06B6D4]">1.660 km²</strong> (166.0 hectares) to <strong className="text-[#E11D48]">3.997 km²</strong> (399.7 hectares).
            </p>
            <p>
              This represents an expansion of approximately <strong className="text-[#E11D48]">+2.337 km² (233.7 hectares)</strong> of newly inundated ground, predominantly low-lying agricultural sandbars (<em>chars</em>) submerged during the 09 July 2026 event observation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-[#0B132B]/60 border border-[#3A506B]/50">
              <span className="font-semibold text-[#F4F6F8] block mb-0.5">Permanent River Channel: 1.660 km²</span>
              <span className="text-slate-400 text-[11px]">
                The main braided stream of the Brahmaputra remained continuously filled with water on both observation dates.
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B132B]/60 border border-[#3A506B]/50">
              <span className="font-semibold text-[#F4F6F8] block mb-0.5">Receded Water: 0.000 km²</span>
              <span className="text-slate-400 text-[11px]">
                No previously wet areas dried out during this period, confirming an active increase in classified water area rather than river recession.
              </span>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-2.5 rounded-lg bg-[#0B132B]/70 border border-[#3A506B]/50 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#5BC0BE] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F4F6F8]">Scientific Distinction:</strong> This is an observational remote-sensing water-classification comparison based on single-polarization HHHH radar backscatter (&Delta;&gamma;⁰ &lt; -4.50 dB). It represents satellite-detected surface water extent within the 9.152 km² Barpeta reach corridor, not independently verified structural flood damage or ground-truth surveys. It does not apply to Majuli Island or the entire Brahmaputra basin.
            </div>
          </div>
        </div>
      )}

      {/* Content for Majuli Single-Date Classification */}
      {isMajuli && (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-[#24314D] border border-[#3A506B]/50 text-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#5BC0BE] text-sm">
              <Waves className="w-4 h-4 text-[#5BC0BE]" />
              <span>Single-Date Delineation: 797.55 km² Water Extent (13,821 Polygons)</span>
            </div>
            <p>
              On <strong className="text-[#F4F6F8]">27 August 2026</strong>, NISAR Level-2 radar imaged the Majuli Island reach (Track 015 / Frame 3700). Applying adaptive Otsu thresholding (-15.0 dB cutoff) to single-polarization HHHH backscatter identified <strong className="text-[#06B6D4]">797.55 km² (79,755 hectares)</strong> of surface water across the evaluated 8,955.16 km² swath window (~8.91% swath coverage).
            </p>
            <p>
              The classification successfully mapped <strong className="text-[#F4F6F8]">13,821 extracted water polygons</strong>, tracing the intricate braided channels of the Brahmaputra, northern Subansiri confluence, and internal island wetlands through monsoon cloud cover.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-[#0B132B]/60 border border-[#3A506B]/50">
              <span className="font-semibold text-[#F4F6F8] block mb-0.5">Why Single-Date?</span>
              <span className="text-slate-400 text-[11px]">
                This study demonstrates high-resolution water boundary delineation. Because only one observation pass has been processed for Track 015, no multi-date comparison is claimed.
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B132B]/60 border border-[#3A506B]/50">
              <span className="font-semibold text-[#F4F6F8] block mb-0.5">Specular Reflection Physics</span>
              <span className="text-slate-400 text-[11px]">
                Calm water reflects radar pulses away from the satellite, producing a dark mean return of -18.63 dB contrasting sharply with rough dry land at -8.91 dB.
              </span>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-2.5 rounded-lg bg-[#0B132B]/70 border border-[#3A506B]/50 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#5BC0BE] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F4F6F8]">Scientific Distinction:</strong> Majuli is an authentic single-date water extent map. It is <strong>NOT</strong> a flood-expansion result and must never be conflated with the +140.77% Barpeta expansion metric.
            </div>
          </div>
        </div>
      )}

      {/* Content for Unsupported / Custom Area */}
      {!isMajuli && !isBarpeta && (
        <div className="space-y-2 text-xs text-[#F4F6F8]">
          <div className="p-3.5 rounded-lg bg-[#24314D] border border-amber-500/40 text-amber-200 space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>No Processed Satellite Results for this Area</span>
            </div>
            <p className="text-slate-300">
              There are currently no processed NISAR Level-2 satellite observations for this area. To inspect authentic satellite water classifications, please select <strong>Majuli River Island</strong> or <strong>Barpeta & Lower Floodplain</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
