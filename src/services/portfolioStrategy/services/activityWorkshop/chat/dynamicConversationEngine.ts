/**
 * Dynamic Conversation Engine
 *
 * Replaces rigid template-based conversations with fluid, contextual dialogue
 * that adapts to each student's unique communication style and needs.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHILOSOPHY: Every response should quote the student's exact words, celebrate
 * what's working, and ask discovery questions that help them find their own
 * insights. Structure is fixed (for UX consistency), content is fully tailored.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * KEY PATTERNS (from PIQ Workshop):
 * 1. Exact Text Quoting: Always reference specific phrases the student used
 * 2. Quality Anchors: Celebrate what's already working before probing deeper
 * 3. Discovery Partnership: Ask questions that lead to self-discovery, don't lecture
 * 4. Anti-Flattery Honesty: "Real Talk" - honest guidance without sugar-coating
 * 5. Emotional Arc: Acknowledge → Celebrate → Gentle redirect → Concrete question
 * 6. Voice Fingerprinting: Match the student's energy, vocabulary, and tone
 *
 * STRUCTURE vs CONTENT:
 * - Structure (fixed): Response format, section order, UI/UX consistency
 * - Content (tailored): Actual words, quotes, teaching insights, questions
 */

import { callClaude } from '@/lib/llm/claude';
import { ConversationDynamics, StudentPattern, ConversationMode } from './conversationModeService';
import { ActivityProfile } from '../profile/types';
import { ConversationState, ExtractionResult, QuestionCandidate } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicQuestionInput {
  /** Base question from question generator */
  baseQuestion: string;
  /** Target field for the question */
  targetField: string;
  /** Activity title */
  activityTitle: string;
  /** Current conversation dynamics */
  dynamics: ConversationDynamics;
  /** Full conversation history */
  conversationHistory: Array<{
    question: string;
    response: string;
    extraction: ExtractionResult;
  }>;
  /** Current profile state */
  profile: ActivityProfile;
  /** What data we've already gathered */
  extractedHighlights: string[];
  /** Current turn number */
  turnNumber: number;
  /** User's current/draft description being workshopped */
  currentDescription?: string;
  /** Target platform (affects character limit) */
  targetPlatform?: 'common_app' | 'uc' | 'coalition';

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYSIS INSIGHTS - "I've already studied your file" context
  // ═══════════════════════════════════════════════════════════════════════════

  /** Pre-computed analysis results from System 1 */
  analysisInsights?: {
    /** Preliminary tier classification (1-4) */
    tier: 1 | 2 | 3 | 4;
    /** Confidence in tier classification */
    tierConfidence: 'high' | 'medium' | 'low';
    /** What makes this activity valuable (green flags) */
    strengths: string[];
    /** What's missing or weak (gaps to probe) */
    gaps: string[];
    /** Issues with current description */
    descriptionIssues: string[];
    /** Score breakdown (1-10 per dimension) */
    scoreBreakdown?: {
      tierAssessment: number;
      recognitionLevel: number;
      leadershipImpact: number;
      communityCharacter: number;
      commitmentProgression: number;
    };
    /** Specific areas where description could improve */
    improvementPriorities: string[];
  };
}

export interface DynamicQuestionOutput {
  /** The fully composed, contextual question */
  question: string;
  /** Teaching moment included (if any) - concise, discovery-focused */
  teachingMoment?: string;
  /** Tone used */
  tone: 'warm' | 'curious' | 'encouraging' | 'reflective' | 'validating';
  /** Why this phrasing was chosen */
  reasoning: string;
  /** Exact quotes from the student used in the response */
  quotedPhrases?: string[];
  /** Quality anchor - what's already working that we celebrated */
  qualityAnchor?: string;
  /** Tokens used */
  tokensUsed?: { input: number; output: number };
  /** Suggested improvement to their description based on what we've learned */
  descriptionSuggestion?: {
    /** The improved description text */
    improvedText: string;
    /** What changed from their current description */
    changes: string;
    /** Character count (must be ≤150 for Common App, ≤350 for UC) */
    charCount: number;
  };
  /** Part of their current description we're working on */
  descriptionFocus?: string;
}

export interface TeachingMoment {
  /** What to teach */
  concept: string;
  /** When to surface it */
  trigger: 'after_sparse' | 'after_humble' | 'after_achievement' | 'proactive';
  /** The teaching content */
  content: string;
  /** Example to illustrate */
  example?: string;
}

// ============================================================================
// TEACHING INSIGHTS (Concise, Discovery-Focused)
// ============================================================================

/**
 * Teaching insights help students understand what makes descriptions IMPRESSIVE.
 * Format: Punchy insight (under 100 chars) + probing question.
 *
 * KEY PRINCIPLE: We're building impressive descriptions, not collecting struggle stories.
 * Focus on: scale, role ownership, measurable impact, intellectual depth, character in action.
 */
const TEACHING_INSIGHTS = {
  // Scale & specificity — numbers make impact concrete
  specificity: {
    quick: "Numbers make it real — '50 students' beats 'many students.'",
    discovery: "How many people did this affect? Even a rough number helps.",
  },

  // Role ownership — what YOU specifically did
  roleOwnership: {
    quick: "Admissions wants to know what YOU did, not the team.",
    discovery: "What was YOUR specific piece of this?",
  },

  // Before/after — shows causation and impact
  impactClarity: {
    quick: "Before/after shows you changed something — that's impact.",
    discovery: "What was different after your work compared to before?",
  },

  // For humble students — redirect to facts, not feelings
  reframingAchievements: {
    quick: "Let's just get the facts — how many, how often, what result?",
    discovery: "Roughly how many people? What was the outcome?",
  },

  // For reluctant students — make it about actions, not evaluation
  authenticValue: {
    quick: "I just need the specifics — what you did, not how good it was.",
    discovery: "Walk me through what you actually did in a typical week.",
  },

  // Before/after transformation — gold for descriptions
  beforeAfterGold: {
    quick: "That change you described — that's exactly what stands out.",
    discovery: "What specifically did YOU do that caused that shift?",
  },

  // External recognition — proof of impact
  recognitionValue: {
    quick: "When others noticed your work, that's external validation.",
    discovery: "Did anyone outside your group recognize what you did?",
  },

  // Progression over time — shows commitment and growth
  progression: {
    quick: "Showing how your role evolved demonstrates growth.",
    discovery: "How did your responsibilities change from when you started?",
  },

  // Initiative & leadership — self-started vs. assigned
  initiative: {
    quick: "Starting something yourself is a strong signal.",
    discovery: "Was this something you created, or did you join an existing effort?",
  },
};

// ============================================================================
// VOICE FINGERPRINTING PATTERNS
// ============================================================================

/**
 * Detect the student's communication style to match their energy.
 * We don't want to sound formal with casual students or casual with formal ones.
 */
interface VoiceFingerprint {
  formality: 'casual' | 'neutral' | 'formal';
  energy: 'low' | 'medium' | 'high';
  verbosity: 'minimal' | 'moderate' | 'detailed';
  emotionalOpenness: 'guarded' | 'neutral' | 'expressive';
}

function analyzeVoice(responses: string[]): VoiceFingerprint {
  const combined = responses.join(' ').toLowerCase();
  const avgLength = responses.length > 0 ? responses.reduce((sum, r) => sum + r.length, 0) / responses.length : 0;

  // Formality detection
  const casualMarkers = ['like', 'kinda', 'sorta', 'yeah', 'nah', 'idk', 'tbh', 'lol', 'haha'];
  const formalMarkers = ['therefore', 'additionally', 'furthermore', 'consequently', 'regarding'];
  const casualCount = casualMarkers.filter(m => combined.includes(m)).length;
  const formalCount = formalMarkers.filter(m => combined.includes(m)).length;

  let formality: VoiceFingerprint['formality'] = 'neutral';
  if (casualCount > formalCount + 1) formality = 'casual';
  if (formalCount > casualCount) formality = 'formal';

  // Energy detection
  const highEnergyMarkers = ['!', 'really', 'amazing', 'awesome', 'loved', 'excited', 'incredible'];
  const lowEnergyMarkers = ['i guess', 'maybe', 'whatever', 'i don\'t know', 'not sure'];
  const highCount = highEnergyMarkers.filter(m => combined.includes(m)).length;
  const lowCount = lowEnergyMarkers.filter(m => combined.includes(m)).length;

  let energy: VoiceFingerprint['energy'] = 'medium';
  if (highCount > lowCount + 1) energy = 'high';
  if (lowCount > highCount) energy = 'low';

  // Verbosity
  let verbosity: VoiceFingerprint['verbosity'] = 'moderate';
  if (avgLength < 50) verbosity = 'minimal';
  if (avgLength > 200) verbosity = 'detailed';

  // Emotional openness
  const emotionalMarkers = ['felt', 'feel', 'loved', 'hated', 'scared', 'proud', 'excited', 'nervous', 'happy', 'sad'];
  const emotionalCount = emotionalMarkers.filter(m => combined.includes(m)).length;
  const guardedMarkers = ['fine', 'okay', 'whatever', 'i guess'];
  const guardedCount = guardedMarkers.filter(m => combined.includes(m)).length;

  let emotionalOpenness: VoiceFingerprint['emotionalOpenness'] = 'neutral';
  if (emotionalCount > 2) emotionalOpenness = 'expressive';
  if (guardedCount > emotionalCount) emotionalOpenness = 'guarded';

  return { formality, energy, verbosity, emotionalOpenness };
}

// ============================================================================
// QUOTE EXTRACTION
// ============================================================================

/**
 * Extract quotable phrases from student responses.
 * These become the foundation of our contextual responses.
 *
 * KEY PRINCIPLE: Even short responses should have something we can quote.
 */
function extractQuotablePhrases(response: string): string[] {
  const quotes: string[] = [];

  // Numbers with context (e.g., "50 students", "3 hours a week")
  const numberPatterns = response.match(/\d+\s+[\w\s]{2,20}/g) || [];
  quotes.push(...numberPatterns.slice(0, 2));

  // Action phrases (I + verb) - expanded verb list
  const actionPatterns = response.match(/I\s+(?:helped|created|led|organized|built|designed|started|managed|taught|wrote|ran|joined|liked?|loved?|worked|did|made|learned|tried)\s+[\w\s]{2,30}/gi) || [];
  quotes.push(...actionPatterns.slice(0, 2));

  // Transformation phrases (from X to Y)
  const transformPatterns = response.match(/from\s+[\w\s]+\s+to\s+[\w\s]+/gi) || [];
  quotes.push(...transformPatterns.slice(0, 1));

  // Self-descriptive phrases for quality anchors
  const qualityPatterns = response.match(/(?:we|I)\s+(?:actually|really|finally|successfully)\s+[\w\s]{2,25}/gi) || [];
  quotes.push(...qualityPatterns.slice(0, 1));

  // Humble phrases (to acknowledge and reframe)
  const humblePatterns = response.match(/(?:just|only|nothing special|anyone could|the team|we all)\s+[\w\s]{2,20}/gi) || [];
  quotes.push(...humblePatterns.slice(0, 1));

  // FALLBACK: For very short responses, extract the core content
  if (quotes.length === 0 && response.length > 5) {
    // Try to get any meaningful phrase (verb + object or noun phrase)
    const shortPatterns = response.match(/(?:like|love|enjoy|prefer|want)\s+\w+/gi) || [];
    quotes.push(...shortPatterns.slice(0, 1));

    // Last resort: just use the key words (4+ chars)
    if (quotes.length === 0) {
      const words = response.match(/\b\w{4,}\b/g) || [];
      if (words.length > 0) {
        // Take meaningful word combinations
        const meaningful = words.filter(w => !['that', 'this', 'what', 'when', 'where', 'which', 'there', 'their'].includes(w.toLowerCase()));
        if (meaningful.length >= 2) {
          quotes.push(meaningful.slice(0, 2).join(' '));
        } else if (meaningful.length === 1) {
          quotes.push(meaningful[0]);
        }
      }
    }
  }

  // Clean up and deduplicate
  return [...new Set(quotes.map(q => q.trim()).filter(q => q.length > 2))].slice(0, 4);
}

