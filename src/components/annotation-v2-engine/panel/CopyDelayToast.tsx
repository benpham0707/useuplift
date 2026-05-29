/**
 * CopyDelayToast — Phase 9 §2.3 anti-paste reminder.
 *
 * When the clipboard write commits, this toast surfaces at the bottom
 * of the viewport with the reminder:
 *   "Hold on — think first. If you're about to paste this into your
 *    essay, pause. Rewrite in your own words so the sentence is still
 *    yours."
 *
 * Phase 9 §7.2 Rule 1: the toast is the conscience on the copy path.
 * §2.3: the toast "lingers ~4s" but Phase 9 §7.2's ethical framing
 * justifies our 8s default (see rewriteCopy.ts for the rationale) —
 * this toast is the LAST thing the student sees before context-
 * switching back to their editor, so it deserves the extra beat.
 *
 * Positioning: bottom-center of the viewport. NOT bottom-right (which
 * is the conventional "success" position, and we don't want success
 * vibe). Center draws the eye up from the editor where the student is
 * about to paste.
 *
 * Accessibility: `role="alert"` + `aria-live="assertive"` is
 * deliberate. Phase 9 §7.2 Rule 1 + §9.9 (open question 9) agree the
 * student needs an interruption here, not a passive chrome element.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { GLASS, Z_LAYER } from '../tokens';
import { REWRITE_ANTI_PASTE_TOAST } from './rewriteCopy';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CopyDelayToastProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly reducedMotion?: boolean;
  /**
   * Override the 8s default — tests / stress-cases want shorter. If
   * `null` is passed, disable auto-dismiss entirely (student must
   * click Understood).
   */
  readonly autoDismissMs?: number | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CopyDelayToast({
  visible,
  onDismiss,
  reducedMotion = false,
  autoDismissMs,
}: CopyDelayToastProps): JSX.Element {
  // Auto-dismiss. Phase 9 §2.3 — 4s template; we default to 8s for the
  // anti-paste variant because it carries more ethical weight.
  const resolvedTimeout =
    autoDismissMs === undefined
      ? REWRITE_ANTI_PASTE_TOAST.autoDismissMs
      : autoDismissMs;

  useEffect(() => {
    if (!visible) return;
    if (resolvedTimeout === null) return;
    const handle = setTimeout(() => onDismiss(), resolvedTimeout);
    return () => clearTimeout(handle);
  }, [visible, resolvedTimeout, onDismiss]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          // Phase 9 §2.3 + §7.2 Rule 1 — this IS an interruption.
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 20 }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0 }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 12 }
          }
          transition={{
            duration: reducedMotion ? 0.12 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: 'fixed',
            // Bottom-center — §2.3 "we want it noticed," away from the
            // conventional bottom-right success zone.
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: Z_LAYER.toast,
            // Phase 9 §3.7 — glass aesthetic compliance; toast uses the
            // modal-weight glass (heavier blur) to fully separate from
            // editor prose behind it.
            background: GLASS.modal.background,
            backdropFilter: GLASS.modal.backdropFilter,
            WebkitBackdropFilter: GLASS.modal.backdropFilter,
            border: `1px solid ${GLASS.modal.border}`,
            borderRadius: 12,
            boxShadow:
              '0 10px 30px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(15, 23, 42, 0.08)',
            padding: '14px 18px',
            maxWidth: 420,
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
            color: 'hsl(220 20% 20%)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.01em',
              lineHeight: 1.3,
              color: 'hsl(220 25% 18%)',
            }}
          >
            {REWRITE_ANTI_PASTE_TOAST.title}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'hsl(220 15% 32%)',
              fontWeight: 400,
            }}
          >
            {REWRITE_ANTI_PASTE_TOAST.body}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              style={{
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid hsl(220 20% 82%)',
                background: 'hsl(220 15% 99%)',
                color: 'hsl(220 25% 22%)',
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              {REWRITE_ANTI_PASTE_TOAST.cta}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
