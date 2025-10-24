import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Activity, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtracurricularItem } from './ExtracurricularCard';
import { CommitmentDepthTab } from './tabs/CommitmentDepthTab';
import { ImpactEvolutionTab } from './tabs/ImpactEvolutionTab';
import { BalanceAnalysisTab } from './tabs/BalanceAnalysisTab';
import { ApplicationStrategyTab } from './tabs/ApplicationStrategyTab';

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
  activities: ExtracurricularItem[];
}

const getScoreColor = (score: number) => {
  if (score >= 9) return 'text-purple-600';
  if (score >= 7.5) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-orange-600';
};

export const ExtracurricularOverview: React.FC<ExtracurricularOverviewProps> = ({ data, activities }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryBreakdownText = Object.entries(data.balanceAnalysis.categoryBreakdown)
    .map(([cat, count]) => `${count} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
    .join(' • ');

  return (
    <div className="space-y-4">
      {/* Collapsed View */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Portfolio Weight Score */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Portfolio Weight Score
              </div>
              <div className={cn("text-5xl font-bold", getScoreColor(data.portfolioWeightScore))}>
                {data.portfolioWeightScore.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {data.assessmentLabel}
              </div>
            </div>

            {/* Total Activities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Activity Mix
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {data.balanceAnalysis.totalActivities}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {categoryBreakdownText}
              </div>
            </div>

            {/* Commitment Depth */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Commitment Depth
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {data.balanceAnalysis.averageCommitmentYears.toFixed(1)} yrs
              </div>
              <div className="text-xs text-muted-foreground">
                {data.balanceAnalysis.totalCommitmentHours.toLocaleString()}+ total hours
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.oneLineSummary}
            </p>
          </div>

          {/* Expand Button */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  Hide Full Analysis
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View Full Analysis
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expanded View */}
      {isExpanded && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Deep Analysis</h3>
            
            <Tabs defaultValue="commitment" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                <TabsTrigger value="commitment">Commitment Depth</TabsTrigger>
                <TabsTrigger value="impact">Impact Evolution</TabsTrigger>
                <TabsTrigger value="balance">Balance Analysis</TabsTrigger>
                <TabsTrigger value="strategy">Application Strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="commitment" className="mt-6">
                <CommitmentDepthTab data={data.commitmentDepth} activities={activities} />
              </TabsContent>

              <TabsContent value="impact" className="mt-6">
                <ImpactEvolutionTab data={data.impactEvolution} activities={activities} />
              </TabsContent>

              <TabsContent value="balance" className="mt-6">
                <BalanceAnalysisTab data={data.balanceGapsAnalysis} balanceAnalysis={data.balanceAnalysis} />
              </TabsContent>

              <TabsContent value="strategy" className="mt-6">
                <ApplicationStrategyTab data={data.applicationStrategy} activities={activities} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
