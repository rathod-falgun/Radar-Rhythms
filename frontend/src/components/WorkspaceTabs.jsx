import React from 'react';
import { Waves, TrendingUp, Map, Satellite, BookOpen, Sparkles } from 'lucide-react';

export default function WorkspaceTabs({ activeWorkspace, onSelectWorkspace }) {
  const tabs = [
    {
      id: 'majuli',
      title: 'Majuli: Water Detection',
      subtitle: 'Track 015 • Single-Pol HHHH (797.55 km² • 13,821 Polygons)',
      icon: Waves,
      accentColor: 'text-cyan-400',
      activeBg: 'bg-cyan-950/70 border-cyan-500 shadow-md shadow-cyan-500/20 text-white ring-1 ring-cyan-500/50',
      badge: 'Single-Date Extraction'
    },
    {
      id: 'barpeta',
      title: 'Barpeta: Flood Change',
      subtitle: 'Track 019 • 12-Day Interval (27 Jun vs 09 Jul: +140.77% Water Increase)',
      icon: TrendingUp,
      accentColor: 'text-rose-400',
      activeBg: 'bg-rose-950/70 border-rose-500 shadow-md shadow-rose-500/20 text-white ring-1 ring-rose-500/50',
      badge: '+140.77% Water Increase'
    },
    {
      id: 'overview',
      title: 'Basin Overview & Reaches',
      subtitle: 'Brahmaputra Valley Corridor • Multi-Reach Regional Risk Matrix',
      icon: Map,
      accentColor: 'text-blue-400',
      activeBg: 'bg-blue-950/70 border-blue-500 shadow-md shadow-blue-500/20 text-white ring-1 ring-blue-500/50',
      badge: 'Valley-Wide Scope'
    },
    {
      id: 'inspector',
      title: 'NISAR Product Inspector',
      subtitle: 'Level-2 GCOV HDF5 Data Architecture & STAC Granule Hierarchy',
      icon: Satellite,
      accentColor: 'text-purple-400',
      activeBg: 'bg-purple-950/70 border-purple-500 shadow-md shadow-purple-500/20 text-white ring-1 ring-purple-500/50',
      badge: 'Raw HDF5 Grids'
    },
    {
      id: 'methodology',
      title: 'Methodology & SAR Physics',
      subtitle: 'Specular Reflection, Dual-Pol/Single-Pol & Wavelength Simulator',
      icon: BookOpen,
      accentColor: 'text-emerald-400',
      activeBg: 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-500/20 text-white ring-1 ring-emerald-500/50',
      badge: 'Scientific Grounding'
    }
  ];

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-2 shadow-2xl">
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Scientific Study Workspaces (NASA Space Apps 2026)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Distinct Capabilities: Water Classification vs Multi-Date Change Detection
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectWorkspace(tab.id)}
              className={`text-left p-2.5 rounded-lg border transition-all relative group flex flex-col justify-between ${isActive
                  ? tab.activeBg
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 shrink-0 ${tab.accentColor}`} />
                  <span className="text-xs font-bold leading-tight">{tab.title}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ${isActive
                      ? 'bg-black/40 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                  {tab.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                {tab.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

