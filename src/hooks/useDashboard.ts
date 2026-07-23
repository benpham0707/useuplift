/**
 * Dashboard Data Hooks
 *
 * Custom React hooks for fetching and managing dashboard data
 * Uses tanstack-query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/safeClient';
import {
  DailyQuests,
  UserStreak,
  CharacterStats,
  CharacterTitle,
  DashboardEvent,
  PortfolioSuggestion,
  WritingProgress,
  Quest,
  QuestTool,
  calculateEventUrgency,
  StatTrend
} from '@/lib/types/dashboard';

// Default quests template
const DEFAULT_QUESTS: Omit<Quest, 'id'>[] = [
  {
    title: 'Write a Journal Entry',
    description: 'Reflect on your goals and recent experiences',
    tool: QuestTool.Journal,
    completed: false,
    route: '/journal'
  },
  {
    title: 'Run Portfolio Scanner',
    description: 'Update your activities and see your score',
    tool: QuestTool.Scanner,
    completed: false,
    route: '/portfolio-scanner'
  },
  {
    title: 'Complete a Workshop Session',
    description: 'Work on improving your writing skills',
    tool: QuestTool.Workshop,
    completed: false,
    route: '/piq-workshop'
  },
  {
    title: 'Review PIQ Prompts',
    description: 'Explore Personal Insight Questions',
    tool: QuestTool.PIQ,
    completed: false,
    route: '/piq-workshop'
  },
  {
    title: 'Check Portfolio Insights',
    description: 'See AI-powered recommendations for improvement',
    tool: QuestTool.Insights,
    completed: false,
    route: '/portfolio-insights'
  }
];

/**
 * Hook to fetch and manage daily quests
 */
export function useDailyQuests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['daily-quests', user?.id, new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];

      try {
        // Try to get existing quests for today
        const { data: existingQuests, error: fetchError } = await supabase
          .from('daily_quests')
          .select('*')
          .eq('user_id', user.id)
          .eq('quest_date', today)
          .single();

        if (existingQuests) {
          return existingQuests as DailyQuests;
        }

        // If no quests exist for today, create them
        const newQuests: Quest[] = DEFAULT_QUESTS.map((q, index) => ({
          ...q,
          id: `quest-${index + 1}`
        }));

        const { data: created, error: createError } = await supabase
          .from('daily_quests')
          .insert({
            user_id: user.id,
            quest_date: today,
            quests: newQuests,
            completed_count: 0,
            credits_earned: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating daily quests:', createError);
          // Return mock data for testing when Supabase is unavailable
          return {
            id: 'mock-1',
            user_id: user.id,
            quest_date: today,
            quests: newQuests,
            completed_count: 0,
            credits_earned: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as DailyQuests;
        }

        return created as DailyQuests;
      } catch (error) {
        console.error('Error in daily quests query:', error);
        // Return mock data for testing
        const newQuests: Quest[] = DEFAULT_QUESTS.map((q, index) => ({
          ...q,
          id: `quest-${index + 1}`
        }));
        return {
          id: 'mock-1',
          user_id: user.id,
          quest_date: today,
          quests: newQuests,
          completed_count: 0,
          credits_earned: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as DailyQuests;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      if (!user || !query.data) return;

      const updatedQuests = query.data.quests.map(q =>
        q.id === questId
          ? { ...q, completed: true, completed_at: new Date().toISOString() }
          : q
      );

      const completedCount = updatedQuests.filter(q => q.completed).length;
      const creditsEarned = completedCount >= 3 ? 10 : 0;

      const { data, error } = await supabase
        .from('daily_quests')
        .update({
          quests: updatedQuests,
          completed_count: completedCount,
          credits_earned: creditsEarned,
          updated_at: new Date().toISOString()
        })
        .eq('id', query.data.id)
        .select()
        .single();

      if (error) throw error;

      // Update streak if needed
      if (completedCount >= 3) {
        await updateUserStreak(user.id);
      }

      return data as DailyQuests;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['daily-quests', user?.id, new Date().toISOString().split('T')[0]],
        data
      );
      // Trigger credit update event if credits were earned
      if (data && data.credits_earned > 0) {
        window.dispatchEvent(new CustomEvent('credits:updated'));
      }
    }
  });

  return {
    quests: query.data?.quests || [],
    completedCount: query.data?.completed_count || 0,
    creditsEarned: query.data?.credits_earned || 0,
    loading: query.isLoading,
    error: query.error,
    completeQuest: completeQuestMutation.mutate
  };
}

/**
 * Hook to fetch user streak data
 */
export function useUserStreak() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          console.error('Error fetching streak:', error);
          // Return mock data for testing
          return {
            id: 'mock-streak',
            user_id: user.id,
            current_streak: 3,
            longest_streak: 7,
            total_credits_earned: 150,
            last_quest_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          } as UserStreak;
        }

        // If no streak exists, create one
        if (!data) {
          const { data: created, error: createError } = await supabase
            .from('user_streaks')
            .insert({
              user_id: user.id,
              current_streak: 0,
              longest_streak: 0,
              total_credits_earned: 0
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating streak:', createError);
            // Return mock data
            return {
              id: 'mock-streak',
              user_id: user.id,
              current_streak: 0,
              longest_streak: 0,
              total_credits_earned: 0,
              last_quest_date: null,
              updated_at: new Date().toISOString()
            } as UserStreak;
          }

          return created as UserStreak;
        }

        return data as UserStreak;
      } catch (error) {
        console.error('Error in streak query:', error);
        // Return mock data for testing
        return {
          id: 'mock-streak',
          user_id: user.id,
          current_streak: 3,
          longest_streak: 7,
          total_credits_earned: 150,
          last_quest_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        } as UserStreak;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    currentStreak: query.data?.current_streak || 0,
    longestStreak: query.data?.longest_streak || 0,
    totalCredits: query.data?.total_credits_earned || 0,
    lastQuestDate: query.data?.last_quest_date,
    loading: query.isLoading,
    error: query.error
  };
}

/**
 * Hook to fetch character stats
 */
export function useCharacterStats() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['character-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // First, try to update stats from real data
        try {
          const { updateCharacterStats } = await import('@/services/dashboard/characterStatsUpdater');
          const updated = await updateCharacterStats(user.id);
          if (updated) return updated;
        } catch (error) {
          console.error('Error updating character stats from real data:', error);
        }

        // Fallback to fetching existing stats
        const { data, error } = await supabase
          .from('character_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching character stats:', error);
          throw error;
        }

        // Stats will be created by seed function on first dashboard visit
        return data as CharacterStats | null;
      } catch (error) {
        console.error('Error in character stats query:', error);
        // Return mock data for testing
        return {
          id: 'mock-stats',
          user_id: user.id,
          narrative_score: 72,
          impact_score: 56,
          academics_score: 88,
          curiosity_score: 64,
          network_score: 38,
          narrative_prev: 68,
          impact_prev: 56,
          academics_prev: 85,
          curiosity_prev: 60,
          network_prev: 38,
          level: 2,
          xp: 140,
          title: 'Rising Scholar' as CharacterTitle,
          updated_at: new Date().toISOString()
        } as CharacterStats;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    stats: query.data,
    loading: query.isLoading,
    error: query.error
  };
}

/**
 * Hook to fetch dashboard events
 */
export function useDashboardEvents() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-events', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('dashboard_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('event_date', { ascending: true })
        .limit(7);

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      // Calculate urgency for each event
      const eventsWithUrgency = (data || []).map(event => ({
        ...event,
        urgency: calculateEventUrgency(event.event_date)
      }));

      return eventsWithUrgency as DashboardEvent[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    events: query.data || [],
    loading: query.isLoading,
    error: query.error
  };
}

/**
 * Hook to fetch portfolio suggestions
 */
export function usePortfolioSuggestions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['portfolio-suggestions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('portfolio_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }

      return (data || []) as PortfolioSuggestion[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('portfolio_suggestions')
        .update({ is_dismissed: true })
        .eq('id', suggestionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-suggestions', user?.id] });
    }
  });

  const queryClient = useQueryClient();

  return {
    suggestions: query.data || [],
    loading: query.isLoading,
    error: query.error,
    dismissSuggestion: dismissSuggestionMutation.mutate
  };
}

/**
 * Hook to fetch writing progress
 */
export function useWritingProgress() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['writing-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check for existing essay assessment data
      const { data: assessments, error } = await supabase
        .from('essay_analysis_reports')
        .select('essay_quality_index, created_at, essays!inner(user_id)')
        .eq('essays.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Error fetching writing progress:', error);
        return null;
      }

      if (!assessments || assessments.length === 0) {
        return null;
      }

      const currentScore = Number(assessments[0]?.essay_quality_index ?? 0) / 10;
      const previousScore = Number(assessments[1]?.essay_quality_index ?? currentScore * 10) / 10;

      // Default target score (can be customized based on school selection later)
      const targetScore = 8.5;
      const gap = Math.max(0, targetScore - currentScore);

      let trend: StatTrend = StatTrend.Stable;
      if (currentScore > previousScore) trend = StatTrend.Up;
      else if (currentScore < previousScore) trend = StatTrend.Down;

      const progress: WritingProgress = {
        current_score: currentScore,
        target_score: targetScore,
        gap,
        trend,
        last_updated: assessments[0]?.created_at || new Date().toISOString()
      };

      return progress;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    progress: query.data,
    loading: query.isLoading,
    error: query.error
  };
}

/**
 * Helper function to update user streak
 */
async function updateUserStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: streak, error: fetchError } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !streak) return;

  let newCurrentStreak = streak.current_streak;
  const lastQuestDate = streak.last_quest_date;

  if (lastQuestDate) {
    const lastDate = new Date(lastQuestDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Yesterday - continue streak
      newCurrentStreak++;
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      newCurrentStreak = 1;
    }
    // If diffDays === 0 (today), no change needed
  } else {
    // First quest completion
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_quest_date: today,
      total_credits_earned: streak.total_credits_earned + 10,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}
