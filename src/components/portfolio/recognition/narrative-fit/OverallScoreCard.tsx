import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface OverallScoreCardProps {
  overallScore: number;
  fixedCount: number;
  totalCount: number;
}

export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({
  overallScore,
  fixedCount,
  totalCount
}) => {
  const progressPercent = totalCount > 0 ? (fixedCount / totalCount) * 100 : 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-blue-600 dark:text-blue-400';
    if (score >= 6) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-blue-50 dark:bg-blue-950/20';
    if (score >= 6) return 'bg-green-50 dark:bg-green-950/20';
    if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return 'bg-red-50 dark:bg-red-950/20';
  };

  return (
    <Card className={`${getScoreBg(overallScore)} border-2 shadow-lg`}>
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Overall Narrative Quality
            </h3>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-3xl font-semibold text-muted-foreground">/10</span>
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-full">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-bold text-primary">
              {fixedCount} of {totalCount} issues fixed
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>
        
        {overallScore >= 8.0 && fixedCount === totalCount ? (
          <p className="text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/30 p-3 rounded-lg">
            🎉 Excellent work! Your narrative is ready for admissions officers.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {totalCount - fixedCount > 0 ? (
              <>Address {totalCount - fixedCount} more issue{totalCount - fixedCount !== 1 ? 's' : ''} to improve your score</>
            ) : (
              <>All issues addressed! Keep refining for an even stronger narrative.</>
            )}
          </p>
        )}
      </div>
    </Card>
  );
};
