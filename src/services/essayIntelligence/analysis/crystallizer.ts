/**
 * Crystallizer — Layer 4: North Star + Paragraph Score Matrix + Coherence Report
 *
 * Single Sonnet call that reads the complete profile (understanding + holistic synthesis
 * + analysis) and produces three artifacts that no earlier layer creates:
 *
 *   1. EssayNorthStar — the architecture of meaning (NOT a summary).
 *      Scaled by essay type:
 *        - Supplement: 2 dims (structuralRolesMap + distinctivenessSignature)
 *        - PIQ: 3 dims (+ trajectory)
 *        - Personal statement: all 5 dims (+ throughLineMap + intentBridge)
 *
 *   2. ParagraphScoreMatrix — multi-dimensional per-paragraph scoring.
 *      5 dimensions: effectiveness (from L3.5), structural, voice, emotional, thematic.
 *      Plus cross-paragraph patterns and prioritized improvements referencing North Star.
 *
 *   3. CoherenceReport — contradictions detected ACROSS profile sections.
 *      Cross-checks holistic synthesis claims against analysis data, voice map against
 *      earnedness map, structural roles against score matrix, etc.
 *
 * The North Star is an EMERGENT PROPERTY: an interpretive synthesis that doesn't exist
 * in any individual profile section. If you deleted it, you'd lose understanding that
 * requires re-reading the entire profile holistically. It is NOT lossy compression.
 *
 * Consumed by: L5 annotations (structural significance), L6 coaching (phase-aware),
 *              edit interpretation (structural role context), portfolio strategy,
 *              re-analysis brief (structural significance of changed areas).
 *
 * Spec: docs/plan-sections/02-layer-specs.md (L4 section)
 *       docs/plan-sections/01-essay-profile-types.md (North Star types)
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { ProfileRouter } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { FindingStore, buildFindingContext } from '../findings';
import { ConnectionGraph, buildHolisticConnectionContext } from '../connections';
import { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import { PipelineError } from '../errors';
import { buildScoreMatrixAnchorsBlock } from './scoreMatrixAnchors';
import {
  isCorpusRetrievalEnabledForL4,
  createTelemetry,
  retrievePhaseArchetypes,
  retrieveAnchorMoves,
  buildPhaseArchetypesBlock,
  buildCorpusMovesBlock,
  estimateBlockTokens,
  detectFabricatedReferences,
  type CorpusRetrievalTelemetry,
} from './corpusRetrievalBlocks';
import { buildCorpusTelemetryRecord, persistCorpusTelemetry } from './corpusTelemetryPersistence';
import type {
  EssayProfile,
  EssayType,
  EssayNorthStar,
  NorthStarScale,
  NorthStarConfidence,
  ThroughLineMap,
  ThroughLineElementType,
  NarrativeMove,
  StructuralRole,
  StructuralWeight,
  EssayTrajectory,
  DistinctivenessSignature,
  IntentBridge,
  ParagraphScoreEntry,
  ParagraphScoreMatrix,
  CoherenceIssue,
  CoherenceReport,
  CoachingMap,
  NorthStarEvolution,
  NorthStarAssessment,
  ImprovementCandidate,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const HAIKU = 'claude-haiku-4-5-20251001';

/**
 * L4a (legacy combined): North Star + Score Matrix in a single call.
 * Replaced by two focused sequential calls — kept for reference.
 */
// const L4A_MAX_OUTPUT_TOKENS = 6000;
// const L4A_TIMEOUT_MS = 180_000;

/**
 * L4a-NorthStar: Focused call for the North Star only.
 * Smaller output budget → reliably completes within Anthropic's server timeout.
 */
const L4A_NORTH_STAR_MAX_TOKENS = 3500;
const L4A_NORTH_STAR_TIMEOUT_MS = 120_000;

/**
 * L4a-ScoreMatrix: Focused call for the Paragraph Score Matrix only.
 * Receives the North Star as calibration context.
 */
const L4A_SCORE_MATRIX_MAX_TOKENS = 3500;
const L4A_SCORE_MATRIX_TIMEOUT_MS = 120_000;

/**
 * L4b: Interpretive layer — prioritizedImprovements + coachingMap + coherenceReport.
 * Receives L4a output as context. NON-FATAL — graceful degradation on failure.
 */
const L4B_MAX_OUTPUT_TOKENS = 6000;
const L4B_TIMEOUT_MS = 180_000;

/** Max tokens for the adversarial contradiction pass */
const ADVERSARIAL_MAX_TOKENS = 4000;

/** Temperature — low for deterministic synthesis, slight creativity for interpretation */
const TEMPERATURE = 0.3;

// ============================================================================
// L4 OUTPUT TYPES (ParagraphScoreEntry, ParagraphScoreMatrix, CoherenceIssue,
//   CoherenceReport are defined in profileTypes.ts — imported above)
// ============================================================================

/**
 * L4CrystallizationResult — the complete output of the crystallization layer.
 */
export interface L4CrystallizationResult {
  northStar: EssayNorthStar;
  scoreMatrix: ParagraphScoreMatrix;
  coherenceReport: CoherenceReport;
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
  /** Cost of the adversarial Haiku pass (if it ran) */
  adversarialCost?: number;
  /** Timing of the adversarial Haiku pass (if it ran) */
  adversarialTimingMs?: number;
  /** L4a (North Star + Score Matrix core) timing in ms */
  l4aTimingMs?: number;
  /** L4b (Coaching Map + Coherence Report) timing in ms */
  l4bTimingMs?: number;
  /** True if L4b failed and result has degraded coachingMap/coherenceReport */
  l4bDegraded?: boolean;
}

// ============================================================================
// ESSAY TYPE → NORTH STAR SCALE MAPPING
// ============================================================================

/**
 * Maps EssayType (DB enum) to NorthStarScale (profile enum).
 * common_app is a personal statement — full 5 dimensions.
 */
function essayTypeToScale(essayType: EssayType): NorthStarScale {
  switch (essayType) {
    case 'common_app':
      return 'personal_statement';
    case 'supplement':
      return 'supplement';
    case 'piq':
      return 'piq';
  }
}

/**
 * Which North Star dimensions are active for each scale.
 * Authoritative source — matches NorthStarMutator's ACTIVE_DIMENSIONS.
 */
const ACTIVE_DIMENSIONS: Record<NorthStarScale, readonly string[]> = {
  supplement: ['structuralRolesMap', 'distinctivenessSignature'],
  piq: ['throughLineMap', 'structuralRolesMap', 'distinctivenessSignature', 'trajectory'],
  personal_statement: [
    'throughLineMap',
    'structuralRolesMap',
    'trajectory',
    'distinctivenessSignature',
    'intentBridge',
  ],
} as const;

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

/**
 * LEGACY: Build the combined L4a system prompt — North Star + Score Matrix in one call.
 * Kept for reference. The active code uses buildSystemPromptL4aNorthStar + buildSystemPromptL4aScoreMatrix.
 */
function buildSystemPromptL4aCombined(scale: NorthStarScale, essayType?: EssayType): string {
  const activeDims = ACTIVE_DIMENSIONS[scale];

  // W3.2: Essay-type-aware scoring calibration guidance
  const scoringCalibration = essayType === 'supplement'
    ? `\n   ESSAY-TYPE CALIBRATION (supplement — short essay):
   Short essays have simpler structural expectations. A 3-paragraph supplement achieving focused impact
   is at the SAME quality level as a 5-paragraph personal statement with full structural complexity.
   Do NOT penalize supplements for lacking:
   - Complex multi-paragraph arcs (a single-turn narrative is structurally valid for 150-250 words)
   - Multiple thematic threads (one well-developed thread is sufficient)
   - Emotional build-up and release (concentrated emotion is appropriate)
   Structural and thematic scores should reflect how well the essay achieves its scale-appropriate goals.\n`
    : essayType === 'piq'
    ? `\n   ESSAY-TYPE CALIBRATION (PIQ — medium essay):
   PIQs (~350 words) should demonstrate moderate structural development.
   Expect 2-3 clear sections with purposeful transitions. Thematic depth should be proportional
   to length — a focused exploration of one insight is often stronger than scattered breadth.
   Score structural dimensions against PIQ-appropriate expectations, not personal-statement complexity.\n`
    : '';

  return `You are the Crystallizer — a literary-architectural analyst who reads a complete essay profile and produces the structural core of the crystallization: the North Star and the Paragraph Score Matrix.

YOUR TWO OUTPUTS:

1. ESSAY NORTH STAR — the architecture of meaning.
   NOT a summary. A summary is lossy compression — everything in it exists more deeply elsewhere.
   The North Star is an EMERGENT PROPERTY — an interpretive synthesis that transcends any individual profile section.
   Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence understanding) or tuning assessment (analysis). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument.

   Active dimensions for this ${scale} essay: ${activeDims.join(', ')}

${activeDims.includes('throughLineMap') ? `   THROUGH-LINE MAP (personal statements and PIQs):
   Trace the central element's MEANING transformation — not its physical appearances.
   BAD: "The diamond appears in P1, P3, and P5."
   GOOD: "The diamond's signification transforms: P1 establishes it as commodity (pawnshop appraisal), P3 reframes it as inheritance (grandmother's ring), P5 claims it as identity marker (refusal to sell = refusal to reduce self to market value)."
   The connection graph already tracks WHERE things appear. The through-line traces HOW MEANING CHANGES.

   Required fields:
   - centralElement: the element being traced
   - elementType: "image" | "question" | "tension" | "metaphor" | "relationship" | "idea"
   - transformation: the overall meaning journey in one sentence
   - journey: array of { location: { paragraph, sentence? }, meaningAtPoint, narrativeMove }
     narrativeMove must be: "introduction" | "development" | "submersion" | "resurfacing" | "transformation" | "resolution" | "complication" | "echo"
   - connectionRefs: IDs from the connection graph that constitute this through-line` : ''}

   STRUCTURAL ROLES MAP (all essay types):
   What each section IS in the architecture of meaning — structural necessity, not topic.
   BAD: "P1 introduces the topic. P2 provides background. P3 makes the point."
   GOOD: "P1 frames the economic lens that makes P3's emotional stakes calculable, P2 populates the world the lens examines, P3 is the fulcrum where market-value logic encounters irreducible personal value."
   Ask: "If I removed this section, what architectural load would be unsupported?"

   Required fields per role:
   - paragraphs: number[] (which paragraphs this role covers)
   - role: string (architectural role name)
   - significance: string (WHY this role matters)
   - weight: "load_bearing" | "supporting" | "transitional" | "decorative"

${activeDims.includes('trajectory') ? `   TRAJECTORY (PIQ + personal statements):
   Where the essay IS and where it COULD go — ALWAYS multiple plausible paths.
   The student decides; you map options with honest assessment of text support.

   Required fields:
   - currentState: assessment of where the essay stands
   - plausiblePaths: array of { description, textSupport: "strong"|"moderate"|"speculative", requirements: string[] }
   - unrealizedConnections: array of { description, locations: [paragraph, sentence][] }` : ''}

   DISTINCTIVENESS SIGNATURE (all essay types):
   What makes this essay NON-INTERCHANGEABLE.
   If your signature could describe any essay about [topic], it's not specific enough.
   BAD: "This essay uniquely combines personal narrative with thematic depth."
   GOOD: "Uses pawnshop economics to dramatize the gap between market value and inherited value — the specific structural choice of opening with an appraisal makes the grandmother's ring both literally and figuratively priceable, which is what gives the refusal-to-sell its force."
   The distinctiveness must be specific to THIS essay's EXECUTION, not its topic.

   Required fields:
   - articulation: one-paragraph statement of what makes it unique
   - entanglementRefs: string[] (IDs of cross-dimension entanglements that evidence this)
   - nonInterchangeableFactors: string[] (specific, not categorical)

${activeDims.includes('intentBridge') ? `   INTENT BRIDGE (personal statements):
   The system's reading alongside the student's stated intent (null until L6 conversation).
   Divergences are coaching opportunities, not problems.

   Required fields:
   - studentIntent: null (not yet populated — L6 conversation will fill this)
   - systemReading: what the system reads the essay as doing
   - alignments: array of { aspect, alignment: "confirmed"|"partial"|"divergent"|"student_unaware", detail }
   - sourceInsightIds: [] (empty until L6)` : ''}

   North Star confidence: "hypothesis" for first analysis, "emerging" after re-analysis,
   "full" after deep re-analysis, "student_confirmed" only after L6 student confirms.
   For a first-time crystallization, use "hypothesis".

2. PARAGRAPH SCORE MATRIX — multi-dimensional per-paragraph scoring.
   5 dimensions per paragraph, each 0-100:
   - effectiveness: TRANSFER directly from the paragraph analysis effectiveness score provided
   - structural: how well this paragraph fulfills its architectural role (from your North Star structural roles)
   - voice: voice consistency/intentional variation quality relative to the essay's dominant voice
   - emotional: emotional depth, authenticity, and earned-ness of significant moments
   - thematic: contribution to the through-line and themes

   CALIBRATION: Use the L3.5 effectiveness scores as your anchor. The other 4 dimensions should be
   calibrated relative to the same scale. A paragraph with 75 effectiveness and 90 structural means
   its execution underperforms its architectural importance — that tension is diagnostic.
${scoringCalibration}
   ANTI-CLUSTERING PROTOCOL (W3.3 — mandatory):
   Before assigning scores, you MUST:
   1. FORCED RANKING: For each of the 4 new dimensions (structural, voice, emotional, thematic),
      rank ALL paragraphs from strongest to weakest BEFORE assigning any score.
   2. WITHIN-PARAGRAPH RANGE: Each paragraph's 4 new dimension scores (structural, voice, emotional,
      thematic) must span at least 15 points. If a paragraph truly excels equally in all dimensions,
      document your reasoning explicitly.
   3. CROSS-PARAGRAPH RANGE: For each of the 4 new dimensions, the range across all paragraphs must
      be at least 20 points. The best paragraph and worst paragraph in voice (or any dimension)
      MUST differ by 20+ points.
   4. FULL-RANGE ANCHORS: Calibrate using the full 0-100 scale:
      - 90+: This paragraph is among the best you've seen for this dimension
      - 70-89: Genuinely strong — does something distinctive
      - 50-69: Functional — does its job without distinction
      - 30-49: Weak — significant room for improvement
      - Below 30: Actively problematic for this dimension
      If all paragraphs cluster in the 70-85 range for any dimension, you have FAILED to differentiate.

   verdict: A single sentence capturing the paragraph's architectural assessment.
   BAD: "Good paragraph with strong writing."
   GOOD: "Carries the essay's emotional load but underearns P4's revelation by telling rather than showing the grandmother's gesture."

   priorityForImprovement: 1 (fine) to 5 (urgent). Load-bearing paragraphs with low scores get highest priority.

   crossParagraphPatterns: Max 3 items, each ≤15 words. Single-line observations across paragraphs.
   Example: "P1-P4: emotional intensity builds linearly — no dip before climax reduces earned weight".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce long prose.

Do NOT produce prioritizedImprovements, coachingMap, or coherenceReport — those are produced in a follow-up analysis call.

OUTPUT FORMAT:
Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "northStar": {
    "activeScale": "${scale}",
${activeDims.includes('throughLineMap') ? `    "throughLineMap": { "centralElement": "...", "elementType": "...", "transformation": "...", "journey": [...], "connectionRefs": [...] },` : `    "throughLineMap": null,`}
    "structuralRolesMap": [...],
${activeDims.includes('trajectory') ? `    "trajectory": { "currentState": "...", "plausiblePaths": [...], "unrealizedConnections": [...] },` : `    "trajectory": null,`}
    "distinctivenessSignature": { "articulation": "...", "entanglementRefs": [...], "nonInterchangeableFactors": [...] },
${activeDims.includes('intentBridge') ? `    "intentBridge": { "studentIntent": null, "systemReading": "...", "alignments": [...], "sourceInsightIds": [] },` : `    "intentBridge": null,`}
    "confidence": "hypothesis",
    "lastUpdatedBy": "L4"
  },
  "scoreMatrix": {
    "paragraphs": [
      {
        "index": 0,
        "scores": { "effectiveness": <from L3.5>, "structural": <0-100>, "voice": <0-100>, "emotional": <0-100>, "thematic": <0-100> },
        "verdict": "...",
        "priorityForImprovement": <1-5>
      }
    ],
    "crossParagraphPatterns": ["..."]
  }
}`;
}

