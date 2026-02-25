/**
 * Calibration Monitoring & Alerting Service
 *
 * Continuously monitors calibration health and generates alerts
 * when metrics drift outside acceptable bounds. This is the early
 * warning system that prevents calibration from silently degrading.
 *
 * WHAT IT MONITORS:
 * 1. Adjustment magnitude drift — are calibration changes getting larger?
 * 2. QI drift — are calibrated scores consistently higher or lower?
 * 3. Safety trigger rate — are guardrails firing too often?
 * 4. Constraint violation rate — are violations increasing?
 * 5. Reliability distribution — are we getting more "low" reliability?
 * 6. Score distribution shift — is the overall score landscape moving?
 *
 * HOW ALERTS WORK:
 * - Alerts are generated on every check (not pushed in real-time)
 * - Check frequency is configurable (default: every 10 observations)
 * - Critical alerts trigger automatic level regression
 * - Warning alerts are logged and available for dashboard display
 */

import { v4 as uuidv4 } from 'uuid';

import {
  CalibrationObservation,
  CalibrationMonitoringMetrics,
  CalibrationAlert,
  CalibrationLevel,
  WritingQualityEngineConfig,
  DEFAULT_ENGINE_CONFIG,
} from './types';

import { CalibrationRampManager } from './calibrationRamp';

// ============================================================================
// MONITORING SERVICE
// ============================================================================

export class CalibrationMonitoringService {
  private observations: CalibrationObservation[] = [];
  private alerts: CalibrationAlert[] = [];
  private config: WritingQualityEngineConfig;
  private checkInterval: number;
  private observationsSinceLastCheck: number = 0;

  constructor(
    config?: WritingQualityEngineConfig,
    checkInterval: number = 10 // Check every N observations
  ) {
    this.config = config ?? DEFAULT_ENGINE_CONFIG;
    this.checkInterval = checkInterval;
  }

  /**
   * Record an observation and trigger monitoring checks if needed.
   */
  recordAndCheck(
    observation: CalibrationObservation,
    rampManager: CalibrationRampManager
  ): CalibrationAlert[] {
    this.observations.push(observation);
    this.observationsSinceLastCheck++;

    // Keep bounded
    if (this.observations.length > 2000) {
      this.observations = this.observations.slice(-1500);
    }

    // Check at regular intervals
    if (this.observationsSinceLastCheck >= this.checkInterval) {
      this.observationsSinceLastCheck = 0;
      return this.runChecks(rampManager);
    }

    return [];
  }

  /**
   * Run all monitoring checks and generate alerts.
   */
  runChecks(rampManager: CalibrationRampManager): CalibrationAlert[] {
    const metrics = rampManager.computeMetrics(this.config.monitoringWindowSize);
    const newAlerts: CalibrationAlert[] = [];

    // Check 1: Adjustment magnitude creep
    if (metrics.meanAbsAdjustment > this.config.alertThresholds.maxMeanAbsAdjustment) {
      newAlerts.push(this.createAlert(
        metrics.meanAbsAdjustment > this.config.alertThresholds.maxMeanAbsAdjustment * 1.5
          ? 'critical' : 'warning',
        'adjustment_magnitude_creep',
        `Mean absolute adjustment (${metrics.meanAbsAdjustment.toFixed(3)}) exceeds threshold ` +
        `(${this.config.alertThresholds.maxMeanAbsAdjustment}). Calibration may be over-correcting.`,
        metrics,
        'Consider reverting calibration level or tightening safety limits.'
      ));
    }

    // Check 2: Adjustment magnitude trend
    if (metrics.adjustmentMagnitudeTrend === 'increasing' && metrics.observationCount >= 50) {
      newAlerts.push(this.createAlert(
        'warning',
        'adjustment_magnitude_creep',
        `Adjustment magnitudes are trending upward. This may indicate ` +
        `calibration drift or changing input characteristics.`,
        metrics,
        'Monitor closely. If trend continues, revert to a lower calibration level.'
      ));
    }

    // Check 3: QI drift
    if (Math.abs(metrics.meanQIAdjustment) > this.config.alertThresholds.maxQIDriftMagnitude) {
      const direction = metrics.meanQIAdjustment > 0 ? 'positive' : 'negative';
      newAlerts.push(this.createAlert(
        Math.abs(metrics.meanQIAdjustment) > this.config.alertThresholds.maxQIDriftMagnitude * 2
          ? 'critical' : 'warning',
        'qi_drift',
        `QI adjustments are systematically ${direction} (mean: ${metrics.meanQIAdjustment.toFixed(2)}). ` +
        `This suggests calibration is biased in one direction.`,
        metrics,
        direction === 'positive'
          ? 'Calibration is inflating scores. Check if computational priors are too generous.'
          : 'Calibration is deflating scores. Check if computational priors are too harsh.'
      ));
    }

    // Check 4: High safety trigger rate
    if (metrics.safetyTriggerRate > this.config.alertThresholds.maxSafetyTriggerRate) {
      newAlerts.push(this.createAlert(
        metrics.safetyTriggerRate > 0.3 ? 'critical' : 'warning',
        'high_safety_trigger_rate',
        `Safety guardrails are triggering on ${(metrics.safetyTriggerRate * 100).toFixed(1)}% ` +
        `of calibrations (threshold: ${(this.config.alertThresholds.maxSafetyTriggerRate * 100).toFixed(0)}%). ` +
        `The scoring science pipeline may be producing overly aggressive adjustments.`,
        metrics,
        'Reduce calibration level or increase safety limits if adjustments are justified.'
      ));
    }

    // Check 5: Constraint violation spike
    if (metrics.meanConstraintViolations > this.config.alertThresholds.maxMeanConstraintViolations) {
      newAlerts.push(this.createAlert(
        metrics.meanConstraintViolations > 4 ? 'critical' : 'warning',
        'constraint_violation_spike',
        `Mean constraint violations per essay (${metrics.meanConstraintViolations.toFixed(2)}) ` +
        `exceed threshold (${this.config.alertThresholds.maxMeanConstraintViolations}). ` +
        `Either the LLM scoring has changed or constraints need recalibration.`,
        metrics,
        'Review constraint definitions. If LLM scoring patterns have shifted, constraints may need updating.'
      ));
    }

    // Check 6: Low reliability rate
    const recentObs = this.observations.slice(-this.config.monitoringWindowSize);
    const lowReliabilityRate = recentObs.filter(o => o.reliability === 'low').length / Math.max(recentObs.length, 1);
    if (lowReliabilityRate > 0.2) {
      newAlerts.push(this.createAlert(
        lowReliabilityRate > 0.4 ? 'critical' : 'warning',
        'low_reliability_rate',
        `${(lowReliabilityRate * 100).toFixed(0)}% of recent calibrations have low reliability. ` +
        `Score quality may be degrading.`,
        metrics,
        'Investigate whether input quality has changed or if scoring parameters need adjustment.'
      ));
    }

    // Check 7: Auto-regression recommendation
    if (this.shouldRecommendRegression(metrics, rampManager)) {
      newAlerts.push(this.createAlert(
        'critical',
        'level_regression_recommended',
        `Multiple monitoring signals suggest calibration level should be reduced. ` +
        `Current level: ${CalibrationLevel[rampManager.getCurrentLevel()]}.`,
        metrics,
        'Recommend reverting to the previous calibration level and investigating root cause.'
      ));
    }

    // Store alerts
    this.alerts.push(...newAlerts);

    // Keep alerts bounded
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(-300);
    }

