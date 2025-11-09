/**
 * BLIND VALIDATION TEST
 *
 * Test essays WITHOUT revealing their quality level to the system.
 * This validates that the system accurately assesses narrative strength
 * based on content alone, not expectations.
 *
 * After scoring, we'll reveal the actual quality level and see if the
 * system correctly ranked them.
 */

import { analyzeEntry } from '../src/core/analysis/engine';
import { ExperienceEntry } from '../src/core/types/experience';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// BLIND TEST ENTRIES (quality level hidden from system)
// ============================================================================

const BLIND_TEST_ENTRIES: Array<{
  id: string;
  entry: ExperienceEntry;
  actualQuality: 'excellent' | 'good' | 'medium' | 'weak';
  source: string;
}> = [
  // ========================================================================
  // ENTRY A (Quality: ???)
  // ========================================================================
  {
    id: 'A',
    actualQuality: 'excellent',
    source: 'Harvard accepted - Community Music School',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Community Music Teacher',
      organization: 'Community Arts Center',
      role: 'Volunteer Instructor',
      category: 'service',
      description_original: `Every Saturday at 9am, I unlock room 3B and arrange five folding chairs in a semi-circle. By 9:15, my students arrive: Miguel (7, never touched a guitar), Sarah (9, can't read sheet music), twin brothers who fight over the only left-handed instrument.

I don't teach music theory. I teach "find the note that sounds like your favorite color." Miguel said blue sounded like the G string, third fret. He was right—that's B flat. Sarah said purple was all the strings at once. Also right—that's called a chord.

After three months, Miguel played "Happy Birthday" for his abuela. Missed two notes, didn't care, she cried anyway. Sarah wrote her first song: "My Dog Has Three Legs Now." The twins finally agreed that taking turns made both of them sound better.

The real lesson wasn't about music. It was about showing up for people who need 45 minutes where someone believes they can do something they've never done before. That's what all good teaching is.`,
      hours_per_week: 3,
      weeks_per_year: 42,
      start_date: '2023-01-01',
      end_date: 'Present',
      time_span: 'January 2023 - Present',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY B (Quality: ???)
  // ========================================================================
  {
    id: 'B',
    actualQuality: 'medium',
    source: 'State school accepted - Student Government',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Student Council Vice President',
      organization: 'High School Student Government',
      role: 'Vice President',
      category: 'leadership',
      description_original: `As Vice President of Student Council, I was responsible for coordinating school events and managing student concerns. I worked closely with the President and faculty advisors to implement new policies that improved student life.

My major accomplishment was organizing our school's first-ever mental health awareness week. I recruited speakers, coordinated with the counseling department, and promoted the event through social media. Over 300 students attended at least one session, and we distributed 500+ mental health resource packets.

I also served on the budget committee, helping allocate $15,000 in student activity funds. This role taught me about financial responsibility and the importance of transparent decision-making. Through this experience, I developed strong organizational and communication skills that will serve me well in college.`,
      hours_per_week: 4,
      weeks_per_year: 36,
      start_date: '2023-09-01',
      end_date: '2024-06-15',
      time_span: 'September 2023 - June 2024',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY C (Quality: ???)
  // ========================================================================
  {
    id: 'C',
    actualQuality: 'weak',
    source: 'Rejected from selective schools - Generic volunteering',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Hospital Volunteer',
      organization: 'Community Medical Center',
      role: 'Volunteer',
      category: 'service',
      description_original: `I was passionate about healthcare and eager to contribute to my community, so I volunteered at our local hospital. I was responsible for assisting staff, helping patients, and performing various administrative tasks.

This experience was incredibly rewarding and taught me the value of compassion and dedication. I learned about the healthcare system and gained valuable insights into the medical profession. Working with diverse patients taught me cultural sensitivity and effective communication.

I am grateful for this opportunity and the lessons I learned. The experience reinforced my desire to pursue a career in healthcare and demonstrated the importance of service to others. I look forward to continuing this commitment in college.`,
      hours_per_week: 3,
      weeks_per_year: 24,
      start_date: '2023-09-01',
      end_date: '2024-05-31',
      time_span: 'September 2023 - May 2024',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY D (Quality: ???)
  // ========================================================================
  {
    id: 'D',
    actualQuality: 'excellent',
    source: 'MIT accepted - Robotics with deep technical insight',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Robotics Team - Controls Engineer',
      organization: 'FIRST Robotics Team 5472',
      role: 'Controls Lead',
      category: 'academic',
      description_original: `Week 3: Our autonomous routine scored 8 points. We needed 24 to qualify. The problem wasn't the code—it was my assumption that encoders told truth. They don't. Encoder drift compounds over distance. By the time our robot reached the scoring zone, it thought it was 14 inches left of reality.

I spent two weeks reading papers on Kalman filtering and dead reckoning. Implemented a sensor fusion algorithm combining encoders, gyroscope, and computer vision. First test: 23 points. Second test: 27 points. By competition: consistent 25-28.

What I learned wasn't about robotics. It was about the gap between theoretical math and physical reality. Your elegant algorithm means nothing if you don't account for wheel slip, battery voltage drop, and the fact that wood floors aren't perfectly level. The best code is code that expects the world to be messy.

Our team placed 7th at regionals. But more importantly, I taught three sophomores that debugging isn't about finding the bug—it's about questioning which of your assumptions is wrong.`,
      hours_per_week: 15,
      weeks_per_year: 20,
      start_date: '2023-09-01',
      end_date: '2024-03-15',
      time_span: 'September 2023 - March 2024',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY E (Quality: ???)
  // ========================================================================
  {
    id: 'E',
    actualQuality: 'good',
    source: 'UC Berkeley accepted - Environmental advocacy',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Environmental Club President',
      organization: 'School Environmental Action Club',
      role: 'Founder & President',
      category: 'leadership',
      description_original: `I founded our Environmental Action Club after noticing that our school recycling program was broken—bins everywhere, but everything went to the same dumpster. Talked to our custodial staff (they'd been complaining about this for years), researched actual recycling contracts, and discovered our district had canceled the program in 2019 due to budget cuts.

Spent four months attending school board meetings, presenting contamination data, and working with a local recycling company to create a pilot program. We finally got approval to restart recycling in March 2024. Our club trained 40 student "recycling monitors" and created visual guides for each classroom.

Results so far: 2.3 tons of material diverted from landfills in three months. More importantly, the district extended the program to two other schools next year. The biggest lesson wasn't about environmentalism—it was about understanding that change requires partnerships with the people who actually do the work, not just good intentions.`,
      hours_per_week: 6,
      weeks_per_year: 38,
      start_date: '2023-01-01',
      end_date: 'Present',
      time_span: 'January 2023 - Present',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY F (Quality: ???)
  // ========================================================================
  {
    id: 'F',
    actualQuality: 'medium',
    source: 'Mid-tier college - Sports team',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Varsity Soccer Player',
      organization: 'High School Varsity Soccer',
      role: 'Team Captain',
      category: 'athletics',
      description_original: `As captain of the varsity soccer team, I practiced six days per week and competed in 18 games per season. My role involved leading team warmups, organizing practice drills, and serving as a liaison between players and coaches.

Under my leadership, our team improved from a 6-12 record to 11-7, making playoffs for the first time in five years. I focused on team building through pre-game meals and group study sessions. Our team GPA increased from 3.1 to 3.5 during my captaincy.

I also mentored younger players, helping three freshmen transition to varsity level play. This experience taught me about leadership, dedication, and how to motivate teammates through both wins and losses. These skills will be valuable in college and beyond.`,
      hours_per_week: 12,
      weeks_per_year: 32,
      start_date: '2022-08-01',
      end_date: '2024-06-01',
      time_span: 'August 2022 - June 2024',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY G (Quality: ???)
  // ========================================================================
  {
    id: 'G',
    actualQuality: 'excellent',
    source: 'Stanford accepted - Independent research project',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Independent CS Research',
      organization: 'Self-directed',
      role: 'Researcher',
      category: 'research',
      description_original: `My grandmother has Parkinson's. She can't text anymore—her hands shake too much to tap small keys. I spent June and July building her a voice-to-text app that actually understands her accent (Vietnamese + tremor-affected speech = disaster for standard speech recognition).

Initial accuracy: 34%. Turns out, training datasets don't include elderly Vietnamese speakers with motor disorders. I recorded 47 hours of my grandmother speaking, manually transcribed everything, then fine-tuned a transformer model on this dataset. Accuracy jumped to 78%, then 83% after adding context awareness.

The app isn't groundbreaking AI research. But my grandmother sent 142 texts last month. She joined the family group chat. She sends me recipes I can't read (she forgets to use English), but she's happy.

What I learned: technical problems are only interesting when they're someone's actual problem. The gap between "cool algorithm" and "my grandmother can text her grandkids" is where engineering becomes meaningful.`,
      hours_per_week: 20,
      weeks_per_year: 10,
      start_date: '2024-06-01',
      end_date: '2024-08-15',
      time_span: 'June 2024 - August 2024',
      version: 1,
    }
  },

  // ========================================================================
  // ENTRY H (Quality: ???)
  // ========================================================================
  {
    id: 'H',
    actualQuality: 'weak',
    source: 'Generic application - Library volunteer',
    entry: {
      id: uuidv4(),
      user_id: uuidv4(),
      title: 'Library Assistant',
      organization: 'Public Library',
      role: 'Volunteer',
      category: 'service',
      description_original: `I volunteered at the public library where I was responsible for shelving books, assisting patrons, and maintaining the reading areas. I was dedicated to ensuring that library operations ran smoothly and efficiently.

During my time volunteering, I learned about organization, time management, and customer service. I interacted with diverse community members and gained an appreciation for the important role libraries play in education and community building.

This experience taught me the value of hard work and community service. It reinforced my belief that small contributions can make a meaningful impact on society. I am grateful for the opportunity and look forward to continuing to serve my community.`,
      hours_per_week: 3,
      weeks_per_year: 30,
      start_date: '2023-06-01',
      end_date: '2024-05-31',
      time_span: 'June 2023 - May 2024',
      version: 1,
    }
  },
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface BlindTestResult {
  id: string;
  nqi: number;
  authenticity: number;
  voice: number;
  actualQuality: string;
  predictedQuality: string;
  correct: boolean;
  source: string;
}

function predictQualityFromScore(nqi: number): string {
  if (nqi >= 80) return 'excellent';
  if (nqi >= 70) return 'good';
  if (nqi >= 55) return 'medium';
  return 'weak';
}

async function runBlindTest() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          BLIND VALIDATION TEST                                ║');
  console.log('║                                                                               ║');
  console.log('║  Testing essays WITHOUT revealing quality level to the system.                ║');
  console.log('║  Can it accurately identify excellence from mediocrity?                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results: BlindTestResult[] = [];

  // Shuffle entries so system can't detect patterns
  const shuffled = [...BLIND_TEST_ENTRIES].sort(() => Math.random() - 0.5);

  for (const test of shuffled) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`ANALYZING ENTRY ${test.id}: ${test.entry.title}`);
    console.log(`${'='.repeat(80)}`);

    const result = await analyzeEntry(test.entry, { depth: 'standard' });

    const nqi = result.report.narrative_quality_index;
    const voiceScore = result.report.categories.find(c => c.name.includes('Voice'))?.score_0_to_10 || 0;
    const predictedQuality = predictQualityFromScore(nqi);
    const correct = predictedQuality === test.actualQuality;

    console.log(`\n   📊 Score: ${nqi}/100`);
    console.log(`   🎭 Voice: ${voiceScore}/10`);
    console.log(`   ✨ Authenticity: ${result.authenticity.authenticity_score}/10`);
    console.log(`   📝 Label: ${result.report.reader_impression_label}`);

    results.push({
      id: test.id,
      nqi,
      authenticity: result.authenticity.authenticity_score,
      voice: voiceScore,
      actualQuality: test.actualQuality,
      predictedQuality,
      correct,
      source: test.source,
    });

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // REVEAL ACTUAL QUALITY AND COMPARE
  // ============================================================================

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         REVEALING ACTUAL QUALITY...                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Sort by actual quality
  const qualityOrder = { excellent: 0, good: 1, medium: 2, weak: 3 };
  results.sort((a, b) => qualityOrder[a.actualQuality] - qualityOrder[b.actualQuality]);

  console.log('ENTRY | ACTUAL      | PREDICTED   | SCORE | CORRECT | SOURCE');
  console.log('-'.repeat(80));

  results.forEach(r => {
    const status = r.correct ? '✅' : '❌';
    const actualPad = r.actualQuality.padEnd(11);
    const predPad = r.predictedQuality.padEnd(11);
    console.log(`  ${r.id}   | ${actualPad} | ${predPad} | ${r.nqi.toString().padStart(5)}/100 | ${status}   | ${r.source}`);
  });

  // ============================================================================
  // ACCURACY ANALYSIS
  // ============================================================================

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            ACCURACY ANALYSIS                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const correctCount = results.filter(r => r.correct).length;
  const accuracy = (correctCount / results.length) * 100;

  console.log(`Overall Accuracy: ${correctCount}/${results.length} (${accuracy.toFixed(1)}%)\n`);

  // By quality level
  const byQuality: Record<string, { correct: number; total: number; avgScore: number }> = {
    excellent: { correct: 0, total: 0, avgScore: 0 },
    good: { correct: 0, total: 0, avgScore: 0 },
    medium: { correct: 0, total: 0, avgScore: 0 },
    weak: { correct: 0, total: 0, avgScore: 0 },
  };

  results.forEach(r => {
    byQuality[r.actualQuality].total++;
    if (r.correct) byQuality[r.actualQuality].correct++;
    byQuality[r.actualQuality].avgScore += r.nqi;
  });

  console.log('Accuracy by Quality Level:');
  console.log('-'.repeat(80));
  Object.entries(byQuality).forEach(([quality, stats]) => {
    if (stats.total === 0) return;
    const pct = (stats.correct / stats.total) * 100;
    const avg = stats.avgScore / stats.total;
    console.log(`  ${quality.padEnd(12)}: ${stats.correct}/${stats.total} correct (${pct.toFixed(0)}%) | Avg score: ${avg.toFixed(1)}/100`);
  });

  // Score distribution
  console.log('\n\nScore Distribution:');
  console.log('-'.repeat(80));

  const excellent = results.filter(r => r.actualQuality === 'excellent');
  const good = results.filter(r => r.actualQuality === 'good');
  const medium = results.filter(r => r.actualQuality === 'medium');
  const weak = results.filter(r => r.actualQuality === 'weak');

  console.log(`\nExcellent essays (should score 80+):`);
  excellent.forEach(r => console.log(`  Entry ${r.id}: ${r.nqi}/100 ${r.nqi >= 80 ? '✅' : '❌'}`));

  console.log(`\nGood essays (should score 70-79):`);
  good.forEach(r => console.log(`  Entry ${r.id}: ${r.nqi}/100 ${r.nqi >= 70 && r.nqi < 80 ? '✅' : '❌'}`));

  console.log(`\nMedium essays (should score 55-69):`);
  medium.forEach(r => console.log(`  Entry ${r.id}: ${r.nqi}/100 ${r.nqi >= 55 && r.nqi < 70 ? '✅' : '❌'}`));

  console.log(`\nWeak essays (should score <55):`);
  weak.forEach(r => console.log(`  Entry ${r.id}: ${r.nqi}/100 ${r.nqi < 55 ? '✅' : '❌'}`));

  // Final assessment
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('FINAL ASSESSMENT:');
  console.log('═'.repeat(80));

  if (accuracy >= 85) {
    console.log('\n✅ EXCELLENT: System accurately identifies essay quality without bias');
    console.log('   The grading system is production-ready and reliable.');
  } else if (accuracy >= 70) {
    console.log('\n⚠️  GOOD: System generally accurate but has some misclassifications');
    console.log('   Review specific failures to identify calibration improvements.');
  } else {
    console.log('\n❌ NEEDS WORK: System struggles to accurately assess quality');
    console.log('   Significant recalibration required before production use.');
  }

  console.log('\n');
}

runBlindTest().catch(console.error);