/**
 * Build the L4a-NorthStar system prompt — focused on the Essay North Star only.
 * Extracted from the combined L4a prompt. Does NOT ask for Score Matrix.
 */
function buildSystemPromptL4aNorthStar(scale: NorthStarScale, _essayType?: EssayType): string {
  const activeDims = ACTIVE_DIMENSIONS[scale];

  return `You are the Crystallizer — a literary-architectural analyst who reads a complete essay profile and produces the essay's North Star: its architecture of meaning.

YOUR OUTPUT:

ESSAY NORTH STAR — the architecture of meaning.
NOT a summary. A summary is lossy compression — everything in it exists more deeply elsewhere.
The North Star is an EMERGENT PROPERTY — an interpretive synthesis that transcends any individual profile section.
Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence understanding) or tuning assessment (analysis). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument.

Active dimensions for this ${scale} essay: ${activeDims.join(', ')}

${activeDims.includes('throughLineMap') ? `THROUGH-LINE MAP (personal statements and PIQs):
Trace the central element's MEANING transformation — not its physical appearances.
BAD: "The diamond appears in P1, P3, and P5."
GOOD: "The diamond's signification transforms: P1 establishes it as commodity (pawnshop appraisal), P3 reframes it as inheritance (grandmother's ring), P5 claims it as identity marker (refusal to sell = refusal to reduce self to market value)."
The connection graph already tracks WHERE things appear. The through-line traces HOW MEANING CHANGES.

Required fields:
- centralElement: the element being traced
- elementType: "image" | "question" | "tension" | "metaphor" | "relationship" | "idea"
- transformation: the overall meaning journey in one sentence
- journey: array of { location: { paragraph, sentence? }, meaningAtPoint, narrativeMove }
  narrativeMove must be: "introduction" | "development" | "submersion" | "resurfacing" | "transformation" | "resolution" | "complication" | "echo"
- connectionRefs: IDs from the connection graph that constitute this through-line` : ''}

STRUCTURAL ROLES MAP (all essay types):
What each section IS in the architecture of meaning — structural necessity, not topic.
BAD: "P1 introduces the topic. P2 provides background. P3 makes the point."
GOOD: "P1 frames the economic lens that makes P3's emotional stakes calculable, P2 populates the world the lens examines, P3 is the fulcrum where market-value logic encounters irreducible personal value."
Ask: "If I removed this section, what architectural load would be unsupported?"

Required fields per role:
- paragraphs: number[] (which paragraphs this role covers)
- role: string (architectural role name)
- significance: string (WHY this role matters)
- weight: "load_bearing" | "supporting" | "transitional" | "decorative"

${activeDims.includes('trajectory') ? `TRAJECTORY (PIQ + personal statements):
Where the essay IS and where it COULD go — ALWAYS multiple plausible paths.
The student decides; you map options with honest assessment of text support.

Required fields:
- currentState: assessment of where the essay stands
- plausiblePaths: array of { description, textSupport: "strong"|"moderate"|"speculative", requirements: string[] }
- unrealizedConnections: array of { description, locations: [paragraph, sentence][] }` : ''}

DISTINCTIVENESS SIGNATURE (all essay types):
What makes this essay NON-INTERCHANGEABLE.
If your signature could describe any essay about [topic], it's not specific enough.
BAD: "This essay uniquely combines personal narrative with thematic depth."
GOOD: "Uses pawnshop economics to dramatize the gap between market value and inherited value — the specific structural choice of opening with an appraisal makes the grandmother's ring both literally and figuratively priceable, which is what gives the refusal-to-sell its force."
The distinctiveness must be specific to THIS essay's EXECUTION, not its topic.

Required fields:
- articulation: one-paragraph statement of what makes it unique
- entanglementRefs: string[] (IDs of cross-dimension entanglements that evidence this)
- nonInterchangeableFactors: string[] (specific, not categorical)

${activeDims.includes('intentBridge') ? `INTENT BRIDGE (personal statements):
The system's reading alongside the student's stated intent (null until L6 conversation).
Divergences are coaching opportunities, not problems.

Required fields:
- studentIntent: null (not yet populated — L6 conversation will fill this)
- systemReading: what the system reads the essay as doing
- alignments: array of { aspect, alignment: "confirmed"|"partial"|"divergent"|"student_unaware", detail }
- sourceInsightIds: [] (empty until L6)` : ''}

North Star confidence: "hypothesis" for first analysis, "emerging" after re-analysis,
"full" after deep re-analysis, "student_confirmed" only after L6 student confirms.
For a first-time crystallization, use "hypothesis".

OUTPUT FORMAT:
Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "northStar": {
    "activeScale": "${scale}",
${activeDims.includes('throughLineMap') ? `    "throughLineMap": { "centralElement": "...", "elementType": "...", "transformation": "...", "journey": [...], "connectionRefs": [...] },` : `    "throughLineMap": null,`}
    "structuralRolesMap": [...],
${activeDims.includes('trajectory') ? `    "trajectory": { "currentState": "...", "plausiblePaths": [...], "unrealizedConnections": [...] },` : `    "trajectory": null,`}
    "distinctivenessSignature": { "articulation": "...", "entanglementRefs": [...], "nonInterchangeableFactors": [...] },
${activeDims.includes('intentBridge') ? `    "intentBridge": { "studentIntent": null, "systemReading": "...", "alignments": [...], "sourceInsightIds": [] },` : `    "intentBridge": null,`}
    "confidence": "hypothesis",
    "lastUpdatedBy": "L4"
  }
}

`;
}

/**
 * Build the L4a-ScoreMatrix system prompt — focused on the Paragraph Score Matrix only.
 * Extracted from the combined L4a prompt. Receives the North Star as calibration context.
 */
function buildSystemPromptL4aScoreMatrix(scale: NorthStarScale, essayType?: EssayType): string {
  // W3.2: Essay-type-aware scoring calibration guidance
  const scoringCalibration = essayType === 'supplement'
    ? `\n   ESSAY-TYPE CALIBRATION (supplement — short essay):
   Short essays have simpler structural expectations. A 3-paragraph supplement achieving focused impact
   is at the SAME quality level as a 5-paragraph personal statement with full structural complexity.
   Do NOT penalize supplements for lacking:
   - Complex multi-paragraph arcs (a single-turn narrative is structurally valid for 150-250 words)
   - Multiple thematic threads (one well-developed thread is sufficient)
   - Emotional build-up and release (concentrated emotion is appropriate)
   Structural and thematic scores should reflect how well the essay achieves its scale-appropriate goals.\n`
    : essayType === 'piq'
    ? `\n   ESSAY-TYPE CALIBRATION (PIQ — medium essay):
   PIQs (~350 words) should demonstrate moderate structural development.
   Expect 2-3 clear sections with purposeful transitions. Thematic depth should be proportional
   to length — a focused exploration of one insight is often stronger than scattered breadth.
   Score structural dimensions against PIQ-appropriate expectations, not personal-statement complexity.\n`
    : '';

  return `You are the Crystallizer's scoring engine — you read a complete essay profile and the essay's North Star (provided below as calibration context) and produce the Paragraph Score Matrix.

You are provided the essay's North Star as calibration context. Use its structural roles and through-line to inform your scoring — each paragraph's structural score should reflect how well it fulfills the architectural role assigned by the North Star.

YOUR OUTPUT:

PARAGRAPH SCORE MATRIX — multi-dimensional per-paragraph scoring.
5 dimensions per paragraph, each 0-100:
- effectiveness: TRANSFER directly from the paragraph analysis effectiveness score provided
- structural: how well this paragraph fulfills its architectural role (from the North Star structural roles)
- voice: voice consistency/intentional variation quality relative to the essay's dominant voice
- emotional: emotional depth, authenticity, and earned-ness of significant moments
- thematic: contribution to the through-line and themes

CALIBRATION: Use the L3.5 effectiveness scores as your anchor. The other 4 dimensions should be
calibrated relative to the same scale. A paragraph with 75 effectiveness and 90 structural means
its execution underperforms its architectural importance — that tension is diagnostic.
${scoringCalibration}
ANTI-CLUSTERING PROTOCOL (W3.3 — mandatory):
Before assigning scores, you MUST:
1. FORCED RANKING: For each of the 4 new dimensions (structural, voice, emotional, thematic),
   rank ALL paragraphs from strongest to weakest BEFORE assigning any score.
2. WITHIN-PARAGRAPH RANGE: Each paragraph's 4 new dimension scores (structural, voice, emotional,
   thematic) must span at least 15 points. If a paragraph truly excels equally in all dimensions,
   document your reasoning explicitly.
3. CROSS-PARAGRAPH RANGE: For each of the 4 new dimensions, the range across all paragraphs must
   be at least 20 points. The best paragraph and worst paragraph in voice (or any dimension)
   MUST differ by 20+ points.
4. FULL-RANGE ANCHORS: Calibrate using the full 0-100 scale:
   - 90+: This paragraph is among the best you've seen for this dimension
   - 70-89: Genuinely strong — does something distinctive
   - 50-69: Functional — does its job without distinction
   - 30-49: Weak — significant room for improvement
   - Below 30: Actively problematic for this dimension
   If all paragraphs cluster in the 70-85 range for any dimension, you have FAILED to differentiate.

${buildScoreMatrixAnchorsBlock()}

verdict: A single sentence capturing the paragraph's architectural assessment.
BAD: "Good paragraph with strong writing."
GOOD: "Carries the essay's emotional load but underearns P4's revelation by telling rather than showing the grandmother's gesture."

priorityForImprovement: 1 (fine) to 5 (urgent). Load-bearing paragraphs with low scores get highest priority.

crossParagraphPatterns: Max 3 items, each ≤15 words. Single-line observations across paragraphs.
Example: "P1-P4: emotional intensity builds linearly — no dip before climax reduces earned weight".
These strings are surfaced directly as coaching hooks in L5. Do NOT produce long prose.

Do NOT produce prioritizedImprovements, coachingMap, or coherenceReport — those are produced in a follow-up analysis call.

OUTPUT FORMAT:
Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "scoreMatrix": {
    "paragraphs": [
      {
        "index": 0,
        "scores": { "effectiveness": <from L3.5>, "structural": <0-100>, "voice": <0-100>, "emotional": <0-100>, "thematic": <0-100> },
        "verdict": "...",
        "priorityForImprovement": <1-5>
      }
    ],
    "crossParagraphPatterns": ["..."]
  }
}`;
}

/**
 * Build the L4b system prompt — prioritizedImprovements + coachingMap + coherenceReport.
 *
 * L4b receives the L4a output (North Star + Score Matrix core) as context and produces
 * the coaching strategy and coherence investigation. NON-FATAL — graceful degradation on failure.
 */
/**
 * Scope 2 Phase 6a: Serialize the active candidate set for L4b injection.
 *
 * Produces a compact table the LLM can read and reference by ID. Candidates
 * are sorted by coachingValue (critical → high → medium → diagnostic) so L4b
 * sees the most urgent improvements first.
 *
 * Truncates observation and suggestedChange to 120 chars each to keep the
 * block under ~2K tokens even with 15+ candidates. Full text is available
 * in the store if L4b asks for it — but the prompt format forces terse
 * consolidation, not re-interpretation.
 *
 * Empty-store case returns a marker string; the orchestrator's pre-L4b gate
 * should already have thrown PipelineError.emptyCandidateStore before we
 * ever call this function on an empty store. The marker exists as belt-
 * and-suspenders for Phase 8 debugging.
 */
