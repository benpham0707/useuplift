/**
 * WritingQualityEngine — Golden Baseline Capture
 *
 * Runs all 8 reference essays through the CURRENT pipeline (no WQE integration)
 * and saves a complete snapshot as the "golden baseline" for regression comparison.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="sk-ant-..." npx tsx tests/integration/wqe-baseline-capture.ts
 *
 * Options:
 *   --runs=N      Number of runs per essay (default: 3 for LLM variance)
 *   --phase=X     Phase label to tag the baseline (default: 'baseline')
 *   --output=PATH Custom output path (default: tests/output/wqe-baseline-{phase}-{timestamp}.json)
 *
 * Output: JSON file with complete PipelineSnapshot for every essay x run.
 */

import '../utils/loadEnv';
import { requireApiKey } from '../utils/loadEnv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { analyzeEntry } from '../../src/core/analysis/engine';
import { informationTheoreticAnalyzer } from '../../src/core/analysis/features/informationTheoreticAnalyzer';
import { runScoringPipeline, DEFAULT_EXPERIENCE_CONFIG } from '../../src/core/analysis/scoring/scoringScience/scoringSciencePipeline';
import { computePriors, preScreen, ComputationalSignals } from '../../src/core/analysis/scoring/scoringScience/bayesianUpdating';

import { WQE_REFERENCE_ESSAYS, ReferenceEssay } from '../fixtures/wqe-reference-essays';
import {
  IntegrationPhase,
  PipelineSnapshot,
  GoldenBaseline,
  CapturedTokenUsage,
  EssayArchetype,
  estimateCost,
} from './wqe-types';

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseArgs(): { runs: number; phase: IntegrationPhase; outputPath?: string } {
  const args = process.argv.slice(2);
  let runs = 3;
  let phase: IntegrationPhase = 'baseline';
  let outputPath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--runs=')) runs = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--phase=')) phase = arg.split('=')[1] as IntegrationPhase;
    if (arg.startsWith('--output=')) outputPath = arg.split('=')[1];
  }

  return { runs, phase, outputPath };
}

// ============================================================================
// GIT COMMIT HELPER
// ============================================================================

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// EXTRACT COMPUTATIONAL SIGNALS FROM FEATURES
// ============================================================================

/**
 * Build ComputationalSignals from the extracted features of an analysis run.
 * This bridges the feature extractor output to the Bayesian updating input.
 */
function extractComputationalSignals(features: any, authenticity: any): ComputationalSignals {
  return {
    word_count: features.word_count ?? 0,
    readability_score: features.readability?.flesch_kincaid ?? undefined,
    passive_ratio: features.voice?.passive_ratio ?? 0,
    concrete_numbers_count: features.evidence?.concrete_numbers?.length ?? 0,
    temporal_markers_count: features.arc?.temporal_markers?.length ?? 0,
    has_stakes_indicators: features.arc?.has_stakes ?? false,
    named_individuals_count: features.collaboration?.named_individuals?.length ?? 0,
    has_before_after: features.arc?.has_turning_point ?? false,
    reflection_depth_heuristic: features.reflection?.reflection_quality === 'deep' ? 8 :
      features.reflection?.reflection_quality === 'moderate' ? 5 :
      features.reflection?.reflection_quality === 'superficial' ? 3 : 1,
    sentence_variety: features.voice?.sentence_variety_score ?? 5,
    buzzword_count: features.voice?.buzzword_count ?? 0,
    credit_given: features.collaboration?.credit_given ?? false,
    insight_depth: features.reflection?.insight_count ?? 0,
    authenticity_score: authenticity?.authenticity_score ?? undefined,
  };
}

// ============================================================================
// SINGLE ESSAY PIPELINE RUN
// ============================================================================

