/**
 * Phase 5 Integration Tests — Workshop Bridge & Feature Flag
 *
 * Validates:
 * - Workshop bridge produces valid EssaySnapshot from new pipeline
 * - Feature flag routing works in preAnalyzer
 * - New pipeline weights and commands accessible
 * - Profile context generation
 * - Strategy recommendations
 * - Cross-system comparison (old 12-dim vs new 13-dim format)
 */

// Import new workshop system (triggers registration)
import '../../src/workshop/essay-profiles';
import '../../src/workshop/dimensions/narrative-craft.dim';
import '../../src/workshop/dimensions/emotional-resonance.dim';
import '../../src/workshop/dimensions/intellectual-vitality.dim';
import '../../src/workshop/dimensions/originality-voice.dim';
import '../../src/workshop/dimensions/structural-coherence.dim';
import '../../src/workshop/dimensions/word-economy.dim';
import '../../src/workshop/dimensions/thematic-depth.dim';
import '../../src/workshop/dimensions/opening-hook.dim';
import '../../src/workshop/dimensions/closing-impact.dim';
import '../../src/workshop/dimensions/growth-transformation.dim';
import '../../src/workshop/dimensions/authenticity-specificity.dim';
import '../../src/workshop/dimensions/tonal-sophistication.dim';
import '../../src/workshop/dimensions/argument-rhetorical.dim';
import '../../src/workshop/commands/sharpen-claim.cmd';
import '../../src/workshop/commands/add-counterpoint.cmd';
import '../../src/workshop/commands/deepen-analysis.cmd';
import '../../src/workshop/commands/shift-tone.cmd';
import '../../src/workshop/commands/map-emotional-arc.cmd';
import '../../src/workshop/commands/sharpen-diction.cmd';
import '../../src/workshop/commands/improve-rhythm.cmd';
import '../../src/workshop/commands/improve-transition.cmd';
import '../../src/workshop/commands/thread-metaphor.cmd';
import '../../src/workshop/commands/scan-audience-awareness.cmd';

import {
  preAnalyzeWithNewPipeline,
  fullAnalyzeWithNewPipeline,
  scoringResultToSnapshot,
  getNewRubricWeights,
  getExpandedValidCommands,
  buildProfileContext,
  getStrategyRecommendations,
} from '../../src/services/enhancedWorkshop/workshopBridge';

import { hybridScoringPipeline } from '../../src/workshop/scoring/hybridScoringPipeline';
import { dimensionRegistry } from '../../src/workshop/registry/dimensionRegistry';
import { essayProfileRegistry } from '../../src/workshop/registry/essayProfileRegistry';
import type { EssaySnapshot } from '../../src/services/enhancedWorkshop/types';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ============================================================================
// TEST ESSAYS
// ============================================================================

const STRONG_NARRATIVE = `The kitchen smelled of cinnamon and cardamom when I first heard my grandmother's voice crack. She was telling me about the partition — 1947, the year her family walked from Lahore to Delhi with nothing but the clothes on their backs and a brass pot that had belonged to her great-grandmother.

"We thought we would go back," she said, stirring the chai with a steady hand that belied the tremor in her voice. "Everyone thought it was temporary."

I was fourteen, sitting at the counter doing AP World History homework — ironically, reading about the very event she was describing. But the textbook version was clean, clinical. Two hundred words about "population transfers" and "communal violence." My grandmother's version had the smell of burning wheat fields and the sound of her mother singing to keep the children calm during the crossing.

That afternoon changed how I read history. I started seeking out oral histories, interviewing elderly community members, recording their stories. What I found wasn't just personal — it was methodological. The gaps between official narratives and lived experience weren't anomalies; they were the whole point.

I now lead our school's Oral History Project, training twelve other students in interview techniques and archival preservation. We've collected forty-seven hours of testimony from South Asian elders in our community. Three of these recordings were selected by the Smithsonian's oral history division for their digital archive.

But the project's real impact isn't measured in hours or selections. It's in the moment when Priya Auntie, who had never told her grandchildren about fleeing Bangladesh in 1971, finally spoke her truth into our microphone — and then asked us for a copy so her family could hear it too.

History isn't what happened. It's what we choose to remember, and who gets to tell it.`;

const WEAK_GENERIC = `I have always been passionate about helping others. Since I was young, I have been involved in many community service activities that have taught me valuable lessons about life and leadership.

In high school, I joined several clubs and organizations. I was president of the service club where I organized many events. I also volunteered at the local hospital and food bank. These experiences were very meaningful to me and helped me grow as a person.

One experience that stands out is when I helped organize a food drive for our community. It was challenging but rewarding. I learned that hard work pays off and that helping others is its own reward. This experience taught me the importance of giving back.

I believe that my experiences have prepared me well for college. I am eager to continue making a difference in my community and to learn from others who share my passion for service.`;