function buildL4bCandidateContext(candidateStore: ImprovementCandidateStore): string {
  const active = candidateStore.getActiveSortedByCoachingValue();
  if (active.length === 0) {
    return `=== IMPROVEMENT CANDIDATES (source of truth for coaching) ===
(none — no layers emitted candidates; orchestrator should have thrown before this call)`;
  }

  const truncate = (s: string, max: number): string =>
    s.length > max ? `${s.slice(0, max - 1)}…` : s;

  const lines = active.map((c) => {
    const scope = c.sentence != null ? `P${c.paragraph}S${c.sentence}` : `P${c.paragraph}`;
    const tech = c.technique ? `technique=${c.technique}` : 'technique=null';
    const obs = truncate(c.observation, 120);
    const change = truncate(c.suggestedChange, 120);
    return `[${c.id}] [${c.sourceLayer}|${scope}|${c.coachingValue}] observation=${obs} | suggestedChange=${change} | ${tech}`;
  });

  const byLayer = {
    L3: active.filter((c) => c.sourceLayer === 'L3').length,
    'L3.5': active.filter((c) => c.sourceLayer === 'L3.5').length,
    'L3.75': active.filter((c) => c.sourceLayer === 'L3.75').length,
  };

  return `=== IMPROVEMENT CANDIDATES (source of truth for coaching) ===
Total: ${active.length} active candidates (L3=${byLayer.L3}, L3.5=${byLayer['L3.5']}, L3.75=${byLayer['L3.75']})
Sorted by coachingValue: critical → high → medium → diagnostic.

${lines.join('\n')}

Each candidate was produced by the layer indicated in the source tag, grounded in specific text evidence from the essay. The candidate ID in brackets is the stable handle you will use in \`consolidatedFrom\` when building priorities.`;
}

function buildSystemPromptL4b(scale: NorthStarScale): string {
  return `You are the Consolidator — you receive a pre-generated set of improvement candidates from L3 (sentence understanding walk), L3.5 (paragraph analysis), and L3.75 (holistic synthesis), along with the authoritative North Star and Paragraph Score Matrix. Your job is to CONSOLIDATE those candidates into 3-7 prioritized improvements, produce the coherence investigation, and assemble the coaching map.

=== CRITICAL — YOU CONSOLIDATE, YOU DO NOT INVENT ===

Every priority you output MUST cite \`consolidatedFrom: [candidate IDs]\` — the specific candidate(s) it absorbs. You are NOT permitted to invent improvements not grounded in the candidate set. The upstream layers already did the analytical work of identifying problems; your job is to group, prioritize, and frame them architecturally.

If two candidates point at the same architectural theme (e.g., "P2 summarizes" from L3 and "P2 is the load-bearing pivot but stays abstract" from L3.75), merge them into ONE priority with both candidate IDs in \`consolidatedFrom\`. A single priority CAN and SHOULD absorb multiple candidates when they share a theme.

If a candidate doesn't make it into any priority, that's fine — it will be marked \`superseded\` in the lifecycle. Be intentional: pick the 3-7 highest-leverage priorities, let the rest supersede. Do NOT list every candidate as a separate priority — that's the opposite of consolidation.

YOUR THREE OUTPUTS:

1. PRIORITIZED IMPROVEMENTS — Consolidate candidates into 3-7 priorities. Reference North Star structural roles in \`architecturalReason\` (re-derive this framing from the North Star — candidates don't carry it). Each priority MUST have non-empty \`consolidatedFrom\`.
   BAD: "Improve the opening paragraph." (ungrounded, no consolidatedFrom)
   GOOD: "P1 is the frame of economic risk that makes P3's emotional stakes legible — but its current effectiveness (62) means the reader hasn't internalized the appraiser's logic before being asked to feel the ring's non-market value." consolidatedFrom: ["CAND_L3_P0S1_abc123", "CAND_L3_5_P0S2_def456"]

2. COHERENCE REPORT — ACTIVE INVESTIGATION of contradictions ACROSS profile sections.
   You are not passively checking for problems. You are ACTIVELY INVESTIGATING coherence.

   INVESTIGATION PROTOCOL:
   For each pair of profile sections, ASK:
   a) Does the voice map's account of shifts MATCH the voice identity's characterization?
   b) Do the earnedness assessments ALIGN with the effectiveness scores?
   c) Do the structural roles' importance claims MATCH the score matrix's scoring?
   d) Does the thematic architecture's through-line claim MATCH the actual evidence?
   e) Do the emotional topography peaks and valleys MATCH the narrative strategy's claimed arc?

   For each tension found, CLASSIFY it:
   - routingCategory: How should the system respond?
     "productive_tension" — both sides are valid; the tension reveals something about the essay
     "system_disagreement" — different analysis layers reached incompatible conclusions
     "essay_flaw" — the essay itself contains an unresolved tension the student should address
     "depth_signal" — the tension suggests deeper understanding is needed
   - canCoexist: Can both claims be true simultaneously? (productive tensions often can)
   - likelyResolution: Free-text explanation of how to resolve, or null if unresolvable
   - evidenceA: Direct quote/reference supporting claim A
   - evidenceB: Direct quote/reference supporting claim B

   severity:
   - "blocking": the profile contradicts itself in a way that would confuse downstream consumers
   - "notable": genuine tension that reveals something about the essay
   - "minor": a nuance difference between sections

   isCoherent: false if ANY blocking contradictions exist.

3. COACHING MAP — structured improvement hierarchy.
   Beyond the flat prioritizedImprovements, produce a coachingMap with 5 sections:

   transformativeInsight: The SINGLE most important thing about this essay — the insight that,
   if the student understood it, would unlock the most improvement. Include evidence locations
   and explain WHY this transforms understanding. Set requiresStudentAwareness if the student
   must understand this before any specific feedback makes sense.

   priorities: Ordered list of improvements. Each has:
   - priority: what to do
   - target: { paragraphs: [...], description: "..." }
   - architecturalReason: WHY this matters to the essay's architecture (not just the paragraph)
   - unlocksNext: what becomes possible AFTER this improvement
   - expectedImpact: "transformative" | "significant" | "incremental"

   protectedStrengths: Things that MUST NOT be damaged during improvement.
   These are the essay's current assets. Include locations and WHY they must be protected.

   emergentPatterns: Max 3 items. Each ≤20 words, single line. Format: "Pattern: {name} — {observation with P refs}".
   Example: "Pattern: voice strongest in physical scenes (P1, P3), retreats to abstraction in reflection (P2, P4)".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures — emit flat strings ONLY.

   scoreTensions: Max 3 items. Each ≤15 words. Format: "P{n}: {dim1}({score}) >> {dim2}({score}) — {one-line hook}".
   Example: "P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted".
   These strings are surfaced directly as coaching hooks in L5. Do NOT produce object structures — emit flat strings ONLY.

OUTPUT FORMAT:
Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "prioritizedImprovements": [
    { "paragraph": <index>, "improvement": "...", "whyThisMatters": "...", "expectedImpact": "transformative"|"significant"|"incremental" }
  ],
  "coachingMap": {
    "transformativeInsight": { "insight": "...", "evidenceLocations": [{"paragraph": 0, "sentence": 2}], "whyThisTransforms": "...", "requiresStudentAwareness": true|false },
    "priorities": [{ "priority": "...", "target": { "paragraphs": [0], "description": "..." }, "architecturalReason": "...", "unlocksNext": "...", "expectedImpact": "transformative"|"significant"|"incremental", "consolidatedFrom": ["CAND_L3_P0S1_abc123", "CAND_L3_5_P0S2_def456"] }],
    "protectedStrengths": [{ "description": "...", "locations": [{"paragraph": 0}], "whyProtect": "..." }],
    "emergentPatterns": [
      "Pattern: voice strongest in physical scenes (P1, P3), retreats to abstraction in reflection (P2, P4)"
    ],
    "scoreTensions": [
      "P2: structural(92) >> effectiveness(55) — pivot telegraphed, not enacted"
    ]
  },
  "coherenceReport": {
    "contradictions": [
      { "sectionA": "...", "claimA": "...", "sectionB": "...", "claimB": "...", "severity": "blocking"|"notable"|"minor", "suggestedResolution": "...", "nature": "free-text description of the tension", "routingCategory": "productive_tension"|"system_disagreement"|"essay_flaw"|"depth_signal", "canCoexist": true|false, "likelyResolution": "..."|null, "evidenceA": "...", "evidenceB": "..." }
    ],
    "isCoherent": <boolean>
  }
}`;
}

/**
 * Build the essay-specific profile context (Block 2 — cached across L4+L5 if sequential).
 *
 * Uses the Profile Router's L4 crystallization rule to assemble the right profile sections.
 * Then serializes to a structured text block for the prompt.
 */
