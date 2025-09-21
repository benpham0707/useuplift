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
  Palette,
  Music,
  Camera,
  Mountain,
  GraduationCap,
  Microscope
} from "lucide-react";

// Simplified Portfolio Data - Hard coded mock data values representing student project portfolio
const portfolioData = [
  {
    id: 1,
    title: "Community Garden Network App",
    type: "Technical Leadership",
    category: "Social Impact Tech",
    description: "Revolutionary community-tech bridge serving 500+ families with measurable sustainability impact",
    completedDate: "2024-06-15",
    verified: true,
    projectScore: 94
  },
  {
    id: 2,
    title: "Youth Mental Health Peer Support Network",
    type: "Social Leadership", 
    category: "Mental Health Advocacy",
    description: "Peer support program reaching 300+ students across 4 schools with documented mental health improvements",
    completedDate: "2024-08-10",
    verified: true,
    projectScore: 96
  },
  {
    id: 3,
    title: "Climate Data Visualization Platform",
    type: "Research & Technology",
    category: "Environmental Science",
    description: "Interactive platform helping local government visualize climate impact data for policy decisions",
    completedDate: "2024-05-20",
    verified: true,
    projectScore: 88
  },
  {
    id: 4,
    title: "Multilingual Tutoring Program",
    type: "Education Leadership",
    category: "Language Access",
    description: "Volunteer program connecting bilingual students with English learners, serving 200+ families",
    completedDate: "2024-07-30",
    verified: false,
    projectScore: 85
  },
  {
    id: 5,
    title: "Student Artist Showcase Initiative",
    type: "Creative Leadership",
    category: "Arts & Culture",
    description: "School-wide program highlighting underrepresented student artists, featuring 50+ student works",
    completedDate: "2024-04-15",
    verified: true,
    projectScore: 82
  },
  {
    id: 6,
    title: "Debate Team Analytics System",
    type: "Academic Innovation",
    category: "Competitive Analytics",
    description: "Custom system tracking debate performance metrics, helping team achieve state championship",
    completedDate: "2024-03-10",
    verified: true,
    projectScore: 79
  }
];

// Simplified Project Detail Component
const ProjectDetailView: React.FC<{ project: any; onBack: () => void }> = ({ project, onBack }) => {
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
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold text-foreground">{project.title}</h1>
              {project.verified && <CheckCircle className="h-6 w-6 text-success" />}
            </div>
            
            <div className="flex gap-3 mb-6">
              <Badge variant="outline" className="border-primary/50 text-primary">
                {project.type}
              </Badge>
              <Badge variant="outline" className="border-accent/50 text-accent">
                {project.category}
              </Badge>
            </div>
            
            <p className="text-xl text-muted-foreground mb-6">{project.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{project.projectScore}</div>
                  <div className="text-sm text-muted-foreground">Project Score</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {new Date(project.completedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-success mb-2">
                    {project.verified ? 'Verified' : 'Pending'}
                  </div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                  <CardDescription>Key details and accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    This project demonstrates significant impact and growth. Detailed analysis shows 
                    strong performance across multiple dimensions including technical execution, 
                    community engagement, and measurable outcomes.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="impact" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Analysis</CardTitle>
                  <CardDescription>Measurable outcomes and community benefit</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    Impact metrics show positive community outcomes with documented improvements 
                    in target areas. This project created lasting value and demonstrated scalable 
                    approaches to community challenges.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Learning and growth opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    This project provided valuable learning experiences in leadership, technical skills, 
                    and community engagement. The experience offers rich material for personal 
                    statements and demonstrates readiness for advanced academic challenges.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const PortfolioMetricsDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'project'>('dashboard');

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
    portfolioData.reduce((sum, p) => sum + p.projectScore, 0) / portfolioData.length
  );

  if (viewMode === 'project' && selectedProject) {
    return <ProjectDetailView project={selectedProject} onBack={handleBackToDashboard} />;
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
                <div className="text-sm text-muted-foreground mt-1">Based on {portfolioData.length} projects</div>
              </div>
              <Progress value={portfolioStrength} className="w-full h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioData.map((project) => (
            <Card 
              key={project.id} 
              className="bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleProjectSelect(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                      {project.title}
                      {project.verified && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </CardTitle>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        {project.type}
                      </Badge>
                      <Badge variant="outline" className="border-accent/50 text-accent">
                        {project.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{project.projectScore}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(project.completedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-transform">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioMetricsDashboard;