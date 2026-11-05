import React, { useState, useRef, useEffect } from 'react';
import { Eye, MoveHorizontal, SlidersHorizontal, Sparkles, Layers } from 'lucide-react';

export default function SwipeSlider({
  comparisonData,
  baselineDate,
  eventDate,
  mode = 'radar_vs_flood' // 'radar_vs_radar' or 'radar_vs_flood'
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('radar_vs_flood');
  const containerRef = useRef(null);
  const canvasBaseRef = useRef(null);
  const canvasEventRef = useRef(null);

  // Render SAR backscatter / Classification into Canvas
  useEffect(() => {
    if (!comparisonData || !comparisonData.raster_data) return;

    const { baseline_hh_db, event_hh_db, classification_mask } = comparisonData.raster_data;
    const dim = baseline_hh_db.length;

    // Helper: decibel to grayscale
    const dbToGray = (db) => {
      // Map -25 dB (black/water) to -5 dB (white/bright land/vegetation)
      const norm = Math.max(0, Math.min(1, (db - (-25)) / (20)));
      return Math.floor(norm * 255);
    };

    // Draw Baseline Canvas
    if (canvasBaseRef.current) {
      const ctx = canvasBaseRef.current.getContext('2d');
      const imgData = ctx.createImageData(dim, dim);
      for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
          const idx = (y * dim + x) * 4;
          const val = dbToGray(baseline_hh_db[y][x]);
          // Radar false color tint (cool blue/slate)
          imgData.data[idx] = Math.floor(val * 0.7);     // R
          imgData.data[idx + 1] = Math.floor(val * 0.9); // G
          imgData.data[idx + 2] = val;                   // B
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Draw Event / Classification Canvas
    if (canvasEventRef.current) {
      const ctx = canvasEventRef.current.getContext('2d');
      const imgData = ctx.createImageData(dim, dim);

      for (let y = 0; y < dim; y++) {
        for (let x = 0; x < dim; x++) {
          const idx = (y * dim + x) * 4;

          if (viewMode === 'radar_vs_radar') {
            const val = dbToGray(event_hh_db[y][x]);
            imgData.data[idx] = Math.floor(val * 0.7);
            imgData.data[idx + 1] = Math.floor(val * 0.9);
            imgData.data[idx + 2] = val;
            imgData.data[idx + 3] = 255;
          } else {
            // Inundation Class Color Palette
            const cls = classification_mask[y][x];
            if (cls === 1) {
              // Permanent Water (Deep Sapphire Blue)
              imgData.data[idx] = 16;
              imgData.data[idx + 1] = 64;
              imgData.data[idx + 2] = 180;
              imgData.data[idx + 3] = 240;
            } else if (cls === 2) {
              // Newly Inundated Open Flood (Bright Crimson Neon Red)
              imgData.data[idx] = 255;
              imgData.data[idx + 1] = 24;
              imgData.data[idx + 2] = 68;
              imgData.data[idx + 3] = 250;
            } else if (cls === 3) {
              // Marginal Inundation / Saturated Soil (Amber/Orange)
              imgData.data[idx] = 255;
              imgData.data[idx + 1] = 170;
              imgData.data[idx + 2] = 0;
              imgData.data[idx + 3] = 210;
            } else if (cls === 4) {
              // Flooded Vegetation Double-Bounce (Neon Emerald Green)
              imgData.data[idx] = 50;
              imgData.data[idx + 1] = 240;
              imgData.data[idx + 2] = 100;
              imgData.data[idx + 3] = 240;
            } else {
              // Unchanged dry land (Radar dim slate background)
              const val = Math.floor(dbToGray(event_hh_db[y][x]) * 0.45);
              imgData.data[idx] = val;
              imgData.data[idx + 1] = val + 10;
              imgData.data[idx + 2] = val + 20;
              imgData.data[idx + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }, [comparisonData, viewMode]);

  // Handle Dragging
  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MoveHorizontal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            3. Interactive Before-and-After Swipe Comparator
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('radar_vs_flood')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'radar_vs_flood'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Baseline SAR vs Inundation Map
          </button>
          <button
            onClick={() => setViewMode('radar_vs_radar')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'radar_vs_radar'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct SAR Backscatter (HH dB)
          </button>
        </div>
      </div>

      {/* Swipe Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-video md:aspect-[2.2/1] rounded-lg overflow-hidden border border-slate-700 bg-black cursor-col-resize select-none"
      >
        {/* Right Canvas (Event Scene / Inundation) */}
        <div className="absolute inset-0 w-full h-full">
          <canvas
            ref={canvasEventRef}
            width={120}
            height={120}
            className="w-full h-full object-cover image-rendering-pixelated"
          />
          <div className="absolute top-3 right-3 bg-rose-950/90 text-rose-300 text-xs px-2.5 py-1 rounded-md font-mono border border-rose-800 backdrop-blur pointer-events-none">
            {viewMode === 'radar_vs_flood' ? 'Event: Inundation Map' : `Event: ${eventDate}`}
          </div>
        </div>

        {/* Left Canvas (Baseline Scene) - Clipped by Slider */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="relative w-full h-full" style={{ width: containerRef.current?.clientWidth || '100%' }}>
            <canvas
              ref={canvasBaseRef}
              width={120}
              height={120}
              className="w-full h-full object-cover image-rendering-pixelated"
            />
          </div>
          <div className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-300 text-xs px-2.5 py-1 rounded-md font-mono border border-emerald-800 backdrop-blur pointer-events-none">
            Baseline: {baselineDate} (Pre-Flood)
          </div>
        </div>

        {/* Slider Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.9)] cursor-col-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/50">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-300 font-medium">Map Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
            <span>Permanent Water</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
            <span className="text-rose-300 font-semibold">Newly Inundated Land</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
            <span>Marginal Water / Wet Soil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-400"></span>
            <span>Flooded Vegetation (Double-Bounce)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          💡 Drag cursor/finger across the viewer to swipe between dates
        </div>
      </div>
    </div>
  );
}

