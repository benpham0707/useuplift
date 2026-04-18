#!/usr/bin/env tsx
/**
 * Port A3 — orchestrator wiring regression test
 *
 * Proves A3 is not a silent no-op. The A3 port's PIQ_MODE block at L3.5
 * activates only when `profile.index.piqPromptType` is populated. That
 * field has to be written by the orchestrator calling `detectPIQType` at
 * analysis start for PIQ essays. This test pins the wiring so the write
 * path can't silently disappear in a refactor.
 *
 * Verifies:
 *   1. analysisOrchestrator.ts contains the `computeAndWritePiqPromptType`
 *      private method.
 *   2. The method is called from the orchestrator's growth-cycle entry
 *      point when input.essayType === 'piq'.
 *   3. The method imports detectPIQType from piq/prompts/promptMetadata.
 *   4. The method writes via coordinator.updatePiqPromptType(), not by
 *      direct profile mutation.
 *   5. essayProfileManager.ts exposes updatePiqPromptType as a public
 *      method on EssayProfileCoordinator.
 *   6. The mutator writes to `this.profile.index.piqPromptType` and calls
 *      recomputeIndex() to keep the ProfileIndex fresh.
 *   7. detectPIQType returns a valid PIQPromptType for a representative
 *      essay (smoke check that the integration actually resolves a type).
 *
 * Run: npx tsx tests/test-port-a3-orchestrator-wiring.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { detectPIQType } from '../src/services/piq/prompts/promptMetadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;
function assert(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('Port A3 — orchestrator wiring (regression guard)');

const repoRoot = resolve(__dirname, '..');
const orchestratorSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/analysisOrchestrator.ts'),
  'utf8',
);
const managerSrc = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/profileManager/essayProfileManager.ts'),
  'utf8',
);

// 1. private method exists
assert(
  /private\s+async\s+computeAndWritePiqPromptType\s*\(/.test(orchestratorSrc),
  'analysisOrchestrator defines private computeAndWritePiqPromptType',
);

// 2. call site is gated on essayType === 'piq' AND runs before L3.5
assert(
  /input\.essayType\s*===\s*'piq'[\s\S]{0,120}computeAndWritePiqPromptType/.test(orchestratorSrc),
  'call site gates on input.essayType === "piq" and invokes computeAndWritePiqPromptType',
);

// 3. method imports detectPIQType from the canonical source
assert(
  /const\s*\{\s*detectPIQType\s*\}\s*=\s*await\s+import\(\s*['"]\.\.\/\.\.\/piq\/prompts\/promptMetadata['"]/.test(orchestratorSrc),
  'computeAndWritePiqPromptType imports detectPIQType from piq/prompts/promptMetadata',
);

// 4. method writes via coordinator mutator, not direct profile mutation
assert(
  /coordinator\.updatePiqPromptType\(/.test(orchestratorSrc),
  'orchestrator writes via coordinator.updatePiqPromptType',
);
assert(
  !/profile\.index\.piqPromptType\s*=/.test(orchestratorSrc),
  'orchestrator does NOT mutate profile.index.piqPromptType directly',
);

// 5. public mutator on EssayProfileCoordinator
assert(
  /updatePiqPromptType\s*\(\s*\n?\s*promptType:/.test(managerSrc),
  'EssayProfileCoordinator exposes updatePiqPromptType(promptType) method',
);

// 6. mutator writes + recomputes index
assert(
  /this\.profile\.index\.piqPromptType\s*=\s*promptType/.test(managerSrc),
  'updatePiqPromptType writes to this.profile.index.piqPromptType',
);
// The mutator mirrors updateAiRiskSignal/updateImprovementPhase: it must
// recompute the index so downstream ProfileIndex consumers see the new value.
const mutatorBlockMatch = managerSrc.match(
  /updatePiqPromptType[\s\S]{0,1500}?(?=\n\s{2}\/\*\*)/,
);
const mutatorBody = mutatorBlockMatch?.[0] ?? '';
assert(
  /this\.recomputeIndex\(\)/.test(mutatorBody),
  'updatePiqPromptType calls this.recomputeIndex() for downstream freshness',
);
assert(
  /this\.writeVersion\+\+/.test(mutatorBody),
  'updatePiqPromptType bumps writeVersion for optimistic concurrency',
);

// 7. detectPIQType returns a valid type for a representative PIQ essay
const leadershipEssay =
  'I led the debate team as captain for two years. I organized weekly ' +
  'practice sessions and initiated a peer-mentoring program. My team ' +
  'grew from 6 to 18 members. I learned that leadership is not about ' +
  'giving orders but about creating space for others to contribute.';
const detected = detectPIQType(leadershipEssay);
const VALID_TYPES = new Set([
  'piq1_leadership', 'piq2_creative', 'piq3_talent', 'piq4_educational',
  'piq5_challenge', 'piq6_academic', 'piq7_community', 'piq8_open_ended',
]);
assert(
  VALID_TYPES.has(detected),
  `detectPIQType returns a valid PIQPromptType for a leadership essay (got: ${detected})`,
);

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
