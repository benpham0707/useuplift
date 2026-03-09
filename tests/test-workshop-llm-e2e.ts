/**
 * Workshop LLM E2E Test — Full Hybrid Pipeline with Real API Calls
 *
 * Runs the 13-dimension hybrid scoring pipeline on diverse essays
 * WITH actual Haiku/Sonnet LLM calls. Reports:
 * - Per-dimension scores (heuristic vs fused)
 * - Which dimensions triggered LLM calls
 * - Costs and timing
 * - Profile-aware scoring comparisons
 * - Strategy recommendations from real scores
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 * Estimated cost: ~$0.10-0.15
 */

import { requireApiKey } from './utils/loadEnv';

// Import workshop system (triggers registration)
import '../src/workshop/essay-profiles';
import '../src/workshop/dimensions/narrative-craft.dim';
import '../src/workshop/dimensions/emotional-resonance.dim';
import '../src/workshop/dimensions/intellectual-vitality.dim';
import '../src/workshop/dimensions/originality-voice.dim';
import '../src/workshop/dimensions/structural-coherence.dim';
import '../src/workshop/dimensions/word-economy.dim';
import '../src/workshop/dimensions/thematic-depth.dim';
import '../src/workshop/dimensions/opening-hook.dim';
import '../src/workshop/dimensions/closing-impact.dim';
import '../src/workshop/dimensions/growth-transformation.dim';
import '../src/workshop/dimensions/authenticity-specificity.dim';
import '../src/workshop/dimensions/tonal-sophistication.dim';
import '../src/workshop/dimensions/argument-rhetorical.dim';

import { hybridScoringPipeline } from '../src/workshop/scoring/hybridScoringPipeline';
import { eqiCalculator } from '../src/workshop/scoring/eqiCalculator';
import { strategySelector } from '../src/workshop/orchestrator/strategySelector';
import { essayProfileRegistry } from '../src/workshop/registry/essayProfileRegistry';
import type { ScoringResult, WorkshopEssayType } from '../src/workshop/shared/types';

// ============================================================================
// TEST ESSAYS — Diverse quality levels and essay types
// ============================================================================

interface TestEssay {
  id: string;
  label: string;
  bestProfileType: WorkshopEssayType;
  expectedQuality: 'strong' | 'medium' | 'weak';
  text: string;
}

