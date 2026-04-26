// ============================================================================
// L3 REDESIGN OUTPUT TYPES (Phase 0 D-0.15)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L3/PLAN.md
//   + docs/pipeline-evolution/04-pipeline-architecture/L3-75/L3_ABSORBS_L3_75.md
//   ("Lens ownership of holistic-profile fields").
// Contract (D-0.15): TypeScript scaffold for the L3 redesign's Sweep
// output, four lens outputs (Voice / Meaning / Story / Admissions), and
// Pass 3 cross-dimension synthesis output. Field shapes that already
// exist on EssayProfile (voiceIdentity, voiceMap, thematicArchitecture,
// narrativeStrategy, admissionsPositioning, craftAssessment, etc.) are
// referenced via Pick<> imports — the L3.75 absorption decision
// guarantees lens emissions land directly into the existing profile
// shapes. Net-new sub-types are defined locally as minimal scaffolds;
// Phase 4 prompt deliverables (D-4a.1 through D-4a.6) tighten the
// shapes if Phase 4 prompt design demands it.
//
// LLM-first discipline (per memory feedback file
// `feedback_llm-first-design.md`): keep emit-shape sub-types minimal.
// The lens prompt (Phase 4) describes the LLM's perception in prose
// inside the structured output; the type carries enough structure for
// downstream consumers to route, not enough to ceiling LLM intelligence.

import type {
  AdmissionsPositioning,
  CharacterRevelation,
  CraftAssessment,
  CrossDimensionEntanglement,
  EmotionalTopography,
  ImprovementPhaseLevel,
  MomentEarnednessMap,
  NarrativeStrategy,
  ThematicArchitecture,
  VoiceIdentity,
  VoiceMap,
} from '../../profileTypes';

// ============================================================================
// SWEEP — Pass 1 (one Sonnet call, ~$0.10–$0.15)
// ============================================================================

/**
 * One sentence's understanding produced by Sweep.
 *
 * Lighter than today's walk's per-sentence ObservationEntry tables —
 * Sweep emits enough to feed lens deep reads, not the full deepWalk
 * output. Phase 4 D-4a.1 (Sweep prompt) tightens the field set against
 * actual lens consumption.
 */
export interface SweepSentenceUnderstanding {
  paragraphIndex: number;
  sentenceIndex: number;
  /** What this sentence is doing in the essay (descriptive). */
  apparentFunction: string;
  /** Inferred student intent for this sentence (descriptive, may be hypothesis). */
  inferredIntent?: string;
  /** Tags Phase 4 prompt may attach for routing (open vocabulary, LLM-judged). */
  tags?: string[];
}

/**
 * Per-paragraph role assignment from Sweep.
 *
 * Mirrors the structural-roles concept that L2 cartography produces but
 * at the sweep level — Sweep's role assignment incorporates Sweep's
 * sentence understanding, so it can refine L2's structural read.
 */
export interface SweepParagraphRole {
  paragraphIndex: number;
  role: string;
  /** Whether this paragraph carries weight that Pass 3 should bind to. */
  significance: 'load_bearing' | 'supporting' | 'transitional';
  rationale: string;
}

/**
 * One edge in the Sweep connection graph.
 *
 * Sweep observes connections as it reads; these feed L2.5 scout's
 * forward-looking signals and the lens deep reads.
 */
export interface SweepConnection {
  id: string;
  from: { paragraph: number; sentence?: number };
  to: { paragraph: number; sentence?: number };
  /** Free-text description of what connects them — LLM-judged. */
  kind: string;
  /** Strength category — closed enum for routing. */
  strength: 'foundational' | 'supporting' | 'subtle';
}

/**
 * Sweep's lensDispatch score for a single lens.
 *
 * Drives the lens dispatcher (Phase 4 D-4a.7) — only lenses scoring
 * above threshold run for this essay. The rationale is required so
 * the dispatcher's decisions are auditable and the prompt can be
 * tuned when over- or under-dispatch is observed.
 */
export interface SweepLensDispatchScore {
  lens: 'voice' | 'meaning' | 'story' | 'admissions';
  score: 1 | 2 | 3 | 4 | 5;
  rationale: string;
}

/**
 * Pass 1 — Sweep — one Sonnet call.
 *
 * Spec: L3/PLAN.md "Pass 1 — Sweep". Output cap ≤ 3K tokens.
 * Per L5_ITERATION_LOOP_DESIGN §4.5 (post-R-2 absorption rewrite),
 * Sweep also produces holisticEvolution snapshots that lens deep
 * reads consume as input — the field is intentionally optional
 * here because Phase 4 D-4a.1 may inline it into per-lens outputs
 * instead.
 */
