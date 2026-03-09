/**
 * Layer 2.5: Connection Scout Pass
 *
 * Single Haiku call that performs surface-level cross-paragraph pattern detection.
 * This is a METAL DETECTOR, not an archaeologist. It finds LEADS for L3 to
 * investigate — not conclusions about significance.
 *
 * The scout reports observations: "'diamond' appears in P1S2 and P3S4 in
 * different contexts." L3 decides whether that recurrence is meaningful.
 *
 * Three categories of leads:
 * 1. Repeated elements: words, phrases, images that recur across paragraphs
 * 2. Tonal shifts: where the emotional register changes noticeably
 * 3. Structural echoes: parallel constructions, mirrored openings, callbacks
 *
 * Runs in PARALLEL with L2 (Structural Cartographer) — no dependency between them.
 *
 * Output type: ConnectionScoutOutput (from profileTypes.ts)
 * Consumed by: L3 understanding walk (as investigation leads)
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import type {
  ConnectionScoutOutput,
  ParagraphFirstImpression,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const TEMPERATURE = 0.2;
const MAX_TOKENS = 2000;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface ScoutPassResult {
  scoutOutput: ConnectionScoutOutput;
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
// SYSTEM PROMPT (static, cacheable)
// ============================================================================

/**
 * The scout prompt enforces OBSERVATION-ONLY output through:
 * 1. Role framing: "metal detector" not "literary critic"
 * 2. Explicit constraint against significance claims
 * 3. Negative examples showing overstepping
 * 4. Output structure that requires factual observations, not interpretations
 */
const SYSTEM_PROMPT = `You are a connection scout — a literary metal detector. Your job is to FIND potential cross-paragraph patterns, not to explain them. You beep when you detect something; someone else digs it up.

YOUR THREE DETECTION MODES:

1. REPEATED ELEMENTS: Words, phrases, images, names, or concepts that appear in more than one paragraph. Report WHAT recurs and WHERE.
   GOOD: "'diamond' appears in P1S2 ('grandmother's diamond ring') and P3S4 ('diamond-shaped scar')"
   BAD: "The diamond creates thematic resonance between heritage and pain"
   ← Do NOT claim significance. Just report the recurrence.

2. TONAL SHIFTS: Where the emotional register changes noticeably between or within paragraphs. Report FROM what TO what and WHERE.
   GOOD: "P2 ends with a matter-of-fact tone ('I closed the door'); P3 opens with urgency ('My hands wouldn't stop shaking')"
   BAD: "The tonal shift effectively creates dramatic tension"
   ← Do NOT claim it's effective. Just report the shift.

3. STRUCTURAL ECHOES: Parallel constructions, mirrored sentence structures, repeated syntactic patterns, callbacks to earlier phrasing.
   GOOD: "P1S1 opens with 'I remember' and P5S1 opens with 'I remember' — same construction in different context"
   BAD: "This deliberate callback creates a satisfying frame for the essay"
   ← Do NOT call it deliberate. Do NOT claim it's satisfying. Just report the echo.

CONSTRAINT: If you catch yourself writing "creates," "establishes," "reinforces," "underscores," "demonstrates," or "contributes to" — STOP. You are overstepping. Rephrase as pure observation.

The field "potentialSignificance" for repeated elements means: describe the FACTUAL RELATIONSHIP between the two occurrences. Same meaning? Different context? Literal vs metaphorical? Physical vs emotional? Do NOT judge whether this relationship is intentional or meaningful.

OUTPUT: Valid JSON matching this schema:
{
  "repeatedElements": [
    {
      "element": "<the word, phrase, image, or concept that recurs>",
      "occurrences": [
        { "paragraphIndex": <0-indexed>, "sentenceIndex": <0-indexed> }
      ],
      "potentialSignificance": "<FACTUAL relationship between occurrences — same/different meaning, literal/metaphorical, etc.>"
    }
  ],
  "tonalShifts": [
    {
      "location": { "paragraphIndex": <0-indexed>, "sentenceIndex": <0-indexed> },
      "fromTone": "<what the tone was before this point>",
      "toTone": "<what the tone became at/after this point>",
      "abruptness": "<gradual | sharp>"
    }
  ],
  "structuralEchoes": [
    {
      "source": { "paragraphIndex": <0-indexed>, "sentenceIndex": <0-indexed> },
      "echo": { "paragraphIndex": <0-indexed>, "sentenceIndex": <0-indexed> },
      "echoType": "<what kind of echo: parallel construction, repeated opener, mirrored structure, callback phrase, etc.>"
    }
  ]
}

COMPLETENESS RULES:
- Report ALL repeated elements you find, even minor ones. L3 decides what matters.
- Report tonal shifts between paragraphs AND within paragraphs (mid-paragraph shifts).
- For structural echoes, both source and echo must reference specific paragraph+sentence indices.
- If you find nothing in a category, return an empty array. Do NOT fabricate patterns.
- Maximum 15 repeated elements, 10 tonal shifts, 8 structural echoes. Prioritize the most observable ones if there are more.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildUserPrompt(
  essayText: string,
  impressions: ParagraphFirstImpression[],
): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Build essay with paragraph and sentence markers
  const markedEssay = paragraphs.map((p, pIdx) => {
    const sentences = impressions[pIdx]?.sentences ?? [];
    if (sentences.length > 0) {
      const markedSentences = sentences
        .map(s => `  [S${s.index + 1}] ${s.text}`)
        .join('\n');
      return `[P${pIdx + 1}]\n${markedSentences}`;
    }
    return `[P${pIdx + 1}] ${p.trim()}`;
  }).join('\n\n');

  // Build L1 tone observations for context
  const toneContext = impressions.map((imp, i) => {
    const shifts = imp.sentences.filter(s => s.toneShift);
    const shiftInfo = shifts.length > 0
      ? ` | tone_shifts_at: [${shifts.map(s => `S${s.index + 1}`).join(', ')}]`
      : '';
    return `  P${i + 1}: register="${imp.emotionalRegister}" | voice="${imp.voiceObservation}"${shiftInfo}`;
  }).join('\n');

  return `ESSAY TEXT (${paragraphs.length} paragraphs, sentences marked):
