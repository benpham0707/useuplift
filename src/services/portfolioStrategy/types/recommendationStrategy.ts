/**
 * Recommendation Strategy Types
 *
 * Comprehensive type definitions for recommendation letter strategy.
 * Strong recommendations can significantly boost an application, while
 * generic or lukewarm ones can hurt. This system helps students
 * cultivate relationships and select recommenders strategically.
 *
 * Key Insight: The best recommendation isn't from the most famous teacher
 * or the class where you got the highest grade - it's from someone who
 * knows you well, likes you, and can speak to your specific qualities
 * with vivid, concrete examples.
 *
 * This system provides:
 * - Recommender selection criteria
 * - Relationship cultivation strategies
 * - What makes a strong vs weak recommendation
 * - School-specific requirements
 * - Timing and logistics guidance
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel, YearPhase } from './timeline';
import { MajorCategory } from './majorGuidance';

// ============================================================================
// RECOMMENDATION CLASSIFICATION
// ============================================================================

/**
 * Types of recommenders
 */
export type RecommenderType =
  | 'teacher_academic'        // Core academic subject teacher
  | 'teacher_elective'        // Elective teacher (art, music, etc.)
  | 'counselor'               // School counselor
  | 'coach'                   // Athletic coach
  | 'employer'                // Work supervisor
  | 'research_mentor'         // Research supervisor
  | 'community_mentor'        // Community organization leader
  | 'peer'                    // Peer recommendation (for Dartmouth, etc.)
  | 'family_friend'           // Family friend (generally not recommended)
  | 'other';

/**
 * Academic subjects for teacher recommendations
 */
export type AcademicSubject =
  | 'english'
  | 'math'
  | 'science'
  | 'history'
  | 'social_studies'
  | 'foreign_language'
  | 'computer_science'
  | 'art'
  | 'music'
  | 'other';

/**
 * Relationship strength levels
 */
export type RelationshipStrength =
  | 'exceptional'     // Close mentor relationship
  | 'strong'          // Knows you well, clear advocate
  | 'good'            // Solid relationship, positive
  | 'adequate'        // Professional but limited
  | 'weak';           // Barely knows you

/**
 * Recommendation quality levels
 */
export type RecommendationQuality =
  | 'outstanding'     // Will significantly help
  | 'strong'          // Will help
  | 'good'            // Positive but not standout
  | 'adequate'        // Neither helps nor hurts
  | 'weak'            // May hurt application
  | 'harmful';        // Will definitely hurt

// ============================================================================
// RECOMMENDER PROFILES
// ============================================================================

/**
 * Individual recommender profile
 */
export interface RecommenderProfile {
  recommenderId: string;
  name: string;
  type: RecommenderType;
  subject?: AcademicSubject;
  title: string;
  institution: string;
  email?: string;

  // Relationship assessment
  relationship: {
    strength: RelationshipStrength;
    duration: string;               // How long you've known them
    context: string;                // Where you know them from
    lastContact: string;            // When you last interacted
    frequencyOfContact: 'daily' | 'weekly' | 'monthly' | 'occasionally' | 'rarely';
  };

  // What they can speak to
  canSpeakTo: {
    quality: string;
    strength: HarvardScoreDecimal;
    examples: string[];
  }[];

  // Evidence of support
  supportEvidence: {
    hasAgreedToWrite: boolean;
    agreedDate?: string;
    hasWrittenBefore: boolean;
    pastRecommendationQuality?: string;
    verbalSupport: string[];        // Things they've said about you
  };

  // Potential concerns
  concerns: {
    concern: string;
    severity: 'critical' | 'moderate' | 'minor';
    mitigation?: string;
  }[];

  // Writing ability
  writingAbility: {
    quality: 'excellent' | 'good' | 'adequate' | 'poor' | 'unknown';
    notes: string;
  };

  // Availability
  availability: {
    willingness: 'enthusiastic' | 'willing' | 'reluctant' | 'declined' | 'unknown';
    timeConstraints?: string;
    numberOfOtherRecs?: number;
  };

