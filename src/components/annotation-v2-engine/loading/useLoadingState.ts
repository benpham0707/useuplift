/**
 * Phase 4 — Loading-state orchestrator hook.
 *
 * Authority:
 *   - docs/ux_phases/phase_4_loading_state.md §2.1 (layer progression)
 *   - docs/ux_phases/phase_4_loading_state.md §2.2 (paragraph_tints_ready
 *     cross-lap at L3.5 completion → Phase 5 bloom consumer)
 *   - docs/ux_phases/phase_4_loading_state.md §2.5 (600ms fast-path floor)
 *   - docs/ux_phases/phase_4_loading_state.md §2.6 (slow-path threshold)
 *   - docs/ux_phases/phase_4_loading_state.md §2.8 (reveal_ready →
 *     Phase 5 hand-off)
 *   - docs/ux_phases/phase_4_loading_state.md §2.9 (cancellation)
 *
 * Consumes `createMockLoadingStream` from fixtures/loadingScript.ts. The
 * mock mirrors the real SSE endpoint contract (§6) — when the backend
 * lands, this hook is re-wired by swapping the import, not by changing
 * its own state machine.
 *
 * State machine:
 *
 *   idle  ──start()──▶  active  ──all layers + reveal_ready──▶  settling
 *                       │                                       │
 *                       │                                       └── floor
 *                       │                                           reached
 *                       │                                           ──▶ done
 *                       │
 *                       └──cancel()──▶ cancelled
 *
 * The `settling` phase only differs from `done` by whether the 600ms
 * motion-legibility floor has been met. Consumers (VaporScan, ribbon)
 * keep rendering in settling; transition choreography (Phase 5 bloom)
 * waits for `done` via `revealReady`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { LayerName, MockLoadingStream } from '../types/navigation';
import { createMockLoadingStream } from '../fixtures/loadingScript';
import {
  SLOW_PATH_THRESHOLDS,
  resolveCaption,
} from './captions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadingStatus =
  | 'idle'
  | 'active'
  | 'settling'
  | 'done'
  | 'cancelled';

export interface UseLoadingStateOpts {
  /**
   * Phase 4 §2.5 — focused re-analysis uses the short fast-path
   * timeline and a single "Updating affected paragraphs…" caption.
   */
  readonly fastPath?: boolean;

  /**
   * Phase 4 §2.5 — motion-legibility floor. If the pipeline completes
   * before this window elapses, the hook holds at `settling` until
   * the floor is reached before transitioning to `done`. Default 600ms.
   */
  readonly minFastPathMs?: number;

  /**
   * Phase 4 §2.6 — when elapsed exceeds this, `isSlowPath` flips and
   * consumers may swap to the reassurance caption tier.
   * Default is the `reassuranceMs` threshold (18s).
   */
  readonly slowPathThresholdMs?: number;

  /**
   * Phase 4 §2.6 hard ceiling — 45s auto-cancel. Defaults to
   * `SLOW_PATH_THRESHOLDS.autoCancelMs`. Pass `null` to disable (useful
   * for slow-path simulation demos).
   */
  readonly hardCeilingMs?: number | null;

  /**
   * Injectable stream factory — defaults to `createMockLoadingStream`
   * but the production wiring will pass a real SSE-backed factory
   * without changing the hook body.
   */
  readonly createStream?: (opts: { readonly fastPath?: boolean }) => MockLoadingStream;
}

export interface UseLoadingState {
  readonly status: LoadingStatus;
  readonly activeLayer: LayerName | null;
  readonly completedLayers: ReadonlySet<LayerName>;
  /** Resolved caption string for the current state. */
  readonly caption: string;
  /** True once elapsed crosses the slow-path threshold. */
  readonly isSlowPath: boolean;
  /**
   * Phase 4 §2.2 — flips true at `paragraph_tints_ready` (L3.5
   * completion). Downstream Wave β-D bloom consumer watches this
   * signal for the cross-lap with paragraph tints pre-bloom.
   */
  readonly paragraphTintsReady: boolean;
  /**
   * Phase 4 §2.8 — flips true at `reveal_ready` (L5 completion, after
   * the fast-path floor). Phase 5 choreography gates on this.
   */
  readonly revealReady: boolean;
  readonly elapsedMs: number;
  readonly fastPath: boolean;
  readonly start: () => void;
  readonly cancel: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLoadingState(opts: UseLoadingStateOpts = {}): UseLoadingState {
  const {
    fastPath = false,
    minFastPathMs = 600,
    slowPathThresholdMs = SLOW_PATH_THRESHOLDS.reassuranceMs,
    hardCeilingMs = SLOW_PATH_THRESHOLDS.autoCancelMs,
    createStream = createMockLoadingStream,
  } = opts;

  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [activeLayer, setActiveLayer] = useState<LayerName | null>(null);
  const [completedLayers, setCompletedLayers] = useState<ReadonlySet<LayerName>>(
    () => new Set<LayerName>(),
  );
  const [paragraphTintsReady, setParagraphTintsReady] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Imperative refs — stream, timers, start-time. Using refs avoids
  // stale-closure bugs when `start` / `cancel` are called from event
  // handlers set up long before the state changes.
  const streamRef = useRef<MockLoadingStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const floorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ceilingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stash the latest `revealReady` timestamp so the floor wait-period
  // can be computed even if React defers state commits.
  const pipelineCompleteAtRef = useRef<number | null>(null);

  // Cleanup helper — centralizes timer + stream teardown so every
  // status transition away from `active` goes through one path.
  const teardown = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel();
      streamRef.current = null;
    }
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (floorTimerRef.current) {
      clearTimeout(floorTimerRef.current);
      floorTimerRef.current = null;
    }
    if (ceilingTimerRef.current) {
      clearTimeout(ceilingTimerRef.current);
      ceilingTimerRef.current = null;
    }
  }, []);

  // --------- cancel ---------
  const cancel = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'done' || prev === 'cancelled' || prev === 'idle') return prev;
      return 'cancelled';
    });
    setActiveLayer(null);
    setRevealReady(false); // Cancellation does not trigger Phase 5 hand-off.
    teardown();
  }, [teardown]);

  // --------- start ---------
  const start = useCallback(() => {
    // Defensive: if called while already running, reset first.
    teardown();
    setStatus('active');
    setActiveLayer(null);
    setCompletedLayers(new Set<LayerName>());
    setParagraphTintsReady(false);
    setRevealReady(false);
    setElapsedMs(0);
    pipelineCompleteAtRef.current = null;

    const startedAt = Date.now();
    startedAtRef.current = startedAt;

    // Elapsed-ms tick @ 100ms — drives slow-path caption swaps and the
    // demo's elapsed display. Fine-grained enough to cross the 12s /
    // 18s / 25s thresholds within one frame of perceptual accuracy.
    tickIntervalRef.current = setInterval(() => {
      if (startedAtRef.current == null) return;
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 100);

    // Hard ceiling — Phase 4 §2.6 auto-cancel at 45s.
    if (hardCeilingMs !== null) {
      ceilingTimerRef.current = setTimeout(() => {
        cancel();
      }, hardCeilingMs);
    }

    const stream = createStream({ fastPath });
    streamRef.current = stream;

    stream.events$((event) => {
      switch (event.type) {
        case 'layer_start': {
          setActiveLayer(event.layer);
          break;
        }
        case 'layer_complete': {
          setCompletedLayers((prev) => {
            const next = new Set(prev);
            next.add(event.layer);
            return next;
          });
          // The upstream script fires `layer_complete` at the same
          // time as the next layer's `layer_start` (except for the
          // final L5). Leave `activeLayer` untouched here — the next
          // `layer_start` will overwrite it. For L5, the final layer,
          // `reveal_ready` fires in the same tick and resolves the
          // state transition below.
          break;
        }
        case 'paragraph_tints_ready': {
          // Phase 4 §2.2 — cross-lap signal for Phase 5 bloom.
          setParagraphTintsReady(true);
          break;
        }
        case 'reveal_ready': {
          // Pipeline finished. Enforce Phase 4 §2.5 600ms floor before
          // flipping to `done`.
          pipelineCompleteAtRef.current = Date.now();
          const startedAtVal = startedAtRef.current;
          if (startedAtVal == null) return;

          const pipelineElapsed = pipelineCompleteAtRef.current - startedAtVal;
          setActiveLayer(null);
          setStatus('settling');

          const remaining = Math.max(0, minFastPathMs - pipelineElapsed);
          const finalize = () => {
            setRevealReady(true);
            setStatus('done');
            // Clear the ceiling timer — we finished in time.
            if (ceilingTimerRef.current) {
              clearTimeout(ceilingTimerRef.current);
              ceilingTimerRef.current = null;
            }
            // Stop the elapsed tick — the number stops advancing at
            // the moment of completion.
            if (tickIntervalRef.current) {
              clearInterval(tickIntervalRef.current);
              tickIntervalRef.current = null;
            }
          };

          if (remaining === 0) {
            finalize();
          } else {
            floorTimerRef.current = setTimeout(finalize, remaining);
          }
          break;
        }
        case 'heartbeat':
          // Phase 4 §6 — server liveness. No state change; the real
          // SSE wiring uses these to reset a disconnect timer. The
          // mock emits them for contract parity.
          break;
        default: {
          // Exhaustiveness guard — the type system catches new
          // `LayerEvent` variants at compile time.
          const _exhaustive: never = event;
          return _exhaustive;
        }
      }
    });
  }, [cancel, createStream, fastPath, hardCeilingMs, minFastPathMs, teardown]);

  // --------- cleanup on unmount ---------
  useEffect(() => {
    return () => {
      teardown();
      startedAtRef.current = null;
    };
  }, [teardown]);

  // --------- derived: caption + slow-path flag ---------
  const isSlowPath = elapsedMs >= slowPathThresholdMs;
  const caption = resolveCaption({
    activeLayer,
    elapsedMs,
    fastPath,
    cancelled: status === 'cancelled',
    revealReady,
  });

  return {
    status,
    activeLayer,
    completedLayers,
    caption,
    isSlowPath,
    paragraphTintsReady,
    revealReady,
    elapsedMs,
    fastPath,
    start,
    cancel,
  };
}
