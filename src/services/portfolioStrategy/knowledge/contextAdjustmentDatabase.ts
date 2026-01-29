/**
 * Context Adjustment Factors Database
 *
 * Quantified impact of socioeconomic, geographic, family, and school
 * contexts on college admissions. These factors allow accurate assessment
 * of achievement relative to opportunity.
 *
 * Based on:
 * - Research from William Fitzsimmons (Harvard Dean of Admissions)
 * - Studies on contextual admissions
 * - Landscape data interpretation
 * - Analysis of admission patterns by demographics
 */

// ============================================================================
// SOCIOECONOMIC CONTEXT FACTORS
// ============================================================================

export const SOCIOECONOMIC_CONTEXT_FACTORS = {
  household_income: {
    low_income: {
      definition: 'Pell Grant eligible (<$60K family income)',
      percentage_of_applicants: 0.15,
      context_bonus: 0.5,  // Add 0.5 to Harvard scale (lower is better)
      rationale: 'Achieving at high level despite significant resource constraints',
      signals: [
        'Pell Grant eligible',
        'Free/reduced lunch',
        'Works to support family',
        'Limited access to test prep, tutoring',
      ],
      schools_that_value: ['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT', 'Amherst', 'Williams'],
      admission_context: {
        elite_school_boost: 1.8,  // 80% higher acceptance rate than baseline
        typical_outcomes: 'Strong boost at need-blind schools committed to access',
        caveats: [
          'Must still demonstrate excellence in context',
          'Essays should show resilience without victimhood',
          'Schools look for students who will thrive, not struggle',
        ],
      },
    },
    middle_income: {
      definition: '$60K-$150K family income',
      percentage_of_applicants: 0.45,
      context_bonus: 0.2,
      rationale: 'Some constraints but more opportunity than low-income',
      admission_context: {
        elite_school_boost: 1.2,
        typical_outcomes: 'Slight consideration but less dramatic than low-income',
      },
    },
    high_income: {
      definition: '>$150K family income',
      percentage_of_applicants: 0.40,
      context_bonus: 0,
      context_penalty: -0.2,  // Higher expectations
      rationale: 'Full access to resources - higher expectations for achievement',
      admission_context: {
        elite_school_boost: 1.0,  // No boost
        typical_outcomes: 'Expected to maximize opportunities available',
        caveats: [
          'Elite prep school students held to higher standard',
          'Should show awareness of privilege',
          'Leadership and impact expected',
        ],
      },
    },
  },

  parental_education: {
    first_generation: {
      definition: 'Neither parent has 4-year degree',
      percentage_of_applicants: 0.12,
      context_bonus: 0.5,
      admission_boost: 1.6,
      rationale: 'Navigating college process without family experience',
      signals: [
        'No parent with bachelor\'s degree',
        'Self-navigated college process',
        'May have less understanding of "game"',
        'Often also low-income',
      ],
      schools_that_prioritize: ['Harvard', 'Yale', 'Stanford', 'MIT', 'Princeton', 'Amherst'],
      combined_with_low_income: {
        combined_bonus: 0.75,
        admission_boost: 2.2,
        notes: 'QuestBridge, Posse, and similar programs specifically target this demographic',
      },
    },
    parent_some_college: {
      definition: 'Parent attended but did not complete college',
      context_bonus: 0.2,
      admission_boost: 1.2,
    },
    parent_bachelors: {
      definition: 'Parent has bachelor\'s degree',
      context_bonus: 0,
      admission_boost: 1.0,
    },
    parent_advanced_degree: {
      definition: 'Parent has graduate/professional degree',
      context_bonus: 0,
      context_penalty: -0.1,  // Slightly higher expectations
      admission_boost: 0.95,
      notes: 'Higher expectations for understanding admissions process',
    },
  },

  employment_context: {
    student_works_for_family: {
      definition: 'Works 15+ hours/week to contribute to household',
      context_bonus: 0.4,
      admission_boost: 1.4,
      evidence_needed: [
        'Specific hours and responsibilities',
        'How it affected academics',
        'What was sacrificed',
      ],
    },
    student_has_job: {
      definition: 'Part-time employment during school year',
      context_bonus: 0.2,
      admission_boost: 1.2,
    },
    full_support: {
      definition: 'No work requirement, full parental support',
      context_bonus: 0,
      notes: 'Expected to use time for activities and academics',
    },
  },
};

