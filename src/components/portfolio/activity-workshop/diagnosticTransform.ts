/**
 * diagnosticTransform.ts
 *
 * Transforms raw ActivityInsightData into the focused DiagnosticCard data shape.
 * Pure frontend logic — no API calls, no side effects.
 *
 * Derives "information scent" pills and inline description diagnostics from the
 * rich but buried data already produced by the scoring pipeline.
 */

import type { ActivityInsightData } from './insightTypes';

// ============================================================================
// DIAGNOSTIC CARD DATA CONTRACT
// ============================================================================

export type PillType = 'omission' | 'alignment' | 'risk' | 'opportunity' | 'efficiency';
export type PillSeverity = 'critical' | 'notable' | 'info';

export interface DiagnosticPill {
  type: PillType;
  label: string;
  detail: string;
  severity: PillSeverity;
}

export interface DescriptionDiagnostic {
  text: string;
  type: 'weak_verb' | 'vanity_metric' | 'team_attribution' | 'unsupported_claim' | 'wasted_chars' | 'generic_phrase';
  tooltip: string;
  suggestedFix: string;
}

export interface DiagnosticExpansion {
  descriptionRadar: Record<string, { score: number; maxScore: number; label: string }>;
  activityRadar: Record<string, { score: number; maxScore: number; label: string }>;
  suggestedRewrite: string | null;
  projectedScoreAfterRewrite: number | null;
  changesApplied: Array<{ element: string; original: string; transformed: string; rationale: string }>;
  upgradePathway: {
    currentTier: number;
    targetTier: number;
    feasibility: string;
    steps: Array<{ action: string; timeframe: string }>;
  } | null;
  competitiveGaps: string[];
  narrativeConnections: number;
  essayPotential: { viable: boolean; angle: string } | null;
  comparisonBenchmarks: { similarTo: string; above: string; below: string } | null;
  improvementPaths: string[];
}

export interface DiagnosticActivityCard {
  activityId: string;
  title: string;
  rank: number;
  archetype: string;
  storyRole: string;
  combinedScore: number;
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  headline: string;
  headlineType: 'celebration' | 'diagnostic';
  totalHours: number;
  diagnosticPills: DiagnosticPill[];
  descriptionDiagnostics: DescriptionDiagnostic[];
  expansion: DiagnosticExpansion;
}

// ============================================================================
// TIER LABELS (Uplift lexicon — no "Tier 1" etc.)
// ============================================================================

const TIER_DISPLAY_LABELS: Record<number, string> = {
  1: 'Elite',
  2: 'Strong',
  3: 'Solid',
  4: 'Basic',
};

const STORY_ROLE_LABELS: Record<string, string> = {
  core_identity: 'Core Identity',
  passion_pursuit: 'Passion',
  impact_vehicle: 'Impact',
  obligation: 'Obligation',
  exploration: 'Exploration',
};

// ============================================================================
// PILL DERIVATION
// ============================================================================

function deriveDiagnosticPills(data: ActivityInsightData): DiagnosticPill[] {
  const pills: DiagnosticPill[] = [];

  // 1. Strategic omissions — improvements that represent missing elements
  const omissionCount = data.descriptionImprovements?.length ?? 0;
  if (omissionCount > 0) {
    pills.push({
      type: 'omission',
      label: `${omissionCount} Strategic ${omissionCount === 1 ? 'Omission' : 'Omissions'}`,
      detail: data.descriptionImprovements?.join('. ') ?? '',
      severity: omissionCount >= 3 ? 'critical' : 'notable',
    });
  }

  // 2. Tier alignment — how close to next tier
  if (data.upgradePathway) {
    const { currentTier, targetTier, feasibility } = data.upgradePathway;
    const stepsCount = data.upgradePathway.steps?.length ?? 0;
    if (targetTier < currentTier && stepsCount > 0) {
      pills.push({
        type: 'alignment',
        label: `${stepsCount} steps to ${TIER_DISPLAY_LABELS[targetTier] ?? 'T' + targetTier}`,
        detail: `Feasibility: ${feasibility}. ${data.upgradePathway.steps.map(s => s.action).join('; ')}`,
        severity: feasibility === 'high' ? 'info' : 'notable',
      });
    }
  }

  // 3. Red flags = risk pills
  if (data.redFlags.length > 0) {
    const topFlag = data.redFlags[0];
    pills.push({
      type: 'risk',
      label: data.redFlags.length === 1
        ? topFlag.flag
        : `${data.redFlags.length} Risk ${data.redFlags.length === 1 ? 'Signal' : 'Signals'}`,
      detail: topFlag.implication,
      severity: topFlag.severity === 'high' ? 'critical' : 'notable',
    });
  }

  // 4. Score uplift opportunity
  if (data.transformation?.expectedScoreImprovement) {
    const { projectedScore } = data.transformation.expectedScoreImprovement;
    const uplift = projectedScore - data.combinedScore;
    if (uplift > 0.5) {
      pills.push({
        type: 'opportunity',
        label: `+${uplift.toFixed(1)} Uplift Available`,
        detail: data.transformation.expectedScoreImprovement.rationale,
        severity: uplift >= 2.0 ? 'critical' : 'notable',
      });
    }
  }

  // 5. Description efficiency — low quantification or weak description score
  const quantScore = data.descriptionScore?.breakdown?.quantification?.score ?? 10;
  if (quantScore <= 4) {
    pills.push({
      type: 'efficiency',
      label: 'No Measurable Impact',
      detail: 'Your description lacks quantifiable outcomes. AOs recall specific numbers 2.4x more than vague claims.',
      severity: quantScore <= 2 ? 'critical' : 'notable',
    });
  }

  // 6. Differentiation test
  const diffScore = data.descriptionScore?.breakdown?.authenticityVoice?.score ?? 10;
  if (diffScore <= 4) {
    pills.push({
      type: 'risk',
      label: 'Uniqueness: Low',
      detail: '1,000 students in the same role could write this description. Add specific details only you could know.',
      severity: 'notable',
    });
  }

  // 7. Essay potential (positive pill)
  if (data.essayPotential?.viable) {
    pills.push({
      type: 'opportunity',
      label: 'Essay-Worthy',
      detail: data.essayPotential.angle,
      severity: 'info',
    });
  }

  // Cap at 4 pills, prioritize by severity
  const severityOrder: Record<PillSeverity, number> = { critical: 0, notable: 1, info: 2 };
  pills.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return pills.slice(0, 4);
}

// ============================================================================
// DESCRIPTION DIAGNOSTIC DERIVATION
// ============================================================================

function deriveDescriptionDiagnostics(data: ActivityInsightData): DescriptionDiagnostic[] {
  const diagnostics: DescriptionDiagnostic[] = [];

  // From improvement teaching — each issue maps to a diagnostic
  if (data.improvementTeaching) {
    for (const teaching of data.improvementTeaching.slice(0, 3)) {
      if (teaching.exampleBefore) {
        diagnostics.push({
          text: teaching.exampleBefore,
          type: teaching.issue.toLowerCase().includes('verb') ? 'weak_verb'
            : teaching.issue.toLowerCase().includes('quant') ? 'vanity_metric'
            : teaching.issue.toLowerCase().includes('team') ? 'team_attribution'
            : teaching.issue.toLowerCase().includes('claim') ? 'unsupported_claim'
            : 'generic_phrase',
          tooltip: teaching.whyItMatters,
          suggestedFix: teaching.exampleAfter,
        });
      }
    }
  }

  return diagnostics;
}

// ============================================================================
// EXPANSION DATA DERIVATION
// ============================================================================

function deriveExpansion(data: ActivityInsightData): DiagnosticExpansion {
  // Description radar
  const db = data.descriptionScore?.breakdown;
  const descriptionRadar: DiagnosticExpansion['descriptionRadar'] = {
    roleOwnership: { score: db?.specificity?.score ?? 0, maxScore: 10, label: 'Role Clarity' },
    impactEvidence: { score: db?.impactClarity?.score ?? 0, maxScore: 10, label: 'Impact Evidence' },
    differentiation: { score: db?.authenticityVoice?.score ?? 0, maxScore: 10, label: 'Differentiation' },
    actionPrecision: { score: db?.actionLanguage?.score ?? 0, maxScore: 10, label: 'Action Precision' },
    quantification: { score: db?.quantification?.score ?? 0, maxScore: 10, label: 'Strategic Quant.' },
  };

  // Activity radar
  const ab = data.activityScore?.breakdown;
  const activityRadar: DiagnosticExpansion['activityRadar'] = {
    tierAssessment: { score: ab?.tierAssessment?.score ?? 0, maxScore: 10, label: 'Tier Level' },
    recognition: { score: ab?.recognitionLevel?.score ?? 0, maxScore: 10, label: 'Recognition' },
    leadership: { score: ab?.leadershipImpact?.score ?? 0, maxScore: 10, label: 'Leadership' },
    character: { score: ab?.communityCharacter?.score ?? 0, maxScore: 10, label: 'Character' },
    commitment: { score: ab?.commitmentProgression?.score ?? 0, maxScore: 10, label: 'Commitment' },
  };

  // Transformation data
  const tx = data.transformation;
  const changesApplied = tx?.rewrite?.changesApplied ?? [];
  const suggestedRewrite = tx?.rewrite?.suggested ?? data.suggestedRewrite ?? null;
  const projectedScoreAfterRewrite = tx?.expectedScoreImprovement?.projectedScore ?? null;

  // Upgrade pathway
  const up = data.upgradePathway;
  const upgradePathway = up ? {
    currentTier: up.currentTier,
    targetTier: up.targetTier,
    feasibility: up.feasibility,
    steps: up.steps.map(s => ({ action: s.action, timeframe: s.timeframe })),
  } : null;

  // Competitive gaps from tier explanation benchmarks
  const competitiveGaps = data.tierExplanation?.benchmarks
    ?.filter(b => !b.studentMeets && b.gap)
    .map(b => b.gap!) ?? [];

  // Narrative connections
  const narrativeConnections = data.narrativeThreads
    ?.filter(t => t.activityIds.includes(data.activityId)).length ?? 0;

  // Essay potential
  const essayPotential = data.essayPotential ?? null;

  return {
    descriptionRadar,
    activityRadar,
    suggestedRewrite,
    projectedScoreAfterRewrite,
    changesApplied,
    upgradePathway,
    competitiveGaps,
    narrativeConnections,
    essayPotential,
    comparisonBenchmarks: data.comparisonBenchmarks ?? null,
    improvementPaths: data.improvementPaths ?? [],
  };
}

// ============================================================================
// MAIN TRANSFORM
// ============================================================================

export function transformToDiagnosticCard(data: ActivityInsightData): DiagnosticActivityCard {
  // Determine headline type
  const hasCriticalIssues = data.redFlags.length > 0
    || (data.descriptionScore?.total ?? 10) < 5
    || (data.transformation?.revisionLevel === 'major_overhaul' || data.transformation?.revisionLevel === 'strategic_rethink');

  const headline = hasCriticalIssues
    ? (data.topImprovement || data.summaryOneLiner)
    : (data.celebrationHeadline || data.quickCelebration || data.summaryOneLiner);

  return {
    activityId: data.activityId,
    title: data.title,
    rank: data.rank,
    archetype: STORY_ROLE_LABELS[data.storyRole] ?? 'Activity',
    storyRole: data.storyRole,
    combinedScore: data.combinedScore,
    tier: data.tier,
    tierLabel: TIER_DISPLAY_LABELS[data.tier] ?? 'T' + data.tier,
    headline,
    headlineType: hasCriticalIssues ? 'diagnostic' : 'celebration',
    totalHours: data.totalHours,
    diagnosticPills: deriveDiagnosticPills(data),
    descriptionDiagnostics: deriveDescriptionDiagnostics(data),
    expansion: deriveExpansion(data),
  };
}
