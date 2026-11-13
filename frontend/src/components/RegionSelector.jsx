import React from 'react';
import { MapPin, ShieldAlert, Navigation, Layers } from 'lucide-react';

export default function RegionSelector({ regions, selectedRegionId, onSelectRegion }) {
  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            1. Select Monitoring Reach (Brahmaputra Basin)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {selectedRegionId === 'majuli' ? 'NISAR Track 015 (Frame 3700)' : 'NISAR Track 019 (Frame 075)'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {regions.map((reg) => {
          const isSelected = reg.id === selectedRegionId;
          return (
            <button
              key={reg.id}
              onClick={() => onSelectRegion(reg.id)}
              className={`text-left p-3 rounded-lg border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span
                  className={`text-xs font-bold leading-tight ${
                    isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {reg.name.split('&')[0]}
                </span>
                <Navigation
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isSelected ? 'text-cyan-400 rotate-45' : 'text-slate-600'
                  }`}
                />
              </div>

              <div className="text-[11px] text-slate-400 truncate mb-1">{reg.district}</div>

              {reg.id === 'majuli' ? (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Verified NISAR Extraction
                  </span>
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-slate-500">Track 019 Model</div>
              )}

              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                <span className="text-slate-500 font-mono">{reg.area_km2} km²</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    reg.vulnerability.includes('Extreme')
                      ? 'bg-red-950/80 text-red-300 border border-red-900/60'
                      : reg.vulnerability.includes('Severe')
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-900/60'
                      : 'bg-blue-950/80 text-blue-300 border border-blue-900/60'
                  }`}
                >
                  {reg.vulnerability.split(' ')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

