'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { CallLog, DialogueTurn } from '@/types';
import { Phone, X, Zap, Globe, Clock } from 'lucide-react';
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
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>
      <Globe className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

function LatencyBadge({ ms }: { ms?: number }) {
  if (!ms) return null;
  const color = ms < 300 ? 'text-emerald-600' : ms < 700 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${color}`}>
      <Zap className="w-2.5 h-2.5" />
      {ms}ms
    </span>
  );
}

function DialogueBubble({ turn }: { turn: DialogueTurn }) {
  const isAI = turn.speaker === 'ai';
  return (
    <div className={`flex gap-2 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold ${
          isAI ? 'bg-primary-500 text-white' : 'bg-amber-400 text-white'
        }`}
      >
        {isAI ? 'AI' : 'P'}
      </div>
      <div className={`flex flex-col gap-1 max-w-[80%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-apple-lg px-3 py-2 text-[11px] leading-relaxed ${
            isAI
              ? 'bg-primary-50 text-surface-800 border border-primary-100'
              : 'bg-amber-50 text-surface-800 border border-amber-100'
          }`}
        >
          {turn.text}
        </div>
        <div className="flex items-center gap-2 px-1">
          {isAI && turn.latency_ms && <LatencyBadge ms={turn.latency_ms} />}
          {isAI && turn.tool_called && (
            <span className="text-[9px] font-mono text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">
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
  const { activeClinicId } = useClinic();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    fetch(`/api/calls?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCalls(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeClinicId]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Call Logs</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            PSTN inbound telephony recordings, transcripts &amp; telemetry
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-apple-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-4">Caller Phone</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Lang</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-surface-400">
                    Loading call logs...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-surface-400">
                    No calls recorded yet. Use the Simulator to place a test call.
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50 transition-apple">
                    <td className="py-3.5 px-5 text-xs text-surface-500">
                      {new Date(c.started_at || c.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-surface-700 font-medium">
                      {c.caller_phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-surface-500">
                      {formatDuration(c.duration_seconds || 60)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-surface-700">
                      {c.call_intent || 'General Inquiry'}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.total_latency_ms ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          <span className="font-mono text-emerald-700">{c.total_latency_ms}ms</span>
                        </span>
                      ) : (
                        <span className="text-xs text-surface-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <LanguageBadge lang={c.detected_language} />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.outcome === 'BOOKED' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <span className="status-dot bg-emerald-400"></span>
                          Booked
                        </span>
                      ) : c.outcome === 'ESCALATED' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                          <span className="status-dot bg-amber-400"></span>
                          Escalated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-500">
                          <span className="status-dot bg-surface-300"></span>
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedCall(c)}
                        className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-apple"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-apple-xl shadow-modal overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-surface-900 text-[15px] tracking-apple">
                  Call Dialogue &amp; Analytics
                </h3>
                <p className="text-xs text-surface-400 font-mono mt-0.5">{selectedCall.caller_phone}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-50 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Call Metadata */}
            <div className="px-6 pt-4 shrink-0">
              <div className="bg-surface-50 border border-surface-100 rounded-apple-lg p-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between col-span-2 text-surface-500">
                  <span className="font-medium">Intent</span>
                  <span className="font-semibold text-surface-900">{selectedCall.call_intent || 'General'}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium">Outcome</span>
                  <span className="font-semibold text-emerald-600">{selectedCall.outcome}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium">Duration</span>
                  <span className="font-medium text-surface-700">{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-500" /> Total Latency</span>
                  <span className="font-mono font-medium text-emerald-700">
                    {selectedCall.total_latency_ms ? `${selectedCall.total_latency_ms}ms` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium flex items-center gap-1"><Globe className="w-3 h-3 text-gcore-orange" /> Language</span>
                  <LanguageBadge lang={selectedCall.detected_language} />
                </div>
              </div>
            </div>

            {/* Dialogue Turns */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <h4 className="font-semibold text-surface-900 mb-3 text-[13px] flex items-center gap-2">
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
                // Fallback: show transcript preview as a soft styled dialogue box
                <div className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-apple-lg space-y-3 font-mono text-[11px] leading-relaxed shadow-xs">
                  <p>
                    <strong className="text-primary-600">AI:</strong> Hello! Thank you for calling. How can I assist you today?
                  </p>
                  <p>
                    <strong className="text-amber-700">Caller:</strong>{' '}
                    {selectedCall.transcript_preview || 'General inquiry about the clinic.'}
                  </p>
                  <p>
                    <strong className="text-primary-600">AI:</strong>{' '}
                    {selectedCall.outcome === 'BOOKED'
                      ? 'Your appointment has been confirmed. A confirmation SMS has been sent.'
                      : 'Our general consultation fee is ₹500. Specialists are ₹750–₹800.'}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 pb-5 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-apple text-xs font-medium transition-apple shadow-xs"
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
