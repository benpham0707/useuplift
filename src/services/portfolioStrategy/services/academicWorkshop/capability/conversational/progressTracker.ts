/**
 * Conversation Progress Tracker
 *
 * Tracks what we've learned, what gaps remain, and intelligently
 * determines next steps in the conversation.
 *
 * Key capabilities:
 * - Track progress by category (effort, interest, challenges, etc.)
 * - Identify knowledge gaps and prioritize them
 * - Assess information quality and consistency
 * - Determine optimal pacing
 * - Smart topic transition recommendations
 */

import type { SubjectArea } from '../types';
import type {
  ConversationProgress,
  ProgressCategory,
  CategoryProgress,
  InformationQualityMetrics,
  KnowledgeGap,
  ConversationPriority,
  PacingStatus,
  ConversationTopic,
  QualitativeInsights,
  ExtractedInsight,
  EngagementAssessment,
  SubjectInsight,
} from './types';
import { formatSubject } from './topicDetector';

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Initialize progress tracking structure.
 */
export function initializeProgress(): ConversationProgress {
  const categoryProgress = new Map<ProgressCategory, CategoryProgress>();

  const categories: ProgressCategory[] = [
    'effort_understanding',
    'interest_mapping',
    'challenge_identification',
    'circumstance_context',
    'self_awareness_calibration',
    'future_intentions',
    'learning_style',
  ];

  for (const category of categories) {
    categoryProgress.set(category, {
      category,
      progress: 0,
      subjectsCovered: [],
      keyInsightsGained: [],
      gapsRemaining: [getCategoryDescription(category)],
      confidenceLevel: 0,
    });
  }

  return {
    overallProgress: 0,
    categoryProgress,
    informationQuality: {
      specificityScore: 0,
      consistencyScore: 50, // Start neutral
      corroborationScore: 0,
      overallConfidence: 0,
      unreliableAreas: [],
    },
    knowledgeGaps: getInitialKnowledgeGaps(),
    currentUnderstanding: [],
    nextPriorities: [],
    estimatedTurnsRemaining: 15,
    pacingStatus: 'on_track',
  };
}

/**
 * Update progress based on new insights.
 */
export function updateProgress(
  currentProgress: ConversationProgress,
  newInsights: ExtractedInsight[],
  qualitativeInsights: QualitativeInsights,
  engagement: EngagementAssessment,
  completedTopics: ConversationTopic[],
  pendingTopics: ConversationTopic[]
): ConversationProgress {
  const updatedProgress = { ...currentProgress };

  // NEW: Calculate depth multiplier based on engagement
  // Rich, detailed responses should be credited more
  const depthMultiplier = calculateDepthMultiplier(engagement);

  // 1. Update category progress based on new insights with depth multiplier
  for (const insight of newInsights) {
    updateCategoryFromInsight(updatedProgress.categoryProgress, insight, depthMultiplier);
  }

  // NEW: Bonus progress for multiple insights in one response
  // This rewards rich, comprehensive responses
  if (newInsights.length >= 2) {
    const multiInsightBonus = Math.min(10, newInsights.length * 3);
    applyBonusProgress(updatedProgress.categoryProgress, multiInsightBonus);
  }

  // 2. Update based on qualitative insights accumulated
  updateCategoriesFromQualitative(updatedProgress.categoryProgress, qualitativeInsights);

  // 3. Calculate overall progress
  updatedProgress.overallProgress = calculateOverallProgress(updatedProgress.categoryProgress);

  // 4. Update information quality metrics
  updatedProgress.informationQuality = assessInformationQuality(
    newInsights,
    qualitativeInsights,
    updatedProgress.categoryProgress
  );

  // 5. Identify remaining knowledge gaps
  updatedProgress.knowledgeGaps = identifyKnowledgeGaps(
    updatedProgress.categoryProgress,
    qualitativeInsights,
    pendingTopics
  );

  // 6. Update current understanding summary
  updatedProgress.currentUnderstanding = summarizeUnderstanding(qualitativeInsights);

  // 7. Determine next priorities
  updatedProgress.nextPriorities = determineNextPriorities(
    updatedProgress.knowledgeGaps,
    engagement,
    pendingTopics
  );

  // 8. Update pacing status
  updatedProgress.pacingStatus = determinePacingStatus(
    updatedProgress,
    completedTopics.length,
    engagement
  );

  // 9. Estimate turns remaining
  updatedProgress.estimatedTurnsRemaining = estimateTurnsRemaining(
    updatedProgress.overallProgress,
    updatedProgress.knowledgeGaps,
    engagement.level
  );

  return updatedProgress;
}

