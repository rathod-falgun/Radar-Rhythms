import React, { useState } from 'react';
import { Calendar, CheckCircle2, Info, ArrowRight, Sliders, AlertTriangle } from 'lucide-react';

export default function DateSelector({
  observations = [],
  baselineDate,
  eventDate,
  thresholdDb,
  speckleFilter,
  onSelectBaseline,
  onSelectEvent,
  onThresholdChange,
  onToggleSpeckleFilter,
  selectedRegionId
}) {
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);

  const isMajuli = selectedRegionId === 'majuli';
  const isBarpeta = selectedRegionId === 'barpeta';

  // Filter only observations that have actually completed processing and have usable results
  const processedObservations = observations.filter(
    (obs) => obs.is_processed || obs.status === 'PROCESSED_AVAILABLE'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1c2541] text-[#6fffe9] border border-[#3a506b] flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#5bc0be]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                2. Select Available Satellite Observation Date{isMajuli ? '' : 's'}
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isMajuli
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : isBarpeta
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {isMajuli
                  ? '1 Processed Observation (Single-Date Mode)'
                  : isBarpeta
                  ? '2 Processed Observations (12-Day Interval Mode)'
                  : '0 Observations Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isMajuli
                ? 'Only dates with authentic processed NISAR raster products are selectable.'
                : isBarpeta
                ? 'Select the Baseline (27 June 2026) and Event (09 July 2026) observations to view the water change comparison.'
                : 'Satellite observations have not been extracted for this area.'}
            </p>
          </div>
        </div>

        {isBarpeta && (
          <div className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Interval between available observations: <strong>12 Days</strong> (Track 019 / Frame 075)
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STATE A: MAJULI (Single-Date Processed Observation)                       */}
      {/* ========================================================================= */}
      {isMajuli && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* The single processed observation for Majuli */}
            <div className="p-4 rounded-xl border-2 border-sky-500 bg-sky-50/70 shadow-xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                  Track 015 / Frame 3700
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Processed Result Ready
                </span>
              </div>

              <div className="text-lg font-bold text-slate-900 font-mono">27 August 2026</div>
              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                Post-monsoon Level-2 GCOV extraction. <strong>797.55 km²</strong> surface water classified across <strong>13,821 vector polygons</strong>.
              </div>

              <div className="mt-3 pt-2.5 border-t border-sky-200 text-[11px] text-sky-900 font-semibold flex items-center justify-between">
                <span>Selected for Water Extent Delineation</span>
                <span className="font-mono text-slate-500">10m Spatial Resolution</span>
              </div>
            </div>

            {/* Scientific Transparency Notice */}
            <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Single-Observation Scientific Scope:</span>
              </div>
              <p className="leading-relaxed">
                Currently, <strong>27 August 2026</strong> is the only NISAR Level-2 observation processed and verified for Track 015.
              </p>
              <p className="text-slate-500 leading-relaxed">
                No second observation pass is currently processed for Track 015, so a multi-temporal before/after flood change comparison is not offered for Majuli.
                If you wish to test a multi-temporal comparison, select <strong>Barpeta</strong> in Step 1.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE B: BARPETA (Two-Date Comparison: 27 June vs 09 July 2026)          */}
      {/* ========================================================================= */}
      {isBarpeta && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Baseline Observation Card (27 June 2026) */}
            <div className={`p-4 rounded-xl border-2 transition-all relative ${
              baselineDate === '2026-06-27'
                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  Cycle 024 • Track 019 / Frame 075
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Baseline (Before)
                </span>
              </div>

              <div className="text-base font-bold text-slate-900 font-mono mb-1">
                27 June 2026
              </div>
              <div className="text-xs text-slate-600 leading-snug mb-2">
                Pre-Flood High Flow observation. Evaluated baseline water area: <strong>1.660 km²</strong>.
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Role: Pre-Flood Reference</span>
                <span className="text-emerald-700 font-semibold">✓ Selected as Baseline</span>
              </div>
            </div>

            {/* 2. Event Observation Card (09 July 2026) */}
            <div className={`p-4 rounded-xl border-2 transition-all relative ${
              eventDate === '2026-07-09'
                ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900">
                  Cycle 025 • Track 019 / Frame 075
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Event (After)
                </span>
              </div>

              <div className="text-base font-bold text-slate-900 font-mono mb-1">
                09 July 2026
              </div>
              <div className="text-xs text-slate-600 leading-snug mb-2">
                Event observation (09 July 2026). Evaluated event water area: <strong>3.997 km²</strong> (+140.77% increase in classified water area in evaluated 9.152 km² corridor).
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Role: High-Water Event</span>
                <span className="text-rose-700 font-semibold">✓ Selected as Event</span>
              </div>
            </div>
          </div>

          {/* Active selection summary banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Baseline (Before):</span>
                <strong className="text-slate-900 font-mono">{baselineDate}</strong>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">Event (After):</span>
                <strong className="text-slate-900 font-mono">{eventDate}</strong>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">(Δt = 12 Days • Track 019 / Frame 075)</span>
            </div>

            {/* Threshold toggle button */}
            <button
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="flex items-center gap-1.5 text-xs text-sky-700 font-medium hover:text-sky-800 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedTuning ? 'Hide Radar Settings' : 'Tune Radar Threshold'}</span>
            </button>
          </div>

          {/* Optional Collapsible Threshold Tuning */}
          {showAdvancedTuning && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">Log-Ratio Change Threshold:</span>
                  <span className="font-mono font-bold text-sky-700">{thresholdDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-10.0"
                  max="-2.0"
                  step="0.5"
                  value={thresholdDb}
                  onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-10.0 dB (Conservative)</span>
                  <span className="text-sky-700 font-semibold">-4.5 dB (Verified)</span>
                  <span>-2.0 dB (Sensitive)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Lee Speckle Noise Filter</div>
                  <div className="text-[11px] text-slate-500">3×3 adaptive variance window to reduce radar grain</div>
                </div>
                <button
                  onClick={() => onToggleSpeckleFilter(!speckleFilter)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    speckleFilter
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {speckleFilter ? 'Filter: ON' : 'Filter: OFF'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE C: UNSUPPORTED / UNPROCESSED REGION                                 */}
      {/* ========================================================================= */}
      {!isMajuli && !isBarpeta && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No Processed Satellite Observations Available for this Area</span>
          </div>
          <p className="leading-relaxed">
            There are currently no processed NISAR Level-2 satellite observations for this area.
            To explore verified satellite radar data, please select either <strong>Majuli River Island</strong> or <strong>Barpeta & Lower Floodplain</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
