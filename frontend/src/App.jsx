import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
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
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('kaziranga');
  const [observations, setObservations] = useState([]);
  const [baselineDate, setBaselineDate] = useState('2026-06-27');
  const [eventDate, setEventDate] = useState('2026-07-09');
  const [thresholdDb, setThresholdDb] = useState(-4.5);
  const [speckleFilter, setSpeckleFilter] = useState(true);

  // Audience Persona: 'disaster' (default), 'scientist', 'student'
  const [persona, setPersona] = useState('disaster');
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

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];

  const handleApplyPreset = (base, evt) => {
    setBaselineDate(base);
    setEventDate(evt);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenInfo={() => setShowInfoModal(true)}
        onOpenPresentation={() => setShowPresentationModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Top Header: Audience Persona Switcher & Radar Sound Synthesizer */}
        <PersonaSwitcher
          currentPersona={persona}
          onSelectPersona={setPersona}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />

        {/* Step 1: Study Region Selector */}
        <RegionSelector
          regions={regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={setSelectedRegionId}
        />

        {/* Step 2: 12-Day Revisit Timeline & Threshold Slider */}
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
        />

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center p-6 bg-slate-900/60 rounded-xl border border-slate-800">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mr-2" />
            <span className="text-sm text-slate-300 font-mono">
              Executing SAR Log-Ratio Decomposition for Track 019 / Frame 075...
            </span>
          </div>
        )}

        {/* Step 3: Interactive Visualizations (Swipe Slider & Map) */}
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

        {/* AUDIENCE PERSONA SPECIFIC PANELS */}

        {/* Persona A: Emergency Disaster Responder (ASDMA / NDRF) */}
        {persona === 'disaster' && !loading && comparisonData && (
          <DisasterAlertPanel
            statistics={comparisonData.statistics}
            regionName={selectedRegion?.name}
            regionId={selectedRegionId}
          />
        )}

        {/* Persona B: Remote Sensing Scientist */}
        {persona === 'scientist' && !loading && comparisonData && (
          <ScientistRadarPanel
            comparisonData={comparisonData}
            parameters={comparisonData.parameters}
          />
        )}

        {/* Persona C: Student & Citizen Explorer */}
        {persona === 'student' && !loading && (
          <StudentCitizenPanel />
        )}

        {/* Step 4: Quantitative Analytics & Phase 5 Export */}
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

        {/* Phase 6: Multi-Reach Regional Flood Risk & Inundation Matrix */}
        {!loading && (
          <ReachSummaryTable
            selectedRegionId={selectedRegionId}
            onSelectRegion={setSelectedRegionId}
            baselineDate={baselineDate}
            eventDate={eventDate}
          />
        )}

        {/* Physics Core: Wavelength & Penetration Simulator */}
        {!loading && (
          <WavelengthSimulator />
        )}

        {/* Step 5: Scientific Explanation & Limitations */}
        {!loading && comparisonData && (
          <ScientificExplain
            explanation={comparisonData.scientific_explanation}
            parameters={comparisonData.parameters}
          />
        )}

        {/* Step 6: Phase 3 NISAR HDF5 Data Architecture Inspector */}
        {!loading && (
          <HDF5Inspector dateStr={eventDate} />
        )}
      </main>

      {/* Phase 7: NASA Space Apps Presentation & Validation Deck Modal */}
      <PresentationModal
        isOpen={showPresentationModal}
        onClose={() => setShowPresentationModal(false)}
      />

      {/* Footer */}
      <footer className="bg-[#080c14] border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Brahmaputra FloodWatch • NASA Space Apps Challenge 2026</span>
          <span className="font-mono">Sensor: NASA-ISRO NISAR (L-band & S-band SAR) • Track 019 / Frame 075</span>
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
                <h4 className="font-semibold text-cyan-300 mb-1">Why Synthetic Aperture Radar (SAR)?</h4>
                <p>
                  During the South Asian monsoon, optical satellites (like Landsat and Sentinel-2) are severely impeded
                  by chronic cloud cover. NISAR's radar transmits its own microwave pulses, illuminating Earth's surface
                  through rain, dense clouds, and total darkness.
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

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-cyan-300 mb-1">The 12-Day Matched Geometry Advantage</h4>
                <p>
                  NISAR repeats its exact orbital path every 12 days (173 orbits per cycle). By comparing images from the
                  exact same Relative Track (019) and Frame (075), we observe the surface from identical incidence angles,
                  eliminating false change detections caused by topographic parallax.
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
