/**
 * Clerk Configuration Helper
 *
 * Provides environment-aware Clerk configuration with helpful
 * error messages for development setup.
 */

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Helper to detect if using production keys locally
export function isUsingProductionKeysLocally(): boolean {
  const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
  const isProductionKey = CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_');

  return isDevelopment && isProductionKey;
}

// Helper to check if Clerk is properly configured
export function checkClerkConfiguration(): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  if (!CLERK_PUBLISHABLE_KEY) {
    return {
      isValid: false,
      error: 'Clerk publishable key is missing',
      suggestion: 'Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file'
    };
  }

  if (isUsingProductionKeysLocally()) {
    return {
      isValid: false,
      error: 'Using production Clerk keys in development',
      suggestion: `You're using production Clerk keys (pk_live_...) on localhost.
        This won't work because production Clerk only allows your production domain.
        Please create a development Clerk app and use test keys (pk_test_...).
        See LOCAL_DEVELOPMENT_SETUP.md for instructions.`
    };
  }

  const isProduction = import.meta.env.MODE === 'production';
  const isDevelopmentKey = CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_');

  if (isProduction && isDevelopmentKey) {
    return {
      isValid: false,
      error: 'Using development Clerk keys in production',
      suggestion: 'Please use production keys (pk_live_...) for production deployment'
    };
  }

  return { isValid: true };
}

// Log configuration status in development
if (import.meta.env.MODE === 'development') {
  const config = checkClerkConfiguration();

  if (!config.isValid) {
    console.error(`[Clerk Config Error] ${config.error}`);
    if (config.suggestion) {
      console.info(`[Clerk Config] ${config.suggestion}`);
    }
    console.info('[Clerk Config] See LOCAL_DEVELOPMENT_SETUP.md for detailed setup instructions');
  } else {
    console.info('[Clerk Config] ✅ Configuration is valid for development');
  }
}

export { CLERK_PUBLISHABLE_KEY };