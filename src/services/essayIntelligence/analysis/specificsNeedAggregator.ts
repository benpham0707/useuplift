// ============================================================================
// SPECIFICS-NEED AGGREGATOR (Phase 2 D-2.7)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_IMPLEMENTATION_PLAN.md §D-2.7
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md §3
//
// What this does:
//   Pure deterministic transformation. Inputs: per-layer
//   `SpecificsNeedEmission[]` (one array per analysis layer that
//   participated this iteration). Outputs: new
//   `UnderstandingQuestion` entries minted with
//   `source: 'analysis_specifics_gap'` and a populated `dig: DigContext`,
//   added to the supplied `QuestionQueueManager` via its existing
//   `addQuestion` path. Existing open queue questions matching new
//   emissions get `iterationsSurvived++` (signal that the same gap is
//   recurring across iterations).
//
// Dedup contract (per spec):
//   By `(anchorParagraph, expectedAnswerShape, framingSeed-similarity)`.
//   Similarity is Jaccard over framingSeed words (case-folded, lightly
//   tokenized) with threshold ≥ FRAMING_SEED_SIMILARITY_THRESHOLD. The
//   threshold is conservative (0.5) because a false-positive dedup
//   silently merges two distinct gaps; a false-negative dedup just adds
//   a redundant question that auto-promotes via mergeCuratedOutput's
//   iterationsSurvived path. The asymmetry — false-merges erase signal,
//   false-splits accumulate — pushes the threshold high.
//
// Failure surface (per the no-fallback charter):
//   - Schema-invalid emission (missing required field, wrong type,
//     empty required string) → throw with structured context
//     (sourceLayer, emissionIndex, malformed field). The throw halts
//     the aggregation; the orchestrator's catch path surfaces telemetry
//     and the iteration completes with the malformed-emission flag
//     visible. We do NOT silently drop the entry.
//   - Sequential semantics under partial failure: emissions are
//     processed one at a time (validate → mint → next). A malformed
//     emission's throw halts the aggregation immediately. Emissions
//     processed BEFORE the throw have already been minted; emissions
//     AFTER never reach the mint logic. Pre-throw mints are well-
//     formed valid questions — no queue corruption. The orchestrator's
//     re-run after the upstream layer fixes its emission contract
//     handles deduplication naturally (the valid emission from the
//     partial first run dedup-matches itself in the second run via
//     the framingSeed-similarity path). Consistent with the existing
//     project pattern in `priorAnnotationsBuilder.ts` (D-1.6) which
//     processes per-move sequentially and throws on first failure
//     with downstream consumers handling partial state.
//   - We do NOT silently fabricate missing fields, default empty
//     strings to placeholder values, or skip emissions that smell
//     wrong. Every error mode is visible.
//   - This is NOT all-or-nothing atomic. Partial mutations are NOT
//     rolled back on throw. The orchestrator's catch path observes
//     a queue with whatever pre-throw mints landed; the re-run after
//     the upstream layer fixes its emission contract handles
//     deduplication naturally via framingSeed-similarity.
//
// LLM-first compliance:
//   - Pure infrastructure (Rule 6); no LLM calls inside the aggregator.
//   - The closed enums on input emission fields (sourceLayer,
//     expectedAnswerShape, consumers, priority) are bookkeeping for
//     downstream routing — not LLM-perception taxonomies. Emissions
//     describe their content in free-text fields (whyAsked, framingSeed,
//     question, expectedInsight, emittingTrigger).
//   - No banned-phrase regex / blocklists.
//   - No must-have-X rules beyond the type's required fields.
//   - No centrist defaults masking LLM silence: every required field
//     is required; absence throws.

import type {
  SpecificsNeedEmission,
  UnderstandingQuestion,
  DigContext,
} from '../profileTypes';
import { QuestionQueueManager } from './questionQueueManager';

// ─── Constants ─────────────────────────────────────────────────────────

/**
 * Jaccard-similarity threshold for framingSeed dedup. Two emissions
 * with the same anchorParagraph + expectedAnswerShape are treated as
 * duplicates if their framingSeed word sets share ≥ this fraction.
 *
 * Set conservatively (0.5) because the failure modes are asymmetric:
 *   - false-merge: two distinct gaps collapse → student loses one
 *     potential dig question (silent signal loss, audit-only)
 *   - false-split: same gap appears as two questions → mergeCuratedOutput's
 *     auto-promotion handles this naturally on subsequent iterations
 *     (iterationsSurvived ≥ 3 → priority='high'); the queue self-heals
 *
 * 0.5 means: the two framing seeds share at least half their meaningful
 * words. If a future deliverable wants to tighten or loosen, this
 * constant is the single tuning knob; the threshold should NOT vary
 * per-layer or per-essay — that would re-introduce the closed-taxonomy
 * antipattern (Rule 3).
 */
export const FRAMING_SEED_SIMILARITY_THRESHOLD = 0.5;

/** Valid SpecificsNeedSourceLayer values for runtime validation. */
const VALID_SOURCE_LAYERS = new Set<SpecificsNeedEmission['sourceLayer']>([
  'l3_walk',
  'l3_5_analysis',
  'l3_75_phase_a',
  'l3_75_phase_b',
  'l4_north_star',
  'finding_maturity',
]);

/** Valid expectedAnswerShape values for runtime validation. */
const VALID_ANSWER_SHAPES = new Set<DigContext['expectedAnswerShape']>([
  'scalar',
  'short_phrase',
  'specific_memory',
  'list',
  'narrative',
]);

/** Valid consumer layer values for runtime validation. */
const VALID_CONSUMERS = new Set<DigContext['consumers'][number]>([
  'l3',
  'l3_5',
  'l3_75',
  'l4',
  'l5',
  'finding_maturity',
]);

/** Valid priority values for runtime validation. */
const VALID_PRIORITIES = new Set<UnderstandingQuestion['priority']>([
  'critical',
  'high',
  'medium',
  'low',
]);

// ─── Result type ───────────────────────────────────────────────────────

/**
 * Per-layer aggregation stats. Returned to the orchestrator for
 * telemetry / debugging. Stats are diagnostic; the actual mutation is
 * on the QueueManager passed in.
 */