function buildProfileContext(
  profile: Readonly<EssayProfile>,
  essayText: string,
  assembledContext: AssembledProfileContext,
): string {
  const parts: string[] = [];

  // Essay text — always needed for grounding
  parts.push('=== ESSAY TEXT ===');
  parts.push(essayText);
  parts.push('');

  // Serialize each assembled section
  for (const section of assembledContext.sections) {
    parts.push(`=== ${section.name.toUpperCase()} ===`);
    parts.push(JSON.stringify(section.content, null, 2));
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * LEGACY: Build the combined L4a call instruction — North Star + Score Matrix in one call.
 * Kept for reference. The active code uses buildCallInstructionL4aNorthStar + buildCallInstructionL4aScoreMatrix.
 */
function buildCallInstructionL4aCombined(
  profile: Readonly<EssayProfile>,
  scale: NorthStarScale,
  priorNorthStar?: EssayNorthStar,
): string {
  const paragraphCount = profile.paragraphs.length;

  // Extract L3.5 effectiveness scores for calibration
  const effectivenessScores = profile.paragraphs.map((p) => ({
    index: p.index,
    effectiveness: p.analysis?.effectiveness ?? null,
    verdict: p.analysis?.verdict ?? null,
  }));

  // Extract entanglement IDs for distinctiveness signature references
  const entanglementSummary = profile.entanglements.map((e) => ({
    id: e.id,
    dimensions: e.dimensions,
    location: e.location,
    description: e.description,
  }));

  // Extract connection IDs for through-line connectionRefs
  const connectionIds = profile.connections.all.map((c) => c.id);

  return `Crystallize the profile above into the North Star and Paragraph Score Matrix core.

ESSAY DETAILS:
- Scale: ${scale}
- Paragraph count: ${paragraphCount}
- Active North Star dimensions: ${ACTIVE_DIMENSIONS[scale].join(', ')}

L3.5 EFFECTIVENESS SCORES (transfer these directly to scoreMatrix.paragraphs[].scores.effectiveness):
${effectivenessScores.map((e) => `  P${e.index}: effectiveness=${e.effectiveness ?? 'N/A'}, verdict="${e.verdict ?? 'N/A'}"`).join('\n')}

AVAILABLE ENTANGLEMENT IDs for distinctivenessSignature.entanglementRefs:
${entanglementSummary.length > 0
    ? entanglementSummary.map((e) => `  "${e.id}" — ${e.dimensions.join('+')} at P${e.location.paragraph}${e.location.sentence != null ? `S${e.location.sentence}` : ''}: ${e.description.substring(0, 80)}`).join('\n')
    : '  (none available)'}

AVAILABLE CONNECTION IDs for throughLineMap.connectionRefs:
${connectionIds.length > 0 ? `  ${connectionIds.join(', ')}` : '  (none available)'}

IMPORTANT REMINDERS:
- Structural roles must cover ALL ${paragraphCount} paragraphs. Every paragraph has an architectural role, even if it's transitional or decorative.
- Score matrix must have exactly ${paragraphCount} entries (indices 0 through ${paragraphCount - 1}).
- If an L3.5 effectiveness score is null, estimate from the paragraph's analysis context.
- For distinctiveness: if your signature could describe any essay about this topic, make it more specific to THIS essay's execution.
- Produce ONLY the North Star and Score Matrix core (paragraphs, crossParagraphPatterns). No prioritizedImprovements, no coachingMap, no coherenceReport.
${scale === 'personal_statement' ? '- Intent bridge: studentIntent is null (no L6 conversation yet). System reading should articulate what the system understands the essay to be doing.' : ''}${priorNorthStar ? `

RE-CRYSTALLIZATION CONTEXT:
This is a RE-CRYSTALLIZATION — a North Star already exists from a prior analysis round.
Prior North Star (version ${(priorNorthStar.evolution?.version ?? 1)}):
${JSON.stringify(priorNorthStar, null, 2)}

Your task: produce an UPDATED North Star. Include an "evolution" field on the northStar output:
{
  "evolution": {
    "version": ${(priorNorthStar.evolution?.version ?? 1) + 1},
    "changelog": [{ "field": "...", "previousValue": "...", "newValue": "...", "trigger": "..." }, ...],
    "coreIdentityStable": <boolean — true if the essay's core meaning identity hasn't shifted>,
    "stabilityAssessment": "one sentence on how stable the North Star is across versions"
  }
}
Log EVERY field that changed (even subtly) in the changelog. If nothing changed, emit an empty changelog and set coreIdentityStable: true.` : ''}`;
}

/**
 * Build the L4a-NorthStar call instruction — asks for North Star only.
 * Adapted from the combined L4a call instruction.
 */
function buildCallInstructionL4aNorthStar(
  profile: Readonly<EssayProfile>,
  scale: NorthStarScale,
  priorNorthStar?: EssayNorthStar,
): string {
  const paragraphCount = profile.paragraphs.length;

  // Extract entanglement IDs for distinctiveness signature references
  const entanglementSummary = profile.entanglements.map((e) => ({
    id: e.id,
    dimensions: e.dimensions,
    location: e.location,
    description: e.description,
  }));

  // Extract connection IDs for through-line connectionRefs
  const connectionIds = profile.connections.all.map((c) => c.id);

  return `Crystallize the profile above into the Essay North Star — the architecture of meaning.

ESSAY DETAILS:
- Scale: ${scale}
- Paragraph count: ${paragraphCount}
- Active North Star dimensions: ${ACTIVE_DIMENSIONS[scale].join(', ')}

AVAILABLE ENTANGLEMENT IDs for distinctivenessSignature.entanglementRefs:
${entanglementSummary.length > 0
    ? entanglementSummary.map((e) => `  "${e.id}" — ${e.dimensions.join('+')} at P${e.location.paragraph}${e.location.sentence != null ? `S${e.location.sentence}` : ''}: ${e.description.substring(0, 80)}`).join('\n')
    : '  (none available)'}

AVAILABLE CONNECTION IDs for throughLineMap.connectionRefs:
${connectionIds.length > 0 ? `  ${connectionIds.join(', ')}` : '  (none available)'}

IMPORTANT REMINDERS:
- Structural roles must cover ALL ${paragraphCount} paragraphs. Every paragraph has an architectural role, even if it's transitional or decorative.
- For distinctiveness: if your signature could describe any essay about this topic, make it more specific to THIS essay's execution.
- Produce ONLY the North Star. No score matrix, no prioritizedImprovements, no coachingMap, no coherenceReport.
${scale === 'personal_statement' ? '- Intent bridge: studentIntent is null (no L6 conversation yet). System reading should articulate what the system understands the essay to be doing.' : ''}${priorNorthStar ? `

RE-CRYSTALLIZATION CONTEXT:
This is a RE-CRYSTALLIZATION — a North Star already exists from a prior analysis round.
Prior North Star (version ${(priorNorthStar.evolution?.version ?? 1)}):
${JSON.stringify(priorNorthStar, null, 2)}

Your task: produce an UPDATED North Star. Include an "evolution" field on the northStar output:
{
  "evolution": {
    "version": ${(priorNorthStar.evolution?.version ?? 1) + 1},
    "changelog": [{ "field": "...", "previousValue": "...", "newValue": "...", "trigger": "..." }, ...],
    "coreIdentityStable": <boolean — true if the essay's core meaning identity hasn't shifted>,
    "stabilityAssessment": "one sentence on how stable the North Star is across versions"
  }
}
Log EVERY field that changed (even subtly) in the changelog. If nothing changed, emit an empty changelog and set coreIdentityStable: true.` : ''}`;
}

/**
 * Build the L4a-ScoreMatrix call instruction — asks for Score Matrix only.
 * Receives the validated North Star as calibration context.
 */
function buildCallInstructionL4aScoreMatrix(
  northStar: EssayNorthStar,
  profile: Readonly<EssayProfile>,
  scale: NorthStarScale,
): string {
  const paragraphCount = profile.paragraphs.length;

  // Extract L3.5 effectiveness scores for calibration
  const effectivenessScores = profile.paragraphs.map((p) => ({
    index: p.index,
    effectiveness: p.analysis?.effectiveness ?? null,
    verdict: p.analysis?.verdict ?? null,
  }));

  // Serialize the North Star as calibration context
  const northStarContext = JSON.stringify(northStar, null, 2);

  return `Score the essay using the North Star below as your architectural calibration.

=== NORTH STAR (AUTHORITATIVE — produced in the prior step) ===
${northStarContext}

ESSAY DETAILS:
- Scale: ${scale}
- Paragraph count: ${paragraphCount}

L3.5 EFFECTIVENESS SCORES (transfer these directly to scoreMatrix.paragraphs[].scores.effectiveness):
${effectivenessScores.map((e) => `  P${e.index}: effectiveness=${e.effectiveness ?? 'N/A'}, verdict="${e.verdict ?? 'N/A'}"`).join('\n')}

IMPORTANT REMINDERS:
- Score matrix must have exactly ${paragraphCount} entries (indices 0 through ${paragraphCount - 1}).
- If an L3.5 effectiveness score is null, estimate from the paragraph's analysis context.
- Use the North Star's structural roles to calibrate the structural dimension — a paragraph with role "load_bearing" should be scored against that expectation.
- Produce ONLY the Score Matrix (paragraphs + crossParagraphPatterns). No prioritizedImprovements, no coachingMap, no coherenceReport.`;
}

/**
 * Build the L4b call instruction — coaching strategy + coherence investigation.
 *
 * Receives the validated L4a output (North Star + Score Matrix core) serialized as context.
 * Asks the LLM to produce prioritizedImprovements, coachingMap, and coherenceReport.
 */
function buildCallInstructionL4b(
  l4aNorthStar: EssayNorthStar,
  l4aScoreMatrix: ParagraphScoreMatrix,
  paragraphCount: number,
  candidateStore: ImprovementCandidateStore,
): string {
  // Scope 2 Phase 6a: Candidate context is the PRIMARY input — the LLM
  // consolidates these into priorities rather than re-deriving from profile
  // residue. Appears first so it's most salient in the prompt.
  const candidateContext = buildL4bCandidateContext(candidateStore);

  // Serialize L4a output as authoritative context
  const l4aContext = JSON.stringify({
    northStar: l4aNorthStar,
    scoreMatrix: {
      paragraphs: l4aScoreMatrix.paragraphs,
      crossParagraphPatterns: l4aScoreMatrix.crossParagraphPatterns,
    },
  }, null, 2);

  // Build per-paragraph score summary for quick reference
  const scoresSummary = l4aScoreMatrix.paragraphs.map((p) =>
    `  P${p.index}: effectiveness=${p.scores.effectiveness}, structural=${p.scores.structural}, ` +
    `voice=${p.scores.voice}, emotional=${p.scores.emotional}, thematic=${p.scores.thematic} | ` +
    `priority=${p.priorityForImprovement} | "${p.verdict}"`
  ).join('\n');

  return `${candidateContext}

=== L4a CRYSTALLIZATION OUTPUT (AUTHORITATIVE for architectural framing) ===
${l4aContext}

=== PER-PARAGRAPH SCORE SUMMARY ===
${scoresSummary}

TASK: Using the candidate set above as your SOURCE OF TRUTH for what needs to improve, and the North Star + scores as your ARCHITECTURAL FRAMING, produce:

1. prioritizedImprovements — 3-7 flat improvements (legacy shape retained for backward compat). Reference the North Star's structural roles in whyThisMatters.

2. coachingMap.priorities — CONSOLIDATED priorities. Each MUST have non-empty \`consolidatedFrom: [candidate IDs]\`. Candidates not cited in any priority will be marked \`superseded\` after this call — be intentional about what matters.

3. coachingMap.transformativeInsight, protectedStrengths, emergentPatterns, scoreTensions — These come from your holistic read of North Star + score matrix. They are NOT derived from candidates and do NOT need lineage. emergentPatterns compare ACROSS paragraphs; scoreTensions compare the 5 dimensions WITHIN paragraphs.

4. coherenceReport — ACTIVELY investigate consistency across the profile sections provided earlier. Zero contradictions is valid if the profile is truly consistent.
   - For each tension: classify with routingCategory, canCoexist, evidence from both sides
   - isCoherent = false ONLY if blocking contradictions exist

REMINDERS:
- Every \`coachingMap.priorities[i].consolidatedFrom\` MUST contain at least one valid candidate ID from the candidate list above. Do not invent IDs.
- Prefer MERGING candidates into fewer, higher-leverage priorities over enumerating every candidate. 3-7 priorities total.
- The structural roles and scores are authoritative framing. Use them to produce architecturalReason that ties each priority to the paragraph's role.
- Score matrix has ${paragraphCount} paragraphs (indices 0 through ${paragraphCount - 1}).
- Coherence investigation should surface genuine internal tensions. Report honestly — zero is fine if consistent.`;
}

// ============================================================================
// JSON PARSING + VALIDATION
// ============================================================================

/**
 * Raw LLM output shape — parsed before type-safe validation.
 * Using `unknown` for fields that will be validated in buildNorthStar.
 */
interface RawCrystallizationOutput {
  northStar: {
    activeScale: string;
    throughLineMap: unknown;
    structuralRolesMap: unknown;
    trajectory: unknown;
    distinctivenessSignature: unknown;
    intentBridge: unknown;
    confidence: string;
    lastUpdatedBy: string;
    evolution?: unknown;
  };
  scoreMatrix: {
    paragraphs: unknown[];
    crossParagraphPatterns: string[];
    prioritizedImprovements: unknown[];
    coachingMap?: unknown;
  };
  coherenceReport: {
    contradictions: unknown[];
    isCoherent: boolean;
  };
}

/**
 * L4a raw output: North Star + Score Matrix core (no prioritizedImprovements, coachingMap, or coherenceReport).
 */
interface RawL4aOutput {
  northStar: RawCrystallizationOutput['northStar'];
  scoreMatrix: {
    paragraphs: unknown[];
    crossParagraphPatterns: string[];
  };
}

/**
 * L4a-NorthStar raw output: just the North Star.
 */
interface RawNorthStarOutput {
  northStar: RawCrystallizationOutput['northStar'];
}

/**
 * L4a-ScoreMatrix raw output: just the Score Matrix core.
 */
interface RawScoreMatrixOutput {
  scoreMatrix: {
    paragraphs: unknown[];
    crossParagraphPatterns: string[];
  };
}

/**
 * L4b raw output: prioritizedImprovements + coachingMap + coherenceReport.
 * Produced with L4a output as context.
 */
interface RawL4bOutput {
  prioritizedImprovements: unknown[];
  coachingMap: unknown;
  coherenceReport: {
    contradictions: unknown[];
    isCoherent: boolean;
  };
}

/**
 * Build validated EssayNorthStar from raw LLM output.
 */
function buildNorthStar(
  raw: RawCrystallizationOutput['northStar'],
  scale: NorthStarScale,
  paragraphCount: number,
  profile: Readonly<EssayProfile>,
): EssayNorthStar {
  const activeDims = ACTIVE_DIMENSIONS[scale];

  // --- Through-Line Map ---
  let throughLineMap: ThroughLineMap | null = null;
  if (activeDims.includes('throughLineMap') && raw.throughLineMap != null) {
    const tlRaw = raw.throughLineMap as Record<string, unknown>;
    const validElementTypes: ThroughLineElementType[] = ['image', 'question', 'tension', 'metaphor', 'relationship', 'idea'];
    const validNarrativeMoves: NarrativeMove[] = ['introduction', 'development', 'submersion', 'resurfacing', 'transformation', 'resolution', 'complication', 'echo'];

    const rawJourney = Array.isArray(tlRaw.journey) ? tlRaw.journey : [];
    const journey = rawJourney
      .filter((j: Record<string, unknown>) => j && typeof j === 'object')
      .map((j: Record<string, unknown>) => {
        const loc = (j.location ?? {}) as Record<string, unknown>;
        const paragraph = clampInt(loc.paragraph as number, 0, paragraphCount - 1);
        const sentence = typeof loc.sentence === 'number' ? Math.max(0, Math.round(loc.sentence)) : undefined;
        const narrativeMove = validNarrativeMoves.includes(j.narrativeMove as NarrativeMove)
          ? (j.narrativeMove as NarrativeMove)
          : 'development';

        return {
          location: { paragraph, ...(sentence !== undefined ? { sentence } : {}) },
          meaningAtPoint: String(j.meaningAtPoint ?? j.meaningAtThisPoint ?? ''),
          narrativeMove,
        };
      });

    const rawElementType = String(tlRaw.elementType ?? 'idea');
    const elementType: ThroughLineElementType = validElementTypes.includes(rawElementType as ThroughLineElementType)
      ? (rawElementType as ThroughLineElementType)
      : 'idea';

    const rawConnectionRefs = Array.isArray(tlRaw.connectionRefs) ? tlRaw.connectionRefs : [];
    // Filter to only valid connection IDs
    const validConnectionIds = new Set(profile.connections.all.map((c) => c.id));
    const connectionRefs = rawConnectionRefs
      .map((r: unknown) => String(r))
      .filter((id: string) => validConnectionIds.has(id));

    throughLineMap = {
      centralElement: String(tlRaw.centralElement ?? ''),
      elementType,
      transformation: String(tlRaw.transformation ?? tlRaw.overallArc ?? ''),
      journey,
      connectionRefs,
    };
  }

  // --- Structural Roles Map ---
  const rawRoles = Array.isArray(raw.structuralRolesMap) ? raw.structuralRolesMap : [];
  const validWeights: StructuralWeight[] = ['load_bearing', 'supporting', 'transitional', 'decorative'];
  const structuralRolesMap: StructuralRole[] = rawRoles
    .filter((r: unknown) => r && typeof r === 'object')
    .map((r: Record<string, unknown>) => {
      // Handle both single paragraph and array of paragraphs
      let paragraphs: number[];
      if (Array.isArray(r.paragraphs)) {
        paragraphs = (r.paragraphs as unknown[])
          .map((p: unknown) => clampInt(p as number, 0, paragraphCount - 1))
          .filter((p: number, i: number, arr: number[]) => arr.indexOf(p) === i); // dedupe
      } else if (typeof r.paragraph === 'number') {
        paragraphs = [clampInt(r.paragraph as number, 0, paragraphCount - 1)];
      } else {
        paragraphs = [0];
      }

      // Normalize weight — LLM might use hyphens instead of underscores
      let rawWeight = String(r.weight ?? r.significanceLevel ?? 'supporting');
      rawWeight = rawWeight.replace(/-/g, '_');
      const weight: StructuralWeight = validWeights.includes(rawWeight as StructuralWeight)
        ? (rawWeight as StructuralWeight)
        : 'supporting';

      return {
        paragraphs,
        role: String(r.role ?? r.structuralRole ?? ''),
        significance: String(r.significance ?? r.whyNecessary ?? ''),
        weight,
      };
    });

  // Validate: every paragraph should have a structural role
  const coveredParagraphs = new Set(structuralRolesMap.flatMap((r) => r.paragraphs));
  for (let i = 0; i < paragraphCount; i++) {
    if (!coveredParagraphs.has(i)) {
      console.warn(`[Crystallizer] Paragraph ${i} has no structural role assigned — adding default`);
      structuralRolesMap.push({
        paragraphs: [i],
        role: 'unassigned',
        significance: 'Structural role not determined by crystallization',
        weight: 'supporting',
      });
    }
  }

  // --- Trajectory ---
  let trajectory: EssayTrajectory | null = null;
  if (activeDims.includes('trajectory') && raw.trajectory != null) {
    const tRaw = raw.trajectory as Record<string, unknown>;
    const rawPaths = Array.isArray(tRaw.plausiblePaths) ? tRaw.plausiblePaths : [];
    const validSupport = ['strong', 'moderate', 'speculative'] as const;

    const plausiblePaths = rawPaths
      .filter((p: unknown) => p && typeof p === 'object')
      .map((p: Record<string, unknown>) => {
        const rawSupport = String(p.textSupport ?? p.supportLevel ?? 'moderate');
        const textSupport = validSupport.includes(rawSupport as typeof validSupport[number])
          ? (rawSupport as typeof validSupport[number])
          : 'moderate' as const;

        return {
          description: String(p.description ?? p.path ?? ''),
          textSupport,
          requirements: Array.isArray(p.requirements)
            ? (p.requirements as unknown[]).map((r: unknown) => String(r))
            : [],
        };
      });

    const rawUnrealized = Array.isArray(tRaw.unrealizedConnections) ? tRaw.unrealizedConnections : [];
    const unrealizedConnections = rawUnrealized
      .filter((u: unknown) => u && typeof u === 'object')
      .map((u: Record<string, unknown>) => {
        // Accept both { locations: [[p,s], ...] } and { paragraphs: [p, ...] }
        let locations: Array<[number, number]>;
        if (Array.isArray(u.locations)) {
          locations = (u.locations as unknown[])
            .filter((l: unknown) => Array.isArray(l) && (l as unknown[]).length >= 2)
            .map((l: unknown) => {
              const arr = l as number[];
              return [clampInt(arr[0], 0, paragraphCount - 1), Math.max(0, Math.round(arr[1]))] as [number, number];
            });
        } else if (Array.isArray(u.paragraphs)) {
          locations = (u.paragraphs as unknown[]).map((p: unknown) => [clampInt(p as number, 0, paragraphCount - 1), 0] as [number, number]);
        } else {
          locations = [];
        }

        return {
          description: String(u.description ?? ''),
          locations,
        };
      });

    trajectory = {
      currentState: String(tRaw.currentState ?? ''),
      plausiblePaths,
      unrealizedConnections,
    };
  }

  // --- Distinctiveness Signature ---
  const dsRaw = (raw.distinctivenessSignature ?? {}) as Record<string, unknown>;
  const distinctivenessSignature: DistinctivenessSignature = {
    articulation: String(
      dsRaw.articulation ?? dsRaw.whatMakesItUnique ?? '',
    ),
    entanglementRefs: Array.isArray(dsRaw.entanglementRefs)
      ? (dsRaw.entanglementRefs as unknown[]).map((r: unknown) => String(r))
      : [],
    nonInterchangeableFactors: Array.isArray(dsRaw.nonInterchangeableFactors)
      ? (dsRaw.nonInterchangeableFactors as unknown[]).map((f: unknown) => String(f))
      : [],
  };

  // --- Intent Bridge ---
  let intentBridge: IntentBridge | null = null;
  if (activeDims.includes('intentBridge') && raw.intentBridge != null) {
    const ibRaw = raw.intentBridge as Record<string, unknown>;
    const validAlignments = ['confirmed', 'partial', 'divergent', 'student_unaware'] as const;

    const rawAlignments = Array.isArray(ibRaw.alignments) ? ibRaw.alignments : [];
    const alignments = rawAlignments
      .filter((a: unknown) => a && typeof a === 'object')
      .map((a: Record<string, unknown>) => {
        const rawAlignment = String(a.alignment ?? 'student_unaware');
        const alignment = validAlignments.includes(rawAlignment as typeof validAlignments[number])
          ? (rawAlignment as typeof validAlignments[number])
          : 'student_unaware' as const;

        return {
          aspect: String(a.aspect ?? ''),
          alignment,
          detail: String(a.detail ?? ''),
        };
      });

    intentBridge = {
      studentIntent: ibRaw.studentIntent != null ? String(ibRaw.studentIntent) : null,
      systemReading: String(ibRaw.systemReading ?? ''),
      alignments,
      sourceInsightIds: Array.isArray(ibRaw.sourceInsightIds)
        ? (ibRaw.sourceInsightIds as unknown[]).map((id: unknown) => String(id))
        : [],
    };
  }

  // --- Confidence ---
  const validConfidences: NorthStarConfidence[] = ['hypothesis', 'emerging', 'full', 'student_confirmed'];
  const rawConfidence = String(raw.confidence ?? 'hypothesis');
  const confidence: NorthStarConfidence = validConfidences.includes(rawConfidence as NorthStarConfidence)
    ? (rawConfidence as NorthStarConfidence)
    : 'hypothesis';

  // --- Evolution (optional — present during re-crystallization) ---
  let evolution: NorthStarEvolution | undefined;
  if (raw.evolution != null && typeof raw.evolution === 'object') {
    const evoRaw = raw.evolution as Record<string, unknown>;
    const rawChangelog = Array.isArray(evoRaw.changelog) ? evoRaw.changelog : [];
    const changelog = rawChangelog
      .filter((entry: unknown) => entry && typeof entry === 'object')
      .map((entry: Record<string, unknown>) => ({
        field: String(entry.field ?? ''),
        previousValue: String(entry.previousValue ?? ''),
        newValue: String(entry.newValue ?? ''),
        trigger: String(entry.trigger ?? ''),
      }));

    evolution = {
      version: typeof evoRaw.version === 'number' ? Math.max(1, Math.round(evoRaw.version)) : 2,
      changelog,
      coreIdentityStable: Boolean(evoRaw.coreIdentityStable ?? true),
      stabilityAssessment: String(evoRaw.stabilityAssessment ?? ''),
    };
  }

  // Option 5 rebuild: L4 no longer emits per-layer specifics-need
  // emissions. Phase B (essayLevelEmissionService) reads L4's northStar
  // (through-line, structural roles, distinctiveness, intent bridge)
  // directly when deciding emissions at essay level.

  return {
    activeScale: scale,
    throughLineMap,
    structuralRolesMap,
    trajectory,
    distinctivenessSignature,
    intentBridge,
    confidence,
    lastUpdatedBy: 'L4',
    ...(evolution ? { evolution } : {}),
  };
}

/**
 * Build validated ParagraphScoreMatrix from raw LLM output.
 */
function buildScoreMatrix(
  raw: RawCrystallizationOutput['scoreMatrix'],
  paragraphCount: number,
  profile: Readonly<EssayProfile>,
): ParagraphScoreMatrix {
  // --- Paragraph scores ---
  const rawParagraphs = Array.isArray(raw.paragraphs) ? raw.paragraphs : [];
  const paragraphMap = new Map<number, ParagraphScoreEntry>();

  for (const p of rawParagraphs) {
    if (!p || typeof p !== 'object') continue;
    const pr = p as Record<string, unknown>;
    const index = clampInt(pr.index as number, 0, paragraphCount - 1);

    const rawScores = (pr.scores ?? {}) as Record<string, unknown>;
    const profileParagraph = profile.paragraphs[index];
    const l35Effectiveness = profileParagraph?.analysis?.effectiveness ?? null;

    paragraphMap.set(index, {
      index,
      scores: {
        // Transfer L3.5 effectiveness when available, otherwise use LLM's estimate
        effectiveness: l35Effectiveness ?? clampScore(rawScores.effectiveness as number),
        structural: clampScore(rawScores.structural ?? rawScores.structuralContribution as number),
        voice: clampScore(rawScores.voice ?? rawScores.voiceConsistency as number),
        emotional: clampScore(rawScores.emotional ?? rawScores.emotionalContribution as number),
        thematic: clampScore(rawScores.thematic ?? rawScores.thematicRelevance as number),
      },
      verdict: String(pr.verdict ?? ''),
      priorityForImprovement: clampInt(pr.priorityForImprovement as number, 1, 5),
    });
  }

  // Ensure every paragraph has a score entry
  const paragraphs: ParagraphScoreEntry[] = [];
  for (let i = 0; i < paragraphCount; i++) {
    if (paragraphMap.has(i)) {
      paragraphs.push(paragraphMap.get(i)!);
    } else {
      console.warn(`[Crystallizer] Paragraph ${i} missing from score matrix — synthesizing default`);
      const profileParagraph = profile.paragraphs[i];
      const effectiveness = profileParagraph?.analysis?.effectiveness ?? 50;
      paragraphs.push({
        index: i,
        scores: {
          effectiveness,
          structural: 50,
          voice: 50,
          emotional: 50,
          thematic: 50,
        },
        verdict: 'Score not produced by crystallization — default applied.',
        priorityForImprovement: 3,
      });
    }
  }

  // --- Cross-paragraph patterns (Scope 1 Phase 2: hard cap at 3 entries) ---
  // The prompt instructs the LLM to produce max 3, but the runtime cap is
  // the enforcement layer. Empty/whitespace strings are filtered out.
  const crossParagraphPatterns = Array.isArray(raw.crossParagraphPatterns)
    ? raw.crossParagraphPatterns
        .map((p: unknown) => String(p).trim())
        .filter((s) => s.length > 0)
        .slice(0, 3)
    : [];

  // --- Prioritized improvements ---
  const rawImprovements = Array.isArray(raw.prioritizedImprovements) ? raw.prioritizedImprovements : [];
  const prioritizedImprovements = parsePrioritizedImprovements(rawImprovements, paragraphCount);

  return {
    paragraphs,
    crossParagraphPatterns,
    prioritizedImprovements,
    coachingMap: buildCoachingMap(raw.coachingMap, paragraphCount),
  };
}

/**
 * Build validated CoachingMap from raw LLM output.
 * Returns undefined if raw is falsy or parsing fails entirely.
 */
/**
 * Parse a raw LLM coachingMap JSON object into a typed CoachingMap.
 *
 * Scope 1 Phase 1: `emergentPatterns` and `scoreTensions` are now `string[]`.
 * This function's backward-compat parser accepts both the new string shape
 * (post-Phase-2 LLM output) AND the legacy object shape (persisted pre-Phase-1
 * profiles loaded from checkpoints). Legacy objects are flattened to strings.
 *
 * Exported for testability — tests/test-scope1-phase1-runtime.ts exercises
 * the backward-compat branches directly.
 */
export function buildCoachingMap(raw: unknown, paragraphCount: number): CoachingMap | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;

  // --- Transformative Insight ---
  const tiRaw = (r.transformativeInsight ?? {}) as Record<string, unknown>;
  const transformativeInsight = {
    insight: String(tiRaw.insight ?? ''),
    evidenceLocations: parseLocations(tiRaw.evidenceLocations, paragraphCount),
    whyThisTransforms: String(tiRaw.whyThisTransforms ?? ''),
    requiresStudentAwareness: Boolean(tiRaw.requiresStudentAwareness ?? false),
  };

  // --- Priorities ---
  const rawPriorities = Array.isArray(r.priorities) ? r.priorities : [];
  const validImpacts = ['transformative', 'significant', 'incremental'] as const;
  const priorities = rawPriorities
    .filter((p: unknown) => p && typeof p === 'object')
    .map((p: Record<string, unknown>) => {
      const targetRaw = (p.target ?? {}) as Record<string, unknown>;
      const rawImpact = String(p.expectedImpact ?? 'significant');
      const expectedImpact = validImpacts.includes(rawImpact as typeof validImpacts[number])
        ? (rawImpact as typeof validImpacts[number])
        : 'significant' as const;

      // Scope 2 Phase 6a: consolidatedFrom lineage. Accept string[] only;
      // filter to non-empty strings. Invalid entries get dropped silently
      // (validator at the orchestrator level checks that cited IDs exist
      // in the store).
      const rawConsolidatedFrom = Array.isArray(p.consolidatedFrom) ? p.consolidatedFrom : [];
      const consolidatedFrom: string[] = rawConsolidatedFrom
        .map((id: unknown) => (typeof id === 'string' ? id.trim() : ''))
        .filter((id: string) => id.length > 0);

      return {
        priority: String(p.priority ?? ''),
        target: {
          paragraphs: Array.isArray(targetRaw.paragraphs)
            ? (targetRaw.paragraphs as unknown[]).map((idx: unknown) => clampInt(idx as number, 0, paragraphCount - 1))
            : [],
          description: String(targetRaw.description ?? ''),
        },
        architecturalReason: String(p.architecturalReason ?? ''),
        unlocksNext: String(p.unlocksNext ?? ''),
        expectedImpact,
        consolidatedFrom,
      };
    });

  // --- Protected Strengths ---
  const rawStrengths = Array.isArray(r.protectedStrengths) ? r.protectedStrengths : [];
  const protectedStrengths = rawStrengths
    .filter((s: unknown) => s && typeof s === 'object')
    .map((s: Record<string, unknown>) => ({
      description: String(s.description ?? ''),
      locations: parseLocations(s.locations, paragraphCount),
      whyProtect: String(s.whyProtect ?? ''),
    }));

  // --- Emergent Patterns (Scope 1 Phase 1: string[] format) ─────────────
  // Backward compat: accepts both the new string shape (preferred, after
  // Phase 2 prompt update) AND the legacy object shape (for profiles
  // persisted before Phase 1). Legacy objects are flattened to
  // "{pattern} — {evidence}" strings. Empty entries are filtered out and
  // the result is hard-capped at 3 items per the CoachingMap contract.
  const rawPatterns = Array.isArray(r.emergentPatterns) ? r.emergentPatterns : [];
  const emergentPatterns: string[] = rawPatterns
    .map((p: unknown): string => {
      if (typeof p === 'string') return p.trim();
      if (p && typeof p === 'object') {
        const obj = p as Record<string, unknown>;
        // Legacy object → compressed string
        const pattern = String(obj.pattern ?? '').trim();
        const evidence = String(obj.evidence ?? '').trim();
        if (pattern && evidence) return `${pattern} — ${evidence}`;
        return pattern;
      }
      return '';
    })
    .filter((s) => s.length > 0)
    .slice(0, 3); // Hard cap: max 3 entries

  // --- Score Tensions (Scope 1 Phase 1: string[] format) ───────────────
  // Backward compat: same as emergentPatterns. Legacy `{ paragraph, tension,
  // interpretation, coachingImplication }` objects are flattened to
  // "P{n}: {tension} — {coachingImplication}".
  const rawTensions = Array.isArray(r.scoreTensions) ? r.scoreTensions : [];
  const scoreTensions: string[] = rawTensions
    .map((t: unknown): string => {
      if (typeof t === 'string') return t.trim();
      if (t && typeof t === 'object') {
        const obj = t as Record<string, unknown>;
        const para = clampInt((obj.paragraph as number) ?? 0, 0, paragraphCount - 1);
        const tension = String(obj.tension ?? '').trim();
        const impl = String(obj.coachingImplication ?? '').trim();
        if (tension) {
          return impl ? `P${para}: ${tension} — ${impl}` : `P${para}: ${tension}`;
        }
        return '';
      }
      return '';
    })
    .filter((s) => s.length > 0)
    .slice(0, 3);

  return {
    transformativeInsight,
    priorities,
    protectedStrengths,
    emergentPatterns,
    scoreTensions,
  };
}

/**
 * Parse an array of location objects { paragraph, sentence? } with clamping.
 */
function parseLocations(
  raw: unknown,
  paragraphCount: number,
): Array<{ paragraph: number; sentence?: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((loc: unknown) => loc && typeof loc === 'object')
    .map((loc: Record<string, unknown>) => {
      const result: { paragraph: number; sentence?: number } = {
        paragraph: clampInt(loc.paragraph as number, 0, paragraphCount - 1),
      };
      if (typeof loc.sentence === 'number') {
        result.sentence = Math.max(0, Math.round(loc.sentence));
      }
      return result;
    });
}

/**
 * Build validated CoherenceReport from raw LLM output.
 */
function buildCoherenceReport(raw: RawCrystallizationOutput['coherenceReport']): CoherenceReport {
  const rawContradictions = Array.isArray(raw.contradictions) ? raw.contradictions : [];
  const validSeverities = ['blocking', 'notable', 'minor'] as const;
  const validRoutingCategories = ['productive_tension', 'system_disagreement', 'essay_flaw', 'depth_signal'] as const;

  const contradictions: CoherenceIssue[] = rawContradictions
    .filter((c: unknown) => c && typeof c === 'object')
    .map((c: Record<string, unknown>) => {
      const rawSeverity = String(c.severity ?? 'minor');
      const severity = validSeverities.includes(rawSeverity as typeof validSeverities[number])
        ? (rawSeverity as typeof validSeverities[number])
        : 'minor' as const;

      const issue: CoherenceIssue = {
        sectionA: String(c.sectionA ?? ''),
        claimA: String(c.claimA ?? ''),
        sectionB: String(c.sectionB ?? ''),
        claimB: String(c.claimB ?? ''),
        severity,
        suggestedResolution: String(c.suggestedResolution ?? ''),
      };

      // Parse optional enriched fields (only include when LLM provides them)
      if (c.routingCategory != null) {
        const rawCategory = String(c.routingCategory);
        issue.routingCategory = validRoutingCategories.includes(rawCategory as typeof validRoutingCategories[number])
          ? (rawCategory as typeof validRoutingCategories[number])
          : 'depth_signal';
      }
      if (c.canCoexist != null) {
        issue.canCoexist = Boolean(c.canCoexist);
      }
      if (c.likelyResolution !== undefined) {
        issue.likelyResolution = c.likelyResolution != null ? String(c.likelyResolution) : null;
      }
      if (c.evidenceA != null) {
        issue.evidenceA = String(c.evidenceA);
      }
      if (c.evidenceB != null) {
        issue.evidenceB = String(c.evidenceB);
      }
      if (c.source != null) {
        issue.source = c.source === 'adversarial' ? 'adversarial' : 'primary';
      }
      if (c.nature != null) {
        issue.nature = String(c.nature);
      }

      return issue;
    });

  // isCoherent is false if any blocking contradictions exist
  const hasBlockingContradiction = contradictions.some((c) => c.severity === 'blocking');
  const isCoherent = raw.isCoherent !== undefined
    ? Boolean(raw.isCoherent) && !hasBlockingContradiction
    : !hasBlockingContradiction;

  return {
    contradictions,
    isCoherent,
  };
}

/**
 * Parse prioritizedImprovements from raw LLM output (reused by both buildScoreMatrix and L4b path).
 */
function parsePrioritizedImprovements(
  rawImprovements: unknown[],
  paragraphCount: number,
): ParagraphScoreMatrix['prioritizedImprovements'] {
  const validImpacts = ['transformative', 'significant', 'incremental'] as const;
  return rawImprovements
    .filter((imp: unknown) => imp && typeof imp === 'object')
    .map((imp: Record<string, unknown>) => {
      const rawImpact = String(imp.expectedImpact ?? 'significant');
      const expectedImpact = validImpacts.includes(rawImpact as typeof validImpacts[number])
        ? (rawImpact as typeof validImpacts[number])
        : 'significant' as const;

      return {
        paragraph: clampInt(imp.paragraph as number, 0, paragraphCount - 1),
        improvement: String(imp.improvement ?? ''),
        whyThisMatters: String(imp.whyThisMatters ?? ''),
        expectedImpact,
      };
    });
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/** Clamp a number to an integer within [min, max] */
function clampInt(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Clamp a score to 0-100 range */
function clampScore(value: number): number {
  if (typeof value !== 'number' || isNaN(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// ============================================================================
// W3.3: ANTI-CLUSTERING DETECTION
// ============================================================================

/**
 * Post-parse programmatic detection of score clustering in the paragraph score matrix.
 * Computes stdev and range per dimension across paragraphs, logs warnings when
 * anti-clustering thresholds are violated.
 *
 * Thresholds:
 * - Min 15pt within-paragraph range across 4 new dimensions
 * - Min 20pt cross-paragraph range per dimension
 * - Warning on 3+ clustered dimensions
 */
function detectScoreClustering(scoreMatrix: ParagraphScoreMatrix): void {
  const paragraphs = scoreMatrix.paragraphs;
  if (paragraphs.length < 2) return; // Need 2+ paragraphs for cross-paragraph analysis

  const newDimensions = ['structural', 'voice', 'emotional', 'thematic'] as const;
  let clusteredDimensionCount = 0;

  // Cross-paragraph range check per dimension
  for (const dim of newDimensions) {
    const scores = paragraphs.map(p => p.scores[dim]);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    const stdev = Math.sqrt(variance);

    if (range < 20) {
      clusteredDimensionCount++;
      console.warn(
        `[Crystallizer] SCORE CLUSTERING in ${dim}: range=${range} (< 20pt minimum), ` +
        `stdev=${stdev.toFixed(1)}, scores=[${scores.join(', ')}]`,
      );
    }
  }

  // Within-paragraph range check
  for (const p of paragraphs) {
    const dimScores = [p.scores.structural, p.scores.voice, p.scores.emotional, p.scores.thematic];
    const withinRange = Math.max(...dimScores) - Math.min(...dimScores);
    if (withinRange < 15) {
      console.warn(
        `[Crystallizer] WITHIN-PARAGRAPH CLUSTERING for P${p.index}: ` +
        `range=${withinRange} (< 15pt minimum), ` +
        `structural=${p.scores.structural}, voice=${p.scores.voice}, ` +
        `emotional=${p.scores.emotional}, thematic=${p.scores.thematic}`,
      );
    }
  }

  // Summary warning if 3+ dimensions clustered
  if (clusteredDimensionCount >= 3) {
    console.warn(
      `[Crystallizer] SEVERE CLUSTERING: ${clusteredDimensionCount}/4 dimensions have insufficient cross-paragraph range. ` +
      `Prompt anti-clustering protocol may have failed. Consider this a degraded score matrix.`,
    );
  }
}

// ============================================================================
// ADVERSARIAL CONTRADICTION PASS (Improvement 4)
// ============================================================================

/**
 * Raw output shape from the adversarial Haiku pass.
 * Stays local to crystallizer.ts — not exported.
 *
 * Key design: `nature` is the LLM's free-text description of what the tension IS.
 * It is NOT constrained to categories — the LLM describes what it sees.
 * `routingCategory` is a system routing tag assigned by the LLM for downstream handling.
 */
interface AdversarialContradictionOutput {
  contradictions: Array<{
    sectionA: string;
    claimA: string;
    sectionB: string;
    claimB: string;
    /** Free-text description of the tension's nature — what the contradiction IS */
    nature: string;
    /** System routing tag — LLM assigns the closest category */
    routingCategory: 'productive_tension' | 'system_disagreement' | 'essay_flaw' | 'depth_signal';
    /** Can both readings coexist, or is one wrong? */
    canCoexist: boolean;
    /** If they can't coexist, which is more likely correct and why? */
    likelyResolution: string | null;
    /** LLM-assessed severity for routing */
    severity: 'blocking' | 'notable' | 'minor';
    /** Specific evidence from the profile for side A */
    evidenceA: string;
    /** Specific evidence from the profile for side B */
    evidenceB: string;
  }>;
  northStarAssessment: {
    passesIrreplaceabilityTest: boolean;
    reasoning: string;
    missingInsight: string | null;
  };
  overallCoherence: boolean;
}

/**
 * Run the adversarial Haiku pass — a fresh-eyes consistency check.
 *
 * Receives the complete profile context PLUS finding context and connection graph
 * context. The adversarial pass reads what already exists and probes for consistency.
 * This is why Haiku is appropriate — it needs to READ critically, not CREATE deeply.
 *
 * Returns null on any failure (graceful degradation — adversarial pass is non-fatal).
 */
async function runAdversarialPass(
  essayText: string,
  profileContext: string,
  primaryOutput: {
    northStar: EssayNorthStar;
    scoreMatrix: ParagraphScoreMatrix;
    coherenceReport: CoherenceReport;
  },
  findingContext: string,
  connectionContext: string,
): Promise<{ output: AdversarialContradictionOutput; cost: number; timingMs: number } | null> {
  const startTime = Date.now();

  const systemPrompt = `You are a skeptical reviewer checking a crystallization analysis for internal consistency. You are NOT re-doing the analysis — you are STRESS-TESTING it.

You receive:
1. The complete essay profile (understanding + holistic synthesis + scoring)
2. The primary crystallization output (North Star + Score Matrix + Coaching Map + initial coherence assessment)
3. The system's findings (structured insights with maturity levels and evidence)
4. The connection graph (cross-paragraph structural links)

Your job: find tensions the primary analysis missed or smoothed over. The primary analyzer tends to rationalize — it created the synthesis and is naturally biased toward seeing it as coherent. You are the fresh eyes.

PROBING STRATEGY (areas to investigate — NOT a checklist to fill):

PROBE 1 — UNDERSTANDING vs. SCORING:
For each paragraph, compare what the understanding says this paragraph DOES with how the scoring says it PERFORMS. The understanding describes function; the scoring evaluates execution. They often diverge in interesting ways.

Key patterns to look for:
- "Fulcrum paragraph" with low effectiveness → structural importance ≠ execution quality
- "Transitional paragraph" with high effectiveness → best writing in the lowest-stakes position
- "Opening paragraph" with mediocre effectiveness → the essay's first impression underperforms

For each divergence, briefly read the actual essay text and form your own judgment: which assessment (understanding or scoring) is more defensible? Is this a genuine tension (the paragraph really IS important but poorly executed) or a measurement error?

PROBE 2 — HOLISTIC CLAIMS vs. EVIDENCE:
The holistic synthesis (voice identity, emotional topography, thematic architecture, narrative strategy, etc.) makes claims about the essay as a whole. Each claim should be evidenced in the paragraph-level data.

Pick the BOLDEST claim in the holistic synthesis and trace its evidence:
- Which paragraphs support it?
- Which paragraphs complicate or undermine it?
- Is the claim well-supported, partially supported, or unsubstantiated?

If a holistic claim is unsubstantiated by the paragraph data, that's either a synthesis overreach (the Sonnet inferred too much) or the paragraph analysis missed something (the data is there but the analysis didn't surface it). State which and why.

PROBE 3 — NORTH STAR IRREPLACEABILITY:
The North Star should contain EMERGENT understanding that doesn't exist in any individual profile section. Apply three tests:

DISTINCTIVENESS TEST: Read the distinctiveness signature. Now imagine deleting it. Can you reconstruct the SAME insight from the voice identity + thematic architecture + paragraph understandings? If yes, the signature is lossy compression, not emergent insight. It fails.

STRUCTURAL ROLE TEST: Read each structural role description. Does it describe ARCHITECTURAL FUNCTION ("frames the economic lens that makes P3's stakes calculable") or just CONTENT ("introduces the family's background")? Content descriptions are summaries — they exist in the paragraph understanding already. Only architectural descriptions pass.

THROUGH-LINE TEST (if present): Does the through-line trace MEANING TRANSFORMATION ("the diamond's signification shifts from commodity to inheritance to identity marker") or just PHYSICAL APPEARANCES ("the diamond appears in P1, P3, and P5")? Appearance tracking is already done by the connection graph. Only meaning transformation passes.

PROBE 4 — PRODUCTIVE TENSIONS (the essay's own internal complexity):
Look past system consistency. Are there tensions WITHIN THE ESSAY ITSELF that the analysis hasn't surfaced?

The best essays HAVE productive tensions:
- "Raw authentic voice but rough craft" — the authenticity might depend on the roughness. Polishing could destroy what makes it real.
- "Unconventional structure but unclear arc" — the unconventionality might BE the arc, or it might be confusion disguised as creativity.
- "Specific, grounded early paragraphs but abstract late paragraphs" — intentional shift from concrete to reflective? Or the writer running out of material?

When you find productive tension, describe it as an OPEN QUESTION for coaching, not as a problem with a solution. The student decides how to handle it.

PROBE 5 — COACHING MAP QUALITY:
Is the transformative insight genuinely transformative, or is it a restatement of an obvious problem? Does the priority ordering make architectural sense (structural before craft, foundational before decorative)? Are the protected strengths genuinely worth protecting?

FINDING CONTEXT:
You also have access to the system's findings — structured insights about the essay with maturity levels (hypothesis → developing → confirmed → deepened → superseded). Look for:
- Finding↔Score tension: A confirmed finding claims "P2 has deeply earned emotional resonance" but the score says otherwise
- Supersession instability: A finding that was superseded multiple times suggests the system kept changing its mind — is the current reading stable?
- Shallow threads: Findings with no depth chain might indicate areas the system hasn't explored enough

FOR EACH TENSION YOU FIND:
- State both sides with specific evidence (cite paragraph/sentence indices)
- Describe the NATURE of the tension in your own words (free-text, not category-constrained)
- Assess: can both readings coexist (productive) or is one wrong (destructive)?
- If one is wrong, which is more defensible based on the actual text?
- Assign a routing category: productive_tension | system_disagreement | essay_flaw | depth_signal
- Rate severity: blocking | notable | minor
  (blocking = fundamentally changes the coaching direction;
   notable = should be surfaced but doesn't change direction;
   minor = interesting but not actionable)

IMPORTANT:
- Finding zero tensions is a VALID outcome for a well-analyzed, straightforward essay. Do not manufacture tensions to seem thorough.
- Do NOT re-score or re-analyze — only check CONSISTENCY.
- You are a PROOFREADER of the analysis, not a competing analyst.

Output JSON:
{
  "contradictions": [
    {
      "sectionA": "string — which profile section (e.g., 'P3 understanding')",
      "claimA": "string — what section A claims",
      "sectionB": "string — which profile section (e.g., 'L3.5 scoring P3')",
      "claimB": "string — what section B claims",
      "nature": "string — free-text description of the tension",
      "routingCategory": "productive_tension" | "system_disagreement" | "essay_flaw" | "depth_signal",
      "canCoexist": true/false,
      "likelyResolution": "string | null — if can't coexist, which is right",
      "severity": "blocking" | "notable" | "minor",
      "evidenceA": "string — specific text/data supporting claim A",
      "evidenceB": "string — specific text/data supporting claim B"
    }
  ],
  "northStarAssessment": {
    "passesIrreplaceabilityTest": true/false,
    "reasoning": "string — detailed assessment of each test",
    "missingInsight": "string | null — what emergent insight is absent"
  },
  "overallCoherence": true/false
}`;

  // Build user prompt with all available context
  const contextParts: string[] = [
    '=== ESSAY TEXT ===',
    essayText,
    '',
    '=== PROFILE CONTEXT ===',
    profileContext,
  ];

  if (findingContext) {
    contextParts.push('', '=== SYSTEM FINDINGS ===', findingContext);
  }

  if (connectionContext) {
    contextParts.push('', '=== CONNECTION GRAPH ===', connectionContext);
  }

  contextParts.push(
    '',
    '=== CRYSTALLIZATION OUTPUT ===',
    JSON.stringify(primaryOutput, null, 2),
    '',
    'Run all 5 adversarial probes and report your findings.',
  );

  const userPrompt = contextParts.join('\n');

  try {
    const response = await callClaudeWithRetry<AdversarialContradictionOutput>({
      model: HAIKU,
      systemPrompt,
      userPrompt,
      maxTokens: ADVERSARIAL_MAX_TOKENS,
      temperature: 0.2,
      useJsonMode: true,
    });

    const cost = calculateCost(response.usage, HAIKU);
    const timingMs = Date.now() - startTime;

    console.log(
      `[Crystallizer] Adversarial pass complete: cost=$${cost.toFixed(4)}, time=${timingMs}ms`,
    );

    const validated = validateAdversarialOutput(response.content);
    return { output: validated, cost, timingMs };
  } catch (error) {
    console.warn(
      '[Crystallizer] Adversarial pass failed (non-fatal):',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Validate and normalize adversarial output fields.
 * Defensive: handles the LLM returning slightly different shapes.
 */
function validateAdversarialOutput(raw: AdversarialContradictionOutput): AdversarialContradictionOutput {
  const validSeverities = ['blocking', 'notable', 'minor'] as const;
  const validRoutingCategories = ['productive_tension', 'system_disagreement', 'essay_flaw', 'depth_signal'] as const;

  const rawContradictions = Array.isArray(raw.contradictions) ? raw.contradictions : [];
  const contradictions = rawContradictions
    .filter((c: unknown) => c && typeof c === 'object')
    .map((c: Record<string, unknown>) => {
      const rawSeverity = String(c.severity ?? 'notable');
      const severity = validSeverities.includes(rawSeverity as typeof validSeverities[number])
        ? (rawSeverity as typeof validSeverities[number])
        : 'notable' as const;

      const rawCategory = String(c.routingCategory ?? 'depth_signal');
      const routingCategory = validRoutingCategories.includes(rawCategory as typeof validRoutingCategories[number])
        ? (rawCategory as typeof validRoutingCategories[number])
        : 'depth_signal' as const;

      return {
        sectionA: String(c.sectionA ?? ''),
        claimA: String(c.claimA ?? ''),
        sectionB: String(c.sectionB ?? ''),
        claimB: String(c.claimB ?? ''),
        nature: String(c.nature ?? c.suggestedResolution ?? ''),
        routingCategory,
        canCoexist: Boolean(c.canCoexist ?? false),
        likelyResolution: c.likelyResolution != null ? String(c.likelyResolution) : null,
        severity,
        evidenceA: String(c.evidenceA ?? ''),
        evidenceB: String(c.evidenceB ?? ''),
      };
    });

  const northStarAssessment = raw.northStarAssessment && typeof raw.northStarAssessment === 'object'
    ? {
        passesIrreplaceabilityTest: Boolean(raw.northStarAssessment.passesIrreplaceabilityTest ?? true),
        reasoning: String(raw.northStarAssessment.reasoning ?? ''),
        missingInsight: raw.northStarAssessment.missingInsight != null
          ? String(raw.northStarAssessment.missingInsight)
          : null,
      }
    : { passesIrreplaceabilityTest: true, reasoning: '', missingInsight: null };

  return {
    contradictions,
    northStarAssessment,
    overallCoherence: Boolean(raw.overallCoherence ?? true),
  };
}

/**
 * Merge adversarial results into the primary coherence report.
 * - Tags primary issues with source: 'primary'
 * - Converts adversarial contradictions to CoherenceIssue[] with source: 'adversarial'
 * - Concatenates (both perspectives kept — no deduplication)
 * - Updates isCoherent (either says incoherent → merged is incoherent)
 * - Stores northStarAssessment on the merged report
 */
function mergeAdversarialResults(
  primaryReport: CoherenceReport,
  adversarial: AdversarialContradictionOutput,
): CoherenceReport {
  const validSeverities = ['blocking', 'notable', 'minor'] as const;
  const validRoutingCategories = ['productive_tension', 'system_disagreement', 'essay_flaw', 'depth_signal'] as const;

  // Tag primary issues with source
  const taggedPrimary: CoherenceIssue[] = primaryReport.contradictions.map((c) => ({
    ...c,
    source: (c.source ?? 'primary') as 'primary' | 'adversarial',
  }));

  // Convert adversarial contradictions — all fields are validated at this point
  const adversarialIssues: CoherenceIssue[] = adversarial.contradictions.map((c) => {
    const rawSeverity = String(c.severity ?? 'notable');
    const severity = validSeverities.includes(rawSeverity as typeof validSeverities[number])
      ? (rawSeverity as typeof validSeverities[number])
      : 'notable' as const;

    const rawCategory = String(c.routingCategory ?? 'depth_signal');
    const routingCategory = validRoutingCategories.includes(rawCategory as typeof validRoutingCategories[number])
      ? (rawCategory as typeof validRoutingCategories[number])
      : 'depth_signal' as const;

    return {
      sectionA: String(c.sectionA ?? ''),
      claimA: String(c.claimA ?? ''),
      sectionB: String(c.sectionB ?? ''),
      claimB: String(c.claimB ?? ''),
      severity,
      suggestedResolution: c.likelyResolution ?? c.nature ?? '',
      nature: c.nature ?? '',
      routingCategory,
      canCoexist: Boolean(c.canCoexist ?? false),
      likelyResolution: c.likelyResolution ?? null,
      evidenceA: String(c.evidenceA ?? ''),
      evidenceB: String(c.evidenceB ?? ''),
      source: 'adversarial' as const,
    };
  });

  // Merge — if EITHER pass says incoherent, the merged report is incoherent
  const allContradictions = [...taggedPrimary, ...adversarialIssues];
  const hasBlockingContradiction = allContradictions.some((c) => c.severity === 'blocking');
  const mergedIsCoherent = primaryReport.isCoherent && adversarial.overallCoherence && !hasBlockingContradiction;

  // Build North Star assessment
  const northStarAssessment: NorthStarAssessment = {
    passesIrreplaceabilityTest: adversarial.northStarAssessment.passesIrreplaceabilityTest,
    reasoning: adversarial.northStarAssessment.reasoning,
    missingInsight: adversarial.northStarAssessment.missingInsight,
  };

  return {
    contradictions: allContradictions,
    isCoherent: mergedIsCoherent,
    programmaticContradictions: primaryReport.programmaticContradictions,
    northStarAssessment,
  };
}

// ============================================================================
// CRYSTALLIZER SERVICE
// ============================================================================

export class CrystallizerService {
  private readonly router: ProfileRouter;

  constructor() {
    this.router = new ProfileRouter();
  }

  /**
   * Crystallize the complete essay profile into North Star + Score Matrix + Coherence Report.
   *
   * Two-phase LLM pipeline:
   *   L4a (CRITICAL PATH): North Star + Score Matrix core (paragraphs, crossParagraphPatterns)
   *   L4b (NON-FATAL):     prioritizedImprovements + coachingMap + coherenceReport
   *
   * Prerequisites:
   * - L3 understanding walk completed (all paragraphs)
   * - L3.75 holistic synthesis completed (voice map, earnedness map, entanglements)
   * - L3.5 analysis pass completed (paragraph effectiveness scores)
   *
   * @param profile       The complete EssayProfile after L3.5
   * @param essayType     The essay type (determines North Star scaling)
   * @param essayText     The full essay text
   * @param priorNorthStar  Optional prior North Star for re-crystallization evolution tracking
   * @param findingStore  Optional FindingStore for adversarial pass finding context
   * @param connectionGraph Optional ConnectionGraph for adversarial pass structural context
   * @returns L4CrystallizationResult with all three artifacts + cost tracking
   */
  async crystallize(
    profile: Readonly<EssayProfile>,
    essayType: EssayType,
    essayText: string,
    // Scope 2 Phase 6a: candidateStore is the PRIMARY source of truth for L4b
    // consolidation. Passed as a required parameter so the orchestrator can't
    // accidentally skip wiring it.
    candidateStore: ImprovementCandidateStore,
    priorNorthStar?: EssayNorthStar,
    findingStore?: FindingStore,
    connectionGraph?: ConnectionGraph,
    essayId?: string,
  ): Promise<L4CrystallizationResult> {
    const startTime = Date.now();
    const scale = essayTypeToScale(essayType);
    const paragraphCount = profile.paragraphs.length;

    // ── Phase 1: Shared setup ──
    this.validatePrerequisites(profile);

    const assembledContext = this.router.assembleContext(profile, {
      rule: 'l4_crystallization',
    });

    console.log(
      `[Crystallizer] L4 crystallization starting — scale=${scale}, paragraphs=${paragraphCount}, ` +
      `contextTokens=${assembledContext.estimatedTokens}, dropped=${assembledContext.droppedSections.length}`,
    );

    // Profile context is shared between L4a and L4b calls
    const profileContext = buildProfileContext(profile, essayText, assembledContext);

    // Wave-3a Phase 3C: corpus retrieval — craft moves + archetypes. L4
    // produces the ScoreMatrix (evaluative layer), so calibration-framed
    // archetype block is appropriate here. Retrieval runs once per
    // crystallization; block reused across all 3 L4 calls (NorthStar /
    // ScoreMatrix / L4b). Stage tag 'crystallizer'. Feature-flag-gated
    // per-layer, silent-degrade.
    let corpusBlock = '';
    let injectedCrystalMoveCount = 0;
    const crystallizerCorpusTel: CorpusRetrievalTelemetry | null = isCorpusRetrievalEnabledForL4()
      ? createTelemetry()
      : null;
    if (crystallizerCorpusTel) {
      const corpusRunStart = Date.now();
      const [archetypes, moves] = await Promise.all([
        retrievePhaseArchetypes(profile, crystallizerCorpusTel, 'crystallizer'),
        retrieveAnchorMoves(essayText, profile, crystallizerCorpusTel, 'crystallizer'),
      ]);
      injectedCrystalMoveCount = moves.length;
      const archetypeBlock = buildPhaseArchetypesBlock(archetypes);
      const movesBlock = buildCorpusMovesBlock(moves);
      corpusBlock = [archetypeBlock, movesBlock].filter((s) => s.length > 0).join('\n\n');
      crystallizerCorpusTel.corpusBlockTokens += estimateBlockTokens(corpusBlock);
      crystallizerCorpusTel.totalLatencyMs = Date.now() - corpusRunStart;
    }
    const corpusPrepend = corpusBlock ? corpusBlock + '\n\n' : '';

    // ── Phase 2: L4a split calls (CRITICAL PATH — North Star then Score Matrix) ──
    const l4aStartTime = Date.now();

    // Step 1: North Star (focused, 3500 tokens)
    const northStarSystemPrompt = buildSystemPromptL4aNorthStar(scale, essayType);
    const northStarCallInstruction = buildCallInstructionL4aNorthStar(profile, scale, priorNorthStar);

    const northStarResponse = await callClaudeWithRetry<RawNorthStarOutput>({
      model: SONNET,
      systemPrompt: northStarSystemPrompt,
      userPrompt: profileContext + '\n\n' + corpusPrepend + northStarCallInstruction,
      maxTokens: L4A_NORTH_STAR_MAX_TOKENS,
      temperature: TEMPERATURE,
      useJsonMode: true,
      cacheSystemPrompt: true,
      timeoutMs: L4A_NORTH_STAR_TIMEOUT_MS,
    });

    const northStarCost = calculateCost(northStarResponse.usage, SONNET);
    const northStarTimingMs = Date.now() - l4aStartTime;

    console.log(
      `[EssayIntelligence] L4a-NorthStar: ${northStarResponse.usage.input_tokens.toLocaleString()} input + ` +
      `${northStarResponse.usage.output_tokens.toLocaleString()} output = $${northStarCost.toFixed(4)}, time=${northStarTimingMs}ms`,
    );

    // Validate North Star output
    const northStar = buildNorthStar(northStarResponse.content.northStar, scale, paragraphCount, profile);

    const roleCount = northStar.structuralRolesMap.length;
    console.log(
      `[Crystallizer] L4a-NorthStar complete — roles=${roleCount}, scale=${scale}, ` +
      `cost=$${northStarCost.toFixed(4)}, time=${northStarTimingMs}ms`,
    );

    // Step 2: Score Matrix (focused, 3500 tokens, North Star as calibration)
    const scoreMatrixStartTime = Date.now();
    const scoreMatrixSystemPrompt = buildSystemPromptL4aScoreMatrix(scale, essayType);
    const scoreMatrixCallInstruction = buildCallInstructionL4aScoreMatrix(northStar, profile, scale);

    const scoreMatrixResponse = await callClaudeWithRetry<RawScoreMatrixOutput>({
      model: SONNET,
      systemPrompt: scoreMatrixSystemPrompt,
      userPrompt: profileContext + '\n\n' + corpusPrepend + scoreMatrixCallInstruction,
      maxTokens: L4A_SCORE_MATRIX_MAX_TOKENS,
      temperature: TEMPERATURE,
      useJsonMode: true,
      cacheSystemPrompt: true,
      timeoutMs: L4A_SCORE_MATRIX_TIMEOUT_MS,
    });

    const scoreMatrixCost = calculateCost(scoreMatrixResponse.usage, SONNET);
    const scoreMatrixTimingMs = Date.now() - scoreMatrixStartTime;

    console.log(
      `[EssayIntelligence] L4a-ScoreMatrix: ${scoreMatrixResponse.usage.input_tokens.toLocaleString()} input + ` +
      `${scoreMatrixResponse.usage.output_tokens.toLocaleString()} output = $${scoreMatrixCost.toFixed(4)}, time=${scoreMatrixTimingMs}ms`,
    );

    // Validate Score Matrix output
    // Since L4a raw output has no coachingMap or prioritizedImprovements, buildScoreMatrix
    // will return empty prioritizedImprovements and undefined coachingMap (safe defaults).
    const scoreMatrix = buildScoreMatrix(
      {
        paragraphs: scoreMatrixResponse.content.scoreMatrix.paragraphs,
        crossParagraphPatterns: scoreMatrixResponse.content.scoreMatrix.crossParagraphPatterns,
        prioritizedImprovements: [], // L4a does not produce these
      },
      paragraphCount,
      profile,
    );

    // Merge costs from both L4a calls
    const l4aCost = northStarCost + scoreMatrixCost;
    const l4aTimingMs = Date.now() - l4aStartTime;

    // Merge token usage from both L4a calls
    const l4aUsage = {
      input_tokens: northStarResponse.usage.input_tokens + scoreMatrixResponse.usage.input_tokens,
      output_tokens: northStarResponse.usage.output_tokens + scoreMatrixResponse.usage.output_tokens,
      cache_read_input_tokens:
        (northStarResponse.usage.cache_read_input_tokens ?? 0) +
        (scoreMatrixResponse.usage.cache_read_input_tokens ?? 0),
      cache_creation_input_tokens:
        (northStarResponse.usage.cache_creation_input_tokens ?? 0) +
        (scoreMatrixResponse.usage.cache_creation_input_tokens ?? 0),
    };

    // Log merged L4a quality indicators
    console.log(
      `[Crystallizer] L4a complete (2 calls) — roles=${roleCount}, paragraphScores=${scoreMatrix.paragraphs.length}, ` +
      `crossPatterns=${scoreMatrix.crossParagraphPatterns.length}, cost=$${l4aCost.toFixed(4)}, time=${l4aTimingMs}ms`,
    );

    // W3.3: Post-parse anti-clustering detection for score matrix dimensions
    detectScoreClustering(scoreMatrix);

    // ── Phase 3: L4b call (FAIL-FAST — Scope 2 Phase 6a) ──
    // Scope 2 Phase 6a converted this from graceful-degradation to fail-fast.
    // The prior path defaulted to empty coherenceReport + no priorities +
    // l4bDegraded=true on any Sonnet failure. Doctrine forbids this. L4b is
    // now a hard dependency of the pipeline: if it fails, PipelineError.
    let coherenceReport: CoherenceReport;
    let l4bCost = 0;
    let l4bTimingMs: number | undefined;
    let l4bInputTokens = 0;
    let l4bOutputTokens = 0;
    let l4bCacheReadTokens = 0;
    let l4bCacheWriteTokens = 0;

    // Scope 2 Phase 6a: fail-fast on empty candidate store before we even
    // make the L4b call. This should be impossible in a fresh run (Phase 5
    // ensured L3/L3.5/L3.75 emit candidates), but the belt-and-suspenders
    // check catches systemic regressions loudly rather than letting L4b run
    // on an empty set and invent ungrounded priorities.
    if (candidateStore.size === 0) {
      throw PipelineError.emptyCandidateStore(0, ['L3', 'L3.5', 'L3.75']);
    }

    try {
      const l4bStartTime = Date.now();
      const l4bSystemPrompt = buildSystemPromptL4b(scale);
      const l4bCallInstruction = buildCallInstructionL4b(
        northStar,
        scoreMatrix,
        paragraphCount,
        candidateStore,
      );

      const l4bResponse = await callClaudeWithRetry<RawL4bOutput>({
        model: SONNET,
        systemPrompt: l4bSystemPrompt,
        userPrompt: profileContext + '\n\n' + corpusPrepend + l4bCallInstruction,
        maxTokens: L4B_MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
        timeoutMs: L4B_TIMEOUT_MS,
      });

      l4bCost = calculateCost(l4bResponse.usage, SONNET);
      l4bTimingMs = Date.now() - l4bStartTime;
      l4bInputTokens = l4bResponse.usage.input_tokens;
      l4bOutputTokens = l4bResponse.usage.output_tokens;
      l4bCacheReadTokens = l4bResponse.usage.cache_read_input_tokens ?? 0;
      l4bCacheWriteTokens = l4bResponse.usage.cache_creation_input_tokens ?? 0;

      console.log(
        `[EssayIntelligence] L4b: ${l4bResponse.usage.input_tokens.toLocaleString()} input + ` +
        `${l4bResponse.usage.output_tokens.toLocaleString()} output = $${l4bCost.toFixed(4)}, time=${l4bTimingMs}ms`,
      );

      // Parse L4b outputs — defensive against truncated JSON (any field may be missing)
      const l4bRaw = l4bResponse.content ?? {} as RawL4bOutput;

      // Parse prioritizedImprovements and merge into scoreMatrix
      const rawImprovements = Array.isArray(l4bRaw.prioritizedImprovements) ? l4bRaw.prioritizedImprovements : [];
      scoreMatrix.prioritizedImprovements = parsePrioritizedImprovements(rawImprovements, paragraphCount);

      // Parse coachingMap and merge into scoreMatrix
      if (l4bRaw.coachingMap) {
        scoreMatrix.coachingMap = buildCoachingMap(l4bRaw.coachingMap, paragraphCount);
      }

      // Parse coherenceReport (may be truncated if LLM hit max tokens)
      if (l4bRaw.coherenceReport && typeof l4bRaw.coherenceReport === 'object') {
        coherenceReport = buildCoherenceReport(l4bRaw.coherenceReport);
      } else {
        console.warn('[Crystallizer] L4b coherenceReport missing or truncated — using empty default');
        coherenceReport = { contradictions: [], isCoherent: true };
      }

      // Log L4b quality indicators
      const contradictionCount = coherenceReport.contradictions.length;
      const improvementCount = scoreMatrix.prioritizedImprovements.length;
      const coachingMapSections = scoreMatrix.coachingMap
        ? [
            scoreMatrix.coachingMap.priorities.length > 0 ? 'priorities' : null,
            scoreMatrix.coachingMap.protectedStrengths.length > 0 ? 'strengths' : null,
            scoreMatrix.coachingMap.emergentPatterns.length > 0 ? 'patterns' : null,
            scoreMatrix.coachingMap.scoreTensions.length > 0 ? 'tensions' : null,
            scoreMatrix.coachingMap.transformativeInsight.insight ? 'insight' : null,
          ].filter(Boolean)
        : [];
      console.log(
        `[Crystallizer] L4b complete — contradictions=${contradictionCount}, improvements=${improvementCount}, ` +
        `coachingMap=[${coachingMapSections.join(',')}], cost=$${l4bCost.toFixed(4)}, time=${l4bTimingMs}ms`,
      );

      if (contradictionCount === 0) {
        console.log(
          '[Crystallizer] Coherence report found zero contradictions — profile is internally consistent.',
        );
      }
    } catch (l4bError) {
      // Scope 2 Phase 6a: FAIL-FAST — no graceful degradation.
      // Previous behavior defaulted to empty coherenceReport + no priorities
      // + l4bDegraded=true, silently producing a degraded profile downstream
      // consumers treated as successful. PipelineError lets the orchestrator
      // surface the failure to logs/UI and skip downstream layers entirely.
      const inner = l4bError instanceof Error ? l4bError : new Error(String(l4bError));
      console.error(
        '[Crystallizer] L4b failed — fail-fast per doctrine:',
        inner.message,
      );
      throw PipelineError.l4bConsolidationFailed(inner, candidateStore.size);
    }

    // ── Phase 4: Adversarial Haiku Pass (non-fatal — graceful degradation) ──
    let finalCoherenceReport = coherenceReport;
    let adversarialCost: number | undefined;
    let adversarialTimingMs: number | undefined;

    // Build finding context for adversarial pass (include superseded + evidence for full picture)
    const findingCtx = findingStore && findingStore.size > 0
      ? buildFindingContext(findingStore, { includeSuperseded: true, includeEvidence: true })
      : '';

    // Build connection graph context for adversarial pass (structural islands, hubs, adjacency)
    const connectionCtx = connectionGraph
      ? buildHolisticConnectionContext(connectionGraph, paragraphCount)
      : '';

    const adversarialResult = await runAdversarialPass(
      essayText,
      profileContext,
      { northStar, scoreMatrix, coherenceReport },
      findingCtx,
      connectionCtx,
    );

    if (adversarialResult) {
      adversarialCost = adversarialResult.cost;
      adversarialTimingMs = adversarialResult.timingMs;

      finalCoherenceReport = mergeAdversarialResults(coherenceReport, adversarialResult.output);

      const adversarialContradictionCount = adversarialResult.output.contradictions.length;
      const passesIrreplaceability = adversarialResult.output.northStarAssessment.passesIrreplaceabilityTest;
      console.log(
        `[Crystallizer] Adversarial pass merged: ` +
        `+${adversarialContradictionCount} contradictions, ` +
        `irreplaceability=${passesIrreplaceability ? 'PASS' : 'FAIL'}, ` +
        `total contradictions=${finalCoherenceReport.contradictions.length}, ` +
        `isCoherent=${finalCoherenceReport.isCoherent}`,
      );

      // Log North Star failure for diagnostic purposes — do NOT re-run crystallization.
      // A mediocre North Star is still better than none. The failure assessment is stored
      // in the coherence report so re-crystallization can produce a more emergent North Star.
      if (!passesIrreplaceability) {
        console.log(
          `[Crystallizer] North Star failed irreplaceability test: ` +
          `${adversarialResult.output.northStarAssessment.reasoning.substring(0, 200)}`,
        );
      }
    }

    // ── Phase 5: Return ──
    const totalTimingMs = Date.now() - startTime;
    const totalCost = l4aCost + l4bCost + (adversarialCost ?? 0);

    // Wave-3a Phase 3C/3B: attribution detection — scan L4 outputs for
    // [MOVE-#] references and flag fabrications. Archetypes don't carry
    // numbered labels (buildPhaseArchetypesBlock uses displayName, not
    // [ARCH-#]), so we only check move labels here.
    if (crystallizerCorpusTel && injectedCrystalMoveCount > 0) {
      const outputBlob =
        JSON.stringify(northStarResponse.content) +
        JSON.stringify(scoreMatrixResponse.content) +
        (l4bCost > 0 ? JSON.stringify({ coherenceReport: finalCoherenceReport }) : '');
      const { referenced, fabricated } = detectFabricatedReferences(
        outputBlob,
        injectedCrystalMoveCount,
        0,
      );
      const moveRefs = referenced.filter((r) => r.startsWith('[MOVE-'));
      crystallizerCorpusTel.attribution.movesReferenced += moveRefs.length;
      crystallizerCorpusTel.attribution.fabricatedReferences.push(...fabricated);
      if (fabricated.length > 0) {
        console.warn(
          `[L4/corpus] Fabricated corpus references detected: ${fabricated.join(', ')}`,
        );
      }
    }

    // Wave-3a Phase 3C/3B: persist corpus telemetry for this L4 run.
    if (crystallizerCorpusTel) {
      const record = buildCorpusTelemetryRecord({
        essayId: essayId ?? 'unknown',
        layer: 'L4',
        telemetry: crystallizerCorpusTel,
      });
      void persistCorpusTelemetry(record);
    }

    return {
      northStar,
      scoreMatrix,
      coherenceReport: finalCoherenceReport,
      cost: totalCost,
      tokenUsage: {
        inputTokens: l4aUsage.input_tokens + l4bInputTokens,
        outputTokens: l4aUsage.output_tokens + l4bOutputTokens,
        cacheReadTokens: l4aUsage.cache_read_input_tokens + l4bCacheReadTokens,
        cacheWriteTokens: l4aUsage.cache_creation_input_tokens + l4bCacheWriteTokens,
      },
      timingMs: totalTimingMs,
      adversarialCost,
      adversarialTimingMs,
      l4aTimingMs,
      l4bTimingMs,
      // Scope 2 Phase 6a: l4bDegraded removed — L4b is now fail-fast, so
      // a result returning from crystallize() always has a valid L4b output.
      // Field kept on the result type (L4CrystallizationResult.l4bDegraded?)
      // for backward compat with downstream consumers that still read it;
      // always undefined on fresh runs.
      l4bDegraded: undefined,
    };
  }

  /**
   * Validate that the profile has the required data from earlier layers.
   * Throws descriptive errors if prerequisites are missing.
   */
  private validatePrerequisites(profile: Readonly<EssayProfile>): void {
    if (profile.paragraphs.length === 0) {
      throw new Error('[Crystallizer] Profile has no paragraphs — cannot crystallize an empty profile');
    }

    // Check L3 understanding (at least some paragraphs must have understanding)
    const understoodCount = profile.paragraphs.filter((p) => p.understanding !== null).length;
    if (understoodCount === 0) {
      throw new Error(
        '[Crystallizer] No paragraph understanding found — L3 understanding walk must complete before L4 crystallization',
      );
    }

    // Check L3.5 analysis (at least some paragraphs must have analysis)
    const analyzedCount = profile.paragraphs.filter((p) => p.analysis !== null).length;
    if (analyzedCount === 0) {
      throw new Error(
        '[Crystallizer] No paragraph analysis found — L3.5 analysis pass must complete before L4 crystallization',
      );
    }

    // Check holistic synthesis (L3.75) — voice identity is a good proxy
    if (!profile.voiceIdentity?.signature) {
      console.warn(
        '[Crystallizer] VoiceIdentity signature is empty — L3.75 holistic synthesis may not have completed. ' +
        'Crystallization will proceed but North Star quality may be reduced.',
      );
    }

    // Log coverage
    if (understoodCount < profile.paragraphs.length) {
      console.warn(
        `[Crystallizer] Only ${understoodCount}/${profile.paragraphs.length} paragraphs have understanding — ` +
        'crystallization will proceed with available data',
      );
    }
    if (analyzedCount < profile.paragraphs.length) {
      console.warn(
        `[Crystallizer] Only ${analyzedCount}/${profile.paragraphs.length} paragraphs have analysis — ` +
        'some effectiveness scores will be estimated',
      );
    }
  }
}

/** Singleton crystallizer service */
export const crystallizerService = new CrystallizerService();
