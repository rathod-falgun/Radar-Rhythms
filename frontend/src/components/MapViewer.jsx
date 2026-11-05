import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Eye, Compass, ShieldAlert } from 'lucide-react';

// Fix default leaflet marker icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom component to pan/zoom map dynamically when region changes
function MapRecenter({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
    } else if (center) {
      map.setView([center.lat, center.lon], zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function MapViewer({ region, comparisonData, baselineDate, eventDate }) {
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite', 'dark', 'street'
  const [showInundationOverlay, setShowInundationOverlay] = useState(true);

  if (!region) return null;

  const centerCoords = [region.center.lat, region.center.lon];
  const regionBounds = region.bounds;

  // Tile layer URLs
  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    dark: '&copy; <a href="https://carto.com/">CARTO</a>',
    street: '&copy; OpenStreetMap contributors',
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Geographic GIS Context & Inundation Footprint
          </h3>
          <span className="text-xs text-slate-400 font-mono">({region.name})</span>
        </div>

        {/* Basemap Switcher & Overlay Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setBaseLayer('satellite')}
              className={`px-2 py-0.5 rounded font-medium ${
                baseLayer === 'satellite'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseLayer('dark')}
              className={`px-2 py-0.5 rounded font-medium ${
                baseLayer === 'dark'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Radar
            </button>
            <button
              onClick={() => setBaseLayer('street')}
              className={`px-2 py-0.5 rounded font-medium ${
                baseLayer === 'street'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>

          <button
            onClick={() => setShowInundationOverlay(!showInundationOverlay)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showInundationOverlay
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>NISAR Swath Boundary</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-700 relative z-10">
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

          {/* Region Bounding Box Overlay */}
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
                fillColor: '#00d2ff',
                fillOpacity: 0.08,
                dashArray: '4, 4',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <div className="font-bold text-cyan-400">{region.name}</div>
                  <div>Area: {region.area_km2} km²</div>
                  <div>Vulnerability: {region.vulnerability}</div>
                </div>
              </Tooltip>
            </Polygon>
          )}

          {/* Region Center Marker */}
          <Marker position={centerCoords}>
            <Popup>
              <div className="text-xs text-slate-900 p-1">
                <h4 className="font-bold text-sm text-blue-900 mb-1">{region.name}</h4>
                <p className="text-slate-700 mb-2">{region.description}</p>
                <div className="font-semibold text-rose-700">
                  ⚠️ Status: {region.vulnerability}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Coordinates: {region.center.lat.toFixed(3)}°N, {region.center.lon.toFixed(3)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Map Watermark & Telemetry */}
        <div className="absolute bottom-2 left-2 bg-[#0d131f]/90 border border-slate-700 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono z-[1000] backdrop-blur pointer-events-none">
          UTM Zone 46N (EPSG:32646) • Swath Track 019 / Frame 075
        </div>
      </div>
    </div>
  );
}
