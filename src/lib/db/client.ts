import { db } from './index';

export { db };
export default db;

// Convenience client-side query helpers
export async function fetchClinics() {
  const res = await fetch('/api/clinic?all=true');
  const data = await res.json();
  return data.clinics || [];
}

export async function fetchDoctors(clinicId: string) {
  const res = await fetch(`/api/doctors?clinic_id=${clinicId}`);
  const data = await res.json();
  return data.doctors || [];
}

export async function fetchAppointments(clinicId: string, date?: string) {
  const url = date 
    ? `/api/appointments?clinic_id=${clinicId}&date=${date}`
    : `/api/appointments?clinic_id=${clinicId}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.appointments || [];
}

export async function fetchCallLogs(clinicId: string) {
  const res = await fetch(`/api/calls?clinic_id=${clinicId}`);
  const data = await res.json();
  return data.calls || [];
}
