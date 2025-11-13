import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from '@/components/portfolio/tabs/OverviewTab';
import { Badge } from '@/components/ui/badge';
import { MOCK_HOLISTIC_SUMMARY } from '@/components/portfolio/portfolioInsightsData';
import '@/components/portfolio/ProfileCard.css';
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
    <main role="main" className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Unified Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Badge variant="default" className="text-xs">
              {summary.tierName}
            </Badge>
            <span className="text-sm font-medium">•</span>
            <span className="text-sm font-medium">{summary.tierPercentile}</span>
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
