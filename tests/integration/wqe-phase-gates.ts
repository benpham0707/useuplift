/**
 * WritingQualityEngine — Progressive Validation Gates
 *
 * Defines go/no-go criteria for each phase transition and validates
 * whether a given regression report meets the gate requirements.
 *
 * Usage:
 *   npx tsx tests/integration/wqe-phase-gates.ts --report=PATH
 *
 * Or programmatically:
 *   import { validatePhaseGate } from './wqe-phase-gates';
 *   const result = validatePhaseGate(report, 'enrichment');
 *
 * Phase transitions and their gates:
 *
 *   baseline -> shadow
 *     GATE: Zero output change. Only timing/logging overhead allowed.
 *     Rationale: Shadow mode is observation-only. If outputs change,
 *     something is wired wrong.
 *
 *   shadow -> enrichment
 *     GATE: NQI drift <= 5%, dimension drift <= 1.5pt, timing +100ms max.
 *     Rationale: Injecting computational context into prompts will nudge
 *     LLM behavior. Small shifts are expected and healthy.
 *
 *   enrichment -> calibration
 *     GATE: NQI drift <= 8%, dimension drift <= 2.0pt, no new critical flags.
 *     Rationale: Bayesian updating adjusts scores post-LLM. Moderate shifts
 *     expected as we calibrate LLM tendency toward score compression.
 *
 *   calibration -> pre_screening
 *     GATE: NQI drift <= 12% for pre-screened, <= 5% for non-pre-screened.
 *     Must maintain accuracy on ai_generated and register_inconsistent essays.
 *     Rationale: Skipping LLM is aggressive. We need high confidence.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  IntegrationPhase,
  RegressionReport,
  RegressionFinding,
  PHASE_THRESHOLDS,
  EssayArchetype,
} from './wqe-types';

// ============================================================================
// PHASE GATE DEFINITIONS
// ============================================================================

interface PhaseGateResult {
  /** The phase being validated */
  phase: IntegrationPhase;

  /** Overall gate status */
  passed: boolean;

  /** Individual gate checks */
  checks: PhaseGateCheck[];

  /** Human-readable summary */
  summary: string;

  /** Minimum additional runs needed (0 if sufficient) */
  additional_runs_needed: number;
}

interface PhaseGateCheck {
  name: string;
  description: string;
  passed: boolean;
  actual_value: string;
  required_value: string;
  severity: 'blocker' | 'warning' | 'info';
}

// ============================================================================
// GATE VALIDATORS
// ============================================================================

/**
 * Validate whether a regression report meets the gate criteria for a phase.
 */
export function validatePhaseGate(
  report: RegressionReport,
  targetPhase: IntegrationPhase,
): PhaseGateResult {
  const thresholds = PHASE_THRESHOLDS[targetPhase];
  const checks: PhaseGateCheck[] = [];

  // --- 1. Statistical confidence (enough runs?) ---
  const runsNeeded = thresholds.minRunsForConfidence;
  const runsPerEssay = report.statistics.runs_per_essay;
  checks.push({
    name: 'statistical_confidence',
    description: `Minimum ${runsNeeded} runs per essay for statistical confidence`,
    passed: runsPerEssay >= runsNeeded,
    actual_value: `${runsPerEssay} runs/essay`,
    required_value: `>= ${runsNeeded} runs/essay`,
    severity: runsPerEssay >= runsNeeded ? 'info' : 'blocker',
  });

  // --- 2. NQI drift within bounds ---
  checks.push({
    name: 'nqi_drift_mean',
    description: `Mean NQI drift must be <= ${thresholds.maxQIDriftPercent}%`,
    passed: report.statistics.mean_nqi_delta <= thresholds.maxQIDriftPercent,
    actual_value: `${report.statistics.mean_nqi_delta.toFixed(2)}%`,
    required_value: `<= ${thresholds.maxQIDriftPercent}%`,
    severity: report.statistics.mean_nqi_delta <= thresholds.maxQIDriftPercent ? 'info' : 'blocker',
  });

  checks.push({
    name: 'nqi_drift_max',
    description: `Max NQI drift must be <= ${thresholds.maxQIDriftPercent * 1.5}% (1.5x mean threshold)`,
    passed: report.statistics.max_nqi_delta <= thresholds.maxQIDriftPercent * 1.5,
    actual_value: `${report.statistics.max_nqi_delta.toFixed(2)}%`,
    required_value: `<= ${(thresholds.maxQIDriftPercent * 1.5).toFixed(1)}%`,
    severity: report.statistics.max_nqi_delta <= thresholds.maxQIDriftPercent * 1.5 ? 'info' : 'blocker',
  });

  // --- 3. Dimension drift within bounds ---
  const dimExceeding = report.statistics.dimensions_exceeding_threshold;
  checks.push({
    name: 'dimension_drift',
    description: `No dimension should drift more than ${thresholds.maxDimensionDriftPoints} points`,
    passed: dimExceeding.length === 0,
    actual_value: dimExceeding.length === 0 ? 'all within bounds' : `${dimExceeding.join(', ')} exceeded`,
    required_value: `all <= ${thresholds.maxDimensionDriftPoints} points`,
    severity: dimExceeding.length === 0 ? 'info' : dimExceeding.length <= 2 ? 'warning' : 'blocker',
  });

  // --- 4. No critical regressions ---
  const criticalCount = report.blockers.length;
  checks.push({
    name: 'no_critical_regressions',
    description: 'No critical (blocker) regressions detected',
    passed: criticalCount === 0,
    actual_value: `${criticalCount} critical findings`,
    required_value: '0 critical findings',
    severity: criticalCount === 0 ? 'info' : 'blocker',
  });

  // --- 5. Edge case safety ---
  const edgeCaseFailures = report.findings.filter(
    f => f.category === 'edge_case_failure' && f.exceeds_threshold
  );
  checks.push({
    name: 'edge_case_safety',
    description: 'All edge cases (short, unicode, empty) must still work',
    passed: edgeCaseFailures.length === 0,
    actual_value: edgeCaseFailures.length === 0 ? 'all passing' : `${edgeCaseFailures.length} failures`,
    required_value: '0 failures',
    severity: edgeCaseFailures.length === 0 ? 'info' : 'blocker',
  });

  // --- 6. Cost within expected range ---
  const [minCost, maxCost] = thresholds.expectedCostChangePercent;
  const costChange = report.statistics.cost_change_percent;
  const costInRange = costChange >= minCost && costChange <= maxCost;
  checks.push({
    name: 'cost_within_range',
    description: `Cost change should be between ${minCost}% and ${maxCost}%`,
    passed: costInRange,
    actual_value: `${costChange.toFixed(1)}%`,
    required_value: `${minCost}% to ${maxCost}%`,
    severity: costInRange ? 'info' : 'warning',
  });

  // --- 7. Timing within budget ---
  const timingOk = thresholds.maxTimingOverheadMs < 0
    ? report.statistics.mean_timing_delta_ms < 0  // Pre-screening should be faster
    : report.statistics.mean_timing_delta_ms <= thresholds.maxTimingOverheadMs;
  checks.push({
    name: 'timing_budget',
    description: thresholds.maxTimingOverheadMs < 0
      ? 'Pipeline should be faster than baseline'
      : `Timing overhead must be <= ${thresholds.maxTimingOverheadMs}ms`,
    passed: timingOk,
    actual_value: `${report.statistics.mean_timing_delta_ms >= 0 ? '+' : ''}${report.statistics.mean_timing_delta_ms}ms`,
    required_value: thresholds.maxTimingOverheadMs < 0
      ? 'negative delta (faster)'
      : `<= +${thresholds.maxTimingOverheadMs}ms`,
    severity: timingOk ? 'info' : 'warning',
  });

  // --- Phase-specific gates ---

  // Shadow: ZERO output change
  if (targetPhase === 'shadow') {
    const anyScoreChange = report.findings.some(
      f => f.category === 'score_drift' && f.delta > 0.01
    );
    checks.push({
      name: 'shadow_zero_change',
      description: 'Shadow mode must not change any output scores',
      passed: !anyScoreChange,
      actual_value: anyScoreChange ? 'scores changed' : 'no change',
      required_value: 'zero change',
      severity: anyScoreChange ? 'blocker' : 'info',
    });
  }

  // Pre-screening: must still catch AI-generated essays
  if (targetPhase === 'pre_screening') {
    const aiFindings = report.findings.filter(f => f.essay_archetype === 'ai_generated');
    const aiCaught = aiFindings.some(f =>
      f.category === 'flag_change' &&
      f.description.includes('essay_voice_detected')
    ) || !aiFindings.some(f =>
      f.category === 'flag_change' &&
      f.description.includes('essay_voice_detected') &&
      f.description.includes('disappeared')
    );
    checks.push({
      name: 'pre_screen_ai_detection',
      description: 'Pre-screening must still flag AI-generated essays',
      passed: aiCaught,
      actual_value: aiCaught ? 'AI essays flagged' : 'AI essays NOT flagged',
      required_value: 'AI essays must be flagged',
      severity: aiCaught ? 'info' : 'blocker',
    });
  }

  // --- Overall verdict ---
  const hasBlockers = checks.some(c => c.severity === 'blocker' && !c.passed);
  const warningCount = checks.filter(c => c.severity === 'warning' && !c.passed).length;
  const passed = !hasBlockers && warningCount <= 2;

  // Additional runs calculation
  const additionalRunsNeeded = Math.max(0, runsNeeded - runsPerEssay);

  // Summary
  const summaryLines: string[] = [];
  summaryLines.push(`Phase Gate: ${report.from_phase} -> ${targetPhase}`);
  summaryLines.push(`Status: ${passed ? 'PASSED' : 'FAILED'}`);
  summaryLines.push('');

  for (const check of checks) {
    const icon = check.passed ? 'PASS' : check.severity === 'blocker' ? 'FAIL' : 'WARN';
    summaryLines.push(`  [${icon}] ${check.name}: ${check.description}`);
    summaryLines.push(`         Actual: ${check.actual_value} | Required: ${check.required_value}`);
  }

  if (additionalRunsNeeded > 0) {
    summaryLines.push('');
    summaryLines.push(`  NOTE: Need ${additionalRunsNeeded} more runs per essay for statistical confidence.`);
  }

  return {
    phase: targetPhase,
    passed,
    checks,
    summary: summaryLines.join('\n'),
    additional_runs_needed: additionalRunsNeeded,
  };
}

// ============================================================================
// ROLLBACK CHECKPOINT STRATEGY
// ============================================================================

/**
 * Information about a rollback checkpoint.
 * Each phase boundary gets a checkpoint.
 */
export interface RollbackCheckpoint {
  /** Phase that was completed */
  phase: IntegrationPhase;

  /** Git tag for this checkpoint */
  git_tag: string;

  /** Feature flags to set for rollback */
  feature_flags: {
    shadow_logging: boolean;
    prompt_enrichment: boolean;
    score_calibration: boolean;
    pre_screening: boolean;
  };

  /** Golden baseline file for this checkpoint */
  baseline_file: string;

  /** Date the checkpoint was created */
  created_at: string;
}

/**
 * Generate the git tag and feature flag configuration for a rollback checkpoint.
 */
export function createCheckpointConfig(phase: IntegrationPhase): RollbackCheckpoint {
  const timestamp = new Date().toISOString().split('T')[0];

  // Feature flags by phase (cumulative)
  const flagsByPhase: Record<IntegrationPhase, RollbackCheckpoint['feature_flags']> = {
    baseline: { shadow_logging: false, prompt_enrichment: false, score_calibration: false, pre_screening: false },
    shadow: { shadow_logging: true, prompt_enrichment: false, score_calibration: false, pre_screening: false },
    enrichment: { shadow_logging: true, prompt_enrichment: true, score_calibration: false, pre_screening: false },
    calibration: { shadow_logging: true, prompt_enrichment: true, score_calibration: true, pre_screening: false },
    pre_screening: { shadow_logging: true, prompt_enrichment: true, score_calibration: true, pre_screening: true },
  };

  return {
    phase,
    git_tag: `wqe-${phase}-${timestamp}`,
    feature_flags: flagsByPhase[phase],
    baseline_file: `tests/output/wqe-baseline-${phase}-latest.json`,
    created_at: new Date().toISOString(),
  };
}

/**
 * Print rollback instructions for a given phase.
 */
