import { Button } from '@/components/ui/button';
import { isPublicLaunchMode } from '@/config/launchMode';
import { Link } from 'react-router-dom';

const AUTH_DISABLED_MESSAGE =
  'Authentication is unavailable while Uplift is in development';

/**
 * Brand and auth affordances for the landing page without product navigation.
 * The controls remain visible so the launch layout stays familiar. Production
 * renders native disabled buttons; local development links to Clerk auth.
 */
const LandingHeader = () => {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <img
          src="/uplift_logo_lr.png"
          alt="Uplift Logo"
          className="h-8 w-auto object-contain"
        />

        <div className="flex items-center gap-2">
          {isPublicLaunchMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled
                title={AUTH_DISABLED_MESSAGE}
                className="disabled:opacity-60"
              >
                Sign In
              </Button>
              <Button
                type="button"
                size="sm"
                disabled
                title={AUTH_DISABLED_MESSAGE}
                className="disabled:opacity-60"
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
