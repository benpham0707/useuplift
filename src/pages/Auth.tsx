import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [ageBracket, setAgeBracket] = useState<'13-17' | '18+' | ''>('');
  
  const { user, signUp, signIn, signInWithGoogle, sendMagicLink, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/portfolio-scanner');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!ageBracket) {
      setError('Please select your age.');
      setLoading(false);
      return;
    }

    if (ageBracket !== '18+') {
      // Allow account creation, but inform about guardian consent soon
      setMessage('Account will require guardian consent before accessing portfolio.');
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('We sent a verification link. It expires in 15 minutes.');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/portfolio-scanner');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      setMessage('Enter your email and then request a magic link.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await sendMagicLink(email);
    if (error) {
      // Neutral copy: do not reveal existence
      setMessage('If this email exists, we sent a link. It expires in 15 minutes.');
    } else {
      setMessage('If this email exists, we sent a link. It expires in 15 minutes.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Enter your email and then request a reset link.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await requestPasswordReset(email);
    if (error) {
      setMessage('If this email exists, we sent a reset link. It expires in 15 minutes.');
    } else {
      setMessage('If this email exists, we sent a reset link. It expires in 15 minutes.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Log In</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back! Please enter your details</p>
          </div>
          <Card className="shadow-none border-0">
            <CardContent className="p-0">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={handleForgotPassword} className="text-sm text-muted-foreground underline underline-offset-4">forgot password?</button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Log in
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or Continue With</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button type="button" variant="outline" onClick={handleGoogle} disabled={loading}>Google</Button>
                      <Button type="button" variant="outline" onClick={handleMagicLink} disabled={loading}>Email magic link</Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-age">Your age</Label>
                      <select id="signup-age" className="w-full border rounded-md h-9 px-3 bg-background" value={ageBracket} onChange={(e) => setAgeBracket(e.target.value as any)} disabled={loading} required>
                        <option value="">Select age</option>
                        <option value="13-17">13–17</option>
                        <option value="18+">18+</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create account
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or Continue With</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button type="button" variant="outline" onClick={handleGoogle} disabled={loading}>Google</Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert className="mt-4 border-destructive">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              {message && (
                <Alert className="mt-4 border-primary">
                  <AlertDescription className="text-primary">{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="hidden md:block relative">
          <img src={"/src/assets/hero-journey-paths.jpg"} alt="Welcome" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/60 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Auth;