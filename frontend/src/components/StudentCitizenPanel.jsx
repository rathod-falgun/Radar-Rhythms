import React, { useState } from 'react';

export default function StudentCitizenPanel() {
  const [activeQuizAnswer, setActiveQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleQuizChoice = (idx) => {
    setActiveQuizAnswer(idx);
    setQuizSubmitted(true);
  };

  return (
    <div className="card-outer rounded p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-outer)]">
        <div>
          <h3 className="text-base font-editorial tracking-wide text-white flex items-center gap-2">
            Radar Principles & Scattering Mechanisms
            <span className="text-[10px] px-2 py-0.5 rounded box-inner text-[#fca311] font-mono uppercase tracking-widest font-medium">
              Physical Foundations
            </span>
          </h3>
          <p className="text-xs font-sans text-[#e5e5e5]/70">
            Synthetic Aperture Radar (SAR) electromagnetic interaction guide
          </p>
        </div>
      </div>

      {/* 3 Core Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Active Radar vs Optical */}
        <div className="box-inner rounded p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-[#fca311] font-mono mb-2 uppercase tracking-widest">
              Concept 01
            </div>
            <h4 className="text-sm font-editorial font-semibold text-white mb-2">Why Optical Cameras Fail in Monsoons</h4>
            <p className="text-xs font-sans text-[#e5e5e5]/70 leading-relaxed">
              Optical satellites require sunlight and cloudless skies. During Assam's monsoon, dense cloud cover completely hides the terrain.
              <strong className="text-white"> NISAR emits its own active microwave energy</strong>—penetrating clouds, rain, and darkness continuously.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-outer)] text-[10px] text-[#e5e5e5]/60 font-mono uppercase tracking-wider">
            All-weather 24/7 day-and-night sensing.
          </div>
        </div>

        {/* Card 2: Specular Reflection (Dark Water) */}
        <div className="box-inner rounded p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-[#fca311] font-mono mb-2 uppercase tracking-widest">
              Concept 02
            </div>
            <h4 className="text-sm font-editorial font-semibold text-white mb-2">Why Open Water Appears Pitch Black</h4>
            <p className="text-xs font-sans text-[#e5e5e5]/70 leading-relaxed">
              Calm open water behaves as an electromagnetic mirror. Transmitted radar pulses reflect <strong className="text-white">away from the antenna</strong> into space (specular scattering). Minimal backscatter returns, creating dark pixels.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-outer)] text-[10px] text-[#e5e5e5]/60 font-mono uppercase tracking-wider">
            Specular reflection = -18 dB to -25 dB return.
          </div>
        </div>

        {/* Card 3: Double-Bounce (Glowing Flooded Forest) */}
        <div className="box-inner rounded p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-[#fca311] font-mono mb-2 uppercase tracking-widest">
              Concept 03
            </div>
            <h4 className="text-sm font-editorial font-semibold text-white mb-2">Why Inundated Canopy Reflects Strongly</h4>
            <p className="text-xs font-sans text-[#e5e5e5]/70 leading-relaxed">
              When water inundates vegetation, it forms a dihedral corner reflector with vertical stalks and tree trunks. Microwaves bounce from water to trunk and return <strong className="text-white">directly to the receiver</strong>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-outer)] text-[10px] text-[#e5e5e5]/60 font-mono uppercase tracking-wider">
            Double-bounce = +2 dB to +6 dB backscatter surge.
          </div>
        </div>
      </div>

      {/* Interactive Micro-Quiz */}
      <div className="box-inner rounded p-5">
        <div className="text-white text-xs font-editorial font-semibold tracking-wide mb-1">
          Scattering Physics Verification Challenge
        </div>
        <p className="text-xs font-sans text-[#e5e5e5]/70 mb-4">
          If high monsoon winds generate steep waves across the open Brahmaputra River, how does the radar backscatter respond?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 0, text: 'A) The river becomes completely invisible to microwave radar.' },
            { id: 1, text: 'B) Rough surface waves cause Bragg scattering, reflecting energy back to look falsely bright.' },
            { id: 2, text: 'C) The antenna reception gain shuts off automatically.' }
          ].map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleQuizChoice(choice.id)}
              className={`p-3 rounded text-left text-xs font-sans transition-all border cursor-pointer ${
                activeQuizAnswer === choice.id
                  ? choice.id === 1
                    ? 'card-outer border-[#fca311] text-white font-medium'
                    : 'box-inner border-white/40 text-white font-medium'
                  : 'card-outer text-[#e5e5e5]/70 hover:text-white hover:border-[#fca311]/50'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {quizSubmitted && (
          <div className="mt-4 p-3.5 rounded text-xs leading-relaxed card-outer text-[#e5e5e5]">
            {activeQuizAnswer === 1 ? (
              <span>
                <strong className="text-[#fca311] font-mono uppercase tracking-wider">Correct! </strong> Wind-roughened water creates capillary and gravity waves that produce Bragg backscattering back to the sensor. This is precisely why multi-temporal repeat-pass baseline comparison is scientifically mandatory over naive single-scene dark-pixel thresholding.
              </span>
            ) : (
              <span>
                <strong className="text-white font-mono uppercase tracking-wider">Re-evaluate: </strong> Wind generates capillary waves matching microwave wavelengths, triggering Bragg scattering back to the sensor and making water appear falsely bright. This proves why rigorous multi-temporal baseline change detection is required.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
