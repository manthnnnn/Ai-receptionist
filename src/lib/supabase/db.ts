import { getSupabaseServerClient, isSupabaseServerConfigured } from './server';
import { localStore } from '@/lib/store/local-store';
import { Appointment, Doctor, Patient, CallLog, Clinic, ClinicSettings, ClinicFAQ } from '@/types';

export const db = {
  // 1. Atomic Booking via Supabase RPC / Local Fallback
  async bookAppointment(payload: {
    clinic_id: string;
    doctor_id: string;
    patient_name: string;
    patient_phone: string;
    start_at: string;
    end_at: string;
    patient_email?: string;
    service_id?: string;
    notes?: string;
    booking_source?: 'AI_VOICE' | 'MANUAL' | 'WEBRTC_DEMO';
  }): Promise<{ success: boolean; appointment?: any; error_code?: string; message: string }> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('book_appointment_atomic', {
          p_clinic_id: payload.clinic_id,
          p_doctor_id: payload.doctor_id,
          p_patient_name: payload.patient_name,
          p_patient_phone: payload.patient_phone,
          p_start_at: payload.start_at,
          p_end_at: payload.end_at,
          p_patient_email: payload.patient_email || null,
          p_service_id: payload.service_id || null,
          p_notes: payload.notes || null,
          p_source: payload.booking_source || 'AI_VOICE',
        });

        if (error) {
          console.error('Supabase book_appointment_atomic RPC error:', error);
          return { success: false, error_code: 'DB_RPC_ERROR', message: error.message };
        }

        return data as any;
      } catch (err: any) {
        console.error('Supabase exception in bookAppointment:', err);
      }
    }

    // Fallback to in-memory store
    return localStore.bookAppointmentAtomic(payload);
  },

  // 2. Atomic Cancellation via Supabase RPC
  async cancelAppointment(appointmentId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('cancel_appointment_atomic', {
          p_appointment_id: appointmentId,
          p_cancellation_reason: reason || 'Cancelled by patient via AI',
        });
        if (error) return { success: false, message: error.message };
        return data as any;
      } catch (err: any) {
        console.error('Supabase exception in cancelAppointment:', err);
      }
    }
    return localStore.cancelAppointment(appointmentId, reason);
  },

  // 3. Atomic Reschedule via Supabase RPC
  async rescheduleAppointment(appointmentId: string, newStartAt: string, newEndAt: string): Promise<any> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('reschedule_appointment_atomic', {
          p_appointment_id: appointmentId,
          p_new_start_at: newStartAt,
          p_new_end_at: newEndAt,
        });
        if (error) return { success: false, message: error.message };
        return data as any;
      } catch (err: any) {
        console.error('Supabase exception in rescheduleAppointment:', err);
      }
    }
    return localStore.rescheduleAppointment(appointmentId, newStartAt, newEndAt);
  },

  // 4. Query Doctors
  async getDoctors(clinicId: string): Promise<Doctor[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true);
        if (!error && data) return data as Doctor[];
      } catch (err) {
        console.error('Supabase getDoctors error:', err);
      }
    }
    return localStore.getDoctors(clinicId);
  },

  // 5. Query Appointments
  async getAppointments(clinicId: string, filters?: { date?: string; doctorId?: string; status?: string }): Promise<Appointment[]> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase.from('appointments').select('*').eq('clinic_id', clinicId);
        if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.date) {
          query = query.gte('start_at', `${filters.date}T00:00:00Z`).lte('start_at', `${filters.date}T23:59:59Z`);
        }
        const { data, error } = await query.order('start_at', { ascending: true });
        if (!error && data) return data as Appointment[];
      } catch (err) {
        console.error('Supabase getAppointments error:', err);
      }
    }
    return localStore.getAppointments(clinicId, filters);
  },

  // 6. Log Call
  async logCall(call: any): Promise<CallLog> {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .insert({
            clinic_id: call.clinic_id,
            caller_phone: call.caller_phone,
            started_at: call.started_at || new Date().toISOString(),
            ended_at: call.ended_at,
            duration_seconds: call.duration_seconds || 0,
            call_intent: call.call_intent,
            outcome: call.outcome,
            appointment_id: call.appointment_id || null,
            transfer_status: call.transfer_status || null,
          })
          .select()
          .single();
        if (!error && data) return data as CallLog;
      } catch (err) {
        console.error('Supabase logCall error:', err);
      }
    }
    return localStore.logCall(call);
  },
};
