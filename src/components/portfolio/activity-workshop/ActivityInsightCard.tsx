/**
 * ActivityInsightCard — Premium redesigned per-activity insight card.
 *
 * Design philosophy: Each card reads like a personal advisor's notes.
 * Celebration-first, story-driven, actionable.
 *
 * Sections (expanded):
 *   1. Celebration Banner
 *   2. Score Breakdown (premium glass-morphism cards with conic rings)
 *   3. What's Working (premium strength cards with glow + meter)
 *   4. Description Optimization (tabbed with glowing border + copy)
 *   5. How This Fits Your Story (narrative threads + elevations)
 *   6. Next Steps (prioritized improvements)
 */

import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  BookOpen,
  TrendingUp,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';

// Premium section components
import { ScoreBreakdown } from './sections/ScoreBreakdown';
import { WhatsWorking } from './sections/WhatsWorking';
import { DescriptionOptimization } from './sections/DescriptionOptimization';

// ============================================================================
// TYPES — re-exported from shared module
// ============================================================================

import type { ActivityInsightData } from './insightTypes';
export type { ActivityInsightData } from './insightTypes';

interface ActivityInsightCardProps {
  data: ActivityInsightData;
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================================================
// STORY ROLE COLOR SYSTEM
// ============================================================================

const ROLE_COLORS: Record<string, {
  accent: string;
  bannerLight: string;
  bannerDark: string;
  label: string;
  textAccent: string;
}> = {
  core_identity: {
    accent: 'bg-purple-500',
    bannerLight: 'from-purple-50 to-violet-50',
    bannerDark: 'dark:from-purple-950/40 dark:to-violet-950/40',
    label: 'Core Identity',
    textAccent: 'text-purple-600 dark:text-purple-400',
  },
  passion_pursuit: {
    accent: 'bg-blue-500',
    bannerLight: 'from-blue-50 to-cyan-50',
    bannerDark: 'dark:from-blue-950/40 dark:to-cyan-950/40',
    label: 'Passion',
    textAccent: 'text-blue-600 dark:text-blue-400',
  },
  obligation: {
    accent: 'bg-amber-500',
    bannerLight: 'from-amber-50 to-orange-50',
    bannerDark: 'dark:from-amber-950/40 dark:to-orange-950/40',
    label: 'Obligation',
    textAccent: 'text-amber-600 dark:text-amber-400',
  },
  impact_vehicle: {
    accent: 'bg-emerald-500',
    bannerLight: 'from-emerald-50 to-teal-50',
    bannerDark: 'dark:from-emerald-950/40 dark:to-teal-950/40',
    label: 'Impact',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
  },
  exploration: {
    accent: 'bg-teal-500',
    bannerLight: 'from-teal-50 to-cyan-50',
    bannerDark: 'dark:from-teal-950/40 dark:to-cyan-950/40',
    label: 'Exploration',
    textAccent: 'text-teal-600 dark:text-teal-400',
  },
};

const DEFAULT_ROLE = ROLE_COLORS.exploration;

const TIER_LABELS: Record<number, string> = {
  1: 'T1 Elite',
  2: 'T2 Strong',
  3: 'T3 Solid',
  4: 'T4 Basic',
};

// ============================================================================
// SCORE HELPERS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 8.0) return '#22c55e'; // green-500
  if (score >= 6.0) return '#14b8a6'; // teal-500
  if (score >= 4.0) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

function getScoreTextColor(score: number): string {
  if (score >= 8.0) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-600 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const PRIORITY_BADGE: Record<string, { className: string; label: string }> = {
  high: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', label: 'High Priority' },
  medium: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Medium' },
  low: { className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Low' },
};

const ELEVATION_STRENGTH_BADGE: Record<string, string> = {
  transformative: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  strong: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  moderate: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  subtle: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ============================================================================
// SUB-COMPONENTS (inline)
// ============================================================================

/** SVG circle score ring with animated arc */
function ScoreRing({ score, size = 48, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-0.5">
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
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className={`text-sm font-bold tabular-nums ${getScoreTextColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>
      {label && (
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActivityInsightCard({ data, isExpanded, onToggle }: ActivityInsightCardProps) {
  const roleCfg = ROLE_COLORS[data.storyRole] || DEFAULT_ROLE;
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';

  const headline = data.celebrationHeadline || data.quickCelebration || data.summaryOneLiner;
  const showEssayBadge = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';

  return (
    <div className="rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      {/* ================================================================ */}
      {/* COLLAPSED HEADER with left accent bar                            */}
      {/* ================================================================ */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex transition-colors hover:bg-muted/20"
      >
        {/* Left accent bar */}
        <div className={`w-1 flex-shrink-0 rounded-l ${roleCfg.accent}`} />

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
                {/* Score ring — collapsed */}
                <div className="relative flex-shrink-0">
                  <ScoreRing score={data.combinedScore} size={48} />
                  <span className="block text-center text-[9px] text-muted-foreground -mt-0.5">/10</span>
                </div>
              </div>

              {/* Celebration headline */}
              {headline && (
                <p className={`text-sm font-medium italic leading-snug ${roleCfg.textAccent}`}>
                  "{headline}"
                </p>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {tierLabel}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  data.storyRole === 'core_identity' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                  data.storyRole === 'passion_pursuit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                  data.storyRole === 'obligation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                  data.storyRole === 'impact_vehicle' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                }`}>
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

              {/* Strengths / improvements teaser */}
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
                {/* Expand hint */}
                <span className="ml-auto">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* ================================================================ */}
      {/* EXPANDED DETAIL                                                  */}
      {/* ================================================================ */}
      {isExpanded && (
        <div className="border-t">
          {/* ── Section 1: Celebration Banner ── */}
          <div className={`px-4 py-3 bg-gradient-to-r ${roleCfg.bannerLight} ${roleCfg.bannerDark}`}>
            {data.celebrationHeadline && (
              <p className={`text-sm font-semibold ${roleCfg.textAccent}`}>
                {data.celebrationHeadline}
              </p>
            )}
            {data.celebrationStrengths.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {data.celebrationStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {data.summaryOneLiner && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                What admissions officers see: "{data.summaryOneLiner}"
              </p>
            )}
          </div>

          <div className="px-4 pb-4 pt-3 space-y-5">
            {/* ── Section 2: Score Breakdown (Premium) ── */}
            <ScoreBreakdown
              activityScore={data.activityScore}
              descriptionScore={data.descriptionScore}
              combinedScore={data.combinedScore}
              accentColor={roleCfg.accent}
              activityScoreRationales={data.activityScoreRationales}
              descriptionScoreRationales={data.descriptionScoreRationales}
              tierExplanation={data.tierExplanation}
              activityOverallRationale={data.activityOverallRationale}
              descriptionOverallRationale={data.descriptionOverallRationale}
              combinedScoreRationale={data.combinedScoreRationale}
            />

            {/* ── Section 3: What's Working (Premium) ── */}
            <WhatsWorking
              greenFlags={data.greenFlags}
              strengthTeaching={data.strengthTeaching}
              accentColor={roleCfg.accent}
            />

            {/* ── Section 4: Description Optimization (Premium) ── */}
            {data.descriptionOptimization && (
              <DescriptionOptimization
                optimization={data.descriptionOptimization}
                improvementTeaching={data.improvementTeaching}
                accentColor={roleCfg.accent}
              />
            )}

            {/* ── Section 5: How This Fits Your Story ── */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                How This Fits Your Story
              </h4>
              <div className="space-y-3">
                {/* Story role + centrality */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    data.storyRole === 'core_identity' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                    data.storyRole === 'passion_pursuit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                    data.storyRole === 'obligation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    data.storyRole === 'impact_vehicle' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  }`}>
                    {roleCfg.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${roleCfg.accent}`}
                      style={{ width: `${data.centralityScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {data.centralityScore}/100
                  </span>
                </div>

                {/* Narrative guidance */}
                {data.narrativeGuidance && (
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {data.narrativeGuidance.howToTalkAboutThis}
                      </p>
                    </div>
                  </div>
                )}

                {/* Narrative threads */}
                {data.narrativeThreads.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Narrative threads:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.narrativeThreads.map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elevation connections */}
                {data.elevations.length > 0 && (
                  <div className="space-y-1.5">
                    {data.elevations.map((e, i) => (
                      <div key={i} className="rounded-lg border border-dashed p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-medium">
                            Elevated by {e.elevatingTitle}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ELEVATION_STRENGTH_BADGE[e.strength] || ELEVATION_STRENGTH_BADGE.moderate}`}>
                            {e.strength}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{e.mechanism}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* School fit badges */}
                {data.bestFitSchoolTypes.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Best fit:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.bestFitSchoolTypes.map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 6: Next Steps ── */}
            {(data.improvementTeaching.length > 0 || (data.narrativeGuidance?.interviewTips?.length ?? 0) > 0) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Next Steps
                </h4>
                <div className="space-y-2">
                  {data.improvementTeaching.map((imp, i) => {
                    const priorityCfg = PRIORITY_BADGE[imp.priority] || PRIORITY_BADGE.medium;
                    return (
                      <div key={i} className="rounded-lg border p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Target className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{imp.issue}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityCfg.className}`}>
                            {priorityCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{imp.howToFix}</p>
                      </div>
                    );
                  })}

                  {/* Interview tips */}
                  {data.narrativeGuidance?.interviewTips && data.narrativeGuidance.interviewTips.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3" />
                        Interview Tips
                      </span>
                      <ul className="space-y-0.5">
                        {data.narrativeGuidance.interviewTips.map((tip, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-muted-foreground mt-0.5">-</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick tip for non-deep-teaching activities */}
            {data.quickTip && data.improvementTeaching.length === 0 && (
              <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 p-2.5">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/80 leading-relaxed">{data.quickTip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
