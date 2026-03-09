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
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';

/** Max tokens for the crystallization call — large output covering all three artifacts */
const MAX_OUTPUT_TOKENS = 10000;

/** Temperature — low for deterministic synthesis, slight creativity for interpretation */
const TEMPERATURE = 0.3;

// ============================================================================
// L4 OUTPUT TYPES
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
}

/**
 * CoherenceReport — all contradictions found + overall coherence verdict.
 */
export interface CoherenceReport {
  contradictions: CoherenceIssue[];
  /** False if any blocking contradictions exist */
  isCoherent: boolean;
}

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
function buildSystemPrompt(scale: NorthStarScale): string {
  const activeDims = ACTIVE_DIMENSIONS[scale];

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

   verdict: A single sentence capturing the paragraph's architectural assessment.
   BAD: "Good paragraph with strong writing."
   GOOD: "Carries the essay's emotional load but underearns P4's revelation by telling rather than showing the grandmother's gesture."

   priorityForImprovement: 1 (fine) to 5 (urgent). Load-bearing paragraphs with low scores get highest priority.

   crossParagraphPatterns: Observations that only emerge when viewing scores across paragraphs.
   Example: "Emotional intensity builds linearly — consider a dip before the climax to make it more earned."

   prioritizedImprovements: Reference North Star structural roles in whyThisMatters.
   BAD: "Improve the opening paragraph."
   GOOD: "P1 is the frame of economic risk that makes P3's emotional stakes legible — but its current effectiveness (62) means the reader hasn't internalized the appraiser's logic before being asked to feel the ring's non-market value."

3. COHERENCE REPORT — contradictions ACROSS profile sections.
   Cross-check the profile for internal tensions. Examples:
   - Voice map shows 4 unintentional shifts but voiceIdentity says "consistent throughout"
   - Earnedness map says P4 is well-earned but analysis shows only 55 effectiveness
   - Structural roles say P2 is load-bearing but score matrix shows it's the weakest paragraph
   - Thematic architecture says thesis emerges in P3 but through-line traces meaning from P1

   These contradictions are diagnostic gold. If you find ZERO contradictions, look harder —
   every complex profile has tensions worth surfacing. Even a well-written essay has places
   where different analytical lenses see different things.

   severity:
   - "blocking": the profile contradicts itself in a way that would confuse downstream consumers
   - "notable": genuine tension that reveals something about the essay
   - "minor": a nuance difference between sections

   isCoherent: false if ANY blocking contradictions exist.

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
    ]
  },
  "coherenceReport": {
    "contradictions": [
      { "sectionA": "...", "claimA": "...", "sectionB": "...", "claimB": "...", "severity": "blocking"|"notable"|"minor", "suggestedResolution": "..." }
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
- The coherence report should find at least 1-2 tensions — zero contradictions means you haven't looked hard enough.
- For distinctiveness: if your signature could describe any essay about this topic, make it more specific to THIS essay's execution.
${scale === 'personal_statement' ? '- Intent bridge: studentIntent is null (no L6 conversation yet). System reading should articulate what the system understands the essay to be doing.' : ''}`;
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
  };
  scoreMatrix: {
    paragraphs: unknown[];
    crossParagraphPatterns: string[];
    prioritizedImprovements: unknown[];
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

  return {
    activeScale: scale,
    throughLineMap,
    structuralRolesMap,
    trajectory,
    distinctivenessSignature,
    intentBridge,
    confidence,
    lastUpdatedBy: 'L4',
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
  };
}

/**
 * Build validated CoherenceReport from raw LLM output.
 */
function buildCoherenceReport(raw: RawCrystallizationOutput['coherenceReport']): CoherenceReport {
  const rawContradictions = Array.isArray(raw.contradictions) ? raw.contradictions : [];
  const validSeverities = ['blocking', 'notable', 'minor'] as const;

  const contradictions: CoherenceIssue[] = rawContradictions
    .filter((c: unknown) => c && typeof c === 'object')
    .map((c: Record<string, unknown>) => {
      const rawSeverity = String(c.severity ?? 'minor');
      const severity = validSeverities.includes(rawSeverity as typeof validSeverities[number])
        ? (rawSeverity as typeof validSeverities[number])
        : 'minor' as const;

      return {
        sectionA: String(c.sectionA ?? ''),
        claimA: String(c.claimA ?? ''),
        sectionB: String(c.sectionB ?? ''),
        claimB: String(c.claimB ?? ''),
        severity,
        suggestedResolution: String(c.suggestedResolution ?? ''),
      };
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
   * @param profile    The complete EssayProfile after L3.5
   * @param essayType  The essay type (determines North Star scaling)
   * @param essayText  The full essay text
   * @returns L4CrystallizationResult with all three artifacts + cost tracking
   */
  async crystallize(
    profile: Readonly<EssayProfile>,
    essayType: EssayType,
    essayText: string,
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

    // Build 3-block prompt structure
    const systemPrompt = buildSystemPrompt(scale);
    const profileContext = buildProfileContext(profile, essayText, assembledContext);
    const callInstruction = buildCallInstruction(profile, scale);

    // Single Sonnet call with 3-block caching
    const response = await callClaudeWithRetry<RawCrystallizationOutput>({
      model: SONNET,
      systemPrompt,
      userPrompt: profileContext + '\n\n' + callInstruction,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET);
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
    console.log(
      `[Crystallizer] L4 complete — ` +
      `roles=${roleCount}, contradictions=${contradictionCount}, improvements=${improvementCount}, ` +
      `cost=$${cost.toFixed(4)}, time=${timingMs}ms`,
    );

    // Warn if coherence report found zero contradictions
    if (contradictionCount === 0) {
      console.warn(
        '[Crystallizer] Coherence report found zero contradictions — this is unusual. ' +
        'Every complex profile should have at least minor tensions between analytical lenses.',
      );
    }

    return {
      northStar,
      scoreMatrix,
      coherenceReport,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs,
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
