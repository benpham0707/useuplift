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
export {
  commandRegistry,
  dimensionRegistry,
  essayProfileRegistry,
  strategyRegistry,
  patternRegistry,
  signalRegistry,
} from './registry';

// Essay Profiles (import triggers self-registration)
import './essay-profiles';

// Scoring
export { eqiCalculator, featureExtractor, hybridScoringPipeline } from './scoring';

// Orchestrator
export { strategySelector, MACRO_STRATEGIES } from './orchestrator';

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
  FusionMetadata,
  ScoringResult,
  EQIInput,
  EQIResult,
  HybridScoringConfig,
  StrategyExample,
  StrategyTeaching,
  StrategyDetection,
  StrategyManifest,
  PatternCategory,
  PatternBeforeAfter,
  PatternManifest,
  QualitySignalManifest,
} from './shared/types';
