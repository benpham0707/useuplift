#!/usr/bin/env tsx
/**
 * Port B1 — PIQ 40-pattern + Common App 35-pattern Issue Library smoke test
 *
 * Verifies:
 *   1. PATTERN_INDEX has ≥ 41 + 28 = 69 entries (verdict floor) and all IDs
 *      are namespaced ('piq:*' or 'common_app:*').
 *   2. PATTERN_STATS reports PIQ + CommonApp counts matching the index size.
 *   3. getFilteredCatalog('piq') returns top-15 PIQ-only patterns ordered
 *      severity-first.
 *   4. getFilteredCatalog('common_app') returns top-15 CommonApp-only.
 *   5. getFilteredCatalog('supplement') returns top-15 patterns from the
 *      supplement pool (currently re-uses Common App patterns that declare
 *      'supplement' in sourceEssayTypes).
 *   6. buildPatternCatalogBlock(null/undefined) → '' (baseline cache preserved).
 *   7. buildPatternCatalogBlock('piq') returns content wrapped with
 *      B1_PATTERN_LIBRARY block-version markers (cache-key divergence seed).
 *   8. Block body contains the OpenEnum "`open`" escape-hatch instruction,
 *      the "KNOWN PATTERN CATALOG" header, and both `patternMatches` /
 *      `paragraphPatternMatches` emission-scope directives.
 *   9. Architectural-scope discipline: block instructs the LLM to route
 *      hook/arc/coherence patterns to `paragraphPatternMatches`, not
 *      duplicate them per sentence.
 *  10. KnowledgePatternMatch type accepts the `open: string | null` field
 *      alongside the legacy `patternOpen` alias (compile-time check).
 *
 *  11. Pattern-ID stability on unchanged text: two filtered-catalog calls
 *      with the same essayType produce identical ordered IDs (reproducibility
 *      proxy for the ≥80% stability verdict measurement).
 *
 *  12. Measurement fixture placeholder — 10-essay regression target:
 *      (a) ≥60% of weaknesses carry a patternId, (b) ≥80% patternId
 *      stability on unchanged text, (c) human-eval post-merge.
 *      Documented as a TODO — full E2E regression lives in a separate
 *      Sonnet-call test that requires ANTHROPIC_API_KEY.
 *
 * Run: npx tsx tests/test-port-b1-pattern-library.ts
 */

import {
  PATTERN_INDEX,
  PATTERN_STATS,
  getFilteredCatalog,
  renderCatalogLines,
  isKnownPatternId,
  type PatternSummary,
} from '../src/services/essayIntelligence/taxonomies/issuePatternIndex';
import { buildPatternCatalogBlock, PATTERN_CATALOG_TOP_N } from '../src/services/essayIntelligence/analysis/patternCatalogBlock';
import { BLOCK_OPEN_RE, BLOCK_CLOSE_RE } from '../src/lib/llm/promptBlockVersions';
import type { KnowledgePatternMatch } from '../src/services/essayIntelligence/profileTypes';

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

console.log('Port B1 — pattern-library index + L3.5 catalog block');

// -------------------------------------------------------------------------
// 1-2. PATTERN_INDEX shape and counts
// -------------------------------------------------------------------------
assert(PATTERN_INDEX instanceof Map, 'PATTERN_INDEX is a Map');
assert(
  PATTERN_STATS.piqCount === 40,
  `PATTERN_STATS.piqCount = 40 (got ${PATTERN_STATS.piqCount})`,
);
assert(
  PATTERN_STATS.commonAppCount === 35,
  `PATTERN_STATS.commonAppCount = 35 (got ${PATTERN_STATS.commonAppCount})`,
);
assert(
  PATTERN_INDEX.size === PATTERN_STATS.totalCount,
  `PATTERN_INDEX.size = totalCount (got ${PATTERN_INDEX.size} vs ${PATTERN_STATS.totalCount})`,
);
// Verdict floor: 41 + 28 = 69. Our counts are 40 + 35 = 75 (≥ floor).
assert(
  PATTERN_INDEX.size >= 69,
  `PATTERN_INDEX.size ≥ 69 verdict floor (got ${PATTERN_INDEX.size})`,
);

// All IDs namespaced.
const allNamespaced = Array.from(PATTERN_INDEX.keys()).every(
  (id) => id.startsWith('piq:') || id.startsWith('common_app:'),
);
assert(allNamespaced, 'All PATTERN_INDEX IDs namespaced (piq:* or common_app:*)');

// Every entry has required fields populated.
let allShapesValid = true;
for (const [id, summary] of PATTERN_INDEX.entries()) {
  if (
    summary.id !== id ||
    typeof summary.dimension !== 'string' ||
    summary.dimension.length === 0 ||
    !['critical', 'major', 'minor'].includes(summary.severity) ||
    typeof summary.oneLineTrigger !== 'string' ||
    summary.oneLineTrigger.length === 0 ||
    summary.oneLineTrigger.length > 200 ||
    !Array.isArray(summary.sourceEssayTypes) ||
    summary.sourceEssayTypes.length === 0
  ) {
    console.error(`    shape violation on ${id}:`, summary);
    allShapesValid = false;
  }
}
assert(allShapesValid, 'Every PATTERN_INDEX entry has required fields + valid shape');

// isKnownPatternId behavior
assert(isKnownPatternId('piq:hook-weak-generic'), 'isKnownPatternId accepts known PIQ id');
assert(isKnownPatternId('common_app:ai-patterns'), 'isKnownPatternId accepts known Common App id');
assert(!isKnownPatternId('piq:made-up-id'), 'isKnownPatternId rejects hallucinated PIQ id');
assert(!isKnownPatternId(''), 'isKnownPatternId rejects empty string');

// -------------------------------------------------------------------------
// 3-5. getFilteredCatalog behavior per essayType
// -------------------------------------------------------------------------
const piqCatalog = getFilteredCatalog('piq');
assert(piqCatalog.length === PATTERN_CATALOG_TOP_N, `PIQ catalog is top-${PATTERN_CATALOG_TOP_N} (got ${piqCatalog.length})`);
assert(
  piqCatalog.every((p) => p.id.startsWith('piq:')),
  'PIQ catalog entries are all piq:* (essayType isolation)',
);

const caCatalog = getFilteredCatalog('common_app');
assert(caCatalog.length === PATTERN_CATALOG_TOP_N, `Common App catalog is top-${PATTERN_CATALOG_TOP_N}`);
assert(
  caCatalog.every((p) => p.id.startsWith('common_app:')),
  'Common App catalog entries are all common_app:* (essayType isolation)',
);

const supCatalog = getFilteredCatalog('supplement');
assert(supCatalog.length === PATTERN_CATALOG_TOP_N, `Supplement catalog is top-${PATTERN_CATALOG_TOP_N}`);
assert(
  supCatalog.every((p) => p.sourceEssayTypes.includes('supplement')),
  'Supplement catalog entries all declare supplement in sourceEssayTypes',
);

// Severity ordering within PIQ pool (critical entries appear before any minor).
const piqSeverities = piqCatalog.map((p) => p.severity);
const lastCriticalIdx = piqSeverities.lastIndexOf('critical');
const firstMinorIdx = piqSeverities.indexOf('minor');
if (lastCriticalIdx !== -1 && firstMinorIdx !== -1) {
  assert(
    lastCriticalIdx < firstMinorIdx,
    'PIQ catalog orders critical patterns before minor patterns',
  );
}

// Top-N clamp: passing topN > pool size should return the full pool, not error.
const bigN = getFilteredCatalog('piq', 1000);
assert(bigN.length === PATTERN_STATS.piqCount, 'topN > pool size returns full pool, not truncated');

// topN=0 returns empty.
assert(getFilteredCatalog('piq', 0).length === 0, 'topN=0 returns empty');

// -------------------------------------------------------------------------
// 6-9. buildPatternCatalogBlock block-version wrapping + prompt contents
// -------------------------------------------------------------------------
assert(buildPatternCatalogBlock(null) === '', 'buildPatternCatalogBlock(null) === ""');
assert(buildPatternCatalogBlock(undefined) === '', 'buildPatternCatalogBlock(undefined) === ""');

const piqBlock = buildPatternCatalogBlock('piq');
assert(piqBlock.length > 0, 'buildPatternCatalogBlock("piq") returns non-empty');
const openMatch = piqBlock.match(BLOCK_OPEN_RE);
const closeMatch = piqBlock.match(BLOCK_CLOSE_RE);
assert(openMatch !== null, 'PIQ catalog block contains BLOCK open marker');
assert(closeMatch !== null, 'PIQ catalog block contains BLOCK close marker');
assert(openMatch?.[1] === 'B1_PATTERN_LIBRARY', `Open marker blockId is B1_PATTERN_LIBRARY (got ${openMatch?.[1]})`);
assert(closeMatch?.[1] === 'B1_PATTERN_LIBRARY', 'Close marker blockId is B1_PATTERN_LIBRARY');

assert(piqBlock.includes('KNOWN PATTERN CATALOG'), 'Block body contains KNOWN PATTERN CATALOG header');
assert(
  piqBlock.includes('`open`'),
  'Block body explains the `open` escape hatch (OpenEnum convention)',
);
assert(
  piqBlock.includes('patternMatches'),
  'Block body references the sentence-level patternMatches output channel',
);
assert(
  piqBlock.includes('paragraphPatternMatches'),
  'Block body references the paragraph-level paragraphPatternMatches channel',
);
assert(
  piqBlock.includes('Scope discipline'),
  'Block body contains "Scope discipline" section (sentence vs paragraph routing)',
);
assert(
  piqBlock.includes('architectural'),
  'Block body distinguishes architectural-scope patterns (hook/arc/coherence)',
);

// PIQ block references PIQ-pool patterns; Common App block references Common App pool.
const caBlock = buildPatternCatalogBlock('common_app');
assert(caBlock.includes('common_app:'), 'Common App block renders common_app:* IDs');
assert(piqBlock.includes('piq:'), 'PIQ block renders piq:* IDs');

// Essay-type isolation is verified at the catalog-line level, not the full
// block body (instructional prose uses `piq:hook-weak-generic` as a literal
// syntax example in both blocks). Count catalog lines that start with a given
// namespace prefix — this is the load-bearing isolation check.
const caCatalogLineCount = caBlock
  .split('\n')
  .filter((l) => l.startsWith('- piq:')).length;
assert(caCatalogLineCount === 0, `Common App block has 0 PIQ catalog lines (got ${caCatalogLineCount})`);

const piqCatalogLineCount = piqBlock
  .split('\n')
  .filter((l) => l.startsWith('- common_app:')).length;
assert(piqCatalogLineCount === 0, `PIQ block has 0 Common App catalog lines (got ${piqCatalogLineCount})`);

// Different essayTypes produce different block content (cache-key divergence).
assert(piqBlock !== caBlock, 'Different essayTypes produce different block content');

// Token budget sanity — block body shouldn't explode past ~1200 tokens for the
// top-15 slice (catalog lines + wrapping prose). 1 token ≈ 4 chars heuristic.
const approxTokens = Math.ceil(piqBlock.length / 4);
assert(
  approxTokens < 1500,
  `Top-15 block stays under 1500-token budget (approx ${approxTokens} tokens)`,
);

// renderCatalogLines format
const rendered = renderCatalogLines(piqCatalog);
assert(
  rendered.split('\n').length === piqCatalog.length,
  'renderCatalogLines emits one line per summary',
);
assert(
  rendered.split('\n').every((line) => line.startsWith('- ')),
  'Every catalog line starts with "- "',
);

// -------------------------------------------------------------------------
// 10. KnowledgePatternMatch type accepts `open` + legacy `patternOpen`
// -------------------------------------------------------------------------
const sampleMatch: KnowledgePatternMatch = {
  source: 'piq',
  patternId: 'piq:hook-weak-generic',
  open: null,
  patternOpen: null,
  confidence: 0.8,
  evidence: 'As president of the robotics club',
  severity: 'critical',
};
assert(sampleMatch.patternId === 'piq:hook-weak-generic', 'KnowledgePatternMatch.patternId accepts namespaced id');
assert(sampleMatch.open === null, 'KnowledgePatternMatch.open accepts null (OpenEnum)');

const noveltyMatch: KnowledgePatternMatch = {
  source: 'piq',
  patternId: null,
  open: 'novel-failure-pattern: paragraph ends mid-thought with no resolution',
  patternOpen: 'novel-failure-pattern: paragraph ends mid-thought with no resolution',
  confidence: 0.6,
  evidence: '...and then I realized',
  severity: 'major',
};
assert(noveltyMatch.patternId === null, 'Novel pattern emission leaves patternId null');
assert(typeof noveltyMatch.open === 'string' && noveltyMatch.open.length > 0, 'Novel pattern emission populates open');

// -------------------------------------------------------------------------
// 11. Pattern-ID stability on unchanged inputs (reproducibility proxy)
// -------------------------------------------------------------------------
const piqCatalog2 = getFilteredCatalog('piq');
const idsA = piqCatalog.map((p) => p.id).join(',');
const idsB = piqCatalog2.map((p) => p.id).join(',');
assert(idsA === idsB, 'getFilteredCatalog is deterministic — identical call → identical ID order');

// -------------------------------------------------------------------------
// 12. Measurement fixture placeholder (post-merge E2E)
// -------------------------------------------------------------------------
// TODO(Port B1 post-merge): add a 10-essay Sonnet-call regression fixture
// behind ANTHROPIC_API_KEY guard that asserts (a) ≥60% of weaknesses carry
// a patternId, (b) ≥80% patternId stability on unchanged text across two
// runs, and (c) human-eval blind-compare vs freeform baseline wins 70%+.
// Verdict §3 Port B1 measurement plan. This placeholder keeps the doc
// reference live without pulling a paid-call dependency into the fast
// gate suite.
console.log('  INFO  10-essay regression fixture placeholder (see TODO — requires ANTHROPIC_API_KEY)');

// -------------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log(`All assertions passed (${passed}/${passed}).`);
  process.exit(0);
} else {
  console.error(`${failed} assertion(s) failed (${passed}/${passed + failed} passed).`);
  process.exit(1);
}
