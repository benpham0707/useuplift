// @ts-nocheck
/**
 * Conversational Context Gatherer
 *
 * A multi-turn conversational system that extracts high-quality context
 * from students through intelligent follow-up questions.
 *
 * KEY PRINCIPLES:
 * 1. Don't accept lazy/generic first responses
 * 2. Evaluate response quality and follow up when needed
 * 3. Coach students toward compelling, specific details
 * 4. Explain WHY we need more (not just "give me more")
 * 5. Know when we have enough to proceed
 *
 * FLOW:
 * 1. Ask initial question based on detected gap
 * 2. Evaluate student's response for quality
 * 3. If weak → follow up with coaching explanation
 * 4. If medium → dig deeper on promising threads
 * 5. If strong → capture and move to next gap or proceed
 *
 * QUALITY TIERS:
 * - WEAK: Generic, abstract, no sensory/emotional detail
 * - MEDIUM: Has a kernel of specificity but needs depth
 * - STRONG: Vivid, specific, emotionally grounded, memorable
 */

import Anthropic from '@anthropic-ai/sdk';
import { SupplementalType } from '../types';
import type { ContextGap as SonnetGap, ExistingStrength } from './sonnetContextLayer';
import type { EnrichedStudentContext } from '../types/contextGathering';
import {
  semanticClicheAnalyzer,
  type SemanticClicheAnalysis
} from './semanticClicheAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Quality assessment of a student's response
 */
export interface ResponseQualityAssessment {
  /** Overall quality tier */
  quality_tier: 'weak' | 'medium' | 'strong';

  /** Confidence in assessment (0-1) */
  confidence: number;

  /** What's working in this response */
  strengths: string[];

  /** What's still missing or weak */
  weaknesses: string[];

  /** Specific elements that could be extracted and used */
  usable_elements: UsableElement[];

  /** Whether we should follow up */
  needs_follow_up: boolean;

  /** If follow-up needed, what type */
  follow_up_type?: 'dig_deeper' | 'get_specific' | 'find_emotion' | 'clarify';

  /** The promising thread to follow (if medium quality) */
  promising_thread?: string;

  /**
   * AI-detected cliché warning (null if fresh/unique approach)
   * Contains: what makes this feel cliché + what unique angle to push for
   */
  cliche_warning?: string | null;
}

/**
 * A specific element from the response that can be used in suggestions
 */
export interface UsableElement {
  /** Type of element */
  element_type: 'sensory_detail' | 'emotional_moment' | 'specific_action' | 'dialogue' | 'insight' | 'person' | 'place' | 'time';

  /** The actual content */
  content: string;

  /** How compelling this is (1-10) */
  compelling_score: number;

  /** How this could be used in the essay */
  usage_hint: string;
}

/**
 * A follow-up question with coaching context
 */
export interface CoachingFollowUp {
  /** The follow-up question */
  question: string;

  /** Why we're asking this (transparent coaching) */
  why_this_helps: string;

  /** What a great answer looks like (without being prescriptive) */
  what_makes_it_great: string;

  /** Common pitfalls to avoid */
  avoid_this: string;

  /** Example of weak vs strong (for the specific context) */
  example_weak: string;
  example_strong: string;
}

/**
 * State of the conversation for a single gap
 */
export interface GapConversationState {
  /** The gap we're addressing */
  gap: SonnetGap;

  /** Conversation history for this gap */
  exchanges: ConversationExchange[];

  /** Current status */
  status: 'asking' | 'evaluating' | 'following_up' | 'captured' | 'gave_up';

  /** Accumulated usable elements */
  captured_elements: UsableElement[];

  /** Number of follow-up attempts */
  follow_up_count: number;

  /** Maximum follow-ups before moving on */
  max_follow_ups: number;
}

/**
 * A single exchange in the conversation
 */
export interface ConversationExchange {
  /** Our question/prompt */
  question: string;

  /** Student's response */
  response?: string;

  /** Quality assessment of response */
  assessment?: ResponseQualityAssessment;

  /** Timestamp */
  timestamp: number;
}

/**
 * Complete gathered context ready for suggestion generation
 */
export interface GatheredContext {
  /** All captured elements organized by type */
  elements_by_type: Record<string, UsableElement[]>;

  /** The most compelling elements (top 5) */
  top_elements: UsableElement[];

  /** Conversation summaries for each gap */
  gap_summaries: {
    gap_type: string;
    exchanges_count: number;
    quality_achieved: 'weak' | 'medium' | 'strong';
    key_captures: string[];
  }[];

  /** Overall quality score (0-100) */
  overall_quality: number;

  /** Ready to generate suggestions? */
  ready_for_suggestions: boolean;

  /** If not ready, what's still needed */
  still_needed?: string[];
}

// ============================================================================
// QUALITY PATTERNS
// ============================================================================

/**
 * Patterns that indicate WEAK responses (generic, abstract)
 */
const WEAK_RESPONSE_PATTERNS = [
  // Abstract claims without specifics
  /it was (?:really |very )?(?:hard|difficult|challenging|tough)/i,
  /I (?:learned|realized|discovered|understood) (?:a lot|so much|that)/i,
  /it (?:taught|showed|made) me/i,
  /I (?:felt|was) (?:sad|happy|scared|nervous|excited)/i,

  // Generic time references
  /(?:one day|at some point|eventually|over time|after a while)/i,

  // Vague people
  /(?:someone|a person|people|my friend|a teacher)/i,

  // Abstract growth claims
  /(?:grew as a person|became stronger|developed|improved)/i,
  /(?:changed my perspective|opened my eyes|transformed)/i,

  // Hedge words suggesting uncertainty
  /(?:I think|I guess|maybe|probably|kind of|sort of)/i,
];

/**
 * Patterns that indicate STRONG responses (specific, vivid)
 */
