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
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
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
  Info,
} from 'lucide-react';
import type { ActivityInsightData } from '../insightTypes';
import { getRoleConfig, getRoleBadgeClass, ELEVATION_STRENGTH_BADGE } from '../insightTypes';
import { TierHoverCard } from '../AdmissionsContextCards';
import { ParagraphText, CollapsibleText } from '../RichText';
import { ActivityScoreDashboard } from '@/components/activity-scoring/ActivityScoreDashboard';

// ============================================================================
// TYPES
// ============================================================================

interface OverviewTabProps {
  data: ActivityInsightData;
}

// ============================================================================
// TIER SCALE — visual college tier alignment
// ============================================================================

const TIER_COLLEGE_LABELS: Record<number, {
  label: string;
  schools: string;
  definition: string;
  percentile: string;
  examples: string;
  source: string;
}> = {
  4: {
    label: 'T4 Basic',
    schools: 'Participation level',
    definition: 'Participation without distinction — club membership, occasional volunteering, one-time events.',
    percentile: '~70% of applicants\' activities fall here',
    examples: 'Member of Spanish Club, participated in cultural events',
    source: 'Sara Harberson 4-Tier Framework',
  },
  3: {
    label: 'T3 Solid',
    schools: 'School recognition',
    definition: 'School-level distinction with meaningful commitment — leadership roles, school awards, multi-year growth.',
    percentile: '~5–10% of students at competitive schools',
    examples: 'Club president, team captain, school award winner with 2+ year commitment',
    source: 'Sara Harberson 4-Tier Framework',
  },
  2: {
    label: 'T2 Strong',
    schools: 'Regional / state level',
    definition: 'Significant achievement or leadership requiring sustained commitment with measurable impact beyond the immediate school community.',
    percentile: 'Top 0.5–1% of their state',
    examples: 'State competition winner, founded org reaching 100+ people, regional awards',
    source: 'Sara Harberson 4-Tier Framework',
  },
  1: {
    label: 'T1 Elite',
    schools: 'National / international',
    definition: 'National or international distinction — the rarest level of achievement among high school students.',
    percentile: '<1% of applicants (~0.017% for top competitions)',
    examples: 'USAMO/USACO qualifier, Regeneron finalist, published peer-reviewed research, D1 recruit',
    source: 'Sara Harberson 4-Tier Framework',
  },
};

function TierPopover({
  tier,
  isActive,
  onClose,
}: {
  tier: typeof TIER_COLLEGE_LABELS[number];
  isActive: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full mt-1.5 left-1/2 -translate-x-1/2 w-56 rounded-lg bg-popover border border-border/30 shadow-lg p-2.5 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground/80">{tier.label}</span>
          {isActive && (
            <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 rounded px-1.5 py-0.5">
              You are here
            </span>
          )}
        </div>
        <p className="text-[10px] text-foreground/65 leading-relaxed">{tier.definition}</p>
        <div className="border-t border-border/10 pt-1.5 space-y-1">
          <div className="flex items-start gap-1.5 text-[10px]">
            <span className="text-muted-foreground/50 flex-shrink-0 w-12">Approx.</span>
            <span className="text-foreground/60">{tier.percentile}</span>
          </div>
          <div className="flex items-start gap-1.5 text-[10px]">
            <span className="text-muted-foreground/50 flex-shrink-0 w-12">Example</span>
            <span className="text-foreground/60 italic">{tier.examples}</span>
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground/35 pt-0.5">{tier.source}</p>
      </div>
    </div>
  );
}

function TierScale({ currentTier }: { currentTier: 1 | 2 | 3 | 4 }) {
  const [openTier, setOpenTier] = useState<number | null>(null);

  const tiers = [
    { level: 4, color: 'bg-red-400', activeColor: 'bg-red-500' },
    { level: 3, color: 'bg-amber-400', activeColor: 'bg-amber-500' },
    { level: 2, color: 'bg-teal-400', activeColor: 'bg-teal-500' },
    { level: 1, color: 'bg-green-400', activeColor: 'bg-green-500' },
  ] as const;

  const handleToggle = useCallback((level: number) => {
    setOpenTier(prev => (prev === level ? null : level));
  }, []);

  const handleClose = useCallback(() => setOpenTier(null), []);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-0.5">
        {tiers.map((t) => {
          const active = t.level === currentTier;
          const info = TIER_COLLEGE_LABELS[t.level];
          return (
            <div key={t.level} className="flex-1 text-center relative">
              <button
                type="button"
                onClick={() => handleToggle(t.level)}
                className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded group"
              >
                <div className={`h-2 rounded-sm ${active ? t.activeColor : t.color} ${active ? '' : 'opacity-20'} transition-opacity group-hover:opacity-60`} />
                <TierHoverCard tier={t.level}>
                  <span className={`text-[9px] mt-0.5 block cursor-help ${active ? 'font-semibold text-foreground/80' : 'text-muted-foreground/35'} group-hover:text-foreground/60`}>
                    {info.label}
                  </span>
                </TierHoverCard>
                <span className={`text-[8px] block leading-tight ${active ? 'text-muted-foreground/55' : 'text-muted-foreground/20'}`}>
                  {info.schools}
                </span>
              </button>
              {openTier === t.level && (
                <TierPopover
                  tier={info}
                  isActive={active}
                  onClose={handleClose}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[8px] text-muted-foreground/30 flex items-center gap-0.5 justify-center">
        <Info className="h-2.5 w-2.5" />
        Tap any tier to learn more
      </p>
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
  const hasDeepContent = data.teachingDepth !== 'quick';

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1: SCORE SUMMARY — Bento dashboard with dual-column breakdown
          ════════════════════════════════════════════════════════════════════ */}
      {hasDeepContent && <ActivityScoreDashboard data={data} />}

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

          {/* Tier scale visualization — tap any tier for definitions */}
          <TierScale currentTier={data.tier} />

          {/* Personalized tier explanation — why THIS activity earns its tier */}
          {data.tierExplanation.explanation && (
            <ParagraphText
              text={data.tierExplanation.explanation}
              className="text-[11px] text-foreground/65 leading-relaxed mt-3"
            />
          )}

          {/* Comparison benchmarks — personalized per activity */}
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

          {/* "How to Level Up" now lives in the Upgrade Pathway section (Next Steps tab)
              with deeper, step-by-step guidance including feasibility, milestones, and timelines */}

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