  // Overall assessment
  overallScore: HarvardScoreDecimal;
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended';
}

/**
 * Recommender comparison for selection
 */
export interface RecommenderComparison {
  recommenders: RecommenderProfile[];

  // Selection recommendation
  recommendation: {
    firstChoice: RecommenderProfile;
    secondChoice: RecommenderProfile;
    reasoning: string;
    alternativesConsidered: string;
  };

  // Coverage analysis
  coverageAnalysis: {
    qualitiescovered: string[];
    qualitiesNotCovered: string[];
    subjectCoverage: string;
    diversityOfPerspective: boolean;
  };

  // Optimization suggestions
  optimizationSuggestions: string[];
}

// ============================================================================
// WHAT MAKES A STRONG RECOMMENDATION
// ============================================================================

/**
 * Strong recommendation characteristics
 */
export interface StrongRecommendationProfile {
  // Content characteristics
  content: {
    hasSpecificAnecdotes: boolean;
    hasQuantifiableAchievements: boolean;
    showsIntellectualCuriosity: boolean;
    demonstratesCharacter: boolean;
    addressesGrowth: boolean;
    contextualizedInClass: boolean;
    comparesToPeers: boolean;
  };

  // Tone characteristics
  tone: {
    enthusiasm: 'overwhelming' | 'strong' | 'moderate' | 'lukewarm' | 'neutral';
    personalConnection: boolean;
    genuine: boolean;
    specific: boolean;
  };

  // Red flag absence
  noRedFlags: {
    noFaintPraise: boolean;
    noGenericLanguage: boolean;
    noFactualErrors: boolean;
    noContradictions: boolean;
  };
}

/**
 * What distinguishes recommendation quality levels
 */
export const RECOMMENDATION_QUALITY_MARKERS: Record<RecommendationQuality, {
  description: string;
  characteristics: string[];
  examplePhrases: string[];
  impact: string;
}> = {
  outstanding: {
    description: 'Transforms how admissions sees the student',
    characteristics: [
      'Vivid, specific anecdotes',
      'Clear enthusiasm ("one of the best I\'ve taught")',
      'Reveals qualities not visible elsewhere',
      'Strong peer comparison ("top 1% in 20 years")',
      'Personal connection evident',
    ],
    examplePhrases: [
      'In my 20 years of teaching, Sarah is in the top 2-3 students I\'ve had',
      'I\'ve never seen a student so genuinely curious about...',
      'She will be a leader wherever she goes',
    ],
    impact: 'Can tip borderline decisions positive',
  },
  strong: {
    description: 'Clearly positive, supports application',
    characteristics: [
      'Good specific examples',
      'Positive tone throughout',
      'Some comparison to peers',
      'Addresses multiple qualities',
    ],
    examplePhrases: [
      'One of the strongest students in this year\'s class',
      'I recommend him with enthusiasm',
      'She consistently demonstrated...',
    ],
    impact: 'Reinforces positive impression',
  },
  good: {
    description: 'Positive but not distinctive',
    characteristics: [
      'Generally positive',
      'Some specific examples',
      'Limited enthusiasm',
      'Could describe many students',
    ],
    examplePhrases: [
      'A good student who works hard',
      'I recommend her for admission',
      'He was a pleasure to have in class',
    ],
    impact: 'Neutral - neither helps nor hurts much',
  },
  adequate: {
    description: 'Fulfills requirement but adds little',
    characteristics: [
      'Generic language',
      'Few specific examples',
      'Lukewarm tone',
      'Short length',
    ],
    examplePhrases: [
      'I recommend this student',
      'She completed all assignments',
      'He participated in class',
    ],
    impact: 'Can slightly hurt if others have strong recs',
  },
  weak: {
    description: 'Faint praise or notable gaps',
    characteristics: [
      'Damning with faint praise',
      'Obvious gaps in content',
      'Reluctant tone',
      'Factual errors',
    ],
    examplePhrases: [
      'She was always on time',
      'He tried hard',
      'I don\'t know her well, but...',
    ],
    impact: 'Will hurt application',
  },
  harmful: {
    description: 'Actively negative or raises red flags',
    characteristics: [
      'Explicit criticisms',
      'Revealed concerns',
      'Contradicts application',
      'Inappropriate content',
    ],
    examplePhrases: [
      'While he is capable, he often...',
      'She struggled with...',
      'I have concerns about...',
    ],
    impact: 'Can seriously damage application',
  },
};

// ============================================================================
// RECOMMENDER SELECTION STRATEGY
// ============================================================================

/**
 * Selection criteria for recommenders
 */
export interface RecommenderSelectionCriteria {
  // Priority factors
  priorities: {
    factor: string;
    weight: number;
    description: string;
  }[];

  // School-specific requirements
  schoolRequirements: {
    schoolName: string;
    required: {
      type: RecommenderType;
      subject?: AcademicSubject;
      notes: string;
    }[];
    optional: {
      type: RecommenderType;
      recommended: boolean;
      notes: string;
    }[];
    specialNotes: string[];
  }[];

  // Major-specific considerations
  majorConsiderations: {
    major: MajorCategory;
    preferredSubjects: AcademicSubject[];
    reasoning: string;
  }[];
}

/**
 * Default recommender selection criteria
 */
export const DEFAULT_SELECTION_CRITERIA: RecommenderSelectionCriteria = {
  priorities: [
    { factor: 'Relationship depth', weight: 0.30, description: 'How well they know you' },
    { factor: 'Enthusiasm level', weight: 0.25, description: 'How excited they are to write' },
    { factor: 'Specific evidence', weight: 0.20, description: 'Can they give concrete examples?' },
    { factor: 'Writing ability', weight: 0.15, description: 'Can they write compelling letters?' },
    { factor: 'Subject relevance', weight: 0.10, description: 'Alignment with intended major' },
  ],
  schoolRequirements: [
    {
      schoolName: 'Most Schools',
      required: [
        { type: 'counselor', notes: 'Required by almost all schools' },
        { type: 'teacher_academic', subject: 'english', notes: 'One humanities teacher typically required' },
        { type: 'teacher_academic', subject: 'math', notes: 'One STEM teacher typically required' },
      ],
      optional: [
        { type: 'teacher_elective', recommended: false, notes: 'Only if adds new dimension' },
        { type: 'employer', recommended: false, notes: 'Only if significant work experience' },
      ],
      specialNotes: ['Two teacher recommendations is standard', 'Junior year teachers preferred'],
    },
    {
      schoolName: 'MIT',
      required: [
        { type: 'counselor', notes: 'Required' },
        { type: 'teacher_academic', subject: 'math', notes: 'Math or science teacher required' },
        { type: 'teacher_academic', notes: 'Any subject, different from first' },
      ],
      optional: [
        { type: 'research_mentor', recommended: true, notes: 'Highly valuable if research experience' },
      ],
      specialNotes: ['STEM teacher strongly preferred', 'Values specific technical examples'],
    },
    {
      schoolName: 'Dartmouth',
      required: [
        { type: 'counselor', notes: 'Required' },
        { type: 'teacher_academic', notes: 'Two teachers required' },
        { type: 'peer', notes: 'Peer recommendation required' },
      ],
      optional: [],
      specialNotes: ['One of few schools requiring peer rec', 'Choose peer who knows you in different context'],
    },
  ],
  majorConsiderations: [
    { major: 'computer_science', preferredSubjects: ['math', 'science', 'computer_science'], reasoning: 'STEM teachers can speak to technical ability' },
    { major: 'english', preferredSubjects: ['english', 'history', 'social_studies'], reasoning: 'Humanities teachers can speak to writing ability' },
    { major: 'pre_med', preferredSubjects: ['science', 'math'], reasoning: 'Science teachers can speak to lab skills and scientific thinking' },
    { major: 'economics', preferredSubjects: ['math', 'history', 'social_studies'], reasoning: 'Both quantitative and analytical thinking important' },
  ],
};

// ============================================================================
// RELATIONSHIP CULTIVATION
// ============================================================================

/**
 * Strategy for building recommender relationships
 */
