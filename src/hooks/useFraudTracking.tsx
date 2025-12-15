/**
 * Fraud Tracking Hook
 * Automatically tracks device fingerprints and IP addresses when users authenticate
 *
 * Features:
 * - Listens to Clerk authentication events
 * - Tracks device fingerprint on signup/signin
 * - Handles errors gracefully (never blocks users)
 * - Runs in background (non-blocking)
 */

import { useEffect, useRef } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { trackUserSession } from '@/utils/deviceFingerprint';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zclaplpkuvxkrdwsgrul.supabase.co';

export const useFraudTracking = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const hasTrackedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run when Clerk has loaded and user is signed in
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    // Check if this is a new session (user ID changed)
    const isNewSession = previousUserIdRef.current !== user.id;

    // Only track once per session
    if (hasTrackedRef.current && !isNewSession) {
      return;
    }

    // Determine if this is a signup (user created recently) or signin
    const userCreatedAt = new Date(user.createdAt!);
    const now = new Date();
    const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
    const isRecentSignup = timeSinceCreation < 60 * 1000; // Within last minute = signup

    const action = isRecentSignup ? 'signup' : 'signin';

    console.log(`[Fraud Tracking] Detected ${action} for user ${user.id}`);

    // Track device fingerprint in background
    trackDeviceFingerprint(action);

    // Mark as tracked
    hasTrackedRef.current = true;
    previousUserIdRef.current = user.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id]);

  const trackDeviceFingerprint = async (action: 'signup' | 'signin') => {
    try {
      // Get Clerk session token for Supabase
      const token = await getToken({ template: 'supabase' });

      if (!token) {
        console.warn('[Fraud Tracking] No Clerk token available');
        return;
      }

      console.log('[Fraud Tracking] Tracking device fingerprint...');

      // Track device fingerprint (non-blocking)
      await trackUserSession(action, SUPABASE_URL, token);

      console.log(`[Fraud Tracking] ✅ Successfully tracked ${action}`);
    } catch (error) {
      // Never block user flow - just log the error
      console.warn('[Fraud Tracking] Failed to track device (non-critical):', error);
    }
  };
};

/**
 * FraudTrackingProvider Component
 * Drop this component anywhere in your app to enable automatic fraud tracking
 */
export const FraudTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  useFraudTracking();
  return <>{children}</>;
};
