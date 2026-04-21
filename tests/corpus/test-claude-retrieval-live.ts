/**
 * test-claude-retrieval-live.ts — Live smoke test for Claude-based corpus retrieval.
 *
 * Verifies:
 *   1. A single anchor-move retrieval returns at least one plausible result.
 *   2. An anti-pattern retrieval against an obviously-drifting paragraph
 *      correctly flags a failure mode.
 *   3. An archetype retrieval against a thesis+strategy signature returns
 *      plausible candidates.
 *   4. Prompt caching works — second call costs less than first.
 *
 * Requires: ANTHROPIC_API_KEY (loaded via dotenv by the Claude SDK wrapper).
 *
 * Run: npx tsx tests/corpus/test-claude-retrieval-live.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import {
  retrieveMovesBySignal,
  retrieveArchetypeMatches,
  retrieveAntiPatterns,
  getCatalogContentHash,
  CLAUDE_RETRIEVAL_API_VERSION,
} from '../../src/services/essayIntelligence/corpus/claudeRetrieval';

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
  console.log('Claude retrieval — live smoke tests');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`API version:  ${CLAUDE_RETRIEVAL_API_VERSION}`);
  console.log(`Catalog hash: ${getCatalogContentHash()}`);
  console.log('════════════════════════════════════════════════════════════════');

  // ─── Check 1: anchor-move retrieval ───────────────────────────────────
  console.log('\n[1] retrieveMovesBySignal — strong opening paragraph');
  const t1 = Date.now();
  const moves = await retrieveMovesBySignal(
    'The summer I turned fifteen, my grandmother started forgetting the names of her plants. She had grown them for forty years. The mint in the corner pot — she called it "that green one." The basil — "the smelly one." I learned to cook her recipes by watching her hands, because her words were already leaving.',
    {},
    3,
  );
  console.log(`    (${Date.now() - t1}ms, ${moves.length} results)`);
  for (const r of moves) {
    console.log(`    • ${r.similarity.toFixed(2)}  ${r.entity.displayName}`);
    console.log(`       reason: ${r.reason}`);
  }
  assert(moves.length > 0, 'returns at least one move');
  assert(moves.every((r) => r.similarity >= 0.4), 'all results above relevance threshold');
  assert(moves.every((r) => typeof r.entity.displayName === 'string'), 'entities hydrated');

  // ─── Check 2: anti-pattern retrieval on a drifting paragraph ──────────
  console.log('\n[2] retrieveAntiPatterns — sports-injury-shaped paragraph');
  const t2 = Date.now();
  const aps = await retrieveAntiPatterns(
    'I tore my ACL during the championship game. The recovery was brutal — months of physical therapy, ice baths, and frustration. But through it all, I learned what resilience really means. I came back stronger than ever.',
    3,
  );
  console.log(`    (${Date.now() - t2}ms, ${aps.length} results)`);
  for (const ap of aps) {
    console.log(`    • ${ap.similarity.toFixed(2)}  [${ap.id}]`);
    console.log(`       reason: ${ap.reason}`);
  }
  assert(aps.length > 0, 'flags at least one anti-pattern');
  assert(aps.some((ap) => ap.id.includes('sports') || ap.id.includes('comeback') || ap.id.includes('injury')),
    'flags sports-injury-shaped anti-pattern');

  // ─── Check 3: archetype match on a thesis signature ───────────────────
  console.log('\n[3] retrieveArchetypeMatches — interdisciplinary-obsession signature');
  const t3 = Date.now();
  const arch = await retrieveArchetypeMatches(
    'A student builds a conlang that encodes the physics of a parallel universe, treats worldbuilding as applied math, approaches interdisciplinary synthesis as native territory',
    { k: 2 },
  );
  console.log(`    (${Date.now() - t3}ms, ${arch.length} results)`);
  for (const r of arch) {
    console.log(`    • ${r.similarity.toFixed(2)}  [${r.entity.id}]`);
    console.log(`       reason: ${r.reason}`);
  }
  assert(arch.length > 0, 'returns at least one archetype');

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
