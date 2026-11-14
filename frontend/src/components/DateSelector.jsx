import React, { useState } from 'react';

/**
 * DateSelector — "Night-pass radar" timeline
 * - The timeline becomes a thin horizontal line with dots
 * - The active cycle is a filled orange dot; other cycles are alabaster dots
 * - Clear editorial cards for Baseline (T1) and Event (T2)
 */
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
  const [activeSlot, setActiveSlot] = useState('event'); // 'baseline' or 'event'

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
    { cycle: '025', date: '2026-07-10', stage: 'Early Monsoon Pass', status: 'Cataloged' },
    { cycle: '026', date: '2026-07-22', stage: 'Mid-Monsoon Surge', status: 'Cataloged' },
    { cycle: '027', date: '2026-08-03', stage: 'High Discharge Pass', status: 'Cataloged' },
    { cycle: '028', date: '2026-08-15', stage: 'Crest Phase', status: 'Cataloged' },
    { cycle: '029', date: '2026-08-27', stage: 'Primary Reference', status: 'Processed Ready', area: '797.55 km²' },
    { cycle: '030', date: '2026-09-08', stage: 'Drainage Phase', status: 'Cataloged' },
    { cycle: '031', date: '2026-09-20', stage: 'Late Monsoon Pass', status: 'Cataloged' },
  ];

  // Quick Comparison Presets for Barpeta
  const barpetaPresets = [
    { label: 'Peak Surge (27 Jun ➔ 09 Jul)', base: '2026-06-27', evt: '2026-07-09', badge: '+140.77%' },
    { label: 'Monsoon Onset (03 Jun ➔ 15 Jun)', base: '2026-06-03', evt: '2026-06-15', badge: '+41.89%' },
    { label: 'Early Recession (09 Jul ➔ 21 Jul)', base: '2026-07-09', evt: '2026-07-21', badge: '-31.83%' },
    { label: 'Secondary Surge (02 Aug ➔ 14 Aug)', base: '2026-08-02', evt: '2026-08-14', badge: '+17.61%' },
  ];

  const currentBaseCycle = barpetaCycles.find(c => c.date === baselineDate) || barpetaCycles[2];
  const currentEventCycle = barpetaCycles.find(c => c.date === eventDate) || barpetaCycles[3];
  const selectedMajuli = majuliCycles.find(c => c.date === eventDate) || majuliCycles[4];

  return (
    <div className="space-y-6 pt-2">
      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5e5e5]/10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#fca311] uppercase block mb-1">
            Step 02 • Temporal Sequence
          </span>
          <h2 className="text-xl sm:text-2xl font-editorial font-normal text-white tracking-tight">
            Satellite Observation Dates & Timeline
          </h2>
          <p className="text-xs text-[#e5e5e5]/60 font-light mt-0.5">
            {isMajuli
              ? 'Select any 12-day orbital pass across the Track 015 repeat sequence.'
              : isBarpeta
              ? 'Multi-date 12-day orbital cycle progression across the 2026 monsoon.'
              : 'Select a study reach to view observation dates.'}
          </p>
        </div>

        {isBarpeta && (
          <div className="text-xs font-mono text-[#e5e5e5]/70 box-inner px-3 py-1.5 rounded uppercase tracking-wider">
            Orbit Repeat: <strong className="text-[#fca311]">12 Days</strong>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAJULI TIMELINE: THIN LINE WITH DOTS                                      */}
      {/* ========================================================================= */}
      {isMajuli && (
        <div className="space-y-6">
          {/* Active Observation Card */}
          <div className="p-6 rounded card-outer-active flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono tracking-widest uppercase text-[#fca311]">
                  Orbit Cycle {selectedMajuli.cycle}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-[#e5e5e5]/20 text-[#e5e5e5]/80">
                  {selectedMajuli.date === '2026-08-27' ? 'Primary Verified Extraction' : 'Cataloged Orbit Pass'}
                </span>
              </div>
              <div className="text-2xl font-editorial font-normal text-white">
                {selectedMajuli.date}
              </div>
              <p className="text-xs text-[#e5e5e5]/70 font-light max-w-2xl leading-relaxed">
                {selectedMajuli.date === '2026-08-27'
                  ? 'Level-2 GCOV extraction: 797.55 km² classified surface water across 13,821 polygons in the 8,955.16 km² swath window (10m grid).'
                  : `Orbital pass stage: ${selectedMajuli.stage}. Ascending pass at 23:05 UTC. Level-2 radiometric calibration verified.`}
              </p>
            </div>
            <div className="text-right shrink-0 border-t md:border-t-0 md:border-l border-[#e5e5e5]/10 pt-3 md:pt-0 md:pl-6">
              <span className="text-[10px] font-mono tracking-widest text-[#e5e5e5]/50 uppercase block">Water Area</span>
              <div className="text-3xl font-editorial text-[#fca311] font-normal">
                {selectedMajuli.date === '2026-08-27' ? '797.55 km²' : 'Cataloged'}
              </div>
              <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase tracking-widest">Single-Pol HHHH</span>
            </div>
          </div>

          {/* Thin Horizontal Timeline with Dots */}
          <div className="relative pt-6 pb-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#e5e5e5]/50 mb-6">
              Track 015 / Frame 3700 Repeat Sequence (Click any dot to select pass)
            </div>

            {/* Connecting Line */}
            <div className="relative w-full">
              <div className="absolute top-3 left-0 right-0 h-[1px] bg-[#e5e5e5]/15"></div>

              <div className="grid grid-cols-7 relative z-10">
                {majuliCycles.map((c) => {
                  const isCurrent = eventDate === c.date || (eventDate === '2026-08-27' && c.date === '2026-08-27');
                  return (
                    <button
                      key={c.cycle}
                      type="button"
                      onClick={() => {
                        onSelectBaseline(c.date);
                        onSelectEvent(c.date);
                      }}
                      className="flex flex-col items-center group cursor-pointer text-center"
                    >
                      {/* Timeline Dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-black border-2 border-[#fca311] scale-110'
                          : 'bg-black border border-[#e5e5e5]/40 group-hover:border-[#fca311]'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-[#fca311]' : 'bg-[#e5e5e5]/60 group-hover:bg-[#fca311]'
                        }`}></span>
                      </div>

                      {/* Label under dot */}
                      <div className="mt-3 space-y-0.5">
                        <span className={`text-[10px] font-mono block uppercase ${
                          isCurrent ? 'text-[#fca311] font-bold' : 'text-[#e5e5e5]/60'
                        }`}>
                          C{c.cycle}
                        </span>
                        <span className="text-xs font-mono text-white block">
                          {c.date.slice(5)}
                        </span>
                        <span className="text-[9px] font-mono text-[#e5e5e5]/40 block truncate max-w-[90px]">
                          {c.stage}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARPETA TIMELINE: THIN LINE WITH DOTS + SLOT SELECTOR                    */}
      {/* ========================================================================= */}
      {isBarpeta && (
        <div className="space-y-6">
          {/* Slot Control Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#e5e5e5]/10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#e5e5e5]/60">
              Track 019 / Frame 075 Observation Sequence
            </span>

            {/* Slot Switcher */}
            <div className="flex items-center gap-2 card-outer p-1 rounded text-xs font-mono">
              <span className="text-[10px] text-[#e5e5e5]/50 uppercase tracking-wider px-2">Set Slot:</span>
              <button
                type="button"
                onClick={() => setActiveSlot('baseline')}
                className={`px-3 py-1 rounded uppercase tracking-wider transition-all cursor-pointer ${
                  activeSlot === 'baseline'
                    ? 'box-inner text-[#fca311] border border-[#fca311] font-semibold'
                    : 'text-[#e5e5e5]/70 hover:text-white'
                }`}
              >
                ● T1 Base ({currentBaseCycle.label})
              </button>
              <button
                type="button"
                onClick={() => setActiveSlot('event')}
                className={`px-3 py-1 rounded uppercase tracking-wider transition-all cursor-pointer ${
                  activeSlot === 'event'
                    ? 'box-inner text-[#fca311] border border-[#fca311] font-semibold'
                    : 'text-[#e5e5e5]/70 hover:text-white'
                }`}
              >
                ● T2 Event ({currentEventCycle.label})
              </button>
            </div>
          </div>

          {/* Thin Horizontal Timeline with 8 Dots */}
          <div className="relative pt-4 pb-4">
            <div className="relative w-full">
              {/* Thin Hairline connecting dots */}
              <div className="absolute top-3 left-0 right-0 h-[1px] bg-[#e5e5e5]/15"></div>

              <div className="grid grid-cols-4 sm:grid-cols-8 relative z-10 gap-y-6 sm:gap-y-0">
                {barpetaCycles.map((c) => {
                  const isBaseline = baselineDate === c.date;
                  const isEvent = eventDate === c.date;
                  const isSelected = isBaseline || isEvent;

                  return (
                    <button
                      key={c.cycle}
                      type="button"
                      onClick={() => {
                        if (activeSlot === 'baseline') {
                          onSelectBaseline(c.date);
                        } else {
                          onSelectEvent(c.date);
                        }
                      }}
                      className="flex flex-col items-center group cursor-pointer text-center px-1"
                    >
                      {/* Timeline Dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-black border-2 border-[#fca311] scale-110 shadow-sm'
                          : 'bg-black border border-[#e5e5e5]/30 group-hover:border-[#fca311]'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-[#fca311]' : 'bg-[#e5e5e5]/50 group-hover:bg-[#fca311]'
                        }`}></span>
                      </div>

                      {/* Dot Label & Metrics */}
                      <div className="mt-3 space-y-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-[10px] font-mono block uppercase ${
                            isSelected ? 'text-[#fca311] font-bold' : 'text-[#e5e5e5]/50'
                          }`}>
                            C{c.cycle}
                          </span>
                          {isBaseline && <span className="text-[8px] font-mono uppercase bg-[#14213d] px-1 rounded text-[#e5e5e5]">T1</span>}
                          {isEvent && <span className="text-[8px] font-mono uppercase bg-[#fca311] px-1 rounded text-black font-bold">T2</span>}
                        </div>
                        <span className="text-xs font-mono text-white block font-medium">
                          {c.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#fca311] block">
                          {c.area}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Comparison Presets as Thin Outlined Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#e5e5e5]/50 mr-2">Quick Presets:</span>
            {barpetaPresets.map((p) => {
              const isSelected = baselineDate === p.base && eventDate === p.evt;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onSelectBaseline(p.base);
                    onSelectEvent(p.evt);
                  }}
                  className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'card-outer-active text-white shadow-sm'
                      : 'box-inner border-[var(--border-outer)] text-[#e5e5e5]/70 hover:border-[#fca311] hover:text-white'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className={`text-[10px] px-1 rounded ${
                    isSelected ? 'text-[#fca311] font-bold' : 'text-[#e5e5e5]/50'
                  }`}>
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Two Clean Editorial Observation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* T1 Baseline Card */}
            <div className="p-5 rounded card-outer space-y-1">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#e5e5e5]/50">
                <span>T1 Baseline • Cycle {currentBaseCycle.cycle}</span>
                <span className="text-[#e5e5e5]/70">Reference State</span>
              </div>
              <div className="text-2xl font-editorial font-normal text-white">
                {currentBaseCycle.date}
              </div>
              <p className="text-xs text-[#e5e5e5]/70 font-light pt-1">
                {currentBaseCycle.stage}. Water extent: <strong className="text-white font-mono">{currentBaseCycle.area}</strong> ({currentBaseCycle.pct} of corridor).
              </p>
            </div>

            {/* T2 Event Card */}
            <div className="p-5 rounded card-outer-active space-y-1">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#fca311]">
                <span>T2 Event • Cycle {currentEventCycle.cycle}</span>
                <span className="text-[#fca311] font-semibold">Active Observation</span>
              </div>
              <div className="text-2xl font-editorial font-normal text-white">
                {currentEventCycle.date}
              </div>
              <p className="text-xs text-[#e5e5e5]/70 font-light pt-1">
                {currentEventCycle.stage}. Water extent: <strong className="text-[#fca311] font-mono">{currentEventCycle.area}</strong> ({currentEventCycle.pct} of corridor).
              </p>
            </div>
          </div>

          {/* Threshold Tuning Drawer */}
          <div className="border-t border-[#e5e5e5]/10 pt-3 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-[#e5e5e5]/50 uppercase tracking-widest">
              Algorithm: Single-Pol HHHH Log-Ratio (&Delta;&gamma;⁰ &lt; {thresholdDb.toFixed(1)} dB)
            </span>
            <button
              type="button"
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="text-xs font-mono uppercase tracking-wider text-[#fca311] hover:text-white transition-colors cursor-pointer"
            >
              {showAdvancedTuning ? 'Hide Radar Thresholds' : 'Tune Radar Cutoff'}
            </button>
          </div>

          {showAdvancedTuning && (
            <div className="p-4 rounded card-outer grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#e5e5e5]/70 uppercase">Log-Ratio Cutoff:</span>
                  <span className="text-[#fca311] font-bold">{thresholdDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-10.0"
                  max="-2.0"
                  step="0.5"
                  value={thresholdDb}
                  onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                  className="w-full accent-[#fca311] cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white uppercase">Lee Speckle Noise Filter</div>
                  <div className="text-[10px] text-[#e5e5e5]/50">3×3 adaptive variance window</div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSpeckleFilter(!speckleFilter)}
                  className={`px-3 py-1.5 rounded uppercase tracking-wider text-xs font-mono transition-colors cursor-pointer border ${
                    speckleFilter
                      ? 'bg-[#fca311] text-black border-[#fca311] font-bold'
                      : 'bg-black text-[#e5e5e5]/60 border-[#e5e5e5]/20 hover:text-white'
                  }`}
                >
                  {speckleFilter ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unsupported Region Warning */}
      {!isMajuli && !isBarpeta && (
        <div className="p-4 rounded card-outer-active text-xs text-[#e5e5e5]/80 space-y-1">
          <div className="font-mono text-[#fca311] uppercase tracking-wider font-semibold">
            No Processed Radar Observations Available for Selected Area
          </div>
          <p className="font-light">
            Verified Level-2 NISAR satellite extractions are available for <strong>Majuli River Island</strong> and <strong>Barpeta Reach</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
