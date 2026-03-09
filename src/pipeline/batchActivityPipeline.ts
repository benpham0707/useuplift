/**
 * Batch Activity Pipeline — Single Sonnet call for all activities
 *
 * Analyzes multiple activity descriptions in one LLM call, producing
 * per-activity annotations + portfolio-level patterns. This is more
 * efficient than calling the single-activity pipeline N times because:
 *   1. One Sonnet call instead of N (saves latency + cost via caching)
 *   2. LLM sees all activities together → can detect cross-activity patterns
 *   3. Portfolio strengths/gaps/recommendations emerge naturally
 *
 * Integration points:
 * - callClaude: single batch Sonnet call with prompt caching
 * - dimensionRegistry: 13 scoring dimensions
 * - essayProfileRegistry: activity_to_essay profile
 * - featureExtractor: deterministic text features per activity
 * - scoreDeriver: Phase 4 scoring per activity
 */

import crypto from 'node:crypto';
import { callClaude, calculateCost, estimateTokens } from '../lib/llm/claude';
import type { ClaudeResponse } from '../lib/llm/claude';
import { dimensionRegistry, essayProfileRegistry, featureExtractor } from '../workshop';
import { scoreDeriver } from './scoreDeriver';
import { validateAnnotations } from './annotationValidation';
import type {
  BatchActivityConfig,
  BatchActivityResult,
  EssayAnnotation,
  RawLLMAnnotation,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8192;
const DEFAULT_MAX_ANNOTATIONS_PER_ACTIVITY = 6;

// ============================================================================
// TYPES
// ============================================================================

/** Shape of the batch LLM JSON response */
interface BatchLLMResponse {
  activities: Array<{
    activityId: string;
    annotations: RawLLMAnnotation[];
  }>;
  portfolioPatterns: {
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
}

// ============================================================================
// BATCH PIPELINE
// ============================================================================

export class BatchActivityPipeline {
  /**
   * Analyze all activities in a single Sonnet call.
   *
   * @param config - Batch configuration with activities array and student context
   * @returns Per-activity annotations + scores + portfolio patterns
   */
  async analyzeBatch(config: BatchActivityConfig): Promise<BatchActivityResult> {
    const timings: Record<string, number> = {};
    const pipelineStart = Date.now();

    await dimensionRegistry.autoImport();

    const maxAnnotations = config.maxAnnotationsPerActivity ?? DEFAULT_MAX_ANNOTATIONS_PER_ACTIVITY;

    // ------------------------------------------------------------------
    // Phase 1: Build batch prompt
    // ------------------------------------------------------------------
    const phase1Start = Date.now();
    const profile = essayProfileRegistry.getProfile('activity_to_essay');
    const systemPrompt = this.buildSystemPrompt(profile, maxAnnotations);
    const userPrompt = this.buildUserPrompt(config);
    timings.phase1_promptBuild = Date.now() - phase1Start;

    // ------------------------------------------------------------------
    // Phase 2: Single Sonnet call
    // ------------------------------------------------------------------
    let llmResponse: ClaudeResponse<string> | null = null;
    let batchResult: BatchLLMResponse | null = null;

    const phase2Start = Date.now();
    try {
      llmResponse = await callClaude<string>({
        systemPrompt,
        userPrompt,
        model: SONNET_MODEL,
        maxTokens: MAX_TOKENS,
        cacheSystemPrompt: true,
      });

      batchResult = this.parseResponse(llmResponse.content);
    } catch (error) {
      console.error(
        '[BatchActivityPipeline] LLM call failed, falling back to heuristic-only scoring:',
        error instanceof Error ? error.message : String(error),
      );
    }
    timings.phase2_llmBatch = Date.now() - phase2Start;

    // ------------------------------------------------------------------
    // Phase 3: Per-activity feature extraction + score derivation
    // ------------------------------------------------------------------
    const phase3Start = Date.now();

    // Build a lookup from activityId → raw annotations
    const annotationsByActivity = new Map<string, RawLLMAnnotation[]>();
    if (batchResult?.activities) {
      for (const activityResult of batchResult.activities) {
        annotationsByActivity.set(activityResult.activityId, activityResult.annotations);
      }
    }

    const activityResults: BatchActivityResult['activities'] = [];

    for (const activity of config.activities) {
      // Extract features from the activity description
      const features = featureExtractor.extract(activity.description);

      // Validate raw annotations for this activity
      const rawAnnotations = annotationsByActivity.get(activity.id) ?? [];
      const validatedAnnotations = validateAnnotations(rawAnnotations, activity.description, '[BatchActivityPipeline]');

      // Derive scores using annotation + heuristic fusion
      const { dimensionScores, eqi, impressionLabel } = scoreDeriver.deriveScores({
        annotations: validatedAnnotations,
        features,
        essayType: 'activity_to_essay',
      });

      activityResults.push({
        activityId: activity.id,
        annotations: validatedAnnotations,
        dimensionScores,
        eqi,
        impressionLabel,
      });
    }

    timings.phase3_scoring = Date.now() - phase3Start;
    timings.totalPipeline = Date.now() - pipelineStart;

    // ------------------------------------------------------------------
    // Assemble result
    // ------------------------------------------------------------------
    const portfolioPatterns = batchResult?.portfolioPatterns ?? {
      strengths: [],
      gaps: [],
      recommendations: [],
    };

    const meta = this.buildMeta(llmResponse, timings);

    return {
      activities: activityResults,
      portfolioPatterns,
      meta,
    };
  }

  // ==========================================================================
  // PROMPT BUILDERS
  // ==========================================================================

  private buildSystemPrompt(
    profile: ReturnType<typeof essayProfileRegistry.getProfile>,
    maxAnnotations: number,
  ): string {
    const parts: string[] = [];

    // Role definition
    parts.push(
      `You are a world-class college admissions activity description coach with deep expertise in what top-tier admissions officers look for in extracurricular profiles. You analyze activity descriptions and provide precise, text-anchored feedback.`,
    );

    // Activity-to-essay profile context
    if (profile) {
      parts.push(
        `\n## Essay Type: ${profile.displayName}`,
        `For activity descriptions, prioritize: specificity of impact/outcome over tech name-drops, quantified results, and unique contribution. AOs care about PROBLEM, SCALE, and OUTCOME — not tool names.`,
      );
      if (profile.antiPatterns.length > 0) {
        parts.push(
          `Common mistakes to flag:\n${profile.antiPatterns.map(ap => `- ${ap}`).join('\n')}`,
        );
      }
    }

    // Dimension reference
    const dimensions = dimensionRegistry.getAll();
    const dimLines = dimensions.map(
      d => `- ${d.id}: ${d.displayName} (weight: ${(d.weight * 100).toFixed(0)}%)`,
    );
    parts.push(
      `\n## Scoring Dimensions\n\n${dimLines.join('\n')}`,
    );

    // Batch instruction
    parts.push(`\n## Batch Analysis Instructions

You will receive multiple activity descriptions to analyze. For each activity:
1. Produce up to ${maxAnnotations} annotations anchored to exact text spans
2. Each span.text must be an exact substring of that activity's description
3. Balance strengths (~30-40%) with issues (~60-70%)
4. Distribute annotations across multiple dimensions

Additionally, analyze cross-activity portfolio patterns:
- Identify 2-3 portfolio-level strengths (themes, depth, breadth)
- Identify 1-2 portfolio-level gaps (missing dimensions, repeated weaknesses)
- Provide 2-3 portfolio-level recommendations

## Output Schema

Return valid JSON with this exact structure:
\`\`\`json
{
  "activities": [
    {
      "activityId": "the-id-from-the-input",
      "annotations": [
        {
          "span": { "text": "exact substring", "startOffset": 0, "endOffset": 15, "paragraphIndex": 0 },
          "dimensionId": "dimension-id",
          "severity": "critical | important | suggestion | strength",
          "isStrength": false,
          "insight": "What you observe and why it matters. 1-3 sentences.",
          "suggestion": "Concrete direction to improve. 1-2 sentences.",
          "rewriteExample": "Optional concrete rewrite.",
          "confidence": 0.85
        }
      ]
    }
  ],
  "portfolioPatterns": {
    "strengths": ["portfolio strength 1", "portfolio strength 2"],
    "gaps": ["portfolio gap 1"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  }
}
\`\`\`

Return ONLY the JSON. No markdown fencing, no explanation text.`);

    return parts.join('\n');
  }

  private buildUserPrompt(config: BatchActivityConfig): string {
    const parts: string[] = [];

    // Student context
    if (config.studentContext) {
      parts.push(`## Student Context`);
      if (config.studentContext.intendedMajor) {
        parts.push(`Intended major: ${config.studentContext.intendedMajor}`);
      }
      if (config.studentContext.targetSelectivity) {
        parts.push(`Target selectivity: ${config.studentContext.targetSelectivity}`);
      }
      parts.push('');
    }

    // Activities
    parts.push(`## Activities (${config.activities.length} total)\n`);

    for (const activity of config.activities) {
      parts.push(`### Activity: ${activity.id}`);
      parts.push(`Title: ${activity.title}`);
      parts.push(`Role: ${activity.role}`);
      parts.push(`Category: ${activity.category}`);
      if (activity.intendedMajor) {
        parts.push(`Intended Major: ${activity.intendedMajor}`);
      }
      parts.push(`Description:\n${activity.description}`);
      parts.push('');
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // RESPONSE PARSING & VALIDATION
  // ==========================================================================

  /**
   * Parse the batch LLM response into structured data.
   */
  private parseResponse(responseText: string): BatchLLMResponse {
    let jsonStr = responseText.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    // Find the JSON object
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr) as BatchLLMResponse;

    if (!parsed.activities || !Array.isArray(parsed.activities)) {
      throw new Error('Batch response missing activities array');
    }

    return parsed;
  }

  // ==========================================================================
  // META BUILDER
  // ==========================================================================

  private buildMeta(
    llmResponse: ClaudeResponse<string> | null,
    timings: Record<string, number>,
  ): BatchActivityResult['meta'] {
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

export const batchActivityPipeline = new BatchActivityPipeline();
