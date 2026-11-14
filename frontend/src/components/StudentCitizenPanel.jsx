import React, { useState } from 'react';
import { playRadarPing } from '../utils/audio';

export default function StudentCitizenPanel() {
  const [activeQuizAnswer, setActiveQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleQuizChoice = (idx) => {
    setActiveQuizAnswer(idx);
    setQuizSubmitted(true);
    playRadarPing(idx === 1 ? 880 : 330);
  };

  return (
    <div className="bg-[#1a1f3d] border border-[#587ebb]/40 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Citizen Science & Student Discovery Guide
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#222950] text-[#87b8e8] font-mono border border-[#3b4a8c] font-medium">
              How Radar Sees Earth
            </span>
          </h3>
          <p className="text-xs text-[#87b8e8]">
            Interactive guide to understanding Synthetic Aperture Radar (SAR) physics
          </p>
        </div>
      </div>

      {/* 3 Core Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Active Radar vs Optical */}
        <div className="bg-[#222950] border border-[#3b4a8c]/60 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#87b8e8] font-mono mb-1.5 font-bold">
              CONCEPT 01
            </div>
            <h4 className="text-sm font-semibold text-white mb-1.5">Why Optical Cameras Fail in Monsoons</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Optical satellites (like cameras on Landsat or Google Maps) need sunlight and clear skies.
              During Assam's monsoon, thick rainclouds completely hide the ground.
              <strong className="text-white"> NISAR carries its own microwave source</strong>—transmitting radar pulses that pass directly through clouds, rain, and nighttime darkness.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3b4a8c]/50 text-[11px] text-[#87b8e8] font-mono font-medium">
            Radar operates 24/7, cloud-free.
          </div>
        </div>

        {/* Card 2: Specular Reflection (Dark Water) */}
        <div className="bg-[#222950] border border-[#3b4a8c]/60 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#87b8e8] font-mono mb-1.5 font-bold">
              CONCEPT 02
            </div>
            <h4 className="text-sm font-semibold text-white mb-1.5">Why Calm Floodwater Looks Pitch Black</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When radar sends microwaves down onto open, calm water, the water surface acts like a flat mirror.
              The waves reflect <strong className="text-white">away from the satellite</strong> into space (specular scattering).
              Because virtually zero energy returns, water registers as deep, dark black pixels.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3b4a8c]/50 text-[11px] text-[#87b8e8] font-mono font-medium">
            Mirror reflection = Dark pixel (-18 dB to -25 dB).
          </div>
        </div>

        {/* Card 3: Double-Bounce (Glowing Flooded Forest) */}
        <div className="bg-[#222950] border border-[#3b4a8c]/60 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#87b8e8] font-mono mb-1.5 font-bold">
              CONCEPT 03
            </div>
            <h4 className="text-sm font-semibold text-white mb-1.5">Why Flooded Vegetation Reflects Strongly</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When water inundates vegetation, it forms a right-angle corner reflector with vertical stems and trunks.
              The microwave beam hits the water, bounces into the trunk, and reflects <strong className="text-white">directly back to the satellite</strong>.
              This creates a double-bounce backscatter surge (+3 to +6 dB).
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3b4a8c]/50 text-[11px] text-[#c6e9f1] font-mono font-medium">
            Double-bounce = Bright return (+2 dB to +6 dB).
          </div>
        </div>
      </div>

      {/* Interactive Micro-Quiz */}
      <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-4">
        <div className="text-white text-xs font-semibold mb-1.5">
          Knowledge Check: Radar Interaction Challenge Question
        </div>
        <p className="text-xs text-slate-200 mb-3">
          If strong winds create 30 cm waves on the Brahmaputra River during a storm, what will happen to the radar image?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 0, text: 'A) The water will turn completely invisible' },
            { id: 1, text: 'B) Rough waves will scatter energy back, making water look brighter (Bragg scattering)' },
            { id: 2, text: 'C) The satellite will turn off its antenna automatically' }
          ].map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleQuizChoice(choice.id)}
              className={`p-2.5 rounded-md text-left text-xs transition-all border cursor-pointer ${
                activeQuizAnswer === choice.id
                  ? choice.id === 1
                    ? 'bg-emerald-950/80 border-emerald-500 text-white font-medium'
                    : 'bg-rose-950/80 border-rose-500 text-white font-medium'
                  : 'bg-[#1a1f3d] border-[#3b4a8c] text-slate-300 hover:text-white hover:border-[#87b8e8]'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {quizSubmitted && (
          <div className={`mt-3 p-3 rounded-md text-xs leading-relaxed border ${
            activeQuizAnswer === 1
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}>
            {activeQuizAnswer === 1 ? (
              <span>
                <strong>Correct!</strong> Wind-roughened water creates surface capillary waves that scatter radar pulses back (Bragg scattering). This is why multi-temporal baseline comparison is superior to naive single-threshold dark pixel masking.
              </span>
            ) : (
              <span>
                <strong>Not quite!</strong> Wind creates surface waves that cause diffuse Bragg scattering back to the satellite, making windy water appear falsely bright. This is why multi-temporal baseline comparison is essential.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
