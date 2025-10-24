import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtracurricularScoreDisplay } from './ExtracurricularScoreDisplay';

export interface ExtracurricularItem {
  id: string;
  name: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  category: 'leadership' | 'service' | 'athletics' | 'arts' | 'academic' | 'work' | 'research';
  description: string;
  link?: string;
  
  scores: {
    portfolioContribution: {
      overall: number;
      breakdown: {
        commitmentDepth: number;
        leadershipTrajectory: number;
        impactScale: number;
        narrativeAlignment: number;
      };
    };
    commitment: {
      overall: number;
      totalHours: number;
      consistencyScore: number;
      roleGrowth: string[];
    };
    impact: {
      overall: number;
      metrics: Array<{
        label: string;
        value: string;
      }>;
      tangibility: number;
      analysis: string;
    };
  };
  
  recommendedUse: 'centerpiece' | 'supporting' | 'breadth' | 'optional';
  
  applicationGuidance: {
    essayFit: Array<{
      promptType: string;
      suitability: number;
      angle: string;
    }>;
    descriptionStrength: {
      clarity: number;
      specificityScore: number;
      actionVerbStrength: string;
      issues: string[];
      improvements: string[];
    };
  };
  
  evolution: {
    milestones: Array<{
      date: string;
      event: string;
      significance: string;
    }>;
    skillsGained: string[];
  };
}

const categoryConfig = {
  leadership: { label: 'Leadership', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  service: { label: 'Service', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  research: { label: 'Research', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  athletics: { label: 'Athletics', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  arts: { label: 'Arts', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  academic: { label: 'Academic', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  work: { label: 'Work', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

const recommendedUseConfig = {
  centerpiece: { label: 'Centerpiece', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  supporting: { label: 'Supporting', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  breadth: { label: 'Breadth', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  optional: { label: 'Optional', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

interface ExtracurricularCardProps {
  activity: ExtracurricularItem;
}

export const ExtracurricularCard: React.FC<ExtracurricularCardProps> = ({ activity }) => {
  const [showMore, setShowMore] = React.useState(false);
  const categoryStyle = categoryConfig[activity.category];
  const useStyle = recommendedUseConfig[activity.recommendedUse];

  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-colors h-full">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground leading-tight">
                {activity.name}
              </h3>
              <div className="text-sm text-muted-foreground mt-1">
                {activity.organization}
              </div>
            </div>
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4 text-primary hover:text-primary/80" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{activity.startDate} - {activity.endDate}</span>
            <span>•</span>
            <span>{activity.hoursPerWeek} hrs/wk</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("text-xs font-medium border", categoryStyle.color)}>
              {categoryStyle.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-medium border", useStyle.color)}>
              {useStyle.label}
            </Badge>
          </div>
        </div>

        {/* Score Display */}
        <ExtracurricularScoreDisplay scores={activity.scores} />

        {/* At a Glance */}
        <div className="p-3 bg-primary/5 rounded-md space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            At a Glance
          </h4>
          <div className="space-y-1.5 text-sm">
            {activity.scores.commitment.roleGrowth.length > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  Role Growth: <span className="text-foreground font-medium">{activity.scores.commitment.roleGrowth.join(' → ')}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                Total Hours: <span className="text-foreground font-medium">{activity.scores.commitment.totalHours.toLocaleString()}+</span>
              </span>
            </div>
            {activity.scores.impact.metrics.length > 0 && (
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  Impact: <span className="text-foreground font-medium">{activity.scores.impact.metrics[0].value} {activity.scores.impact.metrics[0].label}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Spine Match: <span className="text-foreground font-semibold">{activity.scores.portfolioContribution.breakdown.narrativeAlignment * 10}% alignment</span>
              </span>
            </div>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="space-y-2">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Why This Matters
            </h4>
            <span className="text-xs text-primary">
              {showMore ? 'Show less ▲' : 'Read more ▼'}
            </span>
          </button>
          {showMore && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activity.scores.impact.analysis}
            </p>
          )}
        </div>

        {/* Description Analysis */}
        <div className="pt-3 border-t space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Description Analysis
          </h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Clarity: <span className="text-foreground font-medium">{activity.applicationGuidance.descriptionStrength.clarity}/10</span>
            </span>
            <span className="text-muted-foreground">
              Specificity: <span className="text-foreground font-medium">{activity.applicationGuidance.descriptionStrength.specificityScore}/10</span>
            </span>
          </div>
          {activity.applicationGuidance.descriptionStrength.improvements.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-500/10 px-2 py-1.5 rounded border border-amber-500/20">
              ⚠ Consider: {activity.applicationGuidance.descriptionStrength.improvements[0]}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
