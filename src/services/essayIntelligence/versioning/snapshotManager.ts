/**
 * snapshotManager.ts — Snapshot CRUD + comparison caching.
 *
 * Pure data management — no LLM calls. Creates, lists, deletes snapshots
 * and manages comparison result caching.
 *
 * Design: Snapshot + Explore + Compare (MVP branching).
 * The student always works on their current version and can compare backward
 * to any snapshot. No branch switching, no merging.
 *
 * Resource limits (system bookkeeping, not analytical judgment):
 * - Maximum 5 snapshots
 * - Maximum 2 nesting levels
 */

import type {
  EssaySnapshot,
  SnapshotComparison,
  SnapshotSource,
  SnapshotUnderstanding,
} from '../profileTypes';

// ============================================================================
// SNAPSHOT MANAGER
// ============================================================================

/**
 * Compact snapshot summary for listing (no understanding payload).
 */
export interface SnapshotSummary {
  id: string;
  name: string;
  createdAt: string;
  source: SnapshotSource;
  paragraphCount: number;
  context: string;
  parentSnapshotId?: string;
}

export class SnapshotManager {
  private snapshots: EssaySnapshot[] = [];
  private cachedComparisons: Map<string, SnapshotComparison> = new Map();
  private nextId: number = 1;
  private readonly maxSnapshots: number = 5;
  private readonly maxNestingDepth: number = 2;

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  /**
   * Create a snapshot of the current essay state.
   *
   * @param name - Human-readable name (student-provided or auto-generated)
   * @param context - What prompted the snapshot (LLM or system description)
   * @param currentText - The essay text to freeze
   * @param understanding - Deep copy of understanding state to freeze
   * @param source - What triggered the snapshot
   * @param autoTrigger - Description of auto-trigger (if source is auto_*)
   * @param parentSnapshotId - Parent snapshot ID for nesting
   * @returns The created snapshot
   * @throws If max snapshots reached or max nesting depth exceeded
   */
  createSnapshot(
    name: string,
    context: string,
    currentText: string,
    understanding: SnapshotUnderstanding,
    source: SnapshotSource,
    autoTrigger?: string,
    parentSnapshotId?: string,
  ): EssaySnapshot {
    if (this.snapshots.length >= this.maxSnapshots) {
      throw new Error(
        `Maximum ${this.maxSnapshots} snapshots reached. ` +
        `Delete an existing snapshot before creating a new one.`
      );
    }

    // Nesting limit: max 2 levels
    if (parentSnapshotId) {
      const parent = this.getSnapshot(parentSnapshotId);
      if (!parent) {
        throw new Error(`Parent snapshot ${parentSnapshotId} not found.`);
      }
      if (parent.parentSnapshotId) {
        throw new Error(
          `Maximum snapshot nesting depth (${this.maxNestingDepth}) reached. ` +
          `Cannot nest beyond 2 levels.`
        );
      }
    }

    // Deep copy understanding to ensure immutability
    const frozenUnderstanding: SnapshotUnderstanding = JSON.parse(
      JSON.stringify(understanding)
    );

    const snapshot: EssaySnapshot = {
      id: `snap-${this.nextId++}`,
      name,
      createdAt: new Date().toISOString(),
      context,
      text: currentText,
      paragraphCount: currentText.split(/\n\n+/).filter(p => p.trim().length > 0).length,
      understanding: frozenUnderstanding,
      source,
      autoTrigger,
      parentSnapshotId,
    };

    this.snapshots.push(snapshot);

    // Invalidate cached comparisons — current state changed relative to snapshots
    this.cachedComparisons.clear();

    console.log(
      `[SnapshotManager] Created snapshot '${name}' (${snapshot.id}), ` +
      `source=${source}, paragraphs=${snapshot.paragraphCount}. ` +
      `Total snapshots: ${this.snapshots.length}/${this.maxSnapshots}`
    );

    return snapshot;
  }

  /**
   * Get a specific snapshot by ID.
   */
  getSnapshot(id: string): EssaySnapshot | undefined {
    return this.snapshots.find(s => s.id === id);
  }

  /**
   * List all snapshots as compact summaries (for UI / coaching context).
   * Ordered by creation time.
   */
  listSnapshots(): SnapshotSummary[] {
    return this.snapshots.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      source: s.source,
      paragraphCount: s.paragraphCount,
      context: s.context,
      parentSnapshotId: s.parentSnapshotId,
    }));
  }

  /**
   * Delete a snapshot by ID.
   * Children are orphaned (parent reference removed), not deleted.
   *
   * @throws If snapshot not found
   */
  deleteSnapshot(id: string): void {
    const index = this.snapshots.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Snapshot ${id} not found.`);
    }

    const snapshot = this.snapshots[index];

    // Orphan children (remove parent reference, don't delete them)
    for (const child of this.snapshots) {
      if (child.parentSnapshotId === id) {
        child.parentSnapshotId = undefined;
      }
    }

    this.snapshots.splice(index, 1);

    // Remove cached comparisons involving this snapshot
    for (const key of this.cachedComparisons.keys()) {
      if (key.includes(id)) {
        this.cachedComparisons.delete(key);
      }
    }

    console.log(
      `[SnapshotManager] Deleted snapshot '${snapshot.name}' (${id}). ` +
      `Remaining: ${this.snapshots.length}/${this.maxSnapshots}`
    );
  }

  /**
   * Get the number of snapshots currently stored.
   */
  get count(): number {
    return this.snapshots.length;
  }

  /**
   * Check if there is capacity for more snapshots.
   */
  get hasCapacity(): boolean {
    return this.snapshots.length < this.maxSnapshots;
  }

  // --------------------------------------------------------------------------
  // COMPARISON CACHING
  // --------------------------------------------------------------------------

  /**
   * Get a cached comparison, or null if not cached.
   * Cache key is snapshot ID + hash of current understanding state.
   */
  getCachedComparison(
    snapshotId: string,
    currentStateHash: string,
  ): SnapshotComparison | null {
    const key = `${snapshotId}:${currentStateHash}`;
    return this.cachedComparisons.get(key) ?? null;
  }

  /**
   * Store a comparison in cache.
   */
  cacheComparison(
    snapshotId: string,
    currentStateHash: string,
    comparison: SnapshotComparison,
  ): void {
    const key = `${snapshotId}:${currentStateHash}`;
    this.cachedComparisons.set(key, comparison);
  }

  /**
   * Invalidate all cached comparisons (call after current state changes).
   */
  invalidateCache(): void {
    if (this.cachedComparisons.size > 0) {
      console.log(
        `[SnapshotManager] Invalidated ${this.cachedComparisons.size} cached comparisons`
      );
      this.cachedComparisons.clear();
    }
  }

  // --------------------------------------------------------------------------
  // SERIALIZATION (for persistence / checkpointing)
  // --------------------------------------------------------------------------

  /**
   * Export manager state for persistence.
   * Cached comparisons are NOT persisted — they're invalidated on any state change.
   */
  serialize(): { snapshots: EssaySnapshot[]; nextId: number } {
    return {
      snapshots: JSON.parse(JSON.stringify(this.snapshots)),
      nextId: this.nextId,
    };
  }

  /**
   * Restore manager state from persisted data.
   */
  static deserialize(data: {
    snapshots: EssaySnapshot[];
    nextId: number;
  }): SnapshotManager {
    const manager = new SnapshotManager();
    manager.snapshots = data.snapshots;
    manager.nextId = data.nextId;
    return manager;
  }
}
