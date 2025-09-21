import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  BarChart3,
  PlayCircle,
  Eye,
  Settings,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActiveProjects = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('progress');
  const [filterBy, setFilterBy] = useState('all');

  // Hard coded data for active projects with comprehensive tracking metrics
  const activeProjects = [
    {
      id: 'food-waste-tracker',
      title: 'Campus Food Waste Tracker',
      description: 'Mobile app to track and reduce food waste in campus dining',
      progress: 85,
      status: 'active',
      type: 'social-impact',
      priority: 'High',
      timeInvested: 32,
      totalTimeEstimate: 120,
      deadline: '2025-12-15',
      impactRating: 9.2,
      nextMilestone: 'Stakeholder interviews complete',
      recentActivity: '2 days ago',
      completionPrediction: '3 weeks',
      stage: 'Idea Exploration',
      teamSize: 1,
      technologies: ['React Native', 'Node.js', 'PostgreSQL'],
      milestones: [
        { name: 'Problem Research', completed: true, date: '2024-09-01' },
        { name: 'User Interviews', completed: true, date: '2024-09-15' },
        { name: 'Stakeholder Meetings', completed: false, date: '2024-10-01' },
        { name: 'MVP Development', completed: false, date: '2024-11-15' }
      ]
    },
    {
      id: 'study-group-matcher',
      title: 'Study Group Matcher Algorithm',
      description: 'Machine learning algorithm to match students for optimal study groups',
      progress: 60,
      status: 'active',
      type: 'technical',
      priority: 'Medium',
      timeInvested: 45,
      totalTimeEstimate: 80,
      deadline: '2025-11-30',
      impactRating: 7.8,
      nextMilestone: 'MVP testing with beta users',
      recentActivity: '1 day ago',
      completionPrediction: '5 weeks',
      stage: 'Development',
      teamSize: 2,
      technologies: ['Python', 'TensorFlow', 'React', 'FastAPI'],
      milestones: [
        { name: 'Algorithm Design', completed: true, date: '2024-08-20' },
        { name: 'Data Collection', completed: true, date: '2024-09-10' },
        { name: 'Model Training', completed: false, date: '2024-10-15' },
        { name: 'Beta Testing', completed: false, date: '2024-11-01' }
      ]
    },
    {
      id: 'photography-portfolio',
      title: 'Photography Portfolio Site',
      description: 'Professional photography portfolio with e-commerce integration',
      progress: 90,
      status: 'active',
      type: 'creative',
      priority: 'Low',
      timeInvested: 65,
      totalTimeEstimate: 70,
      deadline: '2025-10-20',
      impactRating: 6.5,
      nextMilestone: 'Portfolio submission to contests',
      recentActivity: '4 hours ago',
      completionPrediction: '1 week',
      stage: 'Launch Preparation',
      teamSize: 1,
      technologies: ['Next.js', 'Tailwind CSS', 'Stripe', 'Vercel'],
      milestones: [
        { name: 'Design System', completed: true, date: '2024-08-01' },
        { name: 'Portfolio Development', completed: true, date: '2024-09-01' },
        { name: 'E-commerce Integration', completed: true, date: '2024-09-20' },
        { name: 'Contest Submission', completed: false, date: '2024-10-20' }
      ]
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'social-impact':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'creative':
        return 'bg-purple-100 text-purple-800';
      case 'entrepreneurial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedProjects = activeProjects
    .filter(project => {
      if (filterBy === 'all') return true;
      return project.type === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'impact':
          return b.impactRating - a.impactRating;
        default:
          return 0;
      }
    });

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
              <BreadcrumbPage>Active Projects</BreadcrumbPage>
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
              <h1 className="text-4xl font-bold text-foreground">Active Projects</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Manage and track your current project development
              </p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <PlayCircle className="h-4 w-4" />
            <span>Start New Project</span>
          </Button>
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="social-impact">Social Impact</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="entrepreneurial">Entrepreneurial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Sort by Progress</SelectItem>
                <SelectItem value="deadline">Sort by Deadline</SelectItem>
                <SelectItem value="impact">Sort by Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedProjects.length} active project{filteredAndSortedProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getTypeColor(project.type)}>
                      {project.type.replace('-', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Impact: {project.impactRating}/10</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{project.timeInvested}h / {project.totalTimeEstimate}h</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">ETA: {project.completionPrediction}</span>
                    </div>
                  </div>
                </div>

                {/* Next Milestone */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Next Milestone</p>
                      <p className="text-sm text-muted-foreground">{project.nextMilestone}</p>
                    </div>
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <p className="text-sm font-medium mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Last updated {project.recentActivity}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Portfolio Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Average Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(activeProjects.reduce((sum, p) => sum + p.impactRating, 0) / activeProjects.length).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Average Impact</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {activeProjects.reduce((sum, p) => sum + p.timeInvested, 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Time Invested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {activeProjects.filter(p => p.progress >= 80).length}
                </div>
                <div className="text-sm text-muted-foreground">Near Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveProjects;