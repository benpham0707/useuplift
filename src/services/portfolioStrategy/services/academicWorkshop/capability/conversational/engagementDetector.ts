/**
 * Engagement Detection System
 *
 * Analyzes student responses to detect engagement level, confusion,
 * emotional tone, and other signals that help adapt conversation flow.
 *
 * Key capabilities:
 * - Detect engagement level from response characteristics
 * - Identify confusion or resistance
 * - Track engagement trends over time
 * - Recommend response strategies based on engagement
 */

import { callClaude } from '../../../../../../lib/llm/claude';
import type {
  EngagementAssessment,
  EngagementType,
  EngagementIndicator,
  EngagementIndicatorType,
  ResponseStrategy,
  EmotionalTone,
  ConversationTurn,
} from './types';

// ============================================================================
// ENGAGEMENT DETECTION PATTERNS (Heuristic)
// ============================================================================

const ENGAGEMENT_PATTERNS = {
  // High engagement signals
  high_engagement: {
    patterns: [
      /I (really|actually|honestly) (think|feel|believe)/i,
      /let me (explain|tell you|share)/i,
      /the thing is/i,
      /to be (honest|fair)/i,
      /I remember when/i,
      /it('s| is) interesting (because|that)/i,
      /I've (always|never) (thought|felt|been)/i,
      /what I (love|enjoy|appreciate)/i,
      /this is (important|significant) to me/i,
    ],
    weight: 15,
  },

  // Enthusiasm signals
  enthusiasm: {
    patterns: [
      /!/,
      /I love/i,
      /I really (enjoy|like|appreciate)/i,
      /(amazing|awesome|fantastic|great|wonderful)/i,
      /so (much|excited|passionate)/i,
      /my favorite/i,
      /I can't (wait|believe)/i,
    ],
    weight: 10,
  },

  // Self-reflection signals
  self_reflection: {
    patterns: [
      /I (realize|realized|think|thought) that/i,
      /looking back/i,
      /in hindsight/i,
      /I've (come|grown) to/i,
      /it (taught|showed) me/i,
      /I learned that/i,
      /I've been thinking/i,
      /I wonder (if|whether)/i,
    ],
    weight: 12,
  },

  // Specific details (good engagement)
  specificity: {
    patterns: [
      /\b(freshman|sophomore|junior|senior) year\b/i,
      /\b(first|second|third|fourth) (quarter|semester|period)\b/i,
      /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+/i,
      /\d+\s*(hours?|minutes?|times?|days?|weeks?)/i,
      /\b(AP|honors|regular|advanced)\b/i,
      /\b[A-D][+-]?\b/,  // Grades
      /\b\d{1,3}%\b/,    // Percentages
    ],
    weight: 8,
  },

  // Low engagement signals
  low_engagement: {
    patterns: [
      /^(ok|okay|fine|sure|yeah|yes|no|idk|dunno)\.?$/i,
      /^(good|bad|alright|normal)\.?$/i,
      /^I (don't|dont) know\.?$/i,
      /^not (really|much|sure)\.?$/i,
      /^(nothing|none|same)\.?$/i,
    ],
    weight: -20,
  },

  // Confusion signals
  confusion: {
    patterns: [
      /what do you mean/i,
      /I('m| am) (not sure|confused)/i,
      /can you (explain|clarify)/i,
      /I don't (understand|get)/i,
      /what are you asking/i,
      /huh\??/i,
      /\?\s*\?/,  // Multiple question marks
    ],
    weight: -10,
  },

  // Deflection signals
  deflection: {
    patterns: [
      /I('d| would) rather not/i,
      /I don't (want|like) to (talk|discuss)/i,
      /can we (talk|move) (about|on)/i,
      /it's (personal|private|complicated)/i,
      /I don't remember/i,
      /that was a long time ago/i,
      /it doesn't matter/i,
    ],
    weight: -15,
  },

  // Fatigue signals
  fatigue: {
    patterns: [
      /let's (move on|wrap up|finish)/i,
      /I('m| am) (tired|done)/i,
      /how much (longer|more)/i,
      /are we (almost|nearly) done/i,
      /can we (hurry|speed) up/i,
    ],
    weight: -25,
  },

  // Resistance signals
  resistance: {
    patterns: [
      /why (do|should|would) (you|I)/i,
      /that's not (relevant|important)/i,
      /I don't see (the point|why)/i,
      /this is (stupid|pointless|annoying)/i,
      /none of your business/i,
    ],
    weight: -30,
  },
};

// ============================================================================
// ENGAGEMENT ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Assess engagement from a student response using heuristics.
 */
export function assessEngagementHeuristic(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  currentTopic?: string
): EngagementAssessment {
  const indicators: EngagementIndicator[] = [];
  let engagementScore = 50; // Start neutral

  // 1. Response length analysis
  const wordCount = studentMessage.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 5) {
    indicators.push({
      type: 'one_word_answers',
      strength: wordCount <= 2 ? 'strong' : 'moderate',
      evidence: `Response only ${wordCount} words`,
    });
    engagementScore -= wordCount <= 2 ? 20 : 10;
  } else if (wordCount > 30) {
    indicators.push({
      type: 'response_length',
      strength: wordCount > 60 ? 'strong' : 'moderate',
      evidence: `Detailed response of ${wordCount} words`,
    });
    engagementScore += wordCount > 60 ? 20 : 10;
  }

  // 2. Pattern matching
  for (const [category, { patterns, weight }] of Object.entries(ENGAGEMENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(studentMessage)) {
        const indicatorType = mapCategoryToIndicator(category);
        const existingIndicator = indicators.find(i => i.type === indicatorType);
        if (!existingIndicator) {
          indicators.push({
            type: indicatorType,
            strength: Math.abs(weight) > 15 ? 'strong' : 'moderate',
            evidence: `Detected ${category} pattern`,
          });
        }
        engagementScore += weight;
        break; // Only count each category once
      }
    }
  }

  // 3. Question asking (shows engagement)
  const questionCount = (studentMessage.match(/\?/g) || []).length;
  if (questionCount > 0 && !studentMessage.match(/what do you mean|can you explain/i)) {
    indicators.push({
      type: 'question_asking',
      strength: questionCount > 1 ? 'strong' : 'moderate',
      evidence: `Student asked ${questionCount} question(s)`,
    });
    engagementScore += 10 * questionCount;
  }

  // 4. Check for topic elaboration (going beyond what was asked)
  if (conversationHistory.length > 0) {
    const lastAIMessage = conversationHistory
      .filter(t => t.role === 'ai')
      .slice(-1)[0]?.message || '';

    // If student brings up something not directly asked
    if (studentMessage.length > lastAIMessage.length * 0.5 && wordCount > 20) {
      indicators.push({
        type: 'topic_elaboration',
        strength: 'moderate',
        evidence: 'Response elaborates beyond the question',
      });
      engagementScore += 8;
    }
  }

  // 5. Emotional expression analysis
  const emotionalTone = detectEmotionalTone(studentMessage);
  if (emotionalTone === 'positive') {
    engagementScore += 10;
  } else if (emotionalTone === 'negative') {
    // Negative emotion can still be engagement (venting about bad teacher)
    engagementScore += 5;
    indicators.push({
      type: 'emotional_expression',
      strength: 'moderate',
      evidence: 'Expressing negative emotions (may indicate authentic sharing)',
    });
  }

  // 6. Trend analysis (engagement declining over time?)
  const recentStudentTurns = conversationHistory
    .filter(t => t.role === 'student')
    .slice(-3);

  if (recentStudentTurns.length >= 2) {
    const avgPreviousLength = recentStudentTurns
      .slice(0, -1)
      .reduce((sum, t) => sum + t.message.length, 0) / (recentStudentTurns.length - 1);

    if (studentMessage.length < avgPreviousLength * 0.3) {
      indicators.push({
        type: 'fatigue_signals',
        strength: 'moderate',
        evidence: 'Responses getting significantly shorter',
      });
      engagementScore -= 10;
    }
  }

  // Normalize score
  engagementScore = Math.max(0, Math.min(100, engagementScore));

  // Determine engagement type
  const engagementType = determineEngagementType(engagementScore, indicators);

  // Detect confusion
  const isConfused = indicators.some(i => i.type === 'confusion_signals');

  // Detect topic change desire
  const wantsTopicChange = indicators.some(i =>
    i.type === 'deflection' || i.type === 'fatigue_signals'
  );

  // Determine depth level
  const depthLevel = determineDepthLevel(wordCount, indicators);

  // Recommend strategy
  const recommendedStrategy = recommendStrategy(engagementType, indicators, isConfused, wantsTopicChange);

  return {
    level: engagementScore,
    type: engagementType,
    indicators,
    recommendedStrategy,
    isConfused,
    wantsTopicChange,
    depthLevel,
    emotionalTone,
    confidence: calculateAssessmentConfidence(indicators),
  };
}

/**
 * Assess engagement using LLM for more nuanced understanding.
 */
export async function assessEngagementWithLLM(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  currentTopic?: string,
  options: { model?: 'haiku' | 'sonnet' } = {}
): Promise<EngagementAssessment> {
  // First get heuristic assessment as fallback
  const heuristicAssessment = assessEngagementHeuristic(
    studentMessage,
    conversationHistory,
    currentTopic
  );

  try {
    const recentHistory = conversationHistory.slice(-6);
    const historyText = recentHistory
      .map(t => `${t.role === 'ai' ? 'Advisor' : 'Student'}: ${t.message}`)
      .join('\n');

    const prompt = `Analyze the student's engagement in this academic conversation.

CONVERSATION:
${historyText}

STUDENT'S LATEST MESSAGE:
"${studentMessage}"

${currentTopic ? `CURRENT TOPIC: ${currentTopic}` : ''}

Analyze the student's engagement and respond in JSON format:
{
  "engagementLevel": <number 0-100>,
  "engagementType": "<highly_engaged|engaged|neutral|disengaged|resistant|overwhelmed|confused>",
  "isConfused": <boolean>,
  "wantsTopicChange": <boolean>,
  "depthLevel": "<surface|moderate|deep>",
  "emotionalTone": "<positive|neutral|negative|mixed|guarded>",
  "keyObservations": ["<observation1>", "<observation2>"],
  "recommendedStrategy": "<continue_normally|probe_deeper|rephrase_question|share_observation|validate_and_encourage|offer_examples|change_topic|take_a_break|summarize_progress|direct_question|open_ended_invite>",
  "reasoning": "<brief explanation>"
}

Focus on:
1. Are they sharing meaningful information or giving minimal responses?
2. Do they seem comfortable or guarded?
3. Are they confused about what's being asked?
4. Do they want to move on to a different topic?
5. What approach would work best for the next question?`;

    const model = options.model === 'sonnet'
      ? 'claude-sonnet-4-20250514'
      : 'claude-haiku-4-5-20251001';

    const response = await callClaude({
      model,
      system: 'You are an expert at analyzing student engagement in conversations. Respond only with valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 500,
      temperature: 0.3,
    });

    // Parse response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[EngagementDetector] Could not parse LLM response, using heuristic');
      return heuristicAssessment;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Build indicators from LLM observations
    const indicators: EngagementIndicator[] = (parsed.keyObservations || []).map((obs: string) => ({
      type: inferIndicatorType(obs),
      strength: 'moderate' as const,
      evidence: obs,
    }));

    // Merge with heuristic indicators for completeness
    for (const heuristicIndicator of heuristicAssessment.indicators) {
      if (!indicators.some(i => i.type === heuristicIndicator.type)) {
        indicators.push(heuristicIndicator);
      }
    }

    return {
      level: parsed.engagementLevel || heuristicAssessment.level,
      type: parsed.engagementType || heuristicAssessment.type,
      indicators,
      recommendedStrategy: parsed.recommendedStrategy || heuristicAssessment.recommendedStrategy,
      isConfused: parsed.isConfused ?? heuristicAssessment.isConfused,
      wantsTopicChange: parsed.wantsTopicChange ?? heuristicAssessment.wantsTopicChange,
      depthLevel: parsed.depthLevel || heuristicAssessment.depthLevel,
      emotionalTone: parsed.emotionalTone || heuristicAssessment.emotionalTone,
      confidence: 85, // Higher confidence with LLM
    };
  } catch (error) {
    console.warn('[EngagementDetector] LLM assessment failed, using heuristic:', error);
    return heuristicAssessment;
  }
}

/**
 * Analyze engagement trend over recent turns.
 */
export function analyzeEngagementTrend(
  engagementHistory: EngagementAssessment[]
): 'improving' | 'stable' | 'declining' {
  if (engagementHistory.length < 3) {
    return 'stable';
  }

  const recent = engagementHistory.slice(-5);
  const levels = recent.map(a => a.level);

  // Calculate trend using linear regression slope
  const n = levels.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = levels.reduce((a, b) => a + b, 0);
  const sumXY = levels.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (slope > 3) return 'improving';
  if (slope < -3) return 'declining';
  return 'stable';
}

/**
 * Get count of consecutive low-engagement turns.
 */
export function getLowEngagementStreak(
  engagementHistory: EngagementAssessment[]
): number {
  let streak = 0;
  for (let i = engagementHistory.length - 1; i >= 0; i--) {
    if (engagementHistory[i].level < 40) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Determine if conversation needs adaptation based on engagement.
 */
export function needsAdaptation(
  currentEngagement: EngagementAssessment,
  engagementHistory: EngagementAssessment[],
  lowEngagementStreak: number
): boolean {
  // Immediate adaptation needed
  if (currentEngagement.type === 'confused' || currentEngagement.type === 'resistant') {
    return true;
  }

  // Adaptation after sustained low engagement
  if (lowEngagementStreak >= 2) {
    return true;
  }

  // Adaptation if trend is declining
  const trend = analyzeEngagementTrend(engagementHistory);
  if (trend === 'declining' && currentEngagement.level < 50) {
    return true;
  }

  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapCategoryToIndicator(category: string): EngagementIndicatorType {
  const mapping: Record<string, EngagementIndicatorType> = {
    high_engagement: 'topic_elaboration',
    enthusiasm: 'enthusiasm_signals',
    self_reflection: 'self_reflection',
    specificity: 'response_specificity',
    low_engagement: 'one_word_answers',
    confusion: 'confusion_signals',
    deflection: 'deflection',
    fatigue: 'fatigue_signals',
    resistance: 'resistance_signals',
  };
  return mapping[category] || 'response_specificity';
}

function detectEmotionalTone(message: string): EmotionalTone {
  const positivePatterns = [
    /\b(love|enjoy|like|great|amazing|happy|excited|fun|interesting|cool)\b/i,
    /!/,
  ];
  const negativePatterns = [
    /\b(hate|hated|terrible|awful|boring|frustrat|annoy|worst|stress)\b/i,
    /\b(struggle|struggled|hard|difficult|confus)\b/i,
  ];
  const guardedPatterns = [
    /\b(I guess|maybe|sort of|kind of|I suppose)\b/i,
    /\b(personal|private|rather not)\b/i,
  ];

  let positiveScore = 0;
  let negativeScore = 0;
  let guardedScore = 0;

  for (const pattern of positivePatterns) {
    if (pattern.test(message)) positiveScore++;
  }
  for (const pattern of negativePatterns) {
    if (pattern.test(message)) negativeScore++;
  }
  for (const pattern of guardedPatterns) {
    if (pattern.test(message)) guardedScore++;
  }

  if (guardedScore >= 2) return 'guarded';
  if (positiveScore > 0 && negativeScore > 0) return 'mixed';
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

function determineEngagementType(
  score: number,
  indicators: EngagementIndicator[]
): EngagementType {
  // Check for specific types first
  if (indicators.some(i => i.type === 'confusion_signals' && i.strength === 'strong')) {
    return 'confused';
  }
  if (indicators.some(i => i.type === 'resistance_signals')) {
    return 'resistant';
  }
  if (indicators.some(i => i.type === 'fatigue_signals' && i.strength === 'strong')) {
    return 'overwhelmed';
  }

  // Score-based determination
  if (score >= 75) return 'highly_engaged';
  if (score >= 55) return 'engaged';
  if (score >= 40) return 'neutral';
  return 'disengaged';
}

function determineDepthLevel(
  wordCount: number,
  indicators: EngagementIndicator[]
): 'surface' | 'moderate' | 'deep' {
  const hasReflection = indicators.some(i => i.type === 'self_reflection');
  const hasSpecificity = indicators.some(i => i.type === 'response_specificity');
  const hasElaboration = indicators.some(i => i.type === 'topic_elaboration');

  if ((hasReflection && hasSpecificity) || (wordCount > 50 && hasElaboration)) {
    return 'deep';
  }
  if (hasSpecificity || wordCount > 25) {
    return 'moderate';
  }
  return 'surface';
}

function recommendStrategy(
  engagementType: EngagementType,
  indicators: EngagementIndicator[],
  isConfused: boolean,
  wantsTopicChange: boolean
): ResponseStrategy {
  // Handle confusion first
  if (isConfused) {
    return 'rephrase_question';
  }

  // Handle topic change desire
  if (wantsTopicChange) {
    return 'change_topic';
  }

  // Strategy by engagement type
  switch (engagementType) {
    case 'highly_engaged':
      return 'probe_deeper';

    case 'engaged':
      return 'continue_normally';

    case 'neutral':
      // Try to increase engagement
      if (indicators.some(i => i.type === 'one_word_answers')) {
        return 'offer_examples';
      }
      return 'validate_and_encourage';

    case 'disengaged':
      // Need to re-engage
      if (indicators.some(i => i.type === 'one_word_answers')) {
        return 'open_ended_invite';
      }
      return 'share_observation';

    case 'resistant':
      return 'change_topic';

    case 'overwhelmed':
      return 'take_a_break';

    case 'confused':
      return 'offer_examples';

    default:
      return 'continue_normally';
  }
}

function calculateAssessmentConfidence(indicators: EngagementIndicator[]): number {
  // Base confidence
  let confidence = 50;

  // More indicators = more confidence
  confidence += Math.min(indicators.length * 5, 25);

  // Strong indicators add more confidence
  const strongIndicators = indicators.filter(i => i.strength === 'strong').length;
  confidence += strongIndicators * 5;

  return Math.min(confidence, 85); // Cap at 85 for heuristic
}

function inferIndicatorType(observation: string): EngagementIndicatorType {
  const lower = observation.toLowerCase();

  if (lower.includes('short') || lower.includes('brief') || lower.includes('minimal')) {
    return 'one_word_answers';
  }
  if (lower.includes('detail') || lower.includes('specific') || lower.includes('example')) {
    return 'response_specificity';
  }
  if (lower.includes('emotion') || lower.includes('feeling')) {
    return 'emotional_expression';
  }
  if (lower.includes('question')) {
    return 'question_asking';
  }
  if (lower.includes('reflect') || lower.includes('realize') || lower.includes('learn')) {
    return 'self_reflection';
  }
  if (lower.includes('confus') || lower.includes('unclear')) {
    return 'confusion_signals';
  }
  if (lower.includes('avoid') || lower.includes('deflect') || lower.includes('change topic')) {
    return 'deflection';
  }
  if (lower.includes('enthusiasm') || lower.includes('excited') || lower.includes('passionate')) {
    return 'enthusiasm_signals';
  }
  if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('move on')) {
    return 'fatigue_signals';
  }
  if (lower.includes('resistant') || lower.includes('defensive')) {
    return 'resistance_signals';
  }

  return 'response_specificity'; // Default
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ENGAGEMENT_PATTERNS,
};
