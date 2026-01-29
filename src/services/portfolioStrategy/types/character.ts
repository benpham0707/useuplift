/**
 * Character Assessment Types
 *
 * Comprehensive type definitions for evaluating the 7 character dimensions
 * that elite colleges value most. Based on research from Section 4 of the
 * research database (Applicant Qualities That Impress Admissions Officers).
 *
 * The 7 Dimensions (research-backed):
 * 1. Intellectual Vitality - genuine curiosity and love of learning
 * 2. Leadership & Impact - ability to inspire and create change
 * 3. Character & Integrity - moral compass and ethical behavior
 * 4. Resilience & Growth - overcoming challenges, learning from failure
 * 5. Community Contribution - giving back, making others better
 * 6. Authenticity & Voice - genuine self-expression, unique perspective
 * 7. Future Potential - trajectory, ambition, what they'll contribute
 *
 * Each dimension is scored on the Harvard 1-6 scale.
 */

import { HarvardScore } from './scoring';

// ============================================================================
// CHARACTER DIMENSION TYPES
// ============================================================================

/**
 * The 7 character dimensions
 */
export type CharacterDimension =
  | 'intellectual_vitality'
  | 'leadership_impact'
  | 'character_integrity'
  | 'resilience_growth'
  | 'community_contribution'
  | 'authenticity_voice'
  | 'future_potential';

/**
 * Individual dimension assessment
 */
export interface DimensionAssessment {
  dimension: CharacterDimension;
  harvardScore: HarvardScore;
  scoreConfidence: number; // 0-100

  // Evidence supporting the score
  evidence: {
    source: 'academic' | 'activity' | 'award' | 'essay' | 'context' | 'recommendation';
    description: string;
    strength: 'strong' | 'moderate' | 'weak';
  }[];

  // Narrative assessment
  assessment: {
    summary: string;
    strengths: string[];
    concerns: string[];
    uniqueAspects: string[];
  };

  // Comparison context
  competitiveContext: {
    percentileEstimate: number;
    comparisonPool: string; // e.g., "T20 applicants"
    standoutFactors: string[];
  };

  // Growth trajectory
  trajectory: {
    direction: 'accelerating' | 'stable' | 'declining' | 'emerging';
    evidence: string;
    potential: string;
  };
}

// ============================================================================
// DIMENSION-SPECIFIC RUBRICS
// ============================================================================

/**
 * Intellectual Vitality assessment criteria
 * "What does this person love to learn about?"
 */
export interface IntellectualVitalityAssessment extends DimensionAssessment {
  dimension: 'intellectual_vitality';

  indicators: {
    // Curiosity markers
    selfDirectedLearning: {
      present: boolean;
      examples: string[];
      depth: 'profound' | 'substantial' | 'moderate' | 'surface';
    };

    // Academic engagement beyond requirements
    academicBeyondRequirements: {
      present: boolean;
      examples: string[];
      consistency: 'sustained' | 'periodic' | 'rare';
    };

    // Intellectual risk-taking
    intellectualRiskTaking: {
      present: boolean;
      examples: string[];
      outcome: 'successful' | 'learning_from_failure' | 'still_exploring';
    };

    // Cross-disciplinary connections
    crossDisciplinary: {
      present: boolean;
      connections: string[];
      innovation: string;
    };

    // Research/creative output
    intellectualOutput: {
      hasOutput: boolean;
      type: 'research' | 'creative' | 'entrepreneurial' | 'other';
      significance: string;
    };
  };

  // Stanford's "intellectual vitality" question essence
  stanfordTest: {
    passesTest: boolean;
    whatExcitesThem: string;
    depthOfEngagement: string;
  };
}

/**
 * Leadership & Impact assessment criteria
 */
export interface LeadershipImpactAssessment extends DimensionAssessment {
  dimension: 'leadership_impact';

  indicators: {
    // Leadership style
    leadershipStyle: {
      primary: 'visionary' | 'servant' | 'collaborative' | 'entrepreneurial' | 'quiet';
      evidence: string[];
      effectiveness: string;
    };

    // Scale of impact
    impactScale: {
      level: 'national' | 'regional' | 'local' | 'organizational' | 'team';
      quantifiedImpact: string;
      sustainability: 'lasting' | 'temporary' | 'unclear';
    };

    // Initiative vs. positional leadership
    initiativeVsPositional: {
      initiated: number; // Count of things they started
      positional: number; // Count of elected/appointed positions
      ratio: number;
      assessment: string;
    };

    // Influence on others
    influenceOnOthers: {
      present: boolean;
      examples: string[];
      scope: 'many' | 'some' | 'few';
    };

    // Problem-solving leadership
    problemSolvingLeadership: {
      present: boolean;
      problemsAddressed: string[];
      outcomes: string[];
    };
  };

  // Harvard's "room full of leaders" test
  harvardLeaderTest: {
    standsOut: boolean;
    uniqueContribution: string;
    wouldBeNoticed: string;
  };
}

/**
 * Character & Integrity assessment criteria
 */
export interface CharacterIntegrityAssessment extends DimensionAssessment {
  dimension: 'character_integrity';

  indicators: {
    // Moral compass
    moralCompass: {
      demonstrated: boolean;
      examples: string[];
      consistency: string;
    };

    // Ethical decision-making
    ethicalDecisionMaking: {
      evidenced: boolean;
      situations: string[];
      outcomes: string[];
    };

    // Treatment of others
    treatmentOfOthers: {
      caring: boolean;
      respectful: boolean;
      inclusive: boolean;
      evidence: string[];
    };

    // Accountability
    accountability: {
      takesResponsibility: boolean;
      admitsMistakes: boolean;
      evidence: string[];
    };

    // Consistency of values
    valueConsistency: {
      statedValues: string[];
      demonstratedValues: string[];
      alignment: 'strong' | 'moderate' | 'weak' | 'unclear';
    };
  };

  // "Good roommate" test
  roommateTest: {
    passesTest: boolean;
    expectedContribution: string;
    concerns: string[];
  };
}

/**
 * Resilience & Growth assessment criteria
 */
export interface ResilienceGrowthAssessment extends DimensionAssessment {
  dimension: 'resilience_growth';

  indicators: {
    // Adversity overcome
    adversityOvercome: {
      present: boolean;
      nature: 'severe' | 'moderate' | 'minor' | 'none';
      response: string;
      growth: string;
    };

    // Learning from failure
    learningFromFailure: {
      demonstrated: boolean;
      failures: string[];
      lessons: string[];
      application: string;
    };

    // Growth mindset
    growthMindset: {
      evidenced: boolean;
      examples: string[];
      progression: string;
    };

    // Adaptability
    adaptability: {
      demonstrated: boolean;
      situations: string[];
      outcomes: string[];
    };

    // Persistence
    persistence: {
      demonstrated: boolean;
      longTermCommitments: string[];
      throughDifficulty: string[];
    };
  };

  // Growth trajectory analysis
  growthTrajectory: {
    startingPoint: string;
    currentState: string;
    trajectory: 'steep_upward' | 'steady_upward' | 'plateau' | 'variable';
    narrativePower: string;
  };
}

/**
 * Community Contribution assessment criteria
 */
export interface CommunityContributionAssessment extends DimensionAssessment {
  dimension: 'community_contribution';

  indicators: {
    // Service orientation
    serviceOrientation: {
      genuine: boolean;
      sustained: boolean;
      depth: 'transformative' | 'significant' | 'moderate' | 'surface';
      evidence: string[];
    };

    // Impact on community
    communityImpact: {
      hasImpact: boolean;
      scope: 'broad' | 'focused' | 'limited';
      measurable: boolean;
      metrics: string[];
    };

    // Empathy demonstration
    empathyDemonstration: {
      evidenced: boolean;
      situations: string[];
      responses: string[];
    };

    // Collaborative spirit
    collaborativeSpirit: {
      demonstrated: boolean;
      examples: string[];
      role: 'facilitator' | 'contributor' | 'supporter';
    };

    // Making others better
    makingOthersBetter: {
      demonstrated: boolean;
      howHelped: string[];
      longtermImpact: string;
    };
  };

  // Campus contribution prediction
  campusContributionPrediction: {
    likelyContributions: string[];
    uniquelyPositioned: string;
    communityFit: string;
  };
}

/**
 * Authenticity & Voice assessment criteria
 */
export interface AuthenticityVoiceAssessment extends DimensionAssessment {
  dimension: 'authenticity_voice';

  indicators: {
    // Genuine self-expression
    selfExpression: {
      authentic: boolean;
      unique: boolean;
      consistent: boolean;
      evidence: string[];
    };

    // Distinctive perspective
    distinctivePerspective: {
      hasUniquePOV: boolean;
      whatMakesUnique: string;
      howDemonstrated: string[];
    };

    // Willingness to be different
    willingnessToBeDifferent: {
      demonstrated: boolean;
      examples: string[];
      courage: string;
    };

    // Self-awareness
    selfAwareness: {
      demonstrated: boolean;
      understandsStrengths: boolean;
      understandsWeaknesses: boolean;
      evidence: string[];
    };

    // Cultural/personal identity integration
    identityIntegration: {
      embracesBackground: boolean;
      integrates: boolean;
      enriches: string;
    };
  };

  // "Would we remember this person?" test
  memorabilityTest: {
    memorable: boolean;
    whatStandsOut: string;
    uniqueQualities: string[];
  };
}

/**
 * Future Potential assessment criteria
 */
export interface FuturePotentialAssessment extends DimensionAssessment {
  dimension: 'future_potential';

  indicators: {
    // Trajectory direction
    trajectoryDirection: {
      direction: 'accelerating' | 'linear' | 'plateau' | 'variable';
      evidence: string[];
      prediction: string;
    };

    // Ambition clarity
    ambitionClarity: {
      hasVision: boolean;
      vision: string;
      feasibility: 'realistic' | 'ambitious' | 'unclear';
      steps: string[];
    };

    // Field contribution potential
    fieldContributionPotential: {
      field: string;
      likelyContribution: string;
      uniqueAngle: string;
    };

    // Network/platform building
    networkBuilding: {
      hasStarted: boolean;
      assets: string[];
      leverage: string;
    };

    // "In 10 years" projection
    tenYearProjection: {
      likelyPath: string;
      ceilingPotential: string;
      differentiators: string[];
    };
  };

  // Alumni potential
  alumniPotential: {
    likelyToGiveBack: boolean;
    contributionType: 'financial' | 'mentorship' | 'advocacy' | 'achievement' | 'mixed';
    confidenceLevel: 'high' | 'moderate' | 'uncertain';
  };
}

// ============================================================================
// COMPLETE CHARACTER ASSESSMENT
// ============================================================================

/**
 * Complete character assessment output
 */
export interface CharacterAssessment {
  // Metadata
  assessedAt: string;
  version: string;

  // Overall character strength
  overallCharacterScore: HarvardScore;
  overallConfidence: number;
  characterTier: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'concerning';

  // Individual dimension scores
  dimensionScores: {
    intellectualVitality: IntellectualVitalityAssessment;
    leadershipImpact: LeadershipImpactAssessment;
    characterIntegrity: CharacterIntegrityAssessment;
    resilienceGrowth: ResilienceGrowthAssessment;
    communityContribution: CommunityContributionAssessment;
    authenticityVoice: AuthenticityVoiceAssessment;
    futurePotential: FuturePotentialAssessment;
  };

  // Dimension rankings
  dimensionRankings: {
    dimension: CharacterDimension;
    rank: number;
    score: HarvardScore;
    standout: boolean;
  }[];

  // Character profile
  characterProfile: {
    primaryStrength: CharacterDimension;
    secondaryStrength: CharacterDimension;
    areaForGrowth: CharacterDimension;
    uniqueCombination: string;
    narrativeEssence: string;
  };

  // Synthesized insights
  synthesizedInsights: {
    headline: string;
    oneLineSummary: string;
    paragraph: string;
    keyStrengths: string[];
    keyConcerns: string[];
    uniqueQualities: string[];
    admissionsNarrative: string;
  };

  // School-specific character fit
  schoolCharacterFit: Record<string, {
    schoolId: string;
    characterFitScore: number;
    alignedDimensions: CharacterDimension[];
    mismatchedDimensions: CharacterDimension[];
    fitNarrative: string;
  }>;

  // Evidence summary
  evidenceSummary: {
    strongestEvidence: string[];
    gapsInEvidence: string[];
    recommendedEssayTopics: string[];
    recommendedLetterContent: string[];
  };

  // Recommendations
  recommendations: {
    immediate: string[];
    essayFocus: string[];
    interviewPrep: string[];
    additionalEvidence: string[];
  };
}

// ============================================================================
// CHARACTER SCORING RUBRIC CONSTANTS
// ============================================================================

/**
 * Character dimension weights (sum to 100)
 */
export const CHARACTER_DIMENSION_WEIGHTS: Record<CharacterDimension, number> = {
  intellectual_vitality: 18,
  leadership_impact: 16,
  character_integrity: 15,
  resilience_growth: 14,
  community_contribution: 13,
  authenticity_voice: 12,
  future_potential: 12,
};

/**
 * Harvard score descriptors for character
 */
export const CHARACTER_SCORE_DESCRIPTORS: Record<HarvardScore, string> = {
  1: 'Exceptional - Among the most impressive we encounter. Clear evidence of outstanding character across multiple dimensions with national-level impact.',
  2: 'Excellent - Well above typical strong applicant. Multiple dimensions of strength with significant, documented impact.',
  3: 'Good - Solid character profile. Clear strengths in several dimensions with credible evidence.',
  4: 'Adequate - Meets expectations but lacks distinguishing features. Limited evidence of exceptional character.',
  5: 'Below Average - Gaps in character evidence or concerning patterns. Limited positive indicators.',
  6: 'Concerning - Significant red flags or absence of positive character indicators.',
};
