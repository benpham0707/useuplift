/**
 * Essay Intelligence System — Profile Type Definitions (V2)
 *
 * This file defines the complete type system for the EssayProfile: a multi-resolution
 * semantic map that represents the system's understanding of an essay at every
 * granularity level — from holistic thesis down to individual word choices.
 *
 * The profile separates three layers that must never be confused:
 * - Understanding (descriptive): what the essay IS — persistent, deepens every layer
 * - Analysis (evaluative): how well it works — persistent, refined over time
 * - Feedback (prescriptive): what to do about it — EPHEMERAL, generated fresh per context
 *
 * Supersession model: when arrays are updated (e.g., observedFunctions, inferredIntents),
 * the entire array is REPLACED, never appended. This ensures consistency — a later
 * paragraph's walk output that deepens understanding of P1S1 replaces P1S1's
 * observedFunctions array wholesale with a richer set of observations.
 *
 * Consumed by: all essayIntelligence/* modules, profile manager, profile router,
 *              coaching service, edit understanding, annotation pipeline
 *
 * Authoritative spec: docs/plan-sections/01-essay-profile-types.md (1,779 lines)
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

// ============================================================================
// CROSS-FILE TYPE IMPORTS
// ============================================================================
// Phase 1 revision-history types live in ./history/profileSnapshot.ts as
// pure types + extraction + hashing (no profile dependency). We import
// RevisionHistory here because EssayProfile references it below; the full
// surface is re-exported at the bottom of this file for consumer convenience.
import type { RevisionHistory } from './history/profileSnapshot';

// PIQPromptType is imported for ProfileIndex.piqPromptType (Wave-1b pre-req 6).
// Re-exported at the bottom of this file so essayIntelligence consumers can
// import it directly from profileTypes without reaching into the piq service.
import type { PIQPromptType } from '../piq/types';

// ============================================================================
// PHASE 2 — HISTORICAL INTELLIGENCE SIGNALS
// ============================================================================
// These types capture DERIVED cross-session intelligence computed from the
// Phase 1 RevisionHistory chain. They are populated by the coordinator after
// a new snapshot has been written so that coaching prompts can surface
// multi-session trends (addressed findings, persistent craft issues,
// regressions, voice erosion). Zero LLM calls — pure computation over
// existing snapshot + profile state.
//
// Forward declarations: full definitions live below, next to the EssayProfile
// shape they are attached to. Re-exported at the bottom of this file.

/**
 * RevisionIntelligenceSignals — cross-session trend intelligence derived
 * from the RevisionHistory chain PLUS the current profile. Populated by
 * `computeRevisionIntelligence` in `./history/revisionIntelligence.ts`.
 *
 * The top-level object is non-null only when there is SOMETHING to say
 * (history.length >= 2). Individual arrays inside MAY still be empty —
 * an empty array means "no such signal this session," which is a real
 * datum the coach can still use.
 */
export interface RevisionIntelligenceSignals {
  /**
   * Findings whose anchor text appeared in a prior snapshot but is now
   * absent from the current essay text. Treated as "resolved."
   */
  addressedFindings: Array<{
    findingId: string;
    craftCategory: string;
    paragraph: number;
    turnsToAddress: number;
    anchorTextBefore: string;
    anchorTextAfter: string;
  }>;

  /**
   * Findings with the same (craftCategory, paragraph) signature in BOTH
   * a prior snapshot AND the current profile. Matched by category+
   * paragraph (NOT findingId — IDs may be reassigned across sessions).
   */
  persistentFindings: Array<{
    findingId: string;
    craftCategory: string;
    paragraph: number;
    sessionsPersisted: number;
    anchorText: string;
    /**
     * When the finding matched a prior snapshot by (category, anchorText)
     * rather than (category, paragraph) — i.e. the paragraph it sits in
     * has changed. Set to the paragraph index it occupied in the most-
     * recent prior snapshot where it appeared. `undefined` when the match
     * was by (category, paragraph) in place (no move detected).
     */
    movedFromParagraph?: number;
  }>;

  /**
   * Categories that were addressed in an earlier session, absent for one
   * or more snapshots, and have now returned. Signals revision regression.
   */
  regressionEvents: Array<{
    craftCategory: string;
    paragraph: number;
    previouslyAddressedAtSession: number;
    reappearedAtSession: number;
    reasoning: string;
  }>;

  /**
   * A category that appears across >=3 paragraphs in the current profile
   * AND has at least one prior-snapshot appearance (>=2 session signal).
   * Surfaced as a question-framed prompt for the coach.
   */
  patternLevelIssues: Array<{
    craftCategory: string;
    instances: Array<{ paragraph: number; findingId: string }>;
    persistenceSignal: 'new' | 'persistent' | 'regression';
    /** Question-framed prompt. MUST contain '?'. */
    humanFraming: string;
  }>;

  /**
   * Velocity metrics — only populated when there is data to populate.
   * fastestAddress is null iff addressedFindings is empty; similarly for
   * slowestPersisting (persistentFindings empty) and medianTurnsToAddress
   * (addressedFindings empty).
   */
  revisionVelocity: {
    fastestAddress: { findingId: string; craftCategory: string; turns: number } | null;
    slowestPersisting: { findingId: string; craftCategory: string; sessionsUnaddressed: number } | null;
    medianTurnsToAddress: number | null;
  } | null;

  /**
   * 2–4 sentence deterministic summary for coach prompt injection.
   * Empty string when no signals worth surfacing. Sentences end in .?!
   */
  summaryForCoach: string;
}

/**
 * VoiceEvolutionSignals — cross-session voice trajectory derived from
 * VoiceIdentitySnapshot comparisons. Populated by `computeVoiceEvolution`
 * in `./history/voiceEvolution.ts`. Null when history.length < 2.
 *
 * Key use case: detect over-revision (voice erosion from polish) and
 * intentional voice shifts (markers swapped on purpose while register
 * stays controlled).
 */
export interface VoiceEvolutionSignals {
  /** Voice markers present in the most-recent prior snapshot but gone now. */
  markersLostSincePrior: string[];
  /** Voice markers present in the current profile that were not there prior. */
  markersGainedSincePrior: string[];
  /**
   * registerShifts[].length trend across snapshots + current:
   *   - monotonically non-increasing with final < initial → 'improving'
   *   - monotonically non-decreasing with final > initial → 'regressing'
   *   - flat or equal → 'stable'
   *   - non-monotonic → 'unknown'
   */
  registerStabilityTrend: 'improving' | 'stable' | 'regressing' | 'unknown';
  /**
   * vividnessSignal transition from prior to current:
   *   - vivid → flattened = 'flattening'
   *   - flattened → vivid = 'sharpening'
   *   - same value = 'maintained'
   *   - missing signal = 'unknown'
   */
  vividnessTrajectory: 'sharpening' | 'maintained' | 'flattening' | 'unknown';
  /**
   * Over-revision warning — fires ONLY when vividness has been flattening
   * across >=2 consecutive transitions (>=3 snapshots worth of signal).
   * Sticky across calls until vividness recovers. Pre-composed framingForCoach
   * contains '?' so the coach surfaces it as a question.
   */
  overRevisionWarning: {
    triggered: boolean;
    reasoning: string | null;
    framingForCoach: string | null;
  };
  /**
   * Intentional voice shift — markers lost AND gained while register stays
   * stable/improving. Takes precedence over over-revision: intentional shifts
   * should NOT trigger the warning even if vividness dipped during the swap.
   */
  intentionalShift: {
    detected: boolean;
    reasoning: string | null;
  };
  /** 2–4 sentence summary for coach prompt. Empty when nothing worth surfacing. */
  summaryForCoach: string;
}

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

/**
 * The 8 holistic dimensions of essay understanding.
 * Used for cross-dimension entanglements, staleness tracking, and connection classification.
 */
export type HolisticDimension =
  | 'voice'
  | 'emotion'
  | 'theme'
  | 'narrative'
  | 'character'
  | 'craft'
  | 'admissions'
  | 'structure';

/**
 * Holistic section types — matches the `holistic_section_type` DB enum exactly.
 * Used by the Profile Manager for staleness tracking and section-level operations.
 *
 * 10 values: the 7 primary holistic sections + voice_map + moment_earnedness_map
 * + cross_dimension_entanglements.
 */
export type HolisticSectionType =
  | 'voice_identity'
  | 'voice_map'
  | 'emotional_topography'
  | 'moment_earnedness_map'
  | 'thematic_architecture'
  | 'narrative_strategy'
  | 'character_revelation'
  | 'craft_assessment'
  | 'cross_dimension_entanglements'
  | 'admissions_positioning';

/**
 * Essay type classification — drives North Star scaling.
 * Matches the essay_type DB enum.
 */
export type EssayType = 'common_app' | 'supplement' | 'piq';

/**
 * Insight categories — matches the `insight_category` DB enum (8 values).
 * Each maps to specific Profile Manager behavior.
 */
export type InsightCategory =
  | 'confirmation'
  | 'reinterpretation'
  | 'new_context'
  | 'correction'
  | 'preference'
  | 'clarification'
  | 'emotional_reaction'
  | 'resistance';

/**
 * Improvement phase level — drives progressive precision in feedback.
 * Understanding + Analysis always evaluate everything at every level.
 * The phase determines what FEEDBACK surfaces to the student right now.
 */
export type ImprovementPhaseLevel =
  | 'foundation'
  | 'architecture'
  | 'craft'
  | 'polish'
  | 'distinction';

/**
 * CoachingMode — which coaching behavior the system should use for this turn.
 * Detected by ReanalysisOrchestrator based on edit context, iteration depth,
 * and message analysis. Drives prompt block composition in promptBlocks.ts.
 */
export type CoachingMode =
  | 'first_encounter'    // No edits yet, or student is conversing (not revising)
  | 'revision_response'  // Student just revised (recentEditContext present, 1-2 edits to section)
  | 'iteration_deep'     // Same section revised 3+ times
  | 'architecture'       // Structural reorganization (paragraph insert/delete/reorder)
  | 'polish';            // Word-level refinement during polish/distinction phase

/**
 * Profile confidence level — how deep the system's understanding has grown.
 */
export type ConfidenceLevel = 'initial' | 'developing' | 'deep' | 'comprehensive';

/**
 * North Star confidence — includes student confirmation as highest tier.
 */
export type NorthStarConfidence = 'hypothesis' | 'emerging' | 'full' | 'student_confirmed';

/**
 * North Star active scale — driven by essay length.
 * Supplements get 2 dimensions, PIQs get 3, personal statements get all 5.
 */
export type NorthStarScale = 'supplement' | 'piq' | 'personal_statement';

/**
 * Tonal quality — the emotional coloring of the narrator's stance.
 * Not the content's emotion, but HOW the writer positions themselves toward the content.
 */
export type TonalQuality =
  | 'humor'
  | 'irony'
  | 'earnestness'
  | 'irreverence'
  | 'solemnity'
  | 'self_awareness'
  | 'detachment'
  | 'tenderness'
  | 'defiance';

/** The five voice dimensions tracked in VoiceMap */
export type VoiceDimension =
  | 'register'
  | 'vocabulary'
  | 'rhythm'
  | 'perspective'
  | 'tonal_disposition';

/**
 * Types of narrative mechanisms that earn significant moments.
 * 7 types covering emotional, intellectual, and humorous payoffs.
 */
export type EarningMechanismType =
  | 'sensory_grounding'
  | 'emotional_setup'
  | 'stakes_establishment'
  | 'character_revelation'
  | 'thematic_preparation'
  | 'intellectual_scaffolding'
  | 'comedic_subversive_setup';

/**
 * Edit change type — classified with nuance that syntactic analysis cannot achieve.
 */
export type EditChangeType =
  | 'word_refinement'
  | 'meaning_evolution'
  | 'tonal_voice_shift'
  | 'content_expansion'
  | 'content_reduction'
  | 'structural_reorganization';

/**
 * Thematic thread strength.
 */
export type ThreadStrength = 'dominant' | 'supporting' | 'hinted' | 'dropped';

/**
 * Narrative move in the through-line journey.
 */
export type NarrativeMove =
  | 'introduction'
  | 'development'
  | 'submersion'
  | 'resurfacing'
  | 'transformation'
  | 'resolution'
  | 'complication'
  | 'echo';

/**
 * Element type in through-line map.
 */
export type ThroughLineElementType =
  | 'image'
  | 'question'
  | 'tension'
  | 'metaphor'
  | 'relationship'
  | 'idea';

/**
 * Structural role weight — determines edit sensitivity.
 */
export type StructuralWeight = 'load_bearing' | 'supporting' | 'transitional' | 'decorative';

/**
 * Staleness strength — three tiers with bounded propagation.
 */
export type StalenessStrength = 'strong' | 'moderate' | 'weak';

/**
 * Mutation types — 13 values used by the staleness dependency map.
 * Each maps to a set of staleness effects on other profile sections.
 */
export type MutationType =
  | 'sentence_understanding_updated'
  | 'sentence_analysis_updated'
  | 'paragraph_role_updated'
  | 'holistic_section_updated'
  | 'connection_added'
  | 'connection_removed'
  | 'connection_invalidated'
  | 'voice_shift_added'
  | 'voice_shift_removed'
  | 'voice_intentionality_updated'
  | 'earnedness_arrow_added'
  | 'earnedness_arrow_removed'
  | 'north_star_updated'
  | 'conversation_insight_applied'
  | 'sentence_correction_not_found'
  | 'earnedness_deferred';

// ============================================================================
// CONNECTION V2 TYPES — Bidirectional, Strength-Aware Connection Graph
// ============================================================================

/**
 * Functional routing tags — the system's operational view of connections.
 * Answer: "What does the system need to know about this connection
 * to make routing, revalidation, and dispatch decisions?"
 *
 * NOT a taxonomy of what connections mean. That lives in `description`.
 */
export type ConnectionRoutingTag =
  | 'structural'   // Removing/changing one endpoint would break the other
  | 'earning'      // One endpoint sets up or earns the other
  | 'thematic'     // Endpoints share a thematic thread or image system
  | 'contrastive'; // Endpoints create meaning through opposition or tension

/**
 * Connection endpoint — a specific location in the essay.
 */
export interface ConnectionEndpoint {
  /** Paragraph index (0-based) */
  paragraph: number;
  /** Sentence index (0-based). undefined = paragraph-level endpoint */
  sentence?: number;
  /** Brief label for this endpoint in context */
  label: string;
}

/**
 * How meaning flows in the connection.
 */
export type ConnectionDirectionality =
  | 'forward'           // from -> to is the primary meaning direction
  | 'reverse'           // to -> from is the primary meaning direction
  | 'bidirectional'     // both directions carry equal meaning
  | 'asymmetric';       // both carry meaning but unequally (from->to primary)

/**
 * Which layer/step discovered the connection.
 */
export type ConnectionSource =
  | 'scout'             // L2.5 surface-level detection
  | 'walk'              // L3 sequential walk discovery
  | 'holistic_synthesis'// L3.75 full-context discovery
  | 'deep_dive'         // Post-walk targeted investigation
  | 'coaching'          // Student conversation reveals connection
  | 'edit_reanalysis';  // Re-analysis after edit

/**
 * Connection significance category — LLM-assigned based on architectural importance.
 */
export type ConnectionStrengthCategory =
  | 'foundational'  // Essay breaks if this connection is severed
  | 'significant'   // Essay loses something important
  | 'supporting'    // Essay loses a nuance
  | 'tentative';    // Possible echo, not yet confirmed

/**
 * Checkpoint reason — when and why the coordinator saves state.
 */
export type CheckpointReason =
  | 'after_l1_l2'
  | 'after_l3'
  | 'after_l3_75'
  | 'after_l3_5'
  | 'after_l4'
  | 'after_l5'
  | 'conversation_save'
  | 'before_reanalysis'
  | 'circuit_breaker';

// ============================================================================
// CORE BUILDING BLOCKS
// ============================================================================

/**
 * OpenEnum — closed-taxonomy escape hatch (LLM-first doctrine Rule 3).
 *
 * Any field that constrains LLM output to an enumerated set MUST expose a
 * sibling `open: string | null` field so the model can emit a free-text
 * classification when its perception does not fit the enum. This prevents
 * the system from silently hitting the closed-taxonomy ceiling.
 *
 * Usage pattern:
 *   {
 *     symptomType: 'manufactured_vulnerability' | 'generic_insight' | null,
 *     symptomTypeOpen: string | null,  // populated when none of the enum values fit
 *   }
 *
 * The companion `...Open` field is null when the enum classification is confident;
 * populated (and the enum null) when the LLM chooses free-text instead.
 *
 * Enforced by: tests/test-open-escape-hatch.ts (schema validator)
 * Ref: V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4 Pre-req 5
 */

/**
 * KnowledgePatternMatch — a structured cross-reference to an R&D-workshop
 * pattern ID (e.g., from `piq/issuePatterns.ts` or the Common App issue
 * library). Emitted by L3.5 when the analysis recognizes a pattern documented
 * in the knowledge base. The pattern ID + source gives coaching and UI a
 * stable identifier for cross-essay aggregation; `open` is the LLM-first
 * escape hatch for novel patterns the library doesn't name.
 *
 * Populated by: analysisPass.ts (L3.5) after Port B1 lands
 * Consumed by: coachingService (patternId → fix strategy lookup), UI
 * Ref: V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4 Pre-req 1, Port B1
 */
export interface KnowledgePatternMatch {
  /** Pattern library source — expand as new libraries are wired in. */
  source: 'piq' | 'commonApp' | 'narrative' | 'activity' | 'piqAntiPattern';
  /** Stable pattern identifier from the source library (e.g., 'hook_generic_opener'). */
  patternId: string | null;
  /**
   * OpenEnum escape hatch (Wave-1b Pre-req 5). When the LLM recognizes a
   * failure pattern that none of the library entries name, it emits a
   * free-text description in `open` and leaves `patternId` null. Either
   * `patternId` (known) or `open` (novel) must be non-null when the match
   * is emitted; validateAndTransform enforces this.
   */
  open: string | null;
  /**
   * Alias for `open` — retained for backward compat with the Wave-1b seam
   * draft where the field was named `patternOpen`. New callers should prefer
   * `open`. Kept in sync with `open` by validateAndTransform.
   */
  patternOpen: string | null;
  /** LLM confidence in this match (0-1). */
  confidence: number;
  /** Essay text that triggered the match (cognitive forcing function — cite evidence). */
  evidence: string;
  /** Severity of the instance as read in context (library-level severity can be looked up separately). */
  severity: 'minor' | 'major' | 'critical' | null;
}

/**
 * ObservationEntry — the multi-observation unit used everywhere for fields
 * where a single sentence/element can have multiple distinct observations.
 *
 * Supersession model: entire arrays of ObservationEntry are replaced on update,
 * never appended. Back-propagation from later paragraphs replaces the ENTIRE
 * observedFunctions array with a deeper set of observations.
 */
export interface ObservationEntry {
  /** The observation text */
  observation: string;
  /** Confidence in this observation (0-1). Higher = more certain.
   *  REQUIRED — forces the LLM to calibrate certainty, improving downstream filtering. */
  confidence: number;
  /** Text evidence from the essay supporting this observation.
   *  REQUIRED — cognitive forcing function that prevents hallucinated observations.
   *  Every observation must cite specific text from the essay. */
  evidence: string;
}

/**
 * Location reference used throughout the profile for paragraph/sentence positions.
 */
export interface ParagraphLocation {
  paragraph: number;
  sentence?: number;
  sentenceRange?: [number, number];
}

// ============================================================================
// SENTENCE-LEVEL TYPES
// ============================================================================

/**
 * SentenceUnderstanding — descriptive layer: what the sentence IS doing.
 * Populated by L3 understanding walk. Back-propagated as later paragraphs
 * reveal new context about earlier sentences.
 *
 * Supersession model: entire array fields (observedFunctions, inferredIntents,
 * narrativeContributions) are REPLACED on update, never appended.
 */
export interface SentenceUnderstanding {
  /**
   * What the sentence IS doing — can be MULTIPLE things (factual observation).
   * Example: [{observation: "Grounds reader in pawnshop scene through physical action"},
   *           {observation: "Introduces the diamond as the essay's central symbol"}]
   */
  observedFunctions: ObservationEntry[];

  /**
   * What the writer is TRYING to achieve (interpretive).
   * Refined in L6 when the student reveals their actual thinking.
   */
  inferredIntents: ObservationEntry[];

  /**
   * How this sentence advances the narrative — can advance arc + carry thread + set up callback.
   */
  narrativeContributions: ObservationEntry[];

  /** Rhetorical functions: scene-setting, symbol-introduction, argument, etc. */
  rhetoricalFunctions: string[];

  /** How this sentence serves THIS paragraph's goal */
  paragraphContribution: string;

  /** Craft observations for this sentence */
  craft: SentenceCraft;

  /**
   * Notable words/phrases with their significance.
   * No isStrength — evaluation belongs in the analysis layer.
   */
  significantChoices: Array<{
    word: string;
    significance: string;
  }>;

  /** IDs into the centralized connections store */
  connectionRefs: string[];

  /** IDs of findings that reference this sentence (derived from FindingStore, not LLM-produced) */
  findingRefs: string[];

  /** Semantic tags for fast lookup and routing */
  tags: string[];

  /** Phase 0: One-line summary of this sentence's primary architectural function.
   *  Coexists with observation arrays; becomes the replacement in Phase 1+. */
  primaryFunction?: string;
  /** Phase 0: How architecturally significant this sentence is to the essay.
   *  Drives downstream attention allocation. */
  significance?: 'pivotal' | 'contributing' | 'transitional';

  /**
   * Scope 2 Phase 5: Inline improvement candidate emitted by L3 walk alongside
   * the per-sentence understanding. Null for the majority of sentences; the
   * L3 walk prompt explicitly instructs the LLM to emit only when the
   * understanding reveals a concrete localized improvement opportunity.
   *
   * The orchestrator harvests these into the ImprovementCandidateStore after
   * each walk output is applied. The candidate is copied here for
   * checkpoint persistence via applySentenceUnderstanding (mutator handles
   * the optional-field propagation).
   */
  improvementCandidate?: ImprovementCandidate | null;
}

/**
 * RhythmTag — closed enum for sentence rhythm classification.
 *
 * Scope 1 Phase 1 converted this from a free-form prose field to an enum
 * to cut ~50-85 output tokens per sentence while preserving the single
 * downstream consumer at `deepAnnotationService.ts:910` which renders
 * `rhythm=${value}` as a label in the L5 paragraph prompt.
 *
 * Empty string = uncharacterized. Use this for transitional sentences
 * or when the LLM output doesn't match any known tag (parser fallback).
 */
export type RhythmTag =
  | ''
  | 'short_punch'
  | 'medium_flow'
  | 'long_build'
  | 'fragment'
  | 'staccato'
  | 'anaphora_series'
  | 'parallel_build'
  | 'subordinate_delay';

/**
 * SentenceCraft — craft-level observations about a sentence.
 */
export interface SentenceCraft {
  /** Rhythm classification tag (see RhythmTag). Empty for transitional sentences. */
  rhythm: RhythmTag;
  /** Specific craft techniques used */
  techniques: string[];
  /**
   * @deprecated Scope 1 removed `voiceAlignment` — no downstream consumers.
   * Voice alignment is synthesized holistically by L3.75 voiceMap.
   * Field kept optional for backward compat with profiles stored before
   * the change. Writers no longer set it; readers see `undefined`.
   */
  voiceAlignment?: string;
}

/**
 * SentenceAnalysis — evaluative layer: how well the sentence is working.
 * Populated by L3.5 analysis pass (separate API call from understanding).
 * The LLM sees COMPLETE understanding when producing analysis.
 */
export interface SentenceAnalysis {
  /** Effectiveness score (0-100) */
  effectiveness: number;
  /** WHY this effectiveness — references understanding observations */
  effectivenessReasoning: string;
  /** Multiple things can work well */
  strengths: ObservationEntry[];
  /** Multiple issues can exist */
  weaknesses: ObservationEntry[];
  /** Whether this sentence is a strength of the essay */
  isStrength: boolean;
  /** Whether this sentence has a problem that should be addressed */
  isProblem: boolean;
  /** Priority for improvement (0 = fine, 5 = urgent) */
  priorityForImprovement: number;

  /**
   * Scope 2 Phase 5: Inline improvement candidate emitted by L3.5 when the
   * analysis identifies a problem sentence. Populated when `isProblem=true`
   * OR `priorityForImprovement >= 4`. The L3.5 prompt already asks for the
   * fix content inside weakness observations; this field pulls that same
   * content into a structured slot for downstream routing (zero new
   * reasoning burden).
   *
   * Null when isProblem=false AND priorityForImprovement <= 3, or when the
   * LLM chose not to produce a concrete suggestedChange.
   */
  improvementCandidate?: ImprovementCandidate | null;

  /**
   * Wave-1b pre-req (Port B1 seam): structured references to R&D-workshop
   * pattern libraries (PIQ 41-pattern, Common App issue library, etc.) that
   * this sentence triggers. Populated by L3.5 after Port B1 injects the
   * pattern library into the analysis prompt. Sentence-local scope only —
   * architectural-scope matches live on `AnalysisPassOutput.paragraphPatternMatches`.
   * Optional for backward compat; empty array when no library matches.
   */
  patternMatches?: KnowledgePatternMatch[];

  /**
   * Wave-1b pre-req (Port B2 seam): SymptomDiagnoser 29-type classification
   * for structural weaknesses (e.g., 'generic_opener', 'imposed_epiphany').
   * `symptomType` is the enum slot; `symptomTypeOpen` is the LLM-first escape
   * hatch when no enum value fits. See OpenEnum convention above.
   * Both null when the sentence is not a symptom carrier.
   */
  symptomType?: string | null;
  symptomTypeOpen?: string | null;

  /**
   * Port A3 — PIQ 13-dimension rubric scores for this sentence. Populated
   * ONLY when `EssayProfile.index.essayType === 'piq'` (non-PIQ path never
   * emits this field). Keys are `PIQRubricDimension` enum values; values are
   * integer 0-10 per-dimension scores. Only emit for dimensions the sentence
   * meaningfully contributes to — a sentence that doesn't touch a dimension
   * should omit its key rather than emit 0.
   *
   * `piqDimensionsOpen` is the OpenEnum escape hatch per Wave-1b pre-req 5 /
   * LLM-first Rule 3: free-text contribution description for sentences that
   * don't fit the 13-dimension taxonomy cleanly. Both fields are null on
   * non-PIQ paths and for sentences that don't warrant PIQ-scoped scoring.
   *
   * Consumers: L4 crystallizer (ParagraphScoreEntry.piqDimensions aggregate);
   * L5 deepAnnotationService (coaching routes by dimension).
   */
  piqDimensions?: Record<string, number> | null;
  piqDimensionsOpen?: string | null;
}

/**
 * SentenceProfile — per-sentence container for understanding + analysis.
 * Nested under ParagraphProfile.
 */
export interface SentenceProfile {
  /** Sentence index within the paragraph */
  index: number;
  /** The sentence text (populated at load time from essay text, NOT stored in JSONB) */
  text: string;

  /** L3 understanding (descriptive) — null until L3 walk reaches this sentence */
  understanding: SentenceUnderstanding | null;
  /** L3.5 analysis (evaluative) — null until L3.5 pass completes */
  analysis: SentenceAnalysis | null;
}

// ============================================================================
// PARAGRAPH-LEVEL TYPES
// ============================================================================

/**
 * ParagraphUnderstanding — descriptive layer for a paragraph.
 * What this paragraph DOES in the essay.
 */
export interface ParagraphUnderstanding {
  /** What the paragraph does: the core function in the essay's architecture */
  role: string;
  /** What the paragraph is trying to achieve */
  function: string;
  /** How it advances the thesis, serves the emotional arc, carries thematic threads */
  narrativeContribution: string;
  /** Emotional register: dominant emotion, depth, authenticity */
  emotionalRegister: {
    dominantEmotion: string;
    depth: string;
    authenticity: string;
    showVsTell: string;
    strongestMoment: string | null;
  };
  /** Craft profile at paragraph level */
  craftProfile: {
    rhythmPattern: string;
    imageUsage: string;
    voiceConsistency: string;
    standoutMoment: string | null;
  };
}

/**
 * ParagraphAnalysis — evaluative layer for a paragraph.
 * How well this paragraph fulfills its role.
 */
export interface ParagraphAnalysis {
  /** Overall paragraph effectiveness (0-100) */
  effectiveness: number;
  /** Single-sentence assessment */
  verdict: string;
  /** What this paragraph does well */
  strengthSignatures: Array<{
    quality: string;
    evidence: string;
  }>;
  /** Where this paragraph has room to grow */
  growthEdges: Array<{
    quality: string;
    description: string;
  }>;
}

/**
 * ParagraphProfile — per-paragraph container for understanding + analysis + sentences.
 * The paragraph map is the second resolution level of the EssayProfile.
 */
export interface ParagraphProfile {
  /** Paragraph index in the essay */
  index: number;
  /** The paragraph text (populated at load time) */
  text: string;

  /** Tags for routing and lookup */
  tags: string[];

  /** L3 understanding (descriptive) — null until L3 walk reaches this paragraph */
  understanding: ParagraphUnderstanding | null;
  /** L3.5 analysis (evaluative) — null until L3.5 pass completes */
  analysis: ParagraphAnalysis | null;

  /** Sentence-level profiles (ordered by index) */
  sentences: SentenceProfile[];

  /** Walk skip marker if pipeline failed on this paragraph */
  walkSkipped?: WalkSkippedMarker;
}

// ============================================================================
// HOLISTIC SECTION TYPES (8 sections + entanglements)
// ============================================================================

/**
 * VoiceIdentity — holistic voice summary.
 * Describes WHAT the voice sounds like. Complements VoiceMap which describes
 * WHERE the voice lives and HOW it moves.
 *
 * NO consistencyScore — replaced by VoiceMap's spatial, dimensional tracking.
 *
 * DEPTH FIELDS (primaryRegister / authenticity / registerShifts / voiceMarkers /
 * voiceWeaknesses) are the downstream-facing surface — coaching, the audit
 * renderer, and L4 stakes composition read these directly. The legacy fields
 * (register, signature, evolution, distinctivePatterns, authenticVsPerformed)
 * are retained for backward compat with existing consumers (analysisPass,
 * profileRouter, deepAnnotationService) and with profiles persisted before
 * the depth fields were introduced.
 */
export interface VoiceIdentity {
  /** One-paragraph description of the writer's voice */
  signature: string;
  /** Primary register (legacy single-word form — e.g. 'conversational') */
  register: string;
  /** What makes this voice distinctive */
  distinctivePatterns: string[];
  /** How voice evolves through the essay — narrative of voice movement */
  evolution: string;
  /**
   * Moments that feel genuinely the writer's vs. moments that feel performed.
   * Location is [paragraph, sentence].
   */
  authenticVsPerformed: Array<{
    location: [number, number];
    assessment: 'authentic' | 'performed';
    reasoning: string;
  }>;

  // ── Depth fields (voice identity depth expansion) ────────────────────────
  // Optional so legacy profiles persisted before these fields existed still
  // typecheck. The L3.75 Phase A prompt produces them; downstream consumers
  // (coaching, L4 stakes, audit render) prefer these over legacy fields.

  /**
   * Primary register as a compound descriptor — e.g. "contemplative-technical",
   * "earnest-ironic", "lyrical-reportorial". Two adjectives is the sweet spot:
   * captures the voice's DNA without collapsing to a single vague word.
   */
  primaryRegister?: string;

  /**
   * Authenticity signal: a short phrase (≤8 words) naming what reads genuine
   * about the voice, OR null when the voice reads uniformly performed. Example
   * phrases: "specificity of concrete nouns", "self-correction mid-sentence".
   *
   * Also used by coachingPlanner as a coarse authenticity level string
   * ("high" | "moderate" | "low") in legacy profiles — accept either shape.
   */
  authenticity?: string | null;

  /**
   * Compatibility alias for renderers that expect a single-word level.
   * Optional — produced by Phase A when the audit renderer needs a coarse tag.
   */
  authenticityLevel?: string;

  /**
   * Register shifts — paragraph-level register changes with the driver.
   * Populated even when the shift is unintentional. Complements VoiceMap.shifts
   * by offering a coaching-facing summary (register ONLY, not all 5 dimensions)
   * with an explicit driver the coach can name to the student.
   */
  registerShifts?: Array<{
    paragraph: number;
    from: string;
    to: string;
    driver: string;
  }>;

  /**
   * Distinctive linguistic tics — the positive side of voice. Examples:
   * "em-dash pivots", "rhetorical questions before reflections",
   * "fragmentary lists when emotion rises". Load-bearing for coaching:
   * these become the things the student should PROTECT on revision.
   */
  voiceMarkers?: string[];

  /**
   * Voice weaknesses — the negative side of voice. Specific linguistic
   * reaches-for: "defaults to 'captivated' when emotion is abstract",
   * "falls into philosophical abstraction in closings". Coaching uses these
   * verbatim in stakes: "your voice reaches for X when Y — P2 is an instance."
   */
  voiceWeaknesses?: string[];

  /**
   * Legacy tolerance: read by crossDomainValidation as a free-text claim about
   * consistency. Not produced by the current Phase A prompt; present on the
   * type so existing validators continue to compile.
   */
  consistency?: string;
}

/**
 * VoiceMap — five-dimensional tracking of voice across the essay.
 *
 * NOT a replacement for VoiceIdentity. VoiceIdentity describes WHAT the voice is
 * (holistic summary). VoiceMap describes WHERE the voice is and HOW it moves
 * (structured spatial map). They complement each other.
 *
 * Dimensions are spatial: observations per passage location.
 */
export interface VoiceMap {
  /** Register: formality and distance — the most audible dimension */
  register: VoiceMapDimension;
  /** Vocabulary Fingerprint: recurring word families, domain-specific vocabulary */
  vocabularyFingerprint: VoiceMapDimensionWithDomains;
  /** Sentence Rhythm: cadence patterns */
  sentenceRhythm: VoiceMapDimension;
  /** Perspective and Distance: how close the narrator stands to events */
  perspectiveDistance: VoiceMapDimension;
  /** Tonal Disposition: emotional coloring of the narrator's stance */
  tonalDisposition: VoiceMapDimensionWithQualities;

  /** Passages where voice holds steady — characterizes the voice in stable regions */
  stabilityRegions: Array<{
    paragraphs: number[];
    voiceCharacter: string;
  }>;

  /** Recorded voice shifts — where one or more voice dimensions change */
  shifts: VoiceShift[];

  /**
   * Code-switching events — language/register shifts with cultural roots.
   *
   * @deprecated Scope 1 Phase 2 — removed from the L3.75 Phase A prompt because
   * no downstream consumer reads beyond length-checks. Kept optional for
   * backward compat with profiles persisted before Phase 2. New profiles
   * emit `undefined` (or empty array via the coercer); legacy profiles
   * still carry populated entries but those entries are ignored by the
   * pipeline. Genuine language/register shifts are now captured as
   * `shifts[]` entries instead.
   */
  codeSwitching?: CodeSwitchEvent[];
}

/** Base voice map dimension with baseline and observations */
export interface VoiceMapDimension {
  /** The essay's dominant characteristic for this dimension */
  baseline: string;
  /** Per-passage observations where this dimension is notable or shifts */
  observations: VoiceObservation[];
}

/** Voice map dimension with domain tracking (vocabulary fingerprint) */
export interface VoiceMapDimensionWithDomains extends VoiceMapDimension {
  /** Specific vocabulary domains identified */
  domains: Array<{
    domain: string;
    exampleWords: string[];
    paragraphs: number[];
  }>;
}

/** Voice map dimension with tonal quality tracking */
export interface VoiceMapDimensionWithQualities extends VoiceMapDimension {
  /** Dominant tonal qualities detected across the essay */
  dominantQualities: TonalQuality[];
}

/**
 * VoiceObservation — a single observation about voice at a specific location.
 */
export interface VoiceObservation {
  /** Which passage this observation covers */
  location: {
    paragraph: number;
    sentenceRange?: [number, number];
  };
  /** What the voice is doing at this location */
  observation: string;
  /** Which dimension(s) this observation primarily concerns */
  dimensions: VoiceDimension[];
}

/**
 * VoiceShift — a recorded voice shift with intentionality assessment.
 * The intentionality assessment is the map's most critical annotation:
 * it determines whether the shift is a strength (intentional variation)
 * or a weakness (unintentional drift).
 */
export interface VoiceShift {
  /** Where the shift occurs */
  location: {
    paragraph: number;
    sentence?: number;
    boundary: 'paragraph_boundary' | 'mid_paragraph' | 'sentence_boundary';
  };
  /** Which dimensions shift */
  dimensions: VoiceDimension[];
  /** Description of what voice was before */
  fromDescription: string;
  /** Description of what voice became */
  toDescription: string;
  /**
   * Intentionality assessment — the critical distinction.
   * Below 0.6 confidence, present as question to student, not assertion.
   */
  intentionality: {
    assessment: 'intentional' | 'unintentional' | 'ambiguous';
    confidence: number;
    reasoning: string;
  };
  /** What the shift serves (for intentional shifts) */
  servesFunction?: string;
  /** Cross-dimension entanglement reference if this shift IS a thematic/emotional move */
  entanglementRef?: string;
}

/**
 * CodeSwitchEvent — a language/register shift with cultural roots.
 * Tracked separately because code-switching carries cultural weight that
 * generic "voice shift" notation cannot capture.
 */
export interface CodeSwitchEvent {
  location: { paragraph: number; sentence: number };
  /** The language or register being switched to */
  language: string;
  /** What triggered the switch */
  trigger: string;
  /** The cultural function the switch serves */
  culturalFunction: string;
  /** Text of the code-switched passage */
  text: string;
}

/**
 * EmotionalTopography — maps the essay's emotional landscape.
 * NO isEarned — replaced by MomentEarnednessMap's backward-tracing network.
 */
export interface EmotionalTopography {
  /** The essay's emotional arc — how emotion moves from opening to close */
  arcTrajectory: string;
  /** Peak emotional moments — WHAT and WHERE */
  peakMoments: Array<{
    location: [number, number];
    emotion: string;
    intensity: 'low' | 'moderate' | 'high' | 'peak';
  }>;
  /** Undertones — emotions felt but not stated */
  undertones: string[];
  /** How emotion shifts paragraph to paragraph */
  emotionalProgression: Array<{
    paragraph: number;
    register: string;
    shift: string;
  }>;
  /** Show vs tell assessment — where emotions are embodied vs asserted */
  showVsTell: Array<{
    location: [number, number];
    assessment: 'shown' | 'told' | 'mixed';
    detail: string;
  }>;
  /** Overall authenticity assessment — where emotions feel genuine vs performed.
   *  Critical for admissions essay coaching: performed emotion is an AO red flag. */
  authenticityAssessment: string;
}

/**
 * MomentEarnednessMap — backward-tracing network for significant moments.
 *
 * For each significant moment in the essay (emotional, intellectual, humorous),
 * traces backward through the narrative to identify specific earlier passages
 * that make it work (or the specific gaps that make it fall flat).
 *
 * Uses arrow networks, not booleans. The DENSITY of arrows is the diagnosis:
 * many arrows converging = well-earned, sparse arrows = unearned.
 */
export interface MomentEarnednessMap {
  /**
   * Each significant moment with its backward-tracing network.
   * "Significant" is determined by L3.75 holistic synthesis.
   */
  moments: EarnedMoment[];

  /**
   * Essay-level summary of earned-ness patterns.
   * NOT a score — a structural observation about the essay's setup-payoff architecture.
   */
  structuralObservation: string;
}

/**
 * EarnedMoment — a single significant moment with its earned-ness network.
 */
export interface EarnedMoment {
  /** Where the moment occurs */
  location: { paragraph: number; sentence: number };
  /** What kind of moment this is */
  momentType: 'emotional' | 'intellectual' | 'humorous' | 'subversive';
  /** Description of the moment */
  description: string;
  /** The emotion, idea, or effect the moment carries */
  payload: string;
  /**
   * The narrative mechanisms that earn this moment.
   * DENSITY of this array is the diagnosis: many = well-earned, few = unearned.
   */
  mechanisms: EarningMechanism[];
  /**
   * What is MISSING when the moment is unearned.
   * Populated when mechanisms array is sparse — identifies the gap.
   */
  gaps: string[];
}

/**
 * EarningMechanism — a specific earlier passage that contributes to
 * a significant moment's impact.
 */
export interface EarningMechanism {
  /** The type of narrative work this passage does for the moment */
  type: EarningMechanismType;
  /** Where the earning passage is */
  location: ParagraphLocation;
  /** How this passage contributes to the moment's impact */
  contribution: string;
  /** Connection reference if this mechanism corresponds to a tracked connection */
  connectionRef?: string;
}

/**
 * ThematicArchitecture — central thesis, threads, subtext, contradictions.
 */
export interface ThematicArchitecture {
  /** The essay's central thesis (may evolve through layers) */
  centralThesis: string;
  /** How confident the system is in the thesis reading (0-1) */
  thesisConfidence: number;
  /** How the thesis emerges and crystallizes through the essay */
  thesisEvolution: string;
  /** Thematic threads with paragraph spans */
  threads: Array<{
    thread: string;
    introducedAt: { paragraph: number; sentence?: number };
    appearances: Array<{ paragraph: number; sentence?: number }>;
    strength: ThreadStrength;
  }>;
  /** Subtext — implied but never stated */
  subtext: string;
  /** Productive contradictions/tensions that drive the essay */
  contradictions: string[];
}

/**
 * NarrativeStrategy — primary strategy, pivot points, pacing, structural choices.
 */
export interface NarrativeStrategy {
  /** The primary narrative strategy and WHY it serves this story */
  primaryStrategy: string;
  /** Rationale for this strategy */
  strategyRationale: string;
  /** Pivot points in the narrative */
  pivotPoints: Array<{
    location: { paragraph: number; sentence?: number };
    description: string;
  }>;
  /** Pacing analysis */
  pacingAnalysis: string;
  /** Structural choices and their effects */
  structuralChoices: string[];
  /** The type of narrative arc: chronological, reflective, bracket, montage, etc. */
  arcType: string;
  /** Current arc momentum — is the essay building toward something, sustaining, or stalling? */
  arcMomentum: 'building' | 'sustaining' | 'releasing' | 'stalling';
  /** The essay's turning point / fulcrum — null if no clear pivot exists.
   *  Used by L4 North Star for structural roles and by readiness scoring. */
  turningPoint: { paragraph: number; sentence: number } | null;
}

/**
 * CharacterRevelation — who the writer is behind the words.
 */
export interface CharacterRevelation {
  /** Who is this writer (the person behind the words) */
  writerPortrait: string;
  /** The original essay-only portrait before coaching revelations enriched it.
   *  Preserved so cross-layer comparison remains possible. */
  essayOnlyPortrait?: string;
  /** Values revealed — shown, not told */
  valuesRevealed: string[];
  /** Growth arc detected in the essay */
  growthArc: string;
  /** Intellectual fingerprint — how this person thinks */
  intellectualFingerprint: string;
  /** Blind spots they might not see */
  blindSpots: string[];
  /** Qualities the writer reveals through the essay — distinct from values.
   *  Values = what they believe. Qualities = how they show up (resilient, curious, empathetic).
   *  Used by admissions positioning and portfolio strategy. */
  revealedQualities: string[];
}

/**
 * CraftAssessment — strength signatures, growth edges, image system, patterns.
 */
export interface CraftAssessment {
  /** Strength signatures with evidence */
  strengthSignatures: Array<{
    quality: string;
    evidence: string;
    paragraphs: number[];
  }>;
  /** Growth edges with reasoning */
  growthEdges: Array<{
    quality: string;
    description: string;
    paragraphs: number[];
    /**
     * Scope 2 Phase 5: Optional architectural fix the L3.75 synthesis paired
     * with this growth edge. L3.75 has the full-essay holistic view, so it
     * can name technique + architectural reasoning that L3's per-sentence
     * walk cannot. Null when the edge is descriptive-only with no clear fix.
     *
     * When populated, the orchestrator harvests this into the
     * ImprovementCandidateStore as an L3.75-sourced candidate.
     */
    pairedImprovement?: {
      /** TECHNIQUE_VOCABULARY entry or null when no standard technique applies */
      technique: string | null;
      /** One-sentence action the student should take */
      directive: string;
      /** Why this matters to the essay's architecture specifically */
      architecturalReason: string;
      /** 1-2 sentence sketch of the improved version, or null */
      demonstrationSketch: string | null;
      /** Magnitude of the impact if applied */
      expectedImpact: 'transformative' | 'significant' | 'incremental';
    } | null;
  }>;
  /** Image/metaphor system analysis */
  imageSystem: string;
  /** Sentence-level patterns */
  sentencePatterns: string;
  /** Word-level patterns */
  wordPatterns: string;
}

/**
 * CrossDimensionEntanglement — moments where 2+ dimensions intersect meaningfully.
 *
 * Sits as the 8th holistic section. NOT redundant with individual dimension sections.
 * Each dimension section describes what that dimension does in isolation.
 * Entanglements describe what happens at the INTERSECTION.
 *
 * Entanglements are the evidence layer that the distinctiveness signature synthesizes from.
 * Staleness cascades from entanglements to distinctiveness, not the reverse.
 */
export interface CrossDimensionEntanglement {
  /** Unique ID for reference from other sections (e.g., distinctiveness signature) */
  id: string;
  /** The dimensions that intersect at this moment */
  dimensions: HolisticDimension[];
  /** Where in the essay this entanglement occurs */
  location: ParagraphLocation;
  /** Description of the entanglement — what happens at the intersection */
  description: string;
  /** Which dimension sections this entanglement should be cross-referenced in */
  crossRefs: HolisticDimension[];
  /** How important this entanglement is to the essay's meaning.
   *  Foundational = core to what makes the essay work. Supporting = enriches.
   *  Subtle = present but not load-bearing. Used by L4 distinctiveness and L5 annotations. */
  significance: 'foundational' | 'supporting' | 'subtle';
}

/**
 * AdmissionsPositioning — how this essay positions the student for admissions.
 */
export interface AdmissionsPositioning {
  /** 30-second AO pitch */
  tellabilitySummary: string;
  /** What makes this essay distinctive for admissions */
  distinctivenessFactors: string[];
  /** Institutional fit signals */
  institutionalFit: string;
  /** Red flags for admissions readers */
  redFlags: string[];
  /** Memorability assessment */
  memorability: string;
  /** How this essay positions within a portfolio */
  portfolioPosition: string;
  /** AO takeaway — what an admissions officer would think after reading this essay (from L3.5 analysis) */
  aoTakeaway: string;
  /** Essay archetype classification — what "genre" this essay falls into from an AO's pattern-matching perspective */
  archetypeContext?: {
    /** The archetype name: "sports injury comeback", "immigrant identity", "music as life metaphor", etc. */
    archetype: string;
    /** How common this archetype is in the applicant pool */
    poolDensity: 'saturated' | 'common' | 'moderate' | 'uncommon' | 'rare';
    /** What makes THIS essay's execution non-generic within the archetype, or null if generic */
    differentiator: string | null;
  };
}

// ============================================================================
// NORTH STAR TYPES (architecture of meaning — replaces EssayDNA)
// ============================================================================

/**
 * EssayNorthStar — the architecture of meaning.
 *
 * Five conceptual dimensions that together describe HOW the essay means,
 * not what it says or how well. Built progressively through layers.
 *
 * Scaled by essay length:
 * - Supplements (<250 words): 2 dims (structuralRolesMap + distinctivenessSignature)
 * - PIQs (~350 words): 3 dims (+ trajectory)
 * - Personal statements (~650 words): all 5 dims
 */
export interface EssayNorthStar {
  /** Which dimensions are active for this essay (driven by essay length) */
  activeScale: NorthStarScale;

  /**
   * DIMENSION 1: Through-Line Map (personal statements only — null for supplements and PIQs).
   * Traces the essay's central element where it surfaces, submerges, transforms, resolves.
   * CRITICAL: This is INTERPRETATION, not data. Connection graph = raw data,
   * through-line map = meaning interpretation.
   */
  throughLineMap: ThroughLineMap | null;

  /**
   * DIMENSION 2: Structural Roles Map (all essay types).
   * What each section IS in the architecture of meaning — structural necessity, not topic.
   */
  structuralRolesMap: StructuralRole[];

  /**
   * DIMENSION 3: Trajectory & Potential (PIQs and personal statements — null for supplements).
   * Where the essay IS and where it COULD go — MULTIPLE plausible paths.
   */
  trajectory: EssayTrajectory | null;

  /**
   * DIMENSION 4: Distinctiveness Signature (all essay types).
   * What makes this essay NON-INTERCHANGEABLE.
   * READS FROM entanglements — entanglements are evidence, distinctiveness is synthesis.
   */
  distinctivenessSignature: DistinctivenessSignature;

  /**
   * DIMENSION 5: Intent Bridge (personal statements only — null for supplements and PIQs).
   * Student's stated understanding alongside the system's.
   * Populated primarily through L6 conversation.
   */
  intentBridge: IntentBridge | null;

  /** Confidence level of the North Star overall */
  confidence: NorthStarConfidence;
  /** Which layer last updated the North Star */
  lastUpdatedBy: string;
  /** Version/changelog tracking for re-crystallization (present after version >= 2) */
  evolution?: NorthStarEvolution;
}

/**
 * ThroughLineMap — traces the essay's central element through the narrative.
 */
export interface ThroughLineMap {
  /** The central element being traced */
  centralElement: string;
  /** What kind of element it is */
  elementType: ThroughLineElementType;
  /** The transformation the element undergoes — the MEANING journey */
  transformation: string;
  /** Where the element surfaces, submerges, transforms across the essay */
  journey: Array<{
    location: { paragraph: number; sentence?: number };
    /** What the element means at this point in the journey */
    meaningAtPoint: string;
    /** What narrative move happens to the element here */
    narrativeMove: NarrativeMove;
  }>;
  /** Connection references from the connection graph that constitute this through-line */
  connectionRefs: string[];
}

/**
 * StructuralRole — what a section IS in the architecture of meaning.
 */
export interface StructuralRole {
  /** Which paragraph(s) this role covers (often 1, can span multiple) */
  paragraphs: number[];
  /** The structural role: "frame_of_risk", "value_system", "fulcrum", "resolution", etc. */
  role: string;
  /** WHY this role matters to the essay's architecture */
  significance: string;
  /** How load-bearing this section is — determines edit sensitivity */
  weight: StructuralWeight;
}

/**
 * EssayTrajectory — where the essay IS and where it COULD go.
 * Always presents MULTIPLE plausible paths. The student decides, the system maps options.
 */
export interface EssayTrajectory {
  /** Current state assessment */
  currentState: string;
  /**
   * Multiple plausible paths the essay could take from here.
   * ALWAYS plural — the student decides, the system maps options.
   */
  plausiblePaths: Array<{
    description: string;
    /** How much the current text supports this path (not how "good" it would be) */
    textSupport: 'strong' | 'moderate' | 'speculative';
    /** What would need to change or be added to realize this path */
    requirements: string[];
  }>;
  /** Unrealized connections — things the text contains that could be threaded more deeply */
  unrealizedConnections: Array<{
    description: string;
    locations: Array<[number, number]>;
  }>;
}

/**
 * DistinctivenessSignature — what makes this essay non-interchangeable.
 */
export interface DistinctivenessSignature {
  /** The core distinctiveness articulation — one paragraph, not a label */
  articulation: string;
  /** The entanglement references this distinctiveness draws from */
  entanglementRefs: string[];
  /** What makes it non-interchangeable — specific, not categorical */
  nonInterchangeableFactors: string[];
}

/**
 * IntentBridge — student's stated understanding alongside the system's.
 */
export interface IntentBridge {
  /** What the student says the essay is about / trying to do */
  studentIntent: string | null;
  /** What the system reads the essay as doing */
  systemReading: string;
  /** How they align or diverge — the divergence is coaching fuel */
  alignments: Array<{
    aspect: string;
    alignment: 'confirmed' | 'partial' | 'divergent' | 'student_unaware';
    detail: string;
  }>;
  /** Session insights that informed the bridge — traceable to specific conversations */
  sourceInsightIds: string[];
}

// ============================================================================
// CONNECTIONS TYPES
// ============================================================================

/**
 * ProfileConnections (V2) — the connection graph.
 * Bidirectional, strength-aware network that serves as the essay's architectural map.
 *
 * Append-only with status tracking (Rule 2: never discard paid output).
 * Querying active connections means filtering to `status === 'active'`.
 */
export interface ProfileConnections {
  /** All connections — append-only with status tracking */
  all: Connection[];

  /**
   * LLM-generated prose describing the essay's overall connection architecture.
   * Updated after each layer that discovers connections.
   */
  graphSummary: string;

  /**
   * Paragraphs with no strong connections in or out.
   * System-computed from graph structure (not LLM judgment).
   */
  structuralIslands: number[];

  /** Image/metaphor recurrences across paragraphs */
  imageRecurrences: Array<{
    image: string;
    locations: Array<[number, number]>;
  }>;
  /** Narrative arc map: which sentences play which arc role */
  narrativeArcMap: Array<{
    role: string;
    location: [number, number];
  }>;
  /** Redundancies and gaps */
  redundancies: Array<{
    paragraphs: number[];
    overlappingContent: string;
  }>;
}

/**
 * Connection (V2) — a single relationship between two passages in the essay.
 *
 * Bidirectional: the connection has a primary direction (from -> to)
 * and describes what each endpoint means to the other.
 *
 * The LLM describes connections freely; the system adds routing tags.
 * No fixed taxonomy of connection types — that lives in `description`.
 */
export interface Connection {
  /** Unique connection ID */
  id: string;

  /** Primary endpoint — where the connection originates or is first visible */
  from: ConnectionEndpoint;

  /** Secondary endpoint — where the connection lands or becomes visible */
  to: ConnectionEndpoint;

  /**
   * LLM-written description of what connects these passages.
   * No category constraint — the LLM expresses freely.
   */
  description: string;

  /**
   * What this connection reveals about the FROM endpoint (reverse illumination).
   * null if the connection is primarily one-directional.
   */
  reverseIllumination: string | null;

  /**
   * Functional routing tags — what the system needs to know operationally.
   * Multiple tags allowed (a connection can be both structural and thematic).
   */
  routingTags: ConnectionRoutingTag[];

  /**
   * LLM's assessment of how important this connection is to the essay's
   * architecture of meaning. Prose, not a score.
   */
  significance: string;

  /**
   * Strength category for UI display and edit triage.
   * LLM-assigned based on significance assessment.
   */
  strengthCategory: ConnectionStrengthCategory;

  /**
   * How meaning flows — LLM specifies per instance.
   */
  directionality: ConnectionDirectionality;

  /** Which layer/step discovered this connection */
  discoveredBy: ConnectionSource;

  /** Connection status — system bookkeeping */
  status: 'active' | 'invalidated' | 'under_review' | 'superseded';

  /** If invalidated, why and when */
  invalidation?: {
    reason: string;
    invalidatedAt: string;
    trigger: string;  // 'edit_P3', 'coaching_correction', etc.
  };

  /** Finding IDs this connection is related to */
  relatedFindings: string[];

  /** ISO timestamp */
  createdAt: string;
}

// ============================================================================
// CONVERSATION INSIGHT TYPES
// ============================================================================

/**
 * ConversationInsight (V2) — a single piece of understanding extracted from
 * a student's message during L6 coaching.
 *
 * The taxonomy is layered: primary category drives mechanical behavior (Profile Manager),
 * secondary attributes drive nuanced response (coach adaptation).
 *
 * 8 categories and 4 durability levels.
 */
export interface ConversationInsight {
  /** Unique ID */
  id: string;
  /** When extracted */
  timestamp: string;
  /** The student's original words that produced this insight */
  sourceText: string;

  // -- PRIMARY CATEGORY (drives Profile Manager action) --
  category: InsightCategory;

  // -- SECONDARY ATTRIBUTES (modulates nuance) --

  /** Emotional valence of the insight */
  emotionalValence: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** How confident the student seems in what they're saying */
  studentConfidence: 'high' | 'moderate' | 'low' | 'uncertain';
  /** How explicitly the insight was stated */
  explicitness: 'explicit' | 'implicit' | 'inferred';
  /** How certain we are about the scope */
  scopeCertainty: 'high' | 'moderate' | 'low';
  /** How novel this insight is relative to existing understanding */
  novelty: 'high' | 'moderate' | 'low';

  // -- SCOPE (probability distribution, not point estimate) --
  scope: InsightScope;

  // -- SUPERSESSION --
  /**
   * Partial supersession support. The original is marked as partially superseded,
   * preserving confirmed portions while revising the framing.
   */
  partiallySupersedes?: {
    insightId: string;
    confirmedPortion: string;
    revisedPortion: string;
  };

  // -- DURABILITY --
  /**
   * How long this insight survives changes to the essay.
   * - ephemeral: tied to specific text, invalidated by edits to that text
   * - draft_durable: survives minor edits, invalidated by structural rewrites
   * - essay_durable: persists as long as this essay is being worked on
   * - student_durable: persists across ALL essays (copied to user-level store)
   */
  durability: 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable';

  /** Which essay version this insight was generated against */
  essayVersion: number;
}

/**
 * InsightScope — scope as a probability distribution across the essay's hierarchy.
 * Supports multi-scope insights (e.g., connecting two paragraphs).
 */
export interface InsightScope {
  /** Probability this insight applies to the entire essay */
  essayProbability: number;
  /** Paragraph-level probabilities */
  paragraphs: Array<{ index: number; probability: number }>;
  /** Sentence-level probabilities */
  sentences: Array<{ paragraph: number; sentence: number; probability: number }>;
}

/**
 * PatternInsight — meta-observations about the coaching process.
 * Stored separately so they inform coaching strategy without polluting the essay profile.
 */
export interface PatternInsight {
  id: string;
  /** Description of the observed pattern */
  pattern: string;
  /** Specific instances that constitute the pattern */
  evidence: string[];
  /** What this means for coaching strategy */
  implication: string;
  /** Timestamps */
  firstObservedAt: string;
  lastObservedAt: string;
  /** Number of instances that constitute this pattern */
  instanceCount: number;
}

// ============================================================================
// EDIT UNDERSTANDING TYPES
// ============================================================================

/**
 * EditDiff — mechanical pre-processing output. What physically changed
 * between two versions. No judgment, no significance assessment.
 */
export interface EditDiff {
  /** Essay-level structural changes */
  structural: {
    paragraphsAdded: number[];
    paragraphsRemoved: number[];
    paragraphsReordered: boolean;
    paragraphDelta: number;
  };
  /** Per-paragraph changes */
  paragraphChanges: Array<{
    paragraphIndex: number;
    changeType: 'modified' | 'added' | 'removed';
    sentenceChanges: Array<{
      sentenceIndex: number;
      changeType: 'modified' | 'added' | 'removed' | 'unchanged';
      oldText?: string;
      newText?: string;
      wordDiff?: Array<{
        type: 'added' | 'removed' | 'unchanged';
        text: string;
      }>;
    }>;
  }>;
  /** Summary statistics */
  stats: {
    totalSentencesChanged: number;
    totalWordsChanged: number;
    changeRatio: number;
  };
}

/**
 * EditUnderstanding — the LLM's nuanced reading of what an edit means
 * in the context of the essay's profile.
 */
export interface EditUnderstanding {
  /** How significant is this change (nuanced, not just word count) */
  significance: 'minor' | 'moderate' | 'significant' | 'transformative';
  /** Reasoning behind significance assessment */
  significanceReasoning: string;
  /** What kind of change is this */
  changeType: EditChangeType;
  /** Apparent purpose — the LLM infers likely intent (tentative, confirmable by student) */
  apparentPurpose: string;
  /** Confidence in the apparent purpose (0-1) */
  purposeConfidence: number;
  /** How this change maps to the profile */
  profileImpact: {
    directImpact: string;
    connectionImpact: Array<{
      connectionId: string;
      effect: 'altered' | 'strengthened' | 'weakened' | 'broken' | 'unchanged';
      reasoning: string;
    }>;
    paragraphImpact: string | null;
    holisticImpact: string | null;
  };
  /** Recommended analysis scope */
  scopeRecommendation: {
    scope: 'sentence_update' | 'paragraph_reanalysis' | 'targeted_holistic_refresh' | 'comprehensive';
    reasoning: string;
    targets?: string[];
  };
}

/**
 * VersionRecord — accumulated changes between two analysis points.
 * NOT a rollback backup — a running change log with intent annotations.
 */
export interface VersionRecord {
  /** Version identifier (incremented at each analysis checkpoint) */
  version: number;
  /** Essay text at this version's analysis checkpoint */
  snapshotText: string;
  /** Timestamp of the analysis checkpoint */
  analyzedAt: string;
  /** All changes that occurred between the previous version and this one */
  changes: Array<{
    timestamp: string;
    location: { paragraph: number; sentence?: number };
    oldText: string;
    newText: string;
    understanding?: EditUnderstanding;
    intentAnnotation?: string;
  }>;
  /** Conversation insights collected since the previous version (insight IDs) */
  insightsSinceLastVersion: string[];
  /** Light-touch adjustments applied during this version */
  lightTouchAdjustments: Array<{
    field: string;
    adjustment: string;
    source: 'conversation' | 'edit_workshop';
  }>;
  /** Serialized staleness accumulator at analysis checkpoint (Set<string> → string[]) */
  accumulatedStaleness?: {
    strongStale: string[];
    moderateStale: string[];
    weakStale: string[];
    totalEdits: number;
    transformativeCount: number;
    significantCount: number;
    moderateCount: number;
  };
  /** W9.1: Editing approaches tracked during this version (optional — backward compatible) */
  approaches?: EditApproach[];
  /** W9.2: Detected edit strategy pattern for this version (optional — backward compatible) */
  editStrategy?: EditStrategyPattern | null;
}

// ============================================================================
// IMPROVEMENT PHASE
// ============================================================================

/**
 * ImprovementPhase — drives progressive precision in feedback.
 * Understanding + Analysis always evaluate everything at every level.
 * The phase determines what FEEDBACK surfaces to the student right now.
 *
 * Computed from L3.5 analysis results. Stored in ProfileIndex so every
 * subsequent call (L5 annotations, L6 coaching) knows the zoom level.
 * Re-computed after every re-analysis (phase can shift up OR down).
 */
