// ============================================================================
// §11.15 Crochet calibration run — Phase 2 Option 5 spine validation
// ============================================================================
//
// Drives `analyzeEssay` end-to-end against Clara's "Crochet" essay
// (491 words, 5 prose paragraphs — the shortest top-tier corpus entry).
// Captures all Phase B emissions + concept library + cost breakdown.
//
// Validation targets:
// - WORKING-MOVE SILENCE: Crochet's strong moves should NOT trigger
//   emissions. Specifically:
//     * P1S1-2 misdirection-opener ("not a taxidermist") — landing.
//     * P3 compressed-biography ("Viet Cong imprisoned my grandfather...
//       in a grueling labor camp for thirteen years") — landing.
//     * P4S5 cornflower-blue Agnes elephant — landing.
//     * P5 closing "weave my own mark" — landing.
// - Volume cap: ≤3 emissions per essay (Phase B hard cap).
// - Concept tag non-fragmentation: any emitted tags should reuse from
//   library appropriately (5-paragraph essay has limited surface for
//   concept fragmentation, but Phase B should pick prose tags not
//   snake_case).
// - Cost target: ≤$1 with Option 5 architecture + lowered L3 walk
//   token cap (1800 base / 4000 cap / 1500 finding budget).
//
// Cost cap: $1 hard target (soft warning at runtime; pipeline continues
// to surface real numbers). Runs with includeAnnotations=false to skip L5.
//
// Output: tests/output/crochet-calibration-{timestamp}.{json,md}
//
// Run:
//   set -a && source .env.local && set +a && npx tsx tests/test-sarika-calibration.ts
// (Script kept its original filename for git history clarity; the harness
// now targets Crochet.)
// ============================================================================

import { promises as fs } from 'fs';
import path from 'path';
import { analyzeEssay } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { EssayProfile, SpecificsNeedEmission, ConceptLibraryEntry } from '../src/services/essayIntelligence/profileTypes';

const ESSAY_PATH =
  'tests/calibration/top-tier-reference/essays/14-harvard-2028-crochet.txt';
const ESSAY_ID = 'crochet-calibration-2026-05-03';
const COST_CAP_USD = 1.0;

async function main(): Promise<void> {
  const essayText = (await fs.readFile(ESSAY_PATH, 'utf-8')).trim();
  console.log(
    `[calibration] Loaded Sarika essay: ${essayText.length} chars, ${essayText.split(/\s+/).length} words`,
  );

  const startTime = Date.now();

  console.log('[calibration] Starting Phase 2 spine (L1→L2→L2.5→L3→L3.75→L3.5→L4→D-2.6→aggregator)...');

  const result = await analyzeEssay({
    essayId: ESSAY_ID,
    essayText,
    essayType: 'common_app',
    promptText: 'Tell us about yourself.',
    includeAnnotations: false, // skip L5 to stay under $1 cap
  });

  const elapsed = Date.now() - startTime;
  console.log(
    `[calibration] Pipeline completed in ${(elapsed / 1000).toFixed(1)}s, totalCost=$${result.metadata.totalCost.toFixed(4)}`,
  );

  if (result.metadata.totalCost > COST_CAP_USD) {
    console.warn(
      `[calibration] WARNING: total cost $${result.metadata.totalCost.toFixed(4)} exceeded cap $${COST_CAP_USD.toFixed(2)}`,
    );
  }

  const profile = result.profile;
  const report = buildCalibrationReport(profile, result.metadata, elapsed);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(__dirname, 'output');
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `sarika-calibration-${ts}.json`);
  const mdPath = path.join(outDir, `sarika-calibration-${ts}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  await fs.writeFile(mdPath, renderHumanReport(report));

  console.log(`\n[calibration] Reports written:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
  console.log(`\n[calibration] Summary:`);
  console.log(`  Total emissions across all 5 sources: ${report.totals.totalEmissions}`);
  console.log(`  L3 walk:           ${report.byLayer.l3_walk.length}`);
  console.log(`  L3.5 analysis:     ${report.byLayer.l3_5_analysis.length}`);
  console.log(`  L3.75 holistic:    ${report.byLayer.l3_75.length}`);
  console.log(`  L4 northStar:      ${report.byLayer.l4_north_star.length}`);
  console.log(`  D-2.6 maturity:    ${report.byLayer.finding_maturity.length}`);
  console.log(`  Queue mints:       ${report.queueMints}`);
  console.log(`  Concept library:   ${report.conceptLibrary.length} concepts`);
  console.log(`  Cost:              $${report.metadata.totalCost.toFixed(4)} / cap $${COST_CAP_USD.toFixed(2)}`);
}

interface CalibrationReport {
  essayId: string;
  essayText: string;
  metadata: {
    totalCost: number;
    elapsedMs: number;
    layersCompleted: string[];
    layersFailed: Array<{ layer: string; error: string }>;
  };
  totals: {
    totalEmissions: number;
    paragraphCount: number;
    findingsCount: number;
  };
  byLayer: {
    l3_walk: SpecificsNeedEmission[];
    l3_5_analysis: SpecificsNeedEmission[];
    l3_75: SpecificsNeedEmission[];
    l4_north_star: SpecificsNeedEmission[];
    finding_maturity: SpecificsNeedEmission[];
  };
  queueMints: number;
  questionQueue: Array<{ id: string; question: string; source: string; status: string; conceptTag?: string }>;
  conceptLibrary: ConceptLibraryEntry[];
  perParagraphSummary: Array<{
    index: number;
    text: string;
    walkEmissionCount: number;
    analysisEmissionCount: number;
  }>;
}

function buildCalibrationReport(
  profile: EssayProfile,
  metadata: { totalCost: number; layersCompleted: string[]; layersFailed?: Array<{ layer: string; error: string }> },
  elapsedMs: number,
): CalibrationReport {
  const byLayer = {
    l3_walk: [] as SpecificsNeedEmission[],
    l3_5_analysis: [] as SpecificsNeedEmission[],
    l3_75: [] as SpecificsNeedEmission[],
    l4_north_star: [] as SpecificsNeedEmission[],
    finding_maturity: [] as SpecificsNeedEmission[],
  };

  for (const para of profile.paragraphs ?? []) {
    if (para.understanding?.specificsNeedEmissions) {
      byLayer.l3_walk.push(...para.understanding.specificsNeedEmissions);
    }
    if (para.analysis?.specificsNeedEmissions) {
      byLayer.l3_5_analysis.push(...para.analysis.specificsNeedEmissions);
    }
  }
  if (profile.essayUnderstanding?.specificsNeedEmissions) {
    byLayer.l3_75.push(...profile.essayUnderstanding.specificsNeedEmissions);
  }
  if (profile.northStar?.specificsNeedEmissions) {
    byLayer.l4_north_star.push(...profile.northStar.specificsNeedEmissions);
  }

  // Option 5 architecture: emissions live at profile.specificsNeedEmissions
  // (single essay-level location populated by Phase B). Each emission's
  // sourceLayer field tells us which layer's recognition produced it.
  if (profile.specificsNeedEmissions) {
    for (const emission of profile.specificsNeedEmissions) {
      switch (emission.sourceLayer) {
        case 'l3_walk':
          byLayer.l3_walk.push(emission);
          break;
        case 'l3_5_analysis':
          byLayer.l3_5_analysis.push(emission);
          break;
        case 'l3_75_phase_a':
        case 'l3_75_phase_b':
          byLayer.l3_75.push(emission);
          break;
        case 'l4_north_star':
          byLayer.l4_north_star.push(emission);
          break;
        case 'finding_maturity':
          byLayer.finding_maturity.push(emission);
          break;
      }
    }
  }
  const totalPerLayer = profile.specificsNeedEmissions?.length ?? 0;
  const queueMints = (profile.questionQueue ?? []).filter(
    (q) => q.source === 'analysis_specifics_gap',
  ).length;

  return {
    essayId: ESSAY_ID,
    essayText: profile.paragraphs.map((p) => p.text).join('\n\n'),
    metadata: {
      totalCost: metadata.totalCost,
      elapsedMs,
      layersCompleted: metadata.layersCompleted,
      layersFailed: metadata.layersFailed ?? [],
    },
    totals: {
      totalEmissions: totalPerLayer + inferredD26,
      paragraphCount: profile.paragraphs.length,
      findingsCount: 0, // populate later if needed
    },
    byLayer,
    queueMints,
    questionQueue: (profile.questionQueue ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      source: q.source,
      status: q.status,
      conceptTag: q.dig?.populates?.find((p) => p.startsWith('conceptTag:')) ?? undefined,
    })),
    conceptLibrary: profile.conceptLibrary ?? [],
    perParagraphSummary: profile.paragraphs.map((p) => {
      const walkCandidates =
        (p.understanding as { gapCandidates?: unknown[] } | null)
          ?.gapCandidates?.length ?? 0;
      const analysisCandidates =
        (p.analysis as { gapCandidates?: unknown[] } | null)
          ?.gapCandidates?.length ?? 0;
      return {
        index: p.index,
        text: p.text.slice(0, 200) + (p.text.length > 200 ? '...' : ''),
        walkEmissionCount: walkCandidates, // gap candidates from L3 walk
        analysisEmissionCount: analysisCandidates, // gap candidates from L3.5
      };
    }),
  };
}

function renderHumanReport(report: CalibrationReport): string {
  const lines: string[] = [];
  lines.push(`# Sarika Calibration Run — Phase 2 Spine`);
  lines.push('');
  lines.push(`**Date:** ${new Date().toISOString()}`);
  lines.push(`**Essay ID:** ${report.essayId}`);
  lines.push(`**Cost:** $${report.metadata.totalCost.toFixed(4)} / cap $${COST_CAP_USD.toFixed(2)}`);
  lines.push(`**Elapsed:** ${(report.metadata.elapsedMs / 1000).toFixed(1)}s`);
  lines.push(`**Layers completed:** ${report.metadata.layersCompleted.join(', ')}`);
  if (report.metadata.layersFailed.length > 0) {
    lines.push(`**Layers failed:** ${report.metadata.layersFailed.map((f) => `${f.layer} (${f.error})`).join('; ')}`);
  }
  lines.push('');
  lines.push(`## Volume distribution`);
  lines.push(`- L3 walk: ${report.byLayer.l3_walk.length}`);
  lines.push(`- L3.5 analysis: ${report.byLayer.l3_5_analysis.length}`);
  lines.push(`- L3.75 holistic: ${report.byLayer.l3_75.length}`);
  lines.push(`- L4 northStar: ${report.byLayer.l4_north_star.length}`);
  lines.push(`- D-2.6 maturity (inferred from queue delta): ${report.byLayer.finding_maturity.length}`);
  lines.push(`- **Total: ${report.totals.totalEmissions}**`);
  lines.push(`- Queue mints (post-aggregator): ${report.queueMints}`);
  lines.push('');
  lines.push(`## Critical test: WORKING-MOVE SILENCE on landing moves`);
  lines.push('');
  lines.push(`Per Phase B six-condition gate, Crochet's strong moves should produce ZERO emissions:`);
  lines.push(`  - P1S1-2 misdirection opener ("not a taxidermist or anything")`);
  lines.push(`  - P3 compressed-biography ("Viet Cong imprisoned my grandfather... thirteen years")`);
  lines.push(`  - P4 cornflower-blue Agnes elephant (specific over general — landing)`);
  lines.push(`  - P5 closing "weave my own mark into the great patchwork quilt that is America"`);
  lines.push('');
  const allEmissions = [
    ...report.byLayer.l3_walk,
    ...report.byLayer.l3_5_analysis,
    ...report.byLayer.l3_75,
    ...report.byLayer.l4_north_star,
    ...report.byLayer.finding_maturity,
  ];
  const landingMoveEmissions = allEmissions.filter((e) => {
    const seed = (e.framingSeed ?? '').toLowerCase();
    const trigger = (e.emittingTrigger ?? '').toLowerCase();
    const blob = seed + ' ' + trigger;
    return (
      blob.includes('taxidermist') ||
      blob.includes('viet cong') ||
      blob.includes('thirteen years') ||
      blob.includes('cornflower') ||
      blob.includes('agnes') ||
      blob.includes('weave my own mark') ||
      blob.includes('patchwork quilt')
    );
  });
  if (landingMoveEmissions.length === 0) {
    lines.push(`**PASS** — no emissions surfaced on Crochet's landing moves. Working-move silence honored.`);
  } else {
    lines.push(`**FAIL** — ${landingMoveEmissions.length} emission(s) surfaced on landing moves. The prompt's working-move silence rule did not hold.`);
    for (const e of landingMoveEmissions) {
      lines.push(`  - sourceLayer=${e.sourceLayer}, P${e.anchorParagraph}: "${e.framingSeed}"`);
    }
  }
  lines.push('');
  lines.push(`## All emissions (full detail)`);
  for (const layer of ['l3_walk', 'l3_5_analysis', 'l3_75', 'l4_north_star'] as const) {
    const emissions = report.byLayer[layer];
    if (emissions.length === 0) continue;
    lines.push('');
    lines.push(`### ${layer}`);
    emissions.forEach((e, i) => {
      lines.push('');
      lines.push(`**[${i + 1}] P${e.anchorParagraph}${typeof e.anchorSentence === 'number' ? `S${e.anchorSentence}` : ''}** — concept: "${e.conceptTag}" [${e.conceptComplexity}, priority=${e.priority}]`);
      lines.push(`  - emittingTrigger: ${e.emittingTrigger}`);
      lines.push(`  - question: ${e.question}`);
      lines.push(`  - framingSeed: ${e.framingSeed}`);
      lines.push(`  - expectedInsight: ${e.expectedInsight}`);
      lines.push(`  - expectedDiscovery: ${e.expectedDiscovery ?? '(null — pure coaching-unlock)'}`);
      lines.push(`  - whyAsked: ${e.whyAsked}`);
      lines.push(`  - dimensions: [${e.dimensions.join(', ')}]`);
    });
  }
  lines.push('');
  lines.push(`## Concept library`);
  if (report.conceptLibrary.length === 0) {
    lines.push(`(empty)`);
  } else {
    for (const entry of report.conceptLibrary) {
      const unresolved = entry.instances.filter((i) => !i.gapResolved).length;
      lines.push(`- **"${entry.tag}"** [${entry.complexity}]: ${unresolved} unresolved / ${entry.instances.length} total`);
      lines.push(`  - definition: ${entry.definition}`);
      lines.push(`  - example: ${entry.example}`);
    }
  }
  lines.push('');
  lines.push(`## Question queue (post-aggregator)`);
  if (report.questionQueue.length === 0) {
    lines.push(`(empty)`);
  } else {
    report.questionQueue.forEach((q, i) => {
      lines.push(`${i + 1}. [${q.id}] (${q.status}, source=${q.source}) ${q.question}`);
    });
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[calibration] FAILED:', err);
  process.exit(1);
});
