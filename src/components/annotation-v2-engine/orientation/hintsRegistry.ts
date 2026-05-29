/**
 * hintsRegistry — the authoritative five-hint registry for Phase 6
 * First-Time Orientation (Wave β / Workstream K).
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.3 (progressive-hint rules:
 *     exactly five, max one on-screen, anchored, no × button, one-shot
 *     via localStorage).
 *   - docs/ux_phases/phase_6_orientation.md §5 (hint registry table).
 *   - docs/ux_phases/phase_6_orientation.md §9 (reduced-motion rules).
 *   - docs/ux_phases/phase_11_list_map.md §2.2 (tier-key popover lives
 *     inside the toolbar filter menu — h2 anchors to the filter icon so
 *     users find it through the filter menu, not separately).
 *
 * The registry is a *closed* set: exactly five hints, no more. Each hint
 * teaches exactly one UI capability, anchors near the element it
 * teaches, fires at most once per user (localStorage-keyed), and obeys
 * the "max one visible at a time" queue invariant enforced by
 * `useHintQueue`.
 *
 * Note on h4 (coaching-bar): the coaching bar is not always in scope
 * for every demo harness; the hint is registered but will only queue
 * when the orchestrator's `coachingBarPresent` signal is true. When
 * absent the hint is effectively never-trigger (see `useOrientation`).
 *
 * Note on copy: every hint string is sentence-case, ≤14 words in the
 * body (§2.10 cognitive rule), no exclamation marks, no emojis, no
 * patronizing framing. Voice: "calm tutor who trusts you" (§6).
 */

// ---------------------------------------------------------------------------
// Identity + shape
// ---------------------------------------------------------------------------

/**
 * The five hint identifiers. This union is *closed* — adding a sixth
 * value requires a spec change (Phase 6 §2.3 budget: five).
 */
export type HintId =
  | 'h1_panel_exists'
  | 'h2_filters_live_in_toolbar'
  | 'h3_profile_tab_available'
  | 'h4_coaching_bar_available'
  | 'h5_list_view_available';

/**
 * The elements each hint can anchor to. The renderer resolves these
 * symbolic names to `HTMLElement` refs supplied by the host at
 * render time.
 */
export type HintAnchor =
  | 'panel'
  | 'toolbar-filter'
  | 'panel-tabs'
  | 'coaching-bar'
  | 'toolbar-list';

/**
 * Trigger-condition identifier. The orchestrator owns the logic that
 * decides *when* these conditions fire; the registry only declares the
 * symbolic name so hints can be routed through a single queue.
 */
export type HintTrigger =
  | 'after-first-panel-open'
  | 'after-hover-near-filter'
  | 'after-2-insights-read'
  | 'after-5-minutes-open'
  | 'after-list-toggle-hover';

/**
 * Reduced-motion treatment per hint (§9).
 *   - 'fade-only': render with fade only (no Y-translate, no scale).
 *   - 'skip-entirely': never render under prefers-reduced-motion.
 * All five current hints use `fade-only` because the information they
 * carry is first-session load-bearing; we never drop them entirely.
 * `skip-entirely` is reserved for decorative-only hints added later.
 */
export type ReducedMotionBehavior = 'fade-only' | 'skip-entirely';

export interface HintDef {
  readonly id: HintId;
  readonly anchor: HintAnchor;
  readonly headline: string;
  readonly body: string;
  readonly trigger: HintTrigger;
  /**
   * localStorage key. Namespaced under `uplift:hint:` with a `.v1`
   * suffix (§5) so future copy revisions can re-fire deliberately by
   * bumping the version.
   */
  readonly localStorageKey: string;
  readonly reducedMotionBehavior: ReducedMotionBehavior;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All five hints, keyed by id. Exact copy pinned to the workstream
 * spec; any change requires updating the spec first (CLAUDE.md rule).
 */
export const HINT_REGISTRY: Readonly<Record<HintId, HintDef>> = Object.freeze({
  h1_panel_exists: {
    id: 'h1_panel_exists',
    anchor: 'panel',
    headline: 'This panel follows your clicks.',
    body: "Click any underlined sentence to see what's going on.",
    trigger: 'after-first-panel-open',
    localStorageKey: 'uplift:hint:h1_panel_exists.v1',
    reducedMotionBehavior: 'fade-only',
  },
  h2_filters_live_in_toolbar: {
    id: 'h2_filters_live_in_toolbar',
    anchor: 'toolbar-filter',
    headline: 'Filters and tier meanings live here.',
    body: 'Toggle tiers or filter annotations without leaving your essay.',
    trigger: 'after-hover-near-filter',
    localStorageKey: 'uplift:hint:h2_filters_live_in_toolbar.v1',
    reducedMotionBehavior: 'fade-only',
  },
  h3_profile_tab_available: {
    id: 'h3_profile_tab_available',
    anchor: 'panel-tabs',
    headline: 'Profile shows what the sentence does.',
    body: 'No judgment — just a map of what you wrote.',
    trigger: 'after-2-insights-read',
    localStorageKey: 'uplift:hint:h3_profile_tab_available.v1',
    reducedMotionBehavior: 'fade-only',
  },
  h4_coaching_bar_available: {
    id: 'h4_coaching_bar_available',
    anchor: 'coaching-bar',
    headline: 'Coaching sits below when you need it.',
    body: 'Ask about any annotation here instead of in chat.',
    trigger: 'after-5-minutes-open',
    localStorageKey: 'uplift:hint:h4_coaching_bar_available.v1',
    reducedMotionBehavior: 'fade-only',
  },
  h5_list_view_available: {
    id: 'h5_list_view_available',
    anchor: 'toolbar-list',
    headline: 'See everything at once in the list view.',
    body: 'Scan paragraph by paragraph or filter to the essentials.',
    trigger: 'after-list-toggle-hover',
    localStorageKey: 'uplift:hint:h5_list_view_available.v1',
    reducedMotionBehavior: 'fade-only',
  },
});

/**
 * Stable iteration order for the registry. Matches the priority the
 * queue falls back on when two hints qualify simultaneously: the one
 * earlier in this list wins (matches Phase 6 §5 "h1 > h2 > ..."
 * deterministic order for tests).
 */
export const HINT_ORDER: readonly HintId[] = Object.freeze([
  'h1_panel_exists',
  'h2_filters_live_in_toolbar',
  'h3_profile_tab_available',
  'h4_coaching_bar_available',
  'h5_list_view_available',
]);

/**
 * All five localStorage keys, exposed so `resetAllHintsForDemo()` can
 * clear them in one pass and tests can assert the keyspace.
 */
export const ALL_HINT_STORAGE_KEYS: readonly string[] = Object.freeze(
  HINT_ORDER.map((id) => HINT_REGISTRY[id].localStorageKey),
);

/**
 * Companion key for the keyboard-shortcut footer (§2.5). Not a hint per
 * se, but follows the same one-shot localStorage convention so the
 * footer doesn't reappear after the student dismisses it once.
 */
export const KEYBOARD_FOOTER_STORAGE_KEY = 'uplift:orient:keyboardFooterSeen.v1';

// ---------------------------------------------------------------------------
// localStorage helpers with graceful fallback
// ---------------------------------------------------------------------------

/**
 * Safe read. Returns `null` when localStorage is unavailable (SSR,
 * Safari private mode, quota exceeded). Callers must treat `null` as
 * "unseen" so hints still fire; only the *persistence* of the seen
 * state degrades, not the user experience.
 */
export function readHintSeen(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/**
 * Safe write. Silent on failure — the one-shot guarantee is
 * best-effort (§5 "localStorage writes mirror every server write" is
 * Phase 11 Backend; client-side we do the best we can).
 */
export function writeHintSeen(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, '1');
  } catch {
    // Swallow — see doc comment. The hint simply fires again next
    // mount if storage is blocked.
  }
}

/** Demo-only: wipe every hint key + the keyboard footer key. */
export function clearAllHintStorageForDemo(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    for (const key of ALL_HINT_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.removeItem(KEYBOARD_FOOTER_STORAGE_KEY);
  } catch {
    // No-op.
  }
}
