/**
 * InsightSummaryCard — Compact clickable card for the activity insights list view.
 *
 * ~80px height. Shows: left accent bar, rank, title, celebration headline,
 * badges (tier, story role, hours, essay worthiness), strength/improvement counts,
 * and a score ring. Clicking navigates to InsightDetailView.
 */
import React from 'react';
import {
  CheckCircle,
  Clock,
  Sparkles,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import type { ActivityInsightData } from './insightTypes';
import {
  getRoleConfig,
  getRoleBadgeClass,
  TIER_LABELS,
} from './insightTypes';
import ScoreRing from './ScoreRing';
import { TierHoverCard } from './AdmissionsContextCards';

interface InsightSummaryCardProps {
  data: ActivityInsightData;
  onSelect: (activityId: string) => void;
}

const InsightSummaryCardInner = function InsightSummaryCard({ data, onSelect }: InsightSummaryCardProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';
  const headline = data.celebrationHeadline || data.quickCelebration || data.summaryOneLiner;
  const showEssayBadge = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';

  return (
    <button
      type="button"
      onClick={() => onSelect(data.activityId)}
      className="w-full text-left flex rounded-xl bg-card/90 border border-border/15 shadow-sm transition-[box-shadow,background-color] duration-200 hover:shadow-md hover:bg-muted/10 overflow-hidden group"
    >
      {/* Left accent bar */}
      <div className={`w-1 flex-shrink-0 ${roleCfg.accent}`} />

      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          {/* Rank */}
          <span className="text-sm font-bold text-muted-foreground/35 w-5 text-center flex-shrink-0 mt-0.5">
            #{data.rank}
          </span>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Title + badges + score — all in one row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="text-sm font-semibold truncate">{data.title}</h3>
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <TierHoverCard tier={data.tier}>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground cursor-help">
                      {tierLabel}
                    </span>
                  </TierHoverCard>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
                    {roleCfg.label}
                  </span>
                </div>
              </div>
              <ScoreRing score={data.combinedScore} size={40} strokeWidth={2.5} />
            </div>

            {/* Headline — tighter */}
            {headline && (
              <p className={`text-xs italic leading-snug line-clamp-1 ${roleCfg.textAccent} opacity-80`}>
                &ldquo;{headline}&rdquo;
              </p>
            )}

            {/* Bottom row: metadata + strengths/improvements */}
            <div className="flex items-center gap-2 text-[10px]">
              {/* Mobile-only badges */}
              <TierHoverCard tier={data.tier}>
                <span className="sm:hidden text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground cursor-help">
                  {tierLabel}
                </span>
              </TierHoverCard>
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {data.totalHours.toLocaleString()}h
              </span>
              {showEssayBadge && (
                <span className="font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center gap-0.5">
                  <Sparkles className="h-2 w-2" />
                  Essay
                </span>
              )}
              <span className="text-border mx-0.5">|</span>
              {data.greenFlags.length > 0 && (
                <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {data.greenFlags.length}
                </span>
              )}
              {data.improvementTeaching.length > 0 && (
                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="h-2.5 w-2.5" />
                  {data.improvementTeaching.length}
                </span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 ml-auto group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export const InsightSummaryCard = React.memo(InsightSummaryCardInner);
