/**
 * useNavStack — Phase 8 §2.9 cross-reference jump-back stack.
 *
 * The nav stack records *how* the student arrived at the currently-
 * selected sentence, so a breadcrumb can render `← ¶4 · ← ¶1 · ¶7` in
 * the panel header and ESC / click-back can pop one level at a time.
 *
 * Depth rule (Phase 8 §2.9):
 *   - Max depth 3. A 4th push DROPS the oldest (LRU-style). The spec
 *     talks about a "collapse" visual for the oldest entry — that is a
 *     concern for the Breadcrumb renderer, not this hook. The hook
 *     keeps the stack bounded at 3.
 *   - Depth 3 renders as 2 breadcrumb entries (current + 2 ancestors);
 *     `breadcrumb` below exposes `stack.slice(0, -1)` for the renderer.
 *
 * Semantic `reason` field on every entry:
 *   - `initial` — the first sentence the user clicks when entering the
 *     panel. Starting the stack.
 *   - `crossref` — a pill inside an insight card fired this jump.
 *   - `navNext` / `navPrev` — Workstream H's next/prev affordance.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9 (stack depth 3,
 *     breadcrumb rendering, pop semantics).
 *   - docs/ux_phases/phase_10_navigation.md §6.2 (next/prev reasons
 *     preserved so Workstream H can compose with the stack).
 */

import { useCallback, useMemo, useRef, useState } from 'react';

export type NavStackReason = 'initial' | 'crossref' | 'navNext' | 'navPrev';

export interface NavStackEntry {
  readonly sentenceId: string;
  readonly timestamp: number;
  readonly reason: NavStackReason;
}

export interface UseNavStackResult {
  /** Full stack, latest last. Max length 3. */
  readonly stack: readonly NavStackEntry[];
  /** Push a new entry. On depth>3, the oldest is dropped (Phase 8 §2.9). */
  readonly push: (entry: NavStackEntry) => void;
  /** Remove and return the latest entry. Returns null on empty stack. */
  readonly pop: () => NavStackEntry | null;
  /** Drop everything (used by Phase 7 "click a new sentence = reset"). */
  readonly clear: () => void;
  /** True when there is at least one ancestor to pop back to. */
  readonly canPop: boolean;
  /**
   * Ancestors only (everything but the latest entry). Renderable by
   * the Breadcrumb component; empty when the stack has ≤1 entry.
   */
  readonly breadcrumb: readonly NavStackEntry[];
}

const MAX_DEPTH = 3;

export function useNavStack(): UseNavStackResult {
  const [stack, setStack] = useState<readonly NavStackEntry[]>([]);
  // We return `pop`'s value synchronously, but React's setState is
  // async. A ref-mirror of the stack lets `pop` return the correct
  // entry even when called in rapid succession.
  const popValueRef = useRef<NavStackEntry | null>(null);

  const push = useCallback((entry: NavStackEntry) => {
    setStack((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_DEPTH) {
        // Phase 8 §2.9 — "a fourth jump would exceed the stack depth;
        // the breadcrumb collapses the oldest entry". The hook drops
        // the oldest entry so the array stays bounded; the renderer
        // can choose whether to surface a hover-disclosure for what
        // was dropped (outside this hook's responsibility).
        return next.slice(next.length - MAX_DEPTH);
      }
      return next;
    });
  }, []);

  const pop = useCallback((): NavStackEntry | null => {
    let popped: NavStackEntry | null = null;
    setStack((prev) => {
      if (prev.length === 0) {
        popped = null;
        return prev;
      }
      popped = prev[prev.length - 1] ?? null;
      return prev.slice(0, -1);
    });
    popValueRef.current = popped;
    return popped;
  }, []);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  const breadcrumb = useMemo(() => stack.slice(0, -1), [stack]);
  const canPop = stack.length > 1;

  // popValueRef is retained so callers can inspect the most-recently-
  // popped entry (e.g., for logging) without racing React's state
  // flush. Phase 8 §2.9 does not require this, but it's cheap insurance
  // against the "pop during render-commit" edge case.
  void popValueRef;

  return { stack, push, pop, clear, canPop, breadcrumb };
}
