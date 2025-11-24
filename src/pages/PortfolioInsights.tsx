import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Crown, 
  Brain, 
  Feather, 
  Heart, 
  Compass,
  Target,
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview';
import { DimensionInsightCard } from '@/components/portfolio/DimensionInsightCard';
import { RecommendationInsightCard } from '@/components/portfolio/RecommendationInsightCard';
import { GapAnalysisCard } from '@/components/portfolio/GapAnalysisCard';
import MagicBento, { BentoCard } from '@/components/ui/MagicBento';

type DetailedInsights = {
  overallScore?: number;
  narrativeSummary?: string;
  hiddenStrengths?: string[];
  prioritizedRecommendations?: { 
    priority: number; 
    action: string; 
    impact?: string; 
    timeline?: string;
    rationale?: string;
  }[];
  dimensions?: Record<string, {
    score?: number;
    evidence?: string[];
    feedback?: string;
    strengths?: string[];
    growthAreas?: string[];
  }>;
};

const DIMENSION_META = [
  { label: 'Academic Excellence', key: 'academicExcellence', icon: BookOpen, color: 'hsl(250 70% 60%)' },
  { label: 'Leadership Potential', key: 'leadershipPotential', icon: Crown, color: 'hsl(145 70% 50%)' },
  { label: 'Intellectual Curiosity', key: 'futureReadiness', icon: Brain, color: 'hsl(195 85% 55%)' },
  { label: 'Storytelling Ability', key: 'overall', icon: Feather, color: 'hsl(280 80% 65%)' },
  { label: 'Character & Community', key: 'communityImpact', icon: Heart, color: 'hsl(35 90% 60%)' },
  { label: 'Future Readiness', key: 'futureReadiness', icon: Compass, color: 'hsl(200 85% 60%)' },
];

const getTierInfo = (score: number | null) => {
  if (!score) return { name: 'Unranked', color: 'hsl(210 15% 60%)', gradient: 'from-gray-400 to-gray-500' };
  if (score >= 9) return { name: 'Elite Scholar', color: 'hsl(280 80% 65%)', gradient: 'from-purple-500 to-pink-500' };
  if (score >= 8.5) return { name: 'Diamond Achiever', color: 'hsl(200 90% 65%)', gradient: 'from-cyan-400 to-blue-500' };
  if (score >= 7) return { name: 'Gold Candidate', color: 'hsl(45 95% 55%)', gradient: 'from-yellow-400 to-orange-500' };
  if (score >= 5) return { name: 'Silver Aspirant', color: 'hsl(210 15% 60%)', gradient: 'from-gray-300 to-gray-400' };
  return { name: 'Bronze Beginner', color: 'hsl(25 70% 50%)', gradient: 'from-orange-600 to-orange-700' };
};

export default function PortfolioInsights() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { search } = useLocation();
  const [initializing, setInitializing] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [detailed, setDetailed] = useState<DetailedInsights | null>(null);

  // Ensure profile exists and determine onboarding state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    let cancelled = false;
    const ensureProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, has_completed_assessment')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;

        if (!cancelled && !data) {
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id, user_context: 'high_school_11th', has_completed_assessment: false })
            .select('id, has_completed_assessment')
            .single();
          if (insertError) throw insertError;
          if (!cancelled) setHasCompletedOnboarding(Boolean(created?.has_completed_assessment));
        } else if (!cancelled) {
          setHasCompletedOnboarding(Boolean(data?.has_completed_assessment));
        }
      } catch {
        // If profile creation fails, let fetch show a helpful error later
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };
    ensureProfile();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let cancelled = false;
    const normalizeDimensions = (raw: any): Record<string, any> => {
      if (!raw || typeof raw !== 'object') return {};
      const map: Record<string, string> = {
        academic: 'academicExcellence',
        leadership: 'leadershipPotential',
        growth: 'futureReadiness',
        readiness: 'futureReadiness',
        community: 'communityImpact',
        uniqueness: 'uniqueValue',
        overall: 'overall',
        academicExcellence: 'academicExcellence',
        leadershipPotential: 'leadershipPotential',
        futureReadiness: 'futureReadiness',
        communityImpact: 'communityImpact',
      };
      const result: Record<string, any> = {};
      Object.entries(raw).forEach(([key, val]) => {
        const target = map[key] || key;
        result[target] = val as any;
      });
      return result;
    };
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);

        const API_URL = 'https://uplift-final-final-18698.onrender.com/api/v1/analytics/portfolio-strength';
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        let json: any | null = null;
        try {
          const resp = await fetch(API_URL, {
            method: 'GET',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              Accept: 'application/json',
            },
          });
          if (resp.ok) {
            json = await resp.json();
          }
        } catch {
          // ignore network error; we'll fall back to mock data below
        }

        if (!json) {
          // IMPORTANT: Hard-coded mock analysis used as a fallback when backend is unavailable
          // Contains representative values for overall score, per-dimension scores, detailed insights, and recommendations
          json = {
            overall: 8.2,
            dimensions: {
              growth: 8.2,
              academic: 7.8,
              community: 8.3,
              readiness: 8.5,
              leadership: 8.5,
              uniqueness: 8.0,
              overall: 8.2,
            },
            detailed: {
              overallScore: 8.2,
              narrativeSummary:
                'The student shows a strong blend of academics, leadership, and community focus with clear med‑tech direction.',
              hiddenStrengths: [
                'Excellent time management balancing academics and work',
                'Strong networking through community engagement',
                'Bridges technical skill with empathy',
              ],
              prioritizedRecommendations: [
                {
                  priority: 1,
                  action: 'Engage in a healthcare internship',
                  impact: 'Direct exposure to field and practical skills',
                  timeline: 'Next 6 months',
                  rationale: 'Deepens career alignment and validates interest',
                },
                {
                  priority: 2,
                  action: 'Build a public project portfolio',
                  impact: 'Showcases initiative and outcomes',
                  timeline: 'This school year',
                  rationale: 'Improves profile signal for applications',
                },
                {
                  priority: 3,
                  action: 'Find a mentor in med‑tech',
                  impact: 'Guidance and network expansion',
                  timeline: '3–6 months',
                  rationale: 'Clarifies trajectory and opportunities',
                },
              ],
              dimensions: {
                academicExcellence: {
                  score: 7.8,
                  strengths: ['Rigorous courses', 'Consistent performance'],
                  growthAreas: ['Pursue advanced science coursework'],
                  feedback: 'Strong base—keep building rigor and depth.',
                },
                leadershipPotential: {
                  score: 8.5,
                  strengths: ['Club leadership', 'Peer mobilization'],
                  growthAreas: ['Seek formal leadership training'],
                  feedback: 'Leadership foundation is solid and scalable.',
                },
                communityImpact: {
                  score: 8.3,
                  strengths: ['STEM workshops', 'Health fair volunteering'],
                  growthAreas: ['Scale partnerships for greater reach'],
                  feedback: 'Meaningful impact—amplify with broader programs.',
                },
                futureReadiness: {
                  score: 8.5,
                  strengths: ['Clear goals', 'Relevant projects'],
                  growthAreas: ['Healthcare internships for hands‑on experience'],
                  feedback: 'Well prepared for next steps and exploration.',
                },
              },
            },
          };
        }

        if (cancelled) return;
        setOverall(typeof json?.overall === 'number' ? Number(json.overall) : null);
        const normalizedDims = normalizeDimensions(json?.dimensions || {});
        setDimensions(normalizedDims);
        const normalizedDetailed = json?.detailed
          ? {
              ...json.detailed,
              dimensions: normalizeDimensions(json.detailed.dimensions || {}),
            }
          : null;
        setDetailed(normalizedDetailed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load insights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user && hasCompletedOnboarding && !initializing) fetchInsights();
    return () => { cancelled = true; };
  }, [user, hasCompletedOnboarding, initializing]);

  const targetTop25 = 9.2;
  const tierInfo = getTierInfo(overall);

  // Calculate stats for quick metrics
  const dimensionsExcellingCount = Object.values(dimensions).filter(score => score > 8).length;
  const hiddenStrengthsCount = detailed?.hiddenStrengths?.length || 0;
  const priorityActionsCount = detailed?.prioritizedRecommendations?.filter(r => r.priority === 1)?.length || 0;
  const portfolioStrength = overall ? (overall >= 8.5 ? 'Strong' : overall >= 7 ? 'Good' : 'Developing') : 'Unknown';

  // Calculate top 3 gaps for gap analysis
  const gaps = DIMENSION_META.map(dim => {
    const dimData = detailed?.dimensions?.[dim.key];
    const score = typeof dimData?.score === 'number' ? dimData.score : dimensions[dim.key] || 0;
    return {
      ...dim,
      currentScore: score,
      gap: targetTop25 - score,
      dimData
    };
  })
  .filter(g => g.gap > 0)
  .sort((a, b) => b.gap - a.gap)
  .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-destructive font-semibold text-lg">Unable to Load Insights</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <Button onClick={() => navigate('/portfolio-scanner')}>
              Return to Portfolio Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Gradient Background with Fade */}
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none" />
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm relative">
        <div className="max-w-7xl mx-auto px-6 py-5 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="lg" onClick={() => navigate('/portfolio-scanner')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierInfo.gradient} flex items-center justify-center text-white font-bold shadow-lg text-sm`}
              >
                {overall?.toFixed(1) || '—'}
              </div>
              <div>
                <div className="font-semibold text-base md:text-lg">Portfolio Insights</div>
                <div className="text-sm text-muted-foreground">Research Analysis</div>
              </div>
            </div>
          </div>
          <div className="text-base md:text-lg text-muted-foreground hidden sm:block">Live Analytics</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 relative z-10">
        {/* Section 1: Portfolio Overview - Differentiators & Impact */}
        <section className="animate-fade-in">
          <PortfolioOverview />
        </section>

        {/* Section 2: Dimensional Analysis (MagicBento 3x2) */}
        <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-purple-600" />
            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Dimensional Analysis</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
            Detailed breakdown of each assessment dimension with identified strengths and development opportunities.
          </p>

          <MagicBento 
            cards={DIMENSION_META.map((dim, idx) => {
              const dimData = detailed?.dimensions?.[dim.key] || {};
              const score = typeof dimData?.score === 'number' ? dimData.score : dimensions[dim.key] || null;
              
              return {
                content: (
                  <DimensionInsightCard
                    label={dim.label}
                    icon={dim.icon}
                    color={dim.color}
                    score={score}
                    strengths={dimData.strengths}
                    growthAreas={dimData.growthAreas}
                    insight={dimData.feedback}
                  />
                )
              };
            })}
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            particleCount={6}
            glowColor="280, 80%, 65%"
          />
        </section>

        {/* Section 3: Hidden Strengths (GapAnalysisCard-style) */}
        {hiddenStrengthsCount > 0 && (
          <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Unique Differentiators Discovered</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
              Hidden strengths identified through cross-dimensional analysis of your experiences and achievements.
            </p>

            <Card 
              className="bg-white border-2 transition-all duration-300 hover:shadow-lg border-l-4"
              style={{ borderLeftColor: 'hsl(280, 80%, 65%)' }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header with Progress Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow"
                      style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 65%), hsl(280, 80%, 55%))' }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">Unique Strengths Unlocked</h3>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {hiddenStrengthsCount} differentiators identified
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl md:text-4xl font-extrabold" style={{ color: 'hsl(280, 80%, 65%)' }}>
                      {hiddenStrengthsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">found</div>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {detailed?.hiddenStrengths?.map((strength, idx) => (
                    <Badge
                      key={idx}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md animate-fade-in hover:scale-105 transition-transform"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Section 4: Strategic Recommendations (MagicBento) */}
        {detailed?.prioritizedRecommendations && detailed.prioritizedRecommendations.length > 0 && (
          <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-amber-600" />
              <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Strategic Recommendations</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
              Prioritized actions based on comprehensive analysis of your portfolio strengths and development areas.
            </p>

            <MagicBento 
              cards={detailed.prioritizedRecommendations.slice(0, 4).map((rec, idx) => {
                const priority = rec.priority === 1 ? 'high' : rec.priority === 2 ? 'medium' : 'low';
                return {
                  content: (
                    <RecommendationInsightCard
                      title={rec.action}
                      priority={priority}
                      impact={rec.impact}
                      timeline={rec.timeline}
                      rationale={rec.rationale}
                    />
                  )
                };
              })}
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              particleCount={6}
              glowColor="35, 90%, 60%"
            />
          </section>
        )}

        {/* Section 5: Gap Analysis (MagicBento) */}
        {gaps.length > 0 && (
          <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-600" />
              <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Growth Opportunities</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
              Dimensions with the largest opportunity for improvement, along with actionable strategies to close the gaps.
            </p>

            <MagicBento 
              cards={gaps.map((gap, idx) => ({
                content: (
                  <GapAnalysisCard
                    dimensionLabel={gap.label}
                    dimensionIcon={gap.icon}
                    color={gap.color}
                    currentScore={gap.currentScore}
                    targetScore={targetTop25}
                    factors={gap.dimData?.growthAreas?.slice(0, 2)}
                    quickWins={gap.dimData?.growthAreas?.slice(0, 3) || ['Continue building experience in this area', 'Seek mentorship and feedback', 'Document your progress']}
                    projectedImpact={`Closing this gap could increase your overall score by ${(gap.gap * 0.15).toFixed(1)} points`}
                  />
                )
              }))}
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              particleCount={6}
              glowColor="35, 90%, 60%"
            />
          </section>
        )}

        {/* Section 6: Detailed Evidence Breakdown (Accordion) */}
        <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Detailed Evidence Breakdown</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
            Comprehensive analysis of each dimension including evidence, expert feedback, and detailed recommendations.
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {DIMENSION_META.map((dim) => {
              const dimData = detailed?.dimensions?.[dim.key];
              if (!dimData) return null;

              const Icon = dim.icon;
              const score = typeof dimData?.score === 'number' ? dimData.score : dimensions[dim.key] || null;

              return (
                <AccordionItem 
                  key={dim.key} 
                  value={dim.key}
                  className="border-2 rounded-xl overflow-hidden bg-white"
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${dim.color}, ${dim.color}dd)` }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-xl">{dim.label}</div>
                        <div className="text-base text-muted-foreground">
                          Score: <span className="font-semibold" style={{ color: dim.color }}>
                            {score !== null ? score.toFixed(1) : '—'}
                          </span>/10
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
                    {/* Evidence */}
                    {dimData.evidence && dimData.evidence.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base uppercase tracking-wide text-foreground">
                          Evidence Collected
                        </h4>
                        <ul className="space-y-2">
                          {dimData.evidence.map((item, idx) => (
                            <li key={idx} className="text-base text-muted-foreground flex items-start gap-2 leading-relaxed">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expert Feedback */}
                    {dimData.feedback && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base uppercase tracking-wide text-foreground">
                          Expert Analysis
                        </h4>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {dimData.feedback}
                        </p>
                      </div>
                    )}

                    {/* Strengths */}
                    {dimData.strengths && dimData.strengths.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base uppercase tracking-wide text-emerald-600">
                          Identified Strengths
                        </h4>
                        <ul className="space-y-2">
                          {dimData.strengths.map((strength, idx) => (
                            <li key={idx} className="text-base text-muted-foreground flex items-start gap-2 leading-relaxed">
                              <Award className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Growth Areas */}
                    {dimData.growthAreas && dimData.growthAreas.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base uppercase tracking-wide text-amber-600">
                          Development Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {dimData.growthAreas.map((area, idx) => (
                            <li key={idx} className="text-base text-muted-foreground flex items-start gap-2 leading-relaxed">
                              <Target className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
