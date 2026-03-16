/**
 * Growth Engine — State Management & Dispatch for L3.75 Iterative Synthesis
 *
 * Manages the growth cycle's state, finding merges, and deep dive dispatch.
 * The engine is infrastructure (Rule 6) — it tracks activity and enforces
 * resource limits. The LLM owns all analytical judgment.
 *
 * NO reward formulas. NO convergence computation. NO dimension scoring.
 * The LLM's selfAssessedConvergence is the PRIMARY stopping criterion.
 * Budget and iteration caps are the ONLY system-enforced stops.
 */

import type {
  GrowthStepRecord,
  GrowthCycleState,
  DeepDiveRequest,
  Finding,
  FindingMaturity,
  UnderstandingQuestion,
  QuestionCurationOutput,
} from '../profileTypes';

// ============================================================================
// CONSTANTS (System Infrastructure — Rule 6)
// ============================================================================

/** Safety cap on iterations — backstop only, not the primary stopping criterion */
export const MAX_ITERATIONS = 8;

/** Total budget ceiling for the entire growth cycle in USD */
export const GROWTH_BUDGET_CEILING = 0.60;

/** Minimum budget to attempt another step — below this, cycle stops */
export const MIN_BUDGET_FOR_STEP = 0.03;

// ============================================================================
// COST ESTIMATION
// ============================================================================

/** Estimated cost per deep dive prompt type in USD */
const DEEP_DIVE_COST_ESTIMATES: Record<string, number> = {
  voice_authenticity: 0.04,
  voice_register_analysis: 0.03,
  emotion_earning_trace: 0.04,
  emotion_arc_mapping: 0.03,
  theme_thread_tracing: 0.04,
  theme_subtext_excavation: 0.04,
  narrative_strategy_assessment: 0.03,
  narrative_pivot_analysis: 0.03,
  character_values_mapping: 0.04,
  character_growth_arc: 0.03,
  craft_rhythm_analysis: 0.03,
  craft_image_system: 0.03,
  admissions_positioning: 0.03,
  admissions_distinctiveness: 0.03,
  epistemological_framework: 0.05,
  absence_detection: 0.04,
  coherence_validation: 0.04,
  constraint_creativity: 0.04,
  meta_awareness: 0.05,
  cross_dimension_intersection: 0.04,
};

/** Default cost estimate for unknown prompt types */
const DEFAULT_DEEP_DIVE_COST = 0.04;

/**
 * Estimate the cost of a deep dive by prompt type.
 * Pure infrastructure — no analytical judgment.
 */
export function estimateDeepDiveCost(promptType: string): number {
  return DEEP_DIVE_COST_ESTIMATES[promptType] ?? DEFAULT_DEEP_DIVE_COST;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Initialize a fresh growth cycle state.
 */
export function initGrowthCycleState(budgetCeiling?: number): GrowthCycleState {
  const ceiling = budgetCeiling ?? GROWTH_BUDGET_CEILING;
  return {
    iteration: 0,
    activityLog: [],
    budgetRemaining: ceiling,
    budgetCeiling: ceiling,
    isConverged: false,
  };
}

// ============================================================================
// STEP RECORD BUILDING (Pure Bookkeeping)
// ============================================================================

/**
 * Partial step result — what each step provides for bookkeeping.
 * The step implementations populate these fields; the engine records them.
 */
export interface StepResult {
  questionsResolved?: number;
  questionsRaised?: number;
  findingsAdded?: number;
  findingsDeepened?: number;
  findingsSuperseded?: number;
  sectionsUpdated?: string[];
  cost: number;
  discoveryNote?: string;
}

/**
 * Build a GrowthStepRecord from a step's result.
 * Pure bookkeeping — no scoring, no weighting.
 */
export function buildStepRecord(step: string, result: StepResult): GrowthStepRecord {
  return {
    step,
    questionsResolved: result.questionsResolved ?? 0,
    questionsRaised: result.questionsRaised ?? 0,
    findingsAdded: result.findingsAdded ?? 0,
    findingsDeepened: result.findingsDeepened ?? 0,
    findingsSuperseded: result.findingsSuperseded ?? 0,
    sectionsUpdated: result.sectionsUpdated ?? [],
    cost: result.cost,
    discoveryNote: result.discoveryNote ?? '',
  };
}

// ============================================================================
// DEEP DIVE DISPATCH (Budget-Only)
// ============================================================================

/**
 * Dispatch deep dives from L3.75's curated queue.
 *
 * L3.75's ordering IS the priority. The system enforces budget only.
 * No re-ranking, no diminishing returns formula, no domain diversity heuristic.
 *
 * If L3.75 wants voice investigated twice, it curates two voice questions.
 * If a dimension is unexplored and L3.75 doesn't mention it, that's because
 * the reading strategy says it's not relevant to THIS essay.
 */
export function dispatchDeepDives(
  curatedQueue: QuestionCurationOutput['curatedQueue'],
  budgetRemaining: number,
): DeepDiveRequest[] {
  const selected: DeepDiveRequest[] = [];
  let remaining = budgetRemaining;

  for (const cq of curatedQueue) {
    const cost = estimateDeepDiveCost(cq.recommendedPrompt);
    if (cost > remaining) break;

    selected.push({
      question: cq.question,
      promptType: cq.recommendedPrompt,
      rationale: cq.promptRationale,
      estimatedCost: cost,
    });
    remaining -= cost;
  }

  return selected;
}

// ============================================================================
// FINDING MERGE
// ============================================================================

/**
 * Merge findings from a deep dive into the cumulative findings array.
 *
 * Rules:
 * - New findings are appended with unique IDs
 * - If a new finding supersedes an existing one, the existing one is marked
 * - Duplicate claims (same claim text + same scope) are skipped
 */
export function mergeFindingsFromDeepDive(
  cumulativeFindings: Finding[],
  newFindings: Finding[],
): Finding[] {
  const merged = [...cumulativeFindings];
  const existingClaims = new Set(
    merged.map(f => `${f.claim}::${f.scope.type}::${f.scope.paragraph ?? 'essay'}`),
  );

  for (const finding of newFindings) {
    const key = `${finding.claim}::${finding.scope.type}::${finding.scope.paragraph ?? 'essay'}`;
    if (existingClaims.has(key)) {
      continue; // Skip duplicates
    }

    // Handle supersession: if this finding supersedes an existing one
    if (finding.buildsOn && finding.buildsOn.length > 0) {
      for (const parentId of finding.buildsOn) {
        const parent = merged.find(f => f.id === parentId);
        if (parent && parent.maturity !== 'superseded') {
          // Don't auto-supersede — the finding just builds on it
          // Supersession is explicit via finding.supersededBy
        }
      }
    }

    merged.push(finding);
    existingClaims.add(key);
  }

  return merged;
}

/**
 * Merge findings from a re-read into the cumulative findings array.
 * Same logic as deep dive merge — re-reads produce findings at the same granularity.
 */
export function mergeFindingsFromReRead(
  cumulativeFindings: Finding[],
  newFindings: Finding[],
): Finding[] {
  return mergeFindingsFromDeepDive(cumulativeFindings, newFindings);
}

// ============================================================================
// ACTIVITY LOG FORMATTING
// ============================================================================

/**
 * Format the activity log as prose for L3.75 context injection.
 *
 * The LLM sees this as context for convergence judgment.
 * Formatted as human-readable prose, not JSON.
 */
export function formatActivityLog(state: GrowthCycleState): string {
  if (state.activityLog.length === 0) {
    return '(First iteration — no prior activity)';
  }

  const lines: string[] = ['=== GROWTH ACTIVITY LOG ==='];

  for (const record of state.activityLog) {
    // Group by iteration
    const iterMatch = record.step.match(/synthesis_iter_(\d+)/);
    if (iterMatch) {
      lines.push(`\nIteration ${parseInt(iterMatch[1], 10)}:`);
    }

    const metrics: string[] = [];
    if (record.questionsResolved > 0) metrics.push(`resolved ${record.questionsResolved} questions`);
    if (record.questionsRaised > 0) metrics.push(`raised ${record.questionsRaised} new questions`);
    if (record.findingsAdded > 0) metrics.push(`added ${record.findingsAdded} findings`);
    if (record.findingsDeepened > 0) metrics.push(`deepened ${record.findingsDeepened} findings`);
    if (record.findingsSuperseded > 0) metrics.push(`superseded ${record.findingsSuperseded} findings`);
    if (record.sectionsUpdated.length > 0) metrics.push(`updated ${record.sectionsUpdated.join(', ')}`);

    const metricsStr = metrics.length > 0 ? metrics.join(', ') : 'no profile changes';
    lines.push(`  ${record.step}: ${metricsStr}`);

    if (record.discoveryNote) {
      lines.push(`  Discovery: "${record.discoveryNote}"`);
    }
  }

  const totalCost = state.budgetCeiling - state.budgetRemaining;
  lines.push(`\nCost so far: $${totalCost.toFixed(2)} of $${state.budgetCeiling.toFixed(2)} budget`);

  return lines.join('\n');
}

// ============================================================================
// MATURITY GAP ANALYSIS (Gap 4)
// ============================================================================

/**
 * A finding stuck at a maturity level that warrants attention.
 */
export interface MaturityGap {
  findingId: string;
  claim: string;
  maturity: FindingMaturity;
  /** How many iterations this finding has been at its current maturity (estimated) */
  estimatedIterationsStuck: number;
  recommendation: 'investigate' | 'acknowledge_ambiguous';
  /** Actionable suggestion — e.g., "Dispatch finding_deepener for F3" */
  suggestedAction: string;
}

/**
 * Analyze findings for stuck maturity — findings that haven't advanced
 * through the maturity lifecycle despite multiple growth iterations.
 *
 * Uses Option A (simple): compares finding.createdAt timestamps against
 * the iteration count to estimate how long a finding has been stuck.
 * No type changes to Finding needed.
 *
 * This is a SIGNAL, not a deterministic trigger. The question queue and
 * L3.75 decide what to DO with the gaps. (LLM-first Rule 4)
 *
 * Thresholds:
 * - hypothesis findings stuck for 2+ iterations → investigate
 * - developing findings stuck for 3+ iterations → investigate
 * - If deepeningPotential is null → acknowledge_ambiguous instead
 */
export function analyzeMaturityGaps(
  findings: Finding[],
  state: GrowthCycleState,
): MaturityGap[] {
  const gaps: MaturityGap[] = [];
  const currentIteration = state.iteration;

  for (const finding of findings) {
    // Skip superseded findings — they're done
    if (finding.maturity === 'superseded') continue;
    // Skip confirmed/deepened — they've progressed
    if (finding.maturity === 'confirmed' || finding.maturity === 'deepened') continue;

    // Estimate iterations stuck by comparing timestamps
    // finding.createdAt is when it was created, finding.lastUpdated is last maturity change
    // Use lastUpdated as the anchor for staleness
    const lastChangeTime = new Date(finding.lastUpdated || finding.createdAt).getTime();
    const iterationStartTimes = state.activityLog
      .filter(a => a.step.startsWith('synthesis_iter_'))
      .map(a => a.step);
    const totalIterations = iterationStartTimes.length || currentIteration;

    // Rough estimate: if the finding was created early and hasn't changed,
    // it's been stuck for approximately (totalIterations - creationIteration) iterations.
    // Without per-finding iteration tracking, use lineage length as a proxy:
    // if lineage is empty, finding has never transitioned → stuck since creation.
    const lineageTransitions = finding.lineage?.length ?? 0;
    const estimatedIterationsStuck = lineageTransitions === 0
      ? totalIterations  // Never transitioned
      : Math.max(0, totalIterations - lineageTransitions);

    let isStuck = false;
    if (finding.maturity === 'hypothesis' && estimatedIterationsStuck >= 2) {
      isStuck = true;
    } else if (finding.maturity === 'developing' && estimatedIterationsStuck >= 3) {
      isStuck = true;
    }

    if (!isStuck) continue;

    const hasDeepening = finding.deepeningPotential !== null && finding.deepeningPotential !== '';
    gaps.push({
      findingId: finding.id,
      claim: finding.claim,
      maturity: finding.maturity,
      estimatedIterationsStuck,
      recommendation: hasDeepening ? 'investigate' : 'acknowledge_ambiguous',
      suggestedAction: hasDeepening
        ? `Investigate finding ${finding.id}: "${finding.claim.substring(0, 80)}..." — deepening potential: ${finding.deepeningPotential}`
        : `Acknowledge ambiguity for ${finding.id}: "${finding.claim.substring(0, 80)}..." — no further investigation path available`,
    });
  }

  return gaps;
}

/**
 * Convert maturity gaps into UnderstandingQuestions for the persistent queue.
 * Only converts gaps with recommendation 'investigate'.
 *
 * Returns questions with source: 'maturity_gap' so they can be distinguished
 * from L3.75-curated questions in dispatch.
 */
export function maturityGapsToQuestions(
  gaps: MaturityGap[],
  iteration: number,
): UnderstandingQuestion[] {
  return gaps
    .filter(gap => gap.recommendation === 'investigate')
    .map((gap, idx) => ({
      id: `MG_${iteration}_${idx}`,
      question: `Finding "${gap.claim}" has remained at ${gap.maturity} for ${gap.estimatedIterationsStuck} iterations. What evidence would confirm or refute this claim?`,
      dimensions: [] as string[],
      expectedInsight: gap.suggestedAction,
      source: 'maturity_gap' as const,
      status: 'open' as const,
      priority: 'high' as const,
      iterationsSurvived: 0,
      spawnedQuestions: [],
      raisedAt: new Date().toISOString(),
      raisedDuringIteration: iteration,
    }));
}
