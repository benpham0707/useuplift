/**
 * usePortfolioData.ts
 * 
 * Centralized React Query hooks for all portfolio wizard tables.
 * Each wizard can use these hooks to load/save data with proper caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { queryKeys } from './queryKeys';
import { useProfileId } from './useProfileId';

// ========================================
// Personal Information
// ========================================

export function usePersonalInformation() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.personalInformation(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('personal_information')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('personal_information')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('personal_information')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('personal_information')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personalInformation(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Academic Journey
// ========================================

export function useAcademicJourney() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.academicJourney(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('academic_journey')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('academic_journey')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('academic_journey')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('academic_journey')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicJourney(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Experiences & Activities
// ========================================

export function useExperiencesActivities() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.experiencesActivities(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('experiences_activities')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('experiences_activities')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('experiences_activities')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('experiences_activities')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiencesActivities(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Family Responsibilities
// ========================================

export function useFamilyResponsibilities() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.familyResponsibilities(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('family_responsibilities')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('family_responsibilities')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('family_responsibilities')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('family_responsibilities')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyResponsibilities(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Goals & Aspirations
// ========================================

export function useGoalsAspirations() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.goalsAspirations(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('goals_aspirations')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('goals_aspirations')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('goals_aspirations')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('goals_aspirations')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goalsAspirations(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Support Network
// ========================================

export function useSupportNetwork() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.supportNetwork(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('support_network')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('support_network')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('support_network')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('support_network')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supportNetwork(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Personal Growth
// ========================================

export function usePersonalGrowth() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.personalGrowth(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');
      
      const { data, error } = await supabase
        .from('personal_growth')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!profileId) throw new Error('Profile ID not found');

      const { data: existing } = await supabase
        .from('personal_growth')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('personal_growth')
          .update(updates)
          .eq('profile_id', profileId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('personal_growth')
          .insert({ ...updates, profile_id: profileId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personalGrowth(profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioProgress(profileId || '') });
    },
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

// ========================================
// Portfolio Progress (for AssessmentDashboard)
// ========================================

export function usePortfolioProgress() {
  const { data: profileId, isLoading: profileLoading } = useProfileId();

  const query = useQuery({
    queryKey: queryKeys.portfolioProgress(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID not found');

      // Fetch all portfolio tables in parallel
      const [
        { data: personal },
        { data: academic },
        { data: experiences },
        { data: family },
        { data: goals },
        { data: support },
        { data: growth },
      ] = await Promise.all([
        supabase.from('personal_information').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('academic_journey').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('experiences_activities').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('family_responsibilities').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('goals_aspirations').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('support_network').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('personal_growth').select('*').eq('profile_id', profileId).maybeSingle(),
      ]);

      // Helper to check if field is filled
      const isFilled = (v: any): boolean => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return !Number.isNaN(v);
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.values(v).some((x) => isFilled(x));
        return Boolean(v);
      };

      // Calculate progress for each section
      const calculateSectionProgress = (data: any, requiredFields: string[]): number => {
        if (!data) return 0;
        const filled = requiredFields.filter(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], data);
          return isFilled(value);
        }).length;
        return Math.round((filled / requiredFields.length) * 100);
      };

      return {
        personal: calculateSectionProgress(personal, [
          'first_name', 'last_name', 'date_of_birth', 'primary_email', 'primary_phone',
          'pronouns', 'gender_identity', 'permanent_address.street', 'permanent_address.city',
          'permanent_address.state', 'permanent_address.zip', 'hispanic_latino',
          'citizenship_status', 'primary_language', 'living_situation'
        ]),
        academic: calculateSectionProgress(academic, [
          'current_school_name', 'current_grade_level', 'gpa', 'class_rank'
        ]),
        experiences: calculateSectionProgress(experiences, [
          'work_experiences', 'volunteer_experiences', 'extracurricular_activities'
        ]),
        family: calculateSectionProgress(family, [
          'family_responsibilities', 'challenging_circumstances'
        ]),
        goals: calculateSectionProgress(goals, [
          'academic_interests', 'career_goals', 'college_preferences'
        ]),
        support: calculateSectionProgress(support, [
          'educational_support', 'community_organizations'
        ]),
        growth: calculateSectionProgress(growth, [
          'personal_challenges', 'growth_experiences'
        ]),
      };
    },
    enabled: !!profileId,
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

