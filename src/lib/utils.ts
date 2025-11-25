import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centralized API base and fetch helper
// If VITE_API_BASE is set, use it.
// Otherwise, if in DEV mode, use empty string (relative path to use Vite proxy).
// In production, we expect VITE_API_BASE to be set.

// DEBUG: Log the environment variable to see if it's being read
console.log('DEBUG: VITE_API_BASE is:', (import.meta as any)?.env?.VITE_API_BASE);

const API_BASE = ((import.meta as any)?.env?.VITE_API_BASE as string) || 
  ((import.meta as any)?.env?.DEV ? '' : 'https://uplift-backend-cyqk.onrender.com');

export async function apiFetch(path: string, init: RequestInit = {}) {
  // Warn if in production and no API base is set (unless using a same-domain proxy)
  if (!API_BASE && !(import.meta as any)?.env?.DEV && !path.startsWith('http')) {
     console.warn('Warning: VITE_API_BASE is not set in production. API calls to relative paths may fail if not proxied.');
     // Fallback for debugging - if you see this warning but want it to work, 
     // this hardcoded value will save the day temporarily.
     // We only use this fallback if the env var failed to load.
     const FALLBACK_URL = 'https://uplift-backend-cyqk.onrender.com';
     const url = path.startsWith('http') ? path : `${FALLBACK_URL}${path.startsWith('/') ? path : `/${path}`}`;
     return fetch(url, init);
  }

  const url = path.startsWith('http') ? path : `${API_BASE || ''}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, init);
}
