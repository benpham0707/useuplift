import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Brain, 
  Users, 
  BookOpen, 
  Lightbulb,
  BarChart3,
  Star,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Trophy,
  Heart,
  Globe,
  Sparkles,
  Code,
  Network,
  Crown,
  Zap,
  School
} from "lucide-react";

// Import sophisticated analytics components
import ExpertApplicationIntelligence from "@/components/dashboard/ExpertApplicationIntelligence";
import ApplicationStrategyDashboard from "@/components/dashboard/ApplicationStrategyDashboard";
import NetworkRelationshipCapitalBuilder from "@/components/dashboard/NetworkRelationshipCapitalBuilder";
import ProjectEvolutionWorkshop from "@/components/dashboard/ProjectEvolutionWorkshop";

// Featured Portfolio Projects - Hard coded mock data values representing the top 3 strategic projects with enhanced depth
const featuredPortfolioProjects = [
  {
    id: 1,
    title: "Community Garden Network Platform",
    type: "Technical & Social Leadership",
    category: "Social Impact Technology",
    description: "Revolutionary community-tech bridge serving 500+ families across 8 neighborhoods with measurable sustainability impact and food security improvements",
    completedDate: "2024-06-15",
    verified: true,
    projectScore: 94,
    strategicImpactScore: 96,
    applicationAlignment: "Computer Science, Social Innovation, Sustainability Studies",
    competitiveAdvantage: "Unique intersection of technical innovation with deep community engagement, creating scalable model for urban agriculture",
    networkConnections: 47,
    stakeholders: ["Community Leaders", "City Council", "Tech Mentors", "Sustainability NGOs"],
    applicationStrength: "Demonstrates technical excellence with genuine social impact - rare combination that sets you apart",
    futureGrowthPotential: "High - Model being adopted by 3 other cities, patent application filed",
    icon: "Code"
  },
  {
    id: 2,
    title: "Youth Mental Health Peer Network",
    type: "Social Innovation & Leadership", 
    category: "Mental Health Systems Change",
    description: "Evidence-based peer support program reaching 300+ students across 4 school districts with documented 40% improvement in mental health outcomes",
    completedDate: "2024-08-10",
    verified: true,
    projectScore: 96,
    strategicImpactScore: 98,
    applicationAlignment: "Psychology, Public Health, Social Work, Pre-Med",
    competitiveAdvantage: "Created evidence-based program with published research outcomes - demonstrates both compassion and analytical rigor",
    networkConnections: 52,
    stakeholders: ["School Psychologists", "Peer Counselors", "Mental Health Researchers", "Parent Groups"],
    applicationStrength: "Shows leadership in critical social issue with measurable outcomes - highly compelling for competitive programs",
    futureGrowthPotential: "Very High - State education department wants to pilot statewide, research published in peer-reviewed journal",
    icon: "Heart"
  },
  {
    id: 3,
    title: "Climate Policy Data Intelligence",
    type: "Research & Policy Innovation",
    category: "Environmental Science & Policy",
    description: "Interactive data platform helping local government visualize climate impact trends, directly influencing $2.3M in green infrastructure funding decisions",
    completedDate: "2024-05-20",
    verified: true,
    projectScore: 92,
    strategicImpactScore: 94,
    applicationAlignment: "Environmental Science, Data Science, Public Policy, Economics",
    competitiveAdvantage: "Bridge between technical data science and real policy outcomes - rare combination of analytical and advocacy skills",
    networkConnections: 38,
    stakeholders: ["City Council Members", "Environmental Scientists", "Data Analysts", "Climate Activists"],
    applicationStrength: "Demonstrates ability to translate complex data into actionable policy - shows readiness for graduate-level research",
    futureGrowthPotential: "High - Platform being adopted by regional council of governments, invited to present at state climate summit",
    icon: "BarChart3"
  }
];

