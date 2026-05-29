/**
 * Click orchestration barrel — Workstream J (Phase 7).
 *
 * Public exports consumed by integration demos / Wave γ routes.
 * Internals (helper functions, private types) are not re-exported.
 */

export { ClickManager, useClickManager } from './ClickManager';
export type { ClickManagerProps, ClickManagerApi } from './ClickManager';

export { useRapidClick } from './useRapidClick';
export type {
  UseRapidClickOptions,
  UseRapidClickResult,
} from './useRapidClick';

export { useClickTimeline } from './useClickTimeline';
export type {
  ClickTimelinePhase,
  ClickTimelineState,
  UseClickTimelineArgs,
  UseClickTimelineResult,
} from './useClickTimeline';

export { useHoverTooltip } from './useHoverTooltip';
export type {
  UseHoverTooltipArgs,
  UseHoverTooltipResult,
} from './useHoverTooltip';

export { useDeselection } from './useDeselection';
export type { UseDeselectionArgs } from './useDeselection';

export { useParagraphClick } from './useParagraphClick';
export type {
  UseParagraphClickArgs,
  UseParagraphClickResult,
} from './useParagraphClick';

export { SentenceRing } from './SentenceRing';
export type { SentenceRingProps, SentenceRingPhase } from './SentenceRing';

export { HoverTooltip } from './HoverTooltip';
export type { HoverTooltipProps } from './HoverTooltip';
