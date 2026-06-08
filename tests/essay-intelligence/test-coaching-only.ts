/**
 * Coaching-Only Test — Skip the analysis pipeline, test coaching quality directly.
 *
 * Strategy:
 *   1. First run: analyzes essay (L1→L4), saves profile to fixtures/cached-profile.json
 *   2. Subsequent runs: loads cached profile, runs coaching turns only
 *
 * This makes iteration fast:
 *   - First run: ~$3.50, ~30 min (builds the profile)
 *   - Subsequent runs: ~$0.75, ~3-5 min (coaching only)
 *
 * Fail-fast: any error → save partial output, print cost, exit immediately.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-coaching-only.ts
 *
 * To force re-analysis (rebuild profile):
 *   REBUILD_PROFILE=1 ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-coaching-only.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

import { analysisOrchestrator } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { ReanalysisOrchestrator } from '../../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import type { CoachingTurnResult } from '../../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import { InMemoryCheckpointStore } from '../../src/services/essayIntelligence/profileManager/checkpointStore';
import type { ConversationTurn } from '../../src/services/essayIntelligence/coaching/coachingService';
import type {
  EssayProfile,
  CoachingSessionMemory,
  LearningStyleObservations,
} from '../../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, '..', 'fixtures', 'piano-essay.txt');
const PROFILE_CACHE_PATH = path.join(__dirname, '..', 'fixtures', 'cached-profile.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'coaching-only-audit.txt');

// ============================================================================
// COACHING TURNS — focused on testing our improvements
// ============================================================================

const COACHING_TURNS = [
  {
    message: 'What do you think of my essay overall?',
    expectation: 'Quotes essay, names technique in ALL-CAPS, references word count, cites committee one-liner',
  },
  {
    message: 'Can you help me with paragraph 1? The opening feels generic to me.',
    expectation: 'P1-scoped findings, uses teaching example (weak→strong), names SUMMARY-TO-SCENE or similar',
  },
  {
    message: 'I wrote this essay right after my first hackathon — the AI DJ project was my hackathon entry and we won second place.',
    expectation: 'New context captured, profile deepened, student theory started',
  },
  {
    message: 'How can I make the opening more specific and vivid?',
    expectation: 'References teaching content (surgical example or PIQ example), gives concrete writing prompt',
  },
  {
    message: 'Here is my rewrite: "The bass dropped at 2AM and 47 strangers started dancing to a playlist my algorithm had never been trained on. Three months earlier, I couldn\'t have told you what a Fourier transform was."',
    expectation: 'Revision coaching mode, names the craft shift, assesses delta, word economy reference',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function separator(title: string): string {
  return `\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8').trim();
  const output: string[] = [];
  output.push('COACHING-ONLY AUDIT — Testing Conversator V2 improvements');
  output.push(`Date: ${new Date().toISOString()}`);
  output.push(`Turns: ${COACHING_TURNS.length}`);

  let totalCost = 0;
  const wallStart = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Get or build profile
  // ═══════════════════════════════════════════════════════════════════════════

  let profile: EssayProfile;
  const forceRebuild = process.env.REBUILD_PROFILE === '1';

  if (!forceRebuild && fs.existsSync(PROFILE_CACHE_PATH)) {
    console.log('[Coaching Test] Loading cached profile...');
    profile = JSON.parse(fs.readFileSync(PROFILE_CACHE_PATH, 'utf-8'));
    output.push('Profile: loaded from cache (no analysis cost)');
    output.push(`Profile cache: ${PROFILE_CACHE_PATH}`);
  } else {
    console.log('[Coaching Test] No cached profile — running full analysis pipeline...');
    console.log('[Coaching Test] (This is a one-time cost. Subsequent runs will use the cache.)');

    const pipelineStart = Date.now();
    const pipelineResult = await analysisOrchestrator.analyzeEssay({
      essayId: 'coaching-test-piano',
      essayText,
      essayType: 'common_app',
      includeAnnotations: false,
    });

    const pipelineTime = Date.now() - pipelineStart;
    totalCost += pipelineResult.costSummary.totalCost;

    // Fail-fast on critical layers
    const criticalLayers = ['L3', 'L3.75', 'L3.5', 'L4'];
    const failed = pipelineResult.layersFailed.filter(f =>
      criticalLayers.some(cl => f.layer.includes(cl))
    );
    if (failed.length > 0) {
      console.error(`[Coaching Test] PIPELINE FAILED: ${failed.map(f => `${f.layer}: ${f.message}`).join(', ')}`);
      console.error(`[Coaching Test] Cost: $${totalCost.toFixed(4)}, Time: ${pipelineTime}ms`);
      process.exit(1);
    }

    profile = pipelineResult.profile as EssayProfile;

    // Save profile for future runs
    fs.mkdirSync(path.dirname(PROFILE_CACHE_PATH), { recursive: true });
    fs.writeFileSync(PROFILE_CACHE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`[Coaching Test] Profile saved to ${PROFILE_CACHE_PATH}`);
    console.log(`[Coaching Test] Pipeline: $${pipelineResult.costSummary.totalCost.toFixed(4)} in ${pipelineTime}ms`);

    output.push(`Profile: built fresh (${pipelineResult.layersCompleted.join(', ')})`);
    output.push(`Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`);
    output.push(`Pipeline time: ${pipelineTime}ms`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Run coaching turns
  // ═══════════════════════════════════════════════════════════════════════════

  console.log(`\n[Coaching Test] Running ${COACHING_TURNS.length} coaching turns...`);

  const checkpointStore = new InMemoryCheckpointStore();
  const reanalysisOrchestrator = new ReanalysisOrchestrator(profile, checkpointStore, 'coaching-test');

  const conversationHistory: ConversationTurn[] = [];
  let sessionMemory: CoachingSessionMemory | undefined;
  let learningStyle: LearningStyleObservations | undefined;
  let coachingCost = 0;

  for (let i = 0; i < COACHING_TURNS.length; i++) {
    const turnNum = i + 1;
    const turn = COACHING_TURNS[i];

    console.log(`\n[Coaching Test] Turn ${turnNum}: "${turn.message.slice(0, 60)}..."`);
    const turnStart = Date.now();

    let result: CoachingTurnResult;
    try {
      result = await reanalysisOrchestrator.processCoachingTurn(
        turn.message,
        conversationHistory,
        undefined,
        sessionMemory,
        learningStyle,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : '';
      output.push(separator(`TURN ${turnNum}: FATAL ERROR`));
      output.push(`Message: "${turn.message}"`);
      output.push(`Error: ${errMsg}`);
      output.push(`Stack: ${errStack?.slice(0, 500)}`);
      output.push(`\nTotal cost: $${(totalCost + coachingCost).toFixed(4)}`);

      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf-8');
      console.error(`[Coaching Test] FATAL: Turn ${turnNum} — ${errMsg}`);
      console.error(`[Coaching Test] Output saved: ${OUTPUT_FILE}`);
      console.error(`[Coaching Test] Cost so far: $${(totalCost + coachingCost).toFixed(4)}`);
      process.exit(1);
    }

    const turnTime = Date.now() - turnStart;
    coachingCost += result.totalCost;

    if (result.sessionMemory) sessionMemory = result.sessionMemory;
    if (result.learningStyle) learningStyle = result.learningStyle;

    // Build conversation history
    conversationHistory.push(
      { role: 'user', content: turn.message },
      { role: 'assistant', content: result.response ?? '' },
    );

    // ── Output ──
    output.push(separator(`TURN ${turnNum}`));
    output.push(`Student: "${turn.message}"`);
    output.push(`Expectation: ${turn.expectation}`);
    output.push(`Cost: $${result.totalCost.toFixed(4)} | Time: ${turnTime}ms`);
    output.push(`Profile deepened: ${result.profileDeepened}`);
    output.push(`Cognitive state: ${result.cognitiveAssessment?.cognitiveState ?? 'N/A'}`);

    if (sessionMemory) {
      output.push(`Session events: ${sessionMemory.events?.length ?? 0}`);
      output.push(`Turn count: ${sessionMemory.turnCount ?? 0}`);
      output.push(`Deflection counter: ${(sessionMemory as any).deflectionCounter ?? 0}`);
      if (sessionMemory.sessionArcSummary) {
        output.push(`Session arc: ${sessionMemory.sessionArcSummary}`);
      }
      if (sessionMemory.studentTheory) {
        output.push(`Student theory: ${JSON.stringify(sessionMemory.studentTheory).slice(0, 200)}`);
      }
    }

    output.push(`\n--- COACH RESPONSE ---`);
    output.push(result.response ?? '(no response)');
    output.push(`--- END RESPONSE ---`);

    // Quick quality checks
    const response = result.response ?? '';
    const checks: Array<{ name: string; pass: boolean; detail: string }> = [
      {
        name: 'Quotes essay text',
        pass: /["'"'"]/.test(response) && response.length > 100,
        detail: 'Response should quote specific text from the essay',
      },
      {
        name: 'Not generic cheerleading',
        pass: !/great essay|wonderful writing|impressive work/i.test(response),
        detail: 'Should give honest assessment, not cheerleading',
      },
      {
        name: 'Reasonable length',
        pass: response.length > 200 && response.length < 3000,
        detail: `Response length: ${response.length} chars`,
      },
    ];

    // Turn-specific checks
    if (turnNum === 1) {
      checks.push({
        name: 'Technique naming (ALL-CAPS)',
        pass: /[A-Z]{2,}-[A-Z]{2,}|[A-Z]{4,}\s[A-Z]{4,}/.test(response),
        detail: 'Should name a craft technique in ALL-CAPS',
      });
      checks.push({
        name: 'Word count reference',
        pass: /\d+\/\d+|\d+ words/.test(response),
        detail: 'Should reference word count',
      });
    }
    if (turnNum === 5) {
      checks.push({
        name: 'Revision assessment (delta language)',
        pass: /changed|shifted|moved|replaced|improved|revised|rewrite|new version/i.test(response),
        detail: 'Should assess what the revision changed',
      });
    }

    output.push(`\nQUALITY CHECKS:`);
    for (const check of checks) {
      output.push(`  ${check.pass ? '✓' : '✗'} ${check.name}: ${check.detail}`);
    }

    console.log(
      `[Coaching Test] Turn ${turnNum}: $${result.totalCost.toFixed(4)} in ${turnTime}ms ` +
      `(${checks.filter(c => c.pass).length}/${checks.length} checks pass)`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  const wallTime = Date.now() - wallStart;
  totalCost += coachingCost;

  output.push(separator('SUMMARY'));
  output.push(`Total coaching cost: $${coachingCost.toFixed(4)}`);
  output.push(`Total cost (incl. pipeline if rebuilt): $${totalCost.toFixed(4)}`);
  output.push(`Wall time: ${(wallTime / 1000).toFixed(1)}s`);
  output.push(`Average cost per turn: $${(coachingCost / COACHING_TURNS.length).toFixed(4)}`);

  // Learning style observations
  if (learningStyle?.observations && learningStyle.observations.length > 0) {
    output.push(`\nLearning style observations (${learningStyle.observations.length}):`);
    for (const obs of learningStyle.observations) {
      output.push(`  - ${obs.observation} (${obs.confidence}, turn ${obs.turnObserved})`);
    }
  }

  // Write output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf-8');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COACHING TEST COMPLETE`);
  console.log(`Coaching cost: $${coachingCost.toFixed(4)}`);
  console.log(`Wall time: ${(wallTime / 1000).toFixed(1)}s`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
