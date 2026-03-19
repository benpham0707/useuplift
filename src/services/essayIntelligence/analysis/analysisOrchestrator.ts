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
} from '../profileTypes';

import type { StructuralCartography } from '../types';
import { classifyError } from '../../../lib/llm/claude';
import type { LayerError } from '../../../lib/llm/claude';

// Layer services
import { firstImpressionsService } from './firstImpressions';
import type { FirstImpressionsResult } from './firstImpressions';
import { structuralCartographerService } from './structuralCartographer';
import type { StructuralCartographyResult } from './structuralCartographer';
import { scoutPassService } from './scoutPass';
import type { ScoutPassResult } from './scoutPass';
import { sequentialDeepWalkService } from './sequentialDeepWalk';
import type { L3WalkResult } from './sequentialDeepWalk';
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
import { EssayProfileCoordinator } from '../profileManager/essayProfileManager';
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

    console.log(
      `[Orchestrator] Starting full analysis — essayId=${input.essayId}, ` +
      `type=${input.essayType}, textLength=${input.essayText.length}`,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Foundation (L1 + AO First Read parallel → L2 + L2.5 parallel)
    // ═══════════════════════════════════════════════════════════════════════

    // ── L1: First Impressions (FATAL) + AO First Read (non-fatal) — PARALLEL ──
    // GAP-4: AO First Read runs alongside L1 at zero added latency.
    // L1 failure is FATAL. AO failure is gracefully degraded (null on profile).
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
      return this.buildPartialResult(null, layersCompleted, layersFailed, costTracker, startTime);
    }
    l1Result = l1Settled.value;
    costTracker.record('L1', l1Result.cost, l1Result.tokenUsage, l1Result.timingMs);
    layersCompleted.push('L1');
    console.log(
      `[Orchestrator] L1 complete: ${l1Result.impressions.length} paragraphs, ` +
      `cost=$${l1Result.cost.toFixed(4)}, time=${l1Result.timingMs}ms`,
    );

    // Handle AO First Read (non-fatal — graceful degradation)
    if (aoSettled.status === 'fulfilled') {
      aoFirstReadResult = aoSettled.value;
      costTracker.record('AOFirstRead', aoFirstReadResult.cost, aoFirstReadResult.tokenUsage, aoFirstReadResult.timingMs);
      console.log(
        `[Orchestrator] AO First Read complete: putDownRisk=${aoFirstReadResult.firstRead.putDownRisk}, ` +
        `cost=$${aoFirstReadResult.cost.toFixed(4)}, time=${aoFirstReadResult.timingMs}ms`,
      );
    } else {
      console.warn(
        `[Orchestrator] AO First Read failed (non-fatal): ` +
        `${aoSettled.reason instanceof Error ? aoSettled.reason.message : String(aoSettled.reason)}`,
      );
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
    const coordinator = EssayProfileCoordinator.createNew({
      essayText: input.essayText,
      paragraphTexts,
      sentenceTexts,
      metadata: {
        essayType: input.essayType,
        wordCount,
        promptText: input.promptText,
      },
      checkpointStore,
    });

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
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
    }

    // ── Checkpoint after Phase 1 ──
    await this.safeCheckpoint(coordinator, 'after_l1_l2');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Sequential Deep Walk (L3 — FAIL-FAST)
    // ═══════════════════════════════════════════════════════════════════════

    let l3Result: L3WalkResult;
    try {
      const profile = coordinator.getProfile();

      // Build reanalysis context string for L3 walk injection (Fix A3.1)
      let l3ReanalysisContext: string | undefined;
      if (input.reanalysisBrief) {
        const brief = input.reanalysisBrief;
        const staleLines = brief.staleAreas.map((a) => `• ${a}`).join('\n');
        l3ReanalysisContext = `${brief.summaryForPrompt}${staleLines ? `\n\nSTALE AREAS:\n${staleLines}` : ''}`;
      }

      // Pass FindingStore to walk so it can see prior findings (re-analysis evolution)
      const walkFindingStore = coordinator.getFindingStore();

      l3Result = await sequentialDeepWalkService.walkEssay(
        input.essayText,
        profile as EssayProfile,
        structuralMap,
        scoutOutput,
        l1Result.impressions,
        {
          reanalysisContext: l3ReanalysisContext,
          findingStore: walkFindingStore.size > 0 ? walkFindingStore : undefined,
        },
      );

      // Apply each walk step to the coordinator
      for (const walkOutput of l3Result.walkOutputs) {
        coordinator.applyUnderstandingWalkStep(walkOutput);
      }

      costTracker.record('L3', l3Result.cost, l3Result.tokenUsage, l3Result.timingMs);
      layersCompleted.push('L3');

      console.log(
        `[Orchestrator] L3 complete: ${l3Result.walkOutputs.length} paragraphs walked, ` +
        `${l3Result.skippedParagraphs.length} skipped, ` +
        `${l3Result.backPropagations.length} back-props, ` +
        `cost=$${l3Result.cost.toFixed(4)}, time=${l3Result.timingMs}ms`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L3', error, costTracker.summarize(0).totalCost));
      await this.safeCheckpoint(coordinator, 'after_l3');
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
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
      );

      // Apply the final synthesis to the profile
      coordinator.applyHolisticSynthesis(growthResult.finalSynthesis);
      growthReadingStrategy = growthResult.readingStrategy;

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
        `${growthResult.growthState.activityLog.length} activity records`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L3.75', error, costTracker.summarize(0).totalCost));
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
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
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
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

      l4Result = await crystallizerService.crystallize(
        profileForCrystal as EssayProfile,
        input.essayType,
        input.essayText,
        priorNorthStar,
        findingStoreForL4.size > 0 ? findingStoreForL4 : undefined,
        connectionGraphForL4.totalCount > 0 ? connectionGraphForL4 : undefined,
      );

      // applyNorthStar triggers checkpoint('after_l4') internally
      coordinator.applyNorthStar(l4Result.northStar);
      coordinator.applyScoreMatrix(l4Result.scoreMatrix);
      coordinator.applyCoherenceReport(l4Result.coherenceReport);

      costTracker.record('L4', l4Result.cost, l4Result.tokenUsage, l4Result.timingMs);
      layersCompleted.push('L4');

      console.log(
        `[Orchestrator] L4 complete: North Star crystallized, ` +
        `coherent=${l4Result.coherenceReport.isCoherent}, ` +
        `contradictions=${l4Result.coherenceReport.contradictions.length}, ` +
        `scoreMatrix=${l4Result.scoreMatrix.paragraphs.length} paragraphs, ` +
        `cost=$${l4Result.cost.toFixed(4)}, time=${l4Result.timingMs}ms`,
      );
    } catch (error) {
      layersFailed.push(this.buildLayerError('L4', error, costTracker.summarize(0).totalCost));
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
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
      // Contradiction consumption is NOT fatal — log and continue
      console.error(
        '[Orchestrator] W4.4: Contradiction consumption failed (non-fatal):',
        error instanceof Error ? error.message : String(error),
      );
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
          }
        } catch (error) {
          // Delta synthesis failure is NOT fatal — pipeline continues with existing holistic sections
          console.error(
            '[Orchestrator] W5.4a: Delta synthesis failed (non-fatal):',
            error instanceof Error ? error.message : String(error),
          );
        }
      }
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
        l5Result = await deepAnnotationService.generateAnnotations(
          profileForAnnotations as EssayProfile,
          input.reanalysisBrief,
          contradictionAnnotationFlags,
          findingStoreForL5.size > 0 ? findingStoreForL5 : undefined,
          growthReadingStrategy,
        );

        costTracker.record('L5', l5Result.cost, l5Result.tokenUsage, l5Result.timingMs);
        layersCompleted.push('L5');

        console.log(
          `[Orchestrator] L5 complete: ${l5Result.annotationCount} annotations ` +
          `(${l5Result.crossParagraphAnnotations.length} cross-paragraph), ` +
          `phase=${l5Result.phase}, ` +
          `cost=$${l5Result.cost.toFixed(4)}, time=${l5Result.timingMs}ms`,
        );

        // Checkpoint after L5
        await this.safeCheckpoint(coordinator, 'after_l5');
      } catch (error) {
        layersFailed.push(this.buildLayerError('L5', error, costTracker.summarize(0).totalCost));
        return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
      }
    } else {
      console.log('[Orchestrator] L5 skipped: annotations disabled');
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

    return {
      profile: finalProfile,
      completedAllLayers,
      highestCompletedLayer: this.highestLayerCompleted(layersCompleted),
      costSummary,
      layersCompleted,
      layersFailed,
      improvementPhase: l35Result.improvementPhase,
      confidenceLevel: this.computeConfidenceLevel(layersCompleted, l4Result.coherenceReport),
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

      // ── Step 2: L3.75 says converged? Trust it (after at least 1 iteration). ──
      if (currentSynthesis.selfAssessedConvergence.hasConverged && state.iteration >= 1) {
        state.isConverged = true;
        state.convergenceReason = 'llm_converged';
        break;
      }

      // ── Step 3: Run re-reads L3.75 flagged ──
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
              // Fallback: direct push (should not happen in normal pipeline)
              console.warn(
                `[Orchestrator] No coordinator available for re-read connection absorption — ` +
                `falling back to direct push (bypasses duplicate detection + connectionRef management)`,
              );
              for (const conn of connectionsToAdd) {
                try {
                  profile.connections.all.push({
                    id: `CR${state.iteration}_P${reRead.paragraph}_${reReadConnectionsAbsorbed}`,
                    from: conn.from,
                    to: conn.to,
                    description: conn.description,
                    reverseIllumination: conn.reverseIllumination,
                    significance: conn.significance,
                    strengthCategory: conn.strengthCategory,
                    directionality: conn.directionality,
                    discoveredBy: conn.discoveredBy,
                    routingTags: [],
                    status: 'active',
                    relatedFindings: [],
                    createdAt: new Date().toISOString(),
                  });
                  reReadConnectionsAbsorbed++;
                } catch (e) {
                  console.warn(
                    `[Orchestrator] Failed to absorb re-read connection from P${reRead.paragraph}: ` +
                    `${e instanceof Error ? e.message : String(e)}`,
                  );
                }
              }
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

      // ── Step 4: Dispatch deep dives (persistent queue as primary signal) ──
      // Gap 2: Use persistent queue's open questions for dispatch instead of ephemeral curated queue
      const dives = dispatchDeepDives(
        currentSynthesis.questionCuration.curatedQueue,
        state.budgetRemaining,
      );

      for (const dive of dives) {
        if (state.budgetRemaining < MIN_BUDGET_FOR_STEP) break;

        try {
          const diveResult = await runDeepDive(
            dive,
            essayText,
            profile,
            currentSynthesis.synthesis,
            currentSynthesis.readingStrategy,
            findingStore,
          );

          state.budgetRemaining -= diveResult.cost;
          costTracker.record(
            `deep_dive_${dive.promptType}`,
            diveResult.cost,
            diveResult.tokenUsage,
            diveResult.timingMs,
          );

          // Merge findings from deep dive
          if (diveResult.findings.length > 0) {
            const newFindingObjects = diveResult.findings.map((f, idx) => ({
              ...f,
              id: `FD${state.iteration}_${dive.promptType}_${idx}`,
              source: 'deep_dive' as const,
              buildsOn: f.buildsOn ?? [],
              relatedTo: f.relatedTo ?? [],
              raisesQuestions: f.raisesQuestions ?? [],
              lineage: [],
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
            })) as Finding[];
            cumulativeFindings = mergeFindingsFromDeepDive(cumulativeFindings, newFindingObjects);
          }

          // Gap 2: Mark the question as resolved if deep dive answered it
          if (dive.question.id) {
            queueManager.resolve(
              dive.question.id,
              `deep_dive_${dive.promptType}`,
              diveResult.discoveryNote || 'Investigated via deep dive',
            );
          }

          // Gap 2: Add new questions from deep dive to persistent queue
          for (const newQ of diveResult.questionsRaised) {
            if (dive.question.id) {
              queueManager.spawnChild(dive.question.id, newQ);
            } else {
              queueManager.addQuestion(newQ);
            }
          }

          const diveStep: StepResult = {
            findingsAdded: diveResult.findings.length,
            questionsRaised: diveResult.questionsRaised.length,
            cost: diveResult.cost,
            discoveryNote: diveResult.discoveryNote,
          };
          state.activityLog.push(buildStepRecord(`deep_dive_${dive.promptType}`, diveStep));
        } catch (error) {
          console.warn(
            `[Orchestrator] Deep dive ${dive.promptType} failed (non-fatal):`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

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
   */
  private async safeCheckpoint(
    coordinator: EssayProfileCoordinator,
    reason: CheckpointReason,
  ): Promise<void> {
    try {
      await coordinator.checkpoint(reason);
    } catch (error) {
      console.error(
        `[Orchestrator] Checkpoint failed (${reason}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
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
   */
  private buildPartialResult(
    coordinator: EssayProfileCoordinator | null,
    layersCompleted: string[],
    layersFailed: LayerError[],
    costTracker: CostTracker,
    startTime: number,
  ): PipelineResult {
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
