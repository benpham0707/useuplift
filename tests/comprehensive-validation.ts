/**
 * Comprehensive Validation Test Suite
 *
 * Tests the extracurricular grading system across:
 * - Multiple activity types (work, service, leadership, arts, research)
 * - Different quality levels (weak, medium, strong, excellent)
 * - Various narrative styles (reflective, action-oriented, technical)
 */

import { analyzeEntry } from '../src/core/analysis/engine';
import { ExperienceEntry } from '../src/core/types/experience';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// TEST ENTRIES - VARIED QUALITY LEVELS
// ============================================================================

const TEST_ENTRIES: Array<{
  name: string;
  entry: ExperienceEntry;
  expectedRange: [number, number];
  keyStrengths: string[];
  expectedWeaknesses: string[];
}> = [
  {
    name: "EXCELLENT - Research Internship (STEM)",
    expectedRange: [80, 90],
    keyStrengths: ["concrete metrics", "technical depth", "clear impact"],
    expectedWeaknesses: [],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Machine Learning Research Intern",
      organization: "Stanford AI Lab",
      role: "Research Assistant",
      category: "research",
      description_original: `Three months in, I'd debugged the same training loop 47 times. The model kept overfitting on edge cases—98% accuracy on training data, 61% on validation. Dr. Chen suggested I was thinking like an engineer, not a scientist. "What's the data telling you it needs?"

I rebuilt the validation pipeline from scratch. Turned out our training set had 3:1 class imbalance we'd missed. After resampling and adding dropout layers, validation accuracy jumped to 84%. More importantly, I learned to interrogate my assumptions before my code.

By summer's end, our improved model reduced false positives by 34% in medical image classification. I documented the pipeline redesign in a 12-page technical report that Dr. Chen submitted to ICML. The real win wasn't the conference submission—it was realizing that good research means being wrong efficiently.`,
      hours_per_week: 20,
      weeks_per_year: 12,
      start_date: '2024-06-01',
      end_date: '2024-08-31',
      time_span: 'June 2024 - August 2024',
      version: 1,
    }
  },

  {
    name: "STRONG - Community Service (Authentic Voice)",
    expectedRange: [75, 85],
    keyStrengths: ["authentic voice", "specific details", "human connection"],
    expectedWeaknesses: ["moderate impact scale"],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "ESL Tutor",
      organization: "Community Learning Center",
      role: "Volunteer Tutor",
      category: "service",
      description_original: `Tuesday evenings, 6pm. Maria brings her daughter's homework. Carlos practices reading job applications. Mr. Kim works through citizenship test questions. I'm the tutor, but mostly I'm the person who has time.

Started helping Maria with verb tenses last September. By December, she was translating for other students. Watched Carlos land his first interview after we rehearsed common questions 14 times. Mr. Kim passed his citizenship test in March—brought me Korean snacks to celebrate.

The work isn't dramatic. I don't "transform lives" or "make a difference." I show up on Tuesdays. I answer questions. Sometimes I explain the same grammar rule five different ways until something clicks. The real lesson wasn't about teaching—it was about consistency mattering more than expertise.`,
      hours_per_week: 3,
      weeks_per_year: 38,
      start_date: '2023-09-01',
      end_date: 'Present',
      time_span: 'September 2023 - Present',
      version: 1,
    }
  },

  {
    name: "MEDIUM - Club Leadership (Competent but Generic)",
    expectedRange: [60, 70],
    keyStrengths: ["clear metrics", "sustained commitment"],
    expectedWeaknesses: ["generic reflection", "lacks voice"],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Debate Club President",
      organization: "High School Debate Team",
      role: "President",
      category: "leadership",
      description_original: `As president of our debate club, I was responsible for organizing weekly meetings and coordinating tournament participation. I worked with our advisor to develop a practice schedule that improved team performance.

During my tenure, club membership grew from 15 to 23 students. I recruited new members through presentations at club fairs and implemented a mentorship program pairing experienced debaters with novices. We attended 6 tournaments and placed in the top 3 at regional competitions.

I also managed our budget of $2,400, organizing fundraisers to cover tournament fees and travel expenses. This experience taught me valuable leadership skills and the importance of effective communication. I learned how to motivate team members and handle conflicts diplomatically.`,
      hours_per_week: 5,
      weeks_per_year: 36,
      start_date: '2023-09-01',
      end_date: '2024-06-15',
      time_span: 'September 2023 - June 2024',
      version: 1,
    }
  },

  {
    name: "WEAK - Generic Volunteer (Templated)",
    expectedRange: [35, 50],
    keyStrengths: [],
    expectedWeaknesses: ["no specifics", "buzzwords", "no voice", "manufactured"],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Community Volunteer",
      organization: "Local Nonprofit",
      role: "Volunteer",
      category: "service",
      description_original: `I was passionate about giving back to my community and was thrilled to volunteer at a local nonprofit organization. I was responsible for helping with various tasks and assisting staff members with their important work.

Through this experience, I learned valuable lessons about teamwork, dedication, and the importance of community service. I developed strong interpersonal skills and gained a deeper appreciation for the challenges facing underserved populations.

This opportunity taught me that even small contributions can make a big difference. I am grateful for the chance to have been part of such an impactful team and look forward to continuing my commitment to service in college.`,
      hours_per_week: 2,
      weeks_per_year: 20,
      start_date: '2024-01-01',
      end_date: '2024-05-31',
      time_span: 'January 2024 - May 2024',
      version: 1,
    }
  },

  {
    name: "STRONG - Arts (Deep Personal Connection)",
    expectedRange: [75, 85],
    keyStrengths: ["authentic voice", "cultural depth", "personal meaning"],
    expectedWeaknesses: ["limited measurable impact"],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Chinese Calligraphy Practice",
      organization: "Self-directed",
      role: "Artist/Practitioner",
      category: "arts",
      description_original: `Every Sunday morning for four years, I've practiced 楷書 (regular script) at my grandmother's kitchen table. She doesn't speak much English; I don't speak much Mandarin. But when I hold the brush wrong, she taps my wrist twice. That's our language.

Started with basic strokes—horizontal, vertical, dot. Hundreds of times. My first attempts looked like angry spiders. Gradually, the characters started holding their shape. 永 (eternal) has eight fundamental strokes; took me six months before Grandmother nodded approval.

Last year, I wrote 春 (spring) on red paper for Lunar New Year. Grandmother hung it in her doorway—first time she's displayed my work. Not because it's perfect (the final stroke still wavers), but because she could see I was learning to slow down. Calligraphy taught me that mastery isn't about speed or product. It's about respecting the process enough to do it 500 times badly before you do it once right.`,
      hours_per_week: 4,
      weeks_per_year: 48,
      start_date: '2020-09-01',
      end_date: 'Present',
      time_span: 'September 2020 - Present',
      version: 1,
    }
  },

  {
    name: "MEDIUM - Athletics (Good Effort, Limited Insight)",
    expectedRange: [60, 72],
    keyStrengths: ["time commitment", "tangible results"],
    expectedWeaknesses: ["shallow reflection", "predictable narrative"],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Varsity Cross Country Runner",
      organization: "High School Track Team",
      role: "Team Captain",
      category: "athletics",
      description_original: `As captain of the varsity cross country team, I trained six days per week and competed in 12 meets per season. My personal record improved from 19:32 to 17:48 over three years, and I placed 4th at the regional championship.

Beyond my individual performance, I focused on building team cohesion. I organized pre-race team dinners, created a group chat for motivation, and partnered with struggling teammates during practice runs. Our team GPA increased from 3.2 to 3.6 during my captaincy.

This experience taught me perseverance, discipline, and how to push through physical and mental barriers. I learned that leadership isn't about being the fastest runner—it's about bringing everyone along. These lessons will help me succeed in college and beyond.`,
      hours_per_week: 12,
      weeks_per_year: 40,
      start_date: '2022-09-01',
      end_date: '2024-06-15',
      time_span: 'September 2022 - June 2024',
      version: 1,
    }
  },

  {
    name: "EXCELLENT - Work (Jimmy's Hot Dogs Style)",
    expectedRange: [75, 85],
    keyStrengths: ["perfect voice", "sensory details", "human wisdom"],
    expectedWeaknesses: [],
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: "Barista at Corner Coffee",
      organization: "Corner Coffee Shop",
      role: "Barista",
      category: "work",
      description_original: `5:45am: unlock the door, flip the OPEN sign, start the espresso machine warming cycle. By 6:00am, the lawyers need their triple shots. By 6:15am, the nurses finishing night shifts need something sweet.

Learned every regular's order by week three. Tom (double cappuccino, extra foam) tips exactly $1.47—loose change from his car. Sarah (oat milk latte, 140°) is a med student; she studies pharmacology flashcards at table four. On exam days, I draw little hearts in her foam. She's never noticed.

The espresso machine broke on a Saturday morning rush. We had a line out the door, and I had no backup plan. Tom saw me panicking and said, "Just brew coffee. We'll survive." The nurses helped me carry pots to tables. Sarah made a sign: "ESPRESSO MACHINE DOWN. PATIENCE APPRECIATED."

We served drip coffee all day. Made 40% less revenue. But I learned that regulars don't come for perfect espresso—they come because someone knows their name. The machine got fixed Monday. The people stayed.`,
      hours_per_week: 15,
      weeks_per_year: 48,
      start_date: '2023-06-01',
      end_date: 'Present',
      time_span: 'June 2023 - Present',
      version: 1,
    }
  },
];

// ============================================================================
// TESTING FRAMEWORK
// ============================================================================

interface TestResult {
  name: string;
  nqi: number;
  expectedRange: [number, number];
  passed: boolean;
  authenticity: number;
  voiceScore: number;
  topCategories: Array<{ name: string; score: number }>;
  bottomCategories: Array<{ name: string; score: number }>;
  flags: string[];
}

async function runTest(test: typeof TEST_ENTRIES[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${test.name}`);
  console.log(`${'='.repeat(80)}`);

  const result = await analyzeEntry(test.entry, { depth: 'standard' });

  const [minExpected, maxExpected] = test.expectedRange;
  const nqi = result.report.narrative_quality_index;
  const passed = nqi >= minExpected && nqi <= maxExpected;

  const categories = result.report.categories
    .map(c => ({ name: c.name, score: c.score_0_to_10 }))
    .sort((a, b) => b.score - a.score);

  const topCategories = categories.slice(0, 3);
  const bottomCategories = categories.slice(-3).reverse();
  const voiceScore = categories.find(c => c.name.includes('Voice'))?.score || 0;

  console.log(`\n📊 RESULTS:`);
  console.log(`   NQI: ${nqi}/100 (Expected: ${minExpected}-${maxExpected}) ${passed ? '✅' : '❌'}`);
  console.log(`   Authenticity: ${result.authenticity.authenticity_score}/10`);
  console.log(`   Voice: ${voiceScore}/10`);
  console.log(`   Label: ${result.report.reader_impression_label}`);

  return {
    name: test.name,
    nqi,
    expectedRange: test.expectedRange,
    passed,
    authenticity: result.authenticity.authenticity_score,
    voiceScore,
    topCategories,
    bottomCategories,
    flags: result.report.flags,
  };
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function main() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE VALIDATION TEST SUITE - EXTRACURRICULAR GRADING        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  const results: TestResult[] = [];

  for (const test of TEST_ENTRIES) {
    const result = await runTest(test);
    results.push(result);

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            VALIDATION SUMMARY                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed (${Math.round(passedCount/totalCount * 100)}%)\n`);

  console.log('Detailed Results:');
  console.log('-'.repeat(80));

  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    const deviation = r.nqi < r.expectedRange[0]
      ? `(${(r.expectedRange[0] - r.nqi).toFixed(1)} below range)`
      : r.nqi > r.expectedRange[1]
      ? `(${(r.nqi - r.expectedRange[1]).toFixed(1)} above range)`
      : '';

    console.log(`\n${status} ${r.name}`);
    console.log(`   Score: ${r.nqi}/100 | Expected: ${r.expectedRange[0]}-${r.expectedRange[1]} ${deviation}`);
    console.log(`   Auth: ${r.authenticity}/10 | Voice: ${r.voiceScore}/10`);
    console.log(`   Top: ${r.topCategories.map(c => `${c.name}(${c.score.toFixed(1)})`).join(', ')}`);
    console.log(`   Bottom: ${r.bottomCategories.map(c => `${c.name}(${c.score.toFixed(1)})`).join(', ')}`);
    if (r.flags.length > 0) {
      console.log(`   Flags: ${r.flags.slice(0, 3).join(', ')}`);
    }
  });

  // Analysis by category
  console.log('\n\n📊 SCORE DISTRIBUTION ANALYSIS:');
  console.log('-'.repeat(80));

  const excellent = results.filter(r => r.nqi >= 80);
  const strong = results.filter(r => r.nqi >= 70 && r.nqi < 80);
  const medium = results.filter(r => r.nqi >= 55 && r.nqi < 70);
  const weak = results.filter(r => r.nqi < 55);

  console.log(`   Excellent (80+): ${excellent.length} entries`);
  console.log(`   Strong (70-79): ${strong.length} entries`);
  console.log(`   Medium (55-69): ${medium.length} entries`);
  console.log(`   Weak (<55): ${weak.length} entries`);

  // Accuracy check
  console.log('\n\n🎯 CALIBRATION ACCURACY:');
  console.log('-'.repeat(80));

  const avgDeviation = results.reduce((sum, r) => {
    const midpoint = (r.expectedRange[0] + r.expectedRange[1]) / 2;
    return sum + Math.abs(r.nqi - midpoint);
  }, 0) / results.length;

  console.log(`   Average deviation from expected range midpoint: ${avgDeviation.toFixed(1)} points`);

  if (avgDeviation <= 5) {
    console.log(`   ✅ EXCELLENT: System is well-calibrated (<5 point deviation)`);
  } else if (avgDeviation <= 10) {
    console.log(`   ⚠️  ACCEPTABLE: System needs minor calibration (5-10 point deviation)`);
  } else {
    console.log(`   ❌ NEEDS WORK: System requires recalibration (>10 point deviation)`);
  }

  console.log('\n');
}

main().catch(console.error);
