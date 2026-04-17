/**
 * edgeProtocol.ts — Phase 3: bring back the OLD-system surgical sharpness
 * inside V2's structure, bounded against the OLD-system failure modes.
 *
 * WHY THIS EXISTS
 *   The V2 audit (April 2026) showed a real regression: the coach lost
 *   OLD's diagnostic punch ("Music Essay #14 this cycle", "refusing to coach"
 *   when the student deflected). V2 engineered out the coercive T7–T9
 *   standoff — good — but also lost the *kernel* of edge: willingness to
 *   push back once, firmly, with a path forward.
 *
 *   This module encodes three bounded edge behaviors as pure, unit-testable
 *   functions. Each produces a prompt directive the coaching service can
 *   inject, or a detector the coaching service can call. Each behavior is
 *   gated against escalation (max once per session for pushback, once for
 *   blindSpot surfacing, turn-1-only for killer diagnostic).
 *
 * BEHAVIORS
 *   3.1 killer diagnostic: on T1, open by naming the archetypal pattern
 *       (AO one-liner, "#N this cycle" framing) — don't bury it.
 *   3.2 calibrated pushback: when student deflects at least once AND the
 *       coach hasn't pushed back yet, emit a firm-but-bounded artifact
 *       request. Forbidden vocabulary ("last chance", "do it now") is
 *       guarded. Must offer a path forward.
 *   3.3 blindSpot surface: when the student opens emotional/identity
 *       territory AND a blindSpotHypothesis is marked readyToSurface,
 *       deploy it as observation not verdict. Max once per session.
 *
 * DESIGN
 *   - Zero LLM calls — all synchronous, deterministic.
 *   - Memory-additive — new fields `pushbackCount`, `blindSpotDeployedCount`
 *     extend CoachingSessionMemory, default 0 on first read.
 *   - Prompt directives are OPTIONAL injection points; fall back to empty
 *     string if the behavior shouldn't fire this turn.
 *   - Forbidden-vocabulary guard is a post-hoc detector, not a generator —
 *     the LLM still writes the prose, we just surface violations for audit.
 */

import type {
  CoachingSessionMemory,
  AOFirstRead,
  StudentTheory,
} from '../profileTypes';

// ═══════════════════════════════════════════════════════════════════════════
// FORBIDDEN VOCABULARY — coercive escalation phrases to avoid.
//
// Pulled from the OLD-system T7–T9 regression in the reference audit, where
// the coach emitted "Last chance.", "Do it now.", "If you deflect again,
// I'm going to assume you're not ready." Each of these signaled capitulation
// from coach-as-mentor to coach-as-drill-sergeant, which V2 correctly flagged
// as the collapse point. Phase 3 pushback is allowed; this kind of escalation
// is not.
//
// Matched case-insensitively and word-boundary-aware. Add new phrases here
// (and in the test file) when audits surface a new coercive pattern.
// ═══════════════════════════════════════════════════════════════════════════

export const FORBIDDEN_VOCABULARY: readonly string[] = [
  'last chance',
  'do it now',
  'if you deflect again',
  "i'm going to assume",
  'i am going to assume',
  "you're not ready",
  'you are not ready',
  'final warning',
  'i give up',
  'done with this',
  "we're done",
  'we are done',
];

export interface ForbiddenMatch {
  phrase: string;
  at: number; // character index in the response
  context: string; // ~20 chars around the match
}

/**
 * Negation-aware check: is the phrase preceded by a negation word within
 * ~3 tokens (e.g., "I'm NOT going to assume", "never give up", "don't
 * deflect again")? The forbidden phrases are coercive when deployed
 * positively; when explicitly disclaimed they're describing, not doing.
 * Without this guard, the Q2 scorecard gate fails spuriously whenever a
 * coach discusses these phrases to explain why they're off-limits.
 */
const NEGATION_WORDS: readonly string[] = [
  'not', "don't", 'dont', 'do not', 'never', "won't", 'wont', 'will not',
  'no', 'without', "isn't", 'isnt', "wouldn't", 'wouldnt',
];

function isPrecededByNegation(text: string, matchIdx: number): boolean {
  // Look back up to ~40 chars (≈3-6 words) for a negation word.
  const windowStart = Math.max(0, matchIdx - 40);
  const window = text.slice(windowStart, matchIdx).toLowerCase();
  for (const neg of NEGATION_WORDS) {
    // Word-boundary match to avoid false negatives on substrings
    // (e.g., "note" containing "not"). Match at word start.
    const re = new RegExp(`(^|\\W)${neg.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\W|$)`);
    if (re.test(window)) return true;
  }
  return false;
}

/**
 * Scan a coach response for forbidden coercive phrases. Returns empty when
 * clean. Used by the audit scorecard and by any future fail-CI gate on
 * coaching prose.
 *
 * Negation-aware: skips matches preceded by "not", "don't", "never", etc.
 * within ~40 characters (~3-6 words), so a coach explaining what phrases
 * to avoid ("I'm not going to say 'last chance'") doesn't trigger the gate.
 */
export function detectForbiddenVocabulary(response: string): ForbiddenMatch[] {
  if (!response) return [];
  const lower = response.toLowerCase();
  const matches: ForbiddenMatch[] = [];
  for (const phrase of FORBIDDEN_VOCABULARY) {
    let idx = 0;
    while ((idx = lower.indexOf(phrase, idx)) !== -1) {
      if (isPrecededByNegation(lower, idx)) {
        idx += phrase.length;
        continue;
      }
      const start = Math.max(0, idx - 20);
      const end = Math.min(response.length, idx + phrase.length + 20);
      matches.push({
        phrase,
        at: idx,
        context: response.slice(start, end).replace(/\s+/g, ' ').trim(),
      });
      idx += phrase.length;
    }
  }
  return matches;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3.1 KILLER DIAGNOSTIC — T1 opening mandate
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Return a prompt directive that, if `ao` is populated and this is turn 1,
 * requires the coach to open the response by naming the archetypal pattern.
 *
 * The V2 system has all the material already (committeeOneLiner, gutReaction,
 * putDownRisk) — we just mandate it surfaces verbatim rather than getting
 * buried three paragraphs into the response. Empty string means "don't fire"
 * (turn > 1, or no AO data available).
 *
 * @param turnNumber 1-based turn number (memory.turnCount + 1)
 * @param ao         profile.aoFirstRead, possibly null
 */
export function killerDiagnosticDirective(
  turnNumber: number,
  ao: AOFirstRead | null | undefined,
): string {
  if (turnNumber !== 1) return '';
  if (!ao) return '';
  const oneLiner = ao.committeeOneLiner;
  const archetype = ao.gutReaction;
  if (!oneLiner && !archetype) return '';

  const lines: string[] = ['\n\n=== TURN 1 OPENING DIRECTIVE (killer diagnostic) ==='];
  lines.push(
    'Open your response within the first 50 words with a diagnostic-confidence framing. ' +
      'This is the single most important move of the first turn — do NOT bury it.',
  );
  if (oneLiner) {
    lines.push(`- AO committee one-liner: "${oneLiner}"`);
  }
  if (archetype) {
    // Trim to first 2 sentences — the archetype framing is usually in the first few lines of gutReaction
    const trimmed = archetype.split(/(?<=[.?!])\s/).slice(0, 3).join(' ');
    lines.push(`- Archetype framing: ${trimmed}`);
  }
  if (ao.putDownRisk === 'high') {
    lines.push('- Put-down risk is HIGH — the student needs to hear the convergence-zone read explicitly.');
  }
  lines.push(
    'Use language like "I\'ve read this pattern N times" or "This is Music Essay #14" when naming the archetype. ' +
      'That diagnostic-confidence move is what makes the first turn land as senior-AO coaching rather than a craft workshop.',
  );
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// 3.2 CALIBRATED PUSHBACK — firm-once artifact request
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pushback fires at most ONCE per session, gated on:
 *   - deflectionCounter >= 1 (student has avoided a writing ask at least once)
 *   - pushbackCount === 0 (haven't done it yet this session)
 *
 * This matches the OLD-system T5 refuse-to-coach move, but bounded: after
 * one firm request the coach MUST pivot to teaching rather than escalating
 * to ultimatums (that's the T7–T9 collapse we're guarding against).
 */
export function shouldAllowPushback(memory: CoachingSessionMemory): boolean {
  const defl = memory.deflectionCounter ?? 0;
  const pushbacks = memory.pushbackCount ?? 0;
  return defl >= 1 && pushbacks === 0;
}

/**
 * Prompt directive emitted on the ONE turn when pushback is allowed.
 * Includes explicit "offer a path forward" requirement — a pushback without
 * a path forward is coercion.
 */
export function pushbackDirective(): string {
  return (
    '\n\n=== PUSHBACK DIRECTIVE (one-time, this turn only) ===\n' +
    'You have observed at least one deflection from a writing ask. You MAY — this turn only — ' +
    'firmly request the artifact before coaching further. Bounded rules:\n' +
    '  1. Ask for the material ONCE, not repeatedly.\n' +
    '  2. Offer a concrete path forward ("once you paste it I can be specific about X").\n' +
    '  3. Explain the cost to the student, not a threat to coaching: ' +
    '("without the words on the page I can only generalize").\n' +
    '  4. FORBIDDEN phrases: "last chance", "do it now", "if you deflect again", ' +
    '"I\'m going to assume", "you\'re not ready", "final warning". These turn the coach into a drill sergeant — not the goal.\n' +
    '  5. If the student deflects AGAIN, pivot to a different, smaller entry point (not another pushback).'
  );
}

/**
 * Mark that the coach fired a pushback this turn. Called by the coaching
 * service from its post-turn hook. Makes further pushbacks unavailable in
 * this session.
 */
export function recordPushback(memory: CoachingSessionMemory): void {
  memory.pushbackCount = (memory.pushbackCount ?? 0) + 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3.3 BLIND-SPOT SURFACING — "abstraction is a defense mechanism"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Heuristic classifier: did the student's message open emotional/identity
 * territory? Keyword match on the student's text — deliberately simple,
 * since this is a gating signal (the LLM still does the actual surfacing).
 *
 * Keywords include first-person vulnerability markers ("I felt", "I'm worried",
 * "scared", "identity") and explicit self-reflection openers ("what do you
 * think of me", "am I", "who am I").
 */
const EMOTIONAL_OPENERS: readonly RegExp[] = [
  /\bi (?:felt|feel|am feeling|was feeling)\b/i,
  /\b(?:i'?m|i am) (?:worried|scared|afraid|anxious|uncertain|embarrassed|ashamed)\b/i,
  /\b(?:my|my own) (?:identity|self|voice|authenticity)\b/i,
  /\bwhat (?:do you think|does this say) (?:of|about) me\b/i,
  /\bam i (?:the kind|a person|good enough)\b/i,
  /\bwho am i\b/i,
  /\bdo i (?:sound|come across|seem)\b/i,
  /\b(?:honestly|truthfully|to be honest)\b/i,
];

export function detectEmotionalOpening(studentMessage: string): boolean {
  return EMOTIONAL_OPENERS.some((re) => re.test(studentMessage));
}

/**
 * BlindSpot surfacing fires at most ONCE per session. Gated on:
 *   - blindSpotDeployedCount === 0
 *   - student opened emotional/identity territory this turn
 *   - a readyToSurface blindSpotHypothesis exists on the studentTheory
 */
export function shouldSurfaceBlindSpot(
  memory: CoachingSessionMemory,
  theory: StudentTheory | null | undefined,
  studentMessage: string,
): boolean {
  const deployed = memory.blindSpotDeployedCount ?? 0;
  if (deployed > 0) return false;
  if (!detectEmotionalOpening(studentMessage)) return false;
  if (!theory?.blindSpotHypotheses?.length) return false;
  return theory.blindSpotHypotheses.some((h) => h.readyToSurface);
}

/**
 * Prompt directive for the ONE turn when a blindSpot may be surfaced.
 * Phrases it as observation-not-verdict and requires pairing with a craft
 * action so the insight serves the writing rather than psychoanalyzing the
 * student.
 */
export function blindSpotDirective(theory: StudentTheory): string {
  const hypo = theory.blindSpotHypotheses.find((h) => h.readyToSurface);
  if (!hypo) return '';
  return (
    '\n\n=== BLINDSPOT SURFACE DIRECTIVE (one-time, this turn only) ===\n' +
    `The student has opened emotional/identity territory. You MAY — ONCE — surface this hypothesis ` +
    `as an observation, not a verdict:\n` +
    `  "${hypo.hypothesis}"\n` +
    `Rules:\n` +
    `  1. Frame as OBSERVATION ("I notice...", not "You are..."). Never diagnostic or reductive.\n` +
    `  2. Pair with a concrete CRAFT action — the insight must serve the writing, not the student's psychology.\n` +
    `  3. Offer, don't impose — make clear this is a hypothesis the student can reject.\n` +
    `  4. If the student pushes back, accept it and move on — do NOT escalate or repeat.`
  );
}

export function recordBlindSpotDeployed(memory: CoachingSessionMemory): void {
  memory.blindSpotDeployedCount = (memory.blindSpotDeployedCount ?? 0) + 1;
}
