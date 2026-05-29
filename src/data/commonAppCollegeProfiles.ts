// College personality profiles with weighted values for Common App Workshop
// These profiles represent each college's unique priorities and "personality"

export interface CollegeValueWeight {
  name: string;
  key: string;
  weight: number; // Percentage (should sum to 100)
  icon: string;
  description: string;
  howToDemonstrate: string[];
  evidenceTypes: string[];
}

export interface CollegeProfile {
  id: string;
  name: string;
  tagline: string;
  personality: string; // One-line personality description
  valueWeights: CollegeValueWeight[];
  loves: string[];
  avoids: string[];
  tone: string;
  sources: string[];
}

export const collegeProfiles: Record<string, CollegeProfile> = {
  stanford: {
    id: 'stanford',
    name: 'Stanford University',
    tagline: "Show me you learn for love of it, not for grades",
    personality: "The Curious Explorer",
    valueWeights: [
      {
        name: 'Intellectual Vitality',
        key: 'intellectual_vitality',
        weight: 40,
        icon: '🔬',
        description: 'Learning for love of it, beyond the classroom. Self-directed curiosity that can\'t be contained.',
        howToDemonstrate: [
          'Show learning that happened OUTSIDE class requirements',
          'Demonstrate curiosity that led you down unexpected paths',
          'Share moments where you taught yourself something complex',
          'Describe questions that kept you up at night'
        ],
        evidenceTypes: [
          'Independent research projects',
          'Self-taught skills (coding, languages, instruments)',
          'Books read beyond assignments',
          'Online courses taken voluntarily',
          'Curiosity-driven experiments or investigations'
        ]
      },
      {
        name: 'Impact & Leadership',
        key: 'impact_leadership',
        weight: 25,
        icon: '💡',
        description: 'Making a difference through initiative. Starting things, not just joining them.',
        howToDemonstrate: [
          'Show outcomes and tangible results from your efforts',
          'Describe initiatives YOU started, not just participated in',
          'Quantify your impact when possible',
          'Share how you brought others along with you'
        ],
        evidenceTypes: [
          'Clubs or organizations you founded',
          'Projects with measurable outcomes',
          'People you mentored or taught',
          'Systems you improved or created',
          'Community problems you addressed'
        ]
      },
      {
        name: 'Context & Resilience',
        key: 'context_resilience',
        weight: 20,
        icon: '💪',
        description: 'Overcoming obstacles and growing through challenges. Making the most of your circumstances.',
        howToDemonstrate: [
          'Be specific about challenges, not vague',
          'Focus on growth and learning, not victimhood',
          'Show resourcefulness in difficult situations',
          'Demonstrate perspective and maturity'
        ],
        evidenceTypes: [
          'Obstacles overcome with specific outcomes',
          'Growth from failure or setback',
          'Making opportunities where none existed',
          'Supporting family or community through hardship'
        ]
      },
      {
        name: 'Authentic Voice',
        key: 'authentic_voice',
        weight: 15,
        icon: '✨',
        description: 'Being genuinely yourself. Writing that sounds like YOU, not a college essay.',
        howToDemonstrate: [
          'Use your natural voice and vocabulary',
          'Include specific details only YOU would know',
          'Show personality through word choice and rhythm',
          'Avoid clichés and generic statements'
        ],
        evidenceTypes: [
          'Unique perspectives or observations',
          'Personal quirks or interests',
          'Specific memories with sensory details',
          'Honest reflection, including uncertainty'
        ]
      }
    ],
    loves: [
      'Intellectual vitality above all else',
      'Specific examples over general statements',
      'Self-directed learning and curiosity',
      'Authenticity over polished perfection',
      'Questions that show depth of thinking',
      'Evidence of genuine passion'
    ],
    avoids: [
      'Classroom-bounded learning only',
      'Prestige-focused reasons ("Stanford is #1")',
      'Generic statements that could apply anywhere',
      'Resume repetition without reflection',
      'Trying to sound impressive vs. genuine',
      'Surface-level engagement with topics'
    ],
    tone: 'Curious, authentic, intellectually adventurous',
    sources: [
      'Stanford Admission Website',
      'Dean of Admission interviews',
      'Stanford Daily admission coverage',
      'Common Data Set analysis'
    ]
  },
  
  harvard: {
    id: 'harvard',
    name: 'Harvard University',
    tagline: "Show me how you'll contribute to our community",
    personality: "The Community Builder",
    valueWeights: [
      {
        name: 'Community Contribution',
        key: 'community_contribution',
        weight: 30,
        icon: '🤝',
        description: 'How you\'ll enrich the Harvard community. What you give, not just what you\'ll take.',
        howToDemonstrate: [
          'Show how you\'ve contributed to communities before',
          'Describe what you\'ll bring to residential life',
          'Demonstrate collaborative spirit',
          'Share how you support and uplift others'
        ],
        evidenceTypes: [
          'Community service with sustained commitment',
          'Peer mentoring or tutoring',
          'Club leadership focused on member growth',
          'Bringing people together across differences',
          'Creating inclusive spaces or programs'
        ]
      },
      {
        name: 'Intellectual Curiosity',
        key: 'intellectual_curiosity',
        weight: 25,
        icon: '📚',
        description: 'Deep engagement with ideas across disciplines. Love of learning and discourse.',
        howToDemonstrate: [
          'Show interdisciplinary thinking',
          'Describe intellectual conversations that excited you',
          'Demonstrate depth AND breadth of interests',
          'Share how you engage with different perspectives'
        ],
        evidenceTypes: [
          'Academic achievements with context',
          'Research or independent study',
          'Intellectual debates or discussions',
          'Reading across multiple fields',
          'Connecting ideas across disciplines'
        ]
      },
      {
        name: 'Character & Integrity',
        key: 'character_integrity',
        weight: 25,
        icon: '⚖️',
        description: 'Moral compass and ethical leadership. Doing the right thing, especially when hard.',
        howToDemonstrate: [
          'Share moments of ethical decision-making',
          'Show how you\'ve stood up for others',
          'Demonstrate consistency between values and actions',
          'Reflect on moral growth or learning'
        ],
        evidenceTypes: [
          'Ethical dilemmas navigated thoughtfully',
          'Standing up for others or principles',
          'Admitting mistakes and learning from them',
          'Leadership with integrity under pressure'
        ]
      },
      {
        name: 'Potential for Growth',
        key: 'growth_potential',
        weight: 20,
        icon: '🌱',
        description: 'Capacity to grow and be transformed by the Harvard experience.',
        howToDemonstrate: [
          'Show self-awareness about areas for growth',
          'Describe how you\'ve evolved over time',
          'Express genuine curiosity about future development',
          'Demonstrate openness to being challenged'
        ],
        evidenceTypes: [
          'Personal transformation stories',
          'Goals that require stretching',
          'Openness to new perspectives',
          'Learning from feedback or failure'
        ]
      }
    ],
    loves: [
      'Community-minded individuals',
      'Intellectual discourse and debate',
      'Ethical leadership and integrity',
      'Collaboration over competition',
      'Genuine care for others\' wellbeing',
      'Diverse perspectives and backgrounds'
    ],
    avoids: [
      'Pure self-interest or taking mentality',
      'Individual achievement without context',
      'Prestige-seeking language',
      'Arrogance or superiority',
      'Generic "dream school" framing',
      'Lack of self-awareness'
    ],
    tone: 'Thoughtful, community-oriented, reflective',
    sources: [
      'Harvard Admission Website',
      'Harvard Gazette interviews',
      'Dean Fitzsimmons public statements',
      'Harvard lawsuit trial documents'
    ]
  },
  
  mit: {
    id: 'mit',
    name: 'MIT',
    tagline: "Show me what you've built and what you'll make next",
    personality: "The Maker",
    valueWeights: [
      {
        name: 'Hands-On Creativity',
        key: 'hands_on_creativity',
        weight: 35,
        icon: '🔧',
        description: 'Building, making, creating. Getting your hands dirty to solve real problems.',
        howToDemonstrate: [
          'Describe specific things you\'ve BUILT or MADE',
          'Show your process, including failures',
          'Explain technical details with enthusiasm',
          'Share the satisfaction of making things work'
        ],
        evidenceTypes: [
          'Engineering or coding projects',
          'Physical builds (robots, circuits, structures)',
          'Art or design with technical components',
          'Experiments with hands-on methodology',
          'Repairs, modifications, or improvements to things'
        ]
      },
      {
        name: 'Collaborative Spirit',
        key: 'collaborative_spirit',
        weight: 25,
        icon: '👥',
        description: 'Working with others to achieve more than you could alone. No lone wolves.',
        howToDemonstrate: [
          'Show how you work with diverse teammates',
          'Describe your role in team dynamics',
          'Share credit and acknowledge others',
          'Demonstrate supporting teammates\' success'
        ],
        evidenceTypes: [
          'Team projects with specific contributions',
          'Hackathons or competitions as a team',
          'Teaching or helping others learn',
          'Cross-disciplinary collaborations'
        ]
      },
      {
        name: 'Initiative & Drive',
        key: 'initiative_drive',
        weight: 25,
        icon: '🚀',
        description: 'Self-starting energy to pursue ideas. Doing things because you CAN\'T NOT do them.',
        howToDemonstrate: [
          'Show projects you started on your own',
          'Describe learning without being assigned',
          'Share obsessive pursuit of interests',
          'Demonstrate persistence through obstacles'
        ],
        evidenceTypes: [
          'Self-directed projects',
          'Skills learned independently',
          'Problems you couldn\'t leave unsolved',
          'Going far beyond requirements'
        ]
      },
      {
        name: 'Playful Curiosity',
        key: 'playful_curiosity',
        weight: 15,
        icon: '🎮',
        description: 'Joy in exploration and experimentation. Not taking yourself too seriously.',
        howToDemonstrate: [
          'Show sense of humor and personality',
          'Describe fun in your technical work',
          'Share quirky interests or experiments',
          'Demonstrate that learning is play'
        ],
        evidenceTypes: [
          'Playful projects or experiments',
          'Humor in technical contexts',
          'Exploration for its own sake',
          'Creative approaches to problems'
        ]
      }
    ],
    loves: [
      'Building and making things',
      'Hands-on problem solving',
      'Collaboration and teamwork',
      'Playful approach to serious work',
      'Technical depth with breadth',
      'Passion over polish'
    ],
    avoids: [
      'Pure theory without application',
      'Individual genius narrative',
      'Lack of specific projects or builds',
      'Taking yourself too seriously',
      'Passive consumption vs. active creation',
      'Prestige-focused motivations'
    ],
    tone: 'Maker mindset, playful but serious, collaborative',
    sources: [
      'MIT Admissions website',
      'MIT Admissions blogs',
      'Chris Peterson interviews',
      'MIT application questions analysis'
    ]
  },
  
  yale: {
    id: 'yale',
    name: 'Yale University',
    tagline: "Show me your intellectual passion and who you'll become",
    personality: "The Renaissance Scholar",
    valueWeights: [
      {
        name: 'Intellectual Passion',
        key: 'intellectual_passion',
        weight: 30,
        icon: '🎭',
        description: 'Deep, genuine love for learning across humanities, arts, and sciences.',
        howToDemonstrate: [
          'Show passion that goes beyond achievement',
          'Describe intellectual joy and discovery',
          'Connect academic interests to bigger questions',
          'Demonstrate engagement with ideas for their own sake'
        ],
        evidenceTypes: [
          'Deep dives into subjects of passion',
          'Original thinking or creative connections',
          'Engagement with primary sources',
          'Pursuing knowledge without external reward'
        ]
      },
      {
        name: 'Residential Community',
        key: 'residential_community',
        weight: 25,
        icon: '🏠',
        description: 'Thriving in Yale\'s residential college system. Being a great roommate and neighbor.',
        howToDemonstrate: [
          'Show how you contribute to living communities',
          'Describe navigating diverse perspectives',
          'Share examples of informal mentorship',
          'Demonstrate care for community wellbeing'
        ],
        evidenceTypes: [
          'Living community contributions',
          'Informal leadership or support',
          'Building bridges across groups',
          'Creating inclusive environments'
        ]
      },
      {
        name: 'Leadership & Impact',
        key: 'leadership_impact',
        weight: 25,
        icon: '🌟',
        description: 'Making meaningful contributions to your communities and the world.',
        howToDemonstrate: [
          'Show leadership through service, not status',
          'Describe impact beyond personal achievement',
          'Share how you\'ve made things better for others',
          'Demonstrate vision for future contribution'
        ],
        evidenceTypes: [
          'Community impact with sustained commitment',
          'Leadership that empowers others',
          'Creating lasting positive change',
          'Service integrated with personal growth'
        ]
      },
      {
        name: 'Authentic Self',
        key: 'authentic_self',
        weight: 20,
        icon: '💎',
        description: 'Being genuinely yourself. Yale wants to know the real you.',
        howToDemonstrate: [
          'Be vulnerable and honest',
          'Show personality and quirks',
          'Share what genuinely matters to you',
          'Write in your natural voice'
        ],
        evidenceTypes: [
          'Personal stories with specific details',
          'Honest reflection including struggles',
          'Unique perspectives or interests',
          'Writing that sounds like you'
        ]
      }
    ],
    loves: [
      'Intellectual passion across disciplines',
      'Strong residential community spirit',
      'Leadership through service',
      'Genuine authenticity and self-awareness',
      'Arts and humanities engagement',
      'Thoughtful, reflective writing'
    ],
    avoids: [
      'Achievement lists without reflection',
      'Self-centered or entitled tone',
      'Lack of intellectual curiosity',
      'Generic or impersonal writing',
      'Status-focused motivations',
      'Surface-level engagement'
    ],
    tone: 'Passionate, reflective, community-minded',
    sources: [
      'Yale Admissions website',
      'Yale Daily News coverage',
      'Dean Quinlan interviews',
      'Yale residential college information'
    ]
  }
};

export const getCollegeProfile = (collegeId: string): CollegeProfile | undefined => {
  return collegeProfiles[collegeId.toLowerCase()];
};

export const getAllCollegeProfiles = (): CollegeProfile[] => {
  return Object.values(collegeProfiles);
};

// Helper to get comparison data between colleges
export const compareColleges = (collegeIds: string[]): { college: CollegeProfile; topValue: CollegeValueWeight }[] => {
  return collegeIds.map(id => {
    const profile = collegeProfiles[id.toLowerCase()];
    if (!profile) return null;
    const topValue = profile.valueWeights.reduce((a, b) => a.weight > b.weight ? a : b);
    return { college: profile, topValue };
  }).filter(Boolean) as { college: CollegeProfile; topValue: CollegeValueWeight }[];
};
