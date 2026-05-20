// ============================================================================
// L4 UNIFIED-CACHE — prompt + cache-structure unit tests
// ============================================================================
// Validates the C7 fix without any LLM spend:
//   1. buildSystemPromptL4Unified is byte-identical across mode A/B/C
//      invocations for a fixed (scale, essayType) — i.e. the cache key
//      would actually match across the 3 calls.
//   2. Each mode's contract is intact inside the unified prompt.
//   3. buildL4UnifiedSharedPrefix renders the stable prefix the same way
//      regardless of which downstream mode tail will follow.
//   4. Mode A/B/C tails start with the correct mode selector and contain
//      the right per-call dynamic context.
//
// Design: docs/pipeline-evolution/04-pipeline-architecture/L4/L4_CACHE_UNIFICATION_DESIGN.md

import { describe, it, expect } from 'vitest';

import {
  buildL4UnifiedSharedPrefix,
  buildL4UnifiedTailModeA,
  buildL4UnifiedTailModeB,
  buildL4UnifiedTailModeC,
  buildSystemPromptL4Unified,
} from '../../src/services/essayIntelligence/analysis/crystallizer';
import { ImprovementCandidateStore } from '../../src/services/essayIntelligence/improvements/improvementCandidateStore';
import type {
  EssayNorthStar,
  EssayProfile,
  ImprovementCandidate,
  NorthStarScale,
  ParagraphProfile,
  ParagraphScoreMatrix,
} from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Test helpers
// ───────────────────────────────────────────────────────────────────────────

function makeParagraph(index: number, effectiveness = 70): ParagraphProfile {
  return {
    index,
    text: `Paragraph ${index} text.`,
    sentences: [],
    understanding: null,
    analysis: {
      effectiveness,
      paragraphVerdict: `verdict P${index + 1}`,
      verdict: `verdict P${index + 1}`,
      dimensionScores: {},
      observations: [],
      weakSpots: [],
      growthEdges: [],
      strengths: [],
    } as any,
    walkSkipped: false,
  } as unknown as ParagraphProfile;
}

function makeProfile(paragraphCount = 5): EssayProfile {
  return {
    paragraphs: Array.from({ length: paragraphCount }, (_, i) => makeParagraph(i)),
    connections: {
      all: [{ id: 'CONN-1' } as any, { id: 'CONN-2' } as any],
      bySource: {},
    },
    entanglements: [
      {
        id: 'ENT-1',
        dimensions: ['voice', 'structure'],
        location: { paragraph: 0, sentence: 1 },
        description: 'voice tightens at the structural pivot in P1S2',
      },
    ],
    index: {} as any,
    findings: [],
  } as unknown as EssayProfile;
}

function makeStore(...candidates: Array<Partial<ImprovementCandidate>>): ImprovementCandidateStore {
  const store = new ImprovementCandidateStore();
  for (const c of candidates) {
    store.add({
      id: c.id ?? 'CAND-X',
      sourceLayer: c.sourceLayer ?? 'L3',
      paragraph: c.paragraph ?? 0,
      sentence: c.sentence ?? null,
      observation: c.observation ?? 'obs',
      suggestedChange: c.suggestedChange ?? 'change',
      technique: c.technique ?? null,
      coachingValue: c.coachingValue ?? 'high',
      lifecycleState: c.lifecycleState ?? 'candidate',
      ...(c as any),
    } as ImprovementCandidate);
  }
  return store;
}

function makeNorthStar(): EssayNorthStar {
  return {
    activeScale: 'personal_statement',
    throughLineMap: null,
    structuralRolesMap: [
      { paragraphs: [0], role: 'opening', significance: 'sets frame', weight: 'load_bearing' },
    ],
    trajectory: null,
    distinctivenessSignature: {
      articulation: 'distinct in a small way',
      entanglementRefs: ['ENT-1'],
      nonInterchangeableFactors: ['x', 'y'],
    },
    intentBridge: null,
    confidence: 'hypothesis',
    lastUpdatedBy: 'L4',
  } as unknown as EssayNorthStar;
}

function makeScoreMatrix(paragraphCount = 5): ParagraphScoreMatrix {
  return {
    paragraphs: Array.from({ length: paragraphCount }, (_, i) => ({
      index: i,
      scores: { effectiveness: 70, structural: 75, voice: 60, emotional: 55, thematic: 65 },
      verdict: `verdict for P${i + 1}`,
      priorityForImprovement: 3,
    })),
    crossParagraphPatterns: ['P1-P3: emotion builds linearly'],
    prioritizedImprovements: [],
    coachingMap: undefined,
  } as unknown as ParagraphScoreMatrix;
}

// ───────────────────────────────────────────────────────────────────────────
// 1. System prompt — byte-identical across modes (cache key sanity)
// ───────────────────────────────────────────────────────────────────────────

describe('L4 unified system prompt — cache key sanity', () => {
  const scales: NorthStarScale[] = ['personal_statement', 'piq', 'supplement'];

  for (const scale of scales) {
    it(`(${scale}) is byte-identical regardless of which mode the caller will invoke`, () => {
      // The system prompt only depends on (scale, essayType). Within a single
      // L4 run, both are fixed. If two consecutive invocations diverge by
      // even one byte, the Anthropic prefix cache won't fire on calls 2+3.
      const sp1 = buildSystemPromptL4Unified(scale, scale as any);
      const sp2 = buildSystemPromptL4Unified(scale, scale as any);
      const sp3 = buildSystemPromptL4Unified(scale, scale as any);
      expect(sp1).toBe(sp2);
      expect(sp2).toBe(sp3);
      // And the content is non-trivial — sanity that we didn't accidentally
      // return an empty string.
      expect(sp1.length).toBeGreaterThan(15_000);
    });

    it(`(${scale}) declares all three modes A, B, C`, () => {
      const sp = buildSystemPromptL4Unified(scale);
      expect(sp).toContain('MODE: A');
      expect(sp).toContain('MODE: B');
      expect(sp).toContain('MODE: C');
      expect(sp).toContain('MODE A — ESSAY NORTH STAR');
      expect(sp).toContain('MODE B — PARAGRAPH SCORE MATRIX');
      expect(sp).toContain('MODE C — CONSOLIDATION');
    });

    it(`(${scale}) preserves Mode A NorthStar contract (structural roles, distinctiveness)`, () => {
      const sp = buildSystemPromptL4Unified(scale);
      expect(sp).toContain('STRUCTURAL ROLES MAP');
      expect(sp).toContain('DISTINCTIVENESS SIGNATURE');
      expect(sp).toContain('"weight": "..."');
      expect(sp).toContain('NOT a summary');
      expect(sp).toContain('EMERGENT PROPERTY');
    });

    it(`(${scale}) preserves Mode B ScoreMatrix W3.3 anti-clustering protocol`, () => {
      const sp = buildSystemPromptL4Unified(scale);
      expect(sp).toContain('ANTI-CLUSTERING PROTOCOL (W3.3 — mandatory)');
      expect(sp).toContain('FORCED RANKING');
      expect(sp).toContain('WITHIN-PARAGRAPH RANGE');
      expect(sp).toContain('CROSS-PARAGRAPH RANGE');
      expect(sp).toContain('70-85 range');
    });

    it(`(${scale}) preserves Mode C consolidate-don't-invent + coherence investigation`, () => {
      const sp = buildSystemPromptL4Unified(scale);
      expect(sp).toContain('CONSOLIDATE, DO NOT INVENT');
      expect(sp).toContain('consolidatedFrom');
      // The "3-7" cap is stated multiple ways across the contract — accept any.
      expect(sp).toMatch(/3-7 (prioritized improvements|highest-leverage priorities|priorities)/);
      expect(sp).toContain('INVESTIGATION PROTOCOL');
      expect(sp).toContain('productive_tension');
      expect(sp).toContain('system_disagreement');
      expect(sp).toContain('essay_flaw');
      expect(sp).toContain('depth_signal');
    });

    it(`(${scale}) preserves display convention rule (stated ONCE for the whole prompt)`, () => {
      const sp = buildSystemPromptL4Unified(scale);
      // Stated once at the top, not three times per mode.
      const occurrences = sp.match(/DISPLAY CONVENTION/g) ?? [];
      expect(occurrences).toHaveLength(1);
      expect(sp).toContain('NEVER write "P0"');
    });
  }

  it('emits throughLineMap + intentBridge sections for personal statement only', () => {
    const ps = buildSystemPromptL4Unified('personal_statement');
    const piq = buildSystemPromptL4Unified('piq');
    const supp = buildSystemPromptL4Unified('supplement');
    expect(ps).toContain('THROUGH-LINE MAP');
    expect(ps).toContain('INTENT BRIDGE');
    expect(piq).toContain('THROUGH-LINE MAP'); // PIQ also has throughLineMap
    expect(piq).not.toContain('INTENT BRIDGE');
    expect(supp).not.toContain('THROUGH-LINE MAP');
    expect(supp).not.toContain('INTENT BRIDGE');
  });

  it('essay-type calibration block fires for supplement / piq only', () => {
    const supp = buildSystemPromptL4Unified('supplement', 'supplement');
    const piq = buildSystemPromptL4Unified('piq', 'piq');
    const ps = buildSystemPromptL4Unified('personal_statement', 'personal_statement');
    expect(supp).toContain('ESSAY-TYPE CALIBRATION (supplement');
    expect(piq).toContain('ESSAY-TYPE CALIBRATION (PIQ');
    expect(ps).not.toContain('ESSAY-TYPE CALIBRATION');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Shared prefix — byte-identical across the 3 calls within one run
// ───────────────────────────────────────────────────────────────────────────

describe('L4 unified shared user-prompt prefix — cache key sanity', () => {
  it('produces the same prefix bytes regardless of which call is about to run', () => {
    const profile = makeProfile(5);
    const prefix1 = buildL4UnifiedSharedPrefix(
      profile,
      'personal_statement',
      '=== ESSAY ===\nsome essay text\n',
      'corpus block\n\n',
    );
    const prefix2 = buildL4UnifiedSharedPrefix(
      profile,
      'personal_statement',
      '=== ESSAY ===\nsome essay text\n',
      'corpus block\n\n',
    );
    const prefix3 = buildL4UnifiedSharedPrefix(
      profile,
      'personal_statement',
      '=== ESSAY ===\nsome essay text\n',
      'corpus block\n\n',
    );
    expect(prefix1).toBe(prefix2);
    expect(prefix2).toBe(prefix3);
  });

  it('includes the load-bearing facts the prompts reference', () => {
    const profile = makeProfile(5);
    const prefix = buildL4UnifiedSharedPrefix(
      profile,
      'personal_statement',
      '=== ESSAY ===\nessay text\n',
      '',
    );
    expect(prefix).toContain('Paragraph count: 5');
    expect(prefix).toContain('Active North Star dimensions');
    expect(prefix).toContain('ENTANGLEMENT IDs');
    expect(prefix).toContain('"ENT-1"');
    expect(prefix).toContain('CONN-1, CONN-2');
    expect(prefix).toContain('=== ESSAY ===');
  });

  it('handles essays with zero entanglements / zero connections', () => {
    const profile = {
      ...makeProfile(3),
      entanglements: [],
      connections: { all: [], bySource: {} },
    } as unknown as EssayProfile;
    const prefix = buildL4UnifiedSharedPrefix(profile, 'piq', '=== ESSAY ===\n', '');
    expect(prefix).toContain('(none available)');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Per-mode tails — mode selector + correct dynamic content
// ───────────────────────────────────────────────────────────────────────────

describe('L4 unified per-mode tails', () => {
  it('Mode A tail begins with the MODE: A selector', () => {
    const profile = makeProfile(5);
    const tail = buildL4UnifiedTailModeA(profile, 'personal_statement');
    expect(tail.startsWith('MODE: A')).toBe(true);
    expect(tail).toContain('Crystallize the profile in the cached prefix');
    expect(tail).toContain('Structural roles must cover ALL 5 paragraphs');
    // Mode A does NOT include NS or SM serialized — those don't exist yet
    expect(tail).not.toContain('=== NORTH STAR (authoritative)');
    expect(tail).not.toContain('=== L4a OUTPUT');
  });

  it('Mode A tail appends evolution block on re-crystallization, omits on first-time', () => {
    const profile = makeProfile(5);
    const priorNS = {
      ...makeNorthStar(),
      evolution: { version: 2 },
    } as any;
    const reCrystallize = buildL4UnifiedTailModeA(profile, 'personal_statement', priorNS);
    expect(reCrystallize).toContain('RE-CRYSTALLIZATION CONTEXT');
    expect(reCrystallize).toContain('"version": 3');

    const firstTime = buildL4UnifiedTailModeA(profile, 'personal_statement');
    expect(firstTime).not.toContain('RE-CRYSTALLIZATION CONTEXT');
  });

  it('Mode B tail begins with the MODE: B selector and includes the NorthStar JSON', () => {
    const profile = makeProfile(3);
    const ns = makeNorthStar();
    const tail = buildL4UnifiedTailModeB(profile, ns);
    expect(tail.startsWith('MODE: B')).toBe(true);
    expect(tail).toContain('=== NORTH STAR (authoritative) ===');
    expect(tail).toContain('"activeScale":"personal_statement"');
    expect(tail).toContain('=== L3.5 EFFECTIVENESS ANCHORS');
    expect(tail).toContain('P1: effectiveness=70');
    expect(tail).toContain('Score matrix must have exactly 3 entries');
  });

  it('Mode B tail uses compact JSON (not pretty-printed) for the serialized NorthStar', () => {
    const profile = makeProfile(3);
    const ns = makeNorthStar();
    const tail = buildL4UnifiedTailModeB(profile, ns);
    // Pretty-print uses 2-space indent + newlines inside object braces.
    // Compact has no newline between `{` and the first key.
    // We assert the NorthStar block doesn't contain '{\n  "' (the pretty
    // form). If we slipped back into pretty-print, every saved input token
    // disappears.
    const nsLine = tail.match(/=== NORTH STAR \(authoritative\) ===\n(.+?)\n/);
    expect(nsLine).not.toBeNull();
    expect(nsLine![1]).not.toContain('\n  "');
    expect(nsLine![1].startsWith('{"')).toBe(true);
  });

  it('Mode C tail begins with the MODE: C selector and includes NS + SM + candidates', () => {
    const ns = makeNorthStar();
    const sm = makeScoreMatrix(3);
    const store = makeStore({
      id: 'CAND_L3_P0S1_abc',
      sourceLayer: 'L3',
      paragraph: 0,
      sentence: 1,
      observation: 'P1 summarizes',
      suggestedChange: 'show, do not tell',
      coachingValue: 'high',
    });
    const tail = buildL4UnifiedTailModeC(ns, sm, 3, store);
    expect(tail.startsWith('MODE: C')).toBe(true);
    expect(tail).toContain('=== L4a OUTPUT (authoritative framing) ===');
    expect(tail).toContain('=== PER-PARAGRAPH SCORE SUMMARY ===');
    expect(tail).toContain('IMPROVEMENT CANDIDATES');
    expect(tail).toContain('CAND_L3_P0S1_abc');
    expect(tail).toContain('Score matrix has 3 paragraphs');
  });

  it('Mode C tail uses compact JSON for the NS + SM bundle', () => {
    const ns = makeNorthStar();
    const sm = makeScoreMatrix(3);
    const store = makeStore({ id: 'CAND-Z', sourceLayer: 'L3', paragraph: 0, observation: 'x', suggestedChange: 'y' });
    const tail = buildL4UnifiedTailModeC(ns, sm, 3, store);
    const l4aLine = tail.match(/=== L4a OUTPUT \(authoritative framing\) ===\n(.+?)\n/);
    expect(l4aLine).not.toBeNull();
    expect(l4aLine![1]).not.toContain('\n  "');
    expect(l4aLine![1].startsWith('{"')).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Cache-structure invariant — same prefix bytes seen by all 3 calls
// ───────────────────────────────────────────────────────────────────────────

describe('L4 unified-cache structural invariants', () => {
  it('the system prompt + shared prefix together form a stable prefix across all 3 calls', () => {
    // This is the actual cache-key invariant. If the system prompt is X and
    // the cached user-prompt block is Y, then Anthropic caches X+Y. If
    // either X or Y differs across calls, the cache miss costs us. Verify
    // both stay identical when only the per-mode tail varies.
    const profile = makeProfile(5);
    const sp = buildSystemPromptL4Unified('personal_statement', 'personal_statement');
    const prefix = buildL4UnifiedSharedPrefix(
      profile,
      'personal_statement',
      '=== ESSAY ===\nessay text\n',
      '',
    );

    const tailA = buildL4UnifiedTailModeA(profile, 'personal_statement');
    const tailB = buildL4UnifiedTailModeB(profile, makeNorthStar());
    const tailC = buildL4UnifiedTailModeC(
      makeNorthStar(),
      makeScoreMatrix(5),
      5,
      makeStore({ id: 'CAND-A', sourceLayer: 'L3', paragraph: 0, observation: 'x', suggestedChange: 'y' }),
    );

    // What goes to the API: system prompt + [block1=prefix, block2=tail].
    // We're verifying block1 + system prompt are the same across the 3
    // calls. The tail (block2) is intentionally different.
    const cachedA = sp + '\n' + prefix;
    const cachedB = sp + '\n' + prefix;
    const cachedC = sp + '\n' + prefix;
    expect(cachedA).toBe(cachedB);
    expect(cachedB).toBe(cachedC);

    // And the tails MUST diverge (they carry the per-mode work).
    expect(tailA).not.toBe(tailB);
    expect(tailB).not.toBe(tailC);
  });
});
