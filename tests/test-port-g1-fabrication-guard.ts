#!/usr/bin/env tsx
/**
 * Port G1 — Fabricated-Metrics Anti-Fabrication Guard smoke test (SAFETY P0)
 *
 * Verifies:
 *   1. buildFabricationGuardBlock() returns a non-empty string wrapped with
 *      BLOCK:G1_FABRICATION_GUARD@v1.0.0 open + close markers (cache-key
 *      divergence seed + descriptive-contract lint binding).
 *   2. Block body contains all 5 FINAL CHECK audit steps.
 *   3. Block body carries the integrity / rescission warning — the legal/
 *      safety rationale is load-bearing and must not be silently trimmed.
 *   4. Every expected generative prompt surface imports G1 and invokes
 *      buildFabricationGuardBlock():
 *        • src/services/essayIntelligence/analysis/deepAnnotationService.ts (L5)
 *        • src/services/essayIntelligence/coaching/coachingService.ts      (L6)
 *        • src/services/inlineEditor/commandPrompts.ts                     (inline)
 *   5. G1 is declared at 'prescriptive' level in PROMPT_BLOCK_DECLARATIONS
 *      (lint exempts the content body from forbidden-vocabulary scanning —
 *      the body contains directive language like "MUST", "NEVER", which is
 *      the point of a prescriptive guard).
 *   6. G1 is NOT injected into purely-analytical prompts (L1 / L3 / L3.5 /
 *      L3.75 / L4). Those prompts emit descriptions and classifications,
 *      not rewrite examples — injecting a guard there would pollute the
 *      cacheable analytical-prompt prefix for no safety gain.
 *
 * MEASUREMENT PLAN (per docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port G1):
 *   Audit 100 generated rewrites pre-port and post-port. Post-port target:
 *   0% unbracketed fabricated metrics across all four prompt surfaces (L5
 *   annotations rewriteExample, L6 coaching inline samples, inline-editor
 *   primary/creative output). A non-zero rate is a safety regression and
 *   must block release. The audit script is run by hand against a fixture
 *   batch — TODO add an integration test that drives a weak essay through
 *   L5+L6+inlineEditor and asserts no unbracketed percentages / dollar
 *   amounts / headcounts appear in output text fields.
 *
 * Run: npx tsx tests/test-port-g1-fabrication-guard.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { buildFabricationGuardBlock } from '../src/lib/llm/fabricationGuard';
import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
} from '../src/lib/llm/promptBlockVersions';

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

console.log('Port G1 — Fabricated-Metrics Anti-Fabrication Guard (SAFETY P0)');

// ---------------------------------------------------------------------------
// 1. Block slot pre-claimed + declared prescriptive
// ---------------------------------------------------------------------------

assert(
  PROMPT_BLOCK_VERSIONS.G1_FABRICATION_GUARD === 'v1.0.0',
  `G1_FABRICATION_GUARD version is v1.0.0 (got ${PROMPT_BLOCK_VERSIONS.G1_FABRICATION_GUARD})`,
);
assert(
  PROMPT_BLOCK_DECLARATIONS.G1_FABRICATION_GUARD.level === 'prescriptive',
  `G1 declared at 'prescriptive' level (got ${PROMPT_BLOCK_DECLARATIONS.G1_FABRICATION_GUARD.level})`,
);

// ---------------------------------------------------------------------------
// 2. buildFabricationGuardBlock — wrapper shape
// ---------------------------------------------------------------------------

const block = buildFabricationGuardBlock();
assert(typeof block === 'string' && block.length > 0, 'buildFabricationGuardBlock returns non-empty string');

const openMatch = block.match(BLOCK_OPEN_RE);
const closeMatch = block.match(BLOCK_CLOSE_RE);
assert(openMatch !== null, 'G1 block contains BLOCK open marker');
assert(closeMatch !== null, 'G1 block contains BLOCK close marker');
assert(
  openMatch?.[1] === 'G1_FABRICATION_GUARD',
  `Open marker blockId is G1_FABRICATION_GUARD (got ${openMatch?.[1]})`,
);
assert(
  openMatch?.[2] === 'v1.0.0',
  `Open marker version is v1.0.0 (got ${openMatch?.[2]})`,
);
assert(
  closeMatch?.[1] === 'G1_FABRICATION_GUARD',
  `Close marker blockId is G1_FABRICATION_GUARD (got ${closeMatch?.[1]})`,
);

// ---------------------------------------------------------------------------
// 3. Block body — FINAL CHECK 5-step contract (verbatim anchors)
// ---------------------------------------------------------------------------

assert(
  block.includes('FINAL CHECK'),
  'Block body contains FINAL CHECK header',
);
assert(
  block.includes('FABRICATED METRICS GUARD'),
  'Block body contains FABRICATED METRICS GUARD label',
);
assert(
  block.includes('SAFETY'),
  'Block body flags SAFETY criticality',
);

// All 5 audit steps present.
assert(
  /1\. Scan your output for NUMERIC DETAILS/.test(block),
  'Step 1 — Scan for NUMERIC DETAILS present',
);
assert(
  /2\. For each numeric detail, ask/.test(block),
  'Step 2 — per-detail presence check present',
);
assert(
  /3\. If YES — emit the value as-is/.test(block),
  'Step 3 — emit-as-is branch present',
);
assert(
  /4\. If NO — wrap it in brackets/.test(block),
  'Step 4 — bracket-wrapping branch present',
);
assert(
  /5\. NEVER emit a confident specific number/.test(block),
  'Step 5 — hard NEVER-emit rule present',
);

// Bracket-syntax examples present (compatibility with inlineEditor [X] convention).
assert(
  block.includes('[X%]'),
  'Block body shows [X%] bracket syntax',
);
assert(
  block.includes('[N people]'),
  'Block body shows [N people] bracket syntax',
);
assert(
  block.includes('[$Y]'),
  'Block body shows [$Y] bracket syntax',
);
assert(
  block.includes('[placeholder]'),
  'Block body offers generic [placeholder] escape',
);

// ---------------------------------------------------------------------------
// 4. Integrity / rescission warning — safety rationale is load-bearing
// ---------------------------------------------------------------------------

assert(
  block.includes('college application'),
  'Block body names the downstream risk surface (college application)',
);
assert(
  block.toLowerCase().includes('integrity violation'),
  'Block body names the specific harm (integrity violation)',
);
assert(
  block.toLowerCase().includes('rescission'),
  'Block body names the consequence (rescission)',
);

// ---------------------------------------------------------------------------
// 5. Generative prompt surfaces import + invoke G1
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, '..');

const GENERATIVE_SURFACES = [
  'src/services/essayIntelligence/analysis/deepAnnotationService.ts',
  'src/services/essayIntelligence/coaching/coachingService.ts',
  'src/services/inlineEditor/commandPrompts.ts',
];

for (const rel of GENERATIVE_SURFACES) {
  const abs = resolve(repoRoot, rel);
  const src = readFileSync(abs, 'utf8');
  assert(
    src.includes("from '../../../lib/llm/fabricationGuard'") ||
      src.includes("from '../../lib/llm/fabricationGuard'"),
    `${rel} imports fabricationGuard`,
  );
  assert(
    src.includes('buildFabricationGuardBlock()'),
    `${rel} invokes buildFabricationGuardBlock()`,
  );
}

// ---------------------------------------------------------------------------
// 6. ANALYTICAL prompt surfaces do NOT import G1 (scope discipline)
// ---------------------------------------------------------------------------
// L1 / L3 / L3.5 / L3.75 / L4 emit descriptions / classifications, not rewrite
// examples. Injecting G1 into these would (a) pollute their cacheable prefix
// for no safety gain, (b) confuse the LLM about its role (analytical vs
// generative), and (c) risk tripping the descriptive-contract lint if the
// analytical prompt is descriptive-level.

const ANALYTICAL_SURFACES = [
  'src/services/essayIntelligence/analysis/firstImpressions.ts',       // L1
  'src/services/essayIntelligence/analysis/sequentialDeepWalk.ts',     // L3
  'src/services/essayIntelligence/analysis/holisticSynthesis.ts',      // L3.75
  'src/services/essayIntelligence/analysis/analysisPass.ts',           // L3.5
  'src/services/essayIntelligence/analysis/crystallizer.ts',           // L4
];

for (const rel of ANALYTICAL_SURFACES) {
  const abs = resolve(repoRoot, rel);
  let src: string;
  try {
    src = readFileSync(abs, 'utf8');
  } catch {
    // File not present in this build — skip.
    continue;
  }
  assert(
    !src.includes('fabricationGuard') && !src.includes('buildFabricationGuardBlock'),
    `${rel} does NOT import G1 (analytical scope — generative-only guard)`,
  );
}

// ---------------------------------------------------------------------------
// 7. Idempotent wrapping (defensive re-wrap stays stable)
// ---------------------------------------------------------------------------
// The underlying withPromptBlockVersion helper strips an existing matching
// open marker and re-applies. Calling buildFabricationGuardBlock twice must
// produce string-identical output.

const block2 = buildFabricationGuardBlock();
assert(block === block2, 'buildFabricationGuardBlock is deterministic across calls');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
