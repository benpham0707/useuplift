/**
 * Stage 1B: Academic Profile Deep Analysis
 *
 * Workshop-level depth for comprehensive academic evaluation:
 * - Course rigor calibrated to school context
 * - Grade trajectory analysis (momentum matters more than static GPA)
 * - Testing strategy optimization
 * - Academic spike detection (intellectual depth in specific areas)
 * - Research/scholarly work assessment
 * - Academic narrative coherence
 *
 * Uses Sonnet for nuanced recognition of academic excellence patterns
 * that colleges actually value.
 */

import { callClaude } from '../../../lib/llm/claude';

// ============================================================================
// ACADEMIC RIGOR FRAMEWORKS
// ============================================================================

/**
 * Course rigor evaluation must be calibrated to school context.
 * A student taking "all available APs" at a school with 3 APs
 * shows MORE intellectual curiosity than one taking 8/20 at an elite prep.
 */
export const RIGOR_CALIBRATION_FRAMEWORK = {
  course_levels: {
    ap_ib: {
      name: 'AP/IB Courses',
      weight: 1.0,
      signals: [
        'Self-selection into challenging material',
        'College-level work experience',
        'External validation through standardized exams',
      ],
      context_matters: 'Number available vs number taken is key metric',
    },
    dual_enrollment: {
      name: 'Dual Enrollment/College Courses',
      weight: 0.95,
      signals: [
        'Initiative to seek challenge beyond school',
        'Comfort in college environment',
        'Often indicates academic maturity',
      ],
      context_matters: 'Quality of college matters (community vs research university)',
    },
    honors: {
      name: 'Honors Courses',
      weight: 0.7,
      signals: [
        'Above-average challenge seeking',
        'School-defined rigor',
      ],
      context_matters: 'Honors rigor varies dramatically by school',
    },
    accelerated: {
      name: 'Accelerated/Advanced',
      weight: 0.5,
      signals: [
        'Some challenge seeking',
        'Often grade-based placement',
      ],
      context_matters: 'May be automatic based on prior performance',
    },
    regular: {
      name: 'Regular/College Prep',
      weight: 0.3,
      signals: [
        'Standard curriculum',
        'Meeting graduation requirements',
      ],
      context_matters: 'Context of WHY matters (access vs choice)',
    },
  },

  school_context_tiers: {
    elite_prep: {
      name: 'Elite Preparatory School',
      description: 'Feeder schools to Ivies (Exeter, Andover, etc.)',
      rigor_expectation: 'Most rigorous curriculum expected',
      grading: 'Often deflated (B+ is strong)',
      resources: 'Extensive counseling, research opportunities',
      adjustment: 'Higher bar for "exceptional"',
    },
    competitive_public: {
      name: 'Competitive Public/Magnet',
      description: 'TJ, Stuyvesant, IMSA, etc.',
      rigor_expectation: 'Full STEM or specialized rigor expected',
      grading: 'Often deflated, especially in STEM',
      resources: 'Strong but variable by program',
      adjustment: 'Specialized excellence expected in focus area',
    },
    well_resourced_suburban: {
      name: 'Well-Resourced Suburban',
      description: 'Strong public schools with 15+ AP options',
      rigor_expectation: '10+ AP/IB courses available and expected',
      grading: 'Standard to slightly inflated',
      resources: 'Good counseling, some research access',
      adjustment: 'Standard expectations',
    },
    average_public: {
      name: 'Average Public School',
      description: 'Typical public school with 5-10 AP options',
      rigor_expectation: 'Taking most available APs is exceptional',
      grading: 'Often inflated',
      resources: 'Limited counseling, minimal research',
      adjustment: 'Context bonus for maximizing limited options',
    },
    under_resourced: {
      name: 'Under-Resourced School',
      description: 'Limited AP/honors, high poverty rates',
      rigor_expectation: 'Any AP/honors is notable',
      grading: 'Varies widely',
      resources: 'Minimal counseling, no research access',
      adjustment: 'Significant context bonus for excellence',
    },
    rural_remote: {
      name: 'Rural/Remote School',
      description: 'Geographic isolation limits opportunities',
      rigor_expectation: 'Online courses show exceptional initiative',
      grading: 'Often inflated but variable',
      resources: 'Very limited',
      adjustment: 'Strong context bonus for self-directed learning',
    },
    international: {
      name: 'International School',
      description: 'Non-US curriculum (IB, A-Levels, national systems)',
      rigor_expectation: 'System-specific evaluation needed',
      grading: 'Varies by country and system',
      resources: 'Highly variable',
      adjustment: 'Requires curriculum-specific calibration',
    },
    homeschool: {
      name: 'Homeschool',
      description: 'Parent-directed or self-directed education',
      rigor_expectation: 'External validation critical (DE, AP, competitions)',
      grading: 'Cannot be evaluated in isolation',
      resources: 'Family-dependent',
      adjustment: 'Heavy weight on external metrics and competitions',
    },
  },
};

/**
 * Grade trajectory matters more than static GPA.
 * Colleges want to see momentum and response to challenge.
 */
export const TRAJECTORY_PATTERNS = {
  ascending: {
    name: 'Ascending Trajectory',
    pattern: 'Grades improving over time, especially in rigor',
    signal: 'Growth mindset, maturing student, positive momentum',
    weight: 'Very positive - shows resilience and development',
    examples: [
      '3.2 freshman year → 3.9 junior year',
      'B in regular → A in AP after challenge increase',
      'Recovery after difficult personal circumstances',
    ],
  },
  consistently_excellent: {
    name: 'Consistently Excellent',
    pattern: 'High performance maintained across all years',
    signal: 'Strong foundation, reliable excellence',
    weight: 'Positive - baseline for competitive applicants',
    examples: [
      '4.0 UW maintained through increasing rigor',
      'All A/A- with most challenging curriculum',
    ],
  },
  descending: {
    name: 'Descending Trajectory',
    pattern: 'Grades declining over time',
    signal: 'Red flag requiring explanation',
    weight: 'Negative without context, but context matters',
    examples: [
      'Family health crisis impacted junior year',
      'Overcommitment to meaningful activities (tradeoff)',
      'Simply declining effort (concerning)',
    ],
  },
  inconsistent: {
    name: 'Inconsistent Performance',
    pattern: 'Grades vary significantly semester to semester',
    signal: 'May indicate external factors or engagement issues',
    weight: 'Neutral to concerning depending on explanation',
    examples: [
      'Excellent in passion areas, average elsewhere',
      'Seasonal variation (athlete, performer)',
      'Random variation (concerning)',
    ],
  },
  rigor_dip: {
    name: 'Rigor Increase Dip',
    pattern: 'Temporary GPA drop when taking harder courses',
    signal: 'Normal and often positive - willing to challenge self',
    weight: 'Neutral to positive - shows intellectual courage',
    examples: [
      '3.9 → 3.7 when moving from honors to AP',
      'B+ in AP Calculus BC after A in AB',
    ],
  },
  strategic_course_selection: {
    name: 'Strategic Course Avoidance',
    pattern: 'Avoiding challenging courses to protect GPA',
    signal: 'Red flag - prioritizing grades over learning',
    weight: 'Negative - shows risk aversion over growth',
    examples: [
      'Not taking AP in intended major area',
      'Dropping to regular when B+ earned in honors',
    ],
  },
};

/**
 * Testing strategy evaluation - what scores mean in context
 */
export const TESTING_FRAMEWORK = {
  sat_act_tiers: {
    exceptional: {
      sat: '1550+',
      act: '35+',
      signal: 'Top 1-2% nationally, unlikely to hurt at any school',
      strategy: 'Submit everywhere, may qualify for merit scholarships',
    },
    highly_competitive: {
      sat: '1500-1549',
      act: '34',
      signal: 'Top 5%, competitive at most selective schools',
      strategy: 'Submit to most schools, consider test-optional for HYPS',
    },
    competitive: {
      sat: '1400-1499',
      act: '31-33',
      signal: 'Top 10-15%, solid for T20, may be below median at T5',
      strategy: 'School-specific decision, strengthen other areas',
    },
    solid: {
      sat: '1300-1399',
      act: '28-30',
      signal: 'Above average, competitive for T50',
      strategy: 'Consider test-optional at highly selective schools',
    },
    average: {
      sat: '1200-1299',
      act: '25-27',
      signal: 'Average for college-bound, below selective school medians',
      strategy: 'Test-optional likely better for selective schools',
    },
  },

  ap_exam_signals: {
    five: 'Mastery demonstrated, validates course grade',
    four: 'Strong performance, good validation',
    three: 'Passing but not exceptional, some colleges give credit',
    one_two: 'Generally should not be reported if optional',
  },

  subject_test_strategy: {
    science_engineering: 'Math 2 + Science subject strongly recommended',
    humanities: 'Literature or History can strengthen application',
    international: 'English proficiency tests (TOEFL/IELTS) critical',
  },

  testing_red_flags: [
    'Large discrepancy between GPA and test scores (either direction)',
    'Superscoring with wildly different component scores',
    'Dramatic score increase without clear explanation',
    'Not taking any standardized tests when available',
  ],
};

