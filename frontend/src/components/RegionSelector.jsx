import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function RegionSelector({ selectedRegionId, onSelectRegion, onCustomBoundaryUploaded }) {
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
      setUploadFeedback({
        type: 'error',
        message: 'Unsupported format. Please upload a valid RFC 7946 .geojson file.'
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
          message: `Boundary "${file.name}" loaded for spatial reference.`
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
    <div className="bg-[#1a1f3d] rounded-xl border border-[#587ebb]/40 p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3b4a8c]/50">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            1. Select Monitoring Study Area
          </h2>
          <p className="text-xs text-[#87b8e8]">
            Study areas with verified Level-2 NISAR SAR radar observations.
          </p>
        </div>

        <div className="text-xs text-[#c6e9f1] bg-[#222950] px-2.5 py-1 rounded-md border border-[#587ebb]/40 font-mono font-medium">
          Verified NISAR Swaths
        </div>
      </div>

      {/* The Two Actual Processed Study Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supported Study Area 1: Majuli Island */}
        <button
          onClick={() => onSelectRegion('majuli')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedRegionId === 'majuli'
              ? 'bg-[#222950] border-[#87b8e8] ring-1 ring-[#87b8e8] shadow-md'
              : 'bg-[#1a1f3d] border-[#3b4a8c]/60 hover:border-[#87b8e8]/50 hover:bg-[#222950]/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Majuli River Island</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1f3d] text-[#87b8e8] border border-[#3b4a8c] font-mono">
                Track 015 / Frame 3700
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[#c6e9f1] bg-[#3b4a8c] border border-[#587ebb] px-2 py-0.5 rounded">
              Water Delineation
            </span>
          </div>

          <p className="text-xs text-[#c6e9f1] leading-snug mb-3">
            High-resolution water classification outlining <strong className="text-white">13,821 extracted water polygons</strong> across the Brahmaputra channel and Subansiri confluence.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#3b4a8c]/50 text-[11px]">
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Observation</span>
              <strong className="text-white font-mono font-semibold">27 Aug 2026</strong>
            </div>
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Water Area</span>
              <strong className="text-[#87b8e8] font-mono font-semibold">797.55 km²</strong>
            </div>
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Coverage</span>
              <strong className="text-white font-mono">8.91% swath</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#3b4a8c]/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>13,821 Polygons</span>
            <span>Single-Pol HHHH (10m)</span>
            <span className="text-[#87b8e8] font-semibold">
              ● Ready
            </span>
          </div>
        </button>

        {/* Supported Study Area 2: Barpeta Reach */}
        <button
          onClick={() => onSelectRegion('barpeta')}
          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedRegionId === 'barpeta'
              ? 'bg-[#222950] border-[#87b8e8] ring-1 ring-[#87b8e8] shadow-md'
              : 'bg-[#1a1f3d] border-[#3b4a8c]/60 hover:border-[#87b8e8]/50 hover:bg-[#222950]/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Barpeta & Lower Floodplain</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1f3d] text-[#87b8e8] border border-[#3b4a8c] font-mono">
                Track 019 / Frame 075
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[#c6e9f1] bg-[#3b4a8c] border border-[#587ebb] px-2 py-0.5 rounded">
              Multi-Date Comparison
            </span>
          </div>

          <p className="text-xs text-[#c6e9f1] leading-snug mb-3">
            Multi-temporal water classification comparison detecting a <strong className="text-white">+140.77% increase in classified water area</strong> (+2.337 km² newly inundated land) across the 12-day orbital repeat.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#3b4a8c]/50 text-[11px]">
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Observations</span>
              <strong className="text-white font-mono font-semibold">27 Jun vs 09 Jul</strong>
            </div>
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Area Increase</span>
              <strong className="text-[#f43f5e] font-mono font-bold">+140.77%</strong>
            </div>
            <div>
              <span className="text-[#87b8e8] block text-[10px]">Newly Inundated</span>
              <strong className="text-[#f43f5e] font-mono font-bold">+2.337 km²</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#3b4a8c]/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>1.660 → 3.997 km²</span>
            <span>8 Observation Cycles</span>
            <span className="text-[#87b8e8] font-semibold">
              ● Ready
            </span>
          </div>
        </button>
      </div>

      {/* Optional Custom GeoJSON Boundary Upload Tool */}
      <div className="pt-2 border-t border-[#3b4a8c]/50">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#222950] border border-[#587ebb]/40 text-xs">
          <div className="text-slate-300">
            <span className="font-semibold text-white">Custom Boundary (Optional): </span>
            <span className="text-[#87b8e8]">Upload GeoJSON (.geojson) to overlay a custom area of interest on the radar map.</span>
          </div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3b4a8c] border border-[#587ebb] hover:border-[#87b8e8] text-white hover:text-[#c6e9f1] font-medium shadow-xs cursor-pointer transition-colors text-xs">
            <Upload className="w-3.5 h-3.5 text-[#87b8e8]" />
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
          <div className={`mt-2 p-2.5 rounded-md text-xs border ${
            uploadFeedback.type === 'info'
              ? 'bg-[#222950] border-[#87b8e8]/40 text-[#c6e9f1]'
              : 'bg-[#222950] border-rose-500/40 text-rose-200'
          }`}>
            <div className="leading-relaxed">{uploadFeedback.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
