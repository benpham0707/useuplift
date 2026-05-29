/**
 * AmbientHint — the generic anchored hint chip rendered for every
 * Phase 6 orientation hint.
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.3 (hint rules: anchored,
 *     ambient fade, dismissable by click-outside/ESC/action; NO × close
 *     button).
 *   - docs/ux_phases/phase_6_orientation.md §5 (animation: fade-in
 *     220ms + 2px Y-translate, fade-out 160ms, glass background).
 *   - docs/ux_phases/phase_6_orientation.md §9 (reduced-motion: fade
 *     only, 140ms).
 *   - docs/ux_phases/phase_6_orientation.md §2.10 (accessibility:
 *     `role="status"`, `aria-live="polite"`, keyboard dismissable).
 *   - src/components/annotation-v2/tokens.ts (Z_LAYER.hint = 40;
 *     hint chips sit above tooltips/panel, below toast/modal).
 *
 * Responsibilities:
 *   - Anchors itself to a supplied `anchorRef` element, positioning 8px
 *     above it by default and flipping below if viewport-top-clipped.
 *   - Centers horizontally on the anchor, with viewport-edge clamping.
 *   - Glass-morphism chrome that matches GLASS.tooltip aesthetic (the
 *     hint is visually a first cousin of the hover tooltip).
 *   - Renders headline (14px medium sans) + body (13px regular sans
 *     muted), stacked vertically.
 *   - Fades in on visible=true, fades out on visible=false, with motion
 *     honoring `reducedMotion` per §9.
 *   - Dismisses on:
 *       • click-outside (captured at window level)
 *       • Escape key
 *       • calling `onActionTaken` from the anchor itself (consumer
 *         wires this via the action the hint teaches)
 *
 * Explicitly NOT supported:
 *   - No × close button (Phase 6 §2.3 rule 2 — implies obligation).
 *   - No tip-triangle border; the glass panel has enough visual weight
 *     on its own, and a triangle increases the perceived "coach mark"
 *     affordance we're deliberately avoiding.
 *
 * Position math:
 *   - getBoundingClientRect of anchorRef → compute centered left,
 *     then clamp 8px off each viewport edge.
 *   - Re-measured on window resize and on anchor-ref change.
 *   - If the anchor is off-screen or unmeasurable, the hint does not
 *     render (safer than floating in a nonsensical spot).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { DURATION, EASING, GLASS, TYPOGRAPHY, Z_LAYER } from '../tokens';
import type { HintDef } from './hintsRegistry';

export interface AmbientHintProps {
  readonly hint: HintDef;
  /**
   * The element the hint floats near. Consumer is responsible for
   * keeping this ref populated while `visible === true`.
   */
  readonly anchorRef: RefObject<HTMLElement>;
  readonly visible: boolean;
  readonly onDismiss: () => void;
  /**
   * Optional — consumer reports that the user took the taught action
   * (e.g., clicked the filter icon that h2 points at). AmbientHint
   * uses this to auto-dismiss through the queue's "action" path.
   */
  readonly onActionTaken?: () => void;
  readonly reducedMotion: boolean;
}

interface Pos {
  readonly top: number;
  readonly left: number;
  readonly placement: 'above' | 'below';
}

const HINT_OFFSET_PX = 8;
const HINT_MAX_WIDTH_PX = 280;
const HINT_MIN_WIDTH_PX = 200;

const measure = (el: HTMLElement | null): Pos | null => {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  // Unmeasurable anchor → don't render (rect of a detached node reads
  // all zeros; we also guard against off-screen scroll positions).
  if (rect.width === 0 && rect.height === 0) return null;

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Default: above. If anchor top is within ~80px of viewport top, flip
  // below so the hint doesn't clip.
  const placeBelow = rect.top < 80;
  const top = placeBelow
    ? rect.bottom + HINT_OFFSET_PX
    : rect.top - HINT_OFFSET_PX;

  // Horizontally center on anchor, clamp 8px from edges.
  const desiredCenter = rect.left + rect.width / 2;
  const halfWidth = HINT_MAX_WIDTH_PX / 2;
  const left = Math.max(
    8,
    Math.min(vw - HINT_MAX_WIDTH_PX - 8, desiredCenter - halfWidth),
  );

  // If the hint would fall entirely off the vertical viewport, hide.
  if (top < -100 || top > vh + 100) return null;

  return { top, left, placement: placeBelow ? 'below' : 'above' };
};

export function AmbientHint(props: AmbientHintProps): JSX.Element | null {
  const { hint, anchorRef, visible, onDismiss, onActionTaken, reducedMotion } =
    props;

  // §9 rule: hints with reducedMotionBehavior === 'skip-entirely' don't
  // render under prefers-reduced-motion. All 5 current hints are
  // 'fade-only' so this branch is inactive; kept for forward-compat
  // with hint defs that opt out.
  const shouldSkip =
    reducedMotion && hint.reducedMotionBehavior === 'skip-entirely';

  const [pos, setPos] = useState<Pos | null>(null);
  const hintElRef = useRef<HTMLDivElement | null>(null);

  // Re-measure position when visible flips on, on window resize, and on
  // anchor-ref change. We use useLayoutEffect so the first paint
  // already has correct coordinates (prevents one-frame flash at
  // top-left).
  useLayoutEffect(() => {
    if (!visible || shouldSkip) {
      setPos(null);
      return;
    }
    const update = () => setPos(measure(anchorRef.current));
    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [visible, anchorRef, shouldSkip, hint.id]);

  // ESC key → dismiss (§2.3 rule 2).
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onDismiss]);

  // Click-outside → dismiss. The anchor itself is NOT "outside" — a
  // click on the anchor fires `onActionTaken` (consumer-wired) rather
  // than `onDismiss`, so we whitelist it here.
  useEffect(() => {
    if (!visible) return;
    const onDocClick = (e: MouseEvent) => {
      const hintEl = hintElRef.current;
      const anchorEl = anchorRef.current;
      const target = e.target as Node | null;
      if (!target) return;
      if (hintEl && hintEl.contains(target)) return;
      if (anchorEl && anchorEl.contains(target)) return;
      onDismiss();
    };
    // `capture: true` so we catch the click before it triggers any
    // editor logic that might re-render the anchor.
    window.addEventListener('mousedown', onDocClick, true);
    return () => window.removeEventListener('mousedown', onDocClick, true);
  }, [visible, anchorRef, onDismiss]);

  // If the consumer wires `onActionTaken`, we listen for clicks on the
  // anchor itself. This means: "user clicked the thing the hint points
  // at → they absorbed the hint → dismiss".
  useEffect(() => {
    if (!visible || !onActionTaken) return;
    const anchorEl = anchorRef.current;
    if (!anchorEl) return;
    const handler = () => onActionTaken();
    anchorEl.addEventListener('click', handler);
    return () => anchorEl.removeEventListener('click', handler);
  }, [visible, anchorRef, onActionTaken]);

  const handleDismissClick = useCallback(() => onDismiss(), [onDismiss]);

  if (shouldSkip) return null;

  const initial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pos?.placement === 'below' ? -2 : 2 };
  const animate = reducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const exit = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pos?.placement === 'below' ? -2 : 2 };

  const transitionIn = {
    duration: reducedMotion ? 0.14 : 0.22,
    ease: EASING.contentCrossfade,
  };
  const transitionOut = {
    duration: reducedMotion ? 0.14 : 0.18,
    ease: EASING.contentCrossfade,
  };

  // Position:
  //   - For "above": we use the anchor's TOP minus offset as the hint's
  //     BOTTOM edge, so we pass a translateY(-100%) via the inline
  //     `transform` below.
  //   - For "below": top is the anchor's bottom + offset (no translate).
  const transform =
    pos?.placement === 'above' ? 'translateY(-100%)' : 'translateY(0)';

  const baseStyle: CSSProperties = {
    position: 'fixed',
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    transform,
    zIndex: Z_LAYER.hint,
    pointerEvents: visible && pos ? 'auto' : 'none',
    maxWidth: HINT_MAX_WIDTH_PX,
    minWidth: HINT_MIN_WIDTH_PX,
    background: GLASS.tooltip.background,
    backdropFilter: GLASS.tooltip.backdropFilter,
    WebkitBackdropFilter: GLASS.tooltip.backdropFilter,
    border: `1px solid ${GLASS.tooltip.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    boxShadow:
      '0 4px 14px rgba(15, 20, 40, 0.08), 0 1px 2px rgba(15, 20, 40, 0.04)',
    // Fallback: if we somehow render without `pos`, hide visually.
    visibility: pos ? 'visible' : 'hidden',
  };

  return (
    <AnimatePresence>
      {visible && pos ? (
        <motion.div
          ref={hintElRef}
          key={hint.id}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${hint.headline} ${hint.body}`}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={visible ? transitionIn : transitionOut}
          style={baseStyle}
          onClick={(e) => {
            // Allow clicks inside the hint (e.g., focus) without
            // triggering click-outside dismissal.
            e.stopPropagation();
          }}
          data-hint-id={hint.id}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: 14,
              fontWeight: TYPOGRAPHY.weight.medium,
              lineHeight: TYPOGRAPHY.lineHeight.sans,
              letterSpacing: TYPOGRAPHY.tracking.meta,
              color: 'hsl(220 20% 18%)',
              marginBottom: 2,
            }}
          >
            {hint.headline}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: 13,
              fontWeight: TYPOGRAPHY.weight.regular,
              lineHeight: TYPOGRAPHY.lineHeight.sans,
              color: 'hsl(220 10% 42%)',
            }}
          >
            {hint.body}
          </div>
          {/*
            Intentionally NO × button (§2.3 rule 2). Keyboard users
            dismiss via ESC (handled above); mouse users click outside
            or take the taught action. We expose a hidden accessible
            dismiss affordance so focus-based SR users have an explicit
            escape hatch, but it's visually off-screen.
          */}
          <button
            type="button"
            onClick={handleDismissClick}
            aria-label="Dismiss hint"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              border: 0,
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Re-export constants for tests.
export const AMBIENT_HINT_CONSTANTS = {
  OFFSET_PX: HINT_OFFSET_PX,
  MAX_WIDTH_PX: HINT_MAX_WIDTH_PX,
  MIN_WIDTH_PX: HINT_MIN_WIDTH_PX,
  FADE_IN_MS: 220,
  FADE_OUT_MS: 180,
  REDUCED_MOTION_MS: 140,
  Z_INDEX: Z_LAYER.hint,
  DURATION_REFERENCE: DURATION.panelSlide, // Token touchpoint for tooling.
} as const;
