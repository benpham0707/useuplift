/**
 * test-scope2-phase4-runtime.ts — Scope 2 Phase 4 infrastructure tests.
 *
 * Validates:
 *   1. ImprovementCandidateStore CRUD — add, addAll, get, getActive,
 *      getBySource, getByScope, getActiveSortedByCoachingValue, size.
 *   2. Lifecycle transitions — markConsolidated, markSuperseded,
 *      markFinalized. Verifies forward-only semantics
 *      (superseded cannot be un-consolidated).
 *   3. Idempotent add — duplicate IDs skip with debug log.
 *   4. serialize / deserialize round-trip.
 *   5. buildId produces stable, deterministic IDs matching
 *      buildCandidateId() from Phase 1.5.
 *   6. toL4ContextBlock — returns stub sentence on empty store, JSON on
 *      populated store.
 *   7. techniqueVocabulary — TECHNIQUE_VOCABULARY_LIST has 20 entries,
 *      all unique; TECHNIQUE_VOCABULARY_PROMPT_BLOCK renders correctly;
 *      isValidTechnique and normalizeTechnique behave correctly.
 *   8. TECHNIQUE_VOCABULARY_LIST matches coachingService.TECHNIQUE_ROUTES
 *      (length + names) — drift guard.
 *
 * Usage:
 *   npx tsx tests/test-scope2-phase4-runtime.ts
 */

import { ImprovementCandidateStore } from '../src/services/essayIntelligence/improvements/improvementCandidateStore';
import { buildCandidateId } from '../src/services/essayIntelligence/improvements/candidateIds';
import {
  TECHNIQUE_VOCABULARY_LIST,
  TECHNIQUE_VOCABULARY_PROMPT_BLOCK,
  isValidTechnique,
  normalizeTechnique,
} from '../src/services/essayIntelligence/analysis/techniqueVocabulary';
import { getTechniqueRouteNames } from '../src/services/essayIntelligence/coaching/techniqueMatcher';
import type { ImprovementCandidate } from '../src/services/essayIntelligence/profileTypes';

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

function makeCandidate(overrides: Partial<ImprovementCandidate> = {}): ImprovementCandidate {
  const id = overrides.id ?? ImprovementCandidateStore.buildId('L3.5', 0, null, 'test-salt');
  return {
    id,
    sourceLayer: 'L3.5',
    paragraph: 0,
    sentence: null,
    sourceFindingId: null,
    observation: 'Test observation',
    suggestedChange: 'Test suggestion',
    technique: null,
    demonstrationSketch: null,
    coachingValue: 'medium',
    lifecycleState: 'candidate',
    supersededBy: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

console.log('\n=== Scope 2 Phase 4 Runtime Tests ===\n');

// ============================================================================
// Suite 1: ImprovementCandidateStore basic CRUD
// ============================================================================

console.log('Suite 1: CRUD basics\n');
{
  const store = new ImprovementCandidateStore();
  assertEq(store.size, 0, 'empty store has size 0');
  assertEq(store.getActive().length, 0, 'empty store has no active candidates');

  const c1 = makeCandidate({ id: 'CAND_L35_P0_0001', paragraph: 0 });
  const c2 = makeCandidate({ id: 'CAND_L35_P1_0002', paragraph: 1 });
  const c3 = makeCandidate({ id: 'CAND_L3_P2_0003', paragraph: 2, sourceLayer: 'L3' });

  store.add(c1);
  store.add(c2);
  store.addAll([c3]);

  assertEq(store.size, 3, 'size = 3 after adding 3 candidates');
  assertEq(store.getActive().length, 3, 'all 3 are active by default');
  assertEq(store.get('CAND_L35_P0_0001')?.id, 'CAND_L35_P0_0001', 'get() returns candidate by ID');
  assertEq(store.get('nonexistent'), undefined, 'get() returns undefined for missing ID');
}

// ============================================================================
// Suite 2: getBySource, getByScope, getActiveSortedByCoachingValue
// ============================================================================

console.log('\nSuite 2: Filters + sorting\n');
{
  const store = new ImprovementCandidateStore();
  store.addAll([
    makeCandidate({ id: 'a', sourceLayer: 'L3', paragraph: 0, coachingValue: 'medium' }),
    makeCandidate({ id: 'b', sourceLayer: 'L3.5', paragraph: 1, coachingValue: 'critical' }),
    makeCandidate({ id: 'c', sourceLayer: 'L3.75', paragraph: 0, coachingValue: 'high' }),
    makeCandidate({ id: 'd', sourceLayer: 'L3.5', paragraph: 2, coachingValue: 'diagnostic' }),
  ]);

  assertEq(store.getBySource('L3').length, 1, 'getBySource L3 = 1');
  assertEq(store.getBySource('L3.5').length, 2, 'getBySource L3.5 = 2');
  assertEq(store.getBySource('L3.75').length, 1, 'getBySource L3.75 = 1');

  assertEq(store.getByScope(0).length, 2, 'getByScope paragraph 0 = 2');
  assertEq(store.getByScope(1).length, 1, 'getByScope paragraph 1 = 1');
  assertEq(store.getByScope(99).length, 0, 'getByScope paragraph 99 = 0');

  const sorted = store.getActiveSortedByCoachingValue();
  assertEq(sorted[0].id, 'b', 'sorted[0] is critical (id=b)');
  assertEq(sorted[1].id, 'c', 'sorted[1] is high (id=c)');
  assertEq(sorted[2].id, 'a', 'sorted[2] is medium (id=a)');
  assertEq(sorted[3].id, 'd', 'sorted[3] is diagnostic (id=d)');
}

// ============================================================================
// Suite 3: Lifecycle transitions
// ============================================================================

console.log('\nSuite 3: Lifecycle transitions\n');
{
  const store = new ImprovementCandidateStore();
  store.addAll([
    makeCandidate({ id: 'x' }),
    makeCandidate({ id: 'y' }),
    makeCandidate({ id: 'z' }),
  ]);

  store.markConsolidated(['x']);
  assertEq(store.get('x')?.lifecycleState, 'consolidated', 'x → consolidated');
  assertEq(store.getActive().length, 3, 'consolidated still counts as active');

  store.markSuperseded(['y'], 'x');
  assertEq(store.get('y')?.lifecycleState, 'superseded', 'y → superseded');
  assertEq(store.get('y')?.supersededBy, 'x', 'y.supersededBy = x');
  assertEq(store.getActive().length, 2, 'superseded excluded from getActive');

  store.markFinalized(['z']);
  assertEq(store.get('z')?.lifecycleState, 'finalized', 'z → finalized');

  // Forward-only: markConsolidated on a superseded candidate is a no-op
  store.markConsolidated(['y']);
  assertEq(store.get('y')?.lifecycleState, 'superseded', 'superseded cannot be un-superseded');
}

// ============================================================================
// Suite 4: Idempotent add
// ============================================================================

console.log('\nSuite 4: Idempotent add\n');
{
  const store = new ImprovementCandidateStore();
  const c = makeCandidate({ id: 'dup-test', observation: 'original' });
  store.add(c);
  assertEq(store.size, 1, 'size = 1 after first add');

  // Second add with same ID — should be a no-op (idempotent)
  const c2 = makeCandidate({ id: 'dup-test', observation: 'attempted override' });
  store.add(c2);
  assertEq(store.size, 1, 'size still 1 after duplicate add (idempotent skip)');
  assertEq(
    store.get('dup-test')?.observation,
    'original',
    'original candidate preserved (no overwrite on dup)',
  );
}

// ============================================================================
// Suite 5: Serialize / deserialize round-trip
// ============================================================================

console.log('\nSuite 5: Serialize / deserialize round-trip\n');
{
  const store = new ImprovementCandidateStore();
  store.addAll([
    makeCandidate({ id: 'one', observation: 'first' }),
    makeCandidate({ id: 'two', observation: 'second' }),
  ]);
  store.markConsolidated(['one']);

  const snapshot = store.serialize();
  assertEq(snapshot.candidates.length, 2, 'snapshot has 2 candidates');
  assertEq(snapshot.nextId, 1, 'snapshot nextId preserved');

  const restored = ImprovementCandidateStore.deserialize(snapshot);
  assertEq(restored.size, 2, 'restored store has 2 candidates');
  assertEq(
    restored.get('one')?.lifecycleState,
    'consolidated',
    'restored lifecycleState preserved',
  );
  assertEq(restored.get('two')?.observation, 'second', 'restored observation preserved');
}

// ============================================================================
// Suite 6: buildId deterministic
// ============================================================================

console.log('\nSuite 6: buildId determinism\n');
{
  const id1 = ImprovementCandidateStore.buildId('L3.5', 2, 3, 'observation about summary mode');
  const id2 = ImprovementCandidateStore.buildId('L3.5', 2, 3, 'observation about summary mode');
  assertEq(id1, id2, 'same inputs produce same ID');
  assertTrue(id1.startsWith('CAND_L3_5_P2S3_'), 'ID format: CAND_L3_5_P2S3_{hash}');

  // Matches the underlying buildCandidateId helper
  const directId = buildCandidateId('L3.5', 2, 3, 'observation about summary mode');
  assertEq(id1, directId, 'buildId delegates to buildCandidateId');
}

// ============================================================================
// Suite 7: toL4ContextBlock
// ============================================================================

console.log('\nSuite 7: toL4ContextBlock\n');
{
  const empty = new ImprovementCandidateStore();
  const emptyBlock = empty.toL4ContextBlock();
  assertTrue(
    emptyBlock.includes('no pre-generated candidates'),
    'empty store returns stub sentence',
  );

  const populated = new ImprovementCandidateStore();
  populated.add(
    makeCandidate({
      id: 'test-id',
      observation: 'summary mode in P2',
      suggestedChange: 'show it instead',
      coachingValue: 'high',
      technique: 'SUMMARY-TO-SCENE',
    }),
  );
  const block = populated.toL4ContextBlock();
  assertTrue(block.includes('test-id'), 'L4 block contains candidate ID');
  assertTrue(block.includes('summary mode in P2'), 'L4 block contains observation');
  assertTrue(block.includes('SUMMARY-TO-SCENE'), 'L4 block contains technique');
  assertTrue(block.startsWith('['), 'L4 block is JSON array');

  // Superseded candidates are excluded from the L4 block
  populated.add(
    makeCandidate({
      id: 'superseded-id',
      observation: 'superseded thing',
      lifecycleState: 'superseded',
    }),
  );
  const blockAfter = populated.toL4ContextBlock();
  assertTrue(!blockAfter.includes('superseded-id'), 'L4 block excludes superseded candidates');
}

// ============================================================================
// Suite 8: techniqueVocabulary + cross-file sync with coachingService
// ============================================================================

console.log('\nSuite 8: techniqueVocabulary\n');
{
  assertEq(TECHNIQUE_VOCABULARY_LIST.length, 20, 'vocabulary has 20 entries');
  assertEq(new Set(TECHNIQUE_VOCABULARY_LIST).size, 20, 'all 20 are unique');
  assertTrue(TECHNIQUE_VOCABULARY_LIST.includes('SUMMARY-TO-SCENE'), 'includes SUMMARY-TO-SCENE');
  assertTrue(
    TECHNIQUE_VOCABULARY_LIST.includes('INCREMENTAL REVELATION'),
    'includes INCREMENTAL REVELATION',
  );

  assertTrue(
    TECHNIQUE_VOCABULARY_PROMPT_BLOCK.includes('TECHNIQUE VOCABULARY'),
    'PROMPT_BLOCK has header',
  );
  assertTrue(
    TECHNIQUE_VOCABULARY_PROMPT_BLOCK.includes('SUMMARY-TO-SCENE'),
    'PROMPT_BLOCK lists SUMMARY-TO-SCENE',
  );
  assertTrue(
    TECHNIQUE_VOCABULARY_PROMPT_BLOCK.includes('case-sensitive'),
    'PROMPT_BLOCK reminds of case sensitivity',
  );

  // isValidTechnique
  assertTrue(isValidTechnique(null), 'null is valid (opted out)');
  assertTrue(isValidTechnique('SUMMARY-TO-SCENE'), 'exact match valid');
  assertTrue(!isValidTechnique('summary-to-scene'), 'lowercase not valid');
  assertTrue(!isValidTechnique('unknown-technique'), 'unknown not valid');

  // normalizeTechnique
  assertEq(normalizeTechnique(null), null, 'normalize null → null');
  assertEq(normalizeTechnique('SUMMARY-TO-SCENE'), 'SUMMARY-TO-SCENE', 'normalize exact → exact');
  assertEq(
    normalizeTechnique('summary-to-scene'),
    'SUMMARY-TO-SCENE',
    'normalize lowercase → canonical',
  );
  assertEq(normalizeTechnique('unknown'), null, 'normalize unknown → null');
  assertEq(normalizeTechnique(''), null, 'normalize empty → null');
  assertEq(normalizeTechnique('  SUMMARY-TO-SCENE  '), 'SUMMARY-TO-SCENE', 'normalize trims whitespace');

  // Cross-file sync with coachingService via techniqueMatcher
  const matcherNames = getTechniqueRouteNames();
  assertEq(
    TECHNIQUE_VOCABULARY_LIST.length,
    matcherNames.length,
    'techniqueVocabulary length matches techniqueMatcher length',
  );

  // All names in one list must be in the other (set equality)
  const vocabSet = new Set(TECHNIQUE_VOCABULARY_LIST);
  const matcherSet = new Set(matcherNames);
  const allMatcherInVocab = matcherNames.every((n) => vocabSet.has(n));
  const allVocabInMatcher = [...TECHNIQUE_VOCABULARY_LIST].every((n) => matcherSet.has(n));
  assertTrue(
    allMatcherInVocab,
    'every techniqueMatcher name is in TECHNIQUE_VOCABULARY_LIST',
  );
  assertTrue(
    allVocabInMatcher,
    'every TECHNIQUE_VOCABULARY_LIST name is in techniqueMatcher',
  );
}

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Scope 2 Phase 4 tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All Scope 2 Phase 4 tests passed');
}