export interface ImprovementPhase {
  level: ImprovementPhaseLevel;
  /** LLM-generated reasoning for why this phase was chosen */
  reasoning: string;
  /** Specific things to address at this level */
  focusAreas: string[];
  /** Things that exist but aren't worth surfacing yet */
  deferredAreas: string[];

  /** LLM prose readiness assessment (replaces numeric readiness) */
  readinessAssessment: string;

  /** Deterministic lookup from level — for backward-compat logging only */
  legacyReadiness: {
    essayLevel: number;
    paragraphLevel: number;
    sentenceLevel: number;
    wordLevel: number;
  };

  /**
   * Per-dimension phase assessments. LLM selects which dimensions are relevant
   * for THIS essay and assesses each independently.
   */
  dimensionPhases: Array<{
    dimension: string;
    level: ImprovementPhaseLevel;
    reasoning: string;
    coachingApproach: string;
  }>;

  /** 2-4 sentence coaching directive injected into L5/L6 prompts */
  coachingLens: string;

  /**
   * Phase transition detection (null on first analysis).
   * When priorPhase is provided, Sonnet assesses whether the shift is genuine.
   */
  transition: {
    priorLevel: ImprovementPhaseLevel;
    isGenuineShift: boolean;
    transitionReasoning: string;
  } | null;

  /**
   * W3.4: Whether this phase is near a boundary.
   * When true, the phase could change with small improvements.
   */
  nearBoundary?: boolean;
}

// ============================================================================
// PROFILE INDEX (compact table of contents — always loaded)
// ============================================================================

/**
 * ProfileIndex — compact (~250-350 token) table of contents.
 * ALWAYS loaded into every API call. Tells the AI what understanding EXISTS
 * without requiring it to read the full profile.
 */
export interface ProfileIndex {
  /** Essay length summary */
  essayLength: { paragraphs: number; sentences: number; words: number };
  /** How deep the system's understanding has grown */
  confidenceLevel: ConfidenceLevel;

  /** Global topics present in the essay */
  topicTags: string[];

  /** One-liner per paragraph — scannable */
  paragraphDigest: Array<{
    index: number;
    roleSummary: string;
    tags: string[];
    themes: string[];
    sentenceCount: number;
    hasStrengths: boolean;
    hasWeaknesses: boolean;
    connectionCount: number;
    improvementPriority: number;
  }>;

  /** Approximate token count per profile section (for token budgeting) */
  sectionTokenCounts: {
    voiceIdentity: number;
    voiceMap: number;
    emotionalTopography: number;
    momentEarnednessMap: number;
    thematicArchitecture: number;
    narrativeStrategy: number;
    characterRevelation: number;
    craftAssessment: number;
    entanglements: number;
    admissionsPositioning: number;
    northStar: number;
    connections: number;
    paragraphs: number[];
  };

  /** Connection graph summary — compact view for LLM context */
  connectionGraph: Array<{
    id: string;
    from: { paragraph: number; sentence?: number };
    to: { paragraph: number; sentence?: number };
    routingTags: ConnectionRoutingTag[];
    strengthCategory: ConnectionStrengthCategory;
    status: 'active' | 'invalidated' | 'under_review' | 'superseded';
  }>;

  /** Compact North Star summary — structural significance without full North Star */
  northStarSummary: {
    throughLineSummary: string | null;
    structuralRoles: Array<{
      paragraphIndex: number;
      role: string;
      significance: 'load_bearing' | 'supporting' | 'transitional';
    }>;
    maturity: 'absent' | 'sketch' | 'emerging' | 'full';
  };

  /** Staleness tracking — which sections need refreshing */
  stalenessSnapshot: {
    strongStale: string[];
    moderateStale: string[];
    weakStale: string[];
    lastChangeAt: string | null;
  };

  /** Active concerns — what needs attention */
  activeConcerns: Array<{
    location: [number, number | null];
    concern: string;
    severity: 'critical' | 'significant' | 'minor';
  }>;

  /** Improvement phase — determines feedback zoom level */
  improvementPhase: ImprovementPhase;

  /** Number of full analysis passes completed (drives comprehensive→focused transition) */
  fullAnalysisCount: number;
  /** Timestamp of last comprehensive analysis */
  lastComprehensiveAt: string | null;

  /**
   * Phase 1.5 (Doctrine Operationalization): Signals that the profile was loaded
   * from a legacy persisted state without an `improvementCandidateSnapshot`, AND
   * the one-shot migration in `profileMigration.ts` found no source data to
   * reshape into the new candidate store. Callers (coaching service, UI) should
   * surface an explicit re-analysis prompt rather than silently proceeding with
   * degraded behavior. See FORGE_PLAN_ARTIFACTS.md Section 2.
   *
   * Set by: `EssayProfileCoordinator.fromCheckpoint()` when it catches
   *   `PipelineError.noMigrationSource` from the migration function.
   * Read by: `coachingService.processCoachingTurn()` gate check, which throws
   *   `CoachingBlockedError.requiresReanalysis(...)` if true.
   * Never set: by fresh analysis runs — fresh runs with empty candidate stores
   *   throw `PipelineError.emptyCandidateStore(...)` instead (real bug, not
   *   legacy migration).
   */
  requiresReanalysis?: boolean;

  /** W1.1: Compact finding summary for context routing (computed from FindingStore) */
  findingSummary?: {
    totalActive: number;
    byMaturity: Partial<Record<FindingMaturity, number>>;
    topFindings: Array<{
      id: string;
      claim: string;
      maturity: FindingMaturity;
      coachingValue: FindingCoachingValue;
    }>;
  };

  /**
   * Wave-1b pre-req 2 (Port F2 seam): essay-level AI-authoring risk signal
   * produced by the `aiRiskScorer` runtime utility. Lives on ProfileIndex
   * (not on L1 output) because it is an essay-level property, not a per-
   * paragraph observation. Null until Port F2 enables the scorer; populated
   * at analysis start and re-computed on substantive edits.
   *
   * Consumed by: coaching (surface AI-authoring concerns), UI (authenticity
   *   panel), L3.5 calibration (elevated risk tightens the anti-fabrication
   *   guard from Port G1).
   */
  aiRiskSignal?: {
    score: number;
    notes: string;
    confidence: number;
  } | null;

  /**
   * Wave-1b pre-req 6 (Port A3 dependency): UC PIQ prompt discriminator.
   * Populated at analysis start via `detectPIQType()` in
   * `src/services/piq/prompts/promptMetadata.ts` when the essay is a PIQ.
   * Null for Common App, supplemental, and other non-PIQ essays.
   *
   * Downstream ports (A3, Port 11) route PIQ-specific rubric weights and
   * teaching examples based on this field. Without it, those ports would
   * inject the wrong weights for 7 of 8 PIQs.
   */
  piqPromptType?: PIQPromptType | null;
}

// ============================================================================
// THE ROOT TYPE: EssayProfile
// ============================================================================

/**
 * EssayProfile — the complete multi-resolution semantic map of an essay.
 *
 * Organized into four resolution levels:
 * 1. Holistic (essay-level understanding + analysis)
 * 2. North Star (architecture of meaning — emergent synthesis)
 * 3. Paragraph (per-paragraph understanding + analysis)
 * 4. Sentence (per-sentence understanding + analysis, nested under paragraphs)
 *
 * Plus cross-cutting structures:
 * - Connections (centralized, single source of truth)
 * - Cross-dimension entanglements (the 8th holistic section)
 * - Voice map (five-dimensional spatial tracking)
 * - Moment earned-ness map (backward-tracing network)
 * - Edit understanding (version tracking + change comprehension)
 * - Conversation insights (L6-sourced student revelations)
 *
 * The profile separates three layers that must never be confused:
 * - Understanding (descriptive): what the essay IS — persistent, deepens every layer
 * - Analysis (evaluative): how well it works — persistent, refined over time
 * - Feedback (prescriptive): what to do about it — EPHEMERAL, generated fresh per context
 */

// ============================================================================
// ESSAY UNDERSTANDING (Gap 1 — Synthesized Narrative)
// ============================================================================

/**
 * EssayUnderstanding — the system's developing understanding of the WHOLE essay.
 *
 * Rich prose that reads like expert literary analysis. Grows with each pass.
 * This is NOT a summary of the 10 holistic sections. It's the ARGUMENT the
 * system would make about this essay if asked "what do you see?" — synthesized,
 * opinionated, grounded in specific text.
 *
 * The holistic sections remain the structured breakdown. The understanding
 * prose is the synthesized narrative — derived from them, not replacing them.
 */
export interface EssayUnderstanding {
  /**
   * The system's developing understanding of the WHOLE essay.
   * Rich prose — reads like expert literary analysis.
   * Grows with each pass: initial synthesis ~300 words,
   * after deep dives ~500 words, after coaching ~700 words.
   *
   * Reads as a complete, current narrative each time (REPLACEMENT, not append).
   */
  prose: string;

  /**
   * The essay's central tension — what drives it, whether
   * the writer knows it or not. NOT the thesis. The tension.
   * Updated as understanding deepens.
   */
  centralTension: string;

  /**
   * Things the system is confident about.
   * Persist across runs unless explicitly superseded.
   */
  confirmedInsights: string[];

  /**
   * Tentative readings that need more evidence.
   * May be confirmed, superseded, or acknowledged as ambiguous.
   */
  activeHypotheses: string[];

  /**
   * How deep the system has gone.
   * LLM-assessed — NOT a formula from finding maturities.
   * 'initial' = first walk only
   * 'developing' = walk + some deep dives
   * 'deep' = multiple growth cycles, most questions answered
   * 'comprehensive' = deep dives exhausted, coaching integrated
   * 'exhaustive' = student edits analyzed, re-analysis complete
   */
  maturity: 'initial' | 'developing' | 'deep' | 'comprehensive' | 'exhaustive';

  /**
   * How understanding evolved — each entry records what changed and why.
   */
  growthLog: Array<{
    timestamp: string;
    trigger: 'walk' | 'deep_dive' | 'coaching' | 'edit' | 'coherence_check';
    whatChanged: string;
  }>;
}

/**
 * Structured student context — parsed from the flat contextAccumulation string.
 * Enables writing prompt generation with specific names, places, and moments.
 */
export interface StructuredStudentContext {
  /** People mentioned — names + relationship to student */
  people: Array<{ name: string; relationship: string; firstMentionedTurn: number }>;
  /** Physical places with sensory potential */
  places: Array<{ place: string; sensoryDetail?: string; firstMentionedTurn: number }>;
  /** Specific moments with narrative weight */
  moments: Array<{ moment: string; emotionalWeight?: string; firstMentionedTurn: number }>;
  /** Concrete details that could anchor writing prompts */
  concreteDetails: Array<{ detail: string; firstMentionedTurn: number }>;
}

// ============================================================================
// IMPROVEMENT CANDIDATE TYPES (Scope 2 — defined in Phase 1.5 for migration)
//
// The types below are the shared contract between Phase 1.5's migration
// function, Phase 4's ImprovementCandidateStore class, Phase 5's inline
// candidate emission from L3/L3.5/L3.75, and Phase 6's L4 consolidation +
// L5 materialization. Phase 1.5 needs the types defined so profileMigration.ts
// can reference them; Phase 4 implements the runtime store class against
// these types; later phases add the lifecycle transitions and read paths.
//
// See FORGE_PLAN_UNIFIED.md "Shared types" for the canonical definitions
// and FORGE_PLAN_SCOPE2.md for the lifecycle rules.
// ============================================================================

/**
 * ImprovementCandidate — a prescriptive improvement emitted by an analysis
 * layer (L3 walk, L3.5 analysis pass, L3.75 holistic synthesis) alongside
 * its descriptive observations. L4 later consolidates duplicates into
 * CoachingMap.priorities; L5 materializes consolidated targets with required
 * rewriteExample; the manifest projection finalizes them into ImprovementEntry.
 *
 * Lifecycle:
 *   candidate (just emitted) → consolidated (L4 absorbed it into a priority)
 *   → finalized (L5 materialized it with a rewrite) OR superseded (a later
 *   candidate dominated this one).
 */
export interface ImprovementCandidate {
  /** Deterministic ID: e.g., `CAND_L3_P2S4_a3f7` */
  id: string;
  /** Which analysis layer emitted this candidate */
  sourceLayer: 'L3' | 'L3.5' | 'L3.75';
  /** 0-based paragraph index; -1 for essay-level candidates */
  paragraph: number;
  /** 0-based sentence index within the paragraph, or null for paragraph-scope */
  sentence: number | null;
  /** ID of the Finding that motivated this candidate (for lineage), or null */
  sourceFindingId: string | null;
  /** What the analysis layer observed (descriptive, evidence-backed) */
  observation: string;
  /** What the student should DO about it (prescriptive — the whole point) */
  suggestedChange: string;
  /** Named craft technique from TECHNIQUE_VOCABULARY_LIST, or null if unassigned */
  technique: string | null;
  /** Optional rewrite sketch — becomes the seed for L5's REQUIRED rewriteExample */
  demonstrationSketch: string | null;
  /** Coaching priority — drives which candidates surface in the improvement queue */
  coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';
  /** Lifecycle state — drives consolidation and finalization decisions */
  lifecycleState: 'candidate' | 'consolidated' | 'superseded' | 'finalized';
  /** If superseded, ID of the candidate that replaced this one; null otherwise */
  supersededBy: string | null;
  /** ISO 8601 timestamp of emission */
  createdAt: string;
}

/**
 * ImprovementCandidateState — alias for the `lifecycleState` field values.
 * Exported for callers that want to narrow on the state union
 * (e.g. guards in the store, filters in the orchestrator).
 */
export type ImprovementCandidateState = ImprovementCandidate['lifecycleState'];

/**
 * ImprovementCandidateStoreSnapshot — serializable form of the runtime
 * ImprovementCandidateStore (Phase 4 class). Stored on EssayProfile so the
 * candidate lifecycle survives checkpoint persistence.
 *
 * Phase 4 implements ImprovementCandidateStore.serialize() / deserialize()
 * around this shape. Phase 1.5's profileMigration.ts constructs snapshots
 * directly from legacy persisted data.
 */
export interface ImprovementCandidateStoreSnapshot {
  /** All candidates the store has seen (active + consolidated + superseded + finalized) */
  candidates: ImprovementCandidate[];
  /** Next numeric counter for ID generation (monotonic) */
  nextId: number;
}

// ============================================================================

export interface EssayProfile {
  /** Profile Index (always loaded — ~250-350 tokens) */
  index: ProfileIndex;

  /**
   * Scope 2 (defined in Phase 1.5): Serializable snapshot of the runtime
   * ImprovementCandidateStore. Undefined on fresh profiles before any
   * analysis layer has run; populated incrementally by L3/L3.5/L3.75.
   *
   * Legacy profiles persisted before Phase 1.5 have this as undefined —
   * EssayProfileCoordinator.fromCheckpoint() runs the one-shot migration
   * from profileMigration.ts to backfill it from existing findings /
   * coachingMap.priorities / growthEdges / redFlags. If migration finds
   * zero source data, `index.requiresReanalysis` is set to true and this
   * field stays undefined until the coaching gate triggers re-analysis.
   */
  improvementCandidateSnapshot?: ImprovementCandidateStoreSnapshot;

  // -- HOLISTIC UNDERSTANDING (essay-level — 8 sections) --

  /** Voice description — WHAT the voice sounds like (holistic summary) */
  voiceIdentity: VoiceIdentity;
  /** Voice map — WHERE the voice lives and HOW it moves (structured spatial map) */
  voiceMap: VoiceMap;
  /** Emotional arc, peaks, undertones, progression */
  emotionalTopography: EmotionalTopography;
  /** Backward-tracing network for significant moments */
  momentEarnednessMap: MomentEarnednessMap;
  /** Central thesis, threads, subtext, contradictions */
  thematicArchitecture: ThematicArchitecture;
  /** Primary strategy, pivot points, pacing, structural choices */
  narrativeStrategy: NarrativeStrategy;
  /** Who the writer is — values, growth arc, intellectual fingerprint, blind spots */
  characterRevelation: CharacterRevelation;
  /** Strength signatures, growth edges, image system, patterns */
  craftAssessment: CraftAssessment;
  /** Moments where 2+ dimensions intersect meaningfully */
  entanglements: CrossDimensionEntanglement[];
  /** AO pitch, distinctiveness, institutional fit, red flags, memorability */
  admissionsPositioning: AdmissionsPositioning;

  // -- AO FIRST READ (GAP-4 — naive gut reaction under attention fatigue) --
  /** The AO's gut reaction BEFORE deep analysis. Produced by Haiku parallel with L1.
   *  Captures the "4pm, 29th essay" experience that L3.75 cannot replicate because
   *  it already has deep understanding by the time it runs. Optional — null if call failed. */
  aoFirstRead?: import('./analysis/aoFirstRead').AOFirstRead | null;

  // -- ESSAY UNDERSTANDING (Gap 1 — synthesized narrative prose) --
  /** The system's holistic understanding of the essay as a coherent narrative.
   *  Synthesized from the 10 holistic sections — the ARGUMENT, not the summary. */
  essayUnderstanding: EssayUnderstanding;

  // -- NORTH STAR (architecture of meaning — replaces EssayDNA) --

  /** How the essay MEANS — through-line, structural roles, trajectory,
   *  distinctiveness, intent bridge. Scaled by essay length. */
  northStar: EssayNorthStar;

  // -- L4 SCORING & COHERENCE (architecture validation) --

  /** Multi-dimensional per-paragraph scoring (L4 output, optional until L4 completes) */
  scoreMatrix?: ParagraphScoreMatrix;
  /** Cross-profile contradiction detection (L4 output, optional until L4 completes) */
  coherenceReport?: CoherenceReport;

  // -- PARAGRAPH MAP (per-paragraph understanding + analysis) --
  paragraphs: ParagraphProfile[];

  // -- CROSS-ESSAY CONNECTIONS (centralized — single source of truth) --
  connections: ProfileConnections;

  // -- EDIT UNDERSTANDING (version tracking + change comprehension) --
  editHistory: VersionRecord[];

  // -- FINDINGS (V2 — graduated evolution, FindingStore-managed) --
  /** All findings (active + superseded). Managed by FindingStore, synced at checkpoint. */
  findings: Finding[];

  // -- PERSISTENT QUESTION QUEUE (Gap 2 — accumulated across growth cycles) --
  /** All questions ever raised — persistent store with status tracking.
   *  Managed by QuestionQueueManager, synced at growth cycle end. */
  questionQueue: UnderstandingQuestion[];

  // -- CONVERSATION INSIGHTS (L6-sourced student revelations) --
  conversationInsights: ConversationInsight[];
  patternInsights: PatternInsight[];

  /** Accumulated student-declared context — prose string summarizing everything
   *  the student has revealed across coaching turns. Updated by Stage 4 when
   *  category is 'new_context'. Unlike conversationInsights (individual records),
   *  this is a synthesized narrative the LLM reads as a single block. */
  studentDeclaredContext: string;

  /** Structured version of student-declared context — parsed from the flat
   *  contextAccumulation string for writing prompt generation. Names, places,
   *  moments, and details are separated for targeted use in scaffolded prompts. */
  structuredContext?: StructuredStudentContext;

  // -- IMPROVEMENT MANIFEST (analysis-produced improvement queue) --
  /** Ordered improvements from the analysis system. The conversator workshops these
   *  with the student. Generated after L4 (or after whatever layer completes).
   *  Every finding, growth edge, red flag, and AO observation maps to at least one entry. */
  improvementManifest?: ImprovementManifest;

  /**
   * Target college identifier for supplement / PIQ essays (e.g. "stanford",
   * "mit", "harvard"). Normalized to lowercase at the API boundary.
   *
   * Scope 3 Phase 7: consumed by `enrichWithResearchDatabase()` to look up
   * college-specific guidance from `researchBackedTeachingService.getCollegeSpecificGuidance()`.
   * Must be present for supplement/PIQ essays targeting colleges with
   * guidance data; is correctly absent for common_app essays (no target
   * college known at common-app drafting time).
   *
   * Persisted here (not just in transient in-memory session state) so that
   * once the student has bound a supplement draft to a college, every
   * subsequent coaching turn — including turns served after a server
   * restart or a session TTL expiry — automatically enriches with the
   * right college note.
   */
  collegeId?: string;

  // -- PROFILE METADATA --
  metadata: {
    confidenceLevel: ConfidenceLevel;
    lastUpdatedLayer: number;
    paragraphsCovered: number[];
    conversationInsightsCount: number;
    totalAnalysisCost: number;
    createdAt: string;
    lastMutatedAt: string;
    /** Whether this was migrated from the legacy system (needs re-analysis) */
    legacyProfile: boolean;
  };

  /**
   * Phase 1 — Cross-session revision history. Append-only, capped at 10
   * snapshots; excess entries are dropped (counted in archivedSnapshots).
   *
   * Distinct from `editHistory` (per-turn in-session changes) and from
   * `versioning/` (per-turn VersionRecord[] under editHistory). This
   * records the MINIMAL profile subset needed for cross-revision trend
   * analysis (Phase 2 Voice Evolution, Phase 3+ craft trajectory).
   *
   * Optional so legacy / in-memory test profiles lacking this field
   * continue to typecheck; `snapshotStore` treats undefined as an empty
   * history on write.
   */
  revisionHistory?: RevisionHistory;

