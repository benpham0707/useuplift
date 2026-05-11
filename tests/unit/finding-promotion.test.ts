// ============================================================================
// PHASE 0a.3 — findingPromotion wire-up unit tests
// ============================================================================
//
// Verifies that promoteAnalysisFindings(store, paragraphAnalyses) correctly
// populates the FindingStore from L3.5 AnalysisPassOutput shapes, including:
//   - Sentence-level weakness/strength promotion with evidence guard
//   - Paragraph verdict promotion
//   - Cross-paragraph strength signature aggregation
//   - Coaching-value mapping from effectiveness + priority + isProblem
//
// Without this wire, FindingStore is sparse entering L4 → downstream layers
// re-narrate findings instead of citing F-N references. The wire is gated
// on iteration === 1 in analysisOrchestrator.ts to prevent duplicate IDs on
// re-analysis paths (option `i` per Phase 0a.3 design ask).
// ============================================================================

import { describe, it, expect } from 'vitest';
import { promoteAnalysisFindings } from '../../src/services/essayIntelligence/analysis/findingPromotion';
import { FindingStore } from '../../src/services/essayIntelligence/findings/findingStore';
import type { AnalysisPassOutput } from '../../src/services/essayIntelligence/profileTypes';

function buildAnalysis(overrides: Partial<AnalysisPassOutput> = {}): AnalysisPassOutput {
  return {
    paragraphIndex: 0,
    sentenceAnalyses: [],
    paragraphEffectiveness: 50,
    paragraphVerdict: '',
    holisticAnalysisEvolution: {},
    ...overrides,
  };
}

describe('promoteAnalysisFindings — sentence weaknesses', () => {
  it('promotes a sentence weakness when evidence is non-empty', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({
      paragraphIndex: 2,
      sentenceAnalyses: [
        {
          sentenceIndex: 1,
          effectiveness: 35,
          effectivenessReasoning: 'reads telly',
          strengths: [],
          weaknesses: [
            { observation: 'tells reader the feeling instead of showing it', evidence: 'I was scared.', confidence: 0.9 },
          ],
          isStrength: false,
          isProblem: true,
          priorityForImprovement: 4,
        },
      ],
      paragraphVerdict: 'The paragraph leans on telling.',
    });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.errors).toEqual([]);
    expect(result.byKind.sentenceWeakness).toBe(1);
    expect(result.byKind.paragraphVerdict).toBe(1);
    expect(result.promoted).toBeGreaterThanOrEqual(2);

    const findings = store.getActive();
    const weaknessFinding = findings.find((f) => f.scope.type === 'sentence');
    expect(weaknessFinding).toBeDefined();
    expect(weaknessFinding?.source).toBe('analysis_pass');
    // priority>=4 AND isProblem=true → 'critical'
    expect(weaknessFinding?.coachingValue).toBe('critical');
    expect(weaknessFinding?.scope.paragraph).toBe(2);
    if (weaknessFinding?.scope.type === 'sentence') {
      expect(weaknessFinding.scope.sentences).toEqual([1]);
    }
  });

  it('skips weaknesses with empty evidence (no fabrication)', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({
      sentenceAnalyses: [
        {
          sentenceIndex: 0,
          effectiveness: 30,
          effectivenessReasoning: '',
          strengths: [],
          weaknesses: [
            { observation: 'something is off', evidence: '', confidence: 0.5 },
          ],
          isStrength: false,
          isProblem: true,
          priorityForImprovement: 3,
        },
      ],
    });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.byKind.sentenceWeakness).toBe(0);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    expect(store.getActive().filter((f) => f.scope.type === 'sentence')).toHaveLength(0);
  });
});

describe('promoteAnalysisFindings — paragraph verdicts', () => {
  it('promotes a paragraph verdict and assigns coaching value from effectiveness', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({
      paragraphIndex: 0,
      paragraphEffectiveness: 35,
      paragraphVerdict: 'Opening misses the emotional anchor.',
    });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.byKind.paragraphVerdict).toBe(1);
    const verdictFinding = store.getActive().find((f) => f.scope.type === 'paragraph');
    expect(verdictFinding).toBeDefined();
    expect(verdictFinding?.source).toBe('analysis_pass');
    expect(verdictFinding?.coachingValue).toBe('critical'); // effectiveness < 40
    expect(verdictFinding?.claim).toContain('Opening misses');
  });

  it('does not promote a verdict when paragraphVerdict is empty', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({ paragraphVerdict: '   ' });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.byKind.paragraphVerdict).toBe(0);
    expect(store.getActive().filter((f) => f.scope.type === 'paragraph')).toHaveLength(0);
  });
});

describe('promoteAnalysisFindings — cross-paragraph strength signatures', () => {
  it('aggregates the same strength signature observed across multiple paragraphs into one finding', () => {
    const store = new FindingStore();
    const sig = {
      quality: 'misdirection opening',
      evidence: 'opens with the taxidermy fake-out',
      paragraphs: [0],
    };
    const analyses = [
      buildAnalysis({
        paragraphIndex: 0,
        holisticAnalysisEvolution: { strengthSignatures: [sig] },
      }),
      buildAnalysis({
        paragraphIndex: 4,
        holisticAnalysisEvolution: {
          strengthSignatures: [{ ...sig, paragraphs: [4] }],
        },
      }),
    ];

    const result = promoteAnalysisFindings(store, analyses);

    expect(result.byKind.strengthSignature).toBe(1);
    const sigFinding = store
      .getActive()
      .find((f) => f.claim.toLowerCase().includes('misdirection'));
    expect(sigFinding).toBeDefined();
    expect(sigFinding?.scope.type === 'cross_paragraph' || sigFinding?.scope.type === 'paragraph').toBe(true);
    expect(sigFinding?.source).toBe('analysis_pass');
  });

  it('skips strength signatures that have no evidence text', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({
      holisticAnalysisEvolution: {
        strengthSignatures: [{ quality: 'unnamed', evidence: '', paragraphs: [0] }],
      },
    });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.byKind.strengthSignature).toBe(0);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
  });
});

describe('promoteAnalysisFindings — coaching-value mapping', () => {
  it('maps effectiveness=85 with isStrength=true to high', () => {
    const store = new FindingStore();
    const analysis = buildAnalysis({
      sentenceAnalyses: [
        {
          sentenceIndex: 0,
          effectiveness: 88,
          effectivenessReasoning: '',
          strengths: [
            { observation: 'precise sensory detail', evidence: 'the brittle paper crackled', confidence: 0.95 },
          ],
          weaknesses: [],
          isStrength: true,
          isProblem: false,
          priorityForImprovement: 1,
        },
      ],
    });

    const result = promoteAnalysisFindings(store, [analysis]);

    expect(result.byKind.sentenceStrength).toBe(1);
    const strengthFinding = store.getActive().find((f) => f.scope.type === 'sentence');
    expect(strengthFinding?.coachingValue).toBe('high');
  });
});
