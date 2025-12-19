/**
 * Semantic Scoring Test
 *
 * Tests the new principles-based scoring system with diverse essay types:
 * 1. Conventional excellent essays (should score high on both systems)
 * 2. Unconventional excellent essays (semantic should recognize, pattern might miss)
 * 3. Feature-rich but performative essays (pattern might score high, semantic should catch)
 * 4. Authentic but rough essays (semantic should value authenticity)
 */

import { SemanticScoringService } from '../src/services/commonAppWorkshop/services/semanticScoringService';
import {
  CORE_WRITING_PRINCIPLES,
  TYPE_SPECIFIC_PRINCIPLES,
  PERFORMATIVE_INDICATORS
} from '../src/services/commonAppWorkshop/rubrics/writingPrinciples';
import type { SupplementalType } from '../src/data/commonAppSupplementalTypes';

// ============================================================================
// TEST ESSAYS - DIVERSE APPROACHES TO EXCELLENCE
// ============================================================================

interface TestEssay {
  name: string;
  type: SupplementalType;
  essay: string;
  expected_behavior: {
    should_recognize_as: 'excellent' | 'strong' | 'needs_work' | 'weak';
    unconventional: boolean;
    performative: boolean;
    key_strength?: string;
    key_weakness?: string;
  };
}

const TEST_ESSAYS: TestEssay[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVENTIONAL EXCELLENT - Should score high on both systems
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Conventional Excellent Why Us',
    type: 'why_us',
    essay: `When I emailed Professor Sarah Chen about her research on quantum error correction, I didn't expect a response. Three weeks later, I found myself on a video call with her, explaining my high school project on topological qubits. "You're thinking about this wrong," she said—and then spent an hour showing me why.

That conversation is why I want to study physics at MIT. Professor Chen's work on fault-tolerant quantum computing addresses exactly what I find most fascinating: the gap between theoretical elegance and practical implementation. Her 2023 paper on surface codes made me realize that the "messy" engineering problems I'd been avoiding were actually the most important ones.

But MIT isn't just about Professor Chen. It's about 8.06 (Quantum Physics III) taught by Professor Aram Harrow, whose lecture notes I've already worked through. It's about the iQuISE student group, where I'd finally have peers who understand why I spent my junior year trying to build a stabilizer code simulator. It's about UROP opportunities to actually contribute to the research I've been reading about from my bedroom.

I'd bring my own perspective to MIT: three years of running a quantum computing study group for high schoolers taught me that the hardest part of quantum mechanics isn't the math—it's the intuition. I want to work with MIT's Teaching+Learning Lab to develop visualization tools that could help more students make the conceptual leaps I struggled with.

MIT isn't just where I want to learn. It's where the questions I'm already asking might actually matter.`,
    expected_behavior: {
      should_recognize_as: 'excellent',
      unconventional: false,
      performative: false,
      key_strength: 'Deep research demonstrated through understanding, not just names',
      key_weakness: undefined
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNCONVENTIONAL EXCELLENT - Semantic should recognize, pattern might miss
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Poetic Intellectual Essay (No Numbers/Names)',
    type: 'intellectual',
    essay: `The river taught me something my textbooks never could.

I spent the summer after sophomore year at my grandmother's house in rural Oregon, where the Umpqua River runs behind her property. Every morning, I'd sit on the bank and watch the current shape the stones.

At first I was just avoiding my AP Chemistry summer work. But somewhere in the third week, I noticed that the stones didn't just get smoother—they got rounder. And not uniformly round. Some had flat faces where the current couldn't reach. Some had grooves where it concentrated.

I started photographing them. Measuring them with a ruler. Mapping the current patterns with sticks and timing how long it took debris to pass.

I never found the equation. I'm not sure there is one—the variables are too chaotic. But that's what I discovered: the stones weren't being polished toward some ideal shape. They were recording their history. Every groove was a story of how water moved around them.

My grandmother asked me once why I spent so much time at the river. I told her I was studying fluid dynamics. But that wasn't quite right. I was learning that science isn't just about finding patterns—it's about reading stories written in a language that doesn't use words.

I still don't know what I want to major in. But I know I want to study things that hold their history in their shape.`,
    expected_behavior: {
      should_recognize_as: 'excellent',
      unconventional: true,
      performative: false,
      key_strength: 'Genuine intellectual curiosity demonstrated through observation and questioning',
      key_weakness: undefined
    }
  },

  {
    name: 'Dialogue-Format Why Us (Unconventional Structure)',
    type: 'why_us',
    essay: `"So why Brown?"

It's the question everyone asks. My mom. My counselor. The interviewer whose face I can't read through the Zoom lag.

"Because of Open Curriculum."

They nod. Everyone says that.

"No, but actually. Not because I want to skip requirements—because I want to take requirements that don't exist."

The interviewer leans forward.

"I want to take neuroscience and philosophy and computer science in the same semester. Not as separate classes. As the same question: how do minds work? CLPS 0010 and PHIL 0540 and CSCI 1470 aren't supposed to be a sequence. But for me they are. Brown is the only place where that's not weird."

"A lot of students want to combine interests—"

"I've already started. I made a reading list from Brown syllabi I found online. I emailed Professor Michael Frank about his computational models of language acquisition. He actually responded. He told me I was asking the wrong question."

"And?"

"He was right. I spent three weeks figuring out why. That's what I want. Four years of someone telling me I'm wrong until I learn to be right."

"That's it? Someone to tell you you're wrong?"

"Someone who knows enough to know which wrong I am."`,
    expected_behavior: {
      should_recognize_as: 'strong',
      unconventional: true,
      performative: false,
      key_strength: 'Voice and authenticity; demonstrates genuine intellectual curiosity through format',
      key_weakness: 'Some research depth could be stronger'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMATIVE - Pattern might score high, semantic should catch
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Feature-Rich But Performative Why Us',
    type: 'why_us',
    essay: `I have dreamed of attending Stanford ever since I visited the campus during my freshman year. The moment I stepped onto Palm Drive and saw the Hoover Tower, I knew this was where I belonged.

Stanford's commitment to innovation perfectly aligns with my passion for entrepreneurship. The renowned CS106A course, taught by the legendary Professor Mehran Sahami, would provide me with the foundational skills I need to launch my startup. Professor Fei-Fei Li's groundbreaking work in computer vision inspires me to pursue AI research, and I am confident that CS231N would help me develop the deep learning expertise necessary for my future career.

Furthermore, Stanford's BASES program would enable me to connect my technical skills with my business acumen. I was deeply moved to learn that BASES has helped launch over 1,000 startups since 1996, demonstrating Stanford's unparalleled commitment to student entrepreneurship. Through BASES, I would have the opportunity to network with like-minded individuals who share my passion for innovation.

Additionally, Stanford's diverse and inclusive community would allow me to grow both personally and professionally. With over 70 different languages spoken on campus, I would have the invaluable opportunity to learn from peers with diverse perspectives and backgrounds.

I am confident that my leadership experience as President of my school's Entrepreneurship Club, combined with my technical skills from winning three hackathons, make me a perfect fit for Stanford's innovative community. I cannot wait to contribute to the Farm and make my mark on the world.`,
    expected_behavior: {
      should_recognize_as: 'needs_work',
      unconventional: false,
      performative: true,
      key_strength: 'Has specific details (names, programs)',
      key_weakness: 'Performative - sounds like what they think Stanford wants to hear, not genuine'
    }
  },

  {
    name: 'Humble-Brag Leadership Essay',
    type: 'leadership',
    essay: `I never set out to become a leader. I was just a quiet kid who liked to help people.

When I was elected Student Body President by the largest margin in our school's history—defeating a popular athlete despite being relatively unknown—I was genuinely surprised. I remember thinking, "Why would they choose me?"

But I quickly learned why. Under my leadership, our student government achieved unprecedented success. We raised $47,000 for local charities (breaking the previous record of $12,000), implemented a new mental health initiative that was featured in our local newspaper, and organized the first-ever cultural festival that brought together all 47 different nationalities represented at our school.

I'm not mentioning these accomplishments to brag. In fact, I often downplay them when people ask about my high school experience. What matters to me isn't the recognition—it's the relationships I built along the way.

The most rewarding moment wasn't receiving the state's Youth Leadership Award (though I'm grateful for the recognition). It was when a freshman told me that our mental health initiative made them feel seen for the first time. That's why I lead—not for awards, but for impact.

I don't consider myself a natural leader. I'm just someone who cares deeply about making a difference. If that makes me a leader, then I'm honored to accept the title.`,
    expected_behavior: {
      should_recognize_as: 'needs_work',
      unconventional: false,
      performative: true,
      key_strength: 'Has specific accomplishments',
      key_weakness: 'Classic humble-brag - claims modesty while making sure every accomplishment is noted'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTIC BUT ROUGH - Semantic should value authenticity
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Raw Authentic Challenge Essay',
    type: 'challenge',
    essay: `I didn't talk for three months after my dad left.

Not to my mom. Not to my brother. Not to my therapist, who my mom made me see twice a week and who I just stared at for 50 minutes while she tried different approaches.

The thing is, I had plenty to say. I wrote it all down in a notebook. Pages and pages about how unfair it was, how I hated him, how I was scared we'd have to move, how I wished he'd died instead of just left because at least then people would understand why I was so messed up.

My mom found the notebook. I expected her to be angry or sad or something. Instead she just said: "You should show this to someone."

I didn't. But I started talking again. Slowly. In fragments at first.

Now I can talk about it like this, in full sentences, without crying or freezing up. I still see the therapist. I still write in notebooks. The difference is I don't hide them anymore.

I don't know if this is a good college essay topic. My counselor said I should write about something that shows "growth and resilience." I guess this is that? I went from not talking to talking. From hiding to showing.

But honestly I'm still figuring it out. I'm not resilient yet. I'm just less frozen.`,
    expected_behavior: {
      should_recognize_as: 'strong',
      unconventional: true,
      performative: false,
      key_strength: 'Deeply authentic voice; genuine vulnerability with agency',
      key_weakness: 'Ending could be stronger, but the authenticity is valuable'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC/WEAK - Should score low on both systems
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Generic Why Major',
    type: 'why_major',
    essay: `I have always been passionate about computer science. Ever since I was young, I have been fascinated by technology and how it shapes our world.

My interest in CS began when I took my first programming class in middle school. I immediately fell in love with coding and knew that this was what I wanted to do with my life. The ability to create something from nothing using just logic and creativity is truly amazing to me.

Throughout high school, I have taken every CS class available and even taught myself additional programming languages. I have participated in several hackathons and coding competitions, which have further solidified my passion for this field.

I believe that computer science is the future. With AI and machine learning advancing rapidly, there are endless possibilities for innovation and discovery. I want to be at the forefront of this technological revolution.

By majoring in computer science, I hope to develop the skills necessary to create technology that will make a positive impact on society. I want to use my passion and dedication to solve real-world problems and make the world a better place.

I am confident that my enthusiasm and work ethic will help me succeed in this challenging field. I cannot wait to begin my journey in computer science and see where it takes me.`,
    expected_behavior: {
      should_recognize_as: 'weak',
      unconventional: false,
      performative: false,
      key_strength: undefined,
      key_weakness: 'Completely generic - could be written by anyone, shows no specific intellectual engagement'
    }
  }
];

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runSemanticScoringTests() {
  console.log('\x1b[1m' + '═'.repeat(80) + '\x1b[0m');
  console.log('\x1b[1mSEMANTIC SCORING TEST SUITE\x1b[0m');
  console.log('\x1b[1m' + '═'.repeat(80) + '\x1b[0m');
  console.log('\nTesting principles-based scoring with diverse essay types...\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\x1b[33m⚠ ANTHROPIC_API_KEY not set - running structural tests only\x1b[0m\n');
    runStructuralTests();
    return;
  }

  const service = new SemanticScoringService();
  const results: {
    name: string;
    expected: string;
    actual: string;
    match: boolean;
    performative_expected: boolean;
    performative_actual: boolean;
    unconventional_expected: boolean;
    unconventional_actual: boolean;
    score: number;
    reader_experience: string;
  }[] = [];

  for (const testEssay of TEST_ESSAYS) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\x1b[1m${testEssay.name}\x1b[0m`);
    console.log(`Type: ${testEssay.type}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const result = await service.scoreEssay(testEssay.essay, testEssay.type);

      const tierMatch = result.quality_tier === testEssay.expected_behavior.should_recognize_as;
      const performativeMatch = (result.authenticity_score < 6) === testEssay.expected_behavior.performative;
      const unconventionalMatch = result.unconventional_but_effective === testEssay.expected_behavior.unconventional;

      results.push({
        name: testEssay.name,
        expected: testEssay.expected_behavior.should_recognize_as,
        actual: result.quality_tier,
        match: tierMatch,
        performative_expected: testEssay.expected_behavior.performative,
        performative_actual: result.authenticity_score < 6,
        unconventional_expected: testEssay.expected_behavior.unconventional,
        unconventional_actual: result.unconventional_but_effective,
        score: result.total_score,
        reader_experience: result.reader_experience
      });

      // Display results
      console.log(`\n\x1b[36mScore: ${result.total_score}/100\x1b[0m`);
      console.log(`Tier: ${result.quality_tier} (expected: ${testEssay.expected_behavior.should_recognize_as})`);

      const tierStatus = tierMatch ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`${tierStatus} Tier match: ${tierMatch ? 'Yes' : 'No'}`);

      console.log(`\nAuthenticity Score: ${result.authenticity_score}/10`);
      const perfStatus = performativeMatch ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`${perfStatus} Performative detection: ${result.authenticity_score < 6 ? 'Detected' : 'Not detected'} (expected: ${testEssay.expected_behavior.performative ? 'Detected' : 'Not detected'})`);

      if (result.unconventional_but_effective) {
        console.log(`\n\x1b[33m★ Unconventional but effective:\x1b[0m ${result.unconventional_notes}`);
      }

      console.log(`\n\x1b[36mCore Strength:\x1b[0m ${result.core_strength}`);
      console.log(`\x1b[36mCore Weakness:\x1b[0m ${result.core_weakness || 'None identified'}`);
      console.log(`\n\x1b[36mReader Experience:\x1b[0m ${result.reader_experience}`);

      // Principle scores summary
      console.log('\n\x1b[1mPrinciple Scores:\x1b[0m');
      for (const ps of result.principle_scores) {
        const color = ps.score >= 8 ? '\x1b[32m' : ps.score >= 6 ? '\x1b[33m' : '\x1b[31m';
        console.log(`  ${color}${ps.score}/10\x1b[0m ${ps.principle_name}`);
      }

    } catch (error) {
      console.error(`\x1b[31mError scoring essay: ${error}\x1b[0m`);
      results.push({
        name: testEssay.name,
        expected: testEssay.expected_behavior.should_recognize_as,
        actual: 'ERROR',
        match: false,
        performative_expected: testEssay.expected_behavior.performative,
        performative_actual: false,
        unconventional_expected: testEssay.expected_behavior.unconventional,
        unconventional_actual: false,
        score: 0,
        reader_experience: 'Error occurred'
      });
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('\x1b[1mTEST SUMMARY\x1b[0m');
  console.log(`${'═'.repeat(80)}\n`);

  const tierMatches = results.filter(r => r.match).length;
  const performativeMatches = results.filter(r => r.performative_expected === r.performative_actual).length;

  console.log(`Tier Recognition: ${tierMatches}/${results.length}`);
  console.log(`Performative Detection: ${performativeMatches}/${results.length}`);

  console.log('\n\x1b[1mDetailed Results:\x1b[0m');
  for (const r of results) {
    const status = r.match ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`${status} ${r.name}: ${r.score}/100 (${r.actual}, expected ${r.expected})`);
  }

  if (tierMatches === results.length) {
    console.log('\n\x1b[32m✓ All tier recognitions correct\x1b[0m');
  }
}

// ============================================================================
// STRUCTURAL TESTS (No API needed)
// ============================================================================

function runStructuralTests() {
  console.log('\x1b[1mSTRUCTURAL VALIDATION\x1b[0m');
  console.log('─'.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Core principles defined
  const principleCount = CORE_WRITING_PRINCIPLES.length;
  if (principleCount === 6) {
    console.log(`\x1b[32m✓\x1b[0m Core writing principles: ${principleCount}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m Expected 6 core principles, got ${principleCount}`);
    failed++;
  }

  // Test 2: All principles have required fields
  let allPrinciplesComplete = true;
  for (const p of CORE_WRITING_PRINCIPLES) {
    if (!p.reader_effect || !p.valid_approaches.length || !p.misconceptions.length) {
      allPrinciplesComplete = false;
      console.log(`\x1b[31m✗\x1b[0m Principle ${p.id} missing required fields`);
      failed++;
    }
  }
  if (allPrinciplesComplete) {
    console.log(`\x1b[32m✓\x1b[0m All core principles complete`);
    passed++;
  }

  // Test 3: Type-specific principles for all 14 types
  const types: SupplementalType[] = [
    'why_us', 'why_major', 'community', 'diversity', 'intellectual',
    'extracurricular', 'challenge', 'leadership', 'creative', 'values',
    'future_goals', 'additional_info', 'short_answer', 'optional'
  ];

  let allTypesHavePrinciples = true;
  for (const t of types) {
    if (!TYPE_SPECIFIC_PRINCIPLES[t]) {
      allTypesHavePrinciples = false;
      console.log(`\x1b[31m✗\x1b[0m Missing principles for type: ${t}`);
      failed++;
    }
  }
  if (allTypesHavePrinciples) {
    console.log(`\x1b[32m✓\x1b[0m All 14 types have principles defined`);
    passed++;
  }

  // Test 4: Performative indicators defined
  const indicatorCount = PERFORMATIVE_INDICATORS.length;
  if (indicatorCount >= 5) {
    console.log(`\x1b[32m✓\x1b[0m Performative indicators: ${indicatorCount}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m Expected at least 5 performative indicators, got ${indicatorCount}`);
    failed++;
  }

  // Test 5: Each type has reader_question defined
  let allHaveReaderQuestion = true;
  for (const t of types) {
    if (!TYPE_SPECIFIC_PRINCIPLES[t].reader_question) {
      allHaveReaderQuestion = false;
      console.log(`\x1b[31m✗\x1b[0m Type ${t} missing reader_question`);
      failed++;
    }
  }
  if (allHaveReaderQuestion) {
    console.log(`\x1b[32m✓\x1b[0m All types have reader_question defined`);
    passed++;
  }

  // Test 6: Excellence paths are diverse (not formulaic)
  let excellencePathsDiverse = true;
  for (const t of types) {
    const paths = TYPE_SPECIFIC_PRINCIPLES[t].excellence_paths;
    if (paths.length < 4) {
      excellencePathsDiverse = false;
      console.log(`\x1b[31m✗\x1b[0m Type ${t} has only ${paths.length} excellence paths (need diversity)`);
      failed++;
    }
  }
  if (excellencePathsDiverse) {
    console.log(`\x1b[32m✓\x1b[0m All types have diverse excellence paths (4+)`);
    passed++;
  }

  // Test 7: Misconceptions defined (shows principle-based thinking)
  let hasMisconceptions = true;
  for (const p of CORE_WRITING_PRINCIPLES) {
    if (p.misconceptions.length < 3) {
      hasMisconceptions = false;
      console.log(`\x1b[31m✗\x1b[0m Principle ${p.id} needs more misconceptions`);
      failed++;
    }
  }
  if (hasMisconceptions) {
    console.log(`\x1b[32m✓\x1b[0m All principles have misconceptions documented`);
    passed++;
  }

  console.log(`\n\x1b[1mStructural Tests: ${passed} passed, ${failed} failed\x1b[0m`);

  if (failed === 0) {
    console.log('\n\x1b[32m✓ ALL STRUCTURAL TESTS PASSED\x1b[0m');
  } else {
    console.log('\n\x1b[31m✗ Some structural tests failed\x1b[0m');
    process.exit(1);
  }
}

// Run tests
runSemanticScoringTests();
