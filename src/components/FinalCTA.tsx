import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, CheckCircle } from 'lucide-react';

const FinalCTA = () => {
  const [email, setEmail] = useState('');

  return (
    <section className="py-16 bg-gradient-to-br from-primary via-primary-light to-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main Headline */}
        <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
          Your Future Doesn't Wait.{' '}
          <span className="block">Neither Should You.</span>
        </h2>
        
        <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join 50,000+ students navigating their future with confidence. 
          Get your personalized roadmap in 15 minutes.
        </p>

        {/* Email Capture */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex gap-3 mb-4">
            <Input 
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-primary-foreground/90 border-0"
            />
            <Button size="lg" variant="hero" className="group">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <p className="text-xs text-primary-foreground/70">
            Free forever • No credit card • 15min setup
          </p>
        </div>

        {/* Quick Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">15min setup</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">87% success rate</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">$4.2M scholarships</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">All paths supported</span>
          </div>
        </div>

        {/* Testimonial */}
        <blockquote className="text-primary-foreground/90 italic max-w-xl mx-auto">
          "Uplift helped me realize my part-time job wasn't holding me back—it was my biggest strength for applications."
          <footer className="text-primary-foreground/70 text-sm mt-2">
            - Maria R., $52K scholarship recipient
          </footer>
        </blockquote>
      </div>
    </section>
  );
};

export default FinalCTA;