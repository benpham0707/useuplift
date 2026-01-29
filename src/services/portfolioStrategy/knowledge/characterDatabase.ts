/**
 * Character Evidence Calibration Database
 *
 * Concrete, calibrated examples for each of the 7 character dimensions
 * with Harvard 1-6 scoring. This enables accurate assessment of ANY
 * student's character evidence by pattern matching to calibration examples.
 */

// ============================================================================
// INTELLECTUAL VITALITY CALIBRATION
// ============================================================================

export const INTELLECTUAL_VITALITY_CALIBRATION = {
  dimension: 'intellectual_vitality',
  harvardName: 'Academic/Intellectual',
  description: 'Genuine intellectual curiosity that extends beyond grades and requirements',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Transformative intellectual engagement that has already made impact',
      percentile: 'Top 1%',
      examples: [
        {
          description: 'Self-taught quantum computing in 10th grade, developed novel algorithm for optimization problems, paper under review at student journal',
          evidence_markers: ['Self-directed mastery of advanced topic', 'Original contribution', 'Publication-level output'],
        },
        {
          description: 'Created philosophy podcast interviewing professional philosophers, 50K subscribers, cited in academic papers',
          evidence_markers: ['Deep engagement with ideas', 'Created platform for discourse', 'Recognized by field'],
        },
        {
          description: 'Learned 4 programming languages independently, built tools used by 10K+ developers, contributes to open source',
          evidence_markers: ['Autodidact', 'Created value for others', 'Ongoing engagement'],
        },
      ],
      requirements: [
        'Intellectual pursuit that goes far beyond any school requirement',
        'Evidence of original thinking or creation',
        'Recognition or impact from intellectual work',
        'Deep, sustained engagement (years, not months)',
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Clear intellectual passion with evidence of depth and initiative',
      percentile: 'Top 5%',
      examples: [
        {
          description: 'Read 50+ philosophy books independently, started school philosophy club, leads discussions on complex topics',
          evidence_markers: ['Self-directed reading', 'Created intellectual community', 'Engaged with complex ideas'],
        },
        {
          description: 'Completed MIT OpenCourseWare in machine learning, built 3 ML projects, presented at school symposium',
          evidence_markers: ['College-level self-study', 'Applied learning', 'Shared knowledge'],
        },
        {
          description: 'Fascinated by linguistics, learned 2 languages to fluency through immersion, wrote thesis on language evolution',
          evidence_markers: ['Unusual intellectual interest', 'Deep pursuit', 'Produced substantial work'],
        },
      ],
      requirements: [
        'Clear intellectual interest pursued beyond curriculum',
        'Evidence of sustained engagement (2+ years)',
        'Depth of knowledge in area of interest',
        'Initiative to learn independently',
      ],
    },

    3: {
      label: 'Strong',
      description: 'Intellectual curiosity evident with some initiative beyond requirements',
      percentile: 'Top 15%',
      examples: [
        {
          description: 'Takes all available AP courses, asks sophisticated questions in class, reads non-fiction for pleasure',
          evidence_markers: ['Maximum rigor', 'Engaged in class', 'Some independent reading'],
        },
        {
          description: 'Participates actively in math team, curious about proofs and theory beyond competition problems',
          evidence_markers: ['Academic EC', 'Curiosity about fundamentals', 'Goes beyond requirements'],
        },
        {
          description: 'Wrote history research paper that exceeded expectations, pursued primary sources independently',
          evidence_markers: ['Exceeded assignment', 'Independent research', 'Genuine interest'],
        },
      ],
      requirements: [
        'Maximizes academic opportunities',
        'Shows curiosity in class or discussions',
        'Some evidence of interest beyond grades',
      ],
    },

    4: {
      label: 'Good',
      description: 'Adequate intellectual engagement, primarily grade-focused',
      percentile: 'Top 30%',
      examples: [
        {
          description: 'Takes AP courses to be competitive, does well, but doesn\'t pursue subjects outside class',
          evidence_markers: ['Strategic course selection', 'Good performance', 'Limited independent pursuit'],
        },
        {
          description: 'Participates in academic clubs for college application, doesn\'t discuss ideas outside meetings',
          evidence_markers: ['EC participation', 'Resume-oriented', 'Transactional engagement'],
        },
      ],
      requirements: [
        'Takes challenging courses',
        'Performs adequately',
        'Limited evidence of genuine curiosity',
      ],
    },

    5: {
      label: 'Average',
      description: 'Minimal intellectual engagement beyond requirements',
      percentile: 'Average',
      examples: [
        {
          description: 'Takes required courses, does enough to get good grades, no evidence of intellectual interests',
          evidence_markers: ['Minimum necessary', 'Grade-focused only'],
        },
      ],
    },

    6: {
      label: 'Concerning',
      description: 'No intellectual curiosity evident, possible disengagement',
      percentile: 'Below average',
      examples: [
        {
          description: 'Avoids challenging courses, essays are generic, no evidence of any intellectual interests',
          evidence_markers: ['Avoidance of challenge', 'Generic responses', 'No curiosity evident'],
        },
      ],
    },
  },

  detection_questions: [
    'What does this student learn about that they don\'t have to?',
    'Do they ask interesting questions or just answer them?',
    'Is there evidence of intellectual life outside school?',
    'Would they be interesting to talk to about ideas?',
  ],
};

// ============================================================================
// LEADERSHIP QUALITY CALIBRATION
// ============================================================================

export const LEADERSHIP_QUALITY_CALIBRATION = {
  dimension: 'leadership_quality',
  harvardName: 'Extracurricular/Leadership',
  description: 'Ability to influence, inspire, and make things happen—not just hold titles',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Transformative leadership with measurable, significant impact',
      examples: [
        {
          description: 'Founded youth advocacy organization, lobbied state legislature, got bill passed affecting 500K students',
          evidence_markers: ['Created organization', 'Influenced policy', 'Massive scale impact'],
          impact_metrics: { people_affected: 500000, systems_changed: true },
        },
        {
          description: 'Turned around failing school newspaper, grew readership 10x, won national awards, paper now self-sustaining',
          evidence_markers: ['Transformed existing organization', 'Measurable growth', 'Lasting impact'],
          impact_metrics: { growth: '10x', recognition: 'national' },
        },
        {
          description: 'Led community response to local crisis, coordinated 200 volunteers, raised $100K, cited by mayor',
          evidence_markers: ['Crisis leadership', 'Mobilized large team', 'Community recognition'],
          impact_metrics: { volunteers: 200, funds: 100000 },
        },
      ],
      requirements: [
        'Led initiative that created significant, measurable change',
        'Others clearly followed their vision',
        'Impact persists beyond their involvement',
        'Recognition at regional/national level',
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Clear leadership with meaningful, measurable impact',
      examples: [
        {
          description: 'As student body president, established mental health support program now used by entire district',
          evidence_markers: ['Elected leadership', 'Created lasting program', 'Scaled beyond school'],
          impact_metrics: { schools_affected: 10, program_ongoing: true },
        },
        {
          description: 'Varsity captain who led team culture turnaround, implemented new training system, team went from losing to state championship',
          evidence_markers: ['Athletic leadership', 'Changed culture', 'Clear results'],
          impact_metrics: { performance_improvement: 'losing_to_champion' },
        },
        {
          description: 'Founded tutoring program serving 150 students, recruited 30 volunteers, program continues after graduation',
          evidence_markers: ['Created service program', 'Built team', 'Sustainable'],
          impact_metrics: { students_served: 150, volunteers: 30 },
        },
      ],
      requirements: [
        'Led initiative with clear, positive outcomes',
        'Built or transformed a team/organization',
        'Impact is measurable and meaningful',
        'Others recognize their leadership',
      ],
    },

    3: {
      label: 'Strong',
      description: 'Leadership positions with some demonstrated initiative',
      examples: [
        {
          description: 'Club president who organized successful events, increased membership 50%, but organization unchanged',
          evidence_markers: ['Leadership position', 'Some growth', 'Limited transformation'],
        },
        {
          description: 'Team captain who managed team dynamics well, players respected, but no major changes made',
          evidence_markers: ['Athletic leadership', 'Respected', 'Maintained status quo'],
        },
        {
          description: 'Editor of literary magazine, improved submission quality, added new section',
          evidence_markers: ['Editorial leadership', 'Some improvements', 'Incremental change'],
        },
      ],
      requirements: [
        'Holds meaningful leadership position',
        'Some evidence of initiative or improvement',
        'Others follow their lead in limited context',
      ],
    },

    4: {
      label: 'Good',
      description: 'Leadership positions without clear impact or initiative',
      examples: [
        {
          description: 'Club officer who attends meetings and does assigned tasks, no independent initiatives',
          evidence_markers: ['Title', 'Participation', 'No initiative'],
        },
        {
          description: 'Section leader in band, good at part, doesn\'t take initiative beyond role',
          evidence_markers: ['Position', 'Competent', 'Limited scope'],
        },
      ],
    },

    5: {
      label: 'Average',
      description: 'Participation without leadership',
      examples: [
        {
          description: 'Club member who attends regularly but never takes initiative',
          evidence_markers: ['Participation only'],
        },
      ],
    },

    6: {
      label: 'Concerning',
      description: 'No leadership evidence or concerning patterns',
      examples: [
        {
          description: 'Multiple titles but no evidence of actually doing anything, possible title inflation',
          evidence_markers: ['Titles without substance', 'Pattern of claiming without evidence'],
        },
      ],
      red_flags: ['Titles without action', 'Others don\'t mention leadership in recs'],
    },
  },

  detection_questions: [
    'What did this student actually DO, not just their title?',
    'Did anything change because of their leadership?',
    'Would the organization be different without them?',
    'Do others specifically mention following their lead?',
  ],
};

