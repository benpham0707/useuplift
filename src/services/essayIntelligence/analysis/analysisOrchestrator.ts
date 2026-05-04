/**
 * Analysis Orchestrator V2 — Pipeline Coordinator for EssayProfile
 *
 * Sequences 8 analysis layers across 6 pipeline phases to produce a
 * complete EssayProfile. All state mutations go through the
 * EssayProfileCoordinator — the orchestrator never touches the profile directly.
 *
 * Pipeline phases:
 *   Phase 1: L1 first → L2 + L2.5 parallel    (foundation)
 *   Phase 2: L3 sequential deep walk            (understanding — THE CORE)
 *   Phase 3: L3.75 holistic synthesis            (single Sonnet call)
 *   Phase 4: L3.5 analysis pass                  (per-paragraph evaluation)
 *   Phase 5: L4 crystallization                  (North Star + score matrix + coherence)
 *   Phase 6: L5 annotations                      (ephemeral feedback — parallel)
 *
 * Error recovery: FAIL-FAST
 *   ANY layer failure → abort pipeline immediately. Don't burn money on
 *   downstream layers that depend on data we don't have.
 *   Every failure logs: layer, errorType, httpStatus, stack trace, cost so far.
 *
 * Checkpointing:
 *   after_l1_l2  → after Phase 1
 *   after_l3     → after Phase 2
 *   after_l3_75  → after Phase 3 (handled by coordinator.applyHolisticSynthesis)
 *   after_l3_5   → after Phase 4
 *   after_l4     → after Phase 5 (handled by coordinator.applyNorthStar)
 *   after_l5     → after Phase 6
 *
 * Cost tracking: per-layer cost/token/timing accumulated in CostTracker.
 *
 * Type contract: profileTypes.ts V2 types throughout.
 */

import type {
  EssayProfile,
  EssayType,
  Finding,
  ParagraphFirstImpression,
  ConnectionScoutOutput,
  UnderstandingWalkOutput,
  HolisticSynthesisOutput,
  AnalysisPassOutput,
  NorthStarOutput,
  ImprovementPhaseLevel,
  ImprovementPhase,
  ConfidenceLevel,
  CheckpointReason,
  CheckpointStore,
  ParagraphScoreMatrix,
  CoherenceReport,
  ReanalysisBrief,
  DeltaSynthesisRequest,
  HolisticSectionType,
  GrowthCycleState,
  GrowthStepRecord,
  ReadingStrategy,
  SynthesisIterationOutput,
  DeepDiveRequest,
  UnderstandingQuestion,
  ImprovementManifest,
  ImprovementEntry,
  ImprovementCandidate,
  ImprovementCandidateStoreSnapshot,
  IterationLedger,
  IterationRecord,
  EditChangeType,
  CarryForwardDecision,
} from '../profileTypes';

import type { StructuralCartography } from '../types';
import { classifyError } from '../../../lib/llm/claude';
import type { LayerError } from '../../../lib/llm/claude';
import { PipelineError } from '../errors';
import { runHowlerPass } from './howlerPass';
import { mergeL5IntoManifest } from './l5ManifestMerger';

// Layer services
import { firstImpressionsService } from './firstImpressions';
import type { FirstImpressionsResult } from './firstImpressions';
import { structuralCartographerService } from './structuralCartographer';
import type { StructuralCartographyResult } from './structuralCartographer';
import { scoutPassService } from './scoutPass';
import type { ScoutPassResult } from './scoutPass';
import type { L3WalkResult } from './sequentialDeepWalk';
import { runEssayLevelL3Walk, adaptEssayLevelOutputToL3WalkResult } from './essayLevelL3Walk';
import { holisticSynthesisService, synthesizeUnderstandingProse } from './holisticSynthesis';
import type { HolisticSynthesisResult, DeltaSynthesisResult, SynthesisIterationResult } from './holisticSynthesis';

// V2: Growth cycle imports
import {
  initGrowthCycleState,
  buildStepRecord,
  dispatchDeepDives,
  mergeFindingsFromDeepDive,
  mergeFindingsFromReRead,
  analyzeMaturityGaps,
  maturityGapsToQuestions,
  MAX_ITERATIONS,
  GROWTH_BUDGET_CEILING,
  MIN_BUDGET_FOR_STEP,
} from './growthEngine';
import type { StepResult } from './growthEngine';
import { QuestionQueueManager } from './questionQueueManager';
import { runDeepDive } from './deepDiveRunner';
import { runTargetedReRead } from './fullContextReReader';
import { analysisPassService } from './analysisPass';
import { runAOFirstRead } from './aoFirstRead';
import type { AOFirstReadResult } from './aoFirstRead';
import type { L35AnalysisResult } from './analysisPass';
import { crystallizerService } from './crystallizer';
import type { L4CrystallizationResult } from './crystallizer';
import { deepAnnotationService } from './deepAnnotationService';
import type { L5AnnotationResult } from './deepAnnotationService';

// W4.4: Contradiction consumer + programmatic detection
import { consumeContradictions } from './contradictionConsumer';
import type { ContradictionConsumptionResult } from './contradictionConsumer';
import { detectProgrammaticContradictions } from '../profileManager/validation/crossDomainValidation';

// Profile manager
import {
  EssayProfileCoordinator,
  getCurrentIteration,
  incrementIteration,
} from '../profileManager/essayProfileManager';
import {
  l5AnnotationsToTaughtMoves,
  bufferTaughtMoves,
  flushTaughtMovesForIteration,
  clearTaughtMovesForIteration,
} from './taughtMoveBuilder';
import {
  flushEventsForIteration,
  clearEventsForIteration,
  emitIterationEvent,
} from '../telemetry/iterationTelemetry';
import { safeAppendCarryForwardDecision } from './carryForwardSynthesis';
import { buildEditScopeFromBrief } from './editScopeBuilder';
import { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import { InMemoryCheckpointStore } from '../profileManager/checkpointStore';

// Finding store (for contradiction → finding pipeline)
import { FindingStore } from '../findings/findingStore';

// Connection graph (for adversarial pass structural context)
import { ConnectionGraph } from '../connections';

// Re-export LayerError for consumers of PipelineResult
export type { LayerError } from '../../../lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

/** Token usage breakdown for a single layer */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

/** Cost entry for a single layer */
export interface LayerCost {
  layer: string;
  cost: number;
  tokenUsage: TokenUsage;
  timingMs: number;
}

/** Aggregate cost summary */
export interface CostSummary {
  totalCost: number;
  totalTimingMs: number;
  layers: LayerCost[];
  totalTokenUsage: TokenUsage;
}

/** Input to the pipeline */
export interface PipelineInput {
  /** Unique essay ID (for checkpointing and logging) */
  essayId: string;
  /** The essay text */
  essayText: string;
  /** Essay type (common_app, supplement, piq) */
  essayType: EssayType;
  /** Optional prompt text (the question/prompt the student is responding to) */
  promptText?: string;
  /** Optional checkpoint store — defaults to InMemoryCheckpointStore */
  checkpointStore?: CheckpointStore;
  /** Whether to include L5 annotations — defaults to true */
  includeAnnotations?: boolean;
  /**
   * Optional brief from version tracker — passed through to L5 annotations
   * so the annotation pipeline knows what changed and can prioritize stale areas.
   */
  reanalysisBrief?: ReanalysisBrief;
  /**
   * Prior findings from a previous analysis round (for comprehensive re-analysis).
   * Seeded into the coordinator's FindingStore BEFORE the walk runs, so the walk
   * can see them and produce findingEvolutions (confirm, deepen, supersede).
   * Without this, the walk creates findings from scratch with no prior context.
   */
  priorFindings?: Finding[];
  /**
   * Port A2 (Wave-1a): Clerk user ID. When supplied AND the
   * ENABLE_VOICE_PROFILE_IMPORT env flag is 'true', the orchestrator loads
   * the persisted StudentVoiceProfile (if any) before L3.75 runs and
   * threads it as a prior observation into Phase A's user prompt. After
   * L3.75 completes, the orchestrator fire-and-forgets an enrichProfile
   * write so the next essay sees updated voice context. Unsupplied →
   * pre-port-identical behavior.
   */
  userId?: string;
  /**
   * D-1.8: LLM-judged overall edit significance from upstream
   * `editUnderstandingService.understandEdit()`. Populated by
   * `reanalysisOrchestrator` for edit-triggered re-analysis runs; absent
   * on cold first-pass calls (where there is no prior text to compare).
   *
   * When present, the orchestrator's priorAnnotations wire-up applies this
   * uniformly to every changed paragraph's `EditSignal.significance`
   * (locked decision: never discard paid LLM output to redo a coarser
   * derivation; the LLM judged the whole edit at this level, propagate
   * that judgment honestly). When absent, mechanical-significance
   * fallback in `buildPerParagraphEdits` derives the bucket from
   * `changeRatio` cuts (D-1.8 §4).
   */
  editSignificance?: 'minor' | 'moderate' | 'significant' | 'transformative';
  /**
   * D-1.8: prior-iteration essay text, supplied directly by the caller
   * when available. The orchestrator prefers this over the
   * `iterationLedger.iterations[]` snapshot when both are present (caller's
   * intent is more authoritative than a stale ledger entry). Absent →
   * orchestrator falls back to `getPriorIterationSnapshotText` against
   * the profile's iterationLedger; if that's also undefined, the wire-up
   * gracefully degrades to `priorAnnotations: undefined` (structural
   * absence, not silent fallback).
   *
   * Producer: `reanalysisOrchestrator.triggerReanalysis()` populates this
   * from `versionTracker.getPreviousAnalyzedText()` when an edit triggered
   * the re-analysis. Direct `analyzeEssay()` callers leave it undefined.
   */
  priorEssayText?: string;
  /**
   * D-1.10: seed for the new coordinator's `iterationLedger`. When supplied,
   * `EssayProfileCoordinator.createNew(...)` deep-clones this onto the new
   * profile in place of the default empty ledger. This is the seam that
   * lets `reanalysisOrchestrator` carry iteration history across the
   * `createNew` boundary (without it, every re-analysis silently resets
   * the ledger to currentIteration=0 and loses prior taughtMoves and
   * iterations).
   *
   * Validation: `validateAndNormalizeIterationLedger` runs at the seed point inside
   * `createInitialProfile`; a corrupt seed throws fail-fast before any
   * layer runs.
   *
   * Producer: `reanalysisOrchestrator.triggerReanalysis()` captures
   * `this.coordinator.getProfile().iterationLedger` BEFORE invoking
   * `analyzeEssay`. Direct `analyzeEssay()` callers (cold first-pass)
   * leave it undefined → fresh empty ledger.
   *
   * Consumer: `createInitialProfile` (new optional input field).
   */
  priorIterationLedger?: IterationLedger;
  /**
   * D-1.10: how the iteration was triggered. Recorded on the IterationRecord
   * the orchestrator commits at iteration end. Defaults to `'first_pass'`
   * when absent (cold direct call to `analyzeEssay`). `reanalysisOrchestrator`
   * sets this to `'edit'` when an edit-understanding fired upstream, or
   * `'student_request'` when re-analysis was triggered without an edit.
   *
   * Used at commit time to populate `IterationRecord.triggeredBy` and to
   * gate the optional `editScope` field (only populated when triggeredBy
   * === 'edit').
   */
  triggeredBy?: IterationRecord['triggeredBy'];
  /**
   * D-1.10: the LLM-classified change types from upstream
   * `editUnderstandingService.understandEdit()`. Threaded through to populate
   * `IterationRecord.editScope.changeTypes` when triggeredBy === 'edit'.
   * Absent on first-pass and student-request triggers.
   *
   * Producer: `reanalysisOrchestrator.triggerReanalysis()` reads
   * `this.lastEditUnderstanding.changeTypes`.
   */
  editChangeTypes?: EditChangeType[];
  /**
   * D-1.11: escalation level set by `focusedAnalyzer` when re-analysis
   * triggered an escalation ladder step. Levels per
   * ITERATION_LOOP_DESIGN §6.4:
   *   0 — no escalation (focused / focused_structural / comprehensive ran clean)
   *   1 — re-walk affected paragraphs only
   *   2 — re-walk + neighbor sentences
   *   3 — re-walk + targeted lens re-runs
   *   4 — comprehensive escalation
   *
   * Threaded through to populate `IterationRecord.escalationLevel` (the
   * D-1.10 stub at analysisOrchestrator.ts ~line 1851 hardcodes 0). Absent
   * on first-pass; defaults to 0 when not threaded by the re-analysis
   * caller.
   *
   * Producer: `reanalysisOrchestrator.triggerReanalysis()` reads from
   *   `focusedResult.escalationLevel` when re-analysis ran focused-mode.
   * Consumer: `commitIterationRecord` (D-1.11 amendment).
   */
  focusedEscalationLevel?: 0 | 1 | 2 | 3 | 4;
  /**
   * D-1.11 DP-1: carry-forward decision for mode selection. Populated by
   * `reanalysisOrchestrator.processEditAndMaybeReanalyze` AFTER
   * FocusedAnalyzer.selectAnalysisMode runs but BEFORE analyzeEssay is
   * invoked. Threaded through here so analyzeEssay can append it to
   * `iterationLedger.recentDecisions[]` AFTER `incrementIteration` runs
   * (the append-time iteration validator requires the decision's
   * iteration number to equal the post-increment currentIteration).
   *
   * Shape: every CarryForwardDecision field EXCEPT `iteration` (which is
   * filled in by analyzeEssay at append time, since the iteration counter
   * is bumped inside this function, not at the caller).
   *
   * Absent on cold first-pass and on focused-mode reanalyses (those don't
   * call analyzeEssay so the decision has no iteration to attach to —
   * documented gap to be closed when a focused-mode IterationRecord
   * commit deliverable lands).
   */
  modeSelectionDecision?: Omit<CarryForwardDecision, 'iteration'>;
}

/** Complete pipeline result */
export interface PipelineResult {
  /** The complete essay profile */
  profile: Readonly<EssayProfile>;
  /** Whether the pipeline completed all layers */
  completedAllLayers: boolean;
  /** Highest layer that completed successfully */
  highestCompletedLayer: string;
  /** Cost breakdown */
  costSummary: CostSummary;
  /** Which layers succeeded */
  layersCompleted: string[];
  /** Which layers failed (with structured error details) */
  layersFailed: LayerError[];
  /** Computed improvement phase (from L3.5) */
  improvementPhase: ImprovementPhase | null;
  /** Profile confidence level */
  confidenceLevel: ConfidenceLevel;
  /** L5 annotation result (ephemeral — not stored in profile) */
  annotations: L5AnnotationResult | null;
  /** L4 paragraph score matrix (5-dimensional scoring) */
  scoreMatrix: ParagraphScoreMatrix | null;
  /** L4 coherence report (cross-profile contradiction detection) */
  coherenceReport: CoherenceReport | null;
}

// ============================================================================
// COST TRACKER (internal)
// ============================================================================

class CostTracker {
  private entries: LayerCost[] = [];

  record(layer: string, cost: number, tokenUsage: TokenUsage, timingMs: number): void {
    this.entries.push({ layer, cost, tokenUsage, timingMs });
  }

  summarize(totalTimingMs: number): CostSummary {
    const totalTokenUsage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    let totalCost = 0;

    for (const entry of this.entries) {
      totalCost += entry.cost;
      totalTokenUsage.inputTokens += entry.tokenUsage.inputTokens;
      totalTokenUsage.outputTokens += entry.tokenUsage.outputTokens;
      totalTokenUsage.cacheReadTokens += entry.tokenUsage.cacheReadTokens;
      totalTokenUsage.cacheWriteTokens += entry.tokenUsage.cacheWriteTokens;
    }

    return {
      totalCost,
      totalTimingMs,
      layers: [...this.entries],
      totalTokenUsage,
    };
  }
}

// ============================================================================
// ANALYSIS ORCHESTRATOR V2
// ============================================================================

export class AnalysisOrchestrator {
  /**
   * Full analysis pipeline (Layers L1 through L5).
   *
   * This is the ONLY entry point for first-time analysis. Incremental re-analysis
   * after edits will be handled by a separate focusedReanalysis method (Phase 1L).
   *
   * @param input Pipeline input configuration
   * @returns Complete pipeline result with profile, costs, and annotations
   */
  async analyzeEssay(input: PipelineInput): Promise<PipelineResult> {
    const startTime = Date.now();
    const costTracker = new CostTracker();
    const layersCompleted: string[] = [];
    const layersFailed: LayerError[] = [];
    const includeAnnotations = input.includeAnnotations ?? true;

    const checkpointStore = input.checkpointStore ?? new InMemoryCheckpointStore();

    // ── D-1.10: hoist iteration-lifecycle values to the top so they're in
    // scope for every buildPartialResult call site (including L1-fatal at
    // ~line 397 before coordinator creation) and for the success-path
    // commit. `triggeredBy` is determined entirely from the input shape and
    // doesn't depend on any layer running. `iterationStartedAt` is derived
    // from `startTime` (already declared above), so the ISO conversion is
    // pure formatting.
    // eslint-disable-next-line no-silent-fallback -- mode-selection: structural default for cold-call analyzeEssay (where no caller context exists to specify the trigger). Re-analysis path (reanalysisOrchestrator.triggerReanalysis) ALWAYS supplies an explicit triggeredBy of 'edit' or 'student_request'; this default only fires for direct first-pass calls.
    const triggeredBy: IterationRecord['triggeredBy'] = input.triggeredBy ?? 'first_pass';
    const iterationStartedAt = new Date(startTime).toISOString();

    console.log(
      `[Orchestrator] Starting full analysis — essayId=${input.essayId}, ` +
      `type=${input.essayType}, textLength=${input.essayText.length}`,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Foundation (L1 + AO First Read parallel → L2 + L2.5 parallel)
    // ═══════════════════════════════════════════════════════════════════════

    // ── L1: First Impressions (FATAL) + AO First Read (non-fatal) — PARALLEL ──
    // GAP-4: AO First Read runs alongside L1 at zero added latency.
    // L1 failure is FATAL. AO First Read failure is non-fatal BY DESIGN —
    // every downstream consumer is null-guarded (profileTypes.ts:2354 types
    // aoFirstRead as optional+nullable; coachingService.ts:2799/2876,
    // edgeProtocol.ts:157, presentation/renderAnalysisForStudent.ts:151
    // all skip cleanly when absent). On rejection we emit a structured
    // telemetry event for the audit trail and push to layersFailed[] —
    // this is NOT charter-banned graceful degradation, because no
    // fake/placeholder data is injected; consumers see the genuine
    // "AO read absent" state. [F-2 closure 2026-04-29.]
    let l1Result: FirstImpressionsResult;
    let aoFirstReadResult: AOFirstReadResult | null = null;

    const [l1Settled, aoSettled] = await Promise.allSettled([
      firstImpressionsService.analyze(input.essayText),
      runAOFirstRead(input.essayText),
    ]);

    // Handle L1 (FATAL on failure)
    if (l1Settled.status === 'rejected') {
      const msg = l1Settled.reason instanceof Error ? l1Settled.reason.message : String(l1Settled.reason);
      console.error('[Orchestrator] L1 FATAL:', msg);
      layersFailed.push(this.buildLayerError('L1', l1Settled.reason, 0));
      return await this.buildPartialResult(null, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }
    l1Result = l1Settled.value;
    costTracker.record('L1', l1Result.cost, l1Result.tokenUsage, l1Result.timingMs);
    layersCompleted.push('L1');
    console.log(
      `[Orchestrator] L1 complete: ${l1Result.impressions.length} paragraphs, ` +
      `cost=$${l1Result.cost.toFixed(4)}, time=${l1Result.timingMs}ms`,
    );

    // Handle AO First Read (non-fatal by design — see block comment above).
    if (aoSettled.status === 'fulfilled') {
      aoFirstReadResult = aoSettled.value;
      costTracker.record('AOFirstRead', aoFirstReadResult.cost, aoFirstReadResult.tokenUsage, aoFirstReadResult.timingMs);
      console.log(
        `[Orchestrator] AO First Read complete: putDownRisk=${aoFirstReadResult.firstRead.putDownRisk}, ` +
        `cost=$${aoFirstReadResult.cost.toFixed(4)}, time=${aoFirstReadResult.timingMs}ms`,
      );
    } else {
      // [F-2 closure 2026-04-29] Pre-fix this branch only `console.warn`-ed
      // and silently set aoFirstReadResult=null — invisible to the audit
      // trail and to the orchestrator's own layersFailed ledger. Now we:
      //   1. Emit a structured `status:'failed'` telemetry event so the
      //      iterationLedger / external observers see the rejection.
      //   2. Push to layersFailed[] for parity with L1's failure path
      //      (see line 449), so PipelineResult.layersFailed callers get
      //      a uniform shape regardless of which layer rejected.
      //   3. Preserve the existing `aoFirstReadResult = null` semantic
      //      (no assignment — it was already null at declaration).
      // iteration=-1 is the documented sentinel for "pre-iteration step"
      // (matches emitStepFailure's removed sentinel pattern). AO First
      // Read runs before incrementIteration (line 521) and before the
      // coordinator is constructed (line 493), so no live iteration
      // counter exists yet. The telemetry consumer can filter iteration
      // < 1 if it only cares about per-iteration steps; the audit trail
      // still has the rejection on record.
      const errMsg = aoSettled.reason instanceof Error
        ? aoSettled.reason.message
        : String(aoSettled.reason);
      console.warn(`[Orchestrator] AO First Read failed (non-fatal): ${errMsg}`);
      emitIterationEvent(input.essayId, {
        iteration: -1,
        step: 'AOFirstRead',
        status: 'failed',
        error: {
          message: errMsg,
          code: 'ao_first_read_rejected',
          context: {
            nonFatal: true,
            downstreamBehavior:
              'profile.aoFirstRead remains null; all consumers null-guarded.',
          },
        },
        timestamp: new Date().toISOString(),
      });
      layersFailed.push(this.buildLayerError('AOFirstRead', aoSettled.reason, 0));
    }

    // ── Parse essay structure from L1 output ──
    // Fix A3.3: Derive paragraph texts from the original essay text to preserve formatting.
    // Split on double-newlines to get raw paragraphs, then align positionally with L1 impressions.
    // Fall back to joining sentence texts when there is no corresponding raw paragraph.
    const rawParagraphs = input.essayText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paragraphTexts = l1Result.impressions.map((imp, idx) =>
      rawParagraphs[idx]?.trim() ?? imp.sentences.map((s) => s.text).join(' '),
    );
    const sentenceTexts = l1Result.impressions.map((imp) =>
      imp.sentences.map((s) => s.text),
    );
    const wordCount = input.essayText.split(/\s+/).filter(Boolean).length;

    // ── Create the coordinator with an empty profile ──
    // Round 7 P0 (D4-H1): thread essayId through so checkpoint writes
    // target the right `essay_understanding` row. Previously the
    // coordinator defaulted essayId to '' and Supabase upserts silently
    // failed — no Round-7 signal ever reached the DB.
    const coordinator = EssayProfileCoordinator.createNew({
      essayId: input.essayId,
      essayText: input.essayText,
      paragraphTexts,
      sentenceTexts,
      metadata: {
        essayType: input.essayType,
        wordCount,
        promptText: input.promptText,
      },
      checkpointStore,
      // D-1.10: thread the prior-iteration ledger from re-analysis callers.
      // When absent (cold first-pass), createInitialProfile uses the default
      // empty ledger block. When present, the ledger is validated and
      // deep-cloned onto the new profile, preserving iteration history
      // across the createNew boundary.
      priorIterationLedger: input.priorIterationLedger,
    });

    // ── D-1.10: Iteration lifecycle — entry increment ───────────────────
    // Closes Dead Wire #1 (incrementIteration had zero production callers
    // before this step). The increment happens AFTER the coordinator is
    // built (so the profile has an iterationLedger to mutate) and BEFORE
    // any layer-applying coordinator mutation (applyFirstImpressions on
    // line ~449), so every layer that reads getCurrentIteration sees the
    // post-increment value. `triggeredBy` and `iterationStartedAt` were
    // hoisted to the top of analyzeEssay so they're in scope for every
    // buildPartialResult call site (including L1-fatal before this point).
    incrementIteration(coordinator.getProfile(), triggeredBy);

    // ── D-1.11 DP-1: append the mode-selection CarryForwardDecision ──────
    // The decision was made by FocusedAnalyzer.selectAnalysisMode upstream
    // (in reanalysisOrchestrator.processEditAndMaybeReanalyze, BEFORE this
    // function ran). The decision was threaded through `input.modeSelectionDecision`
    // (every CarryForwardDecision field except `iteration`); we fill in
    // the iteration here, post-increment. Absent on cold first-pass
    // (no mode-selection happened) and on focused-mode reanalyses (which
    // don't go through analyzeEssay so the decision can't be attached
    // to a new IterationRecord — documented gap, deferred to a future
    // focused-mode iteration commit deliverable).
    if (input.modeSelectionDecision) {
      const currentIter = getCurrentIteration(coordinator.getProfile());
      safeAppendCarryForwardDecision(input.essayId, coordinator.getProfile(), {
        ...input.modeSelectionDecision,
        iteration: currentIter,
      });
    }

    // ── Seed prior findings for re-analysis evolution (BEFORE any layer runs) ──
    if (input.priorFindings && input.priorFindings.length > 0) {
      coordinator.seedPriorFindings(input.priorFindings);
    }

    // ── Apply L1 impressions to profile ──
    coordinator.applyFirstImpressions(l1Result.impressions);

    // ── Apply AO First Read to profile (if available) ──
    if (aoFirstReadResult) {
      const profile = coordinator.getProfile();
      (profile as { aoFirstRead?: typeof aoFirstReadResult.firstRead | null }).aoFirstRead = aoFirstReadResult.firstRead;
    }

    // ── L2 + L2.5 in parallel (FAIL-FAST: abort if either fails) ──
    let structuralMap: StructuralCartography;
    let scoutOutput: ConnectionScoutOutput;

    try {
      const [l2Result, l25Result] = await Promise.all([
        this.runL2(input.essayText, l1Result.impressions, costTracker),
        this.runL2_5(input.essayText, l1Result.impressions, costTracker),
      ]);

      if (!l2Result || !l25Result) {
        throw new Error('L2 or L2.5 returned null result');
      }

      structuralMap = l2Result.cartography;
      coordinator.applyStructuralCartography(structuralMap);
      layersCompleted.push('L2');
      console.log(
        `[Orchestrator] L2 complete: arc=${structuralMap.arcType}, ` +
        `cost=$${l2Result.cost.toFixed(4)}`,
      );

      scoutOutput = l25Result.scoutOutput;
      coordinator.applyScoutLeads(scoutOutput);
      layersCompleted.push('L2.5');
      console.log(
        `[Orchestrator] L2.5 complete: ` +
        `${scoutOutput.repeatedElements.length} repeated, ` +
        `${scoutOutput.tonalShifts.length} shifts, ` +
        `${scoutOutput.structuralEchoes.length} echoes, ` +
        `cost=$${l25Result.cost.toFixed(4)}`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L2/L2.5', error, costTracker.summarize(0).totalCost));
      return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }

    // ── Checkpoint after Phase 1 ──
    await this.safeCheckpoint(coordinator, 'after_l1_l2');

    // ── Port A3 (Wave-1a gap-fix): detect PIQ prompt type once per essay ──
    // Runs when essayType==='piq' so profile.index.piqPromptType is populated
    // before L3.5 reads it to activate PIQ_MODE. Without this the PIQ_MODE
    // block + 13-dim rubric + G3 PIQ dimension anchors are all dormant for
    // every PIQ essay (silent no-op). NON-BLOCKING: detectPIQType is a pure
    // keyword-match over the essay text, but wrapped in try/catch for safety.
    if (input.essayType === 'piq') {
      await this.computeAndWritePiqPromptType(coordinator, input.essayText);
    }

    // ── Port F2 (Wave-1b): compute aiRiskSignal once per essay ──
    // Gated on ENABLE_AI_RISK_SIGNAL (opt-in until the ESL A/B confirms
    // FP ≤ 10% per Verdict §6 Q6). Runs between L1/L2 and L3 so the signal
    // is in place before L3.75's Phase A reads profile.index.aiRiskSignal
    // as a diagnostic prior inside its INTENTIONALITY CALIBRATION block.
    // NON-BLOCKING: a scorer throw is caught and logged inside the helper;
    // the pipeline continues with the signal absent (pre-port-identical).
    await this.computeAndWriteAiRiskSignal(coordinator, input.essayText);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Sequential Deep Walk (L3 — FAIL-FAST)
    // ═══════════════════════════════════════════════════════════════════════

    let l3Result: L3WalkResult;
    try {
      const profile = coordinator.getProfile();

      // Step 6 (Option 5 architecture, 2026-05-03): essay-level L3 walk
      // replaces the per-paragraph sequential walk. One Sonnet call with
      // full-essay context produces all paragraph summaries + findings +
      // connections + gap candidates simultaneously. Step 5 isolated test
      // on Crochet showed 12 findings (vs 0 from per-paragraph) and $0.16
      // cost (vs $0.46). Adapter translates the essay-level output into
      // the legacy per-paragraph L3WalkResult shape so the existing
      // applyUnderstandingWalkStep loop, finding-store routing, connection
      // mutator, and downstream layers work unchanged.
      //
      // Step 9 (2026-05-04): re-analysis context + prior FindingStore now
      // threaded into the essay-level walk. On first analyses (no
      // reanalysisBrief, empty findingStore) both render as empty strings
      // — pre-Step-9 behavior preserved. On re-analysis they front-load
      // the "what changed" framing and expose prior finding IDs for
      // buildsOn/relatedTo edges, mirroring the legacy walk's contract.
      let essayWalkReanalysisContext: string | undefined;
      if (input.reanalysisBrief) {
        const brief = input.reanalysisBrief;
        const staleLines = brief.staleAreas.map((a) => `• ${a}`).join('\n');
        essayWalkReanalysisContext = `${brief.summaryForPrompt}${
          staleLines ? `\n\nSTALE AREAS:\n${staleLines}` : ''
        }`;
      }
      const essayWalkFindingStore = coordinator.getFindingStore();

      const essayWalkResult = await runEssayLevelL3Walk(
        input.essayText,
        l1Result.impressions,
        structuralMap,
        scoutOutput,
        profile as EssayProfile,
        {
          reanalysisContext: essayWalkReanalysisContext,
          findingStore:
            essayWalkFindingStore.size > 0 ? essayWalkFindingStore : undefined,
        },
      );

      l3Result = adaptEssayLevelOutputToL3WalkResult(
        essayWalkResult.output,
        essayWalkResult.cost,
        essayWalkResult.tokenUsage,
        essayWalkResult.timingMs,
      );

      // Apply each walk step to the coordinator
      for (const walkOutput of l3Result.walkOutputs) {
        coordinator.applyUnderstandingWalkStep(walkOutput);
      }

      // ── D-1.11 DP-3a: append walk findingEvolutions decisions ──────────
      // The walk LLM produces findingEvolutions[] for each paragraph
      // (W1.3 design — see UnderstandingWalkOutput.findingEvolutions).
      // Each evolution is a per-finding carry-forward decision: confirm
      // (carry), deepen (partial_refresh), or supersede (rederive). The
      // arbitrationMechanism is 'llm_judgment' — the walk LLM judged the
      // evolution based on new sentence-level understanding.
      const dp3aIter = getCurrentIteration(coordinator.getProfile());
      for (const walkOutput of l3Result.walkOutputs) {
        if (!walkOutput.findingEvolutions || walkOutput.findingEvolutions.length === 0) continue;
        for (const evo of walkOutput.findingEvolutions) {
          const decisionType: CarryForwardDecision['decision'] =
            evo.newMaturity === 'superseded' ? 'rederive' : 'partial_refresh';
          const supersedesNote = evo.supersedes ? ` (supersedes ${evo.supersedes})` : '';
          safeAppendCarryForwardDecision(input.essayId, coordinator.getProfile(), {
            iteration: dp3aIter,
            itemKey: evo.findingId,
            decision: decisionType,
            rationale: `walk maturity → ${evo.newMaturity}${supersedesNote}: ${evo.reasoning}`,
            costSavedIfCarry: 0, // bundled in walk cost; cost-attribution refinement is D-4.11+
            costSpentIfRederive: 0,
            arbitrationMechanism: 'llm_judgment',
          });
        }
      }

      // Scope 2 Phase 5: Harvest L3 improvement candidates from sentence
      // understandings into the candidate store. L3 emits at most one
      // candidate per sentence (prompt-constrained); total across the walk
      // is typically 3-10. These enter the store as lifecycleState='candidate'
      // with sourceLayer='L3' and flow through L4 consolidation in Phase 6.
      const l3Candidates = this.extractL3Candidates(l3Result);
      if (l3Candidates.length > 0) {
        coordinator.addImprovementCandidates(l3Candidates, { source: 'L3' });
      }

      costTracker.record('L3', l3Result.cost, l3Result.tokenUsage, l3Result.timingMs);
      layersCompleted.push('L3');

      console.log(
        `[Orchestrator] L3 complete: ${l3Result.walkOutputs.length} paragraphs walked, ` +
        `${l3Result.skippedParagraphs.length} skipped, ` +
        `${l3Result.backPropagations.length} back-props, ` +
        `${l3Candidates.length} improvement candidates harvested, ` +
        `cost=$${l3Result.cost.toFixed(4)}, time=${l3Result.timingMs}ms`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L3', error, costTracker.summarize(0).totalCost));
      await this.safeCheckpoint(coordinator, 'after_l3');
      return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }

    // ── Checkpoint after Phase 2 ──
    await this.safeCheckpoint(coordinator, 'after_l3');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Growth Cycle (L3.75 Iterative Synthesis — FAIL-FAST)
    //
    // Replaces the single L3.75 call with an iterative growth engine:
    //   synthesize → curate questions → dispatch deep dives → re-read → repeat
    // L3.75 judges convergence. System enforces budget + iteration caps only.
    // ═══════════════════════════════════════════════════════════════════════

    // ── Port A2 (Wave-1a): load prior StudentVoiceProfile ──
    // Feature-flagged and gated on a userId being supplied by the caller.
    // Failure to load is NON-FATAL — the pipeline proceeds with no prior,
    // producing pre-port-identical output. Only successful loads are threaded
    // into the growth cycle below.
    const priorVoiceProfile = await this.loadPriorVoiceProfile(input.userId);

    let growthReadingStrategy: ReadingStrategy | undefined;

    try {
      const growthResult = await this.runGrowthCycle(
        coordinator.getProfile() as EssayProfile,
        l3Result,
        input.essayText,
        costTracker,
        coordinator.getFindingStore(),
        undefined, // priorPhase
        coordinator,
        priorVoiceProfile,
        input.essayId,
      );

      // Apply the final synthesis to the profile
      coordinator.applyHolisticSynthesis(growthResult.finalSynthesis);
      growthReadingStrategy = growthResult.readingStrategy;

      // ── D-1.11 DP-3b: append synthesis findingEvolutions decisions ─────
      // L3.75's holistic synthesis can also produce findingEvolutions
      // (HolisticSynthesisOutput.findingEvolutions). Same shape and
      // semantics as DP-3a's walk evolutions; arbitrationMechanism is
      // 'llm_judgment' (the synthesis LLM produced the evolution).
      const dp3bIter = getCurrentIteration(coordinator.getProfile());
      const synthesisEvolutions = growthResult.finalSynthesis.findingEvolutions ?? [];
      for (const evo of synthesisEvolutions) {
        const decisionType: CarryForwardDecision['decision'] =
          evo.newMaturity === 'superseded' ? 'rederive' : 'partial_refresh';
        const supersedesNote = evo.supersedes ? ` (supersedes ${evo.supersedes})` : '';
        safeAppendCarryForwardDecision(input.essayId, coordinator.getProfile(), {
          iteration: dp3bIter,
          itemKey: evo.findingId,
          decision: decisionType,
          rationale: `L3.75 synthesis maturity → ${evo.newMaturity}${supersedesNote}: ${evo.reasoning}`,
          costSavedIfCarry: 0,
          costSpentIfRederive: 0,
          arbitrationMechanism: 'llm_judgment',
        });
      }

      // ── Port A2 (Wave-1a): persist derived voice back to voice_profiles ──
      // Fire-and-forget. If persistence fails, the analysis result still stands
      // — we never throw from this path. Catch + log only.
      this.persistDerivedVoice(input.userId, input.essayId, input.essayText);

      // Scope 2 Phase 5: Harvest L3.75 improvement candidates from the
      // craftAssessment.growthEdges[].pairedImprovement slots. L3.75 is the
      // only layer with full-essay architectural visibility, so candidates
      // here carry architectural reasoning that per-sentence candidates cannot.
      const l375Candidates = this.extractL375Candidates(growthResult.finalSynthesis);
      if (l375Candidates.length > 0) {
        coordinator.addImprovementCandidates(l375Candidates, { source: 'L3.75' });
      }

      // Record aggregate L3.75 cost
      costTracker.record('L3.75', growthResult.totalCost, {
        inputTokens: 0, outputTokens: 0,
        cacheReadTokens: 0, cacheWriteTokens: 0,
      }, Date.now() - startTime);
      layersCompleted.push('L3.75');

      console.log(
        `[Orchestrator] Growth cycle complete: ` +
        `${growthResult.growthState.iteration + 1} iterations, ` +
        `converged=${growthResult.growthState.isConverged}` +
        (growthResult.growthState.convergenceReason
          ? ` (${growthResult.growthState.convergenceReason})`
          : ' (llm_converged)') + `, ` +
        `cost=$${growthResult.totalCost.toFixed(4)}, ` +
        `${growthResult.growthState.activityLog.length} activity records, ` +
        `${l375Candidates.length} improvement candidates harvested`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L3.75', error, costTracker.summarize(0).totalCost));
      return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Analysis Pass (L3.5 — FAIL-FAST)
    // ═══════════════════════════════════════════════════════════════════════

    let l35Result: L35AnalysisResult;
    try {
      const profileForAnalysis = coordinator.getProfile();

      // W1.5: Pass FindingStore to L3.5 so analysis can reference findings by [F] labels
      const findingStoreForAnalysis = coordinator.getFindingStore();

      l35Result = await analysisPassService.analyzeAllParagraphs(
        profileForAnalysis as EssayProfile,
        input.reanalysisBrief?.staleAreas,
        findingStoreForAnalysis.size > 0 ? findingStoreForAnalysis : undefined,
        input.essayType,
        input.essayId,
      );

      // If any individual paragraphs failed within the layer, treat as failure
      if (l35Result.failedParagraphs.length > 0) {
        throw new Error(
          `L3.5 partial failure: ${l35Result.failedParagraphs.length} paragraphs failed: ` +
          l35Result.failedParagraphs.map((f) => `P${f.index}(${f.error})`).join(', '),
        );
      }

      // Apply each paragraph's analysis to the coordinator
      for (const paragraphAnalysis of l35Result.paragraphAnalyses) {
        coordinator.applyAnalysisPassResult(paragraphAnalysis);
      }

      // ── Apply computed improvement phase to profile BEFORE L5 starts ──
      coordinator.updateImprovementPhase(l35Result.improvementPhase);

      costTracker.record('L3.5', l35Result.cost, l35Result.tokenUsage, l35Result.timingMs);
      layersCompleted.push('L3.5');

      console.log(
        `[Orchestrator] L3.5 complete: ${l35Result.paragraphAnalyses.length} paragraphs analyzed, ` +
        `phase=${l35Result.improvementPhase.level}, ` +
        `cost=$${l35Result.cost.toFixed(4)}, time=${l35Result.timingMs}ms`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L3.5', error, costTracker.summarize(0).totalCost));
      await this.safeCheckpoint(coordinator, 'after_l3_5');
      return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }

    // ── Checkpoint after Phase 4 ──
    await this.safeCheckpoint(coordinator, 'after_l3_5');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Crystallization (L4 — FAIL-FAST)
    // ═══════════════════════════════════════════════════════════════════════

    let l4Result: L4CrystallizationResult;

    try {
      const profileForCrystal = coordinator.getProfile();

      // Detect prior North Star for re-crystallization evolution tracking
      const priorNorthStar = profileForCrystal.northStar?.lastUpdatedBy === 'L4'
        ? profileForCrystal.northStar
        : undefined;

      // Build FindingStore and ConnectionGraph for adversarial pass context
      const findingStoreForL4 = coordinator.getFindingStore();
      const connectionGraphForL4 = ConnectionGraph.fromArray(
        (profileForCrystal as EssayProfile).connections.all,
      );

      // Scope 2 Phase 6a: pass the candidate store into L4 so L4b can
      // consolidate instead of re-derive. crystallizer.ts fails fast if
      // the store is empty (should be impossible post-Phase-5).
      const candidateStoreForL4 = coordinator.getImprovementCandidateStore();

      l4Result = await crystallizerService.crystallize(
        profileForCrystal as EssayProfile,
        input.essayType,
        input.essayText,
        candidateStoreForL4,
        priorNorthStar,
        findingStoreForL4.size > 0 ? findingStoreForL4 : undefined,
        connectionGraphForL4.totalCount > 0 ? connectionGraphForL4 : undefined,
        input.essayId,
      );

      // applyNorthStar triggers checkpoint('after_l4') internally
      coordinator.applyNorthStar(l4Result.northStar);
      coordinator.applyScoreMatrix(l4Result.scoreMatrix);
      coordinator.applyCoherenceReport(l4Result.coherenceReport);

      // Scope 2 Phase 6a: drive the candidate lifecycle based on L4b's
      // consolidation decisions. Every candidate cited in a priority's
      // consolidatedFrom becomes `consolidated`; every active candidate
      // NOT cited becomes `superseded`. Candidates stay in the store
      // (not deleted) so Phase 8 can diagnose what L4b skipped.
      const coachingMap = l4Result.scoreMatrix.coachingMap;
      if (coachingMap) {
        const citedIds = new Set(
          coachingMap.priorities.flatMap((p) => p.consolidatedFrom ?? []),
        );
        const activeIds = candidateStoreForL4.getActive().map((c) => c.id);
        const consolidatedIds = activeIds.filter((id) => citedIds.has(id));
        const supersededIds = activeIds.filter((id) => !citedIds.has(id));

        coordinator.applyConsolidation(consolidatedIds, supersededIds);

        // Diagnostic: priorities with empty consolidatedFrom are ungrounded
        // (LLM invented them despite the prompt forbidding it). Log loudly.
        const ungroundedPriorities = coachingMap.priorities.filter(
          (p) => !p.consolidatedFrom || p.consolidatedFrom.length === 0,
        );
        if (ungroundedPriorities.length > 0) {
          console.warn(
            `[Orchestrator] L4b emitted ${ungroundedPriorities.length}/${coachingMap.priorities.length} ` +
              `ungrounded priorities (no consolidatedFrom). Phase 8 should flag these.`,
          );
        }

        // Diagnostic: unknown candidate IDs in consolidatedFrom indicate
        // LLM hallucination. Filter to known IDs for a count comparison.
        const storeIds = new Set(activeIds);
        const unknownCited = [...citedIds].filter((id) => !storeIds.has(id));
        if (unknownCited.length > 0) {
          console.warn(
            `[Orchestrator] L4b cited ${unknownCited.length} unknown candidate IDs (hallucinated). ` +
              `First 3: ${unknownCited.slice(0, 3).join(', ')}`,
          );
        }
      }

      costTracker.record('L4', l4Result.cost, l4Result.tokenUsage, l4Result.timingMs);
      layersCompleted.push('L4');

      console.log(
        `[Orchestrator] L4 complete: North Star crystallized, ` +
        `coherent=${l4Result.coherenceReport.isCoherent}, ` +
        `contradictions=${l4Result.coherenceReport.contradictions.length}, ` +
        `scoreMatrix=${l4Result.scoreMatrix.paragraphs.length} paragraphs, ` +
        `priorities=${coachingMap?.priorities.length ?? 0}, ` +
        `cost=$${l4Result.cost.toFixed(4)}, time=${l4Result.timingMs}ms`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L4', error, costTracker.summarize(0).totalCost));
      return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5.5: Contradiction Consumption (W4.4 — programmatic + LLM merge)
    // ═══════════════════════════════════════════════════════════════════════

    let contradictionAnnotationFlags: string[] = [];

    try {
      const profileForContradictions = coordinator.getProfile();

      // Step 1: Run programmatic contradiction detection
      const programmaticContradictions = detectProgrammaticContradictions(
        profileForContradictions as EssayProfile,
      );

      // Step 2: Merge with LLM-detected contradictions on the coherence report
      if (programmaticContradictions.length > 0) {
        const updatedReport = {
          ...l4Result.coherenceReport,
          programmaticContradictions,
        };
        coordinator.applyCoherenceReport(updatedReport);

        console.log(
          `[Orchestrator] W4.4: ${programmaticContradictions.length} programmatic contradiction(s) merged into coherence report`,
        );
      }

      // Step 3: Consume all programmatic contradictions
      if (programmaticContradictions.length > 0) {
        const findingStore = new FindingStore();
        const consumptionResult = consumeContradictions(programmaticContradictions, findingStore);
        contradictionAnnotationFlags = consumptionResult.annotationFlags;

        console.log(
          `[Orchestrator] W4.4: Contradiction consumption complete — ` +
          `${consumptionResult.findingsCreated.length} findings, ` +
          `${consumptionResult.annotationFlags.length} annotation flags, ` +
          `${consumptionResult.consumed} consumed`,
        );
      }
    } catch (error) {
      // [D-1.12 H5 closure 2026-04-29] Pre-fix this catch logged "(non-fatal)"
      // and continued silently. Failure means contradictions detected by L4
      // are NOT consumed into FindingStore + annotation flags NOT generated;
      // downstream L5 misses contradiction-aware annotations. Now: emit
      // structured iterationTelemetry (parity with F-2). Continue semantics
      // preserved — Phase 5.5 is genuinely downstream-optional within a
      // single iteration; the audit trail is the missing piece.
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Orchestrator] W4.4: Contradiction consumption failed (non-fatal):', msg);
      const iter = getCurrentIteration(coordinator.getProfile());
      emitIterationEvent(input.essayId, {
        iteration: iter,
        step: 'phase5_5_contradiction_consumption',
        status: 'failed',
        error: {
          message: msg,
          code: 'contradiction_consumption_failed',
          context: {
            downstreamBehavior:
              'Pipeline continues; L5 will not see contradiction-aware findings/flags from this iteration.',
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ═════════════════════════════════���═════════════════════════════════════
    // PHASE 5.75: W5.4a — Delta Synthesis for Blocking Contradictions
    // ═══════════════════════════════════════════════════════════════════════
    //
    // If L4 found blocking contradictions, derive the affected holistic
    // sections and trigger a targeted delta synthesis to resolve them.
    // Cap: 1 delta synthesis per pipeline run.

    let deltaSynthesisCount = 0;

    if (!l4Result.coherenceReport.isCoherent && deltaSynthesisCount < 1) {
      const blockingContradictions = l4Result.coherenceReport.contradictions
        .filter(c => c.severity === 'blocking');

      if (blockingContradictions.length > 0) {
        try {
          // Derive affected holistic sections from contradiction section references
          const affectedSections = this.deriveAffectedSections(blockingContradictions);

          if (affectedSections.length > 0) {
            const evidence = blockingContradictions
              .map(c => `${c.sectionA} claims "${c.claimA}" but ${c.sectionB} claims "${c.claimB}"`)
              .join('; ');

            const deltaRequest: DeltaSynthesisRequest = {
              targetSections: affectedSections,
              trigger: 'blocking_contradiction',
              evidence,
            };

            const profileForDelta = coordinator.getProfile();
            const deltaResult = await holisticSynthesisService.deltaSynthesize(
              deltaRequest,
              profileForDelta,
            );

            coordinator.applySectionLevelSynthesis(deltaResult.output);
            deltaSynthesisCount++;

            costTracker.record('delta_synthesis', deltaResult.cost, deltaResult.tokenUsage, deltaResult.timingMs);

            console.log(
              `[Orchestrator] W5.4a: Delta synthesis for blocking contradictions — ` +
              `sections=[${affectedSections.join(', ')}], ` +
              `isSubstantive=${deltaResult.output.isSubstantive}, ` +
              `cost=$${deltaResult.cost.toFixed(4)}`,
            );

            // ── D-1.11 DP-4: append delta-synthesis decisions ─────────────
            // One CarryForwardDecision per affected holistic section. The
            // arbitrationMechanism is 'comprehensive_rule' (the contradiction
            // detector — a deterministic rule applied over L4 output —
            // triggered the synthesis, not an LLM judgment). decision
            // type: 'rederive' if the synthesis output was substantive
            // (the section was meaningfully rewritten); 'partial_refresh'
            // otherwise (touched but largely preserved).
            const dp4Iter = getCurrentIteration(coordinator.getProfile());
            const dp4DecisionType: CarryForwardDecision['decision'] = deltaResult.output.isSubstantive
              ? 'rederive'
              : 'partial_refresh';
            const dp4PerSectionCost = deltaResult.cost / Math.max(1, affectedSections.length);
            for (const section of affectedSections) {
              safeAppendCarryForwardDecision(input.essayId, coordinator.getProfile(), {
                iteration: dp4Iter,
                itemKey: section,
                decision: dp4DecisionType,
                rationale:
                  `delta synthesis triggered by blocking contradiction; isSubstantive=${deltaResult.output.isSubstantive}`,
                costSavedIfCarry: 0,
                costSpentIfRederive: dp4PerSectionCost,
                arbitrationMechanism: 'comprehensive_rule',
              });
            }
          }
        } catch (error) {
          // [D-1.12 H6 closure 2026-04-29] Pre-fix this catch was silent;
          // when blocking contradictions can't be resolved by delta synthesis,
          // the contradictions remain in the coherence report but no synthesis
          // ran and no DP-4 decisions were appended. Now: emit telemetry so
          // the audit trail captures the resolution failure. Continue
          // semantics preserved.
          const msg = error instanceof Error ? error.message : String(error);
          console.error('[Orchestrator] W5.4a: Delta synthesis failed (non-fatal):', msg);
          const iter = getCurrentIteration(coordinator.getProfile());
          emitIterationEvent(input.essayId, {
            iteration: iter,
            step: 'phase5_75_w54a_delta_synthesis',
            status: 'failed',
            error: {
              message: msg,
              code: 'blocking_contradiction_synthesis_failed',
              context: {
                blockingContradictionCount: blockingContradictions.length,
                downstreamBehavior:
                  'Pipeline continues with existing holistic sections; blocking contradictions remain unresolved.',
              },
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5.55: Essay-level emission decision (Option 5 rebuild — Phase B)
    //
    // Single Sonnet call that reads ALL per-layer artifacts (L3 walk
    // findings + gap candidates, L3.5 weaknesses/growthEdges, L3.75
    // holistic synthesis, L4 northStar, FindingStore stuck findings) +
    // the full essay text + concept library, and decides 0-3 specifics-
    // need emissions for the essay. Replaces the prior round 1.8
    // architecture's 5 distributed emission services + D-2.6 maturity-
    // refresh + L3 post-walk consolidation. Single decision point with
    // full context = naturally enforces the 3-cap, prevents concept tag
    // fragmentation, eliminates cross-layer anti-repetition coordination.
    //
    // Silence path: when there are zero gap candidates AND no stuck
    // findings, skips the LLM call entirely (saves ~$0.25).
    //
    // Failure semantics: wrapped in try/catch — Phase B failure does NOT
    // block Phase 5.6 aggregation or Phase 6 L5. Empty
    // profile.specificsNeedEmissions falls through to Phase 5.6 silence
    // path automatically.
    // ═══════════════════════════════════════════════════════════════════════
    try {
      const profileForPhaseB = coordinator.getProfile();
      const findingStoreForPhaseB = coordinator.getFindingStore();
      if (findingStoreForPhaseB) {
        const { runEssayLevelEmissionPass, applyEssayLevelEmissionsToProfile } = await import(
          './essayLevelEmissionService'
        );
        const phaseBResult = await runEssayLevelEmissionPass(
          profileForPhaseB,
          findingStoreForPhaseB,
        );
        applyEssayLevelEmissionsToProfile(profileForPhaseB, phaseBResult.emissions);
        if (phaseBResult.emissions.length > 0 || phaseBResult.cost > 0) {
          costTracker.record(
            'phase_b_essay_level_emissions',
            phaseBResult.cost,
            phaseBResult.tokenUsage,
            phaseBResult.timingMs,
          );
          console.log(
            `[Orchestrator] Phase 5.55 essay-level emissions: ` +
              `${phaseBResult.emissions.length} emissions, ` +
              `cost=$${phaseBResult.cost.toFixed(4)}, time=${phaseBResult.timingMs}ms`,
          );
        }
      }
    } catch (phaseBError) {
      const msg =
        phaseBError instanceof Error ? phaseBError.message : String(phaseBError);
      console.error(
        '[Orchestrator] Phase 5.55 essay-level emission pass failed (non-blocking):',
        msg,
      );
      emitIterationEvent(input.essayId, {
        iteration: getCurrentIteration(coordinator.getProfile()),
        step: 'phase5_55_essay_level_emissions',
        status: 'failed',
        error: {
          message: msg,
          code: 'phase_b_essay_level_emissions_failed',
          context: {
            downstreamBehavior:
              'Phase 5.6 aggregation continues with empty profile.specificsNeedEmissions; queue gets no new specifics-need mints this iteration but other queue mutations (curated questions from L3.75 growth cycle) still apply.',
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5.6: Specifics-need aggregation (reads from
    // profile.specificsNeedEmissions[] populated by Phase 5.55 above).
    // Pure deterministic dedup + queue mint — no LLM call. Failure caught
    // here surfaces telemetry; pipeline continues to Phase 6.
    // ═══════════════════════════════════════════════════════════════════════
    {
      const profileForAgg = coordinator.getProfile();
      const aggIter = getCurrentIteration(profileForAgg);
      const { runSpecificsNeedAggregationWithTelemetry } = await import(
        './specificsNeedAggregatorIntegration'
      );
      runSpecificsNeedAggregationWithTelemetry(
        profileForAgg,
        aggIter,
        input.essayId,
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: Annotations (L5 — FAIL-FAST)
    // ═══════════════════════════════════════════════════════════════════════

    let l5Result: L5AnnotationResult | null = null;

    if (includeAnnotations) {
      try {
        const profileForAnnotations = coordinator.getProfile();
        // W7.1: Pass FindingStore to L5 for per-paragraph finding references
        const findingStoreForL5 = coordinator.getFindingStore();
        // Scope 2 Phase 6a: pass the candidate store so L5 can resolve
        // priority.consolidatedFrom IDs back to full candidate observations
        // when rendering the coaching map lineage block.
        const candidateStoreForL5 = coordinator.getImprovementCandidateStore();

        // D-1.8: Carry-forward intelligence — replace the literal `undefined`
        // with the per-paragraph priorAnnotations Map composed from the
        // iterationLedger's prior taughtMoves[]. The composer encapsulates
        // the full D-1.6/D-1.7/D-1.8 surface (snapshot lookup → diff →
        // remap → per-paragraph edits → landing detection → grouping). On
        // iter ≤ 1 or missing snapshot, returns `undefined` (structural
        // absence — L5 prompt at deepAnnotationService.ts:1402–1416 already
        // handles this branch). On any helper throw, propagates to Phase 6's
        // existing catch → buildPartialResult per the no-fallback charter.
        const { buildPriorAnnotationsForOrchestrator } = await import('./priorAnnotationsBuilder');
        const priorAnnotationsForL5 = await buildPriorAnnotationsForOrchestrator({
          essayId: input.essayId,
          profile: profileForAnnotations,
          currentEssayText: input.essayText,
          priorEssayTextOverride: input.priorEssayText,
          editSignificance: input.editSignificance,
        });

        // ── D-1.11 DP-2: append per-paragraph priorAnnotations decisions ──
        // For each paragraph that received a priorAnnotationContext, the
        // composer made a 'partial_refresh' choice (carry the prior context
        // forward + walk the paragraph fresh in this iteration). For
        // paragraphs the composer DIDN'T cover (no entry in priorAnnotationsForL5),
        // they're either unchanged-with-no-priors (no decision needed) or
        // first-pass / pre-D-1.10-snapshot iterations (priorAnnotationsForL5
        // is undefined; no decisions to record). We only emit decisions
        // for paragraphs we ACTUALLY composed prior context for.
        if (priorAnnotationsForL5 instanceof Map) {
          const dp2Iter = getCurrentIteration(profileForAnnotations);
          for (const [paragraphIndex, ctx] of priorAnnotationsForL5) {
            const addressedCount = ctx.priorAnnotations.filter((a) => a.addressedByEdit).length;
            const totalCount = ctx.priorAnnotations.length;
            safeAppendCarryForwardDecision(input.essayId, profileForAnnotations as EssayProfile, {
              iteration: dp2Iter,
              itemKey: `L5.P${paragraphIndex}.annotations`,
              decision: 'partial_refresh',
              rationale:
                `priorAnnotations carried into L5 prompt (paragraph ${paragraphIndex}): ` +
                `${totalCount} prior moves, ${addressedCount} marked addressed by edit`,
              costSavedIfCarry: 0,
              costSpentIfRederive: 0,
              arbitrationMechanism: 'validity_test',
            });
          }
        }

        l5Result = await deepAnnotationService.generateAnnotations(
          profileForAnnotations as EssayProfile,
          input.reanalysisBrief,
          contradictionAnnotationFlags,
          findingStoreForL5.size > 0 ? findingStoreForL5 : undefined,
          growthReadingStrategy,
          priorAnnotationsForL5,
          candidateStoreForL5,
          input.essayId,
        );

        costTracker.record('L5', l5Result.cost, l5Result.tokenUsage, l5Result.timingMs);
        layersCompleted.push('L5');

        console.log(
          `[Orchestrator] L5 complete: ${l5Result.annotationCount} annotations ` +
          `(${l5Result.crossParagraphAnnotations.length} cross-paragraph), ` +
          `phase=${l5Result.phase}, ` +
          `cost=$${l5Result.cost.toFixed(4)}, time=${l5Result.timingMs}ms`,
        );

        // ── D-1.10: buffer L5-output TaughtMoves ──────────────────────────
        // Closes Dead Wire #2 (bufferTaughtMoves had zero production callers
        // before this step). Transform the L5AnnotationResult into TaughtMove
        // objects (one per paragraph annotation + essay-level + cross-para)
        // and push to the iteration's transient buffer. The buffer is
        // flushed onto profile.iterationLedger.taughtMoves[] at iteration
        // end via commitIterationRecord. If commit fails, the buffer is
        // preserved (Step 6 design) so a forensic recovery can still find
        // the moves in memory.
        //
        // Failure surface: bufferTaughtMoves throws ONLY on invariant
        // violations (negative iter, non-array moves) — both programmer
        // errors. Not silently degraded. The throw routes through the
        // surrounding try/catch at Phase 6 → buildPartialResult per the
        // no-fallback charter (Q9 in the D-1.10 plan).
        const currentIter = getCurrentIteration(coordinator.getProfile());
        const taughtMoves = l5AnnotationsToTaughtMoves(
          l5Result.paragraphAnnotations,
          l5Result.essayLevelAnnotations,
          l5Result.crossParagraphAnnotations,
          currentIter,
        );
        // D-1.11 Step 0: essay-keyed buffer prevents cross-essay collision
        // when two essays at iter=N run in the same process (defense-in-depth
        // before any future shared-worker refactor).
        bufferTaughtMoves(input.essayId, currentIter, taughtMoves);
        console.log(
          `[Orchestrator] D-1.10: buffered ${taughtMoves.length} TaughtMoves for ` +
            `essayId=${input.essayId} iter=${currentIter}`,
        );

        // Checkpoint after L5
        await this.safeCheckpoint(coordinator, 'after_l5');
      } catch (error) {
        layersFailed.push(this.buildLayerError('L5', error, costTracker.summarize(0).totalCost));
        return await this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime, iterationStartedAt, triggeredBy, input);
      }
    } else {
      console.log('[Orchestrator] L5 skipped: annotations disabled');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 7: Build Improvement Manifest
    //
    // Every finding, growth edge, red flag, and AO observation maps to at
    // least one ImprovementEntry. The conversator workshops these with the
    // student. Understanding is the fuel — improvements are the output.
    // ═══════════════════════════════════════════════════════════════════════

    // classified: systemic
    //   Manifest generation is load-bearing for downstream coaching. Silent
    //   fallback to "no manifest" was the MISCLASSIFIED case that led to
    //   (a) the reference audit's "(no manifest on post-coaching profile)"
    //   observation and (b) coaching running without a priority queue, which
    //   erased the entire Scope 1-3 value prop. Now: fail-fast with structured
    //   context. Callers can catch PipelineError at the pipeline boundary if
    //   they want to degrade; the orchestrator no longer silently degrades.
    try {
      const profileForManifest = coordinator.getProfile() as EssayProfile;

      // ── Root-cause fix for S3/V14/S6/partial-S5 ──
      // Force a fresh candidate-store snapshot onto the profile before
      // buildImprovementManifest runs. Without this, L4 priorities'
      // `consolidatedFrom` candidate-ID lookups return null because the
      // snapshot on the profile is only synced inside checkpoint(). The
      // drift between checkpoint cadence and manifest-build timing produced
      // the "4/9 items with technique" regression in the reference audit.
      (profileForManifest as EssayProfile).improvementCandidateSnapshot =
        coordinator.snapshotCandidateStore();

      const manifest = this.buildImprovementManifest(
        profileForManifest,
        coordinator.getFindingStore(),
        input.essayText,
        input.essayType,
      );

      // ── Efficiency: plumb L5 output into the manifest ──
      // L5 spends ~$0.50/run producing rewriteExample + transferablePrinciple
      // + stakes + wordEconomyCut per annotation. Pre-merger, these fields
      // never reached coaching. Now they seed matching manifest items BEFORE
      // research enrichment runs, so L5's essay-specific rewrites take
      // precedence over the research DB's generic BEFORE/AFTER/PRINCIPLE
      // boilerplate. Non-destructive: only fills null fields.
      if (l5Result) {
        try {
          const mergeStats = mergeL5IntoManifest(manifest, l5Result);
          if (mergeStats.itemsMerged > 0) {
            console.log(
              `[Orchestrator] L5→Manifest merge: ${mergeStats.itemsMerged} items, ` +
                `demonstrations=${mergeStats.demonstrationsFilled}, ` +
                `techniques=${mergeStats.techniquesFilled}, ` +
                `stakes=${mergeStats.stakesFilled}`,
            );
          }
        } catch (err) {
          // classified: recoverable — merger is an enhancement pass; if it
          // fails, manifest still has its structural content. Log loudly.
          console.warn(
            '[Orchestrator] L5→Manifest merge failed (non-fatal):',
            err instanceof Error ? err.message : err,
          );
        }
      }

      profileForManifest.improvementManifest = manifest;

      const withTechnique = manifest.items.filter(i => i.technique).length;
      console.log(
        `[Orchestrator] ImprovementManifest: ${manifest.items.length} items ` +
          `(${withTechnique}/${manifest.items.length} with technique) ` +
          `from ${manifest.sources.join(', ')}`,
      );
    } catch (error) {
      // classified: systemic
      // Fail-fast — wrap non-PipelineError exceptions so callers get
      // structured diagnostics. Manifest generation is load-bearing for
      // coaching; silent fallback erased the entire Scope 1-3 value prop.
      if (error instanceof PipelineError) {
        console.error('[Orchestrator] ImprovementManifest generation failed:', error.toString());
        throw error;
      }
      const wrapped = PipelineError.wrap(
        'manifest_projection',
        error instanceof Error ? error : new Error(String(error)),
        'ImprovementManifest generation failed',
      );
      console.error('[Orchestrator] ImprovementManifest generation failed:', wrapped.toString());
      throw wrapped;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUILD RESULT
    // ═══════════════════════════════════════════════════════════════════════

    const totalTimingMs = Date.now() - startTime;
    const finalProfile = coordinator.getProfile();
    const costSummary = costTracker.summarize(totalTimingMs);

    // Update profile metadata with total cost
    // (done via coordinator mutation path — the metadata.totalAnalysisCost
    // should be accumulated by the coordinator's afterMutation hooks)

    const allExpectedLayers = includeAnnotations
      ? ['L1', 'L2', 'L2.5', 'L3', 'L3.75', 'L3.5', 'L4', 'L5']
      : ['L1', 'L2', 'L2.5', 'L3', 'L3.75', 'L3.5', 'L4'];
    const completedAllLayers = allExpectedLayers.every((l) => layersCompleted.includes(l));

    // ── Pipeline completion cost summary ──
    const totalCalls = costSummary.layers.reduce((sum, _) => sum + 1, 0);
    const layerSummaries = costSummary.layers.map((l) => `${l.layer}: $${l.cost.toFixed(3)}`).join(' | ');
    console.log(
      `[EssayIntelligence] COMPLETE: ${totalCalls} layer groups, $${costSummary.totalCost.toFixed(4)} total\n` +
      `  ${layerSummaries}`,
    );
    console.log(
      `[Orchestrator] Pipeline complete — ` +
      `layers=${layersCompleted.join(',')} | ` +
      `failed=${layersFailed.map((f) => f.layer).join(',') || 'none'} | ` +
      `cost=$${costSummary.totalCost.toFixed(4)} | ` +
      `time=${totalTimingMs}ms`,
    );

    const computedConfidence = this.computeConfidenceLevel(layersCompleted, l4Result.coherenceReport);

    // ── Phase 1.4 root-cause fix: mirror computed confidence onto the profile.
    // Previously this was computed only as a PipelineResult field, never written
    // back to `profile.index.confidenceLevel` or `profile.metadata.confidenceLevel`,
    // so persisted profiles always stored `confidenceLevel: 'initial'`. On the
    // next edit, FocusedAnalyzer's selectAnalysisMode() hit Rule 1 ("confidence
    // =initial → comprehensive") and routed every edit to full re-analysis
    // (~$0.75 / 10min in the reference audit) even when the profile had clearly
    // completed L1→L5.
    //
    // Both fields must be set because refreshIndex() (essayProfileManager.ts:
    // 2605) copies metadata.confidenceLevel → index.confidenceLevel on every
    // mutation — updating only index would be clobbered by the next refresh.
    (finalProfile as EssayProfile).index.confidenceLevel = computedConfidence;
    (finalProfile as EssayProfile).metadata.confidenceLevel = computedConfidence;

    // ── D-1.10: commit IterationRecord at orchestrator end ────────────────
    // The success-path commit. NO try/catch here — the helper throws a
    // structured PipelineError on checkpoint failure, and the failure must
    // propagate to the caller so they see "iteration N did not persist;
    // rerun" with the inner cause. Per the no-fallback charter and the
    // plan's atomicity decision: in-memory ledger has the new record;
    // checkpoint failure leaves the persisted store at pre-iteration state;
    // caller decides whether to retry. This unblocks D-1.8 (snapshotText)
    // and D-1.11 (carryForwardSummary read paths).
    const successRationale =
      `${triggeredBy} iteration completed with layers=[${layersCompleted.join(',')}]` +
      (layersFailed.length > 0 ? `, failed=[${layersFailed.map((f) => f.layer).join(',')}]` : '');
    await this.commitIterationRecord(
      coordinator,
      costSummary,
      layersCompleted,
      layersFailed,
      iterationStartedAt,
      triggeredBy,
      input,
      successRationale,
    );

    return {
      profile: finalProfile,
      completedAllLayers,
      highestCompletedLayer: this.highestLayerCompleted(layersCompleted),
      costSummary,
      layersCompleted,
      layersFailed,
      improvementPhase: l35Result.improvementPhase,
      confidenceLevel: computedConfidence,
      annotations: l5Result,
      scoreMatrix: l4Result.scoreMatrix,
      coherenceReport: l4Result.coherenceReport,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE: Layer Runners
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run L2 (Structural Cartographer) — returns null on failure.
   */
  private async runL2(
    essayText: string,
    impressions: ParagraphFirstImpression[],
    costTracker: CostTracker,
  ): Promise<StructuralCartographyResult | null> {
    const result = await structuralCartographerService.analyze(essayText, impressions);
    costTracker.record('L2', result.cost, result.tokenUsage, result.timingMs);
    return result;
  }

  /**
   * Run L2.5 (Connection Scout) — returns null on failure.
   */
  private async runL2_5(
    essayText: string,
    impressions: ParagraphFirstImpression[],
    costTracker: CostTracker,
  ): Promise<ScoutPassResult | null> {
    const result = await scoutPassService.analyze(essayText, impressions);
    costTracker.record('L2.5', result.cost, result.tokenUsage, result.timingMs);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE: Growth Cycle (V2 L3.75)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run the iterative growth cycle for L3.75.
   *
   * Loop: synthesize → curate questions → dispatch deep dives → re-read
   *       → check convergence → repeat
   *
   * L3.75 owns convergence. System enforces budget + iteration caps only.
   */
  private async runGrowthCycle(
    profile: EssayProfile,
    walkResult: L3WalkResult,
    essayText: string,
    costTracker: CostTracker,
    findingStore?: import('../findings/findingStore').FindingStore,
    priorPhase?: ImprovementPhase,
    coordinator?: EssayProfileCoordinator,
    priorVoiceProfile?: import('../../voiceProfile/types').StudentVoiceProfile | null,
    essayId?: string,
  ): Promise<{
    finalSynthesis: HolisticSynthesisOutput;
    readingStrategy: ReadingStrategy;
    growthState: GrowthCycleState;
    totalCost: number;
  }> {
    const state = initGrowthCycleState();

    let currentSynthesis: SynthesisIterationOutput | null = null;
    let cumulativeFindings: Finding[] = [
      ...profile.findings,
    ];

    // Gap 2: Seed from persistent question queue instead of ephemeral []
    const queueManager = new QuestionQueueManager(profile.questionQueue ?? []);

    while (!state.isConverged && state.iteration < MAX_ITERATIONS) {
      // ── Step 1: L3.75 synthesizes + validates + curates ──
      // Gap 2: Feed open questions from persistent queue (not ephemeral curated queue)
      const openQuestions = currentSynthesis
        ? currentSynthesis.questionCuration.curatedQueue.map(cq => cq.question)
        : queueManager.getOpenQuestions();

      const iterResult: SynthesisIterationResult = await holisticSynthesisService.synthesizeIteration({
        essayText,
        profile,
        walkEvolution: walkResult.holisticEvolution,
        previousSynthesis: currentSynthesis?.synthesis ?? null,
        previousReadingStrategy: currentSynthesis?.readingStrategy ?? null,
        questionQueue: openQuestions,
        cumulativeFindings,
        activityLog: state.activityLog,
        priorPhase,
        iterationNumber: state.iteration,
        budgetCeiling: state.budgetCeiling,
        budgetRemaining: state.budgetRemaining,
        findingStore,
        priorVoiceProfile,
        essayId,
      });

      state.budgetRemaining -= iterResult.cost;
      costTracker.record(
        `L3.75_iter_${state.iteration}`,
        iterResult.cost,
        iterResult.tokenUsage,
        iterResult.timingMs,
      );

      // Gap 2: Merge L3.75 curation into the persistent queue
      queueManager.mergeCuratedOutput(iterResult.output.questionCuration, state.iteration);

      // Build step record for activity log
      const synthStepResult: StepResult = {
        questionsResolved: iterResult.output.questionCuration.resolvedQuestions.length,
        questionsRaised: iterResult.output.questionCuration.curatedQueue.length,
        findingsAdded: iterResult.output.synthesis.newFindings?.length ?? 0,
        findingsDeepened: iterResult.output.synthesis.findingEvolutions?.filter(
          e => e.newMaturity === 'deepened' || e.newMaturity === 'confirmed',
        ).length ?? 0,
        findingsSuperseded: iterResult.output.synthesis.findingEvolutions?.filter(
          e => e.newMaturity === 'superseded',
        ).length ?? 0,
        sectionsUpdated: ['voiceIdentity', 'thematicArchitecture', 'narrativeStrategy',
          'characterRevelation', 'craftAssessment', 'emotionalTopography',
          'momentEarnednessMap', 'admissionsPositioning', 'entanglements', 'voiceMap'],
        cost: iterResult.cost,
        discoveryNote: iterResult.output.evolutionNarrative,
      };
      state.activityLog.push(buildStepRecord(`synthesis_iter_${state.iteration}`, synthStepResult));

      currentSynthesis = iterResult.output;

      // ── Step 1.5: Synthesize understanding prose (Gap 1) ──
      // One Sonnet call after each L3.75 iteration — produces the coherent narrative
      if (state.budgetRemaining >= MIN_BUDGET_FOR_STEP) {
        try {
          const topFindings = cumulativeFindings
            .filter(f => f.maturity !== 'superseded')
            .sort((a, b) => {
              const valueOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, contextual: 3, diagnostic: 4 };
              return (valueOrder[a.coachingValue] ?? 2) - (valueOrder[b.coachingValue] ?? 2);
            })
            .slice(0, 10);

          const understandingResult = await synthesizeUnderstandingProse({
            essayText,
            profile,
            readingStrategy: currentSynthesis.readingStrategy,
            topFindings,
            previousUnderstanding: profile.essayUnderstanding?.prose
              ? profile.essayUnderstanding
              : null,
          });

          // Update profile with the synthesized understanding
          profile.essayUnderstanding = understandingResult.understanding;

          state.budgetRemaining -= understandingResult.cost;
          costTracker.record(
            `understanding_prose_iter_${state.iteration}`,
            understandingResult.cost,
            understandingResult.tokenUsage,
            understandingResult.timingMs,
          );
        } catch (error) {
          console.warn(
            `[Orchestrator] Understanding prose synthesis failed (non-fatal):`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      // ── Step 2: Re-reads run BEFORE convergence check ──
      // Re-read findings enter the FindingStore (coaching's data source) and connections
      // enter the profile (router's data source). These are valuable even when L3.75
      // reports convergence. Running them before the convergence break ensures they
      // always execute.

      // ── Step 2a: Run re-reads L3.75 flagged ──
      // L3.75 curated these candidates — respect its ordering. Budget check stops when
      // we can't afford more. No hard cap beyond the budget backstop. (LLM-first Rule 2)
      for (const reRead of currentSynthesis.reReadCandidates) {
        if (state.budgetRemaining < MIN_BUDGET_FOR_STEP) break;

        try {
          const reReadResult = await runTargetedReRead(
            reRead.paragraph,
            essayText,
            profile,
            currentSynthesis.synthesis,
            currentSynthesis.readingStrategy,
            reRead.reason,
          );

          state.budgetRemaining -= reReadResult.cost;
          costTracker.record(
            `reread_P${reRead.paragraph}`,
            reReadResult.cost,
            reReadResult.tokenUsage,
            reReadResult.timingMs,
          );

          // Merge findings from re-read into cumulativeFindings AND findingStore
          let reReadFindingsAbsorbed = 0;
          if (reReadResult.findings.length > 0) {
            const newFindingObjects = reReadResult.findings.map((f, idx) => ({
              ...f,
              id: `FR${state.iteration}_${reRead.paragraph}_${idx}`,
              source: 'holistic_synthesis' as const,
              buildsOn: f.buildsOn ?? [],
              relatedTo: f.relatedTo ?? [],
              raisesQuestions: f.raisesQuestions ?? [],
              lineage: [],
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
            })) as Finding[];
            cumulativeFindings = mergeFindingsFromReRead(cumulativeFindings, newFindingObjects);

            // W3.4: Absorb findings into FindingStore so they aren't orphaned
            if (findingStore) {
              for (const finding of newFindingObjects) {
                try {
                  // Filter buildsOn/relatedTo to only IDs that exist in the store
                  // (LLM may reference IDs it generated that aren't in our store)
                  const safeBuildsOn = finding.buildsOn.filter(id => findingStore.has(id));
                  const safeRelatedTo = finding.relatedTo.filter(id => findingStore.has(id));
                  findingStore.add({
                    ...finding,
                    buildsOn: safeBuildsOn,
                    relatedTo: safeRelatedTo,
                  });
                  reReadFindingsAbsorbed++;
                } catch (e) {
                  console.warn(
                    `[Orchestrator] Failed to absorb re-read finding ${finding.id} into FindingStore: ` +
                    `${e instanceof Error ? e.message : String(e)}`,
                  );
                }
              }
              if (reReadFindingsAbsorbed > 0) {
                console.log(
                  `[Orchestrator] Absorbed ${reReadFindingsAbsorbed}/${newFindingObjects.length} ` +
                  `findings from re-read P${reRead.paragraph} into FindingStore`,
                );
              }
            }
          }

          // W3.4: Absorb connections from re-read into profile via ConnectionMutator
          // (duplicate detection, connectionRef management, mutation tracking)
          let reReadConnectionsAbsorbed = 0;
          if (reReadResult.newConnections.length > 0) {
            const connectionsToAdd = reReadResult.newConnections.map(conn => ({
              from: conn.from,
              to: conn.to,
              description: conn.description,
              reverseIllumination: conn.reverseIllumination,
              significance: conn.significance,
              strengthCategory: conn.strengthCategory,
              directionality: conn.directionality,
              discoveredBy: 'holistic_synthesis' as const,
            }));

            if (coordinator) {
              // Route through coordinator → ConnectionMutator for proper integrity
              const { connectionIds } = coordinator.addConnections(connectionsToAdd);
              reReadConnectionsAbsorbed = connectionIds.filter(id => id !== '').length;
            } else {
              // [D-1.12 H10 closure 2026-04-29] Pre-fix this branch warned
              // "(should not happen in normal pipeline)" then silently fell
              // back to direct profile.connections.all.push, bypassing
              // ConnectionMutator's duplicate detection + connectionRef
              // management. The "should not happen" guard is exactly the
              // place to fail loud — silent bypass of an integrity layer
              // is the dead-wire pattern the no-fallback charter exists to
              // prevent. Now we throw so the bug surfaces in tests / logs
              // instead of letting it whisper through into corrupt
              // connection state.
              throw new Error(
                `[Orchestrator] runGrowthCycle: coordinator is missing during re-read connection absorption. ` +
                  `This branch was previously a silent direct-push fallback that bypassed the ConnectionMutator ` +
                  `integrity layer. The orchestrator must always have a coordinator at this point in the pipeline; ` +
                  `arriving here indicates an upstream wiring bug. Halting per the no-fallback charter.`,
              );
            }

            if (reReadConnectionsAbsorbed > 0) {
              console.log(
                `[Orchestrator] Absorbed ${reReadConnectionsAbsorbed}/${reReadResult.newConnections.length} ` +
                `connections from re-read P${reRead.paragraph} into profile`,
              );
            }
          }

          const reReadStep: StepResult = {
            findingsAdded: reReadFindingsAbsorbed,
            cost: reReadResult.cost,
            discoveryNote: reReadResult.discoveryNote,
          };
          state.activityLog.push(buildStepRecord(`reread_P${reRead.paragraph}`, reReadStep));
        } catch (error) {
          console.warn(
            `[Orchestrator] Re-read P${reRead.paragraph} failed (non-fatal):`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      // ── Step 3.5: Maturity gap analysis (Gap 4) ──
      // Detect stuck findings and feed investigation questions into the persistent queue
      const maturityGaps = analyzeMaturityGaps(cumulativeFindings, state);
      if (maturityGaps.length > 0) {
        const gapQuestions = maturityGapsToQuestions(maturityGaps, state.iteration);
        for (const gq of gapQuestions) {
          queueManager.addQuestion(gq);
        }
        console.log(
          `[Orchestrator] Maturity gap analysis: ${maturityGaps.length} gaps found, ` +
          `${gapQuestions.length} investigation questions added`,
        );
      }

      // ── Step 3: Convergence check (after re-reads, before deep dives) ──
      // Moved here from Step 2 so re-reads always run (their findings enter FindingStore).
      // Deep dives are skipped regardless, so convergence here stops the loop cleanly.
      if (currentSynthesis.selfAssessedConvergence.hasConverged) {
        state.isConverged = true;
        state.convergenceReason = 'llm_converged';
        break;
      }

      // ── Step 4: Deep dives SKIPPED ──
      // Deep dive findings never enter the FindingStore (coaching's data source) and
      // only feed subsequent synthesis iterations. Since iteration 0's synthesis is
      // complete and coaching reads findings from FindingStore, deep dives add cost
      // (~$0.15) without proportional quality improvement. Re-reads (Step 3) are kept
      // because their findings DO enter the FindingStore.
      // To re-enable deep dives, uncomment the dispatchDeepDives block below.
      /*
      const dives = dispatchDeepDives(
        currentSynthesis.questionCuration.curatedQueue,
        state.budgetRemaining,
      );
      // ... deep dive execution loop ...
      */

      // ── Step 5: Budget backstop ──
      if (state.budgetRemaining < MIN_BUDGET_FOR_STEP) {
        state.isConverged = true;
        state.convergenceReason = 'budget_exhausted';
      }

      state.iteration++;
    }

    // Safety cap reached
    if (state.iteration >= MAX_ITERATIONS && !state.isConverged) {
      state.isConverged = true;
      state.convergenceReason = 'safety_cap';
    }

    // First iteration convergence: if L3.75 says converged on first iteration, trust it
    if (!state.isConverged && currentSynthesis?.selfAssessedConvergence.hasConverged) {
      state.isConverged = true;
      state.convergenceReason = 'llm_converged';
    }

    // Gap 2: Persist the question queue back to the profile
    profile.questionQueue = queueManager.getAll();

    return {
      finalSynthesis: currentSynthesis!.synthesis,
      readingStrategy: currentSynthesis!.readingStrategy,
      growthState: state,
      totalCost: state.budgetCeiling - state.budgetRemaining,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE: Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Scope 2 Phase 5: Harvest improvement candidates from a completed L3 walk.
   *
   * Reads every sentence understanding that carries an inline
   * `improvementCandidate` (emitted by the walk prompt's IMPROVEMENT
   * CANDIDATE EMISSION section) and returns the flat list for the
   * coordinator to add to its ImprovementCandidateStore.
   *
   * Pure function of the walk result — no mutation, no side effects,
   * no LLM calls. Candidates already have deterministic IDs assigned by
   * `parseSentenceUnderstanding` via `ImprovementCandidateStore.buildId`.
   *
   * Shape note: skipped or failed paragraphs never reach this extractor
   * because the fail-fast walk loop (sequentialDeepWalk.ts) throws
   * PipelineError before returning if any paragraph failed.
   */
  private extractL3Candidates(walkResult: L3WalkResult): ImprovementCandidate[] {
    const out: ImprovementCandidate[] = [];
    for (const walkOutput of walkResult.walkOutputs) {
      for (const entry of walkOutput.sentenceUnderstandings) {
        const candidate = entry.understanding.improvementCandidate;
        if (candidate) {
          out.push(candidate);
        }
      }
    }
    return out;
  }

  /**
   * Scope 2 Phase 5: Harvest improvement candidates from a completed L3.75
   * holistic synthesis. Reads `craftAssessment.growthEdges[].pairedImprovement`
   * and converts each populated entry into an `ImprovementCandidate` with
   * sourceLayer='L3.75'.
   *
   * Unlike L3 (per-sentence) and L3.5 (per-sentence with evaluation), L3.75
   * operates at paragraph/essay scope, so candidate `sentence` is always null
   * and `paragraph` defaults to the first paragraph in the growth edge's
   * `paragraphs[]` array (or 0 if empty). The architectural reasoning lives
   * in `observation`, the directive lives in `suggestedChange`.
   *
   * Pure function — no mutation, no LLM calls. ID is built deterministically
   * via `ImprovementCandidateStore.buildId` so re-runs produce stable IDs.
   */
  private extractL375Candidates(synthesis: HolisticSynthesisOutput): ImprovementCandidate[] {
    const out: ImprovementCandidate[] = [];
    const growthEdges = synthesis.craftAssessment?.growthEdges ?? [];
    const now = new Date().toISOString();

    for (const edge of growthEdges) {
      const paired = edge.pairedImprovement;
      if (!paired) continue;

      // Use the first paragraph in the edge's scope as the candidate's
      // paragraph anchor. L3.75 growth edges are paragraph-scoped, so this
      // is the canonical location for coaching to hang the suggestion on.
      const paragraph = edge.paragraphs.length > 0 ? edge.paragraphs[0] : 0;

      // Observation combines the descriptive pattern + architectural reason
      // so downstream consumers see both the WHAT and the WHY in one slot.
      const observation = `${edge.description} — ${paired.architecturalReason}`;

      // Map expectedImpact → coachingValue. Transformative edges become
      // 'critical', significant edges 'high', incremental edges 'medium'.
      // L3.75 does not emit 'diagnostic' — by definition, a pairedImprovement
      // has enough architectural weight to suggest concrete action.
      const coachingValue: ImprovementCandidate['coachingValue'] =
        paired.expectedImpact === 'transformative'
          ? 'critical'
          : paired.expectedImpact === 'significant'
            ? 'high'
            : 'medium';

      const id = ImprovementCandidateStore.buildId('L3.75', paragraph, null, observation);

      out.push({
        id,
        sourceLayer: 'L3.75',
        paragraph,
        sentence: null,
        sourceFindingId: null,
        observation,
        suggestedChange: paired.directive,
        technique: paired.technique,
        demonstrationSketch: paired.demonstrationSketch,
        coachingValue,
        lifecycleState: 'candidate',
        supersededBy: null,
        createdAt: now,
      });
    }

    return out;
  }

  /**
   * Build a LayerError from a caught exception AND log full diagnostics.
   * This is the single place where pipeline errors get diagnosed — every detail
   * you'd need to fix the issue should be in these logs.
   */
  private buildLayerError(
    layer: string,
    error: unknown,
    costSoFar: number,
    paragraphIndex?: number,
  ): LayerError {
    const { errorType, httpStatus } = classifyError(error);
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const timestamp = new Date().toISOString();

    // Log EVERYTHING — this is what you read when debugging a failed run
    console.error(
      `\n${'═'.repeat(72)}\n` +
      `[EssayIntelligence] LAYER FAILURE — ${layer}${paragraphIndex != null ? ` P${paragraphIndex}` : ''}\n` +
      `${'═'.repeat(72)}\n` +
      `  errorType:  ${errorType}\n` +
      `  httpStatus: ${httpStatus ?? 'N/A'}\n` +
      `  message:    ${msg}\n` +
      `  costSoFar:  $${costSoFar.toFixed(4)}\n` +
      `  timestamp:  ${timestamp}\n` +
      (stack ? `  stack:\n${stack.split('\n').map(l => `    ${l}`).join('\n')}\n` : '') +
      `${'═'.repeat(72)}\n`,
    );

    return {
      layer,
      paragraphIndex,
      errorType,
      httpStatus,
      message: msg,
      tokensBilled: 0,
      costBilled: costSoFar,
      timestamp,
    };
  }

  /**
   * Safe checkpoint — never lets checkpoint failure kill the pipeline.
   *
   * [D-1.12 H4 closure 2026-04-29] Pre-fix this method swallowed
   * checkpoint failures with `console.error` only — across 8 call sites
   * in this file (`after_l1_l2`, `after_l3` ×2, `after_l3_5` ×2,
   * `after_l5`, plus inside the L3 + L3.5 + L5 catches). The persistence
   * failure was invisible to telemetry / iterationLedger; consumers
   * reading from the checkpoint store would see stale state with no
   * signal that the write didn't happen.
   *
   * The "non-fatal within a single run" semantics are correct (per
   * D-1.10 §"Failure-surface design": checkpoints are recovery
   * affordances, not load-bearing for the in-memory iteration). What
   * was missing was the audit trail. Now we emit a structured
   * iterationTelemetry event (parity with F-2's AO First Read closure)
   * so external observers + iterationLedger.events[] capture the
   * rejection. Continue semantics preserved — the caller proceeds.
   */
  private async safeCheckpoint(
    coordinator: EssayProfileCoordinator,
    reason: CheckpointReason,
  ): Promise<void> {
    try {
      await coordinator.checkpoint(reason);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Checkpoint failed (${reason}):`, msg);
      // Emit telemetry. essayId via the new getEssayId() accessor (D-1.12
      // Commit C). iteration via getCurrentIteration; safe to read since
      // checkpoint failures only fire after the pipeline has progressed
      // to at least one layer (which means the coordinator was already
      // constructed with a valid iterationLedger).
      const iter = getCurrentIteration(coordinator.getProfile() as EssayProfile);
      emitIterationEvent(coordinator.getEssayId(), {
        iteration: iter,
        step: `checkpoint.${reason}`,
        status: 'failed',
        error: {
          message: msg,
          code: 'checkpoint_write_failed',
          context: {
            reason,
            downstreamBehavior:
              'In-memory iteration continues; persisted checkpoint store does not have this write. ' +
              'Recovery from a fresh process load will see stale state.',
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // D-1.10: Iteration lifecycle commit
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build an IterationRecord from the iteration's runtime state and append
   * it to `iterationLedger.iterations[]`, alongside flushing the
   * `taughtMoves` transient buffer onto `iterationLedger.taughtMoves[]`.
   *
   * This is THE method that closes Dead Wires #2 (consumer side), #4
   * (telemetry flush), and #5 (`iterations[]` write), and activates D-1.8's
   * `snapshotText` consumer (records the post-iteration text so iter N+1's
   * priorAnnotations composer can compute the diff against this iteration's
   * text rather than degrading to `undefined`).
   *
   * Atomicity per the D-1.10 plan §"Atomic-commit decision": write all
   * mutations to the in-memory profile, then `coordinator.checkpoint()`.
   * If checkpoint throws, propagate the structured error WITHOUT clearing
   * the transient buffers — buffer state is preserved for forensic recovery
   * and so a retry can re-attempt the persistence. The caller (the
   * orchestrator's BUILD RESULT block, or `buildPartialResult`) decides
   * whether to re-throw or swallow per its contract.
   *
   * D-1.11 stub fields documented inline. They are NOT TODOs to silently
   * fix later — they are scope-bounded handoffs to the next deliverable.
   */
  private async commitIterationRecord(
    coordinator: EssayProfileCoordinator,
    costSummary: CostSummary,
    layersCompleted: string[],
    layersFailed: LayerError[],
    startedAt: string,
    triggeredBy: IterationRecord['triggeredBy'],
    input: PipelineInput,
    rationale: string,
  ): Promise<void> {
    const profile = coordinator.getProfile() as EssayProfile;
    const iter = getCurrentIteration(profile);
    const finishedAt = new Date().toISOString();

    // ── Drain telemetry events (non-destructive read; clear after success) ──
    // [D-1.11 Step 15 closed at bcc5be6] Telemetry buffer is essay-keyed end-
    // to-end; cross-essay collision impossible at the type level. Sister to
    // the TaughtMove buffer keying immediately below.
    const events = flushEventsForIteration(input.essayId, iter);

    // ── Drain TaughtMoves buffer (non-destructive; clear after success) ──
    // [D-1.11 Step 0] Essay-keyed to prevent concurrent-essay collision.
    const flushedMoves = flushTaughtMovesForIteration(input.essayId, iter);

    // ── Build editScope (only when edit-triggered) ──────────────────────
    // [D-1.15 deferred-item closure 2026-04-30 Item 6] Extracted to a pure
    // helper at `analysis/editScopeBuilder.ts` so the live derivation chain
    // (computeEditDiff → reanalysisBrief → editScope) is testable as a unit.
    // Zero behavioral change — the helper carries the same counts-from-
    // netChanges logic the inline block had (D-1.11 Step 13).
    const editScope = buildEditScopeFromBrief(
      triggeredBy,
      input.reanalysisBrief,
      input.editSignificance,
      input.editChangeTypes,
    );

    // ── Build per-layer cost breakdown from CostSummary.layers ──────────
    const costBreakdown: Record<string, number> = {};
    for (const layer of costSummary.layers) {
      // CostTracker may emit multiple entries for the same layer (e.g.,
      // delta_synthesis on top of L3.75); accumulate.
      costBreakdown[layer.layer] = (costBreakdown[layer.layer] ?? 0) + layer.cost;
    }

    // ── D-1.11 Step 13: synthesize carryForwardSummary from recentDecisions ──
    // Replaces D-1.10's empty-arrays stub. Reads decisions appended by
    // DP-1 through DP-4 during this iteration (filtered by iteration ===
    // iter) and rolls them up into the carried/rederived/refreshed
    // buckets. Synthesis runs BEFORE record construction so the rolled-up
    // summary is fresh; runs AFTER all decision-point appends because
    // every DP fires inside analyzeEssay UPSTREAM of commitIterationRecord
    // (verified by the call-site ordering: DP-1 at line ~537, DP-2 at
    // ~1052, DP-3a/b/c during L3/L3.75 phases, DP-4 inside W5.4a, ALL
    // before this commit helper executes at orchestrator end).
    const { synthesizeCarryForwardSummary } = await import('./carryForwardSynthesis');
    const carryForwardSummary = synthesizeCarryForwardSummary(
      profile.iterationLedger.recentDecisions,
      iter,
    );

    // ── Construct the IterationRecord ───────────────────────────────────
    const record: IterationRecord = {
      iteration: iter,
      triggeredBy,
      ...(editScope ? { editScope } : {}),
      // D-1.11 Step 13: real synthesized summary, not the empty-arrays stub.
      // Empty arrays now MEAN "no decisions appended this iteration" (true
      // first-pass with no prior context, or focused-mode-deferred DPs),
      // not "stub not yet implemented."
      carryForwardSummary,
      costBreakdown,
      // D-1.11 STUB (carryover) — true comprehensive baseline cost
      // requires a per-layer baseline reference table (D-4.11+). For
      // first-pass: actual cost IS the comprehensive baseline. For
      // edit-triggered: degenerate equality is documented honestly via
      // the rationale string. NOT D-1.11's scope to fix.
      comprehensiveBaselineCost: costSummary.totalCost,
      carryForwardSavings: 0, // = comprehensiveBaselineCost - sum(costBreakdown); for first_pass = 0
      // D-1.11 Step 13: escalationLevel threaded from
      // PipelineInput.focusedEscalationLevel (set by reanalysisOrchestrator
      // when focused-mode escalation fired). Default 0 for cold first-pass
      // and for re-analyses where no escalation occurred.
      // [F-1 wire-up closure 2026-04-29] Producer wired at
      // reanalysisOrchestrator.ts:1255 (passes focusedResult?.escalationLevel
      // into triggerReanalysis, which threads it into PipelineInput here).
      // Pre-fix this field always read 0 because the focused result was
      // discarded between runComprehensiveMode and triggerReanalysis.
      escalationLevel: input.focusedEscalationLevel ?? 0,
      rationale,
      startedAt,
      finishedAt,
      ...(events.length > 0 ? { events } : {}),
      // D-1.10: snapshotText is the post-iteration essay text. Activates
      // D-1.8's `getPriorIterationSnapshotText` consumer for iter N+1.
      snapshotText: input.essayText,
    };

    // ── Mutate ledger in memory ─────────────────────────────────────────
    profile.iterationLedger.iterations.push(record);
    if (flushedMoves.length > 0) {
      profile.iterationLedger.taughtMoves.push(...flushedMoves);
    }

    console.log(
      `[Orchestrator] D-1.10: committing iter ${iter} record ` +
        `(triggeredBy=${triggeredBy}, taughtMoves=+${flushedMoves.length}, ` +
        `events=${events.length}, layers=[${Object.keys(costBreakdown).join(',')}])`,
    );

    // ── Persist (atomic boundary). On failure: throw, do NOT clear buffers.
    try {
      await coordinator.checkpoint('after_iteration_commit');
    } catch (error) {
      // The in-memory ledger HAS the new record; the persisted store does
      // not. Per the plan's atomicity interpretation: throw with structured
      // context, leave buffers intact for forensic recovery, let the caller
      // surface "iteration N did not persist; rerun." We do NOT clear the
      // transient buffers because a rerun may want to reuse them.
      throw PipelineError.wrap(
        'iteration_commit',
        error,
        `[Orchestrator] D-1.10: checkpoint failed during iteration commit ` +
          `(iter=${iter}, triggeredBy=${triggeredBy}). In-memory ledger has the record; ` +
          `transient buffers preserved for retry. Checkpoint store may be down or rejecting writes.`,
      );
    }

    // ── Clear transient buffers ONLY after successful checkpoint ─────────
    clearEventsForIteration(input.essayId, iter);
    clearTaughtMovesForIteration(input.essayId, iter);

    // ── D-1.11 Step 13: prune recentDecisions to last 5 iterations ──
    // Per IterationLedger.recentDecisions JSDoc: "Pruned to the last 5
    // iterations at iteration end (decisions are dense and only audit-
    // relevant short-term)." Iteration-NUMBER window: at iter N with
    // keepLastN=5, retain decisions where d.iteration >= N-4. Runs AFTER
    // successful checkpoint so a checkpoint-failed retry replays
    // unpruned data (per D-1.11 Plan agent §6 ordering).
    const { pruneRecentDecisions } = await import('../profileManager/essayProfileManager');
    pruneRecentDecisions(profile, 5);

    console.log(
      `[Orchestrator] D-1.10: iter ${iter} committed; ledger now has ` +
        `${profile.iterationLedger.iterations.length} iterations, ` +
        `${profile.iterationLedger.taughtMoves.length} cumulative taughtMoves, ` +
        `${profile.iterationLedger.recentDecisions.length} recent decisions ` +
        `(carried=${record.carryForwardSummary.carried.length}, ` +
        `rederived=${record.carryForwardSummary.rederived.length}, ` +
        `refreshed=${record.carryForwardSummary.refreshed.length})`,
    );
    // Reference layersCompleted/layersFailed to silence unused-param lints
    // and to leave a debug breadcrumb if a future change wants to inspect
    // the post-commit summary at this site.
    void layersCompleted;
    void layersFailed;
  }

  /**
   * Determine confidence level based on which layers completed and coherence.
   *
   * Coherence degradation (A2):
   * - 3+ blocking contradictions → cap at 'developing' (profile is unreliable)
   * - Any blocking contradictions → cap at 'deep' (some contradictions)
   *
   * NOTE (Cluster B checkpoint): The `blockingCount >= 3` threshold is an operational
   * heuristic for profile reliability, not an analytical judgment about essay quality.
   * It uses the Crystallizer's `isCoherent` signal (LLM-determined) as the primary gate,
   * then the count as severity calibration. If future growth cycle iterations produce
   * LLM-assessed confidence, this heuristic should be replaced by that signal.
   */
  private computeConfidenceLevel(
    layersCompleted: string[],
    coherenceReport: CoherenceReport | null,
  ): ConfidenceLevel {
    const has = (layer: string) => layersCompleted.includes(layer);

    // Base level from layer completion
    let level: ConfidenceLevel;
    if (has('L4') && has('L3.5') && has('L3.75') && has('L3')) {
      level = 'comprehensive';
    } else if (has('L3') && has('L3.5')) {
      level = 'deep';
    } else if (has('L3')) {
      level = 'developing';
    } else {
      return 'initial'; // Can't degrade further
    }

    // Degrade if coherence report shows contradictions
    if (coherenceReport && !coherenceReport.isCoherent) {
      const blockingCount = coherenceReport.contradictions
        .filter((c) => c.severity === 'blocking').length;
      if (blockingCount >= 3) {
        level = 'developing'; // Major contradictions — profile is unreliable
      } else if (level === 'comprehensive') {
        level = 'deep'; // Some contradictions — cap below comprehensive
      }
    }

    return level;
  }

  /**
   * Return the highest-numbered layer that completed.
   */
  /**
   * W5.4a: Derive which holistic sections are affected by blocking contradictions.
   *
   * Maps section name strings (from CoherenceIssue.sectionA/sectionB) to
   * HolisticSectionType values. The section names in coherence issues are
   * free-form strings like "voiceMap.shiftPoints" or "craftAssessment" —
   * we match by prefix to determine which holistic section owns them.
   */
  private deriveAffectedSections(
    contradictions: Array<{ sectionA: string; sectionB: string }>,
  ): HolisticSectionType[] {
    const sectionPrefixMap: Array<{ prefix: string; type: HolisticSectionType }> = [
      { prefix: 'voiceIdentity', type: 'voice_identity' },
      { prefix: 'voiceMap', type: 'voice_map' },
      { prefix: 'emotionalTopography', type: 'emotional_topography' },
      { prefix: 'momentEarnednessMap', type: 'moment_earnedness_map' },
      { prefix: 'thematicArchitecture', type: 'thematic_architecture' },
      { prefix: 'narrativeStrategy', type: 'narrative_strategy' },
      { prefix: 'characterRevelation', type: 'character_revelation' },
      { prefix: 'craftAssessment', type: 'craft_assessment' },
      { prefix: 'entanglements', type: 'cross_dimension_entanglements' },
      { prefix: 'admissionsPositioning', type: 'admissions_positioning' },
    ];

    const affected = new Set<HolisticSectionType>();

    for (const c of contradictions) {
      for (const sectionRef of [c.sectionA, c.sectionB]) {
        for (const { prefix, type } of sectionPrefixMap) {
          if (sectionRef.startsWith(prefix)) {
            affected.add(type);
            break;
          }
        }
      }
    }

    return Array.from(affected);
  }

  private highestLayerCompleted(layersCompleted: string[]): string {
    const ordered = ['L5', 'L4', 'L3.5', 'L3.75', 'L3', 'L2.5', 'L2', 'L1'];
    for (const layer of ordered) {
      if (layersCompleted.includes(layer)) return layer;
    }
    return 'none';
  }

  /**
   * Build a partial result when the pipeline aborts early due to a fatal error.
   *
   * D-1.10: now async. When `coordinator !== null`, commits a partial
   * IterationRecord to preserve the `iterations[N-1]` = audit-for-iter-N
   * invariant (per profileTypes.ts:5150). Without this commit, an iteration
   * that incremented `currentIteration` (analysisOrchestrator.ts entry) but
   * aborted at L2/L3/L3.75/L3.5/L4/L5 would create a hole in `iterations[]`,
   * silently breaking every downstream consumer's slot-based lookup.
   *
   * Per the D-1.10 plan §"Failure-surface design" Q4: this is the SOLE
   * place where checkpoint-write-failure is logged-and-swallowed instead
   * of thrown. The contract of `buildPartialResult` is "always returns a
   * PipelineResult, never throws" — masking the partial-commit failure
   * with the original abort failure is correct here. Buffers are NOT
   * cleared on commit failure (Step 6's design) so a forensic recovery
   * can still find the events/moves.
   *
   * When `coordinator === null` (L1 fatal — coordinator never built),
   * skip commit entirely. `currentIteration` was never incremented for
   * this run (the increment lives at line ~459 AFTER coordinator creation),
   * so no hole is created.
   */
  private async buildPartialResult(
    coordinator: EssayProfileCoordinator | null,
    layersCompleted: string[],
    layersFailed: LayerError[],
    costTracker: CostTracker,
    startTime: number,
    iterationStartedAt: string,
    triggeredBy: IterationRecord['triggeredBy'],
    input: PipelineInput,
  ): Promise<PipelineResult> {
    const totalTimingMs = Date.now() - startTime;
    const costSummary = costTracker.summarize(totalTimingMs);

    // If coordinator is null (L1 failed), create a minimal profile indicator
    const profile = coordinator
      ? coordinator.getProfile()
      : ({
          index: { confidenceLevel: 'initial' as ConfidenceLevel },
          metadata: { confidenceLevel: 'initial' as ConfidenceLevel, totalAnalysisCost: 0 },
        } as unknown as Readonly<EssayProfile>);

    // Log abort with full cost breakdown
    const layerCostBreakdown = costSummary.layers.length > 0
      ? costSummary.layers.map((l) => `${l.layer}: $${l.cost.toFixed(3)}`).join(' | ')
      : '(no layers completed)';
    console.error(
      `\n${'▓'.repeat(72)}\n` +
      `[EssayIntelligence] PIPELINE ABORTED\n` +
      `${'▓'.repeat(72)}\n` +
      `  completed: ${layersCompleted.join(', ') || 'none'}\n` +
      `  failed:    ${layersFailed.map((f) => `${f.layer} (${f.errorType})`).join(', ')}\n` +
      `  cost:      $${costSummary.totalCost.toFixed(4)} wasted\n` +
      `  breakdown: ${layerCostBreakdown}\n` +
      `  time:      ${totalTimingMs}ms\n` +
      `  reason:    ${layersFailed[layersFailed.length - 1]?.message ?? 'unknown'}\n` +
      `${'▓'.repeat(72)}\n`,
    );

    // D-1.10: commit a partial IterationRecord when coordinator is non-null.
    // The abort happened AFTER incrementIteration ran, so currentIteration
    // is the new value; without committing a record, iterations[N-1] would
    // be missing. Commit failure here is logged and swallowed (see method
    // JSDoc) because buildPartialResult's contract is to always return.
    if (coordinator) {
      const failedLayers = layersFailed.map((f) => `${f.layer}(${f.errorType})`).join(',');
      const lastReason = layersFailed[layersFailed.length - 1]?.message ?? 'unknown';
      const partialRationale =
        `aborted iteration: layers=[${layersCompleted.join(',') || 'none'}], ` +
        `failed=[${failedLayers}], reason="${lastReason}"`;
      try {
        await this.commitIterationRecord(
          coordinator,
          costSummary,
          layersCompleted,
          layersFailed,
          iterationStartedAt,
          triggeredBy,
          input,
          partialRationale,
        );
      } catch (commitErr) {
        // [round-1 audit §4.C / T1.4 closure] Surface the secondary
        // failure as structured telemetry BEFORE the console.error so
        // audit grep finds it (charter §8). The no-throw contract of
        // buildPartialResult is preserved — we still log + return
        // without re-throwing because the original abort is the primary
        // failure and masking it with the secondary commit failure
        // would lose user-facing diagnostic.
        const iter = getCurrentIteration(coordinator.getProfile());
        emitIterationEvent(input.essayId, {
          iteration: iter,
          step: 'iteration_commit_secondary_failure',
          status: 'failed',
          error: {
            message: commitErr instanceof Error ? commitErr.message : String(commitErr),
            code: 'partial_result_commit_failure',
            context: { triggeredBy, layersCompleted, layersFailed: layersFailed.map((f) => f.layer) },
          },
          timestamp: new Date().toISOString(),
        });
        console.error(
          `[Orchestrator] D-1.10: partial-result iteration commit ALSO failed (the ` +
            `original abort is the primary failure; not re-throwing this secondary one):`,
          commitErr instanceof Error ? commitErr.message : String(commitErr),
        );
        // Buffers stay populated for forensic recovery (Step 6 design).
      }
    }

    return {
      profile,
      completedAllLayers: false,
      highestCompletedLayer: this.highestLayerCompleted(layersCompleted),
      costSummary,
      layersCompleted,
      layersFailed,
      improvementPhase: null,
      confidenceLevel: this.computeConfidenceLevel(layersCompleted, null),
      annotations: null,
      scoreMatrix: null,
      coherenceReport: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE: Improvement Manifest Builder
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build an ImprovementManifest from ALL available analysis sources.
   * Every finding, growth edge, red flag, and AO observation maps to at least
   * one ImprovementEntry. Understanding is fuel — improvements are output.
   *
   * Sources (waterfall — uses whatever is available):
   *   1. L4 coachingMap.priorities (richest)
   *   2. L3.5 findings (active, critical/high coaching value)
   *   3. AO First Read red flags
   *   4. L3.75 craft assessment growth edges
   *   5. L3 paragraph-level growth edges
   */
  /**
   * Build the ImprovementManifest from the profile's L4 priorities + findings
   * + AO red flags + L3.75 growth edges + L3 paragraph-level edges.
   *
   * PUBLIC so post-edit re-analysis paths (focused mode in
   * `reanalysisOrchestrator.runFocusedMode`) can rebuild the manifest after
   * mutating the profile, instead of leaving coaching with a stale or absent
   * manifest. See reference audit line 611 — "(no manifest on post-coaching
   * profile)" — for the regression this guards against.
   *
   * Caller must ensure `profile.improvementCandidateSnapshot` is fresh
   * (call `coordinator.snapshotCandidateStore()` immediately before).
   */
  buildImprovementManifest(
    profile: EssayProfile,
    findingStore: FindingStore,
    essayText: string,
    essayType: EssayType,
  ): ImprovementManifest {
    const items: ImprovementEntry[] = [];
    const sources: string[] = [];
    let priority = 1;

    const WORD_LIMITS: Record<string, number> = { supplement: 250, piq: 350, personal_statement: 650 };
    const wordLimit = WORD_LIMITS[profile.northStar?.activeScale ?? ''] ?? 650;
    const wordCount = profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);

    // ── Source 1: L4 CoachingMap Priorities ──
    const coachingMap = profile.scoreMatrix?.coachingMap;
    if (coachingMap?.priorities && coachingMap.priorities.length > 0) {
      sources.push('l4_priorities');
      const candidateSnapshot = profile.improvementCandidateSnapshot;
      for (const p of coachingMap.priorities.slice(0, 5)) {
        const targetPara = p.target?.paragraphs?.[0] ?? -1;
        // Scope 2 Phase 6a: resolve technique from first consolidated candidate.
        // Priorities cite candidates via `consolidatedFrom`; candidates carry the
        // LLM-assigned technique. Fall back to keyword match on the priority text
        // when consolidation lineage is missing (pre-Phase-6a profiles).
        const techniqueFromCandidate = this.getTechniqueFromConsolidatedCandidates(
          p.consolidatedFrom,
          candidateSnapshot,
        );
        const technique = techniqueFromCandidate
          ?? this.matchClaimToTechnique(`${p.priority} ${p.architecturalReason}`)?.name
          ?? null;
        items.push({
          id: `IMP_${priority}`,
          paragraph: targetPara,
          observation: p.architecturalReason,
          action: p.priority,
          stakes: p.unlocksNext,
          technique,
          demonstration: null,
          wordEconomyCut: null,
          source: 'l4_priority',
          sourceRef: p.consolidatedFrom?.[0] ?? null,
          priority: priority++,
          impact: p.expectedImpact,
          conversatorEnrichments: [],
        });
      }
    }

    // ── Source 2: L3.5 Active Findings ──
    const activeFindings = findingStore.getActiveSortedByCoachingValue();
    if (activeFindings.length > 0) {
      sources.push('l35_findings');
      for (const f of activeFindings.slice(0, 8)) {
        // Skip if already covered by an L4 priority targeting the same paragraph
        const para = f.scope.type === 'paragraph' ? (f.scope.paragraph ?? -1) : -1;
        const alreadyCovered = items.some(i => i.paragraph === para && i.source === 'l4_priority');
        if (alreadyCovered) continue;

        // Technique match via keyword routing
        const technique = this.matchClaimToTechnique(f.claim);

        items.push({
          id: `IMP_${priority}`,
          paragraph: para,
          observation: f.claim,
          action: technique
            ? `Apply ${technique.name}: ${technique.directive}`
            : `Address: ${f.claim}`,
          stakes: f.evidence.length > 0
            ? `Evidence: "${f.evidence[0].text.slice(0, 120)}"`
            : '',
          technique: technique?.name ?? null,
          demonstration: null,
          wordEconomyCut: null,
          source: 'l35_finding',
          sourceRef: f.id,
          priority: priority++,
          impact: f.coachingValue === 'critical' ? 'transformative'
            : f.coachingValue === 'high' ? 'significant' : 'incremental',
          conversatorEnrichments: [],
        });
      }
    }

    // ── Source 3: AO First Read Red Flags ──
    if (profile.aoFirstRead) {
      sources.push('ao_first_read');
      const ao = profile.aoFirstRead;

      // People absence
      if (ao.gutReaction?.includes('no named individuals') ||
          ao.gutReaction?.includes('people absence') ||
          ao.gutReaction?.toLowerCase().includes('no teacher') ||
          ao.gutReaction?.toLowerCase().includes('no mentor')) {
        items.push({
          id: `IMP_${priority}`,
          paragraph: -1,
          observation: 'No named individuals appear in the essay. Every experience is described in isolation.',
          action: 'Add ONE named person — teacher, teammate, mentor — with one physical detail. Show them in one sentence.',
          stakes: 'People absence is a red flag AOs catch in 30 seconds. It makes the essay feel like a philosophy paper, not a personal statement.',
          technique: 'NAMED CHARACTER',
          demonstration: null,
          wordEconomyCut: null,
          source: 'red_flag',
          sourceRef: null,
          priority: priority++,
          impact: 'significant',
          conversatorEnrichments: [],
        });
      }

      // Put-down risk
      if (ao.putDownRisk === 'high' && ao.committeeOneLiner) {
        const alreadyHasHookItem = items.some(i =>
          i.observation.toLowerCase().includes('opening') || i.observation.toLowerCase().includes('hook'));
        if (!alreadyHasHookItem) {
          items.push({
            id: `IMP_${priority}`,
            paragraph: 0,
            observation: `AO committee one-liner: "${ao.committeeOneLiner}". Put-down risk: HIGH.`,
            action: 'The opening must stop the AO from skimming in 3 sentences. Replace abstract opening with a physical moment.',
            stakes: `The AO will reduce this essay to "${ao.committeeOneLiner}" in committee. The opening must force them to stop and read.`,
            technique: 'COLD OPEN / SENSORY TIMESTAMP',
            demonstration: null,
            wordEconomyCut: null,
            source: 'ao_first_read',
            sourceRef: null,
            priority: priority++,
            impact: 'transformative',
            conversatorEnrichments: [],
          });
        }
      }
    }

    // ── Source 4: L3.75 Craft Assessment Growth Edges ──
    const growthEdges = profile.craftAssessment?.growthEdges;
    if (growthEdges && growthEdges.length > 0) {
      sources.push('l375_growth_edges');
      for (const edge of growthEdges.slice(0, 4)) {
        const para = edge.paragraphs?.[0] ?? -1;
        const alreadyCovered = items.some(i => i.paragraph === para);
        if (alreadyCovered) continue;

        const technique = this.matchClaimToTechnique(edge.quality + ' ' + edge.description);
        items.push({
          id: `IMP_${priority}`,
          paragraph: para,
          observation: `${edge.quality}: ${edge.description}`,
          action: technique
            ? `Apply ${technique.name}: ${technique.directive}`
            : `Improve: ${edge.description}`,
          stakes: '',
          technique: technique?.name ?? null,
          demonstration: null,
          wordEconomyCut: null,
          source: 'l375_growth_edge',
          sourceRef: null,
          priority: priority++,
          impact: 'incremental',
          conversatorEnrichments: [],
        });
      }
    }

    // ── Source 5: L3 Paragraph-Level Growth Edges ──
    for (const para of profile.paragraphs) {
      if (!para.analysis?.growthEdges) continue;
      for (const edge of para.analysis.growthEdges.slice(0, 2)) {
        const alreadyCovered = items.some(i => i.paragraph === para.index);
        if (alreadyCovered) continue;

        const technique = this.matchClaimToTechnique(edge.quality + ' ' + edge.description);
        items.push({
          id: `IMP_${priority}`,
          paragraph: para.index,
          observation: `P${para.index + 1}: ${edge.quality}: ${edge.description}`,
          action: technique
            ? `Apply ${technique.name}: ${technique.directive}`
            : `Improve P${para.index + 1}: ${edge.description}`,
          stakes: '',
          technique: technique?.name ?? null,
          demonstration: null,
          wordEconomyCut: null,
          source: 'l3_observation',
          sourceRef: null,
          priority: priority++,
          impact: 'incremental',
          conversatorEnrichments: [],
        });
      }
    }

    // ── Source 6: Howler Pass (Phase 4.1 quality floor) ──
    // Cheap deterministic pass that catches specific howlers the LLM layers
    // systematically miss: cliché bigrams, near-duplicate paragraphs, known-
    // wrong factual hooks. Each becomes a MUST_ADDRESS manifest item with
    // impact=transformative so the coach surfaces them early.
    //
    // BUG FIX (Critical #1 from E2E audit, Apr 14): on rebuild-after-edit the
    // passed `essayText` parameter may be truncated or paragraph-scoped (seen
    // in the conversator V2 E2E test where processEdit receives paragraph-only
    // text and currentText ends up 460 chars instead of the full 2309-char
    // essay). Result: re-analysis ran howlerPass against a single paragraph
    // that had no clichés, so every red_flag item detected in the initial
    // pass silently disappeared from the rebuilt manifest — 60-70% of howler
    // protection lost on a single edit.
    //
    // Two-pronged fix:
    //   (a) Run howler pass against paragraph-reconstructed text, which is
    //       the authoritative source of truth for the CURRENT paragraph
    //       content inside the profile regardless of what `essayText` was.
    //   (b) Carry forward prior manifest red_flag items whose evidence
    //       substring still appears in the current essay. This preserves
    //       howlers detected on a prior pass even if (a) misses them due to
    //       input anomaly or detector regression. Dedup key: observation+
    //       paragraph — never emit the same howler twice.
    try {
      const paragraphTexts = profile.paragraphs.map((p) => p.text);
      const fullEssayText = paragraphTexts.join('\n\n');
      const howlerResult = runHowlerPass(fullEssayText, paragraphTexts);
      if (howlerResult.howlers.length > 0) {
        sources.push('howler_pass');
        console.log(
          `[Orchestrator] HowlerPass: ${howlerResult.howlers.length} howlers ` +
            `(cliche=${howlerResult.counts.cliche}, duplicate=${howlerResult.counts.duplicate_paragraph}, ` +
            `factual=${howlerResult.counts.factual_hook})`,
        );
        // Prioritize factual > duplicate > cliché (factual errors are the most
        // damaging; clichés are most common so they dominate raw count). Cap
        // at 6 items so a cliché-heavy essay doesn't blow up the manifest and
        // starve the structural L4 priorities from coaching attention.
        const HOWLER_CAP = 6;
        const ordered = [
          ...howlerResult.howlers.filter((h) => h.kind === 'factual_hook'),
          ...howlerResult.howlers.filter((h) => h.kind === 'duplicate_paragraph'),
          ...howlerResult.howlers.filter((h) => h.kind === 'cliche'),
        ].slice(0, HOWLER_CAP);
        if (ordered.length < howlerResult.howlers.length) {
          console.log(
            `[Orchestrator] HowlerPass: truncated to top ${HOWLER_CAP} howlers (factual > duplicate > cliché)`,
          );
        }
        for (const h of ordered) {
          const paragraphIdx =
            h.location.type === 'paragraph' ? h.location.index :
            h.location.type === 'paragraph_pair' ? h.location.a :
            -1;

          // Dedup guard for paragraph-scoped howlers: if a paragraph already
          // has an L4 priority, emitting a duplicate-paragraph howler for it
          // would produce two items for the same paragraph (the audit
          // reviewer flagged this). Range-based clichés (paragraphIdx=-1)
          // and factual hooks are always allowed through since they address
          // different concerns.
          if (
            paragraphIdx !== -1 &&
            h.kind === 'duplicate_paragraph' &&
            items.some((i) => i.paragraph === paragraphIdx && i.source === 'l4_priority')
          ) {
            continue;
          }

          const kindLabel = h.kind === 'cliche' ? 'Cliché'
            : h.kind === 'duplicate_paragraph' ? 'Structural redundancy'
            : h.kind === 'factual_hook' ? 'Factual issue'
            : h.kind;
          // Technique routing for howler items. Every howler now carries a
          // named technique so the planner can prioritize it alongside L4/
          // L3.5 items (audit surfaced howlers stranded as technique=null,
          // which made the planner skip them — defeating the quality-floor
          // goal). These names intentionally mirror the craft-technique
          // vocabulary used elsewhere in the pipeline; research enrichment
          // either finds a matching teaching bundle or gracefully skips.
          //   cliche              → VOICE AUTHENTICITY (stock phrase, student
          //                         must find the only-them version).
          //   factual_hook        → FACTUAL ACCURACY (the opening claim is
          //                         wrong and undermines the reader's trust).
          //   duplicate_paragraph → STRUCTURAL REDUNDANCY (two paragraphs
          //                         saying the same thing — consolidate or
          //                         differentiate).
          const technique = h.kind === 'cliche' ? 'VOICE AUTHENTICITY'
            : h.kind === 'factual_hook' ? 'FACTUAL ACCURACY'
            : h.kind === 'duplicate_paragraph' ? 'STRUCTURAL REDUNDANCY'
            : null;
          items.push({
            id: `IMP_${priority}`,
            paragraph: paragraphIdx,
            observation: `${kindLabel}: ${h.description}`,
            action: h.suggestion,
            stakes: `Surface-level howlers undermine the reader\'s trust in the essay\'s craft even when the underlying ideas are strong. AOs flag these in seconds.`,
            technique,
            demonstration: null,
            wordEconomyCut: null,
            source: 'red_flag',
            sourceRef: null,
            priority: priority++,
            impact: 'significant',
            conversatorEnrichments: [`[howler:${h.kind}] evidence: ${h.evidence.slice(0, 120)}`],
          });
        }
      }
    } catch (err) {
      // classified: recoverable
      // Howler pass is a quality-floor enhancement; its failure should not
      // block manifest generation. Log for observability.
      console.warn(
        '[Orchestrator] HowlerPass failed (non-fatal):',
        err instanceof Error ? err.message : err,
      );
    }

    // ── Source 6b: Carry-forward red_flag items from prior manifest ──
    // Safety net for howler persistence across rebuilds. Even with the
    // paragraph-reconstructed howler pass above, edge cases can leave howlers
    // undetected on rebuild (e.g., paragraph text mutated in a way that
    // preserves the cliché but bypasses the detector; duplicate-pair thresh-
    // old drift after structural edits). This block scans the prior manifest
    // for red_flag items whose evidence substring is still present in the
    // current essay, and re-emits them if they weren't already produced by
    // the fresh howler pass. Dedup key: observation+paragraph pair.
    //
    // Acceptance per audit: "IMP_11 and IMP_12 reference clichés in P6/P7
    // which were never edited. The howler pass on rebuild is either not
    // running or returning zero for unchanged text." This is the belt to
    // the howler pass's suspenders — if the pass fails or mis-fires, the
    // prior detection survives.
    try {
      const priorManifest = profile.improvementManifest;
      if (priorManifest?.items?.length) {
        const existingKey = new Set(
          items.map((i) => `${i.paragraph}|${i.observation}`),
        );
        const paragraphTextsForCarry = profile.paragraphs.map((p) => p.text);
        const fullEssayTextForCarry = paragraphTextsForCarry.join('\n\n').toLowerCase();
        let carried = 0;
        for (const prior of priorManifest.items) {
          if (prior.source !== 'red_flag') continue;
          const key = `${prior.paragraph}|${prior.observation}`;
          if (existingKey.has(key)) continue;

          // Evidence survival check: the howler's evidence excerpt appears
          // in the annotation payload (conversatorEnrichments or the
          // observation itself after the kind label). If we can't find the
          // distinctive phrase in the current text, drop — the student
          // already fixed it.
          const evidenceMarker = (prior.conversatorEnrichments ?? [])
            .find((e) => e.startsWith('[howler:'))
            ?? '';
          // Extract the distinctive phrase. For cliché observations the
          // phrase is quoted inside the observation ("..."); for factual
          // issues, the quoted phrase is the marker. Fall back to the
          // evidence tail of the enrichment string.
          const quotedMatch = prior.observation.match(/"([^"]{3,80})"/);
          const evidenceTail = evidenceMarker.includes('evidence:')
            ? evidenceMarker.split('evidence:')[1]?.trim().toLowerCase() ?? ''
            : '';
          const needle = (quotedMatch?.[1] ?? evidenceTail).trim().toLowerCase();
          if (needle.length < 3) continue;

          // Duplicate-paragraph howlers: both paragraph indices referenced
          // in the observation (e.g., "P5 and P6 share 82% ...") must still
          // exist AND still be near-duplicates. We conservatively keep them
          // if both paragraphs still exist — the fresh howler pass would
          // have redetected them on its own if the threshold still held.
          if (prior.observation.startsWith('Structural redundancy')) {
            const pairMatch = prior.observation.match(/P(\d+) and P(\d+)/);
            if (pairMatch) {
              const a = Number(pairMatch[1]) - 1;
              const b = Number(pairMatch[2]) - 1;
              if (a < 0 || b < 0 || a >= profile.paragraphs.length || b >= profile.paragraphs.length) {
                continue; // paragraph removed — howler no longer applies
              }
            }
          } else if (!fullEssayTextForCarry.includes(needle)) {
            continue; // cliché/factual phrase removed by student — drop
          }

          items.push({
            id: `IMP_${priority}`,
            paragraph: prior.paragraph,
            observation: prior.observation,
            action: prior.action,
            stakes: prior.stakes,
            technique: prior.technique,
            demonstration: prior.demonstration,
            wordEconomyCut: prior.wordEconomyCut,
            source: 'red_flag',
            sourceRef: prior.sourceRef,
            priority: priority++,
            impact: prior.impact,
            conversatorEnrichments: [
              ...(prior.conversatorEnrichments ?? []),
              '[howler:carry-forward] preserved from prior manifest across rebuild',
            ],
          });
          existingKey.add(key);
          carried++;
        }
        if (carried > 0) {
          if (!sources.includes('howler_pass')) sources.push('howler_pass');
          if (!sources.includes('howler_carry_forward')) sources.push('howler_carry_forward');
          console.log(
            `[Orchestrator] HowlerPass: carried forward ${carried} red_flag items from prior manifest (evidence still present in current text)`,
          );
        }
      }
    } catch (err) {
      console.warn(
        '[Orchestrator] Howler carry-forward failed (non-fatal):',
        err instanceof Error ? err.message : err,
      );
    }

    // ── Word Economy: Identify cuttable paragraphs ──
    // Tag redundant/supporting paragraphs as potential cuts
    const structuralRoles = profile.northStar?.structuralRolesMap ?? [];
    for (const role of structuralRoles) {
      if (role.weight === 'supporting' || role.role.toLowerCase().includes('redundant')) {
        // Find items that could use this space
        for (const item of items) {
          if (!item.wordEconomyCut && item.paragraph !== role.paragraphs[0]) {
            const cutParaIdx = role.paragraphs[0];
            const cutParaWords = profile.paragraphs[cutParaIdx]?.text.split(/\s+/).length ?? 0;
            item.wordEconomyCut = `Cut P${cutParaIdx + 1} (${cutParaWords} words — ${role.role}). Use the space for this improvement.`;
            break; // Only assign one cut per supporting paragraph
          }
        }
      }
    }

    // Phase 4.1: cap raised 10 → 12 to leave room for quality-floor howler
    // items (factual hooks + top cliché matches) alongside the 10 structural
    // priorities. Higher caps bloat the coaching prompt; 12 is the practical
    // sweet-spot after measuring the piano-essay fixture (9 structural + 1-3
    // howlers comfortably fit). The planner only deploys ONE item per turn
    // regardless of cap, so the cap is purely a prompt-length bound.
    return {
      items: items.slice(0, 12),
      generatedAt: new Date().toISOString(),
      sources,
      wordCount,
      wordLimit,
    };
  }

  /**
   * Scope 2 Phase 6a: resolve the technique for an L4 priority by walking its
   * `consolidatedFrom` lineage back to the candidate store. Candidates carry
   * the LLM-assigned technique name; priorities do not. Returns the technique
   * of the first consolidated candidate (ordering mirrors LLM citation order,
   * so this is the most-relevant technique for the priority).
   */
  private getTechniqueFromConsolidatedCandidates(
    consolidatedFrom: string[] | undefined,
    snapshot: ImprovementCandidateStoreSnapshot | undefined,
  ): string | null {
    if (!consolidatedFrom?.length || !snapshot?.candidates?.length) return null;
    for (const candidateId of consolidatedFrom) {
      const candidate = snapshot.candidates.find((c) => c.id === candidateId);
      if (candidate?.technique) return candidate.technique;
    }
    return null;
  }

  /**
   * Match a claim/observation string to a TECHNIQUE_ROUTES entry using keyword matching.
   * Returns null if no route matches. Reuses the same routing logic as coachingService.
   */
  private matchClaimToTechnique(claim: string): { name: string; directive: string } | null {
    const lower = claim.toLowerCase();
    const routes: Array<{ keywords: string[]; name: string; directive: string }> = [
      { keywords: ['summary'], name: 'SUMMARY-TO-SCENE', directive: 'Identify the MOMENT buried in the summary. Write a 2-sentence scene version.' },
      { keywords: ['opening'], name: 'COLD OPEN / SENSORY TIMESTAMP', directive: 'The opening needs a physical anchor before any philosophy.' },
      { keywords: ['emotion'], name: 'SOMATIC VULNERABILITY', directive: 'Replace the named emotion with what the BODY did.' },
      { keywords: ['named', 'individuals', 'people'], name: 'NAMED CHARACTER', directive: 'A person needs to be ON THE PAGE. One name + one physical detail.' },
      { keywords: ['evidence', 'claim', 'without'], name: 'EVIDENCE ANCHORING', directive: 'The claim exceeds the evidence. Identify the SPECIFIC, SMALL thing.' },
      { keywords: ['conclusion', 'ending'], name: 'RITUAL DETAIL / BOOKEND INVERSION', directive: 'Replace aspirational closing with a specific image that PROVES the transformation.' },
      { keywords: ['voice', 'shift', 'register'], name: 'VOICE COMPARISON', directive: 'Quote 2 sentences from different registers. Name which sounds more like them.' },
      { keywords: ['telling', 'showing'], name: 'SHOW THROUGH SPECIFIC ACTION', directive: 'Replace the claim with a specific moment that proves it.' },
      { keywords: ['formulaic', 'generic', 'template'], name: 'VOICE AUTHENTICITY', directive: 'Help the student find the weird, specific, only-them version.' },
      { keywords: ['cliche', 'overused'], name: 'DEFINITIONAL PIVOT', directive: 'Quote the cliche. Ask: what does this word actually mean to YOU?' },
      { keywords: ['stakes', 'risk'], name: 'STAKES ESTABLISHMENT', directive: 'What could the student LOSE? What was at risk?' },
      { keywords: ['compress', 'rushed'], name: 'SCENE EXPANSION', directive: 'The most important moment needs more space. The reader needs to LINGER.' },
      { keywords: ['transition', 'disconnected'], name: 'BRIDGE SENTENCE', directive: 'Write a 1-sentence bridge using a detail that lives in BOTH worlds.' },
      { keywords: ['parallel', 'connection'], name: 'ENACTED PARALLEL', directive: 'Instead of explaining the connection, show it through structural echo.' },
    ];

    for (const route of routes) {
      if (route.keywords.some(kw => lower.includes(kw))) {
        return { name: route.name, directive: route.directive };
      }
    }
    return null;
  }

  // ==========================================================================
  // PORT A2 (Wave-1a): VOICE-PROFILE IMPORT + PERSISTENCE
  // ==========================================================================
  // These two helpers wrap the voiceProfileService calls so the pipeline can
  // (a) read a prior StudentVoiceProfile before L3.75 runs and (b) write the
  // derived voice back after L3.75 completes. Both are gated on a feature
  // flag + a supplied userId. Failures are NON-FATAL by design — analysis
  // must never break because cross-essay voice persistence had a hiccup.

  /**
   * Load the persisted StudentVoiceProfile for this user when the feature is
   * enabled AND a userId is supplied. Returns null otherwise, or when the
   * load fails (we log and continue — never throw).
   */
  private async loadPriorVoiceProfile(
    userId: string | undefined,
  ): Promise<import('../../voiceProfile/types').StudentVoiceProfile | null> {
    if (!userId) return null;
    if (process.env.ENABLE_VOICE_PROFILE_IMPORT !== 'true') return null;

    try {
      const { voiceProfileService } = await import('../../voiceProfile/voiceProfileService');
      const profile = await voiceProfileService.load(userId);
      if (profile) {
        console.log(
          `[Orchestrator] Port A2 — loaded prior voice profile for user ${userId} ` +
          `(version=${profile.version}, samples=${profile.sampleCount}, ` +
          `confidence=${profile.confidence.toFixed(2)})`,
        );
      } else {
        console.log(`[Orchestrator] Port A2 — no prior voice profile for user ${userId} (first-time analysis)`);
      }
      return profile;
    } catch (error) {
      console.error(
        `[Orchestrator] Port A2 — voice profile load failed (non-fatal):`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  /**
   * Fire-and-forget persistence of the derived voice after L3.75 completes.
   * Uses voiceProfileService.enrichProfile when a prior exists, otherwise
   * buildFromSample. Never throws — we intentionally do NOT await this from
   * the caller so a slow Supabase write cannot delay analysis return.
   */
  private persistDerivedVoice(
    userId: string | undefined,
    essayId: string,
    essayText: string,
  ): void {
    if (!userId) return;
    if (process.env.ENABLE_VOICE_PROFILE_IMPORT !== 'true') return;

    void (async () => {
      try {
        const { voiceProfileService } = await import('../../voiceProfile/voiceProfileService');
        const existing = await voiceProfileService.load(userId);
        const next = existing
          ? await voiceProfileService.enrichProfile(userId, essayText, 'essay')
          : await voiceProfileService.buildFromSample(userId, essayText, 'essay');
        await voiceProfileService.save(next);
        console.log(
          `[Orchestrator] Port A2 — persisted voice profile for user ${userId} ` +
          `after essay ${essayId} (version=${next.version}, samples=${next.sampleCount})`,
        );
      } catch (error) {
        console.error(
          `[Orchestrator] Port A2 — voice profile persistence failed (non-fatal):`,
          error instanceof Error ? error.message : String(error),
        );
      }
    })();
  }

  // ==========================================================================
  // PORT F2 (Wave-1b): aiRiskScorer → ProfileIndex.aiRiskSignal
  // ==========================================================================
  // Runs the heuristic AI-authoring risk scorer once per essay, writes the
  // result into ProfileIndex.aiRiskSignal, and lets L3.75 read it as a
  // diagnostic prior inside the INTENTIONALITY CALIBRATION block. GATED on
  // ENABLE_AI_RISK_SIGNAL because the scorer has elevated false-positive
  // rates on non-native English speakers (per Verdict §6 Q6). The gate
  // stays opt-in until a 2-week ESL A/B confirms FP ≤ 10%.
  //
  // NEVER FATAL: a scorer throw does not stop analysis. L3.75 simply runs
  // without the prior (pre-port-identical behavior).
  //
  // RUN ORDER: after L1/L2 complete, before L3 (and therefore before L3.75).
  // The scorer is a pure text function — L3's walk does not read the signal,
  // so running before or after L3 is functionally equivalent; running before
  // keeps the signal visible for the entire `after_l3` checkpoint.

  /**
   * Port A3 (Wave-1a gap-fix): detect the UC PIQ prompt type from essay text
   * and write it into ProfileIndex.piqPromptType so L3.5's PIQ_MODE branch
   * can activate. Without this call, piqPromptType stays null for every PIQ
   * essay and A3 is a silent no-op — the PIQ 13-dimension rubric, the
   * prompt-specific primary-dimensions guidance, and G3's PIQ dimension
   * anchors all sit dormant in the cached system prompt.
   *
   * Only called when input.essayType === 'piq'. Non-PIQ paths never hit this
   * method and piqPromptType stays null (which is the correct state for
   * non-PIQ essays — A3's block is essayType-gated).
   *
   * NON-BLOCKING: detectPIQType is a pure keyword-match over essay text, but
   * the try/catch protects against future refactors that make it async or
   * network-bound. A failure leaves piqPromptType null (same as non-PIQ),
   * producing pre-A3-identical behavior at L3.5.
   */
  private async computeAndWritePiqPromptType(
    coordinator: import('../profileManager/essayProfileManager').EssayProfileCoordinator,
    essayText: string,
  ): Promise<void> {
    try {
      const { detectPIQType } = await import('../../piq/prompts/promptMetadata');
      const promptType = detectPIQType(essayText);
      coordinator.updatePiqPromptType(promptType);
      console.log(
        `[Orchestrator] Port A3 — piqPromptType detected and written to ProfileIndex: ${promptType}`,
      );
    } catch (error) {
      console.error(
        `[Orchestrator] Port A3 — detectPIQType failed (non-fatal, A3 will be a no-op on this essay):`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async computeAndWriteAiRiskSignal(
    coordinator: import('../profileManager/essayProfileManager').EssayProfileCoordinator,
    essayText: string,
  ): Promise<void> {
    if (process.env.ENABLE_AI_RISK_SIGNAL !== 'true') return;

    try {
      const { aiRiskScorer } = await import('../../authenticity/aiRiskScorer');
      const assessment = aiRiskScorer.assessRisk(essayText);

      // Normalize the scorer's 0-100 overallRisk to 0..1 for the seam, and
      // derive a confidence from the essay length (the scorer short-circuits
      // on < 10 words / < 2 sentences to a minimal zero-risk assessment;
      // treat those as low-confidence). The `open` slot carries the flagged-
      // passage count + dominant-signal hint so downstream consumers have
      // freeform metadata without schema change.
      const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
      const confidence = wordCount >= 200 ? 0.85 : wordCount >= 50 ? 0.55 : 0.2;

      const topSignal = this.dominantAiRiskSignal(assessment.metrics);
      const flaggedCount = assessment.flaggedPassages.length;
      const open = JSON.stringify({
        topSignal,
        flaggedCount,
        riskLevel: assessment.riskLevel,
        wordCount,
      });

      // Build a descriptive notes string (lint scans the block body, not
      // this notes string directly — but we still author it observationally
      // to avoid contaminating any future block that interpolates it).
      const notesParts: string[] = [];
      notesParts.push(`heuristic overallRisk: ${assessment.overallRisk}/100`);
      if (topSignal) notesParts.push(`top signal: ${topSignal.name} (${topSignal.score}/100)`);
      if (flaggedCount > 0) notesParts.push(`${flaggedCount} flagged passage(s)`);
      notesParts.push(`word count: ${wordCount}`);
      const notes = notesParts.join('; ');

      coordinator.updateAiRiskSignal({
        score: assessment.overallRisk / 100,
        notes,
        confidence,
        open,
      });

      console.log(
        `[Orchestrator] Port F2 — aiRiskSignal written to ProfileIndex: ` +
        `score=${(assessment.overallRisk / 100).toFixed(2)}, ` +
        `confidence=${confidence.toFixed(2)}, ` +
        `flagged=${flaggedCount}, ` +
        `riskLevel=${assessment.riskLevel}`,
      );
    } catch (error) {
      console.error(
        `[Orchestrator] Port F2 — aiRiskScorer compute failed (non-fatal):`,
        error instanceof Error ? error.message : String(error),
      );
      // Intentionally do NOT write a null signal on failure. The seam stays
      // absent (pre-port-identical prompt) rather than being populated with
      // degraded data.
    }
  }

  /**
   * Pick the single highest-weighted aiRiskScorer signal for the `open`
   * metadata slot. Returns null when no signal crossed a reporting threshold.
   */
  private dominantAiRiskSignal(
    metrics: Record<string, number>,
  ): { name: string; score: number } | null {
    let bestName: string | null = null;
    let bestScore = 0;
    for (const [name, score] of Object.entries(metrics)) {
      if (typeof score === 'number' && score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }
    if (bestName === null || bestScore < 20) return null;
    return { name: bestName, score: bestScore };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisOrchestrator = new AnalysisOrchestrator();

// ============================================================================
// LAUNCH 3: STANDALONE FUNCTION EXPORTS
// ============================================================================
// These top-level functions allow ReanalysisOrchestrator (and tests) to call
// the pipeline without referencing the singleton object directly.

/**
 * Standalone wrapper for analyzeEssay. Delegates to the singleton.
 * Optionally accepts a ReanalysisBrief (used by re-analysis passes
 * to pass context to L5 annotations via input.reanalysisBrief).
 *
 * FIX 1.7: Brief is no longer ignored — it is threaded into PipelineInput
 * so that deepAnnotationService.generateAnnotations() receives it.
 */
export async function analyzeEssay(
  input: PipelineInput,
  reanalysisBrief?: ReanalysisBrief,
): Promise<PipelineResult> {
  // Merge the brief into the input so the orchestrator's internal methods can use it
  const mergedInput: PipelineInput = reanalysisBrief
    ? { ...input, reanalysisBrief }
    : input;
  return analysisOrchestrator.analyzeEssay(mergedInput);
}

/**
 * Run comprehensive re-analysis with a ReanalysisBrief.
 * Called by ReanalysisOrchestrator when significant changes warrant a full pipeline.
 *
 * FIX 1.7: Brief is now properly passed through to the pipeline.
 */
export async function analyzeEssayWithBrief(
  input: PipelineInput,
  brief: ReanalysisBrief,
  _existingProfile?: EssayProfile,
): Promise<PipelineResult> {
  return analyzeEssay(input, brief);
}
