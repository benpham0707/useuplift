/**
 * Test script for Narrative Workshop system
 * Tests the complete 5-stage pipeline with a sample essay
 */

import { analyzeNarrativeWorkshop } from './src/services/narrativeWorkshop/narrativeWorkshopOrchestrator';
import type { NarrativeEssayInput } from './src/services/narrativeWorkshop/types';

// Sample elite-tier essay for testing (based on patterns from ELITE_ESSAY_INSIGHTS.md)
const sampleEliteEssay = `The worst stench I had ever encountered hit me as I walked into the makeshift clinic.
I was 16, purple nitrite gloves on my shaking hands, standing in a room where a man's gangrene had progressed
to the point of amputation. This wasn't the medicine I'd imagined from Grey's Anatomy marathons.

For two weeks, I shadowed Dr. Martinez in rural Guatemala. She worked 14-hour days, treated 200 patients weekly,
earned less than my monthly allowance. Yet she smiled more genuinely than anyone I knew back home. The disconnect
between her joy and her circumstances gnawed at me.

On my seventh day, a mother brought her daughter—maybe 8 years old—with a fever of 104. No insurance. No money.
Dr. Martinez treated her anyway, using supplies from her personal stock. "Medicine isn't about payment," she said
in Spanish. "It's about seeing the person first."

That moment fractured something in me. I'd spent years optimizing my resume for selective college programs.
I'd volunteered at prestigious hospitals, but I'd never touched a patient. I'd shadowed renowned surgeons, but
I'd never asked about their why. I'd been building a narrative of success without understanding what success meant.

Back home, I started working at a free clinic in East Oakland. Less prestigious. No fancy equipment. But real
people with real problems. An 80-year-old woman with diabetes who couldn't afford insulin. A construction worker
with a broken hand who couldn't miss work. A teenage girl, scared and alone, who needed someone to just listen.

I've spent the past two years there—every Saturday, 8 AM to 4 PM. I've held the hands of people crying from pain
we couldn't treat. I've translated for Spanish-speaking patients, my high school lessons suddenly vital. I've
learned that medicine isn't the heroic surgery or the dramatic diagnosis. It's the daily choice to show up for
people society has forgotten.

The stench of that first day in Guatemala never left me. But neither did Dr. Martinez's smile. Medicine, I've
learned, isn't about glory. It's about the quiet decision to see people's humanity when the world looks away.
It's uncomfortable. It's unglamorous. And it's exactly where I need to be.`;

// Sample weak essay for testing (demonstrates common issues)
const sampleWeakEssay = `I have always been passionate about science and helping others. Ever since I was young,
I knew I wanted to make a difference in the world. This passion led me to volunteer at a hospital, where I learned
many valuable lessons about life and medicine.

At the hospital, I worked with various patients and doctors. It was a very challenging experience that required a
lot of hard work and dedication. I was involved in many different activities, from helping nurses to observing
surgeries. Through these experiences, I developed important skills like teamwork and communication.

One memorable experience was when I helped a patient who was very sick. It was difficult, but I learned that helping
others is very rewarding. This experience taught me that medicine is about more than just treating illness—it's about
caring for people as whole individuals.

Another important lesson I learned was the value of perseverance. There were many obstacles and challenges along the
way, but I never gave up. I pushed myself to work harder and be better every day. This determination will help me
succeed in college and in my future medical career.

Looking ahead, I am excited about the opportunities that college will provide. I hope to continue my passion for
medicine and make a positive impact on my community. Through hard work and dedication, I believe I can achieve my
goals and make my dreams come true. The journey will be challenging, but I am ready to face whatever comes my way.`;

async function testNarrativeWorkshop() {
  console.log('\n' + '='.repeat(100));
  console.log('NARRATIVE WORKSHOP - COMPREHENSIVE TEST');
  console.log('='.repeat(100) + '\n');

  try {
    // Test 1: Elite Essay
    console.log('\n📝 TEST 1: Elite-Tier Essay Analysis');
    console.log('─'.repeat(100) + '\n');

    const eliteInput: NarrativeEssayInput = {
      essayText: sampleEliteEssay,
      essayType: 'personal_statement',
      promptText: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      maxWords: 650,
      studentContext: {
        intendedMajor: 'Pre-Medicine',
        culturalBackground: 'Asian-American',
        voicePreference: 'understated'
      }
    };

    const eliteAnalysis = await analyzeNarrativeWorkshop(eliteInput);

    console.log('\n✅ ELITE ESSAY RESULTS:');
    console.log('─'.repeat(100));
    console.log(`   Overall Score: ${eliteAnalysis.overallScore}/100`);
    console.log(`   Impression: ${eliteAnalysis.impressionLabel}`);
    console.log(`   Expected: 85-95 (exceptional/compelling)`);
    console.log('');

    // Test 2: Weak Essay
    console.log('\n📝 TEST 2: Weak Essay Analysis');
    console.log('─'.repeat(100) + '\n');

    const weakInput: NarrativeEssayInput = {
      essayText: sampleWeakEssay,
      essayType: 'personal_statement',
      promptText: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      maxWords: 650,
      studentContext: {
        intendedMajor: 'Pre-Medicine',
        voicePreference: 'warm'
      }
    };

    const weakAnalysis = await analyzeNarrativeWorkshop(weakInput);

    console.log('\n✅ WEAK ESSAY RESULTS:');
    console.log('─'.repeat(100));
    console.log(`   Overall Score: ${weakAnalysis.overallScore}/100`);
    console.log(`   Impression: ${weakAnalysis.impressionLabel}`);
    console.log(`   Expected: 40-60 (developing/weak)`);
    console.log('');

    // Comparison
    console.log('\n📊 CALIBRATION CHECK:');
    console.log('─'.repeat(100));
    console.log(`   Elite score: ${eliteAnalysis.overallScore} (should be 85-95)`);
    console.log(`   Weak score: ${weakAnalysis.overallScore} (should be 40-60)`);
    console.log(`   Score spread: ${eliteAnalysis.overallScore - weakAnalysis.overallScore} points`);
    console.log(`   Calibration: ${eliteAnalysis.overallScore >= 85 && weakAnalysis.overallScore <= 60 ? '✅ PASSED' : '⚠️  NEEDS ADJUSTMENT'}`);

    console.log('\n' + '='.repeat(100));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);
    console.error('\nStack trace:', (error as Error).stack);
    process.exit(1);
  }
}

// Run tests
testNarrativeWorkshop();
