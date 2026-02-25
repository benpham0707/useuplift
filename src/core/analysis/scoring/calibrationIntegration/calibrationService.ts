/**
 * Calibration Service — The Main Integration Point
 *
 * This is the primary service that plugs the Scoring Science module
 * into the existing scoring pipelines. It sits between raw LLM scores
 * and the final report, applying Bayesian calibration with full safety
 * guardrails, gradual ramp control, and monitoring.
 *
 * INTEGRATION POINTS:
 *
 * 1. engine.ts (essay analysis):
 *    After scoreAllCategories() and before NQI calculation.
 *    Call: calibrationService.calibrateEssayScores(rawScoresMap, features, ...)
 *
 * 2. scoringOrchestrator.ts (activity workshop):
 *    After individual scoring and before portfolio scoring.
 *    Call: calibrationService.calibrateActivityScores(scores, ...)
 *
 * USAGE:
 *
 *   import { calibrationService } from './calibrationIntegration';
 *
 *   // In engine.ts, after building scoresMap:
 *   const calibrationResult = calibrationService.calibrate(
 *     scoresMap,
 *     'experience_rubric',
 *     RUBRIC_WEIGHTS,
 *     { computationalSignals, wordCount, activityCategory }
 *   );
 *
 *   // Use calibrationResult.effectiveScores for NQI calculation
 *   // Store calibrationResult for auditing
 *
 * INVARIANTS:
 * - Raw scores are NEVER modified in place
 * - Effective scores always within safety bounds
 * - Full audit trail in CalibrationApplicationResult
 * - Shadow mode logs everything but changes nothing
 */

import {
  CalibrationLevel,
  WorkshopType,
  CalibrationApplicationResult,
  CalibrationObservation,
  WritingQualityEngineConfig,
  DEFAULT_ENGINE_CONFIG,
} from './types';

import {
  runScoringPipeline,
  ScoringPipelineConfig,
  DEFAULT_EXPERIENCE_CONFIG,
  DEFAULT_ESSAY_CONFIG,
} from '../scoringScience/scoringSciencePipeline';

import { ComputationalSignals } from '../scoringScience/bayesianUpdating';
import { ScoringCalibratedResult } from '../scoringScience/types';

import { applySafetyGuardrails, isCalibrationEnabled } from './safetyGuardrails';
import { CalibrationRampManager, calibrationRamp } from './calibrationRamp';
import { CalibrationMonitoringService, calibrationMonitoring } from './monitoringService';

// ============================================================================
// CALIBRATION SERVICE
// ============================================================================

export class CalibrationService {
  private config: WritingQualityEngineConfig;
  private rampManager: CalibrationRampManager;
  private monitoring: CalibrationMonitoringService;

  constructor(
    config?: WritingQualityEngineConfig,
    rampManager?: CalibrationRampManager,
    monitoring?: CalibrationMonitoringService
  ) {
    this.config = config ?? DEFAULT_ENGINE_CONFIG;
    this.rampManager = rampManager ?? calibrationRamp;
    this.monitoring = monitoring ?? calibrationMonitoring;
  }

  /**
   * Apply score calibration to a set of raw dimension scores.
   *
   * This is the main entry point. It:
   * 1. Checks if calibration is enabled (feature flags, env, user)
   * 2. Runs the scoring science pipeline
   * 3. Applies safety guardrails
   * 4. Records the observation for monitoring
   * 5. Returns both raw and effective scores
   *
   * @param rawScores - Raw dimension scores from LLM (0-10)
   * @param workshopType - Type of workshop being scored
   * @param weights - Dimension weights for QI calculation
   * @param context - Optional context for Bayesian priors
   * @param userId - Optional user ID for per-user feature flags
   * @returns Calibration result with effective scores to use
   */
  calibrate(
    rawScores: Record<string, number>,
    workshopType: WorkshopType,
    weights: Record<string, number>,
    context?: {
      computationalSignals?: ComputationalSignals;
      wordCount?: number;
      activityCategory?: string;
      llmConfidences?: Record<string, number>;
    },
    userId?: string
  ): CalibrationApplicationResult {
    const timestamp = new Date().toISOString();
    const level = this.rampManager.getCurrentLevel();

    // Check if calibration is enabled
    const enabled = isCalibrationEnabled(
      this.config.featureFlags,
      workshopType,
      userId
    );

    // Determine rubric type from workshop type
    const rubricType = this.workshopToRubricType(workshopType);

    // Run the scoring science pipeline (even in shadow mode for logging)
    const pipelineConfig = this.buildPipelineConfig(
      rubricType,
      weights,
      level,
      context
    );

    const scienceResult = runScoringPipeline(rawScores, pipelineConfig);

    // Extract proposed calibrated scores
    const proposedScores: Record<string, number> = {};
    for (const [dim, calibrated] of Object.entries(scienceResult.calibrated_scores)) {
      proposedScores[dim] = calibrated.value;
    }

    // Apply safety guardrails
    const { clampedScores, safetyCheck } = applySafetyGuardrails(
      rawScores,
      proposedScores,
      level,
      workshopType,
      weights
    );

    // Determine effective scores
    const effectiveScores = (enabled && level > CalibrationLevel.SHADOW && !safetyCheck.blocked)
      ? clampedScores
      : { ...rawScores };

    // Compute adjustments
    const adjustments: Record<string, number> = {};
    for (const [dim, raw] of Object.entries(rawScores)) {
      adjustments[dim] = Math.round((effectiveScores[dim] - raw) * 100) / 100;
    }

    // Compute QI values
    const rawQI = this.computeQI(rawScores, weights);
    const calibratedQI = this.computeQI(effectiveScores, weights);
    const qiAdjustment = Math.round((calibratedQI - rawQI) * 10) / 10;

    // Determine if any adjustments were clamped
    const clampedDimensions = safetyCheck.dimensionClamping.map(c => c.dimension);

    // Build result
    const result: CalibrationApplicationResult = {
      calibrationApplied: enabled && level > CalibrationLevel.SHADOW && !safetyCheck.blocked,
      calibrationLevel: level,
      rawScores: { ...rawScores },
      calibratedScores: effectiveScores,
      adjustments,
      rawQI,
      calibratedQI,
      qiAdjustment,
      scienceResult,
      safetyCheck,
      adjustmentsClamped: clampedDimensions.length > 0 || safetyCheck.qiClamped || safetyCheck.totalAdjustmentClamped,
      clampedDimensions,
      timestamp,
      workshopType,
    };

    // Record observation for monitoring and ramp advancement
    const observation: CalibrationObservation = {
      timestamp,
      workshopType,
      level,
      adjustments,
      qiAdjustment,
      safetyTriggered: !safetyCheck.passed,
      constraintViolations: scienceResult.constraint_check.violations_found,
      reliability: scienceResult.reliability.assessment,
    };

    this.rampManager.recordObservation(observation);

    // Run monitoring checks
    if (this.config.featureFlags.monitoringEnabled) {
      const alerts = this.monitoring.recordAndCheck(observation, this.rampManager);
      if (alerts.length > 0) {
        for (const alert of alerts) {
          console.warn(`[CalibrationService] Alert [${alert.severity}]: ${alert.message}`);
        }
      }
    }

    // Log shadow results if applicable
    if (!result.calibrationApplied && this.config.featureFlags.shadowLoggingEnabled) {
      this.logShadowResult(result);
    }

    return result;
  }

  /**
   * Convenience method for essay analysis (engine.ts).
   * Maps the engine's score format to calibration input.
   */
  calibrateEssayScores(
    scoresMap: Record<string, number>,
    weights: Record<string, number>,
    context?: {
      computationalSignals?: ComputationalSignals;
      wordCount?: number;
      activityCategory?: string;
    }
  ): CalibrationApplicationResult {
    return this.calibrate(scoresMap, 'experience_rubric', weights, context);
  }

  /**
   * Convenience method for Common App essay scoring.
   */
  calibrateCommonAppScores(
    scoresMap: Record<string, number>,
    weights: Record<string, number>,
    context?: {
      computationalSignals?: ComputationalSignals;
      wordCount?: number;
    }
  ): CalibrationApplicationResult {
    return this.calibrate(scoresMap, 'common_app_essay', weights, context);
  }

