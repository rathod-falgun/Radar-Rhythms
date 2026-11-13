import React from 'react';
import {
  Microscope,
  Activity,
  ShieldCheck,
  Binary,
  Sliders,
  Database,
  FileCode,
  TrendingDown,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function ScientistRadarPanel({ comparisonData, parameters }) {
  if (!comparisonData) return null;

  const stats = comparisonData.statistics || {};
  const params = parameters || comparisonData.parameters || {};

  const isMajuli =
    comparisonData.region?.id === 'majuli' ||
    params.orbit_track === '015' ||
    stats.is_real_extraction === true;

  const isBarpeta =
    comparisonData.region?.id === 'barpeta' ||
    stats.percentage_change === 140.77 ||
    stats.is_real_change_detection === true;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {isMajuli
                  ? 'Advanced Polarimetric & Speckle Decomposition (Majuli)'
                  : isBarpeta
                    ? 'Multi-Temporal SAR Log-Ratio Decomposition (Barpeta)'
                    : 'Advanced Polarimetric & Speckle Decomposition'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-mono border border-sky-300 font-semibold">
                Radar Scientist Mode
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isMajuli
                ? 'Track 015 / Frame 3700 • 27 Aug 2026 • Real Level-2 GCOV single-pol backscatter distribution'
                : isBarpeta
                  ? 'Track 019 / Frame 075 • 27 Jun vs 09 Jul 2026 • Single-Pol HHHH (12-day interval) • +140.77% surge'
                  : 'Backscatter statistics, Lee speckle filter moments, and Otsu bimodal separation'}
            </p>
          </div>
        </div>

        {/* Covariance Pill */}
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg border flex items-center gap-2 bg-slate-50 border-slate-200 text-slate-700">
          <span className="text-slate-500">Covariance:</span>
          <span className="text-sky-700 font-bold">
            {isMajuli ? 'C1 [HHHH] (Single-Pol)' : isBarpeta ? 'C1 [HHHH] (Multi-Temporal)' : 'C1 [HHHH]'}
          </span>
        </div>
      </div>

      {/* Primary Quantitative Cards */}
      {isMajuli ? (
        /* MAJULI METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">MEASURED BACKSCATTER REGIMES</span>
              <Activity className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold font-mono text-slate-900 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-sans">Water Mode:</span>
                <span className="text-sky-700">-18.64 dB <span className="text-xs font-normal text-slate-400">±2.68 dB</span></span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-sans">Land Mode:</span>
                <span className="text-slate-700">-8.91 dB <span className="text-xs font-normal text-slate-400">±3.94 dB</span></span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-[11px] font-mono text-emerald-700 flex items-center justify-between">
                <span>Bimodal Contrast:</span>
                <span className="font-bold">Δ 9.73 dB separation</span>
              </div>
            </div>
            <div className="pt-1">
              <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-tight">
                <strong>Polarization Notice:</strong> Cross-pol (HVHV) was deferred; single-pol HHHH was utilized.
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">ADAPTIVE LEE SPECKLE FILTER</span>
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 mb-1">
              Kernel: <span className="text-emerald-700">5 × 5</span> │ ENL: <span className="text-slate-500 text-xs font-sans">Not independently measured</span>
            </div>
            <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Filter Weighting:</span>
              W = (Var_I - σ_v²) / Var_I
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Multiplicative noise weighting preserves narrow riverbank boundaries across 89.5M pixels.
            </p>
          </div>

          {/* Metric 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">OTSU BIMODAL THRESHOLD</span>
              <Binary className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 mb-1">
              Optimal Cutoff: <span className="text-amber-700">-15.00 dB</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Evaluated Pixels:</span>
                <span className="text-slate-900 font-bold">89,551,584</span>
              </div>
              <div className="flex justify-between">
                <span>Water Pixels:</span>
                <span className="text-sky-700 font-bold">7,975,500 (797.55 km²)</span>
              </div>
              <div className="flex justify-between">
                <span>Raster Coverage:</span>
                <span className="text-emerald-700 font-bold">8.91% of 8,955 km²</span>
              </div>
            </div>
          </div>
        </div>
      ) : isBarpeta ? (
        /* BARPETA METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">FLOOD BACKSCATTER ATTENUATION</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-600 font-mono flex justify-between">
                <span>Baseline (27 Jun):</span>
                <span className="text-slate-900 font-bold">-11.50 dB (dry soil)</span>
              </div>
              <div className="text-xs text-rose-700 font-mono flex justify-between">
                <span>Event (09 Jul):</span>
                <span className="text-rose-700 font-bold">-21.80 dB (submerged)</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-sm font-bold font-mono text-rose-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-sans font-normal">Log-Ratio Drop:</span>
                <span>Δ -10.30 dB</span>
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">4-CLASS MATRIX SUMMARY</span>
              <Layers className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Newly Inundated:</span>
                <span>+2.337 km² (+140.77%)</span>
              </div>
              <div className="flex justify-between text-sky-700 font-bold">
                <span>Persistent Channel:</span>
                <span>1.660 km²</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Stable Land:</span>
                <span>5.155 km² (Total: 9.152 km²)</span>
              </div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-slate-800">THRESHOLD EXCEEDANCE MARGIN</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 mb-1">
              Safety Margin: <span className="text-emerald-700">5.80 dB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Actual attenuation of -10.30 dB safely exceeds the -4.50 dB classification threshold with a 5.80 dB buffer.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
