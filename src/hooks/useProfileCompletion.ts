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
 * Checks 8 sections mapped to actual database tables (per DASHBOARD_PROFILE_BUILDER.md PRD):
 * 1. Quick Start (profiles.onboarding_completed) - Weight: 0.10
 * 2. Activities & Experience (experiences_activities) - Weight: 0.25
 * 3. Academic Details (academic_journey) - Weight: 0.20
 * 4. Goals & Aspirations (goals_aspirations) - Weight: 0.15
 * 5. Identity & Demographics (personal_information) - Weight: 0.10
 * 6. Family Context (family_responsibilities) - Weight: 0.05
 * 7. Support Network (support_network) - Weight: 0.05
 * 8. Personal Growth (personal_growth) - Weight: 0.10
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
          .select('id, onboarding_completed, first_name')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch all canonical tables
        const [
          { data: experiences },
          { data: academic },
          { data: goals },
          { data: personalInfo },
          { data: family },
          { data: support },
          { data: growth }
        ] = await Promise.all([
          supabase
            .from('experiences_activities')
            .select('work_experiences, volunteer_service, extracurriculars, personal_projects, leadership_roles, academic_honors, formal_recognition')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('academic_journey')
            .select('gpa')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('goals_aspirations')
            .select('intended_major, career_interests')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('personal_information')
            .select('first_name, last_name')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('family_responsibilities')
            .select('id')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('support_network')
            .select('id')
            .eq('profile_id', profile.id)
            .maybeSingle(),
          supabase
            .from('personal_growth')
            .select('meaningful_experiences')
            .eq('profile_id', profile.id)
            .maybeSingle()
        ]);

        // Helper: count total entries across all activity arrays
        const countActivityEntries = (exp: typeof experiences) => {
          if (!exp) return 0;
          let total = 0;
          const arrays = [
            exp.work_experiences,
            exp.volunteer_service,
            exp.extracurriculars,
            exp.personal_projects,
            exp.leadership_roles,
            exp.academic_honors,
            exp.formal_recognition
          ];
          arrays.forEach(arr => {
            if (Array.isArray(arr)) total += arr.length;
          });
          return total;
        };

        // Check each section's completion status per PRD criteria
        const sectionsData: ProfileSection[] = [
          {
            key: 'quick_start',
            label: 'Quick Start',
            isComplete: !!(profile?.onboarding_completed === true),
            weight: 10, // 0.10 * 100
            description: 'Complete your basic profile to unlock personalized recommendations',
            route: '/onboarding'
          },
          {
            key: 'activities',
            label: 'Activities & Experience',
            isComplete: countActivityEntries(experiences) >= 2,
            weight: 25, // 0.25 * 100
            description: 'Add your activities to unlock portfolio analysis',
            route: '/dashboard' // Opens drawer, no navigation
          },
          {
            key: 'academic_details',
            label: 'Academic Details',
            isComplete: !!(academic && academic.gpa !== null && academic.gpa !== undefined),
            weight: 20, // 0.20 * 100
            description: 'Complete your academic profile for personalized school recommendations',
            route: '/dashboard'
          },
          {
            key: 'goals_aspirations',
            label: 'Goals & Aspirations',
            isComplete: !!(
              goals &&
              (goals.intended_major || (Array.isArray(goals.career_interests) && goals.career_interests.length > 0))
            ),
            weight: 15, // 0.15 * 100
            description: 'Define your goals to get targeted college matches',
            route: '/dashboard'
          },
          {
            key: 'identity_demographics',
            label: 'Identity & Demographics',
            isComplete: !!(personalInfo && personalInfo.first_name && personalInfo.last_name),
            weight: 10, // 0.10 * 100
            description: 'Complete your personal information',
            route: '/dashboard'
          },
          {
            key: 'family_context',
            label: 'Family Context',
            isComplete: !!(family), // Row exists
            weight: 5, // 0.05 * 100
            description: 'Share your family context and responsibilities',
            route: '/dashboard'
          },
          {
            key: 'support_network',
            label: 'Support Network',
            isComplete: !!(support), // Row exists
            weight: 5, // 0.05 * 100
            description: 'Add your support network',
            route: '/dashboard'
          },
          {
            key: 'personal_growth',
            label: 'Personal Growth',
            isComplete: !!(
              growth &&
              growth.meaningful_experiences &&
              typeof growth.meaningful_experiences === 'object' &&
              Object.keys(growth.meaningful_experiences).length > 0
            ),
            weight: 10, // 0.10 * 100
            description: 'Reflect on your personal growth journey',
            route: '/dashboard'
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

  // Find next incomplete section in priority order (activities → academics → goals → identity → family → support → growth)
  // Skip quick_start since they're already on dashboard
  const priorityOrder = [
    'activities',
    'academic_details',
    'goals_aspirations',
    'identity_demographics',
    'family_context',
    'support_network',
    'personal_growth'
  ];

  const nextSection = priorityOrder
    .map(key => sections.find(s => s.key === key))
    .filter((s): s is ProfileSection => s !== undefined && !s.isComplete)[0] || null;

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
