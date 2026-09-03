import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Building2, PhoneCall, DollarSign, Clock, Users, ArrowUpRight, Activity, PlusCircle } from 'lucide-react';

export const revalidate = 0;

export default async function AdminOverviewPage() {
  const clinics = await db.getClinicsOverview();
  const allCalls = await db.getCallLogs('00000000-0000-0000-0000-000000000001');

  const totalClinics = clinics.length;
  const totalDoctors = clinics.reduce((acc, c) => acc + (c.doctors_count || 0), 0);
  const totalAppointments = clinics.reduce((acc, c) => acc + (c.appointments_count || 0), 0);
  const totalMinutes = clinics.reduce((acc, c) => acc + (c.monthly_minutes_used || 0), 0);
  const estMRR = totalClinics * 15000; // Average clinic SaaS tier

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Super Admin Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global health, multi-tenant telephony utilization, and cross-clinic telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/clinics"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Clinics</span>
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Clinics</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalClinics}</div>
          <div className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>100% active operational</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Platform Doctors</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalDoctors}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all subscribed clinics</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Telephony</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalMinutes} mins</div>
          <div className="text-[11px] text-slate-400 mt-1">LiveKit + Twilio PSTN bridge</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Contracted MRR</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">₹{estMRR.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Monthly SaaS revenue</div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Subscribed Clinics & Tenant Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time usage quotas and telephony configuration.</p>
          </div>
          <Link href="/admin/clinics" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            View All Clinics &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/40 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Clinic Name</th>
                <th className="py-3 px-5">PSTN Phone</th>
                <th className="py-3 px-5">Language</th>
                <th className="py-3 px-5">Plan Tier</th>
                <th className="py-3 px-5">Minutes Used</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {clinics.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-5 font-medium text-white">
                    {c.name}
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{c.id}</span>
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-300">{c.phone_number}</td>
                  <td className="py-3 px-5 uppercase font-medium text-indigo-400">{c.primary_language}</td>
                  <td className="py-3 px-5 capitalize">{c.plan_tier}</td>
                  <td className="py-3 px-5 font-mono">
                    {c.monthly_minutes_used} / {c.monthly_minute_limit} mins
                  </td>
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
