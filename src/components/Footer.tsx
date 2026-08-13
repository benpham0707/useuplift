import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="bg-background border-t pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 mb-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="mb-3 text-lg font-semibold">Uplift</p>
            <p className="text-muted-foreground max-w-sm">
              Helping students navigate their future with confidence. 
              See what you're already building and what to do next.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:benpham0707@berkeley.edu" className="hover:text-foreground transition-colors">Contact</a></li>
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
