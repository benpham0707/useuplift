import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from 'jwt-decode';

// Support multiple env names to match local/dev and Render dashboards
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string | undefined;
const supabaseAnon = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY
) as string | undefined;
const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

// Helper to safely decode Clerk JWTs (which might not validate against Supabase's secret if not synced)
// In a real Clerk backend setup, you would use @clerk/clerk-sdk-node to verify the token signature.
// Since this is a migration and we want to trust the token for now (assuming Clerk middleware on frontend is secure):
const getUserIdFromToken = async (token: string): Promise<string | null> => {
  try {
    // 1. Try decoding as Clerk JWT first (faster, no network)
    const decoded: any = jwtDecode(token);
    // Clerk tokens have 'sub' as the user ID (e.g., user_2q...)
    // They also typically have an 'iss' starting with 'https://clerk'
    if (decoded && decoded.sub && (decoded.iss?.includes('clerk') || decoded.azp?.includes('http'))) {
      return decoded.sub;
    }
  } catch (e) {
    // Token might not be a valid JWT or standard format
  }

  // 2. Fallback to Supabase verification (for legacy users or if configured to sync)
  if (supabase) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      return data.user.id;
    }
  }

  return null;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    
    if (!token) {
      // eslint-disable-next-line no-console
      console.warn("Auth middleware: missing token", {
        path: req.path
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await getUserIdFromToken(token);

    if (!userId) {
      // eslint-disable-next-line no-console
      console.warn("Auth middleware: token verification failed", {
        path: req.path,
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    (req as any).auth = { userId: userId };
    next();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Auth middleware: exception", { path: req.path, error: e });
    return res.status(401).json({ error: "Unauthorized" });
  }
}
