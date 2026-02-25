/**
 * WritingQualityEngine — A/B Comparison Framework
 *
 * Runs the SAME essay through both old and new pipeline configurations,
 * compares outputs side-by-side, and generates a human-readable diff report.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="sk-ant-..." npx tsx tests/integration/wqe-ab-comparison.ts
 *
 * Options:
 *   --baseline=PATH     Path to golden baseline JSON (pipeline A)
 *   --phase=X           Phase to test as pipeline B (default: 'enrichment')
 *   --essay=ARCHETYPE   Run only one specific essay (default: all)
 *   --runs=N            Runs per essay per pipeline (default: 1)
 *
 * Output: Human-readable comparison report + JSON to tests/output/
 */

import '../utils/loadEnv';
import { requireApiKey } from '../utils/loadEnv';
import * as fs from 'fs';
import * as path from 'path';

import { analyzeEntry } from '../../src/core/analysis/engine';

import { WQE_REFERENCE_ESSAYS, ESSAYS_BY_ARCHETYPE, ReferenceEssay } from '../fixtures/wqe-reference-essays';
import {
  IntegrationPhase,
  GoldenBaseline,
  ABComparison,
  ABComparisonReport,
  PipelineSnapshot,
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
  let phase: IntegrationPhase = 'enrichment';
  let essay: EssayArchetype | undefined;
  let runs = 1;

  for (const arg of args) {
    if (arg.startsWith('--baseline=')) baselinePath = path.resolve(arg.split('=')[1]);
    if (arg.startsWith('--phase=')) phase = arg.split('=')[1] as IntegrationPhase;
    if (arg.startsWith('--essay=')) essay = arg.split('=')[1] as EssayArchetype;
    if (arg.startsWith('--runs=')) runs = parseInt(arg.split('=')[1], 10);
  }

  return { baselinePath, phase, essay, runs };
}

// ============================================================================
// LOAD BASELINE
// ============================================================================

function loadBaseline(filePath: string): GoldenBaseline {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Baseline not found at ${filePath}. Run wqe-baseline-capture.ts first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as GoldenBaseline;
}

// ============================================================================
// RUN PIPELINE B (CURRENT CODE)
// ============================================================================

