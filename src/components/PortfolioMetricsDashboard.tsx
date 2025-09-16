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
  Eye,
  Zap,
  Briefcase
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Mock data for demonstration - This represents individual project data with comprehensive analytics
const projectsData = [
  {
    id: 1,
    title: "Community Garden App",
    type: "Technical",
    completedDate: "2024-06-15",
    verified: true,
    overview: {
      description: "A full-stack web application connecting urban gardeners with community resources",
      achievements: ["Served 200+ community members", "Reduced food waste by 30%", "Built full-stack web application"],
      impactHours: 120,
      portfolioAlignment: 95,
      status: "Completed & Deployed",
      timeline: "6 months"
    },
    skills: {
      gained: ["React", "Node.js", "Community Engagement", "Project Management"],
      timeline: [
        { month: "Jan", technical: 2, community: 1, leadership: 0 },
        { month: "Feb", technical: 4, community: 2, leadership: 1 },
        { month: "Mar", technical: 6, community: 4, leadership: 2 },
        { month: "Apr", technical: 8, community: 6, leadership: 3 },
        { month: "May", technical: 9, community: 7, leadership: 4 },
        { month: "Jun", technical: 10, community: 8, leadership: 5 }
      ],
      radar: [
        { skill: "Frontend Dev", level: 90 },
        { skill: "Backend Dev", level: 75 },
        { skill: "UI/UX Design", level: 70 },
        { skill: "Project Mgmt", level: 80 },
        { skill: "Community Eng", level: 85 }
      ]
    },
    narrative: {
      themes: ["Technology for Social Good", "Environmental Impact", "Community Building"],
      storyAlignment: 95,
      uniqueValue: "Bridging technology and environmental sustainability",
      portfolioFit: "Demonstrates technical skills applied to meaningful social impact"
    },
    insights: {
      learningRate: 87,
      impactMetrics: [
        { metric: "User Engagement", value: 85, trend: "+25%" },
        { metric: "Technical Complexity", value: 80, trend: "+40%" },
        { metric: "Community Impact", value: 95, trend: "+60%" }
      ],
      challenges: ["User adoption", "Data privacy", "Scalability"],
      aiRecommendations: [
        "Consider adding mobile app version to increase accessibility",
        "Document technical architecture for portfolio showcase",
        "Explore partnerships with local environmental organizations"
      ]
    }
  },
  {
    id: 2,
    title: "Youth Mentorship Program",
    type: "Social Impact",
    completedDate: "2024-05-20",
    verified: true,
    overview: {
      description: "Comprehensive mentorship program for underserved high school students",
      achievements: ["Mentored 15 students", "95% graduation rate improvement", "Created curriculum framework"],
      impactHours: 80,
      portfolioAlignment: 88,
      status: "Ongoing Program",
      timeline: "8 months"
    },
    skills: {
      gained: ["Leadership", "Curriculum Design", "Public Speaking", "Empathy"],
      timeline: [
        { month: "Oct", leadership: 3, communication: 2, empathy: 1 },
        { month: "Nov", leadership: 5, communication: 4, empathy: 3 },
        { month: "Dec", leadership: 7, communication: 6, empathy: 5 },
        { month: "Jan", leadership: 8, communication: 7, empathy: 7 },
        { month: "Feb", leadership: 9, communication: 8, empathy: 8 },
        { month: "Mar", leadership: 10, communication: 9, empathy: 9 }
      ],
      radar: [
        { skill: "Leadership", level: 85 },
        { skill: "Communication", level: 90 },
        { skill: "Empathy", level: 95 },
        { skill: "Curriculum Design", level: 70 },
        { skill: "Program Mgmt", level: 75 }
      ]
    },
    narrative: {
      themes: ["Educational Equity", "Youth Development", "Community Leadership"],
      storyAlignment: 88,
      uniqueValue: "Proven track record of educational impact and leadership",
      portfolioFit: "Shows commitment to social justice and community development"
    },
    insights: {
      learningRate: 92,
      impactMetrics: [
        { metric: "Student Outcomes", value: 95, trend: "+35%" },
        { metric: "Leadership Growth", value: 85, trend: "+50%" },
        { metric: "Program Reach", value: 75, trend: "+20%" }
      ],
      challenges: ["Scheduling conflicts", "Engagement retention", "Resource constraints"],
      aiRecommendations: [
        "Document success stories for scholarship applications",
        "Create scalable mentorship model for other schools",
        "Build partnerships with local businesses for student opportunities"
      ]
    }
  },
  {
    id: 3,
    title: "Sustainable Fashion Brand",
    type: "Entrepreneurial",
    completedDate: "2024-04-10",
    verified: false,
    overview: {
      description: "Eco-friendly fashion startup focused on upcycled materials and ethical production",
      achievements: ["$5K revenue in 3 months", "50+ sustainable products sold", "Featured in local media"],
      impactHours: 150,
      portfolioAlignment: 92,
      status: "Active Business",
      timeline: "12 months"
    },
    skills: {
      gained: ["Business Development", "Marketing", "Supply Chain", "Financial Planning"],
      timeline: [
        { month: "May", business: 2, marketing: 1, finance: 1 },
        { month: "Jun", business: 4, marketing: 3, finance: 2 },
        { month: "Jul", business: 6, marketing: 5, finance: 4 },
        { month: "Aug", business: 8, marketing: 7, finance: 6 },
        { month: "Sep", business: 9, marketing: 8, finance: 7 },
        { month: "Oct", business: 10, marketing: 9, finance: 8 }
      ],
      radar: [
        { skill: "Business Dev", level: 80 },
        { skill: "Marketing", level: 85 },
        { skill: "Finance", level: 70 },
        { skill: "Supply Chain", level: 75 },
        { skill: "Sustainability", level: 90 }
      ]
    },
    narrative: {
      themes: ["Environmental Sustainability", "Social Entrepreneurship", "Innovation"],
      storyAlignment: 92,
      uniqueValue: "Combining business acumen with environmental consciousness",
      portfolioFit: "Demonstrates entrepreneurial mindset and commitment to sustainability"
    },
    insights: {
      learningRate: 78,
      impactMetrics: [
        { metric: "Revenue Growth", value: 70, trend: "+200%" },
        { metric: "Market Reach", value: 60, trend: "+150%" },
        { metric: "Sustainability Impact", value: 90, trend: "+80%" }
      ],
      challenges: ["Market research", "Funding", "Competitor analysis"],
      aiRecommendations: [
        "Develop B-Corp certification for credibility",
        "Create impact measurement dashboard",
        "Explore university partnership opportunities"
      ]
    }
  }
];

