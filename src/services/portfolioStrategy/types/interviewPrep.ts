/**
 * Interview Preparation Types
 *
 * Comprehensive type definitions for college interview preparation.
 * Interviews vary significantly by school - from required evaluative interviews
 * at Georgetown to optional alumni chats at Harvard.
 *
 * Key Insight: Interviews rarely make an application, but can break one.
 * The goal is to seem genuine, thoughtful, and well-matched to the school.
 *
 * This system provides:
 * - School-specific interview requirements and formats
 * - Common question preparation
 * - Answer frameworks for different question types
 * - Red flags and how to avoid them
 * - Mock interview guidance
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';

// ============================================================================
// INTERVIEW CLASSIFICATION
// ============================================================================

/**
 * Types of college interviews
 */
export type InterviewType =
  | 'alumni'              // Off-campus with graduate
  | 'admissions'          // On-campus with AO
  | 'faculty'             // With professor
  | 'student'             // With current student
  | 'group'               // Group interview/discussion
  | 'video'               // Recorded video (Kira, etc.)
  | 'written';            // Written responses

/**
 * Interview requirement level
 */
export type InterviewRequirement =
  | 'required'            // Must do it
  | 'strongly_recommended' // Basically required
  | 'recommended'         // Should do if offered
  | 'optional'            // Can request but not necessary
  | 'not_offered';        // School doesn't do interviews

/**
 * Interview format
 */
export type InterviewFormat =
  | 'in_person'
  | 'video_call'
  | 'phone'
  | 'recorded_video'
  | 'hybrid';

/**
 * Interview evaluation impact
 */
export type InterviewImpact =
  | 'evaluative'          // Actively factors into decision
  | 'informational'       // Primarily for student's benefit
  | 'mixed';              // Both evaluative and informational

// ============================================================================
// SCHOOL INTERVIEW PROFILES
// ============================================================================

/**
 * School-specific interview profile
 */
export interface SchoolInterviewProfile {
  schoolName: string;
  requirement: InterviewRequirement;
  type: InterviewType;
  format: InterviewFormat[];
  impact: InterviewImpact;

  // Logistics
  logistics: {
    duration: string;              // e.g., "30-45 minutes"
    scheduling: string;            // How to schedule
    deadline?: string;             // Request deadline
    availability: string;          // When interviews are offered
    geographicAvailability: string; // Where interviewers are available
  };

  // What to expect
  expectations: {
    dressCode: string;
    preparation: string;
    questionsToExpect: string[];
    whatTheyEvaluate: string[];
    redFlags: string[];
  };

  // Tips
  tips: string[];
  warnings: string[];
}

/**
 * Sample school interview profiles
 */
export const SCHOOL_INTERVIEW_PROFILES: SchoolInterviewProfile[] = [
  {
    schoolName: 'Harvard',
    requirement: 'recommended',
    type: 'alumni',
    format: ['in_person', 'video_call'],
    impact: 'mixed',
    logistics: {
      duration: '30-45 minutes',
      scheduling: 'Interviewer contacts you after application',
      availability: 'November-February',
      geographicAvailability: 'Most US locations, some international',
    },
    expectations: {
      dressCode: 'Smart casual',
      preparation: 'Know your application, research Harvard',
      questionsToExpect: ['Tell me about yourself', 'Why Harvard?', 'What would you contribute?'],
      whatTheyEvaluate: ['Intellectual curiosity', 'Character', 'Fit', 'Communication'],
      redFlags: ['Arrogance', 'Lack of genuine interest', 'Can\'t explain activities'],
    },
    tips: ['Be conversational', 'Ask thoughtful questions', 'Show genuine curiosity'],
    warnings: ['Don\'t memorize answers', 'Don\'t bring parents'],
  },
  {
    schoolName: 'Georgetown',
    requirement: 'required',
    type: 'alumni',
    format: ['in_person', 'video_call'],
    impact: 'evaluative',
    logistics: {
      duration: '45-60 minutes',
      scheduling: 'Request through portal after application',
      deadline: 'Request by December 1 for EA, January 10 for RD',
      availability: 'October-February',
      geographicAvailability: 'Most US locations',
    },
    expectations: {
      dressCode: 'Business casual',
      preparation: 'Know Georgetown specifically, have thoughtful questions',
      questionsToExpect: ['Why Georgetown?', 'Why your major?', 'Ethical dilemma discussion'],
      whatTheyEvaluate: ['Communication', 'Intellectual engagement', 'Fit with Georgetown values'],
      redFlags: ['Not knowing about Georgetown', 'Lack of intellectual curiosity', 'Arrogance'],
    },
    tips: ['Research Georgetown\'s Jesuit values', 'Prepare for substantive conversation', 'Have specific reasons for Georgetown'],
    warnings: ['This interview really matters', 'Don\'t be generic about "DC location"'],
  },
  {
    schoolName: 'MIT',
    requirement: 'strongly_recommended',
    type: 'alumni',
    format: ['in_person', 'video_call'],
    impact: 'evaluative',
    logistics: {
      duration: '45-60 minutes',
      scheduling: 'Educational Counselor contacts you',
      availability: 'November-January',
      geographicAvailability: 'Most US locations, many international',
    },
    expectations: {
      dressCode: 'Casual - MIT is informal',
      preparation: 'Know your technical projects deeply, understand MIT culture',
      questionsToExpect: ['Tell me about a project', 'Why MIT?', 'What do you do for fun?'],
      whatTheyEvaluate: ['Technical depth', 'Curiosity', 'Collaboration', 'Fit with culture'],
      redFlags: ['Can\'t explain technical work', 'Too serious/no personality', 'Only cares about prestige'],
    },
    tips: ['Be ready to go deep on technical projects', 'Show your personality', 'Ask about interviewer\'s MIT experience'],
    warnings: ['Don\'t be intimidated - ECs are friendly', 'Don\'t oversell or undersell'],
  },
];

// ============================================================================
// QUESTION TYPES AND PREPARATION
// ============================================================================

/**
 * Interview question categories
 */
export type QuestionCategory =
  | 'tell_me_about_yourself'
  | 'why_this_school'
  | 'why_this_major'
  | 'academic_interests'
  | 'extracurricular_deep_dive'
  | 'challenge_failure'
  | 'ethical_dilemma'
  | 'current_events'
  | 'future_goals'
  | 'strengths_weaknesses'
  | 'contribution'
  | 'questions_for_interviewer'
  | 'creative_unusual';

/**
 * Prepared answer for interview question
 */
export interface PreparedAnswer {
  questionCategory: QuestionCategory;
  specificQuestion: string;

  // Answer structure
  answer: {
    opening: string;           // Hook/setup (10-15 seconds)
    body: string;              // Main content (1-2 minutes)
    conclusion: string;        // Wrap-up/connection (10-15 seconds)
    totalTime: string;
  };

  // Key points to hit
  keyPoints: string[];

  // Variations
  shortVersion: string;        // 30-second version
  longVersion: string;         // 3-minute version if probed

  // Connection to school
  schoolConnection?: string;

  // Practice notes
  practiceNotes: {
    tone: string;
    pacing: string;
    keyPhrases: string[];
    avoidPhrases: string[];
  };
}

/**
 * Answer framework by question type
 */
export interface AnswerFramework {
  questionCategory: QuestionCategory;
  description: string;

  // Framework structure
  structure: {
    component: string;
    purpose: string;
    timeAllocation: string;
    tips: string[];
  }[];

  // Example questions
  exampleQuestions: string[];

  // Do's and don'ts
  dos: string[];
  donts: string[];

  // Example answer outline
  exampleOutline: string;
}

/**
 * Common question frameworks
 */
export const QUESTION_FRAMEWORKS: Record<QuestionCategory, AnswerFramework> = {
  tell_me_about_yourself: {
    questionCategory: 'tell_me_about_yourself',
    description: 'Your elevator pitch - who you are beyond your resume',
    structure: [
      { component: 'Hook', purpose: 'Interesting opening that captures attention', timeAllocation: '10-15 seconds', tips: ['Start with something memorable', 'Avoid "My name is..."'] },
      { component: 'Theme', purpose: 'Your central interest/passion', timeAllocation: '30-45 seconds', tips: ['Connect your activities', 'Show passion'] },
      { component: 'Examples', purpose: '2-3 specific examples', timeAllocation: '60-90 seconds', tips: ['Be specific', 'Show impact'] },
      { component: 'Future', purpose: 'Where this leads', timeAllocation: '15-20 seconds', tips: ['Connect to school/major', 'Show vision'] },
    ],
    exampleQuestions: ['Tell me about yourself', 'Walk me through your background', 'What should I know about you?'],
    dos: ['Show passion', 'Be specific', 'Connect themes', 'Be authentic'],
    donts: ['Read your resume', 'Be too long', 'Be generic', 'Start with name/school'],
    exampleOutline: 'Hook about defining moment → Core passion with 2-3 examples → How this connects to future goals at [school]',
  },

  why_this_school: {
    questionCategory: 'why_this_school',
    description: 'Why you and this school are a good match',
    structure: [
      { component: 'Specific Reason', purpose: 'Something unique to this school', timeAllocation: '30 seconds', tips: ['Not rankings/prestige', 'Could only be true of this school'] },
      { component: 'Connection to You', purpose: 'Why it matters to YOU', timeAllocation: '45 seconds', tips: ['Connect to your interests', 'Be personal'] },
      { component: 'What You\'ll Do', purpose: 'Specific plans at this school', timeAllocation: '30 seconds', tips: ['Name professors/programs', 'Be specific'] },
      { component: 'What You\'ll Contribute', purpose: 'What you bring', timeAllocation: '15 seconds', tips: ['Don\'t be arrogant', 'Be genuine'] },
    ],
    exampleQuestions: ['Why [school]?', 'What interests you about [school]?', 'Why would you be a good fit?'],
    dos: ['Be specific', 'Show research', 'Connect to your story', 'Name specific resources'],
    donts: ['Rankings/prestige', 'Location only', 'Vague answers', 'Same answer for every school'],
    exampleOutline: 'Specific program/professor → Why that matters to your interests → What you\'d do with it → What unique perspective you bring',
  },

  why_this_major: {
    questionCategory: 'why_this_major',
    description: 'Your intellectual journey to this field',
    structure: [
      { component: 'Origin Story', purpose: 'When/how interest developed', timeAllocation: '30 seconds', tips: ['Specific moment', 'Not "since I was 5"'] },
      { component: 'Deep Dive', purpose: 'How you\'ve explored it', timeAllocation: '45 seconds', tips: ['Activities, reading, projects', 'Show depth'] },
      { component: 'Current Understanding', purpose: 'What you know about the field', timeAllocation: '30 seconds', tips: ['Show sophistication', 'Mention current issues'] },
      { component: 'Future Goals', purpose: 'Where you want to go', timeAllocation: '15 seconds', tips: ['Be specific but not rigid', 'Show openness'] },
    ],
    exampleQuestions: ['Why computer science?', 'What draws you to engineering?', 'Why do you want to study economics?'],
    dos: ['Show genuine passion', 'Demonstrate depth', 'Connect to experiences', 'Show sophistication'],
    donts: ['Job/salary focus', '"I\'ve always been good at it"', 'Parent influence', 'Vague interest'],
    exampleOutline: 'Specific moment that sparked interest → How you\'ve explored it → What you understand about the field → What questions you want to explore',
  },

  academic_interests: {
    questionCategory: 'academic_interests',
    description: 'Your intellectual passions and how you pursue them',
    structure: [
      { component: 'Interest Area', purpose: 'What intellectually excites you', timeAllocation: '30 seconds', tips: ['Be specific', 'Show genuine curiosity'] },
      { component: 'Exploration', purpose: 'How you\'ve pursued this interest', timeAllocation: '45 seconds', tips: ['Classes, books, projects', 'Show initiative'] },
      { component: 'Questions', purpose: 'What you want to learn more about', timeAllocation: '30 seconds', tips: ['Show intellectual depth', 'Specific questions'] },
      { component: 'Connection', purpose: 'How this connects to your broader goals', timeAllocation: '15 seconds', tips: ['Connect to major/career', 'Show thoughtfulness'] },
    ],
    exampleQuestions: ['What\'s the last book you read?', 'What do you like to learn about outside of class?', 'What intellectual topic fascinates you?'],
    dos: ['Show genuine curiosity', 'Be specific about topics', 'Demonstrate depth', 'Connect to your story'],
    donts: ['Pick something just to impress', 'Be vague', 'Only mention required reading', 'Not know what you\'re talking about'],
    exampleOutline: 'Specific intellectual interest → How you\'ve explored it independently → Questions you still have → How it connects to your academic path',
  },

  extracurricular_deep_dive: {
    questionCategory: 'extracurricular_deep_dive',
    description: 'Explaining your most significant activity in depth',
    structure: [
      { component: 'Context', purpose: 'What it is and your role', timeAllocation: '20 seconds', tips: ['Assume they know nothing', 'Be clear'] },
      { component: 'Your Contribution', purpose: 'What you specifically did', timeAllocation: '45 seconds', tips: ['Be specific', 'Show initiative'] },
      { component: 'Impact', purpose: 'Results and growth', timeAllocation: '30 seconds', tips: ['Quantify if possible', 'Show learning'] },
      { component: 'Meaning', purpose: 'Why it matters to you', timeAllocation: '25 seconds', tips: ['Be genuine', 'Connect to values'] },
    ],
    exampleQuestions: ['Tell me about your research', 'What do you do as club president?', 'Describe your volunteer work'],
    dos: ['Go deep on impact', 'Show your specific role', 'Be passionate', 'Know your numbers'],
    donts: ['List activities', 'Be vague about role', 'Exaggerate', 'Forget the why'],
    exampleOutline: 'What the activity is → Your specific role/contribution → Measurable impact → What it means to you personally',
  },

  challenge_failure: {
    questionCategory: 'challenge_failure',
    description: 'How you handle adversity and learn from mistakes',
    structure: [
      { component: 'Situation', purpose: 'Set up the challenge', timeAllocation: '30 seconds', tips: ['Be honest', 'Real challenge, not humble brag'] },
      { component: 'Your Response', purpose: 'What you did', timeAllocation: '45 seconds', tips: ['Show agency', 'Be specific'] },
      { component: 'Outcome', purpose: 'What happened', timeAllocation: '15 seconds', tips: ['Honest outcome', 'Doesn\'t have to be perfect'] },
      { component: 'Learning', purpose: 'What you took away', timeAllocation: '30 seconds', tips: ['Genuine insight', 'How you\'ve applied it'] },
    ],
    exampleQuestions: ['Tell me about a failure', 'Describe a challenge you faced', 'What\'s something you struggled with?'],
    dos: ['Be genuine', 'Take responsibility', 'Show growth', 'Apply learning forward'],
    donts: ['Humble brag', 'Blame others', 'Choose trivial example', 'No real reflection'],
    exampleOutline: 'Real challenge you faced → Honest account of your response → What actually happened → Genuine lesson learned and how you\'ve applied it',
  },

  ethical_dilemma: {
    questionCategory: 'ethical_dilemma',
    description: 'How you think through complex moral questions',
    structure: [
      { component: 'Understanding', purpose: 'Show you grasp complexity', timeAllocation: '20 seconds', tips: ['Acknowledge nuance', 'Don\'t oversimplify'] },
      { component: 'Perspectives', purpose: 'Consider multiple views', timeAllocation: '40 seconds', tips: ['Steel man other sides', 'Show empathy'] },
      { component: 'Your View', purpose: 'Where you land', timeAllocation: '30 seconds', tips: ['Take a position', 'Justify it'] },
      { component: 'Humility', purpose: 'Acknowledge uncertainty', timeAllocation: '15 seconds', tips: ['Show openness', 'Avoid arrogance'] },
    ],
    exampleQuestions: ['What do you think about [controversial topic]?', 'Describe an ethical dilemma you faced', 'How would you handle [scenario]?'],
    dos: ['Show nuanced thinking', 'Consider multiple perspectives', 'Take a position', 'Stay open-minded'],
    donts: ['Be preachy', 'Be dogmatic', 'Avoid taking a position', 'Ignore complexity'],
    exampleOutline: 'Acknowledge the complexity → Present multiple perspectives fairly → State your view with reasoning → Show openness to other views',
  },

  current_events: {
    questionCategory: 'current_events',
    description: 'Your awareness of and engagement with the world',
    structure: [
      { component: 'Awareness', purpose: 'Show you follow the news', timeAllocation: '15 seconds', tips: ['Know basics of major stories', 'Don\'t pretend to know more than you do'] },
      { component: 'Analysis', purpose: 'Your thoughtful take', timeAllocation: '45 seconds', tips: ['Go beyond headlines', 'Show critical thinking'] },
      { component: 'Connection', purpose: 'Why it matters to you', timeAllocation: '20 seconds', tips: ['Connect to your interests', 'Be genuine'] },
    ],
    exampleQuestions: ['What\'s something in the news that interests you?', 'What current issue do you care about?', 'What would you change about the world?'],
    dos: ['Be informed', 'Think critically', 'Connect to your interests', 'Show nuance'],
    donts: ['Be uninformed', 'Be preachy', 'Be too political', 'Have no opinion'],
    exampleOutline: 'Current issue that genuinely interests you → Your thoughtful analysis → Why it matters to you and connects to your interests',
  },

  future_goals: {
    questionCategory: 'future_goals',
    description: 'Your vision for your future',
    structure: [
      { component: 'Vision', purpose: 'Where you want to be', timeAllocation: '30 seconds', tips: ['Be specific but not rigid', 'Show ambition'] },
      { component: 'Path', purpose: 'How you\'ll get there', timeAllocation: '30 seconds', tips: ['Show you\'ve thought about it', 'Include college role'] },
      { component: 'Why', purpose: 'What drives this goal', timeAllocation: '30 seconds', tips: ['Connect to values', 'Be genuine'] },
      { component: 'Flexibility', purpose: 'Openness to change', timeAllocation: '10 seconds', tips: ['Show you\'re not rigid', 'Curious about other paths'] },
    ],
    exampleQuestions: ['Where do you see yourself in 10 years?', 'What do you want to do after college?', 'What impact do you want to have?'],
    dos: ['Show vision', 'Be genuine', 'Connect to experiences', 'Stay open'],
    donts: ['Be too rigid', 'Be generic', 'Focus only on career', 'Say "I don\'t know"'],
    exampleOutline: 'Specific vision (not rigid) → How college/major connects → Why this matters to you → Openness to evolution',
  },

  strengths_weaknesses: {
    questionCategory: 'strengths_weaknesses',
    description: 'Self-awareness about your abilities',
    structure: [
      { component: 'Strength', purpose: 'Genuine strength with example', timeAllocation: '40 seconds', tips: ['Not arrogant', 'Specific example'] },
      { component: 'Weakness', purpose: 'Real weakness, addressed', timeAllocation: '40 seconds', tips: ['Genuine weakness', 'Show self-awareness', 'Show improvement'] },
    ],
    exampleQuestions: ['What are your strengths?', 'What\'s a weakness?', 'What would your friends say about you?'],
    dos: ['Be genuine', 'Give examples', 'Show self-awareness', 'Show growth'],
    donts: ['Humble brag', '"I work too hard"', 'No real weakness', 'No effort to improve'],
    exampleOutline: 'Real strength with specific example → Real weakness with honest acknowledgment → What you\'re doing about it',
  },

  contribution: {
    questionCategory: 'contribution',
    description: 'What you\'ll add to campus community',
    structure: [
      { component: 'Unique Perspective', purpose: 'What makes you different', timeAllocation: '30 seconds', tips: ['Genuine uniqueness', 'Not arrogant'] },
      { component: 'Specific Plans', purpose: 'What you\'ll do', timeAllocation: '30 seconds', tips: ['Research campus orgs', 'Be specific'] },
      { component: 'Community Value', purpose: 'How others benefit', timeAllocation: '20 seconds', tips: ['Not just about you', 'Show you\'ll engage'] },
    ],
    exampleQuestions: ['What would you contribute to our campus?', 'How would you get involved?', 'What perspective would you bring?'],
    dos: ['Be specific', 'Show research', 'Be genuine', 'Think about community'],
    donts: ['Be arrogant', 'Be vague', 'Only talk about yourself', 'Make claims you can\'t back up'],
    exampleOutline: 'Unique perspective you bring → Specific ways you\'d get involved → How the community benefits',
  },

  questions_for_interviewer: {
    questionCategory: 'questions_for_interviewer',
    description: 'Thoughtful questions that show genuine interest',
    structure: [
      { component: 'Personal Question', purpose: 'About their experience', timeAllocation: 'Variable', tips: ['Show genuine curiosity', 'Let them talk'] },
      { component: 'School-Specific Question', purpose: 'Shows research', timeAllocation: 'Variable', tips: ['Not easily Googleable', 'Shows depth'] },
    ],
    exampleQuestions: ['Do you have any questions for me?', 'What would you like to know?'],
    dos: ['Ask thoughtful questions', 'Show research', 'Be curious about their experience', 'Listen well'],
    donts: ['Ask nothing', 'Ask basic questions', 'Ask about admissions', 'Monopolize remaining time'],
    exampleOutline: '2-3 questions ready: one about their experience, one showing research, one about specific interest',
  },

  creative_unusual: {
    questionCategory: 'creative_unusual',
    description: 'Unexpected questions that test thinking on feet',
    structure: [
      { component: 'Pause', purpose: 'Take a moment', timeAllocation: '5-10 seconds', tips: ['It\'s okay to think', 'Don\'t panic'] },
      { component: 'Engage', purpose: 'Show thought process', timeAllocation: 'Variable', tips: ['Think out loud', 'Be genuine', 'Have fun'] },
    ],
    exampleQuestions: ['If you could have dinner with anyone, who?', 'What would you do with $1 million?', 'What\'s a book that changed your thinking?'],
    dos: ['Think out loud', 'Be genuine', 'Have fun', 'Show personality'],
    donts: ['Panic', 'Give canned answer', 'Be boring', 'Overthink it'],
    exampleOutline: 'Take a breath → Think out loud → Give genuine, thoughtful answer that shows who you are',
  },
};

// ============================================================================
// INTERVIEW ASSESSMENT
// ============================================================================

/**
 * Interview readiness assessment
 */
export interface InterviewReadinessAssessment {
  overallReadiness: HarvardScoreDecimal;

  // By category
  categoryReadiness: {
    category: QuestionCategory;
    readiness: HarvardScoreDecimal;
    preparedAnswers: boolean;
    practiceNeeded: boolean;
    notes: string;
  }[];

  // School-specific readiness
  schoolReadiness: {
    school: string;
    readiness: HarvardScoreDecimal;
    specificKnowledge: boolean;
    interviewScheduled: boolean;
    practiceNeeded: string[];
  }[];

  // Areas of strength
  strengths: string[];

  // Areas needing work
  areasToImprove: {
    area: string;
    currentLevel: HarvardScoreDecimal;
    targetLevel: HarvardScoreDecimal;
    howToImprove: string[];
  }[];

  // Practice recommendations
  practiceRecommendations: {
    priority: number;
    activity: string;
    description: string;
    timeNeeded: string;
  }[];
}

/**
 * Mock interview evaluation
 */
export interface MockInterviewEvaluation {
  date: string;
  interviewer: string;
  school: string;
  duration: string;

  // Overall scores
  overallScore: HarvardScoreDecimal;
  likelyImpact: 'help' | 'neutral' | 'hurt';

  // Category scores
  categoryScores: {
    category: QuestionCategory;
    score: HarvardScoreDecimal;
    questionAsked: string;
    strengths: string[];
    improvements: string[];
  }[];

  // Communication assessment
  communication: {
    clarity: HarvardScoreDecimal;
    conciseness: HarvardScoreDecimal;
    engagement: HarvardScoreDecimal;
    authenticity: HarvardScoreDecimal;
    enthusiasm: HarvardScoreDecimal;
  };

  // Red flags identified
  redFlagsObserved: {
    flag: string;
    severity: 'critical' | 'moderate' | 'minor';
    howToFix: string;
  }[];

  // Overall feedback
  overallFeedback: string;
  topStrengths: string[];
  topImprovements: string[];
  actionItems: string[];
}

// ============================================================================
// INTERVIEW BEST PRACTICES
// ============================================================================

/**
 * General interview best practices
 */
export const INTERVIEW_BEST_PRACTICES = {
  before: [
    'Research the school thoroughly',
    'Prepare answers for common questions',
    'Practice with someone who will give honest feedback',
    'Prepare thoughtful questions for the interviewer',
    'Know your application inside and out',
    'Confirm logistics (time, location/platform, interviewer name)',
    'Get good sleep the night before',
  ],
  during: [
    'Arrive 5-10 minutes early',
    'Make eye contact and smile',
    'Listen carefully before answering',
    'Be conversational, not robotic',
    'Be specific with examples',
    'Ask clarifying questions if needed',
    'Show genuine curiosity and enthusiasm',
    'Thank the interviewer at the end',
  ],
  after: [
    'Send thank-you email within 24 hours',
    'Note what went well and what to improve',
    'Don\'t obsess over perceived mistakes',
    'Prepare for next interview based on learnings',
  ],
  avoid: [
    'Memorizing answers word-for-word',
    'Being late',
    'Checking your phone',
    'Speaking negatively about others',
    'Lying or exaggerating',
    'Not having questions prepared',
    'Being arrogant or dismissive',
    'Bringing parents into the interview space',
  ],
};

/**
 * Red flags interviewers look for
 */
export const INTERVIEWER_RED_FLAGS = [
  { flag: 'Cannot explain activities on application', severity: 'critical' as const, description: 'If you did it, you should be able to talk about it' },
  { flag: 'Generic answers that could apply to any school', severity: 'moderate' as const, description: 'Shows lack of genuine interest' },
  { flag: 'Arrogance or condescension', severity: 'critical' as const, description: 'Nobody wants this person on campus' },
  { flag: 'Lack of intellectual curiosity', severity: 'moderate' as const, description: 'College is about learning' },
  { flag: 'Parents hovering or involved', severity: 'moderate' as const, description: 'Suggests lack of independence' },
  { flag: 'Negative about current school or teachers', severity: 'moderate' as const, description: 'Suggests difficult personality' },
  { flag: 'Seeming coached or inauthentic', severity: 'moderate' as const, description: 'Interviewers can tell' },
  { flag: 'Not asking any questions', severity: 'minor' as const, description: 'Suggests lack of genuine interest' },
];
