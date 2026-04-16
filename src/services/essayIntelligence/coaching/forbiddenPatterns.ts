/**
 * Forbidden coaching patterns — prompt-injected guards + post-hoc lint.
 *
 * Origin: E2E audit (Q2/Q4/Q5/Q6 failures). Coach prose padded with
 * meta-coaching filler, over-validated, blew word budgets, and skipped
 * craft technique naming. These patterns are the concrete pathologies.
 *
 * Two surfaces:
 *   1. FORBIDDEN_PATTERNS_BLOCK — inlined into the system prompt so Sonnet
 *      sees the bans during generation.
 *   2. lintCoachingResponse() — regex sweep used by tests / audits to
 *      flag violations after the fact. NOT called at runtime (we don't
 *      block coach output; we measure adherence and tighten the prompt
 *      when violations recur).
 */

// ============================================================================
// PROMPT BLOCK (injected into system prompt — Sonnet sees this during gen)
// ============================================================================

export const FORBIDDEN_PATTERNS_BLOCK = `

FORBIDDEN PATTERNS (each is an automatic failure — DO NOT emit):

1. META-COACHING CLOSERS — talking ABOUT what the coaching will do once the student responds, instead of coaching now.
   FORBIDDEN: "Once you give me that material, we can write a P1 that..."
   FORBIDDEN: "Then we'll be able to fix the opening together."
   FORBIDDEN: "After you tell me, I'll show you what the rewrite looks like."
   ALLOWED: end on the ask itself, OR end on a single concrete sentence about the essay. Never on a promise about future turns.

2. JUSTIFICATION FILLER — explaining WHY you are asking what you are asking. Counselors do not argue for their question's validity.
   FORBIDDEN: "I need this material because P3 is currently your weakest paragraph."
   FORBIDDEN: "The reason I'm asking is so I can show you a stronger version."
   FORBIDDEN: "I'm asking because without this detail the essay can't..."
   ALLOWED: ask the question. Trust the student to grant it. If context for the question is needed, give a single diagnostic sentence (not a justification).

3. TRIPLE VALIDATION — three or more "you're right" / "yes" / "exactly" / "good catch" beats in a single response.
   FORBIDDEN: "you were right to bring Mrs. Chen in… And you were right that something got lost… And you were right to push back…"
   ALLOWED: at most ONE validation beat per response. Validate once, then move forward.

4. COMPOUND ASKS — ending the turn with two distinct asks ("Give me X. Then tell me Y."). Splits the student's focus and produces shallow answers to both.
   FORBIDDEN: "Give me one specific thing Mrs. Chen said. Then tell me what happened when you took her teaching and changed it."
   ALLOWED: ONE ask. If two pieces are needed, pick the one that unblocks the other and defer the second to the next turn.

5. SYCOPHANCY OPENERS (already banned, restated for completeness): "Great question!", "That's interesting", "I love how you...".

6. WITHHOLDING THE DEMO when a technique deployment is active. If a craft technique is routed to this turn (see TECHNIQUE block, if present), the demo is REQUIRED — even if the conversational mode is "follow the student's thread." The thread can include a 3-sentence demo. It cannot omit it.
`;

// ============================================================================
// SECTION WORD BUDGETS (injected into system prompt)
// ============================================================================

export const SECTION_WORD_BUDGETS_BLOCK = `

SECTION WORD BUDGETS (per response — these cap each section so no single section eats the turn):

  DIAGNOSTIC (what is wrong / what is happening):  <= 40 words
  DEMONSTRATION (when included — sample prose):    <= 80 words
  CRAFT-NAME BEAT (technique label + what it does): <= 25 words
  ASK (single question to the student):            <= 30 words   <-- ONE ask, not two

These are SECTION caps. The TURN cap (overall response length) is given separately
by the LENGTH DIRECTIVE — these section caps are inside it, not on top of it.

If your full improvement does not fit inside the turn cap: deliver DIAGNOSTIC + ASK
and DEFER the demonstration to the next turn. Truncate aggressively rather than overshoot.
`;

// ============================================================================
// LINT (post-hoc — used by tests / audits, NOT runtime blocking)
// ============================================================================

export interface ForbiddenPatternViolation {
  /** Stable id of the pattern that fired. */
  patternId:
    | 'meta_coaching_closer'
    | 'justification_filler'
    | 'triple_validation'
    | 'compound_ask'
    | 'sycophancy_opener'
    | 'soft_hedge';
  /** Human description for audit logs. */
  description: string;
  /** The matched substring(s) from the response. */
  matches: string[];
}

