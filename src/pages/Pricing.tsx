import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import { Check, CreditCard, Zap, Home } from 'lucide-react';

const Pricing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setCredits(0);
        setSubscriptionStatus(null);
      }
    };

    loadProfile();
  }, [user, loading, navigate]);

  const handleCheckout = async (type: string) => {
    try {
      setIsProcessing(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const response = await apiFetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      if (!response.ok) throw new Error('Checkout failed');
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');

    if (success && sessionId && user) {
        setIsProcessing(true);
        supabase.auth.getSession().then(({ data }) => {
            const token = data.session?.access_token;
            apiFetch('/api/v1/billing/verify-session', {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            })
            .then(res => {
                 if (res.ok) {
                      // Refresh credits
                     supabase
                    .from('profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            setCredits(0);
                            setSubscriptionStatus(null);
                        }
                    });
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                 }
            })
            .finally(() => setIsProcessing(false));
        });
    } else if (params.get('success')) {
         // Fallback if no session_id but success=true (shouldn't happen with our backend link but safe to keep)
        if (user) {
             supabase
             .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()
            .then(({ data }) => {
                if (data) {
                    setCredits(0);
                    setSubscriptionStatus(null);
                }
            });
        }
    }
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <nav className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
                Credits: <span className="font-bold text-primary">{credits ?? '...'}</span>
            </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Simple, Credit-Based Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a monthly subscription and top up whenever you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Subscription Card */}
          <Card className={`relative border-2 ${subscriptionStatus === 'active' ? 'border-primary' : 'border-border'} shadow-lg`}>
            {subscriptionStatus === 'active' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Active Plan
                </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">Monthly Plan</CardTitle>
              <CardDescription>Best value for consistent usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>100 Credits per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Rollover unused credits</span>
                </li>
                 <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleCheckout('subscription')}
                disabled={isProcessing || subscriptionStatus === 'active'}
              >
                {subscriptionStatus === 'active' ? 'Current Plan' : 'Subscribe Now'}
              </Button>
            </CardFooter>
          </Card>

           {/* Add-on 50 */}
           <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">Top Up 50</CardTitle>
              <CardDescription>One-time purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-muted-foreground">once</span>
              </div>
              <div className="flex items-center gap-2 text-primary font-medium">
                  <Zap className="h-5 w-5" />
                  <span>50 Credits</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => handleCheckout('addon_50')} disabled={isProcessing}>
                Buy 50 Credits
              </Button>
            </CardFooter>
          </Card>

           {/* Add-on 100 */}
           <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">Top Up 100</CardTitle>
              <CardDescription>One-time purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-muted-foreground">once</span>
              </div>
               <div className="flex items-center gap-2 text-primary font-medium">
                  <Zap className="h-5 w-5" />
                  <span>100 Credits</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => handleCheckout('addon_100')} disabled={isProcessing}>
                Buy 100 Credits
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

