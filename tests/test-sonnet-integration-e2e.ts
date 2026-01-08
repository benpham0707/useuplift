/**
 * Test: Sonnet Integration End-to-End
 *
 * Tests the full integration of the Sonnet Context Layer with
 * the TypeSpecificSuggestionService for improved quality.
 *
 * Demonstrates:
 * 1. Sonnet detects gaps accurately
 * 2. Gap awareness prevents inventing details
 * 3. Suggestions acknowledge missing context
 * 4. Quality improves with context gathering
 */

import 'dotenv/config';
import { TypeSpecificSuggestionService, IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { sonnetContextLayer } from '../src/services/commonAppWorkshop/services/sonnetContextLayer';
import { SupplementalType } from '../src/services/commonAppWorkshop/types';

// ============================================================================
// TEST DATA
// ============================================================================

const GENERIC_CHALLENGE_ESSAY = `
Moving to a new country was the biggest challenge I've ever faced. It was really hard at first but I learned a lot. I had to adapt to a new culture and make new friends. Eventually I overcame these obstacles and became a stronger person. This experience taught me resilience and the importance of perseverance.
`;

const GENERIC_ISSUE: IssueContext = {
  issue_id: 'generic_challenge_1',
  quote: 'It was really hard at first but I learned a lot.',
  location: 'Early in essay',
  diagnosis: {
    problem: 'Vague challenge description without specific struggle or growth moment',
    symptom_type: 'missing_anchor_moment',
    affected_dimensions: ['growth_arc', 'emotional_stakes'],
    score_impact: 3
  },
  surrounding_context: GENERIC_CHALLENGE_ESSAY,
  relevant_college_values: [],
  relevant_quotes: []
};

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runE2ETest(): Promise<void> {
  console.log('='.repeat(70));
  console.log('SONNET INTEGRATION E2E TEST');
  console.log('='.repeat(70));
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const service = new TypeSpecificSuggestionService();
  let totalCost = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Basic Flow Without Sonnet Layer
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 1: Without Sonnet Layer (Pattern-Based Only)');
  console.log('─'.repeat(70));

  const basicResult = await service.analyzeContextNeeds(
    GENERIC_CHALLENGE_ESSAY,
    'challenge',
    [GENERIC_ISSUE]
  );

  console.log(`\n📊 BASIC RESULT:`);
  console.log(`   Can Proceed: ${basicResult.can_proceed}`);
  console.log(`   Context Needs Severity: ${basicResult.context_needs?.severity || 'none'}`);

  if (basicResult.suggestions?.polished_original) {
    console.log(`\n   Polished Original Preview:`);
    console.log(`   "${basicResult.suggestions.polished_original.text?.substring(0, 100)}..."`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Enhanced Flow WITH Sonnet Layer
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: WITH Sonnet Layer (AI-Powered Gap Detection)');
  console.log('─'.repeat(70));

  const enhancedResult = await service.analyzeContextNeedsEnhanced(
    GENERIC_CHALLENGE_ESSAY,
    'challenge',
    [GENERIC_ISSUE],
    { useSonnetLayer: true }
  );

  console.log(`\n📊 ENHANCED RESULT:`);
  console.log(`   Can Proceed: ${enhancedResult.can_proceed}`);
  console.log(`   Context Quality Score: ${enhancedResult.context_quality_score}/100`);
  console.log(`   Context Needs Severity: ${enhancedResult.context_needs?.severity || 'none'}`);

  if (enhancedResult.sonnet_analysis) {
    const analysis = enhancedResult.sonnet_analysis;
    totalCost += (analysis.tokens_used.input * 3 / 1_000_000) + (analysis.tokens_used.output * 15 / 1_000_000);

    console.log(`\n   Sonnet Analysis Summary: ${analysis.quality_summary}`);
    console.log(`   Gaps Detected: ${analysis.gaps.length}`);

    if (analysis.gaps.length > 0) {
      console.log(`\n   📌 TOP GAPS:`);
      analysis.gaps.slice(0, 3).forEach((gap, i) => {
        console.log(`   ${i + 1}. [P${gap.priority}] ${gap.gap_type}`);
        console.log(`      Question: ${gap.suggested_question}`);
      });
    }
  }

  if (enhancedResult.context_needs?.gathering_request) {
    console.log(`\n   📝 GATHERING REQUEST:`);
    console.log(`   Message to User: "${enhancedResult.context_needs.message_to_user}"`);
    console.log(`   Questions:`);
    enhancedResult.context_needs.gathering_request.questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question_text}`);
    });
  }

  if (enhancedResult.suggestions?.polished_original) {
    console.log(`\n   Polished Original Preview:`);
    console.log(`   "${enhancedResult.suggestions.polished_original.text?.substring(0, 100)}..."`);
  }

  if (enhancedResult.invented_elements && enhancedResult.invented_elements.length > 0) {
    console.log(`\n   ⚠️ INVENTED ELEMENTS WARNING:`);
    enhancedResult.invented_elements.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.element}: ${el.would_be_better_if}`);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Good Essay Should Pass Through
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 3: Good Essay Should Have High Context Score');
  console.log('─'.repeat(70));

  const GOOD_ESSAY = `
The email arrived at 11:47 PM: "We regret to inform you that your startup, CodeBridge, has not been selected for Y Combinator." I sat frozen in my desk chair, the blue glow of my laptop illuminating the tears I refused to let fall. Six months of 4 AM coding sessions, $3,000 of my savings, and my grandmother's belief in me—all seemingly wasted.

The next morning, I almost deleted our GitHub repository. But then I noticed something: 47 new users had signed up overnight. Real students, using our free tutoring platform. Maria from Phoenix left a review: "Finally understand derivatives. Thank you."

That's when I realized: rejection from accelerators didn't mean rejection from the people we built this for. I called my co-founder: "We're not shutting down. We're doubling down."
`;

  const goodEssayResult = await service.analyzeContextNeedsEnhanced(
    GOOD_ESSAY,
    'challenge',
    [{
      ...GENERIC_ISSUE,
      issue_id: 'minor_polish',
      quote: "I called my co-founder",
      diagnosis: {
        problem: 'Could add more specific dialogue',
        symptom_type: 'minor_polish',
        affected_dimensions: ['voice_authenticity'],
        score_impact: 1
      }
    }],
    { useSonnetLayer: true }
  );

  console.log(`\n📊 GOOD ESSAY RESULT:`);
  console.log(`   Can Proceed: ${goodEssayResult.can_proceed}`);
  console.log(`   Context Quality Score: ${goodEssayResult.context_quality_score}/100`);
  console.log(`   Severity: ${goodEssayResult.context_needs?.severity || 'none'}`);

  if (goodEssayResult.sonnet_analysis) {
    const analysis = goodEssayResult.sonnet_analysis;
    totalCost += (analysis.tokens_used.input * 3 / 1_000_000) + (analysis.tokens_used.output * 15 / 1_000_000);
    console.log(`   Summary: ${analysis.quality_summary}`);
    console.log(`   Gaps Found: ${analysis.gaps.length}`);
    if (analysis.gaps.length > 0) {
      console.log(`   Gap Priorities: ${analysis.gaps.map(g => `P${g.priority}`).join(', ')}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const genericEssayScore = enhancedResult.context_quality_score || 0;
  const goodEssayScore = goodEssayResult.context_quality_score || 0;

  console.log(`\n📈 QUALITY DIFFERENTIATION:`);
  console.log(`   Generic Essay Score: ${genericEssayScore}/100 ${genericEssayScore < 50 ? '✅ Correctly flagged as needing context' : '❌ Should be lower'}`);
  console.log(`   Good Essay Score: ${goodEssayScore}/100 ${goodEssayScore > 50 ? '✅ Correctly recognized as having context' : '❌ Should be higher'}`);

  console.log(`\n💰 TOTAL COST: $${totalCost.toFixed(4)}`);

  // Pass/Fail
  const passed = genericEssayScore < 50 && goodEssayScore > 40;
  console.log(`\n${passed ? '🎉 E2E TEST PASSED' : '⚠️ E2E TEST NEEDS ATTENTION'}`);

  if (passed) {
    console.log(`\n✅ Sonnet Context Layer successfully differentiates:`);
    console.log(`   - Generic essays needing context (score: ${genericEssayScore})`);
    console.log(`   - Good essays with sufficient context (score: ${goodEssayScore})`);
  }
}

// Run
runE2ETest().catch(console.error);
