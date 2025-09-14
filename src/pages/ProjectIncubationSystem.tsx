import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  Lightbulb, 
  TrendingUp, 
  MessageCircle, 
  Send, 
  Target, 
  Calendar, 
  BarChart3,
  AlertCircle,
  AlertTriangle,
  Filter,
  CheckCircle,
  Award,
  Users,
  MapPin,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Clock,
  Star,
  Calculator,
  X,
  Check,
  Zap,
  Brain,
  Scale,
  Link,
  CheckCircle2,
  Minus,
  ArrowRight,
  Code,
  Globe,
  Building,
  PlusCircle,
  Search,
  Beaker,
  Rocket,
  Heart,
  Palette,
  Briefcase,
  PlayCircle,
  Eye,
  ThumbsUp,
  Share,
  FileText,
  GitBranch,
  Cog,
  HelpCircle,
  UserCheck,
  Network,
  LightbulbIcon,
  Settings,
  Workflow
} from 'lucide-react';

const ProjectIncubationSystem = () => {
  // Hard coded data values for project discovery and development stages
  const projectDiscoveryData = {
    currentStage: 'Problem Identification',
    completion: 35,
    totalProjects: 3,
    activeProjects: 2,
    completedProjects: 1
  };

  // Hard coded data for project pipeline with comprehensive metrics for dashboard
  const projectPipeline = [
    {
      id: 'idea-exploration',
      stage: 'Idea Exploration', 
      project: 'Campus Food Waste Tracker',
      progress: 85,
      status: 'active',
      type: 'social-impact',
      timeInvested: 32,
      totalTimeEstimate: 120,
      deadline: '2025-12-15',
      impactRating: 9.2,
      priorityRating: 'High',
      nextMilestone: 'Stakeholder interviews complete',
      aiMode: 'socratic',
      description: 'Mobile app to track and reduce food waste in campus dining',
      recentActivity: '2 days ago',
      completionPrediction: '3 weeks'
    },
    {
      id: 'development',
      stage: 'Development',
      project: 'Study Group Matcher Algorithm',
      progress: 60,
      status: 'active', 
      type: 'technical',
      timeInvested: 45,
      totalTimeEstimate: 80,
      deadline: '2025-11-30',
      impactRating: 7.8,
      priorityRating: 'Medium',
      nextMilestone: 'MVP testing with beta users',
      aiMode: 'development-partner',
      description: 'Machine learning algorithm to match students for optimal study groups',
      recentActivity: '1 day ago',
      completionPrediction: '5 weeks'
    },
    {
      id: 'launch-prep',
      stage: 'Launch Preparation',
      project: 'Photography Portfolio Site',
      progress: 90,
      status: 'active',
      type: 'creative',
      timeInvested: 65,
      totalTimeEstimate: 70,
      deadline: '2025-10-20',
      impactRating: 6.5,
      priorityRating: 'Low',
      nextMilestone: 'Portfolio submission to contests',
      aiMode: 'development-partner',
      description: 'Professional photography portfolio with e-commerce integration',
      recentActivity: '4 hours ago',
      completionPrediction: '1 week'
    },
    {
      id: 'mental-health-hub',
      stage: 'Research',
      project: 'Mental Health Resource Hub',
      progress: 25,
      status: 'paused',
      type: 'social-impact',
      timeInvested: 12,
      totalTimeEstimate: 90,
      deadline: '2026-03-01',
      impactRating: 8.9,
      priorityRating: 'High',
      nextMilestone: 'Complete user research interviews',
      aiMode: 'socratic',
      description: 'Comprehensive platform connecting students with mental health resources',
      recentActivity: '2 weeks ago',
      completionPrediction: 'On hold'
    },
    {
      id: 'tutoring-marketplace',
      stage: 'Ideation',
      project: 'Campus Tutoring Marketplace',
      progress: 15,
      status: 'paused',
      type: 'entrepreneurial',
      timeInvested: 8,
      totalTimeEstimate: 150,
      deadline: '2026-05-15',
      impactRating: 7.3,
      priorityRating: 'Medium',
      nextMilestone: 'Market validation research',
      aiMode: 'socratic',
      description: 'Two-sided marketplace connecting students with peer tutors',
      recentActivity: '3 weeks ago',
      completionPrediction: 'On hold'
    }
  ];

  // Hard coded AI collaboration modes data
  const aiCollaborationModes = {
    socratic: {
      name: 'Socratic Mode',
      description: 'AI asks probing questions to help you discover ideas',
      icon: HelpCircle,
      color: 'blue',
      usageTime: '12 hours this month',
      effectiveness: '89%',
      recentQuestions: [
        'What problems do you encounter daily that frustrate you?',
        'Who would benefit most from this solution?',
        'What would need to be true for this to work?'
      ]
    },
    developmentPartner: {
      name: 'Development Partner',
      description: 'Technical architecture and implementation guidance',
      icon: Cog,
      color: 'green', 
      usageTime: '18 hours this month',
      effectiveness: '92%',
      recentTopics: [
        'API architecture for food waste tracker',
        'Database schema optimization',
        'Testing strategy development'
      ]
    }
  };

  // Hard coded project types with strategic focus areas
  const projectTypes = [
    {
      id: 'technical',
      name: 'Technical Projects',
      icon: Code,
      color: 'blue',
      count: 2,
      avgImpact: 8.5,
      strategies: [
        'Open source contributions strategy',
        'Hackathon project development', 
        'Research project formulation',
        'App/tool development with real users'
      ],
      examples: [
        { name: 'Study Group Matcher', status: 'active', uniqueness: 'High' },
        { name: 'Code Review Bot', status: 'planning', uniqueness: 'Medium' }
      ]
    },
    {
      id: 'social-impact',
      name: 'Social Impact Projects',
      icon: Heart,
      color: 'green',
      count: 1,
      avgImpact: 9.2,
      strategies: [
        'Community problem identification',
        'Stakeholder engagement planning',
        'Impact measurement frameworks',
        'Sustainability planning'
      ],
      examples: [
        { name: 'Campus Food Waste Tracker', status: 'active', uniqueness: 'High' },
        { name: 'Mental Health Resource Hub', status: 'idea', uniqueness: 'Medium' }
      ]
    },
    {
      id: 'creative',
      name: 'Creative Projects', 
      icon: Palette,
      color: 'purple',
      count: 1,
      avgImpact: 7.8,
      strategies: [
        'Portfolio piece development',
        'Content creation strategy',
        'Audience building approach',
        'Monetization exploration'
      ],
      examples: [
        { name: 'Photography Portfolio', status: 'launch-prep', uniqueness: 'High' },
        { name: 'Design System Library', status: 'idea', uniqueness: 'Medium' }
      ]
    },
    {
      id: 'entrepreneurial',
      name: 'Entrepreneurial Projects',
      icon: Briefcase,
      color: 'orange',
      count: 0,
      avgImpact: 0,
      strategies: [
        'Market validation processes',
        'MVP development strategy', 
        'Customer discovery frameworks',
        'Pitch preparation'
      ],
      examples: [
        { name: 'Campus Tutoring Marketplace', status: 'idea', uniqueness: 'High' },
        { name: 'Student Housing App', status: 'research', uniqueness: 'Low' }
      ]
    }
  ];

  // Hard coded uniqueness preservation metrics
  const uniquenessMetrics = {
    saturationTracking: {
      totalProjects: 1247,
      similarToYours: 23,
      saturationLevel: 'Low', // Low/Medium/High
      opportunity: 'High'
    },
    personalStory: {
      integration: 85,
      authenticity: 92,
      narrative: 'Your personal experience with food waste in college dorms creates authentic motivation'
    }
  };

  const [expandedInsights, setExpandedInsights] = useState<string[]>(['project-discovery']);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [selectedProjectType, setSelectedProjectType] = useState('technical');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI project development partner. I can help you discover unique project ideas, provide technical guidance, or brainstorm solutions. What would you like to explore today?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setChatMessages(prev => [...prev, 
        { role: 'user', content: userInput },
        { role: 'assistant', content: 'Great question! Let me help you think through this systematically. What specific aspect would you like to explore first?' }
      ]);
      setUserInput('');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header with beautiful gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-primary/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Project Incubation System</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Build Projects That Actually Matter
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-collaborative project development that ensures uniqueness and impact. 
              From idea discovery to launch, we'll help you build something meaningful.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-foreground">{projectDiscoveryData.totalProjects}</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-foreground">{projectDiscoveryData.completion}%</div>
                <div className="text-sm text-muted-foreground">Discovery Complete</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                <div className="text-2xl font-bold text-foreground">High</div>
                <div className="text-sm text-muted-foreground">Uniqueness Score</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                <div className="text-2xl font-bold text-foreground">89%</div>
                <div className="text-sm text-muted-foreground">AI Effectiveness</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Project Dashboard */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-primary" />
              Project Dashboard
            </h2>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          {/* Active Projects */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <PlayCircle className="h-5 w-5 mr-2 text-green-500" />
              Active Projects ({projectPipeline.filter(p => p.status === 'active').length})
            </h3>
            
            <div className="w-full overflow-x-auto">
              <div className="flex space-x-6 pb-4 min-w-max">
                {projectPipeline.filter(project => project.status === 'active').map((project) => (
                  <Card key={project.id} className="min-w-[700px] max-w-[700px] border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20 px-3 py-1">
                          {project.stage}
                        </Badge>
                        <div className="flex items-center space-x-3">
                          {project.type === 'technical' && <Code className="h-5 w-5 text-blue-500" />}
                          {project.type === 'social-impact' && <Heart className="h-5 w-5 text-green-500" />}
                          {project.type === 'creative' && <Palette className="h-5 w-5 text-purple-500" />}
                          {project.type === 'entrepreneurial' && <Briefcase className="h-5 w-5 text-orange-500" />}
                          <Badge variant={project.priorityRating === 'High' ? 'destructive' : project.priorityRating === 'Medium' ? 'secondary' : 'outline'} className="text-xs px-2 py-1">
                            {project.priorityRating}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">{project.project}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{project.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress & Completion Section */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-foreground">Project Completion</span>
                          <span className="font-bold text-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-3 mb-2" />
                        <div className="text-xs text-muted-foreground text-center">
                          Estimated completion: {project.completionPrediction}
                        </div>
                      </div>
                      
                      {/* Key Metrics Grid - Horizontal Layout */}
                      <div className="grid grid-cols-4 gap-6">
                        {/* Deadline */}
                        <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Deadline
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {new Date(project.deadline).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Time Invested */}
                        <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Time Invested
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.timeInvested}h / {project.totalTimeEstimate}h
                          </div>
                        </div>
                        
                        {/* Impact Rating */}
                        <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                          <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                            <Star className="h-3 w-3 mr-1" />
                            Impact Rating
                          </div>
                          <div className="text-sm font-semibold text-foreground flex items-center justify-center">
                            {project.impactRating}/10
                          </div>
                        </div>
                        
                        {/* Last Active */}
                        <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                          <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                            <Eye className="h-3 w-3 mr-1" />
                            Last Active
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.recentActivity}
                          </div>
                        </div>
                      </div>
                      
                      {/* Next Milestone Section */}
                      <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50">
                        <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          Next Milestone
                        </div>
                        <div className="text-sm text-muted-foreground">{project.nextMilestone}</div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button size="sm" className="h-9">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue to Work
                        </Button>
                        <Button size="sm" variant="outline" className="h-9">
                          <Eye className="h-4 w-4 mr-2" />
                          Update Navigation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Paused Projects */}
          {projectPipeline.filter(p => p.status === 'paused').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                Paused Projects ({projectPipeline.filter(p => p.status === 'paused').length})
              </h3>
              
              <div className="w-full overflow-x-auto">
                <div className="flex space-x-6 pb-4 min-w-max">
                  {projectPipeline.filter(project => project.status === 'paused').map((project) => (
                    <Card key={project.id} className="min-w-[700px] max-w-[700px] border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-300 opacity-75">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 px-3 py-1">
                            {project.stage} • Paused
                          </Badge>
                          <div className="flex items-center space-x-3">
                            {project.type === 'technical' && <Code className="h-5 w-5 text-blue-500" />}
                            {project.type === 'social-impact' && <Heart className="h-5 w-5 text-green-500" />}
                            {project.type === 'creative' && <Palette className="h-5 w-5 text-purple-500" />}
                            {project.type === 'entrepreneurial' && <Briefcase className="h-5 w-5 text-orange-500" />}
                            <Badge variant={project.priorityRating === 'High' ? 'destructive' : project.priorityRating === 'Medium' ? 'secondary' : 'outline'} className="text-xs px-2 py-1">
                              {project.priorityRating}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-xl mb-2">{project.project}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">{project.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Progress & Completion Section */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-foreground">Project Completion</span>
                            <span className="font-bold text-foreground">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-3 mb-2" />
                          <div className="text-xs text-muted-foreground text-center">
                            Status: {project.completionPrediction}
                          </div>
                        </div>
                        
                        {/* Key Metrics Grid - Horizontal Layout */}
                        <div className="grid grid-cols-4 gap-6">
                          {/* Deadline */}
                          <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Deadline
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {new Date(project.deadline).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Time Invested */}
                          <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Time Invested
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {project.timeInvested}h / {project.totalTimeEstimate}h
                            </div>
                          </div>
                          
                          {/* Impact Rating */}
                          <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                            <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                              <Star className="h-3 w-3 mr-1" />
                              Impact Rating
                            </div>
                            <div className="text-sm font-semibold text-foreground flex items-center justify-center">
                              {project.impactRating}/10
                            </div>
                          </div>
                          
                          {/* Last Active */}
                          <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                            <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center justify-center">
                              <Eye className="h-3 w-3 mr-1" />
                              Last Active
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {project.recentActivity}
                            </div>
                          </div>
                        </div>
                        
                        {/* Next Milestone Section */}
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50">
                          <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            Next Milestone
                          </div>
                          <div className="text-sm text-muted-foreground">{project.nextMilestone}</div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button size="sm" variant="outline" className="h-9">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Resume Work
                          </Button>
                          <Button size="sm" variant="secondary" className="h-9">
                            <Eye className="h-4 w-4 mr-2" />
                            Update Navigation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Types & Strategies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-primary" />
            Project Types & Strategic Focus
          </h2>
          
          <Tabs value={selectedProjectType} onValueChange={setSelectedProjectType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {projectTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {projectTypes.map((type) => (
              <TabsContent key={type.id} value={type.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg bg-${type.color}-500/10`}>
                          <type.icon className={`h-6 w-6 text-${type.color}-500`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{type.name}</CardTitle>
                          <CardDescription>
                            {type.count} active • {type.avgImpact > 0 ? `${type.avgImpact}/10 avg impact` : 'No projects yet'}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Start New
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Strategic Approaches */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Strategic Approaches</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {type.strategies.map((strategy, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{strategy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Example Projects */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Your Projects</h4>
                      <div className="space-y-3">
                        {type.examples.map((example, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full bg-${example.status === 'active' ? 'green' : example.status === 'planning' ? 'yellow' : 'gray'}-500`}></div>
                              <span className="font-medium text-foreground">{example.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {example.uniqueness} Uniqueness
                              </Badge>
                            </div>
                            <Badge variant={example.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
                              {example.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* AI Collaboration Modes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            AI Collaboration Modes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(aiCollaborationModes).map(([mode, data]) => {
              const Icon = data.icon;
              return (
                <Card key={mode} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-${data.color}-500/10`}>
                        <Icon className={`h-6 w-6 text-${data.color}-500`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{data.name}</CardTitle>
                        <CardDescription>{data.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage This Month:</span>
                      <span className="font-medium text-foreground">{data.usageTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Effectiveness:</span>
                      <span className="font-medium text-foreground">{data.effectiveness}</span>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-foreground mb-2">
                        {mode === 'socratic' ? 'Recent Questions:' : 'Recent Topics:'}
                      </h5>
                      <div className="space-y-2">
                        {(mode === 'socratic' ? (data as any).recentQuestions : (data as any).recentTopics).map((item, index) => (
                          <div key={index} className="p-2 bg-muted/30 rounded text-sm text-foreground">
                            "{item}"
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      Start {data.name} Session
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Uniqueness Preservation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Star className="h-6 w-6 mr-2 text-primary" />
            Uniqueness Preservation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saturation Tracking</CardTitle>
                <CardDescription>Monitor what others are building</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Projects Monitored:</span>
                    <span className="font-medium text-foreground">{uniquenessMetrics.saturationTracking.totalProjects.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Similar to Yours:</span>
                    <span className="font-medium text-foreground">{uniquenessMetrics.saturationTracking.similarToYours}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saturation Level:</span>
                    <Badge variant={uniquenessMetrics.saturationTracking.saturationLevel === 'Low' ? 'default' : 'secondary'} className="text-xs">
                      {uniquenessMetrics.saturationTracking.saturationLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Opportunity Score:</span>
                    <Badge variant="default" className="text-xs text-green-600">
                      {uniquenessMetrics.saturationTracking.opportunity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Story Integration</CardTitle>
                <CardDescription>Make projects uniquely yours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Integration Score:</span>
                    <span className="font-medium text-foreground">{uniquenessMetrics.personalStory.integration}%</span>
                  </div>
                  <Progress value={uniquenessMetrics.personalStory.integration} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Authenticity:</span>
                    <span className="font-medium text-foreground">{uniquenessMetrics.personalStory.authenticity}%</span>
                  </div>
                  <Progress value={uniquenessMetrics.personalStory.authenticity} className="h-2" />
                </div>
                
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Your Narrative</div>
                  <div className="text-sm text-foreground">{uniquenessMetrics.personalStory.narrative}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Assistant */}
      {isChatOpen && (
        <div 
          className="fixed z-50 w-96 bg-background border border-border rounded-lg shadow-2xl"
          style={{ left: chatPosition.x, top: chatPosition.y }}
        >
          {/* Chat Header - Draggable */}
          <div 
            className="flex items-center justify-between p-3 bg-primary/5 border-b border-border rounded-t-lg cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">AI Project Partner</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsChatOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chat Messages */}
          <ScrollArea className="h-80 p-3">
            <div className="space-y-3">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Chat Input */}
          <div className="p-3 border-t border-border">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about project ideas, development strategy..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Quick Actions Menu */}
          {quickActionsExpanded && (
            <div className="absolute bottom-16 right-0 bg-background border border-border rounded-lg shadow-lg p-2 space-y-2 min-w-48">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setIsChatOpen(true);
                  setQuickActionsExpanded(false);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Project Chat
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Project Idea
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Find Inspiration
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Set Goals
              </Button>
            </div>
          )}
          
          {/* Main FAB */}
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
          >
            {quickActionsExpanded ? <X className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectIncubationSystem;