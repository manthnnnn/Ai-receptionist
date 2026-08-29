'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { CallLog } from '@/types';
import { Phone, X } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

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
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Call Logs</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            Review inbound recordings, transcripts, and AI outcomes
          </p>
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
                <th className="py-3.5 px-4 font-medium">Outcome</th>
                <th className="py-3.5 px-5 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-surface-400">
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

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-apple-xl shadow-modal overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900 text-[15px] tracking-apple">Call Transcript</h3>
                <p className="text-xs text-surface-400 font-mono mt-0.5">{selectedCall.caller_phone}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-50 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Metadata */}
              <div className="bg-surface-50 border border-surface-100 rounded-apple-lg p-4 space-y-2">
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium">Intent</span>
                  <span className="font-semibold text-surface-900">{selectedCall.call_intent}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium">Outcome</span>
                  <span className="font-semibold text-emerald-600">{selectedCall.outcome}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="font-medium">Duration</span>
                  <span className="font-medium text-surface-700">{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h4 className="font-semibold text-surface-900 mb-2.5 text-[13px]">Dialogue</h4>
                <div className="bg-surface-900 text-surface-200 p-4 rounded-apple-lg space-y-3 font-mono text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-primary-400">AI:</strong> Hello! Thank you for calling Apollo Dental Clinic. How can I assist you today?
                  </p>
                  <p>
                    <strong className="text-amber-400">Caller:</strong> {selectedCall.transcript_preview || 'I wanted to inquire about doctor availability and fees.'}
                  </p>
                  <p>
                    <strong className="text-primary-400">AI:</strong> {selectedCall.outcome === 'BOOKED' ? 'I have confirmed your appointment slot. A confirmation SMS has been dispatched.' : 'Our general consultation fee is ₹500, and specialists are ₹750 to ₹800.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCall(null)}
                  className="bg-surface-900 hover:bg-surface-800 text-white px-4 py-2 rounded-apple text-xs font-medium transition-apple"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
