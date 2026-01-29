/**
 * Universal Academic Standards for Elite College Admissions
 *
 * Data sourced from Perplexity Deep Research (January 2026)
 * Based on: Common Data Sets, admissions officer interviews, published research,
 * and institutional policies from T20-T30 universities.
 *
 * Key insight: Elite admissions operates on a two-stage model:
 * 1. Academic Qualification (threshold review) - eliminates 75-90% of applicants
 * 2. Holistic Differentiation - where the remaining 5-15% compete
 *
 * Sources: Harvard CDS 2023-24, Yale CDS, Stanford admissions, Duke published criteria,
 * MIT Admissions blogs, Princeton data, and numerous admissions officer interviews.
 */

// ============================================================================
// GPA STANDARDS
// ============================================================================

/**
 * GPA thresholds based on Common Data Set analysis and admissions research
 *
 * Source: Harvard CDS 2023-24 shows 74.02% of admits had 4.0 GPA,
 * 93.69% had 3.75+. Similar patterns at Yale (avg 3.9), Stanford (avg 3.94),
 * Princeton (94.4% top 10% of class).
 */
export const GPA_THRESHOLDS = {
  /** Exceptional: Top tier, competitive anywhere */
  exceptional: {
    min: 3.95,
    description: 'Perfect or near-perfect GPA - competitive at any institution',
    percentileAtT20: '75th percentile or above',
    notes: '74% of Harvard admits have 4.0 unweighted GPA',
  },

  /** Strong: Solidly competitive at T20 */
  strong: {
    min: 3.85,
    max: 3.94,
    description: 'Strong GPA - within competitive range at T20',
    percentileAtT20: '50th-75th percentile',
    notes: 'Additional 19.67% of Harvard admits in 3.75-3.99 range',
  },

  /** Competitive: Possible at T20 with strong other factors */
  competitive: {
    min: 3.75,
    max: 3.84,
    description: 'Competitive GPA - needs strong extracurriculars/essays',
    percentileAtT20: '25th-50th percentile',
    notes: '93.69% of Harvard admits have 3.75+ - this is the effective floor',
  },

  /** Below threshold: Significant disadvantage at T20 */
  belowThreshold: {
    min: 3.6,
    max: 3.74,
    description: 'Below typical T20 threshold - requires exceptional circumstances',
    percentileAtT20: 'Below 25th percentile',
    notes: 'Admits at this level typically have hooks: recruited athlete, extreme adversity, or extraordinary achievement',
    possibleWithHooks: [
      'Recruited athlete (86% acceptance rate for Harvard athletes vs 3.41% overall)',
      'Severe socioeconomic/educational disadvantage with context',
      'National/international recognition in non-academic area',
      'Strong upward trend with compelling narrative',
    ],
  },

  /** Unlikely: Very difficult for non-hooked applicants */
  unlikely: {
    max: 3.59,
    description: 'Very difficult for non-hooked applicants at T20',
    notes: 'Per Georgetown AO: "If we look at the base GPA and it\'s technically a 3.7 or 3.6, there is a difference there"',
  },
} as const;

/**
 * How elite schools handle weighted vs unweighted GPA
 *
 * Key insight: Most recalculate using their own formulas
 * Source: Ivy Scholars analysis, Stanford/Penn/Georgetown documented practices
 */
export const GPA_RECALCULATION_PRACTICES = {
  stanford: {
    method: 'Recalculates using only sophomore/junior year academic courses',
    plusMinusHandling: 'Flattens +/- distinctions (A- becomes A, B+ becomes B)',
    includesAllYears: false,
  },
  penn: {
    method: 'Recalculates on four-point scale without weighting',
    plusMinusHandling: 'No +/- consideration',
    includesAllYears: true,
  },
  georgetown: {
    method: 'Examines actual letter grades rather than accepting school-calculated GPAs',
    plusMinusHandling: 'Reviews raw grades',
    includesAllYears: true,
  },
  general: {
    insight: 'A 4.23 weighted GPA offers no advantage over a 4.0 unweighted GPA',
    source: 'Ivy Coach analysis',
    recommendation: 'Focus on actual letter grades, not weighted calculations',
  },
} as const;

// ============================================================================
// COURSE RIGOR STANDARDS
// ============================================================================

/**
 * AP/IB course expectations based on admissions data
 *
 * Source: Harvard admits average 8 APs, IvyMax found majority of Ivy admits
 * completed 12+ APs, PrepScholar/SparkAdmissions suggest 7-12 as typical.
 */
export const COURSE_RIGOR_EXPECTATIONS = {
  /** For well-resourced schools with full AP/IB offerings */
  wellResourcedSchools: {
    exceptional: {
      apCourseCount: { min: 12, description: '12+ AP courses' },
      notes: 'Majority of Ivy admits at 12+ APs (IvyMax data)',
      distribution: 'Across core subjects, not concentrated in electives',
    },
    strong: {
      apCourseCount: { min: 8, max: 11, description: '8-11 AP courses' },
      notes: 'Harvard average is ~8 APs',
      distribution: 'Must include core subjects: English, Math, Science, History, Foreign Language',
    },
    competitive: {
      apCourseCount: { min: 6, max: 7, description: '6-7 AP courses' },
      notes: 'Lower bound for T20 competitiveness',
      additionalRequirement: 'Should be supplemented with community college courses, research, or other advanced work',
    },
    belowExpectations: {
      apCourseCount: { max: 5, description: '5 or fewer AP courses' },
      notes: 'Per Michele Hernández (former Dartmouth AD): "If your high school offers 25 AP courses and all the top kids take 10-12 and you have only 5, you will lose points in course load rigor"',
    },
  },

  /** For schools with limited AP offerings */
  limitedResourceSchools: {
    expectation: 'Most rigorous curriculum available at YOUR school',
    evaluation: 'Assessed contextually using school profile and counselor report',
    alternatives: [
      'Dual enrollment at local college/university',
      'Online advanced courses (with verification)',
      'Honors sections of standard courses',
      'IB diploma where available',
    ],
    source: 'Coalition for College Access: "Students from schools without honors or AP/IB courses will not be directly compared to students from schools that do offer these"',
  },

  /** The universal standard */
  universalPrinciple: {
    rule: 'Take the most demanding curriculum available at your high school',
    escalation: 'Competitive applicants often supplement with university courses or online advanced work',
    source: 'Ivy Coach: "Students filling up highly selective college campuses go above and beyond what their high schools offer"',
  },
} as const;

/**
 * Duke's published evaluation criteria - rigor is listed FIRST
 * Source: Duke Admissions "What We Look For" page
 */
export const RIGOR_IMPORTANCE = {
  dukeCriteria: 'Rigor of candidate\'s academic program listed as first of five primary factors',
  harvardCDS: 'Rigor of secondary school record marked as "Very Important" (highest rating)',
  universalTruth: 'Every elite institution rates course rigor as Very Important or Important in CDS Section C7',
} as const;

// ============================================================================
// STANDARDIZED TESTING STANDARDS
// ============================================================================

/**
 * SAT score ranges for Class of 2028 at T20 institutions
 * Source: Multiple verified sources including Think Academy, Tutor Doctor, Crimson Education
 */
export const SAT_SCORE_RANGES = {
  harvard: { percentile25: 1500, percentile50: 1540, percentile75: 1580 },
  mit: { percentile25: 1520, percentile50: 1545, percentile75: 1570 },
  stanford: { percentile25: 1510, percentile50: 1540, percentile75: 1570 },
  yale: { percentile25: 1480, percentile50: 1520, percentile75: 1560 },
  princeton: { percentile25: 1500, percentile50: 1530, percentile75: 1560 },
  columbia: { percentile25: 1500, percentile50: 1530, percentile75: 1560 },
  penn: { percentile25: 1500, percentile50: 1535, percentile75: 1570 },
  duke: { percentile25: 1490, percentile50: 1525, percentile75: 1560 },
  northwestern: { percentile25: 1500, percentile50: 1530, percentile75: 1560 },
  brown: { percentile25: 1510, percentile50: 1535, percentile75: 1560 },
} as const;

/**
 * ACT score ranges for T20 institutions
 * Source: Command Education, Think Academy
 */
export const ACT_SCORE_RANGES = {
  mostT20: { percentile25: 33, percentile50: 34, percentile75: 35 },
  mit: { percentile25: 35, percentile50: 35, percentile75: 36 },
  caltech: { percentile25: 35, percentile50: 36, percentile75: 36 },
} as const;

