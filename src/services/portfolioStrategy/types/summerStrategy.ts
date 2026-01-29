/**
 * Summer Strategy Types
 *
 * Comprehensive type definitions for summer planning, program selection,
 * and strategic use of summer breaks throughout high school.
 *
 * Key Insight: Summers are the great equalizer. During the school year,
 * students are constrained by their school's offerings. During summer,
 * a student from a rural school can access the same opportunities as
 * one from a prep school. Strategic summer use is a major differentiator.
 *
 * Summer Progression:
 * - Summer after 9th: Exploration, local opportunities, skill building
 * - Summer after 10th: First competitive programs, deeper exploration
 * - Summer after 11th: CRITICAL - Most important summer, elite programs, spike maximization
 * - Summer before college: Gap year activities if applicable
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel } from './timeline';
import { SpikeArea } from './activityOptimization';

// ============================================================================
// SUMMER PROGRAM CLASSIFICATION
// ============================================================================

/**
 * Types of summer programs
 */
export type SummerProgramType =
  // Academic/Research
  | 'research_program'        // Research at university/lab
  | 'academic_enrichment'     // Academic courses/workshops
  | 'pre_college'             // Pre-college university programs
  | 'academic_competition_prep' // USABO camp, math olympiad prep

  // Arts
  | 'arts_intensive'          // Conservatory-style programs
  | 'arts_workshop'           // Shorter arts programs

  // STEM
  | 'stem_camp'               // General STEM
  | 'engineering_program'     // Engineering focus
  | 'cs_program'              // Computer science
  | 'science_olympiad'        // Science competition prep

  // Leadership/Service
  | 'leadership_program'      // Leadership development
  | 'service_trip'            // Service/volunteer abroad
  | 'civic_engagement'        // Government/policy programs

  // Sports
  | 'athletic_camp'           // Sports training
  | 'athletic_recruiting'     // Showcase events

  // Professional
  | 'internship'              // Professional internship
  | 'entrepreneurship'        // Business/startup programs

  // International
  | 'exchange_program'        // Study abroad
  | 'language_immersion'      // Language study

  // Independent
  | 'independent_project'     // Self-directed work
  | 'employment'              // Paid work
  | 'family_responsibilities' // Family obligations

  | 'other';

/**
 * Program selectivity tiers
 */
export type ProgramSelectivityTier =
  | 'elite'           // <5% acceptance rate (RSI, TASP, etc.)
  | 'highly_selective' // 5-15% acceptance
  | 'selective'        // 15-30% acceptance
  | 'competitive'      // 30-50% acceptance
  | 'moderately_competitive' // 50-70% acceptance
  | 'accessible';      // >70% acceptance or open enrollment

/**
 * Program prestige impact on application
 */
export type ProgramPrestigeImpact =
  | 'transformative'   // Major positive signal (RSI, etc.)
  | 'significant'      // Strong positive signal
  | 'notable'          // Positive signal
  | 'neutral'          // Neither helps nor hurts
  | 'potential_negative'; // "Pay to play" programs

/**
 * Program cost category
 */
export type ProgramCostCategory =
  | 'fully_funded'     // Free + stipend
  | 'free'             // No cost
  | 'subsidized'       // Partial cost
  | 'paid_moderate'    // $1000-$5000
  | 'paid_expensive'   // $5000-$10000
  | 'paid_very_expensive'; // $10000+

// ============================================================================
// SUMMER PROGRAM PROFILES
// ============================================================================

/**
 * Complete summer program profile
 */
export interface SummerProgramProfile {
  // Basic info
  programId: string;
  name: string;
  organization: string;
  type: SummerProgramType;
  url?: string;

  // Selectivity and prestige
  selectivity: ProgramSelectivityTier;
  prestigeImpact: ProgramPrestigeImpact;
  acceptanceRate?: number;
  applicantsPerYear?: number;

  // Logistics
  duration: {
    weeks: number;
    startDate?: string;
    endDate?: string;
  };
  location: {
    type: 'residential' | 'commuter' | 'online' | 'hybrid';
    city?: string;
    country?: string;
    institution?: string;
  };
  cost: {
    category: ProgramCostCategory;
    amount?: number;
    financialAidAvailable: boolean;
    stipendProvided?: number;
  };

  // Eligibility
  eligibility: {
    grades: GradeLevel[];
    ageRange?: { min: number; max: number };
    citizenshipRequired?: string[];
    gpaMinimum?: number;
    otherRequirements?: string[];
  };

  // Application
  application: {
    deadline: string;
    earlyDeadline?: string;
    components: ApplicationComponent[];
    notificationDate?: string;
    tips?: string[];
  };

  // Value assessment
  valueAssessment: {
    learningQuality: HarvardScoreDecimal;
    networkingValue: HarvardScoreDecimal;
    resumeImpact: HarvardScoreDecimal;
    overallValue: HarvardScoreDecimal;
    bestFor: string[];
    notRecommendedFor: string[];
  };

  // Alumni outcomes
  alumniOutcomes?: {
    collegesAttended: string[];
    notableAlumni: string[];
    successStories: string[];
  };
}

/**
 * Application components
 */
export type ApplicationComponent =
  | 'transcript'
  | 'test_scores'
  | 'essays'
  | 'recommendations'
  | 'portfolio'
  | 'audition'
  | 'interview'
  | 'resume'
  | 'project_proposal'
  | 'problem_set'
  | 'coding_challenge'
  | 'financial_aid_form';

// ============================================================================
// ELITE SUMMER PROGRAMS DATABASE
// ============================================================================

/**
 * Elite programs by category (acceptance rate <10%)
 */
export interface EliteProgramCategory {
  category: string;
  programs: {
    name: string;
    organization: string;
    acceptanceRate: string;
    grades: GradeLevel[];
    focus: string;
    whatMakesItElite: string;
    applicationTips: string[];
  }[];
}

/**
 * Known elite programs database
 */
