import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Calendar,
  Star,
  CheckCircle,
  ArrowUp,
  Download,
  Eye
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Mock data for demonstration - This represents completed project metrics and portfolio analytics
const portfolioStats = {
  completedProjects: 12,
  skillsMastered: 24,
  impactHours: 480,
  portfolioScore: 87
};

const skillsTimelineData = [
  { month: "Jan", technical: 3, leadership: 1, creative: 2, communication: 2 },
  { month: "Feb", technical: 5, leadership: 2, creative: 3, communication: 3 },
  { month: "Mar", technical: 7, leadership: 4, creative: 4, communication: 5 },
  { month: "Apr", technical: 9, leadership: 6, creative: 5, communication: 6 },
  { month: "May", technical: 12, leadership: 8, creative: 7, communication: 8 },
  { month: "Jun", technical: 15, leadership: 10, creative: 9, communication: 10 }
];

const skillsRadarData = [
  { skill: "Technical", current: 85, potential: 95 },
  { skill: "Leadership", current: 70, potential: 90 },
  { skill: "Creative", current: 75, potential: 85 },
  { skill: "Communication", current: 80, potential: 95 },
  { skill: "Problem Solving", current: 90, potential: 95 },
  { skill: "Collaboration", current: 85, potential: 90 }
];

const completedProjects = [
  {
    id: 1,
    title: "Community Garden App",
    type: "Technical",
    completedDate: "2024-06-15",
    achievements: ["Served 200+ community members", "Reduced food waste by 30%", "Built full-stack web application"],
    skillsGained: ["React", "Node.js", "Community Engagement", "Project Management"],
    challenges: ["User adoption", "Data privacy", "Scalability"],
    impactHours: 120,
    portfolioAlignment: 95,
    verified: true
  },
  {
    id: 2,
    title: "Youth Mentorship Program",
    type: "Social Impact",
    completedDate: "2024-05-20",
    achievements: ["Mentored 15 students", "95% graduation rate improvement", "Created curriculum framework"],
    skillsGained: ["Leadership", "Curriculum Design", "Public Speaking", "Empathy"],
    challenges: ["Scheduling conflicts", "Engagement retention", "Resource constraints"],
    impactHours: 80,
    portfolioAlignment: 88,
    verified: true
  },
  {
    id: 3,
    title: "Sustainable Fashion Brand",
    type: "Entrepreneurial",
    completedDate: "2024-04-10",
    achievements: ["$5K revenue in 3 months", "50+ sustainable products sold", "Featured in local media"],
    skillsGained: ["Business Development", "Marketing", "Supply Chain", "Financial Planning"],
    challenges: ["Market research", "Funding", "Competitor analysis"],
    impactHours: 150,
    portfolioAlignment: 92,
    verified: false
  }
];

const narrativeInsights = {
  storyArcStrength: 85,
  experienceBalance: {
    work: 25,
    volunteer: 35,
    academic: 20,
    personal: 20
  },
  uniquenessScore: 78,
  applicationReadiness: 82
};

const learningMetrics = [
  { category: "Technical Growth", value: 85, growth: "+15%" },
  { category: "Leadership Development", value: 70, growth: "+25%" },
  { category: "Community Impact", value: 90, growth: "+20%" },
  { category: "Creative Expression", value: 75, growth: "+18%" }
];

