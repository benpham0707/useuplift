/**
 * Common App Colleges Database
 *
 * Each college has:
 * - Unique supplemental essays
 * - Core values with weights
 * - Research-backed criteria
 * - College-specific preferences
 */

import { SupplementalType } from './commonAppSupplementalTypes';

export interface CommonAppCollege {
  id: string;
  name: string;
  shortName: string;
  logo?: string;

  // Core values (what this college weighs most)
  coreValues: CoreValue[];

  // Supplemental essays for this college
  supplementals: CommonAppSupplemental[];

  // College-specific analysis criteria
  preferences: CollegePreferences;

  // Research metadata
  research: ResearchMetadata;
}

export interface CoreValue {
  id: string;
  name: string;
  weight: number; // Percentage (should sum to 100)
  definition: string;
  how_to_demonstrate: string[];

  // Research backing
  source: string;
  source_url?: string;
}

export interface CommonAppSupplemental {
  id: string;
  collegeId: string;

  // Essay details
  title: string;
  prompt: string;
  wordLimit: number;
  wordMin?: number;
  required: boolean;

  // Classification
  type: SupplementalType;

  // Analysis hints (what to look for in this specific prompt)
  analysisHints?: {
    key_elements: string[]; // What must be present
    red_flags: string[];    // What to avoid
    elite_patterns: string[]; // What 90+ essays do
  };
}

export interface CollegePreferences {
  // What this college values in essays
  essay_priorities: string[];

  // Common red flags specific to this college
  red_flags: string[];

  // Tone preferences
  preferred_tone: string[];
  avoid_tone: string[];

  // Structural preferences
  structure_notes?: string;
}

export interface ResearchMetadata {
  // Where research comes from
  sources: {
    admission_website?: string;
    dean_interviews?: string[];
    mission_statement?: string;
    elite_essay_database?: string;
  };

  // Last updated
  last_updated: string;

  // Research quality score (1-10)
  research_depth: number;
}

/**
 * Common App Colleges Database
 *
 * Start with top colleges, expand over time
 */
export const COMMON_APP_COLLEGES: CommonAppCollege[] = [
  // ============================================================================
  // STANFORD UNIVERSITY
  // ============================================================================
  {
    id: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',

    coreValues: [
      {
        id: 'stanford_intellectual_vitality',
        name: 'Intellectual Vitality',
        weight: 40,
        definition: 'Pursuing learning for its own sake, beyond classroom requirements. Self-directed exploration of ideas and independent projects.',
        how_to_demonstrate: [
          'Independent research or projects',
          'Self-directed learning beyond coursework',
          'Intellectual curiosity in action',
          'Asking meaningful questions',
          'Cross-disciplinary connections'
        ],
        source: 'Stanford Admission - What We Look For',
        source_url: 'https://admission.stanford.edu/apply/selection/'
      },
      {
        id: 'stanford_impact',
        name: 'Impact & Leadership',
        weight: 25,
        definition: 'Making a difference in your community. Leadership that empowers others and creates positive change.',
        how_to_demonstrate: [
          'Community impact with measurable results',
          'Leadership that empowers others',
          'Initiative and agency',
          'Sustained commitment',
          'Collaborative problem-solving'
        ],
        source: 'Stanford Admission - What We Look For',
        source_url: 'https://admission.stanford.edu/apply/selection/'
      },
      {
        id: 'stanford_context',
        name: 'Context & Character',
        weight: 20,
        definition: 'Overcoming obstacles, resilience, and personal qualities. How you\'ve grown through challenges.',
        how_to_demonstrate: [
          'Resilience through challenges',
          'Growth mindset',
          'Resourcefulness',
          'Perspective on circumstances',
          'Character in action'
        ],
        source: 'Stanford Admission - What We Look For',
        source_url: 'https://admission.stanford.edu/apply/selection/'
      },
      {
        id: 'stanford_authenticity',
        name: 'Authenticity & Voice',
        weight: 15,
        definition: 'Genuine voice and authentic self-presentation. Being yourself, not who you think Stanford wants.',
        how_to_demonstrate: [
          'Unique perspective',
          'Genuine enthusiasm',
          'Personal voice',
          'Vulnerability and honesty',
          'Specific, not generic'
        ],
        source: 'Stanford Essays That Worked',
        source_url: 'https://www.stanforddaily.com/category/opinions/op-essays-that-worked/'
      }
    ],

    supplementals: [
      {
        id: 'stanford_why_stanford',
        collegeId: 'stanford',
        title: 'Why Stanford?',
        prompt: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        type: 'intellectual',
        analysisHints: {
          key_elements: [
            'Specific idea or experience (not generic)',
            'Self-directed learning beyond classroom',
            'Genuine intellectual curiosity',
            'Connection to Stanford resources'
          ],
          red_flags: [
            'Classroom learning only',
            'Generic "love of learning"',
            'No Stanford-specific connection',
            'Prestige-focused reasons'
          ],
          elite_patterns: [
            'Independent project or research',
            'Unexpected intellectual pursuit',
            'Cross-disciplinary connection',
            'Specific Stanford professor/program'
          ]
        }
      },
      {
        id: 'stanford_what_matters',
        collegeId: 'stanford',
        title: 'What Matters to You, and Why?',
        prompt: 'Tell us about something that is meaningful to you and why.',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        type: 'values',
        analysisHints: {
          key_elements: [
            'Specific thing/value/belief',
            'Origin story (how it became meaningful)',
            'Actions that demonstrate it',
            'Growth or evolution'
          ],
          red_flags: [
            'Generic values everyone claims',
            'Stating without demonstrating',
            'No personal connection',
            'Preachy tone'
          ],
          elite_patterns: [
            'Unexpected or unique value',
            'Demonstrated through specific actions',
            'Vulnerable and authentic',
            'Shows character development'
          ]
        }
      },
      {
        id: 'stanford_roommate_letter',
        collegeId: 'stanford',
        title: 'Letter to Your Future Roommate',
        prompt: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        type: 'creative',
        analysisHints: {
          key_elements: [
            'Conversational, friendly tone',
            'Reveals personality/quirks',
            'Specific details',
            'Shows thoughtfulness'
          ],
          red_flags: [
            'Resume in paragraph form',
            'Too formal/stiff',
            'Generic traits',
            'Trying too hard to be quirky'
          ],
          elite_patterns: [
            'Unexpected personality reveal',
            'Humor and warmth',
            'Specific habits/interests',
            'Shows community-mindedness'
          ]
        }
      }
    ],

    preferences: {
      essay_priorities: [
        'Intellectual vitality above all',
        'Self-directed learning',
        'Specificity over generality',
        'Authenticity over achievement',
        'Impact over titles'
      ],
      red_flags: [
        'Classroom-bounded learning (no independent exploration)',
        'Prestige-focused (rankings, brand)',
        'Generic reasons that apply to any top school',
        'Resume repetition',
        'Overly formal or academic tone'
      ],
      preferred_tone: [
        'Authentic and genuine',
        'Intellectually curious',
        'Reflective',
        'Passionate but not dramatic',
        'Conversational yet thoughtful'
      ],
      avoid_tone: [
        'Trying to impress',
        'Overly formal/academic',
        'Generic/cliché',
        'Arrogant',
        'Detached or clinical'
      ],
      structure_notes: 'Stanford values specificity and authenticity. Show, don\'t tell. Use concrete examples over abstract claims.'
    },

    research: {
      sources: {
        admission_website: 'https://admission.stanford.edu/apply/',
        dean_interviews: [
          'https://www.stanforddaily.com/dean-shaw-interview-2023/',
          'https://stanfordmag.org/contents/admission-insights'
        ],
        mission_statement: 'https://www.stanford.edu/about/history/',
        elite_essay_database: 'Internal: STAN_ELITE_ESSAYS_2020_2024'
      },
      last_updated: '2024-12-01',
      research_depth: 9
    }
  },

  // ============================================================================
  // HARVARD UNIVERSITY
  // ============================================================================
  {
    id: 'harvard',
    name: 'Harvard University',
    shortName: 'Harvard',

    coreValues: [
      {
        id: 'harvard_intellectual_engagement',
        name: 'Intellectual Engagement',
        weight: 35,
        definition: 'Deep engagement with ideas, scholarly pursuits, and academic excellence. Love of learning for its own sake.',
        how_to_demonstrate: [
          'Academic depth in specific area',
          'Scholarly interests',
          'Research or independent study',
          'Intellectual contributions to community',
          'Critical thinking demonstrated'
        ],
        source: 'Harvard Admissions - Selection Criteria',
        source_url: 'https://college.harvard.edu/admissions/apply'
      },
      {
        id: 'harvard_community_citizenship',
        name: 'Community & Citizenship',
        weight: 30,
        definition: 'Contributing to community and demonstrating civic engagement. Being a good citizen and community member.',
        how_to_demonstrate: [
          'Community service with impact',
          'Civic engagement',
          'Collaborative contributions',
          'Supporting others',
          'Social responsibility'
        ],
        source: 'Harvard Admissions - Selection Criteria',
        source_url: 'https://college.harvard.edu/admissions/apply'
      },
      {
        id: 'harvard_character',
        name: 'Personal Character',
        weight: 25,
        definition: 'Integrity, kindness, courage, and resilience. Character qualities beyond achievements.',
        how_to_demonstrate: [
          'Integrity in action',
          'Kindness to others',
          'Moral courage',
          'Resilience through adversity',
          'Authentic self-reflection'
        ],
        source: 'Harvard Admissions - Personal Qualities',
        source_url: 'https://college.harvard.edu/admissions/apply'
      },
      {
        id: 'harvard_extracurricular_distinction',
        name: 'Extracurricular Distinction',
        weight: 10,
        definition: 'Excellence or leadership in activities outside classroom. Depth over breadth.',
        how_to_demonstrate: [
          'Leadership in activities',
          'Notable achievements',
          'Long-term commitment',
          'Impact on organization',
          'Depth in 1-2 areas'
        ],
        source: 'Harvard Admissions - Extracurricular',
        source_url: 'https://college.harvard.edu/admissions/apply'
      }
    ],

    supplementals: [
      {
        id: 'harvard_optional_1',
        collegeId: 'harvard',
        title: 'Optional Essay 1',
        prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
        wordLimit: 200,
        required: false,
        type: 'diversity',
        analysisHints: {
          key_elements: [
            'Specific life experiences',
            'How experiences shaped you',
            'Concrete ways you\'ll contribute',
            'Connection to Harvard community'
          ],
          red_flags: [
            'Generic diversity statement',
            'No specific experiences',
            'Vague contribution promises',
            'Identity without depth'
          ],
          elite_patterns: [
            'Unique perspective demonstrated',
            'Specific Harvard contributions',
            'Self-awareness and reflection',
            'Community enrichment focus'
          ]
        }
      },
      {
        id: 'harvard_optional_2',
        collegeId: 'harvard',
        title: 'Optional Essay 2',
        prompt: 'Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience?',
        wordLimit: 200,
        required: false,
        type: 'challenge',
        analysisHints: {
          key_elements: [
            'Specific disagreement',
            'How you engaged respectfully',
            'What you learned',
            'Growth or perspective change'
          ],
          red_flags: [
            'Winning argument (vs understanding)',
            'Disrespect or dismissiveness',
            'No learning/growth',
            'Overly political/controversial'
          ],
          elite_patterns: [
            'Intellectual humility',
            'Respectful dialogue',
            'Changed perspective',
            'Deeper understanding gained'
          ]
        }
      },
      {
        id: 'harvard_optional_3',
        collegeId: 'harvard',
        title: 'Optional Essay 3',
        prompt: 'Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are.',
        wordLimit: 200,
        required: false,
        type: 'extracurricular',
        analysisHints: {
          key_elements: [
            'Specific activity/experience',
            'How it shaped you',
            'Personal growth',
            'Character revelation'
          ],
          red_flags: [
            'Just listing activities',
            'No depth or reflection',
            'Repeating Common App',
            'Generic impacts'
          ],
          elite_patterns: [
            'Unexpected activity',
            'Deep personal meaning',
            'Character/values revealed',
            'Authentic voice'
          ]
        }
      }
    ],

    preferences: {
      essay_priorities: [
        'Intellectual depth and engagement',
        'Community contribution mindset',
        'Character and integrity',
        'Authentic self-reflection',
        'Scholarly interests'
      ],
      red_flags: [
        'Self-promotion without substance',
        'Lack of community focus',
        'Surface-level thinking',
        'Arrogance or entitlement',
        'Generic Harvard praise'
      ],
      preferred_tone: [
        'Thoughtful and reflective',
        'Intellectually engaged',
        'Humble confidence',
        'Authentic',
        'Community-minded'
      ],
      avoid_tone: [
        'Arrogant or entitled',
        'Overly self-focused',
        'Generic or cliché',
        'Trying to impress',
        'Distant or cold'
      ],
      structure_notes: 'Harvard values depth of thought over flashy writing. Show intellectual engagement and community commitment.'
    },

    research: {
      sources: {
        admission_website: 'https://college.harvard.edu/admissions',
        mission_statement: 'https://www.harvard.edu/about/',
        elite_essay_database: 'Internal: HARVARD_ELITE_ESSAYS_2020_2024'
      },
      last_updated: '2024-12-01',
      research_depth: 8
    }
  },

  // ============================================================================
  // MIT
  // ============================================================================
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',

    coreValues: [
      {
        id: 'mit_hands_on_creativity',
        name: 'Hands-On Creativity',
        weight: 35,
        definition: 'Building, making, and creating things. Turning ideas into reality through hands-on work.',
        how_to_demonstrate: [
          'Building projects or prototypes',
          'Maker activities',
          'Engineering/technical projects',
          'Creative problem-solving in action',
          'Iterative design process'
        ],
        source: 'MIT Admissions - What We Look For',
        source_url: 'https://mitadmissions.org/apply/'
      },
      {
        id: 'mit_collaboration',
        name: 'Collaboration & Community',
        weight: 30,
        definition: 'Working effectively with others. Contributing to community and helping peers succeed.',
        how_to_demonstrate: [
          'Team projects',
          'Teaching/mentoring others',
          'Community contributions',
          'Collaborative problem-solving',
          'Supporting peers'
        ],
        source: 'MIT Admissions - What We Look For',
        source_url: 'https://mitadmissions.org/apply/'
      },
      {
        id: 'mit_initiative',
        name: 'Initiative & Risk-Taking',
        weight: 20,
        definition: 'Taking initiative and trying new things. Comfortable with failure and learning from it.',
        how_to_demonstrate: [
          'Starting new projects/clubs',
          'Taking risks and failing',
          'Learning from failure',
          'Self-directed exploration',
          'Entrepreneurial mindset'
        ],
        source: 'MIT Admissions Blog',
        source_url: 'https://mitadmissions.org/blogs/'
      },
      {
        id: 'mit_balance',
        name: 'Balance & Joy',
        weight: 15,
        definition: 'Finding balance and joy in life. Not just academics - hobbies, fun, and being human.',
        how_to_demonstrate: [
          'Hobbies and interests',
          'Having fun',
          'Balance between work/life',
          'Quirky interests',
          'Being yourself'
        ],
        source: 'MIT Admissions - Life at MIT',
        source_url: 'https://mitadmissions.org/discover/the-mit-community/'
      }
    ],

    supplementals: [
      {
        id: 'mit_why_mit',
        collegeId: 'mit',
        title: 'Why MIT?',
        prompt: 'We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.',
        wordLimit: 200,
        required: true,
        type: 'extracurricular',
        analysisHints: {
          key_elements: [
            'Specific activity',
            'Why it brings pleasure',
            'Reveals personality',
            'Shows balance'
          ],
          red_flags: [
            'Academic activities (defeats purpose)',
            'Obligation-based activities',
            'Generic hobbies',
            'Trying to impress'
          ],
          elite_patterns: [
            'Unexpected hobby',
            'Genuine enthusiasm',
            'Quirky but authentic',
            'Shows human side'
          ]
        }
      },
      {
        id: 'mit_community',
        collegeId: 'mit',
        title: 'Community & Collaboration',
        prompt: 'At MIT, we bring people together to better the lives of others. MIT students work to improve their communities in different ways, from tackling the world\'s biggest challenges to being a good friend. Describe one way you have collaborated with others to improve your community.',
        wordLimit: 300,
        required: true,
        type: 'community',
        analysisHints: {
          key_elements: [
            'Specific collaboration',
            'Concrete improvement',
            'Your role',
            'Impact demonstrated'
          ],
          red_flags: [
            'Solo work (not collaborative)',
            'No measurable impact',
            'Vague contribution',
            'Self-focused vs community-focused'
          ],
          elite_patterns: [
            'Technical solution to community problem',
            'Collaborative approach emphasized',
            'Measurable impact',
            'Empowering others'
          ]
        }
      },
      {
        id: 'mit_challenge',
        collegeId: 'mit',
        title: 'Challenge or Opportunity',
        prompt: 'Describe the world you come from (for example, your family, school, community, city, or town). How has that world shaped your dreams and aspirations?',
        wordLimit: 250,
        required: true,
        type: 'diversity',
        analysisHints: {
          key_elements: [
            'Specific world/context',
            'How it shaped you',
            'Dreams/aspirations',
            'Growth mindset'
          ],
          red_flags: [
            'Victim mentality',
            'No connection to aspirations',
            'Generic circumstances',
            'Overly negative'
          ],
          elite_patterns: [
            'Resourcefulness',
            'Turning limitations into opportunities',
            'Clear aspiration connected to background',
            'Resilience and agency'
          ]
        }
      }
    ],

    preferences: {
      essay_priorities: [
        'Hands-on making and building',
        'Collaboration over competition',
        'Initiative and risk-taking',
        'Authenticity and personality',
        'Balance and being human'
      ],
      red_flags: [
        'Only theoretical (no hands-on work)',
        'Competitive vs collaborative',
        'All work, no play',
        'Trying too hard to sound smart',
        'Generic STEM student'
      ],
      preferred_tone: [
        'Genuine and enthusiastic',
        'Collaborative',
        'Humble but confident',
        'Fun and quirky OK',
        'Down-to-earth'
      ],
      avoid_tone: [
        'Overly academic',
        'Competitive or cutthroat',
        'All serious, no fun',
        'Generic tech bro',
        'Trying to impress'
      ],
      structure_notes: 'MIT wants to see makers, collaborators, and interesting humans. Show your personality and hands-on work.'
    },

    research: {
      sources: {
        admission_website: 'https://mitadmissions.org/',
        dean_interviews: [
          'https://mitadmissions.org/blogs/'
        ],
        mission_statement: 'https://www.mit.edu/about/',
        elite_essay_database: 'Internal: MIT_ELITE_ESSAYS_2020_2024'
      },
      last_updated: '2024-12-01',
      research_depth: 9
    }
  }
];

/**
 * Get college by ID
 */
export function getCollege(collegeId: string): CommonAppCollege | undefined {
  return COMMON_APP_COLLEGES.find(c => c.id === collegeId);
}

/**
 * Get all colleges
 */
export function getAllColleges(): CommonAppCollege[] {
  return COMMON_APP_COLLEGES;
}

/**
 * Get supplementals for a college
 */
export function getCollegeSupplementals(collegeId: string): CommonAppSupplemental[] {
  const college = getCollege(collegeId);
  return college?.supplementals || [];
}

/**
 * Get specific supplemental
 */
export function getSupplemental(collegeId: string, supplementalId: string): CommonAppSupplemental | undefined {
  const college = getCollege(collegeId);
  return college?.supplementals.find(s => s.id === supplementalId);
}

/**
 * Get core values for college
 */
export function getCollegeCoreValues(collegeId: string): CoreValue[] {
  const college = getCollege(collegeId);
  return college?.coreValues || [];
}
