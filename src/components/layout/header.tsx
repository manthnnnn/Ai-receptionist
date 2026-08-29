'use client';

import React from 'react';
import { useClinic } from './clinic-context';
import { Sparkles, Building2, PhoneCall, Mic, ChevronDown, Activity } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const {
    activeClinicId,
    setActiveClinicId,
    clinics,
    activeClinic,
    setIsVoiceTesterOpen,
    setIsPhoneSimulatorOpen,
  } = useClinic();

  return (
    <header className="glass-dark sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-apple bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan transition-apple group-hover:scale-105">
            <Activity className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-white flex items-center gap-1">
            Clinic<span className="text-sky-400 font-bold">AI</span>
            <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Pro</span>
          </span>
        </Link>
      </div>

      {/* Tenant Switcher */}
      <div className="flex items-center">
        <div className="flex items-center glass-chip rounded-apple px-3.5 py-1.5 text-xs gap-2 transition-apple hover:border-sky-500/40">
          <Building2 className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.8} />
          <select
            value={activeClinicId}
            onChange={(e) => setActiveClinicId(e.target.value)}
            aria-label="Select Clinic"
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-4 appearance-none text-[12px]"
          >
            {clinics.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 -ml-2 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Latency Badge */}
        <div className="hidden sm:flex items-center gap-2 glass-chip px-3 py-1 rounded-full text-[11px] text-slate-300">
          <span className="status-dot bg-emerald-400 animate-pulse"></span>
          <span>Latency <strong className="text-emerald-400 font-semibold font-mono">~575ms</strong></span>
        </div>

        {/* PSTN Simulator */}
        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 font-medium px-3.5 py-2 rounded-apple text-xs transition-apple active:scale-95"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.8} />
          <span>Simulate Call</span>
        </button>

        {/* WebRTC Tester */}
        <button
          onClick={() => setIsVoiceTesterOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium px-4 py-2 rounded-apple text-xs transition-apple shadow-glow-cyan active:scale-95"
        >
          <Mic className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Live Voice Console</span>
        </button>
      </div>
    </header>
  );
}
