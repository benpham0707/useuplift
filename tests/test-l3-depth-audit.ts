/**
 * L3 Depth Audit — Does the Sequential Deep Walk Produce Architectural Understanding?
 *
 * Phase 1: Run L1 (sentence splitting) + L3 (deep walk) on the piano essay.
 *          Capture full output, write to files, classify observations by depth.
 *
 * Phase 4: Optionally run L2 (structural cartography) + L2.5 (scout) to test
 *          whether richer upstream context improves L3 depth.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l3-depth-audit.ts
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l3-depth-audit.ts --with-l2
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root (has API keys)
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import * as fs from 'fs';
import { firstImpressionsService } from '../src/services/essayIntelligence/analysis/firstImpressions';
import { structuralCartographerService } from '../src/services/essayIntelligence/analysis/structuralCartographer';
import { scoutPassService } from '../src/services/essayIntelligence/analysis/scoutPass';
import { sequentialDeepWalkService } from '../src/services/essayIntelligence/analysis/sequentialDeepWalk';
import { EssayProfileCoordinator } from '../src/services/essayIntelligence/profileManager/essayProfileManager';
import { InMemoryCheckpointStore } from '../src/services/essayIntelligence/profileManager/checkpointStore';
import type { EssayProfile, EssayType } from '../src/services/essayIntelligence/profileTypes';
import type { StructuralCartography } from '../src/services/essayIntelligence/types';
import type { ConnectionScoutOutput } from '../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, 'fixtures', 'piano-essay.txt');
const OUTPUT_DIR = path.join(__dirname, 'output');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'l3-depth-audit-output.json');
const SUMMARY_OUTPUT = path.join(OUTPUT_DIR, 'l3-depth-audit-summary.txt');

const WITH_L2 = process.argv.includes('--with-l2');

// ============================================================================
// HELPERS
// ============================================================================

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z"'"])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  if (sentences.length === 0 && text.trim().length > 0) {
    return [text.trim()];
  }
  return sentences;
}

// ============================================================================
// DEPTH CLASSIFICATION
// ============================================================================

/**
 * Classify an observation's depth level based on its language and content.
 *
 * SURFACE: Just notices a feature exists. Keywords: "uses", "contains", "has",
 *          "includes", "is a", "appears" without deeper analysis.
 *
 * STRUCTURAL: Identifies technique + what it achieves locally.
 *             Keywords: "creates", "establishes", "grounds", "signals",
 *             "positions", "constructs" + reference to local effect.
 *
 * ARCHITECTURAL: Reveals what the technique tells us about HOW the essay
 *                makes meaning. Cross-paragraph awareness, epistemology,
 *                meaning-making strategy, identity construction.
 *                Keywords: "reveals", "epistemology", "meaning-making",
 *                "architecture", "central tension", cross-paragraph refs,
 *                "the narrator's relationship to...", "the essay's argument..."
 */
type DepthLevel = 'SURFACE' | 'STRUCTURAL' | 'ARCHITECTURAL';

interface ClassifiedObservation {
  paragraphIndex: number;
  sentenceIndex: number;
  field: string; // observedFunctions, inferredIntents, narrativeContributions
  observation: string;
  evidence: string;
  confidence: number;
  depth: DepthLevel;
  reasoning: string;
}

function classifyDepth(observation: string, evidence: string): { depth: DepthLevel; reasoning: string } {
  const text = (observation + ' ' + evidence).toLowerCase();

  // ARCHITECTURAL indicators: cross-paragraph meaning, epistemology, essay-level argument,
  // meaning-making strategy identification
  const architecturalPatterns = [
    /essay['']?s?\s+(central|core|fundamental|underlying)\s+(tension|argument|question|claim|epistemology|definition|logic|strategy)/,
    /meaning[- ]making\s+(strategy|system|approach|framework)/,
    /epistemolog/,
    /the\s+narrator['']?s?\s+relationship\s+to/,
    /reveals?\s+(that|how|what)\s+(the\s+)?(essay|narrator|writer|this)/,
    /central\s+(tension|argument|claim)/,
    /architecture\s+of\s+meaning/,
    /identity\s+construction/,
    /this\s+(frames?|establishes?|positions?)\s+the\s+(entire|whole|essay)/,
    /when\s+p\d/i, // cross-paragraph reference
    /p\d.*p\d/i,   // references to multiple paragraphs
    /the\s+same\s+(epistemology|framework|pattern|logic|move|relationship)/,
    /transforms?\s+the\s+meaning/,
    /recontextualize/,
    /the\s+essay\s+(argues?|claims?|builds?|constructs?|believes?|defines?)\s/,
    /vocabulary\s+domain\s+(shift|transformation|change)/,
    // meaning-making strategy + definition patterns
    /this\s+is\s+(the\s+essay['']?s?|why|how|what)\s/,
    /isn['']t\s+just\s+.{5,}(it['']?s?|this\s+is|but\s+rather)/,
    /the\s+essay['']?s?\s+(definition|argument|claim|epistemology|logic|strategy)/,
    /maker[- ]epistemology/,
    /understanding\s+comes?\s+through/,
    /is\s+why\s+the\s/,
    /every\s+subsequent\s+paragraph/,
    /dual[- ]movement/,
    /the\s+(same|identical)\s+.{0,20}(applied|transferred|extended)\s+to/,
    /creative\s+practice/,
    /the\s+essay['']?s?\s+relationship\s+to/,
  ];

  // STRUCTURAL indicators: technique + local effect
  const structuralPatterns = [
    /creates?\s+(a sense|an? |the )?(sense|feeling|atmosphere|immediacy|contrast|tension|distance|intimacy)/,
    /establishes?\s+(a |the )?(tone|mood|register|frame|context|world|setting)/,
    /grounds?\s+(the\s+reader|us|the\s+audience|the\s+scene|the\s+moment)/,
    /signals?\s+(a |the )?(shift|change|transition|move|turn)/,
    /positions?\s+(the\s+narrator|the\s+writer|the\s+reader|the\s+audience)/,
    /constructs?\s+(a |the )?(world|frame|space|narrative|scene)/,
    /activates?\s+(the |a )?(register|domain|field|schema)/,
    /imports?\s+(vocabulary|language|register|diction)\s+from/,
    /functions?\s+as\s+(a |the )?(bridge|transition|anchor|frame|pivot|fulcrum)/,
    /mirrors?\s+(the|a|an)/,
    /echoes?\s+(the|a|an)/,
    /parallels?\s+(the|a|an)/,
    /sets?\s+up\s+(the|a|an)/,
  ];

  // Check architectural first (highest depth)
  for (const pattern of architecturalPatterns) {
    if (pattern.test(text)) {
      return { depth: 'ARCHITECTURAL', reasoning: `Matches architectural pattern: ${pattern.source.substring(0, 40)}` };
    }
  }

  // Check structural
  for (const pattern of structuralPatterns) {
    if (pattern.test(text)) {
      return { depth: 'STRUCTURAL', reasoning: `Matches structural pattern: ${pattern.source.substring(0, 40)}` };
    }
  }

  // Length and complexity heuristic: very short observations tend to be surface
  if (observation.length < 60) {
    return { depth: 'SURFACE', reasoning: 'Short observation without structural/architectural markers' };
  }

  // If it has evidence and is medium-length, likely structural
  if (evidence.length > 0 && observation.length > 80) {
    return { depth: 'STRUCTURAL', reasoning: 'Medium-length observation with evidence but no architectural markers' };
  }

  return { depth: 'SURFACE', reasoning: 'No structural or architectural markers detected' };
}

// ============================================================================
// SUMMARY BUILDER
// ============================================================================

