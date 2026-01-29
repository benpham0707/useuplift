/**
 * Major-Specific Guidance Types
 *
 * Comprehensive type definitions for guidance tailored to intended major.
 * Different majors have different expectations, activities that matter,
 * and ways to demonstrate passion and preparation.
 *
 * Key Insight: A future pre-med student and a future CS student should
 * build very different profiles, even if attending the same schools.
 * Generic advice fails; major-specific guidance succeeds.
 *
 * This system provides:
 * - What activities matter for each major
 * - How to demonstrate passion authentically
 * - What courses to take
 * - What competitions/programs exist
 * - Common mistakes by intended major
 * - How to position yourself for competitive programs
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel } from './timeline';
import { ActivityCategory, ActivityTier } from './activities';
import { SummerProgramType, ProgramSelectivityTier } from './summerStrategy';

// ============================================================================
// MAJOR CLASSIFICATION
// ============================================================================

/**
 * Major categories for guidance
 */
export type MajorCategory =
  // STEM
  | 'computer_science'
  | 'engineering'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'neuroscience'
  | 'environmental_science'
  | 'data_science'

  // Pre-Professional
  | 'pre_med'
  | 'pre_law'
  | 'pre_business'
  | 'nursing'

  // Social Sciences
  | 'economics'
  | 'political_science'
  | 'psychology'
  | 'sociology'
  | 'international_relations'
  | 'public_policy'

  // Humanities
  | 'english'
  | 'history'
  | 'philosophy'
  | 'classics'
  | 'religious_studies'
  | 'linguistics'

  // Arts
  | 'visual_arts'
  | 'music'
  | 'theater'
  | 'film'
  | 'dance'
  | 'architecture'
  | 'design'

  // Communications
  | 'journalism'
  | 'communications'
  | 'media_studies'

  // Other
  | 'education'
  | 'undecided'
  | 'other';

/**
 * Major competitiveness at selective schools
 */
export type MajorCompetitiveness =
  | 'extremely_competitive'  // CS at CMU, Engineering at MIT
  | 'highly_competitive'     // Most STEM at top schools
  | 'competitive'           // Standard competitiveness
  | 'less_competitive'      // Often easier admits (humanities at some schools)
  | 'varies';               // Depends heavily on school

// ============================================================================
// MAJOR-SPECIFIC GUIDANCE
// ============================================================================

/**
 * Complete guidance for a specific major
 */
export interface MajorSpecificGuidance {
  majorCategory: MajorCategory;
  displayName: string;
  description: string;

  // Competitiveness context
  competitiveness: {
    level: MajorCompetitiveness;
    context: string;
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    applicantPoolSize: 'large' | 'medium' | 'small';
  };

  // What matters for this major
  whatMatters: {
    academicPriorities: {
      priority: string;
      importance: 'essential' | 'important' | 'helpful';
      explanation: string;
    }[];
    activityPriorities: {
      activityType: string;
      importance: 'essential' | 'important' | 'helpful';
      explanation: string;
      examples: string[];
    }[];
    characterTraits: string[];
    whatAdmissionsLooksFor: string[];
  };

  // Recommended courses
  courseRecommendations: {
    essential: CourseRecommendation[];
    recommended: CourseRecommendation[];
    helpful: CourseRecommendation[];
    courseLoadExpectations: string;
  };

  // Activity recommendations
  activityRecommendations: {
    highImpact: ActivityRecommendation[];
    goodOptions: ActivityRecommendation[];
    toAvoid: {
      activity: string;
      whyToAvoid: string;
    }[];
  };

  // Key competitions/programs
  keyOpportunities: {
    competitions: OpportunityProfile[];
    programs: OpportunityProfile[];
    awards: OpportunityProfile[];
  };

  // Essay guidance for this major
  essayGuidance: {
    whatToConvey: string[];
    strongTopics: string[];
    weakTopics: string[];
    pitfalls: string[];
    sampleAngle: string;
  };

  // Common mistakes
  commonMistakes: {
    mistake: string;
    whyProblematic: string;
    betterApproach: string;
  }[];

  // Profile archetypes that work
  successfulArchetypes: {
    archetype: string;
    description: string;
    keyElements: string[];
    exampleProfile: string;
  }[];

  // School-specific considerations
  schoolConsiderations: {
    schoolType: string;
    whatTheyWant: string;
    howToPosition: string;
  }[];
}

/**
 * Course recommendation
 */
export interface CourseRecommendation {
  course: string;
  alternatives: string[];
  when: GradeLevel[];
  notes: string;
}

/**
 * Activity recommendation for a major
 */
export interface ActivityRecommendation {
  activity: string;
  category: ActivityCategory;
  whyItMatters: string;
  howToExcel: string[];
  expectedTier: ActivityTier;
  examples: string[];
}

/**
 * Competition/program/award profile
 */
export interface OpportunityProfile {
  name: string;
  type: 'competition' | 'program' | 'award' | 'certification';
  selectivity: ProgramSelectivityTier;
  deadline?: string;
  description: string;
  impactOnApplication: HarvardScoreDecimal;
  howToQualify: string[];
  website?: string;
}

// ============================================================================
// MAJOR-SPECIFIC GUIDANCE DATABASE
// ============================================================================

/**
 * Computer Science guidance
 */
export const CS_GUIDANCE: MajorSpecificGuidance = {
  majorCategory: 'computer_science',
  displayName: 'Computer Science',
  description: 'One of the most competitive majors at top schools. Requires demonstrated technical skill AND intellectual curiosity beyond just coding.',

  competitiveness: {
    level: 'extremely_competitive',
    context: 'CS acceptance rates at schools like CMU, MIT, Stanford, Berkeley are often 2-5x harder than overall rate',
    trendDirection: 'increasing',
    applicantPoolSize: 'large',
  },

  whatMatters: {
    academicPriorities: [
      { priority: 'Strong math foundation', importance: 'essential', explanation: 'Calc BC, Linear Algebra, ideally some proofs' },
      { priority: 'AP CS A (minimum)', importance: 'essential', explanation: 'Basic requirement, not differentiator' },
      { priority: 'Physics (mechanics)', importance: 'important', explanation: 'Shows quantitative breadth' },
      { priority: 'Beyond AP curriculum', importance: 'helpful', explanation: 'College CS courses, algorithms, ML' },
    ],
    activityPriorities: [
      { activityType: 'Meaningful projects', importance: 'essential', explanation: 'Build things people actually use', examples: ['Open source contributions', 'Apps with real users', 'Research tools'] },
      { activityType: 'Competitions', importance: 'important', explanation: 'USACO, hackathons, math competitions', examples: ['USACO Gold+', 'Major hackathon wins', 'AMC/AIME'] },
      { activityType: 'Research', importance: 'helpful', explanation: 'Especially in AI/ML, systems, theory', examples: ['University lab research', 'Published paper'] },
      { activityType: 'Teaching/sharing', importance: 'helpful', explanation: 'Shows mastery and communication', examples: ['CS tutoring', 'YouTube tutorials', 'Blog'] },
    ],
    characterTraits: ['Intellectual curiosity', 'Problem-solving mindset', 'Persistence', 'Collaboration'],
    whatAdmissionsLooksFor: [
      'Genuine love of computing, not just career interest',
      'Evidence of self-directed learning',
      'Projects that solve real problems',
      'Depth beyond classroom requirements',
      'Ability to explain technical concepts clearly',
    ],
  },

  courseRecommendations: {
    essential: [
      { course: 'AP Computer Science A', alternatives: [], when: ['10th', '11th'], notes: 'Take early, not differentiating' },
      { course: 'AP Calculus BC', alternatives: ['AP Calculus AB'], when: ['11th'], notes: 'BC preferred' },
    ],
    recommended: [
      { course: 'AP Physics C (Mechanics)', alternatives: ['AP Physics 1'], when: ['11th', '12th'], notes: 'Shows quantitative ability' },
      { course: 'AP Statistics', alternatives: ['Dual enrollment stats'], when: ['11th', '12th'], notes: 'Useful for data science angle' },
      { course: 'Multivariable Calculus', alternatives: ['Linear Algebra'], when: ['12th'], notes: 'If available' },
    ],
    helpful: [
      { course: 'AP CS Principles', alternatives: [], when: ['9th', '10th'], notes: 'Only if no other CS option' },
      { course: 'Discrete Mathematics', alternatives: [], when: ['12th'], notes: 'College-level, shows initiative' },
    ],
    courseLoadExpectations: 'Most competitive CS applicants have 8-12 APs including all available math/science',
  },

  activityRecommendations: {
    highImpact: [
      {
        activity: 'USACO (USA Computing Olympiad)',
        category: 'academic_competition',
        whyItMatters: 'Gold indicator of algorithm mastery, Platinum is rare achievement',
        howToExcel: ['Start training by 9th/10th grade', 'Solve problems daily on Codeforces', 'Learn algorithms systematically'],
        expectedTier: 1,
        examples: ['USACO Platinum', 'USACO Gold'],
      },
      {
        activity: 'Significant open source contribution',
        category: 'stem_project',
        whyItMatters: 'Shows real-world coding and collaboration',
        howToExcel: ['Contribute to established projects', 'Fix real bugs', 'Add meaningful features', 'Engage with community'],
        expectedTier: 1,
        examples: ['Merged PRs in major projects', 'Own project with 1000+ stars'],
      },
      {
        activity: 'Research with professor',
        category: 'research',
        whyItMatters: 'Demonstrates ability to work on frontier problems',
        howToExcel: ['Cold email thoughtfully', 'Propose specific interests', 'Be reliable and communicative'],
        expectedTier: 2,
        examples: ['ML research at university', 'Systems research publication'],
      },
    ],
    goodOptions: [
      {
        activity: 'Hackathon participation',
        category: 'stem_project',
        whyItMatters: 'Shows ability to build under pressure',
        howToExcel: ['Win or place at major hackathons', 'Build something novel', 'Continue projects after'],
        expectedTier: 2,
        examples: ['HackMIT winner', 'TreeHacks top prize'],
      },
      {
        activity: 'App/website with users',
        category: 'stem_project',
        whyItMatters: 'Evidence of practical impact',
        howToExcel: ['Solve real problem', 'Get real users (100+)', 'Iterate based on feedback'],
        expectedTier: 2,
        examples: ['School schedule app used by 500 students', 'Tool adopted by organization'],
      },
      {
        activity: 'CS club leadership',
        category: 'leadership_governance',
        whyItMatters: 'Community building and teaching',
        howToExcel: ['Grow membership significantly', 'Organize competitions', 'Teach effectively'],
        expectedTier: 3,
        examples: ['Founded coding club', 'President of CS club'],
      },
    ],
    toAvoid: [
      { activity: 'Only taking CS classes', whyToAvoid: 'Need to show intellectual breadth' },
      { activity: 'Generic "coding boot camp"', whyToAvoid: 'Doesn\'t demonstrate depth or initiative' },
      { activity: 'Gaming presented as CS interest', whyToAvoid: 'Playing games ≠ building them' },
    ],
  },

  keyOpportunities: {
    competitions: [
      { name: 'USACO', type: 'competition', selectivity: 'highly_selective', description: 'USA Computing Olympiad - Gold/Platinum is significant', impactOnApplication: 1.5, howToQualify: ['Pass online contests', 'Advance through divisions'] },
      { name: 'Google Code Jam', type: 'competition', selectivity: 'highly_selective', description: 'Global competition', impactOnApplication: 2.0, howToQualify: ['Online rounds', 'Advance to later stages'] },
    ],
    programs: [
      { name: 'RSI (if CS focus)', type: 'program', selectivity: 'elite', description: 'Top STEM program', impactOnApplication: 1.0, howToQualify: ['Apply in fall of junior year', 'Strong STEM record'] },
      { name: 'Google CSSI', type: 'program', selectivity: 'selective', description: 'Google summer program', impactOnApplication: 2.5, howToQualify: ['Apply in spring', 'Show coding interest'] },
    ],
    awards: [
      { name: 'Congressional App Challenge', type: 'award', selectivity: 'competitive', description: 'District-level app competition', impactOnApplication: 3.0, howToQualify: ['Build app', 'Submit through congressman'] },
    ],
  },

  essayGuidance: {
    whatToConvey: [
      'Why CS specifically, not just tech/money',
      'How you think about problems',
      'Impact you want to make',
      'Intellectual curiosity beyond code',
    ],
    strongTopics: [
      'How building something changed your thinking',
      'A problem you became obsessed with solving',
      'Teaching others and what you learned',
      'Connecting CS to another passion',
    ],
    weakTopics: [
      'I want to work at Google',
      'Coding since age 5 (generic origin story)',
      'List of languages I know',
      'Gaming leading to CS interest (cliché)',
    ],
    pitfalls: [
      'Being too technical without showing personality',
      'Focusing on career goals over genuine interest',
      'Not showing intellectual breadth',
    ],
    sampleAngle: 'Instead of "I love coding," try "When I built [X], I realized that the most interesting problems aren\'t technical - they\'re about understanding what people actually need."',
  },

  commonMistakes: [
    { mistake: 'Only demonstrating coding ability', whyProblematic: 'Everyone can code; show thinking and impact', betterApproach: 'Build things that solve real problems for real people' },
    { mistake: 'Listing many programming languages', whyProblematic: 'Breadth without depth', betterApproach: 'Show mastery in context through projects' },
    { mistake: 'Generic CS camp attendance', whyProblematic: 'Low signal', betterApproach: 'Self-directed projects or competitive programs' },
    { mistake: 'Neglecting non-CS activities', whyProblematic: 'Shows one-dimensionality', betterApproach: 'Have genuine interests outside CS' },
  ],

  successfulArchetypes: [
    {
      archetype: 'The Builder',
      description: 'Creates tools people actually use',
      keyElements: ['Significant project with users', 'Problem-solving focus', 'Iteration based on feedback'],
      exampleProfile: 'Built scheduling app used by 3 schools, open-sourced code, speaks at local meetups',
    },
    {
      archetype: 'The Competitor',
      description: 'Excels at algorithmic problem-solving',
      keyElements: ['USACO Gold/Platinum', 'Math Olympiad success', 'Competitive programming'],
      exampleProfile: 'USACO Platinum, AIME qualifier, teaches algorithms to younger students',
    },
    {
      archetype: 'The Researcher',
      description: 'Works on frontier problems',
      keyElements: ['University research', 'Publication or significant findings', 'Deep technical knowledge'],
      exampleProfile: 'ML research at Stanford lab, paper under review, presents at symposiums',
    },
  ],

  schoolConsiderations: [
    { schoolType: 'MIT/Stanford/CMU', whatTheyWant: 'Technical excellence + intellectual curiosity + impact', howToPosition: 'Lead with most impressive technical achievement, show breadth' },
    { schoolType: 'Ivy League', whatTheyWant: 'Technical ability + liberal arts fit + leadership', howToPosition: 'Emphasize CS as part of broader intellectual life' },
    { schoolType: 'State flagships', whatTheyWant: 'Strong academics + meaningful projects', howToPosition: 'Clear CS focus with good grades' },
  ],
};

/**
 * Pre-Med guidance
 */
export const PREMED_GUIDANCE: MajorSpecificGuidance = {
  majorCategory: 'pre_med',
  displayName: 'Pre-Med / Biology (Medical Track)',
  description: 'Not a major itself, but a track. Focus on demonstrating genuine care for others, intellectual curiosity about medicine, and ability to handle rigor.',

  competitiveness: {
    level: 'highly_competitive',
    context: 'Many applicants, but differentiation comes through clinical experience and genuine care',
    trendDirection: 'stable',
    applicantPoolSize: 'large',
  },

  whatMatters: {
    academicPriorities: [
      { priority: 'Strong GPA in sciences', importance: 'essential', explanation: 'Pre-med requires maintaining high GPA through college' },
      { priority: 'AP Biology', importance: 'essential', explanation: 'Foundation for pre-med' },
      { priority: 'AP Chemistry', importance: 'essential', explanation: 'Required for med school prerequisites' },
      { priority: 'AP Physics', importance: 'important', explanation: 'Part of MCAT prep' },
    ],
    activityPriorities: [
      { activityType: 'Clinical volunteering', importance: 'essential', explanation: 'Exposure to patient care', examples: ['Hospital volunteering', 'Clinic shadowing', 'EMT certification'] },
      { activityType: 'Research', importance: 'important', explanation: 'Increasingly expected', examples: ['Wet lab research', 'Clinical research', 'Epidemiology'] },
      { activityType: 'Service to underserved', importance: 'important', explanation: 'Shows genuine commitment', examples: ['Free clinic volunteering', 'Health education'] },
      { activityType: 'Leadership in health', importance: 'helpful', explanation: 'Running programs, not just participating', examples: ['Health club president', 'Founded health initiative'] },
    ],
    characterTraits: ['Empathy', 'Resilience', 'Communication', 'Scientific curiosity', 'Service orientation'],
    whatAdmissionsLooksFor: [
      'Genuine interest in helping people, not just prestige of MD',
      'Understanding of healthcare challenges',
      'Ability to handle intense academics',
      'Evidence of persistence through difficulty',
      'Meaningful (not resume-stuffing) clinical experience',
    ],
  },

  courseRecommendations: {
    essential: [
      { course: 'AP Biology', alternatives: ['Honors Biology'], when: ['10th', '11th'], notes: 'Foundation for pre-med' },
      { course: 'AP Chemistry', alternatives: ['Honors Chemistry'], when: ['10th', '11th'], notes: 'Required for med prerequisites' },
    ],
    recommended: [
      { course: 'AP Physics 1 or C', alternatives: [], when: ['11th', '12th'], notes: 'Part of MCAT' },
      { course: 'AP Calculus', alternatives: [], when: ['11th'], notes: 'Required for most pre-med tracks' },
      { course: 'AP Psychology', alternatives: [], when: ['11th', '12th'], notes: 'Part of new MCAT' },
    ],
    helpful: [
      { course: 'AP Statistics', alternatives: [], when: ['12th'], notes: 'Useful for research' },
      { course: 'Anatomy & Physiology', alternatives: [], when: ['12th'], notes: 'If available' },
    ],
    courseLoadExpectations: 'Strong science foundation but don\'t neglect humanities - med schools want well-rounded applicants',
  },

  activityRecommendations: {
    highImpact: [
      {
        activity: 'Sustained hospital/clinic volunteering',
        category: 'community_service',
        whyItMatters: 'Direct patient interaction, understanding healthcare',
        howToExcel: ['200+ hours', 'Same location over 2+ years', 'Meaningful patient stories', 'Reflect on experiences'],
        expectedTier: 2,
        examples: ['ER volunteering 200hrs', 'Free clinic regular volunteer'],
      },
      {
        activity: 'Research (ideally clinical)',
        category: 'research',
        whyItMatters: 'Increasingly expected for med school',
        howToExcel: ['Find mentor', 'Contribute meaningfully', 'Aim for publication or presentation'],
        expectedTier: 2,
        examples: ['Cancer research lab', 'Public health research'],
      },
      {
        activity: 'Health-focused initiative',
        category: 'community_service',
        whyItMatters: 'Shows leadership and initiative',
        howToExcel: ['Found or significantly grow program', 'Measure impact', 'Sustain beyond yourself'],
        expectedTier: 2,
        examples: ['Founded health education program', 'Mental health awareness initiative'],
      },
    ],
    goodOptions: [
      {
        activity: 'EMT certification',
        category: 'work_experience',
        whyItMatters: 'Real clinical responsibility',
        howToExcel: ['Get certified', 'Log significant hours', 'Reflect on experiences'],
        expectedTier: 2,
        examples: ['Active EMT on volunteer squad'],
      },
      {
        activity: 'Biology/Science Olympiad',
        category: 'academic_competition',
        whyItMatters: 'Demonstrates academic excellence',
        howToExcel: ['Place at state/nationals', 'Focus on bio/chem events'],
        expectedTier: 2,
        examples: ['Science Olympiad state medalist'],
      },
    ],
    toAvoid: [
      { activity: 'Shadowing only', whyToAvoid: 'Passive observation, no engagement' },
      { activity: 'One-week medical mission trips', whyToAvoid: 'Seen as resume-stuffing, often ethically questionable' },
      { activity: 'Pre-med clubs without action', whyToAvoid: 'Many are just meeting groups' },
    ],
  },

  keyOpportunities: {
    competitions: [
      { name: 'Science Olympiad', type: 'competition', selectivity: 'competitive', description: 'Biology/chemistry events', impactOnApplication: 2.5, howToQualify: ['School team', 'State/nationals'] },
      { name: 'USABO', type: 'competition', selectivity: 'highly_selective', description: 'USA Biology Olympiad', impactOnApplication: 1.5, howToQualify: ['Open exam', 'Advance through rounds'] },
    ],
    programs: [
      { name: 'NIH Summer Internship', type: 'program', selectivity: 'selective', description: 'Research at NIH', impactOnApplication: 2.0, howToQualify: ['Apply in fall', 'Strong grades'] },
      { name: 'HOSA', type: 'program', selectivity: 'accessible', description: 'Health Occupations Students of America', impactOnApplication: 3.5, howToQualify: ['Join chapter', 'Compete'] },
    ],
    awards: [
      { name: 'HOSA competition awards', type: 'award', selectivity: 'competitive', description: 'State/national HOSA', impactOnApplication: 3.0, howToQualify: ['Compete in events'] },
    ],
  },

  essayGuidance: {
    whatToConvey: [
      'Genuine care for people, not just science',
      'Understanding of healthcare challenges',
      'Specific experiences that confirmed interest',
      'Intellectual curiosity about medicine',
    ],
    strongTopics: [
      'Meaningful patient interaction that taught you something',
      'How you helped someone in need',
      'Grappling with healthcare inequity',
      'Research that connected to human impact',
    ],
    weakTopics: [
      'Grandparent got sick (unless with genuine insight)',
      'I want to help people (too generic)',
      'Doctors saved my life (focus on you, not them)',
      'I\'m good at science (not about calling)',
    ],
    pitfalls: [
      'Sounding like every other pre-med',
      'Focusing on prestige of medicine',
      'Not showing intellectual curiosity',
      'Generic service without reflection',
    ],
    sampleAngle: 'Instead of "I want to be a doctor to help people," try "Sitting with Mrs. Johnson during her chemo, I realized that medicine isn\'t just about the treatment - it\'s about being present when someone is most afraid."',
  },

  commonMistakes: [
    { mistake: 'Only clinical activities', whyProblematic: 'Shows tunnel vision', betterApproach: 'Have meaningful non-medical interests too' },
    { mistake: 'Shallow volunteering hours', whyProblematic: '50 hours at 5 places < 200 hours at 1 place', betterApproach: 'Depth over breadth' },
    { mistake: 'No research', whyProblematic: 'Increasingly expected', betterApproach: 'Find research opportunity by junior year' },
    { mistake: 'Claiming certainty about specialty', whyProblematic: 'Sounds naive', betterApproach: 'Show openness to exploration' },
  ],

  successfulArchetypes: [
    {
      archetype: 'The Compassionate Scientist',
      description: 'Combines research excellence with patient care',
      keyElements: ['Strong research', 'Meaningful clinical experience', 'Connection between the two'],
      exampleProfile: 'Cancer research at university + 2 years hospital volunteering + founded peer support group',
    },
    {
      archetype: 'The Health Advocate',
      description: 'Focuses on systemic health issues',
      keyElements: ['Health policy/education work', 'Community impact', 'Understanding of social determinants'],
      exampleProfile: 'Founded health education program in underserved area + policy advocacy + clinic volunteering',
    },
  ],

  schoolConsiderations: [
    { schoolType: 'Schools with BS/MD programs', whatTheyWant: 'Certainty about medicine + maturity + excellence', howToPosition: 'Emphasize commitment, show you\'ve explored thoroughly' },
    { schoolType: 'Research universities', whatTheyWant: 'Research ability + clinical interest', howToPosition: 'Strong research narrative with clinical context' },
    { schoolType: 'Liberal arts colleges', whatTheyWant: 'Intellectual breadth + genuine care', howToPosition: 'Pre-med as part of broader intellectual life' },
  ],
};

/**
 * Economics guidance
 */
export const ECONOMICS_GUIDANCE: MajorSpecificGuidance = {
  majorCategory: 'economics',
  displayName: 'Economics / Business',
  description: 'Quantitative social science with applications to business, policy, and finance. Shows analytical thinking and real-world impact orientation.',

  competitiveness: {
    level: 'highly_competitive',
    context: 'Very popular at top schools, especially those with strong finance/consulting pipelines',
    trendDirection: 'stable',
    applicantPoolSize: 'large',
  },

  whatMatters: {
    academicPriorities: [
      { priority: 'Strong math', importance: 'essential', explanation: 'Economics is increasingly quantitative' },
      { priority: 'AP Economics (Macro & Micro)', importance: 'important', explanation: 'Shows specific interest' },
      { priority: 'Statistics', importance: 'important', explanation: 'Key for econometrics' },
      { priority: 'Writing skills', importance: 'helpful', explanation: 'Economics involves lots of writing' },
    ],
    activityPriorities: [
      { activityType: 'Economics/business competition', importance: 'important', explanation: 'Demonstrates applied interest', examples: ['FBLA', 'Economics Challenge', 'Stock market competitions'] },
      { activityType: 'Entrepreneurship', importance: 'helpful', explanation: 'Real-world application', examples: ['Started business', 'Social enterprise'] },
      { activityType: 'Investment/finance club', importance: 'helpful', explanation: 'If genuine, not resume padding', examples: ['Investment club with real portfolio'] },
      { activityType: 'Research in economics', importance: 'helpful', explanation: 'Shows academic depth', examples: ['Research with economist', 'Original research project'] },
    ],
    characterTraits: ['Analytical thinking', 'Quantitative ability', 'Communication', 'Interest in how the world works'],
    whatAdmissionsLooksFor: [
      'Intellectual curiosity about economic questions',
      'Ability to think critically about complex systems',
      'Strong quantitative skills',
      'Not just "I want to go into finance"',
      'Evidence of analytical thinking',
    ],
  },

  courseRecommendations: {
    essential: [
      { course: 'AP Calculus BC', alternatives: ['AP Calculus AB'], when: ['11th'], notes: 'BC preferred' },
    ],
    recommended: [
      { course: 'AP Microeconomics', alternatives: [], when: ['11th', '12th'], notes: 'Show specific interest' },
      { course: 'AP Macroeconomics', alternatives: [], when: ['11th', '12th'], notes: 'Complete picture' },
      { course: 'AP Statistics', alternatives: [], when: ['11th', '12th'], notes: 'Important for econometrics' },
    ],
    helpful: [
      { course: 'AP US History/World History', alternatives: [], when: ['10th', '11th'], notes: 'Context for economic history' },
      { course: 'Multivariable Calculus', alternatives: [], when: ['12th'], notes: 'If available' },
    ],
    courseLoadExpectations: 'Strong across board with math emphasis',
  },

  activityRecommendations: {
    highImpact: [
      {
        activity: 'National Economics Challenge',
        category: 'academic_competition',
        whyItMatters: 'Direct demonstration of economics knowledge',
        howToExcel: ['Study economics content deeply', 'Practice quiz bowl format', 'Nationals placement'],
        expectedTier: 2,
        examples: ['National finalist', 'State champion'],
      },
      {
        activity: 'Started actual business',
        category: 'entrepreneurship',
        whyItMatters: 'Applied economics in action',
        howToExcel: ['Generate real revenue', 'Solve real problem', 'Learn from challenges'],
        expectedTier: 2,
        examples: ['E-commerce business', 'Service business', 'App with revenue'],
      },
      {
        activity: 'Economics research',
        category: 'research',
        whyItMatters: 'Shows academic depth',
        howToExcel: ['Work with economist', 'Original data analysis', 'Present findings'],
        expectedTier: 2,
        examples: ['Research on local economic issue', 'Policy analysis'],
      },
    ],
    goodOptions: [
      {
        activity: 'FBLA/DECA',
        category: 'academic_competition',
        whyItMatters: 'Business/economics competition experience',
        howToExcel: ['Nationals qualifier', 'Multiple events'],
        expectedTier: 3,
        examples: ['DECA ICDC finalist'],
      },
      {
        activity: 'Investment club',
        category: 'leadership_governance',
        whyItMatters: 'Applied interest in markets',
        howToExcel: ['Manage real portfolio', 'Research-driven decisions', 'Track record'],
        expectedTier: 3,
        examples: ['Investment club managing $10K+ portfolio'],
      },
    ],
    toAvoid: [
      { activity: 'Generic "business club"', whyToAvoid: 'Often lacks substance' },
      { activity: 'Stock trading games only', whyToAvoid: 'Too common, no differentiation' },
      { activity: 'Finance internship from connections only', whyToAvoid: 'Perceived as privilege without merit' },
    ],
  },

  keyOpportunities: {
    competitions: [
      { name: 'National Economics Challenge', type: 'competition', selectivity: 'competitive', description: 'Economics quiz competition', impactOnApplication: 2.5, howToQualify: ['Regional competition', 'Advance to nationals'] },
      { name: 'DECA ICDC', type: 'competition', selectivity: 'competitive', description: 'Business competition', impactOnApplication: 3.0, howToQualify: ['State competition', 'Qualify for ICDC'] },
    ],
    programs: [
      { name: 'Economics summer programs', type: 'program', selectivity: 'selective', description: 'Summer economics study', impactOnApplication: 2.5, howToQualify: ['Apply to selective programs'] },
    ],
    awards: [],
  },

  essayGuidance: {
    whatToConvey: [
      'Intellectual curiosity about how economies work',
      'Ability to think about tradeoffs and systems',
      'Interest beyond just making money',
      'How you see economics connecting to real problems',
    ],
    strongTopics: [
      'Economic question you became obsessed with understanding',
      'How you applied economic thinking to a real situation',
      'Business you started and what it taught you',
      'Economic issue affecting your community',
    ],
    weakTopics: [
      'I want to work on Wall Street',
      'I\'m good at math so I\'ll do econ',
      'My parents are in business',
      'I want to make money',
    ],
    pitfalls: [
      'Sounding purely career-focused',
      'Not showing intellectual depth',
      'Generic interest in "business"',
    ],
    sampleAngle: 'Instead of "I want to study economics to work in finance," try "When the local factory closed, I wanted to understand why economic forces could devastate a community - and whether better policy could have prevented it."',
  },

  commonMistakes: [
    { mistake: 'Only career-focused motivation', whyProblematic: 'Admissions wants intellectual curiosity', betterApproach: 'Show genuine interest in economic questions' },
    { mistake: 'Neglecting quantitative skills', whyProblematic: 'Economics is increasingly math-heavy', betterApproach: 'Strong math coursework' },
    { mistake: '"Business" without economics understanding', whyProblematic: 'Lacks depth', betterApproach: 'Show understanding of economic principles' },
  ],

  successfulArchetypes: [
    {
      archetype: 'The Entrepreneur',
      description: 'Started something real, learned from it',
      keyElements: ['Real business/initiative', 'Revenue or significant impact', 'Lessons learned'],
      exampleProfile: 'Started tutoring company, managed 10 tutors, $20K revenue, learned about pricing/scaling',
    },
    {
      archetype: 'The Policy Wonk',
      description: 'Interested in economics for social good',
      keyElements: ['Policy research', 'Civic engagement', 'Understanding of economic tradeoffs'],
      exampleProfile: 'Research on minimum wage effects + advocacy for policy change + Economics Challenge finalist',
    },
  ],

  schoolConsiderations: [
    { schoolType: 'Wharton/Stern/Ross', whatTheyWant: 'Entrepreneurship + leadership + analytical skills', howToPosition: 'Business achievements with leadership' },
    { schoolType: 'Research universities', whatTheyWant: 'Academic interest in economics + quantitative skills', howToPosition: 'Research orientation with real-world applications' },
    { schoolType: 'Liberal arts', whatTheyWant: 'Intellectual curiosity + breadth', howToPosition: 'Economics as one of many intellectual interests' },
  ],
};

// ============================================================================
// MAJOR GUIDANCE UTILITIES
// ============================================================================

/**
 * Get guidance for a specific major
 */
export function getMajorGuidance(major: MajorCategory): MajorSpecificGuidance | null {
  const guidanceMap: Partial<Record<MajorCategory, MajorSpecificGuidance>> = {
    computer_science: CS_GUIDANCE,
    pre_med: PREMED_GUIDANCE,
    biology: PREMED_GUIDANCE, // Similar guidance
    economics: ECONOMICS_GUIDANCE,
    pre_business: ECONOMICS_GUIDANCE, // Similar guidance
  };

  return guidanceMap[major] || null;
}

/**
 * Major fit assessment
 */
export interface MajorFitAssessment {
  major: MajorCategory;
  studentProfile: {
    courses: string[];
    activities: string[];
    interests: string[];
    grades: string;
  };

  // Fit analysis
  fitScore: HarvardScoreDecimal;
  fitLevel: 'strong' | 'moderate' | 'weak';

  // Evidence
  supportingEvidence: {
    element: string;
    strength: 'strong' | 'moderate' | 'weak';
    notes: string;
  }[];
  gaps: {
    gap: string;
    severity: 'critical' | 'significant' | 'minor';
    howToAddress: string;
  }[];

  // Credibility assessment
  credibilityAssessment: {
    score: HarvardScoreDecimal;
    narrative: string;
    strengtheningSuggestions: string[];
  };

  // Recommendations
  recommendations: {
    priority: number;
    recommendation: string;
    rationale: string;
    timeline: string;
  }[];
}

/**
 * Major exploration guidance for undecided students
 */
export interface MajorExplorationGuidance {
  // What to explore
  suggestedExplorations: {
    major: MajorCategory;
    whyConsider: string;
    howToExplore: string[];
    signalsOfFit: string[];
  }[];

  // How to explore
  explorationStrategies: {
    strategy: string;
    description: string;
    timeline: string;
  }[];

  // What to avoid
  mistakes: {
    mistake: string;
    whyProblematic: string;
    betterApproach: string;
  }[];

  // Timeline for deciding
  decisionTimeline: {
    grade: GradeLevel;
    focus: string;
    milestone: string;
  }[];
}