// ============================================================================
// VAGUE PHRASE DETECTION
// ============================================================================

/**
 * Patterns that indicate vague, non-specific language in descriptions.
 * These are targets for workshopping — we want to replace them with specifics.
 */
const VAGUE_PATTERNS = [
  // Quantity vagueness
  /\b(many|some|several|a lot of|numerous|various)\s+\w+/gi,
  // Generic helping verbs
  /\b(helped|assisted|supported|contributed to)\s+\w+/gi,
  // Passive constructions
  /\b(was involved|participated in|took part in)\s+\w+/gi,
  // Effort without outcome
  /\b(worked on|worked with|worked hard)\s+\w+/gi,
  // Team without role clarity
  /\b(the team|our group|we all|together we)\s+\w+/gi,
  // Time vagueness
  /\b(regularly|often|frequently|occasionally)\s+\w+/gi,
  // Impact vagueness
  /\b(made a difference|had an impact|contributed|played a role)\b/gi,
];

/**
 * Extract vague phrases from a description that need to be made specific.
 */
function extractVaguePhrases(description: string): string[] {
  const vaguePhrases: string[] = [];

  for (const pattern of VAGUE_PATTERNS) {
    const matches = description.match(pattern);
    if (matches) {
      vaguePhrases.push(...matches);
    }
  }

  // Deduplicate and limit
  return [...new Set(vaguePhrases)].slice(0, 3);
}

// ============================================================================
// DYNAMIC CONVERSATION ENGINE
// ============================================================================

export class DynamicConversationEngine {
  /**
   * Identify vague phrases in a description that need specifics
   */
  private identifyVaguePhrases(description: string): string[] {
    return extractVaguePhrases(description);
  }
  /**
   * Generate a dynamic, contextual question
   *
   * STRUCTURE (fixed for UX consistency):
   * 1. Acknowledgment/Quote (references their exact words)
   * 2. Quality Anchor (celebrates what's working) - optional
   * 3. Teaching Insight (one-liner, not lecture) - optional
   * 4. Discovery Question (leads them to insight)
   *
   * CONTENT (fully tailored):
   * - Exact phrases quoted from their responses
   * - Voice-matched language (casual/formal/etc.)
   * - Pattern-appropriate emotional tone
   */
  async generateDynamicQuestion(input: DynamicQuestionInput): Promise<DynamicQuestionOutput> {
    const {
      baseQuestion,
      targetField,
      activityTitle,
      dynamics,
      conversationHistory,
      profile,
      extractedHighlights,
      turnNumber,
    } = input;

    // Extract voice fingerprint and quotable phrases from history
    const responses = conversationHistory.map(h => h.response);
    const voiceFingerprint = analyzeVoice(responses);
    const lastResponse = conversationHistory[conversationHistory.length - 1]?.response || '';
    const quotablePhrases = extractQuotablePhrases(lastResponse);

    // Build the context for the LLM
    const systemPrompt = this.buildSystemPrompt(
      dynamics.detectedPattern,
      voiceFingerprint,
      input.currentDescription,
      input.targetPlatform,
      input.analysisInsights
    );
    const userPrompt = this.buildUserPrompt(input, voiceFingerprint, quotablePhrases);

    try {
      const response = await callClaude(userPrompt, {
        model: 'claude-haiku-4-5-20251001',
        systemPrompt,
        temperature: 0.7,
        maxTokens: 500,
      });

      if (!response.content) {
        return this.createContextualFallback(input, voiceFingerprint, quotablePhrases);
      }

      const parsed = this.parseResponse(response.content);

      return {
        ...parsed,
        quotedPhrases: quotablePhrases.length > 0 ? quotablePhrases : undefined,
        tokensUsed: response.usage
          ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
          : undefined,
      };
    } catch (error) {
      console.error('[DynamicConversationEngine] Generation error:', error);
      return this.createContextualFallback(input, voiceFingerprint, quotablePhrases);
    }
  }

