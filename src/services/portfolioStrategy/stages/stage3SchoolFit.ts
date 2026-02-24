/**
 * Stage 3: School Fit Deep Analysis
 *
 * Workshop-level depth for comprehensive school matching:
 * - Institutional values alignment
 * - Culture fit assessment
 * - Academic program match
 * - Geographic and environmental considerations
 * - Financial aid optimization
 * - Strategic school list building
 *
 * Each school evaluation goes deep into what that specific institution
 * values and how this student aligns (or doesn't).
 *
 * Uses Sonnet for nuanced understanding of school-specific fit factors.
 */

import { callClaude } from '../../../lib/llm/claude';

// ============================================================================
// SCHOOL FIT FRAMEWORKS
// ============================================================================

/**
 * Top-tier school profiles with specific value frameworks
 * These define what each institution actually cares about beyond stats.
 */
export const ELITE_SCHOOL_PROFILES = {
  harvard: {
    name: 'Harvard University',
    tier: 't5',
    admitRate: 3.4,
    coreValues: [
      'Leadership and impact orientation',
      'Intellectual breadth across disciplines',
      'Service to community and society',
      'Character and integrity',
      'Future influence potential',
    ],
    academicCulture: {
      description: 'General education focused, interdisciplinary, theoretical',
      whatTheyWant: 'Intellectual curiosity across fields, not just depth in one',
      strengths: ['Humanities', 'Social Sciences', 'Pre-professional paths'],
      studentVibe: 'Future world leaders, ambitious, networking-oriented',
    },
    uniqueValues: [
      'Legacy consideration (controversial but real)',
      'Geographic diversity emphasis',
      'Recruited athletes in specific sports',
      'First-generation students given significant consideration',
    ],
    whatStandsOut: [
      'National/international leadership recognition',
      'Founded organizations with measurable impact',
      'Intellectual work that influenced others',
      'Genuine service that changed communities',
    ],
    redFlagsForThisSchool: [
      'Pure academic focus without leadership/impact',
      'Self-focused achievements without community contribution',
      'Generic "well-rounded" without distinctive excellence',
    ],
    supplementEssayFocus: 'Why Harvard specifically, intellectual community, future goals',
    interviewStyle: 'Alumni-based, conversational, character-focused',
  },

  stanford: {
    name: 'Stanford University',
    tier: 't5',
    admitRate: 3.7,
    coreValues: [
      'Intellectual vitality and curiosity',
      'Entrepreneurial mindset',
      'Impact and innovation orientation',
      'Collaborative spirit',
      'Optimism and can-do attitude',
    ],
    academicCulture: {
      description: 'Innovation-focused, interdisciplinary, practical application',
      whatTheyWant: 'Students who will build things that change the world',
      strengths: ['Engineering', 'CS', 'Entrepreneurship', 'Sciences'],
      studentVibe: 'Builders, creators, optimistic problem-solvers',
    },
    uniqueValues: [
      'Intellectual vitality is THE key factor',
      'Bay Area startup culture integration',
      'Strong emphasis on "what will you do here"',
      'Values genuine passion over perfect packaging',
    ],
    whatStandsOut: [
      'Built something (product, company, organization) from scratch',
      'Unusual intellectual pursuits pursued deeply',
      'Projects that combine disciplines in novel ways',
      'Demonstrated ability to make ideas real',
    ],
    redFlagsForThisSchool: [
      'All achievements are traditional/expected',
      'No evidence of building or creating',
      'Intellectual interests that seem performative',
      'East coast prep school conventional success',
    ],
    supplementEssayFocus: 'What matters to you and why, intellectual curiosity, what will you explore',
    interviewStyle: 'No interviews (except special programs)',
  },

  mit: {
    name: 'MIT',
    tier: 't5',
    admitRate: 3.9,
    coreValues: [
      'Technical excellence and innovation',
      'Hands-on making and building',
      'Collaborative problem-solving',
      'Meritocratic achievement',
      'Quirky authenticity',
    ],
    academicCulture: {
      description: 'Intense, collaborative, hands-on, problem-focused',
      whatTheyWant: 'Brilliant technical minds who also build things',
      strengths: ['Engineering', 'CS', 'Physics', 'Math', 'Sciences'],
      studentVibe: 'Nerdy, collaborative, hacker culture, building things at 2am',
    },
    uniqueValues: [
      'Technical projects and making are highly valued',
      'Research experience in STEM fields',
      'Competition success in technical areas (USAMO, USACO, etc.)',
      'Authenticity and quirkiness appreciated',
    ],
    whatStandsOut: [
      'Built technical projects that work',
      'Research with genuine contribution',
      'Top performance in technical competitions',
      'Unusual technical interests pursued obsessively',
    ],
    redFlagsForThisSchool: [
      'STEM interest without technical projects',
      'Polished applicant without hands-on evidence',
      'Leadership positions but no technical depth',
      'Business/humanities focus masquerading as STEM interest',
    ],
    supplementEssayFocus: 'What have you created, collaboration, fit with MIT culture',
    interviewStyle: 'Educational counselor (alumni), technical-ish conversation',
  },

  princeton: {
    name: 'Princeton University',
    tier: 't5',
    admitRate: 4.0,
    coreValues: [
      'Academic rigor and scholarship',
      'Service and civic engagement',
      'Honor and integrity',
      'Undergraduate focus',
      'Community and residential life',
    ],
    academicCulture: {
      description: 'Rigorous academics, undergraduate-focused, residential',
      whatTheyWant: 'Serious scholars who will engage in residential community',
      strengths: ['Humanities', 'Sciences', 'Engineering', 'Public Policy'],
      studentVibe: 'Scholarly, preppy, tradition-oriented, tight-knit',
    },
    uniqueValues: [
      'Strong emphasis on undergraduate experience',
      'Independent work (junior paper, senior thesis) for everyone',
      'Honor code taken very seriously',
      'Service year/gap year positive',
    ],
    whatStandsOut: [
      'Deep scholarly achievement in specific area',
      'Significant service commitment',
      'Evidence of integrity and character',
      'Will contribute to residential community',
    ],
    redFlagsForThisSchool: [
      'Research university focus (wants grad school vibe)',
      'Self-focused achievement without community',
      'City-oriented student',
      'Wants pre-professional training',
    ],
    supplementEssayFocus: 'Specific academic interests, community contribution, honor',
    interviewStyle: 'Alumni interview, character-focused',
  },

  yale: {
    name: 'Yale University',
    tier: 't5',
    admitRate: 4.5,
    coreValues: [
      'Liberal arts breadth',
      'Artistic and cultural excellence',
      'Community and residential college system',
      'Leadership in public service',
      'Intellectual curiosity across fields',
    ],
    academicCulture: {
      description: 'Liberal arts focused, residential, artistic',
      whatTheyWant: 'Renaissance students who engage across disciplines',
      strengths: ['Humanities', 'Arts', 'Social Sciences', 'Public Service'],
      studentVibe: 'Artsy, intellectual, community-oriented, quirky',
    },
    uniqueValues: [
      'Residential college system central to experience',
      'Strong arts and humanities tradition',
      'Drama and arts programs exceptional',
      'Community contribution highly valued',
    ],
    whatStandsOut: [
      'Artistic excellence (theater, music, visual arts)',
      'Intellectual interests across disciplines',
      'Community leadership and contribution',
      'Unique perspectives and backgrounds',
    ],
    redFlagsForThisSchool: [
      'Pure STEM focus without broader interests',
      'Individual achievement without community',
      'Research university mindset',
      'Purely career-focused motivation',
    ],
    supplementEssayFocus: 'Yale community, residential colleges, why Yale specifically',
    interviewStyle: 'Alumni interview, conversation about fit',
  },

  caltech: {
    name: 'Caltech',
    tier: 't10',
    admitRate: 2.7,
    coreValues: [
      'Scientific excellence and discovery',
      'Collaborative research culture',
      'Honor code and academic integrity',
      'Small community of exceptional scientists',
      'Hands-on research from day one',
    ],
    academicCulture: {
      description: 'Intense, research-focused, collaborative, small',
      whatTheyWant: 'Future scientists who will advance human knowledge',
      strengths: ['Physics', 'Math', 'Engineering', 'Chemistry', 'Biology'],
      studentVibe: 'Intense nerds, collaborative, research-obsessed',
    },
    uniqueValues: [
      'Research experience almost required',
      'Science olympiad success weighted heavily',
      'Tiny class size means community matters',
      'Honor code is real and enforced by students',
    ],
    whatStandsOut: [
      'Research publications or significant findings',
      'Science olympiad national-level achievement',
      'Deep expertise in specific scientific area',
      'Collaborative research experience',
    ],
    redFlagsForThisSchool: [
      'Wants liberal arts breadth',
      'Business or humanities interests',
      'Competitive rather than collaborative personality',
      'Large university experience desired',
    ],
    supplementEssayFocus: 'Research interests, scientific collaboration, fit with small community',
    interviewStyle: 'Required, can be with student or faculty, technical depth expected',
  },

  // Additional top schools...
  columbia: {
    name: 'Columbia University',
    tier: 't10',
    admitRate: 3.9,
    coreValues: [
      'Core curriculum intellectual tradition',
      'New York City as classroom',
      'Intellectual intensity',
      'Diverse perspectives',
      'Professional opportunity access',
    ],
    academicCulture: {
      description: 'Intense Core curriculum, urban, professional-oriented',
      whatTheyWant: 'Intellectual students who want NYC opportunities',
      strengths: ['Journalism', 'Business', 'Political Science', 'Sciences', 'Arts'],
      studentVibe: 'Urban, ambitious, intellectual, career-focused',
    },
    uniqueValues: [
      'NYC location is feature, not bug—must want it',
      'Core Curriculum engagement matters',
      'Professional opportunities and internships valued',
      'Diverse backgrounds and perspectives',
    ],
    whatStandsOut: [
      'Engagement with contemporary issues',
      'Urban/NYC-related interests or experience',
      'Intellectual depth shown through specific interests',
      'International or diverse perspective',
    ],
    redFlagsForThisSchool: [
      'Wants traditional campus experience',
      'Rural or suburban preference',
      'Disinterest in Core Curriculum',
      'Looking for tight-knit residential community',
    ],
    supplementEssayFocus: 'Why Columbia, why NYC, Core Curriculum, specific programs',
    interviewStyle: 'Alumni interview, fit-focused',
  },

  duke: {
    name: 'Duke University',
    tier: 't10',
    admitRate: 5.9,
    coreValues: [
      'Excellence across academics and athletics',
      'Community and school spirit',
      'Interdisciplinary collaboration',
      'Service and engagement',
      'Southern charm with global ambition',
    ],
    academicCulture: {
      description: 'Balanced academics and social, spirited, collaborative',
      whatTheyWant: 'Well-rounded students with passion and school spirit',
      strengths: ['Sciences', 'Public Policy', 'Engineering', 'Business'],
      studentVibe: 'Spirited, social, athletic, ambitious',
    },
    uniqueValues: [
      'School spirit and community central',
      'Balance between academics and social life',
      'Athletics (especially basketball) part of culture',
      'DukeEngage and service opportunities',
    ],
    whatStandsOut: [
      'Leadership in multiple areas',
      'Community engagement and service',
      'Athletic achievement or appreciation',
      'Collaborative achievements',
    ],
    redFlagsForThisSchool: [
      'Purely academic/introverted profile',
      'Anti-athletic sentiment',
      'Looking for urban environment',
      'Prefers intellectual to social culture',
    ],
    supplementEssayFocus: 'Why Duke, community contribution, Trinity/Pratt interests',
    interviewStyle: 'Alumni interview, personality and fit focused',
  },

  // More can be added as needed...
};

