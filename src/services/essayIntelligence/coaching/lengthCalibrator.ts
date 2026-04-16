/**
 * Length calibration for coaching responses.
 *
 * Replaces the prior "soft cap 360 words" advisory with HARD CAPS that the
 * prompt enforces aggressively. Sonnet treated soft caps as guidance and
 * routinely overshot (audit Q4 T4=319w/240, T5=317w/200).
 *
 * Two outputs:
 *   1. wordBudget       — hard cap on the response (used in prompt).
 *   2. maxTokens        — cushioned token ceiling (~1.5x word budget) for the
 *                         API call. Token cushion accounts for the metadata
 *                         sidecar (~150 tokens) and BPE variance.
 *
 * Section caps (DIAGNOSTIC <=40w, DEMO <=80w, ASK <=30w, CRAFT-NAME <=25w)
 * live in `forbiddenPatterns.ts::SECTION_WORD_BUDGETS_BLOCK` because they
 * are prompt content; this file owns the OVERALL turn cap.
 */

export type ResponseIntensity = 'full' | 'brief' | 'minimal';

export interface LengthBudget {
  /** Hard cap on response word count. Truncate, do not overshoot. */
  wordBudget: number;
  /** maxTokens for the underlying API call (with cushion for sidecar + BPE). */
  maxTokens: number;
  /** Human-readable directive injected into the prompt. */
  promptDirective: string;
  /** Resolved intensity used for this budget (echoed back for callers). */
  intensity: ResponseIntensity;
}

/**
 * Per-turn input shape passed by coachingService.runStage3CoachingResponse.
 * The legacy positional `(intensity, options)` overload is preserved below,
 * but the call site uses the structured form when it has already estimated
 * intensity upstream (cheaper than re-deriving here).
 */
export interface TurnLengthContext {
  /** 1-indexed turn number (sessionMemory.turnCount + 1). */
  turnNumber: number;
  /** Pre-estimated intensity from coachingService.estimateResponseIntensity. */
  estimatedIntensity?: ResponseIntensity;
  /** True when student pasted a draft this turn — adds room for sentence-level coaching. */
  isInSessionDraftFeedback?: boolean;
  /** True when an active demonstration directive will fire — adds room for the demo. */
  hasActiveDemonstration?: boolean;
}

/**
 * Minimal session-memory shape we read here. Kept narrow on purpose so this
 * module doesn't take a dependency on the coaching session memory type.
 */
export interface SessionMemoryLengthInput {
  lastResponseIntensity?: ResponseIntensity | null;
  deflectionCounter?: number;
}

/**
 * Compute the budget for a single coaching turn.
 *
 * Hard caps (down from prior 360 soft cap on full):
 *   full    -> 240 words   (audit target — was being blown to 317-319)
 *   brief   -> 110 words
 *   minimal -> 45 words
 *
 * If `hasActiveDemonstration` is true, the cap shifts up by 60 words for
 * 'full' / 'brief' to make room for the required 80-word demo. Minimal
 * never gets a demo expansion (a minimal turn is a confirmation/redirect).
 */
export function calibrateLengthBudget(
  intensityOrTurnContext: ResponseIntensity | TurnLengthContext,
  optionsOrMemory: { hasActiveDemonstration?: boolean } | SessionMemoryLengthInput = {},
): LengthBudget {
  // Resolve the effective intensity. Two call shapes:
  //   (1) Legacy: calibrateLengthBudget('brief', { hasActiveDemonstration }) — used by tests.
  //   (2) Coaching: calibrateLengthBudget({ turnNumber, estimatedIntensity, ... }, sessionMemory)
  let intensity: ResponseIntensity;
  let hasActiveDemonstration = false;

  if (typeof intensityOrTurnContext === 'string') {
    intensity = intensityOrTurnContext;
    const opts = optionsOrMemory as { hasActiveDemonstration?: boolean };
    hasActiveDemonstration = opts.hasActiveDemonstration ?? false;
  } else {
    const ctx = intensityOrTurnContext;
    const memory = optionsOrMemory as SessionMemoryLengthInput;
    // Prefer the explicitly estimated intensity when present (already computed
    // upstream in coachingService.estimateResponseIntensity). Otherwise default
    // to 'full' (matches prior behavior on the first turn).
    intensity = ctx.estimatedIntensity
      ?? memory.lastResponseIntensity
      ?? 'full';
    // Draft feedback always promotes minimal/brief up to brief — sentence-level
    // coaching needs at least 3-6 sentences of working room.
    if (ctx.isInSessionDraftFeedback && intensity === 'minimal') intensity = 'brief';
    hasActiveDemonstration = ctx.hasActiveDemonstration ?? ctx.isInSessionDraftFeedback ?? false;
  }

  const baseBudget: Record<ResponseIntensity, number> = {
    full: 240,
    brief: 110,
    minimal: 45,
  };

  const demoBoost = hasActiveDemonstration && intensity !== 'minimal' ? 60 : 0;
  const wordBudget = baseBudget[intensity] + demoBoost;

  // Token cushion: ~1.6 tokens per word + 200 tokens for metadata sidecar.
  // Floor the cushion at 350 — minimal turns must NOT carry a 600-token ceiling
  // (that defeats the point of the cap and lets Sonnet keep writing).
  const maxTokens = Math.max(350, Math.ceil(wordBudget * 1.6) + 200);

  const promptDirective = buildPromptDirective(intensity, wordBudget, hasActiveDemonstration);

  return { wordBudget, maxTokens, promptDirective, intensity };
}

/**
 * Returns the prompt-injectable directive for a given budget. Equivalent to
 * reading `budget.promptDirective` directly; provided as a stable export so the
 * coaching service can call it without depending on the LengthBudget shape.
 */
export function budgetHintForPrompt(budget: LengthBudget): string {
  return `\n\n=== RESPONSE LENGTH BUDGET ===\n${budget.promptDirective}`;
}

function buildPromptDirective(
  intensity: ResponseIntensity,
  wordBudget: number,
  hasActiveDemonstration: boolean,
): string {
  const header = `RESPONSE LENGTH: HARD CAP ${wordBudget} WORDS — truncate aggressively rather than overshoot.`;

  const tail =
    'If the full improvement does not fit, deliver the diagnostic + 2-sentence ask and DEFER the demonstration to next turn. ' +
    'Do not pad. Do not add a meta-coaching closer to fill space. Stopping early is correct behavior.';

  switch (intensity) {
    case 'minimal':
      return `${header} 1-3 sentences. Acknowledge what they said. Advance with one question or one redirect. Nothing more. ${tail}`;
    case 'brief':
      return `${header} 3-6 sentences. Address the point, add ONE observation, ONE ask. ${tail}`;
    case 'full':
    default:
      return hasActiveDemonstration
        ? `${header} Sections (each capped — see SECTION WORD BUDGETS): diagnostic + demonstration + craft-name + ONE ask. ${tail}`
        : `${header} Sections (each capped — see SECTION WORD BUDGETS): diagnostic + ONE ask, plus optional craft-name beat. ${tail}`;
  }
}

/**
 * Cheap word-count helper used by tests verifying responses respect the cap.
 * Strips markdown / whitespace; counts whitespace-delimited tokens.
 */
export function countWords(text: string): number {
  const cleaned = text
    .replace(/<!--METADATA-->[\s\S]*$/i, '') // drop sidecar
    .replace(/[*_`]+/g, '')                   // drop common md emphasis
    .trim();
  if (cleaned.length === 0) return 0;
  return cleaned.split(/\s+/).length;
}