// ============================================================================
// CATEGORY PROGRESS UPDATES
// ============================================================================

/**
 * Calculate depth multiplier based on engagement assessment.
 * Higher engagement = richer response = more progress credit.
 *
 * CHANGED: Use additive bonuses instead of multiplicative to avoid runaway stacking.
 * Old system: 2.0 * 1.5 * 1.2 = 3.6x (before cap)
 * New system: 1.0 + 0.5 + 0.3 + 0.2 = 2.0x max
 */
function calculateDepthMultiplier(engagement: EngagementAssessment): number {
  let multiplier = 1.0; // Base multiplier

  // Engagement level contribution: 0 to +0.5
  if (engagement.level >= 80) {
    multiplier += 0.5; // Highly engaged
  } else if (engagement.level >= 60) {
    multiplier += 0.3;
  } else if (engagement.level >= 40) {
    multiplier += 0.0; // Neutral - no bonus, no penalty
  } else {
    multiplier -= 0.25; // Low engagement penalty
  }

  // Depth level contribution: 0 to +0.3
  if (engagement.depthLevel === 'deep') {
    multiplier += 0.3; // Deep responses get meaningful boost
  } else if (engagement.depthLevel === 'moderate') {
    multiplier += 0.15;
  }

  // Type-based contribution: 0 to +0.2
  if (engagement.type === 'highly_engaged') {
    multiplier += 0.2;
  }

  // Cap at 2.0x to avoid unrealistic progress jumps, minimum 0.5x
  return Math.max(0.5, Math.min(multiplier, 2.0));
}

/**
 * Apply bonus progress evenly across categories that have some progress.
 */
function applyBonusProgress(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  bonus: number
): void {
  // Apply bonus to categories that already have progress (active categories)
  for (const [, progress] of categoryProgress) {
    if (progress.progress > 0) {
      progress.progress = Math.min(100, progress.progress + bonus / 3);
    }
  }
}

function updateCategoryFromInsight(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  insight: ExtractedInsight,
  depthMultiplier: number = 1.0
): void {
  const v = insight.values;
  const subject = insight.scope.subject as SubjectArea | undefined;
  const confidence = insight.extractionConfidence;

  // Map insight types to categories (now with depth multiplier)
  if (v.effortLevel !== undefined) {
    updateCategory(categoryProgress, 'effort_understanding', subject, confidence,
      `Effort level: ${v.effortLevel}/5`, depthMultiplier);
  }

  if (v.enjoymentLevel !== undefined || v.intrinsicInterest !== undefined) {
    updateCategory(categoryProgress, 'interest_mapping', subject, confidence,
      v.intrinsicInterest ? 'Has genuine interest' : `Enjoyment: ${v.enjoymentLevel}/5`, depthMultiplier);
  }

  if (v.perceivedDifficulty !== undefined || v.selfAssessedChallenge) {
    updateCategory(categoryProgress, 'challenge_identification', subject, confidence,
      v.selfAssessedChallenge ? 'Self-identified challenge area' : `Difficulty: ${v.perceivedDifficulty}/5`, depthMultiplier);
  }

  if (v.externalFactors && v.externalFactors.length > 0) {
    // External factors are especially valuable - give bonus credit
    const externalFactorBonus = Math.min(v.externalFactors.length * 5, 15);
    updateCategory(categoryProgress, 'circumstance_context', subject, confidence + externalFactorBonus,
      `${v.externalFactors.length} external factor(s) identified`, depthMultiplier);
  }

  if (v.selfAssessedStrength !== undefined || v.selfAssessedChallenge !== undefined) {
    updateCategory(categoryProgress, 'self_awareness_calibration', subject, confidence,
      v.selfAssessedStrength ? 'Sees as strength' : 'Sees as challenge', depthMultiplier);
  }

  if (v.wantsToContinue !== undefined || v.specificFutureCourses) {
    updateCategory(categoryProgress, 'future_intentions', subject, confidence,
      v.wantsToContinue ? 'Plans to continue' : 'May not continue', depthMultiplier);
  }

  if (v.learningPreferences && v.learningPreferences.length > 0) {
    updateCategory(categoryProgress, 'learning_style', subject, confidence,
      `Prefers: ${v.learningPreferences.join(', ')}`, depthMultiplier);
  }
}

function updateCategoriesFromQualitative(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  qualitativeInsights: QualitativeInsights
): void {
  // Update based on subject insights
  for (const [subject, subjectInsight] of qualitativeInsights.subjectInsights) {
    if (subjectInsight.overallEffort !== 50) {
      ensureSubjectCovered(categoryProgress, 'effort_understanding', subject);
    }
    if (subjectInsight.overallInterest !== 50) {
      ensureSubjectCovered(categoryProgress, 'interest_mapping', subject);
    }
    if (subjectInsight.perceivedDifficulty !== 50) {
      ensureSubjectCovered(categoryProgress, 'challenge_identification', subject);
    }
    if (subjectInsight.intendsToContinue !== false) {
      ensureSubjectCovered(categoryProgress, 'future_intentions', subject);
    }
  }

  // Update based on global circumstances
  if (qualitativeInsights.globalCircumstances.length > 0) {
    const circumstanceProgress = categoryProgress.get('circumstance_context');
    if (circumstanceProgress) {
      circumstanceProgress.progress = Math.min(100, circumstanceProgress.progress + 30);
      circumstanceProgress.keyInsightsGained.push(
        `${qualitativeInsights.globalCircumstances.length} global circumstance(s) identified`
      );
    }
  }

  // Update based on learning style if available
  if (qualitativeInsights.learningStyleIndicators) {
    const learningProgress = categoryProgress.get('learning_style');
    if (learningProgress) {
      learningProgress.progress = Math.min(100, learningProgress.progress + 40);
    }
  }
}

function updateCategory(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  category: ProgressCategory,
  subject: SubjectArea | undefined,
  confidence: number,
  insightDescription: string,
  depthMultiplier: number = 1.0
): void {
  const progress = categoryProgress.get(category);
  if (!progress) return;

  // Add progress based on confidence AND depth multiplier
  // Base: 15% max per insight, but depth multiplier can boost up to 45%
  const baseProgressGain = (confidence / 100) * 15;
  const progressGain = baseProgressGain * depthMultiplier;
  progress.progress = Math.min(100, progress.progress + progressGain);

  // Track subject if applicable
  if (subject && !progress.subjectsCovered.includes(subject)) {
    progress.subjectsCovered.push(subject);
    // Bonus for new subject - also scaled by depth
    progress.progress = Math.min(100, progress.progress + (5 * depthMultiplier));
  }

  // Track insight
  if (!progress.keyInsightsGained.includes(insightDescription)) {
    progress.keyInsightsGained.push(insightDescription);
    // NEW: Bonus for each unique insight
    progress.progress = Math.min(100, progress.progress + 2);
  }

  // Update confidence
  progress.confidenceLevel = Math.max(progress.confidenceLevel, confidence);

  // Update gaps (lower threshold since we're making more progress)
  if (progress.progress > 25) {
    progress.gapsRemaining = progress.gapsRemaining.filter(
      gap => !gap.includes(getCategoryDescription(category))
    );
  }
}

