'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Doctor } from '@/types';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, User, Phone, Stethoscope, FileText } from 'lucide-react';

export function BookingModal() {
  const { isManualBookingOpen, setIsManualBookingOpen, activeClinicId, refreshData } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('+91 ');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!activeClinicId) return;
    fetch(`/api/doctors?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.doctors.length > 0) {
          setDoctors(data.doctors);
          setSelectedDoctorId(data.doctors[0].id);
        }
      })
      .catch((err) => console.error('Error fetching doctors:', err));
  }, [activeClinicId]);

  useEffect(() => {
    if (!activeClinicId || !selectedDoctorId || !appointmentDate) return;
    fetch(`/api/availability?clinic_id=${activeClinicId}&doctor_id=${selectedDoctorId}&date=${appointmentDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAvailableSlots(data.slots || []);
          if (data.slots && data.slots.length > 0) {
            setSelectedSlot(data.slots[0].time_24h);
          } else {
            setSelectedSlot('');
          }
        }
      })
      .catch((err) => console.error('Error fetching slots:', err));
  }, [activeClinicId, selectedDoctorId, appointmentDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !patientName || !patientPhone) {
      setError('Please select a slot and fill in patient details');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const startAt = `${appointmentDate}T${selectedSlot}:00Z`;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          doctor_id: selectedDoctorId,
          patient_name: patientName,
          patient_phone: patientPhone,
          start_at: startAt,
          notes,
          booking_source: 'MANUAL',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to book slot');
      } else {
        setSuccess('Appointment confirmed successfully!');
        refreshData();
        setTimeout(() => {
          setIsManualBookingOpen(false);
          setSuccess(null);
          setPatientName('');
          setNotes('');
        }, 1400);
      }
    } catch (err: any) {
      setError(err.message || 'Booking error');
    } finally {
      setLoading(false);
    }
  };

  if (!isManualBookingOpen) return null;

  const inputClass =
    'w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white ' +
    'focus:outline-none focus:ring-1 focus:ring-orange-500/60 focus:border-orange-500/50 ' +
    'transition-all placeholder:text-white/20 appearance-none';

  const labelClass = 'block text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        style={{
          background: 'linear-gradient(145deg, #111111 0%, #0a0a0a 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '92vh',
        }}
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px] tracking-tight">New Appointment</h3>
              <p className="text-[11px] text-white/35">Fill in the details below to confirm</p>
            </div>
          </div>
          <button
            onClick={() => setIsManualBookingOpen(false)}
            className="text-white/30 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleBooking} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[12px] px-4 py-3 rounded-xl animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] px-4 py-3 rounded-xl animate-slide-up">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Doctor */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Stethoscope className="w-3 h-3" /> Doctor</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={inputClass}
              style={{ colorScheme: 'dark' }}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id} style={{ background: '#111' }}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Date</span>
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className={inputClass}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5 justify-between w-full">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Available Slots
                </span>
                {availableSlots.length > 0 && (
                  <span className="text-orange-400 font-semibold text-[11px] normal-case tracking-normal">
                    {availableSlots.length} open
                  </span>
                )}
              </span>
            </label>

            {availableSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-0.5">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time_24h}
                    onClick={() => setSelectedSlot(slot.time_24h)}
                    className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
                      selectedSlot === slot.time_24h
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    {slot.time_formatted}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-white/30 bg-white/[0.03] px-4 py-3.5 rounded-xl border border-dashed border-white/10 text-center">
                No available slots on this date
              </div>
            )}
          </div>

          {/* Patient Name */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Patient Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Patient Phone */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</span>
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              required
              className={`${inputClass} font-mono tracking-wide`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Notes <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span></span>
            </label>
            <textarea
              rows={2}
              placeholder="Symptoms or chief complaint..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="px-5 py-2.5 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableSlots.length === 0 || !selectedSlot}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[12px] px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
