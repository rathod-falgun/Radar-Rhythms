import React from 'react';
import HDF5Inspector from './HDF5Inspector';
import { Layers, ShieldCheck, AlertCircle, FileText, Database, BookOpen, ExternalLink, Cpu } from 'lucide-react';

export default function DataMethodologyView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 inline-block mb-3">
            Open-Science Technical Documentation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Data Provenance & Scientific Methodology
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every metric and polygon displayed on this platform is derived from authentic NASA–ISRO NISAR 
            Level-2 GCOV (Geocoded Polarimetric Covariance) products processed through rigorous open algorithms.
          </p>
        </div>
      </div>

      {/* Two Datasets Provenance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600" />
          Primary Satellite Datasets Evaluated
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Majuli Scene */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Majuli Island Reach</span>
              <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold font-mono text-[10px]">
                Track 015 / Frame 3700
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>Acquisition Date:</strong> 27 August 2026 (Ascending Pass).</li>
              <li>• <strong>Product Level:</strong> Level-2 GCOV (UTM Zone 46N, Radiometric Terrain Correction).</li>
              <li>• <strong>Resolution:</strong> 8,948 × 10,008 pixels @ 10 m pixel spacing (8,955.16 km²).</li>
              <li>• <strong>Classification:</strong> Single-Pol HHHH with Adaptive Otsu (-15.0 dB) + Lee Filter.</li>
              <li>• <strong>Verified Result:</strong> 797.55 km² water extent (13,821 vector polygons).</li>
              <li>• <strong>Scientific Scope:</strong> Single-date water delineation, NOT a multi-date flood change result.</li>
            </ul>
          </div>

          {/* Barpeta Scenes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Barpeta Floodplain Reach</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono text-[10px]">
                Track 019 / Frame 075
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>Observation Dates:</strong> 27 June 2026 (Baseline) vs 09 July 2026 (Event).</li>
              <li>• <strong>Revisit Interval:</strong> Exact 12-day orbital repeat cycle (Zero Geometric Parallax).</li>
              <li>• <strong>Evaluated Corridor:</strong> 9.152 km² active floodway corridor (91.09°E–91.12°E, 26.63°N–26.66°N).</li>
              <li>• <strong>Algorithm:</strong> Decibel log-ratio subtraction: Δγ° = 10 log₁₀(γ°_evt / γ°_base) &lt; -4.50 dB.</li>
              <li>• <strong>Verified Result:</strong> Water expanded from 1.660 km² to 3.997 km² (+140.77% surge).</li>
              <li>• <strong>Attribution Guardrail:</strong> The +140.77% surge applies strictly to this corridor.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mathematical Algorithms Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            1. Adaptive Otsu Thresholding
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Microwave radar backscatter over a mixed landscape forms a bimodal histogram: dark specular water and bright diffuse land. Otsu's algorithm maximizes the inter-class variance between the two Gaussian distributions:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-[11px] text-slate-800 border border-slate-200 text-center">
            σ_B²(t) = ω₀(t) · ω₁(t) · [μ₀(t) - μ₁(t)]²
          </div>
          <p className="text-slate-500">
            Optimal threshold found for Majuli: <strong>-15.0 dB</strong> (Water mean: -18.63 dB, Land mean: -8.91 dB, Separation: 9.72 dB).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            2. Lee Speckle Noise Filter
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Radar images suffer from granular multiplicative speckle noise caused by coherent interference. The adaptive Lee filter uses local spatial variance in a 3×3 moving window:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-[11px] text-slate-800 border border-slate-200 text-center">
            W = (σ² - σ_noise²) / σ², &nbsp; Î = Ī + W(I - Ī)
          </div>
          <p className="text-slate-500">
            Smooth open water is strongly filtered to eliminate false noise spikes, while sharp river bank edges maintain crisp boundaries.
          </p>
        </div>
      </div>

      {/* Scientific Limitations & Disclosures */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs text-amber-950">
        <h4 className="font-bold text-sm flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Mandatory Scientific Disclosures
        </h4>
        <ul className="space-y-1.5 leading-relaxed text-amber-900/90">
          <li>• <strong>Single-Polarization Processing:</strong> Both operational analyses utilize single-pol HHHH backscatter. Cross-polarization (HVHV) volume scattering suppression was deferred.</li>
          <li>• <strong>Nominal ENL Baseline:</strong> Equivalent Number of Looks (ENL = 14.2) represents a literature nominal value for Level-2 GCOV, not an independently measured test-site value.</li>
          <li>• <strong>Observational Estimates:</strong> All classifications are remote-sensing estimates, not ground-truth surveys.</li>
          <li>• <strong>Event Observation vs Peak:</strong> The 09 July 2026 data captured an active flood event observation during the July monsoon, not verified as the absolute seasonal flood peak.</li>
        </ul>
      </div>

      {/* Official NISAR HDF5 Container Inspector */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-900">
          NISAR Level-2 GCOV Container Hierarchy
        </h3>
        <p className="text-xs text-slate-500">
          Explore the official CF-1.8 compliant HDF5 metadata tree and internal data layers parsed by our backend.
        </p>
        <HDF5Inspector dateStr="2026-07-09" />
      </div>
    </div>
  );
}

