import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, ImageOverlay, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Eye, EyeOff, Compass, Cloud, Radio, Sliders, ShieldAlert, Sparkles } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom landmark marker icons
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

function MapRecenter({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 12 });
    } else if (center) {
      map.setView([center.lat, center.lon], zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function MapViewer({
  region,
  comparisonData,
  baselineDate,
  eventDate,
  persona = 'disaster' // 'student', 'disaster', 'scientist'
}) {
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite', 'dark', 'street'
  const [showInundationLayer, setShowInundationLayer] = useState(true);
  const [showOpticalClouds, setShowOpticalClouds] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState(0.75);
  const [overlayDataUrl, setOverlayDataUrl] = useState(null);

  // Generate georeferenced flood overlay image URL from comparison raster
  useEffect(() => {
    if (!comparisonData || !comparisonData.raster_data) return;

    const { classification_mask } = comparisonData.raster_data;
    const dim = classification_mask.length;

    const canvas = document.createElement('canvas');
    canvas.width = dim;
    canvas.height = dim;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(dim, dim);

    for (let y = 0; y < dim; y++) {
      for (let x = 0; x < dim; x++) {
        const idx = (y * dim + x) * 4;
        const cls = classification_mask[y][x];

        if (cls === 1) {
          // Permanent Water (Deep Blue)
          imgData.data[idx] = 20;
          imgData.data[idx + 1] = 80;
          imgData.data[idx + 2] = 220;
          imgData.data[idx + 3] = 210;
        } else if (cls === 2) {
          // Newly Inundated Open Flood (Bright Crimson)
          imgData.data[idx] = 244;
          imgData.data[idx + 1] = 30;
          imgData.data[idx + 2] = 80;
          imgData.data[idx + 3] = 230;
        } else if (cls === 3) {
          // Marginal / Saturated (Amber)
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = 180;
          imgData.data[idx + 2] = 0;
          imgData.data[idx + 3] = 200;
        } else if (cls === 4) {
          // Flooded Vegetation Double-Bounce (Neon Emerald)
          imgData.data[idx] = 52;
          imgData.data[idx + 1] = 235;
          imgData.data[idx + 2] = 120;
          imgData.data[idx + 3] = 220;
        } else {
          // Transparent for dry land
          imgData.data[idx] = 0;
          imgData.data[idx + 1] = 0;
          imgData.data[idx + 2] = 0;
          imgData.data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setOverlayDataUrl(canvas.toDataURL());
  }, [comparisonData]);

  if (!region) return null;

  const centerCoords = [region.center.lat, region.center.lon];
  const regionBounds = region.bounds;

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    dark: '&copy; CARTO &copy; OpenStreetMap',
    street: '&copy; OpenStreetMap contributors',
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col relative">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            Geographic GIS Context
            <span className="text-cyan-400 font-mono text-xs font-normal">({region.name.split('&')[0]})</span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Cloud Cover Simulation Toggle (Showcasing SAR value proposition) */}
          <button
            onClick={() => setShowOpticalClouds(!showOpticalClouds)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showOpticalClouds
                ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-md shadow-amber-900/40 ring-1 ring-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Simulate optical satellite view (obscured by monsoon clouds) vs active SAR view"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{showOpticalClouds ? 'Optical: Clouded View' : 'Compare: Optical Cloud Cover'}</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setBaseLayer('satellite')}
              className={`px-2 py-0.5 rounded font-medium ${
                baseLayer === 'satellite' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseLayer('dark')}
              className={`px-2 py-0.5 rounded font-medium ${
                baseLayer === 'dark' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
          </div>

          {/* Toggle Flood Layer */}
          <button
            onClick={() => setShowInundationLayer(!showInundationLayer)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showInundationLayer
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showInundationLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Flood Overlay</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="w-full h-[420px] rounded-lg overflow-hidden border border-slate-700 relative z-10">
        <MapContainer
          center={centerCoords}
          zoom={region.zoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapRecenter center={region.center} zoom={region.zoom} bounds={regionBounds} />

          <TileLayer
            url={tileUrls[baseLayer]}
            attribution={tileAttributions[baseLayer]}
            maxZoom={18}
          />

          {/* Real Georeferenced NISAR Inundation Mask Overlay */}
          {showInundationLayer && overlayDataUrl && regionBounds && (
            <ImageOverlay
              url={overlayDataUrl}
              bounds={regionBounds}
              opacity={layerOpacity}
            />
          )}

          {/* Optical Cloud Simulation Layer (Demonstrating Why SAR Is Mandatory) */}
          {showOpticalClouds && regionBounds && (
            <Polygon
              positions={[
                [regionBounds[0][0], regionBounds[0][1]],
                [regionBounds[0][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[0][1]],
              ]}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#f1f5f9',
                fillOpacity: 0.92,
                weight: 1,
              }}
            >
              <Tooltip sticky permanent>
                <div className="text-xs p-1 text-slate-900 font-sans">
                  <strong>☁️ Optical Satellite (Sentinel-2 / Landsat): Blinded</strong>
                  <div className="text-[10px] text-slate-600">
                    100% cloud cover over Brahmaputra. Ground completely obscured.
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          )}

          {/* Region Bounding Swath Box */}
          {regionBounds && (
            <Polygon
              positions={[
                [regionBounds[0][0], regionBounds[0][1]],
                [regionBounds[0][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[0][1]],
              ]}
              pathOptions={{
                color: '#00d2ff',
                weight: 2,
                fillColor: 'transparent',
                dashArray: '5, 5',
              }}
            />
          )}

          {/* Critical River Feature Pins */}
          {region.key_features?.map((feat, idx) => {
            // Distribute markers along bounding reach
            const latOffset = (idx - 1) * 0.06;
            const lonOffset = (idx % 2 === 0 ? 0.08 : -0.08);
            const pos = [region.center.lat + latOffset, region.center.lon + lonOffset];

            return (
              <Marker
                key={feat}
                position={pos}
                icon={createCustomIcon(idx === 0 ? '#f43f5e' : '#00d2ff', feat)}
              >
                <Popup>
                  <div className="text-xs text-slate-900 p-1 font-sans">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {feat}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Monitored by NISAR Track 019 / Frame 075
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                      {pos[0].toFixed(3)}°N, {pos[1].toFixed(3)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Opacity Slider */}
        {showInundationLayer && (
          <div className="absolute top-3 left-3 bg-[#0d131f]/90 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 font-sans z-[1000] backdrop-blur flex items-center gap-2 shadow-lg">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Overlay Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-[10px] text-cyan-300">{Math.round(layerOpacity * 100)}%</span>
          </div>
        )}

        {/* Floating Telemetry Badge */}
        <div className="absolute bottom-2 left-2 bg-[#0d131f]/90 border border-slate-700 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono z-[1000] backdrop-blur pointer-events-none">
          UTM Zone 46N (EPSG:32646) • Resolution: 25 m • Swath: 240 km
        </div>
      </div>
    </div>
  );
}
