// ============================================================================
// L4 COMPOSITE — prompt + parsing unit tests
// ============================================================================
// Validates the Phase 3 composite call without any LLM spend:
//   1. buildSystemPromptL4Composite contains every load-bearing marker from
//      the three focused prompts it replaces.
//   2. buildCallInstructionL4Composite renders the runtime context (entanglement
//      IDs, connection IDs, L3.5 effectiveness scores, candidate context).
//   3. The composite branch's parsing pipeline produces equivalent shapes via
//      the existing builders (no schema drift).
//   4. The fail-fast / truncation-tolerant paths behave as documented.
//
// Design: docs/pipeline-evolution/04-pipeline-architecture/L4/COMPOSITE_CALL_DESIGN.md

import { describe, it, expect } from 'vitest';

import {
  buildCallInstructionL4Composite,
  buildCoachingMap,
  buildSystemPromptL4Composite,
} from '../../src/services/essayIntelligence/analysis/crystallizer';
import { ImprovementCandidateStore } from '../../src/services/essayIntelligence/improvements/improvementCandidateStore';
import type {
  EssayProfile,
  ImprovementCandidate,
  NorthStarScale,
  ParagraphProfile,
} from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function makeMinimalParagraphProfile(index: number, effectiveness = 70): ParagraphProfile {
  return {
    index,
    text: `Paragraph ${index} text.`,
    sentences: [],
    understanding: null,
    analysis: {
      effectiveness,
      paragraphVerdict: `verdict for P${index + 1}`,
      verdict: `verdict for P${index + 1}`,
      dimensionScores: {},
      observations: [],
      weakSpots: [],
      growthEdges: [],
      strengths: [],
    } as any,
    walkSkipped: false,
  } as unknown as ParagraphProfile;
}

