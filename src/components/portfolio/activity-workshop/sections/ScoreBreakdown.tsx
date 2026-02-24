/**
 * ScoreBreakdown — Unified single-card score visualization.
 *
 * Design: Combined score hero + toggleable Activity/Description breakdowns
 * with expandable metric rationales. CSS grid 0fr→1fr transitions for smooth animations.
 *
 * States:
 * 1. Default — Combined score ring + two mini-rings + metric bars
 * 2. Metric Expanded — Other metrics collapse, selected expands with rationale
 * 3. Toggle — Crossfade between Activity Quality / Description Quality
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronDown, Info } from 'lucide-react';
import { ParagraphText } from '../RichText';

// ============================================================================
// PROPS
// ============================================================================

export interface ScoreBreakdownProps {
  activityScore: {
    total: number;
    breakdown: {
      tierAssessment: { score: number; weight: number };
      recognitionLevel: { score: number; weight: number };
      commitmentProgression: { score: number; weight: number };
      communityCharacter: { score: number; weight: number };
      leadershipImpact: { score: number; weight: number };
    };
  };
  descriptionScore: {
    total: number;
    breakdown: {
      specificity: { score: number; weight: number };
      impactClarity: { score: number; weight: number };
      authenticityVoice: { score: number; weight: number };
      actionLanguage: { score: number; weight: number };
      quantification: { score: number; weight: number };
    };
  };
  combinedScore: number;
  accentColor: string;
  activityScoreRationales: {
    tierAssessment: { rationale: string; tier: number };
    recognitionLevel: { rationale: string; level: string };
    leadershipImpact: { rationale: string; isApplicable: boolean; role: string; impactScope: string };
    communityCharacter: { rationale: string; primaryTrait: string; authenticitySignal: string };
    commitmentProgression: { rationale: string; years: number; showsProgression: boolean };
  } | null;
  descriptionScoreRationales: {
    specificity: { rationale: string };
    impactClarity: { rationale: string };
    authenticityVoice: { rationale: string };
    actionLanguage: { rationale: string };
    quantification: { rationale: string };
  } | null;
  tierExplanation: {
    explanation: string;
    whatMakesThisTier: string;
    whatWouldChangeIt: string;
    benchmarks: Array<{
      tier: number;
      benchmark: string;
      source: string;
      studentMeets: boolean;
      gap?: string;
      evidence?: string;
    }>;
  } | null;
  activityOverallRationale: string;
  descriptionOverallRationale: string;
  combinedScoreRationale: string;
}

// ============================================================================
// SCORE COLOR SYSTEM
// ============================================================================

interface ScoreTheme {
  hex: string;
  textClass: string;
  barClass: string;
  bgTint: string;
}

function getScoreTheme(score: number): ScoreTheme {
  if (score >= 8.0) return {
    hex: '#22c55e',
    textClass: 'text-green-500 dark:text-green-400',
    barClass: 'bg-gradient-to-r from-green-500 to-emerald-400',
    bgTint: 'bg-green-500/8 dark:bg-green-500/15',
  };
  if (score >= 6.0) return {
    hex: '#14b8a6',
    textClass: 'text-teal-500 dark:text-teal-400',
    barClass: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    bgTint: 'bg-teal-500/8 dark:bg-teal-500/15',
  };
  if (score >= 4.0) return {
    hex: '#f59e0b',
    textClass: 'text-amber-500 dark:text-amber-400',
    barClass: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    bgTint: 'bg-amber-500/8 dark:bg-amber-500/15',
  };
  return {
    hex: '#ef4444',
    textClass: 'text-red-500 dark:text-red-400',
    barClass: 'bg-gradient-to-r from-red-500 to-rose-400',
    bgTint: 'bg-red-500/8 dark:bg-red-500/15',
  };
}

// ============================================================================
// SVG RING — stroke-dasharray arc with transition
// ============================================================================

function SvgRing({
  score,
  size,
  strokeWidth = 4,
  showLabel = true,
}: {
  score: number;
  size: number;
  strokeWidth?: number;
  showLabel?: boolean;
}) {
  const theme = getScoreTheme(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isLarge = size >= 64;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20 dark:text-muted/10"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.hex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${isLarge ? 'text-xl' : 'text-sm'} font-bold tabular-nums leading-none ${theme.textClass}`}>
            {score.toFixed(1)}
          </span>
          <span className={`${isLarge ? 'text-[9px]' : 'text-[7px]'} text-muted-foreground/50 font-medium`}>/10</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// METRIC ROW — compact bar with click-to-expand
// ============================================================================

interface MetricDef {
  key: string;
  label: string;
  score: number;
  weight?: number;
}

function MetricChip({
  metric,
  isExpanded,
  onClick,
  rationale,
  extraContext,
}: {
  metric: MetricDef;
  isExpanded: boolean;
  onClick: () => void;
  rationale: string | null;
  extraContext: React.ReactNode;
}) {
  const theme = getScoreTheme(metric.score);

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={[
          'w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-left',
          'transition-colors duration-150',
          'hover:bg-muted/40 dark:hover:bg-muted/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isExpanded ? 'bg-muted/30 dark:bg-muted/15 ring-1 ring-border/20' : '',
        ].join(' ')}
      >
        <span className="text-[11px] text-muted-foreground truncate">
          {metric.label}
          {metric.weight !== undefined && (
            <span className="text-muted-foreground/30 ml-0.5 text-[9px]">
              {(metric.weight * 100).toFixed(0)}%
            </span>
          )}
        </span>
        <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${theme.textClass}`}>
          {metric.score.toFixed(1)}
        </span>
      </button>

      {/* Expanded rationale */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-1.5 pb-1 px-2.5 space-y-1.5">
            {rationale && (
              <ParagraphText text={rationale} className="text-[11px] text-muted-foreground/80 leading-relaxed" />
            )}
            {extraContext}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TIER EXPLANATION SECTION
