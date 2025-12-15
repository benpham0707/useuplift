/**
 * Common App Supplemental Essay Types
 *
 * 14 distinct supplemental essay categories with specific analysis criteria
 * Each type has unique evaluation dimensions and college-specific variations
 */

export type SupplementalType =
  | 'why_us'           // Why this college/university?
  | 'why_major'        // Why this major/area of study?
  | 'community'        // How will you contribute to our community?
  | 'diversity'        // Diversity statement / unique background
  | 'intellectual'     // Intellectual curiosity / academic interests
  | 'extracurricular'  // Activity/passion essay
  | 'challenge'        // Overcoming challenge / adversity
  | 'leadership'       // Leadership experience
  | 'creative'         // Creative side / unique talent
  | 'values'           // Personal values / what matters to you
  | 'future_goals'     // Future aspirations / career goals
  | 'additional_info'  // Additional information / context
  | 'short_answer'     // Short answer (50-150 words)
  | 'optional'         // Optional essay

export interface SupplementalTypeInfo {
  id: SupplementalType;
  name: string;
  description: string;

  // Common characteristics
  typical_word_range: { min: number; max: number };
  common_pitfalls: string[];

  // Analysis dimensions specific to this type
  rubric_dimensions: string[];

  // What colleges look for in this type
  evaluation_criteria: string[];

  // Examples of this type
  example_prompts: string[];
}

