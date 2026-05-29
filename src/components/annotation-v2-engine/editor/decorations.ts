/**
 * Sentence-tier underline decorations (ProseMirror inline DecorationSet).
 *
 * Underline rendering strategy: CSS `background-image: linear-gradient` +
 * `background-size` draw-in (not SVG, not pseudo-element stroke-dashoffset).
 *
 * Justification for CSS background vs SVG stroke-dashoffset:
 *   - Each sentence is a plain inline decoration (a PM `Decoration.inline`)
 *     applied to a span. We can't trivially inject an `<svg>` child inside an
 *     inline PM decoration without splitting the range and breaking selection
 *     behavior.
 *   - CSS `background-image: linear-gradient()` + animated `background-size`
 *     width (0% → 100%) reads visually as "drawing in from the left" —
 *     equivalent to `stroke-dashoffset` for a straight horizontal line — with
 *     zero DOM overhead, no extra nodes per sentence, no z-stacking headaches
 *     against the text baseline, and it honors text selection as-is.
 *   - For CRITICAL tier's wavy variant, we use a repeating SVG wavy pattern
 *     baked into the `background-image` as a data URI (see `workshop.css` — A's
 *     scope). From here we only set the CSS class; the stylesheet owns the
 *     glyph.
 *   - For MASTERFUL tier's shimmer, a second class adds a keyframe-animated
 *     background overlay (`anno-underline-shimmer`). Same rationale: purely CSS.
 *
 * Bloom ordering: each decoration carries a CSS custom property
 * `--bloom-order: N` where N is the sentence's left-to-right index among
 * currently-visible sentences. CSS animation-delay reads this var to stagger
 * the draw-in per Phase 5 §3 (35ms stagger, 160ms bloom each).
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { EssayProfile, SentenceProfile, Tier } from './stubs';
import { buildSentenceRangeMap } from './sentenceMapping';

export type UnderlinePhase =
  | 'hidden'
  | 'strengthsWave'
  | 'criticalWave'
  | 'full';

const STRENGTH_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'STRONG',
  'EXCEPTIONAL',
  'MASTERFUL',
]);

const CRITICAL_TIERS: ReadonlySet<Tier> = new Set<Tier>([
  'CRITICAL',
  'NEEDS_WORK',
]);

/** Phase 5 §2.1 — FUNCTIONAL is never decorated (visual silence). */
function isTierVisibleAtPhase(tier: Tier, phase: UnderlinePhase): boolean {
  if (tier === 'FUNCTIONAL') return false;
  switch (phase) {
    case 'hidden':
      return false;
    case 'strengthsWave':
      return STRENGTH_TIERS.has(tier);
    case 'criticalWave':
      return STRENGTH_TIERS.has(tier) || CRITICAL_TIERS.has(tier);
    case 'full':
      return true;
  }
}

function tierClassNames(tier: Tier): string[] {
  const base = `anno-underline anno-underline-${tier.toLowerCase().replace('_', '-')}`;
  const classes = base.split(' ');
  if (tier === 'MASTERFUL') classes.push('anno-underline-shimmer');
  if (tier === 'CRITICAL') classes.push('anno-underline-wavy');
  return classes;
}

/**
 * Build the DecorationSet for sentence-tier underlines.
 *
 * @param doc      Current PM doc (decorations are bound to this doc's positions)
 * @param profile  EssayProfile — sentence ranges live on `profile.sentences`
 * @param phase    Bloom phase (Phase 5 §2.1 two-wave spec)
 * @param reducedMotion  When true, strip per-sentence stagger order so CSS
 *                       falls back to a single crossfade (Phase 5 §2.1 fallback)
 */
export function buildSentenceDecorations(
  doc: PmNode,
  profile: EssayProfile,
  phase: UnderlinePhase,
  reducedMotion: boolean,
): DecorationSet {
  if (phase === 'hidden') return DecorationSet.empty;

  const rangeMap = buildSentenceRangeMap(doc, profile);

  // Collect visible sentences, preserving document order for bloom-index stagger.
  const visible: Array<{ sentence: SentenceProfile; from: number; to: number }> = [];
  for (const sentence of profile.sentences) {
    if (!isTierVisibleAtPhase(sentence.tier, phase)) continue;
    const range = rangeMap.get(sentence.id);
    if (!range) continue;
    visible.push({ sentence, from: range.from, to: range.to });
  }
  // Sort by PM start position for deterministic L→R ordering (sentences array
  // order should already match, but this defends against reordering upstream).
  visible.sort((a, b) => a.from - b.from);

  const decorations: Decoration[] = visible.map(({ sentence, from, to }, index) => {
    const bloomOrder = reducedMotion ? 0 : index;
    const classes = tierClassNames(sentence.tier);
    return Decoration.inline(from, to, {
      class: classes.join(' '),
      // PM accepts style strings; we inject the bloom-order CSS variable here
      // because decorations can't carry arbitrary attrs beyond `class`/`style`/
      // `nodeName`. The stylesheet in workshop.css reads `var(--bloom-order)`
      // to stagger animation-delay.
      style: `--bloom-order: ${bloomOrder};`,
      'data-anno-sentence-id': sentence.id,
      'data-anno-tier': sentence.tier,
    });
  });

  return DecorationSet.create(doc, decorations);
}
