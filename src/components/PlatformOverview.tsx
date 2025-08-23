import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Calendar, 
  Target, 
  BookOpen, 
  Users2, 
  PenTool,
  ArrowRight
} from 'lucide-react';

const platformFeatures = [
  {
    icon: Search,
    title: 'Portfolio Scanner',
    description: 'Transform your experiences into compelling narratives',
  },
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Never miss deadlines with AI-powered scheduling',
  },
  {
    icon: Target,
    title: 'Opportunity Matching',
    description: 'Discover scholarships and programs tailored to you',
  },
  {
    icon: BookOpen,
    title: 'Alternative Paths',
    description: 'Explore trade schools, apprenticeships, and more',
  },
  {
    icon: PenTool,
    title: 'Guided Reflection',
    description: 'Turn thoughts into actionable insights',
  },
  {
    icon: Users2,
    title: 'Community Support',
    description: 'Connect with mentors and peers on similar journeys',
  }
];

const PlatformOverview = () => {
  return (
    <section id="platform" className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            One Platform. Your Entire Journey.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop juggling multiple tools. Everything you need to navigate your future, integrated seamlessly.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {platformFeatures.map((feature, index) => (
            <Card key={feature.title} className="hover-lift animate-slide-up border-0 shadow-medium" 
                  style={{animationDelay: `${index * 0.1}s`}}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats & CTA */}
        <div className="bg-muted rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Complete Ecosystem</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">36+</div>
                  <div className="text-muted-foreground text-sm">Tools</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">9</div>
                  <div className="text-muted-foreground text-sm">Categories</div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground group">
                Explore Platform
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformOverview;