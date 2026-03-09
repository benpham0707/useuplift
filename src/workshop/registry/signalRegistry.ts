/**
 * Quality Signal Registry — Self-registering quality signal manifest system
 *
 * Signals register themselves by calling signalRegistry.register()
 * at module scope. The registry auto-discovers all *.signal.ts files
 * in the signals/ directory at startup.
 *
 * Each signal computes a 0-1 score from extracted features and feeds
 * into one or more dimension scores via the hybridScoringPipeline.
 *
 * Usage:
 *   // In a signal file (e.g., show-dont-tell.signal.ts):
 *   import { signalRegistry } from '../registry/signalRegistry';
 *   signalRegistry.register({ id: 'show_dont_tell', ... });
 *
 *   // To query:
 *   const s = signalRegistry.getSignal('show_dont_tell');
 *   const forDim = signalRegistry.listByDimension('narrative_craft_storytelling');
 */

import { QualitySignalManifest } from '../shared/types';

class QualitySignalRegistry {
  private signals = new Map<string, QualitySignalManifest>();
  private initialized = false;

  register(manifest: QualitySignalManifest): void {
    if (this.signals.has(manifest.id)) {
      throw new Error(
        `[QualitySignalRegistry] Duplicate signal ID: '${manifest.id}'. Each signal must have a unique ID.`
      );
    }
    this.signals.set(manifest.id, manifest);
  }

  getSignal(id: string): QualitySignalManifest | undefined {
    return this.signals.get(id);
  }

  getAll(): QualitySignalManifest[] {
    return Array.from(this.signals.values());
  }

  listByDimension(dimensionId: string): QualitySignalManifest[] {
    return Array.from(this.signals.values()).filter(s => s.dimensionId === dimensionId);
  }

  /** Compute all signals for a given dimension and return weighted average (0-100) */
  computeForDimension(
    dimensionId: string,
    features: import('../shared/types').ExtractedFeatures,
    text: string
  ): number {
    const signals = this.listByDimension(dimensionId);
    if (signals.length === 0) return 0;

    const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = signals.reduce((sum, sig) => {
      const raw = sig.compute(features, text);
      const clamped = Math.max(0, Math.min(1, raw));
      return sum + clamped * sig.weight;
    }, 0);

    return Math.round((weightedSum / totalWeight) * 100);
  }

  get size(): number {
    return this.signals.size;
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
      const signalsDir = path.join(currentDir, '..', 'signals');

      if (!fs.existsSync(signalsDir)) return;

      const files = fs.readdirSync(signalsDir).filter(
        f => f.endsWith('.signal.ts') || f.endsWith('.signal.js')
      );

      for (const file of files) {
        try {
          await import(path.join(signalsDir, file));
        } catch (err) {
          console.error(`[QualitySignalRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[QualitySignalRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.signals.clear();
    this.initialized = false;
  }
}

/** Singleton quality signal registry */
export const signalRegistry = new QualitySignalRegistry();
