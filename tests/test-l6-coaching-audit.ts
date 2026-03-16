/**
 * L6 Coaching Audit — Does Multi-Turn Coaching Actually Evolve?
 *
 * Tests 5 coaching turns against the piano essay to evaluate:
 * 1. Turn 1: Overall assessment quality (honesty, specificity, phase-awareness)
 * 2. Turn 2: Paragraph-specific coaching (P1 opening analysis)
 * 3. Turn 3: Anti-repetition (same topic revisited — must go deeper, not rephrase)
 * 4. Turn 4: Reinterpretation handling (student offers alternative reading)
 * 5. Turn 5: Paragraph-specific coaching with full profile context (P3)
 *
 * Pipeline: Full L1→L4 analysis (skip L5 annotations to save cost),
 * then 5 coaching turns through ReanalysisOrchestrator.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l6-coaching-audit.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root BEFORE any service imports
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { ReanalysisOrchestrator } from '../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import { InMemoryCheckpointStore } from '../src/services/essayIntelligence/profileManager/checkpointStore';
import type { ConversationTurn } from '../src/services/essayIntelligence/coaching/coachingService';
import type { EssayProfile } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, 'fixtures', 'piano-essay.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'l6-coaching-audit.txt');

// The 5 coaching turns to simulate
const COACHING_TURNS = [
  'What do you think of my essay overall?',
  'Tell me more about the opening paragraph',
  'What about the opening paragraph though — is it good enough?',
  'Actually I meant the music-coding parallel to show my versatility',
  'How should I improve paragraph 3?',
];

// ============================================================================
// HELPERS
// ============================================================================

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeOutput(content: string): void {
  ensureOutputDir();
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  console.log(`\n[Audit] Output written to: ${OUTPUT_FILE}`);
}

function separator(title: string): string {
  return `\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}\n`;
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
  console.log(`[Audit] Essay loaded: ${essayText.length} chars`);

  const output: string[] = [];
  output.push('L6 COACHING AUDIT — Multi-Turn Evolution Test');
  output.push(`Date: ${new Date().toISOString()}`);
  output.push(`Essay: piano-essay.txt (${essayText.length} chars)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Run full pipeline (L1→L4, skip L5)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n[Audit] Running full analysis pipeline (L1→L4)...');
  const pipelineStart = Date.now();

  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: 'coaching-audit-piano',
    essayText,
    essayType: 'common_app',
    includeAnnotations: false, // Skip L5 to save cost
  });

  const pipelineTime = Date.now() - pipelineStart;
  const profile = pipelineResult.profile as EssayProfile;

  output.push(separator('PIPELINE RESULT'));
  output.push(`Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  output.push(`Layers failed: ${pipelineResult.layersFailed.map(f => `${f.layer}: ${f.error}`).join(', ') || 'none'}`);
  output.push(`Improvement phase: ${pipelineResult.improvementPhase?.level ?? 'unknown'}`);
  output.push(`Phase reasoning: ${pipelineResult.improvementPhase?.reasoning ?? 'N/A'}`);
  output.push(`Confidence: ${pipelineResult.confidenceLevel}`);
  output.push(`Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`);
  output.push(`Pipeline time: ${pipelineTime}ms`);

  // North Star summary
  const ns = profile.index.northStarSummary;
  if (ns.throughLineSummary) {
    output.push(`\nNorth Star: ${ns.throughLineSummary}`);
    if (ns.structuralRoles.length > 0) {
      output.push('Structural roles:');
      for (const role of ns.structuralRoles) {
        output.push(`  P${role.paragraphIndex + 1}: ${role.role} [${role.significance}]`);
      }
    }
  }

  console.log(`[Audit] Pipeline complete: ${pipelineResult.layersCompleted.join(', ')} — $${pipelineResult.costSummary.totalCost.toFixed(4)}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Run 5 coaching turns
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n[Audit] Starting coaching turns...');

  const checkpointStore = new InMemoryCheckpointStore();
  const reanalysisOrchestrator = new ReanalysisOrchestrator(
    profile,
    checkpointStore,
    'coaching-audit-piano',
  );

  const conversationHistory: ConversationTurn[] = [];
  let totalCoachingCost = 0;

  for (let i = 0; i < COACHING_TURNS.length; i++) {
    const turnNum = i + 1;
    const studentMessage = COACHING_TURNS[i];

    console.log(`\n[Audit] Turn ${turnNum}: "${studentMessage.slice(0, 60)}..."`);

    const turnStart = Date.now();
    const result = await reanalysisOrchestrator.processCoachingTurn(
      studentMessage,
      conversationHistory,
    );
    const turnTime = Date.now() - turnStart;

    totalCoachingCost += result.totalCost;

    output.push(separator(`TURN ${turnNum}`));
    output.push(`STUDENT: "${studentMessage}"`);
    output.push(`\nRouting: (from costBreakdown)`);
    output.push(`Profile deepened: ${result.profileDeepened}`);
    output.push(`Cost: $${result.totalCost.toFixed(4)}`);
    output.push(`Time: ${turnTime}ms`);
    if (result.insightId) {
      output.push(`Insight ID: ${result.insightId}`);
    }
    output.push(`\nCOACH RESPONSE:\n${result.response ?? '(no response)'}`);

    // Add to conversation history for next turn
    conversationHistory.push({ role: 'student', content: studentMessage });
    if (result.response) {
      conversationHistory.push({ role: 'coach', content: result.response });
    }

    console.log(
      `[Audit] Turn ${turnNum} complete — ` +
      `response=${result.response?.length ?? 0} chars, ` +
      `cost=$${result.totalCost.toFixed(4)}, time=${turnTime}ms`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  output.push(separator('COST SUMMARY'));
  output.push(`Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`);
  output.push(`Coaching cost (5 turns): $${totalCoachingCost.toFixed(4)}`);
  output.push(`Total cost: $${(pipelineResult.costSummary.totalCost + totalCoachingCost).toFixed(4)}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTI-REPETITION CHECK (automated)
  // ═══════════════════════════════════════════════════════════════════════════

  output.push(separator('ANTI-REPETITION ANALYSIS'));

  // Extract Turn 2 and Turn 3 responses for comparison
  // Turn 2 is at history index 2 (student) + 3 (coach) → coach content at index 3
  // Turn 3 is at history index 4 (student) + 5 (coach) → coach content at index 5
  if (conversationHistory.length >= 6) {
    const turn2Response = conversationHistory[3].content;
    const turn3Response = conversationHistory[5].content;

    // Simple overlap metric: extract significant phrases (4+ word sequences) and check overlap
    const extractPhrases = (text: string): Set<string> => {
      const words = text.toLowerCase().split(/\s+/);
      const phrases = new Set<string>();
      for (let i = 0; i <= words.length - 4; i++) {
        phrases.add(words.slice(i, i + 4).join(' '));
      }
      return phrases;
    };

    const t2Phrases = extractPhrases(turn2Response);
    const t3Phrases = extractPhrases(turn3Response);

    let overlap = 0;
    for (const phrase of t3Phrases) {
      if (t2Phrases.has(phrase)) overlap++;
    }

    const overlapPct = t3Phrases.size > 0 ? (overlap / t3Phrases.size * 100) : 0;
    output.push(`Turn 2 response length: ${turn2Response.length} chars`);
    output.push(`Turn 3 response length: ${turn3Response.length} chars`);
    output.push(`4-word phrase overlap (T3 phrases found in T2): ${overlap}/${t3Phrases.size} (${overlapPct.toFixed(1)}%)`);
    output.push(`Anti-repetition verdict: ${overlapPct > 30 ? 'FAIL — too much overlap' : overlapPct > 15 ? 'MARGINAL' : 'PASS'}`);
  } else {
    output.push('(insufficient conversation history for anti-repetition check)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE OUTPUT
  // ═══════════════════════════════════════════════════════════════════════════

  writeOutput(output.join('\n'));

  console.log(`\n[Audit] COMPLETE — Total cost: $${(pipelineResult.costSummary.totalCost + totalCoachingCost).toFixed(4)}`);
}

// ============================================================================
// RUN
// ============================================================================

main().catch((err) => {
  console.error('[Audit] FATAL ERROR:', err);
  process.exit(1);
});
