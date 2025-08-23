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
  ListTodo,
  Award,
  ChevronDown,
  Calendar,
  BookOpen,
  Users,
  Settings
} from 'lucide-react';
import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import AssessmentDashboard from '@/components/portfolio/AssessmentDashboard';
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
            <div className="space-y-6">
              <InsightItem
                title="Leadership Pattern Recognition Across Features"
                description="Smart Journal entries reveal consistent leadership themes: coordinating family responsibilities (mentioned 3x), leading group projects, and organizing community events. Your Calendar Intelligence shows 15+ leadership commitments this month. This aligns with your high Leadership Potential score (8.1/10) and suggests readiness for executive roles in college applications."
                time="2 hours ago"
                type="strength"
                impact="high"
                pendingGains={{
                  overall: 0.23,
                  leadership: 0.23,
                  uniqueValue: 0.12
                }}
                relatedFeatures={["Smart Journal", "Calendar Intelligence", "Portfolio Analysis"]}
                actionItems={[
                  { action: "Document leadership impact with metrics in Extracurricular Optimizer", link: "/extracurricular-optimizer", buttonText: "Boost Leadership Score" },
                  { action: "Explore executive opportunities in Opportunity Aggregator", link: "/opportunity-aggregator", buttonText: "Find Perfect Match" }
                ]}
                connections="Your bilingual coordination skills + consistent leadership + time management creates a compelling narrative for competitive programs."
              />
              <InsightItem
                title="Hidden Value Discovery Through Feature Synergy"
                description="Passion Exploration identified 'cultural bridge-building' as a core interest, while your work history shows customer service excellence. Combined with your family coordination role, this creates a unique 'community connector' profile. 4 new scholarship opportunities specifically seek students with multicultural leadership experience."
                time="1 day ago"
                type="opportunity"
                impact="high"
                pendingGains={{
                  overall: 0.31,
                  communityImpact: 0.44,
                  uniqueValue: 0.18
                }}
                relatedFeatures={["Passion Exploration", "Opportunity Aggregator", "Smart Journal"]}
                actionItems={[
                  { action: "Quantify cultural impact in 3 documented experiences", link: "/smart-journal", buttonText: "Unlock Hidden Value" },
                  { action: "Apply to targeted multicultural leadership programs by March 15th", link: "/calendar-intelligence", buttonText: "Claim Opportunities" }
                ]}
                connections="Your authentic experiences as a cultural connector are highly valued by admissions committees seeking diverse perspectives."
              />
              <InsightItem
                title="Strategic Profile Enhancement Through Data Integration"
                description="Adding part-time work experience (+15% profile strength) combined with Smart Journal reflection on financial resilience created a powerful narrative arc. Calendar Intelligence shows optimal timing for 2 more profile-building activities this semester. Your academic performance context (3.5 GPA while working) now positions you in the top tier for need-aware admissions."
                time="3 days ago"
                type="improvement"
                impact="medium"
                pendingGains={{
                  overall: 0.13,
                  academicExcellence: 0.09,
                  personalGrowth: 0.16
                }}
                relatedFeatures={["Calendar Intelligence", "Smart Journal", "Extracurricular Optimizer"]}
                actionItems={[
                  { action: "Schedule strategic activities during identified optimal time slots", link: "/calendar-intelligence", buttonText: "Optimize Timeline" },
                  { action: "Document financial resilience story for need-based applications", link: "/smart-journal", buttonText: "Craft Your Story" }
                ]}
                connections="Your work ethic narrative + strategic timing + authentic challenges = compelling underdog story that resonates with admissions officers."
              />
              <InsightItem
                title="GPA Consistency Gap Detected"
                description="Calendar Intelligence shows you missed 3 study sessions last month, and your Smart Journal indicates stress about balancing work and academics. While your overall 3.5 GPA is strong given your work commitments, the recent B- in AP Chemistry creates a missed opportunity for strengthening your pre-med narrative. Consistent performance would have opened 7 additional competitive programs."
                time="5 days ago"
                type="warning"
                impact="medium"
                pendingGains={{
                  overall: 0.0,
                  missedOpportunity: 0.25
                }}
                relatedFeatures={["Calendar Intelligence", "Smart Journal", "Academic Tracker"]}
                actionItems={[
                  { action: "Schedule consistent study blocks in Calendar Intelligence", link: "/calendar-intelligence", buttonText: "Lock In Success" },
                  { action: "Reflect on academic priorities and time management in Smart Journal", link: "/smart-journal", buttonText: "Find Balance" },
                  { action: "Consider chemistry tutoring or office hours", link: "/opportunity-aggregator", buttonText: "Get Support" }
                ]}
                connections="Missed opportunity: Consistent academic performance would have strengthened your pre-med narrative and opened 7 additional competitive programs."
              />
              <InsightItem
                title="Unfulfilled Community Service Commitment"
                description="Your portfolio mentions a commitment to 'monthly community garden volunteer work' but Calendar Intelligence shows no related activities in 6 weeks. This represents a missed opportunity to strengthen your Community Impact narrative and environmental stewardship values from Passion Exploration. Recovery through honest reflection could actually strengthen your authenticity."
                time="1 week ago"
                type="concern"
                impact="low"
                pendingGains={{
                  overall: 0.0,
                  missedOpportunity: 0.18
                }}
                relatedFeatures={["Calendar Intelligence", "Passion Exploration", "Portfolio Analysis"]}
                actionItems={[
                  { action: "Schedule makeup volunteer sessions in Calendar Intelligence", link: "/calendar-intelligence", buttonText: "Recommit & Grow" },
                  { action: "Document genuine reasons for absence in Smart Journal", link: "/smart-journal", buttonText: "Show Authenticity" },
                  { action: "Realign community commitments with actual capacity", link: "/extracurricular-optimizer", buttonText: "Find Balance" }
                ]}
                connections="Recovery opportunity: Honest reflection about overcommitment + strategic realignment could actually strengthen your authenticity narrative."
              />
            </div>
          </CardContent>
        </Card>

        <RecommendedNextStepsDashboard />
        </section>
      </div>
    </div>
  );
};

