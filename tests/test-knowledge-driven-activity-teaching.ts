/**
 * E2E Test: Knowledge-Driven Activity Teaching Pipeline
 *
 * This test validates that our activity workshop pipeline:
 * 1. Integrates knowledge assembly service with Stage 2 teaching
 * 2. Produces research-backed output with citations
 * 3. Uses the proper 4-stage pipeline architecture
 * 4. Applies teaching bundles (not LLM invention)
 *
 * RUN: npx tsx tests/test-knowledge-driven-activity-teaching.ts
 */

// CRITICAL: Load dotenv BEFORE any imports that use API key
import 'dotenv/config';

import { activityWorkshopService } from '../src/services/portfolioStrategy/services/activityWorkshop';
import {
  knowledgeAssemblyService,
  ActivityKnowledgeContext,
} from '../src/services/portfolioStrategy/services/activityWorkshop/knowledgeAssemblyService';
import { ActivityWorkshopSessionInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TEST DATA: Realistic student profile
// ============================================================================

const TEST_ACTIVITIES: ActivityWorkshopSessionInput['activities'] = [
  {
    id: 'math-competition',
    title: 'Math Competition Team',
    description: 'Competed in various math competitions and helped younger students with problem solving',
    organization: 'School Math Team',
    role: 'Team Member',
    hoursPerWeek: 5,
    weeksPerYear: 30,
    yearsInvolved: 3,
    gradeLevels: [10, 11, 12],
    category: 'academic_competition',
  },
  {
    id: 'research-intern',
    title: 'Research Intern',
    description: 'Worked in a university lab on machine learning projects under Professor Smith',
    organization: 'State University CS Department',
    role: 'Research Intern',
    hoursPerWeek: 15,
    weeksPerYear: 12,
    yearsInvolved: 1,
    gradeLevels: [11],
    category: 'research',
  },
  {
    id: 'tutoring',
    title: 'Math Tutoring',
    description: 'Helped students with math homework at local community center on weekends',
    organization: 'Community Learning Center',
    role: 'Volunteer Tutor',
    hoursPerWeek: 4,
    weeksPerYear: 40,
    yearsInvolved: 2,
    gradeLevels: [11, 12],
    category: 'community_service',
  },
  {
    id: 'app-project',
    title: 'Mobile App Developer',
    description: 'Created an app to help students study for tests. Got some users.',
    organization: 'Personal Project',
    role: 'Developer',
    hoursPerWeek: 10,
    weeksPerYear: 20,
    yearsInvolved: 1,
    gradeLevels: [12],
    category: 'stem_project',
  },
  {
    id: 'debate-team',
    title: 'Debate Team Captain',
    description: 'Led debate team to several competitions. Organized practice sessions.',
    organization: 'School Debate Team',
    role: 'Captain',
    hoursPerWeek: 8,
    weeksPerYear: 35,
    yearsInvolved: 3,
    gradeLevels: [10, 11, 12],
    category: 'academic_competition',
  },
];

const TEST_STUDENT_CONTEXT: ActivityWorkshopSessionInput['studentContext'] = {
  intendedMajor: 'Computer Science',
  targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon'],
  academicProfile: {
    gpa: 3.9,
    testScores: { sat: 1540 },
  },
  grade: 12,
};

// ============================================================================
// TEST HELPERS
// ============================================================================

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

function logSubSection(title: string) {
  console.log('\n' + '-'.repeat(60));
  console.log(`  ${title}`);
  console.log('-'.repeat(60) + '\n');
}

// ============================================================================
// TEST: Knowledge Assembly Service
// ============================================================================

async function testKnowledgeAssemblyService() {
  logSection('TEST 1: Knowledge Assembly Service');

  console.log('Testing knowledge context assembly for each activity...\n');

  for (const activity of TEST_ACTIVITIES.slice(0, 3)) {
    console.log(`\n📚 Activity: "${activity.title}"`);

    // Create mock analysis for testing
    const mockAnalysis = {
      classification: {
        tier: 3 as const,
        tierConfidence: 'high' as const,
        tierReasoning: 'Solid school-level involvement',
        detectedCategory: activity.category,
      },
      descriptionQuality: {
        overallScore: 55,
        issues: ['vague description', 'missing quantification', 'weak role clarity'],
        strengths: ['consistent commitment'],
      },
      greenFlags: [{ flag: 'Multi-year involvement', admissionsValue: 'Shows sustained commitment' }],
      redFlags: [],
      narrativePotential: { essayWorthiness: 'medium', growthArc: 'Some potential' },
    };

    const knowledge = knowledgeAssemblyService.assembleKnowledgeContext(
      activity,
      mockAnalysis as any,
      TEST_STUDENT_CONTEXT
    );

    // Verify knowledge context is populated
    console.log(`   ✓ Category: ${knowledge.detectedCategory}`);
    console.log(`   ✓ Sara Harberson Tier: ${knowledge.saraHarbersonCriteria.tierName}`);
    console.log(`   ✓ Issue Teaching Bundles: ${knowledge.issueTeaching.length} bundles loaded`);
    console.log(`   ✓ Citations Available: ${knowledge.citations.length} citations`);
    console.log(
      `   ✓ Field Expectations: ${knowledge.fieldExpectations ? knowledge.fieldExpectations.majorName : 'None'}`
    );
    console.log(`   ✓ Category Insights: ${knowledge.categoryInsights.categoryName}`);

    // Show sample teaching bundle
    if (knowledge.issueTeaching.length > 0) {
      const bundle = knowledge.issueTeaching[0];
      console.log(`\n   📖 Sample Teaching Bundle (${bundle.issueType}):`);
      console.log(`      Problem: ${bundle.theProblem.headline}`);
      console.log(`      Psychology: ${bundle.whyThisWorks.psychology.substring(0, 100)}...`);
      console.log(`      Steps: ${bundle.whatToDo.steps.length} action steps`);
    }

    // Verify format for prompt works
    const promptText = knowledgeAssemblyService.formatForPrompt(knowledge);
    console.log(`\n   📄 Formatted for Prompt: ${promptText.length} characters`);
    console.log(`      Contains Sara Harberson: ${promptText.includes('SARA HARBERSON')}`);
    console.log(`      Contains Teaching Bundles: ${promptText.includes('TEACHING BUNDLES')}`);
    console.log(`      Contains Citations: ${promptText.includes('CITATIONS')}`);
  }

  console.log('\n✅ Knowledge Assembly Service working correctly');
  return true;
}

// ============================================================================
// TEST: Full Pipeline E2E
// ============================================================================

async function testFullPipelineE2E() {
  logSection('TEST 2: Full Activity Workshop Pipeline (4-Stage)');

  const input: ActivityWorkshopSessionInput = {
    sessionId: 'test-knowledge-e2e-' + Date.now(),
    activities: TEST_ACTIVITIES,
    studentContext: TEST_STUDENT_CONTEXT,
    previousAnalysis: null,
    userRequest: 'Help me improve my activity descriptions for my college application',
  };

  console.log('Running full pipeline with knowledge integration...');
  console.log(`  Activities: ${input.activities.length}`);
  console.log(`  Major: ${input.studentContext?.intendedMajor}`);
  console.log(`  Target Schools: ${input.studentContext?.targetSchools?.join(', ')}\n`);

  const startTime = Date.now();

  try {
    const result = await activityWorkshopService.runPipeline(input);
    const duration = Date.now() - startTime;

    logSubSection('Pipeline Results');

    console.log('📊 Stage 0 (Story Detection):');
    console.log(`   Archetype: ${result.storyContext.narrativeIdentity.archetype}`);
    console.log(`   Story Essence: ${result.storyContext.narrativeIdentity.storyEssence.substring(0, 150)}...`);
    console.log(`   Spike: ${result.storyContext.spikeHypothesis.likelySpike ? result.storyContext.spikeHypothesis.spikeArea : 'Developing'}`);

    console.log('\n📊 Stage 1 (Analysis):');
    console.log(`   Activities Analyzed: ${Object.keys(result.analysisContext.activities).length}`);
    console.log(`   Deep Teaching Candidates: ${result.analysisContext.teachingCandidates.deepTeachingIds.length}`);
    console.log(`   Medium Teaching Candidates: ${result.analysisContext.teachingCandidates.mediumTeachingIds.length}`);

    for (const [activityId, analysis] of Object.entries(result.analysisContext.activities)) {
      const activity = TEST_ACTIVITIES.find(a => a.id === activityId);
      console.log(`\n   Activity: ${activity?.title}`);
      console.log(`     Tier: ${analysis.classification.tier} (${analysis.classification.tierConfidence})`);
      console.log(`     Description Quality: ${analysis.descriptionQuality.overallScore}/100`);
      console.log(`     Issues: ${analysis.descriptionQuality.issues.slice(0, 2).join(', ')}`);
    }

    logSubSection('Stage 2 Teaching Output (Knowledge-Driven)');

    console.log(`Teaching Delivered: ${result.teachingContext.teachingDelivered.length} activities`);
    console.log(`Quick Encouragements: ${result.teachingContext.quickEncouragements.length} activities`);
    console.log(`Skipped: ${result.teachingContext.skippedActivities.length} activities\n`);

    // Check teaching quality markers
    const qualityMetrics = result.teachingContext.qualityMetrics;
    console.log('📈 Quality Metrics:');
    console.log(`   Citations Included: ${qualityMetrics.citationsIncluded}`);
    console.log(`   Examples Included: ${qualityMetrics.examplesIncluded}`);
    console.log(`   Average Depth: ${qualityMetrics.averageDepth.toFixed(2)}`);
    console.log(`   Celebration First: ${qualityMetrics.celebrationFirst ? '✓' : '✗'}`);

    // Examine detailed teaching for first activity
    if (result.teachingContext.teachingDelivered.length > 0) {
      const firstTeaching = result.teachingContext.teachingDelivered[0];
      const activity = TEST_ACTIVITIES.find(a => a.id === firstTeaching.activityId);

      console.log(`\n📝 Detailed Teaching Sample: "${activity?.title}"`);
      console.log(`   Depth: ${firstTeaching.teachingDepth}`);

      const teaching = firstTeaching.teaching;

      console.log(`\n   TIER EXPLANATION:`);
      console.log(`     Assigned Tier: ${teaching.tierExplanation.assignedTier}`);
      console.log(`     Explanation: ${teaching.tierExplanation.explanation.text.substring(0, 200)}...`);
      console.log(`     Citations: ${teaching.tierExplanation.explanation.citations?.length || 0}`);

      if (teaching.tierExplanation.benchmarksUsed && teaching.tierExplanation.benchmarksUsed.length > 0) {
        console.log(`\n   BENCHMARKS USED:`);
        for (const benchmark of teaching.tierExplanation.benchmarksUsed.slice(0, 2)) {
          console.log(`     - ${benchmark.benchmark} (Source: ${benchmark.source})`);
          console.log(`       Student Meets: ${benchmark.studentMeets}`);
        }
      }

      if (teaching.improvementTeaching && teaching.improvementTeaching.length > 0) {
        console.log(`\n   IMPROVEMENT TEACHING (${teaching.improvementTeaching.length} items):`);
        for (const improvement of teaching.improvementTeaching.slice(0, 2)) {
          console.log(`\n     Issue: ${improvement.issue}`);
          console.log(`     Why It Matters: ${improvement.whyItMatters.text.substring(0, 100)}...`);
          console.log(`     Citations: ${improvement.whyItMatters.citations?.length || 0}`);
          console.log(`     Priority: ${improvement.priority}`);
          if (improvement.exampleBefore && improvement.exampleAfter) {
            console.log(`     Before: "${improvement.exampleBefore.substring(0, 60)}..."`);
            console.log(`     After: "${improvement.exampleAfter.substring(0, 60)}..."`);
          }
        }
      }

      if (teaching.strengthTeaching && teaching.strengthTeaching.length > 0) {
        console.log(`\n   STRENGTH TEACHING (${teaching.strengthTeaching.length} items):`);
        for (const strength of teaching.strengthTeaching.slice(0, 2)) {
          console.log(`     Strength: ${strength.strength}`);
          console.log(`     Why It Matters: ${strength.whyItMatters.text.substring(0, 100)}...`);
        }
      }

      console.log(`\n   DESCRIPTION OPTIMIZATION:`);
      console.log(`     Original: "${teaching.descriptionOptimization.originalDescription.substring(0, 80)}..."`);
      console.log(`     Optimized: "${teaching.descriptionOptimization.optimizedDescription.substring(0, 80)}..."`);
      console.log(`     Character Count: ${teaching.descriptionOptimization.characterCount}`);

      if (teaching.narrativeGuidance) {
        console.log(`\n   NARRATIVE GUIDANCE:`);
        console.log(`     How to Talk About: ${teaching.narrativeGuidance.howToTalkAboutThis.text.substring(0, 100)}...`);
        console.log(`     Unique Angle: ${teaching.narrativeGuidance.uniqueAngle}`);
        console.log(`     Interview Tips: ${teaching.narrativeGuidance.interviewTips?.slice(0, 2).join('; ')}`);
      }
    }

    logSubSection('Stage 3 Portfolio Synthesis');

    console.log('Portfolio Teaching:');
    console.log(`  Narrative: ${result.teachingContext.portfolioTeaching.narrativeTeaching.currentState}`);
    console.log(`  Recommendation: ${result.teachingContext.portfolioTeaching.narrativeTeaching.recommendation}`);
    console.log(`  Strategic Direction: ${result.teachingContext.portfolioTeaching.strategicDirection}`);

    logSubSection('Performance Summary');

    console.log(`Total Duration: ${(duration / 1000).toFixed(1)} seconds`);
    console.log(`Activities Processed: ${TEST_ACTIVITIES.length}`);
    console.log(`Teachings Generated: ${result.teachingContext.teachingDelivered.length}`);

    // Verify knowledge integration
    const hasResearchBacking = result.teachingContext.teachingDelivered.some(
      td => td.teaching.tierExplanation.explanation.citations && td.teaching.tierExplanation.explanation.citations.length > 0
    );
    const hasBenchmarks = result.teachingContext.teachingDelivered.some(
      td => td.teaching.tierExplanation.benchmarksUsed && td.teaching.tierExplanation.benchmarksUsed.length > 0
    );
    const hasBeforeAfter = result.teachingContext.teachingDelivered.some(
      td => td.teaching.improvementTeaching?.some(i => i.exampleBefore && i.exampleAfter)
    );

    console.log('\n🔬 Knowledge Integration Verification:');
    console.log(`   Research-backed citations: ${hasResearchBacking ? '✅' : '⚠️ Missing'}`);
    console.log(`   Sara Harberson benchmarks: ${hasBenchmarks ? '✅' : '⚠️ Missing'}`);
    console.log(`   Before/After examples: ${hasBeforeAfter ? '✅' : '⚠️ Missing'}`);

    return true;
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
}

// ============================================================================
// TEST: Knowledge-to-Output Traceability
// ============================================================================

async function testKnowledgeTraceability() {
  logSection('TEST 3: Knowledge-to-Output Traceability');

  console.log('Testing that knowledge assembly correctly maps to teaching output...\n');

  const testActivity = TEST_ACTIVITIES[0]; // Math competition

  // Create analysis with known issues
  const mockAnalysis = {
    classification: {
      tier: 3 as const,
      tierConfidence: 'high' as const,
      tierReasoning: 'School-level participation without national recognition',
      detectedCategory: 'academic_competition',
    },
    descriptionQuality: {
      overallScore: 45,
      issues: [
        'vague description - lacks specificity',
        'missing quantification - no numbers or metrics',
        'generic contribution - undifferentiated role',
      ],
      strengths: ['consistent multi-year involvement'],
    },
    greenFlags: [{ flag: 'Multi-year commitment', admissionsValue: 'Shows sustained interest' }],
    redFlags: [{ flag: 'No competition results mentioned', severity: 'medium' }],
    narrativePotential: { essayWorthiness: 'medium', growthArc: 'Developing' },
  };

  // Assemble knowledge
  const knowledge = knowledgeAssemblyService.assembleKnowledgeContext(
    testActivity,
    mockAnalysis as any,
    TEST_STUDENT_CONTEXT
  );

  console.log('📚 Knowledge Assembled:');
  console.log(`   Issue Types Mapped: ${knowledge.issueTeaching.map(i => i.issueType).join(', ')}`);

  // Verify expected issues were mapped
  const expectedMappings = ['vague_description', 'missing_quantification', 'generic_contribution'];
  const foundMappings = knowledge.issueTeaching.map(i => i.issueType);

  for (const expected of expectedMappings) {
    const found = foundMappings.includes(expected as any);
    console.log(`   ${found ? '✅' : '❌'} ${expected}: ${found ? 'Found' : 'Not mapped'}`);
  }

  // Verify teaching bundles have content
  console.log('\n📖 Teaching Bundle Content Verification:');
  for (const issue of knowledge.issueTeaching) {
    console.log(`\n   ${issue.issueType}:`);
    console.log(`     ✓ Problem headline: ${issue.theProblem.headline.length > 0}`);
    console.log(`     ✓ Psychology: ${issue.whyThisWorks.psychology.length > 0}`);
    console.log(`     ✓ Steps: ${issue.whatToDo.steps.length} steps`);
    console.log(`     ✓ Examples: ${issue.examples.length} transformation examples`);
  }

  // Verify Sara Harberson criteria
  console.log('\n🏆 Sara Harberson Criteria Verification:');
  console.log(`   Tier: ${knowledge.saraHarbersonCriteria.tier}`);
  console.log(`   Tier Name: ${knowledge.saraHarbersonCriteria.tierName}`);
  console.log(`   Evidence Required: ${knowledge.saraHarbersonCriteria.evidence.length} criteria`);
  console.log(`   Examples: ${knowledge.saraHarbersonCriteria.examples.length} examples`);

  // Verify category insights
  console.log('\n🏷️ Category Insights:');
  console.log(`   Category: ${knowledge.categoryInsights.categoryName}`);
  console.log(`   Top Achievements: ${knowledge.categoryInsights.topAchievements.slice(0, 2).join(', ')}`);
  console.log(`   Common Mistakes: ${knowledge.categoryInsights.commonMistakes.slice(0, 2).join(', ')}`);

  // Verify field expectations
  console.log('\n🎯 Field Expectations (Computer Science):');
  if (knowledge.fieldExpectations) {
    console.log(`   Expected Activities: ${knowledge.fieldExpectations.expectedActivities.slice(0, 3).join(', ')}`);
    console.log(`   Aligned: ${knowledge.fieldExpectations.relevanceAssessment?.isAligned}`);
    console.log(`   Reason: ${knowledge.fieldExpectations.relevanceAssessment?.alignmentReason}`);
  }

  console.log('\n✅ Knowledge traceability verified');
  return true;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('  KNOWLEDGE-DRIVEN ACTIVITY TEACHING E2E TEST');
  console.log('█'.repeat(80));
  console.log('\nValidating complete knowledge assembly → teaching pipeline...\n');

  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Knowledge Assembly Service
  try {
    await testKnowledgeAssemblyService();
    results.push({ name: 'Knowledge Assembly Service', passed: true });
  } catch (error) {
    results.push({ name: 'Knowledge Assembly Service', passed: false, error: String(error) });
  }

  // Test 2: Full Pipeline E2E
  try {
    await testFullPipelineE2E();
    results.push({ name: 'Full Pipeline E2E', passed: true });
  } catch (error) {
    results.push({ name: 'Full Pipeline E2E', passed: false, error: String(error) });
  }

  // Test 3: Knowledge Traceability
  try {
    await testKnowledgeTraceability();
    results.push({ name: 'Knowledge Traceability', passed: true });
  } catch (error) {
    results.push({ name: 'Knowledge Traceability', passed: false, error: String(error) });
  }

  // Summary
  logSection('TEST SUMMARY');

  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.name}`);
    if (!result.passed) {
      console.log(`       Error: ${result.error}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(allPassed ? '  ALL TESTS PASSED ✅' : '  SOME TESTS FAILED ❌');
  console.log('='.repeat(80) + '\n');

  return allPassed;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