function buildSummary(
  classified: ClassifiedObservation[],
  walkOutputs: Array<Record<string, unknown>>,
  costs: { l1: number; l2?: number; l25?: number; l3: number },
  timings: { l1: number; l2?: number; l25?: number; l3: number },
): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('L3 DEPTH AUDIT — OBSERVATION CLASSIFICATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Distribution
  const total = classified.length;
  const surface = classified.filter(c => c.depth === 'SURFACE').length;
  const structural = classified.filter(c => c.depth === 'STRUCTURAL').length;
  const architectural = classified.filter(c => c.depth === 'ARCHITECTURAL').length;

  lines.push('DEPTH DISTRIBUTION:');
  lines.push(`  SURFACE:       ${surface}/${total} (${(surface / total * 100).toFixed(1)}%)`);
  lines.push(`  STRUCTURAL:    ${structural}/${total} (${(structural / total * 100).toFixed(1)}%)`);
  lines.push(`  ARCHITECTURAL: ${architectural}/${total} (${(architectural / total * 100).toFixed(1)}%)`);
  lines.push('');

  // Cost summary
  const totalCost = costs.l1 + (costs.l2 ?? 0) + (costs.l25 ?? 0) + costs.l3;
  lines.push('COST & TIMING:');
  lines.push(`  L1: $${costs.l1.toFixed(4)} (${timings.l1}ms)`);
  if (costs.l2 !== undefined) lines.push(`  L2: $${costs.l2.toFixed(4)} (${timings.l2}ms)`);
  if (costs.l25 !== undefined) lines.push(`  L2.5: $${costs.l25.toFixed(4)} (${timings.l25}ms)`);
  lines.push(`  L3: $${costs.l3.toFixed(4)} (${timings.l3}ms)`);
  lines.push(`  TOTAL: $${totalCost.toFixed(4)}`);
  lines.push('');

  // Per-paragraph breakdown
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('PER-PARAGRAPH BREAKDOWN');
  lines.push('═══════════════════════════════════════════════════════════════');

  const byParagraph = new Map<number, ClassifiedObservation[]>();
  for (const c of classified) {
    if (!byParagraph.has(c.paragraphIndex)) byParagraph.set(c.paragraphIndex, []);
    byParagraph.get(c.paragraphIndex)!.push(c);
  }

  for (const [pIdx, observations] of byParagraph) {
    const pSurface = observations.filter(o => o.depth === 'SURFACE').length;
    const pStructural = observations.filter(o => o.depth === 'STRUCTURAL').length;
    const pArchitectural = observations.filter(o => o.depth === 'ARCHITECTURAL').length;

    lines.push('');
    lines.push(`── PARAGRAPH ${pIdx + 1} ──`);
    lines.push(`   S: ${pSurface}  STR: ${pStructural}  ARCH: ${pArchitectural}  Total: ${observations.length}`);
    lines.push('');

    for (const obs of observations) {
      const depthTag = obs.depth === 'ARCHITECTURAL' ? '★★★ ARCH' :
        obs.depth === 'STRUCTURAL' ? '  ★★ STR' : '    ★ SUR';

      lines.push(`   [${depthTag}] P${obs.paragraphIndex + 1}S${obs.sentenceIndex + 1}.${obs.field}`);
      lines.push(`      "${obs.observation}"`);
      if (obs.evidence) {
        lines.push(`      Evidence: "${obs.evidence}"`);
      }
      lines.push(`      (${obs.reasoning})`);
      lines.push('');
    }
  }

  // Paragraph-level understanding (role, function, narrativeContribution)
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('PARAGRAPH-LEVEL UNDERSTANDING');
  lines.push('═══════════════════════════════════════════════════════════════');

  for (const walkOutput of walkOutputs) {
    const pIdx = walkOutput.paragraphIndex as number;
    const pu = walkOutput.paragraphUnderstanding as Record<string, unknown> | undefined;

    if (!pu) continue;

    lines.push('');
    lines.push(`── P${pIdx + 1} ──`);
    lines.push(`   Role: ${pu.role}`);
    lines.push(`   Function: ${pu.function}`);
    lines.push(`   Narrative contribution: ${pu.narrativeContribution}`);

    const er = pu.emotionalRegister as Record<string, unknown> | undefined;
    if (er) {
      lines.push(`   Emotional register: ${er.dominantEmotion}`);
      lines.push(`   Show vs Tell: ${er.showVsTell}`);
    }

    const cp = pu.craftProfile as Record<string, unknown> | undefined;
    if (cp) {
      lines.push(`   Rhythm: ${cp.rhythmPattern}`);
      lines.push(`   Image usage: ${cp.imageUsage}`);
    }
  }

  // Holistic evolution
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('HOLISTIC EVOLUTION (final state)');
  lines.push('═══════════════════════════════════════════════════════════════');

  const lastWalk = walkOutputs[walkOutputs.length - 1];
  if (lastWalk) {
    const he = lastWalk.holisticEvolution as Record<string, unknown> | undefined;
    if (he) {
      lines.push(`  Central thesis: ${he.centralThesis ?? '(none)'}`);
      lines.push(`  Thesis confidence: ${he.thesisConfidence ?? '(none)'}`);
      lines.push(`  Voice signature: ${he.voiceSignature ?? '(none)'}`);
      lines.push(`  Arc momentum: ${he.arcMomentum ?? '(none)'}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('L3 DEPTH AUDIT — Phase 1' + (WITH_L2 ? ' + Phase 4 (with L2/L2.5)' : ''));
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  ensureOutputDir();

  // Load essay
  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8');
  const paragraphs = splitIntoParagraphs(essayText);
  console.log(`Essay loaded: ${paragraphs.length} paragraphs, ${essayText.length} chars`);

  const costs: { l1: number; l2?: number; l25?: number; l3: number } = { l1: 0, l3: 0 };
  const timings: { l1: number; l2?: number; l25?: number; l3: number } = { l1: 0, l3: 0 };

  // ── L1: First Impressions ──
  console.log('\n── Running L1 (First Impressions) ──');
  const l1Result = await firstImpressionsService.analyze(essayText);
  costs.l1 = l1Result.cost;
  timings.l1 = l1Result.timingMs;
  console.log(`L1 complete: ${l1Result.impressions.length} paragraphs, cost=$${l1Result.cost.toFixed(4)}, time=${l1Result.timingMs}ms`);

  // Build sentence texts from L1 impressions
  const rawParagraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphTexts = l1Result.impressions.map((imp, idx) =>
    rawParagraphs[idx]?.trim() ?? imp.sentences.map(s => s.text).join(' '),
  );
  const sentenceTexts = l1Result.impressions.map(imp =>
    imp.sentences.map(s => s.text),
  );
  const wordCount = essayText.split(/\s+/).filter(Boolean).length;

  // Create coordinator with empty profile
  const checkpointStore = new InMemoryCheckpointStore();
  const coordinator = EssayProfileCoordinator.createNew({
    essayText,
    paragraphTexts,
    sentenceTexts,
    metadata: {
      essayType: 'common_app' as EssayType,
      wordCount,
    },
    checkpointStore,
  });

  coordinator.applyFirstImpressions(l1Result.impressions);

  // ── Optional: L2 + L2.5 ──
  let structuralMap: StructuralCartography | null = null;
  let scoutOutput: ConnectionScoutOutput | null = null;

  if (WITH_L2) {
    console.log('\n── Running L2 (Structural Cartography) + L2.5 (Connection Scout) in parallel ──');

    const [l2Result, l25Result] = await Promise.all([
      structuralCartographerService.analyze(essayText, l1Result.impressions),
      scoutPassService.analyze(essayText, l1Result.impressions),
    ]);

    structuralMap = l2Result.cartography;
    coordinator.applyStructuralCartography(structuralMap);
    costs.l2 = l2Result.cost;
    timings.l2 = l2Result.timingMs;
    console.log(`L2 complete: arc=${structuralMap.arcType}, cost=$${l2Result.cost.toFixed(4)}, time=${l2Result.timingMs}ms`);

    scoutOutput = l25Result.scoutOutput;
    coordinator.applyScoutLeads(scoutOutput);
    costs.l25 = l25Result.cost;
    timings.l25 = l25Result.timingMs;
    console.log(`L2.5 complete: ${scoutOutput.repeatedElements.length} repeated, ${scoutOutput.tonalShifts.length} shifts, cost=$${l25Result.cost.toFixed(4)}`);
  }

  // ── L3: Sequential Deep Walk ──
  console.log('\n── Running L3 (Sequential Deep Walk) ──');
  const profile = coordinator.getProfile();

  const l3Result = await sequentialDeepWalkService.walkEssay(
    essayText,
    profile as EssayProfile,
    // L3 uses optional chaining on structuralMap, so null is safe via cast
    (structuralMap ?? {}) as StructuralCartography,
    scoutOutput,
    l1Result.impressions,
  );

  costs.l3 = l3Result.cost;
  timings.l3 = l3Result.timingMs;
  console.log(`L3 complete: ${l3Result.walkOutputs.length} paragraphs walked, cost=$${l3Result.cost.toFixed(4)}, time=${l3Result.timingMs}ms`);
  console.log(`  Back-propagations: ${l3Result.backPropagations.length}`);
  console.log(`  Skipped: ${l3Result.skippedParagraphs.length}`);

  // ── Classify all observations ──
  console.log('\n── Classifying observations ──');
  const classified: ClassifiedObservation[] = [];

  for (const walkOutput of l3Result.walkOutputs) {
    for (const sentenceEntry of walkOutput.sentenceUnderstandings) {
      const sIdx = sentenceEntry.index;
      const u = sentenceEntry.understanding;

      // observedFunctions
      for (const obs of u.observedFunctions) {
        const { depth, reasoning } = classifyDepth(obs.observation, obs.evidence);
        classified.push({
          paragraphIndex: walkOutput.paragraphIndex,
          sentenceIndex: sIdx,
          field: 'observedFunctions',
          observation: obs.observation,
          evidence: obs.evidence,
          confidence: obs.confidence,
          depth,
          reasoning,
        });
      }

      // inferredIntents
      for (const obs of u.inferredIntents) {
        const { depth, reasoning } = classifyDepth(obs.observation, obs.evidence);
        classified.push({
          paragraphIndex: walkOutput.paragraphIndex,
          sentenceIndex: sIdx,
          field: 'inferredIntents',
          observation: obs.observation,
          evidence: obs.evidence,
          confidence: obs.confidence,
          depth,
          reasoning,
        });
      }

      // narrativeContributions
      for (const obs of u.narrativeContributions) {
        const { depth, reasoning } = classifyDepth(obs.observation, obs.evidence);
        classified.push({
          paragraphIndex: walkOutput.paragraphIndex,
          sentenceIndex: sIdx,
          field: 'narrativeContributions',
          observation: obs.observation,
          evidence: obs.evidence,
          confidence: obs.confidence,
          depth,
          reasoning,
        });
      }
    }
  }

  // ── Print distribution ──
  const total = classified.length;
  const surface = classified.filter(c => c.depth === 'SURFACE').length;
  const structural = classified.filter(c => c.depth === 'STRUCTURAL').length;
  const architectural = classified.filter(c => c.depth === 'ARCHITECTURAL').length;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEPTH DISTRIBUTION:');
  console.log(`  SURFACE:       ${surface}/${total} (${total > 0 ? (surface / total * 100).toFixed(1) : 0}%)`);
  console.log(`  STRUCTURAL:    ${structural}/${total} (${total > 0 ? (structural / total * 100).toFixed(1) : 0}%)`);
  console.log(`  ARCHITECTURAL: ${architectural}/${total} (${total > 0 ? (architectural / total * 100).toFixed(1) : 0}%)`);
  console.log('═══════════════════════════════════════════════════════════════');

  // ── Write outputs ──
  console.log('\n── Writing output files ──');

  // Full JSON output
  const fullOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      withL2: WITH_L2,
      essayParagraphs: paragraphs.length,
      costs,
      timings,
    },
    l1Impressions: l1Result.impressions,
    structuralMap: structuralMap ?? null,
    scoutOutput: scoutOutput ?? null,
    l3WalkOutputs: l3Result.walkOutputs,
    l3BackPropagations: l3Result.backPropagations,
    l3HolisticEvolution: l3Result.holisticEvolution,
    depthClassification: {
      distribution: { total, surface, structural, architectural },
      percentages: {
        surface: total > 0 ? +(surface / total * 100).toFixed(1) : 0,
        structural: total > 0 ? +(structural / total * 100).toFixed(1) : 0,
        architectural: total > 0 ? +(architectural / total * 100).toFixed(1) : 0,
      },
      observations: classified,
    },
  };

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(fullOutput, null, 2));
  console.log(`  JSON: ${JSON_OUTPUT}`);

  // Human-readable summary
  const walkOutputsForSummary = l3Result.walkOutputs.map(wo => ({
    paragraphIndex: wo.paragraphIndex,
    paragraphUnderstanding: wo.paragraphUnderstanding,
    holisticEvolution: wo.holisticEvolution,
  }));

  const summary = buildSummary(
    classified,
    walkOutputsForSummary as unknown as Array<Record<string, unknown>>,
    costs,
    timings,
  );
  fs.writeFileSync(SUMMARY_OUTPUT, summary);
  console.log(`  Summary: ${SUMMARY_OUTPUT}`);

  // ── Final verdict ──
  console.log('');
  const archPct = total > 0 ? (architectural / total * 100) : 0;
  if (archPct >= 40) {
    console.log(`✓ Architectural depth is ${archPct.toFixed(1)}% — meets the 40% target`);
  } else {
    console.log(`✗ Architectural depth is only ${archPct.toFixed(1)}% — below the 40% target`);
    console.log('  → Phase 2 analysis needed: examine why depth stops at structural level');
  }

  const totalCost = costs.l1 + (costs.l2 ?? 0) + (costs.l25 ?? 0) + costs.l3;
  console.log(`\nTotal cost: $${totalCost.toFixed(4)}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
