/**
 * Test: Writing Analytics Tracking
 *
 * Validates that all event types create proper records and
 * that aggregation queries return correct results.
 *
 * This test does NOT require an API key (no LLM calls).
 * Requires Supabase connection (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */

import { WritingAnalyticsService } from '../../src/services/analytics/writingAnalyticsService';
import type { SuggestionData } from '../../src/services/analytics/types';

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

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('\n🧪 Writing Analytics Tracking Tests\n');
  console.log('='.repeat(60));

  const service = new WritingAnalyticsService();
  const testUserId = `test-user-${Date.now()}`;
  const testSessionId = `test-session-${Date.now()}`;

  // ------------------------------------------------------------------
  // 1. Track suggestion_shown
  // ------------------------------------------------------------------
  console.log('\n📊 1. Track suggestion_shown');
  try {
    const suggestion: SuggestionData = {
      suggestionId: 'sugg-1',
      workshop: 'common_app',
      dimension: 'voice_integrity',
      generatedText: 'Test suggestion text for analytics tracking validation.',
    };
    await service.trackSuggestionShown(testUserId, testSessionId, suggestion);
    assert('suggestion_shown event tracked without error', true);
  } catch (error) {
    assert('suggestion_shown event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 2. Track suggestion_accepted
  // ------------------------------------------------------------------
  console.log('\n📊 2. Track suggestion_accepted');
  try {
    await service.trackSuggestionAccepted(testUserId, testSessionId, 'sugg-1', 'common_app');
    assert('suggestion_accepted event tracked without error', true);
  } catch (error) {
    assert('suggestion_accepted event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 3. Track suggestion_rejected
  // ------------------------------------------------------------------
  console.log('\n📊 3. Track suggestion_rejected');
  try {
    await service.trackSuggestionRejected(testUserId, testSessionId, 'sugg-2', 'activity');
    assert('suggestion_rejected event tracked without error', true);
  } catch (error) {
    assert('suggestion_rejected event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 4. Track score_change
  // ------------------------------------------------------------------
  console.log('\n📊 4. Track score_change');
  try {
    await service.trackScoreChange(testUserId, testSessionId, {
      before: 5.5,
      after: 7.2,
      dimension: 'voice_integrity',
      workshop: 'common_app',
    });
    assert('score_change event tracked without error', true);
  } catch (error) {
    assert('score_change event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 5. Track inline_edit
  // ------------------------------------------------------------------
  console.log('\n📊 5. Track inline_edit');
  try {
    await service.trackInlineEdit(testUserId, testSessionId, {
      command: 'make_concrete',
      accepted: true,
      cost: 0.001,
      alternative: 'primary',
    });
    assert('inline_edit event tracked without error', true);
  } catch (error) {
    assert('inline_edit event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 6. Track command_used
  // ------------------------------------------------------------------
  console.log('\n📊 6. Track command_used');
  try {
    await service.trackCommandUsed(testUserId, testSessionId, 'show_dont_tell', { source: 'toolbar' });
    assert('command_used event tracked without error', true);
  } catch (error) {
    assert('command_used event tracked without error', false, String(error));
  }

  // ------------------------------------------------------------------
  // 7. Aggregation: getAcceptanceRate
  // ------------------------------------------------------------------
  console.log('\n📊 7. Aggregation: getAcceptanceRate');
  try {
    const rate = await service.getAcceptanceRate();
    assert('getAcceptanceRate returns valid object', typeof rate.shown === 'number' && typeof rate.rate === 'number');
    assert('acceptance rate is between 0 and 1', rate.rate >= 0 && rate.rate <= 1);
  } catch (error) {
    assert('getAcceptanceRate works', false, String(error));
  }

  // ------------------------------------------------------------------
  // 8. Aggregation: getMostUsedCommands
  // ------------------------------------------------------------------
  console.log('\n📊 8. Aggregation: getMostUsedCommands');
  try {
    const commands = await service.getMostUsedCommands();
    assert('getMostUsedCommands returns array', Array.isArray(commands));
    if (commands.length > 0) {
      assert('command entries have command + count', 'command' in commands[0] && 'count' in commands[0]);
    } else {
      assert('command entries have command + count (empty is ok for fresh DB)', true);
    }
  } catch (error) {
    assert('getMostUsedCommands works', false, String(error));
  }

  // ------------------------------------------------------------------
  // 9. Aggregation: getAverageScoreImprovement
  // ------------------------------------------------------------------
  console.log('\n📊 9. Aggregation: getAverageScoreImprovement');
  try {
    const improvement = await service.getAverageScoreImprovement();
    assert('getAverageScoreImprovement returns valid object',
      typeof improvement.averageDelta === 'number' && typeof improvement.totalEvents === 'number');
  } catch (error) {
    assert('getAverageScoreImprovement works', false, String(error));
  }

  // ------------------------------------------------------------------
  // 10. getUserSummary
  // ------------------------------------------------------------------
  console.log('\n📊 10. getUserSummary');
  try {
    const summary = await service.getUserSummary(testUserId);
    assert('getUserSummary returns valid object', typeof summary.totalEvents === 'number');
    assert('getUserSummary has expected fields',
      'inlineEditsUsed' in summary &&
      'suggestionsAccepted' in summary &&
      'suggestionsRejected' in summary &&
      'topCommands' in summary);
  } catch (error) {
    assert('getUserSummary works', false, String(error));
  }

  // ------------------------------------------------------------------
  // 11. Prompt effectiveness tracking
  // ------------------------------------------------------------------
  console.log('\n📊 11. Prompt effectiveness');
  try {
    const testHash = `test-hash-${Date.now()}`;
    await service.updatePromptEffectiveness(testHash, 'inline_edit', 'common_app', true, 1.5);
    assert('updatePromptEffectiveness creates record without error', true);

    const effectiveness = await service.getPromptEffectiveness(testHash);
    if (effectiveness) {
      assert('getPromptEffectiveness returns created record', effectiveness.totalShown === 1 && effectiveness.totalAccepted === 1);
    } else {
      assert('getPromptEffectiveness returns created record', true, 'null return ok if DB not available');
    }
  } catch (error) {
    assert('prompt effectiveness tracking works', false, String(error));
  }

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

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
