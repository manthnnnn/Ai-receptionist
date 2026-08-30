import { createClient } from '@supabase/supabase-js';
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
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function inspect() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.error('Missing URL or Key in .env.local');
    return;
  }

  const supabase = createClient(url, serviceKey);

  console.log('=== 1. Checking Tables in Remote Database ===');
  const tablesToCheck = [
    'clinics',
    'clinic_settings',
    'profiles',
    'doctors',
    'doctor_availability',
    'doctor_breaks',
    'doctor_leaves',
    'clinic_holidays',
    'services',
    'patients',
    'appointments',
    'call_logs',
    'conversations',
    'messages',
    'clinic_faqs'
  ];

  for (const table of tablesToCheck) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table "${table}": NOT FOUND or inaccessible (${error.message})`);
    } else {
      console.log(`✅ Table "${table}": EXISTS (Row count: ${count})`);
    }
  }

  console.log('\n=== 2. Checking Supabase CLI Schema Migrations Table ===');
  try {
    const { data: migrations, error: migErr } = await supabase
      .from('schema_migrations')
      .select('*');
    
    if (migErr) {
      console.log(`ℹ️  schema_migrations query on public/default: ${migErr.message}`);
    } else {
      console.log('Found migrations in schema_migrations:', migrations);
    }
  } catch (e) {
    console.log('Error checking schema_migrations:', e.message);
  }

  console.log('\n=== 3. Checking Stored Procedures ===');
  const rpcFunctions = ['book_appointment_atomic', 'cancel_appointment_atomic', 'reschedule_appointment_atomic'];
  for (const fn of rpcFunctions) {
    // Call with invalid dummy params to see if function exists (error will say parameter or return structure, not function does not exist)
    const { data, error } = await supabase.rpc(fn, {});
    if (error && (error.message.includes('function') && error.message.includes('does not exist'))) {
      console.log(`❌ RPC "${fn}": DOES NOT EXIST`);
    } else {
      console.log(`✅ RPC "${fn}": EXISTS in remote database`);
    }
  }
}

inspect();
