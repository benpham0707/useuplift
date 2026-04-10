/**
 * Deep Annotation Service — Layer 5: Phase-Aware Feedback with North Star Context
 *
 * COMPLETE REWRITE of V1. This is the Feedback layer — EPHEMERAL annotations
 * generated fresh per context. Never stored in the profile.
 *
 * Architecture:
 * - Parallel Sonnet calls per paragraph (all context complete before L5 runs)
 * - 3-block prompt caching: Block 1 (system+phase, cached), Block 2 (essay+profile+NorthStar,
 *   cached across all paragraph calls), Block 3 (paragraph-specific, not cached)
 * - Phase-aware zoom: Foundation→Architecture→Craft→Polish→Distinction
 * - North Star transformation: every annotation framed in structural consequence
 * - Re-analysis brief integration: acknowledges student edits and intent
 *
 * The North Star transformation is L5's differentiator. Without it:
 *   "This sentence tells rather than shows" (local symptom)
 * With it:
 *   "P2S3 claims your grandfather was determined, but P4's fulcrum needs the reader
 *    to have EXPERIENCED that determination. Adding sensory grounding here builds a
 *    third earning mechanism for the peak." (structural consequence)
 *
 * Consumed by: analysisOrchestrator (L4→L5 sequence), re-analysis pipeline
 * Input: EssayProfile (complete — Understanding + Analysis + North Star populated)
 * Output: L5AnnotationResult (ephemeral — never written to profile)
 */

import crypto from 'crypto';
import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonArray } from './llmJsonParser';
import type {
  EssayProfile,
  ParagraphProfile,
  ImprovementPhase,
  ImprovementPhaseLevel,
  EssayNorthStar,
  ThroughLineMap,
  MomentEarnednessMap,
  ParagraphScoreMatrix,
  ParagraphScoreEntry,
  CoherenceReport,
  ReanalysisBrief,
  ReadingStrategy,
  L5TeachingMode,
  L5AnnotationType,
  PriorAnnotationContext,
  AnnotationDensityDiagnostic,
} from '../profileTypes';
import type { FindingStore } from '../findings/findingStore';
import { buildAnnotationFindingContext } from '../findings/findingContextBuilder';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

/**
 * Phase-specific annotation GUIDANCE.
 * Soft guidance for the LLM prompt — NOT hard caps.
 * The LLM decides how many annotations each paragraph needs.
 * We never truncate or delete annotations the LLM produces.
 *
 * Previous design had hard maxPerParagraph caps that sliced annotations
 * after generation — destroying paid LLM output (Rule 2 violation).
 * Foundation phase capped at 1 annotation per paragraph, which meant
 * a rich paragraph with 4 genuine teaching moments lost 3 of them.
 */
const PHASE_GUIDANCE: Record<ImprovementPhaseLevel, {
  focusLevel: string;
  description: string;
}> = {
  foundation: {
    focusLevel: 'essay-level',
    description: `Focus on the 2-3 most important structural issues. What is the most important structural problem? If the thesis is unclear, that is issue #1. If the arc does not land, that is the priority.
Prioritize essay-level and paragraph-level insights. Use sentence-level precision only when a specific sentence is the lynchpin of a structural problem.
Typical annotation count: 3-5 total for the essay. But if a paragraph genuinely has multiple important structural issues, annotate all of them.`,
  },
  architecture: {
    focusLevel: 'paragraph-level',
    description: `Focus on paragraph-level issues — structural roles, transitions, pacing, show vs tell. How well does each paragraph serve its role? Are transitions earning the reader's continued attention?
Typical annotation count: 4-7 total. Focus on the 2-3 biggest architectural gaps.
Sentence-level annotations are appropriate when a sentence is failing its structural role (e.g., a transition sentence that doesn't actually transition).`,
  },
  craft: {
    focusLevel: 'sentence-level',
    description: `The structure works. Now each sentence must carry its weight. Which sentences are not pulling their weight? Where does the voice waver? Which rhythms clash with the essay's dominant cadence?
Be specific — cite the sentence, explain WHY it underperforms in its structural context, show a rewrite.
Typical annotation count: 6-10 total. More annotations per paragraph because the granularity is finer.`,
  },
  polish: {
    focusLevel: 'word-level',
    description: `The essay is strong. Word-level precision matters now. Which specific words could be sharper? Where could an image be more precise? Which phrases are cliche? Which verbs are passive when they should drive?
Be surgical — the structure works, the sentences work, now make every word earn its place.
Notable words identified during understanding are prime annotation targets — they represent word choices the analysis system flagged as significant. When a sentence has notable words listed, consider whether teaching the student about those specific choices would sharpen their craft awareness.
Typical annotation count: 8-14. These are surgical.`,
  },
  distinction: {
    focusLevel: 'memorability',
    description: `The essay is good. The question is: will the AO remember it tomorrow?
Focus on memorability opportunities — what would make an admissions officer remember this essay next week? Where is the essay close to something extraordinary but not quite there?
Typical annotation count: 3-6. Quality over quantity. Each annotation should itself be distinctive.`,
  },
};

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * A single L5 annotation — ephemeral feedback anchored to a location.
 * Never stored in the profile.
 *
 * V2: Teaching-focused annotations with teaching modes, cross-paragraph
 * awareness, and capacity-building notes.
 */
export interface L5Annotation {
  /** Unique ID for this annotation */
  id: string;

  /** Location anchor — structural quality control, not judgment restriction */
  location: {
    paragraphIndex: number;
    sentenceIndex: number | null;
    /** Exact text span for highlighting. Must exist in the paragraph text. */
    spanText: string | null;
  };

  /**
   * Primary annotation type — ROUTING taxonomy.
   * The LLM assigns this for downstream UI/sorting, but the real intent
   * lives in teachingIntent.
   */
  type: L5AnnotationType;

  /**
   * Free-text teaching intent — what this annotation is trying to
   * accomplish for the student's learning. Not constrained to the 4 types.
   */
  teachingIntent: string;

  /**
   * Teaching mode — LLM-selected PER ANNOTATION based on what this
   * specific finding needs. Not per-essay, not per-phase.
   *
   * AWARENESS: "Notice this..." — draws attention to a pattern.
   * CONSEQUENCE: "This matters because..." — explains architectural impact.
   * CONNECTION: "This relates to..." — links moments across the essay.
   * ACTION: "Try this..." — specific, structurally-grounded suggestion.
   */
  teachingMode: L5TeachingMode;

  /** The annotation content — specific, architecture-grounded */
  content: string;

  /** WHY this matters — references the essay's architecture */
  teachingRationale: string;

  /** How this relates to the essay's through-line/structural role */
  northStarConnection: string;

  /**
   * Scope 1 GAP-5: AO-framed phenomenological impact. What happens in the
   * AO's reading experience when this annotation's issue is present?
   * Grounded in `admissionsPositioning.archetypeContext` (archetype +
   * poolDensity + differentiator) when available. Mirrors the shape of
   * `ImprovementEntry.stakes` at `profileTypes.ts:2390`.
   *
   * Null for pure strength annotations and for structural notes where no
   * AO stake applies. Populate for growth/teaching/action annotations.
   *
   * Target: 70-90% coverage on non-pure-strength annotations.
   */
  stakes: string | null;

  /**
   * Priority 1-5, LLM-assigned based on coaching value for this student
   * at this phase. 1 = "if the student reads ONE annotation, read this one."
   */
  priority: number;

  /** Which improvement phase this annotation naturally belongs to */
  phase: ImprovementPhaseLevel;

  /**
   * Concrete rewrite suggestion — REQUIRED for ACTION mode annotations
   * (Scope 1 GAP-6 hardened). Must be structurally aware: the rewrite
   * considers the paragraph's architectural role, not just sentence quality.
   *
   * Scope 1 Phase 3: an annotation emitted with `teachingMode = 'action'`
   * MUST have a non-null rewriteExample. `validateAnnotations()` drops any
   * ACTION annotation arriving with null rewriteExample — there is NO
   * "change mode to consequence" downgrade path. The teaching mode
   * decision happens BEFORE the rewrite attempt.
   */
  rewriteExample: string | null;

  /**
   * Scope 1 GAP-7: Specific sentence to cut when an ACTION-mode rewrite
   * adds net words. Format:
   *   "Cut P{n}S{n}: 'first 8 words...' ({word count} words) — {reason}"
   *
   * Populated for ACTION annotations with additive rewrites in Polish /
   * Distinction phase essays (informed by pre-call filler-pattern and
   * long-sentence diagnostics). Null when the rewrite is length-neutral
   * or the annotation is not ACTION mode.
   */
  wordEconomyCut: string | null;

  /**
   * Scope 1 GAP-8: Exact 5-12 word quoted phrase that IS the anti-pattern.
   * Populated for growth annotations that identify a cliché, stock phrase,
   * or telling-not-showing surface. When pre-call `detectTellingPhrases`
   * finds matches in the paragraph text, the LLM is instructed to use the
   * exact quoted phrase; otherwise it extracts its own 5-12 word span.
   *
   * Distinct from `location.spanText`: spanText is the full UI highlight
   * anchor; antiPatternExample is the specific sub-phrase within that
   * anchor carrying the problem.
   *
   * Null for strength / structural / awareness annotations.
   */
  antiPatternExample: string | null;

  /**
   * Scope 1 GAP-9: Named craft technique from the 20-entry TECHNIQUE_ROUTES
   * vocabulary (SUMMARY-TO-SCENE, COLD OPEN, SOMATIC VULNERABILITY, etc.).
   *
   * Populated POST-CALL by the deterministic multi-signal technique matcher
   * in `coaching/techniqueMatcher.ts`. Zero LLM cost. Multi-signal
   * requirement: a technique is assigned only if ≥2 of {keyword, dimension,
   * teachingMode} signals match, cutting false-positive rate from ~60%
   * (single-keyword) to ~15% (multi-signal).
   *
   * Null when no technique scores ≥2 signals. The `capacityBuildingNote`
   * continues to carry freeform transferable insight; this field is the
   * named label students can search and remember.
   */
  transferablePrinciple: string | null;

  /** Confidence in this annotation (0-1) */
  confidence: number;

  /**
   * Cross-paragraph scope. When this annotation teaches about a
   * pattern that spans multiple paragraphs, list the other paragraphs
   * involved. The location field still points to the PRIMARY anchor.
   */
  crossParagraphRefs: number[];

  /**
   * Capacity-building note. How does this annotation help the student
   * see patterns THEMSELVES in future writing?
   * Populated only when the LLM identifies a transferable skill.
   */
  capacityBuildingNote: string | null;

  /**
   * W1.6: Grounding quality diagnostic — how well this annotation connects
   * to the essay's architecture via its northStarConnection.
   * Populated during post-processing. Diagnostic signal, not a filter.
   */
  groundingQuality?: 'grounded' | 'weakly_grounded' | 'ungrounded';
}

/**
 * Annotations grouped by paragraph.
 */
export interface ParagraphAnnotations {
  paragraphIndex: number;
  annotations: L5Annotation[];
}

// ReanalysisBrief is the canonical type defined in profileTypes.ts — imported above.
// Re-export it for callers that import from this module.
export type { ReanalysisBrief } from '../profileTypes';

/**
 * Complete L5 output — ephemeral, never stored.
 */
export interface L5AnnotationResult {
  paragraphAnnotations: ParagraphAnnotations[];
  essayLevelAnnotations: L5Annotation[];
  /** Cross-paragraph annotations that span multiple paragraphs */
  crossParagraphAnnotations: L5Annotation[];
  phase: ImprovementPhaseLevel;
  annotationCount: number;
  /** Density diagnostics per paragraph — signal, not a problem to fix */
  densityDiagnostics: AnnotationDensityDiagnostic[];
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
}

// ============================================================================
// RAW LLM OUTPUT SHAPE (internal)
// ============================================================================

interface RawAnnotation {
  paragraphIndex: number;
  sentenceIndex?: number | null;
  spanText?: string | null;
  type?: string;
  teachingIntent?: string;
  teachingMode?: string;
  content?: string;
  teachingRationale?: string;
  northStarConnection?: string;
  /** Scope 1 GAP-5: AO-framed phenomenological impact (optional from LLM). */
  stakes?: string | null;
  priority?: number;
  phase?: string;
  rewriteExample?: string | null;
  /** Scope 1 GAP-7: sentence to cut when rewrite adds net words. */
  wordEconomyCut?: string | null;
  /** Scope 1 GAP-8: exact 5-12 word anti-pattern quote. */
  antiPatternExample?: string | null;
  /**
   * Scope 1 GAP-9: populated POST-CALL by the technique matcher; LLM does
   * not emit this directly. Kept in the raw shape for symmetry with the
   * final L5Annotation type.
   */
  transferablePrinciple?: string | null;
  confidence?: number;
  crossParagraphRefs?: number[];
  capacityBuildingNote?: string | null;
}

interface RawParagraphAnnotationOutput {
  annotations: RawAnnotation[];
}

// ============================================================================
// DEEP ANNOTATION SERVICE
// ============================================================================

class DeepAnnotationService {
  /**
   * Generate phase-aware, North-Star-informed annotations for the entire essay.
   *
   * Prerequisites: L4 (North Star) must be complete. L3.5 analysis must be complete.
   * The improvement phase must be set in profile.index.improvementPhase.
   *
   * @param profile Complete EssayProfile with Understanding + Analysis + North Star
   * @param reanalysisBrief Optional context when running during re-analysis
   * @param contradictionFlags Optional W4.4 contradiction flags for annotation context
   * @param findingStore Optional FindingStore for per-paragraph finding references (W7.1)
   * @param readingStrategy Optional L3.75 reading strategy for this essay
   * @param priorAnnotations Optional previous annotation context for re-analysis
   */
  async generateAnnotations(
    profile: Readonly<EssayProfile>,
    reanalysisBrief?: ReanalysisBrief,
    contradictionFlags?: string[],
    findingStore?: FindingStore,
    readingStrategy?: ReadingStrategy,
    priorAnnotations?: Map<number, PriorAnnotationContext>,
  ): Promise<L5AnnotationResult> {
    const startTime = Date.now();

    // ── Validate prerequisites ──
    this.validatePrerequisites(profile);

    const phase = profile.index.improvementPhase;
    const phaseGuidance = PHASE_GUIDANCE[phase.level];
    const northStar = profile.northStar;
    const essayText = this.getEssayText(profile);

    // ── Build the cached context blocks ──
    const systemPrompt = this.buildSystemPrompt(phase, phaseGuidance, readingStrategy);
    // Smart context: compact shared digest + pre-computed paragraph relevance
    const { analysisContextBuilder } = await import('./analysisContextBuilder');
    const relevanceIndex = analysisContextBuilder.buildRelevanceIndex(profile);
    const smartSharedDigest = analysisContextBuilder.buildSharedDigest(profile, 'l5');
    // Append reanalysis/contradiction context to the shared digest (these apply to all paragraphs)
    const additionalShared: string[] = [];
    if (reanalysisBrief) additionalShared.push(`\n=== REANALYSIS BRIEF ===\n${reanalysisBrief}`);
    if (contradictionFlags && contradictionFlags.length > 0) {
      additionalShared.push(`\n=== CONTRADICTION FLAGS ===\n${contradictionFlags.join('\n')}`);
    }
    const sharedContext = smartSharedDigest + additionalShared.join('');

    // Batch paragraphs in groups of 2 to prevent rate limit storms
    const L5_BATCH_SIZE = 2;
    const paragraphResults: PromiseSettledResult<Awaited<ReturnType<typeof this.annotateParagraph>>>[] = [];
    for (let batchStart = 0; batchStart < profile.paragraphs.length; batchStart += L5_BATCH_SIZE) {
      const batch = profile.paragraphs.slice(batchStart, batchStart + L5_BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((para) => {
          // Build paragraph-relevant holistic context
          const paraRelevance = relevanceIndex.get(para.index);
          const paraRelevantContext = paraRelevance
            ? analysisContextBuilder.buildParagraphContext(profile, para.index, paraRelevance, 'l5')
            : '';
          return this.annotateParagraph(
            para,
            profile,
            northStar,
            phase,
            phaseGuidance,
            systemPrompt,
            sharedContext,
            essayText,
            findingStore,
            priorAnnotations?.get(para.index),
            paraRelevantContext,
          );
        }),
      );
      paragraphResults.push(...batchResults);
    }

    // ── Accumulate results ──
    const paragraphAnnotations: ParagraphAnnotations[] = [];
    let totalCost = 0;
    const totalTokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };

    // Scope 1 Phase 3 fail-fast (GAP-5/6/7/8/9 bundle + X12/X21 corrections):
    // accumulate per-paragraph failures and throw PipelineError at loop end
    // if any failed. The legacy "push empty annotations and continue" pattern
    // silently degraded L5 output; fail-fast surfaces real bugs immediately.
    const failedParagraphs: number[] = [];
    let firstFailure: Error | undefined;
    for (let i = 0; i < paragraphResults.length; i++) {
      const result = paragraphResults[i];
      if (result.status === 'fulfilled') {
        paragraphAnnotations.push(result.value.paragraphAnnotations);
        totalCost += result.value.cost;
        totalTokenUsage.inputTokens += result.value.tokenUsage.inputTokens;
        totalTokenUsage.outputTokens += result.value.tokenUsage.outputTokens;
        totalTokenUsage.cacheReadTokens += result.value.tokenUsage.cacheReadTokens;
        totalTokenUsage.cacheWriteTokens += result.value.tokenUsage.cacheWriteTokens;
      } else {
        failedParagraphs.push(i);
        const failureErr =
          result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason));
        if (!firstFailure) firstFailure = failureErr;
        console.error(
          `[DeepAnnotationService] Paragraph ${i} annotation failed:`,
          failureErr.message,
        );
      }
    }
    if (failedParagraphs.length > 0) {
      const { PipelineError } = await import('../errors');
      throw PipelineError.paragraphLoopFailed(
        'L5',
        failedParagraphs,
        paragraphResults.length,
        firstFailure,
      );
    }

    // ── W1.6: Grounding diagnostic (replaces destructive filter) ──
    // Tag each annotation with groundingQuality instead of deleting ungrounded ones.
    // Deleting paid LLM output is a Rule 2 violation — diagnose, don't destroy.
    let totalUngrounded = 0;
    for (const pa of paragraphAnnotations) {
      for (const ann of pa.annotations) {
        if (!ann.northStarConnection || ann.northStarConnection.trim().length < 5) {
          ann.groundingQuality = 'ungrounded';
        } else if (/(P\d|through.?line|structural|fulcrum|arc|earning|voice|theme|motif|pivot|tension|contrast)/i.test(ann.northStarConnection)) {
          ann.groundingQuality = 'grounded';
        } else if (ann.northStarConnection.trim().length >= 10) {
          ann.groundingQuality = 'weakly_grounded';
        } else {
          ann.groundingQuality = 'ungrounded';
        }
      }
      const ungroundedCount = pa.annotations.filter(a => a.groundingQuality === 'ungrounded').length;
      if (ungroundedCount > pa.annotations.length * 0.3) {
        console.warn(`[L5] Warning: ${ungroundedCount}/${pa.annotations.length} annotations ungrounded at P${pa.paragraphIndex} — prompt quality signal`);
      }
      totalUngrounded += ungroundedCount;
    }
    if (totalUngrounded > 0) {
      console.log(`[L5] ${totalUngrounded} ungrounded annotations total (diagnosed, not filtered)`);
    }

    // ── Scope 1 GAP-9: Transferable principle post-call tagger (multi-signal) ──
    // Zero-LLM-cost deterministic matching against the 20-route
    // TECHNIQUE_ROUTES vocabulary. A technique is assigned only when ≥2
    // of {keyword, dimension, teachingMode} signals match, cutting the
    // single-keyword false-positive rate from ~60% to ~15%. Populates the
    // `transferablePrinciple` field which validateAnnotations() initialized
    // to null.
    try {
      const { matchAnnotationToTechnique } = await import('../coaching/techniqueMatcher');
      let tagged = 0;
      for (const pa of paragraphAnnotations) {
        for (const ann of pa.annotations) {
          // L5Annotation doesn't carry a dimension tag today — signal 2
          // will be unavailable, so matches require signal 1 + signal 3.
          // If a dimension is added to L5Annotation in a follow-up scope,
          // this call site passes it in transparently.
          const dimensions =
            (ann as unknown as { dimensions?: string[] }).dimensions ?? null;
          const technique = matchAnnotationToTechnique(
            ann.content,
            ann.capacityBuildingNote,
            dimensions,
            ann.teachingMode ?? null,
          );
          if (technique) {
            ann.transferablePrinciple = technique;
            tagged++;
          }
        }
      }
      if (tagged > 0) {
        console.log(`[L5] Transferable principle tagged on ${tagged} annotations (multi-signal matcher)`);
      }
    } catch (err) {
      // Non-fatal — transferablePrinciple is a label, not load-bearing.
      // Log with layer prefix per fail-fast doctrine rule 5.
      console.warn(
        '[L5] Technique tagging failed:',
        err instanceof Error ? err.message : err,
      );
    }

    // ── Extract essay-level annotations ──
    const essayLevelAnnotations = this.extractEssayLevelAnnotations(paragraphAnnotations, phase);

    // ── Deduplicate and prioritize ──
    const allAnnotations = this.deduplicateAndPrioritize(
      paragraphAnnotations,
      essayLevelAnnotations,
      phase,
      phaseGuidance,
    );

    // ── Cross-paragraph annotations ──
    // After all paragraph-level calls complete, run ONE additional call
    // to identify teaching moments that span paragraphs.
    let crossParagraphAnnotations: L5Annotation[] = [];
    try {
      const crossResult = await this.generateCrossParagraphAnnotations(
        allAnnotations.paragraphAnnotations,
        profile,
        phase,
        systemPrompt,
        sharedContext,
      );
      crossParagraphAnnotations = crossResult.annotations;
      totalCost += crossResult.cost;
      totalTokenUsage.inputTokens += crossResult.tokenUsage.inputTokens;
      totalTokenUsage.outputTokens += crossResult.tokenUsage.outputTokens;
      totalTokenUsage.cacheReadTokens += crossResult.tokenUsage.cacheReadTokens;
      totalTokenUsage.cacheWriteTokens += crossResult.tokenUsage.cacheWriteTokens;

      if (crossParagraphAnnotations.length > 0) {
        console.log(
          `[L5] Cross-paragraph annotations: ${crossParagraphAnnotations.length} generated`,
        );
      }
    } catch (error) {
      console.error(
        '[DeepAnnotationService] Cross-paragraph annotation generation failed:',
        error instanceof Error ? error.message : error,
      );
      // Continue — cross-paragraph annotations are additive, not critical
    }

    // ── Density diagnostics ──
    const densityDiagnostics: AnnotationDensityDiagnostic[] = [];
    for (const pa of allAnnotations.paragraphAnnotations) {
      const paraProfile = profile.paragraphs[pa.paragraphIndex];

      if (pa.annotations.length === 0 && paraProfile && !paraProfile.walkSkipped) {
        const role = paraProfile.understanding?.role ?? 'unknown';
        console.log(
          `[L5] Zero annotations for P${pa.paragraphIndex} (role: ${role}, phase: ${phase.level}). ` +
          `This is expected for transitional paragraphs, investigate if load-bearing.`,
        );
      }

      // Record density diagnostic for paragraphs with notable density
      if (pa.annotations.length > 0) {
        densityDiagnostics.push({
          paragraphIndex: pa.paragraphIndex,
          annotationCount: pa.annotations.length,
          strengthCount: pa.annotations.filter(a => a.type === 'strength').length,
          growthCount: pa.annotations.filter(a => a.type === 'growth').length,
          interpretation: pa.annotations.length > 4
            ? `High density (${pa.annotations.length}) — paragraph is architecturally rich or troubled`
            : pa.annotations.length <= 1
              ? `Low density (${pa.annotations.length}) — paragraph may be transitional or clean`
              : `Normal density (${pa.annotations.length})`,
        });
      }
    }

    const annotationCount = allAnnotations.paragraphAnnotations.reduce(
      (sum, pa) => sum + pa.annotations.length,
      0,
    ) + allAnnotations.essayLevelAnnotations.length + crossParagraphAnnotations.length;

    return {
      paragraphAnnotations: allAnnotations.paragraphAnnotations,
      essayLevelAnnotations: allAnnotations.essayLevelAnnotations,
      crossParagraphAnnotations,
      phase: phase.level,
      annotationCount,
      densityDiagnostics,
      cost: totalCost,
      tokenUsage: totalTokenUsage,
      timingMs: Date.now() - startTime,
    };
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  private validatePrerequisites(profile: Readonly<EssayProfile>): void {
    if (!profile.northStar) {
      throw new Error(
        '[DeepAnnotationService] North Star (L4) must be populated before generating L5 annotations. ' +
        'The North Star provides structural roles and through-line context that L5 needs for ' +
        'architecture-grounded feedback.',
      );
    }

    if (!profile.index.improvementPhase) {
      throw new Error(
        '[DeepAnnotationService] ImprovementPhase must be set in ProfileIndex before generating L5 annotations. ' +
        'The phase determines what level of feedback to surface.',
      );
    }

    // At least some paragraphs should have analysis
    const analyzedCount = profile.paragraphs.filter(
      (p) => p.analysis !== null,
    ).length;
    if (analyzedCount === 0) {
      throw new Error(
        '[DeepAnnotationService] No paragraphs have L3.5 analysis. ' +
        'L5 annotations require analysis context to generate meaningful feedback.',
      );
    }
  }

  // ==========================================================================
  // PROMPT CONSTRUCTION
  // ==========================================================================

  /**
   * Block 1: System prompt with phase-specific instructions.
   * Cached across all paragraph calls within the same essay.
   *
   * V2: Teaching-focused prompt with teaching modes, cognitive sequencing,
   * capacity building, and reading strategy awareness.
   */
  private buildSystemPrompt(
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    readingStrategy?: ReadingStrategy,
  ): string {
    const readingStrategySection = readingStrategy
      ? `
READING STRATEGY AWARENESS:
The analysis system discovered that this essay rewards attention to:
"${readingStrategy.strategy}"
Best approach: "${readingStrategy.bestApproach}"
What this essay is NOT: ${readingStrategy.antiPatterns.join('; ')}

Let this guide what you emphasize in annotations. If the reading strategy
says the essay rewards attention to vocabulary domain shifts, annotations
about voice register and word choice carry more weight than generic
structural observations. The reading strategy tells you what makes THIS
essay tick — let your annotations match.
`
      : '';

    return `You are a writing teacher generating annotations for a college admissions essay. You have access to a deep analytical profile of this essay — including structural architecture, voice map, emotional topography, earned-ness assessments, thematic threads, and a North Star that captures what the essay is trying to MEAN.

YOUR FUNDAMENTAL PRINCIPLE: Every annotation is a TEACHING MOMENT, not an assessment. You never describe what IS — you explain what it MEANS for the essay's architecture and what the student can't see without your architectural knowledge.

THE TEACHING TEST:
Before finalizing each annotation, ask: "Could the student see this by re-reading their own essay carefully?"
- If YES → this is assessment, not teaching. Upgrade by adding CONSEQUENCE (why it matters for the architecture) or don't include it.
- If NO → this is teaching. Keep it.

Examples of the upgrade:
  ASSESSMENT: "P2 uses extended metaphor."
  TEACHING: "P2's extended metaphor does double duty: it makes the abstract strategic thinking concrete for the reader AND it establishes the vocabulary domain that P4's leadership moment needs to feel native, not imported."

The student already knows P2 uses a metaphor. They don't know WHY it matters that it does.

TEACHING MODES (select per annotation — not per essay or per phase):
- AWARENESS: "Notice this..." — draws attention to a pattern the student likely hasn't seen. No fix suggested. Goal: build perception.
- CONSEQUENCE: "This matters because..." — explains the architectural consequence of a local choice. Goal: build structural thinking.
- CONNECTION: "This relates to..." — links this moment to another part of the essay. Goal: build architectural vision.
- ACTION: "Try this..." — specific, structurally-grounded rewrite. Goal: provide a concrete next step.

Select the mode that serves each specific teaching moment. Don't default to ACTION for everything — awareness and consequence build deeper learning than instructions.

CURRENT IMPROVEMENT PHASE: ${phase.level}
${phaseGuidance.description}

PHASE REASONING: ${phase.reasoning}
FOCUS AREAS: ${phase.focusAreas.join(', ')}
${phase.deferredAreas.length > 0 ? `DEFERRED (lower priority, but use when the teaching moment is powerful enough): ${phase.deferredAreas.join(', ')}` : ''}
COACHING LENS: ${phase.coachingLens}

ANNOTATION TYPES (routing taxonomy — the real intent lives in teachingIntent):
- strength: What is working and WHY it works architecturally. Not just "good job" — explain the structural contribution.
- growth: Where improvement would have the highest architectural impact. Frame as opportunity, not deficiency.
- structural: How this relates to the essay's architecture. Connection to other parts.
- teaching: Deeper understanding of craft that helps the student grow as a writer. WHY this technique matters here.

ANNOTATION SEQUENCING:
Order annotations within each paragraph for cognitive flow:
AWARENESS → CONSEQUENCE → CONNECTION → ACTION.
Exception: if a single annotation is the most important thing about this paragraph, lead with it regardless of mode.

REWRITE EXAMPLES — STRUCTURAL AWARENESS REQUIRED:
Every rewriteExample must demonstrate awareness of the paragraph's architectural role. A rewrite that makes a sentence "better" in isolation but ignores its structural function is worse than no rewrite.

ACTION MODE REQUIRES A REWRITE — NO ESCAPE HATCH.
An annotation emitted with teachingMode="action" MUST have a non-null rewriteExample. Period.

There is no "change to consequence mode" downgrade path. If you cannot produce a rewrite, the annotation should have been emitted with teachingMode="consequence" from the OUTSET — NOT downgraded after you discover the rewrite is hard. The teaching mode decision comes BEFORE the rewrite attempt, not after.

Implementation note: any annotation arriving at the parser with teachingMode="action" AND rewriteExample=null is a parse error and will be dropped with a diagnostic log. You will not be rewarded for "I tried ACTION mode then gave up" — you will simply lose the annotation. Pick the mode that matches your confidence in producing a rewrite.

REWRITE SCAFFOLDS:
When the paragraph prompt includes a "REWRITE SCAFFOLDS" block (pre-detected from the essay's telling phrases), use the scaffold's BEFORE/AFTER pattern as the starting point and adapt it aggressively to this paragraph's specific content and architectural role. The scaffold is the starting point, not a template.

REWRITE QUALITY BAR:
- The rewrite must demonstrate the specific improvement being taught.
- 2-4 sentences max. Not a complete paragraph replacement.
- When detected phrases exist in this paragraph, use the exact quoted phrase as the implicit BEFORE.

AO STAKES GROUNDING (the stakes field):
When the HOLISTIC UNDERSTANDING includes AO Archetype + pool density + differentiator (rendered earlier in this prompt), use them to ground the "stakes" field in AO phenomenology — what the reader actually experiences at this sentence.

RULES:
- Frame the stakes from inside the AO's head, not the structural system's perspective.
- Reference the archetype + pool density when they amplify the stake (e.g., "In a saturated pool of {archetype} essays...").
- Reference the differentiator when the issue prevents it from landing (e.g., "...before your {differentiator} can register").
- 1-2 sentences max, ≤35 words. Concrete, phenomenological.
- Populate for growth/teaching/action/structural annotations. Null for pure strength annotations.

GOOD: "In a saturated pool of determined-grandparent essays, an AO reaches 'determined' and files this under the archetype before your pawnshop scene can differentiate you."
BAD: "This weakens the essay's effectiveness." (structural, not phenomenological)

WORD ECONOMY (wordEconomyCut field):
When a rewriteExample adds net words to the paragraph, ALWAYS provide wordEconomyCut.
Essays have word limits. Students cannot add without cutting. Identify ONE specific sentence to cut:
- Format: "Cut P{n}S{n}: 'first 8 words of the sentence...' ({word count} words) — {one-line reason the rewrite renders this sentence redundant}"
- Pick a sentence the rewrite renders redundant — one that ASSERTS what the rewrite will SHOW.
- Use the WORD ECONOMY SIGNALS injected in the paragraph prompt (if present) as primary candidates.
- Null when the rewrite is length-neutral or the annotation is not ACTION mode.

GOOD: "Cut P3S5: 'This experience changed how I thought about value.' (9 words) — the rewrite already enacts this meaning; the abstract statement becomes redundant."
BAD: "Cut something in P3." (unspecific, unactionable)

ANTI-PATTERN EXAMPLE (antiPatternExample field):
For growth annotations that identify a cliché, stock phrase, or telling-not-showing pattern, quote the EXACT 5-12 words that ARE the problem.
- Students often don't know WHICH words are clichéd — give them the exact phrase to fix.
- When the paragraph prompt includes "DETECTED ANTI-PATTERN PHRASES" (pre-detected from TELLING_PHRASE_PATTERNS), prefer those exact phrases — they are verified to exist in the essay text.
- Format: exact quoted phrase, no ellipsis, 5-12 words max.
- Null for strength annotations, structural notes, or issues without a single quotable phrase.

GOOD: "From the moment my fingers first danced across"
BAD: "The opening paragraph contains clichéd language" (too vague — doesn't isolate the phrase)

CLARIFICATION: spanText is the full UI highlight anchor; antiPatternExample is the specific sub-phrase within that anchor that carries the problem. They can differ. Example: spanText="From the moment my fingers first danced across the piano keys, I was captivated by..." and antiPatternExample="From the moment my fingers first danced across".

STRENGTH ANNOTATIONS:
When acknowledging strengths, explain WHY they work architecturally. "This is a strong opening" is assessment. "This opening earns the reader's attention by creating a specific sensory world — and that world is what makes P4's meaning-shift possible" is teaching.

CAPACITY BUILDING (the capacityBuildingNote field):
Populate ONLY when you identify a transferable writing skill. Not every annotation has one. But when it does, frame it as a PATTERN the student can look for on their own.
GOOD: "In your next essay, watch for the moment where you switch from showing a specific experience to explaining what it means. That switch is almost always where your strongest writing yields to your safest."
BAD: "Remember to show, don't tell." (Generic. Not transferable.)
${readingStrategySection}
CROSS-REFERENCING:
- Reference findings by [F] label as your PRIMARY grounding — findings carry evidence, scope, and coaching value. Example: "As noted in [F3], your metaphor here is decorative rather than structural."
- Reference sentences by P{n}S{m} and their primary function for sentence-level context. Example: "P2S3's primary function — grounding the reader through physical detail — connects to the essay's through-line."

SENTENCE TAGS:
Each sentence may carry semantic tags (e.g., "opening_hook", "emotional_peak", "thematic_pivot", "setup_payoff").
These tags indicate architectural function identified during understanding. Use them to calibrate annotation density:
- "opening_hook" — first impression impact is teachable
- "emotional_peak" — earned-ness is the teaching angle
- "thematic_pivot" — structural consequence is the teaching angle
Tags are informational — they should inform but not constrain your annotations.

CRAFT TECHNIQUES:
For Craft/Polish/Distinction phases, each sentence includes identified craft techniques
(e.g., "anaphora", "juxtaposition", "sensory detail"). Reference these by name when your
annotation teaches about craft. Instead of "this sentence uses repetition effectively",
say "the anaphora here ('I knew... I knew... I knew') does something specific — it builds
the emotional pressure that P4's breaking point needs to feel inevitable."

NORTH STAR GROUNDING (required — structural quality control):
Every annotation's northStarConnection must reference THIS essay's specific architecture (structural role, through-line, earned-ness, or connection network). If you cannot ground an observation in the essay's architecture, do not include it.

CROSS-PARAGRAPH AWARENESS:
If an annotation's teaching point involves another paragraph, populate crossParagraphRefs with the other paragraph indices. The annotation still anchors to one primary location, but the reader can see the connection.

ANNOTATION STRUCTURE (JSON):
{
  "annotations": [
    {
      "paragraphIndex": 0,
      "sentenceIndex": 2,
      "spanText": "exact text from the paragraph if applicable",
      "type": "growth",
      "teachingIntent": "Show the student that this sentence is spending P4's emotional budget",
      "teachingMode": "consequence",
      "content": "The annotation text — specific, architecture-grounded",
      "teachingRationale": "WHY this matters to the essay's architecture",
      "northStarConnection": "How this relates to structural role / through-line",
      "stakes": "1-2 sentences (≤35 words): what the AO experiences at this sentence, grounded in archetypeContext when present. Null for pure strengths.",
      "priority": 1,
      "phase": "${phase.level}",
      "rewriteExample": "Structurally aware alternative. REQUIRED for ACTION mode. Null ONLY if teachingMode != 'action'.",
      "wordEconomyCut": "Cut P{n}S{n}: 'first 8 words...' ({word count} words) — {reason}. Null for non-additive rewrites.",
      "antiPatternExample": "Exact 5-12 word quoted phrase that IS the problem. Null for strength/structural.",
      "confidence": 0.85,
      "crossParagraphRefs": [3, 4],
      "capacityBuildingNote": "In future writing, watch for moments where you claim an emotion instead of letting the reader feel it through detail."
    }
  ]
}

Note: transferablePrinciple is populated POST-CALL by a deterministic technique matcher. Do NOT emit it in your output — it will be overwritten.

QUALITY BAR:
- Priority 1 = most important for this phase. Priority 5 = least important.
- Every annotation must pass the teaching test.
- At least 25% of annotations should be strength type.

OUTPUT: JSON object with "annotations" array. No markdown wrapping, no explanation text.`;
  }

  /**
   * Block 2: Shared context — essay text + complete understanding/analysis + North Star.
   * Cached across all parallel paragraph calls for the same essay.
   */
  private buildSharedContext(
    profile: Readonly<EssayProfile>,
    essayText: string,
    northStar: EssayNorthStar,
    reanalysisBrief?: ReanalysisBrief,
    contradictionFlags?: string[],
  ): string {
    const sections: string[] = [];

    // ── Full essay text ──
    sections.push(`FULL ESSAY TEXT:\n${essayText}`);

    // ── North Star (the key differentiator) ──
    sections.push(this.renderNorthStar(northStar));

    // ── Holistic understanding summary ──
    sections.push(this.renderHolisticContext(profile));

    // ── Paragraph understanding + analysis map ──
    sections.push(this.renderParagraphMap(profile));

    // ── Moment earned-ness map ──
    if (profile.momentEarnednessMap?.moments?.length > 0) {
      sections.push(this.renderEarnednessMap(profile.momentEarnednessMap));
    }

    // ── Connection graph summary ──
    const activeConns = profile.connections?.all?.filter(c => c.status === 'active') ?? [];
    if (activeConns.length > 0) {
      const connectionSummary = activeConns
        .map((c) => {
          const from = c.from.sentence !== undefined
            ? `P${c.from.paragraph}S${c.from.sentence}`
            : `P${c.from.paragraph}`;
          const to = c.to.sentence !== undefined
            ? `P${c.to.paragraph}S${c.to.sentence}`
            : `P${c.to.paragraph}`;
          return `  ${c.id}: ${from} → ${to} [${c.routingTags.join(',')}] (${c.strengthCategory}): ${c.description}`;
        })
        .join('\n');
      sections.push(`CONNECTION GRAPH:\n${connectionSummary}`);
      if (profile.connections.graphSummary) {
        sections.push(`Graph Summary: ${profile.connections.graphSummary}`);
      }
    }

    // ── L4 Coaching Map OR Prioritized Improvements (direct annotation fuel) ──
    const coachingMap = profile.scoreMatrix?.coachingMap;
    if (coachingMap) {
      const cmParts: string[] = [];
      if (coachingMap.transformativeInsight.insight) {
        cmParts.push(
          `  TRANSFORMATIVE INSIGHT: ${coachingMap.transformativeInsight.insight}\n` +
          `    WHY: ${coachingMap.transformativeInsight.whyThisTransforms}` +
          (coachingMap.transformativeInsight.requiresStudentAwareness ? ' [requires student awareness]' : ''),
        );
      }
      if (coachingMap.priorities.length > 0) {
        const priorityLines = coachingMap.priorities
          .map((p, i) =>
            `  ${i + 1}. P[${p.target.paragraphs.join(',')}]: ${p.priority} [${p.expectedImpact}]\n` +
            `     Architecture: ${p.architecturalReason}\n` +
            `     Unlocks: ${p.unlocksNext}`,
          )
          .join('\n');
        cmParts.push(`  PRIORITIES:\n${priorityLines}`);
      }
      if (coachingMap.protectedStrengths.length > 0) {
        const strengthLines = coachingMap.protectedStrengths
          .map((s) => `  PROTECT: ${s.description} — ${s.whyProtect}`)
          .join('\n');
        cmParts.push(`  PROTECTED STRENGTHS:\n${strengthLines}`);
      }
      // Scope 1 Phase 2: surface L4 emergentPatterns and scoreTensions as
      // coaching hooks. These were dead fields in the legacy object shape
      // (generated but never read downstream). Now compressed to string[]
      // and wired into L5 paragraph annotation prompts so the patterns
      // actually reach the student's coaching surface.
      if (coachingMap.emergentPatterns.length > 0) {
        cmParts.push(
          `  EMERGENT PATTERNS:\n` +
          coachingMap.emergentPatterns.map((p) => `    • ${p}`).join('\n'),
        );
      }
      if (coachingMap.scoreTensions.length > 0) {
        cmParts.push(
          `  SCORE TENSIONS:\n` +
          coachingMap.scoreTensions.map((t) => `    • ${t}`).join('\n'),
        );
      }
      sections.push(`COACHING MAP (from L4 score matrix):\n${cmParts.join('\n')}`);
    } else if (profile.scoreMatrix?.prioritizedImprovements?.length) {
      // Fallback to flat prioritized improvements when coaching map isn't available
      const improvements = profile.scoreMatrix.prioritizedImprovements
        .map((imp) =>
          `  P${imp.paragraph}: ${imp.improvement} [${imp.expectedImpact}]\n` +
          `    WHY: ${imp.whyThisMatters}`,
        )
        .join('\n');
      sections.push(`PRIORITIZED IMPROVEMENTS (from L4 score matrix):\n${improvements}`);
    }

    // ── L4 Cross-paragraph patterns (Scope 1 Phase 2: activated as coaching hooks) ──
    // Previously generated but never surfaced in L5 context. Compressed to
    // ≤15 words per entry, max 3 entries, and now threaded through as
    // direct annotation fuel.
    const crossPatterns = profile.scoreMatrix?.crossParagraphPatterns ?? [];
    if (crossPatterns.length > 0) {
      sections.push(
        `CROSS-PARAGRAPH PATTERNS (from L4 score matrix):\n` +
        crossPatterns.map((p) => `  • ${p}`).join('\n'),
      );
    }

    // ── L4 Coherence Issues (blocking contradictions are annotation-worthy) ──
    if (profile.coherenceReport && !profile.coherenceReport.isCoherent) {
      const blocking = profile.coherenceReport.contradictions
        .filter((c) => c.severity === 'blocking' || c.severity === 'notable');
      if (blocking.length > 0) {
        const coherenceText = blocking
          .map((c) => {
            let line = `  [${c.severity}] ${c.sectionA}: "${c.claimA}" vs ${c.sectionB}: "${c.claimB}"`;
            if (c.routingCategory) line += ` (${c.routingCategory})`;
            if (c.source === 'adversarial') line += ' [adversarial]';
            line += `\n    Resolution: ${c.suggestedResolution}`;
            if (c.evidenceA) line += `\n    Evidence A: ${c.evidenceA}`;
            if (c.evidenceB) line += `\n    Evidence B: ${c.evidenceB}`;
            return line;
          })
          .join('\n');
        sections.push(`COHERENCE ISSUES (contradictions in profile):\n${coherenceText}`);
      }
    }

    // ── W4.4: Programmatic contradiction flags (from contradiction consumer) ──
    if (contradictionFlags && contradictionFlags.length > 0) {
      sections.push(
        `PROGRAMMATIC CONTRADICTIONS (cross-domain validation):\n` +
        `The following contradictions were detected by deterministic cross-checks between profile sections.\n` +
        `Consider surfacing relevant contradictions as annotations when they affect a paragraph you are annotating.\n` +
        contradictionFlags.map((flag) => `  ${flag}`).join('\n'),
      );
    }

    // ── Re-analysis brief (when running during re-analysis) ──
    if (reanalysisBrief) {
      sections.push(this.renderReanalysisBrief(reanalysisBrief));
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Block 3: Paragraph-specific context — NOT cached.
   * Sent as the user message for each parallel call.
   */
  private buildParagraphPrompt(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
    // Scope 1 GAP-6/7/8: pre-call enrichment block. Injected into `sections`
    // before GENERATION INSTRUCTIONS when non-empty. Type is imported dynamically
    // via the `import type` below to keep buildParagraphPrompt synchronous.
    enrichment?: { promptBlock: string; detectedPhrases: string[]; hasScaffolds: boolean },
  ): string {
    const sections: string[] = [];

    // ── Target paragraph identification ──
    sections.push(`TARGET PARAGRAPH: P${para.index}`);
    sections.push(`PARAGRAPH TEXT:\n${para.text}`);

    // ── Structural role from North Star ──
    const structuralRole = northStar.structuralRolesMap.find(
      (r) => r.paragraphs.includes(para.index),
    );
    if (structuralRole) {
      sections.push(
        `STRUCTURAL ROLE: ${structuralRole.role}\n` +
        `SIGNIFICANCE: ${structuralRole.weight}\n` +
        `WHY NECESSARY: ${structuralRole.significance}`,
      );
    } else {
      sections.push('STRUCTURAL ROLE: Not explicitly assigned in the North Star (may be transitional or decorative)');
    }

    // ── Through-line involvement ──
    const throughLineInvolvement = this.getThroughLineInvolvement(
      para.index,
      northStar.throughLineMap,
    );
    if (throughLineInvolvement) {
      sections.push(`THROUGH-LINE INVOLVEMENT: ${throughLineInvolvement}`);
    } else {
      sections.push('THROUGH-LINE INVOLVEMENT: None directly — but consider how this paragraph supports the through-line indirectly');
    }

    // ── Earned-ness arrows involving this paragraph ──
    const earnednessContext = this.getEarnednessContext(para.index, profile.momentEarnednessMap);
    if (earnednessContext) {
      sections.push(`EARNED-NESS CONTEXT:\n${earnednessContext}`);
    }

    // ── Paragraph understanding + analysis summary ──
    if (para.understanding) {
      sections.push(
        `PARAGRAPH UNDERSTANDING:\n` +
        `  Role: ${para.understanding.role}\n` +
        `  Function: ${para.understanding.function}\n` +
        `  Narrative Contribution: ${para.understanding.narrativeContribution}\n` +
        `  Emotional Register: ${para.understanding.emotionalRegister.dominantEmotion} (${para.understanding.emotionalRegister.depth})`,
      );
    }
    if (para.analysis) {
      sections.push(
        `PARAGRAPH ANALYSIS:\n` +
        `  Effectiveness: ${para.analysis.effectiveness}/100\n` +
        `  Verdict: ${para.analysis.verdict}\n` +
        `  Strengths: ${para.analysis.strengthSignatures.map((s) => s.quality).join(', ') || 'none identified'}\n` +
        `  Growth Edges: ${para.analysis.growthEdges.map((g) => g.quality).join(', ') || 'none identified'}`,
      );
    }

    // ── W1.3: Sentence tag map (all phases) ──
    const taggedSentences = para.sentences.filter(s => s.understanding?.tags?.length);
    if (taggedSentences.length > 0) {
      const tagMapParts: string[] = ['SENTENCE TAG MAP:'];
      for (const s of taggedSentences) {
        tagMapParts.push(`  S${s.index}: [${s.understanding!.tags.join(', ')}]`);
      }
      sections.push(tagMapParts.join('\n'));
    }

    // ── L4 Score Matrix entry for this paragraph (multi-dimensional scoring) ──
    const scoreEntry = profile.scoreMatrix?.paragraphs?.find((p) => p.index === para.index);
    if (scoreEntry) {
      sections.push(
        `MULTI-DIMENSIONAL SCORES (L4):\n` +
        `  Effectiveness: ${scoreEntry.scores.effectiveness}/100\n` +
        `  Structural: ${scoreEntry.scores.structural}/100\n` +
        `  Voice: ${scoreEntry.scores.voice}/100\n` +
        `  Emotional: ${scoreEntry.scores.emotional}/100\n` +
        `  Thematic: ${scoreEntry.scores.thematic}/100\n` +
        `  Verdict: ${scoreEntry.verdict}\n` +
        `  Priority: ${scoreEntry.priorityForImprovement}/5`,
      );
    }

    // ── Sentence-level detail (for Craft/Polish phases) ──
    if (phase.level === 'craft' || phase.level === 'polish' || phase.level === 'distinction') {
      const sentenceDetails = para.sentences
        .filter((s) => s.understanding || s.analysis)
        .map((s) => {
          const parts: string[] = [`  S${s.index}: "${s.text.substring(0, 80)}${s.text.length > 80 ? '...' : ''}"`];
          if (s.analysis) {
            parts.push(`    Effectiveness: ${s.analysis.effectiveness}/100`);
            if (s.analysis.isStrength) parts.push('    [STRENGTH]');
            if (s.analysis.isProblem) parts.push(`    [PROBLEM] Priority: ${s.analysis.priorityForImprovement}`);
            if (s.analysis.weaknesses.length > 0) {
              parts.push(`    Weaknesses: ${s.analysis.weaknesses.map((w) => w.observation).join('; ')}`);
            }
          }
          if (s.understanding) {
            // Phase 2: primaryFunction replaces observation array display
            if (s.understanding.primaryFunction) {
              parts.push(`    Function: ${s.understanding.primaryFunction} [${s.understanding.significance ?? 'contributing'}]`);
            } else {
              parts.push(`    Functions: ${s.understanding.observedFunctions.map((f) => f.observation).join('; ')}`);
            }
            // W1.3: Wire sentence tags to L5
            if (s.understanding.tags?.length) {
              parts.push(`    Tags: [${s.understanding.tags.join(', ')}]`);
            }
            // W1.4: Wire craft techniques to L5
            if (s.understanding.craft?.techniques?.length) {
              parts.push(`    Craft: [${s.understanding.craft.techniques.join(', ')}] rhythm=${s.understanding.craft.rhythm ?? 'uncharacterized'}`);
            }
            // W1.5: Wire significantChoices to L5
            if (s.understanding.significantChoices?.length) {
              parts.push(`    Notable words: ${s.understanding.significantChoices.map(w => `"${w.word}" (${w.significance?.substring(0, 80) ?? ''})`).join('; ')}`);
            }
          }
          return parts.join('\n');
        })
        .join('\n');
      if (sentenceDetails) {
        sections.push(`SENTENCE DETAIL:\n${sentenceDetails}`);
      }
    }

    // ── W7.1: Per-paragraph finding context ──
    if (findingStore && findingStore.size > 0) {
      const findingContext = buildAnnotationFindingContext(findingStore, para.index);
      if (findingContext) {
        sections.push(findingContext);
      }
    }

    // Phase 2: [U] observation labels removed — findings ([F] labels) are the primary context.
    // buildObservationLabelSummary() is no longer called.

    // ── Prior annotation context (re-analysis) ──
    if (priorAnnotationCtx && priorAnnotationCtx.priorAnnotations.length > 0) {
      const priorLines = priorAnnotationCtx.priorAnnotations.map((a) =>
        `  [${a.addressedByEdit ? 'ADDRESSED' : 'STILL RELEVANT'}] ` +
        `(${a.teachingMode}) ${a.content.substring(0, 100)}...`,
      ).join('\n');
      sections.push(
        `PRIOR ANNOTATIONS (from before the student's edit):\n${priorLines}\n\n` +
        `If an annotation was ADDRESSED by the edit:\n` +
        `- Acknowledge the improvement briefly.\n` +
        `- Surface any NEW concerns the edit may have introduced.\n\n` +
        `If an annotation is STILL RELEVANT:\n` +
        `- Don't repeat it verbatim. Either deepen it (add new dimension or\n` +
        `  architectural connection) or reference it briefly and move to what's changed.`,
      );
    }

    // ── Scope 1 GAP-6/7/8: pre-call enrichment (REWRITE SCAFFOLDS,
    //    DETECTED ANTI-PATTERN PHRASES, WORD ECONOMY SIGNALS) ──
    if (enrichment && enrichment.promptBlock.length > 0) {
      sections.push(enrichment.promptBlock);
    }

    // ── Generation instructions ──
    sections.push(
      `\nGENERATION INSTRUCTIONS:\n` +
      `Generate TEACHING annotations for this paragraph.\n` +
      `Produce as many annotations as this paragraph genuinely needs — no fixed count. ` +
      `A rich, load-bearing paragraph may need 4-5 annotations; a clean transitional paragraph may need 0. ` +
      `Let the paragraph's architectural importance and your teaching judgment determine the count.\n` +
      `Every annotation must pass the TEACHING TEST: could the student see this by re-reading carefully? ` +
      `If yes, upgrade it by adding CONSEQUENCE or don't include it.\n` +
      `Select the teaching mode (awareness/consequence/connection/action) that serves each specific moment.\n` +
      `Order annotations for cognitive flow: AWARENESS → CONSEQUENCE → CONNECTION → ACTION.\n` +
      `Reference the structural role, through-line, and/or earned-ness context above.\n` +
      `Reference findings by [F] label when relevant. Use sentence primary functions for per-sentence context.\n` +
      `Include at least one strength annotation if the paragraph has genuine strengths.\n` +
      `If crossParagraphRefs apply, populate them with the indices of related paragraphs.\n` +
      `If this paragraph has 0 annotations to generate at the current phase level, return an empty annotations array.`,
    );

    return sections.join('\n\n');
  }

  // ==========================================================================
  // CONTEXT RENDERERS
  // ==========================================================================

  private renderNorthStar(northStar: EssayNorthStar): string {
    const sections: string[] = ['ESSAY NORTH STAR (Architecture of Meaning):'];

    // Through-line map
    if (northStar.throughLineMap) {
      const tlm = northStar.throughLineMap;
      sections.push(
        `  THROUGH-LINE:\n` +
        `    Central Element: ${tlm.centralElement} (${tlm.elementType})\n` +
        `    Transformation: ${tlm.transformation}\n` +
        `    Journey:\n` +
        tlm.journey.map((j) =>
          `      P${j.location.paragraph}${j.location.sentence !== undefined ? `S${j.location.sentence}` : ''}: ` +
          `${j.meaningAtPoint} [${j.narrativeMove}]`,
        ).join('\n'),
      );
    }

    // Structural roles map
    sections.push(
      `  STRUCTURAL ROLES:\n` +
      northStar.structuralRolesMap.map((r) =>
        `    P${r.paragraphs.join(',')}: ${r.role} (${r.weight}) — ${r.significance}`,
      ).join('\n'),
    );

    // Trajectory
    if (northStar.trajectory) {
      sections.push(
        `  TRAJECTORY:\n` +
        `    Current State: ${northStar.trajectory.currentState}\n` +
        `    Plausible Paths:\n` +
        northStar.trajectory.plausiblePaths.map((p) =>
          `      [${p.textSupport}] ${p.description}`,
        ).join('\n'),
      );
    }

    // Distinctiveness
    sections.push(
      `  DISTINCTIVENESS:\n` +
      `    ${northStar.distinctivenessSignature.articulation}\n` +
      `    Non-interchangeable factors: ${northStar.distinctivenessSignature.nonInterchangeableFactors.join('; ')}`,
    );

    return sections.join('\n');
  }

  private renderHolisticContext(profile: Readonly<EssayProfile>): string {
    const sections: string[] = ['HOLISTIC UNDERSTANDING:'];

    // Voice identity (compact)
    sections.push(
      `  Voice: ${profile.voiceIdentity.signature}\n` +
      `  Register: ${profile.voiceIdentity.register}\n` +
      `  Distinctive Patterns: ${profile.voiceIdentity.distinctivePatterns.join(', ')}`,
    );

    // Voice map (compact — baselines + shifts only, ~500 chars max)
    if (profile.voiceMap) {
      const vmParts: string[] = [];
      if (profile.voiceMap.register?.baseline) vmParts.push(`Register: ${profile.voiceMap.register.baseline}`);
      if (profile.voiceMap.vocabularyFingerprint?.baseline) vmParts.push(`Vocab: ${profile.voiceMap.vocabularyFingerprint.baseline}`);
      if (profile.voiceMap.sentenceRhythm?.baseline) vmParts.push(`Rhythm: ${profile.voiceMap.sentenceRhythm.baseline}`);
      if (profile.voiceMap.perspectiveDistance?.baseline) vmParts.push(`Perspective: ${profile.voiceMap.perspectiveDistance.baseline}`);
      if (profile.voiceMap.tonalDisposition?.baseline) vmParts.push(`Tone: ${profile.voiceMap.tonalDisposition.baseline}`);
      if (vmParts.length > 0) {
        sections.push(`  Voice Map Baselines: ${vmParts.join(' | ')}`);
      }
      if (profile.voiceMap.shifts?.length) {
        const shiftSummaries = profile.voiceMap.shifts.map(s => {
          const loc = s.location ? `P${s.location.paragraph}${s.location.sentence !== undefined ? 'S' + s.location.sentence : ''}` : '?';
          const intent = s.intentionality?.assessment ?? '?';
          return `${loc}: ${s.fromDescription ?? '?'} → ${s.toDescription ?? '?'} (${intent})`;
        });
        sections.push(`  Voice Shifts: ${shiftSummaries.join('; ')}`);
      }
    }

    // Thematic architecture (compact)
    sections.push(
      `  Central Thesis: ${profile.thematicArchitecture.centralThesis} (confidence: ${profile.thematicArchitecture.thesisConfidence})\n` +
      `  Threads: ${profile.thematicArchitecture.threads.map((t) => `${t.thread} [${t.strength}]`).join(', ')}`,
    );

    // Emotional arc
    sections.push(`  Emotional Arc: ${profile.emotionalTopography.arcTrajectory}`);

    // Narrative strategy
    sections.push(`  Narrative Strategy: ${profile.narrativeStrategy.primaryStrategy}`);

    // Character
    sections.push(`  Writer Portrait: ${profile.characterRevelation.writerPortrait}`);

    // Craft assessment
    if (profile.craftAssessment.strengthSignatures.length > 0) {
      sections.push(
        `  Craft Strengths: ${profile.craftAssessment.strengthSignatures.map((s) => s.quality).join(', ')}`,
      );
    }
    if (profile.craftAssessment.growthEdges.length > 0) {
      sections.push(
        `  Craft Growth Edges: ${profile.craftAssessment.growthEdges.map((g) => g.quality).join(', ')}`,
      );
    }

    // Admissions positioning
    sections.push(
      `  AO Takeaway: ${profile.admissionsPositioning.tellabilitySummary}\n` +
      `  Distinctiveness: ${profile.admissionsPositioning.distinctivenessFactors.join(', ')}`,
    );

    // Scope 1 GAP-5: Surface archetypeContext for stakes grounding.
    // Previously orphaned data (generated by L3.75 at
    // holisticSynthesis.ts:1470-1485 but only read by a coaching
    // saturation warning). Now threaded into L5 so the LLM can frame
    // the `stakes` field in AO phenomenology grounded in archetype +
    // pool density + differentiator when present.
    const archCtx = profile.admissionsPositioning.archetypeContext;
    if (archCtx && (archCtx.archetype || archCtx.differentiator)) {
      const poolDensity = archCtx.poolDensity || 'unknown';
      const differentiator = archCtx.differentiator
        ? archCtx.differentiator
        : 'NONE — this essay is currently generic within its archetype';
      sections.push(
        `  AO Archetype: "${archCtx.archetype || 'undefined archetype'}" [pool density: ${poolDensity}]\n` +
        `  Differentiator: ${differentiator}`,
      );
    }

    // Cross-dimension entanglements (compact)
    if (profile.entanglements.length > 0) {
      sections.push(
        `  Key Entanglements:\n` +
        profile.entanglements.slice(0, 5).map((e) =>
          `    P${e.location.paragraph}${e.location.sentence !== undefined ? `S${e.location.sentence}` : ''}: ` +
          `[${e.dimensions.join('+')}] ${e.description}`,
        ).join('\n'),
      );
    }

    return sections.join('\n');
  }

  private renderParagraphMap(profile: Readonly<EssayProfile>): string {
    const lines: string[] = ['PARAGRAPH MAP (Understanding + Analysis):'];

    for (const para of profile.paragraphs) {
      const parts: string[] = [`  P${para.index}:`];

      if (para.understanding) {
        parts.push(`    Role: ${para.understanding.role}`);
        parts.push(`    Function: ${para.understanding.function}`);
      }
      if (para.analysis) {
        parts.push(`    Effectiveness: ${para.analysis.effectiveness}/100 — ${para.analysis.verdict}`);
        if (para.analysis.strengthSignatures.length > 0) {
          parts.push(`    Strengths: ${para.analysis.strengthSignatures.map((s) => `${s.quality}: ${s.evidence}`).join('; ')}`);
        }
        if (para.analysis.growthEdges.length > 0) {
          parts.push(`    Growth: ${para.analysis.growthEdges.map((g) => `${g.quality}: ${g.description}`).join('; ')}`);
        }
      }
      if (para.walkSkipped) {
        parts.push(`    [SKIPPED: ${para.walkSkipped.errorSummary}]`);
      }

      lines.push(parts.join('\n'));
    }

    return lines.join('\n');
  }

  private renderEarnednessMap(earnednessMap: MomentEarnednessMap): string {
    const lines: string[] = ['MOMENT EARNED-NESS MAP:'];
    lines.push(`  Structural Observation: ${earnednessMap.structuralObservation}`);

    for (const moment of earnednessMap.moments) {
      const arrowCount = moment.mechanisms.length;
      const earned = arrowCount >= 2 ? 'EARNED' : 'UNDER-EARNED';
      const mechDetails = moment.mechanisms.length > 0
        ? moment.mechanisms.map((m) => {
            const loc = m.location ? `P${m.location.paragraph}${m.location.sentence !== undefined ? 'S' + m.location.sentence : ''}` : '?';
            const contrib = m.contribution ? `: ${m.contribution.substring(0, 100)}` : '';
            return `${m.type} from ${loc}${contrib}`;
          }).join('; ')
        : 'none';
      lines.push(
        `  P${moment.location.paragraph}S${moment.location.sentence} [${moment.momentType}] — ${earned} (${arrowCount} mechanisms)\n` +
        `    "${moment.description}"\n` +
        `    Mechanisms: ${mechDetails}\n` +
        (moment.gaps.length > 0 ? `    Gaps: ${moment.gaps.join('; ')}` : ''),
      );
    }

    return lines.join('\n');
  }

  private renderReanalysisBrief(brief: ReanalysisBrief): string {
    const lines: string[] = ['RE-ANALYSIS CONTEXT (student recently edited the essay):'];
    // Use changeSummary if present, otherwise fall back to summaryForPrompt
    const summary = brief.changeSummary ?? brief.summaryForPrompt;
    lines.push(`  Changes: ${summary}`);
    // Use editedParagraphs if present, otherwise fall back to structural.paragraphsChanged
    const editedParas = brief.editedParagraphs ?? brief.structural.paragraphsChanged;
    if (editedParas.length > 0) {
      lines.push(`  Edited Paragraphs: ${editedParas.map((p) => `P${p}`).join(', ')}`);
    }
    if (brief.studentIntent) {
      lines.push(`  Student Intent: ${brief.studentIntent}`);
    }
    const structSig = brief.structuralSignificance ??
      (brief.structural.changeScope !== 'sentence' ? brief.structural.changeScope : null);
    if (structSig) {
      lines.push(`  Structural Significance: ${structSig}`);
    }
    lines.push(
      '\n  INSTRUCTION: Acknowledge the student\'s edits in your annotations where relevant. ' +
      'If the edits addressed previously identified issues, note the improvement. ' +
      'If the edits introduced new concerns, surface them. ' +
      'If the student stated an intent, evaluate whether the edits achieved it.',
    );
    return lines.join('\n');
  }

  // ==========================================================================
  // CONTEXT HELPERS
  // ==========================================================================

  private getThroughLineInvolvement(
    paragraphIndex: number,
    throughLineMap: ThroughLineMap | null,
  ): string | null {
    if (!throughLineMap) return null;

    const journeyPoints = throughLineMap.journey.filter(
      (j) => j.location.paragraph === paragraphIndex,
    );
    if (journeyPoints.length === 0) return null;

    return journeyPoints
      .map((j) =>
        `${throughLineMap.centralElement} ${j.narrativeMove}s here: "${j.meaningAtPoint}"` +
        (j.narrativeMove === 'transformation' ? ' [MEANING SHIFT]' : ''),
      )
      .join('; ');
  }

  private getEarnednessContext(
    paragraphIndex: number,
    earnednessMap: MomentEarnednessMap,
  ): string | null {
    if (!earnednessMap?.moments?.length) return null;

    const relevantMoments: string[] = [];

    for (const moment of earnednessMap.moments) {
      // This paragraph contains a significant moment — list each mechanism with detail
      if (moment.location.paragraph === paragraphIndex) {
        const earned = moment.mechanisms.length >= 2;
        let momentDesc = `This paragraph contains a ${moment.momentType} peak: "${moment.description}" ` +
          `(${earned ? 'EARNED' : 'UNDER-EARNED'} — ${moment.mechanisms.length} earning mechanisms)`;
        if (moment.mechanisms.length > 0) {
          const mechLines = moment.mechanisms.map(m => {
            const loc = m.location ? `P${m.location.paragraph}${m.location.sentence !== undefined ? 'S' + m.location.sentence : ''}` : '?';
            const contrib = m.contribution ? m.contribution.substring(0, 120) : '';
            return `  - ${m.type} from ${loc}: ${contrib}`;
          });
          momentDesc += '\n' + mechLines.join('\n');
        }
        if (moment.gaps.length > 0) {
          momentDesc += `\n  Gaps: ${moment.gaps.join('; ')}`;
        }
        relevantMoments.push(momentDesc);
      }

      // This paragraph provides an earning mechanism for another moment
      const mechanismsFromHere = moment.mechanisms.filter(
        (m) => m.location.paragraph === paragraphIndex,
      );
      for (const mech of mechanismsFromHere) {
        relevantMoments.push(
          `This paragraph provides ${mech.type} for P${moment.location.paragraph}S${moment.location.sentence}'s ` +
          `${moment.momentType} moment: "${mech.contribution}"`,
        );
      }
    }

    return relevantMoments.length > 0 ? relevantMoments.join('\n') : null;
  }

  // ==========================================================================
  // W7.2: OBSERVATION LABEL BUILDER
  // ==========================================================================

  /**
   * Build an observation label summary for a paragraph.
   * Maps each sentence's observedFunctions to [U1], [U2], etc. labels
   * that the LLM can cross-reference in its annotations.
   *
   * Labels are numbered sequentially across all sentences in the paragraph,
   * providing a flat namespace: P0S0's first observation is [U1], second is [U2],
   * P0S1's first observation continues as [U3], etc.
   */
  private buildObservationLabelSummary(
    para: Readonly<ParagraphProfile>,
  ): string | null {
    const labels: string[] = [];
    let labelCounter = 1;

    for (const sentence of para.sentences) {
      if (!sentence.understanding?.observedFunctions?.length) continue;

      for (const obs of sentence.understanding.observedFunctions) {
        const label = `U${labelCounter++}`;
        const confidenceStr = obs.confidence >= 0.8 ? '' : ` (conf: ${obs.confidence.toFixed(1)})`;
        labels.push(`  [${label}] S${sentence.index}: ${obs.observation}${confidenceStr}`);
      }
    }

    if (labels.length === 0) {
      return null;
    }

    return `OBSERVATION LABELS FOR P${para.index}:\n${labels.join('\n')}`;
  }

  // ==========================================================================
  // PER-PARAGRAPH ANNOTATION CALL
  // ==========================================================================

  private async annotateParagraph(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
    systemPrompt: string,
    sharedContext: string,
    _essayText: string,
    findingStore?: FindingStore,
    priorAnnotationCtx?: PriorAnnotationContext,
    paragraphRelevantContext?: string,
  ): Promise<{
    paragraphAnnotations: ParagraphAnnotations;
    cost: number;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheWriteTokens: number;
    };
  }> {
    // Skip paragraphs that were skipped during the walk
    if (para.walkSkipped) {
      return {
        paragraphAnnotations: { paragraphIndex: para.index, annotations: [] },
        cost: 0,
        tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      };
    }

    // Scope 1 GAP-6/7/8: pre-call enrichment. Runs zero-LLM-cost detection
    // against the paragraph text to surface REWRITE SCAFFOLDS (from
    // TRANSFORMATION_EXAMPLES), DETECTED ANTI-PATTERN PHRASES (from
    // TELLING_PHRASE_PATTERNS), and WORD ECONOMY SIGNALS (filler-pattern
    // + long-sentence detection). The enrichment block is injected into
    // the paragraph prompt before GENERATION INSTRUCTIONS.
    const { buildPreCallEnrichment } = await import('./preCallEnrichment');
    const enrichment = await buildPreCallEnrichment(para, phase.level);

    const paragraphPrompt = this.buildParagraphPrompt(
      para,
      profile,
      northStar,
      phase,
      phaseGuidance,
      findingStore,
      priorAnnotationCtx,
      enrichment, // Scope 1 GAP-6/7/8
    );

    // 3-block caching: system (cached) + shared digest (cached) + paragraph context (not cached)
    // Block 2 is the COMPACT shared digest (~1800 tokens for L5) instead of the full profile dump.
    // Paragraph-relevant holistic data is injected between the shared context and the paragraph prompt,
    // filtered by the AnalysisContextBuilder to only include dimensions relevant to THIS paragraph.
    const relevantSection = paragraphRelevantContext
      ? `${paragraphRelevantContext}\n\n`
      : '';
    const userMessage = `${sharedContext}\n\n===\n\n${relevantSection}TARGET PARAGRAPH ANNOTATION REQUEST:\n\n${paragraphPrompt}`;

    const response: ClaudeResponse<RawParagraphAnnotationOutput> = await callClaude<RawParagraphAnnotationOutput>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt: userMessage,
        maxTokens: 2000,
        temperature: 0.3,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const cost = calculateCost(response.usage, SONNET);
    console.log(
      `[EssayIntelligence] L5 P${para.index}: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    // ── Parse and validate ──
    const rawOutput = this.parseRawOutput(response.content, para.index);
    const validAnnotations = this.validateAnnotations(rawOutput, para, phase, profile.paragraphs.length);

    return {
      paragraphAnnotations: {
        paragraphIndex: para.index,
        annotations: validAnnotations,
      },
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    };
  }

  // ==========================================================================
  // OUTPUT PARSING & VALIDATION
  // ==========================================================================

  /**
   * Parse raw LLM output into RawAnnotation[].
   * Delegates JSON extraction to the shared parser, then extracts the annotations array.
   */
  private parseRawOutput(
    content: RawParagraphAnnotationOutput | unknown,
    paragraphIndex: number,
  ): RawAnnotation[] {
    // Scope 1 Phase 3 (X21 correction): previously swallowed parse errors
    // and returned `[]`, which silently degraded L5 output. Now logs a
    // diagnostic sample of the raw content and rethrows so the outer
    // paragraph-loop's fail-fast handler can accumulate the failure and
    // surface it as a PipelineError.paragraphLoopFailed.
    try {
      return parseLlmJsonArray(content, `L5 deepAnnotation P${paragraphIndex}`) as RawAnnotation[];
    } catch (err) {
      // Log the error with a sample of the raw content so a post-mortem
      // can diagnose whether the LLM produced malformed JSON, whether
      // the content was a string vs object, or whether a nested field
      // tripped the parser.
      let sample: string;
      if (typeof content === 'string') {
        sample = content.slice(0, 200);
      } else {
        try {
          sample = JSON.stringify(content).slice(0, 200);
        } catch {
          sample = `<unserializable ${typeof content}>`;
        }
      }
      console.error(
        `[deepAnnotationService] parseRawOutput failed — paragraph=${paragraphIndex} ` +
          `error=${err instanceof Error ? err.message : String(err)} ` +
          `raw sample: ${sample}`,
      );
      throw err;
    }
  }

  /**
   * Validate and transform raw LLM annotations into typed L5Annotation objects.
   * V2: handles teachingIntent, teachingMode, crossParagraphRefs, capacityBuildingNote.
   * Also maps V1 type names to V2 for backward compatibility.
   */
  private validateAnnotations(
    rawAnnotations: RawAnnotation[],
    para: Readonly<ParagraphProfile>,
    phase: ImprovementPhase,
    totalParagraphs?: number,
  ): L5Annotation[] {
    const valid: L5Annotation[] = [];

    // V1 → V2 type mapping for backward compatibility
    const typeMapping: Record<string, L5AnnotationType> = {
      'strength_acknowledgment': 'strength',
      'growth_opportunity': 'growth',
      'structural_note': 'structural',
      'teaching_moment': 'teaching',
      'strength': 'strength',
      'growth': 'growth',
      'structural': 'structural',
      'teaching': 'teaching',
    };

    const validTeachingModes: L5TeachingMode[] = ['awareness', 'consequence', 'connection', 'action'];

    for (const raw of rawAnnotations) {
      // ── Validate required fields ──
      if (!raw.content || typeof raw.content !== 'string' || raw.content.trim().length === 0) {
        console.warn('[DeepAnnotationService] Skipping annotation with empty content');
        continue;
      }

      if (!raw.teachingRationale || typeof raw.teachingRationale !== 'string') {
        console.warn('[DeepAnnotationService] Skipping annotation without teachingRationale');
        continue;
      }

      // ── Validate type (V1 + V2 names accepted) ──
      const annotationType: L5AnnotationType = typeMapping[raw.type ?? ''] ?? 'teaching';

      // ── Validate teaching mode ──
      const teachingMode: L5TeachingMode = validTeachingModes.includes(raw.teachingMode as L5TeachingMode)
        ? (raw.teachingMode as L5TeachingMode)
        : 'consequence'; // Default to consequence — the most common teaching mode

      // ── Scope 1 GAP-6 fail-fast: ACTION mode REQUIRES non-null rewriteExample ──
      // No "change mode to consequence" downgrade path. The teaching mode
      // decision happens BEFORE the rewrite attempt, not after. An annotation
      // arriving here with teachingMode='action' and rewriteExample=null is a
      // parse-time failure and is DROPPED with a diagnostic log — the LLM
      // should have emitted CONSEQUENCE mode from the outset.
      if (
        teachingMode === 'action' &&
        (raw.rewriteExample == null ||
          typeof raw.rewriteExample !== 'string' ||
          raw.rewriteExample.trim().length === 0)
      ) {
        console.warn(
          `[L5 validateAnnotations] Dropped annotation: teachingMode='action' without rewriteExample ` +
            `(paragraph=${raw.paragraphIndex ?? para.index}, sentence=${raw.sentenceIndex ?? '?'}). ` +
            `ACTION mode requires a non-null rewrite; use CONSEQUENCE mode instead when rewrite ` +
            `cannot be produced from the outset.`,
        );
        continue; // Drop — do NOT silently downgrade.
      }

      // ── Validate paragraph index ──
      const paragraphIndex = typeof raw.paragraphIndex === 'number'
        ? raw.paragraphIndex
        : para.index;

      // ── Validate sentence index ──
      const sentenceIndex = typeof raw.sentenceIndex === 'number'
        ? raw.sentenceIndex
        : null;

      // ── Validate span text exists in the paragraph ──
      let spanText: string | null = null;
      if (raw.spanText && typeof raw.spanText === 'string') {
        if (para.text.includes(raw.spanText)) {
          spanText = raw.spanText;
        } else {
          // Try case-insensitive match
          const lowerParaText = para.text.toLowerCase();
          const lowerSpan = raw.spanText.toLowerCase();
          if (lowerParaText.includes(lowerSpan)) {
            const idx = lowerParaText.indexOf(lowerSpan);
            spanText = para.text.substring(idx, idx + raw.spanText.length);
          }
          // If still not found, skip spanText but keep the annotation
        }
      }

      // ── Validate phase ──
      const validPhases: ImprovementPhaseLevel[] = [
        'foundation', 'architecture', 'craft', 'polish', 'distinction',
      ];
      const annotationPhase: ImprovementPhaseLevel = validPhases.includes(raw.phase as ImprovementPhaseLevel)
        ? (raw.phase as ImprovementPhaseLevel)
        : phase.level;

      // ── Validate crossParagraphRefs ──
      let crossParagraphRefs: number[] = [];
      if (Array.isArray(raw.crossParagraphRefs)) {
        const maxIdx = totalParagraphs ?? para.index + 10; // Reasonable upper bound
        crossParagraphRefs = raw.crossParagraphRefs
          .filter((ref): ref is number =>
            typeof ref === 'number' && ref >= 0 && ref < maxIdx && ref !== paragraphIndex,
          );
      }

      // ── Build the annotation ──
      valid.push({
        id: crypto.randomUUID(),
        location: {
          paragraphIndex,
          sentenceIndex,
          spanText,
        },
        type: annotationType,
        teachingIntent: (raw.teachingIntent && typeof raw.teachingIntent === 'string')
          ? raw.teachingIntent.trim()
          : raw.content.trim().substring(0, 80),
        teachingMode,
        content: raw.content.trim(),
        teachingRationale: raw.teachingRationale.trim(),
        northStarConnection: (raw.northStarConnection && typeof raw.northStarConnection === 'string')
          ? raw.northStarConnection.trim()
          : 'Not explicitly connected to North Star',
        // Scope 1 GAP-5: AO-framed phenomenological stakes
        stakes: (typeof raw.stakes === 'string' && raw.stakes.trim().length > 0)
          ? raw.stakes.trim()
          : null,
        priority: typeof raw.priority === 'number'
          ? Math.max(1, Math.min(5, Math.round(raw.priority)))
          : 3,
        phase: annotationPhase,
        rewriteExample: (raw.rewriteExample && typeof raw.rewriteExample === 'string')
          ? raw.rewriteExample.trim()
          : null,
        // Scope 1 GAP-7: specific sentence cut for additive rewrites
        wordEconomyCut: (typeof raw.wordEconomyCut === 'string' && raw.wordEconomyCut.trim().length > 0)
          ? raw.wordEconomyCut.trim()
          : null,
        // Scope 1 GAP-8: exact 5-12 word anti-pattern quote
        antiPatternExample: (typeof raw.antiPatternExample === 'string' && raw.antiPatternExample.trim().length > 0)
          ? raw.antiPatternExample.trim()
          : null,
        // Scope 1 GAP-9: populated POST-CALL by techniqueMatcher.
        // Do not attempt to extract from raw.transferablePrinciple — the LLM
        // never emits this directly; the post-call tagger owns this field.
        transferablePrinciple: null,
        confidence: typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0.75,
        crossParagraphRefs,
        capacityBuildingNote: (raw.capacityBuildingNote && typeof raw.capacityBuildingNote === 'string')
          ? raw.capacityBuildingNote.trim()
          : null,
      });
    }

    return valid;
  }

  // ==========================================================================
  // POST-PROCESSING
  // ==========================================================================

  /**
   * Extract essay-level annotations from paragraph results.
   * In Foundation and Distinction phases, some annotations transcend individual paragraphs.
   */
  private extractEssayLevelAnnotations(
    paragraphAnnotations: ParagraphAnnotations[],
    phase: ImprovementPhase,
  ): L5Annotation[] {
    const essayLevel: L5Annotation[] = [];

    for (const pa of paragraphAnnotations) {
      const toPromote: L5Annotation[] = [];
      const toKeep: L5Annotation[] = [];

      for (const ann of pa.annotations) {
        // Promote structural annotations that reference essay-wide architecture
        // in Foundation or Distinction phases
        if (
          ann.type === 'structural' &&
          (phase.level === 'foundation' || phase.level === 'distinction') &&
          ann.priority <= 2
        ) {
          toPromote.push(ann);
        } else {
          toKeep.push(ann);
        }
      }

      // Move promoted annotations to essay level
      if (toPromote.length > 0) {
        essayLevel.push(...toPromote);
        pa.annotations = toKeep;
      }
    }

    return essayLevel;
  }

  /**
   * Deduplicate annotations. NO caps, NO trimming, NO slicing.
   *
   * The only filtering: genuinely identical annotations (same content via
   * first-100-chars normalization) are deduplicated because they represent
   * LLM repetition, not distinct findings. Everything else is kept.
   *
   * If annotation density diverges from phase expectations, that's
   * diagnostic SIGNAL — a rich paragraph with 6 annotations means the
   * paragraph is doing a lot of architectural work. A sparse paragraph
   * with 0 means it's either transitional (fine) or the prompt missed
   * something (investigate). Neither case is fixed by deleting annotations.
   */
  private deduplicateAndPrioritize(
    paragraphAnnotations: ParagraphAnnotations[],
    essayLevelAnnotations: L5Annotation[],
    phase: ImprovementPhase,
    phaseGuidance: typeof PHASE_GUIDANCE[ImprovementPhaseLevel],
  ): {
    paragraphAnnotations: ParagraphAnnotations[];
    essayLevelAnnotations: L5Annotation[];
  } {
    // ── Deduplicate by content similarity ──
    const seenContent = new Set<string>();

    for (const pa of paragraphAnnotations) {
      pa.annotations = pa.annotations.filter((ann) => {
        const key = ann.content.toLowerCase().substring(0, 100).replace(/\s+/g, ' ');
        if (seenContent.has(key)) {
          return false;
        }
        seenContent.add(key);
        return true;
      });

      // Sort by priority within each paragraph
      pa.annotations.sort((a, b) => a.priority - b.priority);

      // NO cap. NO slice. All annotations the LLM produced are kept.
      // Log density as diagnostic signal.
      if (pa.annotations.length > 4) {
        console.log(
          `[L5] High annotation density at P${pa.paragraphIndex}: ` +
          `${pa.annotations.length} annotations (phase: ${phase.level}). ` +
          `This is diagnostic signal — paragraph may be architecturally rich or troubled.`,
        );
      }
    }

    // ── Essay-level deduplication (no cap) ──
    essayLevelAnnotations = essayLevelAnnotations.filter((ann) => {
      const key = ann.content.toLowerCase().substring(0, 100).replace(/\s+/g, ' ');
      if (seenContent.has(key)) return false;
      seenContent.add(key);
      return true;
    });

    essayLevelAnnotations.sort((a, b) => a.priority - b.priority);

    // NO cap. NO slice. If the LLM produced 5 essay-level annotations,
    // that density is signal about the essay's complexity.

    return { paragraphAnnotations, essayLevelAnnotations };
  }

  // ==========================================================================
  // CROSS-PARAGRAPH ANNOTATIONS
  // ==========================================================================

  /**
   * Generate cross-paragraph annotations after individual paragraph
   * annotation calls complete.
   *
   * Receives all paragraph annotations + full context.
   * Produces 0-3 annotations that span multiple paragraphs —
   * teaching moments that per-paragraph calls cannot capture.
   */
  private async generateCrossParagraphAnnotations(
    paragraphAnnotations: ParagraphAnnotations[],
    profile: Readonly<EssayProfile>,
    phase: ImprovementPhase,
    systemPrompt: string,
    sharedContext: string,
  ): Promise<{
    annotations: L5Annotation[];
    cost: number;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheWriteTokens: number;
    };
  }> {
    // Skip if too few paragraphs for meaningful cross-paragraph patterns
    if (profile.paragraphs.length < 3) {
      return {
        annotations: [],
        cost: 0,
        tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      };
    }

    // Build a summary of paragraph annotations already generated
    const annotationSummary = paragraphAnnotations
      .filter(pa => pa.annotations.length > 0)
      .map(pa =>
        `P${pa.paragraphIndex}:\n` +
        pa.annotations.map(a =>
          `  [${a.teachingMode}] ${a.content.substring(0, 120)}...`,
        ).join('\n'),
      ).join('\n\n');

    // Skip if no annotations were generated (nothing to build on)
    if (!annotationSummary) {
      return {
        annotations: [],
        cost: 0,
        tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      };
    }

    const userPrompt = `${sharedContext}

===

CROSS-PARAGRAPH ANNOTATION REQUEST:

You have already generated per-paragraph annotations (summarized below).
Now identify teaching moments that SPAN PARAGRAPHS — patterns, expectations,
through-line moments that only make sense as a connected sequence.

These are the annotations ONLY YOU can generate. Per-paragraph calls cannot
see the full picture. You can.

ALREADY GENERATED:
${annotationSummary}

Generate 0-3 cross-paragraph annotations. Each must:
- Reference at least 2 paragraphs with specific text quotes from each
- Explain the RELATIONSHIP between the paragraphs that creates the teaching moment
- Use "location" to anchor to the PRIMARY paragraph, "crossParagraphRefs" for others
- Be something a per-paragraph annotation could NOT have captured
- Pass the teaching test: the student cannot see this cross-paragraph pattern on their own

If no cross-paragraph teaching moments exist beyond what individual annotations
already cover, return an empty annotations array. Do not force cross-paragraph
annotations that don't add value.

Output JSON: { "annotations": [...] }`;

    const response: ClaudeResponse<RawParagraphAnnotationOutput> = await callClaude<RawParagraphAnnotationOutput>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: 1500,
        temperature: 0.3,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const cost = calculateCost(response.usage, SONNET);
    console.log(
      `[EssayIntelligence] L5 cross-paragraph: ${response.usage.input_tokens.toLocaleString()} input + ` +
      `${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    // Parse and validate — use a synthetic ParagraphProfile for validation
    const rawOutput = this.parseRawOutput(response.content, -1);

    // Validate each annotation against the actual paragraph it references
    const validAnnotations: L5Annotation[] = [];
    for (const raw of rawOutput) {
      const paraIdx = typeof raw.paragraphIndex === 'number' ? raw.paragraphIndex : 0;
      const targetPara = profile.paragraphs[paraIdx];
      if (!targetPara) continue;

      const validated = this.validateAnnotations([raw], targetPara, phase, profile.paragraphs.length);
      validAnnotations.push(...validated);
    }

    // Filter: cross-paragraph annotations MUST have crossParagraphRefs
    const crossAnns = validAnnotations.filter(a => a.crossParagraphRefs.length > 0);

    return {
      annotations: crossAnns,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private getEssayText(profile: Readonly<EssayProfile>): string {
    return profile.paragraphs.map((p) => p.text).join('\n\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton deep annotation service */
export const deepAnnotationService = new DeepAnnotationService();
export { DeepAnnotationService };
