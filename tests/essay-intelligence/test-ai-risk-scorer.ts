/**
 * Test: AI Risk Scorer — Heuristic Authenticity Detection
 * Run: npx tsx tests/test-ai-risk-scorer.ts
 * No API key required — pure heuristic scoring (< 50ms per assessment)
 *
 * Tests AIRiskScorer with 5 AI-like texts and 5 human-like texts.
 * Verifies separation between AI and human writing styles.
 */

import { aiRiskScorer } from '../../src/services/authenticity';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

// ============================================================================
// AI-GENERATED TEXTS (designed to trigger AI detection heuristics)
// ============================================================================

const AI_TEXTS = [
  // 1. Heavy "furthermore/delve/tapestry" usage
  `Furthermore, this experience allowed me to delve deeper into the rich tapestry of community service. The multifaceted nature of volunteering has fundamentally shaped my perspective on civic engagement. Moreover, the interconnected web of relationships I forged during this period has been truly transformative. Through this journey, I have come to appreciate the nuanced complexities of societal contribution.`,

  // 2. Very uniform sentence lengths, hedging
  `This activity taught me about leadership. I learned to work with many people. The experience helped me grow as a person. It seems that challenges often lead to growth. I believe that teamwork is very important. In many ways this shaped who I am. It would appear that dedication pays off. Perhaps the most important lesson was perseverance. I think that everyone should volunteer.`,

  // 3. Generic reflections and "I learned that" patterns
  `I learned that true leadership requires empathy and understanding. I discovered that the power of community lies in its collective spirit. I realized that every challenge presents an opportunity for growth. I came to understand that meaningful change begins with individual action. I found that the most rewarding experiences are those that push us beyond our comfort zones. I believe that education is the cornerstone of progress.`,

  // 4. Heavy hedging and qualifiers throughout
  `It could be argued that this experience was somewhat transformative in nature. One might say that the various aspects of this opportunity were quite beneficial. It is worth noting that the collaborative environment fostered a sense of belonging. To some extent, the challenges encountered during this period were rather instructive. It is perhaps fair to say that the overall experience contributed significantly to personal development.`,

  // 5. Heavy banned terms + adverbs + generic reflections
  `I am incredibly passionate about leveraging transformative approaches to foster holistic community engagement. Furthermore, I have come to understand that navigating the nuanced landscape of civic responsibility requires a multifaceted paradigm shift. This experience taught me that one must delve deeper to truly appreciate the tapestry of interconnected social dynamics. I learned that embracing these challenges has fundamentally shaped my perspective.`,
];

// ============================================================================
// HUMAN-WRITTEN TEXTS (authentic student voice markers)
// ============================================================================

const HUMAN_TEXTS = [
  // 1. Specific details, proper nouns, varied sentence lengths
  `The first time Mrs. Chen handed me the violin at Riverside Community Music School, I held it wrong. Like, completely backwards. She didn't laugh. Just repositioned my chin and said "everyone starts somewhere." That was September 2022. By March I was playing Twinkle Twinkle at the spring recital — badly — while my mom recorded everything on her cracked iPhone.`,

  // 2. Emotional specificity, fragments, natural voice
  `3am. The gym lights buzz overhead like angry bees. My hands are raw from bar work and I can barely grip a pencil. But Coach Davis says nationals are in six weeks and I haven't landed my Yurchenko vault clean once. Not once. So I chalk up again. Because the thing about gymnastics is — it doesn't care how tired you are.`,

  // 3. Dialogue, scene-setting, authentic first person
  `"You can't just show up with no resume and expect a job," my dad said over breakfast. He was right. I was seventeen with zero work experience and a dream of saving enough for a laptop. So I walked into Patel's Grocery on 5th and asked Mr. Patel directly. He squinted at me. "You know how to stock shelves?" "I can learn." He hired me that day.`,

  // 4. Vulnerability without generic phrasing
  `When the school counselor called me out of AP Bio to tell me about Dad's accident, I remember thinking about my lab report. Weird, right? Like my brain just... refused to process it. I finished the titration that afternoon. Got a 97. Went home and found Mom sitting on the kitchen floor crying. That's when it became real.`,

  // 5. Cultural specificity, natural rhythm
  `Every Sunday my abuela makes tamales. Not the frozen kind from Trader Joe's — real ones, with masa she grinds herself. It takes six hours. She's been doing it for forty years and she still burns herself on the steamer. "Mija, come help," she says, even though I'm terrible at spreading the masa evenly. Mine always come out lopsided. But she wraps them anyway.`,
];

async function main() {
  console.log('\n=== AI Risk Scorer Test ===\n');

  // --- Score AI texts ---
  console.log('--- AI-Generated Texts ---\n');
  const aiScores: number[] = [];
  const aiTimings: number[] = [];

  for (let i = 0; i < AI_TEXTS.length; i++) {
    const start = performance.now();
    const assessment = aiRiskScorer.assessRisk(AI_TEXTS[i]);
    const elapsed = performance.now() - start;
    aiTimings.push(elapsed);
    aiScores.push(assessment.overallRisk);

    console.log(`  AI Text ${i + 1}: score=${assessment.overallRisk}, level=${assessment.riskLevel}, flags=${assessment.flaggedPassages.length}, ${elapsed.toFixed(1)}ms`);
  }

  // --- Score Human texts ---
  console.log('\n--- Human-Written Texts ---\n');
  const humanScores: number[] = [];
  const humanTimings: number[] = [];

  for (let i = 0; i < HUMAN_TEXTS.length; i++) {
    const start = performance.now();
    const assessment = aiRiskScorer.assessRisk(HUMAN_TEXTS[i]);
    const elapsed = performance.now() - start;
    humanTimings.push(elapsed);
    humanScores.push(assessment.overallRisk);

    console.log(`  Human Text ${i + 1}: score=${assessment.overallRisk}, level=${assessment.riskLevel}, flags=${assessment.flaggedPassages.length}, ${elapsed.toFixed(1)}ms`);
  }

  // --- Statistical analysis ---
  console.log('\n--- Score Analysis ---\n');

  const aiMean = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
  const humanMean = humanScores.reduce((a, b) => a + b, 0) / humanScores.length;
  const gap = aiMean - humanMean;

  console.log(`  AI mean score: ${aiMean.toFixed(1)}`);
  console.log(`  Human mean score: ${humanMean.toFixed(1)}`);
  console.log(`  Score gap: ${gap.toFixed(1)}`);

  assert(aiMean > 20, `AI mean score > 20 (got: ${aiMean.toFixed(1)})`);
  assert(humanMean < 15, `Human mean score < 15 (got: ${humanMean.toFixed(1)})`);
  assert(gap > 15, `Score gap > 15 (got: ${gap.toFixed(1)})`);

  // --- All AI texts should have flagged passages ---
  console.log('\n--- Flagged Passages ---\n');

  for (let i = 0; i < AI_TEXTS.length; i++) {
    const assessment = aiRiskScorer.assessRisk(AI_TEXTS[i]);
    assert(
      assessment.flaggedPassages.length > 0,
      `AI Text ${i + 1}: has flagged passages (${assessment.flaggedPassages.length})`
    );
  }

  // --- Performance: all assessments < 50ms ---
  console.log('\n--- Performance ---\n');

  const allTimings = [...aiTimings, ...humanTimings];
  const maxTiming = Math.max(...allTimings);
  const avgTiming = allTimings.reduce((a, b) => a + b, 0) / allTimings.length;

  console.log(`  Average: ${avgTiming.toFixed(1)}ms`);
  console.log(`  Max: ${maxTiming.toFixed(1)}ms`);

  for (let i = 0; i < allTimings.length; i++) {
    assert(
      allTimings[i] < 50,
      `Assessment ${i + 1}: < 50ms (${allTimings[i].toFixed(1)}ms)`
    );
  }

  // --- Result structure validation ---
  console.log('\n--- Structure Validation ---\n');

  const sampleAssessment = aiRiskScorer.assessRisk(AI_TEXTS[0]);
  assert(typeof sampleAssessment.overallRisk === 'number', 'overallRisk is number');
  assert(
    ['low', 'medium', 'high'].includes(sampleAssessment.riskLevel),
    `riskLevel is valid enum (got: ${sampleAssessment.riskLevel})`
  );
  assert(Array.isArray(sampleAssessment.flaggedPassages), 'flaggedPassages is array');
  assert(typeof sampleAssessment.metrics === 'object', 'metrics is object');
  assert(typeof sampleAssessment.metrics.vocabularyUniformity === 'number', 'metrics.vocabularyUniformity exists');
  assert(typeof sampleAssessment.metrics.sentenceLengthVariance === 'number', 'metrics.sentenceLengthVariance exists');
  assert(typeof sampleAssessment.metrics.genericReflectionDensity === 'number', 'metrics.genericReflectionDensity exists');
  assert(typeof sampleAssessment.metrics.bannedTermCount === 'number', 'metrics.bannedTermCount exists');

  // ===== RESULTS =====
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  if (failed > 0) {
    console.log(`❌ ${failed} tests FAILED`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
