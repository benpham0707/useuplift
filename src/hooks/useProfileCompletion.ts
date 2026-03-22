import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileSection {
  key: string;
  label: string;
  isComplete: boolean;
  weight: number;
  description: string;
  route: string;
}

export interface ProfileCompletion {
  percentage: number;
  sections: ProfileSection[];
  nextSection: ProfileSection | null;
  isFullyComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to calculate profile completion based on database state
 *
 * Checks 6 sections mapped to actual database tables:
 * 1. Quick Start (profiles table - onboarding fields)
 * 2. Activities (experiences_activities table)
 * 3. Academic Details (academic_journey table)
 * 4. Interest Deep-Dive (profiles.interest_areas)
 * 5. Goals & Constraints (goals_aspirations table)
 * 6. Personality & Work Style (personal_growth + family_responsibilities tables)
 */
export function useProfileCompletion(): ProfileCompletion {
  const { user, loading: authLoading } = useAuth();
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (authLoading || !user) {
        setIsLoading(true);
        return;
      }

      try {
        setError(null);

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, academic_path, interest_areas, graduation_year, first_name')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch related tables
        const [
          { data: experiences },
          { data: academic },
          { data: goals },
          { data: growth },
          { data: responsibilities }
        ] = await Promise.all([
          supabase
            .from('experiences_activities')
            .select('work_experiences, volunteer_service, extracurriculars, personal_projects')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('academic_journey')
            .select('current_school, gpa, standardized_tests, course_history')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('goals_aspirations')
            .select('intended_major, career_interests, college_environment')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('personal_growth')
            .select('meaningful_experiences, additional_context')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('family_responsibilities')
            .select('responsibilities, hours_per_week')
            .eq('profile_id', profile.id)
            .maybeSingle()
        ]);

        // Check each section's completion status
        const sectionsData: ProfileSection[] = [
          {
            key: 'quick_start',
            label: 'Quick Start',
            isComplete: !!(
              profile?.academic_path &&
              profile?.interest_areas?.length >= 3 &&
              profile?.graduation_year
            ),
            weight: 20,
            description: 'Complete your basic profile to unlock personalized recommendations',
            route: '/onboarding'
          },
          {
            key: 'activities',
            label: 'Activities & Experience',
            isComplete: !!(
              experiences &&
              (
                (Array.isArray(experiences.work_experiences) && experiences.work_experiences.length >= 2) ||
                (Array.isArray(experiences.volunteer_service) && experiences.volunteer_service.length >= 2) ||
                (Array.isArray(experiences.extracurriculars) && experiences.extracurriculars.length >= 2) ||
                (Array.isArray(experiences.personal_projects) && experiences.personal_projects.length >= 2)
              )
            ),
            weight: 20,
            description: 'Add your activities to unlock portfolio analysis',
            route: '/dashboard/scanner'
          },
          {
            key: 'academic_details',
            label: 'Academic Details',
            isComplete: !!(
              academic &&
              academic.current_school &&
              academic.gpa
            ),
            weight: 15,
            description: 'Complete your academic profile for personalized school recommendations',
            route: '/dashboard/scanner'
          },
          {
            key: 'interest_deep_dive',
            label: 'Interest Deep-Dive',
            isComplete: !!(
              profile?.interest_areas &&
              profile.interest_areas.length >= 5
            ),
            weight: 15,
            description: 'Explore your interests to discover unique project ideas',
            route: '/dashboard/scanner'
          },
          {
            key: 'goals_constraints',
            label: 'Goals & Constraints',
            isComplete: !!(
              goals &&
              goals.intended_major &&
              Array.isArray(goals.career_interests) && goals.career_interests.length > 0
            ),
            weight: 15,
            description: 'Define your goals to get targeted college matches',
            route: '/dashboard/scanner'
          },
          {
            key: 'personality_work_style',
            label: 'Personality & Work Style',
            isComplete: !!(
              (growth && Object.keys(growth.meaningful_experiences || {}).length > 0) ||
              (responsibilities && Array.isArray(responsibilities.responsibilities) && responsibilities.responsibilities.length > 0)
            ),
            weight: 15,
            description: 'Share your story to strengthen your essay themes',
            route: '/dashboard/scanner'
          }
        ];

        setSections(sectionsData);
      } catch (err) {
        console.error('[useProfileCompletion] Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile completion');
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user, authLoading]);

  // Calculate weighted completion percentage
  const percentage = sections.reduce((total, section) => {
    return total + (section.isComplete ? section.weight : 0);
  }, 0);

  // Find next incomplete section (skip quick_start since they're already on dashboard)
  const nextSection = sections
    .filter(s => s.key !== 'quick_start')
    .find(s => !s.isComplete) || null;

  const isFullyComplete = percentage === 100;

  return {
    percentage,
    sections,
    nextSection,
    isFullyComplete,
    isLoading,
    error
  };
}
