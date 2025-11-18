import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from '@/components/portfolio/tabs/OverviewTab';
import { Badge } from '@/components/ui/badge';
import { MOCK_HOLISTIC_SUMMARY } from '@/components/portfolio/portfolioInsightsData';
import '@/components/portfolio/ProfileCard.css';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Target, 
  Award, 
  TrendingUp, 
  MapPin, 
  FileText, 
  Lightbulb 
} from 'lucide-react';

const PortfolioInsightsNew: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // SEO: title, description, canonical, and basic structured data
  useEffect(() => {
    const title = 'Portfolio Insights – Holistic Summary';
    const description = 'Holistic portfolio overview with overall score, tier, profile summary, and five key takeaways.';
    const canonicalHref = `${window.location.origin}/portfolio-insights`;

    document.title = title;

    // Meta description
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);

    // Structured data (WebPage)
    const ldId = 'ld-portfolio-insights';
    const existing = document.getElementById(ldId);
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = ldId;
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalHref,
    });
    document.head.appendChild(script);
  }, []);

  // Sync tab with URL query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    // Map legacy "context" to new "coherence" tab
    const normalized = tabParam === 'context' ? 'coherence' : tabParam;
    if (normalized !== activeTab) {
      setActiveTab(normalized);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleNavigateToTab = (tab: string) => {
    handleTabChange(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const summary = MOCK_HOLISTIC_SUMMARY;

  return (
    <main role="main" className="relative min-h-screen overflow-hidden">
      {/* Animated Background Layers - Vibrant Cyan/Purple Theme */}
      <div className="fixed inset-0 -z-10">
        {/* Base light gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/80 via-purple-50/80 to-violet-50/80" />
        
        {/* Animated radial gradient 1 - Purple to Cyan */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-[#c137ff]/40 via-[#8b5cf6]/35 to-[#07c6ff]/40 blur-[100px]"
          style={{ willChange: 'transform' }}
        />
        
        {/* Animated radial gradient 2 - Cyan to Teal */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-radial from-[#00ffaa]/35 via-[#00c1ff]/30 to-[#07c6ff]/35 blur-[100px]"
          style={{ willChange: 'opacity, transform' }}
        />
        
        {/* Animated radial gradient 3 - Purple accent */}
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-[#c137ff]/25 via-[#a855f7]/20 to-[#8b5cf6]/25 blur-[100px]"
          style={{ willChange: 'transform' }}
        />
        
        {/* Large cloudy layer */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-radial from-[#07c6ff]/40 via-[#c137ff]/30 to-transparent blur-[120px]"
          style={{ willChange: 'opacity, transform' }}
        />
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Unified Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-white/60 shadow-lg shadow-purple-200/50">
            <Badge variant="default" className="text-xs bg-primary text-primary-foreground border-0">
              {summary.tierName}
            </Badge>
            <span className="text-sm font-medium text-foreground">•</span>
            <span className="text-sm font-medium text-foreground">{summary.tierPercentile}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Your Portfolio
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your application profile analyzed, scored, and compared
          </p>
        </div>

        {/* Portfolio Card - Fixed at top */}
        <OverviewTab summary={summary} onNavigateToTab={handleNavigateToTab} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </main>
  );
};

export default PortfolioInsightsNew;
