import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CompetitivePositioningTab } from './CompetitivePositioningTab';
import { QualityIndicatorsTab } from './QualityIndicatorsTab';
import { GapAnalysisGrowthTab } from './GapAnalysisGrowthTab';
import { StrategicUsageTab } from './StrategicUsageTab';

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
  competitivePositioning?: CompetitivePositioning;
  qualityIndicators?: QualityIndicators;
  gapAnalysisGrowth?: GapAnalysisGrowth;
  strategicUsage?: StrategicUsage;
}

interface RecognitionOverviewProps {
  data: RecognitionOverviewData;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const RecognitionOverview: React.FC<RecognitionOverviewProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        {/* Collapsed View - Centered Design */}
        {!expanded && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recognition Portfolio Analysis</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpanded(true)}
                className="text-sm"
              >
                View Full Analysis <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Centered Score Card */}
            <div className="p-6 rounded-lg border bg-muted/10 mb-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Portfolio Lift Score</div>
              <div className={`text-5xl font-bold mb-1 ${getScoreColor(data.portfolioLiftScore)}`}>
                {data.portfolioLiftScore.toFixed(1)}/10
              </div>
              <div className={`text-base font-semibold ${getScoreColor(data.portfolioLiftScore)}`}>
                {data.assessmentLabel}
              </div>
            </div>

            {/* Stats - More Readable Layout */}
            <div className="text-center space-y-1 mb-6 text-sm">
              <div>
                <span className="font-medium">{data.mixAnalysis.nationalCount + data.mixAnalysis.stateCount + data.mixAnalysis.regionalCount + data.mixAnalysis.schoolCount} Recognitions</span>
                {' • '}
                <span className="font-medium">{data.mixAnalysis.nationalCount} National</span>
                {' • '}
                <span className="font-medium">{data.mixAnalysis.stateCount} State</span>
                {' • '}
                <span className="font-medium">{data.mixAnalysis.schoolCount} School</span>
              </div>
              <div className="text-muted-foreground">
                {data.mixAnalysis.spineAlignmentPercent}% align with your narrative spine
              </div>
            </div>

            <p className="text-sm leading-relaxed text-center text-muted-foreground">{data.oneLineSummary}</p>
          </div>
        )}

        {/* Expanded View - New Deep Insights Tabs */}
        {expanded && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recognition Portfolio Analysis</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpanded(false)}
                className="text-sm"
              >
                Collapse <ChevronUp className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Portfolio Lift */}
              <Card className="p-6 text-center">
                <div className="text-xs text-muted-foreground mb-2">Portfolio Lift</div>
                <div className={`text-4xl font-bold mb-1 ${getScoreColor(data.portfolioLiftScore)}`}>
                  {data.portfolioLiftScore.toFixed(1)}/10
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
