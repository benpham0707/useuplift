/**
 * Phase 4 — Loading-state barrel.
 *
 * Workstream C surface. Consumers (Phase 4 demo page, and eventually the
 * full editor shell in γ integration) should import from here, not
 * reach into individual files. Keeping this barrel stable lets the
 * internals be refactored without churn.
 *
 * Usage:
 *   ```ts
 *   import {
 *     useLoadingState,
 *     VaporScan,
 *     LayerRibbon,
 *     CancelButton,
 *     LAYER_CAPTIONS,
 *     FAST_PATH_CAPTION,
 *   } from '@/components/annotation-v2/loading';
 *   ```
 */

export {
  LAYER_CAPTIONS,
  READY_CAPTION,
  CANCELLED_CAPTION,
  FAST_PATH_CAPTION,
  SLOW_PATH_CAPTIONS,
  SLOW_PATH_THRESHOLDS,
  RIBBON_LAYER_ORDER,
  classifySlowPathTier,
  resolveCaption,
} from './captions';
export type { SlowPathTier } from './captions';

export { VaporScan } from './VaporScan';
export type { VaporScanPhase } from './VaporScan';

export { LayerRibbon } from './LayerRibbon';

export { CancelButton } from './CancelButton';

export { useLoadingState } from './useLoadingState';
export type {
  UseLoadingStateOpts,
  UseLoadingState,
  LoadingStatus,
} from './useLoadingState';