  /**
   * Phase 2a — Derived cross-session revision intelligence. Recomputed by
   * the coordinator after every snapshot write. Null when there is no basis
   * for comparison (history.length < 2) or the most recent compute failed
   * (caught + logged; the analysis cycle never fails because of this).
   *
   * Read by `historicalIntelligenceSection` to surface pattern-level issues,
   * regressions, and revision velocity to the coach prompt.
   */
  revisionIntelligence?: RevisionIntelligenceSignals | null;

  /**
   * Phase 2b — Derived cross-session voice trajectory. Recomputed by the
   * coordinator after every snapshot write. Null when history.length < 2.
   *
   * Read by `historicalIntelligenceSection` to surface voice evolution and
   * over-revision warnings. Stickiness of `overRevisionWarning.triggered`
   * is implemented by reading the PRIOR value off this field before the
   * next compute — see `computeVoiceEvolution` docs.
   */
  voiceEvolution?: VoiceEvolutionSignals | null;
}

// ============================================================================
// L4 SCORING & COHERENCE TYPES
// ============================================================================

/**
 * ParagraphScoreEntry — multi-dimensional score for a single paragraph.
 * Effectiveness comes from L3.5, the other 4 dimensions are L4's contribution.
 */
export interface ParagraphScoreEntry {
  index: number;
  scores: {
    /** Direct transfer from L3.5 paragraph analysis (0-100) */
    effectiveness: number;
    /** How well this paragraph fulfills its architectural role from the North Star (0-100) */
    structural: number;
    /** Voice consistency / intentional variation quality relative to essay's dominant voice (0-100) */
    voice: number;
    /** Emotional depth, authenticity, and moment earned-ness (0-100) */
    emotional: number;
    /** Thematic contribution — how well it serves the through-line and themes (0-100) */
    thematic: number;
  };
  /** Single-sentence architectural assessment — NOT a topic summary */
  verdict: string;
  /** 1-5: improvement priority informed by structural role significance */
  priorityForImprovement: number;
  /**
   * Port A3 — paragraph-level aggregate of PIQ 13-dimension rubric scores.
   * Populated ONLY when `EssayProfile.index.essayType === 'piq'`. Keys are
   * `PIQRubricDimension` enum values; values are integer 0-10 aggregates
   * (typically max or weighted-mean of the paragraph's sentence-level
   * `piqDimensions`). Non-PIQ paths leave this undefined.
   *
   * Ports downstream of A3 (B1 pattern library, B2 symptom router, F1
   * cliché anchors) will populate this field; the A3 port itself only
   * carries the shape so schema can be consumed early.
   */
  piqDimensions?: Record<string, number> | null;
}

/**
 * ParagraphScoreMatrix — the complete scoring artifact.
 * Cross-paragraph patterns and improvements reference the North Star.
 */
export interface ParagraphScoreMatrix {
  paragraphs: ParagraphScoreEntry[];
  /** Patterns that emerge when viewing scores ACROSS paragraphs */
  crossParagraphPatterns: string[];
  /** Prioritized improvements that reference North Star structural roles */
  prioritizedImprovements: Array<{
    paragraph: number;
    improvement: string;
    /** WHY this matters — references the essay's architecture, not just the paragraph */
    whyThisMatters: string;
    expectedImpact: 'transformative' | 'significant' | 'incremental';
  }>;
  /** Structured coaching hierarchy — replaces flat prioritizedImprovements when available */
  coachingMap?: CoachingMap;
}

/**
 * CoherenceIssue — a single contradiction detected across profile sections.
 */
export interface CoherenceIssue {
  /** Which profile section makes claim A (e.g., "voiceMap.shiftPoints") */
  sectionA: string;
  /** What claim A asserts */
  claimA: string;
  /** Which profile section makes claim B */
  sectionB: string;
  /** What claim B asserts — contradicts or tensions with claim A */
  claimB: string;
  /** How serious the contradiction is */
  severity: 'blocking' | 'notable' | 'minor';
  /** What should be done about it */
  suggestedResolution: string;
  /**
   * Free-text description of the tension's nature — what the contradiction IS.
   * Not how to fix it (that's suggestedResolution/likelyResolution).
   * The LLM describes the tension freely; this is NOT constrained to categories.
   */
  nature?: string;
  /** Contradiction routing category — how should the system respond */
  routingCategory?: 'productive_tension' | 'system_disagreement' | 'essay_flaw' | 'depth_signal';
  /** Whether both sides of the tension can coexist (productive tensions often can) */
  canCoexist?: boolean;
  /** Free-text resolution path (null if unknown) */
  likelyResolution?: string | null;
  /** Direct evidence quote from section A */
  evidenceA?: string;
  /** Direct evidence quote from section B */
  evidenceB?: string;
  /** Whether detected by primary crystallization or adversarial pass */
  source?: 'primary' | 'adversarial';
}

/**
 * CoherenceReport — all contradictions found + overall coherence verdict.
 */
export interface CoherenceReport {
  contradictions: CoherenceIssue[];
  /** False if any blocking contradictions exist */
  isCoherent: boolean;
  /**
   * W4.1: Programmatic contradictions detected by cross-domain validation.
   * These are discovered by deterministic checks (not LLM), so they have
   * explicit evidence references.
   */
  programmaticContradictions?: ProgrammaticContradiction[];
  /** Adversarial assessment of the North Star's coherence and irreplaceability */
  northStarAssessment?: NorthStarAssessment;
}

/**
 * W4.1: ProgrammaticContradiction — a contradiction detected by deterministic
 * cross-domain checks (not LLM). Has explicit evidence references.
 */
export interface ProgrammaticContradiction {
  type: 'understanding_vs_analysis' | 'voicemap_vs_identity' | 'structural_weight_vs_scores' | 'earnedness_vs_effectiveness';
  /** Evidence from side A */
  evidenceA: { section: string; claim: string; location?: { paragraph: number; sentence?: number } };
  /** Evidence from side B */
  evidenceB: { section: string; claim: string; location?: { paragraph: number; sentence?: number } };
  /** How serious */
  severity: 'blocking' | 'notable' | 'minor';
  /** Whether this contradiction has been consumed by the pipeline */
  consumed: boolean;
}

/**
 * W4.4: ContradictionInvestigation — how a contradiction should be handled.
 */
export interface ContradictionInvestigation {
  contradictionIndex: number;
  action: 'reprompt' | 'flag' | 'finding' | 'log';
  /** If action is 'finding', the finding to create */
  findingClaim?: string;
  /** If action is 'flag', the flag for L5 injection */
  flagText?: string;
}

// ============================================================================
// COACHING MAP TYPES (Improvement 4 — Active Contradiction Mining)
// ============================================================================

/**
 * CoachingMap — structured improvement hierarchy replacing flat prioritizedImprovements.
 * Produced by L4 Crystallizer alongside the score matrix. Provides a holistic coaching
 * strategy that connects transformative insight → priorities → protections → tensions.
 */
export interface CoachingMap {
  /** The single most transformative insight about this essay */
  transformativeInsight: {
    insight: string;
    evidenceLocations: Array<{ paragraph: number; sentence?: number }>;
    whyThisTransforms: string;
    requiresStudentAwareness: boolean;
  };
  /** Ordered priorities with architectural reasoning */
  priorities: Array<{
    priority: string;
    target: { paragraphs: number[]; description: string };
    architecturalReason: string;
    unlocksNext: string;
    expectedImpact: 'transformative' | 'significant' | 'incremental';
    /**
     * Scope 2 Phase 6a: Lineage — the ImprovementCandidate IDs (from L3/L3.5/L3.75
     * inline emission) that L4b consolidated into this priority. Enables L5 to
     * cite the exact candidate that surfaced the problem when writing annotations,
     * and lets downstream consumers trace priorities back to specific analytical
     * observations.
     *
     * After L4b completes, the orchestrator marks every cited candidate as
     * `consolidated` and every uncited active candidate as `superseded`. L4b
     * must be intentional — an empty or missing `consolidatedFrom` means the
     * priority is ungrounded (the LLM invented it from profile residue rather
     * than consolidating existing candidates), which the validator flags.
     *
     * Optional for backward compat with pre-Phase-6a profiles; fresh runs
     * always populate it.
     */
    consolidatedFrom?: string[];
  }>;
  /** Strengths that must NOT be damaged during improvement */
  protectedStrengths: Array<{
    description: string;
    locations: Array<{ paragraph: number; sentence?: number }>;
    whyProtect: string;
  }>;
  /**
   * Patterns that emerge from viewing the essay holistically.
   *
   * Scope 1 Phase 1 compressed format: one-line coaching signals.
   * Previously `Array<{ pattern, evidence, implication }>`; flattened to
   * `string[]` for ~10x token reduction while preserving signal. Wired into
   * L5 sharedContext as coaching hooks (Phase 2 work).
   *
   * Format: `"Pattern: {name} — {observation with P refs}"`. Max 3 entries,
   * each ≤20 words. The backward-compat parser in `buildCoachingMap()` at
   * `crystallizer.ts:1317-1345` accepts both the legacy object shape (from
   * persisted pre-Phase-1 profiles) and the new string shape.
   */
  emergentPatterns: string[];
  /**
   * Score tensions that have coaching implications.
   *
   * Scope 1 Phase 1 compressed format:
   *   `"P{n}: {dim1}({score}) >> {dim2}({score}) — {one-line hook}"`
   * Previously `Array<{ paragraph, tension, interpretation, coachingImplication }>`.
   * Max 3 entries, each ≤15 words.
   */
  scoreTensions: string[];
}

/**
 * NorthStarEvolution — version/changelog for re-crystallization tracking.
 * Present after the first re-crystallization (version >= 2).
 */
export interface NorthStarEvolution {
  version: number;
  changelog: Array<{
    field: string;
    previousValue: string;
    newValue: string;
    trigger: string;
  }>;
  coreIdentityStable: boolean;
  stabilityAssessment: string;
}

/**
 * NorthStarAssessment — adversarial pass assessment of the North Star's quality.
 * Tests whether the North Star captures something genuinely unique and irreplaceable.
 */
export interface NorthStarAssessment {
  passesIrreplaceabilityTest: boolean;
  reasoning: string;
  missingInsight: string | null;
}

// ============================================================================
// DELTA SYNTHESIS TYPES (W5 — Iterative L3.75 Refinement)
// ============================================================================

/**
 * W5.1: What triggered the delta synthesis.
 */
export type DeltaSynthesisTrigger =
  | 'blocking_contradiction'
  | 'coaching_supersession'
  | 'focused_analysis_ripple';

/**
 * W5.1: Request for a targeted delta synthesis of specific holistic sections.
 */
export interface DeltaSynthesisRequest {
  targetSections: HolisticSectionType[];
  trigger: DeltaSynthesisTrigger;
  evidence: string;
}

/**
 * W5.1: Output from a delta synthesis — only the updated sections.
 */
export interface DeltaSynthesisOutput {
  updatedSections: HolisticSectionType[];
  changeLog: Array<{ section: HolisticSectionType; summary: string }>;
  isSubstantive: boolean;
  /** Partial holistic data — only sections that were re-synthesized */
  partialSynthesis: Partial<HolisticSynthesisOutput>;
}

// ============================================================================
// COGNITIVE STATE TYPES (W6 — Coaching Intelligence)
// ============================================================================

/**
 * W6.1: CognitiveState — ROUTING HINT for system bookkeeping.
 * The LLM infers cognitive state in free-text prose (not constrained to these values).
 * This enum is used by the system for routing and session memory tracking ONLY.
 * The LLM also produces a freeform 'cognitiveStateDescription' field.
 *
 * ⚠️ CLUSTER D NOTE: IMPROVEMENT_6 specifies that the LLM should NOT be forced
 * to choose from a fixed enum. When implementing L6, ensure the LLM describes
 * cognitive state freely and this type is only used for downstream routing.
 *
 * Critical disambiguation: 'I don't get what you mean about voice shifting'
 * = confused_about_feedback. 'Tell me more about voice' = curious_deeper.
 */
export type CognitiveState =
  | 'confused_about_feedback'
  | 'confused_about_concept'
  | 'curious_deeper'
  | 'curious_wider'
  | 'frustrated'
  | 'resistant_to_specific'
  | 'resistant_to_general'
  | 'engaged'
  | 'seeking_validation'
  | 'overwhelmed';

/**
 * W6.2: TopicConfusionTracker — tracks repeated confusion per topic for escalation.
 */
export interface TopicConfusionTracker {
  topic: string;
  instanceCount: number;
  escalationLevel: 0 | 1 | 2 | 3;
  approachesTried: string[];
}

/**
 * Tracks repeated resistance to specific coaching suggestions.
 * Parallel to TopicConfusionTracker but with posture-based escalation.
 *
 * Escalation levels change the coach's BEHAVIORAL POSTURE, not just technique:
 * 0 = no resistance
 * 1 = noted — record the resistance, no special handling
 * 2 = reframe — ask what they're protecting before offering alternatives
 * 3 = name_pattern — explicitly name the pattern of resistance
 * 4 = honor_and_wait — stop suggesting changes to this area entirely
 */
export interface TopicResistanceTracker {
  /** Key format: "${dimensionFocus}:P${paragraphIndex}" or "${dimensionFocus}:essay" */
  topic: string;
  /** What specific suggestion(s) were rejected */
  rejectedSuggestions: string[];
  /** Number of resistance instances */
  instanceCount: number;
  /** Current escalation level (0-4) */
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  /** Turn numbers where resistance was detected */
  resistanceTurns: number[];
}

/**
 * The coach's evolving hypothesis about who this student is.
 * NOT analysis of the essay — analysis of the PERSON writing it.
 * Synthesized every 5 turns by Sonnet, with inter-synthesis updates
 * from the Sonnet sidecar's portraitEvolution field.
 *
 * Design principle: descriptive, not prescriptive. The theory
 * describes what the coach OBSERVES. The Stage 3 Sonnet decides
 * what to DO with these observations.
 */
export interface StudentTheory {
  /**
   * Who this person is — beyond what the essay reveals.
   * 2-4 sentences. The coach's empathetic read of the student.
   */
  personhood: string;

  /**
   * What the student is protecting — topics, phrasings, or approaches
   * they've resisted changing. Each entry is a specific thing, not a category.
   */
  protectedValues: Array<{
    value: string;
    evidence: string;
    implication: string;
  }>;

  /**
   * Hypotheses about what the student can't see about their own essay.
   * These are HYPOTHESES — the coach may be wrong.
   */
  blindSpotHypotheses: Array<{
    hypothesis: string;
    analysisEvidence: string;
    coachingEvidence: string;
    readyToSurface: boolean;
  }>;

  /**
   * Tensions between what the student says and what the essay does,
   * or between different things the student has said.
   */
  tensions: Array<{
    studentSays: string;
    essayShows: string;
    coachingOpportunity: string;
  }>;

  /**
   * The student's relationship to this essay — why it matters to them,
   * what they're trying to prove, what they're afraid of. 1-3 sentences.
   */
  essayRelationship: string;

  /**
   * Cross-layer observations — connections between essay-level analysis
   * and conversation behavior that neither layer alone can see.
   */
  crossLayerPatterns: Array<{
    analysisObservation: string;
    conversationEvidence: string;
    coachingImplication: string;
  }>;

  /** Turn number when this theory was last synthesized */
  synthesizedAtTurn: number;

  /** Raw inter-synthesis observations from Sonnet sidecar (cleared on synthesis) */
  pendingObservations: string[];

  /**
   * Confidence stage of this theory. Reflects how much conversation evidence
   * the synthesis has had to draw on. Injected into the next synthesis prompt
   * so the LLM calibrates hedging language accordingly and into the coach
   * prompt so `personhood` framing is not over-trusted too early.
   *
   *   - 'nascent'   — synthesized at T2, 2 turns of evidence. Hedge aggressively.
   *   - 'hypothesis' — synthesized at T3, still provisional.
   *   - 'growing'   — synthesized at T4, patterns are repeating.
   *   - 'confirmed' — synthesized at T5+, broadly stable.
   */
  maturity?: 'nascent' | 'hypothesis' | 'growing' | 'confirmed';
}

// ============================================================================
// COGNITIVE ASSESSMENT TYPES (Improvement 6 — LLM-First Coaching)
// ============================================================================

/**
 * The LLM's assessment of where the student is RIGHT NOW.
 * Free prose — not constrained to categories.
 *
 * This COMPLEMENTS the CognitiveState routing hint. The LLM reads the
 * student's message IN CONTEXT (conversation history, prior insights,
 * emotional valence) and produces a brief assessment that directly
 * shapes the coaching response.
 *
 * The CognitiveState enum remains as a system routing tag (for confusion
 * tracking, escalation logic). This interface captures the FULL LLM
 * perception that a 10-state enum cannot express.
 */
export interface CognitiveAssessment {
  /**
   * Free prose assessment of the student's current state.
   * 2-4 sentences. Specific. References conversation context.
   *
   * Examples of what this field can express (impossible with a 10-state enum):
   * - "Frustrated but starting to see it — the resistance is productive,
   *    not defensive. They're wrestling with the feedback, not rejecting it."
   * - "Performing understanding without actually getting it — they're using
   *    our vocabulary back at us but the revision they're describing would
   *    make the same mistake in new words."
   * - "Genuinely stuck — not confused about the feedback but unable to
   *    see HOW to implement it. Needs a concrete example, not more explanation."
   */
  assessment: string;

  /**
   * What the student needs RIGHT NOW — not a fixed category,
   * but a specific, contextual read.
   *
   * Examples:
   * - "A concrete example of what their P3 transition could look like"
   * - "Validation that their resistance to changing the ending is actually
   *    defensible — then help them strengthen it"
   * - "A question that makes them see the voice shift themselves"
   */
  whatTheyNeed: string;

  /**
   * Coaching approach recommendation for this specific turn.
   * Not from a fixed rotation — selected based on what the student needs.
   *
   * Examples:
   * - "Socratic questioning — they're close to seeing the pattern"
   * - "Direct instruction — they need concrete technique, not discovery"
   * - "Reflective mirroring — repeat back what they said so they can hear it"
   * - "Minimal response — acknowledge and let them keep thinking"
   */
  recommendedApproach: string;

  /**
   * LLM routing tag: how much coaching does this turn need?
   * Replaces shouldUseMinimalResponse() keyword matching.
   *
   * The LLM that produces the cognitive assessment ALSO decides response
   * intensity, because it has the full context. No keyword matching,
   * no confidence thresholds, no deterministic category routing.
   *
   * - "full": substantive — the student needs real coaching content
   * - "brief": shorter — acknowledge and advance, don't elaborate
   * - "minimal": acknowledge only — the student needs space or simple confirmation
   */
  responseIntensity: 'full' | 'brief' | 'minimal';
}

/**
 * A single coaching session event — unified record of what happened.
 * kind is a free-form string — the LLM describes what happened in its own words.
 */
export interface SessionEvent {
  /** Turn number when this event occurred */
  turn: number;
  /** LLM-generated event kind — free prose, not enum */
  kind: string;
  /** One-sentence summary of what happened */
  summary: string;
  /** LLM-assessed significance (0-1). Higher = more important to remember */
  significance: number;
  /** Paragraph indices involved (empty for essay-level events) */
  paragraphRefs: number[];
  /** Finding IDs referenced in this event (empty if none) */
  findingRefs: string[];
}

/**
 * Tracks the coaching session's arc. System infrastructure, not judgment.
 * The LLM reads this context; the system doesn't decide from it.
 */
export interface CoachingSessionMemory {
  /** Total turns in this session */
  turnCount: number;

  /** Unified session event log — authoritative record of session activity.
   *  Each event carries kind/summary/significance/paragraphRefs/findingRefs
   *  which are read into prompt blocks, retrieval scoring, and journal synthesis. */
  events: SessionEvent[];

  /**
   * LLM-generated session arc summary — updated every 3-5 turns.
   * Describes the shape of the conversation so far and where it's heading.
   */
  sessionArcSummary: string;

  /**
   * What the session should focus on next — LLM-assessed after each turn.
   * Not a fixed curriculum — emerges from the conversation.
   */
  nextFocus: string;

  /** Previous turn's responseIntensity from sidecar — for next-turn consistency */
  lastResponseIntensity?: 'full' | 'brief' | 'minimal' | null;

  /** Strategic question driving the session — a QUESTION, not a topic. */
  strategicQuestion: string;

  /** Turns since strategicQuestion was last updated. At 4+, escalation note appears. */
  questionStaleness: number;

  /** The coach's evolving theory about WHO this student is as a person.
   *  Synthesized every 5 coaching turns. Ephemeral to the session — not persisted
   *  across sessions. Lives on session memory, not the profile. */
  studentTheory?: StudentTheory;