${markedEssay}

L1 TONE OBSERVATIONS:
${toneContext}

Scan for cross-paragraph patterns. Report observations as JSON. Do NOT interpret significance — just report what you find.`;
}

// ============================================================================
// JSON PARSING WITH FALLBACK
// ============================================================================

function parseJsonResponse(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  if (typeof raw === 'string') {
    let jsonString = raw.trim();

    // Direct parse
    try {
      return JSON.parse(jsonString) as Record<string, unknown>;
    } catch {
      // noop
    }

    // Extract from code blocks
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
      try {
        return JSON.parse(jsonString) as Record<string, unknown>;
      } catch {
        // noop
      }
    }

    // Extract largest JSON object
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(jsonString.substring(firstBrace, lastBrace + 1)) as Record<string, unknown>;
      } catch {
        // noop
      }
    }

    throw new Error(`Failed to parse JSON from scout pass response. First 200 chars: ${jsonString.substring(0, 200)}`);
  }

  throw new Error(`Unexpected response type from scout pass: ${typeof raw}`);
}

// ============================================================================
// VALIDATION
// ============================================================================

interface RawLocation {
  paragraphIndex?: unknown;
  sentenceIndex?: unknown;
}

function validateLocation(
  loc: RawLocation | undefined,
  paragraphCount: number,
): { paragraphIndex: number; sentenceIndex: number } | null {
  if (!loc || typeof loc !== 'object') return null;

  const pIdx = Number(loc.paragraphIndex);
  const sIdx = Number(loc.sentenceIndex);

  if (isNaN(pIdx) || pIdx < 0 || pIdx >= paragraphCount) return null;
  if (isNaN(sIdx) || sIdx < 0) return null;

  return { paragraphIndex: pIdx, sentenceIndex: sIdx };
}

function validateScoutOutput(
  raw: Record<string, unknown>,
  paragraphCount: number,
): ConnectionScoutOutput {
  // -- Validate repeated elements --
  const rawRepeated = Array.isArray(raw.repeatedElements)
    ? raw.repeatedElements as Array<Record<string, unknown>>
    : [];

  const repeatedElements: ConnectionScoutOutput['repeatedElements'] = [];
  for (const r of rawRepeated) {
    if (typeof r !== 'object' || r === null) continue;

    const element = typeof r.element === 'string' ? r.element : '';
    if (element.length === 0) continue;

    const rawOccurrences = Array.isArray(r.occurrences)
      ? r.occurrences as Array<Record<string, unknown>>
      : [];

    const occurrences: Array<{ paragraphIndex: number; sentenceIndex: number }> = [];
    for (const occ of rawOccurrences) {
      const loc = validateLocation(occ as RawLocation, paragraphCount);
      if (loc) occurrences.push(loc);
    }

    // Need at least 2 occurrences for a "repeated" element
    if (occurrences.length < 2) continue;

    repeatedElements.push({
      element,
      occurrences,
      potentialSignificance: typeof r.potentialSignificance === 'string'
        ? r.potentialSignificance
        : 'Recurrence observed',
    });
  }

  // -- Validate tonal shifts --
  const rawShifts = Array.isArray(raw.tonalShifts)
    ? raw.tonalShifts as Array<Record<string, unknown>>
    : [];

  const tonalShifts: ConnectionScoutOutput['tonalShifts'] = [];
  for (const s of rawShifts) {
    if (typeof s !== 'object' || s === null) continue;

    const location = validateLocation(s.location as RawLocation | undefined, paragraphCount);
    if (!location) continue;

    const fromTone = typeof s.fromTone === 'string' ? s.fromTone : '';
    const toTone = typeof s.toTone === 'string' ? s.toTone : '';
    if (fromTone.length === 0 || toTone.length === 0) continue;

    const abruptness = s.abruptness === 'sharp' ? 'sharp' as const : 'gradual' as const;

    tonalShifts.push({
      location,
      fromTone,
      toTone,
      abruptness,
    });
  }

  // -- Validate structural echoes --
  const rawEchoes = Array.isArray(raw.structuralEchoes)
    ? raw.structuralEchoes as Array<Record<string, unknown>>
    : [];

  const structuralEchoes: ConnectionScoutOutput['structuralEchoes'] = [];
  for (const e of rawEchoes) {
    if (typeof e !== 'object' || e === null) continue;

    const source = validateLocation(e.source as RawLocation | undefined, paragraphCount);
    const echo = validateLocation(e.echo as RawLocation | undefined, paragraphCount);
    if (!source || !echo) continue;

    const echoType = typeof e.echoType === 'string' ? e.echoType : 'unclassified echo';

    structuralEchoes.push({
      source,
      echo,
      echoType,
    });
  }

  return {
    repeatedElements,
    tonalShifts,
    structuralEchoes,
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class ScoutPassService {
  /**
   * Run L2.5 connection scout on the essay.
   *
   * Takes the full essay text and L1 first impressions.
   * Produces leads for L3 to investigate: repeated elements,
   * tonal shifts, and structural echoes. All observations are
   * purely descriptive — the scout does NOT interpret significance.
   */
  async analyze(
    essayText: string,
    impressions: ParagraphFirstImpression[],
  ): Promise<ScoutPassResult> {
    const startTime = Date.now();
    const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (paragraphs.length === 0) {
      throw new Error('[ScoutPass] Essay text is empty — no paragraphs found');
    }

    // For very short essays (1 paragraph), skip the scout — nothing to connect
    if (paragraphs.length === 1) {
      return {
        scoutOutput: {
          repeatedElements: [],
          tonalShifts: [],
          structuralEchoes: [],
        },
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

    const userPrompt = buildUserPrompt(essayText, impressions);

    const response: ClaudeResponse<Record<string, unknown>> = await callClaudeWithRetry<Record<string, unknown>>(
      {
        model: HAIKU_MODEL,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const parsed = parseJsonResponse(response.content);
    const scoutOutput = validateScoutOutput(parsed, paragraphs.length);
    const cost = calculateCost(response.usage, HAIKU_MODEL);
    const timingMs = Date.now() - startTime;

    // Log summary for diagnostics
    console.log(
      `[ScoutPass] Found ${scoutOutput.repeatedElements.length} repeated elements, ` +
      `${scoutOutput.tonalShifts.length} tonal shifts, ` +
      `${scoutOutput.structuralEchoes.length} structural echoes ` +
      `(${timingMs}ms, $${cost.toFixed(4)})`,
    );

    return {
      scoutOutput,
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

export const scoutPassService = new ScoutPassService();
