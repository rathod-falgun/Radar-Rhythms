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
    <div className="bg-white rounded-xl border border-border p-5 shadow-xs space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo flex items-center justify-center text-teal">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-primary">
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
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-midnight hover:bg-indigo text-white border border-indigo transition-colors cursor-pointer shadow-xs"
            title={isMajuli ? "Download verified 13,821 NISAR water polygons as GeoJSON" : isBarpeta ? "Download verified Barpeta water & flood change vector features (3 polygons, EPSG:4326 GeoJSON)" : "Download GeoJSON"}
          >
            <Globe className="w-3.5 h-3.5 text-aqua" />
            <span>{isMajuli ? 'Export GeoJSON (13,821 Polygons)' : isBarpeta ? 'Export Change GeoJSON (Vectors)' : 'Export GeoJSON'}</span>
          </button>
          <button
            onClick={handleDownloadGeoTIFF}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white hover:bg-cloud text-primary border border-border transition-colors cursor-pointer"
            title={isMajuli ? "Download classified water raster as GeoTIFF (EPSG:32646)" : isBarpeta ? "Download complete 4-class flood change raster as GeoTIFF (EPSG:32646)" : "Download GeoTIFF raster"}
          >
            <Download className="w-3.5 h-3.5 text-muted" />
            <span>{isMajuli ? 'Export Water GeoTIFF' : isBarpeta ? 'Export 4-Class GeoTIFF' : 'Export GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadSourceRadar}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white hover:bg-cloud text-primary border border-border transition-colors cursor-pointer"
            title={isMajuli ? "Download raw Level-2 GCOV HHHH backscatter GeoTIFF (322 MB)" : "Download T1 baseline water GeoTIFF"}
          >
            <Layers className="w-3.5 h-3.5 text-muted" />
            <span>{isMajuli ? 'Source HHHH (322 MB)' : 'Base T1 GeoTIFF'}</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white hover:bg-cloud text-primary border border-border transition-colors cursor-pointer"
            title="Download timeline statistics as CSV"
          >
            <FileText className="w-3.5 h-3.5 text-muted" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isMajuli ? (
          <>
            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Verified Water Extent
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                797.55 <span className="text-xs text-muted font-normal">km²</span>
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                ≈ 79,755 hectares classified
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Swath Water Ratio
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                8.91%
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                of 8,955.16 km² raster window
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Vector Water Polygons
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                13,821
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                RFC 7946 GeoJSON features
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Sensor & Pass
              </span>
              <div className="text-xl font-bold text-primary font-mono">
                Track 015
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Frame 3700 • 2026-08-27
              </div>
            </div>
          </>
        ) : isBarpeta ? (
          <>
            <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block mb-1">
                Increase in Water Area
              </span>
              <div className="text-2xl font-bold text-[#E11D48] font-mono">
                +140.77%
              </div>
              <div className="text-[11px] text-rose-700 mt-1 font-semibold">
                +2.337 km² newly inundated land
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Event Water Extent
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                3.997 <span className="text-xs text-muted font-normal">km²</span>
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                up from 1.660 km² baseline
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-[#06B6D4] font-mono">
                1.660 <span className="text-xs text-muted font-normal">km²</span>
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Brahmaputra main channel
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Matched Orbit
              </span>
              <div className="text-xl font-bold text-primary font-mono">
                Track 019
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Frame 075 • 12-day interval
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block mb-1">
                Modeled Inundation
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                {newly_inundated_km2} <span className="text-xs text-muted font-normal">km²</span>
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Regional model estimate
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Inundation Ratio
              </span>
              <div className="text-2xl font-bold text-primary font-mono">
                {inundation_percent_of_region}%
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                of monitored reach corridor
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Permanent Channel
              </span>
              <div className="text-2xl font-bold text-[#06B6D4] font-mono">
                {permanent_water_km2} <span className="text-xs text-muted font-normal">km²</span>
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Baseline channel
              </div>
            </div>

            <div className="bg-subtle border border-border rounded-lg p-3.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Total Evaluated
              </span>
              <div className="text-xl font-bold text-primary font-mono">
                {region_total_area_km2} km²
              </div>
              <div className="text-[11px] text-muted mt-1 font-mono">
                Monitored boundary
              </div>
            </div>
          </>
        )}
      </div>

      {/* Multi-Cycle Evolution Chart for Non-Majuli Reaches */}
      {!isMajuli && timelineData && timelineData.length > 0 && (
        <div className="bg-subtle border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-teal" />
              Brahmaputra Floodwave Dynamics (NISAR 12-Day Interval Sequence — 2026)
            </span>
            <span className="text-[10px] text-muted font-mono">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#0B132B',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
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
                  fillOpacity={0.15}
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
