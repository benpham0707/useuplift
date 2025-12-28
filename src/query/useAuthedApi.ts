import { useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiFetch } from '@/lib/utils';

/**
 * Hook that provides an authenticated fetch function.
 * Automatically includes Clerk authentication token in API requests.
 */
export function useAuthedApi() {
  const { getToken } = useClerkAuth();

  const fetchJson = useCallback(
    async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const headers = {
        ...init.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await apiFetch(path, {
        ...init,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    [getToken]
  );

  return { fetchJson };
}

