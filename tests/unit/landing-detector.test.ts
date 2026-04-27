// ============================================================================
// LANDING DETECTOR — self-test (D-1.3)
// ============================================================================
// Per the D-1.3 contract: "Mock-LLM unit test for the orchestration; the
// prompt's quality is validated at D-1.5 (mid-build API touchpoint)."
//
// Covers:
//   1. Pure helpers — applyConfidenceFloor (Q4 enforcement) and the
//      schema validator __parseAndValidateForTesting. No mocks needed.
//   2. Orchestration — detectLanding() with vi.mock'd callClaude. Verify
//      the call invokes Haiku with JSON mode + temperature 0, returns
//      the parsed shape, applies the Q4 floor on weak `addressed`, and
//      surfaces every failure mode (input validation, JSON parse, schema
//      mismatch, upstream LLM error) without silent fallback.
//
// The prompt body itself (D-1.4 round-1 draft) is not validated here —
// that is the calibration check at D-1.5 ($0.50–$1.00 mid-build API
// touchpoint). This file's job is to lock the orchestration contract so
// any future prompt revision lands against airtight infrastructure.

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ClaudeResponse } from '../../src/lib/llm/claude';
import type { TaughtMove } from '../../src/services/essayIntelligence/profileTypes';

// vi.mock is hoisted; declare the mock factory before any imports of
// modules that pull callClaude transitively.
vi.mock('../../src/lib/llm/claude', () => ({
  callClaude: vi.fn(),
}));

import { callClaude } from '../../src/lib/llm/claude';
import {
  detectLanding,
  applyConfidenceFloor,
  __parseAndValidateForTesting,
  ADDRESSED_CONFIDENCE_FLOOR,
  LANDING_DETECTOR_MODEL,
  type LandingDetectorInput,
  type LandingDetectorOutput,
} from '../../src/services/essayIntelligence/analysis/landingDetector';

const mockCallClaude = callClaude as unknown as ReturnType<typeof vi.fn>;

// ─── Fixtures ──────────────────────────────────────────────────────────

function makeTaughtMove(overrides: Partial<TaughtMove> = {}): TaughtMove {
  return {
    id: 'M-1-2-A-3',
    annotationId: 'A-3',
    location: { paragraphIndex: 2, sentenceIndex: 1, spanText: 'a span' },
    taughtAtIteration: 1,
    teachingMode: 'awareness',
    contentSummary: 'Notice the shift from told emotion to embodied scene.',
    stakesSnapshot: 'AO loses confidence in interiority claims when scenes do not earn them.',
    ...overrides,
  };
}

function makeInput(overrides: Partial<LandingDetectorInput> = {}): LandingDetectorInput {
  return {
    priorTaughtMove: makeTaughtMove(),
    edit: {
      oldText: 'I felt sad about losing the match.',
      newText: 'My racket clattered. The umpire called the score; I did not hear it.',
      significance: 'significant',
    },
    ...overrides,
  };
}

function makeClaudeResponse(jsonContent: object | string): ClaudeResponse<string> {
  return {
    content: typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent),
    usage: {
      input_tokens: 250,
      output_tokens: 80,
    },
    stopReason: 'end_turn',
  };
}

const happyOutput: LandingDetectorOutput = {
  status: 'addressed',
  confidence: 0.9,
  reasoning: 'New text shows the umpire scene rather than telling sadness.',
  signalsUsed: ['edit_vs_critique'],
};

// ─── applyConfidenceFloor (Q4 enforcement) ─────────────────────────────

