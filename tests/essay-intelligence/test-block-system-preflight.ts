/**
 * Block System Preflight Check — Verifies prompt assembly works correctly
 * for all 5 modes × 5 phases BEFORE making any API calls.
 *
 * This test costs $0.00. Run it before the E2E test to catch issues early.
 *
 * Checks:
 * 1. await buildCoachingPrompt() returns non-empty strings for all mode×phase combos
 * 2. Each mode's assembled prompt contains expected mode-specific content
 * 3. first_encounter prompt contains the same key phrases as the original monolithic prompt
 * 4. No mode produces duplicate content from another mode's blocks
 * 5. Token count estimates are within expected range
 *
 * Run: npx tsx tests/test-block-system-preflight.ts
 */

import { buildCoachingPrompt } from '../../src/services/essayIntelligence/coaching/promptBlocks';
import type { BlockContext } from '../../src/services/essayIntelligence/coaching/types';
import type { CoachingMode, ImprovementPhaseLevel } from '../../src/services/essayIntelligence/profileTypes';
import { detectCoachingMode } from '../../src/services/essayIntelligence/coaching/modeDetection';

let passed = 0;
let failed = 0;
let warnings = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

function warn(condition: boolean, name: string) {
  if (!condition) {
    console.warn(`  ⚠ ${name}`);
    warnings++;
  }
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English prose
  return Math.ceil(text.length / 4);
}

const MODES: CoachingMode[] = ['first_encounter', 'revision_response', 'iteration_deep', 'architecture', 'polish'];
const PHASES: ImprovementPhaseLevel[] = ['foundation', 'architecture', 'craft', 'polish', 'distinction'];

console.log('\n=== Block System Preflight Check ===\n');

// ══════════════════════════════════════════════════════════════════════════════
// TEST 1: All mode × phase combinations produce non-empty prompts
// ══════════════════════════════════════════════════════════════════════════════

console.log('--- Test 1: All mode × phase combinations produce content ---\n');

const promptsByMode: Record<string, string> = {};