interface PatternRule {
  id: ForbiddenPatternViolation['patternId'];
  description: string;
  /**
   * When `mode === 'any'`, the pattern fires if any regex matches.
   * When `mode === 'count'`, the pattern fires when the cumulative
   * match count across all regexes meets or exceeds `threshold`.
   */
  mode: 'any' | 'count';
  threshold?: number;
  regexes: RegExp[];
}

const RULES: PatternRule[] = [
  {
    id: 'meta_coaching_closer',
    description: 'Closes the response with a promise about what coaching will do later, instead of coaching now.',
    mode: 'any',
    regexes: [
      /once you (give|tell|share|send) me [^.!?\n]{0,80}(we|i)\s+(can|will|could|'?ll)/i,
      /then we'?ll be able to/i,
      /after you (tell|give|share) me[^.!?\n]{0,80}(i'?ll|we'?ll|i\s+can|we\s+can)/i,
      /once (i\s+have|we\s+have) [^.!?\n]{0,80}(i'?ll|we'?ll|i\s+can|we\s+can)/i,
    ],
  },
  {
    id: 'justification_filler',
    description: 'Argues for the validity of the coach\'s own question.',
    mode: 'any',
    regexes: [
      /\bi\s+need this (material|detail|information)\s+because\b/i,
      /\bthe reason i'?m asking is\b/i,
      /\bi'?m asking because\b/i,
      /\bi need to (know|understand) this because\b/i,
    ],
  },
  {
    id: 'triple_validation',
    description: '3+ validation beats in a single response (you\'re right / yes / exactly / good catch).',
    mode: 'count',
    threshold: 3,
    regexes: [
      /\byou'?re right\b/gi,
      /\byou were right\b/gi,
      /\bgood catch\b/gi,
      /\bexactly\b/gi,
      /\byes,\s/gi,
      /\bthat'?s right\b/gi,
    ],
  },
  {
    id: 'compound_ask',
    description: 'Two distinct asks in the closing of a turn ("Give me X. Then tell me Y.").',
    mode: 'any',
    regexes: [
      // "give me X ... then tell me Y" / "tell me X ... then show me Y" / etc.
      /\b(give|tell|show|share)\s+me\b[^.?!\n]{3,200}[.?!]\s*(then|next|after that|also)\s*(give|tell|show|share|describe|name)\s+me\b/i,
      // "what was X? and what was Y?" close together (two question marks within a short window)
      /\?[^?\n]{1,160}\?\s*$/,
    ],
  },
  {
    id: 'sycophancy_opener',
    description: 'Opens with banned sycophancy phrasing.',
    mode: 'any',
    regexes: [
      /^\s*great question[!.]/i,
      /^\s*that'?s a (really |very )?(interesting|great|good) (question|approach|idea)/i,
      /^\s*i love how you/i,
    ],
  },
  {
    id: 'soft_hedge',
    description: 'Tentative softeners that water down the diagnostic ("you might consider").',
    mode: 'count',
    threshold: 2,
    regexes: [
      /\byou might consider\b/gi,
      /\bperhaps you could\b/gi,
      /\bmaybe try\b/gi,
    ],
  },
];

/**
 * Scan a coach response for forbidden patterns. Returns one violation per
 * pattern that fired (NOT one per match — a triple-validation violation has
 * `matches.length === 3+` rather than producing 3 separate violations).
 *
 * Designed for test usage. Does not block runtime delivery.
 */
export function lintCoachingResponse(response: string): ForbiddenPatternViolation[] {
  const violations: ForbiddenPatternViolation[] = [];
  if (!response || response.trim().length === 0) return violations;

  for (const rule of RULES) {
    const matches: string[] = [];

    for (const re of rule.regexes) {
      // Use matchAll for global regexes so we get every hit; for non-global
      // regexes a single match suffices.
      if (re.global) {
        for (const m of response.matchAll(re)) {
          matches.push(m[0]);
        }
      } else {
        const m = response.match(re);
        if (m) matches.push(m[0]);
      }
    }

    if (matches.length === 0) continue;

    if (rule.mode === 'any') {
      violations.push({
        patternId: rule.id,
        description: rule.description,
        matches,
      });
    } else {
      const threshold = rule.threshold ?? 3;
      if (matches.length >= threshold) {
        violations.push({
          patternId: rule.id,
          description: rule.description,
          matches,
        });
      }
    }
  }

  return violations;
}

/**
 * Compact summary of violations for logging. Empty string when clean.
 */
export function summarizeViolations(violations: ForbiddenPatternViolation[]): string {
  if (violations.length === 0) return '';
  return violations
    .map(v => `[${v.patternId}] ${v.description} (matches: ${v.matches.slice(0, 3).map(m => JSON.stringify(m)).join(', ')}${v.matches.length > 3 ? ', ...' : ''})`)
    .join('\n');
}
