/**
 * Calibration Integration Module
 *
 * Phase 3 of the Writing Quality Engine — Score Calibration.
 * Plugs the Scoring Science psychometric pipeline into the existing
 * scoring infrastructure with full safety guardrails and gradual ramp.
 *
 * QUICK START:
 *
 *   import { calibrationService } from './calibrationIntegration';
 *
 *   // After LLM scoring, before NQI/QI calculation:
 *   const result = calibrationService.calibrate(
 *     rawScores,        // { voice_integrity: 6.5, ... }
 *     'experience_rubric',
 *     RUBRIC_WEIGHTS,
 *     { computationalSignals, wordCount }
 *   );
 *
 *   // Use result.calibratedScores for downstream calculations
 *   // result.rawScores preserved for auditing
 *
 * MODULE ARCHITECTURE:
 *
 *   types.ts               — All type definitions & master config
 *   calibrationService.ts  — Main integration service (entry point)
 *   safetyGuardrails.ts    — Hard limits on score adjustments
 *   calibrationRamp.ts     — Gradual level progression (0→4)
 *   monitoringService.ts   — Drift detection & alerting
 *   preScreeningService.ts — Phase 4 preview: skip LLM for confident cases
 *
 * SAFETY LAYERS (defense in depth):
 *
 *   Layer 1: Feature flags (global, per-workshop, per-user)
 *   Layer 2: Environment variable kill switch (DISABLE_SCORE_CALIBRATION)
 *   Layer 3: Calibration level caps (Level 0-4 have increasing limits)
 *   Layer 4: Per-workshop safety limits (workshop-specific bounds)
 *   Layer 5: Per-dimension clamping (absolute max adjustment)
 *   Layer 6: QI change clamping (absolute max QI delta)
 *   Layer 7: Total adjustment clamping (sum of all dimension changes)
 *   Layer 8: Divergence blocking (extreme proposals are rejected entirely)
 *   Layer 9: Monitoring auto-regression (critical alerts revert level)
 *   Layer 10: Emergency halt (instant revert to shadow mode)
 */

// ── Types ──────────────────────────────────────────────────────
export type {
  WritingQualityEngineConfig,
  CalibrationApplicationResult,
  SafetyCheckResult,
  CalibrationObservation,
  CalibrationMonitoringMetrics,
  CalibrationAlert,
  CalibrationFeatureFlags,
  WorkshopType,
  WorkshopSafetyLimits,
  LevelAdvancementCriteria,
  PreScreenDecision,
} from './types';

export {
  CalibrationLevel,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_FEATURE_FLAGS,
  WORKSHOP_SAFETY_LIMITS,
  LEVEL_ADVANCEMENT_CRITERIA,
} from './types';

// ── Calibration Service (main entry point) ───────────────────
export { CalibrationService, calibrationService } from './calibrationService';

// ── Safety Guardrails ────────────────────────────────────────
export { applySafetyGuardrails, isCalibrationEnabled } from './safetyGuardrails';

// ── Calibration Ramp ─────────────────────────────────────────
export {
  CalibrationRampManager,
  calibrationRamp,
  createInitialRampState,
} from './calibrationRamp';
export type { CalibrationRampState } from './calibrationRamp';

// ── Monitoring ───────────────────────────────────────────────
export { CalibrationMonitoringService, calibrationMonitoring } from './monitoringService';

// ── Pre-Screening (Phase 4) ──────────────────────────────────
export {
  shouldSkipLLM,
  shouldSkipLLMCompat,
  estimateMonthlySavings,
} from './preScreeningService';
