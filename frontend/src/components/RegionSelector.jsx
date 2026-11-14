import React, { useState } from 'react';
import { Upload } from 'lucide-react';

/**
 * RegionSelector — "Night-pass radar" editorial study area selection
 * The two study-area cards become big editorial selectors:
 * The active one gets an orange border-left and a bold orange number.
 */
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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5e5e5]/10">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#fca311] uppercase block mb-1">
            Step 01 • Spatial Targeting
          </span>
          <h2 className="text-xl sm:text-2xl font-editorial font-normal text-white tracking-tight">
            Select Monitoring Study Area
          </h2>
          <p className="text-xs text-[#e5e5e5]/60 font-light mt-0.5">
            Verified Level-2 NISAR SAR radar observations across the Brahmaputra Basin.
          </p>
        </div>

        <div className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded box-inner text-[#e5e5e5]/80">
          Verified NISAR Swaths
        </div>
      </div>

      {/* The Two Actual Processed Study Areas as Big Editorial Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Study Area 1: Majuli Island */}
        <button
          type="button"
          onClick={() => onSelectRegion('majuli')}
          className={`p-6 text-left transition-all relative rounded cursor-pointer ${
            selectedRegionId === 'majuli'
              ? 'card-outer-active border-l-4 !border-l-[#fca311] shadow-lg'
              : 'card-outer hover:border-[#e5e5e5]/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest uppercase text-[#e5e5e5]/50">Target A</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider box-inner text-[#e5e5e5]/70">
                Track 015 / Frame 3700
              </span>
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
              selectedRegionId === 'majuli'
                ? 'text-[#fca311] border border-[#fca311]/40 box-inner'
                : 'text-[#e5e5e5]/50 box-inner'
            }`}>
              Water Delineation
            </span>
          </div>

          <h3 className="text-xl font-editorial text-white font-normal mb-1">
            Majuli River Island Reach
          </h3>

          <p className="text-xs text-[#e5e5e5]/70 leading-relaxed font-light mb-4">
            High-resolution water classification outlining <strong className="text-white font-medium">13,821 extracted water polygons</strong> across the braided Brahmaputra channel and Subansiri confluence.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-outer)]">
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Pass Date</span>
              <strong className="text-white font-mono text-xs">27 Aug 2026</strong>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Water Area</span>
              <strong className={`font-mono text-base ${selectedRegionId === 'majuli' ? 'text-[#fca311] font-bold' : 'text-white'}`}>
                797.55 km²
              </strong>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Swath Coverage</span>
              <strong className="text-white font-mono text-xs">8.91% swath</strong>
            </div>
          </div>
        </button>

        {/* Study Area 2: Barpeta Reach */}
        <button
          type="button"
          onClick={() => onSelectRegion('barpeta')}
          className={`p-6 text-left transition-all relative rounded cursor-pointer ${
            selectedRegionId === 'barpeta'
              ? 'card-outer-active border-l-4 !border-l-[#fca311] shadow-lg'
              : 'card-outer hover:border-[#e5e5e5]/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest uppercase text-[#e5e5e5]/50">Target B</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider box-inner text-[#e5e5e5]/70">
                Track 019 / Frame 075
              </span>
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
              selectedRegionId === 'barpeta'
                ? 'text-[#fca311] border border-[#fca311]/40 box-inner'
                : 'text-[#e5e5e5]/50 box-inner'
            }`}>
              Multi-Date Comparison
            </span>
          </div>

          <h3 className="text-xl font-editorial text-white font-normal mb-1">
            Barpeta & Lower Floodplain
          </h3>

          <p className="text-xs text-[#e5e5e5]/70 leading-relaxed font-light mb-4">
            Multi-temporal water classification comparison detecting a <strong className="text-white font-medium">+140.77% surge in classified water area</strong> (+2.337 km² newly inundated land) across 12-day orbital repeat.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-outer)]">
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Repeat Interval</span>
              <strong className="text-white font-mono text-xs">12 Days</strong>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Water Surge</span>
              <strong className={`font-mono text-base ${selectedRegionId === 'barpeta' ? 'text-[#fca311] font-bold' : 'text-white'}`}>
                +140.77%
              </strong>
            </div>
            <div>
              <span className="text-[#e5e5e5]/50 block text-[9px] font-mono uppercase tracking-wider">Corridor</span>
              <strong className="text-white font-mono text-xs">9.152 km²</strong>
            </div>
          </div>
        </button>

      </div>

      {/* Optional Spatial Boundary Upload */}
      <div className="p-4 rounded card-outer flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#fca311]" />
          <span className="text-[#e5e5e5]/80 font-light">Custom Study Boundary (GeoJSON):</span>
          <span className="text-[10px] font-mono text-[#e5e5e5]/50 uppercase">RFC 7946 Polygon</span>
        </div>
        <label className="px-3 py-1.5 rounded box-inner hover:border-[#fca311] text-[#e5e5e5] hover:text-[#fca311] font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer">
          <span>{uploadedFileName || 'Upload .geojson'}</span>
          <input type="file" accept=".geojson,.json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
      {uploadFeedback && (
        <div className="text-[11px] font-mono text-[#fca311] pl-2">
          {uploadFeedback.message}
        </div>
      )}
    </div>
  );
}
