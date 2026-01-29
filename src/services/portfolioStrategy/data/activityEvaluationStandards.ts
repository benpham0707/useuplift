/**
 * Activity Evaluation Standards for Elite College Admissions
 *
 * ORGANIZATION: This file is structured by research section, with each section
 * building on the previous. DO NOT reorganize without understanding dependencies.
 *
 * SECTION DEPENDENCIES:
 * 1.1 (Quantity) → 1.2 (Time) → 1.3 (Depth/Breadth) → 1.4 (Spike) → 1.5 (Impact)
 *     ↓
 * 1.6 (Context) ← CRITICAL MODIFIER - Changes how ALL above sections are applied
 *     ↓
 * 1.7 (Categories) ← FINAL LAYER - NO activity type hierarchy, tier frameworks
 *
 * === SECTION 1 COMPLETE (1.1-1.7) ===
 *
 * Data sourced from Perplexity Deep Research (January 2026)
 * Based on: Admissions officer interviews, Harvard lawsuit documents,
 * Common Data Sets, institutional policies, and research studies.
 *
 * Key insights:
 * 1. Elite institutions have abandoned "well-rounded student" model
 *    in favor of "well-rounded class" composed of distinctly accomplished individuals.
 * 2. Achievement is evaluated RELATIVE to available opportunities (1.6)
 * 3. NO ACTIVITY TYPE HIERARCHY - passion and depth trump category (1.7)
 * 4. Work and family responsibilities are top-tier activities (1.6, 1.7)
 *
 * See: docs/research/synthesis/ACTIVITY_EVALUATION_FOUNDATION.md for full analysis
 */

// ============================================================================
// SECTION 1.1: QUALITY VS QUANTITY FRAMEWORK
// Source: PROMPT_A2_SECTIONS_1.1_1.2_1.3_RAW.md
// Dependencies: None (foundation layer)
// ============================================================================

/**
 * Core philosophy that underlies all activity evaluation
 */
export const ACTIVITY_EVALUATION_PHILOSOPHY = {
  coreShift: {
    from: 'Well-rounded student',
    to: 'Well-rounded class composed of distinctly accomplished individuals',
    mantra: 'Have a spike, not BE a spike - depth with baseline breadth',
  },
  fundamentalInsight: {
    fact: 'At elite institutions, approximately 80% of applicants meet academic thresholds',
    implication: 'Activities become THE differentiating factor in admissions decisions',
    source: 'Multiple admissions research studies',
  },
} as const;

/**
 * Optimal activity count based on research
 *
 * Key sources:
 * - Stanford Dean Richard Shaw interview
 * - MIT application structure (hard cap of 4)
 * - Forbes 2025 research on acceptance rates
 */
export const ACTIVITY_QUANTITY_STANDARDS = {
  /** Optimal range supported by research */
  optimal: {
    coreActivities: { min: 2, max: 4, description: '2-4 core commitments sustained 3-4 years' },
    totalActivities: { min: 3, max: 6, description: '3-6 total including supporting activities' },
    source: 'Forbes research: 4 activities yielded 30% acceptance rate, average admitted = 3.7',
  },

  /** MIT's intentional limit signals institutional values */
  mitLimit: {
    activities: 4,
    distinctions: 10, // 5 scholastic, 5 non-scholastic
    philosophy: 'Forces strategic curation, emphasizes depth over breadth',
    source: 'MIT application structure',
  },

  /** Stanford Dean Richard Shaw direct quote */
  stanfordGuidance: {
    quote:
      '"We don\'t want kids to get involved with 37 different activities. Often kids think the more activities they have the more it makes them competitive. What we really care about is kids indicating what is really special to them, what they\'re really passionate about. It\'s okay if they do two to three things that they really care about."',
    source: 'Richard Shaw, Stanford Dean of Admissions',
    implication: 'Explicitly prefers 2-3 passionate pursuits over extensive lists',
  },

  /** Too few activities threshold */
  tooFew: {
    threshold: 2,
    context: 'Fewer than 2 substantial activities risks appearing unengaged',
    exception: 'Students with family responsibilities, work obligations, or resource constraints',
    harvardRatings: {
      rating5: 'Little extracurricular involvement but special commitments such as family or work',
      rating6: 'Special circumstances limit or prevent participation',
    },
    source: 'Harvard rating system (SFFA lawsuit documents)',
  },

  /** Resume padding indicators */
  tooMany: {
    redFlags: [
      'Claiming 40+ hours/week across 10+ activities (time impossibility)',
      'Leadership titles in 5+ organizations simultaneously',
      'Multiple activities joined only in junior/senior year',
      'No progressive responsibility in any activity',
    ],
    ucSystemFinding:
      '"Many unsuccessful applicants had packed their résumés with clubs and activities but lacked any substantial initiative or contribution"',
    source: 'UC admissions reports, 2025 College MatchPoint analysis',
  },
} as const;

/**
 * Cross-validation mechanisms used by admissions officers
 * These detect authenticity and should inform our evaluation weighting
 */
export const CROSS_VALIDATION_MECHANISMS = {
  recommendationAlignment: {
    description: 'Teachers/counselors corroborate claimed involvement',
    redFlag: 'Self-reported leadership not mentioned by recommenders',
    weight: 'Major - discrepancies are serious red flags',
  },
  essayIntegration: {
    description: 'Genuine passions naturally permeate personal statements',
    redFlag: 'Activities listed but never discussed in essays',
    weight: 'Significant - absence suggests inauthentic engagement',
  },
  impactQuantification: {
    description: 'Measurable outcomes that resist exaggeration',
    redFlag: 'Vague claims with no specific outcomes',
    weight: 'Moderate - specificity indicates authenticity',
  },
  temporalConsistency: {
    description: 'Sustained 3-4 year involvement with increasing responsibility',
    redFlag: 'Senior year explosion of new activities',
    weight: 'Major - longevity is hard to fake',
  },
  source: 'Former Yale AO commentary, Spark Admissions, Ivy Coach',
} as const;

/**
 * Former Yale AO quote on gaming detection
 */
export const GAMING_DETECTION_QUOTE = {
  quote:
    '"When I encounter extra details about activities that fall outside the designated section, I typically find myself questioning: \'Why does this applicant believe the guidelines don\'t apply to them?\' or \'What makes this student worthy of admission if they can\'t adhere to instructions?\'"',
  implication: 'Strategic gaming backfires when detected',
  source: 'Former Yale admissions officer (Reddit AMA)',
} as const;

// ============================================================================
// SECTION 1.2: TIME COMMITMENT STANDARDS
// Source: PROMPT_A2_SECTIONS_1.1_1.2_1.3_RAW.md
// Dependencies: Section 1.1 (quantity context)
// ============================================================================

/**
 * Hours per week thresholds for activity commitment
 * Source: PrepScholar, Admissions Angle, Ivy Coach research
 */
export const TIME_COMMITMENT_THRESHOLDS = {
  /** Serious commitment benchmark */
  seriousCommitment: {
    hoursPerWeek: { min: 5, max: 10 },
    description: '5-10 hours/week per major activity signals serious commitment',
    source:
      'PrepScholar: "In general, between 5 and 10 hours per week for each main activity is a good benchmark"',
  },

  /** Casual participation threshold */
  casualParticipation: {
    hoursPerWeek: { max: 5 },
    description: 'Under 5 hours/week registers as exploratory or supplementary',
    source: 'Admissions Angle: "Five hours a week is better than thirty minutes a week"',
  },

  /** Maximum credible commitment */
  credibilityLimit: {
    singleActivity: 25, // hours/week max during school year
    totalAllActivities: 40, // hours/week max across everything
    warning: 'Claims exceeding these raise credibility concerns',
    source: 'Ivy Coach analysis of feasibility',
  },

  /** The critical formula */
  longevityVsIntensity: {
    principle: 'Multi-year sustained involvement outweighs short-term intensity',
    example: '4 years at 5 hours/week > 1 year at 20 hours/week',
    collegeBoardQuote:
      '"Evidence of extracurricular activities is important to the admission process, and depth of involvement is more impressive than breadth"',
    source: 'College Board counselor resources',
  },
} as const;

/**
 * Summer activity evaluation
 * Source: William Fitzsimmons (Harvard Dean of Admissions), Distinctive College Consulting
 */
export const SUMMER_ACTIVITY_EVALUATION = {
  /** Harvard Dean's perspective */
  fitzsimmonsQuote: {
    quote:
      '"Activities in which one can develop at one\'s own pace can be much more pleasant and helpful. An old-fashioned summer job that provides a contrast to the school year or allows students to meet others of differing backgrounds, ages, and life experiences is often invaluable in providing psychological downtime and a window on future possibilities."',
    keyInsight: 'Traditional employment holds equivalent or superior value to expensive enrichment programs',
    source: 'William Fitzsimmons, Harvard Dean of Admissions',
  },

  /** Pay-to-play programs - CRITICAL WARNING */
  payToPlayWarning: {
    status: 'Low value signal',
    admissionOfficerQuote: '"Turned off when experiences repeatedly appear to be bought—versus earned or self-directed"',
    distinctiveCollegeQuote:
      '"In admissions speak, pay-to-play programs are, in most cases, \'low value signals.\' They tell a very limited story—usually just that you chose to spend part of your summer learning something, and that you could [afford to]"',
    privilegeConcern: 'Admissions officers earning $40-50K may view expensive programs unfavorably',
    source: 'Former Ivy League AO (ProPublica), Distinctive College Consulting, Ivy Coach',
  },

  /** Summer activity hierarchy (ranked by value) */
  valueHierarchy: [
    { rank: 1, type: 'Traditional employment', note: 'Especially valued when providing contrast to school year' },
    { rank: 2, type: 'Self-directed projects with measurable outcomes', note: 'Demonstrates initiative without financial gatekeeping' },
    { rank: 3, type: 'Competitive/selective programs with earned entry', note: 'Must be merit-based, not purchased access' },
    { rank: 4, type: 'Year-round activity continuation', note: 'Deepening existing commitments' },
    { rank: 5, type: 'Pay-to-play programs', note: 'LOW VALUE - should not be weighted heavily' },
  ],

  /** Year-round vs summer-only */
  yearRoundPreference: {
    principle: 'Year-round commitment signals deeper engagement than summer-only',
    exception: 'Summer research programs with tangible outcomes (publications, presentations)',
    source: 'General admissions consensus',
  },
} as const;

/**
 * Activities started late (junior/senior year)
 * Source: CollegeVine, Fortuna Admissions
 */
export const LATE_START_EVALUATION = {
  /** When late activities can help */
  favorable: [
    'Connect to established interests, deepening existing trajectories',
    'Involve competitive selection, demonstrating merit-based achievement',
    'Produce tangible outcomes (research publications, competition wins)',
    'Fill resource gaps (student gains access to previously unavailable opportunities)',
  ],

  /** When late activities hurt */
  unfavorable: [
    'Joining 5-6 new clubs fall of senior year',
    'Obvious resume-building without connection to interests',
    'No measurable outcomes by application deadline',
    'Titles without demonstrated impact',
  ],

  /** Timeline for results */
  resultsTimeline: {
    deadline: 'January 1 for most outcomes to be visible',
    competitions: 'Focus on competitions with results before deadline',
    selfDirected: 'Self-driven projects can demonstrate initiative quickly',
    source: 'CollegeVine guidance',
  },
} as const;

// ============================================================================
// SECTION 1.3: DEPTH VS BREADTH SIGNALS
// Source: PROMPT_A2_SECTIONS_1.1_1.2_1.3_RAW.md
// Dependencies: Sections 1.1 (quantity) and 1.2 (time)
// ============================================================================

/**
 * Signals indicating DEPTH of involvement
 * These are the most compelling authenticity indicators
 */
export const DEPTH_SIGNALS = {
  /** Progressive leadership trajectory - hardest to fake */
  progressiveLeadership: {
    description: 'Advancement from general membership to positions of increasing responsibility',
    example: 'Member (9th) → Coordinator (10th) → Co-Captain (11th) → President (12th)',
    harvardRating2Examples: '"class president, newspaper editor" - roles requiring years to attain',
    cannotBeFaked: 'Resume padding cannot replicate organic 4-year growth trajectory',
    source: 'Harvard rating system (SFFA lawsuit), general admissions consensus',
  },

  /** Quantifiable impact metrics */
  quantifiableImpact: {
    description: 'Measurable outcomes demonstrating substantial contribution beyond participation',
    strongExamples: [
      { weak: 'Volunteered for charity', strong: 'Organized fundraiser that raised $15,000 for refugee relief' },
      { weak: 'Tutored students', strong: 'Tutored 25 students over 3 years, with 18 showing grade improvements' },
      { weak: 'Led a club', strong: 'Grew club membership from 12 to 47; established mentorship program for 15+ freshmen' },
      { weak: 'On debate team', strong: 'Ranked top 5 LD debaters in state; coached 6 novices to regional semifinals' },
    ],
    ucFramework: 'UC 14-factor system explicitly evaluates "special talents, achievements, and awards"',
    source: 'UC comprehensive review, Spark Admissions, CirkledIn',
  },

  /** Specialized expertise development */
  specializedExpertise: {
    description: 'Skills that single-year participants cannot achieve',
    indicators: [
      'Deep technical knowledge demonstrated through achievements',
      'Problem-solving skills through various organizational challenges',
      'Understanding of full cycle of organizational/competitive dynamics',
    ],
    mitPhilosophy: '"intellectual vitality and authentic engagement" + "sustained commitment"',
    source: 'MIT admissions philosophy, educational research',
  },
} as const;

/**
 * Signals indicating valuable BREADTH (vs scattered involvement)
 */
export const BREADTH_SIGNALS = {
  /** Thematic coherence - the key differentiator */
  thematicCoherence: {
    description: 'Activities collectively tell a story about values or interests',
    ingeniusPrepQuote:
      '"Students with multiple interests should seek to define a common theme between all their interests that will unite their application and tell a clear narrative of their journey"',
    coherentExamples: [
      {
        theme: 'STEM + Social Impact',
        activities: 'Robotics team captain + volunteer coding instructor + develops accessibility app for disabled users',
      },
      {
        theme: 'Social Justice',
        activities: 'Debate team + Model UN + founded petition platform for student voice + volunteers at immigrant legal aid',
      },
    ],
    effect: 'Creates MULTIPLICATIVE rather than additive impact',
    source: 'InGenius Prep, admissions consensus',
  },

  /** The 2-4-6 Approach from UC experts */
  structuredApproach: {
    name: '2-4-6 Approach',
    structure: {
      primary: { count: 2, description: 'Leadership/depth activities (3+ years, significant time)' },
      secondary: { count: 4, description: 'Consistent involvement (2+ years, moderate time)' },
      supporting: { count: 6, description: 'Meaningful pursuits that round out profile' },
    },
    benefit: 'Permits demonstrating multiple competencies without appearing scattered',
    source: 'UC admissions experts',
  },

  /** Four-domain framework */
  fourDomainFramework: {
    domains: {
      academicOriented: {
        purpose: 'Demonstrates intellectual passion in intended field',
        examples: 'Research, academic clubs, subject competitions',
      },
      leadership: {
        purpose: 'Shows initiative, people skills, innovation capacity',
        examples: 'Student government, team captain, organization founder',
      },
      communityService: {
        purpose: 'Indicates responsibility, empathy, commitment to others',
        examples: 'Sustained volunteering, tutoring, community organizing',
      },
      personality: {
        purpose: 'Humanizes the application',
        examples: 'Arts, sports, hobbies that reveal character',
      },
    },
    balance: '1-2 activities per domain provides coverage without scatter',
    source: 'Empowerly guidance on meaningful extracurriculars',
  },

  /** Yale's philosophy on balance */
  yalePhilosophy: {
    quote: '"We embrace the idea of \'and\' rather than \'or\'"',
    interpretation: 'Values depth in primary areas with selective breadth showing intellectual range',
    source: 'Yale admissions blog',
  },
} as const;

/**
 * Red flags indicating scattered/inauthentic involvement
 */
export const SCATTERED_INVOLVEMENT_RED_FLAGS = {
  patterns: [
    {
      name: 'Chronological Inconsistency',
      pattern: 'Participation limited to 1-2 semesters per activity across 8+ organizations',
      detection: 'Count activities with <1 year involvement',
    },
    {
      name: 'Absence of Leadership',
      pattern: 'Membership in many clubs without progression to responsibility',
      detection: 'Check for any leadership roles across all activities',
    },
    {
      name: 'Generic Descriptions',
      pattern: 'Unable to articulate specific contributions or learnings',
      detection: 'Analyze description specificity and quantification',
    },
    {
      name: 'Thematic Incoherence',
      pattern: 'Random assortment without connecting narrative',
      detection: 'Detect lack of thematic patterns across activities',
    },
  ],

  recentTrend: {
    finding: '"Universities are prioritizing applicants who show depth, initiative, and impact over those who simply check boxes"',
    consequence: 'Students with scattered involvement "are being left behind" in admissions outcomes',
    source: 'College MatchPoint 2024-25 Early Admissions Analysis',
  },
} as const;

// ============================================================================
// SECTION 1.4: THE SPIKE CONCEPT
// Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
// Dependencies: Sections 1.1, 1.2, 1.3
// Status: COMPLETE - Fully integrated January 2026
// ============================================================================

/**
 * The spike vs well-rounded debate: A FALSE DICHOTOMY
 *
 * Key insight: The debate is a false binary. Successful applicants demonstrate BOTH:
 * - Focused excellence in 1-2 domains
 * - Baseline competence across all areas
 *
 * Source: Synthesis of 88 citations from Perplexity Deep Research
 */
export const SPIKE_PHILOSOPHY = {
  /** Core principle that resolves the false dichotomy */
  coreFormulation: {
    principle: 'Have a spike, not BE a spike',
    meaning: 'Depth in primary area PLUS baseline breadth - not either/or',
    source: 'Stanford formulation, widely adopted',
  },

  /** Stanford's nuanced position - the key formulation */
  stanfordPosition: {
    quote:
      '"You should have a spike, not be a spike. Both depth and breadth matter. If you can do complex differential equations but you can\'t tie your shoes you\'re going to have a hard time at Stanford"',
    nuance: 'Stanford "doesn\'t particularly like angular applicants"',
    extremelyNarrow: '"Extremely narrow" applicants are "considered better suited for MIT"',
    philosophy: 'balanced',
    spikeWeight: 'high',
    breadthWeight: 'high',
    source: 'Stanford admissions officer (Reddit AMA)',
  },

  /** Yale's counter-narrative - liberal arts orientation */
  yalePosition: {
    quote:
      'Yale "wants well rounded students as much as the pointy ones" and applicants "don\'t need to show crazy r/chanceme levels of commitment and achievements to get in"',
    context: 'Reflects Yale\'s strong liberal arts orientation compared to technically-focused institutions',
    philosophy: 'well-rounded friendly',
    spikeWeight: 'moderate',
    breadthWeight: 'high',
    source: 'Yale admissions podcast',
  },

  /** Harvard's traditional spike advocacy */
  harvardPosition: {
    quote:
      '"That spike is what sets you apart from the other applicants. This spike goes AGAINST the spirit of simply being well-rounded"',
    additionalQuotes: [
      '"It\'s OK to be unbalanced if you develop a big spike"',
      '"Many very successful people are incredibly unbalanced"',
    ],
    philosophy: 'traditional spike advocacy',
    spikeWeight: 'very high',
    breadthWeight: 'moderate',
    source: 'Harvard alumnus admissions guide',
  },

  /** MIT positioning - technical spike valued */
  mitPosition: {
    observation: 'Stanford AO noted "extremely narrow" applicants are "considered better suited for MIT"',
    implication: 'MIT values focused technical excellence more than comprehensive liberal arts programs',
    philosophy: 'technical spike',
    spikeWeight: 'high',
    breadthWeight: 'lower',
    source: 'Inferred from Stanford AO comments',
  },

  /** Synthesis: The "well-lopsided" framework */
  synthesis: {
    term: 'Well-lopsided',
    definition: 'Fewer activities but more deeply involved in what they care about',
    principle: 'Have a spike, not BE a spike - depth with baseline breadth',
    recommendedProfile: {
      activities: 'Approximately 4 high-quality activities',
      commitment: '4-8 hours weekly commitment per activity',
      achievement: 'Exceptional achievement in ONE area (ideally state/national)',
      baseline: 'Maintain academic excellence AND broader interests',
    },
    source: 'Emerging consensus across admissions literature',
  },
} as const;

/**
 * Quantitative evidence on activity counts and admission rates
 * Source: Forbes 2025 research
 */
export const SPIKE_QUANTITATIVE_EVIDENCE = {
  /** Activity count vs acceptance rate */
  acceptanceByActivityCount: {
    fourActivities: { rate: '30%', note: 'HIGHEST acceptance rate' },
    oneActivity: { rate: 'Higher than 6', note: 'Focused depth beats scattered breadth' },
    sixActivities: { rate: '7%', note: 'LOWER than single activity!' },
    averageAdmitted: { count: 3.7, note: 'Optimal range confirmed' },
  },

  /** The rarity argument */
  rarityOfMultipleSpikes: {
    quote: '"Becoming truly elite is pretty difficult, and you do have to maintain your grades throughout this"',
    implication:
      'Time and dedication for national/international achievement makes genuine excellence in multiple areas implausible',
    feasibilityProblem:
      '"When admissions officers see applicants claiming 40 hours per week in ten different activities, it raises eyebrows"',
    source: 'Forbes research, admissions officer commentary',
  },

  /** Strategic synthesis over multiplication */
  strategicSynthesis: {
    principle: 'Rather than developing multiple spikes, show how primary spike connects to secondary interests',
    example: 'Biology spike student writes essay on history of science/medicine to demonstrate humanities skill',
    benefit: 'Creates narrative coherence without diluting depth',
    source: 'Admissions consultant synthesis',
  },
} as const;

/**
 * What makes a spike COMPELLING vs. NARROW
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md, 88 citations
 */
export const SPIKE_QUALITY_CRITERIA = {
  /** Compelling spike characteristics - what admissions officers want to see */
  compelling: {
    genuineCuriosity: {
      description: "Organic outgrowth of student's true self, not resume-building",
      quote: '"A spike is an organic outgrowth of a student\'s true self. It is the result of their unwavering dedication to what they love and believe in"',
      detection: 'Sustained trajectory, essay integration, consistent narrative',
      source: 'The Ivy Institute',
    },
    progressiveAchievement: {
      description: 'Not just participation, but increasing responsibility, recognition, and impact',
      indicators: ['Leadership progression over years', 'Award/recognition escalation', 'Growing scope of impact'],
      source: 'General admissions consensus',
    },
    broaderConnection: {
      description: 'Even focused achievements connect to larger questions or communities',
      example: 'Research connects to societal problems; art addresses human experience',
      source: 'MIT "authentic engagement" philosophy',
    },
    recognitionLevel: {
      description: 'National or international recognition in the spike area',
      harvardRating1: {
        definition: 'Winning prestigious competitions or research collaborations',
        admissionRates: '48-88% for students receiving one "1" rating',
      },
      examples: ['USAMO qualification', 'Regeneron ISEF', 'National competition wins', 'Published research'],
      source: 'Harvard lawsuit documents, The Ivy Institute',
    },
  },

  /** One-dimensional red flags - what makes a spike problematic */
  narrow: {
    lackOfBaselineCompetence: {
      description: 'Extreme narrowness raises concerns about college readiness',
      stanfordExample: '"If you can do complex differential equations but you can\'t tie your shoes you\'re going to have a hard time at Stanford"',
      implication: 'Students must demonstrate basic functioning outside specialty',
      source: 'Stanford AO',
    },
    inauthenticPursuit: {
      description: 'Officers detect when spikes were strategically manufactured',
      quote: 'AOs can detect when students have "pursued spikes solely to bolster applications"',
      consequence: '"May find it challenging to sustain long-term commitment"',
      detection: 'Recent additions without prior interest, lack of essay integration',
      source: 'Admissions research',
    },
    missingComplementarySkills: {
      description: 'Single-domain profile with concerning gaps',
      example: 'Student "extremely gifted in STEM subjects" who "hasn\'t demonstrated significant aptitude in reading and writing"',
      concern: 'Raises questions about college readiness for holistic education',
      source: 'Admissions officer commentary',
    },
    strategicCalculation: {
      description: 'Gaming the system rather than genuine development',
      quote: '"Do not do this to game the system" - authentic development trumps strategic positioning',
      detection: 'Perfect alignment with "what colleges want" without authentic interest signals',
      source: 'Multiple admissions experts',
    },
  },
} as const;

/**
 * Recent admissions cycle changes affecting spike evaluation (2024-25)
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
 */
