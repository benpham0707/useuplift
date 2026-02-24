import { createContext, useContext, useMemo, ReactNode, useEffect } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email?: string, password?: string) => Promise<{ error: any }>;
  signIn: (email?: string, password?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();

  // Map Clerk user to a shape compatible with existing code (Supabase-like)
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    email_confirmed_at: clerkUser.primaryEmailAddress?.verification.status === 'verified' ? new Date().toISOString() : null,
    user_metadata: clerkUser.publicMetadata,
    app_metadata: clerkUser.unsafeMetadata,
  } : null;
    
  const loading = !isLoaded;

  // Auto-claim referral code after login
  useEffect(() => {
    if (!user || loading) return;

    const claimPendingReferral = async () => {
      const pendingCode = localStorage.getItem('pendingReferralCode');
      if (!pendingCode) return;

      try {
        // Get Clerk token for authentication
        const token = await getToken();

        if (!token) return;

        // Use VITE_API_BASE if set (production), otherwise use relative path (development proxy)
        const apiBase = import.meta.env.VITE_API_BASE || '';
        const apiUrl = `${apiBase}/api/v1/referrals/claim`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: pendingCode }),
        });

        if (response.ok) {
          // Successfully claimed - remove pending code and refresh credits
          localStorage.removeItem('pendingReferralCode');
          window.dispatchEvent(new CustomEvent('credits:updated'));
        } else {
          const error = await response.json().catch(() => ({}));
          // Only remove if already claimed or invalid
          if (error.alreadyClaimed || response.status === 404) {
            localStorage.removeItem('pendingReferralCode');
          }
        }
      } catch (error) {
        console.error('Failed to claim referral:', error);
      }
    };

    claimPendingReferral();
  }, [user, loading]);

  // Shim methods to use Clerk UI
  const signUp = async () => {
    openSignUp();
    return { error: null };
  };

  const signIn = async () => {
    openSignIn();
    return { error: null };
  };

  const signInWithGoogle = async () => {
    // Clerk handles this in the modal
    openSignIn();
    return { error: null };
  };

  const sendMagicLink = async () => {
    openSignIn();
    return { error: null };
  };

  const requestPasswordReset = async () => {
    openSignIn(); // Clerk handles reset flow
    return { error: null };
  };

  const updatePassword = async () => {
    // Clerk manages profile
    return { error: null };
  };

  const signOut = async () => {
    await clerkSignOut();
    return { error: null };
  };

  const contextValue = useMemo(() => ({
    user,
    session: null,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    sendMagicLink,
    requestPasswordReset,
    updatePassword,
    signOut,
  }), [user, loading, signUp, signIn, signInWithGoogle, sendMagicLink, requestPasswordReset, updatePassword, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
