/**
 * Red Flag Detection Types
 *
 * Comprehensive type definitions for identifying and categorizing application
 * red flags across 4 severity tiers. Based on research from the admissions
 * databases regarding what concerns admissions officers.
 *
 * Red Flag Severity Tiers:
 * - Tier 1 (Critical): Immediate disqualification risks - fraud, plagiarism, serious integrity issues
 * - Tier 2 (Severe): Significant concerns that require strong mitigation - major inconsistencies
 * - Tier 3 (Moderate): Notable issues that may hurt application - gaps, inflation
 * - Tier 4 (Minor): Small concerns worth addressing - typos, weak explanations
 *
 * Score Deductions (from Universal Holistic Score):
 * - Tier 1: -2.0 to -3.0 (potentially fatal)
 * - Tier 2: -1.0 to -1.5 (serious damage)
 * - Tier 3: -0.5 to -0.75 (noticeable impact)
 * - Tier 4: -0.1 to -0.25 (minor penalty)
 */

import { HarvardScore } from './scoring';

// ============================================================================
// RED FLAG CLASSIFICATION
// ============================================================================

/**
 * Red flag severity tiers
 */
export type RedFlagSeverity = 1 | 2 | 3 | 4;

/**
 * Red flag categories
 */
export type RedFlagCategory =
  // Integrity Issues
  | 'fraud_fabrication'           // Made-up activities, fake awards
  | 'plagiarism'                   // Copied content
  | 'misrepresentation'           // Exaggerated or misleading claims
  | 'application_duplication'     // Same essays/content submitted elsewhere

  // Inconsistencies
  | 'internal_inconsistency'      // Profile contradicts itself
  | 'external_inconsistency'      // Profile contradicts public information
  | 'timeline_inconsistency'      // Dates don't add up
  | 'verification_failure'        // Claims that can't be verified

  // Character Concerns
  | 'disciplinary_issues'         // School/legal disciplinary history
  | 'social_media_concerns'       // Problematic online presence
  | 'recommendation_concerns'     // Negative signals from recommenders
  | 'interview_concerns'          // Poor interview performance

  // Academic Issues
  | 'grade_manipulation'          // Suspicious grade patterns
  | 'course_load_concerns'        // Avoiding rigor
  | 'testing_irregularities'      // Score cancellations, irregularities

  // Activity Issues
  | 'activity_inflation'          // Exaggerated hours/impact
  | 'fake_organization'           // Non-existent or shell organizations
  | 'hour_impossibility'          // Claimed hours mathematically impossible
  | 'role_exaggeration'           // Inflated leadership claims

  // Essay/Writing Issues
  | 'essay_assistance_suspected'  // AI/ghostwriting suspected
  | 'style_inconsistency'         // Writing style varies suspiciously
  | 'content_mismatch'            // Essay claims don't match profile

  // Contextual Red Flags
  | 'privilege_unawareness'       // Tone-deaf about advantages
  | 'victim_without_growth'       // Using adversity without showing growth
  | 'entitlement_signals'         // Entitled attitude showing through

  // Application Strategy Issues
  | 'no_demonstrated_interest'    // No engagement with schools requiring it
  | 'generic_application'         // No customization for school
  | 'school_list_mismatch'        // Profile doesn't match target schools

  // Other
  | 'other';

/**
 * Red flag detection confidence
 */
export type DetectionConfidence = 'high' | 'medium' | 'low';

// ============================================================================
// INDIVIDUAL RED FLAG TYPES
// ============================================================================

/**
 * Single red flag detection
 */
export interface RedFlag {
  id: string;
  category: RedFlagCategory;
  severity: RedFlagSeverity;
  confidence: DetectionConfidence;

  // Description
  title: string;
  description: string;
  evidenceLocation: string; // Where in the application this was found

  // Evidence
  evidence: {
    finding: string;
    source: string;
    significance: string;
  }[];

  // Impact assessment
  impact: {
    scoreDeduction: number;
    affectedDimensions: string[];
    admissionsImpact: string;
    likelihoodOfDetection: 'certain' | 'likely' | 'possible' | 'unlikely';
  };

  // Mitigation
  mitigation: {
    canBeMitigated: boolean;
    mitigationSteps: string[];
    mitigationEffectiveness: 'full' | 'partial' | 'minimal' | 'none';
    timeRequired: string;
  };

