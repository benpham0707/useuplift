import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Trophy, CalendarClock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import GradientText from '@/components/ui/GradientText';
import { CompetitivePositioningTab } from './CompetitivePositioningTab';
import { QualityIndicatorsTab } from './QualityIndicatorsTab';
import { GapAnalysisGrowthTab } from './GapAnalysisGrowthTab';
import { StrategicUsageTab } from './StrategicUsageTab';
 
import type { RecognitionItem } from './RecognitionCard';
// Removed difficulty carousel

// Data structure interfaces
interface CompetitivePositioning {
  selectivityBenchmark: {
    theirAverage: number;
    ivyAdmitsAverage: number;
    top20Average: number;
    top50Average: number;
    percentile: number;
    interpretation: string;
  };
  tierDistribution: {
    current: { national: number; state: number; school: number };
    ivyTypical: { national: number; state: number; school: number };
    top20Typical: { national: number; state: number; school: number };
    analysis: string;
    impactProjection: {
      withOneMoreNational: { percentile: number };
      withOneMoreState: { percentile: number };
    };
  };
  competitiveDensity: {
    stemCount: number;
    communityCount: number;
    leadershipCount: number;
    artsCount: number;
    diversificationScore: number;
    analysis: string;
  };
}

interface QualityIndicators {
  issuerPrestige: Array<{
    recognition: string;
    issuerType: 'foundation' | 'state_agency' | 'governor' | 'institution' | 'federal';
    prestigeScore: number;
    contextTooltip: string;
  }>;
  averageIssuerPrestige: number;
  recencyDistribution: {
    last6Months: number;
    months6to12: number;
    months12to24: number;
    older: number;
    recencyScore: number;
    analysis: string;
  };
  verification: {
    verifiedCount: number;
    selfReportedCount: number;
    verificationRate: number;
    recommendation: string;
  };
}

interface GapAnalysisGrowth {
  criticalGaps: Array<{
    issue: string;
    impact: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  minorGaps: string[];
  diminishingReturns: Array<{
    category: string;
    currentCount: number;
    recommendation: string;
  }>;
  growthTrajectory: {
    timelineData: Array<{ quarter: string; count: number }>;
    trend: 'accelerating' | 'steady' | 'declining';
    analysis: string;
  };
  seniorYearStrategy?: {
    timeRemaining: string;
    realisticTargets: string[];
    strategicTiming: string[];
    actionsTabCTA: string;
  };
}

interface StrategicUsage {
  credibilityReferences: Array<{
    recognition: string;
    whenToReference: string;
    exampleFraming: string;
  }>;
  expandOnInAdditionalInfo: Array<{
    recognition: string;
    whatToInclude: string[];
  }>;
  positioning: {
    flagship: string[];
    bridge: string[];
    support: string[];
  };
}

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
    recencyScore: 'excellent' | 'good' | 'needs-improvement';
  };
  difficulty?: {
    overallScore: number; // 0-10 scale
    highestLabel: string; // e.g., "Top 10 of 1,200"
    context?: string; // e.g., competition name
    percentile?: number; // e.g., selectivity percentile
  };
  competitivePositioning?: CompetitivePositioning;
  qualityIndicators?: QualityIndicators;
  gapAnalysisGrowth?: GapAnalysisGrowth;
  strategicUsage?: StrategicUsage;
}

interface RecognitionOverviewProps {
  data: RecognitionOverviewData;
  recognitions?: RecognitionItem[]; // optional: used to derive segmented ring contributions
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const RecognitionOverview: React.FC<RecognitionOverviewProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const gaugePercent = Math.max(0, Math.min(100, (data.portfolioLiftScore / 10) * 100));
  // Visual system for score: high scores get metallic gradient + glow; lower scores use warning/destructive without glow
  const scoreStyle = (() => {
    const score = data.portfolioLiftScore;
    if (score >= 8.5) {
      return {
        mode: 'metal' as const,
        arcColor: 'hsl(var(--primary))',
        glow: true,
        numberColors: ['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']
      };
    }
    if (score >= 7.0) {
      return { mode: 'ok' as const, arcColor: 'hsl(var(--success))', glow: false, numberClass: 'text-green-600 dark:text-green-400' };
    }
    if (score >= 5.5) {
      return { mode: 'warn' as const, arcColor: 'hsl(var(--warning))', glow: false, numberClass: 'text-amber-600 dark:text-amber-400' };
    }
    return { mode: 'bad' as const, arcColor: 'hsl(var(--destructive))', glow: false, numberClass: 'text-red-600 dark:text-red-400' };
  })();

  // Segmented ring removed for clarity; single solid arc shown instead

