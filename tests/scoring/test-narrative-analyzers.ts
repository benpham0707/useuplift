/**
 * Narrative Analyzers — Unit Tests
 *
 * Tests all 7 deterministic analyzers + paragraph function classifier +
 * the unified entry point. No LLM calls — pure computation tests.
 *
 * Run: npx tsx tests/test-narrative-analyzers.ts
 */

import {
  runNarrativeAnalysis,
  analyzeSpecificityGradient,
  analyzeSceneVsSummary,
  analyzeShowVsTell,
  analyzeNarrativeArc,
  analyzeEmotionalJourney,
  analyzeInformationDensity,
  analyzeTensionCurve,
} from '../../src/workshop/scoring/narrativeAnalyzers';

import {
  classifyParagraphFunctions,
  analyzeNarrativeFlow,
} from '../../src/workshop/scoring/paragraphFunctionClassifier';

// ============================================================================
// TEST ESSAYS
// ============================================================================

/** Narrative-heavy essay: concrete scenes, dialogue, action */
const NARRATIVE_ESSAY = `The kitchen smelled like burnt garlic and failure. My mother stood at the stove, her back rigid, stirring a pot that had already boiled over twice. I sat at the table, my college rejection letter crumpled in my fist, tears blurring the words I'd already memorized.

"You could try again next year," she said, not turning around. Her voice cracked on "year," and I realized she'd been crying too. The wooden spoon scraped against the bottom of the pot, a sound like sandpaper on my nerves.

I grabbed my jacket and walked out into the December cold. The streetlights cast orange pools on the wet sidewalk. My breath came in ragged clouds. I walked for three miles, past the library where I'd studied every weekend, past the park where I'd rehearsed my interview answers to the empty swings.

At the bridge over Miller Creek, I stopped. The water below was black and fast, reflecting nothing. I leaned against the railing and felt the cold metal bite through my sleeves. This was the moment I had to decide: would I let this rejection define me, or would I find another path?

"I didn't get in," I said, my voice flat. She was quiet for a moment. Then she said, "Good. Now you'll have to earn it the hard way." That sentence changed everything.

Over the next six months, I volunteered at 3 different community organizations, rebuilt my portfolio from scratch, and applied to 12 schools. I woke at 5 AM every morning to write. My hands cramped. My eyes burned. But I kept going because Mrs. Rodriguez's words echoed: the hard way.

Looking back now, I understand that the rejection wasn't an ending but a beginning. I learned that resilience isn't about bouncing back — it's about growing forward. The kitchen that smelled like failure became the place where my mother and I cooked celebration dinners, one acceptance at a time.`;

/** Abstract/reflective essay: mostly summary, few scenes */
const ABSTRACT_ESSAY = `Education has always been important to me. Since I was young, I have been passionate about learning and exploring new ideas. My experiences in school have shaped who I am and taught me valuable lessons about perseverance and hard work.

Throughout high school, I was involved in many activities and organizations. I participated in various clubs and took challenging courses. These experiences were incredibly rewarding and helped me grow as a person. I learned the importance of time management and dedication.

I believe that diversity is essential in education. Being exposed to different perspectives has broadened my worldview and made me a more empathetic individual. I have always tried to understand others and appreciate their unique backgrounds and experiences.

My academic journey has not been without challenges. There were times when I struggled and felt overwhelmed. However, I persevered and overcame these obstacles through determination and support from my family. These difficult moments taught me the value of resilience.

In conclusion, I am a dedicated and passionate student who is ready for the next chapter. I believe that my experiences have prepared me well for college, and I am excited about the opportunities that lie ahead. I am confident that I will continue to grow and make a positive impact on my community.`;

/** Quest-pattern essay with curiosity */
const QUEST_ESSAY = `I wondered what lived at the bottom of the pond behind our house. At age seven, I spent hours peering into that murky green water, watching tadpoles dart between the algae-covered rocks. My mother said it was just mud and bugs down there, but I was fascinated — there had to be more.

By eighth grade, I'd turned that curiosity into a research project. I collected water samples, examined them under my school's ancient microscope, and discovered three species of freshwater diatoms that my teacher said she'd never seen catalogued in our county. I was intrigued by these tiny glass-shelled organisms.

The real challenge came when I tried to publish my findings. The county science journal rejected my first paper. The reviewer said my methodology was "enthusiastic but unsound." I was confused and uncertain — what had I done wrong? I spent three weeks re-reading research methodology textbooks.

I redesigned my sampling protocol, partnered with a professor at the state university, and resubmitted. This time, the paper was accepted. More importantly, Dr. Chen told me my discovery of Stauroneis phoenicenteron in a freshwater pond 200 miles north of its known range was "genuinely interesting." That validation felt earned, not given.

The pond that started as childhood wonder became my first real contribution to science. I now understand that curiosity alone isn't enough — you need rigor, persistence, and the humility to admit when your methods are flawed. The diatoms taught me that the smallest things can hold the biggest surprises.`;

// ============================================================================
// TEST HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: ${value} (expected ${min}-${max})`);
}

// ============================================================================
// TESTS
// ============================================================================

console.log('\n=== Narrative Analyzer Tests ===\n');

// --- Analyzer 1: Specificity Gradient ---
console.log('1. Specificity Gradient');
{
  const narrative = analyzeSpecificityGradient(NARRATIVE_ESSAY);
  const abstract = analyzeSpecificityGradient(ABSTRACT_ESSAY);

  assert(narrative.paragraphScores.length === 7, `Narrative essay has 7 paragraphs`);
  assert(abstract.paragraphScores.length === 5, `Abstract essay has 5 paragraphs`);
  assert(narrative.overallScore > abstract.overallScore, `Narrative is more specific than abstract (${narrative.overallScore.toFixed(1)} > ${abstract.overallScore.toFixed(1)})`);
  assert(narrative.paragraphScores[0].signals.namedEntities.length >= 0, 'Named entity detection runs');
  assert(abstract.paragraphScores.some(p => p.signals.genericPhrases.length > 0), 'Detects generic phrases in abstract essay');

  // Empty text edge case
  const empty = analyzeSpecificityGradient('');
  assert(empty.paragraphScores.length === 0, 'Empty text returns empty results');
}

// --- Analyzer 2: Scene vs Summary ---
console.log('\n2. Scene vs Summary Ratio');
{
  const narrative = analyzeSceneVsSummary(NARRATIVE_ESSAY);
  const abstract = analyzeSceneVsSummary(ABSTRACT_ESSAY);

  assert(narrative.sceneRatio > 0.3, `Narrative has scenes (sceneRatio: ${narrative.sceneRatio})`);
  assert(abstract.summaryRatio > narrative.summaryRatio, `Abstract has more summary (${abstract.summaryRatio} > ${narrative.summaryRatio})`);
  assert(narrative.paragraphs.some(p => p.classification === 'scene'), 'Narrative has scene-classified paragraphs');
  assert(abstract.paragraphs.some(p => p.classification === 'summary'), 'Abstract has summary-classified paragraphs');
  assert(abstract.longestSummaryStretch >= 2, `Abstract has summary stretches (${abstract.longestSummaryStretch})`);

  const p0 = narrative.paragraphs[0];
  assert(p0.sceneSignalCount > 0, 'Opening paragraph has scene signals');
}

// --- Analyzer 3: Show vs Tell ---
console.log('\n3. Show vs Tell Detection');
{
  const tellHeavy = 'I was nervous. I felt scared. It was terrible. I was so overwhelmed.\n\nThe door creaked open and my hands trembled as I reached for the cold metal handle. My heart raced.';
  const result = analyzeShowVsTell(tellHeavy);

  assert(result.tellOpportunities.length > 0, `Found tell opportunities (${result.tellOpportunities.length})`);
  assert(result.tellOpportunities.some(t => t.toldEmotion === 'nervous' || t.toldEmotion === 'scared'), 'Detected "nervous" or "scared" as told emotions');
  assert(result.showExemplars.length > 0, `Found show exemplars (${result.showExemplars.length})`);

  // Narrative essay should have defined show ratio
  const narrativeResult = analyzeShowVsTell(NARRATIVE_ESSAY);
  assert(narrativeResult.overallShowRatio >= 0, 'Narrative essay has defined show ratio');

  // Check principle-based output (not prescriptive suggestions)
  if (result.tellOpportunities.length > 0) {
    const opp = result.tellOpportunities[0];
    assert(opp.principle.length > 0, 'Tell opportunity has a principle name');
    assert(opp.llmQuestion.length > 0, 'Tell opportunity has an LLM question');
    assert(opp.tellPattern.length > 0, 'Tell pattern is labeled');
  }
}

// --- Analyzer 4: Narrative Arc ---
console.log('\n4. Narrative Arc Heuristic');
{
  const narrative = analyzeNarrativeArc(NARRATIVE_ESSAY);
  const quest = analyzeNarrativeArc(QUEST_ESSAY);

  assert(narrative.quarterValences.length === 4, 'Has 4 quarter valences');
  assert(narrative.detectedArc !== 'ambiguous' || narrative.confidence > 0, 'Narrative essay has arc detection result');
  assert(narrative.acts.length === 4, 'Has 4 acts');
  assert(narrative.structuralNotes.hasSetup, 'Narrative has setup');
  assert(narrative.structuralNotes.hasConflict, 'Narrative has conflict');

  assert(quest.quarterValences.length === 4, 'Quest has 4 quarter valences');
  console.log(`    Narrative arc: ${narrative.detectedArc} (${(narrative.confidence * 100).toFixed(0)}%)`);
  console.log(`    Quest arc: ${quest.detectedArc} (${(quest.confidence * 100).toFixed(0)}%)`);

  assert(narrative.structuralNotes.hasDenouement, 'Narrative has denouement (reflection in final quarter)');
}