function makeMinimalProfile(paragraphCount: number): EssayProfile {
  return {
    paragraphs: Array.from({ length: paragraphCount }, (_, i) => makeMinimalParagraphProfile(i)),
    connections: {
      all: [
        { id: 'CONN-1' } as any,
        { id: 'CONN-2' } as any,
      ],
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

function makeCandidateStore(...candidates: Array<Partial<ImprovementCandidate>>): ImprovementCandidateStore {
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

// ───────────────────────────────────────────────────────────────────────────
// 1. System prompt — load-bearing markers preserved
// ───────────────────────────────────────────────────────────────────────────

describe('L4 composite system prompt — load-bearing content', () => {
  const scales: NorthStarScale[] = ['personal_statement', 'piq', 'supplement'];

  for (const scale of scales) {
    it(`(${scale}) declares the three sections + ordering protocol`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      expect(sp).toContain('SECTION 1 — ESSAY NORTH STAR');
      expect(sp).toContain('SECTION 2 — PARAGRAPH SCORE MATRIX');
      expect(sp).toContain('SECTION 3 — CONSOLIDATION');
      expect(sp).toContain('OUTPUT ORDERING PROTOCOL');
      // Anti-shortcut clause
      expect(sp).toContain('NOT permission to short any section');
    });

    it(`(${scale}) preserves the W3.3 anti-clustering protocol verbatim`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      expect(sp).toContain('ANTI-CLUSTERING PROTOCOL (W3.3 — mandatory)');
      expect(sp).toContain('FORCED RANKING');
      expect(sp).toContain('WITHIN-PARAGRAPH RANGE');
      expect(sp).toContain('CROSS-PARAGRAPH RANGE');
      expect(sp).toContain('FULL-RANGE ANCHORS');
      expect(sp).toContain('70-85 range');
    });

    it(`(${scale}) preserves the consolidate-don't-invent rule and consolidatedFrom requirement`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      expect(sp).toContain('CONSOLIDATE, DO NOT INVENT');
      expect(sp).toContain('consolidatedFrom');
      expect(sp).toContain('3-7 priorities');
    });

    it(`(${scale}) preserves the coherence investigation protocol`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      expect(sp).toContain('INVESTIGATION PROTOCOL');
      expect(sp).toContain('productive_tension');
      expect(sp).toContain('system_disagreement');
      expect(sp).toContain('essay_flaw');
      expect(sp).toContain('depth_signal');
      expect(sp).toContain('routingCategory');
    });

    it(`(${scale}) preserves the display convention rule (0-index data / 1-index prose)`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      expect(sp).toContain('DISPLAY CONVENTION');
      expect(sp).toContain('NEVER write "P0"');
      expect(sp).toContain('0-based');
      expect(sp).toContain('1-indexed');
    });

    it(`(${scale}) ends with a JSON output skeleton matching the parsed shape`, () => {
      const sp = buildSystemPromptL4Composite(scale);
      // Top-level fields the composite parser expects
      expect(sp).toContain('"northStar"');
      expect(sp).toContain('"scoreMatrix"');
      expect(sp).toContain('"coherenceReport"');
      expect(sp).toContain('"coachingMap"');
      expect(sp).toContain('"structuralRolesMap"');
      expect(sp).toContain('"prioritizedImprovements"');
    });
  }

  it('emits throughLineMap + intentBridge sections for personal statement only', () => {
    const ps = buildSystemPromptL4Composite('personal_statement');
    const piq = buildSystemPromptL4Composite('piq');
    const supp = buildSystemPromptL4Composite('supplement');
    expect(ps).toContain('THROUGH-LINE MAP');
    expect(ps).toContain('INTENT BRIDGE');
    expect(piq).toContain('THROUGH-LINE MAP'); // PIQ also has throughLineMap
    expect(piq).not.toContain('INTENT BRIDGE');
    expect(supp).not.toContain('THROUGH-LINE MAP');
    expect(supp).not.toContain('INTENT BRIDGE');
  });

  it('emits trajectory section for PS + PIQ only', () => {
    const ps = buildSystemPromptL4Composite('personal_statement');
    const piq = buildSystemPromptL4Composite('piq');
    const supp = buildSystemPromptL4Composite('supplement');
    expect(ps).toContain('TRAJECTORY');
    expect(piq).toContain('TRAJECTORY');
    expect(supp).not.toContain('TRAJECTORY');
  });

  it('injects the essay-type calibration block for supplement / piq', () => {
    const supp = buildSystemPromptL4Composite('supplement', 'supplement');
    const piq = buildSystemPromptL4Composite('piq', 'piq');
    const ps = buildSystemPromptL4Composite('personal_statement', 'personal_statement');
    expect(supp).toContain('ESSAY-TYPE CALIBRATION (supplement');
    expect(piq).toContain('ESSAY-TYPE CALIBRATION (PIQ');
    expect(ps).not.toContain('ESSAY-TYPE CALIBRATION');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Call instruction — runtime context renders correctly
// ───────────────────────────────────────────────────────────────────────────

describe('L4 composite call instruction — runtime context', () => {
  it('includes entanglement IDs, connection IDs, effectiveness scores, candidates', () => {
    const profile = makeMinimalProfile(3);
    const store = makeCandidateStore(
      {
        id: 'CAND_L3_P0S1_abc123',
        sourceLayer: 'L3',
        paragraph: 0,
        sentence: 1,
        observation: 'P1 summarizes instead of showing',
        suggestedChange: 'land in scene',
        coachingValue: 'high',
      },
      {
        id: 'CAND_L3_5_P1S2_def456',
        sourceLayer: 'L3.5',
        paragraph: 1,
        sentence: 2,
        observation: 'P2 pivot stays abstract',
        suggestedChange: 'show the moment of pivot',
        coachingValue: 'critical',
      },
    );

    const instruction = buildCallInstructionL4Composite(profile, 'personal_statement', store);

    expect(instruction).toContain('Paragraph count: 3');
    expect(instruction).toContain('Active North Star dimensions');
    expect(instruction).toContain('"ENT-1"');
    expect(instruction).toContain('voice+structure');
    expect(instruction).toContain('CONN-1, CONN-2');
    expect(instruction).toContain('L3.5 EFFECTIVENESS SCORES');
    expect(instruction).toContain('P1: effectiveness=70');
    expect(instruction).toContain('IMPROVEMENT CANDIDATES');
    expect(instruction).toContain('CAND_L3_P0S1_abc123');
    expect(instruction).toContain('CAND_L3_5_P1S2_def456');
  });

  it('does NOT re-serialize a North Star or Score Matrix (composite produces them itself)', () => {
    const profile = makeMinimalProfile(2);
    const store = makeCandidateStore({
      id: 'CAND-A',
      sourceLayer: 'L3',
      paragraph: 0,
      observation: 'x',
      suggestedChange: 'y',
    });
    const instruction = buildCallInstructionL4Composite(profile, 'piq', store);
    // 3-call instructions re-paid for these as serialized JSON; composite must not.
    expect(instruction).not.toContain('NORTH STAR (AUTHORITATIVE');
    expect(instruction).not.toContain('L4a CRYSTALLIZATION OUTPUT');
    expect(instruction).not.toContain('PER-PARAGRAPH SCORE SUMMARY');
  });

  it('appends the re-crystallization evolution block when priorNorthStar is supplied', () => {
    const profile = makeMinimalProfile(2);
    const store = makeCandidateStore({
      id: 'CAND-A',
      sourceLayer: 'L3',
      paragraph: 0,
      observation: 'x',
      suggestedChange: 'y',
    });
    const priorNS = {
      activeScale: 'personal_statement',
      structuralRolesMap: [],
      distinctivenessSignature: { articulation: '', entanglementRefs: [], nonInterchangeableFactors: [] },
      confidence: 'hypothesis',
      lastUpdatedBy: 'L4',
      evolution: { version: 2 },
    } as any;
    const instruction = buildCallInstructionL4Composite(profile, 'personal_statement', store, priorNS);
    expect(instruction).toContain('RE-CRYSTALLIZATION CONTEXT');
    expect(instruction).toContain('"version": 3');
    expect(instruction).toContain('coreIdentityStable');
  });

  it('omits the re-crystallization block on a first-time analysis', () => {
    const profile = makeMinimalProfile(2);
    const store = makeCandidateStore({
      id: 'CAND-A',
      sourceLayer: 'L3',
      paragraph: 0,
      observation: 'x',
      suggestedChange: 'y',
    });
    const instruction = buildCallInstructionL4Composite(profile, 'personal_statement', store);
    expect(instruction).not.toContain('RE-CRYSTALLIZATION CONTEXT');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Parsing — composite raw → typed result (via existing builders)
// ───────────────────────────────────────────────────────────────────────────

describe('L4 composite parsing — builders applied to composite raw output', () => {
  it('builds a CoachingMap from a well-formed composite coachingMap field', () => {
    const raw = {
      transformativeInsight: {
        insight: 'The pawnshop frame is the load-bearing structural choice — without it, the refusal-to-sell carries no weight.',
        evidenceLocations: [{ paragraph: 0, sentence: 1 }],
        whyThisTransforms: 'Reframes the essay from "I value family" to "I refuse a market".',
        requiresStudentAwareness: true,
      },
      priorities: [
        {
          priority: 'P1 must enact the appraiser logic before the emotional pivot',
          target: { paragraphs: [0], description: 'P1 opening' },
          architecturalReason: 'P1 frames the economic lens that makes P3 legible.',
          unlocksNext: 'P3 can land its refusal as principled, not sentimental',
          expectedImpact: 'transformative',
          consolidatedFrom: ['CAND_L3_P0S1_abc123', 'CAND_L3_5_P0S2_def456'],
        },
      ],
      protectedStrengths: [
        { description: 'The grandmother\'s gesture in P3 is shown, not told', locations: [{ paragraph: 2 }], whyProtect: 'It earns the refusal.' },
      ],
      emergentPatterns: ['Pattern: economic vocabulary recedes into emotional vocabulary across P1→P3'],
      scoreTensions: ['P2: structural(85) >> effectiveness(55) — pivot telegraphed, not enacted'],
    };
    const coachingMap = buildCoachingMap(raw, 5);
    expect(coachingMap).toBeDefined();
    expect(coachingMap!.priorities).toHaveLength(1);
    expect(coachingMap!.priorities[0].consolidatedFrom).toEqual([
      'CAND_L3_P0S1_abc123',
      'CAND_L3_5_P0S2_def456',
    ]);
    expect(coachingMap!.transformativeInsight.requiresStudentAwareness).toBe(true);
    expect(coachingMap!.emergentPatterns).toHaveLength(1);
    expect(coachingMap!.scoreTensions).toHaveLength(1);
    expect(coachingMap!.protectedStrengths).toHaveLength(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Composite branch parse logic — error / truncation paths
// ───────────────────────────────────────────────────────────────────────────
// These exercise the same defensive checks the composite branch performs
// inside `crystallize()`. We replicate the parse code in a tiny helper so
// the test reads cleanly without spinning up the orchestrator.

function parseComposite(raw: any): { ok: boolean; reason?: string; coherenceDefault?: boolean } {
  // Same shape checks as the composite branch in crystallize()
  if (!raw.northStar) return { ok: false, reason: 'missing-northStar' };
  if (!raw.scoreMatrix?.paragraphs) return { ok: false, reason: 'missing-scoreMatrix' };
  if (!raw.scoreMatrix.coachingMap) return { ok: false, reason: 'missing-coachingMap' };
  let coherenceDefault = false;
  if (!raw.coherenceReport || typeof raw.coherenceReport !== 'object') {
    coherenceDefault = true;
  }
  return { ok: true, coherenceDefault };
}

describe('L4 composite parse paths — fail-fast vs truncation-tolerant', () => {
  it('fails fast when northStar is missing entirely', () => {
    const r = parseComposite({ scoreMatrix: { paragraphs: [] } });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('missing-northStar');
  });

  it('fails fast when scoreMatrix.paragraphs is missing', () => {
    const r = parseComposite({ northStar: {}, scoreMatrix: {} });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('missing-scoreMatrix');
  });

  it('fails fast when coachingMap is missing (L4b consolidation invariant)', () => {
    const r = parseComposite({ northStar: {}, scoreMatrix: { paragraphs: [] } });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('missing-coachingMap');
  });

  it('defaults coherenceReport to empty on truncation (no fail-fast)', () => {
    const r = parseComposite({
      northStar: {},
      scoreMatrix: { paragraphs: [], coachingMap: {} },
      // coherenceReport intentionally missing (LLM truncated mid-emit)
    });
    expect(r.ok).toBe(true);
    expect(r.coherenceDefault).toBe(true);
  });

  it('parses cleanly when every section is present', () => {
    const r = parseComposite({
      northStar: { structuralRolesMap: [] },
      scoreMatrix: { paragraphs: [], coachingMap: { priorities: [] } },
      coherenceReport: { contradictions: [], isCoherent: true },
    });
    expect(r.ok).toBe(true);
    expect(r.coherenceDefault).toBe(false);
  });
});
