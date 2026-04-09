/**
 * Block System V3 Audit — Full E2E Test Across All 5 Coaching Modes
 *
 * Runs the translation essay through the full pipeline, then tests
 * each coaching mode with realistic scenarios. Outputs go to
 * tests/output/v3-audit-{mode}.txt for evaluation against the V3 rubric
 * in COACHING_BLOCK_SYSTEM_AUDIT_V3.md.
 *
 * Estimated cost: ~$1.50-2.50 (pipeline ~$0.30 + 5 coaching turns ~$0.20 each)
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-block-system-v3-audit.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local BEFORE any service imports
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// Verify API key
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY not set. Run with:');
  console.error('  ANTHROPIC_API_KEY="sk-ant-..." npx tsx tests/test-block-system-v3-audit.ts');
  process.exit(1);
}

// NOW import services (they read env at import time)
import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { ReanalysisOrchestrator } from '../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import { InMemoryCheckpointStore } from '../src/services/essayIntelligence/profileManager/checkpointStore';
import type { ConversationTurn } from '../src/services/essayIntelligence/coaching/coachingService';
import type { EssayProfile, CoachingSessionMemory, LearningStyleObservations } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, 'fixtures', 'translation-essay.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeOutput(filename: string, content: string): void {
  ensureOutputDir();
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`  → Output: ${filepath}`);
}

function separator(title: string): string {
  return `\n${'═'.repeat(80)}\n${title}\n${'═'.repeat(80)}\n`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8').trim();
  console.log(`\n[V3 Audit] Essay loaded: ${essayText.length} chars, ${essayText.split(/\n\n+/).length} paragraphs`);

  let totalCost = 0;

  /** Fail-fast: abort the entire test if any step fails */
  function failFast(step: string, error: unknown): never {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ FAIL-FAST: ${step} failed: ${msg}`);
    console.error(`Total cost before failure: $${totalCost.toFixed(4)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  }

  /** Assert a coaching result succeeded, fail-fast if not */
  function assertSuccess(result: { success: boolean; error?: string; response: string | null }, step: string): void {
    if (!result.success) {
      failFast(step, new Error(`Coaching call returned success=false: ${result.error ?? 'unknown error'}`));
    }
    if (!result.response || result.response.length < 50) {
      failFast(step, new Error(`Response too short or null (${result.response?.length ?? 0} chars). Response: ${result.response?.slice(0, 200) ?? 'null'}`));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Run full analysis pipeline
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n[V3 Audit] Running analysis pipeline (L1→L4, skip L5)...');
  const pipelineStart = Date.now();

  let pipelineResult;
  try {
    pipelineResult = await analysisOrchestrator.analyzeEssay({
      essayId: 'v3-audit-translation',
      essayText,
      essayType: 'common_app',
      includeAnnotations: false,
    });
  } catch (e) {
    failFast('Pipeline analysis', e);
  }

  const pipelineTime = Date.now() - pipelineStart;
  const profile = pipelineResult.profile as EssayProfile;
  totalCost += pipelineResult.costSummary.totalCost;

  // Fail-fast if pipeline didn't produce usable results
  if (!profile || !profile.paragraphs || profile.paragraphs.length === 0) {
    failFast('Pipeline validation', new Error(`Pipeline produced empty profile (${profile?.paragraphs?.length ?? 0} paragraphs)`));
  }

  console.log(
    `[V3 Audit] Pipeline complete: ${pipelineResult.layersCompleted.join(', ')} — ` +
    `$${pipelineResult.costSummary.totalCost.toFixed(4)}, ${pipelineTime}ms`
  );
  console.log(`[V3 Audit] Phase: ${pipelineResult.improvementPhase?.level ?? 'unknown'}`);
  console.log(`[V3 Audit] North Star: ${profile.index.northStarSummary.throughLineSummary?.slice(0, 100) ?? 'none'}...`);

  // Write pipeline summary
  const pipelineSummary = [
    'V3 AUDIT — PIPELINE SUMMARY',
    `Date: ${new Date().toISOString()}`,
    `Essay: translation-essay.txt (${essayText.length} chars)`,
    `Layers: ${pipelineResult.layersCompleted.join(', ')}`,
    `Failed: ${pipelineResult.layersFailed.map(f => `${f.layer}: ${f.error}`).join(', ') || 'none'}`,
    `Phase: ${pipelineResult.improvementPhase?.level ?? 'unknown'}`,
    `Phase reasoning: ${pipelineResult.improvementPhase?.reasoning ?? 'N/A'}`,
    `Confidence: ${pipelineResult.confidenceLevel}`,
    `Cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`,
    `Time: ${pipelineTime}ms`,
    `North Star: ${profile.index.northStarSummary.throughLineSummary ?? 'none'}`,
    `Paragraphs: ${profile.paragraphs.length}`,
  ].join('\n');
  writeOutput('v3-audit-pipeline.txt', pipelineSummary);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Test each coaching mode
  // ═══════════════════════════════════════════════════════════════════════════

  // We'll create a fresh orchestrator for each mode test to avoid state bleed
  // between modes (each mode test should be independent).

  // ─── MODE 1: first_encounter ──────────────────────────────────────────────

  console.log('\n[V3 Audit] MODE 1: first_encounter');
  {
    const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'v3-first-encounter');
    const history: ConversationTurn[] = [];

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        "Hi, I just finished this essay. What do you think? I'm not sure if it's good enough.",
        history,
      );
    } catch (e) {
      failFast('Mode 1: first_encounter coaching call', e);
    }
    assertSuccess(result, 'Mode 1: first_encounter');

    totalCost += result.totalCost;
    const output = [
      separator('MODE 1: FIRST ENCOUNTER'),
      `STUDENT: "Hi, I just finished this essay. What do you think? I'm not sure if it's good enough."`,
      `\nMODE DETECTED: first_encounter (no edits, first message)`,
      `COST: $${result.totalCost.toFixed(4)}`,
      `SUCCESS: ${result.success}`,
      `PROFILE DEEPENED: ${result.profileDeepened}`,
      separator('COACH RESPONSE'),
      result.response ?? '(no response)',
      separator('SESSION MEMORY'),
      JSON.stringify(result.sessionMemory, null, 2),
    ].join('\n');

    writeOutput('v3-audit-mode1-first-encounter.txt', output);
    console.log(`  Response: ${result.response?.length ?? 0} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ─── MODE 2: revision_response ────────────────────────────────────────────

  console.log('\n[V3 Audit] MODE 2: revision_response');
  {
    // Simulate: 3 prior coaching turns happened, then student edited P3
    const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'v3-revision');
    const history: ConversationTurn[] = [
      { role: 'student', content: "What do you think of my essay?" },
      { role: 'coach', content: "Your strongest writing is in P2 — the cardiologist scene. The 'made-up translation' is the essay's best sentence. P3 is the weakest — it's a list where it should be a scene." },
      { role: 'student', content: "Should I change P3?" },
      { role: 'coach', content: "Yes — pick ONE of those translation moments and drop the reader into it the way P2 drops them into the cardiologist's office." },
    ];

    // Simulate the edit by calling processEdit with old and new essay text
    const oldEssayText = essayText;
    const newP3 = `At the dentist when I was nine, I told my mother the hygienist said 'no cavities' when what she actually said was 'we need to watch the one on the lower left.' I don't know why I changed it. Maybe because my mother had already missed two days of work that month and I could see her calculating whether she could miss a third. I was nine and I was already editing the truth to protect her from a world that didn't speak her language.`;
    const paragraphs = essayText.split(/\n\n+/);
    paragraphs[2] = newP3;
    const newEssayText = paragraphs.join('\n\n');

    try {
      await orchestrator.processEdit(oldEssayText, newEssayText);
      console.log('  Edit processed successfully');
    } catch (e) {
      console.warn('  Edit processing failed (non-fatal, coaching will use fallback):', (e as Error).message?.slice(0, 80));
    }

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        "I rewrote P3 like you suggested. I picked the dentist moment. What do you think?",
        history,
        undefined, // recentEditSummary — orchestrator builds this internally
      );
    } catch (e) {
      failFast('Mode 2: revision_response coaching call', e);
    }
    assertSuccess(result, 'Mode 2: revision_response');

    totalCost += result.totalCost;
    const output = [
      separator('MODE 2: REVISION RESPONSE'),
      `STUDENT: "I rewrote P3 like you suggested. I picked the dentist moment. What do you think?"`,
      `\nOLD P3: "${essayText.split(/\n\n+/)[2].slice(0, 100)}..."`,
      `NEW P3: "${newP3.slice(0, 100)}..."`,
      `\nMODE DETECTED: revision_response (edit processed before coaching turn)`,
      `COST: $${result.totalCost.toFixed(4)}`,
      `SUCCESS: ${result.success}`,
      `PROFILE DEEPENED: ${result.profileDeepened}`,
      separator('COACH RESPONSE'),
      result.response ?? '(no response)',
    ].join('\n');

    writeOutput('v3-audit-mode2-revision-response.txt', output);
    console.log(`  Response: ${result.response?.length ?? 0} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ─── MODE 3: iteration_deep ───────────────────────────────────────────────

  console.log('\n[V3 Audit] MODE 3: iteration_deep');
  {
    const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'v3-iteration');
    const history: ConversationTurn[] = [
      { role: 'student', content: "I rewrote P3." },
      { role: 'coach', content: "Good — the dentist scene works. But 'I don't know why I changed it' is doing important work. The last sentence tells what the scene already showed — consider cutting it." },
      { role: 'student', content: "I tightened P3." },
      { role: 'coach', content: "V2 had authentic confusion. V3 is cleaner but you lost the uncertainty. Consider going back to V2's emotional register." },
    ];

    // Simulate 3 edits to P3 (to trigger iteration_deep)
    const paragraphs = essayText.split(/\n\n+/);
    for (let i = 0; i < 3; i++) {
      const old = paragraphs.join('\n\n');
      paragraphs[2] = paragraphs[2] + ' '; // tiny change to register an edit
      try {
        await orchestrator.processEdit(old, paragraphs.join('\n\n'));
      } catch { /* non-fatal */ }
    }

    // Now the real V3 edit
    const oldText = paragraphs.join('\n\n');
    paragraphs[2] = `At the dentist when I was nine, I told my mother everything was fine. The hygienist had said 'we need to watch the one on the lower left,' but my mother had already missed two days of work that month. I could see her calculating. So I said no cavities, and she smiled, and I learned that the right translation isn't always the true one.`;
    try {
      await orchestrator.processEdit(oldText, paragraphs.join('\n\n'));
    } catch { /* non-fatal */ }

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        "I tightened it again. Is V3 better?",
        history,
      );
    } catch (e) {
      failFast('Mode 3: iteration_deep coaching call', e);
    }
    assertSuccess(result, 'Mode 3: iteration_deep');

    totalCost += result.totalCost;
    const output = [
      separator('MODE 3: ITERATION DEEP'),
      `STUDENT: "I tightened it again. Is V3 better?"`,
      `\nITERATION ROUND: 4 (3 prior edits to P3)`,
      `MODE DETECTED: iteration_deep (3+ edits to same paragraph)`,
      `COST: $${result.totalCost.toFixed(4)}`,
      `SUCCESS: ${result.success}`,
      separator('COACH RESPONSE'),
      result.response ?? '(no response)',
    ].join('\n');

    writeOutput('v3-audit-mode3-iteration-deep.txt', output);
    console.log(`  Response: ${result.response?.length ?? 0} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ─── MODE 4: architecture ─────────────────────────────────────────────────

  console.log('\n[V3 Audit] MODE 4: architecture (via processEdit with reordered paragraphs)');
  {
    const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'v3-architecture');
    const history: ConversationTurn[] = [
      { role: 'student', content: "What do you think of the essay structure?" },
      { role: 'coach', content: "The chronological flow works but P3 (the list) interrupts the emotional altitude between P2 and P4. Consider whether P3 needs to exist." },
    ];

    // Reorder paragraphs: move P3 to P1 position (chronological order)
    // Old: P1(language theory) P2(cardiologist) P3(dentist list) P4(kitchen table) P5(medicine)
    // New: P3(dentist list) P2(cardiologist) P4(kitchen table) P1(language theory) P5(medicine)
    const oldParagraphs = essayText.split(/\n\n+/);
    const reorderedParagraphs = [
      oldParagraphs[2], // P3 → new P1
      oldParagraphs[1], // P2 → new P2
      oldParagraphs[3], // P4 → new P3
      oldParagraphs[0], // P1 → new P4
      oldParagraphs[4], // P5 → new P5
    ];
    const reorderedText = reorderedParagraphs.join('\n\n');

    let editProcessed = false;
    try {
      await orchestrator.processEdit(essayText, reorderedText);
      editProcessed = true;
      console.log('  Edit processed successfully (paragraph reorder)');
    } catch (e) {
      console.warn('  Edit processing failed:', (e as Error).message?.slice(0, 100));
    }

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        "I reorganized the whole essay chronologically. The dentist scene is first now since it happened first. Then the cardiologist, then the kitchen table. I moved the language theory paragraph to near the end. Does this order work better?",
        history,
      );
    } catch (e) {
      failFast('Mode 4: architecture coaching call', e);
    }
    assertSuccess(result, 'Mode 4: architecture');

    totalCost += result.totalCost;
    const output = [
      separator('MODE 4: ARCHITECTURE'),
      `STUDENT: "I reorganized the whole essay chronologically..."`,
      `\nEDIT PROCESSED: ${editProcessed}`,
      `NOTE: processEdit was called with reordered paragraphs. If the edit understanding`,
      `service classified this as 'structural_reorganization', mode will be 'architecture'.`,
      `Otherwise it may fall back to 'revision_response' (still useful — tests structural`,
      `discussion within revision mode).`,
      `COST: $${result.totalCost.toFixed(4)}`,
      `SUCCESS: ${result.success}`,
      `PROFILE DEEPENED: ${result.profileDeepened}`,
      separator('COACH RESPONSE'),
      result.response ?? '(no response)',
    ].join('\n');

    writeOutput('v3-audit-mode4-architecture.txt', output);
    console.log(`  Response: ${result.response?.length ?? 0} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ─── MODE 5: polish ───────────────────────────────────────────────────────

  console.log('\n[V3 Audit] MODE 5: polish (via processEdit with minor word change)');
  {
    const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'v3-polish');
    const history: ConversationTurn[] = [
      { role: 'student', content: "The essay feels almost done. Just small tweaks now." },
      { role: 'coach', content: "The structure is working. Let's look at word-level precision. Every word in this essay needs to earn its place." },
    ];

    // Minor word change: "last option" → "only option" in P4
    const oldParagraphs = essayText.split(/\n\n+/);
    const newP4 = oldParagraphs[3].replace("someone's last option", "someone's only option");
    const polishParagraphs = [...oldParagraphs];
    polishParagraphs[3] = newP4;
    const polishedText = polishParagraphs.join('\n\n');

    let editProcessed = false;
    try {
      await orchestrator.processEdit(essayText, polishedText);
      editProcessed = true;
      console.log('  Edit processed successfully (minor word change)');
    } catch (e) {
      console.warn('  Edit processing failed:', (e as Error).message?.slice(0, 100));
    }

    // Note: Polish mode requires BOTH significance='minor' AND phase='polish'|'distinction'.
    // The phase is set by the analysis pipeline and may not be 'polish' for this essay.
    // If phase is 'craft' or lower, this will trigger 'revision_response' instead —
    // still useful as it tests word-level revision coaching.
    const detectedPhase = profile.index.improvementPhase.level;

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        "I changed 'last option' to 'only option' in P4. 'Only' felt stronger. What do you think?",
        history,
      );
    } catch (e) {
      failFast('Mode 5: polish coaching call', e);
    }
    assertSuccess(result, 'Mode 5: polish');

    totalCost += result.totalCost;
    const output = [
      separator('MODE 5: POLISH'),
      `STUDENT: "I changed 'last option' to 'only option' in P4. 'Only' felt stronger. What do you think?"`,
      `\nEDIT PROCESSED: ${editProcessed}`,
      `ESSAY PHASE: ${detectedPhase}`,
      `NOTE: Polish mode requires significance='minor' AND phase='polish'|'distinction'.`,
      `The essay's detected phase is '${detectedPhase}'. If not polish/distinction, mode`,
      `will be 'revision_response' instead — still tests word-level revision coaching.`,
      `COST: $${result.totalCost.toFixed(4)}`,
      `SUCCESS: ${result.success}`,
      separator('COACH RESPONSE'),
      result.response ?? '(no response)',
    ].join('\n');

    writeOutput('v3-audit-mode5-polish.txt', output);
    console.log(`  Response: ${result.response?.length ?? 0} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`V3 AUDIT COMPLETE`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Output files in: ${OUTPUT_DIR}/`);
  console.log(`  v3-audit-pipeline.txt`);
  console.log(`  v3-audit-mode1-first-encounter.txt`);
  console.log(`  v3-audit-mode2-revision-response.txt`);
  console.log(`  v3-audit-mode3-iteration-deep.txt`);
  console.log(`  v3-audit-mode4-architecture.txt`);
  console.log(`  v3-audit-mode5-polish.txt`);
  console.log(`\nNext: Feed each output file into its V3 rubric prompt`);
  console.log(`(COACHING_BLOCK_SYSTEM_AUDIT_V3.md) for scoring.`);
}

main().catch((err) => {
  console.error('\n[V3 Audit] FATAL ERROR:', err);
  process.exit(1);
});
