/**
 * Minimap — 7px vertical stripe at the editor column's right edge.
 *
 * Phase 11 §2.6 + §3.4 authority:
 *   - 6–8px wide (we pick 7px, centered within the range).
 *   - One colored block per sentence that has an annotation.
 *   - Block position is proportional to the essay's scroll length —
 *     topPercent derived from the cumulative character count up to
 *     that sentence (see algorithm below).
 *   - Block height: a fixed minimum (4px) plus a per-sentence
 *     proportional term. We cap the proportional term so an unusually
 *     long sentence doesn't eat the stripe.
 *   - Colored with `hsl(var(TIER_CSS_VAR[tier]))` at 0.7 opacity.
 *   - Hover: 1.6x horizontal scale + tooltip shows meta (`¶{N}s{M}`)
 *     and the first ~30 chars of the sentence.
 *   - Click fires onClick(sentenceId) — consumer handles scroll + insight.
 *   - NO legend, NO label, NO axis per §2.6.
 *
 * Block height algorithm (documented for the parent workstream):
 *   Let totalChars = sum over all annotated sentences of
 *     (sentence.endOffset - sentence.startOffset).
 *   For each annotated sentence:
 *     height% = clamp(proportionalHeight, MIN_HEIGHT_PX, MAX_HEIGHT_PX)
 *     where proportionalHeight = (sentenceChars / totalChars) * 100%
 *
 *   We use character count (not sentence count) because the stripe's
 *   silhouette promises to mirror the essay's scroll length — a
 *   three-sentence paragraph with long sentences should render taller
 *   than a three-sentence paragraph with short ones.
 */

import { useMemo, useState } from 'react';

import {
  GLASS,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  Z_LAYER,
  type Tier,
} from '../tokens';
import type { EssayProfile } from '../types/profile';
import { formatMeta } from './listFormatting';

export interface MinimapProps {
  readonly profile: EssayProfile;
  readonly onSentenceClick: (sentenceId: string) => void;
  readonly hoveredSentenceId?: string | null;
  /**
   * Which annotated sentences to include. If null, every sentence
   * with ≥1 annotation renders. If provided, only these IDs render —
   * consumers use this to sync filter state with the minimap.
   */
  readonly visibleSentenceIds?: ReadonlySet<string> | null;
}

interface MinimapBlock {
  readonly sentenceId: string;
  readonly tier: Tier;
  readonly topPercent: number;
  readonly heightPercent: number;
  readonly meta: string;
  readonly preview: string;
}

// Block-sizing constants (tuned for typical Common App 650-word essays).
const MIN_BLOCK_HEIGHT_PCT = 1.2;
const MAX_BLOCK_HEIGHT_PCT = 8.0;

export function Minimap({
  profile,
  onSentenceClick,
  hoveredSentenceId,
  visibleSentenceIds,
}: MinimapProps) {
  const blocks = useMemo<readonly MinimapBlock[]>(() => {
    // Character totals per paragraph, and cumulative character count
    // up to (but not including) each paragraph — used to map a
    // sentence's intra-paragraph offset to its essay-wide position.
    const paragraphChars = profile.paragraphs.map((p) => p.text.length);
    const cumulativeBefore: number[] = [];
    {
      let acc = 0;
      for (const n of paragraphChars) {
        cumulativeBefore.push(acc);
        // +2 per paragraph approximates the blank line joiner that
        // assembles ESSAY_TEXT; we're OK with a small offset since
        // what matters is the relative silhouette.
        acc += n + 2;
      }
    }
    const totalEssayChars = cumulativeBefore.reduce(
      (acc, before, i) => acc + paragraphChars[i]!,
      0,
    );
    if (totalEssayChars <= 0) return [];

    // Annotated-sentence set.
    const annotatedIds = new Set<string>();
    for (const a of profile.annotations) annotatedIds.add(a.sentenceId);

    const totalAnnotatedChars = profile.sentences.reduce((acc, s) => {
      if (!annotatedIds.has(s.id)) return acc;
      return acc + (s.endOffset - s.startOffset);
    }, 0);

    const results: MinimapBlock[] = [];
    for (const sentence of profile.sentences) {
      if (!annotatedIds.has(sentence.id)) continue;
      if (visibleSentenceIds && !visibleSentenceIds.has(sentence.id)) continue;

      const paragraphBefore = cumulativeBefore[sentence.paragraphIndex] ?? 0;
      const essayCharPosition = paragraphBefore + sentence.startOffset;
      const topPercent = (essayCharPosition / totalEssayChars) * 100;

      const sentenceChars = sentence.endOffset - sentence.startOffset;
      const rawHeightPct =
        totalAnnotatedChars > 0
          ? (sentenceChars / totalAnnotatedChars) * 100
          : MIN_BLOCK_HEIGHT_PCT;
      const clampedHeightPct = Math.min(
        MAX_BLOCK_HEIGHT_PCT,
        Math.max(MIN_BLOCK_HEIGHT_PCT, rawHeightPct),
      );

      results.push({
        sentenceId: sentence.id,
        tier: sentence.tier,
        topPercent,
        heightPercent: clampedHeightPct,
        meta: `${formatMeta(
          sentence.paragraphIndex,
          sentence.indexWithinParagraph,
        )} · ${TIER_META[sentence.tier].label}`,
        preview: sentence.text.slice(0, 40) + (sentence.text.length > 40 ? '…' : ''),
      });
    }
    return results;
  }, [profile, visibleSentenceIds]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 7,
        height: '100%',
        zIndex: Z_LAYER.editor + 1,
        pointerEvents: 'auto',
      }}
    >
      {blocks.map((block) => (
        <MinimapBlockButton
          key={block.sentenceId}
          block={block}
          hovered={hoveredSentenceId === block.sentenceId}
          onClick={() => onSentenceClick(block.sentenceId)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual block — colored tick with a tooltip on hover.
// ---------------------------------------------------------------------------

interface MinimapBlockProps {
  readonly block: MinimapBlock;
  readonly hovered: boolean;
  readonly onClick: () => void;
}

function MinimapBlockButton({ block, hovered, onClick }: MinimapBlockProps) {
  const [localHover, setLocalHover] = useState<boolean>(false);
  const showTooltip = hovered || localHover;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${block.topPercent}%`,
        height: `max(4px, ${block.heightPercent}%)`,
      }}
    >
      <button
        type="button"
        aria-label={`${block.meta}. ${block.preview}`}
        onClick={onClick}
        onMouseEnter={() => setLocalHover(true)}
        onMouseLeave={() => setLocalHover(false)}
        onFocus={() => setLocalHover(true)}
        onBlur={() => setLocalHover(false)}
        style={{
          position: 'absolute',
          inset: 0,
          padding: 0,
          border: 'none',
          background: `hsl(var(${TIER_CSS_VAR[block.tier]}) / ${
            showTooltip ? 0.95 : 0.7
          })`,
          borderRadius: 1,
          cursor: 'pointer',
          transition:
            'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: showTooltip ? 'scaleX(1.6)' : 'scaleX(1)',
          transformOrigin: 'right center',
        }}
      />
      {showTooltip ? (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            right: 18,
            top: 0,
            whiteSpace: 'nowrap',
            padding: '4px 8px',
            background: GLASS.tooltip.background,
            border: `1px solid ${GLASS.tooltip.border}`,
            backdropFilter: GLASS.tooltip.backdropFilter,
            WebkitBackdropFilter: GLASS.tooltip.backdropFilter,
            borderRadius: 4,
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: '11px',
            color: 'hsl(220 15% 25%)',
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.12)',
            zIndex: Z_LAYER.tooltip,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              letterSpacing: TYPOGRAPHY.tracking.meta,
              marginBottom: 2,
            }}
          >
            {block.meta}
          </div>
          <div style={{ color: 'hsl(220 10% 40%)' }}>{block.preview}</div>
        </div>
      ) : null}
    </div>
  );
}
