/**
 * Workshop Scoring — Barrel exports
 */

export { eqiCalculator, EQICalculator } from './eqiCalculator';
export { featureExtractor, FeatureExtractor } from './featureExtractor';
export { hybridScoringPipeline, HybridScoringPipeline } from './hybridScoringPipeline';
export { llmScoringService, LLMScoringService } from './llmScoringService';
export type { LLMCallResult, BatchCallInput } from './llmScoringService';

// Craft features (extended deterministic analysis)
export { extractCraftFeatures } from './craftFeatures';
export type { CraftFeatures } from './craftFeatures';

// Narrative analyzers
export {
  runNarrativeAnalysis,
  analyzeSpecificityGradient,
  analyzeSceneVsSummary,
  analyzeShowVsTell,
  analyzeNarrativeArc,
  analyzeEmotionalJourney,
  analyzeInformationDensity,
  analyzeTensionCurve,
} from './narrativeAnalyzers';

// Paragraph function classifier
export {
  classifyParagraphFunctions,
  analyzeNarrativeFlow,
} from './paragraphFunctionClassifier';

// Structural pattern detector
export { analyzeStructuralPatterns } from './structuralPatternDetector';

// Teaching principles
export { TEACHING_PRINCIPLES, selectPrincipleForEmotion, getPrinciple } from './teachingPrinciples';

// Narrative analyzer types
export type {
  NarrativeAnalysisResult,
  NarrativeArcType,
  NarrativeArcAnalysis,
  EmotionalCategory,
  EmotionalJourneyAnalysis,
  SpecificityGradient,
  SceneVsSummaryAnalysis,
  ShowVsTellAnalysis,
  InformationDensityAnalysis,
  TensionCurveAnalysis,
  NarrativeAnalysisMetadata,
  ParagraphFunction,
  ParagraphFunctionAnalysis,
  NarrativeFlowAnalysis,
  FunctionSignals,
  TeachingPrinciple,
} from './narrativeAnalyzerTypes';

// Structural pattern types
export type {
  ParagraphMetrics,
  CrossParagraphShifts,
  StructuralAnalysis,
} from './structuralPatternDetector';

// Pre-analysis validator
export { validatePreAnalysis } from './preAnalysisValidator';
export type { ValidationResult } from './preAnalysisValidator';

// Narrative LLM response types + cache
export type {
  NarrativeStructureLLMResponse,
  NarrativeDynamicsLLMResponse,
} from './narrativeLLMTypes';
export {
  getStructureInsights,
  getDynamicsInsights,
  cacheStructureInsights,
  cacheDynamicsInsights,
  simpleHash,
} from './narrativeLLMTypes';
