/**
 * L3.75 Earned-ness & Voice Intentionality Audit
 *
 * Runs L1 → L3 → L3.75 on the piano essay, then inspects:
 * - Moment earned-ness map: moments, mechanisms, gaps, structural observation
 * - Voice shifts with intentionality reasoning
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l375-earned-voice-audit.ts
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l375-earned-voice-audit.ts --with-l2
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root (has API keys)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

import * as fs from 'fs';
import { firstImpressionsService } from '../../src/services/essayIntelligence/analysis/firstImpressions';
import { structuralCartographerService } from '../../src/services/essayIntelligence/analysis/structuralCartographer';
import { scoutPassService } from '../../src/services/essayIntelligence/analysis/scoutPass';
import { sequentialDeepWalkService } from '../../src/services/essayIntelligence/analysis/sequentialDeepWalk';
import { holisticSynthesisService } from '../../src/services/essayIntelligence/analysis/holisticSynthesis';
import { EssayProfileCoordinator } from '../../src/services/essayIntelligence/profileManager/essayProfileManager';
import { InMemoryCheckpointStore } from '../../src/services/essayIntelligence/profileManager/checkpointStore';
import type { EssayProfile, EssayType } from '../../src/services/essayIntelligence/profileTypes';
import type { StructuralCartography } from '../../src/services/essayIntelligence/types';
import type { ConnectionScoutOutput } from '../../src/services/essayIntelligence/profileTypes';

// ============================================================================
// CONFIG
// ============================================================================

const ESSAY_PATH = path.join(__dirname, '..', 'fixtures', 'piano-essay.txt');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const SUMMARY_OUTPUT = path.join(OUTPUT_DIR, 'l375-earned-voice-audit.txt');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'l375-earned-voice-audit.json');

const WITH_L2 = process.argv.includes('--with-l2');

// ============================================================================
// HELPERS
// ============================================================================

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ============================================================================
// SUMMARY BUILDER
// ============================================================================

function buildSummary(
  profile: EssayProfile,
  costs: { l1: number; l2?: number; l25?: number; l3: number; l375: number },
  timings: { l1: number; l2?: number; l25?: number; l3: number; l375: number },
  l375Complete: boolean,
  l375MissingSections: string[],
): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('L3.75 EARNED-NESS & VOICE INTENTIONALITY AUDIT');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  // ── Cost & Timing ──
  const totalCost = costs.l1 + (costs.l2 ?? 0) + (costs.l25 ?? 0) + costs.l3 + costs.l375;
  lines.push('COST & TIMING:');
  lines.push(`  L1:    $${costs.l1.toFixed(4)} (${timings.l1}ms)`);
  if (costs.l2 !== undefined) lines.push(`  L2:    $${costs.l2.toFixed(4)} (${timings.l2}ms)`);
  if (costs.l25 !== undefined) lines.push(`  L2.5:  $${costs.l25.toFixed(4)} (${timings.l25}ms)`);
  lines.push(`  L3:    $${costs.l3.toFixed(4)} (${timings.l3}ms)`);
  lines.push(`  L3.75: $${costs.l375.toFixed(4)} (${timings.l375}ms)`);
  lines.push(`  TOTAL: $${totalCost.toFixed(4)}`);
  lines.push('');

  // ── L3.75 Completeness ──
  lines.push(`L3.75 complete: ${l375Complete}`);
  if (l375MissingSections.length > 0) {
    lines.push(`Missing sections: ${l375MissingSections.join(', ')}`);
  }
  lines.push('');

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1: MOMENT EARNED-NESS MAP
  // ══════════════════════════════════════════════════════════════════
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('SECTION 1: MOMENT EARNED-NESS MAP');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  const earnedness = profile.momentEarnednessMap;
  lines.push(`Total moments identified: ${earnedness.moments.length}`);

  // Count by type
  const byType = new Map<string, number>();
  for (const m of earnedness.moments) {
    byType.set(m.momentType, (byType.get(m.momentType) ?? 0) + 1);
  }
  lines.push(`By type: ${[...byType.entries()].map(([t, c]) => `${t}=${c}`).join(', ')}`);

  // Count gaps vs well-supported
  let momentsWithGaps = 0;
  let momentsWellSupported = 0;
  for (const m of earnedness.moments) {
    if (m.gaps.length > 0) momentsWithGaps++;
    if (m.mechanisms.length >= 2) momentsWellSupported++;
  }
  lines.push(`Moments with gaps: ${momentsWithGaps}`);
  lines.push(`Moments with 2+ mechanisms: ${momentsWellSupported}`);
  lines.push('');

  // Detail each moment
  for (let i = 0; i < earnedness.moments.length; i++) {
    const m = earnedness.moments[i];
    lines.push(`── MOMENT ${i + 1}: P${m.location.paragraph}S${m.location.sentence} (${m.momentType}) ──`);
    lines.push(`  Description: ${m.description}`);
    lines.push(`  Payload: ${m.payload}`);
    lines.push('');

    // Mechanisms
    if (m.mechanisms.length > 0) {
      lines.push(`  Earning mechanisms (${m.mechanisms.length}):`);
      for (const mech of m.mechanisms) {
        const locStr = mech.location.sentence !== undefined
          ? `P${mech.location.paragraph}S${mech.location.sentence}`
          : mech.location.sentenceRange
            ? `P${mech.location.paragraph}S${mech.location.sentenceRange[0]}-S${mech.location.sentenceRange[1]}`
            : `P${mech.location.paragraph}`;
        lines.push(`    → [${mech.type}] from ${locStr}`);
        lines.push(`      "${mech.contribution}"`);
      }
    } else {
      lines.push('  Earning mechanisms: NONE — this moment has no backward arrows');
    }
    lines.push('');

    // Gaps
    if (m.gaps.length > 0) {
      lines.push(`  GAPS (${m.gaps.length}):`);
      for (const gap of m.gaps) {
        lines.push(`    ✗ ${gap}`);
      }
    } else {
      lines.push('  Gaps: none identified');
    }
    lines.push('');
  }

  // Structural observation
  lines.push('── STRUCTURAL OBSERVATION ──');
  lines.push(`  ${earnedness.structuralObservation || '(empty)'}`);
  lines.push('');

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2: VOICE SHIFTS WITH INTENTIONALITY
  // ══════════════════════════════════════════════════════════════════
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('SECTION 2: VOICE SHIFTS WITH INTENTIONALITY REASONING');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  const voiceMap = profile.voiceMap;
  lines.push(`Total shifts: ${voiceMap.shifts.length}`);

  // Count by assessment
  const intentional = voiceMap.shifts.filter(s => s.intentionality.assessment === 'intentional').length;
  const unintentional = voiceMap.shifts.filter(s => s.intentionality.assessment === 'unintentional').length;
  const ambiguous = voiceMap.shifts.filter(s => s.intentionality.assessment === 'ambiguous').length;
  lines.push(`Intentional: ${intentional}, Unintentional: ${unintentional}, Ambiguous: ${ambiguous}`);

  // Count shifts with substantive reasoning
  const withReasoning = voiceMap.shifts.filter(s => s.intentionality.reasoning.length > 50).length;
  lines.push(`Shifts with substantive reasoning (>50 chars): ${withReasoning}/${voiceMap.shifts.length}`);
  lines.push('');

  // Detail each shift
  for (let i = 0; i < voiceMap.shifts.length; i++) {
    const shift = voiceMap.shifts[i];
    const locStr = shift.location.sentence !== undefined
      ? `P${shift.location.paragraph}S${shift.location.sentence}`
      : `P${shift.location.paragraph} boundary`;

    lines.push(`── SHIFT ${i + 1}: ${locStr} (${shift.location.boundary}) ──`);
    lines.push(`  Dimensions: ${shift.dimensions.join(', ')}`);
    lines.push(`  From: "${shift.fromDescription}"`);
    lines.push(`  To:   "${shift.toDescription}"`);
    lines.push(`  Assessment: ${shift.intentionality.assessment} (confidence: ${shift.intentionality.confidence.toFixed(2)})`);
    lines.push(`  Reasoning: "${shift.intentionality.reasoning}"`);
    if (shift.servesFunction) {
      lines.push(`  Serves: ${shift.servesFunction}`);
    }
    lines.push('');
  }

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3: VOICE MAP BASELINES
  // ══════════════════════════════════════════════════════════════════
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('SECTION 3: VOICE MAP BASELINES');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Register: ${voiceMap.register.baseline}`);
  lines.push(`  Vocabulary: ${voiceMap.vocabularyFingerprint.baseline}`);
  lines.push(`  Rhythm: ${voiceMap.sentenceRhythm.baseline}`);
  lines.push(`  Perspective: ${voiceMap.perspectiveDistance.baseline}`);
  lines.push(`  Tonal disposition: ${voiceMap.tonalDisposition.baseline}`);
  lines.push(`  Dominant qualities: ${voiceMap.tonalDisposition.dominantQualities.join(', ')}`);
  lines.push('');

  // Code switching — Scope 1 Phase 2: field is optional (removed from
  // L3.75 schema). Legacy profiles may still carry entries; new profiles
  // emit an empty array or undefined. `?? []` handles both.
  const codeSwitchingEvents = voiceMap.codeSwitching ?? [];
  if (codeSwitchingEvents.length > 0) {
    lines.push('Code-switching events:');
    for (const cs of codeSwitchingEvents) {
      lines.push(`  P${cs.location.paragraph}S${cs.location.sentence}: ${cs.language} — ${cs.trigger}`);
    }
  } else {
    lines.push('Code-switching events: none');
  }
  lines.push('');

  // ══════════════════════════════════════════════════════════════════
  // SECTION 4: QUALITY ASSESSMENT
  // ══════════════════════════════════════════════════════════════════
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('SECTION 4: QUALITY ASSESSMENT');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  // Earned-ness quality checks
  const checks: Array<{ label: string; pass: boolean; detail: string }> = [];

  checks.push({
    label: 'At least 3 moments identified',
    pass: earnedness.moments.length >= 3,
    detail: `Found ${earnedness.moments.length}`,
  });

  checks.push({
    label: 'At least 2 moments have gaps',
    pass: momentsWithGaps >= 2,
    detail: `Found ${momentsWithGaps} with gaps`,
  });

  checks.push({
    label: 'At least 1 mechanism per moment on average',
    pass: earnedness.moments.length > 0 &&
      earnedness.moments.reduce((sum, m) => sum + m.mechanisms.length, 0) / earnedness.moments.length >= 1,
    detail: `Avg: ${earnedness.moments.length > 0
      ? (earnedness.moments.reduce((sum, m) => sum + m.mechanisms.length, 0) / earnedness.moments.length).toFixed(1)
      : 0}`,
  });

  checks.push({
    label: 'Structural observation is substantive (>100 chars)',
    pass: earnedness.structuralObservation.length > 100,
    detail: `${earnedness.structuralObservation.length} chars`,
  });

  checks.push({
    label: 'Voice shifts have reasoning-backed assessments',
    pass: withReasoning === voiceMap.shifts.length && voiceMap.shifts.length > 0,
    detail: `${withReasoning}/${voiceMap.shifts.length} have substantive reasoning`,
  });

  checks.push({
    label: 'Multiple mechanism types used',
    pass: new Set(
      earnedness.moments.flatMap(m => m.mechanisms.map(mech => mech.type)),
    ).size >= 3,
    detail: `Types used: ${[...new Set(earnedness.moments.flatMap(m => m.mechanisms.map(mech => mech.type)))].join(', ')}`,
  });

  // Piano essay specific: "reaffirmed my belief in the connection between technology and human emotion" is UNEARNED
  const pianoUnearned = earnedness.moments.some(m =>
    m.gaps.length > 0 && (
      m.description.toLowerCase().includes('reaffirm') ||
      m.description.toLowerCase().includes('technology and human emotion') ||
      m.description.toLowerCase().includes('connection between') ||
      m.payload.toLowerCase().includes('reaffirm') ||
      // Also check P4 (0-indexed) for the AI DJ section
      (m.location.paragraph >= 3 && m.gaps.some(g =>
        g.toLowerCase().includes('unearned') ||
        g.toLowerCase().includes('not established') ||
        g.toLowerCase().includes('no prior') ||
        g.toLowerCase().includes('without') ||
        g.toLowerCase().includes('missing') ||
        g.toLowerCase().includes('never show')
      ))
    ),
  );
  checks.push({
    label: 'Piano essay: identifies unearned claim (tech-emotion connection)',
    pass: pianoUnearned,
    detail: pianoUnearned ? 'At least one gap targets this area' : 'MISSED — the essay never shows this connection being tested or doubted',
  });

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    lines.push(`  ${icon} ${check.label}`);
    lines.push(`    ${check.detail}`);
    passed += check.pass ? 1 : 0;
  }

  lines.push('');
  lines.push(`Quality score: ${passed}/${checks.length} checks passed`);

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('L3.75 EARNED-NESS & VOICE INTENTIONALITY AUDIT');
  console.log(`Mode: L1 → L3 → L3.75${WITH_L2 ? ' (with L2/L2.5)' : ''}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  ensureOutputDir();

  // Load essay
  const essayText = fs.readFileSync(ESSAY_PATH, 'utf-8');
  const rawParagraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  console.log(`Essay loaded: ${rawParagraphs.length} paragraphs, ${essayText.length} chars`);

  const costs: { l1: number; l2?: number; l25?: number; l3: number; l375: number } = { l1: 0, l3: 0, l375: 0 };
  const timings: { l1: number; l2?: number; l25?: number; l3: number; l375: number } = { l1: 0, l3: 0, l375: 0 };

  // ── L1: First Impressions ──
  console.log('\n── Running L1 (First Impressions) ──');
  const l1Result = await firstImpressionsService.analyze(essayText);
  costs.l1 = l1Result.cost;
  timings.l1 = l1Result.timingMs;
  console.log(`L1 complete: ${l1Result.impressions.length} paragraphs, cost=$${l1Result.cost.toFixed(4)}, time=${l1Result.timingMs}ms`);

  // Build sentence texts from L1 impressions
  const paragraphTexts = l1Result.impressions.map((imp, idx) =>
    rawParagraphs[idx]?.trim() ?? imp.sentences.map(s => s.text).join(' '),
  );
  const sentenceTexts = l1Result.impressions.map(imp =>
    imp.sentences.map(s => s.text),
  );
  const wordCount = essayText.split(/\s+/).filter(Boolean).length;

  // Create coordinator
  const checkpointStore = new InMemoryCheckpointStore();
  const coordinator = EssayProfileCoordinator.createNew({
    // Round 7 P0 (D4-H1): essayId now required. Any valid UUID works for
    // this in-memory audit — the InMemoryCheckpointStore doesn't validate.
    essayId: '00000000-0000-4000-8000-000000000375',
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
    console.log('\n── Running L2 + L2.5 in parallel ──');
    const [l2Result, l25Result] = await Promise.all([
      structuralCartographerService.analyze(essayText, l1Result.impressions),
      scoutPassService.analyze(essayText, l1Result.impressions),
    ]);

    structuralMap = l2Result.cartography;
    coordinator.applyStructuralCartography(structuralMap);
    costs.l2 = l2Result.cost;
    timings.l2 = l2Result.timingMs;
    console.log(`L2 complete: arc=${structuralMap.arcType}, cost=$${l2Result.cost.toFixed(4)}`);

    scoutOutput = l25Result.scoutOutput;
    coordinator.applyScoutLeads(scoutOutput);
    costs.l25 = l25Result.cost;
    timings.l25 = l25Result.timingMs;
    console.log(`L2.5 complete: ${scoutOutput.repeatedElements.length} repeated, ${scoutOutput.tonalShifts.length} shifts`);
  }

  // ── L3: Sequential Deep Walk ──
  console.log('\n── Running L3 (Sequential Deep Walk) ──');
  const profile = coordinator.getProfile();

  const l3Result = await sequentialDeepWalkService.walkEssay(
    essayText,
    profile as EssayProfile,
    (structuralMap ?? {}) as StructuralCartography,
    scoutOutput,
    l1Result.impressions,
  );

  costs.l3 = l3Result.cost;
  timings.l3 = l3Result.timingMs;
  console.log(`L3 complete: ${l3Result.walkOutputs.length} paragraphs walked, cost=$${l3Result.cost.toFixed(4)}, time=${l3Result.timingMs}ms`);

  // Apply L3 outputs to profile
  for (const walkOutput of l3Result.walkOutputs) {
    coordinator.applyUnderstandingWalkStep(walkOutput);
  }

  // ── L3.75: Holistic Synthesis ──
  console.log('\n── Running L3.75 (Holistic Synthesis) ──');

  // Build marked essay text for L3.75
  const profileAfterL3 = coordinator.getProfile();
  const markedEssay = profileAfterL3.paragraphs
    .map((p, idx) => `[P${idx}] ${p.text}`)
    .join('\n\n');

  const l375Result = await holisticSynthesisService.synthesize({
    essayText: markedEssay,
    profile: profileAfterL3 as EssayProfile,
    holisticEvolution: l3Result.holisticEvolution,
  });

  costs.l375 = l375Result.cost;
  timings.l375 = l375Result.timingMs;
  console.log(
    `L3.75 complete: cost=$${l375Result.cost.toFixed(4)}, time=${l375Result.timingMs}ms, ` +
    `complete=${l375Result.isComplete} (${10 - l375Result.missingSections.length}/10), ` +
    `moments=${l375Result.synthesis.momentEarnednessMap.moments.length}, ` +
    `shifts=${l375Result.synthesis.voiceMap.shifts.length}`,
  );

  // Apply L3.75 to profile
  coordinator.applyHolisticSynthesis(l375Result.synthesis);

  // ── Get final profile ──
  const finalProfile = coordinator.getProfile();

  // ── Build summary ──
  console.log('\n── Writing output files ──');

  const summary = buildSummary(
    finalProfile as EssayProfile,
    costs,
    timings,
    l375Result.isComplete,
    l375Result.missingSections,
  );

  fs.writeFileSync(SUMMARY_OUTPUT, summary);
  console.log(`  Summary: ${SUMMARY_OUTPUT}`);

  // Write full JSON
  const jsonOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      withL2: WITH_L2,
      essayParagraphs: rawParagraphs.length,
      costs,
      timings,
    },
    momentEarnednessMap: (finalProfile as EssayProfile).momentEarnednessMap,
    voiceMap: (finalProfile as EssayProfile).voiceMap,
    voiceIdentity: (finalProfile as EssayProfile).voiceIdentity,
  };
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(jsonOutput, null, 2));
  console.log(`  JSON: ${JSON_OUTPUT}`);

  // ── Print key results to console ──
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('KEY RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');

  const em = (finalProfile as EssayProfile).momentEarnednessMap;
  console.log(`Moments: ${em.moments.length}`);
  console.log(`  With gaps: ${em.moments.filter(m => m.gaps.length > 0).length}`);
  console.log(`  With 2+ mechanisms: ${em.moments.filter(m => m.mechanisms.length >= 2).length}`);
  console.log(`  Mechanism types: ${[...new Set(em.moments.flatMap(m => m.mechanisms.map(mech => mech.type)))].join(', ')}`);

  const vm = (finalProfile as EssayProfile).voiceMap;
  console.log(`\nVoice shifts: ${vm.shifts.length}`);
  console.log(`  Intentional: ${vm.shifts.filter(s => s.intentionality.assessment === 'intentional').length}`);
  console.log(`  Unintentional: ${vm.shifts.filter(s => s.intentionality.assessment === 'unintentional').length}`);
  console.log(`  Ambiguous: ${vm.shifts.filter(s => s.intentionality.assessment === 'ambiguous').length}`);

  const totalCost = costs.l1 + (costs.l2 ?? 0) + (costs.l25 ?? 0) + costs.l3 + costs.l375;
  console.log(`\nTotal cost: $${totalCost.toFixed(4)}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
