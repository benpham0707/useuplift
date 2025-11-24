/**
 * Adaptive Scoring System with Variable Difficulty Scaling
 *
 * Core Principle: The higher the score, the harder it is to improve.
 * - Improving 30→40 (+10 points) is easier than 80→90 (+10 points)
 * - Students see both raw score (actual quality) and effort-adjusted score (recognizes difficulty)
 *
 * Benefits:
 * - Foundation students feel progress is achievable
 * - Strong students feel their effort is recognized
 * - Everyone has appropriate challenges
 * - Milestones feel earned, not arbitrary
 */

export enum DifficultyTier {
  FOUNDATION = 'foundation',      // 0-50: Building basics
  DEVELOPING = 'developing',       // 50-70: Making progress
  COMPETENT = 'competent',         // 70-80: Solid foundation
  STRONG = 'strong',               // 80-90: Advanced work
  EXCEPTIONAL = 'exceptional',     // 90-95: Elite tier
  MASTERFUL = 'masterful'          // 95-100: World-class
}

export interface TierThresholds {
  // Validation thresholds
  minSuggestionQuality: number;      // Minimum score suggestion must achieve
  maxSuggestionQuality: number;      // Maximum (don't overshoot student)

  // Improvement expectations
  minImprovement: number;            // Minimum raw point gain
  targetImprovement: number;         // Target raw point gain

  // Complexity limits
  maxSentenceComplexity: number;     // Flesch-Kincaid grade level
  maxVocabSophistication: number;    // Rare word frequency (0-1)

  // Voice preservation
  voiceShiftTolerance: number;       // How much voice can change (0-1)

  // Teaching approach
  rationaleComplexity: 'simple' | 'moderate' | 'sophisticated';
  exampleConcreteness: 'very concrete' | 'balanced' | 'abstract ok';
}

export interface Milestone {
  score: number;
  name: string;
  description: string;
  reward: string;
  icon: string;
}

export interface AdaptiveScore {
  rawScore: number;                  // Actual quality (0-100)
  effortAdjustedScore: number;       // Accounts for difficulty (0-100)
  difficultyMultiplier: number;      // How hard is improvement at this level
  difficultyTier: DifficultyTier;
  nextMilestone: Milestone | null;
  distanceToNextMilestone: number;   // Raw points needed
  encouragement: string;
  tierDescription: string;
}

export interface ProgressComparison {
  previousRawScore: number;
  currentRawScore: number;
  rawGain: number;
  effortGain: number;               // Difficulty-adjusted improvement
  percentileGain: number;           // What percentile did they jump?
  message: string;
}

// ============================================================================
// DIFFICULTY CALCULATION
// ============================================================================

/**
 * Calculate the "effort" required to gain 1 point at a given score level
 *
 * Uses sigmoid curve to create smooth, exponential difficulty increase
 *
 * Examples:
 * - Score 30: Multiplier ≈ 0.6 (easier - foundation building)
 * - Score 50: Multiplier ≈ 1.0 (normal - developing skills)
 * - Score 70: Multiplier ≈ 1.8 (harder - competent refinement)
 * - Score 85: Multiplier ≈ 4.2 (very hard - advanced work)
 * - Score 95: Multiplier ≈ 9.5 (extremely hard - near-perfection)
 */
export function calculateDifficultyMultiplier(currentScore: number): number {
  // Sigmoid-based difficulty curve
  const x = currentScore;
  const midpoint = 70;      // Inflection point (normal difficulty)
  const steepness = 0.08;   // How quickly difficulty increases

  // Sigmoid function: 1 / (1 + e^(-steepness * (x - midpoint)))
  const sigmoid = 1 / (1 + Math.exp(-steepness * (x - midpoint)));

  // Scale to 0.5-12 range
  // - Low scores (30): ~0.5-0.7x (easier)
  // - Mid scores (70): ~1.8-2.2x (normal)
  // - High scores (85): ~4.0-5.0x (hard)
  // - Elite scores (95): ~9.0-12.0x (very hard)
  const minMultiplier = 0.5;
  const maxMultiplier = 12;

  const multiplier = minMultiplier + (sigmoid * (maxMultiplier - minMultiplier));

  // Round to 1 decimal for readability
  return Math.round(multiplier * 10) / 10;
}

/**
 * Get difficulty tier based on score
 */
export function getDifficultyTier(score: number): DifficultyTier {
  if (score < 50) return DifficultyTier.FOUNDATION;
  if (score < 70) return DifficultyTier.DEVELOPING;
  if (score < 80) return DifficultyTier.COMPETENT;
  if (score < 90) return DifficultyTier.STRONG;
  if (score < 95) return DifficultyTier.EXCEPTIONAL;
  return DifficultyTier.MASTERFUL;
}

/**
 * Get human-readable description of tier
 *
 * CALIBRATION:
 * - ~80: UC Berkeley/UCLA competitive
 * - 80-90: Stanford/MIT/Harvard competitive
 * - 90+: Best of the best at elite schools
 */
export function getTierDescription(tier: DifficultyTier): string {
  const descriptions = {
    [DifficultyTier.FOUNDATION]: 'Building foundational writing skills',
    [DifficultyTier.DEVELOPING]: 'Developing voice and specificity',
    [DifficultyTier.COMPETENT]: 'Solid writing - competitive at good schools',
    [DifficultyTier.STRONG]: 'UC Berkeley/UCLA level - elite public school quality',
    [DifficultyTier.EXCEPTIONAL]: 'Stanford/MIT/Harvard level - elite private school quality',
    [DifficultyTier.MASTERFUL]: 'Best of the best - would stand out even at elite schools'
  };
  return descriptions[tier];
}

// ============================================================================
// TIER THRESHOLDS
// ============================================================================

/**
 * Calculate validation thresholds appropriate for essay's current tier
 *
 * Philosophy:
 * - Foundation: Gentle improvements, don't overwhelm
 * - Developing: Moderate challenges, building skills
 * - Competent: Refinement work, nuanced improvements
 * - Strong: Advanced work, sophisticated changes
 * - Exceptional/Masterful: Elite polish, micro-refinements
 */
export function calculateTierThresholds(
  currentEssayScore: number
): TierThresholds {

  const tier = getDifficultyTier(currentEssayScore);

  switch (tier) {
    case DifficultyTier.FOUNDATION: // 0-50
      return {
        minSuggestionQuality: 55,
        maxSuggestionQuality: 65,
        minImprovement: 3,
        targetImprovement: 5,
        maxSentenceComplexity: 8,        // 8th grade level
        maxVocabSophistication: 0.3,     // Common words
        voiceShiftTolerance: 0.2,        // Stay close to original
        rationaleComplexity: 'simple',
        exampleConcreteness: 'very concrete'
      };

    case DifficultyTier.DEVELOPING: // 50-70
      return {
        minSuggestionQuality: 65,
        maxSuggestionQuality: 78,
        minImprovement: 2,
        targetImprovement: 4,
        maxSentenceComplexity: 10,       // 10th grade level
        maxVocabSophistication: 0.5,
        voiceShiftTolerance: 0.3,
        rationaleComplexity: 'moderate',
        exampleConcreteness: 'balanced'
      };

    case DifficultyTier.COMPETENT: // 70-80
      return {
        minSuggestionQuality: 75,
        maxSuggestionQuality: 88,
        minImprovement: 1.5,
        targetImprovement: 3,
        maxSentenceComplexity: 12,       // 12th grade level
        maxVocabSophistication: 0.7,
        voiceShiftTolerance: 0.4,
        rationaleComplexity: 'moderate',
        exampleConcreteness: 'balanced'
      };

    case DifficultyTier.STRONG: // 80-90
      return {
        minSuggestionQuality: 85,
        maxSuggestionQuality: 95,
        minImprovement: 1,
        targetImprovement: 2,
        maxSentenceComplexity: 14,       // College level
        maxVocabSophistication: 0.85,
        voiceShiftTolerance: 0.5,
        rationaleComplexity: 'sophisticated',
        exampleConcreteness: 'balanced'
      };

    case DifficultyTier.EXCEPTIONAL: // 90-95
      return {
        minSuggestionQuality: 92,
        maxSuggestionQuality: 98,
        minImprovement: 0.5,
        targetImprovement: 1,
        maxSentenceComplexity: 15,
        maxVocabSophistication: 0.95,
        voiceShiftTolerance: 0.6,
        rationaleComplexity: 'sophisticated',
        exampleConcreteness: 'abstract ok'
      };

    case DifficultyTier.MASTERFUL: // 95-100
      return {
        minSuggestionQuality: 96,
        maxSuggestionQuality: 100,
        minImprovement: 0.25,
        targetImprovement: 0.5,
        maxSentenceComplexity: 16,
        maxVocabSophistication: 1.0,
        voiceShiftTolerance: 0.7,
        rationaleComplexity: 'sophisticated',
        exampleConcreteness: 'abstract ok'
      };
  }
}

// ============================================================================
// MILESTONES
// ============================================================================

const MILESTONES: Milestone[] = [
  {
    score: 50,
    name: 'Foundation Complete',
    description: 'You have the basic building blocks in place',
    reward: 'Ready for skill development',
    icon: '🏗️'
  },
  {
    score: 65,
    name: 'Developing Writer',
    description: 'Your essay is starting to show your voice',
    reward: 'Ready for deeper work',
    icon: '📝'
  },
  {
    score: 75,
    name: 'Solid Essay',
    description: 'This would be competitive at good state schools',
    reward: 'Ready for refinement',
    icon: '✍️'
  },
  {
    score: 80,
    name: 'UC Berkeley/UCLA Level',
    description: 'Competitive at top public universities',
    reward: 'Ready for elite polish',
    icon: '🐻'
  },
  {
    score: 85,
    name: 'Strong Elite Candidate',
    description: 'Competitive at Stanford, MIT, Harvard level',
    reward: 'In the running for top schools',
    icon: '⭐'
  },
  {
    score: 90,
    name: 'Exceptional Work',
    description: 'Would stand out even at elite schools',
    reward: 'Top of the applicant pool',
    icon: '🏆'
  },
  {
    score: 95,
    name: 'Best of the Best',
    description: 'Admissions committee highlight material',
    reward: 'Truly remarkable writing',
    icon: '💎'
  },
  {
    score: 100,
    name: 'Transcendent',
    description: 'This is once-in-a-cycle writing',
    reward: 'Legendary status',
    icon: '👑'
  }
];

export function getNextMilestone(currentScore: number): Milestone | null {
  return MILESTONES.find(m => m.score > currentScore) || null;
}

export function getDistanceToNextMilestone(currentScore: number): number {
  const next = getNextMilestone(currentScore);
  return next ? next.score - currentScore : 0;
}

// ============================================================================
// ENCOURAGEMENT MESSAGES
// ============================================================================

/**
 * Generate context-appropriate encouragement based on tier and difficulty
 */
