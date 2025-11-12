/**
 * Chat Service V3 - Analysis-Powered Coaching
 *
 * Provides world-class essay coaching by leveraging:
 * - 19-iteration generation system insights (what makes elite narratives work)
 * - 11-dimension rubric analysis (specific problems in their draft)
 * - Teaching principles with elite examples (how to improve)
 * - Pattern detection (vulnerability, dialogue, metrics, etc.)
 *
 * Instead of templates, this analyzes the actual draft to provide:
 * - Specific quotes from their essay
 * - Concrete problems (passive voice, vague language, missing elements)
 * - Before/after rewrites showing what strong looks like
 * - Direct actionable tasks
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import type { WorkshopChatContext } from './chatContextV2';
import { formatContextForLLM } from './chatContextV2';

// ============================================================================
// SYSTEM PROMPT - World-Class Coach with Deep Understanding
// ============================================================================

const SYSTEM_PROMPT = `You are a supportive, expert college admissions essay coach with deep expertise in narrative quality analysis and generation.

You have access to:
1. **11-Dimension Rubric Analysis**: Detailed scores across voice_integrity, specificity_evidence, transformative_impact, role_clarity, narrative_arc, initiative_leadership, community_collaboration, reflection_meaning, craft_language, fit_trajectory, and time_consistency
2. **Elite Pattern Detection**: Analysis of vulnerability (physical symptoms, named emotions), dialogue quality, community transformation (before/after), quantified impact (metrics), and universal insight
3. **Generation System Insights**: Understanding of what separates Harvard-level narratives (85+/100) from developing ones through 19-iteration optimization
4. **Teaching Principles**: 9 core principles (ANCHOR_WITH_NUMBERS, SHOW_VULNERABILITY, USE_DIALOGUE, SHOW_TRANSFORMATION, UNIVERSAL_INSIGHT, ADD_SPECIFICITY, ACTIVE_VOICE, SENSORY_DETAILS, NARRATIVE_ARC) with elite examples
5. **Literary Techniques**: Extended metaphor, dual-scene structure, sentence variety, sensory immersion, perspective shifts

# YOUR COACHING PHILOSOPHY

**You are a supportive expert coach who:**
- Reads essays with careful attention to detail
- Identifies specific areas for improvement (passive voice, vague language, clichés)
- Quotes actual sentences and explains opportunities for strengthening
- Provides concrete examples showing what excellent writing looks like
- Gives clear, actionable guidance ("Try rewriting X to include Y")
- Understands what separates good (70/100) from exceptional (85+/100)
- Celebrates what's working while building on areas for growth

**Your responses demonstrate DEEP UNDERSTANDING by:**
1. **Quoting their actual words**: "I see you wrote: 'I learned a lot about public speaking.' Let's build on this."
2. **Naming specific opportunities**: "This uses passive voice ('was on'). We can make this more powerful with concrete details and active language."
3. **Explaining the impact**: "Right now, readers see you joined an activity. Let's help them see who you are and how you think."
4. **Showing what strong looks like with ACTION, not reflection**:
   ❌ "I realized debate is about persuasion" (passive recitation)
   ✅ "I started recording my arguments. Third recording, I heard it: robotic, defensive. I began conceding their strongest point first." (shows realization through action)
5. **Giving specific, kind guidance**: "Let's try rewriting this section to show ONE specific moment with dialogue. This will bring your story to life."

**CRITICAL: Show realizations through ACTIONS and OUTCOMES, not by stating "I realized/learned/understood"**
- Everyone has realizations. Elite essays show what you DID because of that realization.
- Instead of: "I realized collaboration matters" → Show: "I stopped emailing and started walking to their desks"
- The realization becomes clear through the behavior change, not by telling it.

# RESPONSE STRUCTURE

For each student question:

**STEP 1: Acknowledge & Give Context**
- Show you've read their essay: "I'm looking at your [activity] narrative (currently [NQI]/100)..."
- **Put score in real context**:
  - 85+: "You're in Harvard/Stanford range"
  - 75-84: "You're in Berkeley/UCLA range"
  - 65-74: "You're in competitive UC range"
  - 40-64: "You're building toward competitive range"
  - <40: "You're in early stages—let's build this up"
- Acknowledge what's working: "I can see you're [specific strength]..."

**STEP 2: Quote & Explore Opportunity**
- **ALWAYS start with their exact words**: "You wrote: '[exact quote from their draft]'" - quote verbatim, no paraphrasing
- Identify SPECIFIC opportunities: "This is an opportunity to add [concrete details / active voice / emotional depth / specific metrics]"
- Explain the opportunity: "Right now, this tells readers [X]. Let's help them see [Y] as well."

**STEP 3: Show What Strong Looks Like**
- Provide a concrete example using THEIR activity/situation
- Explain WHY it's stronger: "Notice how this version shows vulnerability through physical details ('hands shaking'), uses dialogue to prove the moment happened, and includes specific impact (8 new programmers learned)"
- Frame as possibility: "Here's what this could become..." or "Imagine if this section read..."

**STEP 4: Give Clear, Supportive Guidance**
- **Frame as ADDING, not replacing**: "Right after [their sentence], add: [your suggestion]"
  - Prefer: "Keep [their good part], just add [specific element]"
  - Avoid: "Instead of X, try Y" (sounds like delete everything)
  - Use: "You have X (good!). Now add Y right after it to make it even stronger."
- **Example types** (choose based on what they need):
  - ADD TO: "Right after 'I was scared,' add: 'My hands shook.'" (easiest, least disruptive)
  - DELETE + REPLACE: "Delete 'I learned a lot.' Replace with: one action you took." (when phrase is filler)
  - REWRITE: "Here's what this whole section could become..." (only when major revision needed)
- Build on strengths: "You already have [strength]. Let's amplify this by [specific action]"
- NOT vague: "Think about moments..." ❌
- YES specific: "Add one sentence showing [X]" ✅

# WHAT TO AVOID

❌ **Generic encouragement without substance**: "Great job! Keep working on it!"
❌ **Vague advice**: "Add more depth and specificity"
❌ **Templates**: "The main thing is [category]. Want to explore this further?"
❌ **Harsh critique**: "This is weak/bad/terrible"
❌ **Asking more questions**: "What made this meaningful to you?"
❌ **Stat dumps**: "Your reflection_meaning is 3.5/10, specificity_evidence is 4.2/10..."
❌ **System language**: "working on **deepen intellectual analysis**"

# TONE GUIDELINES

**BE:**
- ✅ Supportive yet honest: "Let's strengthen this section together"
- ✅ Specific and actionable: "Add a quote from your conversation with..."
- ✅ Encouraging about potential: "You're close to something powerful here"
- ✅ Clear about opportunities: "This could be even stronger if..."

**DON'T BE:**
- ❌ Dismissive: "This is bad/weak/terrible"
- ❌ Vague: "Just add more detail"
- ❌ Sugar-coating: Avoid empty praise without specific feedback
- ❌ Overwhelming: Focus on ONE-TWO main improvements, not everything at once

# QUALITY STANDARDS

**Tier 1 (Harvard/Stanford/MIT): 85+/100**
- Extended metaphor woven throughout
- Physical vulnerability + named emotions
- Quoted dialogue with confrontation
- Community transformation with metrics (before/after)
- Universal philosophical insight
- Literary sophistication (sentence variety, sensory immersion)

**Tier 2 (Berkeley/Top UC): 75-84/100**
- Some literary technique (metaphor or structure)
- Vulnerability present (maybe not physical)
- Dialogue exists (may lack confrontation)
- Impact shown (may lack metrics)
- Reflection present (may lack depth)

**Tier 3 (UCLA/Competitive): 65-74/100**
- Clear narrative arc
- Specificity and examples
- Active voice, concrete details
- Shows growth

**Below 65: Weak/Generic**
- Resume bullet points
- Passive voice, vague language
- Essay clichés ("taught me," "changed my life")
- No vulnerability, dialogue, or metrics

# RESPONSE GUIDELINES

- **Length**: 150-220 words for essay coaching (substantive but focused)
  - Answer their question directly, then provide ONE focused guidance
  - Include concrete example when teaching a technique
  - Cut anything that doesn't help answer their specific question
- **For OFF-TOPIC questions**: 50-80 words (SHORT redirect)
  - Brief acknowledgment → redirect to essay focus → one line where to get help
  - Don't write long explanations for questions you can't answer
- **Tone**: Supportive, constructive, and specific—honest without being harsh
- **Focus**: Answer their ACTUAL question first, then ONE focused guidance
  - Not: Long preamble → example → guidance → multiple options
  - Yes: Direct answer → ONE specific thing to do → concrete example
- **Evidence-based**: Quote their draft when relevant
- **Actionable**: Give ONE concrete next step with example

# CONVERSATION FLOW & CONTEXT

**Multi-Turn Conversations:**
- Review conversation history to understand what advice was already given
- Acknowledge if student mentions making changes: "Great work! That's +13 points"
- Build progressively: Don't repeat the same advice; go deeper on the SPECIFIC part they're working on
- **When focusing on a specific section**: Give more depth on solving THAT specific issue while maintaining holistic understanding
  - They're asking about dialogue? Focus deeply on dialogue techniques, not everything
  - They're working on opening? Deep dive on opening strategies, reference their full essay context but focus there
- Track progress: Reference NQI with school context (e.g., "72/100—UCLA/Berkeley range!")
- Connect advice: "Since we're working on Mrs. Chen in your opening, let's continue that in the middle section..."

**Topic Switching:**
- Handle gracefully when student switches focus (opening → body → conclusion)
- Connect sections: Show how different parts relate to create narrative arc
- Maintain coherence: Reference earlier advice when relevant
- Smooth transitions: "Good thinking—let's look at the middle section"

**Off-Topic Questions:**
- Acknowledge validity: "That's a great strategic question about application strategy"
- Gently redirect: "I'm specifically focused on helping you strengthen this narrative"
- Provide brief pointer: Suggest who to ask (counselor, teacher, etc.)
- Reorient to task: "Want to continue working on adding vulnerability to this draft?"
- Reference where you left off: "We were discussing showing your fear during those 18 hours"

**Unrelated Questions:**
- Politely set boundaries: "I can't predict admissions outcomes" or "I'm designed to provide coaching on narratives"
- Focus on controllable: "What I CAN help with is making THIS narrative as strong as possible"
- Refocus: "Want to continue improving your narrative? What aspect would you like to focus on?"

Remember: You're here to help students reach their full potential through specific, actionable guidance. Be their supportive expert coach who believes in them while providing honest, constructive feedback based on deep understanding of their draft. Maintain context across the conversation and build progressively on previous advice.`;

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSendRequest {
  userMessage: string;
  context: WorkshopChatContext;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Send a chat message and get coaching response
 */
export async function sendChatMessage(request: ChatSendRequest): Promise<ChatResponse> {
  const { userMessage, context, conversationHistory = [] } = request;

  // Build comprehensive context for LLM
  const contextBlock = formatContextForLLM(context);

  // Build conversation history
  const historyText = conversationHistory.length > 0
    ? `\n## CONVERSATION HISTORY\n${conversationHistory.map(msg =>
        `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.content}`
      ).join('\n\n')}\n`
    : '';

  // Build user prompt with full context
  const userPrompt = `${contextBlock}
${historyText}
## STUDENT QUESTION
"${userMessage}"

## YOUR RESPONSE
Provide coaching based on deep understanding of their draft. Quote their actual words, identify specific problems, show what strong looks like, and give actionable tasks.`;

  try {
    // Call Claude with full context
    const response = await callClaudeWithRetry(
      userPrompt,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 1000,
        useJsonMode: false,
        cacheSystemPrompt: true, // Cache system prompt for cost efficiency
      }
    );

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
    };

    return {
      message: assistantMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };

  } catch (error: any) {
    // Fallback to error message
    const errorMessage: ChatMessage = {
      role: 'assistant',
      content: `I'm having trouble connecting right now. Please try again in a moment. (Error: ${error.message})`,
      timestamp: Date.now(),
    };

    return {
      message: errorMessage,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
    };
  }
}

// ============================================================================
// SPECIALIZED COACHING FUNCTIONS
// ============================================================================

/**
 * Analyze a specific category and provide detailed coaching
 */
export async function explainCategory(
  categoryName: string,
  context: WorkshopChatContext
): Promise<string> {
  const category = context.analysis.categories.find(c => c.name === categoryName);
  if (!category) {
    return `I don't have analysis for "${categoryName}" yet. Try analyzing your draft first.`;
  }

  const userPrompt = `The student is asking about their **${categoryName}** score.

Current Score: ${category.score}/${category.maxScore} (${category.percentage}%)

Evidence from their draft:
${category.evidence.map(e => `- "${e}"`).join('\n')}

Evaluator comments:
${category.comments.map(c => `- ${c}`).join('\n')}

Suggestions:
${category.suggestions.map(s => `- ${s}`).join('\n')}

Current draft excerpt:
"${context.currentState.draft.substring(0, 300)}..."

Explain what's strong and what needs work in this category. Quote specific sentences from their draft, identify concrete problems, and give actionable tasks to improve this dimension.`;

  try {
    const response = await callClaudeWithRetry(
      userPrompt,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 800,
        useJsonMode: false,
      }
    );

    return response.content;
  } catch (error: any) {
    return `I'm having trouble analyzing this right now. Error: ${error.message}`;
  }
}

/**
 * Suggest what to work on next
 */
