/**
 * OverviewTab — Holistic activity analysis overview.
 *
 * Replaces the former CelebrationTab. Shows the complete analysis at a glance:
 * - Score summary with combined/activity/description breakdown
 * - Full scoring rubric with per-dimension rationales at full depth
 * - College tier alignment and positioning
 * - Comparison benchmarks and leveling-up guidance
 * - Key signals (green/red flags)
 *
 * Design principle: progressive disclosure — dimensions are collapsed by default
 * showing label + score bar + score. Click to expand and see full rationale +
 * context badges. Prevents information overload while keeping depth accessible.
 */
import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Eye,
  GraduationCap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  FileText,
  Lightbulb,
  Brain,
  FlaskConical,
  Quote,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import { getRoleConfig, getRoleBadgeClass, TIER_LABELS, getScoreTheme, ELEVATION_STRENGTH_BADGE } from '../insightTypes';
import { ParagraphText, CollapsibleText } from '../RichText';

// ============================================================================
// TYPES
// ============================================================================

interface OverviewTabProps {
  data: ActivityInsightData;
}

// ============================================================================
// SCORE HELPERS
// ============================================================================

function scoreColorClass(score: number): string {
  if (score >= 8.0) return 'text-green-500 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-500 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function scoreBorderClass(score: number): string {
  if (score >= 8.0) return 'border-l-green-500';
  if (score >= 6.0) return 'border-l-teal-500';
  if (score >= 4.0) return 'border-l-amber-500';
  return 'border-l-red-500';
}

function scoreBarGradient(score: number): string {
  if (score >= 8.0) return 'from-green-500 to-emerald-400';
  if (score >= 6.0) return 'from-teal-500 to-cyan-400';
  if (score >= 4.0) return 'from-amber-500 to-yellow-400';
  return 'from-red-500 to-rose-400';
}

/** Fitness-dashboard pill gradient — vibrant 2-color with matching glow */
function pillGradient(score: number): { from: string; to: string; glow: string } {
  if (score >= 8.0) return { from: '#34d399', to: '#14b8a6', glow: 'rgba(52,211,153,0.35)' };
  if (score >= 6.0) return { from: '#22d3ee', to: '#818cf8', glow: 'rgba(34,211,238,0.30)' };
  if (score >= 4.0) return { from: '#fbbf24', to: '#f97316', glow: 'rgba(251,191,36,0.30)' };
  if (score > 0)    return { from: '#fb7185', to: '#ef4444', glow: 'rgba(251,113,133,0.30)' };
  return { from: '#d1d5db', to: '#9ca3af', glow: 'rgba(209,213,219,0.10)' };
}

function scoreBgTint(score: number): string {
  if (score >= 8.0) return 'bg-green-500/[0.04] dark:bg-green-500/[0.06]';
  if (score >= 6.0) return 'bg-teal-500/[0.04] dark:bg-teal-500/[0.06]';
  if (score >= 4.0) return 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]';
  return 'bg-red-500/[0.04] dark:bg-red-500/[0.06]';
}

// ============================================================================
// SCORE BAR
// ============================================================================

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score / 10, 1) * 100;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${scoreBarGradient(score)} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ============================================================================
// SVG MINI RING (for score summary hero)
// ============================================================================

function MiniRing({ score, size = 40, strokeWidth = 3 }: { score: number; size?: number; strokeWidth?: number }) {
  const theme = getScoreTheme(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score / 10, 1));
  const isLarge = size >= 56;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          className="text-muted/15 dark:text-muted/10"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={theme.hex}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${isLarge ? 'text-lg' : 'text-xs'} font-bold tabular-nums leading-none ${theme.textClass}`}>
          {score.toFixed(1)}
        </span>
        <span className={`${isLarge ? 'text-[8px]' : 'text-[7px]'} text-muted-foreground/40 font-medium`}>/10</span>
      </div>
    </div>
  );
}

// ============================================================================
// CONTEXT BADGE
// ============================================================================

function ContextBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'green' | 'amber' }) {
  const cls =
    variant === 'green'
      ? 'bg-green-100/60 text-green-700 dark:bg-green-950/40 dark:text-green-300'
      : variant === 'amber'
        ? 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
        : 'bg-muted/50 text-muted-foreground/70';
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
      {children}
    </span>
  );
}

// (DimensionCard removed — scoring is now integrated into the hero card via tabs)

// ============================================================================
// TIER SCALE — visual college tier alignment
// ============================================================================

const TIER_COLLEGE_LABELS: Record<number, { label: string; schools: string }> = {
  4: { label: 'T4 Basic', schools: 'Participation level' },
  3: { label: 'T3 Solid', schools: 'School recognition' },
  2: { label: 'T2 Strong', schools: 'Regional / state level' },
  1: { label: 'T1 Elite', schools: 'National / international' },
};

function TierScale({ currentTier }: { currentTier: 1 | 2 | 3 | 4 }) {
  const tiers = [
    { level: 4, color: 'bg-red-400', activeColor: 'bg-red-500' },
    { level: 3, color: 'bg-amber-400', activeColor: 'bg-amber-500' },
    { level: 2, color: 'bg-teal-400', activeColor: 'bg-teal-500' },
    { level: 1, color: 'bg-green-400', activeColor: 'bg-green-500' },
  ] as const;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-0.5">
        {tiers.map((t) => {
          const active = t.level === currentTier;
          const info = TIER_COLLEGE_LABELS[t.level];
          return (
            <div key={t.level} className="flex-1 text-center">
              <div className={`h-2 rounded-sm ${active ? t.activeColor : t.color} ${active ? '' : 'opacity-20'} transition-opacity`} />
              <span className={`text-[9px] mt-0.5 block ${active ? 'font-semibold text-foreground/80' : 'text-muted-foreground/35'}`}>
                {info.label}
              </span>
              <span className={`text-[8px] block leading-tight ${active ? 'text-muted-foreground/55' : 'text-muted-foreground/20'}`}>
                {info.schools}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION HEADER — reusable
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      <h3 className="text-xs font-semibold text-foreground/80">{title}</h3>
      {badge && (
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground/50">
          {badge}
        </span>
      )}
    </div>
  );
}

// (DescriptionScoringSection removed — scoring is now integrated into the hero card via tabs)

// ============================================================================
// EXPANDABLE STRENGTH CARD — single coaching item with expand/collapse
// ============================================================================

function ExpandableStrengthCard({
  item,
  isOpen,
  onToggle,
}: {
  item: NonNullable<ActivityInsightData['strengthTeaching']>[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/15 bg-card/60 dark:bg-card/40 overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/15 transition-colors"
      >
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
        <span className="text-xs font-medium text-foreground/85 flex-1 min-w-0 leading-snug">
          {item.strength}
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Expanded coaching content */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-2.5 border-t border-border/10">
            {/* Why This Matters */}
            <div className="pt-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="h-2.5 w-2.5 text-emerald-500" />
                Why This Matters
              </p>
              <div className="border-l-2 border-emerald-500/30 pl-2.5 py-1">
                <CollapsibleText
                  text={item.whyItMatters}
                  previewParagraphs={2}
                  className="text-[11px] text-foreground/75 leading-relaxed"
                />
              </div>
            </div>

            {/* Admissions Psychology */}
            {item.psychology && (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Brain className="h-2.5 w-2.5 text-purple-500" />
                  Admissions Psychology
                </p>
                <div className="border-l-2 border-purple-500/20 pl-2.5 py-1">
                  <CollapsibleText
                    text={item.psychology}
                    previewParagraphs={2}
                    className="text-[11px] text-foreground/70"
                  />
                </div>
              </div>
            )}

            {/* Research Evidence */}
            {item.research && (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <FlaskConical className="h-2.5 w-2.5 text-blue-500" />
                  Research
                </p>
                <ParagraphText text={item.research} className="text-[11px] text-foreground/65 pl-2.5" />
              </div>
            )}

            {/* How to Leverage */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <BookOpen className="h-2.5 w-2.5 text-blue-500" />
                How to Leverage
              </p>
              <div className="bg-muted/15 rounded-md px-2.5 py-1.5">
                <ParagraphText text={item.howToLeverage} className="text-[11px] text-foreground/70" />
              </div>
            </div>

            {/* Expert Quote */}
            {item.quote && (
              <div className="flex gap-1.5 items-start">
                <Quote className="h-3 w-3 text-amber-500/60 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/55 italic leading-snug">
                  {item.quote}
                  {item.quoteSource && (
                    <span className="text-muted-foreground/45 not-italic"> — {item.quoteSource}</span>
                  )}
                </p>
              </div>
            )}

            {/* In Applications */}
            {item.inApplications && (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  In Your Applications
                </p>
                <CollapsibleText
                  text={item.inApplications}
                  previewParagraphs={2}
                  className="text-[11px] text-foreground/65 pl-2.5"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STRENGTHS & CELEBRATIONS SECTION — integrated overview subsection
// ============================================================================

function StrengthsCelebrationSection({ data }: { data: ActivityInsightData }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [storyFitOpen, setStoryFitOpen] = useState(false);

  const roleCfg = getRoleConfig(data.storyRole);
  const showEssayCallout = data.essayWorthiness === 'excellent' || data.essayWorthiness === 'good';

  const toggleStrength = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className="space-y-2">
      <SectionHeader icon={Sparkles} title="Strengths & Celebrations" />

      {/* Celebration headline */}
      {data.celebrationHeadline && (
        <div className="rounded-lg bg-emerald-50/30 dark:bg-emerald-950/15 border border-emerald-200/20 dark:border-emerald-800/15 px-3 py-2.5">
          <ParagraphText
            text={data.celebrationHeadline}
            className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed"
          />
        </div>
      )}

      {/* At-a-glance strength cards — click to expand for full coaching */}
      {data.strengthTeaching.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {data.strengthTeaching.length} strength{data.strengthTeaching.length !== 1 ? 's' : ''} identified — tap to explore
          </span>
          {data.strengthTeaching.map((item, i) => (
            <ExpandableStrengthCard
              key={`${item.strength}-${i}`}
              item={item}
              isOpen={expandedIndex === i}
              onToggle={() => toggleStrength(i)}
            />
          ))}
        </div>
      )}

      {/* Essay worthiness callout — compact inline */}
      {showEssayCallout && (
        <div className="rounded-lg bg-violet-50/40 dark:bg-violet-950/15 border border-violet-200/20 dark:border-violet-800/20 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">
              Essay-Worthy Activity
            </span>
          </div>
          {data.uniqueAngles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.uniqueAngles.map((angle, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100/60 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  {angle}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Essay angle */}
      {data.essayPotential && (
        <div className="rounded-lg bg-violet-50/30 dark:bg-violet-950/10 border border-violet-200/15 dark:border-violet-800/15 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3 w-3 text-violet-500" />
            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">Essay Angle</span>
          </div>
          <ParagraphText text={data.essayPotential.angle} className="text-[11px] text-foreground/70 leading-relaxed" />
          {data.essayPotential.cautionAreas.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {data.essayPotential.cautionAreas.map((area, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100/50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Story & Narrative Context */}
      {(data.narrativeGuidance || data.narrativeThreads.length > 0 || data.elevations.length > 0 || data.bestFitSchoolTypes.length > 0) && (
        <div className="rounded-xl bg-card/80 dark:bg-card/60 border border-border/15 overflow-hidden">
          <button
            type="button"
            onClick={() => setStoryFitOpen((p) => !p)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/15 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground/80 flex-1">Story & Narrative Context</span>
            {/* Quick-glance badges */}
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
              {roleCfg.label}
            </span>
            <span className="text-[9px] tabular-nums text-muted-foreground/50">{data.centralityScore}/100</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${storyFitOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: storyFitOpen ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-3 border-t border-border/10 pt-2.5">
                {/* Role + centrality bar */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
                    {roleCfg.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${roleCfg.accent}`}
                      style={{ width: `${data.centralityScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{data.centralityScore}/100</span>
                </div>

                {/* Narrative guidance */}
                {data.narrativeGuidance && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <ParagraphText
                        text={data.narrativeGuidance.howToTalkAboutThis}
                        className="text-[11px] text-foreground/70 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Narrative threads */}
                {data.narrativeThreads.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground">Narrative threads:</span>
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

                {/* Elevations */}
                {data.elevations.length > 0 && (
                  <div className="space-y-1.5">
                    {data.elevations.map((e, i) => (
                      <div key={i} className="rounded-lg border border-dashed p-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-[11px] font-medium">Elevated by {e.elevatingTitle}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              ELEVATION_STRENGTH_BADGE[e.strength] || ELEVATION_STRENGTH_BADGE.moderate
                            }`}
                          >
                            {e.strength}
                          </span>
                        </div>
                        <ParagraphText text={e.mechanism} className="text-[11px] text-muted-foreground/70 leading-relaxed" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Narrative Analysis — compact inline */}
                {(data.narrativeStorytelling || data.narrativeEmotionalResonance || data.narrativeGrowthArc) && (
                  <div className="rounded-lg bg-muted/15 divide-y divide-border/15">
                    {data.narrativeStorytelling && (
                      <div className="px-2.5 py-1.5 flex items-baseline gap-2">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0 w-20">Storytelling</span>
                        <span className="text-[11px] text-foreground/70 leading-snug">{data.narrativeStorytelling}</span>
                      </div>
                    )}
                    {data.narrativeEmotionalResonance && (
                      <div className="px-2.5 py-1.5 flex items-baseline gap-2">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0 w-20">Emotional</span>
                        <span className="text-[11px] text-foreground/70 leading-snug">{data.narrativeEmotionalResonance}</span>
                      </div>
                    )}
                    {data.narrativeGrowthArc && (
                      <div className="px-2.5 py-1.5 flex items-baseline gap-2">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0 w-20">Growth Arc</span>
                        <span className="text-[11px] text-foreground/70 leading-snug">{data.narrativeGrowthArc}</span>
                      </div>
                    )}
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
                    {(data.schoolFitAlignedValues?.length > 0 || data.schoolFitConcerns?.length > 0) && (
                      <div className="mt-1.5 space-y-1.5">
                        {data.schoolFitAlignedValues?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] font-medium text-green-600 dark:text-green-400 self-center mr-0.5">Values:</span>
                            {data.schoolFitAlignedValues.map((v, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100/60 text-green-700 dark:bg-green-950/40 dark:text-green-300">{v}</span>
                            ))}
                          </div>
                        )}
                        {data.schoolFitConcerns?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 self-center mr-0.5">Concerns:</span>
                            {data.schoolFitConcerns.map((c, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100/60 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function OverviewTabInner({ data }: OverviewTabProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const hasDeepContent = data.teachingDepth !== 'quick';
  const tierLabel = TIER_LABELS[data.tier] || 'T4 Basic';

  // Integrated scoring: tab selection + focused dimension
  const [scoringTab, setScoringTab] = useState<'activity' | 'description'>('activity');
  const [focusedDim, setFocusedDim] = useState<number | null>(null);
  const handleDimClick = useCallback((idx: number) => {
    setFocusedDim((prev) => (prev === idx ? null : idx));
  }, []);
  const handleTabSwitch = useCallback((tab: 'activity' | 'description') => {
    setScoringTab(tab);
    setFocusedDim(null);
  }, []);

  // ── Activity dimension data ──
  const activityDimensions = hasDeepContent
    ? [
        {
          label: 'Tier Assessment',
          score: data.activityScore.breakdown.tierAssessment.score,
          weight: data.activityScore.breakdown.tierAssessment.weight,
          rationale: data.activityScoreRationales?.tierAssessment.rationale ?? null,
          badges: data.activityScoreRationales?.tierAssessment.tier != null ? (
            <ContextBadge>Tier {data.activityScoreRationales.tierAssessment.tier}</ContextBadge>
          ) : null,
        },
        {
          label: 'Recognition',
          score: data.activityScore.breakdown.recognitionLevel.score,
          weight: data.activityScore.breakdown.recognitionLevel.weight,
          rationale: data.activityScoreRationales?.recognitionLevel.rationale ?? null,
          badges: data.activityScoreRationales?.recognitionLevel.level ? (
            <ContextBadge>{data.activityScoreRationales.recognitionLevel.level}</ContextBadge>
          ) : null,
        },
        {
          label: 'Leadership/Impact',
          score: data.activityScore.breakdown.leadershipImpact.score,
          weight: data.activityScore.breakdown.leadershipImpact.weight,
          rationale: data.activityScoreRationales?.leadershipImpact.rationale ?? null,
          badges: data.activityScoreRationales?.leadershipImpact ? (
            <>
              {data.activityScoreRationales.leadershipImpact.role && (
                <ContextBadge>{data.activityScoreRationales.leadershipImpact.role}</ContextBadge>
              )}
              {data.activityScoreRationales.leadershipImpact.impactScope && (
                <ContextBadge>{data.activityScoreRationales.leadershipImpact.impactScope}</ContextBadge>
              )}
              {!data.activityScoreRationales.leadershipImpact.isApplicable && (
                <ContextBadge variant="amber">N/A for this activity</ContextBadge>
              )}
            </>
          ) : null,
        },
        {
          label: 'Community/Character',
          score: data.activityScore.breakdown.communityCharacter.score,
          weight: data.activityScore.breakdown.communityCharacter.weight,
          rationale: data.activityScoreRationales?.communityCharacter.rationale ?? null,
          badges: data.activityScoreRationales?.communityCharacter ? (
            <>
              {data.activityScoreRationales.communityCharacter.primaryTrait && (
                <ContextBadge>{data.activityScoreRationales.communityCharacter.primaryTrait}</ContextBadge>
              )}
              {data.activityScoreRationales.communityCharacter.authenticitySignal && (
                <ContextBadge variant="green">
                  {data.activityScoreRationales.communityCharacter.authenticitySignal.replace(/_/g, ' ')}
                </ContextBadge>
              )}
            </>
          ) : null,
        },
        {
          label: 'Commitment',
          score: data.activityScore.breakdown.commitmentProgression.score,
          weight: data.activityScore.breakdown.commitmentProgression.weight,
          rationale: data.activityScoreRationales?.commitmentProgression.rationale ?? null,
          badges: data.activityScoreRationales?.commitmentProgression ? (
            <>
              <ContextBadge>
                {data.activityScoreRationales.commitmentProgression.years} year
                {data.activityScoreRationales.commitmentProgression.years !== 1 ? 's' : ''}
              </ContextBadge>
              <ContextBadge
                variant={data.activityScoreRationales.commitmentProgression.showsProgression ? 'green' : 'amber'}
              >
                {data.activityScoreRationales.commitmentProgression.showsProgression
                  ? 'Shows progression'
                  : 'Limited progression'}
              </ContextBadge>
            </>
          ) : null,
        },
      ]
    : [];

  // ── Description dimension data ──
  const descriptionDimensions = hasDeepContent
    ? [
        { label: 'Role Ownership', score: data.descriptionScore.breakdown.specificity.score, weight: data.descriptionScore.breakdown.specificity.weight, rationale: data.descriptionScoreRationales?.specificity.rationale ?? null },
        { label: 'Evidence of Impact', score: data.descriptionScore.breakdown.impactClarity.score, weight: data.descriptionScore.breakdown.impactClarity.weight, rationale: data.descriptionScoreRationales?.impactClarity.rationale ?? null },
        { label: 'Differentiation', score: data.descriptionScore.breakdown.authenticityVoice.score, weight: data.descriptionScore.breakdown.authenticityVoice.weight, rationale: data.descriptionScoreRationales?.authenticityVoice.rationale ?? null },
        { label: 'Action Precision', score: data.descriptionScore.breakdown.actionLanguage.score, weight: data.descriptionScore.breakdown.actionLanguage.weight, rationale: data.descriptionScoreRationales?.actionLanguage.rationale ?? null },
        { label: 'Quantification', score: data.descriptionScore.breakdown.quantification.score, weight: data.descriptionScore.breakdown.quantification.weight, rationale: data.descriptionScoreRationales?.quantification.rationale ?? null },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1: SCORE SUMMARY
          ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-card/80 dark:bg-card/60 border border-border/15 p-4">
        <div className="flex items-start gap-4">
          {/* Combined score ring */}
          <div className="flex flex-col items-center flex-shrink-0">
            <MiniRing score={data.combinedScore} size={68} strokeWidth={4.5} />
            <span className="text-[8px] font-medium text-muted-foreground/45 mt-0.5">Combined</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Activity / Description — clickable scoring tabs */}
            <div className="flex items-center gap-0.5 mb-2">
              <button
                type="button"
                onClick={() => handleTabSwitch('activity')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  scoringTab === 'activity'
                    ? 'bg-foreground/[0.06] dark:bg-foreground/[0.1] text-foreground'
                    : 'text-muted-foreground/45 hover:text-muted-foreground/70 hover:bg-muted/15'
                }`}
              >
                <span className="text-[10px] font-medium">Activity</span>
                <span className={`text-sm font-bold tabular-nums ${scoreColorClass(data.activityScore.total)}`}>
                  {data.activityScore.total.toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-foreground/30">70%</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('description')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  scoringTab === 'description'
                    ? 'bg-foreground/[0.06] dark:bg-foreground/[0.1] text-foreground'
                    : 'text-muted-foreground/45 hover:text-muted-foreground/70 hover:bg-muted/15'
                }`}
              >
                <span className="text-[10px] font-medium">Description</span>
                <span className={`text-sm font-bold tabular-nums ${scoreColorClass(data.descriptionScore.total)}`}>
                  {data.descriptionScore.total.toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-foreground/30">30%</span>
              </button>
            </div>

            {/* Combined score rationale */}
            {data.combinedScoreRationale && (
              <p className="text-[11px] text-foreground/55 leading-snug mb-2">
                {data.combinedScoreRationale}
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tierLabel}
              </span>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getRoleBadgeClass(data.storyRole)}`}>
                {roleCfg.label}
              </span>
              <span className="text-[9px] text-muted-foreground/50">
                {data.totalHours.toLocaleString()}h total
              </span>
            </div>
          </div>
        </div>

        {/* Story essence + officer one-liner */}
        {(data.storyEssence || data.summaryOneLiner) && (
          <div className="mt-3 rounded-lg bg-muted/15 border-l-3 border-l-indigo-400/50 px-3 py-2 space-y-0.5">
            {data.storyEssence && (
              <p className="text-[11px] text-foreground/55 italic leading-snug">
                {data.storyEssence}
              </p>
            )}
            {data.summaryOneLiner && (
              <p className="text-[11px] text-muted-foreground/50 leading-snug flex items-start gap-1.5">
                <Eye className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-40" />
                Officers see: &ldquo;{data.summaryOneLiner}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* ── Scoring breakdown — fitness-dashboard pill bars ── */}
        {hasDeepContent && (() => {
          const activeDims: Array<{ label: string; score: number; weight?: number; rationale: string | null; badges?: React.ReactNode }> =
            scoringTab === 'activity' ? activityDimensions : descriptionDimensions;

          if (activeDims.length === 0) return null;

          return (
            <div className="mt-3 pt-3 border-t border-border/10 space-y-3">
              {activeDims.map((dim, idx) => {
                const pct = Math.min(dim.score / 10, 1) * 100;
                const isOpen = focusedDim === idx;
                const hasContent = dim.rationale || dim.badges;
                const grad = pillGradient(dim.score);

                return (
                  <div key={dim.label}>
                    {/* Label + score above bar */}
                    <button
                      type="button"
                      onClick={() => handleDimClick(idx)}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-baseline justify-between mb-1 px-0.5">
                        <span className="text-[11px] font-bold text-foreground/75 tracking-tight group-hover:text-foreground/90 transition-colors">
                          {dim.label}
                        </span>
                        <span className={`text-xs font-extrabold tabular-nums ${scoreColorClass(dim.score)}`}>
                          {dim.score.toFixed(1)}<span className="text-[9px] font-semibold text-muted-foreground/40">/10</span>
                        </span>
                      </div>

                      {/* Pill track — sunken vessel with liquid fill */}
                      <div
                        className={`w-full h-[14px] rounded-[999px] relative p-[2.5px] transition-transform duration-150 ${
                          isOpen ? '' : 'group-hover:scale-[1.005]'
                        }`}
                        style={{
                          background: '#f0f0f0',
                          boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.7)',
                        }}
                      >
                        {/* Liquid fill — grows from left on load */}
                        <div
                          className="h-full rounded-[999px] transition-[width] duration-1000 ease-out"
                          style={{
                            width: `${Math.max(pct, dim.score > 0 ? 5 : 0)}%`,
                            background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                            boxShadow: `0 0 10px ${grad.glow}, 0 0 4px ${grad.glow}`,
                          }}
                        />
                      </div>
                    </button>

                    {/* Rationale drawer — slide + fade */}
                    {hasContent && (
                      <div
                        className="grid transition-[grid-template-rows] duration-250 ease-out"
                        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`mt-1.5 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-border/10 transition-opacity duration-250 ${
                              isOpen ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            {dim.badges && <div className="flex flex-wrap gap-1 mb-2">{dim.badges}</div>}
                            {dim.rationale && (
                              <ParagraphText text={dim.rationale} className="text-[11px] text-foreground/70 leading-relaxed" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2: STRENGTHS & CELEBRATIONS
          ════════════════════════════════════════════════════════════════════ */}
      {hasDeepContent && (data.strengthTeaching.length > 0 || data.celebrationHeadline) && (
        <StrengthsCelebrationSection data={data} />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5: COLLEGE POSITIONING
          ════════════════════════════════════════════════════════════════════ */}
      {data.tierExplanation && (
        <div className="rounded-xl bg-card/80 dark:bg-card/60 border border-border/15 p-4">
          <SectionHeader icon={GraduationCap} title="College Positioning" />

          {/* Tier scale visualization */}
          <TierScale currentTier={data.tier} />

          {/* Tier explanation */}
          {data.tierExplanation.explanation && (
            <ParagraphText
              text={data.tierExplanation.explanation}
              className="text-[11px] text-foreground/65 leading-relaxed mt-3"
            />
          )}

          {/* Tier justification */}
          {data.tierJustification && (
            <div className="mt-2">
              <ParagraphText
                text={data.tierJustification}
                className="text-[11px] text-foreground/60 leading-relaxed"
              />
            </div>
          )}

          {/* Comparison benchmarks */}
          {data.comparisonBenchmarks && (
            <div className="mt-3 space-y-1.5 rounded-lg bg-muted/10 p-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                How You Compare
              </span>
              <div className="space-y-1">
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="text-muted-foreground/50 w-14 flex-shrink-0 text-right">Similar:</span>
                  <span className="text-foreground/60">{data.comparisonBenchmarks.similarTo}</span>
                </div>
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="text-green-600/70 dark:text-green-400/70 w-14 flex-shrink-0 text-right">Above:</span>
                  <span className="text-foreground/60">{data.comparisonBenchmarks.above}</span>
                </div>
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="text-amber-600/70 dark:text-amber-400/70 w-14 flex-shrink-0 text-right">Below:</span>
                  <span className="text-foreground/60">{data.comparisonBenchmarks.below}</span>
                </div>
              </div>
            </div>
          )}

          {/* What makes this tier */}
          {data.tierExplanation.whatMakesThisTier && (
            <div className="mt-3">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                What Places You Here
              </span>
              <ParagraphText
                text={data.tierExplanation.whatMakesThisTier}
                className="text-[11px] text-foreground/60 leading-relaxed mt-0.5"
              />
            </div>
          )}

          {/* How to move up */}
          {data.tierExplanation.whatWouldChangeIt && (
            <div className="mt-3 rounded-lg bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-200/20 dark:border-indigo-800/20 p-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600/70 dark:text-indigo-400/70">
                How to Level Up
              </span>
              <ParagraphText
                text={data.tierExplanation.whatWouldChangeIt}
                className="text-[11px] text-foreground/65 leading-relaxed mt-1"
              />
            </div>
          )}

          {/* Benchmarks checklist */}
          {data.tierExplanation.benchmarks.length > 0 && (
            <div className="mt-3">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Benchmarks
              </span>
              <div className="space-y-1 mt-1.5">
                {data.tierExplanation.benchmarks.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span
                      className={`mt-1 flex-shrink-0 h-2 w-2 rounded-full ${
                        b.studentMeets ? 'bg-green-500' : 'bg-muted-foreground/25'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-muted-foreground/50">T{b.tier}:</span>{' '}
                      <span className="text-foreground/65">{b.benchmark}</span>
                      {b.gap && (
                        <span className="text-amber-600/60 dark:text-amber-400/60 ml-1">
                          — {b.gap}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 6: KEY SIGNALS — green/red flags
          ════════════════════════════════════════════════════════════════════ */}
      {(data.greenFlags.length > 0 || data.redFlags.length > 0) && (
        <div className="space-y-2">
          {/* Green flags */}
          {data.greenFlags.length > 0 && (
            <div className="rounded-lg border border-green-200/20 dark:border-green-800/15 bg-green-50/10 dark:bg-green-950/8 p-3">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-green-600/70 dark:text-green-400/70 flex items-center gap-1 mb-2">
                <CheckCircle className="h-3 w-3" />
                Positive Signals ({data.greenFlags.length})
              </span>
              <div className="space-y-1.5">
                {data.greenFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-green-700/80 dark:text-green-300/80">{flag.flag}</p>
                      {flag.admissionsValue && (
                        <p className="text-[10px] text-foreground/45 leading-snug mt-0.5">{flag.admissionsValue}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red flags */}
          {data.redFlags.length > 0 && (
            <div className="rounded-lg border border-red-200/20 dark:border-red-800/15 bg-red-50/10 dark:bg-red-950/8 p-3">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-red-600/70 dark:text-red-400/70 flex items-center gap-1 mb-2">
                <AlertTriangle className="h-3 w-3" />
                Red Flags ({data.redFlags.length})
              </span>
              <div className="space-y-1.5">
                {data.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-red-700/80 dark:text-red-300/80">{flag.flag}</p>
                      {flag.implication && (
                        <p className="text-[10px] text-foreground/45 leading-snug mt-0.5">{flag.implication}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick-analysis fallback for non-deep activities ── */}
      {!hasDeepContent && (
        <div className="rounded-lg border p-4 text-center">
          <Sparkles className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Run a full analysis to see the detailed scoring rubric and college positioning.
          </p>
          {data.quickCelebration && (
            <p className="text-xs text-foreground/60 mt-2">{data.quickCelebration}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** @deprecated Use OverviewTab — CelebrationTab is kept for backward compatibility */
export const CelebrationTab = React.memo(OverviewTabInner);
export const OverviewTab = React.memo(OverviewTabInner);
