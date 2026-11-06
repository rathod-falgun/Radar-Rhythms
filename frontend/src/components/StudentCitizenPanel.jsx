import React, { useState } from 'react';
import { BookOpen, Sparkles, HelpCircle, Check, ArrowRight, Eye, ShieldCheck, Sun, CloudRain } from 'lucide-react';
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
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/50">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Citizen Science & Student Discovery Guide
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-mono border border-indigo-800">
                How Radar Sees Earth
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive physics guide to understanding Synthetic Aperture Radar (SAR)
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Active Radar vs Optical */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-indigo-400 font-mono mb-2">
              <span>CONCEPT 01</span>
              <CloudRain className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Why Optical Cameras Fail in Monsoons</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Optical satellites (like cameras on Landsat or Google Maps) need sunlight and clear skies.
              During Assam's monsoon, thick rainclouds completely hide the ground.
              <strong> NISAR brings its own "flashlight"</strong>—transmitting microwaves that pass right through clouds, smoke, and darkness!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-cyan-300 font-mono">
            Key Rule: Radar sees 24/7, rain or shine.
          </div>
        </div>

        {/* Card 2: Specular Reflection (Dark Water) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono mb-2">
              <span>CONCEPT 02</span>
              <Eye className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Why Calm Floodwater Looks Pitch Black</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When radar sends microwaves down onto open, calm water, the water surface acts like a flat mirror.
              The waves reflect <strong>away from the satellite</strong> into outer space (specular scattering).
              Because virtually zero energy returns, water registers as deep, dark black pixels!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-cyan-300 font-mono">
            Key Rule: Mirror reflection = Dark pixel (-18 dB to -25 dB).
          </div>
        </div>

        {/* Card 3: Double-Bounce (Glowing Flooded Forest) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono mb-2">
              <span>CONCEPT 03</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Why Flooded Forests Glow Bright Green</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When water inundates the forest floor, it forms a 90° corner reflector with vertical tree trunks.
              The microwave beam hits the water, bounces into the tree trunk, and shoots <strong>directly back to the satellite</strong>!
              This creates a sudden surge of backscatter (+3 to +6 dB), glowing neon on our map.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-300 font-mono">
            Key Rule: Double-bounce = Bright pixel (+2 dB to +6 dB).
          </div>
        </div>
      </div>

      {/* Interactive Micro-Quiz */}
      <div className="bg-slate-900/90 border border-indigo-900/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold">
          <HelpCircle className="w-4 h-4" />
          <span>Test Your Knowledge: Space Radar Challenge Question</span>
        </div>
        <p className="text-xs text-white mb-3">
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
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                activeQuizAnswer === choice.id
                  ? choice.id === 1
                    ? 'bg-emerald-950/80 border-emerald-500 text-white font-medium'
                    : 'bg-rose-950/80 border-rose-500 text-white font-medium'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {quizSubmitted && (
          <div className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed ${
            activeQuizAnswer === 1
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}>
            {activeQuizAnswer === 1 ? (
              <span>
                🎉 <strong>Correct!</strong> Wind-roughened water creates surface capillary waves that scatter radar pulses back (Bragg scattering). This is why Section 6 of our scientific safeguards incorporates multi-temporal comparison rather than naive single-threshold dark pixel masking!
              </span>
            ) : (
              <span>
                ❌ <strong>Not quite!</strong> Wind creates surface waves that cause diffuse Bragg scattering back to the satellite, making windy water appear falsely bright. This is why multi-temporal baseline comparison is essential!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

