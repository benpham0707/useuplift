/**
 * Full-Context Re-Reader — Targeted Paragraph Re-Reading with Full Essay Context
 *
 * When L3.75 flags a paragraph for re-reading (because the walk's sequential
 * reading missed something visible from the full-context view), this service
 * re-reads that single paragraph with:
 *   - The full essay text
 *   - The current reading strategy
 *   - The current synthesis
 *   - The walk's original reading of that paragraph
 *
 * Combines the walk's local attention (sentence-by-sentence close reading)
 * with L3.75's full-context view. Understanding only — no evaluation.
 *
 * Input: single paragraph flagged by L3.75's reReadCandidates
 * Output: ReReadResult with updated understanding, findings, connections
 *
 * Types: src/services/essayIntelligence/profileTypes.ts (ReReadResult)
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import { normalizeRhythmTag } from './rhythmTag';
import type {
  ReReadResult,
  EssayProfile,
  ReadingStrategy,
  HolisticSynthesisOutput,
  ParagraphUnderstanding,
  SentenceUnderstanding,
  ConnectionEndpoint,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  FindingScope,
  FindingMaturity,
  FindingCoachingValue,
  FindingEvidence,
  HolisticDimension,
  ObservationEntry,
  SentenceCraft,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const REREAD_TEMPERATURE = 0.3;
const REREAD_MAX_TOKENS = 6000;
const REREAD_TIMEOUT_MS = 120_000;

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are a Literature PhD who has read 10,000 college application essays. You are RE-READING one paragraph with the advantage of knowing the FULL essay.

=== YOUR UNIQUE ADVANTAGE ===

The sequential walk read this paragraph WITHOUT knowing what comes later. It built understanding forward, paragraph by paragraph. YOU see the COMPLETE essay — every paragraph, every sentence, the full narrative arc. Your job: produce an UPDATED understanding of this paragraph that incorporates what the full essay reveals about it.

=== FOCUS AREAS ===

1. HOW LATER CONTEXT CHANGES MEANING: The walk read P2 before seeing P5. If P5 transforms what P2 means (a setup becomes a payoff, an image becomes a symbol, a casual detail becomes the emotional core), capture that.

2. CONNECTIONS THE WALK COULDN'T SEE: The walk can only look backward. You can see the full connection graph. What structural parallels, image recurrences, thematic echoes, or callbacks involve this paragraph?

3. FUNCTIONS VISIBLE ONLY FROM THE FULL PICTURE: Some paragraph functions only become apparent when you see the whole essay. A paragraph that seemed like scene-setting might actually be the essay's epistemological frame. A transition paragraph might be doing the essay's most important thematic work.

=== CRITICAL CONSTRAINT — Understanding Only (Anti-Contamination) ===

You describe WHAT the essay IS and HOW it works. You NEVER evaluate how WELL anything works. That is a separate system's job.

FORBIDDEN VOCABULARY (evaluation contamination):
"effective", "effectively", "strong", "strongly", "weak", "weakly", "compelling", "powerful", "poor", "excellent", "impressive", "beautiful", "clumsy", "awkward", "masterful", "skillful", "skillfully", "brilliant", "mediocre", "lackluster", "flawed", "successful", "unsuccessful", "well-crafted", "poorly", "fails to", "succeeds in", "nicely", "appropriately"

=== DEPTH OF UNDERSTANDING ===

Aim for ARCHITECTURAL depth — what observations REVEAL about how the essay makes meaning:

SURFACE (insufficient): "This sentence uses concrete imagery."
STRUCTURAL (closer): "This sentence's sensory registers construct a world organized around physical transactions."
ARCHITECTURAL (what we need): "The specific sensory registers chosen construct a world organized around physical transactions — establishing that this narrator understands value through what can be touched. When the grandmother's story arrives as pure oral narrative, it disrupts this framework: memory cannot be held under a loupe. The clash between these epistemologies IS the essay's central tension, and it starts here."

=== EVIDENCE GROUNDING ===

Every observation MUST cite specific text — quote the actual words. If you cannot quote specific words for an observation, the observation is too abstract. Rewrite it with evidence or delete it.

=== INDEX CONVENTION ===

The essay is labeled with 1-based indices (P1, S1) for human readability in the prompt, but ALL JSON output uses 0-based indices. P1 → paragraphIndex: 0. S1 → index: 0.

=== OUTPUT SCHEMA ===

Return a JSON object matching this EXACT structure:

{
  "updatedUnderstanding": {
    "role": "What this paragraph DOES in the essay's architecture — updated with full-context knowledge",
    "function": "What the paragraph achieves — may change when you see the full arc",
    "narrativeContribution": "How it advances thesis, serves emotional arc, carries thematic threads — with full-context specificity",
    "emotionalRegister": {
      "dominantEmotion": "Named precisely, e.g. 'quiet determination born of suppressed grief'",
      "depth": "How the emotion manifests — through action, imagery, reflection, physical sensation, dialogue, silence",
      "authenticity": "How the emotion is conveyed — shown through specifics vs stated abstractly. DESCRIBE the mechanism.",
      "showVsTell": "Whether emotion is embodied in concrete sensory detail or asserted in abstract language. Cite specific moments.",
      "strongestMoment": "The sentence or phrase where emotion is most concentrated — quote it, or null"
    },
    "craftProfile": {
      "rhythmPattern": "Describe the specific rhythm with full-context awareness of how it relates to the essay's overall rhythm strategy",
      "imageUsage": "What images appear, what they do here, and how they connect to images elsewhere in the full essay",
      "voiceConsistency": "How voice here relates to the essay's complete voice arc — not just adjacent paragraphs",
      "standoutMoment": "The most distinctive craft choice — what it IS, or null"
    }
  },
  "updatedSentences": [
    {
      "index": 0,
      "understanding": {
        "primaryFunction": "One-line: the single most important thing this sentence does in the essay's architecture, updated with full-context knowledge",
        "significance": "pivotal | contributing | transitional",
        "craft": {
          "rhythm": "ONE enum value from: short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay. Empty string for transitional sentences.",
          "techniques": ["technique1", "technique2"]
        },
        "significantChoices": [
          { "word": "specific word", "significance": "what this choice achieves in context" }
        ],
        "tags": ["semantic_tag1", "semantic_tag2"]
      }
    }
  ],
  "findings": [
    {
      "claim": "A referenceable claim about the essay — only if warranted",
      "scope": {
        "type": "paragraph | cross_paragraph | sentence | sentence_group | word | essay_level",
        "paragraph": 0,
        "sentences": [0, 1]
      },
      "maturity": "hypothesis | developing | confirmed | deepened",
      "maturityReasoning": "Why this maturity level",
      "coachingValue": "critical | high | medium | contextual | diagnostic",
      "dimensions": ["voice", "theme"],
      "evidence": [
        { "text": "quoted text or absence description", "location": { "paragraph": 0, "sentence": 1 }, "type": "present" }
      ],
      "deepeningPotential": "What deeper investigation might reveal, or null",
      "raisesQuestions": ["question this finding raises"],
      "buildsOn": [],
      "relatedTo": []
    }
  ],
  "newConnections": [
    {
      "from": { "paragraph": 0, "sentence": 1, "label": "brief label" },
      "to": { "paragraph": 3, "sentence": 0, "label": "brief label" },
      "description": "What the connection IS — specific and evidence-grounded",
      "reverseIllumination": "How endpoint B illuminates endpoint A (or null)",
      "significance": "What this connection reveals about the essay's architecture of meaning",
      "strengthCategory": "foundational | significant | supporting | tentative",
      "directionality": "forward | reverse | bidirectional | asymmetric"
    }
  ],
  "discoveryNote": "1-3 sentences: what the re-read with full context revealed that the sequential walk missed"
}

IMPORTANT:
- Include ALL sentences in the paragraph in updatedSentences, not just changed ones. The re-read produces the authoritative full-context understanding.
- findings and newConnections arrays may be empty if nothing warranting them was discovered. Do NOT force findings.
- discoveryNote is REQUIRED — it should articulate the specific insight gained from full-context re-reading.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build the user prompt for the re-read call.
 * Includes full essay, target paragraph, walk's original reading,
 * current synthesis, reading strategy, and re-read reason.
 */
