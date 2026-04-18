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
  TopicResistanceTracker,
  StudentTheory,
  CognitiveAssessment,
  CoachingSessionMemory,
  SessionEvent,
  LearningStyleObservations,
  Finding,
} from '../profileTypes';

import type { ProfileRouter, RoutingRule } from '../profileManager/profileRouter';
import type { AssembledProfileContext } from '../profileManager/profileRouter';
import { EssayProfileCoordinator } from '../profileManager/essayProfileManager';

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { buildFabricationGuardBlock } from '../../../lib/llm/fabricationGuard';
import { jsonrepair } from 'jsonrepair';
import type { LayerCost, TokenUsage } from '../analysis/analysisOrchestrator';
import { COACHING_VALUE_ORDER } from '../findings/findingStore';

import type { CoachingMode } from '../profileTypes';
import type { BlockContext } from './types';
import {
  buildCoachingPrompt,
  strategicQuestionFromPriorTurnSection,
  innerVoiceMirrorCandidateSection,
  learningStyleCalibrationSection,
  strategicQuestionFromPriorTurnData,
  innerVoiceMirrorCandidateData,
  learningStyleCalibrationData,
  round3DirectivesBlock,
  historicalIntelligenceSection,
} from './promptBlocks';
import { normalizeParagraphRef, assertRefInRange } from './paragraphRef';
import { getTeachingContentForContext } from './teachingContentRouter';
import * as coachingPlanner from './coachingPlanner';
import * as edgeProtocol from './edgeProtocol';
import * as lengthCalibrator from './lengthCalibrator';
import {
  FORBIDDEN_PATTERNS_BLOCK,
  SECTION_WORD_BUDGETS_BLOCK,
} from './forbiddenPatterns';
import { CoachingBlockedError } from '../errors';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Extended session memory with learning style observations attached at runtime.
 * The `LearningStyleObservations` object is tracked separately in the main method
 * but needs to be accessible inside `runStage3CoachingResponse` for fallback
 * context building when `learningStyleContext` isn't provided by the caller.
 */
interface SessionMemoryWithStyle extends CoachingSessionMemory {
  learningStyleObservations?: LearningStyleObservations;
}

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-5-20250929';

/** Max turns of conversation history to inject into Stage 3 prompt */
const MAX_HISTORY_TURNS = 12;

/** Min turns before pattern detection runs (lowered from 5 to 3 — repeated focus
 *  on a topic is detectable after 3 mentions, and earlier detection means earlier
 *  injection into Stage 3 so the coach can reference patterns in the same turn) */
const PATTERN_DETECTION_MIN_TURNS = 3;

/**
 * Finding-to-technique routing table.
 * Maps diagnosed issues (from L3.5 findings) to specific craft techniques with
 * coaching directives. Only matched directives enter the prompt — no static bloat.
 */
interface TechniqueRoute {
  /** Keywords to match against finding claim (all must be present, case-insensitive) */
  claimKeywords: string[];
  /** Optional dimension filter (any one must match) */
  dimensions?: string[];
  /** Named craft technique */
  technique: string;
  /** Coaching directive — injected into prompt alongside the matched finding */
  directive: string;
}

const TECHNIQUE_ROUTES: TechniqueRoute[] = [
  {
    // Matches: "summary mode", "narrates from 30,000 feet", "telling not showing", "operates in summary"
    claimKeywords: ['summary'],
    technique: 'SUMMARY-TO-SCENE',
    directive: 'Identify the MOMENT buried in the summary. Write a 2-sentence scene version using student details. Ask: "What were your hands doing?"',
  },
  {
    // Matches: "generic opening", "template opening", "could be anyone's opening"
    claimKeywords: ['opening'],
    dimensions: ['voice', 'craft'],
    technique: 'COLD OPEN / SENSORY TIMESTAMP',
    directive: 'The opening needs a physical anchor before any philosophy. Write 2 sentences that put the reader in the room where this essay\'s topic first mattered.',
  },
  {
    // Matches: "emotional distance", "naming emotions", "labels feelings", "captivated", "fascinated"
    claimKeywords: ['emotion'],
    dimensions: ['emotion'],
    technique: 'SOMATIC VULNERABILITY',
    directive: 'Replace the named emotion with what the BODY did. "I was nervous" → what did their hands do, their stomach, their voice?',
  },
  {
    // Matches: "no named individuals", "people absence", "unnamed", "no specific person"
    claimKeywords: ['named'],
    technique: 'NAMED CHARACTER',
    directive: 'A person needs to be ON THE PAGE. Ask for the name + one physical detail. Write a 1-sentence introduction that makes the reader see them.',
  },
  {
    // Matches: "without proportional evidence", "claim exceeds", "escalates beyond", "grandiose"
    claimKeywords: ['without'],
    technique: 'EVIDENCE ANCHORING',
    directive: 'The claim exceeds the evidence. Identify the SPECIFIC, SMALL thing the student actually did. That specific thing is more powerful than the grand claim.',
  },
  {
    // Matches: "singular first-person", "solo credit", "I developed", "likely involved collaboration"
    claimKeywords: ['singular'],
    technique: 'COLLABORATIVE SPECIFICITY',
    directive: 'Show the student how including collaborators STRENGTHENS, not weakens, the essay. "We built" with a specific role is more credible than "I developed" without one.',
  },
  {
    // Matches: "generic ending/conclusion", "aspirational", "look forward to", "journey"
    claimKeywords: ['conclusion'],
    technique: 'RITUAL DETAIL / BOOKEND INVERSION',
    directive: 'Replace aspirational closing with a specific image or habit that PROVES the transformation. Return to the opening scene with one thing changed.',
  },
  {
    // Matches: "voice shift", "inconsistent voice", "register change", "different voice"
    claimKeywords: ['voice'],
    dimensions: ['voice'],
    technique: 'VOICE COMPARISON',
    directive: 'Quote 2 sentences from different paragraphs. Name which sounds more like them. Show what the gap reveals.',
  },
  {
    // Matches: "decorative", "atmosphere", "doesn't serve", "filler detail"
    claimKeywords: ['decorative'],
    technique: 'FUNCTIONAL DETAIL',
    directive: 'Every detail must reveal character, carry theme, or advance narrative. If it\'s just scenery, cut it. Show what the detail DOES for the reader.',
  },
  {
    // Matches: "too neat", "manufactured growth", "sudden realization", "epiphany"
    claimKeywords: ['neat'],
    technique: 'ANTI-LESSON',
    directive: 'The takeaway is too clean. Real growth is messy. Help the student find the version that\'s honest rather than tidy.',
  },
  {
    // Matches: "no stakes", "nothing at risk", "low consequence", "stakes"
    claimKeywords: ['stakes'],
    technique: 'STAKES ESTABLISHMENT',
    directive: 'What could the student LOSE? What was at risk? If nothing was at risk, the reader can\'t feel invested.',
  },
  {
    // Matches: "pacing compressed", "rushed", "compressed moment"
    claimKeywords: ['compress'],
    dimensions: ['structure'],
    technique: 'SCENE EXPANSION',
    directive: 'The essay\'s most important moment gets the same word count as setup. The reader needs to LINGER at the pivot point.',
  },
  {
    // Matches: "abrupt transition", "disconnected", "jump between"
    claimKeywords: ['transition'],
    dimensions: ['structure'],
    technique: 'BRIDGE SENTENCE',
    directive: 'Write a 1-sentence bridge between the two paragraphs using a detail that lives in BOTH worlds.',
  },
  {
    // Matches: "cliche", "stock phrasing", "overused"
    claimKeywords: ['cliche'],
    dimensions: ['craft', 'voice'],
    technique: 'DEFINITIONAL PIVOT',
    directive: 'Quote the cliche. Ask: what does this word actually mean to YOU? Show what their specific meaning sounds like as a sentence.',
  },
  {
    // Matches: "vulnerability retreat", "pulls back", "avoids emotional depth"
    claimKeywords: ['retreat'],
    technique: 'SUSTAINED VULNERABILITY',
    directive: 'Quote where they pulled back. Ask: what are you protecting by not staying in the hard moment?',
  },
  {
    // Matches: "no arc", "flat progression", "no turning point"
    claimKeywords: ['arc'],
    dimensions: ['narrative', 'structure'],
    technique: 'NARRATIVE ARC',
    directive: 'The essay needs a before/after with a turning point. Help the student identify THE moment when something changed.',
  },
  {
    // Matches: "parallel asserted", "connection claimed", "stated not enacted"
    claimKeywords: ['parallel'],
    technique: 'ENACTED PARALLEL',
    directive: 'Instead of explaining the connection, show the reader by writing the two activities in a way that reveals the structural echo.',
  },
  {
    // Anti-convergence: matches "telling not showing", "states rather than demonstrates", "claims quality"
    claimKeywords: ['telling'],
    technique: 'SHOW THROUGH SPECIFIC ACTION',
    directive: 'The essay CLAIMS a quality instead of demonstrating it. Replace the claim with a specific moment that proves it: "This taught me resilience" → "I still dry-heave before every speech. But now I walk to the podium anyway." The specific action IS the proof.',
  },
  {
    // Anti-convergence: matches "formulaic", "AI-generated", "convergence", "could be anyone"
    claimKeywords: ['formulaic'],
    technique: 'VOICE AUTHENTICITY',
    directive: 'This language sounds like every other essay. Help the student find the weird, specific, only-them version. "Transformative experience" → the actual thing that happened. "Insatiable curiosity" → "I\'ve read the Wikipedia page for unusual deaths four times." Specificity is the antidote to convergence.',
  },
  {
    // Anti-convergence: matches "epiphany", "sudden realization", "everything clicked"
    claimKeywords: ['epiphany'],
    technique: 'INCREMENTAL REVELATION',
    directive: 'Real growth is messy, not sudden. "In that moment, everything changed" → "I thought I understood. Six months later, I realized I\'d only understood the easy part." Help the student show growth as ongoing recalibration, not a light switch.',
  },
];

/**
 * Maps TECHNIQUE_ROUTES technique names to TechniqueLibrary category IDs.
 * Used to look up pedagogical content (WHY, HOW, EXAMPLES) for each route.
 */
const TECHNIQUE_TO_CATEGORY: Record<string, string> = {
  'SUMMARY-TO-SCENE': 'storytelling',
  'COLD OPEN / SENSORY TIMESTAMP': 'storytelling',
  'SOMATIC VULNERABILITY': 'voice_authenticity',
  'NAMED CHARACTER': 'storytelling',
  'EVIDENCE ANCHORING': 'evidence_impact',
  'COLLABORATIVE SPECIFICITY': 'evidence_impact',
  'RITUAL DETAIL / BOOKEND INVERSION': 'storytelling',
  'VOICE COMPARISON': 'voice_authenticity',
  'FUNCTIONAL DETAIL': 'storytelling',
  'STAKES ESTABLISHMENT': 'storytelling',
  'SCENE EXPANSION': 'storytelling',
  'NARRATIVE ARC': 'storytelling',
  'SHOW THROUGH SPECIFIC ACTION': 'evidence_impact',
  'VOICE AUTHENTICITY': 'voice_authenticity',
  'DEFINITIONAL PIVOT': 'voice_authenticity',
  'SUSTAINED VULNERABILITY': 'reflection_depth',
  'ANTI-LESSON': 'reflection_depth',
};

/**
 * Maps technique route names to TransformationExample.primaryCraftMove values.
 * Used to find matching before/after examples from the research database.
 */
const TECHNIQUE_TO_CRAFT_MOVE: Record<string, string> = {
  'SUMMARY-TO-SCENE': 'sensory_details',
  'COLD OPEN / SENSORY TIMESTAMP': 'sensory_details',
  'SOMATIC VULNERABILITY': 'emotional_physical',
  'NAMED CHARACTER': 'specific_names',
  'EVIDENCE ANCHORING': 'statistics_data',
  'COLLABORATIVE SPECIFICITY': 'specific_names',
  'SHOW THROUGH SPECIFIC ACTION': 'active_verbs',
  'STAKES ESTABLISHMENT': 'emotional_physical',
  'VOICE AUTHENTICITY': 'active_verbs',
  'FUNCTIONAL DETAIL': 'sensory_details',
  'SCENE EXPANSION': 'sensory_details',
};

/**
 * Anti-convergence transformation patterns.
 * Before/after examples showing common AI-coaching convergence traps
 * and their authentic alternatives. Injected into coaching context
 * when the coach detects convergence-prone language in the essay.
 *
 * Source: researchBackedTeachingService knowledge base (verified by AO quotes)
 */
const ANTI_CONVERGENCE_PATTERNS = [
  { pattern: 'telling_not_showing', signal: 'taught me|learned that|made me realize|showed me the importance',
    example: '"This experience taught me resilience" → "I still dry-heave before every speech. But now I walk to the podium anyway, feeling my heartbeat in my fingertips."' },
  { pattern: 'ai_convergence', signal: 'transformative|profoundly impacted|multifaceted|insatiable|instrumental in shaping',
    example: '"This transformative experience profoundly impacted my journey" → "I spent three weeks debugging code that turned out to have a single misplaced semicolon."' },
  { pattern: 'false_epiphany', signal: 'suddenly realized|in that moment|everything changed|finally understood',
    example: '"In that moment, everything changed" → "I thought I understood. Six months later, I realized I\'d only understood the easy part."' },
  { pattern: 'strategic_vulnerability', signal: 'to be honest|to be vulnerable|I must admit|being authentic',
    example: '"I\'ll be honest — I struggled with anxiety" → "My hands shook when I opened the email. They still do, sometimes, when I see that font."' },
  { pattern: 'cliche_ending', signal: 'continuing this journey|look forward to|excited for the future|the rest of my life',
    example: '"I look forward to continuing this journey" → "I\'m starting to have a guess about who I might want to be. Ask me again in a year."' },
] as const;

// NOTE: getCraftVocabularyForPhase(), PEDAGOGICAL_CALIBRATION_RULES, and SIDECAR_INSTRUCTIONS
// were moved to promptBlocks.ts as part of the block composition system.
// See promptBlocks.ts for the authoritative versions.

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
  /** One-sentence addition to accumulated student context */
  contextAccumulation: string;
}

/**
 * Metadata sidecar produced by Stage 3 Sonnet alongside the coaching response.
 * Replaces separate Stage 1, Stage 1.5, and Pattern Detection Haiku calls.
 */
interface CoachingSidecar {
  category: InsightCategory;
  cognitiveState: CognitiveState;
  focusParagraphs: number[];
  dimensionFocus: string[];
  responseIntensity: 'full' | 'brief' | 'minimal';
  sessionJournalEntry: string | null;
  contextAccumulation: string | null;
  needsDeepening: boolean;
  deepeningReason: string | null;
  learningStyleUpdate: string | null;
  strategicQuestionUpdate: string | null;
  /** The coach's honest inner assessment — what you see but wouldn't say out loud.
   *  2-3 sentences. Be specific and honest. null only on first turn. */
  innerVoice: string | null;
  /** 1-sentence observation about who this student IS as a person — their relationship
   *  to writing, their emotional patterns, what they protect — based on THIS turn only.
   *  Raw observation, not a synthesis. null if nothing new revealed this turn. */
  portraitEvolution: string | null;
  /** Revision mode only: did the student's revision improve, go lateral, or regress?
   *  null when not in revision_response or iteration_deep mode. */
  revisionQuality: 'improved' | 'lateral' | 'regressed' | null;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class CoachingService {

  // --------------------------------------------------------------------------
  // W6.2: CONFUSION TRACKING (escalation ladder)
  // --------------------------------------------------------------------------

  // All mutable per-session state (confusion trackers, resistance trackers,
  // deflection counter, pre-theory observations) is stored on CoachingSessionMemory
  // (not as instance state) to avoid cross-contamination when the singleton
  // CoachingService handles concurrent sessions.

  // --------------------------------------------------------------------------
  // COST-OPTIMIZED HELPERS (replace Stage 1 / Stage 1.5 / Pattern Detection)
  // --------------------------------------------------------------------------

  /**
   * Quick keyword-based focus extraction — replaces Stage 1 for pre-Sonnet routing.
   * Not as accurate as Haiku classification, but good enough for context scoping.
   * The Sonnet sidecar provides accurate classification post-response.
   */
  private quickExtractFocus(
    message: string,
    paragraphCount: number,
  ): { focusParagraphs: number[]; dimensionFocus: string[] } {
    const lower = message.toLowerCase();
    const focusParagraphs: number[] = [];

    // Explicit paragraph references: "P1", "paragraph 1", "first paragraph", etc.
    for (let i = 1; i <= paragraphCount; i++) {
      if (lower.includes(`p${i}`) || lower.includes(`paragraph ${i}`)) {
        focusParagraphs.push(i - 1);
      }
    }

    // Named positions
    const positionMap: Record<string, number> = {
      'opening': 0, 'first paragraph': 0, 'beginning': 0, 'hook': 0, 'intro': 0, 'start': 0,
      'ending': paragraphCount - 1, 'conclusion': paragraphCount - 1, 'last paragraph': paragraphCount - 1,
      'closing': paragraphCount - 1, 'final paragraph': paragraphCount - 1,
    };
    for (const [keyword, idx] of Object.entries(positionMap)) {
      if (lower.includes(keyword) && !focusParagraphs.includes(idx)) {
        focusParagraphs.push(idx);
      }
    }

    // Dimension focus from keywords
    const dimensionFocus: string[] = [];
    const dimensionKeywords: Record<string, string[]> = {
      'voice': ['voice', 'tone', 'style', 'sound like', 'register'],
      'structure': ['structure', 'flow', 'transition', 'organization', 'pacing', 'order'],
      'narrative': ['narrative', 'story', 'arc', 'plot', 'scene'],
      'craft': ['craft', 'sentence', 'word choice', 'writing', 'technique'],
      'emotion': ['emotion', 'feeling', 'feel', 'heart', 'personal', 'authentic'],
      'theme': ['theme', 'meaning', 'about', 'message', 'point'],
      'admissions': ['admissions', 'ao', 'reader', 'application', 'college'],
    };
    for (const [dim, keywords] of Object.entries(dimensionKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        dimensionFocus.push(dim);
      }
    }

    return { focusParagraphs, dimensionFocus };
  }

  /**
   * GAP-15/20: Pre-Sonnet response intensity estimation.
   *
   * Determines how verbose the coaching response should be BEFORE the Sonnet call.
   * This drives both maxTokens (hard ceiling) and a prompt-level length directive
   * (explicit instruction like "1-3 sentences maximum").
   *
   * The sidecar's responseIntensity is post-hoc (emitted after the response) and
   * cannot control the current turn's length. This method runs pre-Sonnet with
   * zero LLM cost using keyword heuristics.
   *
   * GAP-20: Resistance states map to 'brief' — when a student is resistant,
   * the elite coach move is a SHORT direct question, not a longer lecture.
   */
  private estimateResponseIntensity(
    message: string,
    history: ConversationTurn[],
    memory: CoachingSessionMemory,
    mode: CoachingMode = 'first_encounter',
    iterationRound?: number,
  ): 'full' | 'brief' | 'minimal' {
    const lower = message.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).length;

    // ── Mode-specific intensity overrides (checked first) ──
    // Revision: student submitted work — default to full. Exception: very short messages ("how's this?")
    if (mode === 'revision_response') {
      if (wordCount < 10) return 'brief';
      return 'full';
    }
    // Iteration deep: after 4+ rounds, brief by default (precision focus). Exception: long messages
    if (mode === 'iteration_deep') {
      if ((iterationRound ?? 3) >= 4 && wordCount < 30) return 'brief';
      return 'full';
    }
    // Architecture: structural changes deserve full analysis always
    if (mode === 'architecture') {
      return 'full';
    }
    // Polish: precision mode — brief by default (ONE change per turn). Full only for longer discussions.
    if (mode === 'polish') {
      if (wordCount > 30) return 'full';
      return 'brief';
    }

    // ── Default heuristics (first_encounter / conversation) ──

    // Breakthrough detection → brief (name the insight, connect forward, STOP)
    // "I just realized" / "it's really about" / "that's what I want" / "the whole essay is"
    const breakthroughPatterns = [
      /i just realized|it('s| is) really about|that('s| is) what i want/,
      /the whole essay is|i finally (see|understand|get)|everything connects/,
      /oh my god|oh wow|that('s| is) it|this changes everything/,
    ];
    if (breakthroughPatterns.some(p => p.test(lower))) {
      return 'brief'; // Breakthroughs need momentum, not celebration. 3-6 sentences max.
    }

    // Confirmation patterns (declared early so lastResponseIntensity checks can reference them)
    const confirmationPatterns = [
      /^(yeah|yes|ok|okay|got it|makes sense|i see|right|sure|that helps|thanks|thank you|cool|alright)/,
      /^(mm+h*m*|uh huh|ah|oh okay|yep|yup)/,
    ];

    // Use prior turn's intensity as a consistency signal
    // If last response was already minimal and student gives another short message, stay minimal
    if (memory.lastResponseIntensity === 'minimal' && wordCount <= 12) {
      return 'minimal';
    }
    if (memory.lastResponseIntensity === 'brief' && wordCount <= 8 && confirmationPatterns.some(p => p.test(lower))) {
      return 'minimal'; // Escalate from brief to minimal on repeated short confirmations
    }

    // Short confirmations → minimal
    if (wordCount <= 8 && confirmationPatterns.some(p => p.test(lower))) {
      return 'minimal';
    }

    // Short agreement + advance request → brief
    if (wordCount <= 15 && (lower.includes('what about') || lower.includes('what else') || lower.includes('next') || lower.includes('move on'))) {
      return 'brief';
    }

    // GAP-20: Detect resistance patterns → brief (not longer lectures)
    // "just tell me if X is good enough" / "is it fine" / "can we move on"
    const resistancePatterns = [
      /is (it|that|this) (good|fine|okay|enough)/,
      /just tell me/,
      /can (we|you|I) (just|move on|skip)/,
      /I (don't|dont) (want|need) to/,
      /whatever you think/,
      /can you (just )?(write|show|do|fix|rewrite)/,  // ghostwriting requests
      /just (show|write|do|fix) (me|it)/,             // "just show me"
    ];
    if (resistancePatterns.some(p => p.test(lower))) {
      return 'brief';
    }

    // Last coach response was very long AND student response is short → brief
    // (The student didn't engage with the long response — don't repeat the pattern)
    const coachTurns = history.filter(t => t.role === 'coach');
    const lastCoachTurn = coachTurns[coachTurns.length - 1];
    if (lastCoachTurn && lastCoachTurn.content.length > 1200 && wordCount < 12) {
      return 'brief';
    }

    // Student has asked about the same thing multiple times without sharing text → brief
    // (Resistance pattern from the audit: student asks 3x about their rewrite without pasting it)
    const recentStudentMessages = history
      .filter(t => t.role === 'student')
      .slice(-3)
      .map(t => t.content.toLowerCase());
    if (recentStudentMessages.length >= 2) {
      const currentTopics = lower.split(/\s+/).filter(w => w.length > 4);
      const overlapCount = recentStudentMessages.filter(prev =>
        currentTopics.some(t => prev.includes(t))
      ).length;
      if (overlapCount >= 2 && wordCount < 20) {
        return 'brief'; // Repeating topic without new content → be direct, not verbose
      }
    }

    // Mid-session default calibration: after the first 2 turns, short/medium
    // student messages should get 'brief' by default, not 'full'. Full is for
    // the first read, breakthrough moments, and long substantive student messages.
    // This prevents every response from being a 400-word lecture.
    const turnCount = memory.turnCount ?? 0;
    if (turnCount >= 2 && wordCount < 40) {
      return 'brief';
    }

    return 'full';
  }

  /**
   * Round-7 Hardening P0 (C6): Minimal-path classifier.
   *
   * Decides whether a coaching turn qualifies for the cheap Haiku-only path
   * (runStage1InsightExtraction → generateMinimalResponse) instead of the
   * full Sonnet coaching call. Purpose: short acknowledgements like
   * "ok thanks" cost ~$0.002 here vs ~$0.01-0.02 if routed through Sonnet.
   *
   * All four criteria must agree. Conservative default is `false`.
   *
   * Criteria (per forge plan §2.7):
   *   1. Raw student message is ≤ 30 characters.
   *   2. Stage-1 category is `confirmation` or `clarification`
   *      (both imply no reinterpretation / no new context to integrate).
   *   3. No prior-turn pushback is active — if a pushback has been deployed
   *      this session, the next turn may carry unresolved resistance that
   *      needs Sonnet's judgment, not a Haiku ack.
   *   4. `improvementPhase !== 'foundation'` — foundation-phase students
   *      need scaffolding even for short messages, so a "minimal" ack would
   *      strand them. All other phases (architecture/craft/polish/distinction)
   *      can handle a terse acknowledgement.
   *
   * Not checked here (handled at call-site via env flag):
   *   - `ENABLE_HAIKU_MINIMAL_PATH` kill-switch.
   */
  private classifyAsMinimal(
    studentMessage: string,
    stage1: Stage1Output,
    sessionMemory: CoachingSessionMemory,
    improvementPhase: ImprovementPhaseLevel,
  ): boolean {
    // 1. Length gate — raw character count, unstripped.
    if (studentMessage.length > 30) return false;

    // 2. Category gate — only confirmation / clarification route minimal.
    //    Explicitly reject reinterpretation even if short: semantically heavy.
    const minimalCategories: InsightCategory[] = ['confirmation', 'clarification'];
    if (!minimalCategories.includes(stage1.category)) return false;
    if (stage1.category === 'reinterpretation') return false; // defensive redundancy

    // 3. Pushback gate — unresolved pushback means the next turn may carry
    //    resistance that needs full coaching. The edge-protocol cap allows
    //    only one pushback per session, so pushbackCount > 0 means it's
    //    been deployed and we're still in the "post-pushback" session state.
    if ((sessionMemory.pushbackCount ?? 0) > 0) return false;

    // 4. Phase gate — foundation students need scaffolding always.
    if (improvementPhase === 'foundation') return false;

    return true;
  }

  /**
   * Scope essay text to focus paragraphs +/-1 context window.
   * Non-focus paragraphs get a one-line summary with word count.
   * Returns full essay if no focus paragraphs.
   */
  private scopeEssayText(
    paragraphs: Array<{ text: string }>,
    focusParagraphs: number[],
  ): string {
    if (focusParagraphs.length === 0) {
      return paragraphs.map((p, i) => `P${i + 1}: ${p.text}`).join('\n\n');
    }

    // Build set of paragraphs to show in full (focus +/-1)
    const fullSet = new Set<number>();
    for (const fp of focusParagraphs) {
      fullSet.add(fp);
      if (fp > 0) fullSet.add(fp - 1);
      if (fp < paragraphs.length - 1) fullSet.add(fp + 1);
    }

    return paragraphs.map((p, i) => {
      if (fullSet.has(i)) {
        return `P${i + 1}: ${p.text}`;
      }
      const wordCount = p.text.split(/\s+/).length;
      const preview = p.text.slice(0, 60).replace(/\s+\S*$/, '');
      return `P${i + 1}: [${wordCount} words] ${preview}...`;
    }).join('\n\n');
  }

  /**
   * Parse the coaching response + metadata sidecar from Sonnet's output.
   * Format: [coaching response text]\n<!--METADATA-->\n{JSON}
   * Falls back gracefully if sidecar is missing.
   */
  private parseSidecarResponse(raw: string): { response: string; sidecar: CoachingSidecar } {
    const delimiter = '<!--METADATA-->';
    const delimIdx = raw.lastIndexOf(delimiter);

    if (delimIdx === -1) {
      // No sidecar — return response with default metadata
      return {
        response: raw.trim(),
        sidecar: this.defaultSidecar(),
      };
    }

    const response = raw.slice(0, delimIdx).trim();
    const metaRaw = raw.slice(delimIdx + delimiter.length).trim();

    try {
      const parsed = JSON.parse(metaRaw);
      return {
        response,
        sidecar: this.validateSidecar(parsed),
      };
    } catch {
      console.warn('[CoachingService] Sidecar parse failed, using defaults');
      return { response, sidecar: this.defaultSidecar() };
    }
  }

  private defaultSidecar(): CoachingSidecar {
    return {
      category: 'clarification',
      cognitiveState: 'engaged',
      focusParagraphs: [],
      dimensionFocus: [],
      responseIntensity: 'full',
      sessionJournalEntry: null,
      contextAccumulation: null,
      needsDeepening: false,
      deepeningReason: null,
      learningStyleUpdate: null,
      strategicQuestionUpdate: null,
      innerVoice: null,
      portraitEvolution: null,
      revisionQuality: null,
    };
  }

  private validateSidecar(raw: Record<string, unknown>): CoachingSidecar {
    const validCategories: InsightCategory[] = [
      'confirmation', 'reinterpretation', 'new_context', 'correction',
      'preference', 'clarification', 'emotional_reaction', 'resistance',
    ];
    const rawCat = typeof raw.category === 'string' ? raw.category.toLowerCase() : '';
    const category = validCategories.includes(rawCat as InsightCategory)
      ? (rawCat as InsightCategory)
      : 'clarification';

    const validCogStates: CognitiveState[] = [
      'confused_about_feedback', 'confused_about_concept', 'curious_deeper',
      'curious_wider', 'frustrated', 'resistant_to_specific', 'resistant_to_general',
      'engaged', 'seeking_validation', 'overwhelmed',
    ];
    const rawCog = typeof raw.cognitiveState === 'string' ? raw.cognitiveState.toLowerCase() : '';
    const cognitiveState = validCogStates.includes(rawCog as CognitiveState)
      ? (rawCog as CognitiveState)
      : 'engaged';

    const validIntensities = ['full', 'brief', 'minimal'] as const;
    const rawIntensity = typeof raw.responseIntensity === 'string' ? raw.responseIntensity.toLowerCase() : '';
    const responseIntensity = (validIntensities as readonly string[]).includes(rawIntensity)
      ? (rawIntensity as 'full' | 'brief' | 'minimal')
      : 'full';

    return {
      category,
      cognitiveState,
      focusParagraphs: Array.isArray(raw.focusParagraphs)
        ? (raw.focusParagraphs as number[]).filter(n => typeof n === 'number')
        : [],
      dimensionFocus: Array.isArray(raw.dimensionFocus)
        ? (raw.dimensionFocus as string[]).filter(s => typeof s === 'string').map(s => s.toLowerCase())
        : [],
      responseIntensity,
      sessionJournalEntry: typeof raw.sessionJournalEntry === 'string' ? raw.sessionJournalEntry : null,
      contextAccumulation: typeof raw.contextAccumulation === 'string' && raw.contextAccumulation.length > 0
        ? raw.contextAccumulation : null,
      needsDeepening: typeof raw.needsDeepening === 'boolean' ? raw.needsDeepening : false,
      deepeningReason: typeof raw.deepeningReason === 'string' ? raw.deepeningReason : null,
      learningStyleUpdate: typeof raw.learningStyleUpdate === 'string' && raw.learningStyleUpdate.length > 0
        ? raw.learningStyleUpdate : null,
      strategicQuestionUpdate: typeof raw.strategicQuestionUpdate === 'string' && raw.strategicQuestionUpdate.length > 0
        ? raw.strategicQuestionUpdate : null,
      innerVoice: typeof raw.innerVoice === 'string' && raw.innerVoice.length > 0
        ? raw.innerVoice : null,
      portraitEvolution: typeof raw.portraitEvolution === 'string' && raw.portraitEvolution.length > 0
        ? raw.portraitEvolution : null,
      revisionQuality: (() => {
        const valid = ['improved', 'lateral', 'regressed'];
        const rv = typeof raw.revisionQuality === 'string' ? raw.revisionQuality.toLowerCase() : '';
        return valid.includes(rv) ? rv as 'improved' | 'lateral' | 'regressed' : null;
      })(),
    };
  }

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
   * @param coachingMode  Detected coaching mode (from ReanalysisOrchestrator)
   * @param iterationRound  For iteration_deep: how many edits on the focused section
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
    crossModuleContext?: string,
    coachingMode?: CoachingMode,
    iterationRound?: number,
    isInSessionDraft?: boolean,
    collegeId?: string,
  ): Promise<CoachingResult> {
    // ── Phase 1.5: Fail-fast gate — block coaching on legacy profiles that
    // failed migration (no source data to reshape into the candidate store).
    // This is NOT a silent fallback — it surfaces an explicit error that the
    // UI should handle by offering the user a "Refresh analysis" action.
    // See FORGE_PLAN_ARTIFACTS.md Section 2, FORGE_PLAN_UNIFIED.md doctrine.
    if (profile.index?.requiresReanalysis) {
      throw CoachingBlockedError.requiresReanalysis();
    }

    const turnStart = Date.now();
    const costs: LayerCost[] = [];

    // Initialize session memory and learning style on first call
    let memory = sessionMemory ?? this.initializeSessionMemory();
    const style = learningStyle ?? this.initializeLearningStyle();

    // Backward compat: old sessions may lack the events array
    if (!memory.events) {
      memory.events = [];
    }

    // ── Scope 3 Phase 7: Research Database Enrichment (one-time per session) ──
    // Fills demonstration, researchBacking, stakes (when thin), and collegeNote
    // fields that buildImprovementManifest() leaves empty. Zero LLM calls.
    // Idempotent via manifest._enriched — subsequent turns are instant no-ops.
    //
    // classified: mixed (systemic + recoverable)
    //   - PipelineError.enrichmentSystemicMiss: SYSTEMIC — table drift. Log at
    //     ERROR level with structured diagnostic; mark _enriched=true so we
    //     don't retry every turn; continue coaching with best-effort manifest.
    //     This is the "fail-loud but don't block" pattern per CLAUDE.md.
    //   - Other errors (import failure, runtime): RECOVERABLE — warn+continue.
    if (profile.improvementManifest && !profile.improvementManifest._enriched) {
      try {
        const { enrichWithResearchDatabase } = await import('../analysis/researchEnrichment');
        // Resolve collegeId in priority order:
        //   1. Explicit param from the orchestrator (this turn's caller)
        //   2. profile.collegeId (persisted at session init for supplement/PIQ)
        // This keeps common_app flows working (both undefined) while
        // guaranteeing supplement flows enrich even after server restarts
        // (where the in-memory sessionStore forgets collegeId but the
        // persisted profile remembers it).
        const effectiveCollegeId = collegeId ?? profile.collegeId;
        enrichWithResearchDatabase(profile.improvementManifest, effectiveCollegeId);
      } catch (err) {
        const { isPipelineError } = await import('../errors');
        if (isPipelineError(err) && err.layer === 'research_enrichment') {
          // Systemic miss — table drift between TECHNIQUE_VOCABULARY_LIST and
          // ROUTE_TO_ISSUE_TYPE. Surface loudly for observability/alerts, but
          // don't block the coaching turn. Mark enriched=true to prevent
          // per-turn retry of a known-broken lookup.
          console.error(
            '[CoachingService] Research enrichment SYSTEMIC failure — ' +
              'ROUTE_TO_ISSUE_TYPE / OBSERVATION_KEYWORD_TO_ISSUE needs audit:',
            err.toDiagnostic(),
          );
          profile.improvementManifest._enriched = true;
          profile.improvementManifest._enrichmentError = {
            type: 'systemic_miss',
            layer: err.layer,
            message: err.message,
            at: new Date().toISOString(),
          };
        } else {
          console.warn(
            '[CoachingService] Research enrichment failed (non-fatal, recoverable):',
            err instanceof Error ? err.message : err,
          );
        }
      }
    }

    const phase = profile.index.improvementPhase;

    console.log(
      `[CoachingService] Turn start — message="${studentMessage.slice(0, 80)}..." ` +
      `history=${conversationHistory.length} turns, phase=${phase.level}, ` +
      `sessionTurn=${memory.turnCount + 1}`,
    );

    // ── Quick Focus Extraction (no LLM — keyword-based) ──
    const quickFocus = this.quickExtractFocus(studentMessage, profile.paragraphs.length);
    console.log(
      `[CoachingService] Quick focus — paragraphs=[${quickFocus.focusParagraphs.map(p => `P${p + 1}`).join(',')}], ` +
      `dimensions=[${quickFocus.dimensionFocus.join(',')}]`,
    );

    // ── Context Routing (no LLM — pure logic) ──
    // Build a minimal Stage1Output for the router
    const routingStage1: Stage1Output = {
      category: 'clarification', // Placeholder — real classification comes from Sonnet sidecar
      emotionalValence: 0,
      confidence: 0.5,
      isExplicit: true,
      isNovel: true,
      focusProbabilities: Object.fromEntries(
        quickFocus.focusParagraphs.length > 0
          ? quickFocus.focusParagraphs.map(p => [`P${p + 1}`, 0.9])
          : profile.paragraphs.map((_, i) => [`P${i + 1}`, 1 / profile.paragraphs.length])
      ),
      dimensionFocus: quickFocus.dimensionFocus,
      conversationType: 'coaching_question',
      recentEditAware: !!recentEditContext,
      targetParagraphIndex: null,
      targetSentenceIndex: null,
      cognitiveState: 'engaged',
      scopeCertainty: quickFocus.focusParagraphs.length > 0 ? 'high' : 'low',
      preferenceDurability: null,
    };

    const { routingRule, routingRequest } = this.runStage2ContextRouting(
      routingStage1,
      profile,
      recentEditContext,
    );
    const assembledContext = router.assembleContext(profile, routingRequest);
    console.log(
      `[CoachingService] Stage 2 complete — rule=${routingRule}, ` +
      `sections=${assembledContext.sections.length}, tokens≈${assembledContext.estimatedTokens}`,
    );

    // ── Confusion Tracking deferred to after Sonnet response (uses sidecar cognitiveState) ──

    // ── GAP-15/20: Pre-Sonnet Response Intensity Estimation ──
    // Determines maxTokens + prompt-level length directive BEFORE the Sonnet call.
    // The sidecar produces intensity AFTER the response (too late to control length).
    // This lightweight estimation runs without an LLM call.
    const estimatedIntensity = this.estimateResponseIntensity(
      studentMessage, conversationHistory, memory,
      coachingMode ?? 'first_encounter', iterationRound,
    );

    // ── Learning Style Context for Stage 3 prompt injection ──
    // style.observations accumulate across turns but were never passed to the coaching LLM.
    // Build a prompt section from non-tentative observations (or all if <=3 total).
    // The adaptation-rule directives live authoritatively in
    // `learningStyleCalibrationDirective` (cached system prompt via
    // round3DirectivesBlock). Emit only the raw observations here — Sonnet maps
    // them to the appropriate directive itself. Dedup: removed an inline
    // ADAPTATION RULES bullet list that restated the same guidance the
    // directive block already carries.
    const learningStyleSection = style.observations.length > 0
      ? `\n\n=== LEARNING STYLE OBSERVATIONS ===\n` +
        style.observations
          .filter(o => o.confidence !== 'tentative' || style.observations.length <= 3)
          .map(o => `- ${o.observation} (${o.confidence})`)
          .join('\n') +
        `\nApply the matching shorthand directives from LEARNING_STYLE_CALIBRATION (system prompt).`
      : undefined;

    // ── Cross-module context gating ──
    // Only inject cross-module context (activity profiles, PIQ insights, academic data)
    // Cross-module context (activity profiles, academic data, PIQ insights) is injected
    // when relevant to the coaching moment — not just on overview questions.
    const turnCount = memory.turnCount + 1;
    const lower = studentMessage.toLowerCase();
    const shouldInjectCrossModule = crossModuleContext && (
      // Overview questions (original gate)
      routingRule === 'l6_coaching_overview' ||
      // Early session (turns 1-3): broader context helps initial diagnosis
      turnCount <= 3 ||
      // Identity/positioning questions: student asking about who they are or competitive position
      /who (am i|does this show)|what does this (reveal|say about)|good enough for|competitive|stanford|harvard|ivy|college/i.test(lower) ||
      // Strategy questions: student asking about application-level decisions
      /should i (write|focus|change)|which (essay|topic)|supplement/i.test(lower)
    );
    const gatedCrossModuleContext = shouldInjectCrossModule ? crossModuleContext : undefined;

    // ── Attach learning style to session memory for Stage 3 fallback access ──
    (memory as SessionMemoryWithStyle).learningStyleObservations = style;

    // ── Round-7 Hardening P0 (C6): Pre-Sonnet Haiku classification ──
    // Every turn — even "ok thanks" one-liners — previously hit Sonnet. We now
    // classify first with Haiku (~$0.001), and for messages that satisfy the
    // minimal-path criteria (see classifyAsMinimal), we answer with Haiku
    // (~$0.001) instead of Sonnet (~$0.01-0.02). Kill-switch:
    // ENABLE_HAIKU_MINIMAL_PATH='false' forces every turn through Sonnet.
    //
    // Stage1Output is reused downstream: when the minimal branch fires we
    // return after a lean state update. When the Sonnet branch fires, the
    // existing sidecar-derived stage1 (post-Sonnet) still drives downstream
    // bookkeeping — we do NOT replace the sidecar version. The pre-call
    // stage1 is only used for routing here.
    const { stage1: preStage1, s1Cost: preStage1Cost } = await this.runStage1InsightExtraction(
      studentMessage,
      conversationHistory,
      profile,
      recentEditContext,
    );
    costs.push(preStage1Cost);

    const minimalPathEnabled = process.env.ENABLE_HAIKU_MINIMAL_PATH !== 'false';
    const isMinimal = minimalPathEnabled && this.classifyAsMinimal(
      studentMessage,
      preStage1,
      memory,
      phase.level,
    );

    if (isMinimal) {
      console.log(
        `[CoachingService] Minimal path — category=${preStage1.category}, ` +
        `msgLen=${studentMessage.length}, phase=${phase.level}`,
      );

      // Build a lightweight CognitiveAssessment for generateMinimalResponse.
      // This is NOT the Stage-1.5 LLM assessment — we skip that call on the
      // minimal path to preserve the cost win. The ack prompt only uses
      // assessment + whatTheyNeed, so a derived stub is sufficient.
      const minimalAssessment: CognitiveAssessment = {
        assessment: `Student message is brief (${studentMessage.length} chars) and ` +
          `classified as ${preStage1.category}. No substantive coaching required this turn.`,
        whatTheyNeed: 'A brief, specific acknowledgement — no teaching, no elaboration.',
        recommendedApproach: 'Acknowledge and advance. 1-3 sentences.',
        responseIntensity: 'minimal',
      };

      const { response: minimalResponse, cost: minimalCost } = await this.generateMinimalResponse(
        studentMessage,
        minimalAssessment,
        conversationHistory,
        profile,
      );
      costs.push(minimalCost);

      // Minimal state updates — the turn still happened, so we must:
      //  - bump turnCount
      //  - append a session event (so retrieval sees it)
      //  - record lastResponseIntensity
      // Skipping these would desync turn indexing across the suite.
      memory.lastResponseIntensity = 'minimal';
      memory = this.updateSessionMemory(memory, studentMessage, preStage1, minimalAssessment);

      const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
      console.log(
        `[CoachingService] Minimal turn complete — totalCost=$${totalCost.toFixed(5)}, ` +
        `totalTime=${Date.now() - turnStart}ms, sessionTurn=${memory.turnCount}`,
      );

      return {
        response: minimalResponse,
        insightExtracted: null,
        profileDeepened: false,
        routingRuleUsed: routingRule,
        cost: costs,
        totalCost,
        stage4Verdict: 'none',
        sessionMemory: memory,
        learningStyle: style,
        cognitiveAssessment: minimalAssessment,
      };
    }

    // ── Single Sonnet Call: Coaching Response + Metadata Sidecar ──
    const s3Start = Date.now();
    const { response, sidecar, s3Cost } = await this.runStage3CoachingResponse(
      studentMessage,
      conversationHistory,
      profile,
      assembledContext,
      quickFocus,
      coordinator,
      memory,
      recentEditContext,
      editStrategyContext,
      estimatedIntensity,
      learningStyleSection,
      gatedCrossModuleContext,
      coachingMode ?? 'first_encounter',
      iterationRound,
      isInSessionDraft,
      collegeId,
    );
    costs.push(s3Cost);
    console.log(
      `[CoachingService] Stage 3 complete — responseLength=${response.length}, ` +
      `category=${sidecar.category}, cognitiveState=${sidecar.cognitiveState}, ` +
      `needsDeepening=${sidecar.needsDeepening}, ` +
      `cost=$${s3Cost.cost.toFixed(5)}, time=${Date.now() - s3Start}ms`,
    );

    // ── Post-processing: Apply Sidecar Metadata ──

    // Build a Stage1Output from the sidecar (for downstream compatibility)
    const stage1: Stage1Output = {
      ...routingStage1,
      category: sidecar.category,
      cognitiveState: sidecar.cognitiveState,
      focusProbabilities: Object.fromEntries(
        sidecar.focusParagraphs.length > 0
          ? sidecar.focusParagraphs.map(p => [`P${p + 1}`, 0.9])
          : Object.entries(routingStage1.focusProbabilities)
      ),
      dimensionFocus: sidecar.dimensionFocus.length > 0 ? sidecar.dimensionFocus : routingStage1.dimensionFocus,
      scopeCertainty: sidecar.focusParagraphs.length > 0 ? 'high' : 'low',
    };

    // Build a CognitiveAssessment from the sidecar — use innerVoice when available
    const cognitiveAssessment: CognitiveAssessment = {
      assessment: sidecar.innerVoice
        ?? `Student is ${sidecar.cognitiveState}`,
      whatTheyNeed: sidecar.innerVoice
        ? (sidecar.needsDeepening
          ? 'Profile understanding needs updating — student revealed new context or reinterpreted meaning'
          : 'Continue coaching informed by inner voice assessment')
        : (sidecar.needsDeepening
          ? 'Profile understanding needs updating based on student input'
          : 'Continue coaching at current trajectory'),
      recommendedApproach: sidecar.innerVoice
        ? `Informed by: ${sidecar.innerVoice.split('.')[0]}`
        : (sidecar.category === 'resistance'
          ? 'Listen first — ask what they are protecting'
          : sidecar.category === 'reinterpretation'
          ? 'Build from student\'s reading — they may be right'
          : 'Continue current approach'),
      responseIntensity: sidecar.responseIntensity,
    };

    // GAP-1: Store responseIntensity in session memory for next-turn consistency
    memory.lastResponseIntensity = sidecar.responseIntensity;

    // ── Phase 3: record edge-protocol deployments ──
    // Heuristic: if the pushback directive was emitted THIS turn (i.e., the
    // coach was allowed to push back at prompt-assembly time), mark it as
    // deployed. We intentionally record the ALLOWANCE, not the ACTUAL prose
    // move — the sidecar doesn't surface "did-I-push-back", and false-
    // positives here just mean pushback won't fire again, which is
    // the desired cap. Same logic for blindSpot.
    const wasAllowedPushback = edgeProtocol.shouldAllowPushback(memory);
    if (wasAllowedPushback) {
      edgeProtocol.recordPushback(memory);
      console.log('[EdgeProtocol] Pushback marked as deployed this turn');
    }
    const wasAllowedBlindSpot = edgeProtocol.shouldSurfaceBlindSpot(
      memory,
      memory.studentTheory,
      studentMessage,
    );
    if (wasAllowedBlindSpot) {
      edgeProtocol.recordBlindSpotDeployed(memory);
      console.log('[EdgeProtocol] BlindSpot marked as surfaced this turn');
    }

    // Post-turn forbidden-vocabulary audit (classified: recoverable)
    // Surfaces coercive escalation patterns without blocking the turn. The
    // audit scorecard can consume these to gate releases.
    const forbidden = edgeProtocol.detectForbiddenVocabulary(response);
    if (forbidden.length > 0) {
      console.warn(
        `[EdgeProtocol] Forbidden vocabulary detected (${forbidden.length} occurrences): ` +
          forbidden.map((f) => `"${f.phrase}"`).join(', '),
      );
    }

    // ── Phase 2: record planner deployment ──
    // Re-run the planner with the PRE-turn memory state (ledger hasn't been
    // written yet) to recover which improvement was deployed this turn, then
    // record it. The planner is pure — cheap to invoke twice. Without this,
    // the ledger never grows and future turns would not rotate away from
    // previously-deployed categories.
    if (profile.improvementManifest && profile.improvementManifest.items.length > 0) {
      try {
        const selection = coachingPlanner.selectNextDeployment(profile.improvementManifest, memory);
        if (selection) {
          coachingPlanner.recordDeployment(memory, {
            selection,
            turn: memory.turnCount + 1,
            responseText: response,
          });
          console.log(
            `[CoachingPlanner] Recorded deployment: imp=${selection.item.id} ` +
              `category=${selection.principleCategory} ` +
              `technique=${selection.item.technique ?? '(none)'} ` +
              `mode=${memory.taughtLedger?.[selection.item.id]?.deploymentMode ?? 'unknown'}`,
          );
        }
      } catch (err) {
        // classified: recoverable
        // Planner is pedagogical-layer enhancement; a failure here should
        // not block the coaching turn. Log loudly for observability.
        console.warn(
          '[CoachingPlanner] recordDeployment failed (non-fatal):',
          err instanceof Error ? err.message : err,
        );
      }
    }

    // GAP-2: Accumulate learning style observations from sidecar
    if (sidecar.learningStyleUpdate) {
      if (style.observations.length >= 8) {
        const tentativeIdx = style.observations.findIndex(o => o.confidence === 'tentative');
        if (tentativeIdx >= 0) style.observations.splice(tentativeIdx, 1);
        else style.observations.shift();
      }
      style.observations.push({
        observation: sidecar.learningStyleUpdate,
        confidence: 'tentative',
        turnObserved: memory.turnCount + 1,
      });
      // Promote observations confirmed by repeated similar signals
      this.promoteLearningStyleConfidence(style);
    }

    // GAP-6: Update strategic question from sidecar
    if (sidecar.strategicQuestionUpdate) {
      memory.strategicQuestion = sidecar.strategicQuestionUpdate;
      memory.questionStaleness = 0;
    } else {
      memory.questionStaleness = (memory.questionStaleness ?? 0) + 1;
    }

    // Update confusion tracking with sidecar data
    this.updateConfusionTracking(stage1, memory);

    // Update resistance tracking with sidecar data (mirrors confusion tracking)
    this.updateResistanceTracking(stage1, memory.turnCount + 1, sidecar.sessionJournalEntry, memory);

    // Accumulate portrait observations from sidecar for StudentTheory synthesis.
    // We do NOT directly mutate the L3.75 writerPortrait — that analytical portrait
    // is too valuable to overwrite with coaching-context observations. Instead,
    // observations accumulate and feed the periodic theory synthesis.
    if (sidecar.portraitEvolution) {
      if (memory.studentTheory) {
        memory.studentTheory.pendingObservations.push(sidecar.portraitEvolution);
      } else {
        // Before first theory synthesis, accumulate on session memory
        if (!memory.preTheoryObservations) memory.preTheoryObservations = [];
        memory.preTheoryObservations.push(sidecar.portraitEvolution);
      }
      console.log(`[CoachingService] Portrait observation accumulated: "${sidecar.portraitEvolution.slice(0, 80)}..."`);
    }

    // Journal entry from sidecar (replaces Pattern Detection journal)
    if (sidecar.sessionJournalEntry) {
      memory.events.push({
        turn: memory.turnCount + 1,
        kind: 'journal',
        summary: sidecar.sessionJournalEntry,
        significance: 0.95,
        paragraphRefs: [],
        findingRefs: [],
      });
    }

    // Coach suggestion tracking — extract what the coach RECOMMENDED this turn
    // (zero LLM cost: regex extraction from the coaching response)
    if (response) {
      const resp = response;
      // Extract ALL-CAPS technique names (e.g., SUMMARY-TO-SCENE, SENSORY TIMESTAMP)
      const techniqueMatches = resp.match(/\b[A-Z]{2,}(?:[-\s][A-Z]{2,}){1,3}\b/g) ?? [];
      const techniques = [...new Set(techniqueMatches)].slice(0, 2);
      // Extract paragraph targets. Widened to multi-digit P10..P99 — the old
      // /\bP\d\b/ regex silently dropped anything past P9.
      const paraMatches = resp.match(/\bP\d{1,2}\b/g) ?? [];
      const paragraphs = [...new Set(paraMatches)].slice(0, 3);

      if (techniques.length > 0 || paragraphs.length > 0) {
        const suggestionSummary = [
          techniques.length > 0 ? `Technique: ${techniques.join(', ')}` : '',
          paragraphs.length > 0 ? `Target: ${paragraphs.join(', ')}` : '',
        ].filter(Boolean).join(' | ');

        // Round-3 Coaching Integration: centralize paragraph-ref conversion.
        // Coach prose is 1-indexed ("P1" == first paragraph); events on session
        // memory must be 0-indexed to match the manifest convention used by
        // per-paragraph delta telemetry and the finding store.
        const refs0Indexed = paragraphs
          .map((p) => normalizeParagraphRef(p, 'coach_text'))
          .filter((n) => Number.isFinite(n));
        for (const ref of refs0Indexed) {
          assertRefInRange(ref, profile.paragraphs.length, 'coach_suggestion');
        }

        memory.events.push({
          turn: memory.turnCount + 1,
          kind: 'coach_suggestion',
          summary: suggestionSummary,
          significance: 0.7,
          paragraphRefs: refs0Indexed,
          findingRefs: [],
        });
      }
    }

    // RevisionQuality capture — records Sonnet's assessment of whether the revision helped
    if (sidecar.revisionQuality) {
      const currentMode = coachingMode ?? 'first_encounter';
      console.log(`[CoachingService] Revision quality: ${sidecar.revisionQuality} (mode=${currentMode})`);

      memory.events.push({
        turn: memory.turnCount + 1,
        kind: `revision_quality:${sidecar.revisionQuality}`,
        summary: `Revision assessed as ${sidecar.revisionQuality}`,
        significance: sidecar.revisionQuality === 'regressed' ? 0.9
          : sidecar.revisionQuality === 'lateral' ? 0.6 : 0.5,
        paragraphRefs: sidecar.focusParagraphs,
        findingRefs: [],
      });
    }

    // Session arc update (simplified — from journal entries)
    if (memory.events.filter(e => e.kind === 'journal').length > 0) {
      const journals = memory.events.filter(e => e.kind === 'journal');
      const journalSummary = journals.slice(-3).map(j => j.summary).join(' ');
      const phasePrefix = memory.turnCount <= 3 ? 'EARLY SESSION: '
        : memory.turnCount <= 8 ? 'MIDDLE SESSION: '
        : 'LATE SESSION — CONSOLIDATE: ';
      memory.sessionArcSummary = phasePrefix + journalSummary;
    }

    // ── Stage 4: Profile Deepening (ONLY when Sonnet signals needsDeepening) ──
    let insightExtracted: ConversationInsight | null = null;
    let profileDeepened = false;
    let stage4Verdict: Stage4Verdict = 'none';
    let supersededFindingIds: string[] | undefined;
    let tensionDescription: string | undefined;

    if (sidecar.needsDeepening) {
      console.log(`[CoachingService] Stage 4 triggered — reason: ${sidecar.deepeningReason}`);
      const s4Result = await this.runStage4ProfileDeepening(
        studentMessage,
        stage1,
        profile,
        coordinator,
        costs,
      );
      insightExtracted = s4Result.insight;
      profileDeepened = s4Result.deepened;
      stage4Verdict = s4Result.verdict;
      supersededFindingIds = s4Result.supersededFindingIds;
      tensionDescription = s4Result.tensionDescription;

      // Stage 5: Phase Check (conditional — after deepening)
      if (profileDeepened) {
        this.runStage5PhaseCheck(profile, coordinator);
      }

      // Coaching-driven North Star update: when Stage 4 determines a
      // reinterpretation that challenges the through-line, update immediately
      // rather than waiting for full reanalysis.
      if (stage4Verdict === 'superseded' && tensionDescription) {
        const shouldUpdateNorthStar =
          tensionDescription.toLowerCase().includes('not about') ||
          tensionDescription.toLowerCase().includes('actually about') ||
          tensionDescription.toLowerCase().includes('real subject') ||
          tensionDescription.toLowerCase().includes('real essay') ||
          tensionDescription.toLowerCase().includes('misread') ||
          tensionDescription.toLowerCase().includes('changes the through-line') ||
          tensionDescription.toLowerCase().includes('fundamental');

        if (shouldUpdateNorthStar && profile.northStar?.throughLineMap) {
          // Update the North Star summary with the coaching reinterpretation
          const ns = profile.index.northStarSummary;
          const updatedSummary = `${ns.throughLineSummary} [COACHING UPDATE: Student reinterpretation — ${tensionDescription}]`;
          profile.index.northStarSummary = {
            ...ns,
            throughLineSummary: updatedSummary,
            maturity: 'student_confirmed' as any,
          };
          console.log(`[CoachingService] North Star updated from coaching reinterpretation: "${tensionDescription.slice(0, 80)}..."`);
        }
      }
    } else {
      // For non-deepening categories, still store basic insights
      if (sidecar.category !== 'clarification') {
        const insightId = `insight_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const scope = this.buildInsightScope(stage1.focusProbabilities, profile.paragraphs.length);
        const durability = this.assignDurability(sidecar.category, stage1);
        const currentEssayVersion = profile.editHistory.length > 0
          ? profile.editHistory[profile.editHistory.length - 1].version
          : 1;

        insightExtracted = {
          id: insightId,
          timestamp: new Date().toISOString(),
          sourceText: studentMessage,
          category: sidecar.category,
          emotionalValence: 'neutral',
          studentConfidence: 'moderate',
          explicitness: 'explicit',
          scopeCertainty: stage1.scopeCertainty,
          novelty: 'moderate',
          scope,
          durability,
          essayVersion: currentEssayVersion,
        };
        coordinator.applyConversationInsight(insightExtracted);
      }
    }

    // Handle context accumulation from sidecar.
    // Skip when Stage 4 new_context deepening already handled context accumulation
    // to avoid double-appending overlapping content.
    if (sidecar.contextAccumulation && !(sidecar.needsDeepening && sidecar.category === 'new_context')) {
      const existing = profile.studentDeclaredContext || '';
      const newCtx = existing
        ? `${existing} ${sidecar.contextAccumulation}`
        : sidecar.contextAccumulation;
      coordinator.updateStudentDeclaredContext(newCtx);

      // Parse into structured context for writing prompt generation
      this.parseIntoStructuredContext(
        sidecar.contextAccumulation,
        memory.turnCount + 1,
        profile,
      );

      // Context compounding: when student reveals new details, existing improvement
      // items become MORE SPECIFIC. The understanding compounds into better improvements.
      if (profile.improvementManifest) {
        const focusParas = sidecar.focusParagraphs ?? [];
        for (const item of profile.improvementManifest.items) {
          const status = memory.improvementProgress?.[item.id] ?? 'queued';
          if (status === 'addressed') continue;
          // Enrich items targeting focus paragraphs or essay-level items
          if (focusParas.includes(item.paragraph) || item.paragraph === -1) {
            item.conversatorEnrichments.push(sidecar.contextAccumulation!);
          }
        }
      }
    }

    // ── Update session memory with this turn's data ──
    memory = this.updateSessionMemory(
      memory,
      studentMessage,
      stage1,
      cognitiveAssessment,
    );

    // Populate findingRefs on the just-created event if Stage 4 identified findings
    if (memory.events.length > 0 && supersededFindingIds?.length) {
      memory.events[memory.events.length - 1].findingRefs = supersededFindingIds;
    }

    // ── StudentTheory Progressive Synthesis (T2 nascent → T5 confirmed, then every 5) ──
    // Round-3 Coaching Integration: theory must be available BEFORE the turn
    // that should be shaped by it — the old T5-only schedule produced a synthesis
    // that could never shape the session that generated it. Firing at T2 gives
    // the coach `blindSpotHypotheses` and `personhood` context from T3 onward.
    //
    // Maturity ladder:
    //   T2 → 'nascent'     (2 turns of evidence — hedge aggressively)
    //   T3 → 'hypothesis'  (still provisional)
    //   T4 → 'growing'     (patterns repeating)
    //   T5 → 'confirmed'   (broadly stable)
    //   T10, T15, … → re-synthesize, maturity stays 'confirmed'
    const pendingObs = [
      ...(memory.preTheoryObservations ?? []),
      ...(memory.studentTheory?.pendingObservations ?? []),
    ];
    const hasMinimumSignal = pendingObs.length >= 1 || memory.turnCount >= 2;
    const shouldSynthesize =
      memory.turnCount >= 2 &&
      memory.turnCount <= 5
        ? true // fire every turn from T2..T5
        : memory.turnCount > 5 && memory.turnCount % 5 === 0; // then every 5 turns
    if (shouldSynthesize && hasMinimumSignal) {
      try {
        const synthStart = Date.now();
        const { theory, cost: synthCost } = await this.synthesizeStudentTheory(
          conversationHistory,
          profile,
          memory,
        );
        // Flush pre-theory observations into the new theory
        const preObs = memory.preTheoryObservations ?? [];
        if (preObs.length > 0 && !memory.studentTheory) {
          theory.pendingObservations = [...preObs];
          memory.preTheoryObservations = [];
        }
        // Assign maturity based on turn number at synthesis time.
        const maturityByTurn: Record<number, NonNullable<StudentTheory['maturity']>> = {
          2: 'nascent',
          3: 'hypothesis',
          4: 'growing',
        };
        theory.maturity = maturityByTurn[memory.turnCount] ?? 'confirmed';
        memory.studentTheory = theory;
        costs.push(synthCost);
        console.log(
          `[CoachingService] StudentTheory synthesized at turn ${memory.turnCount} — ` +
          `cost=$${synthCost.cost.toFixed(5)}, time=${Date.now() - synthStart}ms`,
        );
      } catch (err) {
        console.error('[CoachingService] StudentTheory synthesis failed (non-fatal):', err);
      }
    }

    // ── Revision Checklist Management ──
    // Populate on turn 1 from top findings; update on subsequent turns from revision quality
    if (memory.turnCount === 1 && !memory.revisionChecklist) {
      // Initial population from findings
      const findingStore = coordinator.getFindingStore();
      const activeForChecklist = findingStore.getActiveSortedByCoachingValue()
        .filter(f => f.coachingValue === 'critical' || f.coachingValue === 'high')
        .slice(0, 5);
      if (activeForChecklist.length > 0) {
        memory.revisionChecklist = activeForChecklist.map((f, idx) => {
          // Check if a technique route matches this finding
          const techMatch = this.matchFindingToTechnique(f);
          const scopeStr = f.scope.type === 'paragraph'
            ? `P${(f.scope.paragraph ?? 0) + 1}`
            : f.scope.type === 'cross_paragraph'
            ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+')}`
            : 'Essay-wide';
          return {
            id: `RT_${idx + 1}`,
            paragraph: f.scope.type === 'paragraph' ? (f.scope.paragraph ?? 0) : 0,
            task: `${scopeStr}: ${f.claim}`,
            technique: techMatch?.technique ?? null,
            findingRef: f.id,
            status: 'pending' as const,
            priority: idx + 1,
          };
        });
        console.log(
          `[CoachingService] Revision checklist populated — ${memory.revisionChecklist.length} tasks from findings`,
        );
      }
    } else if (memory.revisionChecklist && sidecar.revisionQuality === 'improved') {
      // Update checklist when revision improves a targeted paragraph
      const focusParas = sidecar.focusParagraphs;
      for (const task of memory.revisionChecklist) {
        if (task.status === 'pending' && focusParas.includes(task.paragraph)) {
          task.status = 'addressed';
          task.addressedAtTurn = memory.turnCount;
          console.log(`[CoachingService] Checklist task ${task.id} addressed at turn ${memory.turnCount}`);
        }
      }
    }
    // Also update from superseded findings
    if (memory.revisionChecklist && supersededFindingIds?.length) {
      for (const task of memory.revisionChecklist) {
        if (task.findingRef && supersededFindingIds.includes(task.findingRef) && task.status === 'pending') {
          task.status = 'addressed';
          task.addressedAtTurn = memory.turnCount;
        }
      }
    }

