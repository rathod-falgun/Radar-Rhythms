import React from 'react';
import { Calendar, Sliders, AlertCircle, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export default function DateSelector({
  observations,
  baselineDate,
  eventDate,
  thresholdDb,
  onSelectBaseline,
  onSelectEvent,
  onThresholdChange,
  onApplyPreset
}) {
  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            2. NISAR 12-Day Orbital Timeline (Track 019 / Frame 075)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApplyPreset('2026-06-27', '2026-07-09')}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset: Candidate Flood Event (Jun 27 vs Jul 09)</span>
          </button>
        </div>
      </div>

      {/* Revisit Sequence Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        {observations.map((obs) => {
          const isBaseline = obs.date === baselineDate;
          const isEvent = obs.date === eventDate;

          let badgeColor = 'bg-slate-800 text-slate-300';
          if (isBaseline) badgeColor = 'bg-emerald-500 text-black font-bold';
          if (isEvent) badgeColor = 'bg-rose-500 text-white font-bold';

          return (
            <div
              key={obs.date}
              className={`p-2.5 rounded-lg border transition-all text-left relative ${
                isEvent
                  ? 'bg-rose-950/30 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                  : isBaseline
                  ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Cycle {obs.cycle_str}
                </span>
                {obs.is_candidate && (
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-rose-900/80 text-rose-300 font-bold border border-rose-700">
                    Candidate
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-white mb-1">{obs.date}</div>
              <div className="text-[10px] text-slate-400 leading-tight line-clamp-2 h-7 mb-2">
                {obs.stage}
              </div>

              {/* Selection Toggles */}
              <div className="flex items-center gap-1 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectBaseline(obs.date)}
                  disabled={isEvent}
                  className={`flex-1 py-0.5 text-[9px] rounded font-medium transition-colors ${
                    isBaseline
                      ? 'bg-emerald-500 text-black font-bold'
                      : isEvent
                      ? 'opacity-20 cursor-not-allowed bg-slate-800 text-slate-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40'
                  }`}
                >
                  {isBaseline ? 'Baseline' : 'Set Base'}
                </button>
                <button
                  onClick={() => onSelectEvent(obs.date)}
                  disabled={isBaseline}
                  className={`flex-1 py-0.5 text-[9px] rounded font-medium transition-colors ${
                    isEvent
                      ? 'bg-rose-500 text-white font-bold'
                      : isBaseline
                      ? 'opacity-20 cursor-not-allowed bg-slate-800 text-slate-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/40'
                  }`}
                >
                  {isEvent ? 'Event' : 'Set Event'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Parameter Bar */}
      <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Baseline (Pre-Flood):</span>
            <span className="text-emerald-300 font-mono font-bold">{baselineDate}</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Event (Flood Peak):</span>
            <span className="text-rose-300 font-mono font-bold">{eventDate}</span>
          </div>
          <div className="text-slate-500 hidden sm:inline font-mono">
            (Exact 12-Day Revisit Matched Orbit)
          </div>
        </div>

        {/* Sensitivity Threshold Slider */}
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">Log-Ratio Sensitivity:</span>
          <input
            type="range"
            min="-7.0"
            max="-2.5"
            step="0.5"
            value={thresholdDb}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {thresholdDb.toFixed(1)} dB
          </span>
        </div>
      </div>
    </div>
  );
}

