/**
 * InsightTypeBadge — Phase 8 §2.2 subtle type label.
 *
 * The four `AnnotationType` values are semantic categories in the L5
 * schema; on the UI they render as a small, neutral, text-only pill —
 * NOT as a colored badge and NOT as an icon. Phase 8 §2.2 is explicit:
 *   - no colored type badges (palette collision with the tier color
 *     that already exists in the meta line);
 *   - no icons (they require a legend, which is a tax);
 *   - one short word per type, styled as a scaffolding element rather
 *     than as a decorative chip.
 *
 * The typography comes exclusively from `TYPOGRAPHY.size.sectionLabel`
 * (the same 11px uppercase scale that `WHY IT MATTERS` / `WHAT'S
 * WORKING` use), so the badge reads as a semantic-section marker, not
 * as a tier-style stripe.
 *
 * Authority:
 *   - docs/ux_phases/phase_8_reading_insight.md §2.2 (decision + copy
 *     table + rejected alternatives).
 *   - docs/ux_phases/phase_8_reading_insight.md §3.1 (sectionLabel size,
 *     tracking, case).
 */

import { TYPOGRAPHY } from '../tokens';
import type { AnnotationType } from '../types/profile';

interface InsightTypeBadgeProps {
  readonly type: AnnotationType;
}

// Phase 8 §2.2 — exact copy per type. "growth" is the default
// category; it is never rendered (the meta line stays quiet when the
// type is `growth`). The other three explicit categories surface as
// the labels below.
const TYPE_LABEL: Record<AnnotationType, string> = {
  growth: 'Growth',
  strength: 'Strength',
  structural: 'Structure',
  teaching: 'Teaching',
};

export function InsightTypeBadge({ type }: InsightTypeBadgeProps): JSX.Element {
  const label = TYPE_LABEL[type];
  return (
    <span
      // Phase 8 §2.2 — no colored badge; sage/neutral border only.
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid hsl(220 15% 86%)',
        background: 'hsl(220 15% 97% / 0.75)',
        color: 'hsl(220 15% 40%)',
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.sectionLabel,
        fontWeight: TYPOGRAPHY.weight.semibold,
        lineHeight: TYPOGRAPHY.lineHeight.sansTight,
        letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Insight type: ${label}`}
    >
      {label}
    </span>
  );
}
