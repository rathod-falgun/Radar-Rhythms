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
      color: '#10b981', // Emerald
      radarReturn: '+3.5 dB (dihedral specular reflection)',
      summary: 'Long microwave penetrates tree crowns and elephant grass down to standing floodwaters, bouncing off vertical trunks back to the sensor.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 250 180 L 320 180 L 390 20', color: '#10b981' }
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
      color: '#00d2ff', // Cyan
      radarReturn: '-4.2 dB (diffuse + boundary reflection)',
      summary: 'Intermediate wavelength sensitive to surface roughness, soil moisture, and emergent vegetation along sandbars (chars) and river margins.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 220 120 L 280 40', color: '#00d2ff' }
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
      color: '#f59e0b', // Amber
      radarReturn: '-11.0 dB (volume scattering from upper leaves)',
      summary: 'Short microwave scatters mostly off top foliage. Cannot reach water beneath dense Kaziranga canopy, resulting in false negatives.',
      rayPaths: [
        { type: 'primary', d: 'M 100 20 L 180 80 L 240 20', color: '#f59e0b' }
      ]
    }
  ];

  const current = bands.find((b) => b.id === activeBand);

  const handleSelectBand = (id) => {
    setActiveBand(id);
    playRadarPing(id === 'L' ? 440 : id === 'S' ? 660 : 880);
  };

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Dancing with the SARs: Microwave Penetration Physics
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
                L vs S vs C Band
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive canopy penetration cross-section modeled for Kaziranga wetlands
            </p>
          </div>
        </div>

        {/* Band Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {bands.map((band) => (
            <button
              key={band.id}
              onClick={() => handleSelectBand(band.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeBand === band.id
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                borderColor: activeBand === band.id ? band.color : 'transparent'
              }}
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
        <div className="lg:col-span-7 bg-[#090d16] border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
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
            {/* Tree 1 */}
            <rect x="180" y="120" width="14" height="70" fill="#78350f" />
            <circle cx="187" cy="110" r="32" fill="#15803d" opacity="0.85" />
            <circle cx="170" cy="115" r="24" fill="#166534" opacity="0.9" />

            {/* Tree 2 (Central Double Bounce site) */}
            <rect x="290" y="110" width="18" height="80" fill="#78350f" />
            <circle cx="299" cy="95" r="38" fill="#16a34a" opacity="0.85" />
            <circle cx="320" cy="105" r="28" fill="#15803d" opacity="0.9" />

            {/* Tall Elephant Grass (Kaziranga habitat) */}
            <path d="M 380 190 Q 385 140 395 130" stroke="#84cc16" strokeWidth="3" fill="none" />
            <path d="M 390 190 Q 395 145 405 135" stroke="#65a30d" strokeWidth="2.5" fill="none" />
            <path d="M 400 190 Q 408 150 415 140" stroke="#84cc16" strokeWidth="3" fill="none" />
            <path d="M 120 190 Q 125 150 135 140" stroke="#84cc16" strokeWidth="2.5" fill="none" />

            {/* Labels */}
            <text x="20" y="208" fill="#bae6fd" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              🌊 Standing Floodwater
            </text>
            <text x="20" y="233" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
              Alluvial Bedrock
            </text>
            <text x="350" y="125" fill="#a3e635" fontSize="9" fontFamily="sans-serif">
              Kaziranga Tall Grass & Forest
            </text>

            {/* Satellite Source Indicator */}
            <circle cx="60" cy="20" r="8" fill={current.color} />
            <text x="75" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              {current.name} Transmitter
            </text>

            {/* Microwave Ray Simulation */}
            {activeBand === 'L' && (
              <g>
                {/* Incoming wave down to water surface */}
                <path
                  d="M 60 20 L 260 190"
                  stroke={current.color}
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
                {/* Dihedral bounce off tree trunk */}
                <path
                  d="M 260 190 L 290 150"
                  stroke={current.color}
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                />
                {/* Backscatter return to orbit */}
                <path
                  d="M 290 150 L 450 20"
                  stroke={current.color}
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                />
                <circle cx="260" cy="190" r="5" fill="#facc15" />
                <circle cx="290" cy="150" r="5" fill="#facc15" />
                <text x="250" y="175" fill="#facc15" fontSize="10" fontWeight="bold">
                  💥 Double-Bounce
                </text>
              </g>
            )}

            {activeBand === 'S' && (
              <g>
                {/* S-band partial canopy penetration */}
                <path
                  d="M 60 20 L 210 145"
                  stroke={current.color}
                  strokeWidth="2.5"
                  strokeDasharray="5,3"
                />
                <path
                  d="M 210 145 L 340 30"
                  stroke={current.color}
                  strokeWidth="2.5"
                  strokeDasharray="5,3"
                />
                <circle cx="210" cy="145" r="4" fill="#00d2ff" />
                <text x="215" y="140" fill="#00d2ff" fontSize="10" fontWeight="bold">
                  🌿 Mid-Canopy Return
                </text>
              </g>
            )}

            {activeBand === 'C' && (
              <g>
                {/* C-band blocked by top foliage */}
                <path
                  d="M 60 20 L 170 85"
                  stroke={current.color}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
                <path
                  d="M 170 85 L 260 25"
                  stroke={current.color}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
                <circle cx="170" cy="85" r="4" fill="#f59e0b" />
                <text x="180" y="80" fill="#f59e0b" fontSize="10" fontWeight="bold">
                  🍃 Surface Foliage Scattering (Sub-canopy Missed!)
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Physics Specs & Real-World Implication */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Canopy Penetration:</span>
              <span className="font-semibold text-white">{current.canopyPenetration}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Sub-Canopy Water Detection:</span>
              <span
                className="font-semibold"
                style={{ color: current.color }}
              >
                {current.subCanopyFloodDetection}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Observed Backscatter:</span>
              <span className="font-mono text-xs text-slate-200">{current.radarReturn}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
            {current.summary}
          </p>

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Takeaway:</strong> NISAR's dual L-band & S-band payloads make it the first Earth-observing mission purpose-built to solve both broad-scale open-water delimitation and hidden flooded-canopy detection in one single satellite pass.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
