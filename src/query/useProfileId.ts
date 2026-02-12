import { useQuery } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { getAuthenticatedSupabaseClient } from '@/services/auth/getAuthenticatedSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from './queryKeys';

/**
 * Shared hook that loads and caches the user's profile ID.
 * Used across portfolio wizards to avoid repeated DB lookups.
 * Returns null if user is not authenticated or profile doesn't exist.
 */
export function useProfileId() {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();

  return useQuery({
    queryKey: queryKeys.profileId('current'),
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const supabase = getAuthenticatedSupabaseClient(token);

      // Get profile ID using Clerk user ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      return profile.id as string;
    },
    enabled: !!user,
    staleTime: Infinity, // Profile ID never changes for a user session
    retry: 2,
  });
}

