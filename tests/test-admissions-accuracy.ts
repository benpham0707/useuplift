/**
 * Test: Admissions Accuracy
 *
 * Tests whether our scoring system can accurately identify what REAL admissions officers
 * value at each school. This goes beyond "anti-bias" to test:
 *
 * 1. MINDSET RECOGNITION - Can we identify college-specific values in essays?
 * 2. CROSS-COLLEGE DIFFERENTIATION - Does an essay that's great for Stanford score
 *    appropriately lower for MIT (and vice versa)?
 * 3. VALUE ALIGNMENT - Do we recognize the specific qualities each school seeks?
 *
 * This is the key test for reliable college-specific guidance.
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import { CollegeTailroingScoringService } from '../src/services/commonAppWorkshop/services/collegeTailoringScoringService';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import { mitResearch } from '../src/services/commonAppWorkshop/data/mit';
import { harvardResearch } from '../src/services/commonAppWorkshop/data/harvard';
import { uchicagoResearch } from '../src/services/commonAppWorkshop/data/uchicago';

const scoringService = new CollegeTailroingScoringService();

// ============================================================================
// TEST ESSAYS - Designed for specific schools
// ============================================================================

/**
 * ESSAY 1: Perfect for STANFORD, Not for MIT
 *
 * Demonstrates: Self-directed intellectual curiosity, authentic voice, rabbit holes
 * Missing for MIT: Collaborative problem-solving, building with others, tangible outcomes
 */
const STANFORD_FIT_ESSAY = `The question that won't leave me alone isn't one anyone assigned. Last March, I was supposed to be studying for AP Bio, but instead I spent three weeks trying to understand why I feel guilty when I accidentally step on an ant.

It sounds absurd. But that guilt led me through Peter Singer's "Animal Liberation," then to Buddhist concepts of sentient beings, then to building an Arduino-based infrared sensor that warns insects before I walk. My friends think I've lost it. Maybe I have.

What fascinates me isn't the ethics conclusion I reached (I still eat chicken, so clearly I'm a hypocrite). It's the way one simple observation—guilt about an ant—branched into philosophy, religion, and electrical engineering. I didn't plan this. I just couldn't stop thinking about it.

That's the kind of mind I have. It wanders. It questions. It builds weird things at 2 AM because the question won't let go.`;

/**
 * ESSAY 2: Perfect for MIT, Not for Stanford
 *
 * Demonstrates: Collaborative problem-solving, Mens et Manus, tangible outcomes
 * Missing for Stanford: Self-directed curiosity (this was externally motivated),
 *   the exploration was practical not philosophical
 */
const MIT_FIT_ESSAY = `The wheelchair ramp at our community center was a disaster. Too steep, no handrails, and the concrete was cracking. Three kids in our robotics club use wheelchairs, and they hated asking for help every meeting.

So we fixed it. Not just "we" as in I led—we as in Sarah designed the grade calculations, Marcus sourced donated materials, and I figured out how to pour concrete by watching YouTube until 3 AM. Our mentor, Ms. Chen, kept asking "what happens if it fails?" We didn't know. We built it anyway.

The first test, Marcus's chair got stuck. Angle was wrong by 2 degrees. We tore up what we'd built and started over. Second version worked, but the handrails were too low. Third time, finally right.

Now three of my teammates roll into robotics club on their own. That mattered more than any trophy we've won.`;

/**
 * ESSAY 3: Perfect for HARVARD, Not for UChicago
 *
 * Demonstrates: "Make People Better" - character impact on others, kindness
 * Missing for UChicago: Visible thinking process, intellectual playfulness,
 *   ideas for their own sake (this is about impact, not thinking)
 */
const HARVARD_FIT_ESSAY = `I noticed that Michael always ate lunch alone. Not in the dramatic, cinematic way—he had a spot by the back stairs, headphones in, perfectly content. Or so I thought.

One Tuesday I sat with him. No agenda. I just asked what he was listening to. Twenty minutes later, I knew about his little brother's hospital bills, his part-time job at the gas station, and how he felt invisible at school.

I didn't "fix" anything. I just... listened. But after that, I made a point to check in. Sometimes we talked. Sometimes we just sat. When applications came around, Michael asked me to look at his essay. Then my friend Priya did the same. Then her boyfriend.

I'm not a counselor or a tutor. I'm just the person who notices when someone's struggling and doesn't walk past. Fifteen students asked me to read their essays this year. I don't know if any of them got in anywhere. But I know they felt a little less alone.`;

/**
 * ESSAY 4: Perfect for UCHICAGO, Not for Harvard
 *
 * Demonstrates: Visible thinking process, intellectual playfulness, ideas for their own sake
 * Missing for Harvard: Character impact on others, kindness in action
 *   (this is about the joy of ideas, not about making people better)
 */
const UCHICAGO_FIT_ESSAY = `Here's a question I can't stop thinking about: Is a song that no one has ever heard still a song?

I've been arguing with myself about this for six months. On one hand, obviously yes—the notes exist, the composition exists, the potential for sound exists. A tree falling in an empty forest still makes vibrations.

But "song" implies singing, which implies hearing, which implies an audience. A song isn't just sound waves—it's communication. An unheard song is like an unread book: physically present but functionally absent.

Unless... what if the composer heard it while writing? Does that count? What if they only imagined it? What if I'm conflating "song" with "performance"?

I brought this to my philosophy club. Three hours later, we'd redefined "existence," questioned whether math is invented or discovered, and somehow ended up on whether dreams are real. We answered nothing. It was the best conversation I've had all year.

This is how I think. Everything connects to everything else. I follow the thread until it unravels into something bigger. I don't need answers. I need interesting questions.`;

/**
 * ESSAY 5: GENERIC - Should score poorly for ALL schools
 *
 * This essay is well-written but completely generic.
 * Could apply to any school, demonstrates no specific values.
 */
const GENERIC_ESSAY = `My journey toward leadership began when I was elected captain of my debate team. This experience taught me valuable lessons about responsibility, teamwork, and perseverance.

When we faced our biggest competition, I worked hard to prepare my team. We practiced every day after school, and I helped each member improve their skills. Our hard work paid off when we won second place at regionals.

This experience showed me the importance of dedication and supporting others. I learned that true leadership isn't about being the best—it's about helping everyone reach their potential. These skills will serve me well in college and beyond.

I am excited to bring my leadership experience to your university, where I hope to continue growing as both a student and a leader.`;

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

interface CrossCollegeTest {
  id: string;
  name: string;
  essay: string;
  designed_for: string;
  expected_scores: {
    [collegeId: string]: {
      range: [number, number];
      key_values_expected: string[];
      should_be_higher_than?: string[];
    };
  };
}

