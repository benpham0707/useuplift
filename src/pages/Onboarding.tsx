import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Onboarding = () => {
  const { isComplete, currentStep, formData, loading } = useOnboardingStatus();
  const navigate = useNavigate();

  // If already completed, redirect to dashboard
  useEffect(() => {
    if (!loading && isComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [isComplete, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already complete (prevents flash before redirect)
  if (isComplete) {
    return null;
  }

  return <OnboardingFlow initialData={formData} initialStep={currentStep} />;
};

export default Onboarding;
