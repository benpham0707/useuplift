import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Route wrapper that ensures users have completed onboarding before accessing protected routes
 */
const RequireOnboarding = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isComplete, loading: onboardingLoading } = useOnboardingStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't check if still loading
    if (authLoading || onboardingLoading) return;

    // If not logged in, don't do anything (RequireVerified will handle auth redirect)
    if (!user) return;

    // If onboarding not complete and not already on onboarding page, redirect
    if (!isComplete && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, isComplete, authLoading, onboardingLoading, navigate, location.pathname]);

  // Show loading state while checking
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, let RequireVerified handle it
  if (!user) {
    return <>{children}</>;
  }

  // If onboarding not complete, don't render children (redirect is happening)
  if (!isComplete) {
    return null;
  }

  // Onboarding complete, render children
  return <>{children}</>;
};

export default RequireOnboarding;
