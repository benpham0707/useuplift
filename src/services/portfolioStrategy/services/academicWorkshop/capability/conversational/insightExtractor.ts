/**
 * Insight Extractor
 *
 * Extracts structured insights from conversational responses using a tiered approach:
 * 1. PRIMARY: LLM extraction (rich, nuanced understanding)
 * 2. FALLBACK: Heuristic extraction (reliable, catches common patterns)
 * 3. MINIMAL: Basic signal detection (always returns something useful)
 *
 * Philosophy:
 * - NEVER fail silently - always extract what we can
 * - LLM provides depth; heuristics provide reliability
 * - Conservative extraction with confidence scores
 * - Preserve raw quotes as evidence
 * - Layer insights from multiple extraction methods
 */

import { callClaude } from '../../../../../../lib/llm/claude';
import type { SubjectArea } from '../types';
import type {
  ExtractedInsight,
  ExtractedValues,
  InsightType,
  SentimentLevel,
  ExternalCircumstance,
  TeacherQuality,
  ClassEnvironment,
  Motivator,
  LearningPreference,
  ConversationTopic,
} from './types';

// ============================================================================
// HEURISTIC EXTRACTION PATTERNS
// ============================================================================

/**
 * Pattern definitions for heuristic extraction.
 * These catch common ways students express insights.
 */
const HEURISTIC_PATTERNS = {
  // Effort level patterns
  effort: {
    very_low: [
      /didn'?t\s+(really\s+)?try/i,
      /minimal\s+effort/i,
      /barely\s+(studied|worked)/i,
      /coasted\s+(through|by)/i,
      /slacked\s+off/i,
      /didn'?t\s+put\s+in\s+(much\s+)?work/i,
    ],
    low: [
      /didn'?t\s+work\s+(that\s+)?hard/i,
      /could\s+have\s+tried\s+harder/i,
      /not\s+my\s+best\s+effort/i,
      /half-?hearted/i,
    ],
    high: [
      /worked\s+(really\s+)?hard/i,
      /put\s+in\s+a\s+lot\s+of\s+(effort|work|time)/i,
      /studied\s+(a\s+lot|hard|constantly)/i,
      /gave\s+it\s+(my\s+)?(all|everything|best)/i,
      /hours\s+(of\s+)?(studying|work)/i,
      /really\s+tried/i,
    ],
    very_high: [
      /worked\s+my\s+(butt|ass)\s+off/i,
      /gave\s+(it\s+)?110%/i,
      /couldn'?t\s+have\s+worked\s+harder/i,
      /everything\s+I\s+had/i,
      /obsessed\s+over/i,
    ],
  },

  // Teacher quality patterns
  teacher: {
    excellent: [
      /amazing\s+teacher/i,
      /best\s+teacher/i,
      /incredible\s+(teacher|instructor)/i,
      /teacher\s+was\s+(amazing|incredible|fantastic)/i,
      /loved\s+(my|the)\s+teacher/i,
    ],
    good: [
      /good\s+teacher/i,
      /teacher\s+was\s+(good|helpful|great)/i,
      /liked\s+(my|the)\s+teacher/i,
      /teacher\s+helped/i,
    ],
    poor: [
      /bad\s+teacher/i,
      /teacher\s+was(n'?t)?\s+(bad|not\s+good|unhelpful)/i,
      /didn'?t\s+(like|enjoy)\s+(my|the)\s+teacher/i,
      /couldn'?t\s+explain/i,
      /confusing\s+(lectures?|explanations?)/i,
    ],
    terrible: [
      /terrible\s+teacher/i,
      /worst\s+teacher/i,
      /teacher\s+was\s+(terrible|awful|horrible)/i,
      /had\s+to\s+teach\s+(myself|ourselves)/i,
      /teacher\s+didn'?t\s+(care|help|teach)/i,
      /hated\s+(my|the)\s+teacher/i,
    ],
  },

  // Interest/enjoyment patterns - EXPANDED to catch natural language variations
  interest: {
    very_positive: [
      /love\s+(this|the|that)\s+subject/i,
      /really\s+(love|enjoy|like)\s+(it|this)/i,
      /passionate\s+about/i,
      /fascinated\s+by/i,
      /my\s+favorite/i,
      /absolutely\s+love/i,
      // NEW: Catch "I love [subject]" and "I really love [subject]"
      /\b(really\s+)?love\s+\w+/i,
      /\blove\s+(math|science|english|history|writing|reading|learning)/i,
      /fascinating\s+to\s+me/i,
      /it'?s?\s+fascinating/i,
      /enjoy\s+learning/i,
      /\bso\s+(much\s+)?fun\b/i,
      /\bsuper\s+(fun|interesting|cool)\b/i,
    ],
    positive: [
      /like\s+(this|the|that)\s+subject/i,
      /enjoy(ed)?\s+(it|this|the)/i,
      /interest(ed|ing)/i,
      /pretty\s+(cool|fun|interesting)/i,
      // NEW: More natural positive expressions
      /\bI\s+like\s+\w+/i,
      /kind\s+of\s+(enjoy|like|fun)/i,
      /not\s+bad\s+actually/i,
      /grew\s+to\s+(like|enjoy|appreciate)/i,
    ],
    negative: [
      /don'?t\s+(really\s+)?(like|enjoy)/i,
      /boring/i,
      /tedious/i,
      /not\s+(really\s+)?interest(ed|ing)/i,
      /couldn'?t\s+(care|stand)/i,
      // NEW: Additional negative patterns
      /don'?t\s+care\s+(about|for)/i,
      /never\s+(liked|enjoyed)/i,
      /not\s+my\s+cup\s+of\s+tea/i,
    ],
    very_negative: [
      /hate(d)?\s+(it|this|the)/i,
      /despise/i,
      /can'?t\s+stand/i,
      /worst\s+class/i,
      /dreaded/i,
      // NEW: More very negative patterns
      /\bhate\s+\w+/i,
      /absolutely\s+(hate|despise|loathe)/i,
      /torture/i,
      /nightmare/i,
    ],
  },

  // Difficulty patterns
  difficulty: {
    very_easy: [
      /super\s+easy/i,
      /breeze/i,
      /piece\s+of\s+cake/i,
      /no\s+problem/i,
      /effortless/i,
    ],
    easy: [
      /pretty\s+easy/i,
      /not\s+(that\s+)?hard/i,
      /came\s+(easy|naturally)/i,
      /clicks?\s+for\s+me/i,
      /didn'?t\s+struggle/i,
    ],
    hard: [
      /pretty\s+(hard|difficult|challenging)/i,
      /struggled\s+(a\s+bit|sometimes)/i,
      /challenging/i,
      /took\s+effort/i,
    ],
    very_hard: [
      /(really|super|very)\s+(hard|difficult|tough)/i,
      /struggled\s+(a\s+lot|constantly|so\s+much)/i,
      /hardest\s+(class|course)/i,
      /couldn'?t\s+(figure|understand|get)\s+(it|this)/i,
      /over\s+my\s+head/i,
    ],
  },

  // External circumstances patterns
  circumstances: {
    family: [
      /family\s+(issues?|problems?|stuff|crisis|situation)/i,
      /(parent|mom|dad|sibling|brother|sister)\s+(was|were|got|had)/i,
      /going\s+on\s+at\s+home/i,
      /home\s+(life|situation)/i,
      /family\s+(health|emergency)/i,
    ],
    health: [
      /(was|got|had)\s+(sick|ill|injured)/i,
      /health\s+(issues?|problems?)/i,
      /(hospital|surgery|medical)/i,
      /chronic\s+(illness|condition)/i,
    ],
    mental_health: [
      /(anxiety|depression|stress|burnout)/i,
      /mental\s+health/i,
      /overwhelmed/i,
      /breakdown/i,
      /couldn'?t\s+(cope|handle|deal)/i,
    ],
    transition: [
      /moved\s+(schools?|to)/i,
      /new\s+(school|town|city)/i,
      /transfer(red)?/i,
      /adjustment/i,
    ],
  },

  // Self-assessment patterns
  self_assessment: {
    strength: [
      /my\s+(strong\s+suit|strength|best\s+subject)/i,
      /always\s+been\s+good\s+at/i,
      /comes?\s+naturally/i,
      /my\s+thing/i,
      /excel\s+(at|in)/i,
      /one\s+of\s+my\s+(best|strongest)/i,
    ],
    weakness: [
      /my\s+weakness/i,
      /not\s+my\s+(strong\s+suit|strength|thing)/i,
      /always\s+struggled\s+(with|in)/i,
      /never\s+(been\s+)?good\s+at/i,
      /worst\s+subject/i,
    ],
  },

  // Grade reflection patterns
  grade_reflection: {
    accurate: [
      /grade\s+(reflects?|shows?|represents?)/i,
      /fair(ly)?\s+(graded|grade)/i,
      /deserved\s+(that|the)\s+grade/i,
      /got\s+what\s+I\s+(earned|deserved)/i,
    ],
    underrepresents: [
      /could\s+have\s+done\s+better/i,
      /capable\s+of\s+more/i,
      /doesn'?t\s+(reflect|show)/i,
      /not\s+(a\s+)?fair\s+(reflection|representation)/i,
      /knew\s+(more|better)\s+than/i,
      /bad\s+(test\s+)?(taker|at\s+tests)/i,
    ],
  },

  // Future intent patterns
  future_intent: {
    continue: [
      /want\s+to\s+(take|continue|pursue)/i,
      /planning\s+(to|on)\s+(take|continue)/i,
      /looking\s+forward\s+to/i,
      /can'?t\s+wait\s+to/i,
      /definitely\s+(taking|going\s+to)/i,
      /major\s+in/i,
    ],
    avoid: [
      /don'?t\s+want\s+to\s+(take|continue)/i,
      /never\s+(taking|doing)\s+that\s+again/i,
      /done\s+with/i,
      /avoiding/i,
      /not\s+going\s+to\s+(take|continue)/i,
    ],
  },
};

/**
 * Extract insights using heuristic pattern matching.
 * This is FAST, RELIABLE, and works WITHOUT API access.
 */
function extractWithHeuristics(
  message: string,
  topic: ConversationTopic
): ExtractedInsight[] {
  const insights: ExtractedInsight[] = [];
  const values: ExtractedValues = {};
  let overallSentiment: SentimentLevel | undefined;
  let confidence = 50; // Base confidence for heuristic extraction
  const keyStatements: string[] = [];
  const externalFactors: ExternalCircumstance[] = [];

  // Helper to find matching quote
  const findQuote = (patterns: RegExp[]): string | undefined => {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        // Return surrounding context
        const index = message.indexOf(match[0]);
        const start = Math.max(0, index - 20);
        const end = Math.min(message.length, index + match[0].length + 20);
        return message.substring(start, end).trim();
      }
    }
    return undefined;
  };

  // Check effort level
  if (HEURISTIC_PATTERNS.effort.very_high.some((p) => p.test(message))) {
    values.effortLevel = 5;
    confidence += 10;
    keyStatements.push('Reported maximum effort');
  } else if (HEURISTIC_PATTERNS.effort.high.some((p) => p.test(message))) {
    values.effortLevel = 4;
    confidence += 5;
    keyStatements.push('Reported high effort');
  } else if (HEURISTIC_PATTERNS.effort.very_low.some((p) => p.test(message))) {
    values.effortLevel = 1;
    confidence += 10;
    keyStatements.push('Reported minimal effort');
  } else if (HEURISTIC_PATTERNS.effort.low.some((p) => p.test(message))) {
    values.effortLevel = 2;
    confidence += 5;
    keyStatements.push('Reported low effort');
  }

  // Check teacher quality
  if (HEURISTIC_PATTERNS.teacher.excellent.some((p) => p.test(message))) {
    values.teacherQuality = 'excellent';
    confidence += 10;
  } else if (HEURISTIC_PATTERNS.teacher.good.some((p) => p.test(message))) {
    values.teacherQuality = 'good';
    confidence += 5;
  } else if (HEURISTIC_PATTERNS.teacher.terrible.some((p) => p.test(message))) {
    values.teacherQuality = 'terrible';
    confidence += 10;
    keyStatements.push('Reported terrible teacher quality');
  } else if (HEURISTIC_PATTERNS.teacher.poor.some((p) => p.test(message))) {
    values.teacherQuality = 'poor';
    confidence += 5;
    keyStatements.push('Reported poor teacher quality');
  }

  // Check interest/enjoyment
  if (HEURISTIC_PATTERNS.interest.very_positive.some((p) => p.test(message))) {
    values.enjoymentLevel = 5;
    values.intrinsicInterest = true;
    overallSentiment = 'very_positive';
    confidence += 10;
  } else if (HEURISTIC_PATTERNS.interest.positive.some((p) => p.test(message))) {
    values.enjoymentLevel = 4;
    values.intrinsicInterest = true;
    overallSentiment = 'positive';
    confidence += 5;
  } else if (HEURISTIC_PATTERNS.interest.very_negative.some((p) => p.test(message))) {
    values.enjoymentLevel = 1;
    values.intrinsicInterest = false;
    overallSentiment = 'very_negative';
    confidence += 10;
  } else if (HEURISTIC_PATTERNS.interest.negative.some((p) => p.test(message))) {
    values.enjoymentLevel = 2;
    values.intrinsicInterest = false;
    overallSentiment = 'negative';
    confidence += 5;
  }

  // Check difficulty
  if (HEURISTIC_PATTERNS.difficulty.very_hard.some((p) => p.test(message))) {
    values.perceivedDifficulty = 5;
    confidence += 5;
  } else if (HEURISTIC_PATTERNS.difficulty.hard.some((p) => p.test(message))) {
    values.perceivedDifficulty = 4;
  } else if (HEURISTIC_PATTERNS.difficulty.very_easy.some((p) => p.test(message))) {
    values.perceivedDifficulty = 1;
    confidence += 5;
  } else if (HEURISTIC_PATTERNS.difficulty.easy.some((p) => p.test(message))) {
    values.perceivedDifficulty = 2;
  }

  // Check external circumstances
  if (HEURISTIC_PATTERNS.circumstances.family.some((p) => p.test(message))) {
    externalFactors.push({
      type: 'family',
      description: 'Family circumstances mentioned',
      impact: 'major_negative',
    });
    confidence += 10;
  }
  if (HEURISTIC_PATTERNS.circumstances.health.some((p) => p.test(message))) {
    externalFactors.push({
      type: 'health',
      description: 'Health issues mentioned',
      impact: 'major_negative',
    });
    confidence += 10;
  }
  if (HEURISTIC_PATTERNS.circumstances.mental_health.some((p) => p.test(message))) {
    externalFactors.push({
      type: 'mental_health',
      description: 'Mental health challenges mentioned',
      impact: 'major_negative',
    });
    confidence += 10;
  }
  if (HEURISTIC_PATTERNS.circumstances.transition.some((p) => p.test(message))) {
    externalFactors.push({
      type: 'transition',
      description: 'School/location transition mentioned',
      impact: 'minor_negative',
    });
    confidence += 5;
  }

  if (externalFactors.length > 0) {
    values.externalFactors = externalFactors;
  }

  // Check self-assessment
  if (HEURISTIC_PATTERNS.self_assessment.strength.some((p) => p.test(message))) {
    values.selfAssessedStrength = true;
    confidence += 5;
    keyStatements.push('Self-identifies as strong in this area');
  } else if (HEURISTIC_PATTERNS.self_assessment.weakness.some((p) => p.test(message))) {
    values.selfAssessedChallenge = true;
    confidence += 5;
    keyStatements.push('Self-identifies as weak in this area');
  }

  // Check grade reflection
  if (HEURISTIC_PATTERNS.grade_reflection.accurate.some((p) => p.test(message))) {
    values.gradeReflectsAbility = true;
    values.gradeReflectsEffort = true;
  } else if (HEURISTIC_PATTERNS.grade_reflection.underrepresents.some((p) => p.test(message))) {
    values.gradeReflectsAbility = false;
    keyStatements.push('Believes grades underrepresent ability');
  }

  // Check future intent
  if (HEURISTIC_PATTERNS.future_intent.continue.some((p) => p.test(message))) {
    values.wantsToContinue = true;
    confidence += 5;
  } else if (HEURISTIC_PATTERNS.future_intent.avoid.some((p) => p.test(message))) {
    values.wantsToContinue = false;
    confidence += 5;
  }

  // Add key statements
  if (keyStatements.length > 0) {
    values.keyStatements = keyStatements;
  }

  // Adjust confidence based on message characteristics
  if (message.length > 200) confidence += 5;
  if (message.length > 400) confidence += 5;
  if (message.length < 30) confidence -= 15;

  // Only create insight if we found something
  const hasContent = Object.keys(values).length > 0;
  if (hasContent) {
    // Find a supporting quote (first significant pattern match)
    let supportingQuote: string | undefined;
    for (const category of Object.values(HEURISTIC_PATTERNS)) {
      for (const patterns of Object.values(category)) {
        if (Array.isArray(patterns)) {
          supportingQuote = findQuote(patterns);
          if (supportingQuote) break;
        }
      }
      if (supportingQuote) break;
    }

    insights.push({
      type: determineInsightType(values),
      scope: {
        course: topic.scope.course,
        subject: topic.scope.subject,
      },
      values,
      extractionConfidence: Math.min(85, confidence), // Cap heuristic confidence at 85
      supportingQuote,
      sentiment: overallSentiment,
      extractedAt: new Date(),
      extractionMethod: 'heuristic',
    });
  }

  return insights;
}