export interface RelationshipCultivationStrategy {
  currentGrade: GradeLevel;
  targetRecommender: RecommenderProfile;

  // Current state
  currentState: {
    relationshipStrength: RelationshipStrength;
    lastInteraction: string;
    currentContext: string;
  };

  // Goal
  targetState: {
    relationshipStrength: RelationshipStrength;
    whatTheyShouldKnow: string[];
    evidenceToProvide: string[];
  };

  // Strategy
  strategy: {
    phase: string;
    actions: {
      action: string;
      timing: string;
      purpose: string;
      tips: string[];
    }[];
    timeline: string;
  }[];

  // What to share with them
  infoToShare: {
    aboutYourself: string[];
    aboutYourGoals: string[];
    specificExamples: string[];
  };

  // Don'ts
  thingsToAvoid: string[];
}

/**
 * Relationship building timeline
 */
export const RELATIONSHIP_BUILDING_TIMELINE: Record<GradeLevel, {
  focus: string;
  actions: string[];
  goals: string[];
}> = {
  '9th': {
    focus: 'Making good impressions on all teachers',
    actions: [
      'Participate actively in class',
      'Visit office hours occasionally',
      'Show genuine curiosity',
      'Be respectful and engaged',
    ],
    goals: ['Teachers know your name', 'Positive general impression'],
  },
  '10th': {
    focus: 'Identifying potential recommenders',
    actions: [
      'Deepen relationships with 2-3 teachers',
      'Do extra work that showcases your thinking',
      'Ask substantive questions',
      'Share intellectual interests',
    ],
    goals: ['2-3 teachers know you well', 'Have had meaningful conversations'],
  },
  '11th': {
    focus: 'Solidifying recommender relationships',
    actions: [
      'Regular office hours with target recommenders',
      'Share your college and career goals',
      'Do projects that showcase your best work',
      'Ask for feedback and act on it',
      'Let them see you grow over the year',
    ],
    goals: ['Strong relationships with 2 teachers', 'They know your goals and qualities', 'They\'ve seen your best work'],
  },
  '12th': {
    focus: 'Asking and supporting recommenders',
    actions: [
      'Ask in person, early in senior year',
      'Provide brag sheet with specific examples',
      'Share school-specific information',
      'Thank them sincerely',
    ],
    goals: ['Secured enthusiastic recommenders', 'Provided them with helpful materials'],
  },
  'gap_year': {
    focus: 'Maintaining relationships',
    actions: [
      'Stay in touch with updates',
      'Ask if they need updated information',
      'Express continued gratitude',
    ],
    goals: ['Recommenders still engaged', 'Can update letters if needed'],
  },
  'transfer': {
    focus: 'Building college-level relationships',
    actions: [
      'Identify professors who know you',
      'Visit office hours regularly',
      'Do research or extra projects',
      'Share transfer goals',
    ],
    goals: ['Strong professor relationships', 'Can speak to college-level work'],
  },
};

// ============================================================================
// ASKING FOR RECOMMENDATIONS
// ============================================================================

/**
 * How and when to ask for recommendations
 */
export interface AskingStrategy {
  // Timing
  timing: {
    idealTiming: string;
    latestAcceptable: string;
    reasoning: string;
  };

  // The ask
  theAsk: {
    inPerson: boolean;
    whatToSay: string;
    whatToProvide: string[];
    followUp: string;
  };

  // Brag sheet content
  bragSheet: {
    personalInfo: string[];
    academicHighlights: string[];
    extracurricularHighlights: string[];
    specificExamples: string[];
    collegeGoals: string[];
    whatToEmphasize: string[];
  };

  // If they say no
  ifNo: {
    howToRespond: string;
    alternatives: string[];
    redFlags: string[];
  };

  // Follow up
  followUp: {
    reminderTiming: string;
    thankYou: string;
    updateAfterAdmissions: string;
  };
}

/**
 * Default asking strategy
 */
export const DEFAULT_ASKING_STRATEGY: AskingStrategy = {
  timing: {
    idealTiming: 'End of junior year (May-June) for senior year applications',
    latestAcceptable: 'Early September of senior year (but not ideal)',
    reasoning: 'Gives teachers summer to think about it and time to write thoughtfully',
  },
  theAsk: {
    inPerson: true,
    whatToSay: '"I\'m applying to college and would really value a strong recommendation from you. You know my work well and I think you could speak to [specific quality]. Would you be willing to write me a recommendation?"',
    whatToProvide: [
      'Resume/activities list',
      'Personal statement or essay draft',
      'Specific examples of work in their class',
      'Your goals and why you\'re excited about college',
      'List of schools with deadlines',
    ],
    followUp: 'If they agree, follow up with brag sheet within a week',
  },
  bragSheet: {
    personalInfo: ['Name, graduation year, intended major', 'Contact information for any questions'],
    academicHighlights: ['GPA and class rank if known', 'Relevant coursework', 'Academic awards'],
    extracurricularHighlights: ['Main activities and achievements', 'Leadership positions', 'Community involvement'],
    specificExamples: ['Specific projects/papers from their class', 'Moments that showcased your strengths', 'How you grew in their class'],
    collegeGoals: ['Target schools and their values', 'Intended major and career interests', 'Why you want to go to college'],
    whatToEmphasize: ['Specific qualities you hope they\'ll address', 'Anecdotes you\'d like them to mention', 'What makes you unique'],
  },
  ifNo: {
    howToRespond: 'Thank them graciously, ask if they have suggestions for other teachers',
    alternatives: ['Identify other teachers who know you', 'Consider why they said no - is there a concern?'],
    redFlags: ['If they seem reluctant, they may write lukewarm rec', 'A declined request is better than a weak letter'],
  },
  followUp: {
    reminderTiming: '2 weeks before deadline, polite check-in',
    thankYou: 'Handwritten thank you card after they submit',
    updateAfterAdmissions: 'Let them know where you got in and your decision',
  },
};

// ============================================================================
// COUNSELOR RECOMMENDATION
// ============================================================================

/**
 * Counselor recommendation strategy
 */
export interface CounselorRecommendationStrategy {
  // Building relationship
  relationshipBuilding: {
    actions: string[];
    frequency: string;
    whatToShare: string[];
  };

  // School-specific form
  schoolReport: {
    whatItIncludes: string[];
    whyItMatters: string;
    howToHelp: string[];
  };

  // Brag sheet for counselor
  counselorBragSheet: {
    additionalInfo: string[];
    contextToProvide: string[];
    challengesToExplain: string[];
  };

  // If counselor doesn't know you well
  ifUnfamiliar: {
    howToApproach: string;
    whatToProvide: string;
    managingExpectations: string;
  };
}

// ============================================================================
// RECOMMENDATION TRACKING
// ============================================================================

/**
 * Recommendation request tracking
 */
export interface RecommendationTracking {
  recommender: RecommenderProfile;

  // Request status
  status: {
    asked: boolean;
    askedDate?: string;
    agreed: boolean;
    agreedDate?: string;
    providedMaterials: boolean;
    materialsDate?: string;
    submitted: boolean;
    submittedDate?: string;
    thanked: boolean;
  };

  // By school
  schoolSubmissions: {
    school: string;
    required: boolean;
    submitted: boolean;
    submissionDate?: string;
    deadline: string;
  }[];

  // Reminders
  reminders: {
    date: string;
    sent: boolean;
    response?: string;
  }[];

  // Notes
  notes: string;
}

/**
 * Overall recommendation status
 */
export interface RecommendationStatusOverview {
  // Summary
  totalRecommendersNeeded: number;
  recommendersSecured: number;
  recommendersSubmitted: number;

  // By school
  schoolStatus: {
    school: string;
    deadline: string;
    requiredRecs: number;
    receivedRecs: number;
    complete: boolean;
  }[];

  // Action items
  actionItems: {
    item: string;
    deadline: string;
    priority: 'critical' | 'high' | 'medium';
  }[];

  // Risks
  risks: {
    risk: string;
    mitigation: string;
  }[];
}
