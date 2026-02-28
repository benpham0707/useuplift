/**
 * Dimension Registry — Self-registering dimension manifest system
 *
 * Dimensions register themselves by calling dimensionRegistry.register()
 * at module scope. The registry auto-discovers all *.dim.ts files
 * in the dimensions/ directory at startup.
 *
 * CRITICAL: After all dimensions are registered, validateWeights() MUST
 * be called to assert weights sum to 1.00 ± 0.001. This is enforced
 * at startup to prevent score corruption.
 *
 * Usage:
 *   // In a dimension file (e.g., narrative-craft.dim.ts):
 *   import { dimensionRegistry } from '../registry/dimensionRegistry';
 *   dimensionRegistry.register({ id: 'narrative_craft_storytelling', weight: 0.08, ... });
 *
 *   // To query:
 *   const dim = dimensionRegistry.getDimension('narrative_craft_storytelling');
 *   const all = dimensionRegistry.getAll();
 */

import { DimensionManifest } from '../shared/types';

class DimensionRegistry {
  private dimensions = new Map<string, DimensionManifest>();
  private initialized = false;

  /**
   * Register a dimension manifest. Throws on duplicate ID.
   */
  register(manifest: DimensionManifest): void {
    if (this.dimensions.has(manifest.id)) {
      throw new Error(
        `[DimensionRegistry] Duplicate dimension ID: '${manifest.id}'. Each dimension must have a unique ID.`
      );
    }
    this.dimensions.set(manifest.id, manifest);
  }

  /**
   * Get a dimension by ID.
   */
  getDimension(id: string): DimensionManifest | undefined {
    return this.dimensions.get(id);
  }

  /**
   * Get all registered dimensions.
   */
  getAll(): DimensionManifest[] {
    return Array.from(this.dimensions.values());
  }

  /**
   * Get dimensions filtered by scoring tier.
   */
  getByTier(tier: DimensionManifest['scoringTier']): DimensionManifest[] {
    return Array.from(this.dimensions.values()).filter(d => d.scoringTier === tier);
  }

  /**
   * Validate that all registered dimension weights sum to 1.00 ± 0.001.
   * Throws AssertionError if validation fails.
   *
   * MUST be called after all dimensions are registered (e.g., after autoImport).
   */
  validateWeights(): void {
    const dims = this.getAll();
    if (dims.length === 0) return; // No dimensions registered yet

    const totalWeight = dims.reduce((sum, d) => sum + d.weight, 0);

    if (Math.abs(totalWeight - 1.0) > 0.001) {
      const breakdown = dims
        .map(d => `  ${d.id}: ${d.weight}`)
        .join('\n');

      throw new Error(
        `[DimensionRegistry] Weight validation failed: weights sum to ${totalWeight.toFixed(4)}, expected 1.0000 ± 0.001.\n` +
        `Registered dimensions:\n${breakdown}`
      );
    }
  }

  /**
   * Get the total weight of all registered dimensions.
   */
  getTotalWeight(): number {
    return this.getAll().reduce((sum, d) => sum + d.weight, 0);
  }

  /**
   * Get count of registered dimensions.
   */
  get size(): number {
    return this.dimensions.size;
  }

  /**
   * Auto-import all dimension files from the dimensions/ directory.
   * Called once at startup. Safe to call multiple times (idempotent).
   * After import, validates weights sum to 1.00.
   */
  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const dimensionsDir = path.join(__dirname, '..', 'dimensions');

      if (!fs.existsSync(dimensionsDir)) return;

      const files = fs.readdirSync(dimensionsDir).filter(f => f.endsWith('.dim.ts') || f.endsWith('.dim.js'));

      for (const file of files) {
        try {
          await import(path.join(dimensionsDir, file));
        } catch (err) {
          console.error(`[DimensionRegistry] Failed to import ${file}:`, err);
        }
      }

      // Validate weights after all dimensions are loaded
      if (this.dimensions.size > 0) {
        this.validateWeights();
      }
    } catch (err) {
      // Re-throw weight validation errors
      if (err instanceof Error && err.message.includes('Weight validation failed')) {
        throw err;
      }
      console.error('[DimensionRegistry] Auto-import failed:', err);
    }
  }

  /**
   * Clear all registrations (for testing).
   */
  _reset(): void {
    this.dimensions.clear();
    this.initialized = false;
  }
}

/** Singleton dimension registry */
export const dimensionRegistry = new DimensionRegistry();
