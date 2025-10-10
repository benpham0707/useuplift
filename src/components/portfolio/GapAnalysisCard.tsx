import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, CheckCircle2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GapAnalysisCardProps {
  dimensionLabel: string;
  dimensionIcon: LucideIcon;
  color: string;
  currentScore: number;
  targetScore: number;
  factors?: string[];
  quickWins?: string[];
  projectedImpact?: string;
  className?: string;
}

export const GapAnalysisCard: React.FC<GapAnalysisCardProps> = ({
  dimensionLabel,
  dimensionIcon: Icon,
  color,
  currentScore,
  targetScore,
  factors = [],
  quickWins = [],
  projectedImpact,
  className
}) => {
  const gap = Math.max(0, targetScore - currentScore);
  const gapPercent = (gap / targetScore) * 100;
  const currentPercent = (currentScore / targetScore) * 100;

  return (
    <Card className={cn(
      "bg-white border-2 transition-all duration-300 hover:shadow-lg",
      "border-l-4",
      className
    )}
    style={{ borderLeftColor: color }}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{dimensionLabel}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Opportunity for Growth</p>
            </div>
          </div>
        </div>

        {/* Gap Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="font-semibold" style={{ color }}>{currentScore.toFixed(1)}</span>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Progress to Target</span>
              <span className="text-xs font-medium text-amber-600">Gap: {gap.toFixed(1)} pts</span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ 
                  width: `${currentPercent}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}dd)`
                }}
              />
              <div 
                className="absolute inset-y-0 rounded-full transition-all duration-500 opacity-30"
                style={{ 
                  left: `${currentPercent}%`,
                  width: `${gapPercent}%`,
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(251, 146, 60, 0.3) 4px, rgba(251, 146, 60, 0.3) 8px)'
                }}
              />
            </div>
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-muted-foreground">Target: {targetScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Contributing Factors */}
        {factors.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Contributing Factors
            </div>
            <ul className="space-y-1">
              {factors.slice(0, 2).map((factor, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2 leading-snug">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              Quick Wins
            </div>
            <ul className="space-y-1.5">
              {quickWins.slice(0, 3).map((win, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2 leading-snug">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Projected Impact */}
        {projectedImpact && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-blue-700">Projected Impact: </span>
                <span className="text-muted-foreground">{projectedImpact}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