  // recency visual elements were removed; simplified header-only layout

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        {/* Collapsed View - Premium at-a-glance card */}
        {!expanded && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Recognition Portfolio Analysis
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(true)}
                className="text-[11px] md:text-xs h-7 px-2.5 md:h-8 md:px-3 ml-1 md:ml-2"
              >
                View Full Analysis <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-muted/20 to-background p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
                {/* Gauge */}
                <div className="text-center">
                  <div className="relative w-40 h-40 mx-auto mb-3">
                    {/* Background ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label="Portfolio lift segmented ring">
                      {/* Base track (white) so inter-segment gaps appear white */}
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--background))" strokeWidth="8" />

                      {/* Unfilled remainder arc (muted) layered above base, outside the filled region */}
                      {(() => {
                        const radius = 42;
                        const circumference = 2 * Math.PI * radius;
                        const totalFilled = (gaugePercent / 100) * circumference;
                        const remainder = Math.max(0, circumference - totalFilled);
                        return (
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            strokeDasharray={`${remainder} ${circumference}`}
                            strokeDashoffset={totalFilled}
                          />
                        );
                      })()}

                      {/* Solid arc (segmented rendering removed) */}
                      <g>
                        <circle cx="50" cy="50" r="42" fill="none" stroke={scoreStyle.arcColor} strokeWidth="8" strokeDasharray={`${(gaugePercent / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
                      </g>
                    </svg>

                    {/* Inner cutout */}
                    <div className="absolute inset-3 rounded-full bg-background border" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {scoreStyle.mode === 'metal' ? (
                        <GradientText
                          className="text-5xl font-extrabold"
                          colors={scoreStyle.numberColors}
                          textOnly
                        >
                          {data.portfolioLiftScore.toFixed(1)}
                        </GradientText>
                      ) : (
                        <div className={cn('text-5xl font-bold', scoreStyle.numberClass)}>
                          {data.portfolioLiftScore.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Portfolio Lift</div>
                  {scoreStyle.mode === 'metal' ? (
                    <GradientText className="text-sm font-semibold" colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)']} textOnly>
                      {data.assessmentLabel}
                    </GradientText>
                  ) : (
                    <div className={cn('text-sm font-semibold', scoreStyle.numberClass)}>{data.assessmentLabel}</div>
                  )}
                </div>

                {/* Stats chips */}
                <div className="md:col-span-2">
                  {/* Two stat cards only */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <StatCard
                      icon={<Trophy className="h-5 w-5 text-primary" />}
                      label="Total Recognitions"
                      value={
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl md:text-3xl font-extrabold">
                            {data.mixAnalysis.nationalCount + data.mixAnalysis.stateCount + data.mixAnalysis.regionalCount + data.mixAnalysis.schoolCount}
                          </span>
                          <span className="text-muted-foreground text-sm md:text-base">{data.mixAnalysis.nationalCount} National · {data.mixAnalysis.stateCount} State · {data.mixAnalysis.schoolCount} School</span>
                        </div>
                      }
                    />

                    <StatCard
                      icon={<Target className="h-5 w-5 text-primary" />}
                      label="Narrative Alignment"
                      value={<span className="font-bold">{data.mixAnalysis.spineAlignmentPercent}% aligned</span>}
                    />
                  </div>

                  {/* (Removed duplicate secondary grid since two-card layout now above) */}

                  {/* Summary */}
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground mt-4">
                    {data.oneLineSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expanded View - New Deep Insights Tabs */}
        {expanded && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-2 md:gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Recognition Portfolio Analysis
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpanded(false)}
                className="text-[11px] md:text-xs h-7 px-2.5 md:h-8 md:px-3 ml-1 md:ml-2"
              >
                Collapse <ChevronUp className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Portfolio Lift */}
              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Portfolio Lift</div>
                <div className="mb-1">
                  {data.portfolioLiftScore >= 9.0 ? (
                    <GradientText
                      className="text-4xl font-extrabold metric-value"
                      colors={['hsl(250 70% 60%)','hsl(185 80% 55%)','hsl(280 90% 65%)','hsl(250 70% 60%)']}
                      textOnly
                    >
                      {data.portfolioLiftScore.toFixed(1)}/10
                    </GradientText>
                  ) : (
                    <div className={`text-4xl font-bold ${getScoreColor(data.portfolioLiftScore)}`}>
                      {data.portfolioLiftScore.toFixed(1)}/10
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{data.assessmentLabel}</div>
              </Card>

              {/* Recognition Mix */}
              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Recognition Mix</div>
                <div className="text-3xl font-bold mb-1">
                  {data.mixAnalysis.nationalCount + data.mixAnalysis.stateCount + data.mixAnalysis.regionalCount + data.mixAnalysis.schoolCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.mixAnalysis.nationalCount}N • {data.mixAnalysis.stateCount}S • {data.mixAnalysis.schoolCount}Sch
                </div>
              </Card>

              {/* Narrative Alignment */}
              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Narrative Alignment</div>
                <div className="text-4xl font-bold mb-1">{data.mixAnalysis.spineAlignmentPercent}%</div>
                <div className="text-sm text-muted-foreground">Spine match</div>
              </Card>
            </div>

            {/* Deep Analysis Tabs */}
            <Tabs defaultValue="positioning" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="positioning">Competitive Positioning</TabsTrigger>
                <TabsTrigger value="quality">Quality Indicators</TabsTrigger>
                <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
                <TabsTrigger value="usage">Strategic Usage</TabsTrigger>
              </TabsList>

              <TabsContent value="positioning" className="mt-6">
                {data.competitivePositioning && (
                  <CompetitivePositioningTab data={data.competitivePositioning} />
                )}
              </TabsContent>

              <TabsContent value="quality" className="mt-6">
                {data.qualityIndicators && (
                  <QualityIndicatorsTab data={data.qualityIndicators} />
                )}
              </TabsContent>

              <TabsContent value="gaps" className="mt-6">
                {data.gapAnalysisGrowth && (
                  <GapAnalysisGrowthTab data={data.gapAnalysisGrowth} />
                )}
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                {data.strategicUsage && (
                  <StrategicUsageTab data={data.strategicUsage} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Cohesive stat card used in collapsed view
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}> = ({ icon, label, value, right, className }) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-background',
        className
      )}
    >
      <div className="rounded-2xl h-full w-full bg-background">
        <div className="flex items-center gap-4 p-4 md:p-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
            <div className="text-base md:text-xl tracking-tight truncate">
              {value}
            </div>
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
    </div>
  );
};
