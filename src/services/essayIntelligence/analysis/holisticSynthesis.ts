/**
 * Holistic Synthesis Service — Layer 3.75
 *
 * Single Sonnet call after L3's walk completes. Reads ALL sentence-level
 * understanding and synthesizes 10 holistic sections in one call.
 *
 * This layer's unique advantage: the walk saw BACKWARD (sequential, paragraph
 * by paragraph). L3.75 sees EVERYTHING simultaneously — every sentence's
 * purpose, every connection, the complete narrative arc.
 *
 * The walk's `holisticEvolution` accumulator is a starting scaffold.
 * L3.75 confirms, deepens, or corrects it from the full picture.
 *
 * Produces the authoritative holistic profile that the Profile Manager's
 * HolisticMutator.applyFullSupersession() writes into the EssayProfile.
 *
 * Spec: docs/plan-sections/02-layer-specs.md (L3.75 section)
 * Types: src/services/essayIntelligence/profileTypes.ts (HolisticSynthesisOutput)
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import type {
  HolisticSynthesisOutput,
  VoiceIdentity,
  VoiceMap,
  VoiceMapDimension,
  VoiceMapDimensionWithDomains,
  VoiceMapDimensionWithQualities,
  VoiceShift,
  VoiceObservation,
  CodeSwitchEvent,
  EmotionalTopography,
  MomentEarnednessMap,
  EarnedMoment,
  EarningMechanism,
  ThematicArchitecture,
  NarrativeStrategy,
  CharacterRevelation,
  CraftAssessment,
  CrossDimensionEntanglement,
  AdmissionsPositioning,
  EssayProfile,
  HolisticDimension,
  TonalQuality,
  VoiceDimension,
  EarningMechanismType,
  ThreadStrength,
  ConnectionEndpoint,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionRoutingTag,
  FindingScope,
  FindingMaturity,
  FindingCoachingValue,
  FindingEvidence,
  DeltaSynthesisRequest,
  DeltaSynthesisOutput,
  HolisticSectionType,
  SynthesisIterationOutput,
  ReadingStrategy,
  QuestionCurationOutput,
  UnderstandingQuestion,
  GrowthStepRecord,
  ImprovementPhase,
  Finding,
  EssayUnderstanding,
  SignatureMove,
  SignatureMoveInstance,
} from '../profileTypes';
import { validateSignatureMoveAgainstParagraphs } from '../profileManager/validation/intraDomainValidation';
import { FindingStore } from '../findings/findingStore';
import {
  buildFindingReferenceContext,
} from '../findings/findingContextBuilder';
import {
  TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  normalizeTechnique,
} from './techniqueVocabulary';
import type { StudentVoiceProfile } from '../../voiceProfile/types';
import { buildPriorVoiceBlock } from './priorVoiceBlock';
import { buildAiRiskSignalBlock } from './aiRiskSignalBlock';
import {
  isCorpusRetrievalEnabledForL375,
  createTelemetry,
  retrievePhaseArchetypes,
  buildDescriptiveArchetypesBlock,
  estimateBlockTokens,
  type CorpusRetrievalTelemetry,
} from './corpusRetrievalBlocks';
import { buildCorpusTelemetryRecord, persistCorpusTelemetry } from './corpusTelemetryPersistence';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const SYNTHESIS_TEMPERATURE = 0.4;
// Tightened from 12K/10K. The MECHANISM QUALITY STANDARD (only count genuine
// sensory/emotional experiences, not dead metaphors) + person portrait "lunch" framing
// + observation economy all produce more concise, higher-quality output. The LLM should
// focus on the most valuable insights, not fill a large token budget with filler.
/** Phase A (voice+earned-ness) — concise voice map + earned-ness with strict mechanism quality */
const SYNTHESIS_MAX_TOKENS_PHASE_A = 8000;
/**
 * Phase B (theme+narrative+character+craft+admissions+entanglements) — 6 sections.
 * Raised from 7000 → 10000 → 14000 after confirmed truncation on dense essays
 * (Crochet hit 10000 cap mid-craftAssessment, omitting admissionsPositioning +
 * entanglements). 14K gives ~70% headroom over the typical ~7-8K legitimate
 * output for dense-history essays. Combined with the BREVITY DISCIPLINE prompt
 * preamble (added 2026-05-03), expected typical output ~5000-7000 tokens; the
 * 14K cap is the safety belt for outliers, not the target.
 *
 * Per the original tuning principle: silently empty sections = worse than a
 * hard fail. Raise the cap rather than weaken the parse contract.
 */
const SYNTHESIS_MAX_TOKENS_PHASE_B = 14000;
/** 5 minutes per phase — each phase generates ~8K tokens, well within this limit */
const SYNTHESIS_TIMEOUT_MS = 300_000;
/** W5.3: Delta synthesis needs ~4K tokens (only 1-3 sections) */
const DELTA_SYNTHESIS_MAX_TOKENS = 6000;
/** W5.3: 2 minutes for delta synthesis — much smaller output than full synthesis */
const DELTA_SYNTHESIS_TIMEOUT_MS = 120_000;

// ── V2 Growth Cycle Constants ──
/** Phase Meta: walk validation + reading strategy + convergence (~3K tokens) */
const META_MAX_TOKENS = 4000;
const META_TIMEOUT_MS = 120_000;
/** Question Curation call (~2K tokens) */
const CURATION_MAX_TOKENS = 4000;
const CURATION_TIMEOUT_MS = 120_000;
/** Signature Move call (Quality Gap 1) — ONE move + 3-5 instances + reader effect (~1.5K tokens typical) */
const SIGNATURE_MOVE_MAX_TOKENS = 3000;
const SIGNATURE_MOVE_TIMEOUT_MS = 90_000;

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input to the holistic synthesis service.
 * Assembled by the orchestrator after L3 walk completes.
 */
export interface HolisticSynthesisInput {
  /** The essay text with paragraph markers [P0], [P1], etc. */
  essayText: string;
  /** Complete profile after L3 walk (all paragraph/sentence understanding populated) */
  profile: EssayProfile;
  /**
   * Wave-3a Phase 3C: essay UUID threaded for corpus telemetry persistence.
   * Optional — 'unknown' is recorded if caller doesn't supply one.
   */
  essayId?: string;
  /**
   * L3's holistic evolution accumulator — starting scaffold.
   * Only 4 fields: centralThesis, thesisConfidence, voiceSignature, arcMomentum.
   */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
  };
  /**
   * W1.4: FindingStore for injecting existing finding context into synthesis prompts.
   * When provided, synthesis can evolve existing findings and produce new essay-level ones.
   */
  findingStore?: FindingStore;
  /**
   * Port A2 (Wave-1a): Prior StudentVoiceProfile carried forward from earlier
   * essays by this user. When non-null, L3.75 Phase A receives an
   * A2_VOICE_PRIOR block in its user prompt so the current essay's voice is
   * described with cross-essay context. When null/undefined, the block is
   * omitted entirely (pre-port-identical behavior — no "no prior" framing).
   * Gated by ENABLE_VOICE_PROFILE_IMPORT in the orchestrator.
   */
  priorVoiceProfile?: StudentVoiceProfile | null;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Complete result from L3.75 holistic synthesis.
 * The `synthesis` field maps directly to the profile via HolisticMutator.applyFullSupersession().
 */
export interface HolisticSynthesisResult {
  /** The 10 holistic section outputs — writes directly into profile */
  synthesis: HolisticSynthesisOutput;
  /** Whether all 10 sections have substantive content */
  isComplete: boolean;
  /** Names of sections that are missing or effectively empty */
  missingSections: string[];
  /** Cost of the Sonnet call in USD */
  cost: number;
  /** Token usage breakdown */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Wall-clock time in milliseconds */
  timingMs: number;
}

/**
 * W5.3: Result from delta synthesis (targeted re-synthesis of specific sections).
 */
export interface DeltaSynthesisResult {
  /** The delta synthesis output with partial holistic data */
  output: DeltaSynthesisOutput;
  /** Cost of the Sonnet call in USD */
  cost: number;
  /** Token usage breakdown */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Wall-clock time in milliseconds */
  timingMs: number;
}

// ============================================================================
// V2: ITERATION INPUT TYPE
// ============================================================================

/**
 * Input to synthesizeIteration() — one iteration of the growth cycle.
 * Includes prior iteration state for convergence judgment.
 */
export interface SynthesisIterationInput {
  /** The essay text */
  essayText: string;
  /** Complete profile after L3 walk */
  profile: EssayProfile;
  /** L3's holistic evolution accumulator */
  walkEvolution: HolisticSynthesisInput['holisticEvolution'];
  /** Prior iteration's synthesis (null for first iteration) */
  previousSynthesis: HolisticSynthesisOutput | null;
  /** Prior iteration's reading strategy (null for first iteration) */
  previousReadingStrategy: ReadingStrategy | null;
  /** Questions to curate — walk questions on first iter, curated queue on subsequent */
  questionQueue: UnderstandingQuestion[];
  /** Cumulative findings from walk + deep dives + re-reads */
  cumulativeFindings: Finding[];
  /** Activity log for convergence context */
  activityLog: GrowthStepRecord[];
  /** Prior improvement phase (available on re-analysis) */
  priorPhase?: ImprovementPhase;
  /** Current iteration number (0-based) */
  iterationNumber: number;
  /** Budget ceiling for the growth cycle */
  budgetCeiling?: number;
  /** Budget remaining */
  budgetRemaining?: number;
  /** FindingStore for finding context injection */
  findingStore?: FindingStore;
  /**
   * Port A2 (Wave-1a): Prior StudentVoiceProfile for this user. Threaded from
   * orchestrator so every growth-cycle iteration carries the same prior
   * context. See HolisticSynthesisInput.priorVoiceProfile for semantics.
   */
  priorVoiceProfile?: StudentVoiceProfile | null;
  /**
   * Wave-3a Phase 3C: essay UUID threaded for corpus telemetry persistence.
   */
  essayId?: string;
}

/**
 * Result from a single synthesis iteration.
 */
export interface SynthesisIterationResult {
  /** The iteration output (synthesis + validation + meta) */
  output: SynthesisIterationOutput;
  /** Cost of all calls in this iteration */
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

// ============================================================================
// SYSTEM PROMPT (BLOCK 1 — CACHEABLE)
// ============================================================================

// ── Shared preamble for both phases ──
const SHARED_PREAMBLE = `You are an expert essay holistic synthesizer. You have been given the COMPLETE sentence-level understanding of an essay from a deep sequential walk. Your task is to synthesize holistic sections that capture the essay as a WHOLE.

The sequential walk saw each paragraph in order and built understanding forward. YOUR unique advantage: you see EVERYTHING simultaneously. You can trace connections the walk could not — how a voice shift in paragraph 4 mirrors the emotional arc that started in paragraph 1, how an image in the opening becomes a metaphor by the closing.

=== CRITICAL CONSTRAINT — Understanding Only (Anti-Contamination) ===

You are describing WHAT IS, not evaluating HOW WELL. Evaluation belongs in the analysis layer (L3.5), not here.

FORBIDDEN VOCABULARY (these belong in the analysis layer, not here):
- Evaluative judgments: "weak", "strong", "effective", "ineffective", "successful", "fails", "impressive", "lacking"
- Prescriptive language: "should", "needs to", "must improve", "could be better", "would benefit from"
- Comparative quality: "excellent", "poor", "mediocre", "masterful", "sophisticated", "clumsy", "awkward"
- Score-adjacent: "high-quality", "low-quality", "well-crafted", "poorly executed"

Use DESCRIPTIVE language only. This separation is structural: L3.75 builds the understanding substrate. L3.5 evaluates it. L5 prescribes action.

CONTAMINATION EXAMPLES — what to avoid even when using "allowed" words:

CONTAMINATED (evaluative framing without banned words):
  voiceIdentity.signature: "The writer has a particularly authentic and engaging conversational style"
  emotionalTopography.arcTrajectory: "The emotional journey works well, building meaningfully to a satisfying resolution"

CLEAN (descriptive framing):
  voiceIdentity.signature: "The writer uses second-person address in reflective passages and switches to fragmented, staccato sentences during action sequences. The vocabulary draws from two registers: clinical medical terminology and informal family speech."
  emotionalTopography.arcTrajectory: "Emotion moves from controlled restraint (P0-P1) through escalating tension (P2-P3, marked by shorter sentences and present tense) to an unguarded disclosure in P4S3, followed by reflective distance in the closing."

GENERAL STANDARDS:
- Be specific. Use paragraph and sentence numbers. Quote text where it grounds your observation.
- The walk's holistic evolution is a STARTING POINT. Confirm what's accurate, deepen what's shallow, correct what's wrong.
- All paragraph indices are 0-based. All sentence indices are 0-based within their paragraph.
- Return ONLY valid JSON matching the schema. No markdown, no explanation, no preamble.`;

/**
 * Phase A system prompt — Voice, Emotion, Earned-ness, Entanglements
 * These are the perceptual/experiential dimensions that trace HOW the essay works.
 */
const SYSTEM_PROMPT_PHASE_A = `${SHARED_PREAMBLE}

=== BREVITY DISCIPLINE (read before producing output) ===

Each field below has a target depth. Hit the target — don't exceed it. Lists (observations, dimensions, peakMoments, etc.) cap at ~5 entries each unless the essay genuinely warrants more. Per-entry prose: one tight sentence, not a paragraph. Total output should land at ~3000-4500 tokens. If you find yourself producing 6000+ tokens, STOP — your entries are too verbose. Re-read and compress.

=== OUTPUT SCHEMA (Phase A: Voice + Emotion + Earned-ness) ===

Return a single JSON object with EXACTLY these 4 top-level keys:

{
  "voiceIdentity": {
    "signature": "<one-paragraph description of the writer's voice — be specific and vivid, not generic>",
    "register": "<primary register: conversational, academic, lyrical, etc.>",
    "distinctivePatterns": ["<pattern 1>", "<pattern 2>", "..."],
    "evolution": "<how voice evolves through the essay — narrative of voice movement>",
    "authenticVsPerformed": [
      {
        "location": [<paragraph>, <sentence>],
        "assessment": "authentic" | "performed",
        "reasoning": "<why this moment reads as genuine or rehearsed>"
      }
    ]
  },

  "voiceMap": {
    "register": {
      "baseline": "<the essay's dominant register>",
      "observations": [
        {
          "location": { "paragraph": <n>, "sentenceRange": [<start>, <end>] },
          "observation": "<what register is doing here>",
          "dimensions": ["register"]
        }
      ]
    },
    "vocabularyFingerprint": {
      "baseline": "<dominant vocabulary character>",
      "observations": [<same structure as register observations, dimensions: ["vocabulary"]>],
      "domains": [
        {
          "domain": "<vocabulary domain name>",
          "exampleWords": ["<word1>", "<word2>"],
          "paragraphs": [<paragraph indices>]
        }
      ]
    },
    "sentenceRhythm": {
      "baseline": "<dominant sentence rhythm/cadence>",
      "observations": [<same structure, dimensions: ["rhythm"]>]
    },
    "perspectiveDistance": {
      "baseline": "<how close the narrator typically stands to events>",
      "observations": [<same structure, dimensions: ["perspective"]>]
    },
    "tonalDisposition": {
      "baseline": "<dominant tonal coloring>",
      "observations": [<same structure, dimensions: ["tonal_disposition"]>],
      "dominantQualities": ["<TonalQuality values: humor, irony, earnestness, irreverence, solemnity, self_awareness, detachment, tenderness, defiance>"]
    },
    "shifts": [
      {
        "location": {
          "paragraph": <n>,
          "sentence": <n or omit>,
          "boundary": "paragraph_boundary" | "mid_paragraph" | "sentence_boundary"
        },
        "dimensions": ["<which VoiceDimension(s) shift: register, vocabulary, rhythm, perspective, tonal_disposition>"],
        "fromDescription": "<what voice was before>",
        "toDescription": "<what voice became>",
        "intentionality": {
          "assessment": "intentional" | "unintentional" | "ambiguous",
          "confidence": <0-1, CRITICAL: below 0.6 means present as question not assertion>,
          "reasoning": "<concrete evidence for this assessment>"
        },
        "servesFunction": "<what the shift achieves, e.g. 'emotional transition', 'thematic pivot'> or null",
        "entanglementRef": "<ID of cross-dimension entanglement if this shift IS a move in another dimension> or null"
      }
    ],
    "stabilityRegions": [
      {
        "paragraphs": [<paragraph indices where voice holds steady>],
        "voiceCharacter": "<what characterizes the voice in this stable region>"
      }
    ]
  },

  "emotionalTopography": {
    "arcTrajectory": "<how emotion moves from opening to close — the emotional journey>",
    "peakMoments": [
      {
        "location": [<paragraph>, <sentence>],
        "emotion": "<the emotion>",
        "intensity": "low" | "moderate" | "high" | "peak"
      }
    ],
    "undertones": ["<emotions felt but not stated>"],
    "emotionalProgression": [
      {
        "paragraph": <n>,
        "register": "<emotional register at this paragraph>",
        "shift": "<how emotion changed from previous paragraph>"
      }
    ],
    "showVsTell": [
      {
        "location": [<paragraph>, <sentence>],
        "assessment": "shown" | "told" | "mixed",
        "detail": "<what is shown or told and how>"
      }
    ],
    "authenticityAssessment": "<ONE sentence (≤40 words): how emotion is conveyed (sensory detail / abstraction / dialogue / action) OR what replaces it if largely absent. Map what IS there, not what should be.>"
  },

  "momentEarnednessMap": {
    "moments": [
      {
        "location": { "paragraph": <n>, "sentence": <n> },
        "momentType": "emotional" | "intellectual" | "humorous" | "subversive",
        "description": "<what the moment IS>",
        "payload": "<the emotion, idea, or effect the moment carries>",
        "mechanisms": [
          {
            "type": "sensory_grounding" | "emotional_setup" | "stakes_establishment" | "character_revelation" | "thematic_preparation" | "intellectual_scaffolding" | "comedic_subversive_setup",
            "location": { "paragraph": <n>, "sentence": <n or omit>, "sentenceRange": [<start>, <end>] },
            "contribution": "<SPECIFIC description: what this passage does for the moment. Name the exact words, images, or moves.>"
          }
        ],
        "gaps": ["<what is MISSING — specific mechanism types the essay lacks for this moment>"]
      }
    ],
    "structuralObservation": "<essay-level summary of setup-payoff architecture — NOT a score, a structural observation>"
  }
}

=== QUALITY STANDARDS ===

VOICE MAP:
- Map ALL 5 dimensions across the essay with specific locations, not just "formal in intro, informal in middle."
- For each shift, the REASONING is the assessment. Explain WHY the shift happened. Cite the textual evidence that suggests intent.
  * If you can point to clear textual evidence of intent — the shift serves a narrative purpose, aligns with structural boundaries, the student set it up — it's intentional.
  * If you cannot point to evidence of intent — voice drifts without apparent purpose, oscillates without committing — it's unintentional or ambiguous.
  * The reasoning field is the PRIMARY output. Make it specific: "The shift from technical vocabulary to intimate reflection occurs at the paragraph boundary between the coding scene and the personal realization. The student clearly separates these registers, and the shift serves the thematic pivot from external skill to internal meaning."
  * Assessment ('intentional'/'unintentional'/'ambiguous') should follow FROM the reasoning, not precede it. Set confidence based on how much textual evidence you found — high confidence only when multiple signals converge.
- Below 0.6 confidence: present as a QUESTION, not assertion. The reasoning should explain what evidence is missing.
- Include stability regions — passages where voice holds steady and what characterizes it there.

INTENTIONALITY CALIBRATION BY ESSAY QUALITY:
Your default intentionality assessment must be calibrated to the essay's overall quality level. Look at the paragraph understanding context you received — if most paragraphs have middling verdicts, the writer likely lacks craft control:
- STRONG essay (most sentences specific, voiced, architectural): voice shifts are likely intentional. The writer has demonstrated craft awareness.
- FUNCTIONAL essay (competent but generic, some cliches): voice shifts are likely UNINTENTIONAL or AMBIGUOUS. Default to "ambiguous" unless you find STRONG textual evidence (structural marker like em-dash at the shift, paragraph break aligned with thematic pivot, explicit setup).
- DEVELOPING essay (vague, telling-heavy): voice shifts are almost certainly unintentional. Default to "unintentional."
WRONG for a mediocre essay: "intentional (0.75) — The shift from sensory to abstract vocabulary enacts the paragraph's epistemological argument." (A 17-year-old writing a mediocre essay is not enacting an epistemological argument.)
RIGHT for the same essay: "ambiguous (0.45) — Register shifts from sensory to abstract at the em-dash. The em-dash suggests awareness, but the abstract vocabulary reads more like defaulting to a formal register than deliberately deploying conceptual language."

- momentEarnednessMap: Describe WHAT mechanisms exist or are absent. Do NOT say moments are "well-earned" or "unearned" — say "3 mechanisms converge" or "no sensory grounding precedes this moment."

EARNED-NESS MAP:
- For EACH significant moment (emotional, intellectual, humorous, subversive), trace BACKWARD. What earlier content earned this moment? What mechanisms were used?
- Name WHICH earlier passage, WHAT mechanism type, and HOW it earns the later moment.
- The 7 mechanism types, with examples of what rigorous earned-ness looks like:
  * sensory_grounding: "Reader feels the cold counter, smells the leather — they're physically IN the pawnshop before being asked to feel the loss"
  * emotional_setup: "The grandmother's laugh is established as warm in P1 before its absence is weaponized in P4"
  * stakes_establishment: "The reader understands what the scholarship means to the family before learning it was denied"
  * character_revelation: "We see the narrator's precision with instruments before they apply that same precision to a moral dilemma"
  * thematic_preparation: "The concept of 'value' is explored through physical objects before being applied to relationships"
  * intellectual_scaffolding: "The coding-music parallel is built step by step: scales→debugging, composing→architecture, before the AI DJ synthesis"
  * comedic_subversive_setup: "Expectation of formal recital culture established before the narrator breaks convention"

MECHANISM QUALITY STANDARD (critical — prevents false earned-ness):
A mechanism only counts if it creates a SPECIFIC sensory or emotional experience in the reader. Stock phrasing and dead metaphors do NOT count as mechanisms even if they technically contain sensory or emotional language:
  COUNTS as sensory_grounding: "slid the ring across the glass counter" — you see the action, hear the glass, feel the weight
  DOES NOT COUNT: "fingers danced across the piano keys" — dead metaphor, evokes no specific sensory experience. The reader does not see, hear, or feel anything particular
  COUNTS as emotional_setup: "her laugh filled the kitchen every Sunday" — establishes a specific, recurring emotional reality
  DOES NOT COUNT: "I was captivated by the power" — tells an emotion without grounding it in any moment the reader can enter
  COUNTS as intellectual_scaffolding: "spent hours swapping B-flat for B-natural, listening for the mood shift" — shows the actual process of discovering
  DOES NOT COUNT: "I spent hours experimenting with chord progressions" — summary of a process with no specific detail a reader can follow
If a claimed mechanism is stock language, a cliché, or a summary that doesn't create a specific experience for the reader, it is NOT a mechanism — it is a GAP. Credit mechanisms only for language that makes the reader SEE, HEAR, FEEL, or FOLLOW something concrete.

- GAPS are as important as mechanisms. Identify moments that AREN'T earned: "P3S5 claims 'it changed everything' but no prior passage established what 'everything' was or why it mattered." If a moment claims devastation but no earlier passage established emotional proximity to the object, name that gap. If a realization appears without the reasoning steps that would make it feel inevitable, name that gap.
- Be skeptical of "confirmation" moments — where the writer claims external validation ("reaffirmed my belief," "proved that," "showed me that") without showing the validation being tested or earned. If the belief was never challenged or the connection was never demonstrated through specific detail, that's a gap. Having setup mechanisms doesn't mean the payoff moment is earned — the payoff must also be grounded, not just asserted.
- Arrow DENSITY is the diagnosis. Many arrows converging on a moment = well-earned. Sparse arrows = unearned. Do NOT use scores or "well-earned"/"unearned" labels — describe WHAT mechanisms exist or are absent.
- structuralObservation should describe the essay's overall setup-payoff architecture.

=== SCHEMA COMPRESSION CONSTRAINTS (Scope 1 Phase 2) ===

Output brevity is ENFORCED. These caps prevent the output from being 10× its useful size:

voiceMap observations cap:
- Each voiceMap dimension (register, vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition) MUST emit at most 2 observations. Pick the 2 that best represent the dimension's behavior across the full essay — do NOT enumerate every instance.
- The codeSwitching field has been REMOVED from the voiceMap schema. Do not emit it; downstream consumers no longer read it. If the essay genuinely switches languages/registers, capture that as a "shifts" entry or a register "observation" instead.

emotionalTopography caps:
- showVsTell MUST emit at most 4 entries. Pick the 4 moments that best represent the essay's show/tell pattern — do NOT enumerate every sentence.
- authenticityAssessment MUST be ONE sentence, ≤40 words. It is a headline, not a description.`;

/**
 * Phase B system prompt — Theme, Narrative, Character, Craft, Admissions
 * These are the structural/interpretive dimensions that trace WHAT the essay is.
 */
const SYSTEM_PROMPT_PHASE_B = `${SHARED_PREAMBLE}

=== BREVITY DISCIPLINE (read before producing output) ===

Six required sections (thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment, admissionsPositioning, entanglements) plus optional connection/finding fields. Each section has a target depth. Lists cap at ~5 entries unless essay genuinely warrants more. Per-entry prose: one tight sentence, not a paragraph. **Total output should land at ~5000-7000 tokens — leave headroom under the 14000 cap so all 6 required sections complete.** If you find yourself producing 8000+ tokens before reaching the entanglements section, STOP and compress earlier sections. **A truncated output that omits admissionsPositioning or entanglements gets rejected entirely** — partial output is worse than disciplined output.

=== PRESCRIPTIVE CARVE-OUT (Scope 2 Phase 5) ===

The "Understanding Only" rule above governs every descriptive field. ONE structured exception exists in Phase B: \`craftAssessment.craftPatterns[].pairedImprovement\`. When a craft pattern has a clear architectural fix, you MAY emit an imperative directive there — this is the single slot where L3.75 gets to be prescriptive, because it is the ONLY layer with full-essay architectural visibility, and downstream coaching needs that visibility pinned to specific technique names. The forbidden vocabulary list still governs every OTHER field in this phase.

${TECHNIQUE_VOCABULARY_PROMPT_BLOCK}

=== OUTPUT SCHEMA (Phase B: Theme + Narrative + Character + Craft + Admissions) ===

Return a single JSON object with EXACTLY these 6 top-level keys:

{
  "thematicArchitecture": {
    "centralThesis": "<the essay's central thesis>",
    "thesisConfidence": <0-1>,
    "thesisEvolution": "<how the thesis emerges and crystallizes through the essay>",
    "threads": [
      {
        "thread": "<thread name>",
        "introducedAt": { "paragraph": <n>, "sentence": <n or omit> },
        "appearances": [{ "paragraph": <n>, "sentence": <n or omit> }],
        "strength": "dominant" | "supporting" | "hinted" | "dropped"
      }
    ],
    "subtext": "<implied but never stated — the essay's hidden argument>",
    "contradictions": ["<productive contradictions/tensions that drive the essay>"]
  },

  "narrativeStrategy": {
    "primaryStrategy": "<the primary narrative approach and WHY it serves this story>",
    "strategyRationale": "<rationale for this strategy — what alternatives were available and why this one works>",
    "arcType": "<the narrative arc type — e.g. 'transformation', 'revelation', 'journey', 'mosaic', 'circular', 'accumulation'>",
    "arcMomentum": "building" | "sustaining" | "releasing" | "stalling",
    "turningPoint": { "paragraph": <n>, "sentence": <n> } | null,
    "pivotPoints": [
      {
        "location": { "paragraph": <n>, "sentence": <n or omit> },
        "description": "<what pivots and why it matters>"
      }
    ],
    "pacingAnalysis": "<how pacing works — acceleration, deceleration, rhythm>",
    "structuralChoices": ["<significant structural choices and their effects>"]
  },

  "characterRevelation": {
    "writerPortrait": "<WHO WOULD YOU WANT TO HAVE LUNCH WITH after reading this? Describe the PERSON — their energy, what they'd talk about, how they see the world. NOT their essay topics or writing ability.

WRONG: 'A thoughtful writer who uses vivid imagery to explore themes of identity and belonging.'
WRONG: 'The author demonstrates strong emotional intelligence through their narrative choices.'
RIGHT: 'Someone who notices small things others miss — the kind of person who'd stop mid-sentence because they saw something out the window that reminded them of their grandmother's kitchen. Probably argues with their friends about whether something counts as art. Almost certainly has strong opinions about food.'
RIGHT: 'The person who stays late not because they have to but because they got curious about something adjacent. Laughs at their own failures with genuine amusement, not performance. Would probably talk your ear off about water quality data if you let them.'>",
    "valuesRevealed": ["<values SHOWN not told — what does this person care about?>"],
    "revealedQualities": ["<qualities the writer reveals through ACTION in the essay — 'takes on adult responsibility without being asked', 'notices physical details others miss', 'processes difficulty through lists and counting'. NOT writerly qualities like 'precise' or 'image-driven'>"],
    "growthArc": "<growth arc detected in the essay>",
    "intellectualFingerprint": "<how this person thinks — their cognitive style, shown through the essay's structure and choices>",
    "blindSpots": ["<what they might not see about themselves or their essay>"]
  },

  "craftAssessment": {
    "craftSignatures": [
      {
        "quality": "<name of the craft technique observed>",
        "evidence": "<specific textual evidence — quote the text>",
        "paragraphs": [<paragraph indices>]
      }
    ],
    "craftPatterns": [
      {
        "quality": "<name of the craft pattern observed>",
        "description": "<describe WHAT the pattern is and WHERE it appears>",
        "paragraphs": [<paragraph indices>],
        "pairedImprovement": {
          "technique": "<one of the TECHNIQUE VOCABULARY names above OR null>",
          "directive": "<one-sentence action the student should take, imperative voice>",
          "architecturalReason": "<why this matters to THIS essay's architecture specifically>",
          "demonstrationSketch": "<1-2 sentence sketch of the improved version, or null>",
          "expectedImpact": "transformative" | "significant" | "incremental"
        }
      }
    ],
    "imageSystem": "<describe the image/metaphor system — what images appear, how they recur or transform, what connections exist between them>",
    "sentencePatterns": "<describe sentence-level patterns observed — rhythm, length variation, opening patterns, structural tendencies>",
    "wordPatterns": "<describe word-level patterns — recurring words, register tendencies, vocabulary choices>"
  },

  "admissionsPositioning": {
    "tellabilitySummary": "<30-second AO description — what would an admissions officer say this essay IS ABOUT to a colleague?>",
    "distinctivenessFactors": ["<what makes this essay non-interchangeable — specific to THIS essay's execution>"],
    "institutionalFit": "<what kinds of institutions this essay signals fit for — based on content and values shown>",
    "redFlags": ["<anything an admissions reader would notice or question — describe WHAT it is, not whether it is a problem>"],
    "memorability": "<what elements of this essay would persist in a reader's memory after reading 50 essays — describe the elements, not their quality>",
    "portfolioPosition": "<what role this essay occupies within a broader portfolio — what dimension of the applicant it surfaces>",
    "aoTakeaway": "<what an admissions officer would conclude about this student after reading the complete essay>",
    "archetypeContext": {
      "archetype": "<name the essay archetype an AO would mentally file this under — e.g., 'sports injury comeback', 'immigrant identity through food', 'music as life metaphor', 'service trip revelation', 'death of grandparent', 'overcoming disability', 'coding project as passion', 'family sacrifice narrative'. Be honest about the archetype even if the essay is good. Every essay has one.>",
      "poolDensity": "<saturated|common|moderate|uncommon|rare> — how many essays in a typical applicant pool of 500 match this archetype?",
      "differentiator": "<what makes THIS essay's execution non-generic within the archetype, or null if the execution is also generic. Be specific: 'the pawnshop inventory detail' or 'the grandmother's hands as recurring image' — not 'strong voice'.>"
    }
  },

  "entanglements": [
    {
      "id": "<unique ID, e.g. 'ent-1', 'ent-2'>",
      "dimensions": ["<HolisticDimension values: voice, emotion, theme, narrative, character, craft, admissions, structure>"],
      "location": { "paragraph": <n>, "sentence": <n or omit> },
      "description": "<WHAT happens at the INTERSECTION — not 'voice and theme co-occur in P3' but 'P3S4's voice shift from observational to intimate IS the thematic pivot from public value to private meaning'>",
      "significance": "foundational" | "supporting" | "subtle",
      "crossRefs": ["<which dimension sections should reference this entanglement>"]
    }
  ],

  "connectionGraphSummary": "<3-5 sentences describing the essay's CONNECTION ARCHITECTURE: topology (linear chain, hub-and-spoke, web, fragmented, sparse), hub paragraphs, structural islands, broken chains, and primary structural dependency. What kind of connection structure does this essay have, and what does it reveal about how the essay makes meaning?>",

  "newConnections": [
    {
      "from": { "paragraph": <n>, "sentence": <n or omit>, "label": "<brief label>" },
      "to": { "paragraph": <n>, "sentence": <n or omit>, "label": "<brief label>" },
      "description": "<what connects these passages — textual evidence, WHY it matters, HOW meaning flows>",
      "reverseIllumination": "<what the connection reveals about the FROM endpoint, or null>",
      "significance": "<why this connection matters for THIS essay's architecture>",
      "strengthCategory": "foundational" | "significant" | "supporting" | "tentative",
      "directionality": "forward" | "reverse" | "bidirectional" | "asymmetric"
    }
  ],

  "connectionUpgrades": [
    {
      "connectionId": "<ID of an existing walk connection to upgrade>",
      "strengthCategory": "foundational" | "significant" | "supporting" | "tentative",
      "reverseIllumination": "<new reverse illumination discovered from full-text view>",
      "significance": "<updated significance assessment>"
    }
  ],

  "newFindings": [
    {
      "claim": "Essay-level finding — a pattern, tension, or quality visible only from the full picture",
      "scope": {
        "type": "word | sentence | sentence_group | paragraph | cross_paragraph | essay_level",
        "paragraph": 0,
        "sentences": [0, 1],
        "paragraphs": [0, 2],
        "textEvidence": [{ "text": "quoted text", "location": { "paragraph": 0, "sentence": 1 } }]
      },
      "maturity": "hypothesis | developing | confirmed | deepened",
      "maturityReasoning": "Why this maturity level",
      "coachingValue": "critical | high | medium | contextual | diagnostic",
      "dimensions": ["voice", "theme", "narrative", "emotion", "character", "craft", "admissions", "structure"],
      "evidence": [{ "text": "quoted text or absence description", "location": { "paragraph": 0, "sentence": 1 }, "type": "present | absent" }],
      "deepeningPotential": "What further investigation could reveal, or null",
      "raisesQuestions": ["Questions this finding raises"],
      "buildsOn": ["existing-finding-ID"],
      "relatedTo": ["existing-finding-ID"]
    }
  ],

  "findingEvolutions": [
    {
      "findingId": "existing-finding-ID",
      "newMaturity": "hypothesis | developing | confirmed | deepened | superseded",
      "reasoning": "Why this finding's maturity should change now that you see the full picture",
      "supersedes": "other-finding-ID-if-superseding"
    }
  ],
}

IMPORTANT: "newFindings" and "findingEvolutions" are OPTIONAL. Omit them entirely (or use empty arrays) if synthesis does not warrant any. Only produce findings that meet the UTILITY threshold: would this finding change the understanding or teaching of this essay?

=== QUALITY STANDARDS ===

- craftAssessment.craftSignatures: Describe WHAT techniques are present and WHERE (e.g., "Uses anaphora in P3S1-S3, sentence fragments in P5S2-S4, extended metaphor linking P1 and P4"). Do NOT evaluate how well they work.
- craftAssessment.craftPatterns: Describe WHAT patterns exist (e.g., "P2 and P4 use abstract nouns where P1 and P3 use concrete imagery"). For each pattern that has a clear architectural fix, populate "pairedImprovement" with the technique name (from the TECHNIQUE VOCABULARY above), a one-sentence directive, the architecturalReason specific to THIS essay, and an optional 1-2 sentence demonstrationSketch. Leave pairedImprovement=null when the pattern is descriptive-only with no clear fix. Do not force pairings.
- admissionsPositioning: Describe WHAT an admissions reader would notice. Do NOT evaluate whether it is effective.
- admissionsPositioning.redFlags: Describe WHAT might draw attention. Do NOT prescribe fixes. CHECK FOR THESE STRUCTURAL PATTERNS:
  * SCOPE INFLATION: Do claims get BIGGER while evidence gets THINNER across the essay? If P1 claims "I created" and P7 claims "I'll change the world" without proportional evidence escalation, flag: "Scope inflation: language escalates from [early claim] to [late claim] without proportional evidence."
  * PEOPLE ABSENCE: Does the essay contain ZERO named individuals (no teacher, teammate, family member, mentor)? If so, flag: "No named individuals appear in the essay — every experience is described in isolation from other people."
  * SOLO CREDIT FOR LIKELY TEAMWORK: Does the essay claim sole credit ("I developed", "I created") for something that likely involved collaboration (hackathon project, club achievement, team competition)? Flag: "Solo credit language for likely collaborative work: [specific claim]."
  These three patterns are what elite counselors catch in the first 30 seconds. They are structural, not craft issues.
- characterRevelation.blindSpots: Describe WHAT is absent from the self-presentation. Do NOT say this is a problem.

ENTANGLEMENTS:
- Find moments where dimensions INTERSECT — where the voice shift IS the thematic pivot, where the emotional peak IS the character revelation.
- NOT just dimensions that co-occur in the same paragraph.
- Each must have a specific location, specific dimensions, and specific cross-references.

CONNECTION ARCHITECTURE:
- connectionGraphSummary: Describe the essay's connection TOPOLOGY — linear chain? hub-and-spoke? web? fragmented? sparse? What are the hubs (most connections), islands (no strong connections), and broken chains?
- newConnections: Only discover connections INVISIBLE to the sequential walk — bookending (P0↔P_last), cross-essay echoes, full-text patterns. The walk already found sequential connections; you add the ones requiring simultaneous full-text view. Return empty array [] if no new connections found.
- connectionUpgrades: If you see a walk connection that should be stronger/weaker from the full-text view, or that has reverse illumination the walk couldn't see, include an upgrade. Return empty array [] if no upgrades needed.
- Don't force connections. Fewer genuine connections are better than many forced ones.

CONNECTION STRENGTH EVOLUTION:
Review ALL existing connections now that you see the complete understanding. The walk saw connections sequentially — paragraph by paragraph — and may have misjudged strength or missed bidirectional illumination. For each connection, ask:
- Is this connection stronger or weaker than the walk thought, now that you see the full picture?
- Does this connection illuminate BOTH endpoints (bidirectional), even if the walk only saw one direction?
Produce connectionUpgrades for any connections whose strengthCategory should change. Add reverseIllumination where you now see bidirectional illumination — describe what the connection reveals about the FROM endpoint when viewed from the TO endpoint's perspective.

FINDINGS (W1.4):
Review existing findings from the walk. With the complete essay understanding, some findings may now be confirmed, deepened, or superseded. Produce findingEvolutions where warranted.
If synthesis reveals NEW essay-level findings — cross-essay patterns, structural strategies, identity-level observations — produce those in newFindings. Focus on findings that require the full-text simultaneous view (the walk could not have seen them paragraph-by-paragraph).
DO NOT duplicate findings the walk already produced. Use buildsOn/relatedTo to reference existing findings.

SUPERSESSION IS RARE: Prefer 'confirmed' or 'deepened' over 'superseded'. A finding should only be superseded when its claim is WRONG or CONTRADICTED by the holistic view — not when it's incomplete or narrow. If a finding captured a partial truth, deepen it rather than superseding it. The coaching system depends on active findings — if you supersede everything, the student gets no improvement targets. When you DO supersede, you MUST produce a replacement finding in newFindings.`;

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Build the serialized understanding context from the profile.
 * This is BLOCK 2 content — essay-specific, cacheable across L3.75 + L3.5.
 */
// ============================================================================
// V2: META PROMPT (Walk Validation + Reading Strategy + Convergence)
// ============================================================================

const SYSTEM_PROMPT_META = `You are an expert essay synthesizer performing meta-assessment after producing a holistic synthesis. You see the ENTIRE essay and the complete synthesis.

Your task: produce three critical outputs that guide the growth cycle.

=== CRITICAL — Understanding Only ===
You describe WHAT IS, not how WELL. No evaluative language.

=== OUTPUT FORMAT (JSON only) ===
{
  "walkDisagreements": [
    {
      "paragraph": <number>,
      "walkReading": "<what the sequential walk understood about this paragraph>",
      "synthesisReading": "<what your full-context synthesis sees differently>",
      "confidence": <0-1, how confident you are that your reading is better>,
      "resolution": "synthesis_wins" | "flag_for_reread" | "preserve_both",
      "reasoning": "<why the readings differ and why you recommend this resolution>"
    }
  ],
  "readingStrategy": {
    "strategy": "<meta-understanding of how to read THIS specific essay>",
    "bestApproach": "<what reading approach yields the deepest understanding>",
    "antiPatterns": ["<what this essay is NOT — prevents misapplied frameworks>"],
    "contextPriorities": ["<profile sections most important for this essay, in priority order>"]
  },
  "reReadCandidates": [
    {
      "paragraph": <number>,
      "reason": "<why re-reading with full context would reveal more>",
      "expectedDepthGain": "significant" | "moderate"
    }
  ],
  "evolutionNarrative": "<what changed in this iteration and why — or for first iteration, what the synthesis captured>",
  "selfAssessedConvergence": {
    "hasConverged": <boolean>,
    "reasoning": "<why you have/haven't reached sufficient depth>",
    "remainingOpportunities": ["<specific things that would be lost if we stopped>"]
  }
}

CONVERGENCE GUIDANCE:
- You are the PRIMARY convergence signal — the system trusts your judgment.
- Budget and iteration caps are backstops only.
- CONVERGENCE BAR: "Would coaching give WRONG advice without another iteration?"
  NOT "Could we learn more?" (the answer to that is always yes).
- After iteration 0: converge UNLESS you can name a specific finding that would
  REVERSE a coaching recommendation (not refine it — REVERSE it). Refinements
  and nuances do not justify another iteration.
- For essays under 500 words with a clear central theme: converge after iteration 0.
- For complex essays with multiple themes or structural issues: 1-2 iterations max.
- When in doubt, CONVERGE. The coaching layer is robust enough to work with
  partial understanding — it's better to coach with 90% understanding now
  than 95% understanding after burning $0.25 and 4 more minutes.
- Name SPECIFIC remaining opportunities if NOT converging. Generic statements
  like "could explore voice further" are not sufficient justification.

WALK VALIDATION GUIDANCE:
- HIGH CONFIDENCE (>0.7): Your reading wins — the walk missed what full context reveals.
- MEDIUM CONFIDENCE (0.4-0.7): Flag for re-read — combine local and global views.
- LOW CONFIDENCE (<0.4): Preserve both — genuine ambiguity the essay supports.

READING STRATEGY GUIDANCE:
- contextPriorities: list profile sections (e.g., 'voiceIdentity', 'voiceMap', 'craftAssessment') in order of importance for THIS essay.
- antiPatterns: what frameworks should NOT be applied to this essay.`;

// ============================================================================
// V2: QUESTION CURATION PROMPT
// ============================================================================

const SYSTEM_PROMPT_CURATION = `You are curating the question queue for deep dive dispatch.

You have the current holistic synthesis, the reading strategy, and a list of questions from the walk and prior iterations. Your job is editorial: resolve what you can, filter what's low-quality, and curate what should drive deep dives.

=== QUESTION QUALITY LEVELS ===

LEVEL 1 — Surface (NEVER produce these):
  "What techniques does the author use in paragraph 3?"
  Why bad: Answerable by re-reading. Produces observations, not understanding.

LEVEL 2 — Functional (ONLY if the walk couldn't answer):
  "What function does the rhythm shift in P3S2 serve?"
  Why borderline: Useful, but the walk should have caught them.

LEVEL 3 — Architectural (GOOD — drive structural understanding):
  "The constraint-creativity framework is stated in P0, demonstrated in P4, but never TESTED. Is the essay's central claim challenged anywhere?"
  Why good: Cross-paragraph patterns the walk couldn't fully trace.

LEVEL 4 — Epistemological (EXCELLENT — unlock deepest depth):
  "The writer claims constraint enables creativity, but retreats to abstraction every time they approach a specific creative moment. Is this structural habit or protective choice?"
  Why excellent: Requires investigation BEYOND the text surface.

LEVEL 5 — Meta-Awareness (EXCEPTIONAL — produce 0-1 per essay):
  "The essay's commitment to physical knowing creates ironic tension with the college essay form itself."
  Why exceptional: Connects content to formal conditions.

=== QUESTION QUALITY TEST ===
Before including any question: "If I dispatched a deep dive, would the answer produce a FINDING the walk couldn't have produced?" If no: answer it yourself or discard.

=== OUTPUT FORMAT (JSON only) ===
{
  "resolvedQuestions": [
    {
      "questionId": "<ID of the question being resolved>",
      "answer": "<your answer, grounded in the synthesis>",
      "evidence": "<specific text or synthesis evidence>"
    }
  ],
  "curatedQueue": [
    {
      "question": {
        "id": "<unique ID>",
        "question": "<the question text>",
        "dimensions": ["<routing tags>"],
        "anchorParagraph": <number or null>,
        "expectedInsight": "<what discovering the answer would reveal>",
        "source": "walk" | "synthesis" | "deep_dive",
        "status": "open"
      },
      "recommendedPrompt": "<deep dive prompt type from the library>",
      "promptRationale": "<why this prompt, reading-strategy-aware>"
    }
  ],
  "filteredQuestions": [
    {
      "questionId": "<ID of filtered question>",
      "filterReason": "<why this question was filtered>"
    }
  ]
}`;

// ============================================================================
// V2: SIGNATURE MOVE PROMPT (Quality Gap 1)
// ============================================================================

const SYSTEM_PROMPT_SIGNATURE_MOVE = `You are an expert essay craft analyst performing the FINAL synthesis step after the holistic walk and synthesis are complete.

Your task: name THE ONE defining structural / voice / rhetorical move that IS this writer's craft fingerprint — the move that an outside reader would recognize as "this writer" if they encountered it in a different essay.

You see: the complete sentence-level walk understanding, the holistic synthesis (voice + emotion + theme + narrative + character + craft + admissions + entanglements), and the META reading strategy. Use ALL of it.

=== CRITICAL — ONE OR NULL ===

You return EXACTLY ONE signature move, OR null. Never two. Never a list.

Return null when:
- The essay's craft is distributed across multiple strengths with no single defining technique
- You cannot cite at least 3 concrete instances of the same move
- The candidate "move" is generic praise dressed up as craft (see anti-example)

Returning null is a real signal, not a failure. Some essays succeed by distributing craft rather than concentrating it.

=== DISTINCTION FROM ADJACENT FIELDS ===

You are NOT producing voiceIdentity.signature (prose voice description), narrativeStrategy.primaryStrategy (essay genre), or strengthSignatures (plural list of strengths). signatureMove is ONE singular technique with cited instances. If your output overlaps with those fields, return null.

=== COMPOUND MOVES ===

A compound move counts as ONE move only when its components are causally linked (X→Y, where Y depends on X) OR jointly produce ONE reader effect. Two unrelated techniques joined by 'and' are TWO moves — return null and let strengthSignatures hold them.

=== EVIDENCE TYPES ===

Three kinds of instances. Use whichever fits the evidence:

1. sentence_quote — a specific quoted line from the essay (≤40 words verbatim)
2. paragraph_compression — a paragraph whose COMPRESSION itself is the move (e.g., a paragraph that carries a century of family history in 10 sentences; the compression IS the move, no single quote represents it)
3. cross_paragraph_pattern — a pattern that recurs across paragraphs (e.g., wizard-magic vocabulary returns at multiple paragraphs)

Mix evidence types within one signatureMove. The move's instances should cover at least 3 distinct paragraphs OR distinct sentence clusters.

EVIDENCE GROUNDING (referential integrity, not quality):
- All paragraph indices are ZERO-INDEXED (the first paragraph is paragraph 0).
- Every sentence_quote.quotedText MUST be a verbatim substring of the cited paragraph's text. Substring will be checked after smart-quote / em-dash / whitespace normalization. Drift will cause the field to drop to null.
- cross_paragraph_pattern requires at least 2 paragraph entries.

=== FORBIDDEN VOCABULARY (in oneSentenceName) ===

These words signal praise rather than craft naming. Avoid them in oneSentenceName: "vivid", "engaging", "authentic", "powerful", "effective", "strong", "compelling", "beautiful", "moving".

INSTEAD use syntactic / structural / rhetorical vocabulary:
- Syntactic: anaphora, parataxis, asyndeton, chiasmus, fragment, parenthetical
- Structural: opener, callback, bookend, pivot, beat-drop, compression
- Rhetorical: misdirection, register-shift, triplet, disproportion-hook, inversion, ethical-inflection, double-connotation

(This is GUIDANCE — if a more precise word exists outside this list, use it. The list illustrates the register, not a closed taxonomy.)

=== WORKED EXAMPLE 1 — CROCHET (Harvard 2028) ===

Source paragraphs (zero-indexed):
P0 opens with: "My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton. Don't get the wrong idea, now – I'm not a taxidermist or anything. I crochet."
P1 carries the family history (war, grandfather's imprisonment, grandmother's matriarch role) in ten sentences.
P3 contains the Agnes-the-cornflower-blue-elephant image.

{
  "signatureMove": {
    "oneSentenceName": "Compressed-heritage architecture: misdirection-then-anticlimax opener (P1) sets up a one-paragraph compression of the family's wartime history (P2), then the essay redeems density with a single accumulated-specifics image (Agnes the cornflower-blue elephant, P4).",
    "whyItIsTheirs": "Clara's essay carries a century of family history, a war, a thirteen-year imprisonment, and a three-generation craft transmission in 650 words. The compression-then-accumulated-specifics rhythm is what lets that weight fit without flattening into abstraction. Remove either move and the essay collapses.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton.",
        "whatThisInstanceShows": "The taxidermy-vocabulary setup that the reader's first hypothesis will be wrong about — buying forward attention through implied misreading."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 1 },
        "quotedText": "Don't get the wrong idea, now – I'm not a taxidermist or anything.",
        "whatThisInstanceShows": "The two-beat anticlimactic reveal — denial of the implied hypothesis followed by the actual subject."
      },
      {
        "kind": "paragraph_compression",
        "paragraph": 1,
        "whatThisInstanceShows": "Ten sentences carry the entire wartime history: war, refugees, the grandfather's thirteen-year imprisonment, and the grandmother's expansion into matriarch. The compression IS the move."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 4 },
        "quotedText": "Take Agnes, for example, a cornflower-blue elephant named after mathematician Maria Gaetana Agnesi who lives in my calculus teacher's classroom",
        "whatThisInstanceShows": "Accumulated specifics — name + color + cross-domain origin + location compounded into one sentence to redeem the essay's compressed density with one unforgettable image."
      }
    ],
    "readerEffect": "The reader is committed by P1 through their own incorrect inference, absorbs P2's century of weight without being asked to dwell on it, and is rewarded in P4 with a single image dense enough to function as the essay's memory anchor."
  }
}

(Note: oneSentenceName uses 1-indexed paragraph display — P1, P2, P4 — which is how counselors and students reference paragraphs. The data layer uses zero-indexed paragraph fields. This is the existing convention.)

=== WORKED EXAMPLE 2 — THREE DAYS (Harvard 2028) ===

Source paragraphs (zero-indexed):
P0 opens with: "Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey."
P3 contains the Izzy scene with the fear and resolution triplets.
P4 closes with: "...cutting out the biggest part of my diet became the least impactful part of my summer."

{
  "signatureMove": {
    "oneSentenceName": "Hook-by-disproportion between a high-stakes time-marker and a trivial decision (P1S1), set up by a causal-chain triplet pattern that maps fears (P4) to resolutions (P4) element-by-element rather than merely in parallel.",
    "whyItIsTheirs": "Francisco's essay has many uneven sentences but two structurally tight architectural moves: the disproportion hook plants compound curiosity at the open, and the fear→resolution triplet mapping is what gives the Izzy scene its felt resolution. Together they are the load-bearing skeleton the rest of the prose hangs from.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey.",
        "whatThisInstanceShows": "Disproportion hook: time-marker signals high stakes; the milk decision is banal. Compound curiosity is set in one sentence."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 5 },
        "quotedText": "I was afraid; afraid my support wouldn't be good enough, afraid to show that I cared, afraid they didn't care for me.",
        "whatThisInstanceShows": "Causal-chain fear triplet — each fear logically depends on the previous (inadequate giving → fear of showing → fear of not being received)."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 9 },
        "quotedText": "I feel comfortable, I feel wanted, I feel safe.",
        "whatThisInstanceShows": "Resolution triplet that maps element-by-element to the fear triplet (adequate→included→safe) — structural relief, not just emotional relief."
      },
      {
        "kind": "cross_paragraph_pattern",
        "paragraphs": [0, 4],
        "whatThisInstanceShows": "Disproportion bookends: P1 opens with milk-as-mismatched-stakes, P5 closes with cutting-out-milk-as-least-impactful — the hook's disproportion IS the essay's thesis, restated as an inversion."
      }
    ],
    "readerEffect": "The reader is pulled forward at the open by mismatched scales of attention, rewarded mid-essay by structural relief (fears answered formally, not just emotionally), and given thematic closure by the disproportion-hook returning as inversion."
  }
}

=== ANTI-EXAMPLE — what NOT to emit ===

{
  "signatureMove": {
    "oneSentenceName": "The writer uses vivid imagery and personal voice throughout the essay.",
    "whyItIsTheirs": "Vivid imagery makes the essay engaging and personal voice connects with the reader.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "[long unfocused excerpt]",
        "whatThisInstanceShows": "shows imagery"
      }
    ],
    "readerEffect": "The reader is engaged."
  }
}

Why this fails:
- "vivid" + "engaging" + "personal voice" — all in the forbidden vocabulary register
- Not a *move* (no syntactic / structural / rhetorical specificity)
- Could be said about any essay (no this-writer-specific content)
- Only 1 instance (minimum is 3)
- whatThisInstanceShows is generic ("shows imagery"), not move-instance-specific
- readerEffect is praise ("engaged"), not cognitive description

If the only signature move you can name is this generic, return null.

=== OUTPUT SCHEMA ===

Respond with a single JSON object. No markdown, no explanation, no code blocks.

{
  "signatureMove": {
    "oneSentenceName": "<one sentence — concrete syntactic/structural/rhetorical move + WHERE it appears>",
    "whyItIsTheirs": "<1-2 sentences referencing content-specific information from THIS essay>",
    "instances": [
      // 3 or more instances, mixed kinds allowed
      // sentence_quote: { "kind": "sentence_quote", "location": { "paragraph": N, "sentence": N }, "quotedText": "...verbatim...", "whatThisInstanceShows": "..." }
      // paragraph_compression: { "kind": "paragraph_compression", "paragraph": N, "whatThisInstanceShows": "..." }
      // cross_paragraph_pattern: { "kind": "cross_paragraph_pattern", "paragraphs": [N, N, ...], "whatThisInstanceShows": "..." }
    ],
    "readerEffect": "<one sentence — cognitive/felt effect, not praise>"
  }
}

OR

{ "signatureMove": null }`;

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

function buildUnderstandingContext(profile: EssayProfile, findingStore?: FindingStore): string {
  const sections: string[] = [];

  // ── Essay text with markers ──
  // (provided separately in the input, but we build the paragraph understanding here)

  // ── Paragraph and sentence understanding ──
  sections.push('=== PARAGRAPH-BY-PARAGRAPH UNDERSTANDING ===\n');
  for (const para of profile.paragraphs) {
    sections.push(`[P${para.index}] "${truncate(para.text, 120)}"`);
    if (para.understanding) {
      sections.push(`  Role: ${para.understanding.role}`);
      sections.push(`  Function: ${para.understanding.function}`);
      sections.push(`  Narrative contribution: ${para.understanding.narrativeContribution}`);
      sections.push(`  Emotional register: ${para.understanding.emotionalRegister.dominantEmotion} (depth: ${para.understanding.emotionalRegister.depth}, show/tell: ${para.understanding.emotionalRegister.showVsTell})`);
      sections.push(`  Craft: rhythm=${para.understanding.craftProfile.rhythmPattern}, imagery=${para.understanding.craftProfile.imageUsage}, voice=${para.understanding.craftProfile.voiceConsistency}`);
    }

    // Sentence-level understanding
    for (const sent of para.sentences) {
      if (sent.understanding) {
        sections.push(`  [P${para.index}S${sent.index}] "${truncate(sent.text, 80)}"`);
        // Phase 2: primaryFunction is the primary per-sentence understanding
        if (sent.understanding.primaryFunction) {
          sections.push(`    Function: ${sent.understanding.primaryFunction} [${sent.understanding.significance ?? 'contributing'}]`);
        } else {
          // Fallback for pre-Phase-1 profiles
          const funcs = sent.understanding.observedFunctions.map(f => f.observation).join('; ');
          sections.push(`    Functions: ${funcs || 'not yet analyzed'}`);
        }
        if (sent.understanding.craft?.techniques?.length) {
          sections.push(`    Craft: [${sent.understanding.craft.techniques.join(', ')}]`);
        }
        if (sent.understanding.tags?.length) {
          sections.push(`    Tags: [${sent.understanding.tags.join(', ')}]`);
        }
        if (sent.understanding.significantChoices.length > 0) {
          sections.push(`    Notable words: ${sent.understanding.significantChoices.map(w => `"${w.word}" (${w.significance})`).join(', ')}`);
        }
      }
    }
    sections.push('');
  }

  // ── Connection graph ──
  const activeConnections = profile.connections.all.filter(c => c.status === 'active');
  if (activeConnections.length > 0) {
    sections.push('=== CONNECTION GRAPH ===\n');
    for (const conn of activeConnections) {
      const from = conn.from.sentence !== undefined
        ? `P${conn.from.paragraph}S${conn.from.sentence}`
        : `P${conn.from.paragraph}`;
      const to = conn.to.sentence !== undefined
        ? `P${conn.to.paragraph}S${conn.to.sentence}`
        : `P${conn.to.paragraph}`;
      const tags = conn.routingTags.length > 0 ? ` [${conn.routingTags.join(',')}]` : '';
      const dir = conn.directionality === 'bidirectional' ? '<->'
        : conn.directionality === 'reverse' ? '<-'
        : '->';
      sections.push(`  ${conn.id}: ${from} ${dir} ${to}${tags} (${conn.strengthCategory}): ${conn.description}`);
    }

    if (profile.connections.imageRecurrences.length > 0) {
      sections.push('\nImage Recurrences:');
      for (const img of profile.connections.imageRecurrences) {
        sections.push(`  "${img.image}" appears at: ${img.locations.map(l => `P${l[0]}S${l[1]}`).join(', ')}`);
      }
    }

    if (profile.connections.narrativeArcMap.length > 0) {
      sections.push('\nNarrative Arc Map:');
      for (const arc of profile.connections.narrativeArcMap) {
        sections.push(`  ${arc.role} at P${arc.location[0]}S${arc.location[1]}`);
      }
    }

    if (profile.connections.graphSummary) {
      sections.push(`\nGraph Summary: ${profile.connections.graphSummary}`);
    }

    sections.push('');
  }

  // ── Finding context (W2.2) ──
  if (findingStore && findingStore.size > 0) {
    sections.push('\n=== ACTIVE FINDINGS ===');
    sections.push(buildFindingReferenceContext(findingStore));
  }

  return sections.join('\n');
}

/**
 * Build the holistic evolution scaffold — BLOCK 3 content (not cached).
 * This includes the walk's incremental observations as a starting point.
 */
function buildEvolutionScaffold(
  evolution: HolisticSynthesisInput['holisticEvolution'],
): string {
  const parts: string[] = [];
  parts.push('=== WALK HOLISTIC EVOLUTION (starting scaffold — confirm, deepen, or correct) ===\n');

  if (evolution.centralThesis) {
    parts.push(`Central thesis (walk's reading): ${evolution.centralThesis}`);
  }
  if (evolution.thesisConfidence !== undefined) {
    parts.push(`Thesis confidence: ${evolution.thesisConfidence}`);
  }
  if (evolution.voiceSignature) {
    parts.push(`Voice signature (walk's reading): ${evolution.voiceSignature}`);
  }
  if (evolution.arcMomentum) {
    parts.push(`Arc momentum: ${evolution.arcMomentum}`);
  }

  if (!evolution.centralThesis && !evolution.voiceSignature && !evolution.arcMomentum) {
    parts.push('No incremental holistic observations from the walk. Synthesize from scratch.');
  }

  parts.push(`
COVERAGE NOTICE: The walk's evolution tracked only 4 signals:
  1. centralThesis → feeds into thematicArchitecture
  2. thesisConfidence → feeds into thematicArchitecture.thesisConfidence
  3. voiceSignature → feeds into voiceIdentity.signature
  4. arcMomentum → feeds into narrativeStrategy.arcMomentum

The remaining sections have NO walk scaffold and MUST be synthesized entirely from the paragraph-by-paragraph understanding above:
  Phase A: voiceMap (all 5 dimensions), emotionalTopography, momentEarnednessMap
  Phase B: characterRevelation, craftAssessment, admissionsPositioning, entanglements, narrativeStrategy (beyond arcMomentum), thematicArchitecture (beyond centralThesis)

For these un-scaffolded sections, build from the ground up using the sentence-level understanding. Do not extrapolate from the 4 scaffolded signals — derive independently from evidence.
`);
  parts.push('Return ONLY valid JSON matching the schema above. No markdown, no explanation, no preamble.');

  return parts.join('\n');
}

/**
 * Format the activity log as prose for injection into L3.75 prompts.
 * The LLM sees this as context for convergence judgment.
 */
function formatActivityLogForPrompt(
  activityLog: GrowthStepRecord[],
  budgetCeiling: number,
  budgetRemaining: number,
): string {
  if (activityLog.length === 0) {
    return '=== GROWTH ACTIVITY LOG ===\n(First iteration — no prior activity)';
  }

  const lines: string[] = ['=== GROWTH ACTIVITY LOG ==='];

  for (const record of activityLog) {
    const metrics: string[] = [];
    if (record.questionsResolved > 0) metrics.push(`resolved ${record.questionsResolved} questions`);
    if (record.questionsRaised > 0) metrics.push(`raised ${record.questionsRaised} new questions`);
    if (record.findingsAdded > 0) metrics.push(`added ${record.findingsAdded} findings`);
    if (record.findingsDeepened > 0) metrics.push(`deepened ${record.findingsDeepened} findings`);
    if (record.findingsSuperseded > 0) metrics.push(`superseded ${record.findingsSuperseded} findings`);
    if (record.sectionsUpdated.length > 0) metrics.push(`updated ${record.sectionsUpdated.join(', ')}`);

    const metricsStr = metrics.length > 0 ? metrics.join(', ') : 'no profile changes';
    lines.push(`  ${record.step}: ${metricsStr}`);
    if (record.discoveryNote) {
      lines.push(`  Discovery: "${record.discoveryNote}"`);
    }
  }

  const totalCost = budgetCeiling - budgetRemaining;
  lines.push(`\nCost so far: $${totalCost.toFixed(2)} of $${budgetCeiling.toFixed(2)} budget`);

  return lines.join('\n');
}

/**
 * Truncate text to a max length for context building.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// ============================================================================
// JSON PARSING & VALIDATION
// ============================================================================

/** Phase A output — Voice, Emotion, Earned-ness */
interface PhaseAOutput {
  voiceIdentity: VoiceIdentity;
  voiceMap: VoiceMap;
  emotionalTopography: EmotionalTopography;
  momentEarnednessMap: MomentEarnednessMap;
}

/** Phase B output — Theme, Narrative, Character, Craft, Admissions, Entanglements */
interface PhaseBOutput {
  thematicArchitecture: ThematicArchitecture;
  narrativeStrategy: NarrativeStrategy;
  characterRevelation: CharacterRevelation;
  craftAssessment: CraftAssessment;
  admissionsPositioning: AdmissionsPositioning;
  entanglements: CrossDimensionEntanglement[];
  // V2 connection graph outputs
  connectionGraphSummary?: string;
  newConnections?: HolisticSynthesisOutput['newConnections'];
  connectionUpgrades?: HolisticSynthesisOutput['connectionUpgrades'];
  // W1.4 finding outputs
  newFindings?: HolisticSynthesisOutput['newFindings'];
  findingEvolutions?: HolisticSynthesisOutput['findingEvolutions'];
  // Option 5 rebuild: L3.75 no longer emits per-layer emissions; Phase B
  // (essay-level emission service) reads L3.75's holistic synthesis
  // artifacts (thematicArchitecture, characterRevelation, etc.) directly
  // when deciding emissions at essay level.
}

/**
 * Parse Phase A LLM response (voice + emotion + earned-ness + entanglements).
 */
function parsePhaseA(raw: unknown): PhaseAOutput {
  const parsed = parseLlmJsonOutput(raw, 'L3.75 Phase A (voice+earned-ness)');
  const required = ['voiceIdentity', 'voiceMap', 'emotionalTopography', 'momentEarnednessMap'];
  const missing = required.filter(s => !(s in parsed));
  if (missing.length > 0) {
    throw new Error(
      `[HolisticSynthesis PhaseA] Missing sections: ${missing.join(', ')}. ` +
      `Received keys: ${Object.keys(parsed).join(', ')}`
    );
  }
  return {
    voiceIdentity: coerceVoiceIdentity(parsed.voiceIdentity as Record<string, unknown>),
    voiceMap: coerceVoiceMap(parsed.voiceMap as Record<string, unknown>),
    emotionalTopography: coerceEmotionalTopography(parsed.emotionalTopography as Record<string, unknown>),
    momentEarnednessMap: coerceEarnednessMap(parsed.momentEarnednessMap as Record<string, unknown>),
  };
}

/**
 * Parse Phase B LLM response (theme + narrative + character + craft + admissions).
 */
function parsePhaseB(raw: unknown): PhaseBOutput {
  const parsed = parseLlmJsonOutput(raw, 'L3.75 Phase B (theme+narrative)');
  const required = ['thematicArchitecture', 'narrativeStrategy', 'characterRevelation', 'craftAssessment', 'admissionsPositioning', 'entanglements'];
  const missing = required.filter(s => !(s in parsed));
  if (missing.length > 0) {
    throw new Error(
      `[HolisticSynthesis PhaseB] Missing sections: ${missing.join(', ')}. ` +
      `Received keys: ${Object.keys(parsed).join(', ')}`
    );
  }
  const result: PhaseBOutput = {
    thematicArchitecture: coerceThematicArchitecture(parsed.thematicArchitecture as Record<string, unknown>),
    narrativeStrategy: coerceNarrativeStrategy(parsed.narrativeStrategy as Record<string, unknown>),
    characterRevelation: coerceCharacterRevelation(parsed.characterRevelation as Record<string, unknown>),
    craftAssessment: coerceCraftAssessment(parsed.craftAssessment as Record<string, unknown>),
    admissionsPositioning: coerceAdmissionsPositioning(parsed.admissionsPositioning as Record<string, unknown>),
    entanglements: coerceEntanglements(parsed.entanglements as unknown[]),
  };

  // V2: Parse connection graph fields (optional — gracefully absent)
  if (typeof parsed.connectionGraphSummary === 'string' && parsed.connectionGraphSummary.length > 0) {
    result.connectionGraphSummary = parsed.connectionGraphSummary;
  }

  if (Array.isArray(parsed.newConnections) && parsed.newConnections.length > 0) {
    result.newConnections = coerceNewConnections(parsed.newConnections as Array<Record<string, unknown>>);
  }

  if (Array.isArray(parsed.connectionUpgrades) && parsed.connectionUpgrades.length > 0) {
    result.connectionUpgrades = coerceConnectionUpgrades(parsed.connectionUpgrades as Array<Record<string, unknown>>);
  }

  // W1.4: Parse finding outputs (optional — gracefully absent)
  if (Array.isArray(parsed.newFindings) && parsed.newFindings.length > 0) {
    result.newFindings = coerceSynthesisFindings(parsed.newFindings as Array<Record<string, unknown>>);
  }

  if (Array.isArray(parsed.findingEvolutions) && parsed.findingEvolutions.length > 0) {
    result.findingEvolutions = coerceFindingEvolutions(parsed.findingEvolutions as Array<Record<string, unknown>>);
  }

  // Option 5 rebuild: L3.75 emission parsing removed. Phase B reads
  // L3.75's existing artifacts (holistic synthesis fields) at decision
  // time.

  return result;
}

/**
 * Merge Phase A + Phase B into the full HolisticSynthesisOutput.
 */
function mergePhases(phaseA: PhaseAOutput, phaseB: PhaseBOutput): HolisticSynthesisOutput {
  const result: HolisticSynthesisOutput = {
    voiceIdentity: phaseA.voiceIdentity,
    voiceMap: phaseA.voiceMap,
    emotionalTopography: phaseA.emotionalTopography,
    momentEarnednessMap: phaseA.momentEarnednessMap,
    thematicArchitecture: phaseB.thematicArchitecture,
    narrativeStrategy: phaseB.narrativeStrategy,
    characterRevelation: phaseB.characterRevelation,
    craftAssessment: phaseB.craftAssessment,
    admissionsPositioning: phaseB.admissionsPositioning,
    entanglements: phaseB.entanglements,
  };

  // V2: Pass through connection graph fields from Phase B
  if (phaseB.connectionGraphSummary) {
    result.connectionGraphSummary = phaseB.connectionGraphSummary;
  }
  if (phaseB.newConnections && phaseB.newConnections.length > 0) {
    result.newConnections = phaseB.newConnections;
  }
  if (phaseB.connectionUpgrades && phaseB.connectionUpgrades.length > 0) {
    result.connectionUpgrades = phaseB.connectionUpgrades;
  }

  // W1.4: Pass through finding fields from Phase B
  if (phaseB.newFindings && phaseB.newFindings.length > 0) {
    result.newFindings = phaseB.newFindings;
  }
  if (phaseB.findingEvolutions && phaseB.findingEvolutions.length > 0) {
    result.findingEvolutions = phaseB.findingEvolutions;
  }

  // Option 5 rebuild: L3.75 no longer emits per-layer SpecificsNeedEmission.
  // Phase B (essayLevelEmissionService) reads L3.75's holistic-synthesis
  // artifacts directly at decision time.

  return result;
}

// ── Section coercion helpers ──

function coerceVoiceIdentity(raw: Record<string, unknown>): VoiceIdentity {
  return {
    signature: String(raw.signature ?? ''),
    register: String(raw.register ?? ''),
    distinctivePatterns: ensureStringArray(raw.distinctivePatterns),
    evolution: String(raw.evolution ?? ''),
    authenticVsPerformed: ensureArray(raw.authenticVsPerformed).map((item: Record<string, unknown>) => ({
      location: ensureTuple(item.location) as [number, number],
      assessment: (item.assessment === 'performed' ? 'performed' : 'authentic') as 'authentic' | 'performed',
      reasoning: String(item.reasoning ?? ''),
    })),
  };
}

function coerceVoiceMap(raw: Record<string, unknown>): VoiceMap {
  return {
    register: coerceVoiceMapDimension(raw.register as Record<string, unknown>),
    vocabularyFingerprint: coerceVoiceMapDimensionWithDomains(raw.vocabularyFingerprint as Record<string, unknown>),
    sentenceRhythm: coerceVoiceMapDimension(raw.sentenceRhythm as Record<string, unknown>),
    perspectiveDistance: coerceVoiceMapDimension(raw.perspectiveDistance as Record<string, unknown>),
    tonalDisposition: coerceVoiceMapDimensionWithQualities(raw.tonalDisposition as Record<string, unknown>),
    stabilityRegions: ensureArray(raw.stabilityRegions).map((r: Record<string, unknown>) => ({
      paragraphs: ensureArray(r.paragraphs).map(Number),
      voiceCharacter: String(r.voiceCharacter ?? ''),
    })),
    shifts: ensureArray(raw.shifts).map(coerceVoiceShift),
    codeSwitching: ensureArray(raw.codeSwitching).map(coerceCodeSwitchEvent),
  };
}

function coerceVoiceMapDimension(raw: Record<string, unknown> | undefined): VoiceMapDimension {
  if (!raw) return { baseline: '', observations: [] };
  return {
    baseline: String(raw.baseline ?? ''),
    observations: ensureArray(raw.observations).map(coerceVoiceObservation),
  };
}

function coerceVoiceMapDimensionWithDomains(raw: Record<string, unknown> | undefined): VoiceMapDimensionWithDomains {
  const base = coerceVoiceMapDimension(raw);
  return {
    ...base,
    domains: ensureArray(raw?.domains).map((d: Record<string, unknown>) => ({
      domain: String(d.domain ?? ''),
      exampleWords: ensureStringArray(d.exampleWords),
      paragraphs: ensureNumberArray(d.paragraphs),
    })),
  };
}

function coerceVoiceMapDimensionWithQualities(raw: Record<string, unknown> | undefined): VoiceMapDimensionWithQualities {
  const base = coerceVoiceMapDimension(raw);
  const validQualities: TonalQuality[] = [
    'humor', 'irony', 'earnestness', 'irreverence', 'solemnity',
    'self_awareness', 'detachment', 'tenderness', 'defiance',
  ];
  const rawQualities = ensureStringArray(raw?.dominantQualities);
  return {
    ...base,
    dominantQualities: rawQualities.filter(q => validQualities.includes(q as TonalQuality)) as TonalQuality[],
  };
}

function coerceVoiceObservation(item: Record<string, unknown>): VoiceObservation {
  const loc = item.location as Record<string, unknown> | undefined;
  const validDimensions: VoiceDimension[] = ['register', 'vocabulary', 'rhythm', 'perspective', 'tonal_disposition'];
  const rawDims = ensureStringArray(item.dimensions);
  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentenceRange ? { sentenceRange: ensureTuple(loc.sentenceRange) as [number, number] } : {}),
    },
    observation: String(item.observation ?? ''),
    dimensions: rawDims.filter(d => validDimensions.includes(d as VoiceDimension)) as VoiceDimension[],
  };
}

