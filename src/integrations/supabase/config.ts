// Configuration validation for Supabase
export function getSupabaseConfigErrors(): string[] {
  const errors: string[] = [];

  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }

  return errors;
}