export interface AggregationResult {
  /** Total emissions received (sum across layers). */
  totalEmissions: number;
  /** Emissions deduplicated against existing open queue questions (incremented iterationsSurvived). */
  deduplicatedAgainstExisting: number;
  /** Emissions deduplicated within this same aggregation run (only the first matching emission minted a question). */
  deduplicatedWithinRun: number;
  /** New UnderstandingQuestion entries minted and added to the queue. */
  addedToQueue: number;
  /** Per-layer count of emissions received. Useful for telemetry to confirm every layer that should have emitted did. */
  byLayer: Record<SpecificsNeedEmission['sourceLayer'], number>;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Aggregate specifics-need emissions from one iteration's analysis layers
 * into the question queue.
 *
 * Single-increment-per-existing-match contract: when N emissions in the
 * same call all match the same existing open queue question, that
 * existing question's `iterationsSurvived` is incremented exactly ONCE
 * (not N times). Multiple layers all flagging the same gap on iteration
 * N is signal that the gap is noticeable, but it's still ONE iteration
 * of survival — the auto-promotion threshold at iterationsSurvived ≥ 3
 * (mergeCuratedOutput's promotion path) would otherwise trip on the
 * first iteration if three layers all noticed the same gap, defeating
 * the threshold's purpose.
 *
 * @param emissions — flat array of all emissions from all layers this
 *   iteration. Order matters only for tie-breaking on within-run dedup
 *   (first emission wins; later identical emissions get folded into the
 *   first). The orchestrator concatenates per-layer arrays in a stable
 *   order before calling this function.
 * @param queueManager — the live QuestionQueueManager for the current
 *   essay. Mutated in place: existing matches get iterationsSurvived++,
 *   new emissions get addQuestion() with a freshly minted question.
 * @param iteration — the current iteration number, used to populate
 *   `UnderstandingQuestion.raisedDuringIteration` on minted entries.
 *
 * @throws Error with structured context (sourceLayer, emissionIndex,
 *   malformed field) on any schema-invalid emission. The aggregator
 *   halts on the first invalid emission; the orchestrator's catch path
 *   surfaces telemetry. We don't continue past a malformed emission
 *   because (a) the layer that produced it has a contract violation
 *   that needs upstream fix, and (b) silently dropping invalid entries
 *   would let the same bug recur across many iterations without an
 *   audit signal.
 *
 * @returns AggregationResult with stats for orchestrator telemetry.
 */
export function aggregateSpecificsNeedEmissions(
  emissions: ReadonlyArray<SpecificsNeedEmission>,
  queueManager: QuestionQueueManager,
  iteration: number,
): AggregationResult {
  const result: AggregationResult = {
    totalEmissions: emissions.length,
    deduplicatedAgainstExisting: 0,
    deduplicatedWithinRun: 0,
    addedToQueue: 0,
    byLayer: {
      l3_walk: 0,
      l3_5_analysis: 0,
      l3_75_phase_a: 0,
      l3_75_phase_b: 0,
      l4_north_star: 0,
      finding_maturity: 0,
    },
  };

  // Snapshot of existing open analysis-gap questions BEFORE we start
  // minting new ones. We check against this snapshot so a question
  // minted earlier in this run doesn't dedup-match a later emission
  // (those are caught by the within-run dedup path instead — and
  // tracked with a different stat field for diagnostic clarity).
  const existingOpen = queueManager.getOpenAnalysisGapQuestions();
  const existingMatchedIds = new Set<string>();

  // Track within-run dedup: emissions already minted this run, keyed
  // by the same anchor+shape composite key, with their normalized
  // framingSeed token sets retained for similarity comparison.
  type WithinRunMint = {
    questionId: string;
    framingSeedTokens: Set<string>;
  };
  const withinRunByAnchorShape = new Map<string, WithinRunMint[]>();

  for (let i = 0; i < emissions.length; i++) {
    const emission = emissions[i];
    validateEmission(emission, i);

    result.byLayer[emission.sourceLayer]++;

    // ── Dedup pass 1: against existing open queue questions ────────
    const existingMatch = findMatchingExisting(emission, existingOpen);
    if (existingMatch !== undefined) {
      // Increment iterationsSurvived ONCE per existing question, even
      // if multiple emissions in this run match it. The Set tracks
      // already-incremented existing IDs.
      if (!existingMatchedIds.has(existingMatch.id)) {
        existingMatch.iterationsSurvived++;
        existingMatchedIds.add(existingMatch.id);
      }
      result.deduplicatedAgainstExisting++;
      continue;
    }

    // ── Dedup pass 2: against questions already minted this run ────
    const anchorShapeKey = buildAnchorShapeKey(emission);
    const withinRunBucket = withinRunByAnchorShape.get(anchorShapeKey) ?? [];
    const withinRunMatch = withinRunBucket.find(prior =>
      jaccardSimilarity(prior.framingSeedTokens, tokenize(emission.framingSeed)) >=
        FRAMING_SEED_SIMILARITY_THRESHOLD,
    );
    if (withinRunMatch !== undefined) {
      // The previously-minted question's iterationsSurvived was set to
      // 0 at minting (per addQuestion's pattern); we don't increment
      // again here — the question was just created this iteration.
      // The within-run dedup just discards the duplicate emission.
      result.deduplicatedWithinRun++;
      continue;
    }

    // ── Mint a new UnderstandingQuestion ────────────────────────────
    const minted = mintQuestion(emission, iteration, i);
    queueManager.addQuestion(minted);
    result.addedToQueue++;

    withinRunBucket.push({
      questionId: minted.id,
      framingSeedTokens: tokenize(emission.framingSeed),
    });
    withinRunByAnchorShape.set(anchorShapeKey, withinRunBucket);
  }

  return result;
}

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Validate a SpecificsNeedEmission's runtime shape. Throws on schema
 * violation with structured context (sourceLayer, emissionIndex,
 * malformed field).
 *
 * Required fields are required: presence + correct primitive type +
 * non-empty for required strings. Optional fields are checked only if
 * present. The closed enums (sourceLayer, expectedAnswerShape, consumers,
 * priority) are validated against the runtime sets defined above —
 * TypeScript catches at compile time, but JSON-deserialized data could
 * carry unknown enum values.
 */
function validateEmission(
  emission: SpecificsNeedEmission,
  emissionIndex: number,
): void {
  const layer = emission?.sourceLayer ?? '<missing>';
  const ctx = (field: string, detail: string): string =>
    `[specificsNeedAggregator] Malformed emission at index ${emissionIndex} ` +
    `from sourceLayer='${layer}': field '${field}' ${detail}.`;

  // sourceLayer
  if (!emission || typeof emission.sourceLayer !== 'string') {
    throw new Error(ctx('sourceLayer', 'is missing or not a string'));
  }
  if (!VALID_SOURCE_LAYERS.has(emission.sourceLayer)) {
    throw new Error(
      ctx(
        'sourceLayer',
        `'${emission.sourceLayer}' is not a valid SpecificsNeedSourceLayer ` +
          `(expected one of: ${[...VALID_SOURCE_LAYERS].join(', ')})`,
      ),
    );
  }

  // emittingTrigger (required, non-empty after trim)
  if (
    typeof emission.emittingTrigger !== 'string' ||
    emission.emittingTrigger.trim().length === 0
  ) {
    throw new Error(ctx('emittingTrigger', 'is missing, not a string, or empty/whitespace'));
  }

  // anchorParagraph (required, non-negative integer)
  if (
    typeof emission.anchorParagraph !== 'number' ||
    !Number.isInteger(emission.anchorParagraph) ||
    emission.anchorParagraph < 0
  ) {
    throw new Error(ctx('anchorParagraph', 'is missing, not an integer, or negative'));
  }

  // anchorSentence (optional, non-negative integer if present)
  if (emission.anchorSentence !== undefined) {
    if (
      typeof emission.anchorSentence !== 'number' ||
      !Number.isInteger(emission.anchorSentence) ||
      emission.anchorSentence < 0
    ) {
      throw new Error(ctx('anchorSentence', 'is present but not a non-negative integer'));
    }
  }

  // question (required, non-empty after trim)
  if (typeof emission.question !== 'string' || emission.question.trim().length === 0) {
    throw new Error(ctx('question', 'is missing, not a string, or empty/whitespace'));
  }

  // dimensions (required, non-empty array of non-empty strings)
  // Per L5_E2E_INTEGRITY_AUDIT.md §3.2: "Dimensions the question touches
  // (one or more of the holistic dimensions)." Empty array would mean
  // the layer doesn't know what dimension this gap concerns — the LLM
  // must commit to at least one routing tag.
  if (!Array.isArray(emission.dimensions) || emission.dimensions.length === 0) {
    throw new Error(ctx('dimensions', 'is missing, not an array, or empty'));
  }
  for (const dim of emission.dimensions) {
    if (typeof dim !== 'string' || dim.trim().length === 0) {
      throw new Error(
        ctx('dimensions', `contains a non-string or empty/whitespace element`),
      );
    }
  }

  // expectedInsight (required, non-empty after trim)
  if (
    typeof emission.expectedInsight !== 'string' ||
    emission.expectedInsight.trim().length === 0
  ) {
    throw new Error(ctx('expectedInsight', 'is missing, not a string, or empty/whitespace'));
  }

  // priority (required, valid enum)
  if (!VALID_PRIORITIES.has(emission.priority)) {
    throw new Error(
      ctx(
        'priority',
        `'${emission.priority}' is not a valid priority ` +
          `(expected one of: ${[...VALID_PRIORITIES].join(', ')})`,
      ),
    );
  }

  // whyAsked (required, non-empty after trim)
  if (typeof emission.whyAsked !== 'string' || emission.whyAsked.trim().length === 0) {
    throw new Error(ctx('whyAsked', 'is missing, not a string, or empty/whitespace'));
  }

  // expectedAnswerShape (required, valid enum)
  if (!VALID_ANSWER_SHAPES.has(emission.expectedAnswerShape)) {
    throw new Error(
      ctx(
        'expectedAnswerShape',
        `'${emission.expectedAnswerShape}' is not a valid expectedAnswerShape ` +
          `(expected one of: ${[...VALID_ANSWER_SHAPES].join(', ')})`,
      ),
    );
  }

  // consumers (required, non-empty array of valid enums)
  if (!Array.isArray(emission.consumers) || emission.consumers.length === 0) {
    throw new Error(ctx('consumers', 'is missing, not an array, or empty'));
  }
  for (const c of emission.consumers) {
    if (!VALID_CONSUMERS.has(c)) {
      throw new Error(
        ctx(
          'consumers',
          `contains '${c}' which is not a valid consumer layer ` +
            `(expected one of: ${[...VALID_CONSUMERS].join(', ')})`,
        ),
      );
    }
  }

  // populates (required, array of non-empty strings, can be empty array
  // — the field is documented as "free-form strings; documentation, not
  // enforced," per profileTypes.ts:5746-5748, so no entries is valid)
  if (!Array.isArray(emission.populates)) {
    throw new Error(ctx('populates', 'is missing or not an array'));
  }
  for (const p of emission.populates) {
    if (typeof p !== 'string' || p.trim().length === 0) {
      throw new Error(
        ctx('populates', `contains a non-string or empty/whitespace element`),
      );
    }
  }

  // framingSeed (required, non-empty after trim — whitespace-only seeds
  // tokenize to an empty Set, which collapses Jaccard similarity to 0
  // and breaks the dedup contract silently)
  if (typeof emission.framingSeed !== 'string' || emission.framingSeed.trim().length === 0) {
    throw new Error(ctx('framingSeed', 'is missing, not a string, or empty/whitespace'));
  }
}

/**
 * Find an existing open analysis-gap question that matches this emission
 * by the dedup contract: same anchorParagraph + expectedAnswerShape +
 * framingSeed Jaccard similarity ≥ threshold.
 *
 * Returns the first matching question (mutation target for
 * iterationsSurvived++) or undefined if no match.
 */
function findMatchingExisting(
  emission: SpecificsNeedEmission,
  existingOpen: ReadonlyArray<UnderstandingQuestion>,
): UnderstandingQuestion | undefined {
  const newTokens = tokenize(emission.framingSeed);
  for (const existing of existingOpen) {
    if (existing.dig === undefined) continue; // can't match without a DigContext to compare
    if (existing.dig.expectedAnswerShape !== emission.expectedAnswerShape) continue;
    // Anchor: existing question's anchor lives on the dig.populates or
    // implicitly on the question's structural location. Phase 2's
    // approach: persist the anchorParagraph on the framingSeed prefix
    // (the layers emit framingSeeds that reference the paragraph), and
    // compare anchor via DigContext's framingSeed text — but the most
    // reliable anchor signal is the framingSeed similarity itself
    // combined with the answer-shape gate. We check both.
    //
    // Why we don't store anchorParagraph directly on DigContext: the
    // `populates` field already carries field paths that include
    // location info ('groundTruthFacts.byLocation', 'finding.evidence');
    // adding a separate anchorParagraph field would duplicate the
    // routing surface. Dedup uses the framingSeed (which is text-rich
    // and includes the paragraph reference the LLM emitted) plus the
    // answer-shape gate, which together produce a robust dedup key
    // without expanding DigContext's persisted shape.
    const existingTokens = tokenize(existing.dig.framingSeed);
    const similarity = jaccardSimilarity(newTokens, existingTokens);
    if (similarity >= FRAMING_SEED_SIMILARITY_THRESHOLD) {
      return existing;
    }
  }
  return undefined;
}

/**
 * Build a composite dedup key from anchorParagraph + expectedAnswerShape
 * for the within-run dedup map. Two emissions sharing this key are
 * candidates for similarity comparison; emissions with different keys
 * cannot dedup-match each other.
 */
function buildAnchorShapeKey(emission: SpecificsNeedEmission): string {
  return `${emission.anchorParagraph}::${emission.expectedAnswerShape}`;
}

/**
 * Mint a new UnderstandingQuestion from an emission. Sets the dig
 * sub-object's required fields from the emission's fields; leaves the
 * surfacing-time fields (askedAt, conversatorMessageId, studentAnswerRaw,
 * structuredAnswer, extractionPending) absent — they're populated by
 * the QueueManager's transition methods when the Conversator (Phase 3)
 * surfaces and resolves the question.
 *
 * The minted question's ID is derived from sourceLayer + iteration +
 * emissionIndex for deterministic test-ability and for telemetry
 * traceability back to the emitting layer.
 */
function mintQuestion(
  emission: SpecificsNeedEmission,
  iteration: number,
  emissionIndex: number,
): UnderstandingQuestion {
  const id = `SNQ-${emission.sourceLayer}-iter${iteration}-${emissionIndex}`;
  const dig: DigContext = {
    whyAsked: emission.whyAsked,
    expectedAnswerShape: emission.expectedAnswerShape,
    consumers: emission.consumers,
    populates: emission.populates,
    framingSeed: emission.framingSeed,
    // [round-1 audit HIGH-1 closure 2026-05-01] Persist anchorSentence
    // when the emission carries one, rather than silently dropping the
    // signal. DigContext.anchorSentence is the durable home (added in
    // the same closure pass).
    ...(emission.anchorSentence !== undefined && { anchorSentence: emission.anchorSentence }),
  };

  return {
    id,
    question: emission.question,
    // [round-1 audit HIGH-2 closure 2026-05-01] Cast removed —
    // UnderstandingQuestion.dimensions is `string[]` (open routing tags,
    // per profileTypes.ts:4477-4478), not `HolisticDimension[]`. The
    // prior `as HolisticDimension[]` cast was a type-assertion lie that
    // would have papered over a bad emission carrying an unrecognized
    // dimension string. Symmetric runtime validation in validateEmission
    // already enforces non-string entries; if/when dimensions becomes a
    // closed taxonomy on perception, both surfaces tighten together.
    dimensions: emission.dimensions,
    expectedInsight: emission.expectedInsight,
    source: 'analysis_specifics_gap',
    status: 'open',
    priority: emission.priority,
    iterationsSurvived: 0,
    spawnedQuestions: [],
    raisedAt: new Date().toISOString(),
    raisedDuringIteration: iteration,
    anchorParagraph: emission.anchorParagraph,
    dig,
  };
}

// ─── Tokenization + Jaccard similarity ─────────────────────────────────

/**
 * Tokenize a framingSeed for similarity comparison.
 *
 * Approach: lowercase, split on non-letter-and-non-digit characters
 * (Unicode-aware via the `u` regex flag), drop tokens shorter than 3
 * characters (filters articles / prepositions that don't carry
 * semantic weight for similarity scoring), return as a Set for O(1)
 * intersection.
 *
 * Why the `u` flag and `\p{L}\p{N}`:
 * - Without `u`, `\W` treats accented characters and non-Latin scripts
 *   as non-word, mangling framingSeeds in non-English languages
 *   (e.g., "hôpital" would tokenize to ["pital"]).
 * - `\p{L}` matches any Unicode letter; `\p{N}` matches any Unicode
 *   number. Splitting on the negation preserves accented words and
 *   numeric tokens.
 *
 * Stop-word filter: not applied. The 3-character minimum implicitly
 * filters "a / an / the / of / in / on / to / is / it / by / as" while
 * preserving "you / are / for / not / but" which DO carry semantic
 * weight for question-framing similarity. A formal stop-word list
 * would be a closed taxonomy on perception and is avoided per Rule 3.
 *
 * Numeric tokens: paragraph-number references in framingSeeds (e.g.,
 * "paragraph 2") are intentionally NOT load-bearing for the dedup key
 * — the dedup pass already gates on `(anchorParagraph, expectedAnswerShape)`
 * before computing seed similarity, so a numeric token's presence or
 * absence in the seed doesn't drive false-merges across different
 * anchors. The 3-char minimum still filters single-digit tokens, which
 * is fine because the paragraph anchor is checked structurally upstream.
 */
export function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(t => t.length >= 3);
  return new Set(tokens);
}

/**
 * Jaccard similarity coefficient between two token sets.
 *   |A ∩ B| / |A ∪ B|
 *
 * Returns 0 for two empty sets (treated as no similarity rather than
 * undefined-on-divide-by-zero — empty framingSeeds wouldn't pass
 * validation anyway).
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
