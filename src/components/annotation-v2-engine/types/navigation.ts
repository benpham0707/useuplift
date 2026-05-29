// Workstream L — navigation, filter, and SSE-event types.
//
// Derived from:
//   - docs/ux_phases/phase_4_loading_state.md §6 (SSE layer events)
//   - docs/ux_phases/phase_10_navigation.md §2.1 (smart order),
//     §2.5 (jump-back stack, depth 3), §2.6 (viewed state),
//     §6.1 (queue entry shape)
//   - docs/ux_phases/phase_11_list_map.md §2.4 (filter chips,
//     AND composition), §2.5 (tier histogram), §3.8 (sort)
//
// Profile data (static per session) lives in `./profile.ts`. Everything
// here is either derived-at-view-time or mutated by user interaction.

import type { Tier } from './tier';
import type { AnnotationType } from './profile';

// ---------------------------------------------------------------------------
// Smart order (Phase 10 §2.1 + §7 algorithm).
// ---------------------------------------------------------------------------

/**
 * Opaque alias: an array of `SentenceProfile.id`s in the order Phase 10
 * §7's `computeSmartOrder()` produces. The nav hook returns this list;
 * the renderer just iterates.
 *
 * Centrality score is encoded in the list position (earlier = higher
 * priority). UI never sees the raw score per Phase 10 §6.1's "0.0–1.0,
 * for debugging" note.
 */
export type SmartOrderedSentenceId = string;

export interface SmartOrderedQueueEntry {
  readonly sentenceId: SmartOrderedSentenceId;
  readonly queuePosition: number;
  readonly tier: Tier;

  /** Phase 10 §2.10 — new since last review. */
  readonly isNew: boolean;
  /** Phase 10 §2.10 — existed, but tier/content changed since last view. */
  readonly isUpdated: boolean;
}

// ---------------------------------------------------------------------------
// Jump-back stack (Phase 10 §2.5).
// ---------------------------------------------------------------------------

/** Phase 10 §2.5 — "3 deep, replace-oldest at four." */
export const NAV_STACK_MAX_DEPTH = 3;

/** Single step in the jump-back breadcrumb. */
export interface NavStackEntry {
  readonly annotationId: string;
  readonly sentenceId: string;
  /** Position the student came FROM, so `Back` can restore it. */
  readonly fromQueuePosition: number;
  /** For the breadcrumb label: "¶4 · s2". */
  readonly label: string;
  /** When this entry was pushed — used for tombstone visuals on resolve. */
  readonly pushedAt: number;
  /**
   * Phase 10 §2.10 — when an annotation resolves out of existence
   * while still on the stack, the entry becomes a grey tombstone.
   */
  readonly isTombstoned: boolean;
}

export interface NavStack {
  /** Oldest-first. `entries.length <= NAV_STACK_MAX_DEPTH`. */
  readonly entries: readonly NavStackEntry[];
}

// ---------------------------------------------------------------------------
// Viewed state (Phase 10 §2.6, §6.2).
// ---------------------------------------------------------------------------

/** Why the student closed / advanced away from the annotation. */
export type CloseReason =
  | 'advance'
  | 'retreat'
  | 'jump'
  | 'dismiss'
  | 'filter-change'
  | 'esc';

export interface ViewedRecord {
  readonly viewedAt: number;
  /** Annotation IDs the student actually saw inside this open. */
  readonly annotationIdsSeen: readonly string[];
  /** Phase 10 §6.2 — <1200ms dwell never counts as viewed. */
  readonly dwellMs: number;
  readonly closeReason: CloseReason;
}

/**
 * Keyed by `sentenceId`. Phase 10 §6.2 persists at the annotation
 * level server-side, but the UI needs a per-sentence view because a
 * sentence with 3 annotations is only "viewed" once the student has
 * seen all 3.
 */
export type ViewedState = ReadonlyMap<string, ViewedRecord>;

/**
 * Phase 10 §2.10 — a tiny UI flag per sentence when re-analysis
 * changes things. Separate from ViewedState so we can show `new` /
 * `updated` badges while preserving historical viewed records.
 */
export type NewnessBadge = 'new' | 'updated' | null;

// ---------------------------------------------------------------------------
// Filter + list configuration (Phase 11 §2.4).
// ---------------------------------------------------------------------------

