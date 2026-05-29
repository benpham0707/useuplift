/**
 * Workstream I barrel — the public surface for the list/map view.
 *
 * Consumers import from `@/components/annotation-v2/list`. Internal
 * composition (ProseCallout, GroupHeader, SortToggle, etc.) is an
 * implementation detail of ListView and not re-exported here.
 */

export { ListView } from './ListView';
export type { ListViewProps } from './ListView';

export { ListRow } from './ListRow';
export type { ListRowProps } from './ListRow';

export { TierHistogram } from './TierHistogram';
export type { TierHistogramProps } from './TierHistogram';

export { FilterChips } from './FilterChips';
export type { FilterChipsProps, FilterChipCounts } from './FilterChips';

export { TierKeyPopover } from './TierKeyPopover';
export type { TierKeyPopoverProps } from './TierKeyPopover';

export { ProseCallout } from './ProseCallout';
export type { ProseCalloutProps } from './ProseCallout';

export { Minimap } from './Minimap';
export type { MinimapProps } from './Minimap';

export { ListToolbarToggle } from './ListToolbarToggle';
export type { ListToolbarToggleProps } from './ListToolbarToggle';

export { useListFilter } from './useListFilter';
export type {
  UseListFilterArgs,
  UseListFilterResult,
} from './useListFilter';

export { useTierCounts } from './useTierCounts';
export type { UseTierCountsOptions } from './useTierCounts';

export {
  buildRow,
  formatMeta,
  truncateCritique,
  groupByParagraph,
  groupByTier,
  groupByType,
  containsForbiddenStatistic,
} from './listFormatting';
export type { ListRowShape, ListGroupingKind } from './listFormatting';
