-- Stored Procedure: Atomic Appointment Booking with Concurrency Lock
CREATE OR REPLACE FUNCTION book_appointment_atomic(
    p_clinic_id UUID,
    p_doctor_id UUID,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_patient_email TEXT DEFAULT NULL,
    p_service_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'AI_VOICE'
)
RETURNS JSON AS $$
DECLARE
    v_appointment_id UUID;
    v_patient_id UUID;
    v_existing_id UUID;
BEGIN
    -- 1. Explicit transaction advisory lock on (doctor_id + start_at)
    PERFORM pg_advisory_xact_lock(hashtext(p_doctor_id::text || p_start_at::text));

    -- 2. Check if active confirmed booking already exists
    SELECT id INTO v_existing_id 
    FROM appointments
    WHERE doctor_id = p_doctor_id 
      AND start_at = p_start_at 
      AND status = 'CONFIRMED';

    IF v_existing_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error_code', 'SLOT_ALREADY_BOOKED',
            'message', 'This time slot has already been reserved by another patient.'
        );
    END IF;

    -- 3. Upsert patient record
    INSERT INTO patients (clinic_id, name, phone, email)
    VALUES (p_clinic_id, p_patient_name, p_patient_phone, p_patient_email)
    ON CONFLICT (clinic_id, phone) 
    DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, patients.email)
    RETURNING id INTO v_patient_id;

    -- 4. Insert confirmed booking
    INSERT INTO appointments (
        clinic_id, 
        doctor_id, 
        patient_id, 
        service_id, 
        patient_name, 
        patient_phone, 
        start_at, 
        end_at, 
        status, 
        booking_source, 
        notes
    )
    VALUES (
        p_clinic_id, 
        p_doctor_id, 
        v_patient_id, 
        p_service_id, 
        p_patient_name, 
        p_patient_phone, 
        p_start_at, 
        p_end_at, 
        'CONFIRMED', 
        p_source, 
        p_notes
    )
    RETURNING id INTO v_appointment_id;

    RETURN json_build_object(
        'success', true, 
        'appointment_id', v_appointment_id,
        'patient_id', v_patient_id,
        'message', 'Appointment successfully confirmed.'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false, 
            'error_code', 'SLOT_COLLISION',
            'message', 'A concurrent booking occurred for this slot.'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error_code', 'DATABASE_ERROR',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Atomic Appointment Cancellation
CREATE OR REPLACE FUNCTION cancel_appointment_atomic(
    p_appointment_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by patient via AI'
)
RETURNS JSON AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    UPDATE appointments
    SET status = 'CANCELLED',
        cancelled_at = NOW(),
        cancellation_reason = p_cancellation_reason
    WHERE id = p_appointment_id
      AND status = 'CONFIRMED'
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error_code', 'APPOINTMENT_NOT_FOUND_OR_ALREADY_CANCELLED',
            'message', 'The requested appointment could not be found or is already cancelled.'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'appointment_id', v_updated_id,
        'message', 'Appointment has been cancelled successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure: Atomic Appointment Rescheduling
CREATE OR REPLACE FUNCTION reschedule_appointment_atomic(
    p_appointment_id UUID,
    p_new_start_at TIMESTAMPTZ,
    p_new_end_at TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    v_doctor_id UUID;
    v_existing_id UUID;
BEGIN
    -- 1. Retrieve doctor_id
    SELECT doctor_id INTO v_doctor_id
    FROM appointments
    WHERE id = p_appointment_id AND status = 'CONFIRMED';

    IF v_doctor_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error_code', 'APPOINTMENT_NOT_FOUND',
            'message', 'Original confirmed appointment was not found.'
        );
    END IF;

    -- 2. Lock target slot
    PERFORM pg_advisory_xact_lock(hashtext(v_doctor_id::text || p_new_start_at::text));

    -- 3. Verify new slot is free
    SELECT id INTO v_existing_id 
    FROM appointments
    WHERE doctor_id = v_doctor_id 
      AND start_at = p_new_start_at 
      AND status = 'CONFIRMED'
      AND id != p_appointment_id;

    IF v_existing_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error_code', 'SLOT_ALREADY_BOOKED',
            'message', 'The target new slot is already booked.'
        );
    END IF;

    -- 4. Update appointment slot
    UPDATE appointments
    SET start_at = p_new_start_at,
        end_at = p_new_end_at,
        notes = COALESCE(notes, '') || ' (Rescheduled on ' || NOW()::text || ')'
    WHERE id = p_appointment_id;

    RETURN json_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'message', 'Appointment has been rescheduled successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
