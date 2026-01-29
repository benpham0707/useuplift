/**
 * Comprehensive Academic Course Standards Database
 *
 * Deep calibration for:
 * 1. AP course difficulty tiers with pass rates
 * 2. Course level hierarchy and weights
 * 3. Course sequencing requirements by major
 * 4. Subject-specific rigor expectations
 * 5. Dual enrollment quality tiers
 * 6. International curriculum conversions
 *
 * Based on extensive research from:
 * - College Board data
 * - Admissions officer interviews
 * - Institutional data (Harvard, MIT, Stanford, Yale)
 * - NACAC surveys
 * - Deep research conducted January 2026
 */

// ============================================================================
// AP COURSE DIFFICULTY TIERS
// ============================================================================

export const AP_DIFFICULTY_TIERS = {
  /**
   * Tier 1: Hardest AP Courses
   * - Pass rates generally <55%
   * - Require strong prerequisites
   * - Highly valued by admissions
   */
  tier1_hardest: {
    courses: {
      'AP Physics C: E&M': {
        passRate: 0.48,
        fiveRate: 0.27,
        oneRate: 0.16,
        prerequisites: ['AP Physics C: Mechanics', 'Calculus'],
        collegeEquivalent: 'Introductory E&M physics (calculus-based)',
        strongSignalFor: ['Engineering', 'Physics', 'EE'],
        difficultyReason: 'Calculus-based, builds on mechanics, abstract concepts',
        selectivityParadox: false,
      },
      'AP Physics C: Mechanics': {
        passRate: 0.53,
        fiveRate: 0.33,
        prerequisites: ['Precalculus', 'Concurrent Calculus recommended'],
        collegeEquivalent: 'First-semester calculus-based physics',
        strongSignalFor: ['Engineering', 'Physics', 'Math'],
        difficultyReason: 'Calculus-based problem solving',
        selectivityParadox: true,
        selectivityNote: 'Self-selected strong math students take this',
      },
      'AP Chemistry': {
        passRate: 0.57,
        fiveRate: 0.13,
        oneRate: 0.12,
        prerequisites: ['Algebra II', 'Previous chemistry helpful'],
        collegeEquivalent: 'General Chemistry I',
        strongSignalFor: ['Pre-Med', 'Chemistry', 'Engineering', 'Biology'],
        difficultyReason: 'Vast content, quantitative skills, lab component',
        selectivityParadox: false,
      },
      'AP Calculus BC': {
        passRate: 0.80,
        fiveRate: 0.43,
        prerequisites: ['Precalculus', 'Strong algebra'],
        collegeEquivalent: 'Calculus I and II combined',
        strongSignalFor: ['STEM majors', 'Engineering', 'Physics', 'Math'],
        difficultyReason: 'Covers full year more than AB, fast pace',
        selectivityParadox: true,
        selectivityNote: 'High pass rate reflects self-selected strong math students',
      },
    },
    weight: 1.0,
    admissionsImpact: 'very_high',
    description: 'Most rigorous AP courses, strongly valued',
  },

  /**
   * Tier 2: Hard AP Courses
   * - Pass rates 55-65%
   * - Significant content depth
   * - Strong signal for relevant majors
   */
  tier2_hard: {
    courses: {
      'AP Biology': {
        passRate: 0.60,
        fiveRate: 0.09,
        prerequisites: ['Chemistry recommended'],
        collegeEquivalent: 'Introductory Biology',
        strongSignalFor: ['Pre-Med', 'Biology', 'Neuroscience'],
        difficultyReason: 'Massive content volume, low 5 rate',
      },
      'AP US History': {
        passRate: 0.54,
        fiveRate: 0.13,
        prerequisites: ['Strong reading/writing'],
        collegeEquivalent: 'US History survey',
        strongSignalFor: ['History', 'Political Science', 'Law'],
        difficultyReason: 'Extensive content, DBQ writing challenges',
      },
      'AP World History': {
        passRate: 0.56,
        fiveRate: 0.11,
        prerequisites: ['Strong analytical writing'],
        collegeEquivalent: 'World History survey',
        strongSignalFor: ['History', 'International Relations'],
        difficultyReason: 'Broadest scope, comparative analysis',
      },
      'AP English Literature': {
        passRate: 0.62,
        fiveRate: 0.09,
        prerequisites: ['Strong reading comprehension'],
        collegeEquivalent: 'English Literature 101',
        strongSignalFor: ['English', 'Humanities', 'Writing-intensive'],
        difficultyReason: 'Subjective analysis, sophisticated writing',
      },
      'AP Latin': {
        passRate: 0.57,
        fiveRate: 0.17,
        oneRate: 0.21,
        prerequisites: ['3+ years of Latin'],
        collegeEquivalent: 'Intermediate Latin',
        strongSignalFor: ['Classics', 'Linguistics', 'Humanities'],
        difficultyReason: 'Translation skills, classical text analysis',
      },
      'AP Music Theory': {
        passRate: 0.62,
        fiveRate: 0.22,
        prerequisites: ['Music reading ability', 'Instrument experience'],
        collegeEquivalent: 'Music Theory I',
        strongSignalFor: ['Music', 'Music Education'],
        difficultyReason: 'Written and aural components, sight-singing',
      },
      'AP Physics 1': {
        passRate: 0.47,
        fiveRate: 0.08,
        oneRate: 0.27,
        prerequisites: ['Algebra II'],
        collegeEquivalent: 'Algebra-based physics',
        strongSignalFor: ['STEM foundation'],
        difficultyReason: 'Lowest pass rate of any AP, conceptual challenges',
      },
    },
    weight: 0.95,
    admissionsImpact: 'high',
    description: 'Demanding courses with significant depth',
  },

  /**
   * Tier 3: Medium Difficulty AP Courses
   * - Pass rates 65-75%
   * - Solid rigor
   * - Good signals for relevant majors
   */
  tier3_medium: {
    courses: {
      'AP Statistics': {
        passRate: 0.65,
        fiveRate: 0.16,
        prerequisites: ['Algebra II'],
        collegeEquivalent: 'Intro Statistics',
        strongSignalFor: ['Business', 'Social Sciences', 'Data Science'],
        difficultyReason: 'Conceptual, data analysis focus',
      },
      'AP Psychology': {
        passRate: 0.63,
        fiveRate: 0.20,
        prerequisites: ['None'],
        collegeEquivalent: 'Intro Psychology',
        strongSignalFor: ['Psychology', 'Social Sciences', 'Pre-Med'],
        difficultyReason: 'Vocabulary-heavy, accessible',
      },
      'AP Computer Science A': {
        passRate: 0.69,
        fiveRate: 0.27,
        prerequisites: ['Basic algebra'],
        collegeEquivalent: 'CS 101',
        strongSignalFor: ['CS', 'Engineering', 'Data Science'],
        difficultyReason: 'Java programming, problem-solving',
      },
      'AP Calculus AB': {
        passRate: 0.61,
        fiveRate: 0.24,
        prerequisites: ['Precalculus'],
        collegeEquivalent: 'Calculus I',
        strongSignalFor: ['STEM foundation'],
        difficultyReason: 'Gateway calculus course',
      },
      'AP European History': {
        passRate: 0.55,
        fiveRate: 0.13,
        prerequisites: ['Strong reading/writing'],
        collegeEquivalent: 'European History survey',
        strongSignalFor: ['History', 'Humanities'],
        difficultyReason: 'Dense content, analytical writing',
      },
      'AP English Language': {
        passRate: 0.56,
        fiveRate: 0.11,
        prerequisites: ['Strong writing skills'],
        collegeEquivalent: 'Rhetoric/Composition',
        strongSignalFor: ['Humanities', 'Communications', 'Law'],
        difficultyReason: 'Rhetorical analysis, argumentation',
      },
      'AP Physics 2': {
        passRate: 0.70,
        fiveRate: 0.15,
        prerequisites: ['AP Physics 1'],
        collegeEquivalent: 'Second-semester algebra physics',
        strongSignalFor: ['STEM'],
        difficultyReason: 'Builds on Physics 1, selective students',
        selectivityParadox: true,
        selectivityNote: 'Only Physics 1 survivors take this',
      },
    },
    weight: 0.85,
    admissionsImpact: 'moderate',
    description: 'Solid rigor, good preparation',
  },

  /**
   * Tier 4: Easier AP Courses
   * - Pass rates >75% (or high due to selectivity)
   * - Good introduction to AP
   * - Less distinctive for competitive admissions
   */
  tier4_easier: {
    courses: {
      'AP Environmental Science': {
        passRate: 0.55,
        fiveRate: 0.10,
        prerequisites: ['None'],
        collegeEquivalent: 'Environmental Science intro',
        strongSignalFor: ['Environmental Science'],
        difficultyReason: 'Broad but shallow, often considered "easy AP"',
        warning: 'Low 5 rate but perceived as less rigorous',
      },
      'AP Human Geography': {
        passRate: 0.55,
        fiveRate: 0.16,
        prerequisites: ['None'],
        collegeEquivalent: 'Human Geography intro',
        strongSignalFor: ['Geography', 'Social Sciences'],
        difficultyReason: 'Often first AP for freshmen, less depth',
      },
      'AP Computer Science Principles': {
        passRate: 0.68,
        fiveRate: 0.13,
        prerequisites: ['None'],
        collegeEquivalent: 'Computing survey',
        strongSignalFor: ['General interest in CS'],
        difficultyReason: 'Survey course, no programming prereq',
      },
      'AP Microeconomics': {
        passRate: 0.65,
        fiveRate: 0.23,
        prerequisites: ['None'],
        collegeEquivalent: 'Micro Principles',
        strongSignalFor: ['Economics', 'Business'],
        difficultyReason: 'Conceptual economics',
      },
      'AP Macroeconomics': {
        passRate: 0.62,
        fiveRate: 0.20,
        prerequisites: ['None'],
        collegeEquivalent: 'Macro Principles',
        strongSignalFor: ['Economics', 'Business'],
        difficultyReason: 'Conceptual economics',
      },
      'AP Chinese': {
        passRate: 0.88,
        fiveRate: 0.60,
        prerequisites: ['4+ years or heritage'],
        collegeEquivalent: 'Advanced Chinese',
        strongSignalFor: ['Languages', 'East Asian Studies'],
        difficultyReason: 'Many heritage speakers',
        selectivityParadox: true,
        selectivityNote: 'High pass rate due to heritage speakers',
      },
      'AP Spanish Language': {
        passRate: 0.82,
        fiveRate: 0.26,
        prerequisites: ['4+ years or heritage'],
        collegeEquivalent: 'Advanced Spanish',
        strongSignalFor: ['Languages', 'Spanish'],
        difficultyReason: 'Many heritage speakers',
        selectivityParadox: true,
      },
      'AP Art and Design courses': {
        passRate: 0.85,
        fiveRate: 0.15,
        prerequisites: ['Art portfolio'],
        collegeEquivalent: 'Studio Art',
        strongSignalFor: ['Art', 'Design'],
        difficultyReason: 'Portfolio-based, different skill set',
      },
    },
    weight: 0.75,
    admissionsImpact: 'lower',
    description: 'Good for AP introduction, less distinctive for T20',
  },
} as const;