const WHY_US_ESSAY = `When I visited MIT's campus last fall, I didn't just see a university — I saw the future I want to build. Walking through the Media Lab, I watched students prototyping neural interfaces that could help paralyzed patients communicate. That intersection of neuroscience and engineering is exactly where I want to work.

Professor Hugh Herr's Biomechatronics group has published research on powered ankle-foot prostheses that fascinate me. His team's approach to combining mechanical engineering with biological signal processing mirrors my own interdisciplinary interests. I've spent two years building EMG-controlled robotic hands in my school's makerspace, and I want to take that work further under researchers who are redefining what's possible.

Beyond the lab, MIT's UROP program would let me start research from freshman year. I'm particularly drawn to Course 2A (Mechanical Engineering with a focus on Biomedical), which allows the customization I need to bridge my interests in biomechanics and signal processing.`;

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('Phase 5 Integration Tests — Workshop Bridge & Feature Flag');
  console.log('='.repeat(70));

  // ------------------------------------------------------------------
  section('1. Workshop Bridge — preAnalyzeWithNewPipeline');
  // ------------------------------------------------------------------

  const snapshot = preAnalyzeWithNewPipeline(STRONG_NARRATIVE);

  // Validate EssaySnapshot shape
  assert(typeof snapshot.text === 'string' && snapshot.text.length > 0, 'Snapshot has text');
  assert(typeof snapshot.wordCount === 'number' && snapshot.wordCount > 100, `Word count reasonable (${snapshot.wordCount})`);
  assert(typeof snapshot.eqi === 'number' && snapshot.eqi >= 0 && snapshot.eqi <= 100, `EQI in range (${snapshot.eqi})`);
  assert(typeof snapshot.impressionLabel === 'string' && snapshot.impressionLabel.length > 0, 'Has impression label');
  assert(Array.isArray(snapshot.weakestDimensions) && snapshot.weakestDimensions.length === 3, '3 weakest dimensions');
  assert(Array.isArray(snapshot.flags), 'Has flags array');

  // Dimension scores should be 0-10 scale (bridge converts from 0-100)
  const dimScoreKeys = Object.keys(snapshot.dimensionScores);
  assert(dimScoreKeys.length === 13, `13 dimension scores (got ${dimScoreKeys.length})`);

  for (const [dimId, score] of Object.entries(snapshot.dimensionScores)) {
    assert(score >= 0 && score <= 10, `${dimId} score in 0-10 range (${score})`);
  }

  // ------------------------------------------------------------------
  section('2. Workshop Bridge — Comparison: Strong vs Weak');
  // ------------------------------------------------------------------

  const weakSnapshot = preAnalyzeWithNewPipeline(WEAK_GENERIC);

  assert(snapshot.eqi > weakSnapshot.eqi, `Strong EQI (${snapshot.eqi}) > Weak EQI (${weakSnapshot.eqi})`);

  console.log(`  Strong: EQI=${snapshot.eqi}, Label=${snapshot.impressionLabel}`);
  console.log(`  Weak:   EQI=${weakSnapshot.eqi}, Label=${weakSnapshot.impressionLabel}`);

  // ------------------------------------------------------------------
  section('3. Workshop Bridge — Essay Type Profiles');
  // ------------------------------------------------------------------

  const psSnapshot = preAnalyzeWithNewPipeline(STRONG_NARRATIVE, 'personal_statement');
  const analyticalSnapshot = preAnalyzeWithNewPipeline(STRONG_NARRATIVE, 'analytical');

  // Both should produce valid snapshots
  assert(psSnapshot.eqi >= 0 && psSnapshot.eqi <= 100, `Personal statement EQI valid (${psSnapshot.eqi})`);
  assert(analyticalSnapshot.eqi >= 0 && analyticalSnapshot.eqi <= 100, `Analytical EQI valid (${analyticalSnapshot.eqi})`);

  // Personal statement should score higher for a narrative essay
  assert(
    psSnapshot.eqi > analyticalSnapshot.eqi,
    `Narrative essay: PS EQI (${psSnapshot.eqi}) > Analytical EQI (${analyticalSnapshot.eqi})`
  );

  const diff = psSnapshot.eqi - analyticalSnapshot.eqi;
  console.log(`  Profile diff: personal_statement EQI=${psSnapshot.eqi} vs analytical EQI=${analyticalSnapshot.eqi} (${diff.toFixed(1)} pts)`);

  // Why Us essay under different profiles
  const whyUsAsWhyUs = preAnalyzeWithNewPipeline(WHY_US_ESSAY, 'why_us');
  const whyUsAsPS = preAnalyzeWithNewPipeline(WHY_US_ESSAY, 'personal_statement');

  assert(
    whyUsAsWhyUs.eqi > whyUsAsPS.eqi,
    `Why Us essay: why_us EQI (${whyUsAsWhyUs.eqi}) > personal_statement EQI (${whyUsAsPS.eqi})`
  );

  console.log(`  Why Us essay: why_us profile EQI=${whyUsAsWhyUs.eqi} vs PS profile EQI=${whyUsAsPS.eqi}`);

  // ------------------------------------------------------------------
  section('4. Workshop Bridge — scoringResultToSnapshot');
  // ------------------------------------------------------------------

  const rawResult = hybridScoringPipeline.scoreHeuristicOnly(STRONG_NARRATIVE);
  const converted = scoringResultToSnapshot(STRONG_NARRATIVE, rawResult);

  assert(converted.eqi === rawResult.eqi, 'EQI preserved through conversion');
  assert(converted.impressionLabel === rawResult.impressionLabel, 'Impression label preserved');
  assert(Object.keys(converted.dimensionScores).length === 13, '13 dimensions in converted snapshot');

  // Verify 0-100 → 0-10 conversion
  for (const ds of rawResult.dimensionScores) {
    const expected = Math.round(ds.score / 10 * 10) / 10;
    const actual = converted.dimensionScores[ds.dimensionId];
    assert(
      Math.abs(actual - expected) < 0.01,
      `${ds.dimensionId}: ${ds.score}/100 → ${actual}/10 (expected ${expected})`
    );
  }

  // ------------------------------------------------------------------
  section('5. Workshop Bridge — getNewRubricWeights');
  // ------------------------------------------------------------------

  const weights = getNewRubricWeights();
  const weightKeys = Object.keys(weights);

  assert(weightKeys.length === 13, `13 dimension weights (got ${weightKeys.length})`);

  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  assert(
    Math.abs(weightSum - 1.0) < 0.001,
    `Weights sum to 1.00 (got ${weightSum.toFixed(4)})`
  );

  // Spot-check some weights
  assert(weights['originality_voice_authenticity'] === 0.10, 'Originality weight = 0.10');
  assert(weights['narrative_craft_storytelling'] === 0.08, 'Narrative craft weight = 0.08');
  assert(weights['argument_rhetorical_craft'] === 0.07, 'Argument weight = 0.07');

  // ------------------------------------------------------------------
  section('6. Workshop Bridge — getExpandedValidCommands');
  // ------------------------------------------------------------------

  const commands = getExpandedValidCommands();

  // Should include all 15 old commands
  const oldCommands = [
    'make_concrete', 'show_dont_tell', 'clarify_learning', 'add_stakes',
    'strengthen_voice', 'cut_filler', 'add_evidence', 'deepen_vulnerability',
    'connect_to_theme', 'fix_hook', 'sharpen_ending', 'expand_moment',
    'compress', 'add_dialogue', 'remove_cliche',
  ];
  for (const cmd of oldCommands) {
    assert(commands.has(cmd), `Old command '${cmd}' present`);
  }

  // Should include all 10 new commands
  const newCommands = [
    'sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'shift_tone',
    'map_emotional_arc', 'sharpen_diction', 'improve_rhythm', 'improve_transition',
    'thread_metaphor', 'scan_audience_awareness',
  ];
  for (const cmd of newCommands) {
    assert(commands.has(cmd), `New command '${cmd}' present`);
  }

  assert(commands.size >= 25, `At least 25 total commands (got ${commands.size})`);
  console.log(`  Total commands: ${commands.size} (15 old + ${commands.size - 15} new)`);

  // ------------------------------------------------------------------
  section('7. Workshop Bridge — buildProfileContext');
  // ------------------------------------------------------------------

  const psContext = buildProfileContext('personal_statement');
  assert(psContext.length > 0, 'Personal statement context generated');
  assert(psContext.includes('Common Mistakes'), 'Contains anti-patterns section');
  assert(psContext.includes('Preferred Commands'), 'Contains preferred commands section');
  assert(psContext.includes('Teaching Tone'), 'Contains teaching tone section');

  const analyticalContext = buildProfileContext('analytical');
  assert(analyticalContext.length > 0, 'Analytical context generated');
  assert(analyticalContext.includes('sharpen_claim'), 'Analytical context includes sharpen_claim');

  // No profile for 'other' type
  const otherContext = buildProfileContext('other');
  assert(otherContext === '', "'other' type returns empty context");

  // No essay type returns empty
  const noContext = buildProfileContext(undefined);
  assert(noContext === '', 'undefined returns empty context');

  // ------------------------------------------------------------------
  section('8. Workshop Bridge — getStrategyRecommendations');
  // ------------------------------------------------------------------

  const psRecs = getStrategyRecommendations('personal_statement');
  assert(psRecs.length > 0, 'Personal statement gets recommendations');

  const whyUsRecs = getStrategyRecommendations('why_us');
  assert(whyUsRecs.length > 0, 'Why Us gets recommendations');

  const analyticalRecs = getStrategyRecommendations('analytical');
  assert(analyticalRecs.length > 0, 'Analytical gets recommendations');

  // Top recommendation for analytical should be argument-oriented
  assert(
    ['strengthen_argument', 'ao_ready_polish'].includes(analyticalRecs[0].strategy.id),
    `Analytical top strategy: ${analyticalRecs[0].strategy.id}`
  );

  // ------------------------------------------------------------------
  section('9. Feature Flag Routing — preAnalyze');
  // ------------------------------------------------------------------

  // Test that preAnalyze with useNewPipeline=true routes to new pipeline
  // We can't call the old pipeline without the analyzeEssay engine being available,
  // but we CAN test that the new pipeline path works end-to-end

  // Direct import to test the function signature
  const { preAnalyze } = await import('../../src/services/enhancedWorkshop/preAnalyzer');

  // New pipeline mode should work synchronously (heuristic-only)
  const newPipelineResult = await preAnalyze(STRONG_NARRATIVE, 'personal_statement', true);
  assert(newPipelineResult.eqi >= 0, `New pipeline preAnalyze returns valid EQI (${newPipelineResult.eqi})`);
  assert(
    Object.keys(newPipelineResult.dimensionScores).length === 13,
    `New pipeline returns 13 dimensions (got ${Object.keys(newPipelineResult.dimensionScores).length})`
  );

  const weakNewResult = await preAnalyze(WEAK_GENERIC, 'personal_statement', true);
  assert(
    newPipelineResult.eqi > weakNewResult.eqi,
    `New pipeline: strong (${newPipelineResult.eqi}) > weak (${weakNewResult.eqi})`
  );

  // ------------------------------------------------------------------
  section('10. Cross-System Format Compatibility');
  // ------------------------------------------------------------------

  // Verify the EssaySnapshot from the new pipeline has the same shape
  // as what the old system produces (for compatibility with regression guard, etc.)

  function validateSnapshotShape(snap: EssaySnapshot, label: string): void {
    assert(typeof snap.text === 'string', `${label}: text is string`);
    assert(typeof snap.wordCount === 'number', `${label}: wordCount is number`);
    assert(typeof snap.eqi === 'number', `${label}: eqi is number`);
    assert(typeof snap.dimensionScores === 'object', `${label}: dimensionScores is object`);
    assert(typeof snap.impressionLabel === 'string', `${label}: impressionLabel is string`);
    assert(Array.isArray(snap.weakestDimensions), `${label}: weakestDimensions is array`);
    assert(Array.isArray(snap.flags), `${label}: flags is array`);

    // All scores should be 0-10
    for (const [dim, score] of Object.entries(snap.dimensionScores)) {
      assert(score >= 0 && score <= 10, `${label}: ${dim} score ${score} in 0-10 range`);
    }
  }

  validateSnapshotShape(snapshot, 'Strong essay');
  validateSnapshotShape(weakSnapshot, 'Weak essay');
  validateSnapshotShape(whyUsAsWhyUs, 'Why Us essay');

  // ------------------------------------------------------------------
  section('11. Performance');
  // ------------------------------------------------------------------

  // The new pipeline in heuristic-only mode should be very fast
  const perfStart = Date.now();
  for (let i = 0; i < 100; i++) {
    preAnalyzeWithNewPipeline(STRONG_NARRATIVE);
  }
  const perfTime = Date.now() - perfStart;
  const avgMs = perfTime / 100;

  assert(avgMs < 10, `Average analysis time < 10ms (got ${avgMs.toFixed(2)}ms)`);
  console.log(`  100 analyses in ${perfTime}ms (avg ${avgMs.toFixed(2)}ms each)`);

  // ------------------------------------------------------------------
  section('12. All Essay Types Under All Profiles');
  // ------------------------------------------------------------------

  const testEssays = [
    { text: STRONG_NARRATIVE, label: 'strong-narrative' },
    { text: WEAK_GENERIC, label: 'weak-generic' },
    { text: WHY_US_ESSAY, label: 'why-us' },
  ];

  const profiles = essayProfileRegistry.getAll();
  console.log(`  Testing ${testEssays.length} essays x ${profiles.length} profiles = ${testEssays.length * profiles.length} combinations`);

  for (const essay of testEssays) {
    for (const profile of profiles) {
      const result = preAnalyzeWithNewPipeline(essay.text, profile.id);
      assert(
        result.eqi >= 0 && result.eqi <= 100,
        `${essay.label} + ${profile.id}: EQI in range (${result.eqi})`
      );
    }
  }

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------

  console.log('\n' + '='.repeat(70));
  console.log(`Phase 5 Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);

  if (failed > 0) {
    console.log('\nFAILED TESTS DETECTED');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