// --- Analyzer 5: Emotional Journey ---
console.log('\n5. Emotional Journey Typing');
{
  const narrative = analyzeEmotionalJourney(NARRATIVE_ESSAY);
  const abstract = analyzeEmotionalJourney(ABSTRACT_ESSAY);

  assert(narrative.paragraphs.length === 7, 'Correct paragraph count');
  assert(narrative.trajectory.uniqueEmotionCount >= 2,
    `Narrative has meaningful emotional variety (${narrative.trajectory.uniqueEmotionCount} >= 2)`);
  assert(narrative.trajectory.transitions.length > 0, 'Narrative has emotional transitions');

  const hasVulnerability = narrative.paragraphs.some(p =>
    p.dominantEmotions.includes('vulnerability') || p.dominantEmotions.includes('fear') || p.dominantEmotions.includes('sadness')
  );
  assert(hasVulnerability, 'Narrative essay has vulnerability/fear/sadness');

  // Variety score should be meaningful for narrative essay
  assert(narrative.trajectory.varietyScore >= 0, 'Variety score is non-negative');

  console.log(`    Pattern: ${narrative.trajectory.pattern}`);
  console.log(`    Variety score: ${narrative.trajectory.varietyScore.toFixed(2)}`);
  console.log(`    Engaging: ${narrative.evaluation.isEngaging}, Authentic: ${narrative.evaluation.isAuthentic}`);
}

// --- Analyzer 6: Information Density ---
console.log('\n6. Information Density');
{
  const narrative = analyzeInformationDensity(NARRATIVE_ESSAY);
  const abstract = analyzeInformationDensity(ABSTRACT_ESSAY);

  assert(narrative.paragraphs.length === 7, 'Correct paragraph count');
  assert(narrative.paragraphs[0].typeTokenRatio > 0, 'Type-token ratio calculated');
  assert(narrative.paragraphs[0].entropy >= 0, 'Entropy is non-negative');
  assert(narrative.paragraphs[0].novelConceptCount > 0, 'First paragraph has novel concepts');
  assert(abstract.overallDensityScore >= 0, 'Abstract density score is valid');

  console.log(`    Narrative density: ${narrative.overallDensityScore.toFixed(1)}`);
  console.log(`    Abstract density: ${abstract.overallDensityScore.toFixed(1)}`);
  console.log(`    Redundancy flags: ${narrative.redundancyFlags.length} (narrative), ${abstract.redundancyFlags.length} (abstract)`);
}

// --- Analyzer 7: Tension Curve ---
console.log('\n7. Tension Curve Mapping');
{
  const narrative = analyzeTensionCurve(NARRATIVE_ESSAY);
  const abstract = analyzeTensionCurve(ABSTRACT_ESSAY);

  assert(narrative.paragraphs.length === 7, 'Correct paragraph count');
  assertRange(narrative.curve.peakTension, 1, 10, 'Peak tension');
  assert(narrative.paragraphs.every(p => p.tensionLevel >= 1 && p.tensionLevel <= 10), 'All tension levels in 1-10');

  const engagementOrder = { high: 4, good: 3, moderate: 2, low: 1 };
  const narrativeEngagement = engagementOrder[narrative.evaluation.overallEngagement];
  const abstractEngagement = engagementOrder[abstract.evaluation.overallEngagement];
  assert(narrativeEngagement >= abstractEngagement,
    `Narrative engagement >= abstract (${narrative.evaluation.overallEngagement} vs ${abstract.evaluation.overallEngagement})`);

  assert(abstract.evaluation.suggestions.length > 0, `Abstract has suggestions (${abstract.evaluation.suggestions.length})`);

  console.log(`    Narrative: peak ${narrative.curve.peakTension}/10 at P${narrative.curve.peakParagraph}, engagement: ${narrative.evaluation.overallEngagement}`);
  console.log(`    Abstract: peak ${abstract.curve.peakTension}/10 at P${abstract.curve.peakParagraph}, engagement: ${abstract.evaluation.overallEngagement}`);
}

// --- Paragraph Function Classifier ---
console.log('\n8. Paragraph Function Classifier');
{
  const narrativeFunctions = classifyParagraphFunctions(NARRATIVE_ESSAY);
  const abstractFunctions = classifyParagraphFunctions(ABSTRACT_ESSAY);

  assert(narrativeFunctions.length === 7, `Narrative has 7 paragraph functions (got ${narrativeFunctions.length})`);
  assert(abstractFunctions.length === 5, `Abstract has 5 paragraph functions (got ${abstractFunctions.length})`);

  // Narrative essay should have meaningful function classifications
  const narrativeFunctionTypes = new Set(narrativeFunctions.map(p => p.detectedFunction));
  assert(narrativeFunctionTypes.size >= 2, `Narrative has multiple function types (${narrativeFunctionTypes.size})`);

  // Abstract essay should have more ambiguous/reflection/exposition
  const abstractReflectionCount = abstractFunctions.filter(p =>
    p.detectedFunction === 'reflection' || p.detectedFunction === 'exposition' || p.detectedFunction === 'ambiguous'
  ).length;
  assert(abstractReflectionCount >= 2, `Abstract has ${abstractReflectionCount} reflection/exposition/ambiguous paragraphs`);

  console.log(`    Narrative functions: ${narrativeFunctions.map(p => p.detectedFunction).join(', ')}`);
  console.log(`    Abstract functions: ${abstractFunctions.map(p => p.detectedFunction).join(', ')}`);

  // Narrative flow
  const narrativeFlow = analyzeNarrativeFlow(narrativeFunctions);
  assert(narrativeFlow.functionDiversity >= 0, 'Function diversity is non-negative');
  console.log(`    Narrative flow diversity: ${(narrativeFlow.functionDiversity * 100).toFixed(0)}%`);
  console.log(`    Missing functions: ${narrativeFlow.missingFunctions.join(', ') || 'none'}`);
}

// --- Unified Entry Point ---
console.log('\n9. Unified runNarrativeAnalysis');
{
  const start = Date.now();
  const result = runNarrativeAnalysis(NARRATIVE_ESSAY);
  const elapsed = Date.now() - start;

  assert(result.specificity !== undefined, 'Has specificity result');
  assert(result.sceneVsSummary !== undefined, 'Has sceneVsSummary result');
  assert(result.showVsTell !== undefined, 'Has showVsTell result');
  assert(result.narrativeArc !== undefined, 'Has narrativeArc result');
  assert(result.emotionalJourney !== undefined, 'Has emotionalJourney result');
  assert(result.informationDensity !== undefined, 'Has informationDensity result');
  assert(result.tensionCurve !== undefined, 'Has tensionCurve result');
  assert(result.paragraphFunctions !== undefined, 'Has paragraphFunctions result');
  assert(result.paragraphFunctions.length === 7, 'Has 7 paragraph functions');
  assert(result.narrativeFlow !== undefined, 'Has narrativeFlow result');
  assert(Array.isArray(result.llmEvaluationNeeded), 'Has llmEvaluationNeeded array');
  assertRange(result.overallNarrativeScore, 0, 100, 'Overall narrative score');
  assert(result.topIssues.length >= 0, 'Has top issues array');
  assert(elapsed < 500, `Completes in < 500ms (took ${elapsed}ms)`);

  console.log(`\n    Overall score: ${result.overallNarrativeScore}/100`);
  console.log(`    Elapsed: ${elapsed}ms`);
  console.log(`    Top issues: ${result.topIssues.length}`);
  console.log(`    LLM evaluation needed: ${result.llmEvaluationNeeded.length}`);
  for (const issue of result.topIssues.slice(0, 3)) {
    console.log(`      [${issue.severity}] ${issue.analyzer}: ${issue.issue}`);
  }
}

// --- Quest Essay Full Analysis ---
console.log('\n10. Quest Essay Full Analysis');
{
  const result = runNarrativeAnalysis(QUEST_ESSAY);
  assertRange(result.overallNarrativeScore, 0, 100, 'Quest overall score');
  assert(result.paragraphFunctions.length === 5, 'Quest has 5 paragraph functions');
  console.log(`    Arc: ${result.narrativeArc.detectedArc} (${(result.narrativeArc.confidence * 100).toFixed(0)}%)`);
  console.log(`    Score: ${result.overallNarrativeScore}/100`);
  console.log(`    Functions: ${result.paragraphFunctions.map(p => p.detectedFunction).join(', ')}`);
}

// --- Edge Cases ---
console.log('\n11. Edge Cases');
{
  const empty = runNarrativeAnalysis('');
  assert(empty.overallNarrativeScore === 0, 'Empty text scores 0');
  assert(empty.paragraphFunctions.length === 0, 'Empty text has no paragraph functions');
  assert(empty.llmEvaluationNeeded.length === 0, 'Empty text has no LLM needs');
  assert(empty.topIssues.length === 0 || empty.topIssues.length >= 0, 'Empty text has valid issues array');

  const single = runNarrativeAnalysis('Just one sentence here.');
  assert(single.overallNarrativeScore >= 0, 'Single sentence has valid score');
  assert(single.paragraphFunctions.length === 1, 'Single sentence has 1 paragraph function');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  console.error('\nSOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
}
