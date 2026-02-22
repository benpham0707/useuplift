/**
 * Stage 2 Reliability Test
 *
 * Tests the conditional teaching service to ensure it works reliably
 * without falling back to heuristics.
 */

import './utils/loadEnv';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           STAGE 2 CONDITIONAL TEACHING TEST                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

import {
  stage0StoryDetectionService,
  stage1ContextAwareAnalysisService,
  stage2ConditionalTeachingService,
} from '../src/services/portfolioStrategy/services/activityWorkshop';
import { ActivityWorkshopSessionInput } from '../src/services/portfolioStrategy/services/activityWorkshop/types';

// Simpler test case with 2 activities
const testInput: ActivityWorkshopSessionInput = {
  activities: [
    {
      id: 'robotics',
      title: 'Robotics Club',
      organization: 'High School',
      role: 'Member',
      description: 'Built robots for competitions. Worked on programming and design.',
      category: 'school_activity',
      hoursPerWeek: 8,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
    },
    {
      id: 'tutoring',
      title: 'Math Tutoring',
      organization: 'Community Center',
      role: 'Volunteer Tutor',
      description: 'Helped middle school students with math homework. Tutored 2-3 students weekly.',
      category: 'volunteer',
      hoursPerWeek: 4,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: [10, 11],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    gradeLevel: 12,
  },
};

async function runTest() {
  console.log(`Testing with ${testInput.activities.length} activities...\n`);

  const startTime = Date.now();

  try {
    // Stage 0: Story Detection
    console.log('Stage 0: Detecting story...');
    const storyContext = await stage0StoryDetectionService.detectStory(testInput);
    console.log(`  ✓ Archetype: ${storyContext.narrativeIdentity.archetype}`);
    console.log(`  ✓ Story: ${storyContext.narrativeIdentity.storyEssence.substring(0, 60)}...`);
    console.log('');

    // Stage 1: Analysis
    console.log('Stage 1: Running analysis...');
    const analysisContext = await stage1ContextAwareAnalysisService.analyze(testInput, storyContext);
    console.log(`  ✓ Tier Distribution: T1=${analysisContext.tierDistribution.tier1}, T2=${analysisContext.tierDistribution.tier2}, T3=${analysisContext.tierDistribution.tier3}`);
    console.log(`  ✓ Deep candidates: ${analysisContext.teachingCandidates.deepTeachingIds.length}`);
    console.log(`  ✓ Medium candidates: ${analysisContext.teachingCandidates.mediumTeachingIds.length}`);
    console.log('');

    // Stage 2: Teaching (the focus of this test)
    console.log('Stage 2: Running conditional teaching...');
    console.log('  This is the reliability test - should NOT fall back to heuristics');
    console.log('');

    const teachingStartTime = Date.now();
    const teachingContext = await stage2ConditionalTeachingService.teach(
      testInput,
      storyContext,
      analysisContext
    );
    const teachingDuration = Date.now() - teachingStartTime;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('STAGE 2 RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Duration: ${teachingDuration}ms (${(teachingDuration / 1000).toFixed(1)}s)`);
    console.log(`Activities taught: ${teachingContext.teachingDelivered.length}`);
    console.log(`Quick encouragements: ${teachingContext.quickEncouragements.length}`);
    console.log(`Skipped: ${teachingContext.skippedActivities.length}`);
    console.log('');

    // Check teaching quality
    console.log('QUALITY METRICS:');
    console.log(`  Citations: ${teachingContext.qualityMetrics.citationsIncluded}`);
    console.log(`  Examples: ${teachingContext.qualityMetrics.examplesIncluded}`);
    console.log(`  Celebrations: ${teachingContext.qualityMetrics.celebrationFirst ? 'Yes' : 'No'}`);
    console.log(`  Average Depth: ${teachingContext.qualityMetrics.averageDepth.toFixed(2)}`);
    console.log(`  Knowledge Application: ${teachingContext.qualityMetrics.knowledgeApplicationScore || 'N/A'}`);
    console.log('');

    // Validate teachings
    let isLLMBased = false;
    for (const teaching of teachingContext.teachingDelivered) {
      console.log(`TEACHING: ${teaching.activityId} (${teaching.teachingDepth})`);

      // Check if celebration exists (indicates LLM teaching, not fallback)
      if (teaching.teaching.celebration?.headline && teaching.teaching.celebration.headline.length > 20) {
        console.log(`  ✓ Celebration: "${teaching.teaching.celebration.headline.substring(0, 60)}..."`);
        isLLMBased = true;
      } else {
        console.log(`  ⚠ Celebration: Missing or minimal`);
      }

      // Check tier explanation
      if (teaching.teaching.tierExplanation?.explanation?.text?.length > 50) {
        console.log(`  ✓ Tier explanation: Present (${teaching.teaching.tierExplanation.explanation.text.length} chars)`);
        isLLMBased = true;
      } else {
        console.log(`  ⚠ Tier explanation: Missing or minimal`);
      }

      // Check improvement teaching
      if (teaching.teaching.improvementTeaching?.length > 0) {
        const firstImprovement = teaching.teaching.improvementTeaching[0];
        console.log(`  ✓ Improvements: ${teaching.teaching.improvementTeaching.length} issues addressed`);

        // Check for before/after examples
        if (firstImprovement.exampleBefore && firstImprovement.exampleAfter) {
          console.log(`    Before: "${firstImprovement.exampleBefore.substring(0, 40)}..."`);
          console.log(`    After: "${firstImprovement.exampleAfter.substring(0, 40)}..."`);
          isLLMBased = true;
        }
      } else {
        console.log(`  ⚠ Improvements: None`);
      }

      // Check description optimization
      if (teaching.teaching.descriptionOptimization?.optimizedDescription) {
        const opt = teaching.teaching.descriptionOptimization;
        console.log(`  ✓ Description optimized: ${opt.characterCount || opt.optimizedDescription.length} chars`);
      }

      console.log('');
    }

    // Final assessment
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════════════');

    const totalTime = Date.now() - startTime;
    console.log(`Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);

    if (isLLMBased && teachingContext.teachingDelivered.length > 0) {
      console.log('');
      console.log('✅ SUCCESS: Stage 2 produced LLM-based teaching!');
      console.log('   Teaching is substantive, not fallback heuristics.');
    } else {
      console.log('');
      console.log('⚠️  WARNING: Stage 2 may have used fallback teaching');
      console.log('   Check the logs above for quality indicators.');
    }

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTest()
  .then(() => {
    console.log('');
    console.log('Test complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
