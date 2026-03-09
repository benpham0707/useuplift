/**
 * Pattern Registry — Self-registering essay pattern manifest system
 *
 * Patterns register themselves by calling patternRegistry.register()
 * at module scope. The registry auto-discovers all *.pattern.ts files
 * in the patterns/ directory (including subdirectories) at startup.
 *
 * Usage:
 *   // In a pattern file (e.g., openings/action-opening.pattern.ts):
 *   import { patternRegistry } from '../../registry/patternRegistry';
 *   patternRegistry.register({ id: 'action_opening', ... });
 *
 *   // To query:
 *   const p = patternRegistry.getPattern('action_opening');
 *   const openings = patternRegistry.listByCategory('opening');
 */

import { PatternManifest, PatternCategory } from '../shared/types';

class EssayPatternRegistry {
  private patterns = new Map<string, PatternManifest>();
  private initialized = false;

  register(manifest: PatternManifest): void {
    if (this.patterns.has(manifest.id)) {
      throw new Error(
        `[EssayPatternRegistry] Duplicate pattern ID: '${manifest.id}'. Each pattern must have a unique ID.`
      );
    }
    this.patterns.set(manifest.id, manifest);
  }

  getPattern(id: string): PatternManifest | undefined {
    return this.patterns.get(id);
  }

  getAll(): PatternManifest[] {
    return Array.from(this.patterns.values());
  }

  listByCategory(category: PatternCategory): PatternManifest[] {
    return Array.from(this.patterns.values()).filter(p => p.category === category);
  }

  /** Run all pattern detectors against text. Returns matched patterns. */
  detectAll(text: string): PatternManifest[] {
    return Array.from(this.patterns.values()).filter(p => {
      if (p.detection instanceof RegExp) {
        return p.detection.test(text);
      }
      return p.detection(text);
    });
  }

  /** Run only patterns in a given category against text. */
  detectByCategory(text: string, category: PatternCategory): PatternManifest[] {
    return this.listByCategory(category).filter(p => {
      if (p.detection instanceof RegExp) {
        return p.detection.test(text);
      }
      return p.detection(text);
    });
  }

  get size(): number {
    return this.patterns.size;
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
      const patternsDir = path.join(currentDir, '..', 'patterns');

      if (!fs.existsSync(patternsDir)) return;

      // Scan subdirectories (openings/, transitions/, closings/, techniques/)
      const subdirs = fs.readdirSync(patternsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => path.join(patternsDir, d.name));

      // Also include top-level pattern files if any
      subdirs.unshift(patternsDir);

      for (const dir of subdirs) {
        const files = fs.readdirSync(dir).filter(
          f => f.endsWith('.pattern.ts') || f.endsWith('.pattern.js')
        );

        for (const file of files) {
          try {
            await import(path.join(dir, file));
          } catch (err) {
            console.error(`[EssayPatternRegistry] Failed to import ${file}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('[EssayPatternRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.patterns.clear();
    this.initialized = false;
  }
}

/** Singleton essay pattern registry */
export const patternRegistry = new EssayPatternRegistry();