export const ELITE_SUMMER_PROGRAMS: EliteProgramCategory[] = [
  {
    category: 'STEM Research',
    programs: [
      {
        name: 'Research Science Institute (RSI)',
        organization: 'MIT/CEE',
        acceptanceRate: '~3%',
        grades: ['11th'],
        focus: 'Research across STEM fields',
        whatMakesItElite: 'Most selective high school STEM program. Free. Produces Regeneron finalists regularly.',
        applicationTips: [
          'Strong STEM competition results help',
          'Research experience preferred but not required',
          'Essays should show intellectual curiosity and initiative',
          'Recommendations from research mentors ideal',
        ],
      },
      {
        name: 'TASP (Telluride Association Summer Program)',
        organization: 'Telluride Association',
        acceptanceRate: '~3-4%',
        grades: ['11th'],
        focus: 'Humanities/Social Sciences seminars',
        whatMakesItElite: 'Free. 6-week intellectual community. Creates Telluride House members.',
        applicationTips: [
          'Writing quality is paramount',
          'Show intellectual depth, not just achievement',
          'Interview is critical - prepare for deep discussion',
          'They want curious minds, not resume-stuffers',
        ],
      },
      {
        name: 'MOSTEC',
        organization: 'MIT',
        acceptanceRate: '~6%',
        grades: ['11th'],
        focus: 'Online STEM + campus week',
        whatMakesItElite: 'Free. For underrepresented students. Strong MIT pipeline.',
        applicationTips: [
          'Essays should demonstrate intellectual curiosity',
          'Highlight how you\'ve overcome challenges',
          'Strong STEM grades and activities help',
        ],
      },
      {
        name: 'SSP (Summer Science Program)',
        organization: 'SSP',
        acceptanceRate: '~10%',
        grades: ['11th'],
        focus: 'Astronomy, Biochemistry, or Genomics',
        whatMakesItElite: 'Free for those with need. Hands-on research. Strong alumni network.',
        applicationTips: [
          'Math skills are essential (physics/calc background)',
          'Essays should show passion for science',
          'Collaboration matters - they want team players',
        ],
      },
      {
        name: 'PROMYS',
        organization: 'Boston University',
        acceptanceRate: '~15%',
        grades: ['10th', '11th'],
        focus: 'Number theory mathematics',
        whatMakesItElite: 'Problem-set based selection. Creates math culture. Many students return as counselors.',
        applicationTips: [
          'Complete the problem set thoughtfully',
          'Process matters more than answers',
          'Show mathematical thinking style',
        ],
      },
      {
        name: 'ROSS',
        organization: 'Ohio State',
        acceptanceRate: '~10%',
        grades: ['10th', '11th'],
        focus: 'Number theory mathematics',
        whatMakesItElite: 'Similar to PROMYS. Strong math focus. "Think deeply about simple things."',
        applicationTips: [
          'Problem set is key',
          'Show persistence and creative thinking',
          'Quality of mathematical writing matters',
        ],
      },
    ],
  },
  {
    category: 'Humanities/Social Sciences',
    programs: [
      {
        name: 'TASP',
        organization: 'Telluride',
        acceptanceRate: '~3-4%',
        grades: ['11th'],
        focus: 'Critical thinking, humanities',
        whatMakesItElite: 'Free. Creates intellectual community. Pipeline to Telluride Houses at Cornell/Michigan.',
        applicationTips: [
          'Writing must be exceptional',
          'Show intellectual depth and genuine curiosity',
          'The interview is a real intellectual conversation',
        ],
      },
      {
        name: 'Telluride Sophomore Program (TASS)',
        organization: 'Telluride',
        acceptanceRate: '~5%',
        grades: ['10th'],
        focus: 'Critical Black Studies or Anti-Oppressive Studies',
        whatMakesItElite: 'Free. For sophomores. Entry point to Tellurie community.',
        applicationTips: [
          'Strong writing essential',
          'Demonstrate engagement with program themes',
          'Intellectual risk-taking valued',
        ],
      },
      {
        name: 'Iowa Young Writers\' Studio',
        organization: 'University of Iowa',
        acceptanceRate: '~15%',
        grades: ['10th', '11th'],
        focus: 'Creative writing',
        whatMakesItElite: 'Iowa Writers\' Workshop is #1 MFA program. Strong creative writing credential.',
        applicationTips: [
          'Writing sample is everything',
          'Show unique voice, not just technical skill',
          'Take creative risks',
        ],
      },
    ],
  },
  {
    category: 'Government/Policy',
    programs: [
      {
        name: 'Boys State / Girls State',
        organization: 'American Legion',
        acceptanceRate: 'Varies by state',
        grades: ['11th'],
        focus: 'Mock government, civics',
        whatMakesItElite: 'Free. Nomination-based. Shows civic engagement.',
        applicationTips: [
          'Get nominated through school or sponsor',
          'Show interest in government/civic life',
          'Leadership experience helps',
        ],
      },
      {
        name: 'Senate Page Program',
        organization: 'US Senate',
        acceptanceRate: '~5%',
        grades: ['11th'],
        focus: 'Work in US Senate',
        whatMakesItElite: 'Paid. Inside look at government. Rare opportunity.',
        applicationTips: [
          'Senator sponsorship required',
          'Strong academic record essential',
          'Demonstrated interest in government',
        ],
      },
    ],
  },
  {
    category: 'Arts',
    programs: [
      {
        name: 'Interlochen Arts Camp',
        organization: 'Interlochen',
        acceptanceRate: '~40%',
        grades: ['9th', '10th', '11th'],
        focus: 'Music, theater, dance, visual arts, writing',
        whatMakesItElite: 'Premier arts program. Division-based by skill. Strong network.',
        applicationTips: [
          'Audition/portfolio is primary',
          'Technical proficiency matters',
          'Show growth potential',
        ],
      },
      {
        name: 'Tanglewood BUTI',
        organization: 'Boston Symphony',
        acceptanceRate: '~20%',
        grades: ['10th', '11th', '12th'],
        focus: 'Classical music',
        whatMakesItElite: 'Train with BSO musicians. Serious pre-conservatory program.',
        applicationTips: [
          'Audition is paramount',
          'Technique and musicality both matter',
          'Be at appropriate level for the program',
        ],
      },
    ],
  },
];

// ============================================================================
// SUMMER PLANNING
// ============================================================================

/**
 * Grade-specific summer planning
 */
export interface SummerPlanningGuide {
  gradeLevel: GradeLevel;
  summerAfter: string;

  // What this summer is for
  purpose: string;
  importance: 'critical' | 'important' | 'foundational';

  // What to prioritize
  priorities: {
    priority: string;
    rationale: string;
    options: string[];
  }[];

  // Appropriate activities
  appropriateActivities: {
    activity: string;
    description: string;
    idealFor: string[];
    commitment: string;
  }[];

  // Programs to consider
  programRecommendations: {
    selectivityTier: ProgramSelectivityTier;
    programTypes: SummerProgramType[];
    examples: string[];
    applicationTimeline: string;
  }[];

  // What to avoid
  commonMistakes: {
    mistake: string;
    whyProblematic: string;
    betterAlternative: string;
  }[];

  // Timeline
  applicationTimeline: {
    month: string;
    action: string;
  }[];
}

/**
 * Grade-specific summer guides
 */
export const SUMMER_PLANNING_GUIDES: Record<GradeLevel, SummerPlanningGuide> = {
  '9th': {
    gradeLevel: '9th',
    summerAfter: 'Summer after freshman year',
    purpose: 'Exploration and skill-building. Try different things, develop interests.',
    importance: 'foundational',
    priorities: [
      { priority: 'Explore interests', rationale: 'Find what genuinely excites you', options: ['Local camps', 'Community programs', 'Volunteer work'] },
      { priority: 'Build skills', rationale: 'Foundation for later achievements', options: ['Music lessons', 'Sports training', 'Coding classes'] },
      { priority: 'Read widely', rationale: 'Intellectual development', options: ['Summer reading', 'Online courses', 'Documentaries'] },
    ],
    appropriateActivities: [
      { activity: 'Local day camps', description: 'Low-commitment exploration', idealFor: ['All students'], commitment: '1-2 weeks' },
      { activity: 'Community volunteering', description: 'Begin service foundation', idealFor: ['All students'], commitment: 'Ongoing' },
      { activity: 'Sports camps', description: 'Skill development', idealFor: ['Athletes'], commitment: '1-2 weeks' },
      { activity: 'Part-time job', description: 'Responsibility, money management', idealFor: ['Students who need/want income'], commitment: 'Flexible' },
      { activity: 'Family time', description: 'This is appropriate and good', idealFor: ['Everyone'], commitment: 'Some time' },
    ],
    programRecommendations: [
      { selectivityTier: 'accessible', programTypes: ['academic_enrichment', 'arts_workshop', 'stem_camp'], examples: ['Local university camps', 'Community programs'], applicationTimeline: 'Spring of freshman year' },
    ],
    commonMistakes: [
      { mistake: 'Expensive "pre-college" programs', whyProblematic: 'Pay-to-play programs don\'t help applications', betterAlternative: 'Free local programs or self-directed projects' },
      { mistake: 'Over-scheduling', whyProblematic: 'Freshman summer is for rest and exploration', betterAlternative: 'Leave unstructured time' },
      { mistake: 'Resume-building mindset', whyProblematic: 'Too early, leads to inauthenticity', betterAlternative: 'Genuine interest exploration' },
    ],
    applicationTimeline: [
      { month: 'March', action: 'Research local programs' },
      { month: 'April', action: 'Apply to programs of interest' },
      { month: 'May', action: 'Confirm plans, arrange logistics' },
    ],
  },
  '10th': {
    gradeLevel: '10th',
    summerAfter: 'Summer after sophomore year',
    purpose: 'Begin specialization. First competitive programs. Deeper exploration of interests.',
    importance: 'important',
    priorities: [
      { priority: 'First competitive program', rationale: 'Build toward elite opportunities', options: ['Governor\'s Schools', 'Regional programs', 'State programs'] },
      { priority: 'Deepen core interest', rationale: 'Start building spike', options: ['Research exploration', 'Intensive training', 'Projects'] },
      { priority: 'Develop independence', rationale: 'Maturity development', options: ['Travel', 'Work', 'Residential programs'] },
    ],
    appropriateActivities: [
      { activity: 'State Governor\'s Schools', description: 'Academic enrichment, selective', idealFor: ['Academically strong students'], commitment: '2-6 weeks' },
      { activity: 'Research exploration', description: 'Cold-email professors, explore labs', idealFor: ['STEM-interested students'], commitment: 'Flexible' },
      { activity: 'Pre-professional internship', description: 'Shadow, learn about fields', idealFor: ['Career-curious students'], commitment: '2-4 weeks' },
      { activity: 'Intensive arts programs', description: 'Deepen artistic skills', idealFor: ['Artists, musicians, performers'], commitment: '2-6 weeks' },
      { activity: 'Language immersion', description: 'Build fluency', idealFor: ['Language enthusiasts'], commitment: '4-8 weeks' },
    ],
    programRecommendations: [
      { selectivityTier: 'selective', programTypes: ['research_program', 'academic_enrichment', 'arts_intensive'], examples: ['Governor\'s Schools', 'Tanglewood', 'Pre-college programs at state schools'], applicationTimeline: 'Fall/Winter of sophomore year' },
      { selectivityTier: 'competitive', programTypes: ['pre_college', 'stem_camp'], examples: ['University pre-college (some)', 'Regional competitions prep'], applicationTimeline: 'Winter/Spring of sophomore year' },
    ],
    commonMistakes: [
      { mistake: 'Expensive pre-college programs', whyProblematic: 'Most are pay-to-play with little value', betterAlternative: 'Selective free programs or meaningful local work' },
      { mistake: 'Generic service trip', whyProblematic: 'Expensive, brief, low impact', betterAlternative: 'Sustained local service' },
      { mistake: 'Doing nothing', whyProblematic: 'Wasted opportunity', betterAlternative: 'At minimum, read/learn/explore' },
    ],
    applicationTimeline: [
      { month: 'September', action: 'Research programs, note deadlines' },
      { month: 'October-December', action: 'Apply to selective programs' },
      { month: 'January-March', action: 'Apply to remaining programs' },
      { month: 'April', action: 'Make decisions, confirm' },
    ],
  },
  '11th': {
    gradeLevel: '11th',
    summerAfter: 'Summer after junior year',
    purpose: 'CRITICAL SUMMER. Elite programs, spike maximization, essay preparation. Last summer to make impact.',
    importance: 'critical',
    priorities: [
      { priority: 'Elite program or research', rationale: 'Highest-impact opportunity', options: ['RSI', 'TASP', 'SSP', 'University research', 'High-level internship'] },
      { priority: 'Meaningful achievement', rationale: 'Last chance for major accomplishments', options: ['Complete research project', 'Competition preparation', 'Major initiative'] },
      { priority: 'Essay preparation', rationale: 'Must start before senior year', options: ['Brainstorm topics', 'Begin drafting', 'Reflect on experiences'] },
      { priority: 'College visits', rationale: 'Informed school list', options: ['Visit top choices', 'Research fit', 'Meet students/faculty'] },
    ],
    appropriateActivities: [
      { activity: 'Elite summer programs', description: 'RSI, TASP, SSP, etc.', idealFor: ['Top students in application pool'], commitment: '5-7 weeks' },
      { activity: 'Research with professor', description: 'Real research experience', idealFor: ['STEM students without elite program'], commitment: '6-10 weeks' },
      { activity: 'Internship at organization', description: 'Professional experience', idealFor: ['Non-STEM or applied interests'], commitment: '6-10 weeks' },
      { activity: 'Independent major project', description: 'Demonstrate initiative', idealFor: ['Self-starters with clear vision'], commitment: 'Summer-long' },
      { activity: 'Competition preparation', description: 'Olympiad, debate, etc.', idealFor: ['Competitors aiming for nationals'], commitment: 'Summer-long' },
    ],
    programRecommendations: [
      { selectivityTier: 'elite', programTypes: ['research_program', 'academic_enrichment'], examples: ['RSI', 'TASP', 'SSP', 'PROMYS', 'ROSS'], applicationTimeline: 'Fall/Winter of junior year' },
      { selectivityTier: 'highly_selective', programTypes: ['research_program', 'internship'], examples: ['SSTP', 'Clark Scholars', 'Garcia MRSEC'], applicationTimeline: 'January-March of junior year' },
    ],
    commonMistakes: [
      { mistake: 'Paid pre-college programs', whyProblematic: 'Last summer is too valuable for pay-to-play', betterAlternative: 'Research, meaningful work, or independent project' },
      { mistake: 'Vacation-only summer', whyProblematic: 'Wasting most important summer', betterAlternative: 'Balance meaningful work with rest' },
      { mistake: 'Unfocused activities', whyProblematic: 'Need depth, not breadth', betterAlternative: 'Commit deeply to one thing' },
      { mistake: 'Ignoring essays', whyProblematic: 'Senior fall is too late to start', betterAlternative: 'Brainstorm and draft in August' },
    ],
    applicationTimeline: [
      { month: 'September', action: 'Research elite programs, prepare for deadlines' },
      { month: 'October-November', action: 'RSI, TASP early deadlines' },
      { month: 'December-January', action: 'SSP, PROMYS, others' },
      { month: 'February-March', action: 'Research opportunities, internships' },
      { month: 'April', action: 'Finalize plans, backup options' },
    ],
  },
  '12th': {
    gradeLevel: '12th',
    summerAfter: 'Summer after senior year (pre-college)',
    purpose: 'Celebrate, prepare for college, potentially work.',
    importance: 'foundational',
    priorities: [
      { priority: 'Rest and celebrate', rationale: 'You earned it', options: ['Travel', 'Family time', 'Friends'] },
      { priority: 'Prepare for college', rationale: 'Practical readiness', options: ['Shopping', 'Reading', 'Pre-orientation'] },
      { priority: 'Work if needed', rationale: 'Financial preparation', options: ['Summer job', 'Saving money'] },
    ],
    appropriateActivities: [
      { activity: 'Travel', description: 'See the world before college', idealFor: ['Everyone'], commitment: 'Flexible' },
      { activity: 'Summer job', description: 'Earn money for college', idealFor: ['Everyone'], commitment: 'Flexible' },
      { activity: 'Pre-orientation programs', description: 'Get to know college', idealFor: ['Incoming freshmen'], commitment: '1-2 weeks' },
    ],
    programRecommendations: [],
    commonMistakes: [
      { mistake: 'Doing nothing educational', whyProblematic: 'Actually fine this summer', betterAlternative: 'Enjoy yourself' },
    ],
    applicationTimeline: [],
  },
  'gap_year': {
    gradeLevel: 'gap_year',
    summerAfter: 'Gap year planning',
    purpose: 'Structured, meaningful gap year with clear purpose.',
    importance: 'critical',
    priorities: [
      { priority: 'Clear purpose', rationale: 'Gap year must have intent', options: ['Work', 'Travel with purpose', 'Project', 'Service'] },
      { priority: 'Growth and challenge', rationale: 'Must demonstrate development', options: ['New skills', 'Independence', 'Meaningful contribution'] },
    ],
    appropriateActivities: [
      { activity: 'Full-time work', description: 'Professional experience', idealFor: ['Career exploration'], commitment: 'Year-long' },
      { activity: 'Service program', description: 'City Year, AmeriCorps, etc.', idealFor: ['Service-oriented students'], commitment: 'Year-long' },
      { activity: 'Travel with purpose', description: 'Not just tourism', idealFor: ['Globally curious students'], commitment: '3-6 months' },
      { activity: 'Major project', description: 'Book, business, research', idealFor: ['Self-directed students'], commitment: 'Year-long' },
    ],
    programRecommendations: [
      { selectivityTier: 'selective', programTypes: ['service_trip', 'exchange_program'], examples: ['City Year', 'Americorps', 'Gap year programs'], applicationTimeline: 'Year before gap year' },
    ],
    commonMistakes: [
      { mistake: 'Unstructured gap year', whyProblematic: 'Admissions wants to see purpose', betterAlternative: 'Clear plan with goals' },
      { mistake: 'Just traveling', whyProblematic: 'Tourism isn\'t growth', betterAlternative: 'Travel with service or study' },
    ],
    applicationTimeline: [],
  },
  'transfer': {
    gradeLevel: 'transfer',
    summerAfter: 'Summer as college student',
    purpose: 'Prepare transfer applications, meaningful activity.',
    importance: 'important',
    priorities: [
      { priority: 'Transfer application prep', rationale: 'Essays and materials', options: ['Essay drafting', 'Research target schools'] },
      { priority: 'College-level activity', rationale: 'Show college engagement', options: ['Research', 'Internship', 'Project'] },
    ],
    appropriateActivities: [
      { activity: 'Research with professor', description: 'Academic engagement', idealFor: ['STEM transfers'], commitment: 'Summer-long' },
      { activity: 'Internship', description: 'Professional experience', idealFor: ['All transfers'], commitment: 'Summer-long' },
    ],
    programRecommendations: [],
    commonMistakes: [
      { mistake: 'Only focusing on transfer apps', whyProblematic: 'Need to show continued growth', betterAlternative: 'Balance prep with meaningful activity' },
    ],
    applicationTimeline: [],
  },
};

// ============================================================================
// RESEARCH OPPORTUNITY TYPES
// ============================================================================

/**
 * Research opportunity assessment
 */
export interface ResearchOpportunity {
  // Basic info
  type: 'university_lab' | 'independent' | 'program' | 'remote' | 'industry';
  field: string;
  institution?: string;

  // Quality indicators
  quality: {
    mentorship: HarvardScoreDecimal;
    learningPotential: HarvardScoreDecimal;
    publicationPotential: HarvardScoreDecimal;
    resumeImpact: HarvardScoreDecimal;
    overall: HarvardScoreDecimal;
  };

  // Logistics
  logistics: {
    duration: string;
    hoursPerWeek: number;
    paid: boolean;
    stipend?: number;
    inPerson: boolean;
    location?: string;
  };

  // Outcomes
  expectedOutcomes: {
    skills: string[];
    deliverables: string[];
    potentialRecognition: string[];
  };
}

/**
 * How to find research opportunities
 */
export interface ResearchOpportunityGuide {
  // Cold emailing strategy
  coldEmailStrategy: {
    when: string;
    howManyToSend: number;
    responseRate: string;
    emailTemplate: string;
    followUpStrategy: string;
    tips: string[];
  };

  // Formal programs
  formalPrograms: {
    name: string;
    selectivity: ProgramSelectivityTier;
    deadline: string;
    description: string;
  }[];

  // What to look for
  qualityIndicators: string[];
  redFlags: string[];
}

// ============================================================================
// INTERNSHIP GUIDANCE
// ============================================================================

/**
 * Internship opportunity assessment
 */
export interface InternshipOpportunity {
  type: 'corporate' | 'nonprofit' | 'startup' | 'government' | 'small_business';
  field: string;
  organization?: string;

  // Quality assessment
  quality: {
    learningValue: HarvardScoreDecimal;
    responsibilityLevel: HarvardScoreDecimal;
    brandRecognition: HarvardScoreDecimal;
    networkingValue: HarvardScoreDecimal;
    overall: HarvardScoreDecimal;
  };

  // What makes it valuable
  valueProposition: {
    skills: string[];
    responsibilities: string[];
    deliverables: string[];
  };

  // Logistics
  logistics: {
    paid: boolean;
    hourlyRate?: number;
    duration: string;
    fullTime: boolean;
  };
}

/**
 * How to find internships for high schoolers
 */
export interface InternshipFindingGuide {
  // Where to look
  sources: {
    source: string;
    description: string;
    successRate: string;
  }[];

  // How to apply
  applicationStrategy: {
    step: string;
    details: string;
    tips: string[];
  }[];

  // Making your own opportunity
  creatingOpportunities: {
    approach: string;
    example: string;
    tipsForSuccess: string[];
  }[];
}

// ============================================================================
// SUMMER STRATEGY OUTPUT
// ============================================================================

/**
 * Personalized summer strategy recommendation
 */
export interface SummerStrategyRecommendation {
  gradeLevel: GradeLevel;
  studentContext: {
    intendedMajor?: string;
    spikeArea?: SpikeArea;
    financialConstraints: boolean;
    geographicConstraints: string[];
    currentProfileStrength: HarvardScoreDecimal;
  };

  // Recommended approach
  recommendedApproach: {
    focus: string;
    rationale: string;
    expectedImpact: string;
  };

  // Tiered recommendations
  recommendations: {
    tier: 'reach' | 'target' | 'safety';
    options: {
      option: string;
      type: SummerProgramType;
      description: string;
      applicationRequirements: string[];
      deadline?: string;
      fitScore: HarvardScoreDecimal;
      rationale: string;
    }[];
  }[];

  // Timeline
  actionTimeline: {
    month: string;
    action: string;
    deadline?: string;
  }[];

  // Backup plan
  backupPlan: {
    scenario: string;
    action: string;
  }[];

  // What to avoid
  thingsToAvoid: string[];

  // Success metrics
  successMetrics: {
    metric: string;
    target: string;
  }[];
}

/**
 * Summer activity evaluation
 */
export interface SummerActivityEvaluation {
  activity: string;
  type: SummerProgramType;

  // Evaluation
  evaluation: {
    learningValue: HarvardScoreDecimal;
    resumeImpact: HarvardScoreDecimal;
    spikeAlignment: HarvardScoreDecimal;
    uniqueness: HarvardScoreDecimal;
    overall: HarvardScoreDecimal;
  };

  // Assessment
  assessment: {
    strengths: string[];
    weaknesses: string[];
    howAdmissionsWillSeeIt: string;
    comparedToAlternatives: string;
  };

  // Recommendations
  howToMaximize: string[];
}