/**
 * Test score evaluation framework
 * Source: Dr. Rachel Rubin (Spark Admissions), Compass Prep, Summit Prep
 */
export const TEST_SCORE_EVALUATION = {
  /** Above 75th percentile - enhances application */
  strength: {
    satThresholdT10: 1560,
    satThresholdT20: 1540,
    actThresholdT10: 35,
    actThresholdT20: 34,
    impact: 'Enhances application and may compensate for minor weaknesses elsewhere',
    recommendation: 'Definitely submit',
  },

  /** Within middle 50% - academically qualified */
  neutral: {
    satRangeT10: { min: 1500, max: 1560 },
    satRangeT20: { min: 1470, max: 1540 },
    actRangeT10: { min: 33, max: 35 },
    actRangeT20: { min: 32, max: 34 },
    impact: 'Checks the box for academic preparedness but doesn\'t distinguish',
    recommendation: 'Submit - you are academically qualified',
  },

  /** Below 25th percentile - raises questions */
  weakness: {
    satThresholdT10: 1500,
    satThresholdT20: 1470,
    actThresholdT10: 33,
    actThresholdT20: 32,
    impact: 'Raises questions about academic readiness unless offset by context',
    recommendation: 'Consider test-optional if below these thresholds',
  },
} as const;

/**
 * Test-optional submission guidance
 * Source: Score at the Top, Summit Prep, Big Future, Reddit admissions professionals
 */
export const TEST_OPTIONAL_GUIDANCE = {
  submitWhen: {
    rule: 'If your scores are within or above a college\'s mid-50% score range',
    alternativeRule: 'At or above the 50th percentile (median) of admitted students',
    source: 'Score at the Top, multiple admissions counselors',
  },

  considerWithholding: {
    rule: 'If below the 25th percentile of the target school',
    caveat: 'Not submitting is essentially submitting an ambiguously low score - colleges know withheld scores are below median',
    source: 'Summit Prep analysis',
  },

  contextMatters: {
    urm: 'Test-optional may benefit underrepresented minorities more than general population',
    firstGen: 'First-generation students may face less disadvantage going test-optional',
    source: 'Dartmouth research: "Roughly two-thirds of TOP institutions experienced URM growth above matched test-requiring peers"',
  },
} as const;

/**
 * Schools that require all scores vs allow score choice
 * Source: Ivy Scholars comprehensive compilation
 */
export const SCORE_CHOICE_POLICIES = {
  requireAllScores: [
    'Caltech',
    'Georgetown',
    'MIT', // Requests all but superscores
    'University of Michigan',
    'UPenn',
    'Vanderbilt',
    'Wake Forest',
  ],

  allowScoreChoice: [
    'Harvard', // No superscore but allows score choice
    'Yale',
    'Princeton', // Recommends but doesn't require all scores
    'Stanford',
    'Brown',
    'Dartmouth',
    'Columbia',
    'Duke',
    'Northwestern',
    'Cornell', // Recommends but doesn't require all scores
  ],

  superscoreNotes: {
    mit: 'Requests all scores but creates superscores during evaluation',
    digitalSAT: 'Many schools will not superscore across paper and digital SAT versions',
  },
} as const;

// ============================================================================
// GRADE TRENDS AND RECOVERY
// ============================================================================

/**
 * How grade trends are evaluated
 * Source: Yale Dean Mark VanDeusen, CollegeVine, Spark Admissions
 */
export const GRADE_TREND_EVALUATION = {
  /** Yale Dean's perspective on consistency */
  yalePerspective: {
    quote: '"We need to see that a student is being consistently strong across a wide range of courses... most of those 50,000 applicants have consistent academic strength. If your transcript is just not very consistent... you\'re going to find yourself behind literally tens of thousands of people"',
    source: 'Yale Admissions Dean Mark VanDeusen',
    implication: 'Consistent excellence remains the gold standard',
  },

  /** When upward trends help */
  upwardTrends: {
    value: 'Viewed more favorably than downward trends, but rarely compensates fully for early underperformance',
    bestCase: 'When improvement comes from overcoming challenge/difficulty (not lack of effort)',
    demonstration: 'Shows resilience and readiness for higher education',
    source: 'Spark Admissions: "Rising trends show resilience and readiness for higher education"',
  },

  /** How to address weak periods */
  addressingWeakPeriods: {
    method: 'Explain in Additional Information section',
    askCounselor: 'Have counselor note circumstances in recommendation',
    covidContext: 'COVID-era performance receives particular understanding',
    source: 'CollegeVine admissions guidance',
  },
} as const;

/**
 * Senior year slump evaluation and consequences
 * Source: College Board counselor guidance, Spark Admissions, Education Week data
 */
export const SENIOR_YEAR_EVALUATION = {
  /** Statistics on rescission */
  rescissionData: {
    stat: '22% of colleges reported rescinding at least one admission offer in a given year',
    gradeRelated: 'More than two-thirds of rescissions were tied to decline in senior-year grades',
    source: 'Education Week via Spark Admissions',
  },

  /** Timing matters */
  byTiming: {
    firstSemester: {
      severity: 'Can be a red flag, especially if sharp',
      impact: 'Admissions offices may question motivation',
      opportunity: 'Strong first-semester grades can help borderline applicants stand out',
    },
    secondSemester: {
      severity: 'Highest risk of rescission',
      threshold: 'Multiple C\'s or any D/F grades in core courses trigger review',
      warning: 'Colleges don\'t receive final grades until June/July - students may not learn of rescission until July/August',
    },
    droppingCourses: {
      concern: 'Dropping an AP raises concerns about course rigor',
      requirement: 'Providing context is essential',
    },
  },

  /** College Board warning */
  officialWarning: {
    quote: '"Colleges may reserve the right to deny admission to an accepted applicant should the student\'s senior-year grades drop. Many college acceptance letters now explicitly state this."',
    source: 'College Board guidance to counselors',
  },
} as const;

/**
 * Single bad semester evaluation
 * Source: CollegeVine admissions analysis
 */
export const BAD_SEMESTER_EVALUATION = {
  circumstancesMatter: {
    acceptable: ['Illness', 'Family concerns', 'Documented hardship', 'COVID/online learning period'],
    howToAddress: 'Explain in Additional Information section',
    counselorHelp: 'Ask counselor to note in recommendation',
  },

  recoveryImportance: {
    key: 'Recovery trajectory is crucial',
    midYearReport: 'Colleges get mid-year report before most decisions - strong senior fall can partially compensate',
    fullCompensation: 'Rarely fully compensates at most selective institutions',
  },

  mathematicalImpact: {
    example: '0.3 GPA difference (e.g., 3.5 vs 3.8) can shift competitiveness significantly',
    note: 'Moves applicant from below-median to competitive at many institutions',
  },
} as const;

// ============================================================================
// THE TWO-STAGE MODEL
// ============================================================================

/**
 * Elite admissions operates on a two-stage model
 * Source: Harvard legal defense (2019), Stanford rating system, MIT Admissions blogs
 */
export const ADMISSIONS_MODEL = {
  /** Stage 1: Academic threshold */
  stage1: {
    name: 'Academic Qualification (Threshold Review)',
    purpose: 'Eliminates 75-90% of applicants',
    thresholds: {
      gpa: '3.75-3.9+ unweighted',
      testScores: '1500+ SAT / 33+ ACT',
      rigor: 'Most rigorous curriculum available',
    },
    harvardContext: {
      quote: '"To admit every applicant with a perfect GPA, Harvard would need to expand its class size by approximately 400% and then reject every applicant with an imperfect GPA"',
      source: 'Harvard legal defense, 2019 admissions lawsuit',
    },
  },

  /** Stage 2: Holistic differentiation */
  stage2: {
    name: 'Holistic Differentiation',
    purpose: 'Distinguishes among qualified applicants',
    factors: [
      'Extracurricular distinction',
      'Essay quality and authenticity',
      'Recommendations',
      'Personal qualities',
      'Institutional priorities',
    ],
    mitPerspective: {
      quote: '"Since we are admitting 1 out of every 10 applicants, we end up splitting a lot of hairs while making agonizingly difficult choices"',
      source: 'MIT Admissions blogger Chris Peterson',
    },
    harvardFoundation: {
      quote: '"The foundation for every case is actually character"',
      caveat: 'But only after academic qualifications are established',
      source: 'Former Harvard Dean William Fitzsimmons',
    },
  },

  /** Jeff Selingo's insight */
  institutionalAgenda: {
    quote: '"Most of us probably believe that this process is about merit, grades, and SAT scores, rewarding the best students, but [I present] a more complicated truth, showing that who gets in is more frequently about the college\'s agenda than about the applicant"',
    agenda: ['Building orchestras', 'Filling majors', 'Geographic diversity', 'Institutional priorities'],
    caveat: 'But only among academically qualified pools',
    source: 'Jeff Selingo, "Who Gets In and Why"',
  },

  /** The universal pattern */
  universalPattern: {
    summary: 'Academic excellence is necessary but not sufficient',
    stage1Elimination: 'Eliminates 75-90% of applicants',
    stage2Competition: 'Only 5-15% of remaining qualified pool gains admission',
  },
} as const;

// ============================================================================
// EVALUATION FUNCTIONS
// ============================================================================

export type GPATier = 'exceptional' | 'strong' | 'competitive' | 'belowThreshold' | 'unlikely';

/**
 * Evaluate GPA tier based on unweighted GPA
 */
export function evaluateGPATier(unweightedGPA: number): GPATier {
  if (unweightedGPA >= 3.95) return 'exceptional';
  if (unweightedGPA >= 3.85) return 'strong';
  if (unweightedGPA >= 3.75) return 'competitive';
  if (unweightedGPA >= 3.6) return 'belowThreshold';
  return 'unlikely';
}

export type RigorTier = 'exceptional' | 'strong' | 'competitive' | 'belowExpectations';

/**
 * Evaluate course rigor based on AP count (for well-resourced schools)
 */
export function evaluateRigorTier(apCount: number, schoolOffersAPs: boolean): RigorTier {
  if (!schoolOffersAPs) {
    // Cannot assess by AP count - needs contextual evaluation
    return 'competitive'; // Default to competitive, needs manual review
  }

  if (apCount >= 12) return 'exceptional';
  if (apCount >= 8) return 'strong';
  if (apCount >= 6) return 'competitive';
  return 'belowExpectations';
}

export type TestScoreTier = 'strength' | 'neutral' | 'weakness' | 'considerWithholding';

/**
 * Evaluate test score relative to T20 standards
 */
export function evaluateTestScoreTier(
  satScore: number | null,
  actScore: number | null,
  targetTier: 'T10' | 'T20' = 'T20'
): TestScoreTier {
  const thresholds = targetTier === 'T10'
    ? { strengthSAT: 1560, neutralMinSAT: 1500, strengthACT: 35, neutralMinACT: 33 }
    : { strengthSAT: 1540, neutralMinSAT: 1470, strengthACT: 34, neutralMinACT: 32 };

  // Evaluate SAT if provided
  if (satScore !== null) {
    if (satScore >= thresholds.strengthSAT) return 'strength';
    if (satScore >= thresholds.neutralMinSAT) return 'neutral';
    return 'weakness';
  }

  // Evaluate ACT if provided
  if (actScore !== null) {
    if (actScore >= thresholds.strengthACT) return 'strength';
    if (actScore >= thresholds.neutralMinACT) return 'neutral';
    return 'weakness';
  }

  return 'considerWithholding';
}

/**
 * Determine test-optional recommendation
 */
export function shouldSubmitTestScores(
  satScore: number | null,
  actScore: number | null,
  targetSchoolPercentile50SAT: number,
  targetSchoolPercentile25SAT: number
): { recommendation: 'submit' | 'consider_withholding' | 'withhold'; reasoning: string } {
  if (satScore === null && actScore === null) {
    return {
      recommendation: 'withhold',
      reasoning: 'No test scores available',
    };
  }

  // Use SAT for comparison (most common)
  const score = satScore ?? (actScore! * 35); // Rough ACT to SAT conversion

  if (score >= targetSchoolPercentile50SAT) {
    return {
      recommendation: 'submit',
      reasoning: `Score at or above 50th percentile (${targetSchoolPercentile50SAT}) - will strengthen application`,
    };
  }

  if (score >= targetSchoolPercentile25SAT) {
    return {
      recommendation: 'consider_withholding',
      reasoning: `Score between 25th and 50th percentile - borderline decision`,
    };
  }

  return {
    recommendation: 'withhold',
    reasoning: `Score below 25th percentile (${targetSchoolPercentile25SAT}) - consider going test-optional`,
  };
}
