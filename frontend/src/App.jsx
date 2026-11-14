import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CinematicHomepage from './components/CinematicHomepage';
import RegionSelector from './components/RegionSelector';
import DateSelector from './components/DateSelector';
import SwipeSlider from './components/SwipeSlider';
import MapViewer from './components/MapViewer';
import AnalyticsPanel from './components/AnalyticsPanel';
import WhatChangedCard from './components/WhatChangedCard';
import ScientistRadarPanel from './components/ScientistRadarPanel';
import HowItWorksView from './components/HowItWorksView';
import DataMethodologyView from './components/DataMethodologyView';
import AboutProjectView from './components/AboutProjectView';
import { toggleRadarSound, isRadarSoundEnabled } from './utils/audio';
import { Loader2, Radio, Info, X, ShieldAlert, Sparkles, Sliders, Microscope, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const getInitialTab = () => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (path.startsWith('/monitor') || tab === 'monitor') return 'monitor';
    if (path.startsWith('/how-it-works') || tab === 'how-it-works') return 'how-it-works';
    if (path.startsWith('/methodology') || tab === 'methodology') return 'methodology';
    if (path.startsWith('/about') || tab === 'about') return 'about';
    if (tab === 'home') return 'home';
    return 'home'; // Default entry experience
  };

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRegion = params?.get('region') || (params?.get('workspace') === 'barpeta' ? 'barpeta' : 'majuli');

  // Main Navigation: 'home', 'monitor', 'how-it-works', 'methodology', 'about'
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Region & Observation State
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegion);
  const [observations, setObservations] = useState([]);
  const [baselineDate, setBaselineDate] = useState('2026-06-27');
  const [eventDate, setEventDate] = useState('2026-07-09');
  const [thresholdDb, setThresholdDb] = useState(-4.5);
  const [speckleFilter, setSpeckleFilter] = useState(true);

  // Advanced Scientist Drawer Toggle
  const [showAdvancedScientist, setShowAdvancedScientist] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Data State
  const [comparisonData, setComparisonData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customBoundary, setCustomBoundary] = useState(null);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleToggleSound = () => {
    const newState = toggleRadarSound(!soundEnabled);
    setSoundEnabled(newState);
  };

  // 1. Initial Load: Fetch Regions
  useEffect(() => {
    async function initData() {
      try {
        const regionsRes = await fetch('/api/regions');
        const regionsJson = await regionsRes.json();
        setRegions(regionsJson);
      } catch (err) {
        console.error('Failed to initialize regions:', err);
      }
    }
    initData();
  }, []);

  // 1b. Fetch Data-Driven Observations whenever region changes
  useEffect(() => {
    if (!selectedRegionId) return;
    async function fetchObservations() {
      try {
        const obsRes = await fetch(`/api/observations?region_id=${selectedRegionId}&only_processed=true`);
        const obsJson = await obsRes.json();
        setObservations(obsJson);
      } catch (err) {
        console.error('Failed to fetch observations for region:', err);
      }
    }
    fetchObservations();
  }, [selectedRegionId]);

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

  // Tab Navigation Handler
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      if (tabId === 'home') {
        window.history.pushState(null, '', '/');
      } else if (tabId === 'monitor') {
        window.history.pushState(null, '', '/monitor');
      } else {
        window.history.pushState(null, '', `?tab=${tabId}`);
      }
    }
  };

  // Region Selection Handler
  const handleSelectRegion = (regId) => {
    setSelectedRegionId(regId);
    if (regId === 'majuli') {
      setBaselineDate('2026-08-27');
      setEventDate('2026-08-27');
    } else if (regId === 'barpeta') {
      setBaselineDate('2026-06-27');
      setEventDate('2026-07-09');
      setThresholdDb(-4.5);
    }
  };

  const handleApplyPreset = (base, evt) => {
    setBaselineDate(base);
    setEventDate(evt);
  };

  const handleCustomBoundaryUploaded = (geojson, fileName) => {
    setCustomBoundary({ geojson, fileName });
  };

  const isMajuli = selectedRegionId === 'majuli';
  const isBarpeta = selectedRegionId === 'barpeta';

  return (
    <div className="min-h-screen bg-[#1a1f3d] text-[#c6e9f1] flex flex-col font-sans selection:bg-[#87b8e8] selection:text-[#1a1f3d]">
      {/* Space-Inspired Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* ========================================================================= */}
      {/* EXPERIENCE 1: CINEMATIC INTRODUCTION HOMEPAGE                            */}
      {/* ========================================================================= */}
      {activeTab === 'home' && (
        <CinematicHomepage
          onExplore={() => handleSelectTab('monitor')}
          onHowItWorks={() => handleSelectTab('how-it-works')}
        />
      )}

      {/* ========================================================================= */}
      {/* EXPERIENCE 2: THE MONITORING APPLICATION & METHODOLOGY PAGES             */}
      {/* ========================================================================= */}
      {activeTab !== 'home' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FLOOD MONITOR (The Central User-Driven Experience) */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
            {/* 1. Project Heading & Short Explanation */}
            <div className="bg-gradient-to-r from-[#1a1f3d] via-[#222950] to-[#1a1f3d] text-[#c6e9f1] rounded-xl border border-[#587ebb]/40 p-5 sm:p-6 shadow-lg shadow-[#1a1f3d]/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#87b8e8] animate-pulse"></span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Radar Rhythms — All-Weather Earth Observation Portal
                  </h2>
                </div>
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#222950] text-[#87b8e8] border border-[#3b4a8c]">
                  NASA–ISRO SAR Earth Observation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#c6e9f1] leading-relaxed max-w-4xl">
                Monsoon clouds hide floodwaters from optical satellites. Radar Rhythms utilizes NASA–ISRO SAR (Synthetic Aperture Radar) microwave pulses to penetrate clouds and rain, detecting surface water changes and tracking flood extent across the Brahmaputra River Basin.
              </p>
            </div>

            {/* 2. Step 1: Area Selection */}
            <RegionSelector
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegion}
              onCustomBoundaryUploaded={handleCustomBoundaryUploaded}
            />

            {/* 3. Step 2: Date Selection Based on Real Observation Availability */}
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
              <div className="flex items-center justify-center p-8 bg-[#1C2541] rounded-xl border border-[#3A506B]/40 shadow-md">
                <Loader2 className="w-5 h-5 text-[#5BC0BE] animate-spin mr-3" />
                <span className="text-sm font-medium text-[#F4F6F8]">
                  Retrieving NISAR radar observations & computing water classification...
                </span>
              </div>
            )}

            {/* State when an unsupported area or date has no processed satellite results */}
            {!loading && comparisonData && (comparisonData.status === 'UNAVAILABLE' || (!isMajuli && !isBarpeta)) && (
              <div className="bg-[#1C2541] rounded-xl border border-amber-500/40 p-8 shadow-md text-center space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#24314D] text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#F4F6F8]">
                    No Processed Satellite Results for this Area
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    {comparisonData.message || 'No processed NISAR Level-2 satellite observations are available for this area. To inspect authentic satellite radar data, please select Majuli or Barpeta.'}
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => handleSelectRegion('majuli')}
                    className="px-3.5 py-1.5 rounded-md bg-[#5BC0BE] text-[#0B132B] hover:bg-[#6FFFE9] font-medium text-xs transition-colors cursor-pointer"
                  >
                    View Majuli (Single-Date Water Extent)
                  </button>
                  <button
                    onClick={() => handleSelectRegion('barpeta')}
                    className="px-3.5 py-1.5 rounded-md bg-[#24314D] text-[#F4F6F8] hover:bg-[#3A506B] font-medium text-xs border border-[#3A506B] transition-colors cursor-pointer"
                  >
                    View Barpeta (Two-Date Flood Comparison)
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Before-and-After Map Comparison (or Single-Date Water Map) */}
            {!loading && comparisonData && comparisonData.status !== 'UNAVAILABLE' && (isMajuli || isBarpeta) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0BE]"></span>
                    <h2 className="text-base font-semibold text-[#F4F6F8] tracking-tight">
                      3. {isBarpeta ? 'Before-and-After Flood Comparison' : 'Classified Water Extent Map'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {isMajuli ? 'Track 015 / Frame 3700 • 13,821 Extracted Polygons' : 'Track 019 / Frame 075 • 12-day interval (27 Jun vs 09 Jul 2026)'}
                  </span>
                </div>

                {isBarpeta ? (
                  /* Barpeta Two-Date Comparison: Swipe Comparator + Map */
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
                    />
                  </div>
                ) : (
                  /* Majuli Single-Date: High-Resolution Leaflet Canvas Map */
                  <div className="grid grid-cols-1 gap-4">
                    <MapViewer
                      region={selectedRegion}
                      comparisonData={comparisonData}
                      baselineDate={baselineDate}
                      eventDate={eventDate}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: "What Changed?" (Plain-English Scientific Summary) */}
            {!loading && comparisonData && comparisonData.status !== 'UNAVAILABLE' && (isMajuli || isBarpeta) && (
              <WhatChangedCard
                selectedRegionId={selectedRegionId}
                comparisonData={comparisonData}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}

            {/* Step 5: Real Data Exports & KPI Analytics */}
            {!loading && comparisonData && comparisonData.status !== 'UNAVAILABLE' && (isMajuli || isBarpeta) && (
              <AnalyticsPanel
                statistics={comparisonData.statistics}
                timelineData={timelineData}
                regionName={selectedRegion?.name}
                regionId={selectedRegionId}
                baselineDate={baselineDate}
                eventDate={eventDate}
              />
            )}

            {/* Optional Collapsible Drawer: Advanced Radar Scientist Diagnostics */}
            {!loading && comparisonData && comparisonData.status !== 'UNAVAILABLE' && (isMajuli || isBarpeta) && (
              <div className="bg-[#1C2541] rounded-xl border border-[#3A506B]/50 shadow-md overflow-hidden transition-all">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowAdvancedScientist(!showAdvancedScientist)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowAdvancedScientist(!showAdvancedScientist);
                    }
                  }}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#24314D]/60 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#0B132B] text-[#5BC0BE] border border-[#3A506B]/50 flex items-center justify-center">
                      <Microscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#F4F6F8] block">
                        Advanced Radar Scientist Diagnostics & Physics
                      </span>
                      <span className="text-xs text-slate-300">
                        Inspect raw backscatter decibel histograms, Otsu equations, Lee moments, and acoustic sonification.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSound();
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                        soundEnabled
                          ? 'bg-[#0B132B] text-[#6FFFE9] border-[#5BC0BE]/50'
                          : 'bg-[#24314D] text-slate-300 border-[#3A506B] hover:bg-[#3A506B]'
                      }`}
                      title="Toggle Web Audio radar acoustic probe pitch"
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#5BC0BE]" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{soundEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
                    </button>

                    {showAdvancedScientist ? (
                      <ChevronUp className="w-5 h-5 text-slate-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                </div>

                {showAdvancedScientist && (
                  <div className="p-5 border-t border-[#3A506B]/40 space-y-4 bg-[#0B132B]/50">
                    <ScientistRadarPanel
                      comparisonData={comparisonData}
                      parameters={comparisonData.parameters}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HOW IT WORKS                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'how-it-works' && (
          <HowItWorksView />
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DATA & METHODOLOGY                                                */}
        {/* ========================================================================= */}
        {activeTab === 'methodology' && (
          <DataMethodologyView />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ABOUT THE PROJECT                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'about' && (
          <AboutProjectView />
        )}
      </main>
      )}

      {/* Modern Space-Inspired Footer */}
      <footer className="bg-[#1a1f3d] border-t border-[#587ebb]/40 py-5 px-4 text-xs text-[#87b8e8] mt-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/radar_rhythms_logo.jpg"
              alt="Radar Rhythms Logo"
              className="w-6 h-6 rounded-md object-cover border border-[#587ebb]/60 shrink-0"
            />
            <span className="font-semibold text-white">Radar Rhythms</span>
            <span className="text-slate-400 hidden md:inline">• Dancing with the SARs • Earth Radar Science</span>
          </div>
          <div className="font-mono text-[#c6e9f1] text-[11px] sm:text-xs">
            NASA–ISRO NISAR • Track 015 & Track 019
          </div>
          <div className="text-slate-400 text-[11px]">
            Open Science • Apache 2.0
          </div>
        </div>
      </footer>
    </div>
  );
}
