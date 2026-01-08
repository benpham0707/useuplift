import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { loadPIQEssay } from '@/services/piqWorkshop/piqDatabaseService';
import { queryKeys } from './queryKeys';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';

export interface PIQEssayData {
  essay: {
    id: string;
    draft_current: string;
    draft_original: string;
    updated_at: string;
  } | null;
  analysis: AnalysisResult | null;
}

/**
 * Hook to load PIQ essay + analysis with React Query caching.
 */
export function usePIQEssay(userId: string | null, promptId: string, promptText: string) {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.piqEssay(userId || 'anonymous', promptId),
    queryFn: async (): Promise<PIQEssayData> => {
      if (!userId) {
        return { essay: null, analysis: null };
      }

      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await loadPIQEssay(
        token,
        userId,
        promptId,
        promptText
      );

      if (!result.success) {
        // Not an error if essay doesn't exist yet - just return null
        return { essay: null, analysis: null };
      }

      return {
        essay: result.essay || null,
        analysis: result.analysis || null,
      };
    },
    enabled: !!userId, // Only run if authenticated
    staleTime: 1000 * 60 * 10, // 10 minutes - PIQ essays don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes in memory
  });

  return query;
}

