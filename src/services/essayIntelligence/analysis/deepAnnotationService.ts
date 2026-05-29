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
import { buildFabricationGuardBlock } from '../../../lib/llm/fabricationGuard';
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
import type { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import type { CoachingMap, ImprovementCandidate } from '../profileTypes';
import {
  isCorpusRetrievalEnabledForL5,
  createTelemetry,
  retrieveAnchorMoves,
  buildCorpusMovesBlock,
  estimateBlockTokens,
  detectFabricatedReferences,
  type CorpusRetrievalTelemetry,
} from './corpusRetrievalBlocks';
import { buildCorpusTelemetryRecord, persistCorpusTelemetry } from './corpusTelemetryPersistence';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

/**
 * Stage 2.F (Model sentences + Cut-list) feature flags. Default off; flip on
 * for the Phase 6 regen via env. Independent so each can A/B independently.
 *
 * - `ENABLE_REWRITE_VARIANTS=true` opts priority 1-2 ACTION annotations into
 *   emitting `rewriteVariants` (2-3 candidate revisions per high-priority
 *   annotation). The legacy single `rewriteExample` stays populated either
 *   way (back-compat).
 * - `ENABLE_CUT_LIST=true` opts the per-paragraph L5 prompt into emitting
 *   `cutCandidates[]` (essay-level cut candidates with confidence). Only
 *   ≥0.9-confidence candidates surface to the student; lower confidence
 *   stays in the result for ledger/carry-forward.
 */
function isRewriteVariantsEnabled(): boolean {
  return process.env.ENABLE_REWRITE_VARIANTS === 'true';
}
function isCutListEnabled(): boolean {
  return process.env.ENABLE_CUT_LIST === 'true';
}
/**
 * Stage 2.D (Item 8): per-annotation revisionMode toggle. When on, the LLM
 * picks 'rewrite' vs 'ask' per priority-1-2 ACTION annotation:
 *   - 'rewrite' → existing path (rewriteVariants populated, askPayload null)
 *   - 'ask'     → student writes the revision (rewriteVariants null,
 *                  askPayload populated with questions + principle + exemplars)
 *
 * When flag is off, all eligible annotations default to 'rewrite' — the
 * existing student-visible behavior is preserved byte-for-byte.
 *
 * Pedagogical motivation: always providing the answer trains learned
 * helplessness. 'Ask' mode lets the student build the skill instead of
 * copying. Mutual exclusion is load-bearing — the *system* not solving the
 * problem is what produces the learning effect.
 */
function isRevisionModeAskEnabled(): boolean {
  return process.env.ENABLE_REVISION_MODE_ASK === 'true';
}

/**
 * Stage 2.F: parse the LLM's `rewriteVariants` raw output into a typed array,
 * dropping invalid entries and de-duplicating by angle. Returns null when the
 * annotation is ineligible for variants (non-ACTION mode, priority 3+, flag
 * off, or LLM emitted nothing). Returning null vs an empty array distinguishes
 * "no variants this annotation" from "variants attempted but all dropped" —
 * downstream readers check `=== null` for the legacy single-rewrite path.
 */
function parseRewriteVariants(
  raw: unknown,
  teachingMode: L5TeachingMode,
  priority: number,
): RewriteVariant[] | null {
  if (!isRewriteVariantsEnabled()) return null;
  if (teachingMode !== 'action') return null;
  if (priority > 2) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const validAngles = ['tighten', 'specify', 'sharpen_voice', 'restructure'] as const;
  const byAngle = new Map<RewriteVariant['angle'], RewriteVariant>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;

    const rawAngle = typeof r.angle === 'string' ? r.angle : '';
    if (!validAngles.includes(rawAngle as RewriteVariant['angle'])) continue;
    const angle = rawAngle as RewriteVariant['angle'];

    const text = typeof r.text === 'string' ? r.text.trim() : '';
    if (text.length === 0) continue;

    const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : '';
    const netWordDelta = typeof r.netWordDelta === 'number' ? Math.round(r.netWordDelta) : 0;

    // First-write-wins on angle deduplication.
    if (!byAngle.has(angle)) {
      byAngle.set(angle, { angle, text, rationale, netWordDelta });
    }
  }

  if (byAngle.size === 0) return null;
  return Array.from(byAngle.values());
}

/**
 * Stage 2.D (Item 8): resolve a per-annotation revisionMode from the raw
 * LLM output. Returns null when the annotation is ineligible (non-ACTION,
 * priority 3+) regardless of flag state. When the flag is OFF, eligible
 * annotations default to 'rewrite' so student-visible behavior matches
 * pre-feature shipping. When ON, the LLM's choice is honored; an invalid
 * value coerces to 'rewrite' (safer default).
 */
function resolveRevisionMode(
  raw: unknown,
  teachingMode: L5TeachingMode,
  priority: number,
): 'rewrite' | 'ask' | null {
  if (teachingMode !== 'action') return null;
  if (priority > 2) return null;
  if (!isRevisionModeAskEnabled()) return 'rewrite';
  if (raw === 'ask') return 'ask';
  return 'rewrite';
}

/**
 * Stage 2.D (Item 8): parse the LLM's `askPayload` raw output into a typed
 * shape, dropping invalid entries. Returns null when revisionMode is not
 * 'ask' (mutual exclusion with rewriteVariants), or when the payload is
 * missing required fields. Empty arrays for questions/exemplars OR empty
 * principle string → drop entire payload (no usable signal).
 */
function parseAskPayload(
  raw: unknown,
  revisionMode: 'rewrite' | 'ask' | null,
): AskPayload | null {
  if (revisionMode !== 'ask') return null;
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const questionsRaw = Array.isArray(r.questions) ? r.questions : [];
  const questions = questionsRaw
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .map((q) => q.trim());
  if (questions.length === 0) return null;

  const principle = typeof r.principle === 'string' ? r.principle.trim() : '';
  if (principle.length === 0) return null;

  const exemplarsRaw = Array.isArray(r.exemplars) ? r.exemplars : [];
  const exemplars = exemplarsRaw
    .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
    .map((e) => e.trim());
  // Exemplars optional — empty array is acceptable; principle + questions
  // alone is a valid Socratic payload.

  return { questions, principle, exemplars };
}

/**
 * Stage 2.F: surfacing threshold for the cut-list. Only candidates with
 * confidence ≥ this value render to the student; lower-confidence entries
 * stay in the result for iteration-ledger telemetry.
 */
