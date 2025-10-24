import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, FileText, Lightbulb } from 'lucide-react';
import { ExtracurricularItem } from '../ExtracurricularCard';

interface ApplicationStrategyTabProps {
  data: any;
  activities: ExtracurricularItem[];
}

export const ApplicationStrategyTab: React.FC<ApplicationStrategyTabProps> = ({ data, activities }) => {
  if (!data) return <div className="text-muted-foreground">No application strategy data available</div>;

  return (
    <div className="space-y-6">
      {/* Centerpiece Activities */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600" />
            <h4 className="text-lg font-bold text-foreground">Centerpiece Activities</h4>
          </div>

          <p className="text-sm text-muted-foreground">
            These activities are strong enough to build entire essays around. Use them for personal statements and supplemental essays.
          </p>

          <div className="space-y-2">
            {data.centerpiece.map((activityName: string, i: number) => {
              const activity = activities.find(a => a.name === activityName);
              return (
                <div key={i} className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <div className="font-semibold text-foreground">{activityName}</div>
                  {activity && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {activity.scores.portfolioContribution.overall.toFixed(1)} • {activity.category}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Supporting Activities */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Supporting Activities</h4>
          </div>

          <p className="text-sm text-muted-foreground">
            Strong activities that complement your centerpiece experiences. Use these in your activities list with excellent descriptions.
          </p>

          <div className="space-y-2">
            {data.supporting.map((activityName: string, i: number) => {
              const activity = activities.find(a => a.name === activityName);
              return (
                <div key={i} className="p-3 bg-primary/5 rounded-md border border-primary/10">
                  <div className="font-medium text-foreground">{activityName}</div>
                  {activity && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {activity.scores.portfolioContribution.overall.toFixed(1)} • {activity.category}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Description Priority Ranking */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Description Priority Ranking</h4>
          </div>

          <div className="space-y-2">
            {data.descriptionPriority.map((item: any, i: number) => (
              <div key={i} className="p-3 bg-muted/30 rounded-md border">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground">{item.activity}</span>
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                    #{item.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.reasonToHighlight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Essay Opportunities */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-foreground">Essay Mapping</h4>
          </div>

          <div className="space-y-3">
            {data.essayOpportunities.map((opp: any, i: number) => (
              <div key={i} className="p-4 bg-primary/5 rounded-md border border-primary/10">
                <div className="font-semibold text-foreground mb-2">{opp.activity}</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Suitable Prompts
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opp.promptTypes.map((prompt: string, j: number) => (
                        <span key={j} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-700 rounded border border-purple-500/20">
                          {prompt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Unique Angle
                    </div>
                    <p className="text-sm text-muted-foreground">{opp.uniqueAngle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
