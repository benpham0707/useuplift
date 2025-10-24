import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
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
    };
    impact: {
      overall: number;
    };
  };
}

const getScoreColor = (score: number) => {
  if (score >= 9) return 'text-purple-600';
  if (score >= 7.5) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-orange-600';
};

const getScoreBg = (score: number) => {
  if (score >= 9) return 'bg-purple-500/10';
  if (score >= 7.5) return 'bg-green-500/10';
  if (score >= 6) return 'bg-yellow-500/10';
  return 'bg-orange-500/10';
};

export const ExtracurricularScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const mainScore = scores.portfolioContribution.overall;
  const mainColor = getScoreColor(mainScore);
  const mainBg = getScoreBg(mainScore);

  return (
    <div className="space-y-3">
      {/* Main Score */}
      <div className={cn("p-3 rounded-md border", mainBg)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Portfolio Contribution
          </span>
          <span className={cn("text-2xl font-bold", mainColor)}>
            {mainScore.toFixed(1)}
          </span>
        </div>
        
        {/* Breakdown bars */}
        <div className="mt-3 space-y-2">
          <ScoreBar 
            label="Commitment Depth" 
            value={scores.portfolioContribution.breakdown.commitmentDepth} 
          />
          <ScoreBar 
            label="Leadership Trajectory" 
            value={scores.portfolioContribution.breakdown.leadershipTrajectory} 
          />
          <ScoreBar 
            label="Impact Scale" 
            value={scores.portfolioContribution.breakdown.impactScale} 
          />
          <ScoreBar 
            label="Narrative Fit" 
            value={scores.portfolioContribution.breakdown.narrativeAlignment} 
          />
        </div>
      </div>

      {/* Secondary Scores */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-primary/5 rounded border border-primary/10">
          <div className="text-xs text-muted-foreground">Commitment</div>
          <div className={cn("text-lg font-bold", getScoreColor(scores.commitment.overall))}>
            {scores.commitment.overall.toFixed(1)}
          </div>
        </div>
        <div className="p-2 bg-primary/5 rounded border border-primary/10">
          <div className="text-xs text-muted-foreground">Impact</div>
          <div className={cn("text-lg font-bold", getScoreColor(scores.impact.overall))}>
            {scores.impact.overall.toFixed(1)}
          </div>
        </div>
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
