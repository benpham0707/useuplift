import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AcademicPathStep } from './steps/AcademicPathStep';
import { AcademicDetailsStep } from './steps/AcademicDetailsStep';
import { InterestsStep } from './steps/InterestsStep';
import { OnboardingComplete } from './OnboardingComplete';
import { useOnboardingForm } from '@/hooks/useOnboardingForm';
import { OnboardingFormData, AcademicPath } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface OnboardingFlowProps {
  initialData: OnboardingFormData;
  initialStep: number;
}

export const OnboardingFlow = ({ initialData, initialStep }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const {
    formData,
    currentStep,
    isSaving,
    updateFormData,
    completeOnboarding,
    nextStep,
    previousStep,
  } = useOnboardingForm({ ...initialData, current_onboarding_step: initialStep });

  const [showCompletion, setShowCompletion] = useState(false);

  const handleAcademicPathSelect = async (path: AcademicPath) => {
    // Clear path-specific fields when path changes
    const clearedData: Partial<OnboardingFormData> = {
      academic_path: path,
      school_name: undefined,
      graduation_year: undefined,
      gpa_range: undefined,
      major: undefined,
      has_test_scores: undefined,
      test_score_range: undefined,
      highest_education: undefined,
      years_experience: undefined,
      current_field: undefined,
      current_activities: [],
      college_plans: undefined,
    };
    await updateFormData(clearedData);
  };

  const handleContinueStep1 = async () => {
    if (!formData.first_name || !formData.academic_path) return;
    await nextStep({ first_name: formData.first_name, academic_path: formData.academic_path });
  };

  const handleContinueStep2 = async () => {
    await nextStep();
  };

  const handleCompleteStep3 = async () => {
    if (!formData.interest_areas || formData.interest_areas.length < 3) return;

    const result = await completeOnboarding();
    if (result.success) {
      setShowCompletion(true);
    }
  };

  const handleCompleteOnboarding = () => {
    navigate('/dashboard');
  };

  // Determine if continue button should be disabled
  const isContinueDisabled = () => {
    if (currentStep === 1) {
      return !formData.first_name || !formData.academic_path;
    }

    if (currentStep === 2) {
      const path = formData.academic_path;
      if (path === 'high_school') {
        return !formData.school_name || !formData.graduation_year || !formData.gpa_range;
      }
      if (path === 'college') {
        return !formData.school_name || !formData.graduation_year || !formData.major;
      }
      if (path === 'professional') {
        return !formData.highest_education || !formData.years_experience || !formData.current_field;
      }
      if (path === 'gap_year') {
        return !formData.current_activities?.length || !formData.college_plans;
      }
      return false;
    }

    if (currentStep === 3) {
      return !formData.interest_areas || formData.interest_areas.length < 3;
    }

    return false;
  };

  if (showCompletion) {
    return <OnboardingComplete onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={previousStep}
                disabled={isSaving}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {currentStep === 1 && <div />}

            {/* Step Dots */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    step === currentStep
                      ? 'w-8 bg-primary'
                      : step < currentStep
                      ? 'w-2 bg-primary'
                      : 'w-2 bg-muted'
                  )}
                  aria-label={`Step ${step} ${
                    step === currentStep ? 'current' : step < currentStep ? 'completed' : 'upcoming'
                  }`}
                />
              ))}
            </div>

            {/* Step Counter */}
            <div className="text-sm text-muted-foreground font-medium min-w-[60px] text-right">
              {currentStep} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <AcademicPathStep
                  firstName={formData.first_name}
                  selectedPath={formData.academic_path}
                  onNameChange={(name) => updateFormData({ first_name: name })}
                  onSelect={handleAcademicPathSelect}
                />
              )}

              {currentStep === 2 && formData.academic_path && (
                <AcademicDetailsStep
                  academicPath={formData.academic_path}
                  formData={formData}
                  onChange={updateFormData}
                />
              )}

              {currentStep === 3 && (
                <InterestsStep
                  selectedInterests={formData.interest_areas || []}
                  onChange={interests => updateFormData({ interest_areas: interests })}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            onClick={
              currentStep === 1
                ? handleContinueStep1
                : currentStep === 2
                ? handleContinueStep2
                : handleCompleteStep3
            }
            disabled={isContinueDisabled() || isSaving}
            size="lg"
            className="w-full max-w-md mx-auto block"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === 3 ? (
              'Complete'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
