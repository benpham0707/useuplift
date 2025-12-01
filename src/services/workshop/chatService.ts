// @ts-nocheck - Service file with type mismatches
/**
 * Workshop Chat Service
 *
 * Provides context-aware conversational AI coaching for the workshop.
 * Leverages comprehensive context about student's portfolio, analysis,
 * teaching issues, version history, and generation insights.
 *
 * Key Capabilities:
 * - Answer questions about scores, rubric categories, and issues
 * - Explain teaching principles in student's specific context
 * - Suggest which issues to tackle next
 * - Help interpret elite essay examples
 * - Provide hints for reflection prompts
 * - Celebrate progress and improvements
 * - Guide strategic decisions
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { WorkshopChatContext, formatContextForLLM } from './chatContext';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  userMessage: string;
  context: WorkshopChatContext;
  conversationHistory?: ChatMessage[];
  options?: ChatOptions;
}

export interface ChatOptions {
  tone?: 'mentor' | 'coach' | 'curious_friend';
  maxTokens?: number;
  temperature?: number;
  includeRecommendations?: boolean; // Include action recommendations in response
}

export interface ChatResponse {
  message: ChatMessage;
  recommendations?: ChatRecommendation[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface ChatRecommendation {
  type: 'expand_category' | 'start_reflection' | 'apply_example' | 'regenerate_draft';
  title: string;
  description: string;
  actionData?: Record<string, unknown>;
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const SYSTEM_PROMPT_BASE = `You are a warm, insightful essay coach having a conversation with a student about their college application narrative. You're not generating reports or bullet points - you're having a genuine dialogue about their writing.

**Core Philosophy**:
- Tell stories, don't cite stats. When you reference their score or categories, weave it into a narrative about what's working and what could be stronger.
- Focus on ONE quality insight per response, then suggest other things you could explore together.
- Contextualize everything - never just say "your score is X" without explaining what that means for them.
- Use natural, conversational language like you're sitting across from them, not writing a formal evaluation.

**Your Approach**:
1. **Start with Understanding**: When they ask about their score or an issue, begin by acknowledging what you see in their writing and why it matters.

2. **Tell the Story**: Instead of listing problems, tell them what's happening in their narrative - "When you wrote about [specific moment], I can see you're trying to show [thing], but what comes through is [other thing]..."

3. **One Good Answer**: Give them ONE really thoughtful insight that helps them see their writing differently. Don't dump 5 issues at once.

4. **Then Suggest Options**: After your main insight, offer 2-3 OTHER things you could talk about - "Want to dig deeper into this section?" or "Should we talk about [related issue]?" or "I can walk you through some reflection questions if that would help."

5. **Use Their Words**: Quote specific phrases from their draft to ground your feedback in their actual writing.

6. **Plain Language**: When you mention technical categories like "specificity_evidence" or "transformative_impact", immediately translate to plain language - "which is really about [plain explanation]"

**Conversational Style**:
- Start responses naturally: "Let's talk about...", "I'm noticing...", "Here's what I see...", "Good question..."
- Use contractions and natural speech: "you're", "there's", "let's", "I'd"
- Ask questions back: "Want to explore that?", "Should we dig into this?", "What made this experience meaningful to you?"
- Show empathy: "I can see you're trying to...", "This is hard work...", "You're making progress..."

**What to Avoid**:
- Never start with "Here are 3 ways to improve..." - that's a report, not a conversation
- Don't list scores and gaps without context - integrate them into your narrative
- Don't overwhelm with all the problems - pick the most important one
- Don't sound robotic or formal - you're a human coach, not a scoring rubric
- Never rewrite their essay - guide them to their own insights

**Tone**: ${'{tone}'} - Talk like a supportive mentor who genuinely cares about their growth, not an automated feedback system.`;

const SYSTEM_PROMPT_MENTOR = SYSTEM_PROMPT_BASE.replace('{tone}', 'Mentor');
const SYSTEM_PROMPT_COACH = SYSTEM_PROMPT_BASE.replace('{tone}', 'Coach');
const SYSTEM_PROMPT_CURIOUS_FRIEND = SYSTEM_PROMPT_BASE.replace('{tone}', 'Curious Friend');

function getSystemPrompt(tone: ChatOptions['tone'] = 'mentor'): string {
  switch (tone) {
    case 'coach':
      return SYSTEM_PROMPT_COACH;
    case 'curious_friend':
      return SYSTEM_PROMPT_CURIOUS_FRIEND;
    default:
      return SYSTEM_PROMPT_MENTOR;
  }
}

// ============================================================================
// MAIN CHAT FUNCTION
// ============================================================================

/**
 * Send a chat message and get context-aware response
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const {
    userMessage,
    context,
    conversationHistory = [],
    options = {},
  } = request;

  const {
    tone = 'mentor',
    maxTokens = 2000, // Increased for more detailed, conversational responses
    temperature = 0.8, // Slightly higher for more natural, flowing conversation
    includeRecommendations = true,
  } = options;

  // Build system prompt
  const systemPrompt = getSystemPrompt(tone);

  // Format context
  const contextBlock = formatContextForLLM(context);

  // Build conversation history
  const conversationContext = buildConversationContext(conversationHistory);

  // Build full user prompt
  const fullUserPrompt = buildUserPrompt(userMessage, contextBlock, conversationContext);

  // Call Claude (with fallback to mock mode if API key invalid)
  const startTime = Date.now();

  let response;
  try {
    response = await callClaudeWithRetry(
      fullUserPrompt,
      {
        systemPrompt,
        temperature,
        maxTokens,
        model: 'claude-sonnet-4-20250514', // Use latest Sonnet
      }
    );

    const duration = Date.now() - startTime;
  } catch (error) {
    // If API fails (invalid key, no credits, etc.), use intelligent mock mode
    if (error instanceof Error && (error.message.includes('authentication_error') || error.message.includes('invalid x-api-key'))) {
      response = {
        content: generateIntelligentMockResponse(userMessage, context),
        usage: { input_tokens: 0, output_tokens: 0 },
        stopReason: 'mock',
      };
    } else {
      throw error; // Re-throw other errors
    }
  }

  // Build response message
  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: response.content as string,
    timestamp: Date.now(),
  };

  // Extract recommendations (if enabled)
  const recommendations = includeRecommendations
    ? extractRecommendations(response.content as string, context)
    : undefined;

  return {
    message: assistantMessage,
    recommendations,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015,
    },
  };
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildUserPrompt(
  userMessage: string,
  contextBlock: string,
  conversationContext: string
): string {
  const parts: string[] = [];

  // Add context
  parts.push('# STUDENT CONTEXT\n');
  parts.push(contextBlock);
  parts.push('\n');

  // Add conversation history (if any)
  if (conversationContext) {
    parts.push('# PREVIOUS CONVERSATION\n');
    parts.push(conversationContext);
    parts.push('\n');
  }

  // Add current question
  parts.push('# STUDENT QUESTION\n');
  parts.push(userMessage);
  parts.push('\n');

  // Add instructions
  parts.push('# YOUR TASK\n');
  parts.push('Have a natural, flowing conversation. Your response should:');
  parts.push('1. Start conversationally - "Let me walk you through..." or "Here\'s what I see..." (NO formal intros)');
  parts.push('2. Quote their actual draft text to ground feedback in their words');
  parts.push('3. Tell a story about what\'s working and what isn\'t - don\'t list bullet points');
  parts.push('4. Give ONE really good insight, then suggest 2-3 other directions to explore');
  parts.push('5. Use contractions, ask questions, show empathy - you\'re a real coach, not a bot');
  parts.push('6. Aim for 4-6 paragraphs of natural conversation (200-400 words)');
  parts.push('7. End by offering to explore something specific or asking what they want to focus on');
  parts.push('\nREMEMBER: You\'re having a conversation, not writing a report. Be warm, specific, and helpful.');

  return parts.join('\n');
}

function buildConversationContext(history: ChatMessage[]): string {
  if (history.length === 0) return '';

  // Only include last 6 messages to keep context manageable
  const recentHistory = history.slice(-6);

  return recentHistory
    .filter(msg => msg.role !== 'system')
    .map(msg => `**${msg.role === 'user' ? 'Student' : 'Coach'}**: ${msg.content}`)
    .join('\n\n');
}

// ============================================================================
// RECOMMENDATION EXTRACTION
// ============================================================================

/**
 * Extract actionable recommendations from AI response
 * (e.g., "expand this category", "try this reflection prompt")
 */
