/**
 * FilterChips — the three-chip filter row rendered above the list's
 * grouped rows.
 *
 * Phase 11 §2.4 authority:
 *   - Exactly three chips: Critical only · Unreviewed · Strengths.
 *   - One-tap toggles, AND composition (no radio-style).
 *   - A `More` trigger (no emoji, text affordance) opens the
 *     TierKeyPopover per Phase 6 §2.2.
 *   - Active chip: tier-toned left border for `Critical only`; muted
 *     border for `Unreviewed` and `Strengths`.
 *   - Count badges inline per §4.5.
 *   - 120ms color transition on click per §3.6.
 *
 * Accessibility:
 *   - Each chip is a real `<button>` with `aria-pressed` reflecting
 *     active state.
 *   - Keyboard shortcuts 1/2/3 to toggle chips are owned by the
 *     consumer (ListView); this component exposes plain click
 *     handlers.
 */

import { useRef, useState } from 'react';

import {
  TIER_CSS_VAR,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type { FilterState } from '../types/navigation';
import { TierKeyPopover } from './TierKeyPopover';

export interface FilterChipCounts {
  readonly critical: number;
  readonly unreviewed: number;
  readonly strengths: number;
}

export interface FilterChipsProps {
  readonly filter: FilterState;
  readonly counts: FilterChipCounts;
  readonly onFilterChange: (next: FilterState) => void;
}

export function FilterChips({
  filter,
  counts,
  onFilterChange,
}: FilterChipsProps) {
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const moreRef = useRef<HTMLButtonElement | null>(null);

  const toggle = (key: keyof FilterState) => {
    onFilterChange({ ...filter, [key]: !filter[key] });
  };

  return (
    <div
      role="toolbar"
      aria-label="Filter feedback"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `0 ${TYPOGRAPHY.panelPaddingX}`,
        marginBottom: 12,
        position: 'relative',
      }}
    >
      <Chip
        label="Critical only"
        count={counts.critical}
        active={filter.critical}
        borderTier="CRITICAL"
        onClick={() => toggle('critical')}
      />
      <Chip
        label="Unreviewed"
        count={counts.unreviewed}
        active={filter.unreviewed}
        onClick={() => toggle('unreviewed')}
      />
      <Chip
        label="Strengths"
        count={counts.strengths}
        active={filter.strengths}
        borderTier="STRONG"
        onClick={() => toggle('strengths')}
      />
      <button
        ref={moreRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-label="Open tier key and additional filters"
        onClick={() => setMoreOpen((v) => !v)}
        style={{
          height: 28,
          padding: '0 10px',
          borderRadius: 14,
          border: '1px solid hsl(220 15% 85%)',
          background: moreOpen ? 'hsl(220 15% 93%)' : 'white',
          color: 'hsl(220 15% 35%)',
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 120ms linear',
          marginLeft: 'auto',
        }}
      >
        More
      </button>
      <TierKeyPopover
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        triggerRef={moreRef}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chip — a single filter toggle.
// ---------------------------------------------------------------------------

interface ChipProps {
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  /** When active and a tier is provided, border uses that tier's color. */
  readonly borderTier?: Tier;
  readonly onClick: () => void;
}

function Chip({ label, count, active, borderTier, onClick }: ChipProps) {
  // Phase 11 §2.4 — active state does NOT use a check-mark glyph (the
  // no-checkmark rule from Phase 10 §6 applies here too). Instead, the
  // active chip gets a visible left border in its tier color (or muted
  // stone when no tier is provided) plus a stronger text color.
  const activeBorderColor = borderTier
    ? `hsl(var(${TIER_CSS_VAR[borderTier]}))`
    : 'hsl(220 20% 40%)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        padding: '0 12px',
        borderRadius: 14,
        border: active
          ? `1px solid ${activeBorderColor}`
          : '1px solid hsl(220 15% 85%)',
        borderLeftWidth: active ? '3px' : '1px',
        borderLeftColor: activeBorderColor,
        background: active ? 'hsl(220 15% 96%)' : 'white',
        color: active ? 'hsl(220 20% 20%)' : 'hsl(220 15% 40%)',
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition:
          'background-color 120ms linear, border-color 120ms linear, color 120ms linear',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: '11px',
          fontWeight: 500,
          color: active ? 'hsl(220 20% 30%)' : 'hsl(220 10% 55%)',
        }}
      >
        ({count})
      </span>
    </button>
  );
}
