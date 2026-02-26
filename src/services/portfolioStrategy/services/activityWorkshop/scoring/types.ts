/**
 * Activity Scoring Rubric Types
 *
 * Comprehensive 1-10 scoring system for extracurricular activities with:
 * - Description Score: How well the activity is written/presented
 * - Activity Score: How good the activity is objectively
 * - Portfolio Score: Overall extracurriculars section assessment
 *
 * Each score includes detailed breakdowns and rationales explaining
 * exactly WHY it received that score.
 */

// ============================================================================
// DESCRIPTION SCORE TYPES (1-10)
// ============================================================================

/**
 * Individual component of description score
 */
export interface DescriptionScoreComponent {
  /** Score for this component */
  score: number;
  /** Maximum possible score for this component */
  maxScore: number;
  /** Explanation of why this score was assigned */
  rationale: string;
}

/**
 * Description Score Breakdown
 *
 * Measures how well the 150-character description is written.
 * Total: 10 points (variable weighting for nuanced assessment)
 *
 * NEW FRAMEWORK (Research-Backed, Weighted 0-10):
 * - Role Ownership (0-10, 25%): Does the reader know exactly what THIS student did?
 * - Evidence of Impact (0-10, 25%): Is there clear cause-and-effect?
 * - Differentiation Signal (0-10, 20%): What makes THIS student stand out?
 * - Action Precision (0-10, 15%): How specific and powerful is the language?
 * - Strategic Quantification (0-10, 15%): Are numbers used meaningfully?
 *
 * Total = weighted average of dimensions (0-10).
 * Legacy field names maintained for backward compatibility.
 */
export interface DescriptionScoreBreakdown {
  /**
   * ROLE OWNERSHIP (0-10, weight: 25%) - formerly "specificity"
   * Does the reader know exactly what THIS student did?
   * Foundation dimension — without role clarity, AOs can't evaluate anything else.
   * Sara Harberson: "clear evidence of individual contribution" required for Tier 2+.
   */
  specificity: DescriptionScoreComponent;

  /**
   * EVIDENCE OF IMPACT (0-10, weight: 25%) - formerly "impactClarity"
   * Is there clear cause-and-effect showing meaningful outcomes?
   * The tier differentiator. Harvard CDS: "demonstrated impact" rated Very Important.
   * Separates "did stuff" (Tier 4) from "made a difference" (Tier 2+).
   */
  impactClarity: DescriptionScoreComponent;

  /**
   * ACTION PRECISION (0-10, weight: 15%) - formerly "actionLanguage"
   * How specific and powerful is the language?
   * Craft dimension — strong verbs shape first impressions in the 6-second scan.
   * "Founded" vs "started" vs "helped start" creates different mental models.
   */
  actionLanguage: DescriptionScoreComponent;

  /**
   * STRATEGIC QUANTIFICATION (0-10, weight: 15%) - formerly "quantification"
   * Are numbers used meaningfully to demonstrate scale and significance?
   * Supporting dimension — numbers add credibility and specificity.
   * MIT research: specific numbers 2.4x more memorable than vague claims.
   */
  quantification: DescriptionScoreComponent;

  /**
   * DIFFERENTIATION SIGNAL (0-10, weight: 20%) - formerly "authenticityVoice"
   * What did THIS student do that 1,000 others in the same activity didn't?
   * Memorability factor — uniqueness survives committee discussion.
   * Unique details recalled 3-5x more than generic descriptions.
   */
  authenticityVoice: DescriptionScoreComponent;
}

/**
 * Complete Description Score for an activity
 */
export interface DescriptionScore {
  /** Total score (1-10 scale) */
  total: number;

  /** Detailed breakdown by component */
  breakdown: DescriptionScoreBreakdown;

  /** What the description does well */
  strengths: string[];

  /** What could be improved */
  improvements: string[];

  /** Overall rationale for the score */
  overallRationale: string;

  /** Suggested improved version of the description */
  suggestedRewrite?: string;
}

