/**
 * Activity Profile Chat Types
 *
 * Types for the conversational system that extracts rich activity
 * information from students through natural dialogue.
 *
 * DESIGN PRINCIPLES:
 * - Adaptive: Questions adjust based on what we already know
 * - Natural: Feels like talking to a counselor, not filling a form
 * - Incremental: Builds profile over multiple sessions
 * - Extractive: Parses natural language into structured data
 */

import { ActivityProfile } from '../profile/types';

// ============================================================================
// CONVERSATION STATE
// ============================================================================

/**
 * Phases of the conversation
 * Each phase has different goals and question styles
 */
export type ConversationPhase =
  | 'opening'           // Build rapport, understand basics
  | 'fact_gathering'    // Extract objective data (numbers, timeline)
  | 'story_exploration' // Find narrative elements (moments, evolution)
  | 'meaning_reflection'// Understand personal significance
  | 'impact_assessment' // Measure external effects
  | 'connection_mapping'// Link to spike and other activities
  | 'synthesis'         // Confirm understanding, wrap up
  | 'complete';         // Profile sufficiently developed

/**
 * Current state of an active conversation
 */
export interface ConversationState {
  /** Unique conversation ID */
  conversationId: string;
  /** Activity being discussed */
  activityId: string;
  /** Activity title for reference */
  activityTitle: string;
  /** Current conversation phase */
  phase: ConversationPhase;
  /** Profile state before this conversation started */
  profileBeforeConversation: ActivityProfile;
  /** Current profile state (updated as we extract info) */
  currentProfile: ActivityProfile;
  /** All questions asked in this session */
  questionsAsked: AskedQuestion[];
  /** All responses received */
  responsesReceived: ConversationTurn[];
  /** Information extracted so far */
  extractedInfo: ExtractedInformation;
  /** Gaps that still need addressing */
  gapsRemaining: string[];
  /** Number of turns in the current phase */
  turnsInCurrentPhase: number;
  /** Maximum turns before moving to next phase */
  maxTurnsPerPhase: number;
  /** Total turns in this conversation */
  totalTurns: number;
  /** When conversation started */
  startedAt: string;
  /** Last activity timestamp */
  lastActivityAt: string;
  /** Why this conversation was initiated */
  triggerReason: ConversationTrigger;
  /** Student context for personalization */
  studentContext?: StudentContext;
  /** Token usage tracking */
  tokenUsage?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
  };
  /** Conversation dynamics for adaptive mode selection */
  dynamics?: ConversationDynamics;
}

/**
 * Conversation dynamics for adaptive questioning
 */
export interface ConversationDynamics {
  /** Count of consecutive sparse/empty extractions */
  sparseExtractionStreak: number;
  /** Count of consecutive rich extractions */
  richExtractionStreak: number;
  /** Quality of last extraction */
  lastExtractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';
  /** Last turn when a recap was given */
  lastRecapTurn: number | null;
  /** Data points extracted since last recap */
  dataPointsSinceRecap: number;
  /** Detected student communication pattern */
  detectedPattern: StudentPattern;
  /** Confidence in detected pattern (0-1) */
  patternConfidence: number;
  /** High-value fields still missing */
  priorityMissingFields: PriorityField[];
  /** Effectiveness tracking for each mode */
  modeEffectiveness: Map<ConversationMode, ModeEffectiveness>;
  /** Currently active conversation modes */
  activeModes: ConversationMode[];
}

/**
 * Student communication pattern detected from responses
 */
export type StudentPattern =
  | 'engaged'      // Provides rich, relevant details
  | 'terse'        // Short answers, needs prompting
  | 'tangential'   // Goes off-topic, needs redirecting
  | 'reluctant'    // Hesitant to share, needs encouragement
  | 'humble'       // Undersells achievements, needs reframing
  | 'unknown';     // Not enough data to determine

/**
 * Conversation mode for adaptive questioning
 */
export type ConversationMode =
  | 'standard'
  | 'rescue_storytelling'
  | 'targeted_completion'
  | 'recap_confirmation'
  | 'emotional_validation';

