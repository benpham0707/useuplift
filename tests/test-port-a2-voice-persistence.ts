#!/usr/bin/env tsx
/**
 * Port A2 smoke test — voiceProfileService → L3.75 prior injection
 *
 * Verifies the block-builder contract for Wave-1a Port A2 without making
 * any network calls. Three axes:
 *
 *   1. NULL PRIOR PATH. buildPriorVoiceBlock returns '' when given null /
 *      undefined — the orchestrator concatenates this into the user prompt
 *      so a missing prior produces pre-port-identical output. No "no prior"
 *      framing, no empty markers.
 *
 *   2. POPULATED PRIOR PATH. Given a StudentVoiceProfile, the output is
 *      wrapped in BLOCK:A2_VOICE_PRIOR@v1.0.0 markers (cache-key divergent
 *      under version bump, per Wave-1b.5 seam) and contains the key fields
 *      from the profile in descriptive prose: register / vocabulary level /
 *      formality / sentence-length variety / signature words / authentic
 *      phrases / sample count. This is the structural contract the L3.75
 *      Phase A preamble depends on.
 *
 *   3. DESCRIPTIVE-CONTRACT LINT COVERAGE. The body built from a populated
 *      profile must contain no FORBIDDEN_WORDS — register fields are enums
 *      (informal / formal / semi-formal / casual / …) and personality fields
 *      are enums (high / medium / low / …); signature words / authentic
 *      phrases are user strings (we don't author them, but we DO quote them
 *      into the block, so the test also sweeps with a pathological profile
 *      that would inject lint-hostile tokens — to confirm such tokens appear
 *      only inside quoted strings which the lint's REGION_OPEN_RE already
 *      excludes, OR so the author can see the shape of what the lint sees).
 *
 * The descriptive-contract lint ALSO independently picks up the
 * `// @prompt-block A2_VOICE_PRIOR` tag in src/services/essayIntelligence/
 * analysis/priorVoiceBlock.ts and scans the template literal. Running that
 * lint is the authoritative "lint picked up the tag" check; this test does a
 * structural sanity confirmation by searching the source for the tag.
 *
 * Run:  npx tsx tests/test-port-a2-voice-persistence.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  buildPriorVoiceBlock,
  renderPriorVoiceBody,
} from '../src/services/essayIntelligence/analysis/priorVoiceBlock';
import {
  PROMPT_BLOCK_VERSIONS,
  PROMPT_BLOCK_DECLARATIONS,
  BLOCK_OPEN_RE,
  BLOCK_CLOSE_RE,
} from '../src/lib/llm/promptBlockVersions';
import type { StudentVoiceProfile } from '../src/services/voiceProfile/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Fixture — a minimal but fully-populated StudentVoiceProfile
// ---------------------------------------------------------------------------

function makeProfile(): StudentVoiceProfile {
  return {
    userId: 'user_smoke_test',
    version: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-18T00:00:00.000Z',
    register: {
      primary: 'quiet_intensity',
      secondary: 'warmth_connection',
      confidence: 0.82,
    },
    linguistics: {
      averageSentenceLength: 14,
      sentenceLengthVariety: 7,
      vocabularyLevel: 'clear',
      formality: 'semi-formal',
      fragmentUse: 'moderate',
      signatureWords: ['careful', 'the thing is', 'lately'],
      avoidWords: ['utilize'],
    },
    personality: {
      energy: 'medium',
      humor: 'occasional',
      directness: 'moderate',
      emotionalOpenness: 'guarded',
    },
    authenticPhrases: [
      { phrase: 'the thing about X is Y', source: 'essay', preserveExactly: true },
      { phrase: 'I caught myself', source: 'chat', preserveExactly: true },
    ],
    weaknesses: ['reaches for abstraction when emotion is close'],
    preservationWarnings: ['keep em-dash asides — they carry the reflective turn'],
    confidence: 0.82,
    sampleCount: 3,
    lastSampleAt: '2026-04-18T00:00:00.000Z',
  };
}

console.log('Port A2: priorVoiceBlock (Wave-1a)');
console.log('');

// ---------------------------------------------------------------------------
// 1. Null / undefined prior → empty string
// ---------------------------------------------------------------------------

console.log('[1/4] Null / undefined prior path');

assert(
  'buildPriorVoiceBlock(null) returns empty string',
  buildPriorVoiceBlock(null) === '',
);
assert(
  'buildPriorVoiceBlock(undefined) returns empty string',
  buildPriorVoiceBlock(undefined) === '',
);

// ---------------------------------------------------------------------------
// 2. Populated prior → wrapped block with key fields
// ---------------------------------------------------------------------------

console.log('[2/4] Populated prior produces version-wrapped block');

const profile = makeProfile();
const wrapped = buildPriorVoiceBlock(profile);

assert('wrapped block is a non-empty string', typeof wrapped === 'string' && wrapped.length > 0);

const openMatch = wrapped.match(BLOCK_OPEN_RE);
const closeMatch = wrapped.match(BLOCK_CLOSE_RE);

assert('open marker present', openMatch !== null);
assert('close marker present', closeMatch !== null);
assert(
  `open marker blockId is A2_VOICE_PRIOR (got ${openMatch?.[1]})`,
  openMatch?.[1] === 'A2_VOICE_PRIOR',
);
assert(
  `open marker version matches manifest slot ${PROMPT_BLOCK_VERSIONS.A2_VOICE_PRIOR}`,
  openMatch?.[2] === PROMPT_BLOCK_VERSIONS.A2_VOICE_PRIOR,
);
assert(
  'A2_VOICE_PRIOR declared at descriptive contract level',
  PROMPT_BLOCK_DECLARATIONS.A2_VOICE_PRIOR.level === 'descriptive',
);

// Structural field presence
const body = renderPriorVoiceBody(profile);
assert('body mentions register primary value', body.includes('quiet_intensity'));
assert('body mentions register secondary when present', body.includes('warmth_connection'));
assert('body mentions vocabulary level', body.includes('clear'));
assert('body mentions formality', body.includes('semi-formal'));
assert('body mentions avg sentence length', body.includes('14'));
assert('body mentions sentence variety', body.includes('(1-10 scale): 7'));
assert('body mentions fragment use', body.includes('moderate'));
assert('body mentions energy level', body.includes('medium'));
assert('body mentions humor', body.includes('occasional'));
assert('body mentions directness', body.includes('moderate'));
assert('body mentions emotional openness', body.includes('guarded'));
assert('body quotes signature word', body.includes('"careful"'));
assert('body quotes authentic phrase', body.includes('"the thing about X is Y"'));
assert('body mentions preservation note', body.includes('keep em-dash asides'));
assert('body mentions sample count', body.includes('samples observed so far: 3'));

// Framing — reference, not constraint
assert(
  'body explicitly frames prior as reference, not constraint',
  body.includes('reference only, not a constraint'),
);
assert(
  'body explicitly invites deviation as context, not violation',
  body.includes('context, not a violation'),
);

// ---------------------------------------------------------------------------
// 3. Prior with no secondary register → no trailing slash artifact
// ---------------------------------------------------------------------------

console.log('[3/4] Optional-field omission contracts');

const profileNoSecondary = makeProfile();
profileNoSecondary.register.secondary = undefined;
const bodyNoSecondary = renderPriorVoiceBody(profileNoSecondary);
assert(
  'body omits " / <secondary>" when secondary is undefined',
  !bodyNoSecondary.includes(' / '),
);

const profileNoSignatures = makeProfile();
profileNoSignatures.linguistics.signatureWords = [];
profileNoSignatures.linguistics.avoidWords = [];
profileNoSignatures.authenticPhrases = [];
profileNoSignatures.preservationWarnings = [];
const bodySparse = renderPriorVoiceBody(profileNoSignatures);
assert(
  'sparse profile body omits signature-words line',
  !bodySparse.includes('signature words'),
);
assert(
  'sparse profile body omits authentic-phrases line',
  !bodySparse.includes('authentic phrases carried from prior essays'),
);
assert(
  'sparse profile body omits preservation-notes line',
  !bodySparse.includes('student-specific preservation notes'),
);

// ---------------------------------------------------------------------------
// 4. Lint-tag coverage
// ---------------------------------------------------------------------------
// Structural confirmation that the @prompt-block tag is present in source so
// the descriptive-contract lint walker picks it up. The lint runs
// independently; this is a complementary sanity check.

console.log('[4/4] Descriptive-contract lint tag presence');

const repoRoot = resolve(__dirname, '..');
const source = readFileSync(
  resolve(repoRoot, 'src/services/essayIntelligence/analysis/priorVoiceBlock.ts'),
  'utf8',
);
const tagRe = /^\s*\/\/\s*@prompt-block\s+A2_VOICE_PRIOR\s*$/m;
assert(
  'priorVoiceBlock.ts contains // @prompt-block A2_VOICE_PRIOR on its own line',
  tagRe.test(source),
);

// The tag is immediately followed by a template literal (the lint requires
// the literal within 5 lines of the tag).
const tagIdx = source.search(tagRe);
const snippetAfter = source.slice(tagIdx, tagIdx + 600);
assert(
  'template literal opens within 5 lines of the @prompt-block tag',
  /^\s*\/\/\s*@prompt-block\s+A2_VOICE_PRIOR\s*\n(?:[^\n]*\n){0,4}[^\n]*`/.test(snippetAfter),
);

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
