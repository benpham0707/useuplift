// @ts-nocheck
/**
 * Dynamic Response Generator
 *
 * Generates thoughtful, fluid conversation responses that:
 * - Feel natural and human-like, not mechanical or formulaic
 * - Connect insights across subjects and previous answers
 * - Maintain purposeful information gathering while being conversational
 * - Adapt to the student's communication style and emotional state
 * - Build genuine rapport while extracting valuable qualitative data
 *
 * Philosophy:
 * - Every question has a PURPOSE (what we need to learn)
 * - Every response shows we LISTENED (reference what they said)
 * - Every transition is SMOOTH (connect topics naturally)
 * - The conversation feels like talking to a CARING advisor
 */

import { callClaude, callClaudeWithFallback } from '../../../../../../lib/llm/claude';
import type {
  EngagementAssessment,
  ResponseStrategy,
  ConversationTopic,
  ConversationTurn,
  ExtractedInsight,
  ConversationProgress,
  StudentConversationPreferences,
  SubjectArea,
  ConversationState,
  PersonalDisclosure,
} from './types';
import { formatSubject } from './topicDetector';

// ============================================================================
// CONVERSATION MEMORY - Track key insights for cross-referencing
// ============================================================================

interface ConversationMemory {
  // Key quotes and moments to reference
  memorableQuotes: Array<{
    quote: string;
    subject?: SubjectArea;
    topic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    turnNumber: number; // NEW: Track when this quote was said
  }>;

  // Themes across subjects
  crossSubjectPatterns: string[];

  // Student's self-described strengths and challenges
  selfDescribedStrengths: string[];
  selfDescribedChallenges: string[];

  // External factors mentioned
  externalFactors: string[];

  // Their goals/aspirations
  statedGoals: string[];

  // Communication preferences observed
  usesHumor: boolean;
  prefersCasual: boolean;
  sharesEmotions: boolean;

  // NEW: Question deduplication tracking
  askedQuestions: Array<{
    questionText: string;
    normalizedKey: string; // For similarity matching
    subject?: SubjectArea;
    turnNumber: number;
  }>;

  // NEW: Topics already discussed
  discussedSubjects: Set<SubjectArea>;
  discussedCourses: Set<string>;

  // NEW: Important personal disclosures that should be acknowledged/referenced
  personalDisclosures: Array<{
    content: string;
    type: 'family' | 'health' | 'external_challenge' | 'personal_struggle' | 'achievement';
    turnNumber: number;
    acknowledged: boolean;
  }>;

  // NEW: Track used acknowledgments to avoid repetition
  usedAcknowledgments: Set<string>;
}

/**
 * Persisted state fields that survive across conversation turns.
 * These are passed in from ConversationState and updated.
 */
interface PersistedMemoryState {
  usedAcknowledgments?: Set<string>;
  askedQuestionKeys?: Set<string>;
  personalDisclosures?: PersonalDisclosure[];
  discussedSubjects?: Set<SubjectArea>;
}

function buildConversationMemory(
  history: ConversationTurn[],
  insights: ExtractedInsight[],
  persistedState?: PersistedMemoryState
): ConversationMemory {
  const memory: ConversationMemory = {
    memorableQuotes: [],
    crossSubjectPatterns: [],
    selfDescribedStrengths: [],
    selfDescribedChallenges: [],
    externalFactors: [],
    statedGoals: [],
    usesHumor: false,
    prefersCasual: false,
    sharesEmotions: false,
    askedQuestions: [],
    // CRITICAL: Initialize from persisted state instead of empty
    discussedSubjects: persistedState?.discussedSubjects ?? new Set(),
    discussedCourses: new Set(),
    // CRITICAL: Initialize from persisted state to avoid acknowledgment repetition
    personalDisclosures: (persistedState?.personalDisclosures ?? []).map(d => ({
      content: d.content,
      type: d.type,
      turnNumber: d.turnNumber,
      acknowledged: d.acknowledged,
    })),
    // CRITICAL: Use persisted acknowledgments to avoid repetition
    usedAcknowledgments: persistedState?.usedAcknowledgments ?? new Set(),
  };

  // NEW: Track all AI questions for deduplication
  let turnIndex = 0;
  for (const turn of history) {
    if (turn.role === 'ai') {
      // Extract the question from AI message
      const question = turn.message;
      const normalizedKey = normalizeQuestionForComparison(question);
      const subject = turn.topic?.scope?.subject as SubjectArea | undefined;

      memory.askedQuestions.push({
        questionText: question,
        normalizedKey,
        subject,
        turnNumber: turnIndex,
      });

      // Track discussed subjects and courses
      if (subject) {
        memory.discussedSubjects.add(subject);
      }
      if (turn.topic?.scope?.course) {
        memory.discussedCourses.add(turn.topic.scope.course.toLowerCase());
      }
    }
    turnIndex++;
  }

  // Analyze conversation history
  const studentMessages = history.filter(t => t.role === 'student');
  let studentTurnIndex = 0;

  for (const turn of studentMessages) {
    const msg = turn.message.toLowerCase();

    // Detect communication style
    if (msg.includes('haha') || msg.includes('lol') || msg.includes('😂')) {
      memory.usesHumor = true;
    }
    if (msg.includes('totally') || msg.includes('super') || msg.includes('honestly')) {
      memory.prefersCasual = true;
    }
    if (msg.includes('frustrated') || msg.includes('stressed') || msg.includes('excited') ||
        msg.includes('loved') || msg.includes('hated')) {
      memory.sharesEmotions = true;
    }

    // Enhanced personal disclosure detection with significance and context
    const extractedDisclosures = extractPersonalDisclosures(turn.message, studentTurnIndex, turn.topic?.scope?.subject as SubjectArea | undefined);

    // Only add disclosures that we haven't already tracked
    for (const disclosure of extractedDisclosures) {
      // Check if we already have this disclosure (by content similarity)
      const isDuplicate = memory.personalDisclosures.some(existing =>
        existing.content.toLowerCase().includes(disclosure.content.toLowerCase().substring(0, 30)) ||
        disclosure.content.toLowerCase().includes(existing.content.toLowerCase().substring(0, 30))
      );

      if (!isDuplicate) {
        memory.personalDisclosures.push(disclosure);
      }
    }

    // Extract memorable quotes
    if (turn.message.length > 30) {
      const subject = turn.topic?.scope?.subject;
      const sentiment = msg.includes('love') || msg.includes('enjoy') || msg.includes('great')
        ? 'positive'
        : msg.includes('hate') || msg.includes('tough') || msg.includes('struggled')
          ? 'negative'
          : 'neutral';

      memory.memorableQuotes.push({
        quote: extractBestQuote(turn.message),
        subject: subject as SubjectArea | undefined,
        topic: turn.topic?.context || 'general',
        sentiment,
        turnNumber: studentTurnIndex,
      });
    }

    studentTurnIndex++;
  }

  // Extract patterns from insights
  for (const insight of insights) {
    // Self-assessments
    if (insight.values.selfAssessedStrength) {
      memory.selfDescribedStrengths.push(
        insight.scope.subject ? formatSubject(insight.scope.subject) : 'a subject'
      );
    }
    if (insight.values.selfAssessedChallenge) {
      memory.selfDescribedChallenges.push(
        insight.scope.subject ? formatSubject(insight.scope.subject) : 'a subject'
      );
    }

    // External factors
    if (insight.values.externalFactors) {
      for (const factor of insight.values.externalFactors) {
        memory.externalFactors.push(factor.description);
      }
    }

    // Future intentions
    if (insight.values.specificFutureCourses) {
      memory.statedGoals.push(...insight.values.specificFutureCourses);
    }
  }

  // Detect cross-subject patterns
  if (memory.selfDescribedStrengths.length > 1) {
    memory.crossSubjectPatterns.push(
      `Strong in multiple areas: ${memory.selfDescribedStrengths.join(', ')}`
    );
  }
  if (memory.externalFactors.length > 0) {
    memory.crossSubjectPatterns.push(
      `External factors affected their work: ${memory.externalFactors[0]}`
    );
  }

  return memory;
}

// ============================================================================
// PERSONAL DISCLOSURE EXTRACTION
// ============================================================================

interface InternalDisclosure {
  content: string;
  type: 'family' | 'health' | 'external_challenge' | 'personal_struggle' | 'achievement';
  turnNumber: number;
  acknowledged: boolean;
  significance: 'high' | 'medium' | 'low';
  context?: string;
  relatedSubject?: SubjectArea;
}

/**
 * Comprehensive disclosure pattern definitions with significance levels.
 * High significance = directly impacts academic performance or reveals major life events
 * Medium significance = affects academics but less directly
 * Low significance = interesting context but less critical
 */
const DISCLOSURE_PATTERNS = {
  family: {
    high: [
      { pattern: /(?:my\s+)?(?:mom|dad|mother|father|parent)\s+(?:got|was|became)\s+(?:really\s+)?(?:sick|ill|diagnosed)/i, extract: true },
      { pattern: /(?:parent|mom|dad|mother|father)\s+passed\s+away/i, extract: true },
      { pattern: /family\s+(?:emergency|crisis|tragedy)/i, extract: true },
      { pattern: /lost\s+(?:my\s+)?(?:mom|dad|parent|grandparent)/i, extract: true },
      { pattern: /taking\s+care\s+of\s+(?:my\s+)?(?:sick|ill)\s+(?:parent|mom|dad|sibling)/i, extract: true },
    ],
    medium: [
      { pattern: /parents?\s+(?:got\s+)?divorced/i, extract: true },
      { pattern: /(?:family|parents?)\s+(?:split|separated)/i, extract: true },
      { pattern: /(?:moved|had\s+to\s+move)\s+(?:to\s+)?(?:a\s+)?(?:different|new)\s+(?:city|state|country)/i, extract: true },
      { pattern: /(?:parent|dad|mom)\s+lost\s+(?:their|his|her)\s+job/i, extract: true },
      { pattern: /family\s+(?:financial|money)\s+(?:problems?|issues?|struggles?)/i, extract: true },
    ],
    low: [
      { pattern: /family\s+stuff/i, extract: false },
      { pattern: /things?\s+(?:at|with)\s+home/i, extract: false },
    ],
  },
  health: {
    high: [
      { pattern: /(?:i\s+)?(?:was|got)\s+(?:diagnosed\s+with|hospitalized\s+for)/i, extract: true },
      { pattern: /(?:had|have)\s+(?:surgery|operation)/i, extract: true },
      { pattern: /mental\s+health\s+(?:crisis|breakdown|issues)/i, extract: true },
      { pattern: /(?:severe|serious|bad)\s+(?:depression|anxiety)/i, extract: true },
      { pattern: /(?:eating\s+disorder|anorexia|bulimia)/i, extract: true },
      { pattern: /(?:attempted|thought\s+about)\s+(?:suicide|self-harm)/i, extract: true },
    ],
    medium: [
      { pattern: /(?:i\s+)?(?:was|got)\s+really\s+sick/i, extract: true },
      { pattern: /missed\s+(?:a\s+lot\s+of|several|many)\s+(?:days?|weeks?|school)/i, extract: true },
      { pattern: /(?:struggled|dealing)\s+with\s+(?:anxiety|depression)/i, extract: true },
      { pattern: /chronic\s+(?:illness|condition|pain)/i, extract: true },
    ],
    low: [
      { pattern: /(?:wasn't|wasn't)\s+feeling\s+well/i, extract: false },
      { pattern: /had\s+a\s+(?:cold|flu|bug)/i, extract: false },
    ],
  },
  external_challenge: {
    high: [
      { pattern: /(?:transferred|switched)\s+(?:schools?|to\s+a\s+new)/i, extract: true },
      { pattern: /(?:moved|had\s+to\s+move)\s+(?:mid-year|during\s+the\s+year)/i, extract: true },
      { pattern: /(?:homeless|lost\s+our\s+house|evicted)/i, extract: true },
      { pattern: /(?:natural\s+disaster|hurricane|fire\s+destroyed)/i, extract: true },
    ],
    medium: [
      { pattern: /had\s+to\s+(?:work|get\s+a\s+job)\s+(?:to\s+help|after\s+school)/i, extract: true },
      { pattern: /(?:language\s+barrier|learned?\s+english)/i, extract: true },
      { pattern: /(?:first\s+generation|immigrant\s+family)/i, extract: true },
      { pattern: /(?:didn't|don't)\s+have\s+(?:internet|computer|resources)/i, extract: true },
    ],
    low: [
      { pattern: /(?:different|new)\s+(?:teacher|school)/i, extract: false },
    ],
  },
  personal_struggle: {
    high: [
      { pattern: /(?:really|completely)\s+(?:broke\s+down|fell\s+apart)/i, extract: true },
      { pattern: /(?:wanted|thought\s+about)\s+(?:giving|to\s+give)\s+up/i, extract: true },
      { pattern: /(?:couldn't|could\s+not)\s+(?:handle|cope|deal\s+with)/i, extract: true },
      { pattern: /(?:burned?\s+out|exhausted\s+myself)/i, extract: true },
    ],
    medium: [
      { pattern: /(?:really|genuinely)\s+struggled\s+(?:with|to)/i, extract: true },
      { pattern: /(?:lost|losing)\s+(?:motivation|interest|hope)/i, extract: true },
      { pattern: /(?:felt|feeling)\s+(?:overwhelmed|lost|stuck)/i, extract: true },
      { pattern: /(?:hard|difficult|tough)\s+(?:time|period|semester)/i, extract: true },
    ],
    low: [
      { pattern: /(?:bit|little)\s+(?:hard|tough|challenging)/i, extract: false },
    ],
  },
  achievement: {
    high: [
      { pattern: /(?:won|received|got)\s+(?:a\s+)?(?:national|state|prestigious)\s+(?:award|recognition)/i, extract: true },
      { pattern: /(?:published|got\s+published)/i, extract: true },
      { pattern: /(?:accepted|admitted)\s+(?:to|into)\s+(?:a\s+)?(?:competitive|prestigious|top)/i, extract: true },
      { pattern: /(?:founded|started)\s+(?:a\s+)?(?:company|organization|nonprofit)/i, extract: true },
    ],
    medium: [
      { pattern: /(?:made|got\s+on)\s+(?:the\s+)?(?:varsity|team|squad)/i, extract: true },
      { pattern: /(?:won|placed|got)\s+(?:first|second|third|1st|2nd|3rd)/i, extract: true },
      { pattern: /(?:became|elected|chosen\s+as)\s+(?:captain|president|leader)/i, extract: true },
      { pattern: /(?:really\s+)?proud\s+of\s+(?:myself|what\s+i)/i, extract: true },
    ],
    low: [
      { pattern: /did\s+(?:well|okay|good)/i, extract: false },
    ],
  },
};

/**
 * Extract personal disclosures from a student message with significance levels.
 * This function identifies meaningful personal context that should be remembered
 * and potentially referenced in future conversation turns.
 */
function extractPersonalDisclosures(
  message: string,
  turnNumber: number,
  relatedSubject?: SubjectArea
): InternalDisclosure[] {
  const disclosures: InternalDisclosure[] = [];
  const msg = message.toLowerCase();

  // Track which types we've already found to avoid duplicates in same message
  const foundTypes = new Set<string>();

  for (const [type, significanceLevels] of Object.entries(DISCLOSURE_PATTERNS)) {
    for (const [significance, patterns] of Object.entries(significanceLevels)) {
      for (const patternDef of patterns) {
        if (patternDef.pattern.test(msg) && !foundTypes.has(type)) {
          foundTypes.add(type);

          // Extract the relevant content (sentence containing the match)
          const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 10);
          let content: string;
          let context: string | undefined;

          if (patternDef.extract) {
            // Find the sentence that matched
            const matchedSentence = sentences.find(s =>
              patternDef.pattern.test(s.toLowerCase())
            );

            if (matchedSentence) {
              content = matchedSentence.trim();

              // Get surrounding context (previous and next sentences if available)
              const sentenceIndex = sentences.indexOf(matchedSentence);
              const contextParts: string[] = [];

              if (sentenceIndex > 0) {
                contextParts.push(sentences[sentenceIndex - 1].trim());
              }
              if (sentenceIndex < sentences.length - 1) {
                contextParts.push(sentences[sentenceIndex + 1].trim());
              }

              if (contextParts.length > 0) {
                context = contextParts.join(' ');
              }
            } else {
              // Fall back to first 100 characters
              content = message.substring(0, 100).trim();
            }
          } else {
            // For low-significance patterns, just note it happened
            content = message.substring(0, 60).trim();
          }

          disclosures.push({
            content,
            type: type as InternalDisclosure['type'],
            turnNumber,
            acknowledged: false,
            significance: significance as 'high' | 'medium' | 'low',
            context,
            relatedSubject,
          });

          break; // Move to next type after finding a match
        }
      }
    }
  }

  return disclosures;
}

/**
 * Get unacknowledged disclosures sorted by significance for referencing.
 * High significance disclosures should be acknowledged first.
 */
export function getUnacknowledgedDisclosures(
  disclosures: InternalDisclosure[]
): InternalDisclosure[] {
  return disclosures
    .filter(d => !d.acknowledged)
    .sort((a, b) => {
      const sigOrder = { high: 0, medium: 1, low: 2 };
      return sigOrder[a.significance] - sigOrder[b.significance];
    });
}

/**
 * Build a contextual reference to a disclosure for use in responses.
 * Returns a natural language phrase that references what they shared.
 */
export function buildDisclosureReference(disclosure: InternalDisclosure): string {
  switch (disclosure.type) {
    case 'family':
      if (disclosure.significance === 'high') {
        return `You mentioned dealing with a difficult family situation`;
      } else if (disclosure.significance === 'medium') {
        return `Given the family changes you mentioned`;
      } else {
        return `You mentioned some family stuff`;
      }

    case 'health':
      if (disclosure.significance === 'high') {
        return `Considering what you shared about your health`;
      } else if (disclosure.significance === 'medium') {
        return `Given the health challenges you mentioned`;
      } else {
        return `You mentioned not feeling well during that time`;
      }

    case 'external_challenge':
      if (disclosure.significance === 'high') {
        return `That's a significant transition you went through`;
      } else if (disclosure.significance === 'medium') {
        return `Considering the challenges you mentioned`;
      } else {
        return `You mentioned some changes`;
      }

    case 'personal_struggle':
      if (disclosure.significance === 'high') {
        return `I really appreciate you sharing how hard that was`;
      } else if (disclosure.significance === 'medium') {
        return `You mentioned struggling with that`;
      } else {
        return `That sounds like it was challenging`;
      }

    case 'achievement':
      if (disclosure.significance === 'high') {
        return `That's an impressive accomplishment - `;
      } else if (disclosure.significance === 'medium') {
        return `That's really cool that you achieved that`;
      } else {
        return `That's great to hear`;
      }
  }
}

function extractBestQuote(message: string): string {
  // Find the most meaningful sentence
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 15);

  // Prefer sentences with emotion or specificity
  const scored = sentences.map(s => {
    let score = 0;
    const lower = s.toLowerCase();
    if (lower.includes('because')) score += 2;
    if (lower.includes('really')) score += 1;
    if (lower.includes('actually')) score += 1;
    if (lower.includes('honestly')) score += 2;
    if (lower.includes('love') || lower.includes('hate')) score += 2;
    if (s.length > 30 && s.length < 80) score += 1; // Good length
    return { sentence: s.trim(), score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.sentence || message.substring(0, 60);
}

// ============================================================================
// QUESTION DEDUPLICATION
// ============================================================================

/**
 * Normalize a question for comparison to detect duplicates/near-duplicates.
 * Extracts key concepts: subject, course names, and question intent.
 */
function normalizeQuestionForComparison(question: string): string {
  const lower = question.toLowerCase();

  // Extract key elements
  const keyElements: string[] = [];

  // Subject detection
  const subjectPatterns = [
    { pattern: /\b(math|algebra|calculus|geometry|statistics)\b/i, key: 'math' },
    { pattern: /\b(science|biology|chemistry|physics|chem)\b/i, key: 'science' },
    { pattern: /\b(english|writing|reading|literature|lang)\b/i, key: 'english' },
    { pattern: /\b(history|social studies|government|economics|apush)\b/i, key: 'history' },
    { pattern: /\b(spanish|french|chinese|latin|foreign language)\b/i, key: 'foreign_language' },
    { pattern: /\bap chem(istry)?\b/i, key: 'ap_chemistry' },
    { pattern: /\bap calc(ulus)?\b/i, key: 'ap_calculus' },
    { pattern: /\bap (us )?history\b/i, key: 'ap_history' },
  ];

  for (const { pattern, key } of subjectPatterns) {
    if (pattern.test(lower)) {
      keyElements.push(key);
    }
  }

  // Intent detection
  const intentPatterns = [
    { pattern: /how (was|did|felt|feel|experience)/i, key: 'experience_query' },
    { pattern: /what made|what was|tell me about/i, key: 'description_query' },
    { pattern: /why (did|was|were)/i, key: 'reason_query' },
    { pattern: /affect|impact|influence/i, key: 'impact_query' },
    { pattern: /confidence|confident/i, key: 'confidence_query' },
    { pattern: /interest|interested|computer science|major|cs\b/i, key: 'interest_query' },
    // NEW: Future/looking ahead questions
    { pattern: /looking ahead|future|excited about|want to take|planning to/i, key: 'future_query' },
    { pattern: /continue|continuing|see yourself/i, key: 'continuation_query' },
    { pattern: /biggest lesson|learned from|advice.*freshman/i, key: 'reflection_query' },
    { pattern: /typical day|day-to-day|usually prepare/i, key: 'routine_query' },
    { pattern: /extracurricular|hobbies|study session/i, key: 'external_query' },
    // NEW: Subject-specific patterns (to detect subject duplication)
    { pattern: /let's talk about|how would you describe|what's your relationship/i, key: 'subject_intro_query' },
    { pattern: /foreign language|spanish|french|chinese|german|latin/i, key: 'foreign_language_subject' },
    { pattern: /social studies|history|apush|government|economics/i, key: 'social_studies_subject' },
    { pattern: /english|writing|literature|reading|essays/i, key: 'english_subject' },
    { pattern: /math|calculus|algebra|geometry|statistics/i, key: 'math_subject' },
    { pattern: /science|chemistry|biology|physics|ap chem|ap bio/i, key: 'science_subject' },
  ];

  for (const { pattern, key } of intentPatterns) {
    if (pattern.test(lower)) {
      keyElements.push(key);
    }
  }

  // Sort for consistent comparison
  return keyElements.sort().join('|');
}

/**
 * Check if a proposed question is too similar to one already asked.
 * Returns true if the question should be skipped.
 */
function isQuestionDuplicate(
  proposedQuestion: string,
  memory: ConversationMemory,
  threshold: number = 0.7 // Allow some variation
): { isDuplicate: boolean; previousTurn?: number; reason?: string } {
  const normalizedProposed = normalizeQuestionForComparison(proposedQuestion);

  // Check for exact normalized match
  for (const asked of memory.askedQuestions) {
    if (normalizedProposed === asked.normalizedKey && normalizedProposed.length > 0) {
      return {
        isDuplicate: true,
        previousTurn: asked.turnNumber,
        reason: `Same core concepts: ${normalizedProposed}`,
      };
    }

    // Check for high overlap (e.g., 3 out of 4 key elements match)
    const proposedElements = normalizedProposed.split('|').filter(Boolean);
    const askedElements = asked.normalizedKey.split('|').filter(Boolean);

    if (proposedElements.length > 0 && askedElements.length > 0) {
      const intersection = proposedElements.filter(e => askedElements.includes(e));
      const overlapRatio = intersection.length / Math.max(proposedElements.length, askedElements.length);

      if (overlapRatio >= threshold) {
        return {
          isDuplicate: true,
          previousTurn: asked.turnNumber,
          reason: `High concept overlap (${Math.round(overlapRatio * 100)}%): ${intersection.join(', ')}`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Generate an alternative question when the proposed one is a duplicate.
 * Uses a variety of question types to keep conversation fresh.
 * NEW: Prioritizes subject coverage balance to ensure all subjects get explored.
 */
function generateAlternativeQuestion(
  memory: ConversationMemory,
  currentTopic: ConversationTopic | null,
  nextTopic: ConversationTopic | null
): string {
  // Pool of alternative question templates - organized by category for better selection
  const alternativeQuestions = {
    // Future-focused questions
    future: [
      "Looking ahead, what subjects are you most excited about taking in the future?",
      "If you could take any class next year, what would it be and why?",
      "What skills do you want to develop before college?",
      "Are there any AP or advanced classes you're planning to take?",
    ],

    // Reflection questions
    reflection: [
      "What's the biggest lesson you've learned from your academic experiences so far?",
      "If you could go back and give yourself advice as a freshman, what would it be?",
      "What's surprised you most about your high school experience?",
      "How have your academic interests changed since freshman year?",
    ],

    // Learning style questions
    learning: [
      "How do you usually prepare for a big test or project?",
      "Do you learn better on your own or with others?",
      "What makes a class really engaging for you?",
      "When you're stuck on a hard concept, what do you usually do?",
    ],

    // External context questions
    external: [
      "Are there any extracurriculars or hobbies that connect to your academic interests?",
      "Has anyone particularly influenced how you think about academics?",
      "What does a typical study session look like for you?",
      "Is there anything outside of school that affects how you approach your classes?",
    ],

    // Meta/wrap-up questions
    meta: [
      "What else is important for me to understand about your academic journey?",
      "Is there anything about school that we haven't talked about that matters to you?",
      "What would you want colleges to know about you beyond your grades?",
    ],
  };

  // PRIORITY 1: Subject coverage balance - find subjects we haven't discussed
  const allSubjects: SubjectArea[] = ['math', 'science', 'english', 'social_studies', 'foreign_language'];
  const undiscussedSubjects = allSubjects.filter(s => !memory.discussedSubjects.has(s));

  // Prioritize subjects that are completely undiscussed
  if (undiscussedSubjects.length > 0) {
    // Rotate through undiscussed subjects to ensure coverage
    const newSubject = undiscussedSubjects[Math.floor(Math.random() * undiscussedSubjects.length)];

    // Subject-specific question templates with variety
    const subjectQuestionTemplates = [
      `I'd love to hear about ${formatSubject(newSubject)}. How has that been for you?`,
      `What's your relationship with ${formatSubject(newSubject)} like?`,
      `Tell me about ${formatSubject(newSubject)} - is it something you enjoy or more of a requirement?`,
      `How would you describe your experience with ${formatSubject(newSubject)}?`,
      `Let's talk about ${formatSubject(newSubject)}. How confident do you feel in that area?`,
      `I'm curious about ${formatSubject(newSubject)} - what's it been like for you?`,
    ];

    // Shuffle and find a non-duplicate
    const shuffled = [...subjectQuestionTemplates].sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      const dupCheck = isQuestionDuplicate(q, memory);
      if (!dupCheck.isDuplicate) {
        // Mark subject as discussed
        memory.discussedSubjects.add(newSubject);
        return q;
      }
    }
  }

  // PRIORITY 2: If all subjects discussed, try cross-subject patterns
  if (memory.selfDescribedStrengths.length > 0 && memory.selfDescribedChallenges.length > 0) {
    const patternQuestions = [
      `You mentioned ${memory.selfDescribedStrengths[0]} comes naturally while ${memory.selfDescribedChallenges[0]} is harder. What do you think makes that difference for you?`,
      `It seems like you have a different relationship with ${memory.selfDescribedStrengths[0]} compared to ${memory.selfDescribedChallenges[0]}. Can you tell me more about that?`,
      `Do you notice any patterns between the subjects you find easier versus harder?`,
    ];

    for (const patternQuestion of patternQuestions) {
      const dupCheck = isQuestionDuplicate(patternQuestion, memory);
      if (!dupCheck.isDuplicate) {
        return patternQuestion;
      }
    }
  }

  // PRIORITY 3: Reference personal disclosures if available
  if (memory.personalDisclosures.length > 0) {
    const disclosure = memory.personalDisclosures.find(d => !d.acknowledged);
    if (disclosure) {
      disclosure.acknowledged = true;
      const disclosureQuestions = [
        `Earlier you mentioned some challenges you faced. How did that experience shape how you approach academics now?`,
        `You shared something personal earlier - I'm wondering how those experiences influenced your perspective on school?`,
        `Given what you mentioned before about difficult times, how has that affected your academic journey?`,
      ];

      for (const q of disclosureQuestions) {
        const dupCheck = isQuestionDuplicate(q, memory);
        if (!dupCheck.isDuplicate) {
          return q;
        }
      }
    }
  }

  // PRIORITY 4: Cycle through question categories to maintain variety
  const questionCategories = Object.keys(alternativeQuestions) as Array<keyof typeof alternativeQuestions>;
  const shuffledCategories = [...questionCategories].sort(() => Math.random() - 0.5);

  for (const category of shuffledCategories) {
    const questionsInCategory = alternativeQuestions[category];
    const shuffledQuestions = [...questionsInCategory].sort(() => Math.random() - 0.5);

    for (const altQ of shuffledQuestions) {
      const dupCheck = isQuestionDuplicate(altQ, memory);
      if (!dupCheck.isDuplicate) {
        return altQ;
      }
    }
  }

  // ABSOLUTE FALLBACK: Generate a truly unique fallback
  const turnCount = memory.askedQuestions.length;
  return `We've covered a lot! Is there anything else about your academic experience that you think is important - something we might have missed?`;
}

// ============================================================================
// PURPOSE-DRIVEN QUESTION CONTEXT
// ============================================================================

interface QuestionPurpose {
  // What specific information we're trying to learn
  primaryGoal: string;

  // Why this matters for the student's profile
  profileImportance: string;

  // How this connects to what we already know
  connectionToKnown: string;

  // What would be a "complete" answer
  completionCriteria: string[];
}

function getQuestionPurpose(
  topic: ConversationTopic | null,
  progress: ConversationProgress,
  memory: ConversationMemory
): QuestionPurpose {
  if (!topic) {
    return {
      primaryGoal: 'Understand their overall academic experience',
      profileImportance: 'Foundational context for all other analysis',
      connectionToKnown: memory.crossSubjectPatterns[0] || 'Building initial understanding',
      completionCriteria: ['General satisfaction', 'Key highlights or challenges'],
    };
  }

  switch (topic.type) {
    case 'grade_anomaly':
      return {
        primaryGoal: `Understand why ${topic.scope.course || topic.scope.subject} grade doesn't match their typical pattern`,
        profileImportance: 'Reveals external factors, teaching quality, or genuine capability',
        connectionToKnown: memory.selfDescribedChallenges.length > 0
          ? `They mentioned ${memory.selfDescribedChallenges[0]} is hard - is this related?`
          : 'Looking for patterns that explain grade variations',
        completionCriteria: [
          'Effort level in this class',
          'External factors if any',
          'Teacher quality',
          'Whether grade reflects true ability',
        ],
      };

    case 'difficulty_transition':
      return {
        primaryGoal: `Understand their experience moving to harder coursework in ${formatSubject(topic.scope.subject!)}`,
        profileImportance: 'Shows resilience, growth mindset, and readiness for college rigor',
        connectionToKnown: memory.selfDescribedStrengths.includes(formatSubject(topic.scope.subject!))
          ? 'They said this is a strength - how did they handle the challenge?'
          : 'Understanding their response to increased difficulty',
        completionCriteria: [
          'How the transition felt',
          'What strategies they used',
          'Whether they felt prepared',
        ],
      };

    case 'subject_overview':
      return {
        primaryGoal: `Get holistic picture of their relationship with ${formatSubject(topic.scope.subject!)}`,
        profileImportance: 'Establishes baseline for subject-specific insights',
        connectionToKnown: memory.statedGoals.length > 0
          ? `How does this relate to their goal of ${memory.statedGoals[0]}?`
          : 'Building subject context',
        completionCriteria: [
          'Overall feeling about the subject',
          'Interest level',
          'Confidence level',
        ],
      };

    case 'trend_exploration':
      return {
        primaryGoal: 'Understand what caused the change in their academic performance',
        profileImportance: 'Identifies growth patterns or challenges over time',
        connectionToKnown: memory.externalFactors.length > 0
          ? `Could be related to: ${memory.externalFactors[0]}`
          : 'Looking for what drove the change',
        completionCriteria: [
          'When the change started',
          'What caused it',
          'How they responded',
        ],
      };

    case 'circumstance_exploration':
      return {
        primaryGoal: 'Understand external factors affecting academic performance',
        profileImportance: 'Context that explains gaps between grades and true capability',
        connectionToKnown: memory.externalFactors.length > 0
          ? `Building on earlier mention of ${memory.externalFactors[0]}`
          : 'Understanding the full picture',
        completionCriteria: [
          'Nature of the circumstance',
          'Which subjects/periods affected',
          'How they managed it',
        ],
      };

    default:
      return {
        primaryGoal: topic.context,
        profileImportance: 'Additional context for complete profile',
        connectionToKnown: 'Expanding our understanding',
        completionCriteria: topic.targetInsights,
      };
  }
}

// ============================================================================
// NATURAL CONVERSATION BUILDING BLOCKS
// ============================================================================

const ACKNOWLEDGMENTS = {
  // When they share something difficult
  empathetic: [
    "That sounds really tough.",
    "I can imagine that was hard.",
    "That makes total sense that it affected you.",
    "That's a lot to deal with, especially during school.",
    // NEW: More empathetic options for variety
    "I really appreciate you sharing that.",
    "That must have been incredibly challenging.",
    "It takes courage to talk about that.",
    "That kind of experience shapes you in real ways.",
    "I can see how that would be difficult.",
    "That's a heavy thing to carry, especially as a student.",
    "Thanks for trusting me with that.",
    "I hear you - that's not easy to go through.",
  ],

  // When they share something positive
  celebratory: [
    "That's awesome!",
    "I love hearing that.",
    "That's really cool.",
    "It shows when you genuinely enjoy something.",
    // NEW: More celebratory options for variety
    "That's really exciting!",
    "I can tell you light up talking about this.",
    "That passion really comes through.",
    "It's clear this means a lot to you.",
    "That's fantastic!",
    "You sound really proud of that - as you should be.",
    "That's the kind of thing that makes school worth it.",
    "I love that energy!",
  ],

  // When they give insight
  appreciative: [
    "That's really helpful to know.",
    "I appreciate you explaining that.",
    "That gives me a much better picture.",
    "Thanks for being so honest about it.",
    // NEW: More appreciative options for variety
    "That context is super valuable.",
    "I hadn't thought about it that way.",
    "That's a really thoughtful observation.",
    "I appreciate you going into that detail.",
    "That's exactly the kind of thing I wanted to understand.",
    "Thanks for walking me through that.",
    "That perspective makes a lot of sense.",
    "I can see the full picture now.",
  ],

  // Neutral/bridging
  neutral: [
    "That makes sense.",
    "I hear you.",
    "Got it.",
    "Interesting.",
    // NEW: More neutral options for variety
    "Okay, that tracks.",
    "I see what you mean.",
    "That's good to know.",
    "Fair enough.",
    "Noted.",
    "Understood.",
    "That's helpful context.",
    "Right, right.",
  ],
};

const TRANSITIONS = {
  // Connecting similar topics
  similar: [
    "Speaking of {connection}, ",
    "That reminds me - ",
    "Building on that, ",
    "Along those lines, ",
  ],

  // Contrasting topics
  contrast: [
    "On a different note, ",
    "Shifting gears a bit - ",
    "Something else I'm curious about: ",
    "Let's talk about something different. ",
  ],

  // Deepening current topic
  deeper: [
    "Tell me more about ",
    "I'm curious - ",
    "What was ",
    "Can you walk me through ",
  ],

  // Wrapping up a topic
  wrapUp: [
    "Before we move on, ",
    "One more thing about this: ",
    "Last question on this - ",
  ],
};

const CONNECTIVE_OBSERVATIONS = [
  "You mentioned earlier that {previous}. How does that connect to {current}?",
  "I'm noticing a pattern - {pattern}. Does that resonate with you?",
  "It sounds like {observation}. Is that fair to say?",
  "So if I'm understanding right, {summary}?",
];

// ============================================================================
// MAIN RESPONSE GENERATION
// ============================================================================

export interface GenerateResponseInput {
  studentMessage: string;
  engagement: EngagementAssessment;
  extractedInsights: ExtractedInsight[];
  currentTopic: ConversationTopic | null;
  nextTopic: ConversationTopic | null;
  conversationHistory: ConversationTurn[];
  progress: ConversationProgress;
  studentPreferences?: StudentConversationPreferences;
  shouldContinue: boolean;
  /**
   * When true, we detected potential disengagement but should offer
   * topic choices to the student rather than automatically switching.
   * This gives the student agency to choose whether to continue on the
   * current topic or move elsewhere.
   */
  offerTopicChoices?: boolean;
  /**
   * Conversation state for persisted memory fields.
   * This allows acknowledgments, questions, and disclosures to persist across turns.
   */
  conversationState?: ConversationState;
}

export interface GeneratedResponse {
  message: string;
  strategy: ResponseStrategy;
  reasoning: string;
  suggestedResponses?: string[];
  /** The core question asked (for tracking/deduplication) */
  questionAsked?: string;
  /**
   * Updated persisted state to write back to ConversationState.
   * Contains acknowledgments used, questions asked, disclosures tracked.
   */
  updatedPersistedState?: {
    usedAcknowledgments: Set<string>;
    askedQuestionKeys: Set<string>;
    personalDisclosures: PersonalDisclosure[];
    discussedSubjects: Set<SubjectArea>;
  };
}

/**
 * Generate a thoughtful, natural response that advances the conversation
 * while building rapport and gathering needed information.
 */
export async function generateDynamicResponse(
  input: GenerateResponseInput,
  options: { model?: 'haiku' | 'sonnet'; useLLM?: boolean } = {}
): Promise<GeneratedResponse> {
  const { useLLM = true, model = 'haiku' } = options;

  // Build conversation memory for cross-referencing
  // CRITICAL: Pass in persisted state from ConversationState to maintain continuity
  const persistedState: PersistedMemoryState = {
    usedAcknowledgments: input.conversationState?.usedAcknowledgments,
    askedQuestionKeys: input.conversationState?.askedQuestionKeys,
    personalDisclosures: input.conversationState?.personalDisclosures,
    discussedSubjects: input.conversationState?.discussedSubjects,
  };

  const memory = buildConversationMemory(
    input.conversationHistory,
    input.extractedInsights,
    persistedState
  );

  // Determine strategy based on engagement and context
  const strategy = determineResponseStrategy(input, memory);

  // Get the purpose of our next question
  const purpose = getQuestionPurpose(input.nextTopic || input.currentTopic, input.progress, memory);

  let response: GeneratedResponse;

  if (useLLM) {
    try {
      response = await generateResponseWithLLM(input, strategy, purpose, memory, model);
    } catch (error) {
      console.warn('[DynamicResponseGenerator] LLM failed, using enhanced template:', error);
      response = generateEnhancedTemplateResponse(input, strategy, purpose, memory);
    }
  } else {
    response = generateEnhancedTemplateResponse(input, strategy, purpose, memory);
  }

  // CRITICAL: Return updated persisted state to be saved back to ConversationState
  // Convert internal personalDisclosures format to the state format with full context
  const updatedDisclosures: PersonalDisclosure[] = memory.personalDisclosures.map(d => {
    // Type assertion to access the extended InternalDisclosure properties
    const internalD = d as InternalDisclosure;
    return {
      content: d.content,
      type: d.type,
      turnNumber: d.turnNumber,
      acknowledged: d.acknowledged,
      // Preserve significance from extraction, or default to medium
      significance: internalD.significance ?? 'medium',
      // Preserve context if available
      context: internalD.context,
      // Preserve related subject if available
      relatedSubject: internalD.relatedSubject,
    };
  });

  response.updatedPersistedState = {
    usedAcknowledgments: memory.usedAcknowledgments,
    askedQuestionKeys: new Set(memory.askedQuestions.map(q => q.normalizedKey)),
    personalDisclosures: updatedDisclosures,
    discussedSubjects: memory.discussedSubjects,
  };

  return response;
}

/**
 * Determine response strategy based on multiple factors.
 *
 * CRITICAL: This function now integrates stay-on-topic logic to prevent
 * premature pivots when the student has shared something significant.
 * The key principle is: when someone trusts you with something important,
 * you don't immediately change the subject.
 */
function determineResponseStrategy(
  input: GenerateResponseInput,
  memory: ConversationMemory
): ResponseStrategy {
  const { engagement, extractedInsights, currentTopic, nextTopic, progress, shouldContinue, offerTopicChoices } = input;

  // Completion state
  if (!shouldContinue) {
    return 'summarize_progress';
  }

  // Priority: confusion needs immediate addressing
  if (engagement.isConfused) {
    return 'rephrase_question';
  }

  // Priority: student explicitly wants to change topic - respect their wishes
  if (engagement.wantsTopicChange && nextTopic) {
    return 'change_topic';
  }

  // ═══════════════════════════════════════════════════════════════════
  // STAY-ON-TOPIC CHECK: Before considering any topic change, check if
  // we should stay with what the student just shared
  // ═══════════════════════════════════════════════════════════════════
  const stayCheck = shouldStayOnTopic(input, memory);

  // Check for unacknowledged high-significance disclosures
  const unacknowledgedHigh = memory.personalDisclosures.filter(
    d => !d.acknowledged && (d as InternalDisclosure).significance === 'high'
  );

  // If student just shared something significant that needs acknowledgment,
  // we should validate and follow up, NOT change topics
  if (unacknowledgedHigh.length > 0) {
    // They trusted us with something important - acknowledge it
    if (engagement.emotionalTone === 'negative' || engagement.depthLevel === 'deep') {
      // They're sharing something difficult - validate and encourage
      return 'validate_and_encourage';
    }
    // Probe deeper into what they shared
    return 'probe_deeper';
  }

  // If we should stay on topic for other reasons (deep sharing, unexplored follow-ups)
  if (stayCheck.stay) {
    if (engagement.type === 'highly_engaged' || engagement.depthLevel === 'deep') {
      return 'probe_deeper';
    }
    // Share an observation that connects their sharing to the broader context
    if (memory.crossSubjectPatterns.length > 0) {
      return 'share_observation';
    }
    return 'continue_normally';
  }

  // ═══════════════════════════════════════════════════════════════════
  // NORMAL STRATEGY DETERMINATION (when stay-on-topic doesn't apply)
  // ═══════════════════════════════════════════════════════════════════

  // NEW: If flagged to offer topic choices (potential disengagement),
  // give the student agency to choose direction rather than auto-switching
  if (offerTopicChoices) {
    return 'offer_topic_choices';
  }

  // If they gave a rich, detailed response - probe deeper
  if (engagement.type === 'highly_engaged' && engagement.depthLevel === 'deep') {
    // Check if we got good insights
    if (extractedInsights.length > 0) {
      // Maybe connect to something earlier
      if (memory.crossSubjectPatterns.length > 0) {
        return 'share_observation';
      }
      return 'probe_deeper';
    }
  }

  // If they mentioned something that connects to earlier
  if (hasConnectionToEarlier(input.studentMessage, memory)) {
    return 'share_observation';
  }

  // If we got insights and engagement is decent, consider transitioning
  // BUT only if there are no unacknowledged medium-significance disclosures
  const unacknowledgedMedium = memory.personalDisclosures.filter(
    d => !d.acknowledged && (d as InternalDisclosure).significance === 'medium'
  );

  if (extractedInsights.length > 0 && engagement.level >= 50) {
    // If there are medium-significance disclosures, acknowledge them first
    if (unacknowledgedMedium.length > 0) {
      return 'validate_and_encourage';
    }
    // Good place to transition
    if (nextTopic && nextTopic.type !== currentTopic?.type) {
      return 'change_topic';
    }
    return 'continue_normally';
  }

  // Handle different engagement types
  switch (engagement.type) {
    case 'highly_engaged':
      return 'probe_deeper';

    case 'engaged':
      return 'continue_normally';

    case 'neutral':
      // Try to spark more engagement
      if (memory.memorableQuotes.length > 0) {
        return 'share_observation';
      }
      if (engagement.depthLevel === 'surface') {
        return 'offer_examples';
      }
      return 'validate_and_encourage';

    case 'disengaged':
      // Need creative re-engagement
      if (progress.pacingStatus === 'stalled') {
        return 'open_ended_invite';
      }
      // Reference something they were engaged about before
      const positiveQuote = memory.memorableQuotes.find(q => q.sentiment === 'positive');
      if (positiveQuote) {
        return 'share_observation';
      }
      return 'change_topic';

    case 'resistant':
      return 'take_a_break';

    case 'overwhelmed':
      return 'take_a_break';

    case 'confused':
      return 'offer_examples';
  }

  return 'continue_normally';
}

function hasConnectionToEarlier(message: string, memory: ConversationMemory): boolean {
  const lower = message.toLowerCase();

  // Check if they mentioned something that connects to previous insights
  for (const strength of memory.selfDescribedStrengths) {
    if (lower.includes(strength.toLowerCase())) return true;
  }
  for (const challenge of memory.selfDescribedChallenges) {
    if (lower.includes(challenge.toLowerCase())) return true;
  }
  for (const goal of memory.statedGoals) {
    if (lower.includes(goal.toLowerCase())) return true;
  }

  return false;
}

/**
 * Build comprehensive context about personal disclosures for the LLM.
 * This ensures the LLM understands what the student has shared and can respond appropriately.
 */
function buildDisclosureContext(memory: ConversationMemory): string {
  const disclosures = memory.personalDisclosures;
  if (disclosures.length === 0) return '';

  const unacknowledged = disclosures.filter(d => !d.acknowledged);
  const acknowledged = disclosures.filter(d => d.acknowledged);

  const sections: string[] = [];

  // Critical: Unacknowledged disclosures that MUST be addressed
  if (unacknowledged.length > 0) {
    const highPriority = unacknowledged.filter(d => (d as InternalDisclosure).significance === 'high');
    const mediumPriority = unacknowledged.filter(d => (d as InternalDisclosure).significance === 'medium');

    if (highPriority.length > 0) {
      sections.push(`🔴 CRITICAL - MUST ACKNOWLEDGE (high significance):
${highPriority.map(d => `  - ${d.type.toUpperCase()}: "${d.content.substring(0, 80)}${d.content.length > 80 ? '...' : ''}"
    Context: ${(d as InternalDisclosure).context || 'N/A'}
    Related to: ${(d as InternalDisclosure).relatedSubject ? formatSubject((d as InternalDisclosure).relatedSubject!) : 'general'}`).join('\n')}`);
    }

    if (mediumPriority.length > 0) {
      sections.push(`🟡 SHOULD ACKNOWLEDGE (medium significance):
${mediumPriority.map(d => `  - ${d.type}: "${d.content.substring(0, 60)}..."`).join('\n')}`);
    }
  }

  // Context: Previously acknowledged disclosures (can reference for continuity)
  if (acknowledged.length > 0) {
    sections.push(`Previously acknowledged (can reference for continuity):
${acknowledged.map(d => `  - ${d.type}: "${d.content.substring(0, 40)}..." (turn ${d.turnNumber})`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Determine if we should stay on the current topic based on:
 * 1. Unacknowledged high-significance disclosures
 * 2. Student just shared something deeply personal
 * 3. There's more to explore on this topic before moving on
 */
function shouldStayOnTopic(
  input: GenerateResponseInput,
  memory: ConversationMemory
): { stay: boolean; reason: string } {
  // Check for unacknowledged high-significance disclosures
  const unacknowledgedHigh = memory.personalDisclosures.filter(
    d => !d.acknowledged && (d as InternalDisclosure).significance === 'high'
  );

  if (unacknowledgedHigh.length > 0) {
    return {
      stay: true,
      reason: `Student shared something significant (${unacknowledgedHigh[0].type}) that hasn't been properly acknowledged. Stay on topic to show we're listening.`,
    };
  }

  // Check if student just shared something that warrants follow-up
  const studentMsg = input.studentMessage.toLowerCase();
  const deepSharingIndicators = [
    'mom got sick', 'dad got sick', 'parent', 'family', 'health',
    'really struggled', 'broke down', 'gave up', 'couldn\'t cope',
    'honestly', 'to be honest', 'the truth is', 'actually',
    'nobody knows', 'i never told', 'first time i\'m saying',
  ];

  const hasDeepSharing = deepSharingIndicators.some(ind => studentMsg.includes(ind));

  if (hasDeepSharing && input.engagement.depthLevel === 'deep') {
    return {
      stay: true,
      reason: 'Student is sharing deeply. Probe further before changing topics.',
    };
  }

  // Check if current topic has unexplored follow-ups
  if (input.currentTopic?.followUpQuestions && input.currentTopic.followUpQuestions.length > 0) {
    const unaskedFollowUps = input.currentTopic.followUpQuestions.filter(
      q => !isQuestionDuplicate(q, memory).isDuplicate
    );
    if (unaskedFollowUps.length > 0 && input.engagement.level >= 60) {
      return {
        stay: true,
        reason: `Topic has ${unaskedFollowUps.length} unexplored follow-up questions and student is engaged.`,
      };
    }
  }

  return { stay: false, reason: 'OK to transition' };
}

/**
 * Build cross-subject pattern insights for the LLM to weave into responses.
 */
function buildCrossSubjectContext(memory: ConversationMemory): string {
  const patterns: string[] = [];

  // Strength vs challenge patterns
  if (memory.selfDescribedStrengths.length > 0 && memory.selfDescribedChallenges.length > 0) {
    patterns.push(`CONTRAST PATTERN: Strong in ${memory.selfDescribedStrengths.join(', ')} but struggles with ${memory.selfDescribedChallenges.join(', ')}`);
  }

  // Teacher impact patterns
  const teacherMentions = memory.memorableQuotes.filter(q =>
    q.quote.toLowerCase().includes('teacher') || q.quote.toLowerCase().includes('professor')
  );
  if (teacherMentions.length > 0) {
    patterns.push(`TEACHER IMPACT: Student has mentioned teacher quality ${teacherMentions.length} times - this matters to them`);
  }

  // Effort vs outcome patterns
  if (memory.externalFactors.length > 0) {
    patterns.push(`EXTERNAL FACTORS: ${memory.externalFactors.join(', ')}`);
  }

  // Goals and aspirations
  if (memory.statedGoals.length > 0) {
    patterns.push(`STATED GOALS: ${memory.statedGoals.join(', ')}`);
  }

  // Discussed subjects coverage
  const allSubjects: SubjectArea[] = ['math', 'science', 'english', 'social_studies', 'foreign_language'];
  const discussed = Array.from(memory.discussedSubjects);
  const undiscussed = allSubjects.filter(s => !memory.discussedSubjects.has(s));

  if (discussed.length > 0) {
    patterns.push(`COVERAGE: Discussed ${discussed.map(formatSubject).join(', ')}${undiscussed.length > 0 ? ` | Still need: ${undiscussed.map(formatSubject).join(', ')}` : ''}`);
  }

  return patterns.length > 0 ? patterns.join('\n') : '';
}

/**
 * Generate response using LLM with rich context.
 *
 * LLM-FIRST DESIGN PHILOSOPHY:
 * The LLM should drive the conversation naturally. We provide rich context about:
 * 1. Personal disclosures that need acknowledgment
 * 2. Cross-subject patterns to weave into responses
 * 3. Stay-on-topic signals to prevent premature pivots
 * 4. Student communication style to mirror
 *
 * Templates are EMERGENCY FALLBACK ONLY.
 */
async function generateResponseWithLLM(
  input: GenerateResponseInput,
  strategy: ResponseStrategy,
  purpose: QuestionPurpose,
  memory: ConversationMemory,
  model: 'haiku' | 'sonnet'
): Promise<GeneratedResponse> {
  const {
    studentMessage,
    engagement,
    extractedInsights,
    currentTopic,
    nextTopic,
    conversationHistory,
    progress,
  } = input;

  // Determine if we should stay on topic
  const stayOnTopic = shouldStayOnTopic(input, memory);

  // Build rich context for LLM
  const recentHistory = conversationHistory.slice(-10); // More context
  const historyText = recentHistory
    .map(t => `${t.role === 'ai' ? 'Advisor' : 'Student'}: ${t.message}`)
    .join('\n\n');

  // Build disclosure context - CRITICAL for genuine responses
  const disclosureContext = buildDisclosureContext(memory);

  // Build cross-subject patterns
  const crossSubjectContext = buildCrossSubjectContext(memory);

  // Meaningful quotes to potentially reference (with turn context)
  const quotesToReference = memory.memorableQuotes
    .slice(-5)
    .map(q => `Turn ${q.turnNumber}: "${q.quote}" (${q.topic}, ${q.sentiment})`)
    .join('\n');

  // What we've learned so far
  const currentUnderstanding = progress.currentUnderstanding.length > 0
    ? progress.currentUnderstanding.join('\n- ')
    : 'Building initial understanding of this student';

  // Communication style to match
  const styleDescription = [];
  if (memory.prefersCasual) styleDescription.push('casual/informal language');
  if (memory.usesHumor) styleDescription.push('includes humor/lightness');
  if (memory.sharesEmotions) styleDescription.push('emotionally expressive');
  if (!memory.prefersCasual && !memory.usesHumor && !memory.sharesEmotions) {
    styleDescription.push('neutral/reserved - warm but not too casual');
  }

  // Build the comprehensive prompt
  const prompt = `You are having a genuine, caring conversation with a high school student about their academic journey. Your role is to understand them deeply - not just their grades, but the STORY behind them - so you can help them present themselves authentically in college applications.

═══════════════════════════════════════════════════════════════════
CONVERSATION SO FAR:
═══════════════════════════════════════════════════════════════════
${historyText}

═══════════════════════════════════════════════════════════════════
THEIR LATEST MESSAGE:
═══════════════════════════════════════════════════════════════════
"${studentMessage}"

═══════════════════════════════════════════════════════════════════
ENGAGEMENT READING:
═══════════════════════════════════════════════════════════════════
- Level: ${engagement.level}/100 (${engagement.type})
- Emotional tone: ${engagement.emotionalTone}
- Depth of sharing: ${engagement.depthLevel}
${engagement.isConfused ? '⚠️ CONFUSED - clarify gently, maybe give an example' : ''}
${engagement.wantsTopicChange ? '⚠️ WANTS TO MOVE ON - respect this, don\'t push' : ''}

${disclosureContext ? `═══════════════════════════════════════════════════════════════════
⭐ PERSONAL DISCLOSURES (CRITICAL):
═══════════════════════════════════════════════════════════════════
${disclosureContext}

IMPORTANT: If there are unacknowledged disclosures above, you MUST:
1. Genuinely acknowledge what they shared (not formulaic "that sounds hard")
2. Show you understand the weight of it
3. Connect it to the academic context naturally
4. Don't immediately pivot to a new topic - stay with them in this moment
` : ''}
${crossSubjectContext ? `═══════════════════════════════════════════════════════════════════
PATTERNS & INSIGHTS:
═══════════════════════════════════════════════════════════════════
${crossSubjectContext}
` : ''}
${quotesToReference ? `═══════════════════════════════════════════════════════════════════
MEMORABLE QUOTES (reference to show you're listening):
═══════════════════════════════════════════════════════════════════
${quotesToReference}
` : ''}
═══════════════════════════════════════════════════════════════════
WHAT WE UNDERSTAND ABOUT THEM:
═══════════════════════════════════════════════════════════════════
${currentUnderstanding}

═══════════════════════════════════════════════════════════════════
THEIR COMMUNICATION STYLE:
═══════════════════════════════════════════════════════════════════
${styleDescription.join(', ')}

═══════════════════════════════════════════════════════════════════
RESPONSE STRATEGY: ${strategy}
${stayOnTopic.stay ? `\n⚠️ STAY ON TOPIC: ${stayOnTopic.reason}` : ''}
═══════════════════════════════════════════════════════════════════

PURPOSE OF YOUR RESPONSE:
- Goal: ${purpose.primaryGoal}
- Why it matters: ${purpose.profileImportance}
- Looking for: ${purpose.completionCriteria.slice(0, 3).join(', ')}

═══════════════════════════════════════════════════════════════════
HOW TO RESPOND:
═══════════════════════════════════════════════════════════════════

1. GENUINELY ACKNOWLEDGE what they shared
   - If they shared something difficult, don't use canned phrases like "that sounds tough"
   - Actually respond to the SPECIFIC thing they mentioned
   - Show you understand the weight of what they're saying

2. CONNECT to their earlier words when relevant
   - Reference specific quotes or moments from the conversation
   - "You mentioned earlier that [specific thing]..."
   - This shows you've been listening, not just interviewing

3. ${stayOnTopic.stay ? 'STAY ON THIS TOPIC - probe deeper, don\'t pivot yet' : 'TRANSITION NATURALLY if appropriate'}
   - ${stayOnTopic.stay ? stayOnTopic.reason : 'Move smoothly to explore more'}

4. ASK with genuine curiosity
   - Frame questions like you actually want to understand, not like you're checking boxes
   - One question at a time - don't overwhelm them

STRATEGIES BY TYPE:
${strategy === 'probe_deeper' ? '→ Dig into the specific thing they just shared. What about it? Why? How did it feel?' : ''}
${strategy === 'share_observation' ? '→ Connect something they said earlier to now. "I notice that..." or "Earlier you mentioned X, and now you\'re saying Y..."' : ''}
${strategy === 'rephrase_question' ? '→ They didn\'t understand. Try a simpler version, maybe with an example.' : ''}
${strategy === 'change_topic' ? '→ Smoothly acknowledge the current topic, then bridge to the new one naturally.' : ''}
${strategy === 'validate_and_encourage' ? '→ Make them feel heard and valued. Then gently invite them to share more.' : ''}
${strategy === 'open_ended_invite' ? '→ Give them complete freedom. What do THEY want to talk about?' : ''}
${strategy === 'take_a_break' ? '→ Check in on them. Are they okay? Want to pause or switch to something lighter?' : ''}
${strategy === 'offer_topic_choices' ? '→ Give them 2-3 options for where to go next. Let THEM choose.' : ''}

═══════════════════════════════════════════════════════════════════

Your response should be 2-4 sentences. Sound like a real person who genuinely cares about this student - not a chatbot, not an interviewer, but someone who actually wants to understand them.

CRITICAL: If they shared something personal/difficult (family issues, health, struggles), DO NOT immediately pivot to academic questions. Acknowledge it genuinely first. They trusted you with something real.

Respond in JSON format:
{
  "message": "<your response - natural, warm, specific to what they said>",
  "suggestedResponses": ["<likely response 1>", "<likely response 2>", "<likely response 3>"],
  "reasoning": "<brief explanation of your approach>"
}`;

  const modelId = model === 'sonnet'
    ? 'claude-sonnet-4-20250514'
    : 'claude-haiku-4-5-20251001';

  // Use callClaudeWithFallback for graceful degradation on timeout
  const response = await callClaudeWithFallback({
    model: modelId,
    system: `You are a warm, perceptive college admissions advisor having a genuine conversation with a high school student. You're not conducting an interview - you're truly trying to understand this person so you can help them tell their authentic story.

YOUR CORE IDENTITY:
- You're genuinely curious about people and their experiences
- You remember what they've said and weave it naturally into conversation
- You pick up on emotional undertones and respond appropriately
- You don't rush through topics - when something matters, you stay with it
- You make students feel HEARD and UNDERSTOOD, not interrogated

ABSOLUTELY NEVER:
- Use formulaic responses ("That sounds tough", "I appreciate you sharing")
- Rush past personal disclosures to get to the next question
- Ask multiple questions in one response
- Sound like you're reading from a script
- Ignore the emotional weight of what they shared
- Be so focused on gathering information that you forget to be human

ALWAYS:
- Respond to the SPECIFIC thing they said, not a generic version of it
- Reference earlier parts of the conversation naturally
- Match their communication style (casual vs. formal, emotional vs. factual)
- Give them space when they share something heavy
- Be genuinely interested, not performatively interested`,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 600,
    temperature: 0.85, // Higher for more natural, varied responses
  }, {
    timeoutMs: 45000, // 45 second timeout (more time for quality response)
    onTimeout: () => {
      console.warn('[DynamicResponseGenerator] LLM response timed out, using template fallback');
    },
    onError: (err) => {
      console.warn('[DynamicResponseGenerator] LLM failed:', err.message);
    },
  });

  // If LLM failed/timed out, throw to trigger template fallback
  if (!response) {
    throw new Error('LLM call returned null (timeout or error)');
  }

  // Parse response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse LLM response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Mark any high-significance disclosures as acknowledged since LLM was instructed to address them
  const unacknowledgedHigh = memory.personalDisclosures.filter(
    d => !d.acknowledged && (d as InternalDisclosure).significance === 'high'
  );
  for (const disclosure of unacknowledgedHigh) {
    disclosure.acknowledged = true;
  }

  return {
    message: parsed.message,
    strategy,
    reasoning: parsed.reasoning || `LLM-generated response using ${strategy} strategy`,
    suggestedResponses: parsed.suggestedResponses,
  };
}

/**
 * Enhanced template-based response (much better than before).
 */
function generateEnhancedTemplateResponse(
  input: GenerateResponseInput,
  strategy: ResponseStrategy,
  purpose: QuestionPurpose,
  memory: ConversationMemory
): GeneratedResponse {
  const { studentMessage, engagement, currentTopic, nextTopic, extractedInsights, conversationHistory } = input;

  let message = '';

  // 1. Build acknowledgment based on emotional tone AND message content
  // NEW: Use the used acknowledgments tracker to avoid repetition
  const acknowledgment = buildAcknowledgmentWithVariety(engagement, extractedInsights, studentMessage, memory);

  // 2. Build connection to previous if available
  const connection = buildConnectionWithQuotes(memory, currentTopic);

  // 3. Build the core question/response based on strategy
  let coreResponse = buildCoreResponse(strategy, purpose, currentTopic, nextTopic, memory);

  // 4. NEW: Check for question duplication and replace if needed
  const duplicateCheck = isQuestionDuplicate(coreResponse, memory);
  if (duplicateCheck.isDuplicate) {
    // Generate an alternative question that we haven't asked
    coreResponse = generateAlternativeQuestion(memory, currentTopic, nextTopic);
  }

  // 5. NEW: Add this question to memory immediately to prevent adjacent turn repetition
  memory.askedQuestions.push({
    questionText: coreResponse,
    normalizedKey: normalizeQuestionForComparison(coreResponse),
    subject: currentTopic?.scope?.subject as SubjectArea | undefined,
    turnNumber: conversationHistory.length,
  });

  // 6. NEW: Track discussed subjects to avoid consecutive same-subject questions
  if (currentTopic?.scope?.subject) {
    memory.discussedSubjects.add(currentTopic.scope.subject as SubjectArea);
  }

  // Combine naturally
  if (strategy === 'probe_deeper' || strategy === 'continue_normally') {
    message = `${acknowledgment} ${coreResponse}`;
  } else if (strategy === 'share_observation') {
    message = `${acknowledgment} ${connection} ${coreResponse}`;
  } else if (strategy === 'change_topic') {
    message = `${acknowledgment} ${coreResponse}`;
  } else if (strategy === 'rephrase_question') {
    message = coreResponse; // Start fresh with rephrase
  } else if (strategy === 'take_a_break' || strategy === 'open_ended_invite') {
    message = coreResponse;
  } else if (strategy === 'validate_and_encourage') {
    message = `${acknowledgment} ${coreResponse}`;
  } else if (strategy === 'offer_topic_choices') {
    // NEW: For topic choices, use a neutral acknowledgment and the choice prompt
    // Don't make assumptions about why they gave a brief answer
    message = coreResponse; // The choice prompt is self-contained
  } else {
    message = `${acknowledgment} ${coreResponse}`;
  }

  return {
    message: message.trim(),
    strategy,
    reasoning: `Enhanced template for ${strategy}: ${purpose.primaryGoal}`,
    suggestedResponses: buildSuggestedResponses(strategy, currentTopic),
    questionAsked: coreResponse, // Return for external tracking
  };
}

function buildAcknowledgment(
  engagement: EngagementAssessment,
  insights: ExtractedInsight[],
  studentMessage?: string
): string {
  // NEW: Analyze actual message content for more accurate tone matching
  // This overrides engagement assessment when message clearly indicates tone
  let detectedTone: 'empathetic' | 'celebratory' | 'appreciative' | 'neutral' = 'neutral';

  if (studentMessage) {
    const lower = studentMessage.toLowerCase();

    // Check for difficult/challenging content - EMPATHETIC response needed
    const hardshipIndicators = [
      'tough', 'hard', 'struggled', 'struggled', 'stress', 'difficult',
      'sick', 'illness', 'family stuff', 'family issues', 'didn\'t work',
      'failed', 'couldn\'t', 'frustrated', 'overwhelming', 'anxiety',
      'terrible', 'awful', 'worst', 'hated', 'hate', 'depressed',
      'mom got sick', 'dad got sick', 'parent', 'divorce', 'death',
      'crisis', 'mental health', 'breakdown', 'gave up',
    ];

    // Check for positive/celebratory content
    const positiveIndicators = [
      'love', 'loved', 'really enjoy', 'super fun', 'amazing', 'awesome',
      'really cool', 'exciting', 'passionate', 'my thing', 'clicks for me',
      'easy', 'breeze', 'nailed', 'crushed it', 'aced', 'best',
    ];

    // Check for self-reflection/insight sharing
    const reflectionIndicators = [
      'i realized', 'looking back', 'i learned', 'i noticed',
      'i think what happened', 'honestly', 'to be honest',
      'the truth is', 'i figured out', 'it made me',
    ];

    // Count matches for each category
    let hardshipCount = 0;
    let positiveCount = 0;
    let reflectionCount = 0;

    for (const indicator of hardshipIndicators) {
      if (lower.includes(indicator)) hardshipCount++;
    }
    for (const indicator of positiveIndicators) {
      if (lower.includes(indicator)) positiveCount++;
    }
    for (const indicator of reflectionIndicators) {
      if (lower.includes(indicator)) reflectionCount++;
    }

    // Determine tone based on dominant signals
    if (hardshipCount >= 1 && hardshipCount >= positiveCount) {
      // Hardship content takes priority - always acknowledge difficulty
      detectedTone = 'empathetic';
    } else if (positiveCount >= 2 || (positiveCount >= 1 && hardshipCount === 0)) {
      // Clearly positive content
      detectedTone = 'celebratory';
    } else if (reflectionCount >= 1 || insights.length > 0) {
      // Thoughtful sharing
      detectedTone = 'appreciative';
    }
  } else {
    // Fall back to engagement-based detection
    if (engagement.emotionalTone === 'negative') {
      detectedTone = 'empathetic';
    } else if (engagement.emotionalTone === 'positive') {
      detectedTone = 'celebratory';
    } else if (insights.length > 0) {
      detectedTone = 'appreciative';
    }
  }

  // Select from appropriate pool
  const pool = ACKNOWLEDGMENTS[detectedTone];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildConnection(
  memory: ConversationMemory,
  currentTopic: ConversationTopic | null
): string {
  // Priority 1: Reference unacknowledged personal disclosures (most important)
  const unacknowledgedDisclosures = memory.personalDisclosures.filter(d => !d.acknowledged);
  if (unacknowledgedDisclosures.length > 0) {
    const disclosure = unacknowledgedDisclosures[0];

    // Mark as acknowledged for future turns
    disclosure.acknowledged = true;

    // Build context-appropriate references based on type
    switch (disclosure.type) {
      case 'family':
        return `You mentioned earlier about your family situation - I want you to know that kind of context really matters.`;
      case 'health':
        return `I remember you mentioned dealing with health issues - that takes a lot of resilience.`;
      case 'external_challenge':
        return `Given what you shared about the challenges you faced, this makes a lot of sense.`;
      case 'personal_struggle':
        return `I appreciate you being honest about the struggles. That self-awareness is valuable.`;
      case 'achievement':
        return `Building on that accomplishment you mentioned - `;
    }
  }

  // Priority 2: Reference cross-subject patterns
  if (memory.crossSubjectPatterns.length > 0) {
    return `I'm noticing ${memory.crossSubjectPatterns[0].toLowerCase()}.`;
  }

  // Priority 3: Reference external factors mentioned
  if (memory.externalFactors.length > 0 && currentTopic?.type === 'circumstance_exploration') {
    return `You mentioned ${memory.externalFactors[0]} - that's helpful context.`;
  }

  // Priority 4: Reference memorable quotes from recent conversation
  if (memory.memorableQuotes.length > 0) {
    const recentQuote = memory.memorableQuotes[memory.memorableQuotes.length - 1];
    const quoteSnippet = recentQuote.quote.length > 40
      ? recentQuote.quote.substring(0, 40) + '...'
      : recentQuote.quote;
    return `Earlier you mentioned "${quoteSnippet.toLowerCase()}" - `;
  }

  return '';
}

/**
 * NEW: Build acknowledgment with variety tracking to avoid repetition.
 * Ensures we don't use the same acknowledgment twice in a conversation.
 */
function buildAcknowledgmentWithVariety(
  engagement: EngagementAssessment,
  insights: ExtractedInsight[],
  studentMessage: string | undefined,
  memory: ConversationMemory
): string {
  // First, determine the appropriate tone (same logic as buildAcknowledgment)
  let detectedTone: 'empathetic' | 'celebratory' | 'appreciative' | 'neutral' = 'neutral';

  if (studentMessage) {
    const lower = studentMessage.toLowerCase();

    // Check for difficult/challenging content - EMPATHETIC response needed
    const hardshipIndicators = [
      'tough', 'hard', 'struggled', 'stress', 'difficult',
      'sick', 'illness', 'family stuff', 'family issues', 'didn\'t work',
      'failed', 'couldn\'t', 'frustrated', 'overwhelming', 'anxiety',
      'terrible', 'awful', 'worst', 'hated', 'hate', 'depressed',
      'mom got sick', 'dad got sick', 'parent', 'divorce', 'death',
      'crisis', 'mental health', 'breakdown', 'gave up',
    ];

    // Check for positive/celebratory content
    const positiveIndicators = [
      'love', 'loved', 'really enjoy', 'super fun', 'amazing', 'awesome',
      'really cool', 'exciting', 'passionate', 'my thing', 'clicks for me',
      'easy', 'breeze', 'nailed', 'crushed it', 'aced', 'best',
    ];

    // Check for self-reflection/insight sharing
    const reflectionIndicators = [
      'i realized', 'looking back', 'i learned', 'i noticed',
      'i think what happened', 'honestly', 'to be honest',
      'the truth is', 'i figured out', 'it made me',
    ];

    // Count matches for each category
    let hardshipCount = 0;
    let positiveCount = 0;
    let reflectionCount = 0;

    for (const indicator of hardshipIndicators) {
      if (lower.includes(indicator)) hardshipCount++;
    }
    for (const indicator of positiveIndicators) {
      if (lower.includes(indicator)) positiveCount++;
    }
    for (const indicator of reflectionIndicators) {
      if (lower.includes(indicator)) reflectionCount++;
    }

    // Determine tone based on dominant signals
    if (hardshipCount >= 1 && hardshipCount >= positiveCount) {
      detectedTone = 'empathetic';
    } else if (positiveCount >= 2 || (positiveCount >= 1 && hardshipCount === 0)) {
      detectedTone = 'celebratory';
    } else if (reflectionCount >= 1 || insights.length > 0) {
      detectedTone = 'appreciative';
    }
  } else {
    if (engagement.emotionalTone === 'negative') {
      detectedTone = 'empathetic';
    } else if (engagement.emotionalTone === 'positive') {
      detectedTone = 'celebratory';
    } else if (insights.length > 0) {
      detectedTone = 'appreciative';
    }
  }

  // Get the pool for this tone
  const pool = ACKNOWLEDGMENTS[detectedTone];

  // Find an acknowledgment we haven't used yet
  const availableAcknowledgments = pool.filter(ack => !memory.usedAcknowledgments.has(ack));

  let selectedAck: string;
  if (availableAcknowledgments.length > 0) {
    // Pick randomly from available options
    selectedAck = availableAcknowledgments[Math.floor(Math.random() * availableAcknowledgments.length)];
  } else {
    // All used - clear the set for this tone and pick fresh
    // (Only clear the ones from this tone type)
    for (const ack of pool) {
      memory.usedAcknowledgments.delete(ack);
    }
    selectedAck = pool[Math.floor(Math.random() * pool.length)];
  }

  // Mark as used
  memory.usedAcknowledgments.add(selectedAck);

  return selectedAck;
}

/**
 * NEW: Build connection with specific quote referencing from earlier conversation.
 * Prioritizes referencing actual student quotes to show we're listening.
 */
function buildConnectionWithQuotes(
  memory: ConversationMemory,
  currentTopic: ConversationTopic | null
): string {
  // Priority 1: Reference unacknowledged personal disclosures (most important)
  const unacknowledgedDisclosures = memory.personalDisclosures.filter(d => !d.acknowledged);
  if (unacknowledgedDisclosures.length > 0) {
    const disclosure = unacknowledgedDisclosures[0];
    disclosure.acknowledged = true;

    switch (disclosure.type) {
      case 'family':
        return `You mentioned earlier about your family situation - I want you to know that kind of context really matters.`;
      case 'health':
        return `I remember you mentioned dealing with health issues - that takes a lot of resilience.`;
      case 'external_challenge':
        return `Given what you shared about the challenges you faced, this makes a lot of sense.`;
      case 'personal_struggle':
        return `I appreciate you being honest about the struggles. That self-awareness is valuable.`;
      case 'achievement':
        return `Building on that accomplishment you mentioned - `;
    }
  }

  // Priority 2: Reference specific memorable quotes (NEW - with actual student words)
  // This creates a more personal, "I was listening" feel
  if (memory.memorableQuotes.length > 0) {
    // Find a relevant quote we haven't referenced recently
    // Prefer quotes that are positive or about strengths
    const positiveQuotes = memory.memorableQuotes.filter(q => q.sentiment === 'positive');
    const relevantQuote = positiveQuotes.length > 0
      ? positiveQuotes[Math.floor(Math.random() * positiveQuotes.length)]
      : memory.memorableQuotes[memory.memorableQuotes.length - 1];

    // Only use if it's a good quote (not too short)
    if (relevantQuote.quote.length > 15) {
      const quoteSnippet = relevantQuote.quote.length > 50
        ? relevantQuote.quote.substring(0, 50) + '...'
        : relevantQuote.quote;

      // Build different connection phrases based on context
      const connectionTemplates = [
        `Earlier you said "${quoteSnippet.toLowerCase()}" - `,
        `You mentioned that "${quoteSnippet.toLowerCase()}" which is interesting - `,
        `Going back to when you said "${quoteSnippet.toLowerCase()}" - `,
        `I remember you saying "${quoteSnippet.toLowerCase()}" - `,
      ];

      return connectionTemplates[Math.floor(Math.random() * connectionTemplates.length)];
    }
  }

  // Priority 3: Reference cross-subject patterns
  if (memory.crossSubjectPatterns.length > 0) {
    return `I'm noticing ${memory.crossSubjectPatterns[0].toLowerCase()}.`;
  }

  // Priority 4: Reference external factors mentioned
  if (memory.externalFactors.length > 0 && currentTopic?.type === 'circumstance_exploration') {
    return `You mentioned ${memory.externalFactors[0]} - that's helpful context.`;
  }

  // Priority 5: Reference self-described strengths/challenges for continuity
  if (memory.selfDescribedStrengths.length > 0 && memory.selfDescribedChallenges.length > 0) {
    return `You mentioned ${memory.selfDescribedStrengths[0]} is your thing - `;
  }

  return '';
}

function buildCoreResponse(
  strategy: ResponseStrategy,
  purpose: QuestionPurpose,
  currentTopic: ConversationTopic | null,
  nextTopic: ConversationTopic | null,
  memory: ConversationMemory
): string {
  switch (strategy) {
    case 'probe_deeper':
      return buildProbeDeeper(purpose, currentTopic, memory);

    case 'continue_normally':
      return buildContinue(currentTopic, nextTopic, memory);

    case 'share_observation':
      return buildShareObservation(memory, purpose);

    case 'rephrase_question':
      return buildRephrase(currentTopic);

    case 'change_topic':
      return buildChangeTopic(nextTopic, memory);

    case 'validate_and_encourage':
      return buildValidate(currentTopic, nextTopic);

    case 'offer_examples':
      return buildOfferExamples(currentTopic);

    case 'take_a_break':
      return buildTakeBreak();

    case 'open_ended_invite':
      return buildOpenInvite();

    case 'summarize_progress':
      return buildSummary(memory);

    case 'direct_question':
      return buildDirectQuestion(purpose);

    case 'offer_topic_choices':
      return buildOfferTopicChoices(currentTopic, nextTopic, memory);

    default:
      return currentTopic?.primaryQuestion || "What else would you like to share?";
  }
}

function buildProbeDeeper(purpose: QuestionPurpose, topic: ConversationTopic | null, memory: ConversationMemory): string {
  const probes = [
    `Can you walk me through what a typical day in that class looked like?`,
    `What made it feel that way specifically?`,
    `How did you approach studying for it?`,
    `What would have made it better?`,
    `How did that affect your confidence in the subject?`,
  ];

  if (topic?.scope.course) {
    // Check if we've already asked about this course
    const courseKey = topic.scope.course.toLowerCase();
    if (!memory.discussedCourses.has(courseKey)) {
      return `What was ${topic.scope.course} like on a day-to-day basis?`;
    }
  }

  // Use a probe we haven't used yet (check against asked questions)
  for (const probe of probes) {
    const dupCheck = isQuestionDuplicate(probe, memory);
    if (!dupCheck.isDuplicate) {
      return probe;
    }
  }

  return probes[Math.floor(Math.random() * probes.length)];
}

function buildContinue(current: ConversationTopic | null, next: ConversationTopic | null, memory: ConversationMemory): string {
  if (current?.followUpQuestions && current.followUpQuestions.length > 0) {
    // Check if follow-up hasn't been asked
    for (const followUp of current.followUpQuestions) {
      const dupCheck = isQuestionDuplicate(followUp, memory);
      if (!dupCheck.isDuplicate) {
        return followUp;
      }
    }
  }

  if (next) {
    // Check if we've already discussed this subject extensively
    const nextSubject = next.scope.subject;
    if (nextSubject && memory.discussedSubjects.has(nextSubject)) {
      // Find a subject we haven't discussed
      return generateAlternativeQuestion(memory, current, next);
    }

    const transitions = [
      `I'm also curious about ${formatSubject(next.scope.subject!)} - ${next.primaryQuestion.toLowerCase()}`,
      `Let me ask about something related: ${next.primaryQuestion.toLowerCase()}`,
      `${next.primaryQuestion}`,
    ];

    // Check each transition for duplicates
    for (const transition of transitions) {
      const dupCheck = isQuestionDuplicate(transition, memory);
      if (!dupCheck.isDuplicate) {
        return transition;
      }
    }

    // If all transitions are duplicates, generate an alternative
    return generateAlternativeQuestion(memory, current, next);
  }

  return "What else stands out to you about your academic experience?";
}

function buildShareObservation(memory: ConversationMemory, purpose: QuestionPurpose): string {
  // NEW: Use CONNECTIVE_OBSERVATIONS templates for richer cross-topic connections

  // Priority 1: Cross-subject patterns detected
  if (memory.crossSubjectPatterns.length > 0) {
    const pattern = memory.crossSubjectPatterns[memory.crossSubjectPatterns.length - 1];
    const templates = [
      `I'm noticing a pattern - ${pattern.pattern}. Does that resonate with you?`,
      `So if I'm understanding right, ${pattern.pattern}? That's really interesting.`,
      `It sounds like ${pattern.pattern}. Is that fair to say?`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Priority 2: Quote a previous memorable statement and connect to current
  if (memory.memorableQuotes.length > 1) {
    const oldQuote = memory.memorableQuotes[0];
    const recentQuote = memory.memorableQuotes[memory.memorableQuotes.length - 1];
    if (oldQuote.quote !== recentQuote.quote && oldQuote.quote.length > 20) {
      const quoteSnippet = oldQuote.quote.substring(0, 40) + (oldQuote.quote.length > 40 ? '...' : '');
      return `You mentioned earlier that "${quoteSnippet}" - how does that connect to what you're saying now about this?`;
    }
  }

  // Priority 3: Strength vs challenge contrast
  if (memory.selfDescribedStrengths.length > 0 && memory.selfDescribedChallenges.length > 0) {
    const strength = memory.selfDescribedStrengths[0];
    const challenge = memory.selfDescribedChallenges[0];
    const templates = [
      `So ${strength} feels natural while ${challenge} is more of a challenge - what do you think makes them different for you?`,
      `I'm curious - you seem to light up about ${strength} but ${challenge} sounds harder. What's the difference for you?`,
      `It's interesting that ${strength} comes easily but ${challenge} requires more effort. Any idea why?`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Priority 4: Multiple subjects discussed - synthesize
  if (memory.discussedSubjects.size >= 2) {
    const subjects = Array.from(memory.discussedSubjects).slice(0, 2);
    return `Looking at how you've described ${formatSubject(subjects[0])} vs ${formatSubject(subjects[1])} - do you see any common thread in what makes you engage differently with them?`;
  }

  // Fallback
  return purpose.connectionToKnown;
}

function buildRephrase(topic: ConversationTopic | null): string {
  if (!topic) {
    return "Let me try asking that differently - how do you feel about school in general? Like, do you enjoy it, or is it more something you just have to do?";
  }

  const rephrases = [
    `Let me put it another way - on a scale of "loved it" to "dreaded it", where would you put ${topic.scope.course || formatSubject(topic.scope.subject!)}?`,
    `Sorry, let me be more specific - I'm wondering if ${topic.scope.course || 'this class'} felt easy, medium, or really hard for you?`,
    `To give you an example of what I mean - some students cruise through ${formatSubject(topic.scope.subject!)} without much effort, while others have to work really hard. Which was more true for you?`,
  ];

  return rephrases[Math.floor(Math.random() * rephrases.length)];
}

function buildChangeTopic(next: ConversationTopic | null, memory: ConversationMemory): string {
  if (!next) {
    return "Let's talk about something different - is there anything about school that's been on your mind lately?";
  }

  // Check if we've already discussed this subject
  const nextSubject = next.scope.subject;
  if (nextSubject && memory.discussedSubjects.has(nextSubject)) {
    // Generate an alternative question about a different subject
    return generateAlternativeQuestion(memory, null, next);
  }

  const transitions = [
    `I'd love to hear about ${formatSubject(next.scope.subject!)}. ${next.primaryQuestion}`,
    `Shifting gears - ${next.primaryQuestion.toLowerCase()}`,
    `Let's explore something else. ${next.primaryQuestion}`,
  ];

  // Check each transition for duplicates
  for (const transition of transitions) {
    const dupCheck = isQuestionDuplicate(transition, memory);
    if (!dupCheck.isDuplicate) {
      return transition;
    }
  }

  // If all transitions are duplicates, generate an alternative
  return generateAlternativeQuestion(memory, null, next);
}

function buildValidate(current: ConversationTopic | null, next: ConversationTopic | null): string {
  const validations = [
    "It really helps to hear the full picture.",
    "Thanks for being so open about it.",
    "That context makes a big difference.",
  ];

  const validation = validations[Math.floor(Math.random() * validations.length)];

  if (next) {
    return `${validation} When you're ready, I'd love to hear about ${formatSubject(next.scope.subject!)} too.`;
  }

  return `${validation} Is there anything else about that you want me to know?`;
}

function buildOfferExamples(topic: ConversationTopic | null): string {
  if (!topic) {
    return "For example, some students are really into STEM subjects, others love humanities, and some enjoy a mix. What's your vibe?";
  }

  const examples: Record<string, string> = {
    grade_anomaly: "Like, some students have a harder time because of the teacher, others because of what was going on in their life, and some just hit a wall with the material. Any of those ring true?",
    difficulty_transition: "Some people find the jump to harder classes exciting, others find it stressful, and some barely notice. What was it like for you?",
    subject_overview: "So like, some students genuinely love a subject, others tolerate it, and some actively avoid it when they can. Where do you fall?",
  };

  return examples[topic.type] || "What was the biggest thing that shaped your experience?";
}

function buildTakeBreak(): string {
  const breaks = [
    "We've covered a lot. How are you feeling about this conversation so far?",
    "Want to take a breather? We can slow down or switch to something lighter.",
    "I realize I've been asking a lot of questions. Is there anything you want to ask me, or anything you'd like to add?",
  ];
  return breaks[Math.floor(Math.random() * breaks.length)];
}

function buildOpenInvite(): string {
  const invites = [
    "What's something about your academic experience that we haven't touched on yet?",
    "Is there anything about school that you've been wanting to talk about?",
    "What would you want a college to know about you that isn't obvious from your grades?",
  ];
  return invites[Math.floor(Math.random() * invites.length)];
}

/**
 * NEW: Build a response that offers topic choices to the student.
 * Used when we detect potential disengagement but want to give them agency
 * rather than automatically switching topics. They might just be brief/tired.
 */
function buildOfferTopicChoices(
  currentTopic: ConversationTopic | null,
  nextTopic: ConversationTopic | null,
  memory: ConversationMemory
): string {
  // Find undiscussed subjects to offer as alternatives
  const allSubjects: SubjectArea[] = ['math', 'science', 'english', 'social_studies', 'foreign_language'];
  const undiscussedSubjects = allSubjects.filter(s => !memory.discussedSubjects.has(s));

  // Get the current subject for context
  const currentSubject = currentTopic?.scope?.subject;
  const currentSubjectFormatted = currentSubject ? formatSubject(currentSubject) : 'this topic';

  // Get an alternative subject to offer
  const alternativeSubject = undiscussedSubjects.length > 0
    ? undiscussedSubjects[0]
    : allSubjects.find(s => s !== currentSubject) || 'english';
  const alternativeSubjectFormatted = formatSubject(alternativeSubject);

  // Build response with choices
  // The format gives them 2-3 options and lets them pick
  const choiceTemplates = [
    // Option 1: Simple choice with 2 directions
    `No worries! Would you rather tell me more about ${currentSubjectFormatted}, or should we talk about ${alternativeSubjectFormatted} instead?`,

    // Option 2: Three choices including "something else"
    `That's okay! We can keep talking about ${currentSubjectFormatted}, switch to ${alternativeSubjectFormatted}, or you can tell me about something completely different - whatever you'd prefer.`,

    // Option 3: Validate brevity and offer options
    `Totally fine to keep it short! Want to stay on ${currentSubjectFormatted}, or would you prefer to explore ${alternativeSubjectFormatted}? Or is there something else on your mind?`,

    // Option 4: Check if they want to go deeper or move on
    `I want to make sure we talk about what matters to you. Want to dig deeper into ${currentSubjectFormatted}, or would ${alternativeSubjectFormatted} be more interesting?`,
  ];

  // Pick randomly
  return choiceTemplates[Math.floor(Math.random() * choiceTemplates.length)];
}

function buildSummary(memory: ConversationMemory): string {
  const parts: string[] = [];

  if (memory.selfDescribedStrengths.length > 0) {
    parts.push(`you're strong in ${memory.selfDescribedStrengths.join(' and ')}`);
  }
  if (memory.selfDescribedChallenges.length > 0) {
    parts.push(`${memory.selfDescribedChallenges.join(' and ')} has been more challenging`);
  }
  if (memory.externalFactors.length > 0) {
    parts.push(`you've dealt with ${memory.externalFactors[0]}`);
  }

  if (parts.length > 0) {
    return `So from what I'm hearing, ${parts.join(', and ')}. Does that capture it?`;
  }

  return "Thanks for sharing all of that. Is there anything important I might have missed?";
}

function buildDirectQuestion(purpose: QuestionPurpose): string {
  return `Let me ask directly: ${purpose.completionCriteria[0]}?`;
}

function buildSuggestedResponses(
  strategy: ResponseStrategy,
  topic: ConversationTopic | null
): string[] {
  switch (strategy) {
    case 'probe_deeper':
      return [
        "Yeah, let me explain more...",
        "Actually that's pretty much it",
        "There's another thing too...",
      ];

    case 'share_observation':
      return [
        "Yeah that's exactly it",
        "Sort of, but it's more like...",
        "Not really, it's different because...",
      ];

    case 'rephrase_question':
      return [
        "Oh I see what you mean now",
        "Still not sure what you're asking",
        "Can you give me an example?",
      ];

    case 'change_topic':
      return [
        "Sure, let's talk about that",
        "Can we stay on the other thing?",
        "Sounds good",
      ];

    case 'take_a_break':
      return [
        "I'm good, let's keep going",
        "Actually yeah, can we slow down?",
        "I have a question for you",
      ];

    case 'open_ended_invite':
      return [
        "There's something I haven't mentioned...",
        "I think we've covered the main stuff",
        "Can you ask me something specific?",
      ];

    default:
      return [
        "Let me think...",
        "I'd say...",
        "Here's the thing...",
      ];
  }
}

// ============================================================================
// REPHRASE GENERATOR
// ============================================================================

/**
 * Generate a rephrased version of a question when student is confused.
 */
export async function generateRephrasedQuestion(
  originalQuestion: string,
  studentResponse: string,
  context: string,
  options: { model?: 'haiku' | 'sonnet' } = {}
): Promise<string> {
  const model = options.model === 'sonnet'
    ? 'claude-sonnet-4-20250514'
    : 'claude-haiku-4-5-20251001';

  try {
    const prompt = `The student seems confused by this question:
"${originalQuestion}"

Their response was:
"${studentResponse}"

Context: ${context}

Rephrase the question to be clearer. Make it:
1. Simpler and more direct
2. Include a concrete example
3. Use casual, friendly language
4. Keep it short (1-2 sentences max)

Return ONLY the rephrased question, nothing else.`;

    const response = await callClaude({
      model,
      system: 'You rephrase questions to be clearer for high school students. Be casual and friendly. Always include a concrete example to illustrate what you mean.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 150,
      temperature: 0.7,
    });

    return response.content.trim();
  } catch {
    // Enhanced fallback
    return `Let me put it differently - on a scale from 1 to 5, how would you rate your experience? 1 being "I dreaded it" and 5 being "I actually enjoyed it"?`;
  }
}

/**
 * Generate acknowledgment of what student shared.
 */
export function generateAcknowledgment(
  studentMessage: string,
  insights: ExtractedInsight[],
  emotionalTone: string
): string {
  // Build acknowledgment based on what they shared
  if (emotionalTone === 'negative') {
    return ACKNOWLEDGMENTS.empathetic[Math.floor(Math.random() * ACKNOWLEDGMENTS.empathetic.length)];
  }

  if (emotionalTone === 'positive') {
    return ACKNOWLEDGMENTS.celebratory[Math.floor(Math.random() * ACKNOWLEDGMENTS.celebratory.length)];
  }

  if (insights.length > 0) {
    return ACKNOWLEDGMENTS.appreciative[Math.floor(Math.random() * ACKNOWLEDGMENTS.appreciative.length)];
  }

  return ACKNOWLEDGMENTS.neutral[Math.floor(Math.random() * ACKNOWLEDGMENTS.neutral.length)];
}