// ============================================================================
// ACTIVITY SCORE TYPES (1-10)
// ============================================================================

/**
 * Activity Score Component (0-10 scale with weight)
 *
 * Each component is scored on a 0-10 scale, then the weight is applied
 * to calculate contribution to total. This makes scores intuitive to users.
 */
export interface ActivityScoreComponent {
  /** Raw score for this component (0-10 scale) */
  score: number;
  /** Maximum possible score (always 10) */
  maxScore: 10;
  /** Weight applied to this component (e.g., 0.30 = 30%) */
  weight: number;
  /** Weighted contribution to total (score × weight) */
  weightedScore: number;
  /** Explanation of why this score was assigned - should be SPECIFIC and INSIGHTFUL */
  rationale: string;
}

/**
 * Tier Assessment Component (special)
 * Weight: 30% of total score
 *
 * PRESENTATION GUIDANCE:
 * - The numeric `tier` (1-4, lower = better) is kept for internal computation
 * - USER-FACING presentation should use descriptive TIER NAMES
 * - Use getTierName() helper to convert tier number to descriptive label
 * - Example: Instead of "Tier 2", present as "Highly Competitive (State/Regional Recognition)"
 */
export interface TierAssessmentComponent extends ActivityScoreComponent {
  /**
   * Sara Harberson tier classification (1 = best, 4 = lowest)
   * IMPORTANT: For user-facing display, convert to tier name using getTierName()
   */
  tier: 1 | 2 | 3 | 4;
}

/**
 * Recognition Level Component (special)
 * Weight: 25% of total score
 */
export interface RecognitionComponent extends ActivityScoreComponent {
  /** Recognition level achieved */
  level: 'international' | 'national' | 'state' | 'regional' | 'school' | 'local' | 'none';
}

/**
 * Leadership & Impact Component (special)
 * Weight: 12.5% of total score when applicable, 0% when not applicable
 *
 * NOTE: This component is CONDITIONAL. Not all activities have leadership/team
 * components (e.g., individual research, solo music practice, personal projects).
 * When not applicable, set isApplicable=false and weight redistributes to other components.
 */
export interface LeadershipComponent extends ActivityScoreComponent {
  /** Whether this component applies to this activity type */
  isApplicable: boolean;
  /** Role held in the activity */
  role: 'founder' | 'president_captain' | 'executive' | 'team_lead' | 'contributor' | 'participant' | 'member' | 'not_applicable';
  /** Scope of impact */
  impactScope: 'national' | 'regional' | 'community' | 'organization' | 'team' | 'individual' | 'not_applicable';
}

/**
 * Community & Character Component (special)
 * Weight: 15% of total score
 *
 * Evaluates the character qualities demonstrated and community value created.
 * This is ALWAYS applicable as every activity reveals something about character.
 */
export interface CommunityCharacterComponent extends ActivityScoreComponent {
  /** Primary character trait demonstrated */
  primaryTrait: 'service' | 'innovation' | 'resilience' | 'curiosity' | 'empathy' | 'discipline' | 'creativity' | 'integrity';
  /** How the activity benefits others beyond the student */
  communityBenefit: 'significant' | 'moderate' | 'minimal' | 'self-focused';
  /** Whether the activity shows genuine care vs resume-building */
  authenticitySignal: 'highly_authentic' | 'genuine' | 'neutral' | 'resume_padding';
}

/**
 * Commitment & Progression Component (special)
 * Weight: 17.5% base, can increase to 20% when leadership not applicable
 */
export interface CommitmentComponent extends ActivityScoreComponent {
  /** Years involved */
  years: number;
  /** Whether progression in responsibility was evident */
  showsProgression: boolean;
  /** Whether activity was sustained through junior year */
  sustainedThroughJunior: boolean;
}