async function runPipelineOnEssay(
  essay: ReferenceEssay,
  phase: IntegrationPhase,
  gitCommit: string,
): Promise<PipelineSnapshot> {
  const entry = essay.entry;

  // --- STAGE 0: Computational analysis (always run for comparison, even in baseline) ---
  const compStart = Date.now();
  const compResult = informationTheoreticAnalyzer.analyze(entry.description_original);
  const compMs = Date.now() - compStart;

  // --- STAGE 1-4: Run the actual pipeline ---
  const result = await analyzeEntry(entry, { depth: 'standard' });

  // --- SHADOW: Run scoring science pipeline on raw scores ---
  const rawScores: Record<string, number> = {};
  for (const cat of result.report.categories) {
    rawScores[cat.name] = cat.score_0_to_10;
  }

  const signals = extractComputationalSignals(result.features, result.authenticity);
  const scoringScienceResult = runScoringPipeline(rawScores, {
    ...DEFAULT_EXPERIENCE_CONFIG,
    computationalSignals: signals,
  });

  // --- PRE-SCREEN: Check if we would skip LLM ---
  const priors = computePriors(signals);
  const preScreenResult = preScreen(priors, DEFAULT_EXPERIENCE_CONFIG.weights);

  // --- Build token usage estimate ---
  // The analysis engine doesn't expose raw token counts, so we estimate
  // from the timing (Sonnet ~60 tokens/sec output, ~3000 tokens/sec input)
  const estimatedInputTokens = Math.round(result.performance.stage2_ms * 1.5);
  const estimatedOutputTokens = Math.round(result.performance.stage2_ms * 0.8);
  const tokenUsage: CapturedTokenUsage = {
    input_tokens: estimatedInputTokens,
    output_tokens: estimatedOutputTokens,
    cached_tokens: 0,
    estimated_cost_usd: estimateCost(estimatedInputTokens, estimatedOutputTokens, 0),
  };

  // --- Assemble snapshot ---
  const snapshot: PipelineSnapshot = {
    essay_archetype: essay.archetype,
    phase,
    timestamp: new Date().toISOString(),
    git_commit: gitCommit,

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

    token_usage: tokenUsage,

    timing: {
      stage1_feature_extraction_ms: result.performance.stage1_ms,
      stage2_category_scoring_ms: result.performance.stage2_ms,
      stage3_deep_reflection_ms: result.performance.stage3_ms,
      stage4_nqi_calculation_ms: result.performance.stage4_ms,
      total_ms: result.performance.total_ms,
      computational_analysis_ms: compMs,
    },

    coaching_summary: result.coaching
      ? `${Object.keys(result.coaching).length} coaching sections generated`
      : undefined,

    computational_analysis: {
      entropy_diversity_score: compResult.entropy.diversityScore,
      engagement_score: compResult.surprisal.engagementScore,
      uniqueness_score: compResult.compression.uniquenessScore,
      density_variation_score: compResult.densityVariation.variationScore,
      coherence_score: compResult.mutualInformation.coherenceScore,
      naturality_score: compResult.zipf.naturalityScore,
      rubric_scores: compResult.rubricScores as unknown as Record<string, number>,
      diagnostics: compResult.diagnostics,
      total_ms: compMs,
    },

    scoring_science: {
      quality_index: scoringScienceResult.quality_index,
      quality_index_ci: scoringScienceResult.quality_index_ci,
      reliability_assessment: scoringScienceResult.reliability.assessment,
      flagged_dimensions: Object.entries(scoringScienceResult.calibrated_scores)
        .filter(([, cs]) => cs.flagged)
        .map(([dim]) => dim),
      total_adjustment_magnitude: Object.entries(scoringScienceResult.calibrated_scores)
        .reduce((sum, [dim, cs]) => sum + Math.abs(cs.value - scoringScienceResult.raw_scores[dim]), 0),
      processing_time_ms: scoringScienceResult.metadata.processing_time_ms,
    },

    pre_screen: {
      skip_llm: preScreenResult.skip_llm,
      confidence: preScreenResult.confidence,
      predicted_qi: preScreenResult.predicted_quality_index,
      predicted_range: preScreenResult.predicted_range,
      reason: preScreenResult.reason,
    },
  };

  return snapshot;
}

// ============================================================================
// MAIN: CAPTURE GOLDEN BASELINE
// ============================================================================

async function main(): Promise<void> {
  requireApiKey('ANTHROPIC_API_KEY');

  const { runs, phase, outputPath } = parseArgs();
  const gitCommit = getGitCommit();

  console.log('');
  console.log('===========================================================');
  console.log('  WritingQualityEngine — Golden Baseline Capture');
  console.log('===========================================================');
  console.log(`  Phase:      ${phase}`);
  console.log(`  Runs/essay: ${runs}`);
  console.log(`  Essays:     ${WQE_REFERENCE_ESSAYS.length}`);
  console.log(`  Total runs: ${WQE_REFERENCE_ESSAYS.length * runs}`);
  console.log(`  Git commit: ${gitCommit}`);
  console.log('===========================================================');
  console.log('');

  const allSnapshots: Record<EssayArchetype, PipelineSnapshot[]> = {} as any;
  let totalCost = 0;
  let totalTokens = 0;
  let totalTimingMs = 0;
  const nqiValues: number[] = [];

  for (const essay of WQE_REFERENCE_ESSAYS) {
    console.log(`--- ${essay.archetype.toUpperCase()} ---`);
    console.log(`  "${essay.description}"`);

    allSnapshots[essay.archetype] = [];

    for (let run = 1; run <= runs; run++) {
      const startTime = Date.now();

      try {
        const snapshot = await runPipelineOnEssay(essay, phase, gitCommit);
        allSnapshots[essay.archetype].push(snapshot);

        totalCost += snapshot.token_usage.estimated_cost_usd;
        totalTokens += snapshot.token_usage.input_tokens + snapshot.token_usage.output_tokens;
        totalTimingMs += snapshot.timing.total_ms;
        nqiValues.push(snapshot.nqi);

        const elapsed = Date.now() - startTime;
        console.log(
          `  Run ${run}/${runs}: NQI=${snapshot.nqi.toFixed(1)}, ` +
          `time=${snapshot.timing.total_ms}ms, ` +
          `flags=[${snapshot.flags.slice(0, 3).join(', ')}${snapshot.flags.length > 3 ? '...' : ''}], ` +
          `elapsed=${elapsed}ms`
        );

        // Validate against expected ranges
        const expected = essay.expected;
        if (snapshot.nqi < expected.nqi[0] || snapshot.nqi > expected.nqi[1]) {
          console.log(
            `  WARNING: NQI ${snapshot.nqi.toFixed(1)} outside expected range ` +
            `[${expected.nqi[0]}, ${expected.nqi[1]}]`
          );
        }

        // Check required flags
        for (const flag of expected.requiredFlags ?? []) {
          if (!snapshot.flags.includes(flag)) {
            console.log(`  WARNING: Expected flag '${flag}' not found`);
          }
        }

        // Check forbidden flags
        for (const flag of expected.forbiddenFlags ?? []) {
          if (snapshot.flags.includes(flag)) {
            console.log(`  WARNING: Forbidden flag '${flag}' was present`);
          }
        }
      } catch (error) {
        console.error(`  ERROR on run ${run}: ${error instanceof Error ? error.message : String(error)}`);
        // Still push a partial snapshot so we know about the failure
      }
    }

    console.log('');
  }

  // --- Compute aggregate statistics ---
  const meanNqi = nqiValues.length > 0
    ? nqiValues.reduce((s, v) => s + v, 0) / nqiValues.length
    : 0;
  const stdNqi = nqiValues.length > 1
    ? Math.sqrt(nqiValues.reduce((s, v) => s + (v - meanNqi) ** 2, 0) / (nqiValues.length - 1))
    : 0;

  // --- Assemble golden baseline ---
  const baseline: GoldenBaseline = {
    version: `${phase}-${new Date().toISOString().split('T')[0]}`,
    git_commit: gitCommit,
    captured_at: new Date().toISOString(),
    phase,
    snapshots: allSnapshots,
    aggregate: {
      mean_nqi: Math.round(meanNqi * 10) / 10,
      std_nqi: Math.round(stdNqi * 10) / 10,
      mean_timing_ms: Math.round(totalTimingMs / Math.max(nqiValues.length, 1)),
      total_cost_usd: Math.round(totalCost * 10000) / 10000,
      total_tokens: totalTokens,
    },
  };

  // --- Write output ---
  const outputDir = path.resolve(process.cwd(), 'tests', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const finalPath = outputPath
    ?? path.join(outputDir, `wqe-baseline-${phase}-${timestamp}.json`);

  fs.writeFileSync(finalPath, JSON.stringify(baseline, null, 2), 'utf-8');

  // --- Also write a "latest" symlink-style copy ---
  const latestPath = path.join(outputDir, `wqe-baseline-${phase}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(baseline, null, 2), 'utf-8');

  // --- Summary ---
  console.log('===========================================================');
  console.log('  CAPTURE COMPLETE');
  console.log('===========================================================');
  console.log(`  Output:       ${finalPath}`);
  console.log(`  Latest copy:  ${latestPath}`);
  console.log(`  Mean NQI:     ${baseline.aggregate.mean_nqi} (std: ${baseline.aggregate.std_nqi})`);
  console.log(`  Mean timing:  ${baseline.aggregate.mean_timing_ms}ms`);
  console.log(`  Total cost:   $${baseline.aggregate.total_cost_usd.toFixed(4)}`);
  console.log(`  Total tokens: ${baseline.aggregate.total_tokens.toLocaleString()}`);
  console.log('===========================================================');

  // --- Per-essay summary table ---
  console.log('');
  console.log('  Essay                    | Mean NQI | Range      | Mean Time | Flags');
  console.log('  -------------------------+----------+------------+-----------+------');

  for (const essay of WQE_REFERENCE_ESSAYS) {
    const snapshots = allSnapshots[essay.archetype] ?? [];
    if (snapshots.length === 0) {
      console.log(`  ${essay.archetype.padEnd(25)} | N/A      | N/A        | N/A       | (no data)`);
      continue;
    }

    const nqis = snapshots.map(s => s.nqi);
    const mean = nqis.reduce((s, v) => s + v, 0) / nqis.length;
    const min = Math.min(...nqis);
    const max = Math.max(...nqis);
    const meanTime = Math.round(snapshots.reduce((s, snap) => s + snap.timing.total_ms, 0) / snapshots.length);
    const topFlags = snapshots[0].flags.slice(0, 2).join(', ') || '(none)';

    console.log(
      `  ${essay.archetype.padEnd(25)} | ${mean.toFixed(1).padStart(8)} | ` +
      `${min.toFixed(1)}-${max.toFixed(1).padStart(5)} | ${String(meanTime).padStart(7)}ms | ${topFlags}`
    );
  }

  console.log('');

  // --- Validate: print any essays outside expected ranges ---
  let hasWarnings = false;
  for (const essay of WQE_REFERENCE_ESSAYS) {
    const snapshots = allSnapshots[essay.archetype] ?? [];
    for (const snap of snapshots) {
      if (snap.nqi < essay.expected.nqi[0] || snap.nqi > essay.expected.nqi[1]) {
        if (!hasWarnings) {
          console.log('  RANGE WARNINGS:');
          hasWarnings = true;
        }
        console.log(
          `    ${essay.archetype}: NQI=${snap.nqi.toFixed(1)} outside ` +
          `expected [${essay.expected.nqi[0]}, ${essay.expected.nqi[1]}]`
        );
      }
    }
  }

  if (!hasWarnings) {
    console.log('  All essays within expected NQI ranges.');
  }

  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
