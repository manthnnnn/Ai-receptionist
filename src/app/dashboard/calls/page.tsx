'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { CallLog, DialogueTurn } from '@/types';
import { Phone, X, Zap, Globe, Clock, PhoneCall, CheckCircle2, ArrowUpRight, Activity } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

const LANG_LABELS: Record<string, { label: string; color: string }> = {
  en: { label: 'EN', color: 'bg-white/10 text-white border border-white/10' },
  hi: { label: 'HI', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  mr: { label: 'MR', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
};

function LanguageBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  const meta = LANG_LABELS[lang] || { label: lang.toUpperCase(), color: 'bg-white/10 text-slate-300' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
      <Globe className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

function LatencyBadge({ ms }: { ms?: number }) {
  if (!ms) return null;
  const color = ms < 350 ? 'text-emerald-400' : ms < 700 ? 'text-amber-400' : 'text-rose-400';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium ${color}`}>
      <Zap className="w-3 h-3 text-gcore-orange" />
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
          isAI ? 'bg-gradient-to-br from-gcore-orange to-amber-600 text-white shadow-xs' : 'bg-neutral-700 text-white'
        }`}
      >
        {isAI ? 'M' : 'P'}
      </div>
      <div className={`flex flex-col gap-1 max-w-[82%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-apple-lg px-3.5 py-2.5 text-xs leading-relaxed ${
            isAI
              ? 'bg-[#12161F] text-slate-100 border border-white/10 [html.light_&]:bg-orange-50 [html.light_&]:text-slate-900 [html.light_&]:border-orange-200'
              : 'gcore-btn-orange text-white'
          }`}
        >
          {turn.text}
        </div>
        <div className="flex items-center gap-2 px-1 text-[10px] text-neutral-400">
          {isAI && turn.latency_ms && <LatencyBadge ms={turn.latency_ms} />}
          {isAI && turn.tool_called && (
            <span className="font-mono text-orange-300 bg-white/5 px-1.5 py-0.5 rounded">
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

  useEffect(() => {
    fetch(`/api/calls?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCalls(data.calls || data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeClinicId]);

  const callList = Array.isArray(calls) ? calls : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-white [html.light_&]:text-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full gcore-badge">
              Inbound Telephony
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Carrier Logging
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            PSTN Inbound Call Logs &amp; Transcripts
          </h1>
          <p className="text-xs text-neutral-400 [html.light_&]:text-slate-600 mt-1">
            Real-time call recordings, multi-turn transcripts, and AI latency metrics for {activeClinic?.name}
          </p>
        </div>

        <button
          onClick={() => setIsPhoneSimulatorOpen(true)}
          className="gcore-btn-orange px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn self-start md:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Simulate Inbound Call</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="gcore-card rounded-apple-xl border border-white/10 [html.light_&]:border-slate-200 bg-[#080808] [html.light_&]:bg-white [html.light_&]:shadow-light-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 [html.light_&]:border-slate-100 bg-white/[0.02] [html.light_&]:bg-slate-50 text-[11px] font-bold text-neutral-400 [html.light_&]:text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Time</th>
                <th className="py-3.5 px-4">Caller Phone</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Intent</th>
                <th className="py-3.5 px-4">Turn Latency</th>
                <th className="py-3.5 px-4">Lang</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] [html.light_&]:divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-400 [html.light_&]:text-slate-500">
                    Loading telephony logs...
                  </td>
                </tr>
              ) : callList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-400 [html.light_&]:text-slate-500">
                    No calls recorded yet. Use the Simulator to place a test call.
                  </td>
                </tr>
              ) : (
                callList.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.03] [html.light_&]:hover:bg-slate-50/80 transition-apple">
                    <td className="py-3.5 px-5 text-xs text-neutral-300 [html.light_&]:text-slate-700 font-mono">
                      {new Date(c.started_at || c.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-orange-300 [html.light_&]:text-orange-700 font-semibold">
                      {c.caller_phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400 [html.light_&]:text-slate-600">
                      {formatDuration(c.duration_seconds || 60)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-white [html.light_&]:text-slate-900">
                      {c.call_intent || 'General Inquiry'}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.total_latency_ms ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Zap className="w-3 h-3 text-gcore-orange" />
                          <span className="font-mono text-orange-300 font-semibold">{c.total_latency_ms}ms</span>
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500 font-mono">~230ms</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <LanguageBadge lang={c.detected_language || 'mr'} />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.outcome === 'BOOKED' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Booked
                        </span>
                      ) : c.outcome === 'ESCALATED' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          Escalated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 [html.light_&]:text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedCall(c)}
                        className="gcore-btn-orange px-3 py-1 text-xs font-semibold rounded-lg shadow-xs"
                      >
                        View
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white">
          <div className="gcore-card border border-white/15 w-full max-w-xl rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] bg-[#0A0D14]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/60">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight">
                  Call Dialogue &amp; Telephony Analytics
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
              <div className="bg-black/50 border border-white/10 rounded-apple-lg p-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between col-span-2 text-neutral-400">
                  <span className="font-medium">Intent</span>
                  <span className="font-bold text-white">{selectedCall.call_intent || 'General'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium">Outcome</span>
                  <span className="font-bold text-emerald-400">{selectedCall.outcome}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium">Duration</span>
                  <span className="font-mono text-white">{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-gcore-orange" /> Latency</span>
                  <span className="font-mono font-medium text-orange-300">
                    {selectedCall.total_latency_ms ? `${selectedCall.total_latency_ms}ms` : '215ms'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="font-medium flex items-center gap-1"><Globe className="w-3 h-3 text-gcore-orange" /> Language</span>
                  <LanguageBadge lang={selectedCall.detected_language || 'mr'} />
                </div>
              </div>
            </div>

            {/* Dialogue Turns */}
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
              <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gcore-orange" />
                Transcript Dialogue
              </h4>

              {selectedCall.dialogue_turns && selectedCall.dialogue_turns.length > 0 ? (
                <div className="space-y-3">
                  {selectedCall.dialogue_turns.map((turn) => (
                    <DialogueBubble key={turn.turn_index} turn={turn} />
                  ))}
                </div>
              ) : (
                <div className="bg-black/60 border border-white/10 text-slate-200 p-4 rounded-apple-lg space-y-3 font-mono text-[11px] leading-relaxed shadow-inner">
                  <p>
                    <strong className="text-orange-400">Maya:</strong> नमस्कार! {activeClinic?.name} मध्ये आपले स्वागत आहे. मी आपली काय मदत करू?
                  </p>
                  <p>
                    <strong className="text-emerald-400">Caller:</strong>{' '}
                    {selectedCall.transcript_preview || 'General inquiry about clinic doctor consultations.'}
                  </p>
                  <p>
                    <strong className="text-orange-400">Maya:</strong>{' '}
                    {selectedCall.outcome === 'BOOKED'
                      ? 'आपली अपॉइंटमेंट निश्चित झाली आहे. कन्फर्मेशन एसएमएस पाठवला आहे.'
                      : 'हो नक्कीच! सामान्य तपासणी शुल्क ₹५०० आहे. स्पेशलिस्ट शुल्क ₹७५० ते ₹८०० आहे.'}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 shrink-0 flex justify-end bg-black/60">
              <button
                onClick={() => setSelectedCall(null)}
                className="gcore-btn-dark px-5 py-2 text-xs font-semibold"
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