const CUT_LIST_SURFACE_THRESHOLD = 0.9;

/**
 * Stage 2.F: maximum surfaced cut candidates per essay per plan §0.5 D6
 * decision. When the LLM emits more than this many ≥0.9-confidence cuts,
 * we truncate to the top-N by confidence and log a warning — that scale of
 * cutting belongs in a structural-review directive (Executive Brief), not
 * inline cuts.
 */
const CUT_LIST_MAX_SURFACED = 5;

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

  /**
   * Top-N ranker — whether this annotation is selected for student-facing
   * render. Set by `rankAndSurfaceAnnotations()` after dedup + cross-paragraph
   * merge. Surfaced=false annotations stay in the result for the iteration
   * ledger and carry-forward (Rule 2 — nothing discarded). The render layer
   * filters by this flag.
   *
   * Defaults to `true` so callers that pre-date the ranker still see the full
   * set without behavior change.
   *
   * Design: `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_TOPN_RANKER_DESIGN.md`.
   */
  surfaced: boolean;

  /**
   * Stage 2.F (Model sentences): 2-3 candidate revisions for priority 1-2
   * ACTION-mode annotations, each playing a different editorial angle. The
   * student picks one. `rewriteExample` is kept populated as
   * `rewriteVariants[0].text` for back-compat.
   *
   * Null when:
   *   - The annotation is not ACTION mode.
   *   - The annotation's priority is 3-5 (variants reserved for top-priority).
   *   - The ENABLE_REWRITE_VARIANTS flag is off (variants array is null,
   *     legacy single-rewrite path holds).
   *   - The LLM judged a single rewrite was sufficient.
   *   - revisionMode is 'ask' (mutual exclusion with askPayload).
   */
  rewriteVariants: RewriteVariant[] | null;

  /**
   * Stage 2.D (Item 8): per-annotation editorial mode for priority-1-2
   * ACTION annotations. Two values:
   *
   *   - 'rewrite' — system provides the revision (rewriteVariants
   *                  populated, askPayload null). Existing behavior.
   *   - 'ask'     — student writes the revision (rewriteVariants null,
   *                  askPayload populated with questions + principle +
   *                  exemplars). Pedagogical fix for learned helplessness.
   *
   * Mutually exclusive with rewriteVariants and askPayload — exactly one
   * of those is non-null when revisionMode is non-null. Null for non-
   * ACTION modes, priority 3-5 annotations, or when the flag is off.
   *
   * When ENABLE_REVISION_MODE_ASK is off, all eligible annotations default
   * to 'rewrite' so the student-visible behavior matches pre-feature
   * shipping.
   */
  revisionMode: 'rewrite' | 'ask' | null;

  /**
   * Stage 2.D (Item 8): the "ask" mode payload. Populated only when
   * revisionMode === 'ask'. Null otherwise.
   *
   * Contains the materials the student uses to write their OWN revision:
   *   - questions: 2-3 questions guiding the student's revision
   *   - principle: ≤30-word craft principle the rewrite would honor
   *   - exemplars: 1-2 exemplar phrases (from elsewhere in this essay or
   *                from the corpus) showing the principle in action
   */
  askPayload: AskPayload | null;
}

/**
 * Stage 2.D (Item 8): the 'ask' mode payload. Provided to the student when
 * the L5 LLM judged this annotation needs Socratic-style coaching rather
 * than a rewrite demo. Mutually exclusive with rewriteVariants per the
 * Stage 2 design — exactly one of them is populated when revisionMode is
 * non-null.
 */
export interface AskPayload {
  /** 2-3 questions guiding the student's own revision. */
  questions: string[];
  /** ≤30-word craft principle the rewrite would honor. */
  principle: string;
  /** 1-2 exemplar phrases (essay-internal or corpus) showing the principle. */
  exemplars: string[];
}

/**
 * Stage 2.F: a single candidate revision angle for a priority 1-2 ACTION
 * annotation. Each variant stands alone — the student picks one and ships
 * it. `angle` discriminates which editorial lever the revision pulled.
 */
export interface RewriteVariant {
  /** Which editorial lever this variant pulled. */
  angle: 'tighten' | 'specify' | 'sharpen_voice' | 'restructure';
  /** The candidate revision text. */
  text: string;
  /** One-sentence rationale (≤25 words) — why this angle for this sentence. */
  rationale: string;
  /** Computed: revised word count − original word count (negative = tightening). */
  netWordDelta: number;
}

/**
 * Stage 2.F (Decisive cut-list): a single essay-level deletion candidate
 * with confidence and rationale. Aggregated across per-paragraph L5 calls
 * into `L5AnnotationResult.cutCandidates`. Only entries with confidence ≥
 * `CUT_LIST_SURFACE_THRESHOLD` (0.9) render to the student; lower-confidence
 * entries persist in the result for iteration-ledger telemetry.
 */
export interface CutCandidate {
  /** Stable, locally-unique id (UUID). */
  id: string;
  /** Exact text to delete — must be verbatim from the essay (validator enforces). */
  textToDelete: string;
  /** Location anchor — where in the essay the cut sits. */
  location: {
    paragraphIndex: number;
    sentenceIndex: number;
    /** Sentence-scope = delete the whole sentence; phrase-scope = sub-sentence span. */
    scope: 'sentence' | 'phrase';
  };
  /** 0-1; only ≥`CUT_LIST_SURFACE_THRESHOLD` surface to the student. */
  confidence: number;
  /** Why cut — ≤25 words; what the cut accomplishes. */
  rationale: string;
  /** Which Finding justifies this cut; null when not associated with one. */
  pairedFindingId: string | null;
  /** Which annotation justifies this cut; null when not associated with one. */
  pairedAnnotationId: string | null;
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
  /** Total annotations in the result, surfaced + unsurfaced. */
  annotationCount: number;
  /**
   * Annotations with `surfaced=true` — the student-facing subset.
   * Lock target: 20 ≤ surfacedCount ≤ 30 per essay.
   * Set by `rankAndSurfaceAnnotations()`. When the pool is < 20, all
   * annotations are surfaced and a diagnostic is logged.
   */
  surfacedCount: number;
  /** Density diagnostics per paragraph — signal, not a problem to fix */
  densityDiagnostics: AnnotationDensityDiagnostic[];

