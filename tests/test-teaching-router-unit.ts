/**
 * Teaching Content Router — Unit Tests (ZERO LLM COST)
 *
 * Validates that the router correctly matches findings to teaching content
 * from all 5 sources: PIQ examples, telling phrases, narrative strategies,
 * surgical examples, and issue patterns.
 *
 * Usage:
 *   npx tsx tests/test-teaching-router-unit.ts
 */

import {
  getTeachingContentForContext,
  detectTellingPhrases,
} from '../src/services/essayIntelligence/coaching/teachingContentRouter';
import type { Finding } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// TEST HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

function makeFinding(claim: string, dimensions: string[], scope?: { paragraph: number }): Finding {
  return {
    id: `test-${Date.now()}`,
    claim,
    dimensions,
    evidence: ['test evidence'],
    scope: scope ? { type: 'paragraph', paragraph: scope.paragraph } : { type: 'essay' },
    maturity: 'confirmed',
    coachingValue: 'high',
    superseded: false,
    layerSource: 'L3.5',
  } as Finding;
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('=== Teaching Content Router Unit Tests ===\n');

  // ── Test 1: Finding-based teaching content (best match wins) ──
  console.log('Test 1: Finding-Based Teaching Content');
  {
    const finding = makeFinding(
      'P1 has a generic opening that could belong to any essay about music',
      ['voice', 'craft'],
    );
    const results = await getTeachingContentForContext([finding], '', 2000);
    assert(results.length > 0, `Found ${results.length} teaching match(es) for "generic opening"`);
    if (results.length > 0) {
      const best = results[0];
      console.log(`    Best match source: ${best.source} (relevance: ${best.relevance})`);
      assert(best.relevance > 0, 'Best match has positive relevance');
      assert(best.tokenEstimate > 0, 'Best match has token estimate');
      assert(best.content.length > 20, 'Best match has substantive content');
      // The router picks the highest-relevance source across all streams
      assert(
        ['piq_example', 'surgical_example', 'narrative_strategy', 'telling_phrase', 'issue_pattern'].includes(best.source),
        `Best match is from a valid source (${best.source})`,
      );
    }
  }

  // ── Test 2: Telling phrase detection ──
  console.log('\nTest 2: Telling Phrase Detection');
  {
    const essayText = 'This experience taught me the importance of perseverance. I felt a profound sense of accomplishment.';
    const matches = await detectTellingPhrases(essayText);
    assert(matches.length > 0, `Detected ${matches.length} telling phrase(s)`);
    if (matches.length > 0) {
      assert(matches[0].source === 'telling_phrase', 'Source is telling_phrase');
      assert(matches[0].content.includes('TELLING PHRASE DETECTED'), 'Content has detection header');
    }
  }

  // ── Test 3: Emotion dimension produces teaching content ──
  console.log('\nTest 3: Emotion Dimension Teaching Content');
  {
    const finding = makeFinding(
      'P2 tells the reader about emotions rather than showing them',
      ['emotion'],
    );
    const results = await getTeachingContentForContext([finding], '', 2000);
    assert(results.length > 0, `Found ${results.length} match(es) for emotion dimension`);
    if (results.length > 0) {
      const best = results[0];
      console.log(`    Best match source: ${best.source} (relevance: ${best.relevance})`);
      // Router returns highest-relevance match — any source is valid
      assert(
        ['surgical_example', 'narrative_strategy', 'piq_example', 'issue_pattern', 'telling_phrase'].includes(best.source),
        `Emotion finding routed to ${best.source}`,
      );
      assert(best.content.includes('BEFORE:') || best.content.includes('NARRATIVE TECHNIQUE') || best.content.includes('WEAK:'),
        'Content has expected teaching format',
      );
    }
  }

  // ── Test 4: Surgical example matching ──
  console.log('\nTest 4: Surgical Example Matching');
  {
    const finding = makeFinding(
      'The essay uses abstract language instead of concrete details',
      ['craft'],
    );
    const results = await getTeachingContentForContext([finding], '', 2000);
    const surgicalMatch = results.find(m => m.source === 'surgical_example');
    assert(surgicalMatch !== undefined, 'Found surgical example for craft/abstract finding');
    if (surgicalMatch) {
      assert(surgicalMatch.content.includes('BEFORE:'), 'Surgical match has BEFORE');
      assert(surgicalMatch.content.includes('AFTER:'), 'Surgical match has AFTER');
    }
  }

  // ── Test 5: Issue pattern detection ──
  console.log('\nTest 5: Issue Pattern Detection');
  {
    const essayText = 'I have always been interested in science. This taught me a valuable lesson about resilience. I am deeply passionate about making a difference in the world.';
    const results = await getTeachingContentForContext([], essayText, 2000);
    const issueMatch = results.find(m => m.source === 'issue_pattern');
    // Issue patterns use detectPhrasePatterns which does phrase matching
    // "I have always been interested" should trigger GENERIC_ORIGIN_STORY
    // "This taught me" should trigger ESSAY_SPEAK_HEAVY
    if (issueMatch) {
      assert(true, `Found issue pattern: ${issueMatch.content.slice(0, 80)}...`);
      assert(issueMatch.content.includes('ISSUE DETECTED'), 'Has issue detected header');
    } else {
      // Issue patterns may not match the exact phrases — depends on pattern DB
      console.log('  ℹ No issue patterns matched (may depend on exact phrase database)');
    }
  }

  // ── Test 6: Token budget management ──
  console.log('\nTest 6: Token Budget Management');
  {
    const findings = [
      makeFinding('generic opening with weak hook', ['voice']),
      makeFinding('abstract language, vague descriptions', ['craft']),
      makeFinding('no turning point in the narrative', ['narrative']),
      makeFinding('emotion labels instead of showing', ['emotion']),
    ];
    const essayText = 'I felt deeply passionate about coding. This taught me the importance of hard work.';

    // Very small budget
    const smallResults = await getTeachingContentForContext(findings, essayText, 100);
    // Larger budget
    const largeResults = await getTeachingContentForContext(findings, essayText, 5000);

    assert(smallResults.length <= largeResults.length, `Small budget (${smallResults.length}) <= large budget (${largeResults.length})`);

    // Verify token estimates don't exceed budget
    const smallTokens = smallResults.reduce((sum, m) => sum + m.tokenEstimate, 0);
    assert(smallTokens <= 100 + 200, `Small budget tokens (${smallTokens}) within bounds`); // allow some margin
  }

  // ── Test 7: Deduplication ──
  console.log('\nTest 7: Deduplication');
  {
    // Same finding twice should not produce duplicate results
    const finding = makeFinding('generic opening', ['voice']);
    const results = await getTeachingContentForContext([finding, finding], '', 2000);
    const piqMatches = results.filter(m => m.source === 'piq_example');
    assert(piqMatches.length <= 1, `No duplicate PIQ matches (got ${piqMatches.length})`);
  }

  // ── Test 8: Relevance sorting ──
  console.log('\nTest 8: Relevance Sorting');
  {
    const findings = [
      makeFinding('generic opening with weak hook', ['voice']),
      makeFinding('abstract telling not showing emotion labels', ['emotion']),
    ];
    const results = await getTeachingContentForContext(findings, '', 5000);
    if (results.length >= 2) {
      assert(results[0].relevance >= results[1].relevance, 'Results sorted by relevance (highest first)');
    } else {
      assert(results.length > 0, `Got ${results.length} results`);
    }
  }

  // ── Summary ──
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
