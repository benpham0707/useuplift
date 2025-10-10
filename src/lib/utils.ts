import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centralized API base and fetch helper
const API_BASE = ((import.meta as any)?.env?.VITE_API_BASE as string) || 'https://uplift-final-final-18698.onrender.com';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE || ''}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, init);
}