describe('D-1.3 — applyConfidenceFloor (Q4 asymmetric tolerance)', () => {
  it('downgrades addressed below 0.7 to partially_addressed', () => {
    const out = applyConfidenceFloor({
      status: 'addressed',
      confidence: 0.65,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('partially_addressed');
    // Confidence preserved unchanged — only classification shifts.
    expect(out.confidence).toBe(0.65);
  });

  it('does not downgrade addressed at exactly 0.7 (boundary)', () => {
    expect(ADDRESSED_CONFIDENCE_FLOOR).toBe(0.7);
    const out = applyConfidenceFloor({
      status: 'addressed',
      confidence: 0.7,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('addressed');
  });

  it('does not downgrade addressed at high confidence', () => {
    const out = applyConfidenceFloor({
      status: 'addressed',
      confidence: 0.95,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('addressed');
  });

  it('leaves partially_addressed alone regardless of confidence', () => {
    const out = applyConfidenceFloor({
      status: 'partially_addressed',
      confidence: 0.5,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('partially_addressed');
  });

  it('leaves unaddressed alone even at high confidence', () => {
    const out = applyConfidenceFloor({
      status: 'unaddressed',
      confidence: 0.99,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('unaddressed');
  });

  it('leaves changed_target alone at low confidence', () => {
    const out = applyConfidenceFloor({
      status: 'changed_target',
      confidence: 0.4,
      reasoning: 'r',
      signalsUsed: ['edit_vs_critique'],
    });
    expect(out.status).toBe('changed_target');
  });
});

// ─── parseAndValidate (schema airtightness) ─────────────────────────────

describe('D-1.3 — parseAndValidate (output schema enforcement)', () => {
  it('parses a valid full output', () => {
    const out = __parseAndValidateForTesting(JSON.stringify(happyOutput));
    expect(out).toEqual(happyOutput);
  });

  it('throws on non-JSON content', () => {
    expect(() => __parseAndValidateForTesting('not json {{')).toThrow(
      /failed to parse Haiku JSON output/,
    );
  });

  it('throws on JSON that is not an object', () => {
    expect(() => __parseAndValidateForTesting('[1,2,3]')).toThrow(/must be one of/);
    expect(() => __parseAndValidateForTesting('null')).toThrow(/parsed output is not an object/);
    expect(() => __parseAndValidateForTesting('"a string"')).toThrow(
      /parsed output is not an object/,
    );
  });

  it('throws on missing status', () => {
    const { status: _drop, ...rest } = happyOutput;
    void _drop;
    expect(() => __parseAndValidateForTesting(JSON.stringify(rest))).toThrow(
      /output\.status must be one of/,
    );
  });

  it('throws on invalid status enum', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, status: 'mostly_addressed' })),
    ).toThrow(/output\.status must be one of/);
  });

  it('throws on missing confidence', () => {
    const { confidence: _drop, ...rest } = happyOutput;
    void _drop;
    expect(() => __parseAndValidateForTesting(JSON.stringify(rest))).toThrow(
      /output\.confidence must be a finite number/,
    );
  });

  it('throws on non-numeric confidence', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, confidence: '0.9' })),
    ).toThrow(/output\.confidence must be a finite number/);
  });

  it('throws on confidence below 0', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, confidence: -0.1 })),
    ).toThrow(/output\.confidence must be in \[0, 1\]/);
  });

  it('throws on confidence above 1', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, confidence: 1.2 })),
    ).toThrow(/output\.confidence must be in \[0, 1\]/);
  });

  it('throws on missing reasoning', () => {
    const { reasoning: _drop, ...rest } = happyOutput;
    void _drop;
    expect(() => __parseAndValidateForTesting(JSON.stringify(rest))).toThrow(
      /output\.reasoning must be a non-empty string/,
    );
  });

  it('throws on empty reasoning', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, reasoning: '' })),
    ).toThrow(/output\.reasoning must be a non-empty string/);
  });

  it('throws on missing signalsUsed', () => {
    const { signalsUsed: _drop, ...rest } = happyOutput;
    void _drop;
    expect(() => __parseAndValidateForTesting(JSON.stringify(rest))).toThrow(
      /output\.signalsUsed must be an array/,
    );
  });

  it('throws on non-array signalsUsed', () => {
    expect(() =>
      __parseAndValidateForTesting(
        JSON.stringify({ ...happyOutput, signalsUsed: 'edit_vs_critique' }),
      ),
    ).toThrow(/output\.signalsUsed must be an array/);
  });

  it('throws on signalsUsed containing an unknown enum value', () => {
    expect(() =>
      __parseAndValidateForTesting(
        JSON.stringify({ ...happyOutput, signalsUsed: ['edit_vs_critique', 'gut_feeling'] }),
      ),
    ).toThrow(/output\.signalsUsed\[\*\] must be one of/);
  });

  it('throws on empty signalsUsed array', () => {
    expect(() =>
      __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, signalsUsed: [] })),
    ).toThrow(/output\.signalsUsed must be non-empty/);
  });

  it('accepts all four valid status enum values', () => {
    for (const status of ['addressed', 'partially_addressed', 'unaddressed', 'changed_target'] as const) {
      const out = __parseAndValidateForTesting(JSON.stringify({ ...happyOutput, status }));
      expect(out.status).toBe(status);
    }
  });

  it('accepts all three valid signal enum values together', () => {
    const out = __parseAndValidateForTesting(
      JSON.stringify({
        ...happyOutput,
        signalsUsed: ['edit_vs_critique', 'redetection', 'chat_behavior'],
      }),
    );
    expect(out.signalsUsed).toEqual(['edit_vs_critique', 'redetection', 'chat_behavior']);
  });
});