// New comprehensive dashboard component
const RecommendedNextStepsDashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', count: 24 },
    { id: 'academic', name: 'Academic Excellence', count: 5 },
    { id: 'leadership', name: 'Leadership Development', count: 7 },
    { id: 'community', name: 'Community Impact', count: 4 },
    { id: 'personal', name: 'Personal Growth', count: 3 },
    { id: 'unique', name: 'Unique Value', count: 3 },
    { id: 'readiness', name: 'Future Readiness', count: 2 }
  ];

  const priorities = [
    { id: 'all', name: 'All Priorities' },
    { id: 'critical', name: 'Critical (Do Now)' },
    { id: 'high', name: 'High Priority' },
    { id: 'medium', name: 'Medium Priority' }
  ];

  const nextSteps = [
    {
      id: 1,
      category: 'academic',
      priority: 'high',
      title: 'Document Academic Achievements with Impact Metrics',
      description: 'Create detailed records of your academic performance including specific projects, research, and quantifiable outcomes. Focus on achievements while managing work responsibilities.',
      estimatedTime: '2-3 hours',
      difficulty: 'Medium',
      potentialImpact: '+0.8 Academic Score',
      requiredResources: ['Transcripts', 'Project files', 'Teacher feedback'],
      steps: [
        'Gather all academic records and project documentation',
        'Calculate GPA trends and improvements over time',
        'Document specific achievements and their measurable impact',
        'Create compelling narratives around academic challenges overcome'
      ],
      deadline: '1 week',
      relatedGoals: ['College Applications', 'Scholarship Essays'],
      isCustomizable: false // Standard documentation process
    },
    {
      id: 2,
      category: 'leadership',
      priority: 'critical',
      title: 'Expand Leadership Portfolio Beyond Family Coordination',
      description: 'While your family leadership is strong (9.9/10), diversifying into formal leadership roles will create a more comprehensive profile for competitive opportunities.',
      estimatedTime: '4-6 weeks',
      difficulty: 'High',
      potentialImpact: '+0.5 Leadership Score, +0.3 Community Impact',
      requiredResources: ['Time commitment', 'Application materials', 'References'],
      steps: [
        'Identify 3-5 leadership opportunities in school or community',
        'Apply for student government, club officer positions, or volunteer coordination roles',
        'Document current family leadership with specific examples and outcomes',
        'Create transition plan to balance new roles with existing responsibilities'
      ],
      deadline: '2 weeks to apply',
      relatedGoals: ['Leadership Development', 'College Applications'],
      isCustomizable: true // Can be personalized to interests and availability
    },
    {
      id: 3,
      category: 'readiness',
      priority: 'critical',
      title: 'Develop Detailed Future Readiness Action Plan',
      description: 'Your current readiness score (1.8/10) indicates a critical gap. Create specific, measurable goals and timelines to dramatically improve this dimension.',
      estimatedTime: '3-4 hours',
      difficulty: 'Medium',
      potentialImpact: '+3.2 Readiness Score',
      requiredResources: ['Career research tools', 'Mentorship', 'Planning templates'],
      steps: [
        'Research 5 specific career paths aligned with your interests',
        'Create detailed 2-year and 5-year goal timelines',
        'Identify required skills, experiences, and credentials',
        'Establish monthly check-in system for progress tracking'
      ],
      deadline: '3 days',
      relatedGoals: ['Career Planning', 'Goal Setting'],
      isCustomizable: true // Can be tailored to specific career interests
    },
    {
      id: 4,
      category: 'community',
      priority: 'high',
      title: 'Launch Community Impact Initiative',
      description: 'Create a signature community project that leverages your bilingual skills and cultural bridge-building abilities to make measurable local impact.',
      estimatedTime: '8-12 weeks',
      difficulty: 'High',
      potentialImpact: '+2.1 Community Impact, +0.4 Leadership',
      requiredResources: ['Community partners', 'Planning materials', 'Small budget'],
      steps: [
        'Identify specific community need you can address with your unique skills',
        'Partner with local organizations or schools',
        'Develop project proposal with clear metrics and timeline',
        'Execute project with documentation of impact and lessons learned'
      ],
      deadline: '1 month to launch',
      relatedGoals: ['Community Service', 'Unique Value Proposition'],
      isCustomizable: true // Highly personalizable to interests and community needs
    },
    {
      id: 5,
      category: 'personal',
      priority: 'medium',
      title: 'Create Personal Growth Narrative Portfolio',
      description: 'Document your journey of overcoming financial challenges and personal obstacles with compelling stories and evidence of resilience.',
      estimatedTime: '4-5 hours',
      difficulty: 'Low',
      potentialImpact: '+0.6 Personal Growth Score',
      requiredResources: ['Reflection time', 'Writing materials', 'Photo documentation'],
      steps: [
        'Write detailed personal stories of challenges overcome',
        'Gather supporting evidence and documentation',
        'Create visual timeline of growth and achievement',
        'Practice articulating growth narrative in interview settings'
      ],
      deadline: '2 weeks',
      relatedGoals: ['Personal Branding', 'Essay Writing'],
      isCustomizable: true // Personal stories can be tailored to individual experiences
    }
  ];

  const filteredSteps = nextSteps.filter(step => {
    const categoryMatch = selectedFilter === 'all' || step.category === selectedFilter;
    const priorityMatch = priorityFilter === 'all' || step.priority === priorityFilter;
    return categoryMatch && priorityMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedStep) return;
    
    setIsLoading(true);
    
    // Add user message to chat history
    const userMessage = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      // Mock API call for now - replace with actual API integration
      const response = await fetch('/api/customize-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: selectedStep,
          userMessage: chatMessage,
          chatHistory
        })
      });
      
      // Mock response for demonstration
      const aiResponse = {
        role: 'assistant',
        content: `I understand you'd like to customize "${selectedStep.title}". Based on your message, here are some personalized suggestions:

• Tailor the approach to align with your specific interests and passions
• Consider your available time and resources for a more realistic timeline
• Focus on opportunities that match your unique strengths and background
• Adapt the steps to fit your local community and school environment

Would you like me to suggest specific modifications to any of the action steps?`
      };
      
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse = {
        role: 'assistant',
        content: 'Sorry, I encountered an issue. Please try again or contact support if the problem persists.'
      };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setChatMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex-1">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            >
              {priorities.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSteps.length} of {nextSteps.length} recommended actions
        </p>
        <Button variant="outline" size="sm">
          Export Action Plan
        </Button>
      </div>

      {/* Action Items Grid */}
      <div className="grid gap-6">
        {filteredSteps.map((step) => (
          <Card key={step.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
                      <Badge className={`text-xs ${getPriorityColor(step.priority)}`}>
                        {step.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-primary mb-1">{step.potentialImpact}</div>
                    <div className="text-xs text-muted-foreground">Potential Impact</div>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground">Time Required</div>
                    <div className="font-medium text-sm">{step.estimatedTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Difficulty</div>
                    <div className="font-medium text-sm">{step.difficulty}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Deadline</div>
                    <div className="font-medium text-sm text-red-600">{step.deadline}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Focus Area</div>
                    <div className="font-medium text-sm capitalize">{step.category.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Detailed Steps */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Action Steps:
                  </h4>
                  <div className="space-y-2">
                    {step.steps.map((actionStep, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-muted-foreground">{actionStep}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources & Goals */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Required Resources:</h5>
                    <div className="flex flex-wrap gap-1">
                      {step.requiredResources.map((resource, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Related Goals:</h5>
                    <div className="flex flex-wrap gap-1">
                      {step.relatedGoals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" className="flex-1 sm:flex-none">
                    Start This Action
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Later
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedStep(step);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {step.isCustomizable && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedStep(step);
                        setIsDetailModalOpen(true);
                        setIsChatOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">+6.2</div>
          <div className="text-xs text-muted-foreground">Max Portfolio Boost</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-xs text-muted-foreground">Critical Actions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">15-20</div>
          <div className="text-xs text-muted-foreground">Hours Required</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">2-8</div>
          <div className="text-xs text-muted-foreground">Weeks Timeline</div>
        </div>
      </div>
      
      {/* Full-Screen Detail Modal */}
      {isDetailModalOpen && selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Improved Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setIsDetailModalOpen(false);
              setIsChatOpen(false);
              setChatHistory([]);
            }}
          />
          
          {/* Modal Content - Almost Full Screen */}
          <div className="relative z-10 w-[95vw] h-[95vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex">
            {/* Main Content Area */}
            <div className={`${selectedStep.isCustomizable ? 'w-2/3' : 'w-full'} flex flex-col`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{selectedStep.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getPriorityColor(selectedStep.priority)}`}>
                      {selectedStep.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedStep.category.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {selectedStep.isCustomizable && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Customizable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedStep.isCustomizable && (
                    <div className="text-right">
                      <h4 className="font-medium text-sm mb-1">Related Goals:</h4>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedStep.relatedGoals.map((goal: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setChatHistory([]);
                    }}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* No redundant description - it's already in the detailed overview below */}
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Impact Metrics with Expandable Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{selectedStep.potentialImpact}</div>
                  <div className="text-sm text-muted-foreground">Potential Impact</div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs mt-1">
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Detailed Metrics
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xs font-medium text-green-700">Portfolio Score Increase: +{selectedStep.potentialImpact}</div>
                      <div className="text-xs font-medium text-green-700">New Opportunities: 3-7 programs</div>
                      <div className="text-xs font-medium text-green-700">Application Readiness: +25%</div>
                      <div className="text-xs font-medium text-green-700">Competitive Advantage: +40%</div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedStep.estimatedTime}</div>
                  <div className="text-sm text-muted-foreground">Time Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedStep.deadline}</div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                </div>
              </div>
              
              {/* Detailed Description with Real Examples */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detailed Overview & Examples</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-4">{selectedStep.description}</p>
                  
                  {/* Real Implementation Examples */}
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-foreground">Example Implementations:</h4>
                    {selectedStep.category === 'community' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Cultural Bridge Initiative</p>
                            <Badge variant="secondary" className="text-xs">Featured in Local News</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Created a peer tutoring program connecting bilingual students with newcomer immigrants, resulting in 85% academic improvement and featured in local news.</p>
                          <div className="text-xs text-primary">Impact: +4.2 portfolio points • Time: 6 weeks • Participants: 24 students</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Community Garden Translation Project</p>
                            <Badge variant="secondary" className="text-xs">40% Participation Increase</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Developed multilingual guides for local community garden, increasing participation by 40% among non-English speaking families.</p>
                          <div className="text-xs text-primary">Impact: +3.1 portfolio points • Time: 4 weeks • Languages: 5</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Digital Literacy for Seniors</p>
                            <Badge variant="secondary" className="text-xs">City Partnership</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Launched tech workshops for elderly residents, teaching basic smartphone and internet skills to 150+ seniors across 3 community centers.</p>
                          <div className="text-xs text-primary">Impact: +5.8 portfolio points • Time: 8 weeks • Graduates: 150+</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Youth Mental Health Advocacy</p>
                            <Badge variant="secondary" className="text-xs">Policy Change</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Organized student-led mental health awareness campaign that led to school district implementing mandatory mental health days.</p>
                          <div className="text-xs text-primary">Impact: +6.5 portfolio points • Time: 12 weeks • Students Affected: 3,200</div>
                        </div>
                      </div>
                    )}
                    {selectedStep.category === 'leadership' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Student Government President</p>
                            <Badge variant="secondary" className="text-xs">35% Efficiency Gain</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Led initiative that reduced lunch wait times by 35% and implemented mental health resources, affecting 800+ students daily.</p>
                          <div className="text-xs text-primary">Impact: +7.2 portfolio points • Time: Full year • Budget Managed: $15,000</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Peer Mentorship Coordinator</p>
                            <Badge variant="secondary" className="text-xs">92% Retention Rate</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Established program pairing upperclassmen with freshmen, achieving 92% retention rate and recognition from district administration.</p>
                          <div className="text-xs text-primary">Impact: +5.9 portfolio points • Time: 6 months • Mentees: 48</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Environmental Action Team Leader</p>
                            <Badge variant="secondary" className="text-xs">50% Waste Reduction</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Spearheaded campus sustainability initiative reducing school waste by 50% and saving $8,000 annually in disposal costs.</p>
                          <div className="text-xs text-primary">Impact: +6.1 portfolio points • Time: 8 months • Cost Savings: $8,000</div>
                        </div>
                      </div>
                    )}
                    {selectedStep.category === 'readiness' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Pre-Med Research Pathway</p>
                            <Badge variant="secondary" className="text-xs">Research Publication</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Detailed 5-year pathway including volunteering at local clinic, shadowing physicians, and research opportunities at nearby university resulting in co-authored paper.</p>
                          <div className="text-xs text-primary">Impact: +8.4 portfolio points • Time: 18 months • Publications: 1</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Business Leadership Track</p>
                            <Badge variant="secondary" className="text-xs">$25K Revenue Generated</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Entrepreneurship program combining internship at family business with formal business mentorship and eventual startup launch generating $25,000 in first year.</p>
                          <div className="text-xs text-primary">Impact: +7.8 portfolio points • Time: 2 years • Revenue: $25,000</div>
                        </div>
                        <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-semibold text-foreground">Engineering Design Challenge</p>
                            <Badge variant="secondary" className="text-xs">National Competition</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Developed water purification system for developing communities, winning regional engineering fair and advancing to nationals with patent pending.</p>
                          <div className="text-xs text-primary">Impact: +9.1 portfolio points • Time: 14 months • Patents: 1 pending</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comprehensive Action Plan with Expandable Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Complete Action Plan</h3>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Detailed Walkthrough
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">Step-by-Step Implementation Guide</h4>
                      <div className="space-y-4">
                        {selectedStep.steps.map((step: string, index: number) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-semibold shrink-0">
                                {index + 1}
                              </div>
                              <div className="space-y-2 flex-1">
                                <p className="text-foreground font-medium">{step}</p>
                                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                  <strong>How to do it:</strong> Break this into 3-4 smaller tasks. Start with research phase (2-3 days), then planning (1 week), implementation (2-3 weeks), and evaluation (2-3 days).
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <strong>Time:</strong> {Math.ceil((index + 1) * 30)} minutes • 
                                  <strong className="ml-2">Resources:</strong> {selectedStep.requiredResources.slice(0, 2).join(', ')}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    Resource Guide
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    Find Mentors
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <div className="space-y-3">
                  {selectedStep.steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <div className="space-y-2">
                        <p className="text-foreground font-medium">{step}</p>
                        <div className="text-sm text-muted-foreground">
                          <strong>Estimated Time:</strong> {Math.ceil((index + 1) * 30)} minutes • 
                          <strong className="ml-2">Resources:</strong> {selectedStep.requiredResources.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Resources & Support Section - Non-repetitive content only */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">Required Resources & Support</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-purple-700">Essential Resources:</h4>
                    <div className="space-y-2">
                      {selectedStep.requiredResources.map((resource: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-purple-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          {resource}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-purple-700">Support Network:</h4>
                    <div className="space-y-2 text-sm text-purple-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Uplift AI mentor guidance
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Community peer support
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Expert advisor access
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
              {/* Footer Actions */}
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Ready to transform your portfolio? Start this action today.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsChatOpen(false);
                    setChatHistory([]);
                  }}>
                    Save for Later
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90">
                    Start This Action Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Sidebar - Always Open for Customizable Tasks */}
            {selectedStep.isCustomizable && (
              <div className="w-1/3 border-l border-border bg-muted/20 flex flex-col">
                <div className="p-4 border-b border-border bg-primary/5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Personalize Your Task
                  </h3>
                </div>
                
                {/* Description Section - Aligned with left side */}
                <div className="p-4 bg-muted/10 border-b border-border">
                  <p className="text-sm text-muted-foreground">
                    Chat with AI to customize this action plan to your specific interests and goals.
                  </p>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Start a conversation to customize this task!</p>
                      <p className="mt-2 text-xs">Ask about modifying steps, timeline, or focus areas.</p>
                    </div>
                  ) : (
                    chatHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background border border-border'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background border border-border p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex gap-2">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="How would you like to customize this task?"
                      className="flex-1 min-h-[40px] max-h-[120px] text-sm"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={!chatMessage.trim() || isLoading}
                      size="sm"
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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

interface InsightItemProps {
  title: string;
  description: string;
  time: string;
  type: 'strength' | 'opportunity' | 'improvement' | 'warning' | 'concern';
  impact: 'high' | 'medium' | 'low';
  pendingGains: {
    overall: number;
    [key: string]: number;
  };
  relatedFeatures: string[];
  actionItems: Array<{
    action: string;
    link: string;
    buttonText: string;
  }>;
  connections: string;
}

const InsightItem = ({ title, description, time, type, impact, pendingGains, relatedFeatures, actionItems, connections }: InsightItemProps) => {
  const typeColors = {
    strength: 'text-green-600',
    opportunity: 'text-blue-600',
    improvement: 'text-purple-600',
    warning: 'text-orange-600',
    concern: 'text-red-600'
  };

  const getCheckmarkColor = (type: string, impact: string) => {
    // Handle special types first
    if (type === 'warning' && impact === 'medium') {
      return 'text-muted-foreground'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'text-red-500'; // Red for negative impact
    }
    
    // Use impact-based colors for regular items
    switch (impact) {
      case 'high':
        return 'text-blue-500';
      case 'medium':
        return 'text-green-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBorderClass = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'border-2 border-muted-foreground/30'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'border-2 border-red-500';
    }
    if (impact === 'high') {
      return 'border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)] hover:shadow-[0_0_35px_rgba(59,130,246,1)]';
    }
    if (impact === 'medium') {
      return 'border-2 border-green-500';
    }
    return 'border-2 border-yellow-500';
  };

  const getImpactBadgeColors = (type: string, impact: string) => {
    // Handle special types first
    if (type === 'warning' && impact === 'medium') {
      return 'bg-muted text-muted-foreground border-muted'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'bg-red-100 text-red-700 border-red-300'; // Red for negative impact
    }
    
    // Use impact-based colors for regular items
    switch (impact) {
      case 'high':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'medium':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getImpactText = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'missed opportunity';
    }
    if (type === 'concern') {
      return 'negative impact';
    }
    return `${impact} impact`;
  };

  return (
    <div className={`p-5 rounded-lg shadow-soft hover:shadow-medium transition-all duration-200 ${getBorderClass(type, impact)}`}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className={`h-6 w-6 mt-0.5 ${getCheckmarkColor(type, impact)} flex-shrink-0`} />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground text-lg">{title}</h4>
                <Badge className={`text-xs px-2 py-1 ${getImpactBadgeColors(type, impact)}`}>
                  {getImpactText(type, impact)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
            </div>
            <div className="text-right ml-4 min-w-[140px]">
              <div className="text-xs text-muted-foreground mb-2 flex items-center justify-end gap-1 font-medium">
                <Scale className="h-3 w-3" />
                Estimated Impact
              </div>
              <div className="space-y-1 opacity-50">
                {Object.entries(pendingGains).map(([key, value]) => (
                  <div key={key} className="text-xs font-medium text-muted-foreground">
                    {key === 'missedOpportunity' ? 'Missed: ' : value >= 0 ? '+' : ''}
                    {value.toFixed(2)} {key === 'missedOpportunity' ? 'potential' : key}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-md p-3 border border-primary/20">
            <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Feature Connections
            </h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {relatedFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">{connections}</p>
          </div>

          <div className="bg-secondary/10 rounded-md p-3 border border-secondary/30">
            <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Recommended Actions
            </h5>
            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex-1">{item.action}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 ml-2 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => window.location.href = item.link}
                  >
                    {item.buttonText}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Record in Journal
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View Full Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioScanner;