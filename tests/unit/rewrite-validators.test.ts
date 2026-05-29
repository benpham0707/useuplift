// ============================================================================
// rewrite-validators — post-call validator tests
// ============================================================================
// Three deterministic validators enforce the locked design decisions on
// every emitted RewriteDraft:
//   - validateDraftPreservation (Q6b): no 12+ word substring copied from preserveSpans
//   - voiceCheckDraft (Q1.5/Q5): distinctive pattern + vocabulary domain + sentence avg
//   - validateBudget (Q3): wordDelta within targetDelta; wordEconomyCut on overflow

import { describe, it, expect } from 'vitest';

import {
  validateDraftPreservation,
  voiceCheckDraft,
  validateBudget,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type {
  PreservationContract,
  RewriteDraft,
  RewriteGap,
  StyleProfile,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

function makeDraft(overrides: Partial<RewriteDraft> = {}): RewriteDraft {
  return {
    text:
      overrides.text ??
      "Then one afternoon the hook stopped fighting me — not because I'd changed my grip, but because my hands had stopped expecting it to be hard.",
    intensityLevel: overrides.intensityLevel ?? 'minimal',
    wordDelta: overrides.wordDelta ?? 30,
    voicePreservationNotes:
      overrides.voicePreservationNotes ?? 'Uses em-dash pivot and magical metaphor system.',
    addressesGapMechanism: overrides.addressesGapMechanism ?? 'intellectual_scaffolding',
    antiPattern: overrides.antiPattern ?? {
      text: 'After months of practice, I finally got the hang of it.',
      whyItFails: 'Generic transformation language.',
    },
    wordEconomyCut: overrides.wordEconomyCut ?? null,
    voiceCheck: overrides.voiceCheck ?? {
      distinctivePatternsUsed: ['em-dash pivots'],
      vocabularyDomainsUsed: ['magical/mythic'],
      sentenceLengthAvg: 14.5,
      selfReportedPass: true,
    },
  };
}

function makeStyleProfile(overrides: Partial<StyleProfile> = {}): StyleProfile {
  return {
    registerBaseline: overrides.registerBaseline ?? 'conversational',
    distinctivePatterns: overrides.distinctivePatterns ?? ['em-dash pivots', 'magical metaphor'],
    voiceMarkers: overrides.voiceMarkers ?? ['em-dash pivots'],
    voiceWeaknesses: overrides.voiceWeaknesses ?? ['abstract civic vocabulary'],
    vocabularyDomains: overrides.vocabularyDomains ?? [
      { domain: 'whimsical domestic', exampleWords: ['menagerie', 'critters'] },
      { domain: 'magical/mythic', exampleWords: ['hook', 'magic', 'enchanted', 'wizard'] },
    ],
    sentenceRhythmBaseline: overrides.sentenceRhythmBaseline ?? 'clause-heavy with staccato',
    tonalQualities: overrides.tonalQualities ?? ['earnestness'],
    intellectualFingerprint: overrides.intellectualFingerprint ?? 'thinks through metaphor',
    imageSystem: overrides.imageSystem ?? 'magic system',
    signatureMove: overrides.signatureMove ?? null,
  };
}

function makeConstraints(overrides: Partial<PreservationContract> = {}): PreservationContract {
  return {
    preserveSpans: overrides.preserveSpans ?? [
      {
        description:
          'The misdirection opening (menagerie of critters with glass-eyed specimens lovingly stuffed with cotton)',
        locations: [{ paragraph: 0, sentence: 0 }],
        whyProtect: 'voice contract',
      },
    ],
    signatureMoveInstances: overrides.signatureMoveInstances ?? [],
    emotionalRegisterConstraint: overrides.emotionalRegisterConstraint ?? 'preserve restraint',
    highEffectivenessParagraphs: overrides.highEffectivenessParagraphs ?? [],
  };
}

function makeGap(overrides: Partial<RewriteGap> = {}): RewriteGap {
  return {
    id: overrides.id ?? 'g1',
    anchorLocation: overrides.anchorLocation ?? { paragraph: 2, sentence: null, spanText: null },
    candidateAnchors: overrides.candidateAnchors ?? [],
    missingMechanism: overrides.missingMechanism ?? 'intellectual_scaffolding',
    whatItShouldProvide: overrides.whatItShouldProvide ?? 'a bridge',
    architecturalReason: overrides.architecturalReason ?? 'reason',
    unlocksNext: overrides.unlocksNext ?? 'unlocks',
    expectedImpact: overrides.expectedImpact ?? 'transformative',
    consolidatedFrom: overrides.consolidatedFrom ?? [],
    wordBudget: overrides.wordBudget ?? {
      paragraphCurrentWords: 95,
      essayCurrentWords: 491,
      essayMaxWords: 650,
      targetDelta: { min: 30, max: 47 },
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 1. validateDraftPreservation (Q6b)
// ───────────────────────────────────────────────────────────────────────────

describe('validateDraftPreservation', () => {
  it('passes when draft does not overlap any preserve span', () => {
    const result = validateDraftPreservation(makeDraft(), makeConstraints());
    expect(result.pass).toBe(true);
  });

  it('fails when draft copies a 12+ word substring from a preserveSpan description', () => {
    // The preserveSpan description is "The misdirection opening (menagerie of
    // critters with glass-eyed specimens lovingly stuffed with cotton)" — 13
    // tokens after normalization. Draft below copies the full 13-token phrase.
    const draft = makeDraft({
      text:
        'I opened with the misdirection opening menagerie of critters with glass-eyed specimens lovingly stuffed with cotton, all watching from my nightstand.',
    });
    const result = validateDraftPreservation(draft, makeConstraints());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/copies 12\+ words/);
  });

  it('passes when overlap is shorter than 12 words (lenient — partial reuse OK)', () => {
    // "menagerie of critters with glass-eyed specimens lovingly stuffed with cotton"
    // is 10 tokens of overlap — below the 12-token threshold, so allowed.
    const draft = makeDraft({
      text: 'A menagerie of critters with glass-eyed specimens lovingly stuffed with cotton lived on my shelf.',
    });
    const result = validateDraftPreservation(draft, makeConstraints());
    expect(result.pass).toBe(true);
  });

  it('is case-insensitive', () => {
    const draft = makeDraft({
      text:
        'I OPENED WITH THE MISDIRECTION OPENING MENAGERIE OF CRITTERS WITH GLASS-EYED SPECIMENS LOVINGLY STUFFED WITH COTTON.',
    });
    const result = validateDraftPreservation(draft, makeConstraints());
    expect(result.pass).toBe(false);
  });

  it('skips preserve-span descriptions shorter than 30 chars', () => {
    const constraints = makeConstraints({
      preserveSpans: [
        {
          description: 'Short span',
          locations: [],
          whyProtect: 'why',
        },
      ],
    });
    const draft = makeDraft({ text: 'A perfectly fine draft that happens to mention Short span.' });
    const result = validateDraftPreservation(draft, constraints);
    expect(result.pass).toBe(true);
  });

  it('fails on empty draft text', () => {
    const result = validateDraftPreservation({ text: '' }, makeConstraints());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/empty/);
  });

  it('passes when there are no preserveSpans', () => {
    const result = validateDraftPreservation(makeDraft(), makeConstraints({ preserveSpans: [] }));
    expect(result.pass).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. voiceCheckDraft (Q1.5/Q5)
// ───────────────────────────────────────────────────────────────────────────

describe('voiceCheckDraft', () => {
  it('passes when draft uses a real distinctive pattern + has vocabulary overlap + reports sentence avg', () => {
    const result = voiceCheckDraft(makeDraft(), makeStyleProfile());
    expect(result.pass).toBe(true);
  });

  it("fails when LLM's distinctivePatternsUsed doesn't match any real styleProfile pattern", () => {
    const draft = makeDraft({
      voiceCheck: {
        distinctivePatternsUsed: ['invented pattern that does not exist'],
        vocabularyDomainsUsed: ['magical/mythic'],
        sentenceLengthAvg: 14.5,
        selfReportedPass: true,
      },
    });
    const result = voiceCheckDraft(draft, makeStyleProfile());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/no real distinctivePattern/);
  });

  it('fails when draft text contains no vocabulary-domain example word', () => {
    const draft = makeDraft({
      text: 'A bland sentence with absolutely none of the writer-specific words present here.',
    });
    const result = voiceCheckDraft(draft, makeStyleProfile());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/no vocabulary-domain example word/);
  });

  it('passes when draft uses at least one vocabulary word (lenient floor)', () => {
    const draft = makeDraft({
      text: 'I held the hook with care.',
    });
    const result = voiceCheckDraft(draft, makeStyleProfile());
    expect(result.pass).toBe(true);
  });

  it('fails when voiceCheck.sentenceLengthAvg is missing or zero', () => {
    const draft = makeDraft({
      voiceCheck: {
        distinctivePatternsUsed: ['em-dash pivots'],
        vocabularyDomainsUsed: ['magical/mythic'],
        sentenceLengthAvg: 0,
        selfReportedPass: true,
      },
    });
    const result = voiceCheckDraft(draft, makeStyleProfile());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/sentenceLengthAvg/);
  });

  it('fails when styleProfile has zero distinctive patterns (can never pass)', () => {
    const result = voiceCheckDraft(makeDraft(), makeStyleProfile({ distinctivePatterns: [] }));
    expect(result.pass).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. validateBudget (Q3)
// ───────────────────────────────────────────────────────────────────────────

describe('validateBudget', () => {
  it('passes when wordDelta is within targetDelta range and essay has room', () => {
    const result = validateBudget(makeDraft({ wordDelta: 30 }), makeGap());
    expect(result.pass).toBe(true);
  });

  it('passes at exactly targetDelta.min', () => {
    const result = validateBudget(makeDraft({ wordDelta: 30 }), makeGap());
    expect(result.pass).toBe(true);
  });

  it('passes at exactly targetDelta.max', () => {
    const result = validateBudget(makeDraft({ wordDelta: 47 }), makeGap());
    expect(result.pass).toBe(true);
  });

  it('fails when wordDelta below targetDelta.min', () => {
    const result = validateBudget(makeDraft({ wordDelta: 5 }), makeGap());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/outside targetDelta/);
  });

  it('fails when wordDelta above targetDelta.max', () => {
    const result = validateBudget(makeDraft({ wordDelta: 70 }), makeGap());
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/outside targetDelta/);
  });

  it('fails when additive draft would push essay past max AND no wordEconomyCut', () => {
    const gap = makeGap({
      wordBudget: {
        paragraphCurrentWords: 95,
        essayCurrentWords: 640,
        essayMaxWords: 650,
        targetDelta: { min: 30, max: 50 },
      },
    });
    const draft = makeDraft({ wordDelta: 30, wordEconomyCut: null });
    const result = validateBudget(draft, gap);
    expect(result.pass).toBe(false);
    expect(result.reason).toMatch(/push essay past max/);
  });

  it('passes when additive draft would exceed essay max BUT wordEconomyCut is provided', () => {
    const gap = makeGap({
      wordBudget: {
        paragraphCurrentWords: 95,
        essayCurrentWords: 640,
        essayMaxWords: 650,
        targetDelta: { min: 30, max: 50 },
      },
    });
    const draft = makeDraft({
      wordDelta: 30,
      wordEconomyCut: {
        location: { paragraph: 1, sentence: 6 },
        quote: 'wisdom and confidence',
        wordsRemoved: 25,
        reason: 'Tight phrase.',
      },
    });
    const result = validateBudget(draft, gap);
    expect(result.pass).toBe(true);
  });

  it('does not require wordEconomyCut when wordDelta is zero/negative', () => {
    const gap = makeGap({
      wordBudget: {
        paragraphCurrentWords: 95,
        essayCurrentWords: 640,
        essayMaxWords: 650,
        targetDelta: { min: -10, max: 50 },
      },
    });
    const draft = makeDraft({ wordDelta: 0, wordEconomyCut: null });
    const result = validateBudget(draft, gap);
    expect(result.pass).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Validator output contract
// ───────────────────────────────────────────────────────────────────────────

describe('all validators — output contract', () => {
  it('return { pass: true } with no reason on success', () => {
    const r1 = validateDraftPreservation(makeDraft(), makeConstraints());
    const r2 = voiceCheckDraft(makeDraft(), makeStyleProfile());
    const r3 = validateBudget(makeDraft(), makeGap());
    expect(r1.pass).toBe(true);
    expect(r1.reason).toBeUndefined();
    expect(r2.pass).toBe(true);
    expect(r2.reason).toBeUndefined();
    expect(r3.pass).toBe(true);
    expect(r3.reason).toBeUndefined();
  });

  it('return { pass: false, reason: string } on failure (debuggable)', () => {
    const r1 = validateDraftPreservation({ text: '' }, makeConstraints());
    expect(r1.pass).toBe(false);
    expect(typeof r1.reason).toBe('string');
    expect(r1.reason!.length).toBeGreaterThan(0);
  });
});
