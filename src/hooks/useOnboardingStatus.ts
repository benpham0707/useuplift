import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFormData, OnboardingStatus } from '@/types/onboarding';

/**
 * Hook to check if user has completed onboarding and get current form state
 */
export const useOnboardingStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({
    isComplete: false,
    currentStep: 1,
    formData: {},
    loading: true,
  });

  useEffect(() => {
    if (authLoading || !user) {
      setStatus(prev => ({ ...prev, loading: authLoading }));
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            `onboarding_completed,
             current_onboarding_step,
             first_name,
             academic_path,
             school_name,
             graduation_year,
             gpa_range,
             major,
             has_test_scores,
             test_score_range,
             highest_education,
             years_experience,
             current_field,
             current_activities,
             college_plans,
             interest_areas`
          )
          .eq('user_id', user.id)
          .maybeSingle() as { data: any; error: any }; // Type assertion for newly added columns

        if (error) {
          console.error('[useOnboardingStatus] Error fetching status:', error);
          setStatus({
            isComplete: false,
            currentStep: 1,
            formData: {},
            loading: false,
          });
          return;
        }

        if (!data) {
          // Profile doesn't exist yet - not complete
          setStatus({
            isComplete: false,
            currentStep: 1,
            formData: {},
            loading: false,
          });
          return;
        }

        const formData: OnboardingFormData = {
          first_name: data.first_name,
          academic_path: data.academic_path,
          school_name: data.school_name,
          graduation_year: data.graduation_year,
          gpa_range: data.gpa_range,
          major: data.major,
          has_test_scores: data.has_test_scores,
          test_score_range: data.test_score_range,
          highest_education: data.highest_education,
          years_experience: data.years_experience,
          current_field: data.current_field,
          current_activities: data.current_activities || [],
          college_plans: data.college_plans,
          interest_areas: data.interest_areas || [],
          current_onboarding_step: data.current_onboarding_step,
          onboarding_completed: data.onboarding_completed,
        };

        setStatus({
          isComplete: data.onboarding_completed || false,
          currentStep: data.current_onboarding_step || 1,
          formData,
          loading: false,
        });
      } catch (err) {
        console.error('[useOnboardingStatus] Unexpected error:', err);
        setStatus({
          isComplete: false,
          currentStep: 1,
          formData: {},
          loading: false,
        });
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading]);

  return status;
};
