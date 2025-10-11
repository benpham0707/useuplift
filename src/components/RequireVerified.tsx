import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const RequireVerified = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    const isVerified = Boolean((user as any).email_confirmed_at || user?.email_confirmed_at);
    if (!isVerified) {
      navigate('/verify-email', { state: { from: location.pathname } });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) return null;
  return <>{children}</>;
};

export default RequireVerified;


