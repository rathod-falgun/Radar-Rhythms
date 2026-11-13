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
    <header className="bg-[#0b132b] text-white border-b border-[#1c2541] sticky top-0 z-50 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2541] to-[#0b132b] border border-[#3a506b] shadow-md shadow-[#0b132b]/50 text-[#5bc0be]">
            <Waves className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6fffe9] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5bc0be]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Brahmaputra <span className="text-[#5bc0be]">FloodWatch</span>
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#1c2541] text-[#6fffe9] border border-[#3a506b]">
                NASA–ISRO NISAR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              NASA Space Apps Challenge 2026 • <span className="text-[#5bc0be] font-medium">Dancing with the SARs</span>
            </p>
          </div>
        </div>

        {/* 4 Main Simplified Navigation Links */}
        <nav className="flex items-center gap-1 bg-[#1c2541] p-1 rounded-xl border border-[#3a506b] text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isActive
                  ? 'bg-[#0b132b] text-[#6fffe9] font-semibold shadow-xs border border-[#5bc0be]/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#0b132b]/50'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5bc0be]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action: Pitch Deck Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#3a506b] to-[#1c2541] hover:from-[#5bc0be] hover:to-[#3a506b] hover:text-[#0b132b] text-white border border-[#5bc0be]/50 shadow-sm transition-all cursor-pointer"
            title="Open 5-Slide NASA Space Apps Presentation"
          >
            <Award className="w-3.5 h-3.5 text-[#6fffe9]" />
            <span>Judges Pitch Deck</span>
          </button>
        </div>
      </div>
    </header>
  );
}
