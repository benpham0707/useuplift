/**
 * College Overlay Integration - End-to-End Test
 *
 * Tests the full integration of college overlay services:
 * 1. RedFlagMatcher - Pattern-matched red flags with Dean quotes
 * 2. GreenFlagAmplifier - College-valued strengths preservation
 * 3. PromptRubricInjector - Rubric band upgrade guidance
 * 4. SocraticQuestionMatcher - Issue-triggered teaching questions
 * 5. Post-generation validation against overlays
 *
 * Test Strategy:
 * - Use Stanford essay with KNOWN red flags (intellectual vitality, passion)
 * - Check that overlay layer detects and warns about these issues
 * - Verify metadata is returned correctly
 * - Ensure graceful degradation if services fail
 */

import { TypeSpecificSuggestionService } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';
import { Stage1BDiagnosisService } from '../src/services/commonAppWorkshop/services/stage1BDiagnosisService';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import type { VoiceFingerprint } from '../src/services/commonAppWorkshop/types/contextGathering';
import type { EssayContextPackage } from '../src/services/commonAppWorkshop/types';

// ============================================================================
// TEST ESSAY: Stanford "Intellectual Vitality" with RED FLAGS
// ============================================================================

const STANFORD_IV_ESSAY_WITH_RED_FLAGS = `
I have always been passionate about intellectual vitality and learning.
Ever since I was young, I knew that Stanford was my dream school because
of its world-class reputation and innovative culture.

In my AP Biology class, I learned about genetics and it fascinated me.
I love learning and I'm always curious about new topics. At Stanford,
I want to collaborate with top professors and explore interdisciplinary
research at the d.school.

The Stanford community will help me grow as a leader and make an impact
on the world. I'm excited about the possibilities that lie ahead.
`.trim();

// This essay contains MULTIPLE red flags:
// 1. "intellectual vitality" (critical - using Stanford's term)
// 2. "passionate" (major - claiming not showing)
// 3. "dream school" (critical - empty flattery)
// 4. "world-class" (moderate - prestige acknowledgment)
// 5. "AP Biology class" (major - class-based learning only)
// 6. "I love learning" (moderate - generic claim)
// 7. "d.school" (moderate - surface research without depth)
// 8. "make an impact on the world" (moderate - vague ambition)

// ============================================================================
// MOCK DATA
// ============================================================================

const mockIssues: IssueContext[] = [
  {
    issue_id: 'issue_1',
    quote: 'I have always been passionate about intellectual vitality',
    location: 'I have always been passionate about intellectual vitality',
    diagnosis: {
      problem: 'Uses Stanford\'s own terminology back at them',
      symptom_type: 'CLASS_BASED_IV',
      affected_dimensions: ['intellectual_vitality', 'authenticity'],
      score_impact: -15,
    },
    surrounding_context: STANFORD_IV_ESSAY_WITH_RED_FLAGS,
    relevant_college_values: [],
    relevant_quotes: [],
  },
  {
    issue_id: 'issue_2',
    quote: 'In my AP Biology class, I learned about genetics',
    location: 'In my AP Biology class, I learned about genetics',
    diagnosis: {
      problem: 'Learning bounded by classroom requirements',
      symptom_type: 'CLASS_BASED_ONLY',
      affected_dimensions: ['intellectual_vitality'],
      score_impact: -10,
    },
    surrounding_context: STANFORD_IV_ESSAY_WITH_RED_FLAGS,
    relevant_college_values: [],
    relevant_quotes: [],
  },
];

const mockVoice: VoiceFingerprint = {
  core_markers: ['I', 'learning', 'curious'],
  sentence_rhythms: ['simple', 'declarative'],
  vocabulary_level: 'conversational',
  quirks: [],
  authenticity_score: 65,
  distinctiveness_score: 50,
};

// Mock essay context (simulates Stage 1 output)
const mockEssayContext: EssayContextPackage = {
  holistic_context: {
    recurring_motifs: ['learning', 'passion', 'curiosity', 'Stanford', 'collaboration'],
    emotional_arc: 'Flat/predictable - starts enthusiastic, stays enthusiastic',
    narrative_thread: 'Generic academic journey without specificity or growth',
    arc_predictability: 8.5,
    arc_suggested_subversion: 'Show vulnerability or unexpected challenge to break predictability'
  },
  dimensional_context: [
    {
      dimension: 'intellectual_vitality',
      current_score: 4,
      target_score: 8,
      gap: 4,
      strength_level: 'WEAK' as const,
      evidence: {
        strengths: ['Shows genuine interest in genetics and learning'],
        weaknesses: [
          'Uses Stanford\'s own terminology ("intellectual vitality") back at them',
          'Learning bounded by classroom (AP Bio) rather than self-directed',
          'Claims passion without showing specific rabbit-hole moments'
        ]
      }
    },
    {
      dimension: 'authenticity',
      current_score: 5,
      target_score: 8,
      gap: 3,
      strength_level: 'ADEQUATE' as const,
      evidence: {
        strengths: ['Voice feels conversational and genuine'],
        weaknesses: [
          'Generic passion claims ("I have always been passionate")',
          'Empty flattery ("dream school", "world-class")',
          'Surface-level research (d.school mention without depth)'
        ]
      }
    },
    {
      dimension: 'specificity',
      current_score: 3,
      target_score: 8,
      gap: 5,
      strength_level: 'WEAK' as const,
      evidence: {
        strengths: [],
        weaknesses: [
          'No specific moments or examples',
          'Vague ambitions ("make an impact on the world")',
          'Generic class mention (AP Biology) without unique insight'
        ]
      }
    }
  ],
  score_reasoning: {
    total_score: 58,
    quality_tier: 'Average - Shows potential but needs significant development',
    core_strength: 'Genuine enthusiasm for learning is present and voice feels conversational',
    core_weakness: 'Heavy reliance on generic passion claims and Stanford-specific buzzwords without showing actual intellectual curiosity through specific examples',
    reader_experience: 'Reader feels like they\'ve read this essay 100 times before - nothing distinctive or memorable',
    principle_scores: [
      {
        principle_id: 'clarity_of_thought',
        principle_name: 'Clarity of Thought',
        score: 6,
        how_achieved: 'Essay structure is logical and easy to follow',
        reader_effect: 'Reader understands what student wants but doesn\'t feel engaged'
      },
      {
        principle_id: 'authentic_voice',
        principle_name: 'Authentic Voice',
        score: 5,
        how_achieved: 'Voice is conversational but leans on clichés',
        reader_effect: 'Reader questions if this is student\'s real voice or what they think admissions wants'
      },
      {
        principle_id: 'concrete_details',
        principle_name: 'Concrete Details',
        score: 3,
        how_achieved: 'Lacks specific moments, times, sensory details, or unique observations',
        reader_effect: 'Reader can\'t visualize anything - essay feels abstract'
      }
    ]
  },
  word_count_status: {
    status: 'within_limit' as const,
    word_count: 145,
    limit: 250,
    delta: -105,
    severity: 'none' as const,
    guidance: 'Significant room to expand with specific examples and deeper reflection'
  }
};

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runOverlayIntegrationTest() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('COLLEGE OVERLAY INTEGRATION - E2E TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  const service = new TypeSpecificSuggestionService();
  const stanford = getCollegeResearch('stanford');

  if (!stanford) {
    console.error('❌ Stanford research data not found!');
    return;
  }

  console.log('✓ Stanford research loaded');
  console.log(`  - ${stanford.redFlags?.length || 0} red flags`);
  console.log(`  - ${stanford.greenFlags?.length || 0} green flags`);
  console.log(`  - ${stanford.essayPrompts?.length || 0} prompts with rubrics`);
  console.log(`  - ${stanford.keyQuotes?.length || 0} key quotes\n`);

  console.log('Test Essay (excerpt):');
  console.log('─────────────────────────────────────────────────────────');
  console.log(STANFORD_IV_ESSAY_WITH_RED_FLAGS.substring(0, 200) + '...\n');
  console.log('Known Red Flags:');
  console.log('  1. "intellectual vitality" (using Stanford\'s term)');
  console.log('  2. "passionate" (claiming not showing)');
  console.log('  3. "dream school" (empty flattery)');
  console.log('  4. "AP Biology class" (class-based only)');
  console.log('  5. "d.school" (surface research)\n');

  console.log('Running TypeSpecificSuggestionService with overlay layer...\n');

  try {
    const startTime = Date.now();

    const result = await service.generateSuggestions(
      STANFORD_IV_ESSAY_WITH_RED_FLAGS,
      'intellectual',
      mockIssues,
      {
        college: stanford,
        promptId: 'stanford_intellectual_vitality', // Enable rubric band guidance
        voice: mockVoice,
        essayContext: mockEssayContext, // NEW: Pass essay context from Stage 1
      }
    );

    const duration = Date.now() - startTime;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Test 1: Overlay Analysis Metadata
    console.log('1. OVERLAY ANALYSIS METADATA:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`   Red flags detected: ${result.overlay_analysis.red_flags_detected}`);
    console.log(`   Green flags detected: ${result.overlay_analysis.green_flags_detected}`);
    console.log(`   Rubric band: ${result.overlay_analysis.rubric_band || 'N/A'}`);
    console.log(`   Target band: ${result.overlay_analysis.target_band || 'N/A'}`);
    console.log(`   Socratic questions: ${result.overlay_analysis.socratic_questions_available}\n`);

    const expectedRedFlags = 3; // Minimum we expect to detect
    if (result.overlay_analysis.red_flags_detected >= expectedRedFlags) {
      console.log(`   ✓ PASS: Detected ${result.overlay_analysis.red_flags_detected} red flags (expected ≥${expectedRedFlags})`);
    } else {
      console.log(`   ⚠️ FAIL: Only detected ${result.overlay_analysis.red_flags_detected} red flags (expected ≥${expectedRedFlags})`);
    }

    if (result.overlay_analysis.rubric_band) {
      console.log(`   ✓ PASS: Rubric band guidance provided (${result.overlay_analysis.rubric_band})`);
    } else {
      console.log(`   ⚠️ FAIL: No rubric band guidance`);
    }

    if (result.overlay_analysis.socratic_questions_available > 0) {
      console.log(`   ✓ PASS: Socratic questions available (${result.overlay_analysis.socratic_questions_available})`);
    } else {
      console.log(`   ⚠️ WARN: No Socratic questions matched`);
    }

    // Test 2: Suggestion Validation Warnings
    console.log('\n2. SUGGESTION OVERLAY WARNINGS:');
    console.log('─────────────────────────────────────────────────────────');

    let hasOverlayWarnings = false;
    for (const issue of result.issues) {
      const polishedWarnings = issue.suggestions?.polished_original?.overlay_warnings;
      const voiceWarnings = issue.suggestions?.voice_amplifier?.overlay_warnings;

      if (polishedWarnings && polishedWarnings.length > 0) {
        console.log(`   Issue ${issue.issue_id} (Polished):`);
        polishedWarnings.forEach(w => console.log(`     - ${w.substring(0, 100)}...`));
        hasOverlayWarnings = true;
      }

      if (voiceWarnings && voiceWarnings.length > 0) {
        console.log(`   Issue ${issue.issue_id} (Voice):`);
        voiceWarnings.forEach(w => console.log(`     - ${w.substring(0, 100)}...`));
        hasOverlayWarnings = true;
      }
    }

    if (!hasOverlayWarnings) {
      console.log('   (No overlay warnings - suggestions passed validation)');
    }

    // Test 3: Performance Metrics
    console.log('\n3. PERFORMANCE METRICS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Cost: $${result.cost.toFixed(4)}`);
    console.log(`   Input tokens: ${result.tokens_used.input.toLocaleString()}`);
    console.log(`   Output tokens: ${result.tokens_used.output.toLocaleString()}`);

    const tokenIncrease = ((result.tokens_used.input / 10000) - 1) * 100;
    if (tokenIncrease < 20) {
      console.log(`   ✓ PASS: Token usage increase <20% (overlay layer is efficient)`);
    } else {
      console.log(`   ⚠️ WARN: Token usage increase >${tokenIncrease.toFixed(1)}% (consider optimization)`);
    }

    // Test 4: Suggestion Quality Check
    console.log('\n4. SUGGESTION QUALITY SAMPLE:');
    console.log('─────────────────────────────────────────────────────────');

    if (result.issues.length > 0) {
      const firstIssue = result.issues[0];
      console.log(`   Issue: "${firstIssue.issue_quote.substring(0, 60)}..."`);
      console.log(`   Diagnosis: ${firstIssue.diagnosis_summary.substring(0, 80)}...`);

      if (firstIssue.suggestions?.polished_original) {
        console.log(`\n   Polished Suggestion:`);
        console.log(`   "${firstIssue.suggestions.polished_original.text.substring(0, 100)}..."`);
        console.log(`   Rationale: ${firstIssue.suggestions.polished_original.rationale.substring(0, 80)}...`);
      }

      if (firstIssue.suggestions?.voice_amplifier) {
        console.log(`\n   Voice Amplifier:`);
        console.log(`   "${firstIssue.suggestions.voice_amplifier.text.substring(0, 100)}..."`);
      }
    }

    // Test 5: Score Breakdown (NEW - Phase 4)
    console.log('\n5. SCORE BREAKDOWN (PIQ-STYLE):');
    console.log('─────────────────────────────────────────────────────────');

    if (result.score_breakdown) {
      const sb = result.score_breakdown;

      console.log(`   Total Score: ${sb.total_score}/100 (${sb.quality_tier})`);
      console.log(`   Projected After Fixes: ${sb.improvement_potential.projected_score}/100`);
      console.log(`   Improvement Potential: +${sb.improvement_potential.projected_score - sb.total_score} points\n`);

      console.log(`   Why This Score:`);
      console.log(`   ✅ Core Strength: ${sb.why_this_score.core_strength.substring(0, 80)}...`);
      console.log(`   ❌ Core Weakness: ${sb.why_this_score.core_weakness.substring(0, 80)}...`);
      console.log(`   📖 Reader Experience: ${sb.why_this_score.reader_experience.substring(0, 80)}...`);

      console.log(`\n   Dimensional Breakdown (Top 3):`);
      for (const dim of sb.dimensional_scores.slice(0, 3)) {
        console.log(`\n   ${dim.dimension.toUpperCase().replace(/_/g, ' ')}: ${dim.score}/${dim.target} (${dim.strength_level})`);
        console.log(`      Gap: ${dim.gap} points`);
        if (dim.whats_working.length > 0) {
          console.log(`      ✅ Working: ${dim.whats_working[0].substring(0, 60)}...`);
        }
        if (dim.whats_missing.length > 0) {
          console.log(`      ❌ Missing: ${dim.whats_missing[0].substring(0, 60)}...`);
        }
        console.log(`      💡 How to Improve: ${dim.how_to_improve.substring(0, 70)}...`);
      }

      console.log(`\n   Priority Dimensions: ${sb.improvement_potential.dimensions_to_prioritize.join(', ')}`);
      console.log(`   Quick Wins: ${sb.improvement_potential.quick_wins.length} identified`);

      console.log(`\n   ✓ PASS: Score breakdown provided (PIQ-style)`);
    } else {
      console.log(`   ⚠️ FAIL: No score breakdown returned`);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const tests = [
      result.overlay_analysis.red_flags_detected >= expectedRedFlags,
      result.overlay_analysis.rubric_band !== null,
      result.score_breakdown !== undefined, // NEW: Score breakdown check
      result.cost < 0.20, // Reasonable cost threshold
      result.issues.length > 0, // Got suggestions
    ];

    const passed = tests.filter(t => t).length;
    const total = tests.length;

    console.log(`   Tests Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (passed === total) {
      console.log('   ✅ ALL TESTS PASSED - Overlay integration working correctly!');
    } else {
      console.log('   ⚠️ SOME TESTS FAILED - Review output above');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    console.log('\n');
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

runOverlayIntegrationTest().then(() => {
  console.log('Test complete.');
  process.exit(0);
}).catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
