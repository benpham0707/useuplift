import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, GraduationCap, Code, Compass } from 'lucide-react';

const examples = [
  {
    icon: GraduationCap,
    name: 'Sarah',
    context: 'First-gen, working 20hrs/week',
    insight: 'Your work experience is your superpower',
    color: 'bg-primary'
  },
  {
    icon: Code,
    name: 'Marcus',
    context: 'Loves coding, college unaffordable',
    insight: 'Skip debt, build skills, earn faster',
    color: 'bg-secondary'
  },
  {
    icon: Compass,
    name: 'Ana',
    context: 'High achiever, multiple interests',
    insight: 'Take time to explore, we\'ll guide you',
    color: 'bg-primary-light'
  }
];

const IntelligentRoadmap = () => {
  return (
    <section className="py-16 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            AI That Understands Context
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI creates personalized roadmaps that adapt to your unique situation, not generic advice.
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {examples.map((example, index) => (
            <div key={example.name} 
                 className="bg-background rounded-lg p-6 hover-lift animate-slide-up shadow-medium" 
                 style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${example.color}`}>
                  <example.icon className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold text-foreground">{example.name}</div>
              </div>
              
              <Badge variant="outline" className="mb-3 text-xs">
                {example.context}
              </Badge>
              
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  "{example.insight}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-background rounded-2xl p-8 text-center shadow-medium">
          <h3 className="text-xl font-bold text-foreground mb-4">
            Get Your Personalized Roadmap
          </h3>
          <p className="text-muted-foreground mb-6">
            Answer 5 questions, get your roadmap in 15 minutes
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground group">
            Start Assessment
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default IntelligentRoadmap;