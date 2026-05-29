// ============================================================================
// assembleRewriteInputs — integration assembly test
// ============================================================================
// Validates that the pure assembler walks a synthetic Crochet-shaped
// EssayProfile and produces a GenerateEssayLevelRewritesInput with every
// contract field populated correctly. Covers:
//   - Prerequisite gating (throws when L4 coachingMap missing)
//   - Empty paragraphs guard
//   - Gap construction per priority (id, MEM enrichment, word budget,
//     candidate anchors)
//   - Style profile assembly (legacy field defaults)
//   - Preservation contract assembly (high-effectiveness filter)
//   - Essay context assembly (structuralRole lookup, transformative insight)
//   - Word budget driven by priority impact + paragraph length
//   - PriorRewriteDigest pass-through (Q4)

import { describe, it, expect } from 'vitest';

import { assembleRewriteInputs } from '../../src/services/essayIntelligence/analysis/rewriteGeneration';
import type {
  CoachingMap,
  EarnedMoment,
  EssayProfile,
  ParagraphProfile,
  PriorRewriteDigest,
  VoiceIdentity,
  VoiceMap,
} from '../../src/services/essayIntelligence/profileTypes';

// ───────────────────────────────────────────────────────────────────────────
// Fixture builder — a Crochet-shaped EssayProfile with all required fields
// ───────────────────────────────────────────────────────────────────────────

function makeParagraph(
  index: number,
  text: string,
  effectiveness: number,
  verdict: string,
): ParagraphProfile {
  return {
    index,
    text,
    tags: [],
    understanding: null,
    analysis: {
      effectiveness,
      verdict,
      strengthSignatures: [],
      growthEdges: [],
    },
    sentences: [],
  } as unknown as ParagraphProfile;
}

