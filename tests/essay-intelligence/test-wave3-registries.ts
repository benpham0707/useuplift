/**
 * Wave 3 Tests: Extension System — Registries, Patterns, Signals, Strategies
 *
 * Tests:
 * 1. Registry initialization and manifest loading
 * 2. Pattern detection against sample essays
 * 3. Signal computation against extracted features
 * 4. Strategy detection from structure analysis
 * 5. Prompt builder integration with registry findings
 */

import { featureExtractor } from '../../src/workshop';
import { strategyRegistry } from '../../src/workshop/registry/strategyRegistry';
import { patternRegistry } from '../../src/workshop/registry/patternRegistry';
import { signalRegistry } from '../../src/workshop/registry/signalRegistry';
import { dimensionRegistry } from '../../src/workshop/registry/dimensionRegistry';
import { PromptBuilder } from '../../src/pipeline/promptBuilder';
import { analyzeEssayStructure } from '../../src/pipeline/structureAnalyzer';
import { analyzeThemes } from '../../src/pipeline/themeAnalyzer';
import { analyzeCharacterRevelation } from '../../src/pipeline/characterAnalyzer';
import { analyzeInsight } from '../../src/pipeline/insightAnalyzer';
import type { DeepContentAnalysis } from '../../src/pipeline/contentAnalysisTypes';
import type { AnnotationPipelineConfig, EnrichedFeatures } from '../../src/pipeline/types';

// ============================================================================
// TEST ESSAYS
// ============================================================================

const MONTAGE_ESSAY = `Age seven: I press my ear to the kitchen door and count the rising tones of my grandmother's Cantonese.

Age fourteen: I conjugate Spanish verbs in my head while my teacher speaks, a private translation loop running beneath the lesson.

Age seventeen: I type a Unicode character my phone doesn't recognize, then spend forty minutes building a font patch so it will.

The languages keep changing. The obsession doesn't.`;

const DIALOGUE_ESSAY = `"You don't look Indian," she said.

I had heard this before. What I hadn't decided yet was what to do with it.

That was the question I spent the next three years trying to answer — not "what do I look like?" but "who decides?"

I started with the mirror. Then I moved to the library. Then to the conversations I had been avoiding.`;

const BRACKET_ESSAY = `The fluorescent lights hummed above as I slid my grandmother's ring across the pawnshop counter. Mr. Chen picked it up with practiced fingers, turning it under the magnifying lamp.

"Fourteen karat," he said. "The stone is cloudy." He meant the diamond was flawed. I already knew that — my grandmother had told me the story a hundred times. How my grandfather had saved for three months, how the jeweler had offered him a clearer stone for twice the price, how he'd said, "She won't love me for the diamond."

I could have taken the forty dollars. Instead, I took the ring back. I held it up to the fluorescent light and watched the cloudy diamond scatter fragments of color across the glass counter — imperfect light, but light nonetheless.

That evening, I started writing. Not the college essay I'd been drafting for weeks, the one about my summer research internship and its tidy lessons about perseverance. I wrote about the ring. About how my grandfather chose the flawed diamond because perfection wasn't the point. About how I'd walked into that pawnshop ready to trade something irreplaceable for something I could spend.

Now when I sit down to write, I think about that cloudy diamond. I don't reach for the clearest word or the most polished sentence. I reach for the true one — the one with light inside it, even if you have to hold it at the right angle to see.`;

const WEAK_ESSAY = `Volunteering at the local food bank taught me many important lessons about life. Every Saturday morning, I would wake up early and go help sort donations and distribute food to families in need.

At first, I didn't want to go because I was tired from school. But my mom made me go anyway. After a few weeks, I started to enjoy it. The people there were really nice and I made some good friends.

One day, a little girl came in with her mother. She looked sad. I gave her an extra apple and she smiled. That moment changed my life. I realized that small acts of kindness can make a big difference in someone's day.

I am now a more empathetic and caring person because of my time at the food bank. I have learned the importance of giving back to my community and helping those less fortunate. This experience taught me that we should always try to help others whenever we can.`;