// ============================================================================
// COURSE LEVEL HIERARCHY
// ============================================================================

export const COURSE_LEVEL_HIERARCHY = {
  levels: {
    ap_ib_hl: {
      name: 'AP / IB Higher Level',
      weight: 1.0,
      gpaBoost: 1.0,
      description: 'College-level courses with external validation',
      collegePerception: 'Gold standard for rigor',
      signals: [
        'Self-selection into challenging material',
        'College-level work experience',
        'External validation through standardized exams',
      ],
    },
    dual_enrollment_research: {
      name: 'Dual Enrollment (Research University)',
      weight: 0.95,
      gpaBoost: 1.0,
      description: 'Actual college courses at R1/research institutions',
      collegePerception: 'True college work, strong validation',
      signals: [
        'Ability to succeed in actual college environment',
        'Initiative to seek challenge beyond school',
        'Strong external validation',
      ],
    },
    ib_sl: {
      name: 'IB Standard Level',
      weight: 0.85,
      gpaBoost: 0.5,
      description: 'Part of IB Diploma, above honors level',
      collegePerception: 'Above honors, below HL/AP',
      signals: [
        'Part of rigorous IB program',
        'More depth than typical honors',
      ],
    },
    dual_enrollment_community: {
      name: 'Dual Enrollment (Community College)',
      weight: 0.80,
      gpaBoost: 0.5,
      description: 'College courses at community colleges',
      collegePerception: 'Valid but variable quality',
      signals: [
        'Initiative to seek challenge',
        'Not standardized like AP',
        'Quality varies dramatically',
      ],
      warning: 'Highly selective schools prefer AP for standardization',
    },
    honors: {
      name: 'Honors',
      weight: 0.70,
      gpaBoost: 0.5,
      description: 'School-defined advanced coursework',
      collegePerception: 'Above average challenge, quality varies',
      signals: [
        'Above-average challenge seeking',
        'Quality varies dramatically by school',
      ],
    },
    accelerated: {
      name: 'Accelerated / Advanced',
      weight: 0.50,
      gpaBoost: 0.25,
      description: 'Above grade level, often automatic placement',
      collegePerception: 'Some challenge-seeking',
      signals: [
        'Some challenge seeking',
        'Often automatic based on prior performance',
      ],
    },
    regular: {
      name: 'Regular / College Prep',
      weight: 0.30,
      gpaBoost: 0.0,
      description: 'Standard curriculum',
      collegePerception: 'Baseline expectation',
      contextMatters: 'Context of WHY matters (access vs choice)',
    },
  },

  /**
   * How to apply weights for rigor calculation
   */
  rigorCalculation: {
    formula: 'Sum(CourseWeight × GradePoints) / TotalCourses',
    gradePointConversion: {
      'A+': 4.0,
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      D: 1.0,
      F: 0.0,
    },
  },
} as const;