  /**
   * Build system prompt based on student pattern AND voice fingerprint
   *
   * Key innovation: We match their communication style, not impose ours.
   * NEW: Focus on WORKSHOPPING their description, not just collecting data.
   * NEW: Include analysis insights for "I've already studied your file" expertise.
   */
  private buildSystemPrompt(
    pattern: StudentPattern,
    voice: VoiceFingerprint,
    currentDescription?: string,
    targetPlatform?: 'common_app' | 'uc' | 'coalition',
    analysisInsights?: DynamicQuestionInput['analysisInsights']
  ): string {
    // Voice-adaptive base prompt
    const toneModifiers = {
      casual: "conversational, friendly, use contractions freely",
      neutral: "warm but professional",
      formal: "polished and respectful, avoid slang",
    };

    const energyModifiers = {
      low: "gentle and patient, don't overwhelm",
      medium: "balanced enthusiasm",
      high: "match their energy with genuine interest",
    };

    // Character limits by platform
    const charLimits = {
      common_app: 150,
      uc: 350,
      coalition: 255,
    };
    const charLimit = charLimits[targetPlatform || 'common_app'];
    const platformName = targetPlatform === 'uc' ? 'UC Application' :
                         targetPlatform === 'coalition' ? 'Coalition App' : 'Common App';

    // Build description context section
    let descriptionContext = '';
    if (currentDescription && currentDescription.trim().length > 0) {
      descriptionContext = `
═══════════════════════════════════════════════════════════════════════════════
THEIR CURRENT DESCRIPTION (${currentDescription.length}/${charLimit} chars):
═══════════════════════════════════════════════════════════════════════════════
"${currentDescription}"

YOUR JOB: Workshop THIS description. Quote specific parts that need improvement.
- If vague ("helped students"), ask for specifics: "How many students exactly?"
- If missing numbers, probe: "Your description says 'led workshops' — how many?"
- If passive ("the club grew"), redirect: "What did YOU do that caused that growth?"

Every question should help improve THIS ACTUAL DESCRIPTION.`;
    } else {
      descriptionContext = `
═══════════════════════════════════════════════════════════════════════════════
NO DESCRIPTION YET — Let's build one together
═══════════════════════════════════════════════════════════════════════════════

Goal: Create a ${charLimit}-character description for their ${platformName} application.
Ask questions that gather the BEST details for an impressive description.`;
    }

    // Build analysis insights section (when available)
    let analysisContext = '';
    if (analysisInsights) {
      const tierLabels = { 1: 'Tier 1 (elite)', 2: 'Tier 2 (strong)', 3: 'Tier 3 (solid)', 4: 'Tier 4 (basic)' };
      analysisContext = `
═══════════════════════════════════════════════════════════════════════════════
YOUR ANALYSIS (you've already studied this activity)
═══════════════════════════════════════════════════════════════════════════════

CURRENT ASSESSMENT: ${tierLabels[analysisInsights.tier]} (${analysisInsights.tierConfidence} confidence)
${analysisInsights.strengths.length > 0 ? `\nSTRENGTHS I SEE:\n${analysisInsights.strengths.map(s => `• ${s}`).join('\n')}` : ''}
${analysisInsights.gaps.length > 0 ? `\nGAPS TO PROBE:\n${analysisInsights.gaps.map(g => `• ${g}`).join('\n')}` : ''}
${analysisInsights.descriptionIssues.length > 0 ? `\nDESCRIPTION ISSUES:\n${analysisInsights.descriptionIssues.map(i => `• ${i}`).join('\n')}` : ''}
${analysisInsights.improvementPriorities.length > 0 ? `\nPRIORITY IMPROVEMENTS:\n${analysisInsights.improvementPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

USE THIS KNOWLEDGE: You already know what's missing. Target your questions at the gaps.
Don't ask about things already strong — focus on what would elevate this activity.`;
    }

    const basePrompt = `You are a skilled college counselor WORKSHOPPING a student's activity description.
${analysisInsights ? '\nYOU HAVE ALREADY ANALYZED THIS ACTIVITY. You know its strengths and gaps.' : ''}

YOUR VOICE: ${toneModifiers[voice.formality]}, ${energyModifiers[voice.energy]}

═══════════════════════════════════════════════════════════════════════════════
WHAT WE'RE BUILDING: A compelling ${charLimit}-character description (${platformName})
═══════════════════════════════════════════════════════════════════════════════
${descriptionContext}
${analysisContext}
═══════════════════════════════════════════════════════════════════════════════
WORKSHOPPING MODE (not just data collection!)
═══════════════════════════════════════════════════════════════════════════════

This is NOT a generic interview. We're actively improving their description.
- QUOTE their current description: "Your description says 'helped students' — how many?"
- SHOW progression: "With that number, we could change 'helped students' to 'tutored 25 students weekly'"
- BUILD iteratively: Each answer should make the description more specific and impressive

The student should SEE their description getting better with each turn.

WHAT MAKES AN IMPRESSIVE EC DESCRIPTION:
- Specific numbers (50 students, $3000 raised, 12→45 members)
- Clear role ownership (what YOU specifically did, not "the team")
- Measurable impact (before/after, outcomes that changed)
- Intellectual depth (problem identified → solution created)
- Character shown through action (leadership, initiative, persistence)

DON'T ASK ABOUT:
- "What was hardest/most challenging?" (struggles don't make impressive descriptions)
- "What obstacles/barriers did you face?" (same problem - focuses on difficulty, not achievement)
- "How did you feel?" (vague, doesn't translate to concrete descriptions)
- Generic struggles, difficulties, or challenges

ALWAYS ASK ABOUT (these build impressive descriptions):
- SCALE: "How many people?" "How often?" "Over what timeframe?"
- OUTCOMES: "What changed because of you? What's the before vs. after?"
- YOUR ROLE: "What did YOU specifically decide, create, or lead?"
- SPECIFICS: "Walk me through exactly what you built/organized/taught"
- RECOGNITION: "Did anyone outside notice? Awards, selection, praise?"
- CAUSATION: "What would NOT have happened without you?"

═══════════════════════════════════════════════════════════════════════════════
CONVERSATION RULES:
═══════════════════════════════════════════════════════════════════════════════

1. QUOTE THEIR DESCRIPTION OR THEIR EXACT WORDS (show you're working on their actual text)
   - "Your description says 'helped the club' — what specifically did you do?"
   - "You mentioned 'trained 4 new members' — let's add that number to your description"

   NEVER USE FILLER PHRASES ANYWHERE (instant fail):
   ✗ "fantastic" / "amazing" / "wonderful" / "incredible" / "impressive" / "great"
   ✗ "is huge" / "is fantastic" / "is impressive"
   ✗ "I love that" / "How exciting" / "That's really interesting"
   ✗ "I appreciate" / "Thank you for sharing" / "Thanks for telling"

   YOUR FIRST WORDS must quote THEIR words:
   ✓ "You mentioned '15 students' — ..."
   ✓ "Your description says 'helped' — ..."
   ✓ "'Grew from 12 to 45' — let's build on that..."
   ✓ "You led the water quality testing — how many students..."

2. SHOW DESCRIPTION IMPROVEMENTS
   - When they give you specific data, show how it improves their description
   - "Nice! With '15 hours/week', your description could become: 'Dedicated 15+ hrs/wk as...'

3. REDIRECT VAGUE TO SPECIFIC (always tied to their description)
   - "I helped the club" → "Your description needs specifics — what exactly did you create or lead?"
   - "It was a lot of work" → "How many hours? That number makes 'a lot' concrete."

4. TEACHING MOMENT (OPTIONAL - skip if unsure)
   MAX 35 CHARS. NO DASHES. NO SECOND CLAUSE.

   GOOD (copy these exactly or use null):
   ✓ "Numbers make impact concrete." (28)
   ✓ "Before/after shows causation." (29)
   ✓ "Specifics beat generalities." (28)
   ✓ "Scale shows real commitment." (28)
   ✓ null (perfectly fine to skip)

   BANNED (any of these = FAIL):
   ✗ "X—Y" (em-dash connects two ideas)
   ✗ "X - Y" (hyphen connects two ideas)
   ✗ "X. Y." (two sentences)
   ✗ "X; Y" (semicolon connects)
   ✗ Anything over 35 characters

   When in doubt: set "teachingMoment": null

OUTPUT FORMAT (JSON):
{
  "question": "<acknowledgment + question tied to improving their description>",
  "teachingMoment": "<ONE sentence UNDER 80 chars, or null>",
  "qualityAnchor": "<what you named as strong, null if N/A>",
  "tone": "warm" | "curious" | "encouraging" | "reflective" | "validating",
  "reasoning": "<how this answer will improve their description>",
  "descriptionFocus": "<quote from their current description being worked on, or null>",
  "descriptionSuggestion": {
    "improvedText": "<revised description using info gathered so far, max ${charLimit} chars>",
    "changes": "<what changed from their original>",
    "charCount": <number of characters>
  }
}`;

    // Pattern-specific guidance — how to surface impressive details from each type
    const patternGuidance: Record<StudentPattern, string> = {
      engaged: `
STUDENT PATTERN: ENGAGED (shares freely)
- They're giving you material — mine it for the BEST details
- "You mentioned growing from 12 to 45 members — what drove that growth?"
- Focus on scale, role ownership, and measurable outcomes
- Don't slow momentum — keep building the impressive picture`,

      terse: `
STUDENT PATTERN: TERSE (short answers)
- Make questions EASY to answer with specific prompts
- "How many students? Just a rough number is fine."
- Give examples: "Like, did you lead a specific project, train someone, create something?"
- One data point at a time — don't overwhelm`,

      humble: `
STUDENT PATTERN: HUMBLE (undersells achievements)
- They're hiding impressive details — surface them through facts
- "You said 'just tutored' — how many students was that, roughly?"
- Ask for numbers, outcomes, before/after — not feelings
- "What would NOT have happened if you weren't there?"
- Reframe through concrete questions, not confidence lectures`,

      reluctant: `
STUDENT PATTERN: RELUCTANT (uncomfortable)
- Create safety through casual, factual questions
- "I'm just trying to get the specifics — how many hours a week was this?"
- Ask what they DID, not how GOOD they were
- "Walk me through a typical session — what would I see you doing?"`,

      tangential: `
STUDENT PATTERN: TANGENTIAL (wanders off-topic)
- Acknowledge briefly, then redirect to specifics
- "Interesting! Coming back to YOUR role — what did you specifically create or lead?"
- Ask narrow, concrete questions to keep them focused
- "Let's stick with that project — how many people did it reach?"`,

      unknown: `
STUDENT PATTERN: UNKNOWN (calibrating)
- Start with open questions to gauge their style
- Pay attention to what they volunteer vs. hold back
- Match their energy while gathering initial data`,
    };

    return `${basePrompt}\n\n${patternGuidance[pattern]}`;
  }

  /**
   * Build the user prompt with full context including voice, quotes, and description
   */
  private buildUserPrompt(
    input: DynamicQuestionInput,
    voice: VoiceFingerprint,
    quotablePhrases: string[]
  ): string {
    const {
      baseQuestion,
      targetField,
      activityTitle,
      dynamics,
      conversationHistory,
      extractedHighlights,
      turnNumber,
      currentDescription,
      targetPlatform,
    } = input;

    const sections: string[] = [];

    sections.push(`ACTIVITY: ${activityTitle}`);
    sections.push(`TURN: ${turnNumber}`);
    sections.push(`STUDENT PATTERN: ${dynamics.detectedPattern}`);

    // Character limit context
    const charLimits = { common_app: 150, uc: 350, coalition: 255 };
    const charLimit = charLimits[targetPlatform || 'common_app'];
    sections.push(`TARGET: ${targetPlatform || 'common_app'} (${charLimit} char limit)`);

    // Current description being workshopped
    if (currentDescription && currentDescription.trim().length > 0) {
      sections.push(`\n=== THEIR CURRENT DESCRIPTION (${currentDescription.length}/${charLimit} chars) ===`);
      sections.push(`"${currentDescription}"`);
      sections.push(`WORKSHOP THIS. Quote specific parts that need improvement.`);

      // Identify vague parts of their description to probe
      const vaguePhrases = this.identifyVaguePhrases(currentDescription);
      if (vaguePhrases.length > 0) {
        sections.push(`\n=== VAGUE PARTS TO PROBE ===`);
        vaguePhrases.forEach((phrase, i) => {
          sections.push(`${i + 1}. "${phrase}" — ask for specifics`);
        });
      }
    } else {
      sections.push(`\n=== NO DESCRIPTION YET ===`);
      sections.push(`Gather details to build a ${charLimit}-char description from scratch.`);
    }

    // Voice fingerprint for matching their style
    sections.push(`\n=== STUDENT'S COMMUNICATION STYLE ===`);
    sections.push(`Formality: ${voice.formality} | Energy: ${voice.energy} | Verbosity: ${voice.verbosity}`);
    sections.push(`Match this style in your response.`);

    // CRITICAL: Quotable phrases they MUST reference
    if (quotablePhrases.length > 0) {
      sections.push(`\n=== EXACT PHRASES TO REFERENCE (pick at least one) ===`);
      quotablePhrases.forEach((phrase, i) => {
        sections.push(`${i + 1}. "${phrase}"`);
      });
      sections.push(`USE one of these exact phrases in your response to show you heard them.`);
    }

    // Most recent response (the one we're responding to)
    const lastTurn = conversationHistory[conversationHistory.length - 1];
    if (lastTurn) {
      sections.push(`\n=== STUDENT'S LAST RESPONSE (respond to THIS) ===`);
      sections.push(`"${lastTurn.response}"`);
      sections.push(`[Extraction: ${lastTurn.extraction.extractionQuality}]`);
    }

    // Brief conversation context
    if (conversationHistory.length > 1) {
      sections.push(`\n=== EARLIER CONTEXT (brief) ===`);
      const earlier = conversationHistory.slice(0, -1).slice(-2);
      for (const turn of earlier) {
        sections.push(`You asked: "${turn.question.substring(0, 80)}..."`);
        sections.push(`They said: "${turn.response.substring(0, 100)}..."`);
      }
    }

    // What we've gathered (for quality anchors)
    if (extractedHighlights.length > 0) {
      sections.push(`\n=== STRENGTHS TO BUILD ON (potential quality anchors) ===`);
      sections.push(extractedHighlights.slice(0, 4).join('\n'));
    }

    // The goal of this question
    sections.push(`\n=== YOUR GOAL ===`);
    sections.push(`Target: ${targetField.split('.').pop()}`);
    sections.push(`Base question (transform this): "${baseQuestion}"`);

    // Teaching insight if appropriate (one-liner only)
    const teachingInsight = this.getTeachingInsight(targetField, dynamics);
    if (teachingInsight) {
      sections.push(`\n=== OPTIONAL TEACHING (one sentence max) ===`);
      sections.push(`Insight: "${teachingInsight.quick}"`);
      sections.push(`Discovery Q: "${teachingInsight.discovery}"`);
      sections.push(`Weave in naturally OR skip if flow is better without it.`);
    }

    // Pattern-specific instructions
    sections.push(`\n=== RESPONSE REQUIREMENTS ===`);
    if (dynamics.detectedPattern === 'humble') {
      sections.push(`- Student is humble. Don't lecture about confidence.`);
      sections.push(`- Reframe with concrete questions: "You said 'just X' — how many times was that?"`);
      sections.push(`- Use discovery: "What wouldn't have happened without you?"`);
    } else if (dynamics.detectedPattern === 'reluctant') {
      sections.push(`- Student is uncomfortable. Create safety.`);
      sections.push(`- Ask what they DID, not how GOOD it was.`);
      sections.push(`- "I'm just curious — walk me through a typical day..."`);
    } else if (dynamics.detectedPattern === 'terse') {
      sections.push(`- Student gives short answers. Make it EASY to respond.`);
      sections.push(`- Very specific questions with examples help.`);
      sections.push(`- "For instance, did you ever...?" gives them a hook.`);
    }

    sections.push(`\nGenerate response. Remember: Quote their words, celebrate what works, then ask.`);

    return sections.join('\n');
  }

  /**
   * Get concise teaching insight for a field (one-liner, not lecture)
   */
  private getTeachingInsight(
    targetField: string,
    dynamics: ConversationDynamics
  ): { quick: string; discovery: string } | null {
    // Don't teach every turn — max every 2-3 turns
    if (dynamics.dataPointsSinceRecap < 2) {
      return null;
    }

    // Pattern-based teaching
    if (dynamics.detectedPattern === 'humble') {
      return TEACHING_INSIGHTS.reframingAchievements;
    }

    if (dynamics.detectedPattern === 'reluctant') {
      return TEACHING_INSIGHTS.authenticValue;
    }

    // Field-based teaching
    if (targetField.includes('scale') || targetField.includes('peopleDirectlyImpacted')) {
      return TEACHING_INSIGHTS.specificity;
    }

    if (targetField.includes('beforeAfter')) {
      return TEACHING_INSIGHTS.beforeAfterGold;
    }

    if (targetField.includes('recognition')) {
      return TEACHING_INSIGHTS.recognitionValue;
    }

    if (targetField.includes('roles')) {
      return TEACHING_INSIGHTS.roleOwnership;
    }

    if (targetField.includes('progression') || targetField.includes('evolution')) {
      return TEACHING_INSIGHTS.progression;
    }

    if (targetField.includes('initiative') || targetField.includes('started') || targetField.includes('founded')) {
      return TEACHING_INSIGHTS.initiative;
    }

    return null;
  }

  /**
   * Parse LLM response — now expects description workshopping fields
   */
  private parseResponse(content: string): Omit<DynamicQuestionOutput, 'tokensUsed' | 'quotedPhrases'> {
    try {
      let jsonStr = content.trim();

      // Extract from code blocks if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Find JSON object
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);

      // Parse description suggestion if present
      let descriptionSuggestion: DynamicQuestionOutput['descriptionSuggestion'];
      if (parsed.descriptionSuggestion && typeof parsed.descriptionSuggestion === 'object') {
        const ds = parsed.descriptionSuggestion;
        if (ds.improvedText) {
          descriptionSuggestion = {
            improvedText: String(ds.improvedText),
            changes: String(ds.changes || 'Updated with new details'),
            charCount: typeof ds.charCount === 'number' ? ds.charCount : String(ds.improvedText).length,
          };
        }
      }

      // Validate and clean teaching moment (must be <35 chars, no dashes)
      let teachingMoment: string | undefined;
      if (parsed.teachingMoment && parsed.teachingMoment !== 'null') {
        const tm = String(parsed.teachingMoment);
        // Reject if too long, has dashes, or has multiple sentences
        const hasDash = tm.includes('—') || tm.includes(' - ') || tm.includes(';');
        const hasMidPeriod = (tm.match(/\./g) || []).length > 1;
        if (tm.length <= 35 && !hasDash && !hasMidPeriod) {
          teachingMoment = tm;
        }
        // Otherwise, silently drop it (undefined)
      }

      return {
        question: String(parsed.question || ''),
        teachingMoment,
        qualityAnchor: parsed.qualityAnchor && parsed.qualityAnchor !== 'null'
          ? String(parsed.qualityAnchor)
          : undefined,
        tone: this.normalizeTone(parsed.tone),
        reasoning: String(parsed.reasoning || 'Generated dynamically'),
        descriptionFocus: parsed.descriptionFocus && parsed.descriptionFocus !== 'null'
          ? String(parsed.descriptionFocus)
          : undefined,
        descriptionSuggestion,
      };
    } catch {
      return {
        question: content.split('\n')[0] || 'Tell me more about that.',
        tone: 'curious',
        reasoning: 'Parsed from raw response',
      };
    }
  }

  /**
   * Normalize tone value
   */
  private normalizeTone(tone: unknown): DynamicQuestionOutput['tone'] {
    const valid = ['warm', 'curious', 'encouraging', 'reflective', 'validating'];
    const t = String(tone || '').toLowerCase();
    return valid.includes(t) ? (t as DynamicQuestionOutput['tone']) : 'curious';
  }

  /**
   * Create contextual fallback when LLM fails
   *
   * KEY IMPROVEMENT: Uses actual quotes from student response even in fallback mode.
   * Structure remains fixed, but content is tailored to what they said.
   */
  private createContextualFallback(
    input: DynamicQuestionInput,
    voice: VoiceFingerprint,
    quotablePhrases: string[]
  ): DynamicQuestionOutput {
    const { baseQuestion, dynamics, conversationHistory } = input;
    const lastResponse = conversationHistory[conversationHistory.length - 1]?.response || '';

    // ===================================================================
    // STRUCTURE: Acknowledgment → Quality Anchor (optional) → Question
    // CONTENT: Tailored using their actual words
    // ===================================================================

    let acknowledgment = '';
    let qualityAnchor: string | undefined;
    let question = baseQuestion;
    let teachingMoment: string | undefined;

    // Step 1: Build acknowledgment using their exact words
    if (quotablePhrases.length > 0) {
      const quote = quotablePhrases[0];
      acknowledgment = `You mentioned "${quote}" — `;
    } else if (lastResponse) {
      // Extract a meaningful phrase even without pattern matching
      const words = lastResponse.split(' ').slice(0, 8).join(' ');
      if (words.length > 15) {
        acknowledgment = `I hear you on "${words}..." `;
      }
    }

    // Step 2: Pattern-specific adaptations
    switch (dynamics.detectedPattern) {
      case 'humble':
        // Reframe without lecturing
        if (!acknowledgment) acknowledgment = "I see — ";
        teachingMoment = TEACHING_INSIGHTS.reframingAchievements.quick;
        question = baseQuestion.replace(
          /what|how much|how many/i,
          (match) => `specifically, ${match.toLowerCase()}`
        );
        // Add discovery question
        if (!question.includes('?')) {
          question += ` ${TEACHING_INSIGHTS.reframingAchievements.discovery}`;
        }
        break;

      case 'reluctant':
        // Create safety
        acknowledgment = acknowledgment || "No pressure here — ";
        teachingMoment = TEACHING_INSIGHTS.authenticValue.quick;
        // Make it about what they DID, not evaluation
        question = `I'm just curious — ${baseQuestion.toLowerCase().replace('?', '')}? Whatever comes to mind is fine.`;
        break;

      case 'terse':
        // Make it easier to answer with specifics — give concrete examples
        acknowledgment = acknowledgment || "Thanks for sharing. ";
        if (baseQuestion.toLowerCase().includes('did you')) {
          question = baseQuestion.replace(/did you/i, 'can you walk me through a specific instance when you');
        } else {
          // Always add "for instance" or "example" to make answering easier
          question = `${baseQuestion} For instance, a specific article, project, or piece you created would help.`;
        }
        teachingMoment = TEACHING_INSIGHTS.specificity.quick;
        break;

      case 'engaged':
        // Don't slow them down — just probe deeper
        if (quotablePhrases.length > 0) {
          acknowledgment = `"${quotablePhrases[0]}" — that's interesting. `;
        }
        // No teaching moment for engaged students (keep momentum)
        break;

      case 'tangential':
        // Acknowledge but redirect
        acknowledgment = acknowledgment || "That's interesting. Coming back to the original question — ";
        question = baseQuestion;
        break;

      default:
        // Unknown pattern — stay warm and open
        acknowledgment = acknowledgment || "";
        break;
    }

    // Step 3: Voice matching — adjust formality
    if (voice.formality === 'casual') {
      question = question.replace("Could you", "Can you").replace("Would you", "Mind if you");
    } else if (voice.formality === 'formal') {
      question = question.replace("can you", "could you").replace("what's", "what is");
    }

    // Compose final response
    const finalQuestion = `${acknowledgment}${question}`.trim();

    // Step 4: Generate description focus and suggestion if workshopping
    let descriptionFocus: string | undefined;
    let descriptionSuggestion: DynamicQuestionOutput['descriptionSuggestion'];

    if (input.currentDescription && input.currentDescription.trim().length > 0) {
      // Find vague parts in their description to highlight
      const vaguePhrases = this.identifyVaguePhrases(input.currentDescription);
      if (vaguePhrases.length > 0) {
        descriptionFocus = vaguePhrases[0];
      }

      // Generate an improved description based on what we've learned from conversation
      const newDetails = this.extractNewDetailsFromHistory(conversationHistory);
      if (newDetails.length > 0) {
        const charLimit = input.targetPlatform === 'uc' ? 350 :
                          input.targetPlatform === 'coalition' ? 255 : 150;
        const improvedText = this.generateImprovedDescription(
          input.currentDescription,
          newDetails,
          charLimit
        );
        descriptionSuggestion = {
          improvedText,
          changes: `Added: ${newDetails.slice(0, 2).join(', ')}`,
          charCount: improvedText.length,
        };
      }
    }

    return {
      question: finalQuestion,
      teachingMoment,
      qualityAnchor,
      quotedPhrases: quotablePhrases.length > 0 ? quotablePhrases : undefined,
      tone: dynamics.detectedPattern === 'reluctant' ? 'validating' :
            dynamics.detectedPattern === 'humble' ? 'encouraging' :
            dynamics.detectedPattern === 'terse' ? 'warm' : 'curious',
      reasoning: `Contextual fallback with ${quotablePhrases.length} quotes, voice: ${voice.formality}/${voice.energy}`,
      descriptionFocus,
      descriptionSuggestion,
    };
  }

  /**
   * Extract specific details from conversation history for description improvement
   */
  private extractNewDetailsFromHistory(
    history: Array<{ question: string; response: string; extraction: ExtractionResult }>
  ): string[] {
    const details: string[] = [];

    for (const turn of history) {
      // Extract numbers with context
      const numbers = turn.response.match(/\d+\s+[\w\s]{2,15}/g);
      if (numbers) {
        details.push(...numbers.slice(0, 2));
      }

      // Extract action phrases
      const actions = turn.response.match(/(?:led|created|built|designed|organized|taught|trained|managed|founded)\s+[\w\s]{5,25}/gi);
      if (actions) {
        details.push(...actions.slice(0, 2));
      }

      // Extract before/after patterns
      const transformations = turn.response.match(/from\s+[\w\s]+\s+to\s+[\w\s]+/gi);
      if (transformations) {
        details.push(...transformations.slice(0, 1));
      }
    }

    return [...new Set(details)].slice(0, 5);
  }

  /**
   * Generate an improved description using gathered details
   */
  private generateImprovedDescription(
    current: string,
    newDetails: string[],
    charLimit: number
  ): string {
    // Simple improvement: replace vague terms with specific details
    let improved = current;

    // Replace vague quantifiers with specific numbers if available
    const numberDetail = newDetails.find(d => /\d+/.test(d));
    if (numberDetail) {
      improved = improved
        .replace(/many\s+\w+/i, numberDetail.trim())
        .replace(/some\s+\w+/i, numberDetail.trim())
        .replace(/various\s+\w+/i, numberDetail.trim());
    }

    // Replace vague action words with specific ones
    const actionDetail = newDetails.find(d => /(?:led|created|built|designed)/i.test(d));
    if (actionDetail) {
      improved = improved
        .replace(/helped with/i, actionDetail.trim())
        .replace(/worked on/i, actionDetail.trim())
        .replace(/contributed to/i, actionDetail.trim());
    }

    // Ensure we stay within character limit
    if (improved.length > charLimit) {
      improved = improved.substring(0, charLimit - 3) + '...';
    }

    return improved;
  }

  /**
   * Generate a teaching-focused recap that uses their exact words
   *
   * KEY PATTERN: Quote specific things they said, not generic summaries.
   * One-liner teaching at most, then move forward.
   */
  async generateTeachingRecap(
    extractedData: string[],
    profile: ActivityProfile,
    dynamics: ConversationDynamics
  ): Promise<{ recap: string; teachingInsight: string; quotedHighlights: string[] }> {
    if (extractedData.length === 0) {
      return {
        recap: '',
        teachingInsight: '',
        quotedHighlights: [],
      };
    }

    const highlights = extractedData.slice(0, 3);

    // Build recap by quoting their actual data, not generic phrases
    // Structure: "You've shared [specific thing 1], [specific thing 2]. [One-liner insight]"
    const quotedParts = highlights.map(h => `"${h}"`).join(', ');
    const recap = `You've shared some strong details: ${quotedParts}.`;

    // Concise teaching — one sentence max
    let teachingInsight = '';
    const hasNumbers = highlights.some(h => /\d+/.test(h));
    const hasBeforeAfter = highlights.some(h => /from\s+.+\s+to/i.test(h));
    const hasRecognition = highlights.some(h => /award|recognition|selected|chosen|won/i.test(h));

    if (hasBeforeAfter) {
      teachingInsight = TEACHING_INSIGHTS.beforeAfterGold.quick;
    } else if (hasNumbers) {
      teachingInsight = TEACHING_INSIGHTS.specificity.quick;
    } else if (hasRecognition) {
      teachingInsight = TEACHING_INSIGHTS.recognitionValue.quick;
    } else {
      teachingInsight = "Good foundation — let's keep building.";
    }

    return { recap, teachingInsight, quotedHighlights: highlights };
  }

  /**
   * Generate a contextual follow-up that quotes their exact words
   *
   * KEY PATTERNS:
   * 1. Always quote the specific phrase that triggered the follow-up
   * 2. Discovery questions, not lectures
   * 3. One redirect at a time
   */
  async generateContextualFollowUp(
    response: string,
    extraction: ExtractionResult,
    profile: ActivityProfile,
    targetField: string
  ): Promise<{ followUp: string; reason: string; quotedPhrase: string } | null> {
    // Don't interrupt good flow
    if (extraction.extractionQuality === 'rich') {
      return null;
    }

    // Opportunities that quote their exact words and ask discovery questions
    // ORDER MATTERS: More specific patterns first (before/after before generic numbers)
    const opportunities: Array<{
      pattern: RegExp;
      template: (match: RegExpMatchArray) => { followUp: string; quote: string };
      reason: string;
    }> = [
      {
        // Before/after → Probe causation (HIGHEST PRIORITY - most impactful)
        pattern: /from\s+(\d+|[\w-]+)(?:\s+[\w]+)?\s+to\s+(\d+|[\w-]+)/i,
        template: (m) => ({
          followUp: `"From ${m[1]} to ${m[2]}" — that's exactly the kind of change that stands out. What did YOU do that caused that shift?`,
          quote: `from ${m[1]} to ${m[2]}`,
        }),
        reason: 'Probe causation in transformation',
      },
      {
        // Team language → Redirect to individual role
        pattern: /(we|the team|the club|our group)\s+(did|made|created|built|organized|started)\s+([\w\s]{5,30})/i,
        template: (m) => ({
          followUp: `You mentioned "${m[0]}" — within that, what was YOUR specific piece?`,
          quote: m[0],
        }),
        reason: 'Redirect from team to individual contribution',
      },
      {
        // Humble language → Discovery question to reframe
        pattern: /(just|only|nothing special|anyone could have|the others|I mean)/i,
        template: (m) => ({
          followUp: `"${m[0]}" — I hear the modesty. Let me ask differently: what wouldn't have happened if you weren't there?`,
          quote: m[0],
        }),
        reason: 'Reframe humble response with discovery question',
      },
      {
        // Numbers (without before/after context) → Probe meaning
        pattern: /(\d+)\s*(hours?|hrs?|students?|people|members?|times?)/i,
        template: (m) => ({
          followUp: `"${m[0]}" — that's a real commitment. What kept you coming back?`,
          quote: m[0],
        }),
        reason: 'Probe motivation behind quantified commitment',
      },
      {
        // Passive accomplishment → Make it active
        pattern: /(it was|there was|things got|stuff happened|we managed to)\s+([\w\s]{5,25})/i,
        template: (m) => ({
          followUp: `You mentioned "${m[0]}" — what specifically did you DO to make that happen?`,
          quote: m[0],
        }),
        reason: 'Convert passive to active ownership',
      },
    ];

    for (const { pattern, template, reason } of opportunities) {
      const match = response.match(pattern);
      if (match) {
        const result = template(match);
        return {
          followUp: result.followUp,
          reason,
          quotedPhrase: result.quote,
        };
      }
    }

    return null;
  }
}

// Export singleton
export const dynamicConversationEngine = new DynamicConversationEngine();
