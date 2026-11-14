import React, { useState } from 'react';

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

  // 8-Cycle Multi-Date Barpeta Observation Sequence
  const barpetaCycles = [
    { cycle: '022', date: '2026-06-03', label: '03 Jun', stage: 'Pre-Monsoon Base', area: '0.862 km²', pct: '9.4%' },
    { cycle: '023', date: '2026-06-15', label: '15 Jun', stage: 'Monsoon Onset', area: '0.887 km²', pct: '9.7%' },
    { cycle: '024', date: '2026-06-27', label: '27 Jun', stage: 'Pre-Flood Baseline', area: '1.660 km²', pct: '18.1%' },
    { cycle: '025', date: '2026-07-09', label: '09 Jul', stage: 'Peak Inundation', area: '3.997 km²', pct: '43.7%' },
    { cycle: '026', date: '2026-07-21', label: '21 Jul', stage: 'Early Recession', area: '2.454 km²', pct: '26.8%' },
    { cycle: '027', date: '2026-08-02', label: '02 Aug', stage: 'Drainage Phase', area: '2.158 km²', pct: '23.6%' },
    { cycle: '028', date: '2026-08-14', label: '14 Aug', stage: 'Secondary Surge', area: '2.766 km²', pct: '30.2%' },
    { cycle: '029', date: '2026-08-26', label: '26 Aug', stage: 'Late August Drydown', area: '1.848 km²', pct: '20.2%' },
  ];

  // Majuli 12-Day Track 015 Repeat Timeline
  const majuliCycles = [
    { cycle: '025', date: '2026-07-10', stage: 'Orbit Cycle 025', status: 'Cataloged' },
    { cycle: '026', date: '2026-07-22', stage: 'Orbit Cycle 026', status: 'Cataloged' },
    { cycle: '027', date: '2026-08-03', stage: 'Orbit Cycle 027', status: 'Cataloged' },
    { cycle: '028', date: '2026-08-15', stage: 'Orbit Cycle 028', status: 'Cataloged' },
    { cycle: '029', date: '2026-08-27', stage: 'Primary Reference', status: 'Processed Ready', area: '797.55 km²' },
    { cycle: '030', date: '2026-09-08', stage: 'Orbit Cycle 030', status: 'Cataloged' },
    { cycle: '031', date: '2026-09-20', stage: 'Orbit Cycle 031', status: 'Cataloged' },
  ];

  return (
    <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/40 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#c6e9f1] tracking-tight">
              Satellite Observation Dates & Timeline
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-md border bg-[#222950] text-[#87b8e8] border-[#3b4a8c]">
              {isMajuli
                ? 'Track 015 / Frame 3700'
                : isBarpeta
                ? '8 Verified Observation Cycles (Track 019 / Frame 075)'
                : 'Area Selection Required'}
            </span>
          </div>
          <p className="text-xs text-[#87b8e8]">
            {isMajuli
              ? 'Multi-cycle 12-day exact repeat timeline with primary high-resolution water extraction.'
              : isBarpeta
              ? 'Continuous 12-day multi-date observation sequence spanning the 2026 monsoon season.'
              : 'Select a study reach to view observation dates.'}
          </p>
        </div>

        {isBarpeta && (
          <div className="text-xs font-mono font-medium text-[#c6e9f1] bg-[#222950] px-3 py-1.5 rounded-lg border border-[#587ebb]/40">
            Repeat Interval: <strong className="text-white">12 Days</strong>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STATE A: MAJULI (Single-Date Processed Observation + Orbit Sequence)     */}
      {/* ========================================================================= */}
      {isMajuli && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* The primary processed observation for Majuli */}
            <div className="p-4 rounded-xl border border-[#87b8e8] ring-1 ring-[#87b8e8]/50 bg-[#222950] shadow-md relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-[#1a1f3d] text-[#87b8e8] border border-[#3b4a8c]">
                  Cycle 029 • Track 015
                </span>
                <span className="text-[11px] font-semibold text-[#c6e9f1] bg-[#3b4a8c] px-2 py-0.5 rounded border border-[#587ebb]">
                  Verified Result
                </span>
              </div>

              <div className="text-lg font-bold text-white font-mono">27 August 2026</div>
              <div className="text-xs text-[#c6e9f1] mt-1 leading-relaxed">
                Level-2 GCOV extraction: <strong className="text-white">797.55 km²</strong> classified surface water across <strong className="text-white">13,821 polygons</strong> in the 8,955.16 km² swath.
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#3b4a8c]/50 text-[11px] text-[#87b8e8] flex items-center justify-between">
                <span>Selected Observation</span>
                <span className="font-mono text-slate-300">10m Resolution</span>
              </div>
            </div>

            {/* 12-Day Orbital Repeat Catalog for Track 015 */}
            <div className="md:col-span-2 p-4 rounded-xl border border-[#587ebb]/40 bg-[#222950]/80 text-xs text-[#c6e9f1] space-y-2.5">
              <div className="font-semibold text-white">
                Track 015 / Frame 3700 Orbital Repeat Sequence (Ascending Pass)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {majuliCycles.map((c) => {
                  const isCurrent = c.date === '2026-08-27';
                  return (
                    <div
                      key={c.cycle}
                      className={`p-2 rounded-lg border text-[11px] font-mono ${
                        isCurrent
                          ? 'bg-[#3b4a8c] border-[#87b8e8] text-white shadow-sm'
                          : 'bg-[#1a1f3d] border-[#3b4a8c]/50 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-[#87b8e8]">Cycle {c.cycle}</div>
                      <div className="font-bold text-white">{c.date}</div>
                      <div className="text-[10px] mt-0.5 text-slate-300">{c.stage}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE B: BARPETA (8-Date Multi-Temporal Sequence)                         */}
      {/* ========================================================================= */}
      {isBarpeta && (
        <div className="space-y-4">
          {/* 8-Cycle Multi-Date Barpeta Timeline Selector */}
          <div>
            <div className="text-xs font-semibold text-[#87b8e8] uppercase tracking-wider mb-2">
              Multi-Date Observation Sequence (Track 019 / Frame 075 • 12-Day Interval)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {barpetaCycles.map((c) => {
                const isBaseline = baselineDate === c.date;
                const isEvent = eventDate === c.date;
                return (
                  <div
                    key={c.cycle}
                    onClick={() => {
                      if (!isBaseline && !isEvent) {
                        onSelectEvent(c.date);
                      }
                    }}
                    className={`p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                      isBaseline
                        ? 'bg-[#3b4a8c] border-[#87b8e8] ring-1 ring-[#87b8e8] shadow-md text-white'
                        : isEvent
                        ? 'bg-[#881337] border-[#f43f5e] ring-1 ring-[#f43f5e] shadow-md text-white'
                        : 'bg-[#222950] border-[#3b4a8c]/60 hover:border-[#87b8e8]/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#87b8e8]">
                      <span>C{c.cycle}</span>
                      {isBaseline && <span className="text-[#87b8e8] font-bold">Base</span>}
                      {isEvent && <span className="text-[#f43f5e] font-bold">Event</span>}
                    </div>
                    <div className="font-bold text-white font-mono mt-0.5">{c.label}</div>
                    <div className="text-[10px] text-slate-300 truncate mt-0.5">{c.stage}</div>
                    <div className="text-[10px] font-mono font-semibold text-[#87b8e8] mt-1">
                      {c.area} ({c.pct})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Pair Cards (27 Jun vs 09 Jul) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Baseline Observation Card */}
            <div className="p-3.5 rounded-xl border border-[#87b8e8] bg-[#222950] shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1a1f3d] text-[#87b8e8] border border-[#3b4a8c]">
                  Cycle 024 • Baseline
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#3b4a8c] text-white">
                  Reference Date
                </span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {baselineDate}
              </div>
              <div className="text-xs text-[#c6e9f1] mt-0.5 leading-snug">
                Bankfull discharge baseline. Classified water extent: <strong className="text-white font-mono">1.660 km²</strong> (18.14% of corridor).
              </div>
            </div>

            {/* 2. Event Observation Card */}
            <div className="p-3.5 rounded-xl border border-[#f43f5e] bg-[#222950] shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1a1f3d] text-[#f43f5e] border border-[#881337]">
                  Cycle 025 • Event
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#e11d48] text-white">
                  Event Observation
                </span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {eventDate}
              </div>
              <div className="text-xs text-[#c6e9f1] mt-0.5 leading-snug">
                Peak inundation surge: <strong className="text-white font-mono">3.997 km²</strong> (+140.77% water increase; +2.337 km² newly flooded).
              </div>
            </div>
          </div>

          {/* Active selection summary banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#222950] border border-[#587ebb]/40 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#87b8e8]"></span>
                <span className="text-[#87b8e8]">Baseline:</span>
                <strong className="text-white font-mono">{baselineDate}</strong>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
                <span className="text-[#87b8e8]">Event:</span>
                <strong className="text-white font-mono">{eventDate}</strong>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">(Δt = 12 Days • Track 019 / Frame 075)</span>
            </div>

            {/* Threshold toggle button */}
            <button
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="text-xs text-[#87b8e8] hover:text-white font-medium cursor-pointer transition-colors"
            >
              <span>{showAdvancedTuning ? 'Hide Radar Settings' : 'Tune Radar Threshold'}</span>
            </button>
          </div>

          {/* Optional Collapsible Threshold Tuning */}
          {showAdvancedTuning && (
            <div className="p-3.5 rounded-xl bg-[#141830] border border-[#587ebb]/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white">Log-Ratio Change Threshold:</span>
                  <span className="font-mono font-bold text-[#87b8e8]">{thresholdDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-10.0"
                  max="-2.0"
                  step="0.5"
                  value={thresholdDb}
                  onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#222950] rounded-lg appearance-none cursor-pointer accent-[#87b8e8]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-10.0 dB (Conservative)</span>
                  <span className="text-[#87b8e8] font-semibold">-4.5 dB (Verified)</span>
                  <span>-2.0 dB (Sensitive)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Lee Speckle Noise Filter</div>
                  <div className="text-[11px] text-slate-400">3×3 adaptive variance window to reduce radar grain</div>
                </div>
                <button
                  onClick={() => onToggleSpeckleFilter(!speckleFilter)}
                  className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    speckleFilter
                      ? 'bg-[#87b8e8] text-[#1a1f3d]'
                      : 'bg-[#222950] text-slate-300 border border-[#3b4a8c] hover:bg-[#3b4a8c]'
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
        <div className="p-4 rounded-xl border border-amber-500/40 bg-[#222950] text-xs text-amber-200 space-y-2">
          <div className="font-bold text-amber-300">
            No Processed Satellite Observations Available for this Area
          </div>
          <p className="leading-relaxed text-slate-300">
            There are currently no processed NISAR Level-2 satellite observations for this area.
            To explore verified satellite radar data, please select either <strong>Majuli River Island</strong> or <strong>Barpeta & Lower Floodplain</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
