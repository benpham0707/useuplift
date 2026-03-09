/**
 * Checkpoint Store — pluggable persistence interface for profile checkpointing.
 *
 * The coordinator calls CheckpointStore.save() at pipeline boundaries.
 * The implementation is injected by the orchestrator — the coordinator never
 * imports database modules or knows how persistence works.
 *
 * Includes an InMemoryCheckpointStore for tests and development.
 *
 * Spec: docs/plan-sections/04-profile-manager.md Section 8 (Checkpoint Types)
 */

import type {
  EssayProfile,
  CheckpointStore,
  CheckpointMetadata,
} from '../profileTypes';

// ============================================================================
// IN-MEMORY IMPLEMENTATION (for tests)
// ============================================================================

/**
 * InMemoryCheckpointStore — stores checkpoints in a Map keyed by essayId.
 *
 * Each save overwrites the previous checkpoint for that essay.
 * Used in tests and development where no durable storage is needed.
 */
export class InMemoryCheckpointStore implements CheckpointStore {
  private store: Map<string, { profile: EssayProfile; metadata: CheckpointMetadata }> = new Map();

  async save(profile: EssayProfile, metadata: CheckpointMetadata): Promise<void> {
    // Deep clone to prevent mutations to the stored copy from affecting the live profile
    const clonedProfile = structuredClone(profile);
    const clonedMetadata = structuredClone(metadata);
    this.store.set(metadata.essayId, { profile: clonedProfile, metadata: clonedMetadata });
  }

  async load(essayId: string): Promise<EssayProfile | null> {
    const entry = this.store.get(essayId);
    if (!entry) return null;
    // Deep clone to prevent mutations to the returned copy from affecting the store
    return structuredClone(entry.profile);
  }

  /**
   * Get the last checkpoint metadata for an essay. Test utility.
   */
  getMetadata(essayId: string): CheckpointMetadata | null {
    const entry = this.store.get(essayId);
    return entry ? structuredClone(entry.metadata) : null;
  }

  /**
   * Check if a checkpoint exists for an essay. Test utility.
   */
  has(essayId: string): boolean {
    return this.store.has(essayId);
  }

  /**
   * Clear all stored checkpoints. Test utility.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get the number of stored checkpoints. Test utility.
   */
  get size(): number {
    return this.store.size;
  }
}

// ============================================================================
// NO-OP IMPLEMENTATION (for fire-and-forget scenarios)
// ============================================================================

/**
 * NoOpCheckpointStore — does nothing. Used when checkpointing is not needed,
 * e.g., during one-off analysis runs or benchmarks.
 */
export class NoOpCheckpointStore implements CheckpointStore {
  async save(_profile: EssayProfile, _metadata: CheckpointMetadata): Promise<void> {
    // Intentionally empty
  }

  async load(_essayId: string): Promise<EssayProfile | null> {
    return null;
  }
}
