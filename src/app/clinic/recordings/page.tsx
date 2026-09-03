'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { PhoneCall, Play, Pause, Volume2, ShieldCheck, Clock, Calendar, Download, RefreshCw, FileAudio } from 'lucide-react';

export default function ClinicRecordingsPage() {
  const { activeClinicId } = useClinic();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [signedAudioUrl, setSignedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calls?clinic_id=${activeClinicId}`);
      const data = await res.json();
      if (data.success) {
        setCalls(data.calls || []);
      }
    } catch (err) {
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [activeClinicId]);

  const handlePlayRecording = async (callId: string) => {
    if (activeCallId === callId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setActiveCallId(callId);
      const res = await fetch(`/api/calls/${callId}/recording`);
      const data = await res.json();
      if (data.success && data.signed_url) {
        setSignedAudioUrl(data.signed_url);
        if (audioRef.current) {
          audioRef.current.src = data.signed_url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Failed to stream recording:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileAudio className="w-6 h-6 text-indigo-400" />
            <span>Call Audio Recordings & Retention</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Encrypted call recordings streamed with expiring signed URLs (3600s TTL) from private cloud storage.
          </p>
        </div>

        <button
          onClick={fetchCalls}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Active Audio Player Banner */}
      {activeCallId && signedAudioUrl && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Playing Call: {activeCallId}</span>
              <span className="text-[10px] text-indigo-300 font-mono block">
                Protected Signed URL active &bull; 1-Hour Tokenized Expiry
              </span>
            </div>
          </div>
          <audio controls src={signedAudioUrl} autoPlay className="h-8 max-w-xs" />
        </div>
      )}

      {/* Recordings Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/40 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Call ID</th>
                <th className="py-3 px-5">Caller Phone</th>
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Duration</th>
                <th className="py-3 px-5">Outcome</th>
                <th className="py-3 px-5 text-right">Playback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading call recordings...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No call recordings logged for this clinic yet.
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 font-mono text-slate-200">
                      {c.id}
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-300">
                      {c.caller_phone}
                    </td>
                    <td className="py-3 px-5 text-slate-400">
                      {new Date(c.started_at || c.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-mono">
                      {c.duration_seconds || 0}s
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.outcome === 'BOOKED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.outcome === 'ESCALATED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {c.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handlePlayRecording(c.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activeCallId === c.id && isPlaying
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        {activeCallId === c.id && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Audio</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
