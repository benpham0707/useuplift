/**
 * Comprehensive Academic Achievement Database
 *
 * Deep calibration for:
 * 1. GPA interpretation by school context
 * 2. Course rigor assessment
 * 3. Test score benchmarks
 * 4. Academic competition achievement levels
 * 5. Research and intellectual engagement calibration
 */

// ============================================================================
// GPA CALIBRATION BY SCHOOL CONTEXT
// ============================================================================

export const GPA_CALIBRATION = {
  /**
   * What a GPA means depends heavily on school context
   */
  school_contexts: {
    elite_prep: {
      name: 'Elite Preparatory School',
      examples: ['Phillips Exeter', 'Phillips Andover', 'Dalton', 'Horace Mann', 'Sidwell Friends'],
      characteristics: [
        'Grade deflation common (B+ is strong)',
        'Most rigorous curriculum expected',
        'AOs familiar with these schools',
        'College counseling is world-class',
      ],
      gpa_interpretation: {
        '3.9+': { percentile: 95, harvard_equivalent: 2, notes: 'Exceptional at deflated school' },
        '3.7-3.89': { percentile: 80, harvard_equivalent: 2.5, notes: 'Very strong' },
        '3.5-3.69': { percentile: 60, harvard_equivalent: 3, notes: 'Solid' },
        '3.3-3.49': { percentile: 40, harvard_equivalent: 3.5, notes: 'Average at elite prep' },
        '<3.3': { percentile: 20, harvard_equivalent: 4, notes: 'Below expectations' },
      },
      rigor_expectation: 'Should take most rigorous courses available',
      ao_familiarity: 'High - these schools have direct relationships with AOs',
    },

    competitive_magnet: {
      name: 'Competitive Public/Magnet',
      examples: ['Thomas Jefferson', 'Stuyvesant', 'IMSA', 'Bronx Science', 'North Carolina School of Science and Math'],
      characteristics: [
        'STEM-focused often',
        'Grade deflation in technical courses',
        'Competition for top spots intense',
        'Strong college placement',
      ],
      gpa_interpretation: {
        '3.9+': { percentile: 90, harvard_equivalent: 2, notes: 'Top of highly competitive class' },
        '3.7-3.89': { percentile: 70, harvard_equivalent: 2.5, notes: 'Strong' },
        '3.5-3.69': { percentile: 50, harvard_equivalent: 3, notes: 'Average for this pool' },
        '3.3-3.49': { percentile: 30, harvard_equivalent: 3.5, notes: 'Below average' },
        '<3.3': { percentile: 15, harvard_equivalent: 4, notes: 'Struggling' },
      },
      rigor_expectation: 'Full STEM rigor expected, research encouraged',
      ao_familiarity: 'High - well-known feeder schools',
    },

    well_resourced_suburban: {
      name: 'Well-Resourced Suburban',
      examples: ['Typical strong public school with 15+ AP options'],
      characteristics: [
        'Many AP/honors options',
        'Standard to slight grade inflation',
        'Good college counseling',
        'Competitive student body',
      ],
      gpa_interpretation: {
        '4.0': { percentile: 90, harvard_equivalent: 2.5, notes: 'Top performer' },
        '3.8-3.99': { percentile: 75, harvard_equivalent: 3, notes: 'Strong' },
        '3.6-3.79': { percentile: 55, harvard_equivalent: 3.5, notes: 'Above average' },
        '3.4-3.59': { percentile: 35, harvard_equivalent: 4, notes: 'Average' },
        '<3.4': { percentile: 20, harvard_equivalent: 4.5, notes: 'Below competitive threshold' },
      },
      rigor_expectation: '8-12 AP courses for top students',
      ao_familiarity: 'Medium - depends on specific school',
    },

    average_public: {
      name: 'Average Public School',
      examples: ['Typical public school with 5-10 AP options'],
      characteristics: [
        'Limited but adequate AP options',
        'Often grade inflated',
        'Variable college counseling',
        'Mixed student body motivation',
      ],
      gpa_interpretation: {
        '4.0': { percentile: 80, harvard_equivalent: 3, notes: 'Top of class but pool less competitive' },
        '3.8-3.99': { percentile: 65, harvard_equivalent: 3.5, notes: 'Strong for context' },
        '3.6-3.79': { percentile: 45, harvard_equivalent: 4, notes: 'Above average' },
        '3.4-3.59': { percentile: 30, harvard_equivalent: 4.5, notes: 'Average' },
        '<3.4': { percentile: 15, harvard_equivalent: 5, notes: 'Below average' },
      },
      rigor_expectation: 'Taking ALL available APs is exceptional',
      context_bonus: 0.3, // Add to Harvard score for maximizing limited options
    },

    under_resourced: {
      name: 'Under-Resourced School',
      examples: ['High-poverty school, limited advanced courses'],
      characteristics: [
        'Few or no AP courses',
        'Variable grading standards',
        'Limited college counseling',
        'Many students don\'t apply to selective colleges',
      ],
      gpa_interpretation: {
        '4.0': { percentile: 70, harvard_equivalent: 3, notes: 'Top but limited comparison pool' },
        '3.7+': { percentile: 55, harvard_equivalent: 3.5, notes: 'Strong for context' },
        '3.5+': { percentile: 40, harvard_equivalent: 4, notes: 'Above average' },
      },
      rigor_expectation: 'Any AP/DE work is notable',
      context_bonus: 0.5, // Significant bonus for excelling despite constraints
      notes: 'Look for evidence of seeking challenge beyond school offerings',
    },

    rural_remote: {
      name: 'Rural/Remote School',
      examples: ['Small schools in rural areas'],
      characteristics: [
        'Geographic isolation',
        'Very limited course options',
        'Often no AP courses',
        'Online courses show initiative',
      ],
      gpa_interpretation: {
        '4.0': { percentile: 70, harvard_equivalent: 3, notes: 'Must evaluate with heavy context' },
        '3.7+': { percentile: 50, harvard_equivalent: 3.5 },
      },
      rigor_expectation: 'Dual enrollment or online APs show exceptional initiative',
      context_bonus: 0.5,
      notes: 'Self-directed learning is highly valued',
    },

    international: {
      name: 'International School/Curriculum',
      examples: ['IB schools, A-Levels, national systems'],
      characteristics: [
        'Different grading scales',
        'Curriculum-specific evaluation needed',
        'Variable AO familiarity',
      ],
      conversion_notes: {
        ib_predicted: 'IB 40+ equivalent to very strong US student',
        a_levels: 'A*A*A* equivalent to top US student',
        indian_boards: '95%+ in CBSE/ISC is strong',
      },
    },

    homeschool: {
      name: 'Homeschool',
      characteristics: [
        'Grades not directly comparable',
        'External validation critical',
        'AP scores, dual enrollment, competitions matter more',
      ],
      evaluation_priority: [
        'Standardized test scores',
        'AP exam scores (not courses, actual exams)',
        'Dual enrollment grades at accredited colleges',
        'Competition results',
        'External recommendations',
      ],
      notes: 'Cannot evaluate homeschool GPA in isolation',
    },
  },
};

// ============================================================================
// COURSE RIGOR BENCHMARKS
// ============================================================================

export const COURSE_RIGOR_BENCHMARKS = {
  /**
   * Rigor evaluation depends on what's available
   */
  rigor_levels: {
    ap_ib: {
      weight: 1.0,
      description: 'Advanced Placement or International Baccalaureate',
      expectations_by_context: {
        elite_prep: '10-14 APs expected',
        competitive_magnet: '12-16 APs in focus area',
        well_resourced: '8-12 APs for top students',
        average_public: '4-8 APs shows maximizing',
        under_resourced: 'Any APs notable',
      },
    },
    dual_enrollment: {
      weight: 0.95,
      description: 'College courses for credit',
      evaluation: {
        research_university: 'Strong signal',
        community_college: 'Good but less weight',
      },
    },
    honors: {
      weight: 0.7,
      description: 'School-defined honors',
      notes: 'Quality varies dramatically by school',
    },
    accelerated: {
      weight: 0.5,
      description: 'Above grade level',
      notes: 'Often automatic placement',
    },
    regular: {
      weight: 0.3,
      description: 'Standard college prep',
      notes: 'Context matters - may be only option',
    },
  },

  /**
   * Subject-specific rigor for intended majors
   */
  major_specific_rigor: {
    engineering_cs: {
      required_signals: [
        'AP Calculus BC (not just AB)',
        'AP Physics C (both Mechanics and E&M)',
        'AP Computer Science A',
        'AP Chemistry or additional STEM',
      ],
      strong_signals: [
        'Multivariable Calculus',
        'Linear Algebra',
        'Differential Equations',
        'Additional CS courses',
      ],
      red_flags: [
        'No AP Calculus',
        'No AP Physics',
        'Stopped at Calc AB when BC available',
      ],
    },

    pre_med: {
      required_signals: [
        'AP Biology',
        'AP Chemistry',
        'AP Calculus',
        'AP Physics (any)',
      ],
      strong_signals: [
        'AP Statistics',
        'Research experience',
        'All science APs with 5s',
      ],
    },

    humanities: {
      required_signals: [
        'AP English Literature',
        'AP History courses',
        'AP Language',
      ],
      strong_signals: [
        'AP Art History',
        'AP European History',
        'Latin/Greek',
        'Multiple writing-intensive courses',
      ],
    },

    business_economics: {
      required_signals: [
        'AP Calculus',
        'AP Economics (Micro and Macro)',
        'AP Statistics',
      ],
      strong_signals: [
        'AP Computer Science',
        'Strong math progression',
        'Business-related ECs',
      ],
    },
  },

  /**
   * Rigor maximization scoring
   */
  rigor_maximization: {
    exceptional: {
      description: 'Taking all or nearly all available rigorous courses',
      percentage: '90%+',
      impact: 'Positive signal of intellectual ambition',
    },
    strong: {
      description: 'Taking most available rigorous courses',
      percentage: '70-89%',
      impact: 'Expected for competitive applicants',
    },
    adequate: {
      description: 'Taking significant rigorous courses',
      percentage: '50-69%',
      impact: 'Acceptable but not distinctive',
    },
    concerning: {
      description: 'Avoiding available rigor',
      percentage: '<50%',
      impact: 'Red flag unless explained',
      mitigation: 'Work, family responsibilities can explain',
    },
  },
};

// ============================================================================
// TEST SCORE CALIBRATION
// ============================================================================

export const TEST_SCORE_CALIBRATION = {
  sat: {
    percentiles_2024: {
      1600: { percentile: 99.9, tier: 't5_competitive', notes: 'Perfect score' },
      1550: { percentile: 99, tier: 't5_competitive', notes: 'Top 1%' },
      1500: { percentile: 98, tier: 't10_competitive', notes: 'Strong for T10' },
      1450: { percentile: 95, tier: 't20_competitive', notes: 'Competitive for T20' },
      1400: { percentile: 92, tier: 't30_competitive', notes: 'Solid for T30' },
      1350: { percentile: 87, tier: 't50_competitive', notes: 'Above average' },
      1300: { percentile: 82, tier: 'below_selective', notes: 'Consider test-optional' },
      1250: { percentile: 75, tier: 'below_selective', notes: 'Likely test-optional better' },
      1200: { percentile: 67, tier: 'below_selective', notes: 'Test-optional recommended' },
    },
    medians_by_school: {
      harvard: 1550,
      mit: 1560,
      stanford: 1550,
      princeton: 1540,
      yale: 1540,
      columbia: 1540,
      duke: 1530,
      northwestern: 1520,
      brown: 1520,
      cornell: 1510,
      usc: 1470,
      nyu: 1450,
      ucla: 1410, // Public
      berkeley: 1420, // Public
    },
    test_optional_threshold: {
      t5: 1500, // Below this, consider test-optional
      t10: 1450,
      t20: 1400,
      t50: 1300,
    },
  },

  act: {
    percentiles_2024: {
      36: { percentile: 99.9, tier: 't5_competitive' },
      35: { percentile: 99, tier: 't5_competitive' },
      34: { percentile: 98, tier: 't10_competitive' },
      33: { percentile: 97, tier: 't20_competitive' },
      32: { percentile: 95, tier: 't20_competitive' },
      31: { percentile: 93, tier: 't30_competitive' },
      30: { percentile: 90, tier: 't50_competitive' },
      29: { percentile: 87, tier: 'below_selective' },
      28: { percentile: 83, tier: 'below_selective' },
    },
    medians_by_school: {
      harvard: 35,
      mit: 35,
      stanford: 35,
      yale: 35,
      duke: 34,
      northwestern: 34,
      cornell: 34,
      usc: 33,
      nyu: 33,
    },
  },

  ap_exam_signals: {
    5: {
      description: 'Extremely well qualified',
      percentile: 85, // Varies by exam
      signal: 'Validates course grade, demonstrates mastery',
    },
    4: {
      description: 'Well qualified',
      percentile: 70,
      signal: 'Strong performance, good validation',
    },
    3: {
      description: 'Qualified',
      percentile: 50,
      signal: 'Passing but not exceptional',
    },
    2: {
      description: 'Possibly qualified',
      percentile: 30,
      signal: 'Generally should not report',
    },
    1: {
      description: 'No recommendation',
      percentile: 15,
      signal: 'Never report',
    },
  },

  ap_exam_difficulty_tiers: {
    hardest: {
      exams: ['Physics C: E&M', 'Physics C: Mechanics', 'Chemistry', 'Calculus BC'],
      notes: '5 is very impressive',
    },
    hard: {
      exams: ['Biology', 'US History', 'World History', 'English Literature'],
      notes: '5 is strong',
    },
    medium: {
      exams: ['Statistics', 'Psychology', 'Computer Science A', 'Calculus AB'],
      notes: '5 expected for STEM-focused students',
    },
    easier: {
      exams: ['Environmental Science', 'Human Geography', 'Computer Science Principles'],
      notes: '5 is baseline, lower scores less excusable',
    },
  },
};

// ============================================================================
// GRADE TRAJECTORY PATTERNS
// ============================================================================

export const GRADE_TRAJECTORY_ANALYSIS = {
  patterns: {
    ascending_strong: {
      name: 'Strong Ascending',
      pattern: 'Clear upward trend, especially in rigor',
      example: '3.2 freshman → 3.5 sophomore → 3.8 junior → 3.9 senior',
      impact: 'Very positive',
      harvard_adjustment: -0.3, // Improves score
      ao_interpretation: 'Growth mindset, maturing student, positive momentum',
    },

    ascending_moderate: {
      name: 'Moderate Ascending',
      pattern: 'Gradual improvement',
      example: '3.5 → 3.6 → 3.7 → 3.8',
      impact: 'Positive',
      harvard_adjustment: -0.1,
      ao_interpretation: 'Steady growth, reliable improvement',
    },

    consistently_excellent: {
      name: 'Consistently Excellent',
      pattern: 'High performance maintained',
      example: '3.95 all four years',
      impact: 'Strong baseline',
      harvard_adjustment: 0,
      ao_interpretation: 'Reliable excellence, strong foundation',
    },

    rigor_dip: {
      name: 'Rigor Increase Dip',
      pattern: 'Temporary drop when taking harder courses',
      example: '3.9 in honors → 3.7 in APs → 3.85 in more APs',
      impact: 'Neutral to positive',
      harvard_adjustment: 0,
      ao_interpretation: 'Willing to challenge self, recovered well',
    },

    senior_slide: {
      name: 'Senior Year Slide',
      pattern: 'Grades dropping senior year',
      example: '3.9 → 3.9 → 3.9 → 3.6',
      impact: 'Concerning',
      harvard_adjustment: +0.2,
      ao_interpretation: 'Senioritis, motivation concerns',
      notes: 'First semester matters; spring can cause rescinded admission',
    },

    descending: {
      name: 'Descending Trajectory',
      pattern: 'Consistent downward trend',
      example: '3.8 → 3.6 → 3.4 → 3.2',
      impact: 'Major red flag',
      harvard_adjustment: +0.5,
      ao_interpretation: 'Something is wrong - needs explanation',
      mitigation: 'Family crisis, health issues can explain',
    },

    erratic: {
      name: 'Erratic/Inconsistent',
      pattern: 'Significant variation without clear pattern',
      example: '3.5 → 3.9 → 3.4 → 3.8',
      impact: 'Concerning',
      harvard_adjustment: +0.2,
      ao_interpretation: 'Inconsistent effort or external factors',
    },

    junior_peak: {
      name: 'Junior Year Peak',
      pattern: 'Best performance junior year, key for admissions',
      example: '3.6 → 3.7 → 3.9 → 3.8',
      impact: 'Strategically good',
      harvard_adjustment: 0,
      ao_interpretation: 'Peak when it mattered most',
    },
  },

  subject_patterns: {
    stem_excellence: {
      description: 'Strong in STEM, weaker in humanities',
      impact_for_stem_major: 'Acceptable',
      impact_for_humanities_major: 'Concerning',
    },
    humanities_excellence: {
      description: 'Strong in humanities, weaker in STEM',
      impact_for_stem_major: 'Concerning',
      impact_for_humanities_major: 'Acceptable',
    },
    balanced: {
      description: 'Even performance across subjects',
      impact: 'Neutral to positive',
    },
  },
};

// ============================================================================
// RESEARCH AND INTELLECTUAL ENGAGEMENT
// ============================================================================

export const RESEARCH_CALIBRATION = {
  /**
   * Research quality hierarchy
   */
  research_tiers: {
    tier_1_exceptional: {
      criteria: [
        'Published in peer-reviewed professional journal',
        'Presented at major academic conference',
        'Original research with novel findings',
        'Multi-year project with significant depth',
        'Mentorship from recognized expert',
      ],
      examples: [
        'First-author in Nature, Science, Cell (extremely rare)',
        'Published in field-specific peer-reviewed journal',
        'Regeneron STS finalist project',
        'ISEF Grand Award project',
      ],
      harvard_equivalent: 1.5,
      admission_impact: 'exceptional',
    },

    tier_2_strong: {
      criteria: [
        'Published in competitive student journals',
        'Presented at regional academic conference',
        'Original methodology or findings',
        'Substantial contribution to lab work',
      ],
      examples: [
        'Concord Review publication (5% acceptance)',
        'Columbia Junior Science Journal',
        'Regeneron STS Scholar',
        'ISEF finalist',
        'Multi-summer research internship with output',
      ],
      harvard_equivalent: 2.5,
      admission_impact: 'strong',
    },

    tier_3_solid: {
      criteria: [
        'Research experience at university',
        'Clear contribution to project',
        'Poster presentation at symposium',
        'Understanding of research process',
      ],
      examples: [
        'Summer research program at university',
        'State science fair finalist',
        'Independent research with clear output',
        'Publication in general student journals',
      ],
      harvard_equivalent: 3.5,
      admission_impact: 'solid',
    },

    tier_4_foundational: {
      criteria: [
        'Research class participation',
        'Science fair participation',
        'Lab assistant experience',
      ],
      examples: [
        'School research program',
        'Regional science fair',
        'Shadowing researcher',
      ],
      harvard_equivalent: 4,
      admission_impact: 'shows_interest',
    },
  },

  /**
   * Intellectual engagement beyond research
   */
  intellectual_engagement_signals: {
    exceptional: [
      'Self-directed deep study in area of interest',
      'Reading academic papers/textbooks independently',
      'Correspondence with professors/experts',
      'Created educational content used by others',
      'Intellectual blog/writing with genuine following',
    ],
    strong: [
      'Completed rigorous online courses (MIT OCW, Coursera specializations)',
      'Extensive reading in field of interest',
      'Academic clubs with intellectual depth',
      'Asking questions that go beyond curriculum',
    ],
    basic: [
      'Academic club participation',
      'Interest in learning beyond requirements',
      'Good questions in class',
    ],
    absent: [
      'No evidence of intellectual curiosity beyond grades',
      'Only does required work',
      'No exploration of interests',
    ],
  },

  /**
   * Red flags in research claims
   */
  research_red_flags: [
    'Research started senior year (timing suspicious)',
    'Vague description of contribution',
    'Can\'t explain own research when asked',
    'Claims publication without verifiable venue',
    'Research topic has no connection to stated interests',
    'Multiple unrelated research projects (breadth over depth)',
    '"Published" in predatory journals',
    'Research at private companies with no output',
  ],
};

// ============================================================================
// ACADEMIC ACHIEVEMENT SCORING FUNCTION
// ============================================================================

export interface AcademicInput {
  gpa: {
    unweighted: number;
    weighted?: number;
    scale: number;
  };
  schoolContext: keyof typeof GPA_CALIBRATION.school_contexts;
  courseRigor: {
    apCount: number;
    apAvailable: number;
    ibStudent?: boolean;
    dualEnrollment?: boolean;
  };
  testScores?: {
    sat?: number;
    act?: number;
    apScores?: { subject: string; score: number }[];
  };
  trajectory?: keyof typeof GRADE_TRAJECTORY_ANALYSIS.patterns;
  intendedMajor?: string;
  researchExperience?: {
    tier: keyof typeof RESEARCH_CALIBRATION.research_tiers;
    description: string;
  };
}

export interface AcademicResult {
  harvardScore: number;
  confidence: number;
  gpaAnalysis: {
    contextAdjustedPercentile: number;
    strengthForContext: string;
    concerns: string[];
  };
  rigorAnalysis: {
    rigorMaximization: number;
    missingCriticalCourses: string[];
    strength: string;
  };
  testAnalysis?: {
    competitiveTier: string;
    recommendation: string;
  };
  trajectoryImpact: {
    pattern: string;
    scoreAdjustment: number;
  };
  researchImpact?: {
    tier: string;
    scoreAdjustment: number;
  };
  overallAssessment: string;
  recommendations: string[];
}

export function analyzeAcademicProfileWithDatabase(input: AcademicInput): AcademicResult {
  const context = GPA_CALIBRATION.school_contexts[input.schoolContext];
  let harvardScore = 4; // Start at average
  const concerns: string[] = [];
  const recommendations: string[] = [];

  // GPA Analysis
  const gpaStr = input.gpa.unweighted.toFixed(1);
  let gpaInterpretation: { percentile: number; harvard_equivalent: number; notes?: string } | undefined;
  const gpaInterpMap = (context as { gpa_interpretation?: Record<string, { percentile: number; harvard_equivalent: number; notes?: string }> }).gpa_interpretation || {};
  for (const [range, interp] of Object.entries(gpaInterpMap)) {
    if (range.includes('+')) {
      const min = parseFloat(range.replace('+', ''));
      if (input.gpa.unweighted >= min) {
        gpaInterpretation = interp;
        break;
      }
    } else if (range.includes('-')) {
      const [min, max] = range.split('-').map(parseFloat);
      if (input.gpa.unweighted >= min && input.gpa.unweighted <= max) {
        gpaInterpretation = interp;
        break;
      }
    } else if (range.startsWith('<')) {
      const max = parseFloat(range.replace('<', ''));
      if (input.gpa.unweighted < max) {
        gpaInterpretation = interp;
        break;
      }
    }
  }

  if (gpaInterpretation) {
    harvardScore = gpaInterpretation.harvard_equivalent;
  }

  // Apply context bonus
  if ('context_bonus' in context) {
    harvardScore -= context.context_bonus as number;
    recommendations.push(`Context bonus applied: ${input.schoolContext} provides +${context.context_bonus} advantage`);
  }

  // Rigor Analysis
  const rigorMaximization = input.courseRigor.apAvailable > 0
    ? input.courseRigor.apCount / input.courseRigor.apAvailable
    : 0;

  if (rigorMaximization < 0.5 && input.courseRigor.apAvailable > 5) {
    concerns.push('Not maximizing available course rigor');
    harvardScore += 0.3;
  } else if (rigorMaximization > 0.9) {
    recommendations.push('Excellent rigor maximization');
    harvardScore -= 0.1;
  }

  // Check major-specific courses
  const missingCriticalCourses: string[] = [];
  if (input.intendedMajor) {
    const majorKey = input.intendedMajor.toLowerCase().includes('engineer') ||
                     input.intendedMajor.toLowerCase().includes('computer')
      ? 'engineering_cs'
      : input.intendedMajor.toLowerCase().includes('med') ||
        input.intendedMajor.toLowerCase().includes('bio')
        ? 'pre_med'
        : 'humanities';

    const majorReqs = COURSE_RIGOR_BENCHMARKS.major_specific_rigor[majorKey as keyof typeof COURSE_RIGOR_BENCHMARKS.major_specific_rigor];
    if (majorReqs) {
      // This would need course list to fully evaluate
      recommendations.push(`For ${input.intendedMajor}, ensure: ${majorReqs.required_signals.join(', ')}`);
    }
  }

  // Test Score Analysis
  let testAnalysis;
  if (input.testScores?.sat) {
    const satData = Object.entries(TEST_SCORE_CALIBRATION.sat.percentiles_2024)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .find(([score]) => input.testScores!.sat! >= parseInt(score));

    if (satData) {
      testAnalysis = {
        competitiveTier: satData[1].tier,
        recommendation: input.testScores.sat >= 1500
          ? 'Submit everywhere'
          : input.testScores.sat >= 1400
            ? 'Submit to most, consider test-optional for T5'
            : 'Consider test-optional at selective schools',
      };

      // Adjust Harvard score based on test performance
      if (input.testScores.sat >= 1550) harvardScore -= 0.2;
      else if (input.testScores.sat < 1350) harvardScore += 0.2;
    }
  }

  // Trajectory Analysis
  let trajectoryImpact = { pattern: 'unknown', scoreAdjustment: 0 };
  if (input.trajectory) {
    const pattern = GRADE_TRAJECTORY_ANALYSIS.patterns[input.trajectory];
    trajectoryImpact = {
      pattern: pattern.name,
      scoreAdjustment: pattern.harvard_adjustment,
    };
    harvardScore += pattern.harvard_adjustment;
  }

  // Research Impact
  let researchImpact;
  if (input.researchExperience) {
    const tier = RESEARCH_CALIBRATION.research_tiers[input.researchExperience.tier];
    const adjustment = tier.harvard_equivalent - 3; // Relative to average
    researchImpact = {
      tier: input.researchExperience.tier,
      scoreAdjustment: -adjustment * 0.3, // Partial weight
    };
    harvardScore += researchImpact.scoreAdjustment;
  }

  // Bound score
  harvardScore = Math.max(1, Math.min(6, harvardScore));

  return {
    harvardScore: Math.round(harvardScore * 10) / 10,
    confidence: 0.8,
    gpaAnalysis: {
      contextAdjustedPercentile: gpaInterpretation?.percentile || 50,
      strengthForContext: gpaInterpretation?.notes || 'Unable to determine',
      concerns,
    },
    rigorAnalysis: {
      rigorMaximization: Math.round(rigorMaximization * 100),
      missingCriticalCourses,
      strength: rigorMaximization > 0.9 ? 'exceptional' : rigorMaximization > 0.7 ? 'strong' : rigorMaximization > 0.5 ? 'adequate' : 'concerning',
    },
    testAnalysis,
    trajectoryImpact,
    researchImpact,
    overallAssessment: harvardScore <= 2 ? 'Exceptional academic profile' :
                       harvardScore <= 3 ? 'Strong academic profile' :
                       harvardScore <= 4 ? 'Competitive academic profile' :
                       'Academic profile needs strengthening',
    recommendations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicDatabase = {
  GPA_CALIBRATION,
  COURSE_RIGOR_BENCHMARKS,
  TEST_SCORE_CALIBRATION,
  GRADE_TRAJECTORY_ANALYSIS,
  RESEARCH_CALIBRATION,
  analyzeAcademicProfileWithDatabase,
};
