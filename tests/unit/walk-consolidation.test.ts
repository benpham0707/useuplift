// ============================================================================
// D-2.2 §11.14 — walk consolidation step unit tests
// ============================================================================
//
// Drives `consolidateSpecificsNeedEmissions` (private method on
// SequentialDeepWalkService) directly to exercise the round 1.8 §11.9 +
// §11.12 consolidation logic without mocking the full walk pipeline. Five
// test groups:
//
//   §1 Volume cap enforcement (3-emission ceiling, sorted by priority)
//   §2 Per-concept complexity caps (simple=1, medium=2, complex=3)
//   §3 Concept library tag reuse policy
//   §4 Cross-pass library persistence + gap-resolution detection
//   §5 Survivor write-back to per-paragraph storage
//
// Test access: the consolidation method is `private`, so tests cast the
// service through `unknown as { consolidate...: ... }` to expose it. This
// is documented in the method's JSDoc.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { SequentialDeepWalkService } from '../../src/services/essayIntelligence/analysis/sequentialDeepWalk';
import type {
  EssayProfile,
  UnderstandingWalkOutput,
  SpecificsNeedEmission,
  ParagraphProfile,
  ConceptLibraryEntry,
} from '../../src/services/essayIntelligence/profileTypes';

// ─── Test fixtures ─────────────────────────────────────────────────────────

let emissionCounter = 0;

function buildEmission(
  overrides: Partial<SpecificsNeedEmission> = {},
): SpecificsNeedEmission {
  emissionCounter++;
  return {
    sourceLayer: 'l3_walk',
    emittingTrigger: `synthetic trigger ${emissionCounter}`,
    anchorParagraph: 0,
    question: `synthetic question ${emissionCounter}`,
    dimensions: ['narrative'],
    expectedInsight: `synthetic insight ${emissionCounter}`,
    expectedDiscovery: `synthetic discovery ${emissionCounter}`,
    conceptTag: 'specific over general',
    conceptComplexity: 'simple',
    conceptDefinition: 'one-sentence universal definition.',
    conceptExample: "From a college essay: 'three days before...'",
    priority: 'medium',
    whyAsked: `synthetic why ${emissionCounter}`,
    expectedAnswerShape: 'specific_memory',
    consumers: ['l3', 'l5'],
    populates: ['groundTruthFacts.byLocation'],
    framingSeed: `synthetic seed ${emissionCounter} alpha bravo charlie`,
    ...overrides,
  };
}

function buildParagraphProfile(index: number, sentenceCount = 3): ParagraphProfile {
  return {
    index,
    text: `paragraph ${index} text body content here.`,
    tags: [],
    understanding: {
      role: '',
      function: '',
      narrativeContribution: '',
      emotionalRegister: {
        dominantEmotion: '',
        depth: '',
        authenticity: '',
        showVsTell: '',
        strongestMoment: null,
      },
      craftProfile: {
        rhythmPattern: '',
        imageUsage: '',
        voiceConsistency: '',
        standoutMoment: null,
      },
    },
    analysis: null,
    sentences: Array.from({ length: sentenceCount }, (_, i) => ({
      index: i,
      text: `sentence ${i}`,
      understanding: null,
      analysis: null,
    })),
  };
}

function makeProfile(opts: {
  paragraphCount?: number;
  conceptLibrary?: ConceptLibraryEntry[];
  currentIteration?: number;
}): EssayProfile {
  const paragraphCount = opts.paragraphCount ?? 3;
  const profile: Partial<EssayProfile> = {
    paragraphs: Array.from({ length: paragraphCount }, (_, i) =>
      buildParagraphProfile(i),
    ),
    conceptLibrary: opts.conceptLibrary ?? [],
    index: {
      iterationLedger: { currentIteration: opts.currentIteration ?? 1 },
    } as EssayProfile['index'],
  };
  return profile as EssayProfile;
}

function makeWalkOutput(
  paragraphIndex: number,
  emissions: SpecificsNeedEmission[],
): UnderstandingWalkOutput {
  return {
    paragraphIndex,
    paragraphUnderstanding: {
      role: '',
      function: '',
      narrativeContribution: '',
      emotionalRegister: {
        dominantEmotion: '',
        depth: '',
        authenticity: '',
        showVsTell: '',
        strongestMoment: null,
      },
      craftProfile: {
        rhythmPattern: '',
        imageUsage: '',
        voiceConsistency: '',
        standoutMoment: null,
      },
    },
    sentenceUnderstandings: [],
    holisticEvolution: {},
    priorSentenceUpdates: [],
    newConnections: [],
    specificsNeedEmissions: emissions.length > 0 ? emissions : undefined,
  };
}

