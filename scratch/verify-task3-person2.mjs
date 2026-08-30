// Task 3 Person 2 Verification Test Suite (PostgreSQL & Database Locking Lead)
async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const clinicId = '00000000-0000-0000-0000-000000000001';
  const doctorId = '11111111-1111-1111-1111-111111111111'; // Dr. Ashish Verma

  console.log('🚀 Starting Task 3 Person 2 Verification (PostgreSQL & Database Locking Lead)...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ' — ' + details : ''}`);
    }
  }

  // Calculate a test date (e.g. 5 days in the future, falling on a weekday Monday-Friday)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 5);
  // Ensure it's not Sunday (0) or Saturday (6) for full day testing
  if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
  if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  // ─── 1. Schedule Calculation Engine: Open Slots Calculation ─────────────
  // Formula: Weekly Schedule - Breaks - Leaves - Existing Bookings
  try {
    const availRes = await fetch(`${baseUrl}/api/availability?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${targetDateStr}`);
    const availJson = await availRes.json();

    assert(availRes.status === 200 && availJson.success, 'Schedule Engine: GET /api/availability returns 200');
    assert(Array.isArray(availJson.slots) && availJson.slots.length > 0, `Schedule Engine: Returns open slots for ${targetDateStr} (Found ${availJson.slots?.length} slots)`);

    // Verify 13:00 - 14:00 lunch break is excluded from open slots
    const lunchSlot1300 = availJson.slots.find(s => s.time_24h === '13:00' || s.time_24h === '13:30');
    assert(!lunchSlot1300, 'Schedule Engine: Break hours (13:00-14:00) are cleanly subtracted from candidate slots');

    // Verify slots are formatted properly
    const firstSlot = availJson.slots[0];
    assert(firstSlot.time_24h && firstSlot.time_formatted && firstSlot.start_iso, 'Schedule Engine: Slot schema includes time_24h, time_formatted, start_iso');
  } catch (err) {
    assert(false, 'Schedule Engine: Availability calculation failed', err.message);
  }

  // ─── 2. Patient Record Upsert & Atomic Booking ───────────────────────────
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = `+91998877${randomSuffix}`;
  const testPatientName = `Rohan Gupta ${randomSuffix}`;
  let testSlotStart = `${targetDateStr}T10:30:00Z`;
  let createdAppointmentId = null;

  try {
    // Dynamically pick the first open slot from available slots
    const availCheck = await fetch(`${baseUrl}/api/availability?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${targetDateStr}`);
    const availData = await availCheck.json();
    if (availData.slots && availData.slots.length > 0) {
      testSlotStart = availData.slots[0].start_iso;
    }

    const bookRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        doctor_id: doctorId,
        patient_name: testPatientName,
        patient_phone: testPhone,
        start_at: testSlotStart,
        booking_source: 'AI_VOICE',
        notes: 'Task 3 Person 2 verification booking',
      }),
    });
    const bookJson = await bookRes.json();

    assert(bookRes.status === 201 && bookJson.success, 'Atomic Booking: First booking for slot succeeds with 201 Created');
    assert(!!bookJson.appointment?.id, 'Atomic Booking: Returns created appointment object with ID');
    assert(!!bookJson.appointment?.patient_id, 'Patient Upsert: Returns linked patient_id on appointment');

    createdAppointmentId = bookJson.appointment?.id;

    // Verify patient is in patients store/table
    const patRes = await fetch(`${baseUrl}/api/patients?clinic_id=${clinicId}&query=${randomSuffix}`);
    const patJson = await patRes.json();
    assert(patRes.status === 200 && patJson.patients.length > 0, 'Patient Upsert: Patient record is queryable by phone');
    const matchedPat = patJson.patients.find(p => p.phone === testPhone);
    assert(matchedPat?.name === testPatientName, 'Patient Upsert: Patient name matches newly upserted record');
  } catch (err) {
    assert(false, 'Atomic Booking & Patient Upsert failed', err.message);
  }

  // ─── 3. Collision Prevention (Advisory Lock Simulation / Conflict Check) ──
  // Attempting to book the EXACT same doctor & slot must fail with 409 Conflict
  try {
    const collisionRes = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        doctor_id: doctorId,
        patient_name: 'Simultaneous Caller 2',
        patient_phone: '+919911223344',
        start_at: testSlotStart,
        booking_source: 'AI_VOICE',
      }),
    });
    const collisionJson = await collisionRes.json();

    assert(collisionRes.status === 409, 'Locking/Collision: Second simultaneous booking on same slot returns 409 Conflict');
    assert(collisionJson.success === false, 'Locking/Collision: success is false');
    assert(collisionJson.error_code === 'SLOT_ALREADY_BOOKED', 'Locking/Collision: error_code is SLOT_ALREADY_BOOKED');
  } catch (err) {
    assert(false, 'Collision detection test failed', err.message);
  }

  // ─── 4. Verify Slot is Removed from Schedule Engine ───────────────────────
  try {
    const recheckRes = await fetch(`${baseUrl}/api/availability?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${targetDateStr}`);
    const recheckJson = await recheckRes.json();
    const bookedSlotCheck = recheckJson.slots.find(s => s.start_iso === testSlotStart);

    assert(!bookedSlotCheck, `Schedule Engine: Booked slot (${testSlotStart}) is immediately subtracted from available slots calculation`);
  } catch (err) {
    assert(false, 'Availability subtraction check failed', err.message);
  }

  // ─── 5. SQL Stored Procedure Verification (PostgreSQL advisory lock) ──────
  try {
    const fs = await import('fs');
    const path = await import('path');
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/20240830000003_atomic_booking.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    assert(sqlContent.includes('pg_advisory_xact_lock'), 'PostgreSQL Stored Proc: Uses pg_advisory_xact_lock for concurrency locking');
    assert(sqlContent.includes('book_appointment_atomic'), 'PostgreSQL Stored Proc: Implements book_appointment_atomic function');
    assert(/ON CONFLICT\s*\(\s*clinic_id\s*,\s*phone\s*\)\s*DO UPDATE/i.test(sqlContent), 'PostgreSQL Stored Proc: Implements Patient Record Upsert with ON CONFLICT');
    assert(sqlContent.includes('reschedule_appointment_atomic'), 'PostgreSQL Stored Proc: Implements reschedule_appointment_atomic');
    assert(sqlContent.includes('cancel_appointment_atomic'), 'PostgreSQL Stored Proc: Implements cancel_appointment_atomic');
  } catch (err) {
    assert(false, 'SQL stored procedure file verification', err.message);
  }

  console.log(`\n========================================`);
  console.log(`Task 3 Person 2 Results: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);
}

runTests();