function coerceVoiceShift(item: Record<string, unknown>): VoiceShift {
  const loc = item.location as Record<string, unknown> | undefined;
  const intentionality = item.intentionality as Record<string, unknown> | undefined;
  const validDimensions: VoiceDimension[] = ['register', 'vocabulary', 'rhythm', 'perspective', 'tonal_disposition'];
  const rawDims = ensureStringArray(item.dimensions);
  const validBoundaries = ['paragraph_boundary', 'mid_paragraph', 'sentence_boundary'] as const;
  const rawBoundary = String(loc?.boundary ?? 'paragraph_boundary');
  const boundary = validBoundaries.includes(rawBoundary as typeof validBoundaries[number])
    ? rawBoundary as typeof validBoundaries[number]
    : 'paragraph_boundary' as const;

  const validAssessments = ['intentional', 'unintentional', 'ambiguous'] as const;
  const rawAssessment = String(intentionality?.assessment ?? 'ambiguous');
  const assessment = validAssessments.includes(rawAssessment as typeof validAssessments[number])
    ? rawAssessment as typeof validAssessments[number]
    : 'ambiguous' as const;

  const result: VoiceShift = {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      boundary,
    },
    dimensions: rawDims.filter(d => validDimensions.includes(d as VoiceDimension)) as VoiceDimension[],
    fromDescription: String(item.fromDescription ?? ''),
    toDescription: String(item.toDescription ?? ''),
    intentionality: {
      assessment,
      confidence: clampNumber(Number(intentionality?.confidence ?? 0.5), 0, 1),
      reasoning: String(intentionality?.reasoning ?? ''),
    },
  };

  if (item.servesFunction && item.servesFunction !== 'null') {
    result.servesFunction = String(item.servesFunction);
  }
  if (item.entanglementRef && item.entanglementRef !== 'null') {
    result.entanglementRef = String(item.entanglementRef);
  }

  return result;
}

function coerceCodeSwitchEvent(item: Record<string, unknown>): CodeSwitchEvent {
  const loc = item.location as Record<string, unknown> | undefined;
  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      sentence: Number(loc?.sentence ?? 0),
    },
    language: String(item.language ?? ''),
    trigger: String(item.trigger ?? ''),
    culturalFunction: String(item.culturalFunction ?? ''),
    text: String(item.text ?? ''),
  };
}

function coerceEmotionalTopography(raw: Record<string, unknown>): EmotionalTopography {
  const validIntensities = ['low', 'moderate', 'high', 'peak'] as const;
  const validShowTell = ['shown', 'told', 'mixed'] as const;

  return {
    arcTrajectory: String(raw.arcTrajectory ?? ''),
    peakMoments: ensureArray(raw.peakMoments).map((item: Record<string, unknown>) => {
      const rawIntensity = String(item.intensity ?? 'moderate');
      return {
        location: ensureTuple(item.location) as [number, number],
        emotion: String(item.emotion ?? ''),
        intensity: (validIntensities.includes(rawIntensity as typeof validIntensities[number])
          ? rawIntensity
          : 'moderate') as typeof validIntensities[number],
      };
    }),
    undertones: ensureStringArray(raw.undertones),
    emotionalProgression: ensureArray(raw.emotionalProgression).map((item: Record<string, unknown>) => ({
      paragraph: Number(item.paragraph ?? 0),
      register: String(item.register ?? ''),
      shift: String(item.shift ?? ''),
    })),
    showVsTell: ensureArray(raw.showVsTell).map((item: Record<string, unknown>) => {
      const rawAssessment = String(item.assessment ?? 'mixed');
      return {
        location: ensureTuple(item.location) as [number, number],
        assessment: (validShowTell.includes(rawAssessment as typeof validShowTell[number])
          ? rawAssessment
          : 'mixed') as typeof validShowTell[number],
        detail: String(item.detail ?? ''),
      };
    }),
    authenticityAssessment: String(raw.authenticityAssessment ?? ''),
  };
}

function coerceEarnednessMap(raw: Record<string, unknown>): MomentEarnednessMap {
  return {
    moments: ensureArray(raw.moments).map(coerceEarnedMoment),
    structuralObservation: String(raw.structuralObservation ?? ''),
  };
}

function coerceEarnedMoment(item: Record<string, unknown>): EarnedMoment {
  const loc = item.location as Record<string, unknown> | undefined;
  const validTypes = ['emotional', 'intellectual', 'humorous', 'subversive'] as const;
  const rawType = String(item.momentType ?? 'emotional');

  return {
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      sentence: Number(loc?.sentence ?? 0),
    },
    momentType: (validTypes.includes(rawType as typeof validTypes[number])
      ? rawType
      : 'emotional') as typeof validTypes[number],
    description: String(item.description ?? ''),
    payload: String(item.payload ?? ''),
    mechanisms: ensureArray(item.mechanisms).map(coerceEarningMechanism),
    gaps: ensureStringArray(item.gaps),
  };
}

function coerceEarningMechanism(item: Record<string, unknown>): EarningMechanism {
  const validMechanisms: EarningMechanismType[] = [
    'sensory_grounding', 'emotional_setup', 'stakes_establishment',
    'character_revelation', 'thematic_preparation',
    'intellectual_scaffolding', 'comedic_subversive_setup',
  ];
  const rawType = String(item.type ?? 'emotional_setup');
  const loc = item.location as Record<string, unknown> | undefined;

  const result: EarningMechanism = {
    type: (validMechanisms.includes(rawType as EarningMechanismType)
      ? rawType
      : 'emotional_setup') as EarningMechanismType,
    location: {
      paragraph: Number(loc?.paragraph ?? 0),
      ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      ...(loc?.sentenceRange ? { sentenceRange: ensureTuple(loc.sentenceRange) as [number, number] } : {}),
    },
    contribution: String(item.contribution ?? ''),
  };

  if (item.connectionRef) {
    result.connectionRef = String(item.connectionRef);
  }

  return result;
}