  /**
   * Stage 2.F (Decisive cut-list): aggregated cut candidates across all
   * per-paragraph L5 calls. Includes both surfaced (≥0.9 confidence) and
   * sub-threshold entries — the render layer filters by confidence.
   *
   * Empty when the `ENABLE_CUT_LIST` flag is off. The aggregator caps
   * surfaced count to `CUT_LIST_MAX_SURFACED` (5) and logs a warning if
   * the LLM emitted more — that scale of cutting belongs in a
   * structural-review directive, not inline cuts.
   */
  cutCandidates: CutCandidate[];

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
  /** Stage 2.F: candidate revisions for priority 1-2 ACTION annotations. */
  rewriteVariants?: unknown[];
  /** Stage 2.D (Item 8): per-annotation 'rewrite' vs 'ask' toggle. */
  revisionMode?: string;
  /** Stage 2.D (Item 8): the 'ask' mode payload — questions + principle + exemplars. */
  askPayload?: unknown;
}

interface RawCutCandidate {
  textToDelete?: string;
  location?: {
    paragraphIndex?: number;
    sentenceIndex?: number;
    scope?: string;
  };
  confidence?: number;
  rationale?: string;
  pairedFindingId?: string | null;
  pairedAnnotationId?: string | null;
}

interface RawParagraphAnnotationOutput {
  annotations: RawAnnotation[];
  /** Stage 2.F: per-paragraph cut-list emissions. Aggregated essay-wide. */
  cutCandidates?: RawCutCandidate[];
}

// ============================================================================
// COACHING MAP + CANDIDATE LINEAGE RENDERING (Scope 2 Phase 6a)
// ============================================================================

/**
 * Scope 2 Phase 6a: Render the coaching map with candidate lineage for L5.
 *
 * Produces a compact block the LLM can read inside the cached shared
 * context. Each priority carries its consolidatedFrom candidate IDs
 * resolved back to full candidate text so the LLM can write annotations
 * that reference the specific analytical observation behind the priority.
 *
 * If `candidateStore` is undefined (backward-compat callers), the block
 * still renders priorities + supporting sections without lineage — the
 * same content the legacy dead-code `buildSharedContext` produced.
 *
 * Performance: candidate lineage is capped at top 5 candidates per priority
 * to keep the block under ~1.5K tokens even with 7 priorities × 15 candidates.
 * Observation text is truncated to 140 chars per candidate.
 */
