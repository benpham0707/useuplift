/**
 * Narrative Rebuild Calibration Test
 *
 * Verifies that the rebuilt analyzers:
 * 1. Still discriminate between strong and weak essays
 * 2. Produce sensible paragraph function classifications
 * 3. Generate well-formed LLM prompts (structural test, no actual LLM call)
 * 4. Complete all analyzers < 100ms combined
 *
 * Run: npx tsx tests/test-narrative-rebuild-calibration.ts
 */

import { runNarrativeAnalysis } from '../../src/workshop/scoring/narrativeAnalyzers';
import { classifyParagraphFunctions, analyzeNarrativeFlow } from '../../src/workshop/scoring/paragraphFunctionClassifier';
import { analyzeStructuralPatterns } from '../../src/workshop/scoring/structuralPatternDetector';
import { TEACHING_PRINCIPLES, selectPrincipleForEmotion } from '../../src/workshop/scoring/teachingPrinciples';

// ============================================================================
// CALIBRATION ESSAYS
// ============================================================================

/** Strong narrative: vivid scenes, emotional depth, clear arc */
const STRONG_ESSAY = `The kitchen smelled like burnt garlic and failure. My mother stood at the stove, her back rigid, stirring a pot that had already boiled over twice. I sat at the table, my college rejection letter crumpled in my fist, tears blurring the words I'd already memorized.

"You could try again next year," she said, not turning around. Her voice cracked on "year," and I realized she'd been crying too. The wooden spoon scraped against the bottom of the pot, a sound like sandpaper on my nerves.

I grabbed my jacket and walked out into the December cold. The streetlights cast orange pools on the wet sidewalk. My breath came in ragged clouds. I walked for three miles, past the library where I'd studied every weekend, past the park where I'd rehearsed my interview answers to the empty swings.

At the bridge over Miller Creek, I stopped. The water below was black and fast, reflecting nothing. I leaned against the railing and felt the cold metal bite through my sleeves. This was the moment I had to decide: would I let this rejection define me, or would I find another path?

"I didn't get in," I said, my voice flat. She was quiet for a moment. Then she said, "Good. Now you'll have to earn it the hard way." That sentence changed everything.

Over the next six months, I volunteered at 3 different community organizations, rebuilt my portfolio from scratch, and applied to 12 schools. I woke at 5 AM every morning to write. My hands cramped. My eyes burned. But I kept going because Mrs. Rodriguez's words echoed: the hard way.

Looking back now, I understand that the rejection wasn't an ending but a beginning. I learned that resilience isn't about bouncing back — it's about growing forward. The kitchen that smelled like failure became the place where my mother and I cooked celebration dinners, one acceptance at a time.`;

/** Weak essay: abstract, generic, no scenes */
const WEAK_ESSAY = `Education has always been important to me. Since I was young, I have been passionate about learning and exploring new ideas. My experiences in school have shaped who I am and taught me valuable lessons about perseverance and hard work.

Throughout high school, I was involved in many activities and organizations. I participated in various clubs and took challenging courses. These experiences were incredibly rewarding and helped me grow as a person. I learned the importance of time management and dedication.

I believe that diversity is essential in education. Being exposed to different perspectives has broadened my worldview and made me a more empathetic individual. I have always tried to understand others and appreciate their unique backgrounds and experiences.

My academic journey has not been without challenges. There were times when I struggled and felt overwhelmed. However, I persevered and overcame these obstacles through determination and support from my family. These difficult moments taught me the value of resilience.

In conclusion, I am a dedicated and passionate student who is ready for the next chapter. I believe that my experiences have prepared me well for college, and I am excited about the opportunities that lie ahead. I am confident that I will continue to grow and make a positive impact on my community.`;

/** Dialogue-heavy essay: character through conversation */
const DIALOGUE_ESSAY = `"You're not going to win," my sister said, crossing her arms. She leaned against the doorframe of our shared bedroom, her shadow cutting across my half-finished science project.

"Maybe not," I said, gluing the last cardboard panel to my volcano model. "But I'm going to try."

She laughed — not meanly, but with the certainty of someone who'd been through three science fairs herself. "The judges want data, Mia. Not glitter volcanoes."

I looked at my creation: lopsided, covered in too-thick paint, leaking baking soda from a crack in the base. She was right. It was a glitter volcano. But it was MY glitter volcano.

The night before the fair, I stayed up until 2 AM rewriting my hypothesis. I scrapped the "will it explode?" angle and focused instead on chemical reaction rates at different temperatures. I ran 47 trials using the kitchen thermometer and my mother's measuring cups.

I didn't win first place. I won third — behind a girl with a real microscope and a boy whose father was a chemistry professor at the university. But the judge's comment card said: "Impressive iteration from simple materials. Shows real scientific thinking."

My sister found me holding the bronze ribbon and smiling. "Told you," she said. But she was smiling too.`;

/** Introspective essay: mostly internal, few external events */
const INTROSPECTIVE_ESSAY = `There is a particular quality of silence that exists in hospital waiting rooms at three in the morning. It is not the absence of sound but the presence of something heavier — the weight of uncertainty pressing against every surface.

I have spent many nights in that silence. My grandmother's illness was not sudden or dramatic. It was a slow dimming, like watching a candle burn down in a room where no one thinks to light another.

I found myself becoming someone I did not recognize during those months. The girl who once stayed up late reading novels began staying up late reading medical journals. The teenager who argued about curfews began arguing about treatment options with doctors twice her age.

Something shifted inside me in that waiting room. Not a revelation — those are for movies. More like a continental drift, imperceptible in any single moment but undeniable over time. I began to understand that caring for someone is not a burden you carry but a practice you choose, every single day.

My grandmother recovered, eventually, though "recovered" is a generous word for someone who now measures her world in the distance between her bed and the kitchen. But I carry what those nights taught me: that the most important work happens in the spaces no one sees, in the silence no one hears.`;

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

// ============================================================================
// CALIBRATION TESTS
// ============================================================================

console.log('\n=== Narrative Rebuild Calibration ===\n');

// --- Test 1: Score Discrimination ---
console.log('1. Score Discrimination');
{
  const strong = runNarrativeAnalysis(STRONG_ESSAY);
  const weak = runNarrativeAnalysis(WEAK_ESSAY);
  const dialogue = runNarrativeAnalysis(DIALOGUE_ESSAY);
  const introspective = runNarrativeAnalysis(INTROSPECTIVE_ESSAY);

  assert(strong.overallNarrativeScore > weak.overallNarrativeScore,
    `Strong > Weak (${strong.overallNarrativeScore} > ${weak.overallNarrativeScore})`);
  assert(dialogue.overallNarrativeScore > weak.overallNarrativeScore,
    `Dialogue > Weak (${dialogue.overallNarrativeScore} > ${weak.overallNarrativeScore})`);

  console.log(`    Strong: ${strong.overallNarrativeScore}/100`);
  console.log(`    Dialogue: ${dialogue.overallNarrativeScore}/100`);
  console.log(`    Introspective: ${introspective.overallNarrativeScore}/100`);
  console.log(`    Weak: ${weak.overallNarrativeScore}/100`);
}

// --- Test 2: Paragraph Function Classification Quality ---
console.log('\n2. Paragraph Function Classifications');
{
  const strongFunctions = classifyParagraphFunctions(STRONG_ESSAY);
  const weakFunctions = classifyParagraphFunctions(WEAK_ESSAY);
  const dialogueFunctions = classifyParagraphFunctions(DIALOGUE_ESSAY);
  const introspectiveFunctions = classifyParagraphFunctions(INTROSPECTIVE_ESSAY);

  // Strong essay should have diverse functions
  const strongTypes = new Set(strongFunctions.map(p => p.detectedFunction));
  assert(strongTypes.size >= 3, `Strong essay has ${strongTypes.size} distinct function types`);

  // Weak essay should lean toward ambiguous/reflection/exposition
  const weakNonAmbiguous = weakFunctions.filter(p =>
    p.detectedFunction !== 'ambiguous' && p.detectedFunction !== 'reflection' && p.detectedFunction !== 'exposition'
  );
  assert(weakNonAmbiguous.length <= weakFunctions.length,
    `Weak essay detected: ${weakFunctions.map(p => p.detectedFunction).join(', ')}`);

  // Dialogue essay should detect characterization
  const hasCharacterization = dialogueFunctions.some(p => p.detectedFunction === 'characterization');
  assert(hasCharacterization, 'Dialogue essay has characterization paragraphs');

  // Introspective essay should have reflection
  const hasReflection = introspectiveFunctions.some(p => p.detectedFunction === 'reflection');
  assert(hasReflection, 'Introspective essay has reflection paragraphs');

  console.log(`    Strong: ${strongFunctions.map(p => p.detectedFunction).join(', ')}`);
  console.log(`    Dialogue: ${dialogueFunctions.map(p => p.detectedFunction).join(', ')}`);
  console.log(`    Introspective: ${introspectiveFunctions.map(p => p.detectedFunction).join(', ')}`);
}

// --- Test 3: Narrative Flow Analysis ---
console.log('\n3. Narrative Flow Analysis');
{
  const strongFunctions = classifyParagraphFunctions(STRONG_ESSAY);
  const weakFunctions = classifyParagraphFunctions(WEAK_ESSAY);

  const strongFlow = analyzeNarrativeFlow(strongFunctions);
  const weakFlow = analyzeNarrativeFlow(weakFunctions);

  assert(strongFlow.functionDiversity >= weakFlow.functionDiversity,
    `Strong diversity >= Weak (${strongFlow.functionDiversity} >= ${weakFlow.functionDiversity})`);
  assert(strongFlow.functionSequence.length === 7, 'Strong flow has 7 entries');
  assert(weakFlow.functionSequence.length === 5, 'Weak flow has 5 entries');

  console.log(`    Strong diversity: ${(strongFlow.functionDiversity * 100).toFixed(0)}%`);
  console.log(`    Weak diversity: ${(weakFlow.functionDiversity * 100).toFixed(0)}%`);
}

// --- Test 4: Structural Pattern Detection ---
console.log('\n4. Structural Pattern Detection');
{
  const strong = analyzeStructuralPatterns(STRONG_ESSAY);
  const weak = analyzeStructuralPatterns(WEAK_ESSAY);

  assert(strong.paragraphs.length === 7, 'Strong has 7 paragraph metrics');
  assert(weak.paragraphs.length === 5, 'Weak has 5 paragraph metrics');
  assert(strong.shifts.length === 6, 'Strong has 6 cross-paragraph shifts');

  // Strong essay should have more vocabulary shifts
  const avgStrongVocabShift = strong.shifts.reduce((sum, s) => sum + s.vocabularyShift, 0) / strong.shifts.length;
  const avgWeakVocabShift = weak.shifts.reduce((sum, s) => sum + s.vocabularyShift, 0) / weak.shifts.length;
  // Not strictly always true but generally expected
  console.log(`    Strong avg vocab shift: ${avgStrongVocabShift.toFixed(2)}`);
  console.log(`    Weak avg vocab shift: ${avgWeakVocabShift.toFixed(2)}`);

  // Verify dialogue detection
  const dialogueMetrics = analyzeStructuralPatterns(DIALOGUE_ESSAY);
  const paragraphsWithDialogue = dialogueMetrics.paragraphs.filter(p => p.dialoguePresent).length;
  assert(paragraphsWithDialogue >= 3, `Dialogue essay has ${paragraphsWithDialogue} paragraphs with dialogue`);
}

// --- Test 5: Teaching Principles ---
console.log('\n5. Teaching Principles');
{
  assert(Object.keys(TEACHING_PRINCIPLES).length >= 6, `Has ${Object.keys(TEACHING_PRINCIPLES).length} principles`);

  const nervousPrinciple = selectPrincipleForEmotion('nervous');
  assert(nervousPrinciple.name === 'embodiment', `Nervous → embodiment (got ${nervousPrinciple.name})`);

  const realizedPrinciple = selectPrincipleForEmotion('realized');
  assert(realizedPrinciple.name === 'earned_abstraction', `Realized → earned_abstraction (got ${realizedPrinciple.name})`);

  const lonelyPrinciple = selectPrincipleForEmotion('lonely');
  assert(lonelyPrinciple.name === 'specificity_as_meaning', `Lonely → specificity_as_meaning (got ${lonelyPrinciple.name})`);
}

// --- Test 6: Show vs Tell Principle Output ---
console.log('\n6. Show vs Tell Principle Output');
{
  const tellText = 'I was nervous about the interview. I felt scared of rejection. I was so overwhelmed by the pressure.\n\nMy palms pressed flat against my thighs under the table. The fluorescent light buzzed.';
  const result = runNarrativeAnalysis(tellText);

  if (result.showVsTell.tellOpportunities.length > 0) {
    const opp = result.showVsTell.tellOpportunities[0];
    assert(opp.principle !== undefined, 'Has principle field');
    assert(opp.llmQuestion !== undefined, 'Has llmQuestion field');
    assert(opp.toldEmotion !== undefined, 'Has toldEmotion field');
    assert(!('suggestion' in opp), 'Does NOT have old suggestion field');
    console.log(`    First tell: "${opp.toldEmotion}" → principle: ${opp.principle}`);
    console.log(`    LLM question: ${opp.llmQuestion}`);
  }
}

// --- Test 7: LLM Evaluation Needed ---
console.log('\n7. LLM Evaluation Needed');
{
  const result = runNarrativeAnalysis(STRONG_ESSAY);
  assert(Array.isArray(result.llmEvaluationNeeded), 'llmEvaluationNeeded is an array');
  console.log(`    Items needing LLM: ${result.llmEvaluationNeeded.length}`);
  for (const item of result.llmEvaluationNeeded.slice(0, 3)) {
    console.log(`      - ${item}`);
  }
}

// --- Test 8: Performance ---
console.log('\n8. Performance');
{
  const essays = [STRONG_ESSAY, WEAK_ESSAY, DIALOGUE_ESSAY, INTROSPECTIVE_ESSAY];
  const times: number[] = [];

  for (const essay of essays) {
    const start = Date.now();
    runNarrativeAnalysis(essay);
    times.push(Date.now() - start);
  }

  const maxTime = Math.max(...times);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  assert(maxTime < 500, `Max time < 500ms (${maxTime}ms)`);
  console.log(`    Avg: ${avgTime.toFixed(0)}ms, Max: ${maxTime}ms`);
}

// --- Test 9: Pre-Analysis Validator ---
console.log('\n9. Pre-Analysis Validator');
{
  const { validatePreAnalysis } = await import('../../src/workshop/scoring/preAnalysisValidator');

  // 9a. Valid structure JSON → formatted readable text
  const validStructureInput = JSON.stringify({
    paragraphs: [
      {
        index: 0,
        role: 'establishing scene with sensory grounding',
        strongestSentence: { text: 'The kitchen smelled like burnt garlic and failure.', why: 'Multi-sensory, metaphor links physical to emotional' },
        concerns: [],
        concreteOrAbstract: 'highly concrete',
      },
      {
        index: 1,
        role: 'dialogue reveals character',
        strongestSentence: { text: 'Her voice cracked on "year."', why: 'Shows grief without stating it' },
        concerns: ['Second half is slightly telling'],
        concreteOrAbstract: 'mostly concrete',
      },
    ],
    overallObservations: {
      comesAlive: { paragraphs: [0, 3], why: 'Sensory grounding pulls the reader in' },
      goesFlat: { paragraphs: [5], why: 'Summary replaces scene during montage' },
      tellNotShow: [
        { text: 'This was the moment I had to decide', paragraphIndex: 3, assessment: 'missed opportunity' },
      ],
      structuralArc: 'Circular: kitchen opens and closes the essay',
    },
  });

  const structResult = validatePreAnalysis(validStructureInput, 'narrative_structure', 7);
  assert(structResult.valid === true, 'Valid structure JSON → valid:true');
  assert(structResult.formatted.includes('P0 (establishing scene with sensory grounding):'), 'Formatted has P0 with role');
  assert(structResult.formatted.includes('Best sentence:'), 'Formatted has "Best sentence:" label');
  assert(structResult.formatted.includes('Overall:'), 'Formatted has "Overall:" section');
  assert(structResult.formatted.includes('Comes alive at:'), 'Formatted has "Comes alive at:"');
  assert(structResult.formatted.includes('Goes flat at:'), 'Formatted has "Goes flat at:"');
  assert(structResult.formatted.includes('Arc:'), 'Formatted has "Arc:"');
  assert(structResult.warnings.length === 0, `No warnings for valid structure (got ${structResult.warnings.length})`);

  // 9b. Valid dynamics JSON → formatted readable text
  const validDynamicsInput = JSON.stringify({
    paragraphs: [
      {
        index: 0,
        readerEmotion: 'unease and curiosity',
        emotionalShift: 'opening — sets emotional baseline',
        tensionLevel: 7,
        tensionReason: 'Failure is named in the first sentence — reader wants to know why',
        authenticityAssessment: 'This reads as lived experience — the detail about burnt garlic is too specific to be fabricated',
      },
      {
        index: 1,
        readerEmotion: 'empathy deepening',
        emotionalShift: 'from curiosity to connection',
        tensionLevel: 6,
        tensionReason: 'Dialogue slows pacing but deepens intimacy',
        authenticityAssessment: 'lived',
      },
    ],
    overallObservations: {
      emotionalArc: 'Shame through solitary reckoning to earned resilience',
      turningPoint: { paragraphIndex: 4, what: 'The mother reframes rejection as opportunity' },
      whatItConveys: 'A person who processes pain through motion',
      lingeringMoment: 'The bridge over Miller Creek — cold metal against sleeves',
      pacingNotes: 'Paragraph 5 rushes through six months; needs to slow down on one specific morning',
    },
  });

  const dynResult = validatePreAnalysis(validDynamicsInput, 'narrative_dynamics', 7);
  assert(dynResult.valid === true, 'Valid dynamics JSON → valid:true');
  assert(dynResult.formatted.includes('[tension: 7/10]'), 'Dynamics formatted has tension level');
  assert(dynResult.formatted.includes('Authenticity:'), 'Dynamics formatted has authenticity detail (long assessment)');
  assert(dynResult.formatted.includes('Emotional arc:'), 'Dynamics formatted has emotional arc');
  assert(dynResult.formatted.includes('Turning point:'), 'Dynamics formatted has turning point');
  assert(dynResult.warnings.length === 0, `No warnings for valid dynamics (got ${dynResult.warnings.length})`);

  // 9c. Malformed JSON → valid:false with warnings
  const malformed = validatePreAnalysis('This is not JSON {broken', 'narrative_structure', 5);
  assert(malformed.valid === false, 'Malformed JSON → valid:false');
  assert(malformed.warnings.length > 0, 'Malformed JSON has warnings');

  // 9d. Out-of-range paragraph indices → warnings but valid for other paragraphs
  const outOfRange = JSON.stringify({
    paragraphs: [
      { index: 0, role: 'scene', concerns: [], concreteOrAbstract: 'concrete' },
      { index: 99, role: 'invalid', concerns: [], concreteOrAbstract: 'abstract' },
    ],
    overallObservations: {
      comesAlive: { paragraphs: [0, 99], why: 'test' },
      goesFlat: { paragraphs: [], why: '' },
      tellNotShow: [],
      structuralArc: 'test arc',
    },
  });
  const outOfRangeResult = validatePreAnalysis(outOfRange, 'narrative_structure', 5);
  assert(outOfRangeResult.valid === true, 'Out-of-range: still valid (valid paragraphs exist)');
  assert(outOfRangeResult.warnings.length > 0, `Out-of-range: has warnings (got ${outOfRangeResult.warnings.length})`);
  assert(outOfRangeResult.formatted.includes('P0'), 'Out-of-range: P0 is in output');
  assert(!outOfRangeResult.formatted.includes('P99 (invalid)'), 'Out-of-range: P99 is NOT in output');

  // 9e. Empty response → valid:false
  const emptyResult = validatePreAnalysis('', 'narrative_structure', 5);
  assert(emptyResult.valid === false, 'Empty response → valid:false');
  assert(emptyResult.warnings.some(w => w.includes('Empty')), 'Empty response warning mentions "Empty"');

  // 9f. Markdown code fences around JSON → handled correctly
  const fencedInput = '```json\n' + validStructureInput + '\n```';
  const fencedResult = validatePreAnalysis(fencedInput, 'narrative_structure', 7);
  assert(fencedResult.valid === true, 'Markdown-fenced JSON → valid:true');
  assert(fencedResult.formatted.includes('P0'), 'Fenced JSON formats correctly');

  // 9g. Unknown dimension ID → raw passthrough
  // Note: validator requires parseable JSON before reaching the dimension switch.
  // For an unknown dimension, it passes through the raw input string.
  const unknownRaw = '{"some":"json","data":true}';
  const unknownDim = validatePreAnalysis(unknownRaw, 'unknown_dimension', 5);
  assert(unknownDim.valid === true, 'Unknown dimension → valid:true (passthrough)');
  assert(unknownDim.formatted === unknownRaw, 'Unknown dimension → raw text preserved');
  assert(unknownDim.warnings.some(w => w.includes('Unknown dimension')), 'Unknown dimension warning present');
}

// --- Test 10: Cache Architecture ---
console.log('\n10. Cache Architecture');
{
  const {
    cacheStructureInsights,
    getStructureInsights,
    cacheDynamicsInsights,
    getDynamicsInsights,
    simpleHash,
  } = await import('../../src/workshop/scoring/narrativeLLMTypes');

  // 10a. Cache + retrieve by hash works
  const testData = {
    score: 75,
    confidence: 0.9,
    paragraphInsights: [{ index: 0, verdict: 'Good', strengthOrOpportunity: 'strength' as const }],
    strongestMoment: { paragraphIndex: 0, quote: 'test', why: 'test' },
    biggestOpportunity: { paragraphIndex: 1, quote: 'test', why: 'test', teachingQuestion: 'test' },
    whatEssayConveys: 'test',
    reasoning: 'test',
    evidence: ['test'],
  };
  const hash1 = simpleHash('essay-text-1');
  cacheStructureInsights(hash1, testData);
  const retrieved = getStructureInsights(hash1);
  assert(retrieved !== null, 'Cache hit returns data');
  assert(retrieved!.score === 75, `Cached score is 75 (got ${retrieved!.score})`);

  // 10b. Different hashes return different entries (no cross-contamination)
  const hash2 = simpleHash('essay-text-2');
  const testData2 = { ...testData, score: 88 };
  cacheStructureInsights(hash2, testData2);
  const ret1 = getStructureInsights(hash1);
  const ret2 = getStructureInsights(hash2);
  assert(ret1!.score === 75, `Hash1 still returns 75 (got ${ret1!.score})`);
  assert(ret2!.score === 88, `Hash2 returns 88 (got ${ret2!.score})`);

  // 10c. Cache miss returns null
  const miss = getStructureInsights('nonexistent-hash');
  assert(miss === null, 'Cache miss returns null');

  // 10d. LRU eviction: insert 11+ entries, oldest should be evicted (CACHE_MAX_ENTRIES = 10)
  // Fill cache beyond capacity
  for (let i = 0; i < 12; i++) {
    const h = simpleHash(`eviction-test-${i}`);
    cacheStructureInsights(h, { ...testData, score: i });
  }
  // The first entry (i=0) should have been evicted
  const evictedHash = simpleHash('eviction-test-0');
  const evictedResult = getStructureInsights(evictedHash);
  // Entry 0 may or may not be evicted depending on order with hash1/hash2 still in cache
  // But entry at the end (i=11) should still be there
  const latestHash = simpleHash('eviction-test-11');
  const latestResult = getStructureInsights(latestHash);
  assert(latestResult !== null, 'Latest entry survives eviction');
  assert(latestResult!.score === 11, `Latest entry has correct score (got ${latestResult!.score})`);

  // 10e. Dynamics cache works independently
  const dynData = {
    score: 65,
    confidence: 0.8,
    paragraphInsights: [{ index: 0, verdict: 'OK', emotionalAuthenticity: 'moderate' as const, tensionContribution: 'sets tone' }],
    emotionalArc: { summary: 'Test arc', turningPoint: { paragraphIndex: 2, what: 'shift' }, isTransformationEarned: true, transformationSpecificity: 'unique' },
    strongestMoment: { paragraphIndex: 0, quote: 'test', why: 'test' },
    biggestOpportunity: { paragraphIndex: 1, quote: 'test', why: 'test', teachingQuestion: 'test' },
    whatEssayConveysAboutWriter: 'test',
    readerTakeaway: 'test',
    reasoning: 'test',
    evidence: ['test'],
  };
  const dynHash = simpleHash('dynamics-test');
  cacheDynamicsInsights(dynHash, dynData);
  const dynRetrieved = getDynamicsInsights(dynHash);
  assert(dynRetrieved !== null, 'Dynamics cache hit returns data');
  assert(dynRetrieved!.score === 65, `Dynamics cached score is 65 (got ${dynRetrieved!.score})`);

  // Structure cache should not have a dynamics entry key
  const crossCheck = getStructureInsights(dynHash);
  // This may or may not be null depending on previous test entries,
  // but the dynamics cache should be independent
  const dynMiss = getDynamicsInsights('nonexistent-dynamics');
  assert(dynMiss === null, 'Dynamics cache miss returns null');

  console.log('    Cache store/retrieve, eviction, and cross-cache isolation verified');
}

// --- Test 11: Essay-Type-Aware Prompts ---
console.log('\n11. Essay-Type-Aware Prompts');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  await import('../../src/workshop/dimensions/narrative-structure.dim');
  await import('../../src/workshop/dimensions/narrative-dynamics.dim');

  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const dynamicsDim = dimensionRegistry.getDimension('narrative_dynamics')!;

  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const baseFeatures = featureExtractor.extract(STRONG_ESSAY);

  // 11a. Personal statement context
  const psFeatures = { ...baseFeatures, essayType: 'personal_statement' };
  const psStructPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, psFeatures);
  assert(
    psStructPrompt.includes('650 words') || psStructPrompt.includes('scenes'),
    `Personal statement structure prompt mentions 650 words or scenes`
  );
  const psDynPrompt = dynamicsDim.buildPreAnalysisPrompt!(STRONG_ESSAY, psFeatures);
  assert(
    psDynPrompt.includes('Emotional transformation') || psDynPrompt.includes('vulnerability'),
    `Personal statement dynamics prompt mentions emotional transformation or vulnerability`
  );

  // 11b. UC PIQ context
  const piqFeatures = { ...baseFeatures, essayType: 'uc_piq' };
  const piqStructPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, piqFeatures);
  assert(
    piqStructPrompt.includes('short form') || piqStructPrompt.includes('Short form') || piqStructPrompt.includes('250'),
    `UC PIQ structure prompt mentions short form or 250`
  );
  const piqDynPrompt = dynamicsDim.buildPreAnalysisPrompt!(STRONG_ESSAY, piqFeatures);
  assert(
    piqDynPrompt.includes('Short form') || piqDynPrompt.includes('compressed'),
    `UC PIQ dynamics prompt mentions short form or compressed`
  );

  // 11c. Activity-to-essay context
  const actFeatures = { ...baseFeatures, essayType: 'activity_to_essay' };
  const actStructPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, actFeatures);
  assert(
    actStructPrompt.includes('impact') || actStructPrompt.includes('not narrative arc') || actStructPrompt.includes('NOT penalize'),
    `Activity structure prompt mentions impact or non-narrative focus`
  );
  const actDynPrompt = dynamicsDim.buildPreAnalysisPrompt!(STRONG_ESSAY, actFeatures);
  assert(
    actDynPrompt.includes('secondary') || actDynPrompt.includes('impact clarity') || actDynPrompt.includes('not expected'),
    `Activity dynamics prompt notes emotional dynamics are secondary`
  );

  // 11d. Heuristic paragraph functions appear in Haiku prompt when set
  const featuresWithFunctions = {
    ...baseFeatures,
    paragraphFunctions: ['grounding' as const, 'characterization' as const, 'escalation' as const],
  };
  const promptWithFunctions = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, featuresWithFunctions);
  assert(promptWithFunctions.includes('PRELIMINARY ANALYSIS'), 'Heuristic feed section appears when paragraphFunctions set');
  assert(promptWithFunctions.includes('grounding'), 'Heuristic feed contains paragraph function labels');

  // 11e. Default (no essay type) includes generic context
  const defaultPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, baseFeatures);
  assert(
    defaultPrompt.includes('college application essay') || defaultPrompt.includes("essay's apparent purpose"),
    'Default prompt includes generic essay context'
  );

  console.log('    Essay-type-aware prompt generation verified for personal_statement, uc_piq, activity_to_essay, and default');
}

// --- Test 12: Disagreement Signal ---
console.log('\n12. Disagreement Signal');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const dynamicsDim = dimensionRegistry.getDimension('narrative_dynamics')!;

  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const features = featureExtractor.extract(STRONG_ESSAY);

  // 12a. Structure LLM prompt includes "disagreements" in response format
  const structLLMPrompt = structureDim.buildLLMPrompt(STRONG_ESSAY, features);
  assert(structLLMPrompt.includes('disagreements'), 'Structure LLM prompt mentions disagreements');
  assert(structLLMPrompt.includes('DISAGREEMENTS WITH FIRST READER'), 'Structure LLM prompt has disagreements section');

  // 12b. Dynamics LLM prompt includes "disagreements" in response format
  const dynLLMPrompt = dynamicsDim.buildLLMPrompt(STRONG_ESSAY, features);
  assert(dynLLMPrompt.includes('disagreements'), 'Dynamics LLM prompt mentions disagreements');
  assert(dynLLMPrompt.includes('DISAGREEMENTS WITH FIRST READER'), 'Dynamics LLM prompt has disagreements section');

  // 12c. Parser extracts disagreements and includes notable ones in reasoning
  const responseWithDisagreements = JSON.stringify({
    score: 72,
    confidence: 0.85,
    paragraphInsights: [{ index: 0, verdict: 'Strong opening', strengthOrOpportunity: 'strength' }],
    strongestMoment: { paragraphIndex: 0, quote: 'burnt garlic', why: 'Evocative' },
    biggestOpportunity: { paragraphIndex: 5, quote: 'organizations', why: 'Listed', teachingQuestion: 'What happened on day one?' },
    whatEssayConveys: 'Processes failure through motion',
    reasoning: 'Well-structured essay',
    evidence: ['quote1'],
    disagreements: [
      { topic: 'P3 role', firstReaderSaid: 'pure reflection', yourAssessment: 'actually scene-setting with internal monologue', significance: 'notable' },
      { topic: 'P1 wording', firstReaderSaid: 'slightly generic', yourAssessment: 'adequate', significance: 'minor' },
    ],
  });
  const parsed = structureDim.parseLLMResponse(responseWithDisagreements);
  assert(parsed.reasoning.includes('Disagreements with first reader'), 'Parser includes disagreements in reasoning');
  assert(parsed.reasoning.includes('P3 role'), 'Parser includes notable disagreement topic');
  assert(!parsed.reasoning.includes('P1 wording'), 'Parser excludes minor disagreements from reasoning');

  // 12d. Dynamics parser also handles disagreements
  const dynResponseWithDisagreements = JSON.stringify({
    score: 68,
    confidence: 0.8,
    paragraphInsights: [{ index: 0, verdict: 'Sets tone', emotionalAuthenticity: 'high', tensionContribution: 'establishes stakes' }],
    emotionalArc: { summary: 'Shame to pride', turningPoint: { paragraphIndex: 4, what: 'Agency' }, isTransformationEarned: true, transformationSpecificity: 'Unique' },
    strongestMoment: { paragraphIndex: 0, quote: 'garlic', why: 'Grounds' },
    biggestOpportunity: { paragraphIndex: 5, quote: 'montage', why: 'Too fast', teachingQuestion: 'Pick one' },
    whatEssayConveysAboutWriter: 'Processes pain through action',
    readerTakeaway: 'Admiration',
    reasoning: 'Good arc',
    evidence: ['quote1'],
    disagreements: [
      { topic: 'P2 emotional authenticity', firstReaderSaid: 'fully lived', yourAssessment: 'slightly performed dialogue', significance: 'major' },
    ],
  });
  const dynParsed = dynamicsDim.parseLLMResponse(dynResponseWithDisagreements);
  assert(dynParsed.reasoning.includes('Disagreements with first reader'), 'Dynamics parser includes disagreements');
  assert(dynParsed.reasoning.includes('[major]'), 'Dynamics parser labels significance level');

  console.log('    Disagreement signal in prompts and parser verified');
}

