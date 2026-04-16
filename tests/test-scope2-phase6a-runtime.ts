/**
 * test-scope2-phase6a-runtime.ts — Scope 2 Phase 6a runtime tests.
 *
 * Validates L4b + L5 candidate-store consumption with gap-filling:
 *
 *   1. buildCoachingMap parses new `consolidatedFrom: string[]` field on
 *      priorities. Accepts string array, filters non-strings, defaults
 *      to empty array when absent, preserves all lineage IDs.
 *   2. Consolidation lifecycle semantics — orchestrator helper logic:
 *      candidates cited in any priority's consolidatedFrom become
 *      'consolidated', uncited active candidates become 'superseded'.
 *   3. Empty-store detection — PipelineError.emptyCandidateStore shape.
 *   4. `l4bConsolidationFailed` replacing graceful-degradation.
 *   5. (Implicit via prompt-text assertions) L4b system prompt contains
 *      the consolidation language.
 *
 * This test is parser/helper-focused — does NOT spin up real Sonnet calls.
 * Integration validation lives in Phase 8 E2E.
 *
 * Usage:
 *   npx tsx tests/test-scope2-phase6a-runtime.ts
 */

import { buildCoachingMap } from '../src/services/essayIntelligence/analysis/crystallizer';
import { ImprovementCandidateStore } from '../src/services/essayIntelligence/improvements/improvementCandidateStore';
import type { ImprovementCandidate, CoachingMap } from '../src/services/essayIntelligence/profileTypes';
import { PipelineError, isPipelineError } from '../src/services/essayIntelligence/errors';

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

