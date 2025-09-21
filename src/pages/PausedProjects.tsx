import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Pause, 
  PlayCircle,
  Calendar, 
  Clock, 
  Star, 
  AlertTriangle,
  Archive,
  RefreshCw,
  Trash2,
  Eye,
  Settings,
  TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PausedProjects = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('pausedDate');
  const [actionFilter, setActionFilter] = useState('all');

  // Hard coded data for paused projects with pause reasons and resumption analysis
  const pausedProjects = [
    {
      id: 'mental-health-hub',
      title: 'Mental Health Resource Hub',
      description: 'Comprehensive platform connecting students with mental health resources',
      progress: 25,
      type: 'social-impact',
      priority: 'High',
      timeInvested: 12,
      totalTimeEstimate: 90,
      originalDeadline: '2026-03-01',
      pausedDate: '2024-09-01',
      pauseReason: 'Waiting for IRB approval for user research',
      impactRating: 8.9,
      stage: 'Research',
      nextMilestone: 'Complete user research interviews',
      technologies: ['React', 'Node.js', 'MongoDB', 'Socket.io'],
      pauseAnalysis: {
        canResume: true,
        blockers: ['IRB approval pending'],
        estimatedResumeTime: '2 weeks',
        urgency: 'High',
        reason: 'External dependency',
        resumptionPlan: 'Resume once ethical approval is obtained'
      },
      teamSize: 2,
      stakeholders: ['University Counseling Center', 'Student Health Services']
    },
    {
      id: 'tutoring-marketplace',
      title: 'Campus Tutoring Marketplace',
      description: 'Two-sided marketplace connecting students with peer tutors',
      progress: 15,
      type: 'entrepreneurial',
      priority: 'Medium',
      timeInvested: 8,
      totalTimeEstimate: 150,
      originalDeadline: '2026-05-15',
      pausedDate: '2024-08-15',
      pauseReason: 'Competing priorities with higher impact projects',
      impactRating: 7.3,
      stage: 'Ideation',
      nextMilestone: 'Market validation research',
      technologies: ['React Native', 'Firebase', 'Stripe', 'GraphQL'],
      pauseAnalysis: {
        canResume: true,
        blockers: ['Time allocation conflict'],
        estimatedResumeTime: '3-4 weeks',
        urgency: 'Low',
        reason: 'Resource prioritization',
        resumptionPlan: 'Resume after current projects reach 80% completion'
      },
      teamSize: 1,
      stakeholders: ['Academic Success Center', 'Student Government']
    },
    {
      id: 'sustainability-dashboard',
      title: 'Personal Carbon Footprint Dashboard',
      description: 'Individual tracking and reduction recommendations for carbon footprint',
      progress: 40,
      type: 'environmental',
      priority: 'Low',
      timeInvested: 25,
      totalTimeEstimate: 60,
      originalDeadline: '2025-08-01',
      pausedDate: '2024-07-20',
      pauseReason: 'Similar solution launched by competitor',
      impactRating: 6.8,
      stage: 'Development',
      nextMilestone: 'Data source integration',
      technologies: ['Vue.js', 'D3.js', 'Python', 'APIs'],
      pauseAnalysis: {
        canResume: false,
        blockers: ['Market saturation', 'Differentiation challenges'],
        estimatedResumeTime: 'N/A',
        urgency: 'Very Low',
        reason: 'Market conditions',
        resumptionPlan: 'Consider pivoting to institutional focus or archiving'
      },
      teamSize: 1,
      stakeholders: ['Environmental Club', 'Sustainability Office']
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
      case 'environmental':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      case 'Very Low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedProjects = pausedProjects
    .filter(project => {
      if (actionFilter === 'all') return true;
      if (actionFilter === 'resumable') return project.pauseAnalysis.canResume;
      if (actionFilter === 'blocked') return !project.pauseAnalysis.canResume;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pausedDate':
          return new Date(b.pausedDate).getTime() - new Date(a.pausedDate).getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'urgency':
          const urgencyOrder = { 'High': 4, 'Medium': 3, 'Low': 2, 'Very Low': 1 };
          return urgencyOrder[b.pauseAnalysis.urgency as keyof typeof urgencyOrder] - 
                 urgencyOrder[a.pauseAnalysis.urgency as keyof typeof urgencyOrder];
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
              <BreadcrumbPage>Paused Projects</BreadcrumbPage>
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
              <h1 className="text-4xl font-bold text-foreground">Paused Projects</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Review suspended projects and plan resumption strategies
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="resumable">Ready to Resume</SelectItem>
                <SelectItem value="blocked">Blocked Projects</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pausedDate">Sort by Pause Date</SelectItem>
                <SelectItem value="progress">Sort by Progress</SelectItem>
                <SelectItem value="urgency">Sort by Urgency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedProjects.length} paused project{filteredAndSortedProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pausedProjects.length}</div>
              <div className="text-sm text-muted-foreground">Total Paused</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {pausedProjects.filter(p => p.pauseAnalysis.canResume).length}
              </div>
              <div className="text-sm text-muted-foreground">Ready to Resume</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {pausedProjects.filter(p => p.pauseAnalysis.urgency === 'High').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pausedProjects.reduce((sum, p) => sum + p.timeInvested, 0)}h
              </div>
              <div className="text-sm text-muted-foreground">Time Invested</div>
            </CardContent>
          </Card>
        </div>

        {/* Paused Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl flex items-center space-x-2">
                      <Pause className="h-5 w-5 text-orange-500" />
                      <span>{project.title}</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getTypeColor(project.type)}>
                      {project.type.replace('-', ' ')}
                    </Badge>
                    <Badge className={getUrgencyColor(project.pauseAnalysis.urgency)}>
                      {project.pauseAnalysis.urgency} Urgency
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress at Pause</span>
                    <span className="text-sm font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Pause Information */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-orange-800">Pause Reason</p>
                      <p className="text-sm text-orange-700">{project.pauseReason}</p>
                      <p className="text-xs text-orange-600">
                        Paused on {new Date(project.pausedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resume Analysis */}
                <div className={`p-3 rounded-lg border ${
                  project.pauseAnalysis.canResume 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${
                        project.pauseAnalysis.canResume ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {project.pauseAnalysis.canResume ? 'Can Resume' : 'Currently Blocked'}
                      </p>
                      {project.pauseAnalysis.canResume && (
                        <span className="text-xs text-green-600">
                          ETA: {project.pauseAnalysis.estimatedResumeTime}
                        </span>
                      )}
                    </div>
                    {project.pauseAnalysis.blockers.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Blockers:</p>
                        {project.pauseAnalysis.blockers.map((blocker, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-current rounded-full" />
                            <span className="text-xs">{blocker}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {project.pauseAnalysis.resumptionPlan}
                    </p>
                  </div>
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
                      <span className="text-sm">{project.timeInvested}h invested</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Due: {new Date(project.originalDeadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Stage: {project.stage}</span>
                    </div>
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
                    Next: {project.nextMilestone}
                  </div>
                  <div className="flex space-x-2">
                    {project.pauseAnalysis.canResume ? (
                      <Button size="sm" className="flex items-center space-x-1">
                        <PlayCircle className="h-4 w-4" />
                        <span>Resume</span>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Resumption Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">High Priority Resume</h4>
                <p className="text-sm text-green-700">
                  Mental Health Resource Hub should be resumed immediately once IRB approval is received. 
                  High impact potential and significant progress already made.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Strategic Hold</h4>
                <p className="text-sm text-yellow-700">
                  Campus Tutoring Marketplace can wait until current active projects reach 80% completion. 
                  Good medium-term project for next semester.
                </p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Consider Pivoting or Archiving</h4>
                <p className="text-sm text-red-700">
                  Personal Carbon Footprint Dashboard faces market saturation. Consider pivoting to institutional 
                  focus or archiving to free up mental capacity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PausedProjects;