import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { loadPIQEssay } from '@/services/piqWorkshop/piqDatabaseService';
import { UC_PIQ_PROMPTS } from '@/components/portfolio/piq/workshop/PIQPromptSelector';
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
 * Prefetches adjacent PIQ prompts for instant navigation.
 */
export function usePIQEssay(userId: string | null, promptId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

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

      const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === promptId);
      if (!selectedPrompt) {
        throw new Error(`Invalid prompt ID: ${promptId}`);
      }

      const result = await loadPIQEssay(
        token,
        userId,
        promptId,
        selectedPrompt.prompt
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

  // Prefetch adjacent PIQ prompts for instant navigation
  const prefetchAdjacentPIQs = async () => {
    if (!userId) return;

    const currentIndex = UC_PIQ_PROMPTS.findIndex(p => p.id === promptId);
    if (currentIndex === -1) return;

    const adjacentPromptIds: string[] = [];
    
    // Previous prompt
    if (currentIndex > 0) {
      adjacentPromptIds.push(UC_PIQ_PROMPTS[currentIndex - 1].id);
    }
    
    // Next prompt
    if (currentIndex < UC_PIQ_PROMPTS.length - 1) {
      adjacentPromptIds.push(UC_PIQ_PROMPTS[currentIndex + 1].id);
    }

    // Prefetch in parallel
    await Promise.all(
      adjacentPromptIds.map(adjPromptId =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.piqEssay(userId, adjPromptId),
          queryFn: async () => {
            const token = await getToken({ template: 'supabase' });
            if (!token) return { essay: null, analysis: null };

            const prompt = UC_PIQ_PROMPTS.find(p => p.id === adjPromptId);
            if (!prompt) return { essay: null, analysis: null };

            const result = await loadPIQEssay(token, userId, adjPromptId, prompt.prompt);
            return {
              essay: result.essay || null,
              analysis: result.analysis || null,
            };
          },
        })
      )
    );
  };

  return {
    ...query,
    prefetchAdjacentPIQs,
  };
}

