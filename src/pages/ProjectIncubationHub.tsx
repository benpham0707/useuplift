import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Pause,
  BarChart3,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';

const ProjectIncubationHub = () => {
  const navigate = useNavigate();

  // Hard coded data values for navigation cards overview
  const overviewStats = {
    activeProjects: 3,
    pausedProjects: 2,
    discoveryIdeas: 6,
    totalProgress: 65
  };

  const navigationCards = [
    {
      id: 'foundation',
      title: 'Foundation',
      description: 'View metrics, analytics, and project performance dashboard',
      icon: BarChart3,
      color: 'blue',
      stats: [
        { label: 'Portfolio Strength', value: '78%' },
        { label: 'Impact Score', value: '8.2' }
      ],
      route: '/project-incubation/foundation'
    },
    {
      id: 'active',
      title: 'Active Projects',
      description: 'Manage your current projects and track progress',
      icon: Target,
      color: 'green',
      stats: [
        { label: 'Active Projects', value: overviewStats.activeProjects },
        { label: 'Avg Progress', value: `${overviewStats.totalProgress}%` }
      ],
      route: '/project-incubation/active'
    },
    {
      id: 'discovery',
      title: 'Project Discovery',
      description: 'Explore new project ideas and start planning',
      icon: Lightbulb,
      color: 'purple',
      stats: [
        { label: 'Ideas Available', value: overviewStats.discoveryIdeas },
        { label: 'Uniqueness', value: 'High' }
      ],
      route: '/project-incubation/discovery'
    },
    {
      id: 'paused',
      title: 'Paused Projects',
      description: 'Review suspended projects and plan resumption',
      icon: Pause,
      color: 'orange',
      stats: [
        { label: 'Paused Projects', value: overviewStats.pausedProjects },
        { label: 'Ready to Resume', value: '1' }
      ],
      route: '/project-incubation/paused'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200';
      case 'green':
        return 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200';
      case 'purple':
        return 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200';
      case 'orange':
        return 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Project Incubation System</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Transform your ideas into meaningful projects that stand out. Navigate through different sections 
            to manage your project pipeline, discover new opportunities, and track your progress.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-semibold">{overviewStats.activeProjects}</p>
                </div>
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discovery Ideas</p>
                  <p className="text-2xl font-semibold">{overviewStats.discoveryIdeas}</p>
                </div>
                <Lightbulb className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-semibold">{overviewStats.totalProgress}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impact Rating</p>
                  <p className="text-2xl font-semibold">8.2</p>
                </div>
                <Award className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${getColorClasses(card.color)}`}
                onClick={() => navigate(card.route)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(card.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-base mt-2">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {card.stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="font-semibold text-lg">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Photography Portfolio Site - Progress updated to 90%</span>
                </div>
                <span className="text-sm text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Study Group Matcher Algorithm - MVP testing milestone reached</span>
                </div>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>New project idea added - AI-Powered Study Planner</span>
                </div>
                <span className="text-sm text-muted-foreground">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectIncubationHub;