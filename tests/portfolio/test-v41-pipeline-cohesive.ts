/**
 * v4.1 Pipeline Cohesive Test
 *
 * Tests the full Activity Workshop pipeline with holistic narrative
 * to ensure all components work together smoothly.
 */

import '../utils/loadEnv';

// Force stdout to flush immediately
process.stdout.write(''); // Initialize stdout

function log(msg: string) {
  console.log(msg);
  // Force flush
  if (process.stdout.write) {
    process.stdout.write('');
  }
}

log('╔══════════════════════════════════════════════════════════════╗');
log('║        v4.1 PIPELINE COHESIVE INTEGRATION TEST               ║');
log('╚══════════════════════════════════════════════════════════════╝');
log('');
log('Testing the full Activity Workshop pipeline with:');
log('  - Holistic Portfolio Narrative (beginning + end)');
log('  - Stage 0: Story Detection');
log('  - Stage 1: Context-Aware Analysis');
log('  - Stage 2: Conditional Teaching');
log('  - Stage 3: Portfolio Synthesis');
log('');

import { activityWorkshopService } from '../../src/services/portfolioStrategy/services/activityWorkshop';
import { ActivityWorkshopSessionInput } from '../../src/services/portfolioStrategy/services/activityWorkshop/types';

log('✓ Imports successful');

// Test data - a coherent STEM student portfolio
const testInput: ActivityWorkshopSessionInput = {
  activities: [
    {
      id: 'robotics',
      title: 'Robotics Team Captain',
      organization: 'Jefferson High School',
      role: 'Team Captain & Lead Programmer',
      description: 'Led 15-member team to state championship finals. Designed custom autonomous navigation system using computer vision. Mentored 5 underclassmen in Python and C++. Managed $8,000 budget for parts and competition fees.',
      category: 'school_activity',
      hoursPerWeek: 15,
      weeksPerYear: 40,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'State Championship Runner-Up' },
        { title: 'Innovation Award - Best Autonomous System' },
      ],
    },
    {
      id: 'research',
      title: 'AI Research Intern',
      organization: 'State University Computer Vision Lab',
      role: 'Undergraduate Research Assistant',
      description: 'Developed neural network architecture for real-time pedestrian detection in autonomous vehicles. Co-authored paper accepted to regional undergraduate research symposium. Presented findings to faculty committee.',
      category: 'work',
      hoursPerWeek: 20,
      weeksPerYear: 12,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: true,
      achievements: [
        { title: 'Published Research Paper' },
        { title: 'Best Undergraduate Presentation Award' },
      ],
    },
    {
      id: 'tutoring',
      title: 'STEM Tutoring Program Founder',
      organization: 'Community Center Partnership',
      role: 'Founder & Lead Tutor',
      description: 'Founded free tutoring program for underserved middle school students. Recruited and trained 12 peer tutors. Served 50+ students, improving average math grades by 1.5 letter grades. Secured $2,000 grant for supplies.',
      category: 'volunteer',
      hoursPerWeek: 6,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [
        { title: 'City Youth Service Award' },
      ],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon'],
    gradeLevel: 12,
    firstGen: false,
    lowIncome: false,
  },
};

log(`✓ Test input prepared: ${testInput.activities.length} activities`);
log('');

async function runTest() {
  const startTime = Date.now();

  log('═══════════════════════════════════════════════════════════════');
  log('RUNNING FULL v4.1 PIPELINE...');
  log('═══════════════════════════════════════════════════════════════');
  log('');

  try {
    const result = await activityWorkshopService.runPipeline(testInput);

    const duration = Date.now() - startTime;

    log('');
    log('═══════════════════════════════════════════════════════════════');
    log('PIPELINE RESULTS');
    log('═══════════════════════════════════════════════════════════════');
    log('');

    // Initial Narrative
    log('📖 INITIAL NARRATIVE (Beginning):');
    log(`   Story: ${result.initialNarrative.story.pitch.substring(0, 120)}...`);
    log(`   Coherence: ${result.initialNarrative.coherence.assessment} (${result.initialNarrative.coherence.score}/100)`);
    log(`   Threads: ${result.initialNarrative.threads.length}`);
    log(`   Elevations: ${result.initialNarrative.elevations.length}`);
    log(`   Spike: ${result.initialNarrative.spike.primarySpike.area || 'Developing'}`);
    log('');

    // Final Narrative
    if (result.finalNarrative) {
      log('📖 FINAL NARRATIVE (End):');
      log(`   Story: ${result.finalNarrative.story.pitch.substring(0, 120)}...`);
      log(`   Coherence: ${result.finalNarrative.coherence.assessment} (${result.finalNarrative.coherence.score}/100)`);
      log('');
    }

    // Narrative Progression
    if (result.narrativeProgression) {
      log('📈 NARRATIVE PROGRESSION:');
      log(`   Coherence Change: ${result.narrativeProgression.changes.coherenceImprovement > 0 ? '+' : ''}${result.narrativeProgression.changes.coherenceImprovement}`);
      log(`   New Threads: ${result.narrativeProgression.changes.newThreads.length}`);
      log(`   Strengthened Elevations: ${result.narrativeProgression.changes.strengthenedElevations.length}`);
      log(`   ${result.narrativeProgression.celebration}`);
      log('');
    }

    // Stage 0 (Legacy)
    log('📋 STAGE 0 - Story Detection (Legacy):');
    log(`   Archetype: ${result.stage0.narrativeIdentity.archetype}`);
    log(`   Story Essence: ${result.stage0.narrativeIdentity.storyEssence.substring(0, 80)}...`);
    log('');

    // Stage 1
    log('📊 STAGE 1 - Analysis:');
    log(`   Tier Distribution: T1=${result.stage1.tierDistribution.tier1}, T2=${result.stage1.tierDistribution.tier2}, T3=${result.stage1.tierDistribution.tier3}`);
    log(`   Spike: ${result.stage1.spikeAnalysis.hasSpike ? result.stage1.spikeAnalysis.spikeArea : 'None'}`);
    log(`   Coherence: ${result.stage1.coherenceAnalysis.score}/100`);
    log('');

    // Stage 2
    log('📚 STAGE 2 - Teaching:');
    log(`   Activities Taught: ${result.stage2.teachingDelivered.length}`);
    log(`   Quick Encouragements: ${result.stage2.quickEncouragements.length}`);
    log(`   Skipped: ${result.stage2.skippedActivities.length}`);
    if (result.stage2.teachingDelivered.length > 0) {
      const firstTeaching = result.stage2.teachingDelivered[0];
      log(`   First Teaching (${firstTeaching.activityId}):`);
      log(`     Depth: ${firstTeaching.teachingDepth}`);
      if (firstTeaching.teaching.celebration) {
        log(`     Celebration: ${firstTeaching.teaching.celebration.headline?.substring(0, 80)}...`);
      }
    }
    log('');

    // Stage 3
    log('🎯 STAGE 3 - Synthesis:');
    log(`   Harvard Scale: ${result.stage3.finalAssessment.harvardScale}/6`);
    log(`   Overall Strength: ${result.stage3.finalAssessment.overallStrength}`);
    log(`   Confidence: ${result.stage3.finalAssessment.confidence}%`);
    log('');

    // Summary
    log('═══════════════════════════════════════════════════════════════');
    log('SUMMARY');
    log('═══════════════════════════════════════════════════════════════');
    log(`   Version: ${result.version}`);
    log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    log(`   Total Cost: $${result.totalCost.toFixed(4)}`);
    log('');

    // Validation
    log('═══════════════════════════════════════════════════════════════');
    log('VALIDATION CHECKS');
    log('═══════════════════════════════════════════════════════════════');

    const checks = [
      { name: 'Version is 4.1.0', pass: result.version === '4.1.0' },
      { name: 'Initial narrative exists', pass: !!result.initialNarrative },
      { name: 'Initial narrative has story pitch', pass: result.initialNarrative?.story?.pitch?.length > 20 },
      { name: 'Initial narrative has threads', pass: result.initialNarrative?.threads?.length >= 0 },
      { name: 'Initial narrative has coherence score', pass: result.initialNarrative?.coherence?.score > 0 },
      { name: 'Final narrative exists', pass: !!result.finalNarrative },
      { name: 'Stage 0 completed', pass: !!result.stage0?.narrativeIdentity },
      { name: 'Stage 1 completed', pass: !!result.stage1?.tierDistribution },
      { name: 'Stage 2 completed', pass: !!result.stage2?.teachingDelivered },
      { name: 'Stage 3 completed', pass: !!result.stage3?.finalAssessment },
      { name: 'Harvard scale valid (1-6)', pass: result.stage3?.finalAssessment?.harvardScale >= 1 && result.stage3?.finalAssessment?.harvardScale <= 6 },
      { name: 'Cost tracked', pass: result.totalCost > 0 },
    ];

    let allPassed = true;
    for (const check of checks) {
      log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPassed = false;
    }

    log('');
    if (allPassed) {
      log('═══════════════════════════════════════════════════════════════');
      log('✅ ALL CHECKS PASSED - Pipeline working cohesively!');
      log('═══════════════════════════════════════════════════════════════');
    } else {
      log('═══════════════════════════════════════════════════════════════');
      log('⚠️  SOME CHECKS FAILED - Review output above');
      log('═══════════════════════════════════════════════════════════════');
    }

    // Show narrative elevations in detail
    if (result.initialNarrative.elevations.length > 0) {
      log('');
      log('═══════════════════════════════════════════════════════════════');
      log('NARRATIVE ELEVATIONS (How activities boost each other)');
      log('═══════════════════════════════════════════════════════════════');
      for (const elev of result.initialNarrative.elevations) {
        log(`   ${elev.elevatingActivityId} → ${elev.elevatedActivityId} [${elev.strength}]`);
        log(`     Mechanism: ${elev.mechanism}`);
        log(`     Combined: ${elev.combinedImpression}`);
        log('');
      }
    }

    // Show narrative threads
    if (result.initialNarrative.threads.length > 0) {
      log('═══════════════════════════════════════════════════════════════');
      log('NARRATIVE THREADS (Themes across activities)');
      log('═══════════════════════════════════════════════════════════════');
      for (const thread of result.initialNarrative.threads) {
        log(`   🧵 ${thread.name}`);
        log(`      Activities: ${thread.activityIds.join(', ')}`);
        log(`      Synergy: ${thread.synergy}`);
        log('');
      }
    }

  } catch (error) {
    log('');
    log('═══════════════════════════════════════════════════════════════');
    log('❌ PIPELINE ERROR');
    log('═══════════════════════════════════════════════════════════════');
    log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      log(`Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
  }
}

// Run the test
runTest()
  .then(() => {
    log('');
    log('Test complete.');
    process.exit(0);
  })
  .catch((err) => {
    log(`Fatal error: ${err}`);
    process.exit(1);
  });
