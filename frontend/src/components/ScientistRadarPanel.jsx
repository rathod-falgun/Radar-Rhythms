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
  const rasterStats = comparisonData.raster_stats || {};

  const isMajuli =
    comparisonData.region?.id === 'majuli' ||
    params.orbit_track === '015' ||
    stats.is_real_extraction === true;

  const isBarpeta =
    comparisonData.region?.id === 'barpeta' ||
    stats.percentage_change === 140.77 ||
    stats.is_real_change_detection === true;

  return (
    <div className="bg-[#0f172a]/95 border border-cyan-500/30 rounded-xl p-5 shadow-2xl backdrop-blur space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-inner">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-wide">
                {isMajuli
                  ? 'Advanced Polarimetric & Speckle Decomposition — Single-Date Water Extraction'
                  : isBarpeta
                  ? 'Multi-Temporal SAR Log-Ratio Decomposition & Matrix Change Analysis'
                  : 'Advanced Polarimetric & Speckle Decomposition'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800 font-bold">
                Scientist & Radar Geodesist Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isMajuli
                ? 'Track 015 / Frame 3700 • 27 Aug 2026 • Real Level 2 GCOV single-pol backscatter distribution'
                : isBarpeta
                ? 'Track 019 / Frame 075 • 27 Jun vs 09 Jul 2026 • Single-Pol HHHH (12-day interval) • +140.77% surge'
                : 'Backscatter statistics, Lee speckle filter moments, and Otsu bimodal separation'}
            </p>
          </div>
        </div>

        {/* Sensor & Covariance Mode Pill */}
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg border flex items-center gap-2 bg-slate-900 border-slate-700">
          <span className="text-slate-400">Covariance:</span>
          {isMajuli ? (
            <span className="text-cyan-300 font-bold">
              C1 [HHHH] (Single-Pol Mode)
            </span>
          ) : isBarpeta ? (
            <span className="text-emerald-300 font-bold">
              C1 [HHHH] (Single-Pol Multi-Temporal Mode)
            </span>
          ) : (
            <span className="text-cyan-400 font-bold">
              C1 [HHHH]
            </span>
          )}
        </div>
      </div>

      {/* Primary Quantitative Cards */}
      {isMajuli ? (
        /* MAJULI METRICS: Single-Date HHHH Water Extraction */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Real HHHH Backscatter Regimes */}
          <div className="bg-slate-900/90 border border-cyan-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-cyan-300">MEASURED BACKSCATTER REGIMES</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold font-mono text-white flex items-center justify-between">
                <span className="text-xs text-slate-400">Water Mode:</span>
                <span className="text-cyan-400">-18.64 dB <span className="text-xs font-normal text-slate-400">±2.68 dB</span></span>
              </div>
              <div className="text-lg font-bold font-mono text-white flex items-center justify-between">
                <span className="text-xs text-slate-400">Land Mode:</span>
                <span className="text-slate-200">-8.91 dB <span className="text-xs font-normal text-slate-400">±3.94 dB</span></span>
              </div>
              <div className="pt-1 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                <span>Bimodal Contrast:</span>
                <span className="font-bold">Δ 9.73 dB separation</span>
              </div>
            </div>
            <div className="pt-1">
              <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-300 leading-tight">
                <strong>Polarization Notice:</strong> Cross-pol (HVHV) is <em>Not Available</em> for this run (single-pol HHHH observation; cross-pol suppression deferred).
              </div>
            </div>
          </div>

          {/* Metric 2: Adaptive Lee Speckle Filter */}
          <div className="bg-slate-900/90 border border-emerald-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-emerald-300">ADAPTIVE LEE SPECKLE FILTER</span>
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              Kernel: <span className="text-emerald-400">5 × 5</span> │ ENL: <span className="text-slate-400 text-xs">Not independently measured</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Filter Weighting Coefficient:</span>
              W = (Var_I - σ_v²) / Var_I
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Multiplicative noise weighting preserves narrow riverbank boundaries across 89.5M pixels. Multilooking is nominal in the upstream Level-2 GCOV processor.
            </p>
          </div>

          {/* Metric 3: Otsu Bimodal Separation */}
          <div className="bg-slate-900/90 border border-amber-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-amber-300">OTSU BIMODAL THRESHOLD</span>
              <Binary className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              Cutoff: <span className="text-amber-400">-15.00 dB</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluated Pixels:</span>
                <span className="text-white font-bold">89,551,584</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Water Pixels:</span>
                <span className="text-cyan-300 font-bold">7,975,500 (797.55 km²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Raster Swath:</span>
                <span className="text-slate-300 font-bold">8.91% of 8,955.16 km²</span>
              </div>
            </div>
          </div>
        </div>
      ) : isBarpeta ? (
        /* BARPETA METRICS: Multi-Temporal Flood Change */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Flood Inundation Attenuation */}
          <div className="bg-slate-900/90 border border-rose-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-rose-300">FLOOD BACKSCATTER ATTENUATION</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-300 font-mono flex justify-between">
                <span>Baseline (27 Jun):</span>
                <span className="text-slate-200 font-bold">-11.50 dB (dry soil)</span>
              </div>
              <div className="text-xs text-rose-300 font-mono flex justify-between">
                <span>Event (09 Jul):</span>
                <span className="text-rose-400 font-bold">-21.80 dB (submerged)</span>
              </div>
              <div className="pt-1 border-t border-slate-800 text-lg font-bold font-mono text-rose-400 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-normal">Log-Ratio Drop:</span>
                <span>Δ -10.30 dB</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Measured on <strong>3,677 pixels</strong> (2.337 km²). Exceeds the -4.50 dB threshold by a <strong>5.80 dB threshold exceedance margin</strong>.
            </p>
            <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-300 leading-tight">
              <strong>Polarization Disclosure:</strong> Single-pol HHHH multi-temporal analysis. Dual-pol (HVHV) cross-polarization and C2 covariance representation were not utilized in this processing run.
            </div>
          </div>

          {/* Metric 2: Persistent Channel Observations */}
          <div className="bg-slate-900/90 border border-cyan-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-cyan-300">DEEP CHANNEL OBSERVATIONS</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-300 font-mono flex justify-between">
                <span>Baseline (27 Jun):</span>
                <span className="text-slate-200 font-bold">-22.73 dB</span>
              </div>
              <div className="text-xs text-cyan-300 font-mono flex justify-between">
                <span>Event (09 Jul):</span>
                <span className="text-cyan-300 font-bold">-22.49 dB</span>
              </div>
              <div className="pt-1 border-t border-slate-800 text-lg font-bold font-mono text-cyan-300 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-normal">Observed Channel Delta:</span>
                <span className="text-cyan-300">Δ +0.24 dB</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Measured on <strong>2,612 pixels</strong> (1.660 km²) of deep Brahmaputra channel. Small delta (+0.24 dB) indicates consistent specular return between the two observation dates (sensor calibration stability not independently validated).
            </p>
          </div>

          {/* Metric 3: Matrix Accounting & Surge Ratio */}
          <div className="bg-slate-900/90 border border-amber-800/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-amber-300">4-CLASS MATRIX ACCOUNTING</span>
              <Binary className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              Surge: <span className="text-rose-400">+140.77%</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Stable Land (0):</span>
                <span className="text-white">8,111 px (5.155 km²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Persistent Water (1):</span>
                <span className="text-cyan-300">2,612 px (1.660 km²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Newly Inundated (2):</span>
                <span className="text-rose-300 font-bold">3,677 px (2.337 km²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Receded Water (3):</span>
                <span className="text-slate-400">0 px (0.000 km²)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GENERIC / FALLBACK METRICS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>BACKSCATTER RATIO</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              HH: <span className="text-cyan-400">-14.8 dB</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Backscatter characteristics across monitored Brahmaputra reach.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>ADAPTIVE LEE SPECKLE FILTER</span>
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              Kernel: <span className="text-emerald-400">5 × 5</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Preserves sharp river embankments while smoothing water speckle.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>OTSU CLASSIFICATION</span>
              <Binary className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              Threshold: <span className="text-amber-400">{params.threshold_db || -15.0} dB</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Separates specular water from diffuse land backscatter.
            </p>
          </div>
        </div>
      )}

      {/* Mathematical Rigor Card */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-3">
        <div className="text-cyan-400 font-bold flex items-center gap-1.5">
          <FileCode className="w-4 h-4" />
          <span>Scientific Safeguards & Theoretical Rigor Formulation:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold">1. Log-Ratio Difference Operator:</span>
            <div className="text-cyan-300 font-mono">
              Δγ° = 10 · log₁₀(γ°_event / γ°_baseline) = γ°_event(dB) - γ°_baseline(dB)
            </div>
            <div className="text-[10px] text-slate-400">
              {isBarpeta
                ? 'Observed Δ = -10.30 dB on newly submerged agricultural plains (specular attenuation).'
                : 'Measures multi-temporal change when identical repeat-pass orbits are available.'}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold">2. Radar Scattering Physics:</span>
            <div className="text-emerald-300 font-mono">
              Specular: R = |(1 - √ε) / (1 + √ε)|² → σ° &lt; -18 dB
            </div>
            <div className="text-[10px] text-slate-400">
              High dielectric constant of water (ε ≈ 80) causes forward specular reflection away from sensor. Dual-pol RVI is deferred in this single-pol HHHH study.
            </div>
          </div>
        </div>

        {/* Geographic Attribution Guardrail */}
        <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Scientific Distinction:</strong>{' '}
            {isMajuli ? (
              <span>
                This is a single-date water extent evaluation for <strong>Majuli Island (Track 015 / Frame 3700, 797.55 km²)</strong> across an 8,955.16 km² UTM 46N raster swath using single-pol HHHH. The multi-temporal +140.77% flood surge belongs strictly to the Barpeta study (Track 019 / Frame 075).
              </span>
            ) : isBarpeta ? (
              <span>
                The <strong>+140.77% flood surge</strong> was measured strictly across the <strong>9.152 km² Barpeta corridor</strong> (91.09°E–91.12°E, 26.63°N–26.66°N) between 27 June and 09 July 2026 using single-pol HHHH backscatter. It does not apply to Majuli Island.
              </span>
            ) : (
              <span>
                Always distinguish single-date water detection from multi-temporal change detection across distinct orbit tracks.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
