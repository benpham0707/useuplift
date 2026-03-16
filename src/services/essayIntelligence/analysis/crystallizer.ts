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

import { callClaude, calculateCost } from '../../../lib/llm/claude';
import { ProfileRouter } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { FindingStore, buildFindingContext } from '../findings';
import { ConnectionGraph, buildHolisticConnectionContext } from '../connections';
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
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const HAIKU = 'claude-haiku-4-5-20251001';

/** Max tokens for the crystallization call — large output covering all three artifacts */
const MAX_OUTPUT_TOKENS = 10000;

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
  piq: ['structuralRolesMap', 'distinctivenessSignature', 'trajectory'],
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
 * Build the static system prompt (Block 1 — cached across calls).
 *
 * Contains: role, North Star guidance, scoring rubric, coherence rules,
 * examples of good vs bad output, and the complete output JSON schema.
 */
function buildSystemPrompt(scale: NorthStarScale, essayType?: EssayType): string {
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

  return `You are the Crystallizer — a literary-architectural analyst who reads a complete essay profile and produces three artifacts that no earlier analysis layer creates.

YOUR THREE OUTPUTS:

1. ESSAY NORTH STAR — the architecture of meaning.
   NOT a summary. A summary is lossy compression — everything in it exists more deeply elsewhere.
   The North Star is an EMERGENT PROPERTY — an interpretive synthesis that transcends any individual profile section.
   Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence understanding) or tuning assessment (analysis). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument.

   Active dimensions for this ${scale} essay: ${activeDims.join(', ')}

${activeDims.includes('throughLineMap') ? `   THROUGH-LINE MAP (personal statements):
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

   crossParagraphPatterns: Observations that only emerge when viewing scores across paragraphs.
   Example: "Emotional intensity builds linearly — consider a dip before the climax to make it more earned."

   prioritizedImprovements: Reference North Star structural roles in whyThisMatters.
   BAD: "Improve the opening paragraph."
   GOOD: "P1 is the frame of economic risk that makes P3's emotional stakes legible — but its current effectiveness (62) means the reader hasn't internalized the appraiser's logic before being asked to feel the ring's non-market value."

3. COHERENCE REPORT — ACTIVE INVESTIGATION of contradictions ACROSS profile sections.
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

4. COACHING MAP — structured improvement hierarchy (on scoreMatrix).
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

   emergentPatterns: Observations that only emerge when viewing the complete scoring picture.
   Pattern + evidence + implication for coaching.

   scoreTensions: Paragraphs where the 5 scores tell a story of tension.
   E.g., high structural importance (90) but low effectiveness (55) = high-priority gap.
   Include the paragraph index, tension description, interpretation, and coaching implication.

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
    "crossParagraphPatterns": ["..."],
    "prioritizedImprovements": [
      { "paragraph": <index>, "improvement": "...", "whyThisMatters": "...", "expectedImpact": "transformative"|"significant"|"incremental" }
    ],
    "coachingMap": {
      "transformativeInsight": { "insight": "...", "evidenceLocations": [{"paragraph": 0, "sentence": 2}], "whyThisTransforms": "...", "requiresStudentAwareness": true|false },
      "priorities": [{ "priority": "...", "target": { "paragraphs": [0], "description": "..." }, "architecturalReason": "...", "unlocksNext": "...", "expectedImpact": "transformative"|"significant"|"incremental" }],
      "protectedStrengths": [{ "description": "...", "locations": [{"paragraph": 0}], "whyProtect": "..." }],
      "emergentPatterns": [{ "pattern": "...", "evidence": "...", "implication": "..." }],
      "scoreTensions": [{ "paragraph": 0, "tension": "...", "interpretation": "...", "coachingImplication": "..." }]
    }
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
 * Build the call-specific instruction (Block 3 — not cached).
 *
 * Contains the specific crystallization instruction with paragraph count
 * and effectiveness scores for score matrix calibration.
 */
function buildCallInstruction(
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

  return `Crystallize the profile above into the North Star, Paragraph Score Matrix, and Coherence Report.

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
- The coherence report should surface genuine internal tensions. Contradictions are used productively downstream — report them honestly. Zero is fine if the profile is truly consistent.
- For distinctiveness: if your signature could describe any essay about this topic, make it more specific to THIS essay's execution.
- For coherence: ACTIVELY investigate each section pair. Classify each contradiction with routingCategory, canCoexist, and evidence.
- For coaching map: the transformativeInsight should be the SINGLE most important thing the student needs to understand.
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
 * Validate and coerce the raw LLM output into typed structures.
 * Defensive: handles missing fields, wrong types, out-of-range values.
 */
function validateAndCoerce(
  raw: RawCrystallizationOutput,
  scale: NorthStarScale,
  paragraphCount: number,
  profile: Readonly<EssayProfile>,
): { northStar: EssayNorthStar; scoreMatrix: ParagraphScoreMatrix; coherenceReport: CoherenceReport } {
  return {
    northStar: buildNorthStar(raw.northStar, scale, paragraphCount, profile),
    scoreMatrix: buildScoreMatrix(raw.scoreMatrix, paragraphCount, profile),
    coherenceReport: buildCoherenceReport(raw.coherenceReport),
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

  // --- Cross-paragraph patterns ---
  const crossParagraphPatterns = Array.isArray(raw.crossParagraphPatterns)
    ? raw.crossParagraphPatterns.map((p: unknown) => String(p))
    : [];

  // --- Prioritized improvements ---
  const rawImprovements = Array.isArray(raw.prioritizedImprovements) ? raw.prioritizedImprovements : [];
  const validImpacts = ['transformative', 'significant', 'incremental'] as const;
  const prioritizedImprovements = rawImprovements
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
function buildCoachingMap(raw: unknown, paragraphCount: number): CoachingMap | undefined {
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

  // --- Emergent Patterns ---
  const rawPatterns = Array.isArray(r.emergentPatterns) ? r.emergentPatterns : [];
  const emergentPatterns = rawPatterns
    .filter((p: unknown) => p && typeof p === 'object')
    .map((p: Record<string, unknown>) => ({
      pattern: String(p.pattern ?? ''),
      evidence: String(p.evidence ?? ''),
      implication: String(p.implication ?? ''),
    }));

  // --- Score Tensions ---
  const rawTensions = Array.isArray(r.scoreTensions) ? r.scoreTensions : [];
  const scoreTensions = rawTensions
    .filter((t: unknown) => t && typeof t === 'object')
    .map((t: Record<string, unknown>) => ({
      paragraph: clampInt(t.paragraph as number, 0, paragraphCount - 1),
      tension: String(t.tension ?? ''),
      interpretation: String(t.interpretation ?? ''),
      coachingImplication: String(t.coachingImplication ?? ''),
    }));

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
    const response = await callClaude<AdversarialContradictionOutput>({
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
    priorNorthStar?: EssayNorthStar,
    findingStore?: FindingStore,
    connectionGraph?: ConnectionGraph,
  ): Promise<L4CrystallizationResult> {
    const startTime = Date.now();
    const scale = essayTypeToScale(essayType);
    const paragraphCount = profile.paragraphs.length;

    // Validate prerequisites
    this.validatePrerequisites(profile);

    // Assemble context via Profile Router
    const assembledContext = this.router.assembleContext(profile, {
      rule: 'l4_crystallization',
    });

    console.log(
      `[Crystallizer] L4 crystallization starting — scale=${scale}, paragraphs=${paragraphCount}, ` +
      `contextTokens=${assembledContext.estimatedTokens}, dropped=${assembledContext.droppedSections.length}`,
    );

    // Build 3-block prompt structure (W3.2: pass essayType for calibration guidance)
    const systemPrompt = buildSystemPrompt(scale, essayType);
    const profileContext = buildProfileContext(profile, essayText, assembledContext);
    const callInstruction = buildCallInstruction(profile, scale, priorNorthStar);

    // Single Sonnet call with 3-block caching
    const response = await callClaude<RawCrystallizationOutput>({
      model: SONNET,
      systemPrompt,
      userPrompt: profileContext + '\n\n' + callInstruction,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET);
    console.log(
      `[EssayIntelligence] L4: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );
    const timingMs = Date.now() - startTime;

    // Validate and coerce LLM output into typed structures
    const { northStar, scoreMatrix, coherenceReport } = validateAndCoerce(
      response.content,
      scale,
      paragraphCount,
      profile,
    );

    // Log quality indicators
    const roleCount = northStar.structuralRolesMap.length;
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
      `[Crystallizer] L4 primary complete — ` +
      `roles=${roleCount}, contradictions=${contradictionCount}, improvements=${improvementCount}, ` +
      `coachingMap=[${coachingMapSections.join(',')}], ` +
      `cost=$${cost.toFixed(4)}, time=${timingMs}ms`,
    );

    // Log if coherence report found zero contradictions (this is a valid outcome)
    if (contradictionCount === 0) {
      console.log(
        '[Crystallizer] Coherence report found zero contradictions — profile is internally consistent.',
      );
    }

    // W3.3: Post-parse anti-clustering detection for score matrix dimensions
    detectScoreClustering(scoreMatrix);

    // ── Adversarial Haiku Pass (non-fatal — graceful degradation) ──
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

    const totalTimingMs = Date.now() - startTime;

    return {
      northStar,
      scoreMatrix,
      coherenceReport: finalCoherenceReport,
      cost: cost + (adversarialCost ?? 0),
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs: totalTimingMs,
      adversarialCost,
      adversarialTimingMs,
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
