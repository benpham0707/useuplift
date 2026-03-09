/**
 * Writing Strategy Registry — Self-registering writing strategy manifest system
 *
 * Strategies register themselves by calling strategyRegistry.register()
 * at module scope. The registry auto-discovers all *.strategy.ts files
 * in the strategies/ directory at startup.
 *
 * Usage:
 *   // In a strategy file (e.g., montage-technique.strategy.ts):
 *   import { strategyRegistry } from '../registry/strategyRegistry';
 *   strategyRegistry.register({ id: 'montage_technique', ... });
 *
 *   // To query:
 *   const s = strategyRegistry.getStrategy('zoom_lens');
 *   const forType = strategyRegistry.listByEssayType('personal_statement');
 */

import { StrategyManifest, WorkshopEssayType } from '../shared/types';

class WritingStrategyRegistry {
  private strategies = new Map<string, StrategyManifest>();
  private initialized = false;

  register(manifest: StrategyManifest): void {
    if (this.strategies.has(manifest.id)) {
      throw new Error(
        `[WritingStrategyRegistry] Duplicate strategy ID: '${manifest.id}'. Each strategy must have a unique ID.`
      );
    }
    this.strategies.set(manifest.id, manifest);
  }

  getStrategy(id: string): StrategyManifest | undefined {
    return this.strategies.get(id);
  }

  getAll(): StrategyManifest[] {
    return Array.from(this.strategies.values());
  }

  listByEssayType(essayType: WorkshopEssayType): StrategyManifest[] {
    return Array.from(this.strategies.values()).filter(s =>
      s.bestFor.includes(essayType)
    );
  }

  get size(): number {
    return this.strategies.size;
  }

  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const currentDir = typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));
      const strategiesDir = path.join(currentDir, '..', 'strategies');

      if (!fs.existsSync(strategiesDir)) return;

      const files = fs.readdirSync(strategiesDir).filter(
        f => f.endsWith('.strategy.ts') || f.endsWith('.strategy.js')
      );

      for (const file of files) {
        try {
          await import(path.join(strategiesDir, file));
        } catch (err) {
          console.error(`[WritingStrategyRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[WritingStrategyRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.strategies.clear();
    this.initialized = false;
  }
}

/** Singleton writing strategy registry */
export const strategyRegistry = new WritingStrategyRegistry();
