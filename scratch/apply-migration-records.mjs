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

async function run() {
  console.log('🚀 Recording Supabase Migration History in Database...\n');
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing URL or Service Key');
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'supabase_migrations' },
  });

  const versions = ['20240830000001', '20240830000002', '20240830000003'];

  try {
    for (const v of versions) {
      const { data, error } = await supabase
        .from('schema_migrations')
        .upsert({ version: v }, { onConflict: 'version' })
        .select();

      if (error) {
        console.log(`Note on ${v}:`, error.message);
      } else {
        console.log(`✅ Successfully marked migration ${v} as APPLIED in supabase_migrations.schema_migrations`);
      }
    }

    // Verify
    const { data: allMigrations, error: listErr } = await supabase
      .from('schema_migrations')
      .select('*');

    if (!listErr && allMigrations) {
      console.log('\n📊 Current Supabase Migration History:');
      console.table(allMigrations);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
