/**
 * run-checkpoint3-ab.ts — Wave-3a Checkpoint 3 A/B harness.
 *
 * Runs the 8-fixture A/B test from Phase 3A spec §A/B test protocol.
 *
 * Protocol:
 *   For each of the 8 fixture essays:
 *     CONTROL  — run full analysis with ENABLE_CORPUS_RETRIEVAL_L35 unset
 *     TREATMENT — run full analysis with ENABLE_CORPUS_RETRIEVAL_L35=true
 *   Each run writes corpus telemetry records to a dedicated JSONL file.
 *   After both arms complete, compute metrics and emit a summary report.
 *
 * Metrics computed (from Phase 3A spec):
 *   1. Score correlation — treatment vs control paragraph effectiveness
 *   2. Citation density — [MOVE-#]/[AP-#] refs per 1000 output tokens
 *   3. Token inflation — input token delta
 *   4. Latency delta — wall time delta
 *   5. Hallucination rate — fabricated / referenced (must be ≤1%)
 *   6. Weakness specificity — NOT automated (requires blind human rating)
 *
 * Ship criteria (from spec): (1 OR improves AND (2,4,5,6) within bounds.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Running the harness
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Requires:
 *   - ANTHROPIC_API_KEY in env or .env.local
 *   - Optional: CHECKPOINT3_FIXTURES=<comma-sep-ids> to subset the 8
 *   - Optional: CHECKPOINT3_OUTPUT_DIR (default: tests/output/checkpoint3/)
 *
 * Warning: each essay runs L1→L5 twice. Budget ~$1-2 per essay × 8 × 2 = ~$16-32.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="..." npx tsx tests/corpus/run-checkpoint3-ab.ts
 *   CHECKPOINT3_FIXTURES=05-harvard-2028-i-too-can-dance npx tsx ...   # single-fixture smoke
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local BEFORE any service imports touch env.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

import type { PipelineResult } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_FIXTURE_IDS = [
  '05-harvard-2028-i-too-can-dance',
  '08-harvard-2028-cookies',
  '12-harvard-2028-three-years-alone',
  '03-hopkins-2028-korean-sticky-notes',
  '11-harvard-2028-fish-out-of-water',
  '06-harvard-2028-three-days-before-a-plane',
  '02-hopkins-2029-building-a-universe',
  '09-harvard-2028-bra-shopping',
];

const ESSAYS_DIR = path.join(
  __dirname,
  '..',
  'calibration',
  'top-tier-reference',
  'essays',
);

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'output', 'checkpoint3');

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface TelemetryRecord {
  timestamp: string;
  essayId: string;
  layer: string;
  featureFlagEnabled: boolean;
  retrievalAttempts: {
    anchor: { resultCount: number; latencyMs: number; injected: boolean; error: string | null } | null;
    perParagraph: Array<{
      resultCount: number;
      latencyMs: number;
      injected: boolean;
      error: string | null;
    }>;
    phaseAssessment: { resultCount: number; latencyMs: number; injected: boolean; error: string | null } | null;
    other: Array<{
      stage: string;
      resultCount: number;
      latencyMs: number;
      injected: boolean;
      error: string | null;
    }>;
  };
  attributionTest: {
    movesReferenced: number;
    antiPatternsReferenced: number;
    fabricatedReferences: string[];
  };
  fallbacksTriggered: Array<{ stage: string; reason: string }>;
  totalLatencyMs: number;
  corpusBlockTokens: number;
}

interface PerEssayMetrics {
  fixtureId: string;

  // Control (flag OFF)
  controlTimeMs: number;
  controlCost: number;
  controlInputTokens: number;
  controlOutputTokens: number;
  controlParagraphScores: number[];

  // Treatment (flag ON)
  treatmentTimeMs: number;
  treatmentCost: number;
  treatmentInputTokens: number;
  treatmentOutputTokens: number;
  treatmentParagraphScores: number[];

  // Telemetry-derived
  treatmentCorpusBlockTokens: number;
  treatmentCorpusLatencyMs: number;
  treatmentMovesReferenced: number;
  treatmentAntiPatternsReferenced: number;
  treatmentFabricated: number;

  // Errors
  controlError: string | null;
  treatmentError: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function readJsonl(filePath: string): Promise<TelemetryRecord[]> {
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as TelemetryRecord);
  } catch {
    return [];
  }
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatMs(n: number): string {
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

// ─────────────────────────────────────────────────────────────────────────
// Arm runner — lazy-imports the orchestrator so env vars apply freshly
// ─────────────────────────────────────────────────────────────────────────

interface ArmResult {
  timeMs: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  paragraphScores: number[];
  error: string | null;
}

async function runArm(
  fixtureId: string,
  essayText: string,
  flagEnabled: boolean,
  telemetryPath: string,
): Promise<ArmResult> {
  // Set feature flag + telemetry path BEFORE importing the orchestrator.
  if (flagEnabled) {
    process.env.ENABLE_CORPUS_RETRIEVAL_L35 = 'true';
  } else {
    delete process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  }
  process.env.CORPUS_TELEMETRY_PATH = telemetryPath;

  // Dynamic import so the orchestrator reads the current env on each arm.
  const mod = await import('../../src/services/essayIntelligence/analysis/analysisOrchestrator');
  const orchestrator = mod.analysisOrchestrator;

  const start = Date.now();
  try {
    const result: PipelineResult = await orchestrator.analyzeEssay({
      essayId: fixtureId,
      essayText,
      essayType: 'common_app',
      includeAnnotations: true, // include L5 so we measure that layer too
    });
    const timeMs = Date.now() - start;

    const profile = result.profile;
    // Extract paragraph effectiveness scores (L3.5 output).
    const scores = profile.paragraphs
      .map((p) => p.analysis?.paragraphEffectiveness ?? null)
      .filter((n): n is number => n !== null);

    // analyzeEssay may return a PARTIAL result when a layer fails — it
    // doesn't always throw. Surface partial-pipeline failures as arm errors
    // so the report reflects actual success/failure, not just "the call
    // returned without throwing".
    const layersFailed = result.layersFailed ?? [];
    const partialError =
      layersFailed.length > 0
        ? `pipeline partial — failed layers: ${layersFailed.map((f) => `${f.layer}(${f.message})`).join('; ')}`
        : null;

    return {
      timeMs,
      cost: result.costSummary.totalCost,
      inputTokens: result.costSummary.totalTokenUsage.inputTokens,
      outputTokens: result.costSummary.totalTokenUsage.outputTokens,
      paragraphScores: scores,
      error: partialError,
    };
  } catch (err) {
    const timeMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      timeMs,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      paragraphScores: [],
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Metrics aggregation
// ─────────────────────────────────────────────────────────────────────────

function computeTelemetryAggregates(records: TelemetryRecord[]): {
  totalBlockTokens: number;
  totalCorpusLatencyMs: number;
  totalMoves: number;
  totalAPs: number;
  totalFabricated: number;
} {
  let totalBlockTokens = 0;
  let totalCorpusLatencyMs = 0;
  let totalMoves = 0;
  let totalAPs = 0;
  let totalFabricated = 0;
  for (const r of records) {
    totalBlockTokens += r.corpusBlockTokens;
    totalCorpusLatencyMs += r.totalLatencyMs;
    totalMoves += r.attributionTest.movesReferenced;
    totalAPs += r.attributionTest.antiPatternsReferenced;
    totalFabricated += r.attributionTest.fabricatedReferences.length;
  }
  return { totalBlockTokens, totalCorpusLatencyMs, totalMoves, totalAPs, totalFabricated };
}

// ─────────────────────────────────────────────────────────────────────────
// Report rendering
// ─────────────────────────────────────────────────────────────────────────

function renderReport(results: PerEssayMetrics[]): string {
  const lines: string[] = [];
  lines.push('# Wave-3a Checkpoint 3 — A/B Results');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Fixtures: ${results.length}`);
  lines.push('');

  // Per-essay summary
  lines.push('## Per-essay summary');
  lines.push('');
  lines.push(
    '| Fixture | Control cost | Treatment cost | Δ latency | Score corr. | Moves ref. | APs ref. | Fabricated | Control err | Treatment err |',
  );
  lines.push(
    '|---|---|---|---|---|---|---|---|---|---|',
  );
  for (const r of results) {
    const dLat = r.treatmentTimeMs - r.controlTimeMs;
    const corr =
      r.controlParagraphScores.length === r.treatmentParagraphScores.length
        ? pearson(r.controlParagraphScores, r.treatmentParagraphScores).toFixed(3)
        : 'n/a';
    lines.push(
      `| ${r.fixtureId} | ${formatCost(r.controlCost)} | ${formatCost(r.treatmentCost)} | ${formatMs(dLat)} | ${corr} | ${r.treatmentMovesReferenced} | ${r.treatmentAntiPatternsReferenced} | ${r.treatmentFabricated} | ${r.controlError ?? ''} | ${r.treatmentError ?? ''} |`,
    );
  }
  lines.push('');

  // Aggregates
  const succeeded = results.filter((r) => !r.controlError && !r.treatmentError);
  if (succeeded.length > 0) {
    const totalControlCost = succeeded.reduce((s, r) => s + r.controlCost, 0);
    const totalTreatmentCost = succeeded.reduce((s, r) => s + r.treatmentCost, 0);
    const totalControlInput = succeeded.reduce((s, r) => s + r.controlInputTokens, 0);
    const totalTreatmentInput = succeeded.reduce((s, r) => s + r.treatmentInputTokens, 0);
    const totalControlOutput = succeeded.reduce((s, r) => s + r.controlOutputTokens, 0);
    const totalTreatmentOutput = succeeded.reduce((s, r) => s + r.treatmentOutputTokens, 0);
    const totalBlockTokens = succeeded.reduce((s, r) => s + r.treatmentCorpusBlockTokens, 0);
    const totalMoves = succeeded.reduce((s, r) => s + r.treatmentMovesReferenced, 0);
    const totalAPs = succeeded.reduce((s, r) => s + r.treatmentAntiPatternsReferenced, 0);
    const totalFab = succeeded.reduce((s, r) => s + r.treatmentFabricated, 0);
    const refsTotal = totalMoves + totalAPs;
    const hallucRate = refsTotal === 0 ? 0 : totalFab / refsTotal;

    // Score correlation mean
    const corrs = succeeded
      .map((r) =>
        r.controlParagraphScores.length === r.treatmentParagraphScores.length
          ? pearson(r.controlParagraphScores, r.treatmentParagraphScores)
          : null,
      )
      .filter((c): c is number => c !== null);
    const meanCorr = corrs.length > 0 ? corrs.reduce((a, b) => a + b, 0) / corrs.length : 0;

    // Citation density: refs per 1000 output tokens (treatment)
    const citationDensityPer1K =
      totalTreatmentOutput === 0 ? 0 : (refsTotal / totalTreatmentOutput) * 1000;

    const meanLatencyDelta =
      succeeded.reduce((s, r) => s + (r.treatmentTimeMs - r.controlTimeMs), 0) / succeeded.length;

    lines.push('## Aggregate metrics');
    lines.push('');
    lines.push(`- **Runs succeeded:** ${succeeded.length} / ${results.length}`);
    lines.push('');
    lines.push('### Stability (safety gate, not quality gate)');
    lines.push(`- **Paragraph-score correlation (treatment vs control):** ${meanCorr.toFixed(3)}`);
    lines.push(
      `  - This measures whether treatment scores are similar to control scores. It does NOT tell us if treatment is better or worse — that requires baseline-truth comparison (human ratings).`,
    );
    lines.push(
      `  - Safety interpretation: < 0.60 means treatment and control diverged significantly — inspect why before trusting the other metrics.`,
    );
    lines.push('');
    lines.push('### Corpus utilization (automated)');
    lines.push(`- **Citation density:** ${citationDensityPer1K.toFixed(2)} refs per 1000 output tokens`);
    lines.push(`  - ${totalMoves} [MOVE-#] + ${totalAPs} [AP-#] references across all treatment output.`);
    lines.push(`  - Spec target: ≥ 5 refs per 1K tokens means the LLM is actually CITING retrieved content.`);
    lines.push(`- **Hallucination rate:** ${(hallucRate * 100).toFixed(2)}% (${totalFab} fabricated / ${refsTotal} referenced)`);
    lines.push(`  - Spec target: ≤ 1%. Circuit-break threshold: > 5% across 3+ calls.`);
    lines.push('');
    lines.push('### Cost overhead (automated)');
    lines.push(`- **Token inflation:** +${totalTreatmentInput - totalControlInput} input tokens total (+${((totalTreatmentInput - totalControlInput) / succeeded.length).toFixed(0)}/essay)`);
    lines.push(
      `  - Corpus block tokens reported by telemetry: ${totalBlockTokens} (${((totalBlockTokens / Math.max(1, totalTreatmentInput)) * 100).toFixed(2)}% of treatment input).`,
    );
    lines.push(`  - Spec target: < +2K per essay.`);
    lines.push(`- **Latency delta:** +${formatMs(meanLatencyDelta)} per essay`);
    lines.push(`  - Spec target: < +2s per essay.`);
    lines.push(`- **Total control cost:** ${formatCost(totalControlCost)}`);
    lines.push(`- **Total treatment cost:** ${formatCost(totalTreatmentCost)}`);
    lines.push(`- **Cost delta:** ${formatCost(totalTreatmentCost - totalControlCost)} (+${formatCost((totalTreatmentCost - totalControlCost) / succeeded.length)}/essay)`);
    lines.push('');

    // Automated gates we CAN evaluate — keep these crisp.
    lines.push('## Automated safety gates');
    lines.push('');
    const stabilityOk = meanCorr >= 0.60;
    const citOk = citationDensityPer1K >= 5.0;
    const tokOk = (totalTreatmentInput - totalControlInput) / succeeded.length < 2000;
    const latOk = meanLatencyDelta < 2000;
    const hallOk = hallucRate <= 0.01;
    lines.push(`- Stability (corr ≥ 0.60): ${stabilityOk ? '✅' : '❌'} (${meanCorr.toFixed(3)})`);
    lines.push(`- Citation density ≥ 5/1K: ${citOk ? '✅' : '❌'} (${citationDensityPer1K.toFixed(2)})`);
    lines.push(`- Token inflation < +2K/essay: ${tokOk ? '✅' : '❌'}`);
    lines.push(`- Latency delta < +2s/essay: ${latOk ? '✅' : '❌'}`);
    lines.push(`- Hallucination ≤ 1%: ${hallOk ? '✅' : '❌'}`);
    lines.push('');
    lines.push('## What this report CANNOT decide');
    lines.push('');
    lines.push('The spec\'s ship criterion is: `(score correlation vs baseline improves) OR (weakness');
    lines.push('specificity improves by blind human rating)` AND (automated safety gates above).');
    lines.push('');
    lines.push('Neither of the "improves" conditions can be evaluated automatically:');
    lines.push('- Score-vs-baseline correlation requires numeric human ratings per paragraph. The');
    lines.push('  calibration fixtures carry qualitative close-reading rationales, not numeric scores.');
    lines.push('- Weakness specificity requires blind human rating (1-5 scale) of treatment vs');
    lines.push('  control output pairs.');
    lines.push('');
    lines.push('A human reviewer must make the ship call after reading the treatment output.');
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      '[checkpoint3] ANTHROPIC_API_KEY not found. Set it in .env.local or export it before running.',
    );
    process.exit(1);
  }

  const fixtureIds =
    process.env.CHECKPOINT3_FIXTURES?.split(',').map((s) => s.trim()).filter(Boolean) ??
    DEFAULT_FIXTURE_IDS;

  const outputDir = process.env.CHECKPOINT3_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;
  ensureDir(outputDir);

  const controlTelemetryPath = path.join(outputDir, 'telemetry-control.jsonl');
  const treatmentTelemetryPath = path.join(outputDir, 'telemetry-treatment.jsonl');

  // Clean prior telemetry so metrics reflect this run only.
  for (const p of [controlTelemetryPath, treatmentTelemetryPath]) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log(
    `[checkpoint3] Running A/B against ${fixtureIds.length} fixtures.\n  output: ${outputDir}\n`,
  );

  const results: PerEssayMetrics[] = [];

  for (const fixtureId of fixtureIds) {
    const essayPath = path.join(ESSAYS_DIR, `${fixtureId}.txt`);
    if (!fs.existsSync(essayPath)) {
      console.error(`[checkpoint3] Fixture not found: ${essayPath} — skipping`);
      continue;
    }
    const essayText = fs.readFileSync(essayPath, 'utf8').trim();

    console.log(`\n▸ ${fixtureId}`);
    console.log(`  [arm 1/2] CONTROL (flag OFF) …`);
    const control = await runArm(fixtureId, essayText, false, controlTelemetryPath);
    console.log(
      `    done — ${formatMs(control.timeMs)}, ${formatCost(control.cost)}${control.error ? `, ERROR: ${control.error}` : ''}`,
    );

    console.log(`  [arm 2/2] TREATMENT (flag ON) …`);
    const treatment = await runArm(fixtureId, essayText, true, treatmentTelemetryPath);
    console.log(
      `    done — ${formatMs(treatment.timeMs)}, ${formatCost(treatment.cost)}${treatment.error ? `, ERROR: ${treatment.error}` : ''}`,
    );

    // Read treatment telemetry records for THIS essay (may be multi-layer).
    const allTreatmentTel = await readJsonl(treatmentTelemetryPath);
    const thisEssayTel = allTreatmentTel.filter((r) => r.essayId === fixtureId);
    const tel = computeTelemetryAggregates(thisEssayTel);

    results.push({
      fixtureId,
      controlTimeMs: control.timeMs,
      controlCost: control.cost,
      controlInputTokens: control.inputTokens,
      controlOutputTokens: control.outputTokens,
      controlParagraphScores: control.paragraphScores,
      treatmentTimeMs: treatment.timeMs,
      treatmentCost: treatment.cost,
      treatmentInputTokens: treatment.inputTokens,
      treatmentOutputTokens: treatment.outputTokens,
      treatmentParagraphScores: treatment.paragraphScores,
      treatmentCorpusBlockTokens: tel.totalBlockTokens,
      treatmentCorpusLatencyMs: tel.totalCorpusLatencyMs,
      treatmentMovesReferenced: tel.totalMoves,
      treatmentAntiPatternsReferenced: tel.totalAPs,
      treatmentFabricated: tel.totalFabricated,
      controlError: control.error,
      treatmentError: treatment.error,
    });
  }

  const report = renderReport(results);
  const reportPath = path.join(outputDir, 'report.md');
  await fsp.writeFile(reportPath, report, 'utf8');

  // Also write a machine-readable summary
  const summaryPath = path.join(outputDir, 'summary.json');
  await fsp.writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\n[checkpoint3] Report written: ${reportPath}`);
  console.log(`[checkpoint3] Summary JSON: ${summaryPath}`);
  console.log(`[checkpoint3] Control telemetry: ${controlTelemetryPath}`);
  console.log(`[checkpoint3] Treatment telemetry: ${treatmentTelemetryPath}`);
  console.log('\n──── Report preview ────\n');
  console.log(report);
}

void main().catch((err) => {
  console.error('[checkpoint3] FATAL:', err);
  process.exit(1);
});
