import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  Scale,
  Compass,
  Shield,
  Zap,
  Crown,
  Gem,
  Rocket,
  Star,
  CheckCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Network,
  Eye
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, BarChart, Bar } from 'recharts';

interface SkillFramework {
  id: string;
  name: string;
  description: string;
  categories: Array<{
    name: string;
    skills: Array<{
      skill: string;
      currentLevel: number;
      targetLevel: number;
      marketValue: number;
      transferability: number;
    }>;
  }>;
}

interface BenchmarkComparison {
  metric: string;
  yourScore: number;
  peerAverage: number;
  industryStandard: number;
  topPerformer: number;
  context: string;
}

interface SkillDevelopmentModel {
  stage: string;
  characteristics: string[];
  timeframe: string;
  keyFocus: string;
  nextMilestone: string;
  evidence: string[];
}

interface CareerReadinessAnalysis {
  domain: string;
  readinessScore: number;
  strengthAreas: string[];
  growthAreas: string[];
  recommendedActions: string[];
  marketAlignment: number;
}

interface SkillsExpertAnalysisProps {
  className?: string;
}

export const SkillsExpertAnalysis: React.FC<SkillsExpertAnalysisProps> = ({ className }) => {
  const [selectedFramework, setSelectedFramework] = useState<string>('technical-depth');

  // Hard coded skills development framework with strategic analysis
  const skillFrameworks: SkillFramework[] = [
    {
      id: 'technical-depth',
      name: 'Technical Mastery Progression',
      description: 'Comprehensive analysis of technical skill development from foundation to expertise',
      categories: [
        {
          name: 'Core Development',
          skills: [
            { skill: 'Algorithm Design', currentLevel: 82, targetLevel: 95, marketValue: 95, transferability: 88 },
            { skill: 'System Architecture', currentLevel: 85, targetLevel: 92, marketValue: 92, transferability: 85 },
            { skill: 'Code Quality', currentLevel: 88, targetLevel: 95, marketValue: 78, transferability: 82 },
            { skill: 'Performance Optimization', currentLevel: 78, targetLevel: 90, marketValue: 85, transferability: 75 }
          ]
        },
        {
          name: 'Advanced Specialization',
          skills: [
            { skill: 'Distributed Systems', currentLevel: 75, targetLevel: 88, marketValue: 95, transferability: 70 },
            { skill: 'Machine Learning Integration', currentLevel: 72, targetLevel: 85, marketValue: 98, transferability: 85 },
            { skill: 'Security Architecture', currentLevel: 68, targetLevel: 82, marketValue: 90, transferability: 78 },
            { skill: 'DevOps & Infrastructure', currentLevel: 70, targetLevel: 85, marketValue: 85, transferability: 80 }
          ]
        }
      ]
    },
    {
      id: 'leadership-maturity',
      name: 'Leadership Development Matrix',
      description: 'Evolution from individual contributor to transformational leader',
      categories: [
        {
          name: 'Foundational Leadership',
          skills: [
            { skill: 'Self-Management', currentLevel: 92, targetLevel: 95, marketValue: 80, transferability: 95 },
            { skill: 'Team Collaboration', currentLevel: 88, targetLevel: 92, marketValue: 85, transferability: 90 },
            { skill: 'Communication Clarity', currentLevel: 94, targetLevel: 96, marketValue: 88, transferability: 95 },
            { skill: 'Accountability', currentLevel: 90, targetLevel: 95, marketValue: 82, transferability: 88 }
          ]
        },
        {
          name: 'Strategic Leadership',
          skills: [
            { skill: 'Vision Development', currentLevel: 85, targetLevel: 92, marketValue: 95, transferability: 85 },
            { skill: 'Change Management', currentLevel: 82, targetLevel: 90, marketValue: 92, transferability: 88 },
            { skill: 'Stakeholder Influence', currentLevel: 88, targetLevel: 94, marketValue: 90, transferability: 82 },
            { skill: 'Cultural Intelligence', currentLevel: 95, targetLevel: 98, marketValue: 88, transferability: 92 }
          ]
        }
      ]
    }
  ];

  // Hard coded benchmark comparisons with industry context
  const benchmarkComparisons: BenchmarkComparison[] = [
    {
      metric: 'Technical Problem Solving',
      yourScore: 89,
      peerAverage: 72,
      industryStandard: 78,
      topPerformer: 95,
      context: 'Based on complex system architecture decisions and successful scaling of community platform'
    },
    {
      metric: 'Cross-Functional Collaboration',
      yourScore: 94,
      peerAverage: 65,
      industryStandard: 71,
      topPerformer: 92,
      context: 'Exceptional ability to work across technical and non-technical stakeholder groups'
    },
    {
      metric: 'Innovation & Creativity',
      yourScore: 87,
      peerAverage: 68,
      industryStandard: 74,
      topPerformer: 91,
      context: 'Demonstrated through unique offline-first architecture and cultural integration approaches'
    },
    {
      metric: 'Leadership Under Pressure',
      yourScore: 92,
      peerAverage: 58,
      industryStandard: 67,
      topPerformer: 88,
      context: 'Proven through successful project pivot and team retention during major challenges'
    },
    {
      metric: 'Learning Velocity',
      yourScore: 85,
      peerAverage: 61,
      industryStandard: 69,
      topPerformer: 89,
      context: 'Rapid acquisition of new technologies and frameworks as demonstrated in ML integration'
    }
  ];

  // Hard coded skill development stages with progression model
  const developmentStages: SkillDevelopmentModel[] = [
    {
      stage: 'Advanced Practitioner',
      characteristics: [
        'Consistently delivers complex solutions independently',
        'Mentors others and shares knowledge effectively',
        'Identifies and addresses system-level problems',
        'Adapts quickly to new technologies and contexts'
      ],
      timeframe: 'Current State',
      keyFocus: 'Deepening expertise while broadening impact',
      nextMilestone: 'Transition to architectural leadership roles',
      evidence: [
        'Successfully led major technical pivot with 95% team retention',
        'Mentored 8+ junior developers with measurable skill improvement',
        'Architected system serving 500+ users with 99.8% uptime',
        'Integrated ML capabilities despite no formal background'
      ]
    },
    {
      stage: 'Emerging Expert',
      characteristics: [
        'Recognized as technical authority in specific domains',
        'Influences technical decisions across multiple teams',
        'Contributes to industry knowledge through speaking/writing',
        'Drives innovation and sets technical standards'
      ],
      timeframe: '12-18 months',
      keyFocus: 'Building external recognition and influence',
      nextMilestone: 'Speaking at major conferences, open source contributions',
      evidence: [
        'Target: Present at 2+ technical conferences',
        'Goal: Contribute to 3+ open source projects',
        'Objective: Publish technical articles with industry reach',
        'Milestone: Technical advisory roles in startups'
      ]
    },
    {
      stage: 'Thought Leader',
      characteristics: [
        'Shapes industry direction through vision and innovation',
        'Builds and leads high-performing technical organizations',
        'Balances technical excellence with business strategy',
        'Creates lasting impact on technology and society'
      ],
      timeframe: '3-5 years',
      keyFocus: 'Transformational leadership and societal impact',
      nextMilestone: 'CTO or technical founder roles',
      evidence: [
        'Vision: Lead technical organization with 50+ engineers',
        'Impact: Technology solutions affecting 10,000+ lives',
        'Recognition: Industry awards and board positions',
        'Legacy: Mentored leaders now in senior positions'
      ]
    }
  ];

  // Hard coded career readiness analysis by domain
  const careerReadiness: CareerReadinessAnalysis[] = [
    {
      domain: 'Software Engineering',
      readinessScore: 92,
      strengthAreas: [
        'Full-stack development with production experience',
        'System architecture and scalability expertise',
        'User-centered design thinking',
        'Cross-functional collaboration skills'
      ],
      growthAreas: [
        'Enterprise-scale system design',
        'Advanced algorithm optimization',
        'Security architecture expertise',
        'Machine learning model deployment'
      ],
      recommendedActions: [
        'Contribute to open source projects with 10M+ users',
        'Complete system design courses and practice',
        'Obtain security certifications (CISSP or equivalent)',
        'Build and deploy ML models in production'
      ],
      marketAlignment: 95
    },
    {
      domain: 'Technical Leadership',
      readinessScore: 88,
      strengthAreas: [
        'Team building and conflict resolution',
        'Strategic thinking and vision development',
        'Cultural intelligence and inclusion',
        'Change management and adaptability'
      ],
      growthAreas: [
        'Large-scale team management (20+ people)',
        'Budget and resource allocation',
        'Board-level communication',
        'Product strategy and market analysis'
      ],
      recommendedActions: [
        'Seek technical lead roles in larger organizations',
        'Complete executive leadership development programs',
        'Practice presenting to C-level executives',
        'Study business strategy and market dynamics'
      ],
      marketAlignment: 89
    },
    {
      domain: 'Social Impact Technology',
      readinessScore: 96,
      strengthAreas: [
        'Community engagement and stakeholder management',
        'Cultural sensitivity and inclusive design',
        'Impact measurement and evaluation',
        'Sustainable technology development'
      ],
      growthAreas: [
        'Policy and regulatory knowledge',
        'Grant writing and funding acquisition',
        'Partnership development with NGOs',
        'International development experience'
      ],
      recommendedActions: [
        'Join technical advisory boards for impact organizations',
        'Complete courses in development economics',
        'Build relationships with foundation program officers',
        'Participate in international development projects'
      ],
      marketAlignment: 92
    }
  ];

  // Hard coded skill-career fit analysis data
  const skillCareerFitData = [
    { skill: 'Technical Architecture', careerFit: 95, marketDemand: 92, experience: 88 },
    { skill: 'Team Leadership', careerFit: 91, marketDemand: 87, experience: 92 },
    { skill: 'Cultural Intelligence', careerFit: 98, marketDemand: 82, experience: 95 },
    { skill: 'Product Development', careerFit: 87, marketDemand: 90, experience: 85 },
    { skill: 'Community Engagement', careerFit: 94, marketDemand: 75, experience: 96 },
    { skill: 'Innovation Strategy', careerFit: 89, marketDemand: 88, experience: 87 }
  ];

  const selectedFrameworkData = skillFrameworks.find(f => f.id === selectedFramework)!;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 80) return 'text-primary';
    if (score >= 70) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getReadinessLevel = (score: number) => {
    if (score >= 95) return { label: 'Exceptional', color: 'success' };
    if (score >= 90) return { label: 'Strong', color: 'primary' };
    if (score >= 80) return { label: 'Good', color: 'accent' };
    return { label: 'Developing', color: 'muted' };
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Expert Analysis Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-muted-foreground">Overall Skill Maturity</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold">89%</div>
            <div className="text-xs text-muted-foreground">Career Readiness</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">+23%</div>
            <div className="text-xs text-muted-foreground">Above Peer Average</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold">96%</div>
            <div className="text-xs text-muted-foreground">Social Impact Readiness</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frameworks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-xl border border-border/50">
          <TabsTrigger value="frameworks" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Brain className="h-4 w-4" />
            Skill Frameworks
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Rocket className="h-4 w-4" />
            Development Path
          </TabsTrigger>
          <TabsTrigger value="readiness" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Award className="h-4 w-4" />
            Career Readiness
          </TabsTrigger>
        </TabsList>

        {/* Strategic Skill Frameworks */}
        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Framework Selector */}
            <div className="space-y-4">
              {skillFrameworks.map((framework) => (
                <Card 
                  key={framework.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                    selectedFramework === framework.id ? 'ring-2 ring-primary shadow-large' : ''
                  }`}
                  onClick={() => setSelectedFramework(framework.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">{framework.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{framework.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">{framework.categories.length} categories</Badge>
                      <Badge variant="outline" className="text-xs">Strategic</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Framework Analysis */}
            <div className="lg:col-span-2">
              <Card className="glass-card shadow-large">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                      <Network className="h-5 w-5" />
                    </div>
                    {selectedFrameworkData.name}
                  </CardTitle>
                  <CardDescription>{selectedFrameworkData.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedFrameworkData.categories.map((category) => (
                    <div key={category.name} className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Gem className="h-5 w-5 text-primary" />
                        {category.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.skills.map((skill) => (
                          <div key={skill.skill} className="p-4 rounded-xl bg-card/50 border border-border/50">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">{skill.skill}</h5>
                              <Badge variant="secondary">{skill.currentLevel}%</Badge>
                            </div>
                            
                            {/* Current vs Target Progress */}
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-sm">
                                <span>Current</span>
                                <span>Target</span>
                              </div>
                              <div className="relative">
                                <Progress value={skill.targetLevel} className="h-2 bg-muted/30" />
                                <Progress 
                                  value={skill.currentLevel} 
                                  className="h-2 absolute top-0 left-0"
                                />
                              </div>
                            </div>

                            {/* Market Value & Transferability */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Market Value</span>
                                <span className={getScoreColor(skill.marketValue)}>{skill.marketValue}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Transferable</span>
                                <span className={getScoreColor(skill.transferability)}>{skill.transferability}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Benchmark Comparisons */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benchmark Chart */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  Performance Benchmarks
                </CardTitle>
                <CardDescription>Comparison against peers, industry standards, and top performers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={benchmarkComparisons} 
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="metric" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }} 
                      />
                      <Bar dataKey="peerAverage" fill="hsl(var(--muted))" name="Peer Average" />
                      <Bar dataKey="industryStandard" fill="hsl(var(--accent))" name="Industry Standard" />
                      <Bar dataKey="yourScore" fill="hsl(var(--primary))" name="Your Score" />
                      <Bar dataKey="topPerformer" fill="hsl(var(--success))" name="Top Performer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Benchmark Analysis */}
            <div className="space-y-4">
              {benchmarkComparisons.map((benchmark, index) => (
                <Card key={benchmark.metric} className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{benchmark.metric}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getScoreColor(benchmark.yourScore)} bg-current/10`}
                        >
                          {benchmark.yourScore}%
                        </Badge>
                        {benchmark.yourScore > benchmark.topPerformer && (
                          <Crown className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Peer Avg: {benchmark.peerAverage}%</span>
                        <span className="text-muted-foreground">Industry: {benchmark.industryStandard}%</span>
                      </div>
                      <Progress 
                        value={(benchmark.yourScore / benchmark.topPerformer) * 100} 
                        className="h-2" 
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{benchmark.context}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Development Path */}
        <TabsContent value="development" className="space-y-6">
          <div className="space-y-6">
            {developmentStages.map((stage, index) => (
              <Card key={stage.stage} className="glass-card shadow-large">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl text-white shadow-soft ${
                      index === 0 ? 'bg-gradient-primary' : 
                      index === 1 ? 'bg-gradient-to-r from-success to-success/80' : 
                      'bg-gradient-to-r from-warning to-warning/80'
                    }`}>
                      {index === 0 && <CheckCircle className="h-6 w-6" />}
                      {index === 1 && <Target className="h-6 w-6" />}
                      {index === 2 && <Crown className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {stage.stage}
                        {index === 0 && <Badge variant="secondary" className="bg-success/20 text-success">Current</Badge>}
                      </CardTitle>
                      <CardDescription>{stage.timeframe}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Characteristics */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        Key Characteristics
                      </h4>
                      <div className="space-y-2">
                        {stage.characteristics.map((characteristic, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{characteristic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Focus & Milestones */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                        <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Key Focus
                        </h4>
                        <p className="text-sm">{stage.keyFocus}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                        <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                          <Rocket className="h-4 w-4" />
                          Next Milestone
                        </h4>
                        <p className="text-sm">{stage.nextMilestone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-success" />
                      {index === 0 ? 'Current Evidence' : 'Target Evidence'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {stage.evidence.map((evidence, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {index === 0 ? (
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          ) : (
                            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-sm">{evidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {index < developmentStages.length - 1 && (
                    <div className="flex items-center justify-center pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-5 w-5" />
                        <span className="text-sm">Next Stage</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Career Readiness Analysis */}
        <TabsContent value="readiness" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills-Career Fit Chart */}
            <Card className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    <PieChart className="h-5 w-5" />
                  </div>
                  Skills-Career Fit Analysis
                </CardTitle>
                <CardDescription>Relationship between your skills, career fit, and market demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={skillCareerFitData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="careerFit" 
                        domain={[70, 100]} 
                        name="Career Fit"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        dataKey="marketDemand" 
                        domain={[70, 100]} 
                        name="Market Demand"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        formatter={(value, name) => [`${value}%`, name]}
                      />
                      <Scatter 
                        dataKey="experience" 
                        fill="hsl(var(--primary))" 
                        name="Your Experience Level"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Readiness Breakdown */}
            <div className="space-y-4">
              {careerReadiness.map((domain) => {
                const readiness = getReadinessLevel(domain.readinessScore);
                return (
                  <Card key={domain.domain} className="glass-card hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{domain.domain}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`${readiness.color === 'success' ? 'bg-success/20 text-success' : 
                              readiness.color === 'primary' ? 'bg-primary/20 text-primary' : 
                              'bg-accent/20 text-accent'}`}
                          >
                            {readiness.label}
                          </Badge>
                          <span className="text-2xl font-bold">{domain.readinessScore}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={domain.readinessScore} className="h-2" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-success mb-2">Strengths</h5>
                          {domain.strengthAreas.slice(0, 2).map((strength, idx) => (
                            <div key={idx} className="flex items-start gap-1 mb-1">
                              <CheckCircle className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                              <span className="text-xs">{strength}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h5 className="font-medium text-accent mb-2">Growth Areas</h5>
                          {domain.growthAreas.slice(0, 2).map((growth, idx) => (
                            <div key={idx} className="flex items-start gap-1 mb-1">
                              <Target className="h-3 w-3 text-accent mt-1 flex-shrink-0" />
                              <span className="text-xs">{growth}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Market Alignment: {domain.marketAlignment}%</span>
                        <Badge variant="outline" className="text-xs">
                          {domain.recommendedActions.length} actions
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};