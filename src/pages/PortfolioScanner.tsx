import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  User, 
  Brain, 
  Target, 
  Lightbulb, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Link,
  Zap,
  Filter,
  Scale,
  MessageSquare,
  Send,
  Sparkles,
  X,
  Maximize2,
  Home,
  BarChart3,
  ListTodo,
  Award,
  ChevronDown,
  Calendar,
  BookOpen,
  Users,
  Settings,
  Plus,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check
} from 'lucide-react';
import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import PortfolioPathway from '@/components/portfolio/PortfolioPathway';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';
// StarBorder removed per revert
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PortfolioScanner = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiOverall, setAiOverall] = useState<number | null>(null);
  type MetricId = 'impact' | 'academic' | 'curiosity' | 'story' | 'character';
  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [narrativeIndex, setNarrativeIndex] = useState(0);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [narratives, setNarratives] = useState<string[]>([]);

  // Compute top two strengths for narrative generation
  const getTopTwo = () => {
    const toFixed = (n: number | null | undefined) => Number(((n ?? 0)).toFixed(1));
    const dims = [
      { key: 'Academic Rigor', code: 'academic', value: toFixed(rubricScores.academicExcellence.score) },
      { key: 'Impact & Leadership', code: 'leadership', value: toFixed(rubricScores.leadershipPotential.score) },
      { key: 'Personal Growth', code: 'growth', value: toFixed(rubricScores.personalGrowth.score) },
      { key: 'Character & Community', code: 'community', value: toFixed(rubricScores.communityImpact.score) },
      { key: 'Uniqueness', code: 'uniqueness', value: toFixed(rubricScores.uniqueValue.score) },
    ] as const;
    const sorted = [...dims].sort((a, b) => b.value - a.value);
    return [sorted[0]?.key || 'your best lane', sorted[1]?.key || 'supporting lane'] as const;
  };

  const generateNarrativeVariant = (variant: number) => {
    const [a, b] = getTopTwo();
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    const overall = Number(((aiOverall ?? overallScore) || 0).toFixed(1));
    switch (variant % 6) {
      case 0:
        return `Growing up with a single mother, I learned to take initiative early and shoulder responsibility. I now channel that resilience into ${al} and programs that support families, turning ideas into repeatable systems with measurable outcomes.`;
      case 1:
        return `I’m building depth in ${al} and translating it into community benefit through ${bl}. I publish work with clear numbers so progress compounds, attracts collaborators, and tells a credible story at an overall level around ${overall}.`;
      case 2:
        return `Curiosity leads me to turn questions into projects that serve real people. By focusing on ${al} and amplifying it with ${bl}, I make learning visible through artifacts others can use and improve.`;
      case 3:
        return `I combine ${al} with leadership so good ideas become deliverables that matter. I organize people and resources around targets, then publish results so impact lasts beyond me.`;
      case 4:
        return `My work connects personal experience with service, using ${al} and ${bl} as the engine. I build repeatable programs with feedback loops so each iteration raises the ceiling for the community.`;
      default:
        return `I’m shaping a cohesive profile by leaning into ${al} while reinforcing it with ${bl}. Each month I ship a public proof of progress, tightening the narrative and scaling real-world outcomes.`;
    }
  };

  const storageKey = user ? `uplift:narratives:${user.id}` : 'uplift:narratives:anon';

  // Initialize narratives from storage or generate defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setNarratives(parsed as string[]);
          return;
        }
      }
    } catch {}
    const defaults = Array.from({ length: 5 }, (_, i) => generateNarrativeVariant(i));
    setNarratives(defaults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persistNarratives = (next: string[]) => {
    setNarratives(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };
  const metricRefs = useRef<Record<MetricId, HTMLDivElement | null>>({ impact: null, academic: null, curiosity: null, story: null, character: null });
  const insightsPanelRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null); // header container
  const [carrotLeft, setCarrotLeft] = useState<number | null>(null);
  

  // Navigation items for portfolio scanner dropdown
  const portfolioNavigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'assessment', label: 'Assessment', icon: Target },
    { id: 'rubric', label: 'Recent Insights', icon: Award },
    { id: 'next-steps', label: 'Next Steps', icon: ListTodo }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Default rubric scores - will be updated from API when available
  const [rubricScores, setRubricScores] = useState({
    academicExcellence: { score: null as number | null },
    leadershipPotential: { score: null as number | null },
    personalGrowth: { score: null as number | null },
    communityImpact: { score: null as number | null },
    uniqueValue: { score: null as number | null },
    futureReadiness: { score: null as number | null }
  });

  const overallScore = Math.round(
    ((rubricScores.academicExcellence.score || 0) + 
     (rubricScores.leadershipPotential.score || 0) + 
     (rubricScores.personalGrowth.score || 0) + 
     (rubricScores.communityImpact.score || 0) + 
     (rubricScores.uniqueValue.score || 0) + 
     (rubricScores.futureReadiness.score || 0)) / 6 * 10
  ) / 10;

  const getHoloToneClass = (value: number) => {
    if (value < 5) return 'red';
    if (value < 7) return 'yellow';
    if (value < 9) return 'green';
    return 'blue';
  };

  const toneToColors = (tone: 'red' | 'yellow' | 'green' | 'blue') => {
    switch (tone) {
      case 'red':
        // Deeper, more saturated red without yellow bleed
        return ['#ff3b3b', '#ff6b6b', '#ff3b3b', '#ff6b6b', '#ff3b3b'];
      case 'yellow':
        // Amber/Orange → Yellow gradient for warmer energy
        return ['#ff9f1a', '#ffd166', '#ff9f1a', '#ffd166', '#ff9f1a'];
      case 'green':
        // Dark → Light green gradient (emerald to mint)
        return ['#0f9d58', '#34d399', '#0f9d58', '#34d399', '#0f9d58'];
      case 'blue':
      default:
        // Azure to lavender matching platform hero gradient
        return ['#60a5fa', '#a78bfa', '#60a5fa', '#a78bfa', '#60a5fa'];
    }
  };

  // Function to get score styling based on value
  const getScoreStyles = (score: number) => {
    let textColor = '';
    let borderColor = '';
    let boxShadow = '';
    let textShadow = '';
    
    if (score >= 9.8) {
      // Near-perfect scores - strongest glow
      textColor = 'hsl(220, 100%, 65%)';
      borderColor = 'hsl(220, 100%, 60%)';
      boxShadow = '0 0 20px hsl(220, 100%, 60% / 0.6), 0 0 40px hsl(220, 100%, 60% / 0.4), 0 0 60px hsl(220, 100%, 60% / 0.2)';
      textShadow = '0 0 15px hsl(220, 100%, 60% / 0.8), 0 0 25px hsl(220, 100%, 60% / 0.6)';
    } else if (score >= 9.0) {
      // High scores - strong blue glow
      const intensity = (score - 9) / 0.8;
      const hue = 220 + (intensity * 20);
      const saturation = 90 + (intensity * 10);
      const lightness = 55 + (intensity * 10);
      const glowIntensity = 0.4 + (intensity * 0.2); // 0.4 to 0.6
      textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
      boxShadow = `0 0 ${12 + intensity * 8}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity}), 0 0 ${24 + intensity * 16}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity * 0.6})`;
      textShadow = `0 0 ${8 + intensity * 4}px hsl(${hue}, ${saturation}%, ${lightness}% / ${0.6 + intensity * 0.2})`;
    } else if (score >= 7.0) {
      // Good scores - medium green to blue glow
      const progress = (score - 7) / 2;
      const hue = 120 + (progress * 100);
      const saturation = 70 + (progress * 20);
      const lightness = 50 + (progress * 15);
      const glowIntensity = 0.3 + (progress * 0.15); // 0.3 to 0.45
      textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
      boxShadow = `0 0 ${8 + progress * 6}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity}), 0 0 ${16 + progress * 12}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity * 0.5})`;
      textShadow = `0 0 ${6 + progress * 3}px hsl(${hue}, ${saturation}%, ${lightness}% / ${0.5 + progress * 0.15})`;
    } else if (score >= 5.0) {
      // Moderate scores - moderate yellow/orange glow
      const progress = (score - 5) / 2;
      const hue = 35 + (progress * 25);
      const saturation = 85 + (progress * 10);
      const lightness = 50 + (progress * 10);
      const glowIntensity = 0.25 + (progress * 0.1); // 0.25 to 0.35
      textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
      boxShadow = `0 0 ${6 + progress * 4}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity}), 0 0 ${12 + progress * 8}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity * 0.4})`;
      textShadow = `0 0 ${4 + progress * 2}px hsl(${hue}, ${saturation}%, ${lightness}% / ${0.4 + progress * 0.1})`;
    } else if (score >= 3.0) {
      // Low-moderate scores - mild orange glow
      const progress = (score - 3) / 2;
      const hue = 15 + (progress * 20);
      const saturation = 85 + (progress * 10);
      const lightness = 50 + (progress * 10);
      const glowIntensity = 0.2 + (progress * 0.08); // 0.2 to 0.28
      textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
      boxShadow = `0 0 ${4 + progress * 3}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity}), 0 0 ${8 + progress * 6}px hsl(${hue}, ${saturation}%, ${lightness}% / ${glowIntensity * 0.3})`;
      textShadow = `0 0 ${3 + progress * 2}px hsl(${hue}, ${saturation}%, ${lightness}% / ${0.35 + progress * 0.1})`;
    } else {
      // Low scores - subtle red glow
      const progress = score / 3;
      const saturation = 80 + (progress * 15);
      const lightness = 45 + (progress * 15);
      const glowIntensity = 0.15 + (progress * 0.05); // 0.15 to 0.2
      textColor = `hsl(0, ${saturation}%, ${lightness}%)`;
      borderColor = `hsl(0, ${saturation}%, ${lightness - 10}%)`;
      boxShadow = `0 0 ${3 + progress * 2}px hsl(0, ${saturation}%, ${lightness}% / ${glowIntensity}), 0 0 ${6 + progress * 4}px hsl(0, ${saturation}%, ${lightness}% / ${glowIntensity * 0.3})`;
      textShadow = `0 0 ${2 + progress * 1}px hsl(0, ${saturation}%, ${lightness}% / ${0.3 + progress * 0.1})`;
    }

    return {
      boxStyle: {
        borderColor: borderColor,
        boxShadow: boxShadow,
        borderWidth: '1.5px',
        borderStyle: 'solid'
      },
      textStyle: {
        color: textColor,
        textShadow: textShadow,
        fontWeight: '600'
      }
    };
  };

  // Toggle open/close when clicking the same metric; open when selecting a new one
  const handleMetricClick = (metric: MetricId) => {
    if (isInsightsOpen && selectedMetric === metric) {
      setIsInsightsOpen(false);
      return;
    }
    setSelectedMetric(metric);
    setIsInsightsOpen(true);
  };

  // Current display value for each metric (mirrors the demo mapping used in tiles)
  const getDisplayMetricValue = (metric: MetricId): number => {
    const showDemo = true;
    const demo = { impact: 8.2, academic: 8.1, curiosity: 7.6, story: 7.9, character: 7.3 } as const;
    if (metric === 'impact') return showDemo ? demo.impact : (rubricScores.leadershipPotential.score || 0);
    if (metric === 'academic') return showDemo ? demo.academic : (rubricScores.academicExcellence.score || 0);
    if (metric === 'curiosity') return showDemo ? demo.curiosity : (rubricScores.futureReadiness.score || 0);
    if (metric === 'story') return showDemo ? demo.story : (aiOverall || overallScore || 0);
    return showDemo ? demo.character : (rubricScores.communityImpact.score || 0);
  };

  // Guard route and load profile state from Supabase
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      // Fetch profile by user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, has_completed_assessment')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile', error);
      }

      if (!data) {
        // Create profile if missing
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            user_context: 'high_school_11th',
            has_completed_assessment: false,
          })
          .select('id, has_completed_assessment')
          .single();
        if (insertError) {
          // eslint-disable-next-line no-console
          console.error('Failed to create profile', insertError);
          setInitializing(false);
          return;
        }
        setHasCompletedOnboarding(Boolean(created?.has_completed_assessment));
      } else {
        setHasCompletedOnboarding(Boolean(data.has_completed_assessment));
      }
      setInitializing(false);
    };

    loadProfile();
  }, [user, loading, navigate]);

  // Fetch AI-powered portfolio strength
  useEffect(() => {
    async function fetchStrength() {
      try {
        if (!user || !hasCompletedOnboarding) return;
        setAiLoading(true);
        setAiError(null);
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const resp = await apiFetch('/api/v1/analytics/portfolio-strength', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || `Request failed: ${resp.status}`);
        }
        const json = await resp.json();
        if (typeof json?.overall === 'number') {
          setAiOverall(Number(json.overall));
        }
        const d = json?.dimensions || {};
        setRubricScores(prev => ({
          ...prev,
          academicExcellence: { ...prev.academicExcellence, score: Number(d.academic ?? prev.academicExcellence.score) },
          leadershipPotential: { ...prev.leadershipPotential, score: Number(d.leadership ?? prev.leadershipPotential.score) },
          personalGrowth: { ...prev.personalGrowth, score: Number(d.growth ?? prev.personalGrowth.score) },
          communityImpact: { ...prev.communityImpact, score: Number(d.community ?? prev.communityImpact.score) },
          uniqueValue: { ...prev.uniqueValue, score: Number(d.uniqueness ?? prev.uniqueValue.score) },
          futureReadiness: { ...prev.futureReadiness, score: Number(d.readiness ?? prev.futureReadiness.score) },
        }));
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('AI analytics error', e);
        setAiError(e?.message || 'Failed to compute portfolio strength');
      } finally {
        setAiLoading(false);
      }
    }
    fetchStrength();

    // listen for reconcile completion to auto-refresh
    const onReconciled = () => fetchStrength();
    window.addEventListener('analytics:reconciled', onReconciled);
    return () => window.removeEventListener('analytics:reconciled', onReconciled);
  }, [user, hasCompletedOnboarding]);

  // Enable scroll snapping on this page only
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevSnapType = root.style.scrollSnapType;
    const prevBodySnapType = body.style.scrollSnapType;
    const prevOverscrollRoot = root.style.overscrollBehaviorY;
    const prevOverscrollBody = body.style.overscrollBehaviorY;
    const prevScrollPaddingRoot = (root.style as any).scrollPaddingTop;
    const prevScrollPaddingBody = (body.style as any).scrollPaddingTop;

    // Apply scroll snap to the viewport and contain momentum chaining
    root.style.scrollSnapType = 'y mandatory';
    body.style.scrollSnapType = 'y mandatory';
    root.style.overscrollBehaviorY = 'contain';
    body.style.overscrollBehaviorY = 'contain';
    // Account for sticky navbar height (h-16 ~ 64px)
    (root.style as any).scrollPaddingTop = '64px';
    (body.style as any).scrollPaddingTop = '64px';

    return () => {
      root.style.scrollSnapType = prevSnapType;
      body.style.scrollSnapType = prevBodySnapType;
      root.style.overscrollBehaviorY = prevOverscrollRoot;
      body.style.overscrollBehaviorY = prevOverscrollBody;
      (root.style as any).scrollPaddingTop = prevScrollPaddingRoot || '';
      (body.style as any).scrollPaddingTop = prevScrollPaddingBody || '';
    };
  }, []);

  // Keep mandatory snapping regardless of insights state for consistent alignment

  const completionLevels = [
    { level: 'Bronze', min: 20, color: 'bg-amber-600', description: 'Foundation Set' },
    { level: 'Silver', min: 45, color: 'bg-slate-400', description: 'Profile Building' },
    { level: 'Gold', min: 70, color: 'bg-yellow-500', description: 'Story Development' },
    { level: 'Platinum', min: 90, color: 'bg-purple-600', description: 'Application Ready' }
  ];

  const currentLevel = completionLevels.find(level => overallProgress >= level.min) || 
                      { level: 'Getting Started', color: 'bg-muted', description: 'Begin Your Journey' };

  const getMetricTheme = (metric: 'overall' | 'completion' | 'academic' | 'leadership' | 'growth' | 'uniqueness') => {
    const overallVal = (aiOverall ?? overallScore) || 0;
    const completionVal = overallProgress / 10; // reuse tone mapping 0-10
    const academicVal = rubricScores.academicExcellence.score || 0;
    const leadershipVal = rubricScores.leadershipPotential.score || 0;
    const growthVal = rubricScores.personalGrowth.score || 0;
    const uniqueVal = rubricScores.uniqueValue.score || 0;
    const value = metric === 'overall' ? overallVal : metric === 'completion' ? completionVal : metric === 'academic' ? academicVal : metric === 'leadership' ? leadershipVal : metric === 'growth' ? growthVal : uniqueVal;
    const tone = getHoloToneClass(value) as any;
    const colors = toneToColors(tone);
    const start = colors[0];
    const end = colors[1];
    const gradientCss = `linear-gradient(90deg, ${start}, ${end})`;
    return { start, end, gradientCss };
  };

  // helper to compute carrot alignment under the selected metric
  useEffect(() => {
    const updateCarrot = () => {
      if (!selectedMetric || !isInsightsOpen) {
        setCarrotLeft(null);
        return;
      }
      const el = metricRefs.current[selectedMetric as MetricId];
      const panel = insightsPanelRef.current;
      if (!el || !panel) return;
      const rect = el.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      setCarrotLeft(centerX - panelRect.left);
    };
    updateCarrot();
    window.addEventListener('resize', updateCarrot);
    window.addEventListener('scroll', updateCarrot, { passive: true });
    return () => {
      window.removeEventListener('resize', updateCarrot);
      window.removeEventListener('scroll', updateCarrot);
    };
  }, [selectedMetric, isInsightsOpen]);

  // When insights toggle/metric changes, refresh thresholds and nudge scroll to the header snap point for alignment
  useEffect(() => {
    // small timeout to allow layout to settle
    const t = window.setTimeout(() => {
      // Keep a consistent snap padding so center alignment remains correct
      const root = document.documentElement;
      const body = document.body;
      (root.style as any).scrollPaddingTop = '64px';
      (body.style as any).scrollPaddingTop = '64px';
      // If insights are open and we're within the header viewport range, nudge to its snap-start to realign
      if (isInsightsOpen && overviewRef.current) {
        const rect = overviewRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const isHeaderMostlyInView = rect.top > -rect.height * 0.5 && rect.bottom < viewportH + rect.height * 0.5;
        if (isHeaderMostlyInView) {
          overviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      // refresh ScrollTrigger so thresholds account for new layout
      try { (ScrollTrigger as any)?.refresh?.(); } catch {}
    }, 10);
    return () => window.clearTimeout(t);
  }, [isInsightsOpen, selectedMetric]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-muted-foreground">Loading your profile...</div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <OnboardingFlow onComplete={async () => {
            if (!user) return;
            await supabase
              .from('profiles')
              .update({ has_completed_assessment: true })
              .eq('user_id', user.id);
            setHasCompletedOnboarding(true);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Uplift Platform Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/10 dark:bg-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/5 border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Uplift Logo */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-xl font-bold text-primary hover:text-primary/80"
              >
                <Home className="h-5 w-5" />
                <span>Uplift</span>
              </Button>
            </div>

            {/* Main Platform Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Platform Overview */}
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Platform
              </Button>
              
              {/* Features Dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost"
                  size="sm"
                  onMouseEnter={() => setIsFeaturesDropdownOpen(true)}
                  onMouseLeave={() => setIsFeaturesDropdownOpen(false)}
                  className="flex items-center space-x-1 hover-glow-blue transition-all duration-300"
                >
                  <span>Features</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {/* Features Dropdown Menu */}
                {isFeaturesDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-[60]"
                    onMouseEnter={() => setIsFeaturesDropdownOpen(true)}
                    onMouseLeave={() => setIsFeaturesDropdownOpen(false)}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/extracurricular-optimizer');
                          setIsFeaturesDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center space-x-2 text-foreground hover-glow-blue"
                      >
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Next Moves Engine</div>
                          <div className="text-xs text-muted-foreground">Strategic development planning</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/academic-planner');
                          setIsFeaturesDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center space-x-2 text-foreground hover-glow-blue"
                      >
                        <BookOpen className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Academic Planner</div>
                          <div className="text-xs text-muted-foreground">Course and grade optimization</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Portfolio Scanner Dropdown */}
              <div className="relative">
                <Button 
                  variant={activeSection ? "secondary" : "ghost"}
                  size="sm"
                  onMouseEnter={() => setIsPortfolioDropdownOpen(true)}
                  onMouseLeave={() => setIsPortfolioDropdownOpen(false)}
                  className="flex items-center space-x-1"
                >
                  <span>Portfolio Scanner</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {/* Dropdown Menu */}
                {isPortfolioDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-[60]"
                    onMouseEnter={() => setIsPortfolioDropdownOpen(true)}
                    onMouseLeave={() => setIsPortfolioDropdownOpen(false)}
                  >
                    <div className="py-2">
                      {portfolioNavigationItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            scrollToSection(item.id);
                            setIsPortfolioDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center space-x-2 ${
                            activeSection === item.id ? 'bg-muted text-primary' : 'text-foreground'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section with Scores - AcademicPlanner aesthetic */}
      <div id="overview" ref={overviewRef} className="hero-gradient text-white snap-start snap-always">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Portfolio Dashboard
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Build your comprehensive profile step by step. Track your progress and unlock new opportunities.
            </p>
          </div>

          {/* Profile Completion */}
          <div className="mb-8">
            <div className="rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md p-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs uppercase tracking-wide text-white/85">Profile Completion</div>
                <div className="text-xs font-semibold text-white/95">{overallProgress}%</div>
              </div>
              <div className="mt-2">
                <Progress value={overallProgress} className="h-3.5 bg-white/25" />
              </div>
            </div>
          </div>

          {/* Five Key Metrics grid */}
          {(() => {
            const showDemo = true;
            const demo = { impact: 8.2, academic: 8.1, curiosity: 7.6, story: 7.9, character: 7.3 };
            const impactVal = showDemo ? demo.impact : (rubricScores.leadershipPotential.score || 0);
            const academicVal = showDemo ? demo.academic : (rubricScores.academicExcellence.score || 0);
            const curiosityVal = showDemo ? demo.curiosity : (rubricScores.futureReadiness.score || 0);
            const storyVal = showDemo ? demo.story : (aiOverall || overallScore);
            const characterVal = showDemo ? demo.character : (rubricScores.communityImpact.score || 0);

            return (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                <div className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer" ref={(el) => (metricRefs.current.impact = el)} onClick={() => handleMetricClick('impact')}>
                  <GradientText 
                    className="text-3xl font-bold metric-value"
                    colors={toneToColors(getHoloToneClass(impactVal) as any)}
                    animationSpeed={10}
                    showBorder={false}
                    textOnly
                  >
                    {impactVal.toFixed(1)}
                  </GradientText>
                  <div className="text-sm metric-label font-semibold mt-1">Impact & Leadership</div>
                </div>
                <div className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer" ref={(el) => (metricRefs.current.academic = el)} onClick={() => handleMetricClick('academic')}>
                  <GradientText
                    className="text-3xl font-bold metric-value"
                    colors={toneToColors(getHoloToneClass(academicVal) as any)}
                    animationSpeed={10}
                    showBorder={false}
                    textOnly
                  >
                    {academicVal.toFixed(1)}
                  </GradientText>
                  <div className="text-sm metric-label font-semibold mt-1">Academic Performance</div>
                </div>
                <div className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer" ref={(el) => (metricRefs.current.curiosity = el)} onClick={() => handleMetricClick('curiosity')}>
                  <GradientText
                    className="text-3xl font-bold metric-value"
                    colors={toneToColors(getHoloToneClass(curiosityVal) as any)}
                    animationSpeed={10}
                    showBorder={false}
                    textOnly
                  >
                    {curiosityVal.toFixed(1)}
                  </GradientText>
                  <div className="text-sm metric-label font-semibold mt-1">Intellectual Curiosity</div>
                </div>
                <div className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer" ref={(el) => (metricRefs.current.story = el)} onClick={() => handleMetricClick('story')}>
                  <GradientText
                    className="text-3xl font-bold metric-value"
                    colors={toneToColors(getHoloToneClass(storyVal) as any)}
                    animationSpeed={10}
                    showBorder={false}
                    textOnly
                  >
                    {storyVal.toFixed(1)}
                  </GradientText>
                  <div className="text-sm metric-label font-semibold mt-1">Storytelling</div>
                </div>
                <div className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer" ref={(el) => (metricRefs.current.character = el)} onClick={() => handleMetricClick('character')}>
                  <GradientText
                    className="text-3xl font-bold metric-value"
                    colors={toneToColors(getHoloToneClass(characterVal) as any)}
                    animationSpeed={10}
                    showBorder={false}
                    textOnly
                  >
                    {characterVal.toFixed(1)}
                  </GradientText>
                  <div className="text-sm metric-label font-semibold mt-1">Character & Community</div>
                </div>
              </div>
            );
          })()}

          {/* Portfolio Overview (shown when insights panel is collapsed) */}
          {!isInsightsOpen && (
            <div className="mt-6">
              <Card className="border-2 border-white/30 bg-white/20 text-white backdrop-blur-md shadow-medium overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundImage: getMetricTheme('overall').gradientCss }} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-white">Portfolio Overview</CardTitle>
                    <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-white/25">{((aiOverall ?? overallScore) || 0).toFixed(1)} / 10</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const toFixed = (n: number | null | undefined) => Number(((n ?? 0)).toFixed(1));
                    const dims = [
                      { key: 'Academic Rigor', code: 'academic', value: toFixed(rubricScores.academicExcellence.score) },
                      { key: 'Impact & Leadership', code: 'leadership', value: toFixed(rubricScores.leadershipPotential.score) },
                      { key: 'Personal Growth', code: 'growth', value: toFixed(rubricScores.personalGrowth.score) },
                      { key: 'Character & Community', code: 'community', value: toFixed(rubricScores.communityImpact.score) },
                      { key: 'Uniqueness', code: 'uniqueness', value: toFixed(rubricScores.uniqueValue.score) },
                    ] as const;

                    const sorted = [...dims].sort((a, b) => b.value - a.value);
                    const top2 = sorted.slice(0, 2);
                    const bottom2 = sorted.slice(-2).reverse();

                    const tips: Record<string, string> = {
                      academic: 'Increase course challenge with a pre-planned support system and external benchmarks.',
                      leadership: 'Own outcomes with clear numbers; lead a small team or train peers.',
                      growth: 'Ship a public artifact every 4–6 weeks and reflect briefly on the result.',
                      community: 'Show consistent service with before/after proof and a stakeholder quote.',
                      uniqueness: 'Clarify the throughline and trim activities that don’t reinforce it.',
                    };

                    return (
                      <div className="space-y-5">
                        <div className="text-white/90 text-[15px] leading-7">
                          {(() => {
                            const overall = toFixed((aiOverall ?? overallScore) || 0);
                            const strengthText = top2.map(d => d.key).join(' and ');
                            const focusText = bottom2.map(d => d.key).join(' and ');
                            if (overall >= 8.8) return `You’re operating at an application‑ready level with clear strengths in ${strengthText}. Protect focus and keep outcomes visible. Your next gains come from crisp storytelling and evidence density rather than adding more activities.`;
                            if (overall >= 7.8) return `You have a strong foundation with standout momentum in ${strengthText}. To break into top‑tier, shape a single narrative throughline and convert work into public, measurable outcomes. Primary attention: ${focusText}.`;
                            if (overall >= 6.8) return `Good velocity and emerging strengths in ${strengthText}. The portfolio needs tighter coherence and proof of impact. Prioritize ${focusText} and publish small, frequent artifacts that make your direction undeniable.`;
                            return `You’re early in the build. Clarify a direction, choose one lane to push, and make progress visible every 2–3 weeks. Start by strengthening ${focusText} while preserving the spark in ${strengthText}.`;
                          })()}
                        </div>

                        <div className="rounded-lg border border-white/25 bg-white/10 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wide text-white/80">Suggested narrative</div>
                            <div className="flex items-center gap-2">
                              {!isEditingNarrative && (
                                <button
                                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
                                  onClick={() => { setNarrativeDraft(narratives[narrativeIndex] || ''); setIsEditingNarrative(true); }}
                                  aria-label="Edit narrative"
                                >
                                  <Pencil className="h-4 w-4 text-white" />
                                </button>
                              )}
                              <button
                                className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                                onClick={() => setNarrativeIndex((i) => (i - 1 + 5) % 5)}
                                aria-label="Previous narrative"
                              >
                                <ChevronLeft className="h-4 w-4 text-white" />
                              </button>
                              <button
                                className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                                onClick={() => setNarrativeIndex((i) => (i + 1) % 5)}
                                aria-label="Next narrative"
                              >
                                <ChevronRight className="h-4 w-4 text-white" />
                              </button>
                              {!isEditingNarrative && (
                                <button
                                  className="ml-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs transition"
                                  onClick={() => {
                                    const next = [...narratives];
                                    next[narrativeIndex] = generateNarrativeVariant(narrativeIndex + Math.floor(Math.random() * 6));
                                    persistNarratives(next);
                                  }}
                                >Regenerate</button>
                              )}
                            </div>
                          </div>
                          {!isEditingNarrative ? (
                            <div className="text-white/95 text-sm leading-6">
                              {narratives[narrativeIndex]}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                value={narrativeDraft}
                                onChange={(e) => setNarrativeDraft(e.target.value)}
                                placeholder="Write your narrative angle here..."
                                className="bg-white/20 text-white placeholder:text-white/60 min-h-[80px]"
                              />
                              <div className="flex justify-end">
                                <Button size="sm" variant="secondary" onClick={() => { const next = [...narratives]; next[narrativeIndex] = narrativeDraft.trim(); persistNarratives(next); setIsEditingNarrative(false); }}>
                                  <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                            <div className="text-xs uppercase tracking-wide text-white/80 mb-1">Unify</div>
                            <div className="text-white/95 text-sm">Rename and reorder activities to reinforce one throughline; remove or downsize items that don’t fit.</div>
                          </div>
                          <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                            <div className="text-xs uppercase tracking-wide text-white/80 mb-1">Make proof visible</div>
                            <div className="text-white/95 text-sm">Publish a small artifact every 2–3 weeks (demo, write‑up, repo, testimonial) tied to a number.</div>
                          </div>
                          <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                            <div className="text-xs uppercase tracking-wide text-white/80 mb-1">Sequence</div>
                            <div className="text-white/95 text-sm">Commit to one 60–90 day push in the weakest area; schedule weekly check‑ins and a public update.</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-wide text-white/80 mb-1">30 / 60 / 90 plan</div>
                          <ul className="text-sm text-white/95 space-y-1">
                            <li className="flex items-start gap-2"><Target className="h-4 w-4 mt-0.5" /> Choose one focus lane and define a numeric goal.</li>
                            <li className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-0.5" /> Ship one public artifact; request feedback from a mentor.</li>
                            <li className="flex items-start gap-2"><TrendingUp className="h-4 w-4 mt-0.5" /> Quantify impact and update your portfolio with outcomes.</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insights inside hero gradient */}
          <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
            {selectedMetric && (
              <CollapsibleContent>
                <div
                  className="rounded-2xl border shadow-xl relative overflow-hidden my-6 max-w-7xl mx-auto"
                  ref={insightsPanelRef}
                  style={{
                    borderColor: 'rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <div className="h-1 w-full" style={{ backgroundImage: getMetricTheme((selectedMetric === 'impact' ? 'leadership' : selectedMetric === 'curiosity' ? 'growth' : selectedMetric === 'story' ? 'overall' : selectedMetric === 'character' ? 'uniqueness' : selectedMetric) as any).gradientCss }} />
                  {carrotLeft !== null && (
                    <div
                      className="absolute -top-2 h-3.5 w-3.5 rotate-45"
                      style={{
                        left: Math.max(12, Math.min(carrotLeft - 7, (insightsPanelRef.current?.clientWidth || 0) - 14)),
                        backgroundImage: getMetricTheme((selectedMetric === 'impact' ? 'leadership' : selectedMetric === 'curiosity' ? 'growth' : selectedMetric === 'story' ? 'overall' : selectedMetric === 'character' ? 'uniqueness' : selectedMetric) as any).gradientCss,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                          {(selectedMetric === 'impact' && 'Impact & Leadership - Insights') ||
                           (selectedMetric === 'academic' && 'Academic Rigor - Insights') ||
                           (selectedMetric === 'curiosity' && 'Intellectual Curiosity - Insights') ||
                           (selectedMetric === 'story' && 'Storytelling - Insights') ||
                           'Character & Community - Insights'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const param =
                              selectedMetric === 'impact' ? 'leadershipPotential' :
                              selectedMetric === 'academic' ? 'academicExcellence' :
                              selectedMetric === 'curiosity' ? 'futureReadiness' :
                              selectedMetric === 'story' ? 'overall' :
                              'communityImpact';
                            const qp = new URLSearchParams({ metric: param });
                            navigate(`/portfolio-insights?${qp.toString()}`);
                          }}
                        >
                          View all insights
                        </Button>
                        <button
                          className="text-muted-foreground hover:text-foreground transition"
                          onClick={() => setIsInsightsOpen(false)}
                          aria-label="Close insights"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid md:grid-cols-1 gap-8">
                      <section className="space-y-1">
                        <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Overview</div>
                        <div className="space-y-2">
                          <p className="text-sm text-foreground/90 leading-6">
                            {selectedMetric === 'impact' && 'Admissions look for proof you move people and projects. Quantify outcomes (people helped, dollars raised, time saved) and show roles where others relied on you.'}
                            {selectedMetric === 'academic' && 'Top schools value trajectory and rigor. Show a steady climb in course challenge with A-/B+ or better and highlight the toughest classes you can succeed in next.'}
                            {selectedMetric === 'curiosity' && 'Demonstrate self-driven learning: independent projects, research outreach, or certifications. Tie exploration to a clear interest arc.'}
                            {selectedMetric === 'story' && 'Connect your activities to a single throughline—why you do them and what you’re building toward. Evidence beats adjectives.'}
                            {selectedMetric === 'character' && 'Translate values into community outcomes. Spotlight 1–2 commitments where you consistently show up and make a difference.'}
                          </p>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">What top admits show</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {selectedMetric === 'impact' && 'Clear evidence of steering people and resources to a measurable win—projects that grow, teams that improve, or communities that benefit in ways you can quantify.'}
                                {selectedMetric === 'academic' && 'A transcript that stretches into challenging courses with a rising trajectory, paired with proof you can master difficult material.'}
                                {selectedMetric === 'curiosity' && 'Self-propelled exploration that turns questions into prototypes, brief write-ups, or collaborations beyond the classroom.'}
                                {selectedMetric === 'story' && 'A coherent narrative where choices stack toward a purpose, with results that make that purpose believable.'}
                                {selectedMetric === 'character' && 'Long-haul commitment to people or places—consistent service that leaves behind systems or outcomes others can point to.'}
                              </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">Your quick opportunity</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {selectedMetric === 'impact' && 'Choose one current initiative and set a 6–8 week goal tied to a number (beneficiaries, dollars, or hours saved); publish a short update when you hit it.'}
                                {selectedMetric === 'academic' && 'Enroll in one stretch class and pre-schedule weekly support (office hours, peer tutor); track progress with two short reflections.'}
                                {selectedMetric === 'curiosity' && 'Run a 4–6 week mini‑project with weekly deliverables and one mentor touchpoint; ship a public artifact at the end.'}
                                {selectedMetric === 'story' && 'Write a 2–3 sentence thesis for your application story and reframe your three main activities to prove it with outcomes.'}
                                {selectedMetric === 'character' && 'Pick one cause and show up weekly; capture before/after metrics or testimonials to make the benefit visible.'}
                              </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">Distance to top tier</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(() => {
                                  const current = getDisplayMetricValue(selectedMetric || 'impact');
                                  const target = 9.2;
                                  const gap = Math.max(0, Number((target - current).toFixed(1)));
                                  return gap === 0 ? 'You are performing at or above typical Top‑25 admit levels—focus on sustaining visible outcomes.' : `${gap} points from a typical Top‑25 admit profile—close it with 2–3 focused moves in the next 60–90 days.`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <hr className="border-t border-black/10" />

                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm uppercase tracking-wide text-muted-foreground">Top 4 Improvements</div>
                        </div>
                        <ol className="mt-1 grid md:grid-cols-2 gap-x-6 gap-y-3">
                          {(() => {
                            if (selectedMetric === 'impact') return [
                              'Quantify your outcomes by reporting people helped, revenue raised, or hours saved for each major initiative.',
                              'Elevate your responsibility by training peers or leading a small sub-team with clear goals and check-ins.',
                              'Ship one visible deliverable within 6–8 weeks and communicate results to the stakeholders who benefit.',
                              'Document proof with one or two public links (website, repo, media, or a short testimonial).'
                            ];
                            if (selectedMetric === 'academic') return [
                              'Add one stretch course next term and write an explicit support plan that includes office hours or tutoring.',
                              'Visualize your semester-by-semester grade trend and annotate what changed to drive improvement.',
                              'Take an external benchmark (AP/IB/dual-enroll/competition) to validate your readiness for rigor.',
                              'Publish a brief reflection that explains a hard concept you mastered and why it matters for your interests.'
                            ];
                            if (selectedMetric === 'curiosity') return [
                              'Launch a 6‑week independent project with weekly milestones and one guiding research question.',
                              'Email one mentor or researcher for feedback and summarize the three most important insights you gained.',
                              'Produce a tangible artifact such as a public repo, prototype, short paper, or tutorial video.',
                              'Connect the project to your longer arc with a clear statement of the next experiment.'
                            ];
                            if (selectedMetric === 'story') return [
                              'Draft a 2–3 sentence thesis that explains your why and the impact you aim to create.',
                              'Align your top three activities under this thesis and downsize items that do not reinforce it.',
                              'Rewrite activity descriptions to lead with outcomes and concrete evidence instead of duties.',
                              'Secure one recommendation that explicitly reinforces this thesis with specific examples.'
                            ];
                            return [
                              'Choose one or two causes and commit weekly time for the next two months to create continuity.',
                              'Measure who benefits and how by capturing before/after numbers or brief testimonials.',
                              'Add one leadership act within your service work such as coordination, training, or resource design.',
                              'Attach a visible proof link (program page, photo log, letter, or media mention).'
                            ];
                          })().map((p, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                                style={{ backgroundImage: getMetricTheme((selectedMetric === 'impact' ? 'leadership' : selectedMetric === 'curiosity' ? 'growth' : selectedMetric === 'story' ? 'overall' : selectedMetric === 'character' ? 'uniqueness' : selectedMetric) as any).gradientCss }}
                              >
                                {i + 1}
                              </span>
                              <span className="text-[14px] text-foreground leading-6">{p}</span>
                            </li>
                          ))}
                        </ol>
                      </section>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>

          {/* Secondary metrics row removed to avoid repetition */}
        </div>
        {/* Extra scroll room at end of header (not a snap target) */}
        <div className="h-24 md:h-40 lg:h-56 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Soft divider between header and journey */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="my-8 md:my-12 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>

      {/* Main Content Area */}
      <main className="relative">
        <PortfolioPathway 
          onProgressUpdate={setOverallProgress}
          currentProgress={overallProgress}
        />
      </main>
    </div>
  );
};

export default PortfolioScanner;