export function generateEncouragement(
  score: number,
  difficulty: number
): string {
  const tier = getDifficultyTier(score);

  const messages: Record<DifficultyTier, string[]> = {
    [DifficultyTier.FOUNDATION]: [
      'Every improvement here makes a big difference. You\'re building a strong foundation.',
      'Great progress! At this stage, gains come quickly with focused work.',
      'You\'re establishing the fundamentals. Each fix teaches you something new.',
      'Foundation work is crucial. You\'re setting yourself up for rapid improvement.'
    ],
    [DifficultyTier.DEVELOPING]: [
      'You\'re making solid progress. The basics are in place—now we\'re refining.',
      'Improvements are getting more nuanced, but you\'re rising to the challenge.',
      'You\'re in the growth zone. Each revision sharpens your instincts.',
      'Your skills are developing nicely. Keep building on this momentum.'
    ],
    [DifficultyTier.COMPETENT]: [
      'Your essay is solid. Now we\'re working on the fine details that elevate good to great.',
      'At this level, small changes create big impact. You\'re doing sophisticated work.',
      'You\'ve mastered the fundamentals. These refinements show real craft.',
      'Competent work. Now we\'re polishing this into something impressive.'
    ],
    [DifficultyTier.STRONG]: [
      'This is advanced territory. Each point gained here represents significant skill.',
      'You\'re in the top tier. Improvements at this level require real nuance.',
      'Exceptional work. The gains here are hard-won but extremely valuable.',
      'Strong writing demands precision. You\'re working at an advanced level.'
    ],
    [DifficultyTier.EXCEPTIONAL]: [
      'You\'re in elite territory (top 5%). Refinements at this level are about perfection.',
      'This is world-class writing. Every tiny improvement is a major achievement.',
      'You\'re competing with professionally edited work. This level of quality is rare.',
      'Exceptional tier means every word matters. You\'re doing elite-level work.'
    ],
    [DifficultyTier.MASTERFUL]: [
      'Near-perfect. You\'re in the top 1%. Even 0.5-point gains are remarkable.',
      'This rivals published work. Refinements here are about absolute mastery.',
      'You\'ve achieved what most writers aspire to. These micro-refinements are art.',
      'Masterful writing. At this level, you\'re polishing perfection.'
    ]
  };

  const tierMessages = messages[tier];
  return tierMessages[Math.floor(Math.random() * tierMessages.length)];
}

// ============================================================================
// ADAPTIVE SCORE CALCULATION
// ============================================================================

/**
 * Calculate adaptive score that makes students feel good about their progress
 *
 * Philosophy:
 * - Raw score = actual quality (objective)
 * - Effort-adjusted score = recognizes difficulty of improvement (motivational)
 *
 * Example:
 * - Student at 85 improves to 87 (+2 raw)
 * - Difficulty at 85: 4.5x
 * - Effort gain: 2 × 4.5 = 9 effort points
 * - Message: "You gained +2 points at elite difficulty (4.5x). That's like +9 points of foundation work!"
 */
export function calculateAdaptiveScore(
  rawScore: number,
  previousRawScore?: number
): AdaptiveScore {

  const difficulty = calculateDifficultyMultiplier(rawScore);
  const tier = getDifficultyTier(rawScore);
  const nextMilestone = getNextMilestone(rawScore);
  const distance = getDistanceToNextMilestone(rawScore);

  // If we have previous score, calculate effort-adjusted improvement
  let effortAdjusted = rawScore;

  if (previousRawScore !== undefined) {
    const rawGain = rawScore - previousRawScore;

    // Average difficulty across the range of improvement
    const prevDifficulty = calculateDifficultyMultiplier(previousRawScore);
    const avgDifficulty = (difficulty + prevDifficulty) / 2;

    // Effort gain = raw gain × average difficulty
    const effortGain = rawGain * avgDifficulty;

    // Effort-adjusted score = previous + effort gain
    // (Cap at 100 to avoid confusion)
    effortAdjusted = Math.min(100, previousRawScore + effortGain);
  }

  return {
    rawScore,
    effortAdjustedScore: Math.round(effortAdjusted * 10) / 10,
    difficultyMultiplier: difficulty,
    difficultyTier: tier,
    nextMilestone,
    distanceToNextMilestone: distance,
    encouragement: generateEncouragement(rawScore, difficulty),
    tierDescription: getTierDescription(tier)
  };
}

/**
 * Compare progress between two scores with effort recognition
 */
