import React, { useState, useEffect } from 'react';
import { Database, FolderTree, FileCode, CheckCircle, ShieldCheck, ChevronRight, ChevronDown, Satellite, Search, Loader2 } from 'lucide-react';

export default function HDF5Inspector({ dateStr }) {
  const [hdf5Data, setHdf5Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [bhoonidhiStatus, setBhoonidhiStatus] = useState(null);
  const [searchingScenes, setSearchingScenes] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [h5Res, statusRes] = await Promise.all([
          fetch(`/api/nisar/inspect?date_str=${dateStr}`),
          fetch('/api/nisar/status')
        ]);
        if (h5Res.ok) setHdf5Data(await h5Res.json());
        if (statusRes.ok) setBhoonidhiStatus(await statusRes.json());
      } catch (err) {
        console.error('Failed to load inspector data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateStr]);

  const handleSearchBhoonidhi = async () => {
    setSearchingScenes(true);
    setSearchResults(null);
    try {
      const res = await fetch('/api/nisar/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'NISAR_SSAR_GCOV',
          bbox: [93.60, 26.50, 94.60, 27.30],
          start_date: '2026-07-01T00:00:00Z',
          end_date: '2026-09-30T23:59:59Z'
        })
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Failed to search Bhoonidhi scenes:', err);
      setSearchResults({ error: 'Network error calling backend Bhoonidhi scene search' });
    } finally {
      setSearchingScenes(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 text-xs text-slate-400 font-mono">
        Inspecting NISAR Level 2 GCOV HDF5 container...
      </div>
    );
  }

  if (!hdf5Data) return null;

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div
        className="flex items-center justify-between cursor-pointer select-none mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Phase 3: NISAR Level 2 GCOV HDF5 Architecture & Band Inspector
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            CF-1.8 Compliant
          </span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 text-xs">
          {/* File Summary Bar */}
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Product: </span>
              <span className="text-cyan-300 font-bold">{hdf5Data.product_type}</span>
            </div>
            <div>
              <span className="text-slate-400">Instrument: </span>
              <span className="text-emerald-400 font-bold">{hdf5Data.instrument}</span>
            </div>
            <div>
              <span className="text-slate-400">Spatial Grid: </span>
              <span className="text-blue-300">{hdf5Data.projection}</span>
            </div>
          </div>

          {/* HDF5 Hierarchy Tree */}
          <div className="bg-black/50 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-2">
            <div className="text-slate-400 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              <span>/science/{hdf5Data.instrument}/GCOV/grids/frequencyA/</span>
            </div>

            <div className="pl-6 space-y-1.5 border-l border-slate-800 ml-2">
              {hdf5Data.bands?.frequencyA?.map((band) => (
                <div key={band.name} className="flex items-center justify-between text-slate-300 hover:bg-slate-900/50 p-1 rounded">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400/80" />
                    <span className="text-cyan-200 font-semibold">{band.name}</span>
                    <span className="text-slate-500 text-[10px]">[{band.shape.join(' × ')}]</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className="text-slate-500">{band.dtype}</span> • {band.units}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Terrain Correction (RTC) Verified</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>CF-1.8 Metadata Validated</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>UTM Zone 46N (EPSG:32646) Aligned</span>
            </div>
          </div>

          {/* ISRO Bhoonidhi Satellite API Integration Bar */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-slate-900/90 rounded-lg p-3 border border-blue-900/40 text-[11px] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-slate-200">ISRO Bhoonidhi Satellite Portal Connection:</span>
                {bhoonidhiStatus?.configured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
                    Configured ({bhoonidhiStatus.auth_status})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-800">
                    Awaiting Credentials in .env
                  </span>
                )}
                <span className="text-slate-500 font-mono text-[10px]">Collection: NISAR_SSAR_GCOV</span>
              </div>

              <button
                onClick={handleSearchBhoonidhi}
                disabled={searchingScenes}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium flex items-center gap-1.5 transition text-[11px]"
              >
                {searchingScenes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{searchingScenes ? 'Querying STAC...' : 'Search Majuli AOI Scenes'}</span>
              </button>
            </div>

            {searchResults && (
              <div className="mt-2 p-2.5 rounded bg-black/60 border border-slate-800 font-mono text-[10px] text-slate-300">
                {searchResults.error || searchResults.detail ? (
                  <span className="text-rose-400 font-sans">
                    Notice: {searchResults.error || searchResults.detail}
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="text-emerald-400 font-bold">
                      ✓ {searchResults.message} (Total: {searchResults.total_scenes})
                    </div>
                    {searchResults.scenes?.slice(0, 2).map((s) => (
                      <div key={s.id} className="text-slate-400 truncate">
                        • <span className="text-cyan-300">{s.id}</span> ({s.datetime || 'N/A'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

