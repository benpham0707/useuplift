/**
 * test-phase3a-blocks.ts — Smoke tests for L3.5 × corpus block builders.
 *
 * Validates that:
 *   1. Feature-flag OFF means retrieval functions return [] without embedding/DB calls.
 *   2. Prompt-block builders produce non-empty strings when given synthetic results.
 *   3. Empty results → empty string (for silent skip-injection).
 *   4. Fabricated-reference detector correctly identifies out-of-range labels.
 *   5. Voice register resolver handles unknown registers gracefully.
 *
 * Run:
 *   npx tsx tests/corpus/test-phase3a-blocks.ts
 *
 * No API calls required — purely deterministic logic.
 */

import {
  isCorpusRetrievalEnabled,
  createTelemetry,
  retrieveAnchorMoves,
  retrieveParagraphAntiPatterns,
  retrievePhaseArchetypes,
  buildCorpusMovesBlock,
  buildAntiPatternsBlock,
  buildPhaseArchetypesBlock,
  detectFabricatedReferences,
  resolveVoiceRegister,
} from '../../src/services/essayIntelligence/analysis/corpusRetrievalBlocks';
import type { CraftMove, EssayArchetype } from '../../src/services/essayIntelligence/corpus/corpusTypes';
import type { RetrievalResult } from '../../src/services/essayIntelligence/corpus/retrieval';
import type { EssayProfile } from '../../src/services/essayIntelligence/profileTypes';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('Phase 3A block-builder smoke tests');
  console.log('════════════════════════════════════════════════════════════════');

  // Force the feature flag OFF for this test run. The retrieval wrappers must
  // short-circuit without attempting any embedding/DB call.
  const prev = process.env.ENABLE_CORPUS_RETRIEVAL_L35;
  delete process.env.ENABLE_CORPUS_RETRIEVAL_L35;

  // ─── Check 1: feature flag gate ────────────────────────────────────────
  console.log('\n[1] Feature-flag gate');
  assert(isCorpusRetrievalEnabled() === false, 'flag default-off');

  const minimalProfile = {
    voiceIdentity: { register: 'lyric' },
    thematicArchitecture: { centralThesis: 'test thesis' },
    narrativeStrategy: { primaryStrategy: 'reflective', arcType: 'reflective' },
  } as unknown as EssayProfile;

  const tel1 = createTelemetry();
  const moves = await retrieveAnchorMoves('test paragraph text', minimalProfile, tel1);
  assert(moves.length === 0, 'retrieveAnchorMoves returns [] when flag off');
  assert(tel1.attempts.length === 0, 'no telemetry attempt recorded when flag off');

  const tel2 = createTelemetry();
  const aps = await retrieveParagraphAntiPatterns('test text', 3, tel2);
  assert(aps.length === 0, 'retrieveParagraphAntiPatterns returns [] when flag off');

  const tel3 = createTelemetry();
  const arch = await retrievePhaseArchetypes(minimalProfile, tel3);
  assert(arch.length === 0, 'retrievePhaseArchetypes returns [] when flag off');

  // ─── Check 2: prompt-block builders with synthetic results ─────────────
  console.log('\n[2] Prompt-block builders');
  const fakeMoves: RetrievalResult<CraftMove>[] = [
    {
      entity: {
        id: 'x',
        displayName: 'Anchor move',
        mechanism: 'The mechanism description runs here.',
        detectionSignal: 'Signal',
        universalApplication: '',
        transferability: 'broad',
        difficulty: 'intermediate',
        prerequisites: [],
        antiPatterns: [],
        sourceEssays: [],
        dimensions: ['voice'],
        compatibleRegisters: ['plain'],
      } as CraftMove,
      similarity: 0.75,
      provenance: { essayId: '12-harvard-2028-three-years-alone', paragraph: 3 },
    },
  ];
  const moveBlock = buildCorpusMovesBlock(fakeMoves);
  assert(moveBlock.includes('[MOVE-1]'), 'moves block contains [MOVE-1]');
  assert(moveBlock.includes('Anchor move'), 'moves block contains displayName');
  assert(moveBlock.includes('12-harvard-2028-three-years-alone P3'), 'moves block contains provenance');
  assert(buildCorpusMovesBlock([]) === '', 'moves block empty on empty input');

  const fakeAps = [
    { id: 'generic-epiphany', description: 'Closing with a generic moral realization.', similarity: 0.62 },
    { id: 'listing-activities', description: 'Enumerating activities without revealing stakes.', similarity: 0.55 },
  ];
  const apBlock = buildAntiPatternsBlock(fakeAps);
  assert(apBlock.includes('[AP-1]'), 'AP block contains [AP-1]');
  assert(apBlock.includes('[AP-2]'), 'AP block contains [AP-2]');
  assert(apBlock.includes('generic-epiphany'), 'AP block contains anti-pattern id');
  assert(buildAntiPatternsBlock([]) === '', 'AP block empty on empty input');

  const fakeArchetypes: RetrievalResult<EssayArchetype>[] = [
    {
      entity: {
        id: 'a1',
        exemplarEssayId: '05-harvard-2028-i-too-can-dance',
        description: 'A sensory-vivid cultural-identity essay. Voice-forward.',
        structuralStages: [
          {
            stageName: 'opening',
            purpose: 'Ground the reader in physical scene',
            typicalLocation: 'P1',
            requiredMoveIds: [],
            optionalMoveIds: [],
          },
        ],
        loadBearingMoveIds: [],
        voiceRequirements: [],
        contentRequirements: [],
        whenToUse: 'Use when the writer has a strong body-in-space memory.',
        whenNotToUse: '',
        commonFailureModes: [],
        schoolFitStrength: {},
        provenance: 'fully-attested',
      } as EssayArchetype,
      similarity: 0.7,
      provenance: { essayId: '05-harvard-2028-i-too-can-dance', paragraph: null },
    },
  ];
  const archBlock = buildPhaseArchetypesBlock(fakeArchetypes);
  assert(archBlock.includes('PHASE BOUNDARY REFERENCE'), 'archetype block has header');
  assert(archBlock.includes('Structural signals'), 'archetype block has structural signals');
  assert(archBlock.includes('When-to-use'), 'archetype block has when-to-use');
  assert(buildPhaseArchetypesBlock([]) === '', 'archetype block empty on empty input');

  // ─── Check 3: fabricated-reference detector ────────────────────────────
  console.log('\n[3] Fabricated-reference detector');
  const cleanOutput = 'Sentence 3 matches [MOVE-1] closely and echoes [AP-2] slightly.';
  const d1 = detectFabricatedReferences(cleanOutput, 2, 3);
  assert(d1.fabricated.length === 0, 'in-range references not flagged');
  assert(d1.referenced.includes('[MOVE-1]'), 'detected [MOVE-1]');
  assert(d1.referenced.includes('[AP-2]'), 'detected [AP-2]');

  const dirtyOutput = 'See [MOVE-1] and also [MOVE-9] plus [AP-7].';
  const d2 = detectFabricatedReferences(dirtyOutput, 2, 3);
  assert(d2.fabricated.length === 2, 'out-of-range references flagged');
  assert(d2.fabricated.includes('[MOVE-9]'), '[MOVE-9] flagged');
  assert(d2.fabricated.includes('[AP-7]'), '[AP-7] flagged');

  // ─── Check 4: voice register resolver ──────────────────────────────────
  console.log('\n[4] Voice register resolver');
  assert(resolveVoiceRegister({ voiceIdentity: { register: 'lyric' } } as unknown as EssayProfile) === 'lyric', 'lyric resolves');
  assert(resolveVoiceRegister({ voiceIdentity: { register: 'PLAIN' } } as unknown as EssayProfile) === 'plain', 'uppercase normalizes');
  assert(resolveVoiceRegister({ voiceIdentity: { register: 'mysterious-register' } } as unknown as EssayProfile) === null, 'unknown register → null');
  assert(resolveVoiceRegister({ voiceIdentity: { register: '' } } as unknown as EssayProfile) === null, 'empty register → null');
  assert(resolveVoiceRegister({} as EssayProfile) === null, 'missing voiceIdentity → null');

  // ─── Restore env ───────────────────────────────────────────────────────
  if (prev !== undefined) process.env.ENABLE_CORPUS_RETRIEVAL_L35 = prev;

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('════════════════════════════════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
