/**
 * WritingQualityEngine — Report Generator
 *
 * Generates comprehensive human-readable reports from baseline captures,
 * regression reports, and A/B comparisons. Can be run standalone to
 * inspect previously saved JSON outputs.
 *
 * Usage:
 *   npx tsx tests/integration/wqe-report-generator.ts --type=baseline --input=PATH
 *   npx tsx tests/integration/wqe-report-generator.ts --type=regression --input=PATH
 *   npx tsx tests/integration/wqe-report-generator.ts --type=comparison --input=PATH
 *   npx tsx tests/integration/wqe-report-generator.ts --type=dashboard --dir=tests/output/
 *
 * The "dashboard" mode reads all WQE JSON files in a directory and renders
 * a consolidated progress view across all phases.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  GoldenBaseline,
  RegressionReport,
  ABComparisonReport,
  PipelineSnapshot,
  EssayArchetype,
  IntegrationPhase,
  PHASE_THRESHOLDS,
} from './wqe-types';

// ============================================================================
// BASELINE REPORT
// ============================================================================

function renderBaselineReport(baseline: GoldenBaseline): string {
  const lines: string[] = [];
  const w = 72;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  GOLDEN BASELINE REPORT');
  lines.push('='.repeat(w));
  lines.push(`  Version:    ${baseline.version}`);
  lines.push(`  Phase:      ${baseline.phase}`);
  lines.push(`  Git commit: ${baseline.git_commit}`);
  lines.push(`  Captured:   ${baseline.captured_at}`);
  lines.push('');
  lines.push('  AGGREGATE STATISTICS:');
  lines.push(`    Mean NQI:     ${baseline.aggregate.mean_nqi} (std: ${baseline.aggregate.std_nqi})`);
  lines.push(`    Mean timing:  ${baseline.aggregate.mean_timing_ms}ms`);
  lines.push(`    Total cost:   $${baseline.aggregate.total_cost_usd.toFixed(4)}`);
  lines.push(`    Total tokens: ${baseline.aggregate.total_tokens.toLocaleString()}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Per-essay detail
  for (const [archetype, snapshots] of Object.entries(baseline.snapshots) as [EssayArchetype, PipelineSnapshot[]][]) {
    if (snapshots.length === 0) continue;

    lines.push('-'.repeat(w));
    lines.push(`  ${archetype.toUpperCase()} (${snapshots.length} runs)`);
    lines.push('-'.repeat(w));

    const nqis = snapshots.map(s => s.nqi);
    const mean = nqis.reduce((s, v) => s + v, 0) / nqis.length;
    const min = Math.min(...nqis);
    const max = Math.max(...nqis);

    lines.push(`  NQI:    ${mean.toFixed(1)} (range: ${min.toFixed(1)} - ${max.toFixed(1)})`);
    lines.push(`  Label:  ${snapshots[0].reader_impression_label}`);

    // Dimension scores from first run
    lines.push('');
    lines.push('  Dimension Scores (run 1):');
    for (const dim of snapshots[0].dimension_scores) {
      const bar = '#'.repeat(Math.round(dim.score));
      const pad = '.'.repeat(10 - Math.round(dim.score));
      lines.push(`    ${dim.name.padEnd(28)} ${dim.score.toFixed(1)} [${bar}${pad}]`);
    }

    // Flags
    lines.push(`  Flags: [${snapshots[0].flags.join(', ')}]`);

    // Authenticity
    lines.push(
      `  Authenticity: ${snapshots[0].authenticity.score.toFixed(1)} ` +
      `(${snapshots[0].authenticity.voice_type})`
    );

    // Computational analysis (if captured)
    if (snapshots[0].computational_analysis) {
      const ca = snapshots[0].computational_analysis;
      lines.push('');
      lines.push('  Computational Analysis:');
      lines.push(`    Diversity:  ${ca.entropy_diversity_score.toFixed(1)}/10`);
      lines.push(`    Engagement: ${ca.engagement_score.toFixed(1)}/10`);
      lines.push(`    Uniqueness: ${ca.uniqueness_score.toFixed(1)}/10`);
      lines.push(`    Coherence:  ${ca.coherence_score.toFixed(1)}/10`);
      lines.push(`    Natural:    ${ca.naturality_score.toFixed(1)}/10`);
      lines.push(`    Time:       ${ca.total_ms}ms`);
      if (ca.diagnostics.length > 0) {
        lines.push(`    Diagnostics: ${ca.diagnostics.slice(0, 3).join('; ')}`);
      }
    }

    // Scoring science (if captured)
    if (snapshots[0].scoring_science) {
      const ss = snapshots[0].scoring_science;
      lines.push('');
      lines.push('  Scoring Science:');
      lines.push(
        `    Calibrated QI: ${ss.quality_index.toFixed(1)} ` +
        `[${ss.quality_index_ci[0].toFixed(1)}-${ss.quality_index_ci[1].toFixed(1)}]`
      );
      lines.push(`    Reliability:   ${ss.reliability_assessment}`);
      lines.push(`    Adjustment:    ${ss.total_adjustment_magnitude.toFixed(2)} total points`);
      if (ss.flagged_dimensions.length > 0) {
        lines.push(`    Flagged:       ${ss.flagged_dimensions.join(', ')}`);
      }
    }

    // Pre-screen (if captured)
    if (snapshots[0].pre_screen) {
      const ps = snapshots[0].pre_screen;
      lines.push('');
      lines.push('  Pre-Screen:');
      lines.push(`    Skip LLM: ${ps.skip_llm ? 'YES' : 'NO'} (confidence: ${ps.confidence.toFixed(2)})`);
      lines.push(
        `    Predicted QI: ${ps.predicted_qi.toFixed(1)} ` +
        `[${ps.predicted_range[0].toFixed(1)}-${ps.predicted_range[1].toFixed(1)}]`
      );
      lines.push(`    Reason: ${ps.reason}`);
    }

    // Timing
    lines.push('');
    lines.push(`  Timing: ${snapshots[0].timing.total_ms}ms total`);
    lines.push(`    Stage 1 (features):    ${snapshots[0].timing.stage1_feature_extraction_ms}ms`);
    lines.push(`    Stage 2 (scoring):     ${snapshots[0].timing.stage2_category_scoring_ms}ms`);
    lines.push(`    Stage 3 (reflection):  ${snapshots[0].timing.stage3_deep_reflection_ms}ms`);
    lines.push(`    Stage 4 (NQI):         ${snapshots[0].timing.stage4_nqi_calculation_ms}ms`);
    if (snapshots[0].timing.computational_analysis_ms) {
      lines.push(`    Computational:         ${snapshots[0].timing.computational_analysis_ms}ms`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// REGRESSION REPORT
// ============================================================================

function renderRegressionReport(report: RegressionReport): string {
  const lines: string[] = [];
  const w = 72;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  REGRESSION DETECTION REPORT');
  lines.push('='.repeat(w));
  lines.push(`  Transition: ${report.from_phase} -> ${report.to_phase}`);
  lines.push(`  Verdict:    ${report.verdict.toUpperCase()}`);
  lines.push('='.repeat(w));
  lines.push('');
  lines.push(report.summary);
  lines.push('');

  // Findings grouped by essay
  const byEssay = new Map<EssayArchetype, typeof report.findings>();
  for (const f of report.findings) {
    if (!byEssay.has(f.essay_archetype)) byEssay.set(f.essay_archetype, []);
    byEssay.get(f.essay_archetype)!.push(f);
  }

  for (const [archetype, findings] of byEssay) {
    const blockers = findings.filter(f => f.severity === 'critical');
    const warnings = findings.filter(f => f.severity === 'warning');
    const infos = findings.filter(f => f.severity === 'info');

    const status = blockers.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';

    lines.push('-'.repeat(w));
    lines.push(`  ${archetype.toUpperCase()} [${status}]`);
    lines.push('-'.repeat(w));

    for (const f of findings) {
      const icon = f.severity === 'critical' ? 'CRIT' : f.severity === 'warning' ? 'WARN' : 'INFO';
      lines.push(`  [${icon}] ${f.description}`);
      lines.push(`         baseline: ${f.baseline_value} | current: ${f.current_value} | delta: ${typeof f.delta === 'number' ? f.delta.toFixed(2) : f.delta}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// DASHBOARD: MULTI-PHASE PROGRESS VIEW
// ============================================================================

interface DashboardData {
  baselines: GoldenBaseline[];
  regressions: RegressionReport[];
  comparisons: ABComparisonReport[];
}

function loadDashboardData(dir: string): DashboardData {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('wqe-') && f.endsWith('.json'));

  const baselines: GoldenBaseline[] = [];
  const regressions: RegressionReport[] = [];
  const comparisons: ABComparisonReport[] = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));

    if (file.includes('baseline') && data.snapshots) {
      baselines.push(data);
    } else if (file.includes('regression') && data.findings) {
      regressions.push(data);
    } else if (file.includes('comparison') && data.comparisons) {
      comparisons.push(data);
    }
  }

  return { baselines, regressions, comparisons };
}

function renderDashboard(data: DashboardData): string {
  const lines: string[] = [];
  const w = 80;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  WritingQualityEngine INTEGRATION DASHBOARD');
  lines.push('='.repeat(w));
  lines.push(`  Baselines:   ${data.baselines.length}`);
  lines.push(`  Regressions: ${data.regressions.length}`);
  lines.push(`  Comparisons: ${data.comparisons.length}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Phase progress tracker
  const phases: IntegrationPhase[] = ['baseline', 'shadow', 'enrichment', 'calibration', 'pre_screening'];
  const completedPhases = new Set(data.baselines.map(b => b.phase));
  const passedGates = new Set(data.regressions.filter(r => r.verdict === 'go').map(r => r.to_phase));

  lines.push('  PHASE PROGRESS:');
  lines.push('');
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const hasBaseline = completedPhases.has(phase);
    const passedGate = passedGates.has(phase);

    const statusIcon = hasBaseline && passedGate ? '[OK]' : hasBaseline ? '[--]' : '[  ]';
    const connector = i < phases.length - 1 ? '  |' : '';

    lines.push(`  ${statusIcon} ${phase}`);
    if (hasBaseline) {
      const bl = data.baselines.find(b => b.phase === phase);
      if (bl) {
        lines.push(`        NQI: ${bl.aggregate.mean_nqi} | Cost: $${bl.aggregate.total_cost_usd.toFixed(4)} | ${bl.captured_at.split('T')[0]}`);
      }
    }
    if (connector) lines.push(connector);
  }

  lines.push('');

  // NQI trend across phases
  if (data.baselines.length > 1) {
    lines.push('-'.repeat(w));
    lines.push('  NQI TREND ACROSS PHASES:');
    lines.push('-'.repeat(w));
    lines.push('');

    const sortedBaselines = [...data.baselines].sort(
      (a, b) => phases.indexOf(a.phase) - phases.indexOf(b.phase)
    );

    for (const bl of sortedBaselines) {
      const archetypes: EssayArchetype[] = ['excellent', 'mediocre', 'weak', 'ai_generated',
        'very_short', 'register_inconsistent', 'strong_narrative_arc', 'pure_reflection'];

      lines.push(`  ${bl.phase.toUpperCase()}`);
      for (const arch of archetypes) {
        const snaps = bl.snapshots[arch] ?? [];
        if (snaps.length === 0) continue;
        const mean = snaps.reduce((s, snap) => s + snap.nqi, 0) / snaps.length;
        const bar = '#'.repeat(Math.round(mean / 2));
        lines.push(`    ${arch.padEnd(25)} ${mean.toFixed(1).padStart(5)} [${bar}]`);
      }
      lines.push('');
    }
  }

  // Cost tracking across phases
  if (data.baselines.length > 1) {
    lines.push('-'.repeat(w));
    lines.push('  COST TRACKING:');
    lines.push('-'.repeat(w));

    const sortedBaselines = [...data.baselines].sort(
      (a, b) => phases.indexOf(a.phase) - phases.indexOf(b.phase)
    );

    const baselineCost = sortedBaselines[0]?.aggregate.total_cost_usd ?? 0;

    for (const bl of sortedBaselines) {
      const change = baselineCost > 0
        ? ((bl.aggregate.total_cost_usd - baselineCost) / baselineCost * 100).toFixed(1)
        : 'N/A';
      lines.push(
        `  ${bl.phase.padEnd(16)} $${bl.aggregate.total_cost_usd.toFixed(4)} ` +
        `(${change}% from baseline)`
      );
    }
    lines.push('');
  }

  lines.push('='.repeat(w));
  return lines.join('\n');
}

// ============================================================================
// CLI MAIN
// ============================================================================

function parseCliArgs() {
  const args = process.argv.slice(2);
  let type: 'baseline' | 'regression' | 'comparison' | 'dashboard' = 'dashboard';
  let inputPath: string | undefined;
  let dir: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--type=')) type = arg.split('=')[1] as any;
    if (arg.startsWith('--input=')) inputPath = path.resolve(arg.split('=')[1]);
    if (arg.startsWith('--dir=')) dir = path.resolve(arg.split('=')[1]);
  }

  return { type, inputPath, dir };
}

async function main(): Promise<void> {
  const { type, inputPath, dir } = parseCliArgs();

  switch (type) {
    case 'baseline': {
      if (!inputPath) {
        console.error('Usage: --type=baseline --input=tests/output/wqe-baseline-*.json');
        process.exit(1);
      }
      const baseline = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as GoldenBaseline;
      console.log(renderBaselineReport(baseline));
      break;
    }

    case 'regression': {
      if (!inputPath) {
        console.error('Usage: --type=regression --input=tests/output/wqe-regression-*.json');
        process.exit(1);
      }
      const report = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as RegressionReport;
      console.log(renderRegressionReport(report));
      break;
    }

    case 'comparison': {
      if (!inputPath) {
        console.error('Usage: --type=comparison --input=tests/output/wqe-ab-comparison-*.json');
        process.exit(1);
      }
      const abReport = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as ABComparisonReport;
      console.log(abReport.rendered_report);
      break;
    }

    case 'dashboard': {
      const targetDir = dir ?? path.resolve(process.cwd(), 'tests', 'output');
      if (!fs.existsSync(targetDir)) {
        console.log('No output directory found. Run wqe-baseline-capture.ts first.');
        process.exit(0);
      }
      const data = loadDashboardData(targetDir);
      console.log(renderDashboard(data));
      break;
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