function ensureSubjectCovered(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  category: ProgressCategory,
  subject: SubjectArea
): void {
  const progress = categoryProgress.get(category);
  if (progress && !progress.subjectsCovered.includes(subject)) {
    progress.subjectsCovered.push(subject);
    progress.progress = Math.min(100, progress.progress + 5);
  }
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateOverallProgress(
  categoryProgress: Map<ProgressCategory, CategoryProgress>
): number {
  const weights: Record<ProgressCategory, number> = {
    effort_understanding: 0.2,
    interest_mapping: 0.2,
    challenge_identification: 0.15,
    circumstance_context: 0.15,
    self_awareness_calibration: 0.1,
    future_intentions: 0.1,
    learning_style: 0.1,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [category, progress] of categoryProgress) {
    const weight = weights[category] || 0.1;
    weightedSum += progress.progress * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

function assessInformationQuality(
  recentInsights: ExtractedInsight[],
  qualitativeInsights: QualitativeInsights,
  categoryProgress: Map<ProgressCategory, CategoryProgress>
): InformationQualityMetrics {
  // Specificity: how detailed are the insights?
  const specificityScore = calculateSpecificityScore(recentInsights, qualitativeInsights);

  // Consistency: do insights align with each other?
  const consistencyScore = calculateConsistencyScore(qualitativeInsights);

  // Corroboration: do we have multiple sources for key claims?
  const corroborationScore = calculateCorroborationScore(qualitativeInsights);

  // Overall confidence
  const overallConfidence = Math.round(
    (specificityScore * 0.4 + consistencyScore * 0.3 + corroborationScore * 0.3)
  );

  // Identify unreliable areas
  const unreliableAreas: string[] = [];
  for (const [category, progress] of categoryProgress) {
    if (progress.progress > 20 && progress.confidenceLevel < 50) {
      unreliableAreas.push(getCategoryDescription(category));
    }
  }

  return {
    specificityScore,
    consistencyScore,
    corroborationScore,
    overallConfidence,
    unreliableAreas,
  };
}

function calculateSpecificityScore(
  recentInsights: ExtractedInsight[],
  qualitativeInsights: QualitativeInsights
): number {
  let score = 50; // Start neutral

  // Check for specific courses mentioned
  if (qualitativeInsights.courseAnnotations.size > 0) {
    score += qualitativeInsights.courseAnnotations.size * 5;
  }

  // Check for specific numbers (effort levels, etc.)
  const numericInsights = recentInsights.filter(i =>
    i.values.effortLevel !== undefined ||
    i.values.perceivedDifficulty !== undefined ||
    i.values.enjoymentLevel !== undefined
  );
  score += numericInsights.length * 3;

  // Check for direct quotes
  const quotesCount = qualitativeInsights.allExtractedInsights
    .filter(i => i.supportingQuote).length;
  score += quotesCount * 2;

  return Math.min(100, score);
}

function calculateConsistencyScore(qualitativeInsights: QualitativeInsights): number {
  let score = 70; // Start with assumption of consistency

  // Check for contradictions in subject insights
  for (const [, subjectInsight] of qualitativeInsights.subjectInsights) {
    // High effort but low engagement is a potential inconsistency
    if (subjectInsight.overallEffort > 70 && subjectInsight.overallInterest < 30) {
      score -= 5;
    }

    // Self-assessed strength but low confidence
    if (subjectInsight.selfAssessedStrength && subjectInsight.overallConfidence < 40) {
      score -= 5;
    }
  }

  // Check for repeated claims
  const insightTypes = qualitativeInsights.allExtractedInsights.map(i => i.type);
  const uniqueTypes = new Set(insightTypes);
  if (insightTypes.length > 0 && uniqueTypes.size / insightTypes.length > 0.7) {
    score += 10; // Good variety
  }

  return Math.max(30, Math.min(100, score));
}

function calculateCorroborationScore(qualitativeInsights: QualitativeInsights): number {
  let score = 30; // Start low

  // Multiple insights for the same subject
  const subjectCounts = new Map<string, number>();
  for (const insight of qualitativeInsights.allExtractedInsights) {
    if (insight.scope.subject) {
      const current = subjectCounts.get(insight.scope.subject) || 0;
      subjectCounts.set(insight.scope.subject, current + 1);
    }
  }

  // Subjects with 3+ insights are well-corroborated
  let wellCorroboratedSubjects = 0;
  for (const count of subjectCounts.values()) {
    if (count >= 3) wellCorroboratedSubjects++;
  }
  score += wellCorroboratedSubjects * 15;

  return Math.min(100, score);
}

// ============================================================================
// KNOWLEDGE GAPS AND PRIORITIES
// ============================================================================

function getInitialKnowledgeGaps(): KnowledgeGap[] {
  return [
    {
      area: 'Effort patterns across subjects',
      importance: 'critical',
      suggestedApproach: 'Ask about work habits in different classes',
      relatedTopics: ['effort_understanding', 'learning_style'],
    },
    {
      area: 'Interest and enjoyment mapping',
      importance: 'critical',
      suggestedApproach: 'Explore what they find engaging',
      relatedTopics: ['interest_mapping', 'future_intentions'],
    },
    {
      area: 'Challenges and struggles',
      importance: 'important',
      suggestedApproach: 'Discuss difficult experiences',
      relatedTopics: ['challenge_identification', 'self_awareness_calibration'],
    },
    {
      area: 'External circumstances',
      importance: 'important',
      suggestedApproach: 'Ask about life factors affecting school',
      relatedTopics: ['circumstance_context'],
    },
  ];
}

function identifyKnowledgeGaps(
  categoryProgress: Map<ProgressCategory, CategoryProgress>,
  qualitativeInsights: QualitativeInsights,
  pendingTopics: ConversationTopic[]
): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];

  // Check each category for gaps
  for (const [category, progress] of categoryProgress) {
    if (progress.progress < 40) {
      gaps.push({
        area: getCategoryDescription(category),
        importance: getCategoryImportance(category),
        suggestedApproach: getSuggestedApproach(category, progress),
        relatedTopics: getRelatedTopics(category, pendingTopics),
      });
    }
  }

  // Check for subject coverage gaps
  const coveredSubjects = new Set<SubjectArea>();
  for (const insight of qualitativeInsights.subjectInsights.keys()) {
    coveredSubjects.add(insight);
  }

  const allSubjects: SubjectArea[] = ['math', 'science', 'english', 'social_studies'];
  const uncoveredSubjects = allSubjects.filter(s => !coveredSubjects.has(s));

  if (uncoveredSubjects.length > 2) {
    gaps.push({
      area: `Coverage gap: ${uncoveredSubjects.map(formatSubject).join(', ')}`,
      importance: 'important',
      suggestedApproach: 'Ask about uncovered subject areas',
      relatedTopics: uncoveredSubjects,
    });
  }

  return gaps.sort((a, b) => {
    const importanceOrder = { critical: 0, important: 1, nice_to_have: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}

function determineNextPriorities(
  gaps: KnowledgeGap[],
  engagement: EngagementAssessment,
  pendingTopics: ConversationTopic[]
): ConversationPriority[] {
  const priorities: ConversationPriority[] = [];

  // Add priorities from gaps
  for (const gap of gaps.slice(0, 3)) {
    priorities.push({
      topic: gap.area,
      reason: `Gap in understanding: ${gap.area}`,
      urgency: gap.importance === 'critical' ? 'high' : 'medium',
      approach: gap.suggestedApproach,
    });
  }

  // Adjust based on engagement
  if (engagement.level < 40) {
    priorities.unshift({
      topic: 'Re-engagement',
      reason: 'Student engagement is low',
      urgency: 'high',
      approach: 'Try a different approach or topic',
    });
  }

  // Add from pending topics
  for (const topic of pendingTopics.slice(0, 2)) {
    if (!priorities.some(p => p.topic.includes(topic.context.substring(0, 20)))) {
      priorities.push({
        topic: topic.context,
        reason: `Planned topic: ${topic.type}`,
        urgency: topic.priority > 80 ? 'high' : topic.priority > 50 ? 'medium' : 'low',
        approach: topic.primaryQuestion,
      });
    }
  }

  return priorities.slice(0, 5);
}

// ============================================================================
// PACING AND ESTIMATION
// ============================================================================

function determinePacingStatus(
  progress: ConversationProgress,
  topicsCompleted: number,
  engagement: EngagementAssessment
): PacingStatus {
  // Near completion
  if (progress.overallProgress > 80) {
    return 'wrapping_up';
  }

  // Calculate expected vs actual
  const expectedProgress = Math.min(topicsCompleted * 8, 100); // ~8% per topic
  const progressDiff = progress.overallProgress - expectedProgress;

  // Check for stalling
  if (engagement.level < 40 && progressDiff < -10) {
    return 'stalled';
  }

  // Ahead of pace
  if (progressDiff > 15) {
    return 'ahead';
  }

  // Behind pace
  if (progressDiff < -15) {
    return 'behind';
  }

  return 'on_track';
}

function estimateTurnsRemaining(
  overallProgress: number,
  gaps: KnowledgeGap[],
  engagementLevel: number
): number {
  // Base estimate from progress
  const remainingProgress = 100 - overallProgress;
  const baseEstimate = Math.ceil(remainingProgress / 7); // ~7% per turn average

  // Adjust for critical gaps
  const criticalGaps = gaps.filter(g => g.importance === 'critical').length;
  const gapAdjustment = criticalGaps * 2;

  // Adjust for engagement (low engagement = more turns needed)
  const engagementMultiplier = engagementLevel < 40 ? 1.5 : engagementLevel < 60 ? 1.2 : 1.0;

  const estimate = Math.round((baseEstimate + gapAdjustment) * engagementMultiplier);

  return Math.max(2, Math.min(20, estimate));
}

// ============================================================================
// UNDERSTANDING SUMMARY
// ============================================================================

function summarizeUnderstanding(qualitativeInsights: QualitativeInsights): string[] {
  const summary: string[] = [];

  // Subject-level summaries
  for (const [subject, insight] of qualitativeInsights.subjectInsights) {
    const subjectName = formatSubject(subject);
    const characteristics: string[] = [];

    if (insight.overallInterest > 70) {
      characteristics.push('high interest');
    } else if (insight.overallInterest < 30) {
      characteristics.push('low interest');
    }

    if (insight.overallEffort > 70) {
      characteristics.push('high effort');
    } else if (insight.overallEffort < 30) {
      characteristics.push('low effort');
    }

    if (insight.selfAssessedStrength) {
      characteristics.push('self-identified strength');
    }
    if (insight.selfAssessedChallenge) {
      characteristics.push('self-identified challenge');
    }

    if (characteristics.length > 0) {
      summary.push(`${subjectName}: ${characteristics.join(', ')}`);
    }
  }

  // Global circumstances
  if (qualitativeInsights.globalCircumstances.length > 0) {
    const circumstances = qualitativeInsights.globalCircumstances
      .map(c => c.description)
      .join(', ');
    summary.push(`External factors: ${circumstances}`);
  }

  // Learning style if known
  if (qualitativeInsights.learningStyleIndicators) {
    const style = qualitativeInsights.learningStyleIndicators;
    summary.push(`Learning style: ${style.structurePreference}, ${style.difficultyResponse}`);
  }

  return summary.slice(0, 5);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategoryDescription(category: ProgressCategory): string {
  const descriptions: Record<ProgressCategory, string> = {
    effort_understanding: 'Understanding of effort patterns',
    interest_mapping: 'Interest and enjoyment mapping',
    challenge_identification: 'Challenge and struggle identification',
    circumstance_context: 'External circumstances context',
    self_awareness_calibration: 'Self-awareness calibration',
    future_intentions: 'Future academic intentions',
    learning_style: 'Learning style understanding',
  };
  return descriptions[category];
}

function getCategoryImportance(category: ProgressCategory): 'critical' | 'important' | 'nice_to_have' {
  const critical: ProgressCategory[] = ['effort_understanding', 'interest_mapping'];
  const important: ProgressCategory[] = ['challenge_identification', 'circumstance_context', 'self_awareness_calibration'];

  if (critical.includes(category)) return 'critical';
  if (important.includes(category)) return 'important';
  return 'nice_to_have';
}

function getSuggestedApproach(category: ProgressCategory, progress: CategoryProgress): string {
  const subjectsList = progress.subjectsCovered.map(formatSubject).join(', ') || 'any';

  const approaches: Record<ProgressCategory, string> = {
    effort_understanding: `Ask about work habits in subjects not yet covered (have: ${subjectsList})`,
    interest_mapping: `Explore what classes they find engaging or boring`,
    challenge_identification: `Discuss classes or topics they found difficult`,
    circumstance_context: `Ask about external factors affecting school`,
    self_awareness_calibration: `Compare their self-assessment with record patterns`,
    future_intentions: `Ask about future course plans and academic goals`,
    learning_style: `Explore how they learn best and study preferences`,
  };

  return approaches[category];
}

function getRelatedTopics(category: ProgressCategory, pendingTopics: ConversationTopic[]): string[] {
  const categoryToTypes: Record<ProgressCategory, string[]> = {
    effort_understanding: ['grade_anomaly', 'difficulty_transition'],
    interest_mapping: ['subject_overview', 'future_planning'],
    challenge_identification: ['grade_anomaly', 'difficulty_transition', 'subject_inconsistency'],
    circumstance_context: ['circumstance_exploration', 'trend_exploration'],
    self_awareness_calibration: ['subject_overview', 'grade_anomaly'],
    future_intentions: ['future_planning', 'high_stakes_course'],
    learning_style: ['subject_overview', 'difficulty_transition'],
  };

  const relevantTypes = categoryToTypes[category] || [];
  return pendingTopics
    .filter(t => relevantTypes.includes(t.type))
    .slice(0, 3)
    .map(t => t.context.substring(0, 30));
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getCategoryDescription,
  getCategoryImportance,
  summarizeUnderstanding,
};
