/**
 * test-scope1-phase1-runtime.ts — Runtime behavior tests for Phase 1 changes.
 *
 * Validates:
 *   1. normalizeRhythmTag() — handles exact enum, prose-with-keyword,
 *      unrecognized input, non-string input, case/separator variations.
 *   2. buildCoachingMap() backward-compat — legacy object-shape
 *      emergentPatterns/scoreTensions flatten correctly to string[].
 *
 * These tests exist because tsconfig has `strict: false`, so the RhythmTag
 * enum and `string[]` type contracts are not enforced at compile time —
 * runtime behavior is the source of truth.
 *
 * Usage:
 *   npx tsx tests/test-scope1-phase1-runtime.ts
 */

import { normalizeRhythmTag, VALID_RHYTHM_TAGS } from '../../src/services/essayIntelligence/analysis/rhythmTag';
import { buildCoachingMap } from '../../src/services/essayIntelligence/analysis/crystallizer';

let passed = 0;
let failed = 0;

function assertEq<T>(actual: T, expected: T, name: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition: boolean, name: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

// ============================================================================
// Test Suite 1: normalizeRhythmTag
// ============================================================================

console.log('\n=== Phase 1 Runtime Tests ===\n');
console.log('Suite 1: normalizeRhythmTag()\n');

// Exact matches
console.log('Exact enum matches:');
assertEq(normalizeRhythmTag('short_punch'), 'short_punch', 'short_punch');
assertEq(normalizeRhythmTag('medium_flow'), 'medium_flow', 'medium_flow');
assertEq(normalizeRhythmTag('long_build'), 'long_build', 'long_build');
assertEq(normalizeRhythmTag('fragment'), 'fragment', 'fragment');
assertEq(normalizeRhythmTag('staccato'), 'staccato', 'staccato');
assertEq(normalizeRhythmTag('anaphora_series'), 'anaphora_series', 'anaphora_series');
assertEq(normalizeRhythmTag('parallel_build'), 'parallel_build', 'parallel_build');
assertEq(normalizeRhythmTag('subordinate_delay'), 'subordinate_delay', 'subordinate_delay');

// Empty inputs
console.log('\nEmpty inputs:');
assertEq(normalizeRhythmTag(''), '', 'empty string → empty');
assertEq(normalizeRhythmTag(null), '', 'null → empty');
assertEq(normalizeRhythmTag(undefined), '', 'undefined → empty');
assertEq(normalizeRhythmTag(42), '', 'number → empty');
assertEq(normalizeRhythmTag({}), '', 'object → empty');
assertEq(normalizeRhythmTag([]), '', 'array → empty');

// Case/separator variations
console.log('\nCase and separator normalization:');
assertEq(normalizeRhythmTag('SHORT_PUNCH'), 'short_punch', 'uppercase → lowercase');
assertEq(normalizeRhythmTag('Short_Punch'), 'short_punch', 'mixed case');
assertEq(normalizeRhythmTag('short punch'), 'short_punch', 'space → underscore');
assertEq(normalizeRhythmTag('short-punch'), 'short_punch', 'hyphen → underscore');
assertEq(normalizeRhythmTag('  short_punch  '), 'short_punch', 'whitespace trimmed');
assertEq(normalizeRhythmTag('Medium Flow'), 'medium_flow', 'medium flow (spaced + cased)');

// Prose-with-keyword fallback (Phase 1 tolerance — LLM still emits prose)
console.log('\nProse-with-keyword fallback:');
assertEq(
  normalizeRhythmTag('short_punch — mirrors the essay\'s dominant rhythm'),
  'short_punch',
  'prose starting with enum value',
);
assertEq(
  normalizeRhythmTag('A staccato series of declaratives'),
  'staccato',
  'prose containing staccato',
);
assertEq(
  normalizeRhythmTag('subordinate_delay clauses build anticipation'),
  'subordinate_delay',
  'prose with subordinate_delay',
);

// Longest-first priority (avoid substring ambiguity)
console.log('\nLongest-first priority:');
assertEq(
  normalizeRhythmTag('anaphora_series with parallel_build underneath'),
  'anaphora_series',
  'anaphora_series wins over parallel_build (order matters)',
);

// Unrecognized → empty
console.log('\nUnrecognized inputs fall back to empty:');
assertEq(normalizeRhythmTag('rhythmic'), '', '"rhythmic" → empty');
assertEq(normalizeRhythmTag('varied'), '', '"varied" → empty');
assertEq(normalizeRhythmTag('flowing'), '', '"flowing" → empty (no enum match)');
assertEq(normalizeRhythmTag('declarative tone'), '', '"declarative tone" → empty');

// VALID_RHYTHM_TAGS export
console.log('\nVALID_RHYTHM_TAGS export:');
assertTrue(VALID_RHYTHM_TAGS.length === 9, `Contains 9 values (got ${VALID_RHYTHM_TAGS.length})`);
assertTrue(VALID_RHYTHM_TAGS.includes(''), 'Includes empty string (uncharacterized)');
assertTrue(VALID_RHYTHM_TAGS.includes('short_punch'), 'Includes short_punch');
assertTrue(VALID_RHYTHM_TAGS.includes('subordinate_delay'), 'Includes subordinate_delay');

// ============================================================================
// Test Suite 2: buildCoachingMap() backward-compat parser
// ============================================================================

console.log('\n\nSuite 2: buildCoachingMap() backward-compat\n');

// Test 2A: New shape (string[]) passes through unchanged
console.log('New string[] shape (post-Phase-2 LLM output):');
{
  const raw = {
    transformativeInsight: {
      insight: 'test insight',
      evidenceLocations: [],
      whyThisTransforms: 'test',
      requiresStudentAwareness: false,
    },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: [
      'Pattern: voice strongest in P1, retreats in P4',
      'Pattern: scene density drops after mid-essay',
    ],
    scoreTensions: ['P2: structural(92) >> effectiveness(55) — pivot telegraphed'],
  };

  const result = buildCoachingMap(raw, 7);
  assertTrue(result !== undefined, 'buildCoachingMap returns a valid result');
  assertEq(result?.emergentPatterns.length, 2, 'emergentPatterns: 2 entries preserved');
  assertEq(
    result?.emergentPatterns[0],
    'Pattern: voice strongest in P1, retreats in P4',
    'emergentPatterns[0]: exact string preserved',
  );
  assertEq(result?.scoreTensions.length, 1, 'scoreTensions: 1 entry preserved');
  assertEq(
    result?.scoreTensions[0],
    'P2: structural(92) >> effectiveness(55) — pivot telegraphed',
    'scoreTensions[0]: exact string preserved',
  );
}

// Test 2B: Legacy object shape flattens correctly
console.log('\nLegacy object shape (persisted pre-Phase-1 profiles):');
{
  const raw = {
    transformativeInsight: {
      insight: 'test',
      evidenceLocations: [],
      whyThisTransforms: '',
      requiresStudentAwareness: false,
    },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: [
      { pattern: 'Summary mode', evidence: 'P1 and P3 operate entirely in telling' },
      { pattern: 'Abstract voice', evidence: 'no sensory grounding in P2-P5' },
    ],
    scoreTensions: [
      {
        paragraph: 2,
        tension: 'high thematic weight but low effectiveness',
        interpretation: 'claim without evidence',
        coachingImplication: 'ground the claim in a specific moment',
      },
    ],
  };

  const result = buildCoachingMap(raw, 7);
  assertTrue(result !== undefined, 'buildCoachingMap returns result for legacy shape');
  assertEq(result?.emergentPatterns.length, 2, 'Legacy emergentPatterns: 2 flattened entries');
  assertEq(
    result?.emergentPatterns[0],
    'Summary mode — P1 and P3 operate entirely in telling',
    'Legacy emergentPatterns[0] flattens to "pattern — evidence"',
  );
  assertEq(result?.scoreTensions.length, 1, 'Legacy scoreTensions: 1 flattened entry');
  assertEq(
    result?.scoreTensions[0],
    'P2: high thematic weight but low effectiveness — ground the claim in a specific moment',
    'Legacy scoreTensions[0] flattens to "P{n}: tension — coachingImplication"',
  );
}

// Test 2C: Mixed shape (some strings, some objects) — both survive
console.log('\nMixed shape (partial migration):');
{
  const raw = {
    transformativeInsight: { insight: '', evidenceLocations: [], whyThisTransforms: '', requiresStudentAwareness: false },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: [
      'Pattern: already flattened',
      { pattern: 'Legacy item', evidence: 'needs flattening' },
    ],
    scoreTensions: [],
  };

  const result = buildCoachingMap(raw, 7);
  assertEq(result?.emergentPatterns.length, 2, 'Mixed emergentPatterns: both shapes survive');
  assertEq(result?.emergentPatterns[0], 'Pattern: already flattened', 'String entry preserved');
  assertEq(result?.emergentPatterns[1], 'Legacy item — needs flattening', 'Object entry flattened');
}

// Test 2D: Hard cap at 3 entries
console.log('\nHard cap at 3 entries:');
{
  const raw = {
    transformativeInsight: { insight: '', evidenceLocations: [], whyThisTransforms: '', requiresStudentAwareness: false },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: [
      'Pattern 1',
      'Pattern 2',
      'Pattern 3',
      'Pattern 4',
      'Pattern 5',
    ],
    scoreTensions: [],
  };

  const result = buildCoachingMap(raw, 7);
  assertEq(result?.emergentPatterns.length, 3, 'emergentPatterns capped at 3 (was 5)');
  assertEq(result?.emergentPatterns[0], 'Pattern 1', 'First 3 preserved in order');
  assertEq(result?.emergentPatterns[2], 'Pattern 3', 'Third entry is the last');
}

// Test 2E: Empty strings filtered out
console.log('\nEmpty strings filtered out:');
{
  const raw = {
    transformativeInsight: { insight: '', evidenceLocations: [], whyThisTransforms: '', requiresStudentAwareness: false },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: ['Real pattern', '', '   ', 'Another real one'],
    scoreTensions: [],
  };

  const result = buildCoachingMap(raw, 7);
  assertEq(result?.emergentPatterns.length, 2, 'Empty and whitespace strings filtered');
  assertEq(result?.emergentPatterns[0], 'Real pattern', 'First real entry preserved');
  assertEq(result?.emergentPatterns[1], 'Another real one', 'Second real entry preserved');
}

// Test 2F: Malformed input → empty array
console.log('\nMalformed input handling:');
{
  const raw = {
    transformativeInsight: { insight: '', evidenceLocations: [], whyThisTransforms: '', requiresStudentAwareness: false },
    priorities: [],
    protectedStrengths: [],
    emergentPatterns: 'not an array',
    scoreTensions: null,
  };

  const result = buildCoachingMap(raw, 7);
  assertEq(result?.emergentPatterns.length, 0, 'Non-array emergentPatterns → empty array');
  assertEq(result?.scoreTensions.length, 0, 'Null scoreTensions → empty array');
}

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Phase 1 runtime tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All Phase 1 runtime tests passed');
}