for (const mode of MODES) {
  for (const phase of PHASES) {
    const ctx: BlockContext = {
      mode,
      phase,
      iterationRound: mode === 'iteration_deep' ? 4 : undefined,
    };
    const prompt = await buildCoachingPrompt(ctx);
    assert(
      prompt.length > 500,
      `${mode} × ${phase} → ${prompt.length} chars (${estimateTokens(prompt)} tokens)`,
    );

    // Store first phase variant per mode for cross-mode checks
    if (!promptsByMode[mode]) {
      promptsByMode[mode] = prompt;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST 2: Mode-specific content markers
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 2: Mode-specific content markers ---\n');

const firstEncounter = await buildCoachingPrompt({ mode: 'first_encounter', phase: 'craft' });
const revision = await buildCoachingPrompt({ mode: 'revision_response', phase: 'craft' });
const iteration = await buildCoachingPrompt({ mode: 'iteration_deep', phase: 'craft', iterationRound: 4 });
const architecture = await buildCoachingPrompt({ mode: 'architecture', phase: 'craft' });
const polish = await buildCoachingPrompt({ mode: 'polish', phase: 'craft' });

// first_encounter should have diagnostic language
assert(firstEncounter.includes('ONE INSIGHT PER TURN'), 'first_encounter has "ONE INSIGHT PER TURN"');
assert(firstEncounter.includes('CREATE WRITING MOMENTS'), 'first_encounter has "CREATE WRITING MOMENTS"');
assert(firstEncounter.includes('THE UNLOCKING QUESTION'), 'first_encounter has "THE UNLOCKING QUESTION"');

// revision_response should have delta language
assert(revision.includes('DELTA'), 'revision_response has "DELTA"');
assert(revision.includes('CRAFT SHIFT'), 'revision_response has "CRAFT SHIFT"');
assert(revision.includes('REGRESSION'), 'revision_response has "REGRESSION"');
assert(revision.includes('revisionQuality'), 'revision_response sidecar has "revisionQuality"');

// iteration_deep should have precision language
assert(iteration.includes('PRECISION'), 'iteration_deep has "PRECISION"');
assert(iteration.includes('READINESS'), 'iteration_deep has "READINESS"');
assert(iteration.includes('DIMINISHING RETURNS'), 'iteration_deep has "DIMINISHING RETURNS"');
assert(iteration.includes('VOICE DRIFT') || iteration.includes('voice drift') || iteration.includes('VOICE FIDELITY'),
  'iteration_deep has voice drift/fidelity concept');

// architecture should have structural language
assert(architecture.includes('SEQUENCE'), 'architecture has "SEQUENCE"');
assert(architecture.includes('CONNECTION AUDIT') || architecture.includes('THROUGH-LINE'),
  'architecture has connection audit concept');
assert(!architecture.includes('ONE INSIGHT PER TURN'), 'architecture does NOT have first_encounter language');

// polish should have word-level language
assert(polish.includes('RHYTHM'), 'polish has "RHYTHM"');
assert(polish.includes('WORD'), 'polish has "WORD"');
assert(polish.includes('AO TEST') || polish.includes('AO test'), 'polish has "AO TEST"');

// ══════════════════════════════════════════════════════════════════════════════
// TEST 3: Cross-mode differentiation (modes should NOT have each other's markers)
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 3: Cross-mode differentiation ---\n');

// revision_response should NOT have first_encounter's diagnostic structure
assert(!revision.includes('ONE INSIGHT PER TURN'), 'revision_response does NOT have "ONE INSIGHT PER TURN"');
assert(!revision.includes('CREATE WRITING MOMENTS'), 'revision_response does NOT have "CREATE WRITING MOMENTS"');

// iteration_deep should NOT have first_encounter's diagnostic structure
assert(!iteration.includes('ONE INSIGHT PER TURN'), 'iteration_deep does NOT have "ONE INSIGHT PER TURN"');
assert(!iteration.includes('CREATE WRITING MOMENTS'), 'iteration_deep does NOT have "CREATE WRITING MOMENTS"');

// architecture should NOT have sentence-level language
assert(!architecture.includes('sentence-level') || architecture.includes('Do NOT') || architecture.includes('not sentence'),
  'architecture either avoids sentence-level or explicitly says not to');

// polish should NOT have structural diagnosis language
assert(!polish.includes('THE INSIGHT — what'), 'polish does NOT have first_encounter response structure');

// ══════════════════════════════════════════════════════════════════════════════
// TEST 4: Token count sanity check
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 4: Token count ranges ---\n');

// Token budgets: 13 blocks assembled + deep knowledge additions produce 7000-10000 tokens.
// The craft reference block (Tier 3) now includes emotional architecture, between-the-lines
// reading, and elite differentiation knowledge (~2000 additional tokens shared across modes).
const tokenBudgets: Record<CoachingMode, [number, number]> = {
  first_encounter: [7000, 12000],
  revision_response: [6000, 11000],
  iteration_deep: [5500, 10000],
  architecture: [5000, 10000],
  polish: [5000, 10000],
};

for (const mode of MODES) {
  const prompt = await buildCoachingPrompt({ mode, phase: 'craft', iterationRound: mode === 'iteration_deep' ? 4 : undefined });
  const tokens = estimateTokens(prompt);
  const [min, max] = tokenBudgets[mode];
  assert(
    tokens >= min && tokens <= max,
    `${mode} tokens: ${tokens} (expected ${min}-${max})`,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST 5: Shared content present across all modes
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 5: Shared content present in all modes ---\n');

for (const mode of MODES) {
  const prompt = await buildCoachingPrompt({ mode, phase: 'craft', iterationRound: mode === 'iteration_deep' ? 4 : undefined });

  // Craft reference should be in ALL modes
  assert(prompt.includes('Sensory timestamp'), `${mode} has craft reference (Sensory timestamp)`);

  // Pedagogical calibration should be in ALL modes
  assert(prompt.includes('WHEN CONFUSED'), `${mode} has pedagogical calibration`);

  // Sidecar instructions should be in ALL modes
  assert(prompt.includes('<!--METADATA-->'), `${mode} has sidecar instructions`);

  // Anti-convergence base should be in ALL modes
  assert(prompt.includes('ANTI-CONVERGENCE') || prompt.includes('HONOR THE ESSAY'), `${mode} has anti-convergence`);

  // Student dynamics base should be in ALL modes
  assert(prompt.includes('STUDENT RESISTANCE'), `${mode} has student dynamics`);
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST 6: Phase-specific content appears correctly
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 6: Phase-specific content ---\n');

const foundationPrompt = await buildCoachingPrompt({ mode: 'first_encounter', phase: 'foundation' });
const craftPrompt = await buildCoachingPrompt({ mode: 'first_encounter', phase: 'craft' });
const polishPhasePrompt = await buildCoachingPrompt({ mode: 'first_encounter', phase: 'polish' });

assert(foundationPrompt.includes('FOUNDATION'), 'foundation phase has FOUNDATION marker');
assert(craftPrompt.includes('CRAFT TECHNIQUE VOCABULARY'), 'craft phase has technique vocabulary');
assert(polishPhasePrompt.includes('POLISH'), 'polish phase has POLISH marker');

// Foundation should NOT have craft vocabulary
assert(!foundationPrompt.includes('Anaphora'), 'foundation does NOT have craft vocabulary (Anaphora)');

// ══════════════════════════════════════════════════════════════════════════════
// TEST 7: Mode × Phase interactions in assessment block
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 7: Mode × Phase interactions ---\n');

const revisionAtFoundation = await buildCoachingPrompt({ mode: 'revision_response', phase: 'foundation' });
const revisionAtPolish = await buildCoachingPrompt({ mode: 'revision_response', phase: 'polish' });
const iterationAtFoundation = await buildCoachingPrompt({ mode: 'iteration_deep', phase: 'foundation', iterationRound: 4 });

assert(
  revisionAtFoundation.includes('PHASE NOTE') || revisionAtFoundation.includes('FOUNDATION'),
  'revision × foundation has phase interaction note',
);
assert(
  revisionAtPolish.includes('PHASE NOTE') || revisionAtPolish.includes('word-level') || revisionAtPolish.includes('precision'),
  'revision × polish has phase interaction note',
);
assert(
  iterationAtFoundation.includes('PHASE WARNING') || iterationAtFoundation.includes('FOUNDATION'),
  'iteration × foundation has phase warning',
);

// ══════════════════════════════════════════════════════════════════════════════
// TEST 8: Mode detection → prompt assembly integration
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n--- Test 8: Mode detection → prompt assembly integration ---\n');

// Simulate: student edited, significant change, first time
const mode1 = detectCoachingMode('edit context present', 'significant', 1, 'How is this?', true, 'content_expansion', 'craft');
const prompt1 = await buildCoachingPrompt({ mode: mode1, phase: 'craft' });
assert(mode1 === 'revision_response', 'detection: edit + significant → revision_response');
assert(prompt1.includes('DELTA'), 'assembled prompt for detected revision_response has delta language');

// Simulate: student edited, 4th time same paragraph
const mode2 = detectCoachingMode('edit context', 'minor', 4, 'Better?', true, 'word_refinement', 'craft');
const prompt2 = await buildCoachingPrompt({ mode: mode2, phase: 'craft', iterationRound: 4 });
assert(mode2 === 'iteration_deep', 'detection: 4 edits → iteration_deep');
assert(prompt2.includes('PRECISION'), 'assembled prompt for detected iteration_deep has precision language');

// Simulate: structural reorg
const mode3 = detectCoachingMode('edit context', 'significant', 1, 'How does this order work?', true, 'structural_reorganization', 'architecture');
const prompt3 = await buildCoachingPrompt({ mode: mode3, phase: 'architecture' });
assert(mode3 === 'architecture', 'detection: structural_reorganization → architecture');
assert(prompt3.includes('SEQUENCE'), 'assembled prompt for detected architecture has sequence language');

// Simulate: minor edit at polish phase
const mode4 = detectCoachingMode('edit context', 'minor', 1, 'Small tweak', true, 'word_refinement', 'polish');
const prompt4 = await buildCoachingPrompt({ mode: mode4, phase: 'polish' });
assert(mode4 === 'polish', 'detection: minor + polish phase → polish');
assert(prompt4.includes('RHYTHM'), 'assembled prompt for detected polish has rhythm language');

// ══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\n${'='.repeat(60)}`);
console.log(`Preflight Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log(`Total checks: ${passed + failed}`);
if (failed > 0) {
  console.error('\n❌ PREFLIGHT FAILED — Fix issues before running E2E tests');
  process.exit(1);
} else {
  console.log('\n✅ PREFLIGHT PASSED — Block system ready for E2E testing');
}
