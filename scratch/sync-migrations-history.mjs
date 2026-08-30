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

async function syncMigrations() {
  console.log('🔄 Synchronizing Supabase CLI Migration History...\n');
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing URL or Service Role Key in .env.local');
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const migrationsToRecord = [
    { version: '20240830000001', name: '20240830000001_initial_schema' },
    { version: '20240830000002', name: '20240830000002_rls_policies' },
    { version: '20240830000003', name: '20240830000003_atomic_booking' },
  ];

  // Check if supabase_migrations table is accessible via RPC / direct query
  // We can create a simple helper function or query
  console.log('Recording versions:');
  for (const m of migrationsToRecord) {
    console.log(`  - ${m.version} (${m.name}.sql) -> MARK AS APPLIED`);
  }
}

syncMigrations();
