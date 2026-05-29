/**
 * TierKeyPopover — the six-tier legend that appears inside the
 * filter menu's "More" affordance.
 *
 * Phase 6 §2.2 authority: the tier-key popover lives INSIDE the
 * filter menu, not as a standalone surface. In Phase 11 (list mode),
 * FilterChips renders the "More" trigger; this component renders the
 * popover body.
 *
 * Shape:
 *   - Opens on click (NOT hover — Phase 6 §2.2 "hover as commit" was
 *     the rejected alternative).
 *   - Closes on outside click OR Escape.
 *   - role="dialog", aria-modal=false, aria-label set.
 *   - Focus is captured on open, restored to the trigger on close.
 *
 * Content per tier:
 *   - Tier name (TIER_META.label, uppercase)
 *   - Range label (TIER_META.rangeLabel)
 *   - Underline-style preview (visual — 32px wide)
 *
 * No shadcn popover dependency — we render a plain absolutely-positioned
 * glass panel per Phase 11's "no new NPM deps" rule.
 */

import { useEffect, useRef, type KeyboardEvent } from 'react';

import {
  GLASS,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  Z_LAYER,
  type Tier,
  type UnderlineStyle,
} from '../tokens';

export interface TierKeyPopoverProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** DOM ref to restore focus on close. */
  readonly triggerRef: React.RefObject<HTMLElement | null>;
}

const TIER_ORDER: readonly Tier[] = [
  'CRITICAL',
  'NEEDS_WORK',
  'FUNCTIONAL',
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
];

export function TierKeyPopover({
  open,
  onClose,
  triggerRef,
}: TierKeyPopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Outside-click to close.
  useEffect(() => {
    if (!open) return;
    const handleDocMouseDown = (e: MouseEvent) => {
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      if (!panel) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (trigger && trigger.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocMouseDown);
    };
  }, [open, onClose, triggerRef]);

  // Capture focus on open; restore to trigger on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      } else if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [open, triggerRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Tier key — six-tier severity scale"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        // Absolute positioning relative to the FilterChips row; the
        // trigger is expected to be the closest positioned ancestor.
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 6px)',
        minWidth: 260,
        padding: '12px 14px',
        borderRadius: 10,
        background: GLASS.tooltip.background,
        border: `1px solid ${GLASS.tooltip.border}`,
        backdropFilter: GLASS.tooltip.backdropFilter,
        WebkitBackdropFilter: GLASS.tooltip.backdropFilter,
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
        zIndex: Z_LAYER.tooltip,
        fontFamily: TYPOGRAPHY.families.sans,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
          color: 'hsl(220 10% 45%)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Tier key
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {TIER_ORDER.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <li
              key={tier}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 48px',
                alignItems: 'center',
                gap: 10,
                fontSize: '12px',
                lineHeight: TYPOGRAPHY.lineHeight.sans,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: `hsl(var(${TIER_CSS_VAR[tier]}))`,
                  letterSpacing: TYPOGRAPHY.tracking.tierWord,
                  whiteSpace: 'nowrap',
                }}
              >
                {meta.label}
              </span>
              <span
                style={{
                  color: 'hsl(220 10% 40%)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {meta.rangeLabel}
              </span>
              <UnderlinePreview tier={tier} style={meta.underlineStyle} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Underline preview — a 32px horizontal swatch that mirrors each tier's
// underline treatment (wavy / solid / none / shimmer). Purely visual;
// no interaction.
// ---------------------------------------------------------------------------

function UnderlinePreview({
  tier,
  style,
}: {
  readonly tier: Tier;
  readonly style: UnderlineStyle;
}) {
  const color = `hsl(var(${TIER_CSS_VAR[tier]}))`;

  if (style === 'none') {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 2,
          background: 'transparent',
          display: 'inline-block',
        }}
      />
    );
  }

  if (style === 'wavy') {
    // Pure-CSS wavy approximation via stacked repeating gradient.
    return (
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 6,
          background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 6'><path d='M0 3 Q 4 0, 8 3 T 16 3 T 24 3 T 32 3' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1.4'/></svg>") center/contain no-repeat`,
          display: 'inline-block',
        }}
      />
    );
  }

  if (style === 'shimmer') {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 2,
          background: `linear-gradient(90deg, ${color} 0%, hsl(var(${TIER_CSS_VAR.EXCEPTIONAL})) 50%, ${color} 100%)`,
          display: 'inline-block',
          borderRadius: 1,
        }}
      />
    );
  }

  // solid
  return (
    <span
      aria-hidden="true"
      style={{
        width: 32,
        height: 2,
        background: color,
        display: 'inline-block',
        borderRadius: 1,
      }}
    />
  );
}
