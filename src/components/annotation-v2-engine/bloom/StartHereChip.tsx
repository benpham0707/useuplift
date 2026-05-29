/**
 * StartHereChip — the "Start here" affordance docked at the bottom-right
 * of the detail panel. Points the student to the top-priority CRITICAL
 * (or NEEDS_WORK) annotation as their first voluntary move after the
 * Phase 5 bloom settles.
 *
 * Authority:
 *   - docs/ux_phases/phase_5_first_reveal.md §2.6 ("Start here" chip —
 *     appears at t=2.4s, bottom-right of panel, copy #14/#15).
 *   - docs/ux_phases/phase_5_first_reveal.md §4 motion table
 *     ("Start here" chip fade-in 200ms + 2px Y, α-A
 *     DURATION.startHereChipFade).
 *   - docs/ux_phases/phase_6_orientation.md §2.1 — 12-second inactivity
 *     pulse (single 400ms luminous pulse), the only orientation nudge.
 *
 * Copy (Phase 5 §6 #14 / #15):
 *   - Default:            "Start with the top thing to try →"
 *   - Promoted (no STRONG+ variant): "Start with the first thing to try →"
 *
 * Styles:
 *   - glass-panel class (α-A workshop.css) — background + blur.
 *   - Tier-colored accent border in CRITICAL red
 *     (`hsl(var(--anno-critical))`).
 *   - Small secondary button style — matches the muted outline chip
 *     language from §2.6.
 *
 * Animations:
 *   - Fade-in 200ms + 2px Y (α-A `DURATION.startHereChipFade`, Phase 5
 *     §4 motion table).
 *   - Inactivity pulse: the consumer owns the 12s inactivity timer (this
 *     chip is stateless about time). When the consumer flips
 *     `showInactivityPulse` from false → true, we play a one-shot 400ms
 *     luminous pulse (α-A `DURATION.autoSelectPulse`, §2.1 step 7
 *     pulse language). The consumer then flips it back.
 *   - `prefers-reduced-motion`: static fade, no pulse, no arrow
 *     animation (Phase 5 §2.1 reduced-motion rule + Phase 6 §9).
 *
 * Positioning: the consumer places the chip via absolute/bottom-right
 * inside the panel container. This component doesn't self-position.
 */

import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { DURATION, EASING, TIER_CSS_VAR } from '../tokens';

export interface StartHereChipProps {
  readonly visible: boolean;
  readonly targetSentenceId: string | null;
  readonly onClick: (sentenceId: string) => void;
  readonly reducedMotion: boolean;
  /**
   * Phase 6 §2.1 — consumer flips true for one render to fire the
   * single 400ms luminous pulse. Chip auto-clears its local pulsing
   * flag after the pulse completes; consumer is expected to flip
   * back to false once the timer resets.
   */
  readonly showInactivityPulse: boolean;
  /**
   * Phase 5 §2.6 "promoted" — true when no STRONG+ sentence exists.
   * Swaps copy #14 → #15 and upgrades from muted outline to primary
   * button styling.
   */
  readonly promoted?: boolean;
  /** Optional style override for the absolute-positioning hook. */
  readonly style?: CSSProperties;
}

// Phase 5 §6 copy deck.
const COPY_DEFAULT = 'Start with the top thing to try';
const COPY_PROMOTED = 'Start with the first thing to try';

export const StartHereChip = forwardRef<HTMLButtonElement, StartHereChipProps>(
  function StartHereChip(
    {
      visible,
      targetSentenceId,
      onClick,
      reducedMotion,
      showInactivityPulse,
      promoted = false,
      style,
    },
    ref,
  ) {
    // Local pulse latch — mirrors the consumer-provided signal, then
    // auto-clears after DURATION.autoSelectPulse ms so the component
    // stops rendering the pulse even if the consumer forgets to flip
    // the prop back.
    const [pulsing, setPulsing] = useState(false);
    useEffect(() => {
      if (!showInactivityPulse || reducedMotion) {
        setPulsing(false);
        return;
      }
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), DURATION.autoSelectPulse);
      return () => clearTimeout(t);
    }, [showInactivityPulse, reducedMotion]);

    // Phase 5 §4 — 200ms fade + 2px Y-translate (or reduced-motion fade).
    const initial = reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 2 };
    const animate = reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0 };
    const exit = reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 2 };
    const transition = reducedMotion
      ? {
          duration: DURATION.reducedMotionCrossfade / 1000,
          ease: 'linear' as const,
        }
      : {
          duration: DURATION.startHereChipFade / 1000,
          ease: EASING.contentCrossfade,
        };

    const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!targetSentenceId) return;
      onClick(targetSentenceId);
    };

    const disabled = targetSentenceId === null;

    // Phase 5 §2.6 promoted primary vs muted outline.
    const baseStyle: CSSProperties = promoted
      ? {
          background: `hsl(var(${TIER_CSS_VAR.CRITICAL}) / 0.92)`,
          color: 'white',
          border: `1px solid hsl(var(${TIER_CSS_VAR.CRITICAL}))`,
        }
      : {
          background: 'rgba(255,255,255,0.85)',
          color: 'hsl(220 20% 20%)',
          border: `1px solid hsl(var(${TIER_CSS_VAR.CRITICAL}) / 0.45)`,
        };

    // Pulse overlay — single-shot luminous ring (opacity 0 → 0.35 → 0)
    // matching the Phase 5 §2.1 auto-select pulse language, repurposed
    // per Phase 6 §2.1 "the only orientation nudge".
    const pulseOverlay = pulsing && !reducedMotion ? (
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 0.35, 0], scale: [1, 1.08, 1] }}
        transition={{
          duration: DURATION.autoSelectPulse / 1000,
          ease: EASING.pulse,
        }}
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 10,
          border: `2px solid hsl(var(${TIER_CSS_VAR.CRITICAL}))`,
          pointerEvents: 'none',
        }}
      />
    ) : null;

    const copy = promoted ? COPY_PROMOTED : COPY_DEFAULT;

    return (
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            style={{
              // Caller owns absolute positioning via `style` override;
              // we default to `position: relative` for the pulse overlay.
              position: 'relative',
              display: 'inline-flex',
              ...style,
            }}
          >
            <button
              ref={ref}
              type="button"
              onClick={handleClick}
              disabled={disabled}
              // Phase 6 §2.10 accessibility — label is the copy + context.
              aria-label={
                disabled
                  ? copy
                  : `${copy}. Jumps to the top critical sentence in your essay.`
              }
              className="glass-panel"
              style={{
                // glass-panel provides bg + blur; we layer the chip's
                // own bg/border on top.
                ...baseStyle,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                fontFamily:
                  'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1.3,
                letterSpacing: '0.01em',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                // Minimum 44x44px touch target per Phase 6 §2.10 motor
                // accessibility. We use minHeight/minWidth to keep the
                // visual footprint compact while the hit area meets spec.
                minHeight: 32,
              }}
            >
              <span>{copy}</span>
              <span
                aria-hidden="true"
                style={{
                  // Simple right-arrow; no animation under reduced motion.
                  fontSize: '14px',
                  lineHeight: 1,
                  transform: 'translateY(-0.5px)',
                }}
              >
                {'\u2192'}
              </span>
              {pulseOverlay}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  },
);