// ============================================================================
// GEOGRAPHIC CONTEXT FACTORS
// ============================================================================

export const GEOGRAPHIC_CONTEXT_FACTORS = {
  state_representation: {
    underrepresented_states: {
      states: ['Montana', 'Wyoming', 'North Dakota', 'South Dakota', 'Alaska', 'West Virginia', 'Idaho', 'Arkansas', 'Mississippi', 'New Mexico'],
      admission_boost: 1.5,
      context_bonus: 0.3,
      rationale: 'Geographic diversity valued; fewer applicants from these states',
      notes: 'Elite schools actively seek geographic diversity',
    },
    moderately_represented: {
      states: ['Nevada', 'Utah', 'Oklahoma', 'Kansas', 'Nebraska', 'Iowa', 'Kentucky', 'Tennessee', 'Alabama', 'Louisiana'],
      admission_boost: 1.2,
      context_bonus: 0.15,
    },
    overrepresented_states: {
      states: ['California', 'New York', 'Massachusetts', 'New Jersey', 'Connecticut', 'Texas'],
      admission_boost: 0.9,
      context_penalty: -0.1,
      rationale: 'Extremely competitive pools from these states',
      notes: 'California especially competitive for Stanford, UC schools',
    },
  },

  school_type: {
    feeder_school: {
      definition: 'Elite prep school with 30%+ to top 50 colleges',
      examples: ['Phillips Exeter', 'Phillips Andover', 'Choate', 'Deerfield', 'St. Paul\'s', 'Groton', 'Lawrenceville'],
      context_penalty: -0.3,  // Higher expectations
      admission_handicap: 0.8,
      rationale: 'Maximum resources and guidance - must excel among privileged peers',
      expectations: [
        'Top grades in rigorous environment',
        'Leadership among high-achieving peers',
        'Original impact, not just following path',
      ],
    },
    competitive_public: {
      definition: 'Magnet/exam school or highly ranked public',
      examples: ['Thomas Jefferson', 'Stuyvesant', 'Boston Latin', 'Whitney High'],
      context_penalty: -0.2,
      admission_handicap: 0.85,
      rationale: 'Strong academic environment with high expectations',
    },
    typical_public: {
      definition: 'Average public school',
      context_bonus: 0,
      admission_boost: 1.0,
    },
    under_resourced: {
      definition: 'Low-performing school, limited opportunities',
      context_bonus: 0.4,
      admission_boost: 1.5,
      rationale: 'Excelling despite limited resources and opportunities',
      signals: [
        'School has <20% college-going rate',
        'Limited AP/honors offerings',
        'No college counseling',
        'First from school to apply to elite colleges',
      ],
    },
    rural_school: {
      definition: 'Small school in rural area with limited offerings',
      context_bonus: 0.3,
      admission_boost: 1.4,
      rationale: 'Limited access to competitions, activities, resources',
    },
  },

  urban_vs_rural: {
    major_metropolitan: {
      definition: 'Top 20 metro areas',
      context_bonus: 0,
      notes: 'Maximum access to opportunities',
    },
    suburban: {
      definition: 'Suburbs of metro areas',
      context_bonus: 0,
      notes: 'Good access to opportunities',
    },
    small_city: {
      definition: 'Cities 50K-500K population',
      context_bonus: 0.1,
      notes: 'Some limitations on opportunities',
    },
    rural: {
      definition: '<50K population, agricultural or remote',
      context_bonus: 0.25,
      admission_boost: 1.3,
      rationale: 'Limited access to activities, competitions, mentorship',
      valued_by: ['Most elite schools seeking geographic diversity'],
    },
  },
};

// ============================================================================
// FAMILY CONTEXT FACTORS
// ============================================================================

export const FAMILY_CONTEXT_FACTORS = {
  family_structure: {
    single_parent: {
      context_bonus: 0.15,
      admission_boost: 1.15,
      considerations: [
        'Should be mentioned if relevant to story',
        'Not automatic boost - depends on circumstances',
        'Can strengthen resilience narrative',
      ],
    },
    foster_care: {
      context_bonus: 0.5,
      admission_boost: 1.7,
      notes: 'Significant adversity - schools actively seek these students',
      programs: ['QuestBridge', 'FosterClub', 'I Have A Dream'],
    },
    orphaned: {
      context_bonus: 0.5,
      admission_boost: 1.7,
    },
    immigrant_family: {
      recent_immigrant: {
        definition: 'Family immigrated within 5 years',
        context_bonus: 0.3,
        admission_boost: 1.3,
        considerations: [
          'Language barriers overcome',
          'Cultural adjustment',
          'Often navigating system alone',
        ],
      },
      refugee_family: {
        context_bonus: 0.5,
        admission_boost: 1.6,
        notes: 'Significant adversity and resilience',
      },
    },
  },

  family_responsibilities: {
    caregiver: {
      definition: 'Significant caretaking for family member',
      context_bonus: 0.35,
      admission_boost: 1.4,
      evidence_needed: [
        'Specific time commitment',
        'Impact on activities/academics',
        'What was sacrificed',
        'Recommendation letter mention',
      ],
    },
    sibling_caretaker: {
      definition: 'Regularly cares for younger siblings',
      context_bonus: 0.2,
      admission_boost: 1.2,
    },
    translator_for_family: {
      definition: 'Serves as translator/navigator for non-English speaking parents',
      context_bonus: 0.25,
      admission_boost: 1.25,
      notes: 'Often accompanies first-generation immigrant status',
    },
  },

  family_challenges: {
    parent_incarcerated: {
      context_bonus: 0.4,
      admission_boost: 1.5,
      handling: 'Should be mentioned if comfortable and relevant to growth',
    },
    family_health_crisis: {
      context_bonus: 0.3,
      admission_boost: 1.3,
      handling: 'Context in additional information section',
    },
    housing_instability: {
      context_bonus: 0.4,
      admission_boost: 1.5,
    },
    food_insecurity: {
      context_bonus: 0.4,
      admission_boost: 1.5,
    },
  },
};

// ============================================================================
// SCHOOL RESOURCE CONTEXT
// ============================================================================

export const SCHOOL_RESOURCE_CONTEXT = {
  course_offerings: {
    full_ap_ib: {
      definition: '15+ AP courses or full IB program',
      expectation: 'Should take 8-12 APs/IB courses',
      context_bonus: 0,
    },
    limited_ap: {
      definition: '5-14 AP courses available',
      expectation: 'Should take most available',
      context_bonus: 0.1,
    },
    minimal_ap: {
      definition: '<5 AP courses available',
      expectation: 'Take all available, self-study for more',
      context_bonus: 0.25,
      notes: 'Admissions understands limitation - look for self-study, dual enrollment',
    },
    no_ap: {
      definition: 'No AP or honors courses',
      context_bonus: 0.35,
      notes: 'Must show intellectual curiosity through other means',
      alternatives_valued: [
        'Community college dual enrollment',
        'Online courses (edX, Coursera with certificate)',
        'Self-directed study with evidence',
        'Strong performance in available courses',
      ],
    },
  },

  college_counseling: {
    full_counseling: {
      definition: 'Dedicated college counselor, 1:50 ratio',
      context_bonus: 0,
    },
    limited_counseling: {
      definition: 'Shared counselor, 1:200 ratio',
      context_bonus: 0.1,
    },
    minimal_counseling: {
      definition: 'No dedicated counselor, 1:500+ ratio',
      context_bonus: 0.25,
      notes: 'Student must self-navigate process',
    },
  },

  extracurricular_access: {
    full_access: {
      definition: 'Robust school activities + community access',
      context_bonus: 0,
    },
    limited_school: {
      definition: 'Few school activities, some community access',
      context_bonus: 0.15,
    },
    minimal_access: {
      definition: 'Few activities available, must create own',
      context_bonus: 0.3,
      notes: 'Creating opportunities is itself impressive',
    },
  },
};

// ============================================================================
// SPECIFIC DEMOGRAPHIC IMPACTS
// ============================================================================

export const FIRST_GEN_IMPACT = {
  definition: 'Neither parent completed 4-year college degree',
  prevalence: {
    general_population: 0.56,
    elite_college_applicants: 0.12,
    elite_college_enrolled: 0.14,
  },
  admission_impact: {
    harvard: { boost: 1.6, percentage_of_class: 0.15 },
    stanford: { boost: 1.5, percentage_of_class: 0.16 },
    mit: { boost: 1.4, percentage_of_class: 0.18 },
    yale: { boost: 1.6, percentage_of_class: 0.14 },
    princeton: { boost: 1.5, percentage_of_class: 0.15 },
  },
  combined_factors: {
    first_gen_low_income: {
      boost: 2.2,
      programs: ['QuestBridge', 'Posse', 'Gates Scholarship'],
      notes: 'Highest priority for access-focused schools',
    },
    first_gen_rural: {
      boost: 1.8,
      notes: 'Geographic diversity compounds first-gen boost',
    },
    first_gen_urm: {
      boost: 2.5,
      notes: 'Triple underrepresented - highest priority',
    },
  },
  essay_strategy: [
    'Discuss navigating college process without guidance',
    'Show maturity and self-direction',
    'Don\'t focus solely on hardship - show agency and growth',
    'Demonstrate readiness for college environment',
  ],
};

export const UNDERREPRESENTED_MINORITY_IMPACT = {
  groups: {
    african_american: {
      percentage_of_applicants: 0.10,
      percentage_at_elite: 0.12,
      admission_boost: 1.8,
      notes: 'Significant priority at most elite schools',
    },
    hispanic_latino: {
      percentage_of_applicants: 0.13,
      percentage_at_elite: 0.14,
      admission_boost: 1.6,
      notes: 'Priority varies by specific background',
    },
    native_american: {
      percentage_of_applicants: 0.01,
      percentage_at_elite: 0.01,
      admission_boost: 2.0,
      notes: 'Extremely underrepresented - high priority',
    },
    pacific_islander: {
      percentage_of_applicants: 0.005,
      admission_boost: 1.8,
    },
  },
  post_sffa_impact: {
    notes: 'After SFFA v. Harvard decision, race cannot be directly considered',
    current_approach: [
      'Focus on socioeconomic diversity',
      'Geographic diversity as proxy',
      'First-generation status',
      'School/community context',
      'Overcoming discrimination essays (if student chooses)',
    ],
    impact_estimate: 'Boost diminished but not eliminated through proxy factors',
  },
  essay_considerations: [
    'May discuss racial/ethnic identity if central to experience',
    'Focus on specific experiences, not group membership',
    'Avoid stereotypes or expected narratives',
    'Authenticity most important',
  ],
};

