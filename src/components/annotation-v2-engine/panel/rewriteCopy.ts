/**
 * rewriteCopy — Phase 9 §4 copy deck (authoritative strings).
 *
 * Every string here is load-bearing. Each one is either taken verbatim
 * from `docs/ux_phases/phase_9_rewrite_suggestion.md` §4 (the copy deck)
 * or derived from an adjacent §2 decision. Comments cite the section.
 *
 * The top-line task prompt from Workstream G specifies the exact shapes
 * below; Phase 9 §4.3 gives us the tier-header variants, Phase 9 §2.1
 * gives the disclaimer, Phase 9 §2.3 gives the Copy button + toast
 * microcopy. Disclosure toggle copy differs between desktop ("See
 * example approach" per the task brief, which is a compact rendering of
 * §2.1 `One way a writer might handle this`) and mobile (§5.4 "See
 * example" — shorter on narrow screens).
 *
 * NOTE on framing: we intentionally do NOT export strings like "Try
 * this" / "Improved version" / "Apply" / "Use this". Phase 9 §2.1 and
 * §7.3 refuse those framings. Anything that could read as "adopt" is
 * out.
 */

// ---------------------------------------------------------------------------
// Tier-aware section header (Phase 9 §4.3).
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.6 tier rule + §4.3 — two framing headers exist:
 *   - `one_way_a_writer_might_handle_this` for CRITICAL / NEEDS_WORK
 *   - `a_slightly_tighter_version`         for STRONG (rare)
 * EXCEPTIONAL / MASTERFUL / FUNCTIONAL never render a rewrite, so
 * there is no header variant for them.
 */
export const REWRITE_HEADERS = {
  one_way_a_writer_might_handle_this: 'One way a writer might handle this',
  a_slightly_tighter_version: 'A slightly tighter version',
} as const;

// ---------------------------------------------------------------------------
// Tier-aware disclaimer prose (Phase 9 §4.3).
// ---------------------------------------------------------------------------

/**
 * Phase 9 §4.3 — disclaimer prose maps to the same tier gate as the
 * section header. STRONG gets a softer "pattern for polish" wording
 * because the rewrite is a tightening, not a redirection.
 */
export const REWRITE_DISCLAIMERS = {
  one_way_a_writer_might_handle_this:
    "This is a pattern, not a sentence. Your version will sound different — and that's the point.",
  a_slightly_tighter_version:
    'A pattern for polish, not a replacement. Your voice stays yours.',
} as const;

// ---------------------------------------------------------------------------
// Top-of-container disclaimer (task-brief copy, aligned with §2.1).
// ---------------------------------------------------------------------------

/**
 * Task brief §1 (this workstream) specifies a TOP disclaimer that sits
 * directly under the section header, before the example prose. This is
 * a shorter pre-read disclaimer intended as a *bumper* before the
 * student reads the example. Phase 9 §2.1 mandates "the mandatory
 * disclaimer sits directly under the example in 12px stone-400 serif
 * italic" — so the long-form disclaimer (REWRITE_DISCLAIMERS above)
 * renders BELOW the example; this short top-bumper renders ABOVE.
 *
 * Both are from the Phase 9 copy vocabulary ("pattern, not a sentence,"
 * "spark," "inspiration") and compose cleanly — the bumper frames the
 * example as a spark; the post-example disclaimer reinforces that
 * their version will differ. The two disclaimers together are the
 * anti-paste sandwich.
 */
export const REWRITE_TOP_DISCLAIMER =
  "One way a writer might handle this. Don't copy — use it as a spark for your own revision.";

// ---------------------------------------------------------------------------
// Toggle / disclosure row.
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.2 collapsed state + §5.4 mobile.
 * Desktop: descriptive pair. Mobile: shorter 2-word pair.
 *
 * `toggleOpen` is used when the disclosure is expanded and the student
 * can collapse it back. Phase 9 §2.2 doesn't specify the collapse label
 * explicitly; we choose `Hide example` as a clean inverse of the
 * collapsed-state prompt, matching the affordance-not-commitment tone.
 */
export const REWRITE_TOGGLE = {
  desktop: {
    closed: 'See example approach',
    open: 'Hide example',
  },
  mobile: {
    // Phase 9 §5.4 — `See example` (2 words) on mobile.
    closed: 'See example',
    open: 'Hide example',
  },
} as const;

// ---------------------------------------------------------------------------
// Metadata row — register match + craft divergence.
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.7 — voice-match + craft-divergence framing. These are the
 * two signals the student sees about *how* the example is calibrated.
 *
 * `registerMatch` maps `RewriteSuggestion.registerMatch` ('high' |
 * 'medium' | 'low') to the student-facing phrase. Per §2.7, the
 * calibration target is "close, but deliberately not exact," so the
 * copy for `high` is "Close to your voice" (not "Matches your voice,"
 * which would suggest pasteability).
 */
export const REWRITE_REGISTER_MATCH = {
  high: 'Close to your voice',
  medium: 'Adjacent to your voice',
  low: 'Different from your voice',
} as const;

/**
 * Phase 9 §2.7 — label that sits before `rewrite.divergenceDimension`
 * to contextualize what the example trades specificity / rhythm /
 * embodiment for. The leading `·` separator between this and the
 * register-match phrase is inserted at render time (not here).
 */
export const REWRITE_DIVERGENCE_LABEL = 'What this trades on:';

