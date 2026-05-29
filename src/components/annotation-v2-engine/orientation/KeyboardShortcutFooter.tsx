/**
 * KeyboardShortcutFooter — the small, persistent row of keyboard
 * shortcut reminders that appears in the panel footer after the
 * student closes the panel for the first time.
 *
 * Authority:
 *   - docs/ux_phases/phase_6_orientation.md §2.5 ("At first panel close.
 *     This is the moment the student has completed one full
 *     open→read→close loop. They've tasted the interaction; they're
 *     primed to ask 'is there a faster way?'").
 *   - docs/ux_phases/phase_6_orientation.md §5 (localStorage one-shot
 *     pattern carries over to this surface).
 *
 * Design decision — the × exception:
 *   Phase 6 §2.3 rule 2 bans × close buttons on *transient hint chips*
 *   because the × implies obligation and interrupts the ambient-fade
 *   dismissal pattern. The keyboard footer is NOT a transient chip —
 *   it's a persistent footer that would otherwise stay visible for the
 *   entire session. We give it an explicit × affordance because:
 *
 *     1. Persistent surfaces need a user-initiated close; ambient
 *        fade-on-action doesn't apply because the footer is attached
 *        to the panel footer, not floating near an anchor.
 *     2. The × here functions as the same one-shot commit a
 *        transient hint's dismiss action performs — it sets the
 *        `KEYBOARD_FOOTER_STORAGE_KEY` and the footer never returns.
 *     3. Users who never dismiss can still benefit from the reminder
 *        indefinitely, which is the whole point of the persistent
 *        footer surface — the × is opt-OUT, not opt-IN.
 *
 *   This is the only × in the Phase 6 orientation surface. Documented
 *   here so future reviews don't "fix" it.
 *
 * Responsibilities:
 *   - Render a small sans-serif row: `Tab to advance · ↑/↓ to navigate
 *     · L to list view · ESC to close`.
 *   - Fade in (220ms) when `visible` flips true; fade out (180ms) on
 *     dismiss.
 *   - Small × icon on the right; clicking it calls `onDismiss`.
 *   - Respect `reducedMotion` (140ms crossfade, no Y-translate — §9).
 *   - ARIA `role="note"` per Workstream K contract (this is advisory
 *     content, not a status announcement).
 *
 * Consumer places this at the bottom of the PanelShell via its footer
 * slot. The component is layout-neutral (no fixed positioning); it
 * sits in the normal panel flow.
 */

import { AnimatePresence, motion } from 'motion/react';
import { type CSSProperties } from 'react';

import { EASING, TYPOGRAPHY } from '../tokens';

export interface KeyboardShortcutFooterProps {
  readonly visible: boolean;
  /**
   * Fires when the student clicks the × to permanently dismiss the
   * footer. Consumer owns the localStorage commit via
   * `useOrientation`'s `keyboardShortcutFooterVisible` reducer path.
   */
  readonly onDismiss: () => void;
  readonly reducedMotion: boolean;
}

// Shortcut string — Phase 6 §2.5 / §6 copy discipline. Sentence case,
// middot separators, no "Pro tip!" framing.
// The literal copy is pinned by the workstream contract:
//   "Tab to advance · ↑/↓ to navigate · L to list view · ESC to close"
const SHORTCUT_TEXT = 'Tab to advance \u00b7 \u2191/\u2193 to navigate \u00b7 L to list view \u00b7 ESC to close';

const FOOTER_HEIGHT = 28;

export function KeyboardShortcutFooter(
  props: KeyboardShortcutFooterProps,
): JSX.Element {
  const { visible, onDismiss, reducedMotion } = props;

  const initial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 2 };
  const animate = reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const exit = reducedMotion ? { opacity: 0 } : { opacity: 0, y: 2 };

  const transition = {
    duration: reducedMotion ? 0.14 : 0.22,
    ease: EASING.contentCrossfade,
  };

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '6px 12px',
    minHeight: FOOTER_HEIGHT,
    borderTop: '1px solid rgba(15, 20, 40, 0.06)',
    background: 'rgba(250, 251, 253, 0.6)',
    fontFamily: TYPOGRAPHY.families.sans,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.sans,
    letterSpacing: TYPOGRAPHY.tracking.meta,
    color: 'hsl(220 10% 48%)',
    userSelect: 'none',
  };

  const textStyle: CSSProperties = {
    // Let the sentence wrap gracefully on narrow viewports rather than
    // overflowing out of the panel.
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: '1 1 auto',
    minWidth: 0,
  };

  const dismissStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    border: 0,
    background: 'transparent',
    borderRadius: 4,
    color: 'hsl(220 10% 48%)',
    cursor: 'pointer',
    flex: '0 0 auto',
    fontSize: 14,
    lineHeight: 1,
    opacity: 0.7,
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="note"
          aria-label={`Keyboard shortcuts: ${SHORTCUT_TEXT}`}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          style={containerStyle}
          data-keyboard-shortcut-footer="true"
        >
          <span style={textStyle} aria-hidden="true">
            {SHORTCUT_TEXT}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss keyboard shortcut footer"
            title="Hide"
            style={dismissStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(15, 20, 40, 0.06)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {'\u00d7'}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export const KEYBOARD_SHORTCUT_FOOTER_TEXT = SHORTCUT_TEXT;
