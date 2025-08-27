import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Brain, 
  GraduationCap,
  Lightbulb,
  Users,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Settings,
  Search,
  PlusCircle,
  MapPin,
  Award,
  Code,
  MessageSquare,
  Briefcase,
  Globe,
  Building,
  Play,
  Home,
  User,
  Clock,
  ChevronDown
} from 'lucide-react';

const AcademicPlanningIntelligence = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("academic");
  const [isPlanningDropdownOpen, setIsPlanningDropdownOpen] = useState(false);

  // Hard coded dashboard data representing strategic planning metrics
  const dashboardStats = {
    academicPlan: { progress: 45, status: "In Progress", nextAction: "Schedule course selection" },
    projectPipeline: { active: 2, planned: 3, completed: 1 },
    extracurricularOptimization: { score: 78, target: 85, improved: "+12 pts" },
    skillGapAnalysis: { priority: 4, addressing: 2, completed: 8 }
  };

  // Planning sections for quick access
  const planningAreas = [
    {
      id: 'academic',
      title: 'Academic Planning',
      icon: BookOpen,
      description: 'Course selection & grade optimization',
      status: 'Active',
      progress: 45
    },
    {
      id: 'projects',
      title: 'Project Incubation',
      icon: Lightbulb,
      description: 'AI-collaborative project development',
      status: 'Planning',
      progress: 30
    },
    {
      id: 'extracurricular',
      title: 'Activity Strategy',
      icon: Users,
      description: 'Strategic involvement optimization',
      status: 'Review',
      progress: 78
    },
    {
      id: 'skills',
      title: 'Skill Development',
      icon: Brain,
      description: 'Targeted skill building roadmap',
      status: 'Active',
      progress: 62
    }
  ];

  const recentRecommendations = [
    {
      type: "Academic",
      title: "Add Data Structures (CS 301) to spring schedule",
      priority: "High",
      reason: "Prerequisite for advanced courses",
      timeframe: "Spring 2024"
    },
    {
      type: "Project",
      title: "Local business digitization initiative",
      priority: "Medium",
      reason: "Combines tech skills with community impact",
      timeframe: "6-8 months"
    },
    {
      type: "Extracurricular",
      title: "Run for treasurer position in CS club",
      priority: "High",
      reason: "Leadership experience + skill development",
      timeframe: "Next election cycle"
    }
  ];

  // Quick action items for dashboard
  const quickActions = [
    { icon: Calendar, title: "Schedule Course Planning Session", urgent: true },
    { icon: Search, title: "Discover New Project Ideas", urgent: false },
    { icon: Target, title: "Review Activity Portfolio", urgent: false },
    { icon: BarChart3, title: "Analyze Skill Gaps", urgent: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Navigation */}
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
              
              <Button variant="ghost" size="sm">
                Features
              </Button>
              
              {/* Academic Planning Dropdown */}
              <div className="relative">
                <Button 
                  variant="secondary"
                  size="sm"
                  onMouseEnter={() => setIsPlanningDropdownOpen(true)}
                  onMouseLeave={() => setIsPlanningDropdownOpen(false)}
                  className="flex items-center space-x-1"
                >
                  <span>Academic Planning</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {isPlanningDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-[60]"
                    onMouseEnter={() => setIsPlanningDropdownOpen(true)}
                    onMouseLeave={() => setIsPlanningDropdownOpen(false)}
                  >
                    <div className="py-2">
                      {planningAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setActiveTab(area.id);
                            setIsPlanningDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center space-x-2 ${
                            activeTab === area.id ? 'bg-muted text-primary font-medium' : 'text-foreground'
                          }`}
                        >
                          <area.icon className="h-4 w-4" />
                          <span>{area.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button variant="ghost" size="sm">
                Portfolio Scanner
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="hidden sm:flex">
                <Brain className="h-3 w-3 mr-1" />
                Strategic Planning
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Compact Dashboard Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Strategic Planning Dashboard</h1>
                <p className="text-xs text-muted-foreground">AI-powered academic and career optimization</p>
              </div>
            </div>
            <Button size="sm">
              <Target className="h-3 w-3 mr-2" />
              Start Planning
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Academic Plan</p>
                  <p className="text-2xl font-bold">{dashboardStats.academicPlan.progress}%</p>
                  <p className="text-xs text-muted-foreground">{dashboardStats.academicPlan.status}</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{dashboardStats.projectPipeline.active}</p>
                  <p className="text-xs text-muted-foreground">{dashboardStats.projectPipeline.planned} in pipeline</p>
                </div>
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activity Score</p>
                  <p className="text-2xl font-bold">{dashboardStats.extracurricularOptimization.score}</p>
                  <p className="text-xs text-green-600">{dashboardStats.extracurricularOptimization.improved} this month</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority Skills</p>
                  <p className="text-2xl font-bold">{dashboardStats.skillGapAnalysis.priority}</p>
                  <p className="text-xs text-muted-foreground">{dashboardStats.skillGapAnalysis.addressing} in progress</p>
                </div>
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Four Dashboard Sections */}
        <div className="space-y-12">
          
          {/* 1. Academic Planning Intelligence Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Academic Planning Intelligence</h2>
                  <p className="text-sm text-muted-foreground">Strategic course selection and grade optimization</p>
                </div>
              </div>
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                45% Complete
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Course Recommendation Engine</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Multi-horizon planning and strategic sequencing</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">3 recommendations ready</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Star className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Grade Optimization Strategy</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Strategic targeting and effort allocation</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Current GPA: 3.7</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Special Scenarios</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Transfer, double major, study abroad planning</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">5 scenarios available</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 2. Project Incubation System Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Project Incubation System</h2>
                  <p className="text-sm text-muted-foreground">AI-collaborative project development and uniqueness preservation</p>
                </div>
              </div>
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                2 Active Projects
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Search className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Project Discovery</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Interest mining and problem identification</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">Ready to explore</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">AI Collaboration</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Socratic mode and development partner</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Chat available</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Code className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Technical Projects</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Open source, hackathons, apps</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-600">3 ideas ready</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Entrepreneurial</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">MVP development and validation</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">Market research</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 3. Extracurricular Strategy Engine Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Extracurricular Strategy Engine</h2>
                  <p className="text-sm text-muted-foreground">Strategic involvement optimization for maximum impact</p>
                </div>
              </div>
              <Badge variant="secondary">
                <Award className="h-3 w-3 mr-1" />
                Score: 78/100
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Portfolio Analysis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Leadership mapping and ROI calculation</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">5 activities tracked</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Strategic Recommendations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Depth vs breadth optimization</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">3 recommendations</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Creation Opportunities</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Club founding and event organization</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">2 opportunities</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 4. Skill Development Accelerator Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Skill Development Accelerator</h2>
                  <p className="text-sm text-muted-foreground">Strategic skill building aligned with goals and market demands</p>
                </div>
              </div>
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                8 Skills Mastered
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Skill Gap Analysis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Current vs target state assessment</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-600">4 priority gaps</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Code className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Technical Skills</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Stack development and certifications</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">2 certs planned</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Soft Skills</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Communication and leadership development</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">In progress</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Domain Knowledge</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Industry learning and business acumen</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-600">3 domains</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanningIntelligence;