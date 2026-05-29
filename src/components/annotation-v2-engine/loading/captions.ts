/**
 * Phase 4 Layer Captions — source-of-truth copy deck.
 *
 * Authority:
 *   - docs/ux_phases/phase_4_loading_state.md §2.1 (primary captions + table)
 *   - docs/ux_phases/phase_4_loading_state.md §2.5 (fast-path single string)
 *   - docs/ux_phases/phase_4_loading_state.md §2.6 (slow-path tiered captions)
 *   - docs/ux_phases/phase_4_loading_state.md §4 Copy Deck (numbered strings)
 *
 * Every string here is user-facing. Any change requires a spec update per
 * the build-plan rule ("do not change a value without updating the
 * corresponding spec first").
 */

import type { LayerName } from '../types/navigation';

// ---------------------------------------------------------------------------
// Primary per-layer captions — Phase 4 §2.1 table.
// ---------------------------------------------------------------------------

/**
 * User-facing caption shown while each layer is active. L4 does not
 * appear here — it is merged into L3.75's tail (Phase 4 §2.1 footnote).
 */
export const LAYER_CAPTIONS: Record<LayerName, string> = {
  /** Phase 4 §2.1 / §4 #1 — simple, honest first impression. */
  L1: 'Reading the essay…',
  /** Phase 4 §2.1 / §4 #2 — essay-class vocabulary ("structure"). */
  L2: 'Mapping the structure…',
  /** Phase 4 §2.1 / §4 #3 — shows whole-essay view. */
  'L2.5': 'Tracing connections across paragraphs…',
  /** Phase 4 §2.1 / §4 #4 — deliberately slow-sounding; signals depth. */
  L3: 'Walking through sentence by sentence…',
  /**
   * Phase 4 §2.1 / §4 #5 — the emotional peak.
   * Per §7 emotional journey map, landing this caption before 9s is the
   * single most important timing target in Phase 4.
   */
  'L3.75': 'Hearing your voice…',
  /** Phase 4 §2.1 / §4 #6 — frames understanding → judgment explicitly. */
  'L3.5': "Judging what's working…",
  /** Phase 4 §2.1 / §4 #7 — possessive pronoun; "your" annotations. */
  L5: 'Writing your annotations…',
};

// ---------------------------------------------------------------------------
// Terminal caption — Phase 4 §2.8 seam.
// ---------------------------------------------------------------------------

/**
 * Phase 4 §2.8 / §4 #8 — shown for 400ms before the ribbon morphs into
 * the analyze-again pill at the Phase 5 hand-off.
 */
export const READY_CAPTION = 'Ready.';

// ---------------------------------------------------------------------------
// Cancellation caption — Phase 4 §2.9.
// ---------------------------------------------------------------------------

/**
 * Phase 4 §4 #18 toast copy, trimmed for inline use under the ribbon
 * when cancellation fires. The fuller sentence ("Analysis canceled.
 * Pick up where you left off.") lives in a toast; the ribbon caption
 * simplifies to the state verb.
 */
export const CANCELLED_CAPTION = 'Cancelled';

// ---------------------------------------------------------------------------
// Fast-path caption — Phase 4 §2.5.
// ---------------------------------------------------------------------------

/**
 * Phase 4 §2.5 / §4 #13. Focused re-analysis shows a single caption
 * instead of cycling layer-by-layer. The word "affected" intentionally
 * signals surgical scope, not a full re-do.
 */
export const FAST_PATH_CAPTION = 'Updating affected paragraphs…';

// ---------------------------------------------------------------------------
// Slow-path tiered captions — Phase 4 §2.6.
// ---------------------------------------------------------------------------

/**
 * Slow-path thresholds in ms. When `elapsedMs` crosses a tier, the
 * ribbon caption swaps to the reassurance string for that tier. Below
 * any threshold, the primary `LAYER_CAPTIONS` string is used.
 *
 * §2.6 table:
 *   0–12s   → standard layer captions
 *   12–18s  → "(this one takes longer — it's the deep read)"
 *             appended to the current primary caption. Per §4 #9, this
 *             is a modifier, not a replacement; consumers render it as
 *             secondary text.
 *   18–25s  → full reassurance replaces the layer caption.
 *   25s+    → harder acknowledgment; Cancel button promotes to outlined.
 *
 * Hard ceiling at 45s (auto-cancel) is handled by the orchestrator hook,
 * not by a caption tier.
 */
export const SLOW_PATH_THRESHOLDS = {
  /** First anxiety tier — "this one takes longer" modifier. */
  deepReadTipMs: 12_000,
  /** Second anxiety tier — full reassurance replaces caption. */
  reassuranceMs: 18_000,
  /** Third anxiety tier — harder acknowledgment + promoted cancel. */
  hardAcknowledgeMs: 25_000,
  /** Hard ceiling — auto-cancel. */
  autoCancelMs: 45_000,
} as const;

