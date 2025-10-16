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
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
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
  const overall100 = Math.round(summary.overallScore * 10);

  return (
    <main role="main" className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Badge variant="default" className="text-xs">
              {summary.tierName}
            </Badge>
            <span className="text-sm font-medium">•</span>
            <span className="text-sm font-medium">{summary.tierPercentile}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Portfolio Insights
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive analysis of your application profile with actionable recommendations
          </p>
        </div>

        {/* Portfolio Card - Fixed at top */}
        <div className="flex justify-center mb-12">
          <div className="inline-block">
            <div className="pc-wrapper">
              <div className="pc-card">
                <div className="pc-header">
                  <div className="pc-avatar">
                    <div className="pc-avatar-inner bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl">
                      P
                    </div>
                  </div>
                  <div className="pc-user-info">
                    <div className="pc-name">Your Portfolio</div>
                    <div className="pc-title">{summary.tierName} • {summary.tierPercentile}</div>
                    <div className="pc-handle">@portfolio</div>
                  </div>
                </div>
                <div className="pc-body">
                  <div className="pc-sides">
                    <div className="pc-side-col">
                      <div className="pc-side-line">
                        <div className="pc-side-num">7.8</div>
                        <div className="pc-side-label">Academic</div>
                      </div>
                      <div className="pc-side-line">
                        <div className="pc-side-num">8.5</div>
                        <div className="pc-side-label">Readiness</div>
                      </div>
                    </div>
                    <div className="pc-side-col">
                      <div className="pc-side-line">
                        <div className="pc-side-num">8.5</div>
                        <div className="pc-side-label">Leadership</div>
                      </div>
                      <div className="pc-side-line">
                        <div className="pc-side-num">8.3</div>
                        <div className="pc-side-label">Community</div>
                      </div>
                    </div>
                  </div>
                  <div className="pc-overall-plaque">
                    <div className="pc-overall-num">{overall100}</div>
                    <div className="pc-overall-label">Overall</div>
                  </div>
                </div>
                <div className="pc-status-badge">Analyzed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto gap-2 bg-muted/50 p-2 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
            <TabsTrigger value="recognition" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Recognition</span>
            </TabsTrigger>
            <TabsTrigger value="trajectory" className="flex items-center gap-2 data-[state=active]:bg-background">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trajectory</span>
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-2 data-[state=active]:bg-background">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Context</span>
            </TabsTrigger>
            <TabsTrigger value="evidence" className="flex items-center gap-2 data-[state=active]:bg-background">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Evidence</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="mt-0">
            <OverviewTab summary={summary} onNavigateToTab={handleNavigateToTab} />
          </TabsContent>

          <TabsContent value="impact" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Impact Footprint tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="recognition" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Recognition Mix tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="trajectory" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Trajectory & Durability tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="context" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Context & Contribution tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Evidence & Analysis tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Recommendations tab coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default PortfolioInsightsNew;
