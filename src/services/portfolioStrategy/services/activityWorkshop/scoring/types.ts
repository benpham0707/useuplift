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
 */
export interface TierAssessmentComponent extends ActivityScoreComponent {
  /** Sara Harberson tier classification */
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
 * Harvard 1-6 Scale Equivalent
 */
export interface HarvardScaleAssessment {
  /** Harvard rating (1 = best, 6 = worst) */
  rating: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Description of what this rating means:
   * 1: Exceptional (top 1%) - National/international distinction
   * 2: Outstanding (top 5%) - Strong regional/state impact
   * 3: Good (top 15%) - Meaningful local/school impact
   * 4: Average (top 40%) - Solid participation
   * 5: Below Average - Limited engagement
   * 6: Weak - Minimal activity
   */
  description: string;

  /** Detailed rationale for this rating */
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
 * Harvard Scale Definitions
 */
export const HARVARD_SCALE_DEFINITIONS = {
  1: 'Exceptional (top 1%): National/international distinction, recruited athlete, published research',
  2: 'Outstanding (top 5%): State champion, significant regional impact, clear spike',
  3: 'Good (top 15%): School leader, meaningful local impact, developing focus',
  4: 'Average (top 40%): Active participant, solid commitment, limited distinction',
  5: 'Below Average: Limited engagement, scattered activities, no clear impact',
  6: 'Weak: Minimal meaningful activity, possible padding',
} as const;
