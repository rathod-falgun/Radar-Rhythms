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
  persona = 'disaster'
}) {
  const [baseLayer, setBaseLayer] = useState('satellite'); // 'satellite', 'street', 'light'
  const [showInundationLayer, setShowInundationLayer] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState(0.85);
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

  // 3. Demo overlay generation for other reaches
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
          // Newly Inundated (Bright Crimson)
          imgData.data[idx] = 244;
          imgData.data[idx + 1] = 30;
          imgData.data[idx + 2] = 80;
          imgData.data[idx + 3] = 230;
        } else if (cls === 3) {
          // Marginal
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = 180;
          imgData.data[idx + 2] = 0;
          imgData.data[idx + 3] = 200;
        } else if (cls === 4) {
          // Flooded Vegetation
          imgData.data[idx] = 52;
          imgData.data[idx + 1] = 235;
          imgData.data[idx + 2] = 120;
          imgData.data[idx + 3] = 220;
        } else {
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
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  };

  const tileAttributions = {
    satellite: '&copy; Esri &mdash; Earthstar Geographics',
    street: '&copy; OpenStreetMap contributors',
    light: '&copy; OpenStreetMap contributors &copy; CARTO',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col h-full font-sans">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {isMajuli
              ? 'Real NISAR Water Classification Layer (Majuli Island)'
              : isBarpeta
              ? 'Multi-Temporal NISAR Water Change Vector Layer (+140.77% Increase in Corridor)'
              : 'Interactive SAR Satellite Flood Map'}
          </h3>
          <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-semibold">
            {isMajuli ? 'Track 015 / Frame 3700' : 'Track 019 / Frame 075'}
          </span>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Base Layer Switcher */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setBaseLayer('satellite')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                baseLayer === 'satellite' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseLayer('street')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                baseLayer === 'street' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setBaseLayer('light')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                baseLayer === 'light' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Light
            </button>
          </div>

          {/* Toggle Flood Layer */}
          <button
            onClick={() => setShowInundationLayer(!showInundationLayer)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
              showInundationLayer
                ? isBarpeta
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {showInundationLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isMajuli ? 'NISAR Water Layer' : isBarpeta ? 'Change Vectors' : 'Flood Overlay'}</span>
          </button>

          {isBarpeta && showInundationLayer && (
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setShowNewlyInundated(!showNewlyInundated)}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  showNewlyInundated
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Toggle Newly Inundated active floodwater (+2.337 km²)"
              >
                ● Flood (+2.34 km²)
              </button>
              <button
                onClick={() => setShowPersistentWater(!showPersistentWater)}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  showPersistentWater
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
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
      <div className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-200 relative z-10 shadow-inner">
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
                weight: 0.8,
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
                    color: '#e11d48',
                    weight: 2,
                    fillColor: '#f43f5e',
                    fillOpacity: layerOpacity,
                  };
                }
                if (isPersistent) {
                  return {
                    color: '#0284c7',
                    weight: 2,
                    fillColor: '#00d2ff',
                    fillOpacity: layerOpacity,
                  };
                }
                return {
                  color: '#d97706',
                  weight: 1.5,
                  fillColor: '#f59e0b',
                  fillOpacity: layerOpacity,
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const className = p.class_name || (p.class_code === 2 ? 'Newly Inundated Water' : 'Persistent Water');
                const areaKm2 = p.area_km2 ? p.area_km2.toFixed(3) : (p.area_m2 ? (p.area_m2 / 1e6).toFixed(3) : 'N/A');
                const areaHa = p.area_ha ? p.area_ha.toFixed(1) : (p.area_m2 ? (p.area_m2 / 10000).toFixed(1) : 'N/A');

                layer.bindTooltip(
                  `<div class="p-1 font-sans text-xs text-slate-900 leading-snug">
                    <strong style="color: ${p.class_code === 2 ? '#e11d48' : '#0284c7'}">${className}</strong>
                    <div class="mt-0.5">Area: <strong>${areaKm2} km²</strong> (${areaHa} ha)</div>
                    <div class="text-[10px] text-slate-600 font-mono mt-0.5">Track 019 / Frame 075 • 12-Day Interval</div>
                  </div>`,
                  { sticky: true }
                );

                layer.bindPopup(
                  `<div class="text-xs text-slate-900 p-1 font-sans">
                    <h4 class="font-bold" style="color: ${p.class_code === 2 ? '#e11d48' : '#0284c7'}">${className}</h4>
                    <div class="text-slate-600 text-[11px] mt-1">
                      Feature ID: #${p.feature_id || 'N/A'}<br/>
                      Area: <strong>${areaKm2} km²</strong> (${areaHa} hectares)<br/>
                      Interval: 27 June ➔ 09 July 2026 (12 Days)<br/>
                      Sensor: NISAR Level-2 GCOV (Track 019)
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
                color: isBarpeta ? '#f43f5e' : '#0284c7',
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
                icon={createCustomIcon(idx === 0 ? '#e11d48' : '#0284c7', lm.name)}
              >
                <Popup>
                  <div className="text-xs text-slate-900 p-1 font-sans">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {lm.name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{lm.desc}</div>
                    <div className="text-[10px] text-sky-700 font-mono mt-0.5">
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
                icon={createCustomIcon(idx === 0 ? '#e11d48' : '#0284c7', lm.name)}
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
        </MapContainer>

        {/* Floating Opacity Slider */}
        {showInundationLayer && (
          <div className="absolute top-3 left-3 bg-white/95 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-sans z-[1000] backdrop-blur flex items-center gap-2 shadow-md">
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[11px] text-slate-500 font-medium">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <span className="font-mono text-[10px] text-sky-700 font-bold">{Math.round(layerOpacity * 100)}%</span>
          </div>
        )}

        {/* Loading Overlay */}
        {((isMajuli && loadingMajuli) || (isBarpeta && loadingBarpeta)) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-[1000] flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
            <span className="text-sm font-bold text-slate-900">
              {isMajuli ? 'Rendering 13,821 Classified Water Polygons...' : 'Rendering Barpeta Flood Change Vectors...'}
            </span>
            <span className="text-xs text-slate-500 font-mono mt-1">
              {isMajuli
                ? 'Track 015 / Frame 3700 • 797.55 km² Water Extent'
                : 'Track 019 / Frame 075 • +140.77% Water Area Increase'}
            </span>
          </div>
        )}

        {/* Floating Real Majuli Scientific Legend */}
        {isMajuli && !loadingMajuli && (
          <div className="absolute bottom-8 right-3 bg-white/95 border border-sky-300 rounded-xl p-3 text-xs text-slate-800 z-[1000] shadow-lg backdrop-blur max-w-xs space-y-1.5 font-sans pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified NISAR Water Extent</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
                Track 015
              </span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Water Extent:</span>
              <span className="text-slate-900 font-bold">797.55 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Water Polygons:</span>
              <span className="text-sky-700 font-bold">13,821 Features</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Swath Coverage:</span>
              <span className="text-emerald-700 font-bold">8.91% of 8,955.16 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Observation Date:</span>
              <span className="text-slate-700">2026-08-27 (Post-Peak)</span>
            </div>
          </div>
        )}

        {/* Floating Real Barpeta Scientific Legend */}
        {isBarpeta && !loadingBarpeta && (
          <div className="absolute bottom-8 right-3 bg-white/95 border border-rose-300 rounded-xl p-3 text-xs text-slate-800 z-[1000] shadow-lg backdrop-blur max-w-xs space-y-1.5 font-sans pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Water Area Increase (+140.77%)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                Track 019
              </span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Before (27 Jun):</span>
              <span className="text-emerald-700 font-bold">1.660 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">After (09 Jul):</span>
              <span className="text-rose-700 font-bold">3.997 km²</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Newly Inundated:</span>
              <span className="text-rose-600 font-bold">+2.337 km² (+140.77%)</span>
            </div>
            <div className="text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500">Persistent Channel:</span>
              <span className="text-sky-700 font-bold">1.660 km²</span>
            </div>
          </div>
        )}

        {/* Floating Telemetry Badge */}
        <div className="absolute bottom-2 left-2 bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] text-slate-600 font-mono z-[1000] backdrop-blur pointer-events-none shadow-2xs">
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
