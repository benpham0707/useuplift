import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart,
  Users,
  Crown,
  Target,
  MessageCircle,
  Lightbulb,
  Scale,
  Compass,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  UserCheck,
  Handshake,
  Zap,
  Brain,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface LeadershipPhase {
  id: string;
  phase: string;
  period: string;
  style: string;
  outcome: string;
  skills: string[];
  challenges: string[];
  keyInsight: string;
  teamSize: number;
  successMetrics: {
    teamSatisfaction: number;
    goalAchievement: number;
    conflictResolution: number;
  };
}

interface TeamStory {
  id: string;
  challenge: string;
  context: string;
  teamBuilding: string[];
  conflictResolution: string;
  results: string[];
  growth: string;
  lessons: string[];
}

interface DecisionFramework {
  principle: string;
  description: string;
  application: string;
  example: string;
  effectiveness: number;
}

interface LeadershipSkillsJourneyProps {
  className?: string;
}

export const LeadershipSkillsJourney: React.FC<LeadershipSkillsJourneyProps> = ({ className }) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('transformation');
  const [selectedStory, setSelectedStory] = useState<string>('garden-team');

  // Hard coded leadership evolution data showing progression through different phases
  const leadershipEvolution: LeadershipPhase[] = [
    {
      id: 'emergence',
      phase: 'Leadership Emergence',
      period: 'Months 1-3',
      style: 'Directive & Learning',
      outcome: 'Established credibility and initial team structure',
      skills: ['Task Delegation', 'Basic Communication', 'Goal Setting'],
      challenges: ['Lack of experience', 'Team resistance', 'Unclear authority'],
      keyInsight: 'Leadership is earned through competence and care, not titles',
      teamSize: 3,
      successMetrics: {
        teamSatisfaction: 65,
        goalAchievement: 70,
        conflictResolution: 45
      }
    },
    {
      id: 'development',
      phase: 'Skill Development',
      period: 'Months 4-8',
      style: 'Collaborative & Supportive',
      outcome: 'Built strong team cohesion and improved processes',
      skills: ['Active Listening', 'Conflict Mediation', 'Strategic Planning', 'Motivation'],
      challenges: ['Scaling team', 'Managing diverse personalities', 'Balancing competing priorities'],
      keyInsight: 'Different people need different types of leadership and motivation',
      teamSize: 6,
      successMetrics: {
        teamSatisfaction: 82,
        goalAchievement: 85,
        conflictResolution: 78
      }
    },
    {
      id: 'transformation',
      phase: 'Transformational Leadership',
      period: 'Months 9-18',
      style: 'Visionary & Empowering',
      outcome: 'Led major strategic pivot and cultural transformation',
      skills: ['Vision Communication', 'Change Management', 'Cultural Sensitivity', 'Strategic Thinking'],
      challenges: ['Major project pivot', 'Community resistance', 'Resource constraints'],
      keyInsight: 'Great leaders create other leaders, not followers',
      teamSize: 12,
      successMetrics: {
        teamSatisfaction: 94,
        goalAchievement: 92,
        conflictResolution: 90
      }
    },
    {
      id: 'mastery',
      phase: 'Leadership Mastery',
      period: 'Months 19-24',
      style: 'Adaptive & Inspiring',
      outcome: 'Established sustainable systems and mentored new leaders',
      skills: ['Systems Thinking', 'Mentoring', 'Cross-Cultural Leadership', 'Legacy Building'],
      challenges: ['Succession planning', 'Maintaining momentum', 'Complex stakeholder management'],
      keyInsight: 'True leadership success is measured by what continues after you step back',
      teamSize: 18,
      successMetrics: {
        teamSatisfaction: 96,
        goalAchievement: 95,
        conflictResolution: 95
      }
    }
  ];

  // Hard coded team formation and conflict resolution stories
  const teamStories: TeamStory[] = [
    {
      id: 'garden-team',
      challenge: 'Initial Community Garden Team Formation',
      context: 'Needed to bring together community members with vastly different technical backgrounds, cultural perspectives, and gardening philosophies to collaborate on a digital platform.',
      teamBuilding: [
        'Organized monthly potluck meetings to build personal connections',
        'Created skill-sharing sessions where elders taught gardening and youth taught technology',
        'Established clear roles that honored both traditional knowledge and technical expertise',
        'Implemented consensus-based decision making for major project directions'
      ],
      conflictResolution: 'When traditional gardeners resisted the digital approach, I facilitated structured listening sessions, created technology demonstrations using familiar gardening analogies, and developed a hybrid approach that preserved traditional methods while adding optional digital enhancements.',
      results: [
        'Achieved 100% team retention over 18 months',
        'Created mentorship pairs between digital natives and gardening experts',
        'Established sustainable conflict resolution processes used by other teams',
        'Generated community ownership that extended beyond original team members'
      ],
      growth: 'This experience taught me that diversity of perspective is a strength to be harnessed, not a problem to be solved. I learned to see conflict as information about unmet needs rather than personal attacks.',
      lessons: [
        'Listen first, propose solutions second',
        'Honor existing wisdom while introducing innovation',
        'Create psychological safety before pushing for change',
        'Success metrics must reflect all stakeholders\' values'
      ]
    },
    {
      id: 'tech-cultural',
      challenge: 'Technical Team vs. Cultural Preservation Conflict',
      context: 'Developer volunteers wanted to modernize all aspects of the platform while community elders worried about losing traditional knowledge and practices.',
      teamBuilding: [
        'Created mixed working groups pairing developers with community elders',
        'Established "cultural review" process for all technical decisions',
        'Organized field trips where developers experienced traditional gardening methods',
        'Developed shared vocabulary that translated between technical and cultural concepts'
      ],
      conflictResolution: 'Instead of choosing sides, I reframed the conflict as a design challenge: How might we use technology to amplify rather than replace traditional wisdom? This led to innovative features like digital storytelling for preserving oral traditions and augmented reality for identifying plants using traditional names.',
      results: [
        'Transformed adversarial relationship into collaborative innovation',
        'Created unique features that became the platform\'s most celebrated aspects',
        'Established cultural consultation as standard practice for technical decisions',
        'Generated external recognition for culturally-sensitive technology design'
      ],
      growth: 'I discovered that the best solutions often come from synthesizing opposing viewpoints rather than choosing between them. This experience shaped my approach to all future conflicts.',
      lessons: [
        'Reframe conflicts as creative challenges',
        'Look for underlying shared values beneath surface disagreements',
        'Innovation comes from combining different knowledge systems',
        'Process matters as much as outcome in sensitive situations'
      ]
    }
  ];

  // Hard coded decision-making framework with real examples
  const decisionFrameworks: DecisionFramework[] = [
    {
      principle: 'Stakeholder Impact Analysis',
      description: 'Before making decisions, systematically evaluate impact on all affected parties',
      application: 'Create stakeholder map, assess short and long-term impacts, identify potential unintended consequences',
      example: 'When deciding whether to add a social media integration feature, analyzed impact on privacy-conscious elders, tech-savvy youth, and community organizers separately, leading to a tiered privacy approach',
      effectiveness: 92
    },
    {
      principle: 'Values-Based Decision Matrix',
      description: 'Evaluate options against core community values: sustainability, inclusion, empowerment',
      application: 'Score each option 1-5 on each value, weight by community priority, choose highest score',
      example: 'Used this framework to choose between three different user interface designs, prioritizing accessibility and cultural sensitivity over visual appeal',
      effectiveness: 88
    },
    {
      principle: 'Reversible vs. Irreversible Decisions',
      description: 'Make reversible decisions quickly, irreversible decisions slowly with maximum input',
      application: 'Categorize decisions by reversibility, adjust consultation process and timeline accordingly',
      example: 'Implemented new meeting format quickly (reversible) but spent 3 months deciding on data privacy policy (irreversible)',
      effectiveness: 85
    },
    {
      principle: 'Future-Back Thinking',
      description: 'Start with desired long-term outcome and work backwards to determine present action',
      application: 'Envision 5-year success state, identify required milestones, choose actions that build toward that future',
      example: 'Envisioned community-led platform governance, worked backwards to identify capability building needed today',
      effectiveness: 90
    }
  ];

  // Hard coded radar chart data for leadership competencies
  const leadershipRadarData = [
    { competency: 'Vision', value: 92, fullMark: 100 },
    { competency: 'Communication', value: 94, fullMark: 100 },
    { competency: 'Team Building', value: 88, fullMark: 100 },
    { competency: 'Decision Making', value: 90, fullMark: 100 },
    { competency: 'Conflict Resolution', value: 90, fullMark: 100 },
    { competency: 'Cultural Intelligence', value: 95, fullMark: 100 }
  ];

  // Hard coded impact metrics over time
  const impactData = [
    { month: 'Jan', teamSize: 3, satisfaction: 65, productivity: 60 },
    { month: 'Mar', teamSize: 6, satisfaction: 75, productivity: 70 },
    { month: 'May', teamSize: 8, satisfaction: 82, productivity: 78 },
    { month: 'Jul', teamSize: 12, satisfaction: 88, productivity: 85 },
    { month: 'Sep', teamSize: 15, satisfaction: 92, productivity: 90 },
    { month: 'Nov', teamSize: 18, satisfaction: 96, productivity: 94 }
  ];

  const selectedPhaseData = leadershipEvolution.find(p => p.id === selectedPhase)!;
  const selectedStoryData = teamStories.find(s => s.id === selectedStory)!;

  const getPhaseColor = (phase: string) => {
    const colors = {
      emergence: 'text-accent bg-accent/10 border-accent/30',
      development: 'text-primary bg-primary/10 border-primary/30',
      transformation: 'text-success bg-success/10 border-success/30',
      mastery: 'text-warning bg-warning/10 border-warning/30'
    };
    return colors[phase as keyof typeof colors] || colors.development;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Leadership Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">18</div>
            <div className="text-xs text-muted-foreground">Team Members Led</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold">500+</div>
            <div className="text-xs text-muted-foreground">Community Members Influenced</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold">96%</div>
            <div className="text-xs text-muted-foreground">Team Satisfaction</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">95%</div>
            <div className="text-xs text-muted-foreground">Goal Achievement</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-xl border border-border/50">
          <TabsTrigger value="evolution" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            Evolution
          </TabsTrigger>
          <TabsTrigger value="team-stories" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Users className="h-4 w-4" />
            Team Stories
          </TabsTrigger>
          <TabsTrigger value="decision-framework" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            Decision Framework
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Crown className="h-4 w-4" />
            Impact
          </TabsTrigger>
        </TabsList>

        {/* Leadership Evolution Timeline */}
        <TabsContent value="evolution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {leadershipEvolution.map((phase, index) => (
              <Card 
                key={phase.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                  selectedPhase === phase.id ? 'ring-2 ring-primary shadow-large' : ''
                }`}
                onClick={() => setSelectedPhase(phase.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className="text-sm text-muted-foreground mb-1">{phase.period}</div>
                    <h4 className="font-semibold text-sm">{phase.phase}</h4>
                    <Badge variant="secondary" className="text-xs mt-2">{phase.style}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Team:</span> {phase.teamSize} members
                    </div>
                    <Progress value={phase.successMetrics.teamSatisfaction} className="h-1" />
                    <div className="text-xs text-muted-foreground text-center">
                      {phase.successMetrics.teamSatisfaction}% satisfaction
                    </div>
                  </div>
                  {index < leadershipEvolution.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-auto mt-3 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Phase View */}
          <Card className="glass-card shadow-large">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{selectedPhaseData.phase}</CardTitle>
                  <CardDescription>{selectedPhaseData.period} • {selectedPhaseData.style}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Outcome */}
              <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Key Outcome
                </h4>
                <p className="text-sm">{selectedPhaseData.outcome}</p>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Team Satisfaction</span>
                    <Badge variant="secondary">{selectedPhaseData.successMetrics.teamSatisfaction}%</Badge>
                  </div>
                  <Progress value={selectedPhaseData.successMetrics.teamSatisfaction} className="h-2" />
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Goal Achievement</span>
                    <Badge variant="secondary">{selectedPhaseData.successMetrics.goalAchievement}%</Badge>
                  </div>
                  <Progress value={selectedPhaseData.successMetrics.goalAchievement} className="h-2" />
                </div>
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Conflict Resolution</span>
                    <Badge variant="secondary">{selectedPhaseData.successMetrics.conflictResolution}%</Badge>
                  </div>
                  <Progress value={selectedPhaseData.successMetrics.conflictResolution} className="h-2" />
                </div>
              </div>

              {/* Skills Developed */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Skills Developed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPhaseData.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Key Insight */}
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insight
                </h4>
                <p className="text-sm italic">"{selectedPhaseData.keyInsight}"</p>
              </div>

              {/* Challenges Overcome */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  Challenges Overcome
                </h4>
                <div className="space-y-2">
                  {selectedPhaseData.challenges.map((challenge, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Building Stories */}
        <TabsContent value="team-stories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Story Selector */}
            <div className="space-y-4">
              {teamStories.map((story) => (
                <Card 
                  key={story.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                    selectedStory === story.id ? 'ring-2 ring-primary shadow-large' : ''
                  }`}
                  onClick={() => setSelectedStory(story.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{story.challenge}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{story.context}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">Team Building</Badge>
                      <Badge variant="outline" className="text-xs">{story.results.length} results</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Story Details */}
            <div className="lg:col-span-2">
              <Card className="glass-card shadow-large">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Users className="h-5 w-5" />
                    </div>
                    {selectedStoryData.challenge}
                  </CardTitle>
                  <CardDescription>{selectedStoryData.context}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Team Building Approach */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-success" />
                      Team Building Approach
                    </h4>
                    <div className="space-y-2">
                      {selectedStoryData.teamBuilding.map((approach, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{approach}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conflict Resolution */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Conflict Resolution Strategy
                    </h4>
                    <p className="text-sm">{selectedStoryData.conflictResolution}</p>
                  </div>

                  {/* Results */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-warning" />
                      Results Achieved
                    </h4>
                    <div className="space-y-2">
                      {selectedStoryData.results.map((result, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth & Lessons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                      <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Personal Growth
                      </h4>
                      <p className="text-sm">{selectedStoryData.growth}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                      <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Lessons
                      </h4>
                      <div className="space-y-1">
                        {selectedStoryData.lessons.map((lesson, index) => (
                          <div key={index} className="text-sm">• {lesson}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Decision Framework */}
        <TabsContent value="decision-framework" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {decisionFrameworks.map((framework) => (
              <Card key={framework.principle} className="glass-card hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Brain className="h-5 w-5" />
                    </div>
                    {framework.principle}
                  </CardTitle>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <h5 className="font-medium mb-2">Application</h5>
                    <p className="text-sm text-muted-foreground">{framework.application}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <h5 className="font-medium mb-2">Real Example</h5>
                    <p className="text-sm">{framework.example}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Effectiveness</span>
                    <div className="flex items-center gap-2">
                      <Progress value={framework.effectiveness} className="w-20 h-2" />
                      <Badge variant="secondary">{framework.effectiveness}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leadership Impact */}
        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competency Radar */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <Target className="h-5 w-5" />
                  </div>
                  Leadership Competencies
                </CardTitle>
                <CardDescription>Current mastery across key leadership dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={leadershipRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="competency" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Radar
                        name="Leadership"
                        dataKey="value"
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Impact Over Time */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  Leadership Impact Trends
                </CardTitle>
                <CardDescription>Team growth and satisfaction over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={impactData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="teamSize" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Team Size"
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={3}
                        name="Satisfaction %"
                        dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="productivity" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={3}
                        name="Productivity %"
                        dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};