export const RECRUITED_ATHLETE_IMPACT = {
  tier_1_sports: {
    sports: ['Football', 'Basketball (M)', 'Basketball (W)', 'Ice Hockey'],
    impact_at_ivy: {
      admission_rate: 0.85,  // ~85% for recruited athletes
      ai_floor: 'Lower than general pool',
      notes: 'Coaches have significant influence',
    },
    impact_at_d1: {
      admission_rate: 0.90,
      notes: 'Athletic talent primary factor',
    },
  },
  tier_2_sports: {
    sports: ['Soccer', 'Lacrosse', 'Swimming', 'Track', 'Tennis', 'Baseball', 'Softball'],
    impact_at_ivy: {
      admission_rate: 0.70,
      ai_requirement: 'Must meet Academic Index minimum',
      notes: 'Less coach influence than Tier 1',
    },
  },
  tier_3_sports: {
    sports: ['Crew', 'Fencing', 'Squash', 'Golf', 'Volleyball', 'Field Hockey'],
    impact_at_ivy: {
      admission_rate: 0.60,
      notes: 'Modest boost, academics still important',
    },
    niche_sports_advantage: {
      sports: ['Fencing', 'Squash', 'Crew', 'Sailing'],
      notes: 'Less competition for spots, but must be genuinely elite',
    },
  },
  key_terminology: {
    likely_letter: 'Near-guarantee of admission (rare, top recruits only)',
    slot: 'Coach advocates for admission',
    support: 'Coach mentions positively but no commitment',
  },
  academic_requirements: {
    ivy_league: {
      academic_index: 'Must meet AI floor (varies by sport)',
      course_rigor: 'Must demonstrate academic preparation',
    },
    d1_non_ivy: {
      ncaa_eligibility: 'Must meet NCAA requirements',
      notes: 'Academic bar lower at many schools',
    },
  },
};

export const LEGACY_CONTEXT = {
  primary_legacy: {
    definition: 'Parent attended (undergrad)',
    impact_by_school: {
      harvard: { boost: 3.0, legacy_rate: 0.33 },
      princeton: { boost: 3.5, legacy_rate: 0.35 },
      yale: { boost: 3.0, legacy_rate: 0.30 },
      stanford: { boost: 2.5, legacy_rate: 0.25 },
      duke: { boost: 3.0, legacy_rate: 0.30 },
    },
    notes: [
      'Significant but controversial advantage',
      'Some schools reducing legacy consideration',
      'Still must be qualified applicant',
    ],
  },
  secondary_legacy: {
    definition: 'Sibling, grandparent, or other relative attended',
    boost: 1.5,
    notes: 'Modest consideration at most schools',
  },
  development_case: {
    definition: 'Family has donated or will donate significantly',
    thresholds: {
      building_naming: 10000000,  // $10M+
      major_gift: 1000000,        // $1M+
      significant: 100000,        // $100K+
    },
    impact: 'Nearly guaranteed if academically plausible',
    notes: 'Rarely discussed but real factor',
  },
  legacy_declining_schools: ['MIT', 'Johns Hopkins', 'Amherst'],
};

export const DISABILITY_ACCOMMODATION_CONTEXT = {
  learning_differences: {
    types: ['Dyslexia', 'ADHD', 'Processing disorders'],
    context_consideration: 0.15,
    notes: [
      'Should be mentioned if affected academics',
      'Show strategies developed to succeed',
      'Not automatic boost - depends on achievement despite challenge',
    ],
    disclosure_advice: [
      'Only disclose if it helps explain something in application',
      'Focus on strategies and growth, not limitations',
      'Additional information section appropriate place',
    ],
  },
  physical_disabilities: {
    context_consideration: 0.2,
    notes: [
      'May explain activity limitations',
      'Show adaptation and resilience',
      'Many successful students don\'t disclose',
    ],
  },
  chronic_illness: {
    context_consideration: 0.25,
    notes: [
      'Explain gaps or limitations if significant',
      'Show management and perseverance',
      'Counselor letter can provide context',
    ],
  },
};

// ============================================================================
// CONTEXT MULTIPLIER CALCULATION
// ============================================================================

export interface StudentContext {
  socioeconomic: {
    householdIncome: 'low' | 'middle' | 'high';
    firstGeneration: boolean;
    worksForFamily: boolean;
  };
  geographic: {
    state: string;
    urbanVsRural: 'major_metro' | 'suburban' | 'small_city' | 'rural';
    schoolType: 'feeder' | 'competitive_public' | 'typical_public' | 'under_resourced' | 'rural';
  };
  family: {
    singleParent: boolean;
    fosterCare: boolean;
    recentImmigrant: boolean;
    refugee: boolean;
    caregiverRole: boolean;
    significantChallenges: string[];
  };
  school: {
    apCoursesAvailable: number;
    collegeCounselorRatio: number;
    extracurricularAccess: 'full' | 'limited' | 'minimal';
  };
  demographics: {
    underrepresentedMinority: boolean;
    recruitedAthlete: boolean;
    athleteTier?: 1 | 2 | 3;
    legacy: 'primary' | 'secondary' | 'none';
  };
}

