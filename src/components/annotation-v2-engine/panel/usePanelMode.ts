/**
 * usePanelMode — hook that manages mode transitions for the detail panel.
 *
 * Responsibilities:
 *   - Track the current PanelMode and the mode it just came from (so
 *     ESC from list with a prior insight can restore that insight —
 *     Phase 11 §5 ESC rule).
 *   - Compute the AnimatePresence `key` for the 180ms crossfade.
 *   - Track the number of UNIQUE insights read (dwell-threshold not
 *     enforced here; F/H wire in their own view-record pipeline and
 *     call `markInsightRead` when the threshold lands — Phase 10 §6.2).
 *     This hook owns the de-duplicated counter so the Profile-tab gate
 *     (Phase 6 §2.2 orientation rule) has a single source of truth.
 *   - Expose ergonomic setters (`toOverview`, `toList`, `setSentence`).
 *
 * Not owned here:
 *   - ViewedState / dwell tracking (Workstream H owns per Phase 10 §6.2).
 *   - FilterState mutation inside list mode (Workstream I owns).
 *   - Insight content rendering (Workstream F owns).
 *
 * Authority:
 *   - docs/ux_phases/phase_5_first_reveal.md §2.3
 *   - docs/ux_phases/phase_7_click_panel_open.md §2, §2.6
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9, §3.1
 *   - docs/ux_phases/phase_11_list_map.md §3, §5
 */

import { useCallback, useRef, useState } from 'react';

import type { FilterState, ListSorting } from '../types/navigation';
import { FILTER_STATE_ALL_OFF } from '../types/navigation';
import {
  makeInsightMode,
  panelModeTransitionKey,
  type InsightTabId,
  type PanelMode,
} from './PanelModes';

export interface UsePanelModeResult {
  /** Currently-active panel mode. */
  readonly mode: PanelMode;
  /**
   * Mode immediately prior to `mode`. Null before the first transition.
   * Phase 11 §5 — ESC from list with a prior insight restores the
   * insight rather than going to overview.
   */
  readonly previousMode: PanelMode | null;
  /**
   * Stable key for motion/react AnimatePresence. Changes when and only
   * when the panel body should 180ms-crossfade. Phase 7 §2.2.
   */
  readonly transitionKey: string;
  /** Number of DISTINCT sentence-insight opens that have been read. */
  readonly insightsReadCount: number;
  /** Set of sentence IDs that have been marked read (de-duplicated). */
  readonly insightsRead: ReadonlySet<string>;

  readonly setMode: (next: PanelMode) => void;
  readonly setSentence: (sentenceId: string, tab?: InsightTabId) => void;
  readonly setInsightTab: (tab: InsightTabId) => void;
  readonly toOverview: () => void;
  readonly toList: (filter?: FilterState, sort?: ListSorting) => void;
  readonly markInsightRead: (sentenceId: string) => void;
}

export interface UsePanelModeOptions {
  readonly initial?: PanelMode;
  /**
   * Seed the read-count (useful for demos and E2E). Production should
   * hydrate from persisted ViewedState once Workstream H lands.
   */
  readonly initialInsightsRead?: ReadonlySet<string>;
}

// Phase 5 §2.3 — panel defaults to overview before any sentence click.
const DEFAULT_INITIAL: PanelMode = { kind: 'overview' };

export function usePanelMode(
  options: UsePanelModeOptions = {},
): UsePanelModeResult {
  const [mode, setModeState] = useState<PanelMode>(
    options.initial ?? DEFAULT_INITIAL,
  );
  const previousModeRef = useRef<PanelMode | null>(null);
  const [insightsRead, setInsightsRead] = useState<ReadonlySet<string>>(
    () => new Set(options.initialInsightsRead ?? []),
  );

  const setMode = useCallback((next: PanelMode) => {
    setModeState((current) => {
      // Phase 7 §2.2 — same mode = no transition. We compare via the
      // transition key so "same sentence, same tab" is a true no-op and
      // doesn't reset AnimatePresence (which would blink the card).
      if (panelModeTransitionKey(current) === panelModeTransitionKey(next)) {
        return current;
      }
      previousModeRef.current = current;
      return next;
    });
  }, []);

  const setSentence = useCallback(
    (sentenceId: string, tab: InsightTabId = 'insights') => {
      setMode(makeInsightMode(sentenceId, tab));
    },
    [setMode],
  );

  const setInsightTab = useCallback(
    (tab: InsightTabId) => {
      // Only meaningful inside insight mode. Calling from any other
      // mode is a silent no-op (mirrors Phase 8 §2.9 "tabs only exist
      // inside the insight card").
      setModeState((current) => {
        if (current.kind !== 'insight') return current;
        if (current.tab === tab) return current;
        previousModeRef.current = current;
        return { ...current, tab };
      });
    },
    [],
  );

  const toOverview = useCallback(() => {
    setMode({ kind: 'overview' });
  }, [setMode]);

  const toList = useCallback(
    (filter?: FilterState, sort: ListSorting = 'priority') => {
      setMode({
        kind: 'list',
        filter: filter ?? FILTER_STATE_ALL_OFF,
        sort,
      });
    },
    [setMode],
  );

  const markInsightRead = useCallback((sentenceId: string) => {
    setInsightsRead((prev) => {
      if (prev.has(sentenceId)) return prev;
      const next = new Set(prev);
      next.add(sentenceId);
      return next;
    });
  }, []);

  return {
    mode,
    previousMode: previousModeRef.current,
    transitionKey: panelModeTransitionKey(mode),
    insightsReadCount: insightsRead.size,
    insightsRead,
    setMode,
    setSentence,
    setInsightTab,
    toOverview,
    toList,
    markInsightRead,
  };
}