/**
 * Determine the insight type based on extracted values.
 */
function determineInsightType(values: ExtractedValues): InsightType {
  if (values.externalFactors && values.externalFactors.length > 0) {
    return 'circumstantial';
  }
  if (values.wantsToContinue !== undefined || values.specificFutureCourses) {
    return 'future_intent';
  }
  if (values.selfAssessedStrength !== undefined || values.selfAssessedChallenge !== undefined) {
    return 'self_assessment';
  }
  if (values.learningPreferences && values.learningPreferences.length > 0) {
    return 'learning_style';
  }
  if (values.motivators && values.motivators.length > 0) {
    return 'motivational';
  }
  return 'course_specific';
}

/**
 * Minimal extraction - detects basic signals when nothing else works.
 * ALWAYS returns something useful.
 */
function extractMinimalSignals(
  message: string,
  topic: ConversationTopic
): ExtractedInsight | null {
  // Sentiment detection based on word patterns
  const positiveWords = (message.match(/good|great|love|enjoy|like|easy|fun|interesting|amazing|best|happy|excited/gi) || []).length;
  const negativeWords = (message.match(/bad|hate|hard|difficult|boring|terrible|worst|struggle|frustrat|confus|stress/gi) || []).length;

  let sentiment: SentimentLevel = 'neutral';
  if (positiveWords > negativeWords + 1) {
    sentiment = positiveWords > 3 ? 'very_positive' : 'positive';
  } else if (negativeWords > positiveWords + 1) {
    sentiment = negativeWords > 3 ? 'very_negative' : 'negative';
  }

  // Only return if we detected something
  if (sentiment === 'neutral' && message.length < 50) {
    return null;
  }

  return {
    type: 'course_specific',
    scope: {
      course: topic.scope.course,
      subject: topic.scope.subject,
    },
    values: {
      keyStatements: [message.substring(0, 200)], // Capture what they said
    },
    extractionConfidence: 30, // Low confidence for minimal extraction
    sentiment,
    extractedAt: new Date(),
    extractionMethod: 'minimal',
  };
}

// ============================================================================
// EXTRACTION PROMPT
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured insights from student conversations about their academic experiences. Your job is to carefully analyze what students say and convert it into structured data.

IMPORTANT PRINCIPLES:
1. Be CONSERVATIVE - only extract what is clearly stated or strongly implied
2. If something is ambiguous, leave it null rather than guessing
3. Always include the exact quote that supports each insight
4. Provide a confidence score (0-100) for each extraction
5. Pay attention to emotional language and subtext

NUMERIC SCALES (1-5):
- 1 = Very low/negative (e.g., "I hated it", "minimal effort")
- 2 = Low/somewhat negative (e.g., "didn't like it much", "didn't try very hard")
- 3 = Moderate/neutral (e.g., "it was fine", "average effort")
- 4 = High/somewhat positive (e.g., "I liked it", "worked hard")
- 5 = Very high/positive (e.g., "I loved it", "gave it my all")

SENTIMENT LEVELS:
- very_positive: Strong enthusiasm, excitement, pride
- positive: Generally favorable, pleased
- neutral: Neither positive nor negative
- negative: Disappointed, frustrated, unhappy
- very_negative: Strong negative emotion, regret, anger`;

function buildExtractionPrompt(
  studentMessage: string,
  context: {
    topic: ConversationTopic;
    previousContext?: string;
    existingInsights?: string;
  }
): string {
  return `STUDENT'S MESSAGE:
