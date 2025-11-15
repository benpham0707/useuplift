import React from 'react';
import { ProgressTrackingData } from './types/portfolioTypes';
import { CheckCircle2, Circle, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackingComponentProps {
  data: ProgressTrackingData;
  isExpanded: boolean;
}

export const ProgressTrackingComponent: React.FC<ProgressTrackingComponentProps> = ({
  data,
  isExpanded,
}) => {
  if (isExpanded) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">Milestone Tracking</h2>

        {/* Large Progress Visualization */}
        <div className="depth-layer-3 rounded-2xl p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Current Tier
              </p>
              <p className="text-2xl font-bold">{data.currentTier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Next Tier
              </p>
              <p className="text-2xl font-bold text-primary">{data.nextTier}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">{data.progress}% Complete</span>
            <span className="text-muted-foreground">
              +{data.pointsNeeded} points needed
            </span>
          </div>
        </div>

        {/* Milestone Checklist */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">
            Your Milestones
          </h3>

          {data.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={cn(
                'depth-layer-3 rounded-xl p-6 border-2 transition-all',
                milestone.status === 'completed' &&
                  'bg-green-50 dark:bg-green-950/20 border-green-300',
                milestone.status === 'in-progress' &&
                  'bg-amber-50 dark:bg-amber-950/20 border-amber-300',
                milestone.status === 'future' && 'bg-muted/30 border-border'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  {milestone.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : milestone.status === 'in-progress' ? (
                    <Clock className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-bold">{milestone.title}</h4>
                    <span className="text-lg font-mono font-bold text-primary">
                      +{milestone.points}
                    </span>
                  </div>

                  {milestone.deadline && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Due: {milestone.deadline}
                    </p>
                  )}

                  <p className="text-sm text-foreground/80 mb-4">{milestone.action}</p>

                  {milestone.resources.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Resources
                      </h5>
                      <ul className="space-y-1">
                        {milestone.resources.map((resource, idx) => (
                          <li key={idx} className="text-sm text-primary flex items-start">
                            <span className="mr-2">•</span>
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed view
  const completedCount = data.milestones.filter((m) => m.status === 'completed').length;
  const totalCount = data.milestones.length;

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Progress to {data.nextTier}
          </h3>
          <span className="text-sm font-bold text-primary">{data.progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${data.progress}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Points Needed</p>
            <p className="text-lg font-mono font-bold">+{data.pointsNeeded}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Milestones</p>
            <p className="text-lg font-mono font-bold">
              {completedCount}/{totalCount}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {data.milestones.slice(0, 3).map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-2 text-sm">
              {milestone.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : milestone.status === 'in-progress' ? (
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-xs truncate">{milestone.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
        <span>View milestones</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};