  // Resolution
  resolution: {
    status: 'unresolved' | 'in_progress' | 'resolved' | 'cannot_resolve';
    notes: string;
    resolvedAt?: string;
  };
}

// ============================================================================
// CATEGORY-SPECIFIC RED FLAG TYPES
// ============================================================================

/**
 * Fraud/Fabrication red flag details
 */
export interface FraudFabricationFlag extends RedFlag {
  category: 'fraud_fabrication';

  fraudDetails: {
    type: 'activity' | 'award' | 'research' | 'organization' | 'other';
    claimedItem: string;
    verificationAttempt: string;
    verificationResult: string;
    certaintyLevel: 'definite' | 'highly_likely' | 'suspected';
  };
}

/**
 * Activity inflation red flag details
 */
export interface ActivityInflationFlag extends RedFlag {
  category: 'activity_inflation';

  inflationDetails: {
    activityName: string;
    claimedHours: number;
    estimatedActualHours: number;
    inflationRatio: number;
    claimedImpact: string;
    likelyActualImpact: string;
    detectionMethod: string;
  };
}

/**
 * Essay assistance suspected red flag details
 */
export interface EssayAssistanceFlag extends RedFlag {
  category: 'essay_assistance_suspected';

  assistanceDetails: {
    essayId: string;
    suspicionType: 'ai_generated' | 'ghostwritten' | 'heavily_edited' | 'professional_help';
    indicators: string[];
    styleAnalysis: {
      vocabularyLevel: string;
      sentenceComplexity: string;
      matchesOtherWriting: boolean;
    };
    certaintyLevel: 'definite' | 'highly_likely' | 'suspected' | 'possible';
  };
}

/**
 * Internal inconsistency red flag details
 */
export interface InternalInconsistencyFlag extends RedFlag {
  category: 'internal_inconsistency';

  inconsistencyDetails: {
    location1: string;
    claim1: string;
    location2: string;
    claim2: string;
    contradiction: string;
    possibleExplanation: string;
    likelyIntentional: boolean;
  };
}

/**
 * Hour impossibility red flag details
 */
export interface HourImpossibilityFlag extends RedFlag {
  category: 'hour_impossibility';

  impossibilityDetails: {
    activities: {
      name: string;
      claimedHoursPerWeek: number;
      claimedWeeksPerYear: number;
    }[];
    totalClaimedHours: number;
    availableHours: number;
    surplus: number;
    analysis: string;
  };
}

// ============================================================================
// RED FLAG REPORT
// ============================================================================

/**
 * Complete red flag report
 */
export interface RedFlagReport {
  // Metadata
  analyzedAt: string;
  version: string;

  // Summary
  summary: {
    totalFlags: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
    overallRiskLevel: 'critical' | 'high' | 'moderate' | 'low' | 'minimal';
    totalScoreDeduction: number;
    recommendedAction: 'proceed_with_caution' | 'address_before_submission' | 'major_revision_needed' | 'reconsider_application';
  };

  // All detected flags by severity
  flagsBySeverity: {
    tier1: RedFlag[];
    tier2: RedFlag[];
    tier3: RedFlag[];
    tier4: RedFlag[];
  };

  // All detected flags by category
  flagsByCategory: Record<RedFlagCategory, RedFlag[]>;

  // Critical issues requiring immediate attention
  criticalIssues: {
    flag: RedFlag;
    urgency: 'immediate' | 'before_submission' | 'if_time_allows';
    actionRequired: string;
  }[];

  // Verification recommendations
  verificationRecommendations: {
    item: string;
    verificationType: 'documentation' | 'contact' | 'website' | 'public_record';
    priority: 'high' | 'medium' | 'low';
    howToVerify: string;
  }[];

  // Integrity assessment
  integrityAssessment: {
    overallIntegrity: HarvardScore;
    integrityNarrative: string;
    trustworthiness: 'high' | 'moderate' | 'questionable' | 'concerning';
    recommendationImpact: string;
  };

  // Pattern analysis
  patternAnalysis: {
    patternsDetected: {
      pattern: string;
      flagsInvolved: string[];
      significance: string;
    }[];
    overallPattern: string;
    concernLevel: 'significant' | 'notable' | 'minor' | 'none';
  };

