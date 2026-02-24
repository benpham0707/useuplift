/**
 * Test: Version Comparison Service
 *
 * Validates that version comparison produces correct score deltas,
 * identifies improvements/regressions, and finds the most impactful edit.
 *
 * This test does NOT require an API key or database connection.
 * Purely computational — runs in < 1 second.
 */

import { VersionComparisonService } from '../src/services/analytics/versionComparisonService';
import type { VersionScores, VersionEdit } from '../src/services/analytics/versionComparisonService';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let passed = 0;
let failed = 0;
const results: { name: string; passed: boolean; detail?: string }[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    results.push({ name, passed: false, detail });
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function assertClose(name: string, actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  assert(name, diff <= tolerance, `expected ${expected}, got ${actual} (diff ${diff})`);
}

// ============================================================================
// TEST DATA
// ============================================================================

const oldVersion: VersionScores = {
  textHash: 'hash-v1',
  dimensionScores: {
    voice_integrity: 5.0,
    specificity_evidence: 3.5,
    transformative_impact: 4.0,
    narrative_arc_stakes: 2.0,
    reflection_meaning: 6.0,
  },
  overallScore: 41,
  analyzedAt: '2026-02-20T10:00:00Z',
};

const newVersion: VersionScores = {
  textHash: 'hash-v2',
  dimensionScores: {
    voice_integrity: 7.0,
    specificity_evidence: 5.5,
    transformative_impact: 4.0,
    narrative_arc_stakes: 6.0,
    reflection_meaning: 5.5,
  },
  overallScore: 56,
  analyzedAt: '2026-02-20T11:00:00Z',
};

const testEdits: VersionEdit[] = [
  {
    command: 'make_concrete',
    originalText: 'I did many things in my club.',
    replacementText: 'I organized 12 weekly coding workshops that served 45 students.',
    timestamp: '2026-02-20T10:15:00Z',
  },
  {
    command: 'add_stakes',
    originalText: 'It was challenging.',
    replacementText: 'Without funding, our robotics team faced disbandment—and with it, three years of work building the program from scratch.',
    timestamp: '2026-02-20T10:30:00Z',
  },
  {
    command: 'cut_filler',
    originalText: 'I basically just really wanted to help.',
    replacementText: 'I wanted to help.',
    timestamp: '2026-02-20T10:45:00Z',
  },
];

// ============================================================================
// TESTS
// ============================================================================

function runTests() {
  console.log('\n🧪 Version Comparison Service Tests\n');
  console.log('='.repeat(60));

  const service = new VersionComparisonService();

  // ------------------------------------------------------------------
  // 1. Basic comparison with improvements
  // ------------------------------------------------------------------
  console.log('\n📊 1. Basic comparison with improvements');
  const comparison = service.compareVersions(oldVersion, newVersion, testEdits);

  assertClose('voice_integrity delta is +2.0', comparison.scoreDelta.voice_integrity, 2.0);
  assertClose('specificity_evidence delta is +2.0', comparison.scoreDelta.specificity_evidence, 2.0);
  assertClose('transformative_impact delta is 0.0', comparison.scoreDelta.transformative_impact, 0.0);
  assertClose('narrative_arc_stakes delta is +4.0', comparison.scoreDelta.narrative_arc_stakes, 4.0);
  assertClose('reflection_meaning delta is -0.5', comparison.scoreDelta.reflection_meaning, -0.5);

  // ------------------------------------------------------------------
  // 2. Overall delta
  // ------------------------------------------------------------------
  console.log('\n📊 2. Overall delta');
  assertClose('overall delta is 15', comparison.overallDelta, 15);

  // ------------------------------------------------------------------
  // 3. Improvements detected
  // ------------------------------------------------------------------
  console.log('\n📊 3. Improvements detected');
  assert('identifies improved dimensions', comparison.improvements.length === 3,
    `expected 3 improvements, got ${comparison.improvements.length}: ${JSON.stringify(comparison.improvements)}`);
  assert('voice_integrity is listed as improved', comparison.improvements.some(i => i.includes('voice_integrity')));
  assert('specificity_evidence is listed as improved', comparison.improvements.some(i => i.includes('specificity_evidence')));
  assert('narrative_arc_stakes is listed as improved', comparison.improvements.some(i => i.includes('narrative_arc_stakes')));

  // ------------------------------------------------------------------
  // 4. Regressions detected
  // ------------------------------------------------------------------
  console.log('\n📊 4. Regressions detected');
  assert('identifies regressed dimensions', comparison.regressions.length === 1,
    `expected 1 regression, got ${comparison.regressions.length}`);
  assert('reflection_meaning is listed as regressed', comparison.regressions.some(r => r.includes('reflection_meaning')));

  // ------------------------------------------------------------------
  // 5. Unchanged dimensions
  // ------------------------------------------------------------------
  console.log('\n📊 5. Unchanged dimensions');
  assert('identifies unchanged dimensions', comparison.unchanged.includes('transformative_impact'));

  // ------------------------------------------------------------------
  // 6. Most impactful edit
  // ------------------------------------------------------------------
  console.log('\n📊 6. Most impactful edit identification');
  assert('most impactful edit is identified', comparison.mostImpactfulEdit.length > 0);
  assert('most impactful edit references add_stakes (biggest text change)',
    comparison.mostImpactfulEdit.includes('add_stakes'));

  // ------------------------------------------------------------------
  // 7. Edit count
  // ------------------------------------------------------------------
  console.log('\n📊 7. Edit count');
  assert('edit count is correct', comparison.editCount === 3);

  // ------------------------------------------------------------------
  // 8. Comparison without edits (fallback to dimension-based)
  // ------------------------------------------------------------------
  console.log('\n📊 8. Comparison without edits');
  const noEditsComparison = service.compareVersions(oldVersion, newVersion);
  assert('works without edits', noEditsComparison.editCount === 0);
  assert('fallback identifies biggest improvement dimension', noEditsComparison.mostImpactfulEdit.includes('narrative_arc_stakes'));

  // ------------------------------------------------------------------
  // 9. No-change comparison
  // ------------------------------------------------------------------
  console.log('\n📊 9. No-change comparison');
  const sameComparison = service.compareVersions(oldVersion, oldVersion);
  assertClose('no-change has 0 overall delta', sameComparison.overallDelta, 0);
  assert('no-change has no improvements', sameComparison.improvements.length === 0);
  assert('no-change has no regressions', sameComparison.regressions.length === 0);
  assert('no-change has all dimensions unchanged', sameComparison.unchanged.length === 5);

  // ------------------------------------------------------------------
  // 10. Summarize
  // ------------------------------------------------------------------
  console.log('\n📊 10. Summary generation');
  const summary = service.summarize(comparison);
  assert('summary is non-empty', summary.length > 0);
  assert('summary contains overall delta', summary.includes('+15'));
  assert('summary contains improvement count', summary.includes('3 dimension'));

  // ------------------------------------------------------------------
  // 11. Edge case: new dimension in newer version
  // ------------------------------------------------------------------
  console.log('\n📊 11. Edge case: new dimension added');
  const newWithExtra: VersionScores = {
    ...newVersion,
    dimensionScores: {
      ...newVersion.dimensionScores,
      craft_language_quality: 8.0,
    },
  };
  const extraComparison = service.compareVersions(oldVersion, newWithExtra);
  assert('handles new dimension (0 → 8)', extraComparison.scoreDelta.craft_language_quality === 8.0);
  assert('new dimension appears as improvement', extraComparison.improvements.some(i => i.includes('craft_language_quality')));

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log(`\n📋 Results: ${passed}/${passed + failed} passed`);
  if (failed > 0) {
    console.log(`\n❌ ${failed} test(s) failed:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}${r.detail ? `: ${r.detail}` : ''}`);
    });
  } else {
    console.log('\n✅ All tests passed!');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
