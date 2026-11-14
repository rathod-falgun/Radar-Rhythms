import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Waves, AlertTriangle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export default function WhatChangedCard({ selectedRegionId, comparisonData, baselineDate, eventDate }) {
  const isMajuli = selectedRegionId === 'majuli';
  const isBarpeta = selectedRegionId === 'barpeta';

  const stats = comparisonData?.statistics || {};
  const pctChange = stats.percentage_change ?? 140.77;
  const newKm2 = stats.newly_inundated_km2 ?? 2.337;
  const persKm2 = stats.permanent_water_km2 ?? 1.660;
  const recKm2 = stats.receded_water_km2 ?? 0.0;
  const totalWaterKm2 = stats.total_water_affected_km2 ?? 3.997;
  const isSingleDate = baselineDate === eventDate;

  return (
    <div className="card-outer rounded p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-outer)]">
        <div className="w-8 h-8 rounded box-inner text-[#fca311] flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h3 className="text-base font-editorial font-semibold text-white tracking-wide">
          What Changed?
        </h3>
        <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded box-inner text-[#fca311] font-semibold">
          Plain-English Scientific Summary
        </span>
      </div>

      {/* Content for Barpeta Multi-Date Comparison */}
      {isBarpeta && (
        <div className="space-y-3.5 text-xs text-[#e5e5e5]/80 leading-relaxed font-sans">
          <div className="p-4 rounded box-inner space-y-2">
            <div className="flex items-center gap-2 font-editorial font-semibold text-base">
              {isSingleDate ? (
                <div className="flex items-center gap-2 text-white">
                  <Waves className="w-4 h-4 text-[#fca311]" />
                  <span>Single-Date Observation: {totalWaterKm2.toFixed(3)} km² Water Extent on {eventDate}</span>
                </div>
              ) : pctChange >= 0 ? (
                <div className="flex items-center gap-2 text-[#fca311]">
                  <TrendingUp className="w-4 h-4 text-[#fca311]" />
                  <span>Observed +{pctChange.toFixed(2)}% Increase in Classified Water Area (+{newKm2.toFixed(3)} km²)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <TrendingDown className="w-4 h-4 text-[#fca311]" />
                  <span>Observed {pctChange.toFixed(2)}% Water Recession ({recKm2.toFixed(3)} km² drained)</span>
                </div>
              )}
            </div>

            {isSingleDate ? (
              <p className="text-[#e5e5e5]/80">
                On <strong className="text-white">{eventDate}</strong>, NISAR Level-2 radar measured <strong className="text-[#fca311] font-mono">{totalWaterKm2.toFixed(3)} km²</strong> of classified surface water ({stats.inundation_percent_of_region || '18.1'}% of the 9.152 km² corridor).
              </p>
            ) : (
              <p className="text-[#e5e5e5]/80">
                Between <strong className="text-white">{baselineDate}</strong> and <strong className="text-white">{eventDate}</strong>, classified surface water area inside the evaluated 9.152 km² Barpeta corridor shifted from <strong className="text-white font-mono">{(persKm2 + recKm2).toFixed(3)} km²</strong> to <strong className="text-[#fca311] font-mono font-bold">{totalWaterKm2.toFixed(3)} km²</strong> ({pctChange >= 0 ? `+${pctChange.toFixed(2)}%` : `${pctChange.toFixed(2)}%`}).
              </p>
            )}

            {!isSingleDate && newKm2 > 0 && (
              <p className="text-[#e5e5e5]/80">
                This represents <strong className="text-[#fca311] font-mono font-bold">+{newKm2.toFixed(3)} km² ({(newKm2 * 100).toFixed(1)} hectares)</strong> of newly inundated ground, predominantly low-lying agricultural sandbars (<em>chars</em>) submerged during high discharge.
              </p>
            )}

            {!isSingleDate && recKm2 > 0 && (
              <p className="text-[#e5e5e5]/80">
                A total of <strong className="text-white font-mono">{recKm2.toFixed(3)} km² ({(recKm2 * 100).toFixed(1)} hectares)</strong> drained back into main channels or dried down during this interval.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded box-inner border border-[var(--border-outer)]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0077b6] border border-white shrink-0"></span>
                <span className="font-editorial font-semibold text-white">Stage 1: Pre-Flood Channel ({persKm2.toFixed(3)} km²)</span>
              </div>
              <span className="text-[#e5e5e5]/70 text-xs leading-relaxed block">
                The main braided stream of the Brahmaputra (<strong className="text-white">Deep Blue</strong>). Remained continuously submerged across both satellite passes.
              </span>
            </div>
            <div className="p-3.5 rounded box-inner border border-[#38bdf8]/30 bg-[#38bdf8]/5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-white shrink-0"></span>
                <span className="font-editorial font-semibold text-[#38bdf8]">
                  {isSingleDate ? 'Stable Land' : recKm2 > 0 ? `Receded Water: ${recKm2.toFixed(3)} km²` : `Stage 2: New Inundation (+${newKm2.toFixed(3)} km²)`}
                </span>
              </div>
              <span className="text-[#e5e5e5]/70 text-xs leading-relaxed block">
                {isSingleDate
                  ? 'Terrain above bankfull discharge stage showing stable terrestrial backscatter.'
                  : recKm2 > 0
                  ? 'Floodwaters draining back into the braided main channel and depression pools.'
                  : 'Low-lying riparian farmland & sandbars (<strong class="text-[#38bdf8]">Light Blue</strong>) submerged as monsoon discharge breached natural riverbanks (+140.77% surge).'}
              </span>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 rounded box-inner text-xs text-[#e5e5e5]/70 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#fca311] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Scientific Distinction:</strong> Observational remote-sensing water-classification comparison based on single-polarization HHHH radar backscatter (&Delta;&gamma;⁰ &lt; -4.50 dB). Evaluated strictly for the 9.152 km² Barpeta reach corridor (Track 019 / Frame 075). It does not apply to Majuli Island or the entire Brahmaputra basin.
            </div>
          </div>
        </div>
      )}

      {/* Content for Majuli Observation */}
      {isMajuli && (
        <div className="space-y-3.5 text-xs text-[#e5e5e5]/80 leading-relaxed font-sans">
          <div className="p-4 rounded box-inner space-y-2">
            <div className="flex items-center gap-2 font-editorial font-semibold text-base text-white">
              <Waves className="w-4 h-4 text-[#fca311]" />
              <span>
                {eventDate === '2026-08-27'
                  ? 'Primary Verified Extraction: 797.55 km² Water Extent (13,821 Polygons)'
                  : `Orbital Repeat Pass (${eventDate}) • Track 015 / Frame 3700`}
              </span>
            </div>
            <p className="text-[#e5e5e5]/80">
              On <strong className="text-white">{eventDate}</strong>, NISAR Level-2 radar imaged the Majuli Island reach (Track 015 / Frame 3700). {eventDate === '2026-08-27' ? (
                <>Applying adaptive Otsu thresholding (-15.0 dB cutoff) to single-polarization HHHH backscatter identified <strong className="text-[#fca311] font-mono font-bold">797.55 km² (79,755 hectares)</strong> of surface water across the evaluated 8,955.16 km² swath window (~8.91% swath coverage).</>
              ) : (
                <>Part of the 12-day orbital repeat series capturing seasonal flood and braided channel morphology over Majuli River Island.</>
              )}
            </p>
            {eventDate === '2026-08-27' && (
              <p className="text-[#e5e5e5]/80">
                The extraction delineated <strong className="text-white font-mono font-bold">13,821 water polygons</strong>, tracing the intricate braided channels of the Brahmaputra, northern Subansiri confluence, and internal island wetlands through monsoon cloud cover.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded box-inner">
              <span className="font-editorial font-semibold text-white block mb-1">High-Resolution Single-Date Delineation</span>
              <span className="text-[#e5e5e5]/70 text-xs">
                Focuses on authentic high-resolution water boundary delineation. Verified Level-2 direct extraction on 27 Aug 2026.
              </span>
            </div>
            <div className="p-3.5 rounded box-inner">
              <span className="font-editorial font-semibold text-white block mb-1">Specular Reflection Physics</span>
              <span className="text-[#e5e5e5]/70 text-xs">
                Calm water reflects radar pulses away from the satellite, producing a dark mean return (-18.64 dB) contrasting sharply with rough dry land (-8.91 dB).
              </span>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 rounded box-inner text-xs text-[#e5e5e5]/70 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#fca311] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Scientific Distinction:</strong> Majuli is an authentic high-resolution water extent map from Track 015 / Frame 3700. It is <strong>NOT</strong> a flood-expansion result and must not be conflated with the +140.77% Barpeta expansion metric.
            </div>
          </div>
        </div>
      )}

      {/* Content for Unsupported / Custom Area */}
      {!isMajuli && !isBarpeta && (
        <div className="space-y-2 text-xs text-[#e5e5e5]/80">
          <div className="p-4 rounded box-inner text-[#e5e5e5]/70 space-y-1">
            <div className="font-editorial font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#fca311] shrink-0" />
              <span>No Processed Satellite Results for this Area</span>
            </div>
            <p className="text-xs text-[#e5e5e5]/70">
              There are currently no processed NISAR Level-2 satellite observations for this area. To inspect authentic satellite water classifications, please select <strong>Majuli River Island</strong> or <strong>Barpeta & Lower Floodplain</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