  /** Consecutive deflection turns counter (for demonstration trigger).
   *  Session-scoped to avoid cross-contamination in concurrent sessions. */
  deflectionCounter?: number;

  /** Portrait observations accumulated before the first StudentTheory synthesis.
   *  Flushed into pendingObservations when the first theory is created at turn 5.
   *  Session-scoped to avoid cross-contamination in concurrent sessions. */
  preTheoryObservations?: string[];

  /** Per-topic resistance trackers (parallel to confusion tracking).
   *  Keyed by "${dimensionFocus}:P${paragraph}" or "${dimensionFocus}:essay".
   *  Session-scoped to avoid cross-contamination in concurrent sessions. */
  resistanceTrackers?: Record<string, TopicResistanceTracker>;

  /** Per-topic confusion trackers for escalation ladder.
   *  Session-scoped to avoid cross-contamination in concurrent sessions. */
  confusionTrackers?: Record<string, TopicConfusionTracker>;

  /** Number of demonstrations the coach has written this session.
   *  After 2, the demo trigger switches to asking the student to write. */
  demonstrationCount?: number;

  /** Live revision checklist — populated from top findings after turn 1,
   *  updated as the student addresses tasks through coaching or revisions.
   *  Injected into the coaching prompt so the coach references progress. */
  revisionChecklist?: RevisionTask[];

  /** Workshop progress — tracks which ImprovementManifest items have been
   *  discussed, demonstrated, attempted by student, or fully addressed.
   *  Keyed by ImprovementEntry.id. */
  improvementProgress?: Record<string, 'queued' | 'discussed' | 'demonstrated' | 'student_attempted' | 'addressed'>;

  /**
   * Phase 2: Ledger of improvements explicitly deployed (taught) in prior turns.
   * Keyed by ImprovementEntry.id. Enables the coachingPlanner to rotate across
   * different principle categories instead of repeating the same lesson ("be
   * specific") every turn — the regression the blind-spot hunter flagged at
   * 0% wordform-overlap-but-5-turns-of-same-principle.
   *
   * Written to by coachingPlanner.recordDeployment() after each turn. Read by
   * coachingPlanner.selectNextDeployment() to skip already-taught items and
   * diversify across PrincipleCategory.
   */
  taughtLedger?: Record<string, TaughtEntry>;

  /**
   * Phase 3: number of times the coach has deployed a calibrated pushback
   * (firm artifact request) this session. Hard cap at 1 — a second pushback
   * is the regression pattern the OLD system fell into at T7–T9. See
   * edgeProtocol.shouldAllowPushback().
   */
  pushbackCount?: number;

  /**
   * Phase 3: number of times the coach has surfaced a blindSpotHypothesis
   * this session. Hard cap at 1 — repeated surfacing would move from
   * observation to psychoanalysis. See edgeProtocol.shouldSurfaceBlindSpot().
   */
  blindSpotDeployedCount?: number;

  /**
   * Round-3 Coaching Integration: the strategic question produced by the
   * PRIOR turn's sidecar. Distinct from `strategicQuestion` (which is the
   * CURRENT live thread, possibly updated this turn). The prior-turn value
   * is what the coach "handed the student" at the end of the previous turn;
   * the next-turn prompt surfaces it verbatim so the coach either satisfies
   * it or explicitly chooses to abandon it — no silent drops.
   *
   * Cleared to null when the student's turn addresses it (detected heuristically
   * by the sidecar re-issuing a new strategicQuestionUpdate).
   */
  priorTurnStrategicQuestion?: string | null;

  /**
   * Round-3 Coaching Integration: the cognitive/inner-voice assessment from
   * the PRIOR turn's sidecar (raw `innerVoice` field). Used to build the
   * "MIRROR OPPORTUNITY" directive in the next coach prompt when the
   * assessment contains a testable hypothesis (marked by "suggests", "either…or",
   * "might be", "I'm betting", etc.). Cleared after it's mirrored or after
   * 2 turns of non-use.
   */
  priorTurnCognitiveAssessment?: string | null;

  /**
   * Round-3 Coaching Integration: the last turn when a mirror from the
   * prior-turn cognitive assessment was surfaced to the student. Rate-limits
   * mirrors to at most 1 per 3 turns to avoid making the session feel
   * therapeutic.
   */
  mirrorSurfacedAtTurn?: number;
}

/**
 * A record of when an ImprovementEntry was deployed as the primary focus of
 * a coaching turn. Persisted in CoachingSessionMemory.taughtLedger.
 */
export interface TaughtEntry {
  /** Turn number when this improvement was deployed as primary focus (1-based) */
  turn: number;
  /** Technique name deployed (e.g., "SUMMARY-TO-SCENE"), or null if keyword-only */
  technique: string | null;
  /** Coarse principle category — drives cross-turn rotation */
  principleCategory: PrincipleCategory;
  /** How prominently it was deployed */
  deploymentMode: 'explicit' | 'contextual';
  /** The ImprovementEntry.id this ledger entry refers to */
  impId: string;
}

/**
 * Coarse principle category used by coachingPlanner for cross-turn rotation.
 * Finer granularity than technique names but coarser than issue types — a
 * single session should teach different categories across turns to avoid
 * "5 turns of show-don't-tell" repetition.
 */
export type PrincipleCategory =
  | 'scene_grounding'       // Summary → scene, sensory timestamp, show-through-action
  | 'evidence_anchoring'    // Claim needs evidence, specificity ladder
  | 'voice_authenticity'    // Voice comparison, formulaic → personal
  | 'narrative_structure'   // Arc, pacing, paragraph roles, bridge sentences
  | 'character_presence'    // Named characters, collaborative specificity
  | 'craft_compression'     // Word economy, cutting, sentence rhythm
  | 'emotional_stakes'      // Somatic vulnerability, stakes establishment
  | 'admissions_framing'    // AO impact, cliche convergence, distinctiveness
  | 'thematic_coherence';   // North Star alignment, theme grounding

/**
 * A single revision task on the student's checklist.
 * Projected from findings — the student-facing version of what needs fixing.
 */
export interface RevisionTask {
  /** Task ID (e.g., 'RT_1') */
  id: string;
  /** Target paragraph (0-based index) */
  paragraph: number;
  /** Student-facing task description */
  task: string;
  /** Named craft technique, if applicable */
  technique: string | null;
  /** Finding ID this task originated from */
  findingRef: string | null;
  /** Current status */
  status: 'pending' | 'in_progress' | 'addressed';
  /** Priority (1 = highest) */
  priority: number;
  /** Turn when status changed to 'addressed' */
  addressedAtTurn?: number;
}

// ============================================================================
// IMPROVEMENT MANIFEST — Analysis-produced improvement queue for coaching
// ============================================================================

/**
 * A single improvement derived from the analysis system.
 * Every finding, growth edge, observation, and annotation should map to at least
 * one ImprovementEntry. The conversator's job is to workshop these with the student.
 *
 * Understanding is the fuel — improvements are the output.
 */
export interface ImprovementEntry {
  /** Unique ID (e.g., 'IMP_1') */
  id: string;
  /** Target paragraph (0-based index, -1 for essay-level) */
  paragraph: number;
  /** What the analysis observed — the diagnosis */
  observation: string;
  /** What the student should DO about it — always actionable, never just diagnostic */
  action: string;
  /** WHY this matters — framed in reader/AO impact, not abstract quality */
  stakes: string;
  /** Named craft technique from TECHNIQUE_ROUTES, if one matches */
  technique: string | null;
  /** Sample rewrite demonstrating the improvement (2-4 sentences) */
  demonstration: string | null;
  /**
   * Essay-specific rewrite from L5's `rewriteExample` — in the student's voice,
   * using the student's actual material. Populated by `mergeL5IntoManifest`.
   * Preferred over `genericExample` in coaching prompts.
   */
  essaySpecificDemo: string | null;
  /**
   * Generic BEFORE/AFTER/PRINCIPLE boilerplate from the research DB. Fallback
   * used only when `essaySpecificDemo` is absent. Populated by enrichment.
   */
  genericExample: string | null;
  /** What to CUT to make room for the addition (word economy) */
  wordEconomyCut: string | null;
  /** Where this improvement came from */
  source: 'l4_priority' | 'l35_finding' | 'l375_growth_edge' | 'l3_observation' | 'l5_annotation' | 'red_flag' | 'ao_first_read';
  /** Reference ID (finding ID, annotation ID, etc.) */
  sourceRef: string | null;
  /** Priority (1 = highest, from analysis) */
  priority: number;
  /** Expected impact on essay quality */
  impact: 'transformative' | 'significant' | 'incremental';
  /** Context enrichments added by conversator as student reveals details */
  conversatorEnrichments: string[];

  /**
   * Force-surface deadline (1-based turn number). When set, the
   * coachingPlanner promotes this item to the front of selection if
   * `(memory.turnCount + 1) > surfaceByTurn` AND the item has not yet
   * appeared in the taughtLedger.
   *
   * Populated by the howler pass / red_flag pipeline so transformative or
   * essay-credibility-critical items (clichés, factual howlers, AO red
   * flags) cannot silently age out of selection while category-rotation
   * prefers other items. Optional — items without a deadline rely on
   * impact-tier gating + category rotation.
   *
   * Default convention: red_flag and howler items are tagged
   * `surfaceByTurn: 2` at manifest-build time (must surface by turn 2 of
   * the coaching session — i.e., overdue starting at turn 3).
   */
  surfaceByTurn?: number;

  /**
   * Scope 3 Phase 7: Research-backed principle + mechanism explanation,
   * populated at coaching session init by `enrichWithResearchDatabase()`
   * from `TEACHING_KNOWLEDGE_BASE` in `researchBackedTeachingService`.
   *
   * Null when no IssueType mapping was resolved for this item (graceful
   * skip — per-item misses are legitimate, not errors).
   *
   * @see src/services/essayIntelligence/analysis/researchEnrichment.ts
   */
  researchBacking?: {
    /** Core principle behind the transformation (e.g., "Start at the point of highest tension") */
    principle: string;
    /** Mechanism explanation — why the "after" version works */
    whyItWorks: string;
    /** IssueType string used for the lookup (provenance trail) */
    sourceRef: string;
    /** Optional SourceCitation.source_id when getWhyThisMatters returned one */
    citationId?: string;
  } | null;

  /**
   * Scope 3 Phase 7: College-specific tailoring note for supplement essays.
   * Populated only when `collegeId` is present at coaching session init AND
   * `researchBackedTeachingService.getCollegeSpecificGuidance()` returns an
   * insight. Null is the correct "not applicable" value — not a failure.
   */
  collegeNote?: string | null;
}

/**
 * ImprovementManifest — the ordered list of improvements the analysis system
 * produces for the coaching system to workshop with the student.
 *
 * Populated after L4 (or after whatever layer completes if L4 fails).
 * Sources: L4 priorities → L3.5 findings → L3.75 growth edges → L3 red flags → AO first read.
 * The conversator consumes this and helps the student execute each improvement.
 */
export interface ImprovementManifest {
  /** Ordered improvements — highest priority first */
  items: ImprovementEntry[];
  /** ISO timestamp when manifest was generated */
  generatedAt: string;
  /** Which analysis layers contributed items */
  sources: string[];
  /** Essay word count at generation time (for word economy tracking) */
  wordCount: number;
  /** Essay word limit */
  wordLimit: number;

  /**
   * Scope 3 Phase 7: Idempotency flag set by `enrichWithResearchDatabase()`
   * on first run. Prevents re-running enrichment on every coaching turn.
   *
   * NOT PERSISTED: `SupabaseCheckpointStore.save()` strips this key via
   * a JSON replacer so every session reload starts with unset flag and
   * re-runs enrichment against the current `collegeId` and research DB.
   * Without that strip, the flag would survive the JSONB round-trip and
   * permanently short-circuit enrichment when a student switches college
   * mid-thread or the research DB is updated.
   */
  _enriched?: boolean;

  /**
   * Populated when enrichment throws a systemic error (e.g. table drift in
   * ROUTE_TO_ISSUE_TYPE vs. TECHNIQUE_VOCABULARY_LIST). Coaching continues
   * with a best-effort manifest, but downstream observability/audit tooling
   * can surface this field to flag a systemic configuration regression.
   *
   * NOT PERSISTED: session-local diagnostic only. Stripped by the same
   * SupabaseCheckpointStore replacer as `_enriched`.
   */
  _enrichmentError?: {
    type: 'systemic_miss' | 'lookup_failure' | 'import_failure';
    layer: string;
    message: string;
    at: string;
  };
}

/**
 * Observations about how this student learns. Accumulated across the session.
 * The LLM reads these to calibrate its approach — but the observations
 * are DESCRIPTIVE, not prescriptive.
 */
export interface LearningStyleObservations {
  /**
   * How the student responds to different teaching modes.
   * Updated by the LLM after each turn.
   */
  observations: Array<{
    observation: string;
    confidence: 'tentative' | 'growing' | 'confident';
    turnObserved: number;
  }>;
}

// ============================================================================
// VERSION INTELLIGENCE TYPES (W9 — Approach Tracking)
// ============================================================================

/**
 * W9.1: EditApproach — tracks a writing approach the student tried.
 */
export interface EditApproach {
  id: string;
  description: string;
  snapshotText: string;
  /** Compact summary of the analysis state when this approach was active */
  analysisSnapshot?: string;
  /** Whether the student abandoned this approach */
  abandoned: boolean;
  /** If abandoned, which approach replaced it */
  nextApproach?: string;
}

/**
 * W9.2: EditStrategyPattern — detected editing strategy.
 */
export type EditStrategyPattern =
  | 'iterating_on_opening_voice'
  | 'restructuring_argument'
  | 'polishing_specific_section'
  | 'experimenting_with_alternatives';

// ============================================================================
// FINDING LIFECYCLE TYPES (V2 — Graduated Evolution)
// ============================================================================

/**
 * Finding lifecycle maturity — LLM-assigned, system-validated.
 * Tracks where a finding is in its lifecycle from initial hypothesis
 * through confirmation to depth.
 *
 * The LLM decides maturity, not a formula. The system validates
 * referential integrity (no references to non-existent IDs) but
 * never overrides the LLM's maturity assessment.
 */
export type FindingMaturity =
  | 'hypothesis'
  | 'developing'
  | 'confirmed'
  | 'deepened'
  | 'superseded';

/**
 * Finding coaching value — LLM-assigned routing signal.
 * Determines how useful this finding is for coaching THIS student.
 * Orthogonal to maturity: a hypothesis can be critical, a deepened
 * finding can be diagnostic.
 */
export type FindingCoachingValue =
  | 'critical'
  | 'high'
  | 'medium'
  | 'contextual'
  | 'diagnostic';

/**
 * Finding source — what layer/process discovered this finding.
 */
export type FindingSource =
  | 'walk'
  | 'deep_dive'
  | 'coaching'
  | 'edit_reanalysis'
  | 'coherence_check'
  | 'holistic_synthesis'
  | 'analysis_pass';

/**
 * FindingScope — what part of the essay this finding is about.
 * Findings exist at natural granularity, not forced to paragraph boundaries.
 */
export interface FindingScope {
  type: 'word' | 'sentence' | 'sentence_group' | 'paragraph' | 'cross_paragraph' | 'essay_level';
  /** Primary paragraph (for paragraph-scoped or narrower) */
  paragraph?: number;
  /** Specific sentences within the paragraph */
  sentences?: number[];
  /** Multiple paragraphs (for cross_paragraph scope) */
  paragraphs?: number[];
  /** Text evidence anchoring this scope to specific essay locations */
  textEvidence: Array<{
    text: string;
    location: { paragraph: number; sentence?: number };
  }>;
}

/**
 * FindingEvidence — evidence supporting a finding's claim.
 * Every finding must cite specific text or specific absences.
 * Absence is evidence: "The essay never shows X" is as important
 * as "The essay shows Y."
 */
export interface FindingEvidence {
  /** Quoted text, or description of an absence */
  text: string;
  /** Where in the essay (undefined for essay-level absences) */
  location?: { paragraph: number; sentence?: number };
  /** 'present' = text is quoted; 'absent' = evidence is something NOT there */
  type: 'present' | 'absent';
}

/**
 * FindingLineageEntry — records a maturity transition.
 * Append-only growth log. Every time a finding's maturity changes,
 * a lineage entry records what happened and why.
 */
export interface FindingLineageEntry {
  timestamp: string;
  previousMaturity: FindingMaturity;
  newMaturity: FindingMaturity;
  /** What caused the change: 'walk_P3', 'deep_dive_voice', 'coaching_turn_2' */
  trigger: string;
  /** LLM's explanation for the transition */
  reasoning: string;
  /** If this transition superseded another finding */
  supersedes?: string;
}

/**
 * Finding — a referenceable claim about the essay that carries evidence,
 * scope, maturity, coaching value, and relationship references.
 *
 * Findings are the structured index into the prose understanding.
 * They are what downstream systems (L3.5 scoring, L5 annotations,
 * L6 coaching, dispatch) query against.
 *
 * Design principles:
 * - LLM owns all judgment (maturity, coaching value, relationships)
 * - Never deleted, only superseded (append-only with pointer evolution)
 * - Dimensions are routing tags, not a closed taxonomy
 * - Evidence is mandatory (cognitive forcing function)
 */
export interface Finding {
  /** Unique finding ID (e.g., 'F1', 'F2', ...) */
  id: string;

  /** The insight itself — a claim about the essay */
  claim: string;

  /** What part of the essay this finding is about */
  scope: FindingScope;

  /** Lifecycle maturity — LLM-assigned, system-validated */
  maturity: FindingMaturity;

  /**
   * LLM's reasoning for the current maturity level.
   * Required on every maturity assignment or transition.
   * Serves as audit trail and context for future LLM calls.
   */
  maturityReasoning: string;

  /** How useful this finding is for coaching — LLM-assigned routing signal */
  coachingValue: FindingCoachingValue;

  /** LLM-assigned dimensions this finding touches */
  dimensions: HolisticDimension[];

  /** Findings this one builds on (depth chain — emergent, not forced) */
  buildsOn: string[];

  /** Findings this one relates to laterally */
  relatedTo: string[];

  /** If superseded, what replaced it */
  supersededBy?: string;

  /**
   * If superseded, WHY. LLM explains the supersession.
   * Gives downstream systems context to ignore it correctly.
   */
  supersessionReason?: string;

  /** What discovered this finding */
  source: FindingSource;

  /**
   * What investigating this finding further might reveal.
   * null if fully explored. Used by dispatch to select deep dives.
   * LLM-generated prose, not a category.
   */
  deepeningPotential: string | null;

  /** Questions this finding raises */
  raisesQuestions: string[];

  /** Text evidence — every finding must cite specific text or specific absences */
  evidence: FindingEvidence[];

  /**
   * Growth lineage — every time this finding's maturity changes,
   * record what happened. Append-only.
   */
  lineage: FindingLineageEntry[];

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last maturity change */
  lastUpdated: string;
}

// ============================================================================
// LAYER OUTPUT TYPES
// ============================================================================

/** L1 output: Haiku-produced first impressions — simple string classifications.
 * These are temporary scaffolding; L3 (Sonnet) SUPERSEDES them entirely
 * with richer ObservationEntry[] when it processes each paragraph.
 * See "Type Escalation" section for the deepening pattern. */
export interface ParagraphFirstImpression {
  paragraphIndex: number;

  // Paragraph-level
  apparentPurpose: string;
  emotionalRegister: string;
  voiceObservation: string;
  craftNotices: string[];
  tags: string[];

  // Sentence-level (every sentence mapped)
  sentences: Array<{
    index: number;
    text: string;
    apparentPurpose: string;
    rhetoricalFunction: string;
    toneShift: boolean;
    notableElements: string[];
    tags: string[];
  }>;

  // Word/phrase level (DESCRIPTIVE ONLY — no strength/weakness judgment)
  notablePhrases: Array<{
    phrase: string;
    sentenceIndex: number;
    significance: string;
  }>;
}

/**
 * StructuralCartographyOutput — L2 output (extends existing StructuralCartography).
 * Reuses the existing StructuralCartography type from types.ts — imported by consumers.
 * This alias makes the layer output naming consistent.
 */
export type StructuralCartographyOutput = import('./types').StructuralCartography;

/** L2.5 output: Haiku-produced surface-level connection scouting.
 * Categorized by pattern type so L3 can ask targeted questions.
 * These are LEADS for L3 to investigate, not confirmed connections. */
export interface ConnectionScoutOutput {
  repeatedElements: Array<{
    element: string;
    occurrences: Array<{ paragraphIndex: number; sentenceIndex: number }>;
    potentialSignificance: string;
  }>;
  tonalShifts: Array<{
    location: { paragraphIndex: number; sentenceIndex: number };
    fromTone: string;
    toTone: string;
    abruptness: 'gradual' | 'sharp';
  }>;
  structuralEchoes: Array<{
    source: { paragraphIndex: number; sentenceIndex: number };
    echo: { paragraphIndex: number; sentenceIndex: number };
    echoType: string;
  }>;
}

