// ============================================================================
// SIGNATURE MOVE VALIDATOR — unit tests (Quality Gap 1)
// ============================================================================
// Substring + paragraph-index referential-integrity validator. Invalid
// instances are DROPPED per-instance (no fabrication, no fallback); the move
// survives as long as >=1 instance is grounded, and goes null only when NONE
// survive — per CLAUDE.md and the LLM-first design rules. One off-by-one index
// or a single hallucinated quote must not discard an otherwise-grounded move.

import { describe, it, expect } from 'vitest';

import {
  validateSignatureMoveAgainstParagraphs,
} from '../../src/services/essayIntelligence/profileManager/validation/intraDomainValidation';
import type {
  SignatureMove,
} from '../../src/services/essayIntelligence/profileTypes';

const CROCHET_P0 =
  "My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton. Don't get the wrong idea, now – I'm not a taxidermist or anything. I crochet.";
const CROCHET_P1 =
  "Crochet is a family tradition. My grandmother used to wield her menacing steel hook like a mage's staff and tout it as such: an instrument that bestowed patience, decorum, and poise on its owner.";
const CROCHET_P3 =
  "Take Agnes, for example, a cornflower-blue elephant named after mathematician Maria Gaetana Agnesi who lives in my calculus teacher's classroom, happily grazing on old pencil shavings and worksheets.";

const PARAGRAPHS: readonly string[] = [CROCHET_P0, CROCHET_P1, '', CROCHET_P3, ''];

const baseValid: SignatureMove = {
  oneSentenceName:
    'Compressed-heritage opener with implied-wrong-hypothesis (taxidermy misdirection at P1) followed by accumulated-specifics (Agnes the cornflower-blue elephant at P4).',
  whyItIsTheirs:
    "Clara's essay carries a century of family history in 650 words. Compression-then-accumulated-specifics rhythm is what lets that weight fit.",
  instances: [
    {
      kind: 'sentence_quote',
      location: { paragraph: 0, sentence: 0 },
      quotedText: 'My nightstand is home to a small menagerie of critters',
      whatThisInstanceShows: 'taxidermy misdirection setup',
    },
    {
      kind: 'paragraph_compression',
      paragraph: 1,
      whatThisInstanceShows: 'P1 compresses family history into one paragraph',
    },
    {
      kind: 'sentence_quote',
      location: { paragraph: 3, sentence: 4 },
      quotedText:
        'a cornflower-blue elephant named after mathematician Maria Gaetana Agnesi',
      whatThisInstanceShows: 'accumulated specifics image',
    },
  ],
  readerEffect:
    'The reader is committed by P1 through their own incorrect inference, then rewarded with one unforgettable image at P4.',
};

