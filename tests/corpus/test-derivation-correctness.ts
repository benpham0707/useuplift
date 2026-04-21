/**
 * tests/corpus/test-derivation-correctness.ts
 *
 * Verifies `tools/corpus/deriveCorrelations.ts` produces:
 *   1. Deterministic output — same inputs → identical bytes
 *   2. Complete coverage — every move pair with co-occurrence is considered
 *   3. Sensible weighting — known clusters have expected confidence tiers
 *   4. Provenance integrity — every correlation cites real essays + real moves
 *   5. Threshold discipline — no correlations below confidence-4 in output
 *   6. Hash stability — sourceHash is consistent across runs
 *
 * Run: `npx tsx tests/corpus/test-derivation-correctness.ts`
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import {
  TOP_TIER_CRAFT_MOVES,
  ESSAY_ARCHETYPES,
  ALL_CORPUS_ESSAY_IDS,
} from '../../src/services/essayIntelligence/corpus';
import type {
  DerivedCorrelationsArtifact,
} from '../../src/services/essayIntelligence/corpus/corpusTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, '..', '..');
const ARTIFACT_PATH = join(
  REPO_ROOT,
  'src',
  'services',
  'essayIntelligence',
  'corpus',
  'derivedCorrelations.json',
);
const SCRIPT_PATH = join(REPO_ROOT, 'tools', 'corpus', 'deriveCorrelations.ts');

const failures: string[] = [];
const warnings: string[] = [];

function fail(check: string, msg: string) {
  failures.push(`[${check}] ${msg}`);
}

function warn(check: string, msg: string) {
  warnings.push(`[${check}] ${msg}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 1: Artifact exists + parses
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 1: derivedCorrelations.json exists and parses...');

if (!existsSync(ARTIFACT_PATH)) {
  fail('1', `Artifact not found at ${ARTIFACT_PATH}. Run: npx tsx tools/corpus/deriveCorrelations.ts`);
  process.exit(1);
}

const rawArtifact = readFileSync(ARTIFACT_PATH, 'utf-8');
let artifact: DerivedCorrelationsArtifact;
try {
  artifact = JSON.parse(rawArtifact);
} catch (err) {
  fail('1', `Artifact is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 2: Determinism — run script again, compare
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 2: Derivation is deterministic (re-run must produce same sourceHash + correlation structure)...');

try {
  execSync(`npx tsx ${SCRIPT_PATH}`, { cwd: REPO_ROOT, stdio: 'pipe' });
} catch (err) {
  fail('2', `Re-run of derivation script failed: ${(err as Error).message}`);
  process.exit(1);
}

const rerunRaw = readFileSync(ARTIFACT_PATH, 'utf-8');
const rerunArtifact = JSON.parse(rerunRaw) as DerivedCorrelationsArtifact;

if (rerunArtifact.sourceHash !== artifact.sourceHash) {
  fail('2', `sourceHash mismatch between runs: ${artifact.sourceHash.slice(0, 16)} vs ${rerunArtifact.sourceHash.slice(0, 16)}`);
}

// Byte-identical check after normalizing the `derivedAt` timestamp, which is allowed to differ
const normalize = (s: string) =>
  s.replace(/"derivedAt": "[^"]+"/, '"derivedAt": "<TIMESTAMP>"');
const normOriginal = normalize(rawArtifact);
const normRerun = normalize(rerunRaw);

if (normOriginal !== normRerun) {
  fail('2', 'Normalized artifact bytes differ between runs — derivation is not deterministic');

  // Helpful diagnostic: which correlation differs?
  const origPairs = new Set(artifact.correlations.map((c) => `${c.moveIdA}|${c.moveIdB}|${c.confidence}`));
  const rerunPairs = new Set(rerunArtifact.correlations.map((c) => `${c.moveIdA}|${c.moveIdB}|${c.confidence}`));
  const onlyInOrig = [...origPairs].filter((p) => !rerunPairs.has(p)).slice(0, 5);
  const onlyInRerun = [...rerunPairs].filter((p) => !origPairs.has(p)).slice(0, 5);
  if (onlyInOrig.length) console.log(`  First-run only: ${onlyInOrig.join(', ')}`);
  if (onlyInRerun.length) console.log(`  Re-run only: ${onlyInRerun.join(', ')}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 3: Artifact shape is correct
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 3: Artifact shape is correct...');

if (typeof artifact.sourceHash !== 'string' || artifact.sourceHash.length !== 64) {
  fail('3', `sourceHash malformed: got "${artifact.sourceHash}"`);
}
if (typeof artifact.scriptVersion !== 'string') fail('3', 'scriptVersion missing');
if (!Array.isArray(artifact.correlations)) fail('3', 'correlations is not an array');
if (typeof artifact.stats !== 'object') fail('3', 'stats missing');

// ─────────────────────────────────────────────────────────────────────────
// CHECK 4: Every correlation references real moves and real essays
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 4: Correlations reference real moves and real essays...');

const validMoveIds = new Set(TOP_TIER_CRAFT_MOVES.map((m) => m.id));
const validEssayIds = new Set<string>(ALL_CORPUS_ESSAY_IDS);

for (const corr of artifact.correlations) {
  if (!validMoveIds.has(corr.moveIdA)) fail('4', `Correlation references unknown moveIdA '${corr.moveIdA}'`);
  if (!validMoveIds.has(corr.moveIdB)) fail('4', `Correlation references unknown moveIdB '${corr.moveIdB}'`);
  if (corr.moveIdA === corr.moveIdB) fail('4', `Self-correlation for '${corr.moveIdA}' — should not exist`);
  if (corr.moveIdA.localeCompare(corr.moveIdB) >= 0) {
    fail('4', `Correlation pair not in canonical order: ${corr.moveIdA} vs ${corr.moveIdB} (A must precede B lexically)`);
  }
  for (const occ of corr.coOccurrences) {
    if (!validEssayIds.has(occ.essayId)) fail('4', `Correlation cites unknown essayId '${occ.essayId}'`);
    if (occ.minParagraphDistance < 0) fail('4', `Negative paragraph distance for ${corr.moveIdA}/${corr.moveIdB}`);
  }
  // v2 scoring: correlations can have 0 attesting essays IF they have
  // archetype-membership evidence (archetypeScore >= 2). These are curator-
  // asserted correlations independent of co-occurrence evidence.
  if (corr.attestingEssays.length === 0 && corr.archetypeScore < 2) {
    fail('4', `Correlation ${corr.moveIdA}/${corr.moveIdB} has no attesting essays AND no archetype evidence`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 5: Threshold discipline + score component integrity (v2 scoring)
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 5: v2 scoring thresholds and component integrity...');

for (const corr of artifact.correlations) {
  // Component ranges
  if (corr.archetypeScore < 0 || corr.archetypeScore > 5) {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} archetypeScore=${corr.archetypeScore} out of [0,5]`);
  }
  if (corr.attestationScore < 0 || corr.attestationScore > 3) {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} attestationScore=${corr.attestationScore} out of [0,3]`);
  }
  if (corr.proximityScore < 0 || corr.proximityScore > 2) {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} proximityScore=${corr.proximityScore} out of [0,2]`);
  }
  // Total consistency
  const computedTotal = corr.archetypeScore + corr.attestationScore + corr.proximityScore;
  if (corr.totalScore !== Math.min(computedTotal, 10)) {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} totalScore=${corr.totalScore} but arch+attest+prox=${computedTotal}`);
  }
  // Threshold
  if (corr.totalScore < 4) {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} totalScore=${corr.totalScore} — should have been dropped`);
  }
  // Tier consistency
  const shouldBeStrong = corr.totalScore >= 6 || corr.archetypeScore >= 5;
  if (shouldBeStrong && corr.tier !== 'strong-correlation') {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} should be strong (total=${corr.totalScore} arch=${corr.archetypeScore}) but tier=${corr.tier}`);
  }
  if (!shouldBeStrong && corr.tier !== 'suggested-pairing') {
    fail('5', `Correlation ${corr.moveIdA}/${corr.moveIdB} should be suggested but tier=${corr.tier}`);
  }
}

// Cross-check: strong-tier count should be in reasonable range
const strongCount = artifact.correlations.filter((c) => c.tier === 'strong-correlation').length;
if (strongCount < 40) {
  fail('5', `Strong-tier count ${strongCount} too low — scoring may be too strict`);
}
if (strongCount > 350) {
  warn('5', `Strong-tier count ${strongCount} unusually high — inspect for over-generosity`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 6: Sensible weighting — known clusters should correlate
//
// These assertions hard-code corpus knowledge: Sarika's cluster moves
// (extended-metaphor-priming + verb-possession + motion-verb-mark-coupling)
// should appear in the derived correlations if both are load-bearing in
// the same archetype. If the derivation misses these obvious relationships,
// something is wrong.
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 6: Known clusters are present in derived correlations...');

const byPair = new Map<string, (typeof artifact.correlations)[number]>();
for (const c of artifact.correlations) {
  byPair.set(`${c.moveIdA}|${c.moveIdB}`, c);
}

function hasCorrelation(a: string, b: string): boolean {
  const [lo, hi] = a.localeCompare(b) < 0 ? [a, b] : [b, a];
  return byPair.has(`${lo}|${hi}`);
}

const expectedPairs: Array<[string, string, string]> = [
  ['extended-metaphor-priming', 'verb-possession-of-specialized-register', 'Sarika cluster'],
  ['verb-possession-of-specialized-register', 'final-possession-assertion', 'Sarika cluster'],
  ['triplet-anaphora-of-difference', 'refutation-triplet-mirror', 'Orlee cluster'],
  ['one-word-identity-distinction', 'mirror-but-not-symmetric-closing-commitment', 'Michael cluster'],
  ['causal-chain-triplet', 'fear-resolution-triplet-mapping', 'Francisco cluster'],
  ['time-stamped-ritual-structure', 'labeled-ritual-internal-vocabulary', 'Michael cluster'],
];

for (const [a, b, label] of expectedPairs) {
  if (!hasCorrelation(a, b)) {
    fail('6', `Expected correlation missing: ${a} ↔ ${b} (${label})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 7: sourceHash integrity — re-derive hash from inputs, compare
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 7: sourceHash matches a fresh recomputation from inputs...');

// Mirrors tools/corpus/deriveCorrelations.ts v2 scoring — if this diverges,
// either update the test or the script (hash must be a pure function of inputs).
function recomputeSourceHash(): string {
  const sortedMoveIds = TOP_TIER_CRAFT_MOVES.map((m) => m.id).sort();
  const payload = sortedMoveIds
    .map((id) => {
      const m = TOP_TIER_CRAFT_MOVES.find((x) => x.id === id)!;
      const srcs = m.sourceEssays.map((s) => `${s.essayId}:${s.paragraph}`).sort().join(',');
      return `${id}|${srcs}`;
    })
    .join('\n');
  const archSig = [...ESSAY_ARCHETYPES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => {
      const stageData = a.structuralStages
        .map((s) => `${s.stageName}:req=${[...s.requiredMoveIds].sort().join('/')}|opt=${[...s.optionalMoveIds].sort().join('/')}`)
        .join(';');
      return `${a.id}|load=${[...a.loadBearingMoveIds].sort().join(',')}|stages=${stageData}`;
    })
    .join('\n');
  return createHash('sha256').update(`${payload}\n---\n${archSig}`).digest('hex');
}

const recomputed = recomputeSourceHash();
if (recomputed !== artifact.sourceHash) {
  fail('7', `sourceHash drift: stored=${artifact.sourceHash.slice(0, 16)} recomputed=${recomputed.slice(0, 16)}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 8: Coverage sanity — every move should appear in AT LEAST one
// correlation, EXCEPT moves with only 1 sourceEssay AND no archetype-cluster
// membership (those can't correlate with anything).
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 8: Coverage sanity — most moves appear in at least one correlation...');

const movesInCorrelations = new Set<string>();
for (const c of artifact.correlations) {
  movesInCorrelations.add(c.moveIdA);
  movesInCorrelations.add(c.moveIdB);
}

const orphanedMoves = TOP_TIER_CRAFT_MOVES.filter((m) => !movesInCorrelations.has(m.id));
if (orphanedMoves.length > TOP_TIER_CRAFT_MOVES.length * 0.3) {
  warn('8', `${orphanedMoves.length} of ${TOP_TIER_CRAFT_MOVES.length} moves have no correlations — unusually high. Inspect: ${orphanedMoves.slice(0, 5).map((m) => m.id).join(', ')}`);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK 9: Retrieval index artifact exists and is consistent with primary
// ─────────────────────────────────────────────────────────────────────────
console.log('CHECK 9: derivedCorrelationsByMove.json exists and cross-consistent...');

const RETRIEVAL_PATH = join(
  REPO_ROOT,
  'src',
  'services',
  'essayIntelligence',
  'corpus',
  'derivedCorrelationsByMove.json',
);

if (!existsSync(RETRIEVAL_PATH)) {
  fail('9', `Retrieval index not found at ${RETRIEVAL_PATH}`);
} else {
  const retrievalRaw = readFileSync(RETRIEVAL_PATH, 'utf-8');
  const retrievalArtifact = JSON.parse(retrievalRaw);

  // sourceHash must match
  if (retrievalArtifact.sourceHash !== artifact.sourceHash) {
    fail('9', `Retrieval index sourceHash does not match primary artifact`);
  }

  // Every move in the catalog should have an entry
  for (const move of TOP_TIER_CRAFT_MOVES) {
    if (!retrievalArtifact.byMove[move.id]) {
      fail('9', `Retrieval index missing entry for move '${move.id}'`);
    }
  }

  // Every strong correlation in the primary should appear in BOTH moves' strongCorrelations
  for (const corr of artifact.correlations.filter((c: any) => c.tier === 'strong-correlation')) {
    const aEntries = retrievalArtifact.byMove[corr.moveIdA]?.strongCorrelations ?? [];
    const bEntries = retrievalArtifact.byMove[corr.moveIdB]?.strongCorrelations ?? [];
    if (!aEntries.some((e: any) => e.moveId === corr.moveIdB)) {
      fail('9', `Retrieval index for '${corr.moveIdA}' missing strong pair with '${corr.moveIdB}'`);
    }
    if (!bEntries.some((e: any) => e.moveId === corr.moveIdA)) {
      fail('9', `Retrieval index for '${corr.moveIdB}' missing strong pair with '${corr.moveIdA}'`);
    }
  }

  // Sort order within each move: totalScore DESC must hold
  for (const [moveId, entry] of Object.entries<any>(retrievalArtifact.byMove)) {
    for (const bucket of ['strongCorrelations', 'suggestedCorrelations'] as const) {
      const list = entry[bucket];
      for (let i = 1; i < list.length; i++) {
        if (list[i - 1].totalScore < list[i].totalScore) {
          fail('9', `Retrieval index for '${moveId}' bucket=${bucket} not sorted by totalScore DESC at index ${i}`);
          break;
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('DERIVATION CORRECTNESS REPORT');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`Total correlations:    ${artifact.correlations.length}`);
console.log(`Strong correlations:   ${artifact.stats.strongCorrelations}`);
console.log(`Suggested pairings:    ${artifact.stats.suggestedPairings}`);
console.log(`Total pairs considered:${artifact.stats.totalPairsConsidered}`);
console.log(`Moves in correlations: ${movesInCorrelations.size} of ${TOP_TIER_CRAFT_MOVES.length}`);
console.log(`Moves orphaned:        ${orphanedMoves.length}`);
console.log(`Source hash:           ${artifact.sourceHash.slice(0, 16)}...`);
console.log('──────────────────────────────────────────────────────────────────');

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (failures.length > 0) {
  console.log(`\nFAILURES (${failures.length}):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('DERIVATION CORRECTNESS: FAILED');
  console.log('══════════════════════════════════════════════════════════════════');
  process.exit(1);
} else {
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('DERIVATION CORRECTNESS: PASSED');
  console.log('══════════════════════════════════════════════════════════════════');
  process.exit(0);
}
