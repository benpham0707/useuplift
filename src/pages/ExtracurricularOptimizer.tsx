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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-primary rounded-lg">
                  <Brain className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Academic Planning Intelligence</h1>
                  <p className="text-sm text-muted-foreground">Strategic planning dashboard for academic success</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Planning
              </Button>
              <Button size="sm">
                <Target className="h-4 w-4 mr-2" />
                Start Strategy
              </Button>
            </div>
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

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Planning Areas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Strategic Planning Areas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 w-full mb-6">
                    {planningAreas.map((area) => (
                      <TabsTrigger key={area.id} value={area.id} className="flex flex-col gap-1 p-3">
                        <area.icon className="h-4 w-4" />
                        <span className="text-xs">{area.title}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {planningAreas.map((area) => (
                    <TabsContent key={area.id} value={area.id} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{area.title}</h3>
                          <p className="text-sm text-muted-foreground">{area.description}</p>
                        </div>
                        <Badge variant={area.status === 'Active' ? 'default' : 'secondary'}>
                          {area.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{area.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${area.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Planning
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                      <Badge 
                        variant={rec.priority === 'High' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-medium mb-1">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{action.title}</span>
                    {action.urgent && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanningIntelligence;