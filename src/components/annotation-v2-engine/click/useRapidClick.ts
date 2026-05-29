/**
 * useRapidClick — latest-wins click coalescer (Workstream J).
 *
 * Phase 7 §2.4 — Rapid Clicking Contract
 * --------------------------------------
 * Within a 40ms (DURATION.rapidClickCoalesce) window after `report()` is
 * called, only the LAST reported sentenceId commits via `onCommit`. Earlier
 * reports are silently dropped — no rendering, no analytics event beyond the
 * final commit.
 *
 * Why a ref, not state, during the coalesce window:
 *   The coalesce window is a sub-frame concern (40ms ≤ one animation frame at
 *   24fps, roughly one frame at 60fps). React state churn during that window
 *   would trigger re-renders on every intermediate click and risk visible
 *   flashes of intermediate rings / tooltips — the exact bug the coalescing
 *   exists to prevent. We stash the pending id + timer in a ref so only the
 *   commit reaches the consumer's setState.
 *
 * Phase 7 §2.4 invariant 3 — "we never play through intermediate states." The
 * panel opacity ramp, ring, and all downstream work start only on commit.
 *
 * Abort contract (§2.4 abort semantics):
 *   The consumer's `onCommit` may kick off async work (fetching L5 data,
 *   driving the click timeline). When a later commit overrides an earlier
 *   in-flight commit, the consumer is responsible for aborting the prior
 *   work via its own AbortController — this hook does NOT own fetch
 *   controllers because clicks are usually cache-hit (§6.6) and creating a
 *   controller per click is waste. `abort()` here only clears the coalesce
 *   pending window.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { DURATION } from '../tokens';

export interface UseRapidClickOptions {
  /**
   * Phase 7 §2.4 — coalesce window. Default 40ms per
   * DURATION.rapidClickCoalesce.
   */
  readonly coalesceMs?: number;
  /**
   * Fires once the coalesce window has elapsed without a superseding
   * report. Receives the sentenceId of the winning click.
   */
  readonly onCommit: (sentenceId: string) => void;
}

export interface UseRapidClickResult {
  /**
   * Called synchronously on every mousedown / pointerdown. Resets the
   * coalesce window; only the latest reported id will commit.
   */
  readonly report: (sentenceId: string) => void;
  /**
   * The sentenceId currently inside the coalesce window (rendered for
   * debug / demo display only). Updates on a microtask — intentionally
   * not sub-frame live, because surfacing pending to React state is not
   * a render-path concern.
   */
  readonly pending: string | null;
  /** Manually cancel any pending commit. */
  readonly abort: () => void;
}

export function useRapidClick(options: UseRapidClickOptions): UseRapidClickResult {
  const { coalesceMs = DURATION.rapidClickCoalesce, onCommit } = options;

  // Refs hold the hot path — no setState churn inside the 40ms window.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  // Stable handler ref so we never close over a stale onCommit.
  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  // Debug pending state, reported to React on a microtask (so a single
  // frame's coalesced clicks don't produce N re-renders).
  const [pending, setPending] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    clearTimer();
    pendingIdRef.current = null;
    setPending(null);
  }, [clearTimer]);

  const report = useCallback(
    (sentenceId: string) => {
      // Phase 7 §2.4 — always overwrite the pending target; only the last
      // click in the window wins. We do NOT reset the existing timer's
      // start time in a way that extends the window indefinitely on a
      // rapid click storm — the timer runs from the most recent report,
      // which is the desired behaviour: we want the user to pause before
      // we commit.
      clearTimer();
      pendingIdRef.current = sentenceId;
      // Queue React state update on a microtask (batches with other
      // same-tick updates). `queueMicrotask` is deterministic and avoids
      // spinning up a setTimeout(0).
      queueMicrotask(() => setPending(sentenceId));

      timerRef.current = setTimeout(() => {
        const winningId = pendingIdRef.current;
        timerRef.current = null;
        pendingIdRef.current = null;
        setPending(null);
        if (winningId != null) {
          onCommitRef.current(winningId);
        }
      }, coalesceMs);
    },
    [clearTimer, coalesceMs],
  );

  // Unmount cleanup — never fire a commit after the host unmounts.
  useEffect(() => {
    return () => {
      clearTimer();
      pendingIdRef.current = null;
    };
  }, [clearTimer]);

  return { report, pending, abort };
}
