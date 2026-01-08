/**
 * Context Gathering Types
 *
 * **Synergistic Relationship: Suggestion Engine ↔ Chat Interface**
 *
 * This module enables a two-way communication system where:
 * 1. The suggestion engine detects "context gaps" - places where it would need
 *    to INVENT details rather than work with real student experience
 * 2. The engine signals the chat interface with specific questions to ask
 * 3. The chat interface gathers real context from the student
 * 4. That context flows back to the suggestion engine for better suggestions
 *
 * **Why This Matters**:
 * Instead of generating performative phrases like "Not for a class—just because
 * her methodology blew my mind", we can ASK the student what actually happened
 * and use their real experience.
 *
 * **Design Principles**:
 * 1. Questions should be specific, not generic
 * 2. Each question should target a specific context gap
 * 3. Gathered context should be structured for easy integration
 * 4. The system should know when it has ENOUGH context to proceed
 */

// ============================================================================
// CONTEXT GAP TYPES
// ============================================================================

/**
 * Types of context gaps the suggestion engine can detect
 */
export type ContextGapType =
  // Experience gaps - we don't know what actually happened
  | 'missing_specific_moment'        // "What happened?" - need concrete scene
  | 'missing_sensory_detail'         // "What did you see/hear/feel?"
  | 'missing_emotional_reaction'     // "How did you feel in that moment?"
  | 'missing_thought_process'        // "What were you thinking?"
  | 'missing_dialogue'               // "What did they say? What did you say?"

  // Insight gaps - we don't know what they actually learned/realized
  | 'missing_specific_insight'       // "What did you actually learn?"
  | 'missing_limitation_discovered'  // "Where did your approach fall short?"
  | 'missing_contradiction_faced'    // "What surprised you or challenged your assumption?"
  | 'missing_synthesis'              // "How did two ideas connect for you?"

  // Connection gaps - we don't know why this matters to THEM
  | 'missing_personal_stake'         // "Why did YOU care about this?"
  | 'missing_consequence'            // "What happened as a result?"
  | 'missing_ongoing_relevance'      // "How does this still affect you?"

  // Research/specificity gaps - claims without evidence
  | 'missing_research_depth'         // "What specifically interested you about X?"
  | 'missing_unique_angle'           // "What do YOU see that others might miss?"
  | 'missing_failed_attempt'         // "What didn't work? What did you try first?"

  // Person/relationship gaps - generic references to people
  | 'missing_person_detail'          // "Who is this person? What makes them memorable?"
  | 'missing_relationship_dynamic';  // "How do you interact with them?"

/**
 * A detected context gap in the essay
 */
export interface ContextGap {
  gap_id: string;                    // Unique identifier
  gap_type: ContextGapType;

  // Where in the essay this gap exists
  location: {
    quote: string;                   // The text that triggered the gap detection
    paragraph: number;               // 1-indexed
    sentence_index?: number;         // Optional finer location
  };

  // Why this is a gap
  diagnosis: {
    what_is_missing: string;         // Clear description of the gap
    why_it_matters: string;          // Impact on essay quality
    what_would_fix_it: string;       // What kind of info would help
  };

  // Priority for gathering
  priority: 'critical' | 'high' | 'medium' | 'low';

  // How hard this will be to gather
  difficulty: 'easy' | 'moderate' | 'deep_reflection';
}

// ============================================================================
// CONTEXT GATHERING REQUEST TYPES
// ============================================================================

/**
 * A question to ask the student to fill a context gap
 */
export interface ContextQuestion {
  question_id: string;
  gap_id: string;                    // Links back to the gap this fills
  gap_type: ContextGapType;

  // The question to ask
  question: string;                  // The main question

  // Guidance for the chat interface
  follow_up_if_shallow: string;      // If they give a generic answer
  follow_up_if_abstract: string;     // If they stay at concept level
  signs_of_good_answer: string[];    // How to know we got what we needed

  // Examples to help the student
  example_weak_answer: string;       // What we don't want
  example_strong_answer: string;     // What we're looking for

  // Constraints
  ideal_length: 'sentence' | 'few_sentences' | 'paragraph';
  max_words?: number;
}

/**
 * A request from the suggestion engine to gather more context
 */
export interface ContextGatheringRequest {
  request_id: string;
  timestamp: string;

  // What triggered this request
  trigger: {
    issue_id: string;                // The issue that needs more context
    issue_quote: string;             // The problematic text
    diagnosis: string;               // Why we need more context
  };

