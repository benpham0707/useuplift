/**
 * Award Tier Classification Engine
 *
 * Implements the Sara Harberson 4-tier classification system with
 * context modifiers for geographic, demographic, and timing calibration.
 *
 * Based on Section 2.1 research: Tier Classification System
 *
 * Tier Framework:
 * - Tier 1: <2% acceptance OR <500 recipients nationally (Exceptional)
 * - Tier 2: 1-5% acceptance OR 500-5,000 recipients (Outstanding)
 * - Tier 3: 5-15% acceptance (Strong)
 * - Tier 4: 15-50% or merit threshold (Baseline)
 *
 * @module awardTierEngine
 */

import { AwardRecognitionLevel, AwardSelectivity, AwardCategory } from '../types/awards';
import {
  AwardTier,
  TIER_POINTS,
  TIER_CLASSIFICATION_RULES,
  AwardContextAssessment,
  GeographicModifier,
  DemographicModifier,
  TimingModifier,
  COMPETITIVE_STATES,
  EnhancedAwardInput,
  EnhancedKnownAwardProfile,
  ResearchCitation,
} from '../types/awardsEnhanced';
import { awardKnowledgeBase } from '../knowledge/awardKnowledgeBase';

// ============================================================================
// TIER CLASSIFICATION RULES
// ============================================================================

/**
 * Recognition level to base tier mapping
 */
const RECOGNITION_TO_TIER: Record<AwardRecognitionLevel, AwardTier> = {
  international: 1,
  national: 2,
  regional: 3,
  state: 3,
  district: 4,
  school: 4,
  local: 4,
};

/**
 * Selectivity to tier mapping
 */
const SELECTIVITY_TO_TIER: Record<AwardSelectivity, AwardTier> = {
  highly_selective: 1,
  selective: 2,
  competitive: 3,
  merit_based: 4,
  participation: 4,
};

/**
 * Volume adjustment thresholds
 * Even selective awards get downgraded if recipient count is high
 */
const VOLUME_ADJUSTMENTS: { maxRecipients: number; tierAdjustment: number }[] = [
  { maxRecipients: 100, tierAdjustment: 0 }, // No adjustment
  { maxRecipients: 500, tierAdjustment: 0 }, // Still Tier 1 eligible
  { maxRecipients: 2000, tierAdjustment: 0.5 }, // Slight adjustment
  { maxRecipients: 5000, tierAdjustment: 1 }, // Full tier down
  { maxRecipients: 20000, tierAdjustment: 1.5 }, // Tier and a half down
  { maxRecipients: Infinity, tierAdjustment: 2 }, // Two tiers down
];

// ============================================================================
// TIER CLASSIFICATION ENGINE
// ============================================================================

/**
 * Award Tier Classification Engine
 */
export class AwardTierEngine {
  constructor() {}

  // ============================================================================
  // MAIN CLASSIFICATION METHOD
  // ============================================================================

  /**
   * Classify an award into the 4-tier system with context modifiers
   */
  classifyAward(
    award: EnhancedAwardInput,
    studentContext?: {
      state?: string;
      isFirstGen?: boolean;
      isLowIncome?: boolean;
      isRural?: boolean;
    }
  ): AwardContextAssessment {
    // Step 1: Get base tier from known database or heuristics
    const baseTier = this.determineBaseTier(award);

    // Step 2: Apply context modifiers
    const geographic = this.getGeographicModifier(award.state || studentContext?.state);
    const demographic = this.getDemographicModifiers(studentContext);
    const timing = this.getTimingModifier(award);

    // Step 3: Calculate adjusted tier
    let adjustedTier = baseTier;

    // Apply geographic modifier
    if (geographic && this.isGeographicallyRelevant(award)) {
      adjustedTier -= geographic.modifier; // Negative modifier means better (lower tier number)
    }

    // Apply demographic modifiers
    for (const mod of demographic) {
      adjustedTier -= mod.modifier;
    }

    // Apply timing modifier
    adjustedTier -= timing.modifier;

    // Clamp adjusted tier to valid range
    adjustedTier = Math.max(1, Math.min(4, adjustedTier));

    // Round to effective tier
    const effectiveTier = Math.round(adjustedTier) as AwardTier;

    // Generate narrative
    const contextNarrative = this.generateContextNarrative(
      baseTier,
      effectiveTier,
      geographic,
      demographic,
      timing
    );

    return {
      geographic,
      demographic,
      timing,
      baseTier,
      adjustedTier,
      effectiveTier,
      contextNarrative,
    };
  }

  // ============================================================================
  // BASE TIER DETERMINATION
  // ============================================================================

  /**
   * Determine base tier from known database or heuristics
   */
  private determineBaseTier(award: EnhancedAwardInput): AwardTier {
    // First, check known awards database
    const knownAward = awardKnowledgeBase.lookupAward(award.name);
    if (knownAward) {
      // Known awards already have tier calibrated based on research
      // Don't apply volume adjustment as that would double-count selectivity
      return knownAward.tier;
    }

    // Fall back to heuristic classification
    return this.classifyHeuristically(award);
  }

  /**
   * Heuristic tier classification for unknown awards
   */
  private classifyHeuristically(award: EnhancedAwardInput): AwardTier {
    // Start with recognition level mapping
    const recognitionTier = RECOGNITION_TO_TIER[award.recognitionLevel];

    // Get selectivity info if available
    let baseTier = recognitionTier; // Default to recognition-based tier
    if (award.selectivityInfo) {
      const selectivityTier = this.parseSelectivityInfo(award.selectivityInfo);
      // Only override if selectivity info indicates a BETTER (lower) tier
      // Don't let absence of selectivity info upgrade the award
      baseTier = Math.min(recognitionTier, selectivityTier);
    }

    // Also analyze description for selectivity signals
    if (award.description) {
      const descriptionResult = this.parseDescriptionForSelectivity(award.description);
      if (descriptionResult.forced) {
        // Forced tier from description overrides everything (e.g., volunteer hours = Tier 4)
        baseTier = descriptionResult.tier;
      } else {
        // Use description tier if it provides better (lower tier) info than current
        baseTier = Math.min(baseTier, descriptionResult.tier);
      }
    }

    // Apply competition size adjustment if available
    if (award.competitionSize) {
      const volumeAdjustment = this.calculateVolumeAdjustment(award.competitionSize);
      baseTier = Math.min(4, baseTier + volumeAdjustment) as AwardTier;
    }

    // Category-specific adjustments
    baseTier = this.applyCategoryAdjustment(baseTier, award.category);

    return baseTier;
  }

  /**
   * Parse description for selectivity signals
   * Descriptions often contain valuable context about achievement level
   * Returns { tier, forced } where forced=true means this tier overrides recognition level
   */
  private parseDescriptionForSelectivity(description: string): { tier: AwardTier; forced: boolean } {
    const descLower = description.toLowerCase();

    // FIRST: Check for definitive Tier 4 signals that FORCE downgrade
    // These are participation/hour-based awards that sometimes have misleading names
    const definiteTier4Signals = [
      /\b\d+\+?\s*(?:volunteer\s+)?hours?\b/i, // Hour-based awards
      /\b(?:completing|completed)\s+\d+/i, // "completing 250+" hours
      /\bservice\s+hours?\b/i, // Service hour awards
    ];

    for (const pattern of definiteTier4Signals) {
      if (pattern.test(descLower)) {
        return { tier: 4, forced: true }; // Force Tier 4 regardless of recognition level
      }
    }

    // Check for numeric selectivity signals in description
    const numericTier = this.parseSelectivityInfo(description);
    if (numericTier < 4) {
      return { tier: numericTier, forced: false }; // Found explicit selectivity data
    }

    // Elite achievement indicators (Tier 1) - VERY selective patterns only
    const tier1Signals = [
      /(?:one of|only)\s*\d{1,2}\s*(?:students?|recipients?|winners?|scholars?)\s*(?:worldwide|globally|internationally)/i,
      /\b(internationally?|globally)\s+(?:ranked|recognized|selected)/i,
      /(?:youngest|first|only)\s+(?:person|student|recipient)\s+(?:to|in)/i,
      /(?:record[- ]?breaking|unprecedented|historic)/i,
      /(?:invited|selected)\s+(?:to|for)\s+(?:present|speak|research)\s+at\s+(?:mit|harvard|stanford|yale|princeton)/i,
      // More restrictive: only Nature/Science/Cell core journals, not "Nature Communications" etc.
      /\bpublished\s+(?:in|by)\s+(?:nature|science|cell|lancet|nejm)\b(?!\s+communications)/i,
      /\bpatent(?:ed|s)?\b/i,
      // International Olympiad medals only (not just any "international" + "gold")
      /\b(?:international|world)\s+(?:olympiad|championship)\s+(?:gold|silver|bronze)\s+medal/i,
      /\b(?:gold|silver|bronze)\s+medal\s+(?:at|in)\s+(?:international|world)\s+(?:olympiad|championship)/i,
      // National Olympiad gold with team selection = Tier 1
      /\bgold\s+medal\b.*\b(?:qualified|team\s+selection|selected\s+for\s+(?:us|usa|national)\s+team)/i,
      /\b(?:qualified|team\s+selection|selected)\s+(?:for|to)\s+(?:us|usa|national)\s+team/i,
    ];

    for (const pattern of tier1Signals) {
      if (pattern.test(descLower)) return { tier: 1, forced: false };
    }

    // Strong achievement indicators (Tier 2)
    const tier2Signals = [
      /\b(?:finalist|semifinalist|runner[- ]?up)\s+(?:in|at|for)\s+(?:national|international)/i,
      // State/regional champion that qualifies for nationals = Tier 2
      /\b(?:state|regional)\s+(?:champion|winner|gold)\b.*\b(?:qualified?|qualif(?:y|ies)|advance[ds]?)\s+(?:for|to)\s+(?:national|nationals)/i,
      /(?:selected|chosen)\s+(?:from|among)\s+(?:hundreds|thousands)/i,
      /\b(?:top\s+(?:5|10|15|20|25))\s*%/i,
      /(?:fully[- ]?funded|merit[- ]?based)\s+scholarship/i,
      /\bresearch(?:ed)?\s+(?:at|with)\s+(?:university|lab|institute)/i,
      /\bco[- ]?author(?:ed)?\s+(?:paper|publication|study)/i,
      // National champion in junior/niche divisions = Tier 2
      /\bnational\s+champion\b.*\b(?:junior|youth|teen|high\s+school)/i,
      // Top N at world/international level (not top 1-5 which would be Tier 1)
      /\b(?:top|placed?)\s+(?:[1-9]\d|[5-9]0)\s*(?:at|in)?\s*(?:world|international)/i,
      // Publication in academic journals (not top-tier)
      /\bpublished\s+(?:in|by)\s+(?:peer[- ]?reviewed|academic|journal)/i,
    ];

    for (const pattern of tier2Signals) {
      if (pattern.test(descLower)) return { tier: 2, forced: false };
    }

    // State champion without national qualification = Tier 3 (handled by recognition level)
    // BUT if they mention qualifying for nationals, caught by Tier 2 above

    // Moderate achievement indicators (Tier 3)
    const tier3Signals = [
      /\b(?:state|regional)\s+(?:champion|winner|gold)\b/i, // State champion (no national qual) = Tier 3
      /\b(?:state|regional|district)\s+(?:level|competition|finalist)/i,
      /\b(?:honorable\s+mention|merit\s+award)/i,
      /\b(?:qualified|advanced)\s+(?:to|for)\s+(?:state|regional)/i,
      /\b(?:top\s+(?:30|40|50))\s*%/i,
      /\b(?:leadership|captain|president|founder)\s+(?:of|for)/i,
      /\b(?:varsity|jv|junior\s+varsity)\s+(?:team|squad)/i,
      // District/local winners (not just participation)
      /\bwon\s+(?:the\s+)?(?:district|local|regional|congressional)/i,
      /\b(?:district|local)\s+(?:winner|champion)/i,
    ];

    for (const pattern of tier3Signals) {
      if (pattern.test(descLower)) return { tier: 3, forced: false };
    }

    // Participation/basic indicators (Tier 4)
    const tier4Signals = [
      /\b(?:participant|participated|attended|member)\b/i,
      /\b(?:completed|finished|certificate\s+of)\b/i,
      /\b(?:school|local|community)\s+(?:level|award|recognition)\b/i,
    ];

    for (const pattern of tier4Signals) {
      if (pattern.test(descLower)) return { tier: 4, forced: false };
    }

    // Default: don't override based on description if no clear signals
    return { tier: 4, forced: false };
  }

