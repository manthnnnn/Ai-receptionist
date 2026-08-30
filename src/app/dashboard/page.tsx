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
  PhoneCall
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { activeClinic, stats, setIsVoiceTesterOpen, setIsManualBookingOpen, setIsPhoneSimulatorOpen } = useClinic();

  const kpiCards = [
    {
      label: 'Appointments',
      value: stats?.appointments_count ?? 3,
      suffix: '',
      accent: 'text-gcore-orange',
      borderColor: 'border-l-4 border-l-gcore-orange',
      sub: 'Zero collision lock',
      subIcon: ArrowUpRight,
      subColor: 'text-emerald-400',
    },
    {
      label: 'Total Inbound Calls',
      value: stats?.total_calls_count ?? 3,
      suffix: '',
      accent: 'text-white',
      borderColor: 'border-l-4 border-l-purple-500',
      sub: 'PSTN & WebRTC',
      subIcon: PhoneCall,
      subColor: 'text-slate-400',
    },
    {
      label: 'Autonomous Booking Rate',
      value: stats?.booking_rate_percentage ?? 33.3,
      suffix: '%',
      accent: 'text-emerald-400',
      borderColor: 'border-l-4 border-l-emerald-500',
      sub: 'AI voice conversion',
      subIcon: TrendingUp,
      subColor: 'text-emerald-400',
    },
    {
      label: 'Avg Turnaround Latency',
      value: stats?.avg_turn_latency_ms ?? 579,
      suffix: 'ms',
      accent: 'text-orange-400',
      borderColor: 'border-l-4 border-l-amber-500',
      sub: 'Sub-800ms human parity',
      subIcon: Zap,
      subColor: 'text-emerald-400',
    },
    {
      label: 'Direct Telephony COGS',
      value: `₹${stats?.direct_cogs_inr ?? 11.63}`,
      suffix: '',
      accent: 'text-amber-400',
      borderColor: 'border-l-4 border-l-amber-500',
      sub: '₹3.23 / min rate',
      subIcon: Coins,
      subColor: 'text-amber-400',
    },
    {
      label: 'Estimated Revenue',
      value: `₹${stats?.est_revenue_inr ?? 1950}`,
      suffix: '',
      accent: 'text-gcore-orange',
      borderColor: 'border-l-4 border-l-gcore-orange',
      sub: 'Verified consultations',
      subIcon: Banknote,
      subColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Title Banner */}
      <div className="gcore-card rounded-apple-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full gcore-badge">
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
            <span className="text-orange-300">Carrier SIP / PSTN Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="gcore-btn-dark px-4 py-2.5 text-xs flex items-center gap-2"
          >
            <Terminal className="w-4 h-4 text-gcore-orange" strokeWidth={1.8} />
            <span>Voice Console</span>
          </button>

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="gcore-btn-orange px-4 py-2.5 text-xs flex items-center gap-2 shadow-gcore-btn"
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
            className={`gcore-card rounded-apple-xl p-5 flex flex-col justify-between ${card.borderColor}`}
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
            <div className="mt-2 mb-1">
              <span className={`text-[28px] font-bold tracking-tight ${card.accent}`}>
                {card.value}{card.suffix}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-white/[0.05]">
              {card.subIcon && <card.subIcon className={`w-3.5 h-3.5 ${card.subColor}`} strokeWidth={1.8} />}
              <span className={card.subColor}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Engine Banner */}
      <div className="gcore-card rounded-apple-xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gcore-orange/30 shadow-gcore-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gcore-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 gcore-badge px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-gcore-orange" strokeWidth={2} />
            <span>LiveKit · Groq LLaMA 3.3 · Cartesia Sonic · Supabase RLS</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">24/7 Autonomous Medical Voice Telephony</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Inbound telephony to <strong className="text-orange-300 font-mono">{activeClinic?.phone_number || '+91-80-4567-8901'}</strong> routes to autonomous speech synthesis with instantaneous database locking.
          </p>
        </div>

        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="gcore-btn-orange px-6 py-3 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn flex-shrink-0 z-10"
        >
          <PhoneCall className="w-4 h-4" strokeWidth={2} />
          <span>Launch Phone Simulator</span>
        </button>
      </div>
    </div>
  );
}
