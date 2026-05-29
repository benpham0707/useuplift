/**
 * useInactivityTimer — single-fire timer backing the 12-second "Start
 * here" chip luminous pulse from Phase 6 §2.1.
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.1 ("if the student
 *     lingers ≥12s at Bloom-end without clicking anything, the 'Start
 *     here' chip gets a single 400ms luminous pulse — the only
 *     orientation nudge we give").
 *   - docs/ux_phases/phase_6_orientation.md §2.1 "only one pulse per
 *     session unless student takes action then becomes idle again".
 *
 * Behavior:
 *   - Starts counting when `active` flips true (Bloom-end / bloom
 *     interactive handoff).
 *   - Resets whenever `resetOn` changes identity. The orchestrator is
 *     responsible for passing a stable value that changes on every
 *     interaction it wants to count as "activity" (typically: the
 *     timestamp of the last click/keypress).
 *   - Fires `onThreshold` exactly ONCE per reset-cycle when
 *     `thresholdMs` elapses without a reset.
 *   - Does not auto-restart after firing. A subsequent reset (new
 *     interaction → new idle) re-arms the timer for a second potential
 *     fire, per §2.1 "unless student takes action then becomes idle
 *     again".
 *
 * Lifecycle rules:
 *   - `active=false` clears any pending timer (no fire even if elapsed).
 *   - Unmount clears any pending timer.
 *   - Re-arming after a fire requires a new `resetOn` change; simply
 *     toggling `active` off/on does not re-arm without a reset.
 */

import { useEffect, useRef } from 'react';

export interface UseInactivityTimerArgs {
  /**
   * Master gate — only run the timer when orientation considers the
   * user "in the editor". Typically wired to `bloomInteractive`.
   */
  readonly active: boolean;
  /**
   * Dependency value whose identity change signifies "activity".
   * Orchestrator typically passes the last-interaction timestamp.
   */
  readonly resetOn: unknown;
  /** Threshold (ms) before `onThreshold` fires. Default 12000 per §2.1. */
  readonly thresholdMs?: number;
  /**
   * Fires exactly once per reset-cycle once the threshold elapses.
   * Must be stable across renders, or wrap in useCallback.
   */
  readonly onThreshold: () => void;
}

export function useInactivityTimer(args: UseInactivityTimerArgs): void {
  const { active, resetOn, thresholdMs = 12_000, onThreshold } = args;

  // Keep the latest onThreshold in a ref so we don't re-arm the timer
  // every time the callback identity changes.
  const cbRef = useRef(onThreshold);
  useEffect(() => {
    cbRef.current = onThreshold;
  }, [onThreshold]);

  // Tracks whether we've already fired since the last reset, so a
  // no-op effect re-run (e.g. parent re-rendered without resetOn
  // changing) doesn't schedule a duplicate fire.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      return;
    }

    // New reset cycle — re-arm.
    firedRef.current = false;

    const timer = window.setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      try {
        cbRef.current();
      } catch {
        // Swallow — a thrown callback must not poison the timer.
      }
    }, thresholdMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, resetOn, thresholdMs]);
}
