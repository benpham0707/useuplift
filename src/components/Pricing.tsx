import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Building } from 'lucide-react';

const pricingTiers = [
  {
    name: 'Free Forever',
    price: '$0',
    period: 'forever',
    description: 'Perfect for exploring your options',
    badge: null,
    features: [
      'Basic portfolio scanner',
      '5 AI consultations per month',
      'Community access',
      'Basic goal tracking',
      'Public resource library',
      'Email support'
    ],
    buttonText: 'Start Free',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Student',
    price: '$9',
    period: 'month',
    description: 'Everything you need to succeed',
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      'Unlimited AI guidance',
      'All tools unlocked',
      'Priority support',
      'Advanced analytics',
      'Scholarship matching',
      'Mentor network access',
      'Application tracking'
    ],
    buttonText: 'Start Building',
    buttonVariant: 'default' as const,
    popular: true
  },
  {
    name: 'Schools',
    price: 'Custom',
    period: 'pricing',
    description: 'Comprehensive institutional solution',
    badge: 'Enterprise',
    features: [
      'Whole school access',
      'Analytics dashboard',
      'Counselor tools',
      'Training included',
      'Custom branding',
      'API access',
      'Dedicated support',
      'Advanced reporting'
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline' as const,
    popular: false
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Accessible to All
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're just starting to explore or ready to transform your future, 
            we have a plan that fits your needs and budget.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.name}
              className={`
                relative shadow-medium hover-lift animate-slide-up
                ${tier.popular ? 'border-primary shadow-strong scale-105' : 'border-border'}
              `}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    {tier.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="mb-4">
                  {tier.name === 'Free Forever' && <Star className="h-12 w-12 mx-auto text-primary" />}
                  {tier.name === 'Student' && <Check className="h-12 w-12 mx-auto text-primary" />}
                  {tier.name === 'Schools' && <Building className="h-12 w-12 mx-auto text-primary" />}
                </div>
                
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <CardDescription className="mb-4">{tier.description}</CardDescription>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  {tier.price !== 'Custom' && (
                    <span className="text-muted-foreground">/{tier.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-foreground text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant={tier.buttonVariant} 
                  size="lg" 
                  className={`
                    w-full font-semibold
                    ${tier.popular ? 'bg-primary hover:bg-primary-dark text-primary-foreground' : ''}
                  `}
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Not satisfied with your progress? Get a full refund within 30 days, 
            no questions asked. We're confident Uplift will transform your journey.
          </p>
        </div>

        {/* FAQ Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Questions about pricing?
          </h3>
          <p className="text-muted-foreground mb-6">
            We offer student discounts, family plans, and need-based assistance.
          </p>
          <Button variant="outline">
            View Full FAQ
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;