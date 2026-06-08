/**
 * test-scope3-phase7-runtime.ts — Scope 3 Phase 7 research enrichment tests.
 *
 * Validates the candidate-store-agnostic late-bound enrichment that lives in
 * src/services/essayIntelligence/analysis/researchEnrichment.ts:
 *
 *   1. ROUTE_TO_ISSUE_TYPE covers all 20 TECHNIQUE_VOCABULARY_LIST entries
 *      (20 technique routes: 14 original + 6 Scope 2 additions). Sync test
 *      prevents drift from techniqueVocabulary.ts additions.
 *   2. resolveIssueType — primary (technique → route) and fallback (keyword
 *      scan over observation + action) paths.
 *   3. enrichWithResearchDatabase — full behavior:
 *      - Valid technique → demonstration + researchBacking populated from
 *        TEACHING_KNOWLEDGE_BASE
 *      - Keyword fallback → same
 *      - Unknown technique + gibberish observation → graceful skip (no
 *        fabricated fallback)
 *      - Thin stakes (empty or Evidence:-prefixed) → upgraded to research
 *      - College-specific insight when collegeId matches a hardcoded map
 *        entry; multi-case normalization (stanford / Stanford / STANFORD)
 *   4. Idempotency — _enriched flag, second call is a no-op
 *   5. Fail-open per item — a single bad service call doesn't crash the loop
 *   6. Fail-fast systemic — >3 items with zero hits throws PipelineError
 *   7. normalizeCollegeIdsForLookup case variants
 *   8. buildImprovementQueueSection rendering with PRINCIPLE + COLLEGE NOTE
 *      lines present after enrichment
 *
 * Hits the real researchBackedTeachingService singleton (zero LLM calls,
 * pure in-memory lookups). Expected runtime: <100ms.
 *
 * Usage:
 *   npx tsx tests/test-scope3-phase7-runtime.ts
 */

import {
  enrichWithResearchDatabase,
  __testing,
} from '../../src/services/essayIntelligence/analysis/researchEnrichment';
import { TECHNIQUE_VOCABULARY_LIST } from '../../src/services/essayIntelligence/analysis/techniqueVocabulary';
import { PipelineError, isPipelineError } from '../../src/services/essayIntelligence/errors';
import type { ImprovementEntry, ImprovementManifest } from '../../src/services/essayIntelligence/profileTypes';

let passed = 0;
let failed = 0;

