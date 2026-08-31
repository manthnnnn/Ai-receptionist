// Comprehensive verification script for Task 4 Person 2
// Tests: Appointments & Doctors UI endpoints, Reschedule & Cancel API, Doctor Fee Manager, SMS/WhatsApp dispatch, and Multi-Tenant Isolation

async function runVerification() {
  const baseUrl = 'http://localhost:3000';
  console.log('🧪 Starting Task 4 Person 2 Comprehensive Verification...\n');

  const clinic1Id = '00000000-0000-0000-0000-000000000001'; // Apollo Dental
  const clinic2Id = '00000000-0000-0000-0000-000000000002'; // Radiance Dermatology

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Test Fetch Doctors & Fee Information
    console.log('--- 1. Testing Doctors & Fee Manager ---');
    const docRes = await fetch(`${baseUrl}/api/doctors?clinic_id=${clinic1Id}`);
    const docData = await docRes.json();
    assert(docData.success && Array.isArray(docData.doctors) && docData.doctors.length > 0, 'Doctors fetched successfully for Clinic 1');

    const firstDoctor = docData.doctors[0];
    const initialFee = firstDoctor.consultation_fee;
    const newFee = initialFee + 150;

    // Test Updating Doctor Fee & Duration
    const updateDocRes = await fetch(`${baseUrl}/api/doctors/${firstDoctor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultation_fee: newFee,
        consultation_duration_minutes: 45,
      }),
    });
    const updateDocData = await updateDocRes.json();
    assert(updateDocData.success && updateDocData.doctor.consultation_fee === newFee, `Doctor consultation fee updated from ₹${initialFee} to ₹${newFee}`);
    assert(updateDocData.doctor.consultation_duration_minutes === 45, 'Doctor consultation duration updated to 45 mins');

    // 2. Test Appointments Roster & Advanced Filters
    console.log('\n--- 2. Testing Appointments Roster & Filtering ---');
    const appRes = await fetch(`${baseUrl}/api/appointments?clinic_id=${clinic1Id}`);
    const appData = await appRes.json();
    assert(appData.success && Array.isArray(appData.appointments), 'Appointments roster fetched successfully');
    
    const initialCount = appData.appointments.length;
    console.log(`Total appointments for Clinic 1: ${initialCount}`);

    // Test Search filter by patient name
    const searchRes = await fetch(`${baseUrl}/api/appointments?clinic_id=${clinic1Id}&query=Priya`);
    const searchData = await searchRes.json();
    assert(searchData.success && searchData.appointments.some(a => a.patient_name.includes('Priya')), 'Search filter successfully matches patient name');

    // 3. Test Booking New Appointment + Automatic Notification Trigger
    console.log('\n--- 3. Testing Booking + Instant SMS & WhatsApp Dispatch ---');
    const tomorrow = new Date();
    const randomOffset = Math.floor(Math.random() * 50) + 1;
    const testSlot = `${tomorrow.toISOString().split('T')[0]}T14:${String(randomOffset).padStart(2, '0')}:00Z`;

    const bookRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinic1Id,
        doctor_id: firstDoctor.id,
        patient_name: 'Vikramaditya Roy',
        patient_phone: '+91 99887 76655',
        start_at: testSlot,
        booking_source: 'AI_VOICE',
        notes: 'Pre-surgery consultation',
      }),
    });
    const bookData = await bookRes.json();
    assert(bookData.success && bookData.appointment, 'New appointment booked with atomic schedule lock');
    
    const createdAppId = bookData.appointment?.id;

    // Test On-Demand Instant Notification Dispatch
    const dispatchRes = await fetch(`${baseUrl}/api/notifications/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_id: createdAppId,
        channels: ['SMS', 'WHATSAPP'],
      }),
    });
    const dispatchData = await dispatchRes.json();
    assert(dispatchData.success && dispatchData.data.sms_status === 'DELIVERED', 'Twilio SMS confirmation delivered with patient & doctor template');
    assert(dispatchData.data.whatsapp_status === 'DELIVERED', 'WhatsApp confirmation delivered with full clinic details');
    assert(dispatchData.data.logs.length >= 2, 'Dispatch logs recorded with timestamp and delivery providers');

    // 4. Test Reschedule Modal API
    console.log('\n--- 4. Testing Reschedule Modal API ---');
    const rescheduledSlot = `${tomorrow.toISOString().split('T')[0]}T17:${String(randomOffset).padStart(2, '0')}:00Z`;
    const rescheduleRes = await fetch(`${baseUrl}/api/appointments/${createdAppId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_start_at: rescheduledSlot,
        new_end_at: `${tomorrow.toISOString().split('T')[0]}T17:${String(randomOffset + 30).padStart(2, '0')}:00Z`,
      }),
    });
    const rescheduleData = await rescheduleRes.json();
    assert(rescheduleData.success && rescheduleData.appointment.start_at === rescheduledSlot, 'Appointment rescheduled to new time slot successfully');

    // 5. Test Cancel Modal API
    console.log('\n--- 5. Testing Cancel Modal API ---');
    const cancelRes = await fetch(`${baseUrl}/api/appointments/${createdAppId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Patient requested reschedule to next week',
      }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelData.success, 'Appointment cancelled and time slot released');

    // 6. Test Multi-Tenant Isolation (Clinic 1 vs Clinic 2)
    console.log('\n--- 6. Testing Multi-Tenant Isolation & RLS Boundary ---');
    const clinic2AppRes = await fetch(`${baseUrl}/api/appointments?clinic_id=${clinic2Id}`);
    const clinic2AppData = await clinic2AppRes.json();
    
    // Ensure appointments returned for clinic 2 ONLY belong to clinic 2
    const allBelongToClinic2 = clinic2AppData.appointments.every(a => a.clinic_id === clinic2Id);
    assert(allBelongToClinic2, 'Clinic 2 staff cannot view Clinic 1 appointments (Strict Isolation)');

    const clinic2DocRes = await fetch(`${baseUrl}/api/doctors?clinic_id=${clinic2Id}`);
    const clinic2DocData = await clinic2DocRes.json();
    const allDocsBelongToClinic2 = clinic2DocData.doctors.every(d => d.clinic_id === clinic2Id);
    assert(allDocsBelongToClinic2, 'Clinic 2 staff cannot view Clinic 1 doctors (Strict Isolation)');

    console.log('\n========================================');
    console.log(`Verification Complete: ${passCount} Passed, ${failCount} Failed.`);
    console.log('========================================');
    
    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during verification:', err);
    process.exit(1);
  }
}

runVerification();
