// ============================================================================
// rewrite-prompts — system prompt + cached prefix + per-call tail tests
// ============================================================================
// Validates the three prompt builders for generateEssayLevelRewrites():
//   1. buildRewriteSystemPrompt — byte-identical across invocations
//      (cache-key sanity); all 10 load-bearing rules present; JSON skeleton
//      structurally correct
//   2. buildRewriteSharedPrefix — renders every input section; deterministic
//   3. buildRewriteUserTail — gaps + priorDrafts; starts with gap directive

import { describe, it, expect } from 'vitest';

import {
  buildRewriteSystemPrompt,
  buildRewriteSharedPrefix,
  buildRewriteUserTail,
  isEssayLevelRewritesEnabled,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type {
  GenerateEssayLevelRewritesInput,
  RewriteGap,
} from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type { PriorRewriteDigest } from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures
// ───────────────────────────────────────────────────────────────────────────

function makeGap(overrides: Partial<RewriteGap> = {}): RewriteGap {
  return {
    id: overrides.id ?? 'CAND_L3_P2S4_xyz',
    anchorLocation: overrides.anchorLocation ?? { paragraph: 2, sentence: null, spanText: null },
    candidateAnchors: overrides.candidateAnchors ?? [
      {
        paragraph: 3,
        sentence: 0,
        source: 'mem_moment',
        momentDescription: 'The mastery claim: "I learned to channel the magic"',
      },
    ],
    missingMechanism: overrides.missingMechanism ?? 'intellectual_scaffolding',
    whatItShouldProvide: overrides.whatItShouldProvide ?? 'a turning-point sentence between P2 and P3',
    architecturalReason: overrides.architecturalReason ?? 'P2 is the only sustained scene; the mastery claim happens in white space',
    unlocksNext: overrides.unlocksNext ?? 'P3 gift-giving purpose becomes natural',
    expectedImpact: overrides.expectedImpact ?? 'transformative',
    consolidatedFrom: overrides.consolidatedFrom ?? ['CAND_L3_P2S4_xyz'],
    wordBudget: overrides.wordBudget ?? {
      paragraphCurrentWords: 95,
      essayCurrentWords: 491,
      essayMaxWords: 650,
      targetDelta: { min: 30, max: 47 },
    },
  };
}

function makeInput(overrides: Partial<GenerateEssayLevelRewritesInput> = {}): GenerateEssayLevelRewritesInput {
  return {
    gaps: overrides.gaps ?? [makeGap()],
    styleProfile: overrides.styleProfile ?? {
      registerBaseline: 'conversational with formal historical interludes',
      distinctivePatterns: [
        'second-person reader address',
        'extended magical metaphor system',
        'paragraph-final fragments',
      ],
      voiceMarkers: ['em-dash pivots', 'paragraph-final fragments'],
      voiceWeaknesses: ['retreats to abstract civic vocabulary in closings'],
      vocabularyDomains: [
        { domain: 'whimsical domestic', exampleWords: ['menagerie', 'critters'] },
        { domain: 'magical/mythic', exampleWords: ['mage', 'enchanted', 'wizard'] },
      ],
      sentenceRhythmBaseline: 'clause-heavy with staccato emphasis',
      tonalQualities: ['earnestness', 'self_awareness'],
      intellectualFingerprint: 'thinks through metaphor systems; compresses time efficiently',
      imageSystem: 'three registers layer (domestic → natural → textile)',
      signatureMove: {
        oneSentenceName: 'Disproportion-then-inversion architecture',
        readerEffect: 'reader pulled forward by misdirection, reoriented by weight',
        whyItIsTheirs: 'The essay depends structurally on making the reader underestimate crochet',
      },
    },
    constraints: overrides.constraints ?? {
      preserveSpans: [
        {
          description: 'The misdirection opening',
          locations: [{ paragraph: 0, sentence: 0 }, { paragraph: 0, sentence: 2 }],
          whyProtect: 'Three-sentence architecture establishes the voice contract.',
        },
      ],
      signatureMoveInstances: [],
      emotionalRegisterConstraint:
        'Preserve restraint on grandfather imprisonment; no melodrama on trauma.',
      highEffectivenessParagraphs: [
        { paragraph: 0, effectiveness: 80, why: 'Misdirection opener works' },
        { paragraph: 2, effectiveness: 80, why: 'Cyclical failure scene works' },
      ],
    },
    context: overrides.context ?? {
      essayText: 'My nightstand is home to a menagerie...\n\nMy grandmother wielded her crochet hook...',
      paragraphs: [
        { index: 0, text: 'P0 text', structuralRole: 'Misdirection frame', effectiveness: 80, verdict: 'Voice contract' },
        { index: 1, text: 'P1 text', structuralRole: 'Historical compression', effectiveness: 65, verdict: 'Carries weight' },
      ],
      throughLineMap: {
        centralElement: 'crochet as inheritance medium',
        elementType: 'relationship',
        transformation: 'Crochet transforms from survival tool to chosen practice',
        journey: [],
        connectionRefs: [],
      },
      transformativeInsight: {
        insight: "The essay's power comes from the grandmother's intentional reversal.",
        whyThisTransforms: 'Understanding the reversal reframes the entire essay.',
      },
    },
    priorDrafts: overrides.priorDrafts,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 1. System prompt — cache-key sanity (byte-identical across calls)
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteSystemPrompt — cache-key invariant', () => {
  it('produces byte-identical output across calls for the same scale', () => {
    const a = buildRewriteSystemPrompt('personal_statement');
    const b = buildRewriteSystemPrompt('personal_statement');
    const c = buildRewriteSystemPrompt('personal_statement');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('is non-trivial (substantial prompt content)', () => {
    const p = buildRewriteSystemPrompt('personal_statement');
    expect(p.length).toBeGreaterThan(3000);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. System prompt — all 10 draft generation rules present
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteSystemPrompt — load-bearing rules', () => {
  const p = buildRewriteSystemPrompt('personal_statement');

  it('Rule 1: at least one distinctive pattern required', () => {
    expect(p).toMatch(/AT LEAST ONE of the writer's distinctive patterns/i);
  });

  it('Rule 2: at least one vocabulary domain required', () => {
    expect(p).toMatch(/AT LEAST ONE of the writer's vocabulary domains/i);
  });

  it('Rule 3: avoid voice weaknesses', () => {
    expect(p).toMatch(/styleProfile\.voiceWeaknesses/);
  });

  it('Rule 4: do not copy preserveSpans verbatim', () => {
    expect(p).toMatch(/preserveSpans verbatim/i);
  });

  it('Rule 5: sentence length within ±20% of baseline', () => {
    expect(p).toMatch(/±20%/);
  });

  it('Rule 6: image system continues, not abandoned', () => {
    expect(p).toMatch(/IMAGE SYSTEM continues|EXTENDS it, never abandons/i);
  });

  it('Rule 7: emotional calibration / preserve restraint', () => {
    expect(p).toMatch(/EMOTIONAL CALIBRATION|preserves restraint|Do not melodramatize/i);
  });

  it('Rule 8: echo protected strengths rhythm', () => {
    expect(p).toMatch(/ECHO PROTECTED STRENGTHS|voice anchor/i);
  });

  it('Rule 9: anti-pattern honesty', () => {
    expect(p).toMatch(/ANTI-PATTERN HONESTY|not a strawman/i);
  });

  it('Rule 10: no meta-language in draft.text', () => {
    expect(p).toMatch(/NO META-LANGUAGE/i);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. System prompt — Q-decision enforcement clauses
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteSystemPrompt — Q-decision enforcement', () => {
  const p = buildRewriteSystemPrompt('personal_statement');

  it('Q1: candidateAnchors-driven anchor picking', () => {
    expect(p).toMatch(/candidateAnchors/);
  });

  it('Q3: word budget targetDelta enforcement', () => {
    expect(p).toMatch(/targetDelta\.min <= wordDelta <= targetDelta\.max/);
  });

  it('Q3: essay-level ceiling enforcement', () => {
    expect(p).toMatch(/essayCurrentWords \+ wordDelta > essayMaxWords/);
  });

  it('Q4: prior-drafts directive (do not re-emit verbatim)', () => {
    expect(p).toMatch(/Do NOT re-emit any draft text byte-identical/);
  });

  it('Q6c: zero-drafts fallback annotation directive', () => {
    expect(p).toMatch(/fallbackReason='zero_drafts_after_retry'/);
  });

  it('multi-draft requirement: exactly 3 variants per gap', () => {
    expect(p).toMatch(/EXACTLY 3 draft variants/);
  });

  it('three intensity levels named: minimal / scene / insight', () => {
    expect(p).toMatch(/"minimal"/);
    expect(p).toMatch(/"scene"/);
    expect(p).toMatch(/"insight"/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. System prompt — output schema skeleton + self-check
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteSystemPrompt — output schema + self-check', () => {
  const p = buildRewriteSystemPrompt('personal_statement');

  it('declares the three top-level output arrays/object', () => {
    expect(p).toMatch(/growthAnnotations/);
    expect(p).toMatch(/preservationAnnotations/);
    expect(p).toMatch(/reframeAnnotation/);
  });

  it('declares the draftVariants array shape', () => {
    expect(p).toMatch(/draftVariants/);
    expect(p).toMatch(/voicePreservationNotes/);
    expect(p).toMatch(/antiPattern/);
    expect(p).toMatch(/wordEconomyCut/);
    expect(p).toMatch(/voiceCheck/);
  });

  it('declares preservation-annotation fields', () => {
    expect(p).toMatch(/weakeningAntiPattern/);
    expect(p).toMatch(/technique/);
  });

  it('declares reframe-annotation fields', () => {
    expect(p).toMatch(/insight/);
    expect(p).toMatch(/whyThisTransforms/);
  });

  it('JSON-only output directive (no markdown, no code fences)', () => {
    expect(p).toMatch(/no markdown, no code fences/);
  });

  it('self-check block with 6 verification questions', () => {
    expect(p).toMatch(/SELF-CHECK BEFORE EMITTING/);
    expect(p).toMatch(/AT LEAST ONE pattern/);
    expect(p).toMatch(/AT LEAST ONE styleProfile\.vocabularyDomains/);
    expect(p).toMatch(/sentence-length average plausibly within ±20%/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Shared prefix — all input sections rendered
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteSharedPrefix — input rendering', () => {
  it('renders essay text under === ESSAY TEXT === header', () => {
    const prefix = buildRewriteSharedPrefix(makeInput());
    expect(prefix).toMatch(/=== ESSAY TEXT ===/);
    expect(prefix).toMatch(/My nightstand is home to a menagerie/);
  });

  it('renders the full style profile (register, patterns, markers, weaknesses, domains, rhythm)', () => {
    const prefix = buildRewriteSharedPrefix(makeInput());
    expect(prefix).toMatch(/=== STYLE PROFILE ===/);
    expect(prefix).toMatch(/Register baseline:.*conversational/);
    expect(prefix).toMatch(/Sentence rhythm baseline:.*clause-heavy/);
    expect(prefix).toMatch(/extended magical metaphor system/);
    expect(prefix).toMatch(/em-dash pivots/);
    expect(prefix).toMatch(/retreats to abstract civic vocabulary/);
    expect(prefix).toMatch(/whimsical domestic/);
    expect(prefix).toMatch(/magical\/mythic/);
  });

  it('renders signature move when present', () => {
    const prefix = buildRewriteSharedPrefix(makeInput());
    expect(prefix).toMatch(/Signature move: Disproportion-then-inversion/);
    expect(prefix).toMatch(/Why it is theirs:/);
    expect(prefix).toMatch(/Reader effect:/);
  });

  it('renders "(none)" signature move when null', () => {
    const input = makeInput();
    (input.styleProfile as { signatureMove?: unknown }).signatureMove = null;
    const prefix = buildRewriteSharedPrefix(input);
    expect(prefix).toMatch(/Signature move: \(none/);
  });

  it('renders preservation contract (emotional register + preserve spans + high-eff paragraphs)', () => {
    const prefix = buildRewriteSharedPrefix(makeInput());
    expect(prefix).toMatch(/=== PRESERVATION CONTRACT ===/);
    expect(prefix).toMatch(/Emotional register constraint:/);
    expect(prefix).toMatch(/Preserve spans/);
    expect(prefix).toMatch(/\[P0S0, P0S2\]/);
    expect(prefix).toMatch(/High-effectiveness paragraphs/);
    expect(prefix).toMatch(/P0 \(effectiveness=80\)/);
    expect(prefix).toMatch(/P2 \(effectiveness=80\)/);
  });

  it('renders essay context (paragraph map + through-line + transformative insight)', () => {
    const prefix = buildRewriteSharedPrefix(makeInput());
    expect(prefix).toMatch(/=== ESSAY CONTEXT ===/);
    expect(prefix).toMatch(/P0: role="Misdirection frame"/);
    expect(prefix).toMatch(/Through-line: crochet as inheritance medium/);
    expect(prefix).toMatch(/Transformative insight:/);
    expect(prefix).toMatch(/Why this transforms:/);
  });

  it('is byte-identical across calls with the same input (cache-key invariant)', () => {
    const input = makeInput();
    const a = buildRewriteSharedPrefix(input);
    const b = buildRewriteSharedPrefix(input);
    expect(a).toBe(b);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. Per-call tail — gaps + prior drafts + emit directive
// ───────────────────────────────────────────────────────────────────────────

describe('buildRewriteUserTail — per-call directive', () => {
  it('starts with === GAPS TO ADDRESS === header', () => {
    const tail = buildRewriteUserTail(makeInput());
    expect(tail.startsWith('=== GAPS TO ADDRESS ===')).toBe(true);
  });

  it('renders each gap with id + impact + mechanism + budget + candidate anchors', () => {
    const tail = buildRewriteUserTail(makeInput());
    expect(tail).toMatch(/Gap ID: CAND_L3_P2S4_xyz/);
    expect(tail).toMatch(/Expected impact: transformative/);
    expect(tail).toMatch(/Missing mechanism: intellectual_scaffolding/);
    expect(tail).toMatch(/Word budget: paragraph has 95 words, essay has 491\/650, targetDelta 30-47 words/);
    expect(tail).toMatch(/Candidate anchors \(from MomentEarnednessMap\):/);
    expect(tail).toMatch(/P3S0: The mastery claim/);
  });

  it('renders "(none — anchor at P{N} top)" when candidateAnchors is empty', () => {
    const input = makeInput();
    input.gaps[0].candidateAnchors = [];
    const tail = buildRewriteUserTail(input);
    expect(tail).toMatch(/Candidate anchors: \(none — anchor at P2 top\)/);
  });

  it('does NOT include === PRIOR DRAFTS === section when priorDrafts is absent', () => {
    const tail = buildRewriteUserTail(makeInput());
    expect(tail).not.toMatch(/=== PRIOR DRAFTS/);
  });

  it('includes === PRIOR DRAFTS === section + entries when priorDrafts is present', () => {
    const priorDrafts: PriorRewriteDigest[] = [
      {
        gapId: 'CAND_L3_P2S4_xyz',
        draftText: 'Then one afternoon, the hook stopped fighting me.',
        intensityLevel: 'minimal',
        wasApplied: true,
        generatedAt: 1716000000000,
      },
      {
        gapId: 'CAND_L4_P4S1_def',
        draftText: 'A different draft text that was not applied.',
        intensityLevel: 'scene',
        wasApplied: false,
        generatedAt: 1716000000000,
      },
    ];
    const tail = buildRewriteUserTail(makeInput({ priorDrafts }));
    expect(tail).toMatch(/=== PRIOR DRAFTS \(re-analysis context\) ===/);
    expect(tail).toMatch(/Gap CAND_L3_P2S4_xyz \[minimal\] \(APPLIED\)/);
    expect(tail).toMatch(/Gap CAND_L4_P4S1_def \[scene\] \(NOT applied\)/);
    expect(tail).toMatch(/Do NOT re-emit any of the above drafts verbatim/);
  });

  it('ends with === EMIT === directive', () => {
    const tail = buildRewriteUserTail(makeInput());
    expect(tail).toMatch(/=== EMIT ===/);
    expect(tail).toMatch(/JSON only/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 7. Feature flag
// ───────────────────────────────────────────────────────────────────────────

describe('isEssayLevelRewritesEnabled', () => {
  it('returns false by default (env unset)', () => {
    const prev = process.env.L5_ESSAY_LEVEL_REWRITES;
    delete process.env.L5_ESSAY_LEVEL_REWRITES;
    expect(isEssayLevelRewritesEnabled()).toBe(false);
    if (prev !== undefined) process.env.L5_ESSAY_LEVEL_REWRITES = prev;
  });

  it('returns true when env is "true"', () => {
    const prev = process.env.L5_ESSAY_LEVEL_REWRITES;
    process.env.L5_ESSAY_LEVEL_REWRITES = 'true';
    expect(isEssayLevelRewritesEnabled()).toBe(true);
    if (prev !== undefined) process.env.L5_ESSAY_LEVEL_REWRITES = prev;
    else delete process.env.L5_ESSAY_LEVEL_REWRITES;
  });

  it('returns false for any other truthy string (strict equality)', () => {
    const prev = process.env.L5_ESSAY_LEVEL_REWRITES;
    process.env.L5_ESSAY_LEVEL_REWRITES = '1';
    expect(isEssayLevelRewritesEnabled()).toBe(false);
    process.env.L5_ESSAY_LEVEL_REWRITES = 'TRUE';
    expect(isEssayLevelRewritesEnabled()).toBe(false);
    if (prev !== undefined) process.env.L5_ESSAY_LEVEL_REWRITES = prev;
    else delete process.env.L5_ESSAY_LEVEL_REWRITES;
  });
});
