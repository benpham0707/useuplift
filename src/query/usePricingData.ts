import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

export interface PricingData {
  credits: number;
  referralDiscountActive: boolean;
}

/**
 * Hook to load user pricing data (credits + referral discount status).
 * Cached for instant revisits.
 */
export function usePricingData(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile(userId || 'anonymous'),
    queryFn: async (): Promise<PricingData> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('credits, referral_discount_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return {
        credits: data?.credits ?? 0,
        referralDiscountActive: data?.referral_discount_active ?? false,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Helper to invalidate after successful purchase
  const invalidateAfterPurchase = () => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.credits(userId),
      });
    }
  };

  return {
    ...query,
    invalidateAfterPurchase,
  };
}