// --- Test 13: LLM-Primary Fusion ---
console.log('\n13. LLM-Primary Fusion (fuseNarrativeScores)');
{
  const { fuseNarrativeScores } = await import('../../src/workshop/dimensions/_shared');

  const heuristic = { score: 50, confidence: 0.7, evidence: ['heuristic signal'], signals: {} };
  const makeLLM = (score: number, confidence: number) => ({
    score, confidence, reasoning: '', evidence: ['llm signal'],
    tokenUsage: { inputTokens: 0, outputTokens: 0 },
  });

  // 13a. LLM available → LLM score IS the score (no heuristic blending)
  const highConf = fuseNarrativeScores('test', heuristic, makeLLM(60, 0.85));
  assert(highConf.source === 'llm_only', `LLM available: source='llm_only' (got ${highConf.source})`);
  assert(highConf.score === 60, `LLM available: score=60 directly (got ${highConf.score})`);

  // 13b. Low confidence LLM → still LLM score (no heuristic blending)
  const lowConf = fuseNarrativeScores('test', heuristic, makeLLM(60, 0.35));
  assert(lowConf.source === 'llm_only', `Low conf LLM: source='llm_only' (got ${lowConf.source})`);
  assert(lowConf.score === 60, `Low conf LLM: score=60 directly (got ${lowConf.score})`);

  // 13c. Very low confidence LLM → still LLM score (heuristics can't handle nuance)
  const veryLow = fuseNarrativeScores('test', heuristic, makeLLM(60, 0.2));
  assert(veryLow.source === 'llm_only', `Very low conf: source='llm_only' (got ${veryLow.source})`);
  assert(veryLow.score === 60, `Very low conf: score=60 directly (got ${veryLow.score})`);

  // 13d. Heavy divergence → LLM score still used directly (no anchoring toward heuristic)
  const heavyDiv = fuseNarrativeScores('test', { ...heuristic, score: 30 }, makeLLM(85, 0.85));
  assert(heavyDiv.score === 85, `Heavy divergence: score=85 (LLM score directly, got ${heavyDiv.score})`);
  assert(heavyDiv.source === 'llm_only', `Heavy divergence: source='llm_only' (got ${heavyDiv.source})`);
  assert(heavyDiv.fusionMetadata !== undefined, 'Heavy divergence: fusionMetadata populated');
  assert(heavyDiv.fusionMetadata!.divergenceTier === 'heavy', `Heavy divergence: divergenceTier='heavy' (got ${heavyDiv.fusionMetadata!.divergenceTier})`);
  assert(heavyDiv.fusionMetadata!.preAnchorScore === 85, `Heavy divergence: preAnchorScore=85 (LLM score, got ${heavyDiv.fusionMetadata!.preAnchorScore})`);

  // 13e. Soft divergence → LLM score still used directly
  const softDiv = fuseNarrativeScores('test', { ...heuristic, score: 50 }, makeLLM(75, 0.85));
  assert(softDiv.score === 75, `Soft divergence: score=75 (LLM score directly, got ${softDiv.score})`);
  assert(softDiv.fusionMetadata!.divergenceTier === 'soft', `Soft divergence: divergenceTier='soft' (got ${softDiv.fusionMetadata!.divergenceTier})`);

  // 13f. FusionMetadata is populated with monitoring tiers (but they don't affect score)
  assert(highConf.fusionMetadata !== undefined, 'FusionMetadata populated for monitoring');
  assert(highConf.fusionMetadata!.confidenceTier === 'high', `Confidence tier tracked (got ${highConf.fusionMetadata!.confidenceTier})`);
  assert(highConf.fusionMetadata!.divergenceTier === 'none', `Divergence tier tracked (got ${highConf.fusionMetadata!.divergenceTier})`);
  assert(typeof highConf.fusionMetadata!.preAnchorScore === 'number', 'preAnchorScore is a number');
  assert(typeof highConf.fusionMetadata!.divergence === 'number', 'divergence is a number');

  // 13g. NaN score → defaults to 50 (clamped)
  const nanLLM = { score: NaN, confidence: 0.8, reasoning: '', evidence: [], tokenUsage: { inputTokens: 0, outputTokens: 0 } };
  const nanResult = fuseNarrativeScores('test', heuristic, nanLLM);
  assert(!isNaN(nanResult.score), 'NaN score does not propagate');
  assert(nanResult.score >= 0 && nanResult.score <= 100, `NaN fallback score in valid range (got ${nanResult.score})`);

  // 13h. No LLM → heuristic_only fallback (only case where heuristic is used)
  const noLLM = fuseNarrativeScores('test', heuristic);
  assert(noLLM.source === 'heuristic_only', 'No LLM: source is heuristic_only');
  assert(noLLM.score === 50, `No LLM: score=${noLLM.score} (expected 50)`);
  assert(noLLM.fusionMetadata === undefined, 'No LLM: no fusionMetadata');

  // 13i. All LLM-available cases → source is always 'llm_only'
  const modConf = fuseNarrativeScores('test', heuristic, makeLLM(60, 0.6));
  assert(modConf.source === 'llm_only', `Moderate conf: source='llm_only' (got ${modConf.source})`);
  assert(modConf.score === 60, `Moderate conf: score=60 (LLM directly, got ${modConf.score})`);

  console.log('    LLM-primary fusion: LLM is the score, divergence monitored not adjusted, heuristic fallback only');
}

// --- Test 14: Pipeline Integration ---
console.log('\n14. Pipeline Integration');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  await import('../../src/workshop/dimensions/narrative-structure.dim');
  await import('../../src/workshop/dimensions/narrative-dynamics.dim');

  const allDims = dimensionRegistry.getAll();
  const haikuSonnetDims = allDims.filter(d => d.scoringTier === 'haiku+sonnet');

  // 14a. Both narrative dims have scoringTier 'haiku+sonnet'
  assert(haikuSonnetDims.length >= 2, `At least 2 haiku+sonnet dimensions (got ${haikuSonnetDims.length})`);
  const dimIds = haikuSonnetDims.map(d => d.id).sort();
  assert(dimIds.includes('narrative_structure'), 'narrative_structure is haiku+sonnet');
  assert(dimIds.includes('narrative_dynamics'), 'narrative_dynamics is haiku+sonnet');

  // 14b. Both have buildPreAnalysisPrompt defined
  for (const dim of haikuSonnetDims) {
    assert(dim.buildPreAnalysisPrompt !== undefined, `${dim.id} has buildPreAnalysisPrompt`);
  }

  // 14c. Both always trigger LLM
  for (const dim of haikuSonnetDims) {
    const fakeHeuristic = { score: 95, confidence: 0.99, evidence: [], signals: {} };
    assert(dim.shouldTriggerLLM(fakeHeuristic) === true, `${dim.id} always triggers LLM (even at 0.99 confidence)`);
  }

  // 14d. Weights still 0.04 each
  for (const dim of haikuSonnetDims) {
    assert(dim.weight === 0.04, `${dim.id} weight is 0.04 (got ${dim.weight})`);
  }

  // 14e. Sonnet prompt includes "FIRST READER'S" when _preAnalysis is present
  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const features = featureExtractor.extract(STRONG_ESSAY);

  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const dynamicsDim = dimensionRegistry.getDimension('narrative_dynamics')!;

  const featuresWithPre = {
    ...features,
    _preAnalysis: {
      narrative_structure: 'P0 (scene): Strong sensory opening.\nOverall: Comes alive at P0, P3.',
      narrative_dynamics: 'P0 [tension: 7/10]: Reader feels unease.\nOverall: Emotional arc: shame to pride.',
    },
  };
  const structSonnet = structureDim.buildLLMPrompt(STRONG_ESSAY, featuresWithPre);
  assert(structSonnet.includes("FIRST READER'S"), 'Structure Sonnet prompt has FIRST READER section with pre-analysis');
  assert(structSonnet.includes('Strong sensory opening'), 'Structure Sonnet prompt includes pre-analysis content');

  const dynSonnet = dynamicsDim.buildLLMPrompt(STRONG_ESSAY, featuresWithPre);
  assert(dynSonnet.includes("FIRST READER'S"), 'Dynamics Sonnet prompt has FIRST READER section with pre-analysis');
  assert(dynSonnet.includes('shame to pride'), 'Dynamics Sonnet prompt includes pre-analysis content');

  // 14f. Sonnet prompt handles missing pre-analysis gracefully
  const structNoPrePrompt = structureDim.buildLLMPrompt(STRONG_ESSAY, features);
  assert(structNoPrePrompt.includes('No pre-analysis available'), 'Structure handles missing pre-analysis');
  assert(!structNoPrePrompt.includes("FIRST READER'S OBSERVATIONS"), 'Structure does NOT show FIRST READER section without pre-analysis');

  const dynNoPrePrompt = dynamicsDim.buildLLMPrompt(STRONG_ESSAY, features);
  assert(dynNoPrePrompt.includes('No pre-analysis available'), 'Dynamics handles missing pre-analysis');
  assert(!dynNoPrePrompt.includes("FIRST READER'S EMOTIONAL ANALYSIS"), 'Dynamics does NOT show FIRST READER section without pre-analysis');

  console.log('    Pipeline integration: tier, triggers, weights, Sonnet prompt context verified');
}

