/**
 * Deep Annotation Service — Layer 5: Context-Informed Annotation Generation
 *
 * Generates targeted, high-signal annotations using the full EssayUnderstanding Portfolio.
 * Unlike V1 annotations (single Sonnet call with limited context), these annotations:
 *   - Reference specific Layer 3 findings (paragraph deep analysis, running understanding)
 *   - Adapt density to essay readiness level
 *   - Carry granularity metadata (paragraph/sentence/word)
 *   - Are validated against actual essay text spans
 *
 * Each annotation extends EssayAnnotation with: granularityLevel, sourceAnalysis, priorityRank
 */

import crypto from 'crypto';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { contextBuilder } from '../contextBuilder';
import type {
  EssayUnderstanding,
  DeepAnnotation,
  ReadinessLevel,
  AnnotationGranularity,
} from '../types';
import type { AnnotationSeverity } from '../../../pipeline/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

/** Annotation density targets by readiness level */
const DENSITY_TARGETS: Record<ReadinessLevel, {
  min: number;
  max: number;
  primaryGranularity: AnnotationGranularity;
  description: string;
}> = {
  needs_major_revision: {
    min: 6, max: 8,
    primaryGranularity: 'paragraph',
    description: 'Focus on paragraph-level structural and conceptual issues. Do not nitpick sentences when the foundation needs work.',
  },
  developing: {
    min: 8, max: 10,
    primaryGranularity: 'paragraph',
    description: 'Mix of paragraph-level and sentence-level feedback. Identify the 2-3 highest-impact structural changes alongside specific sentence improvements.',
  },
  solid_draft: {
    min: 10, max: 14,
    primaryGranularity: 'sentence',
    description: 'Mostly sentence-level craft improvements. The structure works — now sharpen language, deepen moments, and strengthen voice.',
  },
  near_final: {
    min: 12, max: 16,
    primaryGranularity: 'sentence',
    description: 'Surgical sentence and word-level refinements. This essay is strong — find the specific words, phrases, and transitions that separate good from great.',
  },
  polished: {
    min: 12, max: 16,
    primaryGranularity: 'sentence',
    description: 'Fine-grained polish. Identify subtle voice inconsistencies, missed opportunities for stronger imagery, and micro-level craft improvements.',
  },
};

// ============================================================================
// DEEP ANNOTATION SERVICE
// ============================================================================

