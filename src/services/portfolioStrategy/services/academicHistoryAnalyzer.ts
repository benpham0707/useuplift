/**
 * Academic History Analyzer
 *
 * Comprehensive academic profile evaluation inspired by PIQ Workshop architecture.
 * Integrates Section 6 research modules to provide:
 *
 * 1. Research-backed assessment of academic profile
 * 2. School context calibration (6.5)
 * 3. Course rigor analysis with citation support (6.1, 6.2)
 * 4. Dual enrollment evaluation (6.3)
 * 5. Grade interpretation with trend analysis (6.6)
 * 6. International curriculum handling (6.7)
 * 7. Homeschool credential validation (6.8)
 * 8. Red flag detection with severity tiers (6.9)
 *
 * Uses Sonnet for nuanced analysis, Haiku for quick diagnostics.
 *
 * @version 1.0
 * @date January 2026
 */

import { callClaude } from '../../../lib/llm/claude';

// ============================================================================
// SECTION 6 RESEARCH KNOWLEDGE BASE
// Comprehensive academic evaluation frameworks from research
// ============================================================================

/**
 * Module 6.1: Course Level Hierarchy
 * Research-backed course rigor weighting system
 */
export const COURSE_LEVEL_HIERARCHY = {
  ap_ib_hl: {
    name: 'AP / IB HL',
    weight: 1.0,
    description: 'Gold standard, externally validated rigor',
    admissions_perception: 'Demonstrates willingness to challenge self with college-level work',
    citation: {
      source: 'CollegeVine',
      quote: 'AP and IB courses are the most rigorous high school courses available and are viewed as the standard for college-level preparation.',
    },
  },
  dual_enrollment_r1: {
    name: 'Dual Enrollment (Research University)',
    weight: 0.95,
    description: 'True college work at selective institution',
    admissions_perception: 'Strong evidence of readiness for college environment',
    citation: {
      source: 'NACAC',
      quote: 'Dual enrollment at research universities demonstrates genuine college-level success.',
    },
  },
  ib_sl: {
    name: 'IB SL',
    weight: 0.85,
    description: 'International Baccalaureate Standard Level',
    admissions_perception: 'Above honors, part of rigorous international curriculum',
    citation: {
      source: 'IB Organization',
      quote: 'SL courses are designed to be challenging while allowing breadth across disciplines.',
    },
  },
  dual_enrollment_cc: {
    name: 'Dual Enrollment (Community College)',
    weight: 0.80,
    description: 'College credit, variable rigor',
    admissions_perception: 'Valid but viewed like honors at selective schools',
    citation: {
      source: 'CollegeVine',
      quote: 'At Top Elites or Ivy, the presence of Dual-Enrollment coursework on your transcript only works as evidence of course rigor.',
    },
  },
  honors: {
    name: 'Honors',
    weight: 0.70,
    description: 'Above-average challenge, school-dependent rigor',
    admissions_perception: 'Good foundation but not externally validated',
    citation: {
      source: 'PrepScholar',
      quote: 'Honors courses show you want more challenge but their rigor varies dramatically by school.',
    },
  },
  accelerated: {
    name: 'Accelerated',
    weight: 0.50,
    description: 'Some challenge, often grade-based placement',
    admissions_perception: 'Baseline for college-bound students',
    citation: {
      source: 'College Board',
      quote: 'Accelerated courses indicate readiness for more challenge but lack external validation.',
    },
  },
  regular: {
    name: 'Regular',
    weight: 0.30,
    description: 'Standard curriculum meeting graduation requirements',
    admissions_perception: 'Context matters - choice vs access',
    citation: {
      source: 'NACAC',
      quote: 'Regular courses are evaluated in context of what was available to the student.',
    },
  },
};

/**
 * Module 6.2: AP Course Difficulty Tiers
 * Research on AP exam pass rates and perceived difficulty
 */
export const AP_DIFFICULTY_TIERS = {
  tier1_hardest: {
    courses: [
      'Physics C: Electricity & Magnetism',
      'Physics C: Mechanics',
      'Chemistry',
      'Calculus BC',
      'Physics 1',
      'Physics 2',
    ],
    pass_rate: '<55%',
    five_rate: '12-30%',
    signal: 'Most challenging AP courses, success shows genuine mastery',
    citation: {
      source: 'College Board / AP Score Distributions',
      quote: 'Physics C E&M has historically had one of the lowest pass rates at around 40%.',
    },
  },
  tier2_hard: {
    courses: [
      'Biology',
      'US History',
      'English Literature',
      'European History',
      'World History',
      'Art History',
    ],
    pass_rate: '55-65%',
    five_rate: '8-14%',
    signal: 'Challenging courses requiring significant content mastery',
    citation: {
      source: 'College Board',
      quote: 'History and Literature APs require extensive reading and writing skills.',
    },
  },
  tier3_medium: {
    courses: [
      'Statistics',
      'Psychology',
      'Computer Science A',
      'Calculus AB',
      'English Language',
      'Government',
    ],
    pass_rate: '65-75%',
    five_rate: '14-28%',
    signal: 'Solid challenge, widely taken',
    citation: {
      source: 'College Board',
      quote: 'These courses balance rigor with accessibility for motivated students.',
    },
  },
  tier4_easier: {
    courses: [
      'Environmental Science',
      'Human Geography',
      'Computer Science Principles',
      'Spanish Language',
      'French Language',
    ],
    pass_rate: '>70%',
    five_rate: '9-18%',
    signal: 'Entry-level APs, good for building confidence',
    citation: {
      source: 'College Board',
      quote: 'These courses serve as accessible entry points to AP curriculum.',
    },
  },
};

/**
 * Module 6.5: School Context Calibration
 * 6-tier school system for GPA interpretation
 */
export const SCHOOL_CONTEXT_TIERS = {
  tier1_elite_prep: {
    name: 'Elite Preparatory School',
    examples: 'Phillips Exeter, Andover, Deerfield, Lawrenceville',
    characteristics: {
      avg_gpa: 3.3,
      grade_inflation: 'deflated',
      ap_courses_offered: '25+',
      ivy_placement: '30-40%',
    },
    evaluation_adjustment: {
      gpa_interpretation: '3.5 UW is competitive, 3.8+ is exceptional',
      rigor_expectation: 'Most rigorous available expected',
      context_bonus: -0.1, // Higher bar
    },
    citation: {
      source: 'Niche / Private School Data',
      quote: 'Elite prep schools have notoriously difficult grading, where a B+ is considered strong.',
    },
  },
  tier2_competitive_magnet: {
    name: 'Competitive Public/Magnet',
    examples: 'Thomas Jefferson, Stuyvesant, IMSA, Bronx Science',
    characteristics: {
      avg_gpa: 3.5,
      grade_inflation: 'slightly_deflated',
      ap_courses_offered: '20+',
      ivy_placement: '20-30%',
    },
    evaluation_adjustment: {
      gpa_interpretation: '3.7 UW is competitive, 3.9+ is exceptional',
      rigor_expectation: 'Full STEM or specialty rigor expected',
      context_bonus: -0.05,
    },
    citation: {
      source: 'US News High School Rankings',
      quote: 'Magnet schools maintain rigorous standards with competitive grading.',
    },
  },
  tier3_well_resourced: {
    name: 'Well-Resourced Suburban',
    examples: 'Top suburban publics with 15-20 AP courses',
    characteristics: {
      avg_gpa: 3.4,
      grade_inflation: 'standard',
      ap_courses_offered: '15-20',
      ivy_placement: '5-15%',
    },
    evaluation_adjustment: {
      gpa_interpretation: '3.8+ UW competitive, 4.0 common among top students',
      rigor_expectation: '10-12 APs expected for competitive applicants',
      context_bonus: 0,
    },
    citation: {
      source: 'NACAC State of College Admission',
      quote: 'Well-resourced schools provide opportunities that students are expected to utilize.',
    },
  },
  tier4_average_public: {
    name: 'Average Public School',
    examples: 'Typical public school with 5-10 AP options',
    characteristics: {
      avg_gpa: 3.2,
      grade_inflation: 'often_inflated',
      ap_courses_offered: '5-10',
      ivy_placement: '1-3%',
    },
    evaluation_adjustment: {
      gpa_interpretation: 'Taking most available APs is exceptional',
      rigor_expectation: 'Maximize what is available',
      context_bonus: +0.1,
    },
    citation: {
      source: 'CollegeVine',
      quote: 'Students are evaluated on how well they used the opportunities available to them.',
    },
  },
  tier5_under_resourced: {
    name: 'Under-Resourced School',
    examples: 'Limited AP/honors, high free lunch rates, low college-going rate',
    characteristics: {
      avg_gpa: 3.0,
      grade_inflation: 'varies_widely',
      ap_courses_offered: '<5',
      ivy_placement: '<1%',
    },
    evaluation_adjustment: {
      gpa_interpretation: 'Any AP/honors is notable achievement',
      rigor_expectation: 'Any evidence of seeking challenge',
      context_bonus: +0.2,
    },
    citation: {
      source: 'Opportunity Insights / Harvard Research',
      quote: 'Students from under-resourced schools who show initiative deserve significant context adjustment.',
    },
  },
  tier6_rural_homeschool: {
    name: 'Rural/Homeschool',
    examples: 'Geographic isolation, homeschool programs',
    characteristics: {
      avg_gpa: 'n/a',
      grade_inflation: 'cannot_evaluate',
      ap_courses_offered: '0-3',
      ivy_placement: 'varies',
    },
    evaluation_adjustment: {
      gpa_interpretation: 'External validation critical',
      rigor_expectation: 'Online courses, DE, competitions show initiative',
      context_bonus: '+0.15 with external validation',
    },
    citation: {
      source: 'MIT Admissions Blog',
      quote: 'We look for students who maximize their opportunities, whatever those may be.',
    },
  },
};

/**
 * Module 6.6: GPA Expectations by Selectivity
 * Research on admitted student GPA profiles
 */
export const GPA_EXPECTATIONS = {
  ivy_league: {
    tier: 'Ivy League',
    avg_unweighted_gpa: [3.9, 4.0],
    avg_weighted_gpa: [4.15, 4.25],
    percent_top_10: '94-97%',
    percent_4_0_plus: '72-74%',
    citation: {
      source: 'College Scorecard / Common Data Sets',
      quote: 'Stanford reports 73.3% of admitted students had 4.0 GPA, 97.8% in top 10%.',
    },
  },
  top_10: {
    tier: 'Top 10 Schools',
    avg_unweighted_gpa: [3.85, 4.0],
    avg_weighted_gpa: [4.10, 4.20],
    percent_top_10: '90%+',
    percent_4_0_plus: '65-70%',
    citation: {
      source: 'US News / Niche Data',
      quote: 'Top 10 schools expect near-perfect academic records as baseline.',
    },
  },
  top_20: {
    tier: 'Top 20 Schools',
    avg_unweighted_gpa: [3.8, 3.95],
    avg_weighted_gpa: [4.0, 4.15],
    percent_top_10: '85%+',
    percent_4_0_plus: '55-65%',
    citation: {
      source: 'Niche / Admissions Data',
      quote: 'Strong grades are standard; differentiation comes from other factors.',
    },
  },
  top_30: {
    tier: 'Top 30 Schools',
    avg_unweighted_gpa: [3.7, 3.9],
    avg_weighted_gpa: [3.9, 4.05],
    percent_top_10: '75%+',
    percent_4_0_plus: '45-55%',
    citation: {
      source: 'College Data',
      quote: 'Some flexibility exists, context and other strengths can compensate.',
    },
  },
  top_50: {
    tier: 'Top 50 Schools',
    avg_unweighted_gpa: [3.5, 3.8],
    avg_weighted_gpa: [3.7, 3.95],
    percent_top_10: '60%+',
    percent_4_0_plus: '35-45%',
    citation: {
      source: 'Niche / College Navigator',
      quote: 'Context matters more; holistic review provides more flexibility.',
    },
  },
};

/**
 * Module 6.9: Academic Red Flags
 * 4-tier severity system with mitigation guidance
 */
export const ACADEMIC_RED_FLAGS = {
  tier1_disqualifying: {
    severity: 'Disqualifying',
    impact: 'Likely rejection',
    flags: [
      {
        name: 'Academic Dishonesty',
        description: 'Cheating, plagiarism, or falsification on record',
        indicator: 'Disciplinary action noted on transcript or school report',
        mitigation: 'Extremely limited - requires exceptional circumstances explanation',
      },
      {
        name: 'Transcript Falsification',
        description: 'Misrepresented courses, grades, or credentials',
        indicator: 'Discrepancies between self-reported and official records',
        mitigation: 'None - automatic rejection and possible reporting',
      },
    ],
    citation: {
      source: 'NACAC Ethical Standards',
      quote: 'Academic dishonesty is grounds for rescinding admission offers.',
    },
  },
  tier2_serious: {
    severity: 'Serious Concern',
    impact: 'Major negative factor',
    flags: [
      {
        name: 'Senior Year Decline (Senioritis)',
        description: 'Significant grade drop in senior year',
        indicator: 'GPA drop of 0.3+ or multiple B/C grades after strong junior year',
        mitigation: 'Strong mid-year and final transcripts, explanation if circumstances warrant',
      },
      {
        name: 'Rigor Avoidance with High GPA',
        description: '4.0 with minimal advanced courses',
        indicator: '<3 AP/IB courses with 3.9+ GPA and 10+ APs available',
        mitigation: 'Explain rationale, demonstrate intellectual curiosity elsewhere',
      },
      {
        name: 'Major-Course Mismatch',
        description: 'STEM major without Calc BC/Physics, etc.',
        indicator: 'Intended major with no advanced coursework in that field',
        mitigation: 'Summer programs, independent study, or explain access limitations',
      },
    ],
    citation: {
      source: 'NACAC / Education Week',
      quote: '74.1% of colleges consider senior year grades important. 22% rescind at least one admission per year.',
    },
  },
  tier3_moderate: {
    severity: 'Moderate Concern',
    impact: 'Requires context/explanation',
    flags: [
      {
        name: 'GPA-Test Score Mismatch',
        description: 'High GPA with low test scores or vice versa',
        indicator: '4.0 GPA with <1350 SAT or 3.5 GPA with 1550+ SAT',
        mitigation: 'Test-optional if scores hurt, explain grade deflation if GPA low',
      },
      {
        name: 'AP Score-Grade Mismatch',
        description: 'A in AP course but 1-2 on exam',
        indicator: 'Pattern of high course grades with low exam scores',
        mitigation: 'Consider not reporting AP scores, address in additional info',
      },
      {
        name: 'Single Year Dip with Recovery',
        description: 'One semester/year of poor performance followed by recovery',
        indicator: 'GPA drop followed by return to previous level',
        mitigation: 'Upward trajectory is positive; explain circumstances if applicable',
      },
    ],
    citation: {
      source: 'Opportunity Insights Research',
      quote: 'Higher SAT scores correlate with college GPA more than high school GPA does.',
    },
  },
  tier4_minor: {
    severity: 'Minor Concern',
    impact: 'Usually explainable',
    flags: [
      {
        name: 'Single Outlier Grade',
        description: 'One C in otherwise strong transcript',
        indicator: 'Single subject area weakness',
        mitigation: 'Often no explanation needed; brief note if relevant',
      },
      {
        name: 'Unusual Course Sequence',
        description: 'Taking courses out of typical order',
        indicator: 'AP Physics before Honors Physics, etc.',
        mitigation: 'Can be positive if shows initiative; explain if concerning',
      },
      {
        name: 'Light Senior Schedule',
        description: 'Fewer courses in senior year',
        indicator: 'Dropping from 6 to 4 courses',
        mitigation: 'Explain if pursuing meaningful activities or work',
      },
    ],
    citation: {
      source: 'Admissions Officers Survey',
      quote: 'Minor inconsistencies are rarely decisive factors in admission decisions.',
    },
  },
};

/**
 * Module 6.7: International Curriculum Conversions
 * Frameworks for evaluating non-US curricula
 */
export const INTERNATIONAL_CURRICULA = {
  ib_diploma: {
    system: 'International Baccalaureate',
    scale: '1-45 points',
    conversions: {
      exceptional: { score: '40-45', us_gpa: '3.9-4.0', t20_assessment: 'Exceptional' },
      competitive: { score: '36-39', us_gpa: '3.7-3.9', t20_assessment: 'Competitive' },
      possible: { score: '32-35', us_gpa: '3.5-3.7', t20_assessment: 'Possible with hooks' },
      unlikely: { score: '<32', us_gpa: '<3.5', t20_assessment: 'Significant challenge' },
    },
    citation: {
      source: 'IB Organization / University Research',
      quote: 'A score of 38+ is typically competitive for Ivy League admission.',
    },
  },
  a_levels: {
    system: 'UK A-Levels',
    scale: 'A*-E grades',
    conversions: {
      exceptional: { grades: 'A*A*A*', us_gpa: '4.0', t20_assessment: 'Exceptional' },
      strong: { grades: 'A*A*A / AAA', us_gpa: '3.8-3.9', t20_assessment: 'Strong' },
      competitive: { grades: 'AAB', us_gpa: '3.6-3.8', t20_assessment: 'Competitive' },
      acceptable: { grades: 'ABB', us_gpa: '3.4-3.6', t20_assessment: 'Context-dependent' },
    },
    citation: {
      source: 'UK University Admissions',
      quote: 'AAA or better is typically required for top US universities.',
    },
  },
  cbse_india: {
    system: 'CBSE (India)',
    scale: '0-100%',
    conversions: {
      exceptional: { score: '95%+', us_gpa: '4.0', t20_assessment: 'Excellent' },
      strong: { score: '90-95%', us_gpa: '3.8-3.9', t20_assessment: 'Strong' },
      competitive: { score: '85-90%', us_gpa: '3.6-3.8', t20_assessment: 'Competitive' },
      acceptable: { score: '80-85%', us_gpa: '3.4-3.6', t20_assessment: 'Context-dependent' },
    },
    citation: {
      source: 'Indian Education Research',
      quote: '95%+ in CBSE board exams is considered equivalent to top US grades.',
    },
  },
};

/**
 * Module 6.8: Homeschool Validation Pyramid
 * Framework for evaluating homeschool credentials
 */
export const HOMESCHOOL_VALIDATION = {
  primary_validators: [
    {
      type: 'Standardized Tests',
      weight: 'Highest',
      examples: ['SAT/ACT scores', 'AP Exam scores', 'SAT Subject Tests (historical)'],
      reasoning: 'External, objective measure independent of parent grading',
      citation: {
        source: 'Harvard Admissions',
        quote: 'Test scores provide external validation that transcripts alone cannot offer.',
      },
    },
    {
      type: 'External Coursework',
      weight: 'High',
      examples: ['Community college courses', 'University dual enrollment', 'Accredited online programs'],
      reasoning: 'Third-party grading provides credibility',
      citation: {
        source: 'MIT Admissions',
        quote: 'External coursework helps us evaluate academic preparation consistently.',
      },
    },
    {
      type: 'Academic Competitions',
      weight: 'High',
      examples: ['Math Olympiad', 'Science Olympiad', 'Debate tournaments', 'Spelling bee'],
      reasoning: 'Demonstrates ability in competitive, standardized context',
      citation: {
        source: 'CollegeVine',
        quote: 'Competition results provide benchmarking against traditional school students.',
      },
    },
  ],
  secondary_validators: [
    {
      type: 'Outside Recommendations',
      weight: 'Medium',
      examples: ['Research mentors', 'Community leaders', 'Employers', 'Religious leaders'],
      reasoning: 'Non-parent perspectives add credibility',
      citation: {
        source: 'Cornell Admissions',
        quote: 'We value recommendations from adults who can speak to academic abilities.',
      },
    },
    {
      type: 'Portfolio Documentation',
      weight: 'Medium',
      examples: ['Detailed syllabi', 'Reading lists', 'Project descriptions', 'Research papers'],
      reasoning: 'Shows rigor and depth of curriculum',
      citation: {
        source: 'Duke Admissions',
        quote: 'Detailed documentation helps us understand the homeschool curriculum.',
      },
    },
  ],
  limited_value: [
    {
      type: 'Parent-Assigned Grades',
      weight: 'Low',
      reasoning: 'Cannot be independently verified; potential for bias',
      citation: {
        source: 'NACAC',
        quote: 'Parent grades are taken in context but cannot be weighted the same as external evaluation.',
      },
    },
  ],
};

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicHistoryInput {
  // Core academic data
  gpa: {
    unweighted?: number;
    weighted?: number;
    scale: number;
    class_rank?: {
      rank: number;
      total: number;
    };
    percentile?: number;
  };

  // Course history
  courses: CourseRecord[];

  // Test scores
  test_scores?: {
    sat?: {
      total: number;
      math: number;
      ebrw: number;
    };
    act?: {
      composite: number;
      english?: number;
      math?: number;
      reading?: number;
      science?: number;
    };
    ap_exams?: Array<{
      subject: string;
      score: 1 | 2 | 3 | 4 | 5;
      year: number;
    }>;
    ib_exams?: Array<{
      subject: string;
      score: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      level: 'HL' | 'SL';
    }>;
  };

  // School context
  school_context: {
    type: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international';
    name?: string;
    tier?: keyof typeof SCHOOL_CONTEXT_TIERS;
    ap_courses_offered?: number;
    ib_program?: boolean;
    curriculum?: 'us' | 'ib' | 'a_levels' | 'cbse' | 'other';
    state?: string;
    country?: string;
  };

  // Grade history for trajectory
  grade_history?: {
    freshman?: { gpa: number; courses: number };
    sophomore?: { gpa: number; courses: number };
    junior?: { gpa: number; courses: number };
    senior?: { gpa: number; courses: number };
  };

  // Intended academic direction
  intended_major?: string;
  target_schools?: string[];
}

export interface CourseRecord {
  name: string;
  subject: 'math' | 'science' | 'english' | 'social_studies' | 'foreign_language' | 'arts' | 'other';
  level: 'ap' | 'ib_hl' | 'ib_sl' | 'honors' | 'dual_enrollment' | 'accelerated' | 'regular';
  grade: string;
  year: 9 | 10 | 11 | 12;
  semester?: 'fall' | 'spring' | 'full_year';
  de_institution?: string; // For dual enrollment
  de_type?: 'research_university' | 'regional_university' | 'community_college' | 'online';
}

export interface AcademicHistoryAnalysis {
  // Overall assessment
  overall: {
    harvard_score: 1 | 2 | 3 | 4 | 5 | 6; // 1 = exceptional, 6 = concerns
    confidence: number;
    summary: string;
    standout_factors: string[];
    concern_factors: string[];
  };

  // Component analyses with citations
  gpa_analysis: GPAAnalysis;
  rigor_analysis: RigorAnalysis;
  trajectory_analysis: TrajectoryAnalysis;
  testing_analysis: TestingAnalysis;
  red_flag_assessment: RedFlagAssessment;

  // Context-specific analyses (conditional)
  dual_enrollment_analysis?: DualEnrollmentAnalysis;
  international_analysis?: InternationalAnalysis;
  homeschool_analysis?: HomeschoolAnalysis;

  // Strategic guidance
  competitive_positioning: CompetitivePositioning;
  recommendations: AcademicRecommendations;

  // Citations for all claims
  citations: CitationRecord[];
}

export interface GPAAnalysis {
  raw_assessment: {
    unweighted: { value: number; percentile: string };
    weighted?: { value: number; percentile: string };
  };
  context_adjusted: {
    school_tier: string;
    adjustment_factor: number;
    effective_strength: string;
  };
  comparative_analysis: {
    vs_ivy_pool: string;
    vs_t20_pool: string;
    vs_t50_pool: string;
  };
  class_rank_context?: {
    percentile: number;
    interpretation: string;
  };
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface RigorAnalysis {
  rigor_score: number; // 0-100
  rigor_level: 'maximum' | 'very_high' | 'high' | 'moderate' | 'low';
  course_breakdown: {
    ap_count: number;
    ib_count: number;
    honors_count: number;
    de_count: number;
    total_advanced: number;
  };
  rigor_maximization: {
    available_rigor: number;
    utilized_rigor: number;
    utilization_rate: number;
    assessment: string;
  };
  subject_depth: Array<{
    subject: string;
    courses: string[];
    depth_level: 'exceptional' | 'strong' | 'adequate' | 'limited';
    major_alignment?: boolean;
  }>;
  ap_difficulty_analysis?: {
    tier1_count: number;
    tier2_count: number;
    tier3_count: number;
    tier4_count: number;
    difficulty_score: number;
  };
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface TrajectoryAnalysis {
  pattern: 'ascending' | 'consistently_excellent' | 'stable' | 'descending' | 'inconsistent' | 'rigor_dip';
  description: string;
  grade_progression: {
    freshman: number;
    sophomore: number;
    junior: number;
    senior?: number;
  };
  momentum: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
  admissions_interpretation: string;
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface TestingAnalysis {
  overall_assessment: string;
  sat_analysis?: {
    total: number;
    percentile: number;
    math_strength: 'strong' | 'average' | 'weak';
    ebrw_strength: 'strong' | 'average' | 'weak';
    competitive_level: string;
  };
  act_analysis?: {
    composite: number;
    percentile: number;
    strengths: string[];
    weaknesses: string[];
    competitive_level: string;
  };
  ap_exam_analysis?: {
    total_exams: number;
    fives: number;
    fours: number;
    threes_or_below: number;
    average_score: number;
    validation_strength: 'strong' | 'moderate' | 'weak';
  };
  gpa_test_alignment: {
    aligned: boolean;
    discrepancy?: string;
    interpretation: string;
  };
  test_optional_recommendation: {
    recommendation: 'submit_everywhere' | 'submit_most' | 'school_specific' | 'consider_test_optional';
    rationale: string;
  };
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface RedFlagAssessment {
  flags_detected: Array<{
    flag_name: string;
    severity: 'tier1_disqualifying' | 'tier2_serious' | 'tier3_moderate' | 'tier4_minor';
    description: string;
    evidence: string;
    mitigation_guidance: string;
  }>;
  overall_risk_level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface DualEnrollmentAnalysis {
  courses_evaluated: Array<{
    course_name: string;
    institution_type: string;
    rigor_tier: 1 | 2 | 3 | 4;
    grade: string;
    admissions_value: 'high' | 'moderate' | 'low' | 'minimal';
    reasoning: string;
  }>;
  overall_de_assessment: string;
  credit_transfer_likelihood: string;
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface InternationalAnalysis {
  curriculum_type: string;
  conversion: {
    original_metric: string;
    us_gpa_equivalent: string;
    t20_assessment: string;
  };
  cultural_context: string;
  admissions_interpretation: string;
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface HomeschoolAnalysis {
  validation_strength: 'strong' | 'moderate' | 'weak' | 'insufficient';
  validators_present: Array<{
    type: string;
    weight: string;
    evidence: string;
  }>;
  validators_missing: string[];
  credibility_assessment: string;
  recommendations: string[];
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface CompetitivePositioning {
  t10_readiness: 'strong' | 'competitive' | 'developing' | 'significant_gaps';
  t20_readiness: 'strong' | 'competitive' | 'developing' | 'significant_gaps';
  t50_readiness: 'strong' | 'competitive' | 'developing' | 'significant_gaps';
  differentiators: string[];
  vulnerabilities: string[];
  comparison_to_pool: string;
  major_alignment_score?: number;
  teaching_insight: string;
  citations: CitationRecord[];
}

export interface AcademicRecommendations {
  immediate_actions: string[];
  senior_year_priorities?: string[];
  testing_strategy: string[];
  application_positioning: string[];
  narrative_integration: string;
}

export interface CitationRecord {
  claim: string;
  source: string;
  quote?: string;
  module_reference: string; // e.g., "Section 6.5: School Context"
}

// ============================================================================
// ACADEMIC HISTORY ANALYZER SERVICE
// ============================================================================

export class AcademicHistoryAnalyzer {
  /**
   * Analyze academic history with Section 6 research integration
   *
   * Uses multi-stage analysis:
   * 1. Quick diagnostics (Haiku) - Identify key patterns and flags
   * 2. Deep analysis (Sonnet) - Comprehensive evaluation with teaching
   */
  async analyze(input: AcademicHistoryInput): Promise<AcademicHistoryAnalysis> {
    // Stage 1: Quick pattern detection
    const quickDiagnosis = await this.runQuickDiagnosis(input);

    // Stage 2: Deep analysis with research context
    const fullAnalysis = await this.runDeepAnalysis(input, quickDiagnosis);

    return fullAnalysis;
  }

  /**
   * Stage 1: Quick diagnosis using Haiku
   * Identifies key patterns, flags, and areas needing attention
   */
  private async runQuickDiagnosis(input: AcademicHistoryInput): Promise<QuickDiagnosis> {
    const systemPrompt = `You are a college admissions expert performing quick academic profile triage.

Identify the key patterns, potential red flags, and notable strengths in this academic profile.
Focus on:
1. GPA context relative to school tier
2. Course rigor patterns
3. Grade trajectory (ascending/descending/stable)
4. Any red flags (see categories below)
5. Testing alignment with GPA

RED FLAG CATEGORIES:
${JSON.stringify(ACADEMIC_RED_FLAGS, null, 2)}

Return a JSON object with:
{
  "school_tier_assessment": "tier1_elite_prep" | "tier2_competitive_magnet" | "tier3_well_resourced" | "tier4_average_public" | "tier5_under_resourced" | "tier6_rural_homeschool",
  "gpa_context": "exceptional" | "strong" | "competitive" | "adequate" | "concerning",
  "rigor_pattern": "maximum" | "very_high" | "high" | "moderate" | "low",
  "trajectory_pattern": "ascending" | "consistently_excellent" | "stable" | "descending" | "inconsistent",
  "red_flags": [{ "type": string, "severity": string, "evidence": string }],
  "notable_strengths": string[],
  "areas_of_concern": string[],
  "special_contexts": ["dual_enrollment" | "international" | "homeschool"]
}`;

    const userPrompt = `Analyze this academic profile:

${JSON.stringify(input, null, 2)}`;

    try {
      const response = await callClaude(userPrompt, {
        model: 'claude-haiku-4-5-20251001',
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.2,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultQuickDiagnosis(input);
      }

      return JSON.parse(jsonMatch[0]) as QuickDiagnosis;
    } catch (error) {
      console.error('[AcademicHistoryAnalyzer] Quick diagnosis failed:', error);
      return this.getDefaultQuickDiagnosis(input);
    }
  }

  /**
   * Stage 2: Deep analysis using Sonnet with full research context
   */
  private async runDeepAnalysis(
    input: AcademicHistoryInput,
    diagnosis: QuickDiagnosis
  ): Promise<AcademicHistoryAnalysis> {
    // Build context-specific research sections
    const researchContext = this.buildResearchContext(input, diagnosis);

    const systemPrompt = `You are an elite college admissions counselor with 20+ years of experience at Harvard, Stanford, and MIT. You deeply understand how admissions officers evaluate academic profiles.

Your task is to provide a COMPREHENSIVE academic profile analysis using the research-backed frameworks below. Every claim you make must be grounded in this research.

CRITICAL: This is a TEACHING moment. Don't just assess - EXPLAIN why things matter and what students should understand about how colleges evaluate academics.

${researchContext}

HARVARD ACADEMIC RATING SCALE (1-6):
1 = Summa potential - Genuine academic distinction, national-level achievement
2 = Magna potential - Outstanding academics, likely top student at most colleges
3 = Cum laude potential - Strong academics, solid preparation for rigorous college work
4 = Adequate preparation - Can handle college work but no particular distinction
5 = Marginal preparation - Concerns about readiness for rigorous curriculum
6 = Below standards - Significant academic concerns

OUTPUT FORMAT:
Return a complete JSON object matching the AcademicHistoryAnalysis interface. Include:
1. Overall assessment with Harvard score
2. GPA analysis with school context calibration
3. Rigor analysis with AP difficulty breakdown
4. Trajectory analysis
5. Testing analysis with recommendations
6. Red flag assessment
7. Competitive positioning
8. Strategic recommendations
9. Citations for all major claims (include module references like "Section 6.5")

TEACHING INSIGHTS:
For each section, include a "teaching_insight" field that explains the WHY behind the assessment - what the student should understand about how colleges view this aspect.`;

    const userPrompt = `Provide a comprehensive academic analysis for this student:

ACADEMIC PROFILE:
${JSON.stringify(input, null, 2)}

QUICK DIAGNOSIS FINDINGS:
${JSON.stringify(diagnosis, null, 2)}

Analyze thoroughly and provide teaching insights. Every assessment should include the research backing and explain why it matters for college admissions.`;

    try {
      const response = await callClaude(userPrompt, {
        model: 'claude-sonnet-4-5-20250514',
        systemPrompt,
        maxTokens: 8000,
        temperature: 0.3,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from response');
      }

      return JSON.parse(jsonMatch[0]) as AcademicHistoryAnalysis;
    } catch (error) {
      console.error('[AcademicHistoryAnalyzer] Deep analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build research context based on student profile
   * Only includes relevant sections to avoid overwhelming the prompt
   */
  private buildResearchContext(input: AcademicHistoryInput, diagnosis: QuickDiagnosis): string {
    const sections: string[] = [];

    // Always include core frameworks
    sections.push(`
## Section 6.1: Course Level Hierarchy
${JSON.stringify(COURSE_LEVEL_HIERARCHY, null, 2)}

## Section 6.5: School Context Calibration
${JSON.stringify(SCHOOL_CONTEXT_TIERS[diagnosis.school_tier_assessment] || SCHOOL_CONTEXT_TIERS.tier3_well_resourced, null, 2)}

## Section 6.6: GPA Expectations by Selectivity
${JSON.stringify(GPA_EXPECTATIONS, null, 2)}

## Section 6.6: Year Weighting & Trajectory Analysis (CRITICAL)
Year Weights for Academic Evaluation:
- Freshman Year: 15% weight (adjustment period, weighted least)
- Sophomore Year: 22% weight (building foundation)
- Junior Year: 35% weight (MOST IMPORTANT - "widely regarded as the most important year")
- Senior Year: 28% weight (follow-through, rescission risk)

Trajectory Types & Score Adjustments:
- strong_ascending: +0.10 (each year better - ideal pattern)
- moderate_ascending: +0.05 (general improvement)
- high_plateau: +0.00 (consistently high)
- v_shape_recovery: +0.05 (shows resilience)
- mid_plateau: -0.02 (consistently moderate)
- erratic: -0.08 (no clear pattern)
- inverted_v: -0.10 (peak then decline)
- junior_dip: -0.10 (dip in most important year)
- senior_decline: -0.15 (senioritis - 22% rescission rate)
- descending: -0.20 (getting worse over time)

GPA-Rigor Interaction Matrix (9 Patterns):
- IDEAL: GPA↑ + Rigor↑ (best possible pattern)
- good_growth: GPA stable + Rigor↑ (maintained grades while increasing challenge)
- good_mastery: GPA↑ + Rigor stable (improving in same difficulty)
- acceptable_courage: GPA↓ + Rigor↑ (intellectual courage - POSITIVE signal)
- neutral: GPA stable + Rigor stable (acceptable)
- SUSPECT_PROTECTION: GPA↑ + Rigor↓ (GPA protection strategy - RED FLAG)
- concern_stagnant: GPA stable + Rigor↓ (coasting)
- concern_struggle: GPA↓ + Rigor stable (struggling)
- CRITICAL_DECLINE: GPA↓ + Rigor↓ (disengagement - MAJOR RED FLAG)

Critical Transitions (prioritize these in evaluation):
1. Sophomore → Junior: MOST CRITICAL transition (35% weight on junior year)
2. Junior → Senior: Red flag if decline (rescission risk)

Research Citation: "Admissions officers would much rather see grades on an upward trajectory" - Section 6.6`);

    // Also include trajectory adjustments for Harvard score
    sections.push(`
## Section 6.6: Harvard Score Trajectory Adjustments
For Harvard 1-6 Academic Rating, apply these trajectory considerations:

Score 1 (Summa):
- Requires strong_ascending OR high_plateau trajectory
- Must have ideal OR good_growth GPA-Rigor interaction
- No senior_decline or rigor retreat patterns
- Beyond grades: requires intellectual depth indicators

Score 2 (Magna):
- Requires ascending trend or consistently high
- acceptable_courage pattern is still valid for score 2
- Minor trajectory imperfections acceptable if overall strong

Score 3 (Cum Laude):
- Can have mid_plateau or v_shape_recovery
- Minor concerns about trajectory addressable
- GPA protection strategy may cap at score 3

Score 4-6:
- senior_decline automatically limits to 4 or worse
- critical_decline pattern suggests 5 or worse
- rigor_retreat without explanation suggests 4

KEY PRINCIPLE: A student with ascending trajectory and increasing rigor deserves higher Harvard score than same-GPA student with declining rigor, even if final GPA is same.`);


    // Include AP difficulty tiers if student has AP courses
    const hasAPs = input.courses.some(c => c.level === 'ap');
    if (hasAPs) {
      sections.push(`
## Section 6.2: AP Course Difficulty Tiers
${JSON.stringify(AP_DIFFICULTY_TIERS, null, 2)}`);
    }

    // Include red flag framework if flags detected
    if (diagnosis.red_flags && diagnosis.red_flags.length > 0) {
      sections.push(`
## Section 6.9: Academic Red Flags
${JSON.stringify(ACADEMIC_RED_FLAGS, null, 2)}`);
    }

    // Include dual enrollment framework if applicable
    if (diagnosis.special_contexts?.includes('dual_enrollment')) {
      sections.push(`
## Section 6.3: Dual Enrollment Evaluation
Institution Quality Hierarchy:
- Research University (R1): Highest rigor, strong evidence
- Regional University: High rigor, solid evidence
- Community College: Variable rigor, moderate evidence
- Online-Only: Lowest rigor, minimal impact

Key Principle: "At Top Elites or Ivy, the presence of Dual-Enrollment coursework on your transcript only works as evidence of course rigor." — CollegeVine`);
    }

    // Include international framework if applicable
    if (diagnosis.special_contexts?.includes('international') || input.school_context.curriculum !== 'us') {
      sections.push(`
## Section 6.7: International Curriculum Conversions
${JSON.stringify(INTERNATIONAL_CURRICULA, null, 2)}`);
    }

    // Include homeschool framework if applicable
    if (diagnosis.special_contexts?.includes('homeschool') || input.school_context.type === 'homeschool') {
      sections.push(`
## Section 6.8: Homeschool Validation Framework
${JSON.stringify(HOMESCHOOL_VALIDATION, null, 2)}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Fallback quick diagnosis when LLM call fails
   */
  private getDefaultQuickDiagnosis(input: AcademicHistoryInput): QuickDiagnosis {
    // Determine school tier
    let schoolTier: QuickDiagnosis['school_tier_assessment'] = 'tier3_well_resourced';
    if (input.school_context.tier) {
      schoolTier = input.school_context.tier as QuickDiagnosis['school_tier_assessment'];
    } else if (input.school_context.type === 'magnet') {
      schoolTier = 'tier2_competitive_magnet';
    } else if (input.school_context.type === 'homeschool') {
      schoolTier = 'tier6_rural_homeschool';
    }

    // Calculate rigor pattern
    const apCount = input.courses.filter(c => c.level === 'ap' || c.level === 'ib_hl').length;
    let rigorPattern: QuickDiagnosis['rigor_pattern'] = 'moderate';
    if (apCount >= 10) rigorPattern = 'maximum';
    else if (apCount >= 7) rigorPattern = 'very_high';
    else if (apCount >= 4) rigorPattern = 'high';

    // Calculate trajectory
    let trajectoryPattern: QuickDiagnosis['trajectory_pattern'] = 'stable';
    if (input.grade_history) {
      const gpas = [
        input.grade_history.freshman?.gpa,
        input.grade_history.sophomore?.gpa,
        input.grade_history.junior?.gpa,
      ].filter((g): g is number => g !== undefined);

      if (gpas.length >= 2) {
        const trend = gpas[gpas.length - 1] - gpas[0];
        if (trend > 0.2) trajectoryPattern = 'ascending';
        else if (trend < -0.2) trajectoryPattern = 'descending';
        else trajectoryPattern = 'stable';
      }
    }

    // Determine special contexts
    const specialContexts: ('dual_enrollment' | 'international' | 'homeschool')[] = [];
    if (input.courses.some(c => c.level === 'dual_enrollment')) {
      specialContexts.push('dual_enrollment');
    }
    if (input.school_context.type === 'homeschool') {
      specialContexts.push('homeschool');
    }
    if (input.school_context.type === 'international' || input.school_context.curriculum !== 'us') {
      specialContexts.push('international');
    }

    return {
      school_tier_assessment: schoolTier,
      gpa_context: input.gpa.unweighted && input.gpa.unweighted >= 3.9 ? 'exceptional' : 'competitive',
      rigor_pattern: rigorPattern,
      trajectory_pattern: trajectoryPattern,
      red_flags: [],
      notable_strengths: [],
      areas_of_concern: [],
      special_contexts: specialContexts,
    };
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface QuickDiagnosis {
  school_tier_assessment: 'tier1_elite_prep' | 'tier2_competitive_magnet' | 'tier3_well_resourced' | 'tier4_average_public' | 'tier5_under_resourced' | 'tier6_rural_homeschool';
  gpa_context: 'exceptional' | 'strong' | 'competitive' | 'adequate' | 'concerning';
  rigor_pattern: 'maximum' | 'very_high' | 'high' | 'moderate' | 'low';
  trajectory_pattern: 'ascending' | 'consistently_excellent' | 'stable' | 'descending' | 'inconsistent';
  red_flags: Array<{ type: string; severity: string; evidence: string }>;
  notable_strengths: string[];
  areas_of_concern: string[];
  special_contexts?: ('dual_enrollment' | 'international' | 'homeschool')[];
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicHistoryAnalyzer = new AcademicHistoryAnalyzer();

/**
 * Convenience function for analyzing academic history
 */
export async function analyzeAcademicHistory(
  input: AcademicHistoryInput
): Promise<AcademicHistoryAnalysis> {
  return academicHistoryAnalyzer.analyze(input);
}
