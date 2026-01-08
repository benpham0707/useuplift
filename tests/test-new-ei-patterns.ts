/**
 * Test New EI Pattern Detection
 *
 * Validates that the new Emotional Intelligence patterns from supplemental
 * research are being detected correctly.
 */

import { semanticClicheAnalyzer } from '../src/services/commonAppWorkshop/services/semanticClicheAnalyzer';

// Test essay specifically designed to trigger new EI patterns
const TEST_ESSAY = `
I suffered through my parents' divorce, and nobody understood my pain.
That's when I realized I was destined for greatness. Against all odds, I
rose from the ashes and proved everyone wrong. I'll be honest - I was
the only one who could have saved the project. I single-handedly turned
everything around. In that moment, it all became clear to me.
`;

async function runTest() {
  console.log('NEW EI PATTERN DETECTION TEST');
  console.log('='.repeat(50));
  console.log('');

  const analysis = await semanticClicheAnalyzer.analyze(TEST_ESSAY, { pattern_only: true });

  console.log('Cliché Risk Score:', analysis.cliche_risk_score + '/100');
  console.log('');
  console.log('Language Clichés Detected (' + analysis.language_cliches.length + '):');
  for (const c of analysis.language_cliches) {
    console.log('  •', '"' + c.phrase + '"', '[' + c.type + ']');
    console.log('    Why:', c.why_cliche.substring(0, 80) + '...');
  }
  console.log('');
  console.log('Telling-Not-Showing Detected (' + analysis.telling_not_showing.length + '):');
  for (const t of analysis.telling_not_showing) {
    console.log('  •', '"' + t.phrase + '"');
    console.log('    What:', t.what_theyre_telling.substring(0, 70) + '...');
    console.log('    Fix:', t.how_to_show_instead.substring(0, 70) + '...');
  }

  // Verify specific new patterns
  const hasVictimPattern = analysis.telling_not_showing.some(t =>
    t.phrase.toLowerCase().includes('suffered') ||
    t.phrase.toLowerCase().includes('nobody understood')
  );
  const hasEpiphanyPattern = analysis.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('realized') ||
    c.phrase.toLowerCase().includes('became clear')
  );
  const hasMelodramaticPattern = analysis.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('against all odds') ||
    c.phrase.toLowerCase().includes('rose from the ashes')
  );
  const hasStrategicVulnerability = analysis.language_cliches.some(c =>
    c.phrase.toLowerCase().includes('i\'ll be honest')
  );
  const hasSelfAggrandizing = analysis.telling_not_showing.some(t =>
    t.phrase.toLowerCase().includes('single-handedly') ||
    t.phrase.toLowerCase().includes('only one who')
  );

  console.log('');
  console.log('='.repeat(50));
  console.log('NEW PATTERN VERIFICATION:');
  console.log('='.repeat(50));
  console.log('  • Passive victim framing:', hasVictimPattern ? '✅ DETECTED' : '❌ MISSED');
  console.log('  • False epiphany markers:', hasEpiphanyPattern ? '✅ DETECTED' : '❌ MISSED');
  console.log('  • Melodramatic self-positioning:', hasMelodramaticPattern ? '✅ DETECTED' : '❌ MISSED');
  console.log('  • Strategic vulnerability:', hasStrategicVulnerability ? '✅ DETECTED' : '❌ MISSED');
  console.log('  • Self-aggrandizing claims:', hasSelfAggrandizing ? '✅ DETECTED' : '❌ MISSED');

  const allPassed = hasVictimPattern && hasEpiphanyPattern && hasMelodramaticPattern &&
                    hasStrategicVulnerability && hasSelfAggrandizing;

  console.log('');
  if (allPassed) {
    console.log('✅ ALL NEW EI PATTERNS WORKING CORRECTLY');
  } else {
    console.log('❌ SOME PATTERNS NOT DETECTED');
    process.exit(1);
  }
}

runTest().catch(console.error);
