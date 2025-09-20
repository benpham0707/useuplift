import { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import PortfolioPathway from '@/components/portfolio/PortfolioPathway';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

  // Mock rubric scores - in real app these would come from API
  const [rubricScores, setRubricScores] = useState({
    academicExcellence: { score: null as number | null },
    leadershipPotential: { score: null as number | null },
    personalGrowth: { score: null as number | null },
    communityImpact: { score: null as number | null },
    uniqueValue: { score: null as number | null },
    futureReadiness: { score: null as number | null }
  });

  const overallScore = Math.round(
    (rubricScores.academicExcellence.score + 
     rubricScores.leadershipPotential.score + 
     rubricScores.personalGrowth.score + 
     rubricScores.communityImpact.score + 
     rubricScores.uniqueValue.score + 
     rubricScores.futureReadiness.score) / 6 * 10
  ) / 10;

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
        const resp = await fetch('/api/v1/analytics/portfolio-strength', {
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

  const completionLevels = [
    { level: 'Bronze', min: 20, color: 'bg-amber-600', description: 'Foundation Set' },
    { level: 'Silver', min: 45, color: 'bg-slate-400', description: 'Profile Building' },
    { level: 'Gold', min: 70, color: 'bg-yellow-500', description: 'Story Development' },
    { level: 'Platinum', min: 90, color: 'bg-purple-600', description: 'Application Ready' }
  ];

  const currentLevel = completionLevels.find(level => overallProgress >= level.min) || 
                      { level: 'Getting Started', color: 'bg-muted', description: 'Begin Your Journey' };

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
    <div className="min-h-screen gradient-dashboard">
      {/* Uplift Platform Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/20">
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

            {/* Right Side - User Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Portfolio Pathway Section */}
      <section id="assessment" className="w-full bg-background min-h-screen">
        <div className="w-full px-4 lg:px-6 xl:px-8 py-8">
          <PortfolioPathway
            onProgressUpdate={setOverallProgress}
            currentProgress={overallProgress}
          />
        </div>
      </section>
    </div>
  );
};

export default PortfolioScanner;