import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WorkspaceTabs from './components/WorkspaceTabs';
import MajuliStudyHeader from './components/MajuliStudyHeader';
import BarpetaStudyHeader from './components/BarpetaStudyHeader';
import RegionSelector from './components/RegionSelector';
import DateSelector from './components/DateSelector';
import SwipeSlider from './components/SwipeSlider';
import MapViewer from './components/MapViewer';
import AnalyticsPanel from './components/AnalyticsPanel';
import ScientificExplain from './components/ScientificExplain';
import HDF5Inspector from './components/HDF5Inspector';
import ReachSummaryTable from './components/ReachSummaryTable';
import PresentationModal from './components/PresentationModal';
import PersonaSwitcher from './components/PersonaSwitcher';
import DisasterAlertPanel from './components/DisasterAlertPanel';
import ScientistRadarPanel from './components/ScientistRadarPanel';
import StudentCitizenPanel from './components/StudentCitizenPanel';
import WavelengthSimulator from './components/WavelengthSimulator';
import { toggleRadarSound, isRadarSoundEnabled } from './utils/audio';
import { Loader2, Radio, Info, X, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialWorkspace = params?.get('workspace') || 'majuli';
  const initialRegion = initialWorkspace === 'barpeta' ? 'barpeta' : (params?.get('region') || 'majuli');
  const initialPersona = params?.get('persona') || 'disaster';

  // Primary Workspace: 'majuli', 'barpeta', 'overview', 'inspector', 'methodology'
  const [activeWorkspace, setActiveWorkspace] = useState(initialWorkspace);

  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegion);
  const [observations, setObservations] = useState([]);
  const [baselineDate, setBaselineDate] = useState('2026-06-27');
  const [eventDate, setEventDate] = useState('2026-07-09');
  const [thresholdDb, setThresholdDb] = useState(-4.5);
  const [speckleFilter, setSpeckleFilter] = useState(true);

  // Audience Persona: 'disaster' (default), 'scientist', 'student'
  const [persona, setPersona] = useState(initialPersona);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [comparisonData, setComparisonData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  const handleToggleSound = () => {
    const newState = toggleRadarSound(!soundEnabled);
    setSoundEnabled(newState);
  };

  // 1. Initial Load: Fetch Regions and Observations
  useEffect(() => {
    async function initData() {
      try {
        const [regionsRes, obsRes] = await Promise.all([
          fetch('/api/regions'),
          fetch('/api/observations')
        ]);
        const regionsJson = await regionsRes.json();
        const obsJson = await obsRes.json();
        setRegions(regionsJson);
        setObservations(obsJson);
      } catch (err) {
        console.error('Failed to initialize catalog:', err);
      }
    }
    initData();
  }, []);

  // 2. Fetch Comparison whenever region, dates, threshold or filter change
  useEffect(() => {
    if (!selectedRegionId) return;
    async function fetchComparison() {
      setLoading(true);
      try {
        const url = `/api/compare?region_id=${selectedRegionId}&baseline_date=${baselineDate}&event_date=${eventDate}&threshold_db=${thresholdDb}&apply_speckle_filter=${speckleFilter}`;
        const res = await fetch(url);
        const data = await res.json();
        setComparisonData(data);
      } catch (err) {
        console.error('Failed to fetch comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [selectedRegionId, baselineDate, eventDate, thresholdDb, speckleFilter]);

  // 3. Fetch Timeline Stats when region changes
  useEffect(() => {
    if (!selectedRegionId) return;
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/timeline-stats?region_id=${selectedRegionId}`);
        const data = await res.json();
        setTimelineData(data.timeline || []);
      } catch (err) {
        console.error('Failed to fetch timeline stats:', err);
      }
    }
    fetchTimeline();
  }, [selectedRegionId]);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || (regions.length > 0 ? regions[0] : { id: 'majuli', name: 'Majuli River Island Reach', center: { lat: 26.901, lon: 94.104 }, zoom: 10, bounds: [[26.49561, 93.59687], [27.30636, 94.61117]] });

  // Workspace Switcher Handler
  const handleSelectWorkspace = (tabId) => {
    setActiveWorkspace(tabId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `?workspace=${tabId}`);
    }
    if (tabId === 'majuli') {
      setSelectedRegionId('majuli');
    } else if (tabId === 'barpeta') {
      setSelectedRegionId('barpeta');
      setBaselineDate('2026-06-27');
      setEventDate('2026-07-09');
      setThresholdDb(-4.5);
    } else if (tabId === 'overview') {
      if (selectedRegionId === 'majuli' || selectedRegionId === 'barpeta') {
        setSelectedRegionId('kaziranga');
      }
    }
  };

  const handleApplyPreset = (base, evt) => {
    setBaselineDate(base);
    setEventDate(evt);
  };

  // Sync region selector clicks with workspace tabs
  const handleSelectRegionFromCatalog = (regId) => {
    setSelectedRegionId(regId);
    if (regId === 'majuli') {
      setActiveWorkspace('majuli');
    } else if (regId === 'barpeta') {
      setActiveWorkspace('barpeta');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenInfo={() => setShowInfoModal(true)}
        onOpenPresentation={() => setShowPresentationModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Workspace Switcher: Clear distinction between the 2 Scientific Studies */}
        <WorkspaceTabs
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
        />

        {/* Top Header: Audience Persona Switcher & Radar Sound Synthesizer */}
        <PersonaSwitcher
          currentPersona={persona}
          onSelectPersona={setPersona}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />

        {/* ========================================================================= */}
        {/* WORKSPACE 1: MAJULI WATER DETECTION EXPLORER */}
        {/* ========================================================================= */}
        {activeWorkspace === 'majuli' && (
          <div className="space-y-4">
            <MajuliStudyHeader />

            {/* Interactive Visualizations (Real Majuli 13,821 Polygons) */}
            {!loading && comparisonData && (
              <div className="grid grid-cols-1 gap-4">
                <MapViewer
                  region={selectedRegion}
                  comparisonData={comparisonData}
                  baselineDate={baselineDate}
                  eventDate={eventDate}
                  persona={persona}
                />
              </div>
            )}

            {/* Persona Panels */}
            {persona === 'disaster' && !loading && comparisonData && (
              <DisasterAlertPanel
                statistics={comparisonData.statistics}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
              />
            )}
            {persona === 'scientist' && !loading && comparisonData && (
              <ScientistRadarPanel
                comparisonData={comparisonData}
                parameters={comparisonData.parameters}
              />
            )}
            {persona === 'student' && !loading && (
              <StudentCitizenPanel />
            )}

            {/* Quantitative Analytics */}
            {!loading && comparisonData && (
              <AnalyticsPanel
                statistics={comparisonData.statistics}
                timelineData={timelineData}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}

            {/* Scientific Explanation & Methodology */}
            {!loading && comparisonData && (
              <ScientificExplain
                explanation={comparisonData.scientific_explanation}
                parameters={comparisonData.parameters}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKSPACE 2: BARPETA FLOOD CHANGE EXPLORER */}
        {/* ========================================================================= */}
        {activeWorkspace === 'barpeta' && (
          <div className="space-y-4">
            <BarpetaStudyHeader
              thresholdDb={thresholdDb}
              onThresholdChange={setThresholdDb}
              speckleFilter={speckleFilter}
              onToggleSpeckleFilter={setSpeckleFilter}
            />

            {/* 12-Day Orbital Revisit Sequence */}
            <DateSelector
              observations={observations}
              baselineDate={baselineDate}
              eventDate={eventDate}
              thresholdDb={thresholdDb}
              speckleFilter={speckleFilter}
              onSelectBaseline={setBaselineDate}
              onSelectEvent={setEventDate}
              onThresholdChange={setThresholdDb}
              onToggleSpeckleFilter={setSpeckleFilter}
              onApplyPreset={handleApplyPreset}
              selectedRegionId={selectedRegionId}
            />

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center justify-center p-6 bg-slate-900/60 rounded-xl border border-slate-800">
                <Loader2 className="w-5 h-5 text-rose-400 animate-spin mr-2" />
                <span className="text-sm text-slate-300 font-mono">
                  Decomposing SAR Log-Ratio for Barpeta (Track 019 / Frame 075)...
                </span>
              </div>
            )}

            {/* Interactive Visualizations: Swipe Comparison + 4-Class Change Map */}
            {!loading && comparisonData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SwipeSlider
                  comparisonData={comparisonData}
                  baselineDate={baselineDate}
                  eventDate={eventDate}
                />
                <MapViewer
                  region={selectedRegion}
                  comparisonData={comparisonData}
                  baselineDate={baselineDate}
                  eventDate={eventDate}
                  persona={persona}
                />
              </div>
            )}

            {/* Persona Panels */}
            {persona === 'disaster' && !loading && comparisonData && (
              <DisasterAlertPanel
                statistics={comparisonData.statistics}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
              />
            )}
            {persona === 'scientist' && !loading && comparisonData && (
              <ScientistRadarPanel
                comparisonData={comparisonData}
                parameters={comparisonData.parameters}
              />
            )}
            {persona === 'student' && !loading && (
              <StudentCitizenPanel />
            )}

            {/* Quantitative Analytics */}
            {!loading && comparisonData && (
              <AnalyticsPanel
                statistics={comparisonData.statistics}
                timelineData={timelineData}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}

            {/* Scientific Explanation & Methodology */}
            {!loading && comparisonData && (
              <ScientificExplain
                explanation={comparisonData.scientific_explanation}
                parameters={comparisonData.parameters}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKSPACE 3: BASIN OVERVIEW & REGIONAL REACHES */}
        {/* ========================================================================= */}
        {activeWorkspace === 'overview' && (
          <div className="space-y-4">
            <RegionSelector
              regions={regions}
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegionFromCatalog}
            />

            <DateSelector
              observations={observations}
              baselineDate={baselineDate}
              eventDate={eventDate}
              thresholdDb={thresholdDb}
              speckleFilter={speckleFilter}
              onSelectBaseline={setBaselineDate}
              onSelectEvent={setEventDate}
              onThresholdChange={setThresholdDb}
              onToggleSpeckleFilter={setSpeckleFilter}
              onApplyPreset={handleApplyPreset}
              selectedRegionId={selectedRegionId}
            />

            {!loading && comparisonData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SwipeSlider
                  comparisonData={comparisonData}
                  baselineDate={baselineDate}
                  eventDate={eventDate}
                />
                <MapViewer
                  region={selectedRegion}
                  comparisonData={comparisonData}
                  baselineDate={baselineDate}
                  eventDate={eventDate}
                  persona={persona}
                />
              </div>
            )}

            {/* Phase 6: Multi-Reach Regional Flood Risk & Inundation Matrix */}
            {!loading && (
              <ReachSummaryTable
                selectedRegionId={selectedRegionId}
                onSelectRegion={handleSelectRegionFromCatalog}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}

            {!loading && comparisonData && (
              <AnalyticsPanel
                statistics={comparisonData.statistics}
                timelineData={timelineData}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKSPACE 4: NISAR OBSERVATION & HDF5 PRODUCT INSPECTOR */}
        {/* ========================================================================= */}
        {activeWorkspace === 'inspector' && (
          <div className="space-y-4">
            <HDF5Inspector dateStr={eventDate} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKSPACE 5: ABOUT METHODOLOGY & SAR PHYSICS */}
        {/* ========================================================================= */}
        {activeWorkspace === 'methodology' && (
          <div className="space-y-4">
            <WavelengthSimulator />

            {!loading && comparisonData && (
              <ScientificExplain
                explanation={comparisonData.scientific_explanation}
                parameters={comparisonData.parameters}
              />
            )}
          </div>
        )}
      </main>

      {/* Presentation Modal */}
      <PresentationModal
        isOpen={showPresentationModal}
        onClose={() => setShowPresentationModal(false)}
      />

      {/* Footer */}
      <footer className="bg-[#080c14] border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Brahmaputra FloodWatch • NASA Space Apps Challenge 2026</span>
          <span className="font-mono">Sensor: NASA-ISRO NISAR (L-band & S-band SAR) • Track 015 & Track 019</span>
          <span>Open-Source Science Implementation</span>
        </div>
      </footer>

      {/* Mission & Physics Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-cyan-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-cyan-500/10 relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">NISAR Radar Physics & Mission Architecture</h3>
                <p className="text-xs text-slate-400">NASA Space Apps Challenge 2026 — Dancing with the SARs</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-cyan-300 mb-1">Study 1: Single-Date Water Detection (Majuli Island)</h4>
                <p>
                  Uses NISAR Track 015 / Frame 3700 from 27 August 2026. Demonstrates high-resolution single-polarization
                  HHHH water classification (797.55 km² detected water, 13,821 vector polygons) using specular microwave attenuation.
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-rose-300 mb-1">Study 2: Multi-Temporal Flood Inundation Change (Barpeta)</h4>
                <p>
                  Uses NISAR Track 019 / Frame 075 across a 12-day orbital repeat interval (27 June vs 09 July 2026) using single-polarization HHHH backscatter.
                  Minimal geometric parallax enables log-ratio backscatter subtraction, detecting a +140.77% flood surge (+2.337 km² newly inundated land).
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-cyan-300 mb-1">Level 2 GCOV Data (Geocoded Polarimetric Covariance)</h4>
                <p>
                  Our application uses NISAR Level-2 GCOV products. In this data level, Radiometric Terrain Correction (RTC)
                  and map projection (UTM Zone 46N) are already applied. We preserve data integrity by not applying calibration
                  or terrain corrections twice.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
