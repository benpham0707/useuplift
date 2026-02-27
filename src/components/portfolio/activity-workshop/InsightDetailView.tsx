/**
 * InsightDetailView — Full detail view with tabbed navigation.
 *
 * Sticky header with back button + title + rank + badges + score ring.
 * Tab bar: Overview | Description | Next Steps.
 * Transform content is integrated into the Description tab.
 * Each tab renders its section component in a scrollable area.
 * Quick-encouragement activities get simplified tabs.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  FileText,
  Compass,
  Clock,
  Sparkles,
  XCircle,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityInsightData } from './insightTypes';
import {
  getRoleConfig,
  getRoleBadgeClass,
  TIER_LABELS,
} from './insightTypes';
import ScoreRing from './ScoreRing';
import { TierHoverCard } from './AdmissionsContextCards';
import { OverviewTab } from './sections/CelebrationTab';
import { ActivityWorkshopDescription } from '@/components/workshop/ActivityWorkshopDescription';
import { NextStepsTab } from './sections/NextStepsTab';

interface InsightDetailViewProps {
  data: ActivityInsightData;
  onBack: () => void;
}

type TabValue = 'overview' | 'description' | 'next-steps';

const InsightDetailViewInner = function InsightDetailView({ data, onBack }: InsightDetailViewProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';
  const showEssayBadge = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';
  const hasDescription = data.descriptionOptimization !== null;

  // Active tab — only the selected tab's component is mounted
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Entrance animation flag
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`flex flex-col h-full transition-[opacity,transform] duration-200 ${
        entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      }`}
    >
      {/* ── Sticky Header — compact ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Rank + Title + badges — single row */}
          <span className="text-xs font-bold text-muted-foreground/35">#{data.rank}</span>
          <h2 className="text-sm font-semibold truncate flex-1 min-w-0">{data.title}</h2>
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            <TierHoverCard tier={data.tier}>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground cursor-help">
                {tierLabel}
              </span>
            </TierHoverCard>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
              {roleCfg.label}
            </span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {data.totalHours.toLocaleString()}h
            </span>
            {showEssayBadge && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center gap-0.5">
                <Sparkles className="h-2 w-2" />
                Essay
              </span>
            )}
          </div>

          {/* Score ring */}
          <ScoreRing score={data.combinedScore} size={38} strokeWidth={2.5} />
        </div>
      </div>

      {/* ── Status Strip — compact ── */}
      {(data.improvementTeaching.length > 0 || !data.descriptionReady || data.redFlags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b bg-muted/15">
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

      {/* ── Tabbed Content (lazy: only active tab mounts) ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent px-4 pt-1 pb-0 h-auto gap-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Overview
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
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'description' && (
            hasDescription && data.descriptionOptimization ? (
              <ActivityWorkshopDescription
                optimization={data.descriptionOptimization}
                improvementTeaching={data.improvementTeaching}
                accentColor={roleCfg.accent}
                scoreProjection={data.transformation?.expectedScoreImprovement ?? null}
                transformation={data.transformation}
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
            )
          )}
          {activeTab === 'next-steps' && <NextStepsTab data={data} />}
        </div>
      </Tabs>
    </div>
  );
};

export const InsightDetailView = React.memo(InsightDetailViewInner);
