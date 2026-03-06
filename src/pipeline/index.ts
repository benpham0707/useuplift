/**
 * Unified Annotation Pipeline — Barrel Exports
 *
 * Single import point for the annotation-based essay analysis system.
 */

// Types
export type {
  TextSpan,
  AnnotationSeverity,
  EssayAnnotation,
  DerivedDimensionScore,
  AnnotatedAnalysisResult,
  DeepDiveResult,
  AnnotationPipelineConfig,
  BatchActivityConfig,
  BatchActivityResult,
  ReanalysisRequest,
  ReanalysisResult,
  AnalyzeRequest,
  DeepDiveRequest,
  ReanalyzeRequest,
  BatchActivitiesRequest,
  AnnotationApiResponse,
  AssembledPrompt,
  RawLLMAnnotation,
  EnrichedFeatures,
  ScoreDerivationInput,
  ImprovementStep,
  ImprovementRoadmap,
  ScoreCalibrationConfig,
} from './types';

// Services
export { annotationPipeline } from './annotationPipeline';
export { promptBuilder } from './promptBuilder';
export { scoreDeriver } from './scoreDeriver';
export { deepDiveService } from './deepDiveService';
export { reanalysisService } from './reanalysisService';
export { batchActivityPipeline } from './batchActivityPipeline';
export { validateAnnotations, clamp } from './annotationValidation';
export { generateSummary } from './summaryGenerator';
export type { SummaryGeneratorInput } from './summaryGenerator';
export { generateRoadmap } from './improvementRoadmap';
export type { RoadmapGeneratorInput } from './improvementRoadmap';

// Wave 2: Deep Content Analysis
export { analyzeEssayStructure } from './structureAnalyzer';
export { analyzeThemes } from './themeAnalyzer';
export { analyzeCharacterRevelation } from './characterAnalyzer';
export { analyzeInsight } from './insightAnalyzer';
export type {
  ArcType,
  EssayBeat,
  EssayStructureAnalysis,
  ThemeAnalysisResult,
  CharacterAnalysisResult,
  InsightAnalysisResult,
  DeepContentAnalysis,
} from './contentAnalysisTypes';
