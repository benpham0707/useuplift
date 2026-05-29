/**
 * useClipboardCopy — the delayed clipboard write hook that makes
 * Phase 9 §2.3 work.
 *
 * The contract: the student presses Copy, the UI enters a `preparing`
 * state for 4s (desktop) or 6s (mobile), during which they may Cancel.
 * At the end of the delay we call `navigator.clipboard.writeText(text)`
 * and transition to `copied`. If the student cancels, no clipboard
 * write happens; if the clipboard API rejects, we surface `error`.
 *
 * Why a hook and not a service: the progress ring (0→1) drives React
 * re-renders via `progress`, and the status enum is a state-machine
 * that the UI reads directly. Extracting it into a hook gives us:
 *   - deterministic state transitions for tests
 *   - a single place to handle prefers-reduced-motion (we tick the
 *     progress every 500ms on RM instead of per-frame via rAF).
 *   - a clean cancel surface for rapid-click stress testing.
 *
 * Phase 9 §2.3 — the delay is a SPEEDBUMP, not a countdown. We expose
 * `progress` to the consumer, but the consumer CHOOSES whether to show
 * a ring. Phase 9 §2.3 notes: "a visible countdown is a dark pattern
 * because it makes the wait the subject of attention." The demo uses
 * a subtle progress ring; the real panel may show only a label swap.
 *
 * Phase 9 §4.4 — on clipboard API rejection we do NOT swallow the
 * error. Error state is exposed so the UI can render a retry.
 *
 * CLAUDE.md §2 — error handling is explicit, never silent, no
 * hardcoded fallbacks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CopyStatus =
  | 'idle'
  | 'preparing'
  | 'copied'
  | 'cancelled'
  | 'error';

export interface UseClipboardCopyOpts {
  /** The text that will be written to the clipboard on commit. */
  readonly text: string;
  /**
   * Phase 9 §2.3 — default 4s desktop. The hook auto-detects mobile
   * via `window.matchMedia('(max-width: 640px)')` and raises to 6s if
   * `delayMs` is unspecified. Explicit `delayMs` always wins.
   */
  readonly delayMs?: number;
  /**
   * Callback fired when the clipboard write succeeds. The consumer
   * uses this to surface the anti-paste toast.
   */
  readonly onCommit?: (text: string) => void;
  /** Fires when the student cancels during the preparing phase. */
  readonly onCancel?: () => void;
  /** Fires when the clipboard API rejects. Consumer may surface retry. */
  readonly onError?: (error: Error) => void;
  /**
   * prefers-reduced-motion — when true we tick progress at 500ms
   * intervals instead of per-rAF to avoid continuous animation.
   */
  readonly reducedMotion?: boolean;
}

export interface UseClipboardCopyResult {
  readonly status: CopyStatus;
  /** 0–1 during `preparing`; 0 otherwise. */
  readonly progress: number;
  /**
   * The last clipboard error (set when status === 'error'). Consumer
   * may render a toast or inline hint.
   */
  readonly error: Error | null;
  /**
   * The resolved delay that will be / was used for the current cycle.
   * Useful for aria-label microcopy ("4-second delay before copy").
   */
  readonly delayMs: number;
  /** Begins the preparing phase. Idempotent during `preparing`. */
  readonly startCopy: () => void;
  /** Aborts a preparing phase. No clipboard write happens. */
  readonly cancelCopy: () => void;
  /** Forces the state machine back to `idle`. */
  readonly resetStatus: () => void;
}

// ---------------------------------------------------------------------------
// Mobile detection
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.10 + §5.4 — mobile is the 640px breakpoint. We check at
 * call time (not at mount) because the demo's `viewport` toggle can
 * re-query this. In production the consumer passes `delayMs` directly
 * after its own media-query; the auto-detect is a convenience for the
 * demo harness.
 */
function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(max-width: 640px)').matches;
  } catch {
    return false;
  }
}

function resolveDelay(explicit: number | undefined): number {
  if (typeof explicit === 'number' && explicit >= 0) return explicit;
  return detectMobile() ? 6000 : 4000;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

/**
 * Stress test note: `startCopy` is idempotent during `preparing` —
 * clicking Copy five times in a row does NOT start five timers and
 * does NOT double-commit. The first click wins; subsequent clicks are
 * no-ops until the timer completes, cancels, or errors.
 */
export function useClipboardCopy(
  opts: UseClipboardCopyOpts,
): UseClipboardCopyResult {
  const { text, delayMs: explicitDelay, onCommit, onCancel, onError, reducedMotion } = opts;

  const [status, setStatus] = useState<CopyStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [delayMs, setDelayMs] = useState<number>(resolveDelay(explicitDelay));

  // Refs for the running animation / timer. We use refs so `cancelCopy`
  // can reliably tear down without racing against React's next render.
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const committedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic cycle counter — cancels any in-flight commit from a
  // stale cycle so rapid start/cancel/start doesn't commit the first
  // cycle's text when the second one was meant.
  const cycleRef = useRef<number>(0);

  // Cleanup helper — cancels timers + rAF without touching state.
  const teardownTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startedAtRef.current = null;
  }, []);

  // Unmount cleanup — never leak timers.
  useEffect(() => {
    return () => {
      teardownTimers();
      if (committedResetRef.current !== null) {
        clearTimeout(committedResetRef.current);
        committedResetRef.current = null;
      }
    };
  }, [teardownTimers]);

  const resetStatus = useCallback(() => {
    teardownTimers();
    if (committedResetRef.current !== null) {
      clearTimeout(committedResetRef.current);
      committedResetRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, [teardownTimers]);

  const cancelCopy = useCallback(() => {
    if (status !== 'preparing') return;
    teardownTimers();
    cycleRef.current += 1; // invalidate any in-flight commit callback
    setStatus('cancelled');
    setProgress(0);
    onCancel?.();
    // Auto-return to idle after a short beat so the cancel label can
    // animate out rather than snapping.
    const t = setTimeout(() => setStatus('idle'), 300);
    timeoutRef.current = t;
  }, [status, teardownTimers, onCancel]);

  const startCopy = useCallback(() => {
    // Phase 9 §2.3 — idempotent during preparing.
    if (status === 'preparing') return;

    // Clear any lingering committed/cancelled state before starting.
    teardownTimers();
    if (committedResetRef.current !== null) {
      clearTimeout(committedResetRef.current);
      committedResetRef.current = null;
    }
    setError(null);
    setProgress(0);

    const resolvedDelay = resolveDelay(explicitDelay);
    setDelayMs(resolvedDelay);
    setStatus('preparing');

    const myCycle = cycleRef.current + 1;
    cycleRef.current = myCycle;
    const started = performance.now();
    startedAtRef.current = started;

    // Progress ticker — rAF for smooth; setInterval for reduced motion.
    if (reducedMotion) {
      // Phase 9 §3.2 + UX_PLAN §16 — reduced-motion uses coarse 500ms
      // ticks instead of 60fps continuous animation.
      const handle = setInterval(() => {
        const startedAt = startedAtRef.current;
        if (startedAt === null) return;
        const elapsed = performance.now() - startedAt;
        const p = Math.min(1, elapsed / resolvedDelay);
        setProgress(p);
      }, 500);
      intervalRef.current = handle;
    } else {
      const tick = () => {
        const startedAt = startedAtRef.current;
        if (startedAt === null) return;
        const elapsed = performance.now() - startedAt;
        const p = Math.min(1, elapsed / resolvedDelay);
        setProgress(p);
        if (p < 1 && rafRef.current !== null) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    // The commit timer — fires at exactly delayMs.
    const handle = setTimeout(() => {
      // Stale-cycle guard: if the student cancelled + restarted, the
      // first timer's callback may still fire. Ignore it.
      if (cycleRef.current !== myCycle) return;
      teardownTimers();

      // Phase 9 §4.4 — clipboard API may reject (iframe perms,
      // insecure context, Safari private mode). We do NOT swallow.
      const writePromise =
        typeof navigator !== 'undefined' && navigator.clipboard?.writeText
          ? navigator.clipboard.writeText(text)
          : Promise.reject(new Error('Clipboard API unavailable'));

      writePromise
        .then(() => {
          if (cycleRef.current !== myCycle) return;
          setStatus('copied');
          setProgress(1);
          onCommit?.(text);
          // Return to idle after 2s so the button label can swap back.
          const resetHandle = setTimeout(() => {
            if (cycleRef.current !== myCycle) return;
            setStatus('idle');
            setProgress(0);
          }, 2000);
          committedResetRef.current = resetHandle;
        })
        .catch((e: unknown) => {
          if (cycleRef.current !== myCycle) return;
          const err = e instanceof Error ? e : new Error(String(e));
          setStatus('error');
          setProgress(0);
          setError(err);
          onError?.(err);
        });
    }, resolvedDelay);
    timeoutRef.current = handle;
  }, [status, explicitDelay, reducedMotion, text, teardownTimers, onCommit, onError]);

  return {
    status,
    progress,
    error,
    delayMs,
    startCopy,
    cancelCopy,
    resetStatus,
  };
}
