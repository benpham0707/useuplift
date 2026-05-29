/**
 * OverviewCard — Phase 5 §2.3 default-state content for the panel.
 *
 * Three stacked zones:
 *   Zone 1 — Supertitle "YOUR ESSAY, ANALYZED" + paragraph/word stats.
 *   Zone 2 — "Your strongest moment" pull-quote (serif 15–18px italic)
 *            with attribution meta line.
 *   Zone 3 — "Your improvement phase" badge + most-important-next
 *            one-liner + one-line header narrative.
 *   Action row — "Start here →" primary button → top priority sentence;
 *                "View all annotations" secondary → list mode.
 *
 * Anti-scoring rule (Phase 5 §2.2): no aggregate score, no percent, no
 * "N issues" counter. Labels only, never totals.
 *
 * Fade-in: 400ms content crossfade AFTER the panel has finished its
 * 250ms slide-in. The PanelShell owns the slide; OverviewCard's own
 * animation is a self-contained fade so it still works when the shell
 * is already visible (e.g., mode-switch from list → overview).
 */

import { motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type { EssayProfile } from '../types/profile';

interface OverviewCardProps {
  readonly profile: EssayProfile;
  readonly reducedMotion: boolean;
  /**
   * Navigate to the first priority-0 "thing to try" target. If no top
   * target exists (early-draft edge case), the button falls back to
   * the overview's `topThingsToTry[0]` — see Phase 5 §2.6 fallback.
   */
  readonly onStartHere?: (sentenceId: string) => void;
  readonly onOpenList?: () => void;
}

// Phase 5 §2.2 — ImprovementPhase names only. No numeric values.
const PHASE_COPY: Record<
  EssayProfile['improvementPhase'],
  { readonly label: string; readonly subtitle: string }
> = {
  Foundation: {
    label: 'FOUNDATION',
    subtitle: 'essay-level focus',
  },
  Architecture: {
    label: 'ARCHITECTURE',
    subtitle: 'paragraph-level focus',
  },
  Craft: {
    label: 'CRAFT',
    subtitle: 'sentence-level focus',
  },
  Polish: {
    label: 'POLISH',
    subtitle: 'word-level focus',
  },
  Distinction: {
    label: 'DISTINCTION',
    subtitle: 'memorability focus',
  },
};

function tierAccent(tier: Tier): string {
  if (tier === 'FUNCTIONAL') {
    return `hsl(var(${TIER_CSS_VAR[tier]}) / 0.70)`;
  }
  return `hsl(var(${TIER_CSS_VAR[tier]}))`;
}

/**
 * Cheap word-count — splits on whitespace, no dictionaries. Zones
 * don't need exact values; the student just needs a sense of scale.
 */
function wordCount(essayText: string): number {
  const trimmed = essayText.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

export function OverviewCard({
  profile,
  reducedMotion,
  onStartHere,
  onOpenList,
}: OverviewCardProps) {
  const { overview } = profile;
  const { strongestMoment } = overview;
  const topTry = overview.topThingsToTry[0];
  const phaseCopy = PHASE_COPY[overview.improvementPhase];

  // Phase 5 §2.3 Zone-2 meta line: "¶N · sentence M · TIER".
  const attribParagraph = `\u00B6${strongestMoment.paragraphIndex + 1}`;
  const attribSentence = `sentence ${strongestMoment.indexWithinParagraph + 1}`;
  const attribTier = TIER_META[strongestMoment.tier].label;

  // Phase 5 §2.1 — 400ms fade-in AFTER slide completes. The PanelShell
  // delays mounting the overview until `visible === true`, which lines
  // up with the 430ms "slide complete" marker in the choreography.
  const fadeDuration = reducedMotion
    ? DURATION.reducedMotionCrossfade / 1000
    : 0.4;

  const shouldShowStart = Boolean(topTry && onStartHere);

  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: fadeDuration,
        ease: EASING.contentCrossfade,
      }}
      style={{
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        paddingTop: 8,
        paddingBottom: TYPOGRAPHY.panelPaddingBottom,
        maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
      }}
    >
      {/* ------------------------------------------------------------------
          Zone 1 — Supertitle + stats.
          Phase 5 §6 #1 — "YOUR ESSAY, ANALYZED" all-caps, sage, 12px.
          ------------------------------------------------------------------ */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.overviewSupertitle,
          fontWeight: TYPOGRAPHY.weight.semibold,
          letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
          textTransform: 'uppercase',
          color: tierAccent('FUNCTIONAL'),
        }}
      >
        Your essay, analyzed
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: TYPOGRAPHY.size.meta,
          color: 'hsl(220 10% 45%)',
          marginTop: 4,
          letterSpacing: TYPOGRAPHY.tracking.meta,
        }}
      >
        {overview.paragraphCount} paragraphs
        <span style={{ margin: '0 6px', opacity: 0.5 }}>{'\u00B7'}</span>
        {wordCount(profile.essayText)} words
      </div>

      {/* ------------------------------------------------------------------
          Zone 2 — "Your strongest moment" pull-quote.
          Phase 5 §6 #2 — singular "moment"; never "moments".
          Phase 5 §2.3 — 15–18px serif italic, hand-set here at 18px so
          the pull-quote clearly dominates (Zone 2 is the anchor).
          ------------------------------------------------------------------ */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.overviewLabel,
            fontWeight: TYPOGRAPHY.weight.medium,
            color: 'hsl(220 15% 30%)',
            marginBottom: 8,
            letterSpacing: TYPOGRAPHY.tracking.prose,
          }}
        >
          Your strongest moment
        </div>
        <blockquote
          style={{
            fontFamily: TYPOGRAPHY.families.serif,
            fontSize: '18px',
            fontStyle: 'italic',
            lineHeight: TYPOGRAPHY.lineHeight.serifProse,
            color: 'hsl(220 20% 18%)',
            margin: 0,
            padding: 0,
            // Phase 5 §2.3 — no quote-glyph decoration; the italic
            // carries the quotation semantics.
            borderLeft: `2px solid ${tierAccent(strongestMoment.tier)}`,
            paddingLeft: 14,
          }}
        >
          {'\u201C'}
          {strongestMoment.quote}
          {'\u201D'}
        </blockquote>
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.meta,
            color: 'hsl(220 10% 50%)',
            marginTop: 8,
            letterSpacing: TYPOGRAPHY.tracking.meta,
            fontStyle: 'italic',
            fontVariant: 'small-caps',
          }}
        >
          {attribParagraph}
          <span style={{ margin: '0 6px', opacity: 0.5 }}>{'\u00B7'}</span>
          {attribSentence}
          <span style={{ margin: '0 6px', opacity: 0.5 }}>{'\u00B7'}</span>
          <span
            style={{
              color: tierAccent(strongestMoment.tier),
              fontWeight: TYPOGRAPHY.weight.semibold,
              letterSpacing: TYPOGRAPHY.tracking.tierWord,
            }}
          >
            {attribTier}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Zone 3 — Improvement phase + most-important-next + narrative.
          Phase 5 §2.3 — phase is named, not scored.
          ------------------------------------------------------------------ */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.overviewLabel,
            fontWeight: TYPOGRAPHY.weight.medium,
            color: 'hsl(220 15% 30%)',
            marginBottom: 8,
            letterSpacing: TYPOGRAPHY.tracking.prose,
          }}
        >
          Your improvement phase
        </div>
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: '14px',
              fontWeight: TYPOGRAPHY.weight.semibold,
              letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
              color: 'hsl(220 20% 22%)',
            }}
          >
            {phaseCopy.label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.meta,
              color: 'hsl(220 10% 50%)',
              letterSpacing: TYPOGRAPHY.tracking.meta,
            }}
          >
            {phaseCopy.subtitle}
          </span>
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.serif,
            fontSize: '15px',
            lineHeight: TYPOGRAPHY.lineHeight.serifProse,
            color: 'hsl(220 20% 22%)',
            marginTop: 10,
          }}
        >
          {overview.mostImportantNext}
        </div>
        {/* Phase 5 §6 #8-13 — single-line header narrative. */}
        <div
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: TYPOGRAPHY.size.panelHeader,
            fontStyle: 'italic',
            color: 'hsl(220 15% 38%)',
            marginTop: 14,
            letterSpacing: TYPOGRAPHY.tracking.prose,
          }}
        >
          {overview.headerNarrative}
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Action row — primary "Start here →" + secondary list entry.
          Phase 5 §2.6 — "Start here" chip copy rules.
          Phase 11 §3 — "View all annotations" is the canonical overview
          → list entry.
          ------------------------------------------------------------------ */}
      <div
        className="flex items-center gap-3"
        style={{ marginTop: 32, flexWrap: 'wrap' }}
      >
        {shouldShowStart && topTry ? (
          <button
            type="button"
            onClick={() => onStartHere?.(topTry.sentenceId)}
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.panelHeader,
              fontWeight: TYPOGRAPHY.weight.medium,
              color: 'hsl(220 20% 22%)',
              background: 'hsl(220 15% 96%)',
              border: '1px solid hsl(220 15% 82%)',
              padding: '9px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              letterSpacing: TYPOGRAPHY.tracking.prose,
            }}
          >
            Start with the top thing to try{'\u00A0'}
            {'\u2192'}
          </button>
        ) : null}
        {onOpenList ? (
          <button
            type="button"
            onClick={onOpenList}
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: TYPOGRAPHY.size.panelHeader,
              fontWeight: TYPOGRAPHY.weight.medium,
              color: 'hsl(220 15% 40%)',
              background: 'transparent',
              border: 'none',
              padding: '9px 6px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              textDecorationColor: 'hsl(220 15% 70%)',
              letterSpacing: TYPOGRAPHY.tracking.prose,
            }}
          >
            View all annotations
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
