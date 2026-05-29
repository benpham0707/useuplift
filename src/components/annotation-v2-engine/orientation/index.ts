/**
 * Orientation — Wave β / Workstream K.
 * Barrel for the Phase 6 First-Time Orientation layer.
 *
 * Authority: docs/ux_phases/phase_6_orientation.md (all 10 decisions).
 *
 * Public surface:
 *   - useOrientation — master orchestrator (12s chip clock + hint queue
 *     + keyboard footer one-shot + SR mirror).
 *   - useHintQueue — max-one-on-screen queue primitive.
 *   - useInactivityTimer — reusable single-fire inactivity clock.
 *   - useScreenReaderOrientation — parallel SR orientation path with
 *     500ms debounce.
 *   - AmbientHint — the anchored floating hint chip.
 *   - KeyboardShortcutFooter — persistent panel-footer shortcut row.
 *   - HINT_REGISTRY / HINT_ORDER — the canonical five-hint table.
 *   - readHintSeen / writeHintSeen / clearAllHintStorageForDemo —
 *     localStorage helpers with graceful fallback.
 */

export { useOrientation } from './useOrientation';
export type {
  UseOrientationOpts,
  UseOrientationResult,
} from './useOrientation';

export { useHintQueue } from './useHintQueue';
export type { UseHintQueueResult } from './useHintQueue';

export { useInactivityTimer } from './useInactivityTimer';
export type { UseInactivityTimerArgs } from './useInactivityTimer';

export { useScreenReaderOrientation } from './useScreenReaderOrientation';
export type {
  UseScreenReaderOrientationArgs,
  UseScreenReaderOrientationResult,
} from './useScreenReaderOrientation';

export { AmbientHint, AMBIENT_HINT_CONSTANTS } from './AmbientHint';
export type { AmbientHintProps } from './AmbientHint';

export {
  KeyboardShortcutFooter,
  KEYBOARD_SHORTCUT_FOOTER_TEXT,
} from './KeyboardShortcutFooter';
export type { KeyboardShortcutFooterProps } from './KeyboardShortcutFooter';

export {
  HINT_REGISTRY,
  HINT_ORDER,
  ALL_HINT_STORAGE_KEYS,
  KEYBOARD_FOOTER_STORAGE_KEY,
  readHintSeen,
  writeHintSeen,
  clearAllHintStorageForDemo,
} from './hintsRegistry';
export type {
  HintId,
  HintDef,
  HintAnchor,
  HintTrigger,
  ReducedMotionBehavior,
} from './hintsRegistry';
