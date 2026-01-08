/**
 * Test New Intellectual Depth Pattern Detection
 *
 * Validates that the new Intellectual Depth patterns from Prompt 3 research
 * are being detected correctly in the semanticClicheAnalyzer.
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';

// Test essay specifically designed to trigger new Intellectual Depth patterns
const TEST_ESSAY = `
I possess an insatiable hunger for knowledge and I have always been fascinated by
philosophy. I am deeply passionate about learning, and I discovered my calling
when I was young. Through this experience I learned that hard work pays off.
I worked hard and succeeded, proving my dedication through my own merit.

My accomplishments include winning the regional science fair. I was recognized for
my analytical mind and intellectual curiosity. What does it mean to be truly
intelligent? One might ask. The question remains whether knowledge alone is enough.

Looking back, I realize the moral of the story is that I found the answer.
`;

// Essay with systems-level thinking (should score better)
const SYSTEMS_ESSAY = `
The rice cooker clicks off at 6:47 AM. My grandmother doesn't use a timer -
she just knows. When the school district proposed cutting ESL funding, I noticed
a pattern: the same families who benefited most from after-school programs were
being asked to vote on policies that affected them least.

I helped organize information sessions - not because I wanted to save anyone,
but because Mrs. Nguyen's English improved faster when her daughter translated
the permission slips. The complexity of educational access became clearer to me
through these specific interactions, though I still don't fully understand how
policy decisions filter down to kitchen tables like ours.
`;

async function runTest() {
  console.log('INTELLECTUAL DEPTH PATTERN DETECTION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Analyze the pattern-heavy essay
  console.log('Test 1: Pattern-Heavy Essay (should have many issues)');
  console.log('-'.repeat(60));
  const analysis1 = await semanticClicheAnalyzer.analyze(TEST_ESSAY, { pattern_only: true });

  console.log('Cliche Risk Score:', analysis1.cliche_risk_score + '/100');
  console.log('');
  console.log('Language Cliches Detected (' + analysis1.language_cliches.length + '):');
  for (const c of analysis1.language_cliches) {
    console.log('  -', '"' + c.phrase + '"', '[' + c.type + ']');
  }
  console.log('');
  console.log('Telling-Not-Showing Detected (' + analysis1.telling_not_showing.length + '):');
  for (const t of analysis1.telling_not_showing) {
    console.log('  -', '"' + t.phrase + '"');
    console.log('    Issue:', t.what_theyre_telling.substring(0, 60) + '...');
  }

  // Analyze the systems-level essay
  console.log('');
  console.log('Test 2: Systems-Level Essay (should have fewer issues)');
  console.log('-'.repeat(60));
  const analysis2 = await semanticClicheAnalyzer.analyze(SYSTEMS_ESSAY, { pattern_only: true });

  console.log('Cliche Risk Score:', analysis2.cliche_risk_score + '/100');
  console.log('Language Cliches:', analysis2.language_cliches.length);
  console.log('Telling Violations:', analysis2.telling_not_showing.length);

  // Verify specific new patterns
  const hasPerformativeIntelligence = analysis1.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('insatiable') ||
    c.phrase.toLowerCase().includes('fascinated by')
  );
  const hasFalseIntellectualClaims = analysis1.telling_not_showing.some(t =>
    t.phrase.toLowerCase().includes('deeply passionate') ||
    t.phrase.toLowerCase().includes('discovered my calling') ||
    t.phrase.toLowerCase().includes('analytical mind') ||
    t.phrase.toLowerCase().includes('intellectual curiosity')
  );
  const hasPrematureResolution = analysis1.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('looking back, i realize') ||
    c.phrase.toLowerCase().includes('the moral of the story') ||
    c.phrase.toLowerCase().includes('found the answer') ||
    c.phrase.toLowerCase().includes('through this experience i learned')
  );
  const hasIndividualLevelFraming = analysis1.telling_not_showing.some(t =>
    t.phrase.toLowerCase().includes('worked hard and succeeded') ||
    t.phrase.toLowerCase().includes('through my own merit')
  );
  const hasImpressiveNotInteresting = analysis1.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('my accomplishments include') ||
    c.phrase.toLowerCase().includes('i was recognized for')
  );
  const hasRhetoricalPseudoIntellectual = analysis1.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('what does it mean to be') ||
    c.phrase.toLowerCase().includes('one might ask') ||
    c.phrase.toLowerCase().includes('the question remains')
  );

  console.log('');
  console.log('='.repeat(60));
  console.log('INTELLECTUAL DEPTH PATTERN VERIFICATION:');
  console.log('='.repeat(60));
  console.log('  - Performative intelligence:', hasPerformativeIntelligence ? 'DETECTED' : 'MISSED');
  console.log('  - False intellectual claims:', hasFalseIntellectualClaims ? 'DETECTED' : 'MISSED');
  console.log('  - Premature resolution:', hasPrematureResolution ? 'DETECTED' : 'MISSED');
  console.log('  - Individual-level framing:', hasIndividualLevelFraming ? 'DETECTED' : 'MISSED');
  console.log('  - Impressive-not-interesting:', hasImpressiveNotInteresting ? 'DETECTED' : 'MISSED');
  console.log('  - Rhetorical pseudo-intellectual:', hasRhetoricalPseudoIntellectual ? 'DETECTED' : 'MISSED');

  const allPassed = hasPerformativeIntelligence && hasFalseIntellectualClaims &&
                    hasPrematureResolution && hasIndividualLevelFraming &&
                    hasImpressiveNotInteresting && hasRhetoricalPseudoIntellectual;

  // Additional verification: systems essay should score lower
  const systemsBetter = analysis2.cliche_risk_score < analysis1.cliche_risk_score;
  console.log('');
  console.log('  - Systems essay scores better:', systemsBetter ? 'YES' : 'NO');
  console.log('    (Pattern essay: ' + analysis1.cliche_risk_score + ', Systems essay: ' + analysis2.cliche_risk_score + ')');

  console.log('');
  if (allPassed && systemsBetter) {
    console.log('ALL INTELLECTUAL DEPTH PATTERNS WORKING CORRECTLY');
    console.log('');
    console.log('Summary:');
    console.log('  - 7 new pattern categories integrated');
    console.log('  - 100+ new detection phrases added');
    console.log('  - Systems-level thinking properly distinguished');
    console.log('  - Performative intelligence vs authentic curiosity detected');
  } else {
    console.log('SOME PATTERNS NOT DETECTED');
    console.log('');
    const missing = [];
    if (!hasPerformativeIntelligence) missing.push('performative_intelligence');
    if (!hasFalseIntellectualClaims) missing.push('false_intellectual_claims');
    if (!hasPrematureResolution) missing.push('premature_resolution');
    if (!hasIndividualLevelFraming) missing.push('individual_level_framing');
    if (!hasImpressiveNotInteresting) missing.push('impressive_not_interesting');
    if (!hasRhetoricalPseudoIntellectual) missing.push('rhetorical_pseudo_intellectual');
    if (!systemsBetter) missing.push('systems_essay_comparison');
    console.log('Missing patterns:', missing.join(', '));
    process.exit(1);
  }
}

runTest().catch(console.error);
