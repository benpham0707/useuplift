/**
 * Quantifiable Impact Metrics Framework
 *
 * Provides concrete thresholds for evaluating the impact of student activities.
 * Admissions officers look for EVIDENCE of impact, not just claims.
 *
 * This framework helps:
 * 1. Validate claimed achievements against realistic benchmarks
 * 2. Score impact across different activity types
 * 3. Identify inflated or unrealistic claims (red flags)
 * 4. Compare impact across different domains fairly
 *
 * Sources:
 * - Sara Harberson's tier system research
 * - MIT/Stanford admissions officer interviews
 * - College counselor consensus on impact metrics
 * - Business/nonprofit benchmark data
 */

// ============================================================================
// IMPACT TIERS
// ============================================================================

/**
 * Impact tier definitions
 * These apply across all activity types for consistent evaluation
 */
export type ImpactTier =
  | 'transformational' // Changed systems, created lasting infrastructure
  | 'exceptional' // Significant measurable impact beyond immediate circle
  | 'strong' // Clear impact on community or organization
  | 'solid' // Meaningful contribution with some evidence
  | 'moderate' // Participation with limited evidence of impact
  | 'minimal'; // Involvement without measurable impact

export const IMPACT_TIER_DESCRIPTIONS: Record<
  ImpactTier,
  { description: string; admissionWeight: string; examples: string[] }
> = {
  transformational: {
    description: 'Created lasting change at regional/national level',
    admissionWeight: 'Near guarantee at target schools',
    examples: [
      'Founded nonprofit serving 10,000+ beneficiaries annually',
      'Policy changed due to advocacy work',
      'Product used by 100,000+ users',
      'Research led to patent or significant discovery',
    ],
  },
  exceptional: {
    description: 'Significant measurable impact beyond immediate community',
    admissionWeight: 'Major positive factor',
    examples: [
      'Founded organization with 1,000+ beneficiaries',
      'Raised $50,000+ for causes',
      'Business with $100K+ revenue',
      'App with 10,000+ users',
    ],
  },
  strong: {
    description: 'Clear impact on school or local community',
    admissionWeight: 'Significant positive factor',
    examples: [
      'Led initiative benefiting 500+ people',
      'Raised $10,000+ for organization',
      'Created school program now institutionalized',
      'Published research with citations',
    ],
  },
  solid: {
    description: 'Meaningful contribution with evidence',
    admissionWeight: 'Positive factor',
    examples: [
      'Tutored 50+ students with tracked improvement',
      'Led club with measurable outcomes',
      'Organized event serving 200+ attendees',
      'Created tool/resource used by school',
    ],
  },
  moderate: {
    description: 'Participation with limited evidence of impact',
    admissionWeight: 'Minor positive factor',
    examples: [
      'Regular volunteer hours at organization',
      'Active club member without leadership',
      'Participated in community events',
    ],
  },
  minimal: {
    description: 'Involvement without measurable impact',
    admissionWeight: 'Negligible',
    examples: ['Listed as member with minimal participation', 'Attended meetings occasionally', 'One-time volunteer'],
  },
};

// ============================================================================
// METRIC CATEGORIES
// ============================================================================

/**
 * Different types of impact require different metrics
 * This allows fair comparison across diverse activities
 */

export interface MetricThresholds {
  transformational: number;
  exceptional: number;
  strong: number;
  solid: number;
  moderate: number;
  unit: string;
  context: string;
}

// ============================================================================
// PEOPLE SERVED / BENEFICIARIES
// ============================================================================

