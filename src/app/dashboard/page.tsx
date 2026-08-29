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
      accent: 'text-primary-600',
      borderColor: 'accent-border-blue',
      sub: 'Active slots',
      subIcon: ArrowUpRight,
      subColor: 'text-emerald-600',
    },
    {
      label: 'Total Calls',
      value: stats?.total_calls_count ?? 3,
      suffix: '',
      accent: 'text-surface-900',
      borderColor: 'accent-border-purple',
      sub: 'PSTN & WebRTC',
      subIcon: null,
      subColor: 'text-surface-400',
    },
    {
      label: 'Booking Rate',
      value: stats?.booking_rate_percentage ?? 33.3,
      suffix: '%',
      accent: 'text-emerald-600',
      borderColor: 'accent-border-green',
      sub: 'AI conversion',
      subIcon: TrendingUp,
      subColor: 'text-emerald-600',
    },
    {
      label: 'Avg Latency',
      value: stats?.avg_turn_latency_ms ?? 579,
      suffix: 'ms',
      accent: 'text-primary-600',
      borderColor: 'accent-border-cyan',
      sub: 'Sub-800ms ✓',
      subIcon: null,
      subColor: 'text-emerald-600',
    },
    {
      label: 'Direct COGS',
      value: `₹${stats?.direct_cogs_inr ?? 11.63}`,
      suffix: '',
      accent: 'text-amber-600',
      borderColor: 'accent-border-amber',
      sub: '₹3.23 / min rate',
      subIcon: null,
      subColor: 'text-surface-400',
    },
    {
      label: 'Est. Revenue',
      value: `₹${stats?.est_revenue_inr ?? 1950}`,
      suffix: '',
      accent: 'text-primary-600',
      borderColor: 'accent-border-blue',
      sub: 'Consultation fees',
      subIcon: null,
      subColor: 'text-surface-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Title Banner */}
      <div className="bg-white rounded-apple-lg shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-surface-900 tracking-apple">
            {activeClinic?.name || 'Apollo Dental Clinic'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-surface-400 mt-1.5 font-medium">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="status-dot bg-emerald-400"></span>
              RLS Active
            </span>
            <span className="text-surface-300">•</span>
            <span>Sub-800ms Voice Pipeline</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVoiceTesterOpen(true)}
            className="flex items-center gap-2 bg-surface-50 hover:bg-surface-100 text-surface-600 border border-surface-200 hover:border-surface-300 font-medium text-xs px-4 py-2 rounded-apple transition-apple"
          >
            <Terminal className="w-4 h-4 text-surface-400" strokeWidth={1.5} />
            <span>Voice Console</span>
          </button>

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2 rounded-apple transition-apple shadow-sm"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-apple-lg shadow-card card-hover p-5 flex flex-col justify-between ${card.borderColor}`}
          >
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{card.label}</span>
            <div className="mt-2 mb-1">
              <span className={`text-[28px] font-semibold tracking-apple ${card.accent}`}>
                {card.value}{card.suffix}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {card.subIcon && <card.subIcon className={`w-3 h-3 ${card.subColor}`} strokeWidth={1.5} />}
              <span className={card.subColor}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Engine Banner */}
      <div className="bg-surface-900 rounded-apple-lg shadow-card p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-primary-300 px-3 py-1 rounded-full text-xs font-medium mb-3">
            <Sparkles className="w-3 h-3" strokeWidth={1.5} />
            <span>LiveKit + Supabase RLS + Cartesia</span>
          </div>
          <h3 className="text-base font-semibold tracking-apple">24/7 Autonomous AI Receptionist</h3>
          <p className="text-xs text-surface-400 max-w-2xl mt-1 leading-relaxed">
            Incoming calls to {activeClinic?.phone_number || '+91-80-4567-8901'} are handled automatically with zero manual intervention.
          </p>
        </div>

        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-5 py-2.5 rounded-apple transition-apple shadow-sm flex-shrink-0"
        >
          <PhoneCall className="w-4 h-4" strokeWidth={1.5} />
          <span>Simulate Call</span>
        </button>
      </div>
    </div>
  );
}
