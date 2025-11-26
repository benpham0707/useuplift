import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="bg-background border-t pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="mb-4 inline-block">
              <img 
                src="/uplift_logo_lr.png" 
                alt="Uplift Logo" 
                className="h-8 w-auto object-contain" 
              />
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Helping students navigate their future with confidence. 
              See what you're already building and what to do next.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
              <li><Link to="/portfolio-scanner" className="hover:text-foreground transition-colors">Portfolio Scanner</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:support@useuplift.io" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Uplift. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