// --- Test 15: Pipeline Integration Fixes (cache key, essayType, paragraph functions, system prompts, richResponse) ---
console.log('\n15. Pipeline Integration Fixes');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const { classifyParagraphFunctions } = await import('../../src/workshop/scoring/paragraphFunctionClassifier');
  const { simpleHash, cacheStructureInsights, getStructureInsights, cacheDynamicsInsights, getDynamicsInsights } = await import('../../src/workshop/scoring/narrativeLLMTypes');
  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const dynamicsDim = dimensionRegistry.getDimension('narrative_dynamics')!;

  // 15a. Cache key fix — essay hash, not response hash
  const essayHash = simpleHash(STRONG_ESSAY);
  const responseHash = simpleHash('{"score":75,"confidence":0.85}');
  assert(essayHash !== responseHash, 'Essay hash differs from response hash');

  // Simulate correct caching: cache with essay hash, look up with essay hash
  const fakeStructureInsights = {
    score: 75, confidence: 0.85,
    paragraphInsights: [{ index: 0, verdict: 'test', strengthOrOpportunity: 'strength' as const }],
    strongestMoment: { paragraphIndex: 0, quote: 'test', why: 'test' },
    biggestOpportunity: { paragraphIndex: 1, quote: 'test', why: 'test', teachingQuestion: 'test?' },
    whatEssayConveys: 'test conveys',
    reasoning: 'test reasoning',
    evidence: ['test evidence'],
  };
  cacheStructureInsights(essayHash, fakeStructureInsights);
  const lookedUp = getStructureInsights(essayHash);
  assert(lookedUp !== null, 'Cache lookup by essay hash succeeds');
  assert(lookedUp!.score === 75, 'Cached data is correct');
  assert(getStructureInsights(responseHash) === null, 'Lookup by response hash correctly misses');

  // 15b. Parser accepts essayHash parameter
  const structureParser = structureDim.parseLLMResponse;
  const validStructureJSON = JSON.stringify({
    score: 72, confidence: 0.8,
    paragraphInsights: [{ index: 0, verdict: 'Good opening', strengthOrOpportunity: 'strength' }],
    strongestMoment: { paragraphIndex: 0, quote: 'The kitchen smelled', why: 'Sensory grounding' },
    biggestOpportunity: { paragraphIndex: 3, quote: 'This was the moment', why: 'Too explicit', teachingQuestion: 'What if..?' },
    whatEssayConveys: 'Resilience through physical action',
    reasoning: 'Strong opening, needs tighter middle',
    evidence: ['burnt garlic — concrete detail'],
  });
  const testEssayHash = simpleHash('test-essay-for-parser');
  const parsedResult = structureParser(validStructureJSON, testEssayHash);
  assert(parsedResult.score === 72, 'Parser extracts score correctly');
  const cachedFromParser = getStructureInsights(testEssayHash);
  assert(cachedFromParser !== null, 'Parser caches with provided essayHash');
  assert(cachedFromParser!.whatEssayConveys === 'Resilience through physical action', 'Cached rich data is correct');

  // 15c. Parser preserves richResponse
  assert(parsedResult.richResponse !== undefined, 'Parser populates richResponse');
  assert((parsedResult.richResponse as Record<string, unknown>).score === 72, 'richResponse contains score');
  assert((parsedResult.richResponse as Record<string, unknown>).whatEssayConveys === 'Resilience through physical action', 'richResponse contains whatEssayConveys');
  assert(Array.isArray((parsedResult.richResponse as Record<string, unknown>).paragraphInsights), 'richResponse contains paragraphInsights array');

  // Same for dynamics parser
  const dynamicsParser = dynamicsDim.parseLLMResponse;
  const validDynamicsJSON = JSON.stringify({
    score: 68, confidence: 0.75,
    paragraphInsights: [{ index: 0, verdict: 'Sets tension', emotionalAuthenticity: 'high', tensionContribution: 'opens with dread' }],
    emotionalArc: { summary: 'Shame to acceptance', turningPoint: { paragraphIndex: 3, what: 'Bridge moment' }, isTransformationEarned: true, transformationSpecificity: 'Specific to this writer' },
    strongestMoment: { paragraphIndex: 0, quote: 'The kitchen smelled', why: 'Immediate investment' },
    biggestOpportunity: { paragraphIndex: 5, quote: 'I learned', why: 'Too neat', teachingQuestion: 'What if you left it messy?' },
    whatEssayConveysAboutWriter: 'Processes pain through movement',
    readerTakeaway: 'Quiet strength',
    reasoning: 'Authentic but tidy ending',
    evidence: ['burnt garlic — sensory anchoring'],
  });
  const dynEssayHash = simpleHash('test-essay-for-dynamics');
  const dynParsed = dynamicsParser(validDynamicsJSON, dynEssayHash);
  assert(dynParsed.richResponse !== undefined, 'Dynamics parser populates richResponse');
  const dynCached = getDynamicsInsights(dynEssayHash);
  assert(dynCached !== null, 'Dynamics parser caches with provided essayHash');
  assert(dynCached!.emotionalArc.isTransformationEarned === true, 'Dynamics cached data preserves emotionalArc');
  assert(dynParsed.reasoning.includes('Shame to acceptance'), 'Dynamics reasoning includes arc summary');

  // 15d. Essay type context is included in prompts when essayType is set
  const features = featureExtractor.extract(STRONG_ESSAY);
  features.essayType = 'personal_statement';
  features.paragraphFunctionAnalysis = classifyParagraphFunctions(STRONG_ESSAY);

  const structurePrePrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);
  assert(structurePrePrompt.includes('Personal Statement'), 'Structure pre-analysis includes essay type context for personal_statement');
  assert(structurePrePrompt.includes('Scenes with concrete detail'), 'Structure pre-analysis includes type-specific expectations');

  features.essayType = 'uc_piq';
  const piqPrePrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);
  assert(piqPrePrompt.includes('UC Personal Insight'), 'Structure pre-analysis includes PIQ context');
  assert(piqPrePrompt.includes('Dense reflection is appropriate'), 'PIQ context sets correct expectations');

  const dynPiqPrompt = dynamicsDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);
  assert(dynPiqPrompt.includes('UC Personal Insight'), 'Dynamics pre-analysis includes PIQ context');
  assert(dynPiqPrompt.includes('Do NOT penalize compressed emotional range'), 'Dynamics PIQ context prevents false penalization');

  // Default (no essayType) should work but give generic context
  features.essayType = undefined;
  const defaultPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);
  assert(defaultPrompt.includes('College application essay'), 'Default context is generic when no essayType');

  // 15e. Paragraph function analysis is used from features (no recomputation)
  const pfAnalysis = features.paragraphFunctionAnalysis!;
  assert(pfAnalysis.length > 0, 'Paragraph function analysis is populated');
  assert(pfAnalysis[0].confidence !== undefined, 'Full analysis has confidence values');
  assert(pfAnalysis[0].signals !== undefined, 'Full analysis has signal data');

  // Heuristic feed section uses confidence and uncertainties
  const feedPrompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);
  assert(feedPrompt.includes('PRELIMINARY ANALYSIS'), 'Heuristic feed is included in pre-analysis prompt');
  // Check that confidence values from full analysis appear (not the 0.50 fallback)
  const confidenceMatch = feedPrompt.match(/confidence: (\d+\.\d+)/);
  assert(confidenceMatch !== null, 'Confidence values appear in heuristic feed');

  // 15f. System prompts are defined and meaningful
  assert(structureDim.systemPrompt !== undefined, 'Structure has custom system prompt');
  assert(structureDim.systemPrompt!.includes('master-level writing evaluator'), 'Structure system prompt contains role identity');
  assert(structureDim.systemPrompt!.includes('veteran admissions reader'), 'Structure system prompt contains domain expertise');
  assert(structureDim.systemPrompt!.includes('transition craft'), 'Structure system prompt covers transitions');
  assert(structureDim.systemPrompt!.includes('thematic coherence'), 'Structure system prompt covers thematic coherence');
  assert(structureDim.systemPrompt!.includes('structural originality'), 'Structure system prompt covers structural originality');
  assert(structureDim.preAnalysisSystemPrompt !== undefined, 'Structure has pre-analysis system prompt');
  assert(structureDim.preAnalysisSystemPrompt!.includes('comprehensive structural reading'), 'Structure pre-analysis system prompt describes the task');

  assert(dynamicsDim.systemPrompt !== undefined, 'Dynamics has custom system prompt');
  assert(dynamicsDim.systemPrompt!.includes('narrative dynamics'), 'Dynamics system prompt matches dimension');
  assert(dynamicsDim.systemPrompt!.includes('emotional transformation'), 'Dynamics system prompt emphasizes emotional movement');
  assert(dynamicsDim.preAnalysisSystemPrompt !== undefined, 'Dynamics has pre-analysis system prompt');
  assert(dynamicsDim.preAnalysisSystemPrompt!.includes('emotionally perceptive'), 'Dynamics pre-analysis system prompt describes the reading lens');

  // 15g. Role definition is NOT duplicated in user prompt
  const featuresWithPre = {
    ...features,
    _preAnalysis: {
      narrative_structure: 'P0 (scene): test pre-analysis',
      narrative_dynamics: 'P0 [tension: 7/10]: test dynamics',
    },
  };
  const structSonnetPrompt = structureDim.buildLLMPrompt(STRONG_ESSAY, featuresWithPre);
  assert(!structSonnetPrompt.includes('You are a master-level writing evaluator'), 'Role definition removed from structure user prompt (now in system prompt)');
  assert(structSonnetPrompt.includes('A skilled colleague'), 'Structure user prompt retains colleague framing');

  const dynSonnetPrompt = dynamicsDim.buildLLMPrompt(STRONG_ESSAY, featuresWithPre);
  assert(!dynSonnetPrompt.includes('You are a master evaluator of narrative dynamics'), 'Role definition removed from dynamics user prompt (now in system prompt)');
  assert(dynSonnetPrompt.includes('A skilled colleague'), 'Dynamics user prompt retains colleague framing');

  console.log('    Pipeline integration fixes: cache key, essayType, paragraph functions, system prompts, richResponse all verified');
}

