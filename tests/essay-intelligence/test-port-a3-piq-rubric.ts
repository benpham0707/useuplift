#!/usr/bin/env tsx
/**
 * Port A3 — PIQ 13-dim rubric smoke test
 *
 * Verifies:
 *   1. src/services/essayIntelligence/rubrics/piqRubric.ts exposes
 *      PIQ_RUBRIC_DIMENSIONS (13 dims) and PRIMARY_DIMENSIONS_BY_PIQ (8 keys).
 *   2. PRIMARY_DIMENSIONS_BY_PIQ primary dims are all valid PIQRubricDimension
 *      members.
 *   3. buildPiqModeBlock(null) → '' (non-PIQ path).
 *   4. buildPiqModeBlock('piq5_challenge') returns content wrapped with the
 *      A3_PIQ_RUBRIC block-version marker (cache-key divergence seed).
 *   5. Different piqPromptType values produce different marked content
 *      (prompt-specific primary dimensions differ).
 *   6. piqModeAntiClusteringClause() returns non-empty string content.
 *   7. SentenceAnalysis TypeScript shape accepts optional piqDimensions +
 *      piqDimensionsOpen fields (compile-time check).
 *
 * Run: npx tsx tests/test-port-a3-piq-rubric.ts
 */

import {
  PIQ_RUBRIC_DIMENSIONS,
  PRIMARY_DIMENSIONS_BY_PIQ,
  buildPiqModeBlock,
  piqModeAntiClusteringClause,
} from '../../src/services/essayIntelligence/rubrics/piqRubric';
import type { PIQRubricDimension, PIQPromptType } from '../../src/services/essayIntelligence/rubrics/piqRubric';
import type { SentenceAnalysis } from '../../src/services/essayIntelligence/profileTypes';
import { BLOCK_OPEN_RE, BLOCK_CLOSE_RE } from '../../src/lib/llm/promptBlockVersions';

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

console.log('Port A3 — PIQ 13-dim rubric smoke');

// 1. Catalog + per-prompt map shape
assert(Array.isArray(PIQ_RUBRIC_DIMENSIONS), 'PIQ_RUBRIC_DIMENSIONS is an array');
assert(
  PIQ_RUBRIC_DIMENSIONS.length === 13,
  `PIQ_RUBRIC_DIMENSIONS has 13 dimensions (got ${PIQ_RUBRIC_DIMENSIONS.length})`,
);

const PROMPT_TYPES: PIQPromptType[] = [
  'piq1_leadership',
  'piq2_creative',
  'piq3_talent',
  'piq4_educational',
  'piq5_challenge',
  'piq6_academic',
  'piq7_community',
  'piq8_open_ended',
];
assert(
  Object.keys(PRIMARY_DIMENSIONS_BY_PIQ).length === 8,
  `PRIMARY_DIMENSIONS_BY_PIQ covers 8 prompts (got ${Object.keys(PRIMARY_DIMENSIONS_BY_PIQ).length})`,
);
for (const pt of PROMPT_TYPES) {
  assert(
    Array.isArray(PRIMARY_DIMENSIONS_BY_PIQ[pt]),
    `PRIMARY_DIMENSIONS_BY_PIQ.${pt} is an array`,
  );
}

// 2. Primary-dim membership: every primary dim is a valid PIQRubricDimension
const allDimensionKeys = new Set<string>(
  PIQ_RUBRIC_DIMENSIONS.map((d) => d.dimension),
);
for (const pt of PROMPT_TYPES) {
  for (const dim of PRIMARY_DIMENSIONS_BY_PIQ[pt]) {
    assert(
      allDimensionKeys.has(dim),
      `PRIMARY_DIMENSIONS_BY_PIQ.${pt} contains valid dimension '${dim}'`,
    );
  }
}

// 3. Non-PIQ path returns empty
assert(
  buildPiqModeBlock(null) === '',
  'buildPiqModeBlock(null) returns empty string',
);
assert(
  buildPiqModeBlock(undefined) === '',
  'buildPiqModeBlock(undefined) returns empty string',
);

// 4. PIQ path wraps content with A3_PIQ_RUBRIC block-version markers
const piq5Block = buildPiqModeBlock('piq5_challenge');
assert(piq5Block.length > 0, 'buildPiqModeBlock("piq5_challenge") returns non-empty');
const openMatch = piq5Block.match(BLOCK_OPEN_RE);
const closeMatch = piq5Block.match(BLOCK_CLOSE_RE);
assert(openMatch !== null, 'PIQ block contains BLOCK open marker');
assert(closeMatch !== null, 'PIQ block contains BLOCK close marker');
assert(
  openMatch?.[1] === 'A3_PIQ_RUBRIC',
  `Open marker blockId is A3_PIQ_RUBRIC (got ${openMatch?.[1]})`,
);
assert(
  closeMatch?.[1] === 'A3_PIQ_RUBRIC',
  `Close marker blockId is A3_PIQ_RUBRIC (got ${closeMatch?.[1]})`,
);
assert(
  piq5Block.includes('PIQ_MODE ACTIVE'),
  'PIQ block body contains PIQ_MODE ACTIVE header',
);
assert(
  piq5Block.includes('piq5_challenge'),
  'PIQ block body references the specific prompt type',
);
assert(
  piq5Block.includes('piqDimensions'),
  'PIQ block body references the piqDimensions output field',
);
assert(
  piq5Block.includes('piqDimensionsOpen'),
  'PIQ block body references the OpenEnum escape hatch',
);

// 5. Different prompt types produce different content
const piq1Block = buildPiqModeBlock('piq1_leadership');
const piq2Block = buildPiqModeBlock('piq2_creative');
assert(piq1Block !== piq2Block, 'Different PIQ prompt types produce different block content');

// 6. Anti-clustering clause is non-empty content
const clause = piqModeAntiClusteringClause();
assert(typeof clause === 'string' && clause.length > 0, 'piqModeAntiClusteringClause returns non-empty string');
assert(
  clause.includes('dimension'),
  'anti-clustering clause references dimension-wise differentiation',
);

// 7. TypeScript shape compile-time check — SentenceAnalysis accepts new fields
const sampleSentence: SentenceAnalysis = {
  effectiveness: 72,
  effectivenessReasoning: 'test',
  strengths: [],
  weaknesses: [],
  isStrength: false,
  isProblem: false,
  priorityForImprovement: 2,
  piqDimensions: { vulnerability_authenticity: 8, narrative_arc_stakes: 7 },
  piqDimensionsOpen: null,
};
assert(sampleSentence.piqDimensions?.vulnerability_authenticity === 8, 'SentenceAnalysis.piqDimensions accepts 0-10 scores');
assert(sampleSentence.piqDimensionsOpen === null, 'SentenceAnalysis.piqDimensionsOpen accepts null');

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
