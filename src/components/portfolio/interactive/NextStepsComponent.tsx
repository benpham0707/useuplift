import React, { useState } from 'react';
import { NextStepsData } from './types/portfolioTypes';
import { CheckCircle2, Circle, ArrowUpRight, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepsComponentProps {
  data: NextStepsData;
  isExpanded: boolean;
}

export const NextStepsComponent: React.FC<NextStepsComponentProps> = ({ data, isExpanded }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (actionId: string, stepIndex: number) => {
    const key = `${actionId}-${stepIndex}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isExpanded) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase tracking-wide">Your Action Plan</h2>

        <div className="space-y-6">
          {data.actions.map((action) => (
            <div
              key={action.id}
              className="depth-layer-3 rounded-2xl p-6 bg-gradient-to-br from-background to-muted/30 border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {action.category}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold',
                      action.effort === 'low' && 'bg-green-100 text-green-700',
                      action.effort === 'medium' && 'bg-amber-100 text-amber-700',
                      action.effort === 'high' && 'bg-red-100 text-red-700'
                    )}
                  >
                    {action.effort} effort
                  </span>
                  <span className="text-lg font-mono font-bold text-primary">
                    {action.quickImpact}
                  </span>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-2">Why It Matters</h4>
                <p className="text-sm text-foreground/80">{action.whyItMatters}</p>
              </div>

              {/* Specific Steps with Checkboxes */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Specific Steps
                </h4>
                <div className="space-y-2">
                  {action.specificSteps.map((step, idx) => {
                    const key = `${action.id}-${idx}`;
                    const isComplete = completedSteps[key] || step.completed;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleStep(action.id, idx)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors text-left"
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            'text-sm flex-1',
                            isComplete && 'line-through text-muted-foreground'
                          )}
                        >
                          {step.step}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timeline and Impact */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Timeline
                    </h4>
                  </div>
                  <p className="text-sm font-bold">{action.timeline}</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Expected Impact
                    </h4>
                  </div>
                  <p className="text-sm font-bold">
                    +{action.expectedImpact.points.min} to +{action.expectedImpact.points.max} pts
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.expectedImpact.description}
                  </p>
                </div>
              </div>

              {/* Difficulty */}
              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Difficulty
                </h4>
                <p className="text-sm">
                  <span className="font-semibold">{action.difficulty.level}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="text-muted-foreground">{action.difficulty.timeCommitment}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed view
  const topActions = data.actions.slice(0, 3);

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
          Your Action Plan
        </h3>

        <div className="space-y-3">
          {topActions.map((action) => (
            <div
              key={action.id}
              className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold flex-1">{action.title}</h4>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2',
                    action.effort === 'low' && 'bg-green-100 text-green-700',
                    action.effort === 'medium' && 'bg-amber-100 text-amber-700',
                    action.effort === 'high' && 'bg-red-100 text-red-700'
                  )}
                >
                  {action.effort}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{action.category}</p>
              <span className="text-sm font-mono font-bold text-primary">{action.quickImpact}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
        <span>Expand for detailed roadmap</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};
