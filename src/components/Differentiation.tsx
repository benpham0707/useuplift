import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

const comparisonData = [
  {
    feature: 'Student-to-Counselor Ratio',
    traditional: '1 counselor per 400 students',
    otherApps: 'Generic advice algorithms',
    uplift: '1:1 AI guidance for everyone',
    upliftAdvantage: true
  },
  {
    feature: 'Availability',
    traditional: 'Office hours only',
    otherApps: 'Limited chat responses',
    uplift: '24/7 comprehensive platform',
    upliftAdvantage: true
  },
  {
    feature: 'Path Support',
    traditional: 'College-focused approach',
    otherApps: 'Single-purpose tools',
    uplift: 'Every path supported equally',
    upliftAdvantage: true
  },
  {
    feature: 'Cost',
    traditional: 'Limited time per student',
    otherApps: 'Expensive private coaches',
    uplift: 'Unlimited support, affordable',
    upliftAdvantage: true
  },
  {
    feature: 'Personalization',
    traditional: 'One-size-fits-all advice',
    otherApps: 'Basic demographic targeting',
    uplift: 'Deep contextual understanding',
    upliftAdvantage: true
  },
  {
    feature: 'Alternative Paths',
    traditional: 'Rarely discussed',
    otherApps: 'Not supported',
    uplift: 'Actively promoted and supported',
    upliftAdvantage: true
  }
];

const uniqueAdvantages = [
  {
    title: 'Contextual Intelligence',
    description: 'We understand that a 3.5 GPA while working 20 hours shows exceptional time management.',
    icon: '🧠'
  },
  {
    title: 'Path Equality',
    description: 'Trade school, college, entrepreneurship—we champion whatever path fits YOU best.',
    icon: '⚖️'
  },
  {
    title: 'Authentic Voice',
    description: 'We help you find your story, not write a generic one that sounds like everyone else.',
    icon: '🎭'
  },
  {
    title: 'Proactive Support',
    description: 'We remind you of opportunities before deadlines, not after you\'ve missed them.',
    icon: '⚡'
  }
];

const Differentiation = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Built Different. Built Better.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            While others focus on college admissions, we focus on your entire life journey. 
            See how Uplift compares to traditional counseling and other platforms.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-background rounded-2xl shadow-medium p-8 mb-16 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 mb-6 pb-4 border-b border-border">
              <div className="font-semibold text-muted-foreground">Feature</div>
              <div className="text-center font-semibold text-muted-foreground">Traditional Counseling</div>
              <div className="text-center font-semibold text-muted-foreground">Other Apps</div>
              <div className="text-center font-semibold text-primary">
                Uplift
                <Badge className="ml-2 bg-primary text-primary-foreground text-xs">Better</Badge>
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {comparisonData.map((row, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-4 border-b border-border/50">
                  <div className="font-medium text-foreground">{row.feature}</div>
                  
                  <div className="text-center flex items-center justify-center gap-2">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{row.traditional}</span>
                  </div>
                  
                  <div className="text-center flex items-center justify-center gap-2">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{row.otherApps}</span>
                  </div>
                  
                  <div className="text-center flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-foreground text-sm font-medium">{row.uplift}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unique Advantages */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground text-center mb-12">
            What Makes Uplift Truly Different
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {uniqueAdvantages.map((advantage, index) => (
              <Card key={index} className="shadow-medium hover-lift animate-slide-up border-0" 
                    style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{advantage.icon}</div>
                    <CardTitle className="text-xl">{advantage.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Statistics */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary">400:1</div>
              <div className="text-sm text-muted-foreground">Traditional ratio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1:1</div>
              <div className="text-sm text-muted-foreground">Uplift AI guidance</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">180+</div>
              <div className="text-sm text-muted-foreground">Paths supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Always available</div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-primary/20">
            <h4 className="text-xl font-bold text-foreground mb-2">
              The Result?
            </h4>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Students using Uplift are 3x more likely to discover opportunities they never 
              knew existed and 87% more likely to reach their primary goal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Differentiation;