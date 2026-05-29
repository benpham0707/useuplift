/**
 * CrossRefPill — Phase 8 §2.9 inline click-commit jump link.
 *
 * Renders a small rounded-full pill that sits inline with serif prose
 * (baseline-aligned) and jumps the panel to a target sentence. The
 * pill commits to navigation (not a hover-preview) because Phase 8
 * §2.9 is explicit: "Pills commit to navigation. The breadcrumb makes
 * navigation reversible. Together they turn cross-references into a
 * navigation mesh."
 *
 * Visual contract (Phase 8 §2.9 + §3.1):
 *   - 4px horizontal padding, 2px vertical.
 *   - 1px ring at the target tier's accent at 30% opacity.
 *   - Small tier-colored dot PREFIX so the student sees the target's
 *     tier before they jump (matches the "¶4 · s2 · TIER" meta-line
 *     vocabulary they've been learning).
 *   - Label: `¶N` for paragraph-scope refs (CrossRef.direction === 'back'
 *     and label matches `¶\d+$`) or `¶N · sM` for sentence-scope refs.
 *     We accept whatever is on `CrossRef.label` — the fixture authors
 *     format it — and just render it faithfully.
 *   - Hover: subtle darken + tooltip with the 140-char preview.
 *
 * Accessibility:
 *   - `aria-label="Jump to paragraph N, sentence M — <preview>"`.
 *   - Focusable. Enter/Space activates.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.9 (pill spec, click
 *     semantics, breadcrumb integration).
 *   - docs/ux_phases/phase_8_reading_insight.md §3.1 (pillInline size,
 *     pillRing color-mix rule).
 */

import { useState, useId, type KeyboardEvent } from 'react';

import { TIER_CSS_VAR, TYPOGRAPHY, type Tier } from '../tokens';
import type { CrossRef } from '../types/profile';

export interface CrossRefPillProps {
  readonly crossRef: CrossRef;
  /**
   * Tier of the TARGET sentence (for the ring + dot color). Caller
   * resolves this from the profile since CrossRef itself is tier-
   * agnostic; this keeps the pill a leaf component with no profile
   * dependency.
   */
  readonly targetTier: Tier;
  readonly onClick: (targetSentenceId: string) => void;
  readonly reducedMotion: boolean;
}

/**
 * Build the accessibility label. Phase 8 §2.9 calls out
 * `"Jump to paragraph 1, sentence 2 — earned moment"`-style copy.
 * We reconstruct the paragraph/sentence numbers from the `label` when
 * possible (`¶N` or `¶N · sM`), falling back to the raw label.
 */
function buildAriaLabel(crossRef: CrossRef): string {
  const pMatch = crossRef.label.match(/¶(\d+)/);
  const sMatch = crossRef.label.match(/s(\d+)/);
  if (pMatch && sMatch) {
    return `Jump to paragraph ${pMatch[1]}, sentence ${sMatch[1]} — ${crossRef.preview}`;
  }
  if (pMatch) {
    return `Jump to paragraph ${pMatch[1]} — ${crossRef.preview}`;
  }
  return `Jump to ${crossRef.label} — ${crossRef.preview}`;
}

export function CrossRefPill({
  crossRef,
  targetTier,
  onClick,
  reducedMotion,
}: CrossRefPillProps): JSX.Element {
  const [hover, setHover] = useState(false);
  const tooltipId = useId();

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(crossRef.targetSentenceId);
    }
  };

  // Phase 8 §3.1 — pill ring is `color-mix(var(--tier-accent) 30%)`.
  // We render it directly via `hsl(var(--anno-<tier>) / 0.30)` since
  // the tier CSS custom properties are defined in workshop.css.
  const tierVar = TIER_CSS_VAR[targetTier];
  const ringColor = `hsl(var(${tierVar}) / 0.35)`;
  const dotColor = `hsl(var(${tierVar}))`;

  // Phase 8 §3.1 — pillInline typography. Sizes/weights/tracking are
  // strictly token-driven so any later retune lands automatically.
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    margin: '0 2px',
    borderRadius: 999,
    border: `1px solid ${ringColor}`,
    background: hover ? 'hsl(220 15% 94% / 0.9)' : 'hsl(220 15% 97% / 0.6)',
    color: 'hsl(220 20% 25%)',
    fontFamily: TYPOGRAPHY.families.sans,
    fontSize: TYPOGRAPHY.size.pillInline,
    fontWeight: TYPOGRAPHY.weight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.sansTight,
    letterSpacing: TYPOGRAPHY.tracking.pill,
    // baseline-align with serif prose so the pill sits IN the line,
    // not above it. `verticalAlign: 'baseline'` would drop the pill's
    // top under the serif cap-height; `middle` with an explicit line-
    // height keeps it optically centered in a 15px/1.55 line.
    verticalAlign: 'middle',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: reducedMotion ? 'none' : 'background 140ms ease-out',
    // Force a consistent inline-box height so the pill doesn't
    // visibly grow the line-height of the enclosing paragraph.
    minHeight: 0,
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label={buildAriaLabel(crossRef)}
        aria-describedby={hover ? tooltipId : undefined}
        onClick={() => onClick(crossRef.targetSentenceId)}
        onKeyDown={handleKey}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        style={baseStyle}
      >
        {/* Tier dot — 6px circle at 100% tier color. Phase 8 §2.9 calls
            for a tier preview on the pill; a dot is the minimum-weight
            carrier and matches the disclosure-row dot pattern. */}
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dotColor,
            flex: '0 0 auto',
          }}
        />
        <span>{crossRef.label}</span>
      </button>

      {/* Phase 8 §2.9 hover tooltip — 2-line preview. Positioned
          below the pill so prose above is unobstructed. */}
      {hover ? (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 30,
            maxWidth: 280,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid hsl(220 15% 88%)',
            boxShadow: '0 4px 14px rgba(20, 30, 50, 0.10)',
            backdropFilter: 'blur(10px) saturate(1.3)',
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            lineHeight: TYPOGRAPHY.lineHeight.sans,
            color: 'hsl(220 15% 25%)',
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          {crossRef.preview.length > 140
            ? `${crossRef.preview.slice(0, 140).trimEnd()}…`
            : crossRef.preview}
        </span>
      ) : null}
    </span>
  );
}
