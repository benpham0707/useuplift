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
} from '../profileTypes';

import type { StructuralCartography } from '../types';
import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { ProfileRouter } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { FindingStore } from '../findings/findingStore';
import {
  buildParagraphFindingContext,
  buildFindingReferenceContext,
} from '../findings/findingContextBuilder';
import { normalizeRhythmTag } from './rhythmTag';

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
const SYSTEM_PROMPT = `You are a Literature PhD who has read 10,000 college application essays and can articulate what a casual reader feels but cannot name. You read like an expert: you notice not just WHAT techniques appear, but what their presence REVEALS about the essay's architecture of meaning. Your task is to deeply UNDERSTAND one paragraph at a time, building compound understanding across the essay.

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
        "rhythm": "ONLY for pivotal/contributing sentences. Describe the sentence's rhythmic character: length, clause structure, pacing effect.",
        "voiceAlignment": "How this sentence's voice relates to the essay's dominant voice — same register, shifted, code-switched.",
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
  ]
}

IMPORTANT: "newFindings" is MANDATORY — produce at least one finding for this paragraph. "findingEvolutions" remains optional — produce them when earlier findings should be updated based on this paragraph's evidence.

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
    },
  ): Promise<L3WalkResult> {
    const startTime = Date.now();
    const paragraphs = this.splitIntoParagraphs(essayText);

    if (paragraphs.length === 0) {
      return this.emptyResult();
    }

    const startIndex = options?.startFromParagraph ?? 0;
    const markedEssay = this.buildMarkedEssayText(paragraphs);

    // Accumulation state
    const walkOutputs: UnderstandingWalkOutput[] = [];
    const allBackPropagations: L3WalkResult['backPropagations'] = [];
    const skippedParagraphs: number[] = [];
    let holisticEvolution: L3WalkResult['holisticEvolution'] = {};
    let totalCost = 0;
    const totalTokens = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
    let consecutiveFailures = 0;

    for (let pIdx = startIndex; pIdx < paragraphs.length; pIdx++) {
      // Check consecutive failure threshold
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error(
          `[SequentialDeepWalk] Aborting walk: ${consecutiveFailures} consecutive failures. ` +
          `Last successful paragraph: P${pIdx - consecutiveFailures}. Remaining: P${pIdx}-P${paragraphs.length}.`,
        );
        // Mark remaining paragraphs as skipped
        for (let remaining = pIdx; remaining < paragraphs.length; remaining++) {
          skippedParagraphs.push(remaining);
          this.markParagraphSkipped(profile, remaining, 'Walk aborted after consecutive failures');
        }
        break;
      }

      try {
        // 1. Assemble context via Profile Router
        const assembledContext = this.router.assembleContext(profile, {
          rule: 'l3_understanding_walk',
          paragraphIndex: pIdx,
          tokenBudget: 3000,
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
        );

        // 3. Call Sonnet — dynamically scale output tokens by sentence count
        const sentenceCount = this.splitIntoSentences(paragraphs[pIdx]).length;
        const walkMaxTokens = computeWalkMaxTokens(sentenceCount);
        const response = await callClaude<Record<string, unknown>>({
          model: SONNET,
          systemPrompt: SYSTEM_PROMPT,
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
        // No retry — count as consecutive failure immediately
        consecutiveFailures++;
        skippedParagraphs.push(pIdx);

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[SequentialDeepWalk] P${pIdx + 1}/${paragraphs.length} FAILED ` +
          `(consecutive: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${errorMessage}`,
        );

        this.markParagraphSkipped(profile, pIdx, errorMessage);

        // Push a minimal walk output so indices stay aligned
        walkOutputs.push(this.emptyWalkOutput(pIdx));
      }
    }

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
  ): string {
    const sections: string[] = [];

    // ── RE-ANALYSIS CONTEXT (injected once at the start, first paragraph only) ──
    if (reanalysisContext) {
      sections.push('=== RE-ANALYSIS CONTEXT (these areas changed — prioritize them) ===');
      sections.push(reanalysisContext);
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

    return result;
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
        understanding: this.parseSentenceUnderstanding(source),
      });
    }

    return parsed;
  }

  /**
   * Parse a single sentence's understanding from LLM output.
   * Phase 1: builds backward-compatible SentenceUnderstanding from lightweight fields.
   * Bridge: synthesizes minimal ObservationEntry[] from primaryFunction for consumers
   * not yet migrated from observation arrays.
   */
  private parseSentenceUnderstanding(raw: unknown): SentenceUnderstanding {
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