// ─── detectLanding orchestration (callClaude mocked) ───────────────────

describe('D-1.3 — detectLanding orchestration', () => {
  beforeEach(() => {
    mockCallClaude.mockReset();
  });

  it('calls Haiku with JSON mode + temperature 0 and returns parsed output', async () => {
    mockCallClaude.mockResolvedValueOnce(makeClaudeResponse(happyOutput));

    const result = await detectLanding(makeInput());

    expect(result).toEqual(happyOutput);
    expect(mockCallClaude).toHaveBeenCalledTimes(1);
    const callArg = mockCallClaude.mock.calls[0][0];
    expect(callArg.model).toBe(LANDING_DETECTOR_MODEL);
    expect(callArg.useJsonMode).toBe(true);
    expect(callArg.temperature).toBe(0.0);
    expect(typeof callArg.systemPrompt).toBe('string');
    expect(callArg.systemPrompt.length).toBeGreaterThan(100);
    expect(typeof callArg.userPrompt).toBe('string');
    // User prompt should reference the move location.
    expect(callArg.userPrompt).toMatch(/PRIOR TAUGHT MOVE/);
    expect(callArg.userPrompt).toMatch(/SIGNAL A/);
  });

  it('applies Q4 floor — weak addressed downgraded to partially_addressed', async () => {
    mockCallClaude.mockResolvedValueOnce(
      makeClaudeResponse({
        status: 'addressed',
        confidence: 0.55,
        reasoning: 'edit moved toward the move but did not fully execute',
        signalsUsed: ['edit_vs_critique'],
      }),
    );
    const result = await detectLanding(makeInput());
    expect(result.status).toBe('partially_addressed');
    expect(result.confidence).toBe(0.55);
  });

  it('passes Signal B (re-detection) into the user prompt when present', async () => {
    mockCallClaude.mockResolvedValueOnce(makeClaudeResponse(happyOutput));
    await detectLanding({
      ...makeInput(),
      newAnalysisAtLocation: { symptomFlagged: true, reasoning: 'still telling, not showing' },
    });
    const userPrompt = mockCallClaude.mock.calls[0][0].userPrompt;
    expect(userPrompt).toMatch(/SIGNAL B/);
    expect(userPrompt).toMatch(/Symptom still flagged at this location: YES/);
    expect(userPrompt).toMatch(/still telling, not showing/);
  });

  it('passes Signal C (chat behavior) into the user prompt when present', async () => {
    mockCallClaude.mockResolvedValueOnce(makeClaudeResponse(happyOutput));
    await detectLanding({
      ...makeInput(),
      chatBehavior: { engaged: true, mood: 'curious', raw: 'how do I show this?' },
    });
    const userPrompt = mockCallClaude.mock.calls[0][0].userPrompt;
    expect(userPrompt).toMatch(/SIGNAL C/);
    expect(userPrompt).toMatch(/Engaged with this move in chat: YES/);
    expect(userPrompt).toMatch(/curious/);
  });

  it('renders "(not available)" placeholders for absent B and C signals', async () => {
    mockCallClaude.mockResolvedValueOnce(makeClaudeResponse(happyOutput));
    await detectLanding(makeInput());
    const userPrompt = mockCallClaude.mock.calls[0][0].userPrompt;
    expect(userPrompt).toMatch(/SIGNAL B[\s\S]*not available/);
    expect(userPrompt).toMatch(/SIGNAL C[\s\S]*not available/);
  });

  it('rejects missing priorTaughtMove (input validation)', async () => {
    await expect(
      detectLanding({
        priorTaughtMove: undefined as unknown as TaughtMove,
        edit: { oldText: '', newText: '', significance: 'minor' },
      }),
    ).rejects.toThrow(/input\.priorTaughtMove is missing/);
    expect(mockCallClaude).not.toHaveBeenCalled();
  });

  it('rejects empty taughtMove id', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        priorTaughtMove: makeTaughtMove({ id: '' }),
      }),
    ).rejects.toThrow(/input\.priorTaughtMove\.id is missing or empty/);
  });

  it('rejects taughtAtIteration that is not a number', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        priorTaughtMove: { ...makeTaughtMove(), taughtAtIteration: '1' as unknown as number },
      }),
    ).rejects.toThrow(/taughtAtIteration must be a number/);
  });

  it('rejects edit.significance not in enum', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        edit: { oldText: 'x', newText: 'y', significance: 'massive' as 'minor' },
      }),
    ).rejects.toThrow(/edit\.significance must be one of/);
  });

  it('rejects chatBehavior.mood not in enum', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        chatBehavior: { engaged: true, mood: 'angry' as 'curious' },
      }),
    ).rejects.toThrow(/chatBehavior\.mood must be one of/);
  });

  it('rejects chatBehavior.engaged that is not boolean', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        chatBehavior: { engaged: 'yes' as unknown as boolean, mood: 'curious' },
      }),
    ).rejects.toThrow(/chatBehavior\.engaged must be a boolean/);
  });

  it('rejects newAnalysisAtLocation.symptomFlagged that is not boolean', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        newAnalysisAtLocation: { symptomFlagged: 1 as unknown as boolean },
      }),
    ).rejects.toThrow(/symptomFlagged must be a boolean/);
  });

  it('re-throws JSON parse failures with context (no silent fallback)', async () => {
    mockCallClaude.mockResolvedValueOnce(makeClaudeResponse('I cannot answer that question'));
    await expect(detectLanding(makeInput())).rejects.toThrow(/failed to parse Haiku JSON output/);
  });

  it('re-throws schema validation failures (no silent fallback)', async () => {
    mockCallClaude.mockResolvedValueOnce(
      makeClaudeResponse({
        status: 'addressed',
        confidence: 1.5, // out of range
        reasoning: 'r',
        signalsUsed: ['edit_vs_critique'],
      }),
    );
    await expect(detectLanding(makeInput())).rejects.toThrow(/confidence must be in \[0, 1\]/);
  });

  it('re-throws upstream LLM call errors (no silent fallback)', async () => {
    mockCallClaude.mockRejectedValueOnce(new Error('rate limit exceeded'));
    await expect(detectLanding(makeInput())).rejects.toThrow(/rate limit exceeded/);
  });

  it('does not call Haiku when input validation fails (saves a Haiku call)', async () => {
    await expect(
      detectLanding({
        ...makeInput(),
        edit: { oldText: 'x', newText: 'y', significance: 'massive' as 'minor' },
      }),
    ).rejects.toThrow();
    expect(mockCallClaude).not.toHaveBeenCalled();
  });
});