    // Auto-regress on critical alerts
    const criticalAlerts = newAlerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length >= 2) {
      const currentLevel = rampManager.getCurrentLevel();
      if (currentLevel > CalibrationLevel.SHADOW) {
        const prevLevel = (currentLevel - 1) as CalibrationLevel;
        rampManager.revertToLevel(
          prevLevel,
          `Auto-regression: ${criticalAlerts.length} critical alerts in monitoring check`
        );
        console.warn(
          `[CalibrationMonitoring] Auto-regressed to ${CalibrationLevel[prevLevel]} ` +
          `due to ${criticalAlerts.length} critical alerts`
        );
      }
    }

    return newAlerts;
  }

  /**
   * Get all alerts, optionally filtered by severity.
   */
  getAlerts(severity?: CalibrationAlert['severity']): CalibrationAlert[] {
    if (!severity) return [...this.alerts];
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Get the most recent N alerts.
   */
  getRecentAlerts(count: number = 10): CalibrationAlert[] {
    return this.alerts.slice(-count);
  }

  /**
   * Clear all alerts (after they've been reviewed).
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  // ── Private Helpers ────────────────────────────────────────────

  private createAlert(
    severity: CalibrationAlert['severity'],
    type: CalibrationAlert['type'],
    message: string,
    metrics: Partial<CalibrationMonitoringMetrics>,
    suggestedAction: string
  ): CalibrationAlert {
    return {
      id: uuidv4(),
      severity,
      type,
      message,
      metrics,
      suggestedAction,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Determine if metrics collectively suggest we should drop a level.
   */
  private shouldRecommendRegression(
    metrics: CalibrationMonitoringMetrics,
    rampManager: CalibrationRampManager
  ): boolean {
    if (rampManager.getCurrentLevel() === CalibrationLevel.SHADOW) return false;
    if (metrics.observationCount < 30) return false;

    let warningSignals = 0;

    if (metrics.meanAbsAdjustment > this.config.alertThresholds.maxMeanAbsAdjustment) warningSignals++;
    if (metrics.safetyTriggerRate > this.config.alertThresholds.maxSafetyTriggerRate) warningSignals++;
    if (metrics.adjustmentMagnitudeTrend === 'increasing') warningSignals++;
    if (metrics.qiDriftDirection !== 'neutral') warningSignals++;
    if (metrics.meanConstraintViolations > this.config.alertThresholds.maxMeanConstraintViolations) warningSignals++;

    // Recommend regression if 3+ signals fire simultaneously
    return warningSignals >= 3;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const calibrationMonitoring = new CalibrationMonitoringService();
