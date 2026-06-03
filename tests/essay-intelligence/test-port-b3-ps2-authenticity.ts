#!/usr/bin/env tsx
/**
 * Port B3 — PS2 4-tier authenticity + brutal calibration guards smoke test
 *
 * Verifies:
 *   1. AUTHENTICITY_TIER_DEFINITIONS has all 4 tiers present with non-empty
 *      definitions and representative signals (>= 3 bullets per tier).
 *   2. buildPs2AuthenticityBlock() wraps the body with the B3_PS2_AUTHENTICITY
 *      block-version marker pair (cache-key divergence seed).
 *   3. Block body surfaces the four tier names, the "Red Flags for Grade
 *      Inflation" DON'T section, and the "10,000 applications" framing.
 *   4. clampNarrativeQualityIndex clamps 0..100 correctly (negative → 0,
 *      > 100 → 100, non-finite → null, null/undefined → null, fractional →
 *      rounded, string → Number-coerced).
 *   5. isEssayAuthenticityTier returns true only for the 4 enum values.
 *   6. OpenEnum tierOpen promotion — AnalysisPassOutput typed shape accepts
 *      the new B3 fields (compile-time check).
 *   7. L3.75 holisticSynthesis.ts regression guard — byte count unchanged
 *      since branch-off (this port is L3.5-only and must NOT touch L3.75).
 *
 * Measurement plan (see docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B3):
 *   Target a 20-essay evaluation set. Success criteria:
 *     (a) poolDensity distribution becomes bimodal (not monomodal-clustered
 *         at "moderate") — measured as the ratio of essays landing in the
 *         top/bottom 20% of NQI vs the middle 60%.
 *     (b) Spearman rho >= 0.6 between the LLM-emitted authenticity tier and
 *         human reviewer tier on the same essays.
 *   These gates live OUTSIDE this unit smoke — they require the real
 *   Anthropic API and a labeled corpus.
 *
 * Run: npx tsx tests/test-port-b3-ps2-authenticity.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  AUTHENTICITY_TIER_DEFINITIONS,
  ESSAY_AUTHENTICITY_TIERS,
  buildPs2AuthenticityBlock,
  clampNarrativeQualityIndex,
  isEssayAuthenticityTier,
  type EssayAuthenticityTier,
} from '../../src/services/essayIntelligence/rubrics/authenticityTiers';
import type { AnalysisPassOutput } from '../../src/services/essayIntelligence/profileTypes';
import {
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
} from '../../src/lib/llm/promptBlockVersions';

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

console.log('Port B3 — PS2 authenticity smoke');

// ---------------------------------------------------------------------------
// 1. All 4 tier definitions present + non-empty
// ---------------------------------------------------------------------------
const EXPECTED_TIERS: EssayAuthenticityTier[] = [
  'distinctive',
  'authentic',
  'emerging',
  'manufactured',
];
assert(
  ESSAY_AUTHENTICITY_TIERS.length === 4,
  `ESSAY_AUTHENTICITY_TIERS has 4 entries (got ${ESSAY_AUTHENTICITY_TIERS.length})`,
);
for (const tier of EXPECTED_TIERS) {
  const def = AUTHENTICITY_TIER_DEFINITIONS[tier];
  assert(def !== undefined, `AUTHENTICITY_TIER_DEFINITIONS.${tier} exists`);
  assert(
    typeof def.label === 'string' && def.label.length > 0,
    `AUTHENTICITY_TIER_DEFINITIONS.${tier}.label non-empty`,
  );
  assert(
    typeof def.definition === 'string' && def.definition.length > 20,
    `AUTHENTICITY_TIER_DEFINITIONS.${tier}.definition is substantial prose (got ${def.definition.length} chars)`,
  );
  assert(
    Array.isArray(def.representativeSignals) && def.representativeSignals.length >= 3,
    `AUTHENTICITY_TIER_DEFINITIONS.${tier}.representativeSignals has >= 3 bullets (got ${def.representativeSignals.length})`,
  );
}

// ---------------------------------------------------------------------------
// 2. buildPs2AuthenticityBlock wraps with B3 marker
// ---------------------------------------------------------------------------
const block = buildPs2AuthenticityBlock();
assert(block.length > 0, 'buildPs2AuthenticityBlock returns non-empty string');
const openMatch = block.match(BLOCK_OPEN_RE);
const closeMatch = block.match(BLOCK_CLOSE_RE);
assert(openMatch !== null, 'Block contains BLOCK open marker');
assert(closeMatch !== null, 'Block contains BLOCK close marker');
assert(
  openMatch?.[1] === 'B3_PS2_AUTHENTICITY',
  `Open marker blockId is B3_PS2_AUTHENTICITY (got ${openMatch?.[1]})`,
);
assert(
  closeMatch?.[1] === 'B3_PS2_AUTHENTICITY',
  `Close marker blockId is B3_PS2_AUTHENTICITY (got ${closeMatch?.[1]})`,
);

// ---------------------------------------------------------------------------
// 3. Block body surfaces tier names, Red Flags, and 10,000 applications test
// ---------------------------------------------------------------------------
assert(block.includes('DISTINCTIVE'), 'Block references DISTINCTIVE tier');
assert(block.includes('AUTHENTIC'), 'Block references AUTHENTIC tier');
assert(block.includes('EMERGING'), 'Block references EMERGING tier');
assert(block.includes('MANUFACTURED'), 'Block references MANUFACTURED tier');
assert(
  block.includes('RED FLAGS FOR GRADE INFLATION'),
  'Block surfaces "Red Flags for Grade Inflation" calibration guards',
);
assert(
  /DON'T/i.test(block),
  'Block surfaces the DON\'T calibration directives',
);
assert(
  block.includes('10,000'),
  'Block surfaces the "10,000 applications" test framing',
);
assert(
  block.toLowerCase().includes('orthogonal'),
  'Block documents orthogonality to the 5-tier quality scale',
);
assert(
  block.includes('narrativeQualityIndex'),
  'Block instructs the LLM to emit narrativeQualityIndex',
);
assert(
  block.includes('essayAuthenticityTier'),
  'Block references the essayAuthenticityTier output field',
);
assert(
  block.includes('essayAuthenticityTierOpen'),
  'Block references the OpenEnum escape hatch',
);

// ---------------------------------------------------------------------------
// 4. clampNarrativeQualityIndex behavior
// ---------------------------------------------------------------------------
assert(clampNarrativeQualityIndex(null) === null, 'clamp(null) === null');
assert(clampNarrativeQualityIndex(undefined) === null, 'clamp(undefined) === null');
assert(clampNarrativeQualityIndex(NaN) === null, 'clamp(NaN) === null');
assert(clampNarrativeQualityIndex(Infinity) === null, 'clamp(Infinity) === null');
assert(clampNarrativeQualityIndex(-Infinity) === null, 'clamp(-Infinity) === null');
assert(clampNarrativeQualityIndex(-1) === 0, 'clamp(-1) === 0 (negative → 0)');
assert(clampNarrativeQualityIndex(-9999) === 0, 'clamp(-9999) === 0');
assert(clampNarrativeQualityIndex(0) === 0, 'clamp(0) === 0');
assert(clampNarrativeQualityIndex(42) === 42, 'clamp(42) === 42');
assert(clampNarrativeQualityIndex(100) === 100, 'clamp(100) === 100');
assert(clampNarrativeQualityIndex(101) === 100, 'clamp(101) === 100 (>100 → 100)');
assert(clampNarrativeQualityIndex(9999) === 100, 'clamp(9999) === 100');
assert(clampNarrativeQualityIndex(72.6) === 73, 'clamp(72.6) rounds to 73');
assert(clampNarrativeQualityIndex('85') === 85, 'clamp("85") coerces numeric string');
assert(clampNarrativeQualityIndex('not a number') === null, 'clamp("not a number") === null');

// ---------------------------------------------------------------------------
// 5. isEssayAuthenticityTier typeguard
// ---------------------------------------------------------------------------
for (const tier of EXPECTED_TIERS) {
  assert(isEssayAuthenticityTier(tier), `isEssayAuthenticityTier('${tier}') === true`);
}
assert(!isEssayAuthenticityTier('DISTINCTIVE'), 'isEssayAuthenticityTier rejects uppercase');
assert(!isEssayAuthenticityTier('polished'), 'isEssayAuthenticityTier rejects unknown tier');
assert(!isEssayAuthenticityTier(null), 'isEssayAuthenticityTier rejects null');
assert(!isEssayAuthenticityTier(undefined), 'isEssayAuthenticityTier rejects undefined');
assert(!isEssayAuthenticityTier(42), 'isEssayAuthenticityTier rejects number');

// ---------------------------------------------------------------------------
// 6. AnalysisPassOutput typed shape accepts B3 fields (compile-time check)
// ---------------------------------------------------------------------------
const sampleOutput: AnalysisPassOutput = {
  paragraphIndex: 0,
  sentenceAnalyses: [],
  paragraphEffectiveness: 65,
  paragraphVerdict: 'test',
  essayAuthenticityTier: 'authentic',
  essayAuthenticityTierOpen: null,
  narrativeQualityIndex: 72,
  holisticAnalysisEvolution: {},
};
assert(
  sampleOutput.essayAuthenticityTier === 'authentic',
  'AnalysisPassOutput.essayAuthenticityTier accepts tier enum',
);
assert(
  sampleOutput.narrativeQualityIndex === 72,
  'AnalysisPassOutput.narrativeQualityIndex accepts number',
);

// OpenEnum promotion case — tierOpen populated when enum is null
const openEnumOutput: AnalysisPassOutput = {
  paragraphIndex: 0,
  sentenceAnalyses: [],
  paragraphEffectiveness: 65,
  paragraphVerdict: 'test',
  essayAuthenticityTier: null,
  essayAuthenticityTierOpen: 'some-unforeseen-tier-descriptor',
  narrativeQualityIndex: null,
  holisticAnalysisEvolution: {},
};
assert(
  openEnumOutput.essayAuthenticityTier === null && openEnumOutput.essayAuthenticityTierOpen === 'some-unforeseen-tier-descriptor',
  'OpenEnum tierOpen promotion: tier=null, tierOpen populated',
);

// Legacy-compatible output (fields omitted entirely)
const legacyOutput: AnalysisPassOutput = {
  paragraphIndex: 0,
  sentenceAnalyses: [],
  paragraphEffectiveness: 65,
  paragraphVerdict: 'test',
  holisticAnalysisEvolution: {},
};
assert(
  legacyOutput.essayAuthenticityTier === undefined,
  'AnalysisPassOutput accepts legacy shape without B3 fields',
);

// ---------------------------------------------------------------------------
// 7. L3.75 holisticSynthesis.ts regression guard — not touched by this port
// ---------------------------------------------------------------------------
const repoRoot = resolve(__dirname, '..', '..');
const holisticPath = resolve(repoRoot, 'src/services/essayIntelligence/analysis/holisticSynthesis.ts');
const holisticContent = readFileSync(holisticPath, 'utf8');
// Semantic regression guard — this port is L3.5-only. We used to check byte
// count but that couples this test to unrelated L3.75-legitimate edits (e.g.
// F2's DIAGNOSTIC PRIOR injection, A2's voice prior block). Content-based
// guards below are the load-bearing check: no B3-specific identifiers should
// leak into L3.75.
// Additional guard: no B3 block tag should appear in holisticSynthesis.
assert(
  !holisticContent.includes('B3_PS2_AUTHENTICITY'),
  'holisticSynthesis.ts does NOT reference B3_PS2_AUTHENTICITY',
);
assert(
  !holisticContent.includes('narrativeQualityIndex'),
  'holisticSynthesis.ts does NOT reference narrativeQualityIndex (L3.75 is descriptive-only)',
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
