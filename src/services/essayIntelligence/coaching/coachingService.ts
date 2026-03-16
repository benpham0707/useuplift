/**
 * CoachingService — Layer 6: Conversational Essay Coaching
 *
 * The student-facing intelligence layer. Translates deep profile understanding
 * into personalized, phase-aware, evidence-grounded coaching responses.
 *
 * 5-stage pipeline per coaching turn:
 * 1. Insight extraction + focus detection (Haiku)
 * 2. Context routing (no LLM — pure logic)
 * 3. Coaching response generation (Sonnet — THE core prompt)
 * 4. Profile deepening (conditional Sonnet call for reinterpretation/new_context)
 * 5. Phase check (conditional — after deepening)
 *
 * The Stage 3 prompt is the hardest prompt in the system. It must be simultaneously:
 * - Phase-aware (foundation vs. polish vs. distinction feedback)
 * - Architecture-grounded (North Star, structural roles, earned-ness)
 * - Honest (STRONG / ADEQUATE / WEAK assessment, not cheerleading)
 * - Specific (direct text quotes, not abstract advice)
 * - Conversationally natural (builds on prior turns, no repetition)
 * - Student-sensitive (meets the student where they are)
 *
 * Models: Haiku for Stage 1 classification, Sonnet for Stage 3 + Stage 4 deepening.
 * Caching: cacheSystemPrompt=true on all Sonnet calls.
 *
 * Spec: PLAN.md Phase 1 (1K coaching service), MEMORY.md (L6 coaching section)
 */

import type {
  EssayProfile,
  InsightCategory,
  ConversationInsight,
  InsightScope,
  PatternInsight,
  ImprovementPhaseLevel,
  LightTouchUpdate,
  ObservationEntry,
  CognitiveState,
  TopicConfusionTracker,
  CognitiveAssessment,
  CoachingSessionMemory,
  LearningStyleObservations,
  CoachingQualitySignals,
} from '../profileTypes';

import type { ProfileRouter, RoutingRule } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { EssayProfileCoordinator } from '../profileManager/essayProfileManager';

import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { LayerCost, TokenUsage } from '../analysis/analysisOrchestrator';
import { buildFindingContext } from '../findings/findingContextBuilder';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-5-20250929';

/** Max turns of conversation history to inject into Stage 3 prompt */
const MAX_HISTORY_TURNS = 12;

/** Min turns before pattern detection runs (lowered from 5 to 3 — repeated focus
 *  on a topic is detectable after 3 mentions, and earlier detection means earlier
 *  injection into Stage 3 so the coach can reference patterns in the same turn) */
const PATTERN_DETECTION_MIN_TURNS = 3;

// ============================================================================
// EXPORTED TYPES
// ============================================================================

/**
 * A single turn in the coaching conversation.
 */
export interface ConversationTurn {
  role: 'student' | 'coach';
  content: string;
  timestamp?: string;
}

/**
 * Stage 4 verdict: the outcome of the Sonnet deepening evaluation.
 * confirmed = existing analysis validated, superseded = analysis replaced by student's reading,
 * tensioned = student intent conflicts with current text (needs revision).
 */
export type Stage4Verdict = 'confirmed' | 'superseded' | 'tensioned' | 'none';

/**
 * Complete result from a single coaching turn.
 */