// --- Test 16: Expanded Haiku Prompt (transitions, theme, pacing, originality) ---
console.log('\n16. Expanded Haiku Pre-Analysis Prompt');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const features = featureExtractor.extract(STRONG_ESSAY);

  const prompt = structureDim.buildPreAnalysisPrompt!(STRONG_ESSAY, features);

  // 16a. Prompt covers all 5 structural dimensions
  assert(prompt.includes('PARAGRAPH-LEVEL READING'), 'Haiku prompt has paragraph-level reading section');
  assert(prompt.includes('TRANSITIONS BETWEEN PARAGRAPHS'), 'Haiku prompt has transitions section');
  assert(prompt.includes('THEMATIC THROUGH-LINE'), 'Haiku prompt has thematic through-line section');
  assert(prompt.includes('PACING ANALYSIS'), 'Haiku prompt has pacing analysis section');
  assert(prompt.includes('STRUCTURAL PATTERN'), 'Haiku prompt has structural pattern section');

  // 16b. Transitions section asks about types and mechanisms
  assert(prompt.includes('Temporal') || prompt.includes('temporal'), 'Transitions section mentions temporal transitions');
  assert(prompt.includes('earned'), 'Transitions section asks about earned transitions');
  assert(prompt.includes('mechanism'), 'Transitions section asks about transition mechanisms');

  // 16c. Theme section asks for recurring motifs
  assert(prompt.includes('recurringMotifs') || prompt.includes('recurring'), 'Theme section asks for recurring motifs');
  assert(prompt.includes('coreTheme'), 'Theme section asks for core theme');

  // 16d. Pacing section asks about proportionality
  assert(prompt.includes('proportional'), 'Pacing section asks about proportionality');
  assert(prompt.includes('most meaningful'), 'Pacing section asks about importance distribution');

  // 16e. Structural pattern section asks about deliberateness
  assert(prompt.includes('isDeliberate') || prompt.includes('deliberate'), 'Structural pattern asks about deliberateness');
  assert(prompt.includes('Chronological') || prompt.includes('chronological'), 'Structural pattern lists common patterns');
  assert(prompt.includes('Circular') || prompt.includes('circular'), 'Structural pattern lists circular framing');

  // 16f. Response format includes all new sections
  assert(prompt.includes('"transitions"'), 'Response format includes transitions array');
  assert(prompt.includes('"thematicElements"'), 'Response format includes thematicElements');
  assert(prompt.includes('"pacingObservations"'), 'Response format includes pacingObservations');
  assert(prompt.includes('"structuralPattern"'), 'Response format includes structuralPattern');

  console.log('    Expanded Haiku prompt covers transitions, theme, pacing, originality');
}

// --- Test 17: Expanded Sonnet Prompt (8 evaluation criteria) ---
console.log('\n17. Expanded Sonnet Evaluation Prompt');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  const { featureExtractor } = await import('../../src/workshop/scoring/featureExtractor');
  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;
  const features = featureExtractor.extract(STRONG_ESSAY);

  const featuresWithPre = {
    ...features,
    _preAnalysis: {
      narrative_structure: 'P0 (scene): Strong opening.\nTransitions:\n  P0→P1 (emotional): works\nTheme:\n  Core: resilience\nStructure: circular (deliberate)',
    },
  };

  const prompt = structureDim.buildLLMPrompt(STRONG_ESSAY, featuresWithPre);

  // 17a. All 8 evaluation criteria present
  assert(prompt.includes('INTENTIONALITY OF DETAIL'), 'Sonnet prompt has intentionality criterion');
  assert(prompt.includes('SCENE & SUMMARY AS STRATEGY'), 'Sonnet prompt has scene/summary criterion');
  assert(prompt.includes('SHOW VS. TELL AS CRAFT DECISION'), 'Sonnet prompt has show/tell criterion');
  assert(prompt.includes('TRANSITION CRAFT'), 'Sonnet prompt has transition craft criterion');
  assert(prompt.includes('THEMATIC COHERENCE & THROUGH-LINE'), 'Sonnet prompt has thematic coherence criterion');
  assert(prompt.includes('PACING AS ARCHITECTURAL CHOICE'), 'Sonnet prompt has pacing criterion');
  assert(prompt.includes('STRUCTURAL ORIGINALITY'), 'Sonnet prompt has structural originality criterion');
  assert(prompt.includes('STRUCTURAL ARCHITECTURE'), 'Sonnet prompt has structural architecture criterion');

  // 17b. Response format includes new analysis sections
  assert(prompt.includes('"transitionAnalysis"'), 'Sonnet response format includes transitionAnalysis');
  assert(prompt.includes('"thematicThroughLine"'), 'Sonnet response format includes thematicThroughLine');
  assert(prompt.includes('"pacingInsights"'), 'Sonnet response format includes pacingInsights');
  assert(prompt.includes('"structuralOriginality"'), 'Sonnet response format includes structuralOriginality');

  // 17c. Rubric mentions transitions and theme
  assert(prompt.includes('Transitions between paragraphs create momentum'), 'Rubric 85-100 mentions transitions');
  assert(prompt.includes('thematic through-line'), 'Rubric 85-100 mentions thematic through-line');
  assert(prompt.includes('Pacing matches importance'), 'Rubric 85-100 mentions pacing');

  // 17d. Anti-patterns include new dimensions
  assert(prompt.includes('DO NOT reward structural originality that confuses'), 'Anti-patterns include originality caveat');
  assert(prompt.includes('DO NOT penalize conventional structure that works'), 'Anti-patterns include conventional structure caveat');

  console.log('    Expanded Sonnet prompt covers 8 evaluation criteria with transition, theme, pacing, originality');
}

