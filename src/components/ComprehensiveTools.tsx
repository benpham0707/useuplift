import { Button } from '@/components/ui/button';
import { 
  Search, 
  Target, 
  FileText, 
  DollarSign, 
  BookOpen, 
  Users, 
  BarChart, 
  MapPin, 
  Heart
} from 'lucide-react';

const toolCategories = [
  { name: 'Discovery Tools', icon: Search, count: 4, description: 'Career exploration & assessments' },
  { name: 'Planning Tools', icon: Target, count: 4, description: 'Goal setting & roadmaps' },
  { name: 'Application Tools', icon: FileText, count: 4, description: 'Resumes, essays & portfolios' },
  { name: 'Financial Tools', icon: DollarSign, count: 4, description: 'Scholarships & budget planning' },
  { name: 'Learning Tools', icon: BookOpen, count: 4, description: 'Skills & certifications' },
  { name: 'Networking Tools', icon: Users, count: 4, description: 'Mentors & community' },
  { name: 'Tracking Tools', icon: BarChart, count: 4, description: 'Progress & analytics' },
  { name: 'Alternative Paths', icon: MapPin, count: 4, description: 'Trade schools & entrepreneurship' },
  { name: 'Wellness Tools', icon: Heart, count: 4, description: 'Balance & support' }
];

const ComprehensiveTools = () => {
  return (
    <section className="py-16 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Complete Digital Toolkit
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need organized into 9 comprehensive categories, 
            accessible anytime, anywhere.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {toolCategories.map((category, index) => (
            <div key={category.name} 
                 className="bg-background rounded-lg p-6 hover-lift animate-slide-up shadow-medium group cursor-pointer" 
                 style={{animationDelay: `${index * 0.05}s`}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary rounded-lg group-hover:scale-110 transition-transform">
                  <category.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{category.name}</div>
                  <div className="text-sm text-muted-foreground">{category.count} tools</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom Summary */}
        <div className="bg-background rounded-2xl p-8 shadow-medium">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">36+ Tools, 9 Categories</h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-muted-foreground text-sm">Access</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">Free</div>
                  <div className="text-muted-foreground text-sm">Tier Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">All Paths</div>
                  <div className="text-muted-foreground text-sm">Supported</div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground">
                Explore All Tools
              </Button>
              <p className="text-muted-foreground text-sm mt-3">
                Start free, upgrade as you grow
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComprehensiveTools;