import React from 'react';
import HDF5Inspector from './HDF5Inspector';

export default function DataMethodologyView() {
  return (
    <div className="space-y-8 w-full">
      {/* Top Banner */}
      <div className="card-outer text-[#e5e5e5] rounded p-6 sm:p-10">
        <div className="max-w-3xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded box-inner text-[#fca311] inline-block font-medium">
            Open-Science Technical Documentation
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial tracking-tight text-white">
            Data Provenance & <span className="text-[#fca311] font-normal italic">Scientific Methodology</span>
          </h2>
          <p className="text-sm sm:text-base text-[#e5e5e5]/80 font-sans leading-relaxed pt-1">
            Every metric and polygon displayed on this platform is derived from authentic NASA–ISRO NISAR
            Level-2 GCOV (Geocoded Polarimetric Covariance) products processed through rigorous open algorithms.
          </p>
        </div>
      </div>

      {/* Two Datasets Provenance Table */}
      <div className="card-outer rounded p-6 space-y-4">
        <h3 className="text-lg font-editorial font-semibold text-white">
          Primary Satellite Datasets Evaluated
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Majuli Scene — Level 1 */}
          <div className="p-5 rounded card-outer space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-editorial font-semibold text-white text-base">Majuli Island Reach</span>
              <span className="px-2 py-0.5 rounded box-inner text-[#fca311] font-mono text-[10px] uppercase tracking-wider">
                Track 015 / Frame 3700
              </span>
            </div>
            <ul className="space-y-2 text-[#e5e5e5]/80 font-sans">
              <li>• <strong className="text-white">Acquisition Date:</strong> 27 August 2026 (Ascending Pass).</li>
              <li>• <strong className="text-white">Product Level:</strong> Level-2 GCOV (UTM Zone 46N, Radiometric Terrain Correction).</li>
              <li>• <strong className="text-white">Resolution:</strong> 8,948 × 10,008 pixels @ 10 m pixel spacing (8,955.16 km²).</li>
              <li>• <strong className="text-white">Classification:</strong> Single-Pol HHHH with Adaptive Otsu (-15.0 dB) + Lee Filter.</li>
              <li>• <strong className="text-white">Verified Result:</strong> <span className="px-2 py-0.5 rounded card-highlight text-[#fca311] font-mono font-bold inline-block">797.55 km²</span> water extent (13,821 vector polygons).</li>
              <li>• <strong className="text-white">Scientific Scope:</strong> Single-date water delineation, NOT a multi-date flood change result.</li>
            </ul>
          </div>

          {/* Barpeta Scenes — Level 1 with faint amber tint at top-left corner */}
          <div className="p-5 rounded card-barpeta space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-editorial font-semibold text-white text-base">Barpeta Floodplain Reach</span>
              <span className="px-2 py-0.5 rounded box-inner text-[#fca311] font-mono text-[10px] uppercase tracking-wider">
                Track 019 / Frame 075
              </span>
            </div>
            <ul className="space-y-2 text-[#e5e5e5]/80 font-sans">
              <li>• <strong className="text-white">Observation Dates:</strong> 8 Observation Cycles (June 03 to August 26, 2026).</li>
              <li>• <strong className="text-white">Observation Interval:</strong> 12-day orbital repeat (Consistent Geometry).</li>
              <li>• <strong className="text-white">Evaluated Corridor:</strong> 9.152 km² active floodway corridor (91.09°E–91.12°E, 26.63°N–26.66°N).</li>
              <li>• <strong className="text-white">Algorithm:</strong> Decibel log-ratio subtraction: Δγ° = 10 log₁₀(γ°_evt / γ°_base) &lt; -4.50 dB.</li>
              <li>• <strong className="text-white">Verified Result:</strong> Water expanded from 1.660 km² to 3.997 km² (<span className="px-2 py-0.5 rounded card-highlight text-[#fca311] font-mono font-bold inline-block">+140.77% water increase</span>).</li>
              <li>• <strong className="text-white">Attribution Guardrail:</strong> The +140.77% water increase applies strictly to this corridor.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mathematical Algorithms Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-outer rounded p-6 space-y-3 text-xs">
          <h4 className="font-editorial font-semibold text-white text-base">
            1. Adaptive Otsu Thresholding
          </h4>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            Microwave radar backscatter over a mixed landscape forms a bimodal histogram: dark specular water and bright diffuse land. Otsu's algorithm maximizes the inter-class variance between the two distributions:
          </p>
          <div className="p-3 rounded box-inner font-mono text-xs text-[#fca311] text-center">
            σ_B²(t) = ω₀(t) · ω₁(t) · [μ₀(t) - μ₁(t)]²
          </div>
          <p className="text-[#e5e5e5]/60 font-mono text-[11px]">
            Optimal threshold found for Majuli: <strong className="text-white">-15.0 dB</strong> (Water mean: -18.63 dB, Land mean: -8.91 dB, Separation: 9.72 dB).
          </p>
        </div>

        <div className="card-outer rounded p-6 space-y-3 text-xs">
          <h4 className="font-editorial font-semibold text-white text-base">
            2. Lee Speckle Noise Filter
          </h4>
          <p className="text-[#e5e5e5]/80 font-sans leading-relaxed">
            Radar images suffer from granular multiplicative speckle noise caused by coherent interference. The adaptive Lee filter uses local spatial variance in a 3×3 moving window:
          </p>
          <div className="p-3 rounded box-inner font-mono text-xs text-[#fca311] text-center">
            W = (σ² - σ_noise²) / σ², &nbsp; Î = Ī + W(I - Ī)
          </div>
          <p className="text-[#e5e5e5]/60 font-mono text-[11px]">
            Smooth open water is filtered to eliminate false noise spikes, while sharp river bank edges maintain crisp boundaries.
          </p>
        </div>
      </div>

      {/* Scientific Limitations & Disclosures (Level 1 Card with Level 2 Inner Boxes) */}
      <div className="card-outer rounded p-6 space-y-4 text-xs">
        <h4 className="font-editorial font-semibold text-base text-white">
          Mandatory Scientific Disclosures
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-relaxed text-[#e5e5e5]/80 font-sans">
          <div className="p-3.5 rounded box-inner space-y-1">
            <strong className="text-white block font-semibold">• Single-Polarization Processing</strong>
            <p className="text-[#e5e5e5]/70 text-[11px]">Both operational analyses utilize single-pol HHHH backscatter. Cross-polarization (HVHV) volume scattering suppression was deferred.</p>
          </div>
          <div className="p-3.5 rounded box-inner space-y-1">
            <strong className="text-white block font-semibold">• Nominal ENL Baseline</strong>
            <p className="text-[#e5e5e5]/70 text-[11px]">Equivalent Number of Looks (ENL = 14.2) represents a literature nominal value for Level-2 GCOV, not an independently measured test-site value.</p>
          </div>
          <div className="p-3.5 rounded box-inner space-y-1">
            <strong className="text-white block font-semibold">• Observational Estimates</strong>
            <p className="text-[#e5e5e5]/70 text-[11px]">All classifications are remote-sensing estimates, not ground-truth surveys.</p>
          </div>
          <div className="p-3.5 rounded box-inner space-y-1">
            <strong className="text-white block font-semibold">• Event Observation vs Peak</strong>
            <p className="text-[#e5e5e5]/70 text-[11px]">The 09 July 2026 data captured an active flood event observation during the July monsoon, not verified as the absolute seasonal flood peak.</p>
          </div>
        </div>
      </div>

      {/* Official NISAR HDF5 Container Inspector */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-editorial font-bold text-white">
            NISAR Level-2 GCOV Container Hierarchy
          </h3>
          <p className="text-xs font-mono text-[#e5e5e5]/60 uppercase tracking-wider">
            Official CF-1.8 compliant HDF5 metadata tree and internal data layers
          </p>
        </div>
        <HDF5Inspector dateStr="2026-07-09" />
      </div>
    </div>
  );
}