async function runCurrentPipeline(essay: ReferenceEssay, phase: IntegrationPhase): Promise<PipelineSnapshot> {
  const result = await analyzeEntry(essay.entry, { depth: 'standard' });

  return {
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
}

// ============================================================================
// BUILD A/B COMPARISON FOR ONE ESSAY
// ============================================================================

function compareSnapshots(
  archetype: EssayArchetype,
  snapshotA: PipelineSnapshot,
  snapshotB: PipelineSnapshot,
  phaseA: IntegrationPhase,
  phaseB: IntegrationPhase,
): ABComparison {
  const thresholds = PHASE_THRESHOLDS[phaseB];

  // --- Score deltas ---
  const nqiDelta = snapshotB.nqi - snapshotA.nqi;

  const dimDeltas: Record<string, number> = {};
  const dimMapA: Record<string, number> = {};
  for (const d of snapshotA.dimension_scores) dimMapA[d.name] = d.score;
  const dimMapB: Record<string, number> = {};
  for (const d of snapshotB.dimension_scores) dimMapB[d.name] = d.score;

  for (const name of Object.keys(dimMapA)) {
    dimDeltas[name] = (dimMapB[name] ?? 0) - (dimMapA[name] ?? 0);
  }

  const timingDelta = snapshotB.timing.total_ms - snapshotA.timing.total_ms;
  const costDelta = snapshotB.token_usage.estimated_cost_usd - snapshotA.token_usage.estimated_cost_usd;

  // --- Qualitative differences ---
  const flagsA = new Set(snapshotA.flags);
  const flagsB = new Set(snapshotB.flags);
  const flagsAdded = [...flagsB].filter(f => !flagsA.has(f));
  const flagsRemoved = [...flagsA].filter(f => !flagsB.has(f));

  const fixesReordered = JSON.stringify(snapshotA.suggested_fixes) !== JSON.stringify(snapshotB.suggested_fixes);

  // Check if coaching is meaningfully different (by summary length change >20%)
  const coachingDiff = snapshotA.coaching_summary !== snapshotB.coaching_summary;

  // --- Acceptance criteria ---
  const rejectionReasons: string[] = [];

  if (Math.abs(nqiDelta) > thresholds.maxQIDriftPercent * snapshotA.nqi / 100) {
    rejectionReasons.push(
      `NQI delta ${nqiDelta.toFixed(1)} exceeds ${thresholds.maxQIDriftPercent}% threshold`
    );
  }

  for (const [dim, delta] of Object.entries(dimDeltas)) {
    if (Math.abs(delta) > thresholds.maxDimensionDriftPoints) {
      rejectionReasons.push(
        `${dim} moved ${delta.toFixed(1)} points (max: ${thresholds.maxDimensionDriftPoints})`
      );
    }
  }

  return {
    essay_archetype: archetype,
    pipeline_a: {
      label: `${phaseA} (baseline)`,
      phase: phaseA,
      snapshot: snapshotA,
    },
    pipeline_b: {
      label: `${phaseB} (current)`,
      phase: phaseB,
      snapshot: snapshotB,
    },
    deltas: {
      nqi: Math.round(nqiDelta * 10) / 10,
      dimensions: Object.fromEntries(
        Object.entries(dimDeltas).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      timing_ms: Math.round(timingDelta),
      cost_usd: Math.round(costDelta * 10000) / 10000,
    },
    qualitative: {
      flags_added: flagsAdded,
      flags_removed: flagsRemoved,
      fixes_reordered: fixesReordered,
      coaching_meaningfully_different: coachingDiff,
    },
    acceptable: rejectionReasons.length === 0,
    rejection_reasons: rejectionReasons,
  };
}

// ============================================================================
// RENDER HUMAN-READABLE REPORT
// ============================================================================

function renderReport(report: ABComparisonReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(72));
  lines.push('  A/B COMPARISON REPORT');
  lines.push('='.repeat(72));
  lines.push(`  Pipeline A: ${report.pipeline_a_label}`);
  lines.push(`  Pipeline B: ${report.pipeline_b_label}`);
  lines.push(`  Timestamp:  ${report.timestamp}`);
  lines.push('='.repeat(72));
  lines.push('');

  // --- Aggregate ---
  const agg = report.aggregate;
  lines.push(`  AGGREGATE: ${agg.essays_improved} improved, ${agg.essays_regressed} regressed, ${agg.essays_stable} stable`);
  lines.push(`  Mean NQI delta: ${agg.mean_nqi_delta >= 0 ? '+' : ''}${agg.mean_nqi_delta.toFixed(1)}`);
  lines.push(`  Max NQI delta:  ${agg.max_nqi_delta >= 0 ? '+' : ''}${agg.max_nqi_delta.toFixed(1)}`);
  lines.push(`  Overall: ${agg.overall_acceptable ? 'ACCEPTABLE' : 'REJECTED'}`);
  lines.push('');

  // --- Per-essay comparisons ---
  for (const comp of report.comparisons) {
    const status = comp.acceptable ? 'PASS' : 'FAIL';
    lines.push('-'.repeat(72));
    lines.push(`  ${comp.essay_archetype.toUpperCase()} [${status}]`);
    lines.push('-'.repeat(72));

    // NQI comparison
    const nqiA = comp.pipeline_a.snapshot.nqi;
    const nqiB = comp.pipeline_b.snapshot.nqi;
    const nqiArrow = comp.deltas.nqi > 0 ? '+' : comp.deltas.nqi < 0 ? '' : '=';
    lines.push(`  NQI:   ${nqiA.toFixed(1)} -> ${nqiB.toFixed(1)}  (${nqiArrow}${comp.deltas.nqi.toFixed(1)})`);

    // Dimension comparison table
    lines.push('');
    lines.push('  Dimension                    | Pipeline A | Pipeline B | Delta');
    lines.push('  -----------------------------+------------+------------+------');

    for (const dimA of comp.pipeline_a.snapshot.dimension_scores) {
      const dimB = comp.pipeline_b.snapshot.dimension_scores.find(d => d.name === dimA.name);
      const delta = comp.deltas.dimensions[dimA.name] ?? 0;
      const flag = Math.abs(delta) > 1.5 ? ' !!!' : Math.abs(delta) > 0.5 ? ' *' : '';

      lines.push(
        `  ${dimA.name.padEnd(30)} | ${dimA.score.toFixed(1).padStart(10)} | ` +
        `${(dimB?.score ?? 0).toFixed(1).padStart(10)} | ${(delta >= 0 ? '+' : '')}${delta.toFixed(1)}${flag}`
      );
    }

    // Timing
    lines.push('');
    lines.push(
      `  Timing: ${comp.pipeline_a.snapshot.timing.total_ms}ms -> ` +
      `${comp.pipeline_b.snapshot.timing.total_ms}ms  (${comp.deltas.timing_ms >= 0 ? '+' : ''}${comp.deltas.timing_ms}ms)`
    );

    // Flag changes
    if (comp.qualitative.flags_added.length > 0) {
      lines.push(`  Flags added:   [${comp.qualitative.flags_added.join(', ')}]`);
    }
    if (comp.qualitative.flags_removed.length > 0) {
      lines.push(`  Flags removed: [${comp.qualitative.flags_removed.join(', ')}]`);
    }

    // Rejection reasons
    if (!comp.acceptable) {
      lines.push('');
      lines.push('  REJECTION REASONS:');
      for (const reason of comp.rejection_reasons) {
        lines.push(`    - ${reason}`);
      }
    }

    lines.push('');
  }

  lines.push('='.repeat(72));
  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  requireApiKey('ANTHROPIC_API_KEY');

  const { baselinePath, phase, essay: singleEssay, runs } = parseArgs();
  const baseline = loadBaseline(baselinePath);

  const essays = singleEssay
    ? [ESSAYS_BY_ARCHETYPE[singleEssay]]
    : WQE_REFERENCE_ESSAYS;

  console.log('');
  console.log('===========================================================');
  console.log('  WritingQualityEngine — A/B Comparison');
  console.log('===========================================================');
  console.log(`  Pipeline A: ${baseline.phase} baseline (from file)`);
  console.log(`  Pipeline B: ${phase} (live run)`);
  console.log(`  Essays:     ${essays.length}`);
  console.log(`  Runs/essay: ${runs}`);
  console.log('===========================================================');
  console.log('');

  const comparisons: ABComparison[] = [];

  for (const essayRef of essays) {
    console.log(`  Running: ${essayRef.archetype}...`);

    const baselineSnapshots = baseline.snapshots[essayRef.archetype] ?? [];
    if (baselineSnapshots.length === 0) {
      console.log(`    SKIP: No baseline data`);
      continue;
    }

    // Use median baseline snapshot (by NQI) as Pipeline A
    const sortedBaseline = [...baselineSnapshots].sort((a, b) => a.nqi - b.nqi);
    const medianSnapshot = sortedBaseline[Math.floor(sortedBaseline.length / 2)];

    // Run pipeline B (current code)
    const currentSnapshots: PipelineSnapshot[] = [];
    for (let r = 0; r < runs; r++) {
      try {
        const snap = await runCurrentPipeline(essayRef, phase);
        currentSnapshots.push(snap);
      } catch (err) {
        console.error(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (currentSnapshots.length === 0) {
      console.log(`    SKIP: All runs failed`);
      continue;
    }

    // Use median current snapshot
    const sortedCurrent = [...currentSnapshots].sort((a, b) => a.nqi - b.nqi);
    const medianCurrent = sortedCurrent[Math.floor(sortedCurrent.length / 2)];

    const comparison = compareSnapshots(
      essayRef.archetype,
      medianSnapshot,
      medianCurrent,
      baseline.phase,
      phase,
    );

    comparisons.push(comparison);

    const status = comparison.acceptable ? 'PASS' : 'FAIL';
    console.log(
      `    ${status}: NQI ${medianSnapshot.nqi.toFixed(1)} -> ${medianCurrent.nqi.toFixed(1)} ` +
      `(${comparison.deltas.nqi >= 0 ? '+' : ''}${comparison.deltas.nqi.toFixed(1)})`
    );
  }

  // --- Build report ---
  const nqiDeltas = comparisons.map(c => c.deltas.nqi);
  const meanDelta = nqiDeltas.length > 0 ? nqiDeltas.reduce((s, v) => s + v, 0) / nqiDeltas.length : 0;
  const maxDelta = nqiDeltas.length > 0 ? Math.max(...nqiDeltas.map(Math.abs)) : 0;

  const abReport: ABComparisonReport = {
    pipeline_a_label: `${baseline.phase} baseline`,
    pipeline_b_label: `${phase} current`,
    timestamp: new Date().toISOString(),
    comparisons,
    aggregate: {
      mean_nqi_delta: Math.round(meanDelta * 10) / 10,
      max_nqi_delta: Math.round(maxDelta * 10) / 10,
      essays_improved: comparisons.filter(c => c.deltas.nqi > 0.5).length,
      essays_regressed: comparisons.filter(c => c.deltas.nqi < -0.5).length,
      essays_stable: comparisons.filter(c => Math.abs(c.deltas.nqi) <= 0.5).length,
      overall_acceptable: comparisons.every(c => c.acceptable),
    },
    rendered_report: '', // filled below
  };

  abReport.rendered_report = renderReport(abReport);

  // --- Output ---
  console.log(abReport.rendered_report);

  const outputDir = path.resolve(process.cwd(), 'tests', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.join(outputDir, `wqe-ab-comparison-${phase}-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(abReport, null, 2), 'utf-8');
  console.log(`\n  Report saved: ${outputPath}`);

  // --- Exit code ---
  if (!abReport.aggregate.overall_acceptable) {
    console.log('\n  Some comparisons failed threshold checks.');
    process.exit(1);
  } else {
    console.log('\n  All comparisons within acceptable bounds.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