export const SUPPLEMENTAL_TYPE_INFO: Record<SupplementalType, SupplementalTypeInfo> = {
  why_us: {
    id: 'why_us',
    name: 'Why Us Essay',
    description: 'Explain why you want to attend this specific college',
    typical_word_range: { min: 100, max: 350 },
    common_pitfalls: [
      'Generic reasons that could apply to any college',
      'Only mentioning rankings or prestige',
      'No connection to personal goals/interests',
      'Surface-level research (just listing programs)'
    ],
    rubric_dimensions: [
      'specificity',
      'research_depth',
      'personal_connection',
      'fit_demonstration',
      'genuine_interest'
    ],
    evaluation_criteria: [
      'Names specific programs, professors, courses, or opportunities',
      'Connects college resources to personal goals',
      'Shows deep research beyond website',
      'Demonstrates cultural/value fit',
      'Explains mutual benefit (what student brings)'
    ],
    example_prompts: [
      'Why Stanford? (100-250 words)',
      'Why are you drawn to the academic fields you indicated? (200 words)',
      'What about Yale has led you to apply? (125 words)'
    ]
  },

  why_major: {
    id: 'why_major',
    name: 'Why This Major',
    description: 'Explain interest in specific field of study',
    typical_word_range: { min: 150, max: 350 },
    common_pitfalls: [
      'Generic love of subject without specificity',
      'No origin story or intellectual journey',
      'Career-focused only (not intellectually curious)',
      'Doesn\'t connect to college\'s specific program'
    ],
    rubric_dimensions: [
      'intellectual_depth',
      'authentic_interest',
      'knowledge_demonstration',
      'future_vision',
      'program_fit'
    ],
    evaluation_criteria: [
      'Shows genuine intellectual curiosity',
      'Demonstrates knowledge of the field',
      'Explains origin of interest (how/when)',
      'Connects to college\'s specific department',
      'Shows progression of thinking'
    ],
    example_prompts: [
      'Why are you interested in the major you indicated? (200 words)',
      'Describe your interest in engineering (250 words)',
      'What draws you to computer science at MIT?'
    ]
  },

  community: {
    id: 'community',
    name: 'Community Contribution',
    description: 'How you will contribute to campus community',
    typical_word_range: { min: 150, max: 300 },
    common_pitfalls: [
      'Vague promises without evidence',
      'List of clubs without meaningful engagement',
      'No connection to past experiences',
      'Doesn\'t understand college\'s specific community'
    ],
    rubric_dimensions: [
      'past_contribution_evidence',
      'community_understanding',
      'specific_involvement_plan',
      'value_alignment',
      'collaborative_mindset'
    ],
    evaluation_criteria: [
      'Backs claims with past community contributions',
      'Shows understanding of college\'s community values',
      'Names specific organizations/opportunities',
      'Demonstrates collaborative vs self-focused mindset',
      'Shows how background enriches community'
    ],
    example_prompts: [
      'How will you contribute to the Penn community? (150 words)',
      'What will you bring to our community? (200 words)',
      'How will you engage with the diverse Brown community?'
    ]
  },

  diversity: {
    id: 'diversity',
    name: 'Diversity Statement',
    description: 'How your background/perspective enriches the community',
    typical_word_range: { min: 200, max: 500 },
    common_pitfalls: [
      'Surface-level identity without depth',
      'Trauma porn or oversharing',
      'Doesn\'t explain how perspective enriches community',
      'Defensive or apologetic tone'
    ],
    rubric_dimensions: [
      'perspective_uniqueness',
      'self_awareness',
      'community_enrichment',
      'growth_mindset',
      'vulnerability_balance'
    ],
    evaluation_criteria: [
      'Offers unique perspective or background',
      'Shows self-awareness and reflection',
      'Explains how perspective enriches others',
      'Demonstrates resilience and growth',
      'Balances vulnerability with strength'
    ],
    example_prompts: [
      'How has your background shaped you? (500 words)',
      'Describe a perspective you bring (300 words)',
      'How will your experiences enrich our community?'
    ]
  },

  intellectual: {
    id: 'intellectual',
    name: 'Intellectual Curiosity',
    description: 'Academic interests, ideas, or intellectual exploration',
    typical_word_range: { min: 200, max: 400 },
    common_pitfalls: [
      'Describing homework/classwork only',
      'No independent intellectual exploration',
      'Surface-level interest without depth',
      'Doesn\'t show genuine curiosity'
    ],
    rubric_dimensions: [
      'self_directed_learning',
      'intellectual_depth',
      'curiosity_demonstration',
      'idea_engagement',
      'critical_thinking'
    ],
    evaluation_criteria: [
      'Shows self-directed learning beyond classroom',
      'Demonstrates deep engagement with ideas',
      'Asks meaningful questions',
      'Shows evolution of thinking',
      'Connects ideas across disciplines'
    ],
    example_prompts: [
      'Reflect on an idea or experience (250 words) - Stanford',
      'What ideas interest you intellectually? (300 words)',
      'Describe an academic topic you find fascinating'
    ]
  },

  extracurricular: {
    id: 'extracurricular',
    name: 'Activity/Passion Essay',
    description: 'Deep dive into meaningful activity or passion',
    typical_word_range: { min: 250, max: 500 },
    common_pitfalls: [
      'Just describing what the activity is',
      'Listing accomplishments without insight',
      'No reflection on impact or growth',
      'Doesn\'t reveal character/values'
    ],
    rubric_dimensions: [
      'depth_over_breadth',
      'personal_growth',
      'impact_demonstration',
      'authentic_passion',
      'character_revelation'
    ],
    evaluation_criteria: [
      'Goes deep into one activity vs surface-level many',
      'Shows personal growth and learning',
      'Demonstrates impact on others',
      'Reveals character, values, or identity',
      'Shows sustained commitment'
    ],
    example_prompts: [
      'Expand on one of your activities (250 words)',
      'Describe a passion or interest (400 words)',
      'Tell us about something you love to do'
    ]
  },

  challenge: {
    id: 'challenge',
    name: 'Challenge Essay',
    description: 'Overcoming obstacle, setback, or adversity',
    typical_word_range: { min: 250, max: 650 },
    common_pitfalls: [
      'Trauma dumping without reflection',
      'Victim mentality without growth',
      'Challenge not actually challenging',
      'No lessons learned or resilience shown'
    ],
    rubric_dimensions: [
      'resilience',
      'growth_mindset',
      'self_awareness',
      'problem_solving',
      'perspective_gained'
    ],
    evaluation_criteria: [
      'Shows genuine challenge (context matters)',
      'Demonstrates resilience and agency',
      'Reflects on lessons learned',
      'Shows growth and maturity',
      'Focuses on response, not just problem'
    ],
    example_prompts: [
      'Describe a challenge you faced (650 words)',
      'Tell us about a setback (400 words)',
      'How have you overcome adversity?'
    ]
  },

  leadership: {
    id: 'leadership',
    name: 'Leadership Experience',
    description: 'Leadership role or experience',
    typical_word_range: { min: 200, max: 400 },
    common_pitfalls: [
      'Defining leadership as title/position only',
      'Bragging without vulnerability',
      'No specific examples of impact',
      'Doesn\'t show collaborative leadership'
    ],
    rubric_dimensions: [
      'leadership_philosophy',
      'impact_on_others',
      'collaborative_approach',
      'problem_solving',
      'authenticity'
    ],
    evaluation_criteria: [
      'Defines leadership beyond titles',
      'Shows impact on team/community',
      'Demonstrates collaborative vs authoritarian style',
      'Includes vulnerability or challenges',
      'Shows growth as leader'
    ],
    example_prompts: [
      'Describe a leadership experience (250 words)',
      'Tell us about a time you led others (300 words)',
      'What does leadership mean to you?'
    ]
  },

  creative: {
    id: 'creative',
    name: 'Creative Side',
    description: 'Creative talent, artistic side, or unique skill',
    typical_word_range: { min: 200, max: 350 },
    common_pitfalls: [
      'Just describing the art/skill',
      'No connection to identity or growth',
      'Overly technical without emotion',
      'Doesn\'t show creative process'
    ],
    rubric_dimensions: [
      'creative_process',
      'personal_expression',
      'growth_through_creativity',
      'authenticity',
      'unique_perspective'
    ],
    evaluation_criteria: [
      'Shows creative process, not just product',
      'Connects creativity to identity/values',
      'Demonstrates growth through creative work',
      'Reveals unique perspective',
      'Balances passion with reflection'
    ],
    example_prompts: [
      'Tell us about your creative side (250 words)',
      'Describe a talent or skill (200 words)',
      'What do you do for fun?'
    ]
  },

  values: {
    id: 'values',
    name: 'Personal Values',
    description: 'What matters to you, core beliefs, or principles',
    typical_word_range: { min: 200, max: 400 },
    common_pitfalls: [
      'Stating values without demonstration',
      'Generic values everyone claims',
      'No origin story or development',
      'Preachy tone without self-awareness'
    ],
    rubric_dimensions: [
      'value_demonstration',
      'origin_story',
      'consistency',
      'self_awareness',
      'authentic_voice'
    ],
    evaluation_criteria: [
      'Shows values through actions/stories',
      'Explains how values developed',
      'Demonstrates consistency across contexts',
      'Shows self-awareness and nuance',
      'Avoids preachy or generic statements'
    ],
    example_prompts: [
      'What matters most to you? (300 words)',
      'Describe your core values (250 words)',
      'What do you stand for?'
    ]
  },

  future_goals: {
    id: 'future_goals',
    name: 'Future Goals',
    description: 'Career aspirations, life goals, or future vision',
    typical_word_range: { min: 150, max: 300 },
    common_pitfalls: [
      'Unrealistic or vague goals',
      'No connection to past experiences',
      'Only career-focused (not values/impact)',
      'Doesn\'t explain "why" behind goals'
    ],
    rubric_dimensions: [
      'goal_clarity',
      'past_to_future_connection',
      'impact_orientation',
      'realistic_planning',
      'value_alignment'
    ],
    evaluation_criteria: [
      'Goals are specific and achievable',
      'Connects to past experiences/interests',
      'Includes impact on others/society',
      'Shows thoughtful planning',
      'Aligns with personal values'
    ],
    example_prompts: [
      'What are your career goals? (200 words)',
      'Where do you see yourself in 10 years? (250 words)',
      'What impact do you want to make?'
    ]
  },

  additional_info: {
    id: 'additional_info',
    name: 'Additional Information',
    description: 'Context, circumstances, or additional background',
    typical_word_range: { min: 100, max: 650 },
    common_pitfalls: [
      'Repeating information already in app',
      'Making excuses without taking ownership',
      'Oversharing irrelevant details',
      'Missing opportunity to explain context'
    ],
    rubric_dimensions: [
      'relevance',
      'context_provision',
      'responsibility_balance',
      'conciseness',
      'strategic_disclosure'
    ],
    evaluation_criteria: [
      'Adds genuinely new information',
      'Provides context without excuses',
      'Explains circumstances clearly',
      'Balances explanation with ownership',
      'Strategic about what to include'
    ],
    example_prompts: [
      'Is there anything else you want us to know? (650 words)',
      'Additional information (optional)',
      'Context we should consider'
    ]
  },

  short_answer: {
    id: 'short_answer',
    name: 'Short Answer',
    description: 'Brief response (50-150 words)',
    typical_word_range: { min: 25, max: 150 },
    common_pitfalls: [
      'Trying to fit too much',
      'Being too generic due to word limit',
      'No specificity or detail',
      'Missing the "why" behind the answer'
    ],
    rubric_dimensions: [
      'conciseness',
      'specificity',
      'personality',
      'strategic_focus',
      'memorability'
    ],
    evaluation_criteria: [
      'Concise and focused',
      'Specific details/examples',
      'Shows personality',
      'Strategic word choice',
      'Memorable and unique'
    ],
    example_prompts: [
      'List 5 activities you do for fun (50 words)',
      'One word to describe you (1 word)',
      'Favorite book and why (100 words)'
    ]
  },

  optional: {
    id: 'optional',
    name: 'Optional Essay',
    description: 'Optional supplemental essay (various topics)',
    typical_word_range: { min: 200, max: 500 },
    common_pitfalls: [
      'Submitting weak optional essay',
      'Repeating main essay themes',
      'Not being strategic about topic',
      'Submitting just to submit'
    ],
    rubric_dimensions: [
      'strategic_value',
      'new_information',
      'quality_bar',
      'topic_choice',
      'risk_taking'
    ],
    evaluation_criteria: [
      'Adds significant new dimension',
      'High quality (doesn\'t hurt application)',
      'Strategic topic choice',
      'Shows another side of applicant',
      'Worth the reader\'s time'
    ],
    example_prompts: [
      'Optional essay (no prompt)',
      'Anything else to share? (optional)',
      'Additional statement (optional)'
    ]
  }
};

/**
 * Get supplemental type info by ID
 */
export function getSupplementalTypeInfo(type: SupplementalType): SupplementalTypeInfo {
  return SUPPLEMENTAL_TYPE_INFO[type];
}

/**
 * Get all supplemental types
 */
export function getAllSupplementalTypes(): SupplementalTypeInfo[] {
  return Object.values(SUPPLEMENTAL_TYPE_INFO);
}

/**
 * Categorize supplemental types for UI grouping
 */
export const SUPPLEMENTAL_TYPE_CATEGORIES = {
  'College Fit': ['why_us', 'why_major', 'community'] as SupplementalType[],
  'Personal Identity': ['diversity', 'values', 'creative'] as SupplementalType[],
  'Intellectual & Academic': ['intellectual', 'extracurricular', 'future_goals'] as SupplementalType[],
  'Character & Growth': ['challenge', 'leadership'] as SupplementalType[],
  'Other': ['additional_info', 'short_answer', 'optional'] as SupplementalType[]
};

/**
 * Get category for a supplemental type
 */
export function getSupplementalTypeCategory(type: SupplementalType): string {
  for (const [category, types] of Object.entries(SUPPLEMENTAL_TYPE_CATEGORIES)) {
    if (types.includes(type)) {
      return category;
    }
  }
  return 'Other';
}