export const PortfolioMetricsDashboard = () => {
  const ProjectCard = ({ project }: { project: typeof projectsData[0] }) => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
      <Card className="w-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{project.type}</Badge>
                <span>•</span>
                <span>{project.overview.timeline}</span>
                <span>•</span>
                <span>{project.overview.impactHours}h impact</span>
              </CardDescription>
            </div>
            <Badge variant={project.verified ? "default" : "secondary"}>
              {project.verified ? "Verified" : "Pending"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="narrative">Narrative</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <p className="text-muted-foreground">{project.overview.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Key Achievements
                    </h4>
                    <ul className="space-y-2">
                      {project.overview.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Project Metrics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <Badge variant="outline">{project.overview.status}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Portfolio Alignment:</span>
                        <span className="font-medium">{project.overview.portfolioAlignment}%</span>
                      </div>
                      <Progress value={project.overview.portfolioAlignment} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Skills Growth Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={project.skills.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey={Object.keys(project.skills.timeline[0]).filter(k => k !== 'month')[0]} 
                              stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
                        <Area type="monotone" dataKey={Object.keys(project.skills.timeline[0]).filter(k => k !== 'month')[1]} 
                              stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" />
                        <Area type="monotone" dataKey={Object.keys(project.skills.timeline[0]).filter(k => k !== 'month')[2]} 
                              stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Skill Proficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={project.skills.radar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Level" dataKey="level" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Skills Gained
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.skills.gained.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="narrative" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Narrative Themes
                  </h4>
                  <div className="space-y-2">
                    {project.narrative.themes.map((theme) => (
                      <div key={theme} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="font-medium">{theme}</span>
                        <Badge variant="default">Strong</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Story Alignment
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Story Coherence</span>
                      <span className="font-bold">{project.narrative.storyAlignment}%</span>
                    </div>
                    <Progress value={project.narrative.storyAlignment} />
                    
                    <div className="mt-4 p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">Unique Value Proposition</p>
                      <p className="font-medium">{project.narrative.uniqueValue}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">Portfolio Fit</p>
                      <p className="font-medium">{project.narrative.portfolioFit}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Impact Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.insights.impactMetrics.map((metric) => (
                        <div key={metric.metric} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{metric.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{metric.value}%</span>
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {metric.trend}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={metric.value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {project.insights.aiRecommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <Zap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Learning Rate
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{project.insights.learningRate}%</span>
                      <Badge variant="default">Excellent</Badge>
                    </div>
                    <Progress value={project.insights.learningRate} className="mt-2" />
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Challenges Overcome
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {project.insights.challenges.map((challenge) => (
                      <div key={challenge} className="p-3 rounded-lg bg-muted/50 text-center">
                        <span className="text-sm font-medium">{challenge}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Portfolio Metrics & Insights
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Deep dive into each of your completed projects with comprehensive analytics and insights
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{projectsData.length}</div>
            <p className="text-sm text-muted-foreground">Completed Projects</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {projectsData.reduce((acc, p) => acc + p.overview.impactHours, 0)}h
            </div>
            <p className="text-sm text-muted-foreground">Total Impact Hours</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(projectsData.reduce((acc, p) => acc + p.overview.portfolioAlignment, 0) / projectsData.length)}%
            </div>
            <p className="text-sm text-muted-foreground">Avg Portfolio Alignment</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {projectsData.filter(p => p.verified).length}/{projectsData.length}
            </div>
            <p className="text-sm text-muted-foreground">Verified Projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="space-y-8">
        {projectsData.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};