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
 * Error recovery:
 *   L1: FATAL (no profile without impressions → abort)
 *   L2: survivable (L3 can walk without structural map, quality degrades)
 *   L2.5: survivable (L3 walks without scout leads)
 *   L3: FATAL (no understanding → nothing downstream can run)
 *   L3.75: survivable (holistic sections stay empty, L3.5 still has per-paragraph data)
 *   L3.5: FATAL (no analysis → no improvement phase → no annotations)
 *   L4: survivable (no North Star → annotations less architecture-grounded)
 *   L5: survivable (annotations are ephemeral — return result without them)
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
} from '../profileTypes';

import type { StructuralCartography } from '../types';

// Layer services
import { firstImpressionsService } from './firstImpressions';
import type { FirstImpressionsResult } from './firstImpressions';
import { structuralCartographerService } from './structuralCartographer';
import type { StructuralCartographyResult } from './structuralCartographer';
import { scoutPassService } from './scoutPass';
import type { ScoutPassResult } from './scoutPass';
import { sequentialDeepWalkService } from './sequentialDeepWalk';
import type { L3WalkResult } from './sequentialDeepWalk';
import { holisticSynthesisService } from './holisticSynthesis';
import type { HolisticSynthesisResult } from './holisticSynthesis';
import { analysisPassService } from './analysisPass';
import type { L35AnalysisResult } from './analysisPass';
import { crystallizerService } from './crystallizer';
import type { L4CrystallizationResult } from './crystallizer';
import { deepAnnotationService } from './deepAnnotationService';
import type { L5AnnotationResult } from './deepAnnotationService';