const TEST_ESSAYS: TestEssay[] = [
  {
    id: 'strong_narrative',
    label: 'Strong Personal Narrative',
    bestProfileType: 'personal_statement',
    expectedQuality: 'strong',
    text: `The kitchen smelled of cinnamon and cardamom when I first heard my grandmother's voice crack. She was telling me about the partition — 1947, the year her family walked from Lahore to Delhi with nothing but the clothes on their backs and a brass pot that had belonged to her great-grandmother.

"We thought we would go back," she said, stirring the chai with a steady hand that belied the tremor in her voice. "Everyone thought it was temporary."

I was fourteen, sitting at the counter doing AP World History homework — ironically, reading about the very event she was describing. But the textbook version was clean, clinical. Two hundred words about "population transfers" and "communal violence." My grandmother's version had the smell of burning wheat fields and the sound of her mother singing to keep the children calm during the crossing.

That afternoon changed how I read history. I started seeking out oral histories, interviewing elderly community members, recording their stories. What I found wasn't just personal — it was methodological. The gaps between official narratives and lived experience weren't anomalies; they were the whole point.

I now lead our school's Oral History Project, training twelve other students in interview techniques and archival preservation. We've collected forty-seven hours of testimony from South Asian elders in our community. Three of these recordings were selected by the Smithsonian's oral history division for their digital archive.

But the project's real impact isn't measured in hours or selections. It's in the moment when Priya Auntie, who had never told her grandchildren about fleeing Bangladesh in 1971, finally spoke her truth into our microphone — and then asked us for a copy so her family could hear it too.

History isn't what happened. It's what we choose to remember, and who gets to tell it.`,
  },

  {
    id: 'weak_generic',
    label: 'Weak Generic Essay',
    bestProfileType: 'personal_statement',
    expectedQuality: 'weak',
    text: `I have always been passionate about helping others. Since I was young, I have been involved in many community service activities that have taught me valuable lessons about life and leadership.

In high school, I joined several clubs and organizations. I was president of the service club where I organized many events. I also volunteered at the local hospital and food bank. These experiences were very meaningful to me and helped me grow as a person.

One experience that stands out is when I helped organize a food drive for our community. It was challenging but rewarding. I learned that hard work pays off and that helping others is its own reward. This experience taught me the importance of giving back.

I believe that my experiences have prepared me well for college. I am eager to continue making a difference in my community and to learn from others who share my passion for service.`,
  },

  {
    id: 'why_us_mit',
    label: '"Why Us" MIT Essay',
    bestProfileType: 'why_us',
    expectedQuality: 'strong',
    text: `When I visited MIT's campus last fall, I didn't just see a university — I saw the future I want to build. Walking through the Media Lab, I watched students prototyping neural interfaces that could help paralyzed patients communicate. That intersection of neuroscience and engineering is exactly where I want to work.

Professor Hugh Herr's Biomechatronics group has published research on powered ankle-foot prostheses that fascinate me. His team's approach to combining mechanical engineering with biological signal processing mirrors my own interdisciplinary interests. I've spent two years building EMG-controlled robotic hands in my school's makerspace, and I want to take that work further under researchers who are redefining what's possible.

Beyond the lab, MIT's UROP program would let me start research from freshman year. I'm particularly drawn to Course 2A (Mechanical Engineering with a focus on Biomedical), which allows the customization I need to bridge my interests in biomechanics and signal processing.

The maker culture at MIT isn't just about labs — it's a mindset. When I read about students hacking the Great Dome to display a fire truck after 9/11, I recognized the same irreverent creativity I see in my own approach to problem-solving. At MIT, I wouldn't have to choose between engineering rigor and creative audacity. I could have both.`,
  },

  {
    id: 'analytical_intellectual',
    label: 'Analytical / Intellectual Vitality',
    bestProfileType: 'analytical',
    expectedQuality: 'medium',
    text: `The first time I encountered Gödel's incompleteness theorems in my junior-year logic course, I felt the intellectual equivalent of vertigo. Here was mathematical proof that any sufficiently powerful formal system contains truths it cannot prove about itself. The implications spiraled outward from mathematics into philosophy, computer science, and my own understanding of knowledge.

What fascinated me wasn't the theorem's technical machinery — though the diagonal lemma is elegant — but its epistemological implications. If formal systems have inherent limits, what does that mean for our attempts to build complete models of reality? I spent the next three months reading everything I could find: Hofstadter's "Gödel, Escher, Bach," Nagel and Newman's proof exposition, and Penrose's controversial application to consciousness.

I don't think Penrose is right that Gödel proves minds can't be machines. The theorem constrains formal systems, not physical ones. But the question itself — whether mathematical limitations translate to cognitive ones — became the framework through which I now approach problems. In my AP Computer Science class, I started thinking about what algorithms can't do, not just what they can. I wrote my final project on the halting problem, building a simulator that shows students why certain computations are undecidable.

The deeper insight is about intellectual humility. Gödel showed that completeness and consistency are in tension. I've started to suspect the same is true of most ambitious frameworks — economic models, political theories, ethical systems. They can be powerful or they can be complete, but rarely both.`,
  },

  {
    id: 'activity_robotics',
    label: 'Activity Essay (Robotics)',
    bestProfileType: 'activity_to_essay',
    expectedQuality: 'medium',
    text: `When our FRC robot's autonomous routine failed at the regional qualifier — veering left into the scoring table instead of the loading zone — I had 47 minutes before our next match to diagnose the problem, fix it, and test it.

The issue wasn't in the code. Our PID controller was tuned correctly. The problem was a 0.3-degree misalignment in the IMU mounting bracket that had been accumulating drift over twelve autonomous cycles. I'd never considered sensor mounting as a variable worth controlling to that precision.

I designed and 3D-printed a precision mounting bracket with alignment pins that night. We went from a 23% autonomous success rate to 91% across our remaining 14 matches. The team adopted my bracket design as standard for all sensor mounts, and three other teams in our regional requested the CAD files.

But the real lesson wasn't mechanical — it was methodological. I now approach debugging by questioning assumptions about the physical layer first, not just the software. This shift in thinking helped me identify a similar calibration issue in our school's weather station data, where a slightly tilted wind vane had been corrupting six months of climate research data for the environmental science class.

I've since developed a sensor calibration protocol that our team uses before every competition. It takes 20 extra minutes during setup, but we haven't had a mounting-related failure in our last 47 matches.`,
  },
];

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function bar(score: number, maxLen: number = 20): string {
  const filled = Math.round((score / 100) * maxLen);
  return '█'.repeat(filled) + '░'.repeat(maxLen - filled);
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Adequate';
  if (score >= 35) return 'Below Avg';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
}

