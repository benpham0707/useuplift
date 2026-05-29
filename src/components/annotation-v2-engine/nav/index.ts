/**
 * Annotation V2 — Navigation (Workstream H).
 *
 * Barrel for the Phase 10 navigation surface:
 *   - useSmartOrder        — ordering algorithm (§3, §7)
 *   - useNavigation        — top-level controller (next / prev / jump)
 *   - useViewedState       — per-session viewed ledger (§2.6, §6.2)
 *   - useNewnessBadge      — new/updated detection (§2.10)
 *   - useKeyboardShortcuts — Tab / arrows / ESC / L / 1-3 (§3.1)
 *   - ProgressBar          — 3px tier-gradient strip (§2.3)
 *   - NavButtons           — [← Prev] [N of M] [Next →] row
 *   - EndOfReview          — warm summary panel (§2.8)
 */

export { useSmartOrder } from './useSmartOrder';
export type {
  SmartOrderMode,
  SmartOrderOpts,
  UseSmartOrderResult,
  SentenceFilter,
} from './useSmartOrder';

export { useNavigation } from './useNavigation';
export type {
  UseNavigationOpts,
  UseNavigationResult,
  JumpReason,
} from './useNavigation';

export { useViewedState } from './useViewedState';
export type {
  UseViewedStateOpts,
  UseViewedStateResult,
} from './useViewedState';

export { useNewnessBadge } from './useNewnessBadge';
export type {
  UseNewnessBadgeOpts,
  UseNewnessBadgeResult,
} from './useNewnessBadge';

export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export type { UseKeyboardShortcutsOpts } from './useKeyboardShortcuts';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { NavButtons } from './NavButtons';
export type { NavButtonsProps } from './NavButtons';

export { EndOfReview } from './EndOfReview';
export type { EndOfReviewProps } from './EndOfReview';