// ============================================================================
// HELPERS
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests(): Promise<void> {
  console.log('Wave 3: Extension System — Registry Tests');
  console.log('==========================================');

  // Initialize registries
  await dimensionRegistry.autoImport();
  await strategyRegistry.autoImport();
  await patternRegistry.autoImport();
  await signalRegistry.autoImport();

  // ---- Section 1: Registry Loading ----
  section('Registry Loading');

  assert(strategyRegistry.size === 5, `Strategy registry loaded 5 strategies (got ${strategyRegistry.size})`);
  assert(patternRegistry.size === 10, `Pattern registry loaded 10 patterns (got ${patternRegistry.size})`);
  assert(signalRegistry.size > 0, `Signal registry loaded ${signalRegistry.size} signals`);

  // Verify specific manifests exist
  assert(!!strategyRegistry.getStrategy('montage_technique'), 'Montage technique strategy exists');
  assert(!!strategyRegistry.getStrategy('bracket_structure'), 'Bracket structure strategy exists');
  assert(!!patternRegistry.getPattern('dialogue_opening'), 'Dialogue opening pattern exists');
  assert(!!patternRegistry.getPattern('callback_closing'), 'Callback closing pattern exists');

  // ---- Section 2: Pattern Detection ----
  section('Pattern Detection — Dialogue Essay');

  const dialoguePatterns = patternRegistry.detectAll(DIALOGUE_ESSAY);
  const dialoguePatternIds = dialoguePatterns.map(p => p.id);
  console.log(`  Detected patterns: ${dialoguePatternIds.join(', ')}`);

  assert(
    dialoguePatternIds.includes('dialogue_opening'),
    'Dialogue essay: detects dialogue opening pattern',
  );

  section('Pattern Detection — Bracket Essay');

  const bracketPatterns = patternRegistry.detectAll(BRACKET_ESSAY);
  const bracketPatternIds = bracketPatterns.map(p => p.id);
  console.log(`  Detected patterns: ${bracketPatternIds.join(', ')}`);

  assert(
    bracketPatternIds.includes('callback_closing') || bracketPatternIds.includes('image_closing'),
    'Bracket essay: detects callback or image closing pattern',
  );
  assert(
    bracketPatternIds.includes('fragment_emphasis') || bracketPatternIds.includes('pivot_transition'),
    'Bracket essay: detects fragment or pivot pattern',
  );

  section('Pattern Detection — Weak Essay');

  const weakPatterns = patternRegistry.detectAll(WEAK_ESSAY);
  console.log(`  Detected patterns: ${weakPatterns.map(p => p.id).join(', ') || '(none)'}`);

  // Weak essay should NOT detect sophisticated patterns
  assert(
    !weakPatterns.some(p => p.id === 'dialogue_opening'),
    'Weak essay: does NOT detect dialogue opening',
  );

  section('Pattern Detection — By Category');

  const openingPatterns = patternRegistry.detectByCategory(DIALOGUE_ESSAY, 'opening');
  assert(
    openingPatterns.length > 0,
    `Dialogue essay has ${openingPatterns.length} detected opening pattern(s)`,
  );

  // ---- Section 3: Signal Computation ----
  section('Signal Computation');

  const strongFeatures = featureExtractor.extract(BRACKET_ESSAY);
  const weakFeatures = featureExtractor.extract(WEAK_ESSAY);

  // Test specific dimension signal computation
  const dimensions = dimensionRegistry.getAll();
  const dimWithSignals = dimensions.filter(d => signalRegistry.listByDimension(d.id).length > 0);
  console.log(`  Dimensions with signals: ${dimWithSignals.length}`);

  for (const dim of dimWithSignals) {
    const strongScore = signalRegistry.computeForDimension(dim.id, strongFeatures, BRACKET_ESSAY);
    const weakScore = signalRegistry.computeForDimension(dim.id, weakFeatures, WEAK_ESSAY);
    console.log(`  ${dim.id}: strong=${strongScore}, weak=${weakScore}`);
  }

  // Strong essay should generally score higher than weak essay
  const strongTotal = dimWithSignals.reduce(
    (sum, d) => sum + signalRegistry.computeForDimension(d.id, strongFeatures, BRACKET_ESSAY), 0
  );
  const weakTotal = dimWithSignals.reduce(
    (sum, d) => sum + signalRegistry.computeForDimension(d.id, weakFeatures, WEAK_ESSAY), 0
  );
  assert(
    strongTotal > weakTotal,
    `Strong essay signal total (${strongTotal}) > weak essay signal total (${weakTotal})`,
  );

  // ---- Section 4: Strategy Detection ----
  section('Strategy Detection');

  const strategies = strategyRegistry.getAll();
  assert(strategies.length === 5, `5 strategies available (got ${strategies.length})`);

  // Verify essay type filtering
  const psStrategies = strategyRegistry.listByEssayType('personal_statement');
  assert(
    psStrategies.length === 5,
    `All 5 strategies apply to personal_statement (got ${psStrategies.length})`,
  );

  const activityStrategies = strategyRegistry.listByEssayType('activity_to_essay');
  console.log(`  Strategies for activity_to_essay: ${activityStrategies.map(s => s.id).join(', ')}`);

  // ---- Section 5: Prompt Builder Integration ----
  section('Prompt Builder Integration — With Registry Findings');

  const builder = new PromptBuilder();
  const config: AnnotationPipelineConfig = {
    essayType: 'personal_statement',
  };

  // Build deep content analysis
  const [structure, theme, character, insight] = [
    analyzeEssayStructure(BRACKET_ESSAY),
    analyzeThemes(BRACKET_ESSAY),
    analyzeCharacterRevelation(BRACKET_ESSAY),
    analyzeInsight(BRACKET_ESSAY),
  ];
  const deepContent: DeepContentAnalysis = { structure, theme, character, insight };

  // Build enriched features with patterns and strategy
  const enriched: EnrichedFeatures = {
    features: strongFeatures,
    deepContentAnalysis: deepContent,
    detectedPatterns: bracketPatterns,
    detectedStrategy: strategyRegistry.getStrategy('bracket_structure'),
  };

  const prompt = builder.buildPrompt(BRACKET_ESSAY, config, enriched);

  assert(
    prompt.userPrompt.includes('Detected Patterns & Strategy'),
    'Prompt includes Detected Patterns & Strategy section',
  );
  assert(
    prompt.userPrompt.includes('Bracket Structure'),
    'Prompt includes detected strategy name',
  );
  assert(
    prompt.userPrompt.includes('Detected prose patterns'),
    'Prompt includes detected patterns subsection',
  );

  // Verify without registry findings
  const enrichedBasic: EnrichedFeatures = {
    features: strongFeatures,
    deepContentAnalysis: deepContent,
  };
  const promptBasic = builder.buildPrompt(BRACKET_ESSAY, config, enrichedBasic);
  assert(
    !promptBasic.userPrompt.includes('Detected Patterns & Strategy'),
    'Basic prompt does NOT include registry section (no patterns detected)',
  );

  // Token comparison
  assert(
    prompt.estimatedTokens.user > promptBasic.estimatedTokens.user,
    `Registry findings add tokens (${prompt.estimatedTokens.user} > ${promptBasic.estimatedTokens.user})`,
  );

  // ---- Summary ----
  console.log('\n==========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
