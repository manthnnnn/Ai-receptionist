'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Appointment, Doctor } from '@/types';
import { 
  Plus, 
  Calendar, 
  Phone, 
  User, 
  RotateCw, 
  XCircle, 
  Mic, 
  ShieldCheck, 
  CheckCircle2,
  Search,
  MessageSquare,
  Send,
  Clock,
  Filter,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Smartphone
} from 'lucide-react';

export default function AppointmentsPage() {
  const { activeClinicId, activeClinic, setIsManualBookingOpen } = useClinic();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('ALL');

  // Modals state
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const [cancelAppointmentModal, setCancelAppointmentModal] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [notifyAppointment, setNotifyAppointment] = useState<Appointment | null>(null);
  const [notifyChannels, setNotifyChannels] = useState<{ sms: boolean; whatsapp: boolean }>({ sms: true, whatsapp: true });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState('');

  // Fetch doctors for filters & modals
  useEffect(() => {
    fetch(`/api/doctors?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDoctors(data.doctors || []);
      })
      .catch((err) => console.error('Failed to load doctors:', err));
  }, [activeClinicId]);

  const fetchAppointments = () => {
    setLoading(true);
    let url = `/api/appointments?clinic_id=${activeClinicId}`;
    if (dateFilter) url += `&date=${dateFilter}`;
    if (selectedDoctorId !== 'ALL') url += `&doctor_id=${selectedDoctorId}`;
    if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
    if (searchQuery.trim()) url += `&query=${encodeURIComponent(searchQuery.trim())}`;

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
  }, [activeClinicId, dateFilter, selectedDoctorId, selectedStatus, searchQuery]);

  // Date Presets Handler
  const handleDatePreset = (preset: 'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM') => {
    setDatePreset(preset);
    if (preset === 'ALL') {
      setDateFilter('');
    } else if (preset === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      setDateFilter(today);
    } else if (preset === 'TOMORROW') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDateFilter(d.toISOString().split('T')[0]);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (app: Appointment) => {
    setRescheduleAppointment(app);
    setRescheduleDoctorId(app.doctor_id);
    const existingDate = app.start_at.split('T')[0];
    setRescheduleDate(existingDate);
    try {
      const d = new Date(app.start_at);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      setRescheduleTime(`${hours}:${mins}`);
    } catch {
      setRescheduleTime('11:00');
    }
    setRescheduleError('');
  };

  // Execute Reschedule
  const handleExecuteReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleTime) return;

    setRescheduleLoading(true);
    setRescheduleError('');

    try {
      const newStartAt = `${rescheduleDate}T${rescheduleTime}:00Z`;
      const doc = doctors.find((d) => d.id === (rescheduleDoctorId || rescheduleAppointment.doctor_id));
      const duration = doc?.consultation_duration_minutes || 30;
      const startDate = new Date(newStartAt);
      const newEndAt = new Date(startDate.getTime() + duration * 60000).toISOString();

      const res = await fetch(`/api/appointments/${rescheduleAppointment.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_start_at: newStartAt,
          new_end_at: newEndAt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRescheduleError(data.message || data.error || 'Failed to reschedule slot.');
        setRescheduleLoading(false);
        return;
      }

      // Auto dispatch notification for rescheduled appointment
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: rescheduleAppointment.id,
          channels: ['SMS', 'WHATSAPP'],
        }),
      }).catch((e) => console.warn('Auto notification error on reschedule:', e));

      setRescheduleAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      setRescheduleError(err.message || 'Error occurred while rescheduling.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Open Cancel Modal
  const openCancelModal = (app: Appointment) => {
    setCancelAppointmentModal(app);
    setCancelReason('Patient requested cancellation');
    setCustomCancelReason('');
  };

  // Execute Cancellation
  const handleExecuteCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelAppointmentModal) return;

    setCancelLoading(true);
    const finalReason = cancelReason === 'Other' ? customCancelReason || 'Cancelled by admin' : cancelReason;

    try {
      const res = await fetch(`/api/appointments/${cancelAppointmentModal.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (res.ok) {
        setCancelAppointmentModal(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  // Open Notify Modal
  const openNotifyModal = (app: Appointment) => {
    setNotifyAppointment(app);
    setNotifyChannels({ sms: true, whatsapp: true });
    setNotifySuccessMsg('');
  };

  // Dispatch SMS / WhatsApp
  const handleDispatchNotification = async () => {
    if (!notifyAppointment) return;
    setNotifyLoading(true);
    setNotifySuccessMsg('');

    const channels: ('SMS' | 'WHATSAPP')[] = [];
    if (notifyChannels.sms) channels.push('SMS');
    if (notifyChannels.whatsapp) channels.push('WHATSAPP');

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: notifyAppointment.id,
          channels,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotifySuccessMsg(data.message || 'Dispatched successfully!');
        setTimeout(() => {
          setNotifyAppointment(null);
          fetchAppointments();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifyLoading(false);
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
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white transition-colors duration-300">
      {/* Header Banner */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Appointments &amp; Schedule Roster
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full gcore-badge uppercase">
              {activeClinic?.name || 'Apollo Dental'}
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span className="status-dot bg-gcore-orange animate-pulse"></span>
            Atomic collision lock · Automated SMS &amp; WhatsApp instant dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAppointments()}
            className="gcore-btn-dark px-3 py-2 text-xs flex items-center gap-1.5"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="gcore-btn-orange font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-gcore-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gcore-card rounded-apple-xl p-4 border border-white/10 bg-[#080808] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patient name, phone, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-apple pl-9 pr-3 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-gcore-orange transition-apple"
          />
        </div>

        {/* Doctor Filter */}
        <div className="lg:col-span-3">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-apple px-3 py-2 text-white focus:outline-none focus:border-gcore-orange transition-apple cursor-pointer"
          >
            <option value="ALL" className="bg-black">All Doctors &amp; Specialists</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id} className="bg-black">
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-apple px-3 py-2 text-white focus:outline-none focus:border-gcore-orange transition-apple cursor-pointer"
          >
            <option value="ALL" className="bg-black">All Statuses</option>
            <option value="CONFIRMED" className="bg-black">Confirmed</option>
            <option value="CANCELLED" className="bg-black">Cancelled</option>
          </select>
        </div>

        {/* Date Presets / Input */}
        <div className="lg:col-span-3 flex items-center gap-1.5">
          <div className="flex bg-black border border-white/10 rounded-apple p-0.5 text-[11px] shrink-0">
            <button
              onClick={() => handleDatePreset('ALL')}
              className={`px-2 py-1 rounded transition-colors ${datePreset === 'ALL' ? 'bg-white/15 text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => handleDatePreset('TODAY')}
              className={`px-2 py-1 rounded transition-colors ${datePreset === 'TODAY' ? 'bg-white/15 text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Today
            </button>
            <button
              onClick={() => handleDatePreset('TOMORROW')}
              className={`px-2 py-1 rounded transition-colors ${datePreset === 'TOMORROW' ? 'bg-white/15 text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Tmrw
            </button>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDatePreset('CUSTOM');
              setDateFilter(e.target.value);
            }}
            className="w-full bg-black border border-white/10 rounded-apple px-2 py-1.5 text-white focus:outline-none focus:border-gcore-orange text-[11px]"
          />
        </div>
      </div>

      {/* Table Card */}
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
                <th className="py-3.5 px-4 font-medium">Notifications</th>
                <th className="py-3.5 px-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                    Loading appointments roster...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                    No matching appointments found. Try clearing filters or create a new booking.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => {
                  const { dateLine, timeLine } = formatDateTimeDisplay(app.start_at);
                  const isConfirmed = app.status === 'CONFIRMED' || (app.status as any) === 'confirmed';

                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Patient Name */}
                      <td className="py-3.5 px-5 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{app.patient_name || 'Patient'}</span>
                        </div>
                        {app.notes && (
                          <div className="text-[11px] text-neutral-400 truncate max-w-[180px] mt-0.5 font-normal">
                            {app.notes}
                          </div>
                        )}
                      </td>

                      {/* Patient Phone */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300 text-xs">
                        {app.patient_phone || '—'}
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div className="font-medium text-white text-xs">{app.doctor_name || 'Assigned Specialist'}</div>
                        <div className="text-[11px] text-neutral-400">{app.doctor_specialty || ''}</div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium text-xs">{dateLine}</div>
                        <div className="text-orange-300 text-[11px] font-mono">{timeLine}</div>
                      </td>

                      {/* Booking Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <Mic className="w-2.5 h-2.5 text-gcore-orange" />
                          {app.booking_source === 'AI_VOICE' ? 'AI Voice' : app.booking_source === 'WEBRTC_DEMO' ? 'WebRTC' : 'Manual'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                            : 'text-rose-400 bg-rose-950/40 border border-rose-800/30'
                        }`}>
                          <span className={`status-dot ${isConfirmed ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {app.status || 'CONFIRMED'}
                        </span>
                      </td>

                      {/* Notification Dispatch Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title="SMS Confirmation"
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              app.sms_status === 'FAILED'
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/30'
                            }`}
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            SMS
                          </span>

                          <span
                            title="WhatsApp Confirmation"
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              app.whatsapp_status === 'FAILED'
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/30'
                            }`}
                          >
                            <Send className="w-2.5 h-2.5" />
                            WA
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isConfirmed && (
                            <>
                              <button
                                onClick={() => openNotifyModal(app)}
                                className="text-xs text-neutral-300 hover:text-gcore-orange font-medium transition-colors px-2 py-1 rounded hover:bg-white/5"
                                title="Send / Resend Confirmation SMS & WhatsApp"
                              >
                                Notify
                              </button>

                              <button
                                onClick={() => openRescheduleModal(app)}
                                className="text-xs text-orange-300 hover:text-white font-medium transition-colors px-2 py-1 rounded hover:bg-white/5"
                              >
                                Reschedule
                              </button>

                              <button
                                onClick={() => openCancelModal(app)}
                                className="text-xs text-neutral-400 hover:text-rose-400 font-medium transition-colors px-2 py-1 rounded hover:bg-white/5"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {!isConfirmed && (
                            <span className="text-[11px] text-neutral-500 italic">
                              {app.cancellation_reason || 'Cancelled'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 1. Reschedule Slot Modal ─── */}
      {rescheduleAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-gcore-orange" />
                  Reschedule Appointment
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Patient: <span className="text-white font-medium">{rescheduleAppointment.patient_name}</span> ({rescheduleAppointment.patient_phone})
                </p>
              </div>
              <button
                onClick={() => setRescheduleAppointment(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleExecuteReschedule} className="p-6 space-y-4 text-xs">
              {rescheduleError && (
                <div className="bg-rose-950/40 border border-rose-800/40 p-3 rounded-apple text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Attending Doctor</label>
                <select
                  value={rescheduleDoctorId}
                  onChange={(e) => setRescheduleDoctorId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty} (₹{d.consultation_fee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">New Time Slot</label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                  >
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="17:30">05:30 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-apple text-[11px] text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5 text-orange-300 font-medium">
                  <Sparkles className="w-3 h-3 text-gcore-orange" />
                  <span>Instant Notification</span>
                </div>
                <p>Rescheduling will automatically trigger an updated SMS and WhatsApp confirmation to the patient.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleAppointment(null)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn"
                >
                  {rescheduleLoading ? 'Locking Slot...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 2. Cancel Appointment Modal ─── */}
      {cancelAppointmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Cancel Appointment
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Patient: <span className="text-white font-medium">{cancelAppointmentModal.patient_name}</span>
                </p>
              </div>
              <button
                onClick={() => setCancelAppointmentModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleExecuteCancel} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                >
                  <option value="Patient requested cancellation">Patient requested cancellation</option>
                  <option value="Doctor unavailable / Emergency leave">Doctor unavailable / Emergency leave</option>
                  <option value="Scheduling conflict">Scheduling conflict</option>
                  <option value="Duplicate booking">Duplicate booking</option>
                  <option value="Other">Other (custom)</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">Custom Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason..."
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                  />
                </div>
              )}

              <p className="text-[11px] text-neutral-400">
                This will release the reserved time slot for other patients and mark the status as CANCELLED.
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelAppointmentModal(null)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded-full px-5 py-2.5 text-xs font-semibold transition-colors"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 3. Instant SMS / WhatsApp Notification Modal ─── */}
      {notifyAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
                  <Send className="w-4 h-4 text-gcore-orange" />
                  Dispatch Instant Notification
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Recipient: <span className="text-white font-medium">{notifyAppointment.patient_name}</span> ({notifyAppointment.patient_phone})
                </p>
              </div>
              <button
                onClick={() => setNotifyAppointment(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {notifySuccessMsg && (
                <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-apple text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{notifySuccessMsg}</span>
                </div>
              )}

              {/* Message Preview */}
              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Formatted Message Preview</label>
                <div className="bg-black/60 border border-white/10 p-3.5 rounded-apple text-[11px] font-mono text-neutral-300 leading-relaxed">
                  Namaste {notifyAppointment.patient_name}! Your appointment at {activeClinic?.name || 'Apollo Dental Clinic'} with {notifyAppointment.doctor_name || 'Assigned Doctor'} is CONFIRMED for {formatDateTimeDisplay(notifyAppointment.start_at).dateLine} at {formatDateTimeDisplay(notifyAppointment.start_at).timeLine}. Address: {activeClinic?.address || 'Koramangala 4th Block, Bangalore'}. Helpline: {activeClinic?.phone_number || '+91-80-4567-8901'}.
                </div>
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <label className="block font-medium text-neutral-300">Dispatch Channels</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3 rounded-apple border cursor-pointer transition-apple ${
                    notifyChannels.sms ? 'border-gcore-orange/60 bg-gcore-orange/10 text-white' : 'border-white/10 bg-black text-neutral-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={notifyChannels.sms}
                      onChange={(e) => setNotifyChannels((prev) => ({ ...prev, sms: e.target.checked }))}
                      className="rounded accent-gcore-orange"
                    />
                    <MessageSquare className="w-4 h-4 text-gcore-orange" />
                    <div>
                      <div className="font-semibold text-xs text-white">Twilio SMS</div>
                      <div className="text-[10px] text-neutral-400">Direct Carrier SMS</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-apple border cursor-pointer transition-apple ${
                    notifyChannels.whatsapp ? 'border-gcore-orange/60 bg-gcore-orange/10 text-white' : 'border-white/10 bg-black text-neutral-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={notifyChannels.whatsapp}
                      onChange={(e) => setNotifyChannels((prev) => ({ ...prev, whatsapp: e.target.checked }))}
                      className="rounded accent-gcore-orange"
                    />
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-xs text-white">WhatsApp</div>
                      <div className="text-[10px] text-neutral-400">Gupshup / Twilio</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNotifyAppointment(null)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatchNotification}
                  disabled={notifyLoading || (!notifyChannels.sms && !notifyChannels.whatsapp)}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{notifyLoading ? 'Dispatching...' : 'Dispatch Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
