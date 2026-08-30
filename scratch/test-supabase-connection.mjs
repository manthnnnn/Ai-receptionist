import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function testSupabase() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  const env = loadEnv();

  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`URL: ${url ? url : '(missing)'}`);
  console.log(`Anon Key: ${anonKey ? anonKey.slice(0, 15) + '...' : '(missing)'}`);
  console.log(`Service Role Key: ${serviceKey ? serviceKey.slice(0, 15) + '...' : '(missing)'}\n`);

  if (!url || url.includes('your-supabase-project') || !anonKey || anonKey.includes('your-supabase-anon-key')) {
    console.log('⚠️  Please make sure you have saved your real credentials in .env.local (Press Ctrl+S in editor)!');
    return;
  }

  const supabase = createClient(url, serviceKey || anonKey);

  // 1. Test basic table read
  try {
    const { data: clinics, error: clinicErr } = await supabase.from('clinics').select('*').limit(5);
    if (clinicErr) {
      console.error('❌ Query clinics table failed:', clinicErr.message);
      if (clinicErr.message.includes('relation "public.clinics" does not exist') || clinicErr.code === '42P01') {
        console.log('👉 Hint: You need to run `01_initial_schema.sql` in your Supabase SQL Editor first!');
      }
    } else {
      console.log(`✅ Successfully connected to Supabase! Found ${clinics.length} clinics in database.`);
    }

    // 2. Test doctors table
    const { data: doctors, error: docErr } = await supabase.from('doctors').select('*').limit(5);
    if (!docErr && doctors) {
      console.log(`✅ Found ${doctors.length} doctors.`);
    }

    // 3. Test RPC stored procedure
    const { data: rpcTest, error: rpcErr } = await supabase.rpc('book_appointment_atomic', {
      p_clinic_id: '00000000-0000-0000-0000-000000000001',
      p_doctor_id: '11111111-1111-1111-1111-111111111111',
      p_patient_name: 'Ping Test Patient',
      p_patient_phone: '+919999999999',
      p_start_at: new Date(Date.now() + 86400000 * 30).toISOString(),
      p_end_at: new Date(Date.now() + 86400000 * 30 + 1800000).toISOString(),
      p_source: 'AI_VOICE',
    });

    if (rpcErr) {
      console.error('❌ Stored Procedure book_appointment_atomic check:', rpcErr.message);
      if (rpcErr.message.includes('function book_appointment_atomic') || rpcErr.code === '42883') {
        console.log('👉 Hint: You need to run `03_atomic_booking.sql` in your Supabase SQL Editor!');
      }
    } else {
      console.log('✅ Stored Procedure `book_appointment_atomic` with pg_advisory_xact_lock is active and working!');
    }
  } catch (e) {
    console.error('❌ Connection error:', e.message);
  }
}

testSupabase();
