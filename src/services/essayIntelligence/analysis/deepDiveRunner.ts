/**
 * Deep Dive Runner — executes a single deep dive investigation.
 *
 * Takes a DeepDiveRequest + context, calls Sonnet with the appropriate
 * prompt template from the prompt library, and returns a DeepDiveResult.
 *
 * A deep dive is a focused investigation of a specific question raised
 * during the walk or synthesis. It uses a specialized prompt template
 * (from deepDivePromptLibrary) that targets a particular domain
 * (voice, theme, narrative, etc.) and produces new findings + questions.
 *
 * DESIGN NOTE: Deep dives bypass the ProfileRouter's `assembleDeepDive()` rule
 * and build their own context via buildUserPrompt(). This is intentional:
 * - Deep dive templates declare their own requiredContext (template-specific)
 * - The runner always provides full connection graph + all paragraph understanding
 *   (deep dives need comprehensive, unfiltered context to investigate)
 * - Template placeholders ({essayText}, {synthesis}, {readingStrategy}, etc.)
 *   don't map cleanly to the router's ProfileSection model
 * The router's deep_dive rule exists for future consumers that need router-style
 * context assembly for deep-dive-like operations (e.g., re-reads, focused analysis).
 *
 * Spec: PLAN2.md (deep dive runner section)
 * Types: src/services/essayIntelligence/profileTypes.ts (DeepDiveRequest, DeepDiveResult)
 */

import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import type {
  DeepDiveRequest,
  DeepDiveResult,
  DeepDivePromptTemplate,
  UnderstandingQuestion,
  EssayProfile,
  HolisticSynthesisOutput,
  ReadingStrategy,
  FindingScope,
  FindingMaturity,
  FindingCoachingValue,
  FindingEvidence,
  HolisticDimension,
} from '../profileTypes';
import { getPromptByType } from './deepDivePromptLibrary';
import { FindingStore } from '../findings/findingStore';
import { buildFindingReferenceContext } from '../findings/findingContextBuilder';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const DEEP_DIVE_TEMPERATURE = 0.3;
const DEEP_DIVE_MAX_TOKENS = 4000;
const DEEP_DIVE_TIMEOUT_MS = 120_000;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Execute a single deep dive investigation.
 *
 * Gets the prompt template for the request's promptType, fills in all
 * placeholders with context from the essay, profile, and synthesis,
 * calls Sonnet, and returns the parsed result.
 *
 * On failure, returns a degraded result with empty findings and a
 * discoveryNote explaining what went wrong (never throws).
 *
 * @param request - The deep dive request (question + promptType + rationale)
 * @param essayText - The raw essay text (paragraph markers will be added)
 * @param profile - The current EssayProfile with all understanding populated
 * @param currentSynthesis - The latest holistic synthesis output
 * @param readingStrategy - The reading strategy from L3.75
 * @param findingStore - Optional FindingStore for finding context injection
 * @returns DeepDiveResult with findings, questions, cost, and timing
 */