function buildUserPrompt(
  paragraphIndex: number,
  essayText: string,
  profile: EssayProfile,
  currentSynthesis: HolisticSynthesisOutput,
  readingStrategy: ReadingStrategy,
  reReadReason: string,
): string {
  const paragraph = profile.paragraphs[paragraphIndex];
  if (!paragraph) {
    throw new Error(`[FullContextReReader] Paragraph ${paragraphIndex} not found in profile (${profile.paragraphs.length} paragraphs)`);
  }

  // Format the full essay with paragraph markers (1-based for human readability)
  const formattedEssay = profile.paragraphs
    .map((p, i) => `[P${i + 1}] ${p.text}`)
    .join('\n\n');

  // Format the walk's original understanding of this paragraph
  const originalUnderstanding = paragraph.understanding
    ? formatParagraphUnderstanding(paragraph.understanding)
    : '(No understanding was produced by the walk for this paragraph)';

  // Format sentence understandings from the walk (supports both new primaryFunction and legacy observation arrays)
  const originalSentences = paragraph.sentences
    .map((s, i) => {
      if (!s.understanding) return `  S${i + 1}: (no understanding)`;
      const func = s.understanding.primaryFunction
        ?? s.understanding.observedFunctions?.map(o => o.observation).join('; ')
        ?? 'not yet analyzed';
      const sig = s.understanding.significance ?? 'contributing';
      const craft = s.understanding.craft?.techniques?.length
        ? s.understanding.craft.techniques.join(', ')
        : 'none noted';
      const tags = s.understanding.tags?.length
        ? s.understanding.tags.join(', ')
        : 'none';
      return `  S${i + 1}: "${s.text}"\n    Function: ${func} [${sig}], Craft: ${craft}, Tags: ${tags}`;
    })
    .join('\n');

  // Format current synthesis (condensed — key sections only)
  const synthesisContext = formatSynthesisContext(currentSynthesis);

  // Format reading strategy
  const strategyContext = [
    `Strategy: ${readingStrategy.strategy}`,
    `Best approach: ${readingStrategy.bestApproach}`,
    `Anti-patterns: ${readingStrategy.antiPatterns.join(', ')}`,
    `Context priorities: ${readingStrategy.contextPriorities.join(', ')}`,
  ].join('\n');

  return [
    '=== FULL ESSAY TEXT ===\n',
    formattedEssay,
    `\n\n=== PARAGRAPH BEING RE-READ: P${paragraphIndex + 1} ===\n`,
    `"${paragraph.text}"`,
    `\n\n=== WHY THIS PARAGRAPH WAS FLAGGED FOR RE-READING ===\n`,
    reReadReason,
    `\n\n=== WALK'S ORIGINAL READING OF P${paragraphIndex + 1} ===\n`,
    originalUnderstanding,
    `\n\nSentence-level understanding from walk:\n`,
    originalSentences,
    `\n\n=== CURRENT HOLISTIC SYNTHESIS (from L3.75) ===\n`,
    synthesisContext,
    `\n\n=== READING STRATEGY ===\n`,
    strategyContext,
    `\n\nNow re-read P${paragraphIndex + 1} (0-based index: ${paragraphIndex}) with the advantage of the full essay context. What did the sequential walk miss?`,
  ].join('');
}

