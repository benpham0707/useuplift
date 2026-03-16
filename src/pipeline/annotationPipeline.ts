/**
 * Annotation Pipeline — Main Orchestrator (Phases 1-4)
 *
 * Wires together all pipeline phases into a single analyze() call:
 *   Phase 1: Resolve essay profile from registry
 *   Phase 2: Extract deterministic text features
 *   Phase 3: Single Sonnet call producing inline annotations
 *   Phase 4: Derive per-dimension scores from annotations + heuristics
 *
 * On LLM failure, falls back to heuristic-only scoring (annotations: []).
 */

import crypto from 'node:crypto';
import { callClaude, calculateCost } from '../lib/llm/claude';
import type { ClaudeResponse } from '../lib/llm/claude';
import {
  featureExtractor,
  essayProfileRegistry,
  dimensionRegistry,
  strategyRegistry,
  patternRegistry,
  signalRegistry,
} from '../workshop';
import { promptBuilder } from './promptBuilder';
import { scoreDeriver } from './scoreDeriver';
import { validateAnnotations } from './annotationValidation';
import { generateSummary } from './summaryGenerator';
import { generateRoadmap } from './improvementRoadmap';
import type {
  AnnotatedAnalysisResult,
  AnnotationPipelineConfig,
  EssayAnnotation,
  EnrichedFeatures,
  RawLLMAnnotation,
} from './types';
import { analyzeEssayStructure } from './structureAnalyzer';
import { analyzeThemes } from './themeAnalyzer';
import { analyzeCharacterRevelation } from './characterAnalyzer';
import { analyzeInsight } from './insightAnalyzer';
import type { DeepContentAnalysis } from './contentAnalysisTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8192;

// ============================================================================
// ANNOTATION PIPELINE
// ============================================================================

export class AnnotationPipeline {
  /**
   * Analyze an essay through the full 4-phase pipeline.
   *
   * @param text - The raw essay text to analyze
   * @param config - Pipeline configuration (essay type, context, limits)
   * @returns Complete analysis result with annotations, scores, and metadata
   */
  async analyze(
    text: string,
    config: AnnotationPipelineConfig,
  ): Promise<AnnotatedAnalysisResult> {
    const timings: Record<string, number> = {};
    const pipelineStart = Date.now();

    // Validate input
    const validationError = this.validateInput(text, config);
    if (validationError) {
      throw new Error(validationError);
    }

    await Promise.all([
      dimensionRegistry.autoImport(),
      strategyRegistry.autoImport(),
      patternRegistry.autoImport(),
      signalRegistry.autoImport(),
    ]);

    // ------------------------------------------------------------------
    // Phase 1 + 2 (parallel): Resolve profile & extract features
    // ------------------------------------------------------------------
    const phase12Start = Date.now();

    const [profile, features] = await Promise.all([
      Promise.resolve(essayProfileRegistry.getProfile(config.essayType)),
      Promise.resolve(featureExtractor.extract(text)),
    ]);

    timings.phase12_profileAndFeatures = Date.now() - phase12Start;

    // ------------------------------------------------------------------
    // Phase 2.1: Deep content analysis (structure, theme, character, insight)
    // Runs in parallel — each analyzer is deterministic and independent
    // ------------------------------------------------------------------
    const phase2Start = Date.now();
    let deepContentAnalysis: DeepContentAnalysis | undefined;
    try {
      const [structure, theme, character, insight] = await Promise.all([
        Promise.resolve(analyzeEssayStructure(text)),
        Promise.resolve(analyzeThemes(text)),
        Promise.resolve(analyzeCharacterRevelation(text)),
        Promise.resolve(analyzeInsight(text)),
      ]);
      deepContentAnalysis = { structure, theme, character, insight };
    } catch (error) {
      console.warn(
        '[AnnotationPipeline] Deep content analysis failed, proceeding without:',
        error instanceof Error ? error.message : String(error),
      );
    }
    timings.phase2_deepContentAnalysis = Date.now() - phase2Start;

    // ------------------------------------------------------------------
    // Phase 2.2: Pattern & strategy detection (heuristic, ~1ms)
    // Detects essay patterns (openings, transitions, closings, techniques)
    // and writing strategies from structure analysis.
    // ------------------------------------------------------------------
    const detectedPatterns = patternRegistry.detectAll(text);
    let detectedStrategy = undefined;
    if (deepContentAnalysis) {
      const arc = deepContentAnalysis.structure.detectedArc;
      const strategies = strategyRegistry.getAll();
      // Match detected arc to strategy — find best match by checking detection signals
      for (const strategy of strategies) {
        const { signals, threshold } = strategy.detection;
        const matchCount = signals.filter(signal => {
          // Simple substring/keyword check against essay text + structure
          const signalLower = signal.toLowerCase();
          const textLower = text.toLowerCase();
          if (textLower.includes(signalLower.slice(0, 30))) return true;
          // Check arc-specific matches
          if (arc === 'montage' && strategy.id === 'montage_technique') return true;
          if (arc === 'in_medias_res' && strategy.id === 'in_medias_res') return true;
          if (arc === 'circular' && strategy.id === 'bracket_structure') return true;
          return false;
        }).length;
        if (matchCount / signals.length >= threshold) {
          detectedStrategy = strategy;
          break;
        }
      }
    }

    // Build enriched features (features + deep content + patterns + strategy)
    const enrichedFeatures: EnrichedFeatures = {
      features,
      deepContentAnalysis,
      detectedPatterns: detectedPatterns.length > 0 ? detectedPatterns : undefined,
      detectedStrategy,
    };

    // ------------------------------------------------------------------
    // Phase 2.5: Word-count-aware annotation scaling
    // ------------------------------------------------------------------
    const effectiveConfig = this.applyAnnotationScaling(text, config);

    // ------------------------------------------------------------------
    // Phase 3: Single Sonnet call → raw annotations
    // ------------------------------------------------------------------
    let annotations: EssayAnnotation[] = [];
    let llmResponse: ClaudeResponse<string> | null = null;

    const phase3Start = Date.now();
    try {
      const prompt = promptBuilder.buildPrompt(text, effectiveConfig, enrichedFeatures);

      llmResponse = await this.retryWithBackoff(async () => {
        return callClaude<string>({
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          model: SONNET_MODEL,
          maxTokens: MAX_TOKENS,
          cacheSystemPrompt: true,
        });
      });

      // Parse and validate annotations
      const rawAnnotations = this.parseAnnotations(llmResponse.content);
      annotations = validateAnnotations(rawAnnotations, text, '[AnnotationPipeline]');
    } catch (error) {
      console.error(
        '[AnnotationPipeline] Phase 3 LLM call failed after retries, falling back to heuristic-only scoring:',
        error instanceof Error ? error.message : String(error),
      );
      // annotations stays [] — Phase 4 will produce heuristic-only scores
    }
    timings.phase3_llmAnnotation = Date.now() - phase3Start;

    // ------------------------------------------------------------------
    // Phase 4: Derive scores from annotations + heuristics
    // ------------------------------------------------------------------
    const phase4Start = Date.now();

    const { dimensionScores, eqi, impressionLabel } = scoreDeriver.deriveScores({
      annotations,
      features,
      essayType: config.essayType,
    });

    timings.phase4_scoreDerivation = Date.now() - phase4Start;
    timings.totalPipeline = Date.now() - pipelineStart;

    // ------------------------------------------------------------------
    // Assemble result
    // ------------------------------------------------------------------
    const analysisId = crypto.randomUUID();
    const textHash = crypto.createHash('sha256').update(text).digest('hex');

    // Build summary from annotations (dimension-weighted ranking)
    const summary = generateSummary({
      annotations,
      dimensionScores,
      eqi,
      impressionLabel,
    });

    // Build improvement roadmap (categorized, priority-ranked)
    const roadmap = generateRoadmap({ annotations, dimensionScores });

    // Build meta with cost, timing, tokens
    const meta = this.buildMeta(llmResponse, timings);

    return {
      analysisId,
      text,
      textHash,
      essayType: config.essayType,
      annotations,
      dimensionScores,
      eqi,
      impressionLabel,
      summary,
      roadmap,
      meta,
    };
  }

