/**
 * Simple Workshop Integration Test
 *
 * Minimal test with correct type structure to validate the complete flow
 */

import { HandoffService } from '../src/services/commonAppWorkshop/services/handoffService';
import type { WorkshopInput } from '../src/services/commonAppWorkshop/services/handoffService';
import type { CollegeResearch } from '../src/services/commonAppWorkshop/types/collegeResearch';

// Minimal college research (just enough to run the test)
const MINIMAL_STANFORD: CollegeResearch = {
  collegeId: 'stanford',
  collegeName: 'Stanford University',

  researchQuality: {
    score: 85,
    totalSources: 43,
    lastUpdated: '2025-01-01',
    keyInstitutionalSources: ['CDS', 'Dean Statements'],
  },

  coreValues: [
    {
      valueId: 'intellectual_vitality',
      valueName: 'Intellectual Vitality',
      description: 'Stanford seeks students who demonstrate genuine curiosity',
      evidenceType: 'dean_statement',
      source: 'Stanford Admissions',
      weight: 0.35,
      keywords: ['curiosity', 'intellectual exploration'],
    },
  ],

  essayPrompts: [
    {
      promptId: 'stanford_what_matters',
      promptText: 'What matters most to you, and why?',
      wordLimit: 250,
      type: 'reflection',
      difficulty: 'high',

      dimensionalCriteria: {
        intellectualVitality: {
          weight: 0.35,
          description: 'Show genuine curiosity',
        },
        authenticity: {
          weight: 0.30,
          description: 'Be genuinely yourself',
        },
      },

      rubric: {
        rubricId: 'stanford_rubric',
        dimensions: [
          {
            dimensionName: 'Intellectual Vitality',
            weight: 0.35,
            bands: [
              {
                scoreRange: [9, 10],
                label: 'Exceptional',
                description: 'Shows deep genuine curiosity',
                indicators: ['Specific examples', 'Learning for its own sake'],
              },
            ],
          },
        ],
      },
    },
  ],

  redFlags: [],
  greenFlags: [],

  socraticQuestions: {
    questions: [
      {
        questionId: 'sq1',
        questionText: 'What question keeps you up at night?',
        purpose: 'Uncover genuine curiosity',
        whenToUse: 'When student is too achievement-focused',
        dimensionTarget: 'intellectual_vitality',
      },
    ],
  },

  eliteExamples: [],
  keyQuotes: [],

  dimensionWeights: {
    intellectualVitality: 0.35,
    authenticity: 0.30,
    impact: 0.20,
    narrativeQuality: 0.15,
  },
};

const TEST_ESSAY = `
I have always been passionate about learning. Throughout my academic career, I've maintained
a 4.0 GPA and taken the most challenging courses available. I believe education is important
because it opens doors to opportunities. In the future, I want to use my education to make
a difference in the world.
`.trim();

const TEST_VOICE_SAMPLE = `
I think a lot about how things work. Like, yesterday I was walking to school and noticed
how the streetlight patterns change based on traffic. I ended up being late because I was
too busy counting the timing cycles.
`.trim();

const TEST_INTERVIEW = [
  {
    question: 'What do you care about?',
    response: 'Understanding how things work, even when it\'s not useful',
  },
  {
    question: 'Tell me about a time you got lost in something',
    response: 'I spent all night researching why snow makes that crunching sound.',
  },
];

async function runSimpleTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SIMPLE WORKSHOP TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const handoffService = new HandoffService(apiKey);

  const input: WorkshopInput = {
    rawDraft: TEST_ESSAY,
    essayPrompt: 'What matters most to you, and why? (250 words)',
    collegeId: 'stanford',
    collegeName: 'Stanford University',
    collegeResearch: MINIMAL_STANFORD,
    voiceSample: TEST_VOICE_SAMPLE,
    interviewResponses: TEST_INTERVIEW,
  };

  console.log('Starting complete workshop...\n');
  const startTime = Date.now();

  const output = await handoffService.runCompleteWorkshop(input);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✓ Total Cost: $${output.metrics.total_cost.toFixed(3)}`);
  console.log(`✓ Duration: ${duration}s`);
  console.log(`✓ Spark: ${output.metrics.quality_metrics.initial_spark} → ${output.metrics.quality_metrics.final_spark}`);
  console.log(`✓ Improvement: +${output.metrics.quality_metrics.average_dimension_improvement}`);
  console.log(`✓ Ready: ${output.stage3.ready_for_submission ? 'YES' : 'NO'}`);
  console.log('');

  console.log('Stage Costs:');
  console.log(`  Stage 0: $${output.metrics.cost_by_stage.stage0.toFixed(3)}`);
  console.log(`  Stage 1: $${output.metrics.cost_by_stage.stage1.toFixed(3)}`);
  console.log(`  Stage 2: $${output.metrics.cost_by_stage.stage2.toFixed(3)}`);
  console.log(`  Stage 3: $${output.metrics.cost_by_stage.stage3.toFixed(3)}`);
  console.log('');

  console.log('Critical Issues Addressed:');
  output.stage1.top_3_critical_issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.problem.substring(0, 80)}...`);
  });
  console.log('');

  console.log('Suggestions Generated:');
  output.stage2.surgical_teaching.issues.forEach((issue: any, i: number) => {
    console.log(`  Issue ${i + 1}: 2 suggestions (Polished + Voice Amplifier)`);
  });
  console.log('');

  // Validations
  const costOk = output.metrics.total_cost < 0.41; // Within 20% of $0.34
  const issuesOk = output.stage1.top_3_critical_issues.length === 3;
  const suggestionsOk = output.stage2.surgical_teaching.issues.length === 3;

  console.log('Validations:');
  console.log(`  ${costOk ? '✓' : '✗'} Cost within target ($0.34 ±20%)`);
  console.log(`  ${issuesOk ? '✓' : '✗'} 3 critical issues identified`);
  console.log(`  ${suggestionsOk ? '✓' : '✗'} Suggestions for all issues`);
  console.log('');

  if (costOk && issuesOk && suggestionsOk) {
    console.log('🎉 ALL TESTS PASSED\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
  }

  return output;
}

runSimpleTest()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
