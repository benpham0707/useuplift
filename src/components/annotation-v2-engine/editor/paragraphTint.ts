/**
 * Paragraph-level background tint decorations.
 *
 * Phase 4 §2.4 / Phase 5 §2.1 — paragraphs are tinted with their aggregated
 * tier color at:
 *   - saturation 0   → hidden (editor before L3.5 completes)
 *   - saturation 40% → muted (Phase 4 first reveal)
 *   - saturation 55% → deepened (Phase 5 cross-lap)
 *
 * Implementation: one PM `Decoration.node` per paragraph node with an inline
 * style `background: color-mix(...)`. The CSS var `--anno-{tier}` is resolved
 * by Workstream A's `workshop.css`. We produce the `color-mix` string directly
 * so saturation transitions can be driven by a parent CSS transition on the
 * element (we set a CSS custom property `--anno-tint-saturation` and use it
 * inside `color-mix` — that lets motion/react or a CSS transition smoothly
 * interpolate the saturation value across the 600ms deepening window).
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { EssayProfile, Tier } from './stubs';

export type ParagraphTintSaturation = 0 | 40 | 55;

const TIER_CSS_VAR: Record<Tier, string> = {
  CRITICAL: '--anno-critical',
  NEEDS_WORK: '--anno-needs-work',
  FUNCTIONAL: '--anno-functional',
  STRONG: '--anno-strong',
  EXCEPTIONAL: '--anno-exceptional',
  MASTERFUL: '--anno-masterful',
};

/**
 * Build paragraph-tint DecorationSet.
 *
 * Saturation 0 → no decorations (fully transparent, avoids paint cost).
 */
export function buildParagraphTintDecorations(
  doc: PmNode,
  profile: EssayProfile,
  saturation: ParagraphTintSaturation,
): DecorationSet {
  if (saturation === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  let paragraphIndex = 0;

  doc.forEach((node, offset) => {
    if (node.type.name !== 'paragraph') return;
    const paragraph = profile.paragraphs[paragraphIndex];
    paragraphIndex += 1;
    if (!paragraph) return;

    // FUNCTIONAL paragraphs get a much softer tint (sage = visual silence per §2.4).
    // We still apply a background so the paragraph-bloom choreography has
    // something to animate, but at half the headline saturation.
    const effectiveSat =
      paragraph.paragraphTintTier === 'FUNCTIONAL' ? Math.max(0, saturation / 2) : saturation;

    const tierVar = TIER_CSS_VAR[paragraph.paragraphTintTier];
    const style = [
      `--anno-tint-saturation: ${effectiveSat}%`,
      `background: color-mix(in hsl, hsl(var(${tierVar})) ${effectiveSat}%, transparent)`,
      // Carry the transition timing hint on the element so saturation changes
      // smoothly during the Phase 4→5 deepening (Phase 5 §4, 600ms ease-out).
      `transition: background 600ms cubic-bezier(0.25, 1, 0.5, 1)`,
    ].join('; ');

    decorations.push(
      Decoration.node(offset, offset + node.nodeSize, {
        class: `anno-paragraph-tint anno-paragraph-tint-${paragraph.paragraphTintTier.toLowerCase().replace('_', '-')}`,
        style,
        'data-anno-paragraph-index': String(paragraph.index),
        'data-anno-tint-tier': paragraph.paragraphTintTier,
      }),
    );
  });

  return DecorationSet.create(doc, decorations);
}
