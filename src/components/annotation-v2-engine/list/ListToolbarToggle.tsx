/**
 * ListToolbarToggle — the list-icon button that enters/exits list
 * mode from the panel's toolbar.
 *
 * Phase 11 §2.1 authority:
 *   - The toggle is THE discovery path into list mode (no tab strip,
 *     no auto-entry). A single toolbar toggle, pinned top-right.
 *   - Icon: a list/grid glyph (lucide's `List` chosen for horizontal
 *     stripes; matches the "planning is a list of rows" mental model).
 *   - Active state: tier-neutral stone background + subtle outline.
 *   - Inactive: icon only (ghost button).
 *
 * Accessibility:
 *   - `aria-label` — "Toggle list view" / "Close list view and
 *     return to reading" per §4.1.
 *   - `aria-pressed` reflects whether list-mode is active.
 *   - Keyboard: native `<button>`, Enter/Space activate.
 */

import { List as ListIcon } from 'lucide-react';

export interface ListToolbarToggleProps {
  readonly active: boolean;
  readonly onToggle: () => void;
}

export function ListToolbarToggle({
  active,
  onToggle,
}: ListToolbarToggleProps) {
  // Phase 11 §4.1 aria-label variants.
  const label = active
    ? 'Close list view and return to reading'
    : 'Open list view of all feedback';

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 6,
        border: active
          ? '1px solid hsl(220 15% 75%)'
          : '1px solid transparent',
        background: active ? 'hsl(220 15% 92%)' : 'transparent',
        color: active ? 'hsl(220 20% 25%)' : 'hsl(220 10% 45%)',
        cursor: 'pointer',
        transition: 'background-color 120ms linear, color 120ms linear',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'hsl(220 15% 95%)';
          e.currentTarget.style.color = 'hsl(220 15% 30%)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'hsl(220 10% 45%)';
        }
      }}
    >
      <ListIcon size={16} aria-hidden="true" />
    </button>
  );
}
