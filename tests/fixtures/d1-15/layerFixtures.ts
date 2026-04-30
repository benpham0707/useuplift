// ============================================================================
// D-1.15 Layer Fixture Builders — Typed Outputs for Mocked LLM Layers
// ============================================================================
//
// Purpose: produce structurally valid TypeScript-typed outputs for every
// LLM-touching layer the iter-1 setup and iter-2 driver need to mock.
//
// Architecture decision (D-1.15.1, ratified 2026-04-30):
// - **Function-level vi.mock at the layer boundary** (Option A from the
//   pre-implementation decision tree). Each LLM-touching service is mocked
//   via vi.mock; the orchestration logic (mode selection, prior-annotations
//   builder, version tracker, coordinator, commit) runs REAL.
// - Iter-1 is set up directly via the seam primitives (createInitialProfile
//   → incrementIteration → bufferTaughtMoves → manual commitIterationDirectly)
//   per the D-1.10 test pattern. We do NOT drive iter-1 through analyzeEssay
//   — D-1.10 already proved the seam primitives compose correctly, and
//   driving the full pipeline on iter-1 would require mocking 8+ services
//   for no diagnostic benefit.
// - Iter-2 IS driven through `ReanalysisOrchestrator.processEdit()` — the
//   real orchestration logic runs; only the LLM-touching internals are
//   mocked. This is where D-1.15's diagnostic value lives: real prior-
//   annotations builder, real landing-write-back wire (D-1.6.5), real
//   version tracker, real coordinator commit.
//
// Provenance discipline (per Tue's 2026-04-30 directive "don't keep it
// just a mock — keep the real end product in mind"):
// - Each fixture-builder function carries a `// REAL-PARITY:` comment naming
//   what a real LLM run would produce that the fixture's structure honors,
//   AND `// SYNTHETIC:` comments at any field whose value is hand-authored
//   without a real-LLM precedent.
// - Fields that real Sonnet/Haiku output would populate with rich content
//   (teachingRationale, northStarConnection, capacityBuildingNote) are
//   populated with plausible-shaped placeholders + a comment marking them
//   as illustrative.

import type {
  L5Annotation,
  L5AnnotationResult,
} from '../../../src/services/essayIntelligence/analysis/deepAnnotationService';
import type {
  FocusedAnalysisResult,
} from '../../../src/services/essayIntelligence/analysis/focusedAnalyzer';
import type {
  LandingDetectorOutput,
} from '../../../src/services/essayIntelligence/analysis/landingDetector';
import type { Scenario } from './scenarios';

// ─── L5Annotation builder ──────────────────────────────────────────────

/**
 * Build a single L5Annotation anchored at the given location. Iter-1 setup
 * uses these to populate the iter-1 buffered moves before calling
 * commitIterationDirectly; the real `l5AnnotationToTaughtMove` then converts
 * each into a TaughtMove with the correct generateTaughtMoveId-stable id.
 *
 * REAL-PARITY: shape mirrors what a real Sonnet L5 emission produces — full
 * 16-field annotation with non-null teachingMode, non-null content, populated
 * teachingRationale and northStarConnection. The post-D-1.6.6 carve-out is
 * honored (no deepenedBy / supersededBy on TaughtMove derived from this).
 *
 * SYNTHETIC: teachingRationale, northStarConnection, capacityBuildingNote,
 * stakes are illustrative-shaped strings; a real run would have richer content
 * grounded in the specific essay's architecture. The harness's assertions
 * deliberately do NOT check field values for these — only that they exist
 * and the resulting taughtMove.id is stable.
 */
export function buildL5Annotation(args: {
  /** Stable id seed; must be unique within the L5AnnotationResult. */
  id: string;
  paragraphIndex: number;
  sentenceIndex?: number;
  /** Optional override for content. Defaults to a plausible per-paragraph teaching observation. */
  content?: string;
  /** Optional teachingMode override. Defaults to 'awareness' (the most common in elite-essay L5 output). */
  teachingMode?: L5Annotation['teachingMode'];
}): L5Annotation {
  return {
    id: args.id,
    location: {
      paragraphIndex: args.paragraphIndex,
      sentenceIndex: args.sentenceIndex ?? null,
      spanText: null,
    },
    type: 'growth',
    teachingIntent:
      args.content ??
      `Notice how this paragraph's voice register shifts when the focal moment arrives — the rhythm tightens, the verbs sharpen.`,
    teachingMode: args.teachingMode ?? 'awareness',
    content:
      args.content ??
      `The transition into the focal moment lands with stronger sensory detail than the surrounding context — a craft choice the essay can lean into elsewhere.`,
    // SYNTHETIC: real Sonnet L5 produces richer architectural rationale
    // grounded in the specific essay's through-line. Placeholder shape
    // honored; assertions never read this field beyond non-null check.
    teachingRationale:
      'The architectural role of this paragraph (turning point) benefits when sensory specificity accelerates as the narrator moves from context into action; the technique transfers to other transitions.',
    northStarConnection:
      'Connects to the essay\'s through-line of "discipline of paying attention" by demonstrating the discipline at the sentence level.',
    stakes:
      'Without this technique generalized, future essays risk flattening their turning points into expository prose.',
    priority: 3,
    phase: 'craft',
    rewriteExample: null,
    wordEconomyCut: null,
    antiPatternExample: null,
    transferablePrinciple: null,
    confidence: 0.82,
    crossParagraphRefs: [],
    capacityBuildingNote:
      'The student can practice this in revision: where else does the essay arrive at a moment? Could the surrounding sentences tighten?',
  };
}

/**
 * Build an iter-1 L5AnnotationResult for a scenario. One annotation per
 * `iter1MoveAnchors` entry. Used by iter-1 setup to populate the buffered
 * moves before commit.
 *
 * The harness uses this builder's output as the canonical "iter-1 L5 said
 * this" record; the corresponding TaughtMoves derive deterministically via
 * `l5AnnotationToTaughtMove` so iter-2 assertions can re-derive expected
 * IDs from the source annotations.
 */
export function buildIter1L5Annotations(scenario: Scenario): L5Annotation[] {
  return scenario.iter1MoveAnchors.map((anchor, idx) =>
    buildL5Annotation({
      id: `A-iter1-${scenario.id}-${idx}`,
      paragraphIndex: anchor.paragraphIndex,
      sentenceIndex: anchor.sentenceIndex,
    }),
  );
}

/**
 * Wrap iter-1 annotations in a structurally valid L5AnnotationResult. Most
 * fields are placeholders the iter-1 setup doesn't actually consume — the
 * resulting taughtMoves come from the annotations array, not the wrapper —
 * but the wrapper must type-check for any future test that wants to feed
 * the whole result into a mock.
 */
export function buildIter1L5Result(scenario: Scenario): L5AnnotationResult {
  const annotations = buildIter1L5Annotations(scenario);
  // Group annotations by paragraph as the real L5 service does.
  const byParagraph = new Map<number, L5Annotation[]>();
  for (const a of annotations) {
    const list = byParagraph.get(a.location.paragraphIndex) ?? [];
    list.push(a);
    byParagraph.set(a.location.paragraphIndex, list);
  }
  const paragraphAnnotations = Array.from(byParagraph.entries())
    .sort(([a], [b]) => a - b)
    .map(([paragraphIndex, anns]) => ({ paragraphIndex, annotations: anns }));

  // Use an explicit-typed binding (not a cast) so TypeScript verifies
  // every required field is present. If L5AnnotationResult ever grows
  // a new required field, this fixture surfaces the drift at compile
  // time rather than papering over it with a cast.
  const result: L5AnnotationResult = {
    paragraphAnnotations,
    essayLevelAnnotations: [],
    crossParagraphAnnotations: [],
    phase: 'craft',
    annotationCount: annotations.length,
    densityDiagnostics: [],
    cost: 0,
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    timingMs: 0,
  };
  return result;
}

// ─── LandingDetector mock builder ──────────────────────────────────────

/**
 * Build a LandingDetectorOutput for an iter-2 scenario. Defaults to
 * `addressed` with high confidence — the canonical "student edit landed
 * the prior teaching move" outcome. Per-scenario overrides supported via
 * the args.
 *
 * REAL-PARITY: shape mirrors LandingDetectorOutput (4 required fields).
 * Real Sonnet detector produces longer reasoning grounded in the specific
 * (oldText, newText) edit; placeholder reasoning honored — assertions
 * never read the reasoning field text beyond non-null check.
 */
export function buildLanding(
  overrides: Partial<LandingDetectorOutput> = {},
): LandingDetectorOutput {
  return {
    status: 'addressed',
    confidence: 0.88,
    reasoning:
      'Student edit substantively addresses the prior teaching move at this paragraph; the revised sentence demonstrates the suggested technique.',
    signalsUsed: ['edit_vs_critique'],
    ...overrides,
  };
}

// ─── FocusedAnalysisResult mock builder ────────────────────────────────

/**
 * Build a focused-analyzer output for an iter-2 scenario. The default
 * shape (escalationLevel: 1, escalationLevelTrustworthy: true, no failures)
 * represents the canonical "small edit, focused completed cleanly" outcome.
 *
 * Per-scenario overrides for: paragraph touched, escalation level, and
 * D-1.12 failure flags (escalationLevelTrustworthy=false + failedSteps[]).
 *
 * REAL-PARITY: shape mirrors FocusedAnalysisResult including the D-1.12
 * Commit B closure fields. Real Sonnet focused-analyzer produces richer
 * understandingDelta/analysisDelta content; the harness uses null deltas
 * here because iter-2 assertions don't read delta content (those are
 * downstream consumer concerns).
 */
export function buildFocusedAnalysisResult(args: {
  updatedParagraphIndex: number;
  updatedSentenceIndex?: number;
  escalationLevel?: 1 | 2 | 3 | 4;
  escalationLevelTrustworthy?: boolean;
  failedSteps?: FocusedAnalysisResult['failedSteps'];
}): FocusedAnalysisResult {
  return {
    mode: 'focused',
    escalationLevel: args.escalationLevel ?? 1,
    updatedParagraphIndex: args.updatedParagraphIndex,
    updatedSentenceIndex: args.updatedSentenceIndex ?? 0,
    understandingDelta: null,
    analysisDelta: null,
    phaseUpdate: null,
    cost: [],
    totalCost: 0,
    escalationLevelTrustworthy: args.escalationLevelTrustworthy ?? true,
    failedSteps: args.failedSteps ?? [],
  };
}