/**
 * High-value field that's still missing from profile
 */
export interface PriorityField {
  field: string;
  importance: 'critical' | 'high' | 'medium';
  reason: string;
  suggestedQuestion?: string;
}

/**
 * Mode effectiveness tracking
 */
export interface ModeEffectiveness {
  attempts: number;
  improvements: number;
}

/**
 * Question that was asked
 */
export interface AskedQuestion {
  /** Question text */
  question: string;
  /** Which profile field this targets */
  targetField: string;
  /** Question category */
  category: QuestionCategory;
  /** When asked */
  askedAt: string;
  /** Turn number when asked */
  turnNumber: number;
  /** Whether this was a follow-up to the previous response */
  isFollowUp?: boolean;
  /** The mode that generated this question */
  mode?: ConversationMode;
}

/**
 * A single turn in the conversation
 */
export interface ConversationTurn {
  /** Turn number */
  turnNumber: number;
  /** The question asked */
  question: string;
  /** The student's response */
  response: string;
  /** Information extracted from this turn */
  extraction: ExtractionResult;
  /** When this turn occurred */
  timestamp: string;
  /** Time spent on this response (if tracked) */
  responseTimeMs?: number;
}

/**
 * Why we initiated this conversation
 */
export type ConversationTrigger =
  | 'system_detected_gap'      // Analysis detected this needs more depth
  | 'high_potential_activity'  // This could be a highlight with more detail
  | 'time_investment_mismatch' // High hours but thin description
  | 'spike_candidate'          // Potential spike activity needs full profile
  | 'user_initiated'           // Student requested to discuss this
  | 'description_improvement'  // Student wants help with description
  | 'scoring_opportunity';     // Profile development could improve scores

/**
 * Student context for personalization
 */
export interface StudentContext {
  /** Intended major (affects what we emphasize) */
  intendedMajor?: string;
  /** Current grade level (affects timeline guidance) */
  currentGrade?: number;
  /** Target schools (affects framing) */
  targetSchools?: string[];
  /** Other activities (for connection mapping) */
  otherActivities?: { id: string; title: string }[];
  /** Detected spike (for connection mapping) */
  detectedSpike?: string;
}

// ============================================================================
// QUESTIONS
// ============================================================================

/**
 * Categories of questions we can ask
 */
export type QuestionCategory =
  | 'open_exploratory'    // "Tell me more about..."
  | 'specific_probe'      // "You mentioned X — can you give an example?"
  | 'numeric_ask'         // "How many people...?"
  | 'story_prompt'        // "Was there a moment when...?"
  | 'reflection_invite'   // "What was the hardest part...?"
  | 'connection_suggest'  // "How does this connect to...?"
  | 'clarification'       // "I want to make sure I understand..."
  | 'confirmation';       // "So it sounds like...?"

/**
 * A candidate question to potentially ask
 */
export interface QuestionCandidate {
  /** The question text */
  question: string;
  /** Which profile field this targets */
  targetField: string;
  /** Question category */
  category: QuestionCategory;
  /** Priority score (higher = ask sooner) */
  priority: number;
  /** Which phase this question belongs to */
  phase: ConversationPhase;
  /** Whether this builds on a previous response */
  isFollowUp: boolean;
  /** Previous response this follows up on (if applicable) */
  followsResponse?: string;
  /** Estimated impact on profile completeness */
  estimatedImpact: {
    descriptionScore: number;
    activityScore: number;
    narrativeValue: number;
  };
  /** When this question would be inappropriate */
  skipIf?: string[];
}

/**
 * Question generation input
 */
export interface QuestionGenerationInput {
  /** Current conversation state */
  state: ConversationState;
  /** Maximum questions to generate */
  maxQuestions?: number;
  /** Preferred categories to focus on */
  preferredCategories?: QuestionCategory[];
  /** Fields to prioritize */
  priorityFields?: string[];
}

/**
 * Question generation output
 */