const CROSS_COLLEGE_TESTS: CrossCollegeTest[] = [
  {
    id: 'stanford_fit',
    name: 'Stanford-Fit Essay (Self-Directed Curiosity)',
    essay: STANFORD_FIT_ESSAY,
    designed_for: 'stanford',
    expected_scores: {
      stanford: {
        range: [75, 95],
        key_values_expected: ['intellectual_vitality', 'authentic_voice'],
        should_be_higher_than: ['mit', 'harvard'],
      },
      mit: {
        range: [40, 65],
        key_values_expected: [], // Missing collaborative problem-solving
      },
      harvard: {
        range: [45, 70],
        key_values_expected: ['intellectual_vitality'], // Has curiosity but not character impact
      },
    },
  },
  {
    id: 'mit_fit',
    name: 'MIT-Fit Essay (Collaborative Problem-Solving)',
    essay: MIT_FIT_ESSAY,
    designed_for: 'mit',
    expected_scores: {
      mit: {
        range: [75, 95],
        key_values_expected: ['collaborative_problem_solving', 'mens_et_manus'],
        should_be_higher_than: ['stanford', 'uchicago'],
      },
      stanford: {
        range: [50, 70],
        key_values_expected: ['authentic_voice'], // Has voice but curiosity was externally motivated
      },
      harvard: {
        range: [60, 80],
        key_values_expected: ['make_people_better'], // Does show impact on others
      },
    },
  },
  {
    id: 'harvard_fit',
    name: 'Harvard-Fit Essay (Character Impact)',
    essay: HARVARD_FIT_ESSAY,
    designed_for: 'harvard',
    // Note: This essay shows Harvard VALUES but isn't TAILORED to Harvard
    // It doesn't mention Harvard programs, so research_depth will be low
    // The essay demonstrates "make_people_better" but could work for other schools too
    expected_scores: {
      harvard: {
        range: [55, 80], // Lower range because no Harvard-specific content
        key_values_expected: ['make_people_better'],
        should_be_higher_than: ['mit', 'uchicago'], // Should beat schools that don't value character impact
      },
      stanford: {
        range: [55, 75], // May score similarly due to authentic voice
        key_values_expected: ['authentic_voice'],
      },
      mit: {
        range: [25, 50], // Low - not about building/making
        key_values_expected: [],
      },
      uchicago: {
        range: [25, 45], // Low - not about intellectual process
        key_values_expected: [],
      },
    },
  },
  {
    id: 'uchicago_fit',
    name: 'UChicago-Fit Essay (Visible Thinking)',
    essay: UCHICAGO_FIT_ESSAY,
    designed_for: 'uchicago',
    expected_scores: {
      uchicago: {
        range: [75, 95],
        key_values_expected: ['how_you_think', 'intellectual_playfulness', 'intellectual_vitality'],
        should_be_higher_than: ['harvard', 'mit'],
      },
      stanford: {
        range: [65, 85],
        key_values_expected: ['intellectual_vitality'], // Similar intellectual energy
      },
      harvard: {
        range: [40, 65], // Slightly higher - shares intellectual depth
        key_values_expected: [], // No character impact
      },
      mit: {
        range: [30, 50], // Lower - philosophical essay doesn't match MIT's hands-on ethos
        key_values_expected: [], // No building/making
      },
    },
  },
  {
    id: 'generic',
    name: 'Generic Essay (Should Score Low Everywhere)',
    essay: GENERIC_ESSAY,
    designed_for: 'none',
    expected_scores: {
      stanford: { range: [15, 45], key_values_expected: [] },
      mit: { range: [15, 45], key_values_expected: [] },
      harvard: { range: [20, 50], key_values_expected: [] }, // Mentions helping others
      uchicago: { range: [15, 40], key_values_expected: [] },
    },
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface CollegeScoreResult {
  college_id: string;
  college_name: string;
  score: number;
  expected_range: [number, number];
  in_range: boolean;
  key_values_found: string[];
  key_values_expected: string[];
  values_match: boolean;
  dimension_scores: Record<string, number>;
}

interface TestResult {
  id: string;
  name: string;
  designed_for: string;
  college_scores: CollegeScoreResult[];
  differentiation_passed: boolean;
  differentiation_details: string[];
  overall_passed: boolean;
  cost: number;
}

const COLLEGE_MAP = {
  stanford: { data: stanfordResearch, name: 'Stanford' },
  mit: { data: mitResearch, name: 'MIT' },
  harvard: { data: harvardResearch, name: 'Harvard' },
  uchicago: { data: uchicagoResearch, name: 'UChicago' },
};

async function runCrossCollegeTest(test: CrossCollegeTest): Promise<TestResult> {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: ${test.name}`);
  console.log(`Designed for: ${test.designed_for.toUpperCase()}`);
  console.log(`${'═'.repeat(70)}`);

  const collegeScores: CollegeScoreResult[] = [];
  let totalCost = 0;

  // Score against each college
  for (const [collegeId, expected] of Object.entries(test.expected_scores)) {
    const collegeInfo = COLLEGE_MAP[collegeId as keyof typeof COLLEGE_MAP];
    if (!collegeInfo) continue;

    try {
      console.log(`\n  Scoring for ${collegeInfo.name}...`);
      const result = await scoringService.scoreEssay({
        essay_text: test.essay,
        college: collegeInfo.data,
        essay_type: 'intellectual_curiosity',
      });
      totalCost += result.cost;

      const score = result.assessment.tailoring_score;
      const inRange = score >= expected.range[0] && score <= expected.range[1];

      // Check which key values were found
      const valuesFound = result.assessment.values_demonstrated
        .filter(v => v.strength === 'strong' || v.strength === 'moderate')
        .map(v => v.value_id);

      const valuesMatch = expected.key_values_expected.every(v => valuesFound.includes(v));

      // Extract dimension scores
      const dimensionScores: Record<string, number> = {};
      result.assessment.dimension_scores.forEach(d => {
        dimensionScores[d.dimension] = d.score;
      });

      collegeScores.push({
        college_id: collegeId,
        college_name: collegeInfo.name,
        score,
        expected_range: expected.range,
        in_range: inRange,
        key_values_found: valuesFound,
        key_values_expected: expected.key_values_expected,
        values_match: valuesMatch,
        dimension_scores: dimensionScores,
      });

      console.log(`    Score: ${score}/100 (expected ${expected.range[0]}-${expected.range[1]}) ${inRange ? '✅' : '❌'}`);
      console.log(`    Values found: ${valuesFound.join(', ') || 'none'}`);
      if (expected.key_values_expected.length > 0) {
        console.log(`    Expected: ${expected.key_values_expected.join(', ')} ${valuesMatch ? '✅' : '⚠️'}`);
      }
    } catch (error) {
      console.log(`    ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
      collegeScores.push({
        college_id: collegeId,
        college_name: collegeInfo.name,
        score: 0,
        expected_range: expected.range,
        in_range: false,
        key_values_found: [],
        key_values_expected: expected.key_values_expected,
        values_match: false,
        dimension_scores: {},
      });
    }
  }

  // Check differentiation (designed_for should score higher than specified colleges)
  const differentiationDetails: string[] = [];
  let differentiationPassed = true;

  if (test.designed_for !== 'none') {
    const designedForExpected = test.expected_scores[test.designed_for];
    if (designedForExpected?.should_be_higher_than) {
      const designedForScore = collegeScores.find(s => s.college_id === test.designed_for)?.score || 0;

      for (const lowerCollege of designedForExpected.should_be_higher_than) {
        const lowerScore = collegeScores.find(s => s.college_id === lowerCollege)?.score || 0;
        const passed = designedForScore > lowerScore;

        differentiationDetails.push(
          `${test.designed_for} (${designedForScore}) > ${lowerCollege} (${lowerScore}): ${passed ? '✅' : '❌'}`
        );

        if (!passed) differentiationPassed = false;
      }
    }
  }

  // Overall pass check
  const allInRange = collegeScores.every(s => s.in_range);
  const overallPassed = allInRange && differentiationPassed;

  // Print differentiation results
  if (differentiationDetails.length > 0) {
    console.log(`\n  Differentiation Check:`);
    differentiationDetails.forEach(d => console.log(`    ${d}`));
  }

  console.log(`\n  Overall: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

  return {
    id: test.id,
    name: test.name,
    designed_for: test.designed_for,
    college_scores: collegeScores,
    differentiation_passed: differentiationPassed,
    differentiation_details: differentiationDetails,
    overall_passed: overallPassed,
    cost: totalCost,
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           ADMISSIONS ACCURACY TEST                                   ║');
  console.log('║   Testing real admissions officer judgment across colleges           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  const results: TestResult[] = [];
  let totalCost = 0;
  const startTime = Date.now();

  for (const test of CROSS_COLLEGE_TESTS) {
    const result = await runCrossCollegeTest(test);
    results.push(result);
    totalCost += result.cost;
  }

  const duration = Date.now() - startTime;

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('ADMISSIONS ACCURACY SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.overall_passed).length;
  const failed = results.filter(r => !r.overall_passed).length;
  const differentiationSuccess = results.filter(r => r.differentiation_passed).length;

  console.log(`\nTests Passed: ${passed}/${results.length}`);
  console.log(`Differentiation Success: ${differentiationSuccess}/${results.length}`);

  // Score matrix
  console.log('\n' + '─'.repeat(70));
  console.log('SCORE MATRIX (Essays vs Colleges)');
  console.log('─'.repeat(70));

  console.log('\n                        | Stanford |   MIT    | Harvard  | UChicago |');
  console.log('------------------------|----------|----------|----------|----------|');

  for (const result of results) {
    const stanfordScore = result.college_scores.find(s => s.college_id === 'stanford')?.score || '-';
    const mitScore = result.college_scores.find(s => s.college_id === 'mit')?.score || '-';
    const harvardScore = result.college_scores.find(s => s.college_id === 'harvard')?.score || '-';
    const uchicagoScore = result.college_scores.find(s => s.college_id === 'uchicago')?.score || '-';

    const label = result.designed_for === 'none'
      ? 'Generic'
      : result.designed_for.charAt(0).toUpperCase() + result.designed_for.slice(1) + '-Fit';

    console.log(
      `${label.padEnd(24)}|${String(stanfordScore).padStart(5).padEnd(10)}|${String(mitScore).padStart(5).padEnd(10)}|${String(harvardScore).padStart(5).padEnd(10)}|${String(uchicagoScore).padStart(5).padEnd(10)}|`
    );
  }

  // Key findings
  console.log('\n' + '─'.repeat(70));
  console.log('KEY FINDINGS');
  console.log('─'.repeat(70));

  // Check if each essay scored highest for its designed college
  for (const result of results) {
    if (result.designed_for === 'none') continue;

    const designedForScore = result.college_scores.find(s => s.college_id === result.designed_for)?.score || 0;
    const otherScores = result.college_scores.filter(s => s.college_id !== result.designed_for);
    const maxOtherScore = Math.max(...otherScores.map(s => s.score));
    const scoredHighest = designedForScore >= maxOtherScore;

    console.log(`\n${result.name}:`);
    console.log(`  Designed for ${result.designed_for}: ${designedForScore}`);
    console.log(`  Highest other score: ${maxOtherScore}`);
    console.log(`  ${scoredHighest ? '✅ Correctly scored highest for designed college' : '❌ Did NOT score highest for designed college'}`);
  }

  // Cost and time
  console.log('\n' + '─'.repeat(70));
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

  // Final verdict
  console.log('\n' + '═'.repeat(70));
  if (passed >= 4 && differentiationSuccess >= 4) {
    console.log('✅ ADMISSIONS ACCURACY: EXCELLENT');
    console.log('   System can reliably differentiate college-specific values');
  } else if (passed >= 3) {
    console.log('⚠️  ADMISSIONS ACCURACY: ACCEPTABLE');
    console.log('   Some differentiation issues need attention');
  } else {
    console.log('❌ ADMISSIONS ACCURACY: NEEDS WORK');
    console.log('   System cannot reliably identify college-specific values');
  }
  console.log('═'.repeat(70));

  // Output JSON for logging
  console.log('\n[RESULTS_JSON]');
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      tests_passed: passed,
      tests_failed: failed,
      differentiation_success: differentiationSuccess,
      total_cost: totalCost,
      duration_ms: duration,
    },
    results,
  }, null, 2));
  console.log('[/RESULTS_JSON]');

  process.exit(passed >= 3 ? 0 : 1);
}

main().catch(console.error);