/**
 * School tier classifications for strategic list building
 */
export const SCHOOL_TIERS = {
  t5: {
    schools: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale'],
    characteristics: 'Sub-5% admit rates, need exceptional profile + luck',
    strategy: 'Apply if genuinely interested but never count on admission',
    typicalAdmit: 'National recognition, exceptional achievement, perfect fit',
  },
  t10: {
    schools: ['Caltech', 'Columbia', 'Duke', 'Penn', 'Northwestern', 'Johns Hopkins'],
    characteristics: '5-10% admit rates, still highly selective',
    strategy: 'Realistic reaches for strong applicants',
    typicalAdmit: 'Strong regional/national achievement, clear fit',
  },
  t20: {
    schools: ['Brown', 'Dartmouth', 'Cornell', 'Rice', 'Vanderbilt', 'Notre Dame', 'Georgetown', 'Emory', 'UCLA', 'Berkeley', 'CMU', 'WashU'],
    characteristics: '10-20% admit rates, competitive but achievable',
    strategy: 'Target schools for strong applicants, reaches for good',
    typicalAdmit: 'Strong academics, clear interests, demonstrated fit',
  },
  t50: {
    schools: ['USC', 'NYU', 'Tufts', 'Boston College', 'UVA', 'Michigan', 'UNC', 'Wake Forest'],
    characteristics: '20-30% admit rates, achievable targets',
    strategy: 'Matches for strong applicants, reaches for average',
    typicalAdmit: 'Solid academics, some distinction, fit with school',
  },
  target_safeties: {
    schools: 'School-specific based on student stats',
    characteristics: '>30% admit rates where student is above median',
    strategy: 'Should have 2-3 true safeties where admission is likely',
    typicalAdmit: 'Student exceeds typical profile',
  },
};

/**
 * Strategic list building framework
 */
export const LIST_BUILDING_FRAMEWORK = {
  idealDistribution: {
    reach: { count: '3-4', description: 'Schools where admission is <20% likely' },
    target: { count: '4-5', description: 'Schools where admission is 20-50% likely' },
    likely: { count: '2-3', description: 'Schools where admission is >50% likely' },
    safety: { count: '1-2', description: 'Schools where admission is near-certain and student would attend' },
  },

  criticalPrinciples: [
    'Every school on the list should be one the student would genuinely attend',
    'Safeties must be TRUE safeties—not "likely" schools where things could go wrong',
    'Geographic, financial, and cultural fit matter as much as prestige',
    'Parent preferences and financial reality must be factored in',
    'ED/EA strategy can significantly impact outcomes',
  ],

  commonMistakes: [
    'All reaches, no realistic targets',
    'Safeties that aren\'t actually safe',
    'Applying to schools they wouldn\'t attend',
    'Ignoring financial aid implications',
    'Not considering geographic/cultural fit',
    'Too many similar schools (all Ivies, all LACs)',
    'Ignoring ED advantage at ED schools',
  ],
};

// ============================================================================
// STAGE 3 SERVICE
// ============================================================================

export interface Stage3Input {
  // Student profile summary from previous stages
  studentProfile: {
    archetype: string;
    harvardScore: number;
    characterStrengths: string[];
    characterGaps: string[];
    activityHighlights: string[];
    academicStrengths: string[];
    spikeAreas: string[];
    narrativeSummary: string;
    twoSentencePitch: string;
  };