// Profile manager
import { EssayProfileCoordinator } from '../profileManager/essayProfileManager';
import { InMemoryCheckpointStore } from '../profileManager/checkpointStore';

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
  /** Which layers failed (with error messages) */
  layersFailed: Array<{ layer: string; error: string }>;
  /** Computed improvement phase (from L3.5) */
  improvementPhase: ImprovementPhase | null;
  /** Profile confidence level */
  confidenceLevel: ConfidenceLevel;
  /** L5 annotation result (ephemeral — not stored in profile) */
  annotations: L5AnnotationResult | null;
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
    const layersFailed: Array<{ layer: string; error: string }> = [];
    const includeAnnotations = input.includeAnnotations ?? true;

    const checkpointStore = input.checkpointStore ?? new InMemoryCheckpointStore();

    console.log(
      `[Orchestrator] Starting full analysis — essayId=${input.essayId}, ` +
      `type=${input.essayType}, textLength=${input.essayText.length}`,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Foundation (L1 first → L2 + L2.5 parallel)
    // ═══════════════════════════════════════════════════════════════════════

    // ── L1: First Impressions (FATAL on failure) ──
    let l1Result: FirstImpressionsResult;
    try {
      l1Result = await firstImpressionsService.analyze(input.essayText);
      costTracker.record('L1', l1Result.cost, l1Result.tokenUsage, l1Result.timingMs);
      layersCompleted.push('L1');
      console.log(
        `[Orchestrator] L1 complete: ${l1Result.impressions.length} paragraphs, ` +
        `cost=$${l1Result.cost.toFixed(4)}, time=${l1Result.timingMs}ms`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Orchestrator] L1 FATAL:', msg);
      layersFailed.push({ layer: 'L1', error: msg });
      // L1 is FATAL — return immediately with empty result
      return this.buildPartialResult(null, layersCompleted, layersFailed, costTracker, startTime);
    }

    // ── Parse essay structure from L1 output ──
    const paragraphTexts = l1Result.impressions.map((imp) => {
      // Reconstruct paragraph text from sentence texts
      return imp.sentences.map((s) => s.text).join(' ');
    });
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

    // ── Apply L1 impressions to profile ──
    coordinator.applyFirstImpressions(l1Result.impressions);

    // ── L2 + L2.5 in parallel (both survivable) ──
    let structuralMap: StructuralCartography | null = null;
    let scoutOutput: ConnectionScoutOutput | null = null;

    const [l2Outcome, l25Outcome] = await Promise.allSettled([
      this.runL2(input.essayText, l1Result.impressions, costTracker),
      this.runL2_5(input.essayText, l1Result.impressions, costTracker),
    ]);

    if (l2Outcome.status === 'fulfilled' && l2Outcome.value) {
      structuralMap = l2Outcome.value.cartography;
      coordinator.applyStructuralCartography(structuralMap);
      layersCompleted.push('L2');
      console.log(
        `[Orchestrator] L2 complete: arc=${structuralMap.arcType}, ` +
        `cost=$${l2Outcome.value.cost.toFixed(4)}`,
      );
    } else {
      const msg = l2Outcome.status === 'rejected'
        ? (l2Outcome.reason instanceof Error ? l2Outcome.reason.message : String(l2Outcome.reason))
        : 'null result';
      console.error(`[Orchestrator] L2 failed (survivable): ${msg}`);
      layersFailed.push({ layer: 'L2', error: msg });
    }

    if (l25Outcome.status === 'fulfilled' && l25Outcome.value) {
      scoutOutput = l25Outcome.value.scoutOutput;
      coordinator.applyScoutLeads(scoutOutput);
      layersCompleted.push('L2.5');
      console.log(
        `[Orchestrator] L2.5 complete: ` +
        `${scoutOutput.repeatedElements.length} repeated, ` +
        `${scoutOutput.tonalShifts.length} shifts, ` +
        `${scoutOutput.structuralEchoes.length} echoes, ` +
        `cost=$${l25Outcome.value.cost.toFixed(4)}`,
      );
    } else {
      const msg = l25Outcome.status === 'rejected'
        ? (l25Outcome.reason instanceof Error ? l25Outcome.reason.message : String(l25Outcome.reason))
        : 'null result';
      console.error(`[Orchestrator] L2.5 failed (survivable): ${msg}`);
      layersFailed.push({ layer: 'L2.5', error: msg });
    }

    // ── Checkpoint after Phase 1 ──
    await this.safeCheckpoint(coordinator, 'after_l1_l2');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Sequential Deep Walk (L3 — FATAL on failure)
    // ═══════════════════════════════════════════════════════════════════════

    let l3Result: L3WalkResult;
    try {
      const profile = coordinator.getProfile();
      l3Result = await sequentialDeepWalkService.walkEssay(
        input.essayText,
        profile as EssayProfile,
        structuralMap as StructuralCartography,
        scoutOutput,
        l1Result.impressions,
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
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Orchestrator] L3 FATAL:', msg);
      layersFailed.push({ layer: 'L3', error: msg });
      // L3 is FATAL — checkpoint whatever we have and return
      await this.safeCheckpoint(coordinator, 'after_l3');
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
    }

    // ── Checkpoint after Phase 2 ──
    await this.safeCheckpoint(coordinator, 'after_l3');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Holistic Synthesis (L3.75 — survivable)
    // ═══════════════════════════════════════════════════════════════════════

    try {
      const profileForSynthesis = coordinator.getProfile();
      const l375Result: HolisticSynthesisResult = await holisticSynthesisService.synthesize({
        essayText: input.essayText,
        profile: profileForSynthesis as EssayProfile,
        holisticEvolution: l3Result.holisticEvolution,
      });

      // applyHolisticSynthesis triggers checkpoint('after_l3_75') internally
      coordinator.applyHolisticSynthesis(l375Result.synthesis);

      costTracker.record('L3.75', l375Result.cost, l375Result.tokenUsage, l375Result.timingMs);
      layersCompleted.push('L3.75');

      console.log(
        `[Orchestrator] L3.75 complete: holistic synthesis applied, ` +
        `cost=$${l375Result.cost.toFixed(4)}, time=${l375Result.timingMs}ms`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] L3.75 failed (survivable): ${msg}`);
      layersFailed.push({ layer: 'L3.75', error: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Analysis Pass (L3.5 — FATAL on failure)
    // ═══════════════════════════════════════════════════════════════════════

    let l35Result: L35AnalysisResult;
    try {
      const profileForAnalysis = coordinator.getProfile();
      l35Result = await analysisPassService.analyzeAllParagraphs(profileForAnalysis as EssayProfile);

      // Apply each paragraph's analysis to the coordinator
      for (const paragraphAnalysis of l35Result.paragraphAnalyses) {
        coordinator.applyAnalysisPassResult(paragraphAnalysis);
      }

      costTracker.record('L3.5', l35Result.cost, l35Result.tokenUsage, l35Result.timingMs);
      layersCompleted.push('L3.5');

      if (l35Result.failedParagraphs.length > 0) {
        console.warn(
          `[Orchestrator] L3.5 partial: ${l35Result.failedParagraphs.length} paragraphs failed: ` +
          l35Result.failedParagraphs.map((f) => `P${f.index}(${f.error})`).join(', '),
        );
      }

      console.log(
        `[Orchestrator] L3.5 complete: ${l35Result.paragraphAnalyses.length} paragraphs analyzed, ` +
        `phase=${l35Result.improvementPhase.level}, ` +
        `cost=$${l35Result.cost.toFixed(4)}, time=${l35Result.timingMs}ms`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Orchestrator] L3.5 FATAL:', msg);
      layersFailed.push({ layer: 'L3.5', error: msg });
      // L3.5 is FATAL — no analysis means no improvement phase, no annotations
      await this.safeCheckpoint(coordinator, 'after_l3_5');
      return this.buildPartialResult(coordinator, layersCompleted, layersFailed, costTracker, startTime);
    }

    // ── Checkpoint after Phase 4 ──
    await this.safeCheckpoint(coordinator, 'after_l3_5');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Crystallization (L4 — survivable)
    // ═══════════════════════════════════════════════════════════════════════

    try {
      const profileForCrystal = coordinator.getProfile();
      const l4Result: L4CrystallizationResult = await crystallizerService.crystallize(
        profileForCrystal as EssayProfile,
        input.essayType,
        input.essayText,
      );

      // applyNorthStar triggers checkpoint('after_l4') internally
      coordinator.applyNorthStar(l4Result.northStar);

      costTracker.record('L4', l4Result.cost, l4Result.tokenUsage, l4Result.timingMs);
      layersCompleted.push('L4');

      console.log(
        `[Orchestrator] L4 complete: North Star crystallized, ` +
        `coherent=${l4Result.coherenceReport.isCoherent}, ` +
        `contradictions=${l4Result.coherenceReport.contradictions.length}, ` +
        `cost=$${l4Result.cost.toFixed(4)}, time=${l4Result.timingMs}ms`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] L4 failed (survivable): ${msg}`);
      layersFailed.push({ layer: 'L4', error: msg });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: Annotations (L5 — survivable, ephemeral)
    // ═══════════════════════════════════════════════════════════════════════

    let l5Result: L5AnnotationResult | null = null;

    if (includeAnnotations) {
      try {
        const profileForAnnotations = coordinator.getProfile();
        l5Result = await deepAnnotationService.generateAnnotations(
          profileForAnnotations as EssayProfile,
        );

        costTracker.record('L5', l5Result.cost, l5Result.tokenUsage, l5Result.timingMs);
        layersCompleted.push('L5');

        console.log(
          `[Orchestrator] L5 complete: ${l5Result.annotationCount} annotations, ` +
          `phase=${l5Result.phase}, ` +
          `cost=$${l5Result.cost.toFixed(4)}, time=${l5Result.timingMs}ms`,
        );

        // Checkpoint after L5
        await this.safeCheckpoint(coordinator, 'after_l5');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Orchestrator] L5 failed (survivable): ${msg}`);
        layersFailed.push({ layer: 'L5', error: msg });
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
      improvementPhase: l35Result!.improvementPhase,
      confidenceLevel: this.computeConfidenceLevel(layersCompleted),
      annotations: l5Result,
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
  // PRIVATE: Helpers
  // ═══════════════════════════════════════════════════════════════════════════

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
   * Determine confidence level based on which layers completed.
   */
  private computeConfidenceLevel(layersCompleted: string[]): ConfidenceLevel {
    const has = (layer: string) => layersCompleted.includes(layer);

    if (has('L4') && has('L3.5') && has('L3.75') && has('L3')) {
      return 'comprehensive';
    }
    if (has('L3') && has('L3.5')) {
      return 'deep';
    }
    if (has('L3')) {
      return 'developing';
    }
    return 'initial';
  }

  /**
   * Return the highest-numbered layer that completed.
   */
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
    layersFailed: Array<{ layer: string; error: string }>,
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

    console.error(
      `[Orchestrator] Pipeline ABORTED — ` +
      `completed=${layersCompleted.join(',') || 'none'} | ` +
      `failed=${layersFailed.map((f) => `${f.layer}:${f.error.substring(0, 60)}`).join('; ')} | ` +
      `cost=$${costSummary.totalCost.toFixed(4)} | ` +
      `time=${totalTimingMs}ms`,
    );

    return {
      profile,
      completedAllLayers: false,
      highestCompletedLayer: this.highestLayerCompleted(layersCompleted),
      costSummary,
      layersCompleted,
      layersFailed,
      improvementPhase: null,
      confidenceLevel: this.computeConfidenceLevel(layersCompleted),
      annotations: null,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisOrchestrator = new AnalysisOrchestrator();
