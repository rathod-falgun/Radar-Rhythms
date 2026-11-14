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
    <div className="space-y-8 w-full">
      {/* Top Editorial Banner */}
      <div className="card-outer text-[#e5e5e5] rounded p-6 sm:p-10 relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded box-inner text-[#fca311] inline-block font-medium">
            Radar Sensing Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial tracking-tight text-white">
            How Radar Sees <span className="text-[#fca311] font-normal italic">What Cameras Cannot</span>
          </h2>
          <p className="text-sm sm:text-base text-[#e5e5e5]/80 font-sans leading-relaxed pt-1">
            During the South Asian monsoon, persistent cloud cover blinds optical satellites. The NASA–ISRO NISAR mission transmits active L-band microwaves that penetrate dense monsoon clouds, heavy rainfall, and nighttime darkness to image hydrological change.
          </p>
        </div>
      </div>

      {/* 4-Step Plain Language Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowSteps.map((step) => {
          return (
            <div
              key={step.step}
              className="p-5 rounded card-outer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-editorial font-bold text-white/40">
                    {step.step}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded box-inner text-[#fca311] font-semibold">
                    Stage {step.step}
                  </span>
                </div>

                <h3 className="text-base font-editorial font-semibold text-white leading-snug">
                  {step.title}
                </h3>

                <div className="p-3 rounded box-inner text-xs font-sans text-[#e5e5e5]/80 leading-relaxed">
                  {step.desc}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-outer)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#e5e5e5]/60 block">
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
