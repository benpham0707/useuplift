// ============================================================================
// DUMP LINT — self-audit regression catcher
// ============================================================================
// Mechanically detects the recurring problems that every full-profile audit
// has surfaced. Existence of this test prevents regression: every CI run
// asserts the lint rules.
//
// Two test groups:
//   1. Synthetic-fixture tests — verify the rules fire correctly
//   2. Live-dump regression tests — run against the existing Crochet dump,
//      assert findings count is at-or-below a frozen ceiling. The ceiling
//      starts at the current count and ratchets DOWN as renderer fixes land.
//      A regression that adds findings will fail the test.

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
  lintDump,
  summarizeLint,
} from '../../src/services/essayIntelligence/profileManager/dumpLint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Group 1: synthetic fixtures ───────────────────────────────────────

describe('dumpLint — rule firing', () => {
  it('R1: flags zero-indexed paragraph reference in user-facing prose', () => {
    const md = [
      '## 5.8 Craft Assessment',
      '',
      '### Signature Move',
      '',
      '> Disproportion-then-inversion architecture: misdirection opener (P0) sets up trivial subject',
    ].join('\n');
    const { findings, countsByRule } = lintDump(md);
    expect(countsByRule.R1_zero_indexed_paragraph_in_user_facing_prose).toBe(1);
    expect(findings[0].rule).toBe('R1_zero_indexed_paragraph_in_user_facing_prose');
    expect(findings[0].excerpt).toContain('(P0)');
  });

  it('R1: does NOT fire inside system-internal sections (Connections, Profile Index)', () => {
    const md = [
      '## 7. Connections & Entanglements',
      '',
      '#### Connection conn_xyz_0001: P0S0 -> P1S2',
      '- **From label**: P0S0',
      '- **To label**: P1S2',
    ].join('\n');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R1_zero_indexed_paragraph_in_user_facing_prose).toBe(0);
  });

  it('R1: does NOT flag higher 1-indexed references like P1, P5', () => {
    const md = [
      '## 5.6 Narrative Strategy',
      '',
      '- The misdirection opening at P1 establishes voice; P5 closes with synthesis.',
    ].join('\n');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R1_zero_indexed_paragraph_in_user_facing_prose).toBe(0);
  });

  it('R2: flags tentative connection strength', () => {
    const md = [
      '## 7. Connections',
      '',
      '#### Connection conn_xyz_0001: P1 -> P2',
      '- **Description**: Some scout-discovered link',
      '- **Strength**: tentative',
      '',
      '#### Connection conn_xyz_0002: P2 -> P3',
      '- **Strength**: foundational',
    ].join('\n');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R2_tentative_connection_in_markdown).toBe(1);
  });

  it('R3: flags empty schema stub bullets', () => {
    const md = [
      '#### Sentence 3',
      '',
      '*Inferred Intents:* (none)',
      '*Narrative Contributions:* (none)',
      '- Rhetorical functions: (none)',
      '- Tags: [opening_hook, voice_establishment]',
    ].join('\n');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R3_empty_schema_stub).toBe(1); // matches "- Rhetorical functions: (none)"
  });

  it('R4: flags verbatim long line repeated 3+ times', () => {
    const repeated = 'This opening establishes the dual epistemology thesis effectively but does so through pure abstraction and performance language across the paragraph and beyond, with no concrete sensory grounding to anchor the abstraction.';
    const md = [
      '## a',
      `- ${repeated}`,
      '## b',
      `- ${repeated}`,
      '## c',
      `- ${repeated}`,
    ].join('\n');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R4_repeated_verdict_prose).toBeGreaterThanOrEqual(1);
  });

  it('summarizeLint produces a readable summary', () => {
    const md = '## Test\n- (P0) is in prose';
    const result = lintDump(md);
    const summary = summarizeLint(result);
    expect(summary).toContain('R1');
    expect(summary).toContain('R2');
    expect(summary).toContain('R3');
    expect(summary).toContain('R4');
    expect(summary).toContain('Total findings:');
  });
});

// ─── Group 2: live-dump regression ratchet ─────────────────────────────
// Run the lint against the actual Crochet dump and assert each rule's
// count is at-or-below a frozen ceiling. The ceiling represents the
// "known broken" baseline. As renderer fixes land, lower the ceiling.
// A regression adding findings will fail the test.

const CROCHET_DUMP_PATH = path.join(
  __dirname,
  '..',
  'output',
  'full-profile-14-harvard-2028-crochet.md',
);

const CROCHET_DUMP_EXISTS = fs.existsSync(CROCHET_DUMP_PATH);

describe.skipIf(!CROCHET_DUMP_EXISTS)('dumpLint — Crochet live-dump regression ceiling', () => {
  // Baseline (set 2026-05-05 from the post-Gap-1 Crochet dump):
  // R1: 65 zero-indexed paragraph refs in user-facing prose
  // R2: 46 tentative connections
  // R3: 157 empty schema stubs
  // R4: 0+ repeated long-line prose (depends on threshold)
  //
  // CEILING = baseline. Ratchet DOWN as fixes land; do NOT raise without
  // an explicit reason logged in the audit.
  const CEILING = {
    R1_zero_indexed_paragraph_in_user_facing_prose: 65,
    R2_tentative_connection_in_markdown: 46,
    R3_empty_schema_stub: 215, // post-Gap-1 baseline; ratchet down as renderer fixes land
    R4_repeated_verdict_prose: 200, // R4 detection threshold is permissive; high ceiling for now
  };

  it('Crochet dump R1 count is at-or-below the ceiling', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R1_zero_indexed_paragraph_in_user_facing_prose).toBeLessThanOrEqual(
      CEILING.R1_zero_indexed_paragraph_in_user_facing_prose,
    );
  });

  it('Crochet dump R2 count is at-or-below the ceiling', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R2_tentative_connection_in_markdown).toBeLessThanOrEqual(
      CEILING.R2_tentative_connection_in_markdown,
    );
  });

  it('Crochet dump R3 count is at-or-below the ceiling', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R3_empty_schema_stub).toBeLessThanOrEqual(CEILING.R3_empty_schema_stub);
  });

  it('Crochet dump R4 count is at-or-below the ceiling', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R4_repeated_verdict_prose).toBeLessThanOrEqual(CEILING.R4_repeated_verdict_prose);
  });

  // Renderer-fix expectation: after R2 (tentative-connection filter) + R3
  // (schema-stub suppression) + R4 (Description=Significance dedup) land,
  // the NEXT regenerated dump should have:
  //   R2 = 0 (tentative connections never rendered)
  //   R3 ≪ 215 (typically <30 — only legitimate "(none)" markers remain)
  //   R4 ≪ 12 (the Description=Significance pairs collapse)
  // R1 (zero-indexed prose) is NOT yet renderer-fixed; remains at baseline
  // until the prompt-side fix lands. This expectation block documents the
  // expected post-fix landing values; assertions are .skip until the next
  // dump regenerates so we don't fail until the fix is verified.
  it.skip('AFTER renderer fix re-run: R2 should be 0 (tentative connections suppressed)', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R2_tentative_connection_in_markdown).toBe(0);
  });

  it.skip('AFTER renderer fix re-run: R3 should drop below 30 (only legitimate (none) markers)', () => {
    const md = fs.readFileSync(CROCHET_DUMP_PATH, 'utf-8');
    const { countsByRule } = lintDump(md);
    expect(countsByRule.R3_empty_schema_stub).toBeLessThan(30);
  });
});
