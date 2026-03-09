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
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import type {
  EssayProfile,
  ParagraphProfile,
  ImprovementPhase,
  ImprovementPhaseLevel,
  EssayNorthStar,
  ThroughLineMap,
  MomentEarnednessMap,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

/**
 * Phase-specific annotation targets.
 * Count ranges and focus level per improvement phase.
 */
const PHASE_TARGETS: Record<ImprovementPhaseLevel, {
  minPerParagraph: number;
  maxPerParagraph: number;
  essayLevelMin: number;
  essayLevelMax: number;
  focusLevel: string;
  description: string;
}> = {
  foundation: {
    minPerParagraph: 0,
    maxPerParagraph: 1,
    essayLevelMin: 2,
    essayLevelMax: 3,
    focusLevel: 'essay-level',
    description: 'Focus on 2-3 essay-level issues. What is the most important structural problem? If the thesis is unclear, that is issue #1. If the arc does not land, that is the priority. Do NOT mention sentence-level craft or word choices.',
  },
  architecture: {
    minPerParagraph: 0,
    maxPerParagraph: 2,
    essayLevelMin: 0,
    essayLevelMax: 1,
    focusLevel: 'paragraph-level',
    description: 'Focus on 3-5 paragraph-level issues. How well does each paragraph serve its structural role? Are transitions doing their job? Is the pacing right? Show vs tell at the paragraph level is fair game. Do NOT nitpick individual sentences or words.',
  },
  craft: {
    minPerParagraph: 1,
    maxPerParagraph: 3,
    essayLevelMin: 0,
    essayLevelMax: 1,
    focusLevel: 'sentence-level',
    description: 'Focus on 5-8 sentence-level issues. Which sentences are not pulling their weight? Where does the voice waver? Which rhythms clash with the essay\'s dominant cadence? Be specific — cite the sentence, explain WHY it underperforms in its structural context, show a rewrite.',
  },
  polish: {
    minPerParagraph: 1,
    maxPerParagraph: 4,
    essayLevelMin: 0,
    essayLevelMax: 0,
    focusLevel: 'word-level',
    description: 'Focus on 8-12 word-level issues. Which specific words could be sharper? Where could an image be more precise? Which phrases are cliche? Which verbs are passive when they should drive? Be surgical — the structure works, the sentences work, now make every word earn its place.',
  },
  distinction: {
    minPerParagraph: 0,
    maxPerParagraph: 2,
    essayLevelMin: 1,
    essayLevelMax: 2,
    focusLevel: 'memorability',
    description: 'Focus on 3-5 memorability opportunities. What would make an admissions officer remember this essay next week? Where is the essay close to something extraordinary but not quite there? What separates this essay\'s good from unforgettable? Look for the 1% moves.',
  },
};

/** Annotation types for L5 output */
type AnnotationType =
  | 'strength_acknowledgment'
  | 'growth_opportunity'
  | 'structural_note'
  | 'teaching_moment';

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * A single L5 annotation — ephemeral feedback anchored to a location.
 * Never stored in the profile.
 */
export interface L5Annotation {
  /** Unique ID for this annotation */
  id: string;
  /** Location reference */
  location: {
    paragraphIndex: number;
    sentenceIndex: number | null;
    /** Exact text span this annotation references (for highlighting) */
    spanText: string | null;
  };
  /** Annotation classification */
  type: AnnotationType;
  /** The annotation content — specific, essay-architecture-grounded */
  content: string;
  /** WHY this matters — references the essay's architecture, not generic writing advice */
  teachingRationale: string;
  /** How this relates to the essay's through-line/structural role */
  northStarConnection: string;
  /** Priority 1-5 (1=most important for this phase) */
  priority: number;
  /** Which improvement phase this annotation belongs to */
  phase: ImprovementPhaseLevel;
  /** Concrete rewrite suggestion if applicable */
  rewriteExample: string | null;
  /** Confidence in this annotation (0-1) */
  confidence: number;
}

/**
 * Annotations grouped by paragraph.
 */
export interface ParagraphAnnotations {
  paragraphIndex: number;
  annotations: L5Annotation[];
}

/**
 * Re-analysis context passed when L5 runs during re-analysis (not first pass).
 */
export interface ReanalysisBrief {
  /** What changed (human-readable summary) */
  changeSummary: string;
  /** Which paragraphs were edited */
  editedParagraphs: number[];
  /** Student's stated intent if available (from L6 conversation) */
  studentIntent: string | null;
  /** Structural significance of the changed areas */
  structuralSignificance: string | null;
}

/**
 * Complete L5 output — ephemeral, never stored.
 */
export interface L5AnnotationResult {
  paragraphAnnotations: ParagraphAnnotations[];
  essayLevelAnnotations: L5Annotation[];
  phase: ImprovementPhaseLevel;
  annotationCount: number;
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
  content?: string;
  teachingRationale?: string;
  northStarConnection?: string;
  priority?: number;
  phase?: string;
  rewriteExample?: string | null;
  confidence?: number;
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
   */
  async generateAnnotations(
    profile: Readonly<EssayProfile>,
    reanalysisBrief?: ReanalysisBrief,
  ): Promise<L5AnnotationResult> {
    const startTime = Date.now();

    // ── Validate prerequisites ──
    this.validatePrerequisites(profile);

    const phase = profile.index.improvementPhase;
    const phaseTarget = PHASE_TARGETS[phase.level];
    const northStar = profile.northStar;
    const essayText = this.getEssayText(profile);

    // ── Build the cached context blocks ──
    const systemPrompt = this.buildSystemPrompt(phase, phaseTarget);
    const sharedContext = this.buildSharedContext(profile, essayText, northStar, reanalysisBrief);

    // ── Parallel annotation calls per paragraph ──
    const paragraphResults = await Promise.allSettled(
      profile.paragraphs.map((para) =>
        this.annotateParagraph(
          para,
          profile,
          northStar,
          phase,
          phaseTarget,
          systemPrompt,
          sharedContext,
          essayText,
        ),
      ),
    );

    // ── Accumulate results ──
    const paragraphAnnotations: ParagraphAnnotations[] = [];
    let totalCost = 0;
    const totalTokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };

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
        // Log failure but continue — partial results are better than no results
        console.error(
          `[DeepAnnotationService] Paragraph ${i} annotation failed:`,
          result.reason instanceof Error ? result.reason.message : result.reason,
        );
        paragraphAnnotations.push({ paragraphIndex: i, annotations: [] });
      }
    }

    // ── Extract essay-level annotations ──
    // Essay-level annotations come from any paragraph call that generated them
    // (type === 'structural_note' with paragraphIndex === -1 or null)
    // In Foundation and Distinction phases, we also generate dedicated essay-level annotations
    const essayLevelAnnotations = this.extractEssayLevelAnnotations(paragraphAnnotations, phase);

    // ── Deduplicate and prioritize ──
    const allAnnotations = this.deduplicateAndPrioritize(
      paragraphAnnotations,
      essayLevelAnnotations,
      phase,
      phaseTarget,
    );

    const annotationCount = allAnnotations.paragraphAnnotations.reduce(
      (sum, pa) => sum + pa.annotations.length,
      0,
    ) + allAnnotations.essayLevelAnnotations.length;

    return {
      paragraphAnnotations: allAnnotations.paragraphAnnotations,
      essayLevelAnnotations: allAnnotations.essayLevelAnnotations,
      phase: phase.level,
      annotationCount,
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
   */
  private buildSystemPrompt(
    phase: ImprovementPhase,
    phaseTarget: typeof PHASE_TARGETS[ImprovementPhaseLevel],
  ): string {
    return `You are an expert essay feedback engine for college admissions essays. You generate annotations that transform local observations into structurally-grounded teaching moments.

YOUR FUNDAMENTAL PRINCIPLE: Every annotation must explain WHY something matters to the essay's architecture, not just WHAT to fix. You never give generic writing advice. You give advice that could only apply to THIS specific essay because it references THIS essay's structural roles, through-line, and earned-ness architecture.

BANNED PHRASES (never use these without essay-specific architectural reasoning):
- "Consider adding more sensory detail"
- "Show don't tell"
- "Use stronger verbs"
- "Add more specificity"
- "Make this more vivid"
- "Vary your sentence structure"
If you need to surface one of these concepts, you MUST ground it in the essay's architecture: WHY does this paragraph need sensory detail? WHAT does it earn for a later moment? HOW does it serve the structural role?

CURRENT IMPROVEMENT PHASE: ${phase.level}
PHASE FOCUS: ${phaseTarget.focusLevel}
PHASE INSTRUCTIONS: ${phaseTarget.description}
PHASE REASONING: ${phase.reasoning}
FOCUS AREAS: ${phase.focusAreas.join(', ')}
DEFERRED AREAS: ${phase.deferredAreas.join(', ')}

ANNOTATION TYPES:
- strength_acknowledgment: What is working and WHY it serves the architecture. Not just "good job" — explain the structural contribution.
- growth_opportunity: Where improvement would have the highest architectural impact. Frame as opportunity, not deficiency.
- structural_note: How this paragraph/sentence relates to the essay's architecture. Connection to other parts.
- teaching_moment: Deeper understanding of craft that helps the student grow as a writer. WHY this technique matters here.

ANNOTATION STRUCTURE (JSON):
{
  "annotations": [
    {
      "paragraphIndex": 0,
      "sentenceIndex": 2,
      "spanText": "exact text from the paragraph if applicable",
      "type": "growth_opportunity",
      "content": "The annotation text — specific, architecture-grounded",
      "teachingRationale": "WHY this matters to the essay's architecture",
      "northStarConnection": "How this relates to structural role / through-line",
      "priority": 1,
      "phase": "${phase.level}",
      "rewriteExample": "Concrete alternative showing the suggestion in action, or null",
      "confidence": 0.85
    }
  ]
}

STRENGTH DISTRIBUTION: At least 25% of annotations should be strength_acknowledgment type. Students learn better when they understand what is WORKING, not just what needs fixing.

QUALITY BAR:
- Every annotation's teachingRationale must reference the essay's architecture (structural role, through-line involvement, earned-ness, or connection network)
- Every northStarConnection must be specific to THIS essay, not generic
- If you cannot ground an observation in the essay's architecture, do not include it
- Priority 1 = most important for this phase. Priority 5 = least important.

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
    if (profile.connections?.all?.length > 0) {
      const connectionSummary = profile.connections.all
        .slice(0, 20) // Cap to avoid token bloat
        .map((c) => `  [${c.from.join(',')}]→[${c.to.join(',')}] (${c.type}): ${c.description}`)
        .join('\n');
      sections.push(`CONNECTION GRAPH:\n${connectionSummary}`);
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
    phaseTarget: typeof PHASE_TARGETS[ImprovementPhaseLevel],
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
            parts.push(`    Functions: ${s.understanding.observedFunctions.map((f) => f.observation).join('; ')}`);
          }
          return parts.join('\n');
        })
        .join('\n');
      if (sentenceDetails) {
        sections.push(`SENTENCE DETAIL:\n${sentenceDetails}`);
      }
    }

    // ── Phase-specific generation instructions ──
    sections.push(
      `\nGENERATION INSTRUCTIONS:\n` +
      `Generate ${phaseTarget.minPerParagraph}-${phaseTarget.maxPerParagraph} annotations for this paragraph ` +
      `at the ${phaseTarget.focusLevel} level.\n` +
      `Frame EVERY annotation in terms of its STRUCTURAL consequence — not just "fix this" ` +
      `but "fix this because of what it means for the essay's architecture."\n` +
      `Reference the structural role, through-line, and/or earned-ness context above.\n` +
      `Include at least one strength_acknowledgment if the paragraph has genuine strengths.\n` +
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
      lines.push(
        `  P${moment.location.paragraph}S${moment.location.sentence} [${moment.momentType}] — ${earned} (${arrowCount} mechanisms)\n` +
        `    "${moment.description}"\n` +
        `    Mechanisms: ${moment.mechanisms.map((m) => `${m.type} from P${m.location.paragraph}`).join(', ') || 'none'}\n` +
        (moment.gaps.length > 0 ? `    Gaps: ${moment.gaps.join('; ')}` : ''),
      );
    }

    return lines.join('\n');
  }

  private renderReanalysisBrief(brief: ReanalysisBrief): string {
    const lines: string[] = ['RE-ANALYSIS CONTEXT (student recently edited the essay):'];
    lines.push(`  Changes: ${brief.changeSummary}`);
    lines.push(`  Edited Paragraphs: ${brief.editedParagraphs.map((p) => `P${p}`).join(', ')}`);
    if (brief.studentIntent) {
      lines.push(`  Student Intent: ${brief.studentIntent}`);
    }
    if (brief.structuralSignificance) {
      lines.push(`  Structural Significance: ${brief.structuralSignificance}`);
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
      // This paragraph contains a significant moment
      if (moment.location.paragraph === paragraphIndex) {
        const earned = moment.mechanisms.length >= 2;
        relevantMoments.push(
          `This paragraph contains a ${moment.momentType} peak: "${moment.description}" ` +
          `(${earned ? 'EARNED' : 'UNDER-EARNED'} — ${moment.mechanisms.length} earning mechanisms)` +
          (moment.gaps.length > 0 ? `. Gaps: ${moment.gaps.join('; ')}` : ''),
        );
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
  // PER-PARAGRAPH ANNOTATION CALL
  // ==========================================================================

  private async annotateParagraph(
    para: Readonly<ParagraphProfile>,
    profile: Readonly<EssayProfile>,
    northStar: EssayNorthStar,
    phase: ImprovementPhase,
    phaseTarget: typeof PHASE_TARGETS[ImprovementPhaseLevel],
    systemPrompt: string,
    sharedContext: string,
    _essayText: string,
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

    const paragraphPrompt = this.buildParagraphPrompt(
      para,
      profile,
      northStar,
      phase,
      phaseTarget,
    );

    // 3-block caching: system (cached) + shared context (cached) + paragraph-specific (not cached)
    // The Anthropic API caches system prompt when cacheSystemPrompt=true.
    // For the user message, we concatenate shared context + paragraph prompt.
    // The shared context portion will benefit from prompt caching because it's
    // identical across all parallel calls and starts at the same token boundary.
    const userMessage = `${sharedContext}\n\n===\n\nTARGET PARAGRAPH ANNOTATION REQUEST:\n\n${paragraphPrompt}`;

    const response: ClaudeResponse<RawParagraphAnnotationOutput> = await callClaudeWithRetry<RawParagraphAnnotationOutput>(
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

    // ── Parse and validate ──
    const rawOutput = this.parseRawOutput(response.content, para.index);
    const validAnnotations = this.validateAnnotations(rawOutput, para, phase);

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
   * Robust JSON parsing with fallback chain.
   */
  private parseRawOutput(
    content: RawParagraphAnnotationOutput | unknown,
    paragraphIndex: number,
  ): RawAnnotation[] {
    // Case 1: Already parsed as expected shape
    if (
      content &&
      typeof content === 'object' &&
      'annotations' in (content as Record<string, unknown>) &&
      Array.isArray((content as RawParagraphAnnotationOutput).annotations)
    ) {
      return (content as RawParagraphAnnotationOutput).annotations;
    }

    // Case 2: The content IS the array directly
    if (Array.isArray(content)) {
      return content as RawAnnotation[];
    }

    // Case 3: Content is a string (JSON mode sometimes returns stringified JSON)
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed as RawAnnotation[];
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.annotations)) {
          return parsed.annotations as RawAnnotation[];
        }
      } catch {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = (content as string).match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const innerParsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(innerParsed)) return innerParsed as RawAnnotation[];
            if (innerParsed?.annotations) return innerParsed.annotations as RawAnnotation[];
          } catch {
            // Fall through to empty
          }
        }
      }
    }

    console.warn(
      `[DeepAnnotationService] Failed to parse annotations for P${paragraphIndex}. ` +
      `Content type: ${typeof content}`,
    );
    return [];
  }

  /**
   * Validate and transform raw LLM annotations into typed L5Annotation objects.
   */
  private validateAnnotations(
    rawAnnotations: RawAnnotation[],
    para: Readonly<ParagraphProfile>,
    phase: ImprovementPhase,
  ): L5Annotation[] {
    const valid: L5Annotation[] = [];

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

      // ── Validate type ──
      const validTypes: AnnotationType[] = [
        'strength_acknowledgment',
        'growth_opportunity',
        'structural_note',
        'teaching_moment',
      ];
      const annotationType: AnnotationType = validTypes.includes(raw.type as AnnotationType)
        ? (raw.type as AnnotationType)
        : 'teaching_moment';

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
            // Find actual text for the match
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

      // ── Build the annotation ──
      valid.push({
        id: crypto.randomUUID(),
        location: {
          paragraphIndex,
          sentenceIndex,
          spanText,
        },
        type: annotationType,
        content: raw.content.trim(),
        teachingRationale: raw.teachingRationale.trim(),
        northStarConnection: (raw.northStarConnection && typeof raw.northStarConnection === 'string')
          ? raw.northStarConnection.trim()
          : 'Not explicitly connected to North Star',
        priority: typeof raw.priority === 'number'
          ? Math.max(1, Math.min(5, Math.round(raw.priority)))
          : 3,
        phase: annotationPhase,
        rewriteExample: (raw.rewriteExample && typeof raw.rewriteExample === 'string')
          ? raw.rewriteExample.trim()
          : null,
        confidence: typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0.75,
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
        // Promote structural_note annotations that reference essay-wide architecture
        // in Foundation or Distinction phases
        if (
          ann.type === 'structural_note' &&
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
   * Deduplicate and enforce phase-specific annotation count limits.
   */
  private deduplicateAndPrioritize(
    paragraphAnnotations: ParagraphAnnotations[],
    essayLevelAnnotations: L5Annotation[],
    phase: ImprovementPhase,
    phaseTarget: typeof PHASE_TARGETS[ImprovementPhaseLevel],
  ): {
    paragraphAnnotations: ParagraphAnnotations[];
    essayLevelAnnotations: L5Annotation[];
  } {
    // ── Deduplicate by content similarity ──
    // Annotations with very similar content across paragraphs get deduplicated
    const seenContent = new Set<string>();

    for (const pa of paragraphAnnotations) {
      pa.annotations = pa.annotations.filter((ann) => {
        // Create a normalized key from content (first 100 chars, lowercased)
        const key = ann.content.toLowerCase().substring(0, 100).replace(/\s+/g, ' ');
        if (seenContent.has(key)) {
          return false;
        }
        seenContent.add(key);
        return true;
      });

      // Sort by priority within each paragraph
      pa.annotations.sort((a, b) => a.priority - b.priority);

      // Cap per-paragraph count
      if (pa.annotations.length > phaseTarget.maxPerParagraph) {
        pa.annotations = pa.annotations.slice(0, phaseTarget.maxPerParagraph);
      }
    }

    // ── Essay-level deduplication and cap ──
    essayLevelAnnotations = essayLevelAnnotations.filter((ann) => {
      const key = ann.content.toLowerCase().substring(0, 100).replace(/\s+/g, ' ');
      if (seenContent.has(key)) return false;
      seenContent.add(key);
      return true;
    });

    essayLevelAnnotations.sort((a, b) => a.priority - b.priority);

    if (essayLevelAnnotations.length > phaseTarget.essayLevelMax) {
      essayLevelAnnotations = essayLevelAnnotations.slice(0, phaseTarget.essayLevelMax);
    }

    return { paragraphAnnotations, essayLevelAnnotations };
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
