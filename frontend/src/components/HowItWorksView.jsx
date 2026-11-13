import React from 'react';
import WavelengthSimulator from './WavelengthSimulator';
import StudentCitizenPanel from './StudentCitizenPanel';
import { Sparkles, Eye, CloudRain, Sun, Compass } from 'lucide-react';

export default function HowItWorksView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur border border-white/30 inline-block mb-3">
            Microwave Radar Remote Sensing Explained
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            How Radar Sees What Cameras Cannot
          </h2>
          <p className="text-sm text-sky-100 leading-relaxed">
            During the South Asian monsoon, thick cloud decks completely block optical satellite cameras. 
            Discover how the NASA–ISRO NISAR satellite transmits active microwave radio pulses that cut through 
            clouds, rain, and nighttime darkness to reveal floodwaters on the ground.
          </p>
        </div>
      </div>

      {/* Interactive Ray-Tracer Simulator */}
      <WavelengthSimulator />

      {/* Plain Language Educational Cards & Quiz */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          Interactive Learning & Knowledge Check
        </h3>
        <StudentCitizenPanel />
      </div>
    </div>
  );
}

