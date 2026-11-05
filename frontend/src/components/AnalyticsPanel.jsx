import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Line
} from 'recharts';
import { TrendingUp, Droplets, AlertTriangle, Activity, BarChart3, TreePine, Download, FileText, Globe } from 'lucide-react';

export default function AnalyticsPanel({ statistics, timelineData, regionName, regionId, baselineDate, eventDate }) {
  if (!statistics) return null;

  const {
    region_total_area_km2,
    permanent_water_km2,
    newly_inundated_km2,
    marginal_inundation_km2,
    flooded_vegetation_km2,
    total_water_affected_km2,
    inundation_percent_of_region,
    confidence_partition
  } = statistics;

  const newlyInundatedHectares = Math.round(newly_inundated_km2 * 100);

  const handleDownloadGeoJSON = () => {
    window.open(`/api/export/geojson?region_id=${regionId || 'kaziranga'}&baseline_date=${baselineDate || '2026-06-27'}&event_date=${eventDate || '2026-07-09'}`, '_blank');
  };

  const handleDownloadCSV = () => {
    window.open(`/api/export/csv?region_id=${regionId || 'kaziranga'}`, '_blank');
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            4. Flood Impact Analytics & Multi-Cycle Timeline
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadGeoJSON}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
            title="Download standard GeoJSON of detected flood extent"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export GeoJSON</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
            title="Download timeline statistics as CSV"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Card 1: Newly Inundated */}
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wide">
              Newly Inundated Land
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {newly_inundated_km2} <span className="text-xs text-rose-300 font-normal">km²</span>
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            ≈ {newlyInundatedHectares.toLocaleString()} hectares submerged
          </div>
        </div>

        {/* Card 2: Percentage of Region */}
        <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wide">
              Inundation Ratio
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {inundation_percent_of_region}%
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            of monitored geographical reach
          </div>
        </div>

        {/* Card 3: Permanent Water Base */}
        <div className="bg-blue-950/30 border border-blue-800/60 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wide">
              Permanent River Channels
            </span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {permanent_water_km2} <span className="text-xs text-blue-300 font-normal">km²</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Pre-monsoon channel baseline
          </div>
        </div>

        {/* Card 4: Flooded Vegetation Double Bounce */}
        <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
              Flooded Vegetation
            </span>
            <TreePine className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {flooded_vegetation_km2} <span className="text-xs text-emerald-300 font-normal">km²</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Double-bounce canopy detection
          </div>
        </div>
      </div>

      {/* Phase 5: Scientific Classification Confidence Breakdown */}
      {confidence_partition && (
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold text-white">Scientific Confidence Partitioning (Section 6 Requirement)</span>
            <span className="text-slate-500 font-mono">Adaptive Otsu + RVI Verification</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800 mb-2">
            <div
              className="bg-rose-500 h-full transition-all"
              style={{ width: `${confidence_partition.high_confidence_percent}%` }}
              title={`High Confidence Open Water: ${confidence_partition.high_confidence_percent}%`}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${confidence_partition.moderate_confidence_percent}%` }}
              title={`Moderate Confidence Marginal: ${confidence_partition.moderate_confidence_percent}%`}
            />
            <div
              className="bg-emerald-400 h-full transition-all"
              style={{ width: `${confidence_partition.emergent_canopy_percent}%` }}
              title={`Emergent Canopy Double-Bounce: ${confidence_partition.emergent_canopy_percent}%`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Confirmed Open Water: <strong>{confidence_partition.high_confidence_percent}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Marginal / Wet Soil: <strong>{confidence_partition.moderate_confidence_percent}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Emergent Canopy (Double-Bounce): <strong>{confidence_partition.emergent_canopy_percent}%</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Cycle Evolution Chart */}
      {timelineData && timelineData.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Brahmaputra Floodwave Dynamics (NISAR 12-Day Revisit Sequence — 2026)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Inundated Area (km²) vs River Discharge (m³/s)
            </span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dischargeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
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
                  stroke="#3b82f6"
                  fill="#1d4ed8"
                  fillOpacity={0.3}
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

