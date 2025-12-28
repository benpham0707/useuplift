import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import { Check, Zap, Sparkles, GraduationCap, BookOpen, HelpCircle, Loader2 } from 'lucide-react';
import GradientZap from '@/components/ui/GradientZap';
import Navigation from '@/components/Navigation';
import { ReferralCard } from '@/components/ReferralCard';
import { usePricingData } from '@/query/usePricingData';

const Pricing = () => {
  const { user, loading } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [processingType, setProcessingType] = useState<string | null>(null);
  const [customCredits, setCustomCredits] = useState([50]);

  // Load pricing data from React Query cache
  const {
    data: pricingData,
    invalidateAfterPurchase,
  } = usePricingData(user?.id || null);

  const credits = pricingData?.credits ?? 0;
  const referralDiscountActive = pricingData?.referralDiscountActive ?? false;

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
        throw new Error(errData.error || 'Checkout failed');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      // Don't redirect on error - just log and let user try again
    } finally {
      setProcessingType(null);
    }
  };

  // Check for success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');

    if (success && user) {
      // Invalidate React Query cache to refetch updated credits
      invalidateAfterPurchase();
      // Notify other components (like Navigation) that credits have changed
      window.dispatchEvent(new CustomEvent('credits:updated'));
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, invalidateAfterPurchase]);

  // Custom pack: $13 per 50 credits
  const customPrice = (customCredits[0] / 50) * 13;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Get More Credits
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the credit pack that fits your needs. All packs include full access to our PIQ Workshop and AI coaching.
          </p>
          
          {referralDiscountActive && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-200 font-medium text-sm">
                Referral discount active: 10% off all packs!
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Free Tier */}
          <Card className="relative border-border shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Free Starter</CardTitle>
              <CardDescription>Try before you buy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get 10 free credits when you create an account{referralDiscountActive ? ' (+10 referral bonus = 20 total!)' : ''}. Enough for 2 full PIQ analyses.
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
                  <span>12-Dimension Rubric Feedback</span>
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

           {/* Starter Pack */}
           <Card className={`relative border-2 ${!referralDiscountActive ? 'border-primary shadow-xl' : 'border-border'} h-full flex flex-col`}>
            {!referralDiscountActive && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Starter Pack
              </CardTitle>
              <CardDescription>Perfect for 8 UC PIQs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${referralDiscountActive ? '72' : '80'}</span>
              </div>
              {referralDiscountActive && (
                <p className="text-xs text-green-600 font-medium -mt-4">
                  <span className="line-through">$80</span> 10% referral discount applied!
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                400 credits = 80 full PIQ analyses or 400 AI coach messages. Perfect for all your UC essays!
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">400 Credits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>80 PIQ Analyses (5 credits each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>AI Writing Coach (1 credit/message)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>12-Dimension Rubric Analysis</span>
                </li>
                 <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Never expires</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleCheckout('starter_pack')}
                disabled={processingType !== null}
              >
                {processingType === 'starter_pack' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Buy Starter Pack'
                )}
              </Button>
            </CardFooter>
          </Card>

           {/* Full Season Pack */}
           <Card className={`relative border-2 ${referralDiscountActive ? 'border-primary shadow-xl' : 'border-border'} h-full flex flex-col`}>
            {referralDiscountActive && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary">
                  Best Value
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Full Season Pack
                <Sparkles className="h-5 w-5 text-primary fill-primary/20" />
              </CardTitle>
              <CardDescription>Complete application support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${referralDiscountActive ? '180' : '200'}</span>
              </div>
              {referralDiscountActive && (
                <p className="text-xs text-green-600 font-medium -mt-4">
                  <span className="line-through">$200</span> 10% referral discount applied!
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                1200 credits = 240 PIQ analyses or 1200 AI coach messages. Everything you need for the entire application season.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">1200 Credits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>240 PIQ Analyses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Unlimited AI Coach Sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>12-Dimension Rubric Analysis</span>
                </li>
                 <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Never expires</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleCheckout('full_season_pack')}
                disabled={processingType !== null}
              >
                {processingType === 'full_season_pack' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Buy Full Season Pack'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Custom Pack */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Custom Pack</CardTitle>
            <CardDescription>Pick exactly what you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${referralDiscountActive ? (customPrice * 0.9).toFixed(2) : customPrice}</span>
              <span className="text-muted-foreground">one-time</span>
            </div>
            {referralDiscountActive && (
              <p className="text-xs text-green-600 font-medium -mt-4">
                <span className="line-through">${customPrice}</span> 10% referral discount applied!
              </p>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                      <span>Credits</span>
                      <span className="text-primary">{customCredits[0]}</span>
                  </div>
                  <Slider
                      value={customCredits}
                      onValueChange={setCustomCredits}
                      min={50}
                      max={2000}
                      step={50}
                      className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50</span>
                      <span>2000</span>
                  </div>
              </div>
              
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                      <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>What can you do?</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                      {customCredits[0]} credits = {Math.floor(customCredits[0] / 5)} PIQ analyses or {customCredits[0]} AI coach messages. Mix and match as needed!
                  </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleCheckout(`custom_${customCredits[0]}`)}
              disabled={processingType !== null}
            >
              {processingType?.startsWith('custom_') ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                `Buy ${customCredits[0]} Credits`
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Referral Section */}
        {user && (
          <div className="max-w-3xl mx-auto">
            <ReferralCard />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 pt-12 border-t">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">12-Dimension Analysis</h3>
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
