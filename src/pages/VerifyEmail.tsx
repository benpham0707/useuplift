import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const VerifyEmail = () => {
  const [message, setMessage] = useState('We sent a verification link. It expires in 15 minutes.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user lands via deep link, Supabase handled it; this page is a neutral waiting room
  }, []);

  const resend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const email = (await supabase.auth.getUser()).data.user?.email;
    if (!email) {
      setError('Sign in again to resend.');
      setLoading(false);
      return;
    }
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
    if (error) setError('Could not resend. Try again later.');
    else setMessage('We sent a new link. It expires in 15 minutes.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Verify your email</CardTitle>
          <CardDescription>Check your inbox for the link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className="border-primary">
              <AlertDescription className="text-primary">{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="border-destructive">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between">
            <Button onClick={resend} disabled={loading} variant="outline">Resend link</Button>
            <a href="/auth" className="text-sm underline underline-offset-4">Change email</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;


