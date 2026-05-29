// ============================================================================
// parseMEMGap — deterministic parser tests
// ============================================================================
// Validates the MEM-gap-string parser used by generateEssayLevelRewrites().
// Reads `EarningMechanismType` from production types so any future enum
// extension automatically widens the validation set.

import { describe, it, expect } from 'vitest';

import { parseMEMGap } from '../../src/services/essayIntelligence/analysis/parseMEMGap';
import type { EarningMechanismType } from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// 1. Canonical Crochet format — em-dash, no surrounding spaces
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — canonical format', () => {
  it('parses the actual Crochet "intellectual_scaffolding" gap verbatim', () => {
    const input =
      'intellectual_scaffolding—the essay elides the entire learning process. ' +
      'P2 ends with cyclical failure, P3S1 opens with achieved mastery.';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.description).toBe(
      'the essay elides the entire learning process. ' +
        'P2 ends with cyclical failure, P3S1 opens with achieved mastery.',
    );
    expect(result.parsed).toBe(true);
  });

  it('parses the actual Crochet "sensory_grounding" gap verbatim', () => {
    const input =
      "sensory_grounding—no scene shows the grandmother's resilience in action; " +
      'the reader is told about her response but does not witness a specific moment of decision or struggle';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description.startsWith("no scene shows the grandmother's resilience")).toBe(true);
    expect(result.parsed).toBe(true);
  });

  it('parses the actual Crochet "emotional_setup" gap verbatim', () => {
    const input =
      "emotional_setup—no earlier passage establishes the narrator's relationship to gift-giving " +
      'or community contribution. The hope appears in P3S5 without prior evidence that the narrator ' +
      'values bringing joy to others.';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('emotional_setup');
    expect(result.description.startsWith("no earlier passage establishes")).toBe(true);
    expect(result.parsed).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. All 7 valid EarningMechanismType values are recognized
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — every valid mechanism', () => {
  const mechanisms: readonly EarningMechanismType[] = [
    'sensory_grounding',
    'emotional_setup',
    'stakes_establishment',
    'character_revelation',
    'thematic_preparation',
    'intellectual_scaffolding',
    'comedic_subversive_setup',
  ] as const;

  for (const mechanism of mechanisms) {
    it(`parses "${mechanism}"`, () => {
      const result = parseMEMGap(`${mechanism}—description here`);
      expect(result.mechanism).toBe(mechanism);
      expect(result.description).toBe('description here');
      expect(result.parsed).toBe(true);
    });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Whitespace and case tolerance
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — whitespace + case tolerance', () => {
  it('handles spaces around the em-dash', () => {
    const result = parseMEMGap('sensory_grounding — no scene shows the resilience');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe('no scene shows the resilience');
    expect(result.parsed).toBe(true);
  });

  it('handles tabs around the em-dash', () => {
    const result = parseMEMGap('sensory_grounding\t—\tdescription');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe('description');
    expect(result.parsed).toBe(true);
  });

  it('trims leading whitespace before the mechanism', () => {
    const result = parseMEMGap('  intellectual_scaffolding—description');
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.description).toBe('description');
    expect(result.parsed).toBe(true);
  });

  it('trims trailing whitespace from description', () => {
    const result = parseMEMGap('sensory_grounding—the description with trailing   ');
    expect(result.description).toBe('the description with trailing');
  });

  it('handles uppercase enum prefix (case-insensitive match)', () => {
    const result = parseMEMGap('Intellectual_Scaffolding—description');
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.parsed).toBe(true);
  });

  it('handles ALL CAPS enum prefix', () => {
    const result = parseMEMGap('SENSORY_GROUNDING—description');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.parsed).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Alternative separators
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — separator variants', () => {
  it('parses en-dash (U+2013) as a separator', () => {
    const result = parseMEMGap('emotional_setup–no earlier passage establishes the relationship');
    expect(result.mechanism).toBe('emotional_setup');
    expect(result.description).toBe('no earlier passage establishes the relationship');
    expect(result.parsed).toBe(true);
  });

  it('does NOT treat hyphen-minus as a separator (too common in prose)', () => {
    // Hyphen-minus inside descriptions ("first-person", "two-thirds") is too
    // common to be safe. Inputs that use only hyphen-minus get unclassified
    // with the full string preserved as description.
    const input = 'intellectual_scaffolding-description';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('unclassified');
    expect(result.description).toBe(input);
    expect(result.parsed).toBe(false);
  });

  it('splits on the FIRST em-dash; later em-dashes stay in the description', () => {
    const result = parseMEMGap(
      'intellectual_scaffolding—the essay—has multiple—em-dashes in it',
    );
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.description).toBe('the essay—has multiple—em-dashes in it');
    expect(result.parsed).toBe(true);
  });

  it('handles a mix of en-dash and em-dash — splits on the first', () => {
    // First separator is en-dash, em-dashes later in the prose are preserved.
    const result = parseMEMGap('sensory_grounding–the bridge — sentence — does its work');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe('the bridge — sentence — does its work');
    expect(result.parsed).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Unclassified fallbacks
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — unclassified fallbacks', () => {
  it('returns unclassified when the prefix is not a known mechanism but em-dash present', () => {
    const input = 'weird_mechanism—description here';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('unclassified');
    // Full original string preserved as description so no info is lost.
    expect(result.description).toBe(input);
    expect(result.parsed).toBe(false);
  });

  it('returns unclassified when there is no em-dash separator at all', () => {
    const input = 'just plain prose about the essay with no separator';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('unclassified');
    expect(result.description).toBe(input);
    expect(result.parsed).toBe(false);
  });

  it('returns unclassified when the prefix is misspelled', () => {
    // Drop the underscore so it doesn't match the enum even if we ignored case.
    const input = 'intellectualscaffolding—description';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('unclassified');
    expect(result.parsed).toBe(false);
  });

  it('handles empty string input', () => {
    const result = parseMEMGap('');
    expect(result.mechanism).toBe('unclassified');
    expect(result.description).toBe('');
    expect(result.parsed).toBe(false);
  });

  it('handles whitespace-only input', () => {
    const result = parseMEMGap('   \t\n  ');
    expect(result.mechanism).toBe('unclassified');
    expect(result.description).toBe('');
    expect(result.parsed).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. Edge cases
// ───────────────────────────────────────────────────────────────────────────

describe('parseMEMGap — edge cases', () => {
  it('handles a valid mechanism with an empty description after the separator', () => {
    const result = parseMEMGap('sensory_grounding—');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe('');
    expect(result.parsed).toBe(true);
  });

  it('handles a valid mechanism with only whitespace after the separator', () => {
    const result = parseMEMGap('sensory_grounding—    ');
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe('');
    expect(result.parsed).toBe(true);
  });

  it('preserves quotes and special characters in the description', () => {
    const input = `intellectual_scaffolding—the writer says "I learned" without showing how`;
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.description).toBe('the writer says "I learned" without showing how');
  });

  it('preserves apostrophes (e.g., "grandmother\'s") in the description', () => {
    const input = "sensory_grounding—no scene shows the grandmother's resilience";
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('sensory_grounding');
    expect(result.description).toBe("no scene shows the grandmother's resilience");
  });

  it('preserves paragraph-reference notation (P2, P3S1) in the description', () => {
    const input =
      'intellectual_scaffolding—P2 ends with cyclical failure, P3S1 opens with mastery';
    const result = parseMEMGap(input);
    expect(result.mechanism).toBe('intellectual_scaffolding');
    expect(result.description).toBe(
      'P2 ends with cyclical failure, P3S1 opens with mastery',
    );
  });

  it('handles a starting em-dash with no prefix (no mechanism to identify)', () => {
    const input = '—the essay elides the learning process';
    const result = parseMEMGap(input);
    // Empty prefix, can't classify. Falls back to unclassified with the
    // full original (trimmed) input as description.
    expect(result.mechanism).toBe('unclassified');
    expect(result.description).toBe(input);
    expect(result.parsed).toBe(false);
  });
});
