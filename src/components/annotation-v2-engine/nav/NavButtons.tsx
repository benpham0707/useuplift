/**
 * NavButtons — Prev / position-indicator / Next row.
 *
 * Layout (Phase 10 §2.2 "built-in, not floating"; §2.3 count pairing):
 *
 *   [ ← Prev ]   [ 3 of 12 ]   [ Next → ]
 *
 *   Tab to advance · ESC to close         (appears after first close —
 *                                          Phase 6 shortcut-hint rule)
 *
 * Styling:
 *   - sage-toned secondary buttons.
 *   - disabled state when at queue edges (canPrev / canNext false).
 *   - no idle pulse at this surface (the pulse is on the `Next →`
 *     *inside the panel footer* per §2.2; this row is a secondary
 *     affordance under the insight card in the demo; the pulse logic
 *     is owned by F's InsightCard footer — we stay quiet here).
 *
 * Keyboard: this component DOES NOT register global shortcuts — those
 * live in `useKeyboardShortcuts`. The buttons are click-only.
 * Accessibility: `aria-disabled` + a concrete aria-label per button
 * (position-aware so SR users hear "Next — annotation 4 of 12").
 */

import { motion } from 'motion/react';

import { DURATION, TYPOGRAPHY } from '../tokens';

export interface NavButtonsProps {
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  /** Position in the current queue. `index` is 0-based; UI shows +1. */
  readonly position: { readonly index: number; readonly total: number };
  /**
   * Phase 6 — the keyboard-hint row appears after the first panel
   * close. The host owns the "first close has happened" signal and
   * passes this flag.
   */
  readonly shortcutHintVisible: boolean;
  readonly reducedMotion: boolean;
}

export function NavButtons(props: NavButtonsProps) {
  const {
    onPrev,
    onNext,
    canPrev,
    canNext,
    position,
    shortcutHintVisible,
    reducedMotion,
  } = props;

  const positionLabel =
    position.total <= 0
      ? '—'
      : `${Math.max(0, position.index) + 1} of ${position.total}`;

  const hintTransition = reducedMotion
    ? { duration: 0 }
    : { duration: DURATION.captionSwapIn / 1000, ease: 'easeOut' as const };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        fontFamily: TYPOGRAPHY.families.sans,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <NavButton
          label="Prev"
          glyph="←"
          glyphSide="left"
          disabled={!canPrev}
          ariaLabel={
            canPrev
              ? `Previous — annotation ${position.index} of ${position.total}`
              : 'Previous — disabled, at start of queue'
          }
          onClick={onPrev}
        />

        <div
          aria-live="polite"
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            fontWeight: TYPOGRAPHY.weight.medium,
            letterSpacing: TYPOGRAPHY.tracking.meta,
            color: 'hsl(220 10% 40%)',
            minWidth: 64,
            textAlign: 'center',
          }}
        >
          {positionLabel}
        </div>

        <NavButton
          label="Next"
          glyph="→"
          glyphSide="right"
          disabled={!canNext}
          ariaLabel={
            canNext
              ? `Next — annotation ${position.index + 2} of ${position.total}`
              : 'Next — disabled, at end of queue'
          }
          onClick={onNext}
        />
      </div>

      {shortcutHintVisible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={hintTransition}
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            letterSpacing: TYPOGRAPHY.tracking.meta,
            color: 'hsl(220 10% 55%)',
          }}
        >
          Tab to advance · ESC to close
        </motion.div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single button — local to this file.
// ---------------------------------------------------------------------------

interface NavButtonInternalProps {
  readonly label: string;
  readonly glyph: string;
  readonly glyphSide: 'left' | 'right';
  readonly disabled: boolean;
  readonly ariaLabel: string;
  readonly onClick: () => void;
}

function NavButton(props: NavButtonInternalProps) {
  const { label, glyph, glyphSide, disabled, ariaLabel, onClick } = props;
  const sageBorder = disabled
    ? 'hsl(145 15% 85%)'
    : 'hsl(145 25% 50% / 0.55)';
  const sageText = disabled ? 'hsl(220 10% 65%)' : 'hsl(145 35% 30%)';
  const sageBg = disabled ? 'hsl(220 15% 97%)' : 'hsl(145 35% 97%)';
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 6,
        border: `1px solid ${sageBorder}`,
        background: sageBg,
        color: sageText,
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.panelHeader,
        fontWeight: TYPOGRAPHY.weight.medium,
        letterSpacing: TYPOGRAPHY.tracking.meta,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 120ms ease-out, border-color 120ms ease-out',
      }}
    >
      {glyphSide === 'left' ? <span aria-hidden="true">{glyph}</span> : null}
      <span>{label}</span>
      {glyphSide === 'right' ? <span aria-hidden="true">{glyph}</span> : null}
    </button>
  );
}
