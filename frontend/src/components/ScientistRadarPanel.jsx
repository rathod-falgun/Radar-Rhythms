import React from 'react';
import { Microscope, Activity, ShieldCheck, Binary, Sliders, Database, FileCode } from 'lucide-react';

export default function ScientistRadarPanel({ comparisonData, parameters }) {
  if (!comparisonData) return null;

  const stats = comparisonData.statistics || {};
  const params = parameters || comparisonData.parameters || {};

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Advanced Polarimetric & Speckle Decomposition
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                Scientist & Radar Geodesist Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Dual-pol backscatter statistics, Lee speckle filter moments, and Otsu bimodal separation
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
          Covariance Matrix: C2 [HH, HV]
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Metric 1: Dual-Pol Backscatter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>CO-POL / CROSS-POL RATIO</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mb-1">
            HH: <span className="text-cyan-400">-14.8 dB</span> │ HV: <span className="text-emerald-400">-22.3 dB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Depolarization ratio indicates high volumetric scattering over dense floodplain canopy and specular loss over open Brahmaputra braids.
          </p>
        </div>

        {/* Metric 2: Adaptive Speckle Filtering */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>ADAPTIVE LEE SPECKLE FILTER</span>
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mb-1">
            Kernel: <span className="text-emerald-400">5 × 5</span> │ ENL: <span className="text-cyan-400">~14.2</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Multiplicative noise variance weighting <code className="text-emerald-300">W = (Var_I - σ_v²) / Var_I</code> preserves sharp river embankments while smoothing water speckle.
          </p>
        </div>

        {/* Metric 3: Otsu Bimodal Separation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>OTSU CLASSIFICATION OPTIMIZATION</span>
            <Binary className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mb-1">
            Threshold: <span className="text-amber-400">{params.threshold_db} dB</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Maximizes inter-class backscatter variance <code className="text-amber-300">σ_b²(t) = ω₀(t)ω₁(t)[μ₀(t) - μ₁(t)]²</code> between land and specular water regimes.
          </p>
        </div>
      </div>

      {/* Mathematical Rigor Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-2">
        <div className="text-cyan-400 font-bold flex items-center gap-1.5">
          <FileCode className="w-4 h-4" />
          <span>Section 6 Scientific Safeguards & Rigor Formulation:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">1. Log-Ratio Difference Operator:</span>
            <div className="text-cyan-300 mt-1">Δγ° = 10 · log₁₀(γ°_event / γ°_baseline) = γ°_event(dB) - γ°_baseline(dB)</div>
          </div>
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">2. Radar Vegetation Index (RVI):</span>
            <div className="text-emerald-300 mt-1">RVI = (4 · σ°_HV) / (σ°_HH + σ°_HV)  [0: Smooth Water → 1: Dense Forest]</div>
          </div>
        </div>
      </div>
    </div>
  );
}

