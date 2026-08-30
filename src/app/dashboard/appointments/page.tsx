'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Appointment } from '@/types';
import { 
  Plus, 
  Calendar, 
  Phone, 
  User, 
  RotateCw, 
  XCircle, 
  Mic, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

export default function AppointmentsPage() {
  const { activeClinicId, activeClinic, setIsManualBookingOpen } = useClinic();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    setLoading(true);
    let url = `/api/appointments?clinic_id=${activeClinicId}`;
    if (dateFilter) {
      url += `&date=${dateFilter}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAppointments(data.appointments || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeClinicId, dateFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by clinic admin' }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTimeDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      return {
        dateLine: `${weekday}, ${day} ${month}`,
        timeLine: time,
      };
    } catch {
      return { dateLine: isoStr, timeLine: '' };
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Appointments Roster</h1>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span className="status-dot bg-gcore-orange animate-pulse"></span>
            Atomic schedule locking · Zero race conditions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-black border border-white/10 rounded-apple px-3 py-2 text-xs text-white focus:outline-none focus:border-gcore-orange transition-apple"
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

      {/* Table */}
      <div className="gcore-card rounded-apple-xl overflow-hidden border border-white/10 bg-[#080808]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-medium text-neutral-400 uppercase tracking-wider bg-black/40">
                <th className="py-3.5 px-5 font-medium">Patient</th>
                <th className="py-3.5 px-4 font-medium">Phone</th>
                <th className="py-3.5 px-4 font-medium">Doctor</th>
                <th className="py-3.5 px-4 font-medium">Date &amp; Time</th>
                <th className="py-3.5 px-4 font-medium">Source</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-neutral-500">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-neutral-500">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => {
                  const { dateLine, timeLine } = formatDateTimeDisplay(app.start_at);

                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5 font-medium text-white">
                        {app.patient_name || 'Patient'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400 text-xs">
                        {app.patient_phone || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        {app.doctor_name || 'Assigned Specialist'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium text-xs">{dateLine}</div>
                        <div className="text-orange-300 text-[11px] font-mono">{timeLine}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <Mic className="w-2.5 h-2.5 text-gcore-orange" />
                          AI Voice
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          app.status === 'CONFIRMED' || (app.status as any) === 'confirmed'
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                            : 'text-neutral-400 bg-white/5 border border-white/10'
                        }`}>
                          {app.status || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleCancel(app.id)}
                          className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                        >
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
