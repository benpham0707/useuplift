import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';

interface ScoreDisplayProps {
  scores: {
    portfolioContribution: {
      overall: number;
      breakdown: {
        commitmentDepth?: number;
        leadershipTrajectory?: number;
        impactScale?: number;
        narrativeAlignment: number;
      };
    };
    commitment: {
      overall?: number;
      totalHours: number;
      consistencyScore?: number;
      roleGrowth?: string[];
      hoursPerWeek: number;
      weeksPerYear: number;
    };
    impact: {
      overall: number;
      tangibility?: number;
      scope?: number;
      sustainability?: number;
      metrics?: Array<{ label: string; value: string; }>;
      analysis?: string;
    };
  };
}

const getScoreColor = (score: number): string => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 9.0) return 'Exceptional';
  if (score >= 7.5) return 'Strong';
  if (score >= 6.0) return 'Developing';
  return 'Supporting';
};

export const ExtracurricularScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const renderScore = (value: number, sizeClass: string = 'text-2xl') => {
    if (value >= 9.0) {
      return (
        <GradientText
          className={cn(sizeClass, 'font-extrabold metric-value')}
          colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']}
          textOnly
        >
          {value.toFixed(1)}
        </GradientText>
      );
    }
    return (
      <div className={cn(sizeClass, 'font-bold', getScoreColor(value))}>{value.toFixed(1)}</div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Portfolio Contribution - Primary Score */}
      <div className="text-center pb-3 border-b">
        <div className="text-sm text-muted-foreground mb-1">Portfolio Contribution</div>
        {renderScore(scores.portfolioContribution.overall, 'text-4xl')}
        <div className="text-xs text-muted-foreground mt-1">
          {getScoreLabel(scores.portfolioContribution.overall)}
        </div>
      </div>

      {/* Dual-Score Display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Commitment */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Commitment</span>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                {renderScore(scores.commitment.totalHours / 100, 'text-2xl')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-sm mb-2">Total time investment</p>
              <div className="text-xs space-y-1">
                <div>{scores.commitment.hoursPerWeek}h/week</div>
                <div>{scores.commitment.weeksPerYear} weeks/year</div>
                <div>{scores.commitment.totalHours} total hours</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Impact */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-muted-foreground">Impact</span>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                {renderScore(scores.impact.overall, 'text-2xl')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm mb-2">Impact quality metrics</p>
                <div className="text-xs space-y-1">
                  {scores.impact.tangibility !== undefined && (
                    <div>Tangibility: {scores.impact.tangibility.toFixed(1)}/10</div>
                  )}
                  {scores.impact.scope !== undefined && (
                    <div>Scope: {scores.impact.scope.toFixed(1)}/10</div>
                  )}
                  {scores.impact.sustainability !== undefined && (
                    <div>Sustainability: {scores.impact.sustainability.toFixed(1)}/10</div>
                  )}
                  {scores.impact.metrics && scores.impact.metrics.length > 0 && (
                    <div className="pt-1 border-t border-border mt-1">
                      {scores.impact.metrics.slice(0, 2).map((metric, idx) => (
                        <div key={idx}>{metric.label}: {metric.value}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const percentage = (value / 10) * 100;
  const color = getScoreColor(value);
  
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", color)}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", 
            value >= 9 ? 'bg-purple-500' :
            value >= 7.5 ? 'bg-green-500' :
            value >= 6 ? 'bg-yellow-500' : 'bg-orange-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
