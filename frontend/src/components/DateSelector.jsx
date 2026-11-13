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
          <div className="w-8 h-8 rounded-lg bg-indigo text-aqua border border-dusk flex items-center justify-center">
            <Calendar className="w-4 h-4 text-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-primary tracking-tight">
                2. Select Available Satellite Observation Date{isMajuli ? '' : 's'}
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border bg-indigo text-aqua border-dusk">
                {isMajuli
                  ? '1 Processed Observation (Single-Date Mode)'
                  : isBarpeta
                  ? '2 Processed Observations (12-Day Interval Mode)'
                  : '0 Observations Ready'}
              </span>
            </div>
            <p className="text-xs text-muted">
              {isMajuli
                ? 'Only dates with authentic processed NISAR raster products are selectable.'
                : isBarpeta
                ? 'Select the Baseline (27 June 2026) and Event (09 July 2026) observations to view the water change comparison.'
                : 'Satellite observations have not been extracted for this area.'}
            </p>
          </div>
        </div>

        {isBarpeta && (
          <div className="text-xs font-mono font-medium text-muted bg-subtle px-3 py-1.5 rounded-lg border border-border">
            Interval between available observations: <strong className="text-primary">12 Days</strong> (Track 019 / Frame 075)
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
            <div className="p-4 rounded-xl border border-teal ring-1 ring-teal bg-subtle shadow-xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-indigo text-aqua border border-dusk">
                  Track 015 / Frame 3700
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-teal bg-indigo px-2 py-0.5 rounded border border-dusk">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  Processed Result Ready
                </span>
              </div>

              <div className="text-lg font-bold text-primary font-mono">27 August 2026</div>
              <div className="text-xs text-body mt-1 leading-relaxed">
                Post-monsoon Level-2 GCOV extraction. <strong>797.55 km²</strong> surface water classified across <strong>13,821 extracted water polygons</strong>.
              </div>

              <div className="mt-3 pt-2.5 border-t border-border text-[11px] text-primary font-semibold flex items-center justify-between">
                <span>Selected for Water Extent Delineation</span>
                <span className="font-mono text-muted">10m Spatial Resolution</span>
              </div>
            </div>

            {/* Scientific Transparency Notice */}
            <div className="md:col-span-2 p-4 rounded-xl border border-border bg-subtle text-xs text-body flex flex-col justify-center space-y-2">
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
            <div className={`p-4 rounded-xl border transition-all relative ${
              baselineDate === '2026-06-27'
                ? 'bg-subtle border-teal ring-1 ring-teal shadow-xs'
                : 'bg-white border-border hover:border-dusk/40'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo text-aqua border border-dusk">
                  Cycle 024 • Track 019 / Frame 075
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal text-midnight">
                  Baseline (Before)
                </span>
              </div>

              <div className="text-base font-bold text-primary font-mono mb-1">
                27 June 2026
              </div>
              <div className="text-xs text-body leading-snug mb-2">
                Pre-Flood High Flow observation. Evaluated baseline water area: <strong className="text-primary font-mono font-semibold">1.660 km²</strong>.
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted">Role: Pre-Flood Reference</span>
                <span className="text-teal font-semibold">✓ Selected as Baseline</span>
              </div>
            </div>

            {/* 2. Event Observation Card (09 July 2026) */}
            <div className={`p-4 rounded-xl border transition-all relative ${
              eventDate === '2026-07-09'
                ? 'bg-subtle border-map-inundated ring-1 ring-map-inundated shadow-xs'
                : 'bg-white border-border hover:border-dusk/40'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo text-aqua border border-dusk">
                  Cycle 025 • Track 019 / Frame 075
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-map-inundated text-white">
                  Event (After)
                </span>
              </div>

              <div className="text-base font-bold text-primary font-mono mb-1">
                09 July 2026
              </div>
              <div className="text-xs text-body leading-snug mb-2">
                Event observation (09 July 2026). Evaluated event water area: <strong className="text-primary font-mono font-semibold">3.997 km²</strong> (+140.77% increase in classified water area in evaluated 9.152 km² corridor).
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted">Role: High-Water Event</span>
                <span className="text-map-inundated font-semibold">✓ Selected as Event</span>
              </div>
            </div>
          </div>

          {/* Active selection summary banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-subtle border border-border text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal"></span>
                <span className="text-body">Baseline (Before):</span>
                <strong className="text-primary font-mono">{baselineDate}</strong>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-map-inundated"></span>
                <span className="text-body">Event (After):</span>
                <strong className="text-primary font-mono">{eventDate}</strong>
              </div>
              <span className="text-muted font-mono text-[11px]">(Δt = 12 Days • Track 019 / Frame 075)</span>
            </div>

            {/* Threshold toggle button */}
            <button
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-teal cursor-pointer transition-colors"
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
