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
          .select('id, onboarding_completed, current_onboarding_step, application_stage')
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

        const { data: personalInformation, error: personalError } = await supabase
          .from('personal_information').select('first_name').eq('profile_id', data.id).maybeSingle();
        if (personalError) throw personalError;
        const formData: OnboardingFormData = {
          first_name: personalInformation?.first_name ?? undefined,
          application_stage: data.application_stage ?? null,
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