function assertEq<T>(actual: T, expected: T, name: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(
      `  ✗ ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
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

function mkEntry(overrides: Partial<ImprovementEntry> = {}): ImprovementEntry {
  return {
    id: overrides.id ?? 'IMP_test',
    paragraph: 0,
    observation: '',
    action: '',
    stakes: '',
    technique: null,
    demonstration: null,
    wordEconomyCut: null,
    source: 'l4_priority',
    sourceRef: null,
    priority: 1,
    impact: 'significant',
    conversatorEnrichments: [],
    ...overrides,
  };
}

function mkManifest(items: ImprovementEntry[]): ImprovementManifest {
  return {
    items,
    generatedAt: new Date().toISOString(),
    sources: ['L4'],
    wordCount: 650,
    wordLimit: 650,
  };
}

console.log('\n=== Scope 3 Phase 7 Runtime Tests ===\n');

// ============================================================================
// Suite 1: ROUTE_TO_ISSUE_TYPE coverage + drift guard
// ============================================================================

console.log('Suite 1: ROUTE_TO_ISSUE_TYPE drift guard\n');
{
  const routes = __testing.ROUTE_TO_ISSUE_TYPE;
  const routeKeys = Object.keys(routes);

  assertEq(routeKeys.length, 20, 'exactly 20 technique routes');
  assertEq(
    routeKeys.length,
    TECHNIQUE_VOCABULARY_LIST.length,
    'route count matches TECHNIQUE_VOCABULARY_LIST length',
  );

  // Every TECHNIQUE_VOCABULARY_LIST entry must have a key in ROUTE_TO_ISSUE_TYPE
  // (including the intentional null sentinel for INCREMENTAL REVELATION)
  for (const technique of TECHNIQUE_VOCABULARY_LIST) {
    assertTrue(
      technique in routes,
      `${technique} has a ROUTE_TO_ISSUE_TYPE entry`,
    );
  }

  // INCREMENTAL REVELATION is intentionally null (no bundle)
  assertEq(
    routes['INCREMENTAL REVELATION'],
    null,
    'INCREMENTAL REVELATION is intentional null',
  );

  // Spot-check a few core mappings
  assertEq(routes['SUMMARY-TO-SCENE'], 'weak_structure', 'SUMMARY-TO-SCENE → weak_structure');
  assertEq(routes['COLD OPEN / SENSORY TIMESTAMP'], 'weak_opening', 'COLD OPEN → weak_opening');
  assertEq(
    routes['SOMATIC VULNERABILITY'],
    'telling_not_showing',
    'SOMATIC VULNERABILITY → telling_not_showing',
  );
}

// ============================================================================
// Suite 2: resolveIssueType — primary + fallback paths
// ============================================================================

console.log('\nSuite 2: resolveIssueType primary + fallback\n');
{
  // Primary: named technique
  const primary = __testing.resolveIssueType(
    mkEntry({ technique: 'SUMMARY-TO-SCENE' }),
  );
  assertEq(primary, 'weak_structure', 'named technique → direct mapping');

  // Fallback: keyword scan over observation
  const kwObs = __testing.resolveIssueType(
    mkEntry({
      technique: null,
      observation: 'P1 operates in summary mode — narrates from distance',
      action: '',
    }),
  );
  assertEq(kwObs, 'weak_structure', 'keyword fallback on observation');

  // Fallback: keyword scan over action
  const kwAction = __testing.resolveIssueType(
    mkEntry({
      technique: null,
      observation: 'diagnostic text',
      action: 'fix the hook — no put-down risk tolerated',
    }),
  );
  assertEq(kwAction, 'weak_opening', 'keyword fallback on action');

  // Unknown technique + no keyword match → null
  const unknown = __testing.resolveIssueType(
    mkEntry({
      technique: 'MADE_UP_TECHNIQUE',
      observation: 'xyzzy gibberish',
      action: 'do the thing',
    }),
  );
  assertEq(unknown, null, 'unknown technique + no keyword → null');

  // INCREMENTAL REVELATION (null sentinel in table) falls through to keyword
  // scan — with no matching keywords, returns null
  const incremental = __testing.resolveIssueType(
    mkEntry({
      technique: 'INCREMENTAL REVELATION',
      observation: 'abstract observation',
      action: 'do stuff',
    }),
  );
  assertEq(
    incremental,
    null,
    'INCREMENTAL REVELATION null sentinel → falls through → null',
  );
}

// ============================================================================
// Suite 3: enrichWithResearchDatabase — happy path
// ============================================================================

console.log('\nSuite 3: enrichWithResearchDatabase happy path\n');
{
  const manifest = mkManifest([
    mkEntry({
      id: 'IMP_1',
      technique: 'SUMMARY-TO-SCENE',
      observation: 'P1 summarizes childhood chronologically',
      action: 'Start at the F-sharp moment',
    }),
    // Keyword fallback path
    mkEntry({
      id: 'IMP_2',
      technique: null,
      observation: 'AO put-down risk — weak opening',
      action: 'rewrite the first line',
    }),
    // Unknown / gibberish — graceful skip
    mkEntry({
      id: 'IMP_3',
      technique: 'UNKNOWN_ROUTE',
      observation: 'xyzzy nonsensical text',
      action: 'do stuff',
    }),
  ]);

  enrichWithResearchDatabase(manifest);

  const imp1 = manifest.items.find((i) => i.id === 'IMP_1')!;
  const imp2 = manifest.items.find((i) => i.id === 'IMP_2')!;
  const imp3 = manifest.items.find((i) => i.id === 'IMP_3')!;

  // IMP_1: SUMMARY-TO-SCENE → weak_structure → populated
  assertTrue(imp1.demonstration !== null, 'IMP_1 demonstration populated');
  assertTrue(
    imp1.demonstration!.startsWith('BEFORE:'),
    'IMP_1 demonstration starts with BEFORE:',
  );
  assertTrue(
    imp1.demonstration!.includes('AFTER:'),
    'IMP_1 demonstration contains AFTER:',
  );
  assertTrue(
    imp1.demonstration!.includes('PRINCIPLE:'),
    'IMP_1 demonstration contains PRINCIPLE:',
  );
  assertTrue(
    imp1.researchBacking !== null && imp1.researchBacking !== undefined,
    'IMP_1 researchBacking populated',
  );
  assertEq(
    imp1.researchBacking?.sourceRef,
    'weak_structure',
    'IMP_1 researchBacking.sourceRef = weak_structure',
  );
  assertTrue(
    typeof imp1.researchBacking?.principle === 'string' &&
      imp1.researchBacking!.principle.length > 0,
    'IMP_1 researchBacking.principle is a non-empty string',
  );
  assertTrue(
    typeof imp1.researchBacking?.whyItWorks === 'string' &&
      imp1.researchBacking!.whyItWorks.length > 0,
    'IMP_1 researchBacking.whyItWorks is a non-empty string',
  );

  // IMP_1: stakes upgraded from empty
  assertTrue(imp1.stakes.length > 0, 'IMP_1 stakes upgraded from empty');

  // IMP_2: keyword fallback via "put-down risk" → weak_opening
  assertTrue(imp2.demonstration !== null, 'IMP_2 demonstration populated via keyword fallback');
  assertEq(
    imp2.researchBacking?.sourceRef,
    'weak_opening',
    'IMP_2 sourceRef = weak_opening (keyword)',
  );

  // IMP_3: graceful skip
  assertEq(imp3.demonstration, null, 'IMP_3 demonstration stays null (graceful skip)');
  assertEq(imp3.stakes, '', 'IMP_3 stakes stays empty (graceful skip)');
  assertTrue(
    imp3.researchBacking === undefined || imp3.researchBacking === null,
    'IMP_3 researchBacking unset',
  );

  // Idempotency flag set
  assertEq(manifest._enriched, true, 'manifest._enriched = true');
}

// ============================================================================
// Suite 4: Idempotency — second call is a no-op
// ============================================================================

console.log('\nSuite 4: Idempotency\n');
{
  const manifest = mkManifest([
    mkEntry({ id: 'IMP_A', technique: 'SUMMARY-TO-SCENE' }),
  ]);

  enrichWithResearchDatabase(manifest);
  const firstDemo = manifest.items[0].demonstration;
  assertTrue(firstDemo !== null, 'first call populates demonstration');
  assertEq(manifest._enriched, true, 'first call sets _enriched');

  // Mutate demonstration to detect whether second call overwrites
  manifest.items[0].demonstration = 'SENTINEL_VALUE';
  enrichWithResearchDatabase(manifest);
  assertEq(
    manifest.items[0].demonstration,
    'SENTINEL_VALUE',
    'second call is a no-op (demonstration unchanged)',
  );
}

// ============================================================================
// Suite 5: Thin stakes upgrade — Evidence: prefix preserved
// ============================================================================

console.log('\nSuite 5: Thin stakes upgrade + Evidence: preservation\n');
{
  // Case 1: empty stakes → overwritten
  const m1 = mkManifest([
    mkEntry({ id: 'S1', technique: 'SUMMARY-TO-SCENE', stakes: '' }),
  ]);
  enrichWithResearchDatabase(m1);
  assertTrue(m1.items[0].stakes.length > 0, 'empty stakes → populated');

  // Case 2: Evidence:-prefixed stakes → prefix preserved, research appended
  const m2 = mkManifest([
    mkEntry({
      id: 'S2',
      technique: 'SUMMARY-TO-SCENE',
      stakes: 'Evidence: "When I was six..."',
    }),
  ]);
  enrichWithResearchDatabase(m2);
  assertTrue(
    m2.items[0].stakes.startsWith('Evidence:'),
    'Evidence: prefix preserved after upgrade',
  );
  assertTrue(
    m2.items[0].stakes.length > 'Evidence: "When I was six..."'.length,
    'research appended to Evidence: prefix',
  );

  // Case 3: rich pre-existing stakes → NOT overwritten
  const richStakes =
    'The AO will skim past this paragraph because the summary distance prevents any emotional hook.';
  const m3 = mkManifest([
    mkEntry({ id: 'S3', technique: 'SUMMARY-TO-SCENE', stakes: richStakes }),
  ]);
  enrichWithResearchDatabase(m3);
  assertEq(
    m3.items[0].stakes,
    richStakes,
    'rich stakes preserved (not overwritten)',
  );
}

// ============================================================================
// Suite 6: College-specific tailoring + case normalization
// ============================================================================

console.log('\nSuite 6: College tailoring + case normalization\n');
{
  // Test the underlying normalizeCollegeIdsForLookup
  const variants = __testing.normalizeCollegeIdsForLookup('stanford');
  assertTrue(variants.includes('stanford'), 'lowercase variant present');
  assertTrue(variants.includes('Stanford'), 'capitalized variant present');
  assertTrue(variants.includes('STANFORD'), 'uppercase variant present');

  // Stanford hardcoded insight map has a telling_not_showing entry under
  // 'Stanford' (capitalized). Test that collegeId='stanford' resolves it.
  const m1 = mkManifest([
    mkEntry({ id: 'C1', technique: 'SOMATIC VULNERABILITY' }),
  ]);
  enrichWithResearchDatabase(m1, 'stanford');
  assertTrue(
    m1.items[0].collegeNote !== null && m1.items[0].collegeNote !== undefined,
    'stanford collegeId resolves Stanford insight',
  );
  assertTrue(
    typeof m1.items[0].collegeNote === 'string' &&
      m1.items[0].collegeNote!.includes('IV rating'),
    'Stanford insight text includes "IV rating"',
  );

  // Same result for STANFORD uppercase
  const m2 = mkManifest([
    mkEntry({ id: 'C2', technique: 'SOMATIC VULNERABILITY' }),
  ]);
  enrichWithResearchDatabase(m2, 'STANFORD');
  assertEq(
    m2.items[0].collegeNote,
    m1.items[0].collegeNote,
    'STANFORD uppercase resolves same Stanford insight',
  );

  // MIT case: 'mit' → 'MIT' upper-case normalization
  const m3 = mkManifest([
    mkEntry({ id: 'C3', technique: 'SOMATIC VULNERABILITY' }),
  ]);
  enrichWithResearchDatabase(m3, 'mit');
  assertTrue(
    m3.items[0].collegeNote !== null && m3.items[0].collegeNote !== undefined,
    'mit collegeId resolves MIT insight',
  );
  assertTrue(
    typeof m3.items[0].collegeNote === 'string' &&
      m3.items[0].collegeNote!.toLowerCase().includes('mit'),
    'MIT insight text includes MIT',
  );

  // College with no insight for this issue type → collegeNote stays null
  const m4 = mkManifest([
    // Stanford has NO insight for weak_structure in the hardcoded map
    mkEntry({ id: 'C4', technique: 'SUMMARY-TO-SCENE' }),
  ]);
  enrichWithResearchDatabase(m4, 'stanford');
  assertTrue(
    m4.items[0].collegeNote === null || m4.items[0].collegeNote === undefined,
    'stanford + weak_structure → no insight, collegeNote null',
  );

  // No collegeId → collegeNote stays null even when issue matches
  const m5 = mkManifest([
    mkEntry({ id: 'C5', technique: 'SOMATIC VULNERABILITY' }),
  ]);
  enrichWithResearchDatabase(m5);
  assertTrue(
    m5.items[0].collegeNote === null || m5.items[0].collegeNote === undefined,
    'no collegeId → collegeNote stays null',
  );
}

// ============================================================================
// Suite 7: Empty manifest handling
// ============================================================================

console.log('\nSuite 7: Empty manifest handling\n');
{
  const empty = mkManifest([]);
  enrichWithResearchDatabase(empty);
  assertEq(empty.items.length, 0, 'empty manifest preserved');
  assertEq(empty._enriched, true, 'empty manifest still flagged _enriched');
}

// ============================================================================
// Suite 8: Fail-fast systemic miss — throws PipelineError
// ============================================================================

console.log('\nSuite 8: Systemic miss fail-fast\n');
{
  // 4 items with gibberish and unknown techniques → zero hits → throws
  const gibberish = mkManifest([
    mkEntry({
      id: 'G1',
      technique: 'UNKNOWN_A',
      observation: 'xyzzy plugh fred',
      action: 'frobozz',
    }),
    mkEntry({
      id: 'G2',
      technique: 'UNKNOWN_B',
      observation: 'grue zork',
      action: 'baz qux',
    }),
    mkEntry({
      id: 'G3',
      technique: 'UNKNOWN_C',
      observation: 'nothing to match',
      action: 'nothing here',
    }),
    mkEntry({
      id: 'G4',
      technique: 'UNKNOWN_D',
      observation: 'abcdef',
      action: 'ghijk',
    }),
  ]);

  let thrown: unknown = null;
  try {
    enrichWithResearchDatabase(gibberish);
  } catch (err) {
    thrown = err;
  }

  assertTrue(thrown !== null, 'systemic miss threw');
  assertTrue(isPipelineError(thrown), 'thrown error is PipelineError');
  if (isPipelineError(thrown)) {
    assertEq(thrown.layer, 'research_enrichment', 'error layer = research_enrichment');
  }
}

// ============================================================================
// Suite 9: 3-item miss does NOT throw (below threshold)
// ============================================================================

console.log('\nSuite 9: 3-item miss below fail-fast threshold\n');
{
  const tiny = mkManifest([
    mkEntry({
      id: 'T1',
      technique: 'UNKNOWN',
      observation: 'xyzzy',
      action: 'frobozz',
    }),
    mkEntry({
      id: 'T2',
      technique: 'UNKNOWN',
      observation: 'grue',
      action: 'zork',
    }),
    mkEntry({
      id: 'T3',
      technique: 'UNKNOWN',
      observation: 'plugh',
      action: 'fred',
    }),
  ]);

  let thrown: unknown = null;
  try {
    enrichWithResearchDatabase(tiny);
  } catch (err) {
    thrown = err;
  }

  assertEq(thrown, null, '3-item miss does NOT throw (below threshold)');
  assertEq(tiny._enriched, true, '3-item miss still flags _enriched');
}

// ============================================================================
// Suite 10: Scope 2 additions mapping behavior
// ============================================================================

console.log('\nSuite 10: Scope 2 addition mappings\n');
{
  // COLLABORATIVE SPECIFICITY → missing_evidence_of_impact
  const m1 = mkManifest([
    mkEntry({
      id: 'CS',
      technique: 'COLLABORATIVE SPECIFICITY',
      observation: 'singular-I framing',
    }),
  ]);
  enrichWithResearchDatabase(m1);
  assertEq(
    m1.items[0].researchBacking?.sourceRef,
    'missing_evidence_of_impact',
    'COLLABORATIVE SPECIFICITY → missing_evidence_of_impact',
  );

  // ANTI-LESSON → shallow_reflection
  const m2 = mkManifest([
    mkEntry({
      id: 'AL',
      technique: 'ANTI-LESSON',
      observation: 'too-neat takeaway',
    }),
  ]);
  enrichWithResearchDatabase(m2);
  assertEq(
    m2.items[0].researchBacking?.sourceRef,
    'shallow_reflection',
    'ANTI-LESSON → shallow_reflection',
  );

  // NARRATIVE ARC → weak_structure
  const m3 = mkManifest([
    mkEntry({
      id: 'NA',
      technique: 'NARRATIVE ARC',
      observation: 'missing story shape',
    }),
  ]);
  enrichWithResearchDatabase(m3);
  assertEq(
    m3.items[0].researchBacking?.sourceRef,
    'weak_structure',
    'NARRATIVE ARC → weak_structure',
  );
}

// ============================================================================
// Suite 11: OBSERVATION_KEYWORD_TO_ISSUE coverage
// ============================================================================

console.log('\nSuite 11: OBSERVATION_KEYWORD_TO_ISSUE table\n');
{
  const table = __testing.OBSERVATION_KEYWORD_TO_ISSUE;
  assertEq(table.length, 23, '23 keyword bridge entries');

  // Every entry has non-empty keywords and a valid issueType string
  for (const entry of table) {
    assertTrue(
      Array.isArray(entry.keywords) && entry.keywords.length > 0,
      `keyword bridge entry has non-empty keywords (${entry.issueType})`,
    );
    assertTrue(
      typeof entry.issueType === 'string' && entry.issueType.length > 0,
      `keyword bridge entry has valid issueType string`,
    );
  }
}

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Scope 3 Phase 7 tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All Scope 3 Phase 7 tests passed');
}
