/**
 * Workshop System — Top-level barrel exports
 *
 * The workshop system provides a registry-based architecture for:
 * - Editing commands (add by dropping a *.cmd.ts file)
 * - Scoring dimensions (add by dropping a *.dim.ts file)
 * - Essay profiles (add by dropping a *.profile.ts file)
 *
 * Adding a new capability = adding one file. No other files need editing.
 */

// Registries
export { commandRegistry, dimensionRegistry, essayProfileRegistry } from './registry';

// Scoring
export { eqiCalculator } from './scoring';

// Types (re-export for convenience)
export type {
  CommandManifest,
  CommandFamily,
  DimensionManifest,
  EssayProfileManifest,
  MacroStrategy,
  WorkshopEssayType,
  ScoringTier,
  ImpressionLabel,
  ExtractedFeatures,
  HeuristicResult,
  LLMScoreResult,
  FinalDimensionScore,
  ScoringResult,
  EQIInput,
  EQIResult,
  HybridScoringConfig,
} from './shared/types';
