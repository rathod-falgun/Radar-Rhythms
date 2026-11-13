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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {isMajuli
              ? 'Real NISAR Water Extent Metrics (Majuli Island)'
              : isBarpeta
              ? 'Multi-Temporal NISAR Flood Change Metrics (Barpeta Reach: +140.77%)'
              : 'Flood Impact Analytics & Basin Hydrograph'}
          </h3>
        </div>

        {/* Real Data Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors cursor-pointer"
            title={isMajuli ? "Download verified 13,821 NISAR water polygons as GeoJSON" : isBarpeta ? "Download verified Barpeta water & flood change vector features (3 polygons, EPSG:4326 GeoJSON)" : "Download GeoJSON"}
          >
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>{isMajuli ? 'Export GeoJSON (13,821 Polygons)' : isBarpeta ? 'Export Change GeoJSON (Vectors)' : 'Export GeoJSON'}</span>
          </button>
          <button
            onClick={handleDownloadGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer"
            title={isMajuli ? "Download classified water raster as GeoTIFF (EPSG:32646)" : isBarpeta ? "Download complete 4-class flood change raster as GeoTIFF (EPSG:32646)" : "Download GeoTIFF raster"}
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{isMajuli ? 'Export Water GeoTIFF' : isBarpeta ? 'Export 4-Class GeoTIFF' : 'Export GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title={isMajuli ? "Download raw Level-2 GCOV HHHH backscatter GeoTIFF (322 MB)" : "Download T1 baseline water GeoTIFF"}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{isMajuli ? 'Source HHHH (322 MB)' : 'Base T1 GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            title="Download timeline statistics as CSV"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isMajuli ? (
          <>
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide block mb-1">
                Verified Water Extent
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                797.55 <span className="text-xs text-sky-700 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ≈ 79,755 hectares classified
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Swath Water Ratio
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                8.91%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                of 8,955.16 km² raster window
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Vector Water Polygons
              </span>
              <div className="text-2xl font-bold text-sky-700 font-mono">
                13,821
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                RFC 7946 GeoJSON features
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Sensor & Pass
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                Track 015
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Frame 3700 • 2026-08-27
              </div>
            </div>
          </>
        ) : isBarpeta ? (
          <>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide block mb-1">
                Flood Inundation Surge
              </span>
              <div className="text-2xl font-bold text-rose-700 font-mono">
                +140.77%
              </div>
              <div className="text-[11px] text-rose-800 mt-1 font-semibold">
                +2.337 km² newly inundated land
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Event Water Extent
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                3.997 <span className="text-xs text-slate-500 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                up from 1.660 km² baseline
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-sky-700 font-mono">
                1.660 <span className="text-xs text-slate-500 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Brahmaputra main channel
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Matched Orbit
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                Track 019
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Frame 075 • 12-Day Revisit
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide block mb-1">
                Modeled Inundation
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {newly_inundated_km2} <span className="text-xs text-slate-500 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Regional model estimate
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Inundation Ratio
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {inundation_percent_of_region}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                of monitored reach corridor
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-sky-700 font-mono">
                {permanent_water_km2} <span className="text-xs text-slate-500 font-normal">km²</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Baseline channel
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Total Evaluated
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {region_total_area_km2} km²
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Monitored boundary
              </div>
            </div>
          </>
        )}
      </div>

      {/* Multi-Cycle Evolution Chart for Non-Majuli Reaches */}
      {!isMajuli && timelineData && timelineData.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
              Brahmaputra Floodwave Dynamics (NISAR 12-Day Revisit Sequence — 2026)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Inundated Area (km²) vs Revisit Date
            </span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="new_inundation_km2"
                  name="New Inundation (km²)"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#floodGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="permanent_water_km2"
                  name="Base Water (km²)"
                  stroke="#0284c7"
                  fill="#0284c7"
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
