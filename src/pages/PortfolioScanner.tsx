import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Brain, 
  Target, 
  Lightbulb, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import OnboardingFlow from '@/components/portfolio/OnboardingFlow';
import AssessmentDashboard from '@/components/portfolio/AssessmentDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const PortfolioScanner = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Mock rubric scores - in real app these would come from API
  const [rubricScores] = useState({
    academicExcellence: { score: 7.2, evidence: ['3.5 GPA while working'], feedback: 'Strong performance given constraints' },
    leadershipPotential: { score: 8.1, evidence: ['Family coordination', 'Work leadership'], feedback: 'Natural leadership in multiple contexts' },
    personalGrowth: { score: 6.8, evidence: ['Overcame financial challenges'], feedback: 'Resilience and adaptation' },
    communityImpact: { score: 5.4, evidence: ['Volunteer work'], feedback: 'Room for expansion' },
    uniqueValue: { score: 8.7, evidence: ['Bilingual', 'Cultural bridge'], feedback: 'Distinctive perspective' },
    futureReadiness: { score: 6.9, evidence: ['Clear goals', 'Planning ahead'], feedback: 'Good direction, needs detail' }
  });

  const overallScore = Math.round(
    (rubricScores.academicExcellence.score + 
     rubricScores.leadershipPotential.score + 
     rubricScores.personalGrowth.score + 
     rubricScores.communityImpact.score + 
     rubricScores.uniqueValue.score + 
     rubricScores.futureReadiness.score) / 6 * 10
  ) / 10;

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
      {/* Dramatic Overall Score Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">{overallScore}</div>
            <div className="text-xl opacity-90">Overall Portfolio Strength</div>
            <div className="text-sm opacity-75 mt-2">Out of 10.0 • Based on 6 key dimensions</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.academicExcellence.score}</div>
              <div className="text-xs opacity-75">Academic</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.leadershipPotential.score}</div>
              <div className="text-xs opacity-75">Leadership</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.personalGrowth.score}</div>
              <div className="text-xs opacity-75">Growth</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.communityImpact.score}</div>
              <div className="text-xs opacity-75">Community</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.uniqueValue.score}</div>
              <div className="text-xs opacity-75">Uniqueness</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-lg font-semibold">{rubricScores.futureReadiness.score}</div>
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
            <div className="text-right">
              <Badge variant="secondary" className={`${currentLevel.color} text-white`}>
                {currentLevel.level}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{currentLevel.description}</p>
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

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recent Insights & Cross-Feature Analysis
              </div>
              <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  🔒 Pending Impact (Locked Until Actions Complete)
                  <div className="flex gap-3 text-xs opacity-50">
                    <span className="text-muted-foreground font-medium">+0.67 Overall</span>
                    <span className="text-muted-foreground font-medium">+0.23 Leadership</span>
                    <span className="text-muted-foreground font-medium">+0.44 Community</span>
                  </div>
                </div>
              </div>
              </div>
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
            <div className="text-right ml-4">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                🔒 Estimated Impact
              </div>
              <div className="space-y-1 opacity-50">
                {Object.entries(pendingGains).map(([key, value]) => (
                  <div key={key} className={`text-xs font-medium ${
                    key === 'missedOpportunity' ? 'text-orange-600' : 
                    value >= 0 ? 'text-muted-foreground' : 'text-red-600'
                  }`}>
                    {key === 'missedOpportunity' ? '⚠️ Missed: ' : value >= 0 ? '+' : ''}
                    {value.toFixed(2)} {key === 'missedOpportunity' ? 'potential' : key}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 rounded-md p-3 border border-white/40">
            <h5 className="font-medium text-foreground text-sm mb-2">🔗 Feature Connections:</h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {relatedFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">{connections}</p>
          </div>

          <div className="bg-white/60 rounded-md p-3 border border-white/40">
            <h5 className="font-medium text-foreground text-sm mb-2">⚡ Recommended Actions:</h5>
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