export const BENEFICIARY_METRICS: Record<string, MetricThresholds> = {
  direct_beneficiaries: {
    transformational: 10000,
    exceptional: 1000,
    strong: 500,
    solid: 100,
    moderate: 25,
    unit: 'people directly helped',
    context: 'For tutoring, mentoring, direct service',
  },
  indirect_beneficiaries: {
    transformational: 100000,
    exceptional: 10000,
    strong: 5000,
    solid: 1000,
    moderate: 200,
    unit: 'people reached',
    context: 'For awareness campaigns, content creation, policy impact',
  },
  students_tutored: {
    transformational: 500,
    exceptional: 100,
    strong: 50,
    solid: 20,
    moderate: 5,
    unit: 'students tutored regularly',
    context: 'Must be ongoing, not one-time help',
  },
  meals_served: {
    transformational: 50000,
    exceptional: 10000,
    strong: 5000,
    solid: 1000,
    moderate: 200,
    unit: 'meals served',
    context: 'For food service programs',
  },
  mentees: {
    transformational: 100,
    exceptional: 30,
    strong: 15,
    solid: 5,
    moderate: 2,
    unit: 'ongoing mentees',
    context: 'Regular mentoring relationships',
  },
};

// ============================================================================
// FINANCIAL IMPACT
// ============================================================================

export const FINANCIAL_METRICS: Record<string, MetricThresholds> = {
  money_raised_nonprofit: {
    transformational: 500000,
    exceptional: 100000,
    strong: 25000,
    solid: 5000,
    moderate: 1000,
    unit: 'dollars raised',
    context: 'For nonprofit fundraising efforts',
  },
  business_revenue_annual: {
    transformational: 1000000,
    exceptional: 100000,
    strong: 25000,
    solid: 5000,
    moderate: 1000,
    unit: 'dollars annual revenue',
    context: 'For entrepreneurship ventures',
  },
  funding_raised_startup: {
    transformational: 5000000,
    exceptional: 1000000,
    strong: 100000,
    solid: 25000,
    moderate: 5000,
    unit: 'dollars investment raised',
    context: 'Must be from non-family sources',
  },
  grants_won: {
    transformational: 100000,
    exceptional: 25000,
    strong: 10000,
    solid: 2500,
    moderate: 500,
    unit: 'dollars in grants',
    context: 'Competitive grants for projects',
  },
  scholarships_facilitated: {
    transformational: 1000000,
    exceptional: 100000,
    strong: 25000,
    solid: 5000,
    moderate: 1000,
    unit: 'dollars in scholarships',
    context: 'For college access programs',
  },
};

// ============================================================================
// DIGITAL / TECH IMPACT
// ============================================================================

export const DIGITAL_METRICS: Record<string, MetricThresholds> = {
  monthly_active_users: {
    transformational: 1000000,
    exceptional: 100000,
    strong: 10000,
    solid: 1000,
    moderate: 100,
    unit: 'monthly active users',
    context: 'App or platform users, must be verifiable',
  },
  total_downloads: {
    transformational: 5000000,
    exceptional: 500000,
    strong: 50000,
    solid: 5000,
    moderate: 500,
    unit: 'downloads',
    context: 'Downloads != users, weighted less',
  },
  github_stars: {
    transformational: 10000,
    exceptional: 1000,
    strong: 250,
    solid: 50,
    moderate: 10,
    unit: 'GitHub stars',
    context: 'For open source projects',
  },
  website_monthly_visitors: {
    transformational: 500000,
    exceptional: 50000,
    strong: 10000,
    solid: 1000,
    moderate: 200,
    unit: 'monthly unique visitors',
    context: 'For content sites, must be organic',
  },
  subscribers_followers: {
    transformational: 500000,
    exceptional: 50000,
    strong: 10000,
    solid: 1000,
    moderate: 200,
    unit: 'genuine subscribers/followers',
    context: 'Organic followers, not purchased',
  },
  video_views: {
    transformational: 10000000,
    exceptional: 1000000,
    strong: 100000,
    solid: 10000,
    moderate: 1000,
    unit: 'total video views',
    context: 'Educational or mission-aligned content',
  },
};

// ============================================================================
// RESEARCH / ACADEMIC IMPACT
// ============================================================================

export const RESEARCH_METRICS: Record<string, MetricThresholds> = {
  peer_reviewed_publications: {
    transformational: 5,
    exceptional: 2,
    strong: 1,
    solid: 0, // Submitted/under review
    moderate: 0, // None
    unit: 'peer-reviewed papers',
    context: 'In recognized journals, student as author',
  },
  citations: {
    transformational: 100,
    exceptional: 25,
    strong: 10,
    solid: 3,
    moderate: 0,
    unit: 'citations',
    context: 'For published research',
  },
  conference_presentations: {
    transformational: 10,
    exceptional: 5,
    strong: 3,
    solid: 1,
    moderate: 0,
    unit: 'conference presentations',
    context: 'At recognized academic conferences',
  },
  patents: {
    transformational: 3,
    exceptional: 1,
    strong: 0, // Patent pending
    solid: 0,
    moderate: 0,
    unit: 'patents granted',
    context: 'Actual patents, not just ideas',
  },
  research_hours: {
    transformational: 2000,
    exceptional: 1000,
    strong: 500,
    solid: 200,
    moderate: 50,
    unit: 'hours of research',
    context: 'Documented lab/research time',
  },
};

// ============================================================================
// LEADERSHIP / ORGANIZATIONAL IMPACT
// ============================================================================

export const LEADERSHIP_METRICS: Record<string, MetricThresholds> = {
  people_managed: {
    transformational: 500,
    exceptional: 100,
    strong: 30,
    solid: 10,
    moderate: 3,
    unit: 'people directly led',
    context: 'As organization/team leader',
  },
  volunteers_recruited: {
    transformational: 1000,
    exceptional: 200,
    strong: 50,
    solid: 15,
    moderate: 5,
    unit: 'volunteers recruited and retained',
    context: 'Must be ongoing volunteers',
  },
  chapters_founded: {
    transformational: 50,
    exceptional: 10,
    strong: 5,
    solid: 2,
    moderate: 1,
    unit: 'chapters/branches founded',
    context: 'For organizations expanded to new locations',
  },
  events_organized: {
    transformational: 100,
    exceptional: 25,
    strong: 10,
    solid: 5,
    moderate: 2,
    unit: 'significant events organized',
    context: 'As primary organizer, not just helper',
  },
  org_budget_managed: {
    transformational: 500000,
    exceptional: 100000,
    strong: 25000,
    solid: 5000,
    moderate: 1000,
    unit: 'dollars budget managed',
    context: 'Annual budget responsibility',
  },
};

// ============================================================================
// COMPETITION / ACHIEVEMENT METRICS
// ============================================================================

export const COMPETITION_METRICS: Record<string, MetricThresholds> = {
  competition_participants: {
    transformational: 500000, // International olympiad
    exceptional: 50000, // National finals
    strong: 5000, // State competition
    solid: 500, // Regional
    moderate: 50, // Local
    unit: 'total participants in competition',
    context: 'Used to contextualize placement',
  },
  selectivity_percentage: {
    transformational: 0.1, // Top 0.1%
    exceptional: 1, // Top 1%
    strong: 5, // Top 5%
    solid: 10, // Top 10%
    moderate: 25, // Top 25%
    unit: 'percentage selected',
    context: 'What percent make this achievement',
  },
};

// ============================================================================
// TIME INVESTMENT METRICS
// ============================================================================

export const TIME_METRICS: Record<string, MetricThresholds> = {
  weekly_hours: {
    transformational: 30, // Professional-level commitment
    exceptional: 20,
    strong: 15,
    solid: 10,
    moderate: 5,
    unit: 'hours per week',
    context: 'Sustained weekly commitment',
  },
  total_hours_activity: {
    transformational: 5000,
    exceptional: 2000,
    strong: 1000,
    solid: 500,
    moderate: 100,
    unit: 'total hours over high school',
    context: 'Cumulative commitment',
  },
  years_of_involvement: {
    transformational: 4, // All of high school + before
    exceptional: 4,
    strong: 3,
    solid: 2,
    moderate: 1,
    unit: 'years',
    context: 'Duration of sustained involvement',
  },
  weeks_per_year: {
    transformational: 52, // Year-round
    exceptional: 40,
    strong: 30,
    solid: 20,
    moderate: 10,
    unit: 'weeks active per year',
    context: 'Not just during school year',
  },
};

// ============================================================================
// MEDIA / RECOGNITION METRICS
// ============================================================================

