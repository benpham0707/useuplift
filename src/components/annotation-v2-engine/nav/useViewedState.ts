/**
 * useViewedState — Phase 10 §2.6 / §6.2 viewed-state persistence.
 *
 * Session-scoped persistence per Phase 10 §6.2 note ("in-session intent");
 * backing store is `sessionStorage`, keyed per essayId so each essay has
 * its own viewed ledger. This is intentionally NOT `localStorage` because
 * viewed-state is meant to persist across reloads *within a session* but
 * NOT across days (the doc calls out filter-state resets per session;
 * viewed state follows the same model for demo purposes. Production
 * §6.2 persists server-side via the `annotation_views` table — that
 * wiring is Workstream γ's responsibility).
 *
 * Integration with usePanelMode.markInsightRead (Phase 6 Profile-gate
 * signal): `usePanelMode` owns the deduplicated set of sentence IDs that
 * have been "read" (counter gates the Profile tab). This hook owns the
 * richer per-sentence `ViewedRecord` with annotation IDs + timestamp.
 *
 * The two are intentionally separate surfaces (different consumers,
 * different semantics), but they MUST stay in sync. The integration
 * pattern — documented in the demo page — is:
 *
 *   parent `useEffect` subscribes to `panel.insightsRead` (the Set) and
 *   calls `viewedState.markViewed(sentenceId, annotationIds)` for every
 *   newly-added sentence. This makes `usePanelMode` the signal source
 *   (it knows when the dwell threshold fires) and `useViewedState` the
 *   durable ledger.
 *
 * The hook is idempotent: `markViewed(id, …)` called twice for the same
 * sentence is a no-op on the second call.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ViewedState } from '../types/navigation';

// Narrower internal record — the demo does not track dwellMs or
// closeReason because F's dwell pipeline isn't wired into the demo.
// Production will receive those fields via markViewed's optional extras.
interface InternalRecord {
  readonly viewedAt: number;
  readonly annotationIdsSeen: readonly string[];
  readonly dwellMs: number;
  readonly closeReason:
    | 'advance'
    | 'retreat'
    | 'jump'
    | 'dismiss'
    | 'filter-change'
    | 'esc';
}

export interface UseViewedStateResult {
  /** Snapshot of the viewed map. Stable reference per mutation. */
  readonly viewed: ViewedState;
  /** Idempotent; short-circuits if sentence was already recorded. */
  readonly markViewed: (
    sentenceId: string,
    annotationIds: readonly string[],
    opts?: {
      readonly dwellMs?: number;
      readonly closeReason?: InternalRecord['closeReason'];
    },
  ) => void;
  readonly isViewed: (sentenceId: string) => boolean;
  readonly reviewedCount: number;
  readonly totalCount: number;
  /** Imperative reset — for demo toolbars + Phase 10 §8 "Walk again". */
  readonly reset: () => void;
}

export interface UseViewedStateOpts {
  readonly essayId: string;
  /**
   * Total number of navigable (non-FUNCTIONAL) sentences. The progress
   * bar + end-of-review trigger use this as the denominator. We accept
   * it as an opt rather than deriving it so consumers can supply either
   * the smart-order total or a filter-aware total without changing the
   * hook's shape.
   */
  readonly totalCount: number;
}

// ---------------------------------------------------------------------------
// sessionStorage wiring
// ---------------------------------------------------------------------------

function storageKey(essayId: string): string {
  return `annotation-v2:viewed:${essayId}`;
}

function hydrate(essayId: string): Map<string, InternalRecord> {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return new Map();
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey(essayId));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, InternalRecord>;
    const map = new Map<string, InternalRecord>();
    for (const [k, v] of Object.entries(parsed)) map.set(k, v);
    return map;
  } catch {
    // Corrupt entry — start fresh. Never throw up to the UI for
    // persistence errors; viewed-state is best-effort.
    return new Map();
  }
}

function persist(essayId: string, map: Map<string, InternalRecord>): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const obj: Record<string, InternalRecord> = {};
    for (const [k, v] of map.entries()) obj[k] = v;
    window.sessionStorage.setItem(storageKey(essayId), JSON.stringify(obj));
  } catch {
    // Quota / private-mode failure — silently drop. The in-memory state
    // still works for the session.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useViewedState(opts: UseViewedStateOpts): UseViewedStateResult {
  const { essayId, totalCount } = opts;

  // Hydration is lazy: we read sessionStorage once at mount. If the
  // host re-mounts with the same essayId, the ledger is restored.
  const [records, setRecords] = useState<Map<string, InternalRecord>>(() =>
    hydrate(essayId),
  );

  const essayIdRef = useRef(essayId);
  useEffect(() => {
    // If the essayId changes mid-lifecycle, re-hydrate. Rare path, but
    // clean: the host might route between essays without unmounting
    // the shell.
    if (essayIdRef.current !== essayId) {
      essayIdRef.current = essayId;
      setRecords(hydrate(essayId));
    }
  }, [essayId]);

  const markViewed = useCallback(
    (
      sentenceId: string,
      annotationIds: readonly string[],
      extras?: {
        readonly dwellMs?: number;
        readonly closeReason?: InternalRecord['closeReason'];
      },
    ) => {
      setRecords((prev) => {
        if (prev.has(sentenceId)) return prev; // Idempotent.
        const next = new Map(prev);
        next.set(sentenceId, {
          viewedAt: Date.now(),
          annotationIdsSeen: annotationIds,
          dwellMs: extras?.dwellMs ?? 0,
          closeReason: extras?.closeReason ?? 'advance',
        });
        persist(essayIdRef.current, next);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setRecords(() => {
      const next = new Map<string, InternalRecord>();
      persist(essayIdRef.current, next);
      return next;
    });
  }, []);

  const isViewed = useCallback(
    (sentenceId: string) => records.has(sentenceId),
    [records],
  );

  const viewed: ViewedState = useMemo(() => {
    // Expose the same Map; ViewedState is already a ReadonlyMap.
    return records;
  }, [records]);

  return {
    viewed,
    markViewed,
    isViewed,
    reviewedCount: records.size,
    totalCount,
    reset,
  };
}
