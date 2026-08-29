'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Doctor } from '@/types';
import { X, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const inputClass = "w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300";

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
      setError('Please select a slot and provide patient details');
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
        setSuccess('Appointment confirmed with atomic locking');
        refreshData();
        setTimeout(() => {
          setIsManualBookingOpen(false);
          setSuccess(null);
          setPatientName('');
          setNotes('');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Booking error');
    } finally {
      setLoading(false);
    }
  };

  if (!isManualBookingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-apple-xl shadow-modal overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900 text-[15px] tracking-apple">New Booking</h3>
          <button
            onClick={() => setIsManualBookingOpen(false)}
            className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-50 transition-apple"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleBooking} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs px-3.5 py-2.5 rounded-apple animate-slide-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs px-3.5 py-2.5 rounded-apple font-medium animate-slide-up">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span>{success}</span>
            </div>
          )}

          {/* Doctor */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={inputClass}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Date</label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Slots */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-surface-600 mb-2">
              <span>Available Slots</span>
              <span className="text-[11px] text-primary-500 font-medium">{availableSlots.length} open</span>
            </label>
            {availableSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-0.5">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time_24h}
                    onClick={() => setSelectedSlot(slot.time_24h)}
                    className={`px-3 py-1.5 rounded-apple text-xs font-medium border transition-apple ${
                      selectedSlot === slot.time_24h
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                        : 'bg-surface-50 hover:bg-surface-100 text-surface-600 border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {slot.time_formatted}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-400 bg-surface-50 p-3 rounded-apple border border-dashed border-surface-200">
                No slots available on this date.
              </p>
            )}
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Patient Name</label>
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
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Phone</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              required
              className={`${inputClass} font-mono`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Symptoms or chief complaint..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-100">
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="px-4 py-2 rounded-apple text-xs font-medium text-surface-500 hover:bg-surface-50 transition-apple"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableSlots.length === 0}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-5 py-2.5 rounded-apple shadow-sm transition-apple disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
