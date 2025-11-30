import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import { Check, Zap, Sparkles, GraduationCap, BookOpen, HelpCircle, Loader2 } from 'lucide-react';
import GradientZap from '@/components/ui/GradientZap';
import Navigation from '@/components/Navigation';

const Pricing = () => {
  const { user, loading } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [payAsYouGoCredits, setPayAsYouGoCredits] = useState([50]);

  useEffect(() => {
    if (loading) return;
    
    const loadProfile = async () => {
      if (!user) return;
      
      // Cast result to any to handle 'credits' column
      const { data } = await supabase
        .from('profiles')
        .select('id, credits, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle() as { data: any, error: any };
      
      if (data) {
        setCredits(data.credits ?? 0);
        setSubscriptionStatus(data.subscription_status);
      }
    };

    loadProfile();
  }, [user, loading]);

  const handleCheckout = async (type: string, metadata?: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setProcessingType(type);
      // Use Clerk token instead of Supabase auth
      const token = await getToken();
      
      if (!token) {
        console.error('No access token found');
        navigate('/auth');
        return;
      }

      const response = await apiFetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          metadata,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Checkout failed:', errData);
        throw new Error(errData.error || 'Checkout failed');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Don't redirect on error - just log and let user try again
    } finally {
      setProcessingType(null);
    }
  };

  // Check for success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');

    if (success && user) {
        // In a real app we would verify the session ID with the backend
        // For now, we just refresh the profile
        supabase
        .from('profiles')
        .select('id, credits, subscription_status')
        .eq('user_id', user.id)
        .single()
        .then(({ data }: any) => {
            if (data) {
                setCredits(data.credits ?? 0);
                setSubscriptionStatus(data.subscription_status);
                // Notify other components (like Navigation) that credits have changed
                window.dispatchEvent(new CustomEvent('credits:updated'));
            }
        });
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  // LAUNCH SALE: 50% off - was $10 per 50 credits, now $5
  const payAsYouGoPrice = (payAsYouGoCredits[0] / 50) * 5;
  const payAsYouGoOriginalPrice = (payAsYouGoCredits[0] / 50) * 10;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-16">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
            <span className="text-red-500 font-bold text-sm">LAUNCH SALE</span>
            <span className="text-red-600 font-extrabold text-sm">50% OFF EVERYTHING</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Invest in Your Future
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your journey. From a single essay analysis to full UC PIQ support.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annually <span className="text-green-600 text-xs font-bold ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Starter Tier */}
          <Card className="relative border-border shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfect for trying it out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get 10 free credits when you create a new account. Enough for 2 full essay analyses to see how our PIQ Workshop works.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>10 Credits on signup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>2 Full PIQ Analyses (5 credits each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>11-Dimension Rubric Feedback</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => user ? navigate('/') : navigate('/auth')}
              >
                {user ? 'Go to Dashboard' : 'Get Started for Free'}
              </Button>
            </CardFooter>
          </Card>

           {/* Pro Tier */}
           <Card className={`relative border-2 ${subscriptionStatus === 'active' ? 'border-primary/50 bg-primary/5' : 'border-primary shadow-xl'} transform md:-translate-y-4 h-full flex flex-col z-10`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Pro
                <Sparkles className="h-5 w-5 text-primary fill-primary/20" />
              </CardTitle>
              <CardDescription>Complete application support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl text-muted-foreground line-through">
                    {billingInterval === 'monthly' ? '$20' : '$16'}
                </span>
                <span className="text-5xl font-bold text-red-500">
                    {billingInterval === 'monthly' ? '$10' : '$8'}
                </span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              {billingInterval === 'yearly' && (
                <p className="text-xs text-green-600 font-medium -mt-4">
                  Billed <span className="line-through">$192</span> $96 yearly (one-time payment)
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Perfect for all 8 UC PIQs. 100 credits gives you 20 full analyses or unlimited AI coaching sessions.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">100 Credits per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>20 PIQ Analyses (5 credits each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>AI Writing Coach (1 credit/message)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>11-Dimension Rubric Analysis</span>
                </li>
                 <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Rollover unused credits</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleCheckout(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly')}
                disabled={processingType !== null || subscriptionStatus === 'active'}
              >
                {(processingType === 'pro_monthly' || processingType === 'pro_yearly') ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : subscriptionStatus === 'active' ? 'Current Plan' : billingInterval === 'monthly' ? 'Subscribe Monthly' : 'Subscribe Annually'}
              </Button>
            </CardFooter>
          </Card>

           {/* Pay As You Go Tier */}
           <Card className="relative border-border shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Pay As You Go</CardTitle>
              <CardDescription>Flexible top-ups anytime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl text-muted-foreground line-through">${payAsYouGoOriginalPrice}</span>
                <span className="text-4xl font-bold text-red-500">${payAsYouGoPrice}</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Credits</span>
                        <span className="text-primary">{payAsYouGoCredits[0]}</span>
                    </div>
                    <Slider
                        value={payAsYouGoCredits}
                        onValueChange={setPayAsYouGoCredits}
                        min={50}
                        max={500}
                        step={50}
                        className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50</span>
                        <span>500</span>
                    </div>
                </div>
                
                <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>What can you do?</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {payAsYouGoCredits[0]} credits = {Math.floor(payAsYouGoCredits[0] / 5)} PIQ analyses or {payAsYouGoCredits[0]} AI coach messages. Mix and match as needed!
                    </p>
                </div>
              </div>

              <ul className="space-y-3 text-sm pt-2">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Never expires</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Use on any tool</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Instant access</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleCheckout(`addon_${payAsYouGoCredits[0]}`)}
                disabled={processingType !== null}
              >
                {processingType?.startsWith('addon_') ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  `Buy ${payAsYouGoCredits[0]} Credits`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12 border-t">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">11-Dimension Analysis</h3>
                <p className="text-sm text-muted-foreground">Deep rubric-based feedback on narrative quality, voice, and impact.</p>
            </div>
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">PIQ Workshop</h3>
                <p className="text-sm text-muted-foreground">Craft all 8 UC Personal Insight Questions with surgical precision.</p>
            </div>
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">AI Writing Coach</h3>
                <p className="text-sm text-muted-foreground">Get personalized guidance to strengthen your essays in real-time.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
