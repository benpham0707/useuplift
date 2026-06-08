#!/usr/bin/env tsx
/**
 * Wave-1b.5 — Prompt Block Versions seam tests
 *
 * Verifies the block-versioned prompt composition infrastructure:
 *   1. Manifest well-formedness — every PromptBlockId in PROMPT_BLOCK_VERSIONS
 *      has a corresponding PROMPT_BLOCK_DECLARATIONS entry, and vice versa.
 *   2. Every version string matches vMAJOR.MINOR.PATCH.
 *   3. Every declaration carries a valid ContractLevel.
 *   4. withPromptBlockVersion wraps body with open + close markers.
 *   5. Different versions produce different marked text (cache-key divergence).
 *   6. Idempotence: re-wrapping the same blockId replaces the marker rather
 *      than nesting.
 *   7. isKnownBlockId recognizes manifest entries and rejects unknowns.
 *
 * Run:  npx tsx tests/test-prompt-block-versions.ts
 */

import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
  withPromptBlockVersion,
  isKnownBlockId,
  getBlockContractLevel,
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
  type PromptBlockId,
  type ContractLevel,
} from '../../src/lib/llm/promptBlockVersions';

let failed = 0;
let passed = 0;

function assert(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('Wave-1b.5: PROMPT_BLOCK_VERSIONS manifest + withPromptBlockVersion');

// ---------------------------------------------------------------------------
// 1. Manifest well-formedness
// ---------------------------------------------------------------------------

const versionIds = Object.keys(PROMPT_BLOCK_VERSIONS) as PromptBlockId[];
const declarationIds = Object.keys(PROMPT_BLOCK_DECLARATIONS) as PromptBlockId[];

assert(
  versionIds.length > 0,
  `PROMPT_BLOCK_VERSIONS contains at least one entry (found ${versionIds.length})`,
);

assert(
  versionIds.length === declarationIds.length,
  `PROMPT_BLOCK_VERSIONS and PROMPT_BLOCK_DECLARATIONS have matching size (${versionIds.length} vs ${declarationIds.length})`,
);

for (const id of versionIds) {
  assert(
    declarationIds.includes(id),
    `${id} has a PROMPT_BLOCK_DECLARATIONS entry`,
  );
}
for (const id of declarationIds) {
  assert(
    versionIds.includes(id),
    `${id} has a PROMPT_BLOCK_VERSIONS entry`,
  );
}

// ---------------------------------------------------------------------------
// 2. Version-string shape
// ---------------------------------------------------------------------------

const SEMVER_RE = /^v\d+\.\d+\.\d+$/;
for (const id of versionIds) {
  const v = PROMPT_BLOCK_VERSIONS[id];
  assert(
    SEMVER_RE.test(v),
    `${id} version '${v}' matches vMAJOR.MINOR.PATCH`,
  );
}

// ---------------------------------------------------------------------------
// 3. Declaration level is a valid ContractLevel
// ---------------------------------------------------------------------------

const VALID_LEVELS: readonly ContractLevel[] = ['descriptive', 'evaluative', 'prescriptive'];
for (const id of declarationIds) {
  const lvl = PROMPT_BLOCK_DECLARATIONS[id].level;
  assert(
    VALID_LEVELS.includes(lvl),
    `${id} declared level '${lvl}' is a valid ContractLevel`,
  );
  const note = PROMPT_BLOCK_DECLARATIONS[id].note;
  assert(
    typeof note === 'string' && note.length > 0,
    `${id} declared note is a non-empty string`,
  );
}

// ---------------------------------------------------------------------------
// 4. withPromptBlockVersion open + close markers
// ---------------------------------------------------------------------------

const sampleId: PromptBlockId = 'A2_VOICE_PRIOR';
const body = 'PRIOR OBSERVATION (from earlier essays): register: informal';
const wrapped = withPromptBlockVersion(body, sampleId);

const openMatch = wrapped.match(BLOCK_OPEN_RE);
const closeMatch = wrapped.match(BLOCK_CLOSE_RE);

assert(openMatch !== null, 'Wrapped output contains an open BLOCK marker');
assert(closeMatch !== null, 'Wrapped output contains a close BLOCK marker');
assert(
  openMatch?.[1] === sampleId,
  `Open marker blockId is ${sampleId}`,
);
assert(
  openMatch?.[2] === PROMPT_BLOCK_VERSIONS[sampleId],
  `Open marker version matches manifest (${openMatch?.[2]} === ${PROMPT_BLOCK_VERSIONS[sampleId]})`,
);
assert(
  closeMatch?.[1] === sampleId,
  `Close marker blockId is ${sampleId}`,
);
assert(
  wrapped.includes(body),
  'Original body is preserved inside the markers',
);

// ---------------------------------------------------------------------------
// 5. Different versions produce different marked text
// ---------------------------------------------------------------------------

const wrappedA = withPromptBlockVersion(body, sampleId, 'v1.0.0');
const wrappedB = withPromptBlockVersion(body, sampleId, 'v1.0.1');
assert(
  wrappedA !== wrappedB,
  'Different versions produce different wrapped output (cache-key divergence)',
);

// ---------------------------------------------------------------------------
// 6. Idempotence: re-wrap replaces rather than nests
// ---------------------------------------------------------------------------

const reWrapped = withPromptBlockVersion(wrapped, sampleId);
const reOpenCount = (reWrapped.match(/<!-- BLOCK:A2_VOICE_PRIOR@/g) ?? []).length;
const reCloseCount = (reWrapped.match(/<!-- \/BLOCK:A2_VOICE_PRIOR /g) ?? []).length;
assert(reOpenCount === 1, 'Re-wrapping yields exactly one open marker (idempotent)');
assert(reCloseCount === 1, 'Re-wrapping yields exactly one close marker (idempotent)');

// Re-wrapping with a different version should replace, not stack.
const reWrappedNewVersion = withPromptBlockVersion(wrapped, sampleId, 'v2.0.0');
const v1Count = (reWrappedNewVersion.match(/@v1\.0\.0/g) ?? []).length;
const v2Count = (reWrappedNewVersion.match(/@v2\.0\.0/g) ?? []).length;
assert(v1Count === 0, 'Re-wrapping with new version strips the old version marker');
assert(v2Count === 1, 'Re-wrapping with new version writes exactly one new marker');

// ---------------------------------------------------------------------------
// 7. isKnownBlockId + getBlockContractLevel
// ---------------------------------------------------------------------------

assert(isKnownBlockId('A2_VOICE_PRIOR'), 'isKnownBlockId recognizes manifest entry');
assert(!isKnownBlockId('NOT_A_REAL_BLOCK'), 'isKnownBlockId rejects unknown id');

assert(
  getBlockContractLevel('A2_VOICE_PRIOR') === 'descriptive',
  'getBlockContractLevel returns descriptive for A2_VOICE_PRIOR',
);
assert(
  getBlockContractLevel('A3_PIQ_RUBRIC') === 'evaluative',
  'getBlockContractLevel returns evaluative for A3_PIQ_RUBRIC',
);
assert(
  getBlockContractLevel('A1_COACHING_GUARDRAILS') === 'prescriptive',
  'getBlockContractLevel returns prescriptive for A1_COACHING_GUARDRAILS',
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
