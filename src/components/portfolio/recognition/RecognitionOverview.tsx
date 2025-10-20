import React from 'react';
import { Card } from '@/components/ui/card';
import { Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecognitionOverviewData {
  portfolioLiftScore: number;
  assessmentLabel: string;
  oneLineSummary: string;
  mixAnalysis: {
    nationalCount: number;
    stateCount: number;
    regionalCount: number;
    schoolCount: number;
    mostRecentDate: string;
    spineAlignmentPercent: number;
    recencyScore: 'excellent' | 'good' | 'dated';
  };
}

interface RecognitionOverviewProps {
  data: RecognitionOverviewData;
}


export const RecognitionOverview: React.FC<RecognitionOverviewProps> = ({ data }) => {
  const { portfolioLiftScore, assessmentLabel, oneLineSummary, mixAnalysis } = data;
  
  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
    if (score >= 7.5) return 'text-green-600 dark:text-green-400';
    if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
    return 'text-muted-foreground';
  };

  const scoreColor = getScoreColor(portfolioLiftScore);

  return (
    <Card className="border overflow-hidden">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Recognition Overview</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Portfolio Lift */}
          <div className="text-center space-y-3">
            <div className="py-8 px-6 rounded-xl border bg-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                PORTFOLIO LIFT
              </div>
              <div className={cn('text-5xl font-bold mb-2', scoreColor)}>
                {portfolioLiftScore.toFixed(1)}
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {assessmentLabel}
              </div>
            </div>
          </div>

          {/* Mix Analysis */}
          <div className="space-y-3">
            <div className="py-6 px-6 rounded-xl border bg-muted/30">
              <div className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                YOUR MIX
              </div>
              
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">National</span>
                  <span className="font-bold text-foreground">{mixAnalysis.nationalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">State</span>
                  <span className="font-bold text-foreground">{mixAnalysis.stateCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">School</span>
                  <span className="font-bold text-foreground">{mixAnalysis.schoolCount}</span>
                </div>
                <div className="pt-2 mt-2 border-t flex items-center justify-between">
                  <span className="text-muted-foreground">Spine-aligned</span>
                  <span className="font-bold text-foreground">{mixAnalysis.spineAlignmentPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
          {oneLineSummary}
        </p>
      </div>
    </Card>
  );
};