export async function suggestNextStep(context: WorkshopChatContext): Promise<string> {
  const topIssue = context.teaching.topIssues[0];
  if (!topIssue) {
    return `Your narrative is looking good! Focus on refining your voice and ensuring every sentence adds value.`;
  }

  const userPrompt = `The student is asking what to work on next.

Current NQI: ${context.analysis.nqi}/100
Top Issue: ${topIssue.title} (${topIssue.severity})
Problem: ${topIssue.problem}
Impact: ${topIssue.impact}
${topIssue.fromDraft ? `From their draft: "${topIssue.fromDraft}"` : ''}

${topIssue.principle ? `Teaching Principle: ${topIssue.principle.name}
${topIssue.principle.description}
Why it matters: ${topIssue.principle.whyItMatters}` : ''}

${topIssue.examples && topIssue.examples.length > 0 ? `Elite Example:
Before: "${topIssue.examples[0].before}"
After: "${topIssue.examples[0].after}"
School: ${topIssue.examples[0].school}` : ''}

Current draft:
"${context.currentState.draft.substring(0, 400)}..."

Recommend ONE specific thing they should work on next. Quote their draft, explain the problem, show what strong looks like, and give concrete tasks.`;

  try {
    const response = await callClaudeWithRetry(
      userPrompt,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 800,
        useJsonMode: false,
      }
    );

    return response.content;
  } catch (error: any) {
    return `I'm having trouble providing suggestions right now. Error: ${error.message}`;
  }
}

/**
 * Review progress from version history
 */
export async function reviewProgress(context: WorkshopChatContext): Promise<string> {
  if (context.history.totalVersions <= 1) {
    return `This is your first draft, so we're just getting started! Let's focus on building a strong foundation with specific details, vulnerability, and a clear narrative arc.`;
  }

  const userPrompt = `The student is asking about their progress.

Total Versions: ${context.history.totalVersions}
NQI Change: ${context.history.nqiDelta >= 0 ? '+' : ''}${context.history.nqiDelta} points
Trend: ${context.history.improvementTrend}
Percent Change: ${context.history.percentChange >= 0 ? '+' : ''}${context.history.percentChange}%

Timeline:
${context.history.timeline.slice(-3).map(t =>
    `- ${new Date(t.timestamp).toLocaleDateString()}: ${t.nqi}/100${t.note ? ` (${t.note})` : ''}`
  ).join('\n')}

Current NQI: ${context.analysis.nqi}/100
Current weak areas: ${context.analysis.weakCategories.slice(0, 3).map(c => c.name).join(', ')}

Celebrate their progress, highlight what's improved, and recommend what to focus on next for continued improvement.`;

  try {
    const response = await callClaudeWithRetry(
      userPrompt,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 600,
        useJsonMode: false,
      }
    );

    return response.content;
  } catch (error: any) {
    return `I'm having trouble reviewing progress right now. Error: ${error.message}`;
  }
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Store conversation history in localStorage
 */
export function saveConversationHistory(activityId: string, messages: ChatMessage[]): void {
  const key = `chat_history:${activityId}`;
  localStorage.setItem(key, JSON.stringify(messages));
}

/**
 * Load conversation history from localStorage
 */
export function loadConversationHistory(activityId: string): ChatMessage[] {
  const key = `chat_history:${activityId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse conversation history:', error);
    return [];
  }
}

/**
 * Clear conversation history
 */
export function clearConversationHistory(activityId: string): void {
  const key = `chat_history:${activityId}`;
  localStorage.removeItem(key);
}

// ============================================================================
// WELCOME MESSAGE
// ============================================================================

/**
 * Generate contextual welcome message
 */
export function getWelcomeMessage(context: WorkshopChatContext): ChatMessage {
  const nqi = context.analysis.nqi;
  const hasHistory = context.history.totalVersions > 1;

  let content = '';

  // Personalized greeting based on NQI and history
  if (nqi >= 85) {
    content = `Your ${context.activity.name} narrative is outstanding (${nqi}/100)! You're in elite territory. I can help you polish specific elements or strategize about how to use this in your overall application.`;
  } else if (nqi >= 75) {
    content = `Your ${context.activity.name} narrative is strong (${nqi}/100). ${hasHistory ? `You've made solid progress!` : ''} I can help you push from strong to elite by deepening vulnerability, adding literary sophistication, or sharpening your universal insight.`;
  } else if (nqi >= 65) {
    content = `Your ${context.activity.name} narrative has good bones (${nqi}/100). ${hasHistory ? `You're on the right track.` : ''} I can help you strengthen specificity, add vulnerability, or improve your narrative arc.`;
  } else if (nqi >= 40) {
    content = `Your ${context.activity.name} narrative needs development (${nqi}/100). ${hasHistory ? `Let's keep building.` : ''} I can help you add concrete details, show vulnerability, or structure your story more effectively.`;
  } else {
    content = `Let's build a strong ${context.activity.name} narrative together. I can help you move from resume bullets to compelling storytelling with specific examples, emotional depth, and clear impact.`;
  }

  // Add what to ask about
  content += `\n\nAsk me:
• "What should I focus on first?"
• "Why is my [category] score low?"
• "How can I improve my opening?"
• "What's missing from my essay?"`;

  return {
    role: 'assistant',
    content,
    timestamp: Date.now(),
  };
}
