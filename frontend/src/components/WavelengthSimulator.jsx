import React, { useState } from 'react';
import { Waves, Sparkles, ShieldCheck, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

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
      subCanopyFloodDetection: 'High Sensitivity (Double-Bounce)',
      color: '#fca311', // Night-Pass Orange
      radarReturn: '+3.5 dB (dihedral specular reflection)',
      summary: 'Long 24 cm microwave penetrates tree crowns and elephant grass down to standing floodwaters, reflecting off vertical trunks back to the sensor.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 250 180 L 320 180 L 390 20', color: '#fca311' }
      ]
    },
    {
      id: 'S',
      name: 'NISAR S-band',
      wavelength: '9.3 cm',
      frequency: '3.20 GHz',
      agency: 'ISRO',
      canopyPenetration: 'Moderate Penetration',
      subCanopyFloodDetection: 'Moderate (Wetlands & Margins)',
      color: '#e5e5e5', // Alabaster
      radarReturn: '-4.2 dB (diffuse + boundary reflection)',
      summary: 'Intermediate wavelength sensitive to surface roughness, soil moisture, and emergent vegetation along sandbars (chars) and river margins.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 220 120 L 280 40', color: '#e5e5e5' }
      ]
    },
    {
      id: 'C',
      name: 'Sentinel-1 C-band',
      wavelength: '5.6 cm',
      frequency: '5.40 GHz',
      agency: 'ESA Reference',
      canopyPenetration: 'Surface Canopy Only',
      subCanopyFloodDetection: 'Attenuated (Foliage Scatter)',
      color: '#737373', // Dim Alabaster
      radarReturn: '-11.0 dB (volume scattering from upper leaves)',
      summary: 'Short microwave scatters mostly off top foliage. Cannot reach water beneath dense Kaziranga canopy, resulting in surface false negatives.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 180 80 L 240 20', color: '#737373' }
      ]
    }
  ];

  const current = bands.find((b) => b.id === activeBand);

  const handleSelectBand = (id) => {
    setActiveBand(id);
  };

  return (
    <div className="card-outer rounded p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-outer)]">
        <div>
          <h3 className="text-base font-editorial tracking-wide text-white flex items-center gap-2">
            Microwave Penetration Physics
            <span className="text-xs px-2.5 py-0.5 rounded box-inner text-[#fca311] font-mono uppercase tracking-widest font-semibold">
              L vs S vs C Band
            </span>
          </h3>
          <p className="text-xs font-sans text-[#e5e5e5]/70 mt-0.5">
            Canopy penetration cross-section modeled for the Brahmaputra River corridor
          </p>
        </div>

        {/* Band Selector Tabs */}
        <div className="flex items-center gap-1.5 box-inner p-1 rounded text-xs font-mono uppercase tracking-wider">
          {bands.map((band) => (
            <button
              key={band.id}
              onClick={() => handleSelectBand(band.id)}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
                activeBand === band.id
                  ? 'bg-[#fca311] text-black font-semibold'
                  : 'text-[#e5e5e5]/70 hover:text-white'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeBand === band.id ? '#000000' : band.color }}
              ></span>
              {band.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Interactive Physics Cross-Section SVG Diagram */}
        <div className="lg:col-span-7 box-inner rounded p-4 relative overflow-hidden">
          <div className="text-xs font-mono uppercase tracking-widest text-[#e5e5e5]/70 mb-2 flex items-center justify-between">
            <span>Radar Microwave Interaction Profile</span>
            <span style={{ color: current.color }} className="font-semibold">λ = {current.wavelength} ({current.frequency})</span>
          </div>

          <svg viewBox="0 0 500 240" className="w-full h-auto select-none">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="100%" stopColor="#0a1020" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14213d" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0a1020" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width="500" height="190" fill="url(#skyGrad)" />

            {/* Cloud Deck */}
            <ellipse cx="250" cy="35" rx="160" ry="16" fill="#1f2937" opacity="0.6" />
            <text x="250" y="39" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace" letterSpacing="1">
              MONSOON CLOUD DECK (OPTICAL SENSORS OCCLUDED)
            </text>

            {/* Submerged Forest Floor / Flood Water */}
            <rect x="0" y="190" width="500" height="30" fill="url(#waterGrad)" />
            <rect x="0" y="220" width="500" height="20" fill="#000000" />
            <line x1="0" y1="190" x2="500" y2="190" stroke="#fca311" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="0" y1="220" x2="500" y2="220" stroke="#e5e5e5" strokeWidth="1" strokeOpacity="0.2" />

            {/* Tree Canopies & Trunks */}
            <rect x="180" y="120" width="12" height="70" fill="#3b2d1d" />
            <circle cx="186" cy="110" r="30" fill="#0d2618" stroke="#164e2e" strokeWidth="1" />
            <circle cx="172" cy="115" r="22" fill="#0d2618" stroke="#164e2e" strokeWidth="1" />

            <rect x="300" y="100" width="14" height="90" fill="#3b2d1d" />
            <circle cx="307" cy="85" r="38" fill="#0d2618" stroke="#164e2e" strokeWidth="1" />
            <circle cx="328" cy="95" r="26" fill="#0d2618" stroke="#164e2e" strokeWidth="1" />

            {/* Water label */}
            <text x="30" y="210" fill="#e5e5e5" fontSize="10" fontFamily="monospace" letterSpacing="1">
              STANDING WATER (SPECULAR SCATTERING)
            </text>

            {/* Dynamic Radar Pulse Ray */}
            {current.rayPaths.map((ray, idx) => (
              <path
                key={idx}
                d={ray.d}
                fill="none"
                stroke={ray.color}
                strokeWidth="3"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            ))}

            {/* Satellite Icon & Beam Source */}
            <g transform="translate(70, 10)">
              <rect x="0" y="0" width="28" height="14" fill="#14213d" stroke="#fca311" strokeWidth="1" rx="2" />
              <line x1="-12" y1="7" x2="0" y2="7" stroke="#e5e5e5" strokeWidth="1.5" />
              <line x1="28" y1="7" x2="40" y2="7" stroke="#e5e5e5" strokeWidth="1.5" />
              <text x="14" y="24" fill="#fca311" fontSize="8" textAnchor="middle" fontFamily="monospace">
                NISAR
              </text>
            </g>
          </svg>
        </div>

        {/* Physics Explanations Card */}
        <div className="lg:col-span-5 space-y-3 text-xs">
          <div className="p-4 rounded box-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-editorial font-semibold text-white text-base">{current.name}</span>
              <span
                className="px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider font-semibold text-black"
                style={{ backgroundColor: current.color }}
              >
                {current.agency}
              </span>
            </div>
            <p className="text-[#e5e5e5]/80 font-sans leading-relaxed mt-1 text-xs">
              {current.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-3 rounded box-inner">
              <span className="text-[#e5e5e5]/50 uppercase tracking-wider block mb-1">Canopy Penetration:</span>
              <strong className="text-white text-xs">{current.canopyPenetration}</strong>
            </div>
            <div className="p-3 rounded box-inner">
              <span className="text-[#e5e5e5]/50 uppercase tracking-wider block mb-1">Sub-Canopy Flood:</span>
              <strong className="text-white text-xs">{current.subCanopyFloodDetection}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded box-inner text-[#e5e5e5]/80 text-xs leading-relaxed font-sans">
            <strong className="text-[#fca311] font-mono uppercase tracking-wider text-[11px] block mb-1">Hydrological Impact:</strong>
            During monsoon crests, dense grass and jungle canopies obscure inundated terrain from optical sensors. NISAR's 24 cm L-band wave penetrates this canopy, creating a double-bounce return that maps submerged ground.
          </div>
        </div>
      </div>
    </div>
  );
}