function coerceThematicArchitecture(raw: Record<string, unknown>): ThematicArchitecture {
  const validStrengths: ThreadStrength[] = ['dominant', 'supporting', 'hinted', 'dropped'];

  return {
    centralThesis: String(raw.centralThesis ?? ''),
    thesisConfidence: clampNumber(Number(raw.thesisConfidence ?? 0.5), 0, 1),
    thesisEvolution: String(raw.thesisEvolution ?? ''),
    threads: ensureArray(raw.threads).map((item: Record<string, unknown>) => {
      const introAt = item.introducedAt as Record<string, unknown> | undefined;
      const rawStrength = String(item.strength ?? 'supporting');
      return {
        thread: String(item.thread ?? ''),
        introducedAt: {
          paragraph: Number(introAt?.paragraph ?? 0),
          ...(introAt?.sentence !== undefined && introAt?.sentence !== null ? { sentence: Number(introAt.sentence) } : {}),
        },
        appearances: ensureArray(item.appearances).map((a: Record<string, unknown>) => ({
          paragraph: Number(a.paragraph ?? 0),
          ...(a.sentence !== undefined && a.sentence !== null ? { sentence: Number(a.sentence) } : {}),
        })),
        strength: (validStrengths.includes(rawStrength as ThreadStrength)
          ? rawStrength
          : 'supporting') as ThreadStrength,
      };
    }),
    subtext: String(raw.subtext ?? ''),
    contradictions: ensureStringArray(raw.contradictions),
  };
}

function coerceNarrativeStrategy(raw: Record<string, unknown>): NarrativeStrategy {
  const validMomentum = ['building', 'sustaining', 'releasing', 'stalling'] as const;
  const rawMomentum = String(raw.arcMomentum ?? 'building');
  const arcMomentum = validMomentum.includes(rawMomentum as typeof validMomentum[number])
    ? rawMomentum as typeof validMomentum[number]
    : 'building' as const;

  // Parse turning point — can be null, or {paragraph, sentence}
  let turningPoint: { paragraph: number; sentence: number } | null = null;
  if (raw.turningPoint && typeof raw.turningPoint === 'object') {
    const tp = raw.turningPoint as Record<string, unknown>;
    if (tp.paragraph !== undefined && tp.paragraph !== null) {
      turningPoint = {
        paragraph: Number(tp.paragraph),
        sentence: Number(tp.sentence ?? 0),
      };
    }
  }

  return {
    primaryStrategy: String(raw.primaryStrategy ?? ''),
    strategyRationale: String(raw.strategyRationale ?? raw.whyThisStructure ?? ''),
    pivotPoints: ensureArray(raw.pivotPoints).map((item: Record<string, unknown>) => {
      const loc = item.location as Record<string, unknown> | undefined;
      return {
        location: {
          paragraph: Number(loc?.paragraph ?? 0),
          ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
        },
        description: String(item.description ?? ''),
      };
    }),
    pacingAnalysis: String(raw.pacingAnalysis ?? ''),
    structuralChoices: ensureStringArray(raw.structuralChoices),
    arcType: String(raw.arcType ?? ''),
    arcMomentum,
    turningPoint,
  };
}

function coerceCharacterRevelation(raw: Record<string, unknown>): CharacterRevelation {
  return {
    writerPortrait: String(raw.writerPortrait ?? raw.whoIsThisWriter ?? ''),
    valuesRevealed: ensureStringArray(raw.valuesRevealed),
    growthArc: String(raw.growthArc ?? ''),
    intellectualFingerprint: String(raw.intellectualFingerprint ?? ''),
    blindSpots: ensureStringArray(raw.blindSpots),
    revealedQualities: ensureStringArray(raw.revealedQualities),
  };
}

function coerceCraftAssessment(raw: Record<string, unknown>): CraftAssessment {
  // Prompt uses descriptive field names (craftSignatures/craftPatterns) to avoid
  // evaluative framing. Map to profile type's field names (strengthSignatures/growthEdges).
  // Accept both old and new names for robustness.
  const signaturesRaw = raw.craftSignatures ?? raw.strengthSignatures;
  const patternsRaw = raw.craftPatterns ?? raw.growthEdges;

  return {
    strengthSignatures: ensureArray(signaturesRaw).map((item: Record<string, unknown>) => ({
      quality: String(item.quality ?? ''),
      evidence: String(item.evidence ?? ''),
      paragraphs: ensureNumberArray(item.paragraphs),
    })),
    growthEdges: ensureArray(patternsRaw).map((item: Record<string, unknown>) => ({
      quality: String(item.quality ?? ''),
      description: String(item.description ?? ''),
      paragraphs: ensureNumberArray(item.paragraphs),
      // Scope 2 Phase 5: parse optional pairedImprovement block
      pairedImprovement: coercePairedImprovement(item.pairedImprovement),
    })),
    imageSystem: String(raw.imageSystem ?? ''),
    sentencePatterns: String(raw.sentencePatterns ?? ''),
    wordPatterns: String(raw.wordPatterns ?? ''),
  };
}

/**
 * Scope 2 Phase 5: parse the optional pairedImprovement slot on a
 * CraftAssessment growth edge. Returns null when absent, malformed, or
 * missing the required directive + architecturalReason fields.
 *
 * Treats unknown expectedImpact values as 'incremental' (safest default).
 * Normalizes the technique name through the closed vocabulary so unknown
 * or misspelled names collapse to null rather than propagating garbage.
 */
function coercePairedImprovement(
  raw: unknown,
): CraftAssessment['growthEdges'][number]['pairedImprovement'] | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const directive = typeof r.directive === 'string' ? r.directive.trim() : '';
  const architecturalReason =
    typeof r.architecturalReason === 'string' ? r.architecturalReason.trim() : '';
  if (directive.length === 0 || architecturalReason.length === 0) return null;

  const technique = normalizeTechnique(
    typeof r.technique === 'string' ? r.technique : null,
  );

  const demonstrationSketch =
    typeof r.demonstrationSketch === 'string' && r.demonstrationSketch.trim().length > 0
      ? r.demonstrationSketch.trim()
      : null;

  const rawImpact = typeof r.expectedImpact === 'string' ? r.expectedImpact : 'incremental';
  const expectedImpact: 'transformative' | 'significant' | 'incremental' =
    rawImpact === 'transformative' || rawImpact === 'significant'
      ? rawImpact
      : 'incremental';

  return {
    technique,
    directive,
    architecturalReason,
    demonstrationSketch,
    expectedImpact,
  };
}

/**
 * Quality Gap 1: parse a SignatureMove candidate from raw LLM output. Returns
 * null when the candidate is structurally malformed; the substring + paragraph-
 * index referential-integrity check is applied separately by
 * validateSignatureMoveAgainstParagraphs() so that pure-shape parsing stays
 * decoupled from essay-text-aware validation.
 */
function coerceSignatureMove(raw: unknown): SignatureMove | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const oneSentenceName = typeof r.oneSentenceName === 'string' ? r.oneSentenceName.trim() : '';
  const whyItIsTheirs = typeof r.whyItIsTheirs === 'string' ? r.whyItIsTheirs.trim() : '';
  const readerEffect = typeof r.readerEffect === 'string' ? r.readerEffect.trim() : '';

  if (oneSentenceName.length === 0 || whyItIsTheirs.length === 0 || readerEffect.length === 0) {
    return null;
  }

  const rawInstances = Array.isArray(r.instances) ? r.instances : [];
  const instances: SignatureMoveInstance[] = [];

  for (const inst of rawInstances) {
    if (!inst || typeof inst !== 'object') continue;
    const i = inst as Record<string, unknown>;
    const kind = typeof i.kind === 'string' ? i.kind : '';
    const whatThisInstanceShows =
      typeof i.whatThisInstanceShows === 'string' ? i.whatThisInstanceShows.trim() : '';
    if (whatThisInstanceShows.length === 0) continue;

    if (kind === 'sentence_quote') {
      const loc = i.location as Record<string, unknown> | undefined;
      if (!loc || typeof loc.paragraph !== 'number') continue;
      const quotedText = typeof i.quotedText === 'string' ? i.quotedText.trim() : '';
      if (quotedText.length === 0) continue;
      instances.push({
        kind: 'sentence_quote',
        location: {
          paragraph: loc.paragraph,
          sentence: typeof loc.sentence === 'number' ? loc.sentence : undefined,
        },
        quotedText,
        whatThisInstanceShows,
      });
    } else if (kind === 'paragraph_compression') {
      if (typeof i.paragraph !== 'number') continue;
      instances.push({
        kind: 'paragraph_compression',
        paragraph: i.paragraph,
        whatThisInstanceShows,
      });
    } else if (kind === 'cross_paragraph_pattern') {
      const paragraphs = ensureNumberArray(i.paragraphs);
      if (paragraphs.length < 2) continue;
      instances.push({
        kind: 'cross_paragraph_pattern',
        paragraphs,
        whatThisInstanceShows,
      });
    }
  }

  if (instances.length === 0) return null;

  return {
    oneSentenceName,
    whyItIsTheirs,
    instances,
    readerEffect,
  };
}

function coerceAdmissionsPositioning(raw: Record<string, unknown>): AdmissionsPositioning {
  const result: AdmissionsPositioning = {
    tellabilitySummary: String(raw.tellabilitySummary ?? ''),
    distinctivenessFactors: ensureStringArray(raw.distinctivenessFactors),
    institutionalFit: String(raw.institutionalFit ?? ''),
    redFlags: ensureStringArray(raw.redFlags),
    memorability: String(raw.memorability ?? raw.memorabilityAssessment ?? ''),
    portfolioPosition: String(raw.portfolioPosition ?? raw.aoTakeaway ?? ''),
    aoTakeaway: String(raw.aoTakeaway ?? ''),
  };

  // Parse archetypeContext if present in LLM output
  const rawArchetype = raw.archetypeContext;
  if (rawArchetype && typeof rawArchetype === 'object' && !Array.isArray(rawArchetype)) {
    const arch = rawArchetype as Record<string, unknown>;
    const validPoolDensities = ['saturated', 'common', 'moderate', 'uncommon', 'rare'] as const;
    const rawDensity = String(arch.poolDensity ?? 'common');
    const poolDensity = validPoolDensities.includes(rawDensity as typeof validPoolDensities[number])
      ? rawDensity as 'saturated' | 'common' | 'moderate' | 'uncommon' | 'rare'
      : 'common';

    if (arch.archetype) {
      result.archetypeContext = {
        archetype: String(arch.archetype),
        poolDensity,
        differentiator: arch.differentiator != null ? String(arch.differentiator) : null,
      };
    }
  }

  return result;
}

function coerceEntanglements(raw: unknown[]): CrossDimensionEntanglement[] {
  if (!Array.isArray(raw)) return [];

  const validDimensions: HolisticDimension[] = [
    'voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'admissions', 'structure',
  ];

  const validSignificance = ['foundational', 'supporting', 'subtle'] as const;

  return raw.map((item: Record<string, unknown>, idx: number) => {
    const loc = item.location as Record<string, unknown> | undefined;
    const rawDims = ensureStringArray(item.dimensions);
    const rawCrossRefs = ensureStringArray(item.crossRefs);
    const rawSig = String(item.significance ?? 'supporting');
    const significance = validSignificance.includes(rawSig as typeof validSignificance[number])
      ? rawSig as typeof validSignificance[number]
      : 'supporting' as const;

    return {
      id: String(item.id ?? `ent-${idx + 1}`),
      dimensions: rawDims.filter(d => validDimensions.includes(d as HolisticDimension)) as HolisticDimension[],
      location: {
        paragraph: Number(loc?.paragraph ?? 0),
        ...(loc?.sentence !== undefined && loc?.sentence !== null ? { sentence: Number(loc.sentence) } : {}),
      },
      description: String(item.description ?? ''),
      crossRefs: rawCrossRefs.filter(d => validDimensions.includes(d as HolisticDimension)) as HolisticDimension[],
      significance,
    };
  });
}

// ── Utility helpers ──

function ensureArray(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  return [];
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => String(v ?? ''));
}

function ensureNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => Number(v ?? 0));
}

function ensureTuple(value: unknown): [number, number] {
  if (Array.isArray(value) && value.length >= 2) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)];
  }
  return [0, 0];
}

function clampNumber(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// ── V2 Connection coercion helpers ──

const VALID_STRENGTH_CATEGORIES: ConnectionStrengthCategory[] = ['foundational', 'significant', 'supporting', 'tentative'];
const VALID_DIRECTIONALITIES: ConnectionDirectionality[] = ['forward', 'reverse', 'bidirectional', 'asymmetric'];

function coerceConnectionEndpoint(raw: unknown): ConnectionEndpoint {
  if (!raw || typeof raw !== 'object') {
    return { paragraph: 0, sentence: 0, label: '' };
  }
  const obj = raw as Record<string, unknown>;
  return {
    paragraph: typeof obj.paragraph === 'number' ? obj.paragraph : 0,
    sentence: typeof obj.sentence === 'number' ? obj.sentence : undefined,
    label: typeof obj.label === 'string' ? obj.label : '',
  };
}

function coerceNewConnections(
  raw: Array<Record<string, unknown>>,
): HolisticSynthesisOutput['newConnections'] {
  return raw
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      from: coerceConnectionEndpoint(item.from),
      to: coerceConnectionEndpoint(item.to),
      description: String(item.description ?? ''),
      reverseIllumination: typeof item.reverseIllumination === 'string' ? item.reverseIllumination : null,
      significance: String(item.significance ?? ''),
      strengthCategory: (
        VALID_STRENGTH_CATEGORIES.includes(item.strengthCategory as ConnectionStrengthCategory)
          ? item.strengthCategory as ConnectionStrengthCategory
          : 'significant'
      ),
      directionality: (
        VALID_DIRECTIONALITIES.includes(item.directionality as ConnectionDirectionality)
          ? item.directionality as ConnectionDirectionality
          : 'forward'
      ),
    }))
    .filter(conn => conn.description.length > 0);
}

function coerceConnectionUpgrades(
  raw: Array<Record<string, unknown>>,
): HolisticSynthesisOutput['connectionUpgrades'] {
  return raw
    .filter(item => item && typeof item === 'object' && typeof item.connectionId === 'string')
    .map(item => {
      const upgrade: NonNullable<HolisticSynthesisOutput['connectionUpgrades']>[number] = {
        connectionId: String(item.connectionId),
      };
      if (VALID_STRENGTH_CATEGORIES.includes(item.strengthCategory as ConnectionStrengthCategory)) {
        upgrade.strengthCategory = item.strengthCategory as ConnectionStrengthCategory;
      }
      if (typeof item.reverseIllumination === 'string' && item.reverseIllumination.length > 0) {
        upgrade.reverseIllumination = item.reverseIllumination;
      }
      if (typeof item.significance === 'string' && item.significance.length > 0) {
        upgrade.significance = item.significance;
      }
      return upgrade;
    });
}

// ── W1.4 Finding coercion helpers ──

const VALID_FINDING_SCOPE_TYPES = ['word', 'sentence', 'sentence_group', 'paragraph', 'cross_paragraph', 'essay_level'] as const;
const VALID_FINDING_MATURITIES: FindingMaturity[] = ['hypothesis', 'developing', 'confirmed', 'deepened', 'superseded'];
const VALID_FINDING_MATURITIES_NO_SUPERSEDED: FindingMaturity[] = ['hypothesis', 'developing', 'confirmed', 'deepened'];
const VALID_COACHING_VALUES: FindingCoachingValue[] = ['critical', 'high', 'medium', 'contextual', 'diagnostic'];
const VALID_HOLISTIC_DIMENSIONS: HolisticDimension[] = ['voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'admissions', 'structure'];

function coerceSynthesisFindings(
  raw: Array<Record<string, unknown>>,
): NonNullable<HolisticSynthesisOutput['newFindings']> {
  return raw
    .filter(item => item && typeof item === 'object' && typeof item.claim === 'string' && item.claim.length > 0)
    .map(item => {
      // Parse scope
      const rawScope = item.scope as Record<string, unknown> | undefined;
      const scopeType = rawScope?.type;
      const scope: FindingScope = {
        type: (typeof scopeType === 'string' && VALID_FINDING_SCOPE_TYPES.includes(scopeType as typeof VALID_FINDING_SCOPE_TYPES[number]))
          ? scopeType as FindingScope['type']
          : 'essay_level',
        textEvidence: coerceFindingTextEvidence(rawScope?.textEvidence),
      };
      if (typeof rawScope?.paragraph === 'number') scope.paragraph = rawScope.paragraph;
      if (Array.isArray(rawScope?.sentences)) scope.sentences = rawScope.sentences.filter((s): s is number => typeof s === 'number');
      if (Array.isArray(rawScope?.paragraphs)) scope.paragraphs = rawScope.paragraphs.filter((p): p is number => typeof p === 'number');

      // Parse maturity (new findings cannot be 'superseded')
      const rawMaturity = String(item.maturity ?? 'hypothesis');
      const maturity: FindingMaturity = VALID_FINDING_MATURITIES_NO_SUPERSEDED.includes(rawMaturity as FindingMaturity)
        ? rawMaturity as FindingMaturity
        : 'hypothesis';

      // Parse coaching value
      const rawCoaching = String(item.coachingValue ?? 'medium');
      const coachingValue: FindingCoachingValue = VALID_COACHING_VALUES.includes(rawCoaching as FindingCoachingValue)
        ? rawCoaching as FindingCoachingValue
        : 'medium';

      // Parse dimensions
      const rawDims = Array.isArray(item.dimensions) ? item.dimensions : [];
      const dimensions = rawDims
        .map(d => String(d))
        .filter(d => VALID_HOLISTIC_DIMENSIONS.includes(d as HolisticDimension)) as HolisticDimension[];

      // Parse evidence
      const evidence = coerceFindingEvidenceArray(item.evidence);

      const finding: NonNullable<HolisticSynthesisOutput['newFindings']>[number] = {
        claim: String(item.claim),
        scope,
        maturity,
        maturityReasoning: String(item.maturityReasoning ?? ''),
        coachingValue,
        dimensions,
        evidence,
        deepeningPotential: typeof item.deepeningPotential === 'string' ? item.deepeningPotential : null,
        raisesQuestions: ensureStringArray(item.raisesQuestions),
      };

      // Optional relationship references
      if (Array.isArray(item.buildsOn) && item.buildsOn.length > 0) {
        finding.buildsOn = ensureStringArray(item.buildsOn);
      }
      if (Array.isArray(item.relatedTo) && item.relatedTo.length > 0) {
        finding.relatedTo = ensureStringArray(item.relatedTo);
      }

      return finding;
    })
    .filter(f => f.claim.length > 0 && f.evidence.length > 0);
}

function coerceFindingEvolutions(
  raw: Array<Record<string, unknown>>,
): NonNullable<HolisticSynthesisOutput['findingEvolutions']> {
  return raw
    .filter(item =>
      item && typeof item === 'object' &&
      typeof item.findingId === 'string' && item.findingId.length > 0,
    )
    .map(item => {
      const rawMaturity = String(item.newMaturity ?? 'developing');
      const newMaturity: FindingMaturity = VALID_FINDING_MATURITIES.includes(rawMaturity as FindingMaturity)
        ? rawMaturity as FindingMaturity
        : 'developing';

      const evo: NonNullable<HolisticSynthesisOutput['findingEvolutions']>[number] = {
        findingId: String(item.findingId),
        newMaturity,
        reasoning: String(item.reasoning ?? ''),
      };

      if (typeof item.supersedes === 'string' && item.supersedes.length > 0) {
        evo.supersedes = item.supersedes;
      }

      return evo;
    })
    .filter(e => e.findingId.length > 0 && e.reasoning.length > 0);
}

function coerceFindingEvidenceArray(raw: unknown): FindingEvidence[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && typeof item.text === 'string',
    )
    .map(item => {
      const evidence: FindingEvidence = {
        text: String(item.text),
        type: item.type === 'absent' ? 'absent' : 'present',
      };
      if (item.location && typeof item.location === 'object') {
        const loc = item.location as Record<string, unknown>;
        if (typeof loc.paragraph === 'number') {
          evidence.location = {
            paragraph: loc.paragraph,
            ...(typeof loc.sentence === 'number' ? { sentence: loc.sentence } : {}),
          };
        }
      }
      return evidence;
    })
    .filter(e => e.text.length > 0);
}

