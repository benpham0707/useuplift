import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Prefer the server-only URL so local/staging API traffic can target a different
// project without changing the browser's VITE_SUPABASE_URL and anon key pair.
const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PROJECT_URL) as string;
const serviceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
) as string;

if (!url) {
  throw new Error("Missing Supabase URL. Set VITE_SUPABASE_URL or SUPABASE_URL in your environment.");
}
if (!serviceKey) {
  throw new Error("Missing Supabase service key. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_SERVICE_KEY.");
}

export const supabaseAdmin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false }
});