function makeCrochetLikeProfile(
  overrides: { priorRewriteDigest?: PriorRewriteDigest[] } = {},
): EssayProfile {
  // 5 paragraphs roughly mirroring Crochet's lengths + effectiveness.
  const paragraphs: ParagraphProfile[] = [
    makeParagraph(
      0,
      // ~60 words (intro)
      'My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton. ' +
        "Don't get the wrong idea, now — I'm not a taxidermist or anything. I crochet. " +
        'The yarn collects on my desk like a small reef. My fingers know the gauge.',
      80,
      'Misdirection opener establishes voice intimacy through playful conspiracy.',
    ),
    makeParagraph(
      1,
      // ~190 words (history — long, structural anchor)
      'My grandmother wielded her crochet hook like a mage with a staff. ' +
        'Then the Vietnam War turned our family into refugees. ' +
        'The Viet Cong imprisoned my grandfather, a colonel in the South Vietnam Air Force, in a labor camp for thirteen years. ' +
        'Many wives would have lost hope, but my grandmother was no average woman. ' +
        'A literature professor in a time when women had little access to education, she assumed the role of matriarch with wisdom and confidence, providing financial and emotional security. ' +
        'She made durable pillowcases and blankets and winter coats during wartime scarcity. ' +
        "She taught my mother to do the same. Because of these bitter wartime memories, she wanted my handiwork to be of a decidedly less practical bent — chrysanthemums, roses, flowers that bloom from yarn. " +
        'Making flowers bloom from yarn was no easy task. The hook resisted me. The yarn frayed under my pull.',
      65,
      'Carries gravitational weight but voice code-switches and grandfather imprisonment treated as documentation.',
    ),
    makeParagraph(
      2,
      // ~95 words (struggle scene)
      'I impatiently wrenched the hook through the yarn. It stubbornly disobeyed my orders. ' +
        "My grandmother's stern appraisal interrupted me, and I felt the perpetual tug-of-war between her patient hands and my impatient ones. " +
        'My stitches were uneven. The edges curled inward. I would unravel my work and start anew, again and again, the hook becoming an enchanted broom that refused to obey, the yarn a stream I could not channel.',
      80,
      'Embodied struggle anchor through cyclical failure — only sustained scene in the essay.',
    ),
    makeParagraph(
      3,
      // ~140 words (mastery + gift-giving)
      'I learned to channel the magic of the crochet hook. ' +
        'I make animals now — Agnes, for example, a cornflower-blue elephant named after the mathematician Maria Gaetana Agnesi who lives in my calculus teacher\'s classroom, happily grazing on old pencil shavings and worksheets. ' +
        'Many of the animals I make embark on migratory journeys, like their real-life counterparts. ' +
        'I hope to weave a little whimsy and color into someone\'s life. ' +
        'I have not yet found another recipient who matches my calculus teacher\'s delight, but I keep making, keep giving, keep choosing what to send out into the world.',
      65,
      'Pivots to outward contribution with brilliant migration metaphor but elides the learning process.',
    ),
    makeParagraph(
      4,
      // ~50 words (closing synthesis)
      'I am proud to be my family\'s link between East and West. ' +
        'My stitches are a network connecting mother and daughter, past and present, tradition and innovation. ' +
        'I am eager to weave my own mark into the great patchwork quilt that is America.',
      50,
      'Provides necessary synthesis but abandons earned specificity for generic civic vocabulary.',
    ),
  ];

  const coachingMap: CoachingMap = {
    transformativeInsight: {
      insight:
        "The essay's power comes from the grandmother's intentional reversal — she survived war by making practical items, then deliberately taught the narrator decorative flowers to give her aesthetic freedom the war denied.",
      evidenceLocations: [{ paragraph: 1, sentence: 7 }, { paragraph: 3, sentence: 3 }],
      whyThisTransforms:
        'Understanding this reversal reframes the entire essay — the narrator inherits not necessity but the grandmother\'s capacity to transform necessity into choice.',
      requiresStudentAwareness: true,
    },
    priorities: [
      {
        priority: 'Bridge the temporal leap between P2 cyclical failure and P3 claimed mastery',
        target: {
          paragraphs: [2, 3],
          description:
            'The white space between P2 cyclical failure and P3 mastery claim',
        },
        architecturalReason:
          'P2 carries the only sustained scene; without a visible turning point the mastery transformation happens in white space.',
        unlocksNext:
          'Once visible, P3 gift-giving purpose becomes the natural next step — mastery enables contribution.',
        expectedImpact: 'transformative',
        consolidatedFrom: ['CAND_L3_P2S4_xyz', 'CAND_L35_P3S1_abc'],
      },
      {
        priority: 'Ground P4 metaphorical synthesis in a specific crocheted object',
        target: { paragraphs: [4], description: 'P4 abstract metaphor cascade' },
        architecturalReason:
          'P4 abandons concrete specificity for generic civic vocabulary at the moment it most needs to land with specificity.',
        unlocksNext:
          'Concrete object would let the cultural bridge claim emerge from craft practice rather than imported civic vocabulary.',
        expectedImpact: 'significant',
        consolidatedFrom: ['CAND_L4_P4S1_def'],
      },
      {
        priority: 'Add one additional named recipient beyond the calculus teacher',
        target: { paragraphs: [3], description: 'P3 single-recipient gift-giving' },
        architecturalReason:
          'A single recipient cannot establish a pattern. The connection-building claim needs more evidence.',
        unlocksNext: 'A second named recipient establishes gift-giving as genuine practice.',
        expectedImpact: 'incremental',
        // consolidatedFrom intentionally omitted to test the synthetic-ID fallback.
      },
    ],
    protectedStrengths: [
      {
        description:
          'The misdirection opening (menagerie → taxidermist denial → "I crochet.")',
        locations: [{ paragraph: 0, sentence: 0 }, { paragraph: 0, sentence: 2 }],
        whyProtect:
          'Three-sentence architecture establishes the voice contract that makes the rest of the essay work.',
      },
      {
        description:
          'The cyclical failure structure in P2 (wrenched → appraisal → unravel → restart)',
        locations: [{ paragraph: 2, sentence: 0 }, { paragraph: 2, sentence: 4 }],
        whyProtect:
          'Essay\'s only sustained scene; physical grounding makes the mastery claim feel earned.',
      },
      {
        description:
          'The migration metaphor ("animals embark on migratory journeys, like their real-life counterparts")',
        locations: [{ paragraph: 3, sentence: 2 }],
        whyProtect:
          'Thematic pinnacle — transforms refugee displacement from trauma into chosen creative practice.',
      },
    ],
    emergentPatterns: [
      'Pattern: voice strongest in physical scenes (P0/P2), retreats to abstraction in reflection (P1/P4)',
    ],
    scoreTensions: ['P1: structural(92) >> emotional(48) — gravitational weight without felt experience'],
  };

  const voiceIdentity: VoiceIdentity = {
    signature: 'Conversational with playful intimacy; shifts to formal historical interludes.',
    register: 'conversational',
    primaryRegister: 'conversational with formal historical interludes',
    distinctivePatterns: [
      'Second-person asides creating conspiratorial intimacy',
      'Extended magical metaphor system across P1-P3',
      'Paragraph-final single-sentence emphasis',
      'Temporal compression through clause-stacking',
    ],
    evolution: 'Voice moves from playful misdirection through reverent documentation to embodied struggle.',
    authenticVsPerformed: [],
    voiceMarkers: ['em-dash pivots', 'paragraph-final fragments', 'conversational asides'],
    voiceWeaknesses: ['retreats to abstract civic vocabulary in closings'],
  };

  const voiceMap: VoiceMap = {
    register: {
      baseline: 'conversational with playful intimacy',
      observations: [],
    },
    vocabularyFingerprint: {
      baseline: 'sensory domestic imagery with whimsical coloring',
      observations: [],
      domains: [
        { domain: 'whimsical domestic', exampleWords: ['menagerie', 'critters', 'cornflower-blue'], paragraphs: [0, 3] },
        { domain: 'magical/mythic', exampleWords: ['mage', 'staff', 'enchanted', 'wizard'], paragraphs: [1, 2, 3] },
        { domain: 'historical/political', exampleWords: ['refugees', 'Viet Cong', 'colonel'], paragraphs: [1] },
        { domain: 'textile/craft', exampleWords: ['stitches', 'unravel', 'fasten off'], paragraphs: [1, 2, 3, 4] },
      ],
    },
    sentenceRhythm: {
      baseline: 'clause-heavy structures with occasional staccato emphasis',
      observations: [],
    },
    perspectiveDistance: {
      baseline: 'close first-person present, occasionally stepping back for historical context',
      observations: [],
    },
    tonalDisposition: {
      baseline: 'earnest with playful self-awareness',
      observations: [],
      dominantQualities: ['earnestness', 'self_awareness', 'tenderness', 'humor'],
    },
    stabilityRegions: [],
    shifts: [],
  };

  const momentEarnednessMap = {
    moments: [
      {
        location: { paragraph: 1, sentence: 6 },
        momentType: 'emotional',
        description: "Claim that grandmother was 'no average woman'",
        payload: 'Admiration for the grandmother\'s exceptional resilience',
        mechanisms: [],
        gaps: ['sensory_grounding—no scene shows the grandmother\'s resilience in action'],
      } as EarnedMoment,
      {
        location: { paragraph: 3, sentence: 0 },
        momentType: 'intellectual',
        description: "The mastery claim: 'I learned to channel the magic of the crochet hook'",
        payload: 'Achieved competence after struggle',
        mechanisms: [],
        gaps: [
          'intellectual_scaffolding—the essay elides the entire learning process. P2 ends with cyclical failure, P3 opens with achieved mastery.',
        ],
      } as EarnedMoment,
      {
        location: { paragraph: 3, sentence: 4 },
        momentType: 'emotional',
        description: "The gift-giving purpose: 'I hope to weave a little whimsy and color into someone\\'s life'",
        payload: 'Generous aspiration to contribute beyond self',
        mechanisms: [],
        gaps: ['emotional_setup—no earlier passage establishes the narrator\'s relationship to gift-giving'],
      } as EarnedMoment,
    ],
    structuralObservation:
      'Setup-payoff architecture is front-loaded: P1-P2 ground struggle, P3-P4 claim mastery without scaffolding.',
  };

  return {
    paragraphs,
    voiceIdentity,
    voiceMap,
    emotionalTopography: {
      arcTrajectory: 'Emotion moves from playful invitation through reverent admiration to embodied frustration.',
      peakMoments: [],
      undertones: ['survivor\'s gratitude', 'loneliness of the bridge position'],
      emotionalProgression: [],
      showVsTell: [],
      authenticityAssessment:
        'Emotion is unevenly grounded: P2 frustration is shown; P1 historical trauma is told; P4 civic aspiration is asserted. Restraint on grandfather\'s imprisonment reads as healthy boundary, not avoidance.',
    },
    momentEarnednessMap,
    thematicArchitecture: {
      centralThesis: 'Crochet transforms from survival to inheritance to chosen connection.',
      thesisConfidence: 0.85,
      thesisEvolution: 'Emerges through three-stage compression.',
      threads: [],
      subtext: 'Resilience is choosing what to carry forward from hardship.',
      contradictions: [],
    },
    narrativeStrategy: {
      primaryStrategy: 'Temporal compression with embedded struggle scene.',
      strategyRationale: 'Compression carries heavy historical weight without becoming trauma narrative.',
      pivotPoints: [],
      pacingAnalysis: 'Accelerates through P1, decelerates through P2.',
      structuralChoices: [],
      arcType: 'transformation',
      arcMomentum: 'building',
      turningPoint: { paragraph: 3, sentence: 0 },
    },
    characterRevelation: {
      writerPortrait:
        'Someone who would bring a crocheted animal to your birthday party and name it after a mathematician you\'ve never heard of.',
      valuesRevealed: ['persistence without drama', 'generosity as action'],
      growthArc: 'Incompetent inheritor → skilled practitioner → cultural bridge-builder.',
      intellectualFingerprint:
        'Thinks through metaphor systems, compresses time efficiently, moves between concrete detail and abstract synthesis.',
      blindSpots: [],
      revealedQualities: [],
    },
    craftAssessment: {
      strengthSignatures: [],
      growthEdges: [],
      imageSystem:
        'Three registers layer: domestic objects (P0-P1), natural world (P1-P3), textile metaphors (P3-P4). Textile metaphors absorb the others by P4.',
      sentencePatterns:
        'Alternates compression (long clauses for history) and expansion (short declaratives for struggle).',
      wordPatterns: 'Recycles "weave/stitches/tradition" across paragraphs to thread theme.',
      signatureMove: {
        oneSentenceName:
          'Disproportion-then-inversion architecture: misdirection opener sets up trivial subject, then loads survival-scale stakes, then closes by inverting the disproportion.',
        whyItIsTheirs:
          'The essay depends structurally on making the reader underestimate crochet before revealing its generational weight.',
        instances: [],
        readerEffect:
          'Reader is pulled forward by misdirection, reoriented by historical weight, given thematic closure by inversion.',
      },
    },
    entanglements: [],
    admissionsPositioning: {
      tellabilitySummary: '',
      memorability: '',
      institutionalFit: '',
      portfolioPosition: '',
      aoTakeaway: '',
      archetype: { name: '', poolDensity: '', differentiator: '' },
      distinctivenessFactors: [],
      redFlags: [],
    } as unknown as EssayProfile['admissionsPositioning'],
    essayUnderstanding: {} as unknown as EssayProfile['essayUnderstanding'],
    northStar: {
      activeScale: 'personal_statement',
      throughLineMap: {
        centralElement: 'crochet as inheritance medium',
        elementType: 'relationship',
        transformation:
          'Crochet transforms from survival tool to burden to chosen creative practice.',
        journey: [
          { location: { paragraph: 0, sentence: 2 }, meaningAtPoint: 'personal quirk', narrativeMove: 'introduction' },
          { location: { paragraph: 3, sentence: 0 }, meaningAtPoint: 'channeled magic', narrativeMove: 'transformation' },
        ],
        connectionRefs: [],
      },
      structuralRolesMap: [
        { paragraphs: [0], role: 'Misdirection frame and voice contract', significance: '', weight: 'load_bearing' },
        { paragraphs: [1], role: 'Historical compression chamber', significance: '', weight: 'load_bearing' },
        { paragraphs: [2], role: 'Embodied struggle anchor', significance: '', weight: 'load_bearing' },
        { paragraphs: [3], role: 'Mastery pivot and scope expansion', significance: '', weight: 'supporting' },
        { paragraphs: [4], role: 'Metaphorical synthesis and future projection', significance: '', weight: 'supporting' },
      ],
      trajectory: null,
      distinctivenessSignature: {} as unknown as EssayProfile['northStar']['distinctivenessSignature'],
      intentBridge: null,
      confidence: 'emerging',
      lastUpdatedBy: 'L4',
    },
    scoreMatrix: {
      paragraphs: [],
      crossParagraphPatterns: [],
      prioritizedImprovements: [],
      coachingMap,
    },
    connections: { all: [], bySource: {} },
    editHistory: [],
    findings: [],
    questionQueue: [],
    conversationInsights: [],
    patternInsights: [],
    studentDeclaredContext: '',
    index: {} as EssayProfile['index'],
    metadata: {
      confidenceLevel: 'deep',
      lastUpdatedLayer: 4,
      paragraphsCovered: [0, 1, 2, 3, 4],
      conversationInsightsCount: 0,
      totalAnalysisCost: 1.69,
      createdAt: '2026-05-05',
      lastMutatedAt: '2026-05-05',
      legacyProfile: false,
    },
    priorRewriteDigest: overrides.priorRewriteDigest,
  } as unknown as EssayProfile;
}

