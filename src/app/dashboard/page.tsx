'use client';

import React from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { 
  ShieldCheck, 
  Terminal, 
  PlusCircle, 
  Calendar, 
  Phone, 
  TrendingUp, 
  Zap, 
  Coins, 
  Banknote,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  PhoneCall,
  Activity,
  Microscope,
  Stethoscope
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { activeClinic, stats, setIsVoiceTesterOpen, setIsManualBookingOpen, setIsPhoneSimulatorOpen } = useClinic();

  const kpiCards = [
    {
      label: 'Confirmed Appointments',
      value: stats?.appointments_count ?? 3,
      suffix: '',
      accent: 'text-sky-400',
      borderGlow: 'hover:border-sky-500/40',
      sub: 'Zero collision lock',
      subIcon: ShieldCheck,
      subColor: 'text-sky-400',
    },
    {
      label: 'Telephony Inbound Calls',
      value: stats?.total_calls_count ?? 3,
      suffix: '',
      accent: 'text-white',
      borderGlow: 'hover:border-indigo-500/40',
      sub: 'PSTN + WebRTC Streams',
      subIcon: PhoneCall,
      subColor: 'text-slate-400',
    },
    {
      label: 'Autonomous Booking Rate',
      value: stats?.booking_rate_percentage ?? 33.3,
      suffix: '%',
      accent: 'text-emerald-400',
      borderGlow: 'hover:border-emerald-500/40',
      sub: 'AI Voice Conversion',
      subIcon: TrendingUp,
      subColor: 'text-emerald-400',
    },
    {
      label: 'Avg Turnaround Latency',
      value: stats?.avg_turn_latency_ms ?? 579,
      suffix: 'ms',
      accent: 'text-cyan-400',
      borderGlow: 'hover:border-cyan-500/40',
      sub: 'Sub-800ms human-parity',
      subIcon: Zap,
      subColor: 'text-cyan-400',
    },
    {
      label: 'Direct Pipeline Cost',
      value: `₹${stats?.direct_cogs_inr ?? 11.63}`,
      suffix: '',
      accent: 'text-amber-400',
      borderGlow: 'hover:border-amber-500/40',
      sub: '₹3.23 / min blended',
      subIcon: Coins,
      subColor: 'text-amber-400',
    },
    {
      label: 'Attributed Patient Revenue',
      value: `₹${stats?.est_revenue_inr ?? 1950}`,
      suffix: '',
      accent: 'text-sky-400',
      borderGlow: 'hover:border-sky-500/40',
      sub: 'Verified consultations',
      subIcon: Banknote,
      subColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Title Banner */}
      <div className="glass-panel rounded-apple-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/[0.09] shadow-apple-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Active Medical Tenant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {activeClinic?.name || 'Apollo Dental Clinic'}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="status-dot bg-emerald-400 animate-pulse"></span>
              PostgreSQL RLS Protected
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-300">Carrier SIP / PSTN Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-medium text-xs px-4 py-2.5 rounded-apple transition-apple active:scale-95"
          >
            <Terminal className="w-4 h-4 text-sky-400" strokeWidth={1.8} />
            <span>Voice Console</span>
          </button>

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-apple transition-apple shadow-glow-cyan active:scale-95"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={2} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`glass-panel rounded-apple-xl p-5 flex flex-col justify-between border border-white/[0.07] card-hover ${card.borderGlow}`}
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
            <div className="my-3">
              <span className={`text-[32px] font-bold tracking-tight ${card.accent}`}>
                {card.value}{card.suffix}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-white/[0.04]">
              {card.subIcon && <card.subIcon className={`w-3.5 h-3.5 ${card.subColor}`} strokeWidth={1.8} />}
              <span className={card.subColor}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Engine Banner */}
      <div className="glass-dark rounded-apple-xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-sky-500/20 shadow-glow-cyan relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 glass-chip text-sky-300 px-3 py-1 rounded-full text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />
            <span>LiveKit • Supabase RLS • Cartesia Sonic • Groq LLaMA 3.1</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">24/7 Autonomous Medical Voice Telephony</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Inbound telephony to <strong className="text-sky-300 font-mono">{activeClinic?.phone_number || '+91-80-4567-8901'}</strong> routes to autonomous speech synthesis with instantaneous database locking.
          </p>
        </div>

        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs px-5 py-3 rounded-apple transition-apple shadow-glow-cyan flex-shrink-0 active:scale-95 z-10"
        >
          <PhoneCall className="w-4 h-4 text-white" strokeWidth={2} />
          <span>Launch Phone Simulator</span>
        </button>
      </div>
    </div>
  );
}
