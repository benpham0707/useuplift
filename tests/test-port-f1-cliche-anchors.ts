#!/usr/bin/env tsx
/**
 * Port F1 — Cliché Anchor Extension (L3.5 only) smoke test
 *
 * Verifies:
 *   1. F1_CLICHE_ANCHORS slot is pre-claimed at v1.0.0 and declared 'evaluative'.
 *   2. clicheLibrary.ts re-export — CLICHE_REFERENCE importable from the
 *      essayIntelligence taxonomies path, carries expected category keys.
 *   3. analysisPass.ts wires the F1 block: imports withPromptBlockVersion,
 *      declares // @prompt-block F1_CLICHE_ANCHORS above a template literal,
 *      and interpolates the wrapped block variable in buildSystemPrompt().
 *   4. The wrapped F1 block carries BLOCK:F1_CLICHE_ANCHORS@v1.0.0 open +
 *      close markers (cache-key divergence seed + lint binding).
 *   5. F1 block body contains ≥3 SCORE 38 anchors and ≥2 SCORE 52 anchors,
 *      each with a matching WHY explanation.
 *   6. Regression — the original SCORE 38 / 52 / 72 / 88 / 78 anchor byte
 *      sequences are still present in analysisPass.ts (§8 preservation item #8).
 *   7. F1 block injection lands AFTER the SCORE 78 anchor and BEFORE the
 *      "## REFERENCING FINDINGS" header.
 *   8. F1 is NOT injected into L1 (firstImpressions.ts) or L3.75
 *      (holisticSynthesis.ts) — per §3 the L3.5-only framing.
 *
 * ---------------------------------------------------------------------------
 * MEASUREMENT PLAN (per verdict §3 Port F1) — post-merge instrumentation.
 *
 * Sample: 30 essays seeded from the V1 R&D 86-phrase baseline fixture.
 * Metrics:
 *   (a) True-positive coverage: fraction of seeded cliché phrases flagged by
 *       L3.5 as SCORE ≤ 52. Baseline ~15%; target ~80% post-F1.
 *   (b) False-positive rate: fraction of strong grounded sentences driven
 *       below 55. Ceiling ≤ 5%.
 * Instrumentation: emit per-sentence rows (essayId, sentenceIdx, seededCliche,
 * l35Score, l35SymptomType) to a post-merge CSV sink. Compute offline.
 * If (a) < 60% post-merge, content-edit body and bump slot patch version —
 * no SYSTEM_PROMPT_VERSION bump (seam decouples).
 * ---------------------------------------------------------------------------
 *
 * Run: npx tsx tests/test-port-f1-cliche-anchors.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
  withPromptBlockVersion,
} from '../src/lib/llm/promptBlockVersions';
import { CLICHE_REFERENCE } from '../src/services/essayIntelligence/taxonomies/clicheLibrary';

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

console.log('Port F1 — Cliché Anchor Extension (L3.5 only)');

// 1. Slot pre-claim + evaluative declaration
assert(
  PROMPT_BLOCK_VERSIONS.F1_CLICHE_ANCHORS === 'v1.0.0',
  `F1_CLICHE_ANCHORS version is v1.0.0 (got ${PROMPT_BLOCK_VERSIONS.F1_CLICHE_ANCHORS})`,
);
assert(
  PROMPT_BLOCK_DECLARATIONS.F1_CLICHE_ANCHORS.level === 'evaluative',
  `F1 declared at 'evaluative' level (got ${PROMPT_BLOCK_DECLARATIONS.F1_CLICHE_ANCHORS.level})`,
);

// 2. clicheLibrary re-export sanity
assert(
  typeof CLICHE_REFERENCE === 'object' && CLICHE_REFERENCE !== null,
  'CLICHE_REFERENCE re-exported from taxonomies/clicheLibrary',
);
// Probe at least 2 known category keys (keys may evolve; don't over-constrain)
const clicheKeys = Object.keys(CLICHE_REFERENCE as Record<string, unknown>);
assert(
  clicheKeys.length >= 3,
  `CLICHE_REFERENCE exposes ≥3 top-level categories (got ${clicheKeys.length})`,
);

// 3. analysisPass.ts wiring
const repoRoot = resolve(__dirname, '..');
const analysisPassSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/analysisPass.ts'),
  'utf8',
);
assert(
  analysisPassSrc.includes(`from '../../../lib/llm/promptBlockVersions'`),
  'analysisPass.ts imports from promptBlockVersions',
);
assert(
  /\bwithPromptBlockVersion\b/.test(analysisPassSrc),
  'analysisPass.ts references withPromptBlockVersion',
);
assert(
  analysisPassSrc.includes('// @prompt-block F1_CLICHE_ANCHORS'),
  'analysisPass.ts carries @prompt-block F1_CLICHE_ANCHORS tag',
);
assert(
  analysisPassSrc.includes('F1_CLICHE_ANCHOR_EXTENSION_BODY'),
  'F1 block body constant declared',
);
assert(
  /withPromptBlockVersion\(\s*F1_CLICHE_ANCHOR_EXTENSION_BODY,\s*'F1_CLICHE_ANCHORS'\s*,?\s*\)/.test(analysisPassSrc),
  'F1 block wrapped via withPromptBlockVersion at runtime',
);
assert(
  analysisPassSrc.includes('${clicheAnchorsBlock}'),
  'F1 wrapped block interpolated into basePrompt as ${clicheAnchorsBlock}',
);

// 4. Wrap markers present on runtime wrap
const wrapped = withPromptBlockVersion('dummy body for wrapping', 'F1_CLICHE_ANCHORS');
const openMatch = wrapped.match(BLOCK_OPEN_RE);
const closeMatch = wrapped.match(BLOCK_CLOSE_RE);
assert(openMatch !== null, 'F1 wrap emits BLOCK open marker');
assert(closeMatch !== null, 'F1 wrap emits BLOCK close marker');
assert(openMatch?.[1] === 'F1_CLICHE_ANCHORS', `open blockId is F1_CLICHE_ANCHORS (got ${openMatch?.[1]})`);
assert(openMatch?.[2] === 'v1.0.0', `open version is v1.0.0 (got ${openMatch?.[2]})`);
assert(closeMatch?.[1] === 'F1_CLICHE_ANCHORS', `close blockId is F1_CLICHE_ANCHORS (got ${closeMatch?.[1]})`);

// 5. Anchor count requirements — parse the body constant from source
const bodyMatch = analysisPassSrc.match(
  /const\s+F1_CLICHE_ANCHOR_EXTENSION_BODY\s*=\s*`([\s\S]+?)`\s*;/,
);
assert(bodyMatch !== null, 'F1_CLICHE_ANCHOR_EXTENSION_BODY body extractable');
const body = bodyMatch?.[1] ?? '';
const score38Anchors = (body.match(/^SCORE 38:/gm) ?? []).length;
const score38Whys = (body.match(/^WHY 38:/gm) ?? []).length;
const score52Anchors = (body.match(/^SCORE 52:/gm) ?? []).length;
const score52Whys = (body.match(/^WHY 52:/gm) ?? []).length;
assert(score38Anchors >= 3, `F1 body has ≥3 SCORE 38 anchors (got ${score38Anchors})`);
assert(score52Anchors >= 2, `F1 body has ≥2 SCORE 52 anchors (got ${score52Anchors})`);
assert(score38Whys === score38Anchors, `Each SCORE 38 anchor has a WHY 38 (${score38Whys} WHY vs ${score38Anchors} SCORE)`);
assert(score52Whys === score52Anchors, `Each SCORE 52 anchor has a WHY 52 (${score52Whys} WHY vs ${score52Anchors} SCORE)`);

// 6. Regression — original V1-native anchor bytes untouched (§8 item #8)
const originalAnchors: Array<[number, string]> = [
  [38, `SCORE 38: "From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound."`],
  [52, `SCORE 52: "I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood."`],
  [72, `SCORE 72: "Most Wednesdays smelled like bleach and citrus."`],
  [88, `SCORE 88: "I wanted to disappear. For three weeks afterward, I couldn't pick up my violin without my stomach clenching."`],
  [78, `SCORE 78 (admissions resonance): "That semester my GPA dropped from a 3.8 to a 2.4, and I told no one."`],
];
for (const [score, bytes] of originalAnchors) {
  assert(
    analysisPassSrc.includes(bytes),
    `Original SCORE ${score} anchor bytes preserved verbatim`,
  );
}

// 7. Injection ordering — F1 lands AFTER SCORE 78 anchor and BEFORE
//    "## REFERENCING FINDINGS" header.
const idxScore78 = analysisPassSrc.indexOf('SCORE 78 (admissions resonance)');
const idxInjection = analysisPassSrc.indexOf('${clicheAnchorsBlock}');
const idxReferencingFindings = analysisPassSrc.indexOf('## REFERENCING FINDINGS');
assert(idxScore78 > 0, 'SCORE 78 anchor present');
assert(idxInjection > idxScore78, 'F1 injection lands AFTER original SCORE 78 anchor');
assert(
  idxInjection < idxReferencingFindings,
  'F1 injection lands BEFORE "## REFERENCING FINDINGS" header',
);

// 8. F1 is NOT injected into L1 / L3.75
const firstImpressionsSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/firstImpressions.ts'),
  'utf8',
);
const holisticSynthesisSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/holisticSynthesis.ts'),
  'utf8',
);
assert(
  !firstImpressionsSrc.includes('F1_CLICHE_ANCHORS'),
  'firstImpressions.ts (L1) does NOT reference F1_CLICHE_ANCHORS',
);
assert(
  !holisticSynthesisSrc.includes('F1_CLICHE_ANCHORS'),
  'holisticSynthesis.ts (L3.75) does NOT reference F1_CLICHE_ANCHORS',
);

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
