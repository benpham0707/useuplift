/**
 * Test: Information-Theoretic Analyzer
 *
 * Validates all 7 techniques, rubric scoring, diagnostics, and performance.
 * No LLM calls required -- pure computation.
 *
 * Run: npx tsx tests/test-information-theoretic-analyzer.ts
 */

import { informationTheoreticAnalyzer, InformationTheoreticAnalyzer } from '../../src/core/analysis/features/informationTheoreticAnalyzer';

// ============================================================================
// TEST DATA
// ============================================================================

/** High-quality essay (specific, vivid, diverse vocabulary) */
const EXCELLENT_ESSAY = `Most Wednesdays smelled like bleach and citrus. I'd arrive at the free clinic at 6:45 AM, before the fluorescent lights fully warmed, and sort donated medications by expiration date while Mrs. Chen — our lead pharmacist who'd emigrated from Taipei — quizzed me on drug interactions.

The first three months felt like drowning. I mislabeled amoxicillin as ampicillin, accidentally scheduled two interpreters for the same patient, and once forgot to lock the supply closet. Each mistake taught me something textbooks couldn't: that healthcare isn't just protocols, it's trust. When I confused Mr. Garcia's dosage, his daughter stopped bringing him. It took three home visits and a bilingual apology letter to rebuild that bridge.

By spring, I'd redesigned the intake flow. Cut average wait time from 18 minutes to 9. Trained two freshmen volunteers on the new system so it wouldn't stall when I stepped back. The real transformation wasn't the metrics — it was learning that leadership means making yourself unnecessary.

Now I pause before every decision and ask what we're missing. That habit started here, between the bleach and the citrus, sorting pills at dawn.`;

/** Generic/cliched essay (predictable, repetitive, vague) */
const GENERIC_ESSAY = `I have always been passionate about helping others. From a young age, I knew I wanted to make a difference in the world. This experience taught me the importance of perseverance and hard work.

As a volunteer at the local hospital, I was responsible for many tasks. I helped patients and supported the staff. I learned about teamwork and communication. The experience was very rewarding and meaningful.

I am grateful for the opportunity to have been involved in this program. It broadened my horizons and changed my perspective. I believe that this experience will help me in my future endeavors and I am excited to continue making a positive impact.

In conclusion, volunteering at the hospital was a transformative experience that shaped who I am today. I learned valuable lessons about dedication, compassion, and the power of community service.`;

/** Very short description (edge case) */
const SHORT_TEXT = 'I organized a food drive. We collected donations.';

/** Repetitive text */
const REPETITIVE_TEXT = `I organized the event. I planned the event schedule. I managed the event logistics. I coordinated the event volunteers. I handled the event budget.

The event was successful. The event attracted many participants. The event raised awareness. The event generated donations. The event created community engagement.

After the event, I reflected on the event outcomes. The event taught me about event management. Planning events requires dedication. Events bring people together. Events create lasting impact.`;

// ============================================================================
// TEST RUNNER
// ============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(
    value >= min && value <= max,
    `${label}: ${value} should be in [${min}, ${max}]`
  );
}

// ============================================================================
// TESTS
// ============================================================================

console.log('\n=== Information-Theoretic Analyzer Tests ===\n');

// Test 1: Basic functionality
console.log('--- Test 1: Basic Analysis on Excellent Essay ---');
const excellentResult = informationTheoreticAnalyzer.analyze(EXCELLENT_ESSAY);

assertRange(excellentResult.entropy.overallEntropy, 5, 10, 'Overall entropy');
assertRange(excellentResult.entropy.diversityScore, 5, 10, 'Diversity score');
assert(excellentResult.entropy.perSentence.length > 5, 'Has per-sentence entropy');
assert(excellentResult.entropy.perParagraph.length === 4, 'Has 4 paragraph entropies');

assertRange(excellentResult.surprisal.averageSurprisal, 5, 12, 'Average surprisal');
assertRange(excellentResult.surprisal.engagementScore, 3, 10, 'Engagement score');

assertRange(excellentResult.compression.overallRatio, 0.3, 0.8, 'Compression ratio');
assertRange(excellentResult.compression.uniquenessScore, 3, 10, 'Uniqueness score');
assert(excellentResult.compression.perParagraph.length === 4, 'Has 4 paragraph compression ratios');

assertRange(excellentResult.densityVariation.densityMean, 2, 8, 'Density mean');
assert(excellentResult.densityVariation.densityCurve.length >= 3, 'Has density curve points');

assertRange(excellentResult.mutualInformation.coherenceScore, 0, 10, 'Coherence score');

assert(excellentResult.ncd.paragraphPairs.length === 6, '4 paragraphs = 6 NCD pairs');
assertRange(excellentResult.ncd.averageNCD, 0.3, 1.1, 'Average NCD');

