/**
 * Award Authenticity Detection Engine
 *
 * Implements comprehensive authenticity verification for awards based on
 * Section 2.7 research: paper awards, pay-to-play detection, inflation
 * checking, and cross-validation.
 *
 * Key detection areas:
 * - Pay-to-play organizations (NSHSS, Who's Who, etc.)
 * - Award inflation (title/level/scope exaggeration)
 * - Timing red flags (senior year explosion, suspicious clustering)
 * - Cross-validation with activities, essays, recommendations
 *
 * @module awardAuthenticityEngine
 */

import { AwardCategory } from '../types/awards';
import {
  AwardAuthenticityAssessment,
  PayToPlayDetection,
  AwardInflationCheck,
  TimingRedFlagAssessment,
  CrossValidation,
  RedFlagIndicator,
  RedFlagSeverity,
  EnhancedAwardInput,
  KNOWN_PAY_TO_PLAY,
} from '../types/awardsEnhanced';
import { awardKnowledgeBase } from '../knowledge/awardKnowledgeBase';

// ============================================================================
// AUTHENTICITY DETECTION PATTERNS
// ============================================================================

/**
 * Known legitimate organizations for validation
 */
const LEGITIMATE_ORGANIZATIONS = new Set([
  'mathematical association of america',
  'maa',
  'society for science',
  'college board',
  'national merit scholarship corporation',
  'boy scouts of america',
  'girl scouts of the usa',
  'tournament of champions',
  'national speech and debate association',
  'nsda',
  'scholastic',
  'alliance for young artists & writers',
  'youngarts',
  'national foundation for advancement in the arts',
  'congress',
  'congressional award foundation',
  'usa computing olympiad',
  'usaco',
  'regeneron',
  'intel',
  'siemens',
]);

/**
 * Suspicious organization name patterns
 */
const SUSPICIOUS_PATTERNS = [
  /who'?s who/i,
  /national honor roll/i,
  /international honor/i,
  /youth leadership (forum|conference)/i,
  /global (young )?leaders/i,
  /national society of .* scholars/i,
  /american (youth|student) (foundation|academy)/i,
  /united states achievement/i,
  /distinguished (young |student )?scholars?/i,
  /world scholars/i,
  /ambassador program/i,
];

/**
 * Title inflation patterns
 */
const INFLATION_PATTERNS = {
  titleMismatch: [
    { input: /president/i, requires: /elected|founded|led/i },
    { input: /founder/i, requires: /created|started|established/i },
    { input: /winner/i, requires: /first|champion|top/i },
  ],
  levelExaggeration: [
    { claimed: 'international', actual: /school|local|regional/i },
    { claimed: 'national', actual: /state|regional|school/i },
    { claimed: 'state', actual: /school|local|district/i },
  ],
  scopeInflation: [
    { pattern: /international/i, redFlags: /local|school|club/i },
    { pattern: /nationwide/i, redFlags: /regional|state|chapter/i },
  ],
};

// ============================================================================
// AUTHENTICITY ENGINE CLASS
// ============================================================================

/**
 * Award Authenticity Detection Engine
 */
export class AwardAuthenticityEngine {
  constructor() {}

  // ============================================================================
  // MAIN ASSESSMENT METHOD
  // ============================================================================

  /**
   * Perform comprehensive authenticity assessment for an award
   */
  assessAuthenticity(
    award: EnhancedAwardInput,
    relatedActivities: { activityId: string; activityName: string; category: string }[] = [],
    allAwards: EnhancedAwardInput[] = []
  ): AwardAuthenticityAssessment {
    // Run all authenticity checks
    const payToPlayCheck = this.checkPayToPlay(award);
    const inflationCheck = this.checkInflation(award);
    const timingCheck = this.assessTiming(award, allAwards);
    const crossValidation = this.performCrossValidation(award, relatedActivities);

    // Collect red flags
    const redFlags = this.collectRedFlags(award, payToPlayCheck, inflationCheck, timingCheck);

    // Calculate overall authenticity score
    const authenticityScore = this.calculateAuthenticityScore(
      payToPlayCheck,
      inflationCheck,
      timingCheck,
      crossValidation,
      redFlags
    );

    // Determine risk level and recommendation
    const riskLevel = this.determineRiskLevel(authenticityScore, redFlags);
    const recommendation = this.determineRecommendation(riskLevel, redFlags);

    // Check verification status
    const verificationStatus = this.checkVerificationStatus(award);

    return {
      awardId: award.id,
      awardName: award.name,
      verificationStatus,
      redFlags,
      totalRedFlagScore: this.calculateRedFlagScore(redFlags),
      payToPlayCheck,
      inflationCheck,
      timingCheck,
      crossValidation,
      authenticityScore,
      riskLevel,
      recommendation,
      explanation: this.generateExplanation(riskLevel, redFlags, authenticityScore),
    };
  }

  // ============================================================================
  // PAY-TO-PLAY DETECTION
  // ============================================================================

  /**
   * Check if award is from a pay-to-play organization
   */
  checkPayToPlay(award: EnhancedAwardInput): PayToPlayDetection {
    const orgName = (award.organization || award.name).toLowerCase();
    const awardName = award.name.toLowerCase();

    // Check known pay-to-play list
    const knownPayToPlay = KNOWN_PAY_TO_PLAY.some(
      (org) => orgName.includes(org) || awardName.includes(org)
    );

    // Check suspicious patterns
    const matchesSuspiciousPattern = SUSPICIOUS_PATTERNS.some(
      (pattern) => pattern.test(orgName) || pattern.test(awardName)
    );

    // Check for legitimate organization
    const isLegitimateOrg = LEGITIMATE_ORGANIZATIONS.has(orgName);

    // Analyze indicators
    const indicators = {
      requiresPayment: this.detectPaymentRequirement(award),
      noSelectiveProcess: !this.hasSelectiveProcess(award),
      recentlyFounded: this.checkRecentlyFounded(award),
      noVerifiableWinners: !this.hasVerifiableWinners(award),
      marketingFocused: this.detectMarketingFocus(award),
    };

    // Determine likelihood
    let likelihood: 'confirmed' | 'likely' | 'possible' | 'unlikely';
    if (knownPayToPlay) {
      likelihood = 'confirmed';
    } else if (matchesSuspiciousPattern && indicators.requiresPayment) {
      likelihood = 'likely';
    } else if (
      matchesSuspiciousPattern ||
      (indicators.noSelectiveProcess && indicators.marketingFocused)
    ) {
      likelihood = 'possible';
    } else if (isLegitimateOrg) {
      likelihood = 'unlikely';
    } else {
      likelihood = indicators.noSelectiveProcess ? 'possible' : 'unlikely';
    }

    return {
      indicators,
      knownPayToPlay,
      organizationName: award.organization,
      likelihood,
      explanation: this.generatePayToPlayExplanation(likelihood, indicators, orgName),
    };
  }

  /**
   * Detect if award requires payment to receive
   */
  private detectPaymentRequirement(award: EnhancedAwardInput): boolean {
    const description = (award.description || '').toLowerCase();
    const paymentKeywords = ['membership fee', 'dues', 'pay to join', 'registration fee for honor'];
    return paymentKeywords.some((kw) => description.includes(kw));
  }

  /**
   * Check if award has a selective process
   */
  private hasSelectiveProcess(award: EnhancedAwardInput): boolean {
    // Check against known awards database
    const knownAward = awardKnowledgeBase.lookupAward(award.name);
    if (knownAward) {
      return knownAward.selectivityData.selectionProcess !== '';
    }

    // Heuristic: look for selection indicators
    const description = (award.description || '').toLowerCase();
    const selectionKeywords = [
      'selected',
      'chosen',
      'competitive',
      'audition',
      'application',
      'qualified',
      'top',
      '%',
    ];
    return selectionKeywords.some((kw) => description.includes(kw));
  }

  /**
   * Check if organization was recently founded (red flag)
   */
  private checkRecentlyFounded(award: EnhancedAwardInput): boolean {
    const description = (award.description || '').toLowerCase();
    const recentIndicators = ['founded in 20', 'established 20', 'new organization', 'first annual'];
    return recentIndicators.some((ind) => description.includes(ind));
  }

  /**
   * Check if there are verifiable past winners
   */
  private hasVerifiableWinners(award: EnhancedAwardInput): boolean {
    const knownAward = awardKnowledgeBase.lookupAward(award.name);
    if (knownAward) {
      return knownAward.authenticity.publicResults;
    }
    return award.websiteUrl !== undefined;
  }

  /**
   * Detect marketing-focused language
   */
  private detectMarketingFocus(award: EnhancedAwardInput): boolean {
    const description = (award.description || '').toLowerCase();
    const marketingPhrases = [
      'looks great on',
      'college application',
      'stand out',
      'boost your',
      'exclusive opportunity',
      'limited spots',
      'act now',
    ];
    return marketingPhrases.some((phrase) => description.includes(phrase));
  }

  /**
   * Generate explanation for pay-to-play check
   */
  private generatePayToPlayExplanation(
    likelihood: string,
    indicators: PayToPlayDetection['indicators'],
    orgName: string
  ): string {
    if (likelihood === 'confirmed') {
      return `"${orgName}" is a known pay-to-play organization. Including this award may signal poor judgment to admissions officers.`;
    }
    if (likelihood === 'likely') {
      const issues = [];
      if (indicators.requiresPayment) issues.push('requires payment');
      if (indicators.noSelectiveProcess) issues.push('no clear selection criteria');
      if (indicators.marketingFocused) issues.push('marketing-focused language');
      return `Organization shows pay-to-play indicators: ${issues.join(', ')}.`;
    }
    if (likelihood === 'possible') {
      return 'Some characteristics suggest this may be a non-selective award. Verify selection process.';
    }
    return 'No pay-to-play indicators detected.';
  }

  // ============================================================================
  // INFLATION DETECTION
  // ============================================================================

  /**
   * Check for award inflation (title, level, scope exaggeration)
   */
  checkInflation(award: EnhancedAwardInput): AwardInflationCheck {
    const indicators = {
      titleMismatch: this.detectTitleMismatch(award),
      levelOverclaim: this.detectLevelOverclaim(award),
      scopeExaggeration: this.detectScopeExaggeration(award),
      roleInflation: this.detectRoleInflation(award),
    };

    // Determine severity
    const activeIndicators = Object.values(indicators).filter(Boolean).length;
    let inflationSeverity: AwardInflationCheck['inflationSeverity'];
    if (activeIndicators >= 3) {
      inflationSeverity = 'major';
    } else if (activeIndicators === 2) {
      inflationSeverity = 'moderate';
    } else if (activeIndicators === 1) {
      inflationSeverity = 'minor';
    } else {
      inflationSeverity = 'none';
    }

    // Generate correction suggestion
    const suggestedCorrection = this.generateCorrectionSuggestion(award, indicators);

    return {
      inflationIndicators: indicators,
      inflationSeverity,
      suggestedCorrection,
      explanation: this.generateInflationExplanation(inflationSeverity, indicators),
    };
  }

  /**
   * Detect title mismatch (grand title, modest reality)
   */
  private detectTitleMismatch(award: EnhancedAwardInput): boolean {
    const name = award.name.toLowerCase();
    const description = (award.description || '').toLowerCase();

    // Check for impressive titles without backing
    const impressiveTitles = ['champion', 'winner', 'gold', 'first place', 'grand prize'];
    const hasImpressiveTitle = impressiveTitles.some((title) => name.includes(title));

    if (hasImpressiveTitle) {
      // Should have supporting details
      const supportingDetails = ['competition', 'contest', 'selected', 'awarded', 'qualified'];
      const hasSupport = supportingDetails.some((detail) => description.includes(detail));
      return !hasSupport;
    }

    return false;
  }

  /**
   * Detect level overclaim (claiming national when regional)
   */
  private detectLevelOverclaim(award: EnhancedAwardInput): boolean {
    const name = award.name.toLowerCase();
    const description = (award.description || '').toLowerCase();
    const level = award.recognitionLevel;

    // Check if name claims higher level than input level
    if (name.includes('international') && level !== 'international') return true;
    if (name.includes('national') && !['international', 'national'].includes(level)) return true;

    // Check description for contradictions
    if (name.includes('national') && description.includes('regional chapter')) return true;
    if (name.includes('international') && description.includes('local')) return true;

    return false;
  }

  /**
   * Detect scope exaggeration
   */
  private detectScopeExaggeration(award: EnhancedAwardInput): boolean {
    const name = award.name.toLowerCase();
    const description = (award.description || '').toLowerCase();

    // International claims for local organizations
    if (name.includes('international') || name.includes('global')) {
      const localIndicators = ['school', 'club', 'chapter', 'local'];
      return localIndicators.some((ind) => description.includes(ind));
    }

    return false;
  }

  /**
   * Detect role inflation (participant → winner)
   */
  private detectRoleInflation(award: EnhancedAwardInput): boolean {
    const description = (award.description || '').toLowerCase();

    // Check for participation dressed as winning
    if (description.includes('participant') && award.name.toLowerCase().includes('award')) {
      return true;
    }

    // Check for attendance presented as achievement
    const attendanceWords = ['attended', 'participated', 'member'];
    const achievementWords = ['winner', 'champion', 'award'];
    const hasAttendance = attendanceWords.some((w) => description.includes(w));
    const claimsAchievement = achievementWords.some((w) => award.name.toLowerCase().includes(w));

    return hasAttendance && claimsAchievement;
  }

  /**
   * Generate correction suggestion for inflated awards
   */
  private generateCorrectionSuggestion(
    award: EnhancedAwardInput,
    indicators: AwardInflationCheck['inflationIndicators']
  ): string | undefined {
    if (indicators.levelOverclaim) {
      return `Consider describing as "${award.recognitionLevel}-level" rather than claiming a higher level.`;
    }
    if (indicators.roleInflation) {
      return 'Describe actual role accurately (e.g., "participant" rather than implying winner).';
    }
    if (indicators.scopeExaggeration) {
      return 'Clarify the actual scope of the organization or competition.';
    }
    return undefined;
  }

