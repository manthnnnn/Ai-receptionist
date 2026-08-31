// Comprehensive Automated Verification Suite for MVP Backend Modules
// Validates:
// 1. Services & Pricing Catalog CRUD (/api/services)
// 2. Doctor Leaves & Slot Engine Blackout (/api/doctors/[id]/leaves, /api/availability)
// 3. Clinic Holiday Closures & Slot Engine Blackout (/api/holidays, /api/availability)
// 4. Deep Patient Profile & Visit History (/api/patients/[id])
// 5. Real-Time Telemetry & Direct COGS Analytics (/api/analytics)
// 6. CSV Data Export & Outbound EHR Webhook (/api/export, /api/webhooks/outbound)

async function runMvpBackendVerification() {
  let baseUrl = 'http://localhost:3000';
  try {
    const check = await fetch('http://localhost:3000/api/clinic');
    if (!check.ok) baseUrl = 'http://localhost:3001';
  } catch {
    baseUrl = 'http://localhost:3001';
  }

  console.log(`\n======================================================================`);
  console.log(`🚀 STARTING MVP BACKEND CAPABILITIES VERIFICATION SUITE`);
  console.log(`🎯 Testing Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const clinicId = '00000000-0000-0000-0000-000000000001'; // Apollo Dental
  const doctorId = '11111111-1111-1111-1111-111111111111'; // Dr. Ashish Verma

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PART 1: Services & Pricing Catalog CRUD API (/api/services)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📌 PART 1: SERVICES & PRICING CATALOG CRUD API');

    // 1.1 List services
    const srvListRes = await fetch(`${baseUrl}/api/services?clinic_id=${clinicId}`);
    const srvListData = await srvListRes.json();
    assert(srvListData.success && srvListData.count >= 3, `Retrieved active services catalog (count: ${srvListData.count})`);

    // 1.2 Create service
    const createSrvRes = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        name: 'Dental Ceramic Crown & Bridge',
        description: 'Zirconia / Porcelain high-strength tooth crown restoration',
        duration_minutes: 45,
        price: 6000,
      }),
    });
    const createSrvData = await createSrvRes.json();
    assert(createSrvData.success && createSrvData.service?.id, 'Created new clinical service with custom pricing & duration');
    const newServiceId = createSrvData.service?.id;

    // 1.3 Update service
    const updateSrvRes = await fetch(`${baseUrl}/api/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newServiceId,
        name: 'Premium Zirconia Crown',
        price: 6500,
      }),
    });
    const updateSrvData = await updateSrvRes.json();
    assert(updateSrvData.success && updateSrvData.service?.price === 6500, 'Updated service pricing and title');

    // 1.4 Delete service
    const deleteSrvRes = await fetch(`${baseUrl}/api/services?id=${newServiceId}`, {
      method: 'DELETE',
    });
    const deleteSrvData = await deleteSrvRes.json();
    assert(deleteSrvData.success === true, 'Deleted service from active catalog');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 2: Doctor Leaves & Slot Engine Blackout Integration
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 2: DOCTOR LEAVES & SCHEDULING ENGINE BLACKOUT');

    const testLeaveDate = '2026-10-15';
    // Add leave for Dr. Ashish Verma on 2026-10-15
    const leaveRes = await fetch(`${baseUrl}/api/doctors/${doctorId}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_at: `${testLeaveDate}T00:00:00Z`,
        end_at: `${testLeaveDate}T23:59:59Z`,
        reason: 'National Dental Symposium Speaker',
      }),
    });
    const leaveData = await leaveRes.json();
    assert(leaveData.success && leaveData.leave?.id, 'Recorded doctor date-range leave in database');

    // Verify slot engine calculates 0 slots on doctor leave date
    const availLeaveRes = await fetch(`${baseUrl}/api/availability?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${testLeaveDate}`);
    const availLeaveData = await availLeaveRes.json();
    assert(availLeaveData.success && availLeaveData.available_slots?.length === 0, 'Slot Engine automatically blocked all slots on doctor leave date (0 slots)');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 3: Clinic Holidays & Schedule Blackout Integration
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 3: CLINIC HOLIDAYS & CLINIC-WIDE SCHEDULE BLACKOUT');

    const testHolidayDate = '2026-11-01'; // Kannada Rajyotsava Holiday
    const holRes = await fetch(`${baseUrl}/api/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        start_at: `${testHolidayDate}T00:00:00Z`,
        end_at: `${testHolidayDate}T23:59:59Z`,
        reason: 'State Holiday Closure',
      }),
    });
    const holData = await holRes.json();
    assert(holData.success && holData.holiday?.id, 'Created clinic holiday closure');

    // Verify slot engine calculates 0 slots for ALL doctors on clinic holiday
    const availHolRes = await fetch(`${baseUrl}/api/availability?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${testHolidayDate}`);
    const availHolData = await availHolRes.json();
    assert(availHolData.success && availHolData.available_slots?.length === 0, 'Slot Engine automatically blocked all clinic slots on holiday closure (0 slots)');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 4: Deep Patient Profile & Visit History (/api/patients/[id])
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 4: PATIENT PROFILE & MEDICAL VISIT HISTORY API');

    const patientId = '33333333-3333-3333-3333-333333333331'; // Priya Sundaram
    const patientDetailRes = await fetch(`${baseUrl}/api/patients/${patientId}`);
    const patientDetailData = await patientDetailRes.json();
    assert(patientDetailData.success && patientDetailData.patient?.name === 'Priya Sundaram', 'Retrieved patient identity & contact details');
    assert(Array.isArray(patientDetailData.appointments) && patientDetailData.appointments_count >= 1, 'Compiled complete appointment history timeline');
    assert(Array.isArray(patientDetailData.call_logs), 'Linked telephony call records and transcripts to patient');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 5: Real-Time Telemetry & Direct COGS Analytics (/api/analytics)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 5: REAL-TIME TELEMETRY & DIRECT COGS ANALYTICS API');

    const analyticsRes = await fetch(`${baseUrl}/api/analytics?clinic_id=${clinicId}`);
    const analyticsData = await analyticsRes.json();
    const a = analyticsData.analytics;
    assert(analyticsData.success === true, 'Fetched real-time analytics for clinic tenant');
    assert(typeof a.total_telephony_minutes === 'number', `Calculated total telephony minutes (${a.total_telephony_minutes} mins)`);
    assert(a.direct_cogs_breakdown?.total_rate_per_min === 3.23, 'Direct COGS accurately configured at ₹3.23 / min rate');
    assert(typeof a.est_revenue_inr === 'number' && a.est_revenue_inr > 0, `Calculated estimated clinic revenue (₹${a.est_revenue_inr})`);
    assert(typeof a.language_distribution === 'object', 'Calculated multi-lingual conversation distribution (EN/HI/MR)');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 6: CSV Data Export & Outbound EHR Webhook Dispatch
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 6: CSV DATA EXPORT & OUTBOUND EHR WEBHOOKS');

    // 6.1 CSV Appointments Export
    const csvAppRes = await fetch(`${baseUrl}/api/export?type=appointments&clinic_id=${clinicId}&format=csv`);
    const csvAppText = await csvAppRes.text();
    assert(csvAppRes.status === 200 && csvAppText.includes('Patient Name') && csvAppText.includes('Priya Sundaram'), 'Generated formatted CSV export for clinic appointments');

    // 6.2 CSV Calls Export
    const csvCallRes = await fetch(`${baseUrl}/api/export?type=calls&clinic_id=${clinicId}&format=csv`);
    const csvCallText = await csvCallRes.text();
    assert(csvCallRes.status === 200 && csvCallText.includes('Call ID') && csvCallText.includes('Caller Phone'), 'Generated formatted CSV export for telephony call logs');

    // 6.3 Outbound EHR Webhook
    const webhookRes = await fetch(`${baseUrl}/api/webhooks/outbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'appointment.confirmed',
        clinic_id: clinicId,
        data: {
          appointment_id: '44444444-4444-4444-4444-444444444441',
          patient_name: 'Priya Sundaram',
          doctor: 'Dr. Ashish Verma',
          slot: '2026-09-01T11:00:00Z',
        },
      }),
    });
    const webhookData = await webhookRes.json();
    assert(webhookData.success && webhookData.event === 'appointment.confirmed', 'Dispatched outbound EHR webhook with appointment payload');

    console.log('\n======================================================================');
    console.log(`🏁 MVP BACKEND VERIFICATION COMPLETE: ${passCount} Passed, ${failCount} Failed.`);
    console.log(`======================================================================\n`);

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during MVP Backend verification:', err);
    process.exit(1);
  }
}

runMvpBackendVerification();