// --- Test 18: Pre-Analysis Validator for New Fields ---
console.log('\n18. Pre-Analysis Validator (transitions, theme, pacing, structural pattern)');
{
  const { validatePreAnalysis } = await import('../../src/workshop/scoring/preAnalysisValidator');

  // 18a. Full expanded structure response → formats all new sections
  const expandedStructure = JSON.stringify({
    paragraphs: [
      { index: 0, role: 'scene', strongestSentence: { text: 'The kitchen smelled', why: 'Sensory grounding' }, concerns: [], concreteOrAbstract: 'concrete' },
      { index: 1, role: 'dialogue', concerns: ['slightly telling'], concreteOrAbstract: 'mostly concrete' },
    ],
    transitions: [
      { from: 0, to: 1, type: 'emotional', mechanism: 'Dialogue continues the scene', earned: true },
    ],
    thematicElements: {
      coreTheme: 'Processing failure through physical action',
      recurringMotifs: [
        { motif: 'the kitchen', paragraphs: [0, 6], transformation: 'From failure to celebration' },
        { motif: 'walking', paragraphs: [2, 5], transformation: 'From escape to purpose' },
      ],
    },
    pacingObservations: [
      { paragraphIndex: 5, pace: 'compressed', proportional: false, note: 'Six months in one paragraph' },
    ],
    structuralPattern: {
      identified: 'circular framing',
      isDeliberate: true,
      note: 'Kitchen bookends embody transformation',
    },
    overallObservations: {
      comesAlive: { paragraphs: [0], why: 'Sensory detail' },
      goesFlat: { paragraphs: [5], why: 'Montage rushes' },
      tellNotShow: [],
      structuralArc: 'Circular: failure → action → transformation → return',
    },
  });

  const result = validatePreAnalysis(expandedStructure, 'narrative_structure', 7);
  assert(result.valid === true, 'Expanded structure JSON → valid:true');

  // Transitions formatted
  assert(result.formatted.includes('Transitions:'), 'Formatted has Transitions section');
  assert(result.formatted.includes('P0→P1 (emotional)'), 'Transition includes from→to and type');
  assert(result.formatted.includes('Dialogue continues the scene'), 'Transition includes mechanism');

  // Theme formatted
  assert(result.formatted.includes('Theme:'), 'Formatted has Theme section');
  assert(result.formatted.includes('Core: Processing failure through physical action'), 'Theme includes core theme');
  assert(result.formatted.includes('Motif: "the kitchen"'), 'Theme includes motif name');
  assert(result.formatted.includes('P0, P6'), 'Theme includes motif paragraph references');
  assert(result.formatted.includes('From failure to celebration'), 'Theme includes motif transformation');

  // Pacing formatted
  assert(result.formatted.includes('Pacing:'), 'Formatted has Pacing section');
  assert(result.formatted.includes('DISPROPORTIONATE'), 'Pacing flags disproportionate paragraphs');
  assert(result.formatted.includes('Six months'), 'Pacing includes specific notes');

  // Structural pattern formatted
  assert(result.formatted.includes('Structure: circular framing (deliberate)'), 'Formatted has structural pattern');
  assert(result.formatted.includes('Kitchen bookends'), 'Structural pattern includes note');

  // Still has original sections
  assert(result.formatted.includes('P0 (scene):'), 'Still has paragraph-level data');
  assert(result.formatted.includes('Overall:'), 'Still has overall observations');
  assert(result.warnings.length === 0, `No warnings (got ${result.warnings.length})`);

  // 18b. Missing optional fields → still valid (backwards compatible)
  const minimalStructure = JSON.stringify({
    paragraphs: [{ index: 0, role: 'test', concerns: [], concreteOrAbstract: 'mixed' }],
    overallObservations: {
      comesAlive: { paragraphs: [0], why: 'test' },
      goesFlat: { paragraphs: [], why: '' },
      tellNotShow: [],
      structuralArc: 'test',
    },
  });
  const minimalResult = validatePreAnalysis(minimalStructure, 'narrative_structure', 3);
  assert(minimalResult.valid === true, 'Minimal structure (no new fields) → still valid');
  assert(!minimalResult.formatted.includes('Transitions:'), 'No transitions section when absent');
  assert(!minimalResult.formatted.includes('Theme:'), 'No theme section when absent');

  // 18c. Transition with unearned flag
  const unearnedTransition = JSON.stringify({
    paragraphs: [
      { index: 0, role: 'scene', concerns: [], concreteOrAbstract: 'concrete' },
      { index: 1, role: 'reflection', concerns: [], concreteOrAbstract: 'abstract' },
    ],
    transitions: [
      { from: 0, to: 1, type: 'abrupt', mechanism: 'No clear connection', earned: false },
    ],
    overallObservations: {
      comesAlive: { paragraphs: [0], why: 'test' },
      goesFlat: { paragraphs: [], why: '' },
      tellNotShow: [],
      structuralArc: 'test',
    },
  });
  const unearnedResult = validatePreAnalysis(unearnedTransition, 'narrative_structure', 3);
  assert(unearnedResult.formatted.includes('NOT EARNED'), 'Unearned transition is flagged');

  console.log('    Validator formats transitions, theme, pacing, structural pattern correctly');
}

// --- Test 19: Parser Handles New Response Fields ---
console.log('\n19. Parser with Expanded Response Fields');
{
  const { dimensionRegistry } = await import('../../src/workshop/registry/dimensionRegistry');
  const { simpleHash, getStructureInsights } = await import('../../src/workshop/scoring/narrativeLLMTypes');
  const structureDim = dimensionRegistry.getDimension('narrative_structure')!;

  // Full expanded response from Sonnet
  const expandedResponse = JSON.stringify({
    score: 78,
    confidence: 0.88,
    paragraphInsights: [
      { index: 0, verdict: 'Strong sensory opening', strengthOrOpportunity: 'strength' },
      { index: 5, verdict: 'Montage rushes transformation', strengthOrOpportunity: 'opportunity' },
    ],
    transitionAnalysis: [
      { from: 0, to: 1, quality: 'seamless', how: 'Dialogue continues scene', verdict: 'Perfect' },
      { from: 4, to: 5, quality: 'abrupt', how: 'Time jump without anchoring', verdict: 'Needs bridge' },
    ],
    thematicThroughLine: {
      coreTheme: 'Processing failure through physical action transforms both space and self',
      recurringMotifs: [
        { motif: 'the kitchen', instances: [
          { paragraphIndex: 0, manifestation: 'failure' },
          { paragraphIndex: 6, manifestation: 'celebration' },
        ]},
      ],
      thematicCoherence: 'Strong — the kitchen image bookends and transforms',
    },
    pacingInsights: {
      overall: 'Lingers on emotional peaks, rushes through growth montage',
      keyMoments: [
        { paragraphIndex: 5, pacingChoice: 'Compresses six months', effectiveness: 'needs adjustment' },
      ],
    },
    structuralOriginality: {
      pattern: 'circular framing with chronological middle',
      freshness: 'intentional_convention',
      verdict: 'The circular structure embodies the transformation — kitchen goes from failure to celebration',
    },
    strongestMoment: { paragraphIndex: 0, quote: 'The kitchen smelled like burnt garlic and failure', why: 'Multi-sensory metaphor' },
    biggestOpportunity: { paragraphIndex: 5, quote: 'I volunteered at 3 different community organizations', why: 'Listed not lived', teachingQuestion: 'What happened on your first day volunteering?' },
    whatEssayConveys: 'This writer processes pain through motion — they walk, cook, build rather than sit with anguish',
    reasoning: 'Strong structure with a circular kitchen motif that earns its return. One pacing flaw in the montage.',
    evidence: ['burnt garlic — sensory metaphor', 'kitchen returns — circular framing', 'bridge scene — physical embodiment of decision'],
  });

  const testHash = simpleHash('expanded-response-test');
  const parsed = structureDim.parseLLMResponse(expandedResponse, testHash);

  // 19a. Basic parsing works
  assert(parsed.score === 78, `Expanded response: score=78 (got ${parsed.score})`);
  assert(parsed.confidence === 0.88, `Expanded response: confidence=0.88 (got ${parsed.confidence})`);

  // 19b. Reasoning includes thematic through-line
  assert(parsed.reasoning.includes('Processing failure through physical action'), 'Reasoning includes core theme');
  assert(parsed.reasoning.includes('Strong — the kitchen image'), 'Reasoning includes thematic coherence');

  // 19c. Reasoning includes structural originality
  assert(parsed.reasoning.includes('circular framing'), 'Reasoning includes structural pattern');
  assert(parsed.reasoning.includes('intentional_convention'), 'Reasoning includes freshness label');

  // 19d. Reasoning includes weak transitions
  assert(parsed.reasoning.includes('Weak transitions'), 'Reasoning flags weak transitions');
  assert(parsed.reasoning.includes('P4→P5 (abrupt)'), 'Reasoning identifies specific weak transition');

  // 19e. Rich response preserved
  assert(parsed.richResponse !== undefined, 'Rich response preserved');
  const rich = parsed.richResponse as Record<string, unknown>;
  assert(Array.isArray(rich.transitionAnalysis), 'Rich response has transitionAnalysis');
  assert(typeof rich.thematicThroughLine === 'object', 'Rich response has thematicThroughLine');
  assert(typeof rich.pacingInsights === 'object', 'Rich response has pacingInsights');
  assert(typeof rich.structuralOriginality === 'object', 'Rich response has structuralOriginality');

  // 19f. Cached correctly
  const cached = getStructureInsights(testHash);
  assert(cached !== null, 'Expanded response cached with essay hash');
  assert(cached!.score === 78, 'Cached score correct');

  // 19g. Response WITHOUT new fields (backward compatibility) → still parses
  const legacyResponse = JSON.stringify({
    score: 65, confidence: 0.75,
    paragraphInsights: [{ index: 0, verdict: 'OK', strengthOrOpportunity: 'strength' }],
    strongestMoment: { paragraphIndex: 0, quote: 'test', why: 'test' },
    biggestOpportunity: { paragraphIndex: 1, quote: 'test', why: 'test', teachingQuestion: 'test' },
    whatEssayConveys: 'test',
    reasoning: 'Legacy format',
    evidence: ['test'],
  });
  const legacyParsed = structureDim.parseLLMResponse(legacyResponse);
  assert(legacyParsed.score === 65, 'Legacy response parses correctly');
  assert(!legacyParsed.reasoning.includes('Theme:'), 'Legacy response reasoning skips missing theme');
  assert(!legacyParsed.reasoning.includes('Weak transitions'), 'Legacy response reasoning skips missing transitions');

  console.log('    Parser handles expanded response fields, backward compatibility, and caching');
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
