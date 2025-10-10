import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centralized API base and fetch helper
// Prefer relative path during local development to leverage Vite proxy
const ENV_BASE = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '::1'
);
const API_BASE = ENV_BASE || (isLocalHost ? '' : 'https://uplift-final-final-18698.onrender.com');

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE || ''}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, init);
}
