/**
 * PASS Pipeline E2E Test
 *
 * Tests the complete multi-stage portfolio analysis pipeline:
 * - Stage 0: Profile Classification
 * - Stage 1: Component Diagnosis (parallel)
 * - Stage 2: Character & Narrative Analysis
 * - Stage 3: School Fit Analysis
 * - Stage 4: Strategic Guidance
 * - Stage 5: Verification
 */

import { PASSOrchestrator } from '../src/services/portfolioStrategy/orchestrator';
import {
  ComprehensiveStudentInput,
  ComprehensiveAnalysisConfig,
  GradeLevel,
} from '../src/services/portfolioStrategy/types';

// ============================================================================
// TEST DATA
// ============================================================================

const createTestStudent = (profile: 'strong' | 'average' | 'developing'): ComprehensiveStudentInput => {
  const baseStudent: ComprehensiveStudentInput = {
    userId: `test_${profile}_${Date.now()}`,
    gradeLevel: 'junior' as GradeLevel,
    intendedMajors: ['computer_science'],
    majorCertainty: 'likely',

    academic: {
      gpa: {
        value: profile === 'strong' ? 3.95 : profile === 'average' ? 3.5 : 3.0,
        scale: 4.0,
        type: 'unweighted',
      },
      courses: [
        { name: 'AP Computer Science A', level: 'AP', grade: 'A' },
        { name: 'AP Calculus BC', level: 'AP', grade: profile === 'strong' ? 'A' : 'B+' },
        { name: 'AP Physics C', level: 'AP', grade: profile === 'strong' ? 'A' : 'B' },
        { name: 'AP English Language', level: 'AP', grade: 'A-' },
        { name: 'Honors Chemistry', level: 'Honors', grade: 'A' },
      ],
      testScores: profile === 'strong' ? {
        sat: { composite: 1560, math: 800, ebrw: 760 },
      } : profile === 'average' ? {
        sat: { composite: 1380, math: 700, ebrw: 680 },
      } : undefined,
      apExams: profile !== 'developing' ? [
        { subject: 'Computer Science A', score: 5 },
        { subject: 'Calculus BC', score: profile === 'strong' ? 5 : 4 },
      ] : undefined,
      schoolContext: {
        type: 'public',
        competitiveness: 'moderate',
      },
    },

    activities: {
      activities: profile === 'strong' ? [
        {
          name: 'Competitive Programming',
          category: 'academic_competition',
          description: 'USACO Gold Division, top 5% nationally',
          yearsInvolved: 3,
          hoursPerWeek: 15,
          leadershipPositions: [{ title: 'Team Captain', years: [11, 12] }],
          achievements: [
            { description: 'USACO Gold Division qualifier' },
            { description: 'State programming competition 2nd place' },
          ],
        },
        {
          name: 'AI Research Project',
          category: 'stem_project',
          description: 'Developed ML model for medical imaging with university mentor',
          yearsInvolved: 2,
          hoursPerWeek: 10,
          leadershipPositions: [{ title: 'Lead Researcher', years: [11] }],
          achievements: [
            { description: 'Presented at state science fair' },
            { description: 'Paper under review at student journal' },
          ],
        },
        {
          name: 'Code Education Nonprofit',
          category: 'community_service',
          description: 'Founded organization teaching coding to underserved middle schoolers',
          yearsInvolved: 2,
          hoursPerWeek: 8,
          leadershipPositions: [{ title: 'Founder & President', years: [10, 11, 12] }],
          achievements: [
            { description: 'Taught 200+ students across 5 schools' },
            { description: 'Recruited 15 volunteer instructors' },
          ],
        },
        {
          name: 'Varsity Tennis',
          category: 'athletics',
          description: 'Starting player on varsity team',
          yearsInvolved: 3,
          hoursPerWeek: 12,
          leadershipPositions: [{ title: 'Team Captain', years: [12] }],
          achievements: [
            { description: 'All-conference honorable mention' },
          ],
        },
      ] : profile === 'average' ? [
        {
          name: 'Computer Science Club',
          category: 'stem_project',
          description: 'Active member, helped organize hackathon',
          yearsInvolved: 2,
          hoursPerWeek: 4,
          leadershipPositions: [{ title: 'Event Coordinator', years: [11] }],
          achievements: [],
        },
        {
          name: 'Volunteer Tutoring',
          category: 'community_service',
          description: 'Weekly math tutoring at community center',
          yearsInvolved: 2,
          hoursPerWeek: 3,
          leadershipPositions: [],
          achievements: [],
        },
        {
          name: 'JV Tennis',
          category: 'athletics',
          description: 'JV team member',
          yearsInvolved: 2,
          hoursPerWeek: 8,
          leadershipPositions: [],
          achievements: [],
        },
      ] : [
        {
          name: 'Gaming Club',
          category: 'cultural_heritage',
          description: 'Member of school gaming club',
          yearsInvolved: 1,
          hoursPerWeek: 3,
          leadershipPositions: [],
          achievements: [],
        },
      ],
    },

    awards: {
      awards: profile === 'strong' ? [
        {
          name: 'USACO Gold Division',
          level: 'national',
          category: 'academic',
        },
        {
          name: 'State Science Fair Finalist',
          level: 'state',
          category: 'academic',
        },
        {
          name: 'National Merit Semifinalist',
          level: 'national',
          category: 'academic',
        },
      ] : profile === 'average' ? [
        {
          name: 'Honor Roll',
          level: 'school',
          category: 'academic',
        },
        {
          name: 'Community Service Award',
          level: 'local',
          category: 'service',
        },
      ] : [],
    },

    personalContext: {
      background: profile === 'strong' ? 'First-generation college student' : undefined,
    },

    goals: {
      targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon', 'Georgia Tech'],
      intendedMajor: 'Computer Science',
      careerInterests: ['Software Engineering', 'AI Research'],
    },
  };

  return baseStudent;
};

const createTestConfig = (targetSchools: string[] = []): ComprehensiveAnalysisConfig => ({
  userId: 'test_user',
  targetSchools,
  forceRefresh: true,
  analysisDepth: 'comprehensive',
  gradeLevel: 'junior',
  intendedMajors: ['computer_science'],
  includeTimeline: true,
  includeProfileAssessment: true,
  includeEssayAnalysis: true,
  includeActivityOptimization: true,
  includeSummerStrategy: true,
  includeMajorGuidance: true,
  includeImpactAnalysis: true,
  includeInterviewPrep: true,
  includeRecommendationStrategy: true,
  includeActionPlan: true,
});

// ============================================================================
// TESTS
// ============================================================================

async function runPipelineTest() {
  console.log('='.repeat(80));
  console.log('PASS PIPELINE E2E TEST');
  console.log('='.repeat(80));

  const orchestrator = new PASSOrchestrator();
  const testCases = [
    { profile: 'strong' as const, expectedArchetype: 'stem_innovator' },
    // { profile: 'average' as const, expectedArchetype: 'well_rounded' },
    // { profile: 'developing' as const, expectedArchetype: 'late_bloomer' },
  ];

  for (const testCase of testCases) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Testing ${testCase.profile.toUpperCase()} student profile`);
    console.log('─'.repeat(80));

    const student = createTestStudent(testCase.profile);
    const config = createTestConfig(['MIT', 'Stanford', 'Carnegie Mellon']);

    try {
      const startTime = Date.now();
      const result = await orchestrator.analyze(student, config);
      const elapsed = Date.now() - startTime;

      console.log('\n📊 ANALYSIS RESULTS:');
      console.log(`  ├── Elapsed Time: ${elapsed}ms`);
      console.log(`  ├── Total Cost: $${(result.analysisMetadata.totalCostCents / 100).toFixed(4)}`);
      console.log(`  ├── Tokens Used: ${result.analysisMetadata.tokensUsed}`);
      console.log(`  ├── Stages Completed: ${result.enhancedMetadata.pipelineStagesCompleted.length}`);
      console.log(`  ├── Data Completeness: ${result.enhancedMetadata.dataCompleteness}%`);
      console.log(`  └── Confidence Level: ${result.enhancedMetadata.confidenceLevel}`);

      if (result.character?.dimensions) {
        console.log('\n🎭 CHARACTER DIMENSIONS:');
        for (const [dimension, score] of Object.entries(result.character.dimensions)) {
          console.log(`  ├── ${dimension}: ${score}/6`);
        }
      }

      if (result.universalScore) {
        console.log(`\n📈 HARVARD EQUIVALENT SCORE: ${result.universalScore.score}/6`);
      }

      if (result.strategicSummary) {
        console.log('\n🎯 STRATEGIC SUMMARY:');
        console.log(`  ├── Positioning: ${result.strategicSummary.positioningStatement || 'N/A'}`);
        console.log(`  ├── Urgency: ${result.strategicSummary.urgencyLevel}`);
        console.log(`  ├── Top Advantages:`);
        result.strategicSummary.topAdvantages?.slice(0, 3).forEach((adv, i) => {
          console.log(`  │   ${i + 1}. ${adv}`);
        });
        console.log(`  └── Development Areas:`);
        result.strategicSummary.topDevelopmentAreas?.slice(0, 3).forEach((area, i) => {
          console.log(`      ${i + 1}. ${area}`);
        });
      }

      if (result.actionPlan?.priorities) {
        console.log('\n📝 TOP ACTION ITEMS:');
        result.actionPlan.priorities.slice(0, 5).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item}`);
        });
      }

      console.log('\n✅ Test PASSED for', testCase.profile, 'profile');
    } catch (error) {
      console.error('\n❌ Test FAILED for', testCase.profile, 'profile');
      console.error('Error:', error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('E2E TEST COMPLETE');
  console.log('='.repeat(80));
}

// ============================================================================
// UNIT TESTS FOR RUBRICS
// ============================================================================

async function runRubricTests() {
  console.log('\n' + '='.repeat(80));
  console.log('RUBRIC UNIT TESTS');
  console.log('='.repeat(80));

  // Test activity tier classification
  const { classifyActivityTier, detectSpike } = await import('../src/services/portfolioStrategy/rubrics');

  console.log('\n📊 Activity Tier Classification Tests:');

  const tier1Activity = classifyActivityTier({
    name: 'USACO Gold Division',
    category: 'academic_competition',
    description: 'Top 5% national competitive programming',
    yearsInvolved: 3,
    hoursPerWeek: 15,
    leadershipRoles: ['Team Captain'],
    achievements: ['Gold Division qualifier', 'State competition winner'],
    recognitionLevel: 'national',
    impactMetrics: {},
  });
  console.log(`  ├── USACO Gold: Tier ${tier1Activity.tier} (expected: 1-2) - ${tier1Activity.tier <= 2 ? '✅' : '❌'}`);

  const tier3Activity = classifyActivityTier({
    name: 'School Debate Club',
    category: 'academic_competition',
    description: 'Active member and competition participant',
    yearsInvolved: 2,
    hoursPerWeek: 5,
    leadershipRoles: ['Secretary'],
    achievements: [],
    recognitionLevel: 'school',
    impactMetrics: {},
  });
  console.log(`  ├── Debate Club: Tier ${tier3Activity.tier} (expected: 3) - ${tier3Activity.tier === 3 ? '✅' : '❌'}`);

  const tier4Activity = classifyActivityTier({
    name: 'Casual Gaming',
    category: 'cultural_heritage',
    description: 'Play video games with friends',
    yearsInvolved: 1,
    hoursPerWeek: 2,
    leadershipRoles: [],
    achievements: [],
    recognitionLevel: 'none',
    impactMetrics: {},
  });
  console.log(`  └── Gaming: Tier ${tier4Activity.tier} (expected: 4) - ${tier4Activity.tier === 4 ? '✅' : '❌'}`);

  // Test spike detection
  console.log('\n📊 Spike Detection Tests:');

  const strongSpikeResult = detectSpike({
    activities: [
      { name: 'USACO', category: 'academic_competition', description: '', yearsInvolved: 3, hoursPerWeek: 15, leadershipRoles: ['Captain'], achievements: ['Gold'], recognitionLevel: 'national', impactMetrics: {} },
      { name: 'Research', category: 'stem_project', description: '', yearsInvolved: 2, hoursPerWeek: 10, leadershipRoles: ['Lead'], achievements: ['Published'], recognitionLevel: 'national', impactMetrics: {} },
      { name: 'Code Ed', category: 'community_service', description: '', yearsInvolved: 2, hoursPerWeek: 8, leadershipRoles: ['Founder'], achievements: [], recognitionLevel: 'local', impactMetrics: { peopleAffected: 200 } },
    ],
    classifications: [
      { tier: 1, confidence: 0.8, primaryReasons: ['National recognition'] },
      { tier: 2, confidence: 0.8, primaryReasons: ['Research'] },
      { tier: 2, confidence: 0.8, primaryReasons: ['Founded org'] },
    ],
  });
  console.log(`  ├── Strong profile spike: ${strongSpikeResult.spikeStrength} (expected: strong/moderate) - ${['strong', 'moderate'].includes(strongSpikeResult.spikeStrength) ? '✅' : '❌'}`);

  // Test Harvard scale calibration
  const { getAdmitProbability, validateScore } = await import('../src/services/portfolioStrategy/rubrics');

  console.log('\n📊 Harvard Scale Calibration Tests:');

  const score2Prob = getAdmitProbability(2.0, 't10');
  console.log(`  ├── Score 2 T10 probability: ${(score2Prob * 100).toFixed(0)}% (expected: ~70%) - ${score2Prob > 0.5 && score2Prob < 0.9 ? '✅' : '❌'}`);

  const score4Prob = getAdmitProbability(4.0, 't10');
  console.log(`  ├── Score 4 T10 probability: ${(score4Prob * 100).toFixed(0)}% (expected: ~15%) - ${score4Prob > 0.05 && score4Prob < 0.3 ? '✅' : '❌'}`);

  const validation = validateScore(2.0, {
    academicLevel: 'exceptional',
    activityLevel: 'tier1',
    characterLevel: 'exceptional',
  });
  console.log(`  └── Score 2 validation: ${validation.isValid ? 'Valid' : 'Invalid'} - ${validation.isValid ? '✅' : '❌'}`);

  console.log('\n✅ Rubric tests complete');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Run rubric unit tests first (no API calls)
    await runRubricTests();

    // Then run full pipeline test (requires API key)
    if (process.env.ANTHROPIC_API_KEY) {
      await runPipelineTest();
    } else {
      console.log('\n⚠️  ANTHROPIC_API_KEY not set - skipping pipeline E2E test');
      console.log('   Set the key to run the full pipeline test');
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