export function printRollbackInstructions(checkpoint: RollbackCheckpoint): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('  ROLLBACK INSTRUCTIONS');
  lines.push('='.repeat(60));
  lines.push(`  Rolling back to: ${checkpoint.phase}`);
  lines.push('');
  lines.push('  Step 1: Set feature flags');
  lines.push(`    shadow_logging:    ${checkpoint.feature_flags.shadow_logging}`);
  lines.push(`    prompt_enrichment: ${checkpoint.feature_flags.prompt_enrichment}`);
  lines.push(`    score_calibration: ${checkpoint.feature_flags.score_calibration}`);
  lines.push(`    pre_screening:     ${checkpoint.feature_flags.pre_screening}`);
  lines.push('');
  lines.push('  Step 2: Verify with regression test');
  lines.push(`    npx tsx tests/integration/wqe-regression-detector.ts \\`);
  lines.push(`      --baseline=${checkpoint.baseline_file} \\`);
  lines.push(`      --phase=${checkpoint.phase}`);
  lines.push('');
  lines.push('  Step 3: If needed, git rollback');
  lines.push(`    git checkout ${checkpoint.git_tag}`);
  lines.push('='.repeat(60));

  return lines.join('\n');
}

// ============================================================================
// CLI: VALIDATE A SAVED REGRESSION REPORT
// ============================================================================

function parseCliArgs() {
  const args = process.argv.slice(2);
  let reportPath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--report=')) reportPath = path.resolve(arg.split('=')[1]);
  }

  return { reportPath };
}

async function main(): Promise<void> {
  const { reportPath } = parseCliArgs();

  if (!reportPath) {
    console.log('');
    console.log('WritingQualityEngine Phase Gate Validator');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx tests/integration/wqe-phase-gates.ts --report=tests/output/wqe-regression-shadow-*.json');
    console.log('');
    console.log('Or import programmatically:');
    console.log('  import { validatePhaseGate } from "./wqe-phase-gates";');
    console.log('');

    // Print threshold reference
    console.log('Phase Threshold Reference:');
    console.log('='.repeat(72));
    console.log('  Phase          | QI Drift | Dim Drift | Timing    | Cost Change | Min Runs');
    console.log('  ---------------+----------+-----------+-----------+-------------+---------');

    for (const [phase, t] of Object.entries(PHASE_THRESHOLDS)) {
      console.log(
        `  ${phase.padEnd(16)} | ${String(t.maxQIDriftPercent).padStart(6)}%  | ` +
        `${String(t.maxDimensionDriftPoints).padStart(7)}pt | ` +
        `${t.maxTimingOverheadMs < 0 ? 'faster' : '+' + t.maxTimingOverheadMs + 'ms'} `.padEnd(12) +
        `| ${t.expectedCostChangePercent[0]}% to ${t.expectedCostChangePercent[1]}%`.padEnd(14) +
        `| ${t.minRunsForConfidence}`
      );
    }
    console.log('');

    // Print rollback checkpoint info for each phase
    console.log('Rollback Checkpoints:');
    console.log('='.repeat(72));
    for (const phase of ['baseline', 'shadow', 'enrichment', 'calibration', 'pre_screening'] as IntegrationPhase[]) {
      const checkpoint = createCheckpointConfig(phase);
      console.log(`  ${phase}: git tag "${checkpoint.git_tag}", baseline: ${checkpoint.baseline_file}`);
    }
    console.log('');

    return;
  }

  // Load and validate report
  if (!fs.existsSync(reportPath)) {
    console.error(`Report not found: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as RegressionReport;
  const result = validatePhaseGate(report, report.to_phase);

  console.log(result.summary);

  if (!result.passed) {
    console.log('');
    console.log('Gate FAILED. Rollback instructions:');
    const checkpoint = createCheckpointConfig(report.from_phase);
    console.log(printRollbackInstructions(checkpoint));
    process.exit(1);
  } else {
    console.log('');
    console.log('Gate PASSED. Safe to proceed to next phase.');

    // Print checkpoint instructions for the next phase
    const checkpoint = createCheckpointConfig(report.to_phase);
    console.log('');
    console.log('Recommended: Create rollback checkpoint before continuing:');
    console.log(`  git tag ${checkpoint.git_tag}`);
    console.log(`  # Then capture new baseline:`);
    console.log(`  npx tsx tests/integration/wqe-baseline-capture.ts --phase=${report.to_phase}`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