// ============================================================================
// COURSE SEQUENCING REQUIREMENTS BY MAJOR
// ============================================================================

export const MAJOR_COURSE_REQUIREMENTS = {
  engineering_cs: {
    name: 'Engineering / Computer Science',
    criticalCourses: [
      {
        course: 'AP Calculus BC',
        importance: 'critical',
        alternative: 'Calculus AB acceptable but BC preferred',
        note: 'Foundation for all engineering',
      },
      {
        course: 'AP Physics C: Mechanics',
        importance: 'critical',
        alternative: 'AP Physics 1 minimum, but C preferred for top programs',
        note: 'Calculus-based physics expected at MIT/Caltech/Stanford',
      },
      {
        course: 'AP Physics C: E&M',
        importance: 'strongly_recommended',
        note: 'Expected for EE, valuable for all engineering',
      },
      {
        course: 'AP Computer Science A',
        importance: 'critical_for_cs',
        note: 'Essential for CS majors, helpful for all engineering',
      },
      {
        course: 'AP Chemistry',
        importance: 'recommended',
        note: 'Important for ChemE, materials science',
      },
    ],
    idealSequence: {
      freshman: ['Honors/Advanced Math', 'Biology or Chemistry'],
      sophomore: ['Pre-Calculus or Calculus AB', 'Chemistry', 'CS Principles optional'],
      junior: ['Calculus BC or AB', 'Physics C or Physics 1', 'AP CS A'],
      senior: ['Physics C: E&M (if not taken)', 'Statistics', 'Additional STEM APs'],
    },
    redFlags: [
      'No calculus',
      'No physics (especially no Physics C for top programs)',
      'Stopped at Calc AB when BC was available',
      'No computer science for CS applicants',
    ],
    strongSignals: [
      'Multivariable Calculus / Linear Algebra beyond BC',
      'Both Physics C courses completed',
      'Research experience in STEM',
      'AIME/USAMO qualification',
    ],
  },

  pre_med: {
    name: 'Pre-Medicine / Biology',
    criticalCourses: [
      {
        course: 'AP Biology',
        importance: 'critical',
        note: 'Foundation for medical studies',
      },
      {
        course: 'AP Chemistry',
        importance: 'critical',
        note: 'Foundation for biochemistry',
      },
      {
        course: 'AP Calculus (AB or BC)',
        importance: 'critical',
        note: 'Math foundation, BC not required',
      },
      {
        course: 'AP Physics',
        importance: 'recommended',
        note: 'Any physics course, C not required',
      },
      {
        course: 'AP Statistics',
        importance: 'recommended',
        note: 'Valuable for research methods',
      },
    ],
    idealSequence: {
      freshman: ['Honors Biology', 'Honors/Advanced Math'],
      sophomore: ['AP Biology or Honors Chemistry', 'Pre-Calculus'],
      junior: ['AP Chemistry', 'AP Calculus AB/BC', 'AP Biology if not taken'],
      senior: ['AP Physics', 'AP Statistics', 'Additional sciences'],
    },
    redFlags: [
      'Avoided Chemistry',
      'No Biology',
      'Weak science grades',
      'No lab science progression',
    ],
    strongSignals: [
      'All science APs with 5s',
      'Research experience in biology/medicine',
      'Hospital/clinic volunteering with depth',
      'Perfect AP exam scores in sciences',
    ],
  },

  humanities_social_sciences: {
    name: 'Humanities / Social Sciences',
    criticalCourses: [
      {
        course: 'AP English Literature',
        importance: 'critical',
        note: 'Core for all humanities',
      },
      {
        course: 'AP English Language',
        importance: 'critical',
        note: 'Rhetorical analysis foundation',
      },
      {
        course: 'AP US History',
        importance: 'strongly_recommended',
        note: 'Foundation for American studies',
      },
      {
        course: 'AP World History or European History',
        importance: 'strongly_recommended',
        note: 'Global perspective',
      },
      {
        course: 'Foreign Language (4+ years)',
        importance: 'strongly_recommended',
        note: 'Demonstrates commitment to language study',
      },
    ],
    idealSequence: {
      freshman: ['Honors English', 'World Language Year 1-2'],
      sophomore: ['AP World History or Human Geography', 'Honors English', 'World Language Year 2-3'],
      junior: ['AP US History', 'AP English Language', 'AP World Language or Year 3-4'],
      senior: ['AP English Literature', 'AP Government/European History', 'Additional humanities'],
    },
    redFlags: [
      'No AP English courses',
      'Dropped foreign language before 4 years',
      'No history courses',
      'Avoided writing-intensive courses',
    ],
    strongSignals: [
      'Published writing (Concord Review, Scholastic)',
      'Multiple AP histories',
      'Advanced foreign language (5+ years or AP)',
      'Research in humanities',
    ],
  },

  business_economics: {
    name: 'Business / Economics',
    criticalCourses: [
      {
        course: 'AP Calculus (AB or BC)',
        importance: 'critical',
        note: 'Foundation for economics',
      },
      {
        course: 'AP Statistics',
        importance: 'strongly_recommended',
        note: 'Data analysis foundation',
      },
      {
        course: 'AP Microeconomics',
        importance: 'strongly_recommended',
        note: 'Demonstrates interest, conceptual foundation',
      },
      {
        course: 'AP Macroeconomics',
        importance: 'recommended',
        note: 'Complements micro',
      },
    ],
    idealSequence: {
      freshman: ['Honors Math', 'Any rigorous courses'],
      sophomore: ['Pre-Calculus', 'AP Human Geography optional'],
      junior: ['Calculus AB/BC', 'AP Micro/Macro Economics'],
      senior: ['AP Statistics', 'Additional math if available', 'AP CS A helpful'],
    },
    redFlags: [
      'No calculus',
      'Weak quantitative background',
      'Avoided math when available',
    ],
    strongSignals: [
      'Calculus BC + Statistics',
      'Business/entrepreneurship activities',
      'DECA/FBLA achievements',
      'Financial literacy demonstrated',
    ],
  },
} as const;

// ============================================================================
// INTERNATIONAL CURRICULUM CONVERSIONS
// ============================================================================

export const INTERNATIONAL_CONVERSIONS = {
  ib_diploma: {
    name: 'International Baccalaureate Diploma',
    scoreRange: '0-45 (max 42 from courses + 3 from EE/TOK)',
    interpretation: {
      '40-45': {
        gpaEquivalent: '3.9-4.0',
        t20Assessment: 'Exceptional, competitive at any school',
        percentileEstimate: '95th+',
        note: 'Top 1-2% of IB students globally',
      },
      '38-39': {
        gpaEquivalent: '3.7-3.85',
        t20Assessment: 'Strong, competitive at T20',
        percentileEstimate: '90th',
        note: 'Commonly cited as "good" IB score for elite schools',
      },
      '35-37': {
        gpaEquivalent: '3.5-3.7',
        t20Assessment: 'Competitive for T20, strong for T30',
        percentileEstimate: '80th',
      },
      '32-34': {
        gpaEquivalent: '3.3-3.5',
        t20Assessment: 'Developing, competitive for T50',
        percentileEstimate: '60th',
      },
      '<32': {
        gpaEquivalent: '<3.3',
        t20Assessment: 'Below competitive threshold for selective',
        percentileEstimate: '<50th',
      },
    },
    subjectScoreConversion: {
      7: { gpa: 4.0, letter: 'A', note: 'Exceptional' },
      6: { gpa: 4.0, letter: 'A-', note: 'Strong' },
      5: { gpa: 3.0, letter: 'B', note: 'Adequate' },
      4: { gpa: 2.7, letter: 'B-', note: 'Concerning' },
      3: { gpa: 2.0, letter: 'C', note: 'Weak' },
      '1-2': { gpa: 1.0, letter: 'D', note: 'Failing' },
    },
    predictedVsFinal: {
      typicalVariance: '±2 points',
      note: 'US admissions happen before final scores; conditionals based on predicted',
    },
  },

  a_levels: {
    name: 'UK A-Levels / GCE Advanced Level',
    gradeConversion: {
      'A*': { gpa: 4.0, percentRange: '90-100%', note: 'Exceptional' },
      A: { gpa: 4.0, percentRange: '80-89%', note: 'Strong' },
      B: { gpa: 3.3, percentRange: '70-79%', note: 'Good' },
      C: { gpa: 2.7, percentRange: '60-69%', note: 'Adequate' },
      D: { gpa: 2.0, percentRange: '50-59%', note: 'Concerning' },
      E: { gpa: 1.0, percentRange: '40-49%', note: 'Weak' },
    },
    t20Expectations: {
      exceptional: 'A*A*A* or A*A*A',
      strong: 'A*AA or AAA',
      competitive: 'AAB or ABB',
      note: 'Subject relevance to intended major matters significantly',
    },
    ukVsUsPercentages: {
      note: '70% in UK is excellent (First Class); 70% in US is average (C)',
      conversion: 'UK percentages should not be directly compared to US scales',
    },
  },

  cbse_india: {
    name: 'CBSE / ISC (India)',
    interpretation: {
      '95%+': { t20Assessment: 'Strong', note: 'Top tier, competitive' },
      '90-94%': { t20Assessment: 'Competitive', note: 'Good standing' },
      '85-89%': { t20Assessment: 'Adequate', note: 'Average for applicants' },
      '<85%': { t20Assessment: 'Below competitive', note: 'Challenging for T20' },
    },
    contextNote: 'Board exam percentages can be inflated in recent years; SAT/AP validation important',
  },

  gaokao_china: {
    name: 'Gaokao (China)',
    interpretation: {
      note: 'Provincial rankings matter more than raw scores',
      top1Percent: 'Highly competitive for international admissions',
      top5Percent: 'Strong candidate',
    },
    contextNote: 'Often supplemented with SAT/TOEFL for US applications',
  },
} as const;

// ============================================================================
// DUAL ENROLLMENT QUALITY TIERS
// ============================================================================

export const DUAL_ENROLLMENT_TIERS = {
  tier1_research_university: {
    name: 'Research University (R1/R2)',
    examples: ['State flagship universities', 'Private research universities'],
    weight: 0.95,
    creditTransfer: 'Highly transferable',
    collegePerception: 'Strongest external validation',
    advantages: [
      'True college-level rigor',
      'Strong faculty',
      'Research exposure possible',
      'Credits widely accepted',
    ],
    recommendation: 'Strongly recommended if available',
  },

  tier2_regional_university: {
    name: 'Regional 4-Year University',
    examples: ['Regional state universities', 'Smaller private colleges'],
    weight: 0.90,
    creditTransfer: 'Generally transferable',
    collegePerception: 'Strong validation',
    advantages: [
      'College-level work',
      'More accessible than R1',
      'Good preparation',
    ],
    recommendation: 'Good option if R1 not accessible',
  },

  tier3_community_college: {
    name: 'Community College',
    examples: ['Local community colleges'],
    weight: 0.80,
    creditTransfer: 'Variable by receiving institution',
    collegePerception: 'Valid but less prestigious',
    advantages: [
      'Accessible',
      'Affordable',
      'Shows initiative',
    ],
    disadvantages: [
      'Not standardized like AP',
      'Quality varies significantly',
      'Less weight at highly selective schools',
    ],
    recommendation: 'Better than no rigor, but AP preferred if available',
    note: 'Highly selective schools prefer AP for standardization',
  },

  /**
   * How selective schools view dual enrollment
   */
  selectiveSchoolPerspective: {
    quote:
      'Dual enrollment courses are not standardized—there is no "norm," and an A in one place could be different from an A in another. Highly selective universities favor AP and IB exam results over dual enrollment credits because they are standardized.',
    source: 'CollegeVine',
    recommendation:
      'If your school offers APs, take APs. Use dual enrollment to supplement in areas without AP offerings.',
  },
} as const;

// ============================================================================
// AP COUNT EXPECTATIONS BY SCHOOL CONTEXT
// ============================================================================

export const AP_COUNT_EXPECTATIONS = {
  elite_prep: {
    context: 'Elite Prep (20+ APs offered)',
    t10Competitive: { min: 12, ideal: '12-14', note: 'Expected to maximize' },
    t20Competitive: { min: 10, ideal: '10-12', note: 'Strong showing' },
    t30Competitive: { min: 8, ideal: '8-10', note: 'Adequate' },
    averageForPool: 'Harvard average is 8 APs',
    note: 'These students compared to classmates, not national norms',
  },

  competitive_magnet: {
    context: 'Competitive Public/Magnet (15-20 APs, specialized focus)',
    t10Competitive: { min: 10, ideal: '10-14 with STEM depth', note: 'Specialized excellence expected' },
    t20Competitive: { min: 8, ideal: '8-12', note: 'Strong' },
    t30Competitive: { min: 6, ideal: '6-8', note: 'Acceptable' },
    note: 'STEM focus expected for STEM magnets',
  },

  well_resourced_suburban: {
    context: 'Well-Resourced Suburban (15+ APs)',
    t10Competitive: { min: 10, ideal: '10-12', note: 'Near-maximum' },
    t20Competitive: { min: 8, ideal: '8-10', note: 'Strong' },
    t30Competitive: { min: 6, ideal: '6-8', note: 'Acceptable' },
  },

  average_public: {
    context: 'Average Public (5-10 APs)',
    t10Competitive: { min: 'all available', ideal: 'All + DE/online supplements', note: 'Shows initiative' },
    t20Competitive: { min: 'all available', ideal: 'All available', note: 'Expected' },
    t30Competitive: { min: 4, ideal: '4-6', note: 'Acceptable' },
    contextBonus: '+0.3 to Harvard score for maximizing limited options',
  },

  under_resourced: {
    context: 'Under-Resourced (<5 APs)',
    t10Competitive: { min: 'all', ideal: 'All + DE/online APs', note: 'Significant context bonus' },
    t20Competitive: { min: 'all', ideal: 'All available', note: 'Strong context bonus' },
    t30Competitive: { min: 'most', ideal: 'Most available', note: 'Context considered' },
    contextBonus: '+0.5 to Harvard score',
    note: 'Look for evidence of seeking challenge beyond school offerings',
  },

  homeschool: {
    context: 'Homeschool',
    t10Competitive: {
      requirement: 'AP exams (not just courses) + DE + competitions',
      note: 'External validation critical',
    },
    t20Competitive: {
      requirement: 'AP exams + some DE',
      note: 'Strong external validation',
    },
    note: 'Cannot evaluate homeschool grades in isolation; external metrics essential',
  },
} as const;

// ============================================================================
// RIGOR MAXIMIZATION SCORING
// ============================================================================

export const RIGOR_MAXIMIZATION_FRAMEWORK = {
  /**
   * Core principle: Context-adjusted rigor maximization
   */
  formula: '(Rigorous Courses Taken / Rigorous Courses Available) × 100',

  tiers: {
    exceptional: {
      percentage: '90-100%',
      harvardAdjustment: -0.2,
      t20Assessment: 'Strong positive signal',
      description: 'Taking all or nearly all available rigorous courses',
    },
    strong: {
      percentage: '70-89%',
      harvardAdjustment: 0,
      t20Assessment: 'Expected for competitive applicants',
      description: 'Taking most available rigorous courses',
    },
    adequate: {
      percentage: '50-69%',
      harvardAdjustment: +0.1,
      t20Assessment: 'Acceptable but not distinctive',
      description: 'Taking significant rigorous courses',
    },
    concerning: {
      percentage: '<50%',
      harvardAdjustment: +0.3,
      t20Assessment: 'Red flag unless explained',
      description: 'Avoiding available rigor',
      mitigation: 'Work, family responsibilities can explain',
    },
  },

  /**
   * Key insight from research
   */
  insight: {
    quote:
      'Students applying to elite institutions will be compared to other applicants from their own high schools. Colleges will do this themselves by comparing applicants from within the same high school during the admission process.',
    source: 'The College Solution',
    implication:
      'Rigor maximization relative to peers matters as much as absolute rigor level',
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const academicCourseStandards = {
  AP_DIFFICULTY_TIERS,
  COURSE_LEVEL_HIERARCHY,
  MAJOR_COURSE_REQUIREMENTS,
  INTERNATIONAL_CONVERSIONS,
  DUAL_ENROLLMENT_TIERS,
  AP_COUNT_EXPECTATIONS,
  RIGOR_MAXIMIZATION_FRAMEWORK,
};

// Type exports for use in other modules
export type APDifficultyTier = keyof typeof AP_DIFFICULTY_TIERS;
export type CourseLevel = keyof typeof COURSE_LEVEL_HIERARCHY.levels;
export type MajorCategory = keyof typeof MAJOR_COURSE_REQUIREMENTS;
export type SchoolContextType = keyof typeof AP_COUNT_EXPECTATIONS;
