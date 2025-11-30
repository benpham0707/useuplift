import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Check, Zap, Sparkles, GraduationCap, BookOpen, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [payAsYouGoCredits, setPayAsYouGoCredits] = useState([50]);

  // LAUNCH SALE: 50% off - was $10 per 50 credits, now $5
  const payAsYouGoPrice = (payAsYouGoCredits[0] / 50) * 5;
  const payAsYouGoOriginalPrice = (payAsYouGoCredits[0] / 50) * 10;

  return (
    <section id="pricing" className="py-24 bg-background font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4 animate-pulse">
            <span className="text-red-500 font-bold text-sm">🎉 LAUNCH SALE</span>
            <span className="text-red-600 font-extrabold text-sm">50% OFF EVERYTHING</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Invest in Your Future
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your journey. From a single portfolio scan to full application support.
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

        <div className="grid lg:grid-cols-3 gap-8 items-start">
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
                Get 10 free credits when you create a new account. Enough for a full portfolio scan to see where you stand.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>10 Credits on signup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Full Portfolio Scan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Basic Insights</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/auth')}
              >
                Get Started for Free
              </Button>
            </CardFooter>
          </Card>

           {/* Pro Tier */}
           <Card className="relative border-2 border-primary shadow-xl transform md:-translate-y-4 h-full flex flex-col z-10">
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
                Comprehensive support from 0-100. Access all premium tools to build your strongest application.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">100 Credits per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>PIQ Helper & Essay Workshop</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Deep Dive Assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Priority Support 24/7</span>
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
                onClick={() => navigate('/pricing')}
              >
                {billingInterval === 'monthly' ? 'Subscribe Monthly' : 'Subscribe Annually'}
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
                        {payAsYouGoCredits[0]} credits is enough for about {Math.floor(payAsYouGoCredits[0] / 10)} full portfolio scans or {Math.floor(payAsYouGoCredits[0] / 25)} deep essay reviews.
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
                onClick={() => navigate('/pricing')}
              >
                Buy Credits
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12 mt-12 border-t">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Expert Guidance</h3>
                <p className="text-sm text-muted-foreground">Backed by admissions data from top universities.</p>
            </div>
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Essay Workshops</h3>
                <p className="text-sm text-muted-foreground">Step-by-step tools to craft compelling narratives.</p>
            </div>
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">We're here to help you throughout the entire process.</p>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
