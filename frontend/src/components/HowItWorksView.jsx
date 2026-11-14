import React from 'react';
import WavelengthSimulator from './WavelengthSimulator';
import StudentCitizenPanel from './StudentCitizenPanel';

/**
 * HowItWorksView
 * 
 * Concise, 4-step workflow explaining how radar observations are transformed
 * into accessible floodwater maps and change intelligence:
 * 1. Satellite Observation (Microwave radar penetration through clouds)
 * 2. Radar Calibration & Processing (RTC and speckle filtering)
 * 3. Water Classification & Comparison (Specular reflection thresholding)
 * 4. Accessible Flood Information (Interactive maps & GeoJSON exports)
 */
export default function HowItWorksView() {
  const workflowSteps = [
    {
      step: '01',
      title: 'Satellite Radar Observation',
      desc: 'The NASA–ISRO NISAR satellite transmits active microwave pulses (L-band 24 cm & S-band 9.3 cm) towards Earth. Unlike optical sensors, microwave pulses travel directly through dense monsoon clouds, heavy rainfall, and nighttime darkness to image the surface.',
      badge: 'All-Weather 24/7 Sensing'
    },
    {
      step: '02',
      title: 'Calibration & Geometric Correction',
      desc: 'Raw radar returns are calibrated using Radiometric Terrain Correction (RTC) to remove distortions caused by terrain slopes and orbital incidence angles. An enhanced Lee speckle filter suppresses radar grain while preserving sharp river boundaries.',
      badge: 'RTC & Speckle Filtering'
    },
    {
      step: '03',
      title: 'Water Classification & Comparison',
      desc: 'Calm water acts as a specular reflector, bouncing radar pulses away from the antenna to produce low backscatter (-18.6 dB) compared to rough land (-8.9 dB). Repeating passes on identical orbits enables pixel-by-pixel change detection.',
      badge: 'Specular Reflection & Otsu'
    },
    {
      step: '04',
      title: 'Accessible Spatial Intelligence',
      desc: 'Processed radar data is transformed into interactive maps, vector water boundaries, multi-date flood change metrics, and open-format GeoJSON/GeoTIFF datasets ready for researchers, planners, and response coordinators.',
      badge: 'Vector & Raster Outputs'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1a1f3d] via-[#222950] to-[#1a1f3d] text-[#c6e9f1] rounded-xl border border-[#587ebb]/40 p-6 sm:p-8 shadow-lg shadow-[#1a1f3d]/60 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c] inline-block font-mono">
            Radar Remote Sensing Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            How NISAR Radar Sees What Cameras Cannot
          </h2>
          <p className="text-sm text-[#c6e9f1] leading-relaxed">
            During the South Asian monsoon, persistent cloud cover blinds optical satellites. Here is how NASA–ISRO NISAR satellite radar observations are turned into understandable flood maps in four steps.
          </p>
        </div>
      </div>

      {/* 4-Step Plain Language Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowSteps.map((step) => {
          return (
            <div
              key={step.step}
              className="p-5 rounded-xl bg-[#1a1f3d] border border-[#587ebb]/40 shadow-md flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#222950] text-[#87b8e8] border border-[#3b4a8c]">
                    Step {step.step}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-[#3b4a8c]/50">
                <span className="text-[10px] font-mono text-[#87b8e8] font-medium block">
                  {step.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Microwave Simulator Section */}
      <WavelengthSimulator />

      {/* Educational Student & Citizen Section */}
      <StudentCitizenPanel />
    </div>
  );
}
