'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Doctor } from '@/types';
import { User, Plus, Clock, X, Edit3, CheckCircle2, ShieldCheck, IndianRupee, Sparkles } from 'lucide-react';

export default function DoctorsPage() {
  const { activeClinicId, activeClinic, refreshData } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Doctor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('500');
  const [duration, setDuration] = useState('30');
  const [addLoading, setAddLoading] = useState(false);

  // Edit Doctor & Fee Manager Modal
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editFee, setEditFee] = useState('500');
  const [editDuration, setEditDuration] = useState('30');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const fetchDoctors = () => {
    setLoading(true);
    fetch(`/api/doctors?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoctors(data.doctors || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, [activeClinicId]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: activeClinicId,
          name,
          specialty,
          description,
          consultation_fee: Number(fee),
          consultation_duration_minutes: Number(duration),
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setSpecialty('');
        setDescription('');
        setFee('500');
        setDuration('30');
        fetchDoctors();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditFee(String(doc.consultation_fee || 500));
    setEditDuration(String(doc.consultation_duration_minutes || 30));
    setEditSpecialty(doc.specialty || '');
    setEditDescription(doc.description || '');
    setEditIsActive(doc.is_active !== false);
    setEditSuccessMsg('');
  };

  const handleSaveDoctorEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setEditLoading(true);
    setEditSuccessMsg('');

    try {
      const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultation_fee: Number(editFee),
          consultation_duration_minutes: Number(editDuration),
          specialty: editSpecialty,
          description: editDescription,
          is_active: editIsActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccessMsg('Doctor fee & settings updated successfully!');
        setTimeout(() => {
          setEditingDoctor(null);
          fetchDoctors();
          refreshData();
        }, 1000);
      }
    } catch (err) {
      console.error('Error updating doctor:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white transition-colors duration-300">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Doctors &amp; Fee Manager
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full gcore-badge uppercase">
              {activeClinic?.name || 'Apollo Dental Clinic'}
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Manage practitioners, consultation fees (₹), and slot durations (mins)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="gcore-btn-orange font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-gcore-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            Loading doctors list...
          </div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            No doctors registered for this clinic tenant. Click "Add Doctor" to get started.
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="gcore-card rounded-apple-xl p-5 flex flex-col justify-between border border-white/10 bg-[#080808] hover:border-gcore-orange/40 transition-apple"
            >
              <div>
                {/* Avatar & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gcore-orange to-amber-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {getInitials(doc.name)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      doc.is_active !== false
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                        : 'text-neutral-400 bg-neutral-900 border border-white/10'
                    }`}>
                      <span className={`status-dot ${doc.is_active !== false ? 'bg-emerald-400' : 'bg-neutral-500'}`}></span>
                      {doc.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => openEditModal(doc)}
                      className="text-xs text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                      title="Edit Fee & Settings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-[15px] font-bold text-white tracking-tight">{doc.name}</h3>
                <p className="text-xs font-medium text-orange-300 mt-0.5">{doc.specialty}</p>
                <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {doc.description || 'Dedicated specialist with extensive clinical experience.'}
                </p>
              </div>

              {/* Footer / Fee & Duration */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.03] p-2.5 rounded-apple border border-white/5">
                  <span className="text-neutral-500 font-medium block text-[10px] uppercase">Consultation Fee</span>
                  <span className="font-bold text-white text-sm font-mono text-gcore-orange">₹{doc.consultation_fee}</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-apple border border-white/5">
                  <span className="text-neutral-500 font-medium block text-[10px] uppercase">Slot Duration</span>
                  <span className="font-medium text-neutral-200 font-mono text-sm">{doc.consultation_duration_minutes} mins</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── 1. Edit Doctor & Fee Manager Modal ─── */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-gcore-orange" />
                  Doctor Fee &amp; Slot Manager
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">{editingDoctor.name}</p>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSaveDoctorEdits} className="p-6 space-y-4 text-xs">
              {editSuccessMsg && (
                <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-apple text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-gcore-orange"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">Slot Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-gcore-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Specialty / Title</label>
                <input
                  type="text"
                  required
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Bio / Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="doctorActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded accent-gcore-orange"
                />
                <label htmlFor="doctorActive" className="text-neutral-300 font-medium cursor-pointer">
                  Doctor is active and accepting new appointments
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn"
                >
                  {editLoading ? 'Saving...' : 'Update Doctor & Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 2. Add Doctor Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="gcore-card border border-white/15 w-full max-w-md rounded-apple-xl shadow-2xl overflow-hidden animate-scale-in bg-black">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-[15px] tracking-tight">Add New Doctor</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Kavita Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Pediatric Dentistry"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    required
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1.5">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Bio / Description</label>
                <textarea
                  placeholder="Specialist credentials and areas of clinical expertise..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-apple px-3.5 py-2.5 text-white focus:outline-none focus:border-gcore-orange"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="gcore-btn-dark px-4 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn"
                >
                  {addLoading ? 'Saving...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
