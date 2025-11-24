import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/10 dark:bg-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/5 border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/uplift_logo_lr.png" 
                alt="Uplift Logo" 
                className="h-8 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavigation('/portfolio-scanner')} 
              className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Scanner & Insights
            </button>
            <button 
              onClick={() => navigate('/project-incubation')}
              className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Workshop
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Pricing
            </button>
            <div className="text-muted-foreground cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium relative opacity-80">
              For Schools
              <span className="absolute -top-1 -right-3 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full transform scale-90">
                SOON
              </span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-9" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                {/* Settings icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/settings')}
                  className="text-foreground hover:text-primary"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {/* Sign out icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="text-foreground hover:text-primary"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </div>
            )}
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
          <div className="md:hidden py-4 space-y-2 bg-white/5 dark:bg-black/5 backdrop-blur-sm border-t border-white/10 dark:border-white/5">
            <button 
              onClick={() => { handleNavigation('/portfolio-scanner'); setIsMenuOpen(false); }} 
              className="w-full text-left block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Scanner & Insights
            </button>
            <button 
              onClick={() => { navigate('/project-incubation'); setIsMenuOpen(false); }}
              className="w-full text-left block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Workshop
            </button>
            <button
              onClick={() => { navigate('/pricing'); setIsMenuOpen(false); }}
              className="w-full text-left block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-sm font-medium"
            >
              Pricing
            </button>
            <div className="block px-3 py-2 text-muted-foreground cursor-not-allowed rounded-lg text-sm font-medium">
              For Schools <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">SOON</span>
            </div>
            <div className="pt-2 space-y-2">
              {loading ? (
                <div className="w-full h-9" />
              ) : user ? (
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/portfolio-scanner">Dashboard</Link>
                  </Button>
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-foreground">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-1"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/auth">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
