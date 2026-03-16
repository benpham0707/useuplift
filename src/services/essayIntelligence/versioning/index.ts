/**
 * Version Branching Module — Barrel Exports
 *
 * Improvement #10: Snapshot + Explore + Compare (MVP branching).
 *
 * The student always works on their current version and can compare backward
 * to any snapshot. No branch switching, no merging.
 */

// Snapshot CRUD + caching
export { SnapshotManager } from './snapshotManager';
export type { SnapshotSummary } from './snapshotManager';

// LLM comparison orchestration
export { compareToSnapshot, hashCurrentState } from './snapshotComparator';
export type { CurrentEssayState } from './snapshotComparator';

// Auto-snapshot trigger detection
export {
  shouldAutoSnapshotForEdit,
  shouldAutoSnapshotForMilestone,
} from './snapshotTrigger';
export type {
  EditEvent,
  AutoSnapshotDecision,
  MilestoneEvent,
} from './snapshotTrigger';
