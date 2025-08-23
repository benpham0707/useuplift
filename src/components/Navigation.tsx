import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary">
              Uplift
            </div>
            <div className="ml-2 text-sm text-secondary hidden sm:block">
              Life Guidance, Reimagined
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#platform" className="text-foreground hover:text-primary transition-colors">
              Platform
            </a>
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#paths" className="text-foreground hover:text-primary transition-colors">
              Paths
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#schools" className="text-foreground hover:text-primary transition-colors">
              For Schools
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold" asChild>
              <a href="/portfolio-scanner">Start Your Journey</a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <a href="#platform" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
              Platform
            </a>
            <a href="#features" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#paths" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
              Paths
            </a>
            <a href="#pricing" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#schools" className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
              For Schools
            </a>
            <div className="pt-2">
              <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold" asChild>
                <a href="/portfolio-scanner">Start Your Journey</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;