import React from 'react';
import { Card } from '@/components/ui/card';
import { Award, TrendingUp, Calendar, Target } from 'lucide-react';
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

const getScoreGradient = (score: number) => {
  if (score >= 9.0) return 'from-amber-500 to-yellow-400';
  if (score >= 7.5) return 'from-green-500 to-emerald-400';
  if (score >= 6.0) return 'from-blue-500 to-cyan-400';
  return 'from-orange-500 to-amber-400';
};

const getRecencyBadge = (recency: string) => {
  const badges = {
    excellent: { label: 'Recent Activity', color: 'text-green-600 dark:text-green-400 bg-green-500/10' },
    good: { label: 'Active', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    dated: { label: 'Needs Fresh Recognition', color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' }
  };
  return badges[recency as keyof typeof badges] || badges.good;
};

export const RecognitionOverview: React.FC<RecognitionOverviewProps> = ({ data }) => {
  const { portfolioLiftScore, assessmentLabel, oneLineSummary, mixAnalysis } = data;
  const scoreGradient = getScoreGradient(portfolioLiftScore);
  const recencyBadge = getRecencyBadge(mixAnalysis.recencyScore);

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Recognition Portfolio Overview</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Portfolio Lift */}
          <div className="space-y-4">
            <div className={cn(
              'relative p-6 rounded-xl bg-gradient-to-br',
              scoreGradient,
              'text-white shadow-lg'
            )}>
              <div className="text-sm font-medium opacity-90 mb-1">TOTAL PORTFOLIO LIFT</div>
              <div className="text-5xl font-extrabold mb-2">{portfolioLiftScore.toFixed(1)}<span className="text-2xl">/10</span></div>
              <div className="text-lg font-semibold">{assessmentLabel}</div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {oneLineSummary}
            </p>
          </div>

          {/* Mix Analysis */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-muted/50 border">
              <div className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                MIX ANALYSIS
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">National</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{mixAnalysis.nationalCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">State</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{mixAnalysis.stateCount}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Regional</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{mixAnalysis.regionalCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">School</span>
                    <span className="text-lg font-bold text-muted-foreground">{mixAnalysis.schoolCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Most Recent</span>
                </div>
                <div className="text-sm font-semibold text-foreground">{mixAnalysis.mostRecentDate}</div>
                <div className={cn('text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block', recencyBadge.color)}>
                  {recencyBadge.label}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Spine Alignment</span>
                </div>
                <div className="text-2xl font-bold text-primary">{mixAnalysis.spineAlignmentPercent}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