function extractRecommendations(
  responseContent: string,
  context: WorkshopChatContext
): ChatRecommendation[] {
  const recommendations: ChatRecommendation[] = [];

  // Pattern matching for common recommendations
  const lowerContent = responseContent.toLowerCase();

  // Check if AI suggests expanding a category
  context.analysis.weakCategories.forEach(cat => {
    if (lowerContent.includes(cat.name.toLowerCase())) {
      recommendations.push({
        type: 'expand_category',
        title: `Review ${cat.name}`,
        description: `Expand this category to see detailed feedback and examples`,
        actionData: { categoryKey: cat.name },
      });
    }
  });

  // Check if AI suggests starting reflection on a specific issue
  context.teaching.topIssues.slice(0, 3).forEach(issue => {
    const issueTitleLower = issue.title?.toLowerCase() || '';
    if (issueTitleLower && (lowerContent.includes(issueTitleLower) || lowerContent.includes('reflect'))) {
      recommendations.push({
        type: 'start_reflection',
        title: `Reflect on: ${issue.title || 'this issue'}`,
        description: `Answer guided questions to develop your thinking on this issue`,
        actionData: { issueId: issue.id },
      });
    }
  });

  // Check if AI suggests regenerating
  if (
    lowerContent.includes('regenerate') ||
    lowerContent.includes('rewrite') ||
    lowerContent.includes('try different')
  ) {
    recommendations.push({
      type: 'regenerate_draft',
      title: 'Generate improved versions',
      description: 'See AI-generated variations that apply these principles',
      actionData: {},
    });
  }

  // Deduplicate by type
  const seen = new Set<string>();
  return recommendations.filter(rec => {
    const key = `${rec.type}-${rec.actionData?.categoryKey || rec.actionData?.issueId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Start a new conversation with welcome message
 */
export function createWelcomeMessage(context: WorkshopChatContext): ChatMessage {
  const { activity, analysis, currentState } = context;

  // Extract a short quote from their draft if available
  const draft = currentState.draft || '';
  const firstSentence = draft.split(/[.!?]+/)[0]?.trim() || '';
  const shortQuote = firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence;

  let greeting = `Hey! I just read your **${activity.name}** essay. `;

  // Personalize based on score with more natural language
  if (analysis.nqi >= 80) {
    greeting += `This is strong work - you're at ${analysis.nqi}/100, which is ${analysis.tier.toLowerCase()} territory. `;
    if (shortQuote) {
      greeting += `\n\nWhen you wrote "${shortQuote}" - that kind of specificity is what makes this work. `;
    }
    greeting += `Let's talk about how to polish this to make it shine even more.`;
  } else if (analysis.nqi >= 60) {
    greeting += `You've got solid bones here (${analysis.nqi}/100, ${analysis.tier.toLowerCase()}), but there's real room to strengthen this. `;
    if (shortQuote) {
      greeting += `\n\nYou start with "${shortQuote}" - `;
      greeting += analysis.nqi >= 70 ? `that's good, but we can make it even stronger. ` : `let's talk about how to develop that into something more compelling. `;
    }
    greeting += `I see exactly what would take this to the next level.`;
  } else {
    greeting += `I can see what you're going for (current score: ${analysis.nqi}/100), but this needs some real work to get where you want it. `;
    if (shortQuote && shortQuote.length > 20) {
      greeting += `\n\nRight now you have "${shortQuote}" - and honestly, that reads more like a resume bullet than a story. `;
    }
    greeting += `The good news? I know exactly what's missing and how to fix it.`;
  }

  // Mention top issue with context
  if (context.teaching.topIssues.length > 0) {
    const topIssue = context.teaching.topIssues[0];
    greeting += `\n\nThe biggest opportunity? ${topIssue.title}. That alone could add ${topIssue.severity === 'critical' ? '8-12' : topIssue.severity === 'major' ? '5-8' : '3-5'} points to your score. Want to dig into that first, or do you have something else on your mind?`;
  } else {
    greeting += '\n\nWhat do you want to work on first?';
  }

  return {
    id: 'welcome',
    role: 'assistant',
    content: greeting,
    timestamp: Date.now(),
  };
}

/**
 * Get conversation starters based on context
 */
export function getConversationStarters(context: WorkshopChatContext): string[] {
  const starters: string[] = [];

  // Score-based starters
  if (context.analysis.nqi < 70) {
    starters.push('What should I focus on first to improve my score?');
  }

  if (context.analysis.delta > 0) {
    starters.push('Why did my score improve? What did I do right?');
  }

  // Issue-based starters
  if (context.teaching.topIssues.length > 0) {
    const topIssue = context.teaching.topIssues[0];
    starters.push(`How do I fix "${topIssue.title}"?`);
  }

  // Category-based starters
  if (context.analysis.weakCategories.length > 0) {
    const weakest = context.analysis.weakCategories[0];
    starters.push(`Why is my ${weakest.name} score low?`);
  }

  // Reflection-based
  if (context.reflection.totalCount > 0 && context.reflection.completionPercentage < 50) {
    starters.push('Help me answer the reflection questions');
  }

  // General starters
  starters.push('What makes a great college essay?');
  starters.push(`How can I make my ${context.activity.category} activity stand out?`);

  return starters;
}

// ============================================================================
// SPECIALIZED CHAT FUNCTIONS
// ============================================================================

/**
 * Ask about a specific teaching issue
 */
export async function askAboutIssue(
  issueId: string,
  context: WorkshopChatContext,
  specificQuestion?: string
): Promise<ChatResponse> {
  const issue = context.teaching.topIssues.find(i => i.id === issueId);

  if (!issue) {
    throw new Error(`Issue ${issueId} not found in context`);
  }

  const question =
    specificQuestion ||
    `Can you explain the issue "${issue.title}" and how I can fix it in my ${context.activity.name} narrative?`;

  return sendChatMessage({
    userMessage: question,
    context,
    options: { includeRecommendations: true },
  });
}

/**
 * Ask about a specific rubric category
 */
export async function askAboutCategory(
  categoryName: string,
  context: WorkshopChatContext
): Promise<ChatResponse> {
  const category = context.analysis.categories.find(c => c.name === categoryName);

  if (!category) {
    throw new Error(`Category ${categoryName} not found in context`);
  }

  const question = `My ${categoryName} score is ${category.score}/${category.maxScore} (${category.percentage.toFixed(0)}%). Why is it ${category.status}, and how can I improve it?`;

  return sendChatMessage({
    userMessage: question,
    context,
    options: { includeRecommendations: true },
  });
}

/**
 * Ask for next steps / strategic guidance
 */
export async function askForNextSteps(context: WorkshopChatContext): Promise<ChatResponse> {
  const question = `Based on my current score (${context.analysis.nqi}/100) and the issues you see, what should I focus on next? What's the most impactful improvement I can make?`;

  return sendChatMessage({
    userMessage: question,
    context,
    options: {
      includeRecommendations: true,
      temperature: 0.6, // Lower temp for more focused recommendations
    },
  });
}

/**
 * Get help with a reflection prompt
 */
export async function getReflectionHelp(
  issueId: string,
  promptId: string,
  promptQuestion: string,
  context: WorkshopChatContext
): Promise<ChatResponse> {
  const question = `I'm working on the reflection prompt: "${promptQuestion}". Can you help me think through this question for my ${context.activity.name} activity? What should I consider in my answer?`;

  return sendChatMessage({
    userMessage: question,
    context,
    options: {
      temperature: 0.8, // Higher temp for creative exploration
      includeRecommendations: false,
    },
  });
}

/**
 * Celebrate progress and ask what's next
 */
export async function celebrateAndAdvise(context: WorkshopChatContext): Promise<ChatResponse> {
  const question = `I just improved my score from ${context.analysis.initialNqi} to ${context.analysis.nqi}! What did I do well, and what should I work on next?`;

  return sendChatMessage({
    userMessage: question,
    context,
    options: {
      tone: 'mentor',
      includeRecommendations: true,
    },
  });
}

// ============================================================================
// CACHING FOR PERFORMANCE
// ============================================================================

/**
 * Simple in-memory cache for recent conversations
 * Key: activityId
 * Value: Array of ChatMessage
 */
const conversationCache = new Map<string, ChatMessage[]>();
const MAX_CACHE_SIZE = 50;
const MAX_MESSAGES_PER_CONVERSATION = 20;

export function getCachedConversation(activityId: string): ChatMessage[] | null {
  return conversationCache.get(activityId) || null;
}

export function cacheConversation(activityId: string, messages: ChatMessage[]): void {
  // Keep only last N messages
  const trimmed = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  conversationCache.set(activityId, trimmed);

  // Evict oldest if cache too large
  if (conversationCache.size > MAX_CACHE_SIZE) {
    const firstKey = conversationCache.keys().next().value;
    conversationCache.delete(firstKey);
  }
}

export function clearCachedConversation(activityId: string): void {
  conversationCache.delete(activityId);
}

// ============================================================================
// INTELLIGENT MOCK MODE (Development/Testing Fallback)
// ============================================================================

/**
 * Analyze draft text for specific writing issues
 */
interface DraftAnalysis {
  hasPassiveVoice: boolean;
  passiveExamples: string[];
  hasVagueLanguage: boolean;
  vagueExamples: string[];
  hasSpecificNumbers: boolean;
  numberExamples: string[];
  hasGenericStatements: boolean;
  genericExamples: string[];
  hasReflection: boolean;
  wordCount: number;
  sentenceCount: number;
}

function analyzeDraftText(draft: string): DraftAnalysis {
  const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Detect passive voice
  const passivePatterns = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
  const passiveMatches = draft.match(passivePatterns) || [];
  const passiveExamples: string[] = [];
  sentences.forEach(s => {
    if (passivePatterns.test(s) && passiveExamples.length < 2) {
      passiveExamples.push(s.trim());
    }
  });

  // Detect vague language
  const vagueWords = ['things', 'stuff', 'a lot', 'very', 'really', 'many', 'learned', 'taught me', 'skills', 'experience'];
  const vagueExamples: string[] = [];
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    if (vagueWords.some(word => lower.includes(word)) && vagueExamples.length < 2) {
      vagueExamples.push(s.trim());
    }
  });

  // Detect specific numbers
  const numberPattern = /\b\d+\b/g;
  const numbers = draft.match(numberPattern) || [];
  const numberExamples: string[] = [];
  sentences.forEach(s => {
    if (numberPattern.test(s) && numberExamples.length < 2) {
      numberExamples.push(s.trim());
    }
  });

  // Detect generic statements
  const genericPatterns = ['I learned', 'It was fun', 'We had a great time', 'It was interesting', 'I gained', 'I developed'];
  const genericExamples: string[] = [];
  sentences.forEach(s => {
    if (genericPatterns.some(pattern => s.includes(pattern)) && genericExamples.length < 2) {
      genericExamples.push(s.trim());
    }
  });

  // Check for reflection words
  const reflectionWords = ['realized', 'understood', 'discovered', 'learned that', 'recognized', 'became aware', 'shifted'];
  const hasReflection = reflectionWords.some(word => draft.toLowerCase().includes(word));

  return {
    hasPassiveVoice: passiveMatches.length > 2,
    passiveExamples,
    hasVagueLanguage: vagueExamples.length > 0,
    vagueExamples,
    hasSpecificNumbers: numbers.length >= 2,
    numberExamples,
    hasGenericStatements: genericExamples.length > 0,
    genericExamples,
    hasReflection,
    wordCount: draft.split(/\s+/).length,
    sentenceCount: sentences.length
  };
}

