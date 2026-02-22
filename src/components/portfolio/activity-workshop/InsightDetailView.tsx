/**
 * InsightDetailView — Full detail view with tabbed navigation.
 *
 * Sticky header with back button + title + rank + badges + score ring.
 * Tab bar: Celebration | Strengths | Description | Next Steps.
 * Each tab renders its section component in a scrollable area.
 * Quick-encouragement activities get simplified tabs.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PartyPopper,
  CheckCircle,
  FileText,
  Compass,
  Clock,
  Sparkles,
  XCircle,
  Target,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ActivityInsightData } from './insightTypes';
import {
  getRoleConfig,
  getRoleBadgeClass,
  TIER_LABELS,
  getScoreColor,
  getScoreTextColor,
} from './insightTypes';
import { CelebrationTab } from './sections/CelebrationTab';
import { StrengthsTab } from './sections/StrengthsTab';
import { DescriptionOptimization } from './sections/DescriptionOptimization';
import { NextStepsTab } from './sections/NextStepsTab';
import { TransformationTab } from './sections/TransformationTab';

interface InsightDetailViewProps {
  data: ActivityInsightData;
  onBack: () => void;
}

type TabValue = 'celebration' | 'strengths' | 'description' | 'next-steps' | 'transform';

/** Header score ring (48px) */
function ScoreRing({ score }: { score: number }) {
  const size = 48;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = getScoreColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-[800ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-bold tabular-nums ${getScoreTextColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function InsightDetailView({ data, onBack }: InsightDetailViewProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';
  const showEssayBadge = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';
  const hasDescription = data.descriptionOptimization !== null;
  const hasTransformation = data.transformation !== null;

  // Entrance animation flag
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`flex flex-col h-full transition-all duration-200 ${
        entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      }`}
    >
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-0.5 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Title + badges */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground/40">#{data.rank}</span>
              <h2 className="text-base font-semibold truncate">{data.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tierLabel}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
                {roleCfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {data.totalHours.toLocaleString()}h
              </span>
              {showEssayBadge && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  Essay
                </span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <ScoreRing score={data.combinedScore} />
        </div>
      </div>

      {/* ── Per-Activity Status Strip ── */}
      {(data.improvementTeaching.length > 0 || !data.descriptionReady || data.redFlags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/20">
          {/* Readiness badge */}
          {data.descriptionReady ? (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 flex items-center gap-1">
              <CheckCircle className="h-2.5 w-2.5" />
              Description Ready
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
              <XCircle className="h-2.5 w-2.5" />
              Not Ready
              {data.descriptionIssues.length > 0 && (
                <span className="text-red-500/70">
                  — {data.descriptionIssues.slice(0, 2).join(', ')}
                  {data.descriptionIssues.length > 2 && ` +${data.descriptionIssues.length - 2}`}
                </span>
              )}
            </span>
          )}

          {/* Issues count */}
          {data.improvementTeaching.length > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
              <Target className="h-2.5 w-2.5" />
              {data.improvementTeaching.length} issue{data.improvementTeaching.length !== 1 ? 's' : ''}
              {data.improvementTeaching.some((i) => i.priority === 'high') && (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  ({data.improvementTeaching.filter((i) => i.priority === 'high').length} high)
                </span>
              )}
            </span>
          )}

          {/* Red flags count */}
          {data.redFlags.length > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              {data.redFlags.length} red flag{data.redFlags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Tabbed Content ── */}
      <Tabs defaultValue="celebration" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent px-4 pt-1 pb-0 h-auto gap-0">
          <TabsTrigger
            value="celebration"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <PartyPopper className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Celebration
          </TabsTrigger>
          <TabsTrigger
            value="strengths"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Strengths
          </TabsTrigger>
          <TabsTrigger
            value="description"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Description
          </TabsTrigger>
          <TabsTrigger
            value="next-steps"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <Compass className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Next Steps
          </TabsTrigger>
          {hasTransformation && (
            <TabsTrigger
              value="transform"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
            >
              <Wand2 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
              Transform
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="celebration" className="p-4 mt-0">
            <CelebrationTab data={data} />
          </TabsContent>

          <TabsContent value="strengths" className="p-4 mt-0">
            <StrengthsTab data={data} />
          </TabsContent>

          <TabsContent value="description" className="p-4 mt-0">
            {hasDescription && data.descriptionOptimization ? (
              <DescriptionOptimization
                optimization={data.descriptionOptimization}
                improvementTeaching={data.improvementTeaching}
                accentColor={roleCfg.accent}
                descriptionAlternatives={data.descriptionAlternatives}
                suggestedRewrite={data.suggestedRewrite}
                scoreProjection={data.transformation?.expectedScoreImprovement ?? null}
              />
            ) : (
              <div className="rounded-lg border bg-card p-6 text-center">
                <FileText className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {data.teachingDepth === 'quick'
                    ? 'Run a full analysis to see description optimization suggestions.'
                    : 'Description optimization data is being prepared.'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="next-steps" className="p-4 mt-0">
            <NextStepsTab data={data} />
          </TabsContent>

          {hasTransformation && (
            <TabsContent value="transform" className="p-4 mt-0">
              <TransformationTab data={data} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