/**
 * Phase 11 §2.4 — three toggle chips, AND composition. Additional
 * filters live behind the `+` chip but are intentionally not modeled
 * here for the demo; the three top-level toggles cover the entire
 * Phase 11 chip row.
 */
export interface FilterState {
  /** Only CRITICAL-tier annotations. */
  readonly critical: boolean;
  /** Only annotations the student hasn't viewed yet. */
  readonly unreviewed: boolean;
  /** Only STRONG+ sentences (i.e. flipping the sign of the flow). */
  readonly strengths: boolean;
}

/** The empty filter state — every chip off, everything visible. */
export const FILTER_STATE_ALL_OFF: FilterState = {
  critical: false,
  unreviewed: false,
  strengths: false,
} as const;

/**
 * Phase 11 §2.4 — "group by" segmented control.
 *   paragraph → default; rows grouped under each paragraph header.
 *   tier      → rows grouped by tier band, severity-sorted.
 *   type      → rows grouped by AnnotationType (voice pass, craft
 *               pass, etc.).
 */
export type ListGrouping = 'paragraph' | 'tier' | 'type';

/** Phase 11 §2.4 — sort toggle. */
export type ListSorting = 'priority' | 'documentOrder';

export interface ListConfig {
  readonly grouping: ListGrouping;
  readonly sorting: ListSorting;
  readonly filter: FilterState;
  /**
   * Phase 11 §2.4 third-tier filter — not rendered as a chip, but
   * set via the `+` menu when grouping === 'type'.
   */
  readonly typeFilter: readonly AnnotationType[] | null;
}

// ---------------------------------------------------------------------------
// Tier histogram (Phase 11 §3.8).
// ---------------------------------------------------------------------------

/** Phase 11 §3.8 — one bar per tier; max bar width = max(count, 1). */
export interface TierHistogramBucket {
  readonly tier: Tier;
  readonly count: number;
  /** Count after the current `FilterState` is applied. */
  readonly filteredCount: number;
}

// ---------------------------------------------------------------------------
// SSE layer events (Phase 4 §6).
// ---------------------------------------------------------------------------

/**
 * Phase 4 §2.1 layer captions map to these layer names. The merged
 * L4 case never fires its own event — it's implicitly captured inside
 * the L3.75 tail (Phase 4 §2.1 table footnote).
 */
export type LayerName =
  | 'L1'
  | 'L2'
  | 'L2.5'
  | 'L3'
  | 'L3.75'
  | 'L3.5'
  | 'L5';

/**
 * Phase 4 §6 SSE payload. The fully discriminated union the loading
 * hook consumes. The demo uses the same shape because swapping to a
 * real EventSource later is a drop-in.
 */
export type LayerEvent =
  | { readonly type: 'layer_start'; readonly layer: LayerName; readonly t: number }
  | { readonly type: 'layer_complete'; readonly layer: LayerName; readonly t: number }
  /** Phase 4 §2.2 — paragraph-tint bloom trigger at L3.5 completion. */
  | { readonly type: 'paragraph_tints_ready'; readonly t: number }
  /** Phase 4 §2.8 — L5 complete, hand off to Phase 5 bloom. */
  | { readonly type: 'reveal_ready'; readonly t: number }
  /** Phase 4 §6 — server heartbeat, every ~3s. */
  | { readonly type: 'heartbeat'; readonly t: number };

// ---------------------------------------------------------------------------
// Mock loading stream contract (Phase 4 §2.5 fast path).
// ---------------------------------------------------------------------------

export interface MockLoadingStreamOptions {
  /**
   * Phase 4 §2.5 — focused re-analysis collapses to ~2.5s total,
   * respecting the 600ms floor for motion legibility.
   */
  readonly fastPath?: boolean;
}

/**
 * Tiny event-subscriber contract. We intentionally do NOT pull in
 * RxJS for the demo — a single-subscriber synchronous dispatcher is
 * enough and leaves the real SSE wiring free to choose its own
 * abstraction later.
 */
export interface MockLoadingStream {
  /** Subscribe; returns an unsubscribe fn. */
  readonly events$: (listener: (event: LayerEvent) => void) => () => void;
  /** Abort the stream. Emits no further events. */
  readonly cancel: () => void;
}
