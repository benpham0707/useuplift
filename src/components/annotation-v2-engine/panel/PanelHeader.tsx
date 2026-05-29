/**
 * PanelHeader — the fixed top strip above the panel body.
 *
 * Renders three variants based on mode:
 *   - overview → "Analysis complete" supertitle + optional essay title.
 *   - insight  → breadcrumb slot · meta line (¶N · sentence M · TIER)
 *                · progress bar slot.
 *   - list     → "All annotations" + current filter chip summary.
 *
 * The tier accent strip (2px strip at the very top of the panel
 * mandated by Phase 7 §2.3) is rendered as an absolutely-positioned
 * child so it can INTERPOLATE its color across tier changes rather
 * than crossfade (per §2.2 "visual spine of the one-panel feeling").
 *
 * Authority:
 *   - docs/ux_phases/phase_7_click_panel_open.md §2.3 (meta line,
 *     tier strip interpolation).
 *   - docs/ux_phases/phase_8_reading_insight.md §2.6, §3.1 (panel
 *     header typography, maxProseCh gutters).
 *   - docs/ux_phases/phase_5_first_reveal.md §2.3 (overview supertitle
 *     uppercase sage 12px).
 *   - docs/ux_phases/phase_10_navigation.md (progress bar slot —
 *     Workstream H fills in).
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type { PanelMode } from './PanelModes';
import type { EssayProfile } from '../types/profile';

interface PanelHeaderProps {
  readonly mode: PanelMode;
  readonly profile: EssayProfile;
  readonly reducedMotion: boolean;
  /**
   * Phase 10 cross-reference breadcrumb (Workstream F fills this in).
   * Rendered left-of-meta in insight mode; ignored in overview/list.
   */
  readonly breadcrumbSlot?: ReactNode;
  /**
   * Phase 10 §progress bar — 3px tier-gradient strip. Workstream H
   * fills this in. Rendered at the bottom edge of the header.
   */
  readonly progressBarSlot?: ReactNode;
  /** ESC in insight/list mode closes to overview (Phase 7 §2.6). */
  readonly onCloseToOverview?: () => void;
}

/**
 * Resolve the tier that drives the accent strip color for the current
 * mode. Overview = neutral (no tier). Insight = the clicked sentence's
 * tier. List = neutral.
 */
function resolveAccentTier(
  mode: PanelMode,
  profile: EssayProfile,
): Tier | null {
  if (mode.kind !== 'insight') return null;
  const sentence = profile.sentences.find((s) => s.id === mode.sentenceId);
  return sentence?.tier ?? null;
}

/**
 * Phase 7 §2.3 — meta line color for the TIER word.
 * FUNCTIONAL (sage) renders at 70% saturation per Phase 8 §3.1 table
 * to preserve the "visual silence" rule.
 */
function tierWordColor(tier: Tier): string {
  if (tier === 'FUNCTIONAL') {
    return `hsl(var(${TIER_CSS_VAR[tier]}) / 0.70)`;
  }
  return `hsl(var(${TIER_CSS_VAR[tier]}))`;
}

/**
 * Build the meta line string for an insight mode.
 * Phase 7 §2.3 + Phase 5 §6 #5 —
 *   `¶{paragraphNumber} · sentence {sentenceNumber} · {TIER}`
 * (paragraph + sentence are 1-indexed for display).
 */
interface MetaParts {
  readonly paragraphLabel: string;
  readonly sentenceLabel: string;
  readonly tier: Tier;
  readonly tierLabel: string;
}

function resolveMetaParts(
  mode: PanelMode,
  profile: EssayProfile,
): MetaParts | null {
  if (mode.kind !== 'insight') return null;
  const sentence = profile.sentences.find((s) => s.id === mode.sentenceId);
  if (!sentence) return null;
  return {
    paragraphLabel: `\u00B6${sentence.paragraphIndex + 1}`,
    sentenceLabel: `sentence ${sentence.indexWithinParagraph + 1}`,
    tier: sentence.tier,
    tierLabel: TIER_META[sentence.tier].label,
  };
}

function listFilterSummary(mode: PanelMode): string {
  if (mode.kind !== 'list') return '';
  const chips: string[] = [];
  if (mode.filter.critical) chips.push('Critical only');
  if (mode.filter.unreviewed) chips.push('Unreviewed');
  if (mode.filter.strengths) chips.push('Strengths');
  return chips.length === 0 ? 'All tiers' : chips.join(' \u00B7 ');
}

