/**
 * Wave-1b Pre-req 3: SYSTEM_PROMPT_VERSION unit test
 *
 * Verifies:
 * 1. SYSTEM_PROMPT_VERSION constant is exported and truthy.
 * 2. withSystemPromptVersion() prepends the [SYS_V:<version>] marker.
 * 3. Different versions produce different marked outputs for the same prompt
 *    (proving the cache-key path actually diverges on version change).
 * 4. The helper is idempotent — re-applying the default replaces rather than
 *    doubles the marker.
 *
 * No network calls. Pure function tests. Runnable without ANTHROPIC_API_KEY.
 */

import { SYSTEM_PROMPT_VERSION, withSystemPromptVersion } from '../src/lib/llm/claude';

let failed = 0;
function assert(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('Wave-1b Pre-req 3: SYSTEM_PROMPT_VERSION');

// 1. Constant exists, exported, and follows vX.Y.Z shape.
assert(
  'SYSTEM_PROMPT_VERSION is a non-empty string',
  typeof SYSTEM_PROMPT_VERSION === 'string' && SYSTEM_PROMPT_VERSION.length > 0,
  `got: ${JSON.stringify(SYSTEM_PROMPT_VERSION)}`,
);
assert(
  'SYSTEM_PROMPT_VERSION matches vMAJOR.MINOR.PATCH',
  /^v\d+\.\d+\.\d+$/.test(SYSTEM_PROMPT_VERSION),
  `got: ${SYSTEM_PROMPT_VERSION}`,
);
assert(
  'SYSTEM_PROMPT_VERSION is currently v1.4.0 (Wave-1b.5 block-versioned prompts)',
  SYSTEM_PROMPT_VERSION === 'v1.4.0',
  `got: ${SYSTEM_PROMPT_VERSION}`,
);

// 2. Marker is prepended with default version.
const base = 'You are an expert admissions essay analyst.';
const tagged = withSystemPromptVersion(base);
assert(
  'withSystemPromptVersion prepends [SYS_V:v1.4.0]',
  tagged.startsWith('[SYS_V:v1.4.0]\n'),
  `got head: ${JSON.stringify(tagged.slice(0, 40))}`,
);
assert(
  'Original prompt body is preserved after the marker',
  tagged.endsWith(base),
  'body not preserved',
);

// 3. Different versions produce different cache-key inputs for the same prompt.
const vA = withSystemPromptVersion(base, 'v1.3.0');
const vB = withSystemPromptVersion(base, 'v1.5.0');
assert(
  'Different versions produce different marked prompts (cache-key divergence)',
  vA !== vB,
  'versions collapsed to same output',
);
assert(
  'v1.5.0 output starts with [SYS_V:v1.5.0]',
  vB.startsWith('[SYS_V:v1.5.0]\n'),
  `got head: ${JSON.stringify(vB.slice(0, 40))}`,
);

// 4. Idempotence — applying twice replaces, doesn't double.
const twice = withSystemPromptVersion(withSystemPromptVersion(base));
const markerMatches = twice.match(/\[SYS_V:/g) || [];
assert(
  'Applying withSystemPromptVersion twice yields exactly one marker',
  markerMatches.length === 1,
  `marker count: ${markerMatches.length}`,
);
assert(
  'Idempotent call still matches single-call output',
  twice === tagged,
  'double-tagged output drifted from single-tagged',
);

// 5. Re-tagging with a different version replaces the old marker.
const reTagged = withSystemPromptVersion(vA, 'v2.0.0');
assert(
  'Re-tagging with a new version replaces the old marker',
  reTagged.startsWith('[SYS_V:v2.0.0]\n') && !reTagged.includes('[SYS_V:v1.3.0]'),
  `got head: ${JSON.stringify(reTagged.slice(0, 40))}`,
);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll assertions passed.');
}
