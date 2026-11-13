import React from 'react';
import { Award, Compass, HeartHandshake, ShieldCheck, Waves, ExternalLink, Globe, Sparkles } from 'lucide-react';

export default function AboutProjectView({ onOpenPresentation }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-midnight text-white rounded-xl border border-indigo p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md bg-indigo text-aqua border border-dusk inline-block mb-3 font-mono">
            NASA Space Apps Challenge 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">
            Dancing with the SARs: Brahmaputra FloodWatch
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bridging cutting-edge radar astrophysics and humanitarian disaster management to protect 30 million 
            residents and UNESCO wildlife habitats in Assam, India.
          </p>

          <div className="mt-5">
            <button
              onClick={onOpenPresentation}
              className="px-4 py-2 rounded-md bg-white text-midnight font-semibold text-xs hover:bg-cloud border border-border transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-teal" />
              <span>Launch 5-Slide Judges Pitch Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Problem & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-border shadow-xs space-y-2 text-xs">
          <div className="w-8 h-8 rounded-md bg-cloud text-midnight border border-border flex items-center justify-center font-bold font-mono">
            01
          </div>
          <h3 className="text-sm font-semibold text-primary">The Brahmaputra Crisis</h3>
          <p className="text-body leading-relaxed">
            Every monsoon season, the Brahmaputra River overflows, inundating agricultural sandbars (chars) and cutting off wildlife corridors in Kaziranga National Park. Optical satellites are blinded by persistent monsoon clouds.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-border shadow-xs space-y-2 text-xs">
          <div className="w-8 h-8 rounded-md bg-cloud text-midnight border border-border flex items-center justify-center font-bold font-mono">
            02
          </div>
          <h3 className="text-sm font-semibold text-primary">The NISAR Breakthrough</h3>
          <p className="text-body leading-relaxed">
            The NASA–ISRO NISAR satellite carries dual-frequency L-band and S-band radar. It transmits active microwaves that penetrate clouds and rain 24/7, while exact 12-day orbital intervals enable consistent-geometry change detection.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-border shadow-xs space-y-2 text-xs">
          <div className="w-8 h-8 rounded-md bg-cloud text-midnight border border-border flex items-center justify-center font-bold font-mono">
            03
          </div>
          <h3 className="text-sm font-semibold text-primary">Humanitarian Impact</h3>
          <p className="text-body leading-relaxed">
            Our platform translates complex microwave tensor arrays into immediate, actionable intelligence: interactive water extent maps, verified flood expansion metrics, and lightweight vector downloads for rescue boat navigation.
          </p>
        </div>
      </div>

      {/* Citations & Open Science Acknowledgments */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-xs space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-teal" />
          Institutional Acknowledgments & Data Sources
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-body">
          <div className="p-3 rounded-lg bg-subtle border border-border">
            <strong className="text-primary block mb-1">NASA / JPL-Caltech</strong>
            <span>NISAR L-band Radar Science Team, Science Data System (SDS), and Algorithms.</span>
          </div>
          <div className="p-3 rounded-lg bg-subtle border border-border">
            <strong className="text-primary block mb-1">ISRO / NRSC</strong>
            <span>S-band SAR Payload, Bhoonidhi Open Data Access Portal, and Space Applications Centre.</span>
          </div>
          <div className="p-3 rounded-lg bg-subtle border border-border">
            <strong className="text-primary block mb-1">NASA Earthdata / ASF</strong>
            <span>Alaska Satellite Facility Distributed Active Archive Center (ASF DAAC).</span>
          </div>
          <div className="p-3 rounded-lg bg-subtle border border-border">
            <strong className="text-primary block mb-1">ASDMA Assam</strong>
            <span>Assam State Disaster Management Authority & Kaziranga Wildlife Division.</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <span>Open-Source Science Implementation • Apache License 2.0</span>
          <span>NASA Space Apps Challenge 2026</span>
        </div>
      </div>
    </div>
  );
}

