'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Clinic } from '@/types';
import { 
  Building2, Plus, Phone, Globe, Shield, Mic, CheckCircle2, 
  Power, Trash2, ArrowRight, Activity, Zap, ExternalLink, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

interface ClinicOverviewItem extends Clinic {
  doctors_count?: number;
  appointments_count?: number;
  calls_count?: number;
}

export default function ClientClinicsPage() {
  const { 
    clinics, 
    activeClinicId, 
    setActiveClinicId, 
    toggleAgentActive, 
    deleteClinic, 
    setIsAddClinicModalOpen, 
    setIsVoiceTesterOpen,
    refreshData 
  } = useClinic();

  const [clinicList, setClinicList] = useState<ClinicOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClinics = () => {
    setLoading(true);
    fetch('/api/clinic?all=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.clinics) {
          setClinicList(data.clinics);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClinics();
  }, [clinics]);

  const handleToggleAgent = async (clinicId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setClinicList((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, agent_enabled: !currentStatus } : c))
      );

      const res = await fetch('/api/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          agent_enabled: !currentStatus,
          ai_enabled: !currentStatus,
        }),
      });

      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Error toggling clinic agent:', err);
    }
  };

  const handleDelete = async (clinicId: string, clinicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${clinicName}"? All telephony routing, doctor rosters, and appointments will be removed.`)) {
      await deleteClinic(clinicId);
      fetchClinics();
    }
  };

  const handleSwitchClinic = (clinicId: string) => {
    setActiveClinicId(clinicId);
  };

  // Aggregated Reselling Stats
  const totalClinics = clinicList.length;
  const activeAgents = clinicList.filter((c) => c.agent_enabled !== false).length;
  const totalMinutes = clinicList.reduce((acc, c) => acc + (c.monthly_minutes_used || 0), 0);
  const estMonthlyRevenue = clinicList.reduce((acc, c) => {
    const tier = c.plan_tier || 'growth';
    const rate = tier === 'enterprise' ? 14999 : tier === 'starter' ? 4999 : 8999;
    return acc + rate;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-white [html.light_&]:text-slate-900 transition-colors duration-300">
      {/* Header Banner */}
      <div className="gcore-card rounded-apple-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full gcore-badge">
              Agency &amp; Reseller Admin
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Multi-Tenant Isolation
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Client Clinics &amp; White-Label Management
          </h1>
          <p className="text-xs text-neutral-400 [html.light_&]:text-slate-600 mt-1">
            Provision, manage, and toggle autonomous AI receptionists across all your healthcare clients.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchClinics}
            className="gcore-btn-dark px-3 py-2 text-xs flex items-center gap-1.5"
            title="Refresh clinics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsAddClinicModalOpen(true)}
            className="gcore-btn-orange px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-gcore-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Onboard New Clinic</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="gcore-card rounded-apple-xl p-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Client Clinics</span>
          <p className="text-2xl font-extrabold mt-1 text-white [html.light_&]:text-slate-900">{totalClinics}</p>
          <span className="text-[11px] text-orange-400 font-medium mt-1 block">Active Medical Tenants</span>
        </div>

        <div className="gcore-card rounded-apple-xl p-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">AI Agents Status</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-400">{activeAgents}</span>
            <span className="text-xs text-neutral-500 font-medium">/ {totalClinics} Active</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-medium mt-1 block">
            {totalClinics - activeAgents > 0 ? `${totalClinics - activeAgents} Paused (PSTN Forwarding)` : 'All Agents Live'}
          </span>
        </div>

        <div className="gcore-card rounded-apple-xl p-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Monthly Telephony</span>
          <p className="text-2xl font-extrabold mt-1 text-white [html.light_&]:text-slate-900 font-mono">{totalMinutes} <span className="text-xs font-normal text-neutral-400">mins</span></p>
          <span className="text-[11px] text-neutral-400 font-medium mt-1 block">Deepgram + Cartesia TTS</span>
        </div>

        <div className="gcore-card rounded-apple-xl p-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Est. Monthly MRR</span>
          <p className="text-2xl font-extrabold mt-1 text-gcore-orange font-mono">₹{estMonthlyRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-orange-400 font-medium mt-1 block">SaaS Subscriptions</span>
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicList.map((c) => {
          const isSelected = c.id === activeClinicId;
          const isEnabled = c.agent_enabled !== false;
          const usedMins = c.monthly_minutes_used || 0;
          const limitMins = c.monthly_minute_limit || 1000;
          const percentUsed = Math.min(100, Math.round((usedMins / limitMins) * 100));

          return (
            <div
              key={c.id}
              onClick={() => handleSwitchClinic(c.id)}
              className={`gcore-card rounded-apple-xl p-5 border flex flex-col justify-between cursor-pointer transition-apple relative overflow-hidden bg-[#080808] [html.light_&]:bg-white ${
                isSelected
                  ? 'border-gcore-orange shadow-gcore-glow ring-1 ring-gcore-orange/40'
                  : 'border-white/10 [html.light_&]:border-slate-200 hover:border-gcore-orange/40'
              }`}
            >
              <div>
                {/* Top Row: Active Pill + Master Agent Switch */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gcore-orange text-white px-2 py-0.5 rounded-full shadow-xs">
                        Current Active
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full gcore-badge font-bold">
                      {c.plan_tier || 'growth'}
                    </span>
                  </div>

                  {/* Per-Clinic Master Switch */}
                  <button
                    onClick={(e) => handleToggleAgent(c.id, isEnabled, e)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-apple ${
                      isEnabled
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                        : 'bg-rose-950/70 border-rose-500/40 text-rose-300 hover:bg-rose-900/80'
                    }`}
                    title={isEnabled ? 'Click to Pause AI Agent' : 'Click to Activate AI Agent'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isEnabled ? 'AI ON' : 'PAUSED'}</span>
                  </button>
                </div>

                {/* Clinic Name & Address */}
                <h3 className="text-base font-bold text-white [html.light_&]:text-slate-900 tracking-tight leading-snug">
                  {c.name}
                </h3>
                <p className="text-xs text-neutral-400 [html.light_&]:text-slate-500 mt-1 line-clamp-1">
                  {c.address}
                </p>

                {/* Phone & Persona Details */}
                <div className="mt-3.5 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 [html.light_&]:bg-slate-50 border border-white/5 [html.light_&]:border-slate-200">
                    <span className="text-neutral-400 [html.light_&]:text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gcore-orange" />
                      DID
                    </span>
                    <span className="text-orange-300 [html.light_&]:text-orange-700 font-semibold">{c.phone_number}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 [html.light_&]:bg-slate-50 border border-white/5 [html.light_&]:border-slate-200">
                    <span className="text-neutral-400 [html.light_&]:text-slate-500 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-gcore-orange" />
                      Agent Persona
                    </span>
                    <span className="text-white [html.light_&]:text-slate-800 font-medium">
                      {c.agent_name || 'Maya'} ({c.primary_language === 'mr' ? 'मराठी' : c.primary_language === 'hi' ? 'हिंदी' : 'English'})
                    </span>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 [html.light_&]:text-slate-500">Telephony Usage</span>
                    <span className="font-mono text-neutral-300 [html.light_&]:text-slate-700 font-medium">
                      {usedMins} / {limitMins} mins ({percentUsed}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 [html.light_&]:bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentUsed > 85 ? 'bg-rose-500' : percentUsed > 60 ? 'bg-amber-500' : 'bg-gcore-orange'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Stats & Actions */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.08] [html.light_&]:border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-neutral-400 [html.light_&]:text-slate-500">
                  <span><strong>{c.doctors_count ?? 1}</strong> docs</span>
                  <span>•</span>
                  <span><strong>{c.appointments_count ?? 0}</strong> appts</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDelete(c.id, c.name, e)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-apple"
                    title="Delete Clinic"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchClinic(c.id);
                      setIsVoiceTesterOpen(true);
                    }}
                    className="gcore-btn-orange px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <span>Test Voice</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
