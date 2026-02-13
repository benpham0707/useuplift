// @ts-nocheck
/**
 * Essay Context Service
 *
 * Provides holistic essay understanding for context-aware coaching.
 * Each section of an essay has a specific ROLE and PURPOSE within the larger narrative.
 * This service:
 * 1. Detects what section role the student is working on
 * 2. Provides section-specific guidance on purpose and strategy
 * 3. Accumulates context as the conversation develops
 * 4. Enables prompts to understand the "big picture" while staying focused
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * The role/type of section within the essay structure
 */
export type SectionRole =
  | 'opening_hook'        // First impression, must grab attention
  | 'pivotal_moment'      // The heart of the essay - where change happens
  | 'body_scene'          // Supporting scene that builds the narrative
  | 'reflection'          // Insight and meaning-making
  | 'turning_point'       // The moment of realization/change
  | 'conclusion'          // Landing - final impression
  | 'why_us'              // Supplemental - demonstrating fit
  | 'activity_reflection' // Supplemental - beyond the resume
  | 'why_major'           // Supplemental - intellectual passion
  | 'general';            // Fallback for unclassified sections

/**
 * Purpose and strategy for a specific section role
 */
export interface SectionPurpose {
  role: SectionRole;
  headline: string;
  what_it_accomplishes: string[];
  where_it_fits: string;
  emotional_arc_position: string;
  common_mistakes: string[];
  coaching_focus: string;
  key_question: string;  // The question the student should be able to answer
}

/**
 * Accumulated understanding built across conversation turns
 */
export interface DiscoveredContext {
  core_theme?: string;              // What the essay is really about
  authentic_voice_markers?: string[]; // Phrases/patterns that sound like them
  key_moment?: string;              // The specific moment we've identified
  key_moment_details?: {
    time?: string;
    place?: string;
    people?: string[];
    actions?: string[];
    sensory_details?: string[];
  };
  emotional_core?: string;          // The deeper feeling/realization
  unique_angle?: string;            // What makes their take different
  draft_fragments?: string[];       // Actual writing they've produced
  strengths_identified?: string[];  // What's working that we should amplify
  areas_addressed?: string[];       // Feedback already given
}

/**
 * Essay-level strategy developed through coaching
 */
export interface EssayStrategy {
  overall_approach?: string;        // "Show transformation through contrast"
  voice_profile?: string;           // "Direct, slightly self-deprecating, curious"
  narrative_structure?: string;     // "Opens with scene, spirals outward"
  strengths_to_lean_into?: string[];
  dangers_to_avoid?: string[];
  connection_to_prompt?: string;    // How this ties to the essay prompt
}

/**
 * Complete essay context accumulated across conversation
 */
export interface EssayContext {
  // Section identification
  section_role: SectionRole;
  section_purpose: SectionPurpose;

  // Accumulated understanding
  discovered: DiscoveredContext;

  // Strategy developed
  strategy: EssayStrategy;

  // Meta
  context_version: number;          // Increment each update for cache invalidation
  last_updated_phase: string;
  turn_count: number;
}

// ============================================================================
// SECTION ROLE DETECTION
// ============================================================================

/**
 * Issue types that indicate specific section roles
 */
const ISSUE_TYPE_TO_ROLE: Record<string, SectionRole> = {
  // Opening issues
  'famous_quote_opening': 'opening_hook',
  'dictionary_definition_opening': 'opening_hook',
  'childhood_opening_cliche': 'opening_hook',
  'rhetorical_question_flat': 'opening_hook',
  'thesis_statement_opening': 'opening_hook',
  'melodramatic_opening': 'opening_hook',
  'generic_scene_setting': 'opening_hook',
  'weak_opening': 'opening_hook',
  'generic_opening': 'opening_hook',

  // Conclusion issues
  'summary_conclusion': 'conclusion',
  'lesson_learned_ending': 'conclusion',
  'future_promise_ending': 'conclusion',
  'weak_ending': 'conclusion',
  'preachy_conclusion': 'conclusion',
  'abrupt_ending': 'conclusion',

  // Why Us / Supplemental
  'generic_why_us': 'why_us',
  'name_drop_without_depth': 'why_us',
  'swap_test_failure': 'why_us',

  // Why Major
  'generic_why_major': 'why_major',
  'childhood_interest_cliche': 'why_major',

  // Activity
  'activity_listing': 'activity_reflection',
  'resume_in_prose': 'activity_reflection',

  // Core narrative issues - need location detection
  'telling_not_showing': 'pivotal_moment',  // Default, may be overridden by location
  'cliche_language': 'general',
  'surface_level_reflection': 'reflection',
  'missing_vulnerability': 'pivotal_moment',
  'chronological_trudge': 'opening_hook',  // Structure issues often affect opening
};

/**
 * Location patterns that indicate section roles
 */
const LOCATION_PATTERNS: Array<{ pattern: RegExp; role: SectionRole }> = [
  { pattern: /^opening|^intro|^first|^beginning|paragraph\s*1\b/i, role: 'opening_hook' },
  { pattern: /conclusion|ending|final|last\s*paragraph/i, role: 'conclusion' },
  { pattern: /body|middle|paragraph\s*[2-4]\b/i, role: 'body_scene' },
  { pattern: /reflection|insight|realization/i, role: 'reflection' },
  { pattern: /turning\s*point|pivot|shift|change/i, role: 'turning_point' },
];

/**
 * Detect the section role based on issue type, location, and content
 */
export function detectSectionRole(
  issueType: string,
  location: string,
  quote: string
): SectionRole {
  // First, check issue type mapping (most reliable)
  const roleFromIssue = ISSUE_TYPE_TO_ROLE[issueType];
  if (roleFromIssue && roleFromIssue !== 'general') {
    return roleFromIssue;
  }

  // Second, check location patterns
  for (const { pattern, role } of LOCATION_PATTERNS) {
    if (pattern.test(location)) {
      return role;
    }
  }

  // Third, analyze content patterns
  const lowerQuote = quote.toLowerCase();

  // Opening indicators
  if (lowerQuote.startsWith('from a young age') ||
      lowerQuote.startsWith('i have always') ||
      lowerQuote.includes('as far back as i can remember')) {
    return 'opening_hook';
  }

  // Conclusion indicators
  if (lowerQuote.includes('in conclusion') ||
      lowerQuote.includes('this experience taught me') ||
      lowerQuote.includes('i learned that') ||
      lowerQuote.includes('looking forward') ||
      lowerQuote.includes('i will continue')) {
    return 'conclusion';
  }

  // Reflection indicators
  if (lowerQuote.includes('i realized') ||
      lowerQuote.includes('this made me understand') ||
      lowerQuote.includes('looking back')) {
    return 'reflection';
  }

  // Default based on issue type general category
  if (roleFromIssue) {
    return roleFromIssue;
  }

  return 'pivotal_moment';  // Default for narrative work
}

// ============================================================================
// SECTION PURPOSE DEFINITIONS
// ============================================================================

/**
 * Pre-defined purpose and strategy for each section role
 */
const SECTION_PURPOSES: Record<SectionRole, SectionPurpose> = {
  opening_hook: {
    role: 'opening_hook',
    headline: 'Your First Impression',
    what_it_accomplishes: [
      'Grabs attention within the first 2-3 sentences',
      'Establishes YOUR authentic voice (not generic "good essay" voice)',
      'Creates intrigue - makes the reader curious about you',
      'Sets up the central tension or question of your essay',
    ],
    where_it_fits: 'This is the reader\'s very first encounter with you. Admissions officers read hundreds of essays - your opening determines whether they lean in or tune out.',
    emotional_arc_position: 'The hook that pulls them into your world',
    common_mistakes: [
      'Starting with a famous quote (makes your voice invisible)',
      '"From a young age..." (delays the interesting part)',
      'Dictionary definitions (lazy and overdone)',
      'Dramatic rhetorical questions (feels manipulative)',
      'Setting the scene too slowly (lose them before the good stuff)',
    ],
    coaching_focus: 'Find the unexpected entry point - the specific detail or moment that makes them curious about YOU.',
    key_question: 'If a reader only read your first sentence, would they want to keep reading?',
  },

  pivotal_moment: {
    role: 'pivotal_moment',
    headline: 'The Heart of Your Essay',
    what_it_accomplishes: [
      'Shows transformation or realization in ACTION (not just told)',
      'Creates emotional resonance through specific sensory details',
      'Reveals character through choices and reactions',
      'Carries the reader through the change with them',
    ],
    where_it_fits: 'This is the scene that everything else points toward. It\'s not just an event - it\'s the moment your essay PROVES its claim about who you are.',
    emotional_arc_position: 'Peak tension and transformation',
    common_mistakes: [
      'Rushing through the moment (readers need time to feel it)',
      'Telling emotions instead of showing them ("I felt nervous")',
      'Making it too dramatic or too mundane',
      'Losing your specific voice in the intensity',
    ],
    coaching_focus: 'Slow down. Use sensory details. Let readers FEEL the shift happening in real time.',
    key_question: 'Can a reader picture exactly where you were and what you were doing?',
  },

  body_scene: {
    role: 'body_scene',
    headline: 'Building Your Narrative',
    what_it_accomplishes: [
      'Deepens understanding of who you are',
      'Provides texture and specificity that makes you memorable',
      'Shows consistency or evolution of character',
      'Builds the case without stating it explicitly',
    ],
    where_it_fits: 'Supporting scenes earn their place by adding dimension. Every detail should serve the larger story.',
    emotional_arc_position: 'Rising action or deepening understanding',
    common_mistakes: [
      'Including scenes that don\'t connect to the core theme',
      'Telling instead of showing',
      'Being too summary-focused instead of moment-focused',
      'Losing the thread of your larger point',
    ],
    coaching_focus: 'Connect back to the core. Ask: how does this scene PROVE something about who you are?',
    key_question: 'If you removed this scene, what would be lost from your essay?',
  },

  reflection: {
    role: 'reflection',
    headline: 'Your Insight and Meaning',
    what_it_accomplishes: [
      'Shows intellectual depth and self-awareness',
      'Connects your specific experience to universal truth',
      'Demonstrates maturity of thought',
      'Reveals how you process and learn from experience',
    ],
    where_it_fits: 'Reflection is where you show them HOW you think, not just WHAT happened. It\'s intellectual character.',
    emotional_arc_position: 'Processing and understanding',
    common_mistakes: [
      'Obvious insights anyone could have',
      'Stating the theme too explicitly ("This taught me...")',
      'Generic life lessons ("Always be yourself")',
      'Reflection that feels performative rather than genuine',
    ],
    coaching_focus: 'Go deeper than the obvious. What\'s the insight only YOU could have from YOUR specific experience?',
    key_question: 'Is this insight genuinely yours, or could anyone have written it?',
  },

  turning_point: {
    role: 'turning_point',
    headline: 'The Moment of Shift',
    what_it_accomplishes: [
      'Marks the precise moment when something changed',
      'Shows cause and effect clearly',
      'Creates dramatic tension and release',
      'Demonstrates growth in a visible way',
    ],
    where_it_fits: 'The turning point is when before becomes after. It\'s the hinge your entire narrative turns on.',
    emotional_arc_position: 'The pivot from tension to resolution',
    common_mistakes: [
      'Making the shift too sudden or too gradual',
      'Not grounding it in specific detail',
      'Telling the change instead of showing it',
      'Making it feel artificial or forced',
    ],
    coaching_focus: 'Pinpoint the exact moment. What changed? What triggered it? What was different after?',
    key_question: 'Can you identify the single moment when things shifted?',
  },

  conclusion: {
    role: 'conclusion',
    headline: 'Your Final Impression',
    what_it_accomplishes: [
      'Creates closure without being preachy',
      'Often echoes or transforms the opening',
      'Leaves the reader with a FEELING, not a lesson',
      'Shows where you are NOW, not where you were',
    ],
    where_it_fits: 'The ending disproportionately shapes how readers remember your essay. It\'s your last word - make it count.',
    emotional_arc_position: 'Landing - resolution with resonance',
    common_mistakes: [
      '"In conclusion, I learned..." (kills the narrative)',
      'Stating the theme explicitly (trust your reader)',
      'Moralistic lessons ("always be kind")',
      'Future promises ("I will use this in college...")',
      'Trying to tie everything up too neatly',
    ],
    coaching_focus: 'End on an image or moment, not a lesson. Let the meaning emerge from the story.',
    key_question: 'Does your ending leave readers with a feeling, or just a statement?',
  },

  why_us: {
    role: 'why_us',
    headline: 'Demonstrating Genuine Fit',
    what_it_accomplishes: [
      'Shows research beyond the website\'s front page',
      'Connects YOUR specific interests to THEIR specific offerings',
      'Demonstrates you\'d contribute, not just consume',
      'Feels authentic, not transactional',
    ],
    where_it_fits: 'Why Us essays prove you\'ve done your homework and have a real reason to be there - not just prestige.',
    emotional_arc_position: 'Connection and projection forward',
    common_mistakes: [
      'Generic praise any applicant could write ("great reputation")',
      'Failing the "swap test" (could replace school name with any school)',
      'Name-dropping without genuine engagement',
      'Focusing on what you\'ll GET rather than what you\'ll CONTRIBUTE',
    ],
    coaching_focus: 'The intellectual question test: What specific question do YOU have that THIS school can help answer?',
    key_question: 'If you swapped in another school\'s name, would this essay still work?',
  },

  why_major: {
    role: 'why_major',
    headline: 'Your Intellectual Passion',
    what_it_accomplishes: [
      'Shows genuine intellectual curiosity, not just career goals',
      'Connects a specific experience to academic interest',
      'Demonstrates you\'ve already engaged with the field',
      'Reveals HOW you think about problems in this area',
    ],
    where_it_fits: 'Why Major essays prove your interest is real and earned, not just a practical choice.',
    emotional_arc_position: 'Discovery and intellectual awakening',
    common_mistakes: [
      '"I\'ve always wanted to be a doctor..." (childhood clichés)',
      'Focusing on job outcomes rather than intellectual questions',
      'Generic descriptions of the field',
      'Not showing engagement beyond required coursework',
    ],
    coaching_focus: 'What specific question or problem in this field keeps you up at night?',
    key_question: 'Can you point to a specific moment when this subject grabbed you?',
  },

  activity_reflection: {
    role: 'activity_reflection',
    headline: 'Beyond the Resume',
    what_it_accomplishes: [
      'Shows who you BECAME through the activity, not what you DID',
      'Reveals something the activities list cannot show',
      'Demonstrates values in action through specific moments',
      'Shows growth or insight unique to your experience',
    ],
    where_it_fits: 'Admissions already has your activity list. This essay shows the human behind the achievements.',
    emotional_arc_position: 'Character revelation through action',
    common_mistakes: [
      'Resume in prose form (listing accomplishments)',
      'Focusing on titles and metrics instead of moments',
      'Generic lessons that could come from any activity',
      'Not finding the specific scene that shows who you are',
    ],
    coaching_focus: 'Find the one moment your activity list can\'t show. The quiet victory or the meaningful failure.',
    key_question: 'What happened during this activity that changed how you see yourself?',
  },

  general: {
    role: 'general',
    headline: 'Strengthening Your Writing',
    what_it_accomplishes: [
      'Improves clarity and impact',
      'Strengthens voice and authenticity',
      'Adds specificity and concrete detail',
      'Eliminates generic or weak elements',
    ],
    where_it_fits: 'Every part of your essay should work hard. This section needs to earn its place.',
    emotional_arc_position: 'Supporting the overall narrative',
    common_mistakes: [
      'Vague language that could describe anyone',
      'Telling instead of showing',
      'Generic phrases that lack personality',
      'Missing opportunities for specific detail',
    ],
    coaching_focus: 'Make every sentence do work. Specificity and authenticity are your best tools.',
    key_question: 'Does this sound like YOU, or could anyone have written it?',
  },
};

/**
 * Get the purpose definition for a section role
 */
export function getSectionPurpose(role: SectionRole): SectionPurpose {
  return SECTION_PURPOSES[role] || SECTION_PURPOSES.general;
}

// ============================================================================
// CONTEXT ACCUMULATION
// ============================================================================

/**
 * Initialize essay context from the initial issue and conversation
 */
export function initializeEssayContext(
  issueType: string,
  location: string,
  quote: string,
  problem: string
): EssayContext {
  const role = detectSectionRole(issueType, location, quote);
  const purpose = getSectionPurpose(role);

  return {
    section_role: role,
    section_purpose: purpose,
    discovered: {
      draft_fragments: [quote],
      areas_addressed: [],
      strengths_identified: [],
    },
    strategy: {
      dangers_to_avoid: purpose.common_mistakes.slice(0, 2),  // Most relevant
    },
    context_version: 1,
    last_updated_phase: 'init',
    turn_count: 0,
  };
}

/**
 * Extract insights from student message to update context
 */
function extractStudentInsights(
  message: string,
  currentContext: EssayContext
): Partial<DiscoveredContext> {
  const insights: Partial<DiscoveredContext> = {};
  const lower = message.toLowerCase();

  // Extract time references
  const timePatterns = [
    /\b(last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year|summer|fall|winter|spring)\b/i,
    /\bwhen\s+i\s+was\s+(\d+|in\s+\w+\s+grade)\b/i,
    /\b(\d+)(st|nd|rd|th)\s+grade\b/i,
    /\bat\s+(\d+)\s*(am|pm)\b/i,
  ];
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (!currentContext.discovered.key_moment_details) {
        insights.key_moment_details = { time: match[0] };
      } else {
        insights.key_moment_details = {
          ...currentContext.discovered.key_moment_details,
          time: match[0],
        };
      }
      break;
    }
  }

  // Extract location references
  const locationPatterns = [
    /\bin\s+(my|the|our)\s+(room|house|kitchen|backyard|car|school|class|lab|garage)\b/i,
    /\bat\s+(the|my)\s+\w+/i,
    /\b(hospital|library|gym|park|beach|airport)\b/i,
  ];
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      insights.key_moment_details = {
        ...insights.key_moment_details,
        ...currentContext.discovered.key_moment_details,
        place: match[0],
      };
      break;
    }
  }

  // Extract people references
  const peopleMatches = message.match(/\b(my|our)\s+(mom|dad|mother|father|brother|sister|friend|teacher|coach|grandma|grandpa)\b/gi);
  if (peopleMatches && peopleMatches.length > 0) {
    insights.key_moment_details = {
      ...insights.key_moment_details,
      ...currentContext.discovered.key_moment_details,
      people: peopleMatches,
    };
  }

  // Check if this looks like draft writing
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (sentences.length >= 2) {
    // This might be draft content
    const draftContent = sentences.slice(0, 3).join('. ').trim();
    if (draftContent.length > 50) {
      insights.draft_fragments = [
        ...(currentContext.discovered.draft_fragments || []),
        draftContent,
      ];
    }
  }

  return insights;
}

/**
 * Extract insights from coach response to update context
 */
function extractCoachInsights(
  response: string,
  currentContext: EssayContext
): Partial<EssayStrategy> {
  const insights: Partial<EssayStrategy> = {};
  const lower = response.toLowerCase();

  // Detect technique mentions
  const techniques = ['pacing', 'sensory', 'dialogue', 'action beats', 'zoom in', 'sentence rhythm'];
  const mentionedTechniques = techniques.filter(t => lower.includes(t));
  if (mentionedTechniques.length > 0) {
    insights.strengths_to_lean_into = [
      ...(currentContext.strategy.strengths_to_lean_into || []),
      ...mentionedTechniques.map(t => `Using ${t}`),
    ];
  }

  // Detect positive feedback on voice
  if (lower.includes('voice') && (lower.includes('working') || lower.includes('strong') || lower.includes('authentic'))) {
    insights.voice_profile = 'Authentic voice emerging';
  }

  // Detect structural suggestions
  if (lower.includes('slow down') || lower.includes('pacing')) {
    insights.overall_approach = 'Slow down key moments';
  }

  return insights;
}

/**
 * Update essay context based on a conversation turn
 */
export function accumulateContext(
  currentContext: EssayContext,
  phase: string,
  studentMessage: string,
  coachResponse: string
): EssayContext {
  // Extract insights from student message
  const studentInsights = extractStudentInsights(studentMessage, currentContext);

  // Extract insights from coach response
  const coachInsights = extractCoachInsights(coachResponse, currentContext);

  // Merge everything
  return {
    ...currentContext,
    discovered: {
      ...currentContext.discovered,
      ...studentInsights,
      key_moment_details: {
        ...currentContext.discovered.key_moment_details,
        ...studentInsights.key_moment_details,
      },
    },
    strategy: {
      ...currentContext.strategy,
      ...coachInsights,
    },
    context_version: currentContext.context_version + 1,
    last_updated_phase: phase,
    turn_count: currentContext.turn_count + 1,
  };
}

// ============================================================================
// CONTEXT FORMATTING FOR PROMPTS
// ============================================================================

/**
 * Format essay context for injection into prompts
 */
export function formatContextForPrompt(context: EssayContext): string {
  const { section_role, section_purpose, discovered, strategy } = context;

  const lines: string[] = [];

  // Section Role and Purpose
  lines.push('# THE BIG PICTURE');
  lines.push('');
  lines.push(`**Section Role:** ${section_purpose.headline}`);
  lines.push(`**Purpose:** ${section_purpose.where_it_fits}`);
  lines.push('');

  // What this section needs to accomplish
  lines.push('**What This Section Must Accomplish:**');
  section_purpose.what_it_accomplishes.forEach(item => {
    lines.push(`- ${item}`);
  });
  lines.push('');

  // Key question
  lines.push(`**Key Question to Answer:** ${section_purpose.key_question}`);
  lines.push('');

  // What we've learned (if anything)
  if (discovered.key_moment_details && Object.keys(discovered.key_moment_details).length > 0) {
    lines.push('## WHAT WE\'VE DISCOVERED');
    lines.push('');
    const details = discovered.key_moment_details;
    if (details.time) lines.push(`- **When:** ${details.time}`);
    if (details.place) lines.push(`- **Where:** ${details.place}`);
    if (details.people && details.people.length > 0) {
      lines.push(`- **Who:** ${details.people.join(', ')}`);
    }
    lines.push('');
  }

  // Draft fragments they've produced
  if (discovered.draft_fragments && discovered.draft_fragments.length > 1) {
    lines.push('## THEIR WRITING SO FAR');
    lines.push('');
    // Show most recent draft (skip the original quote)
    const recentDraft = discovered.draft_fragments[discovered.draft_fragments.length - 1];
    lines.push(`"${recentDraft.substring(0, 200)}${recentDraft.length > 200 ? '...' : ''}"`);
    lines.push('');
  }

  // Strategy
  if (strategy.overall_approach || strategy.voice_profile) {
    lines.push('## COACHING STRATEGY');
    lines.push('');
    if (strategy.overall_approach) {
      lines.push(`**Approach:** ${strategy.overall_approach}`);
    }
    if (strategy.voice_profile) {
      lines.push(`**Voice:** ${strategy.voice_profile}`);
    }
    if (strategy.strengths_to_lean_into && strategy.strengths_to_lean_into.length > 0) {
      lines.push(`**Build on:** ${strategy.strengths_to_lean_into.slice(-2).join(', ')}`);
    }
    lines.push('');
  }

  // Dangers to avoid (section-specific)
  lines.push('## SECTION-SPECIFIC PITFALLS');
  lines.push('');
  lines.push(`**Coaching Focus:** ${section_purpose.coaching_focus}`);
  lines.push('');
  lines.push('Watch out for these common mistakes in this type of section:');
  section_purpose.common_mistakes.slice(0, 3).forEach(mistake => {
    lines.push(`- ${mistake}`);
  });
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const essayContextService = {
  detectSectionRole,
  getSectionPurpose,
  initializeEssayContext,
  accumulateContext,
  formatContextForPrompt,
};
