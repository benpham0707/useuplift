/**
 * ListRow — a single annotation row inside the paragraph-grouped list.
 *
 * Phase 11 §2.4 authority for composition:
 *   - Tier dot (10px, full tier color)
 *   - Meta breadcrumb (`¶{N}s{M}` + tier word, 12px stone-500)
 *   - Truncated critique first line (14px stone-900, ~60ch + soft fade)
 *   - Viewed-state indicator (6px inset dot — filled for viewed,
 *     outline for unviewed). NEVER a checkmark per Phase 10 §6.
 *   - Optional rewrite glyph when the annotation carries a suggestion
 *     (subtle, muted — §2.4 "rewrite-icon appears right of critique").
 *
 * Behavior:
 *   - Click (or Enter/Space) fires `onClick(sentenceId)`.
 *   - Hover fires `onHover(sentenceId)`; null on mouseleave.
 *   - Row is focusable (tabindex 0); `role="button"`.
 *   - Reduced-motion strips the 120ms bg transition.
 */

import { type KeyboardEvent } from 'react';
import { PencilLine } from 'lucide-react';

import {
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type { AnnotationType } from '../types/profile';
import { formatMeta, truncateCritique } from './listFormatting';

export interface ListRowProps {
  readonly sentenceId: string;
  readonly paragraphIndex: number;
  readonly indexWithinParagraph: number;
  readonly tier: Tier;
  readonly annotationType: AnnotationType;
  readonly critique: string;
  readonly viewed: boolean;
  readonly hasRewrite: boolean;
  readonly onClick: (sentenceId: string) => void;
  readonly onHover?: (sentenceId: string | null) => void;
  readonly reducedMotion: boolean;
}

export function ListRow({
  sentenceId,
  paragraphIndex,
  indexWithinParagraph,
  tier,
  annotationType,
  critique,
  viewed,
  hasRewrite,
  onClick,
  onHover,
  reducedMotion,
}: ListRowProps) {
  const meta = formatMeta(paragraphIndex, indexWithinParagraph);
  const clipped = truncateCritique(critique, 60);
  const tierColor = `hsl(var(${TIER_CSS_VAR[tier]}))`;
  const tierLabel = TIER_META[tier].label;

  const handleKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(sentenceId);
    }
  };

  // A11y label — includes everything a sighted user gets at a glance.
  const ariaLabel = `Paragraph ${paragraphIndex + 1}, sentence ${
    indexWithinParagraph + 1
  }, ${tierLabel}. ${clipped}${clipped.length < critique.length ? '…' : ''}. ${
    viewed ? 'Reviewed.' : 'Unreviewed.'
  }${hasRewrite ? ' Rewrite suggested.' : ''}`;

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => onClick(sentenceId)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover?.(sentenceId)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(sentenceId)}
      onBlur={() => onHover?.(null)}
      data-sentence-id={sentenceId}
      data-annotation-type={annotationType}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto',
        alignItems: 'center',
        columnGap: 12,
        minHeight: 52,
        padding: '8px 24px',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: 4,
        transition: reducedMotion
          ? undefined
          : 'background-color 120ms linear',
        fontFamily: TYPOGRAPHY.families.sans,
        outline: 'none',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'hsla(220, 10%, 50%, 0.06)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Tier dot */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 5,
          background: tierColor,
          flexShrink: 0,
        }}
      />
      {/* Meta breadcrumb */}
      <span
        style={{
          fontSize: TYPOGRAPHY.size.meta,
          fontWeight: TYPOGRAPHY.weight.medium,
          color: 'hsl(220 10% 45%)',
          letterSpacing: TYPOGRAPHY.tracking.meta,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {meta}
        <span
          style={{
            margin: '0 6px',
            color: 'hsl(220 10% 65%)',
          }}
          aria-hidden="true"
        >
          ·
        </span>
        <span
          style={{
            color: tierColor,
            fontWeight: 600,
            letterSpacing: TYPOGRAPHY.tracking.tierWord,
          }}
        >
          {tierLabel}
        </span>
      </span>
      {/* Critique first line with soft fade */}
      <span
        style={{
          position: 'relative',
          fontSize: '13px',
          lineHeight: 1.4,
          color: 'hsl(220 15% 20%)',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          // Phase 11 §2.4 — soft fade, not ellipsis. The browser's
          // built-in text-overflow would read as a hard ellipsis, so we
          // roll our own mask.
          maskImage:
            clipped.length < critique.length
              ? 'linear-gradient(to right, black calc(100% - 40px), transparent 100%)'
              : undefined,
          WebkitMaskImage:
            clipped.length < critique.length
              ? 'linear-gradient(to right, black calc(100% - 40px), transparent 100%)'
              : undefined,
        }}
      >
        {clipped}
      </span>
      {/* Rewrite glyph (optional) */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          color: hasRewrite ? 'hsl(220 15% 55%)' : 'transparent',
        }}
      >
        {hasRewrite ? <PencilLine size={14} /> : null}
      </span>
      {/* Viewed-state inset dot */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 4,
          flexShrink: 0,
          background: viewed ? 'hsl(220 10% 70%)' : 'transparent',
          border: viewed
            ? '1px solid hsl(220 10% 70%)'
            : '1px solid hsl(220 15% 82%)',
        }}
      />
    </li>
  );
}