  /**
   * Parse selectivity info string to determine tier
   */
  private parseSelectivityInfo(info: string): AwardTier {
    const infoLower = info.toLowerCase();

    // Look for percentage patterns
    const percentMatch = infoLower.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      if (percent < 2) return 1;
      if (percent < 5) return 2;
      if (percent < 15) return 3;
      return 4;
    }

    // Look for "top X" patterns (but not "top X-Y" which is placement, not count)
    // Match "top 100" but not "top 1-2" or "top 1st"
    const topMatch = infoLower.match(/top\s*(\d+)(?!\s*[-–]|\s*(st|nd|rd|th))/);
    if (topMatch) {
      const topN = parseInt(topMatch[1]);
      // Only use if the number seems like a count, not a placement
      // "Top 3" is likely a placement, "Top 100" is likely a count
      if (topN >= 10) {
        if (topN <= 100) return 1;
        if (topN <= 500) return 2;
        if (topN <= 2000) return 3;
        return 4;
      }
    }

    // Look for "X of Y" patterns (including "X from over Y", "X out of Y+")
    const ofMatch = infoLower.match(/(\d+)\s*(?:finalists?|recipients?|winners?|scholars?|students?|selected)?\s*(?:of|out of|from)\s*(?:over|more than|nearly)?\s*(\d[\d,]*)/);
    if (ofMatch) {
      const selected = parseInt(ofMatch[1]);
      const total = parseInt(ofMatch[2].replace(/,/g, ''));
      const rate = (selected / total) * 100;
      if (rate < 2) return 1;
      if (rate < 5) return 2;
      if (rate < 15) return 3;
      return 4;
    }

    // Keywords
    if (infoLower.includes('highly selective') || infoLower.includes('elite')) return 1;
    if (infoLower.includes('selective') || infoLower.includes('competitive')) return 2;
    if (infoLower.includes('merit') || infoLower.includes('qualified')) return 3;

    // Default to Tier 4 when selectivity cannot be determined
    // Unknown selectivity should never upgrade an award
    return 4;
  }

  /**
   * Calculate volume adjustment based on recipient count
   */
  private calculateVolumeAdjustment(recipientCount: number): number {
    for (const threshold of VOLUME_ADJUSTMENTS) {
      if (recipientCount <= threshold.maxRecipients) {
        return threshold.tierAdjustment;
      }
    }
    return 2; // Max adjustment
  }

  /**
   * Apply volume adjustment to known award tier
   */
  private applyVolumeAdjustment(baseTier: AwardTier, annualRecipients: number): AwardTier {
    const adjustment = this.calculateVolumeAdjustment(annualRecipients);
    return Math.min(4, Math.round(baseTier + adjustment)) as AwardTier;
  }

  /**
   * Apply category-specific tier adjustments
   */
  private applyCategoryAdjustment(tier: AwardTier, category: AwardCategory): AwardTier {
    // Some categories have inherent tier constraints
    const categoryMaxTier: Partial<Record<AwardCategory, AwardTier>> = {
      academic_honor: 3, // Academic honors rarely truly Tier 1
      standardized_test: 2, // Test-based awards capped at Tier 2
      participation: 4, // Participation is always Tier 4
    };

    const maxTier = categoryMaxTier[category];
    if (maxTier && tier < maxTier) {
      return maxTier;
    }

    return tier;
  }

  // ============================================================================
  // CONTEXT MODIFIERS
  // ============================================================================

  /**
   * Get geographic modifier for a state
   */
  private getGeographicModifier(state?: string): GeographicModifier | null {
    if (!state) return null;

    const stateUpper = state.toUpperCase();
    const modifier = COMPETITIVE_STATES[stateUpper] || COMPETITIVE_STATES['DEFAULT'];

    return modifier;
  }

  /**
   * Check if award is geographically relevant (state-level or below)
   */
  private isGeographicallyRelevant(award: EnhancedAwardInput): boolean {
    const geoRelevantLevels: AwardRecognitionLevel[] = ['state', 'regional', 'district', 'local'];
    return geoRelevantLevels.includes(award.recognitionLevel);
  }

  /**
   * Get demographic modifiers
   */
  private getDemographicModifiers(context?: {
    isFirstGen?: boolean;
    isLowIncome?: boolean;
    isRural?: boolean;
  }): DemographicModifier[] {
    const modifiers: DemographicModifier[] = [];

    if (!context) return modifiers;

    if (context.isFirstGen) {
      modifiers.push({
        factor: 'first_gen',
        modifier: 0.25,
        explanation: 'First-generation student achievements weighted for context',
      });
    }

    if (context.isLowIncome) {
      modifiers.push({
        factor: 'low_income',
        modifier: 0.25,
        explanation: 'Low-income background considered in achievement evaluation',
      });
    }

    if (context.isRural) {
      modifiers.push({
        factor: 'rural',
        modifier: 0.25,
        explanation: 'Rural area with limited opportunities considered',
      });
    }

    return modifiers;
  }

  /**
   * Get timing modifier based on when award was received
   */
  private getTimingModifier(award: EnhancedAwardInput): TimingModifier {
    const awardDate = new Date(award.dateReceived);
    const currentYear = new Date().getFullYear();
    const awardYear = awardDate.getFullYear();
    const gradeLevel = award.gradeLevel;

    // Awards earned earlier carry more weight
    if (gradeLevel <= 9) {
      return {
        pattern: 'early_achiever',
        modifier: 0.25,
        explanation: 'Award earned early in high school demonstrates sustained excellence',
      };
    }

    if (gradeLevel === 12 && awardYear === currentYear) {
      return {
        pattern: 'late_bloomer',
        modifier: -0.25,
        explanation: 'Senior year award may be viewed with less weight than earlier achievements',
      };
    }

    return {
      pattern: 'natural_progression',
      modifier: 0,
      explanation: 'Award timing appears natural in academic progression',
    };
  }

  // ============================================================================
  // NARRATIVE GENERATION
  // ============================================================================

  /**
   * Generate context narrative explaining tier classification
   */
  private generateContextNarrative(
    baseTier: AwardTier,
    effectiveTier: AwardTier,
    geographic: GeographicModifier | null,
    demographic: DemographicModifier[],
    timing: TimingModifier
  ): string {
    const parts: string[] = [];

    // Base tier explanation
    const tierLabels: Record<AwardTier, string> = {
      1: 'Exceptional (Tier 1)',
      2: 'Outstanding (Tier 2)',
      3: 'Strong (Tier 3)',
      4: 'Baseline (Tier 4)',
    };

    parts.push(`Base classification: ${tierLabels[baseTier]}.`);

    // Context adjustments
    if (baseTier !== effectiveTier) {
      const adjustments: string[] = [];

      if (geographic && geographic.modifier !== 0) {
        adjustments.push(geographic.explanation);
      }

      for (const mod of demographic) {
        adjustments.push(mod.explanation);
      }

      if (timing.modifier !== 0) {
        adjustments.push(timing.explanation);
      }

      if (adjustments.length > 0) {
        parts.push(`Context adjustments: ${adjustments.join('; ')}.`);
        parts.push(`Effective classification: ${tierLabels[effectiveTier]}.`);
      }
    }

    return parts.join(' ');
  }

  // ============================================================================
  // BATCH CLASSIFICATION
  // ============================================================================

  /**
   * Classify multiple awards with shared context
   */
  classifyAwards(
    awards: EnhancedAwardInput[],
    studentContext?: {
      state?: string;
      isFirstGen?: boolean;
      isLowIncome?: boolean;
      isRural?: boolean;
    }
  ): Map<string, AwardContextAssessment> {
    const results = new Map<string, AwardContextAssessment>();

    for (const award of awards) {
      results.set(award.id, this.classifyAward(award, studentContext));
    }

    return results;
  }

  /**
   * Calculate tier summary statistics
   */
  calculateTierSummary(classifications: Map<string, AwardContextAssessment>): {
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    tier4Count: number;
    totalPoints: number;
    averageTier: number;
    distribution: string;
  } {
    let tier1Count = 0;
    let tier2Count = 0;
    let tier3Count = 0;
    let tier4Count = 0;
    let totalPoints = 0;

    for (const assessment of classifications.values()) {
      switch (assessment.effectiveTier) {
        case 1:
          tier1Count++;
          break;
        case 2:
          tier2Count++;
          break;
        case 3:
          tier3Count++;
          break;
        case 4:
          tier4Count++;
          break;
      }
      totalPoints += TIER_POINTS[assessment.effectiveTier];
    }

    const totalCount = tier1Count + tier2Count + tier3Count + tier4Count;
    const averageTier = totalCount > 0 ? totalPoints / totalCount : 0;

    // Generate distribution description
    let distribution: string;
    if (tier1Count >= 2) {
      distribution = 'Exceptional portfolio with multiple elite recognitions';
    } else if (tier1Count >= 1 || tier2Count >= 3) {
      distribution = 'Strong portfolio with notable achievements';
    } else if (tier2Count >= 1 || tier3Count >= 3) {
      distribution = 'Solid portfolio with good regional/state recognition';
    } else {
      distribution = 'Developing portfolio, primarily school-level recognition';
    }

    return {
      tier1Count,
      tier2Count,
      tier3Count,
      tier4Count,
      totalPoints,
      averageTier,
      distribution,
    };
  }

  // ============================================================================
  // RESEARCH CITATIONS
  // ============================================================================

  /**
   * Get research citations for tier classification
   */
  getTierClassificationCitations(): ResearchCitation[] {
    return [
      {
        sourceId: 'sec2.1.1',
        module: '2.1_TIER_CLASSIFICATION_SYSTEM',
        section: 'Sara Harberson Framework',
        quote: 'Awards follow the same 4-tier system as activities, with selectivity being the primary determinant.',
        relevance: 'primary',
      },
      {
        sourceId: 'sec2.1.2',
        module: '2.1_TIER_CLASSIFICATION_SYSTEM',
        section: 'Selectivity Thresholds',
        quote: 'Tier 1: <2% acceptance rate OR <500 recipients nationally',
        relevance: 'primary',
      },
      {
        sourceId: 'sec2.1.3',
        module: '2.1_TIER_CLASSIFICATION_SYSTEM',
        section: 'Context Modifiers',
        quote: 'Geographic and demographic context modifies award assessment just as it does for activities.',
        relevance: 'supporting',
      },
    ];
  }

  /**
   * Get admissions impact description for a tier
   */
  getAdmissionsImpact(tier: AwardTier): {
    impact: 'major' | 'moderate' | 'minor';
    description: string;
  } {
    const impacts: Record<
      AwardTier,
      { impact: 'major' | 'moderate' | 'minor'; description: string }
    > = {
      1: {
        impact: 'major',
        description:
          'Can significantly differentiate candidate. May "tip" borderline applications.',
      },
      2: {
        impact: 'moderate',
        description: 'Strong differentiator that strengthens application. Demonstrates excellence.',
      },
      3: {
        impact: 'minor',
        description: 'Supports narrative but not distinctive alone. Expected among competitive applicants.',
      },
      4: {
        impact: 'minor',
        description:
          'Baseline credential. Absence might be noted; presence does not differentiate.',
      },
    };

    return impacts[tier];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const awardTierEngine = new AwardTierEngine();
