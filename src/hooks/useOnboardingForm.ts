import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFormData } from '@/types/onboarding';
import { toast } from 'sonner';

/**
 * Hook to manage onboarding form state and auto-save to Supabase
 */
export const useOnboardingForm = (initialData: OnboardingFormData = {}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OnboardingFormData>(initialData);
  const [currentStep, setCurrentStep] = useState(initialData.current_onboarding_step || 1);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Update form data and save to database
   */
  const updateFormData = useCallback(
    async (updates: Partial<OnboardingFormData>, step?: number) => {
      if (!user) return { success: false, error: 'User not authenticated' };

      const newFormData = { ...formData, ...updates };
      const newStep = step !== undefined ? step : currentStep;

      setFormData(newFormData);
      if (step !== undefined) {
        setCurrentStep(step);
      }

      setIsSaving(true);

      try {
        // First try to update existing profile
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            ...updates,
            current_onboarding_step: newStep,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select('id')
          .maybeSingle();

        if (updateError) {
          console.error('[useOnboardingForm] Error updating profile:', updateError);
          toast.error('Failed to save progress. Please try again.');
          return { success: false, error: updateError.message };
        }

        // If update worked, we're done
        if (updateData?.id) {
          return { success: true };
        }

        // Profile doesn't exist - create it
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updates,
            current_onboarding_step: newStep,
            user_context: 'high_school_11th', // Default value (required column)
            credits: 10, // Default credits
            has_completed_assessment: false,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('[useOnboardingForm] Error creating profile:', insertError);
          toast.error('Failed to save progress. Please try again.');
          return { success: false, error: insertError.message };
        }

        return { success: true };
      } catch (err) {
        console.error('[useOnboardingForm] Unexpected error:', err);
        toast.error('An unexpected error occurred. Please try again.');
        return { success: false, error: 'Unexpected error' };
      } finally {
        setIsSaving(false);
      }
    },
    [user, formData, currentStep]
  );

  /**
   * Complete onboarding and mark as done
   */
  const completeOnboarding = useCallback(async () => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setIsSaving(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: now,
          current_onboarding_step: 3,
          updated_at: now,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('[useOnboardingForm] Error completing onboarding:', error);
        toast.error('Failed to complete onboarding. Please try again.');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[useOnboardingForm] Unexpected error:', err);
      toast.error('An unexpected error occurred. Please try again.');
      return { success: false, error: 'Unexpected error' };
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /**
   * Go to next step
   */
  const nextStep = useCallback(
    async (updates?: Partial<OnboardingFormData>) => {
      const newStep = Math.min(currentStep + 1, 3);
      const dataToSave = updates || {};
      return await updateFormData(dataToSave, newStep);
    },
    [currentStep, updateFormData]
  );

  /**
   * Go to previous step
   */
  const previousStep = useCallback(() => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    // Update database with new step
    updateFormData({}, newStep);
  }, [currentStep, updateFormData]);

  return {
    formData,
    currentStep,
    isSaving,
    updateFormData,
    completeOnboarding,
    nextStep,
    previousStep,
  };
};