  // Student preferences
  preferences: {
    targetSchools: string[];
    intendedMajor?: string;
    geographicPreferences?: string[];
    urbanRuralPreference?: 'urban' | 'suburban' | 'rural' | 'no_preference';
    sizePreference?: 'small' | 'medium' | 'large' | 'no_preference';
    culturePreferences?: string[];
    financialConsiderations?: {
      needFinancialAid: boolean;
      meritScholarshipImportant: boolean;
      budgetConstraints?: string;
    };
    earlyDecisionInterest?: boolean;
  };

  // Context
  context: {
    gradeLevel: string;
    stateResidency?: string;
    citizenship: 'us_citizen' | 'permanent_resident' | 'international';
    legacyConnections?: string[];
    athleticRecruitment?: string;
  };
}

export interface SchoolFitAnalysis {
  school: string;
  tier: string;

  fitScore: {
    overall: number; // 0-100
    academic: number;
    cultural: number;
    valueAlignment: number;
    geographic: number;
    financial: number;
  };

  alignmentAnalysis: {
    strongAlignments: Array<{
      area: string;
      evidence: string;
      howToHighlight: string;
    }>;
    misalignments: Array<{
      area: string;
      concern: string;
      mitigation?: string;
    }>;
    uniqueAdvantages: string[];
  };

