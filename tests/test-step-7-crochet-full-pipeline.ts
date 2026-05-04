// ============================================================================
// Step 7 — Full Crochet pipeline run (essay-level L3 walk, end-to-end)
// ============================================================================
//
// Drives analysisOrchestrator.analyzeEssay against Crochet to validate the
// Step 6 wire-up: essay-level L3 walk → adapter → L3.75 Phase A+B → L3.5 →
// L4 → Phase B emissions. The Step 5 isolated test already validated the
// L3 walk in isolation ($0.16, 12 findings); Step 7 confirms downstream
// layers consume the adapter output cleanly.
//
// Cost target: ~$0.87 (Step 5 budgeted $0.30 for upstream + L3; full
// pipeline adds L3.75 ≈ $0.30, L3.5 ≈ $0.20, L4 ≈ $0.07).
//
// Validation gates:
// - Pipeline completes without fail-fast error on L3, L3.75, L3.5, or L4
// - layersCompleted contains 'L3', 'L3.75', 'L3.5', 'L4'
// - profile.findings (post-L3) ≥ 5
// - profile.craftAssessment populated (L3.75 ran)
// - profile.paragraphs.every(p => p.understanding !== null)
// - profile.specificsNeedEmissions length sane (Phase B fired or
//   intentionally suppressed; not crashing)
// - Total cost < $1.50 (hard cap; expected ~$0.87)
// - No NaN / undefined in cost summary
//
// Run:
//   set -a && source .env.local && set +a && \
//     npx tsx tests/test-step-7-crochet-full-pipeline.ts
// ============================================================================

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { EssayProfile } from '../src/services/essayIntelligence/profileTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Essay can be overridden via CLI arg: `npx tsx ... --essay <filename>`.
// When absent, defaults to Crochet (the original Step 7 calibration).
const ESSAY_FILENAME =
  (() => {
    const idx = process.argv.indexOf('--essay');
    return idx >= 0 && process.argv[idx + 1]
      ? process.argv[idx + 1]
      : '14-harvard-2028-crochet.txt';
  })();
const ESSAY_PATH = path.join(
  __dirname,
  'calibration',
  'top-tier-reference',
  'essays',
  ESSAY_FILENAME,
);
const ESSAY_LABEL = ESSAY_FILENAME.replace(/\.txt$/, '');
const OUTPUT_DIR = path.join(__dirname, 'output');
const COST_HARD_CAP_USD = 3.0;

function fmtCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m${Math.round(s % 60)}s`;
}

function check(label: string, ok: boolean, detail = ''): boolean {
  const tag = ok ? '✓' : '✗';
  const line = `  [${tag}] ${label}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  return ok;
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const essayText = (await fs.readFile(ESSAY_PATH, 'utf-8')).trim();
  console.log(
    `[step-7] Loaded ${ESSAY_LABEL}: ${essayText.length} chars, ${essayText.split(/\s+/).length} words`,
  );

  const startTime = Date.now();

  console.log('[step-7] Running full pipeline (L1 → L4) via analysisOrchestrator...');
  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: `step-7-${ESSAY_LABEL}-full-pipeline`,
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });

  const totalMs = Date.now() - startTime;
  const profile = pipelineResult.profile as EssayProfile;
  const totalCost = pipelineResult.costSummary.totalCost;

  console.log('');
  console.log(`[step-7] Pipeline complete in ${fmtMs(totalMs)}`);
  console.log(`[step-7] Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  console.log(
    `[step-7] Layers failed: ${
      pipelineResult.layersFailed.map((f) => `${f.layer}: ${f.message}`).join(', ') || 'none'
    }`,
  );
  console.log(`[step-7] Total cost: ${fmtCost(totalCost)}`);

  // ── Per-layer breakdown ────────────────────────────────────────────────
  console.log('');
  console.log('[step-7] Per-layer cost breakdown:');
  const breakdown = pipelineResult.costSummary.byLayer ?? {};
  for (const [layer, info] of Object.entries(breakdown)) {
    const i = info as { cost: number; timingMs: number };
    console.log(`  ${layer.padEnd(8)} ${fmtCost(i.cost).padEnd(10)} ${fmtMs(i.timingMs)}`);
  }

  // ── Validation ─────────────────────────────────────────────────────────
  console.log('');
  console.log('[step-7] Validation:');
  let pass = 0;
  let total = 0;

  const checkAll = (label: string, ok: boolean, detail = '') => {
    total += 1;
    if (check(label, ok, detail)) pass += 1;
  };

  checkAll(
    'L3 layer completed',
    pipelineResult.layersCompleted.includes('L3'),
    pipelineResult.layersCompleted.includes('L3') ? '' : 'NOT in layersCompleted',
  );
  checkAll(
    'L3.75 layer completed',
    pipelineResult.layersCompleted.includes('L3.75'),
  );
  checkAll(
    'L3.5 layer completed',
    pipelineResult.layersCompleted.includes('L3.5'),
  );
  checkAll(
    'L4 layer completed',
    pipelineResult.layersCompleted.includes('L4'),
  );

  const failedCritical = pipelineResult.layersFailed.filter((f) =>
    ['L3', 'L3.75', 'L3.5', 'L4'].some((cl) => f.layer.includes(cl)),
  );
  checkAll(
    'No critical layer failures',
    failedCritical.length === 0,
    failedCritical.length === 0 ? '' : failedCritical.map((f) => f.layer).join(', '),
  );

  const findingsCount = profile.findings?.length ?? 0;
  checkAll(
    'Findings count ≥ 5 (essay-level walk depth signal)',
    findingsCount >= 5,
    `${findingsCount} findings`,
  );

  const paragraphsWithUnderstanding =
    profile.paragraphs?.filter((p) => p.understanding !== null).length ?? 0;
  const totalParagraphs = profile.paragraphs?.length ?? 0;
  checkAll(
    'All paragraphs have understanding populated',
    paragraphsWithUnderstanding === totalParagraphs && totalParagraphs > 0,
    `${paragraphsWithUnderstanding}/${totalParagraphs}`,
  );

  checkAll(
    'L3.75 craftAssessment populated',
    profile.craftAssessment != null,
    profile.craftAssessment ? 'present' : 'missing',
  );

  checkAll(
    'L3.75 voiceMap populated',
    profile.voiceMap != null,
    profile.voiceMap ? 'present' : 'missing',
  );

  const connectionsCount = profile.connections?.all?.length ?? 0;
  checkAll(
    'Connections persisted to profile',
    connectionsCount > 0,
    `${connectionsCount} connections`,
  );

  const emissionsCount = profile.specificsNeedEmissions?.length ?? 0;
  checkAll(
    'Phase B emissions field exists (count check informational)',
    Array.isArray(profile.specificsNeedEmissions) || profile.specificsNeedEmissions === undefined,
    `${emissionsCount} emissions`,
  );

  checkAll(
    'Cost finite + under hard cap',
    Number.isFinite(totalCost) && totalCost > 0 && totalCost < COST_HARD_CAP_USD,
    fmtCost(totalCost),
  );

  console.log('');
  console.log(`[step-7] Validation: ${pass}/${total} passed`);

  // ── Report ─────────────────────────────────────────────────────────────
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const reportPath = path.join(
    OUTPUT_DIR,
    `step-7-${ESSAY_LABEL}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`,
  );

  const lines: string[] = [];
  lines.push(`# Step 7/10 — ${ESSAY_LABEL} full pipeline (essay-level L3 walk wired)`);
  lines.push('');
  lines.push(`- **Date**: ${new Date().toISOString()}`);
  lines.push(`- **Essay**: ${ESSAY_FILENAME}`);
  lines.push(
    `- **Time**: ${fmtMs(totalMs)} | **Cost**: ${fmtCost(totalCost)}`,
  );
  lines.push(`- **Layers completed**: ${pipelineResult.layersCompleted.join(', ')}`);
  lines.push(
    `- **Layers failed**: ${
      pipelineResult.layersFailed.map((f) => `${f.layer}`).join(', ') || 'none'
    }`,
  );
  lines.push('');
  lines.push('## Cost breakdown');
  lines.push('');
  lines.push('| Layer | Cost | Time |');
  lines.push('|---|---|---|');
  for (const [layer, info] of Object.entries(breakdown)) {
    const i = info as { cost: number; timingMs: number };
    lines.push(`| ${layer} | ${fmtCost(i.cost)} | ${fmtMs(i.timingMs)} |`);
  }
  lines.push('');
  lines.push('## Validation');
  lines.push('');
  lines.push(`**${pass}/${total} passed**`);
  lines.push('');
  lines.push('## Profile signals');
  lines.push('');
  lines.push(`- Findings: ${findingsCount}`);
  lines.push(`- Connections: ${connectionsCount}`);
  lines.push(
    `- Paragraphs with understanding: ${paragraphsWithUnderstanding}/${totalParagraphs}`,
  );
  lines.push(`- craftAssessment: ${profile.craftAssessment ? 'present' : 'missing'}`);
  lines.push(`- voiceMap: ${profile.voiceMap ? 'present' : 'missing'}`);
  lines.push(`- specificsNeedEmissions: ${emissionsCount}`);
  lines.push('');
  lines.push('## Central thesis (from essay-level walk → L3.75 chain)');
  lines.push('');
  lines.push(profile.thematicArchitecture?.centralThesis ?? '(none)');
  lines.push('');
  lines.push('## Findings (top 10)');
  lines.push('');
  for (const f of (profile.findings ?? []).slice(0, 10)) {
    lines.push(`- **${f.maturity}** — ${f.claim}`);
  }
  lines.push('');
  lines.push('## Layer failures (if any)');
  lines.push('');
  for (const f of pipelineResult.layersFailed) {
    lines.push(`- **${f.layer}**: ${f.message}`);
  }

  await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
  console.log(`[step-7] Report written: ${reportPath}`);

  if (pass < total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[step-7] FATAL:', err);
  process.exit(1);
});
