/**
 * Analysis Orchestrator — Sequences Layers 1-5
 *
 * Two entry points:
 *   analyzeEssay()     — Full analysis from scratch (Layers 1-5)
 *   handleTextChange()  — Incremental re-analysis after student edits
 *
 * Layer execution:
 *   L1 (deterministic, $0.00, <200ms) → features, narrative, sentence, word
 *   L2 (Haiku, ~$0.01, ~1-2s)       → structural cartography
 *   L3 (Sonnet × N, ~$0.15-0.30, ~12-20s) → sequential deep walk ★ THE CORE ★
 *   L4 (Sonnet, ~$0.02-0.04, ~3-5s) → crystallization (Essay DNA + score matrix)
 *   L5 (Sonnet, ~$0.03-0.05, ~3-5s) → targeted annotations
 *
 * Each layer is fault-tolerant: failure in one layer doesn't block subsequent layers.
 * Whatever was computed is always saved.
 */

import { randomUUID } from 'crypto';
import type {
  AnalysisInput,
  AnalysisResult,
  AnalysisConfig,
  AnalysisPass,
  AnalysisLayer,
  EssayUnderstanding,
  ParagraphDeepAnalysis,
  RunningUnderstanding,
  StructuralCartography,
  DiffResult,
} from '../types';
import { DEFAULT_ANALYSIS_CONFIG } from '../types';
import { essayUnderstandingService } from '../essayUnderstandingService';
import { diffEngine } from '../diffEngine';
import { structuralCartographer } from './structuralCartographer';
import { sequentialDeepWalk } from './sequentialDeepWalk';
import { crystallizer } from './crystallizer';
import { deepAnnotationService } from './deepAnnotationService';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class AnalysisOrchestrator {
  /**
   * Full analysis pipeline (Layers 1-5).
   * Call this on first essay submission or when requesting a complete re-analysis.
   */
  async analyzeEssay(
    input: AnalysisInput,
    config?: Partial<AnalysisConfig>,
  ): Promise<AnalysisResult> {
    const mergedConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    const layersRun: AnalysisLayer[] = [];

    // ── Layer 1: Deterministic Foundation ──
    const l1Start = Date.now();
    let understanding: EssayUnderstanding;
    try {
      understanding = await essayUnderstandingService.buildInitial(input);
      layersRun.push('deterministic');
      console.log(`[AnalysisOrchestrator] Layer 1 complete: ${understanding.paragraphs.length} paragraphs, ${understanding.features?.sentenceCount ?? 0} sentences`);
    } catch (error) {
      console.error('[AnalysisOrchestrator] Layer 1 failed:', error);
      throw new Error(`Layer 1 (deterministic) failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    timings.layer1 = Date.now() - l1Start;

    // ── Layer 2: Structural Cartography (Haiku) ──
    const l2Start = Date.now();
    let structuralMap: StructuralCartography | null = null;
    try {
      const l2Result = await structuralCartographer.analyzeStructure(input.text, understanding);
      structuralMap = l2Result.cartography;
      understanding.structuralCartography = structuralMap;

      // Store structural roles on paragraphs
      for (const role of structuralMap.paragraphRoles) {
        if (understanding.paragraphs[role.index]) {
          understanding.paragraphs[role.index].structuralRole = {
            role: role.role,
            narrativeFunction: role.narrativeFunction,
            strengthContribution: role.strengthContribution,
            weaknessFlag: role.weaknessFlag,
          };
        }
      }

      totalCost += l2Result.cost;
      totalInputTokens += l2Result.tokenUsage.inputTokens;
      totalOutputTokens += l2Result.tokenUsage.outputTokens;
      layersRun.push('structural');
      console.log(`[AnalysisOrchestrator] Layer 2 complete: arc=${structuralMap.arcType}, theme="${structuralMap.centralTheme?.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[AnalysisOrchestrator] Layer 2 failed (continuing with null structural map):', error);
    }
    timings.layer2 = Date.now() - l2Start;

    // ── Layer 3: Sequential Deep Walk (Sonnet × N paragraphs) ★ THE CORE ★ ──
    const l3Start = Date.now();
    let allParagraphAnalyses: ParagraphDeepAnalysis[] = [];
    let finalUnderstanding: RunningUnderstanding | null = null;
    if (structuralMap) {
      try {
        const l3Result = await sequentialDeepWalk.walkEssay(
          input.text,
          understanding,
          structuralMap,
        );

        allParagraphAnalyses = l3Result.paragraphAnalyses;
        finalUnderstanding = l3Result.finalUnderstanding;

        // Store on understanding hierarchy
        for (const analysis of allParagraphAnalyses) {
          const para = understanding.paragraphs[analysis.paragraphIndex];
          if (para) {
            para.deepAnalysis = analysis;
          }
        }
        for (let i = 0; i < l3Result.intermediateSnapshots.length; i++) {
          if (understanding.paragraphs[i]) {
            understanding.paragraphs[i].runningUnderstandingSnapshot = l3Result.intermediateSnapshots[i];
          }
        }
        understanding.finalUnderstanding = finalUnderstanding;

        totalCost += l3Result.cost;
        totalInputTokens += l3Result.tokenUsage.inputTokens;
        totalOutputTokens += l3Result.tokenUsage.outputTokens;
        totalCacheReadTokens += l3Result.tokenUsage.cacheReadTokens;
        totalCacheWriteTokens += l3Result.tokenUsage.cacheWriteTokens;
        layersRun.push('deep_walk');
        console.log(`[AnalysisOrchestrator] Layer 3 complete: ${allParagraphAnalyses.length} paragraphs walked, cost=$${l3Result.cost.toFixed(4)}`);
      } catch (error) {
        console.error('[AnalysisOrchestrator] Layer 3 failed (continuing without deep analysis):', error);
      }
    } else {
      console.warn('[AnalysisOrchestrator] Skipping Layer 3: no structural map available');
    }
    timings.layer3 = Date.now() - l3Start;

    // ── Layer 4: Crystallization (Essay DNA + Paragraph Score Matrix) ──
    const l4Start = Date.now();
    if (finalUnderstanding && allParagraphAnalyses.length > 0 && structuralMap) {
      try {
        const l4Result = await crystallizer.crystallize(
          understanding,
          finalUnderstanding,
          allParagraphAnalyses,
          structuralMap,
        );

        understanding.essayDNA = l4Result.essayDNA;
        understanding.paragraphScoreMatrix = l4Result.paragraphScoreMatrix;

        totalCost += l4Result.cost;
        totalInputTokens += l4Result.tokenUsage.inputTokens;
        totalOutputTokens += l4Result.tokenUsage.outputTokens;
        layersRun.push('crystallization');
        console.log(`[AnalysisOrchestrator] Layer 4 complete: EQI=${l4Result.essayDNA.overallEQI}, readiness=${l4Result.essayDNA.readinessLevel}`);
      } catch (error) {
        console.error('[AnalysisOrchestrator] Layer 4 failed (continuing without Essay DNA):', error);
      }
    } else {
      console.warn('[AnalysisOrchestrator] Skipping Layer 4: missing prerequisites');
    }
    timings.layer4 = Date.now() - l4Start;

    // ── Layer 5: Targeted Annotations ──
    const l5Start = Date.now();
    if (mergedConfig.includeAnnotations && understanding.essayDNA) {
      try {
        const l5Result = await deepAnnotationService.generateAnnotations(understanding);

        understanding.annotations = l5Result.annotations;
        // Cross-reference annotations on paragraphs
        for (const annotation of l5Result.annotations) {
          const paraIdx = annotation.span.paragraphIndex;
          if (understanding.paragraphs[paraIdx]) {
            understanding.paragraphs[paraIdx].annotations.push(annotation);
          }
        }

        totalCost += l5Result.cost;
        totalInputTokens += l5Result.tokenUsage.inputTokens;
        totalOutputTokens += l5Result.tokenUsage.outputTokens;
        layersRun.push('annotation');
        console.log(`[AnalysisOrchestrator] Layer 5 complete: ${l5Result.annotations.length} annotations generated`);
      } catch (error) {
        console.error('[AnalysisOrchestrator] Layer 5 failed (continuing without annotations):', error);
      }
    } else if (!mergedConfig.includeAnnotations) {
      console.log('[AnalysisOrchestrator] Layer 5 skipped: annotations disabled in config');
    } else {
      console.warn('[AnalysisOrchestrator] Skipping Layer 5: missing Essay DNA');
    }
    timings.layer5 = Date.now() - l5Start;

    // ── Record analysis pass ──
    const totalTimeMs = Date.now() - startTime;
    understanding.totalCostUSD = totalCost;

    const pass: AnalysisPass = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      layers: layersRun,
      trigger: 'initial',
      editedParagraphIndex: null,
      paragraphsRewalked: understanding.paragraphs.length,
      costUSD: totalCost,
      timingMs: { ...timings, total: totalTimeMs },
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: totalCacheReadTokens,
        cacheWriteTokens: totalCacheWriteTokens,
      },
    };
    understanding.analysisPasses.push(pass);

    // ── Save to DB (fire-and-forget) ──
    essayUnderstandingService.save(understanding).catch(error => {
      console.error('[AnalysisOrchestrator] Failed to save understanding:', error);
    });

    console.log(`[AnalysisOrchestrator] Full analysis complete in ${totalTimeMs}ms, cost=$${totalCost.toFixed(4)}, layers=${layersRun.join(',')}`);

    return {
      understanding,
      pass,
      isIncremental: false,
    };
  }

  /**
   * Incremental update after the student edits their essay.
   * Re-walks only from the edited paragraph forward.
   */
  async handleTextChange(
    existingUnderstanding: EssayUnderstanding,
    newText: string,
    config?: Partial<AnalysisConfig>,
  ): Promise<AnalysisResult> {
    const mergedConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    const layersRun: AnalysisLayer[] = [];

    // ── Step 1: Diff detection ──
    const oldText = existingUnderstanding.paragraphs.map(p => p.text).join('\n\n');
    const diff: DiffResult = diffEngine.diffText(oldText, newText, existingUnderstanding.paragraphs);

    if (!diff.hasChanges) {
      console.log('[AnalysisOrchestrator] No meaningful changes detected, returning existing understanding');
      return {
        understanding: existingUnderstanding,
        pass: {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          layers: [],
          trigger: 'text_edit',
          editedParagraphIndex: null,
          paragraphsRewalked: 0,
          costUSD: 0,
          timingMs: { total: Date.now() - startTime },
          tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
        },
        isIncremental: true,
      };
    }

    let understanding = { ...existingUnderstanding };

    // ── Step 2: Apply staleness ──
    understanding = essayUnderstandingService.applyStaleness(understanding, diff);

    // ── Step 3: Re-run Layer 1 for changed paragraphs ──
    const l1Start = Date.now();
    try {
      // Rebuild initial with new text to get updated Layer 1 data
      const freshUnderstanding = await essayUnderstandingService.buildInitial({
        essayId: understanding.essayId,
        userId: understanding.userId,
        text: newText,
        essayType: understanding.essayType,
        voiceProfile: understanding.voiceProfileSnapshot ?? undefined,
      });

      // Merge: keep non-stale paragraphs' deep analysis, update Layer 1 data
      understanding.features = freshUnderstanding.features;
      understanding.narrativeAnalysis = freshUnderstanding.narrativeAnalysis;
      understanding.textHash = freshUnderstanding.textHash;

      if (diff.structuralChange) {
        // Paragraph count changed — use fresh paragraphs entirely
        understanding.paragraphs = freshUnderstanding.paragraphs;
      } else {
        // Merge: update Layer 1 data for changed paragraphs, keep deep analysis for unchanged
        for (let i = 0; i < freshUnderstanding.paragraphs.length; i++) {
          const freshPara = freshUnderstanding.paragraphs[i];
          const existingPara = understanding.paragraphs[i];

          if (existingPara && !existingPara.stale) {
            // Unchanged paragraph — keep deep analysis, update Layer 1
            existingPara.text = freshPara.text;
            existingPara.sentences = freshPara.sentences;
            existingPara.functionAnalysis = freshPara.functionAnalysis;
            existingPara.specificityScore = freshPara.specificityScore;
            existingPara.sceneOrSummary = freshPara.sceneOrSummary;
          } else {
            // Changed paragraph — use fresh version (no deep analysis)
            understanding.paragraphs[i] = freshPara;
          }
        }
      }
      layersRun.push('deterministic');
    } catch (error) {
      console.error('[AnalysisOrchestrator] Incremental Layer 1 failed:', error);
      throw error;
    }
    timings.layer1 = Date.now() - l1Start;

    // ── Step 4: Re-run Layer 2 if structural change ──
    const l2Start = Date.now();
    let structuralMap: StructuralCartography | null = understanding.structuralCartography;
    if (diff.structuralChange || !structuralMap) {
      try {
        const l2Result = await structuralCartographer.analyzeStructure(newText, understanding);
        structuralMap = l2Result.cartography;
        understanding.structuralCartography = structuralMap;

        for (const role of structuralMap.paragraphRoles) {
          if (understanding.paragraphs[role.index]) {
            understanding.paragraphs[role.index].structuralRole = {
              role: role.role,
              narrativeFunction: role.narrativeFunction,
              strengthContribution: role.strengthContribution,
              weaknessFlag: role.weaknessFlag,
            };
          }
        }

        totalCost += l2Result.cost;
        totalInputTokens += l2Result.tokenUsage.inputTokens;
        totalOutputTokens += l2Result.tokenUsage.outputTokens;
        layersRun.push('structural');
      } catch (error) {
        console.error('[AnalysisOrchestrator] Incremental Layer 2 failed:', error);
      }
    }
    timings.layer2 = Date.now() - l2Start;

    // ── Step 5: Re-walk from edited paragraph forward (Layer 3) ──
    const l3Start = Date.now();
    let allParagraphAnalyses: ParagraphDeepAnalysis[] = [];
    let finalUnderstanding: RunningUnderstanding | null = null;

    if (structuralMap) {
      const startIdx = diff.structuralChange ? 0 : (diff.firstChangedIndex ?? 0);
      // Get RunningUnderstanding from BEFORE the edit point
      const existingRU = startIdx > 0
        ? understanding.paragraphs[startIdx - 1]?.runningUnderstandingSnapshot ?? null
        : null;

      try {
        const l3Result = await sequentialDeepWalk.walkEssay(
          newText,
          understanding,
          structuralMap,
          {
            startFromParagraph: startIdx,
            existingRunningUnderstanding: existingRU ?? undefined,
          },
        );

        // Keep analyses for unchanged paragraphs, update the rest
        allParagraphAnalyses = [];
        for (let i = 0; i < understanding.paragraphs.length; i++) {
          if (i < startIdx && understanding.paragraphs[i].deepAnalysis) {
            allParagraphAnalyses.push(understanding.paragraphs[i].deepAnalysis!);
          }
        }
        for (const analysis of l3Result.paragraphAnalyses) {
          allParagraphAnalyses.push(analysis);
          const para = understanding.paragraphs[analysis.paragraphIndex];
          if (para) {
            para.deepAnalysis = analysis;
            para.stale = false;
          }
        }
        // Update snapshots
        for (let i = 0; i < l3Result.intermediateSnapshots.length; i++) {
          const paraIdx = startIdx + i;
          if (understanding.paragraphs[paraIdx]) {
            understanding.paragraphs[paraIdx].runningUnderstandingSnapshot = l3Result.intermediateSnapshots[i];
          }
        }

        finalUnderstanding = l3Result.finalUnderstanding;
        understanding.finalUnderstanding = finalUnderstanding;

        totalCost += l3Result.cost;
        totalInputTokens += l3Result.tokenUsage.inputTokens;
        totalOutputTokens += l3Result.tokenUsage.outputTokens;
        totalCacheReadTokens += l3Result.tokenUsage.cacheReadTokens;
        totalCacheWriteTokens += l3Result.tokenUsage.cacheWriteTokens;
        layersRun.push('deep_walk');

        const paragraphsRewalked = l3Result.paragraphAnalyses.length;
        console.log(`[AnalysisOrchestrator] Incremental Layer 3: re-walked ${paragraphsRewalked} paragraphs from P${startIdx + 1}`);
      } catch (error) {
        console.error('[AnalysisOrchestrator] Incremental Layer 3 failed:', error);
      }
    }
    timings.layer3 = Date.now() - l3Start;

    // ── Step 6: Re-crystallize ──
    const l4Start = Date.now();
    if (finalUnderstanding && allParagraphAnalyses.length > 0 && structuralMap) {
      try {
        const l4Result = await crystallizer.crystallize(
          understanding,
          finalUnderstanding,
          allParagraphAnalyses,
          structuralMap,
        );
        understanding.essayDNA = l4Result.essayDNA;
        understanding.paragraphScoreMatrix = l4Result.paragraphScoreMatrix;

        totalCost += l4Result.cost;
        totalInputTokens += l4Result.tokenUsage.inputTokens;
        totalOutputTokens += l4Result.tokenUsage.outputTokens;
        layersRun.push('crystallization');
      } catch (error) {
        console.error('[AnalysisOrchestrator] Incremental Layer 4 failed:', error);
      }
    }
    timings.layer4 = Date.now() - l4Start;

    // ── Step 7: Re-annotate stale paragraphs ──
    const l5Start = Date.now();
    if (mergedConfig.includeAnnotations && understanding.essayDNA) {
      try {
        const l5Result = await deepAnnotationService.generateAnnotations(understanding);
        understanding.annotations = l5Result.annotations;
        // Clear and re-populate paragraph annotations
        for (const para of understanding.paragraphs) {
          para.annotations = [];
        }
        for (const annotation of l5Result.annotations) {
          const paraIdx = annotation.span.paragraphIndex;
          if (understanding.paragraphs[paraIdx]) {
            understanding.paragraphs[paraIdx].annotations.push(annotation);
          }
        }

        totalCost += l5Result.cost;
        totalInputTokens += l5Result.tokenUsage.inputTokens;
        totalOutputTokens += l5Result.tokenUsage.outputTokens;
        layersRun.push('annotation');
      } catch (error) {
        console.error('[AnalysisOrchestrator] Incremental Layer 5 failed:', error);
      }
    }
    timings.layer5 = Date.now() - l5Start;

    // ── Record pass ──
    const totalTimeMs = Date.now() - startTime;
    understanding.totalCostUSD += totalCost;

    const pass: AnalysisPass = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      layers: layersRun,
      trigger: diff.structuralChange ? 'structural_change' : 'text_edit',
      editedParagraphIndex: diff.firstChangedIndex,
      paragraphsRewalked: diff.structuralChange
        ? understanding.paragraphs.length
        : (understanding.paragraphs.length - (diff.firstChangedIndex ?? 0)),
      costUSD: totalCost,
      timingMs: { ...timings, total: totalTimeMs },
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: totalCacheReadTokens,
        cacheWriteTokens: totalCacheWriteTokens,
      },
    };
    understanding.analysisPasses.push(pass);

    // Save (fire-and-forget)
    essayUnderstandingService.save(understanding).catch(error => {
      console.error('[AnalysisOrchestrator] Failed to save understanding:', error);
    });

    console.log(`[AnalysisOrchestrator] Incremental analysis complete in ${totalTimeMs}ms, cost=$${totalCost.toFixed(4)}`);

    return {
      understanding,
      pass,
      isIncremental: true,
    };
  }
}

export const analysisOrchestrator = new AnalysisOrchestrator();
