import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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
  Award,
  ChevronDown,
  Calendar,
  BookOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import AssessmentDashboard from '@/components/portfolio/AssessmentDashboard';
import InsightDashboard from '@/components/InsightDashboard';
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

  // Navigation items for portfolio scanner dropdown
  const portfolioNavigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'assessment', label: 'Assessment', icon: Target },
    { id: 'rubric', label: 'Recent Insights', icon: Award }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mock rubric scores - in real app these would come from API
  const [rubricScores] = useState({
    academicExcellence: { score: 7.2, evidence: ['3.5 GPA while working'], feedback: 'Strong performance given constraints' },
    leadershipPotential: { score: 9.9, evidence: ['Family coordination', 'Work leadership'], feedback: 'Natural leadership in multiple contexts' },
    personalGrowth: { score: 6.8, evidence: ['Overcame financial challenges'], feedback: 'Resilience and adaptation' },
    communityImpact: { score: 5.4, evidence: ['Volunteer work'], feedback: 'Room for expansion' },
    uniqueValue: { score: 8.7, evidence: ['Bilingual', 'Cultural bridge'], feedback: 'Distinctive perspective' },
    futureReadiness: { score: 1.8, evidence: ['Clear goals', 'Planning ahead'], feedback: 'Good direction, needs detail' }
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
    if (score >= 9.8) {
      // Special effects for near-perfect scores - background AND text effects, fully opaque
      return {
        boxStyle: {
          background: 'linear-gradient(135deg, hsl(220, 100%, 50%), hsl(240, 100%, 70%))',
          boxShadow: '0 0 25px rgba(59, 130, 246, 1), 0 0 50px rgba(59, 130, 246, 0.8), 0 0 75px rgba(59, 130, 246, 0.6)',
          border: '2px solid hsl(220, 100%, 60%)'
        },
        textStyle: {
          color: 'white',
          textShadow: '0 0 15px rgba(255, 255, 255, 1), 0 0 25px rgba(255, 255, 255, 0.8)'
        }
      };
    } else {
      // For all other scores, keep box background as white/10 and only change text color
      let textColor = '';
      
      if (score >= 9.0) {
        // Glowing blue for 9-9.8
        const intensity = (score - 9) / 0.8; // 0 to 1
        const hue = 220 + (intensity * 20); // 220 to 240
        const saturation = 90 + (intensity * 10); // 90% to 100%
        const lightness = 60 + (intensity * 10); // 60% to 70%
        textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } else if (score >= 7.0) {
        // Green transitioning to blue for 7-9
        const progress = (score - 7) / 2; // 0 to 1
        const hue = 120 - (progress * 100); // 120 (green) to 220 (blue)
        const saturation = 70 + (progress * 20); // 70% to 90%
        const lightness = 50 + (progress * 20); // 50% to 70%
        textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } else if (score >= 5.0) {
        // Yellow transitioning from orange for 5-7
        const progress = (score - 5) / 2; // 0 to 1
        const hue = 35 + (progress * 25); // 35 (orange) to 60 (yellow)
        const saturation = 85 + (progress * 10); // 85% to 95%
        const lightness = 45 + (progress * 10); // 45% to 55%
        textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } else if (score >= 3.0) {
        // Orange transitioning from red for 3-5
        const progress = (score - 3) / 2; // 0 to 1
        const hue = 0 + (progress * 35); // 0 (red) to 35 (orange)
        const saturation = 85 + (progress * 10); // 85% to 95%
        const lightness = 45 + (progress * 10); // 45% to 55%
        textColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } else {
        // Red for 0-3
        const progress = score / 3; // 0 to 1
        const saturation = 80 + (progress * 15); // 80% to 95%
        const lightness = 40 + (progress * 15); // 40% to 55%
        textColor = `hsl(0, ${saturation}%, ${lightness}%)`;
      }

      return {
        boxStyle: {}, // Keep default box styling
        textStyle: {
          color: textColor
        }
      };
    }
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
    <div className="min-h-screen bg-background">
      {/* Uplift Platform Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
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
              
              {/* Features */}
              <Button variant="ghost" size="sm">
                Features
              </Button>
              
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
                            activeSection === item.id ? 'bg-muted text-primary font-medium' : 'text-foreground'
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
              
              {/* AI Tools */}
              <Button variant="ghost" size="sm">
                AI Tools
              </Button>
              
              {/* Calendar */}
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </div>

            {/* User Info & Auth */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => navigate('/auth')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Platform
              </Button>
              <Button variant="ghost" size="sm">
                Features
              </Button>
              {portfolioNavigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center space-x-1"
                >
                  <item.icon className="h-3 w-3" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Overview Section */}
      <section id="overview">
      {/* Dramatic Overall Score Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">{overallScore}</div>
            <div className="text-xl opacity-90">Overall Portfolio Strength</div>
            <div className="text-sm opacity-75 mt-2">Out of 10.0 • Based on 6 key dimensions</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.academicExcellence.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.academicExcellence.score).textStyle}
              >
                {rubricScores.academicExcellence.score}
              </div>
              <div className="text-xs opacity-75">Academic</div>
            </div>
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.leadershipPotential.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.leadershipPotential.score).textStyle}
              >
                {rubricScores.leadershipPotential.score}
              </div>
              <div className="text-xs opacity-75">Leadership</div>
            </div>
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.personalGrowth.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.personalGrowth.score).textStyle}
              >
                {rubricScores.personalGrowth.score}
              </div>
              <div className="text-xs opacity-75">Growth</div>
            </div>
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.communityImpact.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.communityImpact.score).textStyle}
              >
                {rubricScores.communityImpact.score}
              </div>
              <div className="text-xs opacity-75">Community</div>
            </div>
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.uniqueValue.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.uniqueValue.score).textStyle}
              >
                {rubricScores.uniqueValue.score}
              </div>
              <div className="text-xs opacity-75">Uniqueness</div>
            </div>
            <div 
              className="bg-white/10 rounded-lg p-3 transition-all duration-300"
              style={getScoreStyles(rubricScores.futureReadiness.score).boxStyle}
            >
              <div 
                className="text-lg font-semibold transition-colors duration-300" 
                style={getScoreStyles(rubricScores.futureReadiness.score).textStyle}
              >
                {rubricScores.futureReadiness.score}
              </div>
              <div className="text-xs opacity-75">Readiness</div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Header */}
      <div className="bg-gradient-subtle border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portfolio Scanner</h1>
              <p className="text-muted-foreground mt-1">Transform your experiences into compelling narratives</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <Badge variant="secondary" className={`${currentLevel.color} text-white`}>
                {currentLevel.level}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{currentLevel.description}</p>
              <Button variant="outline" onClick={async () => { await signOut(); navigate('/auth'); }}>
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Overall Progress</span>
              <span>{overallProgress}% Complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>
      </div>
      </section>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Assessment Section */}
        <section id="assessment">
        <AssessmentDashboard
          onProgressUpdate={setOverallProgress}
          currentProgress={overallProgress}
        />

        {/* Enhanced Progress Cards */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedProgressCard
            icon={User}
            title="Profile Strength"
            subtitle="Overall readiness analysis"
            mainProgress={Math.round((rubricScores.academicExcellence.score + rubricScores.leadershipPotential.score) / 2 * 10)}
            subMetrics={[
              { label: 'Academic', value: Math.round(rubricScores.academicExcellence.score * 10), color: 'bg-blue-500' },
              { label: 'Leadership', value: Math.round(rubricScores.leadershipPotential.score * 10), color: 'bg-green-500' },
              { label: 'Evidence', value: 78, color: 'bg-purple-500' }
            ]}
            action="View Full Analysis"
          />
          <EnhancedProgressCard
            icon={Brain}
            title="Skills Discovery"
            subtitle="Hidden strengths revealed"
            mainProgress={Math.round((rubricScores.uniqueValue.score + rubricScores.personalGrowth.score) / 2 * 10)}
            subMetrics={[
              { label: 'Identified', value: Math.round(rubricScores.uniqueValue.score * 10), color: 'bg-orange-500' },
              { label: 'Documented', value: Math.round(rubricScores.personalGrowth.score * 10), color: 'bg-teal-500' },
              { label: 'Validated', value: 65, color: 'bg-pink-500' }
            ]}
            action="Discover More"
          />
          <EnhancedProgressCard
            icon={Target}
            title="Goal Alignment"
            subtitle="Opportunities matched"
            mainProgress={Math.round((rubricScores.futureReadiness.score + rubricScores.communityImpact.score) / 2 * 10)}
            subMetrics={[
              { label: 'Readiness', value: Math.round(rubricScores.futureReadiness.score * 10), color: 'bg-indigo-500' },
              { label: 'Impact', value: Math.round(rubricScores.communityImpact.score * 10), color: 'bg-red-500' },
              { label: 'Matches', value: 42, color: 'bg-yellow-500' }
            ]}
            action="Find Opportunities"
          />
          <EnhancedProgressCard
            icon={TrendingUp}
            title="Enhancement Plan"
            subtitle="Strategic improvements"
            mainProgress={Math.round(((10 - rubricScores.communityImpact.score) * 10))}
            subMetrics={[
              { label: 'Priority', value: 85, color: 'bg-red-500' },
              { label: 'Feasibility', value: 92, color: 'bg-green-500' },
              { label: 'Impact', value: 78, color: 'bg-blue-500' }
            ]}
            action="View Plan"
          />
        </div>

        {/* Recent Insights */}
        <Card className="mt-8 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recent Insights & Cross-Feature Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightDashboard />
          </CardContent>
        </Card>
        </section>
      </div>
    </div>
  );
};

interface EnhancedProgressCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  mainProgress: number;
  subMetrics: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  action: string;
}

const EnhancedProgressCard = ({ icon: Icon, title, subtitle, mainProgress, subMetrics, action }: EnhancedProgressCardProps) => (
  <Card className="hover-lift cursor-pointer transition-all duration-200 shadow-medium">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <Icon className="h-6 w-6 text-primary" />
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{mainProgress}%</div>
          <div className="text-xs text-muted-foreground">Overall</div>
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      
      <div className="space-y-2 mb-4">
        {subMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${metric.color}`} />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <span className="text-xs font-medium">{metric.value}%</span>
          </div>
        ))}
      </div>
      
      <Progress value={mainProgress} className="h-2 mb-3" />
      
      <Button variant="ghost" size="sm" className="w-full justify-between text-primary">
        {action}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
);

export default PortfolioScanner;
