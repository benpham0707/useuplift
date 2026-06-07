// ============================================================================
// REWRITE GENERATION — types for generateEssayLevelRewrites()
// ============================================================================
//
// This file defines the input/output contract for the essay-level rewrite
// generator. Implementation lands in a follow-on PR (build plan item 7);
// types are pure additive so they ship safely on their own and unblock
// downstream design work.
//
// The contract has three structured inputs:
//   1. gaps[]          — what to fix (sourced from L4 CoachingMap + L3.75 MEM)
//   2. styleProfile    — what to match (sourced from L3.75 voice + craft)
//   3. constraints     — what NOT to touch (sourced from L4 protectedStrengths + L3.5 high-eff)
//
// And produces three flavors of L5Annotation extension:
//   - L5GrowthAnnotation         action-mode, carries multi-draft rewrites
//   - L5GrowthFallbackAnnotation awareness-mode, emitted when drafts fail
//   - L5PreservationAnnotation   awareness-mode, preserves protected strengths
//   - L5ReframeAnnotation        consequence-mode, surfaces the transformative insight
//
// Decisions locked (see prior planning thread):
//   Q1: hybrid anchoring — pre-call MEM-candidate helper + LLM picks
//   Q2: deterministic parser for MEM gap strings (see parseMEMGap.ts)
//   Q3: word budget = max(tierMin, min(tierMax, currentParagraphWords * 0.5)) + essay-level ceiling
//   Q4: backend persistence via PriorRewriteDigest on EssayProfile
//   Q5: forward-compatible — rewriteExample mirrors draftVariants[0].text for back-compat
//   Q6a: unclassified accepted + telemetry
//   Q6b: drop violating draft; regenerate only when all variants violate
//   Q6c: zero-draft fallback = awareness-mode L5GrowthFallbackAnnotation
//
// Design doc: not yet written — author it alongside the implementation PR.

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import type {
  CoachingMap,
  EarningMechanismType,
  EssayProfile,
  MomentEarnednessMap,
  NorthStarScale,
  PriorRewriteDigest,
  SignatureMoveInstance,
  StructuralRole,
  ThroughLineMap,
  TonalQuality,
} from '../profileTypes';
import type { L5Annotation } from './deepAnnotationService';
import { parseMEMGap } from './parseMEMGap';
import { L5_GENERATIVE_DOOR_DIRECTIVE } from './l5RewriteDirectives';

const SONNET = 'claude-sonnet-4-5-20250929';
// 2026-05-30: raised 6000→9000. First real execution (the path had never run —
// orchestrator integration deferred, build item 9) truncated at 6000: only 3 of 5
// growth annotations emitted, preservationAnnotations[] + reframeAnnotation (emitted
// AFTER growth in the JSON) dropped entirely, jsonrepair-salvaged. The module's own
// design note anticipated ~8K output tokens for multi-draft variants, but the
// mentor-grade L5_GENERATIVE_DOOR_DIRECTIVE makes each gap's 3 drafts richer
// (~2.1K tokens/gap observed). 4 gaps + 4 preservation + reframe = 9,589 tokens, so
// a 5-gap essay needs ~11.5K. Budget 13000 to fit 5 gaps × 3 drafts + preservation +
// reframe with margin (6000→9000→11000 all truncated the trailing reframe).
const REWRITE_MAX_TOKENS = 13000;
// 2026-05-30: raised 90s→300s. 90s was never validated (path never ran) and timed
// out on every retry on first execution. An 11000-token Sonnet call generates for
// ~250s; 300s gives margin. Rises WITH the token ceiling (they move together).
const REWRITE_TIMEOUT_MS = 300_000;
const REWRITE_TEMPERATURE = 0.3;

// ────────────────────────────────────────────────────────────────────────────
// INPUT 1 — GAPS (what to fix)
// ────────────────────────────────────────────────────────────────────────────

/**
 * A single gap the rewriter must address. Built per CoachingMap priority +
 * enriched with MEM-derived candidate anchors (Q1 hybrid strategy).
 */
export interface RewriteGap {
  /** Stable ID. When the gap comes from a CoachingMap priority, this is the
   *  priority's first `consolidatedFrom` candidate ID; otherwise it is a
   *  synthetic ID like `gap_<paragraphIndex>_<sequence>`. */
  id: string;

  /** Anchor location for the gap. Sentence/spanText are picked by the LLM
   *  from `candidateAnchors[]` (Q1 hybrid). Defaults: paragraph-top with
   *  null sentence/spanText when no candidate matches. */
  anchorLocation: {
    paragraph: number;
    sentence: number | null;
    spanText: string | null;
  };

  /** MEM moments whose paragraph index overlaps this gap's target paragraphs.
   *  The LLM picks one (or none) when filling `anchorLocation`. Pre-call helper
   *  populates this from `EssayProfile.momentEarnednessMap.moments[]`. */
  candidateAnchors: Array<{
    paragraph: number;
    sentence: number;
    source: 'mem_moment';
    momentDescription: string;
  }>;

  /** Which earning mechanism is missing. `'unclassified'` when the MEM gap
   *  string couldn't be parsed (Q6a fallback) OR when the gap was constructed
   *  from a CoachingMap priority without a matching MEM moment. */
  missingMechanism: EarningMechanismType | 'unclassified';

  /** What this gap should provide — the specific work the missing passage does.
   *  Sourced from the MEM gap description when available; falls back to the
   *  CoachingMap priority's `target.description`. */
  whatItShouldProvide: string;

  /** From CoachingMap.priorities[].architecturalReason. */
  architecturalReason: string;

  /** From CoachingMap.priorities[].unlocksNext. */
  unlocksNext: string;

  /** From CoachingMap.priorities[].expectedImpact. */
  expectedImpact: 'transformative' | 'significant' | 'incremental';

  /** From CoachingMap.priorities[].consolidatedFrom — the L3/L3.5/L3.75
   *  candidate IDs that consolidated into this gap. */
  consolidatedFrom: string[];

  /** Word budget for the rewrite (Q3 length-aware + tier-capped). All four
   *  numbers are required so the rewriter can enforce both per-paragraph and
   *  essay-level constraints in the same prompt. */
  wordBudget: {
    paragraphCurrentWords: number;
    essayCurrentWords: number;
    essayMaxWords: number;
    targetDelta: { min: number; max: number };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// INPUT 2 — STYLE PROFILE (what to match)
// ────────────────────────────────────────────────────────────────────────────

/**
 * The writer's voice fingerprint, distilled from L3.75 holistic synthesis.
 * Every draft the rewriter emits must echo at least one element from this
 * profile (enforced by the prompt's self-check + post-call validator).
 */
export interface StyleProfile {
  /** From VoiceIdentity.primaryRegister ?? VoiceIdentity.register. */
  registerBaseline: string;

  /** From VoiceIdentity.distinctivePatterns (verbatim list). Drafts must use
   *  at least one of these. */
  distinctivePatterns: string[];

  /** From VoiceIdentity.voiceMarkers — positive tics to protect. */
  voiceMarkers: string[];

  /** From VoiceIdentity.voiceWeaknesses — negative tics to avoid amplifying. */
  voiceWeaknesses: string[];

  /** From VoiceMap.vocabularyFingerprint.domains. Drafts must draw from at
   *  least one domain. */
  vocabularyDomains: Array<{
    domain: string;
    exampleWords: string[];
  }>;

  /** From VoiceMap.sentenceRhythm.baseline. Drafts' sentence-length avg must
   *  be within ±20% of this. */
  sentenceRhythmBaseline: string;

  /** From VoiceMap.tonalDisposition.dominantQualities. */
  tonalQualities: TonalQuality[];

  /** From CharacterRevelation.intellectualFingerprint — how this person thinks. */
  intellectualFingerprint: string;

  /** From CraftAssessment.imageSystem — the essay's metaphor system. Drafts
   *  must extend it, not abandon it. */
  imageSystem: string;

  /** From CraftAssessment.signatureMove — the ONE defining technique. Null
   *  when the essay distributes craft rather than concentrating it. */
  signatureMove: {
    oneSentenceName: string;
    readerEffect: string;
    whyItIsTheirs: string;
  } | null;
}

// ────────────────────────────────────────────────────────────────────────────
// INPUT 3 — PRESERVATION CONTRACT (what NOT to touch)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Spans, register, and effectiveness anchors the rewriter must honor.
 * Violations of `preserveSpans` trigger the Q6b drop-or-regenerate path.
 */
export interface PreservationContract {
  /** From CoachingMap.protectedStrengths — spans that MUST survive untouched. */
  preserveSpans: Array<{
    description: string;
    locations: Array<{ paragraph: number; sentence?: number }>;
    whyProtect: string;
  }>;

  /** From CraftAssessment.signatureMove.instances. */
  signatureMoveInstances: SignatureMoveInstance[];

  /** From EmotionalTopography.authenticityAssessment, passed verbatim.
   *  The rewriter reads this as the constraint on emotional register —
   *  e.g., "preserve restraint, no melodrama on trauma." */
  emotionalRegisterConstraint: string;

  /** Paragraphs with L3.5 effectiveness >= 80 — preservation zones whose
   *  rhythms are templates the rewriter echoes when filling adjacent gaps. */
  highEffectivenessParagraphs: Array<{
    paragraph: number;
    effectiveness: number;
    why: string;
  }>;
}

// ────────────────────────────────────────────────────────────────────────────
// INPUT 4 — ESSAY CONTEXT (for grounding)
// ────────────────────────────────────────────────────────────────────────────

/**
 * The essay text plus the architectural metadata the rewriter needs to
 * preserve the structural arc when drafting.
 */
export interface RewriteEssayContext {
  essayText: string;

  paragraphs: Array<{
    index: number;
    text: string;
    structuralRole: string;
    effectiveness: number;
    verdict: string;
  }>;

  /** From EssayNorthStar.throughLineMap. Nullable for supplements. */
  throughLineMap: ThroughLineMap | null;

  /** From CoachingMap.transformativeInsight. Drives the reframe annotation. */
  transformativeInsight: {
    insight: string;
    whyThisTransforms: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// METHOD SIGNATURE
// ────────────────────────────────────────────────────────────────────────────

export interface GenerateEssayLevelRewritesInput {
  gaps: RewriteGap[];
  styleProfile: StyleProfile;
  constraints: PreservationContract;
  context: RewriteEssayContext;

  /** Prior drafts from the last L5 run (Q4). Read from
   *  `EssayProfile.priorRewriteDigest`. Undefined on first-ever analysis. */
  priorDrafts?: PriorRewriteDigest[];
}

export interface GenerateEssayLevelRewritesOutput {
  /** One per gap. Mix of L5GrowthAnnotation (drafts emitted) and
   *  L5GrowthFallbackAnnotation (zero drafts after retry — Q6c fallback). */
  growthAnnotations: Array<L5GrowthAnnotation | L5GrowthFallbackAnnotation>;

  /** One per CoachingMap.protectedStrengths entry. */
  preservationAnnotations: L5PreservationAnnotation[];

  /** Single emission. Carries CoachingMap.transformativeInsight. Null when
   *  the insight is absent (rare; signals upstream failure). */
  reframeAnnotation: L5ReframeAnnotation | null;

  cost: number;
  voiceCheckResults: VoiceCheckResult[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// OUTPUT — REWRITE DRAFT (the heart of the contract)
// ────────────────────────────────────────────────────────────────────────────

/**
 * A single rewrite proposal. Each growth annotation carries 2-3 drafts at
 * different intensity levels so the student picks the door to walk through.
 */
export interface RewriteDraft {
  /** The actual proposed text — drafted in the student's voice. */
  text: string;

  /** Intensity level:
   *   - 'minimal': one bridging sentence
   *   - 'scene':   2-4 sentence scene replacing or extending
   *   - 'insight': philosophical or reflective turn, no new scene */
  intensityLevel: 'minimal' | 'scene' | 'insight';

  /** Word count delta from current state (positive = additive). Bounded by
   *  the gap's wordBudget.targetDelta (Q3). */
  wordDelta: number;

  /** What this draft preserves from the writer's voice — explicit citations
   *  of styleProfile fields used. Surfaced as a pedagogical accordion below
   *  the draft on the RewriteCard (Q5 UX-contract amendment). */
  voicePreservationNotes: string;

  /** Which gap mechanism this draft addresses (echoes RewriteGap.missingMechanism). */
  addressesGapMechanism: EarningMechanismType | 'unclassified';

  /** The anti-pattern — what a generic / wrong version would look like, and
   *  why it fails. Shows the student the line between distinctive and cliché. */
  antiPattern: {
    text: string;
    whyItFails: string;
  };

  /** Suggested cut to make word-budget room when this draft is additive AND
   *  the essay's total would exceed essayMaxWords. Null when neutral/negative
   *  delta or when no cut is needed. */
  wordEconomyCut: {
    location: { paragraph: number; sentence: number };
    quote: string;
    wordsRemoved: number;
    reason: string;
  } | null;

  /** Self-check results — the LLM's own verification that this draft meets
   *  style constraints. Used by the post-call validator (Q6b path). */
  voiceCheck: {
    distinctivePatternsUsed: string[];
    vocabularyDomainsUsed: string[];
    sentenceLengthAvg: number;
    selfReportedPass: boolean;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// OUTPUT — L5 ANNOTATION EXTENSIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * A growth annotation carrying 2-3 rewrite drafts. Emitted when the rewriter
 * successfully produced at least one valid draft for the gap.
 */
export interface L5GrowthAnnotation extends L5Annotation {
  type: 'growth';
  teachingMode: 'action';

  /** The drafts the student can pick between. Q6b validator guarantees
   *  length >= 1 (otherwise an L5GrowthFallbackAnnotation is emitted instead). */
  draftVariants: RewriteDraft[];

  /** Q5 back-compat: mirrors draftVariants[0].text so any existing consumer
   *  of L5Annotation.rewriteExample continues to work without code changes. */
  rewriteExample: string;

  /** Which gap (RewriteGap.id) this annotation addresses. */
  addressesGapId: string;
}

/**
 * A growth annotation emitted when the rewriter could not produce any valid
 * draft for the gap (Q6c: zero drafts after retry). Still surfaces the gap
 * to the student in awareness mode so the issue isn't hidden — they just
 * don't get a draft for this one. The Coach (L6) becomes the route forward.
 */
export interface L5GrowthFallbackAnnotation extends L5Annotation {
  type: 'growth';
  teachingMode: 'awareness';
  draftVariants: [];
  rewriteExample: null;
  addressesGapId: string;
  fallbackReason: 'zero_drafts_after_retry';
}

/**
 * A preservation annotation — surfaces a protected strength with an explicit
 * "do not weaken this, and here's what would weaken it" callout.
 */
export interface L5PreservationAnnotation extends L5Annotation {
  type: 'strength';
  teachingMode: 'awareness';
  rewriteExample: null;

  /** A real version of how this strength might be accidentally weakened on
   *  revision, explaining what the loss would be. */
  weakeningAntiPattern: string;

  /** The named craft technique that makes this work (e.g., "misdirection
   *  opening", "temporal compression", "specific naming"). */
  technique: string;
}

/**
 * The essay-level reframe annotation — surfaces the transformative insight
 * once per essay, framed as the interpretive lens that reshapes everything
 * else. Anchored at the essay level (no specific paragraph/sentence).
 */
export interface L5ReframeAnnotation extends L5Annotation {
  type: 'teaching';
  teachingMode: 'consequence';
  rewriteExample: null;
  location: { paragraphIndex: number; sentenceIndex: null; spanText: null };

  /** From CoachingMap.transformativeInsight.insight, verbatim. */
  insight: string;

  /** From CoachingMap.transformativeInsight.whyThisTransforms, verbatim. */
  whyThisTransforms: string;
}

// ────────────────────────────────────────────────────────────────────────────
// VOICE CHECK TELEMETRY
// ────────────────────────────────────────────────────────────────────────────

/**
 * Telemetry signal emitted per draft. Logged for calibration; not student-facing.
 * The deterministic post-call validator computes these and may override
 * `voiceCheck.selfReportedPass` on the parent RewriteDraft.
 */
export interface VoiceCheckResult {
  draftId: string;
  passes: {
    usedAtLeastOneDistinctivePattern: boolean;
    vocabularyOverlapPercent: number;
    sentenceLengthMatch: boolean;
    avoidedVoiceWeaknesses: boolean;
  };
  overallPass: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// HELPER — computeWordBudget (Q3 length-aware + tier-capped)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Tier-based word ranges for rewrite drafts. Higher impact = wider range.
 * Locked from the planning thread; centralized here so changing tier widths
 * happens in one place.
 */
const TIER_RANGES: Record<
  'transformative' | 'significant' | 'incremental',
  { min: number; max: number }
> = {
  transformative: { min: 30, max: 50 },
  significant: { min: 15, max: 30 },
  incremental: { min: 5, max: 15 },
};

/**
 * Pure function computing the `wordBudget` field on a RewriteGap.
 *
 * Q3 formula (locked):
 *   targetDelta.max = max(tierMin, min(tierMax, ⌊paragraphCurrentWords × 0.5⌋))
 *   targetDelta.min = tierMin
 *
 * The min-clamp ensures even short paragraphs allow at least the tier-min
 * delta (transformative gaps can't be addressed in fewer than ~30 words).
 * When the length cap drops below tier-min — i.e., the paragraph is too
 * short to absorb the bridge at 50% growth — min and max collapse to the
 * same value (tier-min); the rewriter is told in the prompt to consider a
 * new-paragraph split instead.
 *
 * The essay-level fields (`essayCurrentWords`, `essayMaxWords`) pass
 * through unchanged. Total-essay budget enforcement happens at the
 * rewriter (via `wordEconomyCut` proposals) + post-call validator, not
 * here — this function reports what the gap *needs*, not what the essay
 * *can absorb*.
 *
 * Math.floor (not round/ceil) on the length cap is the conservative
 * choice: never exceeds 50% of paragraph length.
 */
export function computeWordBudget(
  impact: 'transformative' | 'significant' | 'incremental',
  paragraphCurrentWords: number,
  essayCurrentWords: number,
  essayMaxWords: number,
): {
  paragraphCurrentWords: number;
  essayCurrentWords: number;
  essayMaxWords: number;
  targetDelta: { min: number; max: number };
} {
  const tier = TIER_RANGES[impact];

  // Defensive: clamp paragraphCurrentWords to non-negative. Real callers
  // compute this from text.split(/\s+/).length so this should never fire,
  // but the math below would behave weirdly with negative input.
  const safeParagraphWords = Math.max(0, paragraphCurrentWords);

  const lengthCap = Math.floor(safeParagraphWords * 0.5);
  const max = Math.max(tier.min, Math.min(tier.max, lengthCap));
  const min = tier.min;

  return {
    paragraphCurrentWords: safeParagraphWords,
    essayCurrentWords,
    essayMaxWords,
    targetDelta: { min, max },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// HELPER — findCandidateAnchors (Q1 hybrid MEM lookup)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Pure function that, for one CoachingMap priority, finds MEM moments whose
 * paragraph index overlaps the priority's `target.paragraphs`. The result is
 * fed into the LLM rewrite call as the `candidateAnchors[]` field on the
 * corresponding RewriteGap; the LLM picks one (or none) when filling
 * `anchorLocation` (Q1 hybrid).
 *
 * Why this design: MomentEarnednessMap is the only upstream layer that
 * produces sentence-level location data alongside the architectural concept
 * of a "significant moment with gaps." The CoachingMap priority is
 * paragraph-level only. By piping MEM moments in the priority's target
 * paragraphs to the LLM as candidates, we get sentence-level anchoring
 * without needing a deterministic 1:1 matcher (which would be brittle when
 * priorities span multiple paragraphs with multiple moments).
 *
 * Does NOT filter on `moment.gaps[]` — a moment whose own gaps are different
 * from the priority's concern can still be a good anchor LOCATION. The LLM
 * makes the call with full context.
 *
 * Returns: array sorted by (paragraph, sentence) ascending — natural essay
 * reading order so the LLM processes candidates predictably.
 */
export function findCandidateAnchors(
  priority: CoachingMap['priorities'][number],
  memMap: MomentEarnednessMap,
): RewriteGap['candidateAnchors'] {
  // Set for O(1) lookup + tolerates duplicate entries in priority.target.paragraphs.
  const targetParagraphs = new Set(priority.target.paragraphs);
  if (targetParagraphs.size === 0) return [];
  if (memMap.moments.length === 0) return [];

  const candidates: RewriteGap['candidateAnchors'] = [];
  for (const moment of memMap.moments) {
    if (!targetParagraphs.has(moment.location.paragraph)) continue;
    candidates.push({
      paragraph: moment.location.paragraph,
      sentence: moment.location.sentence,
      source: 'mem_moment',
      momentDescription: moment.description,
    });
  }

  candidates.sort((a, b) => {
    if (a.paragraph !== b.paragraph) return a.paragraph - b.paragraph;
    return a.sentence - b.sentence;
  });

  return candidates;
}

// ────────────────────────────────────────────────────────────────────────────
// HELPER — assembleRewriteInputs (orchestrates items 1-4 + parser)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Essay-type word ceilings used to default `essayMaxWords` from
 * `northStar.activeScale` when the caller doesn't pass an override.
 *
 * Common App = 650 (the Common App essay word limit).
 * PIQ        = 350 (UC Personal Insight Question target).
 * Supplement = 250 (typical short supplement; some are 100, some 400 — caller
 *                   should override when the actual limit is known).
 */
const SCALE_TO_MAX_WORDS: Record<NorthStarScale, number> = {
  personal_statement: 650,
  piq: 350,
  supplement: 250,
};

/** Word count of a string. Splits on whitespace; filters empty tokens. */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Look up a paragraph's structural role from northStar.structuralRolesMap. */
function findStructuralRoleName(
  paragraphIndex: number,
  roles: readonly StructuralRole[],
): string {
  const role = roles.find((r) => r.paragraphs.includes(paragraphIndex));
  return role?.role ?? 'unassigned';
}

/**
 * Pure assembler: walks an EssayProfile and produces the structured input
 * the rewrite generator needs. Calls `parseMEMGap`, `findCandidateAnchors`,
 * `computeWordBudget` per priority. Defensive on optional/legacy fields.
 *
 * Prerequisites (must be present on the profile):
 *   - `scoreMatrix.coachingMap` (L4 must have completed)
 *   - `paragraphs` (non-empty)
 *   - `voiceIdentity`, `voiceMap`, `emotionalTopography`, `momentEarnednessMap`,
 *     `characterRevelation`, `craftAssessment`, `northStar` (L3.75 + L4 outputs)
 *
 * Throws when prerequisites are missing — a calling orchestrator is expected
 * to gate the call on L4 completion.
 *
 * Per-priority gap construction:
 *   - id = priority.consolidatedFrom[0] ?? synthetic `gap_p{idx}_{position}`
 *   - missingMechanism: parsed from the first MEM moment whose paragraph
 *     overlaps priority.target.paragraphs and has a non-empty gaps[]
 *     (Q2 + Q6a). Falls back to 'unclassified' when no match.
 *   - whatItShouldProvide: parsed MEM gap description when matched;
 *     otherwise priority.target.description.
 *   - wordBudget: tier-and-length-capped per Q3; paragraphCurrentWords
 *     computed from the FIRST paragraph in target.paragraphs (or paragraph 0
 *     when target.paragraphs is empty).
 *   - candidateAnchors: from findCandidateAnchors (Q1 hybrid).
 *
 * Style profile: pulls from voiceIdentity, voiceMap, characterRevelation,
 * craftAssessment. Optional fields (voiceMarkers, voiceWeaknesses, domains)
 * default to empty arrays on legacy profiles.
 *
 * Preservation contract: pulls from coachingMap.protectedStrengths,
 * craftAssessment.signatureMove?.instances, emotionalTopography
 * .authenticityAssessment (passed verbatim per Q-design), and L3.5
 * effectiveness>=80 paragraphs.
 *
 * Essay context: includes structuralRole per paragraph, throughLineMap,
 * and the transformative insight from the coachingMap.
 *
 * Prior drafts (Q4): passes through `profile.priorRewriteDigest` if present.
 */
export function assembleRewriteInputs(
  profile: Readonly<EssayProfile>,
  options?: { essayMaxWords?: number },
): GenerateEssayLevelRewritesInput {
  const coachingMap = profile.scoreMatrix?.coachingMap;
  if (!coachingMap) {
    throw new Error(
      '[assembleRewriteInputs] EssayProfile.scoreMatrix.coachingMap is required (run L4 first)',
    );
  }
  if (profile.paragraphs.length === 0) {
    throw new Error('[assembleRewriteInputs] EssayProfile.paragraphs is empty');
  }

  // Essay-level word counts.
  const essayText = profile.paragraphs.map((p) => p.text).join('\n\n');
  const essayCurrentWords = countWords(essayText);
  const essayMaxWords =
    options?.essayMaxWords ?? SCALE_TO_MAX_WORDS[profile.northStar.activeScale];

  // ── Build gaps[] from coachingMap.priorities ────────────────────────────
  const gaps: RewriteGap[] = coachingMap.priorities.map((priority, idx) => {
    const candidateAnchors = findCandidateAnchors(
      priority,
      profile.momentEarnednessMap,
    );

    // Match a MEM moment with a non-empty gap to derive missingMechanism +
    // whatItShouldProvide. First-match wins; falls back to unclassified.
    let missingMechanism: RewriteGap['missingMechanism'] = 'unclassified';
    let whatItShouldProvide: string = priority.target.description;
    for (const moment of profile.momentEarnednessMap.moments) {
      if (!priority.target.paragraphs.includes(moment.location.paragraph)) continue;
      if (moment.gaps.length === 0) continue;
      const parsed = parseMEMGap(moment.gaps[0]);
      missingMechanism = parsed.mechanism;
      if (parsed.parsed && parsed.description.length > 0) {
        whatItShouldProvide = parsed.description;
      }
      break;
    }

    // Word budget uses the first paragraph in target.paragraphs (or 0).
    const anchorParagraphIdx =
      priority.target.paragraphs.length > 0 ? priority.target.paragraphs[0] : 0;
    const anchorParagraph = profile.paragraphs[anchorParagraphIdx];
    const paragraphCurrentWords = anchorParagraph
      ? countWords(anchorParagraph.text)
      : 0;
    const wordBudget = computeWordBudget(
      priority.expectedImpact,
      paragraphCurrentWords,
      essayCurrentWords,
      essayMaxWords,
    );

    // Gap id must be UNIQUE per priority. consolidatedFrom[0] alone is NOT unique:
    // two priorities can cite the same lead candidate (observed on crochet — two
    // P5/objects priorities both led with CAND_L3_75_P0_9784b8e9), which collapses
    // them to one gap id and makes the LLM address only one, silently dropping the
    // other priority's rewrites. Append the priority index to guarantee uniqueness
    // while keeping the candidate id legible. priorDrafts.gapId matching is a soft
    // text hint (not a hard join), so the format change degrades gracefully.
    const id =
      priority.consolidatedFrom && priority.consolidatedFrom.length > 0
        ? `${priority.consolidatedFrom[0]}_p${idx}`
        : `gap_p${anchorParagraphIdx}_${idx}`;

    return {
      id,
      anchorLocation: {
        paragraph: anchorParagraphIdx,
        sentence: null,
        spanText: null,
      },
      candidateAnchors,
      missingMechanism,
      whatItShouldProvide,
      architecturalReason: priority.architecturalReason,
      unlocksNext: priority.unlocksNext,
      expectedImpact: priority.expectedImpact,
      consolidatedFrom: priority.consolidatedFrom ?? [],
      wordBudget,
    };
  });

  // ── Build styleProfile ─────────────────────────────────────────────────
  const vi = profile.voiceIdentity;
  const vm = profile.voiceMap;
  const cr = profile.characterRevelation;
  const ca = profile.craftAssessment;

  const styleProfile: StyleProfile = {
    registerBaseline: vi.primaryRegister ?? vi.register,
    distinctivePatterns: vi.distinctivePatterns ?? [],
    voiceMarkers: vi.voiceMarkers ?? [],
    voiceWeaknesses: vi.voiceWeaknesses ?? [],
    vocabularyDomains:
      vm.vocabularyFingerprint.domains?.map((d) => ({
        domain: d.domain,
        exampleWords: d.exampleWords,
      })) ?? [],
    sentenceRhythmBaseline: vm.sentenceRhythm.baseline,
    tonalQualities: vm.tonalDisposition.dominantQualities ?? [],
    intellectualFingerprint: cr.intellectualFingerprint,
    imageSystem: ca.imageSystem,
    signatureMove: ca.signatureMove
      ? {
          oneSentenceName: ca.signatureMove.oneSentenceName,
          readerEffect: ca.signatureMove.readerEffect,
          whyItIsTheirs: ca.signatureMove.whyItIsTheirs,
        }
      : null,
  };

  // ── Build constraints ──────────────────────────────────────────────────
  const constraints: PreservationContract = {
    preserveSpans: coachingMap.protectedStrengths.map((s) => ({
      description: s.description,
      locations: s.locations,
      whyProtect: s.whyProtect,
    })),
    signatureMoveInstances: ca.signatureMove?.instances ?? [],
    emotionalRegisterConstraint: profile.emotionalTopography.authenticityAssessment,
    highEffectivenessParagraphs: profile.paragraphs
      .filter((p) => p.analysis != null && p.analysis.effectiveness >= 80)
      .map((p) => ({
        paragraph: p.index,
        effectiveness: p.analysis!.effectiveness,
        why: p.analysis!.verdict,
      })),
  };

  // ── Build context ──────────────────────────────────────────────────────
  const context: RewriteEssayContext = {
    essayText,
    paragraphs: profile.paragraphs.map((p) => ({
      index: p.index,
      text: p.text,
      structuralRole: findStructuralRoleName(
        p.index,
        profile.northStar.structuralRolesMap,
      ),
      effectiveness: p.analysis?.effectiveness ?? 50,
      verdict: p.analysis?.verdict ?? '',
    })),
    throughLineMap: profile.northStar.throughLineMap,
    transformativeInsight: {
      insight: coachingMap.transformativeInsight.insight,
      whyThisTransforms: coachingMap.transformativeInsight.whyThisTransforms,
    },
  };

  return {
    gaps,
    styleProfile,
    constraints,
    context,
    priorDrafts: profile.priorRewriteDigest,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS — system + cached prefix + per-call tail
// ────────────────────────────────────────────────────────────────────────────
//
// Three pure-string functions that produce the LLM prompt for the rewrite
// generator. Cache structure:
//   - System prompt (cached via cacheSystemPrompt: true): the role + 10 rules
//     + JSON skeleton + self-check
//   - User block 1 (cached via cacheBreakpoint: true): essay text + style
//     profile + preservation contract + essay context + transformative
//     insight + through-line map
//   - User block 2 (NOT cached): gaps + priorDrafts + emit instruction
//
// All three are pure: same input → byte-identical output. This is required
// for the Anthropic prefix cache to fire on multi-essay runs (same essay
// scale + essayType produces the same system prompt).

/**
 * The system prompt — encodes the role + 10 draft-generation rules + the
 * JSON skeleton. Byte-identical across calls within one essay run.
 *
 * Currently scale/essayType arguments are not used in the prompt body — the
 * prompt is universal across scales for v1. The arguments are accepted so
 * future scale-specific guidance (e.g., supplement-specific compression
 * instructions) can land without changing the signature.
 */
export function buildRewriteSystemPrompt(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _scale: NorthStarScale,
): string {
  return `You are an admissions-essay revision coach drafting rewrites in a specific writer's voice.

You will receive (1) a STYLE PROFILE — the writer's distinctive patterns, vocabulary domains, sentence rhythm, intellectual fingerprint, signature move, and image system; (2) a PRESERVATION CONTRACT — the spans you must not touch and the emotional register you must hold; (3) one or more GAPS — specific architectural weaknesses with the missing mechanism named; (4) the essay text.

For each gap, produce EXACTLY 3 draft variants at different intensity levels:
  - "minimal": one bridging sentence
  - "scene":   2-4 sentence scene replacing or extending
  - "insight": philosophical/reflective turn, no new scene

For each draft, you MUST also produce:
  - voicePreservationNotes: STUDENT-FACING (rendered as "What this keeps of your voice"). COMPACT — ≤2 sentences, ≤40 words. Name, in words the student recognizes, which of THEIR OWN moves you kept — quote their actual phrasing, not the system's field names. SAY: "keeps your 'Don't get the wrong idea, now' aside and the cornflower-blue palette from Agnes." DO NOT SAY: "uses distinctivePatterns[0] and vocabularyDomains[2]." Never expose styleProfile field names to the student. Pick the 1-2 most telling moves; don't catalogue every one.
  - antiPattern: a generic version + why it fails (whyItFails)
  - wordEconomyCut: suggestion if the draft is additive AND the essay would exceed essayMaxWords; null otherwise
  - voiceCheck: which distinctive patterns + vocabulary domains you used

DRAFT GENERATION RULES (the bar):

  1. EVERY draft must use AT LEAST ONE of the writer's distinctive patterns listed in styleProfile.distinctivePatterns. Cite which one in voicePreservationNotes. If you cannot use any, regenerate before emitting.

  2. EVERY draft must draw from AT LEAST ONE of the writer's vocabulary domains. Cite which in voicePreservationNotes.

  3. NO draft may trigger any pattern in styleProfile.voiceWeaknesses.

  4. NO draft may copy any text in constraints.preserveSpans verbatim.

  5. The DRAFT'S SENTENCE LENGTH average must be within ±20% of the essay's baseline average (described in styleProfile.sentenceRhythmBaseline). The writer's existing rhythm is the template.

  6. The IMAGE SYSTEM continues — if the essay uses a magical/textile/biological/other metaphor system named in styleProfile.imageSystem, your draft EXTENDS it, never abandons it for a new system.

  7. EMOTIONAL CALIBRATION — preserve the constraint in constraints.emotionalRegisterConstraint. If the essay shows restraint on trauma, your draft preserves restraint. Do not melodramatize. Do not amplify.

  8. ECHO PROTECTED STRENGTHS — when your draft is adjacent to a constraints.highEffectivenessParagraphs entry, your draft's rhythm and voice should ECHO that paragraph's working pattern. The protected-strength paragraph is your voice anchor.

  9. ANTI-PATTERN HONESTY — your antiPattern.text field must be a real version someone might write, not a strawman. Test: a competent but generic college essayist would write something like the antiPattern. Explain in antiPattern.whyItFails what specifically would be lost or generic.

  10. NO META-LANGUAGE — drafts contain prose only. Do not write "this sentence bridges..." or "here I show..." inside the draft.text. Meta-commentary lives in voicePreservationNotes, not in text.

${L5_GENERATIVE_DOOR_DIRECTIVE}

  HOW THE DOOR MAPS TO THE THREE INTENSITY LEVELS:
  - "minimal" (one bridging sentence) and the paste-able draft.text everywhere: stays factually true to what the student wrote — this is the anti-fabrication side. Voice-matched, concrete, but no invented facts.
  - "scene" and "insight" drafts: these are where the door opens widest. The scene may render vivid POSSIBILITY (introduced as invitation — "picture the afternoon it finally worked: maybe the hook stops snagging, maybe…") so the student sees what the moment could hold and wants to write their real version. Still no asserted invented fact — the vividness is offered, not imposed.

WORD BUDGET:
  - Each gap carries a wordBudget with paragraphCurrentWords, essayCurrentWords, essayMaxWords, and targetDelta {min, max}.
  - Your draft.wordDelta MUST satisfy targetDelta.min <= wordDelta <= targetDelta.max.
  - If wordDelta is positive AND essayCurrentWords + wordDelta > essayMaxWords, you MUST propose a wordEconomyCut in the same draft.
  - If the paragraph is too short to absorb the bridge (paragraphCurrentWords × 0.5 < targetDelta.min), consider a new-paragraph split via an "insight" intensity draft.

ANCHOR LOCATION:
  - Each gap carries candidateAnchors[] (MEM moments whose paragraph overlaps the gap's target). Pick the most useful candidate and write its paragraph + sentence into the annotation's anchorLocation. Set spanText to the exact text the gutter pill should underline (or null when the anchor is between sentences / at paragraph top).
  - When candidateAnchors is empty, anchor at gap.anchorLocation.paragraph with sentence=null.

PRIOR DRAFTS (re-analysis only):
  - When input.priorDrafts is non-empty, treat each entry as either a "tried and applied" draft (wasApplied=true) or a "shown but rejected" draft (wasApplied=false).
  - Do NOT re-emit any draft text byte-identical to a priorDrafts[i].draftText.
  - For applied drafts: build on the student's chosen direction; don't re-suggest the same approach.
  - For rejected drafts: try a different approach for that gap.

PRESERVATION ANNOTATIONS (for each entry in constraints.preserveSpans):
  - Emit one L5PreservationAnnotation per protected strength.
  - type='strength', teachingMode='awareness', rewriteExample=null.
  - weakeningAntiPattern: a real version someone might "improve" this into — explain what the loss would be.
  - technique: the named craft technique (e.g., "misdirection opening", "temporal compression", "specific naming", "cyclical structure").

REFRAME ANNOTATION (one per essay):
  - Emit one L5ReframeAnnotation surfacing context.transformativeInsight.
  - type='teaching', teachingMode='consequence', rewriteExample=null.
  - location: { paragraphIndex: 0, sentenceIndex: null, spanText: null } (essay-level anchor).
  - insight + whyThisTransforms: verbatim from context.transformativeInsight.

FALLBACK (when you cannot produce 3 valid drafts for a gap):
  - If you can produce ANY valid draft, emit the growth annotation with whatever drafts you have (the post-call validator will keep what passes).
  - If you cannot produce a single valid draft, emit a fallback annotation:
      type='growth', teachingMode='awareness', draftVariants=[], rewriteExample=null,
      fallbackReason='zero_drafts_after_retry'.
    The student still sees the gap surfaced; the Coach (L6) becomes the route forward.

OUTPUT FORMAT — single JSON object matching this exact skeleton (no markdown, no code fences):

{
  "growthAnnotations": [
    {
      "id": "string",
      "addressesGapId": "string",
      "type": "growth",
      "teachingMode": "action" | "awareness",
      "content": "string (the teaching paragraph)",
      "teachingRationale": "string",
      "stakes": "string | null",
      "northStarConnection": "string",
      "anchorLocation": { "paragraphIndex": 0, "sentenceIndex": 1, "spanText": "string | null" },
      "priority": 1,
      "phase": "foundation" | "architecture" | "craft" | "polish" | "distinction",
      "confidence": 0.85,
      "draftVariants": [
        {
          "text": "string (the proposed text, no meta)",
          "intensityLevel": "minimal" | "scene" | "insight",
          "wordDelta": 30,
          "voicePreservationNotes": "string — student-facing; name their own moves in their words (quote their phrasing), NOT styleProfile field names",
          "addressesGapMechanism": "sensory_grounding" | "...",
          "antiPattern": { "text": "string", "whyItFails": "string" },
          "wordEconomyCut": null | { "location": { "paragraph": 0, "sentence": 0 }, "quote": "string", "wordsRemoved": 8, "reason": "string" },
          "voiceCheck": {
            "distinctivePatternsUsed": ["string"],
            "vocabularyDomainsUsed": ["string"],
            "sentenceLengthAvg": 14.5,
            "selfReportedPass": true
          }
        }
      ],
      "rewriteExample": "string (mirrors draftVariants[0].text)",
      "fallbackReason": null | "zero_drafts_after_retry"
    }
  ],
  "preservationAnnotations": [
    {
      "id": "string",
      "type": "strength",
      "teachingMode": "awareness",
      "content": "string",
      "teachingRationale": "string",
      "rewriteExample": null,
      "weakeningAntiPattern": "string",
      "technique": "string",
      "anchorLocation": { "paragraphIndex": 0, "sentenceIndex": 0, "spanText": "string | null" },
      "priority": 2,
      "phase": "craft",
      "confidence": 0.9
    }
  ],
  "reframeAnnotation": {
    "id": "string",
    "type": "teaching",
    "teachingMode": "consequence",
    "content": "string",
    "teachingRationale": "string",
    "rewriteExample": null,
    "location": { "paragraphIndex": 0, "sentenceIndex": null, "spanText": null },
    "insight": "string (verbatim from transformativeInsight.insight)",
    "whyThisTransforms": "string (verbatim from transformativeInsight.whyThisTransforms)",
    "priority": 1,
    "phase": "architecture",
    "confidence": 0.95
  }
}

SELF-CHECK BEFORE EMITTING:
  For each draft you produce, internally verify:
    (a) Does this use AT LEAST ONE pattern from styleProfile.distinctivePatterns?
    (b) Does this draw from AT LEAST ONE styleProfile.vocabularyDomains?
    (c) Is the sentence-length average plausibly within ±20% of styleProfile.sentenceRhythmBaseline?
    (d) Does this AVOID every pattern in styleProfile.voiceWeaknesses?
    (e) Does this leave every constraints.preserveSpans text untouched?
    (f) Does wordDelta satisfy targetDelta?
  If ANY answer is no, regenerate that draft before emitting. Record the patterns/domains used in voiceCheck.

Respond with the JSON object only. No prose, no markdown, no apologies. If you cannot meet the contract, emit fallback annotations with fallbackReason='zero_drafts_after_retry' rather than producing invalid output.`;
}

/**
 * The cached user-prompt prefix — stable across calls within one essay run.
 * Carries everything the rewriter needs to GROUND drafts in the writer's
 * voice: full essay text, complete style profile, preservation contract,
 * essay context (paragraphs + roles), transformative insight, through-line.
 *
 * Goes into the FIRST userPromptBlocks entry with cacheBreakpoint: true.
 */
export function buildRewriteSharedPrefix(input: GenerateEssayLevelRewritesInput): string {
  const sm = input.styleProfile.signatureMove;
  const tlm = input.context.throughLineMap;
  const sections: string[] = [];

  sections.push('=== ESSAY TEXT ===');
  sections.push(input.context.essayText);

  sections.push('');
  sections.push('=== STYLE PROFILE ===');
  sections.push(`Register baseline: ${input.styleProfile.registerBaseline}`);
  sections.push(`Sentence rhythm baseline: ${input.styleProfile.sentenceRhythmBaseline}`);
  sections.push(`Intellectual fingerprint: ${input.styleProfile.intellectualFingerprint}`);
  sections.push(`Image system: ${input.styleProfile.imageSystem}`);
  sections.push(`Tonal qualities: ${input.styleProfile.tonalQualities.join(', ') || '(none)'}`);
  sections.push(`Distinctive patterns:`);
  for (const p of input.styleProfile.distinctivePatterns) sections.push(`  - ${p}`);
  sections.push(`Voice markers (POSITIVE — preserve):`);
  for (const m of input.styleProfile.voiceMarkers) sections.push(`  - ${m}`);
  sections.push(`Voice weaknesses (NEGATIVE — avoid):`);
  for (const w of input.styleProfile.voiceWeaknesses) sections.push(`  - ${w}`);
  sections.push(`Vocabulary domains:`);
  for (const d of input.styleProfile.vocabularyDomains) {
    sections.push(`  - "${d.domain}": ${d.exampleWords.join(', ')}`);
  }
  if (sm) {
    sections.push(`Signature move: ${sm.oneSentenceName}`);
    sections.push(`  Why it is theirs: ${sm.whyItIsTheirs}`);
    sections.push(`  Reader effect: ${sm.readerEffect}`);
  } else {
    sections.push('Signature move: (none — essay distributes craft rather than concentrating it)');
  }

  sections.push('');
  sections.push('=== PRESERVATION CONTRACT ===');
  sections.push(`Emotional register constraint: ${input.constraints.emotionalRegisterConstraint}`);
  sections.push(`Preserve spans (DO NOT TOUCH verbatim):`);
  for (const s of input.constraints.preserveSpans) {
    const locs = s.locations
      .map((l) => `P${l.paragraph}${l.sentence !== undefined ? `S${l.sentence}` : ''}`)
      .join(', ');
    sections.push(`  - [${locs}] ${s.description}`);
    sections.push(`     Why protect: ${s.whyProtect}`);
  }
  sections.push(`High-effectiveness paragraphs (ECHO their rhythm when adjacent):`);
  for (const p of input.constraints.highEffectivenessParagraphs) {
    sections.push(`  - P${p.paragraph} (effectiveness=${p.effectiveness}): ${p.why}`);
  }

  sections.push('');
  sections.push('=== ESSAY CONTEXT ===');
  sections.push(`Paragraph map:`);
  for (const p of input.context.paragraphs) {
    sections.push(
      `  - P${p.index}: role="${p.structuralRole}", effectiveness=${p.effectiveness}`,
    );
    sections.push(`     Verdict: ${p.verdict}`);
  }
  if (tlm) {
    sections.push(`Through-line: ${tlm.centralElement} (${tlm.elementType})`);
    sections.push(`  Transformation: ${tlm.transformation}`);
  }
  sections.push(`Transformative insight: ${input.context.transformativeInsight.insight}`);
  sections.push(`  Why this transforms: ${input.context.transformativeInsight.whyThisTransforms}`);

  return sections.join('\n');
}

/**
 * The per-call user-prompt tail — NOT cached. Carries the gaps to address +
 * any prior drafts from a re-analysis run.
 */
export function buildRewriteUserTail(input: GenerateEssayLevelRewritesInput): string {
  const sections: string[] = [];

  sections.push('=== GAPS TO ADDRESS ===');
  for (const gap of input.gaps) {
    sections.push(``);
    sections.push(`Gap ID: ${gap.id}`);
    sections.push(`Expected impact: ${gap.expectedImpact}`);
    sections.push(`Anchor paragraph: P${gap.anchorLocation.paragraph}`);
    sections.push(`Missing mechanism: ${gap.missingMechanism}`);
    sections.push(`What it should provide: ${gap.whatItShouldProvide}`);
    sections.push(`Architectural reason: ${gap.architecturalReason}`);
    sections.push(`Unlocks next: ${gap.unlocksNext}`);
    sections.push(
      `Word budget: paragraph has ${gap.wordBudget.paragraphCurrentWords} words, ` +
        `essay has ${gap.wordBudget.essayCurrentWords}/${gap.wordBudget.essayMaxWords}, ` +
        `targetDelta ${gap.wordBudget.targetDelta.min}-${gap.wordBudget.targetDelta.max} words.`,
    );
    if (gap.candidateAnchors.length > 0) {
      sections.push(`Candidate anchors (from MomentEarnednessMap):`);
      for (const c of gap.candidateAnchors) {
        sections.push(`  - P${c.paragraph}S${c.sentence}: ${c.momentDescription}`);
      }
    } else {
      sections.push(`Candidate anchors: (none — anchor at P${gap.anchorLocation.paragraph} top)`);
    }
    if (gap.consolidatedFrom.length > 0) {
      sections.push(`Consolidated from candidates: ${gap.consolidatedFrom.join(', ')}`);
    }
  }

  if (input.priorDrafts && input.priorDrafts.length > 0) {
    sections.push('');
    sections.push('=== PRIOR DRAFTS (re-analysis context) ===');
    for (const pd of input.priorDrafts) {
      sections.push(
        `  - Gap ${pd.gapId} [${pd.intensityLevel}] (${pd.wasApplied ? 'APPLIED' : 'NOT applied'}): ${pd.draftText.substring(0, 200)}${pd.draftText.length > 200 ? '…' : ''}`,
      );
    }
    sections.push(
      `Do NOT re-emit any of the above drafts verbatim. For APPLIED drafts, build on the student\'s direction. For NOT-applied drafts, try a different approach.`,
    );
  }

  sections.push('');
  sections.push('=== EMIT ===');
  sections.push(
    'Produce growthAnnotations[] for each gap (with 2-3 draftVariants per gap), preservationAnnotations[] for each preserveSpan, and a single reframeAnnotation. JSON only.',
  );

  return sections.join('\n');
}

// ────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG — L5_ESSAY_LEVEL_REWRITES gates the orchestrator call site
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the L5_ESSAY_LEVEL_REWRITES env flag is set to 'true'.
 * Default off. Used by the orchestrator (item 9, deferred to a separate PR)
 * to gate whether `generateEssayLevelRewrites()` is called in the pipeline.
 *
 * The method itself is callable directly — this flag only controls automatic
 * invocation during analysis runs.
 */
export function isEssayLevelRewritesEnabled(): boolean {
  return process.env.L5_ESSAY_LEVEL_REWRITES === 'true';
}

// ────────────────────────────────────────────────────────────────────────────
// THE METHOD — generateEssayLevelRewrites
// ────────────────────────────────────────────────────────────────────────────

/**
 * Internal JSON-output shape returned by the LLM. Mirrors
 * GenerateEssayLevelRewritesOutput minus the cost/usage fields the LLM
 * doesn't produce. Parsed defensively — missing/malformed fields trigger
 * fallback annotations or get dropped, never a hard throw.
 */
interface RawRewriteOutput {
  growthAnnotations?: unknown[];
  preservationAnnotations?: unknown[];
  reframeAnnotation?: unknown | null;
}

/**
 * Single-Sonnet-call essay-level rewrite generator. Consumes the structured
 * input from `assembleRewriteInputs()`, returns growth annotations (with
 * multi-draft rewrites), preservation annotations, and the reframe annotation.
 *
 * Cache structure:
 *   - systemPrompt: cached via cacheSystemPrompt:true (byte-identical across
 *     calls for a fixed scale → multi-essay runs hit cache)
 *   - userPromptBlocks[0]: shared prefix with cacheBreakpoint:true (essay +
 *     style + constraints + context — byte-identical across re-analyses of
 *     the same essay within the cache TTL)
 *   - userPromptBlocks[1]: per-call tail (gaps + priorDrafts) — not cached
 *
 * Returns even on parse failure: when the LLM emits no growth annotations
 * (Q6c failure mode), the method returns empty arrays and the orchestrator
 * is responsible for the retry / fallback policy. Voice-check telemetry is
 * always populated (empty array when no growth annotations had drafts).
 *
 * Post-call validators (item 8 — not yet implemented) will be invoked here
 * to enforce Q6b (preservation-span violations) and the voice fingerprint
 * before the result returns. For now the parsed output passes through.
 *
 * @param input — typically built by `assembleRewriteInputs(profile)`.
 * @param options.scale — for the system prompt + cache key. Defaults to
 *   'personal_statement'.
 * @param options.essayId — included in log lines for traceability.
 */
export async function generateEssayLevelRewrites(
  input: GenerateEssayLevelRewritesInput,
  options?: { scale?: NorthStarScale; essayId?: string },
): Promise<GenerateEssayLevelRewritesOutput> {
  const scale: NorthStarScale = options?.scale ?? 'personal_statement';
  const essayId = options?.essayId ?? 'unknown';

  const systemPrompt = buildRewriteSystemPrompt(scale);
  const sharedPrefix = buildRewriteSharedPrefix(input);
  const userTail = buildRewriteUserTail(input);

  const startTime = Date.now();
  const response = await callClaudeWithRetry<RawRewriteOutput>({
    model: SONNET,
    systemPrompt,
    userPromptBlocks: [
      { text: sharedPrefix, cacheBreakpoint: true },
      { text: userTail },
    ],
    maxTokens: REWRITE_MAX_TOKENS,
    temperature: REWRITE_TEMPERATURE,
    useJsonMode: true,
    cacheSystemPrompt: true,
    timeoutMs: REWRITE_TIMEOUT_MS,
  });

  const cost = calculateCost(response.usage, SONNET);
  const elapsedMs = Date.now() - startTime;

  console.log(
    `[generateEssayLevelRewrites] ${essayId}: ` +
      `${response.usage.input_tokens.toLocaleString()} input ` +
      `(cache_read=${(response.usage.cache_read_input_tokens ?? 0).toLocaleString()}, ` +
      `cache_create=${(response.usage.cache_creation_input_tokens ?? 0).toLocaleString()}) + ` +
      `${response.usage.output_tokens.toLocaleString()} output ` +
      `= $${cost.toFixed(4)}, time=${elapsedMs}ms`,
  );

  // ── Parse the JSON output (defensive: never throws on missing fields) ──
  const raw: RawRewriteOutput =
    typeof response.content === 'object' && response.content !== null
      ? response.content
      : ({} as RawRewriteOutput);

  const growthAnnotations = parseGrowthAnnotations(
    Array.isArray(raw.growthAnnotations) ? raw.growthAnnotations : [],
  );
  const preservationAnnotations = parsePreservationAnnotations(
    Array.isArray(raw.preservationAnnotations) ? raw.preservationAnnotations : [],
  );
  const reframeAnnotation = parseReframeAnnotation(raw.reframeAnnotation ?? null);

  // Voice-check telemetry — collect what the LLM self-reported on each draft.
  const voiceCheckResults: VoiceCheckResult[] = [];
  for (const ann of growthAnnotations) {
    if ('draftVariants' in ann && ann.draftVariants.length > 0) {
      for (const draft of ann.draftVariants) {
        voiceCheckResults.push({
          draftId: `${ann.addressesGapId}_${draft.intensityLevel}`,
          passes: {
            usedAtLeastOneDistinctivePattern:
              draft.voiceCheck.distinctivePatternsUsed.length > 0,
            vocabularyOverlapPercent: 0, // computed by validator in item 8
            sentenceLengthMatch: draft.voiceCheck.selfReportedPass,
            avoidedVoiceWeaknesses: draft.voiceCheck.selfReportedPass,
          },
          overallPass: draft.voiceCheck.selfReportedPass,
        });
      }
    }
  }

  return {
    growthAnnotations,
    preservationAnnotations,
    reframeAnnotation,
    cost,
    voiceCheckResults,
    tokenUsage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens,
      cacheWriteTokens: response.usage.cache_creation_input_tokens,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// JSON PARSE HELPERS (defensive — never throw on missing fields)
// ────────────────────────────────────────────────────────────────────────────

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function parseAnchorLocation(
  v: unknown,
  defaultParagraph = 0,
): { paragraphIndex: number; sentenceIndex: number | null; spanText: string | null } {
  if (typeof v !== 'object' || v === null) {
    return { paragraphIndex: defaultParagraph, sentenceIndex: null, spanText: null };
  }
  const obj = v as Record<string, unknown>;
  return {
    paragraphIndex: asNumber(obj.paragraphIndex, defaultParagraph),
    sentenceIndex: typeof obj.sentenceIndex === 'number' ? obj.sentenceIndex : null,
    spanText: typeof obj.spanText === 'string' ? obj.spanText : null,
  };
}

function parseRewriteDraft(v: unknown): RewriteDraft | null {
  if (typeof v !== 'object' || v === null) return null;
  const obj = v as Record<string, unknown>;
  const text = asString(obj.text);
  if (text.length === 0) return null;

  const intensityLevel: RewriteDraft['intensityLevel'] =
    obj.intensityLevel === 'scene' || obj.intensityLevel === 'insight'
      ? obj.intensityLevel
      : 'minimal';

  const antiPatternRaw = (obj.antiPattern ?? {}) as Record<string, unknown>;
  const voiceCheckRaw = (obj.voiceCheck ?? {}) as Record<string, unknown>;
  const wordEconomyCutRaw = obj.wordEconomyCut;

  let wordEconomyCut: RewriteDraft['wordEconomyCut'] = null;
  if (typeof wordEconomyCutRaw === 'object' && wordEconomyCutRaw !== null) {
    const wec = wordEconomyCutRaw as Record<string, unknown>;
    const locRaw = (wec.location ?? {}) as Record<string, unknown>;
    wordEconomyCut = {
      location: {
        paragraph: asNumber(locRaw.paragraph),
        sentence: asNumber(locRaw.sentence),
      },
      quote: asString(wec.quote),
      wordsRemoved: asNumber(wec.wordsRemoved),
      reason: asString(wec.reason),
    };
  }

  return {
    text,
    intensityLevel,
    wordDelta: asNumber(obj.wordDelta),
    voicePreservationNotes: asString(obj.voicePreservationNotes),
    addressesGapMechanism: (asString(obj.addressesGapMechanism, 'unclassified') as RewriteDraft['addressesGapMechanism']),
    antiPattern: {
      text: asString(antiPatternRaw.text),
      whyItFails: asString(antiPatternRaw.whyItFails),
    },
    wordEconomyCut,
    voiceCheck: {
      distinctivePatternsUsed: asStringArray(voiceCheckRaw.distinctivePatternsUsed),
      vocabularyDomainsUsed: asStringArray(voiceCheckRaw.vocabularyDomainsUsed),
      sentenceLengthAvg: asNumber(voiceCheckRaw.sentenceLengthAvg),
      selfReportedPass: voiceCheckRaw.selfReportedPass === true,
    },
  };
}

function parseGrowthAnnotations(
  raws: unknown[],
): Array<L5GrowthAnnotation | L5GrowthFallbackAnnotation> {
  const result: Array<L5GrowthAnnotation | L5GrowthFallbackAnnotation> = [];
  for (const item of raws) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    const addressesGapId = asString(obj.addressesGapId);
    const drafts = Array.isArray(obj.draftVariants)
      ? obj.draftVariants.map(parseRewriteDraft).filter((d): d is RewriteDraft => d !== null)
      : [];

    const baseFields = {
      id: asString(obj.id) || `ann_${addressesGapId}_${result.length}`,
      type: 'growth' as const,
      content: asString(obj.content),
      teachingRationale: asString(obj.teachingRationale),
      teachingIntent: asString(obj.teachingIntent),
      stakes: typeof obj.stakes === 'string' ? obj.stakes : null,
      northStarConnection: asString(obj.northStarConnection),
      priority: asNumber(obj.priority, 3),
      phase: asString(obj.phase, 'craft'),
      confidence: asNumber(obj.confidence, 0.7),
      crossParagraphRefs: Array.isArray(obj.crossParagraphRefs)
        ? obj.crossParagraphRefs.filter((x): x is number => typeof x === 'number')
        : [],
      capacityBuildingNote: typeof obj.capacityBuildingNote === 'string' ? obj.capacityBuildingNote : null,
      antiPatternExample: typeof obj.antiPatternExample === 'string' ? obj.antiPatternExample : null,
      transferablePrinciple: typeof obj.transferablePrinciple === 'string' ? obj.transferablePrinciple : null,
      wordEconomyCut: typeof obj.wordEconomyCut === 'string' ? obj.wordEconomyCut : null,
      surfaced: true,
      location: ((): L5Annotation['location'] => {
        const al = parseAnchorLocation(obj.anchorLocation);
        return {
          paragraphIndex: al.paragraphIndex,
          sentenceIndex: al.sentenceIndex,
          spanText: al.spanText,
        };
      })(),
      addressesGapId,
    };

    // Q6c: zero-drafts fallback path. fallbackReason flag from LLM OR empty drafts triggers awareness-mode.
    const fallbackReason = obj.fallbackReason;
    if (fallbackReason === 'zero_drafts_after_retry' || drafts.length === 0) {
      result.push({
        ...baseFields,
        teachingMode: 'awareness',
        draftVariants: [],
        rewriteExample: null,
        fallbackReason: 'zero_drafts_after_retry',
      } as L5GrowthFallbackAnnotation);
      continue;
    }

    result.push({
      ...baseFields,
      teachingMode: 'action',
      draftVariants: drafts,
      rewriteExample: drafts[0].text,
    } as L5GrowthAnnotation);
  }
  return result;
}

function parsePreservationAnnotations(raws: unknown[]): L5PreservationAnnotation[] {
  const result: L5PreservationAnnotation[] = [];
  for (const item of raws) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    const al = parseAnchorLocation(obj.anchorLocation);
    result.push({
      id: asString(obj.id) || `preservation_${result.length}`,
      type: 'strength',
      teachingMode: 'awareness',
      content: asString(obj.content),
      teachingRationale: asString(obj.teachingRationale),
      teachingIntent: asString(obj.teachingIntent),
      rewriteExample: null,
      weakeningAntiPattern: asString(obj.weakeningAntiPattern),
      technique: asString(obj.technique),
      stakes: typeof obj.stakes === 'string' ? obj.stakes : null,
      northStarConnection: asString(obj.northStarConnection),
      priority: asNumber(obj.priority, 2),
      phase: asString(obj.phase, 'craft'),
      confidence: asNumber(obj.confidence, 0.8),
      crossParagraphRefs: [],
      capacityBuildingNote: typeof obj.capacityBuildingNote === 'string' ? obj.capacityBuildingNote : null,
      antiPatternExample: null,
      transferablePrinciple: null,
      wordEconomyCut: null,
      surfaced: true,
      location: {
        paragraphIndex: al.paragraphIndex,
        sentenceIndex: al.sentenceIndex,
        spanText: al.spanText,
      },
    } as L5PreservationAnnotation);
  }
  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// POST-CALL VALIDATORS (item 8)
// ────────────────────────────────────────────────────────────────────────────
//
// Three pure-function validators that gate each emitted draft against the
// locked design rules:
//   - validateDraftPreservation: Q6b — no preserve-span substring copied
//   - voiceCheckDraft: Q1.5/Q5 — voice fingerprint match
//   - validateBudget: Q3 — wordDelta within targetDelta + essay-ceiling
//
// Each returns { pass, reason? } so the caller can:
//   - log the reason on failure (telemetry)
//   - decide drop-vs-regenerate per Q6b policy
//   - report which validator triggered if there's an audit need

/** Normalize a string for substring comparison — lowercase, strip non-word
 *  punctuation (keeps apostrophes + hyphens within words), collapse whitespace.
 *  This is more aggressive than tokenize() because we need substring-window
 *  comparison to ignore parenthetical punctuation in preserve-span descriptions. */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // strip anything not word/space/'/-
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize text into lowercase word tokens for vocabulary-overlap math. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Q6b: detect when a draft copies any `preserveSpan` description text
 * verbatim (or near-verbatim — case-insensitive, whitespace-normalized).
 *
 * The check is conservative: only the `description` strings of the preserve
 * spans are checked, since the actual anchor text may not be carried on the
 * PreservationContract. If the draft contains a 12+ word phrase that also
 * appears in any preserve-span description, the validator flags it.
 *
 * This validator is the gate for the Q6b drop-vs-regenerate path: drop the
 * single draft on first failure; if all variants of a gap fail, regenerate
 * the whole annotation.
 */
export function validateDraftPreservation(
  draft: { text: string },
  constraints: PreservationContract,
): { pass: boolean; reason?: string } {
  const draftNorm = normalizeForMatch(draft.text);
  if (draftNorm.length === 0) {
    return { pass: false, reason: 'empty draft text' };
  }

  for (const span of constraints.preserveSpans) {
    const spanNorm = normalizeForMatch(span.description);
    if (spanNorm.length < 30) continue; // Too short to be meaningful — skip.

    // Look for any 12+ word window from the span appearing in the draft.
    const spanTokens = spanNorm.split(' ');
    if (spanTokens.length < 12) continue;

    for (let i = 0; i + 12 <= spanTokens.length; i++) {
      const window = spanTokens.slice(i, i + 12).join(' ');
      if (draftNorm.includes(window)) {
        return {
          pass: false,
          reason: `draft copies 12+ words from preserve span "${span.description.substring(0, 60)}…"`,
        };
      }
    }
  }

  return { pass: true };
}

/**
 * Q1.5/Q5: voice-fingerprint check. Three deterministic signals:
 *   (a) Draft uses at least one of styleProfile.distinctivePatterns (keyword
 *       presence — the patterns are short phrases that should appear in or
 *       be evidenced by the draft text)
 *   (b) Vocabulary overlap with styleProfile.vocabularyDomains.exampleWords
 *       >= 1 example word per draft (lenient floor — drafts are short)
 *   (c) Sentence-length average within ±20% of styleProfile.sentenceRhythmBaseline.
 *       Baseline is descriptive prose so this signal is APPROXIMATED by the
 *       LLM's self-reported `voiceCheck.sentenceLengthAvg` field. Validator
 *       only checks the field is non-zero (LLM provided a value); precision
 *       is best-effort.
 *
 * Returns the first failure reason; pass overall only when all three signals
 * are met.
 */
export function voiceCheckDraft(
  draft: RewriteDraft,
  styleProfile: StyleProfile,
): { pass: boolean; reason?: string } {
  // (a) Distinctive-pattern signal. The LLM reports which patterns it used
  // in voiceCheck.distinctivePatternsUsed; we cross-check those are real.
  const validPatterns = new Set(styleProfile.distinctivePatterns);
  const usedReal = draft.voiceCheck.distinctivePatternsUsed.filter((p) =>
    validPatterns.has(p),
  );
  if (usedReal.length === 0) {
    return {
      pass: false,
      reason: 'no real distinctivePattern used (self-reported claims do not match styleProfile)',
    };
  }

  // (b) Vocabulary-domain signal. Check that at least one exampleWord from
  // any declared domain appears in the draft text.
  const draftTokens = new Set(tokenize(draft.text));
  let vocabHit = false;
  for (const domain of styleProfile.vocabularyDomains) {
    for (const word of domain.exampleWords) {
      const wordNorm = word.toLowerCase().replace(/[^a-z0-9'-]/g, '');
      if (wordNorm.length === 0) continue;
      if (draftTokens.has(wordNorm)) {
        vocabHit = true;
        break;
      }
    }
    if (vocabHit) break;
  }
  if (!vocabHit) {
    return {
      pass: false,
      reason: 'no vocabulary-domain example word appears in draft text',
    };
  }

  // (c) Sentence-length signal. Lenient: LLM must have computed and reported
  // an avg sentence length; precise ±20% check against the baseline (a
  // descriptive string) isn't tractable deterministically, so we rely on
  // LLM self-report + non-zero check.
  if (draft.voiceCheck.sentenceLengthAvg <= 0) {
    return {
      pass: false,
      reason: 'voiceCheck.sentenceLengthAvg missing or non-positive (LLM did not self-check)',
    };
  }

  return { pass: true };
}

/**
 * Q3: word-budget check. Three rules:
 *   (a) wordDelta must be within [targetDelta.min, targetDelta.max].
 *   (b) When wordDelta is positive AND essayCurrentWords + wordDelta exceeds
 *       essayMaxWords, the draft MUST carry a wordEconomyCut suggestion.
 *   (c) wordDelta should agree (within ±10%) with the actual word count of
 *       draft.text. Skipping this strict check when paragraphCurrentWords
 *       is zero (degenerate gap).
 */
export function validateBudget(
  draft: RewriteDraft,
  gap: RewriteGap,
): { pass: boolean; reason?: string } {
  const { targetDelta, essayCurrentWords, essayMaxWords } = gap.wordBudget;

  if (draft.wordDelta < targetDelta.min || draft.wordDelta > targetDelta.max) {
    return {
      pass: false,
      reason: `wordDelta ${draft.wordDelta} outside targetDelta [${targetDelta.min}, ${targetDelta.max}]`,
    };
  }

  if (
    draft.wordDelta > 0 &&
    essayCurrentWords + draft.wordDelta > essayMaxWords &&
    draft.wordEconomyCut === null
  ) {
    return {
      pass: false,
      reason: `additive draft (${draft.wordDelta} words) would push essay past max (${essayCurrentWords}+${draft.wordDelta} > ${essayMaxWords}) but wordEconomyCut is null`,
    };
  }

  return { pass: true };
}

function parseReframeAnnotation(v: unknown): L5ReframeAnnotation | null {
  if (typeof v !== 'object' || v === null) return null;
  const obj = v as Record<string, unknown>;
  const insight = asString(obj.insight);
  if (insight.length === 0) return null;

  return {
    id: asString(obj.id) || 'reframe_essay',
    type: 'teaching',
    teachingMode: 'consequence',
    content: asString(obj.content) || insight,
    teachingRationale: asString(obj.teachingRationale),
    teachingIntent: asString(obj.teachingIntent),
    rewriteExample: null,
    stakes: typeof obj.stakes === 'string' ? obj.stakes : null,
    northStarConnection: asString(obj.northStarConnection),
    priority: asNumber(obj.priority, 1),
    phase: asString(obj.phase, 'architecture'),
    confidence: asNumber(obj.confidence, 0.9),
    crossParagraphRefs: [],
    capacityBuildingNote: typeof obj.capacityBuildingNote === 'string' ? obj.capacityBuildingNote : null,
    antiPatternExample: null,
    transferablePrinciple: null,
    wordEconomyCut: null,
    surfaced: true,
    location: { paragraphIndex: 0, sentenceIndex: null, spanText: null },
    insight,
    whyThisTransforms: asString(obj.whyThisTransforms),
  } as L5ReframeAnnotation;
}
