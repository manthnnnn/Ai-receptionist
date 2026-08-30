import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseServerConfigured(): boolean {
  const url = supabaseUrl;
  const key = serviceRoleKey || anonKey;
  return Boolean(
    url &&
    key &&
    url !== 'https://your-supabase-project.supabase.co' &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('your-project')
  );
}

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) return null;
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, serviceRoleKey || anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}