describe('validateSignatureMoveAgainstParagraphs', () => {
  it('passes a valid signatureMove with verbatim quotes and in-range paragraphs', () => {
    const result = validateSignatureMoveAgainstParagraphs(baseValid, PARAGRAPHS);
    expect(result).not.toBeNull();
    expect(result?.oneSentenceName).toBe(baseValid.oneSentenceName);
    expect(result?.instances.length).toBe(3);
  });

  it('drops only the ungrounded instance and keeps the move when others are grounded', () => {
    const partlyDrifted: SignatureMove = {
      ...baseValid,
      instances: [
        // grounded
        {
          kind: 'sentence_quote',
          location: { paragraph: 0, sentence: 0 },
          quotedText: 'My nightstand is home to a small menagerie of critters',
          whatThisInstanceShows: 'taxidermy misdirection setup',
        },
        // ungrounded — quote not present in P1 (e.g. an LLM hallucination)
        {
          kind: 'sentence_quote',
          location: { paragraph: 1, sentence: 0 },
          quotedText: 'this phrase does not appear anywhere in paragraph one',
          whatThisInstanceShows: 'hallucinated quote',
        },
        // grounded
        {
          kind: 'paragraph_compression',
          paragraph: 1,
          whatThisInstanceShows: 'P1 compresses family history',
        },
      ],
    };
    const messages: string[] = [];
    const result = validateSignatureMoveAgainstParagraphs(
      partlyDrifted,
      PARAGRAPHS,
      (m) => messages.push(m),
    );
    // The move SURVIVES — one bad instance must not nuke an otherwise-grounded move.
    expect(result).not.toBeNull();
    // Filtered to the two grounded instances; the bad one is gone.
    expect(result?.instances.length).toBe(2);
    // The move's prose is preserved unaltered (no fabrication).
    expect(result?.oneSentenceName).toBe(baseValid.oneSentenceName);
    // Exactly one diagnostic, for the single dropped instance.
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/not a substring/);
  });

  it('goes null only when EVERY instance fails grounding', () => {
    const allBad: SignatureMove = {
      ...baseValid,
      instances: [
        {
          kind: 'sentence_quote',
          location: { paragraph: 0, sentence: 0 },
          quotedText: 'nope, not present in paragraph zero',
          whatThisInstanceShows: 'bad quote',
        },
        { kind: 'paragraph_compression', paragraph: 99, whatThisInstanceShows: 'out of range' },
      ],
    };
    expect(validateSignatureMoveAgainstParagraphs(allBad, PARAGRAPHS)).toBeNull();
  });

  it('drops to null when a sentence_quote quotedText is not in the cited paragraph', () => {
    const drift: SignatureMove = {
      ...baseValid,
      instances: [
        {
          kind: 'sentence_quote',
          location: { paragraph: 0, sentence: 0 },
          quotedText: 'This phrase is nowhere in paragraph zero of the essay',
          whatThisInstanceShows: 'fake quote',
        },
      ],
    };
    const result = validateSignatureMoveAgainstParagraphs(drift, PARAGRAPHS);
    expect(result).toBeNull();
  });

  it('passes when all instances are structural (no sentence_quote)', () => {
    const structural: SignatureMove = {
      ...baseValid,
      instances: [
        { kind: 'paragraph_compression', paragraph: 1, whatThisInstanceShows: 'compresses history' },
        { kind: 'cross_paragraph_pattern', paragraphs: [1, 3], whatThisInstanceShows: 'wizard motif' },
      ],
    };
    const result = validateSignatureMoveAgainstParagraphs(structural, PARAGRAPHS);
    expect(result).not.toBeNull();
  });

  it('normalizes smart quotes / em-dash / Unicode whitespace before comparison', () => {
    // Replace ASCII apostrophe / hyphen / spaces with smart variants in the candidate.
    // The cited paragraph (P0) uses an ASCII apostrophe in "Don't" and an en-dash.
    const smartQuoted: SignatureMove = {
      ...baseValid,
      instances: [
        {
          kind: 'sentence_quote',
          location: { paragraph: 0, sentence: 2 },
          // smart apostrophe + em-dash + non-breaking space
          quotedText: "Don’t get the wrong idea, now—I’m not a taxidermist or anything",
          whatThisInstanceShows: 'voiced denial of misread',
        },
      ],
    };
    const result = validateSignatureMoveAgainstParagraphs(smartQuoted, PARAGRAPHS);
    expect(result).not.toBeNull();
  });

  it('drops to null when paragraph index is out of range (high)', () => {
    const oor: SignatureMove = {
      ...baseValid,
      instances: [
        {
          kind: 'sentence_quote',
          location: { paragraph: 99, sentence: 0 },
          quotedText: 'My nightstand',
          whatThisInstanceShows: 'oor',
        },
      ],
    };
    expect(validateSignatureMoveAgainstParagraphs(oor, PARAGRAPHS)).toBeNull();
  });

  it('drops to null when paragraph index is negative', () => {
    const oor: SignatureMove = {
      ...baseValid,
      instances: [
        { kind: 'paragraph_compression', paragraph: -1, whatThisInstanceShows: 'oor' },
      ],
    };
    expect(validateSignatureMoveAgainstParagraphs(oor, PARAGRAPHS)).toBeNull();
  });

  it('drops to null when cross_paragraph_pattern has fewer than 2 paragraphs', () => {
    const tooFew: SignatureMove = {
      ...baseValid,
      instances: [
        { kind: 'cross_paragraph_pattern', paragraphs: [1], whatThisInstanceShows: 'one' },
      ],
    };
    expect(validateSignatureMoveAgainstParagraphs(tooFew, PARAGRAPHS)).toBeNull();
  });

  it('drops to null when cross_paragraph_pattern has any out-of-range paragraph', () => {
    const oor: SignatureMove = {
      ...baseValid,
      instances: [
        { kind: 'cross_paragraph_pattern', paragraphs: [1, 99], whatThisInstanceShows: 'pattern' },
      ],
    };
    expect(validateSignatureMoveAgainstParagraphs(oor, PARAGRAPHS)).toBeNull();
  });

  it('drops to null when instances array is empty', () => {
    const empty: SignatureMove = { ...baseValid, instances: [] };
    expect(validateSignatureMoveAgainstParagraphs(empty, PARAGRAPHS)).toBeNull();
  });

  it('returns null on null input (preserves null)', () => {
    expect(validateSignatureMoveAgainstParagraphs(null, PARAGRAPHS)).toBeNull();
    expect(validateSignatureMoveAgainstParagraphs(undefined, PARAGRAPHS)).toBeNull();
  });

  it('routes diagnostics through the optional callback when provided', () => {
    const messages: string[] = [];
    const drift: SignatureMove = {
      ...baseValid,
      instances: [
        {
          kind: 'sentence_quote',
          location: { paragraph: 0, sentence: 0 },
          quotedText: 'not present in p0',
          whatThisInstanceShows: 'x',
        },
      ],
    };
    const result = validateSignatureMoveAgainstParagraphs(drift, PARAGRAPHS, (m) => messages.push(m));
    expect(result).toBeNull();
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/not a substring/);
  });
});