export function PanelHeader({
  mode,
  profile,
  reducedMotion,
  breadcrumbSlot,
  progressBarSlot,
  onCloseToOverview,
}: PanelHeaderProps) {
  const accentTier = resolveAccentTier(mode, profile);
  const meta = resolveMetaParts(mode, profile);

  // Phase 7 §2.2 — tier strip interpolates (not crossfade). When there
  // is no tier (overview/list), the strip holds at neutral.
  const stripColor = accentTier
    ? `hsl(var(${TIER_CSS_VAR[accentTier]}) / 0.85)`
    : 'hsl(220 15% 85% / 0.35)';

  return (
    <header
      className="relative"
      style={{
        paddingTop: TYPOGRAPHY.panelPaddingTop,
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        paddingBottom: '14px',
      }}
    >
      {/* Phase 7 §2.3 — tier accent strip. Color interpolates across
          sentence changes; does NOT participate in the body crossfade. */}
      <motion.div
        aria-hidden="true"
        className="absolute left-0 right-0 top-0"
        style={{ height: 2, background: stripColor }}
        animate={{ background: stripColor }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: DURATION.contentCrossfade / 1000, ease: EASING.pulse }
        }
      />

      <HeaderContent
        mode={mode}
        profile={profile}
        meta={meta}
        breadcrumbSlot={breadcrumbSlot}
        onCloseToOverview={onCloseToOverview}
      />

      {/* Phase 10 — progress bar slot. 3px strip along the bottom edge
          of the header; Workstream H renders the gradient fill into it. */}
      {progressBarSlot ? (
        <div
          className="absolute left-0 right-0"
          style={{ bottom: 0, height: 3 }}
        >
          {progressBarSlot}
        </div>
      ) : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Internal — per-mode content inside the header.
// ---------------------------------------------------------------------------

interface HeaderContentProps {
  readonly mode: PanelMode;
  readonly profile: EssayProfile;
  readonly meta: MetaParts | null;
  readonly breadcrumbSlot?: ReactNode;
  readonly onCloseToOverview?: () => void;
}

function HeaderContent({
  mode,
  profile,
  meta,
  breadcrumbSlot,
  onCloseToOverview,
}: HeaderContentProps) {
  if (mode.kind === 'overview') {
    return (
      <div className="flex items-baseline justify-between gap-4">
        <div>
          {/* Phase 5 §6 #1 — supertitle: sentence-case "Analysis complete".
              Spec copy deck uses the YOUR ESSAY, ANALYZED all-caps
              pattern for the OverviewCard body; the HEADER variant is
              the subtler "Analysis complete" intentionally (the card's
              supertitle is where the all-caps lives, per §2.3). */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.panelHeader,
              fontWeight: TYPOGRAPHY.weight.semibold,
              lineHeight: TYPOGRAPHY.lineHeight.sans,
              color: 'hsl(220 15% 25%)',
              letterSpacing: TYPOGRAPHY.tracking.prose,
            }}
          >
            Analysis complete
          </div>
          {/* Phase 5 §2.3 — essay title line (placeholder uses essayId
              until backend provides real titles). Kept lowercase + muted
              so it reads as context, not a headline. */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.meta,
              fontWeight: TYPOGRAPHY.weight.regular,
              color: 'hsl(220 10% 50%)',
              marginTop: 2,
              letterSpacing: TYPOGRAPHY.tracking.meta,
            }}
          >
            {profile.paragraphs.length} paragraphs analyzed
          </div>
        </div>
      </div>
    );
  }

  if (mode.kind === 'list') {
    return (
      <div className="flex items-baseline justify-between gap-4">
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.panelHeader,
            fontWeight: TYPOGRAPHY.weight.semibold,
            color: 'hsl(220 15% 25%)',
          }}
        >
          All annotations
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            fontWeight: TYPOGRAPHY.weight.medium,
            color: 'hsl(220 10% 45%)',
            letterSpacing: TYPOGRAPHY.tracking.meta,
          }}
        >
          {listFilterSummary(mode)}
        </div>
        {onCloseToOverview ? (
          <CloseHint onClose={onCloseToOverview} />
        ) : null}
      </div>
    );
  }

  // Insight mode — the meta line is the payload, plus breadcrumb slot.
  if (!meta) {
    // Phase 7 §6 cache miss — hold sentence-less state gracefully. Not
    // a skeleton (§2.4 bans them); just an empty line until F resolves.
    return (
      <div
        style={{
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.meta,
          color: 'hsl(220 10% 50%)',
          letterSpacing: TYPOGRAPHY.tracking.meta,
          minHeight: 18,
        }}
      />
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2 min-w-0">
        {breadcrumbSlot ? (
          <div className="shrink-0">{breadcrumbSlot}</div>
        ) : null}
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            fontWeight: TYPOGRAPHY.weight.medium,
            color: 'hsl(220 10% 45%)',
            letterSpacing: TYPOGRAPHY.tracking.meta,
            fontStyle: 'italic',
            // Phase 7 §2.3 — small-caps + italic meta line. small-caps
            // is applied via font-variant so the TIER word reads as a
            // compact label, not a shout.
            fontVariant: 'small-caps',
          }}
        >
          <span>{meta.paragraphLabel}</span>
          <span style={{ margin: '0 6px', opacity: 0.5 }}>
            {'\u00B7'}
          </span>
          <span>{meta.sentenceLabel}</span>
          <span style={{ margin: '0 6px', opacity: 0.5 }}>
            {'\u00B7'}
          </span>
          {/* Phase 7 §2.3 / Phase 8 §3.1 — the TIER word is the single
              place we render the tier name as a full word; it is tier-
              colored to reinforce the color→word mapping. */}
          <span
            style={{
              color: tierWordColor(meta.tier),
              fontWeight: TYPOGRAPHY.weight.semibold,
              letterSpacing: TYPOGRAPHY.tracking.tierWord,
            }}
          >
            {meta.tierLabel}
          </span>
        </div>
      </div>
      {onCloseToOverview ? <CloseHint onClose={onCloseToOverview} /> : null}
    </div>
  );
}

/**
 * Minimal ESC affordance. Wave β only — Workstream F/J will expand
 * this into a proper close button with hover states + keyboard hints.
 * Surfacing it now keeps ESC discoverable in the demo.
 */
function CloseHint({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close insight, return to overview"
      // Phase 7 §2.6 — ESC returns to overview. The button is a visual
      // affordance for the same command; keyboard users get ESC for free.
      style={{
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.meta,
        color: 'hsl(220 10% 50%)',
        background: 'transparent',
        border: 'none',
        padding: '2px 6px',
        cursor: 'pointer',
        letterSpacing: TYPOGRAPHY.tracking.meta,
      }}
    >
      Esc
    </button>
  );
}
