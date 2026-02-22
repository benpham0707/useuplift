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
      specificity: { score: number };
      impactClarity: { score: number };
      authenticityVoice: { score: number };
      actionLanguage: { score: number };
      quantification: { score: number };
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

function MetricRow({
  metric,
  isExpanded,
  isVisible,
  onClick,
  rationale,
  extraContext,
}: {
  metric: MetricDef;
  isExpanded: boolean;
  isVisible: boolean;
  onClick: () => void;
  rationale: string | null;
  extraContext: React.ReactNode;
}) {
  const theme = getScoreTheme(metric.score);
  const pct = (metric.score / 10) * 100;
  const [barAnimated, setBarAnimated] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const frame = requestAnimationFrame(() => setBarAnimated(true));
      return () => cancelAnimationFrame(frame);
    }
    setBarAnimated(false);
  }, [isVisible]);

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: isVisible ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className="py-1">
          {/* Collapsed metric bar — always present when visible */}
          <button
            type="button"
            onClick={onClick}
            className={[
              'w-full flex items-center gap-3 px-2 py-1.5 -mx-2 rounded-lg',
              'transition-colors duration-200 text-left',
              'hover:bg-muted/40 dark:hover:bg-muted/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isExpanded ? 'bg-muted/30 dark:bg-muted/15' : '',
            ].join(' ')}
          >
            <span className="text-xs text-muted-foreground min-w-0 flex-shrink-0 w-28 sm:w-36 truncate">
              {metric.label}
              {metric.weight !== undefined && (
                <span className="text-muted-foreground/40 ml-1 text-[10px]">
                  {(metric.weight * 100).toFixed(0)}%
                </span>
              )}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/50 dark:bg-muted/25 overflow-hidden">
              <div
                className={`h-full rounded-full ${theme.barClass}`}
                style={{
                  width: barAnimated ? `${pct}%` : '0%',
                  transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
            <span className={`text-xs font-semibold tabular-nums w-8 text-right ${theme.textClass}`}>
              {metric.score.toFixed(1)}
            </span>
          </button>

          {/* Expanded rationale — grid 0fr→1fr */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="pt-2 pb-1 px-2 space-y-2">
                {rationale && (
                  <ParagraphText text={rationale} className="text-xs text-muted-foreground/90 leading-relaxed" />
                )}
                {extraContext}
              </div>
            </div>
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

export function ScoreBreakdown({
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
    { key: 'recognitionLevel', label: 'Recognition Level', score: activityScore.breakdown.recognitionLevel.score, weight: activityScore.breakdown.recognitionLevel.weight },
    { key: 'commitmentProgression', label: 'Commitment & Progression', score: activityScore.breakdown.commitmentProgression.score, weight: activityScore.breakdown.commitmentProgression.weight },
    { key: 'communityCharacter', label: 'Community Character', score: activityScore.breakdown.communityCharacter.score, weight: activityScore.breakdown.communityCharacter.weight },
    { key: 'leadershipImpact', label: 'Leadership Impact', score: activityScore.breakdown.leadershipImpact.score, weight: activityScore.breakdown.leadershipImpact.weight },
  ];

  const descriptionMetrics: MetricDef[] = [
    { key: 'specificity', label: 'Specificity', score: descriptionScore.breakdown.specificity.score },
    { key: 'impactClarity', label: 'Impact Clarity', score: descriptionScore.breakdown.impactClarity.score },
    { key: 'authenticityVoice', label: 'Authenticity & Voice', score: descriptionScore.breakdown.authenticityVoice.score },
    { key: 'actionLanguage', label: 'Action Language', score: descriptionScore.breakdown.actionLanguage.score },
    { key: 'quantification', label: 'Quantification', score: descriptionScore.breakdown.quantification.score },
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
    <div className="rounded-2xl backdrop-blur-md bg-card/80 dark:bg-card/60 border border-border/15 overflow-hidden">
      {/* ── Top row: Combined score hero + mini toggles ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-4">
          {/* Combined score hero ring */}
          <div className="flex-shrink-0">
            <SvgRing score={combinedScore} size={72} strokeWidth={5} />
          </div>

          {/* Right side: label + mini rings */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
              Combined Score
            </p>

            {/* Toggle row: two clickable mini-rings */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabSwitch('activity')}
                className={[
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-1 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeTab === 'activity'
                    ? 'bg-muted/50 dark:bg-muted/25'
                    : 'opacity-50 hover:opacity-80',
                ].join(' ')}
              >
                <SvgRing score={activityScore.total} size={36} strokeWidth={3} showLabel={false} />
                <div className="text-left">
                  <p className={`text-[10px] font-semibold leading-tight ${activeTab === 'activity' ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                    Activity
                  </p>
                  <p className={`text-xs font-bold tabular-nums ${getScoreTheme(activityScore.total).textClass}`}>
                    {activityScore.total.toFixed(1)}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('description')}
                className={[
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-1 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeTab === 'description'
                    ? 'bg-muted/50 dark:bg-muted/25'
                    : 'opacity-50 hover:opacity-80',
                ].join(' ')}
              >
                <SvgRing score={descriptionScore.total} size={36} strokeWidth={3} showLabel={false} />
                <div className="text-left">
                  <p className={`text-[10px] font-semibold leading-tight ${activeTab === 'description' ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                    Description
                  </p>
                  <p className={`text-xs font-bold tabular-nums ${getScoreTheme(descriptionScore.total).textClass}`}>
                    {descriptionScore.total.toFixed(1)}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Combined score rationale (subtle) */}
        {combinedScoreRationale && (
          <ParagraphText text={combinedScoreRationale} className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed" />
        )}
      </div>

      {/* ── Metric breakdown area ── */}
      <div className="border-t border-border/10 px-4 py-3">
        {/* Back button when expanded */}
        {hasExpanded && (
          <button
            type="button"
            onClick={handleBackToAll}
            className={[
              'flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70',
              'hover:text-foreground/80 transition-colors duration-200 mb-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5 -mx-1',
            ].join(' ')}
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to all metrics</span>
          </button>
        )}

        {/* Overall rationale for selected tab */}
        {!hasExpanded && (
          <ParagraphText
            text={activeTab === 'activity' ? activityOverallRationale : descriptionOverallRationale}
            className="text-[11px] text-muted-foreground/60 mb-2 leading-relaxed"
          />
        )}

        {/* Metric rows */}
        <div className="space-y-0">
          {currentMetrics.map(metric => {
            const isExpanded = expandedMetric === metric.key;
            const isVisible = !hasExpanded || isExpanded;

            const rationale = activeTab === 'activity'
              ? getActivityRationale(metric.key)
              : getDescriptionRationale(metric.key);

            const extraContext = activeTab === 'activity'
              ? getActivityExtraContext(metric.key)
              : null;

            return (
              <MetricRow
                key={metric.key}
                metric={metric}
                isExpanded={isExpanded}
                isVisible={isVisible}
                onClick={() => handleMetricClick(metric.key)}
                rationale={rationale}
                extraContext={extraContext}
              />
            );
          })}
        </div>

        {/* Tier explanation — activity tab only */}
        {activeTab === 'activity' && tierExplanation && !hasExpanded && (
          <TierSection tierExplanation={tierExplanation} />
        )}
      </div>
    </div>
  );
}
