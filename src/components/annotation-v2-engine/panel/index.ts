/**
 * Panel barrel — Workstream E public surface.
 *
 * Consumers import from `@/components/annotation-v2/panel` only;
 * internal modules (PanelHeader, PanelTabs, OverviewCard) are
 * implementation details and should not be reached into directly.
 *
 * InsightCard / RewriteCard / CrossRefPill are Round-2 stubs owned by
 * Workstreams F and G. They are re-exported here so the path exists
 * and Round-2 agents can `Edit` the file in place without restructuring.
 */

export { PanelShell } from './PanelShell';
export type { PanelShellProps } from './PanelShell';

export { PanelHeader } from './PanelHeader';
export { PanelTabs } from './PanelTabs';
export { OverviewCard } from './OverviewCard';

export type { PanelMode, InsightTabId } from './PanelModes';
export { makeInsightMode, panelModeTransitionKey } from './PanelModes';

export { usePanelMode } from './usePanelMode';
export type {
  UsePanelModeOptions,
  UsePanelModeResult,
} from './usePanelMode';

// Round-2 — Workstream F (InsightCard / ProfileCard / CrossRefPill /
// SageEmptyState / Breadcrumb / InsightTypeBadge / useNavStack /
// useInsightDwell) and G (RewriteCard — currently a typed stub).
export { InsightCard } from './InsightCard';
export type { InsightCardProps } from './InsightCard';
export { ProfileCard } from './ProfileCard';
export type { ProfileCardProps } from './ProfileCard';
export { RewriteCard } from './RewriteCard';
export type { RewriteCardProps } from './RewriteCard';
export { CopyDelayToast } from './CopyDelayToast';
export type { CopyDelayToastProps } from './CopyDelayToast';
export { useClipboardCopy } from './useClipboardCopy';
export type {
  CopyStatus,
  UseClipboardCopyOpts,
  UseClipboardCopyResult,
} from './useClipboardCopy';
export * as rewriteCopy from './rewriteCopy';
export { CrossRefPill } from './CrossRefPill';
export type { CrossRefPillProps } from './CrossRefPill';
export { InsightTypeBadge } from './InsightTypeBadge';
export { SageEmptyState } from './SageEmptyState';
export type { SageEmptyStateProps } from './SageEmptyState';
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';
export { useNavStack } from './useNavStack';
export type { NavStackEntry, NavStackReason, UseNavStackResult } from './useNavStack';
export { useInsightDwell } from './useInsightDwell';
export type { UseInsightDwellArgs } from './useInsightDwell';
