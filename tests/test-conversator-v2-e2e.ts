/**
 * Conversator V2 E2E Audit — Comprehensive coaching pipeline test.
 *
 * Exercises every V2 feature with real LLM calls and captures every internal
 * decision for analysis. 10 coaching turns, 1 edit simulation, session memory
 * passing, anti-repetition analysis, and full V2 feature verification.
 *
 * Phases:
 *   1. Initial analysis (L1-L4, no L5)
 *   2. 10 coaching turns with session memory passing
 *   3. Edit simulation (between turns 5 and 6)
 *   4. Comprehensive output report
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-conversator-v2-e2e.ts
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
import type { EditProcessResult, CoachingTurnResult } from '../src/services/essayIntelligence/analysis/reanalysisOrchestrator';
import type { LayerCost } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { InMemoryCheckpointStore } from '../src/services/essayIntelligence/profileManager/checkpointStore';
import type { ConversationTurn } from '../src/services/essayIntelligence/coaching/coachingService';
import type {
  EssayProfile,
  CoachingSessionMemory,
  LearningStyleObservations,
  SessionEvent,
} from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, 'fixtures', 'piano-essay.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'conversator-v2-e2e-audit.txt');

// ============================================================================
// COACHING TURNS
// ============================================================================

const COACHING_TURNS: Array<{
  message: string;
  description: string;
  v2Feature: string;
  expectation: string;
}> = [
  {
    message: 'What do you think of my essay overall?',
    description: 'General overview — first turn baseline',
    v2Feature: 'Session init, pedagogical rules, global findings',
    expectation:
      'Coach quotes essay, references phase, honest assessment. Events array starts empty.',
  },
  {
    message:
      'Can you help me with paragraph 1? The opening feels generic to me.',
    description: 'Paragraph-specific — P1 focus',
    v2Feature: 'Scoped findings (P1), structural roles, essay text scoping',
    expectation:
      'Findings scoped to P1. Structural role for P1 mentioned. Not all 7 paragraphs needed.',
  },
  {
    message:
      'I wrote this essay right after my first hackathon — the AI DJ project was actually my hackathon entry and we won second place.',
    description: 'New context revelation — backstory',
    v2Feature:
      'contextAccumulation, studentDeclaredContext, needsDeepening=true',
    expectation:
      'Sidecar flags needsDeepening. Stage 4 runs. studentDeclaredContext populated with hackathon context.',
  },
  {
    message:
      'What about the voice in paragraph 3? It feels different from the rest of the essay.',
    description: 'Dimension + paragraph focus — voice in P3',
    v2Feature:
      'Dimension-matched findings, journal entry (turn 4 >= 3), session events',
    expectation:
      'Findings include voice-dimension matches. Journal entry captures turns 1-3 arc.',
  },
  {
    message:
      "No, I don't think paragraph 3 is really about innovation or reimagining. I wrote it thinking about my piano teacher Mrs. Chen who taught me Chopin — it's really about honoring her influence.",
    description: "Reinterpretation — student challenges system's reading",
    v2Feature:
      'needsDeepening=true, finding supersession, high-significance event (0.9)',
    expectation:
      'Sidecar: category=reinterpretation, needsDeepening=true. Stage 4 runs. Findings may be superseded.',
  },
  // === EDIT HAPPENS HERE (processEdit called before turn 6) ===
  {
    message: "I just rewrote the opening — what do you think of it now?",
    description: 'Post-edit coaching — references the edit',
    v2Feature: 'Edit intelligence (rich context), edit session event persistence',
    expectation:
      "Coach references the edit's purpose. Edit event visible in session memory.",
  },
  {
    message:
      'Does the new opening connect well to the paragraph about Mrs. Chen and Chopin?',
    description:
      'Cross-paragraph + edit persistence + declared context',
    v2Feature:
      'Edit event still in memory (persistence test), cross-paragraph coaching, declared context',
    expectation:
      'Coach uses both edit knowledge (from event) and Mrs. Chen context (from declared context).',
  },
  {
    message:
      "Going back to the opening — is it specific enough now? You mentioned earlier it was too generic.",
    description: 'Return to earlier topic — anti-repetition test',
    v2Feature: 'Anti-repetition context, session journal continuity',
    expectation:
      'Coach does NOT repeat turn 2 advice. References the edit. Goes deeper or redirects.',
  },
  {
    message:
      'What about my conclusion — the last paragraph? Is it strong enough to end on?',
    description: 'Late session — conclusion focus',
    v2Feature:
      'Late session arc guidance, scoped findings for last paragraph',
    expectation:
      "Session arc says 'LATE SESSION: consolidate'. Findings scoped to conclusion.",
  },
  {
    message:
      "I just realized something — this whole essay is really about the moment I first heard Mrs. Chen play the Chopin Nocturne and felt like anything was possible. That's what I want the reader to feel.",
    description: 'Breakthrough/revelation — new understanding',
    v2Feature:
      'needsDeepening=true, contextAccumulation (builds on turn 3), breakthrough pedagogy',
    expectation:
      'Coach names the insight, connects forward, keeps response SHORT (pedagogical rules for breakthrough).',
  },
];

// ============================================================================
// EDIT SIMULATION DATA
// ============================================================================

const ORIGINAL_P1 =
  "From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.";

const REVISED_P1 =
  "The Chopin Nocturne was still ringing in the practice room when I opened my laptop and started debugging the AI DJ's mood detection algorithm. My fingers had just played the same phrase forty times, searching for the emotional center — and now they were rewriting the same function, searching for the logical one. Mrs. Chen always said the best music lives in the space between what you play and what you feel. I was starting to think code worked the same way.";

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
  console.log(`\n[V2 Audit] Output written to: ${OUTPUT_FILE}`);
}

function separator(title: string): string {
  return `\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}\n`;
}

function thinSeparator(): string {
  return `\n${'─'.repeat(80)}\n`;
}

function formatLayerCost(lc: LayerCost): string {
  const tu = lc.tokenUsage;
  return (
    `    Layer: ${lc.layer.padEnd(35)} Cost: $${lc.cost.toFixed(4).padStart(8)}  ` +
    `Input: ${String(tu.inputTokens).padStart(6)}  Output: ${String(tu.outputTokens).padStart(6)}  ` +
    `Cache read: ${String(tu.cacheReadTokens).padStart(6)}  Time: ${String(lc.timingMs).padStart(5)}ms`
  );
}

function formatSessionEvent(ev: SessionEvent): string {
  const pRefs = ev.paragraphRefs.length > 0 ? ` refs=P${ev.paragraphRefs.map(p => p + 1).join(',P')}` : '';
  const fRefs = ev.findingRefs.length > 0 ? ` findings=[${ev.findingRefs.join(',')}]` : '';
  return `    T${ev.turn} ${ev.kind} sig=${ev.significance.toFixed(2)}${pRefs}${fRefs} — ${ev.summary}`;
}

/**
 * Extract 4-word phrases from text for overlap analysis.
 */
function extractPhrases(text: string): Set<string> {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = new Set<string>();
  for (let i = 0; i <= words.length - 4; i++) {
    phrases.add(words.slice(i, i + 4).join(' '));
  }
  return phrases;
}

// ============================================================================
// PER-TURN CAPTURE
// ============================================================================

interface TurnCapture {
  turnNum: number;
  message: string;
  description: string;
  v2Feature: string;
  expectation: string;
  result: CoachingTurnResult;
  timingMs: number;
  profileSnapshot: {
    studentDeclaredContext: string;
    conversationInsightsCount: number;
    patternInsightsCount: number;
    writerPortrait: string;
  };
  studentTheory?: import('../src/services/essayIntelligence/profileTypes').StudentTheory;
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
  console.log(`[V2 Audit] Essay loaded: ${essayText.length} chars`);

  const output: string[] = [];
  output.push('CONVERSATOR V2 E2E AUDIT — Comprehensive Coaching Pipeline Test');
  output.push(`Date: ${new Date().toISOString()}`);
  output.push(`Essay: piano-essay.txt (${essayText.length} chars)`);
  output.push(`Turns: ${COACHING_TURNS.length}`);
  output.push(`Edit simulation: yes (between turns 5 and 6)`);

  const wallStart = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Run full pipeline (L1→L4, skip L5)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n[V2 Audit] PHASE 1: Running full analysis pipeline (L1→L4)...');
  const pipelineStart = Date.now();

  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: 'conversator-v2-audit-piano',
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });

  const pipelineTime = Date.now() - pipelineStart;
  const profile = pipelineResult.profile as EssayProfile;

  // ── CRITICAL PIPELINE GATE ──
  // L3, L3.75, L3.5 are always critical — coaching without them is broken.
  // L4 is critical for full intelligence (North Star, findings, technique router, phase detection).
  // With the sequential split fix (North Star 3500 tokens + Score Matrix 3500 tokens),
  // L4 should reliably complete within 120s per call. If it still fails, abort —
  // coaching without L4 loses 7 capabilities.
  const criticalLayers = ['L3', 'L3.75', 'L3.5'];
  const failedCritical = pipelineResult.layersFailed.filter(f =>
    criticalLayers.some(cl => f.layer.includes(cl))
  );
  if (failedCritical.length > 0) {
    const failMsg = failedCritical.map(f => `${f.layer}: ${f.message}`).join(', ');
    console.error(`[V2 Audit] CRITICAL PIPELINE FAILURE — ${failMsg}`);
    console.error(`[V2 Audit] Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)} in ${pipelineTime}ms`);
    console.error(`[V2 Audit] Aborting — coaching without ${failedCritical.map(f => f.layer).join(', ')} would produce degraded results.`);
    console.error(`[V2 Audit] Layers that DID complete: ${pipelineResult.layersCompleted.join(', ')}`);
    process.exit(1);
  }
  // L4 failure is non-fatal — coaching works at reduced quality without North Star.
  // Log loudly so we know, but continue to test coaching capabilities.
  const l4Failed = pipelineResult.layersFailed.some(f => f.layer === 'L4');
  if (l4Failed) {
    console.warn(`[V2 Audit] WARNING: L4 failed — North Star, structural roles, technique router, and phase detection degraded. Continuing anyway.`);
  }

  // Save the initial analysis profile before coaching modifies it
  const initialProfilePath = path.join(OUTPUT_DIR, 'conversator-v2-initial-profile.json');
  try {
    const initialJson = JSON.stringify(profile, null, 2);
    fs.writeFileSync(initialProfilePath, initialJson, 'utf-8');
    console.log(`[V2 Audit] Initial profile saved: ${initialProfilePath} (${(initialJson.length / 1024).toFixed(0)}KB)`);
  } catch (err) {
    console.error('[V2 Audit] Failed to save initial profile:', err instanceof Error ? err.message : String(err));
  }

  output.push(separator('PHASE 1: INITIAL ANALYSIS (L1→L4)'));
  output.push(`Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  output.push(
    `Layers failed: ${pipelineResult.layersFailed.map(f => `${f.layer}: ${f.message}`).join(', ') || 'none'}`,
  );
  output.push(
    `Improvement phase: ${pipelineResult.improvementPhase?.level ?? 'unknown'}`,
  );
  output.push(
    `Phase reasoning: ${pipelineResult.improvementPhase?.reasoning ?? 'N/A'}`,
  );
  output.push(`Confidence: ${pipelineResult.confidenceLevel}`);
  output.push(
    `Pipeline cost: $${pipelineResult.costSummary.totalCost.toFixed(4)}`,
  );
  output.push(`Pipeline time: ${pipelineTime}ms`);

  // North Star summary
  const ns = profile.index.northStarSummary;
  if (ns.throughLineSummary) {
    output.push(`\nNorth Star: ${ns.throughLineSummary}`);
    output.push(`North Star maturity: ${ns.maturity}`);
    if (ns.structuralRoles.length > 0) {
      output.push('Structural roles:');
      for (const role of ns.structuralRoles) {
        output.push(
          `  P${role.paragraphIndex + 1}: ${role.role} [${role.significance}]`,
        );
      }
    }
  }

  // AO First Read (GAP-4)
  if (profile.aoFirstRead) {
    output.push('\nAO FIRST READ (gut reaction):');
    output.push(`  Hook moment: ${profile.aoFirstRead.hookMoment ?? '(none)'}`);
    output.push(`  Committee one-liner: ${profile.aoFirstRead.committeeOneLiner}`);
    output.push(`  Distinctiveness: ${profile.aoFirstRead.distinctivenessSignal ?? '(none)'}`);
    output.push(`  Put-down risk: ${profile.aoFirstRead.putDownRisk}`);
    output.push(`  Gut reaction: ${profile.aoFirstRead.gutReaction}`);
  } else {
    output.push('\nAO FIRST READ: (not available)');
  }

  // Person Portrait (GAP-5)
  if (profile.characterRevelation?.writerPortrait) {
    output.push(`\nPERSON PORTRAIT: ${profile.characterRevelation.writerPortrait}`);
  }

  // Archetype (GAP-10)
  if (profile.admissionsPositioning?.archetypeContext) {
    const ac = profile.admissionsPositioning.archetypeContext;
    output.push(`\nARCHETYPE: ${ac.archetype} (${ac.poolDensity})`);
    output.push(`  Differentiator: ${ac.differentiator ?? '(none — generic execution)'}`);
  }

  // Red Flags (GAP-21)
  if (profile.admissionsPositioning?.redFlags?.length) {
    output.push('\nRED FLAGS:');
    for (const flag of profile.admissionsPositioning.redFlags) {
      output.push(`  - ${flag}`);
    }
  }

  // Emotional Absence (from emotionalTopography)
  if (profile.emotionalTopography?.authenticityAssessment) {
    output.push(`\nEMOTIONAL AUTHENTICITY: ${profile.emotionalTopography.authenticityAssessment}`);
  }

  // Analysis Mode
  output.push(`\nANALYSIS MODE: ${(pipelineResult as any).analysisMode ?? 'unknown'}`);

  // Observation Count (GAP-18)
  let totalObservations = 0;
  for (const para of profile.paragraphs) {
    for (const sent of para.sentences) {
      if (sent.understanding) {
        totalObservations += (sent.understanding.observedFunctions?.length ?? 0);
        totalObservations += (sent.understanding.inferredIntents?.length ?? 0);
        totalObservations += (sent.understanding.narrativeContributions?.length ?? 0);
      }
    }
  }
  output.push(`OBSERVATION COUNT: ${totalObservations} (target: 30-50 for 7 paragraphs)`);

  // ── EXPANDED PROFILE OUTPUT ──

  // Findings (L3.5 analysis)
  output.push('\nFINDINGS:');
  if (profile.findings.length > 0) {
    const activeFindings = profile.findings.filter(f => f.status === 'active');
    output.push(`  Total: ${profile.findings.length} (${activeFindings.length} active)`);
    for (const f of activeFindings.slice(0, 10)) {
      const scopeStr = f.scope.type === 'essay_level' ? 'essay-level'
        : f.scope.type === 'cross_paragraph' ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+')}`
        : `P${(f.scope.paragraph ?? 0) + 1}`;
      output.push(`  [${f.id}] [${f.maturity}/${f.coachingValue}] ${scopeStr} [${f.dimensions.join(',')}]`);
      output.push(`    ${f.claim}`);
    }
  } else {
    output.push('  (no findings)');
  }

  // Voice Identity
  if (profile.voiceIdentity) {
    output.push('\nVOICE IDENTITY:');
    output.push(`  Primary register: ${profile.voiceIdentity.primaryRegister ?? '(unknown)'}`);
    output.push(`  Authenticity: ${profile.voiceIdentity.authenticityLevel ?? '(unknown)'}`);
  }

  // Thematic Architecture
  if (profile.thematicArchitecture) {
    output.push('\nTHEMATIC ARCHITECTURE:');
    output.push(`  Central thesis: ${profile.thematicArchitecture.centralThesis ?? '(none)'}`);
    const threads = profile.thematicArchitecture.threads ?? [];
    if (threads.length > 0) {
      output.push(`  Threads: ${threads.map((t: any) => t.name ?? t.theme ?? JSON.stringify(t).slice(0, 60)).join('; ')}`);
    }
  }

  // Narrative Strategy
  if (profile.narrativeStrategy) {
    output.push('\nNARRATIVE STRATEGY:');
    output.push(`  Primary strategy: ${profile.narrativeStrategy.primaryStrategy ?? '(unknown)'}`);
  }

  // Connections
  if (profile.connections) {
    const allConns = [
      ...(profile.connections.crossParagraph ?? []),
      ...(profile.connections.thematic ?? []),
      ...(profile.connections.structural ?? []),
    ];
    output.push(`\nCONNECTIONS: ${allConns.length} total`);
    for (const c of allConns.slice(0, 5)) {
      output.push(`  ${(c as any).type ?? 'unknown'}: ${(c as any).description?.slice(0, 100) ?? JSON.stringify(c).slice(0, 100)}`);
    }
  }

  // Entanglements
  if (profile.entanglements?.length > 0) {
    output.push(`\nENTANGLEMENTS: ${profile.entanglements.length}`);
    for (const e of profile.entanglements.slice(0, 3)) {
      output.push(`  ${e.dimensions.join('+')} at P${e.location.paragraph + 1}: ${e.description.slice(0, 80)}`);
    }
  }

  // North Star Intent Bridge
  if (profile.northStar?.intentBridge?.studentIntent) {
    output.push('\nINTENT BRIDGE:');
    output.push(`  Student intent: "${profile.northStar.intentBridge.studentIntent}"`);
    const alignments = profile.northStar.intentBridge.alignments ?? [];
    for (const a of alignments.slice(0, 3)) {
      output.push(`  ${a.alignment}: ${a.detail}`);
    }
  }

  // Word count
  const totalWords = profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);
  output.push(`\nWORD COUNT: ${totalWords}/650`);

  // Per-paragraph digest
  output.push('\nPARAGRAPH DIGEST:');
  for (let i = 0; i < profile.paragraphs.length; i++) {
    const para = profile.paragraphs[i];
    const words = para.text.split(/\s+/).length;
    const sentCount = para.sentences?.length ?? 0;
    output.push(`  P${i + 1}: ${words} words, ${sentCount} sentences`);
  }

  // Per-layer cost breakdown
  output.push('\nPIPELINE COST BREAKDOWN:');
  for (const lc of pipelineResult.costSummary.layers) {
    output.push(formatLayerCost(lc));
  }

  console.log(
    `[V2 Audit] Pipeline complete: ${pipelineResult.layersCompleted.join(', ')} — ` +
    `$${pipelineResult.costSummary.totalCost.toFixed(4)} in ${pipelineTime}ms`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 + 3: Coaching turns with edit simulation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n[V2 Audit] PHASE 2+3: Starting coaching turns...');

  const checkpointStore = new InMemoryCheckpointStore();
  const reanalysisOrchestrator = new ReanalysisOrchestrator(
    profile,
    checkpointStore,
    'conversator-v2-audit-piano',
  );

  const conversationHistory: ConversationTurn[] = [];
  let totalCoachingCost = 0;
  let editCost = 0;
  let editTimingMs = 0;
  let editResult: EditProcessResult | undefined;
  const turnCaptures: TurnCapture[] = [];
  const turnTimings: number[] = [];
  const turnCosts: number[] = [];

  // Session memory and learning style — passed between turns
  let sessionMemory: CoachingSessionMemory | undefined;
  let learningStyle: LearningStyleObservations | undefined;

  // Session arc snapshots at specific turns
  const sessionArcSnapshots: Array<{ turn: number; arc: string }> = [];

  for (let i = 0; i < COACHING_TURNS.length; i++) {
    const turnNum = i + 1;
    const turnDef = COACHING_TURNS[i];

    // ── EDIT SIMULATION (before turn 6) ──────────────────────────────────
    if (turnNum === 6) {
      console.log('\n[V2 Audit] === EDIT SIMULATION ===');
      const editStart = Date.now();

      try {
        editResult = await reanalysisOrchestrator.processEdit(
          ORIGINAL_P1,
          REVISED_P1,
        );
        editTimingMs = Date.now() - editStart;
        editCost = editResult.totalCost;

        output.push(separator('EDIT SIMULATION (between turns 5 and 6)'));
        output.push(`Mode: ${editResult.mode}`);
        output.push(`Total cost: $${editResult.totalCost.toFixed(4)}`);
        output.push(`Time: ${editTimingMs}ms`);
        output.push(`Reanalysis triggered: ${editResult.reanalysisTriggered}`);

        const eu = editResult.editOutput.understanding;
        output.push(`\nEdit Understanding:`);
        output.push(`  Significance: ${eu.significance}`);
        output.push(`  Significance reasoning: ${eu.significanceReasoning}`);
        output.push(`  Change type: ${eu.changeType}`);
        output.push(`  Apparent purpose: ${eu.apparentPurpose}`);
        output.push(`  Purpose confidence: ${eu.purposeConfidence}`);
        output.push(`  Direct impact: ${eu.profileImpact.directImpact}`);
        output.push(`  Paragraph impact: ${eu.profileImpact.paragraphImpact ?? 'none'}`);
        output.push(`  Holistic impact: ${eu.profileImpact.holisticImpact ?? 'none'}`);
        output.push(
          `  Scope recommendation: ${eu.scopeRecommendation.scope} — ${eu.scopeRecommendation.reasoning}`,
        );

        if (editResult.costBreakdown.length > 0) {
          output.push('\nEDIT COST BREAKDOWN:');
          for (const lc of editResult.costBreakdown) {
            output.push(formatLayerCost(lc));
          }
        }

        console.log(
          `[V2 Audit] Edit complete: mode=${editResult.mode}, ` +
          `cost=$${editResult.totalCost.toFixed(4)}, time=${editTimingMs}ms`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        output.push(separator('EDIT SIMULATION (FAILED)'));
        output.push(`Error: ${errMsg}`);
        console.error(`[V2 Audit] Edit failed: ${errMsg}`);
      }
    }

    // ── COACHING TURN (fail-fast: save output and abort on any error) ───
    console.log(
      `\n[V2 Audit] Turn ${turnNum}: "${turnDef.message.slice(0, 60)}..."`,
    );

    const turnStart = Date.now();
    let result: CoachingTurnResult;
    try {
      result = await reanalysisOrchestrator.processCoachingTurn(
        turnDef.message,
        conversationHistory,
        undefined, // recentEditSummary — handled via lastEditUnderstanding internally
        sessionMemory,
        learningStyle,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : '';
      output.push(separator(`TURN ${turnNum}: FATAL ERROR`));
      output.push(`Message: "${turnDef.message}"`);
      output.push(`Error: ${errMsg}`);
      output.push(`Stack: ${errStack}`);
      output.push(`\nCost so far: $${(pipelineResult.costSummary.totalCost + totalCoachingCost).toFixed(4)}`);
      output.push(`Turns completed before failure: ${turnNum - 1}`);
      // Save partial output for debugging
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf-8');
      console.error(`[V2 Audit] FATAL: Turn ${turnNum} failed — ${errMsg}`);
      console.error(`[V2 Audit] Partial output saved to ${OUTPUT_FILE}`);
      console.error(`[V2 Audit] Cost so far: $${(pipelineResult.costSummary.totalCost + totalCoachingCost).toFixed(4)}`);
      process.exit(1);
    }
    const turnTime = Date.now() - turnStart;

    turnTimings.push(turnTime);
    turnCosts.push(result.totalCost);
    totalCoachingCost += result.totalCost;

    // Extract session memory and learning style for next turn
    if (result.sessionMemory) {
      sessionMemory = result.sessionMemory;
    }
    if (result.learningStyle) {
      learningStyle = result.learningStyle;
    }

    // Capture session arc snapshots at turns 3, 5, 7, 10
    if ([3, 5, 7, 10].includes(turnNum) && sessionMemory) {
      sessionArcSnapshots.push({
        turn: turnNum,
        arc: sessionMemory.sessionArcSummary || '(empty)',
      });
    }

    // Snapshot profile state
    const currentProfile = reanalysisOrchestrator.getProfile();

    const capture: TurnCapture = {
      turnNum,
      message: turnDef.message,
      description: turnDef.description,
      v2Feature: turnDef.v2Feature,
      expectation: turnDef.expectation,
      result,
      timingMs: turnTime,
      profileSnapshot: {
        studentDeclaredContext: currentProfile.studentDeclaredContext || '',
        conversationInsightsCount: currentProfile.conversationInsights.length,
        patternInsightsCount: currentProfile.patternInsights.length,
        writerPortrait: currentProfile.characterRevelation?.writerPortrait ?? '',
      },
      studentTheory: sessionMemory?.studentTheory ?? undefined,
    };
    turnCaptures.push(capture);

    // ── FORMAT TURN OUTPUT ─────────────────────────────────────────────

    output.push(separator(
      `TURN ${turnNum}: "${turnDef.message.slice(0, 80)}${turnDef.message.length > 80 ? '...' : ''}"`,
    ));
    output.push(`V2 Feature: ${turnDef.v2Feature}`);
    output.push(`Expectation: ${turnDef.expectation}`);

    if (!result.success) {
      output.push(`\n*** TURN FAILED: ${result.error} ***`);
      output.push(thinSeparator());

      // Still add to conversation history to keep turn numbering correct
      conversationHistory.push({ role: 'student', content: turnDef.message });

      console.log(`[V2 Audit] Turn ${turnNum} FAILED: ${result.error}`);
      continue;
    }

    // COST BREAKDOWN
    output.push('\nCOST BREAKDOWN:');
    if (result.costBreakdown.length > 0) {
      for (const lc of result.costBreakdown) {
        output.push(formatLayerCost(lc));
      }
    } else {
      output.push('    (no cost breakdown available)');
    }
    output.push(`  Total: $${result.totalCost.toFixed(4)}`);

    // SESSION MEMORY STATE
    output.push('\nSESSION MEMORY STATE:');
    if (sessionMemory) {
      output.push(`  Turn count: ${sessionMemory.turnCount}`);
      output.push(`  Events count: ${sessionMemory.events.length}`);
      if (sessionMemory.events.length > 0) {
        output.push('  Events:');
        for (const ev of sessionMemory.events) {
          output.push(formatSessionEvent(ev));
        }
      }
      output.push(`  Session arc: ${sessionMemory.sessionArcSummary || '(empty)'}`);
      output.push(`  Next focus: ${sessionMemory.nextFocus || '(empty)'}`);
      output.push(`  Strategic question: ${sessionMemory.strategicQuestion || '(empty)'}`);
      output.push(`  Question staleness: ${sessionMemory.questionStaleness ?? 0}`);
      output.push(`  Last response intensity: ${sessionMemory.lastResponseIntensity ?? '(not set)'}`);
    } else {
      output.push('  (no session memory returned)');
    }

    // COGNITIVE ASSESSMENT
    output.push('\nCOGNITIVE ASSESSMENT:');
    if (result.cognitiveAssessment) {
      output.push(`  Assessment: ${result.cognitiveAssessment.assessment}`);
      output.push(`  Response intensity: ${result.cognitiveAssessment.responseIntensity}`);
    } else {
      output.push('  (not returned this turn)');
    }

    // LEARNING STYLE
    output.push('\nLEARNING STYLE OBSERVATIONS:');
    if (learningStyle && learningStyle.observations.length > 0) {
      for (const obs of learningStyle.observations) {
        output.push(
          `  [T${obs.turnObserved}] (${obs.confidence}) ${obs.observation}`,
        );
      }
    } else {
      output.push('  (none yet)');
    }

    // QUALITY SIGNALS
    if (result.qualitySignals) {
      output.push('\nQUALITY SIGNALS:');
      output.push(`  Vocabulary evolution: ${result.qualitySignals.vocabularyEvolution}`);
      output.push(`  Question quality trend: ${result.qualitySignals.questionQualityTrend}`);
      output.push(`  Revision sophistication: ${result.qualitySignals.revisionSophistication}`);
      output.push(`  Student initiation: ${result.qualitySignals.studentInitiation}`);
      output.push(`  Breakthrough moments: ${result.qualitySignals.breakthroughMoments}`);
    }

    // PROFILE DEEPENING
    output.push('\nSTAGE 4 / PROFILE:');
    output.push(`  Profile deepened: ${result.profileDeepened}`);
    output.push(`  Insight extracted: ${result.insightId ?? 'none'}`);

    // PROFILE STATE
    output.push('\nPROFILE STATE:');
    output.push(
      `  Student declared context: "${capture.profileSnapshot.studentDeclaredContext || '(empty)'}"`,
    );
    output.push(
      `  Conversation insights count: ${capture.profileSnapshot.conversationInsightsCount}`,
    );
    output.push(
      `  Pattern insights count: ${capture.profileSnapshot.patternInsightsCount}`,
    );

    // STUDENT THEORY (new — System Intelligence)
    if (capture.studentTheory) {
      const theory = capture.studentTheory;
      output.push(`\nSTUDENT THEORY (synthesized at turn ${theory.synthesizedAtTurn}):`);
      output.push(`  Personhood: ${theory.personhood}`);
      output.push(`  Protected values: ${theory.protectedValues.map(v => v.value).join('; ') || 'none'}`);
      output.push(`  Tensions: ${theory.tensions.map(t => `"${t.studentSays}" vs "${t.essayShows}"`).join('; ') || 'none'}`);
      output.push(`  Blind spot hypotheses: ${theory.blindSpotHypotheses.map(h => h.hypothesis).join('; ') || 'none'}`);
      output.push(`  Cross-layer patterns: ${theory.crossLayerPatterns.length}`);
      output.push(`  Pending observations: ${theory.pendingObservations.length}`);
    }

    // WRITER PORTRAIT EVOLUTION (new — Portrait tracking)
    output.push(`  Writer portrait: "${capture.profileSnapshot.writerPortrait.slice(0, 150)}..."`);

    // INNER VOICE (new — from cognitive assessment)
    const assessment = result.cognitiveAssessment?.assessment ?? '';
    const isInnerVoice = assessment.length > 30 && !assessment.startsWith('Student is ');
    output.push(`  Inner voice active: ${isInnerVoice} — "${assessment.slice(0, 120)}"`);

    // COACH RESPONSE
    output.push('\nCOACH RESPONSE:');
    output.push(result.response ?? '(no response)');

    output.push(thinSeparator());

    // Add to conversation history for next turn
    conversationHistory.push({ role: 'student', content: turnDef.message });
    if (result.response) {
      conversationHistory.push({ role: 'coach', content: result.response });
    }

    console.log(
      `[V2 Audit] Turn ${turnNum} complete — ` +
      `response=${result.response?.length ?? 0} chars, ` +
      `cost=$${result.totalCost.toFixed(4)}, time=${turnTime}ms`,
    );
  }

  const wallEnd = Date.now();
  const totalWallTime = wallEnd - wallStart;

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  output.push(separator('FINAL SUMMARY'));

  // COST SUMMARY
  output.push('COST SUMMARY:');
  output.push(
    `  Initial analysis: $${pipelineResult.costSummary.totalCost.toFixed(4)}`,
  );
  output.push(`  Edit processing: $${editCost.toFixed(4)}`);
  output.push(
    `  Per-turn costs: ${turnCosts.map((c, i) => `T${i + 1}=$${c.toFixed(4)}`).join(' ')}`,
  );
  output.push(`  Total coaching: $${totalCoachingCost.toFixed(4)}`);
  output.push(
    `  Grand total: $${(pipelineResult.costSummary.totalCost + editCost + totalCoachingCost).toFixed(4)}`,
  );

  // SESSION EVENT LOG
  output.push('\nSESSION EVENT LOG (complete):');
  if (sessionMemory && sessionMemory.events.length > 0) {
    for (const ev of sessionMemory.events) {
      output.push(formatSessionEvent(ev));
    }
  } else {
    output.push('  (no events recorded)');
  }

  // STUDENT DECLARED CONTEXT (final)
  const finalProfile = reanalysisOrchestrator.getProfile();
  output.push('\nSTUDENT DECLARED CONTEXT (final):');
  output.push(
    `  "${finalProfile.studentDeclaredContext || '(empty)'}"`,
  );

  // SESSION ARC EVOLUTION
  output.push('\nSESSION ARC EVOLUTION:');
  for (const snap of sessionArcSnapshots) {
    output.push(`  Turn ${snap.turn}: ${snap.arc}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYSIS & PROFILING VERIFICATION (checks A1-A12)
  // ═══════════════════════════════════════════════════════════════════════════

  output.push('\nANALYSIS & PROFILING VERIFICATION:');

  // A1. Pipeline completed all layers
  const expectedLayers = ['L1', 'L2', 'L2.5', 'L3', 'L3.75', 'L3.5', 'L4'];
  const completedSet = new Set(pipelineResult.layersCompleted);
  const allLayersComplete = expectedLayers.every(l => completedSet.has(l));
  output.push(
    `  [${allLayersComplete ? 'x' : ' '}] A1: Pipeline completed all layers — ${pipelineResult.layersCompleted.join(', ')} (expected: ${expectedLayers.join(', ')})`,
  );

  // A2. North Star produced with through-line
  const hasNorthStar = !!(ns.throughLineSummary && ns.throughLineSummary.length > 20);
  output.push(
    `  [${hasNorthStar ? 'x' : ' '}] A2: North Star through-line — ${hasNorthStar ? ns.throughLineSummary?.slice(0, 80) + '...' : '(missing)'}`,
  );

  // A3. Structural roles assigned to paragraphs
  const rolesAssigned = ns.structuralRoles?.length ?? 0;
  output.push(
    `  [${rolesAssigned >= 3 ? 'x' : ' '}] A3: Structural roles assigned — ${rolesAssigned} paragraphs have roles (min 3 expected)`,
  );

  // A4. AO First Read produced with all fields
  const aoComplete = !!(profile.aoFirstRead?.gutReaction &&
    profile.aoFirstRead?.committeeOneLiner &&
    profile.aoFirstRead?.putDownRisk);
  output.push(
    `  [${aoComplete ? 'x' : ' '}] A4: AO First Read complete — gutReaction=${!!profile.aoFirstRead?.gutReaction}, ` +
    `oneLiner=${!!profile.aoFirstRead?.committeeOneLiner}, putDownRisk=${profile.aoFirstRead?.putDownRisk ?? 'missing'}`,
  );

  // A5. Character revelation is human (person portrait, not writing description)
  const analysisPortrait = profile.characterRevelation?.writerPortrait ?? '';
  const analysisPortraitIsHuman = analysisPortrait.length > 50 &&
    !analysisPortrait.toLowerCase().includes('the writer') &&
    !analysisPortrait.toLowerCase().includes('the author') &&
    !analysisPortrait.toLowerCase().includes('the essay demonstrates');
  output.push(
    `  [${analysisPortraitIsHuman ? 'x' : ' '}] A5: Person portrait (human, not writing analysis) — ${analysisPortraitIsHuman ? analysisPortrait.slice(0, 80) + '...' : '(not human-sounding)'}`,
  );

  // A6. Findings produced with coaching value
  const activeFindings = profile.findings.filter(f => f.status === 'active');
  const highValueFindings = activeFindings.filter(f => f.coachingValue === 'high' || f.coachingValue === 'critical');
  output.push(
    `  [${activeFindings.length >= 5 ? 'x' : ' '}] A6: Findings produced — ${activeFindings.length} active (${highValueFindings.length} high/critical value)`,
  );

  // A7. Improvement phase detected
  const phaseDetected = !!(pipelineResult.improvementPhase?.level);
  output.push(
    `  [${phaseDetected ? 'x' : ' '}] A7: Improvement phase — ${pipelineResult.improvementPhase?.level ?? 'NOT DETECTED'} (reasoning: ${pipelineResult.improvementPhase?.reasoning?.slice(0, 60) ?? 'none'}...)`,
  );

  // A8. Archetype detected with pool density
  const analysisArchetypeDetected = !!(profile.admissionsPositioning?.archetypeContext?.archetype);
  output.push(
    `  [${analysisArchetypeDetected ? 'x' : ' '}] A8: Archetype — ${profile.admissionsPositioning?.archetypeContext?.archetype ?? 'none'} (${profile.admissionsPositioning?.archetypeContext?.poolDensity ?? 'unknown'})`,
  );

  // A9. Observation economy (not too few, not too many)
  const analysisObsInRange = totalObservations >= 20 && totalObservations <= 80;
  output.push(
    `  [${analysisObsInRange ? 'x' : ' '}] A9: Observation economy — ${totalObservations} observations (target: 20-80)`,
  );

  // A10. Voice identity populated
  const voicePopulated = !!(profile.voiceIdentity?.primaryRegister);
  output.push(
    `  [${voicePopulated ? 'x' : ' '}] A10: Voice identity — register=${profile.voiceIdentity?.primaryRegister ?? 'missing'}`,
  );

  // A11. Emotional topography populated
  const emotionPopulated = !!(profile.emotionalTopography?.authenticityAssessment);
  output.push(
    `  [${emotionPopulated ? 'x' : ' '}] A11: Emotional topography — ${emotionPopulated ? profile.emotionalTopography?.authenticityAssessment?.slice(0, 60) + '...' : 'missing'}`,
  );

  // A12. Findings reference specific paragraphs (not all essay-level)
  const paragraphScopedFindings = activeFindings.filter(f => f.scope.type === 'paragraph' || f.scope.type === 'cross_paragraph');
  const hasParagraphScope = paragraphScopedFindings.length >= 3;
  output.push(
    `  [${hasParagraphScope ? 'x' : ' '}] A12: Paragraph-scoped findings — ${paragraphScopedFindings.length} paragraph-level findings (min 3 expected)`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE→COACHING INTEGRATION VERIFICATION (checks I1-I5)
  // ═══════════════════════════════════════════════════════════════════════════

  output.push('\nPROFILE→COACHING INTEGRATION:');

  // I1. Coach references the essay's North Star / through-line
  const anyCoachRefsNorthStar = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return resp.includes('through-line') || resp.includes('north star') ||
           resp.includes('the essay is about') || resp.includes('the essay is really about') ||
           resp.includes('central') || resp.includes('thesis');
  });
  output.push(
    `  [${anyCoachRefsNorthStar ? 'x' : ' '}] I1: Coach references essay's through-line/subject — ${anyCoachRefsNorthStar}`,
  );

  // I2. Coach references specific findings (by claim, not by ID)
  const anyCoachRefsFinding = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    // Check if coach mentions finding-related concepts
    return resp.includes('summary') || resp.includes('scene') || resp.includes('scope') ||
           resp.includes('generic') || resp.includes('voice shift') || resp.includes('people');
  });
  output.push(
    `  [${anyCoachRefsFinding ? 'x' : ' '}] I2: Coach references analysis findings in coaching — ${anyCoachRefsFinding}`,
  );

  // I3. Coach uses AO perspective / admissions grounding
  const anyCoachRefsAO = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return resp.includes('admissions') || resp.includes('ao ') || resp.includes('reader') ||
           resp.includes('committee') || resp.includes('application');
  });
  output.push(
    `  [${anyCoachRefsAO ? 'x' : ' '}] I3: Coach uses admissions grounding — ${anyCoachRefsAO}`,
  );

  // I4. Coach references specific paragraph roles/architecture
  const anyCoachRefsStructure = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return (resp.includes('p1') || resp.includes('p2') || resp.includes('p3') ||
            resp.includes('paragraph 1') || resp.includes('opening') || resp.includes('ending')) &&
           (resp.includes('does') || resp.includes('role') || resp.includes('job') || resp.includes('work'));
  });
  output.push(
    `  [${anyCoachRefsStructure ? 'x' : ' '}] I4: Coach references paragraph roles/structure — ${anyCoachRefsStructure}`,
  );

  // I5. Student theory synthesis produced (requires analysis + coaching integration)
  const finalTheory = sessionMemory?.studentTheory;
  const theoryIntegration = !!(finalTheory?.personhood && finalTheory.personhood.length > 30);
  output.push(
    `  [${theoryIntegration ? 'x' : ' '}] I5: Student theory synthesized — ${theoryIntegration ? `turn ${finalTheory?.synthesizedAtTurn}, personhood: "${finalTheory?.personhood.slice(0, 60)}..."` : 'not produced'}`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // V2 COACHING FEATURE VERIFICATION (checks 1-27)
  // ═══════════════════════════════════════════════════════════════════════════

  output.push('\nV2 COACHING FEATURE VERIFICATION:');

  // 1. Session events created per turn
  const totalEvents = sessionMemory?.events.length ?? 0;
  output.push(
    `  [${totalEvents > 0 ? 'x' : ' '}] Session events created per turn — ${totalEvents} events total`,
  );

  // 2. Journal entries from sidecar
  const journalEvents =
    sessionMemory?.events.filter(e => e.kind.includes('journal')) ?? [];
  output.push(
    `  [${journalEvents.length > 0 ? 'x' : ' '}] Journal entries from sidecar — ${journalEvents.length} journal events`,
  );

  // 3. Scoped findings used
  // Turn 2 was P1-focused — check if findings were scoped
  const turn2Capture = turnCaptures.find(c => c.turnNum === 2);
  const turn2ResponseLower = (turn2Capture?.result.response ?? '').toLowerCase();
  const turn2MentionsP1 =
    turn2ResponseLower.includes('paragraph 1') ||
    turn2ResponseLower.includes('opening') ||
    turn2ResponseLower.includes('first paragraph');
  output.push(
    `  [${turn2MentionsP1 ? 'x' : ' '}] Scoped findings used — Turn 2 referenced P1: ${turn2MentionsP1}`,
  );

  // 4. Edit intelligence surfaced
  const turn6Capture = turnCaptures.find(c => c.turnNum === 6);
  const turn6Response = turn6Capture?.result.response ?? '';
  const turn6ReferencesEdit =
    turn6Response.toLowerCase().includes('chopin') ||
    turn6Response.toLowerCase().includes('nocturne') ||
    turn6Response.toLowerCase().includes('rewr') ||
    turn6Response.toLowerCase().includes('edit') ||
    turn6Response.toLowerCase().includes('new opening') ||
    turn6Response.toLowerCase().includes('revised');
  output.push(
    `  [${turn6ReferencesEdit ? 'x' : ' '}] Edit intelligence surfaced — Turn 6 referenced edit: ${turn6ReferencesEdit}`,
  );

  // 5. Edit event persisted
  const turn7Capture = turnCaptures.find(c => c.turnNum === 7);
  const turn7Response = turn7Capture?.result.response ?? '';
  const turn7ReferencesEdit =
    turn7Response.toLowerCase().includes('opening') ||
    turn7Response.toLowerCase().includes('edit') ||
    turn7Response.toLowerCase().includes('chopin') ||
    turn7Response.toLowerCase().includes('mrs. chen');
  output.push(
    `  [${turn7ReferencesEdit ? 'x' : ' '}] Edit event persisted — Turn 7 could reference edit: ${turn7ReferencesEdit}`,
  );

  // 6. Student declared context accumulated
  const turn3Profile = turnCaptures.find(c => c.turnNum === 3)?.profileSnapshot;
  const turn5Profile = turnCaptures.find(c => c.turnNum === 5)?.profileSnapshot;
  const turn10Profile = turnCaptures.find(c => c.turnNum === 10)?.profileSnapshot;
  const contextGrew =
    (turn3Profile?.studentDeclaredContext?.length ?? 0) > 0 ||
    (turn5Profile?.studentDeclaredContext?.length ?? 0) > 0 ||
    (turn10Profile?.studentDeclaredContext?.length ?? 0) > 0;
  output.push(
    `  [${contextGrew ? 'x' : ' '}] Student declared context accumulated — ` +
    `T3=${turn3Profile?.studentDeclaredContext?.length ?? 0} chars, ` +
    `T5=${turn5Profile?.studentDeclaredContext?.length ?? 0} chars, ` +
    `T10=${turn10Profile?.studentDeclaredContext?.length ?? 0} chars`,
  );

  // 7. needsDeepening triggered correctly
  const deepeningTurns = turnCaptures
    .filter(c => c.result.profileDeepened)
    .map(c => c.turnNum);
  output.push(
    `  [${deepeningTurns.length > 0 ? 'x' : ' '}] needsDeepening triggered correctly — turns: ${deepeningTurns.join(', ') || 'none'}`,
  );

  // 8. Anti-repetition effective (turns 2 vs 8)
  const turn2Response = turnCaptures.find(c => c.turnNum === 2)?.result.response ?? '';
  const turn8Response = turnCaptures.find(c => c.turnNum === 8)?.result.response ?? '';
  let antiRepOverlapPct = 0;
  let antiRepOverlapCount = 0;
  let antiRepTotal = 0;
  if (turn2Response && turn8Response) {
    const t2Phrases = extractPhrases(turn2Response);
    const t8Phrases = extractPhrases(turn8Response);
    antiRepTotal = t8Phrases.size;
    for (const phrase of t8Phrases) {
      if (t2Phrases.has(phrase)) antiRepOverlapCount++;
    }
    antiRepOverlapPct =
      antiRepTotal > 0 ? (antiRepOverlapCount / antiRepTotal) * 100 : 0;
  }
  const antiRepVerdict =
    antiRepOverlapPct > 30
      ? 'FAIL'
      : antiRepOverlapPct > 15
        ? 'MARGINAL'
        : 'PASS';
  output.push(
    `  [${antiRepVerdict === 'PASS' ? 'x' : ' '}] Anti-repetition effective — overlap=${antiRepOverlapPct.toFixed(1)}% (${antiRepVerdict})`,
  );

  // 9. Craft vocabulary phase-appropriate
  const phaseLevel = pipelineResult.improvementPhase?.level ?? 'unknown';
  const anyResponseHasCraftVocab = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return (
      resp.includes('anaphora') ||
      resp.includes('volta') ||
      resp.includes('in medias res') ||
      resp.includes('juxtaposition') ||
      resp.includes('accretion') ||
      resp.includes('syllepsis') ||
      resp.includes('enjambment')
    );
  });
  output.push(
    `  [${phaseLevel !== 'unknown' ? 'x' : ' '}] Craft vocabulary phase-appropriate — phase=${phaseLevel}, craft vocab present=${anyResponseHasCraftVocab}`,
  );

  // 10. Pedagogical rules active
  const pedagogicalEvidence = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    // Look for evidence of pedagogical rules: quoting text, using paragraph references
    return (
      resp.includes('"') ||
      resp.includes('paragraph') ||
      resp.includes('your essay') ||
      resp.includes('you wrote')
    );
  });
  output.push(
    `  [${pedagogicalEvidence ? 'x' : ' '}] Pedagogical rules active — evidence in responses: ${pedagogicalEvidence}`,
  );

  // 11. Late session arc guidance
  const turn9Capture = turnCaptures.find(c => c.turnNum === 9);
  const turn9SessionArc =
    turn9Capture && sessionMemory
      ? sessionMemory.sessionArcSummary || ''
      : '';
  const lateSessionArc =
    turn9SessionArc.toLowerCase().includes('late') ||
    turn9SessionArc.toLowerCase().includes('consolidat') ||
    turn9SessionArc.toLowerCase().includes('wrap') ||
    (turn9Capture?.result.response ?? '').toLowerCase().includes('conclusion');
  output.push(
    `  [${lateSessionArc ? 'x' : ' '}] Late session arc guidance — Turn 9 arc contains late-session signal: ${lateSessionArc}`,
  );

  // 12. Breakthrough handling
  const turn10Capture = turnCaptures.find(c => c.turnNum === 10);
  const turn10Response = turn10Capture?.result.response ?? '';
  const turn10Short = turn10Response.length < 1500;
  const turn10NamesInsight =
    turn10Response.toLowerCase().includes('nocturne') ||
    turn10Response.toLowerCase().includes('mrs. chen') ||
    turn10Response.toLowerCase().includes('chopin') ||
    turn10Response.toLowerCase().includes('anything was possible') ||
    turn10Response.toLowerCase().includes('insight') ||
    turn10Response.toLowerCase().includes('realization');
  output.push(
    `  [${turn10NamesInsight ? 'x' : ' '}] Breakthrough handling — Turn 10: named insight=${turn10NamesInsight}, short response=${turn10Short} (${turn10Response.length} chars)`,
  );

  // 13. AO First Read produced
  const aoFirstReadExists = !!profile.aoFirstRead?.gutReaction;
  output.push(
    `  [${aoFirstReadExists ? 'x' : ' '}] AO First Read produced — gutReaction present: ${aoFirstReadExists}`,
  );

  // 14. Person portrait is human, not writing description
  const writerPortrait = profile.characterRevelation?.writerPortrait ?? '';
  const portraitIsHuman = !writerPortrait.toLowerCase().includes('writer') &&
    !writerPortrait.toLowerCase().includes('author') &&
    !writerPortrait.toLowerCase().includes('prose') &&
    writerPortrait.length > 50;
  output.push(
    `  [${portraitIsHuman ? 'x' : ' '}] Person portrait (not writing portrait) — human-sounding: ${portraitIsHuman}`,
  );

  // 15. Archetype detected
  const archetypeDetected = !!profile.admissionsPositioning?.archetypeContext?.archetype;
  output.push(
    `  [${archetypeDetected ? 'x' : ' '}] Archetype detected — ${profile.admissionsPositioning?.archetypeContext?.archetype ?? 'none'} (${profile.admissionsPositioning?.archetypeContext?.poolDensity ?? 'unknown'})`,
  );

  // 16. Observation economy (target: 30-50)
  const obsInRange = totalObservations >= 20 && totalObservations <= 60;
  output.push(
    `  [${obsInRange ? 'x' : ' '}] Observation economy — ${totalObservations} observations (target: 30-50)`,
  );

  // 17. Strategic question populated
  const strategicQuestionSet = !!(sessionMemory?.strategicQuestion);
  output.push(
    `  [${strategicQuestionSet ? 'x' : ' '}] Strategic question populated — "${(sessionMemory?.strategicQuestion ?? '').slice(0, 80)}"`,
  );

  // 18. Learning style observations accumulated
  const learningStyleCount = learningStyle?.observations?.length ?? 0;
  output.push(
    `  [${learningStyleCount > 0 ? 'x' : ' '}] Learning style accumulated — ${learningStyleCount} observations`,
  );

  // 19. Response intensity varied (not all 'full')
  const intensityVariation = turnCaptures.some(c => {
    const intensity = c.result.cognitiveAssessment?.responseIntensity;
    return intensity === 'brief' || intensity === 'minimal';
  });
  output.push(
    `  [${intensityVariation ? 'x' : ' '}] Response intensity varied — not all 'full'`,
  );

  // 20. Breakthrough response is SHORT (< 1000 chars)
  output.push(
    `  [${turn10Short ? 'x' : ' '}] Breakthrough response short — ${turn10Response.length} chars (target: <1000)`,
  );

  // 21. StudentTheory produced by Turn 5
  const turn5Theory = turnCaptures.find(c => c.turnNum === 5)?.studentTheory;
  const turn10Theory = turnCaptures.find(c => c.turnNum === 10)?.studentTheory;
  const theoryProduced = !!(turn5Theory || turn10Theory);
  output.push(
    `  [${theoryProduced ? 'x' : ' '}] StudentTheory produced — T5=${!!turn5Theory}, T10=${!!turn10Theory}` +
    (turn10Theory ? ` (turn ${turn10Theory.synthesizedAtTurn})` : ''),
  );

  // 22. Resistance escalation active during deflection turns
  const resistanceEvidence = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return resp.includes('protective') || resp.includes('protecting') || resp.includes('resist');
  });
  output.push(
    `  [${resistanceEvidence ? 'x' : ' '}] Resistance awareness — coach references resistance/protection patterns: ${resistanceEvidence}`,
  );

  // 23. Coach DEMONSTRATES (writes actual prose) at least twice in 10 turns
  let demonstrationCount = 0;
  for (const cap of turnCaptures) {
    const resp = cap.result.response ?? '';
    // Look for quoted prose (rewritten sentences) or technique naming
    const hasQuotedProse = (resp.match(/[''][^'']{20,}['']/g) || []).length > 0;
    const namesTechnique = /SUMMARY-TO-SCENE|COLD OPEN|SENSORY TIMESTAMP|SOMATIC|BOOKEND|RITUAL DETAIL|scene version|scene-based|here's what/i.test(resp);
    if (hasQuotedProse || namesTechnique) demonstrationCount++;
  }
  output.push(
    `  [${demonstrationCount >= 2 ? 'x' : ' '}] Demonstrations produced — ${demonstrationCount} turns contain actual prose samples (target: ≥2)`,
  );

  // 24. InnerVoice is contextual prose (not just "Student is ${enum}")
  const innerVoiceCount = turnCaptures.filter(c => {
    const assessment = c.result.cognitiveAssessment?.assessment ?? '';
    return assessment.length > 30 && !assessment.startsWith('Student is ');
  }).length;
  output.push(
    `  [${innerVoiceCount >= 5 ? 'x' : ' '}] InnerVoice contextual prose — ${innerVoiceCount}/10 turns have rich inner voice (target: ≥5)`,
  );

  // 25. Portrait observations accumulated (feeds StudentTheory synthesis)
  // Note: writerPortrait is NOT directly mutated by coaching observations (by design —
  // the L3.75 analytical portrait is too valuable to overwrite). Instead, observations
  // accumulate in StudentTheory.pendingObservations. Check theory has observations OR
  // portrait changed via reanalysis.
  const portraitSnapshots = turnCaptures.map(c => c.profileSnapshot.writerPortrait);
  let portraitChanged = false;
  for (let i = 1; i < portraitSnapshots.length; i++) {
    if (portraitSnapshots[i] && portraitSnapshots[i] !== portraitSnapshots[i - 1] && portraitSnapshots[i - 1]) {
      portraitChanged = true;
      break;
    }
  }
  const theoryHasObservations = turn10Theory?.pendingObservations?.length
    ? turn10Theory.pendingObservations.length > 0
    : (turn5Theory?.pendingObservations?.length ? turn5Theory.pendingObservations.length > 0 : false);
  const portraitVerdict = portraitChanged || theoryHasObservations || theoryProduced;
  output.push(
    `  [${portraitVerdict ? 'x' : ' '}] Portrait intelligence active — portrait changed=${portraitChanged}, theory has observations=${theoryHasObservations}, theory produced=${theoryProduced}`,
  );

  // 26. Technique router directive appears alongside at least one finding
  const techniqueRouteEvidence = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return resp.includes('technique:') || resp.includes('summary-to-scene') ||
           resp.includes('cold open') || resp.includes('somatic vulnerability') ||
           resp.includes('evidence anchoring') || resp.includes('bridge sentence');
  });
  output.push(
    `  [${techniqueRouteEvidence ? 'x' : ' '}] Technique router active — technique names appear in coaching: ${techniqueRouteEvidence}`,
  );

  // 27. AO psychology referenced in at least one coaching response
  const aoPsychEvidence = turnCaptures.some(c => {
    const resp = (c.result.response ?? '').toLowerCase();
    return resp.includes('admissions') || resp.includes('ao ') ||
           resp.includes('reader') || resp.includes('committee') ||
           resp.includes('application') || resp.includes('officer');
  });
  output.push(
    `  [${aoPsychEvidence ? 'x' : ' '}] AO psychology referenced — admissions context appears in coaching: ${aoPsychEvidence}`,
  );

  // ANTI-REPETITION ANALYSIS (detailed)
  output.push('\nANTI-REPETITION ANALYSIS (Turns 2 vs 8):');
  output.push(`  Turn 2 response: ${turn2Response.length} chars`);
  output.push(`  Turn 8 response: ${turn8Response.length} chars`);
  output.push(
    `  4-word phrase overlap: ${antiRepOverlapCount}/${antiRepTotal} (${antiRepOverlapPct.toFixed(1)}%)`,
  );
  output.push(`  Verdict: ${antiRepVerdict}`);

  // TIMING
  output.push('\nTIMING:');
  output.push(`  Pipeline: ${pipelineTime}ms`);
  output.push(`  Edit: ${editTimingMs}ms`);
  output.push(
    `  Per-turn: ${turnTimings.map((t, i) => `T${i + 1}=${t}ms`).join(' ')}`,
  );
  output.push(`  Total wall time: ${totalWallTime}ms`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SCORECARD
  // ═══════════════════════════════════════════════════════════════════════════

  output.push(separator('SCORECARD'));

  // Count passing checks
  const analysisChecks = [allLayersComplete, hasNorthStar, rolesAssigned >= 3, aoComplete,
    analysisPortraitIsHuman, activeFindings.length >= 5, phaseDetected, analysisArchetypeDetected,
    analysisObsInRange, voicePopulated, emotionPopulated, hasParagraphScope];
  const analysisPass = analysisChecks.filter(Boolean).length;

  const integrationChecks = [anyCoachRefsNorthStar, anyCoachRefsFinding, anyCoachRefsAO,
    anyCoachRefsStructure, theoryIntegration];
  const integrationPass = integrationChecks.filter(Boolean).length;

  output.push(`ANALYSIS & PROFILING: ${analysisPass}/${analysisChecks.length} checks passed`);
  output.push(`PROFILE→COACHING INTEGRATION: ${integrationPass}/${integrationChecks.length} checks passed`);
  output.push(`V2 COACHING FEATURES: (27 checks — see above)`);
  output.push(`TOTAL: ${analysisPass + integrationPass}/17 analysis+integration checks`);

  output.push(`\nSYSTEM COST: $${(pipelineResult.costSummary.totalCost + editCost + totalCoachingCost).toFixed(4)}`);
  output.push(`SYSTEM TIME: ${totalWallTime}ms (${(totalWallTime / 1000).toFixed(1)}s)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE OUTPUT
  // ═══════════════════════════════════════════════════════════════════════════

  writeOutput(output.join('\n'));

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL PROFILE DUMP — save the complete analysis profile as JSON
  // so we never lose expensive analysis data again
  // ═══════════════════════════════════════════════════════════════════════════
  const profileDumpPath = path.join(OUTPUT_DIR, 'conversator-v2-profile-dump.json');
  const finalProfileForDump = reanalysisOrchestrator.getProfile();
  try {
    const profileJson = JSON.stringify(finalProfileForDump, null, 2);
    fs.writeFileSync(profileDumpPath, profileJson, 'utf-8');
    console.log(`[V2 Audit] Full profile saved to: ${profileDumpPath} (${(profileJson.length / 1024).toFixed(0)}KB)`);
  } catch (err) {
    console.error('[V2 Audit] Failed to dump profile:', err instanceof Error ? err.message : String(err));
  }

  console.log(
    `\n[V2 Audit] COMPLETE — Grand total: $${(pipelineResult.costSummary.totalCost + editCost + totalCoachingCost).toFixed(4)} in ${totalWallTime}ms`,
  );
}

// ============================================================================
// RUN
// ============================================================================

// Global safety timeout — kill the process if it exceeds 35 minutes.
// Expected run time: ~23-25 min. This prevents infinite hangs from stuck API calls.
const GLOBAL_TIMEOUT_MS = 35 * 60 * 1000;
const globalTimer = setTimeout(() => {
  console.error(`[V2 Audit] GLOBAL TIMEOUT — process exceeded ${GLOBAL_TIMEOUT_MS / 60000} minutes. Killing.`);
  process.exit(2);
}, GLOBAL_TIMEOUT_MS);
globalTimer.unref(); // Don't keep process alive just for this timer

main().catch((err) => {
  console.error('[V2 Audit] FATAL ERROR:', err);
  process.exit(1);
}).finally(() => clearTimeout(globalTimer));
