import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PortfolioMetricsDashboard from '@/components/PortfolioMetricsDashboard';
import { ArrowLeft, BarChart3, TrendingUp, Target, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectFoundation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('metrics');

  // Hard coded data values for project foundation analytics
  const foundationMetrics = {
    portfolioStrength: 78,
    impactScore: 8.2,
    uniquenessRating: 92,
    developmentVelocity: 85,
    strategicAlignment: 89
  };

  // Hard coded timeline data for progress tracking
  const timelineData = [
    { month: 'Jan', projects: 1, impact: 6.5, velocity: 60 },
    { month: 'Feb', projects: 2, impact: 7.2, velocity: 70 },
    { month: 'Mar', projects: 2, impact: 7.8, velocity: 75 },
    { month: 'Apr', projects: 3, impact: 8.1, velocity: 82 },
    { month: 'May', projects: 3, impact: 8.2, velocity: 85 }
  ];

  // Hard coded impact analysis data
  const impactAnalysis = {
    categories: [
      { name: 'Technical Skills', current: 85, target: 95, projects: 2 },
      { name: 'Social Impact', current: 92, target: 95, projects: 1 },
      { name: 'Creative Portfolio', current: 78, target: 90, projects: 1 },
      { name: 'Leadership', current: 72, target: 85, projects: 0 },
      { name: 'Entrepreneurship', current: 45, target: 75, projects: 0 }
    ],
    overallEffectiveness: 89,
    projectedGrowth: 15
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/project-incubation">Project Incubation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Foundation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/project-incubation')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Hub</span>
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Foundation Dashboard</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Comprehensive analytics and metrics for your project portfolio
              </p>
            </div>
          </div>
        </div>

        {/* Foundation Metrics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Metrics Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timeline & Progress</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Impact Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Metrics Dashboard Tab */}
          <TabsContent value="metrics" className="mt-6">
            <div className="space-y-6">
              {/* Key Metrics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{foundationMetrics.portfolioStrength}%</div>
                    <div className="text-sm text-muted-foreground">Portfolio Strength</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{foundationMetrics.impactScore}</div>
                    <div className="text-sm text-muted-foreground">Impact Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{foundationMetrics.uniquenessRating}%</div>
                    <div className="text-sm text-muted-foreground">Uniqueness</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{foundationMetrics.developmentVelocity}%</div>
                    <div className="text-sm text-muted-foreground">Dev Velocity</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{foundationMetrics.strategicAlignment}%</div>
                    <div className="text-sm text-muted-foreground">Alignment</div>
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Metrics Dashboard */}
              <PortfolioMetricsDashboard />
            </div>
          </TabsContent>

          {/* Timeline & Progress Tab */}
          <TabsContent value="timeline" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Development Timeline</CardTitle>
                  <CardDescription>Track your progress over time across different metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="impact" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Impact Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="velocity" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Development Velocity"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projects" 
                        stroke="#ffc658" 
                        strokeWidth={2}
                        name="Active Projects"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>May 2024</span>
                        <span className="text-green-600 font-semibold">+5% velocity</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>April 2024</span>
                        <span className="text-green-600 font-semibold">+1 project</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>March 2024</span>
                        <span className="text-blue-600 font-semibold">+0.6 impact</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Photography Portfolio Launch - Oct 20</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Study Matcher MVP - Nov 30</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Food Tracker Stakeholders - Dec 15</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Impact Analysis Tab */}
          <TabsContent value="impact" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Category Analysis</CardTitle>
                  <CardDescription>Progress towards your strategic goals across different areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {impactAnalysis.categories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {category.projects} project{category.projects !== 1 ? 's' : ''}
                            </span>
                            <span className="font-semibold">
                              {category.current}% / {category.target}%
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(category.current / category.target) * 100}%` }}
                            />
                          </div>
                          <div 
                            className="absolute top-0 w-1 h-2 bg-border"
                            style={{ left: `${(category.target / 100) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {impactAnalysis.overallEffectiveness}%
                      </div>
                      <p className="text-muted-foreground">
                        Your projects are having strong impact across multiple areas
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projected Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        +{impactAnalysis.projectedGrowth}%
                      </div>
                      <p className="text-muted-foreground">
                        Expected portfolio strength increase over next 6 months
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectFoundation;