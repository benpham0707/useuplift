/**
 * Phase 4 — Cancel Button component.
 *
 * Authority:
 *   - docs/ux_phases/phase_4_loading_state.md §2.7 (button visual rules:
 *     ghost by default, promoted to outlined past 25s)
 *   - docs/ux_phases/phase_4_loading_state.md §2.9 (placement, keyboard
 *     shortcut, confirm dialog >10s)
 *   - docs/ux_phases/phase_4_loading_state.md §2.5 (disabled during
 *     the 600ms fast-path floor)
 *
 * Visual contract:
 *   - Small secondary button labelled "Cancel" — no icon by default.
 *   - Ghost style (transparent background, muted text). Promotes to
 *     outlined when `promoted === true` (consumer passes this after
 *     25s elapsed — Phase 4 §2.6 table).
 *   - Disabled during the first 600ms after analyse start to match the
 *     fast-path motion-legibility floor. The orchestrator hook exposes
 *     `elapsedMs`; the consumer derives `disabled = elapsedMs < 600`.
 *   - Accessibility: `aria-label="Cancel analysis"` is explicit; the
 *     visible label "Cancel" is intentionally terse (toolbar chrome).
 *
 * Confirmation logic (Phase 4 §2.9) — the confirm-if-elapsed-over-10s
 * dialog lives in the consumer, not here. This component just fires
 * `onCancel` when clicked and leaves the flow decision to the caller.
 */

import { TYPOGRAPHY } from '../tokens';

interface CancelButtonProps {
  readonly onCancel: () => void;
  /**
   * True during the 600ms fast-path floor after start; blocks accidental
   * immediate cancels that can't be visually parsed.
   */
  readonly disabled?: boolean;
  /**
   * Phase 4 §2.6 — after 25s elapsed, caller flips this to promote
   * the button from ghost to outlined.
   */
  readonly promoted?: boolean;
  readonly className?: string;
}

export function CancelButton({
  onCancel,
  disabled = false,
  promoted = false,
  className,
}: CancelButtonProps): JSX.Element {
  const baseStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.families.sans,
    fontSize: '13px',
    fontWeight: TYPOGRAPHY.weight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.sans,
    letterSpacing: TYPOGRAPHY.tracking.meta,
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background-color 150ms ease-out, border-color 150ms ease-out, opacity 150ms ease-out',
  };

  const ghostStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'hsl(220 15% 40%)',
    border: '1px solid transparent',
  };

  const outlinedStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'hsl(220 20% 30%)',
    border: '1px solid hsl(220 15% 55% / 0.55)',
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onCancel}
      disabled={disabled}
      aria-label="Cancel analysis"
      style={{
        ...baseStyle,
        ...(promoted ? outlinedStyle : ghostStyle),
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = 'hsl(220 15% 90% / 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      Cancel
    </button>
  );
}

export default CancelButton;