// Cast service to expose the private consolidation method per JSDoc note.
type ConsolidateFn = (
  profile: EssayProfile,
  walkOutputs: UnderstandingWalkOutput[],
) => void;
function consolidate(
  profile: EssayProfile,
  walkOutputs: UnderstandingWalkOutput[],
): void {
  const service = new SequentialDeepWalkService();
  const fn = (
    service as unknown as { consolidateSpecificsNeedEmissions: ConsolidateFn }
  ).consolidateSpecificsNeedEmissions.bind(service);
  fn(profile, walkOutputs);
}

// ─── §1 — Volume cap enforcement ───────────────────────────────────────────

describe('D-2.2 §11.14 §1 — Per-essay volume cap (3 ceiling)', () => {
  it('8 candidates with distinct concepts and same priority → 3 survive (cap), ranked by paragraph order', () => {
    const profile = makeProfile({ paragraphCount: 8 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 8; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: `concept ${i}`,
            conceptComplexity: 'simple',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    let totalEmissions = 0;
    for (const para of profile.paragraphs) {
      const e = para.understanding?.specificsNeedEmissions ?? [];
      totalEmissions += e.length;
    }
    expect(totalEmissions).toBe(3);

    // Tied priority + same concept-cap budget → earliest paragraphs win.
    expect(profile.paragraphs[0].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[1].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[2].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[7].understanding?.specificsNeedEmissions).toBeUndefined();
  });

  it('priority ordering: critical > high > medium > low', () => {
    const profile = makeProfile({ paragraphCount: 4 });
    // Place lower priorities at earlier paragraphs to verify priority
    // re-ranks ahead of paragraph order at the per-essay ceiling.
    const walkOutputs: UnderstandingWalkOutput[] = [
      makeWalkOutput(0, [
        buildEmission({
          anchorParagraph: 0,
          conceptTag: 'concept-low',
          priority: 'low',
        }),
      ]),
      makeWalkOutput(1, [
        buildEmission({
          anchorParagraph: 1,
          conceptTag: 'concept-medium',
          priority: 'medium',
        }),
      ]),
      makeWalkOutput(2, [
        buildEmission({
          anchorParagraph: 2,
          conceptTag: 'concept-high',
          priority: 'high',
        }),
      ]),
      makeWalkOutput(3, [
        buildEmission({
          anchorParagraph: 3,
          conceptTag: 'concept-critical',
          priority: 'critical',
        }),
      ]),
    ];

    consolidate(profile, walkOutputs);

    // 4 candidates, ceiling 3 — the lowest-priority one (paragraph 0, low)
    // should drop. critical/high/medium survive.
    expect(profile.paragraphs[0].understanding?.specificsNeedEmissions).toBeUndefined();
    expect(profile.paragraphs[1].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[2].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[3].understanding?.specificsNeedEmissions?.length).toBe(1);
  });

  it('0 candidates → no consolidation effect, no library entries', () => {
    const profile = makeProfile({ paragraphCount: 3 });
    const walkOutputs: UnderstandingWalkOutput[] = [
      makeWalkOutput(0, []),
      makeWalkOutput(1, []),
      makeWalkOutput(2, []),
    ];

    consolidate(profile, walkOutputs);

    expect(profile.conceptLibrary).toEqual([]);
    for (const para of profile.paragraphs) {
      expect(para.understanding?.specificsNeedEmissions).toBeUndefined();
    }
  });
});

// ─── §2 — Per-concept complexity caps ──────────────────────────────────────

describe('D-2.2 §11.14 §2 — Per-concept complexity caps', () => {
  it('4 simple-complexity candidates same concept → 1 emit (simple cap = 1)', () => {
    const profile = makeProfile({ paragraphCount: 4 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 4; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: 'specific over general',
            conceptComplexity: 'simple',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    let totalEmissions = 0;
    for (const para of profile.paragraphs) {
      totalEmissions += para.understanding?.specificsNeedEmissions?.length ?? 0;
    }
    expect(totalEmissions).toBe(1);
    expect(profile.conceptLibrary?.length).toBe(1);
    expect(profile.conceptLibrary?.[0].instances.length).toBe(1);
  });

  it('4 complex-complexity candidates same concept → 3 emit (complex cap = 3, then per-essay 3 cap holds)', () => {
    const profile = makeProfile({ paragraphCount: 4 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 4; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: 'discovery over delivery',
            conceptComplexity: 'complex',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    let totalEmissions = 0;
    for (const para of profile.paragraphs) {
      totalEmissions += para.understanding?.specificsNeedEmissions?.length ?? 0;
    }
    expect(totalEmissions).toBe(3);
    expect(profile.conceptLibrary?.length).toBe(1);
    expect(profile.conceptLibrary?.[0].instances.length).toBe(3);
  });

  it('medium-complexity candidates: 3 with same concept → 2 emit (medium cap = 2)', () => {
    const profile = makeProfile({ paragraphCount: 3 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 3; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: 'concrete moment over summary',
            conceptComplexity: 'medium',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    let totalEmissions = 0;
    for (const para of profile.paragraphs) {
      totalEmissions += para.understanding?.specificsNeedEmissions?.length ?? 0;
    }
    expect(totalEmissions).toBe(2);
    expect(profile.conceptLibrary?.[0].instances.length).toBe(2);
  });
});

// ─── §3 — Concept tag reuse policy ─────────────────────────────────────────

describe('D-2.2 §11.14 §3 — Concept library reuse policy', () => {
  it('existing library entry → new instance appends, no duplicate entry', () => {
    const profile = makeProfile({
      paragraphCount: 3,
      conceptLibrary: [
        {
          tag: 'specific over general',
          complexity: 'medium',
          definition: 'existing definition',
          example: 'existing example',
          instances: [
            {
              paragraph: 0,
              iteration: 1,
              gapResolved: false,
            },
          ],
        },
      ],
      currentIteration: 2,
    });
    const walkOutputs: UnderstandingWalkOutput[] = [
      makeWalkOutput(2, [
        buildEmission({
          anchorParagraph: 2,
          conceptTag: 'specific over general',
          conceptComplexity: 'medium',
        }),
      ]),
    ];

    consolidate(profile, walkOutputs);

    // Only one library entry (reuse, no duplicate).
    expect(profile.conceptLibrary?.length).toBe(1);
    const entry = profile.conceptLibrary![0];
    // Instance count: 1 prior + 1 new = 2.
    expect(entry.instances.length).toBe(2);
    expect(entry.instances[1]).toEqual({
      paragraph: 2,
      sentence: undefined,
      iteration: 2,
      gapResolved: false,
    });
  });

  it('new tag → new library entry created with definition + example from emission', () => {
    const profile = makeProfile({ paragraphCount: 1 });
    const walkOutputs: UnderstandingWalkOutput[] = [
      makeWalkOutput(0, [
        buildEmission({
          anchorParagraph: 0,
          conceptTag: 'honest word over easy word',
          conceptComplexity: 'medium',
          conceptDefinition: 'NEW definition',
          conceptExample: 'NEW example',
        }),
      ]),
    ];

    consolidate(profile, walkOutputs);

    expect(profile.conceptLibrary?.length).toBe(1);
    expect(profile.conceptLibrary![0]).toMatchObject({
      tag: 'honest word over easy word',
      complexity: 'medium',
      definition: 'NEW definition',
      example: 'NEW example',
    });
  });
});

// ─── §4 — Cross-pass persistence + gap-resolution detection ────────────────

describe('D-2.2 §11.14 §4 — Cross-pass persistence + gap-resolution detection', () => {
  it('prior unresolved instance whose anchor paragraph disappeared → marked resolved', () => {
    const profile: EssayProfile = {
      ...makeProfile({ paragraphCount: 2, currentIteration: 2 }),
      conceptLibrary: [
        {
          tag: 'specific over general',
          complexity: 'simple',
          definition: 'def',
          example: 'ex',
          instances: [
            {
              // Anchor at paragraph 5 — but profile only has 2 paragraphs now.
              paragraph: 5,
              iteration: 1,
              gapResolved: false,
            },
          ],
        },
      ],
    };

    consolidate(profile, []);

    expect(profile.conceptLibrary![0].instances[0].gapResolved).toBe(true);
    expect(profile.conceptLibrary![0].instances[0].resolvedAtIteration).toBe(2);
  });

  it('prior unresolved instance whose anchor sentence disappeared → marked resolved', () => {
    const profile: EssayProfile = {
      ...makeProfile({ paragraphCount: 1, currentIteration: 2 }),
      conceptLibrary: [
        {
          tag: 'specific over general',
          complexity: 'simple',
          definition: 'def',
          example: 'ex',
          instances: [
            {
              paragraph: 0,
              sentence: 99, // doesn't exist
              iteration: 1,
              gapResolved: false,
            },
          ],
        },
      ],
    };

    consolidate(profile, []);

    expect(profile.conceptLibrary![0].instances[0].gapResolved).toBe(true);
    expect(profile.conceptLibrary![0].instances[0].resolvedAtIteration).toBe(2);
  });

  it('prior unresolved instance with anchor still valid → stays unresolved', () => {
    const profile: EssayProfile = {
      ...makeProfile({ paragraphCount: 3, currentIteration: 2 }),
      conceptLibrary: [
        {
          tag: 'specific over general',
          complexity: 'simple',
          definition: 'def',
          example: 'ex',
          instances: [
            {
              paragraph: 1,
              sentence: 1, // valid anchor
              iteration: 1,
              gapResolved: false,
            },
          ],
        },
      ],
    };

    consolidate(profile, []);

    expect(profile.conceptLibrary![0].instances[0].gapResolved).toBe(false);
    expect(profile.conceptLibrary![0].instances[0].resolvedAtIteration).toBeUndefined();
  });

  it('cap relaxation: prior 2 instances both resolved → simple-complexity slot reopens for new emission', () => {
    const profile: EssayProfile = {
      ...makeProfile({ paragraphCount: 2, currentIteration: 2 }),
      conceptLibrary: [
        {
          tag: 'specific over general',
          complexity: 'simple',
          definition: 'def',
          example: 'ex',
          instances: [
            {
              paragraph: 9, // disappeared
              iteration: 1,
              gapResolved: false,
            },
          ],
        },
      ],
    };

    const walkOutputs: UnderstandingWalkOutput[] = [
      makeWalkOutput(0, [
        buildEmission({
          anchorParagraph: 0,
          conceptTag: 'specific over general',
          conceptComplexity: 'simple',
        }),
      ]),
    ];

    consolidate(profile, walkOutputs);

    // Prior instance auto-resolved (anchor disappeared) → unresolved count
    // dropped to 0 → simple cap (1) allows the new emission to fire.
    expect(profile.conceptLibrary![0].instances.length).toBe(2);
    expect(profile.conceptLibrary![0].instances[0].gapResolved).toBe(true);
    expect(profile.conceptLibrary![0].instances[1].gapResolved).toBe(false);
    expect(profile.conceptLibrary![0].instances[1].iteration).toBe(2);
    expect(profile.paragraphs[0].understanding?.specificsNeedEmissions?.length).toBe(1);
  });
});

// ─── §5 — Survivor write-back to per-paragraph storage ─────────────────────

describe('D-2.2 §11.14 §5 — Survivor write-back', () => {
  it('dropped emissions clear specificsNeedEmissions on their paragraph', () => {
    // 3 candidates on simple concept, cap=1 → 2 drop. The dropped paragraphs
    // should NOT carry an empty array; the field should be deleted.
    const profile = makeProfile({ paragraphCount: 3 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 3; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: 'specific over general',
            conceptComplexity: 'simple',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    // Paragraph 0 wins (earliest, tied priority + tied concept).
    expect(profile.paragraphs[0].understanding?.specificsNeedEmissions?.length).toBe(1);
    expect(profile.paragraphs[1].understanding?.specificsNeedEmissions).toBeUndefined();
    expect(profile.paragraphs[2].understanding?.specificsNeedEmissions).toBeUndefined();
  });

  it('walkOutputs[].specificsNeedEmissions mirrors per-paragraph survivors', () => {
    const profile = makeProfile({ paragraphCount: 3 });
    const walkOutputs: UnderstandingWalkOutput[] = [];
    for (let i = 0; i < 3; i++) {
      walkOutputs.push(
        makeWalkOutput(i, [
          buildEmission({
            anchorParagraph: i,
            conceptTag: 'specific over general',
            conceptComplexity: 'simple',
            priority: 'medium',
          }),
        ]),
      );
    }

    consolidate(profile, walkOutputs);

    expect(walkOutputs[0].specificsNeedEmissions?.length).toBe(1);
    expect(walkOutputs[1].specificsNeedEmissions).toBeUndefined();
    expect(walkOutputs[2].specificsNeedEmissions).toBeUndefined();
  });
});
