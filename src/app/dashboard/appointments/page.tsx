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
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Appointments</h1>
          <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span className="status-dot bg-emerald-400"></span>
            Atomic schedule locking · Zero race conditions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface-50 border border-surface-200 rounded-apple px-3 py-2 text-xs text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple"
          />

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2 rounded-apple transition-apple shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-apple-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-medium">Patient</th>
                <th className="py-3.5 px-4 font-medium">Phone</th>
                <th className="py-3.5 px-4 font-medium">Doctor</th>
                <th className="py-3.5 px-4 font-medium">Date & Time</th>
                <th className="py-3.5 px-4 font-medium">Source</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-surface-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-surface-400">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((app, idx) => {
                  const { dateLine, timeLine } = formatDateTimeDisplay(app.start_at);

                  return (
                    <tr
                      key={app.id}
                      className={`border-b border-surface-50 hover:bg-primary-50/30 transition-apple ${
                        idx % 2 === 1 ? 'bg-surface-50/40' : ''
                      }`}
                    >
                      {/* Patient */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-surface-900">{app.patient_name}</div>
                        {app.notes && (
                          <p className="text-[11px] text-surface-400 mt-0.5 truncate max-w-[200px]">{app.notes}</p>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-xs font-mono text-surface-500">
                        {app.patient_phone}
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-surface-700 font-medium">
                          {app.doctor_name || 'Dr. Ashish Verma'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-surface-700 font-medium">{dateLine}</div>
                        <div className="text-primary-600 font-medium">{timeLine}</div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        {app.booking_source === 'AI_VOICE' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                            <Mic className="w-3 h-3" strokeWidth={1.5} />
                            AI Voice
                          </span>
                        ) : (
                          <span className="text-xs text-surface-400 font-medium">Manual</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {app.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <span className="status-dot bg-emerald-400"></span>
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500">
                            <span className="status-dot bg-rose-400"></span>
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        {app.status === 'CONFIRMED' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              title="Reschedule"
                              onClick={() => {
                                const newDate = prompt('Enter new ISO start time (e.g. 2026-08-31T15:00:00Z):');
                                if (newDate) {
                                  fetch(`/api/appointments/${app.id}/reschedule`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ new_start_at: newDate }),
                                  }).then(() => fetchAppointments());
                                }
                              }}
                              className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-apple"
                            >
                              <RotateCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              title="Cancel"
                              onClick={() => handleCancel(app.id)}
                              className="p-1.5 text-surface-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-apple"
                            >
                              <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-surface-300">—</span>
                        )}
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