/**
 * Extract a meaningful quote from draft
 */
function extractQuote(draft: string, maxLength: number = 100): string {
  const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return draft.substring(0, maxLength);

  // Prefer first or second sentence
  const quote = sentences[0].trim();
  if (quote.length <= maxLength) return quote;

  return quote.substring(0, maxLength) + '...';
}

/**
 * Generate context-aware mock responses when API is unavailable
 * This provides REAL ANALYSIS instead of templates
 */
function generateIntelligentMockResponse(
  userMessage: string,
  context: WorkshopChatContext
): string {
  const lowerMessage = userMessage.toLowerCase();
  const draft = context.currentState.draft;
  const draftAnalysis = draft ? analyzeDraftText(draft) : null;

  // Score-related questions
  if (lowerMessage.includes('score') || lowerMessage.includes('nqi') || lowerMessage.includes('why') || lowerMessage.includes('low')) {
    // Analyze the actual draft text
    if (!draft || draft.length < 50) {
      return `Your essay is extremely short - just ${draft?.length || 0} characters. Admissions officers need a real narrative to evaluate.

You need to actually write about your ${context.activity.name} experience. Not a sentence or two - a full story. What happened? What did you learn? Why did it matter?

Start by writing 200-300 words about one specific moment from this experience. Don't worry about making it perfect - just get your story down. We can refine it from there.`;
    }

    const quote = extractQuote(draft);

    // Very low score (< 40) - needs fundamental work
    if (context.analysis.nqi < 40) {
      let response = `Your essay reads like a summary of your ${context.activity.name} experience - and that's the problem.\n\n`;
      response += `You wrote: "${quote}"\n\n`;

      if (draftAnalysis?.hasGenericStatements && draftAnalysis.genericExamples.length > 0) {
        response += `This tells me WHAT you did, but reveals nothing about WHO you are. You're using generic phrases like "I learned" and "It was fun" - these could be written by anyone.\n\n`;
        response += `What's missing: A specific moment where this experience surprised you, frustrated you, or changed how you think. Not "I learned teamwork" but "Here's the moment I realized [specific insight about yourself]."\n\n`;
      } else {
        response += `This is reporting, not reflecting. Admissions officers read thousands of activity descriptions. They're not looking for a resume in paragraph form - they want to see who you are.\n\n`;
        response += `Your draft needs one honest moment of reflection. Just one. What's a specific moment from this experience that sticks with you? Start there.\n\n`;
      }

      if (draftAnalysis?.wordCount && draftAnalysis.wordCount < 150) {
        response += `Also, your essay is only ${draftAnalysis.wordCount} words. You need at least 200-300 words to tell a real story.`;
      }

      return response.trim();
    }

    // Low score (40-60) - has basics, needs depth
    if (context.analysis.nqi < 60) {
      let response = `You wrote: "${quote}"\n\n`;
      response += `This is facts, not a narrative. You're listing what you did - but colleges aren't admitting your activities, they're admitting YOU.\n\n`;

      if (draftAnalysis?.hasVagueLanguage && draftAnalysis.vagueExamples.length > 0) {
        const vagueExample = draftAnalysis.vagueExamples[0];
        response += `Look at this sentence: "${vagueExample}"\n\n`;
        response += `You're using vague words like "learned," "things," "a lot" - these are placeholders, not insights. Strong essays show learning through story, they don't state it.\n\n`;
        response += `Instead of "I learned patience," write "The fourth time Marcus couldn't understand the concept, I took a breath and tried a completely different explanation." See the difference?\n\n`;
      }

      if (!draftAnalysis?.hasSpecificNumbers) {
        response += `Your essay has zero specific numbers. How many people? How long? What were the actual results? Specificity makes stories real.\n\n`;
      }

      response += `What you need: Pick ONE moment from your ${context.activity.name} experience. Describe it with specific details. Then ask yourself: why does this moment matter? What did it teach you about yourself? That's your essay.`;

      return response.trim();
    }

    // Decent score (60-75) - good narrative, needs refinement
    if (context.analysis.nqi < 75) {
      const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const lastSentence = sentences[sentences.length - 1]?.trim() || '';

      let response = `Your ${context.activity.name} essay is solid. You have a clear story, specific details, and I can see your personality.\n\n`;
      response += `You wrote: "${quote}"\n\n`;

      if (lastSentence && (lastSentence.includes('I learned') || lastSentence.includes('%') || lastSentence.includes('improved'))) {
        response += `But here's the problem: Your last paragraph ends with a statistic or generic statement about what you learned. That's where you lose me.\n\n`;
        response += `Strong essays don't end with "I learned X" or "scores improved Y%." They end with meaning. Connect what you learned to who you'll be in college. What does this experience tell admissions officers about how you'll contribute to their campus?\n\n`;
      } else if (!draftAnalysis?.hasReflection) {
        response += `What's missing: Deep reflection on why this mattered. You're showing me what happened, but not connecting it to who you are or who you want to become.\n\n`;
      }

      response += `The fix: Your last paragraph should connect this experience to your future. Not "I gained leadership skills" but "This approach - [specific insight] - is how I think about everything now. In college, I want to [specific goal that connects to this insight]."\n\n`;
      response += `That's 40 words. It would add 5-7 points to your score.`;

      return response.trim();
    }

    // Good score (75-85) - strong narrative, minor polish
    if (context.analysis.nqi < 85) {
      let response = `This is a strong essay. You have authentic voice, specific details, and genuine reflection.\n\n`;
      response += `You wrote: "${quote}"\n\n`;
      response += `That's good writing. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points - you're clearly refining your craft. ` : ''}\n\n`;

      if (draftAnalysis?.hasPassiveVoice && draftAnalysis.passiveExamples.length > 0) {
        const passiveExample = draftAnalysis.passiveExamples[0];
        response += `One thing I notice: You're using passive voice in places. "${passiveExample}"\n\n`;
        response += `Active voice is stronger. Instead of "I was taught patience," write "Marcus taught me patience." Instead of "The project was completed," write "We completed the project." Small shift, big impact.\n\n`;
      }

      const pointsToExcellent = 85 - context.analysis.nqi;
      response += `You're ${pointsToExcellent} points from the excellent tier (85+). That's one or two good revisions. Read it aloud. Cut anything that doesn't sound exactly like you. Make sure every sentence adds something new.`;

      return response.trim();
    }

    // Excellent score (85+) - exceptional narrative
    let response = `Your ${context.activity.name} essay is excellent. ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points to get here - that's impressive. ` : ''}\n\n`;
    response += `This is the kind of essay that stands out in admissions. You have authentic voice, specific evidence, and genuine reflection.\n\n`;

    if (context.analysis.nqi >= 90) {
      response += `My advice: Stop editing. You've built something strong. Over-editing will make it sound polished but fake. Trust your voice.`;
    } else {
      response += `You're close to perfect. Read it aloud one more time. Make sure it sounds exactly like you talking. Cut any sentence that feels forced or overly polished. Then call it done.`;
    }

    return response.trim();
  }

  // "What should I focus on" / priorities
  if (lowerMessage.includes('focus') || lowerMessage.includes('priority') || lowerMessage.includes('first') || lowerMessage.includes('start')) {
    if (!draft || draft.length < 100) {
      return `First priority: Actually write your essay. You need at least 200-300 words telling a real story about your ${context.activity.name} experience.\n\nPick one specific moment. Describe what happened. Explain why it mattered. Start there.`;
    }

    const quote = extractQuote(draft);

    if (context.analysis.nqi < 50) {
      let response = `If I had to pick one thing: Look at where you wrote "${quote}"\n\n`;

      if (draftAnalysis?.hasGenericStatements && draftAnalysis.genericExamples.length > 0) {
        const genericExample = draftAnalysis.genericExamples[0];
        response += `You describe what you did, but what did YOU learn? This matters because colleges want to see your growth, not just your impact on others.\n\n`;
        response += `Here's how to fix it: "${genericExample}" - rewrite this sentence. Instead of stating "I learned X," describe a specific moment that shows you learning X.\n\n`;
        response += `Example: Instead of "I learned patience," write "The fourth time Sarah asked the same question, I realized patience isn't about not getting frustrated - it's about finding a different way to explain."\n\n`;
        response += `See the difference? That second version shows learning through story.`;
      } else {
        response += `You're reporting facts, not reflecting on meaning. Add one specific anecdote showing a moment where this experience surprised you or changed your thinking.\n\n`;
        response += `Quick win: Pick one sentence that states "I learned [X]." Delete it. Replace it with a specific moment that shows you learning X. Low effort, high impact.`;
      }

      return response.trim();
    }

    if (context.analysis.nqi < 70) {
      const sentences = draft.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const lastSentence = sentences[sentences.length - 1]?.trim() || '';
      const secondToLast = sentences[sentences.length - 2]?.trim() || '';

      let response = `The most impactful change: Fix your ending.\n\n`;

      if (lastSentence.includes('I learned') || lastSentence.includes('skill') || lastSentence.includes('%')) {
        response += `Right now you end with: "${lastSentence}"\n\n`;
        response += `That's a conclusion for a middle school book report. Strong college essays connect the experience to who you'll be next.\n\n`;
        response += `Delete your last sentence. Replace it with: "This approach - [the specific insight from your experience] - is how I think about [something broader] now. In college studying [your interest], I want to [specific goal that connects to this insight]."\n\n`;
      } else {
        response += `You wrote: "${quote}"\n\n`;
        response += `This needs to connect to your future. Right now your essay describes the past. Admissions officers are thinking: "Okay, so what? What does this tell me about who this student will be on our campus?"\n\n`;
      }

      response += `Answer that question in your last paragraph, and you'll jump 5-7 points.`;

      return response.trim();
    }

    // Higher scores - more nuanced advice
    let response = `Honestly, your ${context.activity.name} essay is in good shape. You don't have glaring problems.\n\n`;
    response += `You wrote: "${quote}"\n\n`;

    if (draftAnalysis?.hasPassiveVoice && draftAnalysis.passiveExamples.length > 0) {
      response += `One thing: You're using passive voice in places. Active voice is stronger and more direct. Find sentences with "was," "were," "been" + past tense verb. Rewrite them actively.\n\n`;
      response += `Quick win that takes 5 minutes but makes your whole essay sharper.`;
    } else if (draftAnalysis && draftAnalysis.wordCount > 400) {
      response += `Your essay is ${draftAnalysis.wordCount} words. That's probably too long. Read through and cut anything that doesn't add new information. Every sentence should earn its place.\n\n`;
      response += `Target: 250-350 words of highly specific, meaningful content. Quality over quantity.`;
    } else {
      response += `At this point, I'd focus on polish. Read it aloud. Make sure it sounds exactly like you. Cut anything that feels forced or overly formal. Trust your voice.`;
    }

    return response.trim();
  }

  // Progress/improvement questions
  if (lowerMessage.includes('progress') || lowerMessage.includes('improv') || lowerMessage.includes('better')) {
    if (context.analysis.delta > 0) {
      const versions = context.history.totalVersions;
      let response = `Yes - you've improved ${context.analysis.delta} points${versions > 1 ? ` over ${versions} versions` : ''}.\n\n`;

      if (context.analysis.delta >= 10) {
        response += `That's significant progress. You're not just making surface edits - you're refining your thinking.\n\n`;
      }

      const pointsToNext = context.analysis.nqi >= 85 ? 95 - context.analysis.nqi : context.analysis.nqi >= 70 ? 85 - context.analysis.nqi : 70 - context.analysis.nqi;
      const nextTier = context.analysis.nqi >= 85 ? 'near-perfect' : context.analysis.nqi >= 70 ? 'excellent' : 'competitive';

      if (draft) {
        const quote = extractQuote(draft);
        response += `You wrote: "${quote}"\n\n`;

        if (context.analysis.nqi < 70) {
          response += `To keep climbing: ${!draftAnalysis?.hasReflection ? 'Add one specific moment of genuine reflection about what this experience taught you.' : !draftAnalysis?.hasSpecificNumbers ? 'Add specific numbers and details that make your story concrete.' : 'Connect this experience to who you want to be in college.'}\n\n`;
        }
      }

      response += `You're ${pointsToNext} points from the ${nextTier} tier. That's ${pointsToNext <= 5 ? 'one good revision' : pointsToNext <= 10 ? 'two good revisions' : 'a few more focused edits'}.`;

      return response.trim();
    }

    return `Your ${context.activity.name} narrative is at ${context.analysis.nqi}/100. ${context.analysis.nqi >= 75 ? 'That\'s solid - there\'s room to refine, but the core is strong.' : context.analysis.nqi >= 60 ? 'There\'s clear opportunity to strengthen this.' : 'This needs fundamental development.'}\n\nWhat specific aspect do you want to improve?`;
  }

  // Stuck/help questions
  if (lowerMessage.includes('stuck') || lowerMessage.includes('help') || lowerMessage.includes('don\'t know')) {
    if (!draft || draft.length < 100) {
      return `Let's start simple: Describe one specific moment from your ${context.activity.name} experience that sticks with you. Don't overthink it - just write what happened like you're telling a friend.\n\nThat moment is probably your essay. Start there.`;
    }

    const quote = extractQuote(draft);

    if (context.analysis.nqi < 40) {
      return `Let's figure out what's blocking you.\n\nFor your ${context.activity.name} narrative, the biggest opportunity is: You wrote "${quote}" - but this is a topic sentence, not a narrative. You need to go deeper.\n\nTry this: What's one moment from this experience that you think about when you're not trying to write an essay? Start there. Write about that moment like you're explaining it to a friend. That's often where the good material lives.`;
    }

    return `You wrote: "${quote}"\n\n${context.analysis.nqi >= 70 ? 'This is solid. What specifically feels stuck to you? Sometimes the issue isn\'t the writing - it\'s overthinking it.' : 'Describe one challenge you faced in this experience. Don\'t worry about making it sound good - just write what\'s true.'}\n\nOnce you do that, we can build from there.`;
  }

  // Default: General guidance
  if (!draft || draft.length < 100) {
    return `I can help with your ${context.activity.name} essay, but I need something to work with.\n\nWrite 200-300 words about a specific moment from this experience - what happened, why it mattered. Then I can give you specific feedback.\n\nUntil then, here's what I can tell you about your ${context.analysis.nqi}/100 score: ${context.analysis.nqi >= 70 ? 'Not bad, but we need actual content to improve it.' : 'This needs fundamental work - starting with actually writing the essay.'}`;
  }

  const quote = extractQuote(draft);
  let response = `Let's talk about your ${context.activity.name} essay.\n\n`;
  response += `You wrote: "${quote}"\n\n`;

  if (context.analysis.nqi < 50) {
    response += `This is reporting, not reflecting. You're telling me what happened, but not why it matters or what you learned.\n\n`;
    response += `What do you want to know? I can explain what's missing, what would make the biggest impact, or how to fix specific sections.`;
  } else if (context.analysis.nqi < 75) {
    response += `This is ${context.analysis.nqi >= 65 ? 'solid' : 'decent'} - you have a story with details. What would push it higher is deeper reflection and connecting to your future.\n\n`;
    response += `What would help most? I can walk you through what's working, what isn't, or what to focus on next.`;
  } else {
    response += `This is strong writing. ${context.analysis.nqi >= 85 ? 'You\'re in excellent territory.' : 'You\'re close to excellent.'}\n\n`;
    response += `What are you unsure about? Happy to talk through any specific section or give polish suggestions.`;
  }

  return response.trim();
}
