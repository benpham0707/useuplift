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
  Plus,
  GraduationCap,
  Heart
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

      {/* Header Section with Scores */}
      <div className="bg-gradient-to-r from-background via-primary/5 to-secondary/5 border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
              Portfolio Scanner
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Build your comprehensive profile step by step. Track your progress and unlock new opportunities.
            </p>
          </div>

          {/* Progress & Level Display */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {overallProgress}%
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Complete</div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className={`${currentLevel.color} text-white border-0`}>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold mb-2">{currentLevel.level}</div>
                <div className="text-sm opacity-90">{currentLevel.description}</div>
              </CardContent>
            </Card>
          </div>

          {/* Rubric Scores Display */}
          {(rubricScores.academicExcellence.score !== null) && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-8">
              <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Portfolio Assessment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'academicExcellence', label: 'Academic Excellence', icon: GraduationCap },
                  { key: 'leadershipPotential', label: 'Leadership Potential', icon: Users },
                  { key: 'personalGrowth', label: 'Personal Growth', icon: TrendingUp },
                  { key: 'communityImpact', label: 'Community Impact', icon: Heart },
                  { key: 'uniqueValue', label: 'Unique Value', icon: Sparkles },
                  { key: 'futureReadiness', label: 'Future Readiness', icon: Target }
                ].map(({ key, label, icon: Icon }) => {
                  const score = rubricScores[key as keyof typeof rubricScores]?.score;
                  if (score === null || score === undefined) return null;
                  
                  const styles = getScoreStyles(score);
                  
                  return (
                    <Card key={key} className="relative overflow-hidden" style={styles.boxStyle}>
                      <CardContent className="p-4 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                        <div className="text-2xl font-bold mb-1" style={styles.textStyle}>
                          {score.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {label}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Overall Score */}
              {aiOverall !== null && (
                <div className="text-center">
                  <Card className="inline-block bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Overall Portfolio Strength
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {aiOverall.toFixed(1)}/10
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
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