  // ==========================================================================
  // INPUT VALIDATION
  // ==========================================================================

  /**
   * Validate pipeline inputs before starting analysis.
   * Returns an error message if invalid, null if valid.
   */
  private validateInput(text: string, config: AnnotationPipelineConfig): string | null {
    if (!text || typeof text !== 'string') return 'Essay text is required';
    if (text.length < 50) return `Essay too short (${text.length} chars, minimum 50)`;
    if (text.length > 10000) return `Essay too long (${text.length} chars, maximum 10,000)`;
    if (!config.essayType) return 'Essay type is required';
    return null;
  }

  // ==========================================================================
  // ANNOTATION SCALING
  // ==========================================================================

  /**
   * Scale maxAnnotations based on essay word count if not explicitly set.
   * Short essays get fewer annotations to avoid feedback overload.
   * Long essays get more to ensure adequate coverage.
   */
  private applyAnnotationScaling(
    text: string,
    config: AnnotationPipelineConfig,
  ): AnnotationPipelineConfig {
    if (config.maxAnnotations !== undefined) {
      return config; // caller explicitly set — respect it
    }

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    let maxAnnotations: number;
    if (wordCount < 150) {
      maxAnnotations = 5;
    } else if (wordCount < 300) {
      maxAnnotations = 8;
    } else if (wordCount < 500) {
      maxAnnotations = 10;
    } else {
      maxAnnotations = 12;
    }

    return { ...config, maxAnnotations };
  }

  // ==========================================================================
  // RETRY LOGIC
  // ==========================================================================

  /**
   * Retry an async function with exponential backoff.
   * Delays: 1000ms, 2000ms, 4000ms (baseDelayMs * 2^(attempt-1))
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[AnnotationPipeline] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  // ==========================================================================
  // PHASE 3 HELPERS
  // ==========================================================================

  /**
   * Parse raw LLM response text into an array of RawLLMAnnotation objects.
   * Handles markdown ```json fences, plain JSON arrays, and partial JSON recovery.
   */
  private parseAnnotations(responseText: string): RawLLMAnnotation[] {
    let jsonStr = responseText.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    // Find the JSON array in the response
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      return parsed as RawLLMAnnotation[];
    } catch {
      // Try partial recovery
      const recovered = this.recoverPartialJSON(jsonStr);
      if (recovered) return recovered;
      throw new Error('Failed to parse LLM response as JSON array');
    }
  }

  /**
   * Attempt to recover partial valid JSON from a truncated LLM response.
   * Finds the last complete object in a truncated array.
   */
  private recoverPartialJSON(text: string): RawLLMAnnotation[] | null {
    // Find the last complete object in a truncated array
    const lastCloseBrace = text.lastIndexOf('}');
    if (lastCloseBrace === -1) return null;
    const truncated = text.substring(0, lastCloseBrace + 1) + ']';
    try {
      const parsed = JSON.parse(truncated);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.warn(`[AnnotationPipeline] Recovered ${parsed.length} annotations from truncated response`);
        return parsed;
      }
    } catch { /* recovery failed */ }
    return null;
  }

  // ==========================================================================
  // META BUILDER
  // ==========================================================================

  /**
   * Build metadata object with cost, timing, and token usage.
   */
  private buildMeta(
    llmResponse: ClaudeResponse<string> | null,
    timings: Record<string, number>,
  ): AnnotatedAnalysisResult['meta'] {
    if (!llmResponse) {
      return {
        costUSD: 0,
        timing: timings,
        tokens: { input: 0, output: 0 },
      };
    }

    const costUSD = calculateCost(llmResponse.usage, SONNET_MODEL);

    return {
      costUSD,
      timing: timings,
      tokens: {
        input: llmResponse.usage.input_tokens,
        output: llmResponse.usage.output_tokens,
        ...(llmResponse.usage.cache_creation_input_tokens
          ? { cacheCreation: llmResponse.usage.cache_creation_input_tokens }
          : {}),
        ...(llmResponse.usage.cache_read_input_tokens
          ? { cacheRead: llmResponse.usage.cache_read_input_tokens }
          : {}),
      },
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const annotationPipeline = new AnnotationPipeline();
