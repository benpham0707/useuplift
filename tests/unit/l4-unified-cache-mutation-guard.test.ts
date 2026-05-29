// ============================================================================
// L4 UNIFIED-CACHE — prefix-mutation guard (integration-style, mocked LLM)
// ============================================================================
// The pure-prompt tests in l4-unified-cache.test.ts prove the *builders* are
// deterministic when called with identical inputs. They do NOT prove the
// *live call path* feeds identical inputs to all three calls.
//
// The cache-key invariant that actually saves money is:
//
//   systemPrompt + userPromptBlocks[0].text  must be byte-identical
//   across Mode A, Mode B, and Mode C within one crystallize() run.
//
// If any future change mutates `profile`, `profileContext`, or `corpusPrepend`
// between the three calls (e.g. buildNorthStar starts writing back to the
// profile, or detectScoreClustering mutates a shared field), the prefix
// diverges, the Anthropic prefix cache silently misses, and the C7 saving
// evaporates with zero test failure — all 30 pure-prompt tests still pass.
//
// This test runs the real crystallize() with L4_UNIFIED_CACHE=true, mocks the
// LLM, captures the args of all three calls, and asserts the cached prefix is
// stable. It is the regression tripwire for that silent-failure class.
//
// Design: docs/pipeline-evolution/04-pipeline-architecture/L4/L4_CACHE_UNIFICATION_DESIGN.md

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the LLM module crystallizer.ts imports. Keep everything else (calculateCost)
// real — only callClaudeWithRetry is replaced.
vi.mock('../../src/lib/llm/claude', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/llm/claude')>();
  return { ...actual, callClaudeWithRetry: vi.fn() };
});

import { callClaudeWithRetry } from '../../src/lib/llm/claude';
import { CrystallizerService } from '../../src/services/essayIntelligence/analysis/crystallizer';
import { ImprovementCandidateStore } from '../../src/services/essayIntelligence/improvements/improvementCandidateStore';
import type {
  EssayProfile,
  ImprovementCandidate,
  ParagraphProfile,
} from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Fixtures — minimal-but-valid profile that survives validatePrerequisites
// ───────────────────────────────────────────────────────────────────────────

