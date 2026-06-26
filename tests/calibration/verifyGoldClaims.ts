/**
 * verifyGoldClaims.ts — never-regress guard for the calibration gold + live corpus.
 *
 * Pins every fact verified in the 2026-06-20 truth-pass (docs/knowledge-base/FOUNDATION_AUDIT.md)
 * so a corrected claim can never silently revert, and BANS the specific false phrasings that were
 * removed from the live retrieval catalog. Also runs an ADVISORY scan that surfaces NEW unverified
 * countable claims in the reviews for human review (raises the standard: every countable claim must
 * be grep-checked before it ships).
 *
 * Run:  npx tsx tests/calibration/verifyGoldClaims.ts
 * Exit: 1 on any pinned-fact violation or banned-phrase reappearance (wire into CI for true enforcement).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = join(REPO, 'tests/calibration/top-tier-reference/essays');
const SYN = join(REPO, 'tests/calibration/essays');
const CORPUS = join(REPO, 'src/services/essayIntelligence/corpus');
const REVIEWS = join(REPO, 'tests/calibration/top-tier-reference/reviews');

const read = (p: string) => readFileSync(p, 'utf8');
const wordCount = (t: string) => (t.trim().match(/\S+/g) || []).length;
const occurrences = (t: string, re: RegExp) => (t.match(re) || []).length;
const paragraphs = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

const failures: string[] = [];
const ok = (name: string) => console.log(`  ok   ${name}`);
const check = (name: string, pass: boolean, detail: string) =>
  pass ? ok(name) : failures.push(`FAIL ${name} — ${detail}`);

// ── PINNED FACTS (verified 2026-06-20; any drift = regression) ──────────────
console.log('Pinned-fact checks:');
{
  const e05 = read(join(REF, '05-harvard-2028-i-too-can-dance.txt'));
  const n = occurrences(e05, /\bwheelchair\b/gi);
  check('05 "wheelchair" count == 2', n === 2, `got ${n} (the false gold claimed "exactly once")`);
}
{
  const e07 = read(join(REF, '07-harvard-2028-peabody-skatepark.txt'));
  const n = occurrences(e07, /\broutine\b/gi);
  check('07 "routine" count == 1', n === 1, `got ${n} (false "word-planting through-line" claimed it recurs)`);
}
{
  const e03 = read(join(REF, '03-hopkins-2028-korean-sticky-notes.txt'));
  const n = occurrences(e03, /^\*[^*]+\*:/gm);
  check('03 Korean section headers == 5', n === 5, `got ${n} (gold said "six")`);
}
{
  const e14 = read(join(REF, '14-harvard-2028-crochet.txt'));
  const n = wordCount(e14);
  check('14 crochet word count ~491', Math.abs(n - 491) <= 5, `got ${n} (review said ~650)`);
}
{
  const p01 = read(join(SYN, '01-poor-personal-statement.txt'));
  const n = occurrences(p01, /\bI learned\b/gi);
  check('01-poor "I learned" count == 5', n === 5, `got ${n} (rationale said 3)`);
}
{
  // "Until I became one." is NOT a standalone one-sentence paragraph: it shares its
  // paragraph with the preceding "I didn't think much of the otters after that."
  const e10 = read(join(REF, '10-harvard-2028-the-zoo.txt'));
  const para = paragraphs(e10).find((p) => p.includes('Until I became one'));
  const notStandalone = !!para && /didn'?t think much of the otters/i.test(para);
  check('10 hinge is NOT a one-sentence paragraph', notStandalone,
    `para containing the hinge: ${JSON.stringify(para?.slice(0, 80))}`);
}

// ── BANNED PHRASES (the exact false strings removed from the live catalog) ──
console.log('\nBanned-phrase checks (these false claims must not return to the catalog):');
const banned: Array<[string, string]> = [
  ['topTierCraftMoves.ts', 'Name the central fact exactly once'],
  ['topTierCraftMoves.ts', 'named explicitly one time'],
  ['topTierCraftMoves.ts', 'appears exactly once in the essay; surrounding'],
  ['topTierCraftMoves.ts', 'A single short sentence in its own paragraph pivots'],
  ['topTierCraftMoves.ts', 'A paragraph containing a single short sentence that converts'],
  ['topTierCraftMoves.ts', 'A single word ("routine") appears in its most'],
  ['topTierCraftMoves.ts', 'choreography. (Sorry, Mr. Shakespeare)'],
  ['essayArchetypes.ts', 'the central fact named exactly once'],
  ['essayArchetypes.ts', 'paragraph 2 (single-sentence paragraph)'], // R-1: the 2nd hinge-claim site
  ['antiArchetypes.ts', 'name the disability EXACTLY ONCE'],
  ['topTierCraftMoves.ts', 'marching through the aisles... strolling through the aisles... racing through the aisles'], // F-4: fabricated triplet
];
for (const [file, phrase] of banned) {
  const present = read(join(CORPUS, file)).includes(phrase);
  check(`${file} ∌ "${phrase.slice(0, 40)}…"`, !present, `the false phrase reappeared in ${file}`);
}

// ── ADVISORY: surface NEW unverified countable claims for human grep-check ──
// Scans BOTH the source reviews AND the live corpus .ts (F-3/F-4: the 190 corpus moves carry their own
// count/structural claims; the one-time truth-pass cleared them, but new ones must be re-verified).
console.log('\nAdvisory — countable/structural claims to grep-verify (NOT failures; reviews + corpus):');
const claimRe = /(appears? (?:exactly )?(?:once|twice|three times|\d+ times)|the only [a-z-]+ (?:sentence|word|paragraph)|one-sentence paragraph|single-sentence paragraph|word[- ]planting)/gi;
let advisoryCount = 0;
const advisorySources: Array<[string, string]> = [
  ...readdirSync(REVIEWS).filter((f) => f.endsWith('.md')).map((f) => [join(REVIEWS, f), `reviews/${f}`] as [string, string]),
  ...['topTierCraftMoves.ts', 'essayArchetypes.ts', 'antiArchetypes.ts'].map((f) => [join(CORPUS, f), `corpus/${f}`] as [string, string]),
];
for (const [path, label] of advisorySources) {
  const hits = [...new Set(read(path).match(claimRe) || [])];
  if (hits.length) { advisoryCount += hits.length; console.log(`    ${label}: ${hits.join(' | ')}`); }
}
console.log(`  (${advisoryCount} countable-claim patterns flagged — verify each against raw essay text before trusting.)`);

// ── verdict ─────────────────────────────────────────────────────────────────
console.log('');
if (failures.length) {
  console.error(`REGRESSION DETECTED — ${failures.length} pinned/banned check(s) failed:`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('All pinned-fact + banned-phrase checks passed. Gold/corpus has not regressed.');