export const RECOGNITION_METRICS: Record<string, MetricThresholds> = {
  national_media_mentions: {
    transformational: 10,
    exceptional: 3,
    strong: 1,
    solid: 0,
    moderate: 0,
    unit: 'national media features',
    context: 'NYT, WSJ, major outlets',
  },
  local_media_mentions: {
    transformational: 25,
    exceptional: 10,
    strong: 5,
    solid: 2,
    moderate: 1,
    unit: 'local media features',
    context: 'Local news, regional papers',
  },
  awards_received: {
    transformational: 20,
    exceptional: 10,
    strong: 5,
    solid: 2,
    moderate: 1,
    unit: 'significant awards',
    context: 'Selective, competitive awards',
  },
  letters_of_support: {
    transformational: 50,
    exceptional: 20,
    strong: 10,
    solid: 5,
    moderate: 2,
    unit: 'letters of support/recognition',
    context: 'From community members, officials',
  },
};

// ============================================================================
// RED FLAGS - UNREALISTIC CLAIMS
// ============================================================================

/**
 * These thresholds indicate likely exaggeration or impossibility
 * Used to flag applications for closer scrutiny
 */

export const METRIC_RED_FLAGS = {
  impossible_hours: {
    threshold: 168, // Hours in a week
    metric: 'weekly_hours',
    flag: 'Claims more than 168 hours/week across activities',
    severity: 'critical',
    guidance: 'Total hours across all activities cannot exceed hours in a week',
  },

  unlikely_simultaneous: {
    threshold: 80,
    metric: 'weekly_hours',
    flag: 'Claims 80+ hours/week across activities',
    severity: 'high',
    guidance: 'Must account for school, sleep, basic life activities',
  },

  startup_claims_no_evidence: {
    threshold: 100000,
    metric: 'business_revenue_annual',
    flag: 'Claims $100K+ revenue with no verifiable evidence',
    severity: 'high',
    guidance: 'Significant revenue claims need third-party verification',
  },

  user_claims_no_evidence: {
    threshold: 10000,
    metric: 'monthly_active_users',
    flag: 'Claims 10K+ users without app store/analytics link',
    severity: 'moderate',
    guidance: 'User claims should be verifiable via app stores or analytics',
  },

  nonprofit_501c3_timeline: {
    threshold: 0,
    metric: 'months_since_founding',
    flag: '501(c)(3) founded in senior year',
    severity: 'moderate',
    guidance: 'Nonprofits take time to have real impact',
  },

  instant_virality: {
    threshold: 100000,
    metric: 'subscribers_followers',
    flag: 'Claims 100K+ followers gained in under 6 months',
    severity: 'moderate',
    guidance: 'Viral growth is rare and should be verifiable',
  },

  research_without_mentor: {
    threshold: 1,
    metric: 'peer_reviewed_publications',
    flag: 'Claims peer-reviewed publication without institutional affiliation',
    severity: 'moderate',
    guidance: 'Most HS research is conducted with university mentors',
  },

  leadership_inflation: {
    threshold: 100,
    metric: 'people_managed',
    flag: 'Claims to manage 100+ people without organizational context',
    severity: 'moderate',
    guidance: 'Large-scale leadership requires organizational infrastructure',
  },
};

// ============================================================================
// VERIFICATION GUIDELINES
// ============================================================================

/**
 * Guidelines for what evidence supports different impact claims
 */

export const VERIFICATION_STANDARDS = {
  financial_claims: {
    acceptable_evidence: [
      'Tax returns (for businesses)',
      'Bank statements',
      '501(c)(3) annual report',
      'Third-party audit',
      'News coverage mentioning figures',
      'Investor term sheets',
    ],
    red_flags: [
      'Only self-reported',
      'No paper trail',
      'Round numbers only',
      'Family as only source',
    ],
  },

  user_metrics: {
    acceptable_evidence: [
      'App store download counts',
      'Google Analytics screenshots',
      'Third-party tracking data',
      'Media coverage citing figures',
      'GitHub statistics',
    ],
    red_flags: [
      'Only self-reported',
      'No public presence',
      'Downloaded != active users conflation',
      'Purchased followers/downloads',
    ],
  },

  beneficiary_claims: {
    acceptable_evidence: [
      'Organizational records',
      'Partner organization verification',
      'Media coverage',
      'Thank you letters/testimonials',
      'Government/school partnership documentation',
    ],
    red_flags: [
      'Round numbers without records',
      'No organizational partner',
      'Inflated "reached" vs "helped" distinction',
      'Claims without any documentation',
    ],
  },

  research_claims: {
    acceptable_evidence: [
      'Published paper with DOI',
      'Conference program listing',
      'Mentor/PI letter',
      'Lab website listing',
      'Poster/presentation materials',
    ],
    red_flags: [
      'Journal not indexed in major databases',
      'Predatory journal publication',
      'No mentor verification possible',
      'Claims first authorship inappropriately',
    ],
  },

  leadership_claims: {
    acceptable_evidence: [
      'Organization website/materials',
      'Advisor/sponsor verification',
      'Media coverage of organization',
      'Successor in role',
      'Organizational records',
    ],
    red_flags: [
      'Title without responsibilities',
      'Organization with no public presence',
      'Founded org with no continuing activity',
      'Multiple simultaneous "President" roles',
    ],
  },
};

// ============================================================================
// IMPACT COMPARISON FRAMEWORK
// ============================================================================

/**
 * Rules for comparing impact across different activity types
 * Ensures fair evaluation of diverse profiles
 */

export const CROSS_DOMAIN_COMPARISON = {
  equivalence_guidelines: {
    description: 'How to compare impact across different domains',
    rules: [
      {
        rule: 'Depth beats breadth',
        explanation: 'Transformational impact in one area > Strong impact in three areas',
      },
      {
        rule: 'Verified beats claimed',
        explanation: 'Documented solid impact > Unverified exceptional claims',
      },
      {
        rule: 'Sustained beats intense',
        explanation: 'Multi-year commitment > Senior year sprint',
      },
      {
        rule: 'Impact beats hours',
        explanation: '100 hours with transformational impact > 1000 hours with minimal impact',
      },
      {
        rule: 'Context matters',
        explanation: 'Impact relative to resources and opportunities available',
      },
    ],
  },

  context_adjustments: {
    first_gen: {
      adjustment: 'Tier +1 for equivalent achievement',
      rationale: 'Less access to resources, mentorship, and connections',
    },
    low_income: {
      adjustment: 'Tier +1 for equivalent achievement',
      rationale: 'Working while achieving shows exceptional capacity',
    },
    rural: {
      adjustment: 'Consider available opportunities',
      rationale: 'Regional competition may be only option',
    },
    international: {
      adjustment: 'Translate achievements to US equivalents',
      rationale: 'Different competition structures globally',
    },
    underrepresented_field: {
      adjustment: 'Consider barriers to entry',
      rationale: 'First-generation in field faces unique challenges',
    },
  },
};

// ============================================================================
// IMPACT SCORING FUNCTION TYPES
// ============================================================================

export interface ImpactScore {
  tier: ImpactTier;
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  evidence_strength: 'verified' | 'documented' | 'claimed';
  red_flags: string[];
  context_adjustments: string[];
  narrative_value: string;
}

export interface ActivityImpactAnalysis {
  activity_name: string;
  category: string;
  metrics: Record<string, number>;
  impact_score: ImpactScore;
  verification_status: 'verified' | 'verifiable' | 'unverifiable';
  comparable_achievements: string[];
  recommendations: string[];
}

// ============================================================================
// EXPORT
// ============================================================================

export const impactMetricsFramework = {
  IMPACT_TIER_DESCRIPTIONS,
  BENEFICIARY_METRICS,
  FINANCIAL_METRICS,
  DIGITAL_METRICS,
  RESEARCH_METRICS,
  LEADERSHIP_METRICS,
  COMPETITION_METRICS,
  TIME_METRICS,
  RECOGNITION_METRICS,
  METRIC_RED_FLAGS,
  VERIFICATION_STANDARDS,
  CROSS_DOMAIN_COMPARISON,
};
