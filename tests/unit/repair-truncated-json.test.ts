/**
 * repair-truncated-json.test.ts — Unit tests for the repair function in
 * src/lib/llm/claude.ts. Validates behavior against truncation patterns
 * observed in production logs (checkpoint3 A/B run, 2026-04-21):
 *   - L3 walk P6 parse failure at pos 5959 (root-object truncated mid-value)
 *   - L3.75 Phase B parse failure at pos 15732 / 30037 (root-object,
 *     `arrayDepth: -1, element end positions: 0` before the fix)
 *
 * No network I/O. Run: npx tsx tests/unit/repair-truncated-json.test.ts
 * Exit 0 = pass, 1 = fail.
 */
process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-for-unit-test';

import { repairTruncatedJSON } from '../../src/lib/llm/claude';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(err as Error).message}`);
    failed++;
  }
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

console.log('\nrepairTruncatedJSON');

// ─── Root array (legacy path) ────────────────────────────────────────────
test('root array: truncated mid-element closes on last complete element', () => {
  const input = '[{"a":1},{"b":2},{"c":3,"d":';
  const out = repairTruncatedJSON(input) as Array<Record<string, number>>;
  assert(Array.isArray(out), 'must be array');
  assert(out.length === 2, `expected 2 elements, got ${out.length}`);
  assert(out[0].a === 1 && out[1].b === 2, 'elements preserved');
});

test('root array: complete JSON parses as-is', () => {
  const input = '[{"a":1},{"b":2}]';
  const out = repairTruncatedJSON(input) as Array<Record<string, number>>;
  assert(out.length === 2, 'both elements survive');
});

// ─── Root object: truncated mid-value ────────────────────────────────────
test('root object: truncated mid string value recovers prior properties', () => {
  const input = '{"a":1,"b":"hello","c":"this is a long string that got cut of';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(typeof out === 'object' && !Array.isArray(out), 'must be object');
  assert(out.a === 1, 'a preserved');
  assert(out.b === 'hello', 'b preserved');
  assert(!('c' in out), 'incomplete property c dropped');
});

test('root object: truncated mid nested object recovers prior properties', () => {
  const input = '{"a":1,"b":{"nested":true},"c":{"partial":';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(out.a === 1, 'a preserved');
  assert((out.b as { nested: boolean }).nested === true, 'b.nested preserved');
  assert(!('c' in out), 'incomplete c dropped');
});

test('root object: truncated mid nested array recovers prior properties', () => {
  const input = '{"a":[1,2,3],"b":[4,5,';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(Array.isArray(out.a) && (out.a as number[]).length === 3, 'a survives');
  assert(!('b' in out), 'truncated b dropped');
});

test('root object: complete JSON parses cleanly', () => {
  const input = '{"a":1,"b":"hi"}';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(out.a === 1 && out.b === 'hi', 'complete object intact');
});

test('root object: trailing comma before truncation is cleaned', () => {
  const input = '{"a":1,"b":2,';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(out.a === 1 && out.b === 2, 'both properties preserved past trailing comma');
});

// ─── Preamble / markdown wrapping ───────────────────────────────────────
test('markdown code block is stripped', () => {
  const input = '```json\n{"a":1,"b":"oops';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(out.a === 1, 'a survives through markdown stripper');
});

test('preamble text before JSON is skipped (object)', () => {
  const input = 'Here is the response:\n{"a":1,"b":2}';
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert(out.a === 1 && out.b === 2, 'preamble stripped');
});

// ─── Real-world shape: L3.75 Phase B-ish output ─────────────────────────
test('phase B-like: deeply nested object with several top-level keys truncated at last key', () => {
  const input = `{
  "thematicArchitecture": {"centralThesis":"X","threads":[{"thread":"A"}]},
  "narrativeStrategy": {"primaryStrategy":"quest"},
  "characterRevelation": {"writerPortrait":"someone who",`;
  const out = repairTruncatedJSON(input) as Record<string, unknown>;
  assert('thematicArchitecture' in out, 'thematicArchitecture recovered');
  assert('narrativeStrategy' in out, 'narrativeStrategy recovered');
  assert(!('characterRevelation' in out), 'truncated characterRevelation dropped');
});

// ─── Degenerate cases ───────────────────────────────────────────────────
test('empty string throws', () => {
  try {
    repairTruncatedJSON('');
    throw new Error('expected throw');
  } catch (e) {
    assert((e as Error).message === 'JSON repair failed', 'correct failure');
  }
});

test('garbage (no JSON) throws', () => {
  try {
    repairTruncatedJSON('hello world no json here');
    throw new Error('expected throw');
  } catch (e) {
    assert((e as Error).message === 'JSON repair failed', 'correct failure');
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
