/**
 * Layer 2: Structural Cartographer (V2)
 *
 * Single Sonnet call that maps the essay's structural architecture.
 * UPGRADED from V1's Haiku — the structural map is L3's reading guide,
 * so accuracy matters. Sonnet produces deeper structural understanding,
 * better transition quality assessment, more nuanced arc detection,
 * and theme progression tracking with gap identification.
 *
 * The cartography identifies ARCHITECTURAL ROLES, not just topics.
 * "The frame of risk" not "the college scene." "The fulcrum where stakes flip"
 * not "the turning point paragraph."
 *
 * Runs in PARALLEL with L2.5 (Connection Scout) — no dependency between them.
 *
 * Output type: StructuralCartographyOutput (alias for StructuralCartography from types.ts)
 * Consumed by: L3 sequential deep walk, L4 crystallization, profile router
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import { parseLlmJsonOutput } from './llmJsonParser';
import type { StructuralCartography, TransitionQuality } from '../types';
import type { NarrativeArcType } from '../../../workshop/scoring/narrativeAnalyzerTypes';
import type { ParagraphFirstImpression } from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const TEMPERATURE = 0.3;
const MAX_TOKENS = 3000;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface StructuralCartographyResult {
  cartography: StructuralCartography;
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
 * V2 system prompt is significantly deeper than V1. Key improvements:
 * - Demands ARCHITECTURAL ROLES, not topic labels
 * - Requires transition mechanism specificity (not just "functional")
 * - Tracks theme progression with explicit gap identification
 * - Asks for structural necessity ("what breaks if this paragraph is removed?")
 * - Distinguishes between arc shape and arc execution
 */
const SYSTEM_PROMPT = `You are an expert structural architect for college application essays. You specialize in understanding how essays are BUILT — not what they say, but how each piece serves the whole.

YOUR TASK: Given an essay with paragraph markers and L1 first impressions, produce a structural map that serves as L3's reading guide.

CRITICAL DISTINCTION: You identify ARCHITECTURAL ROLES, not topics.
  BAD: "role": "describes the college visit" (topic label)
  GOOD: "role": "frame of risk — establishes the stakes that the rest of the essay tests" (architectural role)

  BAD: "narrativeFunction": "provides backstory"
  GOOD: "narrativeFunction": "anchors the reader in a specific physical moment so that the abstract reflection in P3 has a sensory home to return to"

  BAD: "weaknessFlag": "could be more specific"
  GOOD: "weaknessFlag": "carries the essay's only concrete scene but compresses it into 2 sentences — the architecture needs this to breathe"

You MUST return valid JSON matching this exact schema:

{
  "paragraphRoles": [
    {
      "index": <number, 0-indexed>,
      "role": "<ARCHITECTURAL role: what this paragraph IS in the essay's structure — 'frame of risk', 'value system establishment', 'fulcrum where stakes flip', 'the callback that closes the loop', etc.>",
      "narrativeFunction": "<What this paragraph accomplishes in the narrative arc — how it advances the story/argument/reflection>",
      "strengthContribution": "<What this paragraph contributes that NO other paragraph does — its unique structural necessity>",
      "weaknessFlag": "<Specific structural concern, or null. Frame as architectural: 'the essay's weight-bearing wall is load-bearing too much' not 'this paragraph is too long'>"
    }
  ],
  "arcType": "<man_in_hole | cinderella | icarus | quest | rags_to_riches | ambiguous>",
  "arcConfidence": <0.0-1.0>,
  "arcVerification": "<Assess whether the essay follows a clean arc or defies standard arc classification. If ambiguous, explain what's happening structurally instead of forcing an arc type.>",
  "transitions": [
    {
      "fromParagraph": <number, 0-indexed>,
      "toParagraph": <number, 0-indexed>,
      "quality": "<seamless | functional | abrupt | missing>",
      "mechanism": "<Specific mechanism: 'temporal shift from present to flashback via sensory trigger', 'emotional contrast — contemplative register snaps to urgent action', 'thematic callback to P1's central image', etc. NOT generic labels like 'continuation'.>"
    }
  ],
  "centralTheme": "<The essay's core thematic through-line as a TENSION, not a topic. Not 'family' but 'the gap between inherited values and market values'. Not 'identity' but 'the cost of code-switching between two selves'.>",
  "themeProgression": "<How the theme develops: where it's introduced, where it deepens, where it transforms, where it resolves (or doesn't). Map the progression across specific paragraphs.>",
  "thematicGaps": ["<Threads introduced but not resolved, themes implied but never explored, promises made to the reader that go unfulfilled. Be specific: 'P2 introduces the mother's silence but it never reappears after P3.'>"],
  "pacingNotes": "<Where the essay rushes (compressing important moments), lingers (spending time proportional to significance), or stalls (circling without advancing). Reference specific paragraphs.>",
  "flatSpots": [<paragraph indices (0-indexed) where narrative momentum drops — where the reader's engagement dips>]
}

BANNED ROLE LABELS (too generic — always use essay-specific structural metaphors instead):
"introduction", "body paragraph", "development", "conclusion", "provides context", "establishes", "discusses", "explores", "transitions", "wraps up", "summarizes"

RULES:
- paragraphRoles MUST have exactly one entry per paragraph, in index order
- transitions MUST cover every consecutive paragraph pair
- Be specific: reference actual content, not generic observations
- arcType must match one of the six allowed values exactly
- weaknessFlag should be null for structurally sound paragraphs, not an empty string
- Flat spots are paragraphs where the ARCHITECTURE stalls — not just where the content is less exciting
- Theme must be framed as a TENSION or QUESTION, not a topic word`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildUserPrompt(
  essayText: string,
  impressions: ParagraphFirstImpression[],
): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Build essay text with markers
  const markedEssay = paragraphs
    .map((p, i) => `[P${i + 1}] ${p.trim()}`)
    .join('\n\n');

  // Build L1 impressions summary
  const impressionsSummary = impressions.map((imp, i) => {
    const sentenceCount = imp.sentences.length;
    const toneShifts = imp.sentences.filter(s => s.toneShift).length;
    const notableCount = imp.notablePhrases.length;

    return `  P${i + 1}: purpose="${imp.apparentPurpose}" | emotion="${imp.emotionalRegister}" | voice="${imp.voiceObservation}" | sentences=${sentenceCount} | tone_shifts=${toneShifts} | notable_phrases=${notableCount} | tags=[${imp.tags.join(', ')}]`;
  }).join('\n');

  // Build craft observations
  const craftSummary = impressions.map((imp, i) => {
    if (imp.craftNotices.length === 0) return null;
    return `  P${i + 1}: ${imp.craftNotices.join('; ')}`;
  }).filter(Boolean).join('\n');

  return `ESSAY TEXT (${paragraphs.length} paragraphs):
${markedEssay}

L1 FIRST IMPRESSIONS:
${impressionsSummary}

CRAFT OBSERVATIONS:
${craftSummary || '  (none recorded)'}

Produce the structural map as JSON. Remember: ARCHITECTURAL ROLES, not topic labels.`;
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALID_ARC_TYPES: NarrativeArcType[] = [
  'man_in_hole', 'cinderella', 'icarus', 'quest', 'rags_to_riches', 'ambiguous',
];

const VALID_TRANSITION_QUALITIES: TransitionQuality[] = [
  'seamless', 'functional', 'abrupt', 'missing',
];

function validateCartography(
  raw: Record<string, unknown>,
  expectedParagraphCount: number,
): StructuralCartography {
  // -- Validate paragraph roles --
  const roles = raw.paragraphRoles as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(roles)) {
    throw new Error('paragraphRoles is not an array');
  }

  // Adjust count if mismatched
  if (roles.length !== expectedParagraphCount) {
    console.error(
      `[StructuralCartographer] paragraphRoles count mismatch: got ${roles.length}, expected ${expectedParagraphCount}. L2 output is incomplete — padding with unassessed placeholders.`,
    );
    while (roles.length > expectedParagraphCount) {
      roles.pop();
    }
    while (roles.length < expectedParagraphCount) {
      const idx = roles.length;
      roles.push({
        index: idx,
        role: '[STRUCTURAL ROLE NOT ASSESSED — L2 paragraph count mismatch]',
        narrativeFunction: '[Not assessed — paragraph was missing from L2 output]',
        strengthContribution: '[Not assessed — requires L2 re-analysis]',
        weaknessFlag: null,
      });
    }
  }

  const validatedRoles = roles.map((r, i) => ({
    index: i,
    role: typeof r.role === 'string' ? r.role : '[STRUCTURAL ROLE NOT ASSESSED — L2 role value missing]',
    narrativeFunction: typeof r.narrativeFunction === 'string' ? r.narrativeFunction : '',
    strengthContribution: typeof r.strengthContribution === 'string' ? r.strengthContribution : '',
    weaknessFlag: typeof r.weaknessFlag === 'string' && r.weaknessFlag.length > 0
      ? r.weaknessFlag
      : null,
  }));

  // -- Validate arc type --
  let arcType = raw.arcType as NarrativeArcType;
  if (!VALID_ARC_TYPES.includes(arcType)) {
    arcType = 'ambiguous';
  }

  // -- Validate arc confidence --
  let arcConfidence = Number(raw.arcConfidence);
  if (isNaN(arcConfidence) || arcConfidence < 0 || arcConfidence > 1) {
    arcConfidence = 0.5;
  }

  // -- Validate transitions --
  const rawTransitions = raw.transitions as Array<Record<string, unknown>> | undefined;
  const transitions: StructuralCartography['transitions'] = [];
  if (Array.isArray(rawTransitions)) {
    for (const t of rawTransitions) {
      const from = Number(t.fromParagraph);
      const to = Number(t.toParagraph);
      let quality = t.quality as TransitionQuality;
      if (!VALID_TRANSITION_QUALITIES.includes(quality)) {
        quality = 'functional';
      }
      if (!isNaN(from) && !isNaN(to) && from >= 0 && to >= 0) {
        transitions.push({
          fromParagraph: from,
          toParagraph: to,
          quality,
          mechanism: typeof t.mechanism === 'string' ? t.mechanism : 'continuation',
        });
      }
    }
  }

  // Ensure all consecutive pairs have transitions
  for (let i = 0; i < expectedParagraphCount - 1; i++) {
    const hasTransition = transitions.some(t => t.fromParagraph === i && t.toParagraph === i + 1);
    if (!hasTransition) {
      transitions.push({
        fromParagraph: i,
        toParagraph: i + 1,
        quality: 'functional',
        mechanism: 'not assessed',
      });
    }
  }

  // Sort transitions by fromParagraph
  transitions.sort((a, b) => a.fromParagraph - b.fromParagraph);

  // -- Validate flat spots --
  const rawFlatSpots = raw.flatSpots;
  const flatSpots: number[] = [];
  if (Array.isArray(rawFlatSpots)) {
    for (const f of rawFlatSpots) {
      const idx = Number(f);
      if (!isNaN(idx) && idx >= 0 && idx < expectedParagraphCount) {
        flatSpots.push(idx);
      }
    }
  }

  // -- Validate thematic gaps --
  const rawGaps = raw.thematicGaps;
  const thematicGaps: string[] = [];
  if (Array.isArray(rawGaps)) {
    for (const g of rawGaps) {
      if (typeof g === 'string' && g.length > 0) {
        thematicGaps.push(g);
      }
    }
  }

  return {
    paragraphRoles: validatedRoles,
    arcType,
    arcConfidence,
    arcVerification: typeof raw.arcVerification === 'string' ? raw.arcVerification : '',
    transitions,
    centralTheme: typeof raw.centralTheme === 'string' ? raw.centralTheme : '',
    themeProgression: typeof raw.themeProgression === 'string' ? raw.themeProgression : '',
    thematicGaps,
    pacingNotes: typeof raw.pacingNotes === 'string' ? raw.pacingNotes : '',
    flatSpots,
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class StructuralCartographerService {
  /**
   * Run L2 structural cartography on the essay.
   *
   * Takes the full essay text and L1 first impressions.
   * Produces a structural map with architectural roles, transitions,
   * theme progression, arc assessment, and pacing analysis.
   *
   * Uses Sonnet (upgraded from V1's Haiku) because the structural map
   * is L3's reading guide — accuracy matters.
   */
  async analyze(
    essayText: string,
    impressions: ParagraphFirstImpression[],
  ): Promise<StructuralCartographyResult> {
    const startTime = Date.now();
    const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    if (paragraphCount === 0) {
      throw new Error('[StructuralCartographer] Essay text is empty — no paragraphs found');
    }

    const userPrompt = buildUserPrompt(essayText, impressions);

    const response: ClaudeResponse<Record<string, unknown>> = await callClaudeWithRetry<Record<string, unknown>>(
      {
        model: SONNET_MODEL,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
      },
    );

    const parsed = parseLlmJsonOutput(response.content, 'L2 structuralCartographer');
    const cartography = validateCartography(parsed, paragraphCount);
    const cost = calculateCost(response.usage, SONNET_MODEL);
    console.log(
      `[EssayIntelligence] L2: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );
    const timingMs = Date.now() - startTime;

    return {
      cartography,
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

export const structuralCartographerService = new StructuralCartographerService();

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Legacy export for V1 consumers that import `StructuralCartographer` (class name).
 * New consumers should use `StructuralCartographerService`.
 */
export const StructuralCartographer = StructuralCartographerService;
