import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
  Workflow,
  Info
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
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Hard coded data for suggested project types and ideas for discovery dashboard
  const suggestedProjects = [
    {
      id: 'ai-study-planner',
      title: 'AI-Powered Study Planner',
      category: 'Academic Enhancement',
      description: 'Personalized study schedule optimization using machine learning to adapt to your learning patterns',
      estimatedTime: '6-8 weeks',
      impactScore: 8.5,
      skillsRequired: ['React', 'Python', 'Machine Learning'],
      uniquenessRating: 'High',
      icon: Brain
    },
    {
      id: 'campus-sustainability',
      title: 'Campus Sustainability Tracker',
      category: 'Environmental Impact',
      description: 'Real-time tracking of campus environmental metrics with student engagement features',
      estimatedTime: '4-6 weeks',
      impactScore: 9.2,
      skillsRequired: ['IoT', 'Data Visualization', 'Mobile Development'],
      uniquenessRating: 'Very High',
      icon: Globe
    },
    {
      id: 'peer-mentorship',
      title: 'Peer Mentorship Platform',
      category: 'Community Building',
      description: 'Connect students across different academic years for mentorship and knowledge sharing',
      estimatedTime: '5-7 weeks',
      impactScore: 7.8,
      skillsRequired: ['Full-Stack Development', 'UI/UX Design', 'Database Design'],
      uniquenessRating: 'Medium',
      icon: Users
    },
    {
      id: 'local-business-connector',
      title: 'Local Business Connector',
      category: 'Economic Development',
      description: 'Platform connecting students with local businesses for internships and projects',
      estimatedTime: '8-10 weeks',
      impactScore: 8.9,
      skillsRequired: ['Business Development', 'Web Development', 'Marketing'],
      uniquenessRating: 'High',
      icon: Building
    },
    {
      id: 'creative-collaboration',
      title: 'Creative Collaboration Hub',
      category: 'Arts & Media',
      description: 'Digital space for artists, writers, and creators to collaborate on multimedia projects',
      estimatedTime: '6-8 weeks',
      impactScore: 7.3,
      skillsRequired: ['Creative Direction', 'Web Development', 'Content Management'],
      uniquenessRating: 'Medium',
      icon: Palette
    },
    {
      id: 'research-network',
      title: 'Student Research Network',
      category: 'Academic Research',
      description: 'Platform for sharing research interests, finding collaborators, and tracking progress',
      estimatedTime: '7-9 weeks',
      impactScore: 8.1,
      skillsRequired: ['Research Methods', 'Database Design', 'Academic Writing'],
      uniquenessRating: 'High',
      icon: Search
    }
  ];

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

  // Hook: convert vertical wheel to horizontal scroll reliably and block page/back navigation when hovering
  const useHorizontalWheel = (ref: React.RefObject<HTMLDivElement | null>) => {
    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        const dx = e.deltaX || 0;
        const dy = e.deltaY || 0;

        // Check if we're at the edges of horizontal scroll
        const atLeftEdge = el.scrollLeft <= 0;
        const atRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

        // If we're at the edges and trying to scroll beyond, allow vertical scroll
        if ((atLeftEdge && dy < 0) || (atRightEdge && dy > 0)) {
          // Allow normal page scrolling
          return;
        }

        // Otherwise, prevent default and convert to horizontal scroll
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        // Prefer vertical delta to drive horizontal movement
        const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
        if (delta !== 0) {
          el.scrollLeft += delta;
        }
      };

      el.addEventListener('wheel', onWheel as EventListener, { passive: false });
      return () => {
        el.removeEventListener('wheel', onWheel as EventListener);
      };
    }, [ref]);
  };

  // Refs for horizontal scrollers
  const activeProjectsRef = React.useRef<HTMLDivElement>(null);
  const pausedProjectsRef = React.useRef<HTMLDivElement>(null);

  // Attach wheel handlers
  useHorizontalWheel(activeProjectsRef);
  useHorizontalWheel(pausedProjectsRef);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with beautiful gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-project-header"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-6 border border-white/20">
              <Lightbulb className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Project Incubation System</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Build Projects That Actually Matter
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              AI-collaborative project development that ensures uniqueness and impact. 
              From idea discovery to launch, we'll help you build something meaningful.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{projectDiscoveryData.totalProjects}</div>
                <div className="text-sm text-white/70">Active Projects</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{projectDiscoveryData.completion}%</div>
                <div className="text-sm text-white/70">Discovery Complete</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">High</div>
                <div className="text-sm text-white/70">Uniqueness Score</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">89%</div>
                <div className="text-sm text-white/70">AI Effectiveness</div>
              </div>
            </div>
          </div>
      </div>
    </div>

      {/* Smooth transition spacer between header and dashboards */}
      <div aria-hidden="true" className="h-8 md:h-14 bg-gradient-to-b from-transparent to-background/80"></div>

      {/* Full-width Dashboard Sections */}
      <div className="w-full px-4 pb-8">
        {/* Active & Paused Projects Section */}
        <section className="relative">
          {/* Section Content Card */}
          <Card className="gradient-project-card border-purple-200/30 shadow-soft">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
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
              <PlayCircle className="h-5 w-5 mr-2" style={{ color: 'hsl(280 70% 60%)' }} />
              Active Projects ({projectPipeline.filter(p => p.status === 'active').length})
            </h3>
            
            <div className="w-full overflow-x-auto no-scrollbar"
                 ref={activeProjectsRef}
                 style={{ 
                   overscrollBehaviorX: 'contain',
                   overscrollBehaviorY: 'contain',
                   touchAction: 'pan-x',
                   WebkitOverflowScrolling: 'touch'
                 }}>
              <div className="flex space-x-6 pb-4 min-w-max"
                   style={{ touchAction: 'pan-x' }}>
                {projectPipeline.filter(project => project.status === 'active').map((project) => (
                  <Card key={project.id} className="min-w-[700px] max-w-[700px] gradient-project-card border border-purple-200/50 shadow-project hover:shadow-strong transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="default" style={{ backgroundColor: 'hsl(280 70% 60% / 0.1)', color: 'hsl(280 70% 40%)', border: '1px solid hsl(280 70% 60% / 0.2)' }} className="px-3 py-1">
                          {project.stage}
                        </Badge>
                        <div className="flex items-center space-x-3">
                          {project.type === 'technical' && <Code className="h-5 w-5" style={{ color: 'hsl(280 70% 60%)' }} />}
                          {project.type === 'social-impact' && <Heart className="h-5 w-5" style={{ color: 'hsl(0 75% 60%)' }} />}
                          {project.type === 'creative' && <Palette className="h-5 w-5" style={{ color: 'hsl(280 70% 60%)' }} />}
                          {project.type === 'entrepreneurial' && <Briefcase className="h-5 w-5" style={{ color: 'hsl(0 75% 60%)' }} />}
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
                      <div className="bg-white/40 rounded-lg p-4 border border-purple-200/30">
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
                        <div className="text-center p-3 bg-white/50 rounded-lg border border-purple-200/40">
                          <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(280 70% 50%)' }}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Deadline
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {new Date(project.deadline).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Time Invested */}
                        <div className="text-center p-3 bg-white/50 rounded-lg border border-purple-200/40">
                          <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(280 70% 50%)' }}>
                            <Clock className="h-3 w-3 mr-1" />
                            Time Invested
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.timeInvested}h / {project.totalTimeEstimate}h
                          </div>
                        </div>
                        
                        {/* Impact Rating */}
                        <div className="text-center p-3 bg-white/50 rounded-lg border border-red-200/40">
                          <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(0 75% 50%)' }}>
                            <Star className="h-3 w-3 mr-1" />
                            Impact Rating
                          </div>
                          <div className="text-sm font-semibold text-foreground flex items-center justify-center">
                            {project.impactRating}/10
                          </div>
                        </div>
                        
                        {/* Last Active */}
                        <div className="text-center p-3 bg-white/50 rounded-lg border border-red-200/40">
                          <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(0 75% 50%)' }}>
                            <Eye className="h-3 w-3 mr-1" />
                            Last Active
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.recentActivity}
                          </div>
                        </div>
                      </div>
                      
                      {/* Next Milestone Section */}
                      <div className="bg-white/50 rounded-lg p-4 border border-purple-200/40">
                        <div className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center" style={{ color: 'hsl(280 70% 50%)' }}>
                          <Target className="h-3 w-3 mr-1" />
                          Next Milestone
                        </div>
                        <div className="text-sm text-muted-foreground">{project.nextMilestone}</div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button size="sm" className="h-9 gradient-project-accent text-white border-0 hover:opacity-90">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue to Work
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 border-purple-300/50 hover:bg-purple-50">
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
                <Clock className="h-5 w-5 mr-2" style={{ color: 'hsl(0 75% 60%)' }} />
                Paused Projects ({projectPipeline.filter(p => p.status === 'paused').length})
              </h3>
              
              <div className="w-full overflow-x-auto no-scrollbar"
                   ref={pausedProjectsRef}
                   style={{ 
                     overscrollBehaviorX: 'contain',
                     overscrollBehaviorY: 'contain',
                     touchAction: 'pan-x',
                     WebkitOverflowScrolling: 'touch'
                   }}>
                 <div className="flex space-x-6 pb-4 min-w-max"
                      style={{ touchAction: 'pan-x' }}>
                   {projectPipeline.filter(project => project.status === 'paused').map((project) => (
                     <Card key={project.id} className="min-w-[700px] max-w-[700px] gradient-project-paused border border-red-200/30 hover:shadow-medium transition-all duration-300 opacity-80">
                       <CardHeader className="pb-4">
                         <div className="flex items-center justify-between mb-3">
                           <Badge variant="secondary" style={{ backgroundColor: 'hsl(0 75% 60% / 0.1)', color: 'hsl(0 75% 40%)', border: '1px solid hsl(0 75% 60% / 0.2)' }} className="px-3 py-1">
                             {project.stage} • Paused
                           </Badge>
                           <div className="flex items-center space-x-3">
                             {project.type === 'technical' && <Code className="h-5 w-5" style={{ color: 'hsl(280 50% 50%)' }} />}
                             {project.type === 'social-impact' && <Heart className="h-5 w-5" style={{ color: 'hsl(0 50% 50%)' }} />}
                             {project.type === 'creative' && <Palette className="h-5 w-5" style={{ color: 'hsl(280 50% 50%)' }} />}
                             {project.type === 'entrepreneurial' && <Briefcase className="h-5 w-5" style={{ color: 'hsl(0 50% 50%)' }} />}
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
                         <div className="bg-white/60 rounded-lg p-4 border border-red-200/30">
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
                           <div className="text-center p-3 bg-white/70 rounded-lg border border-purple-200/30">
                             <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(280 50% 50%)' }}>
                               <Calendar className="h-3 w-3 mr-1" />
                               Deadline
                             </div>
                             <div className="text-sm font-semibold text-foreground">
                               {new Date(project.deadline).toLocaleDateString()}
                             </div>
                           </div>
                           
                           {/* Time Invested */}
                           <div className="text-center p-3 bg-white/70 rounded-lg border border-purple-200/30">
                             <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(280 50% 50%)' }}>
                               <Clock className="h-3 w-3 mr-1" />
                               Time Invested
                             </div>
                             <div className="text-sm font-semibold text-foreground">
                               {project.timeInvested}h / {project.totalTimeEstimate}h
                             </div>
                           </div>
                           
                           {/* Impact Rating */}
                           <div className="text-center p-3 bg-white/70 rounded-lg border border-red-200/30">
                             <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(0 50% 50%)' }}>
                               <Star className="h-3 w-3 mr-1" />
                               Impact Rating
                             </div>
                             <div className="text-sm font-semibold text-foreground flex items-center justify-center">
                               {project.impactRating}/10
                             </div>
                           </div>
                           
                           {/* Last Active */}
                           <div className="text-center p-3 bg-white/70 rounded-lg border border-red-200/30">
                             <div className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center" style={{ color: 'hsl(0 50% 50%)' }}>
                               <Eye className="h-3 w-3 mr-1" />
                               Last Active
                             </div>
                             <div className="text-sm font-semibold text-foreground">
                               {project.recentActivity}
                             </div>
                           </div>
                         </div>
                         
                         {/* Next Milestone Section */}
                         <div className="bg-white/70 rounded-lg p-4 border border-purple-200/30">
                           <div className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center" style={{ color: 'hsl(280 50% 50%)' }}>
                             <Target className="h-3 w-3 mr-1" />
                             Next Milestone
                           </div>
                           <div className="text-sm text-muted-foreground">{project.nextMilestone}</div>
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="grid grid-cols-2 gap-3">
                           <Button size="sm" variant="outline" className="h-9 border-purple-300/50 hover:bg-purple-50">
                             <PlayCircle className="h-4 w-4 mr-2" />
                             Resume Work
                           </Button>
                           <Button size="sm" variant="secondary" className="h-9 bg-red-100/50 hover:bg-red-100">
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
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-16">

        {/* Project Discovery & Planning Section */}
        <section className="relative">
          {/* Section Header with Visual Separator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-red-500/10 rounded-full px-6 py-3 mb-4 border border-purple-200/50">
              <LightbulbIcon className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold text-foreground">Project Discovery & Planning</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore curated project ideas and start planning your next breakthrough with AI-powered recommendations
            </p>
          </div>

          {/* Section Actions */}
          <div className="flex justify-center mb-8">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Campus Navigation
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
            <CardContent className="p-6">
              <div className="h-[500px]">
                <div className="h-full overflow-y-auto">
                  <div className="space-y-4 pr-4">
                    {[
                      {
                        id: 'social-impact',
                        title: 'Social Impact Initiative',
                        category: 'Community Service',
                        description: 'Create meaningful change in your local community through organized service projects',
                        match: '92%',
                        timeCommitment: '3-6 months',
                        difficulty: 'Medium',
                        whyPick: 'Builds leadership skills, creates lasting community connections, and demonstrates commitment to social responsibility',
                        skills: ['Leadership', 'Project Management', 'Community Engagement'],
                        outcomes: ['Local impact', 'Network building', 'Personal fulfillment'],
                        findings: [
                          'Strong community service background with 200+ volunteer hours',
                          'Leadership experience in student government and clubs',
                          'Interest in social justice and community development',
                          'Previous success organizing group events and initiatives'
                        ],
                        connections: [
                          'Aligns with your declared sociology major and career interests',
                          'Builds on your existing volunteer coordinator experience',
                          'Complements your goal of attending graduate school in social work',
                          'Matches your expressed interest in local community development'
                        ],
                        impact: 'This project leverages your existing community connections and leadership skills while addressing your career goal of making meaningful social impact. Based on your academic performance in sociology courses and volunteer history, you have the foundational knowledge and passion to create lasting change in your community.'
                      },
                      {
                        id: 'research-project',
                        title: 'Independent Research',
                        category: 'Academic',
                        description: 'Conduct original research in your field of interest with faculty mentorship',
                        match: '87%',
                        timeCommitment: '6-12 months',
                        difficulty: 'High',
                        whyPick: 'Develops critical thinking, research methodology skills, and positions you for graduate school or academic careers',
                        skills: ['Research Methods', 'Data Analysis', 'Academic Writing'],
                        outcomes: ['Publications', 'Conference presentations', 'Graduate school preparation'],
                        findings: [
                          'Excellent academic performance with 3.8+ GPA in major courses',
                          'Strong analytical and writing skills demonstrated in coursework',
                          'Professor recommendations noting research potential',
                          'Interest in pursuing graduate studies or PhD programs'
                        ],
                        connections: [
                          'Builds on your A-level performance in research methodology courses',
                          'Leverages your relationship with Dr. Smith who offered mentorship',
                          'Supports your graduate school application goals for next year',
                          'Aligns with your academic interests in behavioral psychology'
                        ],
                        impact: 'Your strong academic foundation and faculty relationships position you perfectly for research success. This project will differentiate your graduate school applications while providing real experience in your chosen field.'
                      },
                      {
                        id: 'startup-venture',
                        title: 'Entrepreneurial Venture',
                        category: 'Business',
                        description: 'Launch a student-focused startup or business with real market potential',
                        match: '81%',
                        timeCommitment: '12+ months',
                        difficulty: 'High',
                        whyPick: 'Teaches business fundamentals, risk management, and innovation while building valuable professional networks',
                        skills: ['Business Development', 'Financial Planning', 'Marketing'],
                        outcomes: ['Business experience', 'Revenue generation', 'Professional network']
                      },
                      {
                        id: 'creative-portfolio',
                        title: 'Creative Portfolio Project',
                        category: 'Arts & Media',
                        description: 'Build a standout creative portfolio showcasing your artistic talents and vision',
                        match: '89%',
                        timeCommitment: '2-4 months',
                        difficulty: 'Medium',
                        whyPick: 'Showcases creativity, builds a professional portfolio, and opens doors to creative industry opportunities',
                        skills: ['Creative Design', 'Digital Tools', 'Portfolio Curation'],
                        outcomes: ['Professional portfolio', 'Industry connections', 'Creative recognition']
                      },
                      {
                        id: 'tech-innovation',
                        title: 'Technology Innovation Lab',
                        category: 'STEM',
                        description: 'Develop innovative technology solutions to real-world problems',
                        match: '85%',
                        timeCommitment: '4-8 months',
                        difficulty: 'High',
                        whyPick: 'Builds technical expertise, problem-solving skills, and positions you at the forefront of innovation',
                        skills: ['Programming', 'Problem Solving', 'Technical Design'],
                        outcomes: ['Technical skills', 'Innovation experience', 'Industry relevance']
                      },
                      {
                        id: 'cultural-exchange',
                        title: 'Cultural Exchange Initiative',
                        category: 'Global Engagement',
                        description: 'Bridge cultural gaps through organized exchange programs and events',
                        match: '78%',
                        timeCommitment: '3-5 months',
                        difficulty: 'Medium',
                        whyPick: 'Develops cultural competency, language skills, and global perspective valuable in today\'s interconnected world',
                        skills: ['Cultural Intelligence', 'Communication', 'Event Planning'],
                        outcomes: ['Global perspective', 'Language skills', 'Cultural network']
                      }
                    ].map((project) => (
                      <Collapsible key={project.id} open={expandedProjects.includes(project.id)} onOpenChange={() => toggleProject(project.id)}>
                        <CollapsibleTrigger asChild>
                          <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-primary/60">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    {expandedProjects.includes(project.id) ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <h4 className="font-semibold text-base text-foreground">{project.title}</h4>
                                    <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                                  </div>
                                  <div className="ml-6">
                                    <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                    <div className="text-lg font-bold text-primary">{project.match}</div>
                                    <div className="text-xs text-muted-foreground">Match</div>
                                  </div>
                                  
                                  <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-amber/10 to-amber/5 border border-amber/20">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span className="text-xs font-semibold text-foreground">{project.timeCommitment}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Duration</div>
                                  </div>
                                  
                                  <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-blue/10 to-blue/5 border border-blue/20">
                                    <div className="flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3 text-blue-600" />
                                      <span className="text-xs font-semibold text-foreground">{project.difficulty}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Difficulty</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <Card className="bg-muted/30">
                            <CardContent className="p-6">
                              <div className="space-y-5">
                                {/* Top Section: Why Choose This Project (Compact with Skills on Right) */}
                                <Card className="bg-gradient-to-r from-primary/8 to-accent/8 border-primary/20 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/15 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
                                  
                                  <CardContent className="p-4 relative">
                                    <div className="grid md:grid-cols-5 gap-4 items-start">
                                      {/* Left side - Why Choose (3/5 width) */}
                                      <div className="md:col-span-3 space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <Star className="h-4 w-4 text-primary" />
                                          <h5 className="text-lg font-bold text-foreground">Why Choose This Project</h5>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{project.whyPick}</p>
                                      </div>

                                      {/* Right side - Skills (2/5 width) */}
                                      <div className="md:col-span-2 space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <Brain className="h-4 w-4 text-accent" />
                                          <h6 className="text-sm font-semibold text-foreground">Key Skills</h6>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <TooltipProvider>
                                            {project.skills.slice(0, 3).map((skill, idx) => {
                                              // Hard coded skill definitions for tooltip content
                                              const skillDefinitions = {
                                                'Leadership': 'Ability to guide teams and inspire others',
                                                'Project Management': 'Planning and organizing resources effectively',
                                                'Community Engagement': 'Building collaborative relationships',
                                                'Research Methods': 'Systematic data gathering and analysis',
                                                'Data Analysis': 'Processing data to discover insights',
                                                'Academic Writing': 'Clear scholarly communication',
                                                'Business Development': 'Growing business opportunities',
                                                'Financial Planning': 'Managing budgets sustainably',
                                                'Marketing': 'Promoting to target audiences',
                                                'Creative Design': 'Visual problem-solving',
                                                'Digital Tools': 'Technology platform proficiency',
                                                'Portfolio Curation': 'Showcasing work effectively',
                                                'Programming': 'Writing software solutions',
                                                'Problem Solving': 'Analytical thinking',
                                                'Technical Design': 'Creating system architectures',
                                                'Cultural Intelligence': 'Adapting to diverse contexts',
                                                'Communication': 'Effective expression',
                                                'Event Planning': 'Coordinating successful events'
                                              };
                                              
                                              return (
                                                <Tooltip key={idx}>
                                                  <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-primary/15 hover:bg-primary/5 transition-all cursor-help text-xs">
                                                      <span className="font-medium text-foreground">{skill}</span>
                                                      <HelpCircle className="h-3 w-3 text-primary opacity-50" />
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="left" className="max-w-xs">
                                                    <p className="text-xs">{skillDefinitions[skill] || 'Essential project skill'}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              );
                                            })}
                                          </TooltipProvider>
                                          {project.skills.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center pt-1">
                                              +{project.skills.length - 3} more skills
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Middle Section: Expected Outcomes (Compact Full Width) */}
                                <Card className="bg-gradient-to-r from-emerald-500/6 to-teal-500/6 border-emerald-500/15 shadow-md hover:shadow-lg transition-all duration-300">
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                                      <h6 className="text-lg font-bold text-foreground">Expected Outcomes</h6>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-3 gap-3">
                                      {project.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                                          <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <div className="font-medium text-foreground text-sm capitalize truncate">{outcome}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {idx === 0 ? 'Portfolio showcase' : 
                                               idx === 1 ? 'Network building' : 
                                               'Personal growth'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Third Section: Key Findings & Profile Connections (Compact Side by Side) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <Card className="bg-gradient-to-br from-amber-500/6 to-orange-500/6 border-amber-500/15 shadow-md hover:shadow-lg transition-all duration-300 group">
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-4 h-4 text-amber-600" />
                                        <h6 className="text-sm font-bold text-foreground">Key Findings</h6>
                                      </div>
                                      
                                      <div className="space-y-2 max-h-24 overflow-y-auto">
                                        {project.findings?.slice(0, 3).map((finding: string, index: number) => (
                                          <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground leading-tight">
                                            <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                                            <span className="line-clamp-2">{finding}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="bg-gradient-to-br from-indigo-500/6 to-purple-500/6 border-indigo-500/15 shadow-md hover:shadow-lg transition-all duration-300 group">
                                    <CardContent className="p-3">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Link className="w-4 h-4 text-indigo-600" />
                                        <h6 className="text-sm font-bold text-foreground">Profile Alignment</h6>
                                      </div>
                                      
                                      <div className="space-y-2 max-h-24 overflow-y-auto">
                                        {project.connections?.slice(0, 3).map((connection: string, index: number) => (
                                          <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground leading-tight">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                                            <span className="line-clamp-2">{connection}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Bottom Section: Impact Assessment (Compact Full Width) */}
                                <Card className="bg-gradient-to-r from-rose-500/6 to-purple-500/6 border-rose-500/15 shadow-md hover:shadow-lg transition-all duration-300">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Scale className="h-4 w-4 text-rose-600" />
                                      <h6 className="text-sm font-bold text-foreground">Impact Assessment</h6>
                                    </div>
                                    
                                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                      {project.impact}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Action Button */}
                                <div className="flex justify-center pt-4 border-t border-border/30">
                                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Start Planning & Customize Project
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Project Types & Strategies Section */}
        <section className="relative">
          {/* Section Header with Visual Separator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-red-500/10 rounded-full px-6 py-3 mb-4 border border-purple-200/50">
              <Code className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold text-foreground">Project Types & Strategic Focus</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore different project categories and strategic approaches to build a comprehensive portfolio
            </p>
          </div>

          {/* Section Content Card */}
          <Card className="gradient-project-card border-purple-200/30 shadow-soft">
            <CardContent className="p-8">
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
            </CardContent>
          </Card>
        </section>

        {/* AI Collaboration Modes Section */}
        <section className="relative">
          {/* Section Header with Visual Separator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-red-500/10 rounded-full px-6 py-3 mb-4 border border-purple-200/50">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold text-foreground">AI Collaboration Modes</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your AI collaboration style to optimize project development and learning outcomes
            </p>
          </div>

          {/* Section Content Card */}
          <Card className="gradient-project-card border-purple-200/30 shadow-soft">
            <CardContent className="p-8">
          
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
            </CardContent>
          </Card>
        </section>

        {/* Uniqueness Preservation Section */}
        <section className="relative">
          {/* Section Header with Visual Separator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-red-500/10 rounded-full px-6 py-3 mb-4 border border-purple-200/50">
              <Star className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold text-foreground">Uniqueness Preservation</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advanced metrics and tracking to ensure your projects stand out and maintain competitive advantage
            </p>
          </div>

          {/* Section Content Card */}
          <Card className="gradient-project-card border-purple-200/30 shadow-soft">
            <CardContent className="p-8">
          
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
            </CardContent>
          </Card>
        </section>
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
          <div className="h-80 p-3 overflow-y-auto">
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
          </div>
          
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