class DeepAnnotationService {
  /**
   * Generate context-informed annotations from the full EssayUnderstanding.
   *
   * Prerequisites: EssayDNA and ParagraphScoreMatrix must be populated (Layer 4 complete).
   */
  async generateAnnotations(
    understanding: EssayUnderstanding,
  ): Promise<{
    annotations: DeepAnnotation[];
    cost: number;
    timingMs: number;
    tokenUsage: { inputTokens: number; outputTokens: number };
  }> {
    const startTime = Date.now();

    if (!understanding.essayDNA || !understanding.paragraphScoreMatrix) {
      throw new Error('[DeepAnnotationService] Layer 4 (EssayDNA + ParagraphScoreMatrix) must be complete before generating annotations');
    }

    const readinessLevel = understanding.essayDNA.readinessLevel;
    const densityTarget = DENSITY_TARGETS[readinessLevel];

    // ── Build targeted context (not the full EUP) ──
    const annotationContext = contextBuilder.buildAnnotationContext(understanding);

    // ── Construct the annotation generation prompt ──
    const systemPrompt = this.buildSystemPrompt(readinessLevel, densityTarget);
    const userPrompt = this.buildUserPrompt(
      understanding,
      annotationContext,
      densityTarget,
    );

    // ── Call Sonnet ──
    const response = await callClaudeWithRetry<RawAnnotationOutput[]>({
      model: SONNET_MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
      temperature: 0.3,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET_MODEL);

    // ── Validate and transform ──
    const essayText = this.getEssayText(understanding);
    const annotations = this.validateAndTransform(
      response.content,
      essayText,
      understanding,
    );

    return {
      annotations,
      cost,
      timingMs: Date.now() - startTime,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  // ==========================================================================
  // PROMPT CONSTRUCTION
  // ==========================================================================

  private buildSystemPrompt(
    readinessLevel: ReadinessLevel,
    densityTarget: typeof DENSITY_TARGETS[ReadinessLevel],
  ): string {
    return `You are an expert essay annotation engine for college admissions essays.
You produce inline annotations that are anchored to specific text spans.

READINESS LEVEL: ${readinessLevel}
ANNOTATION STRATEGY: ${densityTarget.description}
TARGET COUNT: ${densityTarget.min}-${densityTarget.max} annotations
PRIMARY GRANULARITY: ${densityTarget.primaryGranularity}-level

Each annotation MUST:
1. Reference a specific text span (exact quote from the essay)
2. Include the paragraph index (0-indexed) where the span appears
3. Map to a quality dimension (voice, structure, emotion, craft, rhetoric, specificity, authenticity, narrative_arc, admissions_impact, show_dont_tell, opening, closing, transitions)
4. Carry a severity: "critical" (fundamental issue), "important" (significant improvement), "suggestion" (refinement), or "strength" (what works well)
5. Include an insight (what you observe + why it matters, 1-3 sentences, natural mentor voice)
6. Include a suggestion (concrete improvement direction, 1-2 sentences)
7. Optionally include a rewriteExample (concrete alternative showing the suggestion in action)
8. Reference which Layer 3 finding informed this annotation (sourceAnalysis field)
9. Set granularityLevel: "paragraph" (structural/conceptual), "sentence" (craft/voice), or "word" (micro-level)
10. Set priorityRank if this addresses a known improvement priority (null if not)

SEVERITY DISTRIBUTION GUIDELINES:
- needs_major_revision: 2-3 critical, 3-4 important, 1-2 strength
- developing: 1-2 critical, 3-4 important, 2-3 suggestion, 2-3 strength
- solid_draft: 0-1 critical, 2-3 important, 4-6 suggestion, 3-4 strength
- near_final/polished: 0 critical, 1-2 important, 5-8 suggestion, 4-6 strength

OUTPUT: JSON array of annotation objects. No markdown, no explanation.

Each object:
{
  "spanText": "exact quoted text from essay",
  "paragraphIndex": 0,
  "dimensionId": "voice",
  "severity": "important",
  "isStrength": false,
  "insight": "...",
  "suggestion": "...",
  "rewriteExample": "...",
  "confidence": 0.85,
  "granularityLevel": "sentence",
  "sourceAnalysis": "Layer 3: paragraph 2 emotional depth score 42 — voice drifts to academic register",
  "priorityRank": 1
}`;
  }

  private buildUserPrompt(
    understanding: EssayUnderstanding,
    annotationContext: string,
    densityTarget: typeof DENSITY_TARGETS[ReadinessLevel],
  ): string {
    const essayText = this.getEssayText(understanding);

    return `ESSAY TEXT:
${essayText}

ANALYSIS CONTEXT:
${annotationContext}

Generate ${densityTarget.min}-${densityTarget.max} annotations for this essay.
Prioritize annotations that address the improvement priorities listed in the context.
Ensure at least 25% of annotations are strengths (isStrength: true, severity: "strength").
Every spanText must be an exact substring of the essay text above.`;
  }

  // ==========================================================================
  // VALIDATION + TRANSFORMATION
  // ==========================================================================

  private validateAndTransform(
    rawAnnotations: RawAnnotationOutput[],
    essayText: string,
    understanding: EssayUnderstanding,
  ): DeepAnnotation[] {
    if (!Array.isArray(rawAnnotations)) {
      console.warn('[DeepAnnotationService] LLM returned non-array; wrapping');
      rawAnnotations = [rawAnnotations as RawAnnotationOutput];
    }

    const validAnnotations: DeepAnnotation[] = [];
    const usedSpans = new Set<string>();

    for (const raw of rawAnnotations) {
      // Validate span exists in text
      const spanText = raw.spanText;
      if (!spanText || typeof spanText !== 'string') {
        console.warn('[DeepAnnotationService] Skipping annotation with missing spanText');
        continue;
      }

      const startOffset = essayText.indexOf(spanText);
      if (startOffset === -1) {
        console.warn(`[DeepAnnotationService] Span not found in text: "${spanText.substring(0, 60)}..."`);
        continue;
      }

      // Skip duplicate spans
      const spanKey = `${startOffset}:${spanText.length}`;
      if (usedSpans.has(spanKey)) {
        console.warn('[DeepAnnotationService] Skipping duplicate span');
        continue;
      }
      usedSpans.add(spanKey);

      // Determine paragraph index from offset if not provided
      const paragraphIndex = raw.paragraphIndex ?? this.findParagraphIndex(understanding, startOffset);

      // Validate severity
      const severity = this.validateSeverity(raw.severity);

      // Validate granularity
      const granularityLevel = this.validateGranularity(raw.granularityLevel);

      const annotation: DeepAnnotation = {
        id: crypto.randomUUID(),
        span: {
          text: spanText,
          startOffset,
          endOffset: startOffset + spanText.length,
          paragraphIndex,
        },
        dimensionId: raw.dimensionId || 'craft',
        severity,
        isStrength: raw.isStrength === true,
        insight: raw.insight || '',
        suggestion: raw.suggestion || '',
        confidence: typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0.7,
        stale: false,
        granularityLevel,
        sourceAnalysis: raw.sourceAnalysis || null,
        priorityRank: typeof raw.priorityRank === 'number' ? raw.priorityRank : null,
      };

      // Include rewrite example if provided
      if (raw.rewriteExample && typeof raw.rewriteExample === 'string') {
        annotation.rewriteExample = raw.rewriteExample;
      }

      validAnnotations.push(annotation);
    }

    return validAnnotations;
  }

  private validateSeverity(raw: string | undefined): AnnotationSeverity {
    const valid: AnnotationSeverity[] = ['critical', 'important', 'suggestion', 'strength'];
    if (raw && valid.includes(raw as AnnotationSeverity)) {
      return raw as AnnotationSeverity;
    }
    return 'suggestion';
  }

  private validateGranularity(raw: string | undefined): AnnotationGranularity {
    const valid: AnnotationGranularity[] = ['paragraph', 'sentence', 'word'];
    if (raw && valid.includes(raw as AnnotationGranularity)) {
      return raw as AnnotationGranularity;
    }
    return 'sentence';
  }

  private findParagraphIndex(understanding: EssayUnderstanding, offset: number): number {
    // Walk through paragraphs to find which one contains this offset
    let cumulativeLength = 0;
    for (const para of understanding.paragraphs) {
      const paraLength = para.text.length + 1; // +1 for newline separator
      if (offset < cumulativeLength + paraLength) {
        return para.index;
      }
      cumulativeLength += paraLength;
    }
    // Fallback to last paragraph
    return Math.max(0, understanding.paragraphs.length - 1);
  }

  private getEssayText(understanding: EssayUnderstanding): string {
    return understanding.paragraphs.map(p => p.text).join('\n');
  }
}

// ============================================================================
// INTERNAL TYPES (raw LLM output shape)
// ============================================================================

interface RawAnnotationOutput {
  spanText: string;
  paragraphIndex?: number;
  dimensionId?: string;
  severity?: string;
  isStrength?: boolean;
  insight?: string;
  suggestion?: string;
  rewriteExample?: string;
  confidence?: number;
  granularityLevel?: string;
  sourceAnalysis?: string;
  priorityRank?: number;
}

/** Singleton deep annotation service */
export const deepAnnotationService = new DeepAnnotationService();
export { DeepAnnotationService };
