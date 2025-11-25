import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

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

  // Map Clerk user to a shape compatible with existing code (Supabase-like)
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    email_confirmed_at: clerkUser.primaryEmailAddress?.verification.status === 'verified' ? new Date().toISOString() : null,
    user_metadata: clerkUser.publicMetadata,
    app_metadata: clerkUser.unsafeMetadata,
  } : null;

  const loading = !isLoaded;

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

  return (
    <AuthContext.Provider value={{
      user,
      session: null,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      sendMagicLink,
      requestPasswordReset,
      updatePassword,
      signOut
    }}>
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
