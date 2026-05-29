/**
 * Annotation V2 — Barrel export.
 * Wave α Workstream A. Every token surface consumed by Wave β workstreams
 * (editor, panel, loading, bloom, nav, list, click, orientation) funnels
 * through this file for clean imports:
 *
 *   import { TIER_META, EASING, DURATION, GLASS } from '@/components/annotation-v2';
 *
 * Importers MUST also ensure `./workshop.css` is loaded at the route
 * boundary (e.g. in `AnnotationEditor.tsx`) so the `:root` tier CSS
 * variables and keyframes cascade into the editor tree.
 */

export type { Tier, UnderlineStyle, EasingName, DurationName, ZLayerName } from './tokens';

export {
  TIER_CSS_VAR,
  TIER_META,
  EASING,
  DURATION,
  TYPOGRAPHY,
  GLASS,
  Z_LAYER,
} from './tokens';
