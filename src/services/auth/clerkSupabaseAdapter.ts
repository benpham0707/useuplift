/**
 * Clerk-Supabase Authentication Adapter
 *
 * This module bridges Clerk authentication with Supabase RLS policies.
 * Supabase RLS policies check for `auth.jwt() ->> 'sub'` which contains the Clerk user ID.
 *
 * Usage:
 *   const userId = getCurrentClerkUserId();
 *   if (!userId) {
 *     // Handle unauthenticated state
 *   }
 */

import { useAuth } from '@clerk/clerk-react';

/**
 * Hook to get the current Clerk user ID
 * This is the user ID that Supabase RLS policies will check against
 *
 * @returns Clerk user ID (e.g., "user_2q...") or null if not authenticated
 */
export function useClerkUserId(): string | null {
  const { userId } = useAuth();
  return userId;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isSignedIn } = useAuth();
  return isSignedIn || false;
}

/**
 * Hook to get Supabase JWT token from Clerk
 * This token contains the 'sub' claim with the Clerk user ID
 *
 * @returns Promise<string | null> - JWT token or null if not authenticated
 */
export function useSupabaseToken(): () => Promise<string | null> {
  const { getToken } = useAuth();

  return async () => {
    try {
      // Get Clerk token with Supabase template
      // This token will be used in the Authorization header for Supabase requests
      const token = await getToken({ template: 'supabase' });
      return token;
    } catch (error) {
      return null;
    }
  };
}

/**
 * Non-hook version: Get current Clerk user ID (for use outside React components)
 * Note: This requires the Clerk context to be available
 *
 * For use in services/utilities, consider passing userId as parameter instead
 */
export function getCurrentClerkUserIdSync(): string | null {
  // This is a synchronous version that works if Clerk context is available
  // For services, it's better to pass userId as a parameter
  if (typeof window === 'undefined') {
    return null;
  }

  // Access Clerk instance from window (if available)
  // This is a fallback and not recommended for primary use
  const clerk = (window as any).Clerk;
  if (clerk?.user?.id) {
    return clerk.user.id;
  }

  return null;
}

/**
 * Helper to create authenticated Supabase client headers
 * Use this when making direct Supabase API calls
 *
 * @param getToken - Clerk's getToken function
 * @returns Promise<{ 'Authorization': string } | null>
 */
export async function getSupabaseAuthHeaders(
  getToken: (options: { template: string }) => Promise<string | null>
): Promise<{ Authorization: string } | null> {
  try {
    const token = await getToken({ template: 'supabase' });
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`
    };
  } catch (error) {
    return null;
  }
}

/**
 * Type guard to check if user is authenticated
 */
export function assertAuthenticated(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error('User not authenticated');
  }
}

/**
 * Validation helper for user ID
 */
export function isValidClerkUserId(userId: string | null): userId is string {
  return typeof userId === 'string' && userId.length > 0 && userId.startsWith('user_');
}

/**
 * Hook for components that require authentication
 * Throws error if not authenticated (use with error boundaries)
 */
export function useRequireAuth(): string {
  const userId = useClerkUserId();

  if (!userId) {
    throw new Error('Authentication required: No user ID available');
  }

  return userId;
}

/**
 * Example usage in a service function:
 *
 * export async function saveEssay(userId: string, essayData: Essay) {
 *   assertAuthenticated(userId);
 *
 *   const { data, error } = await supabase
 *     .from('essays')
 *     .insert({ user_id: userId, ...essayData });
 *
 *   // RLS will check: user_id = (select auth.jwt() ->> 'sub')
 *   // This works because Clerk JWT contains 'sub' claim with userId
 * }
 *
 * Example usage in a React component:
 *
 * function MyComponent() {
 *   const userId = useClerkUserId();
 *   const getToken = useSupabaseToken();
 *
 *   const handleSave = async () => {
 *     if (!userId) {
 *       alert('Please sign in to save');
 *       return;
 *     }
 *
 *     await saveEssay(userId, essayData);
 *   };
 * }
 */