  /**
   * Get a human-readable summary of calibration status.
   */
  getStatus(): {
    enabled: boolean;
    level: string;
    levelNumber: number;
    essaysProcessed: number;
    canAdvance: boolean;
    advancementBlockers: string[];
    emergencyHalted: boolean;
    recentAlerts: number;
  } {
    const level = this.rampManager.getCurrentLevel();
    const { canAdvance, reasons } = this.rampManager.canAdvance();

    return {
      enabled: this.config.featureFlags.globalEnabled,
      level: CalibrationLevel[level],
      levelNumber: level,
      essaysProcessed: this.rampManager.getEssaysAtCurrentLevel(),
      canAdvance,
      advancementBlockers: reasons,
      emergencyHalted: this.rampManager.isEmergencyHalted(),
      recentAlerts: this.monitoring.getRecentAlerts(50).length,
    };
  }

  /**
   * Get monitoring metrics.
   */
  getMetrics() {
    return this.rampManager.computeMetrics(this.config.monitoringWindowSize);
  }

  /**
   * Emergency halt — disable all calibration immediately.
   */
  emergencyHalt(reason: string): void {
    this.rampManager.emergencyHalt(reason);
  }

  /**
   * Resume from emergency halt (resets to shadow mode).
   */
  resume(): void {
    this.rampManager.resumeFromHalt();
  }

  /**
   * Try to advance to the next calibration level.
   */
  tryAdvance(): { advanced: boolean; newLevel?: string; reasons?: string[] } {
    const { canAdvance, reasons } = this.rampManager.canAdvance();
    if (!canAdvance) {
      return { advanced: false, reasons };
    }

    try {
      const newLevel = this.rampManager.advance();
      return { advanced: true, newLevel: CalibrationLevel[newLevel] };
    } catch (error) {
      return {
        advanced: false,
        reasons: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(partialConfig: Partial<WritingQualityEngineConfig>): void {
    this.config = { ...this.config, ...partialConfig };
  }

  // ── Private Helpers ────────────────────────────────────────────

  private workshopToRubricType(workshopType: WorkshopType): 'experience' | 'essay' {
    switch (workshopType) {
      case 'experience_rubric':
      case 'activity_description':
      case 'activity_portfolio':
        return 'experience';
      case 'common_app_essay':
      case 'piq_essay':
      case 'narrative_workshop':
        return 'essay';
      default:
        return 'experience';
    }
  }

  private buildPipelineConfig(
    rubricType: 'experience' | 'essay',
    weights: Record<string, number>,
    level: CalibrationLevel,
    context?: {
      computationalSignals?: ComputationalSignals;
      wordCount?: number;
      activityCategory?: string;
      llmConfidences?: Record<string, number>;
    }
  ): ScoringPipelineConfig {
    const base = rubricType === 'essay'
      ? { ...DEFAULT_ESSAY_CONFIG }
      : { ...DEFAULT_EXPERIENCE_CONFIG };

    return {
      ...base,
      weights,
      mode: level === CalibrationLevel.SHADOW ? 'quick' : 'full',
      autoFixConstraints: level >= CalibrationLevel.FULL_WITH_AUTOFIX
        && this.config.useConstraints,
      normalizationAggressiveness: this.config.useNormalization
        ? this.config.normalizationAggressiveness
        : 0,
      wordCount: context?.wordCount,
      activityCategory: context?.activityCategory,
      computationalSignals: this.config.useBayesian
        ? context?.computationalSignals
        : undefined,
      llmConfidences: context?.llmConfidences,
    };
  }

  private computeQI(
    scores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dim, score] of Object.entries(scores)) {
      const w = weights[dim] ?? 0;
      weightedSum += score * w;
      totalWeight += w;
    }

    return totalWeight > 0
      ? Math.round(weightedSum / totalWeight * 10 * 10) / 10
      : 0;
  }

  private logShadowResult(result: CalibrationApplicationResult): void {
    // In production, this would log to a structured logging service or database.
    // For now, log to console at debug level.
    const nonZeroAdj = Object.entries(result.adjustments)
      .filter(([, v]) => Math.abs(v) > 0.01)
      .map(([dim, v]) => `${dim}:${v > 0 ? '+' : ''}${v.toFixed(2)}`)
      .join(', ');

    if (nonZeroAdj) {
      console.log(
        `[CalibrationShadow] ` +
        `Workshop=${result.workshopType}, ` +
        `QI: ${result.rawQI} → ${result.calibratedQI} (${result.qiAdjustment > 0 ? '+' : ''}${result.qiAdjustment}), ` +
        `Adjustments: ${nonZeroAdj}`
      );
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

/** Global calibration service instance */
export const calibrationService = new CalibrationService();
