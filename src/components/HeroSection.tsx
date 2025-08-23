import { Button } from '@/components/ui/button';
import { ArrowRight, Users, TrendingUp, Target } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="hero-gradient py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in">
            From Confusion to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground to-secondary-foreground">
              Clarity
            </span>
          </h1>
          
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto animate-slide-up">
            Your AI-Powered Life Strategist combines portfolio scanning, career exploration, 
            and opportunity matching into one intelligent platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Button size="lg" variant="hero" className="font-semibold group">
              Get Your Personalized Roadmap
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Watch Demo
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground">15min</div>
              <div className="text-primary-foreground/70 text-sm">Setup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground">87%</div>
              <div className="text-primary-foreground/70 text-sm">Reach Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground">$4.2M</div>
              <div className="text-primary-foreground/70 text-sm">Scholarships</div>
            </div>
          </div>
        </div>

        {/* Three Core Pillars - Compact */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-6 text-center hover-lift">
            <Users className="h-8 w-8 text-primary-foreground mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-primary-foreground mb-2">Discover Who You Are</h4>
            <p className="text-primary-foreground/80 text-sm">Portfolio scanning reveals your unique story</p>
          </div>

          <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-6 text-center hover-lift">
            <Target className="h-8 w-8 text-primary-foreground mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-primary-foreground mb-2">Plan Your Path</h4>
            <p className="text-primary-foreground/80 text-sm">AI creates personalized roadmaps for any path</p>
          </div>

          <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-6 text-center hover-lift">
            <TrendingUp className="h-8 w-8 text-primary-foreground mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-primary-foreground mb-2">Achieve Your Goals</h4>
            <p className="text-primary-foreground/80 text-sm">Tools and community support your journey</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;