function buildCoachingMapContextBlock(
  coachingMap: CoachingMap,
  candidateStore?: ImprovementCandidateStore,
): string {
  const parts: string[] = [];

  // Transformative insight (the single most important framing)
  if (coachingMap.transformativeInsight.insight) {
    parts.push(
      `TRANSFORMATIVE INSIGHT: ${coachingMap.transformativeInsight.insight}\n` +
        `  WHY THIS TRANSFORMS: ${coachingMap.transformativeInsight.whyThisTransforms}` +
        (coachingMap.transformativeInsight.requiresStudentAwareness
          ? '\n  [REQUIRES STUDENT AWARENESS before specific feedback makes sense]'
          : ''),
    );
  }

  // Priorities with candidate lineage
  if (coachingMap.priorities.length > 0) {
    const priorityBlocks = coachingMap.priorities.map((p, i) => {
      const target = p.target.paragraphs.length > 0 ? `P[${p.target.paragraphs.join(',')}]` : 'essay-level';
      const header =
        `PRIORITY ${i + 1} [${p.expectedImpact}] ${target}: ${p.priority}\n` +
        `  Architecture: ${p.architecturalReason}\n` +
        `  Unlocks next: ${p.unlocksNext}`;

      // Resolve consolidatedFrom candidate IDs to full candidate records
      const candidateIds = p.consolidatedFrom ?? [];
      if (candidateIds.length === 0 || !candidateStore) {
        return header;
      }

      const resolved: ImprovementCandidate[] = [];
      for (const id of candidateIds.slice(0, 5)) {
        // cap at 5 per priority
        const candidate = candidateStore.get(id);
        if (candidate) resolved.push(candidate);
      }

      if (resolved.length === 0) return header;

      const lineageLines = resolved.map((c) => {
        const scope = c.sentence != null ? `P${c.paragraph}S${c.sentence}` : `P${c.paragraph}`;
        const obs =
          c.observation.length > 140 ? `${c.observation.slice(0, 139)}…` : c.observation;
        const tech = c.technique ? ` [${c.technique}]` : '';
        return `    • [${c.sourceLayer}|${scope}|${c.coachingValue}]${tech} ${obs}`;
      });

      const moreCount = candidateIds.length > 5 ? ` (+${candidateIds.length - 5} more)` : '';
      return `${header}\n  Consolidated from ${candidateIds.length} candidate(s)${moreCount}:\n${lineageLines.join('\n')}`;
    });

    parts.push(`PRIORITIES:\n${priorityBlocks.join('\n\n')}`);
  }

  // Protected strengths (never damage)
  if (coachingMap.protectedStrengths.length > 0) {
    const strengthLines = coachingMap.protectedStrengths
      .map((s) => {
        const loc = s.locations.length > 0 ? ` @ ${s.locations.map((l) => `P${l.paragraph}`).join(',')}` : '';
        return `  • ${s.description}${loc} — PROTECT because: ${s.whyProtect}`;
      })
      .join('\n');
    parts.push(`PROTECTED STRENGTHS (never damage during improvement):\n${strengthLines}`);
  }

  // Emergent patterns (essay-wide coaching hooks)
  if (coachingMap.emergentPatterns.length > 0) {
    parts.push(
      `EMERGENT PATTERNS (essay-wide coaching hooks):\n` +
        coachingMap.emergentPatterns.map((p) => `  • ${p}`).join('\n'),
    );
  }

  // Score tensions (intra-paragraph dimension mismatches)
  if (coachingMap.scoreTensions.length > 0) {
    parts.push(
      `SCORE TENSIONS (intra-paragraph dimension gaps):\n` +
        coachingMap.scoreTensions.map((t) => `  • ${t}`).join('\n'),
    );
  }

  return parts.join('\n\n');
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
    // Scope 2 Phase 6a: candidate store is the lineage source — L5 uses it
    // to cite the specific candidate that surfaced each improvement when
    // writing teaching annotations. Optional for backward compat with old
    // callers; modern flow passes it from the orchestrator.
    candidateStore?: ImprovementCandidateStore,
    essayId?: string,
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

    // Scope 2 Phase 6a: Append the coaching map + candidate lineage block.
    //
    // Prior bug: the live L5 flow used `buildSharedDigest` which never read
    // `coachingMap` at all, so transformativeInsight, priorities,
    // protectedStrengths, emergentPatterns, and scoreTensions never reached
    // the L5 prompt in production. The legacy `buildSharedContext` method at
    // deepAnnotationService.ts:857 that rendered these WAS dead code (no
    // callers). This augmentation fixes that pre-existing gap AND adds
    // candidate-store lineage so each priority carries the specific candidate
    // IDs L4b consolidated into it.
    const coachingMap = profile.scoreMatrix?.coachingMap;
    if (coachingMap) {
      additionalShared.push(
        `\n=== COACHING MAP (from L4b consolidation) ===\n` +
          buildCoachingMapContextBlock(coachingMap, candidateStore),
      );
    }

    // Scope 1 Phase 2 re-wired: cross-paragraph patterns (previously dead in
    // the live path for the same reason as coachingMap — buildSharedDigest
    // never read them). Re-enabled here.
    const crossPatterns = profile.scoreMatrix?.crossParagraphPatterns ?? [];
    if (crossPatterns.length > 0) {
      additionalShared.push(
        `\n=== CROSS-PARAGRAPH PATTERNS (from L4a score matrix) ===\n` +
          crossPatterns.map((p) => `  • ${p}`).join('\n'),
      );
    }

    if (reanalysisBrief) additionalShared.push(`\n=== REANALYSIS BRIEF ===\n${reanalysisBrief}`);
    if (contradictionFlags && contradictionFlags.length > 0) {
      additionalShared.push(`\n=== CONTRADICTION FLAGS ===\n${contradictionFlags.join('\n')}`);
    }

    // Stage 2.B (Coherence-Resolution): inject L4's terminal-state resolutions
    // so L5 can respect `suppressedSignals` and surface `framed` contradictions
    // with their framing reasoning rather than raw. Both surfaces carry the
    // same array (stamped by the crystallizer); read either.
    const coherenceResolutions =
      profile.northStar?.coherenceResolutions ??
      profile.scoreMatrix?.coherenceResolutions ??
      [];
    if (coherenceResolutions.length > 0) {
      const resolutionLines = coherenceResolutions.map((r) => {
        const suppressed = r.suppressedSignals.length > 0
          ? ` | SUPPRESS: ${r.suppressedSignals.join(', ')}`
          : '';
        const surface = r.surfaceSignals.length > 0
          ? ` | surface: ${r.surfaceSignals.join(', ')}`
          : '';
        return `  • [${r.state.toUpperCase()}] ${r.contradictionId} — ${r.reasoning}${surface}${suppressed}`;
      });
      additionalShared.push(
        `\n=== COHERENCE RESOLUTIONS (from L4) ===\n` +
          `For every contradiction L4 surfaced, it assigned a terminal state. Respect them:\n` +
          `- RESOLVED: do NOT surface the SUPPRESS signals listed below in any annotation.\n` +
          `- FRAMED: if you surface either side, include the resolution's reasoning as framing — never raw.\n` +
          `- ESCALATED: surface as an AWARENESS annotation naming the decision the student must make.\n\n` +
          resolutionLines.join('\n'),
      );
    }

    // Wave-3a Phase 3C: corpus-anchored craft moves — injected once into the
    // shared-context block so each paragraph's annotation call inherits the
    // same growth-target vocabulary. Retrieval keyed on the full essay text
    // surfaces moves most topically relevant to this essay. Stage tag
    // 'feedback'. Feature-flag-gated per-layer, silent-degrade on retrieval
    // error.
    const l5CorpusTel: CorpusRetrievalTelemetry | null = isCorpusRetrievalEnabledForL5()
      ? createTelemetry()
      : null;
    let injectedL5MoveCount = 0;
    if (l5CorpusTel) {
      const corpusRunStart = Date.now();
      const moves = await retrieveAnchorMoves(essayText, profile, l5CorpusTel, 'feedback');
      injectedL5MoveCount = moves.length;
      const movesBlock = buildCorpusMovesBlock(moves);
      if (movesBlock.length > 0) {
        additionalShared.push(`\n${movesBlock}`);
        l5CorpusTel.corpusBlockTokens += estimateBlockTokens(movesBlock);
      }
      l5CorpusTel.totalLatencyMs = Date.now() - corpusRunStart;
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
    // Stage 2.F: per-paragraph cut-list emissions aggregated essay-wide.
    const rawCutCandidates: CutCandidate[] = [];
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
        rawCutCandidates.push(...result.value.cutCandidates);
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

    // ── Top-N ranker — surface 20-30 from the full pool. ──
    // Mutates `surfaced` in place; nothing is deleted (Rule 2).
    const { surfacedCount } = rankAndSurfaceAnnotations(
      allAnnotations.paragraphAnnotations,
      allAnnotations.essayLevelAnnotations,
      crossParagraphAnnotations,
    );

    // Port G2 — Focus Mode. When ENABLE_FOCUS_MODE is set, rank active
    // candidates by ROI and mark all but the top-N with `visible = false`.
    // Full emission stays in the store (Rule 2 — nothing discarded); only
    // the UI read layer filters by this flag. Off by default so UX
    // instrumentation can A/B measure implementation-rate delta before
    // default-on.
    if (process.env.ENABLE_FOCUS_MODE === 'true' && candidateStore) {
      try {
        candidateStore.rankAndApplyFocusMode(phase.level, 3);
      } catch (err) {
        console.error('[L5] G2 rankAndApplyFocusMode failed (non-blocking):', err);
      }
    }

    // Wave-3a Phase 3C/3B: attribution detection — scan all L5 annotation
    // output (paragraph + essay-level + cross-paragraph) for [MOVE-#]
    // references. Annotations are short free-text strings, so serializing
    // the full structure captures everything the LLM wrote.
    if (l5CorpusTel && injectedL5MoveCount > 0) {
      const outputBlob =
        JSON.stringify(allAnnotations.paragraphAnnotations) +
        JSON.stringify(allAnnotations.essayLevelAnnotations) +
        JSON.stringify(crossParagraphAnnotations);
      const { referenced, fabricated } = detectFabricatedReferences(
        outputBlob,
        injectedL5MoveCount,
        0,
      );
      const moveRefs = referenced.filter((r) => r.startsWith('[MOVE-'));
      l5CorpusTel.attribution.movesReferenced += moveRefs.length;
      l5CorpusTel.attribution.fabricatedReferences.push(...fabricated);
      if (fabricated.length > 0) {
        console.warn(`[L5/corpus] Fabricated corpus references detected: ${fabricated.join(', ')}`);
      }
    }

    // Wave-3a Phase 3C/3B: persist corpus telemetry for this L5 run.
    if (l5CorpusTel) {
      const record = buildCorpusTelemetryRecord({
        essayId: essayId ?? 'unknown',
        layer: 'L5',
        telemetry: l5CorpusTel,
      });
      void persistCorpusTelemetry(record);
    }

    // ── Stage 2.F: aggregate + truncate cut-list ──
    // Sort by confidence desc so the top-N-by-confidence truncation surfaces
    // the highest-confidence cuts. Per plan §0.5 D6: warn + truncate to
    // CUT_LIST_MAX_SURFACED when the surfaced count would exceed it. Lower-
    // confidence entries stay in the result for iteration-ledger telemetry.
    const sortedCuts = [...rawCutCandidates].sort((a, b) => b.confidence - a.confidence);
    const surfacedCuts = sortedCuts.filter((c) => c.confidence >= CUT_LIST_SURFACE_THRESHOLD);
    let finalCutCandidates = sortedCuts;
    if (surfacedCuts.length > CUT_LIST_MAX_SURFACED) {
      console.warn(
        `[L5] cut-list emitted ${surfacedCuts.length} ≥${CUT_LIST_SURFACE_THRESHOLD}-confidence candidates ` +
          `(exceeds CUT_LIST_MAX_SURFACED=${CUT_LIST_MAX_SURFACED}). Truncating to top ${CUT_LIST_MAX_SURFACED} by confidence — ` +
          `this scale of cutting belongs in a structural-review directive (Executive Brief), not inline cuts.`,
      );
      const trimmedSurfaced = surfacedCuts.slice(0, CUT_LIST_MAX_SURFACED);
      const subThreshold = sortedCuts.filter((c) => c.confidence < CUT_LIST_SURFACE_THRESHOLD);
      finalCutCandidates = [...trimmedSurfaced, ...subThreshold];
    }
    if (isCutListEnabled()) {
      console.log(
        `[L5] cutCandidates: total=${finalCutCandidates.length} ` +
          `surfaced=${Math.min(surfacedCuts.length, CUT_LIST_MAX_SURFACED)} ` +
          `sub_threshold=${sortedCuts.length - surfacedCuts.length}`,
      );
    }

    return {
      paragraphAnnotations: allAnnotations.paragraphAnnotations,
      essayLevelAnnotations: allAnnotations.essayLevelAnnotations,
      crossParagraphAnnotations,
      phase: phase.level,
      annotationCount,
      surfacedCount,
      densityDiagnostics,
      cutCandidates: finalCutCandidates,
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

    // Stage 2.F: Model sentence variants — only inject directive when the
    // feature flag is on. Off-state keeps the prompt byte-identical to
    // pre-feature so the cached system-prompt prefix stays warm for
    // unrolled-out essays.
    const rewriteVariantsDirective = isRewriteVariantsEnabled()
      ? `MODEL SENTENCE VARIANTS (Stage 2.F):
For ACTION-mode annotations with priority 1 or 2, emit a \`rewriteVariants\` array with 2 or 3 entries. Each variant plays a different editorial angle:
- \`tighten\`: cut words without losing meaning; preserve voice + claim.
- \`specify\`: replace abstract phrases with concrete sensory or factual detail FROM ELSEWHERE IN THE ESSAY (do not invent). Use the fabrication-guard self-audit on every variant.
- \`sharpen_voice\`: rewrite to make the writer's distinctive voice more present; preserve content.
- \`restructure\`: change the sentence's syntactic shape (subordination, fronting, parallelism) for emphasis; preserve content.

You do not need to use all 4 angles — pick the 2-3 most useful for THIS sentence. Each variant must stand alone. Variants must use DISTINCT angles — three "tighten" variants are not three variants, they're one variant emitted three times.

The legacy \`rewriteExample\` field stays populated as the FIRST variant's text (back-compat). For priority 3-5 annotations, emit \`rewriteVariants: null\` and use \`rewriteExample\` alone.

Per-variant schema:
  { "angle": "tighten"|"specify"|"sharpen_voice"|"restructure", "text": "...", "rationale": "≤25 words — why this angle for this sentence", "netWordDelta": <revised_words − original_words> }

Variant length budget: ≤80 words each. Variant array cap: 2 priority-1-2 ACTION annotations per paragraph emit variants; further ACTION annotations in the same paragraph use the single \`rewriteExample\` path.

`
      : '';

    // Stage 2.D (Item 8): 'rewrite' vs 'ask' per-annotation toggle. Only
    // inject directive when flag is on. Off-state preserves byte-identical
    // pre-feature behavior (eligible annotations default to 'rewrite').
    const revisionModeDirective = isRevisionModeAskEnabled()
      ? `REVISION MODE TOGGLE (Stage 2.D):
For each ACTION-mode annotation with priority 1 or 2, you must additionally pick a \`revisionMode\`. The pedagogy is load-bearing — "always providing the answer" trains learned helplessness. Some annotations are better served by inviting the student to write the revision themselves.

Two values, MUTUALLY EXCLUSIVE with the rewriteVariants path:

- \`"revisionMode": "rewrite"\` — system demonstrates. Emit \`rewriteVariants\` per the MODEL SENTENCE VARIANTS contract above. Set \`askPayload: null\`.

- \`"revisionMode": "ask"\` — student writes the revision. Set \`rewriteVariants: null\`. Emit an \`askPayload\` object with:
    { "questions": ["2-3 questions that guide the student to discover the fix themselves"], "principle": "≤30-word craft principle the rewrite would honor", "exemplars": ["1-2 short phrases (essay-internal OR corpus) that show the principle in action — verbatim quotes"] }

PICKING THE MODE — heuristic, not rule:
- Use \`"ask"\` when the student likely has the skill but hasn't applied it here. A question can unlock the revision; a demo would short-circuit learning.
- Use \`"ask"\` when the rewrite would be highly stylistic and the student's voice should drive it.
- Use \`"rewrite"\` when the student lacks the craft vocabulary to find the fix on their own (e.g., they don't yet know what "fronting a subordinate clause for emphasis" looks like).
- Use \`"rewrite"\` for time-sensitive fixes (final-polish phase) where demonstration is faster than discovery.

Distribution sanity (post-emission self-check): if you emitted only "rewrite" across the whole essay, you may have under-used "ask". If you emitted only "ask", the student is probably not yet equipped to revise — bias toward "rewrite".

`
      : '';

    // Stage 2.F: Decisive cut-list — only inject directive when the feature
    // flag is on. Cut candidates are gathered per-paragraph and aggregated
    // essay-wide in the result envelope.
    const cutListDirective = isCutListEnabled()
      ? `DECISIVE CUT-LIST (Stage 2.F — separate from annotations):
Scan THIS paragraph's text for sentences or sub-sentence phrases that should be CUT decisively (not just revised). Emit each candidate to the \`cutCandidates\` field at the top level of your JSON response (sibling to \`annotations\`).

Per-candidate schema:
  {
    "textToDelete": "EXACT verbatim text from the paragraph — the post-call validator rejects any candidate whose textToDelete is not found in the paragraph verbatim",
    "location": { "paragraphIndex": <P index>, "sentenceIndex": <S index>, "scope": "sentence"|"phrase" },
    "confidence": <0.0-1.0> — only emit if ≥0.7; only entries ≥${CUT_LIST_SURFACE_THRESHOLD} will surface to the student,
    "rationale": "≤25 words — what the cut accomplishes",
    "pairedFindingId": "<[F#] reference if associated with a finding>"|null,
    "pairedAnnotationId": null  // post-set if associated with an annotation in this paragraph
  }

Cut-list entries must be GENUINE deletions — the essay reads BETTER with the text gone. If you're unsure, set confidence <${CUT_LIST_SURFACE_THRESHOLD} and let it sit below the surfacing threshold.

Avoid cutting:
- Sentences carrying load-bearing thesis claims.
- Sentences introducing specific narrative pivots.
- Voice signatures the writer has earned (idiomatic phrasings, distinctive sentence shapes).

Bias toward cutting:
- Telling-not-showing summaries that the next sentence already enacts.
- Stage-direction throat-clears ("I want to talk about...", "It is important to note...").
- Filler transitions that don't advance the arc.
- Redundant claims (the second time the writer says the same thing).

When this paragraph has nothing worth cutting at ≥0.7 confidence, emit \`cutCandidates: []\`. Conservative is fine — over-cutting is worse than under-cutting.

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

COHERENCE RESOLUTIONS (Stage 2.B — when present in shared context):
The shared context may include a "COHERENCE RESOLUTIONS" block listing terminal-state outcomes L4 assigned to every detected contradiction. Respect them:
- RESOLVED entries: DO NOT emit any annotation that surfaces a signal listed in that resolution's SUPPRESS list. The losing side of a resolved contradiction is invisible to the student by design.
- FRAMED entries: if your annotation would surface either side of a framed contradiction, include the resolution's reasoning as the annotation's framing — never present one side raw. The reader needs to see the both/and, not a flat assertion.
- ESCALATED entries: surface as AWARENESS-mode annotations that name the decision the student must make. Do not pre-commit the choice for them.

When in doubt about whether an annotation crosses a SUPPRESS signal, prefer not to surface it. Suppressed signals exist because L4 judged their evidence insufficient — re-surfacing them undoes the resolution.

${rewriteVariantsDirective}${revisionModeDirective}${cutListDirective}ANNOTATION STRUCTURE (JSON):
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
      "capacityBuildingNote": "In future writing, watch for moments where you claim an emotion instead of letting the reader feel it through detail."${
        isRewriteVariantsEnabled()
          ? `,
      "rewriteVariants": [
        { "angle": "tighten", "text": "Three-sentence revised version.", "rationale": "≤25 words.", "netWordDelta": -8 },
        { "angle": "specify", "text": "Three-sentence revised version with concrete detail from elsewhere in essay.", "rationale": "≤25 words.", "netWordDelta": 2 }
      ]`
          : ''
      }${
        isRevisionModeAskEnabled()
          ? `,
      "revisionMode": "rewrite" | "ask"  // mutually exclusive with the askPayload/rewriteVariants pairing
      "askPayload": null | { "questions": ["Q1", "Q2"], "principle": "≤30-word craft principle", "exemplars": ["short verbatim phrase"] }`
          : ''
      }
    }
  ]${
    isCutListEnabled()
      ? `,
  "cutCandidates": [
    { "textToDelete": "verbatim sentence or phrase from THIS paragraph", "location": { "paragraphIndex": 2, "sentenceIndex": 4, "scope": "sentence" }, "confidence": 0.92, "rationale": "≤25 words", "pairedFindingId": "[F3]", "pairedAnnotationId": null }
  ]`
      : ''
  }
}

Note: transferablePrinciple is populated POST-CALL by a deterministic technique matcher. Do NOT emit it in your output — it will be overwritten.

QUALITY BAR:
- Priority 1 = most important for this phase. Priority 5 = least important.
- Every annotation must pass the teaching test.
- At least 25% of annotations should be strength type.

OUTPUT: JSON object with "annotations" array${isCutListEnabled() ? ' + "cutCandidates" array' : ''}. No markdown wrapping, no explanation text.

${buildFabricationGuardBlock()}`;
  }

  /**
   * ⚠️ LEGACY — DEAD CODE. Kept in place for Phase 6b deletion reference.
   *
   * The live L5 flow uses `analysisContextBuilder.buildSharedDigest(profile, 'l5')`
   * plus the Phase 6a `buildCoachingMapContextBlock` augmentation (see
   * `generateAnnotations` above). This method has NO callers in the live
   * path — verified by grep sweep during Phase 6a audit.
   *
   * Prior to Phase 6a, this method was believed to be the L5 shared-context
   * builder; Phase 2's "wiring" of emergentPatterns/scoreTensions into L5
   * was added here and therefore never reached production. Phase 6a fixes
   * that latent bug by augmenting the actual live path.
   *
   * DO NOT delete this method yet — Phase 6b deletes it alongside the
   * crystallizer scraper code paths after Phase 8 E2E validates the new
   * flow. Leaving it here preserves the ability to diff-compare the
   * legacy vs live output shapes if Phase 8 reveals a regression.
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
    /** Stage 2.F: cut candidates the LLM emitted for THIS paragraph. */
    cutCandidates: CutCandidate[];
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
        cutCandidates: [],
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

    // C5 (2026-05-04): 3-block caching now actually wired (system + shared
    // digest + per-paragraph tail). The comment block here promised this
    // since the layer was built but only system caching was hooked up —
    // each L5 call paid full input cost on `sharedContext`. With the
    // user-prompt cache breakpoint after sharedContext, paragraph 1 writes
    // the cache (1.25× on ~1800 tokens) and paragraphs 2..N read it (0.1×).
    // Estimated savings: ~$0.05-0.10 per essay × N annotations when L5 is on.
    const relevantSection = paragraphRelevantContext
      ? `${paragraphRelevantContext}\n\n`
      : '';

    const response: ClaudeResponse<RawParagraphAnnotationOutput> = await callClaudeWithRetry<RawParagraphAnnotationOutput>(
      {
        model: SONNET,
        systemPrompt,
        userPromptBlocks: [
          { text: `${sharedContext}\n\n===\n\n`, cacheBreakpoint: true },
          { text: `${relevantSection}TARGET PARAGRAPH ANNOTATION REQUEST:\n\n${paragraphPrompt}` },
        ],
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

    // ── Stage 2.F: parse + validate cutCandidates (flag-gated) ──
    // The parser tolerates missing field (flag-off paragraphs return []);
    // validateCutCandidates additionally rejects anything not verbatim in the
    // paragraph text. Result is per-paragraph; aggregation happens in
    // generateAnnotations across paragraphs.
    let cutCandidates: CutCandidate[] = [];
    if (isCutListEnabled()) {
      const rawCutsContainer = response.content as RawParagraphAnnotationOutput | undefined;
      cutCandidates = this.validateCutCandidates(rawCutsContainer?.cutCandidates, para);
    }

    return {
      paragraphAnnotations: {
        paragraphIndex: para.index,
        annotations: validAnnotations,
      },
      cutCandidates,
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
        // Top-N ranker default: every annotation is surfaced until the
        // ranker decides otherwise. `rankAndSurfaceAnnotations()` flips
        // beyond-Top-N entries to false after dedup + cross-paragraph merge.
        surfaced: true,
        // Stage 2.F: model sentence variants — populated only for priority 1-2
        // ACTION annotations when the flag is on and the LLM emitted distinct
        // angles. Validator drops any variant whose `angle` is unrecognized
        // and de-duplicates by angle so the array carries at most one entry
        // per angle.
        //
        // Stage 2.D (Item 8): rewriteVariants and askPayload are MUTUALLY
        // EXCLUSIVE — when revisionMode='ask', rewriteVariants is null and
        // askPayload is non-null. resolveRevisionMode + parseAskPayload below
        // enforce the dichotomy; this line is overridden in the post-push
        // mutual-exclusion pass to keep the data invariant.
        rewriteVariants: parseRewriteVariants(raw.rewriteVariants, teachingMode, raw.priority ?? 3),
        // Stage 2.D (Item 8): revisionMode + askPayload. resolveRevisionMode
        // returns null for ineligible annotations regardless of flag; when
        // the flag is off, eligible annotations default to 'rewrite' so
        // pre-feature behavior is preserved.
        revisionMode: resolveRevisionMode(raw.revisionMode, teachingMode, raw.priority ?? 3),
        askPayload: null, // set below alongside mutual-exclusion enforcement
      });

      // Stage 2.D (Item 8): mutual-exclusion enforcement. When the LLM picked
      // revisionMode='ask', parse askPayload AND clear rewriteVariants. When
      // 'rewrite' (or null for ineligible), askPayload stays null. If the
      // LLM emitted both populated by accident, the schema invariant wins
      // and rewriteVariants is the canonical demo path.
      const built = valid[valid.length - 1];
      if (built.revisionMode === 'ask') {
        const parsedAsk = parseAskPayload(raw.askPayload, built.revisionMode);
        if (parsedAsk !== null) {
          built.askPayload = parsedAsk;
          built.rewriteVariants = null; // mutual exclusion
        } else {
          // LLM picked 'ask' but emitted no usable payload — fall back to
          // 'rewrite' rather than ship a broken ask. Diagnostic only;
          // rewriteVariants stays as parsed above (possibly null if the
          // LLM didn't emit those either, in which case the annotation
          // surfaces as a CONSEQUENCE-shaped ACTION which the ranker can
          // de-prioritize).
          console.warn(
            `[L5 validateAnnotations] revisionMode='ask' with no usable askPayload at ` +
              `P${built.location.paragraphIndex}S${built.location.sentenceIndex ?? '?'}; ` +
              `falling back to 'rewrite'.`,
          );
          built.revisionMode = 'rewrite';
          built.askPayload = null;
        }
      }
    }

    return valid;
  }

  /**
   * Stage 2.F: validate per-paragraph cutCandidates raw emissions against the
   * paragraph text. Drops any candidate whose `textToDelete` is not verbatim
   * in the paragraph (anti-fabrication code-side guard — the prompt-side
   * fabricationGuard self-audit covers numbers, not arbitrary phrasing).
   * Returns the validated set with stable UUID ids.
   */
  private validateCutCandidates(
    rawCandidates: RawCutCandidate[] | undefined,
    para: Readonly<ParagraphProfile>,
  ): CutCandidate[] {
    if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) return [];

    const validScopes = ['sentence', 'phrase'] as const;
    const valid: CutCandidate[] = [];

    for (const raw of rawCandidates) {
      const textToDelete =
        typeof raw.textToDelete === 'string' ? raw.textToDelete.trim() : '';
      if (textToDelete.length === 0) continue;

      // Anti-fabrication: must be verbatim in the paragraph. Try exact, then
      // case-insensitive (mirrors the spanText match in validateAnnotations).
      let verified: string | null = null;
      if (para.text.includes(textToDelete)) {
        verified = textToDelete;
      } else {
        const lowerPara = para.text.toLowerCase();
        const lowerCut = textToDelete.toLowerCase();
        if (lowerPara.includes(lowerCut)) {
          const idx = lowerPara.indexOf(lowerCut);
          verified = para.text.substring(idx, idx + textToDelete.length);
        }
      }
      if (verified === null) {
        console.warn(
          `[L5 validateCutCandidates] Dropped cut candidate — textToDelete not in P${para.index}: ` +
            `"${textToDelete.slice(0, 80)}..."`,
        );
        continue;
      }

      const confidence =
        typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0;
      if (confidence === 0) continue; // No confidence signal → drop.

      const rationale = typeof raw.rationale === 'string' ? raw.rationale.trim() : '';
      if (rationale.length === 0) continue; // No rationale → drop.

      const rawScope = raw.location?.scope;
      const scope: 'sentence' | 'phrase' = validScopes.includes(rawScope as typeof validScopes[number])
        ? (rawScope as 'sentence' | 'phrase')
        : 'phrase';

      const paragraphIndex =
        typeof raw.location?.paragraphIndex === 'number' ? raw.location.paragraphIndex : para.index;
      const sentenceIndex =
        typeof raw.location?.sentenceIndex === 'number' ? raw.location.sentenceIndex : 0;

      valid.push({
        id: crypto.randomUUID(),
        textToDelete: verified,
        location: { paragraphIndex, sentenceIndex, scope },
        confidence,
        rationale,
        pairedFindingId:
          typeof raw.pairedFindingId === 'string' && raw.pairedFindingId.trim().length > 0
            ? raw.pairedFindingId.trim()
            : null,
        pairedAnnotationId:
          typeof raw.pairedAnnotationId === 'string' && raw.pairedAnnotationId.trim().length > 0
            ? raw.pairedAnnotationId.trim()
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

    const response: ClaudeResponse<RawParagraphAnnotationOutput> = await callClaudeWithRetry<RawParagraphAnnotationOutput>(
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
// TOP-N RANKER — surfaces a curated 20–30 from the full annotation pool
// ============================================================================

/**
 * Lock targets per `CURRENT_STATE.md` L5 + `b32534b` (2026-05-12).
 * Window for student-facing surfaced annotations.
 */
export const L5_SURFACED_TARGET = { min: 20, max: 30 } as const;

/** Number of distinct teachingModes the diversity floor tries to cover. */
const L5_TEACHING_MODE_DIVERSITY_FLOOR = 3;

/**
 * Rank the full annotation pool (paragraph + essay-level + cross-paragraph)
 * and mark a curated 20–30 with `surfaced=true`. Everything else stays in the
 * result with `surfaced=false` — Rule 2 (nothing discarded). Idempotent.
 *
 * Selection (deterministic, no LLM call):
 *   1. Sort the combined pool by `priority` asc (LLM-judged, 1=highest), then
 *      by `confidence` desc as a tiebreak.
 *   2. Floor pass 1 — per-paragraph ACTION coverage. For each paragraph that
 *      has any ACTION-mode annotation with `rewriteExample` in the pool, mark
 *      its top-priority such annotation as required.
 *   3. Floor pass 2 — teachingMode diversity. If the required set covers
 *      fewer than 3 distinct teachingModes and the pool has more, add the
 *      top-priority annotation of each missing mode, capping at 3 modes.
 *   4. Fill pass. Greedy in sorted order, append until 30 are surfaced or the
 *      pool is exhausted.
 *   5. Floor target. If the surfaced set < 20, surface everything (the LLM
 *      under-emitted; hiding good annotations is worse than over-surfacing).
 *
 * Design: `docs/pipeline-evolution/04-pipeline-architecture/L5/L5_TOPN_RANKER_DESIGN.md`.
 */
export function rankAndSurfaceAnnotations(
  paragraphAnnotations: ParagraphAnnotations[],
  essayLevelAnnotations: L5Annotation[],
  crossParagraphAnnotations: L5Annotation[],
): { surfacedCount: number; totalCount: number } {
  const pool: L5Annotation[] = [
    ...paragraphAnnotations.flatMap((pa) => pa.annotations),
    ...essayLevelAnnotations,
    ...crossParagraphAnnotations,
  ];

  // Reset: idempotent if the ranker is re-run after an upstream mutation.
  for (const a of pool) a.surfaced = false;

  if (pool.length === 0) {
    return { surfacedCount: 0, totalCount: 0 };
  }

  // Stable sort: priority asc, confidence desc.
  const sorted = pool
    .map((a, i) => ({ a, i })) // preserve original order for ties beyond confidence
    .sort((x, y) => {
      const dp = x.a.priority - y.a.priority;
      if (dp !== 0) return dp;
      const dc = (y.a.confidence ?? 0) - (x.a.confidence ?? 0);
      if (dc !== 0) return dc;
      return x.i - y.i;
    })
    .map((w) => w.a);

  // ── Floor pass 1: per-paragraph ACTION+rewrite coverage. ──
  const required = new Set<L5Annotation>();
  const seenParagraphAction = new Set<number>();
  for (const a of sorted) {
    if (a.teachingMode !== 'action') continue;
    if (!a.rewriteExample) continue;
    const p = a.location.paragraphIndex;
    if (seenParagraphAction.has(p)) continue;
    seenParagraphAction.add(p);
    required.add(a);
  }

  // ── Floor pass 2: teachingMode diversity (≥3 of 4). ──
  const modesPresent = new Set<L5TeachingMode>();
  for (const a of required) modesPresent.add(a.teachingMode);

  if (modesPresent.size < L5_TEACHING_MODE_DIVERSITY_FLOOR) {
    for (const a of sorted) {
      if (modesPresent.size >= L5_TEACHING_MODE_DIVERSITY_FLOOR) break;
      if (modesPresent.has(a.teachingMode)) continue;
      // Only promote if the mode actually exists in the pool.
      required.add(a);
      modesPresent.add(a.teachingMode);
    }
  }

  // ── Fill pass: greedy by sort order up to max. ──
  const surfaced = new Set<L5Annotation>(required);
  for (const a of sorted) {
    if (surfaced.size >= L5_SURFACED_TARGET.max) break;
    surfaced.add(a);
  }

  // ── Floor target: if under min, surface everything. ──
  if (surfaced.size < L5_SURFACED_TARGET.min) {
    for (const a of sorted) surfaced.add(a);
  }

  for (const a of surfaced) a.surfaced = true;

  const surfacedCount = surfaced.size;
  const totalCount = pool.length;

  // Diagnostic — only fire when out of band on essays large enough to expect
  // a full pool. Phase 6 verification regen reads this signal.
  if (surfacedCount < L5_SURFACED_TARGET.min || surfacedCount > L5_SURFACED_TARGET.max) {
    console.log(
      `[L5/ranker] surfaced=${surfacedCount} pool=${totalCount} — outside target band ` +
        `[${L5_SURFACED_TARGET.min}, ${L5_SURFACED_TARGET.max}]; ` +
        `modes=${Array.from(modesPresent).join(',') || '∅'}; ` +
        `required(action+rewrite+diversity)=${required.size}.`,
    );
  }

  return { surfacedCount, totalCount };
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton deep annotation service */
export const deepAnnotationService = new DeepAnnotationService();
export { DeepAnnotationService };