export interface CoachingResult {
  /** The coach's response to the student */
  response: string;
  /** Conversation insight extracted (null if category is clarification or no meaningful insight) */
  insightExtracted: ConversationInsight | null;
  /** Whether Stage 4 deepening was applied to the profile */
  profileDeepened: boolean;
  /** Which routing rule was chosen for context assembly */
  routingRuleUsed: string;
  /** Cost breakdown per layer/stage */
  cost: LayerCost[];
  /** Sum of all stage costs */
  totalCost: number;
  /**
   * Stage 4 verdict (FIX 2.3): the outcome of the Sonnet deepening evaluation.
   * 'none' when Stage 4 was not run (e.g., category was confirmation/preference/etc.)
   * Orchestrator should use this to apply supersession or tension notes to the profile.
   */
  stage4Verdict: Stage4Verdict;
  /**
   * Phase 2: Finding IDs that Stage 4 determined are superseded by the student's reinterpretation.
   * Populated only when stage4Verdict === 'superseded'. Format: ["F1", "F3"].
   * FindingStore.updateMaturity() already applied by the time this is returned.
   */
  supersededFindingIds?: string[];
  /**
   * Description of the tension when stage4Verdict === 'tensioned'.
   * Orchestrator can store this so L3.75 factors it in during the next re-analysis.
   */
  tensionDescription?: string;
  /**
   * Pattern insights detected from the conversation history (FIX 3.11).
   * Populated when enough turns exist and patterns are found.
   * Orchestrator / VersionTracker should record these.
   */
  detectedPatterns?: PatternInsight[];
  /**
   * Improvement 6: Updated session memory — pass back on next turn.
   * Ephemeral to the coaching session (not stored in profile).
   */
  sessionMemory: CoachingSessionMemory;
  /**
   * Improvement 6: Updated learning style observations — pass back on next turn.
   */
  learningStyle: LearningStyleObservations;
  /**
   * Improvement 6: Quality signals extracted every 3 turns.
   */
  qualitySignals?: CoachingQualitySignals;
  /**
   * Improvement 6: LLM-assessed cognitive state for this turn.
   */
  cognitiveAssessment?: CognitiveAssessment;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/**
 * Raw output from Stage 1 Haiku insight extraction.
 */
interface Stage1Output {
  category: InsightCategory;
  emotionalValence: number;
  confidence: number;
  isExplicit: boolean;
  isNovel: boolean;
  focusProbabilities: Record<string, number>;
  dimensionFocus: string[];
  conversationType: 'coaching_question' | 'revision_discussion' | 'meta_conversation' | 'general_inquiry';
  recentEditAware: boolean;
  /** FIX 2.4: 0-based paragraph index for inline_edit_sentence routing. null = not detected. */
  targetParagraphIndex: number | null;
  /** FIX 2.4: 0-based sentence index within targetParagraphIndex. null = not detected. */
  targetSentenceIndex: number | null;
  /** W6.1: Inferred cognitive state of the student. Defaults to 'engaged' if not parseable. */
  cognitiveState: CognitiveState;
  /** Improvement 6: LLM-produced scope certainty routing tag. Replaces hardcoded confidence thresholds. */
  scopeCertainty: 'high' | 'moderate' | 'low';
  /** LLM-produced durability signal for preferences. 'general' = applies across all essays. 'essay_specific' = about this essay only. null for non-preference categories. */
  preferenceDurability: 'general' | 'essay_specific' | null;
}

/**
 * Raw output from Stage 4 Sonnet reinterpretation evaluation.
 */
interface Stage4ReinterpretationOutput {
  evaluationSummary: string;
  /** Finding IDs confirmed by the student's reinterpretation (e.g., ["F1", "F3"]) */
  confirmedFindings: string[];
  /** Finding IDs superseded by the student's reinterpretation (e.g., ["F2"]) */
  supersededFindings: string[];
  /** Finding IDs in tension with the student's reinterpretation */
  tensionedFindings: string[];
  newUnderstanding: string;
}

/**
 * Raw output from Stage 4 Sonnet new_context evaluation.
 */
interface Stage4NewContextOutput {
  updatedUnderstanding: string;
  affectedSections: string[];
  integrationNotes: string;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class CoachingService {

  // --------------------------------------------------------------------------
  // W6.2: CONFUSION TRACKING (escalation ladder)
  // --------------------------------------------------------------------------

  /**
   * Tracks repeated confusion per topic across coaching turns.
   * Key = topic string (e.g., "voice", "transition", "opening").
   * Persists for the lifetime of this service instance (i.e., the coaching session).
   */
  private confusionTrackers: Map<string, TopicConfusionTracker> = new Map();

  // --------------------------------------------------------------------------
  // PRIMARY PUBLIC ENTRY POINT
  // --------------------------------------------------------------------------

  /**
   * Process one coaching turn — the full 5-stage pipeline.
   *
   * @param studentMessage  Raw text from student
   * @param conversationHistory  All prior turns in this session
   * @param profile  Current essay profile (read-only — mutations go through coordinator)
   * @param coordinator  Profile coordinator for applying insight mutations
   * @param router  Profile router for context assembly
   * @param recentEditContext  Optional summary of recent edits (for edit-aware routing)
   * @param editStrategyContext  W9.3: Optional approach/strategy context from version tracker
   */
  async processCoachingTurn(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    router: ProfileRouter,
    recentEditContext?: string,
    editStrategyContext?: string,
    sessionMemory?: CoachingSessionMemory,
    learningStyle?: LearningStyleObservations,
  ): Promise<CoachingResult> {
    const turnStart = Date.now();
    const costs: LayerCost[] = [];

    // Initialize session memory and learning style on first call
    let memory = sessionMemory ?? this.initializeSessionMemory();
    let style = learningStyle ?? this.initializeLearningStyle();

    console.log(
      `[CoachingService] Turn start — message="${studentMessage.slice(0, 80)}..." ` +
      `history=${conversationHistory.length} turns, phase=${profile.index.improvementPhase.level}, ` +
      `sessionTurn=${memory.turnCount + 1}`,
    );

    // ── Stage 1: Insight Extraction + Focus Detection (Haiku) ──
    const s1Start = Date.now();
    const { stage1, s1Cost } = await this.runStage1InsightExtraction(
      studentMessage,
      conversationHistory,
      profile,
      recentEditContext,
    );
    costs.push(s1Cost);
    console.log(
      `[CoachingService] Stage 1 complete — category=${stage1.category}, ` +
      `cognitiveState=${stage1.cognitiveState}, scopeCertainty=${stage1.scopeCertainty}, ` +
      `confidence=${stage1.confidence}, cost=$${s1Cost.cost.toFixed(5)}, ` +
      `time=${Date.now() - s1Start}ms`,
    );

    // ── Stage 1.5: Cognitive Assessment (Haiku — LLM-assessed state) ──
    const s15Start = Date.now();
    const { assessment: cognitiveAssessment, cost: s15Cost } = await this.runStage1_5CognitiveAssessment(
      studentMessage,
      conversationHistory,
      stage1,
      memory,
      style,
    );
    costs.push(s15Cost);
    console.log(
      `[CoachingService] Stage 1.5 complete — intensity=${cognitiveAssessment.responseIntensity}, ` +
      `approach="${cognitiveAssessment.recommendedApproach.slice(0, 60)}", ` +
      `cost=$${s15Cost.cost.toFixed(5)}, time=${Date.now() - s15Start}ms`,
    );

    // ── Stage 2: Context Routing (no LLM) ──
    const { routingRule, routingRequest } = this.runStage2ContextRouting(
      stage1,
      profile,
      recentEditContext,
    );
    const assembledContext = router.assembleContext(profile, routingRequest);
    console.log(
      `[CoachingService] Stage 2 complete — rule=${routingRule}, ` +
      `sections=${assembledContext.sections.length}, tokens≈${assembledContext.estimatedTokens}`,
    );

    // ── W6.2: Confusion Escalation Tracking ──
    this.updateConfusionTracking(stage1);

    // ── Pattern Detection (LLM-based, BEFORE Stage 3 so patterns influence the response) ──
    let detectedPatterns: PatternInsight[] | undefined;
    let qualitySignals: CoachingQualitySignals | undefined;
    if (conversationHistory.length >= PATTERN_DETECTION_MIN_TURNS) {
      const patternResult = await this.detectPatternsLLM(
        conversationHistory,
        studentMessage,
        profile,
        memory,
      );
      costs.push(patternResult.cost);
      detectedPatterns = patternResult.patterns;

      if (detectedPatterns.length > 0) {
        console.log(`[CoachingService] LLM patterns detected (pre-Stage3): ${detectedPatterns.map(p => p.pattern).join(', ')}`);
        for (const pattern of detectedPatterns) {
          coordinator.addPatternInsight(pattern);
        }
      }

      // Update session memory with pattern detection results
      memory.sessionArcSummary = patternResult.sessionArcUpdate;
      memory.nextFocus = patternResult.nextFocusSuggestion;

      // Update learning style if new signal detected
      if (patternResult.learningStyleUpdate) {
        style.observations.push({
          observation: patternResult.learningStyleUpdate,
          confidence: 'tentative',
          turnObserved: memory.turnCount + 1,
        });
      }

      // Quality signals extracted alongside pattern detection
      qualitySignals = patternResult.qualitySignals;

      // Update outcome of previous approach based on student's response
      if (memory.approachesUsed.length >= 1) {
        const previousApproach = memory.approachesUsed[memory.approachesUsed.length - 1];
        if (previousApproach.outcome === 'pending') {
          previousApproach.outcome = stage1.category === 'resistance'
            ? 'student resisted'
            : stage1.category === 'confirmation'
            ? 'student confirmed understanding'
            : stage1.category === 'clarification'
            ? 'student needed more explanation'
            : 'student engaged';
        }
      }
    }

    // ── Stage 3: Coaching Response (Sonnet or Haiku for minimal) ──
    let response: string;

    if (cognitiveAssessment.responseIntensity === 'minimal') {
      // Minimal response path — use Haiku for brief acknowledgment
      const s3Start = Date.now();
      const { response: minimalResp, cost: minimalCost } = await this.generateMinimalResponse(
        studentMessage,
        cognitiveAssessment,
        conversationHistory,
        profile,
      );
      response = minimalResp;
      costs.push(minimalCost);
      console.log(
        `[CoachingService] Minimal response generated — length=${response.length}, ` +
        `cost=$${minimalCost.cost.toFixed(5)}, time=${Date.now() - s3Start}ms`,
      );
    } else {
      // Full or brief response — use Sonnet Stage 3
      const s3Start = Date.now();
      const { response: s3Response, s3Cost } = await this.runStage3CoachingResponse(
        studentMessage,
        conversationHistory,
        profile,
        assembledContext,
        stage1,
        coordinator,
        cognitiveAssessment,
        memory,
        recentEditContext,
        editStrategyContext,
      );
      response = s3Response;
      costs.push(s3Cost);
      console.log(
        `[CoachingService] Stage 3 complete — responseLength=${response.length}, ` +
        `intensity=${cognitiveAssessment.responseIntensity}, ` +
        `cost=$${s3Cost.cost.toFixed(5)}, time=${Date.now() - s3Start}ms`,
      );
    }

    // ── Stage 4: Profile Deepening (conditional) ──
    let insightExtracted: ConversationInsight | null = null;
    let profileDeepened = false;

    const s4Result = await this.runStage4ProfileDeepening(
      studentMessage,
      stage1,
      profile,
      coordinator,
      costs,
    );
    insightExtracted = s4Result.insight;
    profileDeepened = s4Result.deepened;
    const stage4Verdict: Stage4Verdict = s4Result.verdict;
    const supersededFindingIds = s4Result.supersededFindingIds;
    const tensionDescription = s4Result.tensionDescription;

    // ── Stage 5: Phase Check (conditional — after deepening) ──
    if (profileDeepened) {
      this.runStage5PhaseCheck(profile, coordinator);
    }

    // ── Update session memory with this turn's data ──
    memory = this.updateSessionMemory(
      memory,
      studentMessage,
      stage1,
      cognitiveAssessment,
    );

    const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
    console.log(
      `[CoachingService] Turn complete — totalCost=$${totalCost.toFixed(5)}, ` +
      `totalTime=${Date.now() - turnStart}ms, profileDeepened=${profileDeepened}, ` +
      `stage4Verdict=${stage4Verdict}, sessionTurn=${memory.turnCount}`,
    );

    return {
      response,
      insightExtracted,
      profileDeepened,
      routingRuleUsed: routingRule,
      cost: costs,
      totalCost,
      stage4Verdict,
      sessionMemory: memory,
      learningStyle: style,
      cognitiveAssessment,
      ...(supersededFindingIds !== undefined && { supersededFindingIds }),
      ...(tensionDescription !== undefined && { tensionDescription }),
      ...(detectedPatterns !== undefined && detectedPatterns.length > 0 && { detectedPatterns }),
      ...(qualitySignals !== undefined && { qualitySignals }),
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 1: INSIGHT EXTRACTION + FOCUS DETECTION (Haiku)
  // --------------------------------------------------------------------------

  private async runStage1InsightExtraction(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    recentEditContext?: string,
  ): Promise<{ stage1: Stage1Output; s1Cost: LayerCost }> {
    const callStart = Date.now();

    const paragraphLabels = profile.paragraphs.map((p, i) => `P${i + 1}`).join(', ');
    const recentHistory = conversationHistory.slice(-6);

    const systemPrompt = `You are an insight classifier for an essay coaching system. You extract two things from every student message: (1) what CATEGORY of insight this is, and (2) what PART of the essay they are talking about.

CATEGORY TAXONOMY — 8 categories (use lowercase exactly as shown):

confirmation — student validates existing analysis:
  "Yeah, that's exactly what I was going for with the diamond"
  "The transition between P2 and P3 is intentional — I wanted to slow down there"

reinterpretation — student offers alternative reading of their own essay:
  "Actually, I didn't mean it as a metaphor — the diamond is just a diamond"
  "The real turning point isn't in P3, it's when my grandmother hands it to me in P4"

new_context — student reveals background information not in the essay text:
  "What you don't know is my grandfather actually did come back — he just wasn't around"
  "I wrote this right after my hospitalization — that's why the opening feels so flat"

correction — student says the analysis got something factually wrong:
  "That's wrong — I wasn't nervous, I was excited about the move"
  "P2 isn't about loss at all, it's about letting go — those are different things"

preference — student expresses stylistic or structural preference:
  "I like short, punchy sentences — I don't want them padded out"
  "I don't want to use the word 'growth' anywhere in this essay"

clarification — student asks for explanation or more detail:
  "Can you explain what you mean about the transition between P2 and P3?"
  "What's wrong with my opening paragraph?"

emotional_reaction — student responds to the analysis emotionally:
  "Reading your analysis made me realize how personal this is"
  "I'm frustrated that the essay doesn't convey what I actually feel"

resistance — student explicitly rejects a suggestion and wants to keep existing approach:
  "I know you think the ending is weak but I want to keep it the way it is"
  "I disagree — the ambiguity is intentional and I don't want to resolve it"

=== DISAMBIGUATION FOR BOUNDARY CASES ===

correction vs resistance vs reinterpretation:
- "You misread that sentence — it's about X, not Y" → CORRECTION (the analysis made a factual error)
- "I know you think it's weak, but I WANT to keep it" → RESISTANCE (rejecting a suggestion)
- "Actually, I meant that paragraph to be ironic" → REINTERPRETATION (offering an alternative reading)

The test: Does the student say the ANALYSIS IS WRONG (correction)? Does the student REJECT A SUGGESTION (resistance)? Does the student offer AN ALTERNATIVE READING of their own text (reinterpretation)?

preference vs confirmation:
- "I like short sentences" → PREFERENCE (about style in general)
- "Yeah, I intentionally made it short there" → CONFIRMATION (about a specific observation we made)

SCOPE AS PROBABILITY DISTRIBUTION — report which paragraphs the student is MOST LIKELY discussing as a probability distribution, not a point estimate.
Example: "that part about my grandfather" might be:
  P2: 0.6 (if grandfather appears prominently in P2)
  P4: 0.4 (if P4 also mentions grandfather)
Not: "P2" (overconfident single-value assignment)

INLINE EDIT TARGETING — when the student mentions editing or changing a specific sentence/line:
  "targetParagraphIndex" = 0-based index of the paragraph (0 = first paragraph). null if not targeting a specific sentence.
  "targetSentenceIndex" = 0-based index of the sentence within that paragraph. null if not targeting a specific sentence.
  Example: "I want to change the last line of the second paragraph" → targetParagraphIndex: 1, targetSentenceIndex: <last sentence index if known, else null>
  If the student references a specific sentence, fill both fields. Otherwise leave both null.

CONVERSATION TYPE:
  coaching_question — student asking for guidance or input
  revision_discussion — student discussing a specific revision
  meta_conversation — student discussing the coaching process itself
  general_inquiry — open-ended question not tied to a specific part

COGNITIVE STATE — infer the student's cognitive/emotional state from their message. Use lowercase exactly as shown:

  confused_about_feedback — student doesn't understand what the COACH said or meant
  confused_about_concept — student doesn't understand the CONCEPT being discussed (e.g., "what is voice?")
  curious_deeper — student wants to explore the SAME topic in more depth
  curious_wider — student wants to explore ADJACENT or new topics
  frustrated — student expresses frustration (not just confusion)
  resistant_to_specific — student pushes back on a SPECIFIC suggestion
  resistant_to_general — student pushes back on the coaching APPROACH overall
  engaged — student is actively participating, understands, building on discussion
  seeking_validation — student wants confirmation that their work/choices are good
  overwhelmed — student signals too much feedback, too many changes, feeling lost

CRITICAL DISAMBIGUATION:
  "I don't get what you mean about voice shifting" = confused_about_feedback (comprehension failure — they don't understand YOUR explanation)
  "Tell me more about voice" = curious_deeper (interest in exploration — they understand, want more)
  "What even is voice in an essay?" = confused_about_concept (they don't understand the concept itself)
  "Can you say that differently?" = confused_about_feedback
  "What about the ending?" = curious_wider
  "I tried what you said and it's not working" = frustrated
  "I like my opening the way it is" = resistant_to_specific
  "This is too much to change" = overwhelmed

SCOPE CERTAINTY — how confident are you about WHICH PART of the essay the student is discussing?
  high — clearly referring to a specific paragraph/area (e.g., "What about my opening?")
  moderate — probable focus but could be broader (e.g., "Is the voice working?")
  low — unclear or essay-wide (e.g., "What do you think?")

PREFERENCE DURABILITY — ONLY for category=preference. Is this preference about THIS ESSAY or about ALL the student's writing?
  general — applies across all essays: "I always want short sentences", "I never use semicolons"
  essay_specific — about this essay only: "I want to keep the ending ambiguous", "I don't want to use 'growth' in this essay"
  null — for all non-preference categories

OUTPUT JSON (strict schema — all category values must be lowercase):
{
  "category": "<one of the 8 categories above, lowercase>",
  "emotionalValence": <number from -1.0 (negative) to 1.0 (positive)>,
  "confidence": <0-1, your confidence in the classification>,
  "isExplicit": <true if stated directly, false if inferred>,
  "isNovel": <true if this is new information not already in the conversation>,
  "focusProbabilities": { "P1": 0.0, "P2": 0.0, ... },
  "dimensionFocus": ["<voice|narrative|structure|craft|emotion|theme|admissions|...>"],
  "conversationType": "<coaching_question|revision_discussion|meta_conversation|general_inquiry>",
  "recentEditAware": <true if student's message seems to reference a recent edit>,
  "targetParagraphIndex": <0-based paragraph index or null>,
  "targetSentenceIndex": <0-based sentence index or null>,
  "cognitiveState": "<one of the 10 cognitive states above, lowercase>",
  "scopeCertainty": "<high|moderate|low>",
  "preferenceDurability": "<general|essay_specific|null>"
}`;

    const recentHistoryText = recentHistory.length > 0
      ? `\n\nRECENT CONVERSATION (last ${recentHistory.length} turns):\n` +
        recentHistory.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
      : '';

    const editContextText = recentEditContext
      ? `\n\nRECENT EDIT CONTEXT: ${recentEditContext}`
      : '';

    const userPrompt = `Essay has ${profile.paragraphs.length} paragraphs: ${paragraphLabels}${editContextText}${recentHistoryText}

STUDENT MESSAGE TO CLASSIFY:
"${studentMessage}"

Output only the JSON object. No preamble or explanation.`;

    // FIX 2.8: cacheSystemPrompt=true — Stage 1 system prompt is static, benefits from caching
    const response = await callClaude<string>(
      {
        model: HAIKU,
        systemPrompt,
        userPrompt,
        maxTokens: 512,
        temperature: 0.2,
        useJsonMode: false,
        cacheSystemPrompt: true,
      },
    );

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, HAIKU);
    console.log(`[EssayIntelligence] L6: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const s1Cost: LayerCost = { layer: 'L6_S1_insight_extraction', cost: rawCost, tokenUsage, timingMs };

    const stage1 = this.parseStage1Output(response.content as string, profile.paragraphs.length);
    return { stage1, s1Cost };
  }

  /**
   * Parse Stage 1 JSON with 4-level defensive fallback.
   */
  private parseStage1Output(raw: string, paragraphCount: number): Stage1Output {
    // Level 1: direct parse
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) { /* fall through */ }

    // Level 2: strip markdown code fences
    if (!parsed) {
      try {
        const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
        parsed = JSON.parse(stripped);
      } catch (_) { /* fall through */ }
    }

    // Level 3: find JSON object in text
    if (!parsed) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (_) { /* fall through */ }
    }

    // Level 4: jsonrepair via import
    if (!parsed) {
      try {
        const { jsonrepair } = require('jsonrepair');
        parsed = JSON.parse(jsonrepair(raw));
      } catch (_) { /* fall through */ }
    }

    if (!parsed || typeof parsed !== 'object' || parsed === null) {
      console.warn('[CoachingService] Stage 1 parse failed — defaulting to clarification');
      return this.defaultStage1Output(paragraphCount);
    }

    const obj = parsed as Record<string, unknown>;

    const validCategories: InsightCategory[] = [
      'confirmation', 'reinterpretation', 'new_context', 'correction',
      'preference', 'clarification', 'emotional_reaction', 'resistance',
    ];
    // FIX 3.15: normalize category to lowercase before validation to handle UPPERCASE LLM output
    const rawCategory = typeof obj.category === 'string' ? obj.category.toLowerCase() : '';
    const category = validCategories.includes(rawCategory as InsightCategory)
      ? (rawCategory as InsightCategory)
      : 'clarification';

    const validConversationTypes = ['coaching_question', 'revision_discussion', 'meta_conversation', 'general_inquiry'];
    // M5 FIX: normalize conversationType to lowercase before validation (same as category normalization above)
    const rawConversationType = typeof obj.conversationType === 'string' ? obj.conversationType.toLowerCase() : '';
    const conversationType = validConversationTypes.includes(rawConversationType)
      ? (rawConversationType as Stage1Output['conversationType'])
      : 'coaching_question';

    const focusProbabilities: Record<string, number> = {};
    if (obj.focusProbabilities && typeof obj.focusProbabilities === 'object') {
      for (const [key, val] of Object.entries(obj.focusProbabilities as Record<string, unknown>)) {
        if (typeof val === 'number') focusProbabilities[key] = val;
      }
    }
    // Ensure at least one paragraph entry exists
    if (Object.keys(focusProbabilities).length === 0) {
      focusProbabilities['P1'] = 1.0;
    }

    // FIX 2.4: extract targetParagraphIndex and targetSentenceIndex from LLM output
    const targetParagraphIndex = typeof obj.targetParagraphIndex === 'number' ? obj.targetParagraphIndex : null;
    const targetSentenceIndex = typeof obj.targetSentenceIndex === 'number' ? obj.targetSentenceIndex : null;

    // W6.1: Parse cognitiveState with defensive fallback to 'engaged'
    const validCognitiveStates: CognitiveState[] = [
      'confused_about_feedback', 'confused_about_concept', 'curious_deeper',
      'curious_wider', 'frustrated', 'resistant_to_specific', 'resistant_to_general',
      'engaged', 'seeking_validation', 'overwhelmed',
    ];
    const rawCognitiveState = typeof obj.cognitiveState === 'string' ? obj.cognitiveState.toLowerCase() : '';
    const cognitiveState: CognitiveState = validCognitiveStates.includes(rawCognitiveState as CognitiveState)
      ? (rawCognitiveState as CognitiveState)
      : 'engaged'; // Defensive fallback — assume engaged if not parseable

    // Improvement 6: Parse scopeCertainty as explicit LLM routing signal
    const validScopeCertainties = ['high', 'moderate', 'low'] as const;
    const rawScopeCertainty = typeof obj.scopeCertainty === 'string' ? obj.scopeCertainty.toLowerCase() : '';
    const scopeCertainty: 'high' | 'moderate' | 'low' = (validScopeCertainties as readonly string[]).includes(rawScopeCertainty)
      ? (rawScopeCertainty as 'high' | 'moderate' | 'low')
      : 'moderate'; // Defensive fallback

    // Parse preferenceDurability (LLM-produced routing signal — Rule 7)
    const rawPrefDurability = typeof obj.preferenceDurability === 'string' ? obj.preferenceDurability.toLowerCase() : '';
    const preferenceDurability: 'general' | 'essay_specific' | null =
      rawPrefDurability === 'general' ? 'general' :
      rawPrefDurability === 'essay_specific' ? 'essay_specific' :
      null;

    return {
      category,
      emotionalValence: typeof obj.emotionalValence === 'number' ? obj.emotionalValence : 0,
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
      isExplicit: typeof obj.isExplicit === 'boolean' ? obj.isExplicit : true,
      isNovel: typeof obj.isNovel === 'boolean' ? obj.isNovel : true,
      focusProbabilities,
      // M5 FIX: normalize dimensionFocus values to lowercase at parse boundary
      dimensionFocus: Array.isArray(obj.dimensionFocus)
        ? (obj.dimensionFocus as string[]).map((d: string) => (typeof d === 'string' ? d.toLowerCase() : String(d).toLowerCase()))
        : [],
      conversationType,
      recentEditAware: typeof obj.recentEditAware === 'boolean' ? obj.recentEditAware : false,
      targetParagraphIndex,
      targetSentenceIndex,
      cognitiveState,
      scopeCertainty,
      preferenceDurability,
    };
  }

  private defaultStage1Output(paragraphCount: number): Stage1Output {
    const focusProbabilities: Record<string, number> = {};
    const uniform = 1 / Math.max(paragraphCount, 1);
    for (let i = 1; i <= paragraphCount; i++) {
      focusProbabilities[`P${i}`] = uniform;
    }
    return {
      category: 'clarification',
      emotionalValence: 0,
      confidence: 0.3,
      isExplicit: false,
      isNovel: false,
      focusProbabilities,
      dimensionFocus: [],
      conversationType: 'coaching_question',
      recentEditAware: false,
      targetParagraphIndex: null,
      targetSentenceIndex: null,
      cognitiveState: 'engaged',
      scopeCertainty: 'low',
      preferenceDurability: null,
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 2: CONTEXT ROUTING (no LLM)
  // --------------------------------------------------------------------------

  private runStage2ContextRouting(
    stage1: Stage1Output,
    profile: EssayProfile,
    recentEditContext?: string,
  ): { routingRule: RoutingRule; routingRequest: import('../profileManager/profileRouter').ContextRequest } {
    const { focusProbabilities, dimensionFocus, category, recentEditAware } = stage1;

    // Find highest-probability paragraph
    let maxProb = 0;
    let dominantParagraphLabel = '';
    for (const [label, prob] of Object.entries(focusProbabilities)) {
      if (prob > maxProb) {
        maxProb = prob;
        dominantParagraphLabel = label;
      }
    }

    // Parse paragraph index from label (e.g. "P2" → 1)
    const paragraphIndexMatch = dominantParagraphLabel.match(/P(\d+)/);
    const paragraphIndex = paragraphIndexMatch
      ? parseInt(paragraphIndexMatch[1], 10) - 1
      : 0;

    // Determine routing rule
    let routingRule: RoutingRule;

    const focusesOnVoice =
      dimensionFocus.some(d => d === 'voice') ||
      (category === 'preference' && dimensionFocus.some(d => ['style', 'tone', 'rhythm', 'register'].includes(d)));

    const focusesOnSpecificParagraph = maxProb > 0.5;

    const focusesOnSentenceWithEdit =
      recentEditAware &&
      recentEditContext &&
      maxProb > 0.5;

    if (focusesOnSentenceWithEdit) {
      routingRule = 'inline_edit_sentence';
    } else if (focusesOnVoice) {
      routingRule = 'l6_coaching_voice';
    } else if (focusesOnSpecificParagraph) {
      routingRule = 'l6_coaching_paragraph';
    } else {
      routingRule = 'l6_coaching_overview';
    }

    // FIX 2.4: resolve sentenceIndex for inline_edit_sentence routing
    // Prefer explicit indices from Stage 1 LLM extraction; fall back to 0 only if unavoidable.
    let resolvedParagraphIndex = focusesOnSpecificParagraph ? paragraphIndex : undefined;
    let resolvedSentenceIndex: number | undefined;

    if (routingRule === 'inline_edit_sentence') {
      // Use Stage 1's explicitly extracted indices if available
      if (stage1.targetParagraphIndex !== null) {
        resolvedParagraphIndex = stage1.targetParagraphIndex;
      }
      if (stage1.targetSentenceIndex !== null) {
        resolvedSentenceIndex = stage1.targetSentenceIndex;
      } else {
        // Fall back: use most recently discussed paragraph's last sentence as best-effort
        // (sentenceIndex left undefined — router will handle missing index gracefully)
        resolvedSentenceIndex = undefined;
      }
    }

    // Assemble routing request
    const routingRequest: import('../profileManager/profileRouter').ContextRequest = {
      rule: routingRule,
      paragraphIndex: resolvedParagraphIndex,
      sentenceIndex: resolvedSentenceIndex,
      searchTags: dimensionFocus.length > 0 ? dimensionFocus : undefined,
      tokenBudget: 8000,
    };

    return { routingRule, routingRequest };
  }

  // --------------------------------------------------------------------------
  // STAGE 3: COACHING RESPONSE (Sonnet)
  // THE MOST IMPORTANT PROMPT IN LAUNCH 3
  // --------------------------------------------------------------------------

  private async runStage3CoachingResponse(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    assembledContext: AssembledProfileContext,
    stage1: Stage1Output,
    coordinator: EssayProfileCoordinator,
    cognitiveAssessment: CognitiveAssessment,
    sessionMemory: CoachingSessionMemory,
    recentEditContext?: string,
    editStrategyContext?: string,
  ): Promise<{ response: string; s3Cost: LayerCost }> {
    const callStart = Date.now();
    const phase = profile.index.improvementPhase;
    const turnCount = sessionMemory.turnCount + 1;

    // ── BLOCK 1: STATIC coaching philosophy (always cached) ──
    const staticCoachingPhilosophy = `ROLE IDENTITY:
You are a senior essay coach. You've read thousands of essays and you
understand what makes writing work — not as a formula but as a craft.
You care about this student. You care about their essay. You want them
to write something that shows who they actually are, not who they think
admissions officers want to see.

YOUR VOICE:
- Warm but honest. You say hard things kindly, not because you're
  softening the blow but because the student is a person working hard
  on something that matters to them.
- Never patronizing. This student is intelligent. They may not know
  writing craft, but they know their own life and their own intentions.
  Respect both.
- Direct. "The essay needs..." not "You might consider..." You are the
  expert. Own your expertise without being arrogant about it.
- Specific. Quote their words back to them. Reference specific paragraphs
  and sentences. Generic advice is not coaching — it's a pamphlet.
- Treats writing as thinking, not decoration. The sentence structure
  isn't a cosmetic choice — it's how the writer's mind moves. The word
  "resilience" isn't just a cliche — it's the student reaching for a
  concept they haven't yet made their own. Help them find their own word.

BANNED PHRASES (these signal sycophancy — automatic failure):
- "Great question!"
- "That's a really interesting approach"
- "There's a lot to like here" (without citing what specifically)
- "You might consider..." (too tentative — say "The essay needs..." or "Try...")
- Any bullet list of 5+ generic suggestions without specific text references

DIALOGUE, NOT INSTRUCTION:
Great coaching is dialogic — the coach asks questions back, creates
productive confusion, lets the student arrive at insights themselves.

When the student asks a question, your FIRST instinct should be:
"Can I turn this into a question that leads them to discover the answer?"

NOT always — sometimes the student needs a direct answer. But the
default should be discovery, not delivery.

Examples:
  INSTRUCTION (default mode — sometimes right, often lazy):
    Student: "What's wrong with my opening?"
    Coach: "Your opening makes a philosophical claim that the rest of
    the essay doesn't earn through specific experience..."

  DIALOGUE (discovery mode — builds capacity):
    Student: "What's wrong with my opening?"
    Coach: "Read your opening sentence and then read the first sentence
    of P4. Which one sounds more like YOU? ... That difference is the
    key to your opening."

  PRODUCTIVE CONFUSION (advanced — use sparingly):
    Student: "I think my essay is about resilience."
    Coach: "Your essay uses the word 'resilience' once, in the last
    sentence. But it spends 200 words describing the way you
    rebuilt a circuit board at 2am. What if your essay isn't about
    resilience at all? What if it's about something the word 'resilience'
    can't quite reach?"

SILENCE AS A TOOL:
Sometimes the best response is NOT answering the student's question.
When the student asks something they could answer themselves with
a moment of reflection, consider:
  "That's the right question. Before I answer, re-read P3 and tell
  me: what do YOU think is happening there?"
This is NOT appropriate when:
- The student is frustrated (they need help, not Socratic interrogation)
- The student has already tried to answer and is stuck
- The question requires architectural knowledge the student doesn't have

STUDENT RESISTANCE — THREE TYPES:
When a student resists feedback, diagnose WHICH type of resistance:
1. "You're wrong about my essay" — They see something we don't.
   RESPONSE: Listen. Ask what they see. They might be right.
2. "I understand but the fix would lose something I care about" —
   They value something we haven't valued.
   RESPONSE: Validate the thing they're protecting. Then find a way to
   keep it while also fixing the problem.
3. "I don't want to do the work" — Avoidance disguised as preference.
   RESPONSE: Name it gently. Don't fight it — make the work smaller.
NEVER assume type 3. Start with type 1. If it's not type 1, check type 2.

When the student provides a CORRECTION (factual disagreement with the analysis):
ACKNOWLEDGE the correction immediately and directly. DO NOT defend the analysis — you got it wrong. Recalibrate your understanding and coach forward from the corrected basis.
NEVER: "Well, I can see how it could be read either way" (weaseling).

When the student gives CONFIRMATION (validates existing analysis):
Be brief. Don't re-explain what they already understand. Advance to the NEXT insight that builds on what they confirmed.

BREAKTHROUGH ENGINEERING:
Watch for opportunities to connect things the student has said in
DIFFERENT turns that THEY haven't connected. These connections often
produce the "aha" moment. The student said both pieces. The coach
connects them. The student owns the insight because it came from
their own words.

Watch for:
- Statements from different turns that create a tension
- A preference stated early that contradicts a choice made later
- An emotional reaction that reveals what the student actually cares
  about (often different from what they say they care about)
- A question the student keeps asking in different words (the
  underlying concern they haven't articulated)

HONESTY PROTOCOL:
Before responding, silently assess: Is this student's essay STRONG, ADEQUATE, or WEAK at their current improvement phase level?
- STRONG → acknowledge genuinely, focus on refinement
- ADEQUATE → encouraging but direct about gaps
- WEAK → be honest and kind. Name the issue clearly.
  DO NOT soften with "this is great, but..."
  DO say: "The structure has real potential. Right now [specific issue] is preventing the reader from experiencing [what the essay is trying to do]."

ADMISSIONS GROUNDING:
The AO at 4pm on their 30th essay gives you 3 sentences to hook them. Every piece of advice must be filtered through this reality.

REQUIRED in every substantive response:
- At least ONE direct quote from the student's essay
- A connection to the essay's architecture (North Star, structural roles, through-line)
- Honest assessment calibrated to the student's cognitive state

PHASE-AWARE COACHING — GUIDANCE, NOT RULES:
The phase tells you where to FOCUS attention and how to FRAME coaching. It does NOT tell you what to EXCLUDE. Your judgment.

${phase.level === 'foundation' ? `FOUNDATION — "The essay doesn't yet let the AO know who this person is"
The fundamental question: what does this essay REVEAL about you that nothing else in your application can?
PRIORITIZE: What is this essay actually about (not the topic — the revelation)? What does each paragraph contribute? Where does the reader lose the thread?
DEPRIORITIZE (but use when the teaching moment is powerful): word-level craft, sentence rhythm.` : ''}${phase.level === 'architecture' ? `ARCHITECTURE — "The essay has a clear point, but the reader's journey has gaps"
PRIORITIZE: paragraph transitions, pacing, structural roles. Does each paragraph earn the reader's continued attention?` : ''}${phase.level === 'craft' ? `CRAFT — "The structure works, now each sentence must carry its weight"
PRIORITIZE: specific sentences that are generic where they should be specific, moments that TELL instead of BUILD.
Give CONCRETE ALTERNATIVES: "Replace [abstraction] with the specific physical detail that would make an AO SEE this moment."` : ''}${phase.level === 'polish' ? `POLISH — "The essay is strong, now make it unforgettable"
PRIORITIZE: word-level precision, rhythm, voice consistency.` : ''}${phase.level === 'distinction' ? `DISTINCTION — "Make this essay the one they remember"
Not "good" — every admitted student writes a "good" essay. What makes this one the essay the AO brings up in committee?` : ''}

RESPONSE LENGTH:
Shorter is almost always better. A 150-word response that quotes 2
specific lines beats a 400-word essay about the student's essay.
${cognitiveAssessment.responseIntensity === 'brief' ? 'This turn calls for a BRIEF response — acknowledge and advance without elaboration.' : ''}

CONVERSATION EVOLUTION:
If the student returns to a topic previously discussed:
1. Do NOT rephrase your previous response
2. Go DEEPER: reference specific sentences you didn't cover before, explore a different dimension
3. If there's genuinely nothing new to add, say so honestly and suggest implementation

COACHING PATTERNS:
If you see coaching patterns listed below the conversation, use them to evolve your response.`;

    // ── BLOCK 2: Session-specific — essay text + profile context ──
    const profileContextText = this.buildProfileContextText(profile, assembledContext);

    // ── BLOCK 3: Turn-specific — conversation + current message + Stage 1 output ──
    const trimmedHistory = conversationHistory.slice(-MAX_HISTORY_TURNS);
    const conversationText = trimmedHistory.length > 0
      ? trimmedHistory.map(t => `${t.role === 'student' ? 'STUDENT' : 'COACH'}: ${t.content}`).join('\n\n')
      : '(No prior conversation — this is the first turn)';

    const editContextSection = recentEditContext
      ? `\n\nRECENT EDIT CONTEXT (student just made changes):\n${recentEditContext}`
      : '';

    // W9.3: Inject edit strategy and abandoned approaches context
    const editStrategySection = editStrategyContext
      ? `\n\n=== EDIT STRATEGY CONTEXT (student's editing journey) ===\n${editStrategyContext}\n` +
        `IMPORTANT: If the student has abandoned approaches listed above, do NOT suggest those same approaches again. ` +
        `Acknowledge their experimentation and build on what they learned from trying different directions.`
      : '';

    // FIX 1: Inject pattern insights so the coach can reference observed patterns
    const patternInsights = profile.patternInsights;
    const patternSection = patternInsights.length > 0
      ? `\n\n=== COACHING PATTERNS (observed across this conversation) ===\n` +
        patternInsights.map(p =>
          `- ${p.implication} (observed ${p.instanceCount} times)`
        ).join('\n')
      : '';

    // FIX C5.2: Build explicit anti-repetition context. When the student returns
    // to a topic already discussed, summarize what was ALREADY SAID so the model
    // can consciously avoid rephrasing and instead go deeper or redirect.
    const antiRepetitionSection = this.buildAntiRepetitionContext(
      studentMessage,
      stage1,
      trimmedHistory,
    );

    const stage1Section = `\nINSIGHT CLASSIFICATION (from pre-processing):\n` +
      `Category: ${stage1.category}\n` +
      `Emotional valence: ${stage1.emotionalValence > 0 ? 'positive' : stage1.emotionalValence < 0 ? 'negative' : 'neutral'}\n` +
      `Conversation type: ${stage1.conversationType}\n` +
      `Dimension focus: ${stage1.dimensionFocus.join(', ') || 'general'}`;

    // ── Improvement 6: Cognitive assessment context (from Stage 1.5) ──
    const cognitiveSection = `\n\n=== COGNITIVE ASSESSMENT (your inner perception of this student right now) ===
ASSESSMENT: ${cognitiveAssessment.assessment}
WHAT THEY NEED: ${cognitiveAssessment.whatTheyNeed}
RECOMMENDED APPROACH: ${cognitiveAssessment.recommendedApproach}

Use this assessment to calibrate your response. If the assessment says
"they need space," be brief. If it says "they're ready for a breakthrough,"
go deeper. If it says "they're performing understanding," test their
understanding with a question instead of accepting their paraphrase.`;

    // ── Improvement 6: Session arc context ──
    const sessionArcSection = turnCount <= 3
      ? `\n\n=== SESSION ARC (turn ${turnCount}) ===
EARLY SESSION: You're still learning who this student is and what they
see in their own essay. ASK more than you TELL. Understand their
relationship to this essay before coaching changes.`
      : turnCount <= 8
      ? `\n\n=== SESSION ARC (turn ${turnCount}) ===
MIDDLE SESSION: You've established rapport and identified the key issues.
Go DEEP on 1-2 issues rather than BROAD on 5.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : ''}`
      : `\n\n=== SESSION ARC (turn ${turnCount}) ===
LATE SESSION: Time to consolidate. What have you and the student figured
out together? What should their revision focus on? Resist the urge to
introduce new topics. Help them leave with clarity about their next step.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : ''}`;

    // ── W6.2: Escalation context for confused students ──
    const escalationSection = this.buildEscalationContext(stage1);

    // ── W6.3: Finding-aware coaching context ──
    const findingSection = this.buildFindingCoachingContext(coordinator);

    // FIX 3.8: system prompt = ONLY static coaching philosophy (cached).
    // Profile context moves to the user message so cache is not invalidated on every turn.
    const systemPrompt = staticCoachingPhilosophy;

    // FIX A1.3: include the essay text in the non-cached user message so the coach
    // can fulfill the REQUIRED constraint of quoting directly from the essay.
    // (Not in the system prompt — that is cached and stable across turns.)
    const essayText = profile.paragraphs.map((p, i) => `P${i + 1}: ${p.text}`).join('\n\n');

    // FIX 3.8: user message = profile context (dynamic) + essay text + conversation + current message
    const userPrompt = `===ESSAY + PROFILE CONTEXT===
${profileContextText}

===ESSAY TEXT (current version — quote directly when referencing specific moments)===
${essayText}
${findingSection}

===CONVERSATION===
${conversationText}

STUDENT (current message):
"${studentMessage}"
${editContextSection}
${stage1Section}
${cognitiveSection}
${sessionArcSection}
${escalationSection}
${patternSection}
${antiRepetitionSection}
${editStrategySection}

CURRENT IMPROVEMENT PHASE: ${phase.level.toUpperCase()}
Phase reasoning: ${phase.reasoning}
Focus areas for this phase: ${phase.focusAreas.join(', ')}
${phase.deferredAreas.length > 0 ? `Deferred (don't surface yet): ${phase.deferredAreas.join(', ')}` : ''}
COACHING LENS: ${phase.coachingLens}
READINESS: ${phase.readinessAssessment}

Respond to the student's message. Apply all constraints from your role identity. Write directly to the student — no meta-commentary about the profile or the system.`;

    // FIX 3.9: maxTokens 2048 (was 1024 — too tight for substantive coaching)
    //          temperature 0.4 (was 0.7 — lower reduces constraint violations)
    const response = await callClaude<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: 2048,
        temperature: 0.4,
        useJsonMode: false,
        cacheSystemPrompt: true,
      },
    );

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, SONNET);
    console.log(`[EssayIntelligence] L6: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const s3Cost: LayerCost = { layer: 'L6_S3_coaching_response', cost: rawCost, tokenUsage, timingMs };

    const responseText = typeof response.content === 'string' ? response.content : String(response.content);
    return { response: responseText, s3Cost };
  }

  /**
   * Build profile context text from assembled sections for Block 2.
   */
  private buildProfileContextText(
    profile: EssayProfile,
    assembledContext: AssembledProfileContext,
  ): string {
    const parts: string[] = [];

    // North Star summary (always)
    const ns = profile.index.northStarSummary;
    if (ns.throughLineSummary) {
      parts.push(`NORTH STAR: ${ns.throughLineSummary}`);
      const roles = ns.structuralRoles.map(r =>
        `  P${r.paragraphIndex + 1}: ${r.role} [${r.significance}]`
      ).join('\n');
      if (roles) parts.push(`STRUCTURAL ROLES:\n${roles}`);
    }

    // NOTE: Improvement phase is NOT included here to avoid duplication —
    // it is injected directly in the Stage 3 user prompt (BLOCK 3) where it
    // is more prominently visible to the model.

    // Active concerns (critical ones)
    const criticalConcerns = profile.index.activeConcerns.filter(c => c.severity === 'critical');
    if (criticalConcerns.length > 0) {
      parts.push(
        `CRITICAL CONCERNS:\n` +
        criticalConcerns.map(c =>
          `  P${c.location[0] + 1}${c.location[1] !== null ? `S${(c.location[1] ?? 0) + 1}` : ''}: ${c.concern}`
        ).join('\n'),
      );
    }

    // Assembled profile sections from router
    for (const section of assembledContext.sections) {
      if (section.name === 'profileIndex') continue; // Don't dump the raw index
      const sectionText = typeof section.content === 'string'
        ? section.content
        : JSON.stringify(section.content, null, 2);
      parts.push(`[${section.name.toUpperCase()}]\n${sectionText}`);
    }

    // Conversation insights already in profile (student-stated preferences, corrections)
    const recentInsights = profile.conversationInsights.slice(-5);
    if (recentInsights.length > 0) {
      const insightLines = recentInsights.map(i =>
        `  [${i.category.toUpperCase()}] "${i.sourceText}" (${i.durability})`
      );
      parts.push(`STUDENT-REVEALED CONTEXT:\n${insightLines.join('\n')}`);
    }

    return parts.join('\n\n');
  }

  // --------------------------------------------------------------------------
  // STAGE 4: PROFILE DEEPENING (conditional)
  // --------------------------------------------------------------------------

  private async runStage4ProfileDeepening(
    studentMessage: string,
    stage1: Stage1Output,
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    costs: LayerCost[],
  ): Promise<{
    insight: ConversationInsight | null;
    deepened: boolean;
    /** FIX 2.3: Stage 4 verdict — 'none' when Stage 4 was not run */
    verdict: Stage4Verdict;
    /** Phase 2: Finding IDs superseded by the student's reinterpretation */
    supersededFindingIds?: string[];
    /** FIX 2.3: Tension description when verdict === 'tensioned' */
    tensionDescription?: string;
  }> {
    const { category } = stage1;

    // Build insight scope from focus probabilities
    const scope = this.buildInsightScope(stage1.focusProbabilities, profile.paragraphs.length);

    // Assign durability based on category
    const durability = this.assignDurability(category, stage1);

    // Generate a unique ID for this insight
    const insightId = `insight_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // FIX 3.10: derive a real version number from editHistory (monotonic counter), not a layer number.
    const currentEssayVersion = profile.editHistory.length > 0
      ? profile.editHistory[profile.editHistory.length - 1].version
      : 1;

    switch (category) {
      case 'confirmation': {
        // No LLM. Store insight only — confidence boost happens via stored insight.
        const insight: ConversationInsight = {
          id: insightId,
          timestamp: now,
          sourceText: studentMessage,
          category: 'confirmation',
          emotionalValence: this.mapNumericValence(stage1.emotionalValence),
          studentConfidence: 'high',
          explicitness: stage1.isExplicit ? 'explicit' : 'implicit',
          scopeCertainty: stage1.scopeCertainty,
          novelty: stage1.isNovel ? 'moderate' : 'low',
          scope,
          durability,
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insight);
        return { insight, deepened: false, verdict: 'none' };
      }

      case 'reinterpretation': {
        // Phase 2: Finding-based reinterpretation evaluation
        // Sonnet evaluates which findings are confirmed/superseded/tensioned.
        // Finding supersession is applied directly via FindingStore inside runReinterpretationDeepening.
        const {
          reinterpretInsight, reinterpretCost, verdict,
          supersededFindingIds, tensionDescription,
        } = await this.runReinterpretationDeepening(
            studentMessage,
            profile,
            scope,
            insightId,
            now,
            stage1,
            currentEssayVersion,
            coordinator,
          );
        costs.push(reinterpretCost);

        // Store the conversation insight for record
        coordinator.applyConversationInsight(reinterpretInsight);

        return {
          insight: reinterpretInsight,
          deepened: true,
          verdict,
          ...(supersededFindingIds !== undefined && { supersededFindingIds }),
          ...(tensionDescription !== undefined && { tensionDescription }),
        };
      }

      case 'new_context': {
        // Sonnet call to integrate new background information
        const { newContextInsight, newContextCost, verdict: ncVerdict } = await this.runNewContextDeepening(
          studentMessage,
          profile,
          scope,
          insightId,
          now,
          stage1,
          currentEssayVersion,
        );
        costs.push(newContextCost);

        coordinator.applyConversationInsight(newContextInsight);
        return { insight: newContextInsight, deepened: true, verdict: ncVerdict };
      }

      case 'correction': {
        // Lower confidence on targeted observation. No LLM needed.
        const insight: ConversationInsight = {
          id: insightId,
          timestamp: now,
          sourceText: studentMessage,
          category: 'correction',
          emotionalValence: this.mapNumericValence(stage1.emotionalValence),
          studentConfidence: 'high',
          explicitness: 'explicit',
          scopeCertainty: stage1.scopeCertainty,
          novelty: 'high',
          scope,
          durability,
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insight);
        return { insight, deepened: false, verdict: 'none' };
      }

      case 'preference': {
        // Record as insight. No profile structural change.
        const insight: ConversationInsight = {
          id: insightId,
          timestamp: now,
          sourceText: studentMessage,
          category: 'preference',
          emotionalValence: this.mapNumericValence(stage1.emotionalValence),
          studentConfidence: 'high',
          explicitness: stage1.isExplicit ? 'explicit' : 'implicit',
          scopeCertainty: 'moderate',
          novelty: stage1.isNovel ? 'high' : 'low',
          scope,
          durability,
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insight);
        return { insight, deepened: false, verdict: 'none' };
      }

      case 'clarification': {
        // No profile update for clarification requests.
        return { insight: null, deepened: false, verdict: 'none' };
      }

      case 'emotional_reaction': {
        // Record as insight with emotional_reaction category.
        const insight: ConversationInsight = {
          id: insightId,
          timestamp: now,
          sourceText: studentMessage,
          category: 'emotional_reaction',
          emotionalValence: this.mapNumericValence(stage1.emotionalValence),
          studentConfidence: 'moderate',
          explicitness: stage1.isExplicit ? 'explicit' : 'implicit',
          scopeCertainty: 'low',
          novelty: 'moderate',
          scope,
          durability,
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insight);
        return { insight, deepened: false, verdict: 'none' };
      }

      case 'resistance': {
        // Record as insight. Flag as artistic intent — system should suppress the rejected suggestion.
        const insight: ConversationInsight = {
          id: insightId,
          timestamp: now,
          sourceText: studentMessage,
          category: 'resistance',
          emotionalValence: this.mapNumericValence(stage1.emotionalValence),
          studentConfidence: 'high',
          explicitness: 'explicit',
          scopeCertainty: stage1.scopeCertainty,
          novelty: 'moderate',
          scope,
          durability: 'essay_durable', // Resistance is always essay-durable — remember it
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insight);
        return { insight, deepened: false, verdict: 'none' };
      }

      default: {
        // TypeScript exhaustiveness guard
        const _exhaustive: never = category;
        console.warn(`[CoachingService] Unhandled insight category: ${_exhaustive}`);
        return { insight: null, deepened: false, verdict: 'none' };
      }
    }
  }

  /**
   * Stage 4 Sonnet call for REINTERPRETATION: evaluate student's alternative reading.
   * FIX 2.3: returns verdict, supersededFindingIds, tensionDescription so caller
   *          can propagate them to CoachingResult for the orchestrator to act on.
   */
  private async runReinterpretationDeepening(
    studentMessage: string,
    profile: EssayProfile,
    scope: InsightScope,
    insightId: string,
    now: string,
    stage1: Stage1Output,
    essayVersion: number,
    coordinator: EssayProfileCoordinator,
  ): Promise<{
    reinterpretInsight: ConversationInsight;
    reinterpretCost: LayerCost;
    verdict: Stage4Verdict;
    supersededFindingIds?: string[];
    tensionDescription?: string;
  }> {
    const callStart = Date.now();

    // Phase 2: Gather findings + primaryFunctions from the targeted scope area
    const { context: targetedContext, findingIds: targetedFindingIds } = this.gatherTargetedFindings(
      profile, coordinator, scope,
    );

    const systemPrompt = `You are evaluating a student's reinterpretation of their own essay against the existing analytical understanding of it.

Your task: evaluate whether the student's alternative reading is supported, contradicted, or in tension with the essay text as understood.`;

    // H3 FIX: Include the full essay text so the model can quote specific textual evidence.
    const essayText = profile.paragraphs.map((p, i) => `P${i + 1}: ${p.text}`).join('\n\n');

    const userPrompt = `The student has offered a REINTERPRETATION of their own essay.

=== ESSAY TEXT ===
${essayText}

=== CURRENT UNDERSTANDING OF THE TARGETED AREA ===
${targetedContext || '  (No understanding available for this scope)'}

Student says: "${studentMessage}"

EVALUATE this reinterpretation:
1. Does the text SUPPORT this reading? (Quote specific textual evidence from the essay above)
2. Does the text CONTRADICT this reading? (Quote specific textual evidence from the essay above)
3. Is this a VALID alternative the text permits?

Classify each finding ([F] label) listed above:
- CONFIRMED: still valid with new reinterpretation
- SUPERSEDED: replaced by reinterpretation
- TENSIONED: student intent conflicts with text (coaching opportunity — student may need to revise text to match intent)

Output JSON:
{
  "evaluationSummary": "<1-2 sentence synthesis>",
  "confirmedFindings": ["F1", "F3"],
  "supersededFindings": ["F2"],
  "tensionedFindings": [],
  "newUnderstanding": "<revised understanding that incorporates the student's reinterpretation>"
}`;

    const response = await callClaude<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: 512,
        temperature: 0.3,
        useJsonMode: false,
        cacheSystemPrompt: true,
      },
    );

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, SONNET);
    console.log(`[EssayIntelligence] L6: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const reinterpretCost: LayerCost = {
      layer: 'L6_S4_reinterpretation',
      cost: rawCost,
      tokenUsage,
      timingMs,
    };

    // Parse Stage 4 reinterpretation output (4-level defensive)
    const parsed = this.parseStage4Output<Stage4ReinterpretationOutput>(
      response.content as string,
    );

    const reinterpretInsight: ConversationInsight = {
      id: insightId,
      timestamp: now,
      sourceText: studentMessage,
      category: 'reinterpretation',
      emotionalValence: this.mapNumericValence(stage1.emotionalValence),
      studentConfidence: 'high',
      explicitness: stage1.isExplicit ? 'explicit' : 'implicit',
      scopeCertainty: stage1.scopeCertainty,
      novelty: 'high',
      scope,
      durability: 'essay_durable',
      essayVersion,
    };

    // Phase 2: derive verdict from parsed output and apply finding supersession directly
    let verdict: Stage4Verdict = 'none';
    let supersededFindingIds: string[] | undefined;
    let tensionDescription: string | undefined;

    if (parsed) {
      console.log(
        `[CoachingService] Reinterpretation — confirmed=${parsed.confirmedFindings.length}, ` +
        `superseded=${parsed.supersededFindings.length}, tensioned=${parsed.tensionedFindings.length}`,
      );

      if (parsed.supersededFindings.length > 0) {
        verdict = 'superseded';
        // Phase 2: Apply finding supersession directly via FindingStore
        // This replaces the 100-line FIX C3.2 observation text-matching block
        const findingStore = coordinator.getFindingStore();
        supersededFindingIds = [];
        for (const fId of parsed.supersededFindings) {
          // Only supersede findings we actually targeted (guard against hallucinated IDs)
          if (targetedFindingIds.includes(fId)) {
            try {
              findingStore.updateMaturity(
                fId,
                'superseded',
                `Student reinterpretation: "${studentMessage}"`,
                `coaching_turn:${insightId}`,
              );
              supersededFindingIds.push(fId);
            } catch (e) {
              console.warn(`[CoachingService] Failed to supersede finding ${fId}:`, e);
            }
          }
        }
        console.log(
          `[CoachingService] Finding supersession applied — superseded: [${supersededFindingIds.join(', ')}]`,
        );

        // W3.1: Reverse-propagate supersession to sentence-level understanding.
        // When findings are superseded, the sentences they covered may have stale
        // inferredIntents. Rebuild from remaining active findings so sentence
        // understanding stays coherent with the finding layer.
        if (supersededFindingIds.length > 0) {
          const affectedSentences = new Map<string, { paragraph: number; sentence: number }>();

          // Collect all sentences covered by the superseded findings
          for (const fId of supersededFindingIds) {
            const finding = findingStore.get(fId);
            if (!finding?.scope) continue;

            const sentences = finding.scope.sentences ?? [];
            const para = finding.scope.paragraph;
            if (para === undefined) continue;

            for (const s of sentences) {
              affectedSentences.set(`P${para}S${s}`, { paragraph: para, sentence: s });
            }
          }

          // For each affected sentence, rebuild inferredIntents from remaining active findings
          for (const [, loc] of affectedSentences) {
            const activeFindings = findingStore.getActive().filter(f =>
              f.scope?.paragraph === loc.paragraph &&
              f.scope?.sentences?.includes(loc.sentence) &&
              (f.dimensions.includes('voice') || f.dimensions.includes('narrative') || f.dimensions.includes('character'))
            );

            const updatedIntents: ObservationEntry[] = activeFindings.map(f => ({
              observation: f.claim,
              confidence: f.maturity === 'confirmed' || f.maturity === 'deepened' ? 0.95 : f.maturity === 'developing' ? 0.6 : 0.5,
              evidence: f.evidence?.[0]?.text ?? '(from finding)',
            }));

            // Apply via coordinator to trigger staleness tracking
            coordinator.applySentenceUnderstandingDirect(loc.paragraph, loc.sentence, {
              inferredIntents: updatedIntents,
            });
          }

          if (affectedSentences.size > 0) {
            console.log(
              `[CoachingService] Reverse-propagated supersession to ${affectedSentences.size} affected sentence(s)`,
            );
          }
        }
      } else if (parsed.tensionedFindings.length > 0) {
        verdict = 'tensioned';
        tensionDescription = `Student intent tensions with text: ${parsed.tensionedFindings.join(', ')}. ${parsed.evaluationSummary}`;
      } else if (parsed.confirmedFindings.length > 0) {
        verdict = 'confirmed';
      }
    }

    return {
      reinterpretInsight,
      reinterpretCost,
      verdict,
      supersededFindingIds,
      tensionDescription,
    };
  }

  /**
   * Stage 4 Sonnet call for NEW_CONTEXT: integrate background information.
   * FIX 2.3: returns verdict so caller can propagate to CoachingResult.
   */
  private async runNewContextDeepening(
    studentMessage: string,
    profile: EssayProfile,
    scope: InsightScope,
    insightId: string,
    now: string,
    stage1: Stage1Output,
    essayVersion: number,
  ): Promise<{ newContextInsight: ConversationInsight; newContextCost: LayerCost; verdict: Stage4Verdict }> {
    const callStart = Date.now();

    const northStarSummary = profile.index.northStarSummary.throughLineSummary ?? '(not yet synthesized)';

    const systemPrompt = `You are integrating new background information a student has revealed about their essay — information that was NOT in the essay text.

Your task: determine how this new context changes the understanding of the essay.`;

    // H3 FIX: Include the full essay text so the model can ground its integration
    // in specific textual evidence. Without it, the model can only reference the North Star summary.
    const essayText = profile.paragraphs.map((p, i) => `P${i + 1}: ${p.text}`).join('\n\n');

    const userPrompt = `The student has revealed NEW CONTEXT about their essay.

=== ESSAY TEXT ===
${essayText}

Current essay North Star: "${northStarSummary}"
Current understanding depth: ${profile.index.confidenceLevel}

Student reveals: "${studentMessage}"

INTEGRATE this new context:
1. Which existing sections of understanding does this change? (List by name: voiceIdentity, emotionalTopography, etc.)
2. What is the updated understanding that incorporates this context?
3. Are there any coaching implications — things the essay needs to change to honor this context?

Output JSON:
{
  "updatedUnderstanding": "<revised understanding incorporating student's context>",
  "affectedSections": ["emotionalTopography", "characterRevelation"],
  "integrationNotes": "<coaching implications of this new context>"
}`;

    const response = await callClaude<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: 512,
        temperature: 0.3,
        useJsonMode: false,
        cacheSystemPrompt: true,
      },
    );

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, SONNET);
    console.log(`[EssayIntelligence] L6: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const newContextCost: LayerCost = {
      layer: 'L6_S4_new_context',
      cost: rawCost,
      tokenUsage,
      timingMs,
    };

    const parsed = this.parseStage4Output<Stage4NewContextOutput>(response.content as string);

    // FIX 2.3: new_context always produces a 'confirmed' verdict (we integrated context,
    // existing understanding is now enriched not superseded). Use 'confirmed' to signal
    // the orchestrator that Stage 4 ran and produced valid output.
    const verdict: Stage4Verdict = parsed ? 'confirmed' : 'none';

    if (parsed) {
      console.log(
        `[CoachingService] New context integrated — sections affected: ${parsed.affectedSections.join(', ')}`,
      );
    }

    const newContextInsight: ConversationInsight = {
      id: insightId,
      timestamp: now,
      sourceText: studentMessage,
      category: 'new_context',
      emotionalValence: this.mapNumericValence(stage1.emotionalValence),
      studentConfidence: 'high',
      explicitness: 'explicit',
      scopeCertainty: 'moderate',
      novelty: 'high',
      scope,
      durability: 'essay_durable',
      essayVersion,
    };

    return { newContextInsight, newContextCost, verdict };
  }

  // --------------------------------------------------------------------------
  // STAGE 5: PHASE CHECK (conditional, after deepening)
  // --------------------------------------------------------------------------

  private runStage5PhaseCheck(
    profile: EssayProfile,
    _coordinator: EssayProfileCoordinator,
  ): void {
    // Phase formally shifts via L3.5 re-analysis, not L6 coaching turns. The improvement
    // phase depends on paragraph effectiveness scores (L3.5 output) which L6 cannot produce.
    //
    // However, Stage 5 serves two purposes:
    // 1. DIAGNOSTIC: Log readiness state so we can detect when re-analysis is overdue
    // 2. SIGNAL: Warn when conversation insights have accumulated enough changes that
    //    the current phase may be stale (e.g., major reinterpretation superseded 3+ observations)
    const phase = profile.index.improvementPhase;
    const readiness = phase.legacyReadiness;

    // Count recent high-impact insights (reinterpretations + corrections)
    const highImpactInsights = profile.conversationInsights.filter(
      i => i.category === 'reinterpretation' || i.category === 'correction' || i.category === 'new_context'
    );
    const recentHighImpact = highImpactInsights.filter(i => {
      const age = Date.now() - new Date(i.timestamp).getTime();
      return age < 30 * 60 * 1000; // Last 30 minutes
    });

    if (recentHighImpact.length >= 3) {
      console.warn(
        `[CoachingService] Stage 5 PHASE STALE WARNING — ${recentHighImpact.length} high-impact insights ` +
        `(${recentHighImpact.map(i => i.category).join(', ')}) in last 30 min. ` +
        `Current phase (${phase.level}) may need re-evaluation via L3.5 re-analysis. ` +
        `Readiness: essay=${readiness.essayLevel}, para=${readiness.paragraphLevel}, ` +
        `sentence=${readiness.sentenceLevel}, word=${readiness.wordLevel}`,
      );
    } else {
      console.log(
        `[CoachingService] Stage 5 phase check — phase=${phase.level}, ` +
        `recentHighImpactInsights=${recentHighImpact.length}, ` +
        `readiness=[${readiness.essayLevel},${readiness.paragraphLevel},${readiness.sentenceLevel},${readiness.wordLevel}]`,
      );
    }
  }

  // --------------------------------------------------------------------------
  // PATTERN DETECTION (LLM-based — Improvement 6)
  // --------------------------------------------------------------------------

  /**
   * Detect coaching patterns via Haiku assessment.
   * Replaces keyword-based pattern matching with semantic understanding.
   *
   * Called every 3 turns. Also updates session arc, next focus suggestion,
   * learning style observations, and quality signals.
   *
   * Cost: ~$0.002-0.004 per call (negligible).
   */
  private async detectPatternsLLM(
    conversationHistory: ConversationTurn[],
    currentMessage: string,
    profile: EssayProfile,
    sessionMemory: CoachingSessionMemory,
  ): Promise<{
    patterns: PatternInsight[];
    sessionArcUpdate: string;
    nextFocusSuggestion: string;
    learningStyleUpdate: string | null;
    qualitySignals: CoachingQualitySignals;
    cost: LayerCost;
  }> {
    const callStart = Date.now();
    const now = new Date().toISOString();

    const systemPrompt = `You are analyzing a coaching conversation for patterns. You detect:
1. BEHAVIORAL PATTERNS: What the student keeps returning to, avoiding, or struggling with
2. LEARNING STYLE signals: How the student responds to different coaching approaches
3. SESSION ARC: Where this conversation is in its natural arc (opening/middle/closing)
4. NEXT FOCUS: What the conversation should prioritize next
5. QUALITY SIGNALS: Is coaching landing? (vocabulary evolution, question quality, revision sophistication)

Be honest about what you see. "Student is avoiding P3 despite it being the weakest paragraph" is useful. "Student is engaged" is not.

Output JSON:
{
  "patterns": [
    {
      "pattern": "<what you observe>",
      "evidence": ["<specific things the student said>"],
      "implication": "<what this means for coaching strategy>",
      "instanceCount": <number>
    }
  ],
  "sessionArcUpdate": "<2-3 sentences: where is this conversation and where should it go?>",
  "nextFocusSuggestion": "<1 sentence: what should the next turn focus on?>",
  "learningStyleUpdate": "<1 sentence observation about how this student learns, or null if no new signal>",
  "qualitySignals": {
    "vocabularyEvolution": "<adopting_architectural_language|stable|not_yet>",
    "questionQualityTrend": "<improving|stable|declining>",
    "revisionSophistication": "<architectural|surface|not_yet_discussed>",
    "studentInitiation": "<high|moderate|low>",
    "breakthroughMoments": <number>
  }
}`;

    const historyText = conversationHistory
      .map(t => `${t.role.toUpperCase()}: ${t.content}`)
      .join('\n\n');

    const userPrompt = `FULL CONVERSATION (${conversationHistory.length} turns):
${historyText}

CURRENT MESSAGE:
"${currentMessage}"

CURRENT SESSION MEMORY:
Topics: ${sessionMemory.topicsDiscussed.map(t => t.topic).join(', ') || 'none yet'}
Student stances: ${sessionMemory.studentStances.map(s => s.stance).join('; ') || 'none'}
Approaches used: ${sessionMemory.approachesUsed.map(a => a.approach).join(', ') || 'none yet'}

ESSAY PHASE: ${profile.index.improvementPhase.level}

Detect patterns. Be specific. Reference actual student quotes.
Output only JSON.`;

    const response = await callClaude<string>({
      model: HAIKU,
      systemPrompt,
      userPrompt,
      maxTokens: 600,
      temperature: 0.3,
      useJsonMode: false,
      cacheSystemPrompt: true,
    });

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, HAIKU);
    console.log(`[EssayIntelligence] L6 pattern detection: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const cost: LayerCost = { layer: 'L6_pattern_detection', cost: rawCost, tokenUsage, timingMs };

    // Parse with defensive fallback
    const parsed = this.parseStage4Output<{
      patterns: Array<{ pattern: string; evidence: string[]; implication: string; instanceCount: number }>;
      sessionArcUpdate: string;
      nextFocusSuggestion: string;
      learningStyleUpdate: string | null;
      qualitySignals: CoachingQualitySignals;
    }>(response.content as string);

    if (!parsed) {
      return {
        patterns: [],
        sessionArcUpdate: sessionMemory.sessionArcSummary || 'Session in progress',
        nextFocusSuggestion: sessionMemory.nextFocus || 'Continue current topic',
        learningStyleUpdate: null,
        qualitySignals: {
          vocabularyEvolution: 'not_yet',
          questionQualityTrend: 'stable',
          revisionSophistication: 'not_yet_discussed',
          studentInitiation: 'moderate',
          breakthroughMoments: 0,
        },
        cost,
      };
    }

    // Convert to PatternInsight[]
    const patterns: PatternInsight[] = (parsed.patterns ?? []).map(p => ({
      id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pattern: p.pattern,
      evidence: p.evidence ?? [],
      implication: p.implication ?? '',
      firstObservedAt: now,
      lastObservedAt: now,
      instanceCount: p.instanceCount ?? 1,
    }));

    return {
      patterns,
      sessionArcUpdate: parsed.sessionArcUpdate ?? 'Session in progress',
      nextFocusSuggestion: parsed.nextFocusSuggestion ?? 'Continue current topic',
      learningStyleUpdate: parsed.learningStyleUpdate ?? null,
      qualitySignals: parsed.qualitySignals ?? {
        vocabularyEvolution: 'not_yet',
        questionQualityTrend: 'stable',
        revisionSophistication: 'not_yet_discussed',
        studentInitiation: 'moderate',
        breakthroughMoments: 0,
      },
      cost,
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 1.5: COGNITIVE ASSESSMENT (Improvement 6 — Haiku LLM-assessed state)
  // --------------------------------------------------------------------------

  /**
   * Stage 1.5: LLM-assessed cognitive-emotional state.
   *
   * A single Haiku call that reads the student's message IN CONTEXT
   * and produces a brief prose assessment. This assessment is injected
   * into the Stage 3 prompt to shape the coaching response.
   *
   * WHY a separate call (not folded into Stage 1 or Stage 3):
   * - Stage 1 is classification (structured JSON). Adding prose assessment
   *   to the same call degrades both outputs.
   * - Stage 3 needs the assessment AS INPUT — it can't produce and consume
   *   it in the same call.
   * - Haiku is cheap (~$0.001 per call). The quality gain is worth it.
   */
  private async runStage1_5CognitiveAssessment(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    stage1: Stage1Output,
    sessionMemory: CoachingSessionMemory,
    learningStyle: LearningStyleObservations,
  ): Promise<{ assessment: CognitiveAssessment; cost: LayerCost }> {
    const callStart = Date.now();

    // Only include last 8 turns for cognitive assessment
    const recentHistory = conversationHistory.slice(-8);

    const systemPrompt = `You are assessing a student's cognitive-emotional state during an essay coaching session. You read their message in the full context of the conversation and produce a brief, honest assessment that will shape the coach's response.

You are NOT the coach. You are the coach's inner voice — the moment of perception before response. Be honest about what you see, including uncomfortable truths:
- "They're performing understanding" (using our words without comprehending)
- "They're right and we were wrong about P3"
- "They're avoiding the real issue by focusing on word choice"
- "They're ready for a breakthrough but need one more push"
- "They need space — this turn should be minimal"

Your assessment should be 2-4 sentences. Be specific. Reference the conversation context.

RESPONSE INTENSITY:
Also assess how MUCH coaching this turn needs:
- "full": substantive — the student needs real coaching content
- "brief": shorter — acknowledge and advance, don't elaborate
- "minimal": acknowledge only — the student needs space, is confirming
  understanding that doesn't need elaboration, or just needs to know
  you heard them

Output JSON:
{
  "assessment": "<2-4 sentences: what is the student's cognitive-emotional state RIGHT NOW?>",
  "whatTheyNeed": "<1-2 sentences: what does the student need from the coach in this specific turn?>",
  "recommendedApproach": "<1 sentence: what coaching approach would serve this moment best?>",
  "responseIntensity": "<full|brief|minimal>"
}`;

    const historyText = recentHistory.length > 0
      ? recentHistory.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
      : '(First turn — no prior conversation)';

    const sessionContext = sessionMemory.turnCount > 0
      ? `\nSESSION CONTEXT (${sessionMemory.turnCount} turns so far):\n` +
        `Arc: ${sessionMemory.sessionArcSummary}\n` +
        `Next focus: ${sessionMemory.nextFocus}\n` +
        (sessionMemory.studentStances.length > 0
          ? `Student stances: ${sessionMemory.studentStances.map(s => s.stance).join('; ')}\n`
          : '') +
        (sessionMemory.approachesUsed.length > 0
          ? `Recent approaches: ${sessionMemory.approachesUsed.slice(-3).map(a => `${a.approach} → ${a.outcome}`).join('; ')}\n`
          : '')
      : '';

    const learningContext = learningStyle.observations.length > 0
      ? `\nLEARNING STYLE OBSERVATIONS:\n` +
        learningStyle.observations
          .filter(o => o.confidence !== 'tentative')
          .map(o => `- ${o.observation}`)
          .join('\n')
      : '';

    const userPrompt = `CONVERSATION HISTORY:
${historyText}

STUDENT'S CURRENT MESSAGE:
"${studentMessage}"

CLASSIFICATION (from Stage 1): ${stage1.category}, ${stage1.conversationType}
EMOTIONAL VALENCE: ${stage1.emotionalValence > 0 ? 'positive' : stage1.emotionalValence < 0 ? 'negative' : 'neutral'}
${sessionContext}${learningContext}

Assess this student's cognitive-emotional state. Be honest. Be specific.
Output only JSON.`;

    const response = await callClaude<string>({
      model: HAIKU,
      systemPrompt,
      userPrompt,
      maxTokens: 300,
      temperature: 0.3,
      useJsonMode: false,
      cacheSystemPrompt: true,
    });

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, HAIKU);
    console.log(`[EssayIntelligence] L6 S1.5: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const cost: LayerCost = { layer: 'L6_S1.5_cognitive_assessment', cost: rawCost, tokenUsage, timingMs };

    // Parse with defensive fallback
    const parsed = this.parseStage4Output<{
      assessment: string;
      whatTheyNeed: string;
      recommendedApproach: string;
      responseIntensity: string;
    }>(response.content as string);

    if (!parsed) {
      // Fallback: provide a neutral assessment that won't break the pipeline
      return {
        assessment: {
          assessment: 'Student is engaging with the coaching. Unable to assess specific cognitive state from this message.',
          whatTheyNeed: 'A thoughtful coaching response addressing their question or comment.',
          recommendedApproach: 'Standard coaching — respond to the content of their message.',
          responseIntensity: 'full',
        },
        cost,
      };
    }

    // Validate responseIntensity
    const validIntensities = ['full', 'brief', 'minimal'] as const;
    const rawIntensity = typeof parsed.responseIntensity === 'string' ? parsed.responseIntensity.toLowerCase() : 'full';
    const responseIntensity: 'full' | 'brief' | 'minimal' = (validIntensities as readonly string[]).includes(rawIntensity)
      ? (rawIntensity as 'full' | 'brief' | 'minimal')
      : 'full';

    return {
      assessment: {
        assessment: parsed.assessment ?? 'Unable to assess.',
        whatTheyNeed: parsed.whatTheyNeed ?? 'A coaching response.',
        recommendedApproach: parsed.recommendedApproach ?? 'Standard coaching.',
        responseIntensity,
      },
      cost,
    };
  }

  // --------------------------------------------------------------------------
  // MINIMAL RESPONSE (Improvement 6 — Haiku for lightweight turns)
  // --------------------------------------------------------------------------

  /**
   * Generate a minimal/brief acknowledgment when the cognitive assessment
   * determines the student doesn't need a full coaching response.
   *
   * Uses Haiku for speed and cost — no profile context needed.
   */
  private async generateMinimalResponse(
    studentMessage: string,
    assessment: CognitiveAssessment,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
  ): Promise<{ response: string; cost: LayerCost }> {
    const callStart = Date.now();

    const recentHistory = conversationHistory.slice(-4);
    const historyText = recentHistory.length > 0
      ? recentHistory.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
      : '';

    const systemPrompt = `You are a senior essay coach giving a brief, natural acknowledgment. Be warm but not effusive. Be specific to what the student said — not generic.

Do NOT:
- Say "Great question!" or any sycophantic opener
- Repeat what you've already explained
- Turn a minimal moment into a teaching opportunity
- Use more than 2-3 sentences

DO:
- Acknowledge what they said specifically
- If appropriate, briefly advance to what's next
- Sound like a real person, not a chatbot`;

    const userPrompt = `${historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''}STUDENT: "${studentMessage}"

ASSESSMENT: ${assessment.assessment}
WHAT THEY NEED: ${assessment.whatTheyNeed}

Respond briefly. 1-3 sentences max.`;

    const response = await callClaude<string>({
      model: HAIKU,
      systemPrompt,
      userPrompt,
      maxTokens: 150,
      temperature: 0.4,
      useJsonMode: false,
      cacheSystemPrompt: true,
    });

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, HAIKU);
    console.log(`[EssayIntelligence] L6 minimal: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const cost: LayerCost = { layer: 'L6_S3_minimal_response', cost: rawCost, tokenUsage, timingMs };

    const responseText = typeof response.content === 'string' ? response.content : String(response.content);
    return { response: responseText, cost };
  }

  // --------------------------------------------------------------------------
  // SESSION MEMORY MANAGEMENT (Improvement 6)
  // --------------------------------------------------------------------------

  /**
   * Initialize an empty session memory for the first coaching turn.
   */
  private initializeSessionMemory(): CoachingSessionMemory {
    return {
      turnCount: 0,
      topicsDiscussed: [],
      approachesUsed: [],
      studentStances: [],
      sessionArcSummary: '',
      nextFocus: '',
    };
  }

  /**
   * Initialize empty learning style observations.
   */
  private initializeLearningStyle(): LearningStyleObservations {
    return {
      observations: [],
    };
  }

  /**
   * Update session memory after a coaching turn completes.
   * Partly deterministic (turn count, stances) and partly
   * populated by LLM pattern detection (session arc, next focus).
   */
  private updateSessionMemory(
    sessionMemory: CoachingSessionMemory,
    studentMessage: string,
    stage1: Stage1Output,
    cognitiveAssessment: CognitiveAssessment,
  ): CoachingSessionMemory {
    const turnNumber = sessionMemory.turnCount + 1;

    // Track the approach used this turn
    sessionMemory.approachesUsed.push({
      turnNumber,
      approach: cognitiveAssessment.recommendedApproach,
      // Outcome is assessed by the NEXT turn's pattern detection
      outcome: 'pending',
    });

    // Track student stances (from Stage 1 classification)
    if (stage1.category === 'resistance' || stage1.category === 'preference') {
      sessionMemory.studentStances.push({
        stance: studentMessage.substring(0, 200),
        turnNumber,
      });
    }

    sessionMemory.turnCount = turnNumber;
    return sessionMemory;
  }

  // --------------------------------------------------------------------------
  // W6.1–W6.3: COGNITIVE STATE, ESCALATION, AND FINDING-AWARE COACHING
  // --------------------------------------------------------------------------

  /**
   * W6.2: Update confusion tracking based on the inferred cognitive state.
   *
   * When cognitiveState is confused_about_feedback or confused_about_concept,
   * increments the confusion counter for the detected topic(s).
   * When cognitiveState is 'engaged' or 'curious_deeper', resets the counter
   * for those topics (student has demonstrated understanding).
   */
  private updateConfusionTracking(stage1: Stage1Output): void {
    const { cognitiveState, dimensionFocus } = stage1;

    // Derive topic key from dimension focus (or 'general' if none)
    const topics = dimensionFocus.length > 0 ? dimensionFocus : ['general'];

    const isConfused =
      cognitiveState === 'confused_about_feedback' ||
      cognitiveState === 'confused_about_concept';

    const showsUnderstanding =
      cognitiveState === 'engaged' ||
      cognitiveState === 'curious_deeper';

    for (const topic of topics) {
      if (isConfused) {
        const existing = this.confusionTrackers.get(topic);
        if (existing) {
          existing.instanceCount += 1;
          existing.escalationLevel = Math.min(3, existing.escalationLevel + 1) as 0 | 1 | 2 | 3;
          // Track approach used (based on current escalation level, the NEXT response will use a new approach)
          const approach = this.describeEscalationApproach(existing.escalationLevel);
          if (!existing.approachesTried.includes(approach)) {
            existing.approachesTried.push(approach);
          }
        } else {
          this.confusionTrackers.set(topic, {
            topic,
            instanceCount: 1,
            escalationLevel: 1 as 0 | 1 | 2 | 3,
            approachesTried: ['initial_explanation'],
          });
        }
        console.log(
          `[CoachingService] W6.2 confusion tracked — topic="${topic}", ` +
          `count=${this.confusionTrackers.get(topic)!.instanceCount}, ` +
          `level=${this.confusionTrackers.get(topic)!.escalationLevel}`,
        );
      } else if (showsUnderstanding) {
        // Reset escalation when student demonstrates understanding on this topic
        if (this.confusionTrackers.has(topic)) {
          console.log(
            `[CoachingService] W6.2 confusion reset — topic="${topic}" ` +
            `(student showed ${cognitiveState})`,
          );
          this.confusionTrackers.delete(topic);
        }
      }
    }
  }

  /**
   * W6.2: Describe the escalation approach for a given level (for tracking).
   */
  private describeEscalationApproach(level: number): string {
    switch (level) {
      case 1: return 'initial_explanation';
      case 2: return 'different_angle';
      case 3: return 'broken_down';
      default: return 'ask_what_is_confusing';
    }
  }

  /**
   * W6.2: Build escalation context for injection into Stage 3 prompt.
   * Only produces content when the student is confused about a topic
   * that has been confused about before (escalation level >= 2).
   */
  private buildEscalationContext(stage1: Stage1Output): string {
    const { cognitiveState, dimensionFocus } = stage1;

    const isConfused =
      cognitiveState === 'confused_about_feedback' ||
      cognitiveState === 'confused_about_concept';

    if (!isConfused) return '';

    const topics = dimensionFocus.length > 0 ? dimensionFocus : ['general'];
    const escalationInstructions: string[] = [];

    for (const topic of topics) {
      const tracker = this.confusionTrackers.get(topic);
      if (!tracker || tracker.escalationLevel < 2) continue;

      switch (tracker.escalationLevel) {
        case 2:
          escalationInstructions.push(
            `ESCALATION (${topic}): Student is confused about this topic for the 2nd time. ` +
            `Take a FUNDAMENTALLY DIFFERENT angle than before — if you used technical explanation, ` +
            `try a metaphor or concrete example. If you used metaphor, try connecting it to their ` +
            `specific essay text. Previous approaches: ${tracker.approachesTried.join(', ')}.`
          );
          break;
        case 3:
          escalationInstructions.push(
            `ESCALATION (${topic}): Student is confused for the 3rd time. ` +
            `BREAK IT DOWN into smaller pieces. Address ONE sub-concept at a time. ` +
            `Start with the most concrete/tangible aspect. ` +
            `Previous approaches: ${tracker.approachesTried.join(', ')}.`
          );
          break;
        default:
          // 4+
          escalationInstructions.push(
            `ESCALATION (${topic}): Student has been confused ${tracker.instanceCount} times. ` +
            `ACKNOWLEDGE the difficulty directly: "I realize I haven't been explaining this clearly." ` +
            `Ask the student WHAT SPECIFIC PART is confusing — don't assume you know. ` +
            `Previous approaches tried: ${tracker.approachesTried.join(', ')}.`
          );
          break;
      }
    }

    if (escalationInstructions.length === 0) return '';

    return `\n\n=== CONFUSION ESCALATION (student needs a different approach) ===\n` +
      escalationInstructions.join('\n\n');
  }

  /**
   * W6.3: Build finding-aware context for injection into Stage 3 prompt.
   * Includes top 5 active findings by coaching value from the coordinator's FindingStore.
   * Returns empty string if no findings are available.
   */
  private buildFindingCoachingContext(coordinator: EssayProfileCoordinator): string {
    const findingStore = coordinator.getFindingStore();
    const active = findingStore.getActiveSortedByCoachingValue();

    if (active.length === 0) return '';

    const findingContext = buildFindingContext(findingStore, {
      maxActiveFindings: 5,
      includeSuperseded: false,
      includeEvidence: true,
      includeLineage: false,
      includeDeepeningPotential: false,
    });

    return `\n\n=== KEY FINDINGS (reference by [F] label when discussing relevant topics) ===\n` +
      findingContext;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * FIX C5.2: Build anti-repetition context for the Stage 3 prompt.
   *
   * When the student returns to a topic already discussed, this method extracts
   * the key points from previous coach responses about that topic, so the model
   * can consciously avoid rephrasing and instead go deeper or redirect.
   *
   * Only fires when the student's current focus area matches a prior turn's focus.
   */
  private buildAntiRepetitionContext(
    studentMessage: string,
    stage1: Stage1Output,
    history: ConversationTurn[],
  ): string {
    if (history.length < 2) return ''; // Need at least one prior exchange

    // Detect which paragraphs/areas the student is asking about now
    const currentFocus = this.extractFocusAreas(studentMessage);
    if (currentFocus.length === 0) return '';

    // Find prior coach responses that discussed the same focus areas
    const priorCoachPoints: string[] = [];
    for (let i = 0; i < history.length; i++) {
      const turn = history[i];
      if (turn.role !== 'student') continue;
      // Check if this prior student message had overlapping focus
      const priorFocus = this.extractFocusAreas(turn.content);
      const overlap = currentFocus.some(f => priorFocus.includes(f));
      if (!overlap) continue;

      // Find the coach response that followed this student message
      const coachTurn = history[i + 1];
      if (!coachTurn || coachTurn.role !== 'coach') continue;

      // Extract the first 2 sentences of each paragraph from the coach's response
      // as a compressed summary of what was already said
      const coachParagraphs = coachTurn.content.split(/\n\n/).filter(p => p.trim().length > 0);
      for (const para of coachParagraphs.slice(0, 3)) {
        // Take the first sentence of each paragraph as a key point
        const firstSentence = para.match(/^[^.!?]+[.!?]/)?.[0];
        if (firstSentence && firstSentence.length > 20) {
          priorCoachPoints.push(firstSentence.trim());
        }
      }
    }

    if (priorCoachPoints.length === 0) return '';

    return `\n\n=== ANTI-REPETITION: YOU ALREADY SAID THIS ===\n` +
      `The student is returning to a topic you've discussed before. Here are the KEY POINTS you already made:\n` +
      priorCoachPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n') +
      `\n\nDO NOT rephrase these points. Either:\n` +
      `- Go DEEPER: cover specific sentences/dimensions you haven't touched yet\n` +
      `- Go WIDER: connect this topic to something discussed in later turns\n` +
      `- Redirect: if you've covered it thoroughly, say so and suggest implementation`;
  }

  /**
   * Extract focus area keywords from a student message for anti-repetition matching.
   */
  private extractFocusAreas(message: string): string[] {
    const lower = message.toLowerCase();
    const areas: string[] = [];
    const areaMap: Record<string, string[]> = {
      'opening': ['opening', 'first paragraph', 'beginning', 'hook', 'intro', 'p1'],
      'ending': ['ending', 'conclusion', 'last paragraph', 'close', 'final'],
      'voice': ['voice', 'tone', 'style', 'sound'],
      'structure': ['structure', 'flow', 'transition', 'organization'],
      'specificity': ['specific', 'concrete', 'detail', 'example', 'show'],
      'p1': ['paragraph 1', 'first paragraph', 'opening paragraph'],
      'p2': ['paragraph 2', 'second paragraph'],
      'p3': ['paragraph 3', 'third paragraph'],
      'p4': ['paragraph 4', 'fourth paragraph'],
      'p5': ['paragraph 5', 'fifth paragraph'],
    };
    for (const [area, keywords] of Object.entries(areaMap)) {
      if (keywords.some(kw => lower.includes(kw))) {
        areas.push(area);
      }
    }
    return areas;
  }

  /**
   * Build InsightScope from Haiku's focusProbabilities output.
   * Converts "P1": 0.3, "P2": 0.6 → paragraphs array.
   */
  private buildInsightScope(
    focusProbabilities: Record<string, number>,
    paragraphCount: number,
  ): InsightScope {
    const paragraphs: Array<{ index: number; probability: number }> = [];

    for (const [label, prob] of Object.entries(focusProbabilities)) {
      const match = label.match(/P(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < paragraphCount && prob > 0) {
          paragraphs.push({ index: idx, probability: prob });
        }
      }
    }

    // If no probabilities parsed, default to uniform
    if (paragraphs.length === 0) {
      const uniform = 1 / Math.max(paragraphCount, 1);
      for (let i = 0; i < paragraphCount; i++) {
        paragraphs.push({ index: i, probability: uniform });
      }
    }

    const totalProb = paragraphs.reduce((sum, p) => sum + p.probability, 0);
    const essayProbability = totalProb > 0.8 ? 0.0 : 0.2; // If most prob is paragraph-specific, essay-level is low

    return {
      essayProbability,
      paragraphs,
      sentences: [], // Sentence-level scope not resolved at Stage 1 (no sentence text access here)
    };
  }

  /**
   * Map numeric emotional valence (-1 to 1) to the ConversationInsight enum.
   */
  private mapNumericValence(
    valence: number,
  ): 'positive' | 'negative' | 'neutral' | 'mixed' {
    if (valence > 0.3) return 'positive';
    if (valence < -0.3) return 'negative';
    if (Math.abs(valence) <= 0.1) return 'neutral';
    return 'mixed';
  }

  /**
   * Assign durability based on insight category and LLM-produced routing signals.
   *
   * For preferences, uses the LLM-produced `preferenceDurability` signal (Rule 7)
   * instead of regex pattern matching on student message text (Rule 4 compliance).
   */
  private assignDurability(
    category: InsightCategory,
    stage1: Stage1Output,
  ): 'ephemeral' | 'draft_durable' | 'essay_durable' | 'student_durable' {
    switch (category) {
      case 'clarification':
        return 'ephemeral'; // Requests tied to current moment

      case 'preference': {
        // Use LLM-produced durability signal (Rule 7: explicit routing tags, not keyword matching)
        if (stage1.preferenceDurability === 'general') return 'student_durable';
        return 'draft_durable';
      }

      case 'reinterpretation':
      case 'new_context':
      case 'correction':
        // Interpretations and context are specific to this essay
        return 'essay_durable';

      case 'confirmation':
        // Confirmation of this draft's choices
        return 'draft_durable';

      case 'emotional_reaction':
        // Emotional reactions are ephemeral — they inform but don't persist
        return 'ephemeral';

      case 'resistance':
        // Resistance is always essay-durable — we must remember the student rejected this
        return 'essay_durable';

      default:
        return 'draft_durable';
    }
  }

  /**
   * Phase 2: Gather findings + primaryFunctions from the profile for the targeted scope.
   * Returns formatted context string with [F] labeled findings + per-sentence functions,
   * plus the list of finding IDs targeted (for validating Stage 4 output).
   */
  private gatherTargetedFindings(
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    scope: InsightScope,
  ): { context: string; findingIds: string[] } {
    const findingStore = coordinator.getFindingStore();
    const contextParts: string[] = [];
    const allFindingIds: string[] = [];

    // Sort paragraphs by probability descending
    const sortedParagraphs = [...scope.paragraphs].sort((a, b) => b.probability - a.probability);

    for (const paraScope of sortedParagraphs.slice(0, 3)) {
      if (paraScope.probability < 0.1) continue;
      const para = profile.paragraphs[paraScope.index];
      if (!para) continue;

      // Paragraph role context
      if (para.understanding?.role) {
        contextParts.push(`P${paraScope.index + 1} role: ${para.understanding.role}`);
      }

      // Per-sentence primary functions
      for (const sentence of para.sentences) {
        if (sentence.understanding?.primaryFunction) {
          contextParts.push(`  P${paraScope.index + 1}S${sentence.index + 1}: ${sentence.understanding.primaryFunction} [${sentence.understanding.significance ?? 'contributing'}]`);
        }
      }

      // Findings scoped to this paragraph
      const paraFindings = findingStore.getByScope(paraScope.index);
      for (const f of paraFindings) {
        if (f.maturity === 'superseded') continue;
        contextParts.push(`  [${f.id}] ${f.claim} (${f.maturity}, ${f.coachingValue})`);
        allFindingIds.push(f.id);
      }
    }

    return { context: contextParts.join('\n'), findingIds: allFindingIds };
  }

  /**
   * Parse Stage 4 JSON output with 4-level defensive fallback.
   */
  private parseStage4Output<T>(raw: string): T | null {
    // Level 1: direct parse
    try {
      return JSON.parse(raw) as T;
    } catch (_) { /* fall through */ }

    // Level 2: strip markdown code fences
    try {
      const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
      return JSON.parse(stripped) as T;
    } catch (_) { /* fall through */ }

    // Level 3: find JSON object in text
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
    } catch (_) { /* fall through */ }

    // Level 4: jsonrepair
    try {
      const { jsonrepair } = require('jsonrepair');
      return JSON.parse(jsonrepair(raw)) as T;
    } catch (_) { /* fall through */ }

    console.warn('[CoachingService] Stage 4 JSON parse failed — insight stored without parsed deepening output');
    return null;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const coachingService = new CoachingService();
