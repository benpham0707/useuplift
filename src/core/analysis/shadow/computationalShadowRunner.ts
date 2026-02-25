/**
 * Computational Shadow Runner — Phase 1 "Shadow Mode"
 *
 * Runs the new computational analysis engines (InformationTheoretic,
 * Stylometric, ScoringScience) IN PARALLEL with the existing LLM pipeline,
 * logging results for comparison without affecting any outputs.
 *
 * ZERO IMPACT GUARANTEE:
 * - Never throws (all errors caught and logged)
 * - Never modifies inputs or outputs
 * - Runs asynchronously (fire-and-forget)
 * - Can be toggled on/off via environment variables
 * - Logs to JSONL files for offline analysis
 *
 * FEATURE FLAGS (all default to false):
 *   ENABLE_COMPUTATIONAL_SHADOW=true     — Master switch
 *   SHADOW_INFO_THEORY=true              — Information-theoretic analyzer
 *   SHADOW_STYLOMETRICS=true             — Stylometric analyzer
 *   SHADOW_SCORING=true                  — Scoring science pipeline
 *   SHADOW_COMMON_APP=true               — Run on Common App essays
 *   SHADOW_PIQ=true                      — Run on PIQ essays
 *   SHADOW_ACTIVITY=true                 — Run on activity descriptions
 *   SHADOW_LOG_DIR=/path/to/dir          — Log directory (default: /tmp/uplift-shadow)
 *   SHADOW_LOG_VERBOSE=true              — Include full analyzer output (large)
 *
 * Performance budget: < 50ms total for all 3 analyzers combined.
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

import {
  InformationTheoreticAnalyzer,
  type InformationTheoreticAnalysis,
  type InformationTheoreticRubricScores,
} from '../features/informationTheoreticAnalyzer';

import { StylometricAnalyzer } from '../../../services/stylometrics/stylometricAnalyzer';
import type { StylometricAnalysis, RubricMapping } from '../../../services/stylometrics/types';

import {
  runScoringPipeline,
  DEFAULT_EXPERIENCE_CONFIG,
  DEFAULT_ESSAY_CONFIG,
  type ScoringPipelineConfig,
} from '../scoring/scoringScience/scoringSciencePipeline';
import type { ComputationalSignals } from '../scoring/scoringScience/bayesianUpdating';
import type { ScoringCalibratedResult } from '../scoring/scoringScience/types';

// ============================================================================
// TYPES
// ============================================================================

/** Workshop types that can trigger shadow analysis */
export type ShadowWorkshopType = 'common_app' | 'piq' | 'activity' | 'experience_entry';

/** Input to the shadow runner */
export interface ShadowRunInput {
  /** The text to analyze */
  text: string;

  /** Which workshop type this came from */
  workshopType: ShadowWorkshopType;

  /** Optional metadata for log correlation */
  metadata?: {
    /** User ID (anonymized or omitted in production) */
    userId?: string;
    /** Activity/essay ID for correlation */
    entityId?: string;
    /** Activity category (for experience entries) */
    activityCategory?: string;
    /** Essay prompt ID (for Common App / PIQ) */
    promptId?: string;
    /** Word count (pre-computed, avoids re-counting) */
    wordCount?: number;
    /** Which engine produced the LLM scores */
    scoringEngine?: string;
  };

  /** LLM scores to compare against (when available) */
  llmScores?: Record<string, number>;

  /** LLM-computed NQI (when available) */
  llmNqi?: number;
}

/** Result from a single analyzer (always includes timing, never throws) */
interface AnalyzerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

/** Score comparison between computational and LLM for a single dimension */
export interface DimensionComparison {
  dimension: string;
  llmScore: number;
  computationalScore: number;
  delta: number;
  /** Absolute delta */
  absDelta: number;
  /** Which source produced the higher score */
  higherSource: 'llm' | 'computational' | 'equal';
}

/** The full shadow run log entry written to JSONL */
export interface ShadowRunLog {
  /** ISO timestamp */
  timestamp: string;

  /** Monotonically increasing run ID within this process */
  runId: number;

  /** Workshop type */
  workshopType: ShadowWorkshopType;

  /** Text metadata (NOT the text itself for privacy/size) */
  textStats: {
    wordCount: number;
    charCount: number;
    paragraphCount: number;
    sentenceCount: number;
  };

  /** Correlation metadata */
  metadata: ShadowRunInput['metadata'];

  // --- ANALYZER RESULTS ---

  /** Information-theoretic analyzer results */
  infoTheory: {
    enabled: boolean;
    success: boolean;
    durationMs: number;
    error?: string;
    /** Rubric-mapped scores (0-10) */
    rubricScores?: InformationTheoreticRubricScores;
    /** Diagnostic flags */
    diagnostics?: string[];
    /** Per-technique timing */
    perTechniqueTiming?: Record<string, number>;
  };

  /** Stylometric analyzer results */
  stylometrics: {
    enabled: boolean;
    success: boolean;
    durationMs: number;
    error?: string;
    /** Rubric-mapped scores from stylometric analysis */
    rubricScores?: RubricMapping;
    /** AI detection probability */
    aiProbability?: number;
    /** Voice distinctiveness score */
    voiceDistinctiveness?: number;
  };

  /** Scoring science pipeline results (requires LLM scores as input) */
  scoringScience: {
    enabled: boolean;
    success: boolean;
    durationMs: number;
    error?: string;
    /** Calibrated quality index */
    calibratedQI?: number;
    /** QI confidence interval */
    calibratedQI_CI?: [number, number];
    /** Reliability assessment */
    reliability?: string;
    /** Number of flagged dimensions */
    flaggedDimensions?: number;
    /** Number of constraint violations */
    constraintViolations?: number;
    /** IRT anomalous dimensions */
    irtAnomalies?: string[];
  };

  // --- COMPARISON DATA ---

  /** Score comparisons (only populated when LLM scores provided) */
  comparison?: {
    /** Per-dimension computational vs LLM comparison */
    dimensions: DimensionComparison[];
    /** Mean absolute delta across all compared dimensions */
    meanAbsDelta: number;
    /** Pearson correlation between computational and LLM scores */
    correlation: number;
    /** LLM NQI vs computational composite */
    nqiComparison?: {
      llmNqi: number;
      computationalComposite: number;
      delta: number;
    };
  };

  // --- AGGREGATE TIMING ---

  /** Total wall-clock time for shadow run */
  totalDurationMs: number;

  /** Whether the shadow run completed within performance budget */
  withinBudget: boolean;

  /** Performance budget in ms */
  budgetMs: number;
}

// ============================================================================
// FEATURE FLAG HELPERS
// ============================================================================

function envBool(key: string, defaultValue = false): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  return val === 'true' || val === '1';
}

function isShadowEnabled(): boolean {
  return envBool('ENABLE_COMPUTATIONAL_SHADOW', false);
}

function isModuleEnabled(module: 'info_theory' | 'stylometrics' | 'scoring'): boolean {
  const keyMap = {
    info_theory: 'SHADOW_INFO_THEORY',
    stylometrics: 'SHADOW_STYLOMETRICS',
    scoring: 'SHADOW_SCORING',
  };
  // If master switch is on but no per-module flag set, default to true
  return envBool(keyMap[module], true);
}

function isWorkshopEnabled(workshopType: ShadowWorkshopType): boolean {
  const keyMap: Record<ShadowWorkshopType, string> = {
    common_app: 'SHADOW_COMMON_APP',
    piq: 'SHADOW_PIQ',
    activity: 'SHADOW_ACTIVITY',
    experience_entry: 'SHADOW_ACTIVITY', // Same flag for experience entries
  };
  // If master switch is on but no per-workshop flag set, default to true
  return envBool(keyMap[workshopType], true);
}

function getLogDir(): string {
  return process.env.SHADOW_LOG_DIR || '/tmp/uplift-shadow';
}

function isVerboseLogging(): boolean {
  return envBool('SHADOW_LOG_VERBOSE', false);
}

// ============================================================================
// TEXT UTILITIES
// ============================================================================

function computeTextStats(text: string): ShadowRunLog['textStats'] {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  return {
    wordCount: words.length,
    charCount: trimmed.length,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
  };
}

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

/** Pearson correlation coefficient between two arrays */
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// ============================================================================
// DIMENSION MAPPING
// ============================================================================

/**
 * Maps information-theoretic rubric scores to the 11-dimension experience rubric.
 *
 * The InformationTheoreticAnalyzer produces its own rubric-mapped scores,
 * but some names differ. This maps them to the canonical experience rubric keys.
 */
const INFO_THEORY_TO_RUBRIC: Record<keyof InformationTheoreticRubricScores, string> = {
  wordChoiceDiversity: 'voice_integrity',
  writingNaturalness: 'craft_language_quality',
  structuralBalance: 'narrative_arc_stakes',      // closest match
  densityArcQuality: 'narrative_arc_stakes',       // narrative arc quality
  introConclCoherence: 'reflection_meaning',
  informationUniqueness: 'specificity_evidence',
  openingSurprisal: 'voice_integrity',             // opening hook maps to voice
  emotionalDensityVariation: 'reflection_meaning',
  vulnerabilitySurprisal: 'voice_integrity',
  engagementSurprisal: 'craft_language_quality',
  contentProgression: 'transformative_impact',
};

/**
 * Compute a single computational score per rubric dimension by averaging
 * all information-theoretic signals that map to it.
 */
