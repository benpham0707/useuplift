import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Lightbulb, 
  BarChart3,
  Clock,
  ArrowRight
} from 'lucide-react';

const ProjectIncubationHub = () => {
  const navigate = useNavigate();

  // Hard coded data values - Project metrics and key performance indicators
  const navigationCards = [
    {
      id: 'portfolio',
      title: 'Project Portfolio',
      description: 'View analytics & performance',
      icon: BarChart3,
      metric: { label: 'Portfolio Strength', value: '78%' },
      route: '/project-incubation/foundation'
    },
    {
      id: 'projects',
      title: 'Project Management',
      description: 'Manage active & paused work',
      icon: Target,
      metric: { label: 'Active Projects', value: '5' },
      route: '/project-incubation/projects'
    },
    {
      id: 'discovery',
      title: 'Project Discovery',
      description: 'Explore new opportunities',
      icon: Lightbulb,
      metric: { label: 'Ideas Ready', value: '6' },
      route: '/project-incubation/discovery'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Compact Header */}
        <header className="text-center mb-16">
          <h1 className="text-3xl font-bold text-foreground mb-3">Project Incubation System</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into meaningful projects that stand out
          </p>
        </header>

        {/* Navigation Cards - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.id} 
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-2 border group"
                onClick={() => navigate(card.route)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    
                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                    
                    {/* Metric */}
                    <div className="pt-2 border-t border-border/50 w-full">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {card.metric.label}
                      </p>
                      <p className="text-xl font-bold text-primary mt-1">
                        {card.metric.value}
                      </p>
                    </div>
                    
                    {/* Action indicator */}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity - Below the fold */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Hard coded data values - Recent project activity timeline */}
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Photography Portfolio Site - Progress updated to 90%</span>
                </div>
                <span className="text-xs text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Study Group Matcher Algorithm - MVP testing milestone reached</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">New project idea added - AI-Powered Study Planner</span>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectIncubationHub;