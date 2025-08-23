import { Clock, Users, Target, DollarSign, TrendingUp } from 'lucide-react';

const metrics = [
  { icon: Clock, value: '15min', description: 'Setup time' },
  { icon: TrendingUp, value: '3x', description: 'More opportunities found' },
  { icon: Target, value: '87%', description: 'Reach their goals' },
  { icon: DollarSign, value: '$4.2M', description: 'Scholarships unlocked' },
  { icon: Users, value: '50K+', description: 'Students helped' }
];

const testimonial = {
  quote: "Uplift helped me realize that my part-time job wasn't holding me back—it was actually my biggest strength for college applications.",
  name: "Maria R.",
  role: "First-gen college student",
  outcome: "$52,000 scholarship"
};

const SuccessMetrics = () => {
  return (
    <section className="py-16 hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Real Results, Real Students
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            See the impact Uplift is making for students across all paths and backgrounds.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <div key={metric.description} 
                 className="bg-primary-foreground/10 backdrop-blur rounded-lg p-6 text-center hover-lift animate-slide-up" 
                 style={{animationDelay: `${index * 0.1}s`}}>
              <metric.icon className="h-6 w-6 mx-auto mb-3 text-primary-foreground" />
              <div className="text-2xl font-bold text-primary-foreground mb-1">
                {metric.value}
              </div>
              <p className="text-xs text-primary-foreground/80">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

        {/* Featured Testimonial */}
        <div className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-8 text-center max-w-4xl mx-auto">
          <blockquote className="text-xl text-primary-foreground mb-6 italic">
            "{testimonial.quote}"
          </blockquote>
          
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="font-semibold text-primary-foreground">{testimonial.name}</div>
              <div className="text-sm text-primary-foreground/80">{testimonial.role}</div>
            </div>
            <div className="w-px h-8 bg-primary-foreground/30"></div>
            <div className="text-lg font-bold text-primary-foreground">
              {testimonial.outcome}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessMetrics;