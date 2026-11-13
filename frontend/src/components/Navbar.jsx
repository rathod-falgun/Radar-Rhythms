import React from 'react';
import { Radio, Satellite, ShieldCheck, Waves, Compass, BookOpen, Layers, Award, Sparkles, ExternalLink } from 'lucide-react';

export default function Navbar({ activeTab = 'monitor', onSelectTab, onOpenPresentation }) {
  const navItems = [
    { id: 'monitor', label: 'Flood Monitor', icon: Compass },
    { id: 'how-it-works', label: 'How It Works', icon: Sparkles },
    { id: 'methodology', label: 'Data & Methodology', icon: Layers },
    { id: 'about', label: 'About the Project', icon: BookOpen },
  ];

  return (
    <header className="bg-midnight text-white border-b border-indigo sticky top-0 z-50 px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-indigo border border-[#3A506B] text-teal shadow-xs">
            <Waves className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aqua opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
                Brahmaputra <span className="text-teal">FloodWatch</span>
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo text-aqua border border-[#3A506B]">
                NASA–ISRO NISAR
              </span>
            </div>
            <p className="text-xs text-slate-300">
              NASA Space Apps Challenge 2026 • <span className="text-teal font-medium">Dancing with the SARs</span>
            </p>
          </div>
        </div>

        {/* 4 Main Simplified Navigation Links */}
        <nav className="flex items-center gap-1 bg-indigo p-1 rounded-lg border border-[#3A506B] text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${isActive
                  ? 'bg-midnight text-aqua font-medium shadow-xs border border-teal/40'
                  : 'text-slate-300 hover:text-white hover:bg-midnight/50'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action: Pitch Deck Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-md bg-teal hover:bg-aqua text-midnight border border-teal shadow-xs transition-colors cursor-pointer"
            title="Open 5-Slide NASA Space Apps Presentation"
          >
            <Award className="w-3.5 h-3.5 text-midnight" />
            <span>Judges Pitch Deck</span>
          </button>
        </div>
      </div>
    </header>
  );
}
