/**
 * howler-persistence.test.ts — Regression test for Critical Bug #1 from the
 * April 14 E2E audit: howler items (clichés, factual errors, red flags)
 * disappearing from the manifest after any single-paragraph edit.
 *
 * BUG DESCRIPTION
 *   Pre-edit manifest had 12 items including IMP_10 (seven-notes factual),
 *   IMP_11 ("make a meaningful difference" cliché), IMP_12 ("timeless melody"
 *   cliché). After T4→T5 edit triggered a rebuild, the manifest collapsed
 *   to 8 items — all 3 howlers vanished even though P6/P7 (which contained
 *   IMP_11 and IMP_12) were NEVER edited.
 *
 * FIX (analysisOrchestrator.ts buildImprovementManifest)
 *   1. Howler pass runs against paragraph-reconstructed text (defends
 *      against truncated `essayText` inputs from test harnesses and partial
 *      re-analysis paths).
 *   2. Carry-forward: prior manifest red_flag items whose evidence substring
 *      still appears in the current essay are re-emitted if the fresh pass
 *      didn't already produce them. Dedup key: paragraph+observation.
 *   3. Technique field populated for every howler kind so the planner
 *      prioritizes them (cliche→VOICE AUTHENTICITY, factual_hook→FACTUAL
 *      ACCURACY, duplicate_paragraph→STRUCTURAL REDUNDANCY).
 *
 * Run: npx tsx tests/unit/howler-persistence.test.ts
 * Exit: 0 = pass, 1 = fail.
 */

import { analysisOrchestrator } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import { FindingStore } from '../../src/services/essayIntelligence/findings/findingStore';
import type {
  EssayProfile,
  EssayType,
  ImprovementEntry,
  ImprovementManifest,
} from '../../src/services/essayIntelligence/profileTypes';

type TestFn = () => void;

const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

function test(name: string, fn: TestFn): void {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (err) {
    results.push({
      name,
      pass: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function emptyFindingStore(): FindingStore {
  return FindingStore.deserialize({ findings: [], nextId: 1 });
}

// ── Fixture: piano-essay post-edit paragraphs ──
// P0: revised opening (no clichés, no "seven notes")
// P1–P5: unchanged middle (clean)
// P6: closing with "make a meaningful difference" + "timeless melody"
//     (this is the actual text from replay-post-edit-profile.json line 3847)

const POST_EDIT_PARAGRAPHS: string[] = [
  "The Chopin Nocturne was still ringing in the practice room when I opened my laptop and started debugging the AI DJ's mood detection algorithm.",
  "Composing is like solving a puzzle — the pieces must align in rhythm and harmony. I spent hours experimenting with chord progressions.",
  "Reimagining classical pieces by infusing modern elements became my favorite endeavor. Inspired by Chopin's Nocturnes, I blended them with contemporary jazz rhythms.",
  "As I explored music's complexities, I noticed parallels with coding. I realized that composing music and designing algorithms both require logic and creativity.",
  "I developed an artificially intelligent disc jockey that curates playlists based on emotional cues. My musical background guided me in creating an emotionally resonant AI DJ.",
  "Fine-tuning the AI to interpret subtle cues and generate emotionally resonant tracks was challenging but rewarding. It reaffirmed my belief that music and code share creative DNA.",
  "Whether at a piano or a computer, I'm driven to create and explore the limitless possibilities at my fingertips. Music opened my mind to the beauty of innovation and coding extends that passion. I look forward to continuing this journey, crafting experiences that resonate with others and make a meaningful difference—much like composing a timeless melody.",
];

function makeProfile(
  paragraphTexts: string[],
  priorManifest?: ImprovementManifest,
): EssayProfile {
  const profile = {
    index: { confidenceLevel: 'comprehensive', requiresReanalysis: false },
    metadata: { confidenceLevel: 'comprehensive' },
    paragraphs: paragraphTexts.map((text, i) => ({
      index: i,
      text,
      sentences: [],
      analysis: { growthEdges: [] },
    })),
    northStar: { activeScale: 'personal_statement' },
    improvementCandidateSnapshot: { candidates: [], nextId: 1 },
    scoreMatrix: {
      coachingMap: {
        priorities: [],
        transformativeInsight: {
          insight: '',
          evidenceLocations: [],
          whyThisTransforms: '',
          requiresStudentAwareness: false,
        },
        protectedStrengths: [],
        emergentPatterns: [],
        tensions: [],
      },
    },
    findings: [],
    improvementManifest: priorManifest,
  };
  return profile as unknown as EssayProfile;
}

function makeHowlerItem(
  id: string,
  paragraph: number,
  observation: string,
  evidence: string,
  technique: string | null,
): ImprovementEntry {
  return {
    id,
    paragraph,
    observation,
    action: 'Replace with a concrete detail that only YOU could have written — a specific moment, object, or sensation.',
    stakes: `Surface-level howlers undermine the reader's trust in the essay's craft even when the underlying ideas are strong. AOs flag these in seconds.`,
    technique,
    demonstration: null,
    wordEconomyCut: null,
    source: 'red_flag',
    sourceRef: null,
    priority: Number(id.replace(/[^\d]/g, '')) || 10,
    impact: 'significant',
    conversatorEnrichments: [`[howler:cliche] evidence: ${evidence}`],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

test('fresh pass: detects P6 howlers against paragraph-reconstructed essay text', () => {
  const profile = makeProfile(POST_EDIT_PARAGRAPHS);
  const manifest = analysisOrchestrator.buildImprovementManifest(
    profile,
    emptyFindingStore(),
    // Pass PARAGRAPH-ONLY text to simulate the test-harness bug where
    // `essayText` is a single-paragraph substring. Fix forces howler pass
    // to reconstruct from profile.paragraphs — so it should still detect.
    POST_EDIT_PARAGRAPHS[0],
    'common_app' as EssayType,
  );

  const howlers = manifest.items.filter((i) => i.source === 'red_flag');
  const observations = howlers.map((h) => h.observation).join(' | ');
  assert(
    howlers.length >= 2,
    `expected ≥2 howlers (make a meaningful difference + timeless melody + limitless possibilities), got ${howlers.length}. Items: ${observations}`,
  );
  assert(
    observations.includes('make a meaningful difference'),
    `expected "make a meaningful difference" detected, got: ${observations}`,
  );
  assert(
    observations.includes('timeless melody'),
    `expected "timeless melody" detected, got: ${observations}`,
  );
  assert(
    manifest.sources.includes('howler_pass'),
    `expected 'howler_pass' in sources=${manifest.sources.join(',')}`,
  );
});

test('technique field: every howler kind carries a named technique', () => {
  const profile = makeProfile(POST_EDIT_PARAGRAPHS);
  const manifest = analysisOrchestrator.buildImprovementManifest(
    profile,
    emptyFindingStore(),
    POST_EDIT_PARAGRAPHS.join('\n\n'),
    'common_app' as EssayType,
  );

  const howlers = manifest.items.filter((i) => i.source === 'red_flag');
  assert(howlers.length >= 1, 'need at least one howler to test technique field');
  for (const h of howlers) {
    assert(
      h.technique !== null && h.technique.length > 0,
      `howler "${h.observation}" has null technique — planner will deprioritize it`,
    );
    // Audit-specified mapping
    if (h.observation.toLowerCase().includes('cliché')) {
      assert(
        h.technique === 'VOICE AUTHENTICITY',
        `cliché howlers must route to VOICE AUTHENTICITY, got ${h.technique}`,
      );
    }
    if (h.observation.toLowerCase().includes('factual')) {
      assert(
        h.technique === 'FACTUAL ACCURACY',
        `factual howlers must route to FACTUAL ACCURACY, got ${h.technique}`,
      );
    }
    if (h.observation.toLowerCase().includes('structural redundancy')) {
      assert(
        h.technique === 'STRUCTURAL REDUNDANCY',
        `duplicate-paragraph howlers must route to STRUCTURAL REDUNDANCY, got ${h.technique}`,
      );
    }
  }
});

test('carry-forward: prior red_flag items survive when evidence still present after unrelated edit', () => {
  // Simulate: prior manifest built against full essay, student edits ONLY P0.
  // Rebuild runs with new P0 text but P6 (containing clichés) unchanged.
  // Even if the fresh howler pass were broken, carry-forward must preserve
  // the prior detections.

  const priorManifest: ImprovementManifest = {
    items: [
      makeHowlerItem(
        'IMP_11',
        -1,
        `Cliché: Convergence-zone phrase: "make a meaningful difference"`,
        'make a meaningful difference',
        'VOICE AUTHENTICITY',
      ),
      makeHowlerItem(
        'IMP_12',
        -1,
        `Cliché: Convergence-zone phrase: "timeless melody"`,
        'timeless melody',
        'VOICE AUTHENTICITY',
      ),
    ],
    generatedAt: '2026-04-14T00:00:00.000Z',
    sources: ['l4_priorities', 'howler_pass'],
    wordCount: 343,
    wordLimit: 650,
  };

  const profile = makeProfile(POST_EDIT_PARAGRAPHS, priorManifest);
  const manifest = analysisOrchestrator.buildImprovementManifest(
    profile,
    emptyFindingStore(),
    // Simulate the test-harness bug: essayText is paragraph-only, fresh
    // howler pass reconstructs from profile but carry-forward is the
    // belt-and-suspenders layer regardless.
    POST_EDIT_PARAGRAPHS[0],
    'common_app' as EssayType,
  );

  const howlers = manifest.items.filter((i) => i.source === 'red_flag');
  const observations = howlers.map((h) => h.observation).join(' | ');

  assert(
    observations.includes('make a meaningful difference'),
    `carry-forward failed: "make a meaningful difference" not preserved. observations=${observations}`,
  );
  assert(
    observations.includes('timeless melody'),
    `carry-forward failed: "timeless melody" not preserved. observations=${observations}`,
  );
});

test('carry-forward dedup: does not double-emit howlers already produced by fresh pass', () => {
  const priorManifest: ImprovementManifest = {
    items: [
      makeHowlerItem(
        'IMP_11',
        -1,
        `Cliché: Convergence-zone phrase: "make a meaningful difference"`,
        'make a meaningful difference',
        'VOICE AUTHENTICITY',
      ),
    ],
    generatedAt: '2026-04-14T00:00:00.000Z',
    sources: ['howler_pass'],
    wordCount: 343,
    wordLimit: 650,
  };

  const profile = makeProfile(POST_EDIT_PARAGRAPHS, priorManifest);
  const manifest = analysisOrchestrator.buildImprovementManifest(
    profile,
    emptyFindingStore(),
    POST_EDIT_PARAGRAPHS.join('\n\n'),
    'common_app' as EssayType,
  );

  const howlerCount = manifest.items.filter(
    (i) =>
      i.source === 'red_flag' &&
      i.observation.includes('make a meaningful difference'),
  ).length;
  assert(
    howlerCount === 1,
    `expected exactly 1 "make a meaningful difference" howler (dedup), got ${howlerCount}`,
  );
});

test('carry-forward drop: prior red_flag whose evidence was removed is NOT carried forward', () => {
  // Student fixed the "seven notes" error. Prior manifest had IMP_10 for it.
  // Current essay has no "seven notes" phrase anywhere. Carry-forward must
  // drop this item — the student already addressed it.
  const priorManifest: ImprovementManifest = {
    items: [
      {
        id: 'IMP_10',
        paragraph: -1,
        observation: `Factual issue: Claims "just seven notes" as the full vocabulary of Western music.`,
        action: 'Western music has twelve pitch classes (chromatic scale).',
        stakes: 'stakes-text',
        technique: 'FACTUAL ACCURACY',
        demonstration: null,
        wordEconomyCut: null,
        source: 'red_flag',
        sourceRef: null,
        priority: 10,
        impact: 'significant',
        conversatorEnrichments: [`[howler:factual_hook] evidence: just seven notes`],
      },
    ],
    generatedAt: '2026-04-14T00:00:00.000Z',
    sources: ['howler_pass'],
    wordCount: 343,
    wordLimit: 650,
  };

  // POST_EDIT_PARAGRAPHS has NO "seven notes" phrase anywhere.
  const profile = makeProfile(POST_EDIT_PARAGRAPHS, priorManifest);
  const manifest = analysisOrchestrator.buildImprovementManifest(
    profile,
    emptyFindingStore(),
    POST_EDIT_PARAGRAPHS.join('\n\n'),
    'common_app' as EssayType,
  );

  const sevenNotesItems = manifest.items.filter((i) =>
    i.observation.toLowerCase().includes('seven notes'),
  );
  assert(
    sevenNotesItems.length === 0,
    `expected "seven notes" item to be DROPPED (student fixed it), got ${sevenNotesItems.length} items`,
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════');
console.log('UNIT: howler persistence across rebuild (Critical Bug #1 regression)');
console.log('═══════════════════════════════════════════════════════════════════');
for (const r of results) {
  const mark = r.pass ? '[✓]' : '[✗]';
  console.log(`  ${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
const passed = results.filter((r) => r.pass).length;
console.log('───────────────────────────────────────────────────────────────────');
console.log(`  ${passed}/${results.length} passed`);
console.log('═══════════════════════════════════════════════════════════════════');
process.exit(passed === results.length ? 0 : 1);