export interface SweepOutput {
  sentenceUnderstanding: SweepSentenceUnderstanding[];
  paragraphRoles: SweepParagraphRole[];
  connections: SweepConnection[];
  /** Archetype name (free-text — LLM-judged, not closed taxonomy). */
  archetypeName: string;
  /** Detector confidence (0–1). */
  archetypeConfidence: number;
  /** improvementPhase estimate from Sweep — refined / overridden by phaseAssessment. */
  phaseEstimate: ImprovementPhaseLevel;
  /** Per-lens dispatch scores driving Phase 2 routing. */
  lensDispatch: SweepLensDispatchScore[];
}

// ============================================================================
// PASS 2 LENSES — 2–4 parallel Sonnet calls (~$0.06–$0.10 each)
// ============================================================================
//
// Each lens emits canonical holistic-profile fields directly (no
// synthesis transformation). Pass 3 reads lens outputs to produce
// genuinely cross-dimension fields (writerPortrait, entanglements,
// arcTrajectory, momentEarnednessMap.mechanisms) that no single lens
// can produce alone.

/**
 * Voice lens output.
 *
 * Per L3-75/L3_ABSORBS_L3_75.md "Lens ownership". Emits voiceIdentity
 * + voiceMap + voice-craft prose fields directly into the holistic
 * profile shape. No `blindSpots[]` emission anywhere (Decision A,
 * 2026-04-25 — `redFlags` on AdmissionsPositioning is the canonical home).
 */
export interface VoiceLensOutput {
  voiceIdentity: VoiceIdentity;
  voiceMap: VoiceMap;
  /** Voice-owned craft sub-fields (sentenceRhythmProse + wordPatterns). */
  craftAssessment: Pick<CraftAssessment, 'sentenceRhythmProse' | 'wordPatterns'>;
}

/**
 * One meaning gap — a point in the essay where the theme cannot be
 * earned from the text alone and would benefit from student-side
 * grounding (a dig question via the Conversator).
 *
 * Consumed by L3.5 (per the L3.5 read path) and contributes to the
 * SpecificsNeed signal aggregator (Phase 2 D-2.7).
 */
export interface MeaningGap {
  /** Where in the essay the gap surfaces. */
  location: { paragraph: number; sentence?: number };
  /** What the theme aspires to that the text can't earn. Free-text, LLM-judged. */
  gap: string;
  /** What kind of student input would resolve it. Free-form hint to the dig composer. */
  resolutionShape?: string;
}

/**
 * Value architecture — what the essay reveals about the writer's
 * priorities, ethics, lens on experience. Free-form prose since
 * value language resists closed taxonomies (LLM-first Rule 3).
 *
 * Used by L4 northStar.distinctivenessSignature articulation and by
 * L5 Move 7 (contribution framing).
 */
export interface ValueArchitecture {
  /** Headline summary — what the essay values, in the writer's frame. */
  summary: string;
  /** Specific value-claims the text makes, with paragraph anchors. */
  claims: Array<{
    paragraph: number;
    claim: string;
    /** Whether the claim is asserted vs demonstrated. */
    asserted_vs_demonstrated: 'asserted' | 'demonstrated' | 'mixed';
  }>;
}

/**
 * Meaning lens output.
 *
 * Per L3-75/L3_ABSORBS_L3_75.md "Lens ownership". Emits
 * thematicArchitecture + craftAssessment.imageSystem + meaningGaps[]
 * + valueArchitecture directly. meaningGaps[] feeds L3.5 + SpecificsNeed.
 */
export interface MeaningLensOutput {
  thematicArchitecture: ThematicArchitecture;
  /** Meaning-owned craft sub-field (imageSystem). */
  craftAssessment: Pick<CraftAssessment, 'imageSystem'>;
  meaningGaps: MeaningGap[];
  valueArchitecture: ValueArchitecture;
}

/**
 * One peak moment — a significant beat in the essay that Pass 3 will
 * bind into momentEarnednessMap.moments[].
 *
 * Story lens names peakMoments at sentence-level resolution; Pass 3
 * traces each one's earnedness mechanisms backward through the
 * connection graph. Distinct from emotionalTopography.peakMoments
 * (which captures emotional intensity) — this lives at the narrative-
 * structure level.
 */
export interface PeakMoment {
  /** Where the peak is anchored. */
  location: { paragraph: number; sentence?: number; spanText?: string };
  /** What kind of peak. Free-form — LLM may emit "decision", "turn", "insight", etc. */
  kind: string;
  /** Free-text description of the peak. */
  description: string;
}

/**
 * Stakes ladder — the essay's escalation of stakes from opening to
 * climactic moment. Story lens names the rungs; L3.5 + L4 + L5
 * consumers read it for narrative-strategy context.
 */