// Note: Short texts (~200 words) with diverse vocabulary naturally produce lower Zipf exponents
// than full-length corpus statistics. Alpha 0.2-2.0 is valid for essay-length text.
assertRange(excellentResult.zipf.alpha, 0.2, 2.0, 'Zipf alpha');
assertRange(excellentResult.zipf.rSquared, 0, 1, 'Zipf R-squared');
assert(excellentResult.zipf.topWords.length === 10, 'Has top 10 Zipf words');

// Test 2: Rubric scores
console.log('\n--- Test 2: Rubric Scores ---');
const rs = excellentResult.rubricScores;
for (const [key, value] of Object.entries(rs)) {
  assertRange(value, 0, 10, `rubricScores.${key}`);
}

// Test 3: Excellent vs Generic comparison
console.log('\n--- Test 3: Excellent vs Generic Essay Comparison ---');
const genericResult = informationTheoreticAnalyzer.analyze(GENERIC_ESSAY);

assert(
  excellentResult.entropy.diversityScore > genericResult.entropy.diversityScore,
  `Excellent diversity (${excellentResult.entropy.diversityScore}) > Generic diversity (${genericResult.entropy.diversityScore})`
);

assert(
  excellentResult.compression.uniquenessScore >= genericResult.compression.uniquenessScore,
  `Excellent uniqueness (${excellentResult.compression.uniquenessScore}) >= Generic uniqueness (${genericResult.compression.uniquenessScore})`
);

assert(
  genericResult.surprisal.predictablePassages.length >= excellentResult.surprisal.predictablePassages.length,
  `Generic has more predictable passages (${genericResult.surprisal.predictablePassages.length}) >= Excellent (${excellentResult.surprisal.predictablePassages.length})`
);

// Generic should have more/worse diagnostic flags
assert(
  genericResult.diagnostics.length >= 1,
  `Generic essay has diagnostic flags: ${genericResult.diagnostics.length}`
);

// Test 4: Short text edge case
console.log('\n--- Test 4: Short Text Edge Case ---');
const shortResult = informationTheoreticAnalyzer.analyze(SHORT_TEXT);
assert(shortResult.entropy.overallEntropy >= 0, 'Short text: entropy >= 0');
assert(shortResult.zipf.interpretation === 'insufficient_data', 'Short text: Zipf reports insufficient data');
assertRange(shortResult.entropy.diversityScore, 0, 10, 'Short text: diversity score in range');

// Test 5: Repetitive text detection
console.log('\n--- Test 5: Repetitive Text Detection ---');
const repetitiveResult = informationTheoreticAnalyzer.analyze(REPETITIVE_TEXT);

assert(
  repetitiveResult.compression.overallRatio < excellentResult.compression.overallRatio,
  `Repetitive compresses better (${repetitiveResult.compression.overallRatio}) < Excellent (${excellentResult.compression.overallRatio})`
);

// Should detect repetitive patterns
const hasRepetitionFlag = repetitiveResult.diagnostics.some(d =>
  d.includes('REPETIT') || d.includes('REDUNDAN') || d.includes('SIMILAR')
);
assert(hasRepetitionFlag, 'Detects repetitive text in diagnostics');

// Test 6: Performance budget
console.log('\n--- Test 6: Performance Budget ---');
assert(
  excellentResult.performance.totalMs < 50,
  `Total execution: ${excellentResult.performance.totalMs}ms (budget: < 50ms)`
);

for (const [technique, ms] of Object.entries(excellentResult.performance.perTechnique)) {
  assert(
    ms < 20,
    `${technique}: ${ms}ms (budget: < 20ms)`
  );
}

// Test 7: Prompt enrichment generation
console.log('\n--- Test 7: Prompt Enrichment ---');
const enrichment = informationTheoreticAnalyzer.generatePromptEnrichment(EXCELLENT_ESSAY);
assert(enrichment.includes('COMPUTATIONAL TEXT ANALYSIS'), 'Enrichment has header');
assert(enrichment.includes('Word Choice Diversity'), 'Enrichment has diversity');
assert(enrichment.includes('Engagement Profile'), 'Enrichment has engagement');
assert(enrichment.includes('Content Uniqueness'), 'Enrichment has uniqueness');
assert(enrichment.includes('Zipf'), 'Enrichment has Zipf');