  admissionAssessment: {
    estimatedChance: 'reach' | 'target' | 'likely' | 'safety';
    percentageEstimate: string;
    strengthsForThisSchool: string[];
    vulnerabilitiesForThisSchool: string[];
    whatWouldMakeAdmitLikely: string;
  };

  applicationStrategy: {
    essayApproach: string;
    topicsToEmphasize: string[];
    topicsToAvoid: string[];
    supplementTips: string[];
    recommendationFocus: string;
    interviewPrepPoints?: string[];
  };

  verdict: {
    recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommended';
    reasoning: string;
    listCategory: 'reach' | 'target' | 'likely' | 'safety';
  };
}

export interface Stage3Output {
  schoolAnalyses: SchoolFitAnalysis[];

  strategicListRecommendation: {
    currentListAssessment: {
      balance: string;
      strengths: string[];
      weaknesses: string[];
      overallViability: 'excellent' | 'good' | 'needs_adjustment' | 'high_risk';
    };

    recommendedList: {
      reaches: Array<{ school: string; reason: string }>;
      targets: Array<{ school: string; reason: string }>;
      likelies: Array<{ school: string; reason: string }>;
      safeties: Array<{ school: string; reason: string }>;
    };

    schoolsToAdd: Array<{ school: string; reason: string; category: string }>;
    schoolsToReconsider: Array<{ school: string; reason: string; alternative?: string }>;
  };

  edEaStrategy: {
    recommendation: string;
    bestEdOption?: { school: string; reasoning: string; admitBoost: string };
    eaRecommendations: Array<{ school: string; reasoning: string }>;
    restrictiveEaConsiderations?: string;
    timeline: string;
  };

  financialStrategy?: {
    needBasedAidOutlook: string;
    meritScholarshipOpportunities: Array<{ school: string; scholarship: string; fit: string }>;
    financialSafeties: string[];
    strategyNotes: string;
  };

  crossSchoolInsights: {
    universalStrengths: string[];
    universalChallenges: string[];
    differentiationBySchool: string;
    narrativeConsistency: string;
  };

  metadata: {
    analysisDepth: 'comprehensive';
    schoolsCovered: number;
    confidenceNotes: string[];
    dataLimitations: string[];
  };
}

/**
 * Stage 3: Deep School Fit Analysis
 *
 * Uses Sonnet for nuanced understanding of school-specific fit
 * that goes beyond rankings and admit rates.
 */
export async function analyzeSchoolFit(
  input: Stage3Input
): Promise<Stage3Output> {
  const systemPrompt = `You are an elite college counselor who has placed hundreds of students at top universities. You have deep knowledge of what each school actually values (not just what they say), their institutional priorities, and how to position students effectively.

Your task is to provide comprehensive SCHOOL FIT ANALYSIS for each target school. Go far beyond surface-level matching:

1. UNDERSTAND INSTITUTIONAL VALUES: Each school has specific values and culture. Match the student to what that school actually cares about.

2. ASSESS REALISTIC CHANCES: Be honest about admission probability. Most applicants overestimate their chances at top schools.

3. STRATEGIC POSITIONING: How should this student present themselves to THIS specific school? What angles work best?

4. BUILD A BALANCED LIST: Ensure the list has true reaches, realistic targets, and actual safeties.

ELITE SCHOOL PROFILES:
${JSON.stringify(ELITE_SCHOOL_PROFILES, null, 2)}

SCHOOL TIERS:
${JSON.stringify(SCHOOL_TIERS, null, 2)}

LIST BUILDING FRAMEWORK:
${JSON.stringify(LIST_BUILDING_FRAMEWORK, null, 2)}

CALIBRATION GUIDELINES:
- T5 schools: Even perfect applicants have <20% chance. Be realistic.
- "Target" means 20-50% chance, not "I should get in"
- True safety = student is clearly above median AND would attend
- ED can add 5-15 percentage points at schools that value it
- Athletic hooks, legacy, and development cases have different calculus

OUTPUT FORMAT: Return a complete JSON object matching the Stage3Output interface. Every school analysis should be specific to that institution's values.`;

  const userPrompt = `Analyze school fit for this student:

STUDENT PROFILE:
- Archetype: ${input.studentProfile.archetype}
- Harvard Equivalent Score: ${input.studentProfile.harvardScore}/6
- Character Strengths: ${input.studentProfile.characterStrengths.join(', ')}
- Character Gaps: ${input.studentProfile.characterGaps.join(', ')}
- Activity Highlights: ${input.studentProfile.activityHighlights.join(', ')}
- Academic Strengths: ${input.studentProfile.academicStrengths.join(', ')}
- Spike Areas: ${input.studentProfile.spikeAreas.join(', ')}
- Two-Sentence Pitch: ${input.studentProfile.twoSentencePitch}

STUDENT PREFERENCES:
- Target Schools: ${input.preferences.targetSchools.join(', ')}
- Intended Major: ${input.preferences.intendedMajor || 'Undeclared'}
- Geographic Preferences: ${input.preferences.geographicPreferences?.join(', ') || 'Flexible'}
- Urban/Rural: ${input.preferences.urbanRuralPreference || 'No preference'}
- Size: ${input.preferences.sizePreference || 'No preference'}
- Culture Preferences: ${input.preferences.culturePreferences?.join(', ') || 'None specified'}
- Financial Aid Needed: ${input.preferences.financialConsiderations?.needFinancialAid || 'Unknown'}
- Merit Scholarships Important: ${input.preferences.financialConsiderations?.meritScholarshipImportant || 'Unknown'}
- ED Interest: ${input.preferences.earlyDecisionInterest || 'Unknown'}

CONTEXT:
- Grade Level: ${input.context.gradeLevel}
- State: ${input.context.stateResidency || 'Unknown'}
- Citizenship: ${input.context.citizenship}
- Legacy: ${input.context.legacyConnections?.join(', ') || 'None'}
- Athletic Recruitment: ${input.context.athleticRecruitment || 'None'}

Provide comprehensive school fit analysis that:
1. Analyzes fit for EACH target school with specific institutional knowledge
2. Assesses realistic admission chances (be honest, not encouraging)
3. Provides specific application strategy for each school
4. Builds a balanced recommended list
5. Develops ED/EA strategy
6. Considers financial implications if relevant

Return your analysis as a JSON object matching the Stage3Output interface.`;

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt,
      userPrompt,
      maxTokens: 10000,
      temperature: 0.3,
      cacheSystemPrompt: true,
    });

    // Parse and validate response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const result: Stage3Output = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.schoolAnalyses || !result.strategicListRecommendation) {
      throw new Error('Missing required fields in school fit analysis output');
    }

    return result;
  } catch (error) {
    console.error('[Stage3] School fit analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage3SchoolFit = {
  ELITE_SCHOOL_PROFILES,
  SCHOOL_TIERS,
  LIST_BUILDING_FRAMEWORK,
  analyzeSchoolFit,
};
