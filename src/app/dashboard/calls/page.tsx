'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { CallLog, DialogueTurn } from '@/types';
import { Phone, X, Zap, Globe, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

const LANG_LABELS: Record<string, { label: string; color: string }> = {
  en: { label: 'EN', color: 'bg-blue-100 text-blue-700' },
  hi: { label: 'HI', color: 'bg-amber-100 text-amber-700' },
  mr: { label: 'MR', color: 'bg-purple-100 text-purple-700' },
};

function LanguageBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  const meta = LANG_LABELS[lang] || { label: lang.toUpperCase(), color: 'bg-surface-100 text-surface-600' };
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
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    fetch(`/api/calls?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCalls(data.calls || []);
        }
      })
      .catch((err) => console.error(err));
  }, [activeClinicId]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Call Logs & Dialogue Analytics</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            Full turn-by-turn dialogue, AI latency per turn, and detected language
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-400 bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
          <Phone className="w-3.5 h-3.5" />
          <span>{calls.length} calls</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-apple-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-medium">Time</th>
                <th className="py-3.5 px-4 font-medium">Caller</th>
                <th className="py-3.5 px-4 font-medium">Duration</th>
                <th className="py-3.5 px-4 font-medium">Intent</th>
                <th className="py-3.5 px-4 font-medium">Latency</th>
                <th className="py-3.5 px-4 font-medium">Lang</th>
                <th className="py-3.5 px-4 font-medium">Outcome</th>
                <th className="py-3.5 px-5 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-surface-400">
                    No call records yet.
                  </td>
                </tr>
              ) : (
                calls.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`border-b border-surface-50 hover:bg-primary-50/30 transition-apple ${
                      idx % 2 === 1 ? 'bg-surface-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 text-xs text-surface-500">
                      {new Date(c.started_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
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
                  Call Dialogue & Analytics
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
                  <span className="font-medium flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Language</span>
                  <LanguageBadge lang={selectedCall.detected_language} />
                </div>
              </div>
            </div>

            {/* Dialogue Turns */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <h4 className="font-semibold text-surface-900 mb-3 text-[13px] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary-500" />
                Dialogue ({selectedCall.dialogue_turns?.length || 0} turns)
              </h4>

              {selectedCall.dialogue_turns && selectedCall.dialogue_turns.length > 0 ? (
                <div className="space-y-3">
                  {selectedCall.dialogue_turns.map((turn) => (
                    <DialogueBubble key={turn.turn_index} turn={turn} />
                  ))}
                </div>
              ) : (
                // Fallback: show transcript preview as a static dialogue pair
                <div className="bg-surface-900 text-surface-200 p-4 rounded-apple-lg space-y-3 font-mono text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-primary-400">AI:</strong> Hello! Thank you for calling. How can I assist you today?
                  </p>
                  <p>
                    <strong className="text-amber-400">Caller:</strong>{' '}
                    {selectedCall.transcript_preview || 'General inquiry about the clinic.'}
                  </p>
                  <p>
                    <strong className="text-primary-400">AI:</strong>{' '}
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
                className="bg-surface-900 hover:bg-surface-800 text-white px-4 py-2 rounded-apple text-xs font-medium transition-apple"
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
