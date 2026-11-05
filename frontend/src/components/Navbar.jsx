import React, { useState } from 'react';
import { Radio, Satellite, AlertTriangle, Info, ExternalLink, ShieldCheck, Waves } from 'lucide-react';

export default function Navbar({ onOpenInfo, onOpenPresentation }) {
  return (
    <header className="bg-[#0d131f]/90 backdrop-blur border-b border-cyan-900/40 sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 shadow-lg shadow-cyan-500/20 text-black">
            <Waves className="w-6 h-6 text-black stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Brahmaputra <span className="text-cyan-400">FloodWatch</span>
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                NISAR SAR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              NASA Space Apps Challenge 2026 • Challenge: <span className="text-slate-300">Dancing with the SARs</span>
            </p>
          </div>
        </div>

        {/* Orbit & Mission Telemetry Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Sensor:</span>
            <span className="text-slate-200 font-medium">ISRO S-band / NASA L-band</span>
          </div>
          <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Orbit:</span>
            <span className="text-emerald-400 font-mono font-medium">Track 019 / Frame 075 (12-Day)</span>
          </div>
          <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Level:</span>
            <span className="text-blue-300 font-mono font-medium">Level-2 GCOV (RTC)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-md shadow-amber-500/20 transition-all"
          >
            <span>Judges Pitch Deck</span>
          </button>
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-800/50 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Mission & Physics</span>
          </button>
          <a
            href="https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <span>NASA Challenge</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}

