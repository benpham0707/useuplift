#!/usr/bin/env tsx
/**
 * Port G3 — Few-shot calibration on scoring prompts smoke test
 *
 * Verifies:
 *   1. G3_FEW_SHOT_CALIBRATION slot is pre-claimed at v1.0.0 / evaluative.
 *   2. scoreMatrixAnchors.ts + piqDimensionAnchors.ts expose `build*Block()`
 *      helpers that wrap with G3 block-version markers.
 *   3. ScoreMatrix anchor body has ≥3 EXEMPLAR paragraph-level entries each
 *      with structural + voice + emotional + thematic scores.
 *   4. ScoreMatrix exemplars span the 0-100 range (at least one < 50 and
 *      at least one > 85 in each of the 4 dimensions) — this is the point.
 *   5. PIQ dimension anchor body has ≥3 SCORE exemplars on the 0-10 scale,
 *      spanning the low / mid / high bands.
 *   6. crystallizer.ts imports + injects scoreMatrixAnchors.
 *   7. analysisPass.ts imports + injects piqDimensionAnchors inside the
 *      PIQ-only path (not the non-PIQ branches).
 *
 * Run: npx tsx tests/test-port-g3-few-shot-calibration.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
} from '../../src/lib/llm/promptBlockVersions';
import { buildScoreMatrixAnchorsBlock } from '../../src/services/essayIntelligence/analysis/scoreMatrixAnchors';
import { buildPiqDimensionAnchorsBlock } from '../../src/services/essayIntelligence/analysis/piqDimensionAnchors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;
function assert(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('Port G3 — Few-shot calibration on scoring prompts');

// 1. Slot pre-claim
assert(
  PROMPT_BLOCK_VERSIONS.G3_FEW_SHOT_CALIBRATION === 'v1.0.0',
  `G3_FEW_SHOT_CALIBRATION version is v1.0.0`,
);
assert(
  PROMPT_BLOCK_DECLARATIONS.G3_FEW_SHOT_CALIBRATION.level === 'evaluative',
  `G3 declared at 'evaluative' level`,
);

// 2. Block builders wrap correctly
const smBlock = buildScoreMatrixAnchorsBlock();
const piqBlock = buildPiqDimensionAnchorsBlock();
for (const [name, block] of [['scoreMatrix', smBlock], ['piqDimension', piqBlock]] as const) {
  const openMatch = block.match(BLOCK_OPEN_RE);
  const closeMatch = block.match(BLOCK_CLOSE_RE);
  assert(openMatch?.[1] === 'G3_FEW_SHOT_CALIBRATION', `${name} block open marker is G3`);
  assert(closeMatch?.[1] === 'G3_FEW_SHOT_CALIBRATION', `${name} block close marker is G3`);
  assert(openMatch?.[2] === 'v1.0.0', `${name} block version is v1.0.0`);
}

// 3. ScoreMatrix anchors: ≥3 EXEMPLAR entries with all 4 dimension scores
const exemplarCount = (smBlock.match(/^EXEMPLAR [A-Z] /gm) ?? []).length;
assert(exemplarCount >= 3, `ScoreMatrix body has ≥3 EXEMPLAR entries (got ${exemplarCount})`);
for (const dim of ['structural', 'voice', 'emotional', 'thematic']) {
  const dimOccurrences = (smBlock.match(new RegExp(`${dim}=\\d+`, 'g')) ?? []).length;
  assert(dimOccurrences >= 3, `ScoreMatrix exemplars score the ${dim} dimension ≥3 times (got ${dimOccurrences})`);
}

// 4. Score range spans 0-100 meaningfully — every dimension should have at
//    least one score < 50 AND at least one score > 85 across the exemplars.
for (const dim of ['structural', 'voice', 'emotional', 'thematic']) {
  const matches = [...smBlock.matchAll(new RegExp(`${dim}=(\\d+)`, 'g'))];
  const scores = matches.map((m) => Number(m[1]));
  const anyLow = scores.some((s) => s < 50);
  const anyHigh = scores.some((s) => s > 85);
  assert(anyLow, `${dim} exemplars include a score < 50 (scores: ${scores.join(', ')})`);
  assert(anyHigh, `${dim} exemplars include a score > 85 (scores: ${scores.join(', ')})`);
}

// 5. PIQ dimension anchors: ≥3 SCORE exemplars on 0-10 scale spanning bands
const piqScoreLines = (piqBlock.match(/^SCORE \d+ /gm) ?? []);
assert(piqScoreLines.length >= 3, `PIQ dimension body has ≥3 SCORE exemplars (got ${piqScoreLines.length})`);
const piqScores = piqScoreLines.map((line) => {
  const m = line.match(/^SCORE (\d+)/);
  return m ? Number(m[1]) : NaN;
});
assert(piqScores.some((s) => s <= 4), `PIQ exemplars include a low-band score (≤4): ${piqScores.join(', ')}`);
assert(piqScores.some((s) => s >= 5 && s <= 7), `PIQ exemplars include a mid-band score (5-7): ${piqScores.join(', ')}`);
assert(piqScores.some((s) => s >= 8), `PIQ exemplars include a high-band score (≥8): ${piqScores.join(', ')}`);

// 6. crystallizer.ts wiring
const repoRoot = resolve(__dirname, '..', '..');
const crystallizerSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/crystallizer.ts'),
  'utf8',
);
assert(
  crystallizerSrc.includes("from './scoreMatrixAnchors'"),
  'crystallizer.ts imports scoreMatrixAnchors',
);
assert(
  crystallizerSrc.includes('${buildScoreMatrixAnchorsBlock()}'),
  'crystallizer.ts interpolates buildScoreMatrixAnchorsBlock() in the prompt',
);

// 7. analysisPass.ts wiring — PIQ anchors only in PIQ path
const apSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/analysisPass.ts'),
  'utf8',
);
assert(
  apSrc.includes("from './piqDimensionAnchors'"),
  'analysisPass.ts imports piqDimensionAnchors',
);
assert(
  apSrc.includes('buildPiqDimensionAnchorsBlock()'),
  'analysisPass.ts calls buildPiqDimensionAnchorsBlock',
);
// The PIQ anchor injection should appear INSIDE the PIQ-body branch, after
// the PIQ_MODE block. The non-PIQ return paths (return basePrompt + return
// patternSchemaExtension+patternCatalogBlock) must NOT include the PIQ
// anchors.
const piqAnchorPos = apSrc.indexOf('piqDimensionAnchorsBlock');
const piqBodyPos = apSrc.indexOf('const piqBody =');
assert(
  piqAnchorPos > 0 && piqBodyPos > 0 && piqAnchorPos < piqBodyPos + 200,
  'PIQ dimension anchors appear adjacent to piqBody construction (inside PIQ branch)',
);

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
