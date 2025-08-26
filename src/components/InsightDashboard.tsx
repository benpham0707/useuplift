import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Link, Zap, ArrowRight, Scale } from 'lucide-react';

interface InsightItemProps {
  title: string;
  description: string;
  time: string;
  type: 'strength' | 'opportunity' | 'improvement' | 'warning' | 'concern';
  impact: 'high' | 'medium' | 'low';
  pendingGains: {
    overall: number;
    [key: string]: number;
  };
  relatedFeatures: string[];
  actionItems: Array<{
    action: string;
    link: string;
    buttonText: string;
  }>;
  connections: string;
}

const InsightItem = ({ title, description, time, type, impact, pendingGains, relatedFeatures, actionItems, connections }: InsightItemProps) => {
  const typeColors = {
    strength: 'text-green-600',
    opportunity: 'text-blue-600',
    improvement: 'text-purple-600',
    warning: 'text-orange-600',
    concern: 'text-red-600'
  };

  const getCheckmarkColor = (type: string, impact: string) => {
    // Handle special types first
    if (type === 'warning' && impact === 'medium') {
      return 'text-muted-foreground'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'text-red-500'; // Red for negative impact
    }
    
    // Use impact-based colors for regular items
    switch (impact) {
      case 'high':
        return 'text-blue-500';
      case 'medium':
        return 'text-green-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBorderClass = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'border-2 border-muted-foreground/30'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'border-2 border-red-500';
    }
    if (impact === 'high') {
      return 'border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)] hover:shadow-[0_0_35px_rgba(59,130,246,1)]';
    }
    if (impact === 'medium') {
      return 'border-2 border-green-500';
    }
    return 'border-2 border-yellow-500';
  };

  const getImpactBadgeColors = (type: string, impact: string) => {
    // Handle special types first
    if (type === 'warning' && impact === 'medium') {
      return 'bg-muted text-muted-foreground border-muted'; // Gray for missed opportunity
    }
    if (type === 'concern') {
      return 'bg-red-100 text-red-700 border-red-300'; // Red for negative impact
    }
    
    // Use impact-based colors for regular items
    switch (impact) {
      case 'high':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'medium':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getImpactText = (type: string, impact: string) => {
    if (type === 'warning' && impact === 'medium') {
      return 'missed opportunity';
    }
    if (type === 'concern') {
      return 'negative impact';
    }
    return `${impact} impact`;
  };

  return (
    <div className={`p-5 rounded-lg shadow-soft hover:shadow-medium transition-all duration-200 ${getBorderClass(type, impact)}`}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className={`h-6 w-6 mt-0.5 ${getCheckmarkColor(type, impact)} flex-shrink-0`} />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground text-lg">{title}</h4>
                <Badge className={`text-xs px-2 py-1 ${getImpactBadgeColors(type, impact)}`}>
                  {getImpactText(type, impact)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
            </div>
            <div className="text-right ml-4 min-w-[140px]">
              <div className="text-xs text-muted-foreground mb-2 flex items-center justify-end gap-1 font-medium">
                <Scale className="h-3 w-3" />
                Estimated Impact
              </div>
              <div className="space-y-1 opacity-50">
                {Object.entries(pendingGains).map(([key, value]) => (
                  <div key={key} className="text-xs font-medium text-muted-foreground">
                    {key === 'missedOpportunity' ? 'Missed: ' : value >= 0 ? '+' : ''}
                    {value.toFixed(2)} {key === 'missedOpportunity' ? 'potential' : key}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-md p-3 border border-primary/20">
            <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Feature Connections
            </h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {relatedFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">{connections}</p>
          </div>

          <div className="bg-secondary/10 rounded-md p-3 border border-secondary/30">
            <h5 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Recommended Actions
            </h5>
            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex-1">{item.action}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 ml-2 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => window.location.href = item.link}
                  >
                    {item.buttonText}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Record in Journal
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View Full Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightDashboard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Mock data - hardcoded values representing example insights
  const allInsights: InsightItemProps[] = [
    {
      title: "Outstanding Leadership Through Work Experience",
      description: "Your 8-month commitment as a restaurant server demonstrates exceptional responsibility and customer service skills. This consistent work ethic while maintaining academic performance shows colleges your ability to balance multiple commitments successfully.",
      time: "2 hours ago",
      type: "strength",
      impact: "high",
      pendingGains: {
        overall: 1.8,
        leadership: 2.1,
        character: 1.5,
        accomplishments: 1.2
      },
      relatedFeatures: ["Work Experience Tracker", "Character Development", "Time Management Skills"],
      actionItems: [
        { action: "Add specific achievements from your restaurant work", link: "#", buttonText: "Add Details" },
        { action: "Quantify your customer service impact", link: "#", buttonText: "Add Metrics" }
      ],
      connections: "This work experience connects strongly with your time management skills and demonstrates real-world application of your interpersonal abilities."
    },
    {
      title: "Family Caregiving Shows Mature Leadership",
      description: "Taking care of younger siblings while parents work demonstrates natural leadership, responsibility, and family commitment. This experience provides unique insights into mentoring and time management that many peers lack.",
      time: "4 hours ago",
      type: "opportunity",
      impact: "medium",
      pendingGains: {
        overall: 0.9,
        leadership: 1.8,
        character: 2.2,
        uniqueValue: 1.1
      },
      relatedFeatures: ["Family Responsibilities", "Leadership Portfolio", "Character Building"],
      actionItems: [
        { action: "Document specific mentoring skills developed", link: "#", buttonText: "Add Skills" },
        { action: "Highlight problem-solving examples", link: "#", buttonText: "Add Examples" }
      ],
      connections: "Your caregiving experience enhances your leadership narrative and provides concrete examples of responsibility that complement your work experience."
    },
    {
      title: "Academic Trajectory Shows Strong Growth Potential",
      description: "Your improvement from freshman year demonstrates resilience and learning ability. However, more detailed documentation of this progress could significantly strengthen your academic narrative.",
      time: "6 hours ago",
      type: "improvement",
      impact: "medium",
      pendingGains: {
        overall: 1.2,
        academic: 2.1,
        trends: 1.8,
        accomplishments: 0.9
      },
      relatedFeatures: ["Academic Tracking", "Grade Analysis", "Improvement Documentation"],
      actionItems: [
        { action: "Add detailed grade progression by subject", link: "#", buttonText: "Add Grades" },
        { action: "Document specific learning strategies that helped", link: "#", buttonText: "Add Strategies" }
      ],
      connections: "Your academic growth story connects with your maturity development through work and family responsibilities, showing a consistent pattern of personal development."
    },
    {
      title: "Limited Extracurricular Documentation",
      description: "While your work and family commitments are impressive, colleges also look for traditional extracurricular involvement. Consider documenting any clubs, sports, or volunteer activities you may have overlooked.",
      time: "1 day ago",
      type: "warning",
      impact: "medium",
      pendingGains: {
        missedOpportunity: 1.5,
        overall: 0.8,
        involvement: 2.2,
        community: 1.7
      },
      relatedFeatures: ["Activity Tracker", "Club Documentation", "Volunteer Hours"],
      actionItems: [
        { action: "Review and add any club participation", link: "#", buttonText: "Add Activities" },
        { action: "Document informal community involvement", link: "#", buttonText: "Add Community" }
      ],
      connections: "Balancing traditional activities with your existing responsibilities could create a more complete picture of your engagement and interests."
    },
    {
      title: "Course Rigor Analysis Shows Opportunities",
      description: "Your current course selection is solid, but adding more challenging courses or documenting the reasoning behind your choices could strengthen your academic profile significantly.",
      time: "2 days ago",
      type: "concern",
      impact: "high",
      pendingGains: {
        overall: -0.5,
        academic: -1.2,
        preparation: -0.8
      },
      relatedFeatures: ["Course Planning", "Academic Rigor", "Challenge Documentation"],
      actionItems: [
        { action: "Plan additional challenging courses for next year", link: "#", buttonText: "Plan Courses" },
        { action: "Document why current courses fit your goals", link: "#", buttonText: "Add Context" }
      ],
      connections: "Your course choices should align with your career interests and complement the maturity you've shown through work and family responsibilities."
    }
  ];

  const itemsPerPage = 2;
  const maxIndex = Math.max(0, allInsights.length - itemsPerPage);

  const nextInsights = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevInsights = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const currentInsights = allInsights.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={prevInsights}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, allInsights.length)} of {allInsights.length}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextInsights}
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {currentInsights.map((insight, index) => (
          <InsightItem key={currentIndex + index} {...insight} />
        ))}
      </div>
    </div>
  );
};

export default InsightDashboard;