export interface ContextAdjustmentResult {
  totalContextBonus: number;        // Add to Harvard scale (lower is better)
  admissionMultiplier: number;      // Multiply base acceptance rate
  contextNarrative: string;
  strengthFactors: string[];
  challengeFactors: string[];
  essayAdvice: string[];
  strategicConsiderations: string[];
}

export function calculateContextMultiplier(context: StudentContext): ContextAdjustmentResult {
  let totalBonus = 0;
  let admissionMultiplier = 1.0;
  const strengthFactors: string[] = [];
  const challengeFactors: string[] = [];
  const essayAdvice: string[] = [];
  const strategicConsiderations: string[] = [];

  // Socioeconomic factors
  if (context.socioeconomic.householdIncome === 'low') {
    totalBonus += 0.5;
    admissionMultiplier *= 1.8;
    strengthFactors.push('Low-income background');
    essayAdvice.push('Discuss resource constraints authentically without victimhood');
  } else if (context.socioeconomic.householdIncome === 'high') {
    totalBonus -= 0.2;
    challengeFactors.push('High-income - higher expectations for achievement');
  }

  if (context.socioeconomic.firstGeneration) {
    totalBonus += 0.5;
    admissionMultiplier *= 1.6;
    strengthFactors.push('First-generation college student');
    essayAdvice.push('Discuss navigating process independently');

    // Combined first-gen + low-income
    if (context.socioeconomic.householdIncome === 'low') {
      totalBonus += 0.25;  // Additional bonus for combination
      admissionMultiplier *= 1.2;
      strategicConsiderations.push('Consider QuestBridge application');
    }
  }

  if (context.socioeconomic.worksForFamily) {
    totalBonus += 0.4;
    admissionMultiplier *= 1.4;
    strengthFactors.push('Works to support family');
    essayAdvice.push('Quantify time commitment and impact on academics');
  }

  // Geographic factors
  const underrepStates = GEOGRAPHIC_CONTEXT_FACTORS.state_representation.underrepresented_states.states;
  if (underrepStates.includes(context.geographic.state)) {
    totalBonus += 0.3;
    admissionMultiplier *= 1.5;
    strengthFactors.push(`From underrepresented state: ${context.geographic.state}`);
    strategicConsiderations.push('Geographic diversity is an asset');
  }

  if (context.geographic.schoolType === 'feeder') {
    totalBonus -= 0.3;
    admissionMultiplier *= 0.8;
    challengeFactors.push('Elite prep school - higher expectations');
    essayAdvice.push('Show original impact, not just following expected path');
  } else if (context.geographic.schoolType === 'under_resourced') {
    totalBonus += 0.4;
    admissionMultiplier *= 1.5;
    strengthFactors.push('Excelled at under-resourced school');
    essayAdvice.push('Discuss creating opportunities despite limitations');
  }

  if (context.geographic.urbanVsRural === 'rural') {
    totalBonus += 0.25;
    admissionMultiplier *= 1.3;
    strengthFactors.push('Rural background');
  }

  // Family factors
  if (context.family.fosterCare) {
    totalBonus += 0.5;
    admissionMultiplier *= 1.7;
    strengthFactors.push('Foster care background');
    strategicConsiderations.push('Apply to schools with strong support programs');
  }

  if (context.family.refugee) {
    totalBonus += 0.5;
    admissionMultiplier *= 1.6;
    strengthFactors.push('Refugee family');
    essayAdvice.push('Share unique perspective authentically');
  } else if (context.family.recentImmigrant) {
    totalBonus += 0.3;
    admissionMultiplier *= 1.3;
    strengthFactors.push('Recent immigrant family');
  }

  if (context.family.caregiverRole) {
    totalBonus += 0.35;
    admissionMultiplier *= 1.4;
    strengthFactors.push('Family caregiver responsibilities');
    essayAdvice.push('Discuss specific sacrifices and what was learned');
  }

  // School resource factors
  if (context.school.apCoursesAvailable < 5) {
    totalBonus += 0.25;
    strengthFactors.push('Limited AP access - pursued rigor despite constraints');
    essayAdvice.push('Mention self-study or dual enrollment efforts');
  }

  if (context.school.collegeCounselorRatio > 400) {
    totalBonus += 0.2;
    strengthFactors.push('Self-navigated college process');
  }

  // Demographic factors
  if (context.demographics.underrepresentedMinority) {
    // Post-SFFA, direct boost is reduced but proxies remain
    strategicConsiderations.push('May discuss racial/ethnic identity if relevant to experience');
  }

  if (context.demographics.recruitedAthlete) {
    const athleteBoost = context.demographics.athleteTier === 1 ? 0.85 :
                        context.demographics.athleteTier === 2 ? 0.70 : 0.60;
    admissionMultiplier = athleteBoost / 0.05;  // Convert to multiplier vs typical 5% rate
    strengthFactors.push(`Recruited athlete (Tier ${context.demographics.athleteTier})`);
    strategicConsiderations.push('Athletic recruitment separate from general admissions');
  }

  if (context.demographics.legacy === 'primary') {
    admissionMultiplier *= 3.0;
    strategicConsiderations.push('Legacy status provides significant advantage at parent\'s alma mater');
  } else if (context.demographics.legacy === 'secondary') {
    admissionMultiplier *= 1.5;
    strategicConsiderations.push('Secondary legacy provides modest consideration');
  }

  // Generate narrative
  const contextNarrative = strengthFactors.length > 0 ?
    `This student has overcome significant challenges including: ${strengthFactors.join('; ')}. ` +
    `Their achievements should be evaluated in light of their circumstances.` :
    `This student has had typical access to resources and opportunities.`;

  return {
    totalContextBonus: Math.round(totalBonus * 10) / 10,
    admissionMultiplier: Math.round(admissionMultiplier * 100) / 100,
    contextNarrative,
    strengthFactors,
    challengeFactors,
    essayAdvice,
    strategicConsiderations,
  };
}

export function getContextAdjustedScore(
  rawScore: number,
  context: StudentContext
): { adjustedScore: number; explanation: string } {
  const adjustment = calculateContextMultiplier(context);
  const adjustedScore = Math.max(1, Math.min(6, rawScore - adjustment.totalContextBonus));

  let explanation = `Raw score: ${rawScore}. `;
  if (adjustment.totalContextBonus > 0) {
    explanation += `Context bonus: ${adjustment.totalContextBonus} (${adjustment.strengthFactors.join(', ')}). `;
  } else if (adjustment.totalContextBonus < 0) {
    explanation += `Context penalty: ${Math.abs(adjustment.totalContextBonus)} (${adjustment.challengeFactors.join(', ')}). `;
  }
  explanation += `Adjusted score: ${adjustedScore.toFixed(1)}`;

  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    explanation,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contextAdjustmentDatabase = {
  SOCIOECONOMIC_CONTEXT_FACTORS,
  GEOGRAPHIC_CONTEXT_FACTORS,
  FAMILY_CONTEXT_FACTORS,
  SCHOOL_RESOURCE_CONTEXT,
  FIRST_GEN_IMPACT,
  UNDERREPRESENTED_MINORITY_IMPACT,
  RECRUITED_ATHLETE_IMPACT,
  LEGACY_CONTEXT,
  DISABILITY_ACCOMMODATION_CONTEXT,
  calculateContextMultiplier,
  getContextAdjustedScore,
};
