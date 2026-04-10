/**
 * test-scope1-phase3-runtime.ts — Runtime tests for the L5 enrichment bundle.
 *
 * Validates:
 *   1. matchAnnotationToTechnique() — multi-signal matcher returns null
 *      when only 1 signal matches (single-keyword rejection), and returns
 *      the right technique when 2+ signals match.
 *   2. getTechniqueRouteNames() — returns exactly 20 technique names
 *      matching the TECHNIQUE_ROUTES source of truth.
 *   3. buildPreCallEnrichment() — produces REWRITE SCAFFOLDS when telling
 *      phrases match, WORD ECONOMY SIGNALS in polish/distinction phases,
 *      empty block when no matches.
 *
 * These tests exercise Phase 3 behavior without needing the full L5
 * pipeline to run (no Claude API calls).
 *
 * Usage:
 *   npx tsx tests/test-scope1-phase3-runtime.ts
 */

import {
  matchAnnotationToTechnique,
  getTechniqueRouteNames,
} from '../src/services/essayIntelligence/coaching/techniqueMatcher';
import { buildPreCallEnrichment } from '../src/services/essayIntelligence/analysis/preCallEnrichment';
import type { ParagraphProfile } from '../src/services/essayIntelligence/profileTypes';

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

console.log('\n=== Phase 3 Runtime Tests ===\n');

// ============================================================================
// Suite 1: matchAnnotationToTechnique() multi-signal matcher
// ============================================================================

console.log('Suite 1: matchAnnotationToTechnique()\n');

// Signal 1 only (single keyword, non-aligned mode) → REJECT
console.log('Single-signal rejection (false-positive control):');
assertEq(
  matchAnnotationToTechnique(
    'The opening sentence contains a single keyword match only.',
    null,
    null,        // no dimensions — Signal 2 unavailable
    'awareness', // wrong for COLD OPEN (which is action-mode technique) → Signal 3 fails
  ),
  null,
  'single-keyword "opening" + wrong mode (awareness vs action for COLD OPEN) → null',
);

// Single-signal: keyword without mode alignment
assertEq(
  matchAnnotationToTechnique(
    'This summary mode is a problem.',
    null,
    null,
    'action', // wrong for SUMMARY-TO-SCENE? No — SUMMARY-TO-SCENE IS action-mode
  ),
  'SUMMARY-TO-SCENE',
  'summary keyword + action mode = SUMMARY-TO-SCENE (2 signals)',
);

// Only keyword signal, wrong mode for non-ACTION technique (retreat expects non-action)
assertEq(
  matchAnnotationToTechnique(
    'The writer retreats from the moment.',
    null,
    null,
    'action', // wrong — SUSTAINED VULNERABILITY is non-ACTION
  ),
  null,
  'retreat keyword + wrong mode (action instead of non-action) → null (only 1 signal)',
);

// Empty input → no match
console.log('\nEmpty / nonsense inputs:');
assertEq(
  matchAnnotationToTechnique('', null, null, null),
  null,
  'empty content → null',
);
assertEq(
  matchAnnotationToTechnique('totally unrelated content', null, null, null),
  null,
  'unrelated content → null',
);

// Multi-signal matches
console.log('\nMulti-signal matches:');
assertEq(
  matchAnnotationToTechnique(
    'The emotion is stated rather than embodied.',
    null,
    ['emotion'],
    'action',
  ),
  'SOMATIC VULNERABILITY',
  'emotion keyword + emotion dimension + (either mode — non-strict for scoring) = SOMATIC VULNERABILITY',
);
assertEq(
  matchAnnotationToTechnique(
    'The transition feels abrupt.',
    'Watch for similar transition problems in your next essay.',
    ['structure'],
    'action',
  ),
  'BRIDGE SENTENCE',
  'transition + structure dim + action mode = BRIDGE SENTENCE (3 signals)',
);

// capacityBuildingNote folded into keyword search
console.log('\ncapacityBuildingNote folded into keyword search:');
assertEq(
  matchAnnotationToTechnique(
    'No direct content.',
    'This is a summary-mode problem.',
    null,
    'action',
  ),
  'SUMMARY-TO-SCENE',
  'keyword in capacityBuildingNote + action mode = SUMMARY-TO-SCENE',
);

// ============================================================================
// Suite 2: getTechniqueRouteNames()
// ============================================================================

console.log('\n\nSuite 2: getTechniqueRouteNames()\n');

{
  const names = getTechniqueRouteNames();
  assertEq(names.length, 20, `Returns 20 technique names (got ${names.length})`);
  assertTrue(names.includes('SUMMARY-TO-SCENE'), 'Includes SUMMARY-TO-SCENE');
  assertTrue(names.includes('COLD OPEN / SENSORY TIMESTAMP'), 'Includes COLD OPEN / SENSORY TIMESTAMP');
  assertTrue(names.includes('INCREMENTAL REVELATION'), 'Includes INCREMENTAL REVELATION');
  // All 20 must be unique
  const unique = new Set(names);
  assertEq(unique.size, 20, 'All 20 names are unique');
}

// ============================================================================
// Suite 3: buildPreCallEnrichment()
// ============================================================================

console.log('\n\nSuite 3: buildPreCallEnrichment()\n');

function makeStubParagraph(sentences: string[]): ParagraphProfile {
  return {
    index: 0,
    text: sentences.join(' '),
    sentences: sentences.map((text, i) => ({
      index: i,
      text,
      understanding: {
        observedFunctions: [],
        inferredIntents: [],
        narrativeContributions: [],
        rhetoricalFunctions: [],
        paragraphContribution: '',
        craft: { rhythm: '', techniques: [] },
        significantChoices: [],
        connectionRefs: [],
        findingRefs: [],
        tags: [],
      },
      analysis: {
        effectiveness: 50,
        effectivenessReasoning: '',
        strengths: [],
        weaknesses: [],
        isStrength: false,
        isProblem: false,
        priorityForImprovement: 3,
      },
    })),
  } as unknown as ParagraphProfile;
}

// Clean paragraph with no triggers
console.log('Clean paragraph (no triggers):');
{
  const para = makeStubParagraph([
    'She placed the ring on the counter.',
    'The clerk counted the money without speaking.',
  ]);
  const result = await buildPreCallEnrichment(para, 'architecture');
  assertEq(result.hasScaffolds, false, 'No triggers → hasScaffolds false');
  assertEq(result.promptBlock, '', 'No triggers → empty promptBlock');
  assertEq(result.detectedPhrases.length, 0, 'No detected phrases');
}

// Word economy diagnostics only fire in polish/distinction
console.log('\nWord economy diagnostics — phase gating:');
{
  const paraLong = makeStubParagraph([
    'In order to understand why this mattered, I had to think about it for a very long time as I walked home from the bus stop after school that afternoon in October.',
  ]);
  const architectureResult = await buildPreCallEnrichment(paraLong, 'architecture');
  assertEq(
    architectureResult.hasScaffolds,
    false,
    'Long sentence + filler in architecture phase → no word-economy block',
  );

  const polishResult = await buildPreCallEnrichment(paraLong, 'polish');
  assertTrue(
    polishResult.hasScaffolds,
    'Long sentence + filler in polish phase → has word-economy block',
  );
  assertTrue(
    polishResult.promptBlock.includes('WORD ECONOMY SIGNALS'),
    'polish phase block contains WORD ECONOMY SIGNALS header',
  );
  assertTrue(
    polishResult.promptBlock.includes('in order to'),
    'polish block surfaces the detected filler phrase',
  );

  const distinctionResult = await buildPreCallEnrichment(paraLong, 'distinction');
  assertTrue(
    distinctionResult.hasScaffolds,
    'Long sentence + filler in distinction phase → has word-economy block',
  );
}

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Phase 3 runtime tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All Phase 3 runtime tests passed');
}
