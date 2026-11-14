import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Navbar — Night-pass radar instrument header
 * Thin black bar with bottom 1px hairline. Active tab gets orange underline.
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
    <header className="text-[#e5e5e5] border-b border-[#e5e5e5]/25 sticky top-0 z-50 px-4 sm:px-8 py-3.5 backdrop-blur-md bg-black/60 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
          title="Return to Home"
        >
          {/* Logo with clean border & object-contain without highlight or dot */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-lg p-1.5 border border-[var(--card-border)] bg-black/40 shrink-0">
            <img
              src="/assets/radar_rhythms_logo.jpg"
              alt="Radar Rhythms Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-editorial tracking-tight text-white flex items-center gap-1.5">
                Radar <span className="text-[#fca311] font-normal italic">Rhythms</span>
              </h1>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border border-[var(--card-border)] text-[#e5e5e5]/70">
                NISAR SAR
              </span>
            </div>
            <p className="text-[11px] font-mono tracking-wider text-[#e5e5e5]/50 hidden sm:block uppercase">
              Earth Radar Instrument • Orbit 015 & 019
            </p>
          </div>
        </div>

        {/* Navigation Links — Glassy Curved Border on Hover */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono tracking-wider uppercase overflow-x-auto max-w-full no-scrollbar whitespace-nowrap order-last sm:order-none w-full sm:w-auto justify-start sm:justify-center py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-white font-semibold border-[var(--highlight-border)] bg-[var(--space-2)]/60 shadow-xs'
                    : 'text-[#e5e5e5]/70 hover:text-white border-transparent hover:border-[var(--card-border-hover)] hover:bg-[var(--space-2)]/40'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          {activeTab === 'home' ? (
            <button
              onClick={() => onSelectTab('monitor')}
              className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider px-4 py-2 rounded-lg bg-[#fca311] text-black hover:bg-white border border-transparent hover:border-[var(--card-border-hover)] transition-all duration-150 cursor-pointer shrink-0"
            >
              <span>Launch Monitor</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[var(--card-border)] hover:border-[var(--card-border-hover)] text-[#e5e5e5]/70 shrink-0 transition-all duration-150 box-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fca311]"></span>
              <span>Track 015 & 019</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