export interface StakesLadder {
  /** Lowest stake the essay engages (the opening's framing). */
  baseline: string;
  /** Intermediate stakes ordered low-to-high. */
  rungs: Array<{
    paragraph: number;
    stake: string;
  }>;
  /** Highest stake reached (or null if the essay never escalates). */
  peak: string | null;
}

/**
 * Story lens output.
 *
 * Per L3-75/L3_ABSORBS_L3_75.md "Lens ownership". Emits narrativeStrategy
 * (with primaryStrategy rationale merged) + craftAssessment.pacingShape
 * + peakMoments + stakesLadder + emotionalTopography contributors
 * (peakMoments + emotionalProgression).
 */
export interface StoryLensOutput {
  narrativeStrategy: NarrativeStrategy;
  /** Story-owned craft sub-field (pacingShape). */
  craftAssessment: Pick<CraftAssessment, 'pacingShape'>;
  peakMoments: PeakMoment[];
  stakesLadder: StakesLadder;
  /** Story-owned emotionalTopography contributors. arcTrajectory belongs to Pass 3. */
  emotionalTopography: Pick<EmotionalTopography, 'peakMoments' | 'emotionalProgression'>;
}

/**
 * Character signals — the qualities and values the essay surfaces
 * about the writer. Feeds Pass 3's writerPortrait synthesis.
 *
 * Free-form lists (LLM-first Rule 3) — admissions reading is
 * irreducibly contextual; closed taxonomies would ceiling intelligence.
 */
export interface CharacterSignals {
  /** Qualities the writer demonstrates (e.g., "intellectual restlessness", "care for others"). */
  qualities: Array<{
    quality: string;
    /** Where in the essay the quality is demonstrated. */
    evidence: Array<{ paragraph: number; sentence?: number; note: string }>;
  }>;
  /** Values the writer holds (often inferred more than asserted). */
  values: Array<{
    value: string;
    evidence: Array<{ paragraph: number; sentence?: number; note: string }>;
  }>;
}

/**
 * Admissions lens output.
 *
 * Per L3-75/L3_ABSORBS_L3_75.md "Lens ownership". Emits
 * admissionsPositioning (with required `fix` on every redFlag —
 * Decision A, 2026-04-25) + characterSignals (feed Pass 3 writerPortrait).
 */
export interface AdmissionsLensOutput {
  admissionsPositioning: AdmissionsPositioning;
  characterSignals: CharacterSignals;
}

// ============================================================================
// PASS 3 — Cross-dimension synthesis (one Sonnet call, ~$0.08)
// ============================================================================
//
// Anti-drift commitment per L3-75/L3_ABSORBS_L3_75.md decision #1:
// Pass 3 stays one call, four fields, no iteration. Forever. The fifth
// optional field (connectionGraphSummary) is documented in L3/PLAN.md
// but emit is gated.

/**
 * Pass 3 output — four cross-dimension fields no single lens can
 * produce alone. Output cap 3–4K tokens.
 *
 * Per L3/PLAN.md, every Pass 3 field traces to named lens outputs in
 * its inputs. If a field cannot be produced from lens inputs, that's
 * a lens gap — the prompt deliverable (D-4a.6) escalates to fixing
 * the lens, not iterating Pass 3.
 */
export interface Pass3Output {
  /**
   * `characterRevelation.writerPortrait` — lunch-with paragraph
   * cross-pulling Voice + Meaning + Admissions. Pick<> from existing
   * CharacterRevelation since the field already exists in profileTypes.
   */
  characterRevelation: Pick<CharacterRevelation, 'writerPortrait'>;
  /**
   * `entanglements[]` — locations where ≥2 lens observations converge
   * meaningfully. Cap 3 (foundational + supporting only; subtle dropped).
   * Existing CrossDimensionEntanglement type carries the shape.
   */
  entanglements: CrossDimensionEntanglement[];
  /**
   * `emotionalTopography.arcTrajectory` — prose binding Story arc +
   * Voice tonal + Meaning stakes. Pick<> from existing EmotionalTopography.
   */
  emotionalTopography: Pick<EmotionalTopography, 'arcTrajectory'>;
  /**
   * `momentEarnednessMap.moments[].mechanisms[]` — backward-traces
   * each peak moment via connection graph + setups + stakes; density-
   * not-booleans. Pass 3 reads Story lens's peakMoments + stakesLadder
   * to populate this.
   */
  momentEarnednessMap: Pick<MomentEarnednessMap, 'moments'>;
  /**
   * Optional 5th: topology prose for the connection graph. Emit is
   * gated by Phase 4 prompt design — present as scaffold so consumers
   * can read it when available.
   */
  connectionGraphSummary?: string;
}