// ---------------------------------------------------------------------------
// Copy affordance — the only sanctioned path from rewrite to student.
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.3 — the 4-second (desktop) / 6-second (mobile) delayed
 * copy button. Labels:
 *   - idle        → "Copy for reference"
 *   - preparing   → "Preparing copy…"         (during the delay)
 *   - cancel      → "Cancel"                  (abort during delay)
 *   - committed   → "Copied"                  (2s post-commit)
 *   - error       → "Copy failed — retry"     (clipboard API failure)
 *   - edited      → "Copy my version"         (Phase 9 §2.4 — edit > 0)
 *
 * "Copy for reference" is chosen over the task-brief default because
 * Phase 9 §2.3 describes the affordance explicitly as a clipboard for
 * *reference*, not for *use*. The word "reference" is load-bearing.
 */
export const REWRITE_COPY_BUTTON = {
  idle: 'Copy for reference',
  preparing: 'Preparing copy…',
  cancel: 'Cancel',
  committed: 'Copied',
  error: 'Copy failed — retry',
  edited: 'Copy my version',
  /**
   * Phase 9 §5.4 — mobile affordance uses long-press confirm, which we
   * surface with explicit hint text so the interaction is discoverable
   * without a tap-and-hope.
   */
  mobileIdle: 'Copy (long-press to confirm)',
} as const;

/**
 * Phase 9 §3.6 — the button's aria-label must disclose the 4-second
 * delay so screen reader users aren't surprised by the wait. §7.2
 * Rule 1: no one-click adoption path.
 */
export const REWRITE_COPY_BUTTON_ARIA = {
  idle: 'Copy example text for reference (4-second delay before copy)',
  mobileIdle:
    'Copy example text for reference (long-press to confirm, 6-second delay before copy)',
  preparing: 'Preparing copy, cancel to abort',
  committed: 'Copied to clipboard',
  error: 'Copy failed, press to retry',
} as const;

// ---------------------------------------------------------------------------
// Variant label — secondary disclosure (Phase 9 §2.5 cap of 2).
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.5 — we cap at 2 variants. The second variant lives inside
 * a nested disclosure labeled "Another way" (not "Alternative," which
 * is grading-software vocabulary).
 */
export const REWRITE_VARIANT_LABEL = 'Another way';
export const REWRITE_VARIANT_HIDE_LABEL = 'Hide other variant';

// ---------------------------------------------------------------------------
// Diff view — off by default (Phase 9 §2.8).
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.8 — `Show as diff` / `Show as prose` inverted pair.
 * Desktop only; mobile removes the toggle entirely (§5.4).
 */
export const REWRITE_DIFF_TOGGLE = {
  showAsDiff: 'Show as diff',
  showAsProse: 'Show as prose',
  ariaDescribe:
    'Toggles the rewrite display between prose and an inline diff against the student original. Prose is the default.',
} as const;

/**
 * Phase 9 §2.8 — reader-friendly labels rendered alongside the diff
 * spans for students unfamiliar with diff convention.
 */
export const REWRITE_DIFF_LABELS = {
  originalCaption: 'Your sentence',
  rewriteCaption: 'Example approach',
} as const;

// ---------------------------------------------------------------------------
// Anti-paste toast (Phase 9 §2.3 + §7.2 Rule 1).
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.3 — the toast fires at commit time, NOT at copy-click.
 * Title, body, CTA are sized to be read in 4s and dismissed in one
 * action. `role="alert"` + `aria-live="assertive"` is intentional: the
 * toast IS an interruption (§7.2 Rule 1 — conscience on the copy path).
 */
export const REWRITE_ANTI_PASTE_TOAST = {
  title: 'Hold on — think first',
  body:
    "If you're about to paste this into your essay, pause. Rewrite in your own words so the sentence is still yours.",
  cta: 'Understood',
  /**
   * Phase 9 §3.2 — toast auto-dismiss duration. §2.3 says the Phase 9
   * toast reads as a "conscience" and lingers ~4s; we extend to 8s
   * here because this toast carries more ethical weight than a
   * generic success toast and §7.2 is explicit that the reminder is
   * the last thing the student sees before context-switching back to
   * their editor.
   */
  autoDismissMs: 8000,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export — single import surface per workstream convention.
// ---------------------------------------------------------------------------

/**
 * Single barrel object for callers that want one import line.
 * Named exports (above) are preferred inside the component tree so
 * unused strings can be tree-shaken in principle.
 */
export const REWRITE_COPY = {
  toggle: REWRITE_TOGGLE,
  headers: REWRITE_HEADERS,
  disclaimers: REWRITE_DISCLAIMERS,
  topDisclaimer: REWRITE_TOP_DISCLAIMER,
  registerMatch: REWRITE_REGISTER_MATCH,
  divergenceLabel: REWRITE_DIVERGENCE_LABEL,
  copyButton: REWRITE_COPY_BUTTON,
  copyButtonAria: REWRITE_COPY_BUTTON_ARIA,
  variantLabel: REWRITE_VARIANT_LABEL,
  variantHideLabel: REWRITE_VARIANT_HIDE_LABEL,
  diffToggle: REWRITE_DIFF_TOGGLE,
  diffLabels: REWRITE_DIFF_LABELS,
  antiPasteToast: REWRITE_ANTI_PASTE_TOAST,
} as const;

export type RewriteCopyBundle = typeof REWRITE_COPY;
