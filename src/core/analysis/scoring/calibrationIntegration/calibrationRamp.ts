/**
 * Calibration Ramp — Gradual Calibration Level Progression
 *
 * Manages the progression from shadow-only (Level 0) to full calibration
 * with auto-fix (Level 4). Each level has strict advancement criteria
 * that must be met before progressing.
 *
 * The ramp is a one-way escalator with an emergency stop: it can only
 * advance one level at a time, but can revert to Level 0 instantly.
 *
 * STATE MANAGEMENT:
 * - In production, ramp state would be persisted to the database.
 * - For now, it's held in memory with a JSON serialization method
 *   for file-based persistence.
 */

import {
  CalibrationLevel,
  LevelAdvancementCriteria,
  CalibrationObservation,
  CalibrationMonitoringMetrics,
  LEVEL_ADVANCEMENT_CRITERIA,
} from './types';

// ============================================================================
// RAMP STATE
// ============================================================================

/**
 * Serializable state of the calibration ramp.
 */
export interface CalibrationRampState {
  /** Current calibration level */
  currentLevel: CalibrationLevel;

  /** Timestamp when we entered the current level */
  currentLevelEnteredAt: string;

  /** Number of essays processed at the current level */
  essaysAtCurrentLevel: number;

  /** Running observations at current level (for advancement checks) */
  observations: CalibrationObservation[];

  /** History of level changes */
  levelHistory: Array<{
    fromLevel: CalibrationLevel;
    toLevel: CalibrationLevel;
    timestamp: string;
    reason: string;
  }>;

  /** Whether the ramp has been emergency-halted */
  emergencyHalted: boolean;

  /** Reason for emergency halt */
  emergencyHaltReason?: string;
}

/**
 * Initial ramp state — starts at shadow mode.
 */
export function createInitialRampState(): CalibrationRampState {
  return {
    currentLevel: CalibrationLevel.SHADOW,
    currentLevelEnteredAt: new Date().toISOString(),
    essaysAtCurrentLevel: 0,
    observations: [],
    levelHistory: [],
    emergencyHalted: false,
  };
}

// ============================================================================
// RAMP MANAGER
// ============================================================================

/**
 * Manages the calibration ramp lifecycle.
 *
 * Thread-safety note: In a multi-process environment, ramp state
 * should be persisted to a shared store (Redis, database) with
 * optimistic concurrency control. This implementation is single-process.
 */
export class CalibrationRampManager {
  private state: CalibrationRampState;
  private criteria: Record<CalibrationLevel, LevelAdvancementCriteria>;

  constructor(
    initialState?: CalibrationRampState,
    criteria?: Record<CalibrationLevel, LevelAdvancementCriteria>
  ) {
    this.state = initialState ?? createInitialRampState();
    this.criteria = criteria ?? LEVEL_ADVANCEMENT_CRITERIA;
  }

  // ── Getters ────────────────────────────────────────────────────

  getCurrentLevel(): CalibrationLevel {
    if (this.state.emergencyHalted) {
      return CalibrationLevel.SHADOW;
    }
    return this.state.currentLevel;
  }

  getState(): Readonly<CalibrationRampState> {
    return this.state;
  }

  getEssaysAtCurrentLevel(): number {
    return this.state.essaysAtCurrentLevel;
  }

  isEmergencyHalted(): boolean {
    return this.state.emergencyHalted;
  }

  // ── Recording Observations ─────────────────────────────────────

  /**
   * Record a calibration observation.
   * Called after every calibration (including shadow mode).
   */
  recordObservation(observation: CalibrationObservation): void {
    this.state.observations.push(observation);
    this.state.essaysAtCurrentLevel++;

    // Keep observation window bounded (last 1000)
    if (this.state.observations.length > 1000) {
      this.state.observations = this.state.observations.slice(-1000);
    }
  }

  // ── Level Advancement ──────────────────────────────────────────

