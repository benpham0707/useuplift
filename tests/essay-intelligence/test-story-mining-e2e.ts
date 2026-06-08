/**
 * Story Mining E2E Test
 *
 * Creates 8 diverse activity profiles, runs the full 3-pass story mining pipeline
 * with 3 target prompts, and validates structural integrity + ranking diversity.
 *
 * Pass criteria: all structural checks + ranking diversity
 *
 * Requires: ANTHROPIC_API_KEY
 */

import { requireApiKey } from '../utils/loadEnv';

requireApiKey('ANTHROPIC_API_KEY');

import { storyMiningService, type StoryMiningActivity, type TargetPrompt } from '../../src/services/storyMining';
import type { StorySeed, StoryMiningResult } from '../../src/services/storyMining/types';

// ============================================================================
// TEST DATA — 8 diverse activity profiles
// ============================================================================

const TEST_ACTIVITIES: StoryMiningActivity[] = [
  {
    id: 'act-athletics',
    name: 'Varsity Cross Country',
    role: 'Team Captain',
    description: 'Led 24-member varsity cross country team to first regional championship in 15 years. Introduced interval training program after researching sports science studies. Organized pre-dawn team runs when our track was under construction. My time dropped from 19:20 to 17:45 over two seasons.',
    category: 'athletics',
    hoursPerWeek: 15,
    weeksPerYear: 40,
    yearsActive: 4,
    achievements: 'Regional Championship, Personal best 17:45 5K',
  },
  {
    id: 'act-research',
    name: 'Computational Biology Research',
    role: 'Student Researcher',
    description: 'Developed Python scripts to analyze protein folding patterns in Dr. Chen\'s lab at the university. My initial approach failed 47 times before I realized I was using the wrong distance metric. Co-authored a poster presented at the state science fair. Spent three summers learning to read scientific papers without falling asleep.',
    category: 'research',
    hoursPerWeek: 12,
    weeksPerYear: 48,
    yearsActive: 3,
    achievements: 'State Science Fair presentation, co-authored poster',
  },
  {
    id: 'act-community',
    name: 'Community Food Bank Coordinator',
    role: 'Volunteer Coordinator',
    description: 'Reorganized volunteer scheduling after noticing 40% of Saturday slots went unfilled. Created a buddy system pairing experienced volunteers with newcomers, which cut training time from 3 weeks to 1 week. Personally drove to 12 rural pickup points that delivery trucks would not reach.',
    category: 'community_service',
    hoursPerWeek: 8,
    weeksPerYear: 50,
    yearsActive: 3,
    achievements: 'Increased volunteer retention 60%, reached 12 new rural communities',
  },
  {
    id: 'act-arts',
    name: 'Jazz Ensemble & Composition',
    role: 'First Trumpet / Composer',
    description: 'Composed 6 original jazz pieces that our school ensemble performed at 3 regional festivals. My piece "Midnight Train Home" was inspired by my grandmother\'s stories of migrating north. During a solo at the fall concert, I forgot my memorized part and improvised something I never could have written. That became my best performance.',
    category: 'arts',
    hoursPerWeek: 10,
    weeksPerYear: 40,
    yearsActive: 4,
    achievements: '3 regional festival performances, 6 original compositions',
  },
  {
    id: 'act-academic-club',
    name: 'Math Olympiad Team',
    role: 'Team Leader',
    description: 'After scoring poorly at my first competition, I spent 6 months studying proof techniques from textbooks meant for graduate students. Built a study group of 8 students who met in the library every Tuesday. We went from placing last at regionals to qualifying for state in one year.',
    category: 'academic_club',
    hoursPerWeek: 6,
    weeksPerYear: 36,
    yearsActive: 3,
    achievements: 'State qualifier, built 8-person study group from zero',
  },
  {
    id: 'act-work',
    name: 'Restaurant Kitchen Staff',
    role: 'Line Cook / Shift Lead',
    description: 'Started washing dishes at 15 to help with family expenses. Learned to manage a 4-person kitchen line during Friday rush — 200+ covers in 3 hours. When the head chef quit without notice, I ran the kitchen for two weeks until a replacement was hired. Those two weeks taught me more about leadership under pressure than any school activity.',
    category: 'work',
    hoursPerWeek: 20,
    weeksPerYear: 52,
    yearsActive: 2,
    achievements: 'Promoted to shift lead, ran kitchen solo for 2 weeks during crisis',
  },
  {
    id: 'act-creative',
    name: 'Documentary Filmmaking',
    role: 'Director / Editor',
    description: 'Produced a 22-minute documentary about the closure of our town\'s only independent bookstore. Interviewed 14 community members over 4 months. The owner cried during her interview and asked me to stop recording. I did, and that conversation — the one I cannot share — changed how I think about storytelling and consent.',
    category: 'creative_project',
    hoursPerWeek: 8,
    weeksPerYear: 30,
    yearsActive: 2,
    achievements: 'Featured at local film festival, 14 interviews conducted',
  },
  {
    id: 'act-tutoring',
    name: 'After-School Math Tutoring',
    role: 'Lead Tutor',
    description: 'Founded an after-school math help center serving 30+ students weekly. Discovered that most struggling students did not lack ability — they lacked a quiet space to think. Moved sessions from the noisy cafeteria to the library and test scores jumped 23%. One student told me it was the first time school made sense.',
    category: 'tutoring',
    hoursPerWeek: 5,
    weeksPerYear: 36,
    yearsActive: 2,
    achievements: '23% test score improvement, 30+ students served weekly',
  },
];

const TARGET_PROMPTS: TargetPrompt[] = [
  {
    id: 'common-app-1',
    promptText: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
  },
  {
    id: 'common-app-5',
    promptText: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.',
  },
  {
    id: 'common-app-7',
    promptText: 'Share an essay on any topic of your choice. It can be one you\'ve already written, one that responds to a different prompt, or one of your own design.',
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestCheck {
  name: string;
  passed: boolean;
  details: string;
}

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Story Mining E2E Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  const checks: TestCheck[] = [];

  console.log('Running 3-pass story mining pipeline...');
  console.log(`  Activities: ${TEST_ACTIVITIES.length}`);
  console.log(`  Target prompts: ${TARGET_PROMPTS.length}\n`);

  const startTime = Date.now();

  let result: StoryMiningResult;
  try {
    result = await storyMiningService.mineStories({
      userId: 'test-user-e2e',
      activities: TEST_ACTIVITIES,
      targetPrompts: TARGET_PROMPTS,
    });
  } catch (error) {
    console.error('❌ Pipeline failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nPipeline complete in ${duration}s`);
  console.log(`  Seeds: ${result.seeds.length}`);
  console.log(`  Clusters: ${result.clusters.length}`);
  console.log(`  Top recommendations: ${result.topRecommendations.length}`);
  console.log(`  Cost: $${result.metadata.cost.toFixed(4)}`);
  console.log(`  Tokens: ${result.metadata.tokensUsed.input} in / ${result.metadata.tokensUsed.output} out`);

  // ============================================================================
  // STRUCTURAL CHECKS
  // ============================================================================

  // Check 1: Seed count in range [8, 12]
  checks.push({
    name: 'Seed count (8-12)',
    passed: result.seeds.length >= 8 && result.seeds.length <= 12,
    details: `${result.seeds.length} seeds`,
  });

  // Check 2: All fields populated on every seed
  const allFieldsPopulated = result.seeds.every(seed =>
    seed.id &&
    seed.moment && seed.moment.length > 10 &&
    seed.sourceActivityIds && seed.sourceActivityIds.length > 0 &&
    seed.emotionalCore && seed.emotionalCore.length > 0 &&
    seed.distinctiveness && typeof seed.distinctiveness.score === 'number' &&
    seed.reflectionDepth && typeof seed.reflectionDepth.score === 'number' &&
    seed.narrativeAngles && seed.narrativeAngles.length >= 2 &&
    seed.suggestedRegister &&
    seed.seedQuotes && seed.seedQuotes.length > 0
  );
  checks.push({
    name: 'All seed fields populated',
    passed: allFieldsPopulated,
    details: allFieldsPopulated ? 'All fields present' : 'Some seeds have missing fields',
  });

  // Check 3: Distinctiveness spread (max - min > 3)
  const distinctScores = result.seeds.map(s => s.distinctiveness.score);
  const distinctMax = Math.max(...distinctScores);
  const distinctMin = Math.min(...distinctScores);
  const distinctSpread = distinctMax - distinctMin;
  checks.push({
    name: 'Distinctiveness spread (max-min > 3)',
    passed: distinctSpread > 3,
    details: `Min: ${distinctMin}, Max: ${distinctMax}, Spread: ${distinctSpread}`,
  });

  // Check 4: Reflection depth spread
  const reflectionScores = result.seeds.map(s => s.reflectionDepth.score);
  const reflectionMax = Math.max(...reflectionScores);
  const reflectionMin = Math.min(...reflectionScores);
  const reflectionSpread = reflectionMax - reflectionMin;
  checks.push({
    name: 'Reflection depth spread (max-min > 2)',
    passed: reflectionSpread > 2,
    details: `Min: ${reflectionMin}, Max: ${reflectionMax}, Spread: ${reflectionSpread}`,
  });

  // Check 5: Source activity coverage (6+ of 8 activities referenced)
  const referencedActivities = new Set<string>();
  for (const seed of result.seeds) {
    for (const actId of seed.sourceActivityIds) {
      referencedActivities.add(actId);
    }
  }
  checks.push({
    name: 'Source coverage (6+ of 8 activities)',
    passed: referencedActivities.size >= 6,
    details: `${referencedActivities.size} activities referenced: ${[...referencedActivities].join(', ')}`,
  });

  // Check 6: Clusters exist
  checks.push({
    name: 'Clusters generated',
    passed: result.clusters.length >= 2,
    details: `${result.clusters.length} clusters: ${result.clusters.map(c => c.theme).join(', ')}`,
  });

  // Check 7: Top recommendations exist for each prompt
  const recommendationPromptIds = new Set(result.topRecommendations.map(r => r.promptId));
  checks.push({
    name: 'Top recommendation per prompt',
    passed: recommendationPromptIds.size === TARGET_PROMPTS.length,
    details: `${recommendationPromptIds.size}/${TARGET_PROMPTS.length} prompts have recommendations`,
  });

  // Check 8: Top-ranked seed differs per prompt
  const recommendedSeedIds = result.topRecommendations.map(r => r.recommendedSeedId);
  const uniqueRecommendedSeeds = new Set(recommendedSeedIds);
  checks.push({
    name: 'Ranking diversity (different top seed per prompt)',
    passed: uniqueRecommendedSeeds.size >= 2, // At least 2 of 3 should differ
    details: `${uniqueRecommendedSeeds.size} unique seeds recommended across ${TARGET_PROMPTS.length} prompts`,
  });

  // Check 9: Narrative angles are genuinely different (not repeated text)
  let anglesAreDiverse = true;
  for (const seed of result.seeds) {
    if (seed.narrativeAngles.length >= 2) {
      const angle1 = seed.narrativeAngles[0].toLowerCase();
      const angle2 = seed.narrativeAngles[1].toLowerCase();
      if (angle1 === angle2) {
        anglesAreDiverse = false;
        break;
      }
    }
  }
  checks.push({
    name: 'Narrative angles are diverse',
    passed: anglesAreDiverse,
    details: anglesAreDiverse ? 'All seeds have distinct angles' : 'Some seeds have duplicate angles',
  });

  // Check 10: Valid emotional registers
  const validRegisters = new Set([
    'energetic_enthusiasm', 'quiet_intensity', 'melancholy_loss',
    'defiant_irreverent', 'wonder_curiosity', 'warmth_connection',
  ]);
  const allRegistersValid = result.seeds.every(s => validRegisters.has(s.suggestedRegister));
  checks.push({
    name: 'Valid emotional registers',
    passed: allRegistersValid,
    details: allRegistersValid
      ? 'All registers valid'
      : `Invalid: ${result.seeds.filter(s => !validRegisters.has(s.suggestedRegister)).map(s => s.suggestedRegister).join(', ')}`,
  });

  // ============================================================================
  // RESULTS
  // ============================================================================

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  for (const check of checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}`);
    console.log(`     ${check.details}`);
    if (check.passed) passed++;
  }

  console.log(`\n  Total: ${passed}/${checks.length} passed`);
  console.log(`  ${passed === checks.length ? '✅ PASS' : '❌ FAIL'} — Story Mining E2E`);

  // Print sample seed for inspection
  if (result.seeds.length > 0) {
    const sample = result.seeds[0];
    console.log('\n  Sample seed (first):');
    console.log(`    Moment: ${sample.moment.substring(0, 100)}...`);
    console.log(`    Emotional core: ${sample.emotionalCore}`);
    console.log(`    Distinctiveness: ${sample.distinctiveness.score}/10`);
    console.log(`    Reflection: ${sample.reflectionDepth.score}/10`);
    console.log(`    Register: ${sample.suggestedRegister}`);
    console.log(`    Angles: ${sample.narrativeAngles.length}`);
  }

  if (passed < checks.length) {
    process.exit(1);
  }
}

// RUN
runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
