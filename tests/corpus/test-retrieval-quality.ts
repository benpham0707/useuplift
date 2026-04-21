/**
 * tests/corpus/test-retrieval-quality.ts
 *
 * Golden-query suite for Phase 2E retrieval quality validation. Each query has
 * an expected set of move IDs / archetype IDs that MUST appear in top-k results.
 *
 * Run: `npx tsx tests/corpus/test-retrieval-quality.ts`
 *
 * Requires env vars OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Fails if precision@k drops below thresholds. Skips with warning if env
 * is incomplete (so tests don't block in environments without API keys).
 */

import {
  retrieveMovesBySignal,
  retrieveArchetypeMatches,
  retrievePairedMoves,
  retrieveAntiPatterns,
  getForbiddenArchetypesForVoice,
} from '../../src/services/essayIntelligence/corpus/retrieval';

interface GoldenQuery {
  id: string;
  description: string;
  queryText: string;
  expectedMoveIds?: string[]; // at least N of these must appear in top-k
  expectedArchetypeIds?: string[];
  expectedInTopK: number; // required overlap count
  k: number;
  queryType: 'move' | 'archetype' | 'anti-pattern';
}

// ─────────────────────────────────────────────────────────────────────────
// Golden query suite
// ─────────────────────────────────────────────────────────────────────────

const GOLDEN_QUERIES: GoldenQuery[] = [
  // — Move retrieval —
  {
    id: 'extended-metaphor-student-query',
    description: 'Student asks about sustaining an extended metaphor',
    queryText: 'My essay uses a single dance metaphor across multiple paragraphs — how do I make the metaphor pay off at the close?',
    expectedMoveIds: [
      'extended-metaphor-priming',
      'verb-possession-of-specialized-register',
      'final-possession-assertion',
      'metaphor-bridge-as-hinge',
    ],
    expectedInTopK: 2,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'reveal-through-consequence',
    description: 'Student describes disclosing a fact through action not declaration',
    queryText: 'I want to reveal a difficult family situation without stating it directly, through what happens to me',
    expectedMoveIds: ['reveal-through-consequence', 'name-central-fact-once'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'triplet-refutation',
    description: 'Student drafting a triplet of identities to be refuted',
    queryText: 'I have three different ways I stick out as a student and I want to list them and then show how each one actually works',
    expectedMoveIds: ['triplet-anaphora-of-difference', 'refutation-triplet-mirror'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'plain-voice-sacrifice',
    description: 'Student writing about a parent\'s sacrifice in direct voice',
    queryText: 'My essay is about my mother working away from home so I can stay in school, and I want to use plain voice without metaphor',
    expectedMoveIds: [
      'one-word-identity-distinction',
      'time-stamped-ritual-structure',
      'embodied-language-parental-sacrifice',
      'mirror-but-not-symmetric-closing-commitment',
    ],
    expectedInTopK: 2,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'scientific-metaphor',
    description: 'Student discovering a scientific mechanism that describes their experience',
    queryText: 'I realized in biology class that osmosis literally describes what I was experiencing during my ELL years',
    expectedMoveIds: ['scientific-literalization-of-metaphor', 'chiastic-thesis-line'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'cookie-baking-topic',
    description: 'Small mundane topic queried',
    queryText: 'My essay is about baking cookies and I want to show my intellectual curiosity without making it feel forced',
    expectedMoveIds: [
      'paradox-thesis-opening-sentence',
      'cross-domain-sensory-synthesis',
      'literalization-dead-idiom-humor',
    ],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'hopkins-textbook-opener',
    description: 'Ellie-style textbook opener',
    queryText: 'I want to start my essay by defining a scientific concept formally, then break the register',
    expectedMoveIds: ['textbook-voice-opening', 'two-word-textbook-break'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'hopkins-field-catalog',
    description: 'Shotaro-style interdisciplinary catalog',
    queryText: 'I want to show how my worldbuilding hobby drew me into history, geology, and computer science',
    expectedMoveIds: ['parenthetical-field-catalog', 'hobby-as-agent-of-curiosity'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'hopkins-vocabulary-curriculum',
    description: 'Nancy-style vocabulary-as-structure',
    queryText: 'I want to use Korean vocabulary words as section headers to structure my essay about cultural reclamation',
    expectedMoveIds: [
      'vocabulary-entry-as-section-header',
      'code-switching-within-english-prose',
      'closing-with-taught-vocabulary-in-native-use',
    ],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },
  {
    id: 'hopkins-mirror-bookend',
    description: 'Emily-style mirror bookend',
    queryText: 'I want to open and close my essay in the same physical location to show interior change',
    expectedMoveIds: ['mirror-bookend-architecture', 'opening-phrase-callback-at-close'],
    expectedInTopK: 1,
    k: 8,
    queryType: 'move',
  },

  // — Archetype retrieval —
  {
    id: 'archetype-interior-transformation',
    description: 'Draft describes transformation-via-metaphor-possession',
    queryText: 'An essay about replacing dancing with writing through the same vocabulary',
    expectedArchetypeIds: ['interior-transformation-metaphor-possession'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'archetype',
  },
  {
    id: 'archetype-plain-voice-sacrifice',
    description: 'Draft describes plain-voice sacrifice essay',
    queryText: 'Essay about a mother\'s sacrifice told in plain voice without literary metaphor',
    expectedArchetypeIds: ['plain-voice-sacrifice-ritual'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'archetype',
  },
  {
    id: 'archetype-bait-and-switch',
    description: 'Draft opens comedically, reveals layered identity',
    queryText: 'Essay that starts with a funny scene at a store then reveals multiple overlapping identities',
    expectedArchetypeIds: ['bait-and-switch-foil-refutation'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'archetype',
  },
  {
    id: 'archetype-compressed-heritage',
    description: 'Draft compresses family history into few paragraphs',
    queryText: 'Short essay about my grandmother\'s immigration history compressed into a single paragraph',
    expectedArchetypeIds: ['compressed-heritage'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'archetype',
  },
  {
    id: 'archetype-hopkins-worldbuilding',
    description: 'Shotaro-style single-project interdisciplinary',
    queryText: 'Essay centered on a single creative project that pulled in multiple academic fields',
    expectedArchetypeIds: ['building-a-universe-interdisciplinary-obsession'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'archetype',
  },

  // — Anti-pattern retrieval —
  {
    id: 'anti-sports-injury',
    description: 'Draft sounds like sports injury comeback anti-pattern',
    queryText: 'My essay is about the moment I tore my ACL during a championship game and how I came back stronger',
    expectedMoveIds: ['sports-injury-comeback'], // interpreted as anti-pattern id
    expectedInTopK: 1,
    k: 5,
    queryType: 'anti-pattern',
  },
  {
    id: 'anti-dead-grandparent',
    description: 'Dead-grandparent-wisdom anti-pattern',
    queryText: 'My essay describes the lessons my late grandfather taught me and how I carry his wisdom',
    expectedMoveIds: ['dead-grandparent-wisdom'],
    expectedInTopK: 1,
    k: 5,
    queryType: 'anti-pattern',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────

const failures: string[] = [];
const warnings: string[] = [];
let executed = 0;
let skipped = 0;

function fail(check: string, msg: string) {
  failures.push(`[${check}] ${msg}`);
}

function warn(check: string, msg: string) {
  warnings.push(`[${check}] ${msg}`);
}

async function runGolden(q: GoldenQuery): Promise<void> {
  try {
    if (q.queryType === 'move') {
      const results = await retrieveMovesBySignal(q.queryText, {}, q.k);
      const retrievedIds = new Set(results.map((r) => r.entity.id));
      const expected = q.expectedMoveIds ?? [];
      const overlap = expected.filter((id) => retrievedIds.has(id)).length;
      if (overlap < q.expectedInTopK) {
        fail(
          q.id,
          `expected ≥${q.expectedInTopK} of [${expected.join(', ')}] in top-${q.k}, got ${overlap}. Top retrieved: ${[...retrievedIds].slice(0, 5).join(', ')}`,
        );
      }
    } else if (q.queryType === 'archetype') {
      const results = await retrieveArchetypeMatches(q.queryText, { k: q.k });
      const retrievedIds = new Set(results.map((r) => r.entity.id));
      const expected = q.expectedArchetypeIds ?? [];
      const overlap = expected.filter((id) => retrievedIds.has(id)).length;
      if (overlap < q.expectedInTopK) {
        fail(
          q.id,
          `expected ≥${q.expectedInTopK} of [${expected.join(', ')}] in top-${q.k}, got ${overlap}. Top retrieved: ${[...retrievedIds].slice(0, 5).join(', ')}`,
        );
      }
    } else if (q.queryType === 'anti-pattern') {
      const results = await retrieveAntiPatterns(q.queryText, q.k);
      const retrievedIds = new Set(results.map((r) => r.id));
      const expected = q.expectedMoveIds ?? [];
      const overlap = expected.filter((id) => retrievedIds.has(id)).length;
      if (overlap < q.expectedInTopK) {
        fail(
          q.id,
          `expected ≥${q.expectedInTopK} of [${expected.join(', ')}] in top-${q.k}, got ${overlap}. Top retrieved: ${[...retrievedIds].slice(0, 5).join(', ')}`,
        );
      }
    }
    executed++;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Missing OPENAI_API_KEY') || msg.includes('Missing SUPABASE')) {
      warn(q.id, `skipped — ${msg}`);
      skipped++;
      return;
    }
    fail(q.id, `runtime error: ${msg}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Non-retrieval checks (always runnable — no API needed)
// ─────────────────────────────────────────────────────────────────────────

function checkSafetyRail() {
  console.log('CHECK: voice×archetype safety rail returns expected forbidden sets...');
  const plainForbidden = getForbiddenArchetypesForVoice('plain');
  const maximalistForbidden = getForbiddenArchetypesForVoice('maximalist');
  if (!plainForbidden.has('obsession-intellectual-autobiography-maximalist')) {
    fail('safety-rail', 'plain voice should have obsession-intellectual-autobiography-maximalist as forbidden');
  }
  if (!maximalistForbidden.has('strategic-balance-plain-prose')) {
    fail('safety-rail', 'maximalist voice should have strategic-balance-plain-prose as forbidden');
  }
  if (!maximalistForbidden.has('plain-voice-sacrifice-ritual')) {
    fail('safety-rail', 'maximalist voice should have plain-voice-sacrifice-ritual as forbidden');
  }
  if (!maximalistForbidden.has('compressed-heritage')) {
    fail('safety-rail', 'maximalist voice should have compressed-heritage as forbidden');
  }
}

async function checkPairedMovesIndex() {
  console.log('CHECK: per-move correlation index loads and returns strong pairs...');
  const pairs = await retrievePairedMoves('verb-possession-of-specialized-register', { k: 5 });
  if (pairs.length === 0) {
    fail('paired-moves', 'verb-possession-of-specialized-register should have paired moves');
    return;
  }
  const pairedIds = new Set(pairs.map((p) => p.move.id));
  if (!pairedIds.has('extended-metaphor-priming') && !pairedIds.has('final-possession-assertion') && !pairedIds.has('motion-verb-mark-shape-coupling')) {
    fail('paired-moves', 'verb-possession paired moves should include at least one of: extended-metaphor-priming, final-possession-assertion, motion-verb-mark-shape-coupling');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PHASE 2E — Retrieval Quality Test Suite');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Non-retrieval checks first (no API dependency)
  checkSafetyRail();
  await checkPairedMovesIndex();

  // Retrieval checks (require OpenAI + Supabase)
  console.log(`\nRetrieval golden-query suite: ${GOLDEN_QUERIES.length} queries\n`);
  for (const q of GOLDEN_QUERIES) {
    process.stdout.write(`  ${q.id}... `);
    const before = failures.length;
    await runGolden(q);
    const skipped_ = warnings.some((w) => w.startsWith(`[${q.id}] skipped`));
    if (skipped_) {
      console.log('SKIP');
    } else if (failures.length > before) {
      console.log('FAIL');
    } else {
      console.log('PASS');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`EXECUTED: ${executed}/${GOLDEN_QUERIES.length} retrieval queries`);
  console.log(`SKIPPED:  ${skipped} (missing env — not a failure)`);
  console.log(`WARNINGS: ${warnings.length}`);
  console.log(`FAILURES: ${failures.length}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