export const RECENT_CYCLE_CHANGES = {
  /** Application volume trends */
  applicationVolume: {
    increase2024: '4-6% increase in total applications',
    commonApp2024: '836,679 first-year applicants',
    changeFrom2019: '41% increase from 2019-20',
    implication: 'Increased competition makes distinctive profiles more important',
    source: 'Common App data reports',
  },

  /** The "Great Deferral Wave" */
  deferralWave: {
    vanderbilt: '60% more deferrals than previous year',
    mit: 'Over 8,000 early applicants deferred',
    implication: 'Makes admissions less predictable, potentially increases premium on distinctive profiles',
    source: '2024-25 admissions cycle reports',
  },

  /** Shifting emphasis in evaluation */
  shiftingEmphasis: {
    authenticNarrative: {
      trend: 'Growing emphasis on authentic narrative over pure achievement metrics',
      quote: '"Personal and supplemental essays will play a significant role"',
    },
    postAffirmativeAction: {
      change: '"Contextual evaluation" intensified',
      implication: 'Achievements assessed "within the context of their specific school or geographic area"',
    },
    testOptional: {
      status: 'Many schools continuing test-optional policies',
      effect: 'Elevated importance of extracurricular evaluation',
    },
    source: 'College MatchPoint 2024-25 analysis',
  },
} as const;

// ============================================================================
// SECTION 1.5: IMPACT AND ACHIEVEMENT ASSESSMENT
// Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
// Dependencies: Sections 1.1, 1.2, 1.3, 1.4
// Status: COMPLETE - Fully integrated January 2026
// ============================================================================

/**
 * Sara Harberson's impact point system (former Penn/Franklin & Marshall AO)
 *
 * This is the foundational framework for tiering achievement levels.
 * Key insight: "The greater impact the claim has on your potential as an applicant,
 * the more likely it is that schools will do some fact-checking"
 *
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md, Sara Harberson direct guidance
 */
export const IMPACT_TIER_SYSTEM = {
  tier1_national: {
    points: 4,
    level: 'National',
    description: 'National level competition, national exposure, or national award',
    examples: [
      'USAMO qualification',
      'Regeneron ISEF awards',
      'National DECA 1st place',
      'Jack Kent Cooke Young Artist Award',
    ],
    admissionImpact: {
      status: 'Gold standard - highest distinction',
      caveat: '"Unhooked admissions are sub 10%" even with national achievements',
      implication: 'Necessary but not sufficient for guaranteed admission',
    },
    verificationLikelihood: 'High - impressive claims trigger verification',
    source: 'Sara Harberson (former Penn/F&M AO)',
  },
  tier2_state: {
    points: 3,
    level: 'State',
    description: 'State level achievement',
    examples: ['State orchestra placement', 'DECA/FBLA state leadership positions', 'State science fair awards'],
    admissionImpact: {
      status: '"Sweet spot for many applicants"',
      provenOutcomes: 'State DECA students gained admission to Columbia, Cornell, UC Berkeley, Johns Hopkins',
    },
    verificationLikelihood: 'Moderate - significant claims may be checked',
    source: 'Sara Harberson, admissions outcome data',
  },
  tier3_regional: {
    points: 2,
    level: 'Regional',
    description: 'Regional level (county, district)',
    examples: ['County science fair', 'District championships', 'Regional music competitions'],
    admissionImpact: {
      status: 'Solid achievement level',
      note: 'Demonstrates competitive success without rare national recognition',
    },
    verificationLikelihood: 'Low - typically not verified unless suspicious',
    source: 'Sara Harberson',
  },
  tier4_local: {
    points: 1,
    level: 'Local/School',
    description: 'Participation within high school/town only',
    examples: ['School club member', 'Local volunteer', 'Town sports league'],
    admissionImpact: {
      status: 'Generally baseline participation',
      exception: '"President of club" alone signals little unless exceptionally transformative',
      credibleLocal: '"Founded new club that grew to 50+ members and established lasting program"',
    },
    verificationLikelihood: 'Very Low - school-level easily verified by counselor',
    source: 'Sara Harberson',
  },
  contextualModifier: {
    principle: 'Outsized local impact can substitute for national recognition',
    keyQuote: '"AOs understand this and often value OUTSIZED LOCAL IMPACT similarly to national achievement"',
    definition: 'Creating lasting infrastructure, solving genuine community problems, measurable beneficiaries',
    credibleExample: '"Organized weekly tutoring program serving 75 students from underserved community, sustained for 3 years"',
    resourceContext: {
      quote:
        '"A student creating regional impact from an under-resourced rural school may be viewed more favorably than a student with similar impact from an elite private school with extensive resources"',
      implication: 'Achievement evaluated relative to available opportunities',
    },
    source: 'Reddit admissions officer insights, general consensus',
  },
} as const;

/**
 * How impact claims are assessed for credibility
 *
 * Key principle: "Colleges typically operate on an honor system when it comes
 * to extracurricular activities" - but with sophisticated detection mechanisms.
 *
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
 */
export const IMPACT_VERIFICATION = {
  /** Primary verification methods used by admissions offices */
  verificationMethods: {
    recommendationCrossReference: {
      description: 'Teachers/counselors confirm major activities - discrepancies = red flags',
      quote:
        '"One of the most effective tools for verification comes directly from your school counselor or teachers. These individuals often confirm major activities or leadership roles in their letters."',
      weight: 'Major - primary verification mechanism',
      source: 'Admissions research',
    },
    internalConsistencyChecks: {
      description: 'Officers trained to spot implausible combinations',
      quote:
        '"Admissions officers are highly trained at spotting inconsistencies. If a student claims to have founded a national nonprofit while maintaining top grades, competing in varsity sports, and holding multiple part-time jobs, colleges may question whether this level of involvement is realistic."',
      weight: 'High - always applied',
      source: 'College application guidance',
    },
    feasibilityAnalysis: {
      description: 'Time audits against realistic constraints',
      optimal: '4-8 hours/week per activity',
      maxCredible: '25 hours/week during school year',
      redFlag: '"If you claim 40 hours per week in ten different activities, it raises eyebrows"',
      weight: 'High - implausibility triggers scrutiny',
      source: 'Ivy Coach, general consensus',
    },
    directFollowUp: {
      description: 'Contact supervisors/coaches for verification',
      frequency: 'Rare but occurs - "In rare but notable cases, especially at Top 50 schools"',
      triggers: 'Major claims central to application narrative, suspicion',
      source: 'Admissions officer commentary',
    },
    socialMediaReconnaissance: {
      description: 'Checking digital presence',
      statistics: {
        activelyCheck2023: '28% of AOs (up from 10% in 2008)',
        fairGame: '67% think it\'s "fair game"',
      },
      triggers: 'Students provide links, red flags arise in application',
      source: 'College Transitions research',
    },
  },

  /** Critical finding from investigative journalism */
  verificationReality: {
    study: 'M-A Chronicle investigation',
    finding: '"Contacted over 50 M-A sports coaches and club advisors. Not a single coach or club advisor was asked to verify information on a student\'s college application"',
    implication: 'Verification is HIGHLY SELECTIVE - focuses on most impressive OR suspicious claims',
    practicalMeaning: 'Most routine claims are never verified, but exceptional ones may be',
    source: 'M-A Chronicle investigative journalism',
  },

  /** Post-Varsity Blues scandal heightened scrutiny */
  varsityBluesEffect: {
    scandal: '2019 college admissions scandal',
    consequence: '"Officers became even more cautious"',
    ucAuditFindings: {
      finding: '64 improperly admitted students found over six years',
      response: 'Stronger verification protocols implemented',
    },
    focusAreas: ['Athletic recruitment claims', 'Major donor connections', 'Unusual pathway admissions'],
    source: 'UC audit 2020, Spark Admissions',
  },
} as const;

/**
 * Credibility spectrum for impact claims
 *
 * Key insight: "Be truthful, thoughtful, and specific. A well-crafted application
 * built on real passions will always shine brighter than one built on inflated claims"
 *
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
 */
export const CLAIM_CREDIBILITY = {
  /** Highly credible indicators - what makes claims believable */
  highlyCredible: {
    indicators: [
      {
        name: 'Third-party validation',
        description: 'Official competition results, published research, media coverage',
        why: 'External verification removes reliance on self-report',
      },
      {
        name: 'Specific quantification with plausible scale',
        description: 'Concrete numbers that pass feasibility check',
        why: 'Specificity signals authenticity; vagueness signals inflation',
      },
      {
        name: 'Sustained trajectory',
        description: '200 hours over 3 years vs 200 hours senior year',
        why: 'Longevity harder to fake, demonstrates genuine commitment',
      },
      {
        name: 'Corroboration in recommendations',
        description: 'Teachers/counselors mention same activities',
        why: 'Cross-validation is primary verification mechanism',
      },
    ],
    examples: [
      '"Raised $3,000 for local animal shelter through bake sale and social media campaign"',
      '"Tutored 15 elementary students weekly in math for 2 years, 80% showed grade improvement"',
      '"Grew club membership from 12 to 47 over two years"',
      '"Organized conference attended by 120 students from 8 local high schools"',
    ],
    source: 'Spark Admissions, general consensus',
  },

  /** Moderate credibility - requires strong descriptive support */
  moderateCredibility: {
    requires: 'Strong description with specifics, outcomes, and challenges',
    categories: [
      {
        type: 'Self-initiated projects',
        needs: 'Clear reach, measurable outcomes, challenges overcome',
        example: 'App development with download counts, user feedback',
      },
      {
        type: 'School-level leadership',
        needs: 'More than title - what changed because of you?',
        example: '"President" needs specific initiatives, growth metrics, impact',
      },
      {
        type: 'Community service',
        needs: 'Beneficiaries specified, time commitment clear, role evolution shown',
        example: 'Weekly program with sustained engagement, not one-off events',
      },
    ],
    goodExample: '"Led executive board of 8, increased participation 40%, launched new initiative reaching 200 students"',
    source: 'Admissions guidance consensus',
  },

  /** Low credibility / Red flag indicators */
  lowCredibility: {
    redFlags: [
      {
        flag: 'Vague superlatives',
        example: '"Made huge impact on community"',
        problem: 'No specificity = no credibility',
      },
      {
        flag: 'Implausible scale',
        example: '"Founded national organization" without verifiable online presence',
        problem: 'Extraordinary claims require evidence',
      },
      {
        flag: 'Timing inconsistencies',
        example: 'Claimed 4 years but started junior year',
        problem: 'Internal contradictions destroy credibility',
      },
      {
        flag: 'Honor/title inflation',
        example: 'Self-proclaimed "CEO" without evidence of operation',
        problem: 'Titles without substance are transparent padding',
      },
      {
        flag: 'False precision',
        example: '"Served exactly 534 community members"',
        problem: 'Excessive precision suggests fabrication',
      },
      {
        flag: 'Hours inflation',
        example: '"30 hours/week" for single activity while maintaining academic excellence',
        problem: 'Exceeds credible time constraints',
      },
    ],
    source: 'Admissions officer commentary, common guidance',
  },

  /** Exaggeration statistics and risk analysis */
  exaggerationData: {
    prevalence: '"40-50% of college applications have at least been exaggerated"',
    riskReward: {
      quote: '"The risk-reward calculation is usually against you"',
      reasoning: '"The things they don\'t verify wouldn\'t make a huge impact on your application anyway"',
      implication: 'Exaggeration offers minimal upside with significant downside risk',
    },
    bestPractice:
      '"Be truthful, thoughtful, and specific. A well-crafted application built on real passions will always shine brighter than one built on inflated claims"',
    source: 'Admissions research, Spark Admissions',
  },
} as const;

/**
 * Counselor role in verification
 * Source: PROMPT_A2_SECTIONS_1.4_1.5_RAW.md
 */
export const COUNSELOR_VERIFICATION_ROLE = {
  /** Structural limitation */
  structuralConstraint: {
    typicalRatio: '1 counselor per 300+ students common at public schools',
    implication: 'Comprehensive verification is impossible',
    source: 'NACAC surveys',
  },

  /** What counselors CAN verify */
  canVerify: [
    'School-sanctioned activities',
    'Official positions and athletics',
    'Context about school resources and opportunities',
    'Major discrepancies from known patterns',
  ],
  canVerifyNote: '"Might burst out laughing" if student known for being unproductive claims extensive involvement',

  /** What counselors CANNOT verify */
  cannotVerify: ['External activities', 'Summer employment', 'Non-school competitions', 'Private projects'],

  /** The collaborative verification model */
  collaborativeModel: {
    description: 'Modern admissions relies on triangulation',
    sources: [
      'Self-reported information',
      'Counselor reports',
      'Teacher recommendations',
      'Transcripts',
      'Occasional direct contact',
    ],
    principle: 'No single source trusted alone; cross-references build credibility',
    source: 'Admissions research synthesis',
  },
} as const;

// ============================================================================
// SECTION 1.6: CONTEXT AND CIRCUMSTANCES
// Source: PROMPT_A2_SECTION_1.6_RAW.md
// Dependencies: Sections 1.1-1.5
// Status: COMPLETE - Fully integrated January 2026
//
// CRITICAL INSIGHT: This section fundamentally changes evaluation logic.
// Achievement is evaluated RELATIVE to available opportunities, not absolute.
// ============================================================================

/**
 * Core principle underlying all contextual evaluation
 *
 * Source: Jerome A. Lucido (enrollment management expert), College Board
 */
export const CONTEXTUAL_REVIEW_FOUNDATION = {
  /** The fundamental principle */
  corePrinciple: {
    quote:
      '"Given unequal educational opportunity, it is incumbent upon admissions [officers] to strive to understand the conditions under which each applicant has performed and to make judgments based on the context of those conditions."',
    implication: 'Achievements evaluated RELATIVE to opportunities, not in absolute terms',
    source: 'Jerome A. Lucido, College Board Holistic Review Guide',
  },

  /** How context modifies evaluation */
  evaluationLogic: {
    withoutContext: 'Does this student have 2-4 core activities?',
    withContext: 'Given this student\'s context, did they maximize available opportunities?',
    example: {
      naive: 'Student only has 2 activities - weak portfolio',
      contextual: 'Student has 2 activities + 25 hours/week family caregiving - strong character, depth equivalent to 4+ activities',
    },
  },

  /** Evaluation order requirement */
  evaluationOrder: [
    '1. FIRST: Assess contextual factors (work, family, resources, geography)',
    '2. THEN: Apply Sections 1.1-1.5 with appropriate adjustments',
    '3. NEVER: Penalize for absence of opportunities not available to student',
  ],
} as const;

/**
 * Paid work evaluation standards
 *
 * Key finding: Work is valued POSITIVELY, not as absence of activities.
 * "The more hours, the better" - Sarah Harberson
 *
 * Source: Sarah Harberson (former Wesleyan/Penn AO), Common Data Sets, institutional policies
 */
export const PAID_WORK_EVALUATION = {
  /** Institutional value - work is explicitly valued */
  institutionalValue: {
    sarahHarberson: {
      quote:
        '"Admissions officers are like me. They appreciate students who have the initiative and responsibility to work. **The more hours, the better, especially for the summer.**"',
      source: 'Sarah Harberson (former Wesleyan/Penn AO)',
    },
    commonApp: {
      recognition: '"Family Responsibilities" is a dedicated dropdown category in Activities section',
      guidance: '"For admission officers, understanding these responsibilities is essential to understanding who you are as a person"',
      source: 'Common Application documentation',
    },
    washingtonUniversity: {
      directive: '"Students who work for pay and/or have time-consuming family responsibilities should include this in their activity list"',
      implication: 'Explicit institutional directive to include work',
      source: 'Washington University in St. Louis admissions',
    },
    commonDataSets: {
      utAustin: 'Work experience rated as "Important"',
      ucla: 'Work experience marked as "Considered"',
      topSchoolsAverage: '88% of top 60 colleges rate extracurriculars as "important" or "very important"',
      implication: 'Work experience receives formal weight in institutional rubrics',
      source: 'Common Data Set analysis',
    },
  },

  /** Manual labor hierarchy - Harberson's surprising insight */
  manualLaborValue: {
    quote:
      '"Cleaning toilets, dishwashing, farm work, lawn care...physically harder than an office job, and they give students perspective on the regular working adult"',
    hierarchy: 'Manual labor > office work for character demonstration',
    reason: 'Physical difficulty and exposure to diverse adults valued',
    source: 'Sarah Harberson',
  },

  /** How to evaluate work in portfolios */
  evaluationGuidance: {
    principle: 'Work should be evaluated POSITIVELY, not as absence of traditional activities',
    hoursRule: 'More hours = more impressive (especially for summer)',
    comparison: 'Working student with 2 activities may equal privileged student with 4 activities',
    summervSchoolYear: 'Summer work especially valuable for providing "contrast to school year"',
  },
} as const;

/**
 * Family responsibilities evaluation - THE CORNERSTONE
 *
 * CRITICAL: This is the most powerful statement in all research.
 * Family responsibilities can outweigh academic metrics.
 *
 * Source: Sarah Harberson, 315 College Admission Deans, Harvard Rating System
 */
export const FAMILY_RESPONSIBILITIES_EVALUATION = {
  /** The cornerstone principle - most important finding */
  cornerstone: {
    quote:
      '"Family responsibilities are the **CORNERSTONE of college admissions** because they reveal loyalty, sacrifice, and the love of family a student embodies. **Nothing is more important than that, not even a perfect test score or being #1 in your class.**"',
    implication: 'Family responsibilities can OUTWEIGH academic metrics',
    weight: 'Exceptional - highest non-academic value signal',
    source: 'Sarah Harberson (former Wesleyan/Penn AO)',
  },

  /** Types of family responsibilities recognized */
  responsibilityTypes: {
    siblingCare: {
      example: '"Taking care of two much younger siblings in the morning, after school, and into the evening hours EVERY DAY because the parents worked two jobs"',
      value: 'High',
    },
    elderCare: {
      example: '"Caring for sick relatives"',
      value: 'High',
    },
    emotionalSupport: {
      example: '"Being woken by their sibling who struggled with panic attacks every night, holding their sibling, talking to them, and reassuring them until the sun rose"',
      value: 'High',
    },
    householdManagement: {
      example: '"Cooking, cleaning, and running errands"',
      value: 'Moderate to High (depending on hours)',
    },
    financialSupport: {
      example: '"Working to provide family income"',
      value: 'High',
    },
  },

  /** 315 Deans collective statement */
  deansStatement: {
    signatories: '315 college admission deans',
    date: 'June 2020',
    quote:
      '"We view substantial family contributions as **very important**, and we encourage students to report them in their applications. **It will only positively impact** the review of their application."',
    timeGuidance: '"It is helpful to know how much time students spent per week taking on a family responsibility"',
    source: 'Harvard Making Caring Common Initiative',
  },

  /** Harvard Rating System integration */
  harvardRatings: {
    rating5: {
      definition: '"Substantial activity outside of conventional EC participation such as **family commitments or term-time work**"',
      implication: 'DEDICATED rating tier for family/work - not lumped with "weak activities"',
      usage: '"Could be included with other e/c to boost the rating or left as a \'5\' if it is more representative"',
    },
    rating6: {
      definition: '"Special circumstances limit or prevent participation (e.g. a physical condition)"',
      implication: 'Recognizes severe limitations on participation',
    },
    source: 'Harvard SFFA lawsuit documents',
  },

  /** Time thresholds */
  timeThresholds: {
    substantial: '10+ hours/week typically considered substantial',
    documentation: 'Include specific hours/week like any other activity',
    comparison: 'Caregiving hours weighted similarly to or higher than activity hours',
  },
} as const;

/**
 * Under-resourced schools and communities calibration
 *
 * Key principle: Students compared to peers with SIMILAR resources,
 * not against all applicants.
 *
 * Source: Rice University, Princeton, Pomona, College Board
 */
export const SCHOOL_CONTEXT_CALIBRATION = {
  /** Rice University's school classification system (since 1992) */
  riceSystem: {
    quote:
      '"The greatest challenge in evaluating applicants is that students apply to Rice from high schools whose quality and resources vary significantly. To overcome this challenge and ensure that students are not disadvantaged in the selection process for having attended under-resourced schools, our admissions office implemented a system in 1992 to **classify applicants\' high schools according to the resources, curriculum, and college preparation programs offered. Students are compared with other students from similar high schools and not against students who attended more affluent schools.**"',
    principle: 'Peer comparison within similar resource bands, not across all applicants',
    yearEstablished: 1992,
    source: 'Rice University admissions',
  },

  /** College Board calibration example */
  collegeBoardExample: {
    quote:
      '"A student who took one AP course at his or her elite, urban high school with dozens of AP options might well be considered **differently** than a student who took the only AP class available at his or her rural or under-resourced school or produced an exceptional project on a complex issue in a school with no AP courses"',
    implication: 'Achievement relative to opportunity is what matters',
    source: 'College Board Holistic Review Guide',
  },

  /** Pomona College's differential expectations */
  pomonaApproach: {
    quote:
      '"We have different expectations for different students: the exam scores from a daughter of two college professors are viewed in a different context than the scores from a first-generation college student who attends an underfunded high school"',
    principle: 'Explicit differential expectations based on context',
    source: 'Pomona College admissions',
  },

  /** Princeton OCR compliance */
  princetonApproach: {
    quote:
      '"University admissions staff reviewed applicants in the context of their secondary school in order to compare their accomplishments given the resources available to those of applicants from similar settings"',
    source: 'Princeton Office for Civil Rights compliance documentation',
  },

  /** Implementation principle */
  implementationPrinciple: {
    key: '"Maxing out" available opportunities matters more than absolute achievement level',
    example: 'Student taking 1 AP at school with 1 AP > student taking 5 APs at school with 20 APs',
  },

  /** School resource indicators */
  resourceIndicators: [
    'AP/IB course offerings',
    'Counselor-to-student ratio',
    'Extracurricular program availability',
    'Geographic access to competitions/programs',
    'Socioeconomic profile of student body',
  ],
} as const;

/**
 * Geographic limitations - "Sparse Country"
 *
 * Rural students are severely underrepresented at elite institutions.
 * Context accommodates limited program access.
 *
 * Source: Harvard (Dean Fitzsimmons), Princeton data, STARS Network
 */
export const GEOGRAPHIC_CONTEXT = {
  /** "Sparse country" term from Harvard */
  sparseCountry: {
    origin: 'Harvard Dean William R. Fitzsimmons',
    definition: 'Rural areas where elite institutions intensify recruitment',
    quote:
      '"A student with competitive test scores and a high GPA will undoubtedly receive a second look" from rural areas because they "bring diverse political, academic, and professional interests to classrooms where such perspectives are rare"',
    source: 'SFFA v. Harvard lawsuit documents',
  },

  /** Severe underrepresentation data */
  underrepresentationData: {
    princetonClass2028: {
      ruralPercent: 9,
      usRuralPopulation: 19,
      gap: -10,
      note: 'At least 20 students from Manhattan alone',
    },
    caltechClass2027: {
      ruralPercent: 7,
      usRuralPopulation: 19,
      gap: -12,
    },
    vanderbiltClass2029: {
      ruralPercent: 10,
      usRuralPopulation: 19,
      gap: -9,
    },
    midwestUnderrepresentation: {
      princetonMidwest: 10,
      usPopulation: 20,
      gap: -10,
    },
    source: 'Princeton Daily, institutional reports',
  },

  /** STARS College Network */
  starsNetwork: {
    name: 'Small-Town and Rural Students College Network',
    purpose: 'Specialized support for students from rural and small towns',
    members: ['Northwestern', 'UChicago', 'Dartmouth', 'Many other elite institutions'],
    northwesternQuote:
      '"The perspectives and voices of students from rural and small towns are invaluable to our exchange of ideas... insights linked to growing up in geographically remote settings, or in communities where college-going isn\'t necessarily a given after high school"',
    source: 'Northwestern University (Paul Compton, Director of Access Partnerships)',
  },

  /** UChicago rural program */
  uchicagoProgram: {
    name: 'Emerging Rural Leaders Program',
    offerings: [
      'Fully funded summer programs for rural freshmen and juniors',
      'Guaranteed scholarships for select enrollees',
      'Paid summer internships',
    ],
    source: 'UChicago admissions',
  },

  /** Implementation guidance */
  evaluationGuidance: {
    principle: 'Geographic context modifies expectations',
    ruralAccommodation: 'Limited program access should be accommodated, not penalized',
    valueProposition: 'Rural students bring valued "diverse perspectives"',
  },
} as const;

/**
 * Documentation channels for circumstances
 *
 * Three primary ways to communicate context to admissions.
 *
 * Source: Common App, Smith College, Sarah Harberson
 */
export const CIRCUMSTANCE_DOCUMENTATION = {
  /** Channel 1: Activities Section */
  activitiesSection: {
    howToUse: 'Use "Family Responsibilities" dropdown category',
    includeWhat: 'Hours/week, years, description (just like any activity)',
    institutionalDirective: '"Students who work for pay and/or have time-consuming family responsibilities should include this in their activity list" - Washington University',
    source: 'Common App, Washington University',
  },

  /** Channel 2: Additional Information Section */
  additionalInformation: {
    wordLimit: 650,
    location: 'Common App Writing tab',
    guidance2025: {
      prompt: '"Challenges and Circumstances"',
      explicitlyAsks: [
        '"Circumstances that have made it difficult for you to get more involved in extracurricular activities, such as working to support your family"',
        '"Family or other obligations (care-taking, financial support, etc.)"',
      ],
    },
    bestPractice: {
      quote: '"A short, neutral, brief statement goes a long way"',
      source: 'Sarah Harberson',
    },
    whenToUse: 'When circumstances significantly impacted academic performance or activity availability',
  },

  /** Channel 3: Counselor Letter of Recommendation */
  counselorLetter: {
    value: 'Third-party validation of circumstances',
    guidance: '"Discussing your family obligations with your school counselor" recommended',
    benefit: 'Can contextualize what student\'s situation is without self-advocacy concerns',
    limitation: 'Depends on counselor knowledge and capacity',
    source: 'Reddit/AO discussions, admissions guidance',
  },

  /** Smith College specific guidance */
  smithCollegeExample: {
    quote:
      '"We encourage students to use the Activities area to list paid jobs and any caretaking of younger siblings or older relatives, or tasks relating to household management, etc. Then, if they\'d like to emphasize that significant household responsibilities have prevented their involvement in other activities... in the Additional Information section, they can"',
    source: 'Smith College admissions',
  },
} as const;

/**
 * The Equivalence Principle
 *
 * Working/caregiving students can be valued EQUIVALENTLY to those
 * with traditional extracurricular profiles.
 *
 * Source: College Board, Former Ivy AO (ProPublica)
 */
export const EQUIVALENCE_PRINCIPLE = {
  /** College Board's critical comparison */
  collegeBoardComparison: {
    quote:
      '"A U.S.-born student who did not work during high school and participated in international service ventures during summers, **funded by parents**, may be acknowledged for commitment to others... However, that student might be seen **differently** than a U.S.-born student who had to **work after school due to family responsibilities** and couldn\'t travel, but was able to demonstrate an **even greater dedication** to help others in need... **Differences may be weighed as equivalent in accomplishment (or not) depending on the context.**"',
    source: 'College Board Holistic Review Guide',
  },

  /** Three revealed evaluation principles */
  revealedPrinciples: {
    impactOverOptics: {
      principle: 'Depth and authenticity > prestige/visibility',
      example: 'Helping immigrant families in church > expensive international service trip',
    },
    resourceAwareness: {
      principle: 'Parent-funded activities NOT automatically valued higher',
      example: 'Paid work can equal or exceed value of pay-to-play programs',
    },
    maturityAndSacrifice: {
      principle: 'Work/caregiving + academics can OUTWEIGH traditional leadership',
      example: '25 hrs/week caregiving + good grades > club president with no constraints',
    },
  },

  /** Pay-to-play skepticism */
  payToPlaySkepticism: {
    formerIvyAO: {
      quote: '"Admissions officers are **turned off** when experiences repeatedly appear to be **bought—versus earned or self-directed**"',
      source: 'Former Ivy League AO (ProPublica investigation)',
    },
    workProtection: {
      quote: '"If your family depends on you for an extra source of income, you will **not be penalized** for spending your time at a job rather than preparing to win your next international competition"',
      implication: 'Working students explicitly protected from comparison to privileged peers',
      source: 'ProPublica',
    },
  },
} as const;

/**
 * Information asymmetry and systemic challenges
 *
 * Critical challenge: Under-resourced students may not KNOW
 * that work/family responsibilities are valued.
 *
 * Source: Lafayette College, NIH research, Ithaka S+R
 */
export const INFORMATION_ASYMMETRY = {
  /** The core problem */
  coreProblem: {
    quote:
      '"First-generation and low-income students often have challenges amassing a high number of activities, and are **unaware that valuable experiences like caregiving or working can be listed**"',
    source: 'Lafayette College President Nicole Hurd (founder, College Advising Corps)',
  },

  /** Lafayette College's response */
  lafayetteResponse: {
    action: 'Limited extracurricular review to first 6 activities (vs 10 available)',
    rationale: 'Address equity concerns for students who don\'t know to report work/family',
    source: 'Lafayette College admissions policy',
  },

  /** Other systemic challenges */
  systemicChallenges: {
    counselorCapacity: {
      problem: '500:1 counselor-to-student ratios common at under-resourced schools',
      impact: 'Limits individual documentation of circumstances',
    },
    verification: {
      problem: 'Family responsibilities lack standardized documentation (unlike transcripts)',
      reality: 'AOs generally trust self-reporting, follow up only if inconsistent',
    },
    ruralRecruitment: {
      problem: 'AOs visit densely populated suburbs more than rural areas',
      impact: 'Creates awareness gaps about elite institution possibilities',
    },
  },

  /** Our system's role */
  systemImplication: {
    mustDo: 'EXPLICITLY inform students that work/family responsibilities are valued',
    combats: 'Information asymmetry that disadvantages under-resourced students',
    guidance: 'Help students understand what is worth reporting and how',
  },
} as const;

// ============================================================================
// SECTION 1.7: ACTIVITY CATEGORIES AND PREFERENCES
// Status: PENDING RESEARCH
// Dependencies: Sections 1.1-1.6
// ============================================================================

// Placeholder for Section 1.7: Activity Categories and Preferences
// - Research vs athletics vs arts vs service
// - "Typical" activities (NHS, student government)
// - Unusual/interesting activity evaluation
// - Online/virtual activities
// - Passion projects

// ============================================================================
// EVALUATION FUNCTIONS
// These implement the standards defined above
// ============================================================================

export type ActivityCountAssessment = 'optimal' | 'acceptable' | 'too_few' | 'too_many' | 'red_flag';

/**
 * Evaluate activity count (Section 1.1)
 */
export function evaluateActivityCount(
  coreActivities: number,
  totalActivities: number,
  hasSpecialCircumstances: boolean = false
): { assessment: ActivityCountAssessment; feedback: string; source?: string } {
  if (hasSpecialCircumstances && coreActivities >= 1) {
    return {
      assessment: 'acceptable',
      feedback: 'Given your circumstances, your level of involvement demonstrates commitment',
      source: 'Harvard Ratings 5-6 accommodate family/work obligations',
    };
  }

  if (coreActivities >= 2 && coreActivities <= 4 && totalActivities <= 6) {
    return {
      assessment: 'optimal',
      feedback: 'Your activity count aligns with what elite admissions values - depth over breadth',
      source: 'Stanford Dean Shaw recommends "two to three things that they really care about"',
    };
  }

  if (coreActivities < 2) {
    return {
      assessment: 'too_few',
      feedback: 'Consider deepening involvement in 1-2 more activities to demonstrate engagement',
      source: 'Minimum of 2 meaningful commitments recommended without special circumstances',
    };
  }

  if (totalActivities > 8) {
    return {
      assessment: 'too_many',
      feedback: 'Consider focusing on fewer activities with deeper involvement - quality over quantity',
      source: 'UC finding: "packed résumés with clubs" without initiative = unsuccessful',
    };
  }

  if (totalActivities > 10) {
    return {
      assessment: 'red_flag',
      feedback: 'This many activities may appear as resume padding - admissions officers look for depth',
      source: 'Time impossibility raises credibility concerns',
    };
  }

  return {
    assessment: 'acceptable',
    feedback: 'Activity count is reasonable, focus on demonstrating depth and impact',
  };
}

export type TimeCommitmentAssessment = 'serious' | 'moderate' | 'casual' | 'incredible';

/**
 * Evaluate time commitment credibility (Section 1.2)
 */
export function evaluateTimeCommitment(
  hoursPerWeek: number,
  yearsInvolved: number
): { assessment: TimeCommitmentAssessment; credible: boolean; feedback: string; source?: string } {
  // Check credibility first
  if (hoursPerWeek > 25) {
    return {
      assessment: 'incredible',
      credible: false,
      feedback: 'This time commitment exceeds credible limits during the school year',
      source: 'Ivy Coach: claims exceeding 25 hrs/week single activity raise concerns',
    };
  }

  // Longevity bonus
  const longevityBonus = yearsInvolved >= 3;

  if (hoursPerWeek >= 5 && hoursPerWeek <= 10) {
    return {
      assessment: 'serious',
      credible: true,
      feedback: longevityBonus
        ? 'Excellent - serious commitment sustained over multiple years'
        : 'Strong commitment level - aim for multi-year involvement',
      source: 'PrepScholar: "5-10 hours per week for each main activity is a good benchmark"',
    };
  }

  if (hoursPerWeek > 10) {
    return {
      assessment: 'serious',
      credible: true,
      feedback: 'Very strong commitment - ensure you can sustain this while maintaining academics',
    };
  }

  if (hoursPerWeek >= 3) {
    return {
      assessment: 'moderate',
      credible: true,
      feedback: 'Moderate involvement - consider increasing hours or ensure longevity compensates',
      source: 'College Board: "depth of involvement is more impressive than breadth"',
    };
  }

  return {
    assessment: 'casual',
    credible: true,
    feedback: 'This registers as casual participation - consider if this should be a core activity',
    source: 'Admissions Angle: "Five hours a week is better than thirty minutes a week"',
  };
}

/**
 * Check for depth signals in an activity (Section 1.3)
 */
export function checkDepthSignals(activity: {
  yearsInvolved: number;
  hasLeadershipProgression: boolean;
  hasQuantifiedImpact: boolean;
  hoursPerWeek: number;
}): { depthScore: number; signals: string[]; feedback: string } {
  const signals: string[] = [];
  let depthScore = 0;

  // Progressive leadership (hardest to fake)
  if (activity.hasLeadershipProgression) {
    signals.push('Progressive leadership trajectory detected');
    depthScore += 30;
  }

  // Quantified impact
  if (activity.hasQuantifiedImpact) {
    signals.push('Quantifiable impact metrics present');
    depthScore += 25;
  }

  // Multi-year commitment
  if (activity.yearsInvolved >= 4) {
    signals.push('4+ year sustained commitment (exceptional)');
    depthScore += 25;
  } else if (activity.yearsInvolved >= 3) {
    signals.push('3+ year sustained commitment (strong)');
    depthScore += 20;
  } else if (activity.yearsInvolved >= 2) {
    signals.push('2+ year commitment');
    depthScore += 10;
  }

  // Serious time investment
  if (activity.hoursPerWeek >= 5 && activity.hoursPerWeek <= 10) {
    signals.push('Serious time commitment (5-10 hrs/week)');
    depthScore += 15;
  } else if (activity.hoursPerWeek > 10 && activity.hoursPerWeek <= 25) {
    signals.push('Very high time commitment');
    depthScore += 20;
  }

  // Generate feedback
  let feedback: string;
  if (depthScore >= 70) {
    feedback = 'Exceptional depth - this activity demonstrates the sustained commitment elite schools value';
  } else if (depthScore >= 50) {
    feedback = 'Strong depth signals - continue developing leadership and measurable impact';
  } else if (depthScore >= 30) {
    feedback = 'Emerging depth - focus on leadership progression and quantifying your contributions';
  } else {
    feedback = 'Limited depth signals - consider deeper involvement or developing leadership/impact';
  }

  return { depthScore, signals, feedback };
}

/**
 * Detect thematic coherence across activities (Section 1.3)
 */
export function detectThematicCoherence(
  activities: Array<{ name: string; thematicTags: string[] }>
): { hasCoherence: boolean; themes: string[]; feedback: string } {
  // Count tag frequencies
  const tagCounts = new Map<string, number>();
  for (const activity of activities) {
    for (const tag of activity.thematicTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // Find themes that appear in 2+ activities
  const coherentThemes = Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([tag]) => tag);

  const hasCoherence = coherentThemes.length > 0;

  let feedback: string;
  if (coherentThemes.length >= 2) {
    feedback = `Strong thematic coherence detected around ${coherentThemes.join(', ')}. Your activities tell a compelling, unified story.`;
  } else if (coherentThemes.length === 1) {
    feedback = `Theme of "${coherentThemes[0]}" connects multiple activities. Consider strengthening this narrative in your application.`;
  } else {
    feedback =
      'Activities appear scattered without clear thematic connection. Consider how your interests connect or focus on building coherence.';
  }

  return { hasCoherence, themes: coherentThemes, feedback };
}

// ============================================================================
// SECTION 1.4 EVALUATION FUNCTIONS
// Spike detection and institutional fit assessment
// ============================================================================

export type SpikeLevel = 'exceptional' | 'strong' | 'emerging' | 'none';
export type InstitutionalFit = 'stanford_balanced' | 'yale_liberal_arts' | 'harvard_spike' | 'mit_technical' | 'general';

/**
 * Detect spike presence and level (Section 1.4)
 *
 * Based on the research:
 * - Exceptional: National impact + 3+ years + progression
 * - Strong: State impact + 2+ years OR high commitment + progression
 * - Emerging: Some depth signals but not yet distinctive
 * - None: No clear area of distinction
 */
export function detectSpike(activity: {
  impactLevel: 'national' | 'state' | 'regional' | 'local';
  yearsInvolved: number;
  hasLeadershipProgression: boolean;
  hoursPerWeek: number;
  hasQuantifiedImpact: boolean;
}): { level: SpikeLevel; score: number; feedback: string; source: string } {
  let score = 0;

  // Impact level scoring (Sara Harberson's 4-3-2-1 system)
  const impactPoints = {
    national: 4,
    state: 3,
    regional: 2,
    local: 1,
  };
  score += impactPoints[activity.impactLevel] * 10; // Scale to 10-40 points

  // Years involved (longevity matters)
  if (activity.yearsInvolved >= 4) score += 25;
  else if (activity.yearsInvolved >= 3) score += 20;
  else if (activity.yearsInvolved >= 2) score += 10;

  // Leadership progression (hardest to fake)
  if (activity.hasLeadershipProgression) score += 20;

  // Time commitment
  if (activity.hoursPerWeek >= 5 && activity.hoursPerWeek <= 10) score += 10;
  else if (activity.hoursPerWeek > 10 && activity.hoursPerWeek <= 25) score += 15;

  // Quantified impact
  if (activity.hasQuantifiedImpact) score += 10;

  // Determine level
  let level: SpikeLevel;
  let feedback: string;

  if (score >= 80 && activity.impactLevel === 'national') {
    level = 'exceptional';
    feedback =
      'Exceptional spike detected - national-level achievement with sustained commitment. This is the profile Harvard Rating 1 describes (48-88% admission rates).';
  } else if (score >= 60 || (activity.impactLevel === 'state' && activity.yearsInvolved >= 2)) {
    level = 'strong';
    feedback =
      'Strong spike detected - this demonstrates the focused excellence elite schools value. State-level achievement with depth signals positions you competitively.';
  } else if (score >= 40) {
    level = 'emerging';
    feedback =
      'Emerging spike - you have depth signals but haven\'t yet reached distinctive achievement level. Focus on deepening impact and continuing progression.';
  } else {
    level = 'none';
    feedback =
      'No clear spike detected in this activity. Consider whether this is a supporting activity or one to develop further.';
  }

  return {
    level,
    score,
    feedback,
    source: 'Section 1.4 spike detection algorithm based on 88-citation research synthesis',
  };
}

/**
 * Assess institutional fit based on spike philosophy (Section 1.4)
 *
 * Different institutions have different spike preferences:
 * - Stanford: "Have a spike, not BE a spike" - balanced
 * - Yale: "Well-rounded as much as pointy" - breadth-friendly
 * - Harvard: Traditional spike advocacy
 * - MIT: Technical spike valued, narrowness acceptable
 */
export function assessInstitutionalFit(
  portfolio: {
    hasSpike: boolean;
    spikeLevel: SpikeLevel;
    domainCoverage: number; // 1-4 domains covered
    breadthScore: number; // 0-100
  },
  targetInstitution: InstitutionalFit
): { fit: 'strong' | 'moderate' | 'weak'; feedback: string; recommendation: string } {
  const { hasSpike, spikeLevel, domainCoverage, breadthScore } = portfolio;

  switch (targetInstitution) {
    case 'stanford_balanced':
      // "Have a spike, not BE a spike" - needs both
      if (hasSpike && spikeLevel !== 'none' && breadthScore >= 50 && domainCoverage >= 3) {
        return {
          fit: 'strong',
          feedback: 'Profile aligns with Stanford\'s "have a spike, not be a spike" philosophy',
          recommendation: 'Maintain balance while showcasing primary excellence',
        };
      } else if (!hasSpike || breadthScore < 40) {
        return {
          fit: 'weak',
          feedback: 'Stanford values both depth AND breadth - one is missing',
          recommendation: hasSpike ? 'Develop breadth to complement your spike' : 'Develop deeper excellence in one area',
        };
      }
      return {
        fit: 'moderate',
        feedback: 'Some alignment with Stanford profile, but could strengthen',
        recommendation: 'Continue developing both spike and breadth',
      };

    case 'yale_liberal_arts':
      // "Well-rounded as much as pointy" - breadth-friendly
      if (breadthScore >= 60 && domainCoverage >= 3) {
        return {
          fit: 'strong',
          feedback: 'Profile aligns with Yale\'s liberal arts, well-rounded philosophy',
          recommendation: 'Yale values intellectual range - highlight diverse interests',
        };
      } else if (breadthScore < 40) {
        return {
          fit: 'weak',
          feedback: 'Yale values well-rounded students - profile appears too narrow',
          recommendation: 'Develop broader engagement across domains',
        };
      }
      return {
        fit: 'moderate',
        feedback: 'Reasonable fit for Yale, consider showing more range',
        recommendation: 'Balance spike with demonstrable intellectual curiosity',
      };

    case 'harvard_spike':
      // Traditional spike advocacy
      if (hasSpike && (spikeLevel === 'exceptional' || spikeLevel === 'strong')) {
        return {
          fit: 'strong',
          feedback: 'Profile aligns with Harvard\'s spike-focused philosophy',
          recommendation: 'Harvard values distinctive excellence - emphasize your spike',
        };
      } else if (!hasSpike || spikeLevel === 'none') {
        return {
          fit: 'weak',
          feedback: 'Harvard traditionally values spikes - profile lacks distinctive excellence',
          recommendation: 'Develop exceptional depth in your area of greatest interest',
        };
      }
      return {
        fit: 'moderate',
        feedback: 'Emerging spike may not be sufficient for Harvard\'s expectations',
        recommendation: 'Continue deepening your primary area toward state/national recognition',
      };

    case 'mit_technical':
      // Technical spike valued, narrowness acceptable
      if (hasSpike && spikeLevel !== 'none') {
        return {
          fit: 'strong',
          feedback: 'Profile aligns with MIT\'s focused technical excellence philosophy',
          recommendation: 'MIT values depth - narrow focus is acceptable if excellent',
        };
      }
      return {
        fit: 'moderate',
        feedback: 'MIT values focused excellence - develop deeper technical spike',
        recommendation: 'Concentrate on technical mastery in your primary domain',
      };

    default:
      // General assessment
      if (hasSpike && breadthScore >= 40) {
        return {
          fit: 'strong',
          feedback: 'Profile shows balance of depth and breadth valued by most institutions',
          recommendation: 'Continue developing both dimensions',
        };
      }
      return {
        fit: 'moderate',
        feedback: 'Profile has room for development in depth or breadth',
        recommendation: 'Focus on your weakest dimension',
      };
  }
}

// ============================================================================
// SECTION 1.5 EVALUATION FUNCTIONS
// Impact tier assessment and credibility evaluation
// ============================================================================

export type ImpactTier = 'national' | 'state' | 'regional' | 'local';
export type CredibilityLevel = 'high' | 'moderate' | 'low' | 'red_flag';

/**
 * Calculate impact tier points (Section 1.5)
 *
 * Based on Sara Harberson's 4-3-2-1 system
 */
export function calculateImpactTierPoints(
  impactLevel: ImpactTier,
  contextModifier?: {
    isUnderResourced: boolean;
    hasOutsizedLocalImpact: boolean;
  }
): { points: number; adjustedPoints: number; feedback: string; source: string } {
  const basePoints = {
    national: 4,
    state: 3,
    regional: 2,
    local: 1,
  };

  const points = basePoints[impactLevel];
  let adjustedPoints = points;

  // Apply contextual modifier for under-resourced students with outsized local impact
  if (contextModifier?.isUnderResourced && contextModifier?.hasOutsizedLocalImpact && impactLevel === 'local') {
    adjustedPoints = 3; // Elevate to state-equivalent
  }

  const feedbackMap: Record<ImpactTier, string> = {
    national: 'Gold standard achievement - highest distinction level. Note: "unhooked admissions still sub 10%" even with national.',
    state: '"Sweet spot for many applicants" - competitive success at meaningful scale with proven admission outcomes.',
    regional: 'Solid achievement demonstrating competitive success without rare national recognition.',
    local: 'Baseline participation level - unless demonstrating "outsized local impact."',
  };

  let feedback = feedbackMap[impactLevel];
  if (adjustedPoints > points) {
    feedback += ' CONTEXTUAL BOOST: Outsized impact from under-resourced context elevates evaluation.';
  }

  return {
    points,
    adjustedPoints,
    feedback,
    source: 'Sara Harberson (former Penn/F&M AO) 4-3-2-1 tier system',
  };
}

/**
 * Assess claim credibility (Section 1.5)
 *
 * Evaluates whether impact claims pass credibility checks
 */
export function assessClaimCredibility(claim: {
  hasThirdPartyValidation: boolean;
  hasSpecificQuantification: boolean;
  trajectoryYears: number;
  likelyInRecommendations: boolean;
  hoursPerWeek: number;
  hasVagueSuperlatives: boolean;
  hasImplausibleScale: boolean;
  hasTimingInconsistencies: boolean;
}): { level: CredibilityLevel; score: number; flags: string[]; feedback: string } {
  let score = 50; // Start at neutral
  const flags: string[] = [];

  // Positive indicators
  if (claim.hasThirdPartyValidation) {
    score += 20;
    flags.push('✓ Third-party validation present');
  }
  if (claim.hasSpecificQuantification) {
    score += 15;
    flags.push('✓ Specific quantification provided');
  }
  if (claim.trajectoryYears >= 3) {
    score += 15;
    flags.push('✓ Sustained multi-year trajectory');
  }
  if (claim.likelyInRecommendations) {
    score += 15;
    flags.push('✓ Likely corroborated in recommendations');
  }

  // Negative indicators / Red flags
  if (claim.hoursPerWeek > 25) {
    score -= 25;
    flags.push('⚠ Hours exceed credible limits (>25/week)');
  }
  if (claim.hasVagueSuperlatives) {
    score -= 20;
    flags.push('⚠ Vague superlatives detected');
  }
  if (claim.hasImplausibleScale) {
    score -= 30;
    flags.push('🚩 Implausible scale claimed');
  }
  if (claim.hasTimingInconsistencies) {
    score -= 25;
    flags.push('🚩 Timing inconsistencies detected');
  }

  // Determine level
  let level: CredibilityLevel;
  let feedback: string;

  if (score >= 80) {
    level = 'high';
    feedback = 'High credibility - strong validation indicators, no red flags detected.';
  } else if (score >= 50) {
    level = 'moderate';
    feedback = 'Moderate credibility - some validation present, consider strengthening specifics.';
  } else if (score >= 30) {
    level = 'low';
    feedback = 'Low credibility - claims need stronger evidence or more specific detail.';
  } else {
    level = 'red_flag';
    feedback = 'Red flags detected - claims may trigger verification scrutiny or appear inflated.';
  }

  return { level, score, flags, feedback };
}

/**
 * Check for "well-lopsided" profile alignment (Section 1.4 synthesis)
 *
 * The recommended profile:
 * - ~4 high-quality activities
 * - 4-8 hours weekly per activity
 * - Exceptional achievement in ONE area
 * - Academic excellence AND broader interests maintained
 */
export function checkWellLopsidedAlignment(portfolio: {
  totalActivities: number;
  averageHoursPerActivity: number;
  hasExceptionalArea: boolean;
  domainsCovered: number;
  academicExcellenceMaintained: boolean;
}): { aligned: boolean; score: number; feedback: string; gaps: string[] } {
  let score = 0;
  const gaps: string[] = [];

  // Activity count (optimal ~4)
  if (portfolio.totalActivities >= 3 && portfolio.totalActivities <= 5) {
    score += 25;
  } else if (portfolio.totalActivities === 2 || portfolio.totalActivities === 6) {
    score += 15;
    gaps.push(portfolio.totalActivities < 3 ? 'Consider 1-2 more activities' : 'Consider consolidating activities');
  } else {
    gaps.push('Activity count outside optimal range (3-5)');
  }

  // Hours per activity (4-8 optimal)
  if (portfolio.averageHoursPerActivity >= 4 && portfolio.averageHoursPerActivity <= 8) {
    score += 25;
  } else if (portfolio.averageHoursPerActivity >= 3 && portfolio.averageHoursPerActivity <= 10) {
    score += 15;
    gaps.push('Hours slightly outside optimal 4-8/week range');
  } else {
    gaps.push('Hours per activity outside recommended range');
  }

  // Exceptional area (critical)
  if (portfolio.hasExceptionalArea) {
    score += 30;
  } else {
    gaps.push('No exceptional achievement area detected - this is critical');
  }

  // Domain coverage + academics
  if (portfolio.domainsCovered >= 3 && portfolio.academicExcellenceMaintained) {
    score += 20;
  } else {
    if (portfolio.domainsCovered < 3) gaps.push('Expand domain coverage for breadth');
    if (!portfolio.academicExcellenceMaintained) gaps.push('Academic excellence needs attention');
  }

  const aligned = score >= 70;
  let feedback: string;

  if (score >= 85) {
    feedback = 'Excellent "well-lopsided" alignment - fewer activities but deeper involvement in what you care about.';
  } else if (score >= 70) {
    feedback = 'Good alignment with the well-lopsided framework, with minor areas for improvement.';
  } else if (score >= 50) {
    feedback = 'Partial alignment - profile has good elements but significant gaps exist.';
  } else {
    feedback = 'Profile does not align with the well-lopsided framework recommended by elite admissions.';
  }

  return { aligned, score, feedback, gaps };
}

// ============================================================================
// EXPORT TYPE FOR FULL ACTIVITY DATA
// Structured to support all sections 1.1-1.5
// ============================================================================

export interface ActivityEvaluationInput {
  // Basic info
  name: string;
  description: string;

  // Section 1.1 - Quantity context
  isCore: boolean;

  // Section 1.2 - Time commitment
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsInvolved: number;
  startGrade: 9 | 10 | 11 | 12;
  isSummerOnly: boolean;

  // Section 1.3 - Depth signals
  hasLeadershipProgression: boolean;
  leadershipRoles?: Array<{ title: string; grade: number }>;
  hasQuantifiedImpact: boolean;
  quantifiedImpacts?: string[];

  // Section 1.3 - Breadth context
  thematicTags: string[];
  domain: 'academic' | 'leadership' | 'service' | 'personality';

  // Cross-validation (from 1.1)
  hasRecommendationMention?: boolean;
  hasEssayIntegration?: boolean;
  hasThirdPartyValidation?: boolean;

  // Section 1.4 - Spike context
  isPrimarySpike?: boolean; // Is this the student's primary spike area?

  // Section 1.5 - Impact tier
  impactLevel: 'national' | 'state' | 'regional' | 'local';

  // Section 1.5 - Credibility indicators
  credibilityIndicators?: {
    hasVagueSuperlatives: boolean;
    hasImplausibleScale: boolean;
    hasTimingInconsistencies: boolean;
  };
}

/**
 * Portfolio-level evaluation input
 * For assessing the complete activity portfolio
 */
export interface PortfolioEvaluationInput {
  activities: ActivityEvaluationInput[];

  // Section 1.4 - Institutional targeting
  targetInstitution?: InstitutionalFit;

  // Section 1.6 - Contextual factors (MUST be assessed FIRST)
  contextualFactors?: {
    // Work obligations
    hasPaidWork: boolean;
    workHoursPerWeek?: number;
    workType?: 'manual_labor' | 'office' | 'retail' | 'food_service' | 'family_business' | 'other';
    workNecessity?: 'financial_necessity' | 'family_contribution' | 'personal_choice';

    // Family responsibilities (the "cornerstone")
    hasFamilyResponsibilities: boolean;
    familyResponsibilityTypes?: Array<'sibling_care' | 'elder_care' | 'emotional_support' | 'household_management' | 'financial_support'>;
    familyResponsibilityHoursPerWeek?: number;

    // School context
    isUnderResourcedSchool: boolean;
    schoolAPOfferings?: number; // Number of APs available
    counselorToStudentRatio?: number; // e.g., 300 for 1:300

    // Geographic context
    hasGeographicLimitations: boolean;
    geographicType?: 'urban' | 'suburban' | 'rural' | 'remote';
    limitedProgramAccess?: boolean;

    // First-generation status
    isFirstGeneration?: boolean;
  };

  // Documentation status (from Section 1.6)
  documentationStatus?: {
    includedInActivitiesSection: boolean;
    usedAdditionalInformation: boolean;
    counselorAwareOfCircumstances: boolean;
  };

  // Academic context (for well-lopsided check)
  academicExcellenceMaintained: boolean;
}

/**
 * Section 1.6 contextual evaluation types
 */
export type ContextualModifierResult = {
  hasSignificantContext: boolean;
  contextCategories: string[];
  evaluationAdjustment: 'major_positive' | 'moderate_positive' | 'minor_positive' | 'none';
  feedback: string;
  documentationGuidance?: string[];
};

// ============================================================================
// SECTION 1.7: ACTIVITY CATEGORIES & PREFERENCES
// Source: PROMPT_A2_SECTION_1.7_RAW.md
// Dependencies: All previous sections
// KEY INSIGHT: NO ACTIVITY TYPE HIERARCHY - Passion and depth trump category
// ============================================================================

/**
 * THE REVOLUTIONARY FINDING: No Activity Type Hierarchy
 *
 * Elite institutions EXPLICITLY REJECT activity-type hierarchies.
 * Research is NOT inherently better than athletics.
 * Arts is NOT inferior to academics.
 * Passion and depth trump category in every case.
 */
export const ACTIVITY_TYPE_EVALUATION = {
  corePhilosophy: {
    noHierarchy: true,
    principle: 'Passion and depth trump category in every case',
    quotes: {
      chrisPeterson: {
        source: 'Chris Peterson, MIT Director of Special Projects and Communications',
        quote: '"Maybe it\'s a sport. Maybe it\'s an instrument. Maybe it\'s research. Maybe it\'s being a leader in your community. Math. Baking. Napping. Hopscotch. Whatever it is, spend time on it. Immerse yourself in it. Enjoy it."',
        implication: 'ANY activity can be valuable if pursued with genuine passion and depth',
      },
      richardShaw: {
        source: 'Richard Shaw, Stanford Dean of Admissions and Financial Aid',
        quote: 'Emphasizes "intellectual vitality and passion" over specific domains',
        implication: 'Stanford wants to hear "what it is that turns them on" regardless of domain',
      },
      harvardAO: {
        source: 'Former Harvard admissions officer',
        quote: '"Academic results are kind of a given... It really tends to be everything else that makes their application more compelling. These admissions officers are building a community; they\'re not just building a classroom."',
        implication: 'Activities matter for community building, not category checking',
      },
    },
  },
  systemImplication:
    'NEVER penalize students for activity category. Evaluate ALL activities on the same three dimensions.',
} as const;

/**
 * The Three Universal Evaluation Dimensions
 *
 * Instead of category hierarchies, AOs evaluate ALL activities across these:
 */
export const UNIVERSAL_EVALUATION_DIMENSIONS = {
  dimensions: [
    {
      name: 'Impact & Achievement',
      question: 'What did the student accomplish or change?',
      detectionMethods: ['Quantified outcomes', 'Recognition level', 'Tangible results'],
    },
    {
      name: 'Depth & Trajectory',
      question: 'How sustained was the engagement? Did the student grow?',
      detectionMethods: ['Years involved', 'Leadership progression', 'Skill development'],
    },
    {
      name: 'Institutional Fit',
      question: 'How do activities signal alignment with university values?',
      detectionMethods: ['Thematic coherence', 'Spike matching', 'Community contribution potential'],
    },
  ],
  evaluationPrinciple: 'Apply these three dimensions uniformly to ALL activities regardless of category',
} as const;

/**
 * Field-Specific Portfolio Exceptions
 *
 * While no category hierarchy exists, specialized evaluation occurs for certain domains.
 * These are PROCESS exceptions, not VALUE hierarchies.
 */
export const FIELD_SPECIFIC_EVALUATION = {
  exceptions: {
    artsMusic: {
      domain: 'Arts/Music',
      specialProcess: 'MIT has separate portals reviewed by faculty',
      notes: 'Professional-level achievement evaluated by domain experts, not general AOs',
    },
    athletics: {
      domain: 'Athletics',
      specialProcess: 'Parallel recruitment track',
      data: '86% acceptance for recruited athletes at Harvard vs 3.41% overall',
      notes: 'Only applies to recruited athletes, not general sports participation',
    },
    research: {
      domain: 'Research',
      specialProcess: 'Equity-aware evaluation',
      quote: {
        source: 'Stuart Schmill, MIT Dean of Admissions',
        text: '"Research is one of these activities that we\'re very aware they\'re not offered equitably."',
      },
      notes: 'Context heavily considered when evaluating research opportunities',
    },
  },
  clarification: 'These are process exceptions, not value hierarchies. A committed bassoonist is NOT valued less than a published researcher.',
} as const;

/**
 * The "Typical Activities" Ubiquity Problem
 *
 * NHS, student government, and standard clubs signal baseline engagement, NOT differentiation.
 */
export const TYPICAL_ACTIVITIES_PROBLEM = {
  coreChallenge: 'At 40,000+ application institutions, typical activities signal baseline engagement, not differentiation',
  typicalActivities: [
    'National Honor Society (NHS)',
    'Student government',
    'Generic club membership',
    'Varsity sports (non-recruited)',
    'General volunteer work without leadership',
  ],
  data: {
    nacac: '75% of AOs view NHS membership as indicating leadership and dedication',
    princeton: '"Standard accolades like Merit Scholar, NHS, AP Scholar, or club e-board member are a dime a dozen—in other words, they won\'t make you more competitive"',
  },
  harvardRating: {
    rating: 3,
    description: '"Active participation" but "little to distinguish them from other applicants"',
    encompasses: 'Standard clubs, varsity sports (non-recruited), typical NHS, general volunteer work',
  },
  keyInsight: {
    quote: {
      source: 'Christy Pratt, Notre Dame Director of Admissions',
      text: '"A competitive swimmer may dedicate over 20 hours weekly to training, which limits their participation in other clubs. Conversely, another student might explore various activities... both approaches are equally commendable."',
    },
    principle: 'The issue isn\'t the activity type - it\'s the LACK OF DISTINCTION within it',
  },
} as const;

/**
 * What Makes Activities Stand Out
 *
 * Delta Institute's Four Markers of Memorable Activities
 */
export const STANDOUT_ACTIVITY_MARKERS = {
  markers: [
    {
      name: 'Depth of Engagement',
      description: 'Long-term commitment to a specific area',
      detection: 'Multi-year involvement, increasing sophistication',
    },
    {
      name: 'Personal Ownership',
      description: 'Self-directed initiative rather than parent-guided activities',
      detection: 'Student-initiated, authentic voice in descriptions',
    },
    {
      name: 'Measurable Impact',
      description: 'Tangible results within communities or fields of interest',
      detection: 'Quantified outcomes, documented change',
    },
    {
      name: 'Unique Perspective',
      description: 'Individual approach to solving problems or exploring interests',
      detection: 'Original thinking, creative applications',
    },
  ],
  acceptedExamples: [
    {
      activity: 'Bird Watching Club',
      distinction: 'Organized trips, documented local species, shared findings with community',
    },
    {
      activity: 'D&D Club',
      distinction: 'Created inclusive space, organized weekly campaigns',
    },
    {
      activity: 'Fun Maths Problem Solving Society',
      distinction: 'Founded 40+ member group, guest speakers, problem-solving sessions',
    },
    {
      activity: 'Gardening Club',
      distinction: 'Donated produce to local food banks',
    },
  ],
  commonThread: 'Genuine interest + initiative + community value',
} as const;

/**
 * The "Endangered Species" Concept
 *
 * Unusual skills valuable to campus communities gain advantage through
 * INSTITUTIONAL NEED FULFILLMENT, not inherent superiority.
 */
export const ENDANGERED_SPECIES_CONCEPT = {
  framework: {
    source: 'Lila Fowler',
    principle: 'Unusual skills gain advantage through institutional need fulfillment, not inherent superiority',
  },
  examples: [
    { skill: 'Bassoon players', reason: 'Orchestras need them but few students play' },
    { skill: 'Crew coxswains', reason: 'Specific athletic need with limited supply' },
    { skill: 'French horn players', reason: 'Orchestra vacancies hard to fill' },
    { skill: 'Oboe players', reason: 'Essential for orchestra balance, rare' },
    { skill: 'Harpsichordists', reason: 'Early music programs need them' },
  ],
  implementation: 'This is about supply/demand matching, not activity prestige',
} as const;

/**
 * Passion Projects and Self-Directed Initiatives Evaluation
 */
export const PASSION_PROJECT_EVALUATION = {
  goldStandard: {
    quote: {
      source: 'Maite Ballestero, RSI Executive VP',
      text: '"We want students to find out what they are passionate about and explore it deeply... exploit their surroundings in the most positive way."',
    },
    principle: 'Authentic self-direction is the most valued form of activity engagement',
  },
  authenticityMarkers: {
    authentic: [
      'Self-motivated start (not external pressure)',
      'Persistence through obstacles and setbacks',
      'Evolution of project based on learning and growth',
      'Connection to personal experiences or values',
    ],
    inauthentic: [
      'External pressure (parent-driven)',
      'Smooth path with purchased access',
      'Static execution of bought template',
      'Trending topic with no personal link',
    ],
  },
  paidProgramProblem: {
    skepticism: {
      source: 'Former Ivy League AO (via ProPublica)',
      quote: '"Admissions officers are turned off when experiences repeatedly appear to be bought—versus earned or self-directed."',
    },
    nuance: {
      source: 'Lumiere Education',
      quote: '"If a student hustles by themselves to find a professor to work with that will show initiative. But, most students can\'t and don\'t do that - and research is seen as having value regardless of its origin (as long as the student really did the work)."',
    },
    readerLimitation: {
      source: 'Jon Reider, former Stanford AO (via ProPublica)',
      quote: '"The first reader is very young and in almost all cases majored in humanities or social sciences. They can\'t tell if a paper in the sciences means anything or is new at all."',
    },
  },
  implementation: 'Document authenticity markers, don\'t automatically discount paid programs if student did genuine work',
} as const;

/**
 * Virtual/Online Activities Evaluation
 *
 * Post-pandemic status: FULLY NORMALIZED
 */
export const VIRTUAL_ACTIVITIES_EVALUATION = {
  status: 'Fully normalized post-pandemic',
  legitimacy: {
    source: 'PrepScholar',
    quote: '"As long as you show a combination of dedication, skill, and leadership in an activity, it\'ll be legitimate to colleges, whether you did it remotely or not... Colleges won\'t hold pandemic- or health-related restrictions against you."',
  },
  crediblePrograms: {
    academicCompetitions: ['Art of Problem Solving (AoPS)', 'Codeforces', 'LeetCode', 'National Science Bowl virtual'],
    researchPrograms: ['MIT PRIMES', 'RSI virtual', 'Polygence'],
    hackathons: ['Major League Hacking (MLH)', 'CodeDay', 'Google Code-In'],
  },
  presentationRequirements: [
    'Explicitly state "virtual" or "online" to provide context',
    'Mention geographic reach for global initiatives',
    'Note obstacles overcome in remote collaboration',
    'Reference credible platforms (GitHub, Kaggle) to add credibility',
  ],
  equityDimension: 'Virtual activities democratize access for rural students and those with family responsibilities',
} as const;

/**
 * Harvard's Official 1-6 Extracurricular Rating Scale
 *
 * From SFFA v. Harvard lawsuit documentation
 * This is the most concrete data on how activities correlate with outcomes.
 */
export const HARVARD_EXTRACURRICULAR_RATING_SCALE = {
  source: 'SFFA v. Harvard lawsuit documentation',
  ratings: {
    1: {
      percentReceiving: 0.3,
      acceptanceRate: 48,
      definition: 'Unusual strength in one or more areas. Possible national-level achievement or professional experience. A potential major contributor at Harvard. Truly unusual achievement.',
      examples: [
        'USAMO qualification',
        'International Olympiad',
        'Professional-level musician',
        'Nationally recruited athlete',
        'Published author',
        'National organization founder with substantial reach',
      ],
    },
    2: {
      percentReceiving: 23.8,
      acceptanceRate: null, // Higher than 3, not specified
      definition: 'Strong secondary school contribution in one or more areas; possible leadership role(s).',
      examples: [
        'State-level competition success',
        'Significant leadership in well-regarded organizations',
        'Regional recognition in arts or athletics',
        'Self-directed projects with substantial community impact',
      ],
    },
    3: {
      percentReceiving: null, // Majority
      acceptanceRate: null, // Low
      definition: 'Active participation. Little to distinguish them from other applicants or even others within their chosen activities.',
      examples: [
        'Standard club membership',
        'Varsity sports participation (non-recruited)',
        'Typical NHS involvement',
        'General volunteer work without leadership or distinctive outcomes',
      ],
    },
    4: {
      definition: 'Little or no interest.',
      examples: ['Minimal involvement'],
    },
    5: {
      definition: 'Substantial activity outside of conventional EC participation such as family obligations or term-time work (could be included with other e/c to boost the rating or left as a "5" if it is more representative of the student\'s commitment).',
      examples: ['Family caregiving', 'Term-time employment', 'Household management'],
      keyInsight: 'Rating 5 is NOT "weak" - it\'s a DEDICATED tier recognizing that family/work ARE meaningful activities',
    },
    6: {
      definition: 'Physical condition prevents significant activity.',
      examples: ['Documented health limitations'],
    },
  },
} as const;

/**
 * CollegeVine Four-Tier Framework
 */
export const COLLEGEVINE_TIER_FRAMEWORK = {
  tiers: {
    1: {
      name: 'Rare/Exceptional',
      description: 'National/international recognition',
      examples: [
        'USAMO qualification',
        'Recruited athlete status at Division I programs',
        'Published research',
        'Attendance at highly selective summer programs (<10% acceptance)',
        'Professional-level arts achievement',
        'Founded organizations with substantial measurable impact',
      ],
    },
    2: {
      name: 'Impressive/Notable',
      description: 'State/regional success',
      examples: [
        'State orchestra',
        'Model UN leadership',
        'All-state selections in music, athletics, or performance',
        'Documented community impact from self-directed projects',
        'Selective summer program participation (10-30% acceptance)',
        'Long-term commitment with progressive responsibility',
      ],
    },
    3: {
      name: 'Solid Involvement',
      description: 'School-level leadership',
      examples: [
        'Club officer roles',
        'Varsity sports (non-recruited)',
        'Sustained community service',
        'Part-time employment',
        'Regional participation without major distinction',
      ],
    },
    4: {
      name: 'Casual Participation',
      description: 'Membership without distinction',
      examples: [
        'Club membership without leadership',
        'Intermittent volunteering',
        'Brief program participation',
        'Activities without demonstrated growth or impact',
      ],
    },
  },
  contextualModifier: {
    principle: 'Context transforms tiers',
    example: 'A student founding their school\'s first CS club in rural Kansas may demonstrate MORE initiative than a student joining Silicon Valley school\'s well-funded robotics team',
  },
} as const;

/**
 * Spike vs Well-Rounded Synthesis
 *
 * Reinforces Section 1.4 with additional detail from Section 1.7
 */
export const SPIKE_VS_WELLROUNDED_EXTENDED = {
  contemporaryPreference: 'Spike',
  spikeDefinition: {
    source: 'EduAvenues',
    quote: '"A spike applicant is someone who has a clear, well-developed specialty—a deep strength in one particular area that stands out on a national or even global level."',
  },
  whySpikesAreFavored: {
    buildingClasses: '"Universities need French horn players for orchestras, quantum physics researchers for labs, policy debaters for teams"',
    predictingFuture: 'Deep engagement signals potential for doctoral research, professional leadership',
  },
  wellRoundedStillWorks: {
    conditions: [
      'Exceptional breadth with leadership in multiple domains',
      'Cohesive narrative connecting diverse interests',
      'Demonstrated adaptability across contexts',
      'Strong community leadership spanning roles',
    ],
    quote: {
      source: 'Fortuna Admissions',
      text: '"You don\'t need a spike to get into the Ivy League – but it can give your application an edge... many well-rounded students are admitted each year."',
    },
  },
  wellRoundedPreferredAt: [
    'Liberal arts colleges (intellectual breadth valued)',
    'Small colleges (need versatile students)',
    'Public service programs',
    'Underrepresented backgrounds (breadth shows resilience)',
  ],
} as const;

/**
 * The Holistic Review Process: How Decisions Actually Happen
 *
 * Critical data for understanding how activities get evaluated in context.
 */
export const HOLISTIC_REVIEW_PROCESS = {
  phases: [
    {
      phase: 1,
      name: 'Initial Academic Screen',
      poolTransition: '50,000 → 20,000',
      timePerApp: '~5 minutes',
      purpose: 'Eliminate academically unqualified (~60% eliminated)',
    },
    {
      phase: 2,
      name: 'Holistic Review',
      poolTransition: '20,000 → 4,000',
      timePerApp: '~20 minutes',
      purpose: 'Full application first read by regional AO',
    },
    {
      phase: 3,
      name: 'Second Reader',
      poolTransition: 'Selective applications',
      timePerApp: '15-30 minutes',
      purpose: 'Validate first reader assessment',
    },
    {
      phase: 4,
      name: 'Subcommittee',
      poolTransition: '~4,000 candidates',
      timePerApp: '30+ minutes',
      purpose: 'Regional group deliberation (5-8 people)',
    },
    {
      phase: 5,
      name: 'Full Committee',
      poolTransition: '~1,000 final',
      timePerApp: '5-20 minutes',
      purpose: 'Final decision (40 members at Harvard)',
    },
  ],
  totalTimeForAdmitted: 'Often exceeds 90 minutes across all stages',
  yaleAdmissionsPodcast: {
    quote: '"All of the files... goes through what\'s called a committee process, where the notes and ratings are then considered and discussed by a roomful of people, including admissions officers, deans, faculty members."',
  },
  committeBasedEvaluation: {
    description: 'Two officers review different parts simultaneously',
    process: ['One focuses on academics', 'Another reads essays/extracurriculars'],
    usedAt: ['Rice', 'Caltech', 'Emory', 'Bucknell'],
    totalTime: '6-8 minutes vs 12-15 sequential',
  },
} as const;

/**
 * Work Experience as Premium Extracurricular (Reinforces Section 1.6)
 *
 * Section 1.7 provides additional evidence for work value.
 */
export const WORK_AS_PREMIUM_EC = {
  reinforcement: 'Section 1.7 REINFORCES Section 1.6 findings',
  quotes: {
    redditAO: {
      source: 'Reddit AO "prsehgal"',
      quote: '"A job - even flipping burgers at your local restaurant - can have a bigger impact than fancy EC\'s that a lot of people keep chasing."',
    },
    linkedIn: {
      quote: '"Having a year-round part-time job for 3 to 4 years is an incredibly strong, top-tier extracurricular"',
    },
    harberson: {
      source: 'Sarah Harberson',
      quote: '"Family Responsibilities\' is not only there as an option, it is becoming one of the most respected \'activities\' a student can do."',
    },
  },
  whyWorkMatters: [
    'Economic Value: Shows you can create value',
    'Real-World Accountability: Jobs require reliability',
    'Time Management: Demonstrates prioritization',
    'Maturity: Develops discipline and problem-solving',
    'Authenticity: Work stems from necessity or genuine interest',
  ],
  tierClassification: 'Long-term employment (3-4 years) = Tier 1 extracurricular',
} as const;

/**
 * Section 1.7 Implementation Summary
 */
export const SECTION_1_7_IMPLEMENTATION = {
  keyPrinciples: [
    { principle: 'No Category Hierarchy', implementation: 'Evaluate ALL activities on same three dimensions' },
    { principle: 'Ubiquity Problem', implementation: 'Flag typical activities lacking distinction' },
    { principle: 'Standout Markers', implementation: 'Detect depth, ownership, impact, unique perspective' },
    { principle: 'Passion Projects', implementation: "Reward authenticity, don't auto-discount paid programs" },
    { principle: 'Virtual Legitimacy', implementation: 'Treat online activities as equivalent to in-person' },
    { principle: 'Rating System', implementation: 'Use Harvard 1-6 or CollegeVine 4-tier as framework' },
    { principle: 'Work as Premium', implementation: 'Long-term employment = Tier 1 extracurricular' },
    { principle: 'Process Awareness', implementation: '90+ minutes of review for admitted students' },
  ],
  status: 'SECTION 1 COMPLETE - All extracurricular evaluation research integrated (1.1-1.7)',
} as const;

// ============================================================================
// SECTION 1.7 EVALUATION TYPES
// ============================================================================

export type HarvardECRating = 1 | 2 | 3 | 4 | 5 | 6;
export type CollegeVineTier = 1 | 2 | 3 | 4;

export interface ActivityTierAssessment {
  harvardRating: HarvardECRating;
  collegeVineTier: CollegeVineTier;
  standoutMarkers: string[];
  ubiquityFlag: boolean;
  authenticityScore: 'high' | 'moderate' | 'low' | 'concerning';
  feedback: string;
}

export interface PortfolioTierSummary {
  ratingDistribution: Record<HarvardECRating, number>;
  hasTier1Activity: boolean;
  averageTier: number;
  ubiquitousActivitiesCount: number;
  workIncluded: boolean;
  familyResponsibilitiesIncluded: boolean;
  spikeDetected: boolean;
  overallAssessment: string;
}
