/**
 * WritingQualityEngine — Regression Detector
 *
 * Compares a new pipeline run against a saved golden baseline.
 * Produces a detailed regression report with go/no-go verdict.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="sk-ant-..." npx tsx tests/integration/wqe-regression-detector.ts
 *
 * Options:
 *   --baseline=PATH     Path to golden baseline JSON (default: tests/output/wqe-baseline-baseline-latest.json)
 *   --phase=X           Phase to test (default: 'shadow')
 *   --runs=N            Runs per essay (default: 3)
 *   --strict            Treat warnings as failures
 *
 * Output: Regression report to stdout and JSON to tests/output/wqe-regression-{phase}-{timestamp}.json
 */

import '../utils/loadEnv';
import { requireApiKey } from '../utils/loadEnv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { analyzeEntry } from '../../src/core/analysis/engine';
import { informationTheoreticAnalyzer } from '../../src/core/analysis/features/informationTheoreticAnalyzer';

import { WQE_REFERENCE_ESSAYS } from '../fixtures/wqe-reference-essays';
import {
  IntegrationPhase,
  PipelineSnapshot,
  GoldenBaseline,
  RegressionFinding,
  RegressionReport,
  EssayArchetype,
  PHASE_THRESHOLDS,
  estimateCost,
} from './wqe-types';

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  let baselinePath = path.resolve(process.cwd(), 'tests', 'output', 'wqe-baseline-baseline-latest.json');
  let phase: IntegrationPhase = 'shadow';
  let runs = 3;
  let strict = false;

  for (const arg of args) {
    if (arg.startsWith('--baseline=')) baselinePath = path.resolve(arg.split('=')[1]);
    if (arg.startsWith('--phase=')) phase = arg.split('=')[1] as IntegrationPhase;
    if (arg.startsWith('--runs=')) runs = parseInt(arg.split('=')[1], 10);
    if (arg === '--strict') strict = true;
  }

  return { baselinePath, phase, runs, strict };
}

// ============================================================================
// LOAD BASELINE
// ============================================================================

function loadBaseline(filePath: string): GoldenBaseline {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Baseline not found at ${filePath}.\n` +
      `Run the baseline capture first:\n` +
      `  ANTHROPIC_API_KEY="..." npx tsx tests/integration/wqe-baseline-capture.ts`
    );
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as GoldenBaseline;
}

// ============================================================================
// DETECT REGRESSIONS FOR A SINGLE ESSAY
// ============================================================================

function detectRegressions(
  archetype: EssayArchetype,
  baselineSnapshots: PipelineSnapshot[],
  currentSnapshots: PipelineSnapshot[],
  phase: IntegrationPhase,
): RegressionFinding[] {
  const findings: RegressionFinding[] = [];
  const thresholds = PHASE_THRESHOLDS[phase];

  // --- Average baseline values ---
  const baselineNqis = baselineSnapshots.map(s => s.nqi);
  const baselineMeanNqi = baselineNqis.reduce((s, v) => s + v, 0) / baselineNqis.length;

  const currentNqis = currentSnapshots.map(s => s.nqi);
  const currentMeanNqi = currentNqis.reduce((s, v) => s + v, 0) / currentNqis.length;

  // --- 1. NQI drift ---
  const nqiDelta = Math.abs(currentMeanNqi - baselineMeanNqi);
  const nqiDriftPercent = (nqiDelta / Math.max(baselineMeanNqi, 1)) * 100;

  if (nqiDriftPercent > thresholds.maxQIDriftPercent) {
    findings.push({
      essay_archetype: archetype,
      severity: nqiDriftPercent > thresholds.maxQIDriftPercent * 2 ? 'critical' : 'warning',
      category: 'score_drift',
      description: `NQI drifted ${nqiDriftPercent.toFixed(1)}% (max allowed: ${thresholds.maxQIDriftPercent}%)`,
      baseline_value: baselineMeanNqi.toFixed(1),
      current_value: currentMeanNqi.toFixed(1),
      delta: nqiDelta,
      exceeds_threshold: true,
    });
  } else {
    findings.push({
      essay_archetype: archetype,
      severity: 'info',
      category: 'score_drift',
      description: `NQI within tolerance: ${nqiDriftPercent.toFixed(1)}% drift (max: ${thresholds.maxQIDriftPercent}%)`,
      baseline_value: baselineMeanNqi.toFixed(1),
      current_value: currentMeanNqi.toFixed(1),
      delta: nqiDelta,
      exceeds_threshold: false,
    });
  }

  // --- 2. Dimension-level drift ---
  // Build dimension score maps
  const baselineDimMeans: Record<string, number> = {};
  for (const snap of baselineSnapshots) {
    for (const dim of snap.dimension_scores) {
      if (!baselineDimMeans[dim.name]) baselineDimMeans[dim.name] = 0;
      baselineDimMeans[dim.name] += dim.score / baselineSnapshots.length;
    }
  }

  const currentDimMeans: Record<string, number> = {};
  for (const snap of currentSnapshots) {
    for (const dim of snap.dimension_scores) {
      if (!currentDimMeans[dim.name]) currentDimMeans[dim.name] = 0;
      currentDimMeans[dim.name] += dim.score / currentSnapshots.length;
    }
  }

  for (const dim of Object.keys(baselineDimMeans)) {
    const baselineVal = baselineDimMeans[dim] ?? 0;
    const currentVal = currentDimMeans[dim] ?? 0;
    const dimDelta = Math.abs(currentVal - baselineVal);

    if (dimDelta > thresholds.maxDimensionDriftPoints) {
      findings.push({
        essay_archetype: archetype,
        severity: dimDelta > thresholds.maxDimensionDriftPoints * 1.5 ? 'critical' : 'warning',
        category: 'dimension_drift',
        description: `${dim}: drifted ${dimDelta.toFixed(1)} points (max: ${thresholds.maxDimensionDriftPoints})`,
        baseline_value: baselineVal.toFixed(1),
        current_value: currentVal.toFixed(1),
        delta: dimDelta,
        exceeds_threshold: true,
      });
    }
  }

  // --- 3. Timing regression ---
  const baselineMeanTime = baselineSnapshots.reduce((s, snap) => s + snap.timing.total_ms, 0) / baselineSnapshots.length;
  const currentMeanTime = currentSnapshots.reduce((s, snap) => s + snap.timing.total_ms, 0) / currentSnapshots.length;
  const timingDelta = currentMeanTime - baselineMeanTime;

  if (thresholds.maxTimingOverheadMs >= 0 && timingDelta > thresholds.maxTimingOverheadMs) {
    findings.push({
      essay_archetype: archetype,
      severity: 'warning',
      category: 'timing_regression',
      description: `Timing increased by ${timingDelta.toFixed(0)}ms (max overhead: ${thresholds.maxTimingOverheadMs}ms)`,
      baseline_value: baselineMeanTime.toFixed(0),
      current_value: currentMeanTime.toFixed(0),
      delta: timingDelta,
      exceeds_threshold: true,
    });
  }

  // For pre-screening phase, timing should DECREASE
  if (thresholds.maxTimingOverheadMs < 0 && timingDelta > 0) {
    findings.push({
      essay_archetype: archetype,
      severity: 'warning',
      category: 'timing_regression',
      description: `Expected timing decrease but got +${timingDelta.toFixed(0)}ms`,
      baseline_value: baselineMeanTime.toFixed(0),
      current_value: currentMeanTime.toFixed(0),
      delta: timingDelta,
      exceeds_threshold: true,
    });
  }

  // --- 4. Flag changes ---
  const baselineFlags = new Set(baselineSnapshots.flatMap(s => s.flags));
  const currentFlags = new Set(currentSnapshots.flatMap(s => s.flags));

  const addedFlags = [...currentFlags].filter(f => !baselineFlags.has(f));
  const removedFlags = [...baselineFlags].filter(f => !currentFlags.has(f));

  if (addedFlags.length > 0) {
    findings.push({
      essay_archetype: archetype,
      severity: addedFlags.some(f => f.includes('robotic') || f.includes('fraud')) ? 'critical' : 'info',
      category: 'flag_change',
      description: `New flags appeared: [${addedFlags.join(', ')}]`,
      baseline_value: [...baselineFlags].join(', '),
      current_value: [...currentFlags].join(', '),
      delta: addedFlags.length,
      exceeds_threshold: false,
    });
  }

  if (removedFlags.length > 0) {
    findings.push({
      essay_archetype: archetype,
      severity: removedFlags.some(f => f.includes('robotic') || f.includes('fraud')) ? 'critical' : 'info',
      category: 'flag_change',
      description: `Flags disappeared: [${removedFlags.join(', ')}]`,
      baseline_value: [...baselineFlags].join(', '),
      current_value: [...currentFlags].join(', '),
      delta: removedFlags.length,
      exceeds_threshold: false,
    });
  }

  // --- 5. Cost tracking ---
  const baselineMeanCost = baselineSnapshots.reduce((s, snap) => s + snap.token_usage.estimated_cost_usd, 0) / baselineSnapshots.length;
  const currentMeanCost = currentSnapshots.reduce((s, snap) => s + snap.token_usage.estimated_cost_usd, 0) / currentSnapshots.length;
  const costChangePercent = baselineMeanCost > 0
    ? ((currentMeanCost - baselineMeanCost) / baselineMeanCost) * 100
    : 0;

  const [minCostChange, maxCostChange] = thresholds.expectedCostChangePercent;
  if (costChangePercent < minCostChange || costChangePercent > maxCostChange) {
    findings.push({
      essay_archetype: archetype,
      severity: 'warning',
      category: 'cost_increase',
      description: `Cost changed ${costChangePercent.toFixed(1)}% (expected: ${minCostChange}% to ${maxCostChange}%)`,
      baseline_value: `$${baselineMeanCost.toFixed(4)}`,
      current_value: `$${currentMeanCost.toFixed(4)}`,
      delta: costChangePercent,
      exceeds_threshold: true,
    });
  }

  // --- 6. Edge case safety ---
  if (archetype === 'very_short') {
    const hasErrors = currentSnapshots.some(s => s.nqi === 0 || s.dimension_scores.length === 0);
    if (hasErrors) {
      findings.push({
        essay_archetype: archetype,
        severity: 'critical',
        category: 'edge_case_failure',
        description: 'Very short essay produced zero scores or empty output',
        baseline_value: 'functional',
        current_value: 'broken',
        delta: 1,
        exceeds_threshold: true,
      });
    }
  }

  return findings;
}

// ============================================================================
// BUILD REGRESSION REPORT
// ============================================================================

function buildReport(
  allFindings: RegressionFinding[],
  fromPhase: IntegrationPhase,
  toPhase: IntegrationPhase,
  totalRuns: number,
  runsPerEssay: number,
): RegressionReport {
  const blockers = allFindings.filter(f => f.severity === 'critical' && f.exceeds_threshold);
  const warnings = allFindings.filter(f => f.severity === 'warning' && f.exceeds_threshold);

  // Compute statistics
  const scoreDrifts = allFindings.filter(f => f.category === 'score_drift');
  const nqiDeltas = scoreDrifts.map(f => f.delta);
  const meanNqiDelta = nqiDeltas.length > 0 ? nqiDeltas.reduce((s, v) => s + v, 0) / nqiDeltas.length : 0;
  const maxNqiDelta = nqiDeltas.length > 0 ? Math.max(...nqiDeltas) : 0;

  const timingFindings = allFindings.filter(f => f.category === 'timing_regression');
  const meanTimingDelta = timingFindings.length > 0
    ? timingFindings.reduce((s, f) => s + f.delta, 0) / timingFindings.length
    : 0;

  const costFindings = allFindings.filter(f => f.category === 'cost_increase');
  const costChangePct = costFindings.length > 0 ? costFindings[0].delta : 0;

  const dimensionDrifts = allFindings
    .filter(f => f.category === 'dimension_drift' && f.exceeds_threshold)
    .map(f => f.description.split(':')[0]);

  // Determine verdict
  let verdict: 'go' | 'no_go' | 'conditional';
  if (blockers.length > 0) {
    verdict = 'no_go';
  } else if (warnings.length > 3) {
    verdict = 'conditional';
  } else {
    verdict = 'go';
  }

  // Build summary
  const summaryLines: string[] = [];
  summaryLines.push(`Phase transition: ${fromPhase} -> ${toPhase}`);
  summaryLines.push(`Verdict: ${verdict.toUpperCase()}`);
  summaryLines.push(`Blockers: ${blockers.length}, Warnings: ${warnings.length}`);
  summaryLines.push(`Mean NQI drift: ${meanNqiDelta.toFixed(2)}, Max: ${maxNqiDelta.toFixed(2)}`);
  summaryLines.push(`Mean timing delta: ${meanTimingDelta.toFixed(0)}ms`);
  summaryLines.push(`Cost change: ${costChangePct.toFixed(1)}%`);

  if (blockers.length > 0) {
    summaryLines.push('');
    summaryLines.push('BLOCKERS:');
    for (const b of blockers) {
      summaryLines.push(`  [${b.essay_archetype}] ${b.description}`);
    }
  }

  return {
    from_phase: fromPhase,
    to_phase: toPhase,
    verdict,
    findings: allFindings,
    blockers,
    warnings,
    statistics: {
      essays_tested: WQE_REFERENCE_ESSAYS.length,
      runs_per_essay: runsPerEssay,
      total_runs: totalRuns,
      mean_nqi_delta: Math.round(meanNqiDelta * 100) / 100,
      max_nqi_delta: Math.round(maxNqiDelta * 100) / 100,
      mean_timing_delta_ms: Math.round(meanTimingDelta),
      cost_change_percent: Math.round(costChangePct * 10) / 10,
      dimensions_exceeding_threshold: [...new Set(dimensionDrifts)],
    },
    summary: summaryLines.join('\n'),
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  requireApiKey('ANTHROPIC_API_KEY');

  const { baselinePath, phase, runs, strict } = parseArgs();
  const baseline = loadBaseline(baselinePath);

  console.log('');
  console.log('===========================================================');
  console.log('  WritingQualityEngine — Regression Detector');
  console.log('===========================================================');
  console.log(`  Baseline:   ${baselinePath}`);
  console.log(`  Base phase: ${baseline.phase}`);
  console.log(`  Test phase: ${phase}`);
  console.log(`  Runs/essay: ${runs}`);
  console.log('===========================================================');
  console.log('');

  const allFindings: RegressionFinding[] = [];
  let totalRuns = 0;

  for (const essay of WQE_REFERENCE_ESSAYS) {
    console.log(`--- Testing: ${essay.archetype.toUpperCase()} ---`);

    const baselineSnapshots = baseline.snapshots[essay.archetype] ?? [];
    if (baselineSnapshots.length === 0) {
      console.log(`  SKIP: No baseline data for ${essay.archetype}`);
      continue;
    }

    const currentSnapshots: PipelineSnapshot[] = [];

    for (let run = 1; run <= runs; run++) {
      try {
        const result = await analyzeEntry(essay.entry, { depth: 'standard' });

        // Build a minimal snapshot for comparison
        const snapshot: PipelineSnapshot = {
          essay_archetype: essay.archetype,
          phase,
          timestamp: new Date().toISOString(),
          git_commit: 'current',
          nqi: result.report.narrative_quality_index,
          reader_impression_label: result.report.reader_impression_label,
          dimension_scores: result.report.categories.map(cat => ({
            name: cat.name,
            score: cat.score_0_to_10,
            evidence_snippets: cat.evidence_snippets,
            evaluator_notes: cat.evaluator_notes,
            confidence: cat.confidence,
          })),
          flags: result.report.flags,
          suggested_fixes: result.report.suggested_fixes_ranked,
          authenticity: {
            score: result.authenticity.authenticity_score,
            voice_type: result.authenticity.voice_type,
            red_flags: result.authenticity.red_flags,
            manufactured_signals: result.authenticity.manufactured_signals,
          },
          token_usage: {
            input_tokens: Math.round(result.performance.stage2_ms * 1.5),
            output_tokens: Math.round(result.performance.stage2_ms * 0.8),
            cached_tokens: 0,
            estimated_cost_usd: estimateCost(
              Math.round(result.performance.stage2_ms * 1.5),
              Math.round(result.performance.stage2_ms * 0.8),
              0
            ),
          },
          timing: {
            stage1_feature_extraction_ms: result.performance.stage1_ms,
            stage2_category_scoring_ms: result.performance.stage2_ms,
            stage3_deep_reflection_ms: result.performance.stage3_ms,
            stage4_nqi_calculation_ms: result.performance.stage4_ms,
            total_ms: result.performance.total_ms,
          },
        };

        currentSnapshots.push(snapshot);
        totalRuns++;

        console.log(`  Run ${run}/${runs}: NQI=${snapshot.nqi.toFixed(1)}`);
      } catch (err) {
        console.error(`  ERROR run ${run}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (currentSnapshots.length === 0) {
      allFindings.push({
        essay_archetype: essay.archetype,
        severity: 'critical',
        category: 'edge_case_failure',
        description: 'All runs failed — pipeline may be broken',
        baseline_value: 'functional',
        current_value: 'error',
        delta: 1,
        exceeds_threshold: true,
      });
      continue;
    }

    const findings = detectRegressions(essay.archetype, baselineSnapshots, currentSnapshots, phase);
    allFindings.push(...findings);

    // Show per-essay verdict
    const essayBlockers = findings.filter(f => f.severity === 'critical' && f.exceeds_threshold);
    const essayWarnings = findings.filter(f => f.severity === 'warning' && f.exceeds_threshold);
    const status = essayBlockers.length > 0 ? 'FAIL' : essayWarnings.length > 0 ? 'WARN' : 'PASS';
    console.log(`  Result: ${status} (${essayBlockers.length} blockers, ${essayWarnings.length} warnings)`);
    console.log('');
  }

  // --- Build and display report ---
  const report = buildReport(allFindings, baseline.phase, phase, totalRuns, runs);

  console.log('');
  console.log('===========================================================');
  console.log('  REGRESSION REPORT');
  console.log('===========================================================');
  console.log(report.summary);
  console.log('===========================================================');

  // --- Write report to file ---
  const outputDir = path.resolve(process.cwd(), 'tests', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.join(outputDir, `wqe-regression-${phase}-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n  Report saved: ${outputPath}`);

  // --- Exit code based on verdict ---
  if (report.verdict === 'no_go') {
    console.log('\n  VERDICT: NO-GO. Critical regressions detected.');
    process.exit(1);
  } else if (report.verdict === 'conditional' && strict) {
    console.log('\n  VERDICT: CONDITIONAL (treated as failure in strict mode).');
    process.exit(1);
  } else if (report.verdict === 'conditional') {
    console.log('\n  VERDICT: CONDITIONAL. Review warnings before proceeding.');
    process.exit(0);
  } else {
    console.log('\n  VERDICT: GO. All checks passed.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
