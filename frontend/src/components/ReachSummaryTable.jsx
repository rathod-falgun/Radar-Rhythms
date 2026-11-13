import React, { useState, useEffect } from 'react';
import { Table, Navigation, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function ReachSummaryTable({ selectedRegionId, onSelectRegion, baselineDate, eventDate }) {
  const [reaches, setReaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reaches/summary?baseline_date=${baselineDate || '2026-06-27'}&event_date=${eventDate || '2026-07-09'}`);
        const data = await res.json();
        setReaches(data);
      } catch (err) {
        console.error('Failed to fetch reaches summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [baselineDate, eventDate]);

  if (loading) {
    return (
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 text-xs text-slate-400 font-mono">
        Aggregating multi-reach flood damage statistics...
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Phase 6: Multi-Reach Regional Flood Risk & Inundation Matrix
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Track 019 / Frame 075 Valley Corridor (Calibrated Regional Reach Projections)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-900/50">
              <th className="py-2.5 px-3">Reach Name</th>
              <th className="py-2.5 px-3">District</th>
              <th className="py-2.5 px-3">Total Area</th>
              <th className="py-2.5 px-3">Newly Inundated</th>
              <th className="py-2.5 px-3">Flooded Canopy</th>
              <th className="py-2.5 px-3">Inundation %</th>
              <th className="py-2.5 px-3">Vulnerability</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {reaches.map((r) => {
              const isSelected = r.id === selectedRegionId;
              return (
                <tr
                  key={r.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-cyan-950/30 text-white' : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    {r.name.split('&')[0]}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{r.district}</td>
                  <td className="py-2.5 px-3 font-mono">{r.total_area_km2} km²</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                    {r.newly_inundated_km2} km²
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">
                    {r.flooded_vegetation_km2} km²
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        r.inundation_percent > 30
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : r.inundation_percent > 15
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {r.inundation_percent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                      {r.vulnerability}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectRegion(r.id)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ml-auto ${
                        isSelected
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

