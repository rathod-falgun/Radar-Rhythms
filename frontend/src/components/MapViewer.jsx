import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, ImageOverlay, useMap, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Eye, EyeOff, Compass, Cloud, Radio, Sliders, ShieldAlert, Sparkles, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

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
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 });
    } else if (center) {
      map.setView([center.lat, center.lon], zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// In-memory cache so GeoJSON files are only downloaded once per session
let cachedMajuliGeoJson = null;
let cachedMajuliSummary = null;
let cachedBarpetaGeoJson = null;
let cachedBarpetaSummary = null;

// Verified GPS coordinates for Majuli landmarks (Track 015 / Frame 3700)
const MAJULI_LANDMARKS = [
  { name: 'Kamalabari Ghat', pos: [26.902, 94.175], desc: 'Brahmaputra main southern passenger ferry ghat' },
  { name: 'Garambur Embankment', pos: [26.963, 94.228], desc: 'Key flood control embankment and dyke sector' },
  { name: 'Subansiri Confluence', pos: [26.878, 93.885], desc: 'Northern braided confluence with Subansiri River' },
  { name: 'Kherkatia Suti', pos: [27.052, 94.435], desc: 'Northern braided bifurcation channel' },
];

// Verified GPS coordinates for Barpeta landmarks (Track 019 / Frame 075)
const BARPETA_LANDMARKS = [
  { name: 'Manas River Outfall', pos: [26.648, 91.102], desc: 'Confluence of Manas and Brahmaputra active flood corridor' },
  { name: 'Barpeta Embankment Sector', pos: [26.654, 91.118], desc: 'Critical flood control dyke and breach hazard sector' },
  { name: 'Brahmaputra South Floodplain', pos: [26.638, 91.095], desc: 'Low-lying agricultural chars submerged in 09 July event observation' },
  { name: 'Braided Lowland Chars', pos: [26.658, 91.112], desc: 'Active sandbars exhibiting +140.77% water expansion' },
];

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

  // Real Majuli GeoJSON and Summary State
  const [majuliGeoJson, setMajuliGeoJson] = useState(cachedMajuliGeoJson);
  const [majuliSummary, setMajuliSummary] = useState(cachedMajuliSummary);
  const [loadingMajuli, setLoadingMajuli] = useState(false);
  const [majuliError, setMajuliError] = useState(null);

  // Real Barpeta Change GeoJSON and Summary State
  const [barpetaGeoJson, setBarpetaGeoJson] = useState(cachedBarpetaGeoJson);
  const [barpetaSummary, setBarpetaSummary] = useState(cachedBarpetaSummary);
  const [loadingBarpeta, setLoadingBarpeta] = useState(false);
  const [barpetaError, setBarpetaError] = useState(null);
  const [showNewlyInundated, setShowNewlyInundated] = useState(true);
  const [showPersistentWater, setShowPersistentWater] = useState(true);

  const isMajuli = region?.id === 'majuli';
  const isBarpeta = region?.id === 'barpeta';

  // 1. Fetch real Majuli water boundaries when Majuli is selected
  useEffect(() => {
    if (!isMajuli) return;
    if (cachedMajuliGeoJson && cachedMajuliSummary) {
      setMajuliGeoJson(cachedMajuliGeoJson);
      setMajuliSummary(cachedMajuliSummary);
      return;
    }

    let isMounted = true;
    async function loadMajuliData() {
      setLoadingMajuli(true);
      setMajuliError(null);
      try {
        const [geojsonRes, summaryRes] = await Promise.all([
          fetch('/api/water/majuli/boundaries'),
          fetch('/api/water/majuli/summary')
        ]);

        if (!geojsonRes.ok) throw new Error(`HTTP ${geojsonRes.status}: Failed fetching boundaries`);
        if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}: Failed fetching summary`);

        const geojsonData = await geojsonRes.json();
        const summaryData = await summaryRes.json();

        cachedMajuliGeoJson = geojsonData;
        cachedMajuliSummary = summaryData;

        if (isMounted) {
          setMajuliGeoJson(geojsonData);
          setMajuliSummary(summaryData);
        }
      } catch (err) {
        console.error('Failed to load real Majuli water layer:', err);
        if (isMounted) {
          setMajuliError(err.message || 'Error loading Majuli water classification');
        }
      } finally {
        if (isMounted) {
          setLoadingMajuli(false);
        }
      }
    }

    loadMajuliData();
    return () => { isMounted = false; };
  }, [isMajuli]);

  // 2. Fetch real Barpeta change boundaries when Barpeta is selected
  useEffect(() => {
    if (!isBarpeta) return;
    if (cachedBarpetaGeoJson && cachedBarpetaSummary) {
      setBarpetaGeoJson(cachedBarpetaGeoJson);
      setBarpetaSummary(cachedBarpetaSummary);
      return;
    }

    let isMounted = true;
    async function loadBarpetaData() {
      setLoadingBarpeta(true);
      setBarpetaError(null);
      try {
        const [geojsonRes, summaryRes] = await Promise.all([
          fetch('/api/flood/barpeta/boundaries'),
          fetch('/api/flood/barpeta/summary')
        ]);

        if (!geojsonRes.ok) throw new Error(`HTTP ${geojsonRes.status}: Failed fetching Barpeta change boundaries`);
        if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}: Failed fetching Barpeta summary`);

        const geojsonData = await geojsonRes.json();
        const summaryData = await summaryRes.json();

        cachedBarpetaGeoJson = geojsonData;
        cachedBarpetaSummary = summaryData;

        if (isMounted) {
          setBarpetaGeoJson(geojsonData);
          setBarpetaSummary(summaryData);
        }
      } catch (err) {
        console.error('Failed to load Barpeta change layer:', err);
        if (isMounted) {
          setBarpetaError(err.message || 'Error loading Barpeta flood change layer');
        }
      } finally {
        if (isMounted) {
          setLoadingBarpeta(false);
        }
      }
    }

    loadBarpetaData();
    return () => { isMounted = false; };
  }, [isBarpeta]);

  // 3. Generate georeferenced flood overlay image URL from comparison raster (non-Majuli/Barpeta demo reaches)
  useEffect(() => {
    if (!comparisonData || !comparisonData.raster_data || isMajuli || isBarpeta) return;

    const { classification_mask } = comparisonData.raster_data;
    if (!classification_mask || !classification_mask.length) return;
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
  }, [comparisonData, isMajuli, isBarpeta]);

  if (!region) return null;

  let centerCoords = [region.center?.lat || 26.65, region.center?.lon || 93.35];
  let regionBounds = region.bounds;

  if (isMajuli) {
    centerCoords = [26.901, 94.104];
    regionBounds = [[26.49561, 93.59687], [27.30636, 94.61117]];
  } else if (isBarpeta) {
    centerCoords = [26.645, 91.105];
    regionBounds = [[26.63, 91.09], [26.66, 91.12]];
  }

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    satellite: '&copy; Esri &mdash; Earthstar Geographics',
    dark: '&copy; OpenStreetMap contributors &copy; CARTO',
    street: '&copy; OpenStreetMap contributors',
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full font-sans">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            {isMajuli
              ? 'Real NISAR Water Classification Layer (Majuli Island)'
              : isBarpeta
              ? 'Multi-Temporal NISAR Flood Change Vector Layer (+140.77% Surge)'
              : 'Interactive SAR Satellite Flood Map'}
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {isMajuli
              ? 'Track 015 / Frame 3700'
              : 'Track 019 / Frame 075'}
          </span>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Base Layer Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center">
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
                ? isBarpeta
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showInundationLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isMajuli ? 'NISAR Water Layer' : isBarpeta ? 'Change Vectors' : 'Flood Overlay'}</span>
          </button>

          {isBarpeta && showInundationLayer && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setShowNewlyInundated(!showNewlyInundated)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  showNewlyInundated
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-700 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Newly Inundated active floodwater (+2.337 km²)"
              >
                ● Flood (+2.34 km²)
              </button>
              <button
                onClick={() => setShowPersistentWater(!showPersistentWater)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  showPersistentWater
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Persistent river channel (1.660 km²)"
              >
                ● Channel (1.66 km²)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="w-full h-[450px] rounded-lg overflow-hidden border border-slate-700 relative z-10">
        <MapContainer
          center={centerCoords}
          zoom={region.zoom || 11}
          scrollWheelZoom={true}
          preferCanvas={true}
          className="w-full h-full"
        >
          <MapRecenter center={{ lat: centerCoords[0], lon: centerCoords[1] }} zoom={region.zoom || 11} bounds={regionBounds} />

          <TileLayer
            url={tileUrls[baseLayer]}
            attribution={tileAttributions[baseLayer]}
            maxZoom={18}
          />

          {/* 1. REAL MAJULI NISAR EXTRACTED GEOJSON VECTOR LAYER (13,821 Polygons) */}
          {isMajuli && showInundationLayer && majuliGeoJson && (
            <GeoJSON
              key={`majuli-real-water-${layerOpacity}`}
              data={majuliGeoJson}
              style={() => ({
                color: '#0284c7',
                weight: 0.6,
                fillColor: '#00d2ff',
                fillOpacity: layerOpacity,
              })}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const areaHa = props.area_ha ? props.area_ha.toFixed(2) : (props.area_m2 ? (props.area_m2 / 10000).toFixed(2) : 'N/A');
                const areaKm2 = props.area_km2 ? props.area_km2.toFixed(4) : (props.area_m2 ? (props.area_m2 / 1e6).toFixed(4) : 'N/A');
                layer.bindTooltip(
                  `<div class="p-1 font-sans text-xs text-slate-900 leading-snug">
                    <strong class="text-sky-900 flex items-center gap-1">
                      <span>NISAR Water Feature #${props.feature_id || ''}</span>
                    </strong>
                    <div class="mt-0.5">Area: <strong>${areaHa} ha</strong> (${areaKm2} km²)</div>
                    <div class="text-[10px] text-sky-700 font-mono mt-0.5">Track 015 / Frame 3700 • HHHH Single-Pol</div>
                  </div>`,
                  { sticky: true }
                );
              }}
            />
          )}

          {/* 2. REAL BARPETA MULTI-TEMPORAL CHANGE VECTORS (4-Class Matrix) */}
          {isBarpeta && showInundationLayer && barpetaGeoJson && (
            <GeoJSON
              key={`barpeta-real-change-${layerOpacity}-${showNewlyInundated}-${showPersistentWater}`}
              data={barpetaGeoJson}
              filter={(feature) => {
                const p = feature.properties || {};
                const isNew = p.is_inundation || p.class_code === 2;
                const isPersistent = p.is_persistent || p.class_code === 1;
                if (isNew && !showNewlyInundated) return false;
                if (isPersistent && !showPersistentWater) return false;
                return true;
              }}
              style={(feature) => {
                const p = feature.properties || {};
                const isNew = p.is_inundation || p.class_code === 2;
                const isPersistent = p.is_persistent || p.class_code === 1;

                if (isNew) {
                  return {
                    color: '#ff6b81',
                    weight: 2,
                    fillColor: '#f43f5e', // Vibrant Rose/Red
                    fillOpacity: layerOpacity,
                  };
                }
                if (isPersistent) {
                  return {
                    color: '#5ce1e6',
                    weight: 2,
                    fillColor: '#00d2ff', // Cyan
                    fillOpacity: layerOpacity,
                  };
                }
                return {
                  color: '#fbbf24',
                  weight: 1.5,
                  fillColor: '#f59e0b',
                  fillOpacity: layerOpacity,
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const className = p.class_name || (p.class_code === 2 ? 'Newly Inundated (Flood Surge)' : 'Persistent Water');
                const areaKm2 = p.area_km2 ? p.area_km2.toFixed(3) : (p.area_m2 ? (p.area_m2 / 1e6).toFixed(3) : 'N/A');
                const areaHa = p.area_ha ? p.area_ha.toFixed(1) : (p.area_m2 ? (p.area_m2 / 10000).toFixed(1) : 'N/A');

                layer.bindTooltip(
                  `<div class="p-1 font-sans text-xs text-slate-900 leading-snug">
                    <strong style="color: ${p.class_code === 2 ? '#e11d48' : '#0284c7'}">${className}</strong>
                    <div class="mt-0.5">Area: <strong>${areaKm2} km²</strong> (${areaHa} ha)</div>
                    <div class="text-[10px] text-slate-600 font-mono mt-0.5">Track 019 / Frame 075 • 12-Day Revisit</div>
                  </div>`,
                  { sticky: true }
                );

                layer.bindPopup(
                  `<div class="text-xs text-slate-900 p-1 font-sans">
                    <h4 class="font-bold" style="color: ${p.class_code === 2 ? '#e11d48' : '#0284c7'}">${className}</h4>
                    <div class="text-slate-600 text-[11px] mt-1">
                      Feature ID: #${p.feature_id || 'N/A'}<br/>
                      Area: <strong>${areaKm2} km²</strong> (${areaHa} hectares)<br/>
                      Change Interval: 27 June ➔ 09 July 2026 (12 Days)<br/>
                      Sensor: NISAR Level-2 GCOV (Track 019 / Frame 075)
                    </div>
                  </div>`
                );
              }}
            />
          )}

          {/* 3. DEMO RASTER OVERLAY FOR OTHER REACHES */}
          {!isMajuli && !isBarpeta && showInundationLayer && overlayDataUrl && regionBounds && (
            <ImageOverlay
              url={overlayDataUrl}
              bounds={regionBounds}
              opacity={layerOpacity}
            />
          )}

          {/* Monitored Swath Bounding Box */}
          {regionBounds && (
            <Polygon
              positions={[
                [regionBounds[0][0], regionBounds[0][1]],
                [regionBounds[0][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[1][1]],
                [regionBounds[1][0], regionBounds[0][1]],
              ]}
              pathOptions={{
                color: isBarpeta ? '#f43f5e' : '#00d2ff',
                weight: 2,
                fillColor: 'transparent',
                dashArray: '5, 5',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1 font-mono text-slate-900">
                  {isMajuli
                    ? 'NISAR Track 015 / Frame 3700 Extracted Swath Window (8,955.16 km² UTM 46N)'
                    : isBarpeta
                    ? 'NISAR Track 019 / Frame 075 Barpeta Reach Corridor (9.152 km²)'
                    : 'Track 019 / Frame 075 Monitored Reach Extent'}
                </div>
              </Tooltip>
            </Polygon>
          )}

          {/* Critical Landmarks */}
          {isMajuli &&
            MAJULI_LANDMARKS.map((lm, idx) => (
              <Marker
                key={lm.name}
                position={lm.pos}
                icon={createCustomIcon(idx === 0 ? '#f43f5e' : '#00d2ff', lm.name)}
              >
                <Popup>
                  <div className="text-xs text-slate-900 p-1 font-sans">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {lm.name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{lm.desc}</div>
                    <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                      {lm.pos[0].toFixed(3)}°N, {lm.pos[1].toFixed(3)}°E • Track 015
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {isBarpeta &&
            BARPETA_LANDMARKS.map((lm, idx) => (
              <Marker
                key={lm.name}
                position={lm.pos}
                icon={createCustomIcon(idx === 0 ? '#f43f5e' : '#00d2ff', lm.name)}
              >
                <Popup>
                  <div className="text-xs text-slate-900 p-1 font-sans">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {lm.name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{lm.desc}</div>
                    <div className="text-[10px] text-rose-700 font-mono mt-0.5">
                      {lm.pos[0].toFixed(3)}°N, {lm.pos[1].toFixed(3)}°E • Track 019 (+140.77%)
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {!isMajuli && !isBarpeta &&
            region.key_features?.map((feat, idx) => {
              const latOffset = (idx - 1) * 0.06;
              const lonOffset = idx % 2 === 0 ? 0.08 : -0.08;
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
            <span className="text-[11px] text-slate-400">Opacity:</span>
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

        {/* Loading Overlay */}
        {((isMajuli && loadingMajuli) || (isBarpeta && loadingBarpeta)) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <span className="text-sm font-bold text-white">
              {isMajuli ? 'Loading Real Majuli Water Classification...' : 'Loading Barpeta Flood Change Vectors...'}
            </span>
            <span className="text-xs text-slate-400 font-mono mt-1">
              {isMajuli
                ? 'Rendering 13,821 georeferenced polygons (797.55 km² • Track 015 / Frame 3700)'
                : 'Rendering 4-class flood change matrix (+140.77% • Track 019 / Frame 075)'}
            </span>
          </div>
        )}

        {/* Floating Real Majuli Scientific Legend */}
        {isMajuli && !loadingMajuli && (
          <div className="absolute bottom-10 right-3 bg-[#0d131f]/95 border border-cyan-500/60 rounded-xl p-3 text-xs text-slate-200 z-[1000] shadow-2xl backdrop-blur max-w-xs space-y-1.5 font-sans pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified NISAR Water Extent</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Track 015 / Frame 3700
              </span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Measured Water:</span>
              <span className="text-white font-bold">797.55 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Extracted Polygons:</span>
              <span className="text-cyan-300 font-bold">13,821 Features</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Swath Coverage:</span>
              <span className="text-emerald-400 font-bold">8.91% of 8,955.16 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Observation Date:</span>
              <span className="text-slate-200">2026-08-27 (Post-Peak)</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight pt-1.5 border-t border-slate-800/80">
              <span className="text-amber-300 font-semibold">Methodology Disclosure: </span>
              Single-polarization HHHH backscatter (Adaptive Bimodal Otsu: -15.0 dB + Lee filter). Cross-pol (HVHV) & official quality mask deferred.
            </div>
          </div>
        )}

        {/* Floating Real Barpeta Scientific Legend */}
        {isBarpeta && !loadingBarpeta && (
          <div className="absolute bottom-10 right-3 bg-[#1a0f18]/95 border border-rose-500/60 rounded-xl p-3 text-xs text-slate-200 z-[1000] shadow-2xl backdrop-blur max-w-xs space-y-1.5 font-sans pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified Flood Surge (+140.77%)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                Track 019 / Frame 075
              </span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">T1 Baseline (27 Jun):</span>
              <span className="text-emerald-400 font-bold">1.660 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">T2 Event (09 Jul):</span>
              <span className="text-rose-400 font-bold">3.997 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Newly Inundated Land:</span>
              <span className="text-rose-300 font-bold">+2.337 km² (+140.77%)</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Persistent Channel:</span>
              <span className="text-cyan-300 font-bold">1.660 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Total Evaluated Area:</span>
              <span className="text-slate-200">9.152 km²</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight pt-1.5 border-t border-slate-800/80">
              <span className="text-rose-400 font-semibold">Attribution Note: </span>
              This +140.77% surge belongs strictly to the Barpeta reach corridor (Track 019) across 12-day repeat geometry. Does NOT apply to Majuli.
            </div>
          </div>
        )}

        {/* Floating Telemetry Badge */}
        <div className="absolute bottom-2 left-2 bg-[#0d131f]/90 border border-slate-700 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono z-[1000] backdrop-blur pointer-events-none">
          {isMajuli
            ? 'NISAR Track 015 / Frame 3700 • UTM Zone 46N (EPSG:32646) • Pixel: 10 m • 8,955.16 km² Swath'
            : isBarpeta
            ? 'NISAR Track 019 / Frame 075 • 12-Day Interval (27 Jun vs 09 Jul) • Single-Pol HHHH • +140.77%'
            : 'NISAR Track 019 / Frame 075 • UTM Zone 46N (EPSG:32646) • Pixel: 25 m • 240 km Swath'}
        </div>
      </div>
    </div>
  );
}
