'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Doctor } from '@/types';
import { User, Plus, Clock, X, Stethoscope } from 'lucide-react';

export default function DoctorsPage() {
  const { activeClinicId, activeClinic } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('500');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

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

  useEffect(() => { fetchDoctors(); }, [activeClinicId]);

  // Scroll reveal
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, doctors]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

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
        fetchDoctors();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="gcore-card rounded-apple-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-[#080808]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Doctors &amp; Specialists Roster</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-medium">
            Manage practitioners, consultation fees, and slot durations
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

      {/* Doctor Cards / Skeleton / Empty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Skeleton loading cards
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gcore-card rounded-apple-xl p-5 border border-white/10 bg-[#080808] space-y-4" style={{ opacity: 1 - i * 0.2 }}>
              <div className="flex items-center justify-between">
                <div className="skeleton-shimmer w-11 h-11 rounded-full" />
                <div className="skeleton-shimmer h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded" />
              <div className="skeleton-shimmer h-3 w-full rounded" />
              <div className="skeleton-shimmer h-3 w-5/6 rounded" />
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                <div className="skeleton-shimmer h-6 rounded" />
                <div className="skeleton-shimmer h-6 rounded" />
              </div>
            </div>
          ))
        ) : doctors.length === 0 ? (
          // Empty state
          <div className="col-span-full py-16 flex flex-col items-center gap-4 gcore-card rounded-apple-xl border border-white/10 bg-[#080808]">
            <div className="w-16 h-16 rounded-apple-xl bg-gcore-orange/10 border border-gcore-orange/20 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-gcore-orange" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-white">No doctors added yet</p>
            <p className="text-xs text-neutral-400 text-center max-w-xs">Add your first doctor or specialist to allow the AI to greet callers with live schedule and fees.</p>
            <button onClick={() => setIsAddModalOpen(true)} className="gcore-btn-orange px-5 py-2 text-xs font-semibold flex items-center gap-2 shadow-gcore-btn">
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add First Doctor
            </button>
          </div>
        ) : (
          doctors.map((doc, i) => (
            <div
              key={doc.id}
              className="reveal gcore-card rounded-apple-xl p-5 flex flex-col justify-between border border-white/10 bg-[#080808] hover:border-gcore-orange/30"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div>
                {/* Avatar & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gcore-orange to-amber-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {getInitials(doc.name)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full">
                    <span className="status-dot bg-emerald-400"></span>
                    Active
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-[15px] font-bold text-white tracking-tight">{doc.name}</h3>
                <p className="text-xs font-medium text-orange-300 mt-0.5">{doc.specialty}</p>
                <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {doc.description || 'Dedicated specialist with extensive clinical experience.'}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 font-medium block text-[11px]">Fee</span>
                  <span className="font-bold text-white text-sm font-mono">₹{doc.consultation_fee}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium block text-[11px]">Duration</span>
                  <span className="font-medium text-neutral-300 font-mono">{doc.consultation_duration_minutes} mins</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Doctor Modal */}
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
                  <label className="block font-medium text-neutral-300 mb-1.5">Fee (₹)</label>
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
                  disabled={formLoading}
                  className="gcore-btn-orange px-5 py-2.5 text-xs font-semibold shadow-gcore-btn"
                >
                  {loading ? 'Saving...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