function makeParagraph(index: number): ParagraphProfile {
  return {
    index,
    text: `Paragraph ${index} text.`,
    sentences: [],
    // Non-null understanding on every paragraph so validatePrerequisites passes.
    understanding: { summary: `understanding P${index + 1}` } as any,
    analysis: {
      effectiveness: 70,
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
    voiceIdentity: { signature: 'a steady, self-aware first person' } as any,
    index: {} as any,
    findings: [],
  } as unknown as EssayProfile;
}

function makeStore(): ImprovementCandidateStore {
  const store = new ImprovementCandidateStore();
  store.add({
    id: 'CAND_L3_P0S1_guard',
    sourceLayer: 'L3',
    paragraph: 0,
    sentence: 1,
    observation: 'obs',
    suggestedChange: 'change',
    technique: null,
    coachingValue: 'high',
    lifecycleState: 'candidate',
  } as unknown as ImprovementCandidate);
  return store;
}

// Per-mode mock content — minimal shapes the post-call builders tolerate.
function mockContentForMode(mode: 'A' | 'B' | 'C'): unknown {
  if (mode === 'A') {
    return {
      northStar: {
        structuralRolesMap: [
          { paragraphs: [0, 1, 2, 3, 4], role: 'spine', significance: 'holds the arc', weight: 'load_bearing' },
        ],
        distinctivenessSignature: {
          articulation: 'specific to this essay',
          entanglementRefs: ['ENT-1'],
          nonInterchangeableFactors: ['x'],
        },
      },
    };
  }
  if (mode === 'B') {
    return { scoreMatrix: { paragraphs: [], crossParagraphPatterns: [] } };
  }
  return {
    prioritizedImprovements: [],
    coachingMap: undefined,
    coherenceReport: { contradictions: [], isCoherent: true },
  };
}

const MOCK_USAGE = {
  input_tokens: 1000,
  output_tokens: 200,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
};

// ───────────────────────────────────────────────────────────────────────────

describe('L4 unified-cache — prefix-mutation guard (live call path)', () => {
  let prevFlag: string | undefined;
  let prevCorpus: string | undefined;

  beforeEach(() => {
    prevFlag = process.env.L4_UNIFIED_CACHE;
    prevCorpus = process.env.L4_CORPUS_RETRIEVAL;
    process.env.L4_UNIFIED_CACHE = 'true';
    // Keep corpus retrieval off so the run makes exactly the 3 L4 calls.
    delete process.env.L4_CORPUS_RETRIEVAL;
    vi.mocked(callClaudeWithRetry).mockReset();
  });

  afterEach(() => {
    if (prevFlag === undefined) delete process.env.L4_UNIFIED_CACHE;
    else process.env.L4_UNIFIED_CACHE = prevFlag;
    if (prevCorpus === undefined) delete process.env.L4_CORPUS_RETRIEVAL;
    else process.env.L4_CORPUS_RETRIEVAL = prevCorpus;
  });

  it('feeds a byte-identical cached prefix to all three L4 calls', async () => {
    const profile = makeProfile(5);
    const service = new CrystallizerService();

    // Stub the ProfileRouter so the test does not depend on routing internals.
    vi.spyOn((service as any).router, 'assembleContext').mockReturnValue({
      sections: [],
      estimatedTokens: 0,
      appliedRule: 'l4_crystallization',
      droppedSections: [],
    });

    // Capture every call; return per-mode content keyed off the tail's MODE line.
    const captured: Array<{ systemPrompt: string; blocks: any[] }> = [];
    vi.mocked(callClaudeWithRetry).mockImplementation(async (input: any) => {
      captured.push({ systemPrompt: input.systemPrompt, blocks: input.userPromptBlocks });
      const tail: string = input.userPromptBlocks?.[1]?.text ?? '';
      const mode: 'A' | 'B' | 'C' = tail.startsWith('MODE: A')
        ? 'A'
        : tail.startsWith('MODE: B')
          ? 'B'
          : 'C';
      return {
        content: mockContentForMode(mode),
        usage: { ...MOCK_USAGE },
        stopReason: 'end_turn',
      } as any;
    });

    await service.crystallize(profile, 'common_app', 'The full essay text.', makeStore());

    // Exactly the 3 L4 calls fired (Mode A, B, C) — corpus retrieval was off.
    expect(captured).toHaveLength(3);

    // ── The invariant: cached prefix byte-identical across all 3 calls ──
    const [a, b, c] = captured;

    // System prompt is the first cache segment (cacheSystemPrompt: true).
    expect(a.systemPrompt).toBe(b.systemPrompt);
    expect(b.systemPrompt).toBe(c.systemPrompt);

    // userPromptBlocks[0] is the shared prefix carrying the cache breakpoint.
    expect(a.blocks[0].text).toBe(b.blocks[0].text);
    expect(b.blocks[0].text).toBe(c.blocks[0].text);

    // The breakpoint must actually be set on the shared block of every call —
    // without it, Anthropic never writes the prefix to cache.
    expect(a.blocks[0].cacheBreakpoint).toBe(true);
    expect(b.blocks[0].cacheBreakpoint).toBe(true);
    expect(c.blocks[0].cacheBreakpoint).toBe(true);
  });

  it('keeps the per-mode tail OUT of the cached segment (varies per call, no breakpoint)', async () => {
    const profile = makeProfile(5);
    const service = new CrystallizerService();
    vi.spyOn((service as any).router, 'assembleContext').mockReturnValue({
      sections: [],
      estimatedTokens: 0,
      appliedRule: 'l4_crystallization',
      droppedSections: [],
    });

    const captured: Array<{ blocks: any[] }> = [];
    vi.mocked(callClaudeWithRetry).mockImplementation(async (input: any) => {
      captured.push({ blocks: input.userPromptBlocks });
      const tail: string = input.userPromptBlocks?.[1]?.text ?? '';
      const mode: 'A' | 'B' | 'C' = tail.startsWith('MODE: A')
        ? 'A'
        : tail.startsWith('MODE: B')
          ? 'B'
          : 'C';
      return {
        content: mockContentForMode(mode),
        usage: { ...MOCK_USAGE },
        stopReason: 'end_turn',
      } as any;
    });

    await service.crystallize(profile, 'common_app', 'The full essay text.', makeStore());

    const tails = captured.map((x) => x.blocks[1]);

    // Each tail starts with its own mode selector — proof the modes are distinct.
    expect(tails[0].text.startsWith('MODE: A')).toBe(true);
    expect(tails[1].text.startsWith('MODE: B')).toBe(true);
    expect(tails[2].text.startsWith('MODE: C')).toBe(true);

    // The tails genuinely differ — if they were identical, the test above would
    // be vacuously satisfiable by a degenerate single-block prompt.
    expect(tails[0].text).not.toBe(tails[1].text);
    expect(tails[1].text).not.toBe(tails[2].text);

    // The tail must NOT carry a cache breakpoint — caching per-call content
    // would write a cache entry that can never be re-read.
    expect(tails[0].cacheBreakpoint).toBeFalsy();
    expect(tails[1].cacheBreakpoint).toBeFalsy();
    expect(tails[2].cacheBreakpoint).toBeFalsy();
  });
});