/**
 * Academic spike indicators - deep intellectual engagement in specific area
 */
export const ACADEMIC_SPIKE_INDICATORS = {
  research_depth: {
    name: 'Research/Scholarly Work',
    tier1_indicators: [
      'Published in peer-reviewed journal (even student journals)',
      'Presented at academic conference',
      'Worked with university professor on ongoing research',
      'Original research methodology or findings',
    ],
    tier2_indicators: [
      'Research internship at university or lab',
      'Science fair at state+ level with original work',
      'Significant independent research project',
    ],
    tier3_indicators: [
      'Research class project with meaningful output',
      'Science fair at regional level',
      'Self-directed reading/study beyond curriculum',
    ],
    what_colleges_look_for: [
      'Intellectual curiosity beyond requirements',
      'Ability to engage with complex ideas',
      'Initiative to seek deeper understanding',
      'Connection to intended major/career',
    ],
  },

  competition_excellence: {
    name: 'Academic Competition Achievement',
    tier1_indicators: [
      'USAMO/USAPhO/USABO qualifier',
      'International olympiad team',
      'National merit finalist/scholar',
      'Intel/Regeneron/Siemens finalist',
    ],
    tier2_indicators: [
      'AIME qualifier',
      'State olympiad winner',
      'National competition top 10%',
    ],
    tier3_indicators: [
      'Regional competition winner',
      'School competition champion',
      'AMC distinguished honor roll',
    ],
    what_colleges_look_for: [
      'Exceptional ability in academic area',
      'Willingness to compete at high levels',
      'Deep knowledge beyond curriculum',
    ],
  },

  intellectual_projects: {
    name: 'Self-Directed Intellectual Projects',
    tier1_indicators: [
      'Created widely-used educational resource',
      'Developed product/tool with real users',
      'Published book or significant writing',
      'Patent or intellectual property',
    ],
    tier2_indicators: [
      'Significant coding project with users',
      'Blog or publication with following',
      'Created course curriculum used by others',
    ],
    tier3_indicators: [
      'Personal projects demonstrating deep interest',
      'Self-taught advanced topics',
      'Passion projects with meaningful output',
    ],
    what_colleges_look_for: [
      'Self-motivation and initiative',
      'Ability to complete complex projects',
      'Genuine passion vs resume building',
    ],
  },

  advanced_coursework: {
    name: 'Beyond-School Academic Work',
    tier1_indicators: [
      'College courses for credit with strong grades',
      'Graduate-level work',
      'Completed significant MOOCs with certificates',
    ],
    tier2_indicators: [
      'Community college courses in specialty',
      'Online AP courses beyond school offering',
      'Summer academic programs (selective)',
    ],
    tier3_indicators: [
      'Self-study of advanced topics',
      'Online learning in areas of interest',
      'Reading academic papers/textbooks independently',
    ],
    what_colleges_look_for: [
      'Initiative to go beyond what is offered',
      'Ability to succeed in college environment',
      'Genuine intellectual engagement',
    ],
  },
};

// ============================================================================
// STAGE 1B SERVICE
// ============================================================================

