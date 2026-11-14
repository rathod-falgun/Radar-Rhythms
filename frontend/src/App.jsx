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
import { apiUrl } from './utils/apiConfig';
import { Loader2, Radio, Info, X, ShieldAlert, Sparkles, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

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
  const isInitMajuli = initialRegion === 'majuli';
  const [baselineDate, setBaselineDate] = useState(isInitMajuli ? '2026-08-27' : '2026-06-27');
  const [eventDate, setEventDate] = useState(isInitMajuli ? '2026-08-27' : '2026-07-09');
  const [thresholdDb, setThresholdDb] = useState(-4.5);
  const [speckleFilter, setSpeckleFilter] = useState(true);

  // Advanced Scientist Drawer Toggle
  const [showAdvancedScientist, setShowAdvancedScientist] = useState(false);

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

  // 1. Initial Load: Fetch Regions
  useEffect(() => {
    async function initData() {
      try {
        const regionsRes = await fetch(apiUrl('/api/regions'));
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
        const obsRes = await fetch(apiUrl(`/api/observations?region_id=${selectedRegionId}&only_processed=true`));
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
        const url = apiUrl(`/api/compare?region_id=${selectedRegionId}&baseline_date=${baselineDate}&event_date=${eventDate}&threshold_db=${thresholdDb}&apply_speckle_filter=${speckleFilter}`);
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
        const res = await fetch(apiUrl(`/api/timeline-stats?region_id=${selectedRegionId}`));
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
    <div className="min-h-screen bg-transparent text-[#e5e5e5] flex flex-col font-sans selection:bg-[#fca311] selection:text-black">
      {/* Top Navbar */}
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
        <main className="page-container space-y-6 flex-1 w-full pt-4">
          {/* TAB 1: FLOOD MONITOR (The Central User-Driven Experience) */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* 1. Project Heading & Short Explanation */}
              <div className="card-outer rounded p-6 sm:p-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#fca311]"></span>
                    <h2 className="text-2xl sm:text-3xl font-editorial font-semibold tracking-tight text-white">
                      Radar Rhythms <span className="text-[#fca311] font-normal italic">— Flood Monitor</span>
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-widest px-3 py-1 rounded box-inner text-[#fca311]">
                    NISAR SAR Microwave Instrument
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#e5e5e5]/80 font-sans leading-relaxed max-w-4xl">
                  Monsoon clouds obscure floodwaters from optical satellites. Radar Rhythms utilizes NASA–ISRO SAR (Synthetic Aperture Radar) microwave pulses to penetrate clouds and rain, detecting surface water changes and tracking flood extent across the Brahmaputra River Basin.
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
                <div className="flex items-center justify-center p-8 card-outer rounded">
                  <Loader2 className="w-5 h-5 text-[#fca311] animate-spin mr-3" />
                  <span className="text-sm font-mono text-[#e5e5e5]">
                    Retrieving NISAR radar observations & computing water classification...
                  </span>
                </div>
              )}

              {/* State when an unsupported area or date has no processed satellite results */}
              {!loading && comparisonData && (comparisonData.status === 'UNAVAILABLE' || (!isMajuli && !isBarpeta)) && (
                <div className="card-outer rounded p-8 text-center space-y-4">
                  <div className="w-10 h-10 rounded box-inner text-[#fca311] flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-editorial font-semibold text-white">
                      No Processed Satellite Results for this Area
                    </h3>
                    <p className="text-xs text-[#e5e5e5]/70 max-w-lg mx-auto leading-relaxed">
                      {comparisonData.message || 'No processed NISAR Level-2 satellite observations are available for this area. To inspect authentic satellite radar data, please select Majuli or Barpeta.'}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => handleSelectRegion('majuli')}
                      className="px-4 py-2 rounded bg-[#fca311] text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
                    >
                      View Majuli (Single-Date Water Extent)
                    </button>
                    <button
                      onClick={() => handleSelectRegion('barpeta')}
                      className="px-4 py-2 rounded box-inner text-white hover:border-[#fca311] font-semibold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      View Barpeta (Two-Date Flood Comparison)
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Before-and-After Map Comparison (or Single-Date Water Map) */}
              {!loading && comparisonData && comparisonData.status !== 'UNAVAILABLE' && (isMajuli || isBarpeta) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e5e5e5]/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#fca311]"></span>
                      <h2 className="text-base font-editorial font-semibold text-white tracking-wide">
                        3. {isBarpeta ? 'Before-and-After Flood Comparison' : 'Classified Water Extent Map'}
                      </h2>
                    </div>
                    <span className="text-xs text-[#e5e5e5]/60 font-mono uppercase tracking-wider">
                      {isMajuli ? 'Track 015 / Frame 3700 • 13,821 Extracted Polygons' : 'Track 019 / Frame 075 • 12-day repeat (27 Jun vs 09 Jul 2026)'}
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
                <div className="card-outer rounded overflow-hidden transition-all">
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
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-black/40 transition-colors cursor-pointer select-none"
                  >
                    <div>
                      <span className="text-sm font-editorial font-semibold text-white block">
                        Advanced Radar Scientist Diagnostics & Physics
                      </span>
                      <span className="text-xs font-sans text-[#e5e5e5]/70">
                        Inspect raw backscatter decibel histograms, Otsu equations, and Lee speckle filter moments.
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {showAdvancedScientist ? (
                        <ChevronUp className="w-5 h-5 text-[#e5e5e5]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#e5e5e5]" />
                      )}
                    </div>
                  </div>

                  {showAdvancedScientist && (
                    <div className="p-5 border-t border-[var(--border-outer)] space-y-4 box-inner">
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

      {/* Modern Night-Pass Footer */}
      <footer className={`bg-black/60 backdrop-blur-md border-t border-[#e5e5e5]/25 py-5 text-xs text-[#e5e5e5]/60 shadow-sm transition-colors ${activeTab === 'home' ? 'mt-0' : 'mt-6 sm:mt-10'}`}>
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left !pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg p-1 border border-[var(--border-outer)] box-inner shrink-0 flex items-center justify-center">
              <img
                src="/assets/radar_rhythms_logo.jpg"
                alt="Radar Rhythms Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-editorial text-white text-sm font-semibold tracking-wide">Radar Rhythms</span>
              <span className="text-[#e5e5e5]/50 font-mono text-[11px] block sm:inline sm:ml-2">
                • Earth Radar Science • Dancing with the SARs
              </span>
            </div>
          </div>
          <div className="font-mono text-[#fca311] text-[11px] tracking-wider uppercase">
            NASA–ISRO NISAR • Orbit 015 & 019
          </div>
        </div>
      </footer>
    </div>
  );
}
