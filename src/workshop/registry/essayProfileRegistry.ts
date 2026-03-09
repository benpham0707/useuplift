/**
 * Essay Profile Registry — Self-registering essay profile manifest system
 *
 * Profiles register themselves by calling essayProfileRegistry.register()
 * at module scope. The registry auto-discovers all *.profile.ts files
 * in the essay-profiles/ directory at startup.
 *
 * Each profile customizes the scoring and editing pipeline for a
 * specific essay type (Common App, PIQ, "Why Us", etc.).
 *
 * Usage:
 *   // In a profile file (e.g., common-app.profile.ts):
 *   import { essayProfileRegistry } from '../registry/essayProfileRegistry';
 *   essayProfileRegistry.register({ id: 'personal_statement', ... });
 *
 *   // To query:
 *   const profile = essayProfileRegistry.getProfile('uc_piq');
 */

import { EssayProfileManifest, WorkshopEssayType } from '../shared/types';

class EssayProfileRegistry {
  private profiles = new Map<WorkshopEssayType, EssayProfileManifest>();
  private initialized = false;

  /**
   * Register an essay profile manifest. Throws on duplicate essay type.
   */
  register(manifest: EssayProfileManifest): void {
    if (this.profiles.has(manifest.id)) {
      throw new Error(
        `[EssayProfileRegistry] Duplicate essay profile for type: '${manifest.id}'. Each essay type can only have one profile.`
      );
    }
    this.profiles.set(manifest.id, manifest);
  }

  /**
   * Get a profile by essay type.
   */
  getProfile(essayType: WorkshopEssayType): EssayProfileManifest | undefined {
    return this.profiles.get(essayType);
  }

  /**
   * Get all registered profiles.
   */
  getAll(): EssayProfileManifest[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Check if a profile exists for a given essay type.
   */
  hasProfile(essayType: WorkshopEssayType): boolean {
    return this.profiles.has(essayType);
  }

  /**
   * Get count of registered profiles.
   */
  get size(): number {
    return this.profiles.size;
  }

  /**
   * Auto-import all profile files from the essay-profiles/ directory.
   * Called once at startup. Safe to call multiple times (idempotent).
   */
  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const profilesDir = path.join(__dirname, '..', 'essay-profiles');

      if (!fs.existsSync(profilesDir)) return;

      const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.profile.ts') || f.endsWith('.profile.js'));

      for (const file of files) {
        try {
          await import(path.join(profilesDir, file));
        } catch (err) {
          console.error(`[EssayProfileRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[EssayProfileRegistry] Auto-import failed:', err);
    }
  }

  /**
   * Clear all registrations (for testing).
   */
  _reset(): void {
    this.profiles.clear();
    this.initialized = false;
  }
}

/** Singleton essay profile registry */
export const essayProfileRegistry = new EssayProfileRegistry();