export interface Stage1BInput {
  academic: {
    gpa: {
      value: number;
      scale: number;
      type: 'unweighted' | 'weighted';
      weightedValue?: number;
    };
    classRank?: {
      rank: number;
      totalStudents: number;
      isDecile?: boolean;
    };
    courses: Array<{
      name: string;
      level: 'AP' | 'IB' | 'Honors' | 'Accelerated' | 'Regular' | 'Dual_Enrollment';
      grade: string;
      year?: 9 | 10 | 11 | 12;
      subject?: string;
    }>;
    testScores?: {
      sat?: {
        composite: number;
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
      apExams?: Array<{
        subject: string;
        score: 1 | 2 | 3 | 4 | 5;
        year?: number;
      }>;
      subjectTests?: Array<{
        subject: string;
        score: number;
      }>;
    };
    schoolContext: {
      type: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool';
      name?: string;
      competitiveness: 'elite_prep' | 'competitive_public' | 'well_resourced' | 'average' | 'under_resourced' | 'rural';
      apCoursesOffered?: number;
      ibSchool?: boolean;
      averageGPA?: number;
      collegeGoingRate?: number;
    };
    gradeHistory?: {
      freshman?: { gpa: number; rigorLevel: string };
      sophomore?: { gpa: number; rigorLevel: string };
      junior?: { gpa: number; rigorLevel: string };
      senior?: { gpa: number; rigorLevel: string };
    };
  };
  intendedMajor?: string;
  researchExperience?: Array<{
    title: string;
    description: string;
    institution?: string;
    mentor?: string;
    output?: string;
    duration: string;
  }>;
  academicCompetitions?: Array<{
    name: string;
    level: string;
    result: string;
    year: number;
  }>;
}

export interface Stage1BOutput {
  overallAcademicAssessment: {
    harvardScore: number; // 1-6 scale
    confidence: number;
    summary: string;
    standoutFactors: string[];
    concernFactors: string[];
  };

  rigorAnalysis: {
    rigorScore: number; // 1-10
    contextAdjustedScore: number; // Adjusted for school context
    courseworkSummary: string;
    rigorMaximization: {
      percentOfAvailableRigor: number;
      missingOpportunities: string[];
      strengths: string[];
    };
    subjectDepth: Array<{
      subject: string;
      depth: 'exceptional' | 'strong' | 'adequate' | 'limited';
      courses: string[];
      progression: string;
    }>;
  };

  trajectoryAnalysis: {
    pattern: keyof typeof TRAJECTORY_PATTERNS;
    description: string;
    gradeProgression: string;
    momentumDirection: 'ascending' | 'stable' | 'descending';
    contextualFactors: string[];
    howCollegesWillView: string;
  };

  testingStrategy: {
    currentPosition: string;
    scoreAnalysis: {
      sat?: { assessment: string; percentile: number; recommendation: string };
      act?: { assessment: string; percentile: number; recommendation: string };
      apExams?: { summary: string; strengths: string[]; gaps: string[] };
    };
    testOptionalRecommendation: {
      recommendation: 'submit_everywhere' | 'submit_most' | 'school_specific' | 'consider_test_optional';
      rationale: string;
      schoolSpecificGuidance: Record<string, string>;
    };
    improvementOpportunities: string[];
  };

  academicSpikeAnalysis: {
    hasSpikeEvidence: boolean;
    spikeAreas: Array<{
      area: string;
      strength: 'tier1' | 'tier2' | 'tier3';
      evidence: string[];
      developmentOpportunities: string[];
    }>;
    researchAssessment?: {
      tier: 'tier1' | 'tier2' | 'tier3' | 'none';
      strengths: string[];
      authenticityIndicators: string[];
      developmentPath: string;
    };
    intellectualCuriosityScore: number; // 1-6
    beyondClassroomEngagement: string;
  };

  majorAlignment: {
    intendedMajor: string;
    alignmentScore: number; // 0-100
    supportingEvidence: string[];
    gaps: string[];
    competitivePositioning: string;
    recommendedActions: string[];
  };

  competitivePositioning: {
    t10Readiness: 'strong' | 'competitive' | 'developing' | 'significant_gaps';
    t20Readiness: 'strong' | 'competitive' | 'developing' | 'significant_gaps';
    differentiators: string[];
    vulnerabilities: string[];
    comparisonToPool: string;
  };

  strategicRecommendations: {
    immediateActions: string[];
    seniorYearPriorities: string[];
    applicationStrategy: string[];
    narrativeIntegration: string;
  };

  metadata: {
    analysisDepth: 'comprehensive';
    confidenceFactors: string[];
    dataGaps: string[];
    caveats: string[];
  };
}

/**
 * Stage 1B: Deep Academic Profile Analysis
 *
 * Uses Sonnet for nuanced understanding of academic excellence
 * calibrated to school context and intended trajectory.
 */
export async function analyzeAcademicProfile(
  input: Stage1BInput,
  stage0Context?: {
    archetype: string;
    contextFactors: string[];
    narrativeThreads: string[];
  }
): Promise<Stage1BOutput> {
  const systemPrompt = `You are an elite college admissions counselor with 20+ years of experience at top institutions (Harvard, Stanford, MIT). You deeply understand how admissions officers evaluate academic profiles—not just the numbers, but what they signal about a student's intellectual capacity, growth trajectory, and fit for rigorous academic environments.

Your task is to provide a comprehensive academic profile analysis that goes FAR beyond simple GPA/test score evaluation. You must:

1. CALIBRATE TO CONTEXT: A 3.8 at Phillips Exeter means something different than a 3.8 at an under-resourced rural school. Evaluate students within their context, then compare to the broader applicant pool.

2. READ THE TRAJECTORY: Static numbers miss the story. A student improving from 3.2→3.9 shows more about their potential than a student who's always been at 3.6. Look for momentum, response to challenge, and growth patterns.

3. DETECT INTELLECTUAL DEPTH: Beyond grades, look for evidence of genuine intellectual engagement—research, competitions, self-directed learning, passion for specific areas.

4. UNDERSTAND TESTING STRATEGICALLY: Test scores are one data point. Consider test-optional implications, superscore strategies, and what scores actually communicate.

5. ASSESS MAJOR ALIGNMENT: For competitive STEM programs, relevant coursework and achievements matter enormously. For humanities, depth of reading and writing matters more than AP count.

RIGOR CALIBRATION FRAMEWORK:
${JSON.stringify(RIGOR_CALIBRATION_FRAMEWORK, null, 2)}

TRAJECTORY PATTERNS:
${JSON.stringify(TRAJECTORY_PATTERNS, null, 2)}

TESTING FRAMEWORK:
${JSON.stringify(TESTING_FRAMEWORK, null, 2)}

ACADEMIC SPIKE INDICATORS:
${JSON.stringify(ACADEMIC_SPIKE_INDICATORS, null, 2)}

OUTPUT FORMAT: You must return a complete JSON object matching the Stage1BOutput interface. Be specific with evidence and nuanced in assessment. Avoid generic statements—every conclusion should be grounded in the student's specific data.`;

  const userPrompt = `Analyze this student's academic profile with workshop-level depth:

ACADEMIC DATA:
${JSON.stringify(input.academic, null, 2)}

INTENDED MAJOR: ${input.intendedMajor || 'Undeclared'}

RESEARCH EXPERIENCE:
${input.researchExperience ? JSON.stringify(input.researchExperience, null, 2) : 'None reported'}

ACADEMIC COMPETITIONS:
${input.academicCompetitions ? JSON.stringify(input.academicCompetitions, null, 2) : 'None reported'}

${stage0Context ? `
CONTEXT FROM PROFILE CLASSIFICATION:
- Identified Archetype: ${stage0Context.archetype}
- Context Factors: ${stage0Context.contextFactors.join(', ')}
- Narrative Threads: ${stage0Context.narrativeThreads.join(', ')}
` : ''}

Provide a comprehensive academic analysis that:
1. Evaluates GPA and coursework rigor IN CONTEXT of their school
2. Identifies trajectory patterns and what they signal
3. Assesses testing strategy with specific recommendations
4. Detects any academic spikes or intellectual depth evidence
5. Evaluates alignment with intended major
6. Provides competitive positioning relative to T10/T20 pools
7. Gives specific, actionable strategic recommendations

Return your analysis as a JSON object matching the Stage1BOutput interface.`;

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt,
      userPrompt,
      maxTokens: 6000,
      temperature: 0.3,
      cacheSystemPrompt: true,
    });

    // Parse and validate response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const result: Stage1BOutput = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.overallAcademicAssessment || !result.rigorAnalysis || !result.trajectoryAnalysis) {
      throw new Error('Missing required fields in academic analysis output');
    }

    return result;
  } catch (error) {
    console.error('[Stage1B] Academic analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage1BAcademicAnalysis = {
  RIGOR_CALIBRATION_FRAMEWORK,
  TRAJECTORY_PATTERNS,
  TESTING_FRAMEWORK,
  ACADEMIC_SPIKE_INDICATORS,
  analyzeAcademicProfile,
};
