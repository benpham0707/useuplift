/**
 * HoverTooltip — floating tier + headline preview tooltip (Workstream J).
 *
 * Phase 7 §2.5 — tooltip contract
 * -------------------------------
 * Appears 300ms (DURATION.hoverTooltipDelay) after the student has hovered
 * a sentence with the cursor still on it. Shows:
 *   `¶{N}s{M} · {TIER} · {headline}`
 *
 * Visual:
 *   - Glass tooltip (GLASS.tooltip token), ~12px meta font, tier-colored
 *     left border so the student can visually associate it with the
 *     sentence's underline tier.
 *   - Positioned just above the sentence (we receive the anchor `position`
 *     from the ClickManager which computes it via editor.view.coordsAtPos).
 *   - Fade-in 120ms / fade-out 80ms, per §2.5.
 *   - `role="tooltip"` + `aria-hidden` management; the visible id is
 *     announced by the editor's live region, not by the tooltip itself.
 *
 * Reduced motion: no slide, no fade — opacity only, ramped over
 * DURATION.reducedMotionCrossfade (140ms).
 */

import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
  DURATION,
  GLASS,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  Z_LAYER,
  type Tier,
} from '../tokens';
import type { EssayProfile } from '../types/profile';

export interface HoverTooltipProps {
  readonly visible: boolean;
  readonly sentenceId: string | null;
  readonly profile: EssayProfile;
  /** Anchor point in viewport-relative pixels (top edge of sentence). */
  readonly position: { readonly x: number; readonly y: number } | null;
  readonly reducedMotion: boolean;
}

/**
 * Find a suitable headline preview for the tooltip. Phase 7 §4.3 lays out
 * the copy deck:
 *   - FUNCTIONAL: static "working as intended"
 *   - Others: first annotation's critique leading-clause (≤32 chars).
 * Until L5's `headline` surface lands on Annotation, we degrade to a
 * short critique prefix as the preview. This keeps the tooltip honest
 * without forcing a schema change.
 */
function computeHeadline(
  profile: EssayProfile,
  sentenceId: string,
  tier: Tier,
): string {
  if (tier === 'FUNCTIONAL') return 'working as intended';
  const sentence = profile.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return '';
  if (sentence.annotationIds.length === 0) return '';
  const primary = profile.annotations.find(
    (a) => a.id === sentence.annotationIds[0],
  );
  if (!primary) return '';
  // Take the first clause of the critique — up to the first period, comma,
  // or em dash — and cap at 32 characters.
  const raw = primary.critique.trim();
  const clauseEnd = raw.search(/[.,—:]/);
  const clause = (clauseEnd > 0 ? raw.slice(0, clauseEnd) : raw).trim();
  if (clause.length <= 32) return clause.toLowerCase();
  return clause.slice(0, 29).toLowerCase() + '...';
}

export function HoverTooltip(props: HoverTooltipProps) {
  const { visible, sentenceId, profile, position, reducedMotion } = props;

  const sentence = sentenceId
    ? profile.sentences.find((s) => s.id === sentenceId)
    : undefined;
  const tier: Tier | null = sentence?.tier ?? null;
  const headline = sentence && tier ? computeHeadline(profile, sentence.id, tier) : '';
  const metaLine = sentence
    ? `¶${sentence.paragraphIndex + 1}s${sentence.indexWithinParagraph + 1}`
    : '';

  const tierLabel = tier ? TIER_META[tier].label : '';
  const tierVar = tier ? TIER_CSS_VAR[tier] : null;

  const containerStyle: CSSProperties | null = position
    ? {
        position: 'fixed',
        // Anchor the tooltip above the sentence top edge with an 8px
        // breathing gap. The component uses translate(-50%, -100%) via
        // CSS below so horizontal centering is on the anchor x.
        top: position.y - 8,
        left: position.x,
        transform: 'translate(-50%, -100%)',
        zIndex: Z_LAYER.tooltip,
        pointerEvents: 'none',
      }
    : null;

  const bubbleStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: TYPOGRAPHY.size.meta,
    fontFamily: TYPOGRAPHY.families.sans,
    fontWeight: TYPOGRAPHY.weight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.sans,
    letterSpacing: TYPOGRAPHY.tracking.meta,
    color: 'rgba(30, 34, 42, 0.9)',
    background: GLASS.tooltip.background,
    border: `1px solid ${GLASS.tooltip.border}`,
    backdropFilter: GLASS.tooltip.backdropFilter,
    WebkitBackdropFilter: GLASS.tooltip.backdropFilter,
    // Phase 7 §2.3 — tier-colored left border as the handrail from
    // sentence to tooltip.
    borderLeft: tierVar
      ? `3px solid hsl(var(${tierVar}) / 0.85)`
      : `1px solid ${GLASS.tooltip.border}`,
    boxShadow: '0 4px 12px -4px rgba(30, 34, 42, 0.18)',
    whiteSpace: 'nowrap',
  };

  const transitionIn = {
    duration:
      (reducedMotion ? DURATION.reducedMotionCrossfade : 120) / 1000,
    ease: 'easeOut' as const,
  };
  const transitionOut = {
    duration: (reducedMotion ? DURATION.reducedMotionCrossfade : 80) / 1000,
    ease: 'easeIn' as const,
  };

  return (
    <AnimatePresence>
      {visible && containerStyle && sentence && tier && (
        <motion.div
          key={sentence.id}
          role="tooltip"
          aria-live="off"
          style={containerStyle}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={transitionIn}
          {...({ exitTransition: transitionOut } as Record<string, unknown>)}
        >
          <span style={bubbleStyle}>
            <span style={{ opacity: 0.6 }}>{metaLine}</span>
            <span
              style={{
                fontVariant: 'small-caps',
                fontStyle: 'italic',
                letterSpacing: TYPOGRAPHY.tracking.tierWord,
                color: tierVar ? `hsl(var(${tierVar}) / 0.95)` : undefined,
              }}
            >
              {tierLabel}
            </span>
            {headline && (
              <>
                <span style={{ opacity: 0.45 }}>·</span>
                <span>{headline}</span>
              </>
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
