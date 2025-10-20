import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Info, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
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
    recencyScore: 'excellent' | 'good' | 'fair' | 'poor';
  };
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

const getScoreLabel = (score: number) => {
  if (score >= 9.0) return 'Exceptional';
  if (score >= 7.5) return 'Strong';
  if (score >= 6.0) return 'Developing';
  return 'Supporting';
};

export const RecognitionOverview: React.FC<RecognitionOverviewProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  const totalRecognitions = data.mixAnalysis.nationalCount + data.mixAnalysis.stateCount + 
                            data.mixAnalysis.regionalCount + data.mixAnalysis.schoolCount;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Collapsed State */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Recognition Portfolio Analysis</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <span className={cn('text-3xl font-bold', getScoreColor(data.portfolioLiftScore))}>
                  {data.portfolioLiftScore.toFixed(1)}
                </span>
                <span className="ml-1">Portfolio Lift ({data.assessmentLabel})</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalRecognitions} Total Recognitions • {data.mixAnalysis.nationalCount} National • {data.mixAnalysis.spineAlignmentPercent}% Spine-Aligned
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1"
          >
            {expanded ? (
              <>Collapse <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View Full Analysis <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </div>

        {/* Expanded State */}
        {expanded && (
          <div className="space-y-6 mt-6 pt-6 border-t">
            {/* Three Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Portfolio Lift */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-muted/20 cursor-help">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">Portfolio Lift</span>
                        <Info className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className={cn('text-3xl font-bold', getScoreColor(data.portfolioLiftScore))}>
                        {data.portfolioLiftScore.toFixed(1)}/10
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(data.portfolioLiftScore)}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">How much do your recognitions strengthen your overall portfolio? Combines competitive selectivity with narrative alignment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Recognition Mix */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-muted/20 cursor-help">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">Recognition Mix</span>
                        <Info className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>National:</span>
                          <span className="font-bold">{data.mixAnalysis.nationalCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>State:</span>
                          <span className="font-bold">{data.mixAnalysis.stateCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>School:</span>
                          <span className="font-bold">{data.mixAnalysis.schoolCount}</span>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Distribution of recognition tiers. Competitive colleges value national and state distinctions most highly.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Narrative Alignment */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-muted/20 cursor-help">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">Narrative Alignment</span>
                        <Info className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {data.mixAnalysis.spineAlignmentPercent}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Well-Aligned</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Percentage of recognitions that directly support your narrative spine. Above 75% indicates strong thematic coherence.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Strategic Analysis */}
            <div className="p-4 rounded-lg border bg-muted/10">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Strategic Analysis
              </h3>
              <p className="text-sm leading-relaxed mb-4">
                {data.oneLineSummary}
              </p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Strengths
                  </h4>
                  <ul className="space-y-1 ml-5 text-muted-foreground">
                    {data.mixAnalysis.nationalCount > 0 && (
                      <li className="list-disc">National competitive distinction establishes credibility at selective college level</li>
                    )}
                    <li className="list-disc">Mix of competitive and institutional honors demonstrates versatility</li>
                    <li className="list-disc">Strong recency ({data.mixAnalysis.recencyScore}) shows current engagement</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Opportunities
                  </h4>
                  <ul className="space-y-1 ml-5 text-muted-foreground">
                    {data.mixAnalysis.schoolCount > 2 && (
                      <li className="list-disc">{data.mixAnalysis.schoolCount} school-level recognitions lack competitive selectivity</li>
                    )}
                    <li className="list-disc">Consider pursuing 1-2 more state/national competitive honors to strengthen depth</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tier Breakdown */}
            <div className="p-4 rounded-lg border bg-muted/10">
              <h3 className="text-sm font-semibold mb-3">Tier Breakdown</h3>
              <div className="space-y-2">
                {data.mixAnalysis.nationalCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">National</span>
                      <span className="text-muted-foreground">{Math.round((data.mixAnalysis.nationalCount / totalRecognitions) * 100)}% ({data.mixAnalysis.nationalCount} recognition{data.mixAnalysis.nationalCount !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                        style={{ width: `${(data.mixAnalysis.nationalCount / totalRecognitions) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {data.mixAnalysis.stateCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">State</span>
                      <span className="text-muted-foreground">{Math.round((data.mixAnalysis.stateCount / totalRecognitions) * 100)}% ({data.mixAnalysis.stateCount} recognition{data.mixAnalysis.stateCount !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${(data.mixAnalysis.stateCount / totalRecognitions) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {data.mixAnalysis.schoolCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-green-600 dark:text-green-400 font-medium">School</span>
                      <span className="text-muted-foreground">{Math.round((data.mixAnalysis.schoolCount / totalRecognitions) * 100)}% ({data.mixAnalysis.schoolCount} recognition{data.mixAnalysis.schoolCount !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                        style={{ width: `${(data.mixAnalysis.schoolCount / totalRecognitions) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="usage" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="usage">Usage Strategy</TabsTrigger>
                <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="usage" className="p-4 rounded-lg border bg-muted/10 mt-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Flagship (Lead with these):</h4>
                    <ul className="space-y-1 ml-5 text-muted-foreground">
                      {data.mixAnalysis.nationalCount > 0 && (
                        <li className="list-disc">Civic Tech Challenge Finalist (Common App Activity #1)</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Bridge (Strong supporting):</h4>
                    <ul className="space-y-1 ml-5 text-muted-foreground">
                      {data.mixAnalysis.stateCount > 0 && (
                        <>
                          <li className="list-disc">State Service Innovation Award (Honors section)</li>
                          <li className="list-disc">State CS Olympiad 2nd Place (Validates technical skills)</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Support (List but don't emphasize):</h4>
                    <ul className="space-y-1 ml-5 text-muted-foreground">
                      <li className="list-disc">{data.mixAnalysis.schoolCount} school-level recognitions (group together)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="gaps" className="p-4 rounded-lg border bg-muted/10 mt-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Your recognition portfolio would benefit from:</p>
                  <ul className="space-y-1 ml-5">
                    {data.mixAnalysis.nationalCount === 0 && (
                      <li className="list-disc">Pursuing 1-2 national-level competitions to establish competitive distinction</li>
                    )}
                    {data.mixAnalysis.nationalCount === 1 && (
                      <li className="list-disc">Adding one more national recognition to strengthen depth</li>
                    )}
                    <li className="list-disc">Converting school-level activities into competitive submissions</li>
                    <li className="list-disc">Seeking external validation for community impact work</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="p-4 rounded-lg border bg-muted/10 mt-4">
                <div className="text-sm text-muted-foreground">
                  <p>Most recent recognition: {data.mixAnalysis.mostRecentDate}</p>
                  <p className="mt-2">Recency Score: <span className="font-semibold capitalize">{data.mixAnalysis.recencyScore}</span></p>
                  <p className="mt-2 text-xs">Tip: Recognitions from the past 12 months carry the most weight with admissions committees.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
