/**
 * Finding Lifecycle — Barrel Exports
 *
 * The finding lifecycle system manages how findings evolve from initial
 * hypothesis through confirmation to depth, relating to each other
 * naturally, surviving across growth cycles, and serving as the
 * primary dispatch signal for where to invest next.
 */

export { FindingStore, COACHING_VALUE_ORDER } from './findingStore';

export {
  buildFindingContext,
  buildCompactFindingContext,
  buildParagraphFindingContext,
  buildFindingReferenceContext,
  buildAnnotationFindingContext,
  deriveSentenceParticipation,
} from './findingContextBuilder';

export type { FindingContextOptions } from './findingContextBuilder';