export interface QuestionGenerationOutput {
  /** Recommended next question */
  nextQuestion: QuestionCandidate;
  /** Alternative questions if student doesn't engage */
  alternatives: QuestionCandidate[];
  /** Whether we should move to next phase */
  shouldTransitionPhase: boolean;
  /** Suggested next phase (if transitioning) */
  suggestedNextPhase?: ConversationPhase;
  /** Reason for recommendation */
  rationale: string;
}

// ============================================================================
// EXTRACTION
// ============================================================================

/**
 * Result of extracting information from a student response
 */
export interface ExtractionResult {
  /** Fields that were populated */
  extractedFields: ExtractedField[];
  /** Authentic quotes worth preserving */
  authenticQuotes: ExtractedQuote[];
  /** Things that need clarification */
  needsClarification: ClarificationNeeded[];
  /** Implicit information inferred */
  implicitFindings: ImplicitFinding[];
  /** Overall extraction quality */
  extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';
  /** Suggested follow-up questions */
  suggestedFollowUps: string[];
  /** Token usage for this extraction */
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * A field extracted from the response
 */
export interface ExtractedField {
  /** Path in the profile (e.g., "facts.scale.peopleDirectlyImpacted") */
  path: string;
  /** Extracted value */
  value: unknown;
  /** Confidence in this extraction */
  confidence: 'high' | 'medium' | 'low';
  /** The part of the response this came from */
  sourceQuote: string;
  /** Whether this updates or adds to existing data */
  updateType: 'new' | 'update' | 'append';
}

/**
 * An authentic quote extracted
 */
export interface ExtractedQuote {
  /** The exact quote */
  quote: string;
  /** Context of the quote */
  context: string;
  /** Where this could be used */
  potentialUse: 'description' | 'essay' | 'interview' | 'general';
  /** Why this quote is valuable */
  value: string;
}

/**
 * Something that needs clarification
 */
export interface ClarificationNeeded {
  /** Topic needing clarification */
  topic: string;
  /** Why clarification is needed */
  reason: string;
  /** Suggested follow-up question */
  suggestedFollowUp: string;
  /** Priority of getting this clarified */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Information inferred but not explicitly stated
 */
export interface ImplicitFinding {
  /** What was inferred */
  observation: string;
  /** How confident we are */
  confidence: 'high' | 'medium' | 'low';
  /** What led to this inference */
  basis: string;
  /** Which profile field this relates to */
  relatedField?: string;
}

/**
 * Cumulative extracted information
 */
export interface ExtractedInformation {
  /** All fields extracted across all turns */
  fields: ExtractedField[];
  /** All quotes extracted */
  quotes: ExtractedQuote[];
  /** All implicit findings */
  implicit: ImplicitFinding[];
  /** Fields updated in each turn */
  updateHistory: {
    turnNumber: number;
    fieldsUpdated: string[];
  }[];
}

// ============================================================================
// CHAT SERVICE INTERFACES
// ============================================================================

/**
 * Input to start a new conversation
 */
export interface StartConversationInput {
  /** Activity to discuss */
  activityId: string;
  /** Activity title */
  activityTitle: string;
  /** Existing profile (if any) */
  existingProfile?: ActivityProfile;
  /** Why we're starting this conversation */
  trigger: ConversationTrigger;
  /** Student context */
  studentContext?: StudentContext;
  /** Basic activity data to bootstrap with */
  basicData?: {
    description?: string;
    position?: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    yearsInvolved?: number;
    activityType?: string;
  };
}

/**
 * Output when starting a conversation
 */
export interface StartConversationOutput {
  /** Success flag */
  success: boolean;
  /** Conversation state */
  state?: ConversationState;
  /** Opening message to show student */
  openingMessage?: string;
  /** First question to ask */
  firstQuestion?: string;
  /** Error if failed */
  error?: string;
}

/**
 * Input for processing a student response
 */
export interface ProcessResponseInput {
  /** Current conversation state */
  state: ConversationState;
  /** Student's response text */
  response: string;
  /** Response metadata */
  metadata?: {
    responseTimeMs?: number;
    wordCount?: number;
  };
}

/**
 * Output after processing a response
 */
export interface ProcessResponseOutput {
  /** Success flag */
  success: boolean;
  /** Updated conversation state */
  state?: ConversationState;
  /** What was extracted from this response */
  extraction?: ExtractionResult;
  /** Next question to ask (if conversation continues) */
  nextQuestion?: string;
  /** Whether conversation should end */
  shouldEnd: boolean;
  /** Reason for ending (if applicable) */
  endReason?: 'complete' | 'low_engagement' | 'user_requested' | 'max_turns';
  /** Summary message (if ending) */
  closingMessage?: string;
  /** Error if failed */
  error?: string;
  /** Token usage for this turn */
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Input for getting a conversation summary
 */
export interface GetConversationSummaryInput {
  /** Conversation state */
  state: ConversationState;
}

/**
 * Conversation summary output
 */
export interface ConversationSummaryOutput {
  /** What we learned */
  whatWeLearned: string[];
  /** Profile completeness before */
  completenessBefore: number;
  /** Profile completeness after */
  completenessAfter: number;
  /** Key quotes captured */
  keyQuotes: string[];
  /** Fields still needing attention */
  remainingGaps: string[];
  /** Estimated score improvements */
  estimatedScoreImpact: {
    description: number;
    activity: number;
    portfolio: number;
  };
  /** Suggested next steps */
  suggestedNextSteps: string[];
}

// ============================================================================
// CONVERSATION TEMPLATES
// ============================================================================

/**
 * Templates for opening messages based on trigger
 */
export const OPENING_TEMPLATES: Record<ConversationTrigger, string> = {
  system_detected_gap: "I noticed your {activityTitle} could use some more detail to really showcase what you did. Let me ask you a few questions to help capture the full picture.",
  high_potential_activity: "Your {activityTitle} seems like it could be a real highlight of your application. I'd love to understand more about it so we can present it in the best way possible.",
  time_investment_mismatch: "You've invested a lot of time in {activityTitle} — {hours} hours over {years} years. There must be more to the story. Can you help me understand what made this meaningful?",
  spike_candidate: "{activityTitle} looks like it could be central to your application story. Let's make sure we capture all the important details.",
  user_initiated: "I'd be happy to help you develop your {activityTitle} description. Let's start by understanding what your involvement really looked like.",
  description_improvement: "Let's work on improving how you present {activityTitle}. First, I'd like to understand the full picture so we can craft the best possible description.",
  scoring_opportunity: "I think we can significantly strengthen how {activityTitle} comes across in your application. Let me ask you a few questions.",
};

/**
 * Templates for phase transition messages
 */
export const PHASE_TRANSITION_TEMPLATES: Record<ConversationPhase, string> = {
  opening: "Thanks for sharing. Now let me understand the specifics better.",
  fact_gathering: "Great, I have a good sense of the scope. Let's talk about some memorable moments.",
  story_exploration: "Those are great stories. Now I'm curious about what this meant to you personally.",
  meaning_reflection: "I can see this was meaningful. Let's talk about the impact you had.",
  impact_assessment: "Excellent. Let me see how this connects to your bigger picture.",
  connection_mapping: "Perfect. Let me summarize what I've learned.",
  synthesis: "I think I have a complete picture now.",
  complete: "Thanks for sharing all of this. Your profile for {activityTitle} is now much richer.",
};

/**
 * Templates for closing messages
 */
export const CLOSING_TEMPLATES = {
  complete: "Thanks for sharing all of this about {activityTitle}. I now have a much richer understanding that will help us create a better description and connect it to your overall story.",
  low_engagement: "I understand — not every activity needs a deep dive. We've captured some useful information about {activityTitle}. We can always come back to this later if you'd like.",
  user_requested: "No problem! We've made good progress on {activityTitle}. Feel free to come back anytime if you want to add more.",
  max_turns: "We've covered a lot of ground on {activityTitle}. I have a much better understanding now. If there's more you'd like to share later, just let me know.",
};
