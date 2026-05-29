/**
 * PanelModes — discriminated union for the detail-panel's three
 * mutually-exclusive display modes.
 *
 * Authority:
 *   - docs/ux_phases/phase_11_list_map.md §3 (mode-switching model —
 *     three modes, 180ms crossfade between them, no geometry change).
 *   - docs/ux_phases/phase_7_click_panel_open.md §2.2 (crossfade
 *     contract — 180ms, `cubic-bezier(0.4, 0, 0.2, 1)`, content
 *     identity-preserving).
 *   - docs/ux_phases/phase_5_first_reveal.md §2.3 (overview = default
 *     mode before any sentence click).
 *
 * The mode is deliberately the SINGLE source of truth for what the
 * panel is currently showing. The Insight tab state (insights/profile)
 * is a field INSIDE the insight mode variant rather than a sibling
 * — per Phase 8's "panel is one object" rule, a tab is not a mode,
 * it's a sub-view of the insight mode.
 */
// Phase 11 §3 — PanelMode is the toolbar's mode-switch surface; Phase
// 7 §2 keeps the geometry constant (60/40 split) across every mode.

import type { FilterState, ListSorting } from '../types/navigation';

/**
 * Which tab is active within the insight mode.
 * Phase 8 §2.9 / §3.1 — two tabs only (Insights, Profile).
 */
export type InsightTabId = 'insights' | 'profile';

/**
 * The three top-level panel modes. Exactly one is active at a time;
 * the mode crossfade is the only transition between them.
 */
export type PanelMode =
  // Phase 5 §2.3 — default state on first reveal AND whenever the
  // student hasn't clicked any sentence (incl. after ESC per Phase 7
  // §2.6 "Escape-to-overview").
  | { readonly kind: 'overview' }
  // Phase 7 §2 — sentence-scoped insight view. The `tab` field tracks
  // the Insights↔Profile swap inside the single panel identity.
  | {
      readonly kind: 'insight';
      readonly sentenceId: string;
      readonly tab: InsightTabId;
    }
  // Phase 7 §2.7 — paragraph-scope panel view (opened via gutter click).
  // Added during γ integration to close the loop flagged by Workstream J.
  | {
      readonly kind: 'paragraph';
      readonly paragraphIndex: number;
    }
  // Phase 11 §3 — list-mode (all annotations, optionally filtered).
  | {
      readonly kind: 'list';
      readonly filter: FilterState;
      readonly sort: ListSorting;
    };

/**
 * Helper — build an insight-mode variant with sensible defaults.
 * Phase 8 §2.9 — default tab on insight open is always Insights.
 */
// Phase 8 §2.9 — Insights is the first-opened tab; Profile is gated
// until 2 insights have been read (Phase 6 orientation rule).
export const makeInsightMode = (
  sentenceId: string,
  tab: InsightTabId = 'insights',
): PanelMode => ({
  kind: 'insight',
  sentenceId,
  tab,
});

/**
 * Stable identity key for motion/react `AnimatePresence mode="wait"`.
 * Phase 7 §2.2 — the panel is a single identity; only its content
 * crossfades. The key must change when and only when the content
 * should crossfade.
 *
 *   - overview mode → constant key ('overview')
 *   - insight mode  → keyed by sentenceId + tab (sentence change OR
 *     tab switch both trigger the 180ms crossfade per Phase 8 §2.9).
 *   - list mode     → constant key ('list'); filter changes within the
 *     list are NOT a mode crossfade (they animate bar widths per
 *     Phase 11 §3.8 instead).
 */
export const panelModeTransitionKey = (mode: PanelMode): string => {
  switch (mode.kind) {
    case 'overview':
      return 'overview';
    case 'insight':
      return `insight:${mode.sentenceId}:${mode.tab}`;
    case 'paragraph':
      return `paragraph:${mode.paragraphIndex}`;
    case 'list':
      return 'list';
  }
};

/** Helper — build a paragraph-mode variant (Phase 7 §2.7, γ addition). */
export const makeParagraphMode = (paragraphIndex: number): PanelMode => ({
  kind: 'paragraph',
  paragraphIndex,
});
