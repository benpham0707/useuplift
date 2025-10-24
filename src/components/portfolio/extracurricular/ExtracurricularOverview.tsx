import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Trophy, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';
import { CommitmentDepthTab } from './tabs/CommitmentDepthTab';
import { ImpactEvolutionTab } from './tabs/ImpactEvolutionTab';
import { BalanceAnalysisTab } from './tabs/BalanceAnalysisTab';
import { ApplicationStrategyTab } from './tabs/ApplicationStrategyTab';
import type { ExtracurricularItem } from './ExtracurricularCard';

export interface ExtracurricularOverviewData {
  portfolioWeightScore: number;
  assessmentLabel: string;
  oneLineSummary: string;
  balanceAnalysis: {
    totalActivities: number;
    categoryBreakdown: Record<string, number>;
    averageCommitmentYears: number;
    totalCommitmentHours: number;
    balanceScore: 'exceptional' | 'balanced' | 'lopsided' | 'sparse';
    spineAlignmentPercent: number;
  };
  commitmentDepth?: any;
  impactEvolution?: any;
  balanceGapsAnalysis?: any;
  applicationStrategy?: any;
}

interface ExtracurricularOverviewProps {
  data: ExtracurricularOverviewData;
  activities?: ExtracurricularItem[];
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const ExtracurricularOverview: React.FC<ExtracurricularOverviewProps> = ({ data, activities = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const gaugePercent = Math.max(0, Math.min(100, (data.portfolioWeightScore / 10) * 100));
  
  const scoreStyle = (() => {
    const score = data.portfolioWeightScore;
    if (score >= 8.5) {
      return {
        mode: 'metal' as const,
        arcColor: 'hsl(var(--primary))',
        numberColors: ['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']
      };
    }
    if (score >= 7.0) {
      return { mode: 'ok' as const, arcColor: 'hsl(var(--success))', numberClass: 'text-green-600 dark:text-green-400' };
    }
    if (score >= 5.5) {
      return { mode: 'warn' as const, arcColor: 'hsl(var(--warning))', numberClass: 'text-amber-600 dark:text-amber-400' };
    }
    return { mode: 'bad' as const, arcColor: 'hsl(var(--destructive))', numberClass: 'text-red-600 dark:text-red-400' };
  })();

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        {!expanded && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Extracurricular Portfolio Analysis
              </h2>
              <Button variant="outline" size="sm" onClick={() => setExpanded(true)} className="text-[11px] md:text-xs h-7 px-2.5 md:h-8 md:px-3 ml-1 md:ml-2">
                View Full Analysis <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-muted/20 to-background p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
                <div className="text-center">
                  <div className="relative w-40 h-40 mx-auto mb-3">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={scoreStyle.arcColor} strokeWidth="8" strokeDasharray={`${(gaugePercent / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
                    </svg>
                    <div className="absolute inset-3 rounded-full bg-background border" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {scoreStyle.mode === 'metal' ? (
                        <GradientText className="text-5xl font-extrabold" colors={scoreStyle.numberColors} textOnly>
                          {data.portfolioWeightScore.toFixed(1)}
                        </GradientText>
                      ) : (
                        <div className={cn('text-5xl font-bold', scoreStyle.numberClass)}>
                          {data.portfolioWeightScore.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Portfolio Weight</div>
                  <div className={cn('text-sm font-semibold', scoreStyle.mode === 'metal' ? '' : scoreStyle.numberClass)}>
                    {scoreStyle.mode === 'metal' ? (
                      <GradientText colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)']} textOnly>
                        {data.assessmentLabel}
                      </GradientText>
                    ) : data.assessmentLabel}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <StatCard icon={<Trophy className="h-5 w-5 text-primary" />} label="Total Activities" value={<span className="text-2xl md:text-3xl font-extrabold">{data.balanceAnalysis.totalActivities}</span>} />
                    <StatCard icon={<Clock className="h-5 w-5 text-primary" />} label="Commitment Depth" value={<span className="font-bold">{data.balanceAnalysis.averageCommitmentYears.toFixed(1)} years avg</span>} />
                  </div>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground mt-4">{data.oneLineSummary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {expanded && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Extracurricular Portfolio Analysis
              </h2>
              <Button variant="outline" size="sm" onClick={() => setExpanded(false)} className="text-[11px] md:text-xs h-7 px-2.5 md:h-8 md:px-3 ml-1 md:ml-2">
                Collapse <ChevronUp className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Portfolio Weight</div>
                <div className="mb-1">
                  {data.portfolioWeightScore >= 9.0 ? (
                    <GradientText className="text-4xl font-extrabold metric-value" colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']} textOnly>
                      {data.portfolioWeightScore.toFixed(1)}/10
                    </GradientText>
                  ) : (
                    <div className={`text-4xl font-bold ${getScoreColor(data.portfolioWeightScore)}`}>{data.portfolioWeightScore.toFixed(1)}/10</div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{data.assessmentLabel}</div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Activity Mix</div>
                <div className="text-3xl font-bold mb-1">{data.balanceAnalysis.totalActivities}</div>
                <div className="text-sm text-muted-foreground">Across {Object.keys(data.balanceAnalysis.categoryBreakdown).length} categories</div>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Narrative Alignment</div>
                <div className="text-4xl font-bold mb-1">{data.balanceAnalysis.spineAlignmentPercent}%</div>
                <div className="text-sm text-muted-foreground">Spine match</div>
              </Card>
            </div>

            <Tabs defaultValue="commitment" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="commitment">Commitment Depth</TabsTrigger>
                <TabsTrigger value="impact">Impact Evolution</TabsTrigger>
                <TabsTrigger value="balance">Balance Analysis</TabsTrigger>
                <TabsTrigger value="strategy">Application Strategy</TabsTrigger>
              </TabsList>
              <TabsContent value="commitment" className="mt-6">{data.commitmentDepth && <CommitmentDepthTab data={data.commitmentDepth} activities={activities} />}</TabsContent>
              <TabsContent value="impact" className="mt-6">{data.impactEvolution && <ImpactEvolutionTab data={data.impactEvolution} activities={activities} />}</TabsContent>
              <TabsContent value="balance" className="mt-6">{data.balanceGapsAnalysis && <BalanceAnalysisTab data={data.balanceGapsAnalysis} balanceAnalysis={data.balanceGapsAnalysis} />}</TabsContent>
              <TabsContent value="strategy" className="mt-6">{data.applicationStrategy && <ApplicationStrategyTab data={data.applicationStrategy} activities={activities} />}</TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: React.ReactNode; value: React.ReactNode; }> = ({ icon, label, value }) => (
  <div className="group relative overflow-hidden rounded-2xl border bg-background">
    <div className="flex items-center gap-4 p-4 md:p-5">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
        <div className="text-base md:text-xl tracking-tight truncate">{value}</div>
      </div>
    </div>
  </div>
);