  // Mitigation plan
  mitigationPlan: {
    prioritizedActions: {
      action: string;
      addressesFlags: string[];
      priority: number;
      effort: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
    }[];
    timeline: string;
    successCriteria: string[];
  };

  // School-specific risk assessment
  schoolSpecificRisks: Record<string, {
    schoolId: string;
    riskLevel: 'high' | 'moderate' | 'low';
    specificConcerns: string[];
    mitigationForSchool: string;
  }>;
}

// ============================================================================
// RED FLAG DETECTION CONFIGURATION
// ============================================================================

/**
 * Score deduction constants by severity
 */
export const RED_FLAG_DEDUCTIONS: Record<RedFlagSeverity, { min: number; max: number }> = {
  1: { min: 2.0, max: 3.0 },
  2: { min: 1.0, max: 1.5 },
  3: { min: 0.5, max: 0.75 },
  4: { min: 0.1, max: 0.25 },
};

/**
 * Red flag severity descriptors
 */
export const RED_FLAG_SEVERITY_DESCRIPTORS: Record<RedFlagSeverity, string> = {
  1: 'Critical - Potential disqualification. Fraud, plagiarism, or serious integrity violations that could result in rejection or rescinded admission.',
  2: 'Severe - Significant concern requiring strong mitigation. Major inconsistencies or concerning patterns that will raise serious questions.',
  3: 'Moderate - Notable issue that may hurt application. Gaps, inflation, or concerns that careful readers will notice.',
  4: 'Minor - Small issue worth addressing if time allows. Typos, weak explanations, or minor inconsistencies.',
};

/**
 * Category to severity mapping (default severities)
 */
export const CATEGORY_DEFAULT_SEVERITY: Record<RedFlagCategory, RedFlagSeverity> = {
  fraud_fabrication: 1,
  plagiarism: 1,
  misrepresentation: 2,
  application_duplication: 2,
  internal_inconsistency: 2,
  external_inconsistency: 2,
  timeline_inconsistency: 3,
  verification_failure: 3,
  disciplinary_issues: 2,
  social_media_concerns: 2,
  recommendation_concerns: 2,
  interview_concerns: 2,
  grade_manipulation: 1,
  course_load_concerns: 3,
  testing_irregularities: 2,
  activity_inflation: 3,
  fake_organization: 1,
  hour_impossibility: 2,
  role_exaggeration: 3,
  essay_assistance_suspected: 2,
  style_inconsistency: 3,
  content_mismatch: 3,
  privilege_unawareness: 3,
  victim_without_growth: 3,
  entitlement_signals: 3,
  no_demonstrated_interest: 4,
  generic_application: 4,
  school_list_mismatch: 4,
  other: 4,
};

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Common detection patterns for red flags
 */
export interface DetectionPattern {
  patternId: string;
  name: string;
  description: string;
  category: RedFlagCategory;
  triggers: {
    type: 'keyword' | 'numeric' | 'pattern' | 'comparison' | 'timing';
    specification: string;
    threshold?: number;
  }[];
  confidence: DetectionConfidence;
  falsePositiveRate: 'high' | 'medium' | 'low';
}

/**
 * Hour impossibility detection thresholds
 */
export const HOUR_IMPOSSIBILITY_THRESHOLDS = {
  maxWeeklyHoursTotal: 60, // Maximum reasonable hours per week for all activities
  maxSingleActivityHours: 25, // Maximum reasonable hours for one activity per week
  schoolDayHours: 7, // Hours spent in school
  sleepHours: 7, // Minimum sleep hours
  mealHomeworkHours: 4, // Eating, homework, travel
  availableWeekdayHours: 6, // Hours available on school days
  availableWeekendHours: 12, // Hours available on weekend days
};

/**
 * Activity inflation detection thresholds
 */
export const ACTIVITY_INFLATION_THRESHOLDS = {
  suspiciousInflationRatio: 1.5, // Claimed/expected ratio that triggers review
  clearInflationRatio: 2.0, // Ratio that indicates clear inflation
  typicalClubHours: 3, // Typical hours per week for standard club
  typicalSportHours: 10, // Typical hours per week for varsity sport
  typicalJobHours: 15, // Typical hours per week for part-time job
};
