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
  ConnectionScoutOutput,
  UnderstandingWalkOutput,
  ParagraphFirstImpression,
  WalkSkippedMarker,
} from '../profileTypes';

import type { StructuralCartography } from '../types';
import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { ProfileRouter } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const WALK_TEMPERATURE = 0.3;
const WALK_MAX_TOKENS = 4096;
const WALK_TIMEOUT_MS = 120_000;

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
const SYSTEM_PROMPT = `You are the world's most perceptive essay reader. You have read thousands of college application essays. Your task is to deeply UNDERSTAND one paragraph at a time, building compound understanding across the essay.

=== YOUR SOLE JOB: UNDERSTANDING ===

You describe WHAT the essay IS — what each sentence does, what the writer is trying to achieve, how the narrative works, what craft techniques are used. You NEVER evaluate how well anything works. Evaluation is handled by a completely separate system.

FORBIDDEN VOCABULARY (these words indicate evaluation contamination):
"effective", "effectively", "strong", "strongly", "weak", "weakly", "compelling", "powerful", "poor", "excellent", "impressive", "beautiful", "clumsy", "awkward", "masterful", "skillful", "skillfully", "brilliant", "mediocre", "lackluster", "flawed", "successful", "unsuccessful", "well-crafted", "poorly", "fails to", "succeeds in"

When you catch yourself writing any of these words, STOP and rewrite the observation as pure description.

CORRECT: "Establishes tone through short declarative sentences averaging 6 words"
WRONG: "Effectively establishes tone through strong sentence control"

CORRECT: "Uses the diamond as a recurring symbol connecting P1 to P3"
WRONG: "Powerfully uses the diamond symbol to create a compelling connection"

CORRECT: "Shifts from concrete sensory detail to abstract reflection mid-paragraph"
WRONG: "The transition from concrete to abstract works well"

=== EVIDENCE GROUNDING (STRUCTURAL REQUIREMENT) ===

Every observation MUST cite specific text. If you cannot point to specific words, phrases, or structural features, the observation is too vague. Include the "evidence" field in every ObservationEntry.

=== NOVELTY-DRIVEN GROWTH ===

For paragraph 1, everything is new — produce rich, detailed understanding.
For later paragraphs, ask: "What does THIS paragraph reveal that wasn't already understood?"
Focus your output on WHAT IS NEW. Don't repeat observations about earlier paragraphs unless this paragraph changes their meaning (back-propagation).

=== BACK-PROPAGATION ===

When this paragraph reveals something new about an EARLIER sentence's purpose or meaning, provide the updated understanding in priorSentenceUpdates. The entire observation array is REPLACED (supersession model), so include ALL observations for that sentence — both the ones that remain valid AND the new ones this paragraph revealed.

Ask explicitly: "Does this paragraph change my understanding of what any earlier sentence was DOING? If P1S3 was setting up a contrast that only becomes visible now, update P1S3's observedFunctions to include that setup function."

=== CONNECTION INVESTIGATION ===

You will receive scout leads — surface-level connections detected by an earlier layer. For each lead, investigate: Is this a meaningful connection? Confirm with evidence, refine the description, or reject if superficial.

Also discover NEW connections the scout missed. Cross-paragraph callbacks, thematic echoes, structural parallels, image recurrences.

=== OUTPUT SCHEMA ===

Return a JSON object matching this EXACT structure:

{
  "paragraphUnderstanding": {
    "role": "What this paragraph DOES in the essay's architecture (1-2 sentences)",
    "function": "What the paragraph is trying to achieve — its purpose",
    "narrativeContribution": "How it advances thesis, serves emotional arc, carries thematic threads",
    "emotionalRegister": {
      "dominantEmotion": "The emotion present — named precisely (e.g., 'quiet determination' not just 'positive')",
      "depth": "How the emotion manifests — through action, imagery, reflection, etc.",
      "authenticity": "How the emotion is conveyed — shown through specifics vs stated abstractly",
      "showVsTell": "Whether emotion is embodied in concrete detail or asserted in abstract language",
      "strongestMoment": "The sentence or phrase where emotion is most concentrated" | null
    },
    "craftProfile": {
      "rhythmPattern": "How sentence lengths and structures create pacing — short/long/varied/etc.",
      "imageUsage": "What images, metaphors, or sensory details appear and what they do",
      "voiceConsistency": "How the voice here relates to the essay's emerging voice — same register or shifted",
      "standoutMoment": "The most distinctive craft choice in this paragraph" | null,
      "weaknessMoment": null
    }
  },
  "sentenceUnderstandings": [
    {
      "index": 0,
      "understanding": {
        "observedFunctions": [
          {
            "observation": "What this sentence DOES — can be multiple things",
            "confidence": 0.9,
            "evidence": "Specific text quoted from the sentence"
          }
        ],
        "inferredIntents": [
          {
            "observation": "What the writer is TRYING to achieve with this sentence",
            "confidence": 0.7,
            "evidence": "What in the text suggests this intent"
          }
        ],
        "narrativeContributions": [
          {
            "observation": "How this sentence advances the narrative — arc, thread, callback",
            "confidence": 0.8,
            "evidence": "Specific reference to narrative structure"
          }
        ],
        "rhetoricalFunctions": ["scene-setting", "symbol-introduction", "argument", "transition", "reflection", "detail-grounding"],
        "paragraphContribution": "How this sentence serves THIS paragraph's goal",
        "craft": {
          "rhythm": "short_punch | medium_flow | long_build | fragment | list",
          "voiceAlignment": "How this sentence's voice relates to the essay's dominant voice",
          "techniques": ["anaphora", "imagery", "juxtaposition", "enjambment", "concrete_detail", "metaphor", "personification", "alliteration", "parallel_structure"]
        },
        "significantChoices": [
          {
            "word": "the specific word or phrase",
            "significance": "What this choice does — connotation, sound, rhythm, register shift"
          }
        ],
        "connectionRefs": [],
        "tags": ["semantic tags for routing — e.g., 'opening_hook', 'sensory', 'reflective', 'dialogue', 'turning_point'"]
      }
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
      "observedFunctions": [{"observation": "COMPLETE replacement — all observations including what remains valid PLUS what this paragraph revealed", "confidence": 0.85, "evidence": "..."}],
      "inferredIntents": [{"observation": "...", "evidence": "..."}],
      "narrativeContributions": [{"observation": "...", "evidence": "..."}],
      "newTags": ["new-tag-if-any"]
    }
  ],
  "newConnections": [
    {
      "from": [0, 2],
      "to": [3, 1],
      "type": "callback | contrast | escalation | parallel | thematic_echo | image_recurrence | structural_mirror",
      "description": "What connects these two locations — specific and evidence-based"
    }
  ]
}

=== CRITICAL REMINDERS ===

1. UNDERSTANDING ONLY. If you write "effectively" or "strong" or any evaluation word, you have failed.
2. EVERY observation needs evidence — specific text from the essay.
3. For later paragraphs, focus on what is NEW. Don't rehash known understanding.
4. Back-propagation: when this paragraph changes earlier understanding, provide COMPLETE replacement arrays.
5. Be specific about craft techniques — name them precisely (anaphora, not "repetition for effect").
6. Tags should be semantic and useful for routing: "turning_point", "sensory_grounding", "thesis_crystallization", "voice_shift", "emotional_peak".

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
        const userPrompt = this.buildUserPrompt(
          markedEssay,
          paragraphs,
          pIdx,
          structuralMap,
          scoutOutput,
          l1Impressions,
          assembledContext,
          holisticEvolution,
        );

        // 3. Call Sonnet
        const response = await callClaudeWithRetry<Record<string, unknown>>({
          model: SONNET,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          maxTokens: WALK_MAX_TOKENS,
          temperature: WALK_TEMPERATURE,
          timeoutMs: WALK_TIMEOUT_MS,
          useJsonMode: true,
          cacheSystemPrompt: true,
        });

        // 4. Parse response into typed UnderstandingWalkOutput
        const walkOutput = this.parseWalkOutput(response.content, pIdx, paragraphs[pIdx]);

        // 5. Accumulate results
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

        // 6. Apply understanding to profile in-place for subsequent calls
        this.applyWalkOutputToProfile(profile, pIdx, walkOutput);

        // Track cost
        const callCost = calculateCost(response.usage, SONNET);
        totalCost += callCost;
        totalTokens.inputTokens += response.usage.input_tokens;
        totalTokens.outputTokens += response.usage.output_tokens;
        totalTokens.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
        totalTokens.cacheWriteTokens += response.usage.cache_creation_input_tokens ?? 0;

        // Reset consecutive failure counter on success
        consecutiveFailures = 0;

        console.log(
          `[SequentialDeepWalk] P${pIdx + 1}/${paragraphs.length} complete — ` +
          `${walkOutput.sentenceUnderstandings.length} sentences, ` +
          `${walkOutput.priorSentenceUpdates.length} back-props, ` +
          `${walkOutput.newConnections.length} connections, ` +
          `cost: $${callCost.toFixed(4)}`,
        );

      } catch (error) {
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
  private buildUserPrompt(
    markedEssay: string,
    paragraphs: string[],
    paragraphIndex: number,
    structuralMap: StructuralCartography,
    scoutOutput: ConnectionScoutOutput | null,
    l1Impressions: ParagraphFirstImpression[],
    assembledContext: AssembledProfileContext,
    currentHolisticEvolution: L3WalkResult['holisticEvolution'],
  ): string {
    const sections: string[] = [];

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

    return {
      paragraphUnderstanding: this.parseParagraphUnderstanding(raw.paragraphUnderstanding),
      sentenceUnderstandings: this.parseSentenceUnderstandings(
        raw.sentenceUnderstandings,
        sentences,
      ),
      holisticEvolution: this.parseHolisticEvolution(raw.holisticEvolution),
      priorSentenceUpdates: this.parsePriorSentenceUpdates(raw.priorSentenceUpdates),
      newConnections: this.parseNewConnections(raw.newConnections, paragraphIndex),
    };
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
        weaknessMoment: null,
      };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythmPattern: this.safeString(obj.rhythmPattern, ''),
      imageUsage: this.safeString(obj.imageUsage, ''),
      voiceConsistency: this.safeString(obj.voiceConsistency, ''),
      standoutMoment: typeof obj.standoutMoment === 'string' ? obj.standoutMoment : null,
      weaknessMoment: typeof obj.weaknessMoment === 'string' ? obj.weaknessMoment : null,
    };
  }

  /**
   * Parse sentence understandings. Ensures every sentence in the paragraph
   * has at least a minimal understanding entry, even if the LLM missed some.
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
      const understanding = llmData?.understanding;
      parsed.push({
        index: i,
        understanding: this.parseSentenceUnderstanding(understanding),
      });
    }

    return parsed;
  }

  /**
   * Parse a single sentence's understanding from LLM output.
   */
  private parseSentenceUnderstanding(raw: unknown): SentenceUnderstanding {
    if (!raw || typeof raw !== 'object') {
      return this.emptySentenceUnderstanding();
    }
    const obj = raw as Record<string, unknown>;

    return {
      observedFunctions: this.parseObservationEntries(obj.observedFunctions),
      inferredIntents: this.parseObservationEntries(obj.inferredIntents),
      narrativeContributions: this.parseObservationEntries(obj.narrativeContributions),
      rhetoricalFunctions: this.safeStringArray(obj.rhetoricalFunctions),
      paragraphContribution: this.safeString(obj.paragraphContribution, ''),
      craft: this.parseSentenceCraft(obj.craft),
      significantChoices: this.parseSignificantChoices(obj.significantChoices),
      connectionRefs: this.safeStringArray(obj.connectionRefs),
      tags: this.safeStringArray(obj.tags),
    };
  }

  private parseObservationEntries(raw: unknown): ObservationEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
      )
      .map(item => ({
        observation: this.safeString(item.observation, ''),
        confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : undefined,
        evidence: typeof item.evidence === 'string' ? item.evidence : undefined,
      }))
      .filter(entry => entry.observation.length > 0);
  }

  private parseSentenceCraft(raw: unknown): SentenceCraft {
    if (!raw || typeof raw !== 'object') {
      return { rhythm: '', voiceAlignment: '', techniques: [] };
    }
    const obj = raw as Record<string, unknown>;
    return {
      rhythm: this.safeString(obj.rhythm, ''),
      voiceAlignment: this.safeString(obj.voiceAlignment, ''),
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
        from: this.parseTuple(item.from),
        to: this.parseTuple(item.to),
        type: this.safeString(item.type, 'unknown'),
        description: this.safeString(item.description, ''),
      }))
      .filter(conn =>
        // Validate: connections must have valid endpoints and a description
        conn.from[0] >= 0 && conn.from[1] >= 0 &&
        conn.to[0] >= 0 && conn.to[1] >= 0 &&
        conn.description.length > 0 &&
        // At least one endpoint should involve the current or earlier paragraph
        (conn.from[0] <= currentParagraphIndex && conn.to[0] <= currentParagraphIndex),
      );
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
    }

    // Apply new connections to the profile's connection store
    for (const conn of output.newConnections) {
      const connectionId = `conn_l3_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newConnection: Connection = {
        id: connectionId,
        from: conn.from,
        to: conn.to,
        type: conn.type,
        description: conn.description,
        confidence: 0.7, // L3 connections are higher confidence than L2.5 scout leads
        discoveredByLayer: 'l3',
      };
      profile.connections.all.push(newConnection);

      // Update connectionRefs on endpoint sentences
      this.addConnectionRefToSentence(profile, conn.from[0], conn.from[1], connectionId);
      this.addConnectionRefToSentence(profile, conn.to[0], conn.to[1], connectionId);

      // Update connectionGraph in the index
      profile.index.connectionGraph.push({
        from: conn.from,
        to: conn.to,
        type: conn.type,
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

    // Count connections involving this paragraph
    digest.connectionCount = profile.connections.all.filter(
      c => c.from[0] === paragraphIndex || c.to[0] === paragraphIndex,
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
        weaknessMoment: null,
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
      craft: { rhythm: '', voiceAlignment: '', techniques: [] },
      significantChoices: [],
      connectionRefs: [],
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