"${studentMessage}"

CONVERSATION CONTEXT:
- Topic being discussed: ${context.topic.context}
- Question that was asked: "${context.topic.primaryQuestion}"
${context.previousContext ? `- Previous context: ${context.previousContext}` : ''}
${context.existingInsights ? `- What we already know: ${context.existingInsights}` : ''}

SCOPE OF THIS TOPIC:
- Course: ${context.topic.scope.course || 'Not specified'}
- Subject: ${context.topic.scope.subject || 'Not specified'}
- Timeframe: ${context.topic.scope.timeframe || 'Not specified'}

Extract structured insights from this response. Return a JSON object with this structure:

{
  "insightType": "course_specific" | "subject_general" | "circumstantial" | "motivational" | "self_assessment" | "learning_style" | "future_intent",

  "scope": {
    "course": string | null,
    "subject": string | null,
    "timeframe": string | null,
    "global": boolean
  },

  "values": {
    "effortLevel": 1-5 | null,
    "perceivedDifficulty": 1-5 | null,
    "enjoymentLevel": 1-5 | null,
    "engagementLevel": 1-5 | null,
    "confidenceLevel": 1-5 | null,
    "willingnessToChallenge": 1-5 | null,

    "gradeReflectsAbility": boolean | null,
    "gradeReflectsEffort": boolean | null,
    "intrinsicInterest": boolean | null,
    "wouldTakeAgain": boolean | null,
    "wantsToContinue": boolean | null,
    "selfAssessedStrength": boolean | null,
    "selfAssessedChallenge": boolean | null,

    "teacherQuality": "excellent" | "good" | "average" | "poor" | "terrible" | null,
    "classEnvironment": "supportive" | "challenging" | "competitive" | "chaotic" | "standard" | "toxic" | null,

    "externalFactors": [
      {
        "type": "health" | "mental_health" | "family" | "school" | "teacher" | "social" | "extracurricular" | "work" | "transition" | "other",
        "description": string,
        "impact": "major_negative" | "minor_negative" | "neutral" | "minor_positive" | "major_positive"
      }
    ],

    "motivators": ["intellectual_curiosity" | "achievement" | "mastery" | "recognition" | "future_goals" | "competition" | "approval" | "interest" | "obligation" | "fear_of_failure" | "social"],

    "learningPreferences": ["visual" | "auditory" | "reading_writing" | "kinesthetic" | "collaborative" | "independent" | "teacher_dependent" | "self_directed"],

    "keyStatements": [string],
    "specificFutureCourses": [string]
  },

  "extractionConfidence": 0-100,
  "supportingQuote": "the most relevant direct quote",
  "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",

  "additionalInsights": [
    {
      "insight": string,
      "confidence": 0-100,
      "quote": string
    }
  ]
}

Only include fields where you have clear evidence from the message. Leave others as null or empty arrays.
If you extract multiple distinct insights (e.g., about different subjects or timeframes), include them in additionalInsights.

Return ONLY valid JSON, no other text.`;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

export type ExtractionMethod = 'llm' | 'heuristic' | 'minimal' | 'skipped';

export interface ExtractionResult {
  success: boolean;
  insights: ExtractedInsight[];
  rawExtraction?: unknown;
  error?: string;
  /** The primary extraction method used */
  extractionMethod?: ExtractionMethod;
  /** Error from LLM if it failed */
  llmError?: string;
  /** Reason for skipping (if applicable) */
  reason?: string;
}

/**
 * Extract structured insights from a student's message using tiered extraction.
 *
 * TIER 1: LLM Extraction (primary - rich understanding)
 * TIER 2: Heuristic Extraction (fallback - reliable patterns)
 * TIER 3: Minimal Signal Detection (last resort - basic sentiment)
 *
 * The function ALWAYS returns insights if there's meaningful content.
 */
export async function extractInsights(
  studentMessage: string,
  topic: ConversationTopic,
  options: {
    previousContext?: string;
    existingInsights?: string;
    model?: 'haiku' | 'sonnet';
    skipLLM?: boolean; // For testing heuristics directly
  } = {}
): Promise<ExtractionResult> {
  const allInsights: ExtractedInsight[] = [];
  let llmSuccess = false;
  let llmError: string | undefined;

  // Skip extraction for very short messages
  if (studentMessage.trim().length < 10) {
    return {
      success: true,
      insights: [],
      extractionMethod: 'skipped',
      reason: 'Message too short for extraction',
    };
  }

  // =========================================================================
  // TIER 1: LLM Extraction (Primary)
  // =========================================================================
  if (!options.skipLLM) {
    try {
      const prompt = buildExtractionPrompt(studentMessage, {
        topic,
        previousContext: options.previousContext,
        existingInsights: options.existingInsights,
      });

      // Use Haiku for fast, cheap extraction
      const model = options.model === 'sonnet'
        ? 'claude-sonnet-4-5-20250929'
        : 'claude-haiku-4-5-20251001';

      const response = await callClaude({
        model,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      // Parse the JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawExtraction = JSON.parse(jsonMatch[0]);
        const llmInsights = parseExtractionToInsights(rawExtraction, topic);

        // Mark insights as LLM-extracted
        for (const insight of llmInsights) {
          insight.extractionMethod = 'llm';
        }

        allInsights.push(...llmInsights);
        llmSuccess = true;

        console.log(`[InsightExtractor] LLM extraction succeeded: ${llmInsights.length} insights`);
      } else {
        llmError = 'No JSON found in LLM response';
        console.warn('[InsightExtractor] LLM returned no valid JSON, falling back to heuristics');
      }
    } catch (error) {
      llmError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[InsightExtractor] LLM extraction failed: ${llmError}. Using heuristics.`);
    }
  }

  // =========================================================================
  // TIER 2: Heuristic Extraction (Fallback or Enhancement)
  // =========================================================================
  const heuristicInsights = extractWithHeuristics(studentMessage, topic);

  if (heuristicInsights.length > 0) {
    if (llmSuccess) {
      // LLM succeeded - merge heuristic insights to fill gaps
      const mergedInsights = mergeInsights(allInsights, heuristicInsights);
      allInsights.length = 0;
      allInsights.push(...mergedInsights);
      console.log(`[InsightExtractor] Merged LLM + heuristic insights: ${allInsights.length} total`);
    } else {
      // LLM failed - use heuristics as primary
      allInsights.push(...heuristicInsights);
      console.log(`[InsightExtractor] Heuristic extraction: ${heuristicInsights.length} insights`);
    }
  }

  // =========================================================================
  // TIER 3: Minimal Signal Detection (Last Resort)
  // =========================================================================
  if (allInsights.length === 0) {
    const minimalInsight = extractMinimalSignals(studentMessage, topic);
    if (minimalInsight) {
      allInsights.push(minimalInsight);
      console.log('[InsightExtractor] Minimal signal detection: captured basic sentiment');
    }
  }

  // Calibrate confidence for all insights based on message characteristics
  for (const insight of allInsights) {
    insight.extractionConfidence = calibrateConfidence(insight, studentMessage);
  }

  return {
    success: allInsights.length > 0 || studentMessage.trim().length < 50,
    insights: allInsights,
    extractionMethod: llmSuccess ? 'llm' : (heuristicInsights.length > 0 ? 'heuristic' : 'minimal'),
    llmError,
  };
}

/**
 * Merge LLM insights with heuristic insights, preferring LLM but filling gaps.
 */
function mergeInsights(
  llmInsights: ExtractedInsight[],
  heuristicInsights: ExtractedInsight[]
): ExtractedInsight[] {
  if (llmInsights.length === 0) return heuristicInsights;
  if (heuristicInsights.length === 0) return llmInsights;

  // Start with LLM insights as base
  const merged = [...llmInsights];

  // For each heuristic insight, check if it adds value
  for (const heuristic of heuristicInsights) {
    // Find matching LLM insight by scope
    const matchingLLM = merged.find(
      (llm) =>
        llm.scope.subject === heuristic.scope.subject &&
        llm.scope.course === heuristic.scope.course
    );

    if (!matchingLLM) {
      // No matching scope - add the heuristic insight
      merged.push(heuristic);
    } else {
      // Same scope - merge values, preferring LLM but filling gaps
      const mergedValues = { ...matchingLLM.values };

      for (const [key, value] of Object.entries(heuristic.values)) {
        const llmValue = matchingLLM.values[key as keyof ExtractedValues];

        // Only add heuristic value if LLM didn't extract it
        if (llmValue === undefined || llmValue === null) {
          (mergedValues as Record<string, unknown>)[key] = value;
        }
        // For arrays, merge unique values
        else if (Array.isArray(value) && Array.isArray(llmValue)) {
          const combined = [...new Set([...llmValue, ...value])];
          (mergedValues as Record<string, unknown>)[key] = combined;
        }
      }

      matchingLLM.values = mergedValues;

      // Boost confidence if heuristics confirm LLM findings
      const heuristicConfirmsLLM =
        (heuristic.values.effortLevel !== undefined && matchingLLM.values.effortLevel !== undefined) ||
        (heuristic.values.teacherQuality !== undefined && matchingLLM.values.teacherQuality !== undefined) ||
        (heuristic.sentiment !== undefined && matchingLLM.sentiment === heuristic.sentiment);

      if (heuristicConfirmsLLM) {
        matchingLLM.extractionConfidence = Math.min(95, matchingLLM.extractionConfidence + 5);
      }
    }
  }

  return merged;
}

// ============================================================================
// EXTRACTION PARSING
// ============================================================================

