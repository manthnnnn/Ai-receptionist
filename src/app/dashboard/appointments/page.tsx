'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Appointment } from '@/types';
import {
  Plus,
  Calendar,
  Mic,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function AppointmentsPage() {
  const { activeClinicId, setIsManualBookingOpen } = useClinic();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    setLoading(true);
    let url = `/api/appointments?clinic_id=${activeClinicId}`;
    if (dateFilter) url += `&date=${dateFilter}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => { if (data.success) setAppointments(data.appointments || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [activeClinicId, dateFilter]);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by clinic admin' }),
      });
      if (res.ok) fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const formatDT = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        dateLine: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        timeLine: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch { return { dateLine: iso, timeLine: '' }; }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Mobile scroll hint */}
      <p className="text-[11px] md:hidden text-center" style={{ color: 'var(--text-muted)' }}>← Scroll table horizontally →</p>
      {/* ── Header Row ── */}
      <div
        className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Appointments Roster
          </h1>
          <p className="text-xs mt-0.5 flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span className="status-dot bg-gcore-orange animate-pulse" />
            Atomic schedule locking · Zero race conditions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="gcore-input !w-auto !rounded-apple text-xs px-3 py-2"
          />
          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="gcore-btn-orange font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-gcore-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="gcore-card rounded-apple-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse gcore-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Doctor</th>
                <th>Date &amp; Time</th>
                <th>Source</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // ── Skeleton Loader ──────────────────────────────
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ opacity: 1 - i * 0.15 }}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="skeleton-shimmer h-4 rounded" style={{ width: j === 0 ? '110px' : j === 3 ? '80px' : j === 6 ? '60px' : '90px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-apple-xl bg-gcore-orange/10 border border-gcore-orange/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gcore-orange" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No appointments yet</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Book the first slot using the AI Voice Console or New Booking button.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((app) => {
                  const { dateLine, timeLine } = formatDT(app.start_at);
                  const isConfirmed = (app.status || '').toLowerCase() === 'confirmed';

                  return (
                    <tr key={app.id}>
                      {/* Patient */}
                      <td>
                        <span className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>
                          {app.patient_name || 'Patient'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {app.patient_phone || '—'}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td>
                        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          {app.doctor_name || 'Assigned Specialist'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{dateLine}</div>
                        <div className="text-orange-400 text-[11px] font-mono">{timeLine}</div>
                      </td>

                      {/* Source */}
                      <td>
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border"
                          style={{
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-2)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <Mic className="w-2.5 h-2.5 text-gcore-orange" />
                          AI Voice
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                              : 'border'
                          }`}
                          style={!isConfirmed ? {
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-2)',
                            borderColor: 'var(--border)',
                          } : undefined}
                        >
                          {isConfirmed && <CheckCircle2 className="w-3 h-3" strokeWidth={2} />}
                          {(app.status || 'CONFIRMED').toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => handleCancel(app.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-apple hover:bg-rose-500/10 hover:text-rose-400"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
