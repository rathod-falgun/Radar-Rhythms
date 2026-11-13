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
    <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center text-teal">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              Citizen Science & Student Discovery Guide
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo text-aqua font-mono font-medium">
                How Radar Sees Earth
              </span>
            </h3>
            <p className="text-xs text-muted">
              Interactive physics guide to understanding Synthetic Aperture Radar (SAR)
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Active Radar vs Optical */}
        <div className="bg-subtle border border-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-teal font-mono mb-2">
              <span>CONCEPT 01</span>
              <CloudRain className="w-4 h-4 text-teal" />
            </div>
            <h4 className="text-sm font-semibold text-primary mb-2">Why Optical Cameras Fail in Monsoons</h4>
            <p className="text-xs text-body leading-relaxed">
              Optical satellites (like cameras on Landsat or Google Maps) need sunlight and clear skies.
              During Assam's monsoon, thick rainclouds completely hide the ground.
              <strong> NISAR brings its own "flashlight"</strong>—transmitting microwaves that pass right through clouds, smoke, and darkness!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border text-[11px] text-primary font-mono font-medium">
            Key Rule: Radar sees 24/7, rain or shine.
          </div>
        </div>

        {/* Card 2: Specular Reflection (Dark Water) */}
        <div className="bg-subtle border border-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-teal font-mono mb-2">
              <span>CONCEPT 02</span>
              <Eye className="w-4 h-4 text-teal" />
            </div>
            <h4 className="text-sm font-semibold text-primary mb-2">Why Calm Floodwater Looks Pitch Black</h4>
            <p className="text-xs text-body leading-relaxed">
              When radar sends microwaves down onto open, calm water, the water surface acts like a flat mirror.
              The waves reflect <strong>away from the satellite</strong> into outer space (specular scattering).
              Because virtually zero energy returns, water registers as deep, dark black pixels!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border text-[11px] text-primary font-mono font-medium">
            Key Rule: Mirror reflection = Dark pixel (-18 dB to -25 dB).
          </div>
        </div>

        {/* Card 3: Double-Bounce (Glowing Flooded Forest) */}
        <div className="bg-subtle border border-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-teal font-mono mb-2">
              <span>CONCEPT 03</span>
              <Sparkles className="w-4 h-4 text-teal" />
            </div>
            <h4 className="text-sm font-semibold text-primary mb-2">Why Flooded Forests Glow Bright Green</h4>
            <p className="text-xs text-body leading-relaxed">
              When water inundates the forest floor, it forms a 90° corner reflector with vertical tree trunks.
              The microwave beam hits the water, bounces into the tree trunk, and shoots <strong>directly back to the satellite</strong>!
              This creates a sudden surge of backscatter (+3 to +6 dB), glowing neon on our map.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border text-[11px] text-primary font-mono font-medium">
            Key Rule: Double-bounce = Bright pixel (+2 dB to +6 dB).
          </div>
        </div>
      </div>

      {/* Interactive Micro-Quiz */}
      <div className="bg-subtle border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2 text-primary text-xs font-semibold">
          <HelpCircle className="w-4 h-4 text-teal" />
          <span>Test Your Knowledge: Space Radar Challenge Question</span>
        </div>
        <p className="text-xs text-primary mb-3">
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
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                    : 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                  : 'bg-white border-border text-body hover:bg-cloud'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {quizSubmitted && (
          <div className={`mt-3 p-3 rounded-md text-xs leading-relaxed border ${
            activeQuizAnswer === 1
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
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
