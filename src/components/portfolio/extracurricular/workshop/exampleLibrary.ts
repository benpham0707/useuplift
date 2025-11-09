/**
 * Elite Essay Example Library
 *
 * Curated database of before/after patterns from admitted students at:
 * - Tier 1: Harvard, MIT, Stanford, Yale, Princeton, Caltech
 * - Tier 2: UC Berkeley, UCLA, Top Ivies, UChicago
 * - Tier 3: Competitive schools
 *
 * Used to teach writing principles through real examples, not generic advice.
 *
 * Sources: Session 18 research, admitted student essay analysis
 */

import type { EliteEssayExample, ExampleLibrary } from './teachingTypes';

// ============================================================================
// QUANTIFIED IMPACT EXAMPLES
// ============================================================================

const QUANTIFIED_IMPACT_EXAMPLES: EliteEssayExample[] = [
  {
    context: 'Community Service - Harvard admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'I helped many families in need and made a big impact on the community.',
      problems: [
        'Vague scale ("many families")',
        'Generic claim ("big impact")',
        'No concrete outcomes',
        'Could apply to anyone'
      ]
    },
    after: {
      text: 'I served 47 families across 3 neighborhoods, distributing 2,800 lbs of food weekly through our mobile pantry program.',
      score_improvement: '+4 points'
    },
    annotations: [
      {
        highlight: '47 families',
        explanation: 'Specific, plausible number establishes real scale',
        principle: 'Use exact counts for people served'
      },
      {
        highlight: '3 neighborhoods',
        explanation: 'Geographic scope makes impact tangible',
        principle: 'Define the boundaries of your work'
      },
      {
        highlight: '2,800 lbs',
        explanation: 'Concrete unit creates vivid mental image',
        principle: 'Use specific units (lbs, hours, dollars)'
      },
      {
        highlight: 'weekly',
        explanation: 'Timeframe shows sustained commitment',
        principle: 'Always include frequency or duration'
      }
    ],
    success_factors: [
      'Multiple metrics reinforce each other',
      'Numbers are specific but believable',
      'Concrete details replace abstract claims',
      'Easy to visualize the actual work'
    ]
  },

  {
    context: 'Research - MIT admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'I made significant progress on the machine learning project and improved the model\'s performance.',
      problems: [
        'Vague progress ("significant")',
        'No baseline for comparison',
        'Improvement amount unclear',
        'Can\'t verify claim'
      ]
    },
    after: {
      text: 'I analyzed 15,000 data points across 6 months, identifying 3 novel patterns that reduced error rate from 23% to 8%.',
      score_improvement: '+5 points'
    },
    annotations: [
      {
        highlight: '15,000 data points',
        explanation: 'Scale of work immediately clear',
        principle: 'Quantify the input/effort'
      },
      {
        highlight: 'across 6 months',
        explanation: 'Sustained intellectual commitment',
        principle: 'Duration signals depth'
      },
      {
        highlight: '3 novel patterns',
        explanation: 'Specific discoveries (countable)',
        principle: 'Make insights concrete'
      },
      {
        highlight: '23% to 8%',
        explanation: 'Before/after with precise improvement',
        principle: 'Always show the delta'
      }
    ],
    success_factors: [
      'Combines scale, time, and outcomes',
      'Technical specificity without jargon',
      'Clear impact measurement',
      'Shows systematic methodology'
    ]
  },

  {
    context: 'Leadership - Stanford admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'As club president, I grew the organization significantly and reached more students than ever before.',
      problems: [
        'Vague growth ("significantly")',
        'Comparative without baseline',
        'No mechanism explained',
        'Missing concrete actions'
      ]
    },
    after: {
      text: 'I expanded membership from 12 to 73 students, launching 4 specialized tracks that reached 200+ freshmen across campus.',
      score_improvement: '+4 points'
    },
    annotations: [
      {
        highlight: 'from 12 to 73',
        explanation: '6x growth with exact numbers',
        principle: 'Show before AND after'
      },
      {
        highlight: '4 specialized tracks',
        explanation: 'Specific structural changes made',
        principle: 'Name what you built'
      },
      {
        highlight: '200+ freshmen',
        explanation: 'Broader ripple effect measured',
        principle: 'Track downstream impact'
      },
      {
        highlight: 'across campus',
        explanation: 'Scope beyond immediate group',
        principle: 'Show reach beyond core team'
      }
    ],
    success_factors: [
      'Dramatic growth with exact figures',
      'Explains mechanism (tracks)',
      'Multiple levels of impact',
      'Demonstrates strategic thinking'
    ]
  }
];

// ============================================================================
// VULNERABILITY EXAMPLES
// ============================================================================

const VULNERABILITY_EXAMPLES: EliteEssayExample[] = [
  {
    context: 'Robotics - Caltech admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'I faced some challenges during the competition and felt nervous about whether we would succeed.',
      problems: [
        'Generic "faced challenges"',
        '"Nervous" is vague emotion',
        'No physical manifestation',
        'Could be anyone\'s experience'
      ]
    },
    after: {
      text: 'My hands trembled against cold aluminum as I stared at 2,847 lines of broken code. Three days until regionals. I was terrified—completely lost in algorithms that looked perfect on paper but kept failing in reality.',
      score_improvement: '+6 points'
    },
    annotations: [
      {
        highlight: 'My hands trembled',
        explanation: 'Physical symptom makes emotion visceral',
        principle: 'Show body\'s response to stress'
      },
      {
        highlight: 'cold aluminum',
        explanation: 'Sensory detail grounds the moment',
        principle: 'Add texture through senses'
      },
      {
        highlight: '2,847 lines',
        explanation: 'Precise number shows real situation',
        principle: 'Specificity = credibility'
      },
      {
        highlight: 'I was terrified',
        explanation: 'Named emotion (not just "nervous")',
        principle: 'Use strong, specific emotions'
      },
      {
        highlight: 'completely lost',
        explanation: 'Admits intellectual confusion',
        principle: 'Vulnerability = honesty about limits'
      }
    ],
    success_factors: [
      'Physical + emotional + intellectual vulnerability',
      'Specific context (code, regionals)',
      'Admits genuine fear and confusion',
      'Sensory details make it real'
    ]
  },

  {
    context: 'Debate - Yale admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'Before my final round, I was worried and unsure if my preparation was enough.',
      problems: [
        '"Worried" is generic',
        'No physical response shown',
        'Vague timing ("before")',
        'Internal only, no external markers'
      ]
    },
    after: {
      text: 'Standing backstage at finals, my stomach churned. I\'d practiced this case for weeks, but watching the previous round—the judges\' stone faces, the brutal cross-examination—I wasn\'t ready. Not for this.',
      score_improvement: '+5 points'
    },
    annotations: [
      {
        highlight: 'my stomach churned',
        explanation: 'Physical symptom of anxiety',
        principle: 'Body language reveals emotion'
      },
      {
        highlight: 'Standing backstage at finals',
        explanation: 'Precise location and stakes',
        principle: 'Set the high-stakes scene'
      },
      {
        highlight: 'stone faces',
        explanation: 'Visual detail creates atmosphere',
        principle: 'Show what you saw'
      },
      {
        highlight: 'I wasn\'t ready. Not for this.',
        explanation: 'Fragment adds emphasis and honesty',
        principle: 'Short sentences = emotional punch'
      }
    ],
    success_factors: [
      'Physical symptom + visual detail',
      'Specific context (finals, judges)',
      'Honest admission of unpreparedness',
      'Rhythm enhances emotion'
    ]
  },

  {
    context: 'Service - Princeton admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'On my first day volunteering, I felt awkward and didn\'t know what to do.',
      problems: [
        '"Awkward" is vague',
        'No scene established',
        'Generic first-day story',
        'Missing vulnerable moment'
      ]
    },
    after: {
      text: 'The first family\'s apartment smelled like mildew and defeat. Mrs. Chen wouldn\'t make eye contact. I stood there, 18 years old with a clipboard, thinking: What can I possibly offer her?',
      score_improvement: '+7 points'
    },
    annotations: [
      {
        highlight: 'smelled like mildew and defeat',
        explanation: 'Sensory + metaphorical description',
        principle: 'Smell anchors memory vividly'
      },
      {
        highlight: 'Mrs. Chen',
        explanation: 'Named individual (not generic "client")',
        principle: 'Name people to show relationships'
      },
      {
        highlight: 'wouldn\'t make eye contact',
        explanation: 'Specific behavior reveals dynamic',
        principle: 'Show interactions, not feelings'
      },
      {
        highlight: 'What can I possibly offer her?',
        explanation: 'Vulnerable internal question',
        principle: 'Self-doubt makes growth believable'
      }
    ],
    success_factors: [
      'Multi-sensory immersion',
      'Names specific person',
      'Shows power dynamic honestly',
      'Question reveals insecurity'
    ]
  }
];

// ============================================================================
// DIALOGUE EXAMPLES
// ============================================================================

const DIALOGUE_EXAMPLES: EliteEssayExample[] = [
  {
    context: 'Mentorship - Brown admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'My mentee improved significantly after I helped him understand the concepts.',
      problems: [
        'No actual conversation',
        'Tells outcome, doesn\'t show process',
        'Generic "helped him understand"',
        'Missing relationship development'
      ]
    },
    after: {
      text: '"This is hopeless," Jake muttered, crumpling his third attempt. I pulled up a chair. "What if we broke it into smaller chunks?" His eyes lit up. "Like… bite-sized?" "Exactly like bite-sized."',
      score_improvement: '+5 points'
    },
    annotations: [
      {
        highlight: '"This is hopeless"',
        explanation: 'Opens with defeat (honest emotion)',
        principle: 'Start dialogue with real feeling'
      },
      {
        highlight: 'Jake',
        explanation: 'Named individual (makes it real)',
        principle: 'Names create credibility'
      },
      {
        highlight: 'crumpling his third attempt',
        explanation: 'Action beats show frustration',
        principle: 'Actions speak louder than adjectives'
      },
      {
        highlight: '"Like… bite-sized?"',
        explanation: 'His language, his realization',
        principle: 'Let them arrive at insight'
      },
      {
        highlight: 'His eyes lit up',
        explanation: 'Visual cue of breakthrough',
        principle: 'Show the "aha" moment physically'
      }
    ],
    success_factors: [
      'Shows mentoring method (break down)',
      'Jake\'s language reveals learning',
      'Physical cues (crumpling, eyes)',
      'Natural back-and-forth exchange'
    ]
  },

  {
    context: 'Family advocacy - Northwestern admit',
    school_tier: 'top_uc',
    before: {
      text: 'I defended my friend when others judged him unfairly.',
      problems: [
        'Tells about defense, doesn\'t show it',
        'No actual confrontation',
        'Missing the tension',
        'Generic "judged unfairly"'
      ]
    },
    after: {
      text: '"This will definitely grant you an A," the teacher said, assuming I\'d exploited him. I met her eyes. "He isn\'t some charity project. He\'s my friend." The room went silent.',
      score_improvement: '+6 points'
    },
    annotations: [
      {
        highlight: 'assuming I\'d exploited him',
        explanation: 'Shows the unfair assumption',
        principle: 'Make the injustice explicit'
      },
      {
        highlight: 'I met her eyes',
        explanation: 'Physical action shows courage',
        principle: 'Body language = character'
      },
      {
        highlight: '"He isn\'t some charity project. He\'s my friend."',
        explanation: 'Direct confrontation with clarity',
        principle: 'Stand firm in your values'
      },
      {
        highlight: 'The room went silent',
        explanation: 'Shows impact of words',
        principle: 'External reaction proves moment\'s weight'
      }
    ],
    success_factors: [
      'Confrontational dialogue (risky but authentic)',
      'Clear moral stance',
      'Shows courage in action',
      'Environmental response (silence)'
    ]
  }
];

// ============================================================================
// COMMUNITY TRANSFORMATION EXAMPLES
// ============================================================================

const COMMUNITY_TRANSFORMATION_EXAMPLES: EliteEssayExample[] = [
  {
    context: 'Robotics collaboration - MIT admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'I improved team collaboration and everyone worked better together.',
      problems: [
        'Vague "improved collaboration"',
        'No before state shown',
        'Generic outcome',
        'Missing mechanism'
      ]
    },
    after: {
      text: 'Before: 12 programmers playing different songs, specialists guarding their domains, vision and motion teams never speaking. After introducing cross-functional workshops: 5 new programmers confidently debugging vision algorithms, 18 teams adopting our documentation system.',
      score_improvement: '+8 points'
    },
    annotations: [
      {
        highlight: 'Before:',
        explanation: 'Explicit structure shows contrast',
        principle: 'Label the before/after clearly'
      },
      {
        highlight: '12 programmers playing different songs',
        explanation: 'Metaphor + specific number',
        principle: 'Vivid metaphor makes culture tangible'
      },
      {
        highlight: 'specialists guarding their domains',
        explanation: 'Describes the toxic dynamic',
        principle: 'Name the cultural problem'
      },
      {
        highlight: 'cross-functional workshops',
        explanation: 'Specific intervention method',
        principle: 'Show what you built'
      },
      {
        highlight: '5 new programmers confidently debugging',
        explanation: 'Quantified skill transfer',
        principle: 'Count the people who learned'
      },
      {
        highlight: '18 teams adopting our system',
        explanation: 'Broader ecosystem impact',
        principle: 'Track ripple effects'
      }
    ],
    success_factors: [
      'Before/after structure is explicit',
      'Multiple metrics (12 → 5, 18 teams)',
      'Names specific intervention',
      'Shows culture change + skill transfer'
    ]
  }
];

// ============================================================================
// UNIVERSAL INSIGHT EXAMPLES
// ============================================================================

const UNIVERSAL_INSIGHT_EXAMPLES: EliteEssayExample[] = [
  {
    context: 'Robotics - Yale admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'Through robotics, I learned that teamwork and collaboration are essential for success.',
      problems: [
        'Generic lesson about teamwork',
        'Applies only to teams',
        'Not transferable',
        'Could be from any activity'
      ]
    },
    after: {
      text: 'Progress isn\'t individual genius conducting solo performances—it\'s building bridges between different forms of brilliance, creating symphonies no single musician could play alone.',
      score_improvement: '+10 points'
    },
    annotations: [
      {
        highlight: 'Progress isn\'t... it\'s',
        explanation: 'Counter-intuitive structure',
        principle: 'Challenge common assumptions'
      },
      {
        highlight: 'individual genius conducting solo performances',
        explanation: 'Names the cultural myth',
        principle: 'Identify what people wrongly believe'
      },
      {
        highlight: 'building bridges between different forms of brilliance',
        explanation: 'Applies to any collaborative system',
        principle: 'Make it universal (labs, companies, relationships)'
      },
      {
        highlight: 'creating symphonies no single musician could play',
        explanation: 'Extended metaphor reinforces point',
        principle: 'Use metaphor for universal truth'
      }
    ],
    success_factors: [
      'True for ALL complex systems',
      'Challenges hero narrative',
      'Sophisticated metaphor',
      'Philosophical depth'
    ]
  },

  {
    context: 'Research failure - Harvard admit',
    school_tier: 'ivy_plus',
    before: {
      text: 'My research taught me that failure is just part of the process and you have to keep trying.',
      problems: [
        'Cliché about failure',
        'Activity-specific',
        'Doesn\'t transcend research',
        'Generic perseverance message'
      ]
    },
    after: {
      text: 'Complex systems fail not from technical flaws, but from connection errors—the fear that sharing knowledge means losing power.',
      score_improvement: '+9 points'
    },
    annotations: [
      {
        highlight: 'Complex systems',
        explanation: 'Broader than just research',
        principle: 'Use category language (systems, networks, organizations)'
      },
      {
        highlight: 'not from... but from',
        explanation: 'Reveals counter-intuitive truth',
        principle: 'Surprise with insight'
      },
      {
        highlight: 'connection errors',
        explanation: 'Technical term for human problem',
        principle: 'Bridge technical and human'
      },
      {
        highlight: 'fear that sharing knowledge means losing power',
        explanation: 'Names psychological barrier',
        principle: 'Identify universal human fear'
      }
    ],
    success_factors: [
      'Applies to organizations, teams, relationships',
      'Reveals psychological truth',
      'Technical language for human insight',
      'Challenges surface explanations'
    ]
  }
];

// ============================================================================
// ASSEMBLED LIBRARY
// ============================================================================

export const EXAMPLE_LIBRARY: ExampleLibrary = {
  by_principle: {
    'ANCHOR_WITH_NUMBERS': QUANTIFIED_IMPACT_EXAMPLES,
    'SHOW_VULNERABILITY': VULNERABILITY_EXAMPLES,
    'USE_DIALOGUE': DIALOGUE_EXAMPLES,
    'SHOW_TRANSFORMATION': COMMUNITY_TRANSFORMATION_EXAMPLES,
    'UNIVERSAL_INSIGHT': UNIVERSAL_INSIGHT_EXAMPLES,
  },

  by_category: {
    voice_integrity: VULNERABILITY_EXAMPLES.slice(0, 2),
    specificity_evidence: QUANTIFIED_IMPACT_EXAMPLES,
    transformative_impact: COMMUNITY_TRANSFORMATION_EXAMPLES,
    role_clarity_ownership: DIALOGUE_EXAMPLES,
    narrative_arc_stakes: VULNERABILITY_EXAMPLES,
    initiative_leadership: COMMUNITY_TRANSFORMATION_EXAMPLES,
    community_collaboration: DIALOGUE_EXAMPLES.concat(COMMUNITY_TRANSFORMATION_EXAMPLES),
    reflection_meaning: UNIVERSAL_INSIGHT_EXAMPLES,
    craft_language_quality: DIALOGUE_EXAMPLES,
    fit_trajectory: UNIVERSAL_INSIGHT_EXAMPLES,
    time_investment_consistency: QUANTIFIED_IMPACT_EXAMPLES,
  },

  by_tier: {
    tier_1: [
      ...QUANTIFIED_IMPACT_EXAMPLES,
      ...VULNERABILITY_EXAMPLES,
      ...DIALOGUE_EXAMPLES,
      ...COMMUNITY_TRANSFORMATION_EXAMPLES,
      ...UNIVERSAL_INSIGHT_EXAMPLES,
    ].filter(ex => ex.school_tier === 'ivy_plus'),

    tier_2: [
      ...DIALOGUE_EXAMPLES,
    ].filter(ex => ex.school_tier === 'top_uc'),

    tier_3: [],
  },

  common_fixes: {
    add_vulnerability: VULNERABILITY_EXAMPLES,
    add_metrics: QUANTIFIED_IMPACT_EXAMPLES,
    add_dialogue: DIALOGUE_EXAMPLES,
    show_transformation: COMMUNITY_TRANSFORMATION_EXAMPLES,
    deepen_reflection: UNIVERSAL_INSIGHT_EXAMPLES,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get examples for a specific issue type
 */
export function getExamplesForIssue(issueType: string): EliteEssayExample[] {
  // Map issue types to principles
  const principleMap: Record<string, string> = {
    'missing_metrics': 'ANCHOR_WITH_NUMBERS',
    'no_vulnerability': 'SHOW_VULNERABILITY',
    'no_dialogue': 'USE_DIALOGUE',
    'no_transformation': 'SHOW_TRANSFORMATION',
    'weak_reflection': 'UNIVERSAL_INSIGHT',
  };

  const principle = principleMap[issueType];
  return principle ? EXAMPLE_LIBRARY.by_principle[principle] || [] : [];
}

/**
 * Get examples filtered by target tier
 */
export function getExamplesByTier(tier: 1 | 2 | 3): EliteEssayExample[] {
  return EXAMPLE_LIBRARY.by_tier[`tier_${tier}`];
}

/**
 * Get random example from a principle
 */
export function getRandomExample(principle: string): EliteEssayExample | null {
  const examples = EXAMPLE_LIBRARY.by_principle[principle];
  if (!examples || examples.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * examples.length);
  return examples[randomIndex];
}
