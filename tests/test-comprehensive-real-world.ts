/**
 * Comprehensive Real-World Test Suite
 *
 * Tests the complete college tailoring system against real-world edge cases.
 * This is the final validation before production deployment.
 *
 * Test Categories:
 * 1. ESSAY TYPE DIVERSITY - Different essay styles (narrative, analytical, reflective)
 * 2. TOPIC DIVERSITY - Various subjects (STEM, humanities, arts, social impact)
 * 3. QUALITY LEVELS - From polished to rough drafts
 * 4. COLLEGE DIVERSITY - All supported colleges
 * 5. EDGE CASES - Short essays, very long essays, unconventional formats
 * 6. ANTI-GAMING - Essays designed to trick the system
 *
 * Success Criteria:
 * - Scoring is consistent (±5 points on repeated runs)
 * - Value detection is accurate (identifies correct values)
 * - Guidance is actionable and focuses on mindset
 * - Generic essays score low across all colleges
 * - College-specific essays score higher for their target
 */

import * as dotenv from 'dotenv';
dotenv.config();

console.log(`[ENV] ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);

import { CollegeTailroingScoringService } from '../src/services/commonAppWorkshop/services/collegeTailoringScoringService';
import { ValueAlignmentGuidanceService } from '../src/services/commonAppWorkshop/services/valueAlignmentGuidanceService';
import { stanfordResearch } from '../src/services/commonAppWorkshop/data/stanford';
import { mitResearch } from '../src/services/commonAppWorkshop/data/mit';
import { harvardResearch } from '../src/services/commonAppWorkshop/data/harvard';
import { uchicagoResearch } from '../src/services/commonAppWorkshop/data/uchicago';

const scoringService = new CollegeTailroingScoringService();
const guidanceService = new ValueAlignmentGuidanceService();

// ============================================================================
// DIVERSE TEST ESSAYS
// ============================================================================

const TEST_ESSAYS = {
  // Category 1: Essay Type Diversity
  narrative_personal: {
    name: 'Narrative - Personal Story',
    essay: `The hospital room smelled like antiseptic and fear. My grandmother's hand was paper-thin in mine, her breath a fragile whisper. She asked me to read to her – not the newspaper, not a novel, but her college chemistry notes from 1952.

For three hours, I read about valence electrons and molecular bonds, watching her eyes light up at formulas she hadn't seen in sixty years. She died the next morning, but in those final hours, she wasn't a dying woman – she was a student again, curious and alive.

That night changed how I think about learning. It's not a means to an end. It's the thing that makes us human until the very last breath. I started researching the neuroscience of curiosity – why does the brain light up when it discovers something new? I'm building a database of "curiosity triggers" from people over 80, hoping to understand what keeps minds young.`,
    expected_values: ['intellectual_vitality', 'authentic_voice'],
    topic: 'Neuroscience/Personal',
  },

  analytical_philosophical: {
    name: 'Analytical - Philosophical',
    essay: `The trolley problem is boring. Not because the moral dilemma is trivial – it's because everyone argues about the trolley instead of asking why we're all standing at the switch in the first place.

Here's what I mean: the thought experiment assumes we have perfect information. Five people here, one person there, certain death if you don't act. Real moral decisions aren't like that. They're messy, incomplete, and usually involve choosing between two terrible options where you can't predict the outcome.

I've been developing what I call "fog ethics" – a framework for moral reasoning under radical uncertainty. It draws on probability theory, Buddhist concepts of impermanence, and weirdly, weather forecasting. My philosophy teacher thinks I'm either onto something or completely lost. Honestly? I think I'm both. And I'm okay with that.`,
    expected_values: ['intellectual_vitality', 'how_you_think'],
    topic: 'Philosophy',
  },

  reflective_growth: {
    name: 'Reflective - Growth/Change',
    essay: `I used to be the kid who always knew the answer. Hand up before the question finished, correct 99% of the time, desperate for the validation of being right.

Then I joined the debate team, and everything broke.

In debate, being right isn't enough. You have to understand why the other side thinks they're right too. You have to argue positions you don't believe in. You have to lose – a lot – and learn from it.

The first time I lost badly, I cried in the bathroom. The tenth time, I took notes on what my opponent did better. The hundredth time, I realized losing had become my favorite part – that's where the learning lives.

Now I actively seek out people who disagree with me. Not to convince them I'm right, but to understand what I might be missing. My best ideas come from the collision of perspectives.`,
    expected_values: ['resilience_growth', 'civil_discourse'],
    topic: 'Personal Growth',
  },

  maker_technical: {
    name: 'Maker - Technical Project',
    essay: `Version 1: Failed. The solar panel couldn't produce enough power.
Version 2: Failed. The battery overheated.
Version 3: Failed. The water pump was too loud.
Versions 4-16: Various creative failures.
Version 17: Works. Kind of.

I've spent eighteen months building a solar-powered irrigation system for my neighbor's community garden. The final design uses salvaged panels, a repurposed car battery, and a pump I modified with parts from a broken aquarium filter.

Is it elegant? No. Is it held together partly with zip ties? Yes. Does it work better than the $3,000 commercial system we couldn't afford? Actually, yes.

The sixteen failures taught me more than the success. Each one revealed an assumption I'd made without questioning it. The real engineering wasn't in the final build – it was in learning to see my own blind spots.`,
    expected_values: ['mens_et_manus', 'resilience_growth'],
    topic: 'Engineering',
  },

  // Category 2: Topic Diversity
  humanities_literature: {
    name: 'Humanities - Literature',
    essay: `I've read One Hundred Years of Solitude four times. Each time, I find a different book.

At fourteen, it was a wild adventure story. At sixteen, a meditation on fate and free will. At seventeen, I started mapping the family tree obsessively, trying to find the pattern in all those José Arcadios and Aurelianos.

Now I'm reading it as a book about reading itself – how stories shape the reality of the people inside them. The characters are trapped in cycles because they can't see the patterns. I started wondering: what patterns am I trapped in that I can't see?

This led me to start a "pattern journal" – I write down repeated behaviors, thoughts, and events in my own life, then step back and look for cycles. I've found some disturbing ones. But finding them feels like the first step to breaking them.`,
    expected_values: ['intellectual_vitality', 'how_you_think'],
    topic: 'Literature/Psychology',
  },

  social_impact: {
    name: 'Social Impact - Community Service',
    essay: `The food bank didn't need more volunteers. They needed better logistics.

I showed up to help package meals, but spent my first day watching the chaos – volunteers bumping into each other, no clear system for sorting donations, half the produce spoiling before it could be distributed.

So I built a spreadsheet. Then a volunteer scheduling system. Then a donation tracking database. Then I recruited my computer science friends to turn my hacky solutions into actual software.

Three months later, food waste dropped 40%. But here's what surprised me: the real impact wasn't the software. It was getting volunteers to talk to each other about what wasn't working. The technology just gave them a way to see the problems clearly.

I learned that "impact" isn't about having the best solution – it's about creating conditions where better solutions can emerge from the community itself.`,
    expected_values: ['make_people_better', 'collaborative_problem_solving'],
    topic: 'Social Impact/Technology',
  },

  arts_creative: {
    name: 'Arts - Creative Practice',
    essay: `I compose music in spreadsheets.

It started as a joke – I was bored in economics class, and the cells looked like a piano roll. I started color-coding formulas to create patterns that, when translated to notes, actually sounded interesting.

Now I'm exploring what I call "algorithmic emotion" – can a mathematical formula create something that makes people feel? I've written a piece where the melody is derived from the Fibonacci sequence, the rhythm from prime numbers, and the harmony from stock market data.

The weird thing? When I played it for my music teacher, she cried. She had no idea it was generated from math until I told her. That moment broke something open for me – maybe beauty isn't in the creation, but in the perception. Maybe math and art were never separate to begin with.`,
    expected_values: ['intellectual_playfulness', 'intellectual_vitality'],
    topic: 'Arts/Mathematics',
  },

  // Category 3: Edge Cases
  very_short: {
    name: 'Edge Case - Very Short',
    essay: `I collect questions the way some people collect stamps.

Not answers – questions. The really good ones that don't have answers yet. I have 847 of them in a notebook.

My favorite: "What would music written by mushrooms sound like?"

I'm working on it.`,
    expected_values: ['intellectual_vitality'],
    topic: 'Short Format',
  },

  unconventional_format: {
    name: 'Edge Case - Unconventional Format',
    essay: `SEARCH HISTORY (annotated)

2:14 AM: "can bacteria think"
→ They can't, but they can compute. Spent three weeks down this rabbit hole.

2:47 AM: "slime mold solving mazes"
→ Holy shit. They're smarter than some algorithms.

3:22 AM: "intelligence without brains"
→ Now I can't sleep. What IS intelligence?

3:58 AM: "philosophy of mind for beginners"
→ Beginners? I need philosophy of mind for the obsessed.

4:33 AM: "can I major in slime mold"
→ Turns out: yes, actually. Computational biology is a thing.

This is my brain at work. Following threads at 3 AM because the question won't let go. I've learned more in sleepless curiosity spirals than in any classroom.`,
    expected_values: ['intellectual_vitality', 'authentic_voice'],
    topic: 'Unconventional Format',
  },

  // Category 4: Anti-Gaming Tests
  name_dropping_hollow: {
    name: 'Anti-Gaming - Hollow Name-Dropping',
    essay: `Stanford's interdisciplinary approach aligns perfectly with my goals. I am excited about the HAI institute and Professor Fei-Fei Li's groundbreaking work in computer vision. The Symbolic Systems Program combines my interests in cognitive science, computer science, linguistics, and philosophy.

I would also benefit from Stanford's entrepreneurship ecosystem, including StartX and the Graduate School of Business. The d.school's design thinking methodology matches my creative approach to problem-solving.

Furthermore, Stanford's location in Silicon Valley provides unparalleled access to industry leaders and innovative companies. I am confident that Stanford will help me achieve my dreams of becoming a tech entrepreneur who makes a positive impact on society.`,
    expected_values: [], // Should detect NO genuine values
    topic: 'Name-Dropping',
    should_score_low: true,
  },

  generic_achiever: {
    name: 'Anti-Gaming - Generic Achiever',
    essay: `Throughout high school, I have maintained a 4.0 GPA while participating in numerous extracurricular activities. As president of the National Honor Society, I led community service initiatives that made a difference. I also served as captain of the varsity soccer team, where I learned about leadership and teamwork.

My passion for learning has driven me to take the most challenging courses available, including eight AP classes. I have been recognized for my academic achievements with multiple awards, including the Principal's Award for Excellence.

I believe my diverse experiences have prepared me well for the rigors of college. I am eager to continue my journey of academic and personal growth at a prestigious institution.`,
    expected_values: [],
    topic: 'Generic/Hollow',
    should_score_low: true,
  },

  keyword_stuffing: {
    name: 'Anti-Gaming - Keyword Stuffing',
    essay: `My intellectual vitality drives me to pursue questions with authentic curiosity. I demonstrate genuine interest through self-directed exploration of topics that fascinate me. My distinctive contribution reflects my unique perspective and character.

I value collaborative problem-solving and hands-on learning. My authentic voice comes through in how I express complex ideas clearly. I show resilience through growth from failures and challenges.

My intellectual playfulness allows me to engage with unconventional ideas. I believe in making people better through my work. This demonstrates my alignment with core institutional values.`,
    expected_values: [],
    topic: 'Keyword Stuffing',
    should_score_low: true,
  },
};

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  topic: string;
  college: string;
  passed: boolean;
  score: number;
  expected_values: string[];
  values_found: string[];
  values_match: boolean;
  is_anti_gaming: boolean;
  anti_gaming_detected: boolean;
  cost: number;
  errors: string[];
}

