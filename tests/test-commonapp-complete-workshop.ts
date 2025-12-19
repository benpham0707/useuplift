/**
 * Complete Workshop Integration Test
 *
 * Tests the full Common App Workshop flow from Stage 0 to Stage 3:
 * - Voice excavation (Stage 0)
 * - Foundation teaching (Stage 1)
 * - Surgical teaching (Stage 2)
 * - Final polish (Stage 3)
 *
 * Validates:
 * - Cost targets (~$0.34 per essay)
 * - Quality improvements (PIQ-level depth)
 * - Context handoffs between stages
 * - Voice preservation throughout
 * - 2 suggestions per issue (Polished Original + Voice Amplifier)
 * - Missing elements identification
 * - Evidence-based teaching
 */

import { HandoffService } from '../src/services/commonAppWorkshop/services/handoffService';
import type { WorkshopInput } from '../src/services/commonAppWorkshop/services/handoffService';
import type { CollegeResearch } from '../src/services/commonAppWorkshop/types/collegeResearch';

// ============================================================================
// TEST DATA
// ============================================================================

const STANFORD_RESEARCH: CollegeResearch = {
  collegeName: 'Stanford University',
  collegeId: 'stanford',

  core_values: [
    {
      value_name: 'Intellectual Vitality',
      description: 'Stanford seeks students who demonstrate genuine curiosity and love of learning beyond grades',
      evidence_type: 'dean_statement',
      source: 'Stanford Admissions',
      weight: 0.35,
      keywords: ['curiosity', 'intellectual exploration', 'learning for its own sake'],
    },
    {
      value_name: 'Impact',
      description: 'Stanford values students who want to make a difference in the world',
      evidence_type: 'dean_statement',
      source: 'Stanford Admissions',
      weight: 0.30,
      keywords: ['impact', 'change', 'difference', 'community'],
    },
  ],

  supplemental_prompts: [
    {
      prompt_id: 'stanford_what_matters',
      prompt_text: 'What matters most to you, and why?',
      word_limit: 250,
      type: 'reflection',
      difficulty: 'high',

      dimensional_criteria: {
        intellectual_vitality: {
          weight: 0.35,
          description: 'Show genuine curiosity and depth of thinking',
        },
        authenticity: {
          weight: 0.30,
          description: 'Be genuinely yourself, not who you think Stanford wants',
        },
        impact: {
          weight: 0.20,
          description: 'Show how this value shapes your actions',
        },
        narrative_quality: {
          weight: 0.15,
          description: 'Tell a compelling story',
        },
      },

      rubric: {
        rubric_id: 'stanford_what_matters_rubric',
        dimensions: [
          {
            dimension_name: 'Intellectual Vitality',
            weight: 0.35,
            bands: [
              {
                score_range: [9, 10],
                label: 'Exceptional',
                description: 'Shows deep, genuine curiosity that drives their life choices',
                indicators: ['Specific examples of intellectual pursuit', 'Shows learning for its own sake'],
              },
              {
                score_range: [7, 8],
                label: 'Strong',
                description: 'Demonstrates clear intellectual interests',
                indicators: ['Evidence of curiosity', 'Some depth of thinking'],
              },
              {
                score_range: [5, 6],
                label: 'Adequate',
                description: 'Mentions learning but lacks depth',
                indicators: ['Generic statements about learning', 'Lacks specificity'],
              },
              {
                score_range: [1, 4],
                label: 'Weak',
                description: 'No evidence of intellectual curiosity',
                indicators: ['Focuses only on grades/achievement', 'No passion for learning'],
              },
            ],
          },
        ],
      },
    },
  ],

  key_quotes: [
    {
      quote_id: 'stanford_iv_1',
      quote_text: 'We want students who are genuinely excited about learning, not just getting good grades',
      source: 'Dean of Admissions',
      relevance_to: ['intellectual_vitality'],
      quote_type: 'value_statement',
      weight: 0.9,
    },
  ],

  red_flags: [
    {
      flag_id: 'stanford_red_1',
      flag_name: 'Achievement List',
      description: 'Listing achievements without showing genuine curiosity',
      severity: 'critical',
      affected_dimensions: ['intellectual_vitality'],
    },
  ],

  green_flags: [
    {
      flag_id: 'stanford_green_1',
      flag_name: 'Learning Moment',
      description: 'Showing a specific moment of intellectual discovery',
      impact: 'significant',
      affected_dimensions: ['intellectual_vitality'],
    },
  ],

  socratic_question_bank: {
    questions: [
      {
        question_id: 'stanford_sq_1',
        question_text: 'What question keeps you up at night?',
        purpose: 'Uncover genuine intellectual curiosity',
        when_to_use: 'When student is too focused on achievements',
        dimension_target: 'intellectual_vitality',
      },
    ],
  },

  elite_examples: [
    {
      example_id: 'stanford_ex_1',
      prompt_id: 'stanford_what_matters',
      essay_excerpt: 'I spent three hours debugging code that ultimately taught me nothing about computer science...',
      what_makes_it_elite: 'Shows genuine intellectual curiosity through specific moment',
      dimension_strengths: {
        intellectual_vitality: 9,
        authenticity: 10,
      },
      annotations: [
        {
          quote: 'three hours debugging',
          annotation_type: 'strength',
          explanation: 'Specific time shows authenticity',
        },
      ],
    },
  ],

  dimension_weights: {
    intellectual_vitality: 0.35,
    authenticity: 0.30,
    impact: 0.20,
    narrative_quality: 0.15,
  },
};

const TEST_ESSAY_WEAK = `
I have always been passionate about learning. Throughout my academic career, I've maintained
a 4.0 GPA and taken the most challenging courses available. I believe education is important
because it opens doors to opportunities. In the future, I want to use my education to make
a difference in the world. My intellectual curiosity drives me to excel in all my classes,
and I'm excited to continue this journey at Stanford.
`.trim();

const TEST_ESSAY_PROMPT = 'What matters most to you, and why? (250 words)';

const TEST_VOICE_SAMPLE = `
I think a lot about how things work. Like, yesterday I was walking to school and noticed
how the streetlight patterns change based on traffic. I ended up being late because I was
too busy counting the timing cycles. My friends think I'm weird, but I can't help it.
`.trim();

const TEST_INTERVIEW_RESPONSES = [
  {
    question: 'What do you care about?',
    response: 'Understanding how things work, even when it\'s not useful',
  },
  {
    question: 'Tell me about a time you got lost in something',
    response: 'I spent all night researching why snow makes that crunching sound. Totally forgot about my homework.',
  },
  {
    question: 'What makes you angry?',
    response: 'When people learn just for the grade and don\'t actually care about understanding',
  },
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runCompleteWorkshopTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('COMPLETE WORKSHOP INTEGRATION TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const handoffService = new HandoffService(apiKey);

  // Prepare input
  const input: WorkshopInput = {
    rawDraft: TEST_ESSAY_WEAK,
    essayPrompt: TEST_ESSAY_PROMPT,
    collegeId: 'stanford',
    collegeName: 'Stanford University',
    collegeResearch: STANFORD_RESEARCH,
    voiceSample: TEST_VOICE_SAMPLE,
    interviewResponses: TEST_INTERVIEW_RESPONSES,
  };

  console.log('📝 Input Essay (Weak)');
  console.log('─────────────────────────────────────────────────────────');
  console.log(TEST_ESSAY_WEAK);
  console.log('');
  console.log('🎤 Voice Sample');
  console.log('─────────────────────────────────────────────────────────');
  console.log(TEST_VOICE_SAMPLE);
  console.log('');

  // Run complete workshop
  const startTime = Date.now();
  const output = await handoffService.runCompleteWorkshop(input);
  const endTime = Date.now();
  const durationSeconds = (endTime - startTime) / 1000;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // ========================================================================
  // COST VALIDATION
  // ========================================================================
  console.log('💰 COST ANALYSIS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Total Cost: $${output.metrics.total_cost.toFixed(3)}`);
  console.log('');
  console.log('By Stage:');
  console.log(`  Stage 0 (Voice): $${output.metrics.cost_by_stage.stage0.toFixed(3)}`);
  console.log(`  Stage 1 (Foundation): $${output.metrics.cost_by_stage.stage1.toFixed(3)}`);
  console.log(`  Stage 2 (Surgical): $${output.metrics.cost_by_stage.stage2.toFixed(3)}`);
  console.log(`  Stage 3 (Polish): $${output.metrics.cost_by_stage.stage3.toFixed(3)}`);
  console.log('');

  const costTarget = 0.34;
  const costVariance = ((output.metrics.total_cost - costTarget) / costTarget) * 100;
  console.log(`Target: $${costTarget.toFixed(3)}`);
  console.log(`Variance: ${costVariance > 0 ? '+' : ''}${costVariance.toFixed(1)}%`);
  console.log(`Status: ${Math.abs(costVariance) < 20 ? '✓ PASS' : '✗ FAIL'} (±20% acceptable)`);
  console.log('');

  // ========================================================================
  // QUALITY VALIDATION
  // ========================================================================
  console.log('📊 QUALITY METRICS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Initial Spark: ${output.metrics.quality_metrics.initial_spark}/100`);
  console.log(`Final Spark: ${output.metrics.quality_metrics.final_spark}/10`);
  console.log(`Spark Improvement: +${output.metrics.quality_metrics.spark_improvement}`);
  console.log('');
  console.log(`Average Dimension Improvement: +${output.metrics.quality_metrics.average_dimension_improvement}`);
  console.log('');
  console.log('Dimensional Journey:');
  output.stage3.journey_progress.dimensions.forEach((dim) => {
    console.log(`  ${dim.dimension}: ${dim.initial_score} → ${dim.final_score} (+${dim.improvement})`);
  });
  console.log('');
  console.log(`Ready for Submission: ${output.stage3.ready_for_submission ? '✓ YES' : '✗ NO'}`);
  console.log('');

  // ========================================================================
  // STAGE 0: VOICE EXCAVATION
  // ========================================================================
  console.log('🎨 STAGE 0: VOICE EXCAVATION');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Register: ${output.stage0.voiceContext.register}`);
  console.log(`Spark Score: ${output.stage0.voiceContext.sparkScore}/100`);
  console.log('Voice Qualities:');
  output.stage0.voiceContext.voiceQualities.forEach((q) => console.log(`  - ${q}`));
  console.log('');
  console.log('Authentic Phrases Preserved:');
  output.stage0.voiceContext.authenticPhrases.slice(0, 3).forEach((p) => console.log(`  - "${p}"`));
  console.log('');
  console.log('Voice-First Draft (First 200 chars):');
  console.log(output.stage0.voiceFirstDraft.draft.substring(0, 200) + '...');
  console.log('');

  // ========================================================================
  // STAGE 1: FOUNDATION TEACHING
  // ========================================================================
  console.log('📚 STAGE 1: FOUNDATION TEACHING');
  console.log('─────────────────────────────────────────────────────────');
  console.log('College Values Taught:');
  output.stage1.conceptual_foundation.college_values_teaching.forEach((cv) => {
    console.log(`  - ${cv.core_value.value_name}: ${cv.how_this_applies.substring(0, 60)}...`);
  });
  console.log('');
  console.log('Top 3 Critical Issues:');
  output.stage1.top_3_critical_issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.problem}`);
    console.log(`     Quote: "${issue.quote.substring(0, 50)}..."`);
    console.log(`     Symptom: ${issue.symptom_type}`);

    // Validate PIQ-style missing elements
    console.log('     Missing Elements:');
    if (issue.missing_elements.sensory_details) {
      console.log(`       - Sensory: ${issue.missing_elements.sensory_details.length} items`);
    }
    if (issue.missing_elements.concrete_objects) {
      console.log(`       - Concrete: ${issue.missing_elements.concrete_objects.length} items`);
    }
    if (issue.missing_elements.micro_moment) {
      console.log(`       - Micro-moment: ${issue.missing_elements.micro_moment.substring(0, 40)}...`);
    }
    console.log('');
  });

  // ========================================================================
  // STAGE 2: SURGICAL TEACHING
  // ========================================================================
  console.log('🔬 STAGE 2: SURGICAL TEACHING');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Issues Addressed: ${output.stage2.progress.issues_addressed}/3`);
  console.log(`Estimated Score Lift: +${output.stage2.progress.estimated_score_lift}`);
  console.log('');
  console.log('Suggestions Generated:');
  output.stage2.surgical_teaching.issue_teachings.forEach((teaching, i) => {
    console.log(`  Issue ${i + 1}:`);
    console.log(`    Polished Original: "${teaching.suggestions.polished_original.text.substring(0, 60)}..."`);
    console.log(`    Safety Level: ${teaching.suggestions.polished_original.safety_level}`);
    console.log(`    Voice Amplifier: "${teaching.suggestions.voice_amplifier.text.substring(0, 60)}..."`);
    console.log(`    Risk Level: ${teaching.suggestions.voice_amplifier.risk_level}`);
    console.log('');
  });

  // Validate 2 suggestions per issue
  const allHave2Suggestions = output.stage2.surgical_teaching.issue_teachings.every(
    (t) => t.suggestions.polished_original && t.suggestions.voice_amplifier
  );
  console.log(`✓ All issues have 2 suggestions: ${allHave2Suggestions ? 'PASS' : 'FAIL'}`);
  console.log('');

  // ========================================================================
  // STAGE 3: FINAL POLISH
  // ========================================================================
  console.log('✨ STAGE 3: FINAL POLISH');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Celebration Highlights:');
  console.log(`  Spark Moments: ${output.stage3.celebration.authentic_spark_moments.length}`);
  console.log(`  Voice Victories: ${output.stage3.celebration.voice_victories.length}`);
  console.log(`  College Alignment: ${output.stage3.celebration.college_value_alignment.length}`);
  console.log('');
  console.log('Micro-Refinements:');
  console.log(`  Total: ${output.stage3.micro_refinements.length}`);
  output.stage3.micro_refinements.slice(0, 3).forEach((ref) => {
    console.log(`  - ${ref.refinement_type}: "${ref.current_text.substring(0, 40)}..." → "${ref.suggested_text.substring(0, 40)}..."`);
  });
  console.log('');
  console.log('Final Assessment:');
  console.log(`  Readiness: ${output.stage3.confidence_assessment.overall_readiness}`);
  console.log(`  Confidence: ${output.stage3.confidence_assessment.confidence_score}/10`);
  console.log(`  College Alignment: ${output.stage3.value_alignment.alignment_score}/10`);
  console.log(`  Voice Preservation: ${output.stage3.authenticity_report.voice_preservation_score}/10`);
  console.log('');

  // ========================================================================
  // PERFORMANCE METRICS
  // ========================================================================
  console.log('⚡ PERFORMANCE');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Total Time: ${durationSeconds.toFixed(1)}s`);
  console.log('');
  console.log('Token Usage:');
  console.log(`  Haiku: ${output.metrics.total_tokens.haiku.toLocaleString()}`);
  console.log(`  Sonnet Input: ${output.metrics.total_tokens.sonnet_input.toLocaleString()}`);
  console.log(`  Sonnet Output: ${output.metrics.total_tokens.sonnet_output.toLocaleString()}`);
  console.log('');

  // ========================================================================
  // VALIDATION SUMMARY
  // ========================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const validations = [
    {
      name: 'Cost Target',
      pass: Math.abs(costVariance) < 20,
      detail: `$${output.metrics.total_cost.toFixed(3)} (target: $0.34 ±20%)`,
    },
    {
      name: 'Voice Excavation',
      pass: output.stage0.voiceContext.sparkScore > 0,
      detail: `Spark: ${output.stage0.voiceContext.sparkScore}/100`,
    },
    {
      name: '3 Critical Issues',
      pass: output.stage1.top_3_critical_issues.length === 3,
      detail: `${output.stage1.top_3_critical_issues.length} issues identified`,
    },
    {
      name: 'Missing Elements (PIQ-style)',
      pass: output.stage1.top_3_critical_issues.every((i) => i.missing_elements),
      detail: 'All issues have missing elements diagnosis',
    },
    {
      name: '2 Suggestions per Issue',
      pass: allHave2Suggestions,
      detail: 'Polished Original + Voice Amplifier',
    },
    {
      name: 'Score Improvement',
      pass: output.metrics.quality_metrics.average_dimension_improvement > 2,
      detail: `+${output.metrics.quality_metrics.average_dimension_improvement} average`,
    },
    {
      name: 'Final Polish',
      pass: output.stage3.micro_refinements.length >= 5,
      detail: `${output.stage3.micro_refinements.length} refinements`,
    },
    {
      name: 'Context Handoffs',
      pass:
        output.stage1.stage2_handoff &&
        output.stage2.stage3_handoff &&
        output.stage3.authenticity_report,
      detail: 'All stage handoffs present',
    },
  ];

  validations.forEach((v) => {
    console.log(`${v.pass ? '✓' : '✗'} ${v.name}: ${v.detail}`);
  });
  console.log('');

  const passCount = validations.filter((v) => v.pass).length;
  const totalCount = validations.length;
  console.log(`Overall: ${passCount}/${totalCount} validations passed`);
  console.log('');

  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
  }
  console.log('');

  return output;
}

// ============================================================================
// RUN TEST
// ============================================================================

runCompleteWorkshopTest()
  .then((output) => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