const STRONG_RESPONSE_PATTERNS = [
  // Specific times
  /\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)/,
  /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i,
  /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i,

  // Specific dialogue
  /"[^"]{10,}"/,
  /(?:said|asked|whispered|yelled|replied),?\s*["']/i,

  // Sensory details
  /(?:smelled like|tasted like|felt like|sounded like|looked like)/i,
  /(?:the smell of|the taste of|the sound of|the feeling of)/i,

  // Physical reactions
  /(?:hands? (?:shook|trembled|sweated)|heart (?:raced|pounded|sank))/i,
  /(?:tears|crying|laughing|shaking|frozen|paralyzed)/i,

  // Specific numbers with context
  /\d+\s+(?:hours|minutes|days|weeks|months|pages|times|people|dollars)/i,

  // Named people (not generic)
  /(?:my (?:mom|dad|mother|father|brother|sister|grandmother|grandfather))\s+[A-Z][a-z]+/i,
  /(?:Dr\.|Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+/i,

  // Specific places
  /(?:in the|at the|my)\s+(?:kitchen|bedroom|bathroom|car|office|lab|classroom|hospital|park)/i,
];

// ============================================================================
// CLICHÉ & OVERUSED TOPIC DETECTION
// ============================================================================

/**
 * Common essay topics that admissions officers have seen thousands of times.
 * Not automatically bad, but require a UNIQUE ANGLE to stand out.
 * If detected, we should push for what makes THIS version different.
 */
const CLICHE_TOPIC_PATTERNS = [
  // Immigration/cultural identity (very common)
  { pattern: /(?:mov(?:ed|ing) to|immigrated? to|came to)\s*(?:a new country|America|the (?:US|U\.S\.|United States))/i, topic: 'immigration_narrative' },
  { pattern: /adapt(?:ed|ing)? to\s*(?:a new|American|the new)\s*culture/i, topic: 'immigration_narrative' }, // "adapt to American culture"
  { pattern: /(?:between two|straddling|caught between)\s*(?:cultures|worlds|identities)/i, topic: 'bicultural_identity' },
  { pattern: /(?:didn't speak|couldn't speak|learning)\s*(?:English|the language)/i, topic: 'language_barrier' },
  { pattern: /(?:translator|translating)\s*(?:for|at)\s*(?:my|the)\s*(?:parents|family)/i, topic: 'family_translator' },
  { pattern: /(?:first.generation|1st.gen)/i, topic: 'first_gen' },

  // Sports injury/failure (extremely common)
  { pattern: /(?:tore my|injured my|broke my)\s*(?:ACL|MCL|knee|ankle|leg|arm)/i, topic: 'sports_injury' },
  { pattern: /(?:lost the|we lost the)\s*(?:game|match|championship|finals)/i, topic: 'sports_loss' },
  { pattern: /(?:bench|benched|cut from|didn't make)\s*(?:the team)?/i, topic: 'sports_setback' },

  // Mission/volunteer trips (overused)
  { pattern: /(?:mission trip|volunteer trip|service trip)\s*(?:to|in)/i, topic: 'service_trip' },
  { pattern: /(?:built|building)\s*houses\s*(?:in|for)/i, topic: 'service_trip_generic' }, // "Building houses in Guatemala"
  { pattern: /(?:taught children|helped orphans)\s*(?:in|for)/i, topic: 'service_trip_generic' },
  { pattern: /(?:I realized how|it showed me how|made me realize how)\s*(?:fortunate|privileged|lucky)/i, topic: 'privilege_realization' },

  // Death of grandparent (very common)
  { pattern: /(?:when my|after my)\s*(?:grandmother|grandfather|grandpa|grandma)\s*(?:died|passed|got sick)/i, topic: 'grandparent_death' },

  // Generic "passion" claims
  { pattern: /(?:my passion for|I'm passionate about|passionate about|I am passionate)/i, topic: 'passion_claim' },
  { pattern: /(?:ever since I was|for as long as I can remember|since I was a kid)/i, topic: 'lifelong_interest' },

  // Overcoming a test/grade
  { pattern: /(?:failed|bombed|struggled with)\s*(?:the|my|a)\s*(?:SAT|ACT|AP|test|exam)/i, topic: 'test_failure' },

  // "Finding my voice" / self-discovery clichés
  { pattern: /(?:found my voice|finding my voice|learned to speak up)/i, topic: 'finding_voice' },
  { pattern: /(?:finding myself|discovered who I|learned who I)/i, topic: 'self_discovery' },
];

/**
 * Details that are SPECIFIC but MEANINGLESS - they don't reveal anything
 * about the student's character, thoughts, or uniqueness.
 * These should be filtered out or scored lower.
 */
const MEANINGLESS_SPECIFICITY_PATTERNS = [
  // Random numbers that add no insight
  /Room \d+/i,                                    // Room 204 - who cares?
  /(?:building|hall|floor)\s*(?:number )?\d+/i,   // Building 7 - so what?
  /\d+ desks/i,                                   // 23 desks - why does this matter?
  /\d+ chairs/i,
  /\d+ steps/i,

  // Generic times that don't reveal anything
  /(?:at )?\d{1,2}:\d{2}\s*(?:AM|am|PM|pm)?(?!\s*(?:after|before|when|because|so|and))/i, // 7:15 AM by itself

  // Random physical descriptions without emotional resonance
  /\d+ (?:feet|meters|inches|miles) (?:away|long|tall)/i,

  // Names without purpose
  /(?:it was called|named)\s+[A-Z][a-z]+/i,
];

/**
 * Details that ARE meaningful - specific AND revealing
 */
const MEANINGFUL_DETAIL_INDICATORS = [
  // Time WITH purpose (showing something about the person)
  /(?:at |by )\d{1,2}(?::\d{2})?\s*(?:AM|am|PM|pm)[^.]*(?:still|already|finally|because|so that|before anyone|after everyone)/i,

  // Time showing duration/persistence (since X... until Y)
  /(?:since|from)\s*\d{1,2}(?::\d{2})?\s*(?:AM|am|PM|pm)[^.]*(?:midnight|until|and it was|before)/i,

  // Numbers that show commitment, scale, or transformation
  /(?:after |for )\d+\s*(?:hours|days|weeks|months|attempts|tries)/i,
  /\d+(?:x|X| times)\s*(?:faster|better|harder|longer|more)/i,
  /(?:went from|dropped from|improved|reduced)\s*\d+/i,

  // Physical details that reveal emotion or character
  /(?:hands|palms)\s*(?:were |was |)(?:sweating|shaking|trembling)/i,
  /(?:my )?hands?\s*(?:were |was )?sweat/i, // "My hands were sweating"
  /(?:heart|pulse)\s*(?:was |)(?:racing|pounding|stopped)/i,
  /couldn't (?:breathe|move|speak|look)/i,
  /stared at|frozen|paralyzed/i,

  // Sensory details that create immersion
  /(?:smelled|tasted|felt|sounded) like\s+(?!a |the |it )\S+/i,
  /smelled like \w+/i, // "smelled like kimchi"

  // Dialogue that reveals relationship or turning point
  /"[^"]{15,}"/,  // Substantive dialogue, not just "Hi" or "No"
];

// ============================================================================
// COACHING TEMPLATES
// ============================================================================

const COACHING_TEMPLATES = {
  dig_deeper: {
    opener: "That's a good start! I can see there's more to this story.",
    why: "The most compelling essays zoom in on a single moment rather than summarizing. Admissions officers read thousands of essays - they remember the ones with vivid, specific scenes.",
    prompt: "Can you take me to ONE specific moment within that experience? What do you see, hear, or feel in that exact moment?",
  },

  get_specific: {
    opener: "I appreciate you sharing that. Let's make it unforgettable.",
    why: "Right now, another student could write the same thing. What makes YOUR version unique are the tiny, specific details only you would know.",
    prompt: "What's one small detail from that moment that someone else wouldn't know? A sound, a smell, something someone said, the exact thought in your head?",
  },

  find_emotion: {
    opener: "You've described what happened, which is great. Now let's find the feeling.",
    why: "Essays that move readers don't just tell events - they let us feel what YOU felt. Not by saying 'I was sad' but by showing us a moment that makes US feel it.",
    prompt: "What was happening in your body in that moment? Where did you feel it - your chest, your stomach, your hands? What did you want to do but couldn't?",
  },

  clarify: {
    opener: "I want to make sure I understand this correctly.",
    why: "This detail could be really powerful, but I'm not quite seeing it clearly yet.",
    prompt: "Can you paint this picture more clearly for me? If I were watching a movie of this moment, what would I see?",
  },
};

// ============================================================================
// CLICHÉ AND DETAIL QUALITY HELPERS
// ============================================================================

/**
 * Detect if a response contains cliché/overused essay topics.
 * Returns detected clichés with their topics.
 */
function detectClicheTopics(text: string): { topic: string; match: string }[] {
  const detected: { topic: string; match: string }[] = [];

  for (const { pattern, topic } of CLICHE_TOPIC_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detected.push({ topic, match: match[0] });
    }
  }

  return detected;
}

/**
 * Check if a detail is specific-but-meaningless (empty calories)
 * vs. specific-and-meaningful (reveals something)
 */
function isDetailMeaningful(detail: string, fullContext: string): {
  meaningful: boolean;
  reason: string;
} {
  // Check for meaningless patterns
  const isMeaningless = MEANINGLESS_SPECIFICITY_PATTERNS.some(p => p.test(detail));
  if (isMeaningless) {
    return {
      meaningful: false,
      reason: 'Specific but reveals nothing about character, emotion, or uniqueness'
    };
  }

  // Check for meaningful patterns
  const hasMeaning = MEANINGFUL_DETAIL_INDICATORS.some(p => p.test(detail));
  if (hasMeaning) {
    return {
      meaningful: true,
      reason: 'Detail reveals something about the person or creates emotional resonance'
    };
  }

  // Check if the detail is connected to purpose/emotion in context
  // Look for patterns like "at 7:15 AM because..." or "Room 204 where..."
  const detailLower = detail.toLowerCase();
  const contextAround = fullContext.toLowerCase();
  const detailIndex = contextAround.indexOf(detailLower);

  if (detailIndex >= 0) {
    const afterDetail = contextAround.substring(detailIndex + detailLower.length, detailIndex + detailLower.length + 100);
    const hasConnector = /^[^.]*(?:because|so that|where|when|before|after|still|already)/.test(afterDetail);
    if (hasConnector) {
      return {
        meaningful: true,
        reason: 'Detail is connected to purpose or emotion in context'
      };
    }
  }

  // Default: treat as potentially meaningful but lower confidence
  return {
    meaningful: true,
    reason: 'Detail may add specificity but impact unclear'
  };
}

/**
 * Get coaching guidance for cliché topics
 * Pushes the student toward what makes THEIR version different
 */
function getClicheCoachingGuidance(topic: string): {
  warning: string;
  unique_angle_prompt: string;
} {
  const guidance: Record<string, { warning: string; unique_angle_prompt: string }> = {
    immigration_narrative: {
      warning: "Immigration essays are one of the most common topics. Admissions officers have read thousands of 'I moved to a new country and it was hard' essays.",
      unique_angle_prompt: "What's YOUR specific twist? Not 'it was hard to fit in' (everyone says that) but what unique lens do YOU bring? Maybe it's what you noticed that others wouldn't, or a counterintuitive feeling you had, or something you did differently."
    },
    bicultural_identity: {
      warning: "'Between two cultures' is an extremely common framing. It can feel abstract and universal rather than specific to you.",
      unique_angle_prompt: "Instead of describing the tension in general, what's ONE specific moment where these two worlds collided in an unexpected way? Something that surprised even you?"
    },
    language_barrier: {
      warning: "Language struggles are commonly mentioned in essays. What will make yours different isn't THAT you struggled, but HOW you navigated it in your unique way.",
      unique_angle_prompt: "What's a specific moment where language wasn't just a barrier but revealed something interesting? Maybe a funny mistranslation, or a moment where not having words actually helped you notice something?"
    },
    family_translator: {
      warning: "Being a translator for parents is mentioned in many immigrant family essays.",
      unique_angle_prompt: "What's ONE specific translation moment that wasn't just about words? Maybe a time you had to translate not just language but culture, or a moment where being the translator put you in an awkward/powerful/uncomfortable position?"
    },
    sports_injury: {
      warning: "Sports injury essays are extremely common and often follow a predictable arc (injury → recovery → learned perseverance).",
      unique_angle_prompt: "What did you notice during recovery that others wouldn't? Not just 'I learned to persevere' but what strange, specific thoughts went through your head? What did you observe about yourself or others that surprised you?"
    },
    sports_loss: {
      warning: "'We lost the big game and I learned from it' is one of the most common essay topics.",
      unique_angle_prompt: "What's the detail about that loss that only YOU would notice? Not the general lesson, but a specific moment, thought, or observation that reveals something unique about how you process failure?"
    },
    service_trip: {
      warning: "Service trip essays often sound similar: 'I went, I helped, I realized my privilege.' Admissions officers are wary of these.",
      unique_angle_prompt: "What's something uncomfortable or unexpected that happened? Not the heartwarming moment, but maybe a moment of doubt, a misunderstanding, or something that challenged your initial assumptions in a specific way?"
    },
    privilege_realization: {
      warning: "'I realized how privileged I am' is a common and often cringe-worthy essay moment for admissions officers.",
      unique_angle_prompt: "Instead of the realization itself, what's a SPECIFIC moment that complicated your understanding? Maybe a time when the 'helping' dynamic felt weird, or when someone surprised you by NOT wanting your help?"
    },
    grandparent_death: {
      warning: "Grandparent death essays are extremely common. The topic itself doesn't differentiate you.",
      unique_angle_prompt: "What's a tiny, specific detail about your grandmother/grandfather that only you would remember? Not the general loss, but something quirky, specific, or unexpected about them or your relationship?"
    },
    passion_claim: {
      warning: "Claiming to be 'passionate about X' is generic and doesn't show anything.",
      unique_angle_prompt: "Don't tell me you're passionate - SHOW me. What's the weird, specific thing you do because of this interest that others don't? How deep is the rabbit hole?"
    },
    finding_voice: {
      warning: "'Finding my voice' is a cliché that tells rather than shows.",
      unique_angle_prompt: "Instead of saying you found your voice, what's a specific moment where you said something and it felt different? What did you actually say, and what happened?"
    },
    self_discovery: {
      warning: "'Discovering who I am' is vague and cliché.",
      unique_angle_prompt: "What's ONE specific thing you learned about yourself that surprised you? Not a general quality, but something concrete that you didn't expect?"
    },
  };

  return guidance[topic] || {
    warning: "This is a commonly used topic/framing. You'll need a unique angle to stand out.",
    unique_angle_prompt: "What's YOUR specific twist that another student with the same experience couldn't write? What did you notice, feel, or do that was uniquely yours?"
  };
}

/**
 * Generate cliché-specific coaching based on semantic analysis
 *
 * This creates targeted coaching that pushes past detected clichés
 * toward fresh, specific, memorable content.
 */
function generateClicheCoaching(analysis: SemanticClicheAnalysis): {
  acknowledgment: string;
  reframe: string;
  coaching_question: string;
  subversion_prompts: string[];
  preserve_note: string | null;
} {
  const result = {
    acknowledgment: '',
    reframe: '',
    coaching_question: '',
    subversion_prompts: [] as string[],
    preserve_note: null as string | null,
  };

  // Acknowledge the topic if it's common but valid
  if (analysis.topic_assessment.topic) {
    const topicDisplayName = analysis.topic_assessment.topic.replace(/_/g, ' ');
    result.acknowledgment = `Essays about ${topicDisplayName} can be powerful - your experience is real and matters.`;
  } else {
    result.acknowledgment = "Let me help you make this more compelling.";
  }

  // Reframe the challenge based on what's detected
  if (analysis.topic_assessment.is_cliche_framing) {
    result.reframe = `But here's the challenge: admissions officers have read this exact framing hundreds of times. The "${analysis.narrative_arc.detected_arc}" arc is so common they can predict how it ends by the first paragraph.`;
  } else if (analysis.narrative_arc.predictability_score >= 7) {
    result.reframe = `The story structure you're using (${analysis.narrative_arc.detected_arc}) is predictable. Let's find something that surprises the reader.`;
  } else if (analysis.language_cliches.length >= 3) {
    result.reframe = `Some of the language here feels generic. Phrases like "${analysis.language_cliches[0]?.phrase}" make it harder to hear YOUR unique voice.`;
  } else if (analysis.telling_not_showing.length >= 2) {
    result.reframe = `Right now you're telling me what you learned instead of showing me. "${analysis.telling_not_showing[0]?.phrase}" tells me the conclusion - show me the moment that led to it.`;
  } else {
    result.reframe = "This has potential. Let's push for the details that only YOU would notice.";
  }

  // Generate targeted coaching question based on biggest issue
  if (analysis.topic_assessment.is_cliche_framing) {
    result.coaching_question = `What's something about your ${analysis.topic_assessment.topic?.replace(/_/g, ' ') || 'experience'} that goes AGAINST the expected story? A moment of doubt, an unexpected feeling, something you haven't told anyone?`;
  } else if (analysis.narrative_arc.predictability_score >= 7) {
    result.coaching_question = analysis.narrative_arc.suggested_subversion + ' What would that look like in your story?';
  } else if (analysis.telling_not_showing.length > 0) {
    const firstTelling = analysis.telling_not_showing[0];
    result.coaching_question = `You said "${firstTelling.phrase}" - take me to the actual moment when this happened. What did you see, hear, or feel? What were your hands doing?`;
  } else {
    result.coaching_question = analysis.coaching_priority.coaching_approach;
  }

  // Generate subversion prompts (ways to flip the expected narrative)
  result.subversion_prompts = [
    "What if you started at the END of this story, not the beginning?",
    "What's something you felt that you weren't 'supposed' to feel?",
    "What's the one detail you remember that seems random but sticks with you?",
    "What would surprise someone who thinks they know how this story goes?",
  ];

  // Note what to preserve
  if (analysis.strongest_unique_element) {
    result.preserve_note = `Keep building from: "${analysis.strongest_unique_element}" - this is working!`;
  }

  return result;
}

/**
 * Build a cliché-aware follow-up question
 */
function buildClicheAwareFollowUp(
  assessment: ResponseQualityAssessment,
  clicheAnalysis: SemanticClicheAnalysis,
  gapType: string
): CoachingFollowUp {
  const coaching = generateClicheCoaching(clicheAnalysis);

  // Build contextual example based on detected clichés
  let exampleWeak = "I learned the importance of perseverance through this experience.";
  let exampleStrong = "At 2 AM, still awake, I deleted everything and started over. Version 12.";

  // Customize examples based on detected topic
  if (clicheAnalysis.topic_assessment.topic === 'immigration_narrative') {
    exampleWeak = "Moving to America was hard but taught me to adapt.";
    exampleStrong = "The sound of American rain is wrong. Back home it pinged on tin roofs - here it thuds.";
  } else if (clicheAnalysis.topic_assessment.topic === 'sports_injury') {
    exampleWeak = "Tearing my ACL taught me perseverance.";
    exampleStrong = "Week 4 of PT: I watched my replacement score from the bench. I clapped. I meant it.";
  } else if (clicheAnalysis.topic_assessment.topic === 'grandparent_death') {
    exampleWeak = "When my grandmother passed, I learned to appreciate life.";
    exampleStrong = "Her medicine cabinet still smells like camphor. I can't throw anything away.";
  }

  return {
    question: coaching.coaching_question,
    why_this_helps: coaching.reframe,
    what_makes_it_great: "A specific moment, sensory detail, or unexpected feeling that only YOU would know. Something that makes the reader think 'I've never heard it described that way.'",
    avoid_this: "Avoid summarizing the lesson or stating what you learned. Show the moment, not the moral.",
    example_weak: exampleWeak,
    example_strong: exampleStrong,
  };
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class ConversationalContextGatherer {
  private anthropic: Anthropic;
  private conversationStates: Map<string, GapConversationState[]> = new Map();

  constructor() {
    this.anthropic = new Anthropic();
  }

  /**
   * Start gathering context for detected gaps
   *
   * Returns the first question to ask the student
   */
  startGathering(
    essayId: string,
    gaps: SonnetGap[],
    essayType: SupplementalType,
    existingStrengths?: ExistingStrength[]
  ): {
    question: string;
    context_for_student: string;
    gap_being_addressed: string;
  } {
    // Initialize conversation states for each gap (prioritized)
    const sortedGaps = [...gaps].sort((a, b) => b.priority - a.priority);
    const states: GapConversationState[] = sortedGaps.slice(0, 3).map(gap => ({
      gap,
      exchanges: [],
      status: 'asking' as const,
      captured_elements: [],
      follow_up_count: 0,
      max_follow_ups: 2, // Max 2 follow-ups per gap
    }));

    this.conversationStates.set(essayId, states);

    // Start with the highest priority gap
    const firstGap = states[0].gap;

    // Build context-aware first question
    const contextForStudent = this.buildOpeningContext(gaps.length, existingStrengths);

    return {
      question: firstGap.suggested_question,
      context_for_student: contextForStudent,
      gap_being_addressed: firstGap.gap_type,
    };
  }

  /**
   * Process student's response and determine next action
   *
   * This is the core conversational loop
   */
  async processResponse(
    essayId: string,
    response: string
  ): Promise<{
    action: 'follow_up' | 'next_gap' | 'complete';
    follow_up?: CoachingFollowUp;
    next_question?: string;
    gathered_context?: GatheredContext;
    progress: {
      gaps_addressed: number;
      total_gaps: number;
      quality_so_far: 'weak' | 'medium' | 'strong';
    };
  }> {
    const states = this.conversationStates.get(essayId);
    if (!states || states.length === 0) {
      throw new Error('No active conversation for this essay');
    }

    // Find current active gap
    const currentState = states.find(s => s.status === 'asking' || s.status === 'following_up');
    if (!currentState) {
      // All gaps addressed
      return {
        action: 'complete',
        gathered_context: this.compileGatheredContext(states),
        progress: this.calculateProgress(states),
      };
    }

    // Assess response quality
    const assessment = await this.assessResponseQuality(response, currentState.gap);

    // Record the exchange
    const lastExchange = currentState.exchanges[currentState.exchanges.length - 1];
    if (lastExchange && !lastExchange.response) {
      lastExchange.response = response;
      lastExchange.assessment = assessment;
    } else {
      currentState.exchanges.push({
        question: currentState.gap.suggested_question,
        response,
        assessment,
        timestamp: Date.now(),
      });
    }

    // Capture usable elements
    currentState.captured_elements.push(...assessment.usable_elements);

    // Decide next action based on quality
    if (assessment.quality_tier === 'strong' || !assessment.needs_follow_up) {
      // Great response! Move to next gap
      currentState.status = 'captured';
      return this.moveToNextGap(essayId, states);
    }

    if (assessment.quality_tier === 'medium' && currentState.follow_up_count < currentState.max_follow_ups) {
      // Promising but needs depth - follow up
      currentState.follow_up_count++;
      currentState.status = 'following_up';

      const followUp = this.generateCoachingFollowUp(
        assessment,
        currentState.gap,
        response
      );

      // Record the follow-up question
      currentState.exchanges.push({
        question: followUp.question,
        timestamp: Date.now(),
      });

      return {
        action: 'follow_up',
        follow_up: followUp,
        progress: this.calculateProgress(states),
      };
    }

    if (assessment.quality_tier === 'weak' && currentState.follow_up_count < currentState.max_follow_ups) {
      // Weak response - coach and try again
      currentState.follow_up_count++;
      currentState.status = 'following_up';

      const followUp = this.generateCoachingFollowUp(
        assessment,
        currentState.gap,
        response
      );

      currentState.exchanges.push({
        question: followUp.question,
        timestamp: Date.now(),
      });

      return {
        action: 'follow_up',
        follow_up: followUp,
        progress: this.calculateProgress(states),
      };
    }

    // Max follow-ups reached - move on with what we have
    currentState.status = 'gave_up';
    return this.moveToNextGap(essayId, states);
  }

  /**
   * Assess the quality of a student's response
   */
  private async assessResponseQuality(
    response: string,
    gap: SonnetGap
  ): Promise<ResponseQualityAssessment> {
    // First, do quick heuristic checks
    const heuristicAssessment = this.heuristicQualityCheck(response);

    // If clearly weak or clearly strong, skip AI call
    if (heuristicAssessment.confidence > 0.8) {
      return heuristicAssessment;
    }

    // Use AI for nuanced assessment
    try {
      const aiAssessment = await this.aiQualityAssessment(response, gap);
      return aiAssessment;
    } catch (error) {
      console.error('[ConversationalContextGatherer] AI assessment failed:', error);
      return heuristicAssessment;
    }
  }

  /**
   * Quick heuristic quality check (no AI call)
   *
   * PHILOSOPHY: Quality isn't about quantity or pattern counts.
   * It's about: Does this GRAB attention? Is it UNIQUE? Does it make you CARE?
   *
   * Heuristics can only identify:
   * 1. OBVIOUS WEAK: Generic, interchangeable, anyone-could-write-this
   * 2. OBVIOUS STRONG: Gripping, unique, makes-you-lean-in
   *
   * For everything in between, we defer to AI for nuanced judgment.
   */
  private heuristicQualityCheck(response: string): ResponseQualityAssessment {
    // Extract usable elements first
    const usableElements = this.extractUsableElements(response);
    const wordCount = response.split(/\s+/).length;

    // ═══════════════════════════════════════════════════════════════════════════
    // WEAK SIGNALS: Generic, interchangeable, "any student could write this"
    // ═══════════════════════════════════════════════════════════════════════════

    // These patterns indicate the response TELLS instead of SHOWS
    // They're red flags that the content won't grab an admissions officer
    const weakMatches = WEAK_RESPONSE_PATTERNS.filter(p => p.test(response)).length;

    // "Telling" emotions and generic claims - stating without showing
    // "I felt sad" is weak. "My throat tightened" shows sadness.
    // "I worked hard" is weak. "I stayed until 2 AM for 3 weeks" shows hard work.
    const tellingEmotions = [
      /I (?:felt|was|am) (?:really |very |so )?(?:sad|happy|scared|nervous|anxious|excited|worried|stressed|upset|angry|frustrated|confused|lonely|overwhelmed)/i,
      /it was (?:a )?(?:really |very )?(?:hard|difficult|challenging|tough|sad|scary)/i,
      /I learned (?:a lot|so much)/i,
      /this experience taught me/i,
      /things got better/i,
      /I grew as a person/i,
      /became (?:a )?stronger/i,
      /it was (?:a )?(?:good|great|amazing|life-changing) experience/i,
      // Generic effort claims without evidence
      /I (?:worked|tried) (?:really |very )?hard/i,
      /I (?:never|didn't) (?:give up|quit|stop)/i,
      /I (?:kept|continued) (?:going|trying|working)/i,
      /I put in (?:a lot of |so much )?(?:effort|work|time)/i,
      // Announcing character traits instead of showing them (sounds braggy)
      /I (?:decided|chose) to (?:start|create|build|do).*(?:on my own|by myself)/i,
      /no one (?:asked|told) me to/i,
      /I (?:just )?saw (?:a |the )?(?:need|gap|problem) and (?:filled|fixed|solved) it/i,
      /I(?:'m| am) (?:really |very )?passionate about/i,
      /I love (?:learning|diving deep|exploring)/i,
      /I(?:'m| am) (?:a |the type of )?(?:person|someone) who/i,
    ].filter(p => p.test(response)).length;

    // ═══════════════════════════════════════════════════════════════════════════
    // STRONG SIGNALS: Unique, gripping, "I want to know more"
    // ═══════════════════════════════════════════════════════════════════════════

    // CATEGORY A: NARRATIVE IMMERSION
    // These elements make the reader feel like they're THERE

    // Dialogue puts us in the moment - we hear the voice
    const hasDialogue = /"[^"]{5,}"/.test(response) ||
                        /(?:said|asked|whispered|yelled|told me),?\s*["']/i.test(response);

    // Sensory details we can FEEL - not just see, but experience
    const hasSensoryImmersion = /(?:smell(?:ed)? (?:like|of)|tast(?:ed|e) (?:like|of)|sound(?:ed)? (?:like|of))/i.test(response) ||
                                 /(?:the (?:smell|taste|sound) of)|smelled like/i.test(response);

    // Physical reactions that show emotion (not tell it)
    const hasShownEmotion = /(?:heart (?:raced|pounded|pounding|sank|stopped)|hands? (?:shook|trembled|sweated|shaking|sweating)|palm[s]? (?:were |was )?sweat|sweating palm|stomach (?:dropped|churned)|throat (?:tightened|closed)|tears|crying|frozen|paralyzed|couldn't (?:breathe|move|speak)|face (?:got |turned )?(?:hot|red|flushed)|mouth (?:open|dry))/i.test(response);

    // Unexpected/surprising details that feel REAL
    const hasUnexpectedDetail = /(?:for some reason|I don't know why|the weird thing was|I still remember|I couldn't read)/i.test(response);

    // Internal thoughts that reveal vulnerability
    const hasVulnerability = /(?:I (?:wanted to|wished I could|almost|nearly)|part of me (?:wanted|knew)|I pretended|even though I)/i.test(response);

    // Scene-setting immersion
    const hasSceneSetting = /(?:At \d{1,2}:\d{2}|Room \d+|\d+ desks|\d+ chairs|in my (?:sweating |shaking )?(?:palm|hand)|I (?:stood|sat|stared|walked) (?:outside|inside|in front of|behind))/i.test(response);

    // Specific visual details
    const hasVisualDetail = /(?:writing (?:something |in )?(?:in |characters|words)|couldn't read|perfect grid|arranged in|through the window|I could see)/i.test(response);

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY B: TECHNICAL DEPTH & INTELLECTUAL SUBSTANCE
    // These show mastery, curiosity, and genuine expertise
    // ═══════════════════════════════════════════════════════════════════════════

    // Technical terminology that shows real knowledge (not buzzwords)
    // "I optimized the O(n²) algorithm" vs "I worked on coding"
    const hasTechnicalDepth = /(?:algorithm|function|variable|database|API|server|client|debug|compile|runtime|syntax|recursion|iteration|data structure|binary|neural network|machine learning|regression|derivative|integral|theorem|hypothesis|methodology|experiment|control group|variable|correlation|causation|synthesis|catalyst|reaction|voltage|circuit|frequency|wavelength|genome|protein|enzyme|cell membrane|mitochondria|photosynthesis|spectrophotometer|diffraction|spectrometer|oscilloscope|arduino|raspberry pi|microcontroller|transistor|capacitor|resistor|chromatography|centrifuge|pipette|titration|electrolysis)/i.test(response);

    // Specific technical actions that show hands-on work
    const hasTechnicalAction = /(?:I (?:coded|programmed|debugged|refactored|optimized|implemented|deployed|tested|analyzed|calculated|derived|synthesized|measured|calibrated|designed|built|engineered|constructed|assembled|wired|soldered)|the (?:code|program|algorithm|model|experiment|circuit|reaction|device) (?:failed|worked|crashed|succeeded|showed)|when I (?:ran|executed|compiled|tested)|after \d+ (?:attempts|tries|iterations|hours|tests)|(?:build|built|make|made|create|created) (?:a |an |my own )?(?:device|circuit|robot|app|program|website|machine|tool|instrument))/i.test(response);

    // Quantified results that show real achievement
    // "reduced latency by 40%" vs "made it faster"
    const hasQuantifiedResult = /(?:\d+(?:\.\d+)?%|\d+(?:x|X) (?:faster|slower|better|more|less)|reduced (?:by|from) \d+|improved (?:by|to) \d+|\d+ (?:hours|days|weeks|months|attempts|iterations|users|downloads|points|places))/i.test(response);

    // Problem-solving narrative that shows intellectual process
    const hasProblemSolvingNarrative = /(?:I (?:realized|discovered|noticed|figured out) that|the (?:problem|issue|bug|error) was|what I (?:didn't|hadn't) (?:realize|understand|know)|at first I (?:thought|assumed|tried)|then I (?:tried|realized|discovered)|the breakthrough (?:came|happened) when|I had to (?:rethink|reconsider|start over))/i.test(response);

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY C: CHARACTER & MINDSET INDICATORS
    // Traits that signal college success - shown NATURALLY through actions
    //
    // KEY INSIGHT: These must be SHOWN through concrete details, not TOLD
    // BAD: "I decided to start on my own" (announcing the trait, sounds braggy)
    // GOOD: "I rebuilt the broken telescope so the kids could see Saturn" (shows it)
    // ═══════════════════════════════════════════════════════════════════════════

    // PERSEVERANCE / GRIT: Evidence of sustained effort through difficulty
    // Not "I never gave up" but SHOWING the struggle through concrete details
    const gritSignals = [
      // Time-based evidence of sustained effort
      /(?:at|until|by) \d{1,2}(?::\d{2})?\s*(?:AM|am|PM|pm)/i.test(response),
      /for \d+\s*(?:straight |consecutive )?(?:hours|days|weeks|months)/i.test(response),
      /\d+(?:th|rd|nd|st)?\s*(?:attempt|try|version|draft|iteration)/i.test(response),
      // Evidence of repeated failure and continuation
      /(?:failed|crashed|broke|didn't work)\s+(?:\d+\s+times|again|twice|three times)/i.test(response),
      /(?:started over|rewrote|rebuilt|redid)\s+(?:from scratch|completely|everything)/i.test(response),
      // Physical evidence of effort
      /(?:hands|fingers|eyes)\s+(?:were|felt|got)\s+(?:raw|sore|tired|bleeding|cramped)/i.test(response),
      /(?:couldn't|could barely)\s+(?:keep my eyes open|stay awake|feel my)/i.test(response),
    ].filter(Boolean).length;
    const hasGritEvidence = gritSignals >= 2;

    // INITIATIVE: Shown through WHAT they built/created and WHY, not by announcing it
    // Look for: concrete creations with purpose, unconventional solutions
    const initiativeSignals = [
      // Evidence of creating/transforming something concrete
      /(?:rebuilt|restored|converted|transformed|repurposed)\s+(?:the|a|an|my|our|it)/i.test(response),
      /(?:set up|rigged|wired|rewired|assembled|constructed)\s+(?:a|an|the|my|it)/i.test(response),
      // Purpose-driven creation (so that X could Y)
      /(?:so|so that)\s*(?:the |my |our )?(?:kids|students|children|others|people|they)\s+(?:could|can|would)/i.test(response),
      // Evidence of filling a gap that existed
      /(?:there )?(?:wasn't|weren't)\s+(?:any|a)\s+(?:way|place|program|option|resource)/i.test(response),
      /(?:had been broken|was broken|wasn't working)\s+(?:for|since)/i.test(response),
      // Specific concrete projects that show initiative
      /(?:aquarium|terrarium|greenhouse|observatory|telescope|planetarium|workshop|lab|studio|garden|library|shelter|clinic|globe)/i.test(response),
    ].filter(Boolean).length;
    const hasInitiativeEvidence = initiativeSignals >= 2;

    // INTELLECTUAL CURIOSITY: Shown through DEPTH of rabbit hole, not claiming interest
    // Look for: where exploration led, unexpected discoveries, accumulation of knowledge
    const curiositySignals = [
      // Evidence of rabbit hole behavior - one thing leading to another
      /(?:led (?:me )?to|which led to|that led to)/i.test(response),
      /(?:turns out|I discovered that|I found out that)/i.test(response),
      // Time spent exploring
      /(?:\d+\s+)?(?:hours|days|weeks)\s+(?:later|reading|researching|watching|learning|down the rabbit hole)/i.test(response),
      /(?:every|all the)\s+(?:book|article|video|paper|source)\s+(?:I could find|about|on)/i.test(response),
      // Evidence of unexpected connections
      /(?:which|that)\s+(?:somehow|unexpectedly|surprisingly)\s+(?:connected|related|led)/i.test(response),
      /(?:I never expected|I hadn't realized|I stumbled upon)/i.test(response),
      // Chain of discovery
      /(?:which|that|this)\s+(?:led|took|brought)\s+(?:me|us)\s+(?:to|down|into)/i.test(response),
    ].filter(Boolean).length;
    const hasCuriosityEvidence = curiositySignals >= 2;

    // GROWTH MINDSET: Shown through SPECIFIC before/after changes, not claiming growth
    // Look for: what was different, what changed in approach, concrete iteration
    const growthSignals = [
      // Specific before/after contrast
      /(?:before|at first|initially|originally),?\s+I\s+(?:thought|tried|assumed|did|was)/i.test(response),
      /(?:then|but then|after that|eventually),?\s+I\s+(?:realized|tried|started|switched)/i.test(response),
      // Specific methodology changes
      /(?:instead of|rather than)\s+\w+ing/i.test(response),
      /(?:switched|changed|moved)\s+(?:from|to)\s+/i.test(response),
      // Evidence of iteration with specific changes
      /(?:this time|the next time|second time|third time),?\s+I/i.test(response),
      /(?:added|removed|changed|adjusted|tweaked)\s+(?:the|my)/i.test(response),
    ].filter(Boolean).length;
    const hasGrowthEvidence = growthSignals >= 2;

    // LEADERSHIP/IMPACT: Shown through OBSERVABLE changes in others, not claiming influence
    // Look for: what others did differently as a result, ripple effects
    const leadershipSignals = [
      // Observable changes in others' behavior (not "I taught them")
      /(?:they|she|he|the team|the group|the kids|now they)\s+(?:started|began|were able to|could finally|can now)/i.test(response),
      /(?:now|after that|since then),?\s+(?:they|she|he|everyone|others)/i.test(response),
      // Specific ripple effects or organic spread
      /(?:spread|grew|expanded)\s+(?:to|from)\s+\d+/i.test(response),
      /(?:other|more)\s+(?:students|kids|people|teams|schools)\s+(?:started|began|wanted|asked)/i.test(response),
      // Evidence of others adopting or continuing independently
      /(?:still|continues to|kept|carries on)\s+(?:using|doing|running|meeting)/i.test(response),
      /(?:took over|continued|carried on|runs it now)\s+(?:after|when)/i.test(response),
    ].filter(Boolean).length;
    const hasLeadershipEvidence = leadershipSignals >= 2;

    // RESOURCEFULNESS: Shown through the CREATIVE SOLUTION details, not claiming cleverness
    // Look for: unexpected materials, unconventional methods, concrete improvisation
    const resourcefulnessSignals = [
      // Unexpected material sources
      /(?:from|using|with)\s+(?:an old|a broken|scrap|leftover|spare|discarded)/i.test(response),
      /(?:DVD|cardboard|tape|wire|bottle|can|box|pipe|tube|PVC|duct tape)/i.test(response),
      // DIY construction details
      /(?:cut|taped|glued|wired|soldered|attached|connected|rigged)\s+(?:it|them|the)/i.test(response),
      /(?:held together|rigged up|jury-rigged|MacGyvered|hacked together)/i.test(response),
      // Working around constraints
      /(?:couldn't afford|didn't have|no access to|without)\s+(?:a |the |proper |real )/i.test(response),
      /(?:so I|instead I|so we)\s+(?:used|made|built|found|repurposed)/i.test(response),
      // Repurposing everyday items
      /(?:smartphone|phone|camera|laptop)\s+(?:as|for|to serve as|became)\s+/i.test(response),
    ].filter(Boolean).length;
    const hasResourcefulnessEvidence = resourcefulnessSignals >= 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY D: UNIQUE INSIGHT OR PERSPECTIVE
    // Original thinking that shows intellectual depth
    // ═══════════════════════════════════════════════════════════════════════════

    // Counterintuitive or unexpected realizations
    const hasUniqueInsight = /(?:I (?:realized|discovered|understood) that (?:the|my|what)|what (?:surprised|struck) me was|(?:counterintuitively|surprisingly|unexpectedly)|the (?:real|actual|true) (?:problem|challenge|issue) (?:was|wasn't)|it (?:wasn't|isn't) (?:about|just)|I (?:used to|always) (?:think|believe|assume) (?:that|but)|most people (?:think|assume|don't realize))/i.test(response);

    // Connecting ideas across domains (interdisciplinary thinking)
    const hasInterdisciplinaryThinking = /(?:I (?:connected|applied|used) (?:what I|my) (?:learned|knew) (?:from|in|about)|(?:just like|similar to|reminded me of) (?:how|when|what)|the (?:same|similar) (?:principle|concept|idea) (?:applies|works)|I (?:saw|noticed) (?:a |the )?(?:pattern|connection|parallel))/i.test(response);

    // ═══════════════════════════════════════════════════════════════════════════
    // DECISION LOGIC: Based on what makes content COMPELLING
    // ═══════════════════════════════════════════════════════════════════════════

    // Narrative signals (original set)
    const narrativeSignals = [hasDialogue, hasSensoryImmersion, hasShownEmotion, hasUnexpectedDetail, hasVulnerability, hasSceneSetting, hasVisualDetail];
    const narrativeCount = narrativeSignals.filter(Boolean).length;

    // Technical/intellectual signals (new)
    const technicalSignals = [hasTechnicalDepth, hasTechnicalAction, hasQuantifiedResult, hasProblemSolvingNarrative];
    const technicalCount = technicalSignals.filter(Boolean).length;

    // Character/mindset signals (new)
    const characterSignals = [hasGritEvidence, hasInitiativeEvidence, hasCuriosityEvidence, hasGrowthEvidence, hasLeadershipEvidence, hasResourcefulnessEvidence];
    const characterCount = characterSignals.filter(Boolean).length;

    // Insight signals (new)
    const insightSignals = [hasUniqueInsight, hasInterdisciplinaryThinking];
    const insightCount = insightSignals.filter(Boolean).length;

    // Total strong signals across all categories
    const strongCount = narrativeCount + technicalCount + characterCount + insightCount;

    // Check for OVERWHELMING evidence in a single trait (3+ signals)
    // If someone has 3+ distinct indicators of curiosity, initiative, etc., that's clearly strong
    const hasOverwhelmingEvidence =
      gritSignals >= 3 ||
      initiativeSignals >= 3 ||
      curiositySignals >= 3 ||
      growthSignals >= 3 ||
      leadershipSignals >= 3 ||
      resourcefulnessSignals >= 3;

    // OBVIOUSLY WEAK: Tells emotions without showing, short and generic
    // "I felt really sad and scared. It was a difficult time." - classic weak
    if (tellingEmotions >= 1 && strongCount === 0 && wordCount < 30) {
      return {
        quality_tier: 'weak',
        confidence: 0.9,
        strengths: [],
        weaknesses: ['Response tells emotions instead of showing them - this won\'t grab an admissions officer'],
        usable_elements: usableElements,
        needs_follow_up: true,
        follow_up_type: 'get_specific',
      };
    }

    // OBVIOUSLY WEAK: Heavy on generic phrases, nothing gripping
    // These are responses where another student could copy-paste the same thing
    if (tellingEmotions >= 2 && strongCount === 0) {
      return {
        quality_tier: 'weak',
        confidence: 0.9,
        strengths: [],
        weaknesses: ['Response tells instead of shows - another student could write the same thing'],
        usable_elements: usableElements,
        needs_follow_up: true,
        follow_up_type: 'get_specific',
      };
    }

    // OBVIOUSLY STRONG: Has multiple elements OR overwhelming evidence in one trait
    // - Multiple signals across categories (2+)
    // - OR overwhelming depth in one trait (3+ signals showing initiative, curiosity, etc.)
    // These responses make you lean in and want to know more
    if (strongCount >= 2 || hasOverwhelmingEvidence) {
      return {
        quality_tier: 'strong',
        confidence: 0.85,
        strengths: ['Creates immersion - makes the reader feel present in the moment'],
        weaknesses: [],
        usable_elements: usableElements,
        needs_follow_up: false,
      };
    }

    // SINGLE STRONG ELEMENT: Promising but needs AI to judge depth
    if (strongCount === 1) {
      // Has one compelling element but need to verify it's not surface-level
      return {
        quality_tier: 'medium',
        confidence: 0.5, // Low confidence triggers AI check
        strengths: ['Has a potentially compelling element'],
        weaknesses: ['May need more depth to fully grab attention'],
        usable_elements: usableElements,
        needs_follow_up: true,
        follow_up_type: 'dig_deeper',
        promising_thread: usableElements.length > 0 ? usableElements[0].content : undefined,
      };
    }

    // GENERIC BUT NOT EMPTY: Has some content but nothing gripping
    // Needs AI to determine if there's hidden potential
    if (weakMatches >= 2) {
      return {
        quality_tier: 'weak',
        confidence: 0.7, // Moderate confidence - might have salvageable elements
        strengths: [],
        weaknesses: ['Response summarizes rather than immerses'],
        usable_elements: usableElements,
        needs_follow_up: true,
        follow_up_type: 'get_specific',
      };
    }

    // UNCERTAIN: Not obviously weak or strong - let AI judge
    // This includes responses that might have subtle uniqueness we can't detect
    return {
      quality_tier: 'medium',
      confidence: 0.4, // Low confidence forces AI evaluation
      strengths: ['Requires deeper analysis to assess compellingness'],
      weaknesses: [],
      usable_elements: usableElements,
      needs_follow_up: true,
      follow_up_type: 'dig_deeper',
    };
  }

  /**
   * AI-powered quality assessment for nuanced cases
   *
   * Uses Sonnet for high-quality, nuanced assessment. This is a critical decision
   * point that determines whether we capture good content or keep digging.
   *
   * Cost: ~$0.003-0.005 per call (worth it for accuracy)
   */
  private async aiQualityAssessment(
    response: string,
    gap: SonnetGap
  ): Promise<ResponseQualityAssessment> {
    const prompt = `You are an expert college admissions essay coach evaluating a student's response.

Your job is to determine: Does this response contain COMPELLING, USABLE content for their essay?

GAP BEING ADDRESSED: ${gap.gap_type}
QUESTION ASKED: ${gap.suggested_question}

STUDENT'S RESPONSE:
"${response}"

═══════════════════════════════════════════════════════════════════════════════
ASSESSMENT FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

The goal is to find content that would make an admissions officer LEAN IN.
Content that reveals THIS specific student - not generic experiences anyone could claim.

EVALUATE ON THESE DIMENSIONS:

1. AUTHENTICITY & SPECIFICITY
   - Are there concrete details only this student would know?
   - Do the details feel LIVED, not manufactured?
   - Would another student with a similar experience describe it the same way, or is this uniquely theirs?

2. EMOTIONAL TRUTH
   - Does it reveal genuine feeling through SHOWING (physical sensations, actions, specific thoughts)?
   - Or does it merely TELL emotions ("I felt sad", "I was nervous")?
   - Is there vulnerability - an unguarded moment that reveals character?

3. FRESH PERSPECTIVE
   - Does the approach feel fresh, or does it follow a predictable arc?
   - CLICHÉ approaches: struggle → growth → learned lesson, "I realized how privileged I am"
   - FRESH approaches: unexpected angle, counterintuitive insight, specific detail that reframes the experience

4. MEANINGFUL DETAILS
   - Do the specific details REVEAL something about character, values, or insight?
   - MEANINGFUL: "At 2 AM, I was still debugging" (reveals persistence without stating it)
   - EMPTY: "Room 204" or "7:15 AM" standing alone (specific but meaningless)
   - Only extract details that would make an admissions officer care.

═══════════════════════════════════════════════════════════════════════════════
RATING
═══════════════════════════════════════════════════════════════════════════════

WEAK: Generic content anyone could write. Stated emotions without showing.
      Clichéd arc without unique angle. Only empty specificity.
      → We need to dig deeper with coaching questions.

MEDIUM: Has a kernel of authentic specificity but not yet fully developed.
        Something interesting is here but needs to be drawn out more.
        → Identify the "promising thread" to follow up on.

STRONG: Vivid, authentic, emotionally grounded. Fresh angle or unexpected insight.
        Contains usable phrases/moments that could go directly into suggestions.
        → Capture the elements and move forward.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════════════════════

Return JSON:
{
  "quality_tier": "weak" | "medium" | "strong",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your assessment",
  "strengths": ["specific things working well"],
  "weaknesses": ["specific things missing or weak"],
  "cliche_warning": null OR "description of cliché pattern detected and what unique angle to push for",
  "usable_elements": [
    {
      "element_type": "sensory_detail" | "emotional_moment" | "specific_action" | "dialogue" | "insight" | "vulnerability",
      "content": "exact text from response (only MEANINGFUL details)",
      "compelling_score": 1-10,
      "usage_hint": "why this works and how to use it"
    }
  ],
  "needs_follow_up": true | false,
  "follow_up_type": "dig_deeper" | "get_specific" | "find_emotion" | "clarify" | null,
  "promising_thread": "the most specific/interesting thing to dig into" OR null
}`;

    const response_ai = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514', // Sonnet for nuanced quality assessment - this is critical
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response_ai.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      quality_tier: parsed.quality_tier || 'medium',
      confidence: parsed.confidence || 0.7,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      usable_elements: (parsed.usable_elements || []).map((e: any) => ({
        element_type: e.element_type || 'insight',
        content: e.content || '',
        compelling_score: e.compelling_score || 5,
        usage_hint: e.usage_hint || '',
      })),
      needs_follow_up: parsed.needs_follow_up !== false,
      follow_up_type: parsed.follow_up_type,
      promising_thread: parsed.promising_thread,
      // AI-detected cliché warning - null if the approach is fresh
      cliche_warning: parsed.cliche_warning || null,
    };
  }

  /**
   * Extract usable elements from response using patterns
   */
  private extractUsableElements(response: string): UsableElement[] {
    const elements: UsableElement[] = [];

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY A: NARRATIVE ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Extract dialogue
    const dialogueMatches = response.match(/"[^"]{5,}"/g) || [];
    dialogueMatches.forEach(d => {
      elements.push({
        element_type: 'dialogue',
        content: d,
        compelling_score: 7,
        usage_hint: 'Direct quote adds authenticity',
      });
    });

    // Extract time references - ONLY if they're MEANINGFUL (show something about the person)
    const timeMatches = response.match(/\d{1,2}:\d{2}\s*(?:am|pm)?/gi) || [];
    timeMatches.forEach(t => {
      const meaningfulness = isDetailMeaningful(t, response);
      // Only include time if it's meaningful (connected to purpose or shows commitment)
      if (meaningfulness.meaningful && meaningfulness.reason !== 'Detail may add specificity but impact unclear') {
        elements.push({
          element_type: 'time',
          content: t,
          compelling_score: 6,
          usage_hint: 'Specific time shows commitment/dedication',
        });
      }
      // Skip meaningless times like "7:15 AM" standing alone
    });

    // Extract sensory details
    const sensoryPatterns = [
      /(?:smelled|tasted|felt|sounded|looked) like [^.]+/gi,
      /the (?:smell|taste|sound|feeling) of [^.]+/gi,
    ];
    sensoryPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      matches.forEach(m => {
        elements.push({
          element_type: 'sensory_detail',
          content: m,
          compelling_score: 8,
          usage_hint: 'Sensory detail creates immersion',
        });
      });
    });

    // Extract physical reactions - shows emotion without telling
    const physicalPatterns = [
      /(?:hands? (?:shook|trembled|were shaking|were trembling|were sweating|sweating))/gi,
      /(?:my hands were sweating[^.]*)/gi,
      /(?:heart (?:raced|pounded|pounding|sank|stopped))/gi,
      /(?:tears|crying|frozen|paralyzed|couldn't move|couldn't breathe|couldn't speak)/gi,
      /(?:face (?:got|turned|was) (?:hot|red|flushed))/gi,
      /(?:stomach (?:dropped|churned|knotted))/gi,
    ];
    physicalPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      matches.forEach(p => {
        elements.push({
          element_type: 'emotional_moment',
          content: p,
          compelling_score: 8,
          usage_hint: 'Physical reaction shows emotion without telling',
        });
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY B: TECHNICAL / INTELLECTUAL ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Extract quantified achievements
    const quantifiedMatches = response.match(
      /(?:\d+(?:\.\d+)?%|(?:reduced|improved|increased) (?:by |from |to )?\d+|\d+x (?:faster|better|more)|after \d+ (?:attempts|tries|hours|iterations)|\d+ (?:users|downloads|members|students))/gi
    ) || [];
    quantifiedMatches.forEach(q => {
      elements.push({
        element_type: 'quantified_result',
        content: q,
        compelling_score: 9,
        usage_hint: 'Quantified result demonstrates concrete impact',
      });
    });

    // Extract technical problem-solving moments
    const problemSolvingMatches = response.match(
      /(?:I (?:realized|discovered|figured out) that [^.]+|the (?:problem|bug|error|issue) was [^.]+|the breakthrough (?:came|happened) when [^.]+)/gi
    ) || [];
    problemSolvingMatches.forEach(p => {
      elements.push({
        element_type: 'problem_solving',
        content: p,
        compelling_score: 8,
        usage_hint: 'Shows intellectual process and discovery moment',
      });
    });

    // Extract technical terms that show expertise
    const technicalMatches = response.match(
      /(?:algorithm|neural network|machine learning|API|database|regression|derivative|synthesis|hypothesis|methodology|genome|protein|circuit)/gi
    ) || [];
    if (technicalMatches.length > 0) {
      elements.push({
        element_type: 'technical_depth',
        content: technicalMatches.join(', '),
        compelling_score: 7,
        usage_hint: 'Technical vocabulary demonstrates genuine expertise',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY C: CHARACTER / MINDSET ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Extract grit/perseverance evidence
    const gritMatches = response.match(
      /(?:after (?:failing|trying) \d+ times[^.]*|for \d+ (?:straight |consecutive )?(?:hours|days|weeks)[^.]*|I (?:kept|continued|refused to (?:give up|quit))[^.]*|at \d+ (?:AM|am|PM|pm)[^.]*)/gi
    ) || [];
    gritMatches.forEach(g => {
      elements.push({
        element_type: 'perseverance',
        content: g,
        compelling_score: 9,
        usage_hint: 'Evidence of sustained effort and grit',
      });
    });

    // Extract initiative evidence
    const initiativeMatches = response.match(
      /(?:I (?:decided|chose) to (?:start|create|build)[^.]*|on my own[^.]*|without (?:being (?:asked|told))[^.]*|I (?:started|founded|launched)[^.]*)/gi
    ) || [];
    initiativeMatches.forEach(i => {
      elements.push({
        element_type: 'initiative',
        content: i,
        compelling_score: 8,
        usage_hint: 'Shows self-direction and proactive mindset',
      });
    });

    // Extract curiosity evidence
    const curiosityMatches = response.match(
      /(?:I (?:wanted|needed) to (?:understand|know|figure out)[^.]*|what (?:fascinated|intrigued) me[^.]*|I (?:dove|went) deep(?:er)? into[^.]*|I became (?:obsessed|fascinated)[^.]*)/gi
    ) || [];
    curiosityMatches.forEach(c => {
      elements.push({
        element_type: 'curiosity',
        content: c,
        compelling_score: 8,
        usage_hint: 'Demonstrates genuine intellectual curiosity',
      });
    });

    // Extract leadership/impact evidence
    const leadershipMatches = response.match(
      /(?:I (?:mentored|taught|helped|led|organized) [^.]+|(?:they|the team|others) (?:started|began) to[^.]*|I (?:convinced|inspired|motivated)[^.]*|(?:spread|grew) to \d+[^.]*)/gi
    ) || [];
    leadershipMatches.forEach(l => {
      elements.push({
        element_type: 'leadership',
        content: l,
        compelling_score: 8,
        usage_hint: 'Shows ability to influence and lead others',
      });
    });

    // Extract resourcefulness evidence
    const resourcefulnessMatches = response.match(
      /(?:I (?:found|figured out) a way to[^.]+|(?:with|using) (?:only|just)[^.]+|I (?:didn't have|lacked)[^.]+so I[^.]+)/gi
    ) || [];
    resourcefulnessMatches.forEach(r => {
      elements.push({
        element_type: 'resourcefulness',
        content: r,
        compelling_score: 8,
        usage_hint: 'Shows creative problem-solving with constraints',
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORY D: INSIGHT ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Extract unique insights
    const insightMatches = response.match(
      /(?:I (?:realized|discovered|understood) that[^.]+|what (?:surprised|struck) me was[^.]+|the (?:real|actual|true) (?:problem|challenge) (?:was|wasn't)[^.]+|it (?:wasn't|isn't) (?:about|just)[^.]+)/gi
    ) || [];
    insightMatches.forEach(i => {
      elements.push({
        element_type: 'insight',
        content: i,
        compelling_score: 9,
        usage_hint: 'Original insight shows depth of reflection',
      });
    });

    // Extract growth/learning moments (specific, not generic)
    const growthMatches = response.match(
      /(?:I (?:changed|adjusted|adapted) my (?:approach|strategy)[^.]+|the (?:mistake|failure) (?:taught|showed) me[^.]+|I (?:started|began) (?:doing|approaching) (?:it|things) differently[^.]+)/gi
    ) || [];
    growthMatches.forEach(g => {
      elements.push({
        element_type: 'growth_moment',
        content: g,
        compelling_score: 8,
        usage_hint: 'Shows concrete learning and adaptation',
      });
    });

    return elements;
  }

  /**
   * Generate a coaching follow-up question
   */
  private generateCoachingFollowUp(
    assessment: ResponseQualityAssessment,
    gap: SonnetGap,
    originalResponse: string
  ): CoachingFollowUp {
    const followUpType = assessment.follow_up_type || 'dig_deeper';
    const template = COACHING_TEMPLATES[followUpType];

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIORITY 1: AI-DETECTED CLICHÉ (most accurate, from aiQualityAssessment)
    // ═══════════════════════════════════════════════════════════════════════════
    if (assessment.cliche_warning) {
      return {
        question: `${template.opener} ${assessment.cliche_warning.includes('angle') ?
          assessment.cliche_warning.split('angle')[1]?.trim() || "What's YOUR specific twist that another student with the same experience couldn't write?" :
          "What's YOUR specific twist that another student with the same experience couldn't write?"}`,
        why_this_helps: assessment.cliche_warning + " " + template.why,
        what_makes_it_great: "A great answer shows what makes YOUR version of this experience different from similar essays. Not the general lesson, but YOUR specific twist.",
        avoid_this: "Avoid the expected narrative arc. Don't just tell me what you 'learned' or how you 'grew' - those are generic conclusions anyone could make.",
        example_weak: `"I learned to appreciate what I had" or "It taught me perseverance"`,
        example_strong: `"The weird thing was, I actually missed being confused. Speaking English perfectly meant people stopped looking at me, and I realized I'd been using that attention."`,
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIORITY 2: PATTERN-BASED CLICHÉ (fallback when AI not used)
    // ═══════════════════════════════════════════════════════════════════════════
    const detectedCliches = detectClicheTopics(originalResponse);
    if (detectedCliches.length > 0) {
      const mainCliche = detectedCliches[0];
      const guidance = getClicheCoachingGuidance(mainCliche.topic);

      return {
        question: `${template.opener} ${guidance.unique_angle_prompt}`,
        why_this_helps: guidance.warning + " " + template.why,
        what_makes_it_great: "A great answer shows what makes YOUR version of this experience different from the thousands of similar essays. Not the general lesson, but YOUR specific twist.",
        avoid_this: "Avoid the expected narrative arc. Don't just tell me what you 'learned' or how you 'grew' - those are generic conclusions anyone could make.",
        example_weak: `"I learned to appreciate what I had" or "It taught me perseverance"`,
        example_strong: `"The weird thing was, I actually missed being confused. Speaking English perfectly meant people stopped looking at me, and I realized I'd been using that attention."`,
      };
    }

    // If we have a promising thread, customize the question
    if (assessment.promising_thread && assessment.quality_tier === 'medium') {
      return {
        question: `You mentioned "${assessment.promising_thread}" - that's interesting! Can you take me deeper into that specific moment? What exactly happened, and what were you thinking or feeling right then?`,
        why_this_helps: "This detail has potential to be really memorable. The more specific you can make it, the more it will stand out to admissions officers.",
        what_makes_it_great: "A great answer would let me SEE and FEEL this moment as if I were there. Specific sights, sounds, thoughts, physical sensations.",
        avoid_this: "Try not to summarize or explain - just describe the moment itself.",
        example_weak: `"It was a really meaningful moment that taught me a lot."`,
        example_strong: `"I remember staring at the screen, my cursor blinking. Three hours had passed and I hadn't written a single line that worked."`,
      };
    }

    // Use template for the follow-up type
    let customQuestion = template.prompt;

    // Customize based on gap type
    if (gap.gap_type === 'missing_emotional_depth') {
      customQuestion = `${template.opener} ${template.prompt} What was your body doing - were your hands steady, was your heart racing, did you feel it in your stomach?`;
    } else if (gap.gap_type === 'missing_concrete_detail') {
      customQuestion = `${template.opener} ${template.prompt} What's one tiny, specific detail from that moment that you can still picture clearly?`;
    } else if (gap.gap_type === 'missing_specific_example') {
      customQuestion = `${template.opener} Instead of describing the pattern, can you pick ONE specific time this happened and walk me through exactly what occurred?`;
    }

    // Build weak/strong examples based on context
    const weakExample = this.generateWeakExample(gap.gap_type);
    const strongExample = this.generateStrongExample(gap.gap_type);

    return {
      question: customQuestion,
      why_this_helps: template.why,
      what_makes_it_great: "A great answer is one where I can picture the exact moment in my mind - specific enough that another student couldn't have written it.",
      avoid_this: "Avoid summarizing, explaining what you learned, or using words like 'meaningful' or 'impactful' - just show me the moment.",
      example_weak: weakExample,
      example_strong: strongExample,
    };
  }

  /**
   * Generate example of weak response for context
   */
  private generateWeakExample(gapType: string): string {
    const examples: Record<string, string> = {
      'missing_concrete_detail': '"It was really hard and I learned a lot from the experience."',
      'missing_emotional_depth': '"I felt really sad and it was a difficult time for me."',
      'missing_specific_example': '"I did this many times and it always went well."',
      'missing_research': '"I\'m really interested in their program and facilities."',
      'missing_reflection': '"This experience taught me the importance of perseverance."',
      'missing_stakes': '"It was important to me and I really wanted it to work out."',
      'missing_resolution': '"Eventually things got better and I grew as a person."',
    };
    return examples[gapType] || '"It was meaningful and I learned a lot."';
  }

  /**
   * Generate example of strong response for context
   */
  private generateStrongExample(gapType: string): string {
    const examples: Record<string, string> = {
      'missing_concrete_detail': '"At 2 AM, I sat on the kitchen floor with my laptop, the blue light reflecting off the tile. My third attempt at the algorithm had just crashed."',
      'missing_emotional_depth': '"My hands were shaking so much I had to put down my coffee cup. I read the email three times, each time hoping the words would change."',
      'missing_specific_example': '"The Tuesday after Thanksgiving, Mrs. Rodriguez pulled me aside. \'Your accent,\' she said, \'reminds me of my grandmother.\' I didn\'t know what to say."',
      'missing_research': '"Dr. Chen\'s paper on ImageNet bias had a footnote about multilingual speakers - that\'s when I realized this wasn\'t just my grandmother\'s problem."',
      'missing_reflection': '"I\'d spent six months building the wrong thing. Not because I was bad at coding, but because I\'d never actually watched my grandmother try to use a phone."',
      'missing_stakes': '"If I couldn\'t fix the voice recognition, my grandmother would go back to being isolated. No video calls, no texts from cousins. Just silence."',
      'missing_resolution': '"The model still isn\'t perfect. But yesterday, my grandmother left her first voice message in English. Seven words, but she didn\'t have to repeat herself."',
    };
    return examples[gapType] || '"The moment I realized this wasn\'t working was when I saw the look on her face - not frustrated, just resigned."';
  }

  /**
   * Move to the next gap or complete gathering
   */
  private moveToNextGap(
    essayId: string,
    states: GapConversationState[]
  ): {
    action: 'next_gap' | 'complete';
    next_question?: string;
    gathered_context?: GatheredContext;
    progress: {
      gaps_addressed: number;
      total_gaps: number;
      quality_so_far: 'weak' | 'medium' | 'strong';
    };
  } {
    // Find next pending gap
    const nextState = states.find(s => s.status === 'asking');

    if (!nextState) {
      // All gaps addressed
      return {
        action: 'complete',
        gathered_context: this.compileGatheredContext(states),
        progress: this.calculateProgress(states),
      };
    }

    // Start asking about next gap
    nextState.exchanges.push({
      question: nextState.gap.suggested_question,
      timestamp: Date.now(),
    });

    return {
      action: 'next_gap',
      next_question: nextState.gap.suggested_question,
      progress: this.calculateProgress(states),
    };
  }

  /**
   * Compile all gathered context into usable format
   */
  private compileGatheredContext(states: GapConversationState[]): GatheredContext {
    const allElements: UsableElement[] = [];
    const elementsByType: Record<string, UsableElement[]> = {};

    states.forEach(state => {
      state.captured_elements.forEach(el => {
        allElements.push(el);
        if (!elementsByType[el.element_type]) {
          elementsByType[el.element_type] = [];
        }
        elementsByType[el.element_type].push(el);
      });
    });

    // Sort by compelling score and take top 5
    const topElements = [...allElements]
      .sort((a, b) => b.compelling_score - a.compelling_score)
      .slice(0, 5);

    // Build gap summaries
    const gapSummaries = states.map(state => {
      const bestQuality = state.exchanges.reduce((best, ex) => {
        const tier = ex.assessment?.quality_tier;
        if (tier === 'strong') return 'strong';
        if (tier === 'medium' && best !== 'strong') return 'medium';
        return best;
      }, 'weak' as 'weak' | 'medium' | 'strong');

      return {
        gap_type: state.gap.gap_type,
        exchanges_count: state.exchanges.length,
        quality_achieved: bestQuality,
        key_captures: state.captured_elements
          .sort((a, b) => b.compelling_score - a.compelling_score)
          .slice(0, 2)
          .map(e => e.content),
      };
    });

    // Calculate overall quality
    const qualityScores = gapSummaries.map(s =>
      s.quality_achieved === 'strong' ? 100 :
      s.quality_achieved === 'medium' ? 60 : 20
    );
    const overallQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;

    // Determine if ready
    const strongOrMedium = gapSummaries.filter(s =>
      s.quality_achieved === 'strong' || s.quality_achieved === 'medium'
    ).length;
    const readyForSuggestions = strongOrMedium >= Math.ceil(gapSummaries.length / 2);

    // What's still needed
    const stillNeeded = gapSummaries
      .filter(s => s.quality_achieved === 'weak')
      .map(s => s.gap_type.replace(/_/g, ' '));

    return {
      elements_by_type: elementsByType,
      top_elements: topElements,
      gap_summaries: gapSummaries,
      overall_quality: overallQuality,
      ready_for_suggestions: readyForSuggestions,
      still_needed: stillNeeded.length > 0 ? stillNeeded : undefined,
    };
  }

  /**
   * Calculate conversation progress
   */
  private calculateProgress(states: GapConversationState[]): {
    gaps_addressed: number;
    total_gaps: number;
    quality_so_far: 'weak' | 'medium' | 'strong';
  } {
    const addressed = states.filter(s =>
      s.status === 'captured' || s.status === 'gave_up'
    ).length;

    // Best quality achieved so far
    let bestQuality: 'weak' | 'medium' | 'strong' = 'weak';
    states.forEach(state => {
      state.exchanges.forEach(ex => {
        if (ex.assessment?.quality_tier === 'strong') bestQuality = 'strong';
        else if (ex.assessment?.quality_tier === 'medium' && bestQuality !== 'strong') {
          bestQuality = 'medium';
        }
      });
    });

    return {
      gaps_addressed: addressed,
      total_gaps: states.length,
      quality_so_far: bestQuality,
    };
  }

  /**
   * Build opening context for the student
   */
  private buildOpeningContext(gapCount: number, strengths?: ExistingStrength[]): string {
    let context = `I'd love to help make your essay more compelling. To give you the best suggestions, I need to understand your experience better.\n\n`;

    if (strengths && strengths.length > 0) {
      context += `Your essay already has some great elements - like "${strengths[0].evidence_text.substring(0, 50)}..." - and I want to build on those.\n\n`;
    }

    context += `I have ${gapCount} quick question${gapCount > 1 ? 's' : ''} that will help me give you suggestions using YOUR real details, not generic examples.\n\n`;
    context += `The more specific you can be, the better. Don't worry about writing perfectly - just share the details as you remember them.`;

    return context;
  }

  /**
   * Get conversation state for debugging/display
   */
  getConversationState(essayId: string): GapConversationState[] | undefined {
    return this.conversationStates.get(essayId);
  }

  /**
   * Clear conversation state
   */
  clearConversation(essayId: string): void {
    this.conversationStates.delete(essayId);
  }

  /**
   * Convert GatheredContext to EnrichedStudentContext for suggestion generation
   *
   * This transforms the raw gathered elements into the structured format
   * that the suggestion engine expects.
   */
  toEnrichedContext(gathered: GatheredContext): EnrichedStudentContext {
    const elements = gathered.elements_by_type;

    // Extract specific moments from various element types
    const specificMoments: EnrichedStudentContext['specific_moments'] = [];

    // Sensory details become specific moments
    (elements['sensory_detail'] || []).forEach(el => {
      specificMoments.push({
        description: el.content,
        sensory_details: [el.content],
        emotional_context: el.usage_hint || '',
        source_question_id: 'gathered',
      });
    });

    // Time-based elements with emotional moments
    (elements['time'] || []).forEach(el => {
      specificMoments.push({
        description: `At ${el.content}`,
        sensory_details: [],
        emotional_context: 'Specific moment in time',
        source_question_id: 'gathered',
      });
    });

    // Dialogue becomes specific moments
    (elements['dialogue'] || []).forEach(el => {
      specificMoments.push({
        description: el.content,
        sensory_details: [],
        emotional_context: 'Direct dialogue adds authenticity',
        source_question_id: 'gathered',
      });
    });

    // Extract authentic insights
    const authenticInsights: EnrichedStudentContext['authentic_insights'] = [];

    (elements['insight'] || []).forEach(el => {
      authenticInsights.push({
        insight: el.content,
        what_prompted_it: el.usage_hint || 'Personal reflection',
        source_question_id: 'gathered',
      });
    });

    (elements['problem_solving'] || []).forEach(el => {
      authenticInsights.push({
        insight: el.content,
        what_prompted_it: 'Problem-solving process',
        source_question_id: 'gathered',
      });
    });

    // Extract struggles and failures
    const strugglesAndFailures: EnrichedStudentContext['struggles_and_failures'] = [];

    (elements['perseverance'] || []).forEach(el => {
      strugglesAndFailures.push({
        what_happened: el.content,
        what_they_learned: 'Persistence through difficulty',
        source_question_id: 'gathered',
      });
    });

    (elements['growth_moment'] || []).forEach(el => {
      strugglesAndFailures.push({
        what_happened: el.content,
        what_they_learned: 'Adapted approach based on experience',
        source_question_id: 'gathered',
      });
    });

    // Extract unique perspectives
    const uniquePerspectives: EnrichedStudentContext['unique_perspectives'] = [];

    (elements['curiosity'] || []).forEach(el => {
      uniquePerspectives.push({
        angle: el.content,
        why_they_see_it_this_way: 'Deep intellectual curiosity',
        source_question_id: 'gathered',
      });
    });

    (elements['initiative'] || []).forEach(el => {
      uniquePerspectives.push({
        angle: el.content,
        why_they_see_it_this_way: 'Self-directed action',
        source_question_id: 'gathered',
      });
    });

    (elements['resourcefulness'] || []).forEach(el => {
      uniquePerspectives.push({
        angle: el.content,
        why_they_see_it_this_way: 'Creative problem-solving',
        source_question_id: 'gathered',
      });
    });

    // Extract quotable phrases from top elements
    const quotablePhrases: EnrichedStudentContext['quotable_phrases'] = [];

    gathered.top_elements.forEach(el => {
      if (el.compelling_score >= 7) {
        quotablePhrases.push({
          phrase: el.content,
          context: el.usage_hint || '',
          source_question_id: 'gathered',
        });
      }
    });

    // Leadership and emotional moments become key people interactions
    const keyPeople: EnrichedStudentContext['key_people'] = [];

    (elements['leadership'] || []).forEach(el => {
      keyPeople.push({
        description: 'People I worked with/helped',
        relationship_dynamic: el.content,
        memorable_details: [el.content],
        source_question_id: 'gathered',
      });
    });

    return {
      specific_moments: specificMoments,
      authentic_insights: authenticInsights,
      key_people: keyPeople,
      struggles_and_failures: strugglesAndFailures,
      unique_perspectives: uniquePerspectives,
      quotable_phrases: quotablePhrases,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const conversationalContextGatherer = new ConversationalContextGatherer();