    // ── Round-3 Coaching Integration: roll prior-turn handoff state ──
    // Capture this turn's strategicQuestion + innerVoice so the NEXT turn's
    // prompt can surface them literally (see strategicQuestionFromPriorTurnSection
    // and innerVoiceMirrorCandidateSection in promptBlocks.ts).
    //
    // Note: memory.strategicQuestion is the live session thread and may have
    // been updated this turn from sidecar.strategicQuestionUpdate. It's the
    // correct value to propagate — an unchanged strategicQuestion simply
    // re-appears on the next turn's prompt, which is the desired behavior
    // (unresolved → re-anchor).
    memory.priorTurnStrategicQuestion = memory.strategicQuestion || null;
    memory.priorTurnCognitiveAssessment = sidecar.innerVoice ?? null;

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

EMOTIONAL VALENCE — calibrate from these signals (rate the STRONGEST one):
  -1.0: Angry, dismissive, cynical ("This feedback is useless", "You don't understand")
  -0.5: Frustrated, resistant ("I've tried this and it doesn't work", "I disagree")
  -0.2: Defensive, tentative ("I guess you're right, but...", "Maybe I should just...")
   0.0: Neutral, matter-of-fact ("Okay, I'll try that", factual questions)
   0.2: Hopeful, curious ("I want to understand this better", "What if I...")
   0.5: Excited, energized ("Oh! I see what you mean", "This changes everything")
   1.0: Vulnerable, grateful ("This completely changed how I see my essay", sharing personal material)

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
    const response = await callClaudeWithRetry<string>(
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
    quickFocus: { focusParagraphs: number[]; dimensionFocus: string[] },
    coordinator: EssayProfileCoordinator,
    sessionMemory: CoachingSessionMemory,
    recentEditContext?: string,
    editStrategyContext?: string,
    estimatedIntensity: 'full' | 'brief' | 'minimal' = 'full',
    learningStyleContext?: string,
    crossModuleContext?: string,
    coachingMode: CoachingMode = 'first_encounter',
    iterationRound?: number,
    isInSessionDraft?: boolean,
    sessionCollegeId?: string,
  ): Promise<{ response: string; sidecar: CoachingSidecar; s3Cost: LayerCost }> {
    const callStart = Date.now();
    const phase = profile.index.improvementPhase;
    const turnCount = sessionMemory.turnCount + 1;

    // ── BLOCK 1: Mode-aware coaching philosophy (block composition system) ──
    // Derive essay type from profile's activeScale (the source of truth set at analysis time)
    const SCALE_TO_ESSAY_TYPE: Record<string, BlockContext['essayType']> = {
      supplement: 'supplement',
      piq: 'piq',
      personal_statement: 'common_app',
    };
    const derivedEssayType = SCALE_TO_ESSAY_TYPE[profile.northStar.activeScale] ?? 'common_app';

    const blockCtx: BlockContext = {
      mode: coachingMode,
      phase: phase.level,
      iterationRound,
      editSignificance: recentEditContext ? 'present' as const : undefined,
      isInSessionDraft,
      essayType: derivedEssayType,
      collegeId: sessionCollegeId,
    };
    const coachingPhilosophy = await buildCoachingPrompt(blockCtx);
    console.log(`[CoachingService] Block system — mode=${coachingMode}, phase=${phase.level}, blocks assembled`);

    // NOTE: The original monolithic staticCoachingPhilosophy (~340 lines, ~3500 tokens)
    // has been removed. It is preserved in git history. The block system above produces
    // functionally identical output for first_encounter mode. See promptBlocks.ts.

    // ── BLOCK 2: Stable profile context + essay text + findings (CACHED in system prompt) ──
    const stableProfileContext = this.buildStableProfileContext(profile, assembledContext);

    // CACHE FIX: Send the FULL essay text in the system prompt (stable across turns
    // within a session). Per-turn focus is a small hint emitted in the user prompt
    // (FOCUS_PARAGRAPHS payload) — keeping the system prefix byte-identical between
    // turns is what unlocks Anthropic's prompt cache. Previously, we scoped essay
    // text to focusParagraphs+/-1 each turn, which mutated the cached prefix and
    // forced a cache write on nearly every turn (audit T1/T2/T4/T5 cache_read=0).
    const essayText = profile.paragraphs.map((p, i) => `P${i + 1}: ${p.text}`).join('\n\n');

    // Build a minimal Stage1Output adapter for finding context, anti-repetition, and escalation
    // Declared early so it's available for buildFindingCoachingContext below.
    const localStage1Adapter = {
      focusProbabilities: Object.fromEntries(
        quickFocus.focusParagraphs.length > 0
          ? quickFocus.focusParagraphs.map(p => [`P${p + 1}`, 0.9])
          : profile.paragraphs.map((_, i) => [`P${i + 1}`, 1 / profile.paragraphs.length])
      ),
      dimensionFocus: quickFocus.dimensionFocus,
      category: 'clarification' as InsightCategory,
      emotionalValence: 0,
      confidence: 0.5,
      isExplicit: true,
      isNovel: true,
      conversationType: 'coaching_question' as const,
      recentEditAware: !!recentEditContext,
      targetParagraphIndex: null,
      targetSentenceIndex: null,
      cognitiveState: 'engaged' as CognitiveState,
      scopeCertainty: (quickFocus.focusParagraphs.length > 0 ? 'high' : 'low') as 'high' | 'moderate' | 'low',
      preferenceDurability: null,
    } satisfies Stage1Output;

    // Finding-aware coaching context (scoped to focus, lifecycle-aware)
    const findingSection = await this.buildFindingCoachingContext(coordinator, localStage1Adapter, profile, sessionMemory);

    // Phase info (stable within session — phase only changes via L3.5 re-analysis)
    const phaseSection = `

CURRENT IMPROVEMENT PHASE: ${phase.level.toUpperCase()}
Phase reasoning: ${phase.reasoning}
Focus areas for this phase: ${phase.focusAreas.join(', ')}
${phase.deferredAreas.length > 0 ? `Deferred (don't surface yet): ${phase.deferredAreas.join(', ')}` : ''}
COACHING LENS: ${phase.coachingLens}
READINESS: ${phase.readinessAssessment}`;

    // Anti-convergence context (detects convergence-prone language in essay)
    const antiConvergenceSection = this.buildAntiConvergenceContext(profile);

    // System prompt = coaching philosophy + profile + essay + phase + anti-convergence
    //                 + round-3 directive blocks (HOW to handle prior-turn payloads)
    // STABLE across turns within a session → enables Anthropic prompt caching
    // ($0.30/M read vs $3.75/M write — ~10x discount on the cached portion).
    //
    // Round-3 split: directive TEXT (how to interpret payloads) lives here; only
    // the per-turn payload VALUES (the specific quoted question / hypothesis /
    // observation list) go in the user prompt. This pushes ~600-900 tokens of
    // stable directive text into the cache and keeps the user-prompt delta small.
    //
    // findingSection (findings + teaching content) goes in USER prompt — it changes per turn
    // based on focus paragraphs, so putting it here would break the cache prefix every turn.
    // Round 7 — Historical intelligence section. Pulls pre-computed
    // cross-session signals (revision intelligence + voice evolution) off
    // the profile. Coordinator recomputes these after every L3.5 analysis
    // pass; this call is a pure string assemble. Empty string on session
    // one (both inputs null) = zero prompt bloat.
    const historicalSection = historicalIntelligenceSection(
      profile.revisionIntelligence ?? null,
      profile.voiceEvolution ?? null,
    );

    const systemPrompt = coachingPhilosophy +
      FORBIDDEN_PATTERNS_BLOCK +
      SECTION_WORD_BUDGETS_BLOCK +
      round3DirectivesBlock() +
      historicalSection +
      `\n\n===ESSAY PROFILE CONTEXT===\n${stableProfileContext}` +
      `\n\n===ESSAY TEXT (current version — quote directly when referencing specific moments)===\n${essayText}` +
      phaseSection +
      antiConvergenceSection +
      `\n\n${buildFabricationGuardBlock()}`;

    // ── BLOCK 3: Dynamic per-turn context (NOT cached — changes every turn) ──
    const dynamicProfileContext = this.buildDynamicProfileContext(profile, sessionMemory);

    // ── Turn-specific — conversation + current message ──
    // 10 turns ensures the coach doesn't forget early revelations (Mrs. Chen, hackathon)
    const trimmedHistory = conversationHistory.slice(-10);
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
    const deflCount = sessionMemory.deflectionCounter ?? 0;
    let patternSection = patternInsights.length > 0
      ? `\n\n=== COACHING PATTERNS (observed across this conversation) ===\n` +
        patternInsights.map(p =>
          `- ${p.implication} (observed ${p.instanceCount} times)` +
          `\n  WHEN to raise: If the student's next revision repeats this pattern, name it directly.` +
          `\n  HOW to raise: Not as criticism but as a lever — "Remember how we discussed X?"` +
          `\n  WHY: Helps the student see their own blind spots without shame.`
        ).join('\n')
      : '';
    // Surface deflection count when it's meaningful (2+ turns of avoidance)
    if (deflCount >= 2) {
      patternSection += `\n\n=== DEFLECTION ALERT ===\n` +
        `Student has deflected from writing tasks ${deflCount} consecutive turns. ` +
        (deflCount >= 3
          ? `This is persistent avoidance. Drop the original task. Try a completely different entry point — ` +
            `a smaller ask, a different paragraph, a "just tell me what happened" prompt.`
          : `Change your approach — the current ask isn't working. Make it smaller, more specific, ` +
            `or try a different angle. "Forget the three sentences. Just tell me about [specific moment]."`);
    }

    // localStage1Adapter is declared above (before findingSection) to avoid temporal dead zone

    // FIX C5.2: Build explicit anti-repetition context
    const antiRepetitionSection = this.buildAntiRepetitionContext(
      studentMessage,
      localStage1Adapter,
      trimmedHistory,
    );

    // Lightweight focus detection section (replaces old stage1Section)
    const stage1Section = quickFocus.focusParagraphs.length > 0
      ? `\nFOCUS DETECTION: P${quickFocus.focusParagraphs.map(p => p + 1).join(', P')}` +
        (quickFocus.dimensionFocus.length > 0 ? ` [${quickFocus.dimensionFocus.join(', ')}]` : '')
      : '\nFOCUS DETECTION: essay overview (general question)';

    // ── Improvement 6: Session arc context ──
    // GAP-6: Prefer strategicQuestion over nextFocus; add staleness escalation
    const strategicThreadSection = sessionMemory.strategicQuestion
      ? `STRATEGIC QUESTION (let this guide your response): ${sessionMemory.strategicQuestion}`
      : (sessionMemory.nextFocus ? `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}` : '');
    const stalenessNote = (sessionMemory.questionStaleness ?? 0) >= 4
      ? `NOTE: This question has been the strategic thread for ${sessionMemory.questionStaleness} turns. Consider weaving it in more actively.`
      : '';

    // Session arc is BOTH turn-count-aware AND mode-aware.
    // Revision/iteration modes override the default "get them writing" directives.
    const sessionArcSection = (() => {
      // Mode-specific overrides take priority over turn-count branching
      if (coachingMode === 'revision_response') {
        return `\n\n=== SESSION ARC (turn ${turnCount}, REVISION) ===
REVISION SESSION: The student just revised their essay. Your job is to RESPOND
TO THEIR WORK — not to diagnose from scratch or create writing prompts.
Assess what changed, name the craft shift, flag any regressions or broken
connections, and give ONE clear next step.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
      }

      if (coachingMode === 'iteration_deep') {
        // Build revision quality history for iteration context
        const revQualityEvents = sessionMemory.events
          .filter(e => e.kind.startsWith('revision_quality:'))
          .slice(-5);
        const revHistorySection = revQualityEvents.length > 0
          ? `\nITERATION HISTORY:\n${revQualityEvents.map((e, i) =>
              `- v${i + 1} → v${i + 2}: ${e.kind.replace('revision_quality:', '')} — ${e.summary}`
            ).join('\n')}`
          : '';

        // Diminishing returns signal: last 2 revisions both lateral
        const lastTwo = revQualityEvents.slice(-2);
        const diminishingReturns = lastTwo.length === 2 &&
          lastTwo.every(e => e.kind === 'revision_quality:lateral');
        const diminishingSignal = diminishingReturns
          ? `\nDIMINISHING RETURNS: Last 2 revisions were LATERAL (not clearly better or worse). Consider graduating this section.`
          : '';

        return `\n\n=== SESSION ARC (turn ${turnCount}, ITERATION ${iterationRound ?? '3+'}) ===
ITERATION SESSION: The student has revised this section ${iterationRound ?? '3+'}+ times.
The big structural moves are done. Focus on sentence-level precision, voice
consistency, and section readiness. If the section is earning its place, say so
and redirect to the next priority. Don't coach a finished section.${revHistorySection}${diminishingSignal}
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
      }

      if (coachingMode === 'architecture') {
        return `\n\n=== SESSION ARC (turn ${turnCount}, ARCHITECTURE) ===
ARCHITECTURE SESSION: The student just reorganized their essay's structure.
They're thinking about the essay's BONES — paragraph order, reader journey,
structural logic. Meet them at that level.
Assess the new sequence, audit connections, suggest ONE structural adjustment.
Do NOT drop into sentence-level feedback. Stay at paragraph level.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
      }

      if (coachingMode === 'polish') {
        return `\n\n=== SESSION ARC (turn ${turnCount}, POLISH) ===
POLISH SESSION: The essay is structurally sound. Voice is working. Architecture
earns the reader's attention. You're in precision mode.
Every word pays rent. Every sentence has rhythm. The opening hooks in 2 seconds.
The closing lingers. Suggest ONE change per turn — the change that moves the
essay from "admits" to "remembers."
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
      }

      // Default: turn-count-based session arc (first_encounter / conversation)
      if (turnCount <= 3) {
        return `\n\n=== SESSION ARC (turn ${turnCount}) ===
EARLY SESSION: You're building trust AND material simultaneously.
SCOPE: Focus on ONE thing this session — finding the essay's real opening
or identifying its true subject. Don't try to fix structure, voice,
ending, AND opening in one conversation. Set expectations early: "Let's
focus on finding where this essay actually starts. Structure is for next time."

Your goals:
1. Identify what this essay is TRYING to do and where it does it best
2. COLLECT scene-worthy details — names, moments, physical specifics
3. DEMONSTRATE ONCE, then hand it back — show them what their material
   could do in 2-3 sentences, then say "now you try — write me the
   next version in your own voice." The goal is THEIR writing, not yours.
4. Ask the question that connects the essay to WHO THEY ARE — not just
   what happened, but what it reveals about how their mind works.
   "That debugging loop — is that how you think about other things too?"
   moves the essay from narrative to identity-revelation.`;
      }

      if (turnCount <= 8) {
        return `\n\n=== SESSION ARC (turn ${turnCount}) ===
MIDDLE SESSION: The student has shared material and you've identified issues.
Now GET THEM WRITING. Stop writing samples for them. Instead:
- Give them a specific writing prompt: "Write the first three sentences
  of P1 using what we discussed. Go."
- Coach their actual prose — what works, what to push, what to cut.
- If they haven't written anything yet, that's your priority. Insights
  without student writing is a lecture, not coaching.
One deep issue per turn. Stay with it until they've written something.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
      }

      return `\n\n=== SESSION ARC (turn ${turnCount}) ===
LATE SESSION: Consolidate. The student should leave with:
1. A clear first revision task ("Rewrite P1 using the hackathon scene. 160 words max.")
2. An understanding of the ONE principle that matters most for their essay
3. Something they WROTE during this conversation — even if it's rough
Do NOT introduce new issues. Do NOT write more sample prose. Help them
prioritize what to do FIRST when they sit down to revise.
${sessionMemory.sessionArcSummary ? `ARC SO FAR: ${sessionMemory.sessionArcSummary}` : ''}
${strategicThreadSection}
${stalenessNote}`;
    })();

    // Session journal from high-significance events
    const journalEvents = sessionMemory.events
      .filter(e => e.kind === 'journal')
      .slice(-5);
    const journalSection = journalEvents.length > 0
      ? `\n\nSESSION JOURNAL (what happened in this conversation):\n` +
        journalEvents.map(e => e.summary).join(' ')
      : '';

    // ── Session Momentum Signal ──
    // High-level progress metric so the coach calibrates push vs. celebrate
    const momentumSignal = (() => {
      if (turnCount <= 2) return ''; // Too early

      const cl = sessionMemory.revisionChecklist ?? [];
      const addressedCount = cl.filter(t => t.status === 'addressed').length;
      const totalCount = cl.length;

      const revEvents = sessionMemory.events
        .filter(e => e.kind.startsWith('revision_quality:'))
        .slice(-3);
      const revTrend = revEvents.length > 0
        ? revEvents.map(e => e.kind.replace('revision_quality:', '')).join(' → ')
        : null;

      const parts: string[] = [];
      if (totalCount > 0) parts.push(`Checklist: ${addressedCount}/${totalCount} addressed`);
      if (revTrend) parts.push(`Revisions: ${revTrend}`);

      const defl = sessionMemory.deflectionCounter ?? 0;
      const isStalled = defl >= 2 || (revEvents.length >= 2 && revEvents.every(e => e.kind.includes('lateral')));
      const isProgressing = addressedCount > 0 || revEvents.some(e => e.kind.includes('improved'));
      const status = isStalled ? 'STALLED' : isProgressing ? 'PROGRESSING' : 'BUILDING';

      return parts.length > 0
        ? `\n\nSESSION MOMENTUM [${status}]: ${parts.join(' | ')}` +
          (isStalled ? '\nChange approach — what you\'ve been trying isn\'t landing.' : '') +
          (isProgressing ? '\nMomentum is building. Push slightly harder each turn.' : '')
        : '';
    })();

    // ── Revision Checklist context ──
    const checklist = sessionMemory.revisionChecklist;
    const checklistSection = checklist && checklist.length > 0
      ? `\n\n=== REVISION CHECKLIST ===\n` +
        checklist.map(t => {
          const statusIcon = t.status === 'addressed' ? '[DONE]' : t.status === 'in_progress' ? '[IN PROGRESS]' : `[${t.priority}]`;
          const techNote = t.technique ? ` (${t.technique})` : '';
          return `  ${statusIcon} ${t.task}${techNote}`;
        }).join('\n') +
        `\nReference tasks by number when coaching. Current priority: ${
          checklist.find(t => t.status === 'pending')?.task ?? 'all tasks addressed'
        }` +
        (turnCount >= 9 ? `\nLATE SESSION: Output remaining PENDING tasks as "Your revision plan" with specific instructions for each.` : '')
      : '';

    // ── Improvement Queue (from analysis manifest) ──
    const improvementQueueSection = this.buildImprovementQueueSection(profile, sessionMemory);

    // ── Phase 3: edge-protocol directives ──
    // Three bounded edge behaviors, each conditionally emits a prompt
    // directive. All guards are pure and unit-tested in
    // tests/unit/test-edge-protocol.ts — the regression surface is small.
    //   3.1 killer diagnostic — turn 1 only, uses AO first-read data
    //   3.2 calibrated pushback — first deflection, max once per session
    //   3.3 blindSpot surfacing — emotional opening + ready hypothesis, max once
    let edgeProtocolSection = '';
    const turnNumberForEdge = (sessionMemory.turnCount ?? 0) + 1;
    edgeProtocolSection += edgeProtocol.killerDiagnosticDirective(
      turnNumberForEdge,
      profile.aoFirstRead,
    );
    if (edgeProtocol.shouldAllowPushback(sessionMemory)) {
      edgeProtocolSection += edgeProtocol.pushbackDirective();
    }
    if (edgeProtocol.shouldSurfaceBlindSpot(sessionMemory, sessionMemory.studentTheory, studentMessage)) {
      edgeProtocolSection += edgeProtocol.blindSpotDirective(sessionMemory.studentTheory!);
    }

    // ── Phase 4.3: length calibration hint ──
    // V2 T5 was 490 words (overload). Giving the LLM a numeric target it can
    // follow keeps response density tuned to turn position + session state.
    // Pass the pre-estimated intensity so the calibrator's wordBudget aligns
    // with the maxTokens we send to Anthropic (no more 1500-token ceilings on
    // a turn we already classified as 'minimal').
    const lengthBudget = lengthCalibrator.calibrateLengthBudget(
      {
        turnNumber: turnNumberForEdge,
        estimatedIntensity,
        isInSessionDraftFeedback: isInSessionDraft,
      },
      sessionMemory,
    );
    const lengthHintSection = lengthCalibrator.budgetHintForPrompt(lengthBudget);

    // ── W6.2: Escalation context for confused students ──
    const escalationSection = this.buildEscalationContext(sessionMemory);

    // ── Resistance escalation context ──
    const resistanceEscalationSection = this.buildResistanceEscalationContext(sessionMemory);

    // ── Demonstration trigger (mode + deflection gated) ──
    // First_encounter mode always allows demonstrations. Other modes allow demos
    // when the student is deflecting (deflectionCounter >= 2) — if the current
    // approach isn't working, demonstrating the next improvement breaks the deadlock.
    const demoDeflCount = sessionMemory.deflectionCounter ?? 0;
    const demoTrigger = (coachingMode === 'first_encounter' || demoDeflCount >= 2)
      ? this.shouldTriggerDemonstration(
          sessionMemory, profile, quickFocus, studentMessage, conversationHistory,
        )
      : null;
    const sessionTheory = sessionMemory.studentTheory;
    // Round-3 Coaching Integration: expose theory maturity so the coach
    // calibrates trust in the personhood read. At 'nascent' (T2), the theory
    // is a hypothesis — coach should not stake coaching moves on it. At
    // 'confirmed' (T5+), it can drive framing.
    const theoryMaturityNote = sessionTheory?.maturity
      ? ` [maturity=${sessionTheory.maturity}${sessionTheory.maturity === 'nascent' ? ' — hypothesis only, do NOT stake major coaching moves on this' : ''}]`
      : '';
    const theoryContext = sessionTheory
      ? `\nSTUDENT THEORY${theoryMaturityNote}: ${sessionTheory.personhood}\nTENSIONS: ${sessionTheory.tensions.map(t => `${t.studentSays} vs ${t.essayShows}`).join('; ')}\nYour demonstration should illuminate a tension, not just fix a craft issue.`
      : '';
    const priorDemoCount = sessionMemory.demonstrationCount ?? 0;
    // Demo budget is improvement-driven, not count-driven. Always allow demonstrations.
    // After 2+ demos, write brief (2 sentences) then give a writing prompt.
    const shouldCoachWrite = true;
    const demonstrationSection = demoTrigger
      ? `\n\n=== DEMONSTRATION DIRECTIVE (ACTIVE) ===\n${demoTrigger.reason}\n` +
        `Write 2-4 sentences of sample prose using the student's own details to show\n` +
        `what the current issue LOOKS LIKE when fixed. Name the craft move.\n` +
        `After your demonstration, say: "That's my version — now write yours."\n` +
        (priorDemoCount >= 2
          ? `You've demonstrated ${priorDemoCount} times. THIS TIME: demonstrate briefly (2 sentences max),\n` +
            `then give a SPECIFIC writing prompt with constraints: which paragraph, how many\n` +
            `sentences, what details to include. The demo calibrates; the prompt gets them writing.\n`
          : '') +
        `\nSTUDENT'S AVAILABLE DETAILS: ${profile.studentDeclaredContext || '(limited — use what you have)'}${theoryContext}`
      : '';
    // Track demonstrations. Only reset deflection counter if the demo was
    // for a non-deflection reason (explicit ask, staleness, context). For
    // deflection-triggered demos, keep the counter at 1 so one more
    // deflection turn immediately triggers again (prevents repeating demands).
    if (demoTrigger) {
      if (shouldCoachWrite) {
        sessionMemory.demonstrationCount = priorDemoCount + 1;
      }
      const postDemoDeflCount = sessionMemory.deflectionCounter ?? 0;
      if (postDemoDeflCount >= 2) {
        // Deflection-triggered: keep counter at 1 for quick re-trigger
        sessionMemory.deflectionCounter = 1;
      } else {
        sessionMemory.deflectionCounter = 0;
      }
    }

    // Deflection escalation is now handled within the demonstration trigger
    // (condition 2 produces enhanced text at deflectionCounter >= 3).
    // The StudentTheory context is already wired into theoryContext above.

    // ── GAP-2 FIX: Learning Style Activation fallback ──
    // Build learning style context from accumulated observations if the caller
    // didn't provide an explicit learningStyleContext string. This ensures the
    // coach adapts to observed learning patterns even in code paths that skip
    // the external section builder.
    let builtLearningStyleContext: string | undefined;
    const memWithStyle = sessionMemory as SessionMemoryWithStyle;
    if (memWithStyle.learningStyleObservations?.observations?.length) {
      const confidentObs = memWithStyle.learningStyleObservations.observations
        .filter(o => o.confidence === 'confident' || o.confidence === 'growing')
        .slice(-3); // Last 3 confident/growing observations
      if (confidentObs.length > 0) {
        builtLearningStyleContext =
          `\n\n=== LEARNING STYLE (observed across ${sessionMemory.turnCount} turns) ===\n` +
          confidentObs.map(o => `- [${o.confidence}] ${o.observation}`).join('\n') +
          `\nAdapt your coaching delivery to match these patterns.`;
      }
    }
    // Use caller-provided context if available, otherwise fall back to built context
    const effectiveLearningStyle = learningStyleContext ?? builtLearningStyleContext;

    // ── Round-3 Coaching Integration: prior-turn session-memory surfacing ──
    // CACHE-OPTIMIZED SPLIT: directive text (how to handle each payload) is in
    // the system prompt via round3DirectivesBlock(). Here we emit ONLY the
    // per-turn variable values — the quoted question, hypothesis, observation
    // list — keeping the user-prompt delta as small as possible.
    // Each *Data() call emits '' when its triggering condition is not met;
    // safe to concat unconditionally.
    const priorStrategicSection = strategicQuestionFromPriorTurnData(
      sessionMemory.priorTurnStrategicQuestion,
    );
    const mirrorSection = innerVoiceMirrorCandidateData(
      sessionMemory.priorTurnCognitiveAssessment,
      turnCount,
      sessionMemory.mirrorSurfacedAtTurn,
    );
    // If the mirror opportunity was surfaced to the coach this turn, record it
    // so the 3-turn cooldown kicks in. We intentionally record on OPPORTUNITY,
    // not on confirmed-use, because we can't observe whether the coach actually
    // mirrored (same logic as edgeProtocol.pushback). Under-firing is preferred
    // to over-firing for this section — it controls a psychological-register
    // move that degrades quickly under repetition.
    if (mirrorSection.length > 0) {
      sessionMemory.mirrorSurfacedAtTurn = turnCount;
    }
    const learningStyleCalibration = learningStyleCalibrationData(
      memWithStyle.learningStyleObservations?.observations,
    );

    // User message = dynamic per-turn content + findings + teaching content
    // Findings are here (not in system prompt) because they change per turn based on focus paragraphs.
    // This keeps the system prompt stable for Anthropic prompt caching.
    const userPrompt = `${findingSection ? `${findingSection}\n\n` : ''}${dynamicProfileContext ? `===STUDENT CONTEXT (this session)===\n${dynamicProfileContext}\n\n` : ''}===CONVERSATION===
${conversationText}

STUDENT (current message):
"${studentMessage}"
${editContextSection}
${stage1Section}
${sessionArcSection}${journalSection}${momentumSignal}${checklistSection}${improvementQueueSection}${edgeProtocolSection}${priorStrategicSection}${mirrorSection}${learningStyleCalibration}${lengthHintSection}${effectiveLearningStyle ?? ''}${crossModuleContext ? `\n\n=== PORTFOLIO CONTEXT (from other modules — reference ONLY if relevant to the student's question) ===\n${crossModuleContext}` : ''}
${escalationSection}${resistanceEscalationSection}${demonstrationSection}${isInSessionDraft ? `

=== IN-SESSION DRAFT DETECTED ===
The student just wrote draft prose in the chat. Coach their ACTUAL WRITING:

SENTENCE-BY-SENTENCE:
Walk through each sentence in their draft:
- S1: What does it do for the reader? Does it earn its place?
- S2: Does it advance from S1? What craft move is it attempting?
- Continue for each sentence.

Name what's WORKING and why (not just "good" — what specific craft effect).
Name the ONE sentence that needs the most work and demonstrate the fix.
Then: "Which sentence felt easiest to write? Which felt forced?"

Compare against the essay's profile: Does the voice match? Does it address
a finding from the checklist? Does it move the committee one-liner?` : ''}
${patternSection}
${(() => {
  // Prior coaching suggestions — tell the coach what it already recommended
  const suggestions = sessionMemory.events
    .filter(e => e.kind === 'coach_suggestion')
    .slice(-3);
  if (suggestions.length === 0) return '';
  return '\n\n=== YOUR PRIOR SUGGESTIONS (do NOT repeat these verbatim — reference them or build on them) ===\n' +
    suggestions.map(s => `Turn ${s.turn}: ${s.summary}`).join('\n') +
    '\nIf the student hasn\'t acted on a prior suggestion, you may reference it: "In our earlier discussion, I suggested X for P2 — have you had a chance to try that?"';
})()}
${antiRepetitionSection}
${editStrategySection}

Respond to the student's message. Apply all constraints from your role identity. Write directly to the student — no meta-commentary about the profile or the system. Remember to append the <!--METADATA--> sidecar after your response.${
      // GAP-15: Inject explicit length directive based on pre-estimated intensity
      estimatedIntensity === 'minimal'
        ? '\n\nRESPONSE LENGTH: MINIMAL. 1-3 sentences maximum. Acknowledge what they said. Advance with a question or redirect. Nothing more.'
        : estimatedIntensity === 'brief'
        ? '\n\nRESPONSE LENGTH: BRIEF. 3-6 sentences maximum. Address the point, add ONE observation, suggest next step. Do NOT elaborate beyond what is needed.'
        : '' // 'full' — existing "shorter is better" guidance in the philosophy block applies
    }`;

    // Cost-cut: bind maxTokens to lengthCalibrator.wordBudget (≈1.6 tokens/word
    // + 200 cushion for the sidecar). The previous fixed ladder
    // (full=1500, brief=1000, minimal=500) let Sonnet write 600w when its
    // word budget was 240w, blowing through both the cap and the cost target.
    // Using lengthBudget.maxTokens keeps the API ceiling honest:
    //   full(240w) → 584 tokens   brief(110w) → 376 tokens   minimal(45w) → 350 tokens
    // Add a ~200-token sidecar cushion above the budget for safety on full/brief.
    const dynamicMaxTokens = lengthBudget.maxTokens;

    // temperature 0.4 (lower reduces constraint violations)
    const response = await callClaudeWithRetry<string>(
      {
        model: SONNET,
        systemPrompt,
        userPrompt,
        maxTokens: dynamicMaxTokens,
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

    const rawText = typeof response.content === 'string' ? response.content : String(response.content);
    const { response: coachingResponse, sidecar } = this.parseSidecarResponse(rawText);
    return { response: coachingResponse, sidecar, s3Cost };
  }

  /**
   * Build STABLE profile context — goes into the system prompt (cached).
   * Contains: North Star, structural roles, critical concerns, assembled profile sections.
   * These rarely change during a coaching session (only on finding supersession or edit reanalysis).
   */
  private buildStableProfileContext(
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

    // AO perspective (from AO First Read + admissions positioning — grounds coaching in admissions reality)
    if (profile.aoFirstRead) {
      const ao = profile.aoFirstRead;
      parts.push(
        `AO PERSPECTIVE: ${ao.gutReaction}` +
        (ao.putDownRisk === 'high' ? `\nPUT-DOWN RISK: HIGH — the essay needs to differentiate in the first 2 sentences.` : '') +
        (ao.committeeOneLiner ? `\nCOMMITTEE ONE-LINER: "${ao.committeeOneLiner}" — is this how the student wants to be remembered?` : '')
      );
    }
    if (profile.admissionsPositioning?.archetypeContext) {
      const ac = profile.admissionsPositioning.archetypeContext;
      if (ac.poolDensity === 'saturated' || ac.poolDensity === 'common') {
        parts.push(`ARCHETYPE WARNING: This is a "${ac.archetype}" essay (${ac.poolDensity} in the pool). The student needs to know: AOs have read dozens of these. The fix isn't changing the topic — it's making the execution unmistakable.`);
      }
    }

    // Word count — derive limit from essay type (PIQ=350, supplement=250, Common App=650)
    const WORD_LIMITS: Record<string, number> = {
      supplement: 250,
      piq: 350,
      personal_statement: 650,
    };
    const wordLimit = WORD_LIMITS[profile.northStar.activeScale] ?? 650;
    const totalWords = profile.paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0);
    const pctUsed = totalWords / wordLimit;
    parts.push(
      `WORD COUNT: ${totalWords}/${wordLimit}` +
      (pctUsed > 0.92 ? ' — TIGHT. Every addition requires a specific cut.' :
       pctUsed > 0.77 ? ' — some room, but word economy still applies.' :
       ' — room to expand, but resist filling it with decoration.'),
    );

    // Intent vs text tension (powerful coaching material when present)
    if (profile.northStar.intentBridge?.studentIntent) {
      const bridge = profile.northStar.intentBridge;
      const divergent = bridge.alignments?.filter(a => a.alignment === 'divergent') ?? [];
      if (divergent.length > 0) {
        parts.push(
          `INTENT vs TEXT: Student says this essay is about "${bridge.studentIntent}." ` +
          `The text actually communicates: ${divergent[0].detail}. This gap is coaching material.`,
        );
      }
    }

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

    // Coherence contradictions — internal tensions the coach should be aware of
    // These are from L4 crystallization: places where the profile contradicts itself
    if (profile.coherenceReport?.contradictions) {
      const notable = profile.coherenceReport.contradictions
        .filter((c: any) => c.severity === 'blocking' || c.severity === 'notable')
        .slice(0, 3);
      if (notable.length > 0) {
        parts.push(
          `INTERNAL TENSIONS (the analysis found contradictions — use these as coaching material):\n` +
          notable.map((c: any) =>
            `  "${c.claimA}" vs "${c.claimB}" — ${c.suggestedResolution || c.nature || 'unresolved tension'}`
          ).join('\n'),
        );
      }
    }

    // Analysis digest — tells the coach what the student has already seen
    // so the coach skips diagnosis and starts workshopping
    const revPriorities = this.buildRevisionPrioritySummary(profile);
    if (revPriorities) {
      parts.push(
        `STUDENT HAS ALREADY SEEN:\n` +
        `The student read the full analysis before this conversation. They know:\n` +
        (profile.aoFirstRead?.committeeOneLiner
          ? `- Committee one-liner: "${profile.aoFirstRead.committeeOneLiner}"\n`
          : '') +
        (profile.aoFirstRead?.putDownRisk
          ? `- Put-down risk: ${profile.aoFirstRead.putDownRisk}\n`
          : '') +
        `- Improvement phase: ${profile.index.improvementPhase?.level ?? 'foundation'}\n` +
        revPriorities +
        `\nCOACHING RULE: Reference priorities by number ("Let's work on Priority #1"). ` +
        `Do NOT re-diagnose what the analysis document already covers. ` +
        `Your job is to EXECUTE on the priorities — present options, help them write, ` +
        `coach their sentences. Diagnosis is done. Workshopping starts now.`,
      );
    }

    // Assembled profile sections — SIGNAL EXTRACTION, not full JSON dump.
    // The hand-crafted sections above already cover North Star, AO perspective,
    // archetype, word count, intent, critical concerns, and coherence tensions.
    // From the router's assembled sections, extract only the coaching-relevant
    // signals that aren't already covered. This reduces system prompt from ~17K
    // to ~6K tokens while preserving every signal the coach actually uses.
    for (const section of assembledContext.sections) {
      const content = section.content as Record<string, unknown>;
      if (!content || typeof content !== 'object') continue;

      switch (section.name) {
        case 'profileIndex':
        case 'northStar':
        case 'admissionsPositioning':
          // Already covered by hand-crafted sections above — skip to avoid duplication
          break;

        case 'voiceIdentity': {
          // Coach needs: primary register, authenticity markers, signature moves
          // VoiceIdentity fields: register, signature, distinctivePatterns, evolution, authenticVsPerformed
          const vi = content as Record<string, unknown>;
          const register = vi.register ?? '';
          const authenticity = vi.authenticVsPerformed ?? '';
          const signature = vi.signature ?? vi.distinctivePatterns ?? '';
          if (register || authenticity) {
            parts.push(
              `VOICE: ${typeof register === 'string' ? register : JSON.stringify(register)}` +
              (authenticity ? ` | Authenticity: ${typeof authenticity === 'string' ? authenticity : JSON.stringify(authenticity).slice(0, 200)}` : '') +
              (signature ? ` | Signature: ${typeof signature === 'string' ? signature : JSON.stringify(signature).slice(0, 150)}` : ''),
            );
          }
          break;
        }

        case 'emotionalTopography': {
          // Coach needs: where emotion peaks/valleys are, overall arc
          const et = content as Record<string, unknown>;
          const arc = et.emotionalArc ?? et.arc ?? '';
          const peaks = et.peaks ?? et.emotionalPeaks ?? [];
          if (arc || (Array.isArray(peaks) && peaks.length > 0)) {
            parts.push(
              `EMOTION: ${typeof arc === 'string' ? arc : JSON.stringify(arc).slice(0, 200)}` +
              (Array.isArray(peaks) && peaks.length > 0
                ? ` | Peaks: ${peaks.slice(0, 3).map((p: any) => typeof p === 'string' ? p : `P${p.paragraph ?? '?'}: ${p.description ?? p.moment ?? ''}`).join('; ').slice(0, 200)}`
                : ''),
            );
          }
          break;
        }

        case 'thematicArchitecture': {
          // Coach needs: central thesis + thread names (not full evidence chains)
          const ta = content as Record<string, unknown>;
          const thesis = ta.centralThesis ?? ta.thesis ?? '';
          const threads = ta.threads ?? ta.thematicThreads ?? [];
          if (thesis) {
            parts.push(
              `THEMES: ${typeof thesis === 'string' ? thesis : JSON.stringify(thesis).slice(0, 200)}` +
              (Array.isArray(threads) && threads.length > 0
                ? ` | Threads: ${threads.slice(0, 4).map((t: any) => typeof t === 'string' ? t : (t.thread ?? t.name ?? '')).join(', ')}`
                : ''),
            );
          }
          break;
        }

        case 'narrativeStrategy': {
          // Coach needs: strategy name + execution quality assessment
          const ns2 = content as Record<string, unknown>;
          const strategy = ns2.primaryStrategy ?? ns2.strategy ?? '';
          const execution = ns2.executionQuality ?? ns2.effectiveness ?? '';
          if (strategy) {
            parts.push(
              `NARRATIVE: ${typeof strategy === 'string' ? strategy : JSON.stringify(strategy).slice(0, 300)}` +
              (execution ? ` | Execution: ${typeof execution === 'string' ? execution : JSON.stringify(execution).slice(0, 150)}` : ''),
            );
          }
          break;
        }

        case 'characterRevelation': {
          // Writer portrait is already in hand-crafted section via profile.characterRevelation.writerPortrait
          // Only add blind spots and growth areas if present
          const cr = content as Record<string, unknown>;
          const blindSpots = cr.blindSpots ?? [];
          if (Array.isArray(blindSpots) && blindSpots.length > 0) {
            parts.push(
              `BLIND SPOTS: ${blindSpots.slice(0, 3).map((b: any) => typeof b === 'string' ? b : JSON.stringify(b).slice(0, 100)).join('; ')}`,
            );
          }
          break;
        }

        case 'craftAssessment': {
          // Coach needs: top strengths and top weaknesses (not full dimension scores)
          const ca = content as Record<string, unknown>;
          const strengths = ca.strengths ?? ca.topStrengths ?? [];
          const weaknesses = ca.weaknesses ?? ca.topWeaknesses ?? ca.growthAreas ?? [];
          if ((Array.isArray(strengths) && strengths.length > 0) || (Array.isArray(weaknesses) && weaknesses.length > 0)) {
            let craftLine = 'CRAFT: ';
            if (Array.isArray(strengths) && strengths.length > 0) {
              craftLine += `Strengths: ${strengths.slice(0, 3).map((s: any) => typeof s === 'string' ? s : (s.name ?? s.description ?? '')).join(', ').slice(0, 200)}`;
            }
            if (Array.isArray(weaknesses) && weaknesses.length > 0) {
              craftLine += ` | Growth: ${weaknesses.slice(0, 3).map((w: any) => typeof w === 'string' ? w : (w.name ?? w.description ?? '')).join(', ').slice(0, 200)}`;
            }
            parts.push(craftLine);
          }
          break;
        }

        default:
          // For any other sections (paragraphDigests, connections, etc.),
          // include a compact summary only if small enough
          if (section.tokenEstimate && section.tokenEstimate < 300) {
            const text = typeof content === 'string' ? content : JSON.stringify(content);
            parts.push(`[${section.name.toUpperCase()}]\n${text}`);
          }
          // Skip large sections — the hand-crafted signals above cover the coaching needs
          break;
      }
    }

    // NOTE: Cross-module context is NOT in the stable profile (it would distract on
    // every turn). It goes into the dynamic user prompt ONLY when the student asks
    // about strategy, portfolio, positioning, or "what makes me stand out" — not when
    // they ask about a specific paragraph's craft. See user prompt construction.

    return parts.join('\n\n');
  }

  /**
   * Build DYNAMIC profile context — goes into the user prompt (NOT cached).
   * Contains: conversation insights, declared context — these change per turn.
   */
  private buildDynamicProfileContext(
    profile: EssayProfile,
    sessionMemory?: CoachingSessionMemory,
  ): string {
    const parts: string[] = [];

    // Conversation insights (grows per turn via Stage 4)
    const recentInsights = this.selectCoachingInsights(profile.conversationInsights, 8);
    if (recentInsights.length > 0) {
      const insightLines = recentInsights.map(i =>
        `  [${i.category.toUpperCase()}] "${i.sourceText}" (${i.durability})`
      );
      parts.push(`STUDENT-REVEALED CONTEXT:\n${insightLines.join('\n')}`);
    }

    // StudentTheory — when available (on session memory), inject the structured theory
    // alongside the flat studentDeclaredContext blob. Theory provides interpretive depth.
    const theory = sessionMemory?.studentTheory;
    if (theory) {
      const theoryParts: string[] = [
        `WHO THEY ARE: ${theory.personhood}`,
      ];
      if (theory.protectedValues.length > 0) {
        theoryParts.push(`WHAT THEY PROTECT (do not suggest changing): ${theory.protectedValues.map(v => `${v.value} (${v.implication})`).join('; ')}`);
      }
      if (theory.tensions.length > 0) {
        theoryParts.push(`TENSIONS: ${theory.tensions.map(tn => `"${tn.studentSays}" vs essay shows: "${tn.essayShows}" → ${tn.coachingOpportunity}`).join('; ')}`);
      }
      if (theory.blindSpotHypotheses.length > 0) {
        const ready = theory.blindSpotHypotheses.filter(h => h.readyToSurface);
        if (ready.length > 0) {
          theoryParts.push(`HYPOTHESES (you may be wrong): ${ready.map(h => h.hypothesis).join('; ')}`);
        }
      }
      if (theory.essayRelationship) {
        theoryParts.push(`THEIR RELATIONSHIP TO THIS ESSAY: ${theory.essayRelationship}`);
      }
      if (theory.crossLayerPatterns.length > 0) {
        theoryParts.push(`CROSS-LAYER: ${theory.crossLayerPatterns.map(p => `${p.analysisObservation} + ${p.conversationEvidence} → ${p.coachingImplication}`).join('; ')}`);
      }
      parts.push(`STUDENT THEORY (synthesized understanding — use this to personalize your approach):\n${theoryParts.join('\n')}`);
    }

    // Pre-theory observations (raw identity signals before first synthesis)
    if (!theory && sessionMemory?.preTheoryObservations?.length) {
      parts.push(
        `EARLY IDENTITY SIGNALS (raw observations — not yet synthesized):\n` +
        sessionMemory.preTheoryObservations.map(o => `- ${o}`).join('\n'),
      );
    }

    // Structured student context — for writing prompt generation
    const sc = profile.structuredContext;
    if (sc && (sc.people.length > 0 || sc.places.length > 0 || sc.moments.length > 0)) {
      const scParts: string[] = ['STUDENT\'S AVAILABLE MATERIAL (use these EXACT names and details in writing prompts):'];
      if (sc.people.length > 0) {
        scParts.push(`  People: ${sc.people.map(p => p.relationship ? `${p.name} (${p.relationship})` : p.name).join(', ')}`);
      }
      if (sc.places.length > 0) {
        scParts.push(`  Places: ${sc.places.map(p => p.sensoryDetail ? `${p.place} (${p.sensoryDetail})` : p.place).join(', ')}`);
      }
      if (sc.moments.length > 0) {
        scParts.push(`  Key moments: ${sc.moments.map(m => m.moment).join('; ')}`);
      }
      if (sc.concreteDetails.length > 0) {
        scParts.push(`  Details: ${sc.concreteDetails.map(d => d.detail).join(', ')}`);
      }
      parts.push(scParts.join('\n'));
    }

    // Always include flat declared context for raw detail access
    if (profile.studentDeclaredContext) {
      parts.push(
        `STUDENT'S REAL DETAILS (use these for personalized examples and coaching):\n${profile.studentDeclaredContext}`
      );
    }

    // ── Progressive Depth Signal ──
    // As the session accumulates understanding, the coaching should deepen.
    // Computed ONCE per turn from accumulated signals — not per block.
    if (sessionMemory) {
      const depthSignals = {
        turnsCompleted: sessionMemory.turnCount,
        eventsAccumulated: sessionMemory.events.length,
        contextRichness: (profile.studentDeclaredContext?.length ?? 0),
        theoryPopulated: !!(sessionMemory.studentTheory?.personhood && sessionMemory.studentTheory.personhood.length > 20),
        findingsAddressed: sessionMemory.revisionChecklist?.filter(r => r.status === 'addressed').length ?? 0,
        findingsTotal: sessionMemory.revisionChecklist?.length ?? 0,
        editsProcessed: sessionMemory.events.filter(e => e.kind.startsWith('revision_quality:')).length,
        patternsObserved: sessionMemory.events.filter(e => e.kind.startsWith('resistance:') || e.kind.startsWith('reinterpretation:')).length,
      };

      const depthLevel = depthSignals.turnsCompleted <= 2 ? 'surface'
        : depthSignals.turnsCompleted <= 5 && !depthSignals.theoryPopulated ? 'developing'
        : depthSignals.theoryPopulated && depthSignals.contextRichness > 200 ? 'deep'
        : depthSignals.findingsAddressed >= 2 && depthSignals.editsProcessed >= 1 ? 'mastery'
        : 'developing';

      const depthDirectives: Record<string, string> = {
        surface: `DEPTH: SURFACE — You're still learning who this student is. Focus on COLLECTING material (scenes, details, moments) and DIAGNOSING the essay's core issue. Don't go deep on craft yet.`,
        developing: `DEPTH: DEVELOPING — You have some context now. Start connecting observations: "Earlier you mentioned X, and now I see Y in your essay — that tension is interesting." Push beyond surface diagnosis into WHY patterns exist.`,
        deep: `DEPTH: DEEP — You have a real theory of this student. Use it. Reference their protected values when they deflect. Name tensions between what they say and what the essay shows. Your coaching should feel like it comes from someone who KNOWS them, not someone reading their essay for the first time.`,
        mastery: `DEPTH: MASTERY — The student has been working. They've addressed findings, made edits, revealed context. Stop teaching principles — they know the principles. Coach at the sentence level. "This verb is doing nothing. Try: [specific alternative]." Every suggestion should be surgical, not structural.`,
      };

      parts.push(depthDirectives[depthLevel]);

      // At deep/mastery depth, inject a summary of what the system has accumulated
      if (depthLevel === 'deep' || depthLevel === 'mastery') {
        const contextSummary: string[] = [];
        if (profile.studentDeclaredContext) contextSummary.push(`Student context: ${profile.studentDeclaredContext.slice(0, 200)}...`);
        if (depthSignals.findingsAddressed > 0) contextSummary.push(`${depthSignals.findingsAddressed}/${depthSignals.findingsTotal} findings addressed`);
        if (depthSignals.editsProcessed > 0) contextSummary.push(`${depthSignals.editsProcessed} revisions processed`);
        if (depthSignals.patternsObserved > 0) contextSummary.push(`${depthSignals.patternsObserved} behavioral patterns observed`);
        if (contextSummary.length > 0) {
          parts.push(`\nACCUMULATED INTELLIGENCE: ${contextSummary.join(' | ')}`);
        }
      }
    }

    // ── GAP-1 FIX: Cognitive Assessment Feed-Forward ──
    // Inject the coach's prior inner voice and cognitive assessment so the coach
    // builds on its own prior read rather than rediscovering from scratch each turn.
    if (sessionMemory && sessionMemory.events.length > 0) {
      const lastInnerVoice = sessionMemory.events
        .filter(e =>
          e.kind.startsWith('new_context:') ||
          e.kind.startsWith('reinterpretation:') ||
          e.kind.startsWith('resistance:') ||
          e.kind === 'journal',
        )
        .slice(-2)
        .map(e => e.summary)
        .join(' ');

      if (lastInnerVoice) {
        parts.push(
          `\n=== YOUR PRIOR ASSESSMENT (from last turn) ===\n` +
          `${lastInnerVoice}\n` +
          `BUILD on this assessment. Don't rediscover what you already know. If your read has changed, name what changed and why.`,
        );
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : '';
  }

  /**
   * Select conversation insights for coaching context, respecting durability.
   * Durable insights (student_durable, essay_durable) are always included.
   * Remaining budget filled by most recent insights.
   */
  private selectCoachingInsights(
    insights: ConversationInsight[],
    budget: number,
  ): ConversationInsight[] {
    // Always include durable insights
    const durable = insights.filter(i =>
      i.durability === 'student_durable' || i.durability === 'essay_durable'
    );

    // Fill remaining budget with most recent non-durable
    const remaining = budget - durable.length;
    const nonDurable = insights
      .filter(i => i.durability !== 'student_durable' && i.durability !== 'essay_durable')
      .slice(-Math.max(0, remaining));

    return [...durable, ...nonDurable].slice(0, budget);
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
          coordinator,
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

    const response = await callClaudeWithRetry<string>(
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
    coordinator: EssayProfileCoordinator,
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
${profile.studentDeclaredContext ? `\nPreviously accumulated student context:\n"${profile.studentDeclaredContext}"\n\nDo NOT repeat information already captured above.\n` : ''}
Student reveals: "${studentMessage}"

INTEGRATE this new context:
1. Which existing sections of understanding does this change? (List by name: voiceIdentity, emotionalTopography, etc.)
2. What is the updated understanding that incorporates this context?
3. Are there any coaching implications — things the essay needs to change to honor this context?

Output JSON:
{
  "updatedUnderstanding": "<revised understanding incorporating student's context>",
  "affectedSections": ["emotionalTopography", "characterRevelation"],
  "integrationNotes": "<coaching implications of this new context>",
  "contextAccumulation": "<1-2 sentence addition to the student's context narrative. Write as if continuing a portrait: connect to what's already known when possible. Focus on NEW facts, relationships, and stated intent — not analysis. Include specific names, places, and events. If the student contradicts earlier context, note the correction (e.g., 'Student clarified the watch was grandmother's, not grandfather's'). If nothing genuinely new was revealed, return empty string.>"
}`;

    const response = await callClaudeWithRetry<string>(
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

    // Accumulate student-declared context from the contextAccumulation field
    if (parsed?.contextAccumulation) {
      const existing = profile.studentDeclaredContext || '';
      const newCtx = existing
        ? `${existing} ${parsed.contextAccumulation}`
        : parsed.contextAccumulation;
      coordinator.updateStudentDeclaredContext(newCtx);
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
        this.serializeEventsForPrompt(
          this.retrieveRelevantEvents(sessionMemory.events, [], []).slice(-5)
        )
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

    const response = await callClaudeWithRetry<string>({
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
- Sound like a real person, not a chatbot

${buildFabricationGuardBlock()}`;

    const userPrompt = `${historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''}STUDENT: "${studentMessage}"

ASSESSMENT: ${assessment.assessment}
WHAT THEY NEED: ${assessment.whatTheyNeed}

Respond briefly. 1-3 sentences max.`;

    const response = await callClaudeWithRetry<string>({
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
  // STUDENT THEORY SYNTHESIS
  // --------------------------------------------------------------------------

  /**
   * Synthesize a StudentTheory from the conversation so far.
   * Runs every 5 turns via Sonnet. Reads: conversation history,
   * accumulated portrait observations, essay profile (for cross-layer),
   * and the previous theory (for continuity).
   */
  private async synthesizeStudentTheory(
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    memory: CoachingSessionMemory,
  ): Promise<{ theory: StudentTheory; cost: LayerCost }> {
    const callStart = Date.now();

    // Gather inputs for synthesis
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_TURNS);
    const pendingObservations = [
      ...(memory.preTheoryObservations ?? []),
      ...(memory.studentTheory?.pendingObservations ?? []),
    ];
    const previousTheory = memory.studentTheory;
    const blindSpots = profile.characterRevelation?.blindSpots ?? [];
    const redFlags = profile.admissionsPositioning?.redFlags ?? [];
    const writerPortrait = profile.characterRevelation?.writerPortrait ?? '';

    const historyText = recentHistory
      .map(t => `${t.role === 'student' ? 'STUDENT' : 'COACH'}: ${t.content}`)
      .join('\n\n');

    const systemPrompt = `You are synthesizing everything the coaching system knows about this student AS A PERSON — not their essay, but who they are when they write.

Read the conversation below and produce a structured theory. This theory is for the COACH'S internal use — the student never sees it.

Every claim needs evidence from the conversation or analysis. Tensions must cite both sides. ProtectedValues must explain the IMPLICATION for coaching (how this should change what the coach does).

Output ONLY a JSON object matching this exact schema:
{
  "personhood": "<2-4 sentences. Who is this person beyond what the essay reveals. Their relationship to writing, their emotional patterns, what they protect.>",
  "protectedValues": [{"value":"<specific thing>","evidence":"<what they said/did>","implication":"<how this should change coaching>"}],
  "blindSpotHypotheses": [{"hypothesis":"<what they can't see>","analysisEvidence":"<from essay analysis>","coachingEvidence":"<from conversation>","readyToSurface":<boolean>}],
  "tensions": [{"studentSays":"<quote or paraphrase>","essayShows":"<what the analysis reveals>","coachingOpportunity":"<how to use this tension>"}],
  "essayRelationship": "<1-3 sentences. Why this essay matters to them, what they're trying to prove, what they're afraid of.>",
  "crossLayerPatterns": [{"analysisObservation":"<from essay analysis>","conversationEvidence":"<from chat>","coachingImplication":"<what to do with it>"}],
  "synthesizedAtTurn": ${memory.turnCount},
  "pendingObservations": []
}

STAGED EXPECTATIONS BY TURN:
- Turn 2 (NASCENT): Only 1 student response of evidence. Hedge aggressively — use "possibly", "seems to be", "early signal suggests". "personhood" should be 1-2 sentences of tentative read. blindSpotHypotheses should have readyToSurface=FALSE until you see repetition. 1-2 pending observations is fine. Do NOT over-commit — a wrong theory at T2 poisons T3-T5.
- Turn 3 (HYPOTHESIS): 2 student responses. Still provisional — confirm whether T2 hedges are holding up. If a T2 signal repeats, upgrade it from "possibly" to "appears to". If contradicted, name the contradiction.
- Turn 4 (GROWING): Patterns should be repeating. tensions and protectedValues start to surface. blindSpotHypotheses readyToSurface=TRUE only if confirmed twice.
- Turn 5 (CONFIRMED): "personhood" and "essayRelationship" are PRIMARY — you have 4 turns of conversation, enough to see personality patterns. protectedValues and tensions may be sparse if insufficient evidence. That's fine.
- Turn 10+: ALL fields should be populated. You have enough conversation history to hypothesize about blind spots, tensions, and protected values.
- NEVER return empty strings for any field. If you lack evidence, write: "Insufficient signal — would need to see [specific thing you'd need]"
- 1 evidence-backed hypothesis is better than 0 populated fields. Take the inference.`;

    const userPrompt = `=== CONVERSATION (last ${recentHistory.length} turns) ===
${historyText}

${pendingObservations.length > 0 ? `=== PORTRAIT OBSERVATIONS (since last synthesis) ===\n${pendingObservations.join('\n')}\n` : ''}
${previousTheory ? `=== PREVIOUS THEORY (turn ${previousTheory.synthesizedAtTurn}) ===\nPersonhood: ${previousTheory.personhood}\nProtected: ${previousTheory.protectedValues.map(v => v.value).join('; ')}\nTensions: ${previousTheory.tensions.map(t => `${t.studentSays} vs ${t.essayShows}`).join('; ')}\n` : ''}
=== CROSS-LAYER DATA ===
Writer Portrait: ${writerPortrait}
Blind Spots (from analysis): ${blindSpots.join('; ') || 'none detected'}
Red Flags (from admissions positioning): ${redFlags.join('; ') || 'none'}
Student Declared Context: ${profile.studentDeclaredContext || 'none yet'}

${writerPortrait.length < 50 ? 'NOTE: Analysis portrait is preliminary. Prioritize conversation dynamics — what the student asks about, avoids, how they respond to feedback, what they deflect from.\n' : ''}${pendingObservations.length === 0 ? 'NOTE: No explicit portrait observations yet. Infer from conversation patterns — question types, resistance patterns, what topics they return to.\n' : ''}
Synthesize an updated theory. Be specific and evidence-grounded. Output only JSON.`;

    const response = await callClaudeWithRetry<string>({
      model: SONNET,
      systemPrompt,
      userPrompt,
      maxTokens: 2000,
      temperature: 0.3,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const timingMs = Date.now() - callStart;
    const rawCost = calculateCost(response.usage, SONNET);
    console.log(`[EssayIntelligence] L6 theory synthesis: ${response.usage.input_tokens.toLocaleString()} input + ${response.usage.output_tokens.toLocaleString()} output = $${rawCost.toFixed(4)}`);
    const tokenUsage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    const cost: LayerCost = { layer: 'L6_student_theory_synthesis', cost: rawCost, tokenUsage, timingMs };

    // Parse the theory JSON (5-level defensive: object → direct → strip fences → regex → jsonrepair)
    // With useJsonMode: true, callClaude returns an already-parsed object (not a string).
    let parsed: Record<string, unknown> = {};
    let parseSucceeded = false;
    let parseLevel = 0;

    // Level 0: Already-parsed object (useJsonMode returns parsed content)
    if (response.content && typeof response.content === 'object' && !Array.isArray(response.content)) {
      parsed = response.content as Record<string, unknown>;
      parseSucceeded = true;
      parseLevel = 0;
    }

    // Level 1-4: String parsing fallbacks (belt-and-suspenders)
    const rawText = parseSucceeded ? '' : (typeof response.content === 'string' ? response.content : JSON.stringify(response.content));

    // Level 1: Direct parse
    if (!parseSucceeded) {
      try { parsed = JSON.parse(rawText); parseSucceeded = true; parseLevel = 1; } catch { /* fall through */ }
    }

    // Level 2: Strip markdown fences
    if (!parseSucceeded) {
      try {
        const stripped = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
        parsed = JSON.parse(stripped);
        parseSucceeded = true;
        parseLevel = 2;
      } catch { /* fall through */ }
    }

    // Level 3: Regex extract JSON object
    if (!parseSucceeded) {
      try {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) { parsed = JSON.parse(match[0]); parseSucceeded = true; parseLevel = 3; }
      } catch { /* fall through */ }
    }

    // Level 4: jsonrepair (handles truncated JSON from maxTokens cutoff)
    if (!parseSucceeded) {
      try {
        const match = rawText.match(/\{[\s\S]*$/);
        if (match) {
          parsed = JSON.parse(jsonrepair(match[0]));
          parseSucceeded = true;
          parseLevel = 4;
          console.log('[CoachingService] StudentTheory recovered via jsonrepair');
        }
      } catch { /* fall through */ }
    }

    if (parseSucceeded) {
      console.log(`[CoachingService] StudentTheory parsed OK — level=${parseLevel}, rawLength=${rawText.length}`);
    } else {
      console.warn(`[CoachingService] StudentTheory parse FAILED all 4 levels — rawLength=${rawText.length}, first 500 chars: "${rawText.slice(0, 500)}"`);
    }

    const theory: StudentTheory = {
      personhood: typeof parsed.personhood === 'string' && parsed.personhood.length > 20
        ? parsed.personhood : 'Theory synthesis incomplete.',
      protectedValues: Array.isArray(parsed.protectedValues)
        ? (parsed.protectedValues as Array<Record<string, unknown>>)
            .filter(v => typeof v?.value === 'string')
            .map(v => ({ value: String(v.value), evidence: String(v.evidence ?? ''), implication: String(v.implication ?? '') }))
        : [],
      blindSpotHypotheses: Array.isArray(parsed.blindSpotHypotheses)
        ? (parsed.blindSpotHypotheses as Array<Record<string, unknown>>)
            .filter(h => typeof h?.hypothesis === 'string')
            .map(h => ({
              hypothesis: String(h.hypothesis),
              analysisEvidence: String(h.analysisEvidence ?? ''),
              coachingEvidence: String(h.coachingEvidence ?? ''),
              readyToSurface: typeof h.readyToSurface === 'boolean' ? h.readyToSurface : false,
            }))
        : [],
      tensions: Array.isArray(parsed.tensions)
        ? (parsed.tensions as Array<Record<string, unknown>>)
            .filter(t => typeof t?.studentSays === 'string')
            .map(t => ({
              studentSays: String(t.studentSays),
              essayShows: String(t.essayShows ?? ''),
              coachingOpportunity: String(t.coachingOpportunity ?? ''),
            }))
        : [],
      essayRelationship: typeof parsed.essayRelationship === 'string' && parsed.essayRelationship.length > 10
        ? parsed.essayRelationship : '',
      crossLayerPatterns: Array.isArray(parsed.crossLayerPatterns)
        ? (parsed.crossLayerPatterns as Array<Record<string, unknown>>)
            .filter(p => typeof p?.analysisObservation === 'string')
            .map(p => ({
              analysisObservation: String(p.analysisObservation),
              conversationEvidence: String(p.conversationEvidence ?? ''),
              coachingImplication: String(p.coachingImplication ?? ''),
            }))
        : [],
      synthesizedAtTurn: memory.turnCount,
      pendingObservations: [],
    };

    return { theory, cost };
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
      events: [],
      sessionArcSummary: '',
      nextFocus: '',
      strategicQuestion: '',
      questionStaleness: 0,
      priorTurnStrategicQuestion: null,
      priorTurnCognitiveAssessment: null,
      mirrorSurfacedAtTurn: undefined,
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
   * Promote learning style observations that have been confirmed by repeated similar signals.
   * Simple keyword overlap: if 2+ other observations share meaningful words, confidence increases.
   * tentative → growing (2+ confirmations), growing → confident (3+ confirmations).
   */
  private promoteLearningStyleConfidence(style: LearningStyleObservations): void {
    for (let i = 0; i < style.observations.length; i++) {
      if (style.observations[i].confidence === 'confident') continue;

      const words = new Set(
        style.observations[i].observation.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      );
      let confirmationCount = 0;

      for (let j = 0; j < style.observations.length; j++) {
        if (i === j) continue;
        const otherWords = style.observations[j].observation.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const overlap = otherWords.filter(w => words.has(w)).length;
        if (overlap >= 2) confirmationCount++;
      }

      if (confirmationCount >= 3 && style.observations[i].confidence === 'growing') {
        style.observations[i].confidence = 'confident';
      } else if (confirmationCount >= 2 && style.observations[i].confidence === 'tentative') {
        style.observations[i].confidence = 'growing';
      }
    }
  }

  /**
   * Update session memory after a coaching turn completes.
   * Creates a SessionEvent for the unified event log — the authoritative record.
   */
  private updateSessionMemory(
    sessionMemory: CoachingSessionMemory,
    studentMessage: string,
    stage1: Stage1Output,
    cognitiveAssessment: CognitiveAssessment,
  ): CoachingSessionMemory {
    const turnNumber = sessionMemory.turnCount + 1;

    // Extract paragraph refs from Stage 1 focus. focusProbabilities keys are
    // 1-indexed P-labels ("P1", "P2", …) — see runStage1InsightExtraction's
    // quickFocus/routingStage1 construction. Normalize to 0-indexed internal.
    const paragraphRefs: number[] = [];
    for (const [label, prob] of Object.entries(stage1.focusProbabilities)) {
      if (prob > 0.3) {
        const n = normalizeParagraphRef(label, 'coach_text');
        if (Number.isFinite(n)) paragraphRefs.push(n);
      }
    }

    // Build event kind from Stage 1 + cognitive assessment (always include category)
    const kindParts: string[] = [stage1.category];
    if (stage1.dimensionFocus.length > 0) kindParts.push(stage1.dimensionFocus[0]);
    const kind = kindParts.join(':');

    // Summary from cognitive assessment
    // Use the full assessment (which contains innerVoice when available) for richer journal entries
    const summary = cognitiveAssessment.assessment.length > 40
      ? cognitiveAssessment.assessment.slice(0, 200)
      : `${cognitiveAssessment.recommendedApproach} — student ${stage1.cognitiveState}`;

    // Significance heuristic (retrieval signal, not quality judgment)
    const significanceMap: Record<string, number> = {
      reinterpretation: 0.9, resistance: 0.85, new_context: 0.8,
      correction: 0.8, preference: 0.7, emotional_reaction: 0.6,
      confirmation: 0.4, clarification: 0.3,
    };

    const event: SessionEvent = {
      turn: turnNumber, kind, summary,
      significance: significanceMap[stage1.category] ?? 0.5,
      paragraphRefs,
      findingRefs: [], // TODO: Populate from Stage 4 finding evaluation (superseded/confirmed finding IDs)
    };

    sessionMemory.events.push(event);

    sessionMemory.turnCount = turnNumber;
    return sessionMemory;
  }

  /**
   * Retrieve relevant session events within a ~600 token budget.
   * Selection criteria:
   * 1. Always: the 3 most recent events (temporal relevance)
   * 2. Overlap: events whose paragraphRefs overlap with current focus paragraphs
   * 3. Finding overlap: events whose findingRefs overlap with current focus findings
   * 4. Significant: events with significance > 0.8 (regardless of recency)
   * Deduplicates and caps at 12 events (~600 tokens at ~50 tokens/event).
   */
  private retrieveRelevantEvents(
    events: SessionEvent[],
    focusParagraphs: number[],
    focusFindingIds: string[],
  ): SessionEvent[] {
    if (events.length <= 6) return events;

    const selected = new Map<number, SessionEvent>();

    // 1. Most recent 3
    for (const e of events.slice(-3)) selected.set(e.turn, e);

    // 2. Paragraph overlap
    if (focusParagraphs.length > 0) {
      for (const e of events) {
        if (e.paragraphRefs.some(p => focusParagraphs.includes(p))) {
          selected.set(e.turn, e);
        }
      }
    }

    // 3. Finding overlap
    if (focusFindingIds.length > 0) {
      for (const e of events) {
        if (e.findingRefs.some(f => focusFindingIds.includes(f))) {
          selected.set(e.turn, e);
        }
      }
    }

    // 4. High significance
    for (const e of events) {
      if (e.significance > 0.8) selected.set(e.turn, e);
    }

    return Array.from(selected.values())
      .sort((a, b) => a.turn - b.turn)
      .slice(-12);
  }

  private serializeEventsForPrompt(events: SessionEvent[]): string {
    if (events.length === 0) return 'No session history yet.';
    return events
      .map(e => `T${e.turn} [${e.kind}] ${e.summary}`)
      .join('\n');
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
  private updateConfusionTracking(stage1: Stage1Output, memory: CoachingSessionMemory): void {
    const { cognitiveState, dimensionFocus } = stage1;

    // Initialize session-scoped confusion trackers if needed
    if (!memory.confusionTrackers) memory.confusionTrackers = {};

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
        const existing = memory.confusionTrackers[topic];
        if (existing) {
          existing.instanceCount += 1;
          existing.escalationLevel = Math.min(3, existing.escalationLevel + 1) as 0 | 1 | 2 | 3;
          const approach = this.describeEscalationApproach(existing.escalationLevel);
          if (!existing.approachesTried.includes(approach)) {
            existing.approachesTried.push(approach);
          }
        } else {
          memory.confusionTrackers[topic] = {
            topic,
            instanceCount: 1,
            escalationLevel: 1 as 0 | 1 | 2 | 3,
            approachesTried: ['initial_explanation'],
          };
        }
        console.log(
          `[CoachingService] W6.2 confusion tracked — topic="${topic}", ` +
          `count=${memory.confusionTrackers[topic]!.instanceCount}, ` +
          `level=${memory.confusionTrackers[topic]!.escalationLevel}`,
        );
      } else if (showsUnderstanding) {
        if (memory.confusionTrackers[topic]) {
          console.log(
            `[CoachingService] W6.2 confusion reset — topic="${topic}" ` +
            `(student showed ${cognitiveState})`,
          );
          delete memory.confusionTrackers[topic];
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
   * Build the improvement queue section from the analysis system's ImprovementManifest.
   * The conversator's job is to workshop these improvements with the student.
   * Every observation maps to an action. Understanding is fuel, improvements are output.
   */
  private buildImprovementQueueSection(
    profile: EssayProfile,
    memory: CoachingSessionMemory,
  ): string {
    const manifest = profile.improvementManifest;
    if (!manifest || manifest.items.length === 0) return '';

    // Initialize progress tracking on first access
    if (!memory.improvementProgress) {
      memory.improvementProgress = {};
      for (const item of manifest.items) {
        memory.improvementProgress[item.id] = 'queued';
      }
    }

    const progress = memory.improvementProgress;
    const active = manifest.items.filter(item => {
      const status = progress[item.id] ?? 'queued';
      return status !== 'addressed';
    });

    if (active.length === 0) {
      return '\n\n=== IMPROVEMENT QUEUE (all addressed) ===\nAll improvements have been addressed. Focus on consolidation and revision plan.';
    }

    const addressedCount = manifest.items.length - active.length;

    // ── Phase 2: pedagogical-payload diversity ──
    // Replace the pre-Phase-2 "current = active[0]" with a planner-driven
    // selection that rotates across principle categories. The planner
    // falls back to first-unaddressed when the ledger is empty (turn 1) so
    // behavior is unchanged for fresh sessions. From turn 2 onward, it
    // avoids re-deploying a just-taught category, which is the regression
    // vector the blind-spot hunter flagged (5 turns of show-don't-tell
    // against a 0.0% wordform-overlap score). Side-effects deferred to
    // recordCoachingTurnDeployment() after the LLM response returns.
    const planSelection = coachingPlanner.selectNextDeployment(manifest, memory);
    const current = planSelection?.item ?? active[0];
    const taughtLedgerKeys = Object.keys(memory.taughtLedger ?? {});
    const alreadyTaughtBlock = taughtLedgerKeys.length > 0
      ? `\n\nALREADY TAUGHT THIS SESSION (do NOT re-teach):\n` +
        taughtLedgerKeys
          .map((id) => {
            const t = memory.taughtLedger![id];
            const paragraph = manifest.items.find((it) => it.id === id)?.paragraph ?? -1;
            const paraLabel = paragraph === -1 ? 'ESSAY' : `P${paragraph + 1}`;
            return `  - T${t.turn} ${paraLabel}: ${t.technique ?? 'guidance'} (${t.principleCategory})`;
          })
          .join('\n')
      : '';

    const enrichments = current.conversatorEnrichments.length > 0
      ? `\n  ENRICHED WITH: ${current.conversatorEnrichments.join('; ')}`
      : '';
    const demo = current.demonstration
      ? `\n  DEMONSTRATION: ${current.demonstration}`
      : '';
    const cut = current.wordEconomyCut
      ? `\n  WORD ECONOMY: ${current.wordEconomyCut}`
      : '';

    // Scope 3 Phase 7: research-backed principle + college-specific tailoring
    // note. Both fields are populated (when available) by
    // enrichWithResearchDatabase() at coaching session init. Each is absent
    // for items with no IssueType mapping or no collegeId — the empty string
    // contributes zero tokens in miss cases.
    const principleLine = current.researchBacking?.principle
      ? `\n  PRINCIPLE: ${current.researchBacking.principle}`
      : '';
    const collegeNoteLine = current.collegeNote
      ? `\n  COLLEGE NOTE: ${current.collegeNote}`
      : '';

    const nextItems = active.slice(1, 4).map((item, i) => {
      const techNote = item.technique ? ` (${item.technique})` : '';
      const enrichNote = item.conversatorEnrichments.length > 0
        ? ` [deepened: ${item.conversatorEnrichments[0].slice(0, 80)}]`
        : '';
      const paraLabel = item.paragraph === -1 ? 'ESSAY' : `P${item.paragraph + 1}`;
      return `  ${i + 2}. ${paraLabel}: ${item.action.slice(0, 120)}${techNote}${enrichNote}`;
    }).join('\n');

    const currentParaLabel = current.paragraph === -1 ? 'ESSAY-LEVEL' : `P${current.paragraph + 1}`;
    // Planner rationale is logged to console telemetry (see recordDeployment
    // log line) rather than injected into the prompt — the LLM doesn't need
    // to know WHY this priority was selected, just what to deploy. Keeps the
    // prompt leaner by ~20 tokens/turn.
    return `\n\n=== IMPROVEMENT QUEUE (${addressedCount}/${manifest.items.length} addressed) ===` +
      `\nWORD BUDGET: ${manifest.wordCount}/${manifest.wordLimit}` +
      alreadyTaughtBlock +
      `\n\nCURRENT PRIORITY [${current.impact.toUpperCase()}]:` +
      `\n  ${currentParaLabel}: ${current.observation}` +
      `\n  ACTION: ${current.action}` +
      (current.stakes ? `\n  STAKES: ${current.stakes}` : '') +
      (current.technique ? `\n  TECHNIQUE: ${current.technique}` : '') +
      enrichments + demo + cut + principleLine + collegeNoteLine +
      (nextItems ? `\n\nNEXT IN QUEUE:\n${nextItems}` : '') +
      `\n\nRULE: Help the student understand and execute the CURRENT PRIORITY.` +
      `\nIf they're stuck, DEMONSTRATE it using their details.` +
      `\nIf they share new context, enrich the improvement with their specifics.` +
      `\nWhen they've addressed it, advance to the next item.` +
      // Scope 3 Phase 7: force verbatim technique emission when present.
      // Without this, Sonnet paraphrases technique names ("try writing in
      // scene mode" instead of "SUMMARY-TO-SCENE") — the student loses the
      // transferable vocabulary handle. The mandate mirrors the ACTION-mode
      // rewriteExample requirement so the coaching layer preserves craft
      // vocabulary the same way it preserves concrete rewrites.
      (current.technique
        ? `\n\nVOCABULARY RULE: When offering a rewrite or teaching moment for this priority, ` +
          `name the technique in ALL-CAPS verbatim (e.g., "This is a ${current.technique} move"). ` +
          `Say it exactly once per response. This gives the student a transferable ` +
          `vocabulary handle they can carry to future essays.`
        : '');
  }

  /**
   * Produces content based on PERSISTENT tracker state (not current turn's cognitive state),
   * for any topic with escalation level >= 2.
   */
  private buildEscalationContext(memory: CoachingSessionMemory): string {
    const trackers = memory.confusionTrackers ?? {};
    const escalationInstructions: string[] = [];

    for (const [topic, tracker] of Object.entries(trackers)) {
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
   * Update resistance tracking based on the inferred cognitive state.
   * Parallel to updateConfusionTracking but with posture-based escalation.
   *
   * Triggered by sidecar cognitiveState starting with 'resistant_to'.
   * Decrements (not deletes) when the student engages positively on the same topic.
   */
  private updateResistanceTracking(
    stage1: Stage1Output,
    turnNumber: number,
    sessionJournalEntry: string | null,
    memory: CoachingSessionMemory,
  ): void {
    const { cognitiveState, dimensionFocus, focusProbabilities } = stage1;

    // Initialize session-scoped state if needed
    if (!memory.resistanceTrackers) memory.resistanceTrackers = {};
    if (memory.deflectionCounter === undefined) memory.deflectionCounter = 0;

    const isResistant =
      cognitiveState === 'resistant_to_specific' ||
      cognitiveState === 'resistant_to_general';

    const showsEngagement =
      cognitiveState === 'engaged' ||
      cognitiveState === 'curious_deeper';

    // Derive topic key: "${dimensionFocus}:P${focusParagraph}" or "${dimensionFocus}:essay"
    const dimKey = dimensionFocus.length > 0 ? dimensionFocus[0] : 'general';
    const focusParagraphs: number[] = [];
    for (const [label, prob] of Object.entries(focusProbabilities)) {
      if (prob > 0.3) {
        const match = label.match(/P(\d+)/);
        if (match) focusParagraphs.push(parseInt(match[1], 10));
      }
    }
    const paraKey = focusParagraphs.length > 0 ? `P${focusParagraphs[0]}` : 'essay';
    const topicKey = `${dimKey}:${paraKey}`;

    // Update deflection counter for Stream A→B integration
    if (isResistant) {
      memory.deflectionCounter++;
    } else if (showsEngagement) {
      memory.deflectionCounter = 0;
    }

    if (isResistant) {
      const existing = memory.resistanceTrackers[topicKey];
      if (existing) {
        existing.instanceCount += 1;
        existing.escalationLevel = Math.min(4, existing.escalationLevel + 1) as 0 | 1 | 2 | 3 | 4;
        existing.resistanceTurns.push(turnNumber);
        if (sessionJournalEntry) {
          existing.rejectedSuggestions.push(sessionJournalEntry);
        }
      } else {
        memory.resistanceTrackers[topicKey] = {
          topic: topicKey,
          rejectedSuggestions: sessionJournalEntry ? [sessionJournalEntry] : [],
          instanceCount: 1,
          escalationLevel: 1 as 0 | 1 | 2 | 3 | 4,
          resistanceTurns: [turnNumber],
        };
      }
      console.log(
        `[CoachingService] Resistance tracked — topic="${topicKey}", ` +
        `count=${memory.resistanceTrackers[topicKey]!.instanceCount}, ` +
        `level=${memory.resistanceTrackers[topicKey]!.escalationLevel}, ` +
        `deflectionCounter=${memory.deflectionCounter}`,
      );
    } else if (showsEngagement) {
      // Decrement (not delete) when student engages positively
      const existing = memory.resistanceTrackers[topicKey];
      if (existing && existing.escalationLevel > 0) {
        existing.escalationLevel = (existing.escalationLevel - 1) as 0 | 1 | 2 | 3 | 4;
        console.log(
          `[CoachingService] Resistance de-escalated — topic="${topicKey}", ` +
          `newLevel=${existing.escalationLevel} (student ${cognitiveState})`,
        );
      }
    }
  }

  /**
   * Build resistance escalation context for injection into Stage 3 user prompt.
   * Only produces content when resistance level >= 2.
   *
   * The escalation levels change BEHAVIORAL POSTURE:
   * Level 2 — Reframe: ask what they're protecting
   * Level 3 — Name the pattern: "I notice you're protective of..."
   * Level 4 — Honor and wait: stop suggesting changes to this area
   */
  private buildResistanceEscalationContext(memory: CoachingSessionMemory): string {
    // Build escalation context based on tracker STATE, not just the current turn's
    // cognitive state. Resistance persists — if the student asked about something else
    // this turn, the protected area is still protected.
    const trackers = memory.resistanceTrackers ?? {};
    const escalationInstructions: string[] = [];

    for (const [topic, tracker] of Object.entries(trackers)) {
      if (tracker.escalationLevel < 2) continue;

      switch (tracker.escalationLevel) {
        case 2:
          escalationInstructions.push(
            `RESISTANCE (${topic}): The student rejected a suggestion about this area. ` +
            `Before offering alternatives, ask what they're protecting. ` +
            `Their resistance may be protecting the best part of the essay.`
          );
          break;
        case 3:
          escalationInstructions.push(
            `RESISTANCE (${topic}): The student has resisted ${tracker.instanceCount} suggestions about this area. ` +
            `This is a pattern — name it gently: "I notice you're protective of [aspect]. ` +
            `That instinct might be exactly right." If they're right to protect it, help them ` +
            `strengthen it. If they're wrong, they need to discover that themselves. ` +
            `DEMONSTRATE: show what this area could look like using their declared details.`
          );
          break;
        case 4:
          escalationInstructions.push(
            `RESISTANCE (${topic}): The student has deep conviction about this area. ` +
            `STOP suggesting changes to this area. If they bring it up, listen and validate. ` +
            `Your job is NOT to overcome this resistance — it's to help them do what they're ` +
            `trying to do. Only revisit if they specifically ask.`
          );
          break;
      }
    }

    if (escalationInstructions.length === 0) return '';

    return `\n\n=== RESISTANCE ESCALATION (change your behavioral posture) ===\n` +
      escalationInstructions.join('\n\n');
  }

  /**
   * Detect convergence-prone language in the essay and return relevant
   * anti-convergence context for injection into the coaching prompt.
   * Only fires for the first 2 matched patterns (to avoid prompt bloat).
   */
  private buildAntiConvergenceContext(profile: EssayProfile): string {
    const essayText = profile.paragraphs.map(p => p.text).join(' ').toLowerCase();
    const matched: string[] = [];

    for (const pattern of ANTI_CONVERGENCE_PATTERNS) {
      if (matched.length >= 2) break;
      const signals = pattern.signal.split('|');
      if (signals.some(s => essayText.includes(s))) {
        matched.push(
          `[${pattern.pattern.toUpperCase()}]: ${pattern.example}`
        );
      }
    }

    if (matched.length === 0) return '';

    return `\n\n=== CONVERGENCE ALERT (this essay contains language that makes it sound like thousands of others) ===\n` +
      `When coaching on these areas, help the student replace convergence-prone language with authentic specifics:\n` +
      matched.join('\n') +
      `\nThe student's authentic voice — even with rough edges — is more valuable than polished generic prose.`;
  }

  // --------------------------------------------------------------------------
  // DEMONSTRATION TRIGGER + TECHNIQUE ROUTER (Writing Craft Engine)
  // --------------------------------------------------------------------------

  /**
   * Determine whether the coach should trigger a concrete demonstration this turn.
   * Returns the trigger reason (or null if no trigger).
   *
   * Trigger conditions (any one fires):
   * - Student has shared scene-worthy details AND same topic discussed 2+ turns
   * - Student has been resistant for 2+ consecutive turns
   * - Turn 5+ and no demonstration has been given yet (staleness guard)
   * - Student explicitly asked to "see" / "show me" / "what would it look like"
   */
  private shouldTriggerDemonstration(
    memory: CoachingSessionMemory,
    profile: EssayProfile,
    quickFocus: { focusParagraphs: number[]; dimensionFocus: string[] },
    studentMessage: string,
    conversationHistory: ConversationTurn[],
  ): { trigger: boolean; reason: string } | null {
    const turnCount = memory.turnCount + 1;
    const lower = studentMessage.toLowerCase();

    // Condition 1: Student explicitly asks to see an example
    if (/show me|what would it look like|can you (write|demonstrate|give me an example)|what could it sound like/.test(lower)) {
      return { trigger: true, reason: 'Student explicitly asked to see an example.' };
    }

    // Condition 2: Student has been resistant for 2+ consecutive turns
    const deflCount = memory.deflectionCounter ?? 0;
    if (deflCount >= 2) {
      const isDeepDeflection = deflCount >= 3;
      return {
        trigger: true,
        reason: isDeepDeflection
          ? `Student has deflected for ${deflCount} consecutive turns. STOP repeating demands. The student is stuck, not stubborn. DEMONSTRATE each architectural option — write 2-3 sentences for EACH using their declared details. Ask: "Which of these sounds more like the essay you want to write?"`
          : `Student has deflected for ${deflCount} consecutive turns. Stop asking — demonstrate the options.`,
      };
    }

    // Condition 3: Turn 3+ with student-declared context — the student has shared
    // SOMETHING and the coach should demonstrate with whatever is available.
    // The essay text itself is always available for demonstration.
    if (turnCount >= 3 && (profile.studentDeclaredContext || '').length > 30) {
      const coachTurns = conversationHistory.filter(t => t.role === 'coach');
      const hasDemonstrated = coachTurns.some(t => {
        return /[''""][^''""\n]{20,}[''""]/.test(t.content) ||
               /technique|summary.to.scene|cold open|sensory timestamp|somatic|bookend|ritual detail/i.test(t.content) ||
               /here'?s what|could (sound|look|feel) like|what it looks like|imagine this/i.test(t.content);
      });
      if (!hasDemonstrated) {
        return { trigger: true, reason: 'Turn 3+ with student material available. Show with what you have — one detail is enough for a 2-sentence demonstration.' };
      }
    }

    // Condition 4: Turn 5+ staleness guard — if still no demonstration by turn 5
    if (turnCount >= 5) {
      const coachTurns = conversationHistory.filter(t => t.role === 'coach');
      const hasDemonstrated = coachTurns.some(t => {
        // Heuristic: detect actual prose samples in coach responses.
        // Look for: curly quotes, straight quotes around 20+ chars, italic markers,
        // technique naming (case-insensitive), or "here's what" / "could sound like" patterns
        return /[''""][^''""\n]{20,}[''""]/.test(t.content) ||
               /technique|summary.to.scene|cold open|sensory timestamp|somatic|bookend|ritual detail/i.test(t.content) ||
               /here'?s what|could (sound|look|feel) like|what it looks like|imagine this/i.test(t.content);
      });
      if (!hasDemonstrated) {
        return { trigger: true, reason: 'Turn 5+ with no demonstration yet. The student needs to SEE what\'s possible.' };
      }
    }

    // Condition 4: Scene-worthy details exist AND same topic discussed 2+ turns
    const ctx = profile.studentDeclaredContext || '';
    if (ctx.length > 100) {
      // Check for proper nouns, temporal markers, or physical details (scene-worthy signals)
      const hasSceneWorthy = /[A-Z][a-z]{2,}/.test(ctx) || // Proper nouns
        /\d{1,2}(am|pm|:\d{2})/.test(ctx) || // Time markers
        /bench|room|kitchen|stage|desk|hands|floor|table|door/.test(ctx.toLowerCase()); // Physical details

      if (hasSceneWorthy) {
        // Check if same topic discussed 2+ turns
        const recentStudentMessages = conversationHistory
          .filter(t => t.role === 'student')
          .slice(-3)
          .map(t => t.content.toLowerCase());

        if (recentStudentMessages.length >= 2) {
          const currentTopics = lower.split(/\s+/).filter(w => w.length > 4);
          const topicOverlap = recentStudentMessages.filter(prev =>
            currentTopics.some(t => prev.includes(t))
          ).length;
          if (topicOverlap >= 2) {
            return {
              trigger: true,
              reason: 'Student has shared scene-worthy details and discussed the same topic for 2+ turns. Material is ready for demonstration.',
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Sync technique route matching — returns technique name + directive for a finding.
   * Used by the revision checklist builder (sync context) and as the base for
   * the enriched async version below.
   */
  private matchFindingToTechnique(finding: Finding): { technique: string; directive: string } | null {
    const claimLower = finding.claim.toLowerCase();
    for (const route of TECHNIQUE_ROUTES) {
      const keywordsMatch = route.claimKeywords.every(kw => claimLower.includes(kw));
      if (!keywordsMatch) continue;
      if (route.dimensions && route.dimensions.length > 0) {
        const dimMatch = route.dimensions.some(d => finding.dimensions.includes(d));
        if (!dimMatch) continue;
      }
      return { technique: route.technique, directive: route.directive };
    }
    return null;
  }

  /**
   * Route a finding to a matching craft technique with enriched pedagogical content.
   * Returns the technique directive + WHY it works + a matched before/after example.
   * Async because getTechniqueTeaching lazy-loads bundles (cached after first call).
   */
  private async routeFindingToEnrichedTechnique(finding: Finding): Promise<{
    technique: string;
    directive: string;
    enrichment: string | null;
  } | null> {
    const baseMatch = this.matchFindingToTechnique(finding);
    if (!baseMatch) return null;

    const { technique, directive } = baseMatch;

    // Build enrichment: WHY + HOW + EXAMPLES (full content — we paid for it, use it)
    let enrichment: string | null = null;

    // WHY from technique bundles (lazy-loaded, cached after first call)
    const categoryId = TECHNIQUE_TO_CATEGORY[technique];
    if (categoryId) {
      const { getTechniqueTeaching } = await import('./techniqueLibrary');
      const teaching = await getTechniqueTeaching(categoryId);
      if (teaching) {
        enrichment = `WHY: ${teaching.why}`;
        if (teaching.examples && teaching.examples !== 'No transformation examples available.') {
          // Include top 2 examples (untruncated — richer context for the coach)
          const examples = teaching.examples.split('\n\n').slice(0, 2);
          for (const ex of examples) {
            if (ex) enrichment += `\n  ${ex}`;
          }
        }
      }
    }

    // TRANSFORMATION EXAMPLES from research database (matching by craft move)
    // Include up to 2 full before→after pairs for richer coaching demonstrations
    const craftMove = TECHNIQUE_TO_CRAFT_MOVE[technique];
    if (craftMove) {
      try {
        const { getExamplesByCraftMove } = await import(
          '../../commonAppWorkshop/data/transformationExamples'
        );
        const examples = (getExamplesByCraftMove(craftMove) || []).slice(0, 2);
        for (const example of examples) {
          const transformBlock =
            `TRANSFORMATION: "${example.before.text}" → "${example.after.text}"` +
            `\n  PROBLEM: ${example.before.problem}` +
            `\n  STRENGTH: ${example.after.strength}`;
          enrichment = enrichment ? `${enrichment}\n  ${transformBlock}` : transformBlock;
        }
      } catch {
        // Non-fatal — transformation examples are optional enrichment
      }
    }

    return { technique, directive, enrichment };
  }

  /**
   * W6.3 / Wave 2B: Build scoped finding context for injection into Stage 3 prompt.
   *
   * Selects findings relevant to the student's current focus rather than dumping
   * the global top-N. Uses a 3-tier scoping strategy:
   *   Tier 1: Paragraph-scoped findings for focus paragraphs (from Stage 1 probabilities)
   *   Tier 2: Essay-level + cross-paragraph findings touching focus paragraphs
   *   Tier 3: Dimension-matched findings (from Stage 1 dimensionFocus)
   *
   * Falls back to global top 5 when no focus paragraphs are detected.
   * Supplements with structural roles, intent bridge divergences, and entanglements
   * for the focus paragraphs to give the coach architectural context.
   *
   * Returns empty string if no findings are available.
   */
  private async buildFindingCoachingContext(
    coordinator: EssayProfileCoordinator,
    stage1: Stage1Output,
    profile: EssayProfile,
    sessionMemory?: CoachingSessionMemory,
  ): Promise<string> {
    const findingStore = coordinator.getFindingStore();
    const active = findingStore.getActiveSortedByCoachingValue();
    if (active.length === 0) return '';

    // ── Finding lifecycle tracking ──
    // Build a set of finding IDs that have been discussed in prior turns
    // so we can split findings into FRESH vs PENDING vs ADDRESSED
    const discussedFindingIds = new Set<string>();
    const addressedFindingIds = new Set<string>();
    const findingDiscussedAtTurn = new Map<string, number>();

    if (sessionMemory?.events) {
      for (const event of sessionMemory.events) {
        if (event.findingRefs) {
          for (const fId of event.findingRefs) {
            discussedFindingIds.add(fId);
            findingDiscussedAtTurn.set(fId, event.turn);
          }
        }
      }
    }
    if (sessionMemory?.revisionChecklist) {
      for (const task of sessionMemory.revisionChecklist) {
        if (task.status === 'addressed' && task.findingRef) {
          addressedFindingIds.add(task.findingRef);
        }
      }
    }

    // Determine focus paragraph indices from Stage 1
    const focusParagraphs: number[] = [];
    for (const [label, prob] of Object.entries(stage1.focusProbabilities)) {
      if (prob > 0.3) {
        const match = label.match(/P(\d+)/);
        if (match) focusParagraphs.push(parseInt(match[1], 10) - 1);
      }
    }

    const hasFocusParagraphs = focusParagraphs.length > 0;

    let selectedFindings: Finding[];

    if (hasFocusParagraphs) {
      const scopedFindings = new Map<string, Finding>();

      // Tier 1: Paragraph-scoped findings for focus paragraphs
      for (const pIdx of focusParagraphs) {
        for (const f of findingStore.getByScope(pIdx)) {
          scopedFindings.set(f.id, f);
        }
      }

      // Tier 2: Essay-level and cross-paragraph findings touching focus
      for (const f of active) {
        if (f.scope.type === 'essay_level') {
          scopedFindings.set(f.id, f);
        } else if (
          f.scope.type === 'cross_paragraph' &&
          f.scope.paragraphs?.some(p => focusParagraphs.includes(p))
        ) {
          scopedFindings.set(f.id, f);
        }
      }

      // Tier 3: Dimension-matched findings
      if (stage1.dimensionFocus.length > 0) {
        for (const dim of stage1.dimensionFocus) {
          for (const f of findingStore.getByDimension(dim)) {
            if (scopedFindings.size < 8) {
              scopedFindings.set(f.id, f);
            }
          }
        }
      }

      selectedFindings = Array.from(scopedFindings.values());
    } else {
      // No focus paragraph — fall back to global top 5
      selectedFindings = active.slice(0, 5);
    }

    // Sort by coaching value and cap at 8
    selectedFindings.sort(
      (a, b) => COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
    );
    selectedFindings = selectedFindings.slice(0, 8);

    // Split findings by lifecycle status for differentiated injection
    const freshFindings = selectedFindings.filter(f => !discussedFindingIds.has(f.id) && !addressedFindingIds.has(f.id));
    const pendingFindings = selectedFindings.filter(f => discussedFindingIds.has(f.id) && !addressedFindingIds.has(f.id));
    // Addressed findings are dropped — don't re-inject solved problems

    // Serialize findings with enriched technique routing (WHY + examples)
    const findingLines = await Promise.all(selectedFindings.filter(f => !addressedFindingIds.has(f.id)).map(async f => {
      const scopeStr = f.scope.type === 'essay_level'
        ? 'essay-level'
        : f.scope.type === 'cross_paragraph'
        ? `P${(f.scope.paragraphs ?? []).map(p => p + 1).join('+P')}`
        : `P${(f.scope.paragraph ?? 0) + 1}`;
      const dims = f.dimensions.join(', ');
      const evidence = f.evidence.length > 0
        ? ` Evidence: "${f.evidence[0].text.slice(0, 100)}${f.evidence[0].text.length > 100 ? '...' : ''}"`
        : '';
      // Route finding to enriched technique with pedagogical content
      const techniqueMatch = await this.routeFindingToEnrichedTechnique(f);
      let techniqueDirective = '';
      if (techniqueMatch) {
        techniqueDirective = `\n  → TECHNIQUE: ${techniqueMatch.technique} — ${techniqueMatch.directive}`;
        if (techniqueMatch.enrichment) {
          techniqueDirective += `\n  → TEACHING: ${techniqueMatch.enrichment}`;
        }
      }
      // Lifecycle label: FRESH (new to this session) or PENDING (discussed but not addressed)
      const isPending = discussedFindingIds.has(f.id);
      const discussedTurn = findingDiscussedAtTurn.get(f.id);
      const lifecycleLabel = isPending
        ? ` [PENDING — discussed Turn ${discussedTurn}, student hasn't addressed it yet]`
        : ' [FRESH — not yet discussed]';
      return `[${f.id}] [${f.maturity}/${f.coachingValue}] ${scopeStr} [${dims}]${lifecycleLabel}\n  ${f.claim}${evidence}${techniqueDirective}`;
    }));

    // Lifecycle summary: give the coach a sense of progress
    const lifecycleSummary = addressedFindingIds.size > 0 || pendingFindings.length > 0
      ? `\nFINDING PROGRESS: ${addressedFindingIds.size} addressed (dropped from context), ` +
        `${pendingFindings.length} discussed but pending, ${freshFindings.length} fresh.` +
        (pendingFindings.length > 0 ? ` For PENDING findings, don't re-diagnose — reference your prior discussion and push for action.` : '') +
        (freshFindings.length > 0 ? ` For FRESH findings, give the full diagnosis treatment.` : '')
      : '';

    // Supplementary profile context for focus paragraphs
    const profileSnippets: string[] = [];

    if (hasFocusParagraphs) {
      // Structural roles (StructuralRole uses paragraphs: number[])
      const roles = profile.northStar.structuralRolesMap
        .filter(r => r.paragraphs.some(p => focusParagraphs.includes(p)))
        .map(r => `P${r.paragraphs.map(p => p + 1).join('+P')}: ${r.role} [${r.weight}]`);
      if (roles.length > 0) {
        profileSnippets.push(`Structural roles: ${roles.join('; ')}`);
      }

      // Intent bridge divergences
      if (profile.northStar.intentBridge?.studentIntent) {
        const bridge = profile.northStar.intentBridge;
        const divergent = bridge.alignments.filter(a => a.alignment === 'divergent');
        if (divergent.length > 0) {
          profileSnippets.push(
            `Intent divergence: student says "${bridge.studentIntent}" but essay shows ${divergent[0].detail}`
          );
        }
      }

      // Entanglements (CrossDimensionEntanglement uses location: ParagraphLocation)
      if (profile.entanglements.length > 0) {
        const relevant = profile.entanglements.filter(e =>
          focusParagraphs.includes(e.location.paragraph)
        );
        if (relevant.length > 0) {
          profileSnippets.push(
            `Cross-dimension entanglements: ${relevant.slice(0, 2).map(e =>
              `${e.dimensions.join('+')} at P${e.location.paragraph + 1}: ${e.description.slice(0, 100)}`
            ).join('; ')}`
          );
        }
      }
    }

    const profileSection = profileSnippets.length > 0
      ? `\nPROFILE CONTEXT FOR FOCUS:\n${profileSnippets.join('\n')}`
      : '';

    // Teaching content from workshop systems (PIQ examples + telling phrase detection)
    // Zero LLM cost — pure content routing from curated sources
    // SCOPED to focus paragraphs (±1 context) — don't detect patterns in paragraphs the student isn't working on
    const focusWithContext = new Set<number>();
    for (const pi of focusParagraphs) {
      focusWithContext.add(Math.max(0, pi - 1));
      focusWithContext.add(pi);
      focusWithContext.add(Math.min(profile.paragraphs.length - 1, pi + 1));
    }
    const scopedEssayText = hasFocusParagraphs
      ? [...focusWithContext].sort((a, b) => a - b)
          .map(i => profile.paragraphs[i]?.text ?? '')
          .join('\n')
      : profile.paragraphs.map(p => p.text).join('\n'); // essay overview → full text

    // Filter out findings that already have technique enrichment (prevent triple-stacking)
    const findingsNeedingTeaching = selectedFindings.filter(f => {
      const lineForFinding = findingLines.find(l => l.startsWith(`[${f.id}]`));
      return !lineForFinding?.includes('→ TECHNIQUE:');
    });

    const teachingMatches = await getTeachingContentForContext(
      findingsNeedingTeaching,
      scopedEssayText,
      800, // tighter budget — quality over quantity, 2-3 targeted examples max
    );
    const teachingSection = teachingMatches.length > 0
      ? `\n\n=== CURATED TEACHING CONTENT ===\n` +
        `Use at most ONE of these examples per response. Pick the one most relevant to\n` +
        `what the student is working on RIGHT NOW. Use it to DEMONSTRATE the craft move,\n` +
        `then immediately hand the pen back: "That's one way. Now write yours."\n` +
        `Do NOT use these when the student asks a direct question — answer the question first.\n\n` +
        teachingMatches.map(m => m.content).join('\n\n')
      : '';

    return `\n\n=== KEY FINDINGS (reference by [F] label when discussing relevant topics) ===\n` +
      `${hasFocusParagraphs ? `Focus: P${focusParagraphs.map(p => p + 1).join(', P')}` : 'Focus: essay overview'}\n` +
      lifecycleSummary +
      '\n' + findingLines.join('\n\n') +
      profileSection +
      teachingSection +
      `\nSYNTHESIS: Do NOT report findings back as a list. Synthesize the 2-3 most important into a SINGLE observation that names what the essay is doing, why it matters for the reader, and what craft move addresses it.`;
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

    // Detect repeated directives (writing tasks, action requests) across recent coach turns
    const recentCoachTurns = history
      .filter(t => t.role === 'coach')
      .slice(-3);
    const directivePatterns = /\b(write me|rewrite|your task|go\.|try it|paste|show me)\b/i;
    const repeatedDirectives: string[] = [];
    for (const turn of recentCoachTurns) {
      const lines = turn.content.split('\n');
      for (const line of lines) {
        if (directivePatterns.test(line) && line.length > 20 && line.length < 200) {
          repeatedDirectives.push(line.trim());
        }
      }
    }

    let directiveWarning = '';
    if (repeatedDirectives.length >= 2) {
      directiveWarning = `\n\nDIRECTIVE REPETITION WARNING: You have given similar action requests in your last ${recentCoachTurns.length} responses. DO NOT repeat the same writing task. The student heard you. Either respond to what they're actually saying, or offer a DIFFERENT entry point if the original task isn't working.`;
    }

    return `\n\n=== ANTI-REPETITION: YOU ALREADY SAID THIS ===\n` +
      `The student is returning to a topic you've discussed before. Here are the KEY POINTS you already made:\n` +
      priorCoachPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n') +
      `\n\nDO NOT rephrase these points. Either:\n` +
      `- Go DEEPER: cover specific sentences/dimensions you haven't touched yet\n` +
      `- Go WIDER: connect this topic to something discussed in later turns\n` +
      `- Redirect: if you've covered it thoroughly, say so and suggest implementation` +
      directiveWarning;
  }

  /**
   * Build a compact summary of revision priorities from the profile.
   * Used by buildStableProfileContext to inject what the student already saw.
   */
  private buildRevisionPrioritySummary(profile: EssayProfile): string | null {
    // Try coaching map priorities first
    const priorities = profile.scoreMatrix?.coachingMap?.priorities;
    if (priorities && priorities.length > 0) {
      const lines = priorities.slice(0, 5).map((p, i) => {
        const paras = p.paragraphs?.map((pi: number) => `P${pi + 1}`).join(', ') ?? '';
        return `  #${i + 1}: ${p.action ?? p.architecturalReason ?? 'Revision needed'} (${paras})`;
      });
      return `- Revision priorities:\n${lines.join('\n')}`;
    }

    // Fallback: build from active findings
    const activeFindings = profile.findings
      .filter(f => f.status === 'active' && (f.coachingValue === 'critical' || f.coachingValue === 'high'))
      .slice(0, 5);
    if (activeFindings.length > 0) {
      const lines = activeFindings.map((f, i) => {
        const scope = f.scope.type === 'paragraph' ? `P${(f.scope.paragraph ?? 0) + 1}` : 'essay-wide';
        return `  #${i + 1}: ${f.claim.slice(0, 80)} (${scope})`;
      });
      return `- Revision priorities (from findings):\n${lines.join('\n')}`;
    }

    return null;
  }

  /**
   * Parse raw context accumulation text into structured student context.
   * Uses pattern matching to extract names, places, moments, and details
   * from the Sonnet-curated contextAccumulation string.
   */
  private parseIntoStructuredContext(
    rawContext: string,
    turnNumber: number,
    profile: EssayProfile,
  ): void {
    if (!profile.structuredContext) {
      profile.structuredContext = { people: [], places: [], moments: [], concreteDetails: [] };
    }
    const ctx = profile.structuredContext;

    // Extract proper nouns as potential people (Title Case words not at sentence start)
    const namePattern = /(?:Mrs?\.|Ms\.|Dr\.|Professor|Coach|Teacher)\s+[A-Z][a-z]+|[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}/g;
    const names = rawContext.match(namePattern) || [];
    for (const name of names) {
      if (!ctx.people.some(p => p.name === name.trim())) {
        ctx.people.push({ name: name.trim(), relationship: '', firstMentionedTurn: turnNumber });
      }
    }

    // Extract places (common physical location words)
    const placePattern = /(?:practice room|classroom|lab|stage|kitchen|bedroom|garage|library|hackathon|studio|auditorium|gymnasium)/gi;
    const places = rawContext.match(placePattern) || [];
    for (const place of places) {
      if (!ctx.places.some(p => p.place.toLowerCase() === place.toLowerCase())) {
        ctx.places.push({ place: place.toLowerCase(), firstMentionedTurn: turnNumber });
      }
    }

    // Extract temporal/specific moments
    const momentPattern = /(?:when|the moment|the first time|the night|that day|hour \d+|at \d+(?:am|pm))[^.!?]{10,}[.!?]/gi;
    const moments = rawContext.match(momentPattern) || [];
    for (const moment of moments) {
      if (!ctx.moments.some(m => m.moment === moment.trim())) {
        ctx.moments.push({ moment: moment.trim(), firstMentionedTurn: turnNumber });
      }
    }

    // Extract concrete details (numbers, specific nouns, quoted phrases)
    const detailPattern = /(?:second place|first place|third|won|built|created|scored \d|valence|algorithm|Chopin|Nocturne|jazz|hackathon team)/gi;
    const details = rawContext.match(detailPattern) || [];
    for (const detail of details) {
      if (!ctx.concreteDetails.some(d => d.detail.toLowerCase() === detail.toLowerCase())) {
        ctx.concreteDetails.push({ detail: detail.toLowerCase(), firstMentionedTurn: turnNumber });
      }
    }
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
