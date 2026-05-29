/**
 * Bloom barrel — Workstream D public surface.
 *
 * Consumers (the full editor shell in γ integration, and the
 * standalone `/annotation-v2-demo/bloom` page) import from here only.
 * Internals that are tightly coupled to `useBloomChoreography` stay
 * non-exported.
 *
 * Authority:
 *   - docs/ux_phases/phase_5_first_reveal.md §§2.1, 2.6, 3, 4
 *   - docs/ux_phases/phase_6_orientation.md §2.1 (inactivity pulse)
 */

export {
  BLOOM_TIMELINE,
  REDUCED_MOTION_TIMELINE,
} from './bloomTimings';
export type { BloomLandmark } from './bloomTimings';

export { useBloomChoreography } from './useBloomChoreography';
export type {
  BloomState,
  UseBloomChoreographyArgs,
  GutterFadePhase,
} from './useBloomChoreography';

export { useAutoSelectStrongest } from './useAutoSelectStrongest';
export type { AutoSelectResult } from './useAutoSelectStrongest';

export { HeaderNarrative } from './HeaderNarrative';
export type { HeaderNarrativeProps } from './HeaderNarrative';

export { StartHereChip } from './StartHereChip';
export type { StartHereChipProps } from './StartHereChip';
