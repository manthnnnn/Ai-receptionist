'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '../layout/clinic-context';
import { Doctor } from '@/types';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function BookingModal() {
  const { isManualBookingOpen, setIsManualBookingOpen, activeClinicId, activeClinic, refreshData } = useClinic();
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

  const inputClass = "w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gcore-orange transition-apple placeholder:text-neutral-600";

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
        setSuccess('Appointment confirmed with atomic locking & SMS/WhatsApp dispatched');
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="gcore-card border border-white/15 w-full max-w-lg rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gcore-orange" />
              New Patient Booking
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">{activeClinic?.name || 'Apollo Dental Clinic'}</p>
          </div>
          <button
            onClick={() => setIsManualBookingOpen(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleBooking} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs px-3.5 py-2.5 rounded-apple">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs px-3.5 py-2.5 rounded-apple font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Doctor */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1.5">Attending Doctor / Specialist</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={inputClass}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id} className="bg-black">
                  {d.name} — {d.specialty} (₹{d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1.5">Appointment Date</label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Slots */}
          <div>
            <div className="flex items-center justify-between font-medium text-neutral-300 mb-2">
              <span>Available Time Slots</span>
              <span className="text-[11px] text-orange-300 font-mono">{availableSlots.length} open slots</span>
            </div>
            {availableSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-0.5">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time_24h}
                    onClick={() => setSelectedSlot(slot.time_24h)}
                    className={`px-3 py-1.5 rounded-apple text-xs font-mono font-medium border transition-apple ${
                      selectedSlot === slot.time_24h
                        ? 'bg-gcore-orange text-white border-gcore-orange shadow-gcore-btn'
                        : 'bg-black hover:bg-white/10 text-neutral-300 border-white/10'
                    }`}
                  >
                    {slot.time_formatted}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 bg-black p-3 rounded-apple border border-dashed border-white/10">
                No slots available on this date. Please select another date.
              </p>
            )}
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Patient Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                required
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1.5">Chief Complaint / Visit Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Routine cleaning and mild tooth sensitivity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="gcore-btn-dark px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableSlots.length === 0}
              className="gcore-btn-orange px-5 py-2 text-xs font-semibold shadow-gcore-btn disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm & Dispatch Confirmation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