/**
 * UnderstandingWalkOutput — L3 output per paragraph.
 * Understanding ONLY — no evaluation, no judgment.
 *
 * Supersession model: priorSentenceUpdates replace entire arrays, never append.
 */
export interface UnderstandingWalkOutput {
  /**
   * Explicit paragraph index — MUST be provided by the walk caller.
   * Removes the heuristic "first paragraph without understanding" which
   * breaks on re-analysis when all paragraphs already have understanding.
   */
  paragraphIndex: number;

  /** This paragraph's understanding (no evaluation) */
  paragraphUnderstanding: ParagraphUnderstanding;
  /** Sentence-level understanding for each sentence in this paragraph */
  sentenceUnderstandings: Array<{
    index: number;
    understanding: SentenceUnderstanding;
  }>;

  /**
   * Holistic understanding evolution — only fields that changed.
   * Captures INCREMENTAL holistic shifts during the walk.
   * The FULL holistic profile comes from L3.75 Holistic Synthesis.
   */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
  };

  /**
   * Prior sentence understanding updates — back-propagation.
   * When this paragraph revealed something new about a PRIOR sentence's
   * PURPOSE or MEANING (understanding only — not evaluation).
   *
   * Supersession model: entire arrays REPLACED, never appended.
   */
  priorSentenceUpdates: Array<{
    paragraph: number;
    sentence: number;
    observedFunctions?: ObservationEntry[];
    inferredIntents?: ObservationEntry[];
    narrativeContributions?: ObservationEntry[];
    newTags?: string[];
    primaryFunction?: string;
    significance?: 'pivotal' | 'contributing' | 'transitional';
  }>;

  /**
   * Cross-paragraph connections discovered during this paragraph's walk.
   * Each gets enriched by the system (ID, routing tags, status) before
   * being added to the connection store.
   */
  newConnections: Array<{
    from: ConnectionEndpoint;
    to: ConnectionEndpoint;
    description: string;
    reverseIllumination: string | null;
    significance: string;
    strengthCategory: ConnectionStrengthCategory;
    directionality: ConnectionDirectionality;
  }>;

  /**
   * W1.3: New findings discovered during this paragraph's walk.
   * Only produced when something rises above sentence-level (pattern, tension, quality).
   * Optional — if LLM omits, same behavior as before.
   */
  newFindings?: Array<{
    claim: string;
    scope: FindingScope;
    maturity: FindingMaturity;
    maturityReasoning: string;
    coachingValue: FindingCoachingValue;
    dimensions: HolisticDimension[];
    evidence: FindingEvidence[];
    deepeningPotential: string | null;
    raisesQuestions: string[];
    buildsOn?: string[];
    relatedTo?: string[];
  }>;

  /**
   * W1.3: Evolutions of existing findings based on new understanding from this paragraph.
   * Optional — if LLM omits, same behavior as before.
   */
  findingEvolutions?: Array<{
    findingId: string;
    newMaturity: FindingMaturity;
    reasoning: string;
    supersedes?: string;
  }>;
}

/**
 * HolisticSynthesisOutput — L3.75 output.
 * Single Sonnet call after walk. Reads all sentence-level understanding,
 * synthesizes ALL holistic sections including voice map and earnedness map.
 *
 * Uses the same types as stored profile sections. There is no output-to-profile
 * transformation step — the LLM writes directly into profile format
 * (Design Decision: "LLM output IS the profile data"). This means the L3.75
 * prompt must specify the exact output schema matching the profile types.
 */
export interface HolisticSynthesisOutput {
  voiceIdentity: VoiceIdentity;
  voiceMap: VoiceMap;
  emotionalTopography: EmotionalTopography;
  momentEarnednessMap: MomentEarnednessMap;
  thematicArchitecture: ThematicArchitecture;
  narrativeStrategy: NarrativeStrategy;
  characterRevelation: CharacterRevelation;
  craftAssessment: CraftAssessment;
  entanglements: CrossDimensionEntanglement[];
  admissionsPositioning: AdmissionsPositioning;

  /**
   * V2: Connections discovered from full-context view.
   * L3.75 sees ALL text simultaneously and may discover connections
   * the sequential walk could not see (e.g., bookending, cross-essay echoes).
   * Optional — absent in older profiles or if L3.75 finds no new connections.
   */
  newConnections?: Array<{
    from: ConnectionEndpoint;
    to: ConnectionEndpoint;
    description: string;
    reverseIllumination: string | null;
    significance: string;
    strengthCategory: ConnectionStrengthCategory;
    directionality: ConnectionDirectionality;
  }>;

  /**
   * V2: LLM-generated prose describing the essay's connection architecture.
   * Topology (hub-and-spoke, web, linear chain), hubs, islands, broken chains.
   * Optional — absent in older profiles.
   */
  connectionGraphSummary?: string;

  /**
   * V2: Walk connection upgrades — L3.75 may upgrade walk connections
   * (adding reverseIllumination, adjusting strength, adding routing tags).
   * Optional — absent if no walk connections need upgrading.
   */
  connectionUpgrades?: Array<{
    connectionId: string;
    strengthCategory?: ConnectionStrengthCategory;
    reverseIllumination?: string;
    routingTags?: ConnectionRoutingTag[];
    significance?: string;
  }>;

  /**
   * W1.4: New essay-level findings from holistic synthesis.
   * L3.75 sees the complete picture and may discover essay-level patterns
   * that the paragraph-by-paragraph walk could not see.
   * Optional — if LLM omits, same behavior as before.
   */
  newFindings?: Array<{
    claim: string;
    scope: FindingScope;
    maturity: FindingMaturity;
    maturityReasoning: string;
    coachingValue: FindingCoachingValue;
    dimensions: HolisticDimension[];
    evidence: FindingEvidence[];
    deepeningPotential: string | null;
    raisesQuestions: string[];
    buildsOn?: string[];
    relatedTo?: string[];
  }>;

  /**
   * W1.4: Finding evolutions — L3.75 may confirm, deepen, or supersede
   * findings discovered during the walk.
   * Optional — if LLM omits, same behavior as before.
   */
  findingEvolutions?: Array<{
    findingId: string;
    newMaturity: FindingMaturity;
    reasoning: string;
    supersedes?: string;
  }>;
}

/**
 * SentenceAnalysisConfidence — LLM-assessed confidence metadata on a sentence score.
 * The LLM produces these directly; the system never computes or overrides them.
 * Used by L5 (feedback routing), L6 (coaching conversation starters), and
 * phase detection (reduced certainty when many scores are low-confidence).
 */
export interface SentenceAnalysisConfidence {
  /** LLM's prose explanation of confidence in this score — cites specific textual evidence or ambiguity */
  reasoning: string;
  /** Routing-grade confidence tag — LLM assigns this directly */
  level: 'high' | 'moderate' | 'low';
  /**
   * What would change this score? Cognitive forcing function against overconfidence.
   * Required for 'low' and 'moderate' confidence. Null for 'high' confidence.
   */
  sensitivityNote: string | null;
}

/**
 * AnalysisPassOutput — L3.5 output per paragraph.
 * Evaluation with COMPLETE understanding (including holistic context from L3.75).
 */
export interface AnalysisPassOutput {
  paragraphIndex: number;

  /** Per-sentence analysis */
  sentenceAnalyses: Array<{
    sentenceIndex: number;
    effectiveness: number;
    effectivenessReasoning: string;
    strengths: ObservationEntry[];
    weaknesses: ObservationEntry[];
    isStrength: boolean;
    isProblem: boolean;
    priorityForImprovement: number;
    /** LLM-assessed confidence in this sentence's effectiveness score. Optional for backward compat. */
    confidence?: SentenceAnalysisConfidence;
    /**
     * Scope 2 Phase 5: Inline improvement candidate from the L3.5 analysis.
     * Populated when isProblem=true or priorityForImprovement >= 4.
     * See SentenceAnalysis.improvementCandidate for the fuller contract.
     */
    improvementCandidate?: ImprovementCandidate | null;
    /** Wave-1b pre-req seam (Port B1): sentence-scope pattern-library matches. */
    patternMatches?: KnowledgePatternMatch[];
    /** Wave-1b pre-req seam (Port B2): SymptomDiagnoser classification + escape hatch. */
    symptomType?: string | null;
    symptomTypeOpen?: string | null;
    /**
     * Port A3 — PIQ 13-dimension rubric scores. Populated only when the
     * essay is a PIQ (`EssayProfile.index.essayType === 'piq'`). See
     * `SentenceAnalysis.piqDimensions` for the fuller contract.
     */
    piqDimensions?: Record<string, number> | null;
    piqDimensionsOpen?: string | null;
  }>;

  /** Paragraph-level analysis */
  paragraphEffectiveness: number;
  paragraphVerdict: string;

  /**
   * Wave-1b pre-req (Port B1 architectural-scope channel): paragraph-scope
   * pattern matches — hook/arc/structural issues that span sentences. Kept
   * separate from sentence-level `patternMatches` so scope is preserved and
   * coaching can decide whether a fix lands at sentence edit or architectural
   * revision granularity.
   */
  paragraphPatternMatches?: KnowledgePatternMatch[];

  /** Essay-specific calibration reflection produced BEFORE scoring (anti-clustering). Optional for backward compat. */
  calibrationReflection?: string;
  /** How this paragraph compares to the anchor paragraph. Null for the anchor itself. Optional for backward compat. */
  comparativeNotes?: string | null;

  /** Essay-level evaluative insights that emerged from analyzing this paragraph */
  holisticAnalysisEvolution: {
    strengthSignatures?: Array<{ quality: string; evidence: string; paragraphs: number[] }>;
    growthEdges?: Array<{ quality: string; description: string; paragraphs: number[] }>;
    aoTakeaway?: string;
  };
}

/**
 * NorthStarOutput — L4 output. The five North Star dimensions.
 */
export type NorthStarOutput = EssayNorthStar;

// ============================================================================
// PROFILE MANAGER TYPES
// ============================================================================

/**
 * StalenessTracker — tracks which profile sections need refreshing.
 */
export interface StalenessTracker {
  /** All currently stale entries, keyed by location string */
  entries: Map<string, StalenessEntry>;

  /** Mark an element as stale */
  markStale(target: StalenessTarget, strength: StalenessStrength, reason: string, trigger: MutationType, depth?: 0 | 1 | 2): void;
  /** Clear staleness for an element */
  clearStaleness(target: StalenessTarget): void;
  /** Clear all staleness of a given strength or weaker */
  clearByStrength(maxStrength: StalenessStrength): void;
  /** Get count of strong-stale entries */
  getStrongStaleCount(): number;
  /** Get staleness snapshot (for Profile Router) */
  getSnapshot(): StalenessSnapshot;
  /** Get full report (for UI, debugging) */
  getReport(): StalenessReport;
}

/**
 * StalenessEntry — a single stale element.
 */
export interface StalenessEntry {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
  /** When this staleness was recorded */
  markedAt: number;
  /** Which mutation caused this staleness */
  triggeredBy: MutationType;
  /** Propagation depth: 0 = changed element, 1 = direct connection, 2 = two-hop */
  depth: 0 | 1 | 2;
}

/**
 * StalenessTarget — what section/element is stale.
 */
export type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; index: number }
  | { type: 'sentence'; paragraph: number; sentence: number }
  | { type: 'connections'; connectionIds: string[] }
  | { type: 'north_star' }
  | { type: 'entanglements' };

/**
 * StalenessSnapshot — compact view for the Profile Router.
 */
export interface StalenessSnapshot {
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  /** Strong-stale entries, for the Profile Router to prioritize */
  strongEntries: StalenessEntry[];
  /** Moderate-stale entries, for inclusion when token budget allows */
  moderateEntries: StalenessEntry[];
}

/**
 * StalenessReport — full report for external consumers (UI, debugging).
 */
export interface StalenessReport {
  snapshot: StalenessSnapshot;
  weakEntries: StalenessEntry[];
  /** Whether re-analysis is suggested (strong count >= 3) */
  reanalysisSuggested: boolean;
  /** Total staleness by domain */
  byDomain: Record<string, { strong: number; moderate: number; weak: number }>;
  /** When staleness was last cleared */
  lastClearedAt: number | null;
}

/**
 * StalenessEffect — declares which mutations affect which profile sections.
 */
export interface StalenessEffect {
  target: StalenessTarget;
  strength: StalenessStrength;
  reason: string;
}

/**
 * StalenessDependencyMap — static configuration declaring cross-domain dependencies.
 * The coordinator reads this after every mutation to propagate staleness.
 */
export type StalenessDependencyMap = Record<MutationType, StalenessEffect[]>;

/**
 * SessionBoundaryState — manages engagement threshold resets across sessions.
 */
export interface SessionBoundaryState {
  /** Timestamp of the last mutation */
  lastMutationAt: number;
  /** Current engagement threshold — strong-stale entries before suggesting re-analysis */
  reanalysisThreshold: number;
  /** Default threshold (restored at session boundary) */
  defaultThreshold: 3;
  /** Whether the current session is the first since profile creation */
  isFirstSession: boolean;
}

/**
 * ValidationResult — output from quick or full validation.
 */
export interface ValidationResult {
  /** Whether all checks passed */
  valid: boolean;
  /** Individual check results */
  checks: ValidationCheck[];
  /** Summary counts */
  summary: {
    passed: number;
    warnings: number;
    errors: number;
  };
  /** Timestamp */
  validatedAt: number;
  /** Which tier was run */
  tier: 'quick' | 'full';
}

/**
 * ValidationCheck — a single validation check result.
 */
export interface ValidationCheck {
  /** Machine-readable check name */
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  /** Human-readable explanation when failed */
  details?: string;
  /** Where the issue was found */
  locations?: Array<{ paragraph: number; sentence?: number }>;
}

/**
 * ReadinessScores — four granularity levels feeding improvement phase detection.
 */
export interface ReadinessScores {
  /** 0-100: thesis + arc + voice + holistic population */
  essay: number;
  /** 0-100: paragraph effectiveness distribution */
  paragraph: number;
  /** 0-100: sentence effectiveness + problem-free ratio */
  sentence: number;
  /** 0-100: word-level weakness absence */
  word: number;
}

/**
 * CircuitBreakerState — prevents infinite retry loops on persistent failures.
 */
export interface CircuitBreakerState {
  /** Number of retries at current checkpoint position */
  retryCount: number;
  /** Maximum retries before tripping */
  maxRetries: 3;
  /** The checkpoint position where failures are occurring */
  failurePoint: string;
  /** Error details from each attempt */
  attempts: Array<{
    /** Pipeline position where this failure occurred (e.g., 'L3_walk', 'L1_impressions') */
    position?: string;
    timestamp: number;
    error: string;
    rawOutput?: string;
  }>;
  /** Whether the circuit breaker has tripped */
  tripped: boolean;
  /** When the cooldown expires (null if not tripped) */
  cooldownExpiresAt: number | null;
}

/**
 * WalkSkippedMarker — marker on paragraphs that failed during the L3 walk.
 */
export interface WalkSkippedMarker {
  walkSkipped: true;
  failedAt: 'l3_understanding' | 'l3_5_analysis';
  errorSummary: string;
  failedAtTimestamp: number;
  retryRequested: boolean;
}

/**
 * CheckpointStore — persistence interface for profile checkpointing.
 * The coordinator calls this at pipeline boundaries. Implementation provided
 * by the orchestrator — the coordinator never imports database modules.
 */
export interface CheckpointStore {
  save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void>;
  load(essayId: string): Promise<EssayProfile | null>;
}

/**
 * CheckpointMetadata — metadata saved alongside each checkpoint.
 *
 * Round 7 P0 (D4-H1 / D4-L3): `essayId` and `essayType` MUST be threaded
 * through from the coordinator. Persistence silently no-op'd for months
 * because `essayId` was hardcoded to `''` and `essay_type` was hardcoded
 * to `'common_app'` in `SupabaseCheckpointStore.save()`.
 */
export interface CheckpointMetadata {
  /**
   * Stable essay UUID. MUST match the `essays(id)` row this checkpoint
   * belongs to — the `essay_understanding.essay_id` column is a UUID NOT
   * NULL FK to `essays.id`, so an empty string causes an insert error
   * that used to be swallowed silently.
   */
  essayId: string;
  /**
   * Essay type. Required so `SupabaseCheckpointStore.save()` writes the
   * correct row type (previously hardcoded to `'common_app'`, which
   * flipped PIQ/supplement rows to common_app on every save).
   */
  essayType: EssayType;
  reason: CheckpointReason;
  completedLayer: string;
  writeVersion: number;
  stalenessSnapshot: StalenessSnapshot;
  validationResult: ValidationResult;
  costSoFar: number;
}

/**
 * LightTouchUpdate — mechanical profile updates that bypass the full mutation pipeline.
 * These never involve analytical judgment — strictly mechanical operations.
 */
export interface LightTouchUpdate {
  /** Which type of light-touch update */
  type: 'text_reference' | 'structural_bookkeeping' | 'index_remap' | 'staleness_application' | 'inferred_intent';

  /** For text_reference: sentences whose text changed */
  textUpdates?: Array<{
    paragraph: number;
    sentence: number;
    newText: string;
  }>;

  /** For structural_bookkeeping: updated paragraph/sentence counts */
  structuralUpdates?: {
    paragraphCount: number;
    sentenceCounts: number[];
  };

  /** For index_remap: old-to-new index mapping */
  indexRemap?: {
    paragraphMap: Map<number, number>;
    insertedParagraphs: number[];
    deletedParagraphs: number[];
  };

  /** For staleness_application: explicit staleness markers */
  stalenessMarkers?: Array<{
    target: StalenessTarget;
    strength: StalenessStrength;
    reason: string;
  }>;

  /** For inferred_intent: student-stated intent updates */
  intentUpdates?: Array<{
    paragraph: number;
    sentence: number;
    intents: ObservationEntry[];
    source: string;
  }>;
}

/**
 * PreMutationSnapshot — snapshot of affected fields before focused analysis,
 * enabling cheap rollback if escalation to comprehensive is needed.
 */
export interface PreMutationSnapshot {
  /** Which fields were snapshotted */
  scope: Array<{
    paragraph: number;
    sentence?: number;
    fields: string[];
  }>;
  /** Deep copies of the original values */
  values: Map<string, unknown>;
  /** Timestamp for staleness comparison */
  takenAt: number;
}

/**
 * ReanalysisBrief — canonical single definition used across:
 *   - versionTracker (produces it from accumulated changes)
 *   - deepAnnotationService (consumes it for L5 re-analysis context)
 *   - focusedAnalyzer (consumes it for surgical escalation context)
 *   - reanalysisOrchestrator (passes it to analyzeEssay)
 *
 * The versionTracker shape is the richest / source-of-truth.
 * Optional fields provide backward compat for deepAnnotationService + focusedAnalyzer.
 * Target: under 500 tokens when serialized.
 */
export interface ReanalysisBrief {
  // ── Core (always populated by versionTracker) ─────────────────────────────
  /**
   * Net changes (not every intermediate step — A→B→C→A shows as "no net change").
   * Computed by collapsing all PendingChanges per location into a single net diff.
   */
  netChanges: Array<{
    location: { paragraph: number; sentence?: number };
    oldText: string;
    newText: string;
    significance: string;
    changeType: string;
    appearsToHaveReverted?: boolean;
  }>;
  /** Structural summary of what kind of editing happened */
  structural: {
    /** Paragraph indices (0-based) that changed */
    paragraphsChanged: number[];
    hasReordering: boolean;
    hasInsertions: boolean;
    hasDeletions: boolean;
    changeScope: 'sentence' | 'paragraph' | 'multi_paragraph' | 'essay_level';
  };
  /** Student intent from conversation context (if available) */
  studentIntent?: string;
  /** Profile areas with the most accumulated staleness (prioritized for re-analysis) */
  staleAreas: string[];
  /** Human-readable summary for injection into LLM prompts (~300 tokens max) */
  summaryForPrompt: string;

  // ── L5 compat (deepAnnotationService) ────────────────────────────────────
  /** Brief human-readable summary of what changed (alias for summaryForPrompt) */
  changeSummary?: string;
  /** Paragraph indices that were edited (alias for structural.paragraphsChanged) */
  editedParagraphs?: number[];
  /** Structural significance description */
  structuralSignificance?: string;

  // ── Focused analysis compat (focusedAnalyzer escalation ladder) ───────────
  /** Index of the specific paragraph that was edited */
  editedParagraphIndex?: number;
  /** Index of the specific sentence that was edited */
  editedSentenceIndex?: number;
  /** Connection IDs that touch this paragraph/sentence */
  affectedConnectionIds?: string[];
  /** Conversation context from student */
  conversationContext?: string;
  /** Previous analysis for this paragraph (for delta comparison) */
  previousAnalysis?: AnalysisPassOutput;

  // ── Overflow tracking ─────────────────────────────────────────────────────
  /**
   * True if netChanges was capped (>20 changes). Consumers can use this
   * to know that the full change history was not included in the brief.
   */
  truncated?: boolean;

