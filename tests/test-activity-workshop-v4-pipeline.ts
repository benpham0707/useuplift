/**
 * Activity Workshop v4.0 Pipeline Test
 *
 * Comprehensive test of the new 4-stage LLM-powered pipeline:
 * - Stage 0: Story Detection (WHO the student is)
 * - Stage 1: Context-Aware Analysis (WHAT with story context)
 * - Stage 2: Conditional Teaching (teaching what needs it)
 * - Stage 3: Portfolio Synthesis (actionable strategy)
 *
 * Run with:
 * ANTHROPIC_API_KEY="..." npx tsx tests/test-activity-workshop-v4-pipeline.ts
 */

import {
  activityWorkshopService,
  ActivityWorkshopSessionInput,
  ActivityWorkshopPipelineResult,
} from '../src/services/portfolioStrategy/services/activityWorkshop';

// ============================================================================
// TEST DATA: Diverse student profile
// ============================================================================

const TEST_INPUT: ActivityWorkshopSessionInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon'],
    gradeLevel: 12,
    firstGen: true,
    lowIncome: false,
    rural: false,
    internationalStudent: false,
  },
  activities: [
    // TIER 1 CANDIDATE: Strong research with publication
    {
      id: 'act-1',
      title: 'AI Research Assistant',
      organization: 'Stanford AI Lab',
      role: 'Research Intern',
      description: 'Contributed to NLP research project developing novel attention mechanisms. Co-authored paper accepted to ACL conference. Built data pipeline processing 10M+ text samples.',
      category: 'project',
      hoursPerWeek: 15,
      weeksPerYear: 40,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: false,
      achievements: [
        { title: 'ACL Conference Paper Co-author', level: 'international' },
      ],
    },

    // TIER 2 CANDIDATE: Entrepreneurship
    {
      id: 'act-2',
      title: 'Tech Education Startup',
      organization: 'CodeBridge (self-founded)',
      role: 'Founder & CEO',
      description: 'Founded nonprofit teaching coding to underserved students. Grew to 500+ students across 5 schools. Recruited and trained 25 volunteer instructors. Raised $15K in grants.',
      category: 'project',
      hoursPerWeek: 12,
      weeksPerYear: 45,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      isPaid: false,
      achievements: [
        { title: 'Local Hero Award', level: 'local' },
      ],
    },

    // TIER 3 CANDIDATE: Good but could improve
    {
      id: 'act-3',
      title: 'Robotics Club',
      organization: 'Jefferson High School',
      role: 'Programming Lead',
      description: 'Lead programmer for FRC robotics team. Wrote autonomous code and driver controls. Help train new members.',
      category: 'school_activity',
      hoursPerWeek: 10,
      weeksPerYear: 30,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      isPaid: false,
    },

    // TIER 3-4: Needs teaching
    {
      id: 'act-4',
      title: 'Math Tutoring',
      organization: 'Peer Tutoring Program',
      role: 'Volunteer Tutor',
      description: 'Help students with algebra and geometry. Meet once a week after school.',
      category: 'volunteer',
      hoursPerWeek: 3,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: false,
    },

    // TIER 4: Generic participation
    {
      id: 'act-5',
      title: 'National Honor Society',
      organization: 'Jefferson High School',
      role: 'Member',
      description: 'Member of NHS. Participate in community service events.',
      category: 'school_activity',
      hoursPerWeek: 2,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: false,
    },

    // WORK EXPERIENCE: Shows responsibility
    {
      id: 'act-6',
      title: 'Part-Time Software Developer',
      organization: 'Local Tech Company',
      role: 'Junior Developer',
      description: 'Build internal tools and fix bugs. Work with senior developers. Use React and Python.',
      category: 'work',
      hoursPerWeek: 15,
      weeksPerYear: 40,
      yearsInvolved: 1,
      gradeLevels: [12],
      isPaid: true,
    },

    // PASSION PROJECT: Shows authenticity
    {
      id: 'act-7',
      title: 'Open Source Contributor',
      organization: 'GitHub',
      role: 'Contributor',
      description: 'Regular contributor to popular open source projects. Merged 20+ PRs to React ecosystem libraries. Created documentation improvements.',
      category: 'project',
      hoursPerWeek: 5,
      weeksPerYear: 50,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: false,
    },
  ],
};

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runPipelineTest(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ACTIVITY WORKSHOP v4.0 PIPELINE TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // Run the full 4-stage pipeline
    console.log('Running 4-stage pipeline...\n');
    const result: ActivityWorkshopPipelineResult = await activityWorkshopService.runPipeline(TEST_INPUT);

    const totalTime = Date.now() - startTime;

    // ========================================================================
    // STAGE 0 RESULTS
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STAGE 0: STORY DETECTION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Narrative Identity:');
    console.log(`  - Archetype: ${result.stage0.narrativeIdentity.archetype} (${result.stage0.narrativeIdentity.archetypeConfidence}% confidence)`);
    console.log(`  - Primary Theme: ${result.stage0.narrativeIdentity.primaryTheme}`);
    console.log(`  - Story Essence: ${result.stage0.narrativeIdentity.storyEssence}`);

    console.log('\nSpike Hypothesis:');
    console.log(`  - Likely Spike: ${result.stage0.spikeHypothesis.likelySpike}`);
    if (result.stage0.spikeHypothesis.likelySpike) {
      console.log(`  - Area: ${result.stage0.spikeHypothesis.spikeArea}`);
      console.log(`  - Maturity: ${result.stage0.spikeHypothesis.maturity}`);
      console.log(`  - Evidence: ${result.stage0.spikeHypothesis.evidence}`);
    }

    console.log('\nContextual Factors:');
    console.log(`  - Work/Family Obligations: ${result.stage0.contextualFactors.hasWorkFamilyObligations}`);
    console.log(`  - First-Gen Indicators: ${result.stage0.contextualFactors.firstGenIndicators}`);

    console.log('\nActivity Story Roles:');
    for (const role of result.stage0.activityStoryRoles) {
      const activity = TEST_INPUT.activities.find(a => a.id === role.activityId);
      console.log(`  - ${activity?.title}: ${role.storyRole} (centrality: ${role.centralityScore}/100)`);
    }

    // ========================================================================
    // STAGE 1 RESULTS
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STAGE 1: CONTEXT-AWARE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Tier Distribution:');
    console.log(`  - Tier 1: ${result.stage1.tierDistribution.tier1}`);
    console.log(`  - Tier 2: ${result.stage1.tierDistribution.tier2}`);
    console.log(`  - Tier 3: ${result.stage1.tierDistribution.tier3}`);
    console.log(`  - Tier 4: ${result.stage1.tierDistribution.tier4}`);
    console.log(`  - Portfolio Tier: ${result.stage1.tierDistribution.portfolioTier}`);

    console.log('\nTeaching Candidates:');
    console.log(`  - Deep Teaching (${result.stage1.teachingCandidates.deepTeachingIds.length}): ${result.stage1.teachingCandidates.deepTeachingIds.join(', ')}`);
    console.log(`  - Medium Teaching (${result.stage1.teachingCandidates.mediumTeachingIds.length}): ${result.stage1.teachingCandidates.mediumTeachingIds.join(', ')}`);
    console.log(`  - Quick Encouragement (${result.stage1.teachingCandidates.quickEncouragementIds.length}): ${result.stage1.teachingCandidates.quickEncouragementIds.join(', ')}`);
    console.log(`  - Skip (${result.stage1.teachingCandidates.skipTeachingIds.length}): ${result.stage1.teachingCandidates.skipTeachingIds.join(', ')}`);

    console.log('\nPortfolio Teaching Needs:');
    console.log(`  - Primary Issue: ${result.stage1.portfolioTeachingNeeds.primaryIssue}`);
    console.log(`  - Severity: ${result.stage1.portfolioTeachingNeeds.primaryIssueSeverity}`);
    console.log(`  - Strengths: ${result.stage1.portfolioTeachingNeeds.strengthsToHighlight.join(', ')}`);

    // ========================================================================
    // STAGE 2 RESULTS
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STAGE 2: CONDITIONAL TEACHING');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Teaching Delivered:');
    for (const td of result.stage2.teachingDelivered) {
      const activity = TEST_INPUT.activities.find(a => a.id === td.activityId);
      console.log(`\n  [${td.teachingDepth.toUpperCase()}] ${activity?.title}`);
      console.log(`    Tier: ${td.teaching.tierExplanation.assignedTier}`);
      console.log(`    Explanation: ${td.teaching.tierExplanation.explanation.text.substring(0, 100)}...`);
      if (td.teaching.strengthTeaching.length > 0) {
        console.log(`    Strengths: ${td.teaching.strengthTeaching.map(s => s.strength).join(', ')}`);
      }
      if (td.teaching.improvementTeaching.length > 0) {
        console.log(`    Improvements: ${td.teaching.improvementTeaching.map(i => i.issue).join(', ')}`);
      }
    }

    console.log('\nQuick Encouragements:');
    for (const qe of result.stage2.quickEncouragements) {
      const activity = TEST_INPUT.activities.find(a => a.id === qe.activityId);
      console.log(`\n  ${activity?.title}`);
      console.log(`    Celebration: ${qe.celebration.substring(0, 100)}...`);
    }

    console.log('\nSkipped Activities:');
    for (const sa of result.stage2.skippedActivities) {
      const activity = TEST_INPUT.activities.find(a => a.id === sa.activityId);
      console.log(`  - ${activity?.title}: ${sa.reason}`);
    }

    console.log('\nTeaching Quality Metrics:');
    console.log(`  - Celebration First: ${result.stage2.qualityMetrics.celebrationFirst}`);
    console.log(`  - Citations Included: ${result.stage2.qualityMetrics.citationsIncluded}`);
    console.log(`  - Examples Included: ${result.stage2.qualityMetrics.examplesIncluded}`);
    console.log(`  - Average Depth: ${result.stage2.qualityMetrics.averageDepth.toFixed(2)}`);

    // ========================================================================
    // STAGE 3 RESULTS
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STAGE 3: PORTFOLIO SYNTHESIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Final Assessment:');
    console.log(`  - Harvard Scale: ${result.stage3.finalAssessment.harvardScale}/6`);
    console.log(`  - Rationale: ${result.stage3.finalAssessment.harvardScaleRationale}`);
    console.log(`  - Overall Strength: ${result.stage3.finalAssessment.overallStrength}`);
    console.log(`  - Confidence: ${result.stage3.finalAssessment.confidence}%`);

    console.log('\nOrdered Activities (for Common App):');
    for (const oa of result.stage3.orderedActivities.slice(0, 5)) {
      const activity = TEST_INPUT.activities.find(a => a.id === oa.activityId);
      console.log(`  ${oa.rank}. ${activity?.title}`);
      console.log(`     Reason: ${oa.reason}`);
      console.log(`     Description (${oa.characterCount} chars): ${oa.finalDescription.substring(0, 80)}...`);
    }

    console.log('\nAction Plan:');
    console.log('  IMMEDIATE:');
    for (const action of result.stage3.actionPlan.immediate.slice(0, 2)) {
      console.log(`    - ${action.action}`);
    }
    console.log('  SHORT-TERM:');
    for (const action of result.stage3.actionPlan.shortTerm.slice(0, 2)) {
      console.log(`    - ${action.action}`);
    }

    console.log('\nFinal Message:');
    console.log(`  Celebration: ${result.stage3.finalMessage.celebration}`);
    console.log(`  Key Takeaway: ${result.stage3.finalMessage.keyTakeaway}`);
    console.log(`  Closing: ${result.stage3.finalMessage.closing}`);

    // ========================================================================
    // COST SUMMARY
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('PIPELINE COST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`  Stage 0 (Story Detection):    $${result.stage3.pipelineCost.stage0.toFixed(4)}`);
    console.log(`  Stage 1 (Analysis):           $${result.stage3.pipelineCost.stage1.toFixed(4)}`);
    console.log(`  Stage 2 (Teaching):           $${result.stage3.pipelineCost.stage2.toFixed(4)}`);
    console.log(`  Stage 3 (Synthesis):          $${result.stage3.pipelineCost.stage3.toFixed(4)}`);
    console.log(`  ──────────────────────────────────────`);
    console.log(`  TOTAL:                        $${result.stage3.pipelineCost.total.toFixed(4)}`);
    console.log(`\n  Total Time: ${totalTime}ms`);

    // ========================================================================
    // VALIDATION
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('VALIDATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const validations = [
      { name: 'Story context generated', pass: !!result.stage0.narrativeIdentity.archetype },
      { name: 'Teaching candidates selected', pass: result.stage1.teachingCandidates.deepTeachingIds.length > 0 || result.stage1.teachingCandidates.mediumTeachingIds.length > 0 },
      { name: 'Conditional teaching delivered', pass: result.stage2.teachingDelivered.length > 0 },
      { name: 'Not all activities taught (conditional)', pass: result.stage2.teachingDelivered.length < TEST_INPUT.activities.length },
      { name: 'Harvard scale assigned', pass: result.stage3.finalAssessment.harvardScale >= 1 && result.stage3.finalAssessment.harvardScale <= 6 },
      { name: 'Activities ordered', pass: result.stage3.orderedActivities.length > 0 },
      { name: 'Action plan generated', pass: result.stage3.actionPlan.immediate.length > 0 },
      { name: 'Final message generated', pass: !!result.stage3.finalMessage.celebration },
      { name: 'Cost within budget ($0.50)', pass: result.stage3.pipelineCost.total < 0.50 },
    ];

    let allPassed = true;
    for (const v of validations) {
      console.log(`  ${v.pass ? '✓' : '✗'} ${v.name}`);
      if (!v.pass) allPassed = false;
    }

    console.log(`\n${allPassed ? '✓ ALL VALIDATIONS PASSED' : '✗ SOME VALIDATIONS FAILED'}`);

    // ========================================================================
    // DONE
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Pipeline test failed:', error);
    throw error;
  }
}

// Run the test
runPipelineTest().catch(console.error);