// ============================================================================

function TierSection({
  tierExplanation,
}: {
  tierExplanation: NonNullable<ScoreBreakdownProps['tierExplanation']>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/10 pt-2 mt-1">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={[
          'flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/70',
          'hover:text-foreground/80 transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5 -mx-1',
        ].join(' ')}
      >
        <Info className="h-3 w-3" />
        <span>Why this tier?</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-2 space-y-2">
            <ParagraphText text={tierExplanation.explanation} className="text-xs text-muted-foreground/90 leading-relaxed" />

            {tierExplanation.whatMakesThisTier && (
              <div>
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">What makes this tier</span>
                <ParagraphText text={tierExplanation.whatMakesThisTier} className="text-xs text-muted-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}

            {tierExplanation.whatWouldChangeIt && (
              <div>
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">What would change it</span>
                <ParagraphText text={tierExplanation.whatWouldChangeIt} className="text-xs text-muted-foreground/80 leading-relaxed mt-0.5" />
              </div>
            )}

            {tierExplanation.benchmarks.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Benchmarks</span>
                {tierExplanation.benchmarks.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <span className={`mt-0.5 flex-shrink-0 ${b.studentMeets ? 'text-green-500' : 'text-muted-foreground/40'}`}>
                      {b.studentMeets ? '✓' : '○'}
                    </span>
                    <span className="text-muted-foreground/80">{b.benchmark}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

type ActiveTab = 'activity' | 'description';

function ScoreBreakdownInner({
  activityScore,
  descriptionScore,
  combinedScore,
  activityScoreRationales = null,
  descriptionScoreRationales = null,
  tierExplanation = null,
  activityOverallRationale = '',
  descriptionOverallRationale = '',
  combinedScoreRationale = '',
}: ScoreBreakdownProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('activity');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const hasExpanded = expandedMetric !== null;

  const handleMetricClick = useCallback((key: string) => {
    setExpandedMetric(prev => (prev === key ? null : key));
  }, []);

  const handleBackToAll = useCallback(() => {
    setExpandedMetric(null);
  }, []);

  const handleTabSwitch = useCallback((tab: ActiveTab) => {
    setExpandedMetric(null);
    setActiveTab(tab);
  }, []);

  // -- Build metric lists --
  const activityMetrics: MetricDef[] = [
    { key: 'tierAssessment', label: 'Tier Assessment', score: activityScore.breakdown.tierAssessment.score, weight: activityScore.breakdown.tierAssessment.weight },
    { key: 'recognitionLevel', label: 'Recognition', score: activityScore.breakdown.recognitionLevel.score, weight: activityScore.breakdown.recognitionLevel.weight },
    { key: 'commitmentProgression', label: 'Commitment', score: activityScore.breakdown.commitmentProgression.score, weight: activityScore.breakdown.commitmentProgression.weight },
    { key: 'communityCharacter', label: 'Community/Character', score: activityScore.breakdown.communityCharacter.score, weight: activityScore.breakdown.communityCharacter.weight },
    { key: 'leadershipImpact', label: 'Leadership/Impact', score: activityScore.breakdown.leadershipImpact.score, weight: activityScore.breakdown.leadershipImpact.weight },
  ];

  const descriptionMetrics: MetricDef[] = [
    { key: 'specificity', label: 'Role Ownership', score: descriptionScore.breakdown.specificity.score, weight: descriptionScore.breakdown.specificity.weight },
    { key: 'impactClarity', label: 'Evidence of Impact', score: descriptionScore.breakdown.impactClarity.score, weight: descriptionScore.breakdown.impactClarity.weight },
    { key: 'authenticityVoice', label: 'Differentiation', score: descriptionScore.breakdown.authenticityVoice.score, weight: descriptionScore.breakdown.authenticityVoice.weight },
    { key: 'actionLanguage', label: 'Action Precision', score: descriptionScore.breakdown.actionLanguage.score, weight: descriptionScore.breakdown.actionLanguage.weight },
    { key: 'quantification', label: 'Quantification', score: descriptionScore.breakdown.quantification.score, weight: descriptionScore.breakdown.quantification.weight },
  ];

  const currentMetrics = activeTab === 'activity' ? activityMetrics : descriptionMetrics;

  // -- Rationale helpers --
  function getActivityRationale(key: string): string | null {
    if (!activityScoreRationales) return null;
    const entry = activityScoreRationales[key as keyof typeof activityScoreRationales];
    return entry?.rationale ?? null;
  }

  function getDescriptionRationale(key: string): string | null {
    if (!descriptionScoreRationales) return null;
    const entry = descriptionScoreRationales[key as keyof typeof descriptionScoreRationales];
    return entry?.rationale ?? null;
  }

  function getActivityExtraContext(key: string): React.ReactNode {
    if (!activityScoreRationales) return null;
    switch (key) {
      case 'tierAssessment': {
        const d = activityScoreRationales.tierAssessment;
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
            Tier {d.tier}
          </span>
        );
      }
      case 'recognitionLevel': {
        const d = activityScoreRationales.recognitionLevel;
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
            Level: {d.level}
          </span>
        );
      }
      case 'leadershipImpact': {
        const d = activityScoreRationales.leadershipImpact;
        return (
          <div className="flex flex-wrap gap-1">
            {d.role && (
              <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
                Role: {d.role}
              </span>
            )}
            {d.impactScope && (
              <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
                Scope: {d.impactScope}
              </span>
            )}
          </div>
        );
      }
      case 'communityCharacter': {
        const d = activityScoreRationales.communityCharacter;
        return (
          <div className="flex flex-wrap gap-1">
            {d.primaryTrait && (
              <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
                Trait: {d.primaryTrait}
              </span>
            )}
            {d.authenticitySignal && (
              <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
                Signal: {d.authenticitySignal}
              </span>
            )}
          </div>
        );
      }
      case 'commitmentProgression': {
        const d = activityScoreRationales.commitmentProgression;
        return (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted/30 rounded px-1.5 py-0.5">
              {d.years} year{d.years !== 1 ? 's' : ''}
            </span>
            <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${
              d.showsProgression
                ? 'text-green-600/70 dark:text-green-400/70 bg-green-500/10'
                : 'text-muted-foreground/60 bg-muted/30'
            }`}>
              {d.showsProgression ? 'Shows progression' : 'Limited progression'}
            </span>
          </div>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="rounded-xl bg-card/80 dark:bg-card/60 border border-border/15 overflow-hidden">
      {/* ── Score header: combined + activity/description toggles — single compact row ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-3">
          {/* Combined score — compact */}
          <div className="flex-shrink-0">
            <SvgRing score={combinedScore} size={56} strokeWidth={4} />
          </div>

          {/* Right side: toggle chips */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
              Combined Score
            </p>
            <div className="flex items-center gap-2">
              {(['activity', 'description'] as const).map((tab) => {
                const s = tab === 'activity' ? activityScore.total : descriptionScore.total;
                const theme = getScoreTheme(s);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabSwitch(tab)}
                    className={[
                      'flex items-center gap-1.5 rounded-md px-2 py-1 transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive ? 'bg-muted/50 dark:bg-muted/25' : 'opacity-45 hover:opacity-75',
                    ].join(' ')}
                  >
                    <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                      {tab === 'activity' ? 'Activity' : 'Description'}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${theme.textClass}`}>
                      {s.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Combined score rationale — single line */}
        {combinedScoreRationale && (
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 leading-snug line-clamp-2">
            {combinedScoreRationale}
          </p>
        )}
      </div>

      {/* ── Metric breakdown — compact grid ── */}
      <div className="border-t border-border/10 px-3 py-2">
        {/* Overall rationale — compact */}
        {!hasExpanded && (
          <p className="text-[10px] text-muted-foreground/50 mb-1.5 leading-snug line-clamp-2">
            {activeTab === 'activity' ? activityOverallRationale : descriptionOverallRationale}
          </p>
        )}

        {hasExpanded && (
          <button
            type="button"
            onClick={handleBackToAll}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground/70 transition-colors mb-1.5 focus-visible:outline-none"
          >
            <ArrowLeft className="h-2.5 w-2.5" />
            <span>All metrics</span>
          </button>
        )}

        {/* Metric chips — 2-column grid when collapsed, full width when one is expanded */}
        <div className={hasExpanded ? 'space-y-0' : 'grid grid-cols-2 gap-x-1 gap-y-0'}>
          {currentMetrics.map(metric => {
            const isExp = expandedMetric === metric.key;
            if (hasExpanded && !isExp) return null;

            const rationale = activeTab === 'activity'
              ? getActivityRationale(metric.key)
              : getDescriptionRationale(metric.key);

            const extraContext = activeTab === 'activity'
              ? getActivityExtraContext(metric.key)
              : null;

            return (
              <MetricChip
                key={metric.key}
                metric={metric}
                isExpanded={isExp}
                onClick={() => handleMetricClick(metric.key)}
                rationale={rationale}
                extraContext={extraContext}
              />
            );
          })}
        </div>

        {/* Tier explanation removed — shown in CelebrationTab's collapsible section instead */}
      </div>
    </div>
  );
}

export const ScoreBreakdown = React.memo(ScoreBreakdownInner);
