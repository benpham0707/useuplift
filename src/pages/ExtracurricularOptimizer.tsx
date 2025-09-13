import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Lightbulb, 
  Users, 
  Target, 
  TrendingUp, 
  Brain, 
  MessageSquare,
  Code,
  Heart,
  DollarSign,
  Briefcase,
  Rocket,
  Search,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Settings,
  Home,
  ChevronDown,
  Building,
  Globe,
  Palette,
  ShoppingCart,
  ChevronRight,
  Clock,
  User,
  Award
} from 'lucide-react';


const ProjectIncubationSystem = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [isPlanningDropdownOpen, setIsPlanningDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isTaskPlanningOpen, setIsTaskPlanningOpen] = useState(false);

  // Hard coded project discovery insights representing AI analysis
  const discoveryInsights = [
    {
      id: 1,
      type: 'Interest Mining',
      insight: 'Your passion for environmental issues + coding skills = sustainability tech project opportunity',
      confidence: 92,
      timestamp: '2 hours ago',
      actionable: true,
      category: 'discovery'
    },
    {
      id: 2,
      type: 'Problem Identification',
      insight: 'Campus food waste could be reduced by 40% with a simple app connecting dining halls to students',
      confidence: 87,
      timestamp: '5 hours ago',
      actionable: true,
      category: 'problem'
    },
    {
      id: 3,
      type: 'Skill Gap Analysis',
      insight: 'You have 80% of skills needed for ML projects - just need to learn data visualization',
      confidence: 94,
      timestamp: '1 day ago',
      actionable: false,
      category: 'skills'
    },
    {
      id: 4,
      type: 'Uniqueness Check',
      insight: 'Mental health chatbots are oversaturated - consider focusing on physical wellness instead',
      confidence: 89,
      timestamp: '2 days ago',
      actionable: true,
      category: 'uniqueness'
    }
  ];

  // Hard coded AI collaboration modes representing the project development process
  const collaborationModes = [
    {
      mode: 'Socratic Mode',
      description: 'AI asks probing questions to help you discover your own ideas',
      active: true,
      examples: [
        'What problems do you encounter daily that frustrate you?',
        'What would need to be true for this solution to work?',
        'Who would benefit most from this? How would you reach them?'
      ],
      icon: MessageSquare,
      color: 'from-blue-500/20 to-indigo-500/20',
      sessions: 12,
      avgDuration: '15 min'
    },
    {
      mode: 'Development Partner',
      description: 'Technical architecture discussions and implementation roadmapping',
      active: false,
      examples: [
        'Let\'s break down your app architecture',
        'How should we prioritize these features?',
        'What\'s the minimal viable version?'
      ],
      icon: Code,
      color: 'from-green-500/20 to-emerald-500/20',
      sessions: 8,
      avgDuration: '25 min'
    }
  ];

  // Hard coded project types representing different strategic approaches
  const projectTypes = [
    {
      type: 'Technical Projects',
      description: 'Open source contributions, hackathons, apps with real users',
      icon: Code,
      strategies: [
        'Open source contributions strategy',
        'Hackathon project development',
        'Research project formulation',
        'App/tool development with real users'
      ],
      examples: [
        'Contributing to popular Python libraries',
        'Building a productivity app for college students',
        'Creating research tools for professors'
      ],
      difficulty: 'Medium',
      timeCommitment: '2-6 months',
      color: 'from-blue-500/10 to-indigo-500/10'
    },
    {
      type: 'Social Impact Projects',
      description: 'Community problem identification and stakeholder engagement',
      icon: Heart,
      strategies: [
        'Community problem identification',
        'Stakeholder engagement planning',
        'Impact measurement frameworks',
        'Sustainability planning'
      ],
      examples: [
        'Food waste reduction initiative',
        'Mental health awareness campaign',
        'Digital literacy for seniors'
      ],
      difficulty: 'High',
      timeCommitment: '3-12 months',
      color: 'from-red-500/10 to-pink-500/10'
    },
    {
      type: 'Creative Projects',
      description: 'Portfolio development, content creation, audience building',
      icon: Palette,
      strategies: [
        'Portfolio piece development',
        'Content creation strategy',
        'Audience building approach',
        'Monetization exploration'
      ],
      examples: [
        'YouTube channel on study techniques',
        'Photography series on campus life',
        'Podcast interviewing successful alumni'
      ],
      difficulty: 'Low',
      timeCommitment: '1-4 months',
      color: 'from-purple-500/10 to-violet-500/10'
    },
    {
      type: 'Entrepreneurial Projects',
      description: 'Market validation, MVP development, customer discovery',
      icon: Briefcase,
      strategies: [
        'Market validation processes',
        'MVP development strategy',
        'Customer discovery frameworks',
        'Pitch preparation'
      ],
      examples: [
        'Campus service marketplace',
        'Study group matching platform',
        'Sustainable products for dorms'
      ],
      difficulty: 'Very High',
      timeCommitment: '6-18 months',
      color: 'from-green-500/10 to-emerald-500/10'
    }
  ];

  // Hard coded project pipeline representing current projects in development
  const projectPipeline = [
    {
      id: 1,
      title: 'Campus Sustainability Tracker',
      type: 'Technical',
      stage: 'Development',
      progress: 75,
      description: 'Mobile app tracking individual and dorm sustainability metrics',
      nextMilestone: 'Beta testing with 3 dorms',
      uniquenessScore: 8.5,
      impact: 'Medium',
      collaborationMode: 'Development Partner',
      estimatedCompletion: '3 weeks'
    },
    {
      id: 2,
      title: 'Study Abroad Financial Planning',
      type: 'Social Impact',
      stage: 'Ideation',
      progress: 30,
      description: 'Platform helping students plan and budget for study abroad programs',
      nextMilestone: 'Market research interviews',
      uniquenessScore: 9.2,
      impact: 'High',
      collaborationMode: 'Socratic Mode',
      estimatedCompletion: '8 weeks'
    },
    {
      id: 3,
      title: 'Code Review Learning Series',
      type: 'Creative',
      stage: 'Planning',
      progress: 15,
      description: 'YouTube series breaking down real code reviews from top tech companies',
      nextMilestone: 'Script first episode',
      uniquenessScore: 7.8,
      impact: 'Medium',
      collaborationMode: 'Development Partner',
      estimatedCompletion: '2 weeks'
    }
  ];

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'discovery': return Lightbulb;
      case 'problem': return Target;
      case 'skills': return Brain;
      case 'uniqueness': return Star;
      default: return Lightbulb;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Development': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Ideation': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'Planning': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Testing': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Very High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Platform
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/academic-planner')}>
                Academic Planning
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio-scanner')}>
                Portfolio Scanner
              </Button>
            </div>

            {/* Right Side - Auth/Profile */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Project Incubation System</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Build projects that actually matter
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-collaborative project development that ensures uniqueness and impact. 
            From discovery to launch, we help you create projects that stand out.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Pipeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Projects */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>Project Pipeline</span>
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {projectPipeline.length} Active
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your current projects in development with AI collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {/* Soft Border at Scroll Cutoff */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 mb-4">
                    <div className="h-3 bg-gradient-to-b from-border/30 to-transparent"></div>
                  </div>
                  <div className="space-y-4">
                    {projectPipeline.map((project) => (
                      <Card key={project.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                            </div>
                            <Badge className={getStageColor(project.stage)}>
                              {project.stage}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <Progress value={project.progress} className="w-20" />
                              <span className="text-xs font-medium">{project.progress}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium">{project.uniquenessScore}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Next: {project.nextMilestone}</span>
                            <span>{project.estimatedCompletion}</span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs">{project.collaborationMode}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 px-2">
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Project Types */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span>Project Types & Strategies</span>
                </CardTitle>
                <CardDescription>
                  Different approaches to project development with strategic guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card key={type.type} className={`border transition-all hover:scale-105 cursor-pointer bg-gradient-to-br ${type.color}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">{type.type}</h4>
                            </div>
                            <Badge variant="outline" className={`text-xs ${getDifficultyColor(type.difficulty)}`}>
                              {type.difficulty}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                          
                          <div className="space-y-2 mb-3">
                            <h5 className="text-xs font-medium text-foreground">Key Strategies:</h5>
                            {type.strategies.slice(0, 2).map((strategy, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-muted-foreground">{strategy}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{type.timeCommitment}</span>
                            <span>{type.examples.length} examples</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Collaboration & Insights */}
          <div className="space-y-6">
            {/* AI Collaboration Modes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>AI Collaboration</span>
                </CardTitle>
                <CardDescription>
                  Different modes of working with AI to develop your projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {collaborationModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Card key={mode.mode} className={`border transition-all ${mode.active ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <h4 className="font-medium">{mode.mode}</h4>
                          </div>
                          {mode.active && (
                            <Badge className="bg-green-500/10 text-green-700 border-green-200">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                        
                        <div className="space-y-1 mb-3">
                          <h5 className="text-xs font-medium">Example Questions:</h5>
                          {mode.examples.slice(0, 2).map((example, index) => (
                            <p key={index} className="text-xs text-muted-foreground italic">
                              "{example}"
                            </p>
                          ))}
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{mode.sessions} sessions</span>
                          <span>Avg: {mode.avgDuration}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Discovery Insights */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Discovery Insights</span>
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of your interests, problems, and opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {/* Soft Border at Scroll Cutoff */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 mb-4">
                    <div className="h-3 bg-gradient-to-b from-border/30 to-transparent"></div>
                  </div>
                  <div className="space-y-3">
                    {discoveryInsights.map((insight) => {
                      const Icon = getInsightIcon(insight.category);
                      return (
                        <Card key={insight.id} className="border-l-4 border-l-primary/30">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{insight.type}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {insight.confidence}%
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-foreground mb-2">{insight.insight}</p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
                              {insight.actionable && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                  Act on this
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Start New Project Discovery
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Continue AI Collaboration
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Check Project Uniqueness
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Discovery Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectIncubationSystem;