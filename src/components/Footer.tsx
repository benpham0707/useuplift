import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Shield, 
  FileText, 
  HelpCircle, 
  Users, 
  Building, 
  Code, 
  Mail,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { name: 'Portfolio Scanner', href: '/portfolio-scanner' },
      { name: 'Intelligent Calendar', href: '/calendar' },
      { name: 'Opportunity Engine', href: '/opportunities' },
      { name: 'Alternative Paths', href: '/paths' },
      { name: 'AI Guidance', href: '/ai-guidance' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Career Explorer', href: '/careers' },
      { name: 'Scholarship Database', href: '/scholarships' },
      { name: 'College Alternatives', href: '/alternatives' },
      { name: 'Blog & Insights', href: '/blog' }
    ]
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '/help', icon: HelpCircle },
      { name: 'Community Forum', href: '/community', icon: Users },
      { name: 'Contact Support', href: '/contact' },
      { name: 'Live Chat', href: '/chat' },
      { name: 'Video Tutorials', href: '/tutorials' }
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Uplift', href: '/about' },
      { name: 'Our Mission', href: '/mission' },
      { name: 'Research & Data', href: '/research' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press Kit', href: '/press' }
    ]
  }
];

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="pt-16 pb-8">
          <div className="grid lg:grid-cols-5 gap-12">
            
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-3xl font-bold">Uplift</div>
                <div className="text-sm opacity-80">Life Guidance, Reimagined</div>
              </div>
              
              <p className="text-primary-foreground/80 leading-relaxed mb-6 max-w-md">
                The complete platform that transforms confusion into clarity, 
                helping students navigate from high school through their career 
                with AI-powered guidance and comprehensive tools.
              </p>
              
              {/* Newsletter Signup */}
              <div className="space-y-4">
                <h4 className="font-semibold">Stay Updated</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter your email" 
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                  />
                  <Button variant="secondary" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-primary-foreground/60">
                  Get weekly insights on career paths and opportunities
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-4 mt-6">
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Footer Links */}
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-4 gap-8">
                {footerSections.map((section) => (
                  <div key={section.title}>
                    <h4 className="font-semibold mb-4">{section.title}</h4>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <a 
                            href={link.href} 
                            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm flex items-center gap-2"
                          >
                            {link.icon && <link.icon className="h-3 w-3" />}
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-primary-foreground/20" />

        {/* Trust & Security Section */}
        <div className="py-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Trust & Security
              </h4>
              <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
                <span>FERPA Compliant</span>
                <span>COPPA Compliant</span>
                <span>SOC 2 Type II</span>
                <span>256-bit Encryption</span>
              </div>
              <p className="text-xs text-primary-foreground/60 mt-2">
                Your data is yours - always. We never sell to colleges or third parties.
              </p>
            </div>
            
            <div className="md:text-right">
              <h4 className="font-semibold mb-4 flex items-center gap-2 md:justify-end">
                <Building className="h-4 w-4" />
                For Schools & Organizations
              </h4>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" className="mr-2">
                  <Code className="h-3 w-3 mr-1" />
                  API Documentation
                </Button>
                <Button variant="secondary" size="sm">
                  <Mail className="h-3 w-3 mr-1" />
                  Partner Program
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-primary-foreground/20" />

        {/* Bottom Section */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/80">
              <span>© 2024 Uplift. All rights reserved.</span>
              <a href="/privacy" className="hover:text-primary-foreground transition-colors flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-primary-foreground transition-colors">
                Terms of Service
              </a>
              <a href="/accessibility" className="hover:text-primary-foreground transition-colors">
                Accessibility
              </a>
            </div>
            
            <div className="text-sm text-primary-foreground/60">
              Made with ❤️ for students everywhere
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;