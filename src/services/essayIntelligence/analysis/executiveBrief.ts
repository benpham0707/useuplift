/**
 * Executive Brief — Stage 2.A
 *
 * Generates the <300-word counselor-grade top-of-dump surface: a single
 * Sonnet micro-call that reads a compressed L4+L5 surface and emits a
 * verdict + 5 directives + 3 model sentences. Sits at the top of every
 * dump / coaching session — the student reads this BEFORE the diagnostic
 * dump (often instead of it).
 *
 * Closes the counselor-gap memory's "no top-line" finding: 3,001-line
 * dumps with scattered actionable signals are useless to students who
 * don't read past line 50. The brief is the line the student reads.
 *
 * Design: docs/pipeline-evolution/04-pipeline-architecture/L5/EXECUTIVE_BRIEF_DESIGN.md
 *
 * Cost: ~$0.05-0.08 per cold-start. Within the $0.85 cost target's headroom.
 * Flag: ENABLE_EXECUTIVE_BRIEF=true (default off until Phase 6 regen approves).
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { buildFabricationGuardBlock } from '../../../lib/llm/fabricationGuard';
import type {
  EssayProfile,
  ExecutiveBrief,
  ExecutiveBriefDirective,
  ExecutiveBriefModelSentence,
  L5Annotation,
} from '../profileTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET = 'claude-sonnet-4-5-20250929';
const MAX_OUTPUT_TOKENS = 600; // ~450 words; the 300-word cap is enforced by the validator.
const TEMPERATURE = 0.4;
const TIMEOUT_MS = 60_000;

/** Word-count cap enforced by the validator. */
const BRIEF_WORD_CAP = 300;

/**
 * Forbidden phrases. The design forbids hedge-words because they erode the
 * counselor voice the brief is supposed to embody. Validator scans the
 * brief render for these and triggers retry if any are present.
 *
 * The match is case-insensitive whole-word boundary; "considerable" does not
 * match "consider".
 */
const FORBIDDEN_PHRASES = [
  'consider',
  'perhaps',
  'might',
  'could',
  'maybe',
  'explore',
  'demonstrates',
  'shows promise',
  'room to grow',
  'with refinement',
] as const;

/**
 * Default target tier when neither workshop override nor archetypeContext
 * inference yields a tier. Highly-selective is the modal student goal in
 * this product — Ivy-elite is too narrow, competitive is too lenient.
 */
const DEFAULT_TARGET_TIER: ExecutiveBrief['targetTier'] = 'highly_selective';

// ============================================================================
// FEATURE FLAG
// ============================================================================

export function isExecutiveBriefEnabled(): boolean {
  return process.env.ENABLE_EXECUTIVE_BRIEF === 'true';
}

// ============================================================================
// TARGET-TIER INFERENCE
// ============================================================================

/**
 * Per plan §0.5 D5: infer target tier from
 * `EssayProfile.admissionsPositioning.archetypeContext` when no workshop
 * override is provided. The inference is loose — `archetypeContext` doesn't
 * encode school tier directly. Rare archetypes get 'ivy_elite' (signaling
 * the student is aiming higher than the genre average); saturated archetypes
 * default to 'highly_selective' (the modal case). The brief's own LLM
 * judgment about competitiveness is what does the real work — this picks
 * the calibration target.
 */
function inferTargetTier(profile: Readonly<EssayProfile>): ExecutiveBrief['targetTier'] {
  const ac = profile.admissionsPositioning?.archetypeContext;
  if (!ac) return DEFAULT_TARGET_TIER;
  switch (ac.poolDensity) {
    case 'rare':
      return 'ivy_elite';
    case 'uncommon':
      return 'highly_selective';
    case 'moderate':
      return 'highly_selective';
    case 'common':
      return 'very_selective';
    case 'saturated':
      return 'very_selective';
    default:
      return DEFAULT_TARGET_TIER;
  }
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildSystemPrompt(targetTier: ExecutiveBrief['targetTier']): string {
  return `You are an admissions counselor writing the executive brief for one essay. The student will read this BEFORE the diagnostic dump. Most students never read past the brief — make every word earn its place.

TARGET TIER FOR THIS BRIEF: ${targetTier}
(Calibrate verdict + directives against this tier. A "competitive" verdict means competitive AT this tier, not in general.)

CONSTRAINTS (mandatory):
- Total length: ≤${BRIEF_WORD_CAP} words across verdict + directives + model sentences.
- VERDICT: ONE sentence stating where this essay stands at ${targetTier}. Forbidden: "could be," "might be," "shows promise," "demonstrates," "room to grow." Required: a calibrated read ("competitive at," "below the bar for," "exceptional but with one cost").
- 5 DIRECTIVES: ordered by priority, ≤20 words each. Imperative voice. Each names a concrete action AND a target location (paragraph or sentence). Forbidden: "consider," "perhaps," "explore," "might."
- 3 MODEL SENTENCES: pick the 3 sentences where a single rewrite unlocks the most. Quote the EXACT original from the essay; write the revision (your editorial craft) USING ONLY content present in the essay; explain in ≤25 words why.

CALIBRATION:
- A 95-level essay's brief reads: "Exceptional. Three tiny refinements." Most don't get this.
- A 75-level essay's brief reads: "Competitive but needs X. Here's X." Five directives, all real.
- A 55-level essay's brief reads: "Not yet competitive. The foundation is here. Two structural moves change the read." Three directives are structural, not craft.

VOICE: editorial, declarative, kind but unsparing. Not academic, not therapeutic. You are the counselor the student paid $500/hour to talk to — every line is the line that justifies the rate.

OUTPUT FORMAT: strict JSON matching this schema. No markdown. No additional prose.
{
  "verdict": "one-sentence calibrated read",
  "targetTier": "${targetTier}",
  "directives": [
    { "rank": 1, "action": "≤20 words, imperative", "rationale": "≤30 words", "affectedParagraphs": [<P indices>] },
    { "rank": 2, ... },
    { "rank": 3, ... },
    { "rank": 4, ... },
    { "rank": 5, ... }
  ],
  "modelSentences": [
    { "originalSentence": "verbatim from essay", "originalLocation": { "paragraphIndex": 0, "sentenceIndex": 2 }, "revisedSentence": "your editorial revision", "rationale": "≤25 words" },
    ...two more...
  ]
}

${buildFabricationGuardBlock()}`;
}

/**
 * Compress the L4 + L5 surface into a prompt the brief generator reads.
 * Stays well under 2000 input tokens — the brief is a strategic-frame call,
 * not an analytical one.
 */
function buildUserPrompt(profile: Readonly<EssayProfile>, topAnnotations: L5Annotation[]): string {
  const parts: string[] = [];

  parts.push('=== ESSAY TEXT ===');
  const essayText = profile.paragraphs.map((p, i) => `P${i}: ${p.text}`).join('\n\n');
  parts.push(essayText);
  parts.push('');

  if (profile.northStar) {
    parts.push('=== NORTH STAR (architecture of meaning) ===');
    parts.push(JSON.stringify(profile.northStar, null, 2));
    parts.push('');
  }

  if (profile.admissionsPositioning) {
    parts.push('=== ADMISSIONS POSITIONING ===');
    parts.push(
      `tellabilitySummary: ${profile.admissionsPositioning.tellabilitySummary}\n` +
        `aoTakeaway: ${profile.admissionsPositioning.aoTakeaway}\n` +
        `archetypeContext: ${JSON.stringify(profile.admissionsPositioning.archetypeContext ?? null)}`,
    );
    parts.push('');
  }

  // Coherence resolutions from Stage 2.B — already-terminated contradictions.
  const resolutions =
    profile.northStar?.coherenceResolutions ??
    profile.scoreMatrix?.coherenceResolutions ??
    [];
  if (resolutions.length > 0) {
    parts.push('=== COHERENCE RESOLUTIONS (terminated contradictions — surface or suppress per state) ===');
    parts.push(
      resolutions
        .map((r) => `[${r.state.toUpperCase()}] ${r.contradictionId}: ${r.reasoning}`)
        .join('\n'),
    );
    parts.push('');
  }

  // Top 5 L5 annotations by priority.
  if (topAnnotations.length > 0) {
    parts.push('=== TOP L5 ANNOTATIONS (actionable spine) ===');
    parts.push(
      topAnnotations
        .map((a, i) =>
          `${i + 1}. [P${a.location.paragraphIndex}${a.location.sentenceIndex !== null ? `S${a.location.sentenceIndex}` : ''}] ` +
            `priority=${a.priority} type=${a.type} mode=${a.teachingMode}\n` +
            `   content: ${a.content}\n` +
            (a.rewriteExample ? `   rewrite: ${a.rewriteExample}\n` : '') +
            (a.stakes ? `   stakes: ${a.stakes}` : ''),
        )
        .join('\n'),
    );
    parts.push('');
  }

  // Score matrix paragraph-level effectiveness summary (verdict calibration).
  if (profile.scoreMatrix?.paragraphs?.length) {
    const avgEffectiveness =
      profile.scoreMatrix.paragraphs.reduce((sum, p) => sum + (p.scores.effectiveness ?? 0), 0) /
      profile.scoreMatrix.paragraphs.length;
    parts.push('=== SCORE MATRIX SUMMARY (verdict calibration) ===');
    parts.push(
      `avgEffectiveness: ${avgEffectiveness.toFixed(1)}\n` +
        `per-paragraph: ${profile.scoreMatrix.paragraphs.map((p) => `P${p.index}=${p.scores.effectiveness}`).join(', ')}`,
    );
    parts.push('');
  }

  parts.push('=== TASK ===');
  parts.push(
    'Write the Executive Brief per the system-prompt schema. Verdict + 5 directives + 3 model sentences. ≤300 words total. JSON only.',
  );

  return parts.join('\n');
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  ok: boolean;
  reason: string | null;
  wordCount: number;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((t) => t.length > 0).length;
}

/**
 * Render the brief as the student would read it, then scan for word-count
 * overrun and forbidden phrases. Tier sanity (verdict alignment with
 * scoreMatrix avg) is checked separately so the caller can decide whether
 * to retry the LLM call or accept a soft-flagged brief.
 */
function validateBrief(brief: ExecutiveBrief): ValidationResult {
  const renderParts: string[] = [];
  renderParts.push(brief.verdict);
  renderParts.push(...brief.directives.map((d) => `${d.action} ${d.rationale}`));
  renderParts.push(
    ...brief.modelSentences.map((m) => `${m.originalSentence} ${m.revisedSentence} ${m.rationale}`),
  );
  const render = renderParts.join(' ');
  const wordCount = countWords(render);

  if (wordCount > BRIEF_WORD_CAP) {
    return { ok: false, reason: `word_count_${wordCount}_over_${BRIEF_WORD_CAP}`, wordCount };
  }

  const lower = render.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    // Word-boundary match. \b\w on side of phrase handles "consider" vs "considerable".
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (re.test(lower)) {
      return { ok: false, reason: `forbidden_phrase_${phrase.replace(/\s+/g, '_')}`, wordCount };
    }
  }

  return { ok: true, reason: null, wordCount };
}

// ============================================================================
// PARSING
// ============================================================================

function parseDirectives(raw: unknown): ExecutiveBriefDirective[] {
  if (!Array.isArray(raw)) return [];
  const out: ExecutiveBriefDirective[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const rankRaw = typeof r.rank === 'number' ? Math.round(r.rank) : NaN;
    if (![1, 2, 3, 4, 5].includes(rankRaw)) continue;
    const action = typeof r.action === 'string' ? r.action.trim() : '';
    const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : '';
    if (action.length === 0 || rationale.length === 0) continue;
    const affectedRaw = Array.isArray(r.affectedParagraphs) ? r.affectedParagraphs : [];
    const affectedParagraphs = affectedRaw
      .filter((p): p is number => typeof p === 'number')
      .map((p) => Math.max(0, Math.round(p)));
    out.push({
      rank: rankRaw as 1 | 2 | 3 | 4 | 5,
      action,
      rationale,
      affectedParagraphs,
    });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

function parseModelSentences(raw: unknown): ExecutiveBriefModelSentence[] {
  if (!Array.isArray(raw)) return [];
  const out: ExecutiveBriefModelSentence[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const originalSentence = typeof r.originalSentence === 'string' ? r.originalSentence.trim() : '';
    const revisedSentence = typeof r.revisedSentence === 'string' ? r.revisedSentence.trim() : '';
    const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : '';
    if (originalSentence.length === 0 || revisedSentence.length === 0) continue;
    const loc = (r.originalLocation ?? {}) as Record<string, unknown>;
    const paragraphIndex = typeof loc.paragraphIndex === 'number' ? Math.max(0, Math.round(loc.paragraphIndex)) : 0;
    const sentenceIndex = typeof loc.sentenceIndex === 'number' ? Math.max(0, Math.round(loc.sentenceIndex)) : 0;
    out.push({
      originalSentence,
      originalLocation: { paragraphIndex, sentenceIndex },
      revisedSentence,
      rationale,
    });
  }
  return out;
}

// ============================================================================
// MAIN ENTRY
// ============================================================================

/**
 * Pick the top-5 L5 annotations by priority across paragraph + essay-level +
 * cross-paragraph. Used to inform the brief's directives.
 */
function pickTopAnnotations(l5Result: {
  paragraphAnnotations: Array<{ annotations: L5Annotation[] }>;
  essayLevelAnnotations: L5Annotation[];
  crossParagraphAnnotations: L5Annotation[];
}): L5Annotation[] {
  const pool: L5Annotation[] = [
    ...l5Result.paragraphAnnotations.flatMap((p) => p.annotations),
    ...l5Result.essayLevelAnnotations,
    ...l5Result.crossParagraphAnnotations,
  ];
  return pool
    .filter((a) => a.surfaced)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

interface GenerateExecutiveBriefInput {
  profile: Readonly<EssayProfile>;
  l5Result: {
    paragraphAnnotations: Array<{ annotations: L5Annotation[] }>;
    essayLevelAnnotations: L5Annotation[];
    crossParagraphAnnotations: L5Annotation[];
  };
  /** Workshop override; falls back to inferTargetTier when undefined. */
  targetTierOverride?: ExecutiveBrief['targetTier'];
}

/**
 * Generate the Executive Brief. Single Sonnet micro-call with one retry on
 * validation failure (word count over cap OR forbidden phrase present).
 * Returns null when both attempts fail — the orchestrator treats null as
 * "no brief this run" and continues (the dump is intact without it).
 */
export async function generateExecutiveBrief(
  input: GenerateExecutiveBriefInput,
): Promise<ExecutiveBrief | null> {
  if (!isExecutiveBriefEnabled()) return null;

  const startTime = Date.now();
  const targetTier = input.targetTierOverride ?? inferTargetTier(input.profile);
  const topAnnotations = pickTopAnnotations(input.l5Result);
  const systemPrompt = buildSystemPrompt(targetTier);
  const userPrompt = buildUserPrompt(input.profile, topAnnotations);

  let totalCost = 0;
  let lastValidationReason: string | null = null;
  let attempt = 0;
  const MAX_ATTEMPTS = 2;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const retryDirective =
      attempt > 1 && lastValidationReason
        ? `\n\nRETRY DIRECTIVE: previous attempt failed validation (${lastValidationReason}). Tighten word economy aggressively. Remove every modifier that does not load-bear. Recheck for forbidden words: ${FORBIDDEN_PHRASES.join(', ')}.`
        : '';

    const response = await callClaudeWithRetry<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt: userPrompt + retryDirective,
        maxTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
        timeoutMs: TIMEOUT_MS,
      },
    );

    const cost = calculateCost(response.usage, SONNET);
    totalCost += cost;
    console.log(
      `[ExecutiveBrief] attempt=${attempt}: ` +
        `${response.usage.input_tokens.toLocaleString()} input + ` +
        `${response.usage.output_tokens.toLocaleString()} output = $${cost.toFixed(4)}`,
    );

    const raw = (typeof response.content === 'string'
      ? JSON.parse(response.content)
      : response.content) as Record<string, unknown>;

    const verdict = typeof raw.verdict === 'string' ? raw.verdict.trim() : '';
    const directives = parseDirectives(raw.directives);
    const modelSentences = parseModelSentences(raw.modelSentences);

    if (verdict.length === 0 || directives.length !== 5 || modelSentences.length !== 3) {
      lastValidationReason = `shape_invalid_verdict_${verdict.length > 0 ? 1 : 0}_directives_${directives.length}_modelSentences_${modelSentences.length}`;
      console.warn(`[ExecutiveBrief] attempt=${attempt} shape invalid: ${lastValidationReason}`);
      continue;
    }

    const brief: ExecutiveBrief = {
      verdict,
      targetTier,
      directives,
      modelSentences,
      totalWordCount: 0,
      truncated: false,
      cost: totalCost,
      timingMs: Date.now() - startTime,
    };

    const validation = validateBrief(brief);
    brief.totalWordCount = validation.wordCount;

    if (validation.ok) {
      console.log(
        `[ExecutiveBrief] succeeded — words=${validation.wordCount}, tier=${targetTier}, ` +
          `cost=$${totalCost.toFixed(4)}, time=${brief.timingMs}ms`,
      );
      return brief;
    }

    lastValidationReason = validation.reason ?? 'unknown';
    console.warn(
      `[ExecutiveBrief] attempt=${attempt} validation failed: ${validation.reason} ` +
        `(words=${validation.wordCount})`,
    );

    // On final attempt, accept the brief with `truncated: true` rather than
    // discarding paid output — partial brief is better than no brief, and
    // the render layer can flag it.
    if (attempt === MAX_ATTEMPTS) {
      brief.truncated = true;
      console.warn(
        `[ExecutiveBrief] surfaced with truncated=true (validation_reason=${validation.reason}) ` +
          `— render layer should surface a warning to Tue.`,
      );
      return brief;
    }
  }

  console.warn('[ExecutiveBrief] all attempts failed; returning null.');
  return null;
}
