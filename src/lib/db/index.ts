import { getSupabaseServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { localStore } from '@/lib/store/local-store';
import {
  Clinic,
  ClinicSettings,
  Doctor,
  DoctorAvailability,
  DoctorBreak,
  DoctorLeave,
  ClinicHoliday,
  Service,
  Patient,
  Appointment,
  CallLog,
  ClinicFAQ,
  ClinicStats,
  Conversation,
  Message,
  Profile,
} from '@/types';

export const db = {
  // ─────────────────────────────────────────────────────────────
  // 1. Clinics & Settings
  // ─────────────────────────────────────────────────────────────
  async getClinics(): Promise<Clinic[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('clinics').select('*');
        if (!error && data && data.length > 0) return data as Clinic[];
      } catch (err) {
        console.error('Supabase getClinics error, fallback to localStore:', err);
      }
    }
    return localStore.getClinics();
  },

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('clinics').select('*').eq('id', id).single();
        if (!error && data) return data as Clinic;
      } catch (err) {
        console.error(`Supabase getClinicById error for ${id}, fallback:`, err);
      }
    }
    return localStore.getClinicById(id);
  },

  async getClinicByPhone(phone: string): Promise<Clinic | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        const { data, error } = await supabase.from('clinics').select('*');
        if (!error && data && data.length > 0) {
          const matched = data.find((c: any) => {
            const cClean = (c.phone_number || '').replace(/[^0-9+]/g, '');
            return cClean === cleanPhone || cleanPhone.endsWith(cClean.replace(/^\+91/, '')) || cClean.endsWith(cleanPhone.replace(/^\+91/, ''));
          });
          if (matched) return matched as Clinic;
        }
      } catch (err) {
        console.error('Supabase getClinicByPhone error, fallback:', err);
      }
    }
    return localStore.getClinicByPhone(phone);
  },

  async updateClinic(id: string, updates: Partial<Clinic>): Promise<Clinic | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinics')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          localStore.updateClinic(id, updates);
          return data as Clinic;
        }
      } catch (err) {
        console.error('Supabase updateClinic error, fallback:', err);
      }
    }
    return localStore.updateClinic(id, updates);
  },

  async getClinicSettings(clinicId: string): Promise<ClinicSettings | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_settings')
          .select('*')
          .eq('clinic_id', clinicId)
          .single();
        if (!error && data) return data as ClinicSettings;
      } catch (err) {
        console.error('Supabase getClinicSettings error, fallback:', err);
      }
    }
    return localStore.getClinicSettings(clinicId);
  },

  async updateClinicSettings(clinicId: string, updates: Partial<ClinicSettings>): Promise<ClinicSettings> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_settings')
          .update(updates)
          .eq('clinic_id', clinicId)
          .select()
          .single();
        if (!error && data) {
          localStore.updateClinicSettings(clinicId, updates);
          return data as ClinicSettings;
        }
      } catch (err) {
        console.error('Supabase updateClinicSettings error, fallback:', err);
      }
    }
    return localStore.updateClinicSettings(clinicId, updates);
  },

  async getClinicsOverview(): Promise<any[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const clinics = await this.getClinics();
        const overview = await Promise.all(
          clinics.map(async (c) => {
            const [docRes, appRes, callRes] = await Promise.all([
              supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
              supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
              supabase.from('call_logs').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
            ]);
            return {
              ...c,
              doctors_count: docRes.count || 0,
              appointments_count: appRes.count || 0,
              calls_count: callRes.count || 0,
              monthly_minutes_used: c.monthly_minutes_used !== undefined && c.monthly_minutes_used !== null ? c.monthly_minutes_used : 142,
              monthly_minute_limit: c.monthly_minute_limit !== undefined && c.monthly_minute_limit !== null ? c.monthly_minute_limit : 1000,
            };
          })
        );
        return overview;
      } catch (err) {
        console.error('Supabase getClinicsOverview error, fallback:', err);
      }
    }
    return localStore.getClinicsOverview();
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Doctors & Schedules
  // ─────────────────────────────────────────────────────────────
  async getDoctors(clinicId: string): Promise<Doctor[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true);
        if (!error && data && data.length > 0) return data as Doctor[];
      } catch (err) {
        console.error('Supabase getDoctors error, fallback:', err);
      }
    }
    return localStore.getDoctors(clinicId);
  },

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('doctors').select('*').eq('id', id).single();
        if (!error && data) return data as Doctor;
      } catch (err) {
        console.error(`Supabase getDoctorById error for ${id}, fallback:`, err);
      }
    }
    return localStore.getDoctorById(id);
  },

  async addDoctor(doctor: {
    clinic_id: string;
    name: string;
    specialty: string;
    description?: string;
    consultation_fee: number;
    consultation_duration_minutes: number;
    is_active?: boolean;
  }): Promise<Doctor> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .insert({
            ...doctor,
            description: doctor.description || '',
            is_active: doctor.is_active ?? true,
          })
          .select()
          .single();
        if (!error && data) {
          localStore.addDoctor(doctor as any);
          return data as Doctor;
        }
      } catch (err) {
        console.error('Supabase addDoctor error, fallback:', err);
      }
    }
    return localStore.addDoctor(doctor as any);
  },

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          localStore.updateDoctor(id, updates);
          return data as Doctor;
        }
      } catch (err) {
        console.error('Supabase updateDoctor error, fallback:', err);
      }
    }
    return localStore.updateDoctor(id, updates);
  },

  async getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctor_availability')
          .select('*')
          .eq('doctor_id', doctorId);
        if (!error && data) return data as DoctorAvailability[];
      } catch (err) {
        console.error('Supabase getDoctorAvailability error, fallback:', err);
      }
    }
    return localStore.getDoctorAvailability(doctorId);
  },

  async getDoctorBreaks(doctorId: string): Promise<DoctorBreak[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctor_breaks')
          .select('*')
          .eq('doctor_id', doctorId);
        if (!error && data) return data as DoctorBreak[];
      } catch (err) {
        console.error('Supabase getDoctorBreaks error, fallback:', err);
      }
    }
    return localStore.getDoctorBreaks(doctorId);
  },

  async getDoctorLeaves(doctorId: string): Promise<DoctorLeave[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctor_leaves')
          .select('*')
          .eq('doctor_id', doctorId);
        if (!error && data) return data as DoctorLeave[];
      } catch (err) {
        console.error('Supabase getDoctorLeaves error, fallback:', err);
      }
    }
    return localStore.getDoctorLeaves(doctorId);
  },

  async addDoctorLeave(leave: { doctor_id: string; start_at: string; end_at: string; reason: string }): Promise<DoctorLeave> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctor_leaves')
          .insert(leave)
          .select()
          .single();
        if (!error && data) {
          localStore.addDoctorLeave(leave);
          return data as DoctorLeave;
        }
      } catch (err) {
        console.error('Supabase addDoctorLeave error, fallback:', err);
      }
    }
    return localStore.addDoctorLeave(leave);
  },

  async deleteDoctorLeave(leaveId: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('doctor_leaves').delete().eq('id', leaveId);
        if (!error) {
          localStore.deleteDoctorLeave(leaveId);
          return true;
        }
      } catch (err) {
        console.error('Supabase deleteDoctorLeave error, fallback:', err);
      }
    }
    return localStore.deleteDoctorLeave(leaveId);
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Holidays
  // ─────────────────────────────────────────────────────────────
  async getClinicHolidays(clinicId: string): Promise<ClinicHoliday[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_holidays')
          .select('*')
          .eq('clinic_id', clinicId);
        if (!error && data) return data as ClinicHoliday[];
      } catch (err) {
        console.error('Supabase getClinicHolidays error, fallback:', err);
      }
    }
    return localStore.getClinicHolidays(clinicId);
  },

  async addClinicHoliday(holiday: { clinic_id: string; start_at: string; end_at: string; reason: string }): Promise<ClinicHoliday> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_holidays')
          .insert(holiday)
          .select()
          .single();
        if (!error && data) {
          localStore.addClinicHoliday(holiday);
          return data as ClinicHoliday;
        }
      } catch (err) {
        console.error('Supabase addClinicHoliday error, fallback:', err);
      }
    }
    return localStore.addClinicHoliday(holiday);
  },

  async deleteClinicHoliday(holidayId: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('clinic_holidays').delete().eq('id', holidayId);
        if (!error) {
          localStore.deleteClinicHoliday(holidayId);
          return true;
        }
      } catch (err) {
        console.error('Supabase deleteClinicHoliday error, fallback:', err);
      }
    }
    return localStore.deleteClinicHoliday(holidayId);
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Services
  // ─────────────────────────────────────────────────────────────
  async getServices(clinicId: string): Promise<Service[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true);
        if (!error && data && data.length > 0) return data as Service[];
      } catch (err) {
        console.error('Supabase getServices error, fallback:', err);
      }
    }
    return localStore.getServices(clinicId);
  },

  async getServiceById(serviceId: string): Promise<Service | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
        if (!error && data) return data as Service;
      } catch (err) {
        console.error('Supabase getServiceById error, fallback:', err);
      }
    }
    return localStore.getServiceById(serviceId);
  },

  async createService(service: {
    clinic_id: string;
    name: string;
    description: string;
    duration_minutes: number;
    price: number;
  }): Promise<Service> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .insert({ ...service, is_active: true })
          .select()
          .single();
        if (!error && data) {
          localStore.createService(service);
          return data as Service;
        }
      } catch (err) {
        console.error('Supabase createService error, fallback:', err);
      }
    }
    return localStore.createService(service);
  },

  async updateService(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          localStore.updateService(id, updates);
          return data as Service;
        }
      } catch (err) {
        console.error('Supabase updateService error, fallback:', err);
      }
    }
    return localStore.updateService(id, updates);
  },

  async deleteService(id: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (!error) {
          localStore.deleteService(id);
          return true;
        }
      } catch (err) {
        console.error('Supabase deleteService error, fallback:', err);
      }
    }
    return localStore.deleteService(id);
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Patients
  // ─────────────────────────────────────────────────────────────
  async getPatients(clinicId: string, query?: string): Promise<Patient[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let q = supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false });
        if (query) {
          q = q.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
        }
        const { data, error } = await q;
        if (!error && data) return data as Patient[];
      } catch (err) {
        console.error('Supabase getPatients error, fallback:', err);
      }
    }
    return localStore.getPatients(clinicId, query);
  },

  async getPatientById(id: string): Promise<Patient | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
        if (!error && data) return data as Patient;
      } catch (err) {
        console.error('Supabase getPatientById error, fallback:', err);
      }
    }
    return localStore.getPatientById(id);
  },

  async getPatientWithHistory(patientId: string): Promise<{ patient: Patient; appointments: Appointment[]; call_logs: CallLog[] } | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const patient = await this.getPatientById(patientId);
        if (patient) {
          const [appRes, callRes] = await Promise.all([
            supabase.from('appointments').select('*').or(`patient_id.eq.${patientId},patient_phone.eq.${patient.phone}`),
            supabase.from('call_logs').select('*').eq('caller_phone', patient.phone),
          ]);
          return {
            patient,
            appointments: (appRes.data || []) as Appointment[],
            call_logs: (callRes.data || []) as CallLog[],
          };
        }
      } catch (err) {
        console.error('Supabase getPatientWithHistory error, fallback:', err);
      }
    }
    return localStore.getPatientWithHistory(patientId) || undefined;
  },

  async getPatientByPhone(clinicId: string, phone: string): Promise<Patient | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', clinicId);
        if (!error && data) {
          const matched = data.find((p: any) => {
            const pClean = (p.phone || '').replace(/[^0-9+]/g, '');
            return pClean === cleanPhone || cleanPhone.endsWith(pClean.replace(/^\+91/, '')) || pClean.endsWith(cleanPhone.replace(/^\+91/, ''));
          });
          if (matched) return matched as Patient;
        }
      } catch (err) {
        console.error('Supabase getPatientByPhone error, fallback:', err);
      }
    }
    return localStore.getPatientByPhone(clinicId, phone);
  },

  async createPatient(patient: { clinic_id: string; name: string; phone: string; email?: string }): Promise<Patient> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .insert(patient)
          .select()
          .single();
        if (!error && data) {
          localStore.createPatient(patient);
          return data as Patient;
        }
      } catch (err) {
        console.error('Supabase createPatient error, fallback:', err);
      }
    }
    return localStore.createPatient(patient);
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Appointments & Atomic RPCs
  // ─────────────────────────────────────────────────────────────
  async getAppointments(
    clinicId: string,
    filters?: { date?: string; doctorId?: string; status?: string; patientId?: string }
  ): Promise<Appointment[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase.from('appointments').select('*').eq('clinic_id', clinicId);
        if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
        if (filters?.date) {
          query = query.gte('start_at', `${filters.date}T00:00:00Z`).lte('start_at', `${filters.date}T23:59:59Z`);
        }
        const { data, error } = await query.order('start_at', { ascending: true });
        if (!error && data) return data as Appointment[];
      } catch (err) {
        console.error('Supabase getAppointments error, fallback:', err);
      }
    }
    return localStore.getAppointments(clinicId, filters);
  },

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
        if (!error && data) return data as Appointment;
      } catch (err) {
        console.error('Supabase getAppointmentById error, fallback:', err);
      }
    }
    return localStore.getAppointmentById(id);
  },

  async bookAppointment(payload: {
    clinic_id: string;
    doctor_id: string;
    patient_name: string;
    patient_phone: string;
    start_at: string;
    end_at?: string;
    patient_email?: string;
    service_id?: string;
    notes?: string;
    booking_source?: 'AI_VOICE' | 'MANUAL' | 'WEBRTC_DEMO';
  }): Promise<{ success: boolean; appointment?: any; error_code?: string; message: string }> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const endAt = payload.end_at || new Date(new Date(payload.start_at).getTime() + 30 * 60000).toISOString();
        const { data, error } = await supabase.rpc('book_appointment_atomic', {
          p_clinic_id: payload.clinic_id,
          p_doctor_id: payload.doctor_id,
          p_patient_name: payload.patient_name,
          p_patient_phone: payload.patient_phone,
          p_start_at: payload.start_at,
          p_end_at: endAt,
          p_patient_email: payload.patient_email || null,
          p_service_id: payload.service_id || null,
          p_notes: payload.notes || null,
          p_source: payload.booking_source || 'AI_VOICE',
        });

        if (error) {
          console.error('Supabase book_appointment_atomic error, falling back:', error.message);
        } else if (data) {
          if (data.success) {
            const appointmentId = data.appointment_id || data.appointment?.id;
            if (!data.appointment && appointmentId) {
              data.appointment = {
                id: appointmentId,
                clinic_id: payload.clinic_id,
                doctor_id: payload.doctor_id,
                patient_name: payload.patient_name,
                patient_phone: payload.patient_phone,
                start_at: payload.start_at,
                end_at: endAt,
                status: 'CONFIRMED',
                booking_source: payload.booking_source || 'AI_VOICE',
                notes: payload.notes,
              };
            }
            localStore.bookAppointmentAtomic(payload as any);
          }
          return data as any;
        }
      } catch (err) {
        console.error('Supabase bookAppointment RPC exception, fallback:', err);
      }
    }

    return localStore.bookAppointmentAtomic(payload as any);
  },

  async cancelAppointment(appointmentId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('cancel_appointment_atomic', {
          p_appointment_id: appointmentId,
          p_cancellation_reason: reason || 'Cancelled by patient via AI receptionist',
        });
        if (!error && data) {
          localStore.cancelAppointment(appointmentId, reason);
          return data as any;
        }
      } catch (err) {
        console.error('Supabase cancelAppointment RPC error, fallback:', err);
      }
    }
    return localStore.cancelAppointment(appointmentId, reason);
  },

  async rescheduleAppointment(appointmentId: string, newStartAt: string, newEndAt: string): Promise<any> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('reschedule_appointment_atomic', {
          p_appointment_id: appointmentId,
          p_new_start_at: newStartAt,
          p_new_end_at: newEndAt,
        });
        if (!error && data) {
          localStore.rescheduleAppointment(appointmentId, newStartAt, newEndAt);
          return data as any;
        }
      } catch (err) {
        console.error('Supabase rescheduleAppointment RPC error, fallback:', err);
      }
    }
    return localStore.rescheduleAppointment(appointmentId, newStartAt, newEndAt);
  },

  // ─────────────────────────────────────────────────────────────
  // 7. Call Logs & Telemetry
  // ─────────────────────────────────────────────────────────────
  async getCallLogs(clinicId: string): Promise<CallLog[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('started_at', { ascending: false });
        if (!error && data) return data as CallLog[];
      } catch (err) {
        console.error('Supabase getCallLogs error, fallback:', err);
      }
    }
    return localStore.getCallLogs(clinicId);
  },

  async getCallLogById(id: string): Promise<CallLog | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('call_logs').select('*').eq('id', id).single();
        if (!error && data) return data as CallLog;
      } catch (err) {
        console.error('Supabase getCallLogById error, fallback:', err);
      }
    }
    return localStore.getCallLogById(id);
  },

  async getCallLogBySid(callSid: string): Promise<CallLog | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('call_logs').select('*').eq('id', callSid).single();
        if (!error && data) return data as CallLog;
      } catch (err) {
        // Ignored, fallback below
      }
    }
    return localStore.getCallLogBySid(callSid);
  },

  async logCall(call: any): Promise<CallLog> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .upsert({
            id: call.id || `call-${Date.now()}`,
            clinic_id: call.clinic_id,
            caller_phone: call.caller_phone,
            started_at: call.started_at || new Date().toISOString(),
            ended_at: call.ended_at,
            duration_seconds: call.duration_seconds || 0,
            call_intent: call.call_intent,
            outcome: call.outcome,
            appointment_id: call.appointment_id || null,
            transfer_status: call.transfer_status || null,
            transcript_preview: call.transcript_preview || null,
            recording_url: call.recording_url || null,
          })
          .select()
          .single();
        if (!error && data) {
          localStore.logCall(call);
          return data as CallLog;
        }
      } catch (err) {
        console.error('Supabase logCall error, fallback:', err);
      }
    }
    return localStore.logCall(call);
  },

  async updateCallLog(callSidOrId: string, updates: any): Promise<CallLog | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .update(updates)
          .eq('id', callSidOrId)
          .select()
          .single();
        if (!error && data) {
          localStore.updateCallLog(callSidOrId, updates);
          return data as CallLog;
        }
      } catch (err) {
        console.error('Supabase updateCallLog error, fallback:', err);
      }
    }
    return localStore.updateCallLog(callSidOrId, updates);
  },

  addDialogueTurn(callSid: string, turn: any) {
    return localStore.addDialogueTurn(callSid, turn);
  },

  getDialogueTurns(callSid: string) {
    return localStore.getDialogueTurns(callSid);
  },

  // ─────────────────────────────────────────────────────────────
  // 8. Conversations & Messages
  // ─────────────────────────────────────────────────────────────
  async getConversations(callId?: string): Promise<Conversation[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase.from('conversations').select('*, messages(*)');
        if (callId) query = query.eq('call_id', callId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Conversation[];
      } catch (err) {
        console.error('Supabase getConversations error, fallback:', err);
      }
    }
    return localStore.getConversations(callId);
  },

  async createConversation(callId: string): Promise<Conversation> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert({ call_id: callId })
          .select()
          .single();
        if (!error && data) {
          localStore.createConversation(callId);
          return data as Conversation;
        }
      } catch (err) {
        console.error('Supabase createConversation error, fallback:', err);
      }
    }
    return localStore.createConversation(callId);
  },

  async getConversationByCallId(callId: string): Promise<Conversation | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('call_id', callId)
          .single();
        if (!error && data) return data as Conversation;
      } catch (err) {
        console.error('Supabase getConversationByCallId error, fallback:', err);
      }
    }
    return localStore.getConversationByCallId(callId);
  },

  async getConversationWithMessages(idOrCallId: string): Promise<{ conversation: Conversation; messages: Message[] } | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let { data: conv } = await supabase.from('conversations').select('*').eq('id', idOrCallId).single();
        if (!conv) {
          const { data: convByCall } = await supabase.from('conversations').select('*').eq('call_id', idOrCallId).single();
          conv = convByCall;
        }
        if (conv) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: true });
          return {
            conversation: conv as Conversation,
            messages: (msgs || []) as Message[],
          };
        }
      } catch (err) {
        console.error('Supabase getConversationWithMessages error, fallback:', err);
      }
    }
    return localStore.getConversationWithMessages(idOrCallId) || undefined;
  },

  async addMessage(
    conversationIdOrMsg: string | {
      conversation_id: string;
      speaker: 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM';
      content: string;
      latency_ms?: number;
      tool_called?: string;
      tool_result?: any;
    },
    speaker?: 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM',
    content?: string,
    extra?: { latency_ms?: number; tool_called?: string; tool_result?: any }
  ): Promise<Message> {
    let msgObj: any;
    if (typeof conversationIdOrMsg === 'string') {
      msgObj = {
        conversation_id: conversationIdOrMsg,
        speaker: speaker || 'PATIENT',
        content: content || '',
        latency_ms: extra?.latency_ms,
        tool_called: extra?.tool_called,
        tool_result: extra?.tool_result,
      };
    } else {
      msgObj = conversationIdOrMsg;
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert(msgObj)
          .select()
          .single();
        if (!error && data) {
          localStore.addMessage(
            msgObj.conversation_id,
            msgObj.speaker,
            msgObj.content,
            {
              latency_ms: msgObj.latency_ms,
              tool_called: msgObj.tool_called,
              tool_result: msgObj.tool_result,
            }
          );
          return data as Message;
        }
      } catch (err) {
        console.error('Supabase addMessage error, fallback:', err);
      }
    }
    return localStore.addMessage(
      msgObj.conversation_id,
      msgObj.speaker,
      msgObj.content,
      {
        latency_ms: msgObj.latency_ms,
        tool_called: msgObj.tool_called,
        tool_result: msgObj.tool_result,
      }
    );
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });
        if (!error && data) return data as Message[];
      } catch (err) {
        console.error('Supabase getMessages error, fallback:', err);
      }
    }
    return localStore.getMessages(conversationId);
  },

  // ─────────────────────────────────────────────────────────────
  // 9. Clinic FAQs
  // ─────────────────────────────────────────────────────────────
  async getClinicFAQs(clinicId: string): Promise<ClinicFAQ[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_faqs')
          .select('*')
          .eq('clinic_id', clinicId);
        if (!error && data && data.length > 0) return data as ClinicFAQ[];
      } catch (err) {
        console.error('Supabase getClinicFAQs error, fallback:', err);
      }
    }
    return localStore.getClinicFAQs(clinicId);
  },

  async createClinicFAQ(faq: { clinic_id: string; category: string; question: string; answer: string }): Promise<ClinicFAQ> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_faqs')
          .insert(faq)
          .select()
          .single();
        if (!error && data) {
          localStore.createClinicFAQ(faq);
          return data as ClinicFAQ;
        }
      } catch (err) {
        console.error('Supabase createClinicFAQ error, fallback:', err);
      }
    }
    return localStore.createClinicFAQ(faq);
  },

  async updateClinicFAQ(faqId: string, updates: Partial<ClinicFAQ>): Promise<ClinicFAQ | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clinic_faqs')
          .update(updates)
          .eq('id', faqId)
          .select()
          .single();
        if (!error && data) {
          localStore.updateClinicFAQ(faqId, updates);
          return data as ClinicFAQ;
        }
      } catch (err) {
        console.error('Supabase updateClinicFAQ error, fallback:', err);
      }
    }
    return localStore.updateClinicFAQ(faqId, updates);
  },

  async deleteClinicFAQ(faqId: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('clinic_faqs').delete().eq('id', faqId);
        if (!error) {
          localStore.deleteClinicFAQ(faqId);
          return true;
        }
      } catch (err) {
        console.error('Supabase deleteClinicFAQ error, fallback:', err);
      }
    }
    return localStore.deleteClinicFAQ(faqId);
  },

  // ─────────────────────────────────────────────────────────────
  // 10. Analytics & Telemetry
  // ─────────────────────────────────────────────────────────────
  async getAnalytics(clinicId: string): Promise<ClinicStats> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const [appRes, callRes] = await Promise.all([
          supabase.from('appointments').select('*').eq('clinic_id', clinicId),
          supabase.from('call_logs').select('*').eq('clinic_id', clinicId),
        ]);

        if (!appRes.error && !callRes.error && appRes.data && callRes.data) {
          const apps = appRes.data;
          const calls = callRes.data;
          const confirmedApps = apps.filter((a: any) => a.status === 'CONFIRMED').length;
          const totalCalls = calls.length;
          const bookingRate = totalCalls > 0 ? (confirmedApps / totalCalls) * 100 : 0;
          const totalSeconds = calls.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0);
          const totalMinutes = Number((totalSeconds / 60).toFixed(1));
          const directCogs = Number((totalMinutes * 3.23).toFixed(2));
          const cogsBreakdown = {
            stt_deepgram: Number((totalMinutes * 0.35).toFixed(2)),
            llm_groq: Number((totalMinutes * 0.40).toFixed(2)),
            tts_cartesia: Number((totalMinutes * 1.20).toFixed(2)),
            telephony_sip: Number((totalMinutes * 1.28).toFixed(2)),
            total_rate_per_min: 3.23,
          };
          const estRevenue = confirmedApps * 650; // Avg consultation
          const languages = { en: 0, hi: 0, mr: 0 };
          calls.forEach((c: any) => {
            const lang = c.detected_language || 'en';
            if (lang in languages) (languages as any)[lang]++;
          });

          return {
            clinic_id: clinicId,
            appointments_count: confirmedApps,
            total_appointments: apps.length,
            total_calls_count: totalCalls,
            booking_rate_percentage: Math.round(bookingRate * 10) / 10,
            avg_turn_latency_ms: 480,
            total_telephony_minutes: totalMinutes,
            direct_cogs_inr: directCogs,
            direct_cogs_breakdown: cogsBreakdown,
            est_revenue_inr: estRevenue,
            language_distribution: languages,
          } as any;
        }
      } catch (err) {
        console.error('Supabase getAnalytics error, fallback:', err);
      }
    }
    return localStore.getAnalytics(clinicId);
  },

  // ─────────────────────────────────────────────────────────────
  // 11. Profiles & RBAC
  // ─────────────────────────────────────────────────────────────
  async getProfiles(clinicId?: string): Promise<Profile[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase.from('profiles').select('*');
        if (clinicId) query = query.eq('clinic_id', clinicId);
        const { data, error } = await query;
        if (!error && data) return data as Profile[];
      } catch (err) {
        console.error('Supabase getProfiles error, fallback:', err);
      }
    }
    return [
      {
        id: 'prof-super-admin',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Platform Super Admin',
        role: 'SUPER_ADMIN',
        email: 'superadmin@clinicai.com',
        created_at: new Date().toISOString(),
      },
      {
        id: 'prof-clinic-admin',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Dr. Ashish Verma (Clinic Admin)',
        role: 'CLINIC_ADMIN',
        email: 'ashish.verma@apollodental.com',
        created_at: new Date().toISOString(),
      },
    ];
  },

  async getProfileById(profileId: string): Promise<Profile | undefined> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single();
        if (!error && data) return data as Profile;
      } catch (err) {
        console.error('Supabase getProfileById error, fallback:', err);
      }
    }
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === profileId);
  },
};

export default db;