function printDimensionBreakdown(result: ScoringResult): void {
  const sorted = [...result.dimensionScores].sort((a, b) => b.score - a.score);
  for (const ds of sorted) {
    const llmTag = ds.llmResult ? ' [LLM]' : '';
    const sourceTag = ds.source === 'heuristic_only' ? '' :
                      ds.source === 'heuristic_dominant' ? ' (h-dom)' :
                      ds.source === 'llm_dominant' ? ' (l-dom)' : ' (l-only)';
    const name = ds.dimensionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    console.log(`    ${String(Math.round(ds.score)).padStart(3)} ${bar(ds.score)} ${name}${llmTag}${sourceTag}`);
  }
}

function printCostAndTiming(result: ScoringResult): void {
  console.log(`    LLM calls: ${result.cost.llmCallCount}`);
  console.log(`    Tokens: ${result.cost.totalInputTokens} in / ${result.cost.totalOutputTokens} out`);
  console.log(`    Est. cost: $${result.cost.estimatedCostUSD.toFixed(4)}`);
  console.log(`    Timing: extract=${result.timingMs.featureExtraction}ms, heuristic=${result.timingMs.heuristicScoring}ms, llm=${result.timingMs.llmScoring}ms, fusion=${result.timingMs.fusion}ms, total=${result.timingMs.total}ms`);
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runE2ETest() {
  console.log('='.repeat(80));
  console.log('  WORKSHOP LLM E2E TEST — Full Hybrid Pipeline with Real API Calls');
  console.log('='.repeat(80));

  requireApiKey('ANTHROPIC_API_KEY');

  let totalCost = 0;
  let totalLLMCalls = 0;
  let totalTime = 0;
  let passed = 0;
  let failed = 0;

  const allResults: Array<{ essay: TestEssay; heuristicResult: ScoringResult; fullResult: ScoringResult }> = [];

  // ------------------------------------------------------------------
  // PART 1: Score each essay with BOTH heuristic-only AND full hybrid
  // ------------------------------------------------------------------

  for (const essay of TEST_ESSAYS) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`  ${essay.label} (${essay.id})`);
    console.log(`  Expected quality: ${essay.expectedQuality} | Best profile: ${essay.bestProfileType}`);
    console.log(`  Word count: ${essay.text.split(/\s+/).length}`);
    console.log(`${'─'.repeat(80)}`);

    // Heuristic-only (baseline, free, ~1ms)
    const heuristicResult = hybridScoringPipeline.scoreHeuristicOnly(essay.text, essay.bestProfileType);

    // Full hybrid (with LLM calls, ~$0.01-0.02, ~2-4s)
    let fullResult: ScoringResult;
    try {
      fullResult = await hybridScoringPipeline.score(essay.text, {
        essayType: essay.bestProfileType,
      });
    } catch (err) {
      console.error(`    ERROR scoring ${essay.id}:`, err);
      failed++;
      continue;
    }

    allResults.push({ essay, heuristicResult, fullResult });

    // Display results
    console.log(`\n  📊 Heuristic-Only: EQI=${heuristicResult.eqi} (${heuristicResult.impressionLabel})`);
    printDimensionBreakdown(heuristicResult);

    console.log(`\n  🧠 Full Hybrid: EQI=${fullResult.eqi} (${fullResult.impressionLabel})`);
    printDimensionBreakdown(fullResult);

    console.log(`\n  💰 Cost & Timing:`);
    printCostAndTiming(fullResult);

    const eqiDiff = fullResult.eqi - heuristicResult.eqi;
    console.log(`\n  📈 LLM Value-Add: ${eqiDiff >= 0 ? '+' : ''}${eqiDiff.toFixed(1)} EQI points`);

    // Track totals
    totalCost += fullResult.cost.estimatedCostUSD;
    totalLLMCalls += fullResult.cost.llmCallCount;
    totalTime += fullResult.timingMs.total;

    // Assertions
    if (fullResult.eqi >= 0 && fullResult.eqi <= 100) { passed++; } else { failed++; console.error(`    FAIL: EQI out of range (${fullResult.eqi})`); }
    if (fullResult.dimensionScores.length === 13) { passed++; } else { failed++; console.error(`    FAIL: Expected 13 dimensions, got ${fullResult.dimensionScores.length}`); }
    if (fullResult.cost.llmCallCount >= 0) { passed++; } else { failed++; }
  }

  // ------------------------------------------------------------------
  // PART 2: Quality discrimination — strong > weak
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  PART 2: Quality Discrimination');
  console.log(`${'═'.repeat(80)}`);

  const strongNarrative = allResults.find(r => r.essay.id === 'strong_narrative');
  const weakGeneric = allResults.find(r => r.essay.id === 'weak_generic');

  if (strongNarrative && weakGeneric) {
    const diff = strongNarrative.fullResult.eqi - weakGeneric.fullResult.eqi;
    console.log(`  Strong narrative: EQI=${strongNarrative.fullResult.eqi} (${strongNarrative.fullResult.impressionLabel})`);
    console.log(`  Weak generic:    EQI=${weakGeneric.fullResult.eqi} (${weakGeneric.fullResult.impressionLabel})`);
    console.log(`  Spread:          ${diff.toFixed(1)} points`);

    if (strongNarrative.fullResult.eqi > weakGeneric.fullResult.eqi) {
      passed++;
      console.log('  ✅ Strong essay scores higher than weak essay');
    } else {
      failed++;
      console.error('  FAIL: Strong essay should score higher than weak essay');
    }

    if (diff >= 10) {
      passed++;
      console.log(`  ✅ Meaningful spread (${diff.toFixed(1)} pts >= 10)`);
    } else {
      failed++;
      console.error(`  FAIL: Spread too narrow (${diff.toFixed(1)} pts < 10)`);
    }
  }

  // ------------------------------------------------------------------
  // PART 3: Profile-aware differentiation
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  PART 3: Profile-Aware Scoring');
  console.log(`${'═'.repeat(80)}`);

  // Score the strong narrative under different profiles (heuristic-only for speed)
  if (strongNarrative) {
    const profiles: WorkshopEssayType[] = ['personal_statement', 'analytical', 'why_us', 'uc_piq', 'activity_to_essay'];
    console.log('\n  Strong narrative essay under different profiles:');
    const profileScores: Record<string, number> = {};

    for (const profileType of profiles) {
      const result = hybridScoringPipeline.scoreHeuristicOnly(strongNarrative.essay.text, profileType);
      profileScores[profileType] = result.eqi;
      console.log(`    ${profileType.padEnd(25)} → EQI ${result.eqi} (${result.impressionLabel})`);
    }

    // Personal statement should be best for a narrative essay
    const psEqi = profileScores['personal_statement'];
    const analyticalEqi = profileScores['analytical'];
    if (psEqi > analyticalEqi) {
      passed++;
      console.log('  ✅ Personal statement profile scores narrative essay higher than analytical');
    } else {
      failed++;
      console.error('  FAIL: Personal statement should score narrative essay higher');
    }
  }

  // Score the Why Us essay under different profiles
  const whyUs = allResults.find(r => r.essay.id === 'why_us_mit');
  if (whyUs) {
    console.log('\n  Why Us MIT essay under different profiles:');
    const profiles: WorkshopEssayType[] = ['why_us', 'personal_statement', 'analytical'];
    const profileScores: Record<string, number> = {};

    for (const profileType of profiles) {
      const result = hybridScoringPipeline.scoreHeuristicOnly(whyUs.essay.text, profileType);
      profileScores[profileType] = result.eqi;
      console.log(`    ${profileType.padEnd(25)} → EQI ${result.eqi} (${result.impressionLabel})`);
    }

    if (profileScores['why_us'] > profileScores['personal_statement']) {
      passed++;
      console.log('  ✅ Why Us profile scores Why Us essay higher than personal statement profile');
    } else {
      failed++;
      console.error('  FAIL: Why Us profile should score Why Us essay higher');
    }
  }

  // ------------------------------------------------------------------
  // PART 4: Strategy recommendations from real scores
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  PART 4: Strategy Recommendations (from real scores)');
  console.log(`${'═'.repeat(80)}`);

  for (const { essay, fullResult } of allResults) {
    const recs = strategySelector.selectStrategies(essay.bestProfileType, fullResult);
    const top3 = recs.slice(0, 3);
    console.log(`\n  ${essay.label} (EQI=${fullResult.eqi}):`);
    for (const rec of top3) {
      console.log(`    ${rec.score.toString().padStart(3)} — ${rec.strategy.name}: ${rec.rationale}`);
    }

    if (recs.length > 0) { passed++; } else { failed++; console.error('    FAIL: No strategy recommendations'); }
  }

  // ------------------------------------------------------------------
  // PART 5: LLM score quality checks
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  PART 5: LLM Score Quality');
  console.log(`${'═'.repeat(80)}`);

  for (const { essay, fullResult } of allResults) {
    const llmDims = fullResult.dimensionScores.filter(d => d.llmResult);
    console.log(`\n  ${essay.label}: ${llmDims.length} dimensions scored by LLM`);

    for (const ds of llmDims) {
      const hScore = ds.heuristicResult.score;
      const lScore = ds.llmResult!.score;
      const delta = lScore - hScore;
      const name = ds.dimensionId.replace(/_/g, ' ');
      console.log(`    ${name}: heuristic=${hScore} → LLM=${lScore} (${delta >= 0 ? '+' : ''}${delta}) conf=${ds.llmResult!.confidence.toFixed(2)}`);

      // LLM scores should be in valid range
      if (lScore >= 0 && lScore <= 100) { passed++; } else { failed++; console.error(`      FAIL: LLM score out of range: ${lScore}`); }

      // LLM should provide reasoning
      if (ds.llmResult!.reasoning && ds.llmResult!.reasoning.length > 10) {
        passed++;
      } else {
        failed++;
        console.error(`      FAIL: LLM reasoning too short: "${ds.llmResult!.reasoning}"`);
      }
    }
  }

  // ------------------------------------------------------------------
  // PART 6: Heuristic vs Hybrid comparison
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  PART 6: Heuristic vs Hybrid Comparison');
  console.log(`${'═'.repeat(80)}`);

  console.log('\n  Essay'.padEnd(35) + 'Heuristic'.padStart(12) + 'Hybrid'.padStart(10) + 'Delta'.padStart(8) + 'LLM Calls'.padStart(12));
  console.log('  ' + '─'.repeat(72));

  for (const { essay, heuristicResult, fullResult } of allResults) {
    const delta = fullResult.eqi - heuristicResult.eqi;
    const label = essay.label.length > 30 ? essay.label.substring(0, 27) + '...' : essay.label;
    console.log(
      `  ${label.padEnd(33)}` +
      `${heuristicResult.eqi.toFixed(1).padStart(10)}` +
      `${fullResult.eqi.toFixed(1).padStart(10)}` +
      `${(delta >= 0 ? '+' : '') + delta.toFixed(1)}`.padStart(8) +
      `${fullResult.cost.llmCallCount}`.padStart(10)
    );
  }

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------

  console.log(`\n${'═'.repeat(80)}`);
  console.log('  SUMMARY');
  console.log(`${'═'.repeat(80)}`);
  console.log(`  Essays scored:     ${allResults.length}`);
  console.log(`  Total LLM calls:   ${totalLLMCalls}`);
  console.log(`  Total cost:        $${totalCost.toFixed(4)}`);
  console.log(`  Total time:        ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`  Avg cost/essay:    $${(totalCost / allResults.length).toFixed(4)}`);
  console.log(`  Avg time/essay:    ${(totalTime / allResults.length / 1000).toFixed(1)}s`);
  console.log(`  Tests:             ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n  ⚠️  SOME TESTS FAILED — review output above');
    process.exit(1);
  } else {
    console.log('\n  ✅ All tests passed!');
  }
}

runE2ETest().catch(err => {
  console.error('E2E test suite error:', err);
  process.exit(1);
});