/**
 * Phase 4 §2.6 slow-path caption bank.
 *
 * Each string is numbered against the §4 Copy Deck entries for
 * traceability. Consumers pick the tier based on `elapsedMs` — see
 * `resolveSlowPathCaption` below.
 */
export const SLOW_PATH_CAPTIONS = {
  /**
   * §2.6 / §4 #9 — appended in parentheses to #4 "Walking through
   * sentence by sentence…" or #5 "Hearing your voice…" after 12s in
   * that layer. Shown once per layer max — the orchestrator hook
   * enforces that by tracking which layers have already shown the tip.
   */
  deepReadTip: "(this one takes longer — it's the deep read)",

  /**
   * §2.6 / §4 #10 — 18–25s reassurance. Replaces the layer caption
   * entirely. "A bit more thought" anthropomorphizes charitably.
   */
  reassurance:
    "Still working. Long essays take a bit more thought. You can cancel if you'd like.",

  /**
   * §2.6 / §4 #11 — 25s+ harder acknowledgment. Cancel button
   * promotes from ghost to outlined in parallel (owned by CancelButton).
   */
  hardAcknowledge:
    "This is taking longer than expected. We'll keep going — or you can cancel and try again.",

  /**
   * §2.6 / §4 #12 — tooltip on the 25s+ info glyph. Explicit
   * financial safety. Not shown inline; surfaced on the info icon
   * rendered alongside #11.
   */
  noChargeTooltip: 'No credits charged if analysis doesn\u2019t complete.',
} as const;

export type SlowPathTier =
  | 'standard'
  | 'deepReadTip'
  | 'reassurance'
  | 'hardAcknowledge';

/**
 * Map an elapsed-ms duration to a slow-path tier. Returns `'standard'`
 * below 12s — consumers should then render the primary
 * `LAYER_CAPTIONS[currentLayer]` string.
 */
export function classifySlowPathTier(elapsedMs: number): SlowPathTier {
  if (elapsedMs >= SLOW_PATH_THRESHOLDS.hardAcknowledgeMs) return 'hardAcknowledge';
  if (elapsedMs >= SLOW_PATH_THRESHOLDS.reassuranceMs) return 'reassurance';
  if (elapsedMs >= SLOW_PATH_THRESHOLDS.deepReadTipMs) return 'deepReadTip';
  return 'standard';
}

/**
 * Resolve the caption string to render given orchestrator state.
 *
 * - If `cancelled`, returns `CANCELLED_CAPTION`.
 * - If the fast-path timeline is active, returns the single
 *   `FAST_PATH_CAPTION` string regardless of current layer (Phase 4 §2.5).
 * - If `revealReady`, returns the terminal `READY_CAPTION` (Phase 4 §2.8).
 * - Otherwise picks a slow-path tier from `elapsedMs`:
 *     - `hardAcknowledge` / `reassurance` replace the primary caption.
 *     - `deepReadTip` appends the modifier to the primary caption
 *       (consumers may choose to render it as secondary text; this
 *       helper returns the composed string for simple renderers).
 *     - `standard` returns the primary `LAYER_CAPTIONS[activeLayer]`.
 * - If no layer is active (pre-start), returns the empty string so the
 *   ribbon region collapses.
 */
export function resolveCaption(input: {
  readonly activeLayer: LayerName | null;
  readonly elapsedMs: number;
  readonly fastPath: boolean;
  readonly cancelled: boolean;
  readonly revealReady: boolean;
}): string {
  if (input.cancelled) return CANCELLED_CAPTION;
  if (input.revealReady) return READY_CAPTION;
  if (input.fastPath) return FAST_PATH_CAPTION;
  if (!input.activeLayer) return '';

  const base = LAYER_CAPTIONS[input.activeLayer];
  const tier = classifySlowPathTier(input.elapsedMs);
  switch (tier) {
    case 'hardAcknowledge':
      return SLOW_PATH_CAPTIONS.hardAcknowledge;
    case 'reassurance':
      return SLOW_PATH_CAPTIONS.reassurance;
    case 'deepReadTip':
      return `${base} ${SLOW_PATH_CAPTIONS.deepReadTip}`;
    case 'standard':
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Ribbon layer order — Phase 4 §2.1 ribbon structure.
// ---------------------------------------------------------------------------

/**
 * Canonical left-to-right dot order in the ribbon. L4 merged into
 * L3.75 (§2.1 footnote).
 */
export const RIBBON_LAYER_ORDER: readonly LayerName[] = [
  'L1',
  'L2',
  'L2.5',
  'L3',
  'L3.75',
  'L3.5',
  'L5',
] as const;