/**
 * Activity Score Breakdown
 *
 * Measures how good the activity is objectively.
 * Each component is scored 0-10, then weighted to create total.
 *
 * WEIGHTS (total = 100%):
 * - Tier Assessment: 30%
 * - Recognition Level: 25%
 * - Leadership & Impact: 12.5% (when applicable) OR redistributed
 * - Community & Character: 15%
 * - Commitment & Progression: 17.5% (increases to 20% when leadership N/A)
 *
 * When Leadership is not applicable, weights become:
 * - Tier: 34.3%, Recognition: 28.6%, Community: 17.1%, Commitment: 20%
 */
export interface ActivityScoreBreakdown {
  /**
   * TIER ASSESSMENT (0-10 scale, 30% weight)
   * Using Sara Harberson's 4-tier framework
   * - 9-10: Tier 1 - National/international recognition, <1% achievement
   * - 7-8: Tier 2 - State/regional recognition with meaningful impact
   * - 4-6: Tier 3 - School/local recognition with commitment
   * - 1-3: Tier 4 - Participation without distinction
   */
  tierAssessment: TierAssessmentComponent;

  /**
   * RECOGNITION LEVEL (0-10 scale, 25% weight)
   * External validation and awards
   * - 9-10: International/national recognition (Olympics, national competitions)
   * - 7-8: State-level recognition (state champion, All-State)
   * - 5-6: Regional/district recognition
   * - 3-4: School-level recognition
   * - 1-2: Informal or no recognition
   */
  recognitionLevel: RecognitionComponent;

  /**
   * LEADERSHIP & IMPACT (0-10 scale, 12.5% weight when applicable)
   * Role and quantifiable change created
   * NOTE: Set isApplicable=false for solo/individual activities
   *
   * - 9-10: Founder/president with measurable community-wide impact
   * - 7-8: Executive with clear organizational contributions
   * - 5-6: Team lead or active contributor with measurable impact
   * - 3-4: Participant with minor leadership moments
   * - 1-2: Passive member, no leadership
   */
  leadershipImpact: LeadershipComponent;

  /**
   * COMMUNITY & CHARACTER (0-10 scale, 15% weight)
   * Character traits and community value demonstrated
   *
   * - 9-10: Activity clearly benefits others, shows remarkable character
   * - 7-8: Genuine community contribution, strong character traits
   * - 5-6: Some benefit to others, positive character signals
   * - 3-4: Primarily self-focused but not negative
   * - 1-2: Appears as resume padding, no character depth
   */
  communityCharacter: CommunityCharacterComponent;

  /**
   * COMMITMENT & PROGRESSION (0-10 scale, 17.5% weight, can increase)
   * Time invested and growth over time
   *
   * - 9-10: 3+ years, dramatic growth in responsibility, sustained through junior year
   * - 7-8: 2-3 years with clear progression and deepening engagement
   * - 5-6: 1-2 years, steady and consistent involvement
   * - 3-4: <1 year but meaningful intensity
   * - 1-2: One-time or declining involvement
   */
  commitmentProgression: CommitmentComponent;

  /**
   * Weight configuration used for this activity
   * Varies based on whether leadership component is applicable
   */
  weightConfig: {
    tierWeight: number;
    recognitionWeight: number;
    leadershipWeight: number;
    communityWeight: number;
    commitmentWeight: number;
    leadershipApplicable: boolean;
  };
}

/**
 * Comparison Benchmarks for an activity
 */
export interface ComparisonBenchmarks {
  /** Example of a similar-tier activity */
  similarTo: string;
  /** Example of a higher-tier activity for comparison */
  above: string;
  /** Example of a lower-tier activity for comparison */
  below: string;
}

/**
 * Complete Activity Score
 */
export interface ActivityScore {
  /** Total score (1-10 scale) */
  total: number;

  /** Detailed breakdown by component */
  breakdown: ActivityScoreBreakdown;

  /** Detailed justification for tier classification */
  tierJustification: string;

  /** Comparison to similar activities */
  comparisonBenchmarks: ComparisonBenchmarks;

  /** Specific paths to improve this activity's score */
  improvementPaths: string[];

  /** Overall rationale for the score */
  overallRationale: string;
}

// ============================================================================
// COMBINED ACTIVITY SCORE
// ============================================================================

/**
 * Complete score rubric for a single activity
 */
export interface ActivityScoreRubric {
  /** Activity identifier */
  activityId: string;

  /** Activity title for reference */
  activityTitle: string;

  /** Description Score (1-10) - How well it's written */
  descriptionScore: DescriptionScore;

  /** Activity Score (1-10) - How good the activity is */
  activityScore: ActivityScore;

  /**
   * Combined Score (1-10)
   * Weighted combination of description and activity scores
   * Formula: (activityScore × 0.7) + (descriptionScore × 0.3)
   * Activity quality matters more, but presentation still counts
   */
  combinedScore: {
    total: number;
    formula: string;
    rationale: string;
  };

  /** Quick summary for this activity */
  summary: {
    /** One-line assessment */
    oneLiner: string;
    /** Top strength */
    topStrength: string;
    /** Top priority improvement */
    topImprovement: string;
  };
}

// ============================================================================
// PORTFOLIO SCORE TYPES (1-10)
// ============================================================================

/**
 * Portfolio Score Component
 */
export interface PortfolioScoreComponent {
  /** Score for this component (1-10 scale) */
  score: number;
  /** Maximum possible score */
  maxScore: 10;
  /** Explanation of why this score was assigned */
  rationale: string;
}

/**
 * Portfolio Score Breakdown
 *
 * Assesses the extracurriculars section as a whole.
 */
export interface PortfolioScoreBreakdown {
  /**
   * TIER DISTRIBUTION (1-10)
   * Quality distribution of activities across tiers
   * - 10: Multiple Tier 1 activities
   * - 8-9: Tier 1 + strong Tier 2s
   * - 6-7: Strong Tier 2s, some Tier 1
   * - 4-5: Mostly Tier 3
   * - 2-3: Mostly Tier 3/4
   * - 1: All Tier 4
   */
  tierDistribution: PortfolioScoreComponent;

  /**
   * SPIKE DETECTION (1-10)
   * Presence and strength of a focused area of depth
   * - 10: Clear, mature spike with national recognition
   * - 8-9: Developing spike with regional recognition
   * - 6-7: Emerging spike visible
   * - 4-5: Hint of focus but not developed
   * - 2-3: Scattered, no clear focus
   * - 1: Completely random activities
   */
  spikeDetection: PortfolioScoreComponent;

  /**
   * COHERENCE (1-10)
   * Do activities tell a unified story?
   * - 10: Perfect narrative thread connecting all activities
   * - 8-9: Strong theme with 1-2 outliers
   * - 6-7: Theme visible but some disconnect
   * - 4-5: Weak connections
   * - 2-3: Random collection
   * - 1: Contradictory activities
   */
  coherence: PortfolioScoreComponent;

  /**
   * MAJOR ALIGNMENT (1-10)
   * How well activities support intended major
   * - 10: Perfect alignment with competitive depth
   * - 8-9: Strong alignment
   * - 6-7: Good alignment with gaps
   * - 4-5: Partial alignment
   * - 2-3: Weak alignment
   * - 1: No alignment
   */
  majorAlignment: PortfolioScoreComponent;

  /**
   * PRESENTATION QUALITY (1-10)
   * Average quality of descriptions across activities
   * Derived from individual description scores
   */
  presentationQuality: PortfolioScoreComponent;
}

/**
 * Competitive Positioning Assessment
 *
 * PRESENTATION GUIDANCE:
 * - The numeric `rating` (1-6) is kept for internal computation and backward compatibility
 * - USER-FACING presentation should use the DESCRIPTIVE LABEL from `description`
 * - Present as a TIER NAME (e.g., "Outstanding") NOT as a number (e.g., "2/6")
 * - The description derives from the 1-10 portfolio score as a qualitative label
 *
 * Example: Instead of showing "Harvard Scale: 2/6", show "Competitive Tier: Outstanding (top 5%)"
 */
export interface HarvardScaleAssessment {
  /**
   * Internal rating for computation (1 = best, 6 = worst)
   * IMPORTANT: Do NOT present this as "X/6" to users. Use the description instead.
   */
  rating: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Descriptive tier label (USE THIS for user-facing presentation):
   * - "Exceptional (top 1%)" - National/international distinction
   * - "Outstanding (top 5%)" - Strong regional/state impact
   * - "Good (top 15%)" - Meaningful local/school impact
   * - "Average (top 40%)" - Solid participation
   * - "Below Average" - Limited engagement
   * - "Weak" - Minimal activity
   */
  description: string;

  /** Detailed rationale for this tier assignment */
  rationale: string;
}

/**
 * Portfolio Narrative Assessment
 */
export interface PortfolioNarrative {
  /** Student archetype (innovator, leader, scholar, etc.) */
  archetype: string;

  /** The story this portfolio tells in 2-3 sentences */
  storyLine: string;

  /** Two-sentence pitch for admissions */
  twoSentencePitch: string;

  /** What makes this student unique */
  differentiators: string[];

  /** What's common/expected given their profile */
  commonalities: string[];
}

/**
 * Competitive Context Assessment
 */
export interface CompetitiveContext {
  /** Overall competitiveness assessment */
  assessment: string;

  /** How well suited for target schools */
  targetSchoolFit: string;

  /** What sets this student apart */
  differentiators: string[];

  /** What's typical/expected */
  commonalities: string[];

  /** What other similar applicants might have that this student lacks */
  competitiveGaps: string[];
}

/**
 * Complete Portfolio Score Rubric
 */
export interface PortfolioScoreRubric {
  /** Overall portfolio score (1-10) */
  overallScore: {
    /** Total score */
    total: number;
    /** Confidence in this assessment */
    confidence: number;
    /** Formula used to calculate */
    formula: string;
    /** Overall rationale */
    rationale: string;
  };

  /** Harvard 1-6 scale equivalent */
  harvardScale: HarvardScaleAssessment;

  /** Breakdown by component */
  breakdown: PortfolioScoreBreakdown;

  /** Portfolio narrative assessment */
  narrative: PortfolioNarrative;

  /** Competitive context */
  competitiveContext: CompetitiveContext;

  /** Key strengths of the portfolio */
  keyStrengths: string[];

  /** Key gaps or weaknesses */
  keyGaps: string[];

  /** Prioritized recommendations */
  prioritizedRecommendations: {
    priority: 1 | 2 | 3;
    recommendation: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];

  /** All individual activity scores */
  activityScores: ActivityScoreRubric[];

  /** Metadata */
  metadata: {
    scoredAt: string;
    modelUsed: string;
    totalActivities: number;
    averageDescriptionScore: number;
    averageActivityScore: number;
  };
}

// ============================================================================
// SCORE LEVEL DEFINITIONS (for reference in prompts)
// ============================================================================

/**
 * Description Score Level Definitions
 */
export const DESCRIPTION_SCORE_LEVELS = {
  10: 'Perfect - Specific, quantified, impactful, authentic voice, maximizes every character',
  9: 'Excellent - Minor room for improvement but highly effective',
  8: 'Very Good - Strong but missing 1-2 elements',
  7: 'Good - Solid but could be more specific or quantified',
  6: 'Above Average - Gets the point across but somewhat generic',
  5: 'Average - Basic description, lacks specificity',
  4: 'Below Average - Vague, passive, unclear impact',
  3: 'Poor - Very generic, could describe anyone',
  2: 'Very Poor - Confusing, problematic, or misleading',
  1: 'Minimal - Essentially empty or harmful',
} as const;

/**
 * Activity Score Level Definitions
 */
export const ACTIVITY_SCORE_LEVELS = {
  10: 'Exceptional (Tier 1+) - National/international recognition, top 0.1%',
  9: 'Outstanding (Tier 1) - National recognition, top 1%',
  8: 'Excellent (Tier 1-2) - State champion level, strong leadership',
  7: 'Very Good (Tier 2) - Regional recognition, significant impact',
  6: 'Good (Tier 2-3) - School leadership with meaningful contribution',
  5: 'Above Average (Tier 3) - Active participant with some distinction',
  4: 'Average (Tier 3-4) - Regular participation, limited distinction',
  3: 'Below Average (Tier 4) - Minimal engagement or impact',
  2: 'Poor (Tier 4) - One-time or superficial involvement',
  1: 'Minimal - Padding or questionable authenticity',
} as const;

/**
 * Portfolio Score Level Definitions
 */
export const PORTFOLIO_SCORE_LEVELS = {
  10: 'Exceptional - Multiple Tier 1 activities, clear spike, perfect coherence',
  9: 'Outstanding - Tier 1 activity + strong Tier 2s, developing spike',
  8: 'Excellent - Strong Tier 2s, emerging spike, good coherence',
  7: 'Very Good - Mix of Tier 2/3, theme visible but not dominant',
  6: 'Good - Solid Tier 3s with 1-2 standouts, some coherence',
  5: 'Average - Mostly Tier 3, no clear spike, scattered',
  4: 'Below Average - Mostly Tier 3/4, no distinction',
  3: 'Poor - Mostly Tier 4, resume padding visible',
  2: 'Very Poor - No meaningful engagement',
  1: 'Minimal - Essentially no activities',
} as const;

/**
 * Competitive Positioning Tier Definitions
 *
 * These are DESCRIPTIVE LABELS derived from the 1-10 portfolio score.
 * Present these as tier NAMES (e.g., "Outstanding - Top 5%"), NOT as numeric ratings (e.g., "2/6").
 */
export const HARVARD_SCALE_DEFINITIONS = {
  1: 'Exceptional (top 1%): National/international distinction, recruited athlete, published research',
  2: 'Outstanding (top 5%): State champion, significant regional impact, clear spike',
  3: 'Good (top 15%): School leader, meaningful local impact, developing focus',
  4: 'Average (top 40%): Active participant, solid commitment, limited distinction',
  5: 'Below Average: Limited engagement, scattered activities, no clear impact',
  6: 'Weak: Minimal meaningful activity, possible padding',
} as const;

/**
 * Activity Tier Name Definitions (Sara Harberson framework)
 *
 * Use these DESCRIPTIVE NAMES for user-facing presentation instead of "Tier 1", "Tier 2", etc.
 */
export const ACTIVITY_TIER_NAMES = {
  1: 'Elite (National/International Recognition)',
  2: 'Highly Competitive (State/Regional Recognition)',
  3: 'Competitive (School/Local Leadership)',
  4: 'Participant (Solid Engagement)',
} as const;

/**
 * Helper function to get tier name for user-facing display
 * @param tier - The numeric tier (1-4, lower = better)
 * @returns Descriptive tier name
 */
export function getTierName(tier: 1 | 2 | 3 | 4): string {
  return ACTIVITY_TIER_NAMES[tier];
}

// ============================================================================
// DECOMPOSED SCORING ARCHITECTURE TYPES
// Internal types for the 4-phase scoring pipeline.
// These are internal to the scoring layer — downstream consumers use the
// existing types above (ActivityScore, ActivityScoreBreakdown, etc.)
// ============================================================================

/**
 * Internal 6-tier classification (more granular than external 4-tier).
 * Used by the tier classifier to constrain scoring ranges.
 */
export type InternalTier = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * External 4-tier for backward compatibility with 50+ files.
 * Maps from the 6-tier internal classification.
 */
export type ExternalTier = 1 | 2 | 3 | 4;

/**
 * Internal tier name definitions (6-tier system)
 */
export const INTERNAL_TIER_NAMES: Record<InternalTier, string> = {
  1: 'Pinnacle (International/National Elite)',
  2: 'National (National-Level Distinction)',
  3: 'State/Regional (State/Regional Impact)',
  4: 'School Leader (Strong School-Level)',
  5: 'Active Participant (Committed Participation)',
  6: 'Developing (Minimal Engagement)',
} as const;

/**
 * Score range constraints per internal tier.
 * Non-overlapping bands — a Tier 4 activity scores 4.0-5.4, never 5.5+.
 * This is the structural guarantee that makes miscalibration impossible.
 */
export const TIER_SCORE_RANGES: Record<InternalTier, { min: number; max: number }> = {
  1: { min: 9.0, max: 10.0 },  // 1.0 band — pinnacle is narrow by definition
  2: { min: 7.0, max: 8.9 },   // 1.9 band — national distinction
  3: { min: 5.5, max: 6.9 },   // 1.4 band — state/regional impact
  4: { min: 4.0, max: 5.4 },   // 1.4 band — school standout
  5: { min: 2.5, max: 3.9 },   // 1.4 band — active participant
  6: { min: 1.0, max: 2.4 },   // 1.4 band — developing
} as const;

/**
 * Per-component score constraints for each internal tier.
 * Recognition is tightly constrained because it IS the tier definition.
 * Community and Commitment have wider ranges because they partially transcend tier.
 */
export const TIER_COMPONENT_CONSTRAINTS: Record<InternalTier, {
  recognition: { min: number; max: number };
  leadership: { min: number; max: number };
  community: { min: number; max: number };
  commitment: { min: number; max: number };
}> = {
  1: { recognition: { min: 8, max: 10 }, leadership: { min: 7, max: 10 }, community: { min: 6, max: 10 }, commitment: { min: 7, max: 10 } },
  2: { recognition: { min: 6, max: 9 },  leadership: { min: 5, max: 9 },  community: { min: 4, max: 9 },  commitment: { min: 5, max: 9 } },
  3: { recognition: { min: 3, max: 7 },  leadership: { min: 3, max: 7 },  community: { min: 3, max: 8 },  commitment: { min: 3, max: 8 } },
  4: { recognition: { min: 2, max: 5 },  leadership: { min: 2, max: 5 },  community: { min: 2, max: 6 },  commitment: { min: 2, max: 7 } },
  5: { recognition: { min: 1, max: 3 },  leadership: { min: 1, max: 3 },  community: { min: 1, max: 5 },  commitment: { min: 1, max: 5 } },
  6: { recognition: { min: 1, max: 2 },  leadership: { min: 1, max: 2 },  community: { min: 1, max: 3 },  commitment: { min: 1, max: 3 } },
} as const;

/**
 * Mapping from 6 internal tiers to 4 external tiers for backward compatibility.
 */
export const INTERNAL_TO_EXTERNAL_TIER: Record<InternalTier, ExternalTier> = {
  1: 1, // Pinnacle → Elite
  2: 1, // National → Elite
  3: 2, // State/Regional → Highly Competitive
  4: 3, // School Leader → Competitive
  5: 3, // Active Participant → Competitive
  6: 4, // Developing → Participant
} as const;

/**
 * Tier score for the tierAssessment.score component, computed deterministically
 * from internal tier + number of matching signals.
 */
export const TIER_ASSESSMENT_SCORES: Record<InternalTier, { base: number; strong: number }> = {
  1: { base: 9.5, strong: 10.0 },  // 2 signals → 9.5, 3+ → 10.0
  2: { base: 7.5, strong: 8.5 },   // 2 signals → 7.5, 3+ → 8.5
  3: { base: 6.0, strong: 6.5 },   // 2 signals → 6.0, 3+ → 6.5
  4: { base: 4.5, strong: 5.0 },   // 2 signals → 4.5, 3+ → 5.0
  5: { base: 3.0, strong: 3.5 },   // 1 signal → 3.0, 2+ → 3.5
  6: { base: 1.5, strong: 2.0 },   // default → 1.5, 1 signal → 2.0
} as const;

/**
 * Structured evidence extracted from activity description and metadata.
 * Contains ONLY facts — no judgments, no scores, no tiers.
 * Produced by Phase 1 (Evidence Extraction via Haiku).
 */
export interface ExtractedEvidence {
  /** What scope does this activity operate at? */
  scope: {
    level: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international';
    confidence: number;  // 0-1, how clearly stated
    evidence: string;    // The text that supports this classification
  };

  /** All recognitions/awards mentioned or implied */
  recognitions: Array<{
    name: string;
    level: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international';
    isVerifiable: boolean;  // Is this a known, real award/competition?
    selectivityContext?: string; // "top 500 of 300K" if extractable
  }>;

  /** Role and leadership signals */
  role: {
    title: string;
    type: 'founder' | 'president_captain' | 'executive' | 'team_lead' | 'contributor' | 'participant' | 'member';
    isLeadershipApplicable: boolean;  // false for solo research, individual competitions, etc.
    evidence: string;
  };

  /** Quantified impact */
  impact: {
    hasQuantifiedOutcomes: boolean;
    metrics: Array<{
      value: string;
      unit: string;
      context: string;
      isVerifiable: boolean;
    }>;
    estimatedPeopleReached: number | null;
    tangibleOutcomes: string[];
  };

  /** Commitment signals */
  commitment: {
    yearsActive: number;
    hoursPerWeek: number;
    weeksPerYear: number;
    showsProgression: boolean;
    progressionArc: string | null;  // "member → captain → mentor" if detectable
    sustainedThroughJunior: boolean;
  };

  /** Character and community signals */
  character: {
    primaryTrait: 'service' | 'innovation' | 'resilience' | 'curiosity' | 'empathy' | 'discipline' | 'creativity' | 'integrity';
    communityBenefit: 'significant' | 'moderate' | 'minimal' | 'self-focused';
    authenticitySignals: string[];   // Specific details that suggest genuine engagement
    paddingSignals: string[];        // Red flags suggesting resume inflation
  };

  /** Category match from benchmarks library */
  categoryMatch: {
    category: string;                // Key from BENCHMARKS_BY_CATEGORY
    confidence: 'high' | 'medium' | 'low';
  };

  /** Raw extraction confidence — how much useful signal was in the description */
  overallSignalStrength: 'strong' | 'moderate' | 'weak';
}

/**
 * A signal that contributed to (or failed to contribute to) a tier classification.
 * Used for transparency and debugging — every classification can be explained
 * by listing which rules fired.
 */
export interface TierSignal {
  /** Rule identifier, e.g., "T1_NATIONAL_RECOGNITION" */
  rule: string;
  /** Whether this signal matched */
  matched: boolean;
  /** What specific evidence triggered or failed this rule */
  evidence: string;
  /** How strong this signal is (0-1) */
  weight: number;
}

/**
 * Complete tier classification result from the deterministic classifier.
 * Produced by Phase 2 (Tier Classification — pure code, no LLM).
 */
export interface TierClassification {
  /** Internal 6-tier classification (used for score constraints) */
  internalTier: InternalTier;

  /** External 4-tier mapping (for ActivityScore.breakdown.tierAssessment.tier) */
  externalTier: ExternalTier;

  /** How confident we are in this classification */
  confidence: 'high' | 'medium' | 'low';

  /** Which rules triggered this tier */
  signals: TierSignal[];

  /** Valid TOTAL score range — Phase 3 output MUST fall within this band */
  scoreRange: { min: number; max: number };

  /** Per-component score constraints for Phase 3 */
  componentConstraints: {
    recognition: { min: number; max: number };
    leadership: { min: number; max: number };
    community: { min: number; max: number };
    commitment: { min: number; max: number };
  };

  /** The tierAssessment.score (0-10) derived deterministically from tier + signal strength */
  tierScore: number;

  /** Human-readable explanation of why this tier was assigned */
  reasoning: string;
}
