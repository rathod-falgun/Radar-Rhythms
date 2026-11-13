import React from 'react';
import { ShieldAlert, Microscope, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { playRadarPing } from '../utils/audio';

export default function PersonaSwitcher({
  currentPersona,
  onSelectPersona,
  soundEnabled,
  onToggleSound
}) {
  const personas = [
    {
      id: 'disaster',
      label: 'Emergency Disaster Responder',
      badge: 'ASDMA / NDRF',
      icon: ShieldAlert,
      color: 'text-rose-400',
      activeBg: 'bg-rose-950/80 border-rose-600 text-white shadow-rose-900/40',
      description: 'Hazard alerts, animal corridors, inundated highways & relief actions'
    },
    {
      id: 'scientist',
      label: 'Remote Sensing Scientist',
      badge: 'NISAR Team',
      icon: Microscope,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-950/80 border-cyan-600 text-white shadow-cyan-900/40',
      description: 'Radar backscatter distributions, Otsu bimodal curves & HDF5 inspection'
    },
    {
      id: 'student',
      label: 'Student & Citizen Explorer',
      badge: 'Public Science',
      icon: BookOpen,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-950/80 border-indigo-600 text-white shadow-indigo-900/40',
      description: 'Plain-language physics guide, interactive quiz & visual stories'
    }
  ];

  const handleSelect = (id) => {
    onSelectPersona(id);
    playRadarPing(id === 'disaster' ? 350 : id === 'scientist' ? 660 : 880);
  };

  return (
    <div className="bg-[#0b101b]/95 border border-slate-800/80 rounded-xl p-2.5 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 pl-2 hidden sm:inline">
          View Mode:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {personas.map((p) => {
            const Icon = p.icon;
            const isActive = currentPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? `${p.activeBg} shadow-md`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title={p.description}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? p.color : 'text-slate-400'}`} />
                <span>{p.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Radar Sonification Toggle */}
      <div className="flex items-center gap-2 pr-1">
        <button
          onClick={onToggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
            soundEnabled
              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
              : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:text-slate-300'
          }`}
          title="Toggle synthetic radar frequency sonification"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[11px]">Sonar Audio ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Audio Muted</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

