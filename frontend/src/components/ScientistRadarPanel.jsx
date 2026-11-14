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
    <div className="card-outer rounded p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-outer)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded box-inner text-[#fca311] flex items-center justify-center">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-editorial font-semibold text-white tracking-wide">
                {isMajuli
                  ? 'Advanced Polarimetric & Speckle Decomposition (Majuli)'
                  : isBarpeta
                    ? 'Multi-Temporal SAR Log-Ratio Decomposition (Barpeta)'
                    : 'Advanced Polarimetric & Speckle Decomposition'}
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded box-inner text-[#fca311] font-mono uppercase tracking-widest font-medium">
                Radar Scientist Mode
              </span>
            </div>
            <p className="text-xs font-sans text-[#e5e5e5]/70">
              {isMajuli
                ? 'Track 015 / Frame 3700 • 27 Aug 2026 • Real Level-2 GCOV single-pol backscatter distribution'
                : isBarpeta
                  ? 'Track 019 / Frame 075 • 27 Jun vs 09 Jul 2026 • Single-Pol HHHH (12-day interval) • +140.77% surge'
                  : 'Backscatter statistics, Lee speckle filter moments, and Otsu bimodal separation'}
            </p>
          </div>
        </div>

        {/* Covariance Pill */}
        <div className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded flex items-center gap-2 box-inner text-[#e5e5e5]/70">
          <span>Covariance:</span>
          <span className="text-[#fca311] font-semibold">
            {isMajuli ? 'C1 [HHHH] (Single-Pol)' : isBarpeta ? 'C1 [HHHH] (Multi-Temporal)' : 'C1 [HHHH]'}
          </span>
        </div>
      </div>

      {/* Primary Quantitative Cards */}
      {isMajuli ? (
        /* MAJULI METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>MEASURED BACKSCATTER REGIMES</span>
              <Activity className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-bold font-mono text-white flex items-center justify-between">
                <span className="text-xs text-[#e5e5e5]/70 font-sans font-normal">Water Mode:</span>
                <span className="text-[#fca311]">-18.64 dB <span className="text-xs font-normal text-[#e5e5e5]/50">±2.68 dB</span></span>
              </div>
              <div className="text-sm font-bold font-mono text-white flex items-center justify-between">
                <span className="text-xs text-[#e5e5e5]/70 font-sans font-normal">Land Mode:</span>
                <span className="text-[#e5e5e5]">-8.91 dB <span className="text-xs font-normal text-[#e5e5e5]/50">±3.94 dB</span></span>
              </div>
              <div className="pt-2 border-t border-[var(--border-outer)] text-xs font-mono text-white flex items-center justify-between">
                <span>Bimodal Contrast:</span>
                <span className="font-bold text-[#fca311]">Δ 9.73 dB separation</span>
              </div>
            </div>
            <div className="pt-1">
              <div className="p-2 rounded card-outer text-[10px] text-[#e5e5e5]/80 font-mono leading-tight">
                <strong>Polarization Notice:</strong> Cross-pol (HVHV) was deferred; single-pol HHHH was utilized.
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>ADAPTIVE LEE SPECKLE FILTER</span>
              <Sliders className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="text-sm font-bold font-mono text-white mb-1">
              Kernel: <span className="text-[#fca311]">5 × 5</span> │ ENL: <span className="text-[#e5e5e5]/50 text-xs font-sans font-normal">Literature nominal</span>
            </div>
            <div className="text-xs font-mono text-white card-outer p-2.5 rounded">
              <span className="text-[#e5e5e5]/50 block text-[10px] uppercase">Filter Weighting:</span>
              W = (Var_I - σ_v²) / Var_I
            </div>
            <p className="text-[11px] text-[#e5e5e5]/70 font-sans leading-snug">
              Multiplicative noise weighting preserves narrow riverbank boundaries across 89.5M pixels.
            </p>
          </div>

          {/* Metric 3 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>OTSU BIMODAL THRESHOLD</span>
              <Binary className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="text-sm font-bold font-mono text-white mb-1">
              Optimal Cutoff: <span className="text-[#fca311]">-15.00 dB</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#e5e5e5]/70 font-mono">
              <div className="flex justify-between">
                <span>Evaluated Pixels:</span>
                <span className="text-white font-bold">89,551,584</span>
              </div>
              <div className="flex justify-between">
                <span>Water Pixels:</span>
                <span className="text-[#fca311] font-bold">7,975,500 (797.55 km²)</span>
              </div>
              <div className="flex justify-between">
                <span>Raster Coverage:</span>
                <span className="text-white font-bold">8.91% of 8,955 km²</span>
              </div>
            </div>
          </div>
        </div>
      ) : isBarpeta ? (
        /* BARPETA METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>FLOOD BACKSCATTER ATTENUATION</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs text-[#e5e5e5]/70 font-mono flex justify-between">
                <span>Baseline (27 Jun):</span>
                <span className="text-white font-bold">-11.50 dB (dry soil)</span>
              </div>
              <div className="text-xs text-[#e5e5e5]/70 font-mono flex justify-between">
                <span>Event (09 Jul):</span>
                <span className="text-[#fca311] font-bold">-21.80 dB (submerged)</span>
              </div>
              <div className="pt-2 border-t border-[var(--border-outer)] text-sm font-bold font-mono text-[#fca311] flex justify-between items-center">
                <span className="text-xs text-[#e5e5e5]/70 font-sans font-normal">Log-Ratio Drop:</span>
                <span>Δ -10.30 dB</span>
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>4-CLASS MATRIX SUMMARY</span>
              <Layers className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#fca311] font-bold">
                <span>Newly Inundated:</span>
                <span>+2.337 km² (+140.77%)</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Persistent Channel:</span>
                <span>1.660 km²</span>
              </div>
              <div className="flex justify-between text-[#e5e5e5]/60">
                <span>Stable Land:</span>
                <span>5.155 km² (Total: 9.152 km²)</span>
              </div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="box-inner rounded p-4 space-y-2.5">
            <div className="text-xs text-[#e5e5e5]/50 flex items-center justify-between font-mono uppercase tracking-wider text-[10px]">
              <span>THRESHOLD EXCEEDANCE MARGIN</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#fca311]" />
            </div>
            <div className="text-sm font-bold font-mono text-white mb-1">
              Safety Margin: <span className="text-[#fca311]">5.80 dB</span>
            </div>
            <p className="text-[11px] text-[#e5e5e5]/70 font-sans leading-snug">
              Actual attenuation of -10.30 dB safely exceeds the -4.50 dB classification threshold with a 5.80 dB buffer.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
