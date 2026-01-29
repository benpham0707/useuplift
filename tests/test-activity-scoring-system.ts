/**
 * Test: Activity Scoring System
 *
 * Tests the comprehensive 1-10 scoring system for extracurricular activities:
 * - Description Scoring (how well written)
 * - Activity Scoring (how good objectively)
 * - Portfolio Scoring (overall assessment)
 *
 * Run with: ANTHROPIC_API_KEY="..." npx tsx tests/test-activity-scoring-system.ts
 */

import {
  descriptionScoringService,
  activityScoringService,
  portfolioScoringService,
  scoringOrchestrator,
  DescriptionScoringInput,
  ActivityScoringInput,
  ActivityWithScores,
} from '../src/services/portfolioStrategy/services/activityWorkshop/scoring';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ACTIVITIES = {
  // Tier 1: Exceptional - National level
  tier1Activity: {
    id: 'act-tier1',
    title: 'USA Math Olympiad',
    description: 'Qualified for USAMO (top 500 nationally); developed open-source training platform used by 5,000+ students; published paper on number theory applications in competition math',
    type: 'Academic Competition',
    position: 'Competitor & Platform Creator',
    organization: 'Mathematical Association of America',
    grades: [9, 10, 11, 12],
    hoursPerWeek: 15,
    weeksPerYear: 40,
    honors: 'USAMO Qualifier, AMC 12 Perfect Score',
  },

  // Tier 2: Outstanding - State level
  tier2Activity: {
    id: 'act-tier2',
    title: 'Debate Team',
    description: 'Captain of state championship team; trained 15 novice debaters, 8 now compete varsity; organized school-wide public speaking workshops reaching 200 students',
    type: 'Speech & Debate',
    position: 'Team Captain',
    organization: 'National Speech & Debate Association',
    grades: [10, 11, 12],
    hoursPerWeek: 12,
    weeksPerYear: 35,
    honors: 'State Champion, NSDA Nationals Qualifier',
  },

  // Tier 3: Good - School level
  tier3Activity: {
    id: 'act-tier3',
    title: 'Environmental Club',
    description: 'Vice President of Environmental Club; organized campus recycling program reducing waste 30%; led team of 12 volunteers for weekly park cleanups',
    type: 'Community Service',
    position: 'Vice President',
    organization: 'School Environmental Club',
    grades: [10, 11, 12],
    hoursPerWeek: 5,
    weeksPerYear: 35,
    honors: undefined,
  },

  // Tier 4: Average - Participation
  tier4Activity: {
    id: 'act-tier4',
    title: 'National Honor Society',
    description: 'Member of National Honor Society; participated in tutoring program twice per month; attended community service events',
    type: 'Honor Society',
    position: 'Member',
    organization: 'NHS',
    grades: [11, 12],
    hoursPerWeek: 2,
    weeksPerYear: 30,
    honors: undefined,
  },

  // Poor description but potentially good activity
  poorDescriptionActivity: {
    id: 'act-poor-desc',
    title: 'Robotics Club',
    description: 'Helped with building robots and stuff. Did some programming. Went to competitions.',
    type: 'STEM',
    position: 'Team Member',
    organization: 'School Robotics',
    grades: [9, 10, 11],
    hoursPerWeek: 10,
    weeksPerYear: 30,
    honors: undefined,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printDescriptionScore(score: Awaited<ReturnType<typeof descriptionScoringService.scoreDescription>>) {
  if (!score.success || !score.score) {
    console.log('❌ Scoring failed:', score.error);
    return;
  }

  const s = score.score;
  console.log('\n📝 DESCRIPTION SCORE:', s.total, '/10');
  console.log('─'.repeat(50));
  console.log('Breakdown:');
  console.log(`  • Specificity:       ${s.breakdown.specificity.score}/2 - ${s.breakdown.specificity.rationale}`);
  console.log(`  • Impact Clarity:    ${s.breakdown.impactClarity.score}/2 - ${s.breakdown.impactClarity.rationale}`);
  console.log(`  • Action Language:   ${s.breakdown.actionLanguage.score}/2 - ${s.breakdown.actionLanguage.rationale}`);
  console.log(`  • Quantification:    ${s.breakdown.quantification.score}/2 - ${s.breakdown.quantification.rationale}`);
  console.log(`  • Authenticity:      ${s.breakdown.authenticityVoice.score}/2 - ${s.breakdown.authenticityVoice.rationale}`);
  console.log('\nStrengths:', s.strengths.join(', ') || 'None identified');
  console.log('Improvements:', s.improvements.join(', ') || 'None needed');
  console.log('Rationale:', s.overallRationale);
  if (s.suggestedRewrite) {
    console.log('\n💡 Suggested Rewrite:', s.suggestedRewrite);
  }
}

function printActivityScore(score: Awaited<ReturnType<typeof activityScoringService.scoreActivity>>) {
  if (!score.success || !score.score) {
    console.log('❌ Scoring failed:', score.error);
    return;
  }

  const s = score.score;
  console.log('\n🏆 ACTIVITY SCORE:', s.total, '/10');
  console.log('─'.repeat(50));
  console.log('Breakdown:');
  console.log(`  • Tier (${s.breakdown.tierAssessment.tier}):     ${s.breakdown.tierAssessment.score}/3 - ${s.breakdown.tierAssessment.rationale}`);
  console.log(`  • Recognition (${s.breakdown.recognitionLevel.level}): ${s.breakdown.recognitionLevel.score}/2.5 - ${s.breakdown.recognitionLevel.rationale}`);
  console.log(`  • Leadership (${s.breakdown.leadershipImpact.role}): ${s.breakdown.leadershipImpact.score}/2.5 - ${s.breakdown.leadershipImpact.rationale}`);
  console.log(`  • Commitment (${s.breakdown.commitmentProgression.years}yrs): ${s.breakdown.commitmentProgression.score}/2 - ${s.breakdown.commitmentProgression.rationale}`);
  console.log('\nTier Justification:', s.tierJustification);
  console.log('\nComparison Benchmarks:');
  console.log(`  • Similar to: ${s.comparisonBenchmarks.similarTo}`);
  console.log(`  • Above: ${s.comparisonBenchmarks.above}`);
  console.log(`  • Below: ${s.comparisonBenchmarks.below}`);
  console.log('\nImprovement Paths:', s.improvementPaths.join('; ') || 'None identified');
}

// ============================================================================
// TESTS
// ============================================================================

async function testDescriptionScoring() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Description Scoring');
  console.log('='.repeat(60));

  // Test Tier 1 description
  console.log('\n🔹 Testing Tier 1 (USAMO) Description...');
  const tier1Desc = await descriptionScoringService.scoreDescription({
    description: TEST_ACTIVITIES.tier1Activity.description,
    activityTitle: TEST_ACTIVITIES.tier1Activity.title,
    activityType: TEST_ACTIVITIES.tier1Activity.type,
    position: TEST_ACTIVITIES.tier1Activity.position,
  });
  printDescriptionScore(tier1Desc);

  // Test poor description
  console.log('\n🔹 Testing Poor Description (Robotics)...');
  const poorDesc = await descriptionScoringService.scoreDescription({
    description: TEST_ACTIVITIES.poorDescriptionActivity.description,
    activityTitle: TEST_ACTIVITIES.poorDescriptionActivity.title,
    activityType: TEST_ACTIVITIES.poorDescriptionActivity.type,
    position: TEST_ACTIVITIES.poorDescriptionActivity.position,
  });
  printDescriptionScore(poorDesc);

  return { tier1Desc, poorDesc };
}

async function testActivityScoring() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Activity Scoring');
  console.log('='.repeat(60));

  // Test Tier 1 activity
  console.log('\n🔹 Testing Tier 1 Activity (USAMO)...');
  const tier1Act = await activityScoringService.scoreActivity({
    title: TEST_ACTIVITIES.tier1Activity.title,
    description: TEST_ACTIVITIES.tier1Activity.description,
    type: TEST_ACTIVITIES.tier1Activity.type,
    position: TEST_ACTIVITIES.tier1Activity.position,
    organization: TEST_ACTIVITIES.tier1Activity.organization,
    grades: TEST_ACTIVITIES.tier1Activity.grades,
    hoursPerWeek: TEST_ACTIVITIES.tier1Activity.hoursPerWeek,
    weeksPerYear: TEST_ACTIVITIES.tier1Activity.weeksPerYear,
    honors: TEST_ACTIVITIES.tier1Activity.honors,
  });
  printActivityScore(tier1Act);

  // Test Tier 3 activity
  console.log('\n🔹 Testing Tier 3 Activity (Environmental Club)...');
  const tier3Act = await activityScoringService.scoreActivity({
    title: TEST_ACTIVITIES.tier3Activity.title,
    description: TEST_ACTIVITIES.tier3Activity.description,
    type: TEST_ACTIVITIES.tier3Activity.type,
    position: TEST_ACTIVITIES.tier3Activity.position,
    organization: TEST_ACTIVITIES.tier3Activity.organization,
    grades: TEST_ACTIVITIES.tier3Activity.grades,
    hoursPerWeek: TEST_ACTIVITIES.tier3Activity.hoursPerWeek,
    weeksPerYear: TEST_ACTIVITIES.tier3Activity.weeksPerYear,
  });
  printActivityScore(tier3Act);

  return { tier1Act, tier3Act };
}

async function testBatchScoring() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Batch Scoring');
  console.log('='.repeat(60));

  const activities = [
    TEST_ACTIVITIES.tier1Activity,
    TEST_ACTIVITIES.tier2Activity,
    TEST_ACTIVITIES.tier3Activity,
    TEST_ACTIVITIES.tier4Activity,
  ];

  // Batch description scoring
  console.log('\n🔹 Batch scoring 4 descriptions...');
  const descInputs: DescriptionScoringInput[] = activities.map(a => ({
    description: a.description,
    activityTitle: a.title,
    activityType: a.type,
    position: a.position,
  }));

  const descResults = await descriptionScoringService.scoreDescriptionsBatch({ activities: descInputs });

  if (descResults.success && descResults.scores) {
    console.log('\nDescription Scores:');
    descResults.scores.forEach((score, i) => {
      console.log(`  ${i + 1}. ${activities[i].title}: ${score.total}/10`);
    });
  }

  // Batch activity scoring
  console.log('\n🔹 Batch scoring 4 activities...');
  const actInputs: ActivityScoringInput[] = activities.map(a => ({
    title: a.title,
    description: a.description,
    type: a.type,
    position: a.position,
    organization: a.organization,
    grades: a.grades,
    hoursPerWeek: a.hoursPerWeek,
    weeksPerYear: a.weeksPerYear,
    honors: a.honors,
    intendedMajor: 'Computer Science',
  }));

  const actResults = await activityScoringService.scoreActivitiesBatch({ activities: actInputs });

  if (actResults.success && actResults.scores) {
    console.log('\nActivity Scores:');
    actResults.scores.forEach((score, i) => {
      console.log(`  ${i + 1}. ${activities[i].title}: ${score.total}/10 (Tier ${score.breakdown.tierAssessment.tier})`);
    });
  }

  return { descResults, actResults };
}

async function testPortfolioScoring() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Portfolio Scoring');
  console.log('='.repeat(60));

  const activities = [
    TEST_ACTIVITIES.tier1Activity,
    TEST_ACTIVITIES.tier2Activity,
    TEST_ACTIVITIES.tier3Activity,
    TEST_ACTIVITIES.tier4Activity,
  ];

  // First get individual scores
  console.log('\n🔹 Getting individual scores first...');

  const descInputs: DescriptionScoringInput[] = activities.map(a => ({
    description: a.description,
    activityTitle: a.title,
    activityType: a.type,
    position: a.position,
  }));

  const actInputs: ActivityScoringInput[] = activities.map(a => ({
    title: a.title,
    description: a.description,
    type: a.type,
    position: a.position,
    grades: a.grades,
    hoursPerWeek: a.hoursPerWeek,
    weeksPerYear: a.weeksPerYear,
    honors: a.honors,
  }));

  const [descResults, actResults] = await Promise.all([
    descriptionScoringService.scoreDescriptionsBatch({ activities: descInputs }),
    activityScoringService.scoreActivitiesBatch({ activities: actInputs }),
  ]);

  if (!descResults.success || !actResults.success || !descResults.scores || !actResults.scores) {
    console.log('❌ Failed to get individual scores');
    return null;
  }

  // Combine for portfolio scoring
  const activitiesWithScores: ActivityWithScores[] = activities.map((a, i) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    position: a.position,
    description: a.description,
    descriptionScore: descResults.scores![i],
    activityScore: actResults.scores![i],
  }));

  console.log('\n🔹 Scoring complete portfolio...');
  const portfolioResult = await portfolioScoringService.scorePortfolio({
    activities: activitiesWithScores,
    studentContext: {
      intendedMajor: 'Computer Science',
      gradeLevel: 12,
    },
  });

  if (portfolioResult.success && portfolioResult.rubric) {
    const r = portfolioResult.rubric;
    console.log('\n📊 PORTFOLIO SCORE:', r.overallScore.total, '/10');
    console.log('Harvard Scale:', r.harvardScale.rating, '- ', r.harvardScale.description);
    console.log('\nBreakdown:');
    console.log(`  • Tier Distribution: ${r.breakdown.tierDistribution.score}/10`);
    console.log(`  • Spike Detection: ${r.breakdown.spikeDetection.score}/10`);
    console.log(`  • Coherence: ${r.breakdown.coherence.score}/10`);
    console.log(`  • Major Alignment: ${r.breakdown.majorAlignment.score}/10`);
    console.log(`  • Presentation: ${r.breakdown.presentationQuality.score}/10`);

    console.log('\nNarrative:');
    console.log(`  Archetype: ${r.narrative.archetype}`);
    console.log(`  Story: ${r.narrative.storyLine}`);
    console.log(`  Pitch: ${r.narrative.twoSentencePitch}`);

    console.log('\nKey Strengths:', r.keyStrengths.join('; '));
    console.log('Key Gaps:', r.keyGaps.join('; '));

    console.log('\nRecommendations:');
    r.prioritizedRecommendations.forEach(rec => {
      console.log(`  ${rec.priority}. ${rec.recommendation} (${rec.effort} effort, ${rec.impact})`);
    });

    console.log('\nActivity Rankings:');
    r.activityScores.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.activityTitle}: ${a.combinedScore.total}/10 (Activity: ${a.activityScore.total}, Desc: ${a.descriptionScore.total})`);
    });
  }

  return portfolioResult;
}

async function testScoringOrchestrator() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Scoring Orchestrator (Full Pipeline)');
  console.log('='.repeat(60));

  const activities = [
    {
      id: TEST_ACTIVITIES.tier1Activity.id,
      title: TEST_ACTIVITIES.tier1Activity.title,
      description: TEST_ACTIVITIES.tier1Activity.description,
      category: 'school_activity' as const,
      role: TEST_ACTIVITIES.tier1Activity.position,
      organization: TEST_ACTIVITIES.tier1Activity.organization,
      hoursPerWeek: TEST_ACTIVITIES.tier1Activity.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITIES.tier1Activity.weeksPerYear,
      gradeLevels: TEST_ACTIVITIES.tier1Activity.grades,
      achievements: [{ title: TEST_ACTIVITIES.tier1Activity.honors! }],
    },
    {
      id: TEST_ACTIVITIES.tier2Activity.id,
      title: TEST_ACTIVITIES.tier2Activity.title,
      description: TEST_ACTIVITIES.tier2Activity.description,
      category: 'school_activity' as const,
      role: TEST_ACTIVITIES.tier2Activity.position,
      organization: TEST_ACTIVITIES.tier2Activity.organization,
      hoursPerWeek: TEST_ACTIVITIES.tier2Activity.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITIES.tier2Activity.weeksPerYear,
      gradeLevels: TEST_ACTIVITIES.tier2Activity.grades,
      achievements: [{ title: TEST_ACTIVITIES.tier2Activity.honors! }],
    },
    {
      id: TEST_ACTIVITIES.tier3Activity.id,
      title: TEST_ACTIVITIES.tier3Activity.title,
      description: TEST_ACTIVITIES.tier3Activity.description,
      category: 'volunteer' as const,
      role: TEST_ACTIVITIES.tier3Activity.position,
      organization: TEST_ACTIVITIES.tier3Activity.organization,
      hoursPerWeek: TEST_ACTIVITIES.tier3Activity.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITIES.tier3Activity.weeksPerYear,
      gradeLevels: TEST_ACTIVITIES.tier3Activity.grades,
    },
    {
      id: TEST_ACTIVITIES.poorDescriptionActivity.id,
      title: TEST_ACTIVITIES.poorDescriptionActivity.title,
      description: TEST_ACTIVITIES.poorDescriptionActivity.description,
      category: 'school_activity' as const,
      role: TEST_ACTIVITIES.poorDescriptionActivity.position,
      organization: TEST_ACTIVITIES.poorDescriptionActivity.organization,
      hoursPerWeek: TEST_ACTIVITIES.poorDescriptionActivity.hoursPerWeek,
      weeksPerYear: TEST_ACTIVITIES.poorDescriptionActivity.weeksPerYear,
      gradeLevels: TEST_ACTIVITIES.poorDescriptionActivity.grades,
    },
  ];

  console.log('\n🔹 Running full scoring pipeline via orchestrator...');
  const result = await scoringOrchestrator.scorePortfolio({
    activities,
    studentContext: {
      intendedMajor: 'Computer Science',
      gradeLevel: 12,
    },
  });

  if (result.success && result.rubric) {
    console.log('\n✅ Orchestrator completed successfully!');

    const summary = scoringOrchestrator.getScoreSummary(result.rubric);
    console.log('\n📊 SUMMARY:');
    console.log(`  Overall: ${summary.overall.score}/10 (${summary.overall.level})`);
    console.log(`  Harvard Scale: ${summary.overall.harvard}`);
    console.log('\n  Activities:');
    summary.activities.forEach(a => {
      console.log(`    • ${a.title}: ${a.combined}/10 (Act: ${a.activity}, Desc: ${a.description})`);
    });
    console.log('\n  Top Strengths:', summary.topStrengths.join('; '));
    console.log('  Areas to Improve:', summary.topImprovements.join('; '));

    if (result.timing) {
      console.log('\n⏱️ Timing:');
      console.log(`  • Descriptions: ${result.timing.descriptionScoringMs}ms`);
      console.log(`  • Activities: ${result.timing.activityScoringMs}ms`);
      console.log(`  • Portfolio: ${result.timing.portfolioScoringMs}ms`);
      console.log(`  • Total: ${result.timing.totalMs}ms`);
    }

    if (result.tokensUsed) {
      const total = result.tokensUsed.total;
      const estimatedCost = (total.input * 0.003 + total.output * 0.015) / 1000; // Sonnet pricing
      console.log('\n💰 Token Usage:');
      console.log(`  • Total: ${total.input} input, ${total.output} output`);
      console.log(`  • Estimated Cost: $${estimatedCost.toFixed(4)}`);
    }
  } else {
    console.log('❌ Orchestrator failed:', result.error);
  }

  return result;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🎯 Activity Scoring System Test Suite');
  console.log('=====================================');
  console.log('Testing the 1-10 scoring rubric system with detailed rationales\n');

  try {
    // Run all tests
    await testDescriptionScoring();
    await testActivityScoring();
    await testBatchScoring();
    await testPortfolioScoring();
    await testScoringOrchestrator();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();