  // ── W9.3: Cross-version approach context ─────────────────────────────────
  /**
   * Formatted context block describing editing approaches and strategy pattern.
   * Injected into re-analysis and coaching prompts so the system is aware of
   * the student's editing journey (abandoned approaches, current strategy).
   */
  approachContext?: string;
}

// ============================================================================
// GROWTH ENGINE TYPES (V2 — L3.75 Iterative Synthesis)
// ============================================================================

/**
 * UnderstandingQuestion — a question raised by the walk or synthesis
 * that could drive a deep dive investigation.
 */
export interface UnderstandingQuestion {
  /** Unique question ID */
  id: string;
  /** The question text */
  question: string;
  /** What dimension(s) this question touches — routing tags, not closed taxonomy */
  dimensions: string[];
  /** Where in the essay this question is anchored (if paragraph-specific) */
  anchorParagraph?: number;
  /** What discovering the answer would reveal */
  expectedInsight: string;
  /** Which layer/step raised this question */
  source: 'walk' | 'synthesis' | 'deep_dive' | 'coaching' | 'maturity_gap';
  /** Status tracking */
  status: 'open' | 'resolved' | 'filtered';
  /** Resolution (if resolved) */
  resolution?: string;

  // ── Persistent Queue Fields (Gap 2) ──

  /** Priority: LLM-assigned, may change as understanding deepens */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** How many growth iterations this question has survived */
  iterationsSurvived: number;
  /** Parent question ID — if this was spawned from investigating another question */
  parentQuestionId?: string;
  /** Child question IDs — questions spawned from investigating this one */
  spawnedQuestions: string[];
  /** Which growth step answered it (if resolved) */
  resolvedBy?: string;
  /** When this question was first raised (ISO timestamp) */
  raisedAt: string;
  /** When this question was resolved (ISO timestamp, if resolved) */
  resolvedAt?: string;
  /** Which growth iteration first raised this question */
  raisedDuringIteration: number;
}

/**
 * Raw activity record for a single growth step.
 * Pure bookkeeping — NO weighted formula, NO composite score.
 * Presented to L3.75 as context for convergence judgment.
 */
export interface GrowthStepRecord {
  /** Which growth step this records */
  step: string;  // 'synthesis_iter_1', 'deep_dive_voice_authenticity', 'reread_P1'
  /** Raw metrics — what changed (tracking, not scoring) */
  questionsResolved: number;
  questionsRaised: number;
  findingsAdded: number;
  findingsDeepened: number;
  findingsSuperseded: number;
  /** Which holistic sections were updated */
  sectionsUpdated: string[];
  /** Cost of this step */
  cost: number;
  /** LLM-generated one-liner from the step's output: what did this step reveal? */
  discoveryNote: string;
}

/**
 * Growth cycle state — simplified to activity tracking + resource limits.
 * Convergence is L3.75's judgment. System enforces budget + iteration caps only.
 */
export interface GrowthCycleState {
  /** Current iteration (0-based) */
  iteration: number;
  /** Raw activity log — presented to L3.75 for convergence judgment */
  activityLog: GrowthStepRecord[];
  /** Budget remaining in USD */
  budgetRemaining: number;
  /** Budget ceiling for the entire growth cycle */
  budgetCeiling: number;
  /** Whether the cycle has converged */
  isConverged: boolean;
  /** Why it converged (if it did) — only system backstop reasons */
  convergenceReason?: 'budget_exhausted' | 'safety_cap' | 'llm_converged';
}

/**
 * ReadingStrategy — meta-understanding of how to read THIS specific essay.
 * Produced by L3.75 synthesis. Consumed by profile router, coaching, deep dives.
 */
export interface ReadingStrategy {
  /** Meta-understanding of how to read this specific essay */
  strategy: string;
  /** What reading approach yields the deepest understanding */
  bestApproach: string;
  /** What this essay is NOT — prevents misapplied frameworks */
  antiPatterns: string[];
  /**
   * Routing signal for the Profile Router — which profile sections
   * matter most for understanding this essay, in priority order.
   * L3.75 produces this because it KNOWS what dimensions matter.
   * The router uses it directly — no keyword matching needed.
   *
   * Example: ['voiceIdentity', 'voiceMap', 'craftAssessment', 'emotionalTopography']
   */
  contextPriorities: string[];
}

/**
 * QuestionCurationOutput — L3.75's editorial pass on the question queue.
 * Resolves questions it can answer, filters low-quality ones, curates
 * the queue for deep dive dispatch.
 */
export interface QuestionCurationOutput {
  /** Walk questions that L3.75 answered with full-context view */
  resolvedQuestions: Array<{
    questionId: string;
    answer: string;
    evidence: string;
  }>;
  /** Walk questions kept + new questions L3.75 raised, with deep dive recommendations */
  curatedQueue: Array<{
    question: UnderstandingQuestion;
    /** Which deep dive prompt would best investigate this */
    recommendedPrompt: string;
    /** Why this prompt — not just dimension matching, reading-strategy-aware */
    promptRationale: string;
  }>;
  /** Walk questions filtered out (with reason, for transparency and debugging) */
  filteredQuestions: Array<{
    questionId: string;
    filterReason: string;
  }>;
}

/**
 * SynthesisIterationOutput — complete output from one L3.75 growth cycle iteration.
 * Combines synthesis, walk validation, question curation, and convergence signal.
 */
export interface SynthesisIterationOutput {
  /** The holistic sections (same structure as HolisticSynthesisOutput) */
  synthesis: HolisticSynthesisOutput;
  /** Walk validation: disagreements with the walk's reading */
  walkDisagreements: Array<{
    paragraph: number;
    walkReading: string;
    synthesisReading: string;
    confidence: number;
    resolution: 'synthesis_wins' | 'flag_for_reread' | 'preserve_both';
    reasoning: string;
  }>;
  /** Question curation output */
  questionCuration: QuestionCurationOutput;
  /** Reading Strategy — meta-understanding of how to read THIS essay */
  readingStrategy: ReadingStrategy;
  /** Which paragraphs would benefit from re-reading with full context */
  reReadCandidates: Array<{
    paragraph: number;
    reason: string;
    expectedDepthGain: 'significant' | 'moderate';
  }>;
  /** What changed compared to previous iteration (LLM-generated narrative) */
  evolutionNarrative: string;
  /** Self-assessed convergence signal */
  selfAssessedConvergence: {
    hasConverged: boolean;
    reasoning: string;
    /** What would be lost if we stopped here */
    remainingOpportunities: string[];
  };
}

/**
 * StableSynthesisState — tracks which claims are stable vs. evolving
 * across synthesis iterations to prevent drift.
 */
export interface StableSynthesisState {
  /** Core claims that are established and shouldn't change without strong evidence */
  stableCore: {
    /** Claims that have been stable for 2+ iterations */
    confirmedClaims: string[];
    /** Version when each claim was last modified */
    claimVersions: Record<string, number>;
  };
  /** Areas where the synthesis is still evolving */
  refinementZone: {
    /** Claims that changed in the last iteration */
    recentlyChanged: string[];
    /** Claims flagged as uncertain by the LLM */
    uncertain: string[];
  };
}

/**
 * Deep dive request — assembled by the dispatch function for the deep dive runner.
 */
export interface DeepDiveRequest {
  /** The question being investigated */
  question: UnderstandingQuestion;
  /** Which deep dive prompt template to use */
  promptType: string;
  /** Why this prompt was chosen */
  rationale: string;
  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Deep dive result — output from a single deep dive investigation.
 */
export interface DeepDiveResult {
  /** The prompt type that was used */
  promptType: string;
  /** New findings discovered */
  findings: Array<{
    claim: string;
    scope: FindingScope;
    maturity: FindingMaturity;
    maturityReasoning: string;
    coachingValue: FindingCoachingValue;
    dimensions: HolisticDimension[];
    evidence: FindingEvidence[];
    deepeningPotential: string | null;
    raisesQuestions: string[];
    buildsOn?: string[];
    relatedTo?: string[];
  }>;
  /** New questions raised by the deep dive */
  questionsRaised: UnderstandingQuestion[];
  /** LLM-generated discovery note */
  discoveryNote: string;
  /** Cost in USD */
  cost: number;
  /** Token usage */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Timing in ms */
  timingMs: number;
}

/**
 * Re-read result — output from a targeted paragraph re-read with full context.
 */
export interface ReReadResult {
  /** Which paragraph was re-read */
  paragraphIndex: number;
  /** Updated paragraph understanding */
  updatedUnderstanding: ParagraphUnderstanding;
  /** Updated sentence understandings */
  updatedSentences: Array<{
    index: number;
    understanding: SentenceUnderstanding;
  }>;
  /** New findings from the re-read */
  findings: Array<{
    claim: string;
    scope: FindingScope;
    maturity: FindingMaturity;
    maturityReasoning: string;
    coachingValue: FindingCoachingValue;
    dimensions: HolisticDimension[];
    evidence: FindingEvidence[];
    deepeningPotential: string | null;
    raisesQuestions: string[];
    buildsOn?: string[];
    relatedTo?: string[];
  }>;
  /** New connections discovered */
  newConnections: Array<{
    from: ConnectionEndpoint;
    to: ConnectionEndpoint;
    description: string;
    reverseIllumination: string | null;
    significance: string;
    strengthCategory: ConnectionStrengthCategory;
    directionality: ConnectionDirectionality;
  }>;
  /** What the re-read revealed that the walk missed */
  discoveryNote: string;
  /** Cost in USD */
  cost: number;
  /** Token usage */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Timing in ms */
  timingMs: number;
}

/**
 * Deep dive prompt template — stored in the prompt library.
 */
export interface DeepDivePromptTemplate {
  /** Unique prompt type identifier */
  type: string;
  /** Human-readable name */
  name: string;
  /** Which domain(s) this prompt investigates */
  domains: string[];
  /** The focus text that describes what this deep dive investigates */
  focusDescription: string;
  /** Which profile sections this prompt needs as context */
  requiredContext: string[];
  /** Estimated cost in USD per call */
  estimatedCost: number;
  /** The system prompt template (with {placeholders}) */
  systemPrompt: string;
  /** The user prompt template (with {placeholders}) */
  userPrompt: string;
}

/**
 * EditUnderstandingOutput — wrapper for EditUnderstanding results
 * used by the coordinator's applyEditUnderstanding method.
 */
export interface EditUnderstandingOutput {
  /** The mechanical diff */
  diff: EditDiff;
  /** The LLM's understanding of what the edit means */
  understanding: EditUnderstanding;
  /** Pre-computed staleness effects based on the edit */
  stalenessEffects: StalenessEffect[];
  /** Whether this edit triggered from focused or comprehensive analysis */
  analysisMode: 'focused' | 'comprehensive';
}

// ─── L5 Annotation Types ────────────────────────────────────────────────────

/** L5 annotation routing type — simplified from V1's 4 verbose types */
export type L5AnnotationType = 'strength' | 'growth' | 'structural' | 'teaching';

/** Teaching mode for L5 annotations — LLM-selected per annotation based on what the finding needs */
export type L5TeachingMode = 'awareness' | 'consequence' | 'connection' | 'action';

/** Annotation density diagnostic — signal about paragraph complexity, not a problem to fix */
export interface AnnotationDensityDiagnostic {
  paragraphIndex: number;
  annotationCount: number;
  strengthCount: number;
  growthCount: number;
  /**
   * LLM-generated interpretation of the density pattern.
   * Not computed from counts — the LLM assesses what the density means.
   */
  interpretation: string;
}

/**
 * Context from previous annotation run, passed during re-analysis.
 * Allows L5 to acknowledge edits, deepen still-relevant annotations,
 * and avoid verbatim repetition.
 */
export interface PriorAnnotationContext {
  /** Summary of previous annotations for this paragraph */
  priorAnnotations: Array<{
    content: string;
    type: string;
    teachingMode: string;
    /** Whether the student's edit addressed this annotation */
    addressedByEdit: boolean;
  }>;
}

// ============================================================================
// VERSION BRANCHING TYPES (Improvement #10 — Snapshot + Compare)
// ============================================================================

/**
 * What triggered a snapshot's creation.
 */
export type SnapshotSource =
  | 'student_manual'      // Student explicitly asked to save a snapshot
  | 'coach_suggested'     // Coach suggested saving before a major change
  | 'auto_before_rewrite' // System auto-saved before a detected major rewrite
  | 'auto_milestone';     // System auto-saved at a growth milestone

/**
 * SnapshotUnderstanding — frozen understanding state at snapshot time.
 *
 * Deep copies of all understanding-layer data. Excludes operational state
 * (growth cycle logs, cost tracking, session memory).
 */
export interface SnapshotUnderstanding {
  /** North Star through-line summary at snapshot time */
  northStarThroughLine: string | null;

  /** North Star structural roles (paragraph → role mapping) */
  northStarStructuralRoles: Array<{
    paragraphIndex: number;
    role: string;
    significance: 'load_bearing' | 'supporting' | 'transitional';
  }>;

  /** Per-paragraph understanding (deep copy) — null entries for unwalked paragraphs */
  paragraphUnderstandings: Array<{
    paragraphIndex: number;
    understanding: ParagraphUnderstanding | null;
    text: string;
  }>;

  /** Active findings at snapshot time (deep copy from FindingStore) */
  findings: Finding[];

  /** Active connections at snapshot time (deep copy) */
  connections: Connection[];

  /** Connection graph summary prose */
  connectionGraphSummary: string;

  /**
   * Holistic sections snapshot — Record keyed by section name.
   * Values are deep copies of the profile's holistic sections.
   * Using Record<string, unknown> because these are passed to LLM as context,
   * not operated on programmatically by the snapshot system.
   */
  holisticSections: Record<string, unknown>;

  /** Active questions from the growth engine */
  questionQueue: UnderstandingQuestion[];

  /** Understanding maturity / confidence level */
  maturity: ConfidenceLevel;

  /** Reading strategy from L3.75 synthesis (null if not yet produced) */
  readingStrategy: ReadingStrategy | null;

  /** Improvement phase at snapshot time (null if not yet assessed) */
  improvementPhase: ImprovementPhase | null;
}

/**
 * EssaySnapshot — a frozen point-in-time capture of essay state.
 * Immutable once created. Text + understanding are preserved as deep copies.
 */
export interface EssaySnapshot {
  /** Unique snapshot ID (e.g., 'snap-1', 'snap-2') */
  id: string;

  /** Human-readable name, either student-provided or auto-generated */
  name: string;

  /** ISO timestamp when this snapshot was created */
  createdAt: string;

  /** What prompted the snapshot — LLM-described or system-described context */
  context: string;

  /** The essay text at snapshot time — frozen */
  text: string;

  /** The paragraph count at snapshot time (for structural comparison) */
  paragraphCount: number;

  /** Understanding state at snapshot time — deep copies, not references */
  understanding: SnapshotUnderstanding;

  /** Source — what triggered the snapshot */
  source: SnapshotSource;

  /** If this snapshot was auto-suggested, the trigger description */
  autoTrigger?: string;

  /** Parent snapshot ID, if this is a snapshot-of-a-snapshot (nesting) */
  parentSnapshotId?: string;
}

/**
 * SnapshotComparison — the LLM's comparative analysis of two versions.
 * Pure LLM output with no deterministic scoring.
 */
export interface SnapshotComparison {
  /** The snapshot being compared to */
  snapshotId: string;

  /** The snapshot name */
  snapshotName: string;

  /** ISO timestamp when the comparison was generated */
  comparedAt: string;

  /**
   * The comparative analysis — LLM-generated prose.
   * NOT a score. NOT a recommendation. A nuanced comparison
   * that helps the student understand what each version does.
   */
  analysis: string;

  /**
   * Per-paragraph understanding deltas — where understanding diverged.
   * Only paragraphs where understanding MEANINGFULLY changed.
   */
  paragraphDeltas: Array<{
    paragraph: number;
    /** Did the text change? */
    textChanged: boolean;
    /** Did the understanding change? (can be no even if text changed) */
    understandingChanged: boolean;
    /** What changed in understanding, if anything */
    understandingDelta: string | null;
    /** Which version serves the essay better for THIS paragraph, and why */
    assessment: string;
  }>;

  /**
   * Structural comparison — did the essay's connection architecture change?
   */
  structuralDelta: {
    /** Connections present in snapshot but not current */
    lostConnections: Array<{ id: string; description: string; significance: string }>;
    /** Connections present in current but not snapshot */
    gainedConnections: Array<{ id: string; description: string; significance: string }>;
    /** Connections present in both but changed */
    changedConnections: Array<{ id: string; changeDescription: string }>;
    /** Overall architectural assessment */
    architecturalAssessment: string;
  };

  /**
   * Finding comparison — what understanding diverged?
   */
  findingDelta: {
    /** Findings that exist in current but not snapshot */
    newFindings: string[];
    /** Findings in snapshot that were superseded in current */
    supersededFindings: Array<{
      snapshotFindingId: string;
      currentSuccessor: string;
      reason: string;
    }>;
    /** Findings that exist in both but at different maturity levels */
    maturityDifferences: Array<{
      findingId: string;
      snapshotMaturity: FindingMaturity;
      currentMaturity: FindingMaturity;
    }>;
  };

  /**
   * Coaching implications — what does this comparison mean for coaching?
   * LLM-generated prose for the coach to guide the student.
   */
  coachingImplications: string;
}

// ============================================================================
// DELTA CONTRACT (orphan-diagnostic enforcement)
// ============================================================================

/**
 * Delta — the foundation of the "Delta Contract" architectural invariant.
 *
 * Every diagnostic the Essay Intelligence system produces MUST bind to either
 * (a) a specific essay edit (`essayChange`) or (b) a specific change in coach
 * behavior (`coachingChange`). A Delta with BOTH fields null is an "orphan
 * diagnostic" — an observation with no path to changing the essay or the
 * session — and is rejected at manifest-build time.
 *
 * Rationale: pre-contract, every layer emitted `Observation[]` with no schema-
 * level enforcement that observations bind to actions. The April 14 audit
 * found ~41% of paid LLM output never reached the student because nothing
 * downstream consumed it. The Delta Contract makes the binding a type-level
 * requirement: if the adapter can't derive an essay edit or a coach-prompt
 * injection, validation fails loudly instead of silently dropping the item.
 *
 * Consumed by: `deltaContract.ts` (validator + adapter), analysisOrchestrator
 * (build-time assertion), future migrations of coach/howler/AO layers.
 */
export interface Delta {
  /** The diagnostic statement — what the system noticed. */
  observation: string;

  /**
   * Bound essay edit. When present, the system is prescribing a concrete
   * text transformation on the student's essay. `paragraph: -1` signals
   * essay-level (e.g., global reordering, title change).
   *
   * `kind`:
   *  - 'replace'          — swap `before` → `after` (both non-empty)
   *  - 'insert'           — add `after` at a position (`before` empty)
   *  - 'delete'           — remove `before` (`after` empty)
   *  - 'rewrite_paragraph'— whole-paragraph replacement
   */
  essayChange: {
    paragraph: number;
    before: string;
    after: string;
    kind: 'replace' | 'insert' | 'delete' | 'rewrite_paragraph';
  } | null;

  /**
   * Bound coaching behaviour change. When present, the system is prescribing
   * a modification to the next coach prompt. `promptInjection` is the literal
   * text to append; `gateName` identifies which test gate validates the
   * effect (e.g., 'technique_fire', 'howler_surface').
   */
  coachingChange: {
    promptInjection: string;
    gateName: string;
  } | null;

  /** One transferable craft idea the student should take away. ≤25 words. */
  studentTakeaway: string;

  /** 1-based turn number by which this delta must have surfaced. */
  surfaceByTurn: number;

  /** Bypass coaching-rotation if true (used for red_flag / force-promote). */
  forceSurface: boolean;

  /** Condition under which this delta becomes stale / should be discarded. */
  killCriteria: string;

  /**
   * Which layer emitted the source finding. Values match existing
   * ImprovementEntry.source tags plus howler/ao_first_read identifiers:
   *   'L3' | 'L3.75' | 'L3.5' | 'L4' | 'L5' | 'howler' | 'ao_first_read'
   * Typed as `string` to stay forward-compatible with new layers.
   */
  sourceLayer: string;

  /** Provenance ref into the originating store (finding id, annotation id…). */
  sourceRef: string | null;
}

// ============================================================================
// REVISION HISTORY (Phase 1 — cross-session snapshot chain)
// ============================================================================
// Types live in `./history/profileSnapshot.ts` (pure types + extraction).
// Re-exported here so consumers use the central profileTypes hub.

export type {
  ProfileSnapshot,
  SnapshotFinding,
  SnapshotFindingSeverity,
  SnapshotFindingMaturity,
  VoiceIdentitySnapshot,
  VividnessSignal,
  RevisionResetSignal,
  RevisionHistory,
} from './history/profileSnapshot';

// PIQPromptType re-exported for ProfileIndex.piqPromptType consumers.
export type { PIQPromptType } from '../piq/types';