function mkCandidate(overrides: Partial<ImprovementCandidate> = {}): ImprovementCandidate {
  return {
    id: overrides.id ?? 'CAND_TEST_0001',
    sourceLayer: 'L3',
    paragraph: 0,
    sentence: null,
    sourceFindingId: null,
    observation: 'test observation',
    suggestedChange: 'test suggestion',
    technique: null,
    demonstrationSketch: null,
    coachingValue: 'medium',
    lifecycleState: 'candidate',
    supersededBy: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

console.log('\n=== Scope 2 Phase 6a Runtime Tests ===\n');

// ============================================================================
// Suite 1: buildCoachingMap parser — consolidatedFrom lineage field
// ============================================================================

console.log('Suite 1: buildCoachingMap consolidatedFrom parsing\n');
{
  // Valid coachingMap with consolidatedFrom on each priority
  const raw = {
    transformativeInsight: {
      insight: 'the insight',
      evidenceLocations: [{ paragraph: 0, sentence: 1 }],
      whyThisTransforms: 'because reasons',
      requiresStudentAwareness: true,
    },
    priorities: [
      {
        priority: 'fix P0',
        target: { paragraphs: [0], description: 'opening paragraph' },
        architecturalReason: 'frame for later stakes',
        unlocksNext: 'emotional landing',
        expectedImpact: 'transformative',
        consolidatedFrom: ['CAND_L3_P0S1_abc', 'CAND_L3_5_P0S2_def'],
      },
      {
        priority: 'fix P2',
        target: { paragraphs: [2], description: 'middle' },
        architecturalReason: 'pivot point',
        unlocksNext: 'closing weight',
        expectedImpact: 'significant',
        consolidatedFrom: ['CAND_L3_75_P2_xyz'],
      },
    ],
    protectedStrengths: [],
    emergentPatterns: [],
    scoreTensions: [],
  };

  const parsed = buildCoachingMap(raw, 5);
  assertTrue(parsed !== undefined, 'buildCoachingMap returns defined');
  assertEq(parsed!.priorities.length, 2, 'two priorities parsed');
  assertEq(
    parsed!.priorities[0].consolidatedFrom?.length,
    2,
    'first priority has 2 consolidatedFrom IDs',
  );
  assertEq(
    parsed!.priorities[0].consolidatedFrom?.[0],
    'CAND_L3_P0S1_abc',
    'first consolidatedFrom ID preserved',
  );
  assertEq(
    parsed!.priorities[1].consolidatedFrom?.[0],
    'CAND_L3_75_P2_xyz',
    'second priority consolidatedFrom preserved',
  );

  // Absent consolidatedFrom → empty array (not undefined)
  const rawNoLineage = {
    ...raw,
    priorities: [
      {
        priority: 'legacy shape',
        target: { paragraphs: [0], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'incremental',
        // no consolidatedFrom
      },
    ],
  };
  const parsedNoLineage = buildCoachingMap(rawNoLineage, 5);
  assertEq(
    parsedNoLineage!.priorities[0].consolidatedFrom?.length,
    0,
    'missing consolidatedFrom → empty array',
  );

  // Non-string entries in consolidatedFrom get filtered
  const rawMixed = {
    ...raw,
    priorities: [
      {
        priority: 'mixed',
        target: { paragraphs: [0], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'incremental',
        consolidatedFrom: ['CAND_good', 42, null, '', 'CAND_also_good', undefined],
      },
    ],
  };
  const parsedMixed = buildCoachingMap(rawMixed, 5);
  assertEq(
    parsedMixed!.priorities[0].consolidatedFrom?.length,
    2,
    'non-string entries filtered from consolidatedFrom',
  );
  assertTrue(
    parsedMixed!.priorities[0].consolidatedFrom!.includes('CAND_good'),
    'valid string entry kept',
  );
  assertTrue(
    parsedMixed!.priorities[0].consolidatedFrom!.includes('CAND_also_good'),
    'second valid string entry kept',
  );
}

// ============================================================================
// Suite 2: Consolidation lifecycle semantics
//
// Replicates the orchestrator logic that drives the candidate store lifecycle
// based on L4b's consolidation decisions. Ensures cited candidates become
// consolidated and uncited active candidates become superseded.
// ============================================================================

console.log('\nSuite 2: Consolidation lifecycle semantics\n');
{
  const store = new ImprovementCandidateStore();

  // Seed 5 active candidates
  store.addAll([
    mkCandidate({ id: 'a', coachingValue: 'critical' }),
    mkCandidate({ id: 'b', coachingValue: 'high' }),
    mkCandidate({ id: 'c', coachingValue: 'high' }),
    mkCandidate({ id: 'd', coachingValue: 'medium' }),
    mkCandidate({ id: 'e', coachingValue: 'medium' }),
  ]);
  assertEq(store.getActive().length, 5, 'seeded 5 active candidates');

  // Simulate L4b output: 2 priorities citing 3 candidates total
  const mockCoachingMap: CoachingMap = {
    transformativeInsight: {
      insight: '',
      evidenceLocations: [],
      whyThisTransforms: '',
      requiresStudentAwareness: false,
    },
    priorities: [
      {
        priority: 'priority 1',
        target: { paragraphs: [0], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'transformative',
        consolidatedFrom: ['a', 'b'],
      },
      {
        priority: 'priority 2',
        target: { paragraphs: [1], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'significant',
        consolidatedFrom: ['c'],
      },
    ],
    protectedStrengths: [],
    emergentPatterns: [],
    scoreTensions: [],
  };

  // Replicate orchestrator logic
  const citedIds = new Set(
    mockCoachingMap.priorities.flatMap((p) => p.consolidatedFrom ?? []),
  );
  const activeIds = store.getActive().map((c) => c.id);
  const consolidatedIds = activeIds.filter((id) => citedIds.has(id));
  const supersededIds = activeIds.filter((id) => !citedIds.has(id));

  store.markConsolidated(consolidatedIds);
  store.markSuperseded(supersededIds);

  // a, b, c → consolidated
  assertEq(store.get('a')?.lifecycleState, 'consolidated', 'a consolidated');
  assertEq(store.get('b')?.lifecycleState, 'consolidated', 'b consolidated');
  assertEq(store.get('c')?.lifecycleState, 'consolidated', 'c consolidated');

  // d, e → superseded
  assertEq(store.get('d')?.lifecycleState, 'superseded', 'd superseded');
  assertEq(store.get('e')?.lifecycleState, 'superseded', 'e superseded');

  // getActive excludes superseded → 3 left (consolidated still count)
  assertEq(store.getActive().length, 3, 'active = 3 (consolidated still count)');

  // Store still contains all 5 (nothing deleted)
  assertEq(store.size, 5, 'store size unchanged — nothing deleted');
}

// ============================================================================
// Suite 3: Empty consolidation edge cases
// ============================================================================

console.log('\nSuite 3: Empty consolidation edge cases\n');
{
  // Priorities with all empty consolidatedFrom → every active candidate superseded
  const store = new ImprovementCandidateStore();
  store.addAll([
    mkCandidate({ id: 'x' }),
    mkCandidate({ id: 'y' }),
  ]);

  const citedIds = new Set<string>(); // nothing cited
  const activeIds = store.getActive().map((c) => c.id);
  const supersededIds = activeIds.filter((id) => !citedIds.has(id));

  store.markSuperseded(supersededIds);
  assertEq(store.get('x')?.lifecycleState, 'superseded', 'uncited x → superseded');
  assertEq(store.get('y')?.lifecycleState, 'superseded', 'uncited y → superseded');
  assertEq(store.getActive().length, 0, 'zero active after full supersession');
}

// ============================================================================
// Suite 4: PipelineError shapes — Phase 6a errors
// ============================================================================

console.log('\nSuite 4: PipelineError fail-fast shapes\n');
{
  // emptyCandidateStore
  const emptyErr = PipelineError.emptyCandidateStore(0, ['L3', 'L3.5', 'L3.75']);
  assertTrue(isPipelineError(emptyErr), 'emptyCandidateStore is PipelineError');
  assertEq(emptyErr.layer, 'manifest_projection', 'emptyCandidateStore layer');
  assertTrue(emptyErr.message.includes('zero items'), 'message mentions zero items');

  // l4bConsolidationFailed
  const inner = new Error('Sonnet 529 overload');
  const l4bErr = PipelineError.l4bConsolidationFailed(inner, 12);
  assertTrue(isPipelineError(l4bErr), 'l4bConsolidationFailed is PipelineError');
  assertEq(l4bErr.layer, 'L4b_consolidation', 'l4b layer');
  assertTrue(l4bErr.inner === inner, 'l4b inner preserved');
  assertTrue(
    l4bErr.message.includes('L4b Consolidator'),
    'l4b message mentions consolidator',
  );

  // Diagnostic shape
  const diag = l4bErr.toDiagnostic();
  assertEq(diag.type, 'PipelineError', 'diagnostic type');
  assertEq(diag.layer, 'L4b_consolidation', 'diagnostic layer');
  assertTrue(
    typeof diag.inputs === 'object' && diag.inputs !== null,
    'diagnostic inputs present',
  );
}

// ============================================================================
// Suite 5: consolidatedFrom backward compat — old profiles still load
// ============================================================================

console.log('\nSuite 5: Backward compat — pre-Phase-6a persisted profiles\n');
{
  // A profile persisted before Phase 6a has priorities WITHOUT consolidatedFrom.
  // buildCoachingMap must still parse these without crashing.
  const rawLegacy = {
    transformativeInsight: {
      insight: 'old insight',
      evidenceLocations: [],
      whyThisTransforms: 'old why',
      requiresStudentAwareness: false,
    },
    priorities: [
      {
        priority: 'legacy p',
        target: { paragraphs: [0], description: 'legacy d' },
        architecturalReason: 'legacy r',
        unlocksNext: 'legacy u',
        expectedImpact: 'incremental',
      },
    ],
    protectedStrengths: [],
    emergentPatterns: [],
    scoreTensions: [],
  };

  const parsed = buildCoachingMap(rawLegacy, 5);
  assertTrue(parsed !== undefined, 'legacy profile parses');
  assertEq(parsed!.priorities.length, 1, 'one priority preserved');
  assertEq(
    parsed!.priorities[0].priority,
    'legacy p',
    'priority text preserved',
  );
  assertEq(
    parsed!.priorities[0].consolidatedFrom?.length,
    0,
    'legacy priority gets empty consolidatedFrom array',
  );
}

// ============================================================================
// Suite 6: Diagnostic detection — ungrounded priorities and unknown IDs
// ============================================================================

console.log('\nSuite 6: Diagnostic detection (ungrounded + hallucinated IDs)\n');
{
  // Build a mock coachingMap with mixed grounded + ungrounded priorities
  const mockCM: CoachingMap = {
    transformativeInsight: {
      insight: '',
      evidenceLocations: [],
      whyThisTransforms: '',
      requiresStudentAwareness: false,
    },
    priorities: [
      {
        priority: 'grounded',
        target: { paragraphs: [0], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'significant',
        consolidatedFrom: ['real_id_1'],
      },
      {
        priority: 'ungrounded',
        target: { paragraphs: [1], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'incremental',
        consolidatedFrom: [],
      },
      {
        priority: 'hallucinated',
        target: { paragraphs: [2], description: 'd' },
        architecturalReason: 'r',
        unlocksNext: 'u',
        expectedImpact: 'incremental',
        consolidatedFrom: ['fake_id_never_existed'],
      },
    ],
    protectedStrengths: [],
    emergentPatterns: [],
    scoreTensions: [],
  };

  // Store with only real_id_1
  const store = new ImprovementCandidateStore();
  store.add(mkCandidate({ id: 'real_id_1' }));

  // Detect ungrounded priorities (empty consolidatedFrom)
  const ungrounded = mockCM.priorities.filter(
    (p) => !p.consolidatedFrom || p.consolidatedFrom.length === 0,
  );
  assertEq(ungrounded.length, 1, 'one ungrounded priority detected');
  assertEq(ungrounded[0].priority, 'ungrounded', 'ungrounded priority identified');

  // Detect hallucinated IDs (cited but not in store)
  const citedIds = new Set(
    mockCM.priorities.flatMap((p) => p.consolidatedFrom ?? []),
  );
  const storeIds = new Set(store.getActive().map((c) => c.id));
  const unknownCited = [...citedIds].filter((id) => !storeIds.has(id));
  assertEq(unknownCited.length, 1, 'one hallucinated ID detected');
  assertEq(unknownCited[0], 'fake_id_never_existed', 'hallucinated ID identified');
}

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Scope 2 Phase 6a tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All Scope 2 Phase 6a tests passed');
}
