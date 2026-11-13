import React, { useState } from 'react';
import { Waves, Sparkles, ShieldCheck, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { playRadarPing } from '../utils/audio';

export default function WavelengthSimulator() {
  const [activeBand, setActiveBand] = useState('L'); // 'L', 'S', 'C'

  const bands = [
    {
      id: 'L',
      name: 'NISAR L-band',
      wavelength: '24.0 cm',
      frequency: '1.25 GHz',
      agency: 'NASA',
      canopyPenetration: 'Full Canopy Penetration',
      subCanopyFloodDetection: 'Excellent (Double-Bounce)',
      color: '#059669', // Emerald
      radarReturn: '+3.5 dB (dihedral specular reflection)',
      summary: 'Long microwave penetrates tree crowns and elephant grass down to standing floodwaters, bouncing off vertical trunks back to the sensor.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 250 180 L 320 180 L 390 20', color: '#059669' }
      ]
    },
    {
      id: 'S',
      name: 'NISAR S-band',
      wavelength: '9.3 cm',
      frequency: '3.20 GHz',
      agency: 'ISRO',
      canopyPenetration: 'Moderate Penetration',
      subCanopyFloodDetection: 'Good (Wetlands & Margins)',
      color: '#0284c7', // Sky Blue
      radarReturn: '-4.2 dB (diffuse + boundary reflection)',
      summary: 'Intermediate wavelength sensitive to surface roughness, soil moisture, and emergent vegetation along sandbars (chars) and river margins.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 220 120 L 280 40', color: '#0284c7' }
      ]
    },
    {
      id: 'C',
      name: 'Sentinel-1 C-band',
      wavelength: '5.6 cm',
      frequency: '5.40 GHz',
      agency: 'ESA',
      canopyPenetration: 'Surface Canopy Only',
      subCanopyFloodDetection: 'Blinded (Leaves Block Signal)',
      color: '#d97706', // Amber
      radarReturn: '-11.0 dB (volume scattering from upper leaves)',
      summary: 'Short microwave scatters mostly off top foliage. Cannot reach water beneath dense Kaziranga canopy, resulting in false negatives.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 180 80 L 240 20', color: '#d97706' }
      ]
    }
  ];

  const current = bands.find((b) => b.id === activeBand);

  const handleSelectBand = (id) => {
    setActiveBand(id);
    playRadarPing(id === 'L' ? 440 : id === 'S' ? 660 : 880);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Dancing with the SARs: Microwave Penetration Physics
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono border border-emerald-200">
                L vs S vs C Band
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive canopy penetration cross-section modeled for Assam's riverine wetlands
            </p>
          </div>
        </div>

        {/* Band Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {bands.map((band) => (
            <button
              key={band.id}
              onClick={() => handleSelectBand(band.id)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeBand === band.id
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: band.color }}
              ></span>
              {band.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Interactive Physics Cross-Section SVG Diagram */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-700 rounded-xl p-3 relative overflow-hidden shadow-inner">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
            <span>MICROWAVE RADAR INTERACTION PROFILE</span>
            <span style={{ color: current.color }}>λ = {current.wavelength} ({current.frequency})</span>
          </div>

          <svg viewBox="0 0 500 240" className="w-full h-auto select-none">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width="500" height="190" fill="url(#skyGrad)" />

            {/* Cloud Layer (Showing optical blindness) */}
            <ellipse cx="250" cy="35" rx="160" ry="18" fill="#475569" opacity="0.45" />
            <text x="250" y="38" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
              ☁️ South Asian Monsoon Cloud Deck (100% Optical Occlusion)
            </text>

            {/* Submerged Forest Floor / Flood Water */}
            <rect x="0" y="190" width="500" height="30" fill="url(#waterGrad)" />
            <rect x="0" y="220" width="500" height="20" fill="url(#groundGrad)" />

            {/* Tree Canopies & Trunks */}
            <rect x="180" y="120" width="14" height="70" fill="#78350f" />
            <circle cx="187" cy="110" r="32" fill="#15803d" opacity="0.85" />
            <circle cx="170" cy="115" r="24" fill="#166534" opacity="0.9" />

            <rect x="300" y="100" width="16" height="90" fill="#78350f" />
            <circle cx="308" cy="85" r="40" fill="#15803d" opacity="0.85" />
            <circle cx="330" cy="95" r="28" fill="#166534" opacity="0.9" />

            {/* Water label */}
            <text x="50" y="210" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Standing Floodwater (Specular Reflector)
            </text>

            {/* Dynamic Radar Pulse Ray */}
            {current.rayPaths.map((ray, idx) => (
              <path
                key={idx}
                d={ray.d}
                fill="none"
                stroke={ray.color}
                strokeWidth="3.5"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            ))}

            {/* Satellite Icon & Beam Source */}
            <g transform="translate(70, 10)">
              <rect x="0" y="0" width="30" height="15" fill="#38bdf8" rx="2" />
              <line x1="-15" y1="7" x2="0" y2="7" stroke="#94a3b8" strokeWidth="2" />
              <line x1="30" y1="7" x2="45" y2="7" stroke="#94a3b8" strokeWidth="2" />
              <text x="15" y="25" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
                NISAR
              </text>
            </g>
          </svg>
        </div>

        {/* Physics Explanations Card */}
        <div className="lg:col-span-5 space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900 text-sm">{current.name}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: current.color }}
              >
                {current.agency}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed mt-1">
              {current.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Canopy Penetration:</span>
              <strong className="text-slate-900">{current.canopyPenetration}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Sub-Canopy Flood:</span>
              <strong className="text-slate-900">{current.subCanopyFloodDetection}</strong>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
            <strong>Why it matters for NASA Space Apps:</strong> During the monsoon, dense elephant grass and jungle canopies hide vast floodwaters from optical and short-wave radar. NISAR's 24 cm L-band wave easily penetrates this canopy, creating a double-bounce return that reveals submerged ground.
          </div>
        </div>
      </div>
    </div>
  );
}
