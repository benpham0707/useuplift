/**
 * Realistic Multi-Turn Coaching Session — E2E Test
 *
 * Simulates how a REAL student interacts with the coaching system:
 * - Short/low-effort responses ("yeah", "ok", "idk")
 * - Defensive pushback ("my english teacher said it was good")
 * - Asking the coach to ghostwrite ("can you just show me?")
 * - Half-effort attempts
 * - Getting overwhelmed
 * - Sharing genuine context (breakthrough moment)
 * - Pasting revised text in chat
 * - Seeking premature validation ("can I submit this?")
 * - Misunderstanding feedback
 *
 * Tests: resistance handling, intensity calibration, anti-repetition,
 * strategic question persistence, student theory evolution, demonstration
 * trigger, deflection detection, honesty protocol, session memory threading.
 *
 * This uses ONE orchestrator across all turns (realistic session continuity).
 * All coaching happens through chat (no processEdit — avoids the JSON bug).
 *
 * Estimated cost: ~$0.70-1.20 (pipeline + 10 coaching turns)
 *
 * Run: npx tsx tests/test-realistic-session-e2e.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY not set');
  process.exit(1);
}

import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { ReanalysisOrchestrator } from '../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import { InMemoryCheckpointStore } from '../src/services/essayIntelligence/profileManager/checkpointStore';
import type { ConversationTurn } from '../src/services/essayIntelligence/coaching/coachingService';
import type { EssayProfile, CoachingSessionMemory, LearningStyleObservations } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// TEST CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, 'fixtures', 'translation-essay.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function failFast(step: string, error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ FAIL-FAST at ${step}: ${msg}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(1);
}

// ============================================================================
// THE REALISTIC STUDENT — 10 turns of messy, human behavior
// ============================================================================

const STUDENT_TURNS: Array<{
  turn: number;
  message: string;
  /** What this turn is testing */
  tests: string;
}> = [
  {
    turn: 1,
    message: "hey, i have to submit my common app essay soon and i need help. my english teacher said it was pretty good but idk. can you look at it?",
    tests: "Low confidence, seeking validation, informal tone, defers to authority (english teacher). Tests: does the coach lead with substance or sycophancy? Does it calibrate to the student's casual register?",
  },
  {
    turn: 2,
    message: "yeah i mean i guess. but my teacher said the opening was really strong so idk if i should change that part",
    tests: "Resistance type 1 (external authority). Short response. Defensive about opening. Tests: does the coach respect the teacher's opinion while still being honest? Does it reduce intensity for a short message?",
  },
  {
    turn: 3,
    message: "ok but what would it even look like? can you just write me a better version so i can see what you mean",
    tests: "Asking for ghostwriting. Deflection from doing the work. Tests: does the coach demonstrate ONCE (writing moment) without ghostwriting the essay? Does it hand the work back to the student?",
  },
  {
    turn: 4,
    message: "i dont really get what you mean by that. like are you saying the whole essay is bad or just the beginning? because i worked really hard on this",
    tests: "Confusion + emotional defensiveness. Misunderstands scope of feedback. Feels attacked. Tests: does the coach calibrate emotionally? Does it narrow scope? Does it acknowledge effort without backing down from honest assessment?",
  },
  {
    turn: 5,
    message: "ok fine. what about the part about the dentist and the tax stuff. my mom said i should include all of those to show i did a lot of translating",
    tests: "Defers to parent authority. Defends the weakest section (P3 list). Reveals family influence on essay. Tests: does the coach handle parent-as-authority differently from teacher-as-authority? Does it explain WHY a list doesn't work without dismissing the mom's input?",
  },
  {
    turn: 6,
    message: "ugh this is a lot. i have like 3 other essays to write and im running out of time. can we just focus on the most important thing",
    tests: "Overwhelmed. Time pressure. Wants to shortcut. Tests: does the coach narrow to ONE task? Does it respect the time constraint? Does it prioritize the highest-leverage fix?",
  },
  {
    turn: 7,
    message: "ok so you want me to focus on the doctor scene. fine. what do you want to know about it? like what actually happened was my mom had been having chest pains for like 2 weeks and she kept saying she was fine and then my dad made her go and i had to miss school to go with her because neither of them speaks enough english for a hospital. and im sitting there and the doctor is talking to ME not to her like she wasnt even in the room",
    tests: "BREAKTHROUGH — genuine context sharing. Physical detail. Emotional specificity. Raw anger ('like she wasn't even in the room'). Tests: does the coach recognize this as gold? Does it mine for the specific details that will power the revision? Does it connect this anger to the essay's identity layer?",
  },
  {
    turn: 8,
    message: "i tried rewriting the opening. here: 'My mom had been saying she was fine for two weeks but she wasnt fine. My dad finally made her go to the doctor and I had to miss school because someone had to translate and that someone was always me. Dr. Reeves started explaining the test results and he looked at me the whole time, not at her, like she was furniture.'",
    tests: "Student pastes revised text in chat. Rough draft — has voice problems (over-explains, 'like she was furniture' is strong but the setup is wordy). Tests: does the coach respond to WHAT CHANGED? Does it catch the strong parts and the weak parts? Does it not re-diagnose the whole essay?",
  },
  {
    turn: 9,
    message: "wait actually is my essay even good enough for stanford? like honestly. because i feel like everyone applying there has way more impressive stuff than translating for my parents",
    tests: "Imposter syndrome. Comparing to imagined competition. Devalues own experience. Tests: does the coach give an HONEST assessment without false encouragement? Does it reframe what 'impressive' means at Stanford? Does it name what this essay has that 'impressive stuff' essays don't?",
  },
  {
    turn: 10,
    message: "ok that makes sense. so the part where i made up the translation — 'your heart is working too hard ma' — that's actually the important part? because i always thought that was kind of embarrassing, like i should have known the real words",
    tests: "SECOND BREAKTHROUGH — student re-sees their own essay. The 'embarrassing' detail is the essay's strongest moment. Tests: does the coach recognize this as the pivotal reframe? Does it explain WHY the invented translation is powerful (not despite being made up, but BECAUSE it's made up)? Does it connect this to identity?",
  },
];

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8').trim();
  console.log(`\n[Realistic Session] Essay: ${essayText.length} chars, ${essayText.split(/\n\n+/).length} paragraphs\n`);

  let totalCost = 0;

  // ── Pipeline ──
  console.log('[Realistic Session] Running analysis pipeline...');
  let pipelineResult;
  try {
    pipelineResult = await analysisOrchestrator.analyzeEssay({
      essayId: 'realistic-session-test',
      essayText,
      essayType: 'common_app',
      includeAnnotations: false,
    });
  } catch (e) {
    failFast('Pipeline', e);
  }

  const profile = pipelineResult.profile as EssayProfile;
  totalCost += pipelineResult.costSummary.totalCost;
  console.log(`[Realistic Session] Pipeline complete: $${pipelineResult.costSummary.totalCost.toFixed(4)}, phase=${pipelineResult.improvementPhase?.level ?? 'unknown'}\n`);

  if (!profile?.paragraphs?.length) {
    failFast('Pipeline validation', new Error('Empty profile'));
  }

  // ── Create ONE orchestrator for the entire session ──
  const orchestrator = new ReanalysisOrchestrator(profile, new InMemoryCheckpointStore(), 'realistic-session');
  const history: ConversationTurn[] = [];
  let sessionMemory: CoachingSessionMemory | undefined;
  let learningStyle: LearningStyleObservations | undefined;

  // ── Full output document ──
  const outputLines: string[] = [
    '═'.repeat(80),
    'REALISTIC MULTI-TURN COACHING SESSION — E2E TEST',
    `Date: ${new Date().toISOString()}`,
    `Essay: translation-essay.txt (${essayText.length} chars)`,
    `Phase: ${pipelineResult.improvementPhase?.level ?? 'unknown'}`,
    `Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`,
    '═'.repeat(80),
    '',
  ];

  // ── Run 10 turns ──
  for (const turn of STUDENT_TURNS) {
    console.log(`[Turn ${turn.turn}] ${turn.message.slice(0, 60)}...`);

    let result;
    try {
      result = await orchestrator.processCoachingTurn(
        turn.message,
        history,
        undefined, // recentEditSummary
        sessionMemory,
        learningStyle,
      );
    } catch (e) {
      failFast(`Turn ${turn.turn}`, e);
    }

    if (!result.success) {
      failFast(`Turn ${turn.turn} result`, new Error(`success=false: ${result.error}`));
    }
    if (!result.response || result.response.length < 20) {
      failFast(`Turn ${turn.turn} response`, new Error(`Response too short: ${result.response?.length ?? 0} chars`));
    }

    totalCost += result.totalCost;

    // Thread session state forward
    sessionMemory = result.sessionMemory;
    learningStyle = result.learningStyle;

    // Add to conversation history
    history.push({ role: 'student', content: turn.message });
    history.push({ role: 'coach', content: result.response });

    // Format output
    outputLines.push(
      `${'─'.repeat(80)}`,
      `TURN ${turn.turn} | Cost: $${result.totalCost.toFixed(4)} | Deepened: ${result.profileDeepened}`,
      `TESTS: ${turn.tests}`,
      `${'─'.repeat(80)}`,
      '',
      `STUDENT: ${turn.message}`,
      '',
      `COACH:`,
      result.response,
      '',
    );

    console.log(`  → ${result.response.length} chars, $${result.totalCost.toFixed(4)}`);
  }

  // ── Final session state ──
  outputLines.push(
    '═'.repeat(80),
    'SESSION SUMMARY',
    '═'.repeat(80),
    '',
    `Total turns: ${STUDENT_TURNS.length}`,
    `Total cost: $${totalCost.toFixed(4)}`,
    `Session memory turn count: ${sessionMemory?.turnCount ?? 'N/A'}`,
    `Strategic question: ${sessionMemory?.strategicQuestion ?? 'N/A'}`,
    `Question staleness: ${sessionMemory?.questionStaleness ?? 'N/A'}`,
    `Events logged: ${sessionMemory?.events?.length ?? 0}`,
    `Demonstration count: ${sessionMemory?.demonstrationCount ?? 0}`,
    `Deflection counter: ${sessionMemory?.deflectionCounter ?? 0}`,
    '',
    'STUDENT THEORY:',
    JSON.stringify(sessionMemory?.studentTheory ?? 'Not yet synthesized', null, 2),
    '',
    'PRE-THEORY OBSERVATIONS:',
    JSON.stringify(sessionMemory?.preTheoryObservations ?? [], null, 2),
    '',
  );

  // ── Write output ──
  ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, 'realistic-session-full.txt');
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`REALISTIC SESSION COMPLETE`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Output: ${outputPath}`);
  console.log(`${'═'.repeat(60)}`);
}

main().catch((err) => {
  console.error('\n[Realistic Session] FATAL:', err);
  process.exit(1);
});
