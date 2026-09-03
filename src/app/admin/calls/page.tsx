'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, Filter, RefreshCw, Clock, Activity, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeTranscript, setActiveTranscript] = useState<{ callId: string; preview: string } | null>(null);

  const fetchClinicsAndCalls = async () => {
    try {
      setLoading(true);
      const [clinicsRes, callsRes] = await Promise.all([
        fetch('/api/admin/clinics'),
        fetch(`/api/admin/calls?${selectedClinic !== 'ALL' ? `clinic_id=${selectedClinic}&` : ''}${selectedOutcome !== 'ALL' ? `outcome=${selectedOutcome}` : ''}`),
      ]);

      const clinicsData = await clinicsRes.json();
      const callsData = await callsRes.json();

      if (clinicsData.success) setClinics(clinicsData.clinics || []);
      if (callsData.success) setCalls(callsData.calls || []);
    } catch (err) {
      console.error('Error loading admin call telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicsAndCalls();
  }, [selectedClinic, selectedOutcome]);

  const totalMinutes = Math.round(calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);
  const bookedCount = calls.filter((c) => c.outcome === 'BOOKED').length;
  const bookingRate = calls.length > 0 ? Math.round((bookedCount / calls.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-indigo-400" />
            <span>Cross-Clinic Call Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live call stream across all subscribed clinics with transcript inspection and latency analytics.
          </p>
        </div>

        <button
          onClick={fetchClinicsAndCalls}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Feed</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Platform Calls Logged</span>
          <div className="text-2xl font-bold text-white mt-1">{calls.length}</div>
          <span className="text-[11px] text-indigo-400 mt-1 block">Live inbound stream</span>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Total Minutes Processed</span>
          <div className="text-2xl font-bold text-white mt-1">{totalMinutes} mins</div>
          <span className="text-[11px] text-teal-400 mt-1 block">Twilio PSTN + LiveKit audio</span>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Global AI Booking Rate</span>
          <div className="text-2xl font-bold text-white mt-1">{bookingRate}%</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">{bookedCount} appointments booked</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Clinic:</span>
          </div>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Subscribed Clinics ({clinics.length})</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-slate-400 ml-2">
            <span>Outcome:</span>
          </div>
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Terminal Outcomes</option>
            <option value="BOOKED">BOOKED</option>
            <option value="FAQ_ANSWERED">FAQ_ANSWERED</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="ABANDONED">ABANDONED</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-500">
          Showing {calls.length} calls
        </span>
      </div>

      {/* Telemetry Stream Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/40 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Clinic Tenant</th>
                <th className="py-3 px-5">Caller Phone</th>
                <th className="py-3 px-5">Duration</th>
                <th className="py-3 px-5">Intent / Summary</th>
                <th className="py-3 px-5">Terminal Outcome</th>
                <th className="py-3 px-5 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading cross-clinic telemetry stream...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No calls match selected filters.
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 text-slate-400 font-mono">
                      {new Date(c.started_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-5 font-semibold text-white">
                      {c.clinic_name}
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-300">
                      {c.caller_phone}
                    </td>
                    <td className="py-3 px-5 font-mono">
                      {c.duration_seconds || 0}s
                    </td>
                    <td className="py-3 px-5 max-w-xs truncate text-slate-400" title={c.call_intent || c.transcript_preview}>
                      {c.call_intent || c.transcript_preview || 'Inbound Reception Turn'}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.outcome === 'BOOKED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.outcome === 'ESCALATED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : c.outcome === 'ABANDONED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {c.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      {c.transcript_preview ? (
                        <button
                          onClick={() => setActiveTranscript({ callId: c.id, preview: c.transcript_preview })}
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Modal */}
      {activeTranscript && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Call Transcript: {activeTranscript.callId}</h3>
              <button
                onClick={() => setActiveTranscript(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
              {activeTranscript.preview}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveTranscript(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