function coerceFindingTextEvidence(raw: unknown): FindingScope['textEvidence'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && typeof item.text === 'string',
    )
    .map(item => {
      const loc = item.location as Record<string, unknown> | undefined;
      return {
        text: String(item.text),
        location: {
          paragraph: typeof loc?.paragraph === 'number' ? loc.paragraph : 0,
          ...(typeof loc?.sentence === 'number' ? { sentence: loc.sentence } : {}),
        },
      };
    });
}

// ============================================================================
// HOLISTIC SYNTHESIS SERVICE
// ============================================================================

export class HolisticSynthesisService {
  /**
   * Synthesize all 10 holistic sections from the complete L3 understanding.
   *
   * Two parallel Sonnet calls (Phase A: voice+emotion+earned-ness, Phase B: theme+narrative+character+craft+admissions).
   * Each generates ~8K tokens, avoiding the 10+ minute timeout of a single 16K-token call.
   * Results are merged into the full HolisticSynthesisOutput.
   *
   * @param input - Essay text, complete profile after L3 walk, holistic evolution scaffold
   * @returns The 10 holistic sections + cost/timing metadata
   * @throws Error if either Sonnet call fails or response cannot be parsed
   */
  async synthesize(input: HolisticSynthesisInput): Promise<HolisticSynthesisResult> {
    const startTime = Date.now();

    // Build the shared user prompt from essay context + understanding + scaffold
    const understandingContext = buildUnderstandingContext(input.profile, input.findingStore);
    const evolutionScaffold = buildEvolutionScaffold(input.holisticEvolution);

    // W1.4: Build finding context if a FindingStore is available
    let findingContextBlock = '';
    if (input.findingStore && input.findingStore.size > 0) {
      const refContext = buildFindingReferenceContext(input.findingStore);
      if (refContext) {
        findingContextBlock = '\n\n' + refContext;
      }
    }

    // Port A2 (Wave-1a): prepend prior-voice block when available.
    // Empty string when input.priorVoiceProfile is null/undefined, producing
    // pre-port-identical user prompt. See priorVoiceBlock.ts for contract.
    const priorVoiceBlock = buildPriorVoiceBlock(input.priorVoiceProfile);
    const priorVoicePreamble = priorVoiceBlock ? priorVoiceBlock + '\n\n' : '';

    // Port F2 (Wave-1b): prepend aiRiskScorer diagnostic prior when the
    // orchestrator has populated profile.index.aiRiskSignal (gated on
    // ENABLE_AI_RISK_SIGNAL). Empty string when the signal is null/
    // undefined, producing pre-port-identical user prompt. The prior is
    // DIAGNOSTIC — L3.75 reads, never mutates. See aiRiskSignalBlock.ts.
    const aiRiskSignalBlock = buildAiRiskSignalBlock(input.profile.index.aiRiskSignal ?? null);
    const aiRiskPreamble = aiRiskSignalBlock ? aiRiskSignalBlock + '\n\n' : '';

    // Wave-3a Phase 3C: inject corpus archetype anchors. Uses the DESCRIPTIVE
    // block (no calibration language) — L3.75 synthesizes what IS, it does
    // not judge. Stage tag 'synthesis' so telemetry aggregates independently
    // of phase assessment. Feature-flag-gated per-layer, silent-degrade.
    let corpusArchetypeBlock = '';
    const synthesisCorpusTel: CorpusRetrievalTelemetry | null = isCorpusRetrievalEnabledForL375()
      ? createTelemetry()
      : null;
    if (synthesisCorpusTel) {
      const corpusRunStart = Date.now();
      const archetypes = await retrievePhaseArchetypes(input.profile, synthesisCorpusTel, 'synthesis');
      corpusArchetypeBlock = buildDescriptiveArchetypesBlock(archetypes);
      synthesisCorpusTel.corpusBlockTokens += estimateBlockTokens(corpusArchetypeBlock);
      synthesisCorpusTel.totalLatencyMs = Date.now() - corpusRunStart;
    }
    const corpusPreamble = corpusArchetypeBlock ? corpusArchetypeBlock + '\n\n' : '';

    const userPrompt = [
      priorVoicePreamble,
      aiRiskPreamble,
      corpusPreamble,
      '=== FULL ESSAY TEXT ===\n',
      input.essayText,
      '\n\n',
      understandingContext,
      findingContextBlock,
      '\n',
      evolutionScaffold,
    ].join('');

    console.log(
      `[HolisticSynthesis] Starting 2-phase parallel synthesis — ` +
      `${input.profile.paragraphs.length} paragraphs, ` +
      `${input.profile.connections.all.filter(c => c.status === 'active').length} active connections, ` +
      `~${Math.round(userPrompt.length / 4)} estimated input tokens per phase`
    );

    // Run Phase A and Phase B in parallel
    const [responseA, responseB] = await Promise.all([
      callClaudeWithRetry<unknown>(
        {
          model: SONNET,
          systemPrompt: SYSTEM_PROMPT_PHASE_A,
          userPrompt,
          maxTokens: SYNTHESIS_MAX_TOKENS_PHASE_A,
          temperature: SYNTHESIS_TEMPERATURE,
          timeoutMs: SYNTHESIS_TIMEOUT_MS,
          useJsonMode: true,
          cacheSystemPrompt: true,
        },
      ).then(r => {
        console.log(
          `[HolisticSynthesis] Phase A complete — ` +
          `${r.usage.output_tokens} output tokens, ` +
          `$${calculateCost(r.usage, SONNET).toFixed(4)}, ` +
          `stopReason: ${r.stopReason}`
        );
        return r;
      }),
      callClaudeWithRetry<unknown>(
        {
          model: SONNET,
          systemPrompt: SYSTEM_PROMPT_PHASE_B,
          userPrompt,
          maxTokens: SYNTHESIS_MAX_TOKENS_PHASE_B,
          temperature: SYNTHESIS_TEMPERATURE,
          timeoutMs: SYNTHESIS_TIMEOUT_MS,
          useJsonMode: true,
          cacheSystemPrompt: true,
        },
      ).then(r => {
        console.log(
          `[HolisticSynthesis] Phase B complete — ` +
          `${r.usage.output_tokens} output tokens, ` +
          `$${calculateCost(r.usage, SONNET).toFixed(4)}, ` +
          `stopReason: ${r.stopReason}`
        );
        return r;
      }),
    ]);

    // Parse and merge
    const phaseA = parsePhaseA(responseA.content);
    const phaseB = parsePhaseB(responseB.content);
    const synthesis = mergePhases(phaseA, phaseB);

    // Combined cost
    const costA = calculateCost(responseA.usage, SONNET);
    const costB = calculateCost(responseB.usage, SONNET);
    const cost = costA + costB;

    const timingMs = Date.now() - startTime;

    // ── Completeness guard ──
    const COMPLETENESS_CHECKS: Array<{
      name: string;
      check: () => boolean;
    }> = [
      { name: 'voiceIdentity', check: () => !!(synthesis.voiceIdentity?.signature) },
      { name: 'voiceMap', check: () => !!(synthesis.voiceMap?.register) },
      { name: 'emotionalTopography', check: () => !!(synthesis.emotionalTopography?.arcTrajectory) },
      { name: 'momentEarnednessMap', check: () => Array.isArray(synthesis.momentEarnednessMap?.moments) && synthesis.momentEarnednessMap.moments.length > 0 },
      { name: 'thematicArchitecture', check: () => !!(synthesis.thematicArchitecture?.centralThesis) },
      { name: 'narrativeStrategy', check: () => !!(synthesis.narrativeStrategy?.primaryStrategy) },
      { name: 'characterRevelation', check: () => !!(synthesis.characterRevelation?.writerPortrait) },
      { name: 'craftAssessment', check: () => (synthesis.craftAssessment?.strengthSignatures?.length ?? 0) > 0 || !!(synthesis.craftAssessment?.imageSystem) },
      { name: 'admissionsPositioning', check: () => !!(synthesis.admissionsPositioning?.tellabilitySummary) },
      { name: 'entanglements', check: () => Array.isArray(synthesis.entanglements) },
    ];

    const missingSections: string[] = [];
    for (const { name, check } of COMPLETENESS_CHECKS) {
      if (!check()) {
        missingSections.push(name);
      }
    }
    const isComplete = missingSections.length === 0;

    if (!isComplete) {
      console.warn(
        `[HolisticSynthesis] INCOMPLETE: Missing/empty sections: [${missingSections.join(', ')}]. ` +
        `These sections will have default/empty values in the profile.`,
      );
    }

    // Warn if either phase was truncated
    if (responseA.stopReason === 'max_tokens') {
      console.warn('[HolisticSynthesis] WARNING: Phase A output was truncated by maxTokens limit.');
    }
    if (responseB.stopReason === 'max_tokens') {
      console.warn('[HolisticSynthesis] WARNING: Phase B output was truncated by maxTokens limit.');
    }

    const totalInputTokens = responseA.usage.input_tokens + responseB.usage.input_tokens;
    const totalOutputTokens = responseA.usage.output_tokens + responseB.usage.output_tokens;
    const totalCacheRead = (responseA.usage.cache_read_input_tokens ?? 0) + (responseB.usage.cache_read_input_tokens ?? 0);
    const totalCacheWrite = (responseA.usage.cache_creation_input_tokens ?? 0) + (responseB.usage.cache_creation_input_tokens ?? 0);

    console.log(
      `[HolisticSynthesis] Complete — ` +
      `${totalOutputTokens} output tokens (A: ${responseA.usage.output_tokens}, B: ${responseB.usage.output_tokens}), ` +
      `$${cost.toFixed(4)} cost, ` +
      `${timingMs}ms, ` +
      `complete: ${isComplete} (${10 - missingSections.length}/10 sections), ` +
      `moments: ${synthesis.momentEarnednessMap.moments.length}, ` +
      `shifts: ${synthesis.voiceMap.shifts.length}, ` +
      `entanglements: ${synthesis.entanglements.length}`,
    );

    // Wave-3a Phase 3C/3B: persist corpus telemetry for this synthesis call.
    if (synthesisCorpusTel) {
      const record = buildCorpusTelemetryRecord({
        essayId: input.essayId ?? 'unknown',
        layer: 'L3.75',
        telemetry: synthesisCorpusTel,
      });
      void persistCorpusTelemetry(record);
    }

    return {
      synthesis,
      isComplete,
      missingSections,
      cost,
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: totalCacheRead,
        cacheWriteTokens: totalCacheWrite,
      },
      timingMs,
    };
  }

  // =========================================================================
  // V2: ITERATION-BASED SYNTHESIS (Growth Cycle)
  // =========================================================================

  /**
   * Run one iteration of the growth cycle synthesis.
   *
   * Three sequential calls per iteration:
   * 1. Phase A + Phase B (parallel): holistic sections (reuses existing prompts)
   * 2. Phase Meta: walk validation + reading strategy + convergence
   * 3. Question Curation: curate/resolve/filter the question queue
   *
   * Iteration 0 synthesizes from scratch. Iteration 1+ refines with prior context.
   *
   * @param input Iteration input with prior state and activity log
   * @returns Complete iteration output including synthesis + meta + curation
   */
  async synthesizeIteration(input: SynthesisIterationInput): Promise<SynthesisIterationResult> {
    const startTime = Date.now();
    const isFirstIteration = input.iterationNumber === 0;

    console.log(
      `[HolisticSynthesis] Iteration ${input.iterationNumber} starting — ` +
      `${isFirstIteration ? 'from scratch' : 'refining'}, ` +
      `${input.cumulativeFindings.length} cumulative findings, ` +
      `${input.questionQueue.length} questions in queue`,
    );

    // ── Build shared context ──
    const understandingContext = buildUnderstandingContext(input.profile, input.findingStore);
    const evolutionScaffold = buildEvolutionScaffold(input.walkEvolution);

    // Build finding context
    let findingContextBlock = '';
    if (input.findingStore && input.findingStore.size > 0) {
      const refContext = buildFindingReferenceContext(input.findingStore);
      if (refContext) {
        findingContextBlock = '\n\n' + refContext;
      }
    }

    // Build iteration context (prior synthesis + new findings for iter > 0)
    const iterationContext = isFirstIteration
      ? ''
      : this.buildIterationContext(input);

    // Build activity log context
    const activityContext = input.activityLog.length > 0
      ? '\n\n' + formatActivityLogForPrompt(input.activityLog, input.budgetCeiling ?? 0.60, input.budgetRemaining ?? 0.60)
      : '';

    // Build phase context
    const phaseContext = input.priorPhase
      ? this.buildPhaseContext(input.priorPhase)
      : '';

    // Port A2 (Wave-1a): prepend prior-voice block. Same invariant as
    // synthesize() — empty when no prior profile, block wrapped with
    // A2_VOICE_PRIOR version markers when present.
    const priorVoiceBlock = buildPriorVoiceBlock(input.priorVoiceProfile);
    const priorVoicePreamble = priorVoiceBlock ? priorVoiceBlock + '\n\n' : '';

    // Port F2 (Wave-1b): prepend aiRiskScorer diagnostic prior. Same
    // invariant as synthesize() — empty when the signal is null, wrapped
    // with F2_AI_RISK_SIGNAL version markers when present. Read-only from
    // profile.index; this iteration loop never mutates the signal.
    const aiRiskSignalBlock = buildAiRiskSignalBlock(input.profile.index.aiRiskSignal ?? null);
    const aiRiskPreamble = aiRiskSignalBlock ? aiRiskSignalBlock + '\n\n' : '';

    // Wave-3a Phase 3C: same descriptive archetype block as synthesize(). Only
    // injected on the first iteration — subsequent iterations refine rather
    // than re-contextualize, so re-injecting wastes tokens. Feature-flag-gated,
    // silent-degrade.
    let iterCorpusArchetypeBlock = '';
    const iterCorpusTel: CorpusRetrievalTelemetry | null =
      isFirstIteration && isCorpusRetrievalEnabledForL375() ? createTelemetry() : null;
    if (iterCorpusTel) {
      const corpusRunStart = Date.now();
      const archetypes = await retrievePhaseArchetypes(input.profile, iterCorpusTel, 'synthesis');
      iterCorpusArchetypeBlock = buildDescriptiveArchetypesBlock(archetypes);
      iterCorpusTel.corpusBlockTokens += estimateBlockTokens(iterCorpusArchetypeBlock);
      iterCorpusTel.totalLatencyMs = Date.now() - corpusRunStart;
    }
    const iterCorpusPreamble = iterCorpusArchetypeBlock ? iterCorpusArchetypeBlock + '\n\n' : '';

    const userPrompt = [
      priorVoicePreamble,
      aiRiskPreamble,
      iterCorpusPreamble,
      '=== FULL ESSAY TEXT ===\n',
      input.essayText,
      '\n\n',
      understandingContext,
      findingContextBlock,
      iterationContext,
      activityContext,
      phaseContext,
      '\n',
      evolutionScaffold,
    ].join('');

    // ── Step 1: Phase A + Phase B (parallel) — 10 holistic sections ──
    const [responseA, responseB] = await Promise.all([
      callClaudeWithRetry<unknown>({
        model: SONNET,
        systemPrompt: SYSTEM_PROMPT_PHASE_A,
        userPrompt,
        maxTokens: SYNTHESIS_MAX_TOKENS_PHASE_A,
        temperature: SYNTHESIS_TEMPERATURE,
        timeoutMs: SYNTHESIS_TIMEOUT_MS,
        useJsonMode: true,
        cacheSystemPrompt: true,
      }).then(r => {
        console.log(
          `[HolisticSynthesis] Iter ${input.iterationNumber} Phase A — ` +
          `${r.usage.output_tokens} output tokens, stopReason: ${r.stopReason}`
        );
        return r;
      }),
      callClaudeWithRetry<unknown>({
        model: SONNET,
        systemPrompt: SYSTEM_PROMPT_PHASE_B,
        userPrompt,
        maxTokens: SYNTHESIS_MAX_TOKENS_PHASE_B,
        temperature: SYNTHESIS_TEMPERATURE,
        timeoutMs: SYNTHESIS_TIMEOUT_MS,
        useJsonMode: true,
        cacheSystemPrompt: true,
      }).then(r => {
        console.log(
          `[HolisticSynthesis] Iter ${input.iterationNumber} Phase B — ` +
          `${r.usage.output_tokens} output tokens, stopReason: ${r.stopReason}`
        );
        return r;
      }),
    ]);

    if (responseA.stopReason === 'max_tokens') {
      console.warn(`[HolisticSynthesis] WARNING: Iter ${input.iterationNumber} Phase A output was truncated by maxTokens limit.`);
    }
    if (responseB.stopReason === 'max_tokens') {
      console.warn(`[HolisticSynthesis] WARNING: Iter ${input.iterationNumber} Phase B output was truncated by maxTokens limit.`);
    }

    const phaseA = parsePhaseA(responseA.content);
    const phaseB = parsePhaseB(responseB.content);
    const synthesis = mergePhases(phaseA, phaseB);

    console.log(
      `[HolisticSynthesis] Iteration ${input.iterationNumber} — Phase A+B complete, ` +
      `$${(calculateCost(responseA.usage, SONNET) + calculateCost(responseB.usage, SONNET)).toFixed(4)}`,
    );

    // ── Step 2: Phase Meta — validation + reading strategy + convergence ──
    const metaUserPrompt = this.buildMetaUserPrompt(
      input,
      synthesis,
      understandingContext,
    );

    const metaResponse = await callClaudeWithRetry<unknown>({
      model: SONNET,
      systemPrompt: SYSTEM_PROMPT_META,
      userPrompt: metaUserPrompt,
      maxTokens: META_MAX_TOKENS,
      temperature: SYNTHESIS_TEMPERATURE,
      timeoutMs: META_TIMEOUT_MS,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const metaOutput = this.parseMetaOutput(metaResponse.content);

    console.log(
      `[HolisticSynthesis] Iteration ${input.iterationNumber} — Meta complete, ` +
      `converged=${metaOutput.selfAssessedConvergence.hasConverged}, ` +
      `${metaOutput.walkDisagreements.length} disagreements, ` +
      `${metaOutput.reReadCandidates.length} re-read candidates`,
    );

    // ── Step 3 & 3b: Question Curation + SignatureMove (parallel, isolated) ──
    //
    // Both consume META.readingStrategy and the synthesis. Neither reads the
    // other's output. Promise.allSettled isolates failures — a CURATION
    // failure cannot block SignatureMove and vice versa. Saves ~15-30s
    // wall-clock vs. serial-after-curation.
    const curationUserPrompt = this.buildCurationUserPrompt(
      input,
      synthesis,
      metaOutput.readingStrategy,
    );
    const paragraphTexts = input.profile.paragraphs.map((p) => p.text);

    const [curationSettled, signatureMoveSettled] = await Promise.allSettled([
      (async () => {
        const curationResponse = await callClaudeWithRetry<unknown>({
          model: SONNET,
          systemPrompt: SYSTEM_PROMPT_CURATION,
          userPrompt: curationUserPrompt,
          maxTokens: CURATION_MAX_TOKENS,
          temperature: SYNTHESIS_TEMPERATURE,
          timeoutMs: CURATION_TIMEOUT_MS,
          useJsonMode: true,
          cacheSystemPrompt: true,
        });
        const curationOutput = this.parseCurationOutput(curationResponse.content);
        return { curationResponse, curationOutput };
      })(),
      this.synthesizeSignatureMove(
        input.essayText,
        paragraphTexts,
        synthesis,
        metaOutput.readingStrategy,
      ),
    ]);

    let curationOutput: QuestionCurationOutput;
    let curationResponse: ClaudeResponse<unknown> | null = null;
    if (curationSettled.status === 'fulfilled') {
      curationOutput = curationSettled.value.curationOutput;
      curationResponse = curationSettled.value.curationResponse;
      console.log(
        `[HolisticSynthesis] Iteration ${input.iterationNumber} — Curation complete, ` +
        `${curationOutput.resolvedQuestions.length} resolved, ` +
        `${curationOutput.curatedQueue.length} curated, ` +
        `${curationOutput.filteredQuestions.length} filtered`,
      );
    } else {
      console.warn(
        `[HolisticSynthesis] Iteration ${input.iterationNumber} — Curation FAILED (non-fatal): ` +
          (curationSettled.reason instanceof Error
            ? curationSettled.reason.message
            : String(curationSettled.reason)),
      );
      curationOutput = { resolvedQuestions: [], curatedQueue: [], filteredQuestions: [] };
    }

    let signatureMove: SignatureMove | null = null;
    let signatureMoveCost = 0;
    let signatureMoveTokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    if (signatureMoveSettled.status === 'fulfilled') {
      signatureMove = signatureMoveSettled.value.signatureMove;
      signatureMoveCost = signatureMoveSettled.value.cost;
      signatureMoveTokenUsage = signatureMoveSettled.value.tokenUsage;
    } else {
      console.warn(
        `[HolisticSynthesis] Iteration ${input.iterationNumber} — SignatureMove FAILED (non-fatal, falling to null): ` +
          (signatureMoveSettled.reason instanceof Error
            ? signatureMoveSettled.reason.message
            : String(signatureMoveSettled.reason)),
      );
    }

    // Fold the validated SignatureMove into craftAssessment so the existing
    // HolisticMutator (which wholesale-replaces craftAssessment from
    // synthesis.craftAssessment) carries it through to the persisted profile
    // without any mutator-level code change.
    if (synthesis.craftAssessment) {
      synthesis.craftAssessment.signatureMove = signatureMove;
    }

    // ── Aggregate costs ──
    const costA = calculateCost(responseA.usage, SONNET);
    const costB = calculateCost(responseB.usage, SONNET);
    const costMeta = calculateCost(metaResponse.usage, SONNET);
    const costCuration = curationResponse ? calculateCost(curationResponse.usage, SONNET) : 0;
    const costSignatureMove = signatureMoveCost;
    const totalCost = costA + costB + costMeta + costCuration + costSignatureMove;
    const timingMs = Date.now() - startTime;

    const tokenUsage = {
      inputTokens: responseA.usage.input_tokens + responseB.usage.input_tokens +
        metaResponse.usage.input_tokens +
        (curationResponse?.usage.input_tokens ?? 0) +
        signatureMoveTokenUsage.inputTokens,
      outputTokens: responseA.usage.output_tokens + responseB.usage.output_tokens +
        metaResponse.usage.output_tokens +
        (curationResponse?.usage.output_tokens ?? 0) +
        signatureMoveTokenUsage.outputTokens,
      cacheReadTokens:
        (responseA.usage.cache_read_input_tokens ?? 0) +
        (responseB.usage.cache_read_input_tokens ?? 0) +
        (metaResponse.usage.cache_read_input_tokens ?? 0) +
        (curationResponse?.usage.cache_read_input_tokens ?? 0) +
        signatureMoveTokenUsage.cacheReadTokens,
      cacheWriteTokens:
        (responseA.usage.cache_creation_input_tokens ?? 0) +
        (responseB.usage.cache_creation_input_tokens ?? 0) +
        (metaResponse.usage.cache_creation_input_tokens ?? 0) +
        (curationResponse?.usage.cache_creation_input_tokens ?? 0) +
        signatureMoveTokenUsage.cacheWriteTokens,
    };

    console.log(
      `[HolisticSynthesis] Iteration ${input.iterationNumber} complete — ` +
      `$${totalCost.toFixed(4)} total (A=$${costA.toFixed(3)}, B=$${costB.toFixed(3)}, ` +
      `Meta=$${costMeta.toFixed(3)}, Curation=$${costCuration.toFixed(3)}, ` +
      `SigMove=$${costSignatureMove.toFixed(3)}), ` +
      `${timingMs}ms, signatureMove=${signatureMove === null ? 'null' : 'populated'}`,
    );

    // Wave-3a Phase 3C/3B: persist corpus telemetry (first-iteration only —
    // later iterations didn't retrieve, so no record to write).
    if (iterCorpusTel) {
      const record = buildCorpusTelemetryRecord({
        essayId: input.essayId ?? 'unknown',
        layer: 'L3.75-iter',
        telemetry: iterCorpusTel,
      });
      void persistCorpusTelemetry(record);
    }

    return {
      output: {
        synthesis,
        walkDisagreements: metaOutput.walkDisagreements,
        questionCuration: curationOutput,
        readingStrategy: metaOutput.readingStrategy,
        reReadCandidates: metaOutput.reReadCandidates,
        evolutionNarrative: metaOutput.evolutionNarrative,
        selfAssessedConvergence: metaOutput.selfAssessedConvergence,
      },
      cost: totalCost,
      tokenUsage,
      timingMs,
    };
  }

  // ── Iteration helper: build iteration context for iter > 0 ──

  private buildIterationContext(input: SynthesisIterationInput): string {
    if (!input.previousSynthesis) return '';

    const parts: string[] = ['\n\n=== PREVIOUS SYNTHESIS (Iteration ' + (input.iterationNumber - 1) + ') ===\n'];

    // Include a compact summary of the prior synthesis for stability guidance
    parts.push('The following synthesis was produced in the previous iteration.');
    parts.push('STABLE claims should not change without strong new evidence.');
    parts.push('REFINEMENT areas may evolve freely with new information.\n');

    // Include key claims from prior synthesis as stability anchors
    if (input.previousSynthesis.voiceIdentity?.signature) {
      parts.push(`Voice Identity: "${truncate(input.previousSynthesis.voiceIdentity.signature, 200)}"`);
    }
    if (input.previousSynthesis.thematicArchitecture?.centralThesis) {
      parts.push(`Central Thesis: "${truncate(input.previousSynthesis.thematicArchitecture.centralThesis, 200)}"`);
    }
    if (input.previousSynthesis.narrativeStrategy?.primaryStrategy) {
      parts.push(`Narrative Strategy: "${truncate(input.previousSynthesis.narrativeStrategy.primaryStrategy, 200)}"`);
    }
    if (input.previousSynthesis.characterRevelation?.writerPortrait) {
      parts.push(`Writer Portrait: "${truncate(input.previousSynthesis.characterRevelation.writerPortrait, 200)}"`);
    }

    // Include ALL new information since last iteration — never trim findings.
    // The LLM decides what's relevant for convergence judgment. (LLM-first Rule 2)
    const newFindings = input.cumulativeFindings.filter(
      f => f.source === 'deep_dive' || f.source === 'holistic_synthesis',
    );
    if (newFindings.length > 0) {
      parts.push('\n=== NEW INFORMATION SINCE LAST ITERATION ===\n');
      for (const finding of newFindings) {
        parts.push(`  [${finding.id}] ${finding.claim} (${finding.maturity}, ${finding.coachingValue})`);
        if (finding.evidence.length > 0) {
          parts.push(`    Evidence: "${truncate(finding.evidence[0].text, 100)}"`);
        }
      }
    }

    if (input.previousReadingStrategy) {
      parts.push('\n=== PREVIOUS READING STRATEGY ===\n');
      parts.push(`Strategy: ${input.previousReadingStrategy.strategy}`);
      parts.push(`Best approach: ${input.previousReadingStrategy.bestApproach}`);
    }

    return parts.join('\n');
  }

  // ── Meta prompt builder ──

  private buildMetaUserPrompt(
    input: SynthesisIterationInput,
    synthesis: HolisticSynthesisOutput,
    understandingContext: string,
  ): string {
    const parts: string[] = [];

    parts.push('=== ESSAY TEXT ===\n');
    parts.push(input.essayText);
    parts.push('\n\n=== CURRENT SYNTHESIS (just produced) ===\n');

    // Compact synthesis summary for meta assessment
    parts.push(`Voice Identity: ${truncate(synthesis.voiceIdentity?.signature ?? '', 300)}`);
    parts.push(`Central Thesis: ${truncate(synthesis.thematicArchitecture?.centralThesis ?? '', 300)}`);
    parts.push(`Narrative Strategy: ${truncate(synthesis.narrativeStrategy?.primaryStrategy ?? '', 300)}`);
    parts.push(`Character: ${truncate(synthesis.characterRevelation?.writerPortrait ?? '', 300)}`);
    parts.push(`Emotional Arc: ${truncate(synthesis.emotionalTopography?.arcTrajectory ?? '', 300)}`);
    parts.push(`Entanglements: ${synthesis.entanglements?.length ?? 0}`);
    parts.push(`Earned Moments: ${synthesis.momentEarnednessMap?.moments?.length ?? 0}`);

    parts.push('\n\n=== WALK PARAGRAPH READINGS ===\n');
    for (const para of input.profile.paragraphs) {
      if (para.understanding) {
        parts.push(`[P${para.index}] Role: ${para.understanding.role}`);
        parts.push(`  Function: ${para.understanding.function}`);
      }
    }

    if (input.activityLog.length > 0) {
      parts.push('\n\n');
      parts.push(formatActivityLogForPrompt(
        input.activityLog,
        input.budgetCeiling ?? 0.60,
        input.budgetRemaining ?? 0.60,
      ));
    }

    if (input.priorPhase) {
      parts.push(this.buildPhaseContext(input.priorPhase));
    }

    parts.push('\n\nProduce the meta-assessment JSON. Be specific to THIS essay.');

    return parts.join('\n');
  }

  // ── Curation prompt builder ──

  private buildCurationUserPrompt(
    input: SynthesisIterationInput,
    synthesis: HolisticSynthesisOutput,
    readingStrategy: ReadingStrategy,
  ): string {
    const parts: string[] = [];

    parts.push('=== CURRENT SYNTHESIS ===\n');
    parts.push(`Voice: ${truncate(synthesis.voiceIdentity?.signature ?? '', 200)}`);
    parts.push(`Theme: ${truncate(synthesis.thematicArchitecture?.centralThesis ?? '', 200)}`);
    parts.push(`Strategy: ${truncate(synthesis.narrativeStrategy?.primaryStrategy ?? '', 200)}`);

    parts.push('\n\n=== READING STRATEGY ===\n');
    parts.push(JSON.stringify(readingStrategy, null, 2));

    parts.push('\n\n=== QUESTIONS TO CURATE ===\n');
    for (const q of input.questionQueue) {
      parts.push(`[${q.id}] (${q.source}, ${q.status}) ${q.question}`);
      if (q.expectedInsight) {
        parts.push(`  Expected insight: ${q.expectedInsight}`);
      }
      if (q.dimensions.length > 0) {
        parts.push(`  Dimensions: ${q.dimensions.join(', ')}`);
      }
    }

    if (input.cumulativeFindings.length > 0) {
      parts.push('\n\n=== EXISTING FINDINGS ===\n');
      // Show ALL active findings — the LLM decides what's relevant for curation. (LLM-first Rule 2)
      const active = input.cumulativeFindings.filter(f => f.maturity !== 'superseded');
      for (const f of active) {
        parts.push(`[${f.id}] ${f.claim} (${f.maturity}, ${f.coachingValue})`);
      }
    }

    parts.push('\n\n=== AVAILABLE DEEP DIVE PROMPTS ===\n');
    parts.push('voice_authenticity, voice_register_analysis, emotion_earning_trace, emotion_arc_mapping, ');
    parts.push('theme_thread_tracing, theme_subtext_excavation, narrative_strategy_assessment, narrative_pivot_analysis, ');
    parts.push('character_values_mapping, character_growth_arc, craft_rhythm_analysis, craft_image_system, ');
    parts.push('admissions_positioning, admissions_distinctiveness, epistemological_framework, absence_detection, ');
    parts.push('coherence_validation, meta_awareness, cross_dimension_intersection');

    parts.push('\n\nCurate the queue. Resolve what you can answer, filter low-quality, curate for deep dives.');

    return parts.join('\n');
  }

  // ── Phase context builder ──

  private buildPhaseContext(phase: ImprovementPhase): string {
    const parts: string[] = ['\n\n=== PHASE CONTEXT ===\n'];
    parts.push(`Overall phase: ${phase.level} — ${phase.reasoning}`);
    if (phase.coachingLens) {
      parts.push(`Coaching lens: ${phase.coachingLens}`);
    }
    if (phase.dimensionPhases && phase.dimensionPhases.length > 0) {
      parts.push('Dimension phases:');
      for (const dp of phase.dimensionPhases) {
        parts.push(`  ${dp.dimension}: ${dp.level} — ${dp.reasoning}`);
      }
    }
    return parts.join('\n');
  }

  /**
   * Quality Gap 1 — Signature Move micro-call.
   *
   * Sonnet call mirroring the META + CURATION pattern. Receives the FINISHED
   * Phase A + Phase B synthesis plus the META reading strategy as input;
   * produces ONE SignatureMove (or null). Validated against essay paragraph
   * texts via referential-integrity check before being returned — never
   * fabricates on parse failure or substring drift; null is the honest
   * answer when craft is distributed rather than concentrated.
   *
   * Returns the validated candidate, the call's cost, the token usage, and
   * timing — caller's responsibility to fold this into the iteration result.
   */
  private async synthesizeSignatureMove(
    essayText: string,
    paragraphTexts: readonly string[],
    synthesis: HolisticSynthesisOutput,
    readingStrategy: ReadingStrategy,
  ): Promise<{
    signatureMove: SignatureMove | null;
    cost: number;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheWriteTokens: number;
    };
    timingMs: number;
  }> {
    const startTime = Date.now();

    const userPromptParts: string[] = [];
    userPromptParts.push('=== FULL ESSAY TEXT ===');
    userPromptParts.push(essayText);
    userPromptParts.push('');
    userPromptParts.push('=== HOLISTIC SYNTHESIS (Phase A + Phase B output, full) ===');
    userPromptParts.push(JSON.stringify(synthesis, null, 2));
    userPromptParts.push('');
    userPromptParts.push('=== META READING STRATEGY ===');
    userPromptParts.push(JSON.stringify(readingStrategy, null, 2));
    userPromptParts.push('');
    userPromptParts.push('Name THIS writer\'s ONE signature move, or return { "signatureMove": null }. Cite at least 3 instances. Quote text must be verbatim from the cited paragraph.');

    const userPrompt = userPromptParts.join('\n');

    const response = await callClaudeWithRetry<unknown>({
      model: SONNET,
      systemPrompt: SYSTEM_PROMPT_SIGNATURE_MOVE,
      userPrompt,
      maxTokens: SIGNATURE_MOVE_MAX_TOKENS,
      temperature: SYNTHESIS_TEMPERATURE,
      timeoutMs: SIGNATURE_MOVE_TIMEOUT_MS,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    const tokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };

    let signatureMove: SignatureMove | null = null;
    try {
      const parsed = parseLlmJsonOutput(response.content, 'L3.75 SignatureMove');
      const candidate = coerceSignatureMove(parsed.signatureMove);
      signatureMove = validateSignatureMoveAgainstParagraphs(candidate, paragraphTexts);
    } catch (error) {
      console.warn(
        `[HolisticSynthesis] SignatureMove parse failed (non-fatal, dropping to null): ` +
          (error instanceof Error ? error.message : String(error)),
      );
      signatureMove = null;
    }

    console.log(
      `[HolisticSynthesis] SignatureMove complete — ` +
        `${signatureMove === null ? 'null (no single defining move identified)' : `populated, ${signatureMove.instances.length} instances`}, ` +
        `${response.usage.output_tokens} output tokens, ` +
        `$${cost.toFixed(4)} cost, ` +
        `${timingMs}ms, stopReason: ${response.stopReason}`,
    );

    return { signatureMove, cost, tokenUsage, timingMs };
  }

  // ── Meta output parser ──

  private parseMetaOutput(raw: unknown): {
    walkDisagreements: SynthesisIterationOutput['walkDisagreements'];
    readingStrategy: ReadingStrategy;
    reReadCandidates: SynthesisIterationOutput['reReadCandidates'];
    evolutionNarrative: string;
    selfAssessedConvergence: SynthesisIterationOutput['selfAssessedConvergence'];
  } {
    const parsed = parseLlmJsonOutput(raw, 'L3.75 Meta');

    const walkDisagreements = ensureArray(parsed.walkDisagreements).map(
      (item: Record<string, unknown>) => {
        const validResolutions = ['synthesis_wins', 'flag_for_reread', 'preserve_both'] as const;
        const rawRes = String(item.resolution ?? 'preserve_both');
        return {
          paragraph: Number(item.paragraph ?? 0),
          walkReading: String(item.walkReading ?? ''),
          synthesisReading: String(item.synthesisReading ?? ''),
          confidence: clampNumber(Number(item.confidence ?? 0.5), 0, 1),
          resolution: (validResolutions.includes(rawRes as typeof validResolutions[number])
            ? rawRes : 'preserve_both') as typeof validResolutions[number],
          reasoning: String(item.reasoning ?? ''),
        };
      },
    );

    const rawStrategy = parsed.readingStrategy as Record<string, unknown> | undefined;
    const readingStrategy: ReadingStrategy = {
      strategy: String(rawStrategy?.strategy ?? ''),
      bestApproach: String(rawStrategy?.bestApproach ?? ''),
      antiPatterns: ensureStringArray(rawStrategy?.antiPatterns),
      contextPriorities: ensureStringArray(rawStrategy?.contextPriorities),
    };

    const reReadCandidates = ensureArray(parsed.reReadCandidates).map(
      (item: Record<string, unknown>) => ({
        paragraph: Number(item.paragraph ?? 0),
        reason: String(item.reason ?? ''),
        expectedDepthGain: (item.expectedDepthGain === 'significant' ? 'significant' : 'moderate') as 'significant' | 'moderate',
      }),
    );

    const rawConvergence = parsed.selfAssessedConvergence as Record<string, unknown> | undefined;
    const selfAssessedConvergence = {
      hasConverged: rawConvergence?.hasConverged === true,
      reasoning: String(rawConvergence?.reasoning ?? ''),
      remainingOpportunities: ensureStringArray(rawConvergence?.remainingOpportunities),
    };

    return {
      walkDisagreements,
      readingStrategy,
      reReadCandidates,
      evolutionNarrative: String(parsed.evolutionNarrative ?? ''),
      selfAssessedConvergence,
    };
  }

  // ── Curation output parser ──

  private parseCurationOutput(raw: unknown): QuestionCurationOutput {
    const parsed = parseLlmJsonOutput(raw, 'L3.75 Question Curation');

    const resolvedQuestions = ensureArray(parsed.resolvedQuestions).map(
      (item: Record<string, unknown>) => ({
        questionId: String(item.questionId ?? ''),
        answer: String(item.answer ?? ''),
        evidence: String(item.evidence ?? ''),
      }),
    ).filter(q => q.questionId.length > 0);

    const curatedQueue = ensureArray(parsed.curatedQueue).map(
      (item: Record<string, unknown>) => {
        const rawQ = item.question as Record<string, unknown> | undefined;
        const question: UnderstandingQuestion = {
          id: String(rawQ?.id ?? `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          question: String(rawQ?.question ?? ''),
          dimensions: ensureStringArray(rawQ?.dimensions),
          anchorParagraph: typeof rawQ?.anchorParagraph === 'number' ? rawQ.anchorParagraph : undefined,
          expectedInsight: String(rawQ?.expectedInsight ?? ''),
          source: (['walk', 'synthesis', 'deep_dive', 'coaching'].includes(String(rawQ?.source ?? ''))
            ? String(rawQ?.source) : 'synthesis') as UnderstandingQuestion['source'],
          status: 'open',
        };
        return {
          question,
          recommendedPrompt: String(item.recommendedPrompt ?? ''),
          promptRationale: String(item.promptRationale ?? ''),
        };
      },
    ).filter(cq => cq.question.question.length > 0 && cq.recommendedPrompt.length > 0);

    const filteredQuestions = ensureArray(parsed.filteredQuestions).map(
      (item: Record<string, unknown>) => ({
        questionId: String(item.questionId ?? ''),
        filterReason: String(item.filterReason ?? ''),
      }),
    ).filter(fq => fq.questionId.length > 0);

    return {
      resolvedQuestions,
      curatedQueue,
      filteredQuestions,
    };
  }

  /**
   * W5.3: Delta synthesis — re-synthesize ONLY targeted holistic sections.
   *
   * Much cheaper than full L3.75 (~$0.04-0.08 vs ~$0.15-0.30) because:
   * - Single Sonnet call (not two parallel phases)
   * - Only re-synthesizes 1-3 sections, not all 10
   * - Includes current holistic state as reference context
   *
   * Triggered by: blocking contradictions (W5.4a), coaching supersession (W5.4b),
   * or focused analysis ripple (W5.4c).
   *
   * @param request - Which sections to update and why
   * @param currentProfile - Current profile with existing holistic sections as reference
   * @returns DeltaSynthesisResult with partial holistic data for merge
   */
  async deltaSynthesize(
    request: DeltaSynthesisRequest,
    currentProfile: Readonly<EssayProfile>,
  ): Promise<DeltaSynthesisResult> {
    const startTime = Date.now();

    const sectionNames = request.targetSections.join(', ');
    console.log(
      `[HolisticSynthesis] Delta synthesis — ` +
      `trigger=${request.trigger}, ` +
      `sections=[${sectionNames}], ` +
      `evidence=${request.evidence.slice(0, 100)}...`,
    );

    // Build current holistic context for reference
    const currentHolisticContext = this.buildCurrentHolisticContext(currentProfile, request.targetSections);

    // Build understanding context (same helper as full synthesis)
    const understandingContext = buildUnderstandingContext(currentProfile as EssayProfile);

    const essayText = currentProfile.paragraphs.map((p, i) => `[P${i}] ${p.text}`).join('\n\n');

    const userPrompt = [
      '=== ESSAY TEXT ===\n',
      essayText,
      '\n\n',
      understandingContext,
      '\n\n=== CURRENT HOLISTIC STATE (for sections being updated) ===\n',
      currentHolisticContext,
      '\n\n=== DELTA SYNTHESIS REQUEST ===\n',
      `TRIGGER: ${request.trigger}\n`,
      `EVIDENCE: ${request.evidence}\n`,
      `TARGET SECTIONS: [${sectionNames}]\n`,
      '\nUpdate ONLY the sections listed above. Use the current holistic state as your starting point.',
      '\nIf the evidence does not actually warrant a change, set isSubstantive to false.',
    ].join('');

    const systemPrompt = this.buildDeltaSynthesisSystemPrompt(request.targetSections);

    let response: ClaudeResponse<unknown>;
    try {
      response = await callClaudeWithRetry<unknown>({
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: DELTA_SYNTHESIS_MAX_TOKENS,
        temperature: SYNTHESIS_TEMPERATURE,
        timeoutMs: DELTA_SYNTHESIS_TIMEOUT_MS,
        useJsonMode: true,
        cacheSystemPrompt: true,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[HolisticSynthesis] Delta synthesis Sonnet call failed: ${msg}`);
      throw error;
    }

    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    // Parse the response
    const parsed = parseLlmJsonOutput(response.content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('[HolisticSynthesis] Delta synthesis returned unparseable output');
    }

    const raw = parsed as Record<string, unknown>;

    // Extract output
    const output = this.parseDeltaSynthesisOutput(raw, request.targetSections);

    console.log(
      `[HolisticSynthesis] Delta synthesis complete — ` +
      `isSubstantive=${output.isSubstantive}, ` +
      `updatedSections=[${output.updatedSections.join(', ')}], ` +
      `changeLog=${output.changeLog.length} entries, ` +
      `cost=$${cost.toFixed(4)}, time=${timingMs}ms`,
    );

    return {
      output,
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

  // ── Delta synthesis helpers ──────────────────────────────────────────────

  /**
   * Build a JSON representation of the current holistic sections being updated.
   * Gives the LLM the existing state so it can make targeted changes.
   */
  private buildCurrentHolisticContext(
    profile: Readonly<EssayProfile>,
    targetSections: HolisticSectionType[],
  ): string {
    const sections: Record<string, unknown> = {};

    for (const section of targetSections) {
      switch (section) {
        case 'voice_identity':
          sections.voiceIdentity = profile.voiceIdentity;
          break;
        case 'voice_map':
          sections.voiceMap = profile.voiceMap;
          break;
        case 'emotional_topography':
          sections.emotionalTopography = profile.emotionalTopography;
          break;
        case 'moment_earnedness_map':
          sections.momentEarnednessMap = profile.momentEarnednessMap;
          break;
        case 'thematic_architecture':
          sections.thematicArchitecture = profile.thematicArchitecture;
          break;
        case 'narrative_strategy':
          sections.narrativeStrategy = profile.narrativeStrategy;
          break;
        case 'character_revelation':
          sections.characterRevelation = profile.characterRevelation;
          break;
        case 'craft_assessment':
          sections.craftAssessment = profile.craftAssessment;
          break;
        case 'cross_dimension_entanglements':
          sections.entanglements = profile.entanglements;
          break;
        case 'admissions_positioning':
          sections.admissionsPositioning = profile.admissionsPositioning;
          break;
      }
    }

    return JSON.stringify(sections, null, 2);
  }

  /**
   * Build the system prompt for delta synthesis.
   * Tells the LLM which sections to re-synthesize and the expected output format.
   */
  private buildDeltaSynthesisSystemPrompt(targetSections: HolisticSectionType[]): string {
    const sectionDescriptions: Record<HolisticSectionType, string> = {
      'voice_identity': 'voiceIdentity: { signature, authenticVsPerformed, distinctivePatterns, tonalRange }',
      'voice_map': 'voiceMap: { register, dimensions, shifts, stabilityRegions, codeSwitching, observations }',
      'emotional_topography': 'emotionalTopography: { arcTrajectory, peakMoments, undertones, emotionalAnchors }',
      'moment_earnedness_map': 'momentEarnednessMap: { moments (with earningMechanisms), overallEarnednessLevel }',
      'thematic_architecture': 'thematicArchitecture: { centralThesis, thesisConfidence, threads, subtext }',
      'narrative_strategy': 'narrativeStrategy: { primaryStrategy, strategyRationale, pivotPoints, pacingAnalysis, structuralChoices }',
      'character_revelation': 'characterRevelation: { writerPortrait, valuesRevealed, growthShown, vulnerabilityMoments }',
      'craft_assessment': 'craftAssessment: { strengthSignatures, growthEdges, imageSystem, syntaxPatterns }',
      'cross_dimension_entanglements': 'entanglements: [{ id, type, dimensions, location, description, implication }]',
      'admissions_positioning': 'admissionsPositioning: { tellabilitySummary, distinctivenessFactors, aoProjectedReaction, memorabilityPrediction }',
    };

    const targetDescriptions = targetSections
      .map(s => `  - ${sectionDescriptions[s]}`)
      .join('\n');

    return `You are an expert essay holistic synthesizer performing a TARGETED delta synthesis.

You have the full sentence-level understanding of an essay, the CURRENT holistic profile state,
and a specific trigger that requires updating specific sections.

IMPORTANT RULES:
1. Update ONLY the sections listed in the request. Do NOT modify other sections.
2. Use the current holistic state as your starting point — make targeted adjustments, not full rewrites.
3. If the evidence does not actually warrant a meaningful change, set isSubstantive to false.
4. Every change must be grounded in the essay text or understanding data provided.
5. The changeLog must explain WHAT changed and WHY for each section.

TARGET SECTIONS TO UPDATE:
${targetDescriptions}

OUTPUT FORMAT (JSON only, no prose):
{
  "isSubstantive": <boolean — true if any section actually changed meaningfully>,
  "changeLog": [
    { "section": "<HolisticSectionType>", "summary": "<what changed and why>" }
  ],
  "sections": {
    <only include the sections you are updating, using the profile field names>
  }
}

The "sections" object should use the profile field names (voiceIdentity, voiceMap, emotionalTopography,
momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment,
entanglements, admissionsPositioning) — matching the exact same schema as the current holistic state provided.`;
  }

  /**
   * Parse the raw LLM output into a DeltaSynthesisOutput.
   */
  private parseDeltaSynthesisOutput(
    raw: Record<string, unknown>,
    targetSections: HolisticSectionType[],
  ): DeltaSynthesisOutput {
    const isSubstantive = raw.isSubstantive === true;

    // Parse changeLog
    const rawChangeLog = Array.isArray(raw.changeLog) ? raw.changeLog : [];
    const changeLog: DeltaSynthesisOutput['changeLog'] = rawChangeLog
      .filter((entry: unknown): entry is Record<string, unknown> => entry !== null && typeof entry === 'object')
      .map((entry: Record<string, unknown>) => ({
        section: String(entry.section ?? '') as HolisticSectionType,
        summary: String(entry.summary ?? ''),
      }));

    // Parse sections into partialSynthesis
    const rawSections = (raw.sections && typeof raw.sections === 'object')
      ? raw.sections as Record<string, unknown>
      : {};

    const partialSynthesis: Partial<HolisticSynthesisOutput> = {};
    const updatedSections: HolisticSectionType[] = [];

    // Map section types to field names
    const sectionFieldMap: Record<HolisticSectionType, string> = {
      'voice_identity': 'voiceIdentity',
      'voice_map': 'voiceMap',
      'emotional_topography': 'emotionalTopography',
      'moment_earnedness_map': 'momentEarnednessMap',
      'thematic_architecture': 'thematicArchitecture',
      'narrative_strategy': 'narrativeStrategy',
      'character_revelation': 'characterRevelation',
      'craft_assessment': 'craftAssessment',
      'cross_dimension_entanglements': 'entanglements',
      'admissions_positioning': 'admissionsPositioning',
    };

    for (const section of targetSections) {
      const fieldName = sectionFieldMap[section];
      if (fieldName && rawSections[fieldName] && typeof rawSections[fieldName] === 'object') {
        // Trust the LLM output structure — it matches the profile schema.
        // The coordinator's applySectionLevelMerge will write it into the profile.
        (partialSynthesis as Record<string, unknown>)[fieldName] = rawSections[fieldName];
        updatedSections.push(section);
      }
    }

    return {
      updatedSections,
      changeLog,
      isSubstantive,
      partialSynthesis,
    };
  }
}

/** Singleton instance */
export const holisticSynthesisService = new HolisticSynthesisService();

// ============================================================================
// ESSAY UNDERSTANDING PROSE SYNTHESIS (Gap 1)
// ============================================================================

/** Max tokens for understanding prose synthesis */
const UNDERSTANDING_PROSE_MAX_TOKENS = 4000;
const UNDERSTANDING_PROSE_TIMEOUT_MS = 120_000;

/**
 * Input for understanding prose synthesis.
 */
export interface UnderstandingProseSynthesisInput {
  /** The full essay text */
  essayText: string;
  /** The profile with all 10 holistic sections populated */
  profile: EssayProfile;
  /** The reading strategy (from L3.75) */
  readingStrategy: ReadingStrategy;
  /** Top findings by coaching value */
  topFindings: Finding[];
  /** Previous understanding prose (null for first pass — produces replacement, not append) */
  previousUnderstanding: EssayUnderstanding | null;
}

/**
 * Result from understanding prose synthesis.
 */
export interface UnderstandingProseSynthesisResult {
  understanding: EssayUnderstanding;
  cost: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  timingMs: number;
}

/**
 * Synthesize the essay understanding prose — a single, coherent narrative
 * that reads like expert literary analysis.
 *
 * This is NOT a summary of the 10 holistic sections. It's the ARGUMENT the
 * system would make about this essay if asked "what do you see?"
 *
 * Called after each L3.75 synthesis iteration during the growth cycle.
 * One Sonnet call per invocation (~$0.02-0.04).
 */
export async function synthesizeUnderstandingProse(
  input: UnderstandingProseSynthesisInput,
): Promise<UnderstandingProseSynthesisResult> {
  const startTime = Date.now();

  // Build compact section summaries (first 2-3 sentences of each section's key prose)
  const sectionSummaries = buildCompactSectionSummaries(input.profile);

  // Build top findings context
  const findingsContext = input.topFindings.length > 0
    ? input.topFindings.slice(0, 10).map(f =>
      `- [${f.id}] (${f.maturity}/${f.coachingValue}): ${f.claim}`,
    ).join('\n')
    : '(No findings yet)';

  // Build previous understanding context
  const previousContext = input.previousUnderstanding && input.previousUnderstanding.prose
    ? `\n\n=== PREVIOUS UNDERSTANDING ===\n${input.previousUnderstanding.prose}\n\nCentral tension: ${input.previousUnderstanding.centralTension}\nConfirmed insights: ${input.previousUnderstanding.confirmedInsights.join('; ')}\nActive hypotheses: ${input.previousUnderstanding.activeHypotheses.join('; ')}\nMaturity: ${input.previousUnderstanding.maturity}\n\nIMPORTANT: What has CHANGED in your understanding since this previous version? The output should be a REPLACEMENT — a complete, current narrative that incorporates new insights. Not an append.`
    : '';

  const systemPrompt = `You are an expert literary analyst and admissions consultant synthesizing your understanding of a college essay.

You have access to 10 separate holistic analyses (voice, emotion, theme, narrative, character, craft, admissions, etc.), a reading strategy, and the essay's top findings. Your task: synthesize all of this into a SINGLE, COHERENT narrative that answers the question "What do you see in this essay?"

This is NOT a summary of the sections. It's your ARGUMENT — synthesized, opinionated, grounded in specific text. Think of it as what you would say if a colleague asked "Tell me about this essay."

=== UNDERSTANDING DEPTH HIERARCHY ===

Reach for the deepest available level:

Level 1 (Observational): "The essay describes a diamond appraisal experience."
Level 2 (Analytical): "The diamond becomes a metaphor for the writer's self-assessment."
Level 3 (Interpretive): "The essay's structure mirrors the appraisal process itself — examining facets one by one."
Level 4 (Epistemological): "The essay defines understanding as physical encounter — to know value is to hold it, weigh it, see it under light."
Level 5 (Meta-Awareness): "The essay's commitment to physical knowing creates an ironic tension with the college essay form itself."

Not every essay has a Level 5 insight. But when one does, you should see it.

=== OUTPUT FORMAT (JSON) ===
{
  "prose": "Your synthesized understanding of the essay as a coherent narrative (300-700 words depending on depth available). Rich prose, grounded in specific text. This should DISAGREE with individual sections if they contradict each other — you are the SYNTHESIS, not the concatenation.",
  "centralTension": "The essay's driving tension — what makes it move, whether the writer knows it or not. NOT the thesis.",
  "confirmedInsights": ["Things you are confident about", "..."],
  "activeHypotheses": ["Tentative readings that need more evidence", "..."],
  "maturity": "initial|developing|deep|comprehensive|exhaustive"
}

MATURITY LEVELS (you assess this — not a formula):
- initial: First walk only, surface-level understanding
- developing: Walk + some deep dives, patterns emerging
- deep: Multiple growth cycles, most questions answered, strong thesis
- comprehensive: Deep dives exhausted, coaching integrated, nuanced reading
- exhaustive: Student edits analyzed, re-analysis complete, full mental model`;

  const userPrompt = `=== ESSAY TEXT ===
${input.essayText}

=== READING STRATEGY ===
${input.readingStrategy.strategy}
Best approach: ${input.readingStrategy.bestApproach}

=== HOLISTIC SECTION SUMMARIES ===
${sectionSummaries}

=== TOP FINDINGS ===
${findingsContext}${previousContext}

Produce the understanding synthesis as JSON.`;

  const response: ClaudeResponse = await callClaudeWithRetry({
    model: SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: UNDERSTANDING_PROSE_MAX_TOKENS,
    temperature: 0.4,
    timeoutMs: UNDERSTANDING_PROSE_TIMEOUT_MS,
  });

  // response.content is a string here (ClaudeMessageInput path sets
  // useJsonMode=false). Previously this read `response.text` which does not
  // exist on ClaudeResponse, producing the recurring "Unexpected response
  // type: undefined" non-fatal log seen in checkpoint3 runs.
  const parsed = parseLlmJsonOutput(response.content) as {
    prose: string;
    centralTension: string;
    confirmedInsights: string[];
    activeHypotheses: string[];
    maturity: EssayUnderstanding['maturity'];
  };

  const timingMs = Date.now() - startTime;
  const cost = calculateCost(response.usage, SONNET);

  // Determine what changed for the growth log
  const trigger: EssayUnderstanding['growthLog'][0]['trigger'] = input.previousUnderstanding
    ? 'deep_dive'  // Iterative update
    : 'walk';      // First synthesis

  const whatChanged = input.previousUnderstanding
    ? `Understanding updated: maturity ${input.previousUnderstanding.maturity} → ${parsed.maturity}. ` +
      `Confirmed: ${parsed.confirmedInsights.length}, Hypotheses: ${parsed.activeHypotheses.length}`
    : `Initial understanding synthesized. Central tension: "${parsed.centralTension.substring(0, 100)}"`;

  const understanding: EssayUnderstanding = {
    prose: parsed.prose || '',
    centralTension: parsed.centralTension || '',
    confirmedInsights: parsed.confirmedInsights || [],
    activeHypotheses: parsed.activeHypotheses || [],
    maturity: parsed.maturity || 'initial',
    growthLog: [
      ...(input.previousUnderstanding?.growthLog ?? []),
      {
        timestamp: new Date().toISOString(),
        trigger,
        whatChanged,
      },
    ],
  };

  return {
    understanding,
    cost,
    tokenUsage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheReadTokens: (response.usage as Record<string, number>)?.cache_read_input_tokens ?? 0,
      cacheWriteTokens: (response.usage as Record<string, number>)?.cache_creation_input_tokens ?? 0,
    },
    timingMs,
  };
}

/**
 * Build compact section summaries for the understanding synthesis prompt.
 * Extracts the most important 2-3 sentences from each holistic section.
 */
function buildCompactSectionSummaries(profile: EssayProfile): string {
  const sections: string[] = [];

  if (profile.voiceIdentity?.signature) {
    sections.push(`VOICE: ${profile.voiceIdentity.signature}. ${profile.voiceIdentity.evolution || ''}`);
  }
  if (profile.emotionalTopography?.arcTrajectory) {
    sections.push(`EMOTION: ${profile.emotionalTopography.arcTrajectory}. Authenticity: ${profile.emotionalTopography.authenticityAssessment || 'not assessed'}`);
  }
  if (profile.thematicArchitecture?.centralThesis) {
    sections.push(`THEME: Central thesis: ${profile.thematicArchitecture.centralThesis} (confidence: ${profile.thematicArchitecture.thesisConfidence}). Subtext: ${profile.thematicArchitecture.subtext || 'none detected'}`);
  }
  if (profile.narrativeStrategy?.primaryStrategy) {
    sections.push(`NARRATIVE: ${profile.narrativeStrategy.primaryStrategy}. Arc: ${profile.narrativeStrategy.arcType || 'not classified'}, momentum: ${profile.narrativeStrategy.arcMomentum || 'unknown'}`);
  }
  if (profile.characterRevelation?.writerPortrait) {
    sections.push(`CHARACTER: ${profile.characterRevelation.writerPortrait}. Growth: ${profile.characterRevelation.growthArc || 'not detected'}`);
  }
  if (profile.craftAssessment?.imageSystem) {
    sections.push(`CRAFT: Image system: ${profile.craftAssessment.imageSystem}. Patterns: ${profile.craftAssessment.sentencePatterns || 'not analyzed'}`);
  }
  if (profile.admissionsPositioning?.tellabilitySummary) {
    sections.push(`ADMISSIONS: ${profile.admissionsPositioning.tellabilitySummary}. Memorability: ${profile.admissionsPositioning.memorability || 'not assessed'}`);
  }
  if (profile.momentEarnednessMap?.structuralObservation) {
    sections.push(`EARNEDNESS: ${profile.momentEarnednessMap.structuralObservation}`);
  }
  if (profile.entanglements?.length) {
    const topEntanglements = profile.entanglements
      .filter(e => e.significance === 'foundational')
      .slice(0, 3)
      .map(e => e.description)
      .join('; ');
    if (topEntanglements) {
      sections.push(`ENTANGLEMENTS: ${topEntanglements}`);
    }
  }

  return sections.join('\n\n') || '(No holistic sections populated yet)';
}