export const PortfolioMetricsDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Portfolio Metrics & Insights
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Track your completed projects, skills progression, and portfolio narrative strength
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                <CheckCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.completedProjects}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +3 this semester
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills Mastered</CardTitle>
                <Brain className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.skillsMastered}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +8 new skills
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Hours</CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.impactHours}h</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +120h this quarter
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Score</CardTitle>
                <Target className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.portfolioScore}/100</div>
                <Progress value={portfolioStats.portfolioScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Portfolio Summary
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Application Profile
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Set New Goals
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Skills Acquisition Timeline
                </CardTitle>
                <CardDescription>Track how you've gained skills through projects over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={skillsTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="technical" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
                    <Area type="monotone" dataKey="leadership" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" />
                    <Area type="monotone" dataKey="creative" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" />
                    <Area type="monotone" dataKey="communication" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Skill Competency Radar
                </CardTitle>
                <CardDescription>Current vs potential skill levels across domains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillsRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current Level" dataKey="current" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Potential" dataKey="potential" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Skills by Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Most Valuable Skills
              </CardTitle>
              <CardDescription>Skills with highest impact potential and usage frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {["React Development", "Project Management", "Public Speaking", "Data Analysis", "Creative Design", "Community Building"].map((skill, index) => (
                  <div key={skill} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{skill}</p>
                      <p className="text-sm text-muted-foreground">Used in {3 + index} projects</p>
                    </div>
                    <Badge variant={index < 3 ? "default" : "secondary"}>{90 - index * 5}% impact</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Completed Projects Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {completedProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant={project.verified ? "default" : "secondary"}>
                      {project.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{project.type}</span>
                    <span>•</span>
                    <span>{project.impactHours}h impact</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Key Achievements</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {project.achievements.slice(0, 2).map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Award className="h-3 w-3 mt-1 flex-shrink-0" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedProject === project.id && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Skills Gained</p>
                        <div className="flex flex-wrap gap-1">
                          {project.skillsGained.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Challenges Overcome</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {project.challenges.map((challenge, i) => (
                            <li key={i}>• {challenge}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Portfolio Alignment</p>
                        <Progress value={project.portfolioAlignment} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{project.portfolioAlignment}% alignment with narrative</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="narrative" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Story Arc Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Portfolio Story Arc
                </CardTitle>
                <CardDescription>How your projects create a compelling narrative</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Story Coherence</span>
                    <span className="font-bold">{narrativeInsights.storyArcStrength}%</span>
                  </div>
                  <Progress value={narrativeInsights.storyArcStrength} />
                  
                  <div className="space-y-2 mt-6">
                    <p className="text-sm font-medium">Narrative Themes</p>
                    {["Technology for Social Good", "Community Leadership", "Sustainable Innovation"].map((theme) => (
                      <div key={theme} className="flex items-center justify-between text-sm">
                        <span>{theme}</span>
                        <Badge variant="secondary">Strong</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Experience Distribution
                </CardTitle>
                <CardDescription>Balance across different experience types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { category: "Work", value: narrativeInsights.experienceBalance.work },
                    { category: "Volunteer", value: narrativeInsights.experienceBalance.volunteer },
                    { category: "Academic", value: narrativeInsights.experienceBalance.academic },
                    { category: "Personal", value: narrativeInsights.experienceBalance.personal },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Application Readiness Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uniqueness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{narrativeInsights.uniquenessScore}%</div>
                <Progress value={narrativeInsights.uniquenessScore} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">How distinctive your profile is</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{narrativeInsights.applicationReadiness}%</div>
                <Progress value={narrativeInsights.applicationReadiness} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">Portfolio completeness for applications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impact Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">92%</div>
                <Progress value={92} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">Projected admissions impact</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Learning & Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningMetrics.map((metric) => (
              <Card key={metric.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      {metric.category}
                    </span>
                    <Badge variant="secondary">{metric.growth}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metric.value}%</div>
                  <Progress value={metric.value} />
                  <p className="text-sm text-muted-foreground mt-2">Growth trajectory over time</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI-Powered Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>AI-generated insights to strengthen your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Consider adding a research project",
                    description: "Your profile would benefit from academic research experience to round out your technical skills.",
                    priority: "High"
                  },
                  {
                    title: "Document your leadership evolution",
                    description: "Create case studies showing how your leadership style has developed through different projects.",
                    priority: "Medium"
                  },
                  {
                    title: "Strengthen quantitative impact metrics",
                    description: "Add more measurable outcomes to your community service projects for greater application impact.",
                    priority: "Medium"
                  }
                ].map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{rec.title}</p>
                        <Badge variant={rec.priority === "High" ? "destructive" : "secondary"} className="text-xs">
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};