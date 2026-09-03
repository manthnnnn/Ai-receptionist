'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClinic } from '@/components/layout/clinic-context';
import { Search, Users, Phone, Mail, Calendar, ArrowRight, UserPlus, FileText } from 'lucide-react';

export default function PatientsDirectoryPage() {
  const { activeClinicId } = useClinic();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async (query?: string) => {
    try {
      setLoading(true);
      const url = query
        ? `/api/patients?clinic_id=${activeClinicId}&query=${encodeURIComponent(query)}`
        : `/api/patients?clinic_id=${activeClinicId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(searchQuery);
  }, [activeClinicId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Patient Directory & Records
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Registered patients, AI interaction history, and medical consultation timelines.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Patient Cards / Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/40 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Patient Name</th>
                <th className="py-3 px-5">Phone Number</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Registered Since</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No patient records found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500/20 to-teal-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-slate-400">
                      {p.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{p.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/clinic/patients/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-medium border border-indigo-500/20 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Timeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