  /**
   * Generate inflation explanation
   */
  private generateInflationExplanation(
    severity: AwardInflationCheck['inflationSeverity'],
    indicators: AwardInflationCheck['inflationIndicators']
  ): string {
    if (severity === 'none') {
      return 'Award description appears accurate and appropriately represented.';
    }

    const issues = [];
    if (indicators.titleMismatch) issues.push('title may overstate achievement');
    if (indicators.levelOverclaim) issues.push('level claimed exceeds evidence');
    if (indicators.scopeExaggeration) issues.push('scope appears exaggerated');
    if (indicators.roleInflation) issues.push('role may be inflated');

    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} inflation detected: ${issues.join('; ')}.`;
  }

  // ============================================================================
  // TIMING ANALYSIS
  // ============================================================================

  /**
   * Assess timing patterns across awards
   */
  assessTiming(award: EnhancedAwardInput, allAwards: EnhancedAwardInput[]): TimingRedFlagAssessment {
    // Calculate awards per year
    const awardsPerYear: Record<number, number> = {};
    const yearsActive: Set<number> = new Set();

    for (const a of allAwards) {
      const year = new Date(a.dateReceived).getFullYear();
      yearsActive.add(year);
      awardsPerYear[year] = (awardsPerYear[year] || 0) + 1;
    }

    // Detect patterns
    const currentYear = new Date().getFullYear();
    const seniorYear = currentYear; // Assume current year is senior year for analysis
    const seniorYearAwards = awardsPerYear[seniorYear] || 0;

    const patterns = {
      seniorYearExplosion: seniorYearAwards >= 5,
      noEarlyAchievements: !Object.keys(awardsPerYear).some((y) => parseInt(y) < seniorYear - 1),
      suspiciousCompression: this.detectSuspiciousCompression(awardsPerYear),
      naturalProgression: this.detectNaturalProgression(awardsPerYear),
    };

    // Determine trajectory
    let trajectory: TimingRedFlagAssessment['trajectory'];
    if (patterns.seniorYearExplosion && patterns.noEarlyAchievements) {
      trajectory = 'red_flag';
    } else if (patterns.suspiciousCompression) {
      trajectory = 'suspicious';
    } else if (patterns.seniorYearExplosion) {
      trajectory = 'compressed';
    } else {
      trajectory = 'natural';
    }

    return {
      patterns,
      trajectory,
      explanation: this.generateTimingExplanation(trajectory, patterns, awardsPerYear),
      yearsActive: Array.from(yearsActive).sort(),
      awardsPerYear,
    };
  }

  /**
   * Detect suspicious compression of awards
   */
  private detectSuspiciousCompression(awardsPerYear: Record<number, number>): boolean {
    const years = Object.keys(awardsPerYear).map(Number).sort();
    if (years.length < 2) return false;

    const lastYear = years[years.length - 1];
    const lastYearCount = awardsPerYear[lastYear];
    const previousYearsTotal = years
      .slice(0, -1)
      .reduce((sum, y) => sum + (awardsPerYear[y] || 0), 0);

    // Red flag if last year has more than all previous years combined
    return lastYearCount > previousYearsTotal && lastYearCount >= 4;
  }

  /**
   * Detect natural progression in awards
   */
  private detectNaturalProgression(awardsPerYear: Record<number, number>): boolean {
    const years = Object.keys(awardsPerYear).map(Number).sort();
    if (years.length < 3) return true; // Not enough data

    // Check for general upward or stable trend
    let increases = 0;
    let decreases = 0;
    for (let i = 1; i < years.length; i++) {
      const prev = awardsPerYear[years[i - 1]];
      const curr = awardsPerYear[years[i]];
      if (curr > prev) increases++;
      else if (curr < prev) decreases++;
    }

    // Natural if mostly stable or increasing
    return decreases <= 1;
  }

  /**
   * Generate timing explanation
   */
  private generateTimingExplanation(
    trajectory: TimingRedFlagAssessment['trajectory'],
    patterns: TimingRedFlagAssessment['patterns'],
    awardsPerYear: Record<number, number>
  ): string {
    if (trajectory === 'red_flag') {
      return 'Severe timing concern: Large number of awards suddenly appearing in senior year with no earlier achievements suggests possible resume padding or fabrication.';
    }
    if (trajectory === 'suspicious') {
      return 'Suspicious timing pattern: Awards are heavily concentrated in recent period without clear progression.';
    }
    if (trajectory === 'compressed') {
      return 'Note: Many awards in senior year. While possible, this pattern may raise questions during verification.';
    }
    return 'Timing appears natural with expected progression over high school years.';
  }

  // ============================================================================
  // CROSS-VALIDATION
  // ============================================================================

  /**
   * Perform cross-validation with other application components
   */
  performCrossValidation(
    award: EnhancedAwardInput,
    relatedActivities: { activityId: string; activityName: string; category: string }[]
  ): CrossValidation {
    // Check activity alignment
    const activityAlignment = this.checkActivityAlignment(award, relatedActivities);

    // Other validations would require additional context
    // For now, return partial assessment
    return {
      activityAlignment,
      essayMentioned: false, // Would need essay content
      recommenderAware: false, // Would need recommendation data
      schoolProfileSupports: true, // Assume true by default
      overallConsistency: activityAlignment.aligned ? 'high' : 'medium',
    };
  }

  /**
   * Check if award aligns with activities
   */
  private checkActivityAlignment(
    award: EnhancedAwardInput,
    relatedActivities: { activityId: string; activityName: string; category: string }[]
  ): CrossValidation['activityAlignment'] {
    const awardCategory = award.category;
    const awardName = award.name.toLowerCase();

    // Find related activities
    const related = relatedActivities.filter((act) => {
      // Category match
      if (this.categoryMatches(awardCategory, act.category)) return true;
      // Name overlap
      const actNameLower = act.activityName.toLowerCase();
      const awardWords = awardName.split(/\s+/);
      return awardWords.some((word) => word.length > 3 && actNameLower.includes(word));
    });

    // Identify gaps
    const gaps: string[] = [];
    if (related.length === 0) {
      gaps.push(`No activities found that relate to ${award.category} award`);
    }

    return {
      aligned: related.length > 0,
      relatedActivities: related.map((a) => a.activityName),
      gaps,
    };
  }

  /**
   * Check if award category matches activity category
   */
  private categoryMatches(awardCategory: AwardCategory, activityCategory: string): boolean {
    const categoryMap: Record<AwardCategory, string[]> = {
      academic_olympiad: ['academic', 'math', 'science', 'competition'],
      academic_competition: ['academic', 'quiz', 'competition'],
      science_fair: ['research', 'science', 'fair'],
      research_recognition: ['research', 'science', 'publication'],
      standardized_test: ['academic'],
      academic_honor: ['academic'],
      scholarship: ['academic'],
      arts_competition: ['art', 'music', 'theater', 'creative'],
      athletic: ['sports', 'athletic', 'team'],
      leadership: ['leadership', 'student government', 'club'],
      community_service: ['volunteer', 'service', 'community'],
      entrepreneurship: ['business', 'startup', 'entrepreneur'],
      debate_speech: ['debate', 'speech', 'forensics', 'model un'],
      journalism_writing: ['writing', 'journalism', 'newspaper', 'publication'],
      stem_competition: ['robotics', 'coding', 'engineering', 'tech'],
      summer_program_selection: ['program', 'summer', 'camp'],
      other: [],
    };

    const relatedTerms = categoryMap[awardCategory] || [];
    const actCategoryLower = activityCategory.toLowerCase();
    return relatedTerms.some((term) => actCategoryLower.includes(term));
  }

  // ============================================================================
  // RED FLAG COLLECTION
  // ============================================================================

  /**
   * Collect all red flags from various checks
   */
  private collectRedFlags(
    award: EnhancedAwardInput,
    payToPlay: PayToPlayDetection,
    inflation: AwardInflationCheck,
    timing: TimingRedFlagAssessment
  ): RedFlagIndicator[] {
    const flags: RedFlagIndicator[] = [];

    // Pay-to-play flags
    if (payToPlay.likelihood === 'confirmed') {
      flags.push({
        type: 'pay_to_play_confirmed',
        severity: 'severe',
        description: `Award from known pay-to-play organization: ${payToPlay.organizationName}`,
        evidence: ['Organization on known pay-to-play list'],
        actionRequired: 'reject',
      });
    } else if (payToPlay.likelihood === 'likely') {
      flags.push({
        type: 'pay_to_play_likely',
        severity: 'moderate',
        description: 'Award shows strong pay-to-play indicators',
        evidence: Object.entries(payToPlay.indicators)
          .filter(([, v]) => v)
          .map(([k]) => k),
        actionRequired: 'investigate',
      });
    }

    // Inflation flags
    if (inflation.inflationSeverity === 'major' || inflation.inflationSeverity === 'fabrication') {
      flags.push({
        type: 'major_inflation',
        severity: 'severe',
        description: 'Significant inflation detected in award representation',
        evidence: Object.entries(inflation.inflationIndicators)
          .filter(([, v]) => v)
          .map(([k]) => k),
        actionRequired: 'investigate',
      });
    } else if (inflation.inflationSeverity === 'moderate') {
      flags.push({
        type: 'moderate_inflation',
        severity: 'moderate',
        description: 'Some inflation detected in award representation',
        evidence: Object.entries(inflation.inflationIndicators)
          .filter(([, v]) => v)
          .map(([k]) => k),
        actionRequired: 'note',
      });
    }

    // Timing flags
    if (timing.trajectory === 'red_flag') {
      flags.push({
        type: 'timing_red_flag',
        severity: 'severe',
        description: 'Suspicious timing pattern: sudden senior year explosion with no prior achievements',
        evidence: ['Senior year explosion', 'No early achievements'],
        actionRequired: 'investigate',
      });
    } else if (timing.trajectory === 'suspicious') {
      flags.push({
        type: 'timing_suspicious',
        severity: 'moderate',
        description: 'Unusual timing pattern in award accumulation',
        evidence: ['Compressed timeline'],
        actionRequired: 'note',
      });
    }

    return flags;
  }

  // ============================================================================
  // SCORING AND RISK ASSESSMENT
  // ============================================================================

  /**
   * Calculate overall authenticity score
   */
  private calculateAuthenticityScore(
    payToPlay: PayToPlayDetection,
    inflation: AwardInflationCheck,
    timing: TimingRedFlagAssessment,
    crossValidation: CrossValidation,
    redFlags: RedFlagIndicator[]
  ): number {
    let score = 100;

    // Deduct for pay-to-play
    const payToPlayPenalty: Record<string, number> = {
      confirmed: 80,
      likely: 50,
      possible: 20,
      unlikely: 0,
    };
    score -= payToPlayPenalty[payToPlay.likelihood];

    // Deduct for inflation
    const inflationPenalty: Record<string, number> = {
      fabrication: 60,
      major: 40,
      moderate: 20,
      minor: 10,
      none: 0,
    };
    score -= inflationPenalty[inflation.inflationSeverity];

    // Deduct for timing
    const timingPenalty: Record<string, number> = {
      red_flag: 30,
      suspicious: 15,
      compressed: 5,
      natural: 0,
    };
    score -= timingPenalty[timing.trajectory];

    // Boost for good cross-validation
    if (crossValidation.overallConsistency === 'high') {
      score = Math.min(100, score + 10);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate red flag score
   */
  private calculateRedFlagScore(redFlags: RedFlagIndicator[]): number {
    const severityScores: Record<RedFlagSeverity, number> = {
      severe: 40,
      moderate: 20,
      minor: 10,
    };

    return redFlags.reduce((sum, flag) => sum + severityScores[flag.severity], 0);
  }

  /**
   * Determine risk level from authenticity score and red flags
   */
  private determineRiskLevel(
    authenticityScore: number,
    redFlags: RedFlagIndicator[]
  ): AwardAuthenticityAssessment['riskLevel'] {
    const hasSevereFlag = redFlags.some((f) => f.severity === 'severe');

    if (hasSevereFlag || authenticityScore < 20) return 'severe';
    if (authenticityScore < 40) return 'high';
    if (authenticityScore < 60) return 'medium';
    if (authenticityScore < 80) return 'low';
    return 'none';
  }

  /**
   * Determine recommendation based on risk
   */
  private determineRecommendation(
    riskLevel: AwardAuthenticityAssessment['riskLevel'],
    redFlags: RedFlagIndicator[]
  ): AwardAuthenticityAssessment['recommendation'] {
    const hasRejectFlag = redFlags.some((f) => f.actionRequired === 'reject');
    const hasInvestigateFlag = redFlags.some((f) => f.actionRequired === 'investigate');

    if (hasRejectFlag || riskLevel === 'severe') return 'exclude';
    if (hasInvestigateFlag || riskLevel === 'high') return 'investigate';
    if (riskLevel === 'medium') return 'include_with_caution';
    return 'include';
  }

  /**
   * Check verification status of award
   */
  private checkVerificationStatus(award: EnhancedAwardInput): AwardAuthenticityAssessment['verificationStatus'] {
    const knownAward = awardKnowledgeBase.lookupAward(award.name);

    return {
      isKnownAward: knownAward !== null,
      hasVerifiableResults: knownAward?.authenticity.publicResults ?? award.websiteUrl !== undefined,
      organizationVerified: knownAward !== null || LEGITIMATE_ORGANIZATIONS.has((award.organization || '').toLowerCase()),
      selectionProcessClear: knownAward?.selectivityData.selectionProcess !== undefined,
    };
  }

  /**
   * Generate overall explanation
   */
  private generateExplanation(
    riskLevel: AwardAuthenticityAssessment['riskLevel'],
    redFlags: RedFlagIndicator[],
    authenticityScore: number
  ): string {
    if (riskLevel === 'severe') {
      const severeFlags = redFlags.filter((f) => f.severity === 'severe');
      return `Severe authenticity concerns: ${severeFlags.map((f) => f.description).join('; ')}. Recommend excluding from application.`;
    }
    if (riskLevel === 'high') {
      return `High authenticity risk (score: ${authenticityScore}/100). Multiple concerning indicators detected. Recommend verification or removal.`;
    }
    if (riskLevel === 'medium') {
      return `Moderate authenticity concerns (score: ${authenticityScore}/100). Some indicators warrant attention but award may be legitimate.`;
    }
    if (riskLevel === 'low') {
      return `Minor authenticity notes (score: ${authenticityScore}/100). Generally appears legitimate with minor considerations.`;
    }
    return `Award appears authentic (score: ${authenticityScore}/100). No significant concerns detected.`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const awardAuthenticityEngine = new AwardAuthenticityEngine();