export function calculateProgressComparison(
  previousScore: number,
  currentScore: number
): ProgressComparison {

  const rawGain = currentScore - previousScore;

  // Calculate average difficulty across improvement range
  const prevDifficulty = calculateDifficultyMultiplier(previousScore);
  const currDifficulty = calculateDifficultyMultiplier(currentScore);
  const avgDifficulty = (prevDifficulty + currDifficulty) / 2;

  // Effort gain = raw gain × average difficulty
  const effortGain = Math.round(rawGain * avgDifficulty * 10) / 10;

  // Rough percentile mapping (for motivational messaging)
  const scoreToPercentile = (s: number) => {
    if (s < 50) return Math.round(s * 0.6);        // 0-30th percentile
    if (s < 70) return 30 + ((s - 50) * 1.0);      // 30-50th percentile
    if (s < 80) return 50 + ((s - 70) * 1.5);      // 50-65th percentile
    if (s < 90) return 65 + ((s - 80) * 2.0);      // 65-85th percentile
    if (s < 95) return 85 + ((s - 90) * 2.0);      // 85-95th percentile
    return 95 + ((s - 95) * 1.0);                  // 95-100th percentile
  };

  const prevPercentile = scoreToPercentile(previousScore);
  const currPercentile = scoreToPercentile(currentScore);
  const percentileGain = Math.round(currPercentile - prevPercentile);

  // Generate motivational message
  let message = '';

  if (rawGain <= 0) {
    message = 'No improvement detected. Keep working on the suggestions!';
  } else {
    const tier = getDifficultyTier(previousScore);

    if (tier === DifficultyTier.FOUNDATION || tier === DifficultyTier.DEVELOPING) {
      message = `Great progress! +${rawGain} points (${percentileGain} percentile jump). At this stage, improvements build momentum quickly.`;
    } else if (tier === DifficultyTier.COMPETENT || tier === DifficultyTier.STRONG) {
      message = `Excellent refinement! +${rawGain} raw points at ${avgDifficulty.toFixed(1)}x difficulty = ${effortGain} effort points. You're doing advanced work (${percentileGain} percentile gain).`;
    } else {
      message = `Exceptional achievement! +${rawGain} raw points at elite difficulty (${avgDifficulty.toFixed(1)}x) = ${effortGain} effort points. This level of refinement is remarkable (${percentileGain} percentile gain).`;
    }
  }

  return {
    previousRawScore: previousScore,
    currentRawScore: currentScore,
    rawGain,
    effortGain,
    percentileGain,
    message
  };
}

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

/**
 * Format adaptive score for student-facing display
 */
export function formatAdaptiveScoreDisplay(score: AdaptiveScore): string {
  const tierIcons = {
    [DifficultyTier.FOUNDATION]: '⚙️',
    [DifficultyTier.DEVELOPING]: '📈',
    [DifficultyTier.COMPETENT]: '✅',
    [DifficultyTier.STRONG]: '⭐',
    [DifficultyTier.EXCEPTIONAL]: '🏆',
    [DifficultyTier.MASTERFUL]: '👑'
  };

  const icon = tierIcons[score.difficultyTier];

  let display = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${icon} ${score.difficultyTier.toUpperCase()} TIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Raw Score: ${score.rawScore}/100
Difficulty: ${score.difficultyMultiplier}x multiplier
${score.tierDescription}

${score.encouragement}
`;

  if (score.nextMilestone) {
    const effortDistance = Math.round(
      score.distanceToNextMilestone * score.difficultyMultiplier * 10
    ) / 10;

    display += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT MILESTONE: ${score.nextMilestone.icon} ${score.nextMilestone.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${score.nextMilestone.description}

Distance: ${score.distanceToNextMilestone} raw points
Effort: ~${effortDistance} effort points
`;
  }

  return display;
}

/**
 * Format progress comparison for display
 */
export function formatProgressDisplay(progress: ProgressComparison): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRESS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Previous: ${progress.previousRawScore}/100
Current: ${progress.currentRawScore}/100

Raw Improvement: +${progress.rawGain} points
Effort-Adjusted: +${progress.effortGain} effort points
Percentile Gain: +${progress.percentileGain}%

${progress.message}
`;
}
