import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedSupabaseClient } from '@/services/auth/getAuthenticatedSupabaseClient';
import { queryKeys } from './queryKeys';

/**
 * Shared hook that loads and caches the user's profile ID.
 * Used across portfolio wizards to avoid repeated DB lookups.
 * Returns null if user is not authenticated or profile doesn't exist.
 */
export function useProfileId() {
  return useQuery({
    queryKey: queryKeys.profileId('current'), // 'current' since we don't have userId yet
    queryFn: async () => {
      const supabase = await getAuthenticatedSupabaseClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Get profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Profile not found');
      }
      
      return profile.id as string;
    },
    staleTime: Infinity, // Profile ID never changes for a user session
    retry: 2,
  });
}