function aggregateInfoTheoryScores(
  rubricScores: InformationTheoreticRubricScores
): Record<string, number> {
  const buckets: Record<string, number[]> = {};

  for (const [key, rubricDim] of Object.entries(INFO_THEORY_TO_RUBRIC)) {
    const score = rubricScores[key as keyof InformationTheoreticRubricScores];
    if (score !== undefined) {
      if (!buckets[rubricDim]) buckets[rubricDim] = [];
      buckets[rubricDim].push(score);
    }
  }

  const result: Record<string, number> = {};
  for (const [dim, scores] of Object.entries(buckets)) {
    result[dim] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  return result;
}

/**
 * Merge stylometric rubric scores into the dimension map.
 * Stylometrics map to: voice_integrity, craft_language_quality,
 * vulnerability_risk (not in experience rubric, skip), audience_awareness (skip).
 */
function mergeStylometricScores(
  base: Record<string, number>,
  rubricMapping: RubricMapping
): Record<string, number> {
  const result = { ...base };

  // voice_integrity: average with existing if present
  if (rubricMapping.voice_integrity) {
    const existing = result['voice_integrity'];
    if (existing !== undefined) {
      result['voice_integrity'] = Math.round(((existing + rubricMapping.voice_integrity.score) / 2) * 10) / 10;
    } else {
      result['voice_integrity'] = rubricMapping.voice_integrity.score;
    }
  }

  // craft_language_quality: average with existing if present
  if (rubricMapping.craft_language_quality) {
    const existing = result['craft_language_quality'];
    if (existing !== undefined) {
      result['craft_language_quality'] = Math.round(((existing + rubricMapping.craft_language_quality.score) / 2) * 10) / 10;
    } else {
      result['craft_language_quality'] = rubricMapping.craft_language_quality.score;
    }
  }

  return result;
}

// ============================================================================
// LOGGING
// ============================================================================

let runCounter = 0;

function writeLog(log: ShadowRunLog): void {
  try {
    const dir = getLogDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Date-partitioned files: shadow-2026-02-24.jsonl
    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = join(dir, `shadow-${dateStr}.jsonl`);

    // Strip verbose data if not requested
    const logEntry = isVerboseLogging() ? log : log;

    appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf-8');
  } catch (err) {
    // Last resort: console.warn (never throw from logging)
    console.warn('[ShadowRunner] Failed to write log:', err instanceof Error ? err.message : String(err));
  }
}

// ============================================================================
// MAIN SHADOW RUNNER CLASS
// ============================================================================

export class ComputationalShadowRunner {
  private infoTheoryAnalyzer: InformationTheoreticAnalyzer;
  private stylometricAnalyzer: StylometricAnalyzer;

  /** Performance budget in milliseconds */
  private readonly budgetMs = 50;

  constructor() {
    this.infoTheoryAnalyzer = new InformationTheoreticAnalyzer();
    this.stylometricAnalyzer = new StylometricAnalyzer();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Run shadow analysis on a text. Fire-and-forget.
   *
   * NEVER throws. NEVER blocks. NEVER modifies inputs or outputs.
   * Returns a Promise that resolves to the log entry (for testing),
   * but callers should NOT await this in production code.
   *
   * Usage:
   *   // Fire-and-forget (production)
   *   shadowRunner.run({ text: essayText, workshopType: 'common_app' });
   *
   *   // Await for testing
   *   const log = await shadowRunner.run({ ... });
   */
  async run(input: ShadowRunInput): Promise<ShadowRunLog | null> {
    // Master switch check
    if (!isShadowEnabled()) return null;

    // Workshop-specific check
    if (!isWorkshopEnabled(input.workshopType)) return null;

    // Minimum text length guard
    if (!input.text || input.text.trim().length < 10) return null;

    try {
      return await this.executeRun(input);
    } catch (err) {
      // Absolute last-resort catch. This should never happen since
      // executeRun has its own try/catch, but defense in depth.
      console.warn(
        '[ShadowRunner] Unexpected error in run():',
        err instanceof Error ? err.message : String(err)
      );
      return null;
    }
  }

  /**
   * Check if shadow mode is currently enabled.
   * Useful for conditional logging or debug output.
   */
  isEnabled(): boolean {
    return isShadowEnabled();
  }

  // ==========================================================================
  // PRIVATE IMPLEMENTATION
  // ==========================================================================

  private async executeRun(input: ShadowRunInput): Promise<ShadowRunLog> {
    const overallStart = performance.now();
    const runId = ++runCounter;

    const textStats = computeTextStats(input.text);

    // --- Run analyzers in parallel ---
    const [infoTheoryResult, stylometricResult] = await Promise.all([
      this.runInfoTheory(input.text),
      this.runStylometrics(input.text),
    ]);

    // --- Run scoring science if LLM scores available ---
    let scoringScienceResult: AnalyzerResult<ScoringCalibratedResult>;
    if (input.llmScores && Object.keys(input.llmScores).length > 0 && isModuleEnabled('scoring')) {
      scoringScienceResult = await this.runScoringScience(
        input.llmScores,
        input.workshopType,
        infoTheoryResult.data,
        input.metadata?.wordCount ?? textStats.wordCount,
        input.metadata?.activityCategory
      );
    } else {
      scoringScienceResult = {
        success: false,
        error: input.llmScores ? 'scoring module disabled' : 'no LLM scores provided',
        durationMs: 0,
      };
    }

    // --- Build comparison data ---
    let comparison: ShadowRunLog['comparison'];
    if (input.llmScores && Object.keys(input.llmScores).length > 0) {
      comparison = this.buildComparison(
        input.llmScores,
        input.llmNqi,
        infoTheoryResult.data,
        stylometricResult.data
      );
    }

    const totalDurationMs = Math.round((performance.now() - overallStart) * 100) / 100;

    // --- Assemble log entry ---
    const log: ShadowRunLog = {
      timestamp: new Date().toISOString(),
      runId,
      workshopType: input.workshopType,
      textStats,
      metadata: input.metadata,

      infoTheory: {
        enabled: isModuleEnabled('info_theory'),
        success: infoTheoryResult.success,
        durationMs: infoTheoryResult.durationMs,
        error: infoTheoryResult.error,
        rubricScores: infoTheoryResult.data?.rubricScores,
        diagnostics: infoTheoryResult.data?.diagnostics,
        perTechniqueTiming: infoTheoryResult.data?.performance.perTechnique,
      },

      stylometrics: {
        enabled: isModuleEnabled('stylometrics'),
        success: stylometricResult.success,
        durationMs: stylometricResult.durationMs,
        error: stylometricResult.error,
        rubricScores: stylometricResult.data
          ? this.stylometricAnalyzer.mapToRubric(stylometricResult.data)
          : undefined,
        aiProbability: stylometricResult.data?.aiDetection.aiProbability,
        voiceDistinctiveness: stylometricResult.data?.idiolect.distinctiveness,
      },

      scoringScience: {
        enabled: isModuleEnabled('scoring'),
        success: scoringScienceResult.success,
        durationMs: scoringScienceResult.durationMs,
        error: scoringScienceResult.error,
        calibratedQI: scoringScienceResult.data?.quality_index,
        calibratedQI_CI: scoringScienceResult.data?.quality_index_ci as [number, number] | undefined,
        reliability: scoringScienceResult.data?.reliability.assessment,
        flaggedDimensions: scoringScienceResult.data
          ? Object.values(scoringScienceResult.data.calibrated_scores).filter(s => s.flagged).length
          : undefined,
        constraintViolations: scoringScienceResult.data?.constraint_check.violations_found,
        irtAnomalies: scoringScienceResult.data?.irt_estimate.anomalous_dimensions,
      },

      comparison,
      totalDurationMs,
      withinBudget: totalDurationMs <= this.budgetMs,
      budgetMs: this.budgetMs,
    };

    // --- Write log ---
    writeLog(log);

    // --- Console summary (always, when shadow is enabled) ---
    const status = log.withinBudget ? 'OK' : 'SLOW';
    console.log(
      `[ShadowRunner] #${runId} ${input.workshopType} | ` +
      `${totalDurationMs}ms [${status}] | ` +
      `IT:${infoTheoryResult.success ? infoTheoryResult.durationMs + 'ms' : 'ERR'} ` +
      `ST:${stylometricResult.success ? stylometricResult.durationMs + 'ms' : 'ERR'} ` +
      `SS:${scoringScienceResult.success ? scoringScienceResult.durationMs + 'ms' : 'N/A'}` +
      (comparison ? ` | corr=${comparison.correlation.toFixed(2)} MAD=${comparison.meanAbsDelta.toFixed(1)}` : '')
    );

    return log;
  }

  // ==========================================================================
  // INDIVIDUAL ANALYZER RUNNERS
  // ==========================================================================

  private async runInfoTheory(text: string): Promise<AnalyzerResult<InformationTheoreticAnalysis>> {
    if (!isModuleEnabled('info_theory')) {
      return { success: false, error: 'disabled', durationMs: 0 };
    }

    const start = performance.now();
    try {
      const data = this.infoTheoryAnalyzer.analyze(text);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return { success: true, data, durationMs };
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs,
      };
    }
  }

  private async runStylometrics(text: string): Promise<AnalyzerResult<StylometricAnalysis>> {
    if (!isModuleEnabled('stylometrics')) {
      return { success: false, error: 'disabled', durationMs: 0 };
    }

    const start = performance.now();
    try {
      const data = this.stylometricAnalyzer.analyze(text);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return { success: true, data, durationMs };
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs,
      };
    }
  }

  private async runScoringScience(
    rawScores: Record<string, number>,
    workshopType: ShadowWorkshopType,
    infoTheoryData: InformationTheoreticAnalysis | undefined,
    wordCount: number,
    activityCategory?: string
  ): Promise<AnalyzerResult<ScoringCalibratedResult>> {
    const start = performance.now();
    try {
      // Choose config based on workshop type
      const isEssay = workshopType === 'common_app' || workshopType === 'piq';
      const baseConfig = isEssay ? DEFAULT_ESSAY_CONFIG : DEFAULT_EXPERIENCE_CONFIG;

      // Build computational signals for Bayesian priors.
      // The ComputationalSignals interface expects text-feature signals,
      // NOT the info-theory rubric scores. We approximate from available data.
      // In shadow mode, we don't have access to the full ExtractedFeatures,
      // so we pass undefined and let the pipeline skip Bayesian priors.
      const computationalSignals: ComputationalSignals | undefined = undefined;

      const config: ScoringPipelineConfig = {
        ...baseConfig,
        mode: 'full',
        wordCount,
        activityCategory,
        computationalSignals,
      };

      const data = runScoringPipeline(rawScores, config);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return { success: true, data, durationMs };
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs,
      };
    }
  }

  // ==========================================================================
  // COMPARISON BUILDER
  // ==========================================================================

  private buildComparison(
    llmScores: Record<string, number>,
    llmNqi: number | undefined,
    infoTheoryData: InformationTheoreticAnalysis | undefined,
    stylometricData: StylometricAnalysis | undefined
  ): ShadowRunLog['comparison'] {
    // Build computational score map from available analyzers
    let computationalScores: Record<string, number> = {};

    if (infoTheoryData) {
      computationalScores = aggregateInfoTheoryScores(infoTheoryData.rubricScores);
    }

    if (stylometricData) {
      const rubricMapping = this.stylometricAnalyzer.mapToRubric(stylometricData);
      computationalScores = mergeStylometricScores(computationalScores, rubricMapping);
    }

    // Build per-dimension comparisons
    const dimensions: DimensionComparison[] = [];
    const llmValues: number[] = [];
    const compValues: number[] = [];

    for (const [dim, llmScore] of Object.entries(llmScores)) {
      const compScore = computationalScores[dim];
      if (compScore !== undefined) {
        const delta = Math.round((compScore - llmScore) * 10) / 10;
        dimensions.push({
          dimension: dim,
          llmScore,
          computationalScore: compScore,
          delta,
          absDelta: Math.abs(delta),
          higherSource: delta > 0.05 ? 'computational' : delta < -0.05 ? 'llm' : 'equal',
        });
        llmValues.push(llmScore);
        compValues.push(compScore);
      }
    }

    // Mean absolute delta
    const meanAbsDelta = dimensions.length > 0
      ? Math.round(
          (dimensions.reduce((sum, d) => sum + d.absDelta, 0) / dimensions.length) * 10
        ) / 10
      : 0;

    // Pearson correlation
    const correlation = dimensions.length >= 3
      ? Math.round(pearsonCorrelation(llmValues, compValues) * 100) / 100
      : 0;

    // NQI comparison
    let nqiComparison: ShadowRunLog['comparison'] extends undefined ? never : NonNullable<ShadowRunLog['comparison']>['nqiComparison'];
    if (llmNqi !== undefined && Object.keys(computationalScores).length > 0) {
      const compScoreValues = Object.values(computationalScores);
      const computationalComposite = Math.round(
        (compScoreValues.reduce((a, b) => a + b, 0) / compScoreValues.length) * 10
      );
      nqiComparison = {
        llmNqi,
        computationalComposite,
        delta: computationalComposite - llmNqi,
      };
    }

    return {
      dimensions,
      meanAbsDelta,
      correlation,
      nqiComparison,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const computationalShadowRunner = new ComputationalShadowRunner();

// ============================================================================
// CONVENIENCE FIRE-AND-FORGET FUNCTION
// ============================================================================

/**
 * Fire-and-forget shadow analysis.
 *
 * Usage in integration points:
 *   import { runShadowAnalysis } from '@/core/analysis/shadow/computationalShadowRunner';
 *
 *   // After LLM scoring completes:
 *   runShadowAnalysis({
 *     text: essayText,
 *     workshopType: 'activity',
 *     llmScores: { voice_integrity: 7.2, ... },
 *     llmNqi: 65,
 *   });
 *
 * Returns void. Never throws. Never blocks.
 */
export function runShadowAnalysis(input: ShadowRunInput): void {
  // Fire-and-forget: call .run() but don't await, and catch any rejections
  computationalShadowRunner.run(input).catch(() => {
    // Intentionally empty — run() already handles all errors internally.
    // This catch is here purely to prevent unhandled promise rejection warnings.
  });
}
