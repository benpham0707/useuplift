/**
 * useHoverTooltip — 300ms delayed hover tooltip state (Workstream J).
 *
 * Phase 6 §2.2 orientation spec pins the hover tooltip delay at
 * DURATION.hoverTooltipDelay (300ms). Phase 7 §2.5 further specifies:
 *   - The "2px accent dot" is a Workstream B concern (editor-layer hint).
 *   - The tooltip (tier + headline preview) is Workstream J's.
 *   - On click → tooltip dismisses immediately.
 *   - On cursor leave → tooltip fades out (120ms handled by the view
 *     layer; this hook just clears `tooltipId`).
 *
 * We simplify the §2.5 ladder here: B already renders the 180ms dot via
 * CSS on the sentence decoration; J's tooltip appears at the
 * DURATION.hoverTooltipDelay threshold (300ms), which matches the spec's
 * tooltip-appearance contract.
 *
 * State distinction:
 *   - `hoveredId` : whatever sentence the pointer is currently over. Used
 *     by consumers that want to react to hover without the delay.
 *   - `tooltipId` : the sentence the tooltip is currently anchored on.
 *     Becomes non-null only after the delay elapses with the same id
 *     still hovered.
 *
 * Click dismiss (§2.5 "tooltip immediately dismisses regardless of timer"):
 *   The parent ClickManager calls `dismiss()` from its click handler so
 *   the tooltip drops the moment the student commits.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { DURATION } from '../tokens';

export interface UseHoverTooltipArgs {
  /** Phase 6 §2.2 default — DURATION.hoverTooltipDelay (300ms). */
  readonly delayMs?: number;
  readonly onShow?: (sentenceId: string) => void;
  readonly onHide?: () => void;
}

export interface UseHoverTooltipResult {
  readonly hoveredId: string | null;
  readonly tooltipId: string | null;
  readonly reportEnter: (sentenceId: string) => void;
  readonly reportLeave: () => void;
  /** Force immediate dismiss — call from click / Escape handlers. */
  readonly dismiss: () => void;
}

export function useHoverTooltip(
  args: UseHoverTooltipArgs = {},
): UseHoverTooltipResult {
  const { delayMs = DURATION.hoverTooltipDelay } = args;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onShowRef = useRef(args.onShow);
  const onHideRef = useRef(args.onHide);
  useEffect(() => {
    onShowRef.current = args.onShow;
    onHideRef.current = args.onHide;
  }, [args.onShow, args.onHide]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setTooltipId((current) => {
      if (current != null) onHideRef.current?.();
      return null;
    });
  }, [clearTimer]);

  const reportEnter = useCallback(
    (sentenceId: string) => {
      // New hover target → reset the timer. If the target is the same as
      // the currently-hovered id, we leave the timer running (same-id
      // re-enter is a no-op; typical during PM's mouseover delegation
      // which can fire multiple times on the same span as the cursor
      // moves between word boundaries inside the sentence).
      setHoveredId((current) => {
        if (current === sentenceId) return current;
        clearTimer();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setTooltipId(sentenceId);
          onShowRef.current?.(sentenceId);
        }, delayMs);
        return sentenceId;
      });
    },
    [clearTimer, delayMs],
  );

  const reportLeave = useCallback(() => {
    clearTimer();
    setHoveredId(null);
    setTooltipId((current) => {
      if (current != null) onHideRef.current?.();
      return null;
    });
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    hoveredId,
    tooltipId,
    reportEnter,
    reportLeave,
    dismiss,
  };
}
