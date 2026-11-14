import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Droplets, Activity, BarChart3, Download, FileText, Globe, Layers, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPanel({ statistics, timelineData, regionName, regionId, baselineDate, eventDate }) {
  if (!statistics) return null;

  const {
    region_total_area_km2,
    permanent_water_km2,
    newly_inundated_km2,
    total_water_affected_km2,
    inundation_percent_of_region,
  } = statistics;

  const isMajuli = regionId === 'majuli';
  const isBarpeta = regionId === 'barpeta';

  const handleDownloadGeoJSON = () => {
    if (isMajuli) {
      window.open('/api/water/majuli/boundaries', '_blank');
    } else if (isBarpeta) {
      window.open('/api/flood/barpeta/boundaries', '_blank');
    } else {
      window.open(`/api/export/geojson?region_id=${regionId || 'kaziranga'}&baseline_date=${baselineDate || '2026-06-27'}&event_date=${eventDate || '2026-07-09'}`, '_blank');
    }
  };

  const handleDownloadGeoTIFF = () => {
    if (isMajuli) {
      window.open('/api/water/majuli/classification-raster', '_blank');
    } else if (isBarpeta) {
      window.open('/api/flood/barpeta/change-raster', '_blank');
    } else {
      window.open(`/api/export/geojson?region_id=${regionId || 'kaziranga'}`, '_blank');
    }
  };

  const handleDownloadSourceRadar = () => {
    if (isMajuli) {
      window.open('/api/water/majuli/source-raster', '_blank');
    } else if (isBarpeta) {
      window.open('/api/flood/barpeta/baseline-raster', '_blank');
    }
  };

  const handleDownloadCSV = () => {
    window.open(`/api/export/csv?region_id=${regionId || 'kaziranga'}`, '_blank');
  };

  return (
    <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/40 p-5 shadow-lg space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {isMajuli
              ? 'NISAR Water Extent Metrics (Majuli Island)'
              : isBarpeta
              ? 'Multi-Temporal NISAR Flood Change Metrics (Barpeta Reach: +140.77%)'
              : 'Flood Impact Analytics & Basin Hydrograph'}
          </h3>
        </div>

        {/* Real Data Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#587ebb] hover:bg-[#87b8e8] text-white transition-colors cursor-pointer shadow-xs"
            title={isMajuli ? "Download verified 13,821 NISAR water polygons as GeoJSON" : isBarpeta ? "Download verified Barpeta water & flood change vector features (3 polygons, EPSG:4326 GeoJSON)" : "Download GeoJSON"}
          >
            <span>{isMajuli ? 'Export GeoJSON (13,821 Polygons)' : isBarpeta ? 'Export Change GeoJSON' : 'Export GeoJSON'}</span>
          </button>
          <button
            onClick={handleDownloadGeoTIFF}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#222950] hover:bg-[#283262] text-[#c6e9f1] border border-[#587ebb]/50 transition-colors cursor-pointer"
            title={isMajuli ? "Download classified water raster as GeoTIFF" : isBarpeta ? "Download complete 4-class flood change raster as GeoTIFF" : "Download GeoTIFF raster"}
          >
            <span>{isMajuli ? 'Export Water GeoTIFF' : isBarpeta ? 'Export 4-Class GeoTIFF' : 'Export GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-[#222950] hover:bg-[#283262] text-[#87b8e8] border border-[#3b4a8c] transition-colors cursor-pointer"
            title={isMajuli ? "Download raw Level-2 GCOV HHHH backscatter GeoTIFF (322 MB)" : "Download T1 baseline water GeoTIFF"}
          >
            <span>{isMajuli ? 'Source HHHH (322 MB)' : 'Base T1 GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-[#222950] hover:bg-[#283262] text-slate-300 border border-[#3b4a8c] transition-colors cursor-pointer"
            title="Download timeline statistics as CSV"
          >
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isMajuli ? (
          <>
            <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-[#87b8e8] uppercase tracking-wider block mb-1">
                Verified Water Extent
              </span>
              <div className="text-2xl font-bold text-[#87b8e8] font-mono">
                797.55 <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                ≈ 79,755 hectares classified
              </div>
            </div>

            <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-[#87b8e8] uppercase tracking-wider block mb-1">
                Swath Water Ratio
              </span>
              <div className="text-2xl font-bold text-white font-mono">
                8.91%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                of 8,955.16 km² raster window
              </div>
            </div>

            <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-[#87b8e8] uppercase tracking-wider block mb-1">
                Vector Water Polygons
              </span>
              <div className="text-2xl font-bold text-white font-mono">
                13,821
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                RFC 7946 GeoJSON features
              </div>
            </div>

            <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-[#87b8e8] uppercase tracking-wider block mb-1">
                Sensor & Pass
              </span>
              <div className="text-xl font-bold text-white font-mono">
                Track 015
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Frame 3700 • 2026-08-27
              </div>
            </div>
          </>
        ) : isBarpeta ? (
          <>
            <div className="bg-[#881337]/30 border border-[#f43f5e]/60 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-[#f43f5e] uppercase tracking-wider block mb-1">
                Increase in Water Area
              </span>
              <div className="text-2xl font-bold text-[#f43f5e] font-mono">
                +140.77%
              </div>
              <div className="text-[11px] text-[#f43f5e] mt-1 font-semibold">
                +2.337 km² newly inundated land
              </div>
            </div>

            <div className="bg-[#222950] border border-[#587ebb]/40 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Event Water Extent
              </span>
              <div className="text-2xl font-bold text-[#F4F6F8] font-mono">
                3.997 <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                up from 1.660 km² baseline
              </div>
            </div>

            <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-[#06B6D4] font-mono">
                1.660 <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Brahmaputra main channel
              </div>
            </div>

            <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Matched Orbit
              </span>
              <div className="text-xl font-bold text-[#F4F6F8] font-mono">
                Track 019
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Frame 075 • 12-day interval
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider block mb-1">
                Modeled Inundation
              </span>
              <div className="text-2xl font-bold text-[#F4F6F8] font-mono">
                {newly_inundated_km2} <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Regional model estimate
              </div>
            </div>

            <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Inundation Ratio
              </span>
              <div className="text-2xl font-bold text-[#F4F6F8] font-mono">
                {inundation_percent_of_region}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                of monitored reach corridor
              </div>
            </div>

            <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-[#06B6D4] font-mono">
                {permanent_water_km2} <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Baseline channel
              </div>
            </div>

            <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Evaluated
              </span>
              <div className="text-xl font-bold text-[#F4F6F8] font-mono">
                {region_total_area_km2} km²
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Monitored boundary
              </div>
            </div>
          </>
        )}
      </div>

      {/* Multi-Cycle Evolution Chart for Non-Majuli Reaches */}
      {!isMajuli && timelineData && timelineData.length > 0 && (
        <div className="bg-[#0B132B]/70 border border-[#3A506B]/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#F4F6F8] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#5BC0BE]" />
              Brahmaputra Floodwave Dynamics (NISAR 12-Day Interval Sequence — 2026)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Inundated Area (km²) vs Observation Date
            </span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A506B" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1C2541',
                    borderColor: '#3A506B',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#F4F6F8',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    fontFamily: 'Inter',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="new_inundation_km2"
                  name="New Inundation (km²)"
                  stroke="#E11D48"
                  fillOpacity={1}
                  fill="url(#floodGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="permanent_water_km2"
                  name="Base Water (km²)"
                  stroke="#06B6D4"
                  fill="#06B6D4"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
