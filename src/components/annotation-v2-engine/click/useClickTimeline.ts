/**
 * useClickTimeline — ms-by-ms click response state machine (Workstream J).
 *
 * Phase 7 §2.1 + §3.1 canonical click sequence
 * --------------------------------------------
 *   t=0    pointerdown → mousedown phase, press pulse scale(1→1.012) [60ms]
 *   t=0    ring-new: fade-in starts [120ms]
 *   t=60   mousedown pulse releases → ring-fade phase
 *   t=120  ring at full opacity
 *   t=180  panel content crossfade begins (E owns the crossfade itself)
 *   t=360  crossfade complete → settled
 *
 * We model only the phases this hook actually drives:
 *   - mousedown  : t=0   → fire onRingShow
 *   - ring-fade  : t=60  → (passive; SentenceRing handles the fade-in anim)
 *   - content-swap: t=180 → fire onContentSwap (panel mode changes here)
 *   - settled    : t=360 → we're done; further clicks reset the machine
 *
 * The panel crossfade itself is driven by E's `PanelShell` via AnimatePresence
 * keyed on `panelModeTransitionKey(mode)`. This hook is the *trigger* layer:
 * it waits the 180ms, then calls `onContentSwap(id)` which the parent wires
 * to `panelMode.setSentence(id)`. The 180ms crossfade duration is E's
 * concern; we just step through the envelope that makes the ring and panel
 * feel synchronized.
 *
 * Phase 7 §3.9 reduced-motion collapse
 * ------------------------------------
 * With `reducedMotion`, we skip the ring pulse and content choreography;
 * instead we fire onContentSwap immediately and settle at
 * DURATION.reducedMotionCrossfade (220ms), matching the α-A reduced-motion
 * token. The ring still shows (via onRingShow) so the user has the "I heard
 * you" signal — the spec says "rings fade in at 140ms but do not pulse."
 *
 * Abort contract
 * --------------
 * Calling `start(id)` while a timeline is running aborts the prior schedule
 * and retargets. The onContentSwap for the old id NEVER fires — this is the
 * rapid-click guarantee from §2.4 invariant 3 ("only E's content is ever
 * rendered" in the N-click storm).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { DURATION } from '../tokens';

export type ClickTimelinePhase =
  | 'idle'
  | 'mousedown'
  | 'ring-fade'
  | 'content-swap'
  | 'settled';

export interface ClickTimelineState {
  readonly phase: ClickTimelinePhase;
  readonly sentenceId: string | null;
  /** Milliseconds since `start()` was called; 0 when idle. */
  readonly elapsedMs: number;
}

export interface UseClickTimelineArgs {
  /** Fires at t=0; the parent's SentenceRing picks this up. */
  readonly onRingShow: (sentenceId: string) => void;
  /**
   * Fires at t=180 (canonical) or t=0 (reduced motion). The parent
   * should call `panelMode.setSentence(id)` here so PanelShell's
   * AnimatePresence begins its own crossfade.
   */
  readonly onContentSwap: (sentenceId: string) => void;
  readonly reducedMotion: boolean;
  /**
   * Demo-only: 2x slower timeline for visual debugging. Production
   * callers should pass `1` or omit. Applied as a multiplier on every
   * duration — `slowMotion = 2` means mousedown runs 120ms instead of 60.
   */
  readonly slowMotion?: number;
}

export interface UseClickTimelineResult {
  readonly state: ClickTimelineState;
  readonly start: (sentenceId: string) => void;
  readonly abort: () => void;
}

// Phase 7 §3.1 — the canonical ms budgets.
const T_MOUSEDOWN_END = DURATION.mousedownPulse; // 60
const T_RING_AT_FULL = DURATION.ringFadeIn; // 120
const T_CONTENT_SWAP = DURATION.ringFadeIn + DURATION.mousedownPulse; // 180
const T_SETTLED_CANONICAL = T_CONTENT_SWAP + DURATION.contentCrossfade; // 360

export function useClickTimeline(
  args: UseClickTimelineArgs,
): UseClickTimelineResult {
  const { reducedMotion, slowMotion = 1 } = args;

  // Stable handler refs so we never close over stale callbacks.
  const onRingShowRef = useRef(args.onRingShow);
  const onContentSwapRef = useRef(args.onContentSwap);
  useEffect(() => {
    onRingShowRef.current = args.onRingShow;
    onContentSwapRef.current = args.onContentSwap;
  }, [args.onRingShow, args.onContentSwap]);

  const [state, setState] = useState<ClickTimelineState>({
    phase: 'idle',
    sentenceId: null,
    elapsedMs: 0,
  });

  // Active scheduled timers for the in-flight timeline. A single `abort()`
  // must clear them all so the stale id never reaches onContentSwap.
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const startTimeRef = useRef<number>(0);

  const clearAll = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (ms: number, fn: () => void) => {
      const adjusted = ms * slowMotion;
      if (adjusted <= 0) {
        fn();
        return;
      }
      const handle = setTimeout(fn, adjusted);
      timersRef.current.push(handle);
    },
    [slowMotion],
  );

  const abort = useCallback(() => {
    clearAll();
    setState({ phase: 'idle', sentenceId: null, elapsedMs: 0 });
  }, [clearAll]);

  const start = useCallback(
    (sentenceId: string) => {
      // Phase 7 §2.4 invariant 3 — a new click aborts the prior timeline
      // before any further state mutates. The prior id's onContentSwap
      // is guaranteed never to fire.
      clearAll();
      startTimeRef.current = performance.now();

      // t=0 : ring show + mousedown phase begins.
      onRingShowRef.current(sentenceId);
      setState({ phase: 'mousedown', sentenceId, elapsedMs: 0 });

      if (reducedMotion) {
        // Phase 7 §3.9 — collapse to a single reducedMotionCrossfade
        // envelope. Ring shown immediately; content swaps immediately;
        // state settles after DURATION.reducedMotionCrossfade.
        onContentSwapRef.current(sentenceId);
        schedule(DURATION.reducedMotionCrossfade, () => {
          setState({
            phase: 'settled',
            sentenceId,
            elapsedMs: DURATION.reducedMotionCrossfade,
          });
        });
        return;
      }

      // t=60 : mousedown pulse ends → ring-fade phase.
      schedule(T_MOUSEDOWN_END, () => {
        setState({
          phase: 'ring-fade',
          sentenceId,
          elapsedMs: T_MOUSEDOWN_END,
        });
      });

      // t=180 : fire content-swap (panel mode change).
      schedule(T_CONTENT_SWAP, () => {
        onContentSwapRef.current(sentenceId);
        setState({
          phase: 'content-swap',
          sentenceId,
          elapsedMs: T_CONTENT_SWAP,
        });
      });

      // t=360 : settled. Phase 7 §3.1 "SETTLED — click response complete."
      schedule(T_SETTLED_CANONICAL, () => {
        setState({
          phase: 'settled',
          sentenceId,
          elapsedMs: T_SETTLED_CANONICAL,
        });
      });
    },
    [clearAll, reducedMotion, schedule],
  );

  useEffect(() => {
    return () => clearAll();
  }, [clearAll]);

  return { state, start, abort };
}
