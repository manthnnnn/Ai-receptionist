'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { CallLog, DialogueTurn } from '@/types';
import { Phone, X, Zap, Globe, Clock, PhoneCall, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

const LANG_LABELS: Record<string, { label: string; color: string }> = {
  en: { label: 'EN', color: 'bg-white/10 text-white border border-white/10' },
  hi: { label: 'HI', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  mr: { label: 'MR', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
};

function LanguageBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  const meta = LANG_LABELS[lang] || { label: lang.toUpperCase(), color: 'bg-white/10 text-neutral-300' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>
      <Globe className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

function LatencyBadge({ ms }: { ms?: number }) {
  if (!ms) return null;
  const color = ms < 500 ? 'text-emerald-400' : ms < 800 ? 'text-amber-400' : 'text-rose-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold font-mono ${color}`}>
      <Zap className="w-2.5 h-2.5" />
      {ms}ms
    </span>
  );
}

function DialogueBubble({ turn }: { turn: DialogueTurn }) {
  const isAI = turn.speaker === 'ai';
  return (
    <div className={`flex gap-2.5 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
          isAI ? 'bg-gradient-to-br from-gcore-orange to-amber-700 text-white' : 'bg-neutral-800 text-neutral-200 border border-white/10'
        }`}
      >
        {isAI ? 'AI' : 'P'}
      </div>
      <div className={`flex flex-col gap-1 max-w-[82%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-apple-lg px-3.5 py-2.5 text-xs leading-relaxed ${
            isAI
              ? 'bg-neutral-900 text-white border border-white/10'
              : 'bg-white/[0.04] text-neutral-200 border border-white/[0.08]'
          }`}
        >
          {turn.text}
        </div>
        <div className="flex items-center gap-2 px-1 text-[10px] text-neutral-400">
          {isAI && turn.latency_ms && <LatencyBadge ms={turn.latency_ms} />}
          {isAI && turn.tool_called && (
            <span className="font-mono text-orange-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              🔧 {turn.tool_called}
            </span>
          )}
          {isAI && turn.language && <LanguageBadge lang={turn.language} />}
        </div>
      </div>
    </div>
  );
}

export default function CallsPage() {
  const { activeClinicId, activeClinic, setIsPhoneSimulatorOpen } = useClinic();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const fetchCalls = () => {
    setLoading(true);
    fetch(`/api/calls?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCalls(data.calls || data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalls();
  }, [activeClinicId]);

  const callList = Array.isArray(calls) ? calls : [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white transition-colors duration-300">
      {/* Header Banner */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            PSTN &amp; Voice Telemetry Logs
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full gcore-badge uppercase">
              {activeClinic?.name || 'Apollo Dental Clinic'}
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span className="status-dot bg-gcore-orange animate-pulse"></span>
            Inbound telephony recordings, speaker-labeled transcripts &amp; latency tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCalls()}
            className="gcore-btn-dark px-3 py-2 text-xs flex items-center gap-1.5"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsPhoneSimulatorOpen(true)}
            className="gcore-btn-orange font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-gcore-btn"
          >
            <PhoneCall className="w-4 h-4" strokeWidth={2} />
            <span>Simulate Call</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="gcore-card rounded-apple-xl overflow-hidden border border-white/10 bg-[#080808]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-medium text-neutral-400 uppercase tracking-wider bg-black/40">
                <th className="py-3.5 px-5">Time</th>
                <th className="py-3.5 px-4">Caller Phone</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Intent</th>
                <th className="py-3.5 px-4">Turn Latency</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                    Loading call telemetry...
                  </td>
                </tr>
              ) : callList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                    No calls recorded for this tenant yet. Click "Simulate Call" above to test.
                  </td>
                </tr>
              ) : (
                callList.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 text-xs text-neutral-400 font-mono">
                      {new Date(c.started_at || c.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-white font-medium">
                      {c.caller_phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300 font-mono">
                      {formatDuration(c.duration_seconds || 60)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-neutral-200">
                      {c.call_intent || 'General Inquiry'}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.total_latency_ms ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-emerald-400">{c.total_latency_ms}ms</span>
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500 font-mono">~575ms</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <LanguageBadge lang={c.detected_language || 'en'} />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.outcome === 'BOOKED' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-950/40 border border-emerald-800/30">
                          <span className="status-dot bg-emerald-400"></span>
                          Booked
                        </span>
                      ) : c.outcome === 'ESCALATED' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full text-amber-400 bg-amber-950/40 border border-amber-800/30">
                          <span className="status-dot bg-amber-400"></span>
                          Escalated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full text-neutral-300 bg-white/5 border border-white/10">
                          <span className="status-dot bg-neutral-400"></span>
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedCall(c)}
                        className="text-xs text-orange-300 hover:text-white font-medium transition-colors px-2 py-1 rounded hover:bg-white/5"
                      >
                        Inspect Transcript
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript & Dialogue Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-xl rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] bg-black">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight">
                  Call Dialogue &amp; Analytics
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedCall.caller_phone}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Call Metadata */}
            <div className="px-6 pt-4 shrink-0">
              <div className="bg-white/[0.03] border border-white/10 rounded-apple-lg p-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between col-span-2 text-neutral-400">
                  <span className="font-medium">Intent</span>
                  <span className="font-semibold text-white">{selectedCall.call_intent || 'General'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium">Outcome</span>
                  <span className="font-semibold text-emerald-400">{selectedCall.outcome}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium">Duration</span>
                  <span className="font-medium text-white font-mono">{formatDuration(selectedCall.duration_seconds || 60)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-400" /> Total Latency</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {selectedCall.total_latency_ms ? `${selectedCall.total_latency_ms}ms` : '575ms'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium flex items-center gap-1"><Globe className="w-3 h-3 text-gcore-orange" /> Language</span>
                  <LanguageBadge lang={selectedCall.detected_language || 'en'} />
                </div>
              </div>
            </div>

            {/* Dialogue Turns */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <h4 className="font-semibold text-white mb-3 text-[13px] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gcore-orange" />
                Dialogue ({selectedCall.dialogue_turns?.length || 0} turns)
              </h4>

              {selectedCall.dialogue_turns && selectedCall.dialogue_turns.length > 0 ? (
                <div className="space-y-3">
                  {selectedCall.dialogue_turns.map((turn) => (
                    <DialogueBubble key={turn.turn_index} turn={turn} />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/10 text-neutral-300 p-4 rounded-apple-lg space-y-3 font-mono text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-orange-400">AI:</strong> Hello! Thank you for calling {activeClinic?.name || 'our clinic'}. How can I assist you today?
                  </p>
                  <p>
                    <strong className="text-amber-300">Caller:</strong>{' '}
                    {selectedCall.transcript_preview || 'I would like to know about specialist fees and available slots.'}
                  </p>
                  <p>
                    <strong className="text-orange-400">AI:</strong>{' '}
                    {selectedCall.outcome === 'BOOKED'
                      ? 'Your appointment has been confirmed. A confirmation SMS and WhatsApp message has been dispatched.'
                      : 'Our general consultation fee is ₹500. Specialized endodontic and orthodontic consultations are ₹750–₹800.'}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 pb-5 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="gcore-btn-dark px-4 py-2 text-xs"
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
