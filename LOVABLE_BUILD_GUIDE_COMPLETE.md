# 🎨 Lovable Build Guide: Common App Workshop
## Complete UI Implementation (No Backend Required)

**Target**: Build a sophisticated, multi-layered Common App supplemental essay workshop
**Inspiration**: PIQ Workshop, but more complex and strategic
**Timeline**: 4 weeks (phased approach)

---

## 📦 What You'll Build

A comprehensive essay workshop system that helps students write tailored supplemental essays for multiple colleges, with:
- College-specific intelligence (weighted values, preferences, research)
- Essay type-specific guidance (14+ different prompt types)
- Real-time alignment feedback
- Cross-college comparison
- Portfolio coherence analysis
- Strategic differentiation insights

---

## 🎯 Core Innovation

### The Problem
Students write 10-15 supplemental essays across multiple colleges. Common mistakes:
- Generic essays that could apply to any college
- Not understanding what each college uniquely values
- Reusing same essay for different colleges (doesn't work!)
- No strategic view across entire application portfolio

### The Solution
Multi-layered intelligence system:
1. **College Layer**: "What does Stanford value vs MIT vs Harvard?"
2. **Type Layer**: "What makes a great 'Why Us' essay vs 'Intellectual' essay?"
3. **Draft Layer**: "How does MY essay align with THIS college's values?"
4. **Portfolio Layer**: "Am I differentiating across all my essays?"

---

## 📁 Project Structure

```
src/
├── pages/
│   └── CommonAppWorkshop.tsx              # Main page with routing
│
├── components/commonApp/
│   ├── navigation/
│   │   ├── CollegeGrid.tsx                # College selector (grid view)
│   │   ├── CollegeCard.tsx                # Individual college card
│   │   └── EssayList.tsx                  # List of supplementals per college
│   │
│   ├── intelligence/
│   │   ├── CollegeProfileCard.tsx         # College values + preferences
│   │   ├── CoreValuesCard.tsx             # Weighted values with alignment
│   │   ├── PreferencesCard.tsx            # What college loves/hates
│   │   ├── EssayTypeGuide.tsx             # Type-specific guidance
│   │   └── ResearchSources.tsx            # Research transparency
│   │
│   ├── workshop/
│   │   ├── WorkshopLayout.tsx             # Main workshop 3-column layout
│   │   ├── EssayEditor.tsx                # Rich text editor with word count
│   │   ├── LiveAlignmentPanel.tsx         # Real-time value alignment
│   │   ├── TeachingCard.tsx               # Workshop teaching (from PIQ)
│   │   └── RubricCard.tsx                 # 12-dimension rubric (from PIQ)
│   │
│   ├── strategy/
│   │   ├── ComparisonModal.tsx            # Cross-college comparison
│   │   ├── PortfolioCoherence.tsx         # Theme distribution + overlap
│   │   └── ProgressTracker.tsx            # Overall progress
│   │
│   └── shared/
│       ├── ProgressBar.tsx                # Reusable progress bar
│       ├── Badge.tsx                      # Status badges
│       └── StatCard.tsx                   # Metric display cards
│
└── data/
    └── mockCommonAppData.ts               # All mock data in one file
```

---

## 🗂️ Mock Data Structure

Create a single file with all mock data:

```typescript
// data/mockCommonAppData.ts

export interface College {
  id: string;
  name: string;
  shortName: string;
  logo: string; // URL or local path
  color: string; // Brand color

  coreValues: CoreValue[];
  preferences: Preferences;
  research: Research;
  supplementals: Supplemental[];
}

export interface CoreValue {
  id: string;
  name: string;
  weight: number; // Percentage (sum to 100)
  definition: string;
  howToDemonstrate: string[];
  source: string;
  sourceUrl: string;
}

export interface Preferences {
  essayPriorities: string[];
  redFlags: string[];
  preferredTone: string[];
  avoidTone: string[];
  structureNotes: string;
}

export interface Research {
  sources: {
    admissionWebsite: string;
    deanInterviews: string[];
    missionStatement: string;
    eliteEssayDatabase: string;
  };
  lastUpdated: string;
  researchDepth: number; // 1-10
}

export interface Supplemental {
  id: string;
  title: string;
  prompt: string;
  wordLimit: number;
  wordMin?: number;
  required: boolean;
  type: EssayType;

  // Type-specific guidance
  requiredElements: string[];
  commonPitfalls: string[];
  elitePatterns: string[];
}

export type EssayType =
  | 'why_us'
  | 'intellectual'
  | 'community'
  | 'diversity'
  | 'creative'
  | 'challenge'
  | 'values'
  | 'leadership'
  | 'extracurricular';

// ============================================================================
// MOCK DATA - Stanford
// ============================================================================

export const STANFORD: College = {
  id: 'stanford',
  name: 'Stanford University',
  shortName: 'Stanford',
  logo: '/logos/stanford.png',
  color: '#8C1515',

  coreValues: [
    {
      id: 'intellectual_vitality',
      name: 'Intellectual Vitality',
      weight: 40,
      definition: 'Passion for learning that extends beyond the classroom, driven by curiosity rather than grades',
      howToDemonstrate: [
        'Independent research projects',
        'Self-taught skills or knowledge',
        'Intellectual pursuits outside coursework',
        'Deep dives into topics that fascinate you'
      ],
      source: 'Dean Richard Shaw, Stanford Admission',
      sourceUrl: 'https://admission.stanford.edu/apply/selection/'
    },
    {
      id: 'impact',
      name: 'Impact & Leadership',
      weight: 25,
      definition: 'Making a meaningful difference in your community through initiative and action',
      howToDemonstrate: [
        'Starting initiatives or organizations',
        'Tangible outcomes from your efforts',
        'Leadership through action, not just titles',
        'Sustained commitment to a cause'
      ],
      source: 'Stanford Admission - What We Look For',
      sourceUrl: 'https://admission.stanford.edu/apply/'
    },
    {
      id: 'context',
      name: 'Context & Resilience',
      weight: 20,
      definition: 'How you\'ve navigated your circumstances and turned challenges into growth',
      howToDemonstrate: [
        'Overcoming obstacles',
        'Making the most of available resources',
        'Supporting your family or community',
        'Pursuing opportunities despite barriers'
      ],
      source: 'Stanford Holistic Review Process',
      sourceUrl: 'https://admission.stanford.edu/apply/selection/'
    },
    {
      id: 'voice',
      name: 'Authentic Voice',
      weight: 15,
      definition: 'Being genuine and showing who you really are, not who you think we want',
      howToDemonstrate: [
        'Writing in your natural voice',
        'Sharing honest reflections',
        'Being vulnerable and real',
        'Avoiding clichés and expected answers'
      ],
      source: 'Stanford Essay Tips',
      sourceUrl: 'https://admission.stanford.edu/apply/first-year/essays.html'
    }
  ],

  preferences: {
    essayPriorities: [
      'Intellectual vitality above all else',
      'Specific examples over general statements',
      'Self-directed learning experiences',
      'Authenticity over achievement',
      'Impact over titles or awards'
    ],
    redFlags: [
      'Classroom-bounded learning (just doing homework well)',
      'Prestige-focused reasons ("Stanford is #1")',
      'Generic statements ("I love learning")',
      'Resume repetition',
      'Trying too hard to impress'
    ],
    preferredTone: [
      'Authentic and genuine',
      'Intellectually curious',
      'Reflective',
      'Passionate',
      'Thoughtful'
    ],
    avoidTone: [
      'Trying to impress',
      'Overly formal or stiff',
      'Generic or clichéd',
      'Arrogant',
      'Detached'
    ],
    structureNotes: 'Stanford values specificity and depth over breadth. One deeply explored idea beats three surface-level points.'
  },

  research: {
    sources: {
      admissionWebsite: 'https://admission.stanford.edu',
      deanInterviews: [
        'Richard Shaw Interview - NY Times (2023)',
        'Stanford Daily - Inside Admissions (2022)'
      ],
      missionStatement: 'https://www.stanford.edu/about/mission/',
      eliteEssayDatabase: 'Internal elite essay analysis (2020-2024)'
    },
    lastUpdated: '2024-12-01',
    researchDepth: 9
  },

  supplementals: [
    {
      id: 'stanford_why',
      title: 'Why Stanford?',
      prompt: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.',
      wordLimit: 250,
      wordMin: 100,
      required: true,
      type: 'intellectual',
      requiredElements: [
        'Specific idea or experience',
        'Evidence of self-directed learning',
        'Genuine intellectual curiosity',
        'Connection to Stanford (optional but strong)'
      ],
      commonPitfalls: [
        'Only discussing classroom learning',
        'Generic "I love learning" statements',
        'No specific example',
        'Prestige-focused reasons'
      ],
      elitePatterns: [
        'Independent project or research',
        'Unexpected intellectual pursuit',
        'Cross-disciplinary connection',
        'Specific Stanford professor/program mentioned'
      ]
    },
    {
      id: 'stanford_matters',
      title: 'What Matters to You?',
      prompt: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
      wordLimit: 250,
      wordMin: 100,
      required: true,
      type: 'creative',
      requiredElements: [
        'Authentic voice',
        'Specific personal details',
        'Something that reveals character',
        'Conversational tone (it\'s a note!)'
      ],
      commonPitfalls: [
        'Overly formal tone',
        'Just listing facts',
        'Generic personality traits',
        'Not actually sounding like a note'
      ],
      elitePatterns: [
        'Unique quirk or habit',
        'Specific story or anecdote',
        'Humor (when genuine)',
        'Vulnerable moment'
      ]
    },
    {
      id: 'stanford_short',
      title: 'What Matters Most',
      prompt: 'Tell us about something that is meaningful to you and why.',
      wordLimit: 100,
      required: true,
      type: 'values',
      requiredElements: [
        'Specific thing (not abstract concept alone)',
        'Why it matters (the deeper reason)',
        'Personal connection'
      ],
      commonPitfalls: [
        'Abstract values without grounding',
        'Expected answers (family, education)',
        'No depth in the "why"',
        'Too broad'
      ],
      elitePatterns: [
        'Unexpected choice',
        'Specific object or moment',
        'Reveals core value through story',
        'Genuine emotional resonance'
      ]
    }
  ]
};

// ============================================================================
// MOCK DATA - Harvard
// ============================================================================

export const HARVARD: College = {
  id: 'harvard',
  name: 'Harvard University',
  shortName: 'Harvard',
  logo: '/logos/harvard.png',
  color: '#A51C30',

  coreValues: [
    {
      id: 'intellectual_engagement',
      name: 'Intellectual Engagement',
      weight: 35,
      definition: 'Deep, sustained engagement with ideas and scholarly pursuits',
      howToDemonstrate: [
        'Academic depth in your interests',
        'Engaging with complex ideas',
        'Contributing to intellectual discussions',
        'Research or advanced study'
      ],
      source: 'Harvard Admissions Committee Guide',
      sourceUrl: 'https://college.harvard.edu/admissions'
    },
    {
      id: 'community',
      name: 'Community Contribution',
      weight: 30,
      definition: 'How you contribute to and enhance the communities you\'re part of',
      howToDemonstrate: [
        'Active participation in communities',
        'Bringing people together',
        'Supporting others',
        'Creating positive change'
      ],
      source: 'Harvard Mission Statement',
      sourceUrl: 'https://www.harvard.edu/about/mission-and-values/'
    },
    {
      id: 'character',
      name: 'Character & Leadership',
      weight: 25,
      definition: 'Integrity, empathy, and positive influence on others',
      howToDemonstrate: [
        'Ethical decision-making',
        'Supporting peers',
        'Leadership through service',
        'Standing up for values'
      ],
      source: 'Harvard Holistic Review',
      sourceUrl: 'https://college.harvard.edu/admissions/apply'
    },
    {
      id: 'activities',
      name: 'Meaningful Activities',
      weight: 10,
      definition: 'Depth and impact in extracurricular pursuits',
      howToDemonstrate: [
        'Sustained commitment',
        'Impact or achievement',
        'Initiative and innovation',
        'Depth over breadth'
      ],
      source: 'Harvard Application Review',
      sourceUrl: 'https://college.harvard.edu/admissions'
    }
  ],

  preferences: {
    essayPriorities: [
      'Community contribution and collaboration',
      'Intellectual depth and engagement',
      'Character and integrity',
      'How you\'ll contribute to Harvard community',
      'Authentic voice and reflection'
    ],
    redFlags: [
      'Individualistic without community awareness',
      'Prestige-seeking',
      'Generic Harvard praise',
      'No reflection on community impact',
      'Surface-level engagement'
    ],
    preferredTone: [
      'Thoughtful and reflective',
      'Collaborative mindset',
      'Intellectually engaged',
      'Community-oriented',
      'Humble confidence'
    ],
    avoidTone: [
      'Overly individualistic',
      'Arrogant or entitled',
      'Generic',
      'Transactional ("what I can get")',
      'Disconnected from others'
    ],
    structureNotes: 'Harvard values reflection on how you engage with and contribute to communities - academic, local, or broader.'
  },

  research: {
    sources: {
      admissionWebsite: 'https://college.harvard.edu/admissions',
      deanInterviews: [
        'William Fitzsimmons Interview - Harvard Magazine (2023)'
      ],
      missionStatement: 'https://www.harvard.edu/about/mission-and-values/',
      eliteEssayDatabase: 'Elite essay analysis (2020-2024)'
    },
    lastUpdated: '2024-12-01',
    researchDepth: 8
  },

  supplementals: [
    {
      id: 'harvard_intellectual',
      title: 'Intellectual Experience',
      prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
      wordLimit: 200,
      required: true,
      type: 'intellectual',
      requiredElements: [
        'Specific life experience',
        'How it shaped you',
        'How you\'ll contribute to Harvard community',
        'Connection to diversity of thought'
      ],
      commonPitfalls: [
        'Generic diversity statement',
        'Not connecting experience to contribution',
        'Surface-level reflection',
        'No community focus'
      ],
      elitePatterns: [
        'Specific community you\'ll enhance',
        'Unique perspective you bring',
        'Concrete example of past contribution',
        'Genuine reflection on growth'
      ]
    },
    {
      id: 'harvard_community',
      title: 'Community',
      prompt: 'Describe a time when you made a meaningful contribution to others in which the greater good was your focus. Discuss the challenges and rewards of making your contribution.',
      wordLimit: 200,
      required: false,
      type: 'community',
      requiredElements: [
        'Specific contribution',
        'Focus on others (not self)',
        'Challenges faced',
        'What you learned or gained'
      ],
      commonPitfalls: [
        'Self-focused narrative',
        'Generic volunteering description',
        'No reflection on challenges',
        'Lack of specific impact'
      ],
      elitePatterns: [
        'Sustained commitment',
        'Genuine care for community',
        'Overcoming meaningful obstacles',
        'Growth through service'
      ]
    }
  ]
};

// ============================================================================
// MOCK DATA - MIT
// ============================================================================

export const MIT: College = {
  id: 'mit',
  name: 'Massachusetts Institute of Technology',
  shortName: 'MIT',
  logo: '/logos/mit.png',
  color: '#A31F34',

  coreValues: [
    {
      id: 'hands_on',
      name: 'Hands-On Creativity',
      weight: 35,
      definition: 'Making, building, and creating things - moving from idea to implementation',
      howToDemonstrate: [
        'Building projects or prototypes',
        'Tinkering and experimentation',
        'Technical skills applied',
        'Creating tangible outcomes'
      ],
      source: 'MIT Admissions Blogs',
      sourceUrl: 'https://mitadmissions.org/apply/'
    },
    {
      id: 'collaboration',
      name: 'Collaboration & Community',
      weight: 30,
      definition: 'Working with others to solve problems and build community',
      howToDemonstrate: [
        'Team projects or initiatives',
        'Building community',
        'Collaborative problem-solving',
        'Supporting peers technically'
      ],
      source: 'MIT Mission and Values',
      sourceUrl: 'https://www.mit.edu/about/'
    },
    {
      id: 'initiative',
      name: 'Initiative & Risk-Taking',
      weight: 20,
      definition: 'Taking initiative, trying new things, and learning from failure',
      howToDemonstrate: [
        'Starting projects independently',
        'Trying things outside comfort zone',
        'Learning from failures',
        'Self-directed exploration'
      ],
      source: 'MIT Admissions - What We Look For',
      sourceUrl: 'https://mitadmissions.org/apply/process/what-we-look-for/'
    },
    {
      id: 'balance',
      name: 'Balance & Joy',
      weight: 15,
      definition: 'Finding joy, humor, and balance alongside rigorous work',
      howToDemonstrate: [
        'Interests beyond academics',
        'Sense of humor',
        'Community involvement',
        'Taking care of yourself and others'
      ],
      source: 'MIT Student Culture',
      sourceUrl: 'https://mitadmissions.org/'
    }
  ],

  preferences: {
    essayPriorities: [
      'Hands-on making and building',
      'Technical/creative projects',
      'Collaboration and teamwork',
      'Initiative and risk-taking',
      'Authentic personality (not just achievements)'
    ],
    redFlags: [
      'Only theoretical knowledge (no making)',
      'Individual glory over collaboration',
      'Risk-averse or overly cautious',
      'No sense of humor or balance',
      'Generic tech enthusiasm'
    ],
    preferredTone: [
      'Maker mindset',
      'Collaborative spirit',
      'Authentic personality',
      'Humble but confident',
      'Playful yet serious'
    ],
    avoidTone: [
      'Purely theoretical',
      'Overly formal or stiff',
      'Individual achievement focus only',
      'Generic',
      'Disconnected from community'
    ],
    structureNotes: 'MIT wants to see that you build things, work with others, and bring your whole self - not just your academic side.'
  },

  research: {
    sources: {
      admissionWebsite: 'https://mitadmissions.org',
      deanInterviews: [
        'Stu Schmill - MIT Admissions Blog (2023)',
        'Chris Peterson - What MIT Looks For (2022)'
      ],
      missionStatement: 'https://www.mit.edu/about/',
      eliteEssayDatabase: 'Elite essay analysis (2020-2024)'
    },
    lastUpdated: '2024-12-01',
    researchDepth: 9
  },

  supplementals: [
    {
      id: 'mit_world',
      title: 'World You Come From',
      prompt: 'Describe the world you come from (for example, your family, school, community, city, or town). How has that world shaped your dreams and aspirations?',
      wordLimit: 250,
      required: true,
      type: 'community',
      requiredElements: [
        'Specific world/community',
        'How it shaped you',
        'Connection to dreams/aspirations',
        'Concrete examples'
      ],
      commonPitfalls: [
        'Generic description of community',
        'No connection to aspirations',
        'Too broad (trying to cover everything)',
        'Lack of specific examples'
      ],
      elitePatterns: [
        'Specific aspect of community',
        'Clear cause-and-effect',
        'Technical/maker angle',
        'Community influence on building/creating'
      ]
    },
    {
      id: 'mit_challenge',
      title: 'Challenge or Setback',
      prompt: 'Tell us about a significant challenge you\'ve faced or something that didn\'t go according to plan. How did you manage the situation?',
      wordLimit: 250,
      required: true,
      type: 'challenge',
      requiredElements: [
        'Specific challenge',
        'How you responded',
        'What you learned',
        'Growth or change'
      ],
      commonPitfalls: [
        'Overly dramatic challenge',
        'No reflection on learning',
        'Blaming others',
        'Generic response'
      ],
      elitePatterns: [
        'Technical/project failure',
        'Iterative problem-solving',
        'Learning from mistakes',
        'Resilience and initiative'
      ]
    }
  ]
};

// ============================================================================
// EXPORT ALL COLLEGES
// ============================================================================

export const COLLEGES: College[] = [
  STANFORD,
  HARVARD,
  MIT
];

export const getCollege = (id: string): College | undefined => {
  return COLLEGES.find(c => c.id === id);
};

export const getSupplemental = (collegeId: string, suppId: string) => {
  const college = getCollege(collegeId);
  return college?.supplementals.find(s => s.id === suppId);
};

// ============================================================================
// MOCK ESSAY DRAFTS
// ============================================================================

export interface EssayDraft {
  id: string;
  collegeId: string;
  supplementalId: string;
  content: string;
  wordCount: number;
  status: 'not_started' | 'drafting' | 'in_workshop' | 'ready';
  lastEdited: Date;

  // Mock analysis results
  analysis?: {
    coreValuesScores: {
      valueId: string;
      valueName: string;
      score: number;
      gap: number;
      evidenceFound: string[];
      evidenceMissing: string[];
    }[];
    typeAlignment: {
      elementsPresent: string[];
      elementsMissing: string[];
      pitfallsDetected: string[];
      elitePatternsPresent: string[];
    };
    overallScore: number;
  };
}

export const MOCK_DRAFTS: EssayDraft[] = [
  {
    id: 'draft_stanford_why',
    collegeId: 'stanford',
    supplementalId: 'stanford_why',
    content: 'I\'ve always loved learning. When I took AP Biology, I became fascinated by genetics. I started reading research papers on CRISPR technology and even taught myself basic bioinformatics using online courses. Last summer, I conducted my own independent research project analyzing genetic variants in local plant species. I\'m excited about Stanford\'s bioengineering program and the opportunity to work with Professor Christina Smolke on synthetic biology research.',
    wordCount: 68,
    status: 'in_workshop',
    lastEdited: new Date('2024-12-09'),
    analysis: {
      coreValuesScores: [
        {
          valueId: 'intellectual_vitality',
          valueName: 'Intellectual Vitality',
          score: 78,
          gap: -7,
          evidenceFound: [
            'Self-taught bioinformatics',
            'Independent research project',
            'Reading research papers'
          ],
          evidenceMissing: [
            'Could elaborate more on WHY genetics fascinates you',
            'What specific question drove your research?'
          ]
        },
        {
          valueId: 'impact',
          valueName: 'Impact & Leadership',
          score: 65,
          gap: -20,
          evidenceFound: [
            'Conducted independent research'
          ],
          evidenceMissing: [
            'No mention of impact or outcomes',
            'How did your research contribute?',
            'Did you share findings?'
          ]
        },
        {
          valueId: 'context',
          valueName: 'Context & Resilience',
          score: 55,
          gap: -30,
          evidenceFound: [],
          evidenceMissing: [
            'No context about your background',
            'What resources did you have access to?',
            'Any challenges in pursuing this?'
          ]
        },
        {
          valueId: 'voice',
          valueName: 'Authentic Voice',
          score: 72,
          gap: -13,
          evidenceFound: [
            'Personal passion comes through'
          ],
          evidenceMissing: [
            'Could be more specific and personal',
            'Generic opening ("I\'ve always loved learning")'
          ]
        }
      ],
      typeAlignment: {
        elementsPresent: [
          'Specific idea or experience (genetics/CRISPR)',
          'Evidence of self-directed learning',
          'Connection to Stanford (Professor Smolke)'
        ],
        elementsMissing: [
          'Deeper WHY - what makes you GENUINELY excited?',
          'More specific about the learning experience itself'
        ],
        pitfallsDetected: [
          'Opens with generic "I\'ve always loved learning"',
          'Somewhat classroom-bounded (starts with AP Bio)'
        ],
        elitePatternsPresent: [
          'Independent project/research',
          'Specific Stanford professor mentioned'
        ]
      },
      overallScore: 72
    }
  },
  {
    id: 'draft_mit_world',
    collegeId: 'mit',
    supplementalId: 'mit_world',
    content: '',
    wordCount: 0,
    status: 'not_started',
    lastEdited: new Date('2024-12-08')
  }
];

export const getDraft = (collegeId: string, suppId: string): EssayDraft | undefined => {
  return MOCK_DRAFTS.find(d => d.collegeId === collegeId && d.supplementalId === suppId);
};

// ============================================================================
// MOCK PORTFOLIO ANALYSIS
// ============================================================================

export interface PortfolioAnalysis {
  themeDistribution: {
    theme: string;
    count: number;
    percentage: number;
    essays: string[];
  }[];
  overlapMatrix: {
    essay1Id: string;
    essay2Id: string;
    essay1Title: string;
    essay2Title: string;
    similarity: number;
    sharedContent: string[];
  }[];
  differentiationScore: number;
  recommendations: string[];
}

export const MOCK_PORTFOLIO: PortfolioAnalysis = {
  themeDistribution: [
    {
      theme: 'STEM/Research',
      count: 3,
      percentage: 60,
      essays: ['Stanford Why', 'MIT Challenge', 'Harvard Intellectual']
    },
    {
      theme: 'Community Service',
      count: 1,
      percentage: 20,
      essays: ['Harvard Community']
    },
    {
      theme: 'Personal Growth',
      count: 1,
      percentage: 20,
      essays: ['MIT World']
    }
  ],
  overlapMatrix: [
    {
      essay1Id: 'stanford_why',
      essay2Id: 'harvard_intellectual',
      essay1Title: 'Stanford - Why Stanford',
      essay2Title: 'Harvard - Intellectual Experience',
      similarity: 75,
      sharedContent: [
        'Both mention genetics research',
        'Both discuss CRISPR',
        'Similar framing around independent learning'
      ]
    }
  ],
  differentiationScore: 6.5,
  recommendations: [
    'Your portfolio heavily emphasizes STEM research (60%). Consider showing other dimensions of your personality.',
    'Stanford Why and Harvard Intellectual essays are 75% similar. Differentiate more - Stanford wants intellectual vitality, Harvard wants community contribution.',
    'You haven\'t yet written about creative pursuits or personal interests. MIT values balance and joy - consider showcasing this.'
  ]
};
```

---

## 🎨 Component Implementation Guide

### Phase 1: Navigation & College Intelligence

#### Component 1: CollegeGrid.tsx

**Purpose**: Main landing page - grid of colleges to choose from

```tsx
import { COLLEGES } from '@/data/mockCommonAppData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function CollegeGrid() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Common App Supplemental Essays</h1>
      <p className="text-muted-foreground mb-8">
        Select a college to start working on supplemental essays
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLEGES.map(college => {
          // Calculate progress (mock)
          const totalEssays = college.supplementals.length;
          const completed = 1; // Mock
          const progress = (completed / totalEssays) * 100;

          return (
            <Card
              key={college.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/common-app/${college.id}`}
            >
              {/* College Logo/Color */}
              <div
                className="w-full h-24 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: college.color }}
              >
                <span className="text-white text-2xl font-bold">
                  {college.shortName}
                </span>
              </div>

              {/* College Name */}
              <h3 className="text-xl font-semibold mb-2">{college.name}</h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completed}/{totalEssays} essays</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Supplementals</p>
                  <p className="font-semibold">{totalEssays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Required</p>
                  <p className="font-semibold">
                    {college.supplementals.filter(s => s.required).length}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                {completed === totalEssays ? (
                  <Badge className="bg-green-500">Complete</Badge>
                ) : completed > 0 ? (
                  <Badge className="bg-blue-500">In Progress</Badge>
                ) : (
                  <Badge className="bg-gray-400">Not Started</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

---

#### Component 2: CollegeProfileCard.tsx

**Purpose**: Show college's core values, preferences, research

```tsx
import { College } from '@/data/mockCommonAppData';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  college: College;
}

export function CollegeProfileCard({ college }: Props) {
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: college.color }}
        >
          <span className="text-white font-bold text-xl">
            {college.shortName[0]}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{college.name}</h2>
          <p className="text-muted-foreground">College Profile & Values</p>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Core Values (Weighted)</h3>
        <div className="space-y-4">
          {college.coreValues.map(value => (
            <div key={value.id}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{value.name}</span>
                <span className="text-lg font-bold" style={{ color: college.color }}>
                  {value.weight}%
                </span>
              </div>
              <Progress
                value={value.weight}
                className="h-3 mb-2"
                style={{
                  backgroundColor: '#e5e7eb',
                }}
              />
              <p className="text-sm text-muted-foreground mb-2">
                {value.definition}
              </p>

              {/* Expandable Details */}
              <Accordion type="single" collapsible>
                <AccordionItem value="details">
                  <AccordionTrigger className="text-sm">
                    How to demonstrate
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1">
                      {value.howToDemonstrate.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Source: <a href={value.sourceUrl} className="underline" target="_blank">
                        {value.source}
                      </a>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">What {college.shortName} Looks For</h3>

        <div className="space-y-4">
          {/* Priorities */}
          <div>
            <p className="font-medium text-sm mb-2 text-green-700">✓ Essay Priorities:</p>
            <ul className="space-y-1">
              {college.preferences.essayPriorities.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Red Flags */}
          <div>
            <p className="font-medium text-sm mb-2 text-red-700">✗ Avoid These:</p>
            <ul className="space-y-1">
              {college.preferences.redFlags.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm mb-2">Preferred Tone:</p>
              <div className="flex flex-wrap gap-1">
                {college.preferences.preferredTone.map((tone, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {tone}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Avoid Tone:</p>
              <div className="flex flex-wrap gap-1">
                {college.preferences.avoidTone.map((tone, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                    {tone}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Sources */}
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Research Depth: {'★'.repeat(college.research.researchDepth)}{'☆'.repeat(10 - college.research.researchDepth)}
          <br />
          Last Updated: {college.research.lastUpdated}
        </p>
      </div>
    </Card>
  );
}
```

This is getting long! Should I continue with the remaining components (EssayEditor, LiveAlignmentPanel, ComparisonModal, etc.) or would you like me to:

1. **Create a separate file for each component with full implementation**
2. **Focus on specific high-priority components**
3. **Create a quick reference guide showing all component APIs**
4. **Move on to routing/page structure**

What would be most useful for Lovable to build this system?
