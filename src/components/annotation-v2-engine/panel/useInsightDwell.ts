/**
 * useInsightDwell — Phase 8 §2.10 / Phase 10 §6.2 dwell tracker.
 *
 * Fires `onThreshold(sentenceId)` exactly once per sentenceId when the
 * insight for that sentence has been visible continuously for at least
 * `thresholdMs` milliseconds (default 1200ms — Phase 10 §6.2 "dwell
 * threshold"; Phase 8 §2.10 calls out the same 1500ms range but the
 * build-plan harmonised on 1200ms as the lower end of the window so
 * fast readers don't drop insights on the floor).
 *
 * Behaviour:
 *   - When `sentenceId` changes (and isn't null), a timer starts fresh.
 *   - If `sentenceId` changes again before the threshold elapses, the
 *     in-flight timer is cancelled — no partial-dwell fire.
 *   - After the timer fires once for a given sentenceId, wandering back
 *     to the same sentenceId does NOT re-fire (per Phase 8 §2.10 "mark
 *     viewed" is de-duplicated globally; this hook honours that at the
 *     hook level too so callers can compose freely).
 *   - `onThreshold` is read via a ref so consumers can pass inline
 *     closures without busting the timer each render.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.10
 *   - docs/ux_phases/phase_10_navigation.md §6.2
 */

import { useEffect, useRef } from 'react';

export interface UseInsightDwellArgs {
  /** Currently-visible sentence. `null` halts any pending timer. */
  readonly sentenceId: string | null;
  /**
   * How long the sentence must stay visible before we fire. Default
   * 1200ms per Phase 10 §6.2.
   */
  readonly thresholdMs?: number;
  /** Fired once per distinct sentenceId; de-duplicated inside the hook. */
  readonly onThreshold: (sentenceId: string) => void;
}

const DEFAULT_THRESHOLD_MS = 1200;

export function useInsightDwell(args: UseInsightDwellArgs): void {
  const { sentenceId, thresholdMs = DEFAULT_THRESHOLD_MS, onThreshold } = args;

  // Keep the callback fresh without re-running the timer effect.
  const onThresholdRef = useRef(onThreshold);
  useEffect(() => {
    onThresholdRef.current = onThreshold;
  }, [onThreshold]);

  // Per-hook-instance memo of already-fired ids. Phase 8 §2.10 — don't
  // re-fire if the student wanders back to a sentence we've already
  // marked read. (The owning hook in usePanelMode also dedupes; this
  // is a cheap local guard so the onThreshold consumer cannot be
  // surprised.)
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (sentenceId == null) return;
    if (firedRef.current.has(sentenceId)) return;

    const id = sentenceId;
    const timer = window.setTimeout(() => {
      if (firedRef.current.has(id)) return;
      firedRef.current.add(id);
      onThresholdRef.current(id);
    }, thresholdMs);

    return () => window.clearTimeout(timer);
  }, [sentenceId, thresholdMs]);
}
