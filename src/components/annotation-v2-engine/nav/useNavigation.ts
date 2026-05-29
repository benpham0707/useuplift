/**
 * useNavigation — top-level controller that stitches together:
 *   - smartOrder  (the queue)
 *   - panel       (current sentence/mode)
 *   - navStack    (jump-back breadcrumb from F / §2.5)
 *   - viewedState (persistence from Phase 10 §2.6 / §6.2)
 *
 * Responsibilities (Phase 10 §2.1 / §2.5 / §2.7 / §2.8):
 *   - `next` / `prev`    — queue-relative advance/retreat. On each call:
 *       1. compute target via smartOrder.{nextAfter,prevBefore}
 *       2. setSentence on panel (opens insight mode on that sentence)
 *       3. push onto navStack with reason 'navNext' / 'navPrev'
 *
 *   - `jumpTo(sentenceId, reason)` — non-queue jump. Reason-aware:
 *       - 'click'     : user clicked an underline → Phase 7 §3.7 rule
 *                        "new click resets stack"; we CLEAR then push a
 *                        fresh stack entry for the new target.
 *       - 'crossref'  : pill click → PUSH onto the existing stack (§2.5).
 *       - 'navNext' / 'navPrev' : queue-relative; same as next/prev —
 *                                  push onto stack (no clear).
 *
 *   - `canNext` / `canPrev`       — edge flags.
 *   - `position`                  — { index, total } in the current queue.
 *   - `endOfReviewReached`        — reviewedCount ≥ totalCount (§2.8).
 *
 * aria-live announcement: §3.1 requires polite "Annotation N of M" on
 * advance/retreat. The announcement lives on the host (PanelShell
 * already has its live region); we expose `lastAnnouncement` for wiring.
 */

import { useCallback, useMemo, useState } from 'react';

import type { EssayProfile, SentenceProfile } from '../types/profile';
import type { UsePanelModeResult } from '../panel/usePanelMode';
import type { UseNavStackResult, NavStackReason } from '../panel/useNavStack';
import type { UseViewedStateResult } from './useViewedState';
import type {
  UseSmartOrderResult,
  SentenceFilter,
} from './useSmartOrder';

export type JumpReason = 'crossref' | 'navNext' | 'navPrev' | 'click';

export interface UseNavigationOpts {
  readonly profile: EssayProfile;
  readonly panel: UsePanelModeResult;
  readonly navStack: UseNavStackResult;
  readonly viewedState: UseViewedStateResult;
  readonly smartOrder: UseSmartOrderResult;
  /**
   * Filter applied to next/prev advancement. Phase 10 §2.4 — Tab
   * respects the filter, never bypasses it. Optional; absent = no
   * filter (All mode).
   */
  readonly filter?: SentenceFilter;
}

export interface UseNavigationResult {
  readonly next: () => void;
  readonly prev: () => void;
  readonly jumpTo: (sentenceId: string, reason: JumpReason) => void;
  readonly canNext: boolean;
  readonly canPrev: boolean;
  readonly position: { readonly index: number; readonly total: number };
  readonly endOfReviewReached: boolean;
  /** Most-recent aria-live message; null on initial mount. */
  readonly lastAnnouncement: string | null;
}

function describeAnnouncement(
  sentence: SentenceProfile | undefined,
  index: number,
  total: number,
): string {
  if (!sentence) return `Annotation ${index + 1} of ${total}`;
  return `Navigating to paragraph ${sentence.paragraphIndex + 1} sentence ${sentence.indexWithinParagraph + 1}. Annotation ${index + 1} of ${total}.`;
}

export function useNavigation(opts: UseNavigationOpts): UseNavigationResult {
  const { profile, panel, navStack, viewedState, smartOrder, filter } = opts;

  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(
    null,
  );

  const currentSentenceId = useMemo<string | null>(() => {
    if (panel.mode.kind === 'insight') return panel.mode.sentenceId;
    return null;
  }, [panel.mode]);

  // Quick lookup.
  const sentenceById = useMemo(() => {
    const map = new Map<string, SentenceProfile>();
    for (const s of profile.sentences) map.set(s.id, s);
    return map;
  }, [profile.sentences]);

  // ----- Position in the (filtered or unfiltered) queue -----
  //
  // `smartOrder.order` is the full queue. If a filter is active we
  // compute a derived "filtered index" so that the "3 of 7" display
  // reflects the student's actual filter-bounded progress (§2.4 — the
  // counter changes with the filter). Unfiltered position falls back to
  // smartOrder.positionOf.
  const { position, filteredOrder } = useMemo(() => {
    if (!filter) {
      if (currentSentenceId) {
        return {
          position: smartOrder.positionOf(currentSentenceId),
          filteredOrder: smartOrder.order,
        };
      }
      return {
        position: { index: -1, total: smartOrder.order.length },
        filteredOrder: smartOrder.order,
      };
    }
    const filtered: string[] = [];
    for (const id of smartOrder.order) {
      const s = sentenceById.get(id);
      if (s && filter(s)) filtered.push(id);
    }
    const index = currentSentenceId ? filtered.indexOf(currentSentenceId) : -1;
    return {
      position: { index, total: filtered.length },
      filteredOrder: filtered,
    };
  }, [
    currentSentenceId,
    filter,
    smartOrder,
    sentenceById,
  ]);

  // ----- canNext / canPrev -----
  const { canNext, canPrev } = useMemo(() => {
    if (filteredOrder.length === 0) {
      return { canNext: false, canPrev: false };
    }
    if (!currentSentenceId) {
      // No current sentence yet — Next always starts at the top.
      return { canNext: filteredOrder.length > 0, canPrev: false };
    }
    const idx = filteredOrder.indexOf(currentSentenceId);
    if (idx === -1) {
      // Current sentence isn't in the filtered order (e.g., user is
      // viewing a FUNCTIONAL sentence). Next restarts at index 0.
      return { canNext: filteredOrder.length > 0, canPrev: false };
    }
    return {
      canNext: idx < filteredOrder.length - 1,
      canPrev: idx > 0,
    };
  }, [currentSentenceId, filteredOrder]);

  // ----- End of review -----
  // §2.8 — all non-FUNCTIONAL sentences reviewed.
  const endOfReviewReached = useMemo(() => {
    if (smartOrder.order.length === 0) return false;
    return viewedState.reviewedCount >= smartOrder.order.length;
  }, [smartOrder.order.length, viewedState.reviewedCount]);

  // ----- Navigation primitives -----

  const goto = useCallback(
    (targetId: string, reason: NavStackReason, announceIdx: number) => {
      panel.setSentence(targetId);
      navStack.push({
        sentenceId: targetId,
        timestamp: Date.now(),
        reason,
      });
      const msg = describeAnnouncement(
        sentenceById.get(targetId),
        announceIdx,
        filteredOrder.length || smartOrder.order.length,
      );
      setLastAnnouncement(msg);
    },
    [panel, navStack, sentenceById, filteredOrder.length, smartOrder.order.length],
  );

  const next = useCallback(() => {
    if (filteredOrder.length === 0) return;
    let targetId: string | null;
    let targetIdx: number;
    if (!currentSentenceId) {
      targetId = filteredOrder[0] ?? null;
      targetIdx = 0;
    } else {
      const curIdx = filteredOrder.indexOf(currentSentenceId);
      if (curIdx === -1) {
        targetId = filteredOrder[0] ?? null;
        targetIdx = 0;
      } else if (curIdx >= filteredOrder.length - 1) {
        return;
      } else {
        targetId = filteredOrder[curIdx + 1] ?? null;
        targetIdx = curIdx + 1;
      }
    }
    if (!targetId) return;
    goto(targetId, 'navNext', targetIdx);
  }, [currentSentenceId, filteredOrder, goto]);

  const prev = useCallback(() => {
    if (!currentSentenceId || filteredOrder.length === 0) return;
    const curIdx = filteredOrder.indexOf(currentSentenceId);
    if (curIdx <= 0) return;
    const targetIdx = curIdx - 1;
    const targetId = filteredOrder[targetIdx];
    if (!targetId) return;
    goto(targetId, 'navPrev', targetIdx);
  }, [currentSentenceId, filteredOrder, goto]);

  const jumpTo = useCallback(
    (sentenceId: string, reason: JumpReason) => {
      if (reason === 'click') {
        // Phase 7 §3.7 — fresh click resets the stack.
        navStack.clear();
        panel.setSentence(sentenceId);
        navStack.push({
          sentenceId,
          timestamp: Date.now(),
          reason: 'initial',
        });
        // Announcement uses unfiltered position because the stack click
        // is stack-level, not queue-level.
        const idx = smartOrder.positionOf(sentenceId).index;
        setLastAnnouncement(
          describeAnnouncement(
            sentenceById.get(sentenceId),
            Math.max(0, idx),
            smartOrder.order.length,
          ),
        );
        return;
      }
      // crossref / navNext / navPrev — push onto existing stack.
      const stackReason: NavStackReason =
        reason === 'crossref'
          ? 'crossref'
          : reason === 'navNext'
            ? 'navNext'
            : 'navPrev';
      panel.setSentence(sentenceId);
      navStack.push({
        sentenceId,
        timestamp: Date.now(),
        reason: stackReason,
      });
      const idx = smartOrder.positionOf(sentenceId).index;
      setLastAnnouncement(
        describeAnnouncement(
          sentenceById.get(sentenceId),
          Math.max(0, idx),
          smartOrder.order.length,
        ),
      );
    },
    [navStack, panel, sentenceById, smartOrder],
  );

  return {
    next,
    prev,
    jumpTo,
    canNext,
    canPrev,
    position,
    endOfReviewReached,
    lastAnnouncement,
  };
}
