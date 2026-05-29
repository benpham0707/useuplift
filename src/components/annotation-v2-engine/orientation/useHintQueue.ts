/**
 * useHintQueue — enforces the "max one hint on-screen at a time"
 * invariant from Phase 6 §2.3 (progressive-hint rule #4: "no two hints
 * are on screen at once — if hint N's trigger fires while hint M is
 * still visible, N queues behind M").
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.3
 *   - docs/ux_phases/phase_6_orientation.md §5 (priority order falls
 *     back to registry iteration order when multiple qualify at once)
 *
 * Behavior:
 *   - FIFO queue, deduplicated by hint id. Enqueuing a hint that is
 *     already active or queued is a no-op.
 *   - Exactly one `active` hint at a time. A new enqueue while another
 *     is active simply sits in the queue.
 *   - `dismiss(id)` — user interaction (click-outside, ESC, or hint
 *     auto-dismiss). Sets localStorage and promotes the next queued
 *     hint (if any).
 *   - `consumeThroughAction(id)` — the user performed the taught action
 *     (e.g., clicked the filter icon that h2 pointed at). Same effect
 *     as dismiss (sets localStorage, promotes next), but semantically
 *     distinct for telemetry (§12 `hint_fire_to_action_rate`).
 *
 * Not owned here:
 *   - Which hints are *eligible* (trigger evaluation) — `useOrientation`
 *     owns that and only `enqueue()`s hints whose triggers fire AND
 *     whose localStorage key is unset.
 *   - Actual render of the hint — `AmbientHint` owns that, consuming
 *     the `active` value via the orchestrator.
 */

import { useCallback, useRef, useState } from 'react';

import type { HintDef, HintId } from './hintsRegistry';
import { writeHintSeen } from './hintsRegistry';

export interface UseHintQueueResult {
  /** The currently-visible hint, or null when the queue is empty. */
  readonly active: HintDef | null;
  /**
   * Push a hint onto the queue. If the queue is empty and no hint is
   * active, the hint becomes active immediately. Otherwise it waits.
   * No-op if the hint id is already active or already queued.
   */
  readonly enqueue: (hint: HintDef) => void;
  /**
   * User dismissed the active hint (click-outside, ESC, auto-dismiss
   * timeout). Persists the seen flag + promotes the next queued hint.
   * Dismissing a hint that isn't currently active is a no-op.
   */
  readonly dismiss: (id: HintId) => void;
  /**
   * User took the taught action. Same persistence + promotion as
   * dismiss; provided as a separate entry-point for telemetry and for
   * callers that need to distinguish "acted" vs "ignored" dismissals.
   */
  readonly consumeThroughAction: (id: HintId) => void;
  /** Diagnostic — current queue contents (not including `active`). */
  readonly pending: readonly HintId[];
}

export function useHintQueue(): UseHintQueueResult {
  const [active, setActive] = useState<HintDef | null>(null);
  // Pending queue of hint defs behind `active`. We keep the full defs
  // (not just ids) so promotion is O(1) and doesn't depend on a
  // registry lookup.
  const pendingRef = useRef<HintDef[]>([]);
  // Mirror of `pending` as a plain state so consumers can render the
  // queue for debugging / demo inspection. The authoritative list is
  // `pendingRef.current`; this is only read for diagnostics.
  const [pending, setPending] = useState<readonly HintId[]>([]);

  const syncPending = useCallback(() => {
    setPending(pendingRef.current.map((h) => h.id));
  }, []);

  const enqueue = useCallback(
    (hint: HintDef) => {
      setActive((current) => {
        // Already on-screen → silent no-op. Phase 6 §2.3 "one-shot":
        // the hint can't be re-queued while it's live.
        if (current && current.id === hint.id) return current;
        // Already pending → silent no-op.
        if (pendingRef.current.some((h) => h.id === hint.id)) return current;

        if (!current) {
          // Nothing active — hint goes live immediately.
          return hint;
        }
        // Something active — queue behind it.
        pendingRef.current = [...pendingRef.current, hint];
        syncPending();
        return current;
      });
    },
    [syncPending],
  );

  const promoteNext = useCallback(() => {
    const next = pendingRef.current.shift() ?? null;
    setActive(next);
    syncPending();
  }, [syncPending]);

  const dismiss = useCallback(
    (id: HintId) => {
      setActive((current) => {
        if (!current || current.id !== id) return current;
        // Persist seen flag — this is the one-shot commit point.
        writeHintSeen(current.localStorageKey);
        // Promote next on the next microtask so React can commit the
        // unmount first (prevents a visible "flash" where two hints
        // render in the same frame).
        queueMicrotask(promoteNext);
        return null;
      });
    },
    [promoteNext],
  );

  const consumeThroughAction = useCallback(
    (id: HintId) => {
      // Semantically distinct from `dismiss` for telemetry but the
      // state transition is identical: persist + promote.
      setActive((current) => {
        if (!current || current.id !== id) return current;
        writeHintSeen(current.localStorageKey);
        queueMicrotask(promoteNext);
        return null;
      });
    },
    [promoteNext],
  );

  return {
    active,
    enqueue,
    dismiss,
    consumeThroughAction,
    pending,
  };
}
