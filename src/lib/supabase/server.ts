// Server-side Supabase client initialization
export function isSupabaseServerConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_URL !== 'https://your-project.supabase.co'
  );
}