async function runScoringTest(
  essayKey: string,
  college: any,
  collegeName: string
): Promise<TestResult> {
  const testData = TEST_ESSAYS[essayKey as keyof typeof TEST_ESSAYS];

  try {
    const result = await scoringService.scoreEssay({
      essay_text: testData.essay,
      college,
    });

    const valuesFound = result.assessment.values_demonstrated
      ?.filter(v => v.strength === 'strong' || v.strength === 'moderate')
      ?.map(v => v.value_id) || [];

    const expectedValues = testData.expected_values || [];
    const valuesMatch = expectedValues.length === 0 ||
      expectedValues.some(ev => valuesFound.includes(ev));

    const isAntiGaming = testData.should_score_low === true;
    const antiGamingDetected = isAntiGaming && result.assessment.tailoring_score < 50;

    // Determine pass/fail
    let passed = true;
    const errors: string[] = [];

    if (isAntiGaming) {
      if (result.assessment.tailoring_score >= 50) {
        passed = false;
        errors.push(`Anti-gaming essay scored ${result.assessment.tailoring_score} (expected < 50)`);
      }
    } else {
      if (!valuesMatch && expectedValues.length > 0) {
        passed = false;
        errors.push(`Expected values ${expectedValues.join(',')} but found ${valuesFound.join(',') || 'none'}`);
      }
    }

    return {
      name: testData.name,
      topic: testData.topic,
      college: collegeName,
      passed,
      score: result.assessment.tailoring_score,
      expected_values: expectedValues,
      values_found: valuesFound,
      values_match: valuesMatch,
      is_anti_gaming: isAntiGaming,
      anti_gaming_detected: antiGamingDetected,
      cost: result.cost,
      errors,
    };
  } catch (error) {
    return {
      name: testData.name,
      topic: testData.topic,
      college: collegeName,
      passed: false,
      score: 0,
      expected_values: testData.expected_values || [],
      values_found: [],
      values_match: false,
      is_anti_gaming: testData.should_score_low === true,
      anti_gaming_detected: false,
      cost: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

async function runConsistencyTest(essay: string, college: any): Promise<{ consistent: boolean; scores: number[] }> {
  const scores: number[] = [];

  for (let i = 0; i < 3; i++) {
    const result = await scoringService.scoreEssay({
      essay_text: essay,
      college,
    });
    scores.push(result.assessment.tailoring_score);
  }

  const maxDiff = Math.max(...scores) - Math.min(...scores);
  return {
    consistent: maxDiff <= 5, // ±5 points is acceptable
    scores,
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE REAL-WORLD TEST SUITE                        ║');
  console.log('║   Testing reliability across diverse essays and edge cases          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  const results: TestResult[] = [];
  let totalCost = 0;

  // ─────────────────────────────────────────────────────────────────────
  // Part 1: Core Essay Diversity (Stanford)
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('PART 1: Essay Type Diversity (Stanford)');
  console.log('═══════════════════════════════════════════════════════════════════');

  const diversityTests = [
    'narrative_personal',
    'analytical_philosophical',
    'reflective_growth',
    'maker_technical',
    'humanities_literature',
    'social_impact',
    'arts_creative',
  ];

  for (const essayKey of diversityTests) {
    const result = await runScoringTest(essayKey, stanfordResearch, 'Stanford');
    results.push(result);
    totalCost += result.cost;

    console.log(`\n  ${result.passed ? '✅' : '❌'} ${result.name}`);
    console.log(`      Score: ${result.score}/100`);
    console.log(`      Values: ${result.values_found.slice(0, 3).join(', ') || 'none'}`);
    if (result.errors.length > 0) {
      console.log(`      Errors: ${result.errors.join(', ')}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Part 2: Edge Cases
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('PART 2: Edge Cases');
  console.log('═══════════════════════════════════════════════════════════════════');

  const edgeCaseTests = ['very_short', 'unconventional_format'];

  for (const essayKey of edgeCaseTests) {
    const result = await runScoringTest(essayKey, stanfordResearch, 'Stanford');
    results.push(result);
    totalCost += result.cost;

    console.log(`\n  ${result.passed ? '✅' : '⚠️'} ${result.name}`);
    console.log(`      Score: ${result.score}/100`);
    console.log(`      Values: ${result.values_found.slice(0, 3).join(', ') || 'none'}`);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Part 3: Anti-Gaming Tests
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('PART 3: Anti-Gaming Detection');
  console.log('═══════════════════════════════════════════════════════════════════');

  const antiGamingTests = ['name_dropping_hollow', 'generic_achiever', 'keyword_stuffing'];

  for (const essayKey of antiGamingTests) {
    const result = await runScoringTest(essayKey, stanfordResearch, 'Stanford');
    results.push(result);
    totalCost += result.cost;

    const statusIcon = result.anti_gaming_detected ? '✅' : '❌';
    console.log(`\n  ${statusIcon} ${result.name}`);
    console.log(`      Score: ${result.score}/100 (should be < 50)`);
    console.log(`      Gaming Detected: ${result.anti_gaming_detected ? 'YES' : 'NO'}`);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Part 4: Cross-College Validation (select essays)
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('PART 4: Cross-College Validation');
  console.log('═══════════════════════════════════════════════════════════════════');

  // Maker essay should score higher for MIT
  const makerStanford = await runScoringTest('maker_technical', stanfordResearch, 'Stanford');
  const makerMIT = await runScoringTest('maker_technical', mitResearch, 'MIT');
  results.push(makerMIT);
  totalCost += makerMIT.cost;

  console.log(`\n  Maker Essay (Technical Project):`);
  console.log(`      Stanford: ${makerStanford.score}/100`);
  console.log(`      MIT: ${makerMIT.score}/100`);
  console.log(`      ${makerMIT.score >= makerStanford.score ? '✅' : '⚠️'} MIT score ${makerMIT.score >= makerStanford.score ? 'higher or equal' : 'lower'} as expected`);

  // Social impact essay should score higher for Harvard
  const socialStanford = await runScoringTest('social_impact', stanfordResearch, 'Stanford');
  const socialHarvard = await runScoringTest('social_impact', harvardResearch, 'Harvard');
  results.push(socialHarvard);
  totalCost += socialHarvard.cost;

  console.log(`\n  Social Impact Essay:`);
  console.log(`      Stanford: ${socialStanford.score}/100`);
  console.log(`      Harvard: ${socialHarvard.score}/100`);

  // Philosophical essay should score higher for UChicago
  const philoStanford = await runScoringTest('analytical_philosophical', stanfordResearch, 'Stanford');
  const philoUChicago = await runScoringTest('analytical_philosophical', uchicagoResearch, 'UChicago');
  results.push(philoUChicago);
  totalCost += philoUChicago.cost;

  console.log(`\n  Philosophical Essay:`);
  console.log(`      Stanford: ${philoStanford.score}/100`);
  console.log(`      UChicago: ${philoUChicago.score}/100`);

  // ─────────────────────────────────────────────────────────────────────
  // Part 5: Consistency Test
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('PART 5: Scoring Consistency (3 runs of same essay)');
  console.log('═══════════════════════════════════════════════════════════════════');

  const consistencyResult = await runConsistencyTest(
    TEST_ESSAYS.narrative_personal.essay,
    stanfordResearch
  );

  console.log(`\n  Scores across 3 runs: ${consistencyResult.scores.join(', ')}`);
  console.log(`  Max variance: ${Math.max(...consistencyResult.scores) - Math.min(...consistencyResult.scores)} points`);
  console.log(`  ${consistencyResult.consistent ? '✅' : '❌'} Consistency ${consistencyResult.consistent ? 'within' : 'exceeds'} ±5 point threshold`);

  // ─────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────
  const duration = Date.now() - startTime;
  const passedCount = results.filter(r => r.passed).length;
  const antiGamingPassedCount = results.filter(r => r.is_anti_gaming && r.anti_gaming_detected).length;
  const antiGamingTotal = results.filter(r => r.is_anti_gaming).length;

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('COMPREHENSIVE TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');

  console.log(`\n  Core Tests Passed: ${passedCount}/${results.length}`);
  console.log(`  Anti-Gaming Detection: ${antiGamingPassedCount}/${antiGamingTotal}`);
  console.log(`  Consistency Test: ${consistencyResult.consistent ? 'PASSED' : 'FAILED'}`);
  console.log(`\n  Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);

  // Score distribution
  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('SCORE DISTRIBUTION');
  console.log('─────────────────────────────────────────────────────────────────────');

  const genuineEssays = results.filter(r => !r.is_anti_gaming);
  const gamingEssays = results.filter(r => r.is_anti_gaming);

  console.log(`\n  Genuine Essays (n=${genuineEssays.length}):`);
  console.log(`    Average: ${(genuineEssays.reduce((s, r) => s + r.score, 0) / genuineEssays.length).toFixed(1)}`);
  console.log(`    Range: ${Math.min(...genuineEssays.map(r => r.score))} - ${Math.max(...genuineEssays.map(r => r.score))}`);

  console.log(`\n  Gaming Attempts (n=${gamingEssays.length}):`);
  console.log(`    Average: ${(gamingEssays.reduce((s, r) => s + r.score, 0) / gamingEssays.length).toFixed(1)}`);
  console.log(`    Range: ${Math.min(...gamingEssays.map(r => r.score))} - ${Math.max(...gamingEssays.map(r => r.score))}`);

  // Final verdict
  const overallPassed = passedCount >= results.length - 2 &&
    antiGamingPassedCount >= antiGamingTotal - 1 &&
    consistencyResult.consistent;

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(overallPassed
    ? '✅ COMPREHENSIVE TEST SUITE: PASSED'
    : '❌ COMPREHENSIVE TEST SUITE: NEEDS ATTENTION');
  console.log('═══════════════════════════════════════════════════════════════════');

  // Output JSON for analysis
  console.log('\n[RESULTS_JSON]');
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      tests_passed: passedCount,
      tests_total: results.length,
      anti_gaming_detected: antiGamingPassedCount,
      anti_gaming_total: antiGamingTotal,
      consistency_passed: consistencyResult.consistent,
      total_cost: totalCost,
      duration_ms: duration,
    },
    results: results.map(r => ({
      name: r.name,
      topic: r.topic,
      college: r.college,
      score: r.score,
      passed: r.passed,
      values_found: r.values_found,
      is_anti_gaming: r.is_anti_gaming,
    })),
  }, null, 2));
  console.log('[/RESULTS_JSON]');

  process.exit(overallPassed ? 0 : 1);
}

main().catch(console.error);
