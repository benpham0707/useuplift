/**
 * Annotation Pipeline V2 — Quality Scorer
 *
 * The core quality comparison engine for the calibration system.
 * Scores pipeline results against expert ratings, compares runs
 * against baselines, and enforces quality gates per cathedral layer.
 *
 * Usage:
 *   import { qualityScorer } from './qualityScorer';
 *   const result = qualityScorer.scoreResult(pipelineOutput, expertRating);
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  AnnotatedAnalysisResult,
  EssayAnnotation,
} from '../../src/pipeline/types';
import type {
  CalibrationEssay,
  CalibrationResult,
  CalibrationBaseline,
  CalibrationComparison,
  CalibrationSummary,
  EssayComparison,
  ComparisonVerdict,
  QualityGateResult,
  SeverityDistribution,
  V2DimensionId,
} from './types';
import { V2_DIMENSIONS, QUALITY_GATE_THRESHOLDS, mapV1ScoresToV2 } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_V2_DIMENSIONS = Object.keys(V2_DIMENSIONS).length; // 10

/** Regression thresholds for comparison */
const DIMENSION_REGRESSION_WARN_THRESHOLD = 0.10; // 10% MAE increase = warning
const DIMENSION_REGRESSION_FAIL_THRESHOLD = 0.15; // 15% MAE increase = failure

// ============================================================================
// QUALITY SCORER
// ============================================================================

export class QualityScorer {
  // ==========================================================================
  // EXPERT RATING LOADING
  // ==========================================================================

  /**
   * Load expert ratings from the JSON file.
   * Falls back to empty array if file doesn't exist.
   */
  loadExpertRatings(): CalibrationEssay[] {
    const ratingsPath = path.resolve(__dirname, 'expert-ratings.json');

    if (!fs.existsSync(ratingsPath)) {
      console.warn(
        '[QualityScorer] expert-ratings.json not found. Run calibration setup first.',
      );
      return [];
    }

    const raw = fs.readFileSync(ratingsPath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('expert-ratings.json must contain a JSON array of CalibrationEssay objects');
    }

    return parsed as CalibrationEssay[];
  }

  /**
   * Load a saved baseline from JSON file.
   * Returns null if file doesn't exist or is a placeholder.
   */
  loadBaseline(baselinePath?: string): CalibrationBaseline | null {
    const resolvedPath = baselinePath
      ? path.resolve(baselinePath)
      : path.resolve(__dirname, 'baseline.json');

    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw) as CalibrationBaseline;

    // Placeholder baseline has no results
    if (!parsed.results || parsed.results.length === 0) {
      return null;
    }

    return parsed;
  }

  /**
   * Save baseline to JSON file.
   */
  saveBaseline(baseline: CalibrationBaseline, baselinePath?: string): void {
    const resolvedPath = baselinePath
      ? path.resolve(baselinePath)
      : path.resolve(__dirname, 'baseline.json');

    fs.writeFileSync(resolvedPath, JSON.stringify(baseline, null, 2), 'utf-8');
  }

  // ==========================================================================
  // SINGLE RESULT SCORING
  // ==========================================================================

  /**
   * Score a single pipeline result against expert ratings.
   *
   * Handles both V1 (13-dim) and V2 (10-dim) pipeline outputs by mapping
   * dimension IDs appropriately.
   */
  scoreResult(
    result: AnnotatedAnalysisResult,
    expert: CalibrationEssay,
    pipelineVersion: string = 'v1',
  ): CalibrationResult {
    const timestamp = new Date().toISOString();

    // Build dimension score map from pipeline result
    const actualScores: Record<string, number> = {};
    for (const ds of result.dimensionScores) {
      actualScores[ds.dimensionId] = ds.score;
    }

    // If pipeline produced V1 dimensions, map to V2 for comparison
    const isV1Output = result.dimensionScores.some(
      (ds) => ds.dimensionId === 'narrative_craft_storytelling',
    );
    const mappedScores = isV1Output ? mapV1ScoresToV2(actualScores) : actualScores;

    // Compare each expert-rated dimension
    const dimensionErrors: CalibrationResult['dimensionErrors'] = {};
    const errors: number[] = [];

    for (const [dimId, expertRating] of Object.entries(expert.dimensions)) {
      const actual = mappedScores[dimId as V2DimensionId];
      if (actual === null || actual === undefined) {
        // New V2 dimension with no V1 mapping — skip for V1 comparisons
        continue;
      }

      const error = Math.abs(actual - expertRating.score);
      dimensionErrors[dimId] = {
        actual,
        expected: expertRating.score,
        error,
      };
      errors.push(error);
    }

    const meanAbsoluteError =
      errors.length > 0
        ? Math.round((errors.reduce((a, b) => a + b, 0) / errors.length) * 100) / 100
        : 0;

    // Score annotation quality
    const annotationQuality = this.scoreAnnotationQuality(result.annotations);

    // EQI comparison
    const eqiError = Math.abs(result.eqi - expert.expectedEQI);

    return {
      essayId: expert.id,
      pipelineVersion,
      timestamp,

      eqiActual: result.eqi,
      eqiExpected: expert.expectedEQI,
      eqiError,

      dimensionErrors,
      meanAbsoluteError,

      annotationCount: result.annotations.length,
      dimensionCoverage: annotationQuality.dimensionCoverage,
      severityDistribution: annotationQuality.severityDistribution,
      strengthRatio: annotationQuality.strengthRatio,

      insightSpecificity: annotationQuality.insightSpecificity,
      suggestionActionability: annotationQuality.suggestionActionability,

      latencyMs: result.meta.timing.totalPipeline ?? result.meta.timing.total ?? 0,
      costUSD: result.meta.costUSD,
    };
  }

  // ==========================================================================
  // ANNOTATION QUALITY SCORING
  // ==========================================================================

  /**
   * Score the quality of annotations (not just scores, but feedback quality).
   *
   * Measures:
   * - dimensionCoverage: how many unique dimensions are represented
   * - severityDistribution: balance across severity levels
   * - strengthRatio: fraction of annotations that are strengths (target ~0.35)
   * - insightSpecificity: do insights reference specific text?
   * - suggestionActionability: are suggestions concrete?
   */
  scoreAnnotationQuality(annotations: EssayAnnotation[]): {
    dimensionCoverage: number;
    severityDistribution: SeverityDistribution;
    strengthRatio: number;
    insightSpecificity: number;
    suggestionActionability: number;
  } {
    if (annotations.length === 0) {
      return {
        dimensionCoverage: 0,
        severityDistribution: { critical: 0, important: 0, suggestion: 0, strength: 0 },
        strengthRatio: 0,
        insightSpecificity: 0,
        suggestionActionability: 0,
      };
    }

    // Dimension coverage
    const uniqueDimensions = new Set(annotations.map((a) => a.dimensionId));
    const dimensionCoverage = uniqueDimensions.size / TOTAL_V2_DIMENSIONS;

    // Severity distribution
    const severityDistribution: SeverityDistribution = {
      critical: 0,
      important: 0,
      suggestion: 0,
      strength: 0,
    };
    for (const a of annotations) {
      if (a.isStrength || a.severity === 'strength') {
        severityDistribution.strength++;
      } else if (a.severity in severityDistribution) {
        severityDistribution[a.severity as keyof SeverityDistribution]++;
      }
    }

    // Strength ratio
    const strengthRatio = severityDistribution.strength / annotations.length;

    // Insight specificity: check if insights reference specific essay text
    const insightSpecificity = this.measureInsightSpecificity(annotations);

    // Suggestion actionability: check if suggestions are concrete
    const suggestionActionability = this.measureSuggestionActionability(annotations);

    return {
      dimensionCoverage,
      severityDistribution,
      strengthRatio,
      insightSpecificity,
      suggestionActionability,
    };
  }

  /**
   * Measure how specific insights are (0-1).
   *
   * Heuristics:
   * - Contains quotation marks (referencing specific text): +0.3
   * - Contains "your phrase/word/sentence": +0.2
   * - References character offsets or paragraph numbers: +0.1
   * - Length > 50 chars (substantive, not boilerplate): +0.2
   * - Contains specific literary/writing terms: +0.2
   */
  private measureInsightSpecificity(annotations: EssayAnnotation[]): number {
    if (annotations.length === 0) return 0;

    let totalScore = 0;

    for (const a of annotations) {
      let score = 0;
      const insight = a.insight || '';

      // Quotation marks — referencing specific text
      if (/[""\u201C\u201D]/.test(insight)) {
        score += 0.3;
      }

      // Phrases like "your phrase", "your word", "this sentence"
      if (/\b(your|this|the)\s+(phrase|word|sentence|line|paragraph|opening|closing|passage)\b/i.test(insight)) {
        score += 0.2;
      }

      // References offsets or paragraph numbers
      if (/paragraph\s+\d|sentence\s+\d|line\s+\d|offset/i.test(insight)) {
        score += 0.1;
      }

      // Substantive length
      if (insight.length > 50) {
        score += 0.2;
      }

      // Writing-specific terms (not generic praise)
      if (/\b(metaphor|imagery|diction|syntax|tone|voice|pacing|rhythm|arc|motif|juxtaposition|anaphora|parallelism|enjambment|alliteration|sensory|concrete|abstract|showing|telling)\b/i.test(insight)) {
        score += 0.2;
      }

      totalScore += Math.min(score, 1.0);
    }

    return Math.round((totalScore / annotations.length) * 100) / 100;
  }

  /**
   * Measure how actionable suggestions are (0-1).
   *
   * Heuristics:
   * - Contains imperative verbs (try, consider, replace, add, remove, etc.): +0.25
   * - Contains "instead of" or "rather than" (comparative): +0.2
   * - Contains a rewrite example: +0.3
   * - Length > 30 chars (substantive): +0.15
   * - Contains specific noun (not just generic advice): +0.1
   */
  private measureSuggestionActionability(annotations: EssayAnnotation[]): number {
    if (annotations.length === 0) return 0;

    let totalScore = 0;

    for (const a of annotations) {
      let score = 0;
      const suggestion = a.suggestion || '';

      // Imperative verbs
      if (/\b(try|consider|replace|add|remove|cut|expand|rewrite|rephrase|strengthen|deepen|show|include|avoid|delete|swap|shift|merge|split|combine)\b/i.test(suggestion)) {
        score += 0.25;
      }

      // Comparative suggestions
      if (/\b(instead of|rather than|in place of|swap .+ for|replace .+ with)\b/i.test(suggestion)) {
        score += 0.2;
      }

      // Has rewrite example
      if (a.rewriteExample && a.rewriteExample.length > 10) {
        score += 0.3;
      }

      // Substantive length
      if (suggestion.length > 30) {
        score += 0.15;
      }

      // Contains a specific noun (not just "this" or "it")
      if (/\b(sentence|paragraph|phrase|word|metaphor|detail|scene|moment|example|evidence|image|verb|adjective|opening|closing|transition)\b/i.test(suggestion)) {
        score += 0.1;
      }

      totalScore += Math.min(score, 1.0);
    }

    return Math.round((totalScore / annotations.length) * 100) / 100;
  }

  // ==========================================================================
  // BASELINE COMPARISON
  // ==========================================================================

  /**
   * Compare current calibration results against a stored baseline.
   */
  compare(
    current: CalibrationResult[],
    baseline: CalibrationBaseline,
  ): CalibrationComparison {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const perEssay: EssayComparison[] = [];

    // Build baseline index by essay ID
    const baselineIndex = new Map<string, CalibrationResult>();
    for (const r of baseline.results) {
      baselineIndex.set(r.essayId, r);
    }

    // Compare each current result against baseline
    for (const curr of current) {
      const base = baselineIndex.get(curr.essayId);
      if (!base) {
        perEssay.push({
          essayId: curr.essayId,
          eqiImproved: true, // new essay, no regression possible
          maeImproved: true,
          baselineEQIError: 0,
          currentEQIError: curr.eqiError,
          baselineMAE: 0,
          currentMAE: curr.meanAbsoluteError,
          details: 'New essay — no baseline comparison available',
        });
        continue;
      }

      const eqiImproved = curr.eqiError < base.eqiError;
      const maeImproved = curr.meanAbsoluteError < base.meanAbsoluteError;

      // Check per-dimension regressions
      const dimRegressions: string[] = [];
      for (const [dimId, currDim] of Object.entries(curr.dimensionErrors)) {
        const baseDim = base.dimensionErrors[dimId];
        if (!baseDim) continue;

        if (baseDim.error > 0 && currDim.error > baseDim.error) {
          const regressionPct = (currDim.error - baseDim.error) / baseDim.error;
          if (regressionPct > DIMENSION_REGRESSION_FAIL_THRESHOLD) {
            dimRegressions.push(
              `${dimId}: error ${baseDim.error.toFixed(1)} → ${currDim.error.toFixed(1)} (+${(regressionPct * 100).toFixed(0)}%)`,
            );
          }
        }
      }

      let details = '';
      if (eqiImproved && maeImproved) {
        details = `EQI error: ${base.eqiError.toFixed(1)} → ${curr.eqiError.toFixed(1)}, MAE: ${base.meanAbsoluteError.toFixed(1)} → ${curr.meanAbsoluteError.toFixed(1)}`;
        improvements.push(`${curr.essayId}: ${details}`);
      } else if (!eqiImproved && !maeImproved) {
        details = `REGRESSION — EQI error: ${base.eqiError.toFixed(1)} → ${curr.eqiError.toFixed(1)}, MAE: ${base.meanAbsoluteError.toFixed(1)} → ${curr.meanAbsoluteError.toFixed(1)}`;
        regressions.push(`${curr.essayId}: ${details}`);
      } else {
        details = `MIXED — EQI err: ${base.eqiError.toFixed(1)} → ${curr.eqiError.toFixed(1)} (${eqiImproved ? 'better' : 'worse'}), MAE: ${base.meanAbsoluteError.toFixed(1)} → ${curr.meanAbsoluteError.toFixed(1)} (${maeImproved ? 'better' : 'worse'})`;
      }

      if (dimRegressions.length > 0) {
        details += ` | Dim regressions: ${dimRegressions.join(', ')}`;
        regressions.push(`${curr.essayId} dims: ${dimRegressions.join(', ')}`);
      }

      perEssay.push({
        essayId: curr.essayId,
        eqiImproved,
        maeImproved,
        baselineEQIError: base.eqiError,
        currentEQIError: curr.eqiError,
        baselineMAE: base.meanAbsoluteError,
        currentMAE: curr.meanAbsoluteError,
        details,
      });
    }

    // Determine verdict
    let verdict: ComparisonVerdict;
    if (regressions.length === 0 && improvements.length > 0) {
      verdict = 'improved';
    } else if (regressions.length > 0 && improvements.length === 0) {
      verdict = 'regressed';
    } else if (regressions.length > 0 && improvements.length > 0) {
      verdict = 'mixed';
    } else {
      verdict = 'unchanged';
    }

    return {
      baselineVersion: baseline.version,
      currentVersion: current[0]?.pipelineVersion ?? 'unknown',
      improvements,
      regressions,
      perEssay,
      verdict,
    };
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  /**
   * Generate a human-readable comparison report.
   */
  generateReport(comparison: CalibrationComparison): string {
    const lines: string[] = [];
    const hr = '='.repeat(76);
    const thinHr = '-'.repeat(76);

    lines.push(hr);
    lines.push('  CALIBRATION COMPARISON REPORT');
    lines.push(`  Baseline: ${comparison.baselineVersion} vs Current: ${comparison.currentVersion}`);
    lines.push(hr);

    // Verdict banner
    const verdictEmoji = {
      improved: 'PASS',
      regressed: 'FAIL',
      mixed: 'MIXED',
      unchanged: 'UNCHANGED',
    };
    lines.push(`\n  Verdict: ${verdictEmoji[comparison.verdict]} (${comparison.verdict.toUpperCase()})`);

    // Per-essay table
    lines.push(`\n${thinHr}`);
    lines.push(
      '  ' +
        'Essay'.padEnd(35) +
        'EQI Err'.padStart(10) +
        'MAE'.padStart(8) +
        'Delta'.padStart(8) +
        'Status'.padStart(10),
    );
    lines.push(`  ${thinHr.substring(2)}`);

    for (const essay of comparison.perEssay) {
      const eqiDelta = essay.baselineEQIError > 0
        ? essay.currentEQIError - essay.baselineEQIError
        : 0;
      const label =
        essay.essayId.length > 32
          ? essay.essayId.substring(0, 29) + '...'
          : essay.essayId;

      const status = essay.eqiImproved && essay.maeImproved
        ? 'OK'
        : !essay.eqiImproved && !essay.maeImproved
          ? 'REGRESSED'
          : 'MIXED';

      lines.push(
        '  ' +
          label.padEnd(35) +
          essay.currentEQIError.toFixed(1).padStart(10) +
          essay.currentMAE.toFixed(1).padStart(8) +
          ((eqiDelta >= 0 ? '+' : '') + eqiDelta.toFixed(1)).padStart(8) +
          status.padStart(10),
      );
    }

    // Improvements
    if (comparison.improvements.length > 0) {
      lines.push(`\n  Improvements (${comparison.improvements.length}):`);
      for (const imp of comparison.improvements) {
        lines.push(`    + ${imp}`);
      }
    }

    // Regressions
    if (comparison.regressions.length > 0) {
      lines.push(`\n  Regressions (${comparison.regressions.length}):`);
      for (const reg of comparison.regressions) {
        lines.push(`    - ${reg}`);
      }
    }

    lines.push(`\n${hr}`);
    return lines.join('\n');
  }

  // ==========================================================================
  // QUALITY GATES
  // ==========================================================================

  /**
   * Check quality gates for a given cathedral layer.
   *
   * Layer 0: Calibration suite runs without errors. Baseline committed.
   * Layer 1: Overall quality >=15% above baseline. Per-dimension <=8pt of expert.
   * Layer 2: Overall quality >=10% above L1. Structure arc correct 8/10.
   * Layer 3: Overall quality >=8% above L2. Deep dive teaching >=4.0/5.0.
   * Layer 4: First annotation <3s. Heuristic scores <500ms.
   * Layer 5: After 1 month, EQI error >=10% below L4.
   */
  checkQualityGates(
    results: CalibrationResult[],
    baseline: CalibrationBaseline | null,
    layer: number,
  ): QualityGateResult {
    const thresholds = QUALITY_GATE_THRESHOLDS[layer];
    if (!thresholds) {
      return {
        passed: false,
        failures: [`Unknown layer ${layer}. Valid layers: 0-5.`],
        passes: [],
        layer,
      };
    }

    const failures: string[] = [];
    const passes: string[] = [];

    // -- Gate: Suite runs without errors (Layer 0+) --
    if (results.length === 0) {
      failures.push('No calibration results to check. Run the calibration suite first.');
      return { passed: false, failures, passes, layer };
    }
    passes.push(`Calibration suite ran successfully (${results.length} essays)`);

    // -- Gate: Compute summary stats --
    const summary = this.computeSummary(results);

    // -- Gate: Overall MAE vs baseline (Layer 1+) --
    if (layer >= 1 && baseline && baseline.summary.overallMAE !== null) {
      const baselineMAE = baseline.summary.overallMAE;
      const currentMAE = summary.overallMAE ?? 0;
      const improvementFraction = baselineMAE > 0
        ? (baselineMAE - currentMAE) / baselineMAE
        : 0;

      if (improvementFraction >= thresholds.maxMaeRegressionFraction) {
        passes.push(
          `Overall MAE improved ${(improvementFraction * 100).toFixed(1)}% vs baseline (required: ${(thresholds.maxMaeRegressionFraction * 100).toFixed(0)}%)`,
        );
      } else {
        failures.push(
          `Overall MAE improvement ${(improvementFraction * 100).toFixed(1)}% < required ${(thresholds.maxMaeRegressionFraction * 100).toFixed(0)}% (baseline: ${baselineMAE.toFixed(1)}, current: ${(currentMAE ?? 0).toFixed(1)})`,
        );
      }
    }

    // -- Gate: Per-dimension MAE (Layer 1+) --
    if (layer >= 1) {
      for (const [dimId, mae] of Object.entries(summary.perDimensionMAE)) {
        if (mae <= thresholds.maxPerDimensionMAE) {
          passes.push(`${dimId}: MAE ${mae.toFixed(1)} <= ${thresholds.maxPerDimensionMAE}`);
        } else {
          failures.push(
            `${dimId}: MAE ${mae.toFixed(1)} > max ${thresholds.maxPerDimensionMAE}`,
          );
        }
      }
    }

    // -- Gate: Dimension coverage (Layer 1+) --
    if (layer >= 1) {
      if (summary.avgDimensionCoverage >= thresholds.minDimensionCoverage) {
        passes.push(
          `Avg dimension coverage ${(summary.avgDimensionCoverage * 100).toFixed(0)}% >= ${(thresholds.minDimensionCoverage * 100).toFixed(0)}%`,
        );
      } else {
        failures.push(
          `Avg dimension coverage ${(summary.avgDimensionCoverage * 100).toFixed(0)}% < required ${(thresholds.minDimensionCoverage * 100).toFixed(0)}%`,
        );
      }
    }

    // -- Gate: Annotation count (Layer 1+) --
    if (layer >= 1) {
      if (summary.avgAnnotationCount >= thresholds.minAnnotationCount) {
        passes.push(
          `Avg annotation count ${summary.avgAnnotationCount.toFixed(1)} >= ${thresholds.minAnnotationCount}`,
        );
      } else {
        failures.push(
          `Avg annotation count ${summary.avgAnnotationCount.toFixed(1)} < required ${thresholds.minAnnotationCount}`,
        );
      }
    }

    // -- Gate: Strength ratio (Layer 1+) --
    if (layer >= 1) {
      if (
        summary.avgStrengthRatio >= thresholds.minStrengthRatio &&
        summary.avgStrengthRatio <= thresholds.maxStrengthRatio
      ) {
        passes.push(
          `Avg strength ratio ${(summary.avgStrengthRatio * 100).toFixed(0)}% within [${(thresholds.minStrengthRatio * 100).toFixed(0)}%, ${(thresholds.maxStrengthRatio * 100).toFixed(0)}%]`,
        );
      } else {
        failures.push(
          `Avg strength ratio ${(summary.avgStrengthRatio * 100).toFixed(0)}% outside [${(thresholds.minStrengthRatio * 100).toFixed(0)}%, ${(thresholds.maxStrengthRatio * 100).toFixed(0)}%]`,
        );
      }
    }

    // -- Gate: Latency (Layer 4+) --
    if (layer >= 4) {
      if (summary.avgLatencyMs <= thresholds.maxLatencyMs) {
        passes.push(
          `Avg latency ${summary.avgLatencyMs.toFixed(0)}ms <= ${thresholds.maxLatencyMs}ms`,
        );
      } else {
        failures.push(
          `Avg latency ${summary.avgLatencyMs.toFixed(0)}ms > max ${thresholds.maxLatencyMs}ms`,
        );
      }
    }

    return {
      passed: failures.length === 0,
      failures,
      passes,
      layer,
    };
  }

  // ==========================================================================
  // SUMMARY COMPUTATION
  // ==========================================================================

  /**
   * Compute aggregate summary stats from individual calibration results.
   */
  computeSummary(results: CalibrationResult[]): CalibrationSummary {
    if (results.length === 0) {
      return {
        overallMAE: null,
        perDimensionMAE: {},
        avgAnnotationCount: 0,
        avgDimensionCoverage: 0,
        avgStrengthRatio: 0,
        avgLatencyMs: 0,
        avgCostUSD: 0,
        totalCostUSD: 0,
      };
    }

    const n = results.length;

    // Overall MAE
    const totalMAE = results.reduce((sum, r) => sum + r.meanAbsoluteError, 0);
    const overallMAE = Math.round((totalMAE / n) * 100) / 100;

    // Per-dimension MAE
    const dimErrorSums: Record<string, { sum: number; count: number }> = {};
    for (const r of results) {
      for (const [dimId, dimErr] of Object.entries(r.dimensionErrors)) {
        if (!dimErrorSums[dimId]) {
          dimErrorSums[dimId] = { sum: 0, count: 0 };
        }
        dimErrorSums[dimId].sum += dimErr.error;
        dimErrorSums[dimId].count += 1;
      }
    }

    const perDimensionMAE: Record<string, number> = {};
    for (const [dimId, { sum, count }] of Object.entries(dimErrorSums)) {
      perDimensionMAE[dimId] = Math.round((sum / count) * 100) / 100;
    }

    // Averages
    const avgAnnotationCount =
      Math.round((results.reduce((s, r) => s + r.annotationCount, 0) / n) * 10) / 10;
    const avgDimensionCoverage =
      Math.round((results.reduce((s, r) => s + r.dimensionCoverage, 0) / n) * 100) / 100;
    const avgStrengthRatio =
      Math.round((results.reduce((s, r) => s + r.strengthRatio, 0) / n) * 100) / 100;
    const avgLatencyMs =
      Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / n);
    const totalCostUSD =
      Math.round(results.reduce((s, r) => s + r.costUSD, 0) * 10000) / 10000;
    const avgCostUSD = Math.round((totalCostUSD / n) * 10000) / 10000;

    return {
      overallMAE,
      perDimensionMAE,
      avgAnnotationCount,
      avgDimensionCoverage,
      avgStrengthRatio,
      avgLatencyMs,
      avgCostUSD,
      totalCostUSD,
    };
  }

  // ==========================================================================
  // BUILD BASELINE
  // ==========================================================================

  /**
   * Build a CalibrationBaseline object from results.
   */
  buildBaseline(
    results: CalibrationResult[],
    version: string,
    pipelineVersion: string,
  ): CalibrationBaseline {
    return {
      version,
      timestamp: new Date().toISOString(),
      pipelineVersion,
      results,
      summary: this.computeSummary(results),
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const qualityScorer = new QualityScorer();
