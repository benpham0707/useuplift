/**
 * Delta Visualization Component
 *
 * Shows measurable improvement between drafts:
 * - Overall NQI score change
 * - Individual dimension improvements
 * - Celebration messages
 * - Issues resolved vs remaining
 *
 * Design Philosophy:
 * - Celebrate progress to motivate
 * - Show specific what improved
 * - Clear visual indicators (color, icons)
 * - Encourage continued iteration
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  PartyPopper,
  Zap,
} from 'lucide-react';

import { WorkshopDelta } from '@/services/workshop/workshopAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface DeltaVisualizationProps {
  delta: WorkshopDelta;
  onContinue?: () => void;
  onFinalize?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DeltaVisualization: React.FC<DeltaVisualizationProps> = ({
  delta,
  onContinue,
  onFinalize,
}) => {
  const { before, after, overallDelta, dimensionDeltas, issuesResolved, celebrationMessage } = delta;

  // Determine celebration level
  const getCelebrationConfig = () => {
    if (overallDelta >= 20) {
      return {
        level: 'amazing',
        icon: PartyPopper,
        color: 'text-purple-600',
        bg: 'bg-gradient-to-r from-purple-50 to-pink-50',
        border: 'border-purple-300',
        emoji: '🚀',
      };
    }
    if (overallDelta >= 10) {
      return {
        level: 'great',
        icon: Sparkles,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-300',
        emoji: '🎉',
      };
    }
    if (overallDelta >= 5) {
      return {
        level: 'good',
        icon: TrendingUp,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        emoji: '✨',
      };
    }
    if (overallDelta > 0) {
      return {
        level: 'modest',
        icon: TrendingUp,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        emoji: '👍',
      };
    }
    if (overallDelta === 0) {
      return {
        level: 'none',
        icon: Minus,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        emoji: '⏸️',
      };
    }
    return {
      level: 'decreased',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-300',
      emoji: '⚠️',
    };
  };

  const celebrationConfig = getCelebrationConfig();
  const CelebrationIcon = celebrationConfig.icon;

  // Sort dimensions by delta (biggest improvements first)
  const sortedDimensions = [...dimensionDeltas].sort((a, b) => b.delta - a.delta);

  // Get top improvements (delta > 0)
  const improvements = sortedDimensions.filter((d) => d.improved);
  const declines = sortedDimensions.filter((d) => !d.improved && d.delta < 0);

  return (
    <div className="space-y-4">
      {/* CELEBRATION HEADER */}
      <Card className={`border-2 ${celebrationConfig.border} ${celebrationConfig.bg}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CelebrationIcon className={`w-12 h-12 ${celebrationConfig.color}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`text-2xl font-bold ${celebrationConfig.color}`}>
                  {celebrationConfig.emoji} {celebrationMessage}
                </h3>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Before:</span>
                  <span className="font-bold text-foreground ml-2">{before.overallScore}</span>
                </div>
                <div className="text-2xl font-bold text-primary">→</div>
                <div>
                  <span className="text-muted-foreground">After:</span>
                  <span className="font-bold text-foreground ml-2">{after.overallScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  {overallDelta > 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-600">+{overallDelta}</span>
                    </>
                  ) : overallDelta < 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-600">{overallDelta}</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-5 h-5 text-gray-600" />
                      <span className="font-bold text-gray-600">±0</span>
                    </>
                  )}
                </div>
              </div>

              {/* Issues Progress */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-foreground">
                    <span className="font-bold">{issuesResolved.length}</span> issues resolved
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-foreground">
                    <span className="font-bold">{delta.issuesRemaining.length}</span> remaining
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* DIMENSION BREAKDOWN */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5" />
              What Improved
            </h4>
            <Badge variant="outline">
              {improvements.length} dimensions up
            </Badge>
          </div>

          {/* IMPROVEMENTS */}
          {improvements.length > 0 ? (
            <div className="space-y-2">
              {improvements.map((dim) => (
                <div
                  key={dim.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {dim.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {dim.before} → {dim.after}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          +{dim.delta}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all"
                        style={{ width: `${(dim.after / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No improvements yet. Keep working on the suggested fixes!
            </p>
          )}

          {/* DECLINES (if any) */}
          {declines.length > 0 && (
            <div className="pt-4 border-t">
              <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Dimensions that decreased:
              </h5>
              <div className="space-y-2">
                {declines.map((dim) => (
                  <div
                    key={dim.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {dim.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {dim.before} → {dim.after}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {dim.delta}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You may have removed important details. Review these dimensions.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* NEXT STEPS */}
      <Card>
        <div className="p-6 space-y-4">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            What's Next?
          </h4>

          {after.overallScore >= 80 ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">
                  🎉 Excellent work! Your narrative is strong.
                </p>
                <p className="text-sm text-green-800">
                  You've reached the "Strong Distinct Voice" tier (80+). You can finalize now or keep polishing.
                </p>
              </div>

              <div className="flex gap-3">
                {onContinue && (
                  <Button variant="outline" onClick={onContinue} className="flex-1">
                    Keep Polishing
                  </Button>
                )}
                {onFinalize && (
                  <Button onClick={onFinalize} className="flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalize & Export
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  You're making progress! Keep going.
                </p>
                <p className="text-sm text-blue-800">
                  Focus on the remaining {delta.issuesRemaining.length} issues to reach 80+.
                </p>
              </div>

              {onContinue && (
                <Button onClick={onContinue} className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Continue Improving
                </Button>
              )}
            </div>
          )}

          {/* TARGET GUIDANCE */}
          {after.overallScore < 80 && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold">Target:</span> Reach 80+ for "Strong Distinct Voice" tier
              </p>
              <p className="mt-1">
                <span className="font-semibold">Progress:</span> {after.overallScore}/80 (
                {80 - after.overallScore} points to go)
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
