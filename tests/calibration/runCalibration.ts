/**
 * Annotation Pipeline V2 — Calibration Runner
 *
 * Executes the full calibration suite: loads essays, runs each through
 * the annotation pipeline, scores against expert ratings, and optionally
 * saves a baseline or compares against one.
 *
 * Usage:
 *   # Establish baseline (saves to tests/calibration/baseline.json)
 *   ANTHROPIC_API_KEY="..." npx tsx tests/calibration/runCalibration.ts --baseline
 *
 *   # Compare current pipeline against baseline
 *   ANTHROPIC_API_KEY="..." npx tsx tests/calibration/runCalibration.ts --compare
 *
 *   # Compare against a specific baseline file
 *   ANTHROPIC_API_KEY="..." npx tsx tests/calibration/runCalibration.ts --compare path/to/baseline.json
 *
 *   # Just run and print results (no save, no compare)
 *   ANTHROPIC_API_KEY="..." npx tsx tests/calibration/runCalibration.ts
 *
 *   # Specify quality gate layer (default: 0)
 *   ANTHROPIC_API_KEY="..." npx tsx tests/calibration/runCalibration.ts --layer 1
 *
 * Estimated cost: ~$0.10-0.30 depending on essay count.
 */

import { requireApiKey } from '../utils/loadEnv';

// Import workshop system (triggers dimension/profile registration)
import '../../src/workshop/essay-profiles';
import '../../src/workshop/dimensions/narrative-craft.dim';
import '../../src/workshop/dimensions/emotional-resonance.dim';
import '../../src/workshop/dimensions/intellectual-vitality.dim';
import '../../src/workshop/dimensions/originality-voice.dim';
import '../../src/workshop/dimensions/structural-coherence.dim';
import '../../src/workshop/dimensions/word-economy.dim';
import '../../src/workshop/dimensions/thematic-depth.dim';
import '../../src/workshop/dimensions/opening-hook.dim';
import '../../src/workshop/dimensions/closing-impact.dim';
import '../../src/workshop/dimensions/growth-transformation.dim';
import '../../src/workshop/dimensions/authenticity-specificity.dim';
import '../../src/workshop/dimensions/tonal-sophistication.dim';
import '../../src/workshop/dimensions/argument-rhetorical.dim';

import { annotationPipeline } from '../../src/pipeline/annotationPipeline';
import { qualityScorer } from './qualityScorer';
import type {
  CalibrationEssay,
  CalibrationResult,
  CalibrationBaseline,
} from './types';
import type { AnnotationPipelineConfig } from '../../src/pipeline/types';
import type { WorkshopEssayType } from '../../src/workshop/shared/types';

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CLIArgs {
  saveBaseline: boolean;
  comparePath: string | null;
  layer: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  let saveBaseline = false;
  let comparePath: string | null = null;
  let layer = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--baseline') {
      saveBaseline = true;
    } else if (args[i] === '--compare') {
      // Next arg might be a path, or default to baseline.json
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        comparePath = next;
        i++;
      } else {
        comparePath = ''; // use default path
      }
    } else if (args[i] === '--layer') {
      const next = args[i + 1];
      if (next) {
        layer = parseInt(next, 10);
        if (isNaN(layer) || layer < 0 || layer > 5) {
          console.error(`Invalid layer: ${next}. Must be 0-5.`);
          process.exit(1);
        }
        i++;
      }
    }
  }

  return { saveBaseline, comparePath, layer };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function bar(score: number, maxLen: number = 20): string {
  const clamped = Math.max(0, Math.min(100, score));
  const filled = Math.round((clamped / 100) * maxLen);
  return '#'.repeat(filled) + '.'.repeat(maxLen - filled);
}

function printResultSummary(result: CalibrationResult): void {
  const eqiBar = bar(result.eqiActual);
  console.log(`    EQI: ${result.eqiActual.toString().padStart(3)} ${eqiBar} (expected: ${result.eqiExpected}, error: ${result.eqiError.toFixed(1)})`);
  console.log(`    MAE: ${result.meanAbsoluteError.toFixed(1)} | Annotations: ${result.annotationCount} | Coverage: ${(result.dimensionCoverage * 100).toFixed(0)}%`);
  console.log(`    Severity: C=${result.severityDistribution.critical} I=${result.severityDistribution.important} S=${result.severityDistribution.suggestion} Str=${result.severityDistribution.strength} | Strength ratio: ${(result.strengthRatio * 100).toFixed(0)}%`);
  console.log(`    Insight specificity: ${(result.insightSpecificity * 100).toFixed(0)}% | Suggestion actionability: ${(result.suggestionActionability * 100).toFixed(0)}%`);
  console.log(`    Latency: ${result.latencyMs}ms | Cost: $${result.costUSD.toFixed(4)}`);
}

function printDimensionErrors(result: CalibrationResult): void {
  const dims = Object.entries(result.dimensionErrors).sort(
    ([, a], [, b]) => b.error - a.error,
  );

  if (dims.length === 0) {
    console.log('    (no dimension scores to compare)');
    return;
  }

  console.log('    ' + 'Dimension'.padEnd(42) + 'Actual'.padStart(8) + 'Expert'.padStart(8) + 'Error'.padStart(8));
  console.log('    ' + '-'.repeat(66));

  for (const [dimId, dim] of dims) {
    const name = dimId.length > 39 ? dimId.substring(0, 36) + '...' : dimId;
    const errorFlag = dim.error > 15 ? ' !!!' : dim.error > 8 ? ' !' : '';
    console.log(
      '    ' +
        name.padEnd(42) +
        dim.actual.toFixed(0).padStart(8) +
        dim.expected.toFixed(0).padStart(8) +
        dim.error.toFixed(1).padStart(8) +
        errorFlag,
    );
  }
}

