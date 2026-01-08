import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from './queryKeys';

export interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface SettingsData {
  credits: number;
  transactions: CreditTransaction[];
}

/**
 * Hook to load user settings data (credits + transaction history).
 * Cached for instant revisits.
 */
export function useSettingsData(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.credits(userId || 'anonymous'),
    queryFn: async (): Promise<SettingsData> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Load profile with credits
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // Load recent transactions
      const { data: txns, error: txnsError } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txnsError) {
        throw txnsError;
      }

      return {
        credits: profile?.credits ?? 0,
        transactions: (txns as CreditTransaction[]) || [],
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - credits change occasionally
  });
}

