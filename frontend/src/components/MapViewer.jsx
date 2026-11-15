import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, ImageOverlay, useMap, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Eye, EyeOff, Compass, Cloud, Radio, Sliders, ShieldAlert, Sparkles, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { apiUrl } from '../utils/apiConfig';

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
const cachedBarpetaGeoJsonMap = {};
const cachedBarpetaSummaryMap = {};

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
  const [barpetaGeoJson, setBarpetaGeoJson] = useState(null);
  const [barpetaSummary, setBarpetaSummary] = useState(null);
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
          fetch(apiUrl('/api/water/majuli/boundaries')),
          fetch(apiUrl('/api/water/majuli/summary'))
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

  // 2. Fetch real Barpeta change boundaries when Barpeta is selected or dates change
  useEffect(() => {
    if (!isBarpeta) return;
    const cacheKey = `${baselineDate}_${eventDate}`;
    if (cachedBarpetaGeoJsonMap[cacheKey] && cachedBarpetaSummaryMap[cacheKey]) {
      setBarpetaGeoJson(cachedBarpetaGeoJsonMap[cacheKey]);
      setBarpetaSummary(cachedBarpetaSummaryMap[cacheKey]);
      return;
    }

    let isMounted = true;
    async function loadBarpetaData() {
      setLoadingBarpeta(true);
      setBarpetaError(null);
      try {
        const query = `baseline_date=${baselineDate || '2026-06-27'}&event_date=${eventDate || '2026-07-09'}`;
        const [geojsonRes, summaryRes] = await Promise.all([
          fetch(apiUrl(`/api/flood/barpeta/boundaries?${query}`)),
          fetch(apiUrl(`/api/flood/barpeta/summary?${query}`))
        ]);

        if (!geojsonRes.ok) throw new Error(`HTTP ${geojsonRes.status}: Failed fetching Barpeta change boundaries`);
        if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}: Failed fetching Barpeta summary`);

        const geojsonData = await geojsonRes.json();
        const summaryData = await summaryRes.json();

        cachedBarpetaGeoJsonMap[cacheKey] = geojsonData;
        cachedBarpetaSummaryMap[cacheKey] = summaryData;

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
  }, [isBarpeta, baselineDate, eventDate]);

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
          // Persistent Water (Deep Blue)
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
    street: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  };

  const tileAttributions = {
    satellite: '&copy; Esri &mdash; Earthstar Geographics',
    street: '&copy; OpenStreetMap contributors',
    dark: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  };

  const barpetaPct = comparisonData?.statistics?.percentage_change;
  const barpetaPctText = barpetaPct !== undefined ? `${barpetaPct >= 0 ? '+' : ''}${barpetaPct}%` : '+140.77%';

  return (
    <div className="card-outer rounded p-4 flex flex-col h-full font-sans">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#e5e5e5]/10">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-editorial text-white">
            {isMajuli
              ? `Real NISAR Water Classification Layer (Majuli Island • ${eventDate || '2026-08-27'})`
              : isBarpeta
              ? `Multi-Temporal NISAR Water Change: ${baselineDate} ➔ ${eventDate} (${barpetaPctText})`
              : 'Interactive SAR Satellite Flood Map'}
          </h3>
          <span className="text-xs font-mono text-[#fca311] box-inner px-2.5 py-1 rounded uppercase tracking-wider font-semibold">
            {isMajuli ? 'Track 015 / Frame 3700' : 'Track 019 / Frame 075'}
          </span>
        </div>

        {/* Layer Controls: Water Layers on Left, Optical Basemap on Right */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono w-full">
          {/* Left: SAR Water Classification Layers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowInundationLayer(!showInundationLayer)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded border uppercase tracking-wider text-xs transition-colors cursor-pointer ${
                showInundationLayer
                  ? 'bg-white text-black border-white font-bold'
                  : 'box-inner text-[#e5e5e5]/70 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showInundationLayer ? 'bg-[#0096c7]' : 'bg-[#e5e5e5]/40'}`}></span>
              <span>{isMajuli ? 'Water Layer' : isBarpeta ? 'Change Vectors' : 'Flood Overlay'}</span>
            </button>

            {isBarpeta && showInundationLayer && (
              <div className="flex items-center gap-1.5 box-inner rounded p-0.5 text-xs">
                <button
                  onClick={() => setShowNewlyInundated(!showNewlyInundated)}
                  className={`px-2.5 py-1 rounded uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showNewlyInundated
                      ? 'bg-white text-black font-bold'
                      : 'text-[#e5e5e5]/60 hover:text-white'
                  }`}
                  title="Toggle Newly Inundated active floodwater expansion"
                >
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
                  <span>Flood (+2.34 km²)</span>
                </button>
                <button
                  onClick={() => setShowPersistentWater(!showPersistentWater)}
                  className={`px-2.5 py-1 rounded uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showPersistentWater
                      ? 'bg-white text-black font-bold'
                      : 'text-[#e5e5e5]/60 hover:text-white'
                  }`}
                  title="Toggle Permanent baseline river channel"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0077b6]"></span>
                  <span>Channel (1.66 km²)</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Optical Satellite Basemap Only */}
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="text-xs text-[#e5e5e5]/70 uppercase tracking-wider font-mono hidden sm:inline">Basemap:</span>
            <div className="box-inner rounded px-3 py-1 flex items-center gap-2 text-xs font-mono uppercase tracking-wider border border-[var(--border-outer)] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.7)] shrink-0"></span>
              <span className="text-white font-semibold tracking-wider">Optical Satellite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="w-full h-[340px] sm:h-[400px] md:h-[450px] lg:h-[480px] rounded overflow-hidden border border-[#e5e5e5]/15 relative z-10 shadow-inner">
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
                color: '#ffffff',
                weight: 0.8,
                fillColor: '#0096c7',
                fillOpacity: layerOpacity,
              })}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const areaHa = props.area_ha ? props.area_ha.toFixed(2) : (props.area_m2 ? (props.area_m2 / 10000).toFixed(2) : 'N/A');
                const areaKm2 = props.area_km2 ? props.area_km2.toFixed(4) : (props.area_m2 ? (props.area_m2 / 1e6).toFixed(4) : 'N/A');
                layer.bindTooltip(
                  `<div class="p-1 font-mono text-xs text-white bg-black border border-[#38bdf8] leading-snug">
                    <strong class="text-[#38bdf8] flex items-center gap-1">
                      <span>NISAR Water Feature #${props.feature_id || ''}</span>
                    </strong>
                    <div class="mt-0.5">Area: <strong>${areaHa} ha</strong> (${areaKm2} km²)</div>
                    <div class="text-[10px] text-[#e5e5e5]/60 mt-0.5">Track 015 / Frame 3700 • HHHH Single-Pol</div>
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
                    color: '#ffffff',
                    weight: 1.5,
                    fillColor: '#38bdf8',
                    fillOpacity: layerOpacity,
                  };
                }
                if (isPersistent) {
                  return {
                    color: '#ffffff',
                    weight: 1.2,
                    fillColor: '#0077b6',
                    fillOpacity: layerOpacity,
                  };
                }
                return {
                  color: '#e5e5e5',
                  weight: 1.5,
                  fillColor: '#a3a3a3',
                  fillOpacity: layerOpacity,
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const className = p.class_name || (p.class_code === 2 ? 'Newly Inundated Water' : 'Persistent Water');
                const areaKm2 = p.area_km2 ? p.area_km2.toFixed(3) : (p.area_m2 ? (p.area_m2 / 1e6).toFixed(3) : 'N/A');
                const areaHa = p.area_ha ? p.area_ha.toFixed(1) : (p.area_m2 ? (p.area_m2 / 10000).toFixed(1) : 'N/A');

                layer.bindTooltip(
                  `<div class="p-1 font-mono text-xs text-white bg-black border border-[#e5e5e5]/20 leading-snug">
                    <strong style="color: ${p.class_code === 2 ? '#38bdf8' : '#60a5fa'}">${className}</strong>
                    <div class="mt-0.5">Area: <strong>${areaKm2} km²</strong> (${areaHa} ha)</div>
                    <div class="text-[10px] text-[#e5e5e5]/60 mt-0.5">Track 019 / Frame 075</div>
                  </div>`,
                  { sticky: true }
                );

                layer.bindPopup(
                  `<div class="text-xs text-[#e5e5e5] bg-black p-2 font-mono border border-[#e5e5e5]/20">
                    <h4 class="font-bold" style="color: ${p.class_code === 2 ? '#38bdf8' : '#60a5fa'}">${className}</h4>
                    <div class="text-[#e5e5e5]/70 text-[11px] mt-1">
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

        {/* Floating Opacity Slider (Positioned at top-right to keep zoom controls separate) */}
        {showInundationLayer && (
          <div className="absolute top-3 right-3 box-inner rounded p-2 text-xs text-[#e5e5e5] font-mono z-[1000] backdrop-blur-md flex items-center gap-2 shadow-lg border border-[var(--border-outer)]">
            <span className="text-[10px] text-[#e5e5e5]/60 uppercase tracking-wider">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
              className="w-20 h-1 bg-black rounded appearance-none cursor-pointer accent-[#38bdf8]"
            />
            <span className="text-[10px] text-[#38bdf8] font-bold">{Math.round(layerOpacity * 100)}%</span>
          </div>
        )}

        {/* Loading Overlay */}
        {((isMajuli && loadingMajuli) || (isBarpeta && loadingBarpeta)) && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-8 h-8 text-[#fca311] animate-spin mb-3" />
            <span className="text-base font-editorial text-white">
              {isMajuli ? 'Rendering 13,821 Classified Water Polygons...' : 'Rendering Barpeta Flood Change Vectors...'}
            </span>
            <span className="text-xs text-[#fca311] font-mono mt-1">
              {isMajuli
                ? 'Track 015 / Frame 3700 • 797.55 km² Water Extent'
                : 'Track 019 / Frame 075 • +140.77% Water Area Increase'}
            </span>
          </div>
        )}

        {/* Floating Telemetry Badge */}
        <div className="absolute bottom-2 left-2 box-inner rounded px-2.5 py-1 text-[10px] text-[#e5e5e5]/80 font-mono z-[1000] backdrop-blur-md pointer-events-none shadow-sm uppercase tracking-wider">
          {isMajuli
            ? 'NISAR Track 015 / Frame 3700 • UTM Zone 46N (EPSG:32646) • Pixel: 10 m • 8,955.16 km² Swath'
            : isBarpeta
            ? 'NISAR Track 019 / Frame 075 • 12-Day Interval (27 Jun vs 09 Jul) • Single-Pol HHHH'
            : 'NISAR Track 019 / Frame 075 • UTM Zone 46N (EPSG:32646) • Pixel: 25 m • 240 km Swath'}
        </div>
      </div>

      {/* Separate Scientific Information Panel Below Map (Kept separate so it does NOT obstruct the map image) */}
      {isBarpeta && !loadingBarpeta && (
        <div className="mt-3 p-3 rounded box-inner border border-[var(--border-outer)] space-y-2.5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-outer)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
              <span className="text-white uppercase tracking-wider font-semibold text-xs">
                SAR Multi-Temporal Flood Matrix
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#e5e5e5]/80">Water Inundation Surge:</span>
              <span className="text-[#38bdf8] font-bold text-sm">{barpetaPctText}</span>
              <span className="text-xs px-2 py-0.5 rounded box-inner text-[#38bdf8] border border-[#38bdf8]/40 font-semibold ml-1">
                Track 019
              </span>
            </div>
          </div>

          {/* Two Separate Stage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded bg-black/40 border border-[var(--border-outer)]">
              <span className="w-3.5 h-3.5 rounded bg-[#0077b6] border border-white shrink-0 mt-0.5"></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-xs">Stage 1: Pre-Flood Channel</span>
                  <span className="text-white font-bold ml-1 text-xs">1.66 km²</span>
                </div>
                <span className="text-xs text-[#e5e5e5]/60 block mt-0.5">
                  Baseline normal riverbed (27 June)
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded bg-[#38bdf8]/5 border border-[#38bdf8]/30">
              <span className="w-3.5 h-3.5 rounded bg-[#38bdf8] border border-white shrink-0 mt-0.5"></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#38bdf8] font-semibold text-xs">Stage 2: Flood Expansion</span>
                  <span className="text-[#38bdf8] font-bold ml-1 text-xs">+2.34 km²</span>
                </div>
                <span className="text-xs text-[#38bdf8]/80 block mt-0.5">
                  Submerged farmland & chars (09 July)
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#e5e5e5]/70 pt-1.5 border-t border-[var(--border-outer)]/40 flex flex-wrap items-center justify-between gap-2">
            <span>Deep Blue = River Channel • Light Blue = Submerged Land (+140.77% surge)</span>
          </div>
        </div>
      )}

      {/* Separate Scientific Information Panel Below Map (Majuli) */}
      {isMajuli && !loadingMajuli && (
        <div className="mt-3 p-3 rounded box-inner border border-[var(--border-outer)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded bg-[#0096c7] border border-white shrink-0"></span>
            <div>
              <span className="text-white font-semibold text-sm">Classified Water Extent</span>
              <span className="text-xs text-[#e5e5e5]/70 block">13,821 Extracted Vector Polygons (10m Resolution)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#e5e5e5]/70">Total Water Area:</span>
            <span className="text-[#38bdf8] font-bold text-base">797.55 km²</span>
            <span className="text-xs px-2.5 py-0.5 rounded box-inner text-[#38bdf8] border border-[#38bdf8]/40 font-semibold">
              Track 015 / Frame 3700
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