// ============================================================================
// COMMUNITY IMPACT CALIBRATION
// ============================================================================

export const COMMUNITY_IMPACT_CALIBRATION = {
  dimension: 'community_impact',
  harvardName: 'Personal Qualities (Contribution)',
  description: 'Genuine contribution to communities—not voluntourism or resume padding',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Created sustainable change that transformed a community',
      examples: [
        {
          description: 'Identified lack of CS education in rural area, created curriculum, trained teachers, now 5000 students learning to code',
          impact_metrics: { people_affected: 5000, systems_changed: true, sustained: true },
        },
        {
          description: 'Started food rescue program connecting restaurants to shelters, diverted 50K meals from waste, model replicated in 3 cities',
          impact_metrics: { meals: 50000, replication: true },
        },
        {
          description: 'Advocated for accessibility in local parks, worked with city council, resulted in $500K investment in accessible facilities',
          impact_metrics: { policy_change: true, investment: 500000 },
        },
      ],
      requirements: [
        'Created sustainable solution to real problem',
        'Impact measured in thousands affected',
        'Changed systems or policies',
        'Work continued by others',
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Significant, sustained impact on specific community',
      examples: [
        {
          description: 'Volunteered at same homeless shelter for 3 years, trained to become shift lead, personally helped 50 individuals with job applications',
          impact_metrics: { years: 3, individuals_helped: 50, relationship_depth: 'deep' },
        },
        {
          description: 'Organized annual community health fair, 2000 attendees, connected 500 people to healthcare',
          impact_metrics: { event_scale: 2000, direct_help: 500 },
        },
        {
          description: 'Tutored same group of 10 refugee students for 2 years, all improved 2 grade levels in English',
          impact_metrics: { sustained_relationship: true, measurable_outcome: true },
        },
      ],
      requirements: [
        'Multi-year sustained commitment',
        'Specific, measurable outcomes',
        'Deep relationship with community served',
        'Clear evidence of impact',
      ],
    },

    3: {
      label: 'Strong',
      description: 'Consistent service with some measurable impact',
      examples: [
        {
          description: 'Regular volunteer at food bank for 2 years, helped serve 200 families monthly',
          impact_metrics: { consistency: true, scale: 'moderate' },
        },
        {
          description: 'Organized school supply drive, collected 500 backpacks for underprivileged students',
          impact_metrics: { tangible_output: 500 },
        },
      ],
      requirements: [
        'Regular, sustained commitment (1+ years)',
        'Some evidence of impact',
        'Genuine engagement with cause',
      ],
    },

    4: {
      label: 'Good',
      description: 'Service without significant impact or depth',
      examples: [
        {
          description: 'Volunteers occasionally at various organizations, 50 hours total',
          impact_metrics: { hours: 50, depth: 'shallow' },
        },
        {
          description: 'Participates in school service events when required',
        },
      ],
    },

    5: {
      label: 'Average',
      description: 'Minimal service, primarily for requirements',
      examples: [
        {
          description: 'Completed required service hours with minimal engagement',
        },
      ],
    },

    6: {
      label: 'Concerning',
      description: 'No service or concerning patterns (voluntourism)',
      examples: [
        {
          description: 'Week-long mission trip presented as major service accomplishment',
          red_flags: ['Short duration', 'Expensive trip', 'No follow-up'],
        },
        {
          description: 'Claims extensive service but no specific people helped or outcomes described',
          red_flags: ['Vague claims', 'No specifics'],
        },
      ],
    },
  },

  red_flags: [
    'Mission trips or voluntourism as primary service',
    'Focus on hours rather than impact',
    'Service completely disconnected from interests',
    'Cannot name specific people helped',
    'Service started in junior/senior year',
  ],
};

// ============================================================================
// PERSONAL GROWTH & RESILIENCE CALIBRATION
// ============================================================================

export const PERSONAL_GROWTH_CALIBRATION = {
  dimension: 'personal_growth',
  harvardName: 'Personal Qualities (Character)',
  description: 'Self-awareness, response to adversity, and capacity for growth',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Profound growth through significant adversity with remarkable self-awareness',
      examples: [
        {
          description: 'Overcame homelessness in sophomore year, maintained grades, now advocates for homeless youth and counsels others',
          adversity_level: 'severe',
          response: 'transcendent',
          growth_evidence: 'Now helps others in same situation',
        },
        {
          description: 'Failed first major competition, analyzed why honestly, changed approach, won nationals two years later',
          adversity_level: 'meaningful_failure',
          response: 'systematic_improvement',
          self_awareness: 'Articulates specific lessons',
        },
        {
          description: 'Immigrated at 14 knowing no English, documents learning process with remarkable honesty about struggles',
          adversity_level: 'significant',
          response: 'persistent',
          self_awareness: 'Vulnerable and honest',
        },
      ],
      requirements: [
        'Faced significant, genuine adversity',
        'Responded with resilience AND growth',
        'Demonstrates profound self-awareness',
        'Vulnerable and honest about struggles',
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Clear growth through meaningful challenges with genuine reflection',
      examples: [
        {
          description: 'Parents\' divorce in junior year, grades dropped, then rebuilt, essay reflects honestly on impact',
          adversity_level: 'moderate_to_significant',
          response: 'recovered_with_insight',
        },
        {
          description: 'Chronic illness managed while maintaining activities, openly discusses limitations and adaptations',
          adversity_level: 'ongoing',
          self_awareness: 'Realistic about challenges',
        },
        {
          description: 'Was a "mean girl" in 9th grade, recognized it, changed behavior, now advocates against bullying',
          adversity_level: 'self-created',
          growth_evidence: 'Behavioral change + action',
        },
      ],
      requirements: [
        'Faced meaningful challenge',
        'Shows genuine growth and learning',
        'Demonstrates self-awareness',
        'Can articulate what changed',
      ],
    },

    3: {
      label: 'Strong',
      description: 'Some evidence of growth and self-awareness',
      examples: [
        {
          description: 'Struggled with public speaking, took specific steps to improve, now comfortable leading meetings',
          growth_area: 'Specific skill',
          evidence: 'Clear before/after',
        },
        {
          description: 'Recognizes pattern of overcommitting, discusses learning to set boundaries',
          self_awareness: 'Recognizes own patterns',
        },
      ],
      requirements: [
        'Some evidence of learning from experience',
        'Basic self-awareness',
        'Can articulate at least one meaningful growth',
      ],
    },

    4: {
      label: 'Good',
      description: 'Limited evidence of growth or reflection',
      examples: [
        {
          description: 'Generic "learned to work hard" or "learned time management"',
          concern: 'Common, not distinctive',
        },
      ],
    },

    5: {
      label: 'Average',
      description: 'No evidence of self-reflection or growth',
      examples: [
        {
          description: 'Every essay is about accomplishments, no vulnerability or growth',
        },
      ],
    },

    6: {
      label: 'Concerning',
      description: 'Concerning patterns in how adversity is described',
      examples: [
        {
          description: 'Blames others for all failures, no accountability',
          red_flag: 'No self-awareness',
        },
        {
          description: 'Manufactures trivial "adversity" (e.g., "struggle" of learning to drive)',
          red_flag: 'Inappropriate framing',
        },
      ],
    },
  },

  red_flags: [
    'Manufactured adversity that trivializes real struggle',
    'No evidence of learning from failures',
    'Blames others consistently',
    'Every story ends with victory, no vulnerability',
  ],
};

// ============================================================================
// RESILIENCE & GRIT CALIBRATION
// ============================================================================

export const RESILIENCE_GRIT_CALIBRATION = {
  dimension: 'resilience_grit',
  harvardName: 'Personal Qualities (Perseverance)',
  description: 'Sustained effort toward long-term goals despite obstacles',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Multi-year pursuit of difficult goal with major obstacles overcome',
      examples: [
        {
          description: '7 years of competitive swimming despite chronic injury, adapted training, won state after 3 years of setbacks',
          duration: 7,
          obstacles: 'chronic_injury',
          outcome: 'eventual_success',
        },
        {
          description: 'Failed USACO bronze 4 times, persisted, eventually reached Platinum over 3 years',
          duration: 3,
          obstacles: 'repeated_failure',
          outcome: 'success_after_persistence',
        },
        {
          description: 'Built startup that failed twice, learned from each failure, third attempt succeeded with 10K users',
          obstacles: 'multiple_failures',
          learning: 'Specific improvements each iteration',
        },
      ],
      requirements: [
        'Multi-year commitment to difficult goal',
        'Overcame significant obstacles',
        'Continued after failure',
        'Evidence of sustained effort over time',
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Sustained effort over multiple years with some obstacles overcome',
      examples: [
        {
          description: '4-year commitment to instrument, daily practice, achieved All-State senior year',
          duration: 4,
          effort: 'daily',
        },
        {
          description: 'Worked part-time job throughout high school to help family, maintained grades',
          duration: 4,
          sacrifice: true,
        },
        {
          description: 'Trained for marathon despite no running background, completed in 2 years',
          duration: 2,
          starting_point: 'none',
        },
      ],
    },

    3: {
      label: 'Strong',
      description: 'Consistent multi-year commitments',
      examples: [
        {
          description: 'Same sport or activity for 4 years with progression',
          duration: 4,
        },
        {
          description: 'Completed challenging long-term project (research, art portfolio, etc.)',
        },
      ],
    },

    4: {
      label: 'Good',
      description: 'Some sustained commitments but limited evidence of persistence through difficulty',
      examples: [
        {
          description: 'Multiple activities for 2+ years each',
        },
      ],
    },

    5: {
      label: 'Average',
      description: 'Pattern of short-term involvement',
      examples: [
        {
          description: 'Many activities started and stopped within a year',
        },
      ],
    },

    6: {
      label: 'Concerning',
      description: 'Clear pattern of quitting when challenged',
      examples: [
        {
          description: 'Drops activities whenever they become competitive or difficult',
          red_flag: 'Avoidance pattern',
        },
      ],
    },
  },
};

// ============================================================================
// CREATIVITY & INNOVATION CALIBRATION
// ============================================================================

export const CREATIVITY_INNOVATION_CALIBRATION = {
  dimension: 'creativity_innovation',
  harvardName: 'Personal Qualities (Originality)',
  description: 'Original thinking, creative problem-solving, and willingness to innovate',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Created something genuinely original that others use or recognize',
      examples: [
        {
          description: 'Invented new approach to common problem, now used by thousands',
          originality: 'Novel solution',
          impact: 'Adopted by others',
        },
        {
          description: 'Artistic work with unique voice, recognized at national level',
          originality: 'Unique artistic voice',
          recognition: 'National',
        },
        {
          description: 'Connected disparate fields in way no one had, created new category',
          originality: 'Cross-disciplinary innovation',
        },
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Creative work that shows originality and some recognition',
      examples: [
        {
          description: 'Created art/music/writing with distinctive voice, regional recognition',
        },
        {
          description: 'Built product or tool that solved problem in new way',
        },
        {
          description: 'Research approach that was creative and effective',
        },
      ],
    },

    3: {
      label: 'Strong',
      description: 'Some evidence of creative thinking or original approaches',
      examples: [
        {
          description: 'Art or creative work that shows developing personal style',
        },
        {
          description: 'Solved problems in class or ECs with novel approaches',
        },
      ],
    },

    4: {
      label: 'Good',
      description: 'Creative activities without evidence of originality',
      examples: [
        {
          description: 'Participates in arts but work is derivative',
        },
      ],
    },

    5: {
      label: 'Average',
      description: 'No evidence of creativity',
    },

    6: {
      label: 'Concerning',
      description: 'Patterns suggest lack of original thought',
      examples: [
        {
          description: 'All work seems to follow templates, no personal perspective',
        },
      ],
    },
  },
};

// ============================================================================
// AUTHENTICITY & VOICE CALIBRATION
// ============================================================================

export const AUTHENTICITY_VOICE_CALIBRATION = {
  dimension: 'authenticity_voice',
  harvardName: 'Personal Qualities (Genuineness)',
  description: 'Genuine self-expression, coherent identity, and authentic motivation',

  scoring_levels: {
    1: {
      label: 'Exceptional',
      description: 'Unmistakably authentic, coherent identity, could only be this person',
      markers: [
        'Activities clearly driven by genuine passion, not strategy',
        'Coherent narrative that couldn\'t belong to anyone else',
        'Essays with unique voice that jumps off the page',
        'Motivations that clearly come from lived experience',
        'Specific details that could only come from doing it',
      ],
      examples: [
        {
          description: 'Essay about collecting vintage typewriters connects to love of writing, community built around interest, specific stories that only they could tell',
          authenticity_signals: ['Unusual interest', 'Deep knowledge', 'Community', 'Specific details'],
        },
        {
          description: 'All activities connect to theme of accessibility advocacy, started because of sibling with disability, specific policy changes made',
          authenticity_signals: ['Personal motivation', 'Coherent theme', 'Specific impact'],
        },
      ],
    },

    2: {
      label: 'Outstanding',
      description: 'Clearly genuine with coherent identity and authentic voice',
      markers: [
        'Most activities reflect genuine interests',
        'Narrative is coherent and believable',
        'Essays show personality',
        'Motivations ring true',
      ],
    },

    3: {
      label: 'Strong',
      description: 'Mostly authentic with some coherence',
      markers: [
        'Some activities clearly genuine',
        'Basic coherent narrative',
        'Some personality in essays',
      ],
    },

    4: {
      label: 'Good',
      description: 'Mixed signals on authenticity',
      markers: [
        'Some activities seem genuine, others strategic',
        'Narrative is somewhat generic',
        'Essays are competent but not distinctive',
      ],
    },

    5: {
      label: 'Average',
      description: 'Generic profile without distinctive identity',
      markers: [
        'Could be many similar applicants',
        'No clear narrative emerges',
        'Essays could have been written by anyone',
      ],
    },

    6: {
      label: 'Concerning',
      description: 'Appears packaged or inauthentic',
      markers: [
        'Activities seem chosen for admissions',
        'Essays read like consultant-written',
        'Interests don\'t connect or cohere',
        'Everything feels calculated',
      ],
      red_flags: [
        'Multiple "founded" organizations with no substance',
        'Interests that contradict each other',
        'Essay voice doesn\'t match test scores or other writing',
        'Recommendations don\'t match self-presentation',
      ],
    },
  },

  authenticity_tests: {
    two_sentence_test: 'Can you summarize this student compellingly in two sentences that couldn\'t describe anyone else?',
    dinner_test: 'Would you want to have dinner with this person?',
    follow_up_test: 'If you asked about any activity, could they talk about it for 20 minutes with enthusiasm?',
    removal_test: 'If you removed their name, would you know this was them?',
  },
};

// ============================================================================
// COMPOSITE CHARACTER SCORING FUNCTION
// ============================================================================

export interface CharacterEvidence {
  intellectual_vitality: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  leadership_quality: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  community_impact: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  personal_growth: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  resilience_grit: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  creativity_innovation: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
  authenticity_voice: {
    score: number;
    evidence: string[];
    matchedExamples?: string[];
  };
}

export interface CompositeCharacterResult {
  overallScore: number;
  dimensionScores: CharacterEvidence;
  strengthDimensions: string[];
  weakDimensions: string[];
  redFlags: string[];
  narrativeCoherence: number;
  twoSentencePitch: string;
  aoAssessment: string;
}

export const CHARACTER_DIMENSION_WEIGHTS = {
  intellectual_vitality: 0.18,
  leadership_quality: 0.16,
  community_impact: 0.14,
  personal_growth: 0.14,
  resilience_grit: 0.12,
  creativity_innovation: 0.12,
  authenticity_voice: 0.14,
};

export function calculateCompositeCharacterScore(evidence: CharacterEvidence): CompositeCharacterResult {
  let weightedSum = 0;
  const strengthDimensions: string[] = [];
  const weakDimensions: string[] = [];
  const redFlags: string[] = [];

  for (const [dimension, weight] of Object.entries(CHARACTER_DIMENSION_WEIGHTS)) {
    const dimEvidence = evidence[dimension as keyof CharacterEvidence];
    weightedSum += dimEvidence.score * weight;

    if (dimEvidence.score <= 2) {
      strengthDimensions.push(dimension);
    } else if (dimEvidence.score >= 5) {
      weakDimensions.push(dimension);
    }
  }

  // Authenticity affects all other dimensions
  if (evidence.authenticity_voice.score >= 5) {
    redFlags.push('Low authenticity score may undermine other dimensions');
    weightedSum += 0.5; // Penalty
  }

  const overallScore = Math.round(weightedSum * 10) / 10;

  return {
    overallScore: Math.max(1, Math.min(6, overallScore)),
    dimensionScores: evidence,
    strengthDimensions,
    weakDimensions,
    redFlags,
    narrativeCoherence: evidence.authenticity_voice.score,
    twoSentencePitch: '', // To be generated by LLM
    aoAssessment: overallScore <= 2 ? 'Exceptional candidate with strong character evidence' :
                  overallScore <= 3 ? 'Strong candidate with positive character signals' :
                  overallScore <= 4 ? 'Competitive candidate with adequate character evidence' :
                  'Character evidence needs strengthening',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const characterDatabase = {
  INTELLECTUAL_VITALITY_CALIBRATION,
  LEADERSHIP_QUALITY_CALIBRATION,
  COMMUNITY_IMPACT_CALIBRATION,
  PERSONAL_GROWTH_CALIBRATION,
  RESILIENCE_GRIT_CALIBRATION,
  CREATIVITY_INNOVATION_CALIBRATION,
  AUTHENTICITY_VOICE_CALIBRATION,
  CHARACTER_DIMENSION_WEIGHTS,
  calculateCompositeCharacterScore,
};