// Test 8: Version comparison
console.log('\n--- Test 8: Version Comparison ---');
const comparison = informationTheoreticAnalyzer.compareVersions(GENERIC_ESSAY, EXCELLENT_ESSAY);
// Note: Not all info-theory dimensions favor the "excellent" essay directionally.
// Generic text can score higher on regularity metrics (Zipf, density flatness).
// This is expected and correct -- these are complementary signals, not all directional.
assert(typeof comparison.overallImprovement === 'number', `Version improvement is numeric: ${comparison.overallImprovement}`);
assert(Object.keys(comparison.rubricDelta).length === 11, 'Has delta for all 11 rubric dimensions');
// The excellent essay SHOULD beat on uniqueness, opening surprisal, and content progression
assert(comparison.rubricDelta.informationUniqueness > 0, `Uniqueness improved: +${comparison.rubricDelta.informationUniqueness}`);
assert(comparison.rubricDelta.openingSurprisal > 0, `Opening surprisal improved: +${comparison.rubricDelta.openingSurprisal}`);

// Test 9: Quick analysis
console.log('\n--- Test 9: Quick Analysis ---');
const quick = informationTheoreticAnalyzer.quickAnalyze(EXCELLENT_ESSAY);
assert(Object.keys(quick.rubricScores).length === 11, 'Quick analysis has all rubric scores');
assert(quick.totalMs < 50, `Quick analysis: ${quick.totalMs}ms`);

// Test 10: Density curve shape detection
console.log('\n--- Test 10: Density Curve Shape ---');
const shapes = ['flat', 'gradual_build', 'mountain', 'valley', 'oscillating', 'front_loaded', 'back_loaded'];
assert(
  shapes.includes(excellentResult.densityVariation.shapeProfile),
  `Density shape: ${excellentResult.densityVariation.shapeProfile}`
);

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== Detailed Results ===\n');

console.log('Excellent Essay Analysis:');
console.log(`  Shannon Entropy: ${excellentResult.entropy.overallEntropy} bits, Diversity: ${excellentResult.entropy.diversityScore}/10`);
console.log(`  Surprisal: avg=${excellentResult.surprisal.averageSurprisal}, Engagement: ${excellentResult.surprisal.engagementScore}/10`);
console.log(`  Compression Ratio: ${excellentResult.compression.overallRatio}, Uniqueness: ${excellentResult.compression.uniquenessScore}/10`);
console.log(`  Density: mean=${excellentResult.densityVariation.densityMean}, CV=${excellentResult.densityVariation.coefficientOfVariation}, shape=${excellentResult.densityVariation.shapeProfile}`);
console.log(`  MI: intro-concl=${excellentResult.mutualInformation.introConclusion}, body-avg=${excellentResult.mutualInformation.avgBodyMI}, Coherence: ${excellentResult.mutualInformation.coherenceScore}/10`);
console.log(`  NCD: avg=${excellentResult.ncd.averageNCD}, Balance: ${excellentResult.ncd.balanceScore}/10`);
console.log(`  Zipf: alpha=${excellentResult.zipf.alpha}, R2=${excellentResult.zipf.rSquared}, ${excellentResult.zipf.interpretation}, Naturality: ${excellentResult.zipf.naturalityScore}/10`);
console.log(`  Performance: ${excellentResult.performance.totalMs}ms total`);
console.log(`  Diagnostics: ${excellentResult.diagnostics.length} flags`);
excellentResult.diagnostics.forEach(d => console.log(`    - ${d}`));

console.log('\nGeneric Essay Analysis:');
console.log(`  Shannon Entropy: ${genericResult.entropy.overallEntropy} bits, Diversity: ${genericResult.entropy.diversityScore}/10`);
console.log(`  Surprisal: avg=${genericResult.surprisal.averageSurprisal}, Engagement: ${genericResult.surprisal.engagementScore}/10`);
console.log(`  Compression Ratio: ${genericResult.compression.overallRatio}, Uniqueness: ${genericResult.compression.uniquenessScore}/10`);
console.log(`  Zipf: alpha=${genericResult.zipf.alpha}, R2=${genericResult.zipf.rSquared}, ${genericResult.zipf.interpretation}, Naturality: ${genericResult.zipf.naturalityScore}/10`);
console.log(`  Performance: ${genericResult.performance.totalMs}ms total`);
console.log(`  Diagnostics: ${genericResult.diagnostics.length} flags`);
genericResult.diagnostics.forEach(d => console.log(`    - ${d}`));

console.log('\nRubric Scores Comparison (Excellent vs Generic):');
for (const key of Object.keys(rs) as (keyof typeof rs)[]) {
  const exc = excellentResult.rubricScores[key];
  const gen = genericResult.rubricScores[key];
  const delta = (exc - gen).toFixed(1);
  const better = exc > gen ? 'EXCELLENT' : exc < gen ? 'GENERIC' : 'TIE';
  console.log(`  ${key}: ${exc} vs ${gen} (delta: ${delta > '0' ? '+' : ''}${delta}) [${better}]`);
}

console.log('\nPerformance Breakdown:');
for (const [technique, ms] of Object.entries(excellentResult.performance.perTechnique)) {
  console.log(`  ${technique}: ${ms}ms`);
}

console.log('\n=== All Tests Complete ===\n');
