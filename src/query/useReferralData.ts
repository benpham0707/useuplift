import { useQuery } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { queryKeys } from './queryKeys';
import { apiFetch } from '@/lib/utils';

export interface ReferralStats {
  code: string;
  shareLink: string;
  stats: {
    totalReferrals: number;
    signupBonuses: number;
    purchaseBonuses: number;
    totalCreditsEarned: number;
  };
}

/**
 * Hook to load user referral data (code, link, stats).
 * Cached for instant revisits.
 */
export function useReferralData(userId: string | null) {
  const { getToken } = useClerkAuth();

  return useQuery({
    queryKey: queryKeys.referralMe(userId || 'anonymous'),
    queryFn: async (): Promise<ReferralStats> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await apiFetch('/api/v1/referrals/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to load referral data';

        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned invalid response format');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes - referral stats don't change often
    retry: 2,
  });
}

