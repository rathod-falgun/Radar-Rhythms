import React from 'react';
import WavelengthSimulator from './WavelengthSimulator';
import StudentCitizenPanel from './StudentCitizenPanel';
import { Sparkles, Eye, CloudRain, Sun, Compass } from 'lucide-react';

export default function HowItWorksView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-midnight text-white rounded-xl border border-indigo p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md bg-indigo text-aqua border border-dusk inline-block mb-3 font-mono">
            Microwave Radar Remote Sensing Explained
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">
            How Radar Sees What Cameras Cannot
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            During the South Asian monsoon, thick cloud decks completely block optical satellite cameras. 
            Discover how the NASA–ISRO NISAR satellite transmits active microwave radio pulses that cut through 
            clouds, rain, and nighttime darkness to reveal floodwaters on the ground.
          </p>
        </div>
      </div>

      {/* Interactive Ray-Tracer Simulator */}
      <WavelengthSimulator />

      {/* Plain Language Educational Cards & Quiz */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-xs">
        <h3 className="text-base font-semibold text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal" />
          Interactive Learning & Knowledge Check
        </h3>
        <StudentCitizenPanel />
      </div>
    </div>
  );
}