// ───────────────────────────────────────────────────────────────────────────
// 1. Prerequisite gating
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — prerequisite gating', () => {
  it('throws when scoreMatrix.coachingMap is missing', () => {
    const profile = makeCrochetLikeProfile();
    (profile as { scoreMatrix?: unknown }).scoreMatrix = undefined;
    expect(() => assembleRewriteInputs(profile)).toThrowError(/coachingMap is required/);
  });

  it('throws when paragraphs is empty', () => {
    const profile = makeCrochetLikeProfile();
    (profile as { paragraphs: unknown[] }).paragraphs = [];
    expect(() => assembleRewriteInputs(profile)).toThrowError(/paragraphs is empty/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Gap construction — every contract field per priority
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — gap construction', () => {
  it('builds one gap per CoachingMap priority', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.gaps).toHaveLength(3);
  });

  it('uses consolidatedFrom[0] as the gap id when present', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.gaps[0].id).toBe('CAND_L3_P2S4_xyz');
    expect(input.gaps[1].id).toBe('CAND_L4_P4S1_def');
  });

  it('falls back to synthetic gap id when consolidatedFrom is missing', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // Third priority intentionally omits consolidatedFrom; anchor paragraph = 3.
    expect(input.gaps[2].id).toBe('gap_p3_2');
  });

  it('parses MEM gap into missingMechanism when paragraph overlaps', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // Priority 0 targets paragraphs [2, 3]; MEM has moments at P1, P3, P3.
    // First matching moment with gaps[] is at P3 — intellectual_scaffolding.
    expect(input.gaps[0].missingMechanism).toBe('intellectual_scaffolding');
    expect(input.gaps[0].whatItShouldProvide).toContain('elides the entire learning process');
  });

  it('uses unclassified + priority.target.description when no MEM moment matches', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // Priority 1 targets paragraph [4]; no MEM moment lives in paragraph 4.
    expect(input.gaps[1].missingMechanism).toBe('unclassified');
    expect(input.gaps[1].whatItShouldProvide).toBe('P4 abstract metaphor cascade');
  });

  it('populates candidateAnchors from MEM moments in target paragraphs', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // Priority 0 (targets [2, 3]): MEM has moments at P3S0, P3S4 → 2 candidates.
    expect(input.gaps[0].candidateAnchors).toHaveLength(2);
    expect(input.gaps[0].candidateAnchors[0].paragraph).toBe(3);
  });

  it('passes through architecturalReason, unlocksNext, expectedImpact, consolidatedFrom', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.gaps[0].architecturalReason).toContain('only sustained scene');
    expect(input.gaps[0].unlocksNext).toContain('gift-giving purpose');
    expect(input.gaps[0].expectedImpact).toBe('transformative');
    expect(input.gaps[0].consolidatedFrom).toEqual(['CAND_L3_P2S4_xyz', 'CAND_L35_P3S1_abc']);
  });

  it('anchorLocation defaults to first target paragraph with null sentence/spanText (LLM picks later)', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.gaps[0].anchorLocation.paragraph).toBe(2);
    expect(input.gaps[0].anchorLocation.sentence).toBeNull();
    expect(input.gaps[0].anchorLocation.spanText).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Word budget — driven by impact tier × paragraph length
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — word budget', () => {
  it('transformative priority on P2 (~95 words) → length cap binds (max ≤ 47)', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    const wb = input.gaps[0].wordBudget;
    expect(wb.targetDelta.min).toBe(30);
    expect(wb.targetDelta.max).toBeGreaterThanOrEqual(30);
    expect(wb.targetDelta.max).toBeLessThanOrEqual(50);
  });

  it('essay-level word counts populated', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    const wb = input.gaps[0].wordBudget;
    expect(wb.essayCurrentWords).toBeGreaterThan(0);
    expect(wb.essayMaxWords).toBe(650); // personal_statement default
  });

  it('respects custom essayMaxWords override', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile, { essayMaxWords: 500 });
    expect(input.gaps[0].wordBudget.essayMaxWords).toBe(500);
  });

  it('incremental priority gets tier range [5, 15]', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    const wb = input.gaps[2].wordBudget; // priority 3 is incremental
    expect(wb.targetDelta.min).toBe(5);
    expect(wb.targetDelta.max).toBeLessThanOrEqual(15);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. StyleProfile assembly
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — styleProfile', () => {
  it('pulls registerBaseline from primaryRegister when present', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.registerBaseline).toContain('conversational');
  });

  it('passes through distinctivePatterns, voiceMarkers, voiceWeaknesses verbatim', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.distinctivePatterns.length).toBe(4);
    expect(input.styleProfile.voiceMarkers).toContain('em-dash pivots');
    expect(input.styleProfile.voiceWeaknesses).toContain('retreats to abstract civic vocabulary in closings');
  });

  it('extracts vocabularyDomains from voiceMap.vocabularyFingerprint', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.vocabularyDomains).toHaveLength(4);
    expect(input.styleProfile.vocabularyDomains[1].domain).toBe('magical/mythic');
  });

  it('extracts signatureMove with oneSentenceName + readerEffect + whyItIsTheirs', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.signatureMove).not.toBeNull();
    expect(input.styleProfile.signatureMove!.oneSentenceName).toContain('Disproportion-then-inversion');
  });

  it('signatureMove is null when craftAssessment.signatureMove is null', () => {
    const profile = makeCrochetLikeProfile();
    (profile.craftAssessment as { signatureMove?: unknown }).signatureMove = null;
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.signatureMove).toBeNull();
  });

  it('voiceMarkers/voiceWeaknesses default to [] on legacy profile (fields absent)', () => {
    const profile = makeCrochetLikeProfile();
    delete (profile.voiceIdentity as { voiceMarkers?: unknown }).voiceMarkers;
    delete (profile.voiceIdentity as { voiceWeaknesses?: unknown }).voiceWeaknesses;
    const input = assembleRewriteInputs(profile);
    expect(input.styleProfile.voiceMarkers).toEqual([]);
    expect(input.styleProfile.voiceWeaknesses).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Preservation contract
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — preservation contract', () => {
  it('pulls preserveSpans from coachingMap.protectedStrengths', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.constraints.preserveSpans).toHaveLength(3);
    expect(input.constraints.preserveSpans[0].description).toContain('misdirection opening');
  });

  it('passes emotionalRegisterConstraint from authenticityAssessment verbatim', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // Capital "Restraint" in the fixture; verbatim pass-through preserves it.
    expect(input.constraints.emotionalRegisterConstraint).toContain('Restraint');
  });

  it('highEffectivenessParagraphs filters to effectiveness >= 80', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    // P0=80, P2=80 → 2 paragraphs at or above threshold.
    expect(input.constraints.highEffectivenessParagraphs).toHaveLength(2);
    expect(input.constraints.highEffectivenessParagraphs.map((p) => p.paragraph)).toEqual([0, 2]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. Essay context
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — essay context', () => {
  it('assembles essayText by joining paragraphs with \\n\\n', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.context.essayText).toContain('My nightstand');
    expect(input.context.essayText).toContain('I am proud to be my family');
    expect(input.context.essayText.includes('\n\n')).toBe(true);
  });

  it('looks up structuralRole per paragraph from northStar.structuralRolesMap', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.context.paragraphs[0].structuralRole).toBe('Misdirection frame and voice contract');
    expect(input.context.paragraphs[2].structuralRole).toBe('Embodied struggle anchor');
  });

  it('passes throughLineMap from northStar', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.context.throughLineMap).not.toBeNull();
    expect(input.context.throughLineMap!.centralElement).toBe('crochet as inheritance medium');
  });

  it('extracts transformativeInsight from coachingMap', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.context.transformativeInsight.insight).toContain('intentional reversal');
    expect(input.context.transformativeInsight.whyThisTransforms).toContain('necessity into choice');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 7. PriorRewriteDigest pass-through (Q4)
// ───────────────────────────────────────────────────────────────────────────

describe('assembleRewriteInputs — prior drafts pass-through', () => {
  it('passes profile.priorRewriteDigest through to input.priorDrafts', () => {
    const digest: PriorRewriteDigest[] = [
      {
        gapId: 'CAND_L3_P2S4_xyz',
        draftText: 'Then one afternoon, the hook stopped fighting me.',
        intensityLevel: 'minimal',
        wasApplied: false,
        generatedAt: Date.now() - 86400 * 1000,
      },
    ];
    const profile = makeCrochetLikeProfile({ priorRewriteDigest: digest });
    const input = assembleRewriteInputs(profile);
    expect(input.priorDrafts).toEqual(digest);
  });

  it('priorDrafts is undefined when profile.priorRewriteDigest is absent', () => {
    const profile = makeCrochetLikeProfile();
    const input = assembleRewriteInputs(profile);
    expect(input.priorDrafts).toBeUndefined();
  });
});
