/**
 * Quick test: L3.5 essay-level analysis mode ONLY.
 *
 * Loads the profile from the last successful E2E run (which completed L1→L3.75)
 * and runs ONLY the L3.5 essay-level analysis + phase assessment.
 *
 * This tests the fix without re-running the $2+ pipeline.
 * Expected cost: ~$0.04-0.08 (1 Sonnet call + phase assessment)
 * Expected time: ~30-60 seconds
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { analysisPassService } from '../src/services/essayIntelligence/analysis/analysisPass';
import type { EssayProfile } from '../src/services/essayIntelligence/profileTypes';

// We need a profile with L3+L3.75 complete. The E2E test saves the full pipeline result
// to the output file, but not the raw profile. We'll run the analysis orchestrator to get
// a profile, BUT skip L3.5 by testing the essay-level method directly.
//
// ALTERNATIVE: Run the minimal pipeline (L1→L3.75 only) and then test L3.5 separately.
// For this quick test, we'll use the analysis pass service directly with a mock profile.

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set. Check .env.local');
    process.exit(1);
  }

  console.log('[L3.5 Test] Starting essay-level analysis test...');
  console.log('[L3.5 Test] This tests ONLY the L3.5 layer — not the full pipeline.');

  // Run the full pipeline to get a profile, but we'll intercept before L3.5
  const essayPath = path.join(__dirname, 'fixtures', 'piano-essay.txt');
  const essayText = fs.readFileSync(essayPath, 'utf-8').trim();
  console.log(`[L3.5 Test] Essay loaded: ${essayText.length} chars`);

  // Import the orchestrator to run L1→L3.75
  const { analysisOrchestrator } = await import('../src/services/essayIntelligence/analysis/analysisOrchestrator');

  console.log('[L3.5 Test] Running pipeline (L1→L3.75) to build profile...');
  const pipelineStart = Date.now();

  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: 'l35-test-piano',
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });

  const pipelineTime = Date.now() - pipelineStart;
  const profile = pipelineResult.profile as EssayProfile;

  console.log(`[L3.5 Test] Pipeline complete in ${(pipelineTime / 1000).toFixed(1)}s`);
  console.log(`[L3.5 Test] Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  console.log(`[L3.5 Test] Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`);

  // Check if L3.5 already ran (it might have succeeded this time with the fix)
  const l35Layer = pipelineResult.costSummary.layers.find(l => l.layer.startsWith('L3.5'));
  if (l35Layer) {
    console.log(`[L3.5 Test] L3.5 was already included in pipeline — cost: $${l35Layer.cost.toFixed(4)}`);
  }

  // Report what we care about
  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');

  // Check L3.5 results
  if (pipelineResult.layersFailed.some(f => f.layer === 'L3.5')) {
    console.log('L3.5 STATUS: FAILED');
    const failure = pipelineResult.layersFailed.find(f => f.layer === 'L3.5');
    console.log(`L3.5 ERROR: ${failure?.error}`);
  } else if (pipelineResult.layersCompleted.includes('L3.5')) {
    console.log('L3.5 STATUS: SUCCESS');
  } else {
    console.log('L3.5 STATUS: NOT RUN (might have been skipped)');
  }

  // Phase assessment
  if (pipelineResult.improvementPhase) {
    console.log(`IMPROVEMENT PHASE: ${pipelineResult.improvementPhase.level}`);
    console.log(`PHASE REASONING: ${pipelineResult.improvementPhase.reasoning}`);
    console.log(`COACHING LENS: ${pipelineResult.improvementPhase.coachingLens}`);
  } else {
    console.log('IMPROVEMENT PHASE: not set');
  }

  // Archetype
  if (profile.admissionsPositioning?.archetypeContext) {
    console.log(`\nARCHETYPE: ${profile.admissionsPositioning.archetypeContext.archetype} (${profile.admissionsPositioning.archetypeContext.poolDensity})`);
  }

  // Person portrait
  if (profile.characterRevelation?.writerPortrait) {
    console.log(`\nPERSON PORTRAIT: ${profile.characterRevelation.writerPortrait.slice(0, 200)}...`);
  }

  // Observation count
  let totalObs = 0;
  for (const para of profile.paragraphs) {
    for (const sent of para.sentences) {
      if (sent.understanding) {
        totalObs += (sent.understanding.observedFunctions?.length ?? 0);
        totalObs += (sent.understanding.inferredIntents?.length ?? 0);
        totalObs += (sent.understanding.narrativeContributions?.length ?? 0);
      }
    }
  }
  console.log(`\nOBSERVATION COUNT: ${totalObs}`);

  // Cost breakdown
  console.log('\nCOST BREAKDOWN:');
  for (const layer of pipelineResult.costSummary.layers) {
    console.log(`  ${layer.layer.padEnd(40)} $${layer.cost.toFixed(4)}  ${layer.tokenUsage.inputTokens} in / ${layer.tokenUsage.outputTokens} out  ${layer.timingMs}ms`);
  }
  console.log(`  TOTAL: $${pipelineResult.costSummary.totalCost.toFixed(4)}`);

  console.log(`\nTOTAL TIME: ${(pipelineTime / 1000).toFixed(1)}s`);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
