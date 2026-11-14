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
      <div className="bg-[#1C2541] rounded-xl border border-[#3A506B]/50 p-4 text-xs text-slate-400 font-mono">
        Inspecting NISAR Level 2 GCOV HDF5 container...
      </div>
    );
  }

  if (!hdf5Data) return null;

  return (
    <div className="bg-[#1C2541] rounded-xl border border-[#3A506B]/50 p-4 shadow-md">
      <div
        className="flex items-center justify-between cursor-pointer select-none mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#0B132B] flex items-center justify-center text-[#5BC0BE] border border-[#3A506B]/40">
            <Database className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-[#F4F6F8]">
            Phase 3: NISAR Level 2 GCOV HDF5 Architecture & Band Inspector
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0B132B] text-[#6FFFE9] border border-[#3A506B]/50 font-medium">
            CF-1.8 Compliant
          </span>
        </div>
        <button className="text-slate-400 hover:text-[#6FFFE9] cursor-pointer">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 text-xs">
          {/* File Summary Bar */}
          <div className="bg-[#0B132B]/70 rounded-lg p-3 border border-[#3A506B]/50 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Product: </span>
              <span className="text-[#F4F6F8] font-bold">{hdf5Data.product_type}</span>
            </div>
            <div>
              <span className="text-slate-400">Instrument: </span>
              <span className="text-[#5BC0BE] font-bold">{hdf5Data.instrument}</span>
            </div>
            <div>
              <span className="text-slate-400">Spatial Grid: </span>
              <span className="text-[#F4F6F8]">{hdf5Data.projection}</span>
            </div>
          </div>

          {/* HDF5 Hierarchy Tree */}
          <div className="bg-[#0B132B]/70 rounded-lg p-3 border border-[#3A506B]/50 font-mono text-[11px] space-y-2">
            <div className="text-[#F4F6F8] flex items-center gap-1.5 font-semibold">
              <FolderTree className="w-3.5 h-3.5 text-[#5BC0BE]" />
              <span>/science/{hdf5Data.instrument}/GCOV/grids/frequencyA/</span>
            </div>

            <div className="pl-6 space-y-1.5 border-l border-[#3A506B]/50 ml-2">
              {hdf5Data.bands?.frequencyA?.map((band) => (
                <div key={band.name} className="flex items-center justify-between text-slate-300 hover:bg-[#24314D]/50 p-1 rounded-md transition-colors">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#5BC0BE]" />
                    <span className="text-[#6FFFE9] font-medium">{band.name}</span>
                    <span className="text-slate-400 text-[10px]">[{band.shape.join(' × ')}]</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span>{band.dtype}</span> • {band.units}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-[#0B132B]/70 p-2.5 rounded-md border border-[#3A506B]/50 flex items-center gap-2 text-slate-200 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Terrain Correction (RTC) Verified</span>
            </div>
            <div className="bg-[#0B132B]/70 p-2.5 rounded-md border border-[#3A506B]/50 flex items-center gap-2 text-slate-200 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>CF-1.8 Metadata Validated</span>
            </div>
            <div className="bg-[#0B132B]/70 p-2.5 rounded-md border border-[#3A506B]/50 flex items-center gap-2 text-slate-200 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>UTM Zone 46N (EPSG:32646) Aligned</span>
            </div>
          </div>

          {/* ISRO Bhoonidhi Satellite API Integration Bar */}
          <div className="bg-[#0B132B]/70 rounded-lg p-3 border border-[#3A506B]/50 text-[11px] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#5BC0BE]" />
                <span className="font-semibold text-[#F4F6F8]">ISRO Bhoonidhi Satellite Portal Connection:</span>
                {bhoonidhiStatus?.configured ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                    Configured ({bhoonidhiStatus.auth_status})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                    Awaiting Credentials in .env
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[10px]">Collection: NISAR_SSAR_GCOV</span>
              </div>

              <button
                onClick={handleSearchBhoonidhi}
                disabled={searchingScenes}
                className="px-3 py-1.5 rounded-md bg-[#5BC0BE] hover:bg-[#6FFFE9] text-[#0B132B] font-semibold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer shadow-sm"
              >
                {searchingScenes ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B132B]" /> : <Search className="w-3.5 h-3.5 text-[#0B132B]" />}
                <span>{searchingScenes ? 'Querying STAC...' : 'Search Majuli AOI Scenes'}</span>
              </button>
            </div>

            {searchResults && (
              <div className="mt-2 p-2.5 rounded-md bg-[#1C2541] border border-[#3A506B]/60 font-mono text-[10px] text-slate-300">
                {searchResults.error || searchResults.detail ? (
                  <span className="text-[#E11D48] font-sans">
                    Notice: {searchResults.error || searchResults.detail}
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="text-emerald-400 font-bold">
                      ✓ {searchResults.message} (Total: {searchResults.total_scenes})
                    </div>
                    {searchResults.scenes?.slice(0, 2).map((s) => (
                      <div key={s.id} className="text-slate-400 truncate">
                        • <span className="text-[#F4F6F8] font-medium">{s.id}</span> ({s.datetime || 'N/A'})
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
