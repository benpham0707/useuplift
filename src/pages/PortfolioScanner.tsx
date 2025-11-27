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
  Link as LinkIcon,
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
  Users2,
  Settings,
  Plus,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  Briefcase,
  RefreshCw,
  LogOut,
  Rocket,
  Construction
} from 'lucide-react';
import Dock from '@/components/Dock';
// OnboardingFlow removed for V1 - users go directly to portfolio dashboard
// import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import PortfolioPathway from '@/components/portfolio/PortfolioPathway';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';
import GradientZap from '@/components/ui/GradientZap';
// StarBorder removed per revert
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Navigation from '@/components/Navigation';

const PortfolioScanner = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [overallProgress, setOverallProgress] = useState(67); // Mock preview value
  const [activeSection, setActiveSection] = useState('overview');
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiOverall, setAiOverall] = useState<number | null>(7.8); // Mock preview value
  const [aiDetailed, setAiDetailed] = useState<any | null>(null);
  const [credits, setCredits] = useState<number | null>(600); // Mock preview value
  type MetricId = 'impact' | 'academic' | 'curiosity' | 'story' | 'character';
  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [narrativeIndex, setNarrativeIndex] = useState(0);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [narratives, setNarratives] = useState<string[]>([]);
  const [unifyIndex, setUnifyIndex] = useState(0);
  const [proofIndex, setProofIndex] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const activeTweenRef = useRef<any>(null);
  const restoreSnapRef = useRef<null | (() => void)>(null);
  // Navigation handled by global Navigation component

  // Preview mode - show mock data for coming soon state
  const isPreviewMode = true;
  
  // Mock data for attractive preview
  const mockData = {
    impact: 8.2,
    academic: 8.1,
    curiosity: 7.6,
    story: 7.8,
    character: 7.3,
    progress: 67
  };

  useEffect(() => {
    try {
      gsap.registerPlugin(ScrollToPlugin);
    } catch {}
  }, []);

  // Temporarily disable CSS scroll snap during animated scroll for smoother control
  const disableScrollSnap = () => {
    const root = document.documentElement;
    const body = document.body;
    root.style.scrollSnapType = 'none';
    body.style.scrollSnapType = 'none';
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      // Always restore to mandatory snapping for this page
      root.style.scrollSnapType = 'y mandatory';
      body.style.scrollSnapType = 'y mandatory';
    };
  };

  // Fallback animator when GSAP ScrollTo isn't available
  const animateScrollFallback = (toY: number, durationMs: number) => {
    const startY = window.scrollY;
    const delta = toY - startY;
    if (Math.abs(delta) < 1) return Promise.resolve();
    const start = performance.now();
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = easeInOutCubic(t);
        window.scrollTo({ top: startY + delta * eased, behavior: 'auto' });
        if (t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  };

  const alignAfterRestore = (sectionId: string, element: HTMLElement) => {
    try {
      window.setTimeout(() => {
        // Only apply in fallback flows or when we're clearly off; avoid tiny re-adjustments
        const rect = element.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const bottomPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingBottom || '0', 10) || 0;
        const visualCenter = viewportH / 2 - bottomPad / 2;
        const delta = Math.abs(rect.top + rect.height / 2 - (sectionId === 'overview' ? 64 : visualCenter));
        if (delta > 12) {
          element.scrollIntoView({ behavior: 'auto', block: sectionId === 'overview' ? 'start' : 'center' });
        }
        try { (ScrollTrigger as any)?.refresh?.(); } catch {}
      }, 30);
    } catch {}
  };

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
    if (!element) return;
    const durationSec = 1.0;
    const hasScrollTo = Boolean((gsap as any)?.plugins && (gsap as any).plugins.ScrollToPlugin);
    // If a previous animation left snap disabled, restore it first
    try { activeTweenRef.current?.kill?.(); } catch {}
    try { restoreSnapRef.current?.(); } catch {}
    activeTweenRef.current = null;
    restoreSnapRef.current = null;

    const restore = disableScrollSnap();
    restoreSnapRef.current = restore;
    // Kill any active tween to prevent leaving snap disabled
    // (already killed above)

    if (hasScrollTo) {
      if (sectionId === 'overview') {
        const tween = gsap.to(window, {
          duration: durationSec,
          ease: 'power2.out',
          scrollTo: { y: element, offsetY: 64, autoKill: true },
          onComplete: () => { restore(); restoreSnapRef.current = null; try { (ScrollTrigger as any)?.refresh?.(); } catch {}; activeTweenRef.current = null; },
          onInterrupt: () => { restore(); restoreSnapRef.current = null; try { (ScrollTrigger as any)?.refresh?.(); } catch {}; activeTweenRef.current = null; }
        });
        activeTweenRef.current = tween;
        // hard fallback restore
        window.setTimeout(() => { try { restore(); } finally { restoreSnapRef.current = null; } }, Math.ceil(durationSec * 1000) + 100);
        return;
      }
      const rect = element.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingBottom || '0', 10) || 0;
      const visualCenter = viewportH / 2 - bottomPad / 2;
      const targetY = Math.round(window.scrollY + rect.top + rect.height / 2 - visualCenter);
      const tween = gsap.to(window, {
        duration: durationSec,
        ease: 'power2.inOut',
        scrollTo: { y: targetY, autoKill: true },
        onComplete: () => {
          restore(); restoreSnapRef.current = null;
          try { (ScrollTrigger as any)?.refresh?.(); } catch {}
          activeTweenRef.current = null;
        },
        onInterrupt: () => {
          restore(); restoreSnapRef.current = null;
          try { (ScrollTrigger as any)?.refresh?.(); } catch {}
          activeTweenRef.current = null;
        }
      });
      activeTweenRef.current = tween;
      window.setTimeout(() => { try { restore(); } finally { restoreSnapRef.current = null; } }, Math.ceil(durationSec * 1000) + 100);
      return;
    }

    // Fallback animation with the same duration
    try {
      const rect = element.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingBottom || '0', 10) || 0;
      const visualCenter = viewportH / 2 - bottomPad / 2;
      const targetY = sectionId === 'overview'
        ? Math.max(0, window.scrollY + rect.top - 64)
        : window.scrollY + rect.top + rect.height / 2 - visualCenter;
      animateScrollFallback(targetY, durationSec * 1000).finally(() => { restore(); restoreSnapRef.current = null; alignAfterRestore(sectionId, element); });
    } catch {
      element.scrollIntoView({ behavior: 'smooth', block: sectionId === 'overview' ? 'start' : 'center' });
      restore();
    }
  };

  const dockItems = [
    { icon: <Home size={18} />, label: 'Home', onClick: () => scrollToSection('overview'), className: activeSection === 'overview' ? 'is-active' : undefined },
    { icon: <User size={18} />, label: 'Personal', onClick: () => scrollToSection('personal-info'), className: activeSection === 'personal-info' ? 'is-active' : undefined },
    { icon: <GraduationCap size={18} />, label: 'Academic', onClick: () => scrollToSection('academic-journey'), className: activeSection === 'academic-journey' ? 'is-active' : undefined },
    { icon: <Briefcase size={18} />, label: 'Experiences', onClick: () => scrollToSection('experiences'), className: activeSection === 'experiences' ? 'is-active' : undefined },
    { icon: <Heart size={18} />, label: 'Family', onClick: () => scrollToSection('family'), className: activeSection === 'family' ? 'is-active' : undefined },
    { icon: <Target size={18} />, label: 'Goals', onClick: () => scrollToSection('goals'), className: activeSection === 'goals' ? 'is-active' : undefined },
    { icon: <Users2 size={18} />, label: 'Support', onClick: () => scrollToSection('support'), className: activeSection === 'support' ? 'is-active' : undefined },
    { icon: <BookOpen size={18} />, label: 'Growth', onClick: () => scrollToSection('growth'), className: activeSection === 'growth' ? 'is-active' : undefined },
    {
      icon: <RefreshCw size={18} />,
      label: 'Update',
      className: 'variant-update',
      onClick: async () => {
        try {
          setAiLoading(true);
          setAiError(null);
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          await apiFetch('/api/v1/analytics/reconcile', {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          });
          window.dispatchEvent(new CustomEvent('analytics:reconciled'));
        } catch (e: any) {
          // eslint-disable-next-line no-console
          console.error('Update reconcile failed', e);
          setAiError(e?.message || 'Failed to update analytics');
        } finally {
          setAiLoading(false);
        }
      }
    },
  ];

  // Default rubric scores - will be updated from API when available
  const [rubricScores, setRubricScores] = useState({
    academicExcellence: { score: isPreviewMode ? mockData.academic : null as number | null },
    leadershipPotential: { score: isPreviewMode ? mockData.impact : null as number | null },
    personalGrowth: { score: isPreviewMode ? 7.4 : null as number | null },
    communityImpact: { score: isPreviewMode ? mockData.character : null as number | null },
    uniqueValue: { score: isPreviewMode ? 7.5 : null as number | null },
    futureReadiness: { score: isPreviewMode ? mockData.curiosity : null as number | null }
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
    if (metric === 'impact') return (rubricScores.leadershipPotential.score || 0);
    if (metric === 'academic') return (rubricScores.academicExcellence.score || 0);
    if (metric === 'curiosity') return (rubricScores.futureReadiness.score || 0);
    if (metric === 'story') return (aiOverall || overallScore || 0);
    return (rubricScores.communityImpact.score || 0);
  };

	// Map UI metric ids to backend detailed.dimensions keys
	const metricToDimKey: Record<MetricId, string | null> = {
		impact: 'leadershipPotential',
		academic: 'academicExcellence',
		curiosity: 'futureReadiness',
		story: null, // narrative uses detailed.narrativeSummary
		character: 'communityImpact'
	};
	const getDim = (m: MetricId) => {
		const key = metricToDimKey[m];
		return key && aiDetailed?.dimensions ? (aiDetailed.dimensions as any)[key] : null;
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
      // Cast result to any to handle 'credits' column which exists in DB but might be missing from generated types
      const { data, error } = await supabase
        .from('profiles')
        .select('id, has_completed_assessment, credits')
        .eq('user_id', user.id)
        .maybeSingle() as { data: any, error: any };

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
            user_context: 'high_school_11th'
          })
          .select('id')
          .single();
        if (insertError) {
          // eslint-disable-next-line no-console
          console.error('Failed to create profile', insertError);
          setInitializing(false);
          return;
        }
        setHasCompletedOnboarding(false);
        if (!isPreviewMode) setCredits(0);
      } else {
        setHasCompletedOnboarding(data.has_completed_assessment ?? false);
        if (!isPreviewMode) setCredits(data.credits ?? 0);
      }
      setInitializing(false);
    };

    loadProfile();
  }, [user, loading, navigate]);

  // Fetch AI-powered portfolio strength
  useEffect(() => {
    async function fetchStrength() {
      try {
        if (!user) return;
        // Skip API fetch in preview mode - use mock data
        if (isPreviewMode) return;
        setAiLoading(true);
        setAiError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.warn('No token available for analytics fetch');
          return;
        }

        const resp = await apiFetch('/api/v1/analytics/portfolio-strength', {
          headers: {
            'Authorization': `Bearer ${token}`
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
		setAiDetailed(json?.detailed ?? null);
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
  }, [user]);

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
    const prevScrollPaddingBottomRoot = (root.style as any).scrollPaddingBottom;
    const prevScrollPaddingBottomBody = (body.style as any).scrollPaddingBottom;

    // Apply scroll snap to the viewport and contain momentum chaining
    root.style.scrollSnapType = 'y mandatory';
    body.style.scrollSnapType = 'y mandatory';
    root.style.overscrollBehaviorY = 'contain';
    body.style.overscrollBehaviorY = 'contain';
    // Account for sticky navbar height (h-16 ~ 64px)
    (root.style as any).scrollPaddingTop = '64px';
    (body.style as any).scrollPaddingTop = '64px';

    const updateSnapPadding = () => {
      try {
        const dock = document.querySelector('.dock-panel') as HTMLElement | null;
        const dockH = Math.ceil((dock?.getBoundingClientRect().height || 68) + 24); // include margin/hover room
        (root.style as any).scrollPaddingBottom = `${dockH}px`;
        (body.style as any).scrollPaddingBottom = `${dockH}px`;
      } catch {}
    };

    updateSnapPadding();
    window.addEventListener('resize', updateSnapPadding);
    window.addEventListener('orientationchange', updateSnapPadding);

    return () => {
      root.style.scrollSnapType = prevSnapType;
      body.style.scrollSnapType = prevBodySnapType;
      root.style.overscrollBehaviorY = prevOverscrollRoot;
      body.style.overscrollBehaviorY = prevOverscrollBody;
      (root.style as any).scrollPaddingTop = prevScrollPaddingRoot || '';
      (body.style as any).scrollPaddingTop = prevScrollPaddingBody || '';
      (root.style as any).scrollPaddingBottom = prevScrollPaddingBottomRoot || '';
      (body.style as any).scrollPaddingBottom = prevScrollPaddingBottomBody || '';
      window.removeEventListener('resize', updateSnapPadding);
      window.removeEventListener('orientationchange', updateSnapPadding);
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

  // Track active section by scroll position for dock highlighting
  useEffect(() => {
    const updateActive = () => {
      const ids = ['overview','personal-info','academic-journey','experiences','family','goals','support','growth'];
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingBottom || '0', 10) || 0;
      const visualCenter = viewportH / 2 - bottomPad / 2;
      let bestId = activeSection;
      let bestDist = Number.POSITIVE_INFINITY;
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - visualCenter);
        if (dist < bestDist) { bestDist = dist; bestId = id; }
      });
      if (bestId && bestId !== activeSection) setActiveSection(bestId);
    };
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [activeSection]);

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

  const handleNavigation = (path: string) => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-muted-foreground">Loading your profile...</div>
      </div>
    );
  }

  // Assessment flow removed for V1 - users go directly to portfolio dashboard
  // if (!hasCompletedOnboarding) { ... }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Coming Soon Banner */}
      {isPreviewMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />
            
            <div className="p-5 pt-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Construction className="h-6 w-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Portfolio Scanner Coming Soon
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-100 to-purple-100 text-purple-700">
                      In Development
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    We're building something powerful to analyze your entire portfolio. In the meantime, try our <strong>PIQ Workshop</strong> — it's ready and waiting to help you craft compelling personal insight questions.
                  </p>
                  
                  {/* CTA Button */}
                  <div className="mt-4 flex items-center gap-3">
                    <Button 
                      onClick={() => navigate('/piq-workshop')}
                      className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Try PIQ Workshop
                    </Button>
                    <span className="text-xs text-gray-500">Free to use</span>
                  </div>
                </div>
              </div>
              
              {/* Preview indicator */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Below is a preview of what's coming — scroll down to explore!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section with Scores - AcademicPlanner aesthetic */}
      <div id="overview" ref={overviewRef} className="hero-gradient hero-gradient-fade text-white snap-start snap-always relative">
        {/* Preview mode gray overlay */}
        {isPreviewMode && (
          <div className="absolute inset-0 bg-gray-900/30 pointer-events-none z-[5]" />
        )}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            {isPreviewMode && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm text-white/90">
                <Sparkles className="h-4 w-4" />
                <span>Preview Mode</span>
              </div>
            )}
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
            const impactVal = (rubricScores.leadershipPotential.score || 0);
            const academicVal = (rubricScores.academicExcellence.score || 0);
            const curiosityVal = (rubricScores.futureReadiness.score || 0);
            const storyVal = (aiOverall || overallScore);
            const characterVal = (rubricScores.communityImpact.score || 0);

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
              <Card className="relative border-2 border-white/40 bg-white/20 text-white backdrop-blur-xl shadow-strong overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" aria-hidden="true" />
                <div className="relative h-1 w-full" style={{ backgroundImage: getMetricTheme('overall').gradientCss }} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4 text-hero-contrast">
                    <CardTitle className="">Portfolio Overview</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-md text-sm font-semibold bg-white/25 no-text-shadow">
                        {(() => {
                          const showDemo = true;
                          const demo = { impact: 8.2, academic: 8.1, curiosity: 7.6, story: 7.9, character: 7.3 };
                          const impactVal = showDemo ? demo.impact : (rubricScores.leadershipPotential.score || 0);
                          const academicVal = showDemo ? demo.academic : (rubricScores.academicExcellence.score || 0);
                          const curiosityVal = showDemo ? demo.curiosity : (rubricScores.futureReadiness.score || 0);
                          const storyVal = showDemo ? demo.story : (aiOverall || overallScore || 0);
                          const characterVal = showDemo ? demo.character : (rubricScores.communityImpact.score || 0);
                          const avg = (impactVal + academicVal + curiosityVal + Number(storyVal) + characterVal) / 5;
                          return avg.toFixed(1);
                        })()} / 10
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/portfolio-insights?metric=overall')} className="text-hero-contrast no-text-shadow">
                        View full insights
                      </Button>
                    </div>
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
                        <div className="text-white/90 text-[15px] leading-7 text-hero-contrast">
                          {aiDetailed?.narrativeSummary || (() => {
                            const overall = toFixed((aiOverall ?? overallScore) || 0);
                            const strengthText = top2.map(d => d.key).join(' and ');
                            const focusText = bottom2.map(d => d.key).join(' and ');
                            if (overall >= 8.8) return `You’re operating at an application‑ready level with clear strengths in ${strengthText}. Evidence is visible and pace is consistent; your job now is to keep outcomes dense and avoid diluting the story. Prioritize depth over breadth and tighten the line from problem → action → result. Add a one‑sentence “why this matters” to each activity so the arc is unmistakable.`;
                            if (overall >= 7.8) return `You have a strong foundation with standout momentum in ${strengthText}. To hit top‑tier, unify everything under one throughline and convert more work into public, measurable outcomes. Trim or reframe items that don’t advance the arc, and add before/after numbers wherever possible. Focus attention on ${focusText} to raise the ceiling.`;
                            if (overall >= 6.8) return `You’ve built solid early progress with emerging strengths in ${strengthText}. The portfolio reads a bit fragmented—coherence and proof are the main unlocks. Choose one lane to lead with and stack small, visible artifacts around it. Concentrate on ${focusText} to create noticeable lift in the next 60–90 days.`;
                            return `This is an early‑stage profile with limited public proof. Start by naming a direction and publishing small, measurable artifacts on a two‑week cadence. Use each artifact to state the problem, what you tried, and what changed. Strengthen ${focusText} while nurturing the spark in ${strengthText}.`;
                          })()}
                        </div>

                        <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-4 text-hero-contrast">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wide">Portfolio narrative</div>
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
                          {/* Unify Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Unify</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setUnifyIndex((i) => (i + 2) % 3)} aria-label="Prev unify insight">
                                  <ChevronLeft className="h-3.5 w-3.5 text-white" />
                                </button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setUnifyIndex((i) => (i + 1) % 3)} aria-label="Next unify insight">
                                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {(() => {
                                const unify = [
                                  'Rename and reorder activities to reinforce one throughline; remove or downsize items that don’t fit.',
                                  'Group efforts under 2–3 themes (e.g., education equity, health tech); explain how each activity advances one theme.',
                                  'Rewrite activity blurbs to lead with outcomes and tie each result to the same purpose statement.',
                                ];
                                return unify[unifyIndex];
                              })()}
                            </div>
                          </div>

                          {/* Make Proof Visible Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Make proof visible</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setProofIndex((i) => (i + 2) % 3)} aria-label="Prev proof insight">
                                  <ChevronLeft className="h-3.5 w-3.5 text-white" />
                                </button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setProofIndex((i) => (i + 1) % 3)} aria-label="Next proof insight">
                                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {(() => {
                                const proof = [
                                  'Publish a small artifact every 2–3 weeks (demo, write‑up, repo, testimonial) tied to a number.',
                                  'Track impact with three metrics (people reached, hours saved, dollars raised) and show a simple before/after.',
                                  'Create a single hub page linking evidence: timeline of artifacts, quick metrics, and 1–2 quotes from beneficiaries.',
                                ];
                                return proof[proofIndex];
                              })()}
                            </div>
                          </div>

                          {/* Sequence Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Sequence</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setSequenceIndex((i) => (i + 2) % 3)} aria-label="Prev sequence insight">
                                  <ChevronLeft className="h-3.5 w-3.5 text-white" />
                                </button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setSequenceIndex((i) => (i + 1) % 3)} aria-label="Next sequence insight">
                                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {(() => {
                                const seq = [
                                  'Commit to one 60–90 day push in the weakest area; schedule weekly check‑ins and a public update.',
                                  'Plan three milestones (week 3, 6, 9) with deliverables; each milestone ends with a visible proof post.',
                                  'Pick a mentor or peer for accountability; share progress every two weeks and ask one specific question.',
                                ];
                                return seq[sequenceIndex];
                              })()}
                            </div>
                          </div>
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
                          {(() => {
                            const dim = getDim(selectedMetric as MetricId);
                            const fallback =
                              (selectedMetric === 'impact' && 'Admissions look for proof you move people and projects. Quantify outcomes (people helped, dollars raised, time saved) and show roles where others relied on you.') ||
                              (selectedMetric === 'academic' && 'Top schools value trajectory and rigor. Show a steady climb in course challenge with A-/B+ or better and highlight the toughest classes you can succeed in next.') ||
                              (selectedMetric === 'curiosity' && 'Demonstrate self-driven learning: independent projects, research outreach, or certifications. Tie exploration to a clear interest arc.') ||
                              (selectedMetric === 'story' && (aiDetailed?.narrativeSummary || 'Connect your activities to a single throughline—why you do them and what you’re building toward. Evidence beats adjectives.')) ||
                              'Translate values into community outcomes. Spotlight 1–2 commitments where you consistently show up and make a difference.';
                            return (
                              <p className="text-sm text-foreground/90 leading-6">{dim?.feedback || fallback}</p>
                            );
                          })()}
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">What top admits show</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(() => {
                                  const dim = getDim(selectedMetric as MetricId);
                                  const fb =
                                    (selectedMetric === 'impact' && 'Clear evidence of steering people and resources to a measurable win—projects that grow, teams that improve, or communities that benefit in ways you can quantify.') ||
                                    (selectedMetric === 'academic' && 'A transcript that stretches into challenging courses with a rising trajectory, paired with proof you can master difficult material.') ||
                                    (selectedMetric === 'curiosity' && 'Self-propelled exploration that turns questions into prototypes, brief write-ups, or collaborations beyond the classroom.') ||
                                    (selectedMetric === 'story' && 'A coherent narrative where choices stack toward a purpose, with results that make that purpose believable.') ||
                                    'Long-haul commitment to people or places—consistent service that leaves behind systems or outcomes others can point to.';
                                  return dim?.strengths?.[0] || fb;
                                })()}
                              </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">Your quick opportunity</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(() => {
                                  const dim = getDim(selectedMetric as MetricId);
                                  const fb =
                                    (selectedMetric === 'impact' && 'Choose one current initiative and set a 6–8 week goal tied to a number (beneficiaries, dollars, or hours saved); publish a short update when you hit it.') ||
                                    (selectedMetric === 'academic' && 'Enroll in one stretch class and pre-schedule weekly support (office hours, peer tutor); track progress with two short reflections.') ||
                                    (selectedMetric === 'curiosity' && 'Run a 4–6 week mini‑project with weekly deliverables and one mentor touchpoint; ship a public artifact at the end.') ||
                                    (selectedMetric === 'story' && 'Write a 2–3 sentence thesis for your application story and reframe your three main activities to prove it with outcomes.') ||
                                    'Pick one cause and show up weekly; capture before/after metrics or testimonials to make the benefit visible.';
                                  return dim?.growthAreas?.[0] || fb;
                                })()}
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
                            const dim = getDim(selectedMetric as MetricId);
                            const fb = ((): string[] => {
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
                            })();
                            return (dim?.growthAreas && dim.growthAreas.length > 0 ? dim.growthAreas.slice(0,4) : fb);
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
        {/* Extra scroll room to allow a longer gradient before the fade */}
        <div className="h-32 md:h-48 lg:h-64 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Divider removed for a seamless cloud-like fade into content */}

      {/* Main Content Area */}
      <main className="relative">
        {/* Preview mode gray overlay */}
        {isPreviewMode && (
          <div className="absolute inset-0 bg-gray-500/20 pointer-events-none z-[5]" />
        )}
        <PortfolioPathway 
          onProgressUpdate={isPreviewMode ? () => {} : setOverallProgress}
          currentProgress={overallProgress}
        />
        <Dock 
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
        />
      </main>
    </div>
  );
};

export default PortfolioScanner;