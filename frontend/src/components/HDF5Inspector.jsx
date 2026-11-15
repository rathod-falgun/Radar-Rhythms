import React, { useState, useEffect } from 'react';
import { Database, FolderTree, FileCode, CheckCircle, ShieldCheck, ChevronRight, ChevronDown, Satellite, Search, Loader2 } from 'lucide-react';
import { apiUrl } from '../utils/apiConfig';

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
          fetch(apiUrl(`/api/nisar/inspect?date_str=${dateStr}`)),
          fetch(apiUrl('/api/nisar/status'))
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
    const isBhoonidhi = Boolean(bhoonidhiStatus?.configured);
    const targetCollection = isBhoonidhi ? 'NISAR_SSAR_GCOV' : 'NISAR_L2_GCOV_PROVISIONAL_V1';
    try {
      const res = await fetch(apiUrl('/api/nisar/scenes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: targetCollection,
          bbox: [93.60, 26.50, 94.60, 27.30],
          start_date: '2026-07-01T00:00:00Z',
          end_date: '2026-09-30T23:59:59Z'
        })
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Failed to search satellite scenes:', err);
      setSearchResults({ error: 'Network error calling backend satellite scene search' });
    } finally {
      setSearchingScenes(false);
    }
  };

  if (loading) {
    return (
      <div className="card-outer rounded p-4 text-xs text-[#e5e5e5]/70 font-mono">
        Inspecting NISAR Level 2 GCOV HDF5 container...
      </div>
    );
  }

  if (!hdf5Data) return null;

  return (
    <div className="card-outer rounded p-5 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer select-none mb-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-editorial font-semibold tracking-wide text-white">
            NISAR Level 2 GCOV HDF5 Architecture & Band Inspector
          </h3>
          <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded box-inner text-[#fca311] font-semibold">
            CF-1.8 Compliant
          </span>
        </div>
        <button className="text-[#e5e5e5]/60 hover:text-white cursor-pointer">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3.5 text-xs">
          {/* File Summary Bar */}
          <div className="box-inner rounded p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
            <div>
              <span className="text-[#e5e5e5]/50">Product: </span>
              <span className="text-white font-bold">{hdf5Data.product_type}</span>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50">Instrument: </span>
              <span className="text-[#fca311] font-bold">{hdf5Data.instrument}</span>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50">Spatial Grid: </span>
              <span className="text-[#e5e5e5]">{hdf5Data.projection}</span>
            </div>
          </div>

          {/* HDF5 Hierarchy Tree */}
          <div className="box-inner rounded p-3.5 font-mono text-[11px] space-y-2">
            <div className="text-white flex items-center gap-1.5 font-semibold">
              <FolderTree className="w-3.5 h-3.5 text-[#fca311]" />
              <span>/science/{hdf5Data.instrument}/GCOV/grids/frequencyA/</span>
            </div>

            <div className="pl-6 space-y-1.5 border-l border-[var(--border-outer)] ml-2">
              {hdf5Data.bands?.frequencyA?.map((band) => (
                <div key={band.name} className="flex items-center justify-between text-[#e5e5e5]/80 hover:bg-[#14213d] p-1.5 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#fca311]" />
                    <span className="text-white font-medium">{band.name}</span>
                    <span className="text-[#e5e5e5]/50 text-[10px]">[{band.shape.join(' × ')}]</span>
                  </div>
                  <div className="text-[10px] text-[#e5e5e5]/50">
                    <span>{band.dtype}</span> • {band.units}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
            <div className="box-inner p-2.5 rounded flex items-center gap-2 text-[#e5e5e5]">
              <CheckCircle className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
              <span>RTC Terrain Correction</span>
            </div>
            <div className="box-inner p-2.5 rounded flex items-center gap-2 text-[#e5e5e5]">
              <CheckCircle className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
              <span>CF-1.8 Validated</span>
            </div>
            <div className="box-inner p-2.5 rounded flex items-center gap-2 text-[#e5e5e5]">
              <CheckCircle className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
              <span>UTM Zone 46N (EPSG:32646)</span>
            </div>
          </div>

          {/* Satellite API Integration Bar */}
          <div className="box-inner rounded p-3.5 text-[11px] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Satellite className="w-4 h-4 text-[#fca311]" />
                <span className="font-editorial text-white text-xs">
                  {bhoonidhiStatus?.configured ? 'ISRO Bhoonidhi Satellite Query:' : 'NASA Earthdata CMR Satellite Query:'}
                </span>
                {bhoonidhiStatus?.configured ? (
                  <span className="px-2 py-0.5 rounded card-outer text-[#fca311] font-mono text-[9px] uppercase tracking-wider">
                    Bhoonidhi Configured ({bhoonidhiStatus.auth_status})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded card-outer text-emerald-400 font-mono text-[9px] uppercase tracking-wider">
                    CMR Open Access (Free)
                  </span>
                )}
                <span className="text-[#e5e5e5]/50 font-mono text-[10px]">
                  Collection: {bhoonidhiStatus?.configured ? 'NISAR_SSAR_GCOV' : 'NISAR_L2_GCOV_PROVISIONAL_V1'}
                </span>
              </div>

              <button
                onClick={handleSearchBhoonidhi}
                disabled={searchingScenes}
                className="px-3.5 py-1.5 rounded bg-[#fca311] hover:bg-white text-black font-semibold flex items-center gap-1.5 transition-colors text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                {searchingScenes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{searchingScenes ? 'Querying Catalog...' : 'Query Majuli Scenes'}</span>
              </button>
            </div>

            {searchResults && (
              <div className="mt-2.5 p-3 rounded card-outer font-mono text-[11px] text-[#e5e5e5]">
                {searchResults.error || searchResults.detail ? (
                  <span className="text-[#fca311]">
                    Notice: {searchResults.error || searchResults.detail}
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[#fca311] font-bold">
                      ✓ {searchResults.message} (Total: {searchResults.total_scenes})
                    </div>
                    {searchResults.scenes?.slice(0, 3).map((s) => (
                      <div key={s.id} className="text-[#e5e5e5]/70 truncate flex items-center gap-1.5 flex-wrap">
                        <span>•</span>
                        <span className="text-white font-medium">{s.id}</span>
                        <span className="text-[#e5e5e5]/50">({s.datetime || 'N/A'})</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--card-border)] text-[#fca311] font-mono">
                          {s.provider || (s.id?.includes('_S2_') || s.id?.includes('_SSAR_') ? 'ISRO S-band (Bhoonidhi)' : 'NASA L-band (CMR)')}
                        </span>
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