  /**
   * Check if the criteria for advancing to the next level are met.
   * Does NOT advance — just checks.
   */
  canAdvance(): { canAdvance: boolean; reasons: string[] } {
    if (this.state.emergencyHalted) {
      return { canAdvance: false, reasons: ['Emergency halt active'] };
    }

    const currentLevel = this.state.currentLevel;
    const nextLevel = currentLevel + 1;

    if (nextLevel > CalibrationLevel.FULL_WITH_AUTOFIX) {
      return { canAdvance: false, reasons: ['Already at maximum level'] };
    }

    const nextCriteria = this.criteria[nextLevel as CalibrationLevel];
    const reasons: string[] = [];

    // Check minimum essays
    if (this.state.essaysAtCurrentLevel < nextCriteria.minEssaysAtCurrentLevel) {
      reasons.push(
        `Need ${nextCriteria.minEssaysAtCurrentLevel} essays at current level, ` +
        `have ${this.state.essaysAtCurrentLevel}`
      );
    }

    // Check minimum days
    const daysSinceEntry = this.daysSinceLevelEntry();
    if (daysSinceEntry < nextCriteria.minDaysAtCurrentLevel) {
      reasons.push(
        `Need ${nextCriteria.minDaysAtCurrentLevel} days at current level, ` +
        `been ${daysSinceEntry.toFixed(1)} days`
      );
    }

    // Check QI correlation (need enough observations)
    if (this.state.observations.length >= 20) {
      const correlation = this.computeQICorrelation();
      if (correlation < nextCriteria.minQICorrelation) {
        reasons.push(
          `QI correlation ${correlation.toFixed(3)} below threshold ${nextCriteria.minQICorrelation}`
        );
      }
    }

    // Check mean absolute adjustment
    if (this.state.observations.length >= 10) {
      const meanAbsAdj = this.computeMeanAbsAdjustment();
      if (meanAbsAdj > nextCriteria.maxMeanAbsAdjustment) {
        reasons.push(
          `Mean abs adjustment ${meanAbsAdj.toFixed(3)} exceeds max ${nextCriteria.maxMeanAbsAdjustment}`
        );
      }
    }

    // Check constraint violations
    const recentViolations = this.state.observations
      .slice(-50)
      .filter(o => o.constraintViolations > 0 && o.reliability === 'low')
      .length;
    if (recentViolations > nextCriteria.maxSpuriousConstraintViolations) {
      reasons.push(
        `${recentViolations} suspicious constraint violations (max ${nextCriteria.maxSpuriousConstraintViolations})`
      );
    }

    return {
      canAdvance: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Advance to the next calibration level.
   * Throws if criteria are not met.
   */
  advance(forceReason?: string): CalibrationLevel {
    if (!forceReason) {
      const { canAdvance, reasons } = this.canAdvance();
      if (!canAdvance) {
        throw new Error(
          `Cannot advance: ${reasons.join('; ')}`
        );
      }
    }

    const previousLevel = this.state.currentLevel;
    const newLevel = (previousLevel + 1) as CalibrationLevel;

    if (newLevel > CalibrationLevel.FULL_WITH_AUTOFIX) {
      throw new Error('Already at maximum calibration level');
    }

    this.state.levelHistory.push({
      fromLevel: previousLevel,
      toLevel: newLevel,
      timestamp: new Date().toISOString(),
      reason: forceReason ?? 'Criteria met for advancement',
    });

    this.state.currentLevel = newLevel;
    this.state.currentLevelEnteredAt = new Date().toISOString();
    this.state.essaysAtCurrentLevel = 0;
    // Keep observations for historical tracking, but reset the counter

    console.log(
      `[CalibrationRamp] Advanced from ${CalibrationLevel[previousLevel]} to ${CalibrationLevel[newLevel]}`
    );

    return newLevel;
  }

  // ── Emergency Controls ─────────────────────────────────────────

  /**
   * Emergency halt — immediately revert to shadow mode.
   * All calibration stops until manually re-enabled.
   */
  emergencyHalt(reason: string): void {
    console.error(`[CalibrationRamp] EMERGENCY HALT: ${reason}`);

    this.state.levelHistory.push({
      fromLevel: this.state.currentLevel,
      toLevel: CalibrationLevel.SHADOW,
      timestamp: new Date().toISOString(),
      reason: `EMERGENCY HALT: ${reason}`,
    });

    this.state.emergencyHalted = true;
    this.state.emergencyHaltReason = reason;
    this.state.currentLevel = CalibrationLevel.SHADOW;
    this.state.currentLevelEnteredAt = new Date().toISOString();
    this.state.essaysAtCurrentLevel = 0;
  }

  /**
   * Resume from emergency halt.
   * Resets to shadow mode (Level 0) — must re-earn advancement.
   */
  resumeFromHalt(): void {
    if (!this.state.emergencyHalted) {
      console.warn('[CalibrationRamp] resumeFromHalt called but not halted');
      return;
    }

    console.log('[CalibrationRamp] Resuming from emergency halt');

    this.state.emergencyHalted = false;
    this.state.emergencyHaltReason = undefined;
    this.state.currentLevel = CalibrationLevel.SHADOW;
    this.state.currentLevelEnteredAt = new Date().toISOString();
    this.state.essaysAtCurrentLevel = 0;
    this.state.observations = [];

    this.state.levelHistory.push({
      fromLevel: CalibrationLevel.SHADOW,
      toLevel: CalibrationLevel.SHADOW,
      timestamp: new Date().toISOString(),
      reason: 'Resumed from emergency halt (reset to shadow)',
    });
  }

  /**
   * Revert to a specific level (non-emergency).
   * Used when monitoring detects degradation.
   */
  revertToLevel(targetLevel: CalibrationLevel, reason: string): void {
    if (targetLevel >= this.state.currentLevel) {
      console.warn('[CalibrationRamp] Revert target must be below current level');
      return;
    }

    console.warn(
      `[CalibrationRamp] Reverting from ${CalibrationLevel[this.state.currentLevel]} ` +
      `to ${CalibrationLevel[targetLevel]}: ${reason}`
    );

    this.state.levelHistory.push({
      fromLevel: this.state.currentLevel,
      toLevel: targetLevel,
      timestamp: new Date().toISOString(),
      reason: `REVERT: ${reason}`,
    });

    this.state.currentLevel = targetLevel;
    this.state.currentLevelEnteredAt = new Date().toISOString();
    this.state.essaysAtCurrentLevel = 0;
  }

  // ── Metrics & Analysis ─────────────────────────────────────────

  /**
   * Compute monitoring metrics from current observations.
   */
  computeMetrics(windowSize?: number): CalibrationMonitoringMetrics {
    const window = windowSize ?? 100;
    const recentObs = this.state.observations.slice(-window);

    if (recentObs.length === 0) {
      return this.emptyMetrics();
    }

    // Mean absolute adjustment per dimension
    const dimAdjustments: Record<string, number[]> = {};
    const qiAdjustments: number[] = [];

    for (const obs of recentObs) {
      for (const [dim, adj] of Object.entries(obs.adjustments)) {
        if (!dimAdjustments[dim]) dimAdjustments[dim] = [];
        dimAdjustments[dim].push(Math.abs(adj));
      }
      qiAdjustments.push(obs.qiAdjustment);
    }

    const meanAbsAdjByDim: Record<string, number> = {};
    let totalMeanAbsAdj = 0;
    let dimCount = 0;
    for (const [dim, values] of Object.entries(dimAdjustments)) {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      meanAbsAdjByDim[dim] = Math.round(mean * 1000) / 1000;
      totalMeanAbsAdj += mean;
      dimCount++;
    }

    const overallMeanAbsAdj = dimCount > 0 ? totalMeanAbsAdj / dimCount : 0;

    // Adjustment standard deviation
    const allAdjMags = Object.values(dimAdjustments).flat();
    const adjMean = allAdjMags.reduce((s, v) => s + v, 0) / Math.max(allAdjMags.length, 1);
    const adjVariance = allAdjMags.reduce((s, v) => s + (v - adjMean) ** 2, 0) / Math.max(allAdjMags.length, 1);
    const adjStdDev = Math.sqrt(adjVariance);

    // QI metrics
    const meanQIAdj = qiAdjustments.reduce((s, v) => s + v, 0) / qiAdjustments.length;
    const qiVariance = qiAdjustments.reduce((s, v) => s + (v - meanQIAdj) ** 2, 0) / qiAdjustments.length;
    const qiStdDev = Math.sqrt(qiVariance);

    // Safety trigger rate
    const safetyTriggers = recentObs.filter(o => o.safetyTriggered).length;
    const safetyRate = safetyTriggers / recentObs.length;

    // Constraint violations
    const meanConstraintViolations = recentObs.reduce(
      (s, o) => s + o.constraintViolations, 0
    ) / recentObs.length;

    // Level distribution
    const levelDist: Record<CalibrationLevel, number> = {
      [CalibrationLevel.SHADOW]: 0,
      [CalibrationLevel.LIGHT]: 0,
      [CalibrationLevel.MODERATE]: 0,
      [CalibrationLevel.FULL]: 0,
      [CalibrationLevel.FULL_WITH_AUTOFIX]: 0,
    };
    for (const obs of recentObs) {
      levelDist[obs.level] = (levelDist[obs.level] || 0) + 1;
    }

    // Trend detection: compare first half to second half
    const halfIdx = Math.floor(recentObs.length / 2);
    const firstHalf = recentObs.slice(0, halfIdx);
    const secondHalf = recentObs.slice(halfIdx);

    const firstHalfMeanMag = this.meanAbsAdjustmentMagnitude(firstHalf);
    const secondHalfMeanMag = this.meanAbsAdjustmentMagnitude(secondHalf);
    const magDelta = secondHalfMeanMag - firstHalfMeanMag;

    const adjustmentMagnitudeTrend: 'increasing' | 'stable' | 'decreasing' =
      magDelta > 0.05 ? 'increasing'
        : magDelta < -0.05 ? 'decreasing'
          : 'stable';

    const firstHalfMeanQI = firstHalf.reduce((s, o) => s + o.qiAdjustment, 0) / Math.max(firstHalf.length, 1);
    const secondHalfMeanQI = secondHalf.reduce((s, o) => s + o.qiAdjustment, 0) / Math.max(secondHalf.length, 1);
    const qiDelta = secondHalfMeanQI - firstHalfMeanQI;

    const qiDriftDirection: 'positive' | 'neutral' | 'negative' =
      qiDelta > 0.5 ? 'positive'
        : qiDelta < -0.5 ? 'negative'
          : 'neutral';

    return {
      observationCount: recentObs.length,
      windowStart: recentObs[0].timestamp,
      windowEnd: recentObs[recentObs.length - 1].timestamp,
      meanAbsAdjustmentByDimension: meanAbsAdjByDim,
      meanAbsAdjustment: Math.round(overallMeanAbsAdj * 1000) / 1000,
      adjustmentStdDev: Math.round(adjStdDev * 1000) / 1000,
      meanQIAdjustment: Math.round(meanQIAdj * 100) / 100,
      qiAdjustmentStdDev: Math.round(qiStdDev * 100) / 100,
      safetyTriggerRate: Math.round(safetyRate * 1000) / 1000,
      meanConstraintViolations: Math.round(meanConstraintViolations * 100) / 100,
      levelDistribution: levelDist,
      adjustmentMagnitudeTrend,
      qiDriftDirection,
    };
  }

  // ── Serialization ──────────────────────────────────────────────

  /**
   * Serialize ramp state to JSON for persistence.
   */
  serialize(): string {
    return JSON.stringify(this.state, (_key, value) => {
      if (value instanceof Set) return [...value];
      return value;
    }, 2);
  }

  /**
   * Deserialize ramp state from JSON.
   */
  static deserialize(json: string): CalibrationRampManager {
    const state = JSON.parse(json) as CalibrationRampState;
    return new CalibrationRampManager(state);
  }

  // ── Private Helpers ────────────────────────────────────────────

  private daysSinceLevelEntry(): number {
    const entryDate = new Date(this.state.currentLevelEnteredAt);
    const now = new Date();
    return (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Compute Pearson correlation between raw QI and calibrated QI.
   * Uses the observations' adjustments to reconstruct raw vs calibrated.
   */
  private computeQICorrelation(): number {
    const observations = this.state.observations.slice(-200);
    if (observations.length < 10) return 1.0; // Assume perfect correlation with few data points

    // We use qiAdjustment to reconstruct: rawQI and calibratedQI = rawQI + qiAdjustment
    // Since we only have qiAdjustment, we compute correlation differently.
    // If adjustments are always small and consistent, correlation is high.
    // We approximate as: 1 - (variance of adjustments / variance of estimated QI)

    const adjustments = observations.map(o => o.qiAdjustment);
    const meanAdj = adjustments.reduce((s, v) => s + v, 0) / adjustments.length;
    const adjVariance = adjustments.reduce((s, v) => s + (v - meanAdj) ** 2, 0) / adjustments.length;

    // Estimate QI variance from adjustments (assume ~200 variance for QI across typical essays)
    const estimatedQIVariance = 200;
    const approxCorrelation = Math.max(0, 1 - adjVariance / estimatedQIVariance);

    return Math.round(approxCorrelation * 1000) / 1000;
  }

  private computeMeanAbsAdjustment(): number {
    const recent = this.state.observations.slice(-50);
    if (recent.length === 0) return 0;

    const allAdjs = recent.flatMap(o => Object.values(o.adjustments).map(Math.abs));
    return allAdjs.length > 0
      ? allAdjs.reduce((s, v) => s + v, 0) / allAdjs.length
      : 0;
  }

  private meanAbsAdjustmentMagnitude(observations: CalibrationObservation[]): number {
    if (observations.length === 0) return 0;
    const allAdjs = observations.flatMap(o => Object.values(o.adjustments).map(Math.abs));
    return allAdjs.length > 0
      ? allAdjs.reduce((s, v) => s + v, 0) / allAdjs.length
      : 0;
  }

  private emptyMetrics(): CalibrationMonitoringMetrics {
    const now = new Date().toISOString();
    return {
      observationCount: 0,
      windowStart: now,
      windowEnd: now,
      meanAbsAdjustmentByDimension: {},
      meanAbsAdjustment: 0,
      adjustmentStdDev: 0,
      meanQIAdjustment: 0,
      qiAdjustmentStdDev: 0,
      safetyTriggerRate: 0,
      meanConstraintViolations: 0,
      levelDistribution: {
        [CalibrationLevel.SHADOW]: 0,
        [CalibrationLevel.LIGHT]: 0,
        [CalibrationLevel.MODERATE]: 0,
        [CalibrationLevel.FULL]: 0,
        [CalibrationLevel.FULL_WITH_AUTOFIX]: 0,
      },
      adjustmentMagnitudeTrend: 'stable',
      qiDriftDirection: 'neutral',
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/** Global ramp manager instance */
export const calibrationRamp = new CalibrationRampManager();
