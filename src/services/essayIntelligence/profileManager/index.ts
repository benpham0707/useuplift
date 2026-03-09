/**
 * Profile Manager — re-exports.
 *
 * Clean entry point for consumers of the Profile Manager module.
 * Exports the coordinator, factory function, staleness tracker,
 * dependency map, checkpoint stores, and all mutator interfaces.
 */

// ── Coordinator & Factory ──
export {
  EssayProfileCoordinator,
  createInitialProfile,
} from './essayProfileManager';

// ── Mutator Interfaces (contracts for Agents 3 & 4) ──
export type {
  ISentenceMutator,
  IParagraphMutator,
  IHolisticMutator,
  IConnectionMutator,
  IVoiceMapMutator,
  IEarnednessMutator,
  INorthStarMutator,
  IInsightMutator,
} from './essayProfileManager';

// ── Staleness Tracking ──
export {
  StalenessTrackerImpl,
  STALENESS_DEPENDENCY_MAP,
  propagateStaleness,
  targetKey,
} from './dependencyMap';

export type { PropagationContext } from './dependencyMap';

// ── Checkpoint Stores ──
export {
  InMemoryCheckpointStore,
  NoOpCheckpointStore,
} from './checkpointStore';