function printQualityGates(gateResult: ReturnType<typeof qualityScorer.checkQualityGates>): void {
  const hr = '='.repeat(76);
  console.log(`\n${hr}`);
  console.log(`  QUALITY GATES — Layer ${gateResult.layer}`);
  console.log(hr);

  console.log(`\n  Status: ${gateResult.passed ? 'PASSED' : 'FAILED'}\n`);

  if (gateResult.passes.length > 0) {
    console.log('  Passed:');
    for (const p of gateResult.passes) {
      console.log(`    [OK]   ${p}`);
    }
  }

  if (gateResult.failures.length > 0) {
    console.log('\n  Failed:');
    for (const f of gateResult.failures) {
      console.log(`    [FAIL] ${f}`);
    }
  }

  console.log(`\n${hr}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();
  const cliArgs = parseArgs();

  console.log('='.repeat(76));
  console.log('  ANNOTATION PIPELINE CALIBRATION SUITE');
  console.log('='.repeat(76));

  // Require API key for LLM calls
  requireApiKey('ANTHROPIC_API_KEY');

  // ------------------------------------------------------------------
  // Step 1: Load calibration essays and expert ratings
  // ------------------------------------------------------------------
  console.log('\n--- Loading calibration data ---');

  const experts = qualityScorer.loadExpertRatings();
  if (experts.length === 0) {
    console.log('\n  No expert ratings found.');
    console.log('  Create tests/calibration/expert-ratings.json with CalibrationEssay[] data.');
    console.log('  See tests/calibration/types.ts for the CalibrationEssay interface.\n');
    process.exit(1);
  }

  console.log(`  Loaded ${experts.length} calibration essays with expert ratings.`);

  // ------------------------------------------------------------------
  // Step 2: Run each essay through the annotation pipeline
  // ------------------------------------------------------------------
  console.log('\n--- Running pipeline on calibration essays ---\n');

  const results: CalibrationResult[] = [];
  let totalCost = 0;
  let totalLatency = 0;
  let essayNum = 0;

  for (const expert of experts) {
    essayNum++;
    console.log(`  [${essayNum}/${experts.length}] ${expert.id} (${expert.qualityTier}, ~${expert.wordCount} words)`);

    const config: AnnotationPipelineConfig = {
      essayType: expert.essayType as WorkshopEssayType,
    };

    try {
      const pipelineResult = await annotationPipeline.analyze(expert.text, config);
      const calResult = qualityScorer.scoreResult(pipelineResult, expert, 'v1');

      results.push(calResult);
      totalCost += calResult.costUSD;
      totalLatency += calResult.latencyMs;

      printResultSummary(calResult);

      // Print dimension breakdown for detailed debugging
      if (Object.keys(calResult.dimensionErrors).length > 0) {
        printDimensionErrors(calResult);
      }
    } catch (error) {
      console.error(`    ERROR: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with remaining essays
    }

    console.log('');
  }

  // ------------------------------------------------------------------
  // Step 3: Compute and display summary
  // ------------------------------------------------------------------
  const summary = qualityScorer.computeSummary(results);

  console.log('='.repeat(76));
  console.log('  CALIBRATION SUMMARY');
  console.log('='.repeat(76));
  console.log(`  Essays scored:      ${results.length}/${experts.length}`);
  console.log(`  Overall MAE:        ${summary.overallMAE?.toFixed(2) ?? 'N/A'}`);
  console.log(`  Avg annotations:    ${summary.avgAnnotationCount.toFixed(1)}`);
  console.log(`  Avg dim coverage:   ${(summary.avgDimensionCoverage * 100).toFixed(0)}%`);
  console.log(`  Avg strength ratio: ${(summary.avgStrengthRatio * 100).toFixed(0)}%`);
  console.log(`  Avg latency:        ${summary.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  Avg cost/essay:     $${summary.avgCostUSD.toFixed(4)}`);
  console.log(`  Total cost:         $${summary.totalCostUSD.toFixed(4)}`);
  console.log(`  Total time:         ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // Per-dimension MAE summary
  if (Object.keys(summary.perDimensionMAE).length > 0) {
    console.log('\n  Per-Dimension MAE:');
    const sorted = Object.entries(summary.perDimensionMAE).sort(([, a], [, b]) => b - a);
    for (const [dimId, mae] of sorted) {
      const name = dimId.length > 40 ? dimId.substring(0, 37) + '...' : dimId;
      const barStr = bar(100 - mae); // invert: lower MAE = better
      console.log(`    ${name.padEnd(42)} ${mae.toFixed(1).padStart(6)} ${barStr}`);
    }
  }

  // ------------------------------------------------------------------
  // Step 4: Save baseline if requested
  // ------------------------------------------------------------------
  if (cliArgs.saveBaseline) {
    console.log('\n--- Saving baseline ---');
    const baseline = qualityScorer.buildBaseline(results, '1.0.0', 'v1');
    qualityScorer.saveBaseline(baseline);
    console.log('  Baseline saved to tests/calibration/baseline.json');
  }

  // ------------------------------------------------------------------
  // Step 5: Compare against baseline if requested
  // ------------------------------------------------------------------
  if (cliArgs.comparePath !== null) {
    console.log('\n--- Comparing against baseline ---');

    const baselinePath = cliArgs.comparePath || undefined;
    const baseline = qualityScorer.loadBaseline(baselinePath);

    if (!baseline) {
      console.log('  No baseline found to compare against.');
      console.log('  Run with --baseline first to establish a baseline.');
    } else {
      const comparison = qualityScorer.compare(results, baseline);
      const report = qualityScorer.generateReport(comparison);
      console.log('\n' + report);
    }
  }

  // ------------------------------------------------------------------
  // Step 6: Check quality gates
  // ------------------------------------------------------------------
  const baseline = cliArgs.comparePath !== null
    ? qualityScorer.loadBaseline(cliArgs.comparePath || undefined)
    : qualityScorer.loadBaseline();

  const gateResult = qualityScorer.checkQualityGates(results, baseline, cliArgs.layer);
  printQualityGates(gateResult);

  // ------------------------------------------------------------------
  // Exit code
  // ------------------------------------------------------------------
  if (!gateResult.passed) {
    console.log('\n  Calibration suite completed with quality gate FAILURES.');
    process.exit(1);
  } else {
    console.log('\n  Calibration suite completed successfully. All gates passed.');
    process.exit(0);
  }
}

// ============================================================================
// RUN
// ============================================================================

main().catch((err) => {
  console.error('\nCalibration suite fatal error:', err);
  process.exit(1);
});
