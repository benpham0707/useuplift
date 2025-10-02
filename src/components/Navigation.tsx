import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/10 dark:bg-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/5 border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
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
            <a href="#platform" className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Platform
            </a>
            <a href="#features" className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Features
            </a>
            <a href="#paths" className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Paths
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Pricing
            </a>
            <a href="#schools" className="text-foreground hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              For Schools
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-9" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
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
            <a href="#platform" className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Platform
            </a>
            <a href="#features" className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Features
            </a>
            <a href="#paths" className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Paths
            </a>
            <a href="#pricing" className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              Pricing
            </a>
            <a href="#schools" className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5">
              For Schools
            </a>
            <div className="pt-2 space-y-2">
              {loading ? (
                <div className="w-full h-9" />
              ) : user ? (
                <div className="space-y-2">
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