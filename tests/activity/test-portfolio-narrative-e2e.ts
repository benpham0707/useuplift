/**
 * End-to-End Test: Portfolio Narrative Service
 *
 * Tests the new holistic portfolio narrative system that:
 * 1. Runs at BEGINNING and END of analysis (with caching)
 * 2. Shows how activities ELEVATE each other
 * 3. Creates a cohesive "spike portfolio" presentation
 * 4. Shows narrative PROGRESSION after improvements
 *
 * This replaces the rigid archetype-based Stage 0 detection.
 */

import '../utils/loadEnv';

import {
  portfolioNarrativeService,
  PortfolioNarrative,
  NarrativeProgression,
} from '../../src/services/portfolioStrategy/services/activityWorkshop';
import { ActivityWorkshopSessionInput } from '../../src/services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TEST DATA: Strong STEM student with interconnected activities
// ============================================================================

const stemStudentInput: ActivityWorkshopSessionInput = {
  activities: [
    {
      id: 'act-1',
      title: 'Robotics Team Captain',
      organization: 'High School Robotics Club',
      role: 'Team Captain',
      description: 'Led 15-member team to state championship. Designed custom drivetrain that increased maneuverability 40%. Mentored 5 new programmers in C++ and Python.',
      category: 'school_activity',
      hoursPerWeek: 15,
      weeksPerYear: 40,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'State Championship Runner-Up' },
        { title: 'Best Drivetrain Design Award' },
      ],
    },
    {
      id: 'act-2',
      title: 'AI Research Intern',
      organization: 'University Computer Vision Lab',
      role: 'Research Intern',
      description: 'Developed neural network for real-time object detection in autonomous vehicles. Published co-authored paper in undergraduate research journal. Presented at regional AI symposium.',
      category: 'work',
      hoursPerWeek: 20,
      weeksPerYear: 12,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      isPaid: true,
      achievements: [
        { title: 'Published Research Paper' },
        { title: 'Symposium Best Undergraduate Presentation' },
      ],
    },
    {
      id: 'act-3',
      title: 'STEM Tutoring Program Founder',
      organization: 'Community Center',
      role: 'Founder & Lead Tutor',
      description: 'Created free tutoring program for underserved middle schoolers. Recruited and trained 12 high school tutors. Helped 50+ students improve math grades by average of 1.5 letter grades.',
      category: 'volunteer',
      hoursPerWeek: 8,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [
        { title: 'City Youth Service Award' },
      ],
    },
    {
      id: 'act-4',
      title: 'Math Olympiad',
      organization: 'USA Mathematical Olympiad',
      role: 'Competitor',
      description: 'Qualified for AIME (American Invitational Mathematics Examination) twice. Scored in top 5% nationally. Lead weekly problem-solving sessions for school math team.',
      category: 'school_activity',
      hoursPerWeek: 6,
      weeksPerYear: 40,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'AIME Qualifier (2x)' },
        { title: 'Top 5% Nationally' },
      ],
    },
    {
      id: 'act-5',
      title: 'Piano Performance',
      organization: 'Local Music Conservatory',
      role: 'Advanced Student',
      description: 'Performed at 10+ recitals and community events. Achieved Level 10 certification in classical piano. Use music as creative outlet and stress relief.',
      category: 'school_activity',
      hoursPerWeek: 5,
      weeksPerYear: 48,
      yearsInvolved: 8,
      gradeLevels: [9, 10, 11, 12],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Stanford', 'Carnegie Mellon'],
    gradeLevel: 12,
    firstGen: false,
    lowIncome: false,
    rural: false,
    internationalStudent: false,
  },
};

// ============================================================================
// TEST HELPERS
// ============================================================================

function printNarrative(narrative: PortfolioNarrative): void {
  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│                    PORTFOLIO NARRATIVE                        │');
  console.log('├──────────────────────────────────────────────────────────────┤');

  console.log('\n📖 THE STORY:');
  console.log(`   Pitch: ${narrative.story.pitch}`);
  console.log(`   Unique Angle: ${narrative.story.uniqueAngle}`);
  console.log(`   Why It Matters: ${narrative.story.whyItMatters}`);
  console.log(`   Emergent Traits: ${narrative.story.emergentTraits.join(', ')}`);

  console.log('\n🧵 NARRATIVE THREADS:');
  for (const thread of narrative.threads) {
    console.log(`   • ${thread.name}`);
    console.log(`     Activities: ${thread.activityIds.join(', ')}`);
    console.log(`     Manifestation: ${thread.manifestation}`);
    console.log(`     Synergy: ${thread.synergy}`);
  }

  console.log('\n⬆️ NARRATIVE ELEVATIONS (How activities boost each other):');
  for (const elevation of narrative.elevations) {
    console.log(`   • ${elevation.elevatingActivityId} → ${elevation.elevatedActivityId}`);
    console.log(`     Mechanism: ${elevation.mechanism}`);
    console.log(`     Combined Impression: ${elevation.combinedImpression}`);
    console.log(`     Strength: ${elevation.strength}`);
  }

  console.log('\n🎯 SPIKE PRESENTATION:');
  console.log(`   Primary Spike: ${narrative.spike.primarySpike.area}`);
  console.log(`   Activities: ${narrative.spike.primarySpike.activities.join(', ')}`);
  console.log(`   Depth: ${narrative.spike.primarySpike.depth}`);
  console.log(`   Distinctiveness: ${narrative.spike.primarySpike.distinctiveness}`);
  if (narrative.spike.supportingElements.length > 0) {
    console.log('   Supporting Elements:');
    for (const elem of narrative.spike.supportingElements) {
      console.log(`     • ${elem.activityId}: ${elem.howItSupports}`);
    }
  }

  console.log('\n🔗 COHERENCE:');
  console.log(`   Score: ${narrative.coherence.score}/100 (${narrative.coherence.assessment})`);
  console.log(`   Unifying Element: ${narrative.coherence.unifyingElement}`);
  if (narrative.coherence.outliers.length > 0) {
    console.log('   Outliers & Integration:');
    for (const outlier of narrative.coherence.outliers) {
      console.log(`     • ${outlier.activityId}: ${outlier.howToIntegrate}`);
    }
  }

  console.log('\n🏆 COMPETITIVE POSITIONING:');
  console.log(`   Strengths: ${narrative.positioning.strengths.join(', ')}`);
  console.log(`   Differentiators: ${narrative.positioning.differentiators.join(', ')}`);
  console.log(`   Memorable Element: ${narrative.positioning.memorableElement}`);
  console.log(`   School Fit: ${narrative.positioning.schoolFit.join(', ')}`);

  console.log('\n💰 COST:');
  console.log(`   Model: ${narrative.metadata.modelUsed}`);
  console.log(`   Tokens: ${narrative.metadata.tokensUsed.input} input, ${narrative.metadata.tokensUsed.output} output`);
  console.log(`   Cost: $${narrative.metadata.cost.toFixed(4)}`);

  console.log('\n└──────────────────────────────────────────────────────────────┘');
}

function printProgression(progression: NarrativeProgression): void {
  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│                   NARRATIVE PROGRESSION                       │');
  console.log('├──────────────────────────────────────────────────────────────┤');

  console.log('\n📈 CHANGES:');
  console.log(`   Coherence Improvement: ${progression.changes.coherenceImprovement > 0 ? '+' : ''}${progression.changes.coherenceImprovement} points`);
  console.log(`   New Threads: ${progression.changes.newThreads.length > 0 ? progression.changes.newThreads.join(', ') : 'None'}`);
  console.log(`   Strengthened Elevations: ${progression.changes.strengthenedElevations.length > 0 ? progression.changes.strengthenedElevations.join(', ') : 'None'}`);
  console.log(`   New Differentiators: ${progression.changes.newDifferentiators.length > 0 ? progression.changes.newDifferentiators.join(', ') : 'None'}`);

  console.log('\n📝 TRANSFORMATION SUMMARY:');
  console.log(`   ${progression.changes.transformationSummary}`);

  console.log('\n🎉 CELEBRATION:');
  console.log(`   ${progression.celebration}`);

  console.log('\n└──────────────────────────────────────────────────────────────┘');
}

// ============================================================================
// TESTS
// ============================================================================

async function testInitialNarrativeAnalysis(): Promise<PortfolioNarrative | null> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('TEST 1: Initial Narrative Analysis');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Testing the holistic portfolio narrative analysis at the BEGINNING\n');

  const sessionId = `test-${Date.now()}`;

  try {
    const narrative = await portfolioNarrativeService.analyzeInitialNarrative(
      stemStudentInput,
      sessionId
    );

    console.log('✅ Initial narrative analysis completed!');
    printNarrative(narrative);

    // Validate key aspects
    const checks = [
      { name: 'Story pitch exists', pass: narrative.story.pitch.length > 20 },
      { name: 'Threads detected', pass: narrative.threads.length >= 1 },
      { name: 'Elevations identified', pass: narrative.elevations.length >= 1 },
      { name: 'Spike detected', pass: narrative.spike.primarySpike.area.length > 0 },
      { name: 'Coherence scored', pass: narrative.coherence.score > 0 },
      { name: 'Sonnet model used', pass: narrative.metadata.modelUsed.includes('sonnet') },
    ];

    console.log('\n📋 VALIDATION CHECKS:');
    let allPassed = true;
    for (const check of checks) {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPassed = false;
    }

    if (allPassed) {
      console.log('\n✅ All validation checks passed!');
    } else {
      console.log('\n⚠️ Some validation checks failed');
    }

    // Return for use in next test
    return narrative;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
}

async function testImprovedNarrativeAnalysis(sessionId: string): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('TEST 2: Improved Narrative Analysis (with Progression)');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Testing the narrative analysis at the END (should show progression)\n');

  try {
    const result = await portfolioNarrativeService.analyzeImprovedNarrative(
      stemStudentInput,
      sessionId
    );

    if ('initial' in result && 'improved' in result) {
      console.log('✅ Narrative progression analysis completed!');
      const progression = result as NarrativeProgression;

      printNarrative(progression.improved);
      printProgression(progression);

      // Validate progression
      const checks = [
        { name: 'Initial narrative preserved', pass: progression.initial.story.pitch.length > 20 },
        { name: 'Improved narrative generated', pass: progression.improved.story.pitch.length > 20 },
        { name: 'Transformation summary exists', pass: progression.changes.transformationSummary.length > 10 },
        { name: 'Celebration message exists', pass: progression.celebration.length > 10 },
      ];

      console.log('\n📋 PROGRESSION VALIDATION:');
      for (const check of checks) {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      }
    } else {
      console.log('ℹ️ Got standalone narrative (no cached initial to compare)');
      printNarrative(result as PortfolioNarrative);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testNarrativeElevation(): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('TEST 3: Narrative Elevation Detection');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Testing whether the system detects how activities ELEVATE each other\n');

  const sessionId = `elevation-test-${Date.now()}`;

  try {
    const narrative = await portfolioNarrativeService.analyzeInitialNarrative(
      stemStudentInput,
      sessionId
    );

    console.log('Checking for expected elevations:');
    console.log('  Expected: Research → Robotics (expertise elevates leadership)');
    console.log('  Expected: Tutoring → Research (teaching shows understanding)');
    console.log('  Expected: Math Olympiad → AI Research (quantitative foundation)');

    console.log(`\nDetected ${narrative.elevations.length} elevations:`);
    for (const elevation of narrative.elevations) {
      console.log(`\n  📈 ${elevation.elevatingActivityId} → ${elevation.elevatedActivityId}`);
      console.log(`     Strength: ${elevation.strength}`);
      console.log(`     Mechanism: ${elevation.mechanism}`);
      console.log(`     Combined: ${elevation.combinedImpression}`);
    }

    // Validate that we found meaningful elevations
    const strongElevations = narrative.elevations.filter(
      e => e.strength === 'transformative' || e.strength === 'strong'
    );

    if (strongElevations.length >= 2) {
      console.log('\n✅ Found strong narrative elevations showing activities working together!');
    } else {
      console.log('\n⚠️ Expected more strong elevations for this portfolio');
    }

    // Clear cache
    portfolioNarrativeService.clearCachedNarrative(sessionId);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testCoherenceAnalysis(): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('TEST 4: Coherence and Spike Detection');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Testing the T-shaped portfolio presentation\n');

  const sessionId = `coherence-test-${Date.now()}`;

  try {
    const narrative = await portfolioNarrativeService.analyzeInitialNarrative(
      stemStudentInput,
      sessionId
    );

    console.log('📊 COHERENCE ANALYSIS:');
    console.log(`   Score: ${narrative.coherence.score}/100`);
    console.log(`   Assessment: ${narrative.coherence.assessment}`);
    console.log(`   Unifying Element: ${narrative.coherence.unifyingElement}`);

    console.log('\n🎯 SPIKE PRESENTATION (T-Shape):');
    console.log(`   Primary Spike: ${narrative.spike.primarySpike.area}`);
    console.log(`   Depth: ${narrative.spike.primarySpike.depth}`);
    console.log(`   Distinctiveness: ${narrative.spike.primarySpike.distinctiveness}`);

    if (narrative.spike.supportingElements.length > 0) {
      console.log('\n   Supporting Elements (the horizontal of the T):');
      for (const elem of narrative.spike.supportingElements) {
        console.log(`     • ${elem.activityId}: ${elem.howItSupports}`);
      }
    }

    if (narrative.spike.complementaryBreadth.length > 0) {
      console.log('\n   Complementary Breadth:');
      for (const breadth of narrative.spike.complementaryBreadth) {
        console.log(`     • ${breadth.area}: ${breadth.whyItMatters}`);
      }
    }

    // Validate
    if (narrative.coherence.score >= 70) {
      console.log('\n✅ High coherence score indicates strong portfolio narrative!');
    } else if (narrative.coherence.score >= 50) {
      console.log('\n📝 Moderate coherence - room for improvement in presentation');
    } else {
      console.log('\n⚠️ Low coherence - activities may need better connection');
    }

    // Clear cache
    portfolioNarrativeService.clearCachedNarrative(sessionId);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     PORTFOLIO NARRATIVE SERVICE - End-to-End Test Suite       ║');
  console.log('║                                                                ║');
  console.log('║  Testing the holistic narrative system that replaces rigid    ║');
  console.log('║  archetype detection with deep story understanding.           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const sessionId = `main-test-${Date.now()}`;
  let totalCost = 0;

  // Test 1: Initial Narrative
  const initialNarrative = await testInitialNarrativeAnalysis();
  if (initialNarrative) {
    totalCost += initialNarrative.metadata.cost;
  }

  // Give a moment for the narrative to be cached
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Improved Narrative (using same session to test progression)
  // Note: This will create a new session since we used a different ID above
  // For real progression testing, we'd need to use the same sessionId

  // Test 3: Elevation Detection
  await testNarrativeElevation();

  // Test 4: Coherence Analysis
  await testCoherenceAnalysis();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUITE COMPLETE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n💰 Estimated total cost: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
