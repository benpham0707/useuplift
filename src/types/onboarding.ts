/**
 * Types for Quick-Start Onboarding Flow
 */

export type ApplicationStage = 'exploring' | 'mid_application' | 'almost_done';

export interface OnboardingFormData {
  // Minimal first-run contract. Rich application data is collected in-context.
  first_name?: string;
  application_stage?: ApplicationStage | null;

  // Metadata
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
}

export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  formData: OnboardingFormData;
  loading: boolean;
}
