import React, { useState } from 'react';
import { MapPin, Upload, CheckCircle2, AlertCircle, Info, FileUp, ShieldCheck } from 'lucide-react';

export default function RegionSelector({ selectedRegionId, onSelectRegion, onCustomBoundaryUploaded }) {
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
      setUploadFeedback({
        type: 'error',
        message: 'Unsupported file format. Please upload a valid RFC 7946 .geojson file containing polygon geometries.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.type !== 'FeatureCollection' && parsed.type !== 'Feature') {
          throw new Error('Invalid GeoJSON structure. Must be a Feature or FeatureCollection.');
        }

        setUploadedFileName(file.name);
        setUploadFeedback({
          type: 'info',
          message: `Boundary "${file.name}" displayed. Note: Custom-region satellite analysis requires background NISAR data discovery, extraction, and processing. No pre-processed satellite observation is currently available for this custom geometry.`
        });

        if (onCustomBoundaryUploaded) {
          onCustomBoundaryUploaded(parsed, file.name);
        }
      } catch (err) {
        setUploadFeedback({
          type: 'error',
          message: `Failed to parse GeoJSON: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1c2541] text-[#6fffe9] border border-[#3a506b] flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#5bc0be]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Select an Area to Monitor
            </h2>
            <p className="text-xs text-slate-500">
              Choose a study area with verified, processed NASA–ISRO NISAR satellite observations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Authentic Scientific Datasets</span>
        </div>
      </div>

      {/* The Two Actual Processed Study Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supported Study Area 1: Majuli Island */}
        <button
          onClick={() => onSelectRegion('majuli')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedRegionId === 'majuli'
              ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Majuli River Island</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Track 015 / Frame 3700
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded">
              Single-Date Delineation
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-snug mb-3">
            High-resolution water classification outlining <strong>13,821 vector water polygons</strong> across the Brahmaputra braided channel and Subansiri confluence.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200/70 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Observation</span>
              <strong className="text-slate-800 font-mono">27 Aug 2026</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Water Area</span>
              <strong className="text-sky-700 font-mono">797.55 km²</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Coverage</span>
              <strong className="text-slate-800 font-mono">8.91% of swath</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>● 13,821 Polygons</span>
            <span>● Single-Pol HHHH (10m)</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        </button>

        {/* Supported Study Area 2: Barpeta Reach */}
        <button
          onClick={() => onSelectRegion('barpeta')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedRegionId === 'barpeta'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Barpeta & Lower Floodplain</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Track 019 / Frame 075
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded">
              Two-Date Comparison
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-snug mb-3">
            Multi-temporal water classification comparison detecting a <strong>+140.77% increase in classified water area</strong> (+2.337 km² newly inundated land) in the evaluated 9.152 km² corridor over the 12-day interval between available observations.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200/70 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Observations</span>
              <strong className="text-slate-800 font-mono">27 Jun vs 09 Jul</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Area Increase</span>
              <strong className="text-rose-600 font-mono">+140.77%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Newly Inundated</span>
              <strong className="text-rose-700 font-mono">+2.337 km²</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>● 1.660 → 3.997 km²</span>
            <span>● Track 019 / Frame 075</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        </button>
      </div>

      {/* Optional Custom GeoJSON Boundary Upload Tool (Strictly Disclosed) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <FileUp className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">Custom Boundary Upload (Optional): </span>
              <span className="text-slate-500">Upload a GeoJSON file (.geojson) to preview an arbitrary area of interest.</span>
            </div>
          </div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-sky-400 text-sky-700 font-medium shadow-2xs cursor-pointer transition-colors text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploadedFileName ? 'Upload Different GeoJSON' : 'Upload GeoJSON'}</span>
            <input
              type="file"
              accept=".geojson,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Feedback */}
        {uploadFeedback && (
          <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
            uploadFeedback.type === 'info'
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{uploadFeedback.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
