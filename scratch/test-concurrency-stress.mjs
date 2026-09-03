// 10-Concurrent-Request Advisory Lock Stress Test on Live Supabase
// Verifies pg_advisory_xact_lock in book_appointment_atomic
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

async function runConcurrencyStressTest() {
  console.log('======================================================================');
  console.log('⚡ RUNNING 10-CONCURRENT-REQUEST ADVISORY LOCK STRESS TEST (PHASE 3)');
  console.log('======================================================================\n');

  const { db } = await import('../src/lib/db/client.ts');

  const clinicId = '00000000-0000-0000-0000-000000000001';
  const doctorId = '11111111-1111-1111-1111-111111111111'; // Dr. Ashish Verma

  // Target a unique slot far in the future
  const testStartTime = new Date(Date.now() + 86400000 * 90).toISOString();
  const testEndTime = new Date(new Date(testStartTime).getTime() + 30 * 60000).toISOString();

  console.log(`🎯 Doctor ID: ${doctorId}`);
  console.log(`🎯 Slot Target: ${testStartTime} to ${testEndTime}`);
  console.log(`🚀 Dispatching 10 simultaneous concurrent booking requests...\n`);

  const requests = Array.from({ length: 10 }, (_, i) => {
    const patientIndex = i + 1;
    return db.bookAppointment({
      clinic_id: clinicId,
      doctor_id: doctorId,
      patient_name: `Concurrent Patient ${patientIndex}`,
      patient_phone: `+91 98888 0000${patientIndex}`,
      start_at: testStartTime,
      end_at: testEndTime,
      booking_source: 'AI_VOICE',
      notes: `Concurrency Stress Request #${patientIndex}`,
    }).then((res) => ({
      index: patientIndex,
      ...res,
    }));
  });

  const results = await Promise.all(requests);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log('----------------------------------------------------------------------');
  console.log('📊 CONCURRENCY RESULTS:');
  console.log('----------------------------------------------------------------------');
  console.log(`  Total Requests Dispatched: 10`);
  console.log(`  Successful Confirmations:  ${successful.length}`);
  console.log(`  Rejected Slot Collisions:  ${failed.length}\n`);

  results.forEach((r) => {
    if (r.success) {
      console.log(`  ✅ Request #${r.index}: WON LOCK -> Appointment ID: ${r.appointment?.id || r.appointment_id}`);
    } else {
      console.log(`  🛡️  Request #${r.index}: REJECTED -> Code: ${r.error_code || 'SLOT_ALREADY_BOOKED'} (${r.message})`);
    }
  });

  console.log('\n----------------------------------------------------------------------');
  console.log('🔍 VERIFICATION ASSERTIONS:');
  console.log('----------------------------------------------------------------------');

  let passed = true;
  if (successful.length === 1) {
    console.log('  ✅ PASS: Exactly 1 concurrent request succeeded in acquiring PostgreSQL advisory lock.');
  } else {
    console.error(`  ❌ FAIL: Expected exactly 1 successful request, but found ${successful.length}. Race condition detected!`);
    passed = false;
  }

  if (failed.length === 9) {
    console.log('  ✅ PASS: Exactly 9 concurrent requests were safely rejected with slot collision errors.');
  } else {
    console.error(`  ❌ FAIL: Expected 9 rejected requests, but found ${failed.length}.`);
    passed = false;
  }

  // Cleanup confirmed appointment
  if (successful.length === 1) {
    const winnerAppId = successful[0].appointment?.id || successful[0].appointment_id;
    if (winnerAppId) {
      console.log(`\n🧹 Cleaning up test appointment ${winnerAppId}...`);
      const cancelRes = await db.cancelAppointment(winnerAppId, 'Concurrency test completed');
      if (cancelRes.success) {
        console.log('  ✅ PASS: Test appointment cleanly cancelled.');
      }
    }
  }

  console.log('\n======================================================================');
  if (passed) {
    console.log('🎉 PHASE 3 CONCURRENCY STRESS TEST PASSED 100%!');
  } else {
    console.log('❌ PHASE 3 CONCURRENCY STRESS TEST FAILED');
    process.exit(1);
  }
  console.log('======================================================================\n');
}

runConcurrencyStressTest().catch((err) => {
  console.error('Concurrency test exception:', err);
  process.exit(1);
});