// Enhanced Project Analytics View with Rich Navigation to Sophisticated Dashboards
const ProjectAnalyticsView: React.FC<{ project: any; onBack: () => void }> = ({ project, onBack }) => {
  const [activeAnalytics, setActiveAnalytics] = useState<'overview' | 'expert-intelligence' | 'application-strategy' | 'network-builder' | 'evolution-workshop'>('overview');

  const getProjectIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Code,
      Heart,
      BarChart3,
      Target,
      Brain,
      Network
    };
    const IconComponent = iconMap[iconName] || Code;
    return <IconComponent className="h-8 w-8" />;
  };

  const renderAnalyticsContent = () => {
    switch (activeAnalytics) {
      case 'expert-intelligence':
        return <ExpertApplicationIntelligence projectData={project} />;
      case 'application-strategy':
        return <ApplicationStrategyDashboard projectData={project} />;
      case 'network-builder':
        return <NetworkRelationshipCapitalBuilder />;
      case 'evolution-workshop':
        return <ProjectEvolutionWorkshop />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strategic Impact Overview */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <Target className="h-6 w-6" />
                  Strategic Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">{project.strategicImpactScore}</div>
                    <div className="text-sm text-muted-foreground">Strategic Impact</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-3xl font-bold text-accent mb-1">{project.networkConnections}</div>
                    <div className="text-sm text-muted-foreground">Network Connections</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Application Alignment</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.applicationAlignment}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Competitive Advantage</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.competitiveAdvantage}</p>
                </div>
              </CardContent>
            </Card>

            {/* Application Strategy Insight */}
            <Card className="bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-accent">
                  <Crown className="h-6 w-6" />
                  Application Strategy Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Application Strength</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.applicationStrength}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Future Growth Potential</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.futureGrowthPotential}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Key Stakeholders</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.stakeholders.map((stakeholder: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-accent/50 text-accent">
                        {stakeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
        
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Project Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                {getProjectIcon(project.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-foreground">{project.title}</h1>
                  {project.verified && <CheckCircle className="h-6 w-6 text-success" />}
                </div>
                <div className="flex gap-3 mb-4">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {project.type}
                  </Badge>
                  <Badge variant="outline" className="border-accent/50 text-accent">
                    {project.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">{project.projectScore}</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-4xl">{project.description}</p>
          </div>

          {/* Rich Analytics Navigation */}
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button
                variant={activeAnalytics === 'overview' ? 'default' : 'outline'}
                onClick={() => setActiveAnalytics('overview')}
                className="h-auto py-4 px-4 flex-col gap-2"
              >
                <Target className="h-5 w-5" />
                <span className="text-sm">Strategic Overview</span>
              </Button>
              
              <Button
                variant={activeAnalytics === 'expert-intelligence' ? 'default' : 'outline'}
                onClick={() => setActiveAnalytics('expert-intelligence')}
                className="h-auto py-4 px-4 flex-col gap-2"
              >
                <Crown className="h-5 w-5" />
                <span className="text-sm">Expert Intelligence</span>
              </Button>
              
              <Button
                variant={activeAnalytics === 'application-strategy' ? 'default' : 'outline'}
                onClick={() => setActiveAnalytics('application-strategy')}
                className="h-auto py-4 px-4 flex-col gap-2"
              >
                <School className="h-5 w-5" />
                <span className="text-sm">Application Strategy</span>
              </Button>
              
              <Button
                variant={activeAnalytics === 'network-builder' ? 'default' : 'outline'}
                onClick={() => setActiveAnalytics('network-builder')}
                className="h-auto py-4 px-4 flex-col gap-2"
              >
                <Network className="h-5 w-5" />
                <span className="text-sm">Network Builder</span>
              </Button>
              
              <Button
                variant={activeAnalytics === 'evolution-workshop' ? 'default' : 'outline'}
                onClick={() => setActiveAnalytics('evolution-workshop')}
                className="h-auto py-4 px-4 flex-col gap-2"
              >
                <Zap className="h-5 w-5" />
                <span className="text-sm">Evolution Workshop</span>
              </Button>
            </div>
          </div>

          {/* Dynamic Analytics Content */}
          <div className="min-h-[600px]">
            {renderAnalyticsContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const PortfolioMetricsDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'project'>('dashboard');

  // Debug log to help identify any lingering references
  console.log('PortfolioMetricsDashboard loaded successfully');

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setViewMode('project');
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setViewMode('dashboard');
  };

  // Calculate Portfolio Strength Score
  const portfolioStrength = Math.round(
    featuredPortfolioProjects.reduce((sum, p) => sum + p.projectScore, 0) / featuredPortfolioProjects.length
  );

  if (viewMode === 'project' && selectedProject) {
    return <ProjectAnalyticsView project={selectedProject} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Clean Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Project Portfolio</h1>
          <p className="text-xl text-muted-foreground">Your completed projects and their impact</p>
        </div>

        {/* Single Portfolio Strength Card */}
        <div className="flex justify-center mb-12">
          <Card className="w-full max-w-md bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
                <div className="text-5xl font-bold text-primary mb-2">{portfolioStrength}</div>
                <div className="text-lg text-foreground font-medium">Portfolio Strength</div>
                <div className="text-sm text-muted-foreground mt-1">Based on {featuredPortfolioProjects.length} strategic projects</div>
              </div>
              <Progress value={portfolioStrength} className="w-full h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featuredPortfolioProjects.map((project) => {
            const getProjectIcon = (iconName: string) => {
              const iconMap: { [key: string]: React.ComponentType<any> } = {
                Code,
                Heart,
                BarChart3,
                Target,
                Brain,
                Network
              };
              const IconComponent = iconMap[iconName] || Code;
              return <IconComponent className="h-6 w-6" />;
            };

            return (
              <Card 
                key={project.id} 
                className="bg-card border-border hover:shadow-xl transition-all duration-500 cursor-pointer group relative overflow-hidden"
                onClick={() => handleProjectSelect(project)}
              >
                {/* Gradient overlay for visual depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                      {getProjectIcon(project.icon)}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.verified && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{project.projectScore}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>

                  <CardTitle className="text-xl mb-3 flex items-center gap-2 group-hover:text-primary transition-colors leading-tight">
                    {project.title}
                  </CardTitle>
                  
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                      {project.type}
                    </Badge>
                    <Badge variant="outline" className="border-accent/50 text-accent text-xs">
                      {project.category}
                    </Badge>
                  </div>
                  
                  <CardDescription className="text-sm leading-relaxed mb-6 line-clamp-3">
                    {project.description}
                  </CardDescription>

                  {/* Strategic Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-xl font-bold text-accent mb-1">{project.strategicImpactScore}</div>
                      <div className="text-xs text-muted-foreground">Strategic Impact</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-xl font-bold text-primary mb-1">{project.networkConnections}</div>
                      <div className="text-xs text-muted-foreground">Network Connections</div>
                    </div>
                  </div>

                  {/* Competitive Advantage Preview */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      Competitive Advantage
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {project.competitiveAdvantage}
                    </p>
                  </div>

                  {/* Application Alignment */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <School className="h-4 w-4 text-primary" />
                      Application Alignment
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {project.applicationAlignment}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(project.completedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-transform">
                      Analyze Project <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioMetricsDashboard;