/**
 * SageEmptyState — Phase 7 §2.5 "Working as intended" empty state.
 *
 * When a student clicks a FUNCTIONAL sentence — the "sage" tier that
 * has no underline, no annotations, and no rewrite — the insight tab
 * shows a single curated line that names what the sentence is doing
 * right rather than a blank panel. Phase 7 §2.5 established that the
 * empty state exists; Phase 8 §Profile-curated (see §2.1 closing para)
 * specifies the content:
 *
 *   "Working as intended"
 *   "This sentence carries its weight. No fix needed."
 *   → View in Profile
 *
 * No tier chroma is applied (FUNCTIONAL has no tier color in the panel
 * per Phase 5 §2.4 "visual silence"). The surface is lightly sage-
 * tinted via the neutral 220-hue palette we use for scaffolding.
 *
 * Authority:
 *   - docs/ux_phases/phase_7_click_panel_open.md §2.5 (empty-state
 *     contract — "working as intended", profile-preview CTA).
 *   - docs/ux_phases/phase_8_reading_insight.md §2.1 (FUNCTIONAL sends
 *     the student into Profile; §2.6 sage text color at 70%).
 */

import { TYPOGRAPHY } from '../tokens';

export interface SageEmptyStateProps {
  /** Phase 7 §2.5 — CTA fires the Profile-tab switch. */
  readonly onViewProfile: () => void;
}

export function SageEmptyState({ onViewProfile }: SageEmptyStateProps): JSX.Element {
  return (
    <section
      aria-label="Working as intended"
      style={{
        // Phase 8 §3.1 panel paddings so the empty state respects the
        // same prose gutter every other card uses.
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        paddingTop: '40px',
        paddingBottom: TYPOGRAPHY.panelPaddingBottom,
        maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      {/* Phase 7 §2.5 — header reads as a statement, not a label. */}
      <h2
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.families.serif,
          fontSize: '18px',
          fontWeight: TYPOGRAPHY.weight.regular,
          lineHeight: TYPOGRAPHY.lineHeight.serifProse,
          color: 'hsl(150 15% 30% / 0.85)',
        }}
      >
        Working as intended
      </h2>

      {/* Body — one friendly confident sentence. No hedging. */}
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.families.serif,
          fontSize: TYPOGRAPHY.size.whyBody,
          fontWeight: TYPOGRAPHY.weight.regular,
          lineHeight: TYPOGRAPHY.lineHeight.serifProse,
          color: 'hsl(220 15% 40%)',
        }}
      >
        This sentence carries its weight. No fix needed.
      </p>

      {/* Phase 7 §2.5 — "View in Profile" CTA is inline text, not a
          button-chrome pill. Clicking switches the insight mode tab. */}
      <button
        type="button"
        onClick={onViewProfile}
        style={{
          marginTop: 10,
          padding: '4px 0',
          background: 'transparent',
          border: 'none',
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.panelHeader,
          fontWeight: TYPOGRAPHY.weight.medium,
          lineHeight: TYPOGRAPHY.lineHeight.sans,
          letterSpacing: TYPOGRAPHY.tracking.meta,
          color: 'hsl(150 30% 35%)',
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        View in Profile {'\u2192'}
      </button>
    </section>
  );
}
