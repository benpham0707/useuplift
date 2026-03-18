/**
 * Types for Quick-Start Onboarding Flow
 */

export type AcademicPath = 'high_school' | 'college' | 'professional' | 'gap_year';

export type GPARange = 'below_2.5' | '2.5_3.0' | '3.0_3.5' | '3.5_4.0' | '4.0_plus';

export interface InterestArea {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface OnboardingFormData {
  // Step 1: Academic Path
  academic_path?: AcademicPath;

  // Step 2: Academic Details (varies by path)
  school_name?: string;
  graduation_year?: number;
  gpa_range?: GPARange;
  major?: string;
  has_test_scores?: boolean;
  test_score_range?: string;
  highest_education?: string;
  years_experience?: string;
  current_field?: string;
  current_activities?: string[];
  college_plans?: string;

  // Step 3: Interests
  interest_areas?: string[];

  // Metadata
  current_onboarding_step?: number;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
}

export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  formData: OnboardingFormData;
  loading: boolean;
}
