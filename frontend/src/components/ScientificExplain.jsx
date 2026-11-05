import React, { useState } from 'react';
import { BookOpen, Radio, AlertOctagon, HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function ScientificExplain({ explanation, parameters }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!explanation) return null;

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            5. Scientific Explanation & Hydrological Assessment
          </h3>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 text-xs text-slate-300">
          {/* Situation Summary */}
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Event Hydrological Summary
            </h4>
            <p className="leading-relaxed text-slate-200">{explanation.summary}</p>
          </div>

          {/* Physical & Meteorological Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Physical & Environmental Drivers
              </h5>
              <ul className="space-y-1.5">
                {explanation.physical_drivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Radar Scattering Physics */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                Radar Physics & Backscatter Transformation
              </h5>
              <p className="leading-relaxed text-slate-300 mb-2">
                {explanation.radar_signature_analysis}
              </p>
              {parameters && (
                <div className="pt-2 border-t border-slate-800 font-mono text-[11px] text-slate-400 space-y-0.5">
                  <div>Polarization: {parameters.polarization}</div>
                  <div>Resolution: {parameters.grid_resolution_m} m pixel posting</div>
                  <div>Level: {parameters.processing_level}</div>
                </div>
              )}
            </div>
          </div>

          {/* Scientific Limitations & Uncertainties */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3">
            <h5 className="font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
              Scientific Limitations & Operational Uncertainties (Section 6 Compliance)
            </h5>
            <ul className="space-y-1 text-slate-300">
              {explanation.scientific_limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

