import React from 'react';
import { Waves, ArrowRight } from 'lucide-react';

/**
 * Navbar
 * 
 * Minimal, purposeful navigation across Radar Rhythms views:
 * 1. Home (Cinematic NISAR Earth Introduction)
 * 2. Flood Monitor (Core observational monitoring experience)
 * 3. How It Works (Microwave radar physics & processing workflow)
 * 4. Data & Methodology (Radiometric correction & HDF5 architecture)
 * 5. About (Mission background & Open Science acknowledgments)
 */
export default function Navbar({ activeTab = 'home', onSelectTab }) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'monitor', label: 'Flood Monitor' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'methodology', label: 'Data & Methodology' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="bg-[#1a1f3d] text-[#c6e9f1] border-b border-[#587ebb]/40 sticky top-0 z-50 px-3 sm:px-4 py-2 sm:py-2.5 shadow-md shadow-[#1a1f3d]/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand - Clickable to return Home */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          title="Return to Introduction Homepage"
        >
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[#587ebb]/70 shadow-md shadow-[#3b4a8c]/40 group-hover:border-[#87b8e8] transition-all bg-[#1a1f3d] shrink-0">
            <img
              src="/assets/radar_rhythms_logo.jpg"
              alt="Radar Rhythms Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c6e9f1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#87b8e8]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#c6e9f1] flex items-center gap-1.5">
                Radar <span className="text-[#87b8e8]">Rhythms</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#222950] text-[#c6e9f1] border border-[#3b4a8c]">
                NISAR SAR
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#87b8e8] group-hover:text-[#c6e9f1] transition-colors hidden sm:block">
              Satellite Radar Earth Observation • <span className="text-white font-medium">Dancing with the SARs</span>
            </p>
          </div>
        </div>

        {/* 5 Clean Navigation Links (Horizontally scrollable on mobile) */}
        <nav className="flex items-center gap-1 bg-[#222950] p-1 rounded-lg border border-[#587ebb]/40 text-xs font-medium overflow-x-auto max-w-full no-scrollbar whitespace-nowrap order-last sm:order-none w-full sm:w-auto justify-start sm:justify-center py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${isActive
                  ? 'bg-[#3b4a8c] text-white font-semibold shadow-xs border border-[#587ebb]'
                  : 'text-[#87b8e8] hover:text-white hover:bg-[#1a1f3d]'
                  }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#87b8e8] ml-0.5"></span>}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Quick Jump to Flood Monitor or Telemetry Chip */}
        <div className="flex items-center gap-2">
          {activeTab === 'home' ? (
            <button
              onClick={() => onSelectTab('monitor')}
              className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-md bg-[#87b8e8] hover:bg-[#c6e9f1] text-[#1a1f3d] border border-[#87b8e8] shadow-sm transition-all cursor-pointer font-medium shrink-0"
            >
              <span>Explore Monitor</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1a1f3d]" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono px-2 py-1 sm:px-2.5 rounded-md bg-[#222950] text-[#c6e9f1] border border-[#587ebb]/40 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#87b8e8] animate-pulse"></span>
              <span>Track 015 & 019</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