/**
 * Format a ParagraphUnderstanding into a readable string for the prompt.
 */
function formatParagraphUnderstanding(u: ParagraphUnderstanding): string {
  return [
    `Role: ${u.role}`,
    `Function: ${u.function}`,
    `Narrative contribution: ${u.narrativeContribution}`,
    `Emotional register: ${u.emotionalRegister.dominantEmotion} (depth: ${u.emotionalRegister.depth}, show-vs-tell: ${u.emotionalRegister.showVsTell})`,
    `Craft: rhythm=${u.craftProfile.rhythmPattern}, imagery=${u.craftProfile.imageUsage}`,
  ].join('\n');
}

/**
 * Format the holistic synthesis into a condensed context block.
 * Includes the key sections that inform full-context re-reading.
 */
function formatSynthesisContext(synthesis: HolisticSynthesisOutput): string {
  const sections: string[] = [];

  if (synthesis.voiceIdentity) {
    sections.push(`Voice: ${synthesis.voiceIdentity.signature}`);
    if (synthesis.voiceIdentity.evolution) {
      sections.push(`Voice evolution: ${synthesis.voiceIdentity.evolution}`);
    }
  }

  if (synthesis.emotionalTopography) {
    sections.push(`Emotional arc: ${synthesis.emotionalTopography.arcTrajectory ?? '(not mapped)'}`);
  }

  if (synthesis.thematicArchitecture) {
    const themes = synthesis.thematicArchitecture.threads
      ?.map(t => t.thread ?? '(unnamed)')
      .join(', ');
    if (themes) {
      sections.push(`Thematic threads: ${themes}`);
    }
    if (synthesis.thematicArchitecture.centralThesis) {
      sections.push(`Central thesis: ${synthesis.thematicArchitecture.centralThesis}`);
    }
    if (synthesis.thematicArchitecture.contradictions?.length) {
      sections.push(`Tensions: ${synthesis.thematicArchitecture.contradictions.join('; ')}`);
    }
  }

  if (synthesis.narrativeStrategy) {
    sections.push(`Narrative strategy: ${synthesis.narrativeStrategy.primaryStrategy ?? '(not mapped)'}`);
    if (synthesis.narrativeStrategy.turningPoint) {
      sections.push(`Turning point: P${synthesis.narrativeStrategy.turningPoint.paragraph}S${synthesis.narrativeStrategy.turningPoint.sentence}`);
    }
  }

  if (synthesis.admissionsPositioning) {
    sections.push(`Tellability: ${synthesis.admissionsPositioning.tellabilitySummary ?? '(none)'}`);
  }

  return sections.length > 0
    ? sections.join('\n')
    : '(No synthesis available yet)';
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Run a targeted re-read of a single paragraph with full essay context.
 *
 * Called when L3.75 flags a paragraph for re-reading because the walk's
 * sequential reading missed something that the full-context view reveals.
 * Combines the walk's local attention with L3.75's global perspective.
 *
 * @param paragraphIndex - 0-based index of the paragraph to re-read
 * @param essayText - Full essay text (with or without paragraph markers)
 * @param profile - Current EssayProfile with walk understanding populated
 * @param currentSynthesis - L3.75's holistic synthesis output
 * @param readingStrategy - L3.75's reading strategy for this essay
 * @param reReadReason - Why L3.75 flagged this paragraph for re-reading
 * @returns ReReadResult with updated understanding, findings, connections, and cost
 */
export async function runTargetedReRead(
  paragraphIndex: number,
  essayText: string,
  profile: EssayProfile,
  currentSynthesis: HolisticSynthesisOutput,
  readingStrategy: ReadingStrategy,
  reReadReason: string,
): Promise<ReReadResult> {
  const startTime = Date.now();

  // Validate paragraph index
  if (paragraphIndex < 0 || paragraphIndex >= profile.paragraphs.length) {
    throw new Error(
      `[FullContextReReader] Invalid paragraphIndex ${paragraphIndex} — ` +
      `profile has ${profile.paragraphs.length} paragraphs (valid range: 0-${profile.paragraphs.length - 1})`,
    );
  }

  const paragraph = profile.paragraphs[paragraphIndex];
  const sentenceCount = paragraph.sentences.length;

  console.log(
    `[FullContextReReader] Re-reading P${paragraphIndex} (${sentenceCount} sentences) — ` +
    `reason: ${reReadReason.slice(0, 100)}${reReadReason.length > 100 ? '...' : ''}`,
  );

  const userPrompt = buildUserPrompt(
    paragraphIndex,
    essayText,
    profile,
    currentSynthesis,
    readingStrategy,
    reReadReason,
  );

  try {
    const response: ClaudeResponse<string> = await callClaudeWithRetry<string>({
      model: SONNET,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: REREAD_MAX_TOKENS,
      temperature: REREAD_TEMPERATURE,
      timeoutMs: REREAD_TIMEOUT_MS,
      useJsonMode: false, // Parse manually for better error recovery
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    // Parse and validate
    const parsed = parseLlmJsonOutput(response.content, `FullContextReReader P${paragraphIndex}`);
    const validated = validateAndCoerce(parsed, paragraphIndex, sentenceCount);

    console.log(
      `[FullContextReReader] P${paragraphIndex} complete — ` +
      `${response.usage.input_tokens.toLocaleString()} input + ` +
      `${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}, ` +
      `${validated.newConnections.length} connections, ` +
      `${validated.findings.length} findings, ` +
      `time=${timingMs}ms`,
    );

    return {
      paragraphIndex,
      updatedUnderstanding: validated.updatedUnderstanding,
      updatedSentences: validated.updatedSentences,
      findings: validated.findings,
      newConnections: validated.newConnections,
      discoveryNote: validated.discoveryNote,
      cost,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      timingMs,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const timingMs = Date.now() - startTime;
    console.error(
      `[FullContextReReader] P${paragraphIndex} failed after ${timingMs}ms: ${errorMsg}`,
    );
    throw new Error(`[FullContextReReader] Re-read failed for P${paragraphIndex}: ${errorMsg}`);
  }
}

// ============================================================================
// VALIDATION & COERCION
// ============================================================================

/**
 * Validate and coerce the parsed LLM output into the expected shape.
 * Ensures all required fields exist with reasonable defaults where safe.
 */
function validateAndCoerce(
  raw: Record<string, unknown>,
  paragraphIndex: number,
  sentenceCount: number,
): {
  updatedUnderstanding: ParagraphUnderstanding;
  updatedSentences: Array<{ index: number; understanding: SentenceUnderstanding }>;
  findings: ReReadResult['findings'];
  newConnections: ReReadResult['newConnections'];
  discoveryNote: string;
} {
  // -- Updated understanding --
  const rawUnderstanding = raw.updatedUnderstanding as Record<string, unknown> | undefined;
  if (!rawUnderstanding) {
    throw new Error(`[FullContextReReader] Missing updatedUnderstanding in LLM output for P${paragraphIndex}`);
  }
  const updatedUnderstanding = coerceParagraphUnderstanding(rawUnderstanding);

  // -- Updated sentences --
  const rawSentences = ensureArray(raw.updatedSentences);
  const updatedSentences: Array<{ index: number; understanding: SentenceUnderstanding }> = [];
  for (const rawSentence of rawSentences) {
    const s = rawSentence as Record<string, unknown>;
    const idx = Number(s.index);
    if (isNaN(idx) || idx < 0 || idx >= sentenceCount) {
      console.warn(
        `[FullContextReReader] Skipping sentence with invalid index ${s.index} ` +
        `(valid range: 0-${sentenceCount - 1}) in P${paragraphIndex}`,
      );
      continue;
    }
    const understanding = coerceSentenceUnderstanding(s.understanding as Record<string, unknown>);
    updatedSentences.push({ index: idx, understanding });
  }

  // -- Findings --
  const findings = ensureArray(raw.findings).map((f: Record<string, unknown>) =>
    coerceFinding(f, paragraphIndex),
  );

  // -- New connections --
  const newConnections = ensureArray(raw.newConnections).map((c: Record<string, unknown>) =>
    coerceConnection(c),
  );

  // -- Discovery note --
  const discoveryNote = typeof raw.discoveryNote === 'string' && raw.discoveryNote.trim()
    ? raw.discoveryNote.trim()
    : '(No discovery note provided by LLM)';

  return {
    updatedUnderstanding,
    updatedSentences,
    findings,
    newConnections,
    discoveryNote,
  };
}

// ============================================================================
// COERCION HELPERS
// ============================================================================

function ensureArray(val: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(val)) return val as Array<Record<string, unknown>>;
  return [];
}

function ensureString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function ensureNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function coerceParagraphUnderstanding(raw: Record<string, unknown>): ParagraphUnderstanding {
  const emotional = (raw.emotionalRegister ?? {}) as Record<string, unknown>;
  const craft = (raw.craftProfile ?? {}) as Record<string, unknown>;

  return {
    role: ensureString(raw.role, '(not provided)'),
    function: ensureString(raw.function, '(not provided)'),
    narrativeContribution: ensureString(raw.narrativeContribution, '(not provided)'),
    emotionalRegister: {
      dominantEmotion: ensureString(emotional.dominantEmotion, '(not provided)'),
      depth: ensureString(emotional.depth, '(not provided)'),
      authenticity: ensureString(emotional.authenticity, '(not provided)'),
      showVsTell: ensureString(emotional.showVsTell, '(not provided)'),
      strongestMoment: emotional.strongestMoment != null
        ? ensureString(emotional.strongestMoment)
        : null,
    },
    craftProfile: {
      rhythmPattern: ensureString(craft.rhythmPattern, '(not provided)'),
      imageUsage: ensureString(craft.imageUsage, '(not provided)'),
      voiceConsistency: ensureString(craft.voiceConsistency, '(not provided)'),
      standoutMoment: craft.standoutMoment != null
        ? ensureString(craft.standoutMoment)
        : null,
    },
  };
}

function coerceSentenceUnderstanding(raw: Record<string, unknown> | undefined): SentenceUnderstanding {
  if (!raw) {
    return {
      observedFunctions: [],
      inferredIntents: [],
      narrativeContributions: [],
      rhetoricalFunctions: [],
      paragraphContribution: '(not provided)',
      craft: { rhythm: '', techniques: [] },
      significantChoices: [],
      connectionRefs: [],
      findingRefs: [],
      tags: [],
    };
  }

  // Read new findings-format fields
  const primaryFunction = typeof raw.primaryFunction === 'string' ? raw.primaryFunction : undefined;
  const significance = typeof raw.significance === 'string'
    ? raw.significance as 'pivotal' | 'contributing' | 'transitional'
    : undefined;

  // Bridge: synthesize observedFunctions from primaryFunction for remaining consumers.
  // If primaryFunction is NOT present, fall back to reading observedFunctions (backward compat).
  const observedFunctions: ObservationEntry[] = primaryFunction
    ? [{ observation: String(primaryFunction), confidence: 1.0, evidence: '(from re-reader primaryFunction)' }]
    : ensureArray(raw.observedFunctions).map(coerceObservation);

  // inferredIntents and narrativeContributions are no longer produced by the re-reader.
  // Fall back to legacy arrays only if primaryFunction is absent (backward compat for older re-reads).
  const inferredIntents: ObservationEntry[] = primaryFunction
    ? []
    : ensureArray(raw.inferredIntents).map(coerceObservation);
  const narrativeContributions: ObservationEntry[] = primaryFunction
    ? []
    : ensureArray(raw.narrativeContributions).map(coerceObservation);

  return {
    primaryFunction,
    significance,
    observedFunctions,
    inferredIntents,
    narrativeContributions,
    rhetoricalFunctions: Array.isArray(raw.rhetoricalFunctions)
      ? (raw.rhetoricalFunctions as unknown[]).map(String)
      : [],
    paragraphContribution: ensureString(raw.paragraphContribution, '(not provided)'),
    craft: coerceSentenceCraft(raw.craft as Record<string, unknown> | undefined),
    significantChoices: ensureArray(raw.significantChoices).map((sc) => ({
      word: ensureString(sc.word),
      significance: ensureString(sc.significance),
    })),
    connectionRefs: Array.isArray(raw.connectionRefs)
      ? (raw.connectionRefs as unknown[]).map(String)
      : [],
    findingRefs: [], // System-derived, not LLM-produced
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [],
  };
}

function coerceObservation(raw: Record<string, unknown>): ObservationEntry {
  return {
    observation: ensureString(raw.observation, '(empty observation)'),
    confidence: Math.max(0, Math.min(1, ensureNumber(raw.confidence, 0.7))),
    evidence: ensureString(raw.evidence, ''),
  };
}

function coerceSentenceCraft(raw: Record<string, unknown> | undefined): SentenceCraft {
  // Scope 1 Phase 1: rhythm is normalized to a RhythmTag enum value at
  // runtime (strict mode is off, so the type alone can't enforce it).
  // voiceAlignment is dropped from output; legacy profiles that still
  // carry it pass through via the optional field on the type.
  if (!raw) return { rhythm: '', techniques: [] };
  return {
    rhythm: normalizeRhythmTag(raw.rhythm),
    techniques: Array.isArray(raw.techniques) ? (raw.techniques as unknown[]).map(String) : [],
  };
}

function coerceFinding(
  raw: Record<string, unknown>,
  defaultParagraph: number,
): ReReadResult['findings'][number] {
  const rawScope = (raw.scope ?? {}) as Record<string, unknown>;
  const scopeType = ensureString(rawScope.type, 'paragraph') as FindingScope['type'];

  return {
    claim: ensureString(raw.claim, '(empty claim)'),
    scope: {
      type: scopeType,
      paragraph: rawScope.paragraph != null ? Number(rawScope.paragraph) : defaultParagraph,
      sentences: Array.isArray(rawScope.sentences)
        ? (rawScope.sentences as unknown[]).map(Number)
        : undefined,
      paragraphs: Array.isArray(rawScope.paragraphs)
        ? (rawScope.paragraphs as unknown[]).map(Number)
        : undefined,
      textEvidence: ensureArray(rawScope.textEvidence).map((te) => ({
        text: ensureString(te.text, ''),
        location: {
          paragraph: Number((te.location as Record<string, unknown>)?.paragraph ?? defaultParagraph),
          sentence: (te.location as Record<string, unknown>)?.sentence != null
            ? Number((te.location as Record<string, unknown>)?.sentence)
            : undefined,
        },
      })),
    },
    maturity: ensureString(raw.maturity, 'hypothesis') as FindingMaturity,
    maturityReasoning: ensureString(raw.maturityReasoning, ''),
    coachingValue: ensureString(raw.coachingValue, 'medium') as FindingCoachingValue,
    dimensions: Array.isArray(raw.dimensions)
      ? (raw.dimensions as unknown[]).map(String) as HolisticDimension[]
      : [],
    evidence: ensureArray(raw.evidence).map((e) => ({
      text: ensureString(e.text, ''),
      location: e.location
        ? {
            paragraph: Number((e.location as Record<string, unknown>).paragraph ?? 0),
            sentence: (e.location as Record<string, unknown>).sentence != null
              ? Number((e.location as Record<string, unknown>).sentence)
              : undefined,
          }
        : undefined,
      type: ensureString(e.type, 'present') as 'present' | 'absent',
    })),
    deepeningPotential: raw.deepeningPotential != null
      ? ensureString(raw.deepeningPotential)
      : null,
    raisesQuestions: Array.isArray(raw.raisesQuestions)
      ? (raw.raisesQuestions as unknown[]).map(String)
      : [],
    buildsOn: Array.isArray(raw.buildsOn)
      ? (raw.buildsOn as unknown[]).map(String)
      : undefined,
    relatedTo: Array.isArray(raw.relatedTo)
      ? (raw.relatedTo as unknown[]).map(String)
      : undefined,
  };
}

function coerceConnection(
  raw: Record<string, unknown>,
): ReReadResult['newConnections'][number] {
  const rawFrom = (raw.from ?? {}) as Record<string, unknown>;
  const rawTo = (raw.to ?? {}) as Record<string, unknown>;

  return {
    from: {
      paragraph: Number(rawFrom.paragraph ?? 0),
      sentence: rawFrom.sentence != null ? Number(rawFrom.sentence) : undefined,
      label: ensureString(rawFrom.label, ''),
    },
    to: {
      paragraph: Number(rawTo.paragraph ?? 0),
      sentence: rawTo.sentence != null ? Number(rawTo.sentence) : undefined,
      label: ensureString(rawTo.label, ''),
    },
    description: ensureString(raw.description, '(no description)'),
    reverseIllumination: raw.reverseIllumination != null
      ? ensureString(raw.reverseIllumination)
      : null,
    significance: ensureString(raw.significance, '(no significance provided)'),
    strengthCategory: ensureString(raw.strengthCategory, 'supporting') as ConnectionStrengthCategory,
    directionality: ensureString(raw.directionality, 'bidirectional') as ConnectionDirectionality,
  };
}
