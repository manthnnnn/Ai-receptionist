'use client';

import React, { useState, useEffect } from 'react';
import { useClinic } from '@/components/layout/clinic-context';
import { Doctor } from '@/types';
import { User, Plus, Clock, X } from 'lucide-react';

const avatarGradients = [
  'from-primary-400 to-primary-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
];

export default function DoctorsPage() {
  const { activeClinicId, activeClinic } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('500');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);

  const fetchDoctors = () => {
    fetch(`/api/doctors?clinic_id=${activeClinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoctors(data.doctors || []);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDoctors();
  }, [activeClinicId]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      setLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-apple-lg shadow-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 tracking-apple">Doctors & Roster</h1>
          <p className="text-xs text-surface-400 mt-0.5 font-medium">
            Manage practitioners, fees, and slot durations
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-4 py-2 rounded-apple transition-apple shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc, idx) => (
          <div
            key={doc.id}
            className="bg-white rounded-apple-lg shadow-card card-hover p-5 flex flex-col justify-between"
          >
            <div>
              {/* Avatar & Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                  {getInitials(doc.name)}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="status-dot bg-emerald-400"></span>
                  Active
                </span>
              </div>

              {/* Info */}
              <h3 className="text-sm font-semibold text-surface-900 tracking-apple">{doc.name}</h3>
              <p className="text-xs font-medium text-primary-500 mt-0.5">{doc.specialty}</p>
              <p className="text-xs text-surface-400 mt-2 line-clamp-2 leading-relaxed">
                {doc.description || 'Dedicated specialist with extensive clinical experience.'}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3.5 border-t border-surface-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-surface-400 font-medium block">Fee</span>
                <span className="font-semibold text-surface-900">₹{doc.consultation_fee}</span>
              </div>
              <div>
                <span className="text-surface-400 font-medium block">Duration</span>
                <span className="font-semibold text-surface-800">{doc.consultation_duration_minutes} mins</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-apple-xl shadow-modal overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 text-[15px] tracking-apple">Add New Doctor</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-50 transition-apple"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Kavita Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300"
                />
              </div>

              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Periodontist & Gum Specialist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300"
                />
              </div>

              <div>
                <label className="block font-medium text-surface-600 mb-1.5">Bio</label>
                <textarea
                  rows={2}
                  placeholder="BDS, MDS with 8+ years experience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple placeholder:text-surface-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-surface-600 mb-1.5">Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    required
                    className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple"
                  />
                </div>
                <div>
                  <label className="block font-medium text-surface-600 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full bg-surface-50 border border-surface-200 rounded-apple px-3.5 py-2.5 text-[13px] text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-apple"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-apple text-xs font-medium text-surface-500 hover:bg-surface-50 transition-apple"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium text-xs px-5 py-2.5 rounded-apple shadow-sm transition-apple disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
