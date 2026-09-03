'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PhoneCall, Stethoscope } from 'lucide-react';

export default function PatientTimelinePage() {
  const params = useParams();
  const patientId = params.id as string;

  const [data, setData] = useState<{
    patient: any;
    appointments: any[];
    call_logs: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        const res = await fetch(`/api/patients/${patientId}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching patient timeline:', err);
      } finally {
        setLoading(false);
      }
    }
    if (patientId) {
      loadTimeline();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading patient medical timeline...
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/clinic/patients" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients Directory
        </Link>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          Patient record not found.
        </div>
      </div>
    );
  }

  const { patient, appointments, call_logs } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation */}
      <Link href="/clinic/patients" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Directory
      </Link>

      {/* Patient Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{patient.name}</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {patient.id}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{patient.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Registered: {new Date(patient.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Medical & Call Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Patient Interaction & Visit History ({appointments.length + call_logs.length} events)</span>
        </h2>

        {appointments.length === 0 && call_logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-xl">
            No consultations or call logs recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {/* Appointments */}
            {appointments.map((app) => (
              <div key={app.id} className="relative group">
                {/* Dot */}
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  app.status === 'CONFIRMED'
                    ? 'bg-emerald-500 border-slate-900'
                    : app.status === 'CANCELLED'
                    ? 'bg-rose-500 border-slate-900'
                    : 'bg-indigo-500 border-slate-900'
                }`} />

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-xs text-white">
                        Appointment: {app.doctor_name || 'Dr. Ashish Verma'}
                      </span>
                      <span className="text-[10px] text-slate-400">({app.doctor_specialty || 'General Dentist'})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      app.status === 'CONFIRMED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : app.status === 'CANCELLED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4">
                    <span className="font-mono text-slate-200">
                      📅 {new Date(app.start_at).toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Source: <span className="text-indigo-300 font-medium">{app.booking_source}</span>
                    </span>
                  </div>

                  {app.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded border border-slate-800/60">
                      {app.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* AI Calls History */}
            {call_logs.map((call) => (
              <div key={call.id} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-teal-500 border-slate-900" />

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold text-xs text-white">
                        AI Receptionist Telephony Call
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({call.duration_seconds || 0}s)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {call.outcome}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 font-medium">Intent:</span> {call.call_intent || 'Inbound Inquiry'}
                  </p>

                  {call.transcript_preview && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-800/40 p-2 rounded border border-slate-800/60">
                      "{call.transcript_preview}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
