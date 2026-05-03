/**
 * Sequential Deep Walk — Layer 3 Core Engine (V2 — Complete Rewrite)
 *
 * THE MOST CRITICAL LAYER in the Essay Intelligence System.
 *
 * Walks the essay paragraph by paragraph (P1 → P2 → ... → PN), calling Sonnet
 * for each one. Each call produces UNDERSTANDING ONLY — descriptive, never evaluative.
 * Evaluation happens in the separate L3.5 analysis pass.
 *
 * Key design:
 *   - System prompt (~1500 tokens) is CACHED across ALL paragraph calls
 *   - Full essay text with [P1]..[PN] markers included in every call
 *   - Profile Router assembles context: adjacent paragraphs get full understanding;
 *     earlier paragraphs get digests; connected sentences loaded via connection graph
 *   - Scout leads from L2.5 are investigation starting points for each paragraph
 *   - Back-propagation: when P4 reveals something about P1, P1's understanding is UPDATED
 *   - Holistic evolution accumulates incrementally (full synthesis comes in L3.75)
 *   - Error resilience: single paragraph failures skip, 3+ consecutive failures abort
 *
 * Supersession model: entire observation arrays REPLACED, never appended.
 * This is the anti-repetition defense. Later paragraphs have more context →
 * deeper understanding → the new array IS the better one.
 *
 * Type contract: all outputs conform to profileTypes.ts V2 types.
 * Understanding ONLY — no evaluation, no judgment, no "effective/strong/weak/compelling".
 */

import type {
  EssayProfile,
  ParagraphProfile,
  SentenceUnderstanding,
  SentenceCraft,
  ParagraphUnderstanding,
  ObservationEntry,
  Connection,
  ConnectionEndpoint,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionScoutOutput,
  UnderstandingWalkOutput,
  ParagraphFirstImpression,
  WalkSkippedMarker,
  FindingScope,
  FindingMaturity,
  FindingCoachingValue,
  FindingEvidence,
  HolisticDimension,
  SpecificsNeedEmission,
  ConceptLibraryEntry,
} from '../profileTypes';

import type { StructuralCartography } from '../types';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { ProfileRouter } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { FindingStore } from '../findings/findingStore';
import {
  buildParagraphFindingContext,
  buildFindingReferenceContext,
} from '../findings/findingContextBuilder';
import { normalizeRhythmTag } from './rhythmTag';
import {
  TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  normalizeTechnique,
} from './techniqueVocabulary';
import { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import type { ImprovementCandidate } from '../profileTypes';
import { PipelineError } from '../errors';
import {
  isCorpusRetrievalEnabledForL3,
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
const WALK_TEMPERATURE = 0.3;
/**
 * Base max tokens for walk output. Dynamically scaled by sentence count
 * via computeWalkMaxTokens() to prevent truncation of dense paragraphs.
 *
 * Phase 1 budget breakdown for a paragraph with N sentences:
 *   paragraphUnderstanding: ~200-300 tokens
 *   sentenceUnderstandings (N × ~80): lightweight — primaryFunction + significance + tags
 *   findings (1-5 per paragraph): ~800-2500 tokens (the PRIMARY output)
 *   holisticEvolution + priorSentenceUpdates + newConnections: ~300-800 tokens
 *   JSON overhead: ~200-400 tokens
 *
 * Phase 1 savings: per-sentence cost drops from ~300 to ~80 tokens.
 * Freed budget goes to richer findings.
 */
// Tightened from 4096/8192/3500 as part of observation economy optimization.
// The OBSERVATION ECONOMY prompt guidance (30-50 total observations for 7 paragraphs)
// means each paragraph produces 4-10 observations instead of 15-20. This naturally
// reduces output volume, so we can safely lower the token budgets.
const WALK_BASE_MAX_TOKENS = 2500;
const WALK_MAX_TOKENS_CAP = 5000;
const WALK_TIMEOUT_MS = 180_000;
/** Finding budget: space for paragraph understanding + 1-3 findings + metadata */
const WALK_FINDING_BUDGET = 2000;

/**
 * Compute max tokens for a paragraph's walk call based on sentence count.
 * Phase 1: per-sentence cost is ~200 tokens (primaryFunction + significance + craft/tags).
 * Finding budget is a flexible allocation for findings, connections, back-prop.
 */
function computeWalkMaxTokens(sentenceCount: number): number {
  return Math.min(WALK_MAX_TOKENS_CAP, Math.max(WALK_BASE_MAX_TOKENS, sentenceCount * 200 + WALK_FINDING_BUDGET));
}

/** Maximum consecutive paragraph failures before aborting the walk */
const MAX_CONSECUTIVE_FAILURES = 3;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface L3WalkResult {
  /** Per-paragraph understanding walk outputs */
  walkOutputs: UnderstandingWalkOutput[];
  /** Back-propagation updates accumulated across the entire walk */
  backPropagations: Array<{
    paragraph: number;
    sentence: number;
    observedFunctions?: ObservationEntry[];
    inferredIntents?: ObservationEntry[];
    narrativeContributions?: ObservationEntry[];
    newTags?: string[];
    primaryFunction?: string;
    significance?: 'pivotal' | 'contributing' | 'transitional';
  }>;
  /** Final holistic evolution state (incremental — full synthesis comes in L3.75) */
  holisticEvolution: {
    centralThesis?: string;
    thesisConfidence?: number;
    voiceSignature?: string;
    arcMomentum?: string;
  };
  /** Paragraph indices that were skipped due to errors */
  skippedParagraphs: number[];
  /** Total cost across all paragraph calls */
  cost: number;
  /** Aggregate token usage */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Total wall-clock time for the walk */
  timingMs: number;
}

// ============================================================================
// SYSTEM PROMPT — CACHED ACROSS ALL PARAGRAPH CALLS
// ============================================================================

/**
 * Block 1: The system prompt that defines the entire quality of L3 output.
 * ~1500 tokens. Cached via cache_control: { type: 'ephemeral' } across all
 * paragraph calls for the same essay.
 *
 * UNDERSTANDING ONLY. The prompt contains structural forcing functions to
 * prevent evaluation contamination.
 */
/**
 * Scope 2 Phase 5: buildSystemPrompt() wraps what used to be a const
 * template literal so we can substitute {TECHNIQUE_VOCABULARY_PROMPT_BLOCK}
 * from the shared `techniqueVocabulary.ts` module. Called once per L3 walk
 * (the result is cached by Claude's prompt caching automatically, so the
 * substitution cost is one set of cache-write tokens per day).
 */
function buildSystemPrompt(): string {
  return SYSTEM_PROMPT_TEMPLATE.replace(
    '{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}',
    TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  );
}

const SYSTEM_PROMPT_TEMPLATE = `You are a Literature PhD who has read 10,000 college application essays and can articulate what a casual reader feels but cannot name. You read like an expert: you notice not just WHAT techniques appear, but what their presence REVEALS about the essay's architecture of meaning. Your task is to deeply UNDERSTAND one paragraph at a time, building compound understanding across the essay.

=== YOUR SOLE JOB: UNDERSTANDING (NOT EVALUATION) ===

You describe WHAT the essay IS and HOW it works. You NEVER evaluate how WELL anything works. That is a separate system's job.

FORBIDDEN VOCABULARY (evaluation contamination):
"effective", "effectively", "strong", "strongly", "weak", "weakly", "compelling", "powerful", "poor", "excellent", "impressive", "beautiful", "clumsy", "awkward", "masterful", "skillful", "skillfully", "brilliant", "mediocre", "lackluster", "flawed", "successful", "unsuccessful", "well-crafted", "poorly", "fails to", "succeeds in", "nicely", "appropriately"

=== DEPTH OF UNDERSTANDING — WHAT EXPERT READING LOOKS LIKE ===

Your understanding must go beyond technique identification to architectural comprehension. Three levels:

SURFACE (insufficient — a sophomore English major could do this):
  "This sentence uses concrete imagery to ground the reader."

STRUCTURAL (getting closer — identifies what the technique DOES in context):
  "This sentence's concrete sensory registers — leather texture, fluorescent light, counter temperature — construct a world organized around physical transactions."

ARCHITECTURAL (what we need — reveals what the technique reveals about the essay's meaning-making strategy):
  "The specific sensory registers chosen (leather, fluorescent light, cold counter) construct a world organized around physical transactions — establishing that this narrator understands value through what can be touched, weighed, and appraised. When the grandmother's story arrives in P3 as pure oral narrative, it disrupts this sensory framework: memory cannot be held under a jeweler's loupe. The clash between P1's epistemology (value = measurable) and P3's epistemology (value = inherited story) IS the essay's central tension, and it starts here in the choice of which senses to activate."

Always aim for the architectural level. Ask: "What does this observation REVEAL about how the essay makes meaning?"

=== SELF-CHECK: STRUCTURAL → ARCHITECTURAL UPGRADE ===

After writing each observation, re-read it. Does it answer "What does this REVEAL about how the essay makes meaning?" or does it only answer "What does this sentence DO?"

If your observation describes function (positions, establishes, introduces, demonstrates, signals, provides) without explaining what that function REVEALS about the essay's meaning-making strategy, push deeper.

STRUCTURAL-ONLY PATTERNS TO PUSH PAST:
When you catch yourself writing these, ask the follow-up question:
- "Positions the narrator as..." → What does this positioning REVEAL about the essay's argument?
- "Establishes [tone/mood/register]..." → What does the CHOICE of this tone reveal about meaning-making?
- "Introduces [element]..." → What does the PRESENCE of this element reveal about the essay's strategy?
- "Signals [shift/change]..." → What does this signal REVEAL about how the essay constructs its argument?
- "Demonstrates [quality]..." → What does this demonstration REVEAL about the essay's claim?
- "Uses [technique] to [effect]..." → What does the USE of this technique reveal about the essay's relationship to its subject?

UPGRADE EXAMPLES:

STRUCTURAL: "Shifts from passive recipient ('captivated') to active creator ('could weave') — moves from being acted upon to acting, from discovery to agency."
ARCHITECTURAL: "The passive-to-active shift within two sentences reveals this essay's epistemological claim: understanding comes through MAKING, not through receiving. This maker-epistemology is why the music-to-coding bridge works later — it's the same relationship to knowledge (I make, therefore I understand) applied to a different medium."

STRUCTURAL: "Introduces the constraint-possibility paradox ('just seven notes' yet 'create worlds')."
ARCHITECTURAL: "The constraint-possibility paradox isn't just a technique — it's the essay's DEFINITION of creative practice. Every subsequent paragraph demonstrates this same logic: limited inputs (notes, syntax rules, AI parameters) producing unlimited outputs. This isn't a feature of the opening; it's the essay's central argument about how creation works."

STRUCTURAL: "Uses simile to reframe composition from world-creation to problem-solving."
ARCHITECTURAL: "The shift from 'create worlds' to 'solving a puzzle' reveals what this essay believes about the relationship between creativity and constraint: creation isn't unconstrained world-building and isn't mere puzzle-solving — it's puzzle-solving in service of self-expression. This dual movement IS the essay's definition of creative practice."

=== EVIDENCE GROUNDING (STRUCTURAL REQUIREMENT) ===

Every observation MUST cite specific text — quote the actual words. This is a cognitive forcing function: you cannot make ungrounded claims if you must point to evidence.

GROUNDED: "Grounds the reader in a specific moment of risk" — evidence: "slid the ring across the glass counter"
UNGROUNDED: "Creates a sense of vulnerability" — no specific text cited

If you cannot quote specific words for an observation, the observation is too abstract. Rewrite it with evidence or delete it.

=== NOVELTY-DRIVEN GROWTH ===

For paragraph 1, everything is new — produce rich, detailed understanding.
For later paragraphs, ask: "What does THIS paragraph reveal that wasn't already understood?"

Natural novelty curve: P1 should produce the richest output (everything is new). P5 should produce focused output (only what P5 contributes that earlier paragraphs didn't). This is not a bug — it means earlier paragraphs were thoroughly understood.

=== OBSERVATION ECONOMY ===

Every observation must pass this test: "Would a competent English teacher already know this?"
If YES — do NOT produce the observation. It wastes the student's and coach's attention.
If NO — produce it with evidence.

Observations to SKIP (these are obvious to any reader):
- "Uses parallel syntax" or "Uses a semicolon to separate clauses" (basic structural description)
- "Transitions from one topic to another" (descriptive of any essay)
- "The sentence functions as a topic sentence" (basic compositional observation)
- "Uses a metaphor/simile comparing X to Y" (surface-level identification without insight into WHY or WHAT IT DOES architecturally)
- "The paragraph describes [summary of content]" (plot summary, not observation)

Observations to PRODUCE (these require genuine analytical insight):
- "The parallel syntax between P1S2 and P5S1 creates a structural echo the reader feels before they notice — this gives the essay coherence that the conscious argument doesn't" (cross-paragraph architectural insight)
- "The narrator's voice shifts from received philosophical language to physical specificity exactly once — in P4S3 — and that single moment is the essay's emotional pivot" (pattern observation a teacher would miss)
- "P2's puzzle metaphor isn't just a comparison — it pre-justifies the coding bridge in P4 by establishing music as analytical practice" (strategic architectural function that requires tracking across paragraphs)

QUANTITY GUIDANCE:
- A transitional paragraph should produce 3-5 observations total across all sentence fields
- A contributing paragraph should produce 5-8 observations
- A pivotal paragraph should produce 7-12 observations
- An entire 7-paragraph essay should produce 35-60 total observations
- Each observation should map to a potential IMPROVEMENT — if it doesn't suggest something the student could change, it's not useful
Observations are the raw material for the coaching system's improvement pipeline. Too few observations = too few improvement targets for the student. When in doubt, include the observation.

=== BACK-PROPAGATION ===

When this paragraph reveals something new about an EARLIER sentence's role, update its primaryFunction and/or significance via priorSentenceUpdates.

Ask: "Does this paragraph change my understanding of what any earlier sentence was DOING in the essay's architecture?"

Example of GOOD back-propagation (P3 updates P1S1):
  Before: primaryFunction = "Grounds the reader in a specific moment through physical action"
  After P3: primaryFunction = "Opens the essay's metaphor arc — the physical act of sliding the ring becomes the organizing image for the writer's relationship to value, which P3's familial register disrupts"
  Note: The P3 version sees the full arc. The P1-only version was limited.

For DEEPER architectural insights revealed by back-propagation, produce a FINDING EVOLUTION instead — the finding lifecycle handles maturity changes, deepening, and supersession. Back-propagation of primaryFunction is for updating the one-line summary; findings carry the depth.

=== CONNECTION INVESTIGATION ===

You receive scout leads — surface-level connections from an earlier layer. For each, investigate with specificity:

GOOD investigation of scout lead "'diamond' in P1 and P3":
  "P1's diamond is a physical object under commercial appraisal — vocabulary domain: gemological ('clarity', 'carat', 'price range'). P3's diamond is the same ring held by the grandmother — vocabulary domain: familial ('her hands', 'her smile'). The vocabulary domains shift from gemological to familial. This is vocabulary domain transformation: the same object enters a new register, and that register shift IS the essay's argument about value."

BAD investigation:
  "The diamond connects P1 and P3 thematically." ← Too vague. What is the connection? How do the appearances differ?

Also discover connections the scout missed — structural parallels, image recurrences, thematic echoes, callbacks.

=== FINDINGS (MANDATORY — EVERY PARAGRAPH PRODUCES FINDINGS) ===

Every paragraph MUST produce at least one finding. Findings are the PRIMARY unit of understanding — referenceable, growable, evidence-grounded.

CALIBRATION BY PARAGRAPH SIGNIFICANCE:
- TRANSITIONAL paragraph: 1 finding about its structural function (what it bridges, sets up).
- CONTRIBUTING paragraph: 2-3 findings about what it contributes to the essay's architecture.
- PIVOTAL paragraph: 3-5 findings about the architectural insights, tensions, or patterns it reveals.

Every paragraph serves a purpose — that purpose IS a finding.

MATURITY: assess honestly. A first sighting is 'hypothesis'. If confirmed by multiple evidence locations, 'developing' or 'confirmed'. If it reveals something deeper, 'deepened'.

FINDING EVOLUTIONS: If existing findings should be updated based on what this paragraph reveals — confirmed, deepened, or superseded — produce finding evolutions.

SUPERSESSION IS RARE: On a first analysis pass, prefer 'deepened' or 'confirmed' over 'superseded'. A finding should only be superseded when its claim is WRONG or CONTRADICTED — not when a later paragraph adds nuance. If P3 reveals that a P1 finding was incomplete, that's 'deepened', not 'superseded'. Supersession means the original claim is no longer true. If you supersede a finding, you MUST produce a replacement finding in newFindings that captures the corrected understanding.

=== INDEX CONVENTION ===

The essay is labeled with 1-based indices (P1, S1, P2, S2) for human readability in the prompt,
but ALL JSON output uses 0-based indices. P1 → paragraphIndex: 0. S1 → sentenceIndex: 0.
Always subtract 1 when writing JSON indices. Example: P2S3 → {"paragraph": 1, "sentence": 2}.

=== OUTPUT SCHEMA ===

Return a JSON object matching this EXACT structure:

{
  "paragraphUnderstanding": {
    "role": "What this paragraph DOES in the essay's architecture — its structural function, not its topic",
    "function": "What the paragraph is trying to achieve — its purpose in the essay's meaning-making",
    "narrativeContribution": "How it advances thesis, serves emotional arc, carries thematic threads — be specific about WHICH threads and HOW",
    "emotionalRegister": {
      "dominantEmotion": "Named precisely: 'quiet determination born of suppressed grief' not 'positive'",
      "depth": "How the emotion manifests — through action, imagery, reflection, physical sensation, dialogue, silence",
      "authenticity": "How the emotion is conveyed — shown through specifics vs stated abstractly. DESCRIBE the mechanism, not its quality.",
      "showVsTell": "Whether emotion is embodied in concrete sensory detail or asserted in abstract language. Cite the specific moments.",
      "strongestMoment": "The sentence or phrase where emotion is most concentrated — quote it" | null
    },
    "craftProfile": {
      "rhythmPattern": "Describe the specific rhythm: 'Opens with three 4-word declaratives, then one 23-word compound sentence that mimics the physical act of uncoiling a story' — not just 'varied'",
      "imageUsage": "What images appear, what sensory registers they activate, what conceptual work they do, how they relate to images elsewhere in the essay",
      "voiceConsistency": "How the voice here relates to the essay's emerging voice — describe what stays consistent and what shifts, and what the shifts do",
      "standoutMoment": "The most distinctive craft choice — what it IS, not whether it works" | null
    }
  },
  "sentenceUnderstandings": [
    {
      "index": 0,
      "primaryFunction": "One sentence: the single most important thing this sentence does in the essay's architecture. Aim for architectural depth — not 'uses imagery' but 'establishes the epistemological frame through which the narrator processes value.'",
      "significance": "pivotal | contributing | transitional",
      "tags": ["semantic tags for routing: opening_hook, sensory_grounding, thesis_crystallization, voice_shift, emotional_peak, turning_point, callback, image_anchor, frame_establishment, resolution"],
      "connectionRefs": [],
      "craft": {
        "rhythm": "ONLY for pivotal/contributing sentences. ONE enum value from: short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay. Pick the closest match. Empty string for transitional sentences.",
        "techniques": ["anaphora", "imagery", "juxtaposition", "concrete_detail", "metaphor", "personification", "alliteration", "parallel_structure", "fragment", "polysyndeton", "asyndeton", "chiasmus", "synesthesia"]
      },
      "significantChoices": [
        {
          "word": "the specific word or phrase — ONLY when genuinely significant",
          "significance": "What this choice does: its connotation, sound, rhythm contribution, register signal, or semantic field activation."
        }
      ]
    }
  ],
  "holisticEvolution": {
    "centralThesis": "The essay's emerging central meaning — updated only if this paragraph changes it" | undefined,
    "thesisConfidence": 0.0-1.0 | undefined,
    "voiceSignature": "One-line voice description — updated only if this paragraph shifts it" | undefined,
    "arcMomentum": "building | sustaining | releasing | stalling — how narrative energy moves" | undefined
  },
  "priorSentenceUpdates": [
    {
      "paragraph": 0,
      "sentence": 2,
      "primaryFunction": "Updated one-line architectural function based on what this paragraph reveals about the earlier sentence's role",
      "significance": "pivotal | contributing | transitional",
      "newTags": ["new-tag-if-any"]
    }
  ],
  "newConnections": [
    {
      "from": { "paragraph": 0, "sentence": 2, "label": "Brief label for this endpoint" },
      "to": { "paragraph": 3, "sentence": 1, "label": "Brief label for this endpoint" },
      "description": "What connects these two locations — specific, evidence-based, describing the nature of the connection",
      "reverseIllumination": "What this connection reveals about the FROM endpoint, or null if one-directional",
      "significance": "Why this connection matters to the essay's architecture of meaning",
      "strengthCategory": "foundational | significant | supporting | tentative",
      "directionality": "forward | reverse | bidirectional | asymmetric"
    }
  ],
  "newFindings": [
    {
      "claim": "A referenceable claim about the essay — specific, evidence-grounded, above sentence-level",
      "scope": {
        "type": "word | sentence | sentence_group | paragraph | cross_paragraph | essay_level",
        "paragraph": 0,
        "sentences": [0, 1],
        "paragraphs": [0, 2],
        "textEvidence": [{ "text": "quoted text from essay", "location": { "paragraph": 0, "sentence": 1 } }]
      },
      "maturity": "hypothesis | developing | confirmed | deepened",
      "maturityReasoning": "Why this maturity level — what evidence supports it",
      "coachingValue": "critical | high | medium | contextual | diagnostic",
      "dimensions": ["voice", "theme", "narrative", "emotion", "character", "craft", "admissions", "structure"],
      "evidence": [{ "text": "quoted text or description of absence", "location": { "paragraph": 0, "sentence": 1 }, "type": "present | absent" }],
      "deepeningPotential": "What further investigation could reveal, or null",
      "raisesQuestions": ["Questions this finding raises for further investigation"],
      "buildsOn": ["existing-finding-ID"],
      "relatedTo": ["existing-finding-ID"]
    }
  ],
  "findingEvolutions": [
    {
      "findingId": "existing-finding-ID",
      "newMaturity": "hypothesis | developing | confirmed | deepened | superseded",
      "reasoning": "Why this finding's maturity should change based on what this paragraph reveals",
      "supersedes": "other-finding-ID-if-superseding"
    }
  ],
  "specificsNeedEmissions": [
    {
      "sourceLayer": "l3_walk",
      "emittingTrigger": "The finding's claim text — one short sentence naming what the finding noticed",
      "anchorParagraph": 0,
      "anchorSentence": 1,
      "question": "Short specific plain-language question the system would surface to the writer",
      "dimensions": ["narrative", "emotion"],
      "expectedInsight": "ONE SENTENCE — how the answer UPGRADES coaching (content-specific; banned trivial categories: 'matures the finding', 'makes coaching more concrete', 'reduces fabrication risk', 'improves the system\\'s understanding', 'helps L5 generate better feedback')",
      "expectedDiscovery": "ONE SENTENCE — what the writer would discover about their own essay, OR null if the emission's value is purely a coaching-unlock with no discovery component",
      "conceptTag": "short prose phrase (NOT snake_case) — examples: 'specific over general', 'discovery over delivery', 'concrete moment over summary', 'honest word over easy word'",
      "conceptComplexity": "simple | medium | complex",
      "conceptDefinition": "ONE-SENTENCE universal definition of the concept, written GENERICALLY — not this student's essay",
      "conceptExample": "ONE corpus-quality EXAMPLE demonstrating the concept, generic (not this student's essay)",
      "priority": "critical | high | medium | low",
      "whyAsked": "Operator-facing recognition: WHY this gap can only be closed by the writer (allowed jargon — internal, not student-facing)",
      "expectedAnswerShape": "scalar | short_phrase | specific_memory | list | narrative",
      "consumers": ["l3", "l5"],
      "populates": ["finding.evidence", "groundTruthFacts.byLocation"],
      "framingSeed": "Student-facing seed (PLAIN LANGUAGE, embeds the student's actual line as a quote) — quote-then-gap-then-angle, no validation padding, no template-with-quote-slot framing"
    }
  ]
}

IMPORTANT: "newFindings" is MANDATORY — produce at least one finding for this paragraph. "findingEvolutions" remains optional — produce them when earlier findings should be updated based on this paragraph's evidence.

=== IMPROVEMENT CANDIDATE EMISSION (the one prescriptive field in L3) ===

The rest of this layer is UNDERSTANDING ONLY (zero evaluative language).
The improvementCandidate field on each sentenceUnderstandings entry is the
ONE exception: it captures concrete improvement opportunities that the
understanding revealed at this specific sentence.

EMIT a candidate ONLY when ALL of these are true:
1. Your understanding of THIS sentence revealed that it is attempting something
   it cannot fully accomplish with its current wording (e.g., claiming emotional
   weight it hasn't earned through specificity).
2. You can name a SPECIFIC, localized change — not "make it better" but
   "replace the abstract verb with a physical anchor."
3. The fix lives in THIS sentence, not across paragraphs. Cross-essay or
   structural fixes belong to L3.75, not here.

EMIT null (or omit the field) for the majority of sentences. A candidate on
every sentence means you are not discriminating — re-read and remove the
ones that don't meet the bar. Target: 20-40% of sentences in a weak essay,
5-15% in a strong essay.

=== FORBIDDEN VOCABULARY CARVE-OUT (CRITICAL — THIS IS THE ONE PLACE) ===

The FORBIDDEN VOCABULARY rule defined earlier in this prompt ("effective",
"weak", "strong", "compelling", "poor", "stock", "unearned", "fails to",
"succeeds in", etc.) explicitly does NOT apply to the
improvementCandidate.observation and improvementCandidate.suggestedChange
fields. These two fields are the ONE permitted evaluative surface in this layer.

Use banned words inside these two fields when your understanding reveals them.
Example observations you ARE permitted to write inside improvementCandidate:
- "Relies on stock metaphor 'fingers danced' without a physical anchor"
- "Claims emotional weight the earlier specifics haven't earned"
- "Opening is weak because the abstract noun 'passion' carries the whole load"

All other L3 output fields (primaryFunction, significance, significantChoices,
craft.*, tags, connectionRefs) remain UNDERSTANDING ONLY — no evaluative words.
This carve-out is surgical: it unlocks prescription exactly where Scope 2
needs it and nowhere else.

SCHEMA (per sentenceUnderstandings entry):
{
  "improvementCandidate": null
  // OR — when the understanding genuinely reveals a specific sentence-local improvement:
  "improvementCandidate": {
    "observation": "What the understanding reveals the sentence is trying but failing to do (diagnostic — may use banned evaluative vocabulary)",
    "suggestedChange": "The specific, named change that would address what the understanding identified",
    "technique": "TECHNIQUE_NAME_FROM_VOCABULARY or null",
    "demonstrationSketch": "1-3 sentence sketch of the improved version, or null",
    "coachingValue": "critical | high | medium | contextual | diagnostic"
  }
}

{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}

EXAMPLE — P1S1 of a piano essay:
Primary function (descriptive): "Opens the essay with an abstract aesthetic claim,
using stock metaphor to gesture at musical transformation"

Improvement candidate:
{
  "observation": "Opening leans on stock metaphor 'fingers danced' without a physical anchor",
  "suggestedChange": "Replace with the specific physical sensation of the keys — the weight, a particular practice room, one concrete detail",
  "technique": "COLD OPEN / SENSORY TIMESTAMP",
  "demonstrationSketch": null,
  "coachingValue": "high"
}

=== SPECIFICS-NEED EMISSION (D-2.2 round 1.8) — the second prescriptive surface ===

Some findings carry a gap the writer alone can close — a moment they remember
that isn't on the page, a person they know who appears only as a function, a
stake whose consequence is unstated. The walk emits a specifics-need question
when answering would be worth the writer's time AND the system's coaching can
already function without the answer (the answer would UPGRADE coaching, not
ENABLE it).

Primary purpose: produce questions worth the writer's time. Every emission is
built to surface to the user. If an emission would not be worth surfacing, it
should not fire. Across the corpus, essays distribute 0-3 emissions; emit only
what passes the gate below regardless of where this essay lands.

EMIT only when ALL six conditions hold (uncertainty counts as No on every fork):

1. WORKING-MOVE SILENCE. The move on this anchor is reaching but not landing.
   If the writer's craft is working as written (a reveal that lands, a metaphor
   doing its work, a structural choice paying off), say nothing. Worked example:
   "Sometimes, I even ran over my friends' toes" lands as written via reveal-
   through-consequence + meek framing + inferential geometry. The walk's
   internal recognition fires, but emission count = ZERO.

2. THE FINDING IS REAL. Text-evidenced, not a guess.

3. WRITER-SIDE ONLY. The depth depends on something not on the page —
   re-reading won't close the gap; later paragraphs won't close it; only the
   writer can.

4. YOU HAVE AN ANGLE. Not "tell me more" but a specific direction (a moment to
   recover, a sensory anchor, a stakes-context, a person to name).

5. ANSWER UPGRADES — DOESN'T ENABLE. You must already have produced (or be
   producing in this same walk output) a corresponding text-grounded coaching
   artifact for this gap — a finding-with-claim, an improvementCandidate, a
   growthEdge. If no such artifact exists for this gap, you have under-coached;
   re-coach harder before considering emission. Constructive-proof rider: if
   the only specific text-grounded coaching you can write is "ask the writer
   for the specific thing," your coaching has BECOME the question — that's
   the enable case, not the upgrade case. Re-coach.

6. SURFACE-VS-DEEP. The emission must dig at a discovery OR a coaching-unlock
   different in SHAPE (not better in detail):
   (a) Discovery — answering surfaces a pattern, inversion, hidden choice, or
       unowned emotion the writer hasn't seen in their own essay.
   (b) Coaching-unlock — answering lets the system coach in a fundamentally
       different SHAPE (e.g., model consequence-style reveal on the writer's
       actual material). "Better in detail" doesn't qualify; "different in
       shape" does.
   "What were you feeling at that moment?" applied generically = surface,
   drop. "You wrote 'freeing' for watching something you couldn't do — what's
   the version that's true?" = deep, keep.

CONCEPT LIBRARY + REUSE POLICY (round 1.8 §3 + §8):

The user prompt includes a CONCEPT LIBRARY block listing concepts already
taught in this essay (across all walk passes) plus their unresolved-instance
counts. Per-concept caps:
  simple   → max 1 unresolved instance per essay
  medium   → max 2 unresolved instances per essay
  complex  → max 3 unresolved instances per essay
PLUS hard ceiling of 3 emissions per essay total.

The concept library is USER-ACCESSIBLE ON DEMAND — writers can look up the
definition + example for any concept they've been taught in this essay.
This is why the system can stay terse in coaching: the writer has a
permanent reference to the principle even when the prompt doesn't re-teach
it. The LLM never surfaces library content inline in framingSeed; the
library serves the writer's lookup, not the prompt's repetition.

Before minting a new conceptTag, scan the library: REUSE an existing tag if
the underlying mechanism is identical (not just thematically similar). Two
tags differ only if a writer who internalized concept A would not yet have
internalized concept B. Tags are PROSE phrases, not snake_case.

CAP RELAXATION ON DEMONSTRATED UNDERSTANDING. If the user iterates and
resolves prior instances of a concept (gap-resolution detector flips
gapResolved=true), the unresolved count drops, and a NEW instance of the
same concept can fire fresh teaching. The cap relaxes when the user
demonstrates understanding via iteration; it does not permanently
suppress.

POST-WALK CONSOLIDATION. After all paragraphs walk, a deterministic step
groups candidates by conceptTag, applies complexity caps (keep top N per
group), then ranks by priority (critical > high > medium > low) and trims
to 3 total. Surviving emissions land on paragraph.understanding.specifics-
NeedEmissions. Candidates dropped at consolidation do NOT register in the
concept library.

ANTI-REPETITION (cross-paragraph in this walk). Drop emissions that:
- Quote the same student line + target the same gap as a prior emission.
- Use the same angle phrasing — revise to be specific to this paragraph's
  material, OR drop.
- Surface the same gap from a different finding — drop.

SINGLE-LINE GAP BUNDLING. When a single line carries multiple distinct
gaps, prefer ONE emission whose angle bundles them — UNLESS the gaps need
fundamentally different answer-shapes.

framingSeed CALIBRATION (the only student-facing field):
- MUST embed the student's actual line as a direct quote.
- PLAIN language. NO analytical jargon ("subject-deferral grammar,"
  "deepeningPotential," "F12"). NO engineering vocabulary.
- NO validation padding ("your description of X is beautiful and full of...").
- NO template with quote slot — the framing language around the quote must
  come from THIS essay's specifics, not a portable template applied to any
  student's essay.
- Length matches what the gap and angle need; more than three sentences is
  almost always padding.
- Quote-then-gap-then-angle, no opening filler.
- When the concept is being taught for the first time in this essay, name the
  writing principle inside the seed — that turns the question into teaching.

CORPUS-BAR EXAMPLES of framingSeed (each ties to a different concept):
- "You wrote that watching her dance was 'freeing' — what did being the kid
  who couldn't move that way actually feel like? Not the sad version, the
  actual one. Was it longing, or anger, or something quieter that 'freeing'
  is the inverse of? The honest word under that one is what makes the rest
  land." (concept: "honest word over easy word")
- "You said your friends 'didn't get it.' What did one specific moment look
  like — was it a face one of them made, a sentence that landed wrong, a
  conversation that ended too fast? One real moment we can hear and see
  lands harder than the summary." (concept: "specific moment over summary")
- "You wrote that your grandmother was 'kind.' Kind is the word everyone
  uses for their grandmother. What did she do that no one else's would? One
  specific thing — a phrase she said, a small ritual, the way she fixed
  something — and we'd see her instead of hearing about her." (concept:
  "specific over general")

PRIORITY (structural two-question test):
  Q1: Without the answer, does the finding's claim collapse? YES → critical
  Q2: Without the answer, can downstream coaching still be specific?
      NO  → high
      YES → medium
  "low" reserved for emissions where the walk is uncertain whether to emit
  at all (per silence default, prefer not emitting over emitting at "low").

EXPECTED-INSIGHT BANNED TRIVIAL PHRASINGS (don't write these — they autopass
without filtering):
- "Matures the finding from hypothesis to confirmed."
- "Makes the coaching more concrete."
- "Reduces fabrication risk."
- "Improves the system's understanding."
- "Helps L5 generate better feedback."
Name the SPECIFIC content: WHICH coaching move, WHICH finding-claim, WHICH
fabrication scenario.

EXPECTED-DISCOVERY BANNED TRIVIAL PHRASINGS (same discipline):
- "the writer would discover what they were feeling"
- "the writer would discover their actual emotion"
- "the writer would discover a specific detail"
- "the writer would discover more about themselves"
Name the SPECIFIC discovery: WHICH pattern, WHICH inversion, WHICH unowned
emotion.

PRE-OUTPUT SWAP CHECK (final gate before emit):

Before you emit each candidate, run two swap tests against your own draft:
- Could the candidate's expectedDiscovery appear word-for-word on a
  different essay's emission? If yes, the discovery is generic — drop the
  emission.
- Could the candidate's conceptTag appear word-for-word on a different
  essay's emission AND name an underlying mechanism that's actually
  different from this essay's? If yes, the tag is too generic — either
  reuse the existing library tag whose mechanism matches, or refine the
  tag to name THIS essay's specific principle.

OUTPUT specificsNeedEmissions as a top-level array (sibling of paragraph-
Understanding). Empty array is valid and the default — silence is the audit
signal.

=== CRITICAL REMINDERS ===

1. UNDERSTANDING ONLY. Zero evaluative language. If you write "effectively", "strong", or any banned word, rewrite immediately.
2. EVERY finding needs evidence — quote specific text from the essay. primaryFunction should cite the architectural insight, not just name a technique.
3. Aim for ARCHITECTURAL depth — not just "what technique" but "what this technique reveals about how the essay makes meaning."
4. For later paragraphs, focus on what is NEW. Don't rehash known understanding.
5. Back-propagation updates primaryFunction/significance for earlier sentences. For deeper insights, produce FINDING EVOLUTIONS.
6. Name craft techniques precisely: "anaphora" not "repetition", "polysyndeton" not "uses many ands".
7. Tags must be semantic and useful for routing: "turning_point", "sensory_grounding", "thesis_crystallization", "voice_shift", "emotional_peak".
8. Every sentence needs a "primaryFunction" (one-line architectural summary) and "significance" (pivotal/contributing/transitional).
9. "craft" and "significantChoices" are OPTIONAL — include only for pivotal/contributing sentences where they add genuine insight. Omit for transitional sentences.

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

// ============================================================================
// SEQUENTIAL DEEP WALK SERVICE
// ============================================================================

export class SequentialDeepWalkService {
  private readonly router: ProfileRouter;

  constructor(router?: ProfileRouter) {
    this.router = router ?? new ProfileRouter();
  }

  /**
   * Walk the essay paragraph by paragraph, building compound understanding.
   *
   * Each paragraph call:
   * 1. Assembles context via Profile Router (connection-driven + proximity)
   * 2. Calls Sonnet with system (cached) + essay text + accumulated context + paragraph-specific data
   * 3. Parses UnderstandingWalkOutput
   * 4. Accumulates back-propagation and holistic evolution
   * 5. Updates the profile in-place for subsequent calls' context assembly
   *
   * Error resilience:
   * - Single paragraph failure → mark walkSkipped, continue
   * - 3+ consecutive failures → abort walk, return partial results
   */
  async walkEssay(
    essayText: string,
    profile: EssayProfile,
    structuralMap: StructuralCartography,
    scoutOutput: ConnectionScoutOutput | null,
    l1Impressions: ParagraphFirstImpression[],
    options?: {
      startFromParagraph?: number;
      /** Re-analysis context string injected once at the start of the first paragraph prompt */
      reanalysisContext?: string;
      /** W1.3: FindingStore for injecting finding context into walk prompts */
      findingStore?: FindingStore;
      /** Wave-3a Phase 3C: essay UUID for corpus telemetry persistence. */
      essayId?: string;
    },
  ): Promise<L3WalkResult> {
    const startTime = Date.now();
    const paragraphs = this.splitIntoParagraphs(essayText);

    if (paragraphs.length === 0) {
      return this.emptyResult();
    }

    const startIndex = options?.startFromParagraph ?? 0;
    const markedEssay = this.buildMarkedEssayText(paragraphs);

    // Wave-3a Phase 3C: retrieve corpus archetypes ONCE at start of walk.
    // Uses the DESCRIPTIVE block builder (no calibration language) to preserve
    // L3's Understanding-only framing — we want context, not evaluation. Stage
    // tag 'walk' so telemetry aggregates independently of phase assessment.
    // Feature-flag-gated per-layer (`ENABLE_CORPUS_RETRIEVAL_L3`), falls back
    // to the master `ENABLE_CORPUS_RETRIEVAL_L35` when unset.
    let walkCorpusArchetypeBlock = '';
    const walkCorpusTel: CorpusRetrievalTelemetry | null = isCorpusRetrievalEnabledForL3()
      ? createTelemetry()
      : null;
    if (walkCorpusTel) {
      const corpusRunStart = Date.now();
      const archetypes = await retrievePhaseArchetypes(profile, walkCorpusTel, 'walk');
      walkCorpusArchetypeBlock = buildDescriptiveArchetypesBlock(archetypes);
      walkCorpusTel.corpusBlockTokens += estimateBlockTokens(walkCorpusArchetypeBlock);
      walkCorpusTel.totalLatencyMs = Date.now() - corpusRunStart;
    }

    // Accumulation state
    const walkOutputs: UnderstandingWalkOutput[] = [];
    const allBackPropagations: L3WalkResult['backPropagations'] = [];
    const skippedParagraphs: number[] = [];
    // Scope 2 Phase 5: fail-fast accumulators. Indices of paragraphs whose
    // LLM call or parse failed. If non-empty at loop end (or if
    // MAX_CONSECUTIVE_FAILURES trips), throw PipelineError.paragraphLoopFailed
    // instead of the old push-empty-shell anti-pattern.
    const failedWalkParagraphs: number[] = [];
    let firstWalkError: Error | undefined;
    let holisticEvolution: L3WalkResult['holisticEvolution'] = {};
    let totalCost = 0;
    const totalTokens = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
    let consecutiveFailures = 0;

    for (let pIdx = startIndex; pIdx < paragraphs.length; pIdx++) {
      // Check consecutive failure threshold — fail fast instead of silently
      // marking remaining paragraphs skipped (which used to produce a
      // "successful" result with empty walkOutputs).
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error(
          `[SequentialDeepWalk] Aborting walk: ${consecutiveFailures} consecutive failures. ` +
          `Last successful paragraph: P${pIdx - consecutiveFailures}. Remaining: P${pIdx}-P${paragraphs.length}.`,
        );
        // Record remaining paragraphs as failed so PipelineError carries the full set
        for (let remaining = pIdx; remaining < paragraphs.length; remaining++) {
          failedWalkParagraphs.push(remaining);
        }
        break;
      }

      try {
        // 1. Assemble context via Profile Router. Intentionally NO tokenBudget
        // override here — the router's RULE_BASE_BUDGETS (8000) is used. A
        // previous hardcoded 3000 was unrealistic for the walk's always-priority
        // set (typically 9-16K) and produced 150+ "exceed budget" warnings per
        // run without changing behavior, since always-priority sections are
        // never dropped regardless of budget.
        const assembledContext = this.router.assembleContext(profile, {
          rule: 'l3_understanding_walk',
          paragraphIndex: pIdx,
        });

        // 2. Build user prompt
        // FIX H2: Inject reanalysis context into ALL walked paragraphs, not just the first.
        // The model needs to know WHY it is re-analyzing at every paragraph, so it can
        // prioritize stale areas and understand changes. For the start paragraph the
        // context is injected as-is; for subsequent paragraphs it is prefixed with a
        // note that the paragraph may be AFFECTED by changes elsewhere.
        let reanalysisContextForPara: string | undefined;
        if (options?.reanalysisContext) {
          if (pIdx === startIndex) {
            reanalysisContextForPara = options.reanalysisContext;
          } else {
            reanalysisContextForPara =
              `[Continuing re-analysis — this paragraph (P${pIdx + 1}) may be affected by the changes described below. ` +
              `Look for ripple effects: shifted meaning, altered connections, changed narrative contribution.]\n\n` +
              options.reanalysisContext;
          }
        }
        // D-2.2 round 1.8: assemble walkContext for cross-paragraph
        // anti-repetition (§7.1) + concept-library cap awareness (§8).
        // priorEmissions = flatMap from already-walked paragraphs in this
        // pass; conceptLibrary = profile.conceptLibrary (defaults to []
        // for legacy / fresh profiles per coordinator migration).
        const priorEmissions: SpecificsNeedEmission[] = walkOutputs.flatMap(
          (w) => w.specificsNeedEmissions ?? [],
        );
        const conceptLibrary: ConceptLibraryEntry[] = profile.conceptLibrary ?? [];

        const userPrompt = this.buildUserPrompt(
          markedEssay,
          paragraphs,
          pIdx,
          structuralMap,
          scoutOutput,
          l1Impressions,
          assembledContext,
          holisticEvolution,
          reanalysisContextForPara,
          options?.findingStore,
          walkCorpusArchetypeBlock,
          { priorEmissions, conceptLibrary },
        );

        // 3. Call Sonnet — dynamically scale output tokens by sentence count
        const sentenceCount = this.splitIntoSentences(paragraphs[pIdx]).length;
        const walkMaxTokens = computeWalkMaxTokens(sentenceCount);
        const response = await callClaudeWithRetry<Record<string, unknown>>({
          model: SONNET,
          // Scope 2 Phase 5: buildSystemPrompt() substitutes the technique
          // vocabulary block into the template. Still cached across calls
          // because the substituted result is stable within a deploy.
          systemPrompt: buildSystemPrompt(),
          userPrompt,
          maxTokens: walkMaxTokens,
          temperature: WALK_TEMPERATURE,
          timeoutMs: WALK_TIMEOUT_MS,
          useJsonMode: true,
          cacheSystemPrompt: true,
        });

        // 4. Parse response into typed UnderstandingWalkOutput
        const walkOutput = this.parseWalkOutput(response.content, pIdx, paragraphs[pIdx]);

        // 5. Accumulate results (shared helper for main path + retry path)
        this.accumulateWalkSuccess(
          walkOutput, response, pIdx, paragraphs.length,
          profile, walkOutputs, allBackPropagations, holisticEvolution, totalTokens,
        );
        totalCost += calculateCost(response.usage, SONNET);
        console.log(
          `[EssayIntelligence] L3 P${pIdx}: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${calculateCost(response.usage, SONNET).toFixed(4)} (cumulative: $${totalCost.toFixed(4)})`,
        );

        // Reset consecutive failure counter on success
        consecutiveFailures = 0;

      } catch (error) {
        // Scope 2 Phase 5 fail-fast: accumulate failed index, preserve first
        // error for diagnostic chain. Do NOT push emptyWalkOutput — the L3
        // equivalent of the L5 "push-empty" anti-pattern that masked real
        // per-paragraph failures as successes in the aggregate result.
        consecutiveFailures++;
        failedWalkParagraphs.push(pIdx);
        if (!firstWalkError) {
          firstWalkError = error instanceof Error ? error : new Error(String(error));
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[SequentialDeepWalk] P${pIdx + 1}/${paragraphs.length} FAILED ` +
          `(consecutive: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${errorMessage}`,
        );

        // Still mark the paragraph on the profile so any partial consumer
        // that reads profile state before the throw sees the skip marker.
        this.markParagraphSkipped(profile, pIdx, errorMessage);
      }
    }

    // Scope 2 Phase 5 fail-fast gate: if any paragraph failed, raise a single
    // PipelineError carrying the full failed-index set and the first inner
    // error. Callers (analysisOrchestrator) are responsible for surfacing this
    // to the UI / logs — there is no silent "partial walk result" path.
    if (failedWalkParagraphs.length > 0) {
      throw PipelineError.paragraphLoopFailed(
        'L3_walk',
        failedWalkParagraphs,
        paragraphs.length,
        firstWalkError,
      );
    }

    // Wave-3a Phase 3C/3B: persist corpus telemetry for this walk.
    if (walkCorpusTel) {
      const record = buildCorpusTelemetryRecord({
        essayId: options?.essayId ?? 'unknown',
        layer: 'L3',
        telemetry: walkCorpusTel,
      });
      void persistCorpusTelemetry(record);
    }

    // D-2.2 round 1.8 §11.9 + §11.12: post-walk consolidation step. Runs
    // AFTER all paragraphs walk, BEFORE the result returns. Three actions:
    //   1. Gap-resolution detection — compare prior unresolved instances
    //      against the current draft anchors; mark resolved if anchor text
    //      changed (deterministic heuristic; LLM judgment can replace later
    //      if false-positive rate is high in calibration).
    //   2. Group emissions by conceptTag, apply complexity caps (simple=1,
    //      medium=2, complex=3 unresolved instances per essay), then rank
    //      by priority (critical > high > medium > low) and trim to 3 total.
    //   3. Update profile.conceptLibrary instances for surviving emissions
    //      and write trimmed result back to per-paragraph specifics-
    //      NeedEmissions arrays.
    this.consolidateSpecificsNeedEmissions(profile, walkOutputs);

    return {
      walkOutputs,
      backPropagations: allBackPropagations,
      holisticEvolution,
      skippedParagraphs,
      cost: totalCost,
      tokenUsage: totalTokens,
      timingMs: Date.now() - startTime,
    };
  }

  /**
   * D-2.2 round 1.8 §11.9 + §11.12 — post-walk consolidation step.
   *
   * Mutates `profile` and `walkOutputs` in place. After this returns:
   * - `profile.paragraphs[i].understanding.specificsNeedEmissions` carries
   *   only the surviving emissions (per-essay 3 ceiling + per-concept
   *   complexity caps).
   * - `walkOutputs[i].specificsNeedEmissions` mirrors the per-paragraph
   *   surviving set.
   * - `profile.conceptLibrary[]` has new entries (or appended instances on
   *   existing entries) for each SURVIVING emission's conceptTag. Dropped
   *   emissions do NOT register in the library (round 1.8 §10).
   * - Prior unresolved instances of any conceptLibrary entry whose anchor
   *   text changed since the prior iteration are marked `gapResolved: true`
   *   with `resolvedAtIteration` set to current iteration.
   *
   * Test access: this method is `private` but D-2.2 §11.14 unit tests
   * exercise it via `(service as unknown as { consolidateSpecificsNeed-
   * Emissions: typeof this.consolidateSpecificsNeedEmissions }).consolidate-
   * SpecificsNeedEmissions(profile, walkOutputs)` to avoid mocking the
   * full walk pipeline.
   */
  private consolidateSpecificsNeedEmissions(
    profile: EssayProfile,
    walkOutputs: UnderstandingWalkOutput[],
  ): void {
    const currentIteration =
      profile.index?.iterationLedger?.currentIteration ?? 1;

    // Ensure conceptLibrary exists (defensive — coordinator migration also
    // defaults this, but a profile constructed outside the coordinator
    // path could miss it).
    if (!profile.conceptLibrary) profile.conceptLibrary = [];

    // ── Step 1: gap-resolution detection ───────────────────────────────
    // For each prior unresolved instance, check whether the anchor text
    // (paragraph + sentence, when sentence-scoped) has changed. A changed
    // anchor signals the writer iterated; we mark the gap resolved
    // tentatively (the walk can re-emit if the gap returns at the same
    // anchor, which becomes a fresh instance with iteration =
    // currentIteration).
    for (const entry of profile.conceptLibrary) {
      for (const instance of entry.instances) {
        if (instance.gapResolved) continue;
        if (instance.iteration >= currentIteration) continue;

        // Detect whether anchor text changed. If the paragraph at this
        // index doesn't exist anymore (essay shortened), we treat as
        // resolved (nothing to fix). If sentence-scoped and the sentence
        // doesn't exist, same. Conservative default: if comparison can't
        // run (no prior text snapshot available), do NOT mark resolved —
        // the walk's emission re-eval will catch persistent gaps.
        // Note: this iteration uses sentence-existence as proxy for
        // "anchor still valid"; richer text-diff detection can replace
        // this in a future calibration iteration if false-positive rate
        // proves high.
        const para = profile.paragraphs[instance.paragraph];
        if (!para) {
          instance.gapResolved = true;
          instance.resolvedAtIteration = currentIteration;
          continue;
        }
        if (typeof instance.sentence === 'number') {
          const sentence = para.sentences[instance.sentence];
          if (!sentence) {
            instance.gapResolved = true;
            instance.resolvedAtIteration = currentIteration;
            continue;
          }
        }
        // Anchor still exists; leave gapResolved=false. The walk's emission
        // logic decides whether the same gap reappears at this anchor — if
        // the walk re-emits on this conceptTag at the same anchor, the
        // post-walk consolidation step appends a NEW instance (with
        // iteration=currentIteration). The prior unresolved instance stays
        // unresolved until later iteration explicitly resolves it via
        // anchor disappearance.
      }
    }

    // ── Step 2: collect candidates from walkOutputs ────────────────────
    // Each candidate carries a back-reference so we can prune at the
    // per-paragraph storage when consolidation drops it.
    interface Candidate {
      emission: SpecificsNeedEmission;
      paragraphIndex: number;
      emissionIndex: number;
    }
    const candidates: Candidate[] = [];
    walkOutputs.forEach((output) => {
      const emissions = output.specificsNeedEmissions ?? [];
      emissions.forEach((emission, idx) => {
        candidates.push({
          emission,
          paragraphIndex: output.paragraphIndex,
          emissionIndex: idx,
        });
      });
    });

    if (candidates.length === 0) return;

    // ── Step 3: apply per-concept complexity caps ──────────────────────
    // Group by conceptTag. For each group, count UNRESOLVED instances
    // already in the library + new candidates in this group; apply the
    // cap. Surviving candidates within the group rank by priority then
    // emission order.
    const COMPLEXITY_CAP: Record<
      SpecificsNeedEmission['conceptComplexity'],
      number
    > = { simple: 1, medium: 2, complex: 3 };
    const PRIORITY_RANK: Record<SpecificsNeedEmission['priority'], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const byTag = new Map<string, Candidate[]>();
    for (const c of candidates) {
      const tag = c.emission.conceptTag;
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push(c);
    }

    const survivingPerConcept: Candidate[] = [];
    for (const [tag, group] of byTag.entries()) {
      const complexity = group[0].emission.conceptComplexity;
      const cap = COMPLEXITY_CAP[complexity];

      // Existing unresolved instances in the library count against the cap.
      const existingEntry = profile.conceptLibrary.find((e) => e.tag === tag);
      const existingUnresolved = existingEntry
        ? existingEntry.instances.filter((i) => !i.gapResolved).length
        : 0;
      const slotsRemaining = Math.max(0, cap - existingUnresolved);

      // Sort group by priority (critical first) then emission order.
      group.sort((a, b) => {
        const dp = PRIORITY_RANK[a.emission.priority] - PRIORITY_RANK[b.emission.priority];
        if (dp !== 0) return dp;
        if (a.paragraphIndex !== b.paragraphIndex) {
          return a.paragraphIndex - b.paragraphIndex;
        }
        return a.emissionIndex - b.emissionIndex;
      });

      survivingPerConcept.push(...group.slice(0, slotsRemaining));
    }

    // ── Step 4: apply per-essay hard ceiling (3) ───────────────────────
    survivingPerConcept.sort((a, b) => {
      const dp = PRIORITY_RANK[a.emission.priority] - PRIORITY_RANK[b.emission.priority];
      if (dp !== 0) return dp;
      if (a.paragraphIndex !== b.paragraphIndex) {
        return a.paragraphIndex - b.paragraphIndex;
      }
      return a.emissionIndex - b.emissionIndex;
    });
    const ESSAY_CEILING = 3;
    const surviving = survivingPerConcept.slice(0, ESSAY_CEILING);

    // ── Step 5: write surviving emissions back to per-paragraph storage ─
    // Rebuild each paragraph's specificsNeedEmissions array from surviving
    // candidates only. Dropped candidates leave no trace (no library entry,
    // no per-paragraph storage). walkOutputs[].specificsNeedEmissions is
    // also rebuilt to mirror.
    const survivingByParagraph = new Map<number, SpecificsNeedEmission[]>();
    for (const c of surviving) {
      if (!survivingByParagraph.has(c.paragraphIndex)) {
        survivingByParagraph.set(c.paragraphIndex, []);
      }
      survivingByParagraph.get(c.paragraphIndex)!.push(c.emission);
    }

    for (const output of walkOutputs) {
      const survived = survivingByParagraph.get(output.paragraphIndex);
      if (survived && survived.length > 0) {
        output.specificsNeedEmissions = survived;
      } else {
        delete output.specificsNeedEmissions;
      }
      const para = profile.paragraphs[output.paragraphIndex];
      if (para && para.understanding) {
        if (survived && survived.length > 0) {
          para.understanding.specificsNeedEmissions = survived;
        } else {
          delete para.understanding.specificsNeedEmissions;
        }
      }
    }

    // ── Step 6: append surviving emissions into conceptLibrary ─────────
    for (const c of surviving) {
      const e = c.emission;
      let entry = profile.conceptLibrary.find((x) => x.tag === e.conceptTag);
      if (!entry) {
        entry = {
          tag: e.conceptTag,
          complexity: e.conceptComplexity,
          definition: e.conceptDefinition,
          example: e.conceptExample,
          instances: [],
        };
        profile.conceptLibrary.push(entry);
      }
      entry.instances.push({
        paragraph: e.anchorParagraph,
        sentence: e.anchorSentence,
        iteration: currentIteration,
        gapResolved: false,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARAGRAPH SPLITTING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Split essay text into paragraphs. Uses double-newline as delimiter,
   * filters out empty paragraphs.
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Split a paragraph into sentences. Uses a regex that handles common
   * abbreviations and edge cases (Mr., Dr., etc.).
   */
  private splitIntoSentences(paragraphText: string): string[] {
    // Split on sentence-ending punctuation followed by whitespace or end-of-string
    // Handles: periods, exclamation marks, question marks
    // Preserves abbreviations like Mr., Dr., U.S., etc.
    const sentences = paragraphText
      .split(/(?<=[.!?])\s+(?=[A-Z"'"])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Fallback: if regex didn't split (single sentence or unusual formatting),
    // return the whole paragraph as one sentence
    if (sentences.length === 0 && paragraphText.trim().length > 0) {
      return [paragraphText.trim()];
    }

    return sentences;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROMPT CONSTRUCTION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Build the full essay text with [P1]..[PN] markers.
   */
  private buildMarkedEssayText(paragraphs: string[]): string {
    return paragraphs
      .map((p, i) => `[P${i + 1}] ${p}`)
      .join('\n\n');
  }

  /**
   * Build the user prompt for a specific paragraph (Block 2 + Block 3).
   *
   * Block 2: Essay text + accumulated profile context (good cache overlap)
   * Block 3: Call-specific — target paragraph + scout leads + investigation questions
   */
  /**
   * Shared success-path accumulation for walk outputs (main attempt + retry).
   * Avoids duplicating ~20 lines of accumulation logic between the two paths.
   */
  private accumulateWalkSuccess(
    walkOutput: UnderstandingWalkOutput,
    response: { usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number } },
    pIdx: number,
    totalParagraphs: number,
    profile: EssayProfile,
    walkOutputs: UnderstandingWalkOutput[],
    allBackPropagations: L3WalkResult['backPropagations'],
    holisticEvolution: L3WalkResult['holisticEvolution'],
    totalTokens: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number },
  ): void {
    walkOutputs.push(walkOutput);

    // Accumulate back-propagation
    if (walkOutput.priorSentenceUpdates.length > 0) {
      allBackPropagations.push(...walkOutput.priorSentenceUpdates);
    }

    // Merge holistic evolution (later paragraphs override earlier)
    if (walkOutput.holisticEvolution.centralThesis !== undefined) {
      holisticEvolution.centralThesis = walkOutput.holisticEvolution.centralThesis;
    }
    if (walkOutput.holisticEvolution.thesisConfidence !== undefined) {
      holisticEvolution.thesisConfidence = walkOutput.holisticEvolution.thesisConfidence;
    }
    if (walkOutput.holisticEvolution.voiceSignature !== undefined) {
      holisticEvolution.voiceSignature = walkOutput.holisticEvolution.voiceSignature;
    }
    if (walkOutput.holisticEvolution.arcMomentum !== undefined) {
      holisticEvolution.arcMomentum = walkOutput.holisticEvolution.arcMomentum;
    }

    // Apply understanding to profile in-place for subsequent calls
    this.applyWalkOutputToProfile(profile, pIdx, walkOutput);

    // Track tokens
    totalTokens.inputTokens += response.usage.input_tokens;
    totalTokens.outputTokens += response.usage.output_tokens;
    totalTokens.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
    totalTokens.cacheWriteTokens += response.usage.cache_creation_input_tokens ?? 0;

    const callCost = calculateCost(response.usage, SONNET);
    const findingCount = (walkOutput.newFindings?.length ?? 0);
    const evoCount = (walkOutput.findingEvolutions?.length ?? 0);
    console.log(
      `[SequentialDeepWalk] P${pIdx + 1}/${totalParagraphs} complete — ` +
      `${walkOutput.sentenceUnderstandings.length} sentences, ` +
      `${walkOutput.priorSentenceUpdates.length} back-props, ` +
      `${walkOutput.newConnections.length} connections, ` +
      `${findingCount} findings, ${evoCount} evolutions, ` +
      `cost: $${callCost.toFixed(4)}`,
    );
  }

  private buildUserPrompt(
    markedEssay: string,
    paragraphs: string[],
    paragraphIndex: number,
    structuralMap: StructuralCartography,
    scoutOutput: ConnectionScoutOutput | null,
    l1Impressions: ParagraphFirstImpression[],
    assembledContext: AssembledProfileContext,
    currentHolisticEvolution: L3WalkResult['holisticEvolution'],
    reanalysisContext?: string,
    findingStore?: FindingStore,
    corpusArchetypeBlock?: string,
    walkContext?: {
      /** Emissions from earlier paragraphs in this walk run — drives §7.1 cross-paragraph anti-repetition. */
      priorEmissions: SpecificsNeedEmission[];
      /** Concepts already taught in this essay across walk passes — drives §8 cap awareness. */
      conceptLibrary: ConceptLibraryEntry[];
    },
  ): string {
    const sections: string[] = [];

    // ── RE-ANALYSIS CONTEXT (injected once at the start, first paragraph only) ──
    if (reanalysisContext) {
      sections.push('=== RE-ANALYSIS CONTEXT (these areas changed — prioritize them) ===');
      sections.push(reanalysisContext);
    }

    // Wave-3a Phase 3C: corpus archetypes (descriptive context only). Same
    // string for every paragraph in the walk — cached by Anthropic once the
    // preceding block prefix stabilizes.
    if (corpusArchetypeBlock && corpusArchetypeBlock.length > 0) {
      sections.push(corpusArchetypeBlock);
    }

    // ── BLOCK 2: ESSAY TEXT (cached across calls) ──
    sections.push('=== FULL ESSAY TEXT ===');
    sections.push(markedEssay);

    // ── BLOCK 2: ACCUMULATED PROFILE CONTEXT (from Profile Router) ──
    // The Profile Router has already assembled the right context:
    // - ProfileIndex (always)
    // - Holistic understanding built so far (always)
    // - Scout leads for this paragraph (always)
    // - Full understanding for connected paragraphs (connection-driven)
    // - Full understanding for P(N-1) (proximity)
    // - Digests for earlier non-connected paragraphs (fallback)
    if (assembledContext.sections.length > 0) {
      sections.push('\n=== ACCUMULATED UNDERSTANDING (from previous paragraphs) ===');
      for (const section of assembledContext.sections) {
        sections.push(`\n--- ${section.name} ---`);
        sections.push(JSON.stringify(section.content, null, 1));
      }
    }

    // ── HOLISTIC EVOLUTION SO FAR ──
    if (currentHolisticEvolution.centralThesis || currentHolisticEvolution.voiceSignature) {
      sections.push('\n=== HOLISTIC EVOLUTION SO FAR ===');
      if (currentHolisticEvolution.centralThesis) {
        sections.push(`Emerging thesis: ${currentHolisticEvolution.centralThesis} (confidence: ${currentHolisticEvolution.thesisConfidence ?? 'unknown'})`);
      }
      if (currentHolisticEvolution.voiceSignature) {
        sections.push(`Voice signature: ${currentHolisticEvolution.voiceSignature}`);
      }
      if (currentHolisticEvolution.arcMomentum) {
        sections.push(`Arc momentum: ${currentHolisticEvolution.arcMomentum}`);
      }
    }

    // ── D-2.2 round 1.8: PRIOR EMISSIONS IN THIS WALK ──
    // Drives §7.1 cross-paragraph anti-repetition. The walk sees every
    // emission produced by earlier paragraphs in THIS pass; it must not
    // re-emit on the same line + same gap or recycle the same angle.
    if (walkContext && walkContext.priorEmissions.length > 0) {
      sections.push('\n=== PRIOR EMISSIONS IN THIS WALK (avoid repeating gaps + angles) ===');
      walkContext.priorEmissions.forEach((emission, i) => {
        sections.push(
          `[${i + 1}] P${emission.anchorParagraph + 1}` +
            (typeof emission.anchorSentence === 'number'
              ? `S${emission.anchorSentence + 1}`
              : '') +
            ` — concept: "${emission.conceptTag}"`,
        );
        sections.push(`     framingSeed: ${emission.framingSeed}`);
        sections.push(`     whyAsked: ${emission.whyAsked}`);
      });
    }

    // ── D-2.2 round 1.8: CONCEPT LIBRARY (concepts already taught in this essay) ──
    // Drives §8 cap awareness + reuse policy. The walk sees concepts taught
    // across walk passes (this essay's analysis history) with unresolved-
    // instance counts. Per-concept caps fire on unresolved instances:
    // simple → 1 max, medium → 2 max, complex → 3 max. Reuse existing tags
    // when the underlying mechanism matches; mint a new tag only for a
    // genuinely distinct principle.
    if (walkContext && walkContext.conceptLibrary.length > 0) {
      sections.push('\n=== CONCEPT LIBRARY (concepts already taught in this essay) ===');
      sections.push(
        'Per-concept caps (unresolved instances): simple = 1, medium = 2, complex = 3.',
      );
      sections.push(
        'Reuse an existing tag if the underlying principle matches; otherwise mint a new prose tag.',
      );
      walkContext.conceptLibrary.forEach((entry) => {
        const unresolved = entry.instances.filter((i) => !i.gapResolved).length;
        const total = entry.instances.length;
        sections.push(
          `- "${entry.tag}" [${entry.complexity}]: ${unresolved} unresolved / ${total} total instances`,
        );
        sections.push(`     definition: ${entry.definition}`);
      });
    }

    // ── W1.3: FINDING CONTEXT (existing findings for reference) ──
    if (findingStore && findingStore.size > 0) {
      // Compact summary of all active findings for relationship references
      const refContext = buildFindingReferenceContext(findingStore);
      if (refContext) {
        sections.push(`\n${refContext}`);
      }

      // Paragraph-specific findings (more detailed for the current paragraph)
      const paraContext = buildParagraphFindingContext(findingStore, paragraphIndex);
      if (paraContext) {
        sections.push(`\n${paraContext}`);
      }
    }

    // ── BLOCK 3: CALL-SPECIFIC — TARGET PARAGRAPH ──
    sections.push(`\n\n=== NOW ANALYZE PARAGRAPH ${paragraphIndex + 1} OF ${paragraphs.length} ===`);
    sections.push(`\n${paragraphs[paragraphIndex]}`);

    // Sentence breakdown for reference
    const sentences = this.splitIntoSentences(paragraphs[paragraphIndex]);
    if (sentences.length > 0) {
      sections.push('\nSentences in this paragraph (for indexing):');
      sentences.forEach((s, i) => {
        sections.push(`  S${i + 1}: "${s}"`);
      });
    }

    // ── L1 IMPRESSIONS (descriptive scaffold) ──
    const l1Data = l1Impressions[paragraphIndex];
    if (l1Data) {
      sections.push('\n=== L1 FIRST IMPRESSIONS (Haiku — descriptive scaffold, supersede with deeper understanding) ===');
      sections.push(`Apparent purpose: ${l1Data.apparentPurpose}`);
      sections.push(`Emotional register: ${l1Data.emotionalRegister}`);
      sections.push(`Voice observation: ${l1Data.voiceObservation}`);
      if (l1Data.craftNotices.length > 0) {
        sections.push(`Craft notices: ${l1Data.craftNotices.join(', ')}`);
      }
      if (l1Data.notablePhrases.length > 0) {
        sections.push('Notable phrases:');
        for (const phrase of l1Data.notablePhrases) {
          sections.push(`  "${phrase.phrase}" (S${phrase.sentenceIndex + 1}): ${phrase.significance}`);
        }
      }
    }

    // ── L2 STRUCTURAL ROLE ──
    const structRole = structuralMap.paragraphRoles?.[paragraphIndex];
    if (structRole) {
      sections.push('\n=== L2 STRUCTURAL ROLE ===');
      sections.push(`Role: ${structRole.role}`);
      sections.push(`Narrative function: ${structRole.narrativeFunction}`);
      sections.push(`Strength contribution: ${structRole.strengthContribution}`);
      if (structRole.weaknessFlag) {
        sections.push(`Structural concern: ${structRole.weaknessFlag}`);
      }
    }

    // Transitions
    const transitionIn = structuralMap.transitions?.find(t => t.toParagraph === paragraphIndex);
    const transitionOut = structuralMap.transitions?.find(t => t.fromParagraph === paragraphIndex);
    if (transitionIn || transitionOut) {
      sections.push('\nTransitions:');
      if (transitionIn) {
        sections.push(`  Incoming from P${transitionIn.fromParagraph + 1}: ${transitionIn.quality} — ${transitionIn.mechanism}`);
      }
      if (transitionOut) {
        sections.push(`  Outgoing to P${transitionOut.toParagraph + 1}: ${transitionOut.quality} — ${transitionOut.mechanism}`);
      }
    }

    // ── SCOUT LEADS (L2.5 investigation starting points) ──
    const scoutLeads = this.getScoutLeadsForParagraph(scoutOutput, paragraphIndex);
    if (scoutLeads.length > 0) {
      sections.push('\n=== SCOUT LEADS (investigate — confirm, refine, or reject each) ===');
      for (const lead of scoutLeads) {
        sections.push(`  LEAD: ${lead}`);
      }
    }

    // ── INVESTIGATION QUESTIONS ──
    sections.push('\n=== INVESTIGATION QUESTIONS ===');
    if (paragraphIndex === 0) {
      sections.push('This is the first paragraph. Everything is new. Produce rich, detailed understanding.');
      sections.push('What voice does the writer establish? What world does the opening create?');
      sections.push('What expectations does this paragraph set for the reader?');
    } else {
      sections.push(`What does paragraph ${paragraphIndex + 1} reveal that was NOT already understood?`);
      sections.push('Does this paragraph change the meaning of anything in earlier paragraphs? (→ priorSentenceUpdates)');
      sections.push('Are there cross-paragraph connections the scout missed? Image recurrences, thematic echoes, structural parallels?');
      if (paragraphIndex === paragraphs.length - 1) {
        sections.push('This is the FINAL paragraph. How does it resolve, reframe, or leave open the essay\'s threads?');
        sections.push('Does it change the meaning of the opening? (→ back-propagate to P1 if so)');
      }
    }

    sections.push('\nProduce the JSON understanding for this paragraph.');

    return sections.join('\n');
  }

  /**
   * Extract scout leads relevant to a specific paragraph from L2.5 output.
   */
  private getScoutLeadsForParagraph(
    scoutOutput: ConnectionScoutOutput | null,
    paragraphIndex: number,
  ): string[] {
    if (!scoutOutput) return [];

    const leads: string[] = [];

    // Repeated elements involving this paragraph
    for (const elem of scoutOutput.repeatedElements) {
      const relevantOccurrences = elem.occurrences.filter(
        o => o.paragraphIndex === paragraphIndex,
      );
      if (relevantOccurrences.length > 0) {
        const otherLocations = elem.occurrences
          .filter(o => o.paragraphIndex !== paragraphIndex)
          .map(o => `P${o.paragraphIndex + 1}S${o.sentenceIndex + 1}`)
          .join(', ');
        if (otherLocations) {
          leads.push(
            `Repeated element "${elem.element}" appears here and at ${otherLocations}. ` +
            `Potential significance: ${elem.potentialSignificance}. ` +
            `Investigate: is this a meaningful thematic echo, image recurrence, or coincidence?`,
          );
        }
      }
    }

    // Tonal shifts at this paragraph
    for (const shift of scoutOutput.tonalShifts) {
      if (shift.location.paragraphIndex === paragraphIndex) {
        leads.push(
          `Tonal shift detected at S${shift.location.sentenceIndex + 1}: ` +
          `"${shift.fromTone}" → "${shift.toTone}" (${shift.abruptness}). ` +
          `Investigate: is this shift purposeful (serving narrative/thematic function) or unintentional drift?`,
        );
      }
    }

    // Structural echoes involving this paragraph
    for (const echo of scoutOutput.structuralEchoes) {
      if (echo.source.paragraphIndex === paragraphIndex) {
        leads.push(
          `Structural echo: this paragraph (S${echo.source.sentenceIndex + 1}) echoed at ` +
          `P${echo.echo.paragraphIndex + 1}S${echo.echo.sentenceIndex + 1}. Type: ${echo.echoType}. ` +
          `Investigate: is this structural mirroring intentional?`,
        );
      } else if (echo.echo.paragraphIndex === paragraphIndex) {
        leads.push(
          `Structural echo: S${echo.echo.sentenceIndex + 1} here echoes ` +
          `P${echo.source.paragraphIndex + 1}S${echo.source.sentenceIndex + 1}. Type: ${echo.echoType}. ` +
          `Investigate: is this a deliberate callback or parallel structure?`,
        );
      }
    }

    return leads;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESPONSE PARSING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Parse Sonnet's raw JSON response into a typed UnderstandingWalkOutput.
   *
   * Robust fallback chain: handles missing fields, wrong types, partial output.
   * Never throws — returns a minimal valid output if parsing fails entirely.
   */
  private parseWalkOutput(
    raw: Record<string, unknown>,
    paragraphIndex: number,
    paragraphText: string,
  ): UnderstandingWalkOutput {
    const sentences = this.splitIntoSentences(paragraphText);

    // Truncation detection: priorSentenceUpdates and newConnections come LAST
    // in the JSON output. If they are missing, truncation likely occurred —
    // the output was cut mid-object and jsonrepair produced a partial result.
    const hasPriorUpdates = raw.priorSentenceUpdates !== undefined && raw.priorSentenceUpdates !== null;
    const hasConnections = raw.newConnections !== undefined && raw.newConnections !== null;

    if (!hasPriorUpdates && !hasConnections && sentences.length >= 6) {
      console.warn(
        `[SequentialDeepWalk] PROBABLE TRUNCATION for P${paragraphIndex} (${sentences.length} sentences): ` +
        `priorSentenceUpdates and newConnections are both missing from parsed output. ` +
        `Back-propagation and connection data may have been lost due to output token limit.`,
      );
    } else if (!hasPriorUpdates && sentences.length >= 8) {
      console.warn(
        `[SequentialDeepWalk] Possible truncation for P${paragraphIndex} (${sentences.length} sentences): ` +
        `priorSentenceUpdates missing — back-propagation data may have been truncated.`,
      );
    }

    const result: UnderstandingWalkOutput = {
      paragraphIndex,
      paragraphUnderstanding: this.parseParagraphUnderstanding(raw.paragraphUnderstanding),
      sentenceUnderstandings: this.parseSentenceUnderstandings(
        raw.sentenceUnderstandings,
        sentences,
        paragraphIndex, // Scope 2 Phase 5: thread through for candidate ID generation
      ),
      holisticEvolution: this.parseHolisticEvolution(raw.holisticEvolution),
      priorSentenceUpdates: this.parsePriorSentenceUpdates(raw.priorSentenceUpdates),
      newConnections: this.parseNewConnections(raw.newConnections, paragraphIndex),
    };

    // W1.3: Parse optional findings (defensive — gracefully absent)
    const parsedFindings = this.parseNewFindings(raw.newFindings);
    if (parsedFindings.length > 0) {
      result.newFindings = parsedFindings;
    }

    const parsedEvolutions = this.parseFindingEvolutions(raw.findingEvolutions);
    if (parsedEvolutions.length > 0) {
      result.findingEvolutions = parsedEvolutions;
    }

    // D-2.2 round 1.8: parse top-level specificsNeedEmissions (sibling of
    // paragraphUnderstanding). STRICT-PASSTHROUGH per round 1.8 §11.10 —
    // we do NOT defensively coerce malformed emissions. Pass them through
    // to the aggregator's validator (which throws with structured context),
    // producing the audit signal per the no-fallback charter. Defensive
    // coercion would silently mask LLM contract violations.
    const parsedEmissions = this.parseSpecificsNeedEmissions(raw.specificsNeedEmissions);
    if (parsedEmissions.length > 0) {
      result.specificsNeedEmissions = parsedEmissions;
    }

    return result;
  }

  /**
   * D-2.2 round 1.8 — parse top-level specificsNeedEmissions array from
   * walk output. STRICT-PASSTHROUGH: the parser only verifies the wrapper
   * is an array and elements are objects; it does NOT reshape, default-fill,
   * or sanitize emission fields. The downstream aggregator validator
   * (specificsNeedAggregator.ts:validateEmission) throws on malformed
   * emissions with structured context, producing the audit signal per the
   * no-fallback charter (CLAUDE.md §1a + round 1.8 §11.10).
   *
   * Why strict-passthrough vs defensive coercion (the pattern other walk
   * parsers use):
   * - Other parsers (parseParagraphUnderstanding, parseSentenceUnderstandings)
   *   coerce silently to keep the walk going under partial output. Their
   *   gaps don't fail-fast because the walk's findings/connections still
   *   carry signal.
   * - specificsNeedEmissions feed into the queue-mutation pipeline (D-2.7
   *   aggregator → questionQueue → student-facing surface). A silently-
   *   coerced bad emission would land a malformed question in front of
   *   the user. Failing loud at the aggregator is the right discipline.
   */
  private parseSpecificsNeedEmissions(raw: unknown): SpecificsNeedEmission[] {
    if (!Array.isArray(raw)) return [];
    const out: SpecificsNeedEmission[] = [];
    for (const item of raw) {
      if (item && typeof item === 'object') {
        // Cast through unknown — trusting the aggregator validator to throw
        // on shape violations. We do NOT reach into fields here.
        out.push(item as unknown as SpecificsNeedEmission);
      }
    }
    return out;
  }

  /**
   * Parse paragraph understanding.
   */
  private parseParagraphUnderstanding(raw: unknown): ParagraphUnderstanding {
    if (!raw || typeof raw !== 'object') {
      return this.emptyParagraphUnderstanding();
    }
    const obj = raw as Record<string, unknown>;

    return {
      role: this.safeString(obj.role, ''),
      function: this.safeString(obj.function, ''),
      narrativeContribution: this.safeString(obj.narrativeContribution, ''),
      emotionalRegister: this.parseEmotionalRegister(obj.emotionalRegister),
      craftProfile: this.parseCraftProfile(obj.craftProfile),
    };
  }

  private parseEmotionalRegister(raw: unknown): ParagraphUnderstanding['emotionalRegister'] {
    if (!raw || typeof raw !== 'object') {
      return {
        dominantEmotion: '',
        depth: '',
        authenticity: '',
        showVsTell: '',
        strongestMoment: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      dominantEmotion: this.safeString(obj.dominantEmotion, ''),
      depth: this.safeString(obj.depth, ''),
      authenticity: this.safeString(obj.authenticity, ''),
      showVsTell: this.safeString(obj.showVsTell, ''),
      strongestMoment: typeof obj.strongestMoment === 'string' ? obj.strongestMoment : null,
    };
  }

  private parseCraftProfile(raw: unknown): ParagraphUnderstanding['craftProfile'] {
    if (!raw || typeof raw !== 'object') {
      return {
        rhythmPattern: '',
        imageUsage: '',
        voiceConsistency: '',
        standoutMoment: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythmPattern: this.safeString(obj.rhythmPattern, ''),
      imageUsage: this.safeString(obj.imageUsage, ''),
      voiceConsistency: this.safeString(obj.voiceConsistency, ''),
      standoutMoment: typeof obj.standoutMoment === 'string' ? obj.standoutMoment : null,
    };
  }

  /**
   * Parse sentence understandings from Phase 1 walk output.
   * Phase 1 format: fields are directly on the sentence item (no `understanding` sub-object).
   * Builds backward-compatible SentenceUnderstanding objects with bridge data for
   * consumers not yet migrated from observation arrays.
   */
  private parseSentenceUnderstandings(
    raw: unknown,
    sentences: string[],
    paragraphIndex: number, // Scope 2 Phase 5: needed for candidate ID generation
  ): UnderstandingWalkOutput['sentenceUnderstandings'] {
    const parsed: UnderstandingWalkOutput['sentenceUnderstandings'] = [];
    const rawArray = Array.isArray(raw) ? raw : [];

    // Build a map from the LLM's output keyed by index
    const llmByIndex = new Map<number, Record<string, unknown>>();
    for (const item of rawArray) {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const idx = typeof obj.index === 'number' ? obj.index : -1;
        if (idx >= 0) {
          llmByIndex.set(idx, obj);
        }
      }
    }

    // Ensure every sentence has an entry
    for (let i = 0; i < sentences.length; i++) {
      const llmData = llmByIndex.get(i);
      // Phase 1: fields are directly on the item (no `understanding` sub-object)
      // Fall back to `understanding` sub-object for backward compat with Phase 0 output
      const source = llmData?.primaryFunction !== undefined ? llmData : llmData?.understanding;
      parsed.push({
        index: i,
        understanding: this.parseSentenceUnderstanding(source, paragraphIndex, i),
      });
    }

    return parsed;
  }

  /**
   * Parse a single sentence's understanding from LLM output.
   * Phase 1: builds backward-compatible SentenceUnderstanding from lightweight fields.
   * Bridge: synthesizes minimal ObservationEntry[] from primaryFunction for consumers
   * not yet migrated from observation arrays.
   *
   * Scope 2 Phase 5: Also parses the optional `improvementCandidate` field
   * when the LLM emits one. Requires paragraphIndex + sentenceIndex for
   * deterministic candidate ID generation.
   */
  private parseSentenceUnderstanding(
    raw: unknown,
    paragraphIndex: number,
    sentenceIndex: number,
  ): SentenceUnderstanding {
    if (!raw || typeof raw !== 'object') {
      return this.emptySentenceUnderstanding();
    }
    const obj = raw as Record<string, unknown>;

    // Extract primaryFunction and significance (Phase 1 primary fields)
    const primaryFunction = typeof obj.primaryFunction === 'string' && obj.primaryFunction.length > 0
      ? obj.primaryFunction : undefined;
    const validSignificance = ['pivotal', 'contributing', 'transitional'];
    const significance = typeof obj.significance === 'string' && validSignificance.includes(obj.significance)
      ? obj.significance as 'pivotal' | 'contributing' | 'transitional' : undefined;

    // Phase 1 backward compatibility bridge:
    // Synthesize minimal observation arrays from primaryFunction for consumers
    // not yet migrated (L6 coaching, focused analyzer, etc.)
    const bridgeObservations: ObservationEntry[] = primaryFunction
      ? [{ observation: primaryFunction, confidence: 1.0, evidence: '(derived from primaryFunction)' }]
      : this.parseObservationEntries(obj.observedFunctions); // fallback to Phase 0 format

    const result: SentenceUnderstanding = {
      // Bridge: observation arrays derived from primaryFunction (or Phase 0 fallback)
      observedFunctions: bridgeObservations,
      inferredIntents: this.parseObservationEntries(obj.inferredIntents), // empty in Phase 1, populated in Phase 0
      narrativeContributions: this.parseObservationEntries(obj.narrativeContributions), // empty in Phase 1
      rhetoricalFunctions: this.safeStringArray(obj.rhetoricalFunctions),
      paragraphContribution: primaryFunction ?? this.safeString(obj.paragraphContribution, ''),
      craft: this.parseSentenceCraft(obj.craft),
      significantChoices: this.parseSignificantChoices(obj.significantChoices),
      connectionRefs: this.safeStringArray(obj.connectionRefs),
      findingRefs: [],
      tags: this.safeStringArray(obj.tags),
    };

    // Set Phase 0+ fields
    if (primaryFunction) {
      result.primaryFunction = primaryFunction;
    }
    if (significance) {
      result.significance = significance;
    }

    // Scope 2 Phase 5: parse improvementCandidate if present
    const rawCand = obj.improvementCandidate;
    if (rawCand && typeof rawCand === 'object' && rawCand !== null) {
      const c = rawCand as Record<string, unknown>;
      const observation = typeof c.observation === 'string' ? c.observation.trim() : '';
      const suggestedChange = typeof c.suggestedChange === 'string' ? c.suggestedChange.trim() : '';

      // Only emit if both required fields carry substantive content
      if (observation.length > 0 && suggestedChange.length > 0) {
        const techniqueRaw = typeof c.technique === 'string' ? c.technique : null;
        const technique = normalizeTechnique(techniqueRaw);
        const validCV: ReadonlyArray<ImprovementCandidate['coachingValue']> = [
          'critical',
          'high',
          'medium',
          'contextual',
          'diagnostic',
        ];
        const coachingValue: ImprovementCandidate['coachingValue'] =
          typeof c.coachingValue === 'string' &&
          (validCV as readonly string[]).includes(c.coachingValue)
            ? (c.coachingValue as ImprovementCandidate['coachingValue'])
            : 'medium';
        result.improvementCandidate = {
          id: ImprovementCandidateStore.buildId('L3', paragraphIndex, sentenceIndex, observation),
          sourceLayer: 'L3',
          paragraph: paragraphIndex,
          sentence: sentenceIndex,
          sourceFindingId: null,
          observation,
          suggestedChange,
          technique,
          demonstrationSketch:
            typeof c.demonstrationSketch === 'string' && c.demonstrationSketch.trim().length > 0
              ? c.demonstrationSketch.trim()
              : null,
          coachingValue,
          lifecycleState: 'candidate',
          supersededBy: null,
          createdAt: new Date().toISOString(),
        };
      } else {
        result.improvementCandidate = null;
      }
    } else {
      result.improvementCandidate = null;
    }

    return result;
  }

  private parseObservationEntries(raw: unknown): ObservationEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
      )
      .map(item => ({
        observation: this.safeString(item.observation, ''),
        confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
        evidence: typeof item.evidence === 'string' ? item.evidence : '',
      }))
      .filter(entry => entry.observation.length > 0);
  }

  /**
   * Parse a SentenceCraft block from raw LLM output.
   *
   * Scope 1 Phase 1:
   *   - `rhythm` is a closed enum (RhythmTag). Since strict mode is off,
   *     the type contract is not enforced at compile time — this parser
   *     actively normalizes arbitrary LLM prose to a valid RhythmTag value,
   *     falling back to '' (uncharacterized) when no match.
   *   - `voiceAlignment` is dropped from output. Persisted old profiles
   *     that still carry the field are ignored (optional on the type).
   */
  private parseSentenceCraft(raw: unknown): SentenceCraft {
    if (!raw || typeof raw !== 'object') {
      return { rhythm: '', techniques: [] };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythm: normalizeRhythmTag(obj.rhythm),
      techniques: this.safeStringArray(obj.techniques),
    };
  }

  private parseSignificantChoices(raw: unknown): Array<{ word: string; significance: string }> {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
      )
      .map(item => ({
        word: this.safeString(item.word, ''),
        significance: this.safeString(item.significance, ''),
      }))
      .filter(entry => entry.word.length > 0);
  }

  /**
   * Parse holistic evolution — only fields that actually changed.
   */
  private parseHolisticEvolution(raw: unknown): UnderstandingWalkOutput['holisticEvolution'] {
    if (!raw || typeof raw !== 'object') {
      return {};
    }
    const obj = raw as Record<string, unknown>;
    const result: UnderstandingWalkOutput['holisticEvolution'] = {};

    if (typeof obj.centralThesis === 'string' && obj.centralThesis.length > 0) {
      result.centralThesis = obj.centralThesis;
    }
    if (typeof obj.thesisConfidence === 'number') {
      result.thesisConfidence = Math.max(0, Math.min(1, obj.thesisConfidence));
    }
    if (typeof obj.voiceSignature === 'string' && obj.voiceSignature.length > 0) {
      result.voiceSignature = obj.voiceSignature;
    }
    if (typeof obj.arcMomentum === 'string' && obj.arcMomentum.length > 0) {
      result.arcMomentum = obj.arcMomentum;
    }

    return result;
  }

  /**
   * Parse prior sentence updates (back-propagation).
   * Each update replaces the ENTIRE observation arrays for that sentence.
   */
  private parsePriorSentenceUpdates(
    raw: unknown,
  ): UnderstandingWalkOutput['priorSentenceUpdates'] {
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
      )
      .map(item => {
        const update: UnderstandingWalkOutput['priorSentenceUpdates'][number] = {
          paragraph: typeof item.paragraph === 'number' ? item.paragraph : -1,
          sentence: typeof item.sentence === 'number' ? item.sentence : -1,
        };

        // Only include arrays that are actually provided (supersession is wholesale replacement)
        if (Array.isArray(item.observedFunctions)) {
          update.observedFunctions = this.parseObservationEntries(item.observedFunctions);
        }
        if (Array.isArray(item.inferredIntents)) {
          update.inferredIntents = this.parseObservationEntries(item.inferredIntents);
        }
        if (Array.isArray(item.narrativeContributions)) {
          update.narrativeContributions = this.parseObservationEntries(item.narrativeContributions);
        }
        if (Array.isArray(item.newTags)) {
          update.newTags = this.safeStringArray(item.newTags);
        }

        // Phase 0: Extract primaryFunction and significance
        if (typeof item.primaryFunction === 'string' && item.primaryFunction.length > 0) {
          update.primaryFunction = item.primaryFunction;
        }
        const validSig = ['pivotal', 'contributing', 'transitional'];
        if (typeof item.significance === 'string' && validSig.includes(item.significance)) {
          update.significance = item.significance as 'pivotal' | 'contributing' | 'transitional';
        }

        return update;
      })
      .filter(update => update.paragraph >= 0 && update.sentence >= 0);
  }

  /**
   * Parse new connections discovered during this paragraph's analysis.
   */
  private parseNewConnections(
    raw: unknown,
    currentParagraphIndex: number,
  ): UnderstandingWalkOutput['newConnections'] {
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
      )
      .map(item => ({
        from: this.parseConnectionEndpoint(item.from),
        to: this.parseConnectionEndpoint(item.to),
        description: this.safeString(item.description, ''),
        reverseIllumination: typeof item.reverseIllumination === 'string' ? item.reverseIllumination : null,
        significance: this.safeString(item.significance, ''),
        strengthCategory: this.parseStrengthCategory(item.strengthCategory),
        directionality: this.parseDirectionality(item.directionality),
      }))
      .filter(conn =>
        conn.from.paragraph >= 0 &&
        conn.to.paragraph >= 0 &&
        conn.description.length > 0 &&
        (conn.from.paragraph <= currentParagraphIndex && conn.to.paragraph <= currentParagraphIndex)
      );
  }

  private parseConnectionEndpoint(raw: unknown): ConnectionEndpoint {
    if (Array.isArray(raw) && raw.length >= 2) {
      // Backward compat: [paragraph, sentence] tuple
      return { paragraph: Number(raw[0]) || 0, sentence: Number(raw[1]) || 0, label: '' };
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      return {
        paragraph: typeof obj.paragraph === 'number' ? obj.paragraph : 0,
        sentence: typeof obj.sentence === 'number' ? obj.sentence : undefined,
        label: typeof obj.label === 'string' ? obj.label : '',
      };
    }
    return { paragraph: 0, sentence: 0, label: '' };
  }

  private parseStrengthCategory(raw: unknown): ConnectionStrengthCategory {
    const valid: ConnectionStrengthCategory[] = ['foundational', 'significant', 'supporting', 'tentative'];
    if (typeof raw === 'string' && valid.includes(raw as ConnectionStrengthCategory)) {
      return raw as ConnectionStrengthCategory;
    }
    return 'supporting'; // Default for walk-discovered connections
  }

  private parseDirectionality(raw: unknown): ConnectionDirectionality {
    const valid: ConnectionDirectionality[] = ['forward', 'reverse', 'bidirectional', 'asymmetric'];
    if (typeof raw === 'string' && valid.includes(raw as ConnectionDirectionality)) {
      return raw as ConnectionDirectionality;
    }
    return 'forward'; // Default
  }

  // ══════════════════════════════════════════════════════════════════════════
  // W1.3: FINDING PARSING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Parse new findings from walk LLM output.
   * Defensive: missing or malformed findings are silently skipped.
   */
  private parseNewFindings(
    raw: unknown,
  ): NonNullable<UnderstandingWalkOutput['newFindings']> {
    if (!Array.isArray(raw)) return [];

    const VALID_SCOPE_TYPES = ['word', 'sentence', 'sentence_group', 'paragraph', 'cross_paragraph', 'essay_level'] as const;
    const VALID_MATURITIES: FindingMaturity[] = ['hypothesis', 'developing', 'confirmed', 'deepened'];
    const VALID_COACHING_VALUES: FindingCoachingValue[] = ['critical', 'high', 'medium', 'contextual', 'diagnostic'];
    const VALID_DIMENSIONS: HolisticDimension[] = ['voice', 'emotion', 'theme', 'narrative', 'character', 'craft', 'admissions', 'structure'];

    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && typeof item.claim === 'string' && item.claim.length > 0,
      )
      .map(item => {
        // Parse scope
        const rawScope = item.scope as Record<string, unknown> | undefined;
        const scopeType = rawScope?.type;
        const scope: FindingScope = {
          type: (typeof scopeType === 'string' && VALID_SCOPE_TYPES.includes(scopeType as typeof VALID_SCOPE_TYPES[number]))
            ? scopeType as FindingScope['type']
            : 'paragraph',
          textEvidence: this.parseFindingTextEvidence(rawScope?.textEvidence),
        };
        if (typeof rawScope?.paragraph === 'number') scope.paragraph = rawScope.paragraph;
        if (Array.isArray(rawScope?.sentences)) scope.sentences = rawScope.sentences.filter((s): s is number => typeof s === 'number');
        if (Array.isArray(rawScope?.paragraphs)) scope.paragraphs = rawScope.paragraphs.filter((p): p is number => typeof p === 'number');

        // Parse maturity
        const rawMaturity = String(item.maturity ?? 'hypothesis');
        const maturity: FindingMaturity = VALID_MATURITIES.includes(rawMaturity as FindingMaturity)
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
          .filter(d => VALID_DIMENSIONS.includes(d as HolisticDimension)) as HolisticDimension[];

        // Parse evidence
        const evidence = this.parseFindingEvidence(item.evidence);

        const finding: NonNullable<UnderstandingWalkOutput['newFindings']>[number] = {
          claim: String(item.claim),
          scope,
          maturity,
          maturityReasoning: this.safeString(item.maturityReasoning, ''),
          coachingValue,
          dimensions,
          evidence,
          deepeningPotential: typeof item.deepeningPotential === 'string' ? item.deepeningPotential : null,
          raisesQuestions: this.safeStringArray(item.raisesQuestions),
        };

        // Optional relationship references
        if (Array.isArray(item.buildsOn) && item.buildsOn.length > 0) {
          finding.buildsOn = this.safeStringArray(item.buildsOn);
        }
        if (Array.isArray(item.relatedTo) && item.relatedTo.length > 0) {
          finding.relatedTo = this.safeStringArray(item.relatedTo);
        }

        return finding;
      })
      .filter(f => f.claim.length > 0 && f.evidence.length > 0);
  }

  /**
   * Parse finding evolutions from walk LLM output.
   * Defensive: missing or malformed evolutions are silently skipped.
   */
  private parseFindingEvolutions(
    raw: unknown,
  ): NonNullable<UnderstandingWalkOutput['findingEvolutions']> {
    if (!Array.isArray(raw)) return [];

    const VALID_MATURITIES: FindingMaturity[] = ['hypothesis', 'developing', 'confirmed', 'deepened', 'superseded'];

    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' &&
        typeof item.findingId === 'string' && item.findingId.length > 0,
      )
      .map(item => {
        const rawMaturity = String(item.newMaturity ?? 'developing');
        const newMaturity: FindingMaturity = VALID_MATURITIES.includes(rawMaturity as FindingMaturity)
          ? rawMaturity as FindingMaturity
          : 'developing';

        const evo: NonNullable<UnderstandingWalkOutput['findingEvolutions']>[number] = {
          findingId: String(item.findingId),
          newMaturity,
          reasoning: this.safeString(item.reasoning, ''),
        };

        if (typeof item.supersedes === 'string' && item.supersedes.length > 0) {
          evo.supersedes = item.supersedes;
        }

        return evo;
      })
      .filter(e => e.findingId.length > 0 && e.reasoning.length > 0);
  }

  /**
   * Parse finding evidence array from LLM output.
   */
  private parseFindingEvidence(raw: unknown): FindingEvidence[] {
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

  /**
   * Parse finding scope textEvidence from LLM output.
   */
  private parseFindingTextEvidence(
    raw: unknown,
  ): FindingScope['textEvidence'] {
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

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE APPLICATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Apply walk output to the profile in-place.
   * This enables subsequent paragraph calls to see the accumulated understanding
   * via the Profile Router's context assembly.
   *
   * Note: This is a lightweight in-memory application — the full mutation pipeline
   * (via Profile Manager/coordinator) runs after the walk completes.
   * Here we update just enough for context assembly to work.
   */
  private applyWalkOutputToProfile(
    profile: EssayProfile,
    paragraphIndex: number,
    output: UnderstandingWalkOutput,
  ): void {
    // Ensure paragraph profile exists
    while (profile.paragraphs.length <= paragraphIndex) {
      profile.paragraphs.push(this.emptyParagraphProfile(profile.paragraphs.length));
    }

    const para = profile.paragraphs[paragraphIndex];

    // Apply paragraph understanding
    para.understanding = output.paragraphUnderstanding;

    // D-2.2 round 1.8: copy specifics-need emissions onto the paragraph's
    // ParagraphUnderstanding (D-2.7 storage location at profileTypes.ts:850).
    // Top-level walk output → nested profile storage; D-2.8's integration
    // helper reads from this nested location at Phase 5.6. Concept library
    // append + post-walk consolidation step run later (§11.11/12) — this
    // write is the raw landing pad before consolidation trims.
    if (output.specificsNeedEmissions && output.specificsNeedEmissions.length > 0) {
      para.understanding.specificsNeedEmissions = output.specificsNeedEmissions;
    }

    // Apply sentence understandings
    for (const sentenceOutput of output.sentenceUnderstandings) {
      // Ensure sentence profile exists
      while (para.sentences.length <= sentenceOutput.index) {
        para.sentences.push({
          index: para.sentences.length,
          text: '',
          understanding: null,
          analysis: null,
        });
      }
      para.sentences[sentenceOutput.index].understanding = sentenceOutput.understanding;
    }

    // Apply back-propagation to earlier paragraphs
    for (const update of output.priorSentenceUpdates) {
      const targetPara = profile.paragraphs[update.paragraph];
      if (!targetPara) continue;
      const targetSentence = targetPara.sentences[update.sentence];
      if (!targetSentence) continue;

      // Ensure understanding exists
      if (!targetSentence.understanding) {
        targetSentence.understanding = this.emptySentenceUnderstanding();
      }

      const u = targetSentence.understanding;
      // Supersession: entire arrays REPLACED
      if (update.observedFunctions) {
        u.observedFunctions = update.observedFunctions;
      }
      if (update.inferredIntents) {
        u.inferredIntents = update.inferredIntents;
      }
      if (update.narrativeContributions) {
        u.narrativeContributions = update.narrativeContributions;
      }
      // Tags: additive with deduplication
      if (update.newTags) {
        for (const tag of update.newTags) {
          if (!u.tags.includes(tag)) {
            u.tags.push(tag);
          }
        }
      }

      // Phase 0: new fields
      if (update.primaryFunction) {
        u.primaryFunction = update.primaryFunction;
      }
      if (update.significance) {
        u.significance = update.significance;
      }
    }

    // Apply new connections to the profile's connection store
    for (const conn of output.newConnections) {
      const connectionId = `conn_l3_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newConnection: Connection = {
        id: connectionId,
        from: conn.from,
        to: conn.to,
        description: conn.description,
        reverseIllumination: conn.reverseIllumination,
        routingTags: [],  // System infers from description
        significance: conn.significance,
        strengthCategory: conn.strengthCategory,
        directionality: conn.directionality,
        discoveredBy: 'walk',
        status: 'active',
        relatedFindings: [],
        createdAt: new Date().toISOString(),
      };
      profile.connections.all.push(newConnection);

      // Update connectionRefs on endpoint sentences
      if (conn.from.sentence !== undefined) {
        this.addConnectionRefToSentence(profile, conn.from.paragraph, conn.from.sentence, connectionId);
      }
      if (conn.to.sentence !== undefined) {
        this.addConnectionRefToSentence(profile, conn.to.paragraph, conn.to.sentence, connectionId);
      }

      // Update connectionGraph in the index
      profile.index.connectionGraph.push({
        id: connectionId,
        from: { paragraph: conn.from.paragraph, sentence: conn.from.sentence },
        to: { paragraph: conn.to.paragraph, sentence: conn.to.sentence },
        routingTags: newConnection.routingTags,
        strengthCategory: conn.strengthCategory,
        status: 'active',
      });
    }

    // Update profile index paragraph digest
    this.updateParagraphDigest(profile, paragraphIndex);
  }

  /**
   * Add a connection reference to a sentence's understanding.
   */
  private addConnectionRefToSentence(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    connectionId: string,
  ): void {
    const para = profile.paragraphs[paragraphIndex];
    if (!para) return;
    const sentence = para.sentences[sentenceIndex];
    if (!sentence) return;
    if (!sentence.understanding) return;
    if (!sentence.understanding.connectionRefs.includes(connectionId)) {
      sentence.understanding.connectionRefs.push(connectionId);
    }
  }

  /**
   * Update the paragraph digest in the ProfileIndex after applying walk output.
   */
  private updateParagraphDigest(
    profile: EssayProfile,
    paragraphIndex: number,
  ): void {
    const para = profile.paragraphs[paragraphIndex];
    if (!para) return;

    // Ensure digest array is large enough
    while (profile.index.paragraphDigest.length <= paragraphIndex) {
      profile.index.paragraphDigest.push({
        index: profile.index.paragraphDigest.length,
        roleSummary: '',
        tags: [],
        themes: [],
        sentenceCount: 0,
        hasStrengths: false,
        hasWeaknesses: false,
        connectionCount: 0,
        improvementPriority: 0,
      });
    }

    const digest = profile.index.paragraphDigest[paragraphIndex];
    digest.roleSummary = para.understanding?.role ?? '';
    digest.tags = para.tags;
    digest.sentenceCount = para.sentences.length;

    // Count active connections involving this paragraph
    digest.connectionCount = profile.connections.all
      .filter(c => c.status === 'active')
      .filter(
        c => c.from.paragraph === paragraphIndex || c.to.paragraph === paragraphIndex,
      ).length;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR HANDLING HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mark a paragraph as skipped in the profile.
   */
  private markParagraphSkipped(
    profile: EssayProfile,
    paragraphIndex: number,
    errorMessage: string,
  ): void {
    while (profile.paragraphs.length <= paragraphIndex) {
      profile.paragraphs.push(this.emptyParagraphProfile(profile.paragraphs.length));
    }

    const marker: WalkSkippedMarker = {
      walkSkipped: true,
      failedAt: 'l3_understanding',
      errorSummary: errorMessage.substring(0, 200),
      failedAtTimestamp: Date.now(),
      retryRequested: false,
    };

    profile.paragraphs[paragraphIndex].walkSkipped = marker;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EMPTY/DEFAULT CONSTRUCTORS
  // ══════════════════════════════════════════════════════════════════════════

  private emptyResult(): L3WalkResult {
    return {
      walkOutputs: [],
      backPropagations: [],
      holisticEvolution: {},
      skippedParagraphs: [],
      cost: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      timingMs: 0,
    };
  }

  private emptyWalkOutput(paragraphIndex: number): UnderstandingWalkOutput {
    return {
      paragraphIndex,
      paragraphUnderstanding: this.emptyParagraphUnderstanding(),
      sentenceUnderstandings: [],
      holisticEvolution: {},
      priorSentenceUpdates: [],
      newConnections: [],
    };
  }

  private emptyParagraphUnderstanding(): ParagraphUnderstanding {
    return {
      role: '',
      function: '',
      narrativeContribution: '',
      emotionalRegister: {
        dominantEmotion: '',
        depth: '',
        authenticity: '',
        showVsTell: '',
        strongestMoment: null,
      },
      craftProfile: {
        rhythmPattern: '',
        imageUsage: '',
        voiceConsistency: '',
        standoutMoment: null,
      },
    };
  }

  private emptySentenceUnderstanding(): SentenceUnderstanding {
    return {
      observedFunctions: [],
      inferredIntents: [],
      narrativeContributions: [],
      rhetoricalFunctions: [],
      paragraphContribution: '',
      craft: { rhythm: '', techniques: [] },
      significantChoices: [],
      connectionRefs: [],
      findingRefs: [],
      tags: [],
    };
  }

  private emptyParagraphProfile(index: number): ParagraphProfile {
    return {
      index,
      text: '',
      tags: [],
      understanding: null,
      analysis: null,
      sentences: [],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAFE PARSING UTILITIES
  // ══════════════════════════════════════════════════════════════════════════

  private safeString(val: unknown, fallback: string): string {
    return typeof val === 'string' ? val : fallback;
  }

  private safeStringArray(val: unknown): string[] {
    if (!Array.isArray(val)) return [];
    return val.filter((item): item is string => typeof item === 'string');
  }

  private parseTuple(val: unknown): [number, number] {
    if (Array.isArray(val) && val.length >= 2 && typeof val[0] === 'number' && typeof val[1] === 'number') {
      return [val[0], val[1]];
    }
    return [-1, -1];
  }
}

/** Singleton instance */
export const sequentialDeepWalkService = new SequentialDeepWalkService();

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// The V1 orchestrator imports { SequentialDeepWalk, sequentialDeepWalk }.
// These aliases keep those imports working while the orchestrator is migrated
// to the V2 API. The V1 API surface (walkEssay taking EssayUnderstanding +
// StructuralCartography) is gone — callers must migrate to the V2 signature
// that takes EssayProfile + StructuralCartography + ConnectionScoutOutput.
// For now, these aliases point to the V2 class/instance so import resolution
// doesn't break the build. Actual call-site migration is a separate task.

/** @deprecated Use SequentialDeepWalkService */
export const SequentialDeepWalk = SequentialDeepWalkService;
/** @deprecated Use sequentialDeepWalkService */
export const sequentialDeepWalk = sequentialDeepWalkService;