function parseExtractionToInsights(
  raw: Record<string, unknown>,
  topic: ConversationTopic
): ExtractedInsight[] {
  const insights: ExtractedInsight[] = [];

  // Parse main insight
  const mainInsight = parseMainInsight(raw, topic);
  if (mainInsight) {
    insights.push(mainInsight);
  }

  // Parse additional insights
  const additionalInsights = raw.additionalInsights as Array<{
    insight: string;
    confidence: number;
    quote: string;
  }> | undefined;

  if (additionalInsights && Array.isArray(additionalInsights)) {
    for (const additional of additionalInsights) {
      // Create a minimal insight from additional data
      insights.push({
        type: 'course_specific', // Default type
        scope: {
          course: topic.scope.course,
          subject: topic.scope.subject,
        },
        values: {
          keyStatements: [additional.insight],
        },
        extractionConfidence: additional.confidence || 50,
        supportingQuote: additional.quote,
        extractedAt: new Date(),
      });
    }
  }

  return insights;
}

function parseMainInsight(
  raw: Record<string, unknown>,
  topic: ConversationTopic
): ExtractedInsight | null {
  const values = raw.values as Record<string, unknown> | undefined;
  if (!values) return null;

  // Check if there's any actual content
  const hasContent = Object.values(values).some(
    (v) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );
  if (!hasContent) return null;

  const scope = raw.scope as { course?: string; subject?: string; timeframe?: string; global?: boolean } | undefined;

  return {
    type: parseInsightType(raw.insightType as string),
    scope: {
      course: scope?.course || topic.scope.course,
      subject: (scope?.subject || topic.scope.subject) as SubjectArea | undefined,
      timeframe: scope?.timeframe || topic.scope.timeframe,
      global: scope?.global || false,
    },
    values: parseValues(values),
    extractionConfidence: typeof raw.extractionConfidence === 'number' ? raw.extractionConfidence : 60,
    supportingQuote: typeof raw.supportingQuote === 'string' ? raw.supportingQuote : undefined,
    sentiment: parseSentiment(raw.sentiment as string),
    extractedAt: new Date(),
  };
}

function parseInsightType(type: string | undefined): InsightType {
  const validTypes: InsightType[] = [
    'course_specific',
    'subject_general',
    'circumstantial',
    'motivational',
    'self_assessment',
    'learning_style',
    'future_intent',
  ];

  if (type && validTypes.includes(type as InsightType)) {
    return type as InsightType;
  }

  return 'course_specific'; // Default
}

function parseSentiment(sentiment: string | undefined): SentimentLevel | undefined {
  const validSentiments: SentimentLevel[] = [
    'very_positive',
    'positive',
    'neutral',
    'negative',
    'very_negative',
  ];

  if (sentiment && validSentiments.includes(sentiment as SentimentLevel)) {
    return sentiment as SentimentLevel;
  }

  return undefined;
}

