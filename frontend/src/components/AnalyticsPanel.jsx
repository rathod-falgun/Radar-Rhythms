import React, { useState, useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Download, ChevronDown } from 'lucide-react';
import { apiUrl } from '../utils/apiConfig';

/**
 * AnalyticsPanel — "Night-pass radar" metrics
 * Four big numbers in a row with hairline dividers
 * Data export buttons styled with the strict palette
 */
export default function AnalyticsPanel({ statistics, timelineData, regionName, regionId, baselineDate, eventDate }) {
  if (!statistics) return null;

  const {
    region_total_area_km2,
    permanent_water_km2,
    newly_inundated_km2,
    total_water_affected_km2,
    inundation_percent_of_region,
    percentage_change,
  } = statistics;

  const isMajuli = regionId === 'majuli';
  const isBarpeta = regionId === 'barpeta';

  const handleDownloadGeoJSON = () => {
    if (isMajuli) {
      window.open(apiUrl('/api/water/majuli/boundaries'), '_blank');
    } else if (isBarpeta) {
      window.open(apiUrl('/api/flood/barpeta/boundaries'), '_blank');
    } else {
      window.open(apiUrl(`/api/export/geojson?region_id=${regionId || 'kaziranga'}&baseline_date=${baselineDate || '2026-06-27'}&event_date=${eventDate || '2026-07-09'}`), '_blank');
    }
  };

  const handleDownloadGeoTIFF = () => {
    if (isMajuli) {
      window.open(apiUrl('/api/water/majuli/classification-raster'), '_blank');
    } else if (isBarpeta) {
      window.open(apiUrl('/api/flood/barpeta/change-raster'), '_blank');
    } else {
      window.open(apiUrl(`/api/export/geojson?region_id=${regionId || 'kaziranga'}`), '_blank');
    }
  };

  const handleDownloadSourceRadar = () => {
    if (isMajuli) {
      window.open(apiUrl('/api/water/majuli/source-raster'), '_blank');
    } else if (isBarpeta) {
      window.open(apiUrl('/api/flood/barpeta/baseline-raster'), '_blank');
    }
  };

  const handleDownloadCSV = () => {
    window.open(apiUrl(`/api/export/csv?region_id=${regionId || 'kaziranga'}`), '_blank');
  };

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 pt-2">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5e5e5]/10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#fca311] uppercase block mb-1">
            Telemetry & Data Products
          </span>
          <h3 className="text-xl font-editorial font-normal text-white">
            {isMajuli
              ? 'NISAR Water Extent Metrics (Majuli Island)'
              : isBarpeta
              ? `Multi-Temporal Flood Change Metrics (${percentage_change !== undefined ? `${percentage_change >= 0 ? '+' : ''}${percentage_change}%` : '+140.77%'})`
              : 'Flood Impact Analytics & Basin Hydrograph'}
          </h3>
        </div>

        {/* Unified Download Dropdown */}
        <div className="relative" ref={downloadRef}>
          <button
            onClick={() => setShowDownloadMenu((prev) => !prev)}
            className="text-xs font-mono uppercase tracking-wider px-3.5 py-1.5 rounded card-outer text-[#e5e5e5] hover:border-[#fca311] hover:text-[#fca311] transition-all cursor-pointer flex items-center gap-2"
            aria-expanded={showDownloadMenu}
            aria-haspopup="true"
          >
            <Download className="w-3.5 h-3.5 text-[#fca311]" />
            <span>Export Data</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
          </button>

          {showDownloadMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded box-inner border border-[var(--border-outer)] shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-md">
              <div className="px-2.5 py-1 text-xs font-mono uppercase tracking-widest text-[#e5e5e5]/60 border-b border-[var(--border-outer)] font-semibold">
                Available Data Products
              </div>
              <button
                onClick={() => {
                  handleDownloadGeoJSON();
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded text-xs font-mono text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#fca311] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="font-medium group-hover:text-[#fca311] transition-colors">
                    {isMajuli ? 'Vector Boundaries' : 'Change Boundaries'}
                  </span>
                  <span className="text-xs text-[#e5e5e5]/60">
                    {isMajuli ? '13,821 Polygons' : 'Vector polygons'}
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-[#fca311] border border-[var(--border-outer)] font-semibold">
                  GeoJSON
                </span>
              </button>

              <button
                onClick={() => {
                  handleDownloadGeoTIFF();
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded text-xs font-mono text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#fca311] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="font-medium group-hover:text-[#fca311] transition-colors">
                    {isMajuli ? 'Water Extent GeoTIFF' : '4-Class Change GeoTIFF'}
                  </span>
                  <span className="text-xs text-[#e5e5e5]/60">Classified raster grid</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-[#e5e5e5]/80 border border-[var(--border-outer)] font-semibold">
                  GeoTIFF
                </span>
              </button>

              {(isMajuli || isBarpeta) && (
                <button
                  onClick={() => {
                    handleDownloadSourceRadar();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs font-mono text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#fca311] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-[#fca311] transition-colors">
                      {isMajuli ? 'Source HHHH Raster' : 'Base T1 Raster'}
                    </span>
                    <span className="text-xs text-[#e5e5e5]/60">
                      {isMajuli ? 'Raw radar (322 MB)' : 'Baseline radar'}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-[#e5e5e5]/80 border border-[var(--border-outer)] font-semibold">
                    GeoTIFF
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  handleDownloadCSV();
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded text-xs font-mono text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#fca311] transition-colors flex items-center justify-between cursor-pointer border-t border-[var(--border-outer)] pt-2 mt-1 group"
              >
                <div className="flex flex-col">
                  <span className="font-medium group-hover:text-[#fca311] transition-colors">
                    Timeline Statistics
                  </span>
                  <span className="text-xs text-[#e5e5e5]/60">Summary time series</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-[#e5e5e5]/80 border border-[var(--border-outer)] font-semibold">
                  CSV
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Metric KPI Cards: Four Big Numbers in a Row with Hairline Dividers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded card-outer divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-outer)]">
        {isMajuli ? (
          <>
            <div className="p-6 card-highlight rounded-tl lg:rounded-l lg:rounded-tr-none">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Verified Water Extent
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-[#fca311]">
                797.55 <span className="text-xs font-mono text-[#e5e5e5]/60">km²</span>
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                ≈ 79,755 hectares mapped
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Swath Ratio
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                8.91%
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                of 8,955.16 km² window
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Extracted Polygons
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                13,821
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                RFC 7946 GeoJSON vectors
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Orbit & Pass
              </span>
              <div className="text-2xl sm:text-3xl font-editorial font-normal text-white">
                Track 015
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                Frame 3700 • 2026-08-27
              </div>
            </div>
          </>
        ) : isBarpeta ? (
          <>
            <div className="p-6 card-highlight rounded-tl lg:rounded-l lg:rounded-tr-none">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Water Area Change
              </span>
              <div className={`text-3xl sm:text-4xl font-editorial font-normal ${
                (percentage_change ?? 140.77) >= 0 ? 'text-[#fca311]' : 'text-white'
              }`}>
                {(percentage_change ?? 140.77) >= 0 ? `+${(percentage_change ?? 140.77)}%` : `${percentage_change}%`}
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/80 mt-1 uppercase">
                {(newly_inundated_km2 ?? 2.337) > 0 ? `+${newly_inundated_km2 ?? 2.337} km² newly flooded` : 'recession state'}
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Event Water Extent
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                {total_water_affected_km2 ?? 3.997} <span className="text-xs font-mono text-[#e5e5e5]/60">km²</span>
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                {eventDate || '2026-07-09'} observation
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Persistent Channel
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                {permanent_water_km2 ?? 1.660} <span className="text-xs font-mono text-[#e5e5e5]/60">km²</span>
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                Brahmaputra braided core
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono text-[#e5e5e5]/70 uppercase tracking-widest block mb-1.5 font-medium">
                Matched Orbit
              </span>
              <div className="text-2xl sm:text-3xl font-editorial font-normal text-white">
                Track 019
              </div>
              <div className="text-xs font-mono text-[#e5e5e5]/70 mt-1 uppercase">
                Frame 075 • 12-day repeat
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase tracking-widest block mb-1">
                Modeled Inundation
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-[#fca311]">
                {newly_inundated_km2} <span className="text-xs font-mono text-[#e5e5e5]/50">km²</span>
              </div>
              <div className="text-[10px] font-mono text-[#e5e5e5]/50 mt-1 uppercase">
                Regional model estimate
              </div>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase tracking-widest block mb-1">
                Inundation Ratio
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                {inundation_percent_of_region}%
              </div>
              <div className="text-[10px] font-mono text-[#e5e5e5]/50 mt-1 uppercase">
                of corridor reach
              </div>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase tracking-widest block mb-1">
                Permanent Channel
              </span>
              <div className="text-3xl sm:text-4xl font-editorial font-normal text-white">
                {permanent_water_km2} <span className="text-xs font-mono text-[#e5e5e5]/50">km²</span>
              </div>
              <div className="text-[10px] font-mono text-[#e5e5e5]/50 mt-1 uppercase">
                Baseline channel
              </div>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase tracking-widest block mb-1">
                Total Evaluated
              </span>
              <div className="text-2xl sm:text-3xl font-editorial font-normal text-white">
                {region_total_area_km2} km²
              </div>
              <div className="text-[10px] font-mono text-[#e5e5e5]/50 mt-1 uppercase">
                Monitored reach extent
              </div>
            </div>
          </>
        )}
      </div>

      {/* Multi-Cycle Evolution Chart for Non-Majuli Reaches */}
      {!isMajuli && timelineData && timelineData.length > 0 && (
        <div className="card-outer rounded p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-outer)]">
            <span className="text-xs font-mono text-white flex items-center gap-2 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-[#ef4444]" />
              Brahmaputra Floodwave Dynamics (NISAR 12-Day Interval Sequence — 2026)
            </span>
            <span className="text-[10px] text-[#e5e5e5]/50 font-mono uppercase tracking-widest">
              Water Area (km²) vs Date
            </span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.08} />
                <XAxis dataKey="date" stroke="#e5e5e5" opacity={0.5} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis stroke="#e5e5e5" opacity={0.5} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    borderColor: 'rgba(229, 229, 229, 0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#e5e5e5',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="new_inundation_km2"
                  name="New Inundation (km²)"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#floodGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="permanent_water_km2"
                  name="Base Water (km²)"
                  stroke="#ffffff"
                  fill="#14213d"
                  fillOpacity={0.6}
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