  // The gaps we detected
  gaps: ContextGap[];

  // The questions we want asked (in priority order)
  questions: ContextQuestion[];

  // Metadata
  estimated_time_to_gather: 'quick' | 'moderate' | 'substantial';
  minimum_questions_needed: number;  // At least this many for useful context
  ideal_questions_answered: number;  // Best if student answers this many

  // Guidance for the chat interface
  conversation_guidance: {
    opening_frame: string;           // How to introduce this
    tone: 'curious' | 'encouraging' | 'direct';
    if_student_struggles: string;    // Fallback if they can't answer
    when_to_stop: string;            // How to know we have enough
  };
}

// ============================================================================
// GATHERED CONTEXT TYPES
// ============================================================================

/**
 * A single piece of gathered context from the student
 */
export interface GatheredContextItem {
  question_id: string;               // Which question this answers
  gap_id: string;                    // Which gap this fills
  gap_type: ContextGapType;

  // The student's response
  response: string;
  response_timestamp: string;

  // Quality assessment (done by chat interface)
  quality: {
    is_specific: boolean;            // Contains concrete details
    is_personal: boolean;            // Reflects their unique perspective
    is_usable: boolean;              // Can we actually use this?
    quality_score: 1 | 2 | 3 | 4 | 5;  // 1 = too generic, 5 = excellent
  };

  // Extracted elements (for easy integration)
  extracted: {
    concrete_details: string[];      // Specific facts, names, moments
    sensory_elements: string[];      // What they saw/heard/felt
    emotional_beats: string[];       // Feelings mentioned
    insights: string[];              // Realizations, learnings
    quotes_or_dialogue: string[];    // Things people said
  };
}

/**
 * Complete gathered context from a conversation
 */
export interface GatheredContext {
  request_id: string;                // Links back to the request
  session_id: string;
  gathered_at: string;

  // All gathered items
  items: GatheredContextItem[];

  // Summary of what we gathered
  summary: {
    gaps_filled: string[];           // gap_ids that were adequately filled
    gaps_partially_filled: string[]; // gap_ids with some info but not enough
    gaps_unfilled: string[];         // gap_ids we couldn't get info for

    total_quality_score: number;     // Average quality across items
    usable_for_suggestions: boolean; // Do we have enough to proceed?
  };

  // Ready-to-use context for the suggestion engine
  enriched_context: EnrichedStudentContext;
}

/**
 * Student context ready for the suggestion engine to use
 */
export interface EnrichedStudentContext {
  // Specific moments we can reference
  specific_moments: {
    description: string;
    sensory_details: string[];
    emotional_context: string;
    source_question_id: string;
  }[];

  // Insights in the student's own words
  authentic_insights: {
    insight: string;
    what_prompted_it: string;
    source_question_id: string;
  }[];

  // People and relationships
  key_people: {
    description: string;
    relationship_dynamic: string;
    memorable_details: string[];
    source_question_id: string;
  }[];

  // Failures and limitations (often the richest material)
  struggles_and_failures: {
    what_happened: string;
    what_they_learned: string;
    source_question_id: string;
  }[];

  // Unique angles the student has
  unique_perspectives: {
    angle: string;
    why_they_see_it_this_way: string;
    source_question_id: string;
  }[];

  // Direct quotes we can weave in
  quotable_phrases: {
    phrase: string;
    context: string;
    source_question_id: string;
  }[];
}

// ============================================================================
// SUGGESTION SERVICE INTEGRATION TYPES
// ============================================================================

/**
 * Extended issue context that can include gathered student context
 */
export interface ContextAwareIssueContext {
  // Original issue fields (from IssueContext)
  issue_id: string;
  quote: string;
  location: string;
  diagnosis: {
    problem: string;
    symptom_type: string;
    affected_dimensions: string[];
    score_impact: number;
  };
  surrounding_context: string;
  relevant_college_values: { value_name: string; what_demonstrates_it: string }[];
  relevant_quotes: { quote: string; source: string }[];

  // NEW: Gathered student context (if available)
  student_context?: {
    available: true;
    enriched: EnrichedStudentContext;

    // Specific context relevant to THIS issue
    relevant_moments: string[];
    relevant_insights: string[];
    relevant_quotes: string[];
  } | {
    available: false;
    gathering_request?: ContextGatheringRequest;
  };
}

/**
 * Result from the suggestion engine when it needs more context
 */
export interface SuggestionWithContextNeeds {
  // Can we generate suggestions with current context?
  can_proceed: boolean;

  // If we can proceed, here are the suggestions
  suggestions?: {
    polished_original: unknown;
    voice_amplifier: unknown;
  };

  // If we need more context, here's what to gather
  context_needs?: {
    severity: 'blocking' | 'would_improve' | 'optional';
    gathering_request: ContextGatheringRequest;
    message_to_user: string;
  };

  // If we proceeded with limited context, note what we had to invent
  invented_elements?: {
    element: string;
    why_invented: string;
    would_be_better_if: string;
  }[];
}

// ============================================================================
// CONTEXT GATHERING SESSION TYPES
// ============================================================================

/**
 * State of context gathering for a session
 */
export interface ContextGatheringState {
  session_id: string;
  essay_id: string;

  // All pending requests
  pending_requests: ContextGatheringRequest[];

  // All completed requests
  completed_requests: {
    request: ContextGatheringRequest;
    gathered: GatheredContext;
  }[];

  // Cumulative context (all gathered context merged)
  cumulative_context: EnrichedStudentContext;

  // Statistics
  stats: {
    total_questions_asked: number;
    total_questions_answered: number;
    average_response_quality: number;
    gaps_fully_resolved: number;
    gaps_partially_resolved: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a context gap with sensible defaults
 */
export function createContextGap(
  type: ContextGapType,
  quote: string,
  whatIsMissing: string,
  options: {
    paragraph?: number;
    priority?: ContextGap['priority'];
    difficulty?: ContextGap['difficulty'];
  } = {}
): ContextGap {
  return {
    gap_id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    gap_type: type,
    location: {
      quote,
      paragraph: options.paragraph || 1
    },
    diagnosis: {
      what_is_missing: whatIsMissing,
      why_it_matters: getWhyItMatters(type),
      what_would_fix_it: getWhatWouldFixIt(type)
    },
    priority: options.priority || getPriorityForType(type),
    difficulty: options.difficulty || getDifficultyForType(type)
  };
}

function getWhyItMatters(type: ContextGapType): string {
  const reasons: Record<ContextGapType, string> = {
    missing_specific_moment: 'Without a concrete moment, the essay feels abstract and forgettable',
    missing_sensory_detail: 'Sensory details make experiences real and memorable to readers',
    missing_emotional_reaction: 'Emotions connect readers to your experience authentically',
    missing_thought_process: 'Your thinking shows depth and makes insights feel earned',
    missing_dialogue: 'Dialogue brings scenes to life and shows relationships',
    missing_specific_insight: 'Generic insights feel performative rather than genuine',
    missing_limitation_discovered: 'Limitations show intellectual honesty and growth',
    missing_contradiction_faced: 'Contradictions reveal depth of engagement',
    missing_synthesis: 'Synthesis shows original thinking, not just consumption',
    missing_personal_stake: 'Without personal stake, motivation feels manufactured',
    missing_consequence: 'Consequences prove the experience mattered',
    missing_ongoing_relevance: 'Ongoing relevance shows lasting impact',
    missing_research_depth: 'Surface research is a red flag for admissions officers',
    missing_unique_angle: 'Unique angles differentiate you from thousands of similar essays',
    missing_failed_attempt: 'Failures humanize and show persistence',
    missing_person_detail: 'Generic people feel like props rather than real influences',
    missing_relationship_dynamic: 'Relationship dynamics reveal character'
  };
  return reasons[type];
}

function getWhatWouldFixIt(type: ContextGapType): string {
  const fixes: Record<ContextGapType, string> = {
    missing_specific_moment: 'A specific scene with who, what, when, where',
    missing_sensory_detail: 'What you saw, heard, smelled, felt physically',
    missing_emotional_reaction: 'The feeling in that moment, not a label but the sensation',
    missing_thought_process: 'The questions you asked yourself, the reasoning',
    missing_dialogue: 'Actual words spoken, even if paraphrased',
    missing_specific_insight: 'Something you now understand differently',
    missing_limitation_discovered: 'Where your approach hit a wall, what didn\'t work',
    missing_contradiction_faced: 'Something that didn\'t fit your expectations',
    missing_synthesis: 'How two seemingly unrelated things connected for you',
    missing_personal_stake: 'Why YOU specifically cared, not why anyone would care',
    missing_consequence: 'What changed after - action you took, perspective that shifted',
    missing_ongoing_relevance: 'How this still affects your thinking or actions today',
    missing_research_depth: 'Specific details that show you\'ve gone beyond surface level',
    missing_unique_angle: 'Something you notice that others in your position might miss',
    missing_failed_attempt: 'Specific things you tried that didn\'t work',
    missing_person_detail: 'Memorable traits, habits, or moments with this person',
    missing_relationship_dynamic: 'How you interact, what your conversations are like'
  };
  return fixes[type];
}

function getPriorityForType(type: ContextGapType): ContextGap['priority'] {
  const critical: ContextGapType[] = [
    'missing_specific_moment',
    'missing_specific_insight',
    'missing_personal_stake'
  ];
  const high: ContextGapType[] = [
    'missing_limitation_discovered',
    'missing_contradiction_faced',
    'missing_unique_angle',
    'missing_failed_attempt'
  ];
  const medium: ContextGapType[] = [
    'missing_sensory_detail',
    'missing_emotional_reaction',
    'missing_thought_process',
    'missing_consequence',
    'missing_research_depth'
  ];

  if (critical.includes(type)) return 'critical';
  if (high.includes(type)) return 'high';
  if (medium.includes(type)) return 'medium';
  return 'low';
}

function getDifficultyForType(type: ContextGapType): ContextGap['difficulty'] {
  const deep: ContextGapType[] = [
    'missing_limitation_discovered',
    'missing_contradiction_faced',
    'missing_synthesis',
    'missing_unique_angle'
  ];
  const moderate: ContextGapType[] = [
    'missing_specific_insight',
    'missing_personal_stake',
    'missing_thought_process',
    'missing_ongoing_relevance'
  ];

  if (deep.includes(type)) return 'deep_reflection';
  if (moderate.includes(type)) return 'moderate';
  return 'easy';
}

/**
 * Create a context question for a gap
 */
export function createContextQuestion(
  gap: ContextGap,
  question: string,
  options: {
    follow_up_if_shallow?: string;
    follow_up_if_abstract?: string;
    example_weak_answer?: string;
    example_strong_answer?: string;
  } = {}
): ContextQuestion {
  return {
    question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    gap_id: gap.gap_id,
    gap_type: gap.gap_type,
    question,
    follow_up_if_shallow: options.follow_up_if_shallow ||
      'Can you be more specific? What exactly happened?',
    follow_up_if_abstract: options.follow_up_if_abstract ||
      'Can you give me a concrete example or moment?',
    signs_of_good_answer: getSignsOfGoodAnswer(gap.gap_type),
    example_weak_answer: options.example_weak_answer ||
      'It was really meaningful to me',
    example_strong_answer: options.example_strong_answer ||
      'I remember sitting at my desk at 2am, staring at the error message...',
    ideal_length: gap.difficulty === 'deep_reflection' ? 'paragraph' : 'few_sentences'
  };
}

function getSignsOfGoodAnswer(type: ContextGapType): string[] {
  const common = ['Contains specific details', 'Uses concrete nouns not abstractions'];

  const specific: Record<ContextGapType, string[]> = {
    missing_specific_moment: ['Has who/what/when/where', 'Describes action not summary'],
    missing_sensory_detail: ['Mentions sights/sounds/textures', 'Shows not tells'],
    missing_emotional_reaction: ['Names the feeling in the body', 'Describes physical sensation'],
    missing_thought_process: ['Shows the reasoning', 'Includes questions asked'],
    missing_dialogue: ['Has actual words spoken', 'Captures how they talk'],
    missing_specific_insight: ['States the realization clearly', 'Differs from what they thought before'],
    missing_limitation_discovered: ['Names what didn\'t work', 'Shows awareness of why'],
    missing_contradiction_faced: ['Describes the surprise', 'Shows expectation vs reality'],
    missing_synthesis: ['Connects two ideas', 'Shows original combination'],
    missing_personal_stake: ['Explains their unique reason', 'Goes beyond general interest'],
    missing_consequence: ['Shows what changed', 'Describes concrete result'],
    missing_ongoing_relevance: ['Links to present', 'Shows continued influence'],
    missing_research_depth: ['Names specifics', 'Shows they\'ve read/explored'],
    missing_unique_angle: ['Offers unusual perspective', 'Shows personal lens'],
    missing_failed_attempt: ['Names what was tried', 'Shows learning from failure'],
    missing_person_detail: ['Has memorable trait', 'Shows specific moment with them'],
    missing_relationship_dynamic: ['Shows how they interact', 'Reveals nature of relationship']
  };

  return [...common, ...specific[type]];
}