export async function runDeepDive(
  request: DeepDiveRequest,
  essayText: string,
  profile: EssayProfile,
  currentSynthesis: HolisticSynthesisOutput,
  readingStrategy: ReadingStrategy,
  findingStore?: FindingStore,
): Promise<DeepDiveResult> {
  const startTime = Date.now();

  // ── Step 1: Get the prompt template ──
  const template = getPromptByType(request.promptType);
  if (!template) {
    console.error(
      `[DeepDiveRunner] Unknown prompt type: "${request.promptType}" — ` +
      `question: "${request.question.question}"`
    );
    return buildFailureResult(
      request.promptType,
      `Unknown prompt type "${request.promptType}". No template found in the prompt library.`,
      startTime,
    );
  }

  // ── Step 2: Build the user prompt ──
  const markedEssay = addParagraphMarkers(essayText);
  const userPrompt = buildUserPrompt(
    template,
    markedEssay,
    request,
    profile,
    currentSynthesis,
    readingStrategy,
    findingStore,
  );

  // ── Step 3: Call Sonnet ──
  let response: ClaudeResponse<unknown>;
  try {
    console.log(
      `[DeepDiveRunner] Starting deep dive — ` +
      `promptType: "${request.promptType}", ` +
      `question: "${truncate(request.question.question, 80)}", ` +
      `~${Math.round(userPrompt.length / 4)} estimated input tokens`
    );

    response = await callClaude<unknown>({
      model: SONNET,
      systemPrompt: template.systemPrompt,
      userPrompt,
      maxTokens: DEEP_DIVE_MAX_TOKENS,
      temperature: DEEP_DIVE_TEMPERATURE,
      timeoutMs: DEEP_DIVE_TIMEOUT_MS,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    console.log(
      `[DeepDiveRunner] LLM response received — ` +
      `${response.usage.output_tokens} output tokens, ` +
      `$${calculateCost(response.usage, SONNET).toFixed(4)}, ` +
      `stopReason: ${response.stopReason}`
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[DeepDiveRunner] LLM call failed — ` +
      `promptType: "${request.promptType}", error: ${errMsg}`
    );
    return buildFailureResult(
      request.promptType,
      `LLM call failed: ${errMsg}`,
      startTime,
    );
  }

  // Warn if output was truncated
  if (response.stopReason === 'max_tokens') {
    console.warn(
      `[DeepDiveRunner] WARNING: Output truncated by maxTokens limit — ` +
      `promptType: "${request.promptType}". ` +
      `Some findings or questions may be incomplete.`
    );
  }

  // ── Step 4: Parse and validate ──
  try {
    const parsed = parseLlmJsonOutput(
      response.content,
      `DeepDive ${request.promptType}`,
    );

    const result = coerceDeepDiveOutput(parsed, request.promptType);
    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    console.log(
      `[DeepDiveRunner] Complete — ` +
      `promptType: "${request.promptType}", ` +
      `${result.findings.length} findings, ` +
      `${result.questionsRaised.length} new questions, ` +
      `$${cost.toFixed(4)} cost, ` +
      `${timingMs}ms`
    );

    return {
      promptType: request.promptType,
      findings: result.findings,
      questionsRaised: result.questionsRaised,
      discoveryNote: result.discoveryNote,
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
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[DeepDiveRunner] Parse/validation failed — ` +
      `promptType: "${request.promptType}", error: ${errMsg}`
    );

    // Still report cost for the failed call (tokens were consumed)
    const cost = calculateCost(response.usage, SONNET);
    const timingMs = Date.now() - startTime;

    return {
      promptType: request.promptType,
      findings: [],
      questionsRaised: [],
      discoveryNote: `Deep dive completed but output parsing failed: ${errMsg}`,
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
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Add paragraph markers [P0], [P1], etc. to essay text.
 * Splits on double-newlines and prefixes each paragraph.
 */
export function addParagraphMarkers(essayText: string): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs
    .map((p, i) => `[P${i}] ${p.trim()}`)
    .join('\n\n');
}

/**
 * Build the complete user prompt by replacing template placeholders.
 *
 * Supported placeholders:
 *   {essayText}         — essay with paragraph markers
 *   {question}          — the question being investigated
 *   {synthesis}         — relevant synthesis sections (JSON)
 *   {readingStrategy}   — reading strategy (JSON)
 *   {findingContext}    — existing findings context or empty string
 *   {connectionContext} — connection graph summary
 *   {paragraphContext}  — relevant paragraph understanding
 */
function buildUserPrompt(
  template: DeepDivePromptTemplate,
  markedEssay: string,
  request: DeepDiveRequest,
  profile: EssayProfile,
  currentSynthesis: HolisticSynthesisOutput,
  readingStrategy: ReadingStrategy,
  findingStore?: FindingStore,
): string {
  const synthesisContext = buildSynthesisContext(currentSynthesis, template.requiredContext);
  const findingContext = findingStore
    ? buildFindingReferenceContext(findingStore)
    : '';
  const connectionContext = buildConnectionContext(profile);
  const paragraphContext = buildParagraphContext(profile, request.question);

  let prompt = template.userPrompt;
  prompt = prompt.replace('{essayText}', markedEssay);
  prompt = prompt.replace('{question}', request.question.question);
  prompt = prompt.replace('{synthesis}', synthesisContext);
  prompt = prompt.replace('{readingStrategy}', JSON.stringify(readingStrategy, null, 2));
  prompt = prompt.replace('{findingContext}', findingContext);
  prompt = prompt.replace('{connectionContext}', connectionContext);
  prompt = prompt.replace('{paragraphContext}', paragraphContext);

  return prompt;
}

/**
 * Build synthesis context — only the sections the prompt template requires.
 * Avoids sending irrelevant holistic sections that waste tokens.
 */
function buildSynthesisContext(
  synthesis: HolisticSynthesisOutput,
  requiredContext: string[],
): string {
  if (requiredContext.length === 0) {
    return JSON.stringify(synthesis, null, 2);
  }

  const relevantSections: Record<string, unknown> = {};
  for (const section of requiredContext) {
    const value = (synthesis as Record<string, unknown>)[section];
    if (value !== undefined && value !== null) {
      relevantSections[section] = value;
    }
  }

  return JSON.stringify(relevantSections, null, 2);
}

/**
 * Build a compact connection graph summary for the prompt.
 * Follows the same format used in holisticSynthesis.ts.
 */
function buildConnectionContext(profile: EssayProfile): string {
  const sections: string[] = [];
  const activeConnections = profile.connections.all.filter(c => c.status === 'active');

  if (activeConnections.length === 0) {
    return 'No connections discovered yet.';
  }

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

  if (profile.connections.graphSummary) {
    sections.push(`\nGraph Summary: ${profile.connections.graphSummary}`);
  }

  return sections.join('\n');
}

/**
 * Build paragraph-level understanding context, prioritizing paragraphs
 * relevant to the question being investigated.
 *
 * If the question has an anchorParagraph, that paragraph gets full detail.
 * All other paragraphs get a compact summary (role + function).
 */
function buildParagraphContext(
  profile: EssayProfile,
  question: UnderstandingQuestion,
): string {
  const sections: string[] = [];

  for (const para of profile.paragraphs) {
    if (!para.understanding) {
      sections.push(`[P${para.index}] (not yet analyzed)`);
      continue;
    }

    const isAnchor = question.anchorParagraph === para.index;

    if (isAnchor) {
      // Full detail for anchor paragraph
      sections.push(`[P${para.index}] (ANCHOR — question targets this paragraph)`);
      sections.push(`  Role: ${para.understanding.role}`);
      sections.push(`  Function: ${para.understanding.function}`);
      sections.push(`  Narrative contribution: ${para.understanding.narrativeContribution}`);
      sections.push(`  Emotional register: ${para.understanding.emotionalRegister.dominantEmotion} (depth: ${para.understanding.emotionalRegister.depth}, show/tell: ${para.understanding.emotionalRegister.showVsTell})`);
      sections.push(`  Craft: rhythm=${para.understanding.craftProfile.rhythmPattern}, imagery=${para.understanding.craftProfile.imageUsage}, voice=${para.understanding.craftProfile.voiceConsistency}`);

      // Include sentence-level detail for anchor paragraph
      for (const sent of para.sentences) {
        if (sent.understanding) {
          sections.push(`  [P${para.index}S${sent.index}] "${truncate(sent.text, 80)}"`);

          // Use primaryFunction (Phase 1) or fall back to observations (Phase 0)
          if (sent.understanding.primaryFunction) {
            sections.push(`    Function: ${sent.understanding.primaryFunction} [${sent.understanding.significance ?? 'contributing'}]`);
          } else {
            const funcs = sent.understanding.observedFunctions.map(f => f.observation).join('; ');
            if (funcs) sections.push(`    Functions: ${funcs}`);
          }

          // Craft techniques
          if (sent.understanding.craft?.techniques?.length) {
            sections.push(`    Craft: [${sent.understanding.craft.techniques.join(', ')}]`);
          }

          // Semantic tags
          if (sent.understanding.tags?.length) {
            sections.push(`    Tags: [${sent.understanding.tags.join(', ')}]`);
          }

          // Significant word choices
          if (sent.understanding.significantChoices.length > 0) {
            sections.push(`    Notable words: ${sent.understanding.significantChoices.map(w => `"${w.word}" (${w.significance})`).join(', ')}`);
          }
        }
      }
    } else {
      // Compact summary for non-anchor paragraphs
      sections.push(
        `[P${para.index}] Role: ${para.understanding.role} | ` +
        `Function: ${para.understanding.function} | ` +
        `Emotion: ${para.understanding.emotionalRegister.dominantEmotion}`
      );
    }
  }

  return sections.join('\n');
}

// ============================================================================
// OUTPUT PARSING & COERCION
// ============================================================================

/**
 * Internal parsed output before applying cost/timing.
 */
interface ParsedDeepDiveOutput {
  findings: DeepDiveResult['findings'];
  questionsRaised: UnderstandingQuestion[];
  discoveryNote: string;
}

/**
 * Coerce the raw parsed JSON into a typed DeepDiveOutput.
 * Provides sensible defaults for missing fields and validates structure.
 */
function coerceDeepDiveOutput(
  raw: Record<string, unknown>,
  promptType: string,
): ParsedDeepDiveOutput {
  // ── Findings ──
  const rawFindings = Array.isArray(raw.findings) ? raw.findings : [];
  const findings: DeepDiveResult['findings'] = rawFindings.map((f: unknown, idx: number) => {
    const finding = f as Record<string, unknown>;
    return {
      claim: coerceString(finding.claim, `finding[${idx}].claim`),
      scope: coerceFindingScope(finding.scope),
      maturity: coerceFindingMaturity(finding.maturity),
      maturityReasoning: coerceString(finding.maturityReasoning, `finding[${idx}].maturityReasoning`),
      coachingValue: coerceCoachingValue(finding.coachingValue),
      dimensions: coerceDimensions(finding.dimensions),
      evidence: coerceEvidence(finding.evidence),
      deepeningPotential: typeof finding.deepeningPotential === 'string'
        ? finding.deepeningPotential
        : null,
      raisesQuestions: Array.isArray(finding.raisesQuestions)
        ? (finding.raisesQuestions as unknown[]).filter(q => typeof q === 'string') as string[]
        : [],
      buildsOn: Array.isArray(finding.buildsOn)
        ? (finding.buildsOn as unknown[]).filter(id => typeof id === 'string') as string[]
        : undefined,
      relatedTo: Array.isArray(finding.relatedTo)
        ? (finding.relatedTo as unknown[]).filter(id => typeof id === 'string') as string[]
        : undefined,
    };
  });

  // ── Questions raised ──
  const rawQuestions = Array.isArray(raw.questionsRaised) ? raw.questionsRaised : [];
  const questionsRaised: UnderstandingQuestion[] = rawQuestions.map((q: unknown, idx: number) => {
    const question = q as Record<string, unknown>;
    return {
      id: coerceString(question.id, `question[${idx}].id`),
      question: coerceString(question.question, `question[${idx}].question`),
      dimensions: Array.isArray(question.dimensions)
        ? (question.dimensions as unknown[]).filter(d => typeof d === 'string') as string[]
        : [],
      anchorParagraph: typeof question.anchorParagraph === 'number'
        ? question.anchorParagraph
        : undefined,
      expectedInsight: coerceString(question.expectedInsight, `question[${idx}].expectedInsight`),
      source: 'deep_dive' as const,
      status: 'open' as const,
    };
  });

  // ── Discovery note ──
  const discoveryNote = typeof raw.discoveryNote === 'string' && raw.discoveryNote.length > 0
    ? raw.discoveryNote
    : `Deep dive (${promptType}) completed but no discovery note was provided.`;

  return { findings, questionsRaised, discoveryNote };
}

// ============================================================================
// COERCION HELPERS
// ============================================================================

/** Coerce a value to string with a fallback label. */
function coerceString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  console.warn(`[DeepDiveRunner] Missing or empty string for ${label}, using placeholder.`);
  return `[missing: ${label}]`;
}

/** Coerce a FindingScope from raw LLM output. */
function coerceFindingScope(raw: unknown): FindingScope {
  if (!raw || typeof raw !== 'object') {
    return {
      type: 'essay_level',
      textEvidence: [],
    };
  }
  const obj = raw as Record<string, unknown>;

  const validTypes = ['word', 'sentence', 'sentence_group', 'paragraph', 'cross_paragraph', 'essay_level'] as const;
  const type = validTypes.includes(obj.type as typeof validTypes[number])
    ? obj.type as FindingScope['type']
    : 'essay_level';

  const textEvidence: FindingScope['textEvidence'] = [];
  if (Array.isArray(obj.textEvidence)) {
    for (const te of obj.textEvidence) {
      const item = te as Record<string, unknown>;
      if (typeof item.text === 'string' && item.location && typeof item.location === 'object') {
        const loc = item.location as Record<string, unknown>;
        if (typeof loc.paragraph === 'number') {
          textEvidence.push({
            text: item.text,
            location: {
              paragraph: loc.paragraph,
              ...(typeof loc.sentence === 'number' ? { sentence: loc.sentence } : {}),
            },
          });
        }
      }
    }
  }

  return {
    type,
    ...(typeof obj.paragraph === 'number' ? { paragraph: obj.paragraph } : {}),
    ...(Array.isArray(obj.sentences) ? { sentences: obj.sentences.filter(s => typeof s === 'number') as number[] } : {}),
    ...(Array.isArray(obj.paragraphs) ? { paragraphs: obj.paragraphs.filter(p => typeof p === 'number') as number[] } : {}),
    textEvidence,
  };
}

/** Coerce a FindingMaturity value. */
function coerceFindingMaturity(raw: unknown): FindingMaturity {
  const valid: FindingMaturity[] = ['hypothesis', 'developing', 'confirmed', 'deepened', 'superseded'];
  if (typeof raw === 'string' && valid.includes(raw as FindingMaturity)) {
    return raw as FindingMaturity;
  }
  return 'hypothesis';
}

/** Coerce a FindingCoachingValue value. */
function coerceCoachingValue(raw: unknown): FindingCoachingValue {
  const valid: FindingCoachingValue[] = ['critical', 'high', 'medium', 'contextual', 'diagnostic'];
  if (typeof raw === 'string' && valid.includes(raw as FindingCoachingValue)) {
    return raw as FindingCoachingValue;
  }
  return 'medium';
}

/** Coerce HolisticDimension array. */
function coerceDimensions(raw: unknown): HolisticDimension[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(d => typeof d === 'string') as HolisticDimension[];
}

/** Coerce FindingEvidence array. */
function coerceEvidence(raw: unknown): FindingEvidence[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(e => ({
      text: typeof e.text === 'string' ? e.text : '[no evidence text]',
      ...(e.location && typeof e.location === 'object'
        ? {
            location: {
              paragraph: typeof (e.location as Record<string, unknown>).paragraph === 'number'
                ? (e.location as Record<string, unknown>).paragraph as number
                : 0,
              ...(typeof (e.location as Record<string, unknown>).sentence === 'number'
                ? { sentence: (e.location as Record<string, unknown>).sentence as number }
                : {}),
            },
          }
        : {}),
      type: (e.type === 'present' || e.type === 'absent') ? e.type : 'present',
    }));
}

// ============================================================================
// FAILURE RESULT BUILDER
// ============================================================================

/**
 * Build a DeepDiveResult representing a failed investigation.
 * Reports the failure in discoveryNote, with zero cost and empty findings.
 */
function buildFailureResult(
  promptType: string,
  errorMessage: string,
  startTime: number,
): DeepDiveResult {
  return {
    promptType,
    findings: [],
    questionsRaised: [],
    discoveryNote: `Deep dive failed: ${errorMessage}`,
    cost: 0,
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    timingMs: Date.now() - startTime,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Truncate text to a maximum length, appending "..." if truncated.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