function parseValues(raw: Record<string, unknown>): ExtractedValues {
  const values: ExtractedValues = {};

  // Numeric values (1-5)
  if (isValidNumericValue(raw.effortLevel)) values.effortLevel = raw.effortLevel as number;
  if (isValidNumericValue(raw.perceivedDifficulty)) values.perceivedDifficulty = raw.perceivedDifficulty as number;
  if (isValidNumericValue(raw.enjoymentLevel)) values.enjoymentLevel = raw.enjoymentLevel as number;
  if (isValidNumericValue(raw.engagementLevel)) values.engagementLevel = raw.engagementLevel as number;
  if (isValidNumericValue(raw.confidenceLevel)) values.confidenceLevel = raw.confidenceLevel as number;
  if (isValidNumericValue(raw.willingnessToChallenge)) values.willingnessToChallenge = raw.willingnessToChallenge as number;

  // Boolean values
  if (typeof raw.gradeReflectsAbility === 'boolean') values.gradeReflectsAbility = raw.gradeReflectsAbility;
  if (typeof raw.gradeReflectsEffort === 'boolean') values.gradeReflectsEffort = raw.gradeReflectsEffort;
  if (typeof raw.intrinsicInterest === 'boolean') values.intrinsicInterest = raw.intrinsicInterest;
  if (typeof raw.wouldTakeAgain === 'boolean') values.wouldTakeAgain = raw.wouldTakeAgain;
  if (typeof raw.wantsToContinue === 'boolean') values.wantsToContinue = raw.wantsToContinue;
  if (typeof raw.selfAssessedStrength === 'boolean') values.selfAssessedStrength = raw.selfAssessedStrength;
  if (typeof raw.selfAssessedChallenge === 'boolean') values.selfAssessedChallenge = raw.selfAssessedChallenge;

  // Categorical values
  if (isValidTeacherQuality(raw.teacherQuality)) values.teacherQuality = raw.teacherQuality as TeacherQuality;
  if (isValidClassEnvironment(raw.classEnvironment)) values.classEnvironment = raw.classEnvironment as ClassEnvironment;

  // Arrays
  if (Array.isArray(raw.externalFactors)) {
    values.externalFactors = raw.externalFactors.filter(isValidExternalFactor) as ExternalCircumstance[];
  }
  if (Array.isArray(raw.motivators)) {
    values.motivators = raw.motivators.filter(isValidMotivator) as Motivator[];
  }
  if (Array.isArray(raw.learningPreferences)) {
    values.learningPreferences = raw.learningPreferences.filter(isValidLearningPreference) as LearningPreference[];
  }
  if (Array.isArray(raw.keyStatements)) {
    values.keyStatements = raw.keyStatements.filter((s): s is string => typeof s === 'string');
  }
  if (Array.isArray(raw.specificFutureCourses)) {
    values.specificFutureCourses = raw.specificFutureCourses.filter((s): s is string => typeof s === 'string');
  }

  return values;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidNumericValue(value: unknown): boolean {
  return typeof value === 'number' && value >= 1 && value <= 5;
}

function isValidTeacherQuality(value: unknown): boolean {
  return ['excellent', 'good', 'average', 'poor', 'terrible'].includes(value as string);
}

function isValidClassEnvironment(value: unknown): boolean {
  return ['supportive', 'challenging', 'competitive', 'chaotic', 'standard', 'toxic'].includes(value as string);
}

function isValidExternalFactor(factor: unknown): boolean {
  if (typeof factor !== 'object' || factor === null) return false;
  const f = factor as Record<string, unknown>;
  const validTypes = ['health', 'mental_health', 'family', 'school', 'teacher', 'social', 'extracurricular', 'work', 'transition', 'other'];
  const validImpacts = ['major_negative', 'minor_negative', 'neutral', 'minor_positive', 'major_positive'];
  return validTypes.includes(f.type as string) && validImpacts.includes(f.impact as string) && typeof f.description === 'string';
}

function isValidMotivator(value: unknown): boolean {
  const validMotivators = [
    'intellectual_curiosity', 'achievement', 'mastery', 'recognition',
    'future_goals', 'competition', 'approval', 'interest', 'obligation',
    'fear_of_failure', 'social',
  ];
  return validMotivators.includes(value as string);
}

function isValidLearningPreference(value: unknown): boolean {
  const validPreferences = [
    'visual', 'auditory', 'reading_writing', 'kinesthetic',
    'collaborative', 'independent', 'teacher_dependent', 'self_directed',
  ];
  return validPreferences.includes(value as string);
}

// ============================================================================
// BATCH EXTRACTION
// ============================================================================

/**
 * Extract insights from multiple messages (e.g., for processing conversation history).
 */
export async function extractInsightsBatch(
  messages: Array<{ message: string; topic: ConversationTopic }>,
  options: { model?: 'haiku' | 'sonnet' } = {}
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  for (const { message, topic } of messages) {
    const result = await extractInsights(message, topic, options);
    results.push(result);
  }

  return results;
}

// ============================================================================
// INSIGHT AGGREGATION
// ============================================================================

/**
 * Aggregate multiple insights about the same scope.
 */
export function aggregateInsights(insights: ExtractedInsight[]): ExtractedInsight | null {
  if (insights.length === 0) return null;
  if (insights.length === 1) return insights[0];

  // Use the most confident insight as the base
  const sorted = [...insights].sort((a, b) => b.extractionConfidence - a.extractionConfidence);
  const base = sorted[0];

  // Merge values from all insights, preferring higher confidence
  const mergedValues: ExtractedValues = { ...base.values };

  for (const insight of sorted.slice(1)) {
    for (const [key, value] of Object.entries(insight.values)) {
      if (value !== null && value !== undefined) {
        // Only override if base doesn't have this value
        if (mergedValues[key as keyof ExtractedValues] === undefined) {
          (mergedValues as Record<string, unknown>)[key] = value;
        }
        // For arrays, merge
        else if (Array.isArray(value) && Array.isArray(mergedValues[key as keyof ExtractedValues])) {
          const existing = mergedValues[key as keyof ExtractedValues] as unknown[];
          (mergedValues as Record<string, unknown>)[key] = [...new Set([...existing, ...value])];
        }
      }
    }
  }

  // Collect all supporting quotes
  const allQuotes = insights
    .filter((i) => i.supportingQuote)
    .map((i) => i.supportingQuote!);

  // Calculate average confidence
  const avgConfidence =
    insights.reduce((sum, i) => sum + i.extractionConfidence, 0) / insights.length;

  return {
    type: base.type,
    scope: base.scope,
    values: mergedValues,
    extractionConfidence: avgConfidence,
    supportingQuote: allQuotes.join(' | '),
    sentiment: base.sentiment,
    extractedAt: new Date(),
  };
}

// ============================================================================
// CONFIDENCE CALIBRATION
// ============================================================================

/**
 * Calibrate confidence based on message characteristics.
 */
export function calibrateConfidence(
  insight: ExtractedInsight,
  message: string
): number {
  let confidence = insight.extractionConfidence;

  // Boost confidence for longer, more detailed messages
  if (message.length > 200) confidence += 5;
  if (message.length > 500) confidence += 5;

  // Boost confidence if there are specific details
  if (/specific|exactly|definitely|absolutely/i.test(message)) confidence += 5;

  // Reduce confidence for hedging language
  if (/maybe|perhaps|not sure|i think|kind of|sort of/i.test(message)) confidence -= 10;

  // Reduce confidence for very short messages
  if (message.length < 50) confidence -= 10;

  // Keep within bounds
  return Math.max(10, Math.min(95, confidence));
}
