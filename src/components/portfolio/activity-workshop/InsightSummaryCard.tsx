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
  getScoreColor,
  getScoreTextColor,
} from './insightTypes';

interface InsightSummaryCardProps {
  data: ActivityInsightData;
  onClick: () => void;
}

/** Compact 48px SVG score ring */
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
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className={`text-sm font-bold tabular-nums ${getScoreTextColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function InsightSummaryCard({ data, onClick }: InsightSummaryCardProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';
  const headline = data.celebrationHeadline || data.quickCelebration || data.summaryOneLiner;
  const showEssayBadge = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex rounded-xl backdrop-blur-sm bg-card/90 border border-border/15 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-muted/10 overflow-hidden group"
    >
      {/* Left accent bar */}
      <div className={`w-1 flex-shrink-0 ${roleCfg.accent}`} />

      <div className="flex-1 p-3 pl-3">
        <div className="flex items-start gap-3">
          {/* Rank */}
          <span className="text-base font-bold text-muted-foreground/40 w-6 text-center flex-shrink-0 mt-0.5">
            #{data.rank}
          </span>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title row + score ring */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold truncate">{data.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ScoreRing score={data.combinedScore} />
              </div>
            </div>

            {/* Celebration headline */}
            {headline && (
              <p className={`text-sm font-medium italic leading-snug line-clamp-1 ${roleCfg.textAccent}`}>
                &ldquo;{headline}&rdquo;
              </p>
            )}

            {/* Badges row */}
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

            {/* Strengths / improvements + chevron */}
            <div className="flex items-center gap-3 text-[11px]">
              {data.greenFlags.length > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  {data.greenFlags.length} strength{data.greenFlags.length > 1 ? 's' : ''}
                </span>
              )}
              {data.improvementTeaching.length > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="h-3 w-3" />
                  {data.improvementTeaching.length} to improve
                </span>
              )}
              <span className="ml-auto">
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
