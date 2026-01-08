/**
 * Workshop Chat Mode - Specialized Technique & Suggestion Implementation Chat
 *
 * **ADDITIVE LAYER**: This service does NOT replace the existing feedback system.
 * It EXTENDS it by providing specialized chat modes for implementing improvements.
 *
 * **Two Workshop Modes**:
 *
 * 1. **TECHNIQUE MODE** (Universal Learning)
 *    - Teaches universal writing techniques (not essay-specific)
 *    - Research-backed WHY/HOW/EXAMPLES
 *    - Student learns the skill, then applies to their text
 *
 * 2. **SUGGESTION MODE** (Essay-Specific Implementation) ← NEW
 *    - Helps implement Stage 2 suggestions (polished_original, voice_amplifier)
 *    - These are ALREADY tailored to the student's essay
 *    - Chat helps them understand, adapt, and integrate the suggestion
 *    - More focused: "Here's a suggestion, let's work through it"
 *
 * **Architecture**:
 * - Existing: Stage 1B → CriticalIssue → Stage 2 → Suggestions
 * - Technique Mode: Universal technique → Apply to their text
 * - Suggestion Mode: Specific suggestion → Understand & integrate
 *
 * **Difference from Universal Chat**:
 * - Universal Chat: Open-ended coaching, any question, flexible responses
 * - Workshop Technique Mode: Focused technique implementation, guided steps
 * - Workshop Suggestion Mode: Focused suggestion implementation, specific text
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { researchBackedTeachingService } from './researchBackedTeachingService';
import type { IssueType, ResearchBackedTeaching, Transformation } from './researchBackedTeachingService';
import type { CriticalIssue } from './stage1BDiagnosisService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Chat modes available in the system
 *
 * IMPORTANT: This enum allows for future expansion of specialized modes
 */
export type ChatMode =
  | 'universal'           // Default open-ended coaching
  | 'workshop'            // Technique implementation (universal learning)
  | 'workshop_suggestion' // Suggestion implementation (essay-specific) ← NEW
  | 'review'              // Quick review/polish
  | 'brainstorm';         // Ideation and exploration

/**
 * Workshop sub-mode for more specific context
 */
export type WorkshopSubMode =
  | 'technique'    // Learning universal technique
  | 'suggestion';  // Implementing specific suggestion

/**
 * Workshop Mode context - what the chat needs to know
 *
 * This is ADDITIVE to existing issue data, not replacing it
 */
export interface WorkshopModeContext {
  // Mode identification
  mode: 'workshop';
  mode_version: string;

  // The technique being implemented
  technique: {
    issue_type: IssueType;
    technique_name: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_time: string;
  };

  // Universal teaching (not essay-specific)
  universal_teaching: {
    // WHY this matters (research-backed)
    why_headline: string;
    why_explanation: string;
    admissions_insight?: string;
    admissions_source?: string;

    // HOW to do it (step-by-step)
    steps: Array<{
      step_number: number;
      name: string;
      instruction: string;
      tip?: string;
      common_mistake?: string;
    }>;

    // EXAMPLES (before/after)
    examples: Array<{
      before: string;
      after: string;
      principle: string;
      why_it_works: string;
    }>;

    // Research sources (for credibility)
    sources: string[];
  };

  // Student's specific context (from existing issue)
  student_context: {
    quote: string;           // The specific text with this issue
    location: string;        // Where in the essay
    problem: string;         // What's wrong (brief)
    college?: string;        // Target college if known
  };

  // Quality guardrails
  guardrails: {
    max_response_length: number;
    require_concrete_suggestion: boolean;
    require_reference_to_student_text: boolean;
    require_technique_alignment: boolean;
  };
}

/**
 * Suggestion Mode Context - for implementing specific Stage 2 suggestions
 *
 * Unlike WorkshopModeContext (which teaches universal techniques),
 * this mode helps students understand and implement SPECIFIC suggestions
 * that have already been tailored to their essay.
 */
export interface SuggestionModeContext {
  // Mode identification
  mode: 'workshop_suggestion';
  mode_version: string;
  sub_mode: 'suggestion';

  // The issue being addressed
  issue: {
    issue_number: number;
    original_quote: string;       // Student's original text
    location: string;             // Where in the essay
    problem_summary: string;      // Brief description of what's wrong
    diagnosis: string;            // Full diagnosis from Stage 1B
  };

  // The suggestions to implement (from Stage 2)
  suggestions: {
    // Polished Original: Safe, incremental improvement
    polished_original?: {
      text: string;               // The suggested revised text
      rationale: string;          // Why this works
      what_changed: string[];     // List of changes made
      safety_level: string;       // How safe/conservative this is
      when_to_use: string;        // When student should choose this
    };

    // Voice Amplifier: Creative, authentic alternative
    voice_amplifier?: {
      text: string;               // The suggested revised text
      rationale: string;          // Why this works
      what_changed: string[];     // List of changes made
      why_authentic: string;      // Why this sounds like the student
      risk_level: string;         // Creative risk involved
      when_to_use: string;        // When student should choose this
    };

    // Teaching about choosing between them
    how_to_choose?: {
      polished_when: string;      // When to use polished original
      voice_when: string;         // When to use voice amplifier
      can_combine: string;        // How to blend elements of both
    };
  };

  // Student's full context (for adaptation)
  student_context: {
    essay_excerpt: string;        // Surrounding context
    college?: string;             // Target college
    voice_markers?: string[];     // Authentic phrases from their essay
  };

  // Quality guardrails (stricter than technique mode)
  guardrails: {
    max_response_length: number;
    must_reference_suggestion: boolean;
    must_explain_changes: boolean;
    encourage_adaptation: boolean;  // Help them modify, not just copy
  };
}

/**
 * Workshop chat message (extends base with mode awareness)
 */
export interface WorkshopChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: ChatMode;
  technique_step?: number;  // Track which step they're on
}

/**
 * Workshop chat request
 */
export interface WorkshopChatRequest {
  userMessage: string;
  context: WorkshopModeContext;
  conversationHistory?: WorkshopChatMessage[];
}

/**
 * Workshop chat response
 */
export interface WorkshopChatResponse {
  message: WorkshopChatMessage;
  suggested_next_step?: string;
  progress: {
    current_step: number;
    total_steps: number;
    technique_complete: boolean;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

// ============================================================================
// SYSTEM PROMPT TEMPLATES
// ============================================================================

/**
 * Build technique-specific system prompt
 *
 * PHILOSOPHY: True Writing Workshop - Teach, Practice, Feedback
 *
 * This is NOT a plug-and-paste system. We:
 * 1. TEACH the principle/technique (WHY it works)
 * 2. ASK the student to WRITE their own version
 * 3. ANALYZE their attempt and provide targeted feedback
 * 4. ITERATE until they've mastered it in their own voice
 *
 * This ensures:
 * - Authentic, original writing (not AI-generated copy-paste)
 * - Real learning (not just following a template)
 * - Unique essays (not cookie-cutter with swapped details)
 * - AI detection safety (student writes, we coach)
 */
function buildWorkshopSystemPrompt(context: WorkshopModeContext): string {
  const { technique, universal_teaching, student_context, guardrails } = context;

  return `You are a supportive, expert college admissions essay coach running a TRUE WRITING WORKSHOP.

You are currently teaching: **${technique.technique_name}**

# CRITICAL WORKSHOP PHILOSOPHY

**YOU DO NOT WRITE FOR THE STUDENT. EVER.**

Your role is to:
1. TEACH the technique (explain the principle, show WHY it works)
2. PROMPT them to WRITE their own version
3. ANALYZE what they write and provide specific feedback
4. GUIDE them to improve through iteration

**Why This Matters:**
- If you write suggestions for them to copy, all essays will sound the same
- If they just swap in their details to our templates, it's not authentic
- Admissions officers (and AI detectors) can spot templated writing
- Real learning happens when THEY write and WE coach

# THE TECHNIQUE: ${technique.technique_name}

**Why This Technique Matters:**
${universal_teaching.why_headline}

${universal_teaching.why_explanation}
${universal_teaching.admissions_insight ? `\n**Admissions Insight**: "${universal_teaching.admissions_insight}"${universal_teaching.admissions_source ? ` - ${universal_teaching.admissions_source}` : ''}` : ''}

**The Principle (teach this, don't write it for them):**
${universal_teaching.steps.map(step => `
**Step ${step.step_number}: ${step.name}**
${step.instruction}
${step.tip ? `Tip: ${step.tip}` : ''}
${step.common_mistake ? `Common Mistake to Avoid: ${step.common_mistake}` : ''}`).join('\n')}

**Examples to ILLUSTRATE the principle (not for copying):**
${universal_teaching.examples.slice(0, 2).map(ex => `
Weaker version: "${ex.before}"
Stronger version: "${ex.after}"
WHY it's stronger: ${ex.why_it_works}
`).join('\n---\n')}

These examples are from OTHER essays. Use them to explain the PRINCIPLE, not as templates.

# STUDENT'S CURRENT TEXT

**What they wrote:**
"${student_context.quote}"

**Location:** ${student_context.location}
${student_context.college ? `**Target College:** ${student_context.college}` : ''}

# YOUR COACHING APPROACH

## Phase 1: TEACH (First interaction)
- Explain the PRINCIPLE behind ${technique.technique_name}
- Show WHY their current text isn't working (specifically)
- Use the examples to ILLUSTRATE the principle (not as templates)
- Ask them guiding questions to surface THEIR specific memories/details
- **End by asking them to WRITE a new version themselves**

## Phase 2: ANALYZE (After they write)
When they share their attempt:
- Quote exactly what they wrote
- Identify what's WORKING (be specific)
- Identify what still needs work (be specific)
- Explain WHY certain parts work/don't work using the technique principles
- Give ONE targeted suggestion for their next revision
- **Ask them to revise based on your feedback**

## Phase 3: ITERATE (Until strong)
Keep coaching through revisions until:
- Their writing demonstrates the technique authentically
- It sounds like THEM (not like a template)
- The specific details are genuinely theirs

# GUIDED DISCOVERY FRAMEWORK

Your questions should guide their thinking progressively, not ask them to generate ideas from nothing.

## LAYER 1: Anchoring Questions (Find the moment)
Purpose: Help them identify a SPECIFIC moment, not an abstract concept.

**Explain why you're asking:**
"Generic claims like 'I'm passionate about learning' don't stick with readers. What DOES stick is a specific scene where we can SEE that passion in action. Let me help you find that moment."

**Anchoring questions:**
- "Think back to a time when you chose [topic] over something easier or more fun. Where were you physically? What time of day was it?"
- "When did someone first notice this quality in you? What were you actually doing when they noticed?"
- "What's a moment when you surprised yourself with how much you cared about this?"

## LAYER 2: Sensory Excavation (Deepen the moment)
Purpose: Once they have a moment, help them access the DETAILS that make it vivid.

**Explain why details matter:**
"Right now I know WHAT happened, but I can't SEE it yet. The details are what make readers feel like they're there with you. Let's excavate those details."

**Sensory questions (pick 2-3 relevant ones):**
- "Close your eyes and picture yourself there. What's the first thing you see? Not the big picture—the small detail."
- "What sounds were in the background? Silence counts too."
- "What were your hands doing? Were you holding something, fidgeting, still?"
- "What were you wearing? Sometimes clothes anchor a memory."
- "Was anyone else there? What were THEY doing while you were doing this?"
- "What time of day was it? What was the light like?"

## LAYER 3: Emotional Truth (Find the stakes)
Purpose: Surface WHY this moment mattered—the internal experience.

**Explain why emotions matter:**
"Details make us SEE the moment. But what makes us CARE is understanding what it meant to you. Not by naming the emotion, but by showing what it made you do."

**Emotional excavation:**
- "What would have been the 'normal' thing to do in that moment? Why didn't you do that?"
- "If someone had interrupted you, how would you have felt? What would you have done?"
- "What were you afraid might happen? Or hoping would happen?"
- "What did you give up or sacrifice to be doing this instead of something else?"

## LAYER 4: Writing Prompt (Now they're ready)
Only AFTER they've surfaced rich details, prompt them to write.

**The transition:**
"You've given me gold here. You have [specific detail they mentioned], [another detail], and [the contrast/choice they made]. Now put yourself back in that moment and write 1-2 sentences describing the scene. Don't try to make it perfect—just capture what you saw and did. We'll polish it together."

## WHAT NOT TO DO

- DON'T jump straight to "write a sentence" without discovery
- DON'T ask vague questions like "tell me about a time when..."
- DON'T accept thin answers—dig deeper with follow-up questions
- DON'T write examples using their specific details (that's ghostwriting)

## HANDLING THIN RESPONSES

If they give a vague answer like "I just really liked it":
- "I believe you—but 'really liked it' is invisible to readers. Help me SEE it. What did 'really liking it' look like in action? What did you DO because you liked it so much?"

If they give a generic moment:
- "That's a start, but it could be anyone's story. What's the detail that makes this YOUR version? What would you remember that no one else would?"

If they seem stuck:
- "Let's try a different angle. Instead of the big moment, what's a tiny moment? A single afternoon, a specific conversation, even a single sentence someone said to you about this?"

# WHAT YOU MUST NOT DO

- DO NOT write full sentences for them to copy
- DO NOT give them "templates" with blanks to fill in
- DO NOT say "try something like: [full sentence example using their topic]"
- DO NOT provide alternative phrasings they can just use
- DO NOT do the creative work for them

**Instead of:** "Try writing: 'Third grade recess, I sprinted to the library while everyone else played kickball'"
**Say:** "Think about a specific moment that shows your passion. What were you actually doing? Where were you? Write that scene."

# TONE GUIDELINES

BE:
- A coach, not a ghostwriter
- Encouraging but honest
- Specific in feedback
- Patient through iterations

DON'T BE:
- Writing their essay for them
- Giving them copy-paste solutions
- Vague ("make it more specific")
- Harsh or discouraging

# RESPONSE STRUCTURE

**First response (Teaching):**
1. Explain the technique principle clearly
2. Show why their current text needs work
3. Ask 2-3 discovery questions about THEIR experience
4. Prompt them to write their own version

**After they write:**
1. Quote what they wrote
2. Specific feedback (what works, what doesn't, WHY)
3. ONE targeted improvement suggestion
4. Ask for their revision

**Response Length:** ${guardrails.max_response_length} words maximum

Remember: Your job is to make them a BETTER WRITER, not to write for them. Every essay should be authentically theirs.`;
}

// ============================================================================
// WORKSHOP CHAT MODE SERVICE
// ============================================================================

export class WorkshopChatModeService {
  static readonly MODE_VERSION = '1.0.0';

  /**
   * Build workshop mode context from existing issue and teaching
   *
   * This is the BRIDGE between existing feedback system and workshop mode.
   * It takes existing CriticalIssue data and enriches it with universal teaching.
   */
  buildWorkshopContext(
    issue: CriticalIssue,
    collegeName?: string
  ): WorkshopModeContext | null {
    // Map symptom type to issue type
    const issueType = this.mapSymptomToIssueType(issue.symptom_type);
    if (!issueType) {
      console.warn(`[WorkshopChatMode] No mapping for symptom type: ${issue.symptom_type}`);
      return null;
    }

    // Get research-backed teaching
    const teaching = researchBackedTeachingService.getTeachingForIssue(issueType);
    if (!teaching) {
      console.warn(`[WorkshopChatMode] No teaching bundle for issue type: ${issueType}`);
      return null;
    }

    // Get college-specific guidance if available
    const collegeGuidance = collegeName
      ? researchBackedTeachingService.getCollegeSpecificGuidance(issueType, collegeName)
      : null;

    // Build the workshop context
    return {
      mode: 'workshop',
      mode_version: WorkshopChatModeService.MODE_VERSION,

      technique: {
        issue_type: issueType,
        technique_name: teaching.techniques[0]?.name || 'Writing Improvement',
        difficulty: teaching.techniques[0]?.difficulty || 'intermediate',
        estimated_time: this.estimateTime(teaching.techniques[0]?.difficulty || 'intermediate'),
      },

      universal_teaching: {
        why_headline: teaching.why_section.summary,
        why_explanation: teaching.why_section.research_insight,
        admissions_insight: teaching.evidence.supporting_quotes[0]?.quote,
        admissions_source: teaching.evidence.supporting_quotes[0]?.source,

        steps: teaching.techniques[0]?.steps.map((step, idx) => ({
          step_number: idx + 1,
          name: step.title,
          instruction: step.description,
          tip: step.pro_tip,
          common_mistake: step.common_mistake,
        })) || [],

        examples: teaching.transformations.map(t => ({
          before: t.before,
          after: t.after,
          principle: t.technique_used,
          why_it_works: t.lesson,
        })),

        sources: teaching.why_section.sources,
      },

      student_context: {
        quote: issue.quote,
        location: issue.location,
        problem: issue.problem,
        college: collegeName,
      },

      guardrails: {
        max_response_length: 250,
        require_concrete_suggestion: true,
        require_reference_to_student_text: true,
        require_technique_alignment: true,
      },
    };
  }

  /**
   * Send message in workshop mode
   *
   * This uses a MORE FOCUSED system prompt than universal chat,
   * with quality guardrails to ensure reliable responses.
   */
  async sendWorkshopMessage(request: WorkshopChatRequest): Promise<WorkshopChatResponse> {
    const { userMessage, context, conversationHistory = [] } = request;

    // Build technique-specific system prompt
    const systemPrompt = buildWorkshopSystemPrompt(context);

    // Format conversation history
    const historyText = conversationHistory.length > 0
      ? conversationHistory.map(msg =>
          `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.content}`
        ).join('\n\n')
      : '';

    // Build user prompt
    const userPrompt = `${historyText ? `## Previous Conversation\n${historyText}\n\n` : ''}## Student's Current Question
"${userMessage}"

## Your Response
Guide them through applying the ${context.technique.technique_name} technique to their specific text. Stay focused, reference their words, and provide concrete next steps.`;

    try {
      const response = await callClaudeWithRetry(
        userPrompt,
        {
          systemPrompt,
          temperature: 0.6, // Lower than universal chat for more consistency
          maxTokens: 600,
          useJsonMode: false,
          cacheSystemPrompt: true,
        }
      );

      // Calculate progress based on conversation length
      const currentStep = Math.min(
        Math.floor((conversationHistory.length + 1) / 2) + 1,
        context.universal_teaching.steps.length
      );

      const assistantMessage: WorkshopChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        mode: 'workshop',
        technique_step: currentStep,
      };

      // Estimate cost (Sonnet pricing)
      const inputCost = response.usage.input_tokens * 0.003 / 1000;
      const outputCost = response.usage.output_tokens * 0.015 / 1000;

      return {
        message: assistantMessage,
        suggested_next_step: this.getSuggestedNextStep(currentStep, context),
        progress: {
          current_step: currentStep,
          total_steps: context.universal_teaching.steps.length,
          technique_complete: currentStep >= context.universal_teaching.steps.length,
        },
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost: inputCost + outputCost,
        },
      };

    } catch (error: any) {
      console.error('[WorkshopChatMode] Error:', error);

      return {
        message: {
          role: 'assistant',
          content: `I'm having trouble connecting right now. Let's try again in a moment. In the meantime, review Step ${Math.min(conversationHistory.length / 2 + 1, context.universal_teaching.steps.length)} of the technique above.`,
          timestamp: Date.now(),
          mode: 'workshop',
        },
        progress: {
          current_step: 1,
          total_steps: context.universal_teaching.steps.length,
          technique_complete: false,
        },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        },
      };
    }
  }

  /**
   * Get welcome message for workshop mode
   *
   * Strong hook → compelling insight → draw them into the process
   */
  getWelcomeMessage(context: WorkshopModeContext): WorkshopChatMessage {
    const { technique, universal_teaching, student_context } = context;

    // Create a dynamic hook based on the issue type
    const hook = this.generateDynamicHook(student_context.problem, student_context.quote);

    const content = `${hook}

"${student_context.quote.substring(0, 150)}${student_context.quote.length > 150 ? '...' : ''}"

Here's what's actually happening: This sentence is doing the opposite of what you need. Instead of making an admissions officer *feel* something about you, it's asking them to take your word for it. And after reading their 500th essay that day, they're not in a trusting mood.

The interesting part? You almost certainly have a moment that proves this claim—a scene where someone could actually *see* this quality in you. That's the gold we need to find.

**What makes this tricky:** Your brain wants to summarize ("I'm passionate about learning"). But summaries are forgettable. What sticks is the weird specific moment—the time you chose to do something that revealed who you are without you having to explain it.

Think about it: Which is more memorable?
- "I love astronomy"
- "I spent every lunch period in 8th grade reading the same Hawking book while my friends ate without me"

The second one makes you *see* the person. That's what we're going for.

**So here's my question:** Think back to a real moment when this quality was visible—not because you said it, but because of what you were *doing*. Don't worry about making it sound good yet. Just tell me: where were you, and what was happening?`;

    return {
      role: 'assistant',
      content,
      timestamp: Date.now(),
      mode: 'workshop',
      technique_step: 0,
    };
  }

  /**
   * Generate a dynamic, attention-grabbing hook based on the issue
   */
  private generateDynamicHook(problem: string, quote: string): string {
    // Different hooks based on common issue patterns
    if (problem.toLowerCase().includes('generic') || problem.toLowerCase().includes('claim')) {
      return `**Here's the thing nobody tells you:** The sentence you're most proud of might be the one hurting your essay.`;
    }
    if (problem.toLowerCase().includes('telling') || problem.toLowerCase().includes('showing')) {
      return `**Real talk:** Admissions officers can smell this type of sentence from a mile away—and not in a good way.`;
    }
    if (problem.toLowerCase().includes('cliché') || problem.toLowerCase().includes('cliche')) {
      return `**I'm going to be honest with you:** This reads like something an AI would write. And that's a problem.`;
    }
    if (problem.toLowerCase().includes('passive') || problem.toLowerCase().includes('victim')) {
      return `**Something's missing here:** Your sentence has things happening TO you, but I can't see YOU in it.`;
    }
    // Default hook
    return `**Let's talk about what's really going on here.** This sentence is working against you, and I want to show you why.`;
  }

  // ==========================================================================
  // SUGGESTION MODE (Essay-Specific Implementation)
  // ==========================================================================

  /**
   * Build suggestion mode context from Stage 2 output
   *
   * This mode helps students implement SPECIFIC suggestions that have
   * already been tailored to their essay (polished_original, voice_amplifier).
   */
  buildSuggestionContext(
    issue: CriticalIssue,
    stage2Suggestions: {
      polished_original?: {
        text: string;
        rationale: string;
        what_changed: string[];
        safety_level?: string;
        when_to_use?: string;
      };
      voice_amplifier?: {
        text: string;
        rationale: string;
        what_changed: string[];
        why_authentic?: string;
        risk_level?: string;
        when_to_use?: string;
      };
      how_to_choose?: {
        polished_when: string;
        voice_when: string;
        can_combine: string;
      };
    },
    options?: {
      essayExcerpt?: string;
      collegeName?: string;
      voiceMarkers?: string[];
    }
  ): SuggestionModeContext {
    return {
      mode: 'workshop_suggestion',
      mode_version: WorkshopChatModeService.MODE_VERSION,
      sub_mode: 'suggestion',

      issue: {
        issue_number: issue.issue_number,
        original_quote: issue.quote,
        location: issue.location,
        problem_summary: issue.problem,
        diagnosis: issue.diagnosis,
      },

      suggestions: {
        polished_original: stage2Suggestions.polished_original ? {
          text: stage2Suggestions.polished_original.text,
          rationale: stage2Suggestions.polished_original.rationale,
          what_changed: stage2Suggestions.polished_original.what_changed,
          safety_level: stage2Suggestions.polished_original.safety_level || 'safe',
          when_to_use: stage2Suggestions.polished_original.when_to_use || 'When you want a reliable improvement with minimal risk',
        } : undefined,

        voice_amplifier: stage2Suggestions.voice_amplifier ? {
          text: stage2Suggestions.voice_amplifier.text,
          rationale: stage2Suggestions.voice_amplifier.rationale,
          what_changed: stage2Suggestions.voice_amplifier.what_changed,
          why_authentic: stage2Suggestions.voice_amplifier.why_authentic || 'This version amplifies your unique voice',
          risk_level: stage2Suggestions.voice_amplifier.risk_level || 'medium',
          when_to_use: stage2Suggestions.voice_amplifier.when_to_use || 'When you want to take a creative risk that shows more personality',
        } : undefined,

        how_to_choose: stage2Suggestions.how_to_choose,
      },

      student_context: {
        essay_excerpt: options?.essayExcerpt || issue.quote,
        college: options?.collegeName,
        voice_markers: options?.voiceMarkers,
      },

      guardrails: {
        max_response_length: 300,
        must_reference_suggestion: true,
        must_explain_changes: true,
        encourage_adaptation: true,
      },
    };
  }

  /**
   * Send message in suggestion mode
   *
   * Helps students understand and implement specific Stage 2 suggestions.
   */
  async sendSuggestionMessage(
    userMessage: string,
    context: SuggestionModeContext,
    conversationHistory: WorkshopChatMessage[] = []
  ): Promise<WorkshopChatResponse> {
    // Build suggestion-specific system prompt
    const systemPrompt = this.buildSuggestionSystemPrompt(context);

    // Format conversation history
    const historyText = conversationHistory.length > 0
      ? conversationHistory.map(msg =>
          `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.content}`
        ).join('\n\n')
      : '';

    // Build user prompt
    const userPrompt = `${historyText ? `## Previous Conversation\n${historyText}\n\n` : ''}## Student's Question
"${userMessage}"

## Your Response
Help them understand the suggestions and decide which to use. If they want to adapt or modify, guide them. Reference the specific changes made.`;

    try {
      const response = await callClaudeWithRetry(
        userPrompt,
        {
          systemPrompt,
          temperature: 0.5, // Even lower for suggestion mode - more consistent
          maxTokens: 700,
          useJsonMode: false,
          cacheSystemPrompt: true,
        }
      );

      const assistantMessage: WorkshopChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        mode: 'workshop_suggestion',
      };

      // Estimate cost
      const inputCost = response.usage.input_tokens * 0.003 / 1000;
      const outputCost = response.usage.output_tokens * 0.015 / 1000;

      return {
        message: assistantMessage,
        suggested_next_step: this.getSuggestionNextStep(conversationHistory.length),
        progress: {
          current_step: conversationHistory.length + 1,
          total_steps: 3, // Understand → Choose → Adapt
          technique_complete: conversationHistory.length >= 2,
        },
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost: inputCost + outputCost,
        },
      };

    } catch (error: any) {
      console.error('[WorkshopChatMode:Suggestion] Error:', error);

      return {
        message: {
          role: 'assistant',
          content: `I'm having trouble connecting. Let's try again. In the meantime, compare the two suggestions above and think about which feels more like your voice.`,
          timestamp: Date.now(),
          mode: 'workshop_suggestion',
        },
        progress: {
          current_step: 1,
          total_steps: 3,
          technique_complete: false,
        },
        usage: { inputTokens: 0, outputTokens: 0, cost: 0 },
      };
    }
  }

  /**
   * Get welcome message for suggestion mode
   *
   * Warm, conversational welcome that:
   * 1. Hooks with honest insight
   * 2. Makes them feel understood (not judged)
   * 3. Shows them the transformation clearly
   * 4. Reassures them they're in good hands
   * 5. Guides them into discovery
   */
  getSuggestionWelcomeMessage(context: SuggestionModeContext): WorkshopChatMessage {
    const { issue, suggestions } = context;

    // Generate dynamic hook based on issue
    const hook = this.generateDynamicHook(issue.problem_summary, issue.original_quote);

    let content = `${hook}\n\n`;
    content += `"${issue.original_quote.substring(0, 150)}${issue.original_quote.length > 150 ? '...' : ''}"\n\n`;

    // Empathetic acknowledgment - make them feel understood, not judged
    content += `I want you to know something: this isn't a "bad" sentence. It's actually exactly the kind of thing most students write, and for good reason—you're trying to communicate something real about yourself. The problem is that *everyone* writes sentences like this, which means yours gets lost in the pile.\n\n`;

    // Clear diagnosis without making them feel bad
    content += `**Here's what's actually happening:** ${issue.diagnosis} It's not that the sentiment is wrong—it's that admissions officers can't *see* you yet. They're reading a claim when what they need is a window into who you actually are.\n\n`;

    // The fix approach - reassuring
    content += `**The good news:** This is completely fixable, and you already have everything you need. We're not going to invent something new about you—we're going to find a real moment that already happened and let *that* do the talking.\n\n`;

    if (suggestions.polished_original && suggestions.voice_amplifier) {
      content += `Let me show you what I mean. Here's your sentence transformed two different ways:\n\n`;

      content += `**Version A** (clean and direct):\n`;
      content += `"${suggestions.polished_original.text}"\n\n`;
      content += `*Why this works:* ${suggestions.polished_original.rationale}\n\n`;

      content += `**Version B** (more personality, more risk):\n`;
      content += `"${suggestions.voice_amplifier.text}"\n\n`;
      content += `*Why this works:* ${suggestions.voice_amplifier.rationale}\n\n`;

      content += `See the difference? Both versions work because they follow the same principles:\n`;
      content += `- **A specific moment** instead of a general claim ("always" or "every time")\n`;
      content += `- **Visible action** that someone could observe, not just an internal feeling\n`;
      content += `- **A choice that reveals character**—you did this instead of something else\n\n`;

      content += `Now, those examples are teaching tools—they're not YOUR story. But you have moments like this. Everyone does. The trick is finding the right one and knowing how to capture it.\n\n`;

      content += `**That's what we're going to do together.**\n\n`;

      content += `Think back to a time when this quality—the one you're trying to show—was actually visible in your life. Not when you *felt* it, but when someone watching you would have *seen* it. A single moment. Could be big, could be small. Where were you? What were you actually doing?`;
    } else if (suggestions.polished_original) {
      content += `Let me show you what I mean:\n\n`;
      content += `"${suggestions.polished_original.text}"\n\n`;
      content += `*Why this works:* ${suggestions.polished_original.rationale}\n\n`;
      content += `The principles: specific moment, visible action, and a choice that reveals who you are.\n\n`;
      content += `Now, that's a teaching example—not YOUR story. But you have moments like this.\n\n`;
      content += `**Let's find yours.** Think back to a time when this quality was visible. Where were you, and what were you doing?`;
    } else if (suggestions.voice_amplifier) {
      content += `Let me show you what I mean:\n\n`;
      content += `"${suggestions.voice_amplifier.text}"\n\n`;
      content += `*Why this works:* ${suggestions.voice_amplifier.rationale}\n\n`;
      content += `The principles: specific moment, visible action, and a choice that reveals who you are.\n\n`;
      content += `Now, that's a teaching example—not YOUR story. But you have moments like this.\n\n`;
      content += `**Let's find yours.** Think back to a time when this quality was visible. Where were you, and what were you doing?`;
    }

    return {
      role: 'assistant',
      content,
      timestamp: Date.now(),
      mode: 'workshop_suggestion',
    };
  }

  /**
   * Build system prompt for suggestion mode
   *
   * PHILOSOPHY: Use suggestions as TEACHING EXAMPLES, not copy-paste templates
   *
   * The suggestions show WHAT the technique looks like when applied well.
   * But we want the STUDENT to write their own version using those principles.
   *
   * Flow:
   * 1. Show the suggestions as examples of the technique
   * 2. Explain the PRINCIPLES that make them work
   * 3. Ask the student to write THEIR version using those principles
   * 4. Analyze their attempt and provide feedback
   */
  private buildSuggestionSystemPrompt(context: SuggestionModeContext): string {
    const { issue, suggestions, guardrails, student_context } = context;

    let prompt = `You are a supportive, expert college admissions essay coach running a TRUE WRITING WORKSHOP.

# CRITICAL PHILOSOPHY: TEACH, DON'T TEMPLATE

**The suggestions below are TEACHING EXAMPLES, not templates to copy.**

Your job is to:
1. Use the suggestions to ILLUSTRATE what good writing looks like
2. Extract the PRINCIPLES that make them work
3. Ask the student to write THEIR OWN version using those principles
4. Analyze their attempt and provide specific feedback

**Why This Matters:**
- If students copy our suggestions (even with their details), all essays sound the same
- Admissions officers and AI detectors can spot templated writing
- Real learning happens when THEY create, and WE coach
- Their authentic voice matters more than "perfect" phrasing

# THE ISSUE BEING ADDRESSED

**Student's Original Text:**
"${issue.original_quote}"

**Location in Essay:** ${issue.location}

**The Problem:**
${issue.problem_summary}

**Why This Matters:**
${issue.diagnosis}
${student_context.college ? `\n**Target College:** ${student_context.college}` : ''}

# EXAMPLE REVISIONS (For Teaching, Not Copying)

These show what APPLYING the technique looks like. Use them to explain principles, NOT as templates.
`;

    if (suggestions.polished_original) {
      prompt += `
### Example A: Polished Approach
"${suggestions.polished_original.text}"

**The principles at work:**
${suggestions.polished_original.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${suggestions.polished_original.rationale}
`;
    }

    if (suggestions.voice_amplifier) {
      prompt += `
### Example B: Voice-Forward Approach
"${suggestions.voice_amplifier.text}"

**The principles at work:**
${suggestions.voice_amplifier.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${suggestions.voice_amplifier.rationale}
**The risk/reward:** ${suggestions.voice_amplifier.why_authentic}
`;
    }

    prompt += `

# GUIDED DISCOVERY FRAMEWORK

Your questions should guide their thinking progressively, not ask them to generate ideas from nothing.

## LAYER 1: Anchoring Questions (Find the moment)
Purpose: Help them identify a SPECIFIC moment, not an abstract concept.

**Explain why you're asking:**
"The examples above work because they show SPECIFIC scenes, not general claims. Let me help you find YOUR specific moment that shows this same quality."

**Anchoring questions:**
- "Think back to a time when this quality was visible in you. Where were you physically? What time of day was it?"
- "When did someone first notice this about you? What were you actually doing when they noticed?"
- "What's a moment when you surprised yourself with how much you cared about this?"

## LAYER 2: Sensory Excavation (Deepen the moment)
Purpose: Once they have a moment, help them access the DETAILS that make it vivid.

**Explain why details matter:**
"I know WHAT happened, but I can't SEE it yet. Notice how the examples have details like 'same worn copy of Hawking's book' or 'fifth time that week.' These specifics make readers feel present. Let's find YOUR version of those details."

**Sensory questions (pick 2-3 relevant ones):**
- "Picture yourself there. What's the first small detail you see?"
- "What sounds were in the background?"
- "What were your hands doing? Holding something?"
- "Who else was there? What were THEY doing differently?"

## LAYER 3: The Contrast (Find the choice)
Purpose: The examples work because they show CHOICE—doing something different from others.

**Explain why contrast matters:**
"Notice in the examples: 'everyone sprinting toward the kickball diamond, me sprinting toward the library.' The power is in the CONTRAST. What were others doing while you were doing this?"

**Contrast questions:**
- "What would most people have been doing in that moment? Why did you do something different?"
- "Did anyone notice you were doing something unusual? How did they react?"
- "What did you give up or skip to do this instead?"

## LAYER 4: Writing Prompt (Now they're ready)
Only AFTER they've surfaced rich details, prompt them to write.

**The transition:**
"You've given me great material. You have [specific detail], [contrast with others], and [authentic element they mentioned]. Now put yourself back there and write 1-2 sentences capturing that scene. Don't worry about making it perfect—just get the moment down. We'll refine it together."

## HANDLING COMMON SITUATIONS

**If they ask "Can I just use Example A/B?"**
"I understand the temptation—those examples are good! But here's the thing: if you use them with just your details swapped in, your essay will sound like everyone else who does the same thing. Admissions officers read thousands of essays and can spot templates instantly. Let's find YOUR moment instead. What's a time when [quality they're trying to show] was visible in your life?"

**If they give a thin/generic response:**
"That's a starting point, but right now it could be anyone's story. What's the detail that makes it specifically YOURS? The thing you'd remember that no one else would know?"

**If they seem stuck:**
"Let's try a different angle. Forget the 'perfect' moment. What's a tiny moment—a single afternoon, a specific conversation, even a random Tuesday? Sometimes the small moments are more powerful than the big ones."

**When they share their attempt:**
1. Quote exactly what they wrote
2. Identify what's WORKING: "The phrase '[their words]' is strong because..."
3. Identify what needs work: "This part is still a bit abstract. Help me SEE it."
4. Give ONE targeted improvement: "Keep everything else, but add [specific element]"
5. Ask for revision: "Take another pass with that in mind"

# TONE GUIDELINES

BE:
- A coach who genuinely wants to help them write something great
- Patient and encouraging through iterations
- Specific in both praise and feedback
- Honest when something isn't working yet

DON'T BE:
- A ghostwriter who does the work for them
- Vague ("make it more specific" without explaining how)
- Impatient when they need multiple tries
- Discouraging about their genuine attempts

**Response Length:** ${guardrails.max_response_length} words maximum

Remember: Your job is to help them discover and articulate THEIR story, not to give them a better version of someone else's.`;

    return prompt;
  }

  /**
   * Get suggested next step for suggestion mode
   */
  private getSuggestionNextStep(conversationLength: number): string {
    if (conversationLength === 0) {
      return "Would you like me to explain the differences between the two options?";
    } else if (conversationLength === 1) {
      return "Ready to choose one, or would you like to adapt elements from both?";
    } else if (conversationLength === 2) {
      return "Want to finalize your revision and see how it fits in your essay?";
    }
    return "Is there anything else you'd like to adjust before using this revision?";
  }

  // ==========================================================================
  // MODE DETECTION & UTILITIES
  // ==========================================================================

  /**
   * Check if conversation should exit workshop mode
   *
   * Detects when student wants to switch topics or is done
   */
  shouldExitWorkshopMode(userMessage: string): boolean {
    const exitSignals = [
      /\bdone\b.*\btechnique\b/i,
      /\bnew\b.*\bissue\b/i,
      /\bswitch\b.*\btopic\b/i,
      /\bwork on\b.*\bsomething else\b/i,
      /\bexit\b.*\bworkshop\b/i,
      /\bgo back\b/i,
      /\breturn to\b/i,
    ];

    return exitSignals.some(pattern => pattern.test(userMessage));
  }

  /**
   * Get suggested follow-up based on progress
   */
  private getSuggestedNextStep(currentStep: number, context: WorkshopModeContext): string {
    const { steps } = context.universal_teaching;

    if (currentStep >= steps.length) {
      return "Great work! You've completed all the steps. Want to review your transformation, or try applying this technique to another part of your essay?";
    }

    const nextStep = steps[currentStep];
    if (nextStep) {
      return `Ready for Step ${currentStep + 1}: ${nextStep.name}?`;
    }

    return "What would you like to work on next?";
  }

  /**
   * Map symptom type from diagnosis to issue type for teaching
   */
  private mapSymptomToIssueType(symptomType: string): IssueType | null {
    const mapping: Record<string, IssueType> = {
      // Telling/Abstract issues
      'abstract_language': 'telling_not_showing',
      'telling_not_showing': 'telling_not_showing',
      'generic_claim': 'telling_not_showing',

      // Passive/Agency issues
      'passive_voice': 'passive_victim_framing',
      'passive_agency': 'passive_victim_framing',
      'passive_victim': 'passive_victim_framing',
      'passive_victim_framing': 'passive_victim_framing',

      // Cliché issues
      'cliche_language': 'cliche_language',
      'cliche_expression': 'cliche_language',
      'cliche': 'cliche_language',

      // Inspirational clichés
      'inspirational_cliche': 'cliche_inspirational',
      'cliche_inspirational': 'cliche_inspirational',

      // AI convergence
      'ai_language': 'cliche_ai_convergence',
      'ai_convergence': 'cliche_ai_convergence',
      'cliche_ai_convergence': 'cliche_ai_convergence',

      // Performative intelligence
      'performative_intelligence': 'performative_intelligence',
      'thesaurus_problem': 'performative_intelligence',

      // Resolution issues
      'premature_resolution': 'premature_resolution',
      'forced_epiphany': 'premature_resolution',
      'false_epiphany': 'false_epiphany',

      // Systems awareness
      'missing_systems_awareness': 'missing_systems_awareness',
      'individual_level': 'missing_systems_awareness',

      // Vulnerability
      'strategic_vulnerability': 'strategic_vulnerability',
      'announced_vulnerability': 'strategic_vulnerability',
      'vulnerability_without_growth': 'strategic_vulnerability',

      // Generic/Research issues (Why Us essays)
      'generic_research': 'telling_not_showing',
      'swap_test_fail': 'telling_not_showing',
      'generic_why_us': 'telling_not_showing',
    };

    return mapping[symptomType.toLowerCase()] || null;
  }

  /**
   * Estimate time based on difficulty
   */
  private estimateTime(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
    switch (difficulty) {
      case 'beginner': return '5-10 minutes';
      case 'intermediate': return '10-15 minutes';
      case 'advanced': return '15-20 minutes';
      default: return '10-15 minutes';
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const workshopChatModeService = new WorkshopChatModeService();

// ============================================================================
// UTILITY: Integration with existing feedback system
// ============================================================================

/**
 * Create workshop mode contexts from Stage 1B issues
 *
 * This is the main integration point between existing feedback
 * and workshop mode. Call this after diagnosis to enable workshop chat.
 */
export function createWorkshopContextsFromIssues(
  issues: CriticalIssue[],
  collegeName?: string
): Map<number, WorkshopModeContext> {
  const contexts = new Map<number, WorkshopModeContext>();

  for (const issue of issues) {
    const context = workshopChatModeService.buildWorkshopContext(issue, collegeName);
    if (context) {
      contexts.set(issue.issue_number, context);
    }
  }

  return contexts;
}

/**
 * Determine appropriate chat mode based on user intent
 *
 * This helps the frontend decide which mode to activate
 */
export function detectChatModeIntent(userMessage: string): ChatMode {
  // Workshop mode signals
  const workshopSignals = [
    /\bapply\b.*\btechnique\b/i,
    /\bshow\b.*\bhow\b.*\bto\b/i,
    /\bhelp me\b.*\bfix\b/i,
    /\bwork on\b.*\bissue\b/i,
    /\bimprove\b.*\bthis\b/i,
    /\bimplement\b/i,
    /\bstep by step\b/i,
  ];

  // Review mode signals
  const reviewSignals = [
    /\breview\b/i,
    /\bcheck\b.*\bessay\b/i,
    /\bfinal\b.*\bpolish\b/i,
    /\bproofread\b/i,
  ];

  // Brainstorm mode signals
  const brainstormSignals = [
    /\bideas?\b/i,
    /\bbrainstorm\b/i,
    /\bexplore\b/i,
    /\bwhat if\b/i,
    /\bthink about\b/i,
  ];

  if (workshopSignals.some(p => p.test(userMessage))) return 'workshop';
  if (reviewSignals.some(p => p.test(userMessage))) return 'review';
  if (brainstormSignals.some(p => p.test(userMessage))) return 'brainstorm';

  return 'universal';
}

// ============================================================================
// STAGE 2 INTEGRATION HELPERS
// ============================================================================

/**
 * Import types for Stage 2 integration
 */
import type {
  IssueSuggestion,
  TypeSpecificSuggestionOutput,
} from './typeSpecificSuggestionService';

/**
 * Create SuggestionModeContext from Stage 2 IssueSuggestion output
 *
 * This is the PRIMARY integration point for connecting high-quality
 * Stage 2 suggestions to the Workshop Chat Mode.
 *
 * @param issueSuggestion - The Stage 2 suggestion output for a single issue
 * @param criticalIssue - The original Stage 1B critical issue (for diagnosis context)
 * @param options - Additional context (college name, essay excerpt, voice markers)
 * @returns SuggestionModeContext ready for workshop chat
 */
export function createSuggestionContextFromStage2(
  issueSuggestion: IssueSuggestion,
  criticalIssue: CriticalIssue,
  options?: {
    collegeName?: string;
    essayExcerpt?: string;
    voiceMarkers?: string[];
  }
): SuggestionModeContext {
  const { suggestions, teaching } = issueSuggestion;

  return {
    mode: 'workshop_suggestion',
    mode_version: WorkshopChatModeService.MODE_VERSION,
    sub_mode: 'suggestion',

    issue: {
      issue_number: criticalIssue.issue_number,
      original_quote: issueSuggestion.issue_quote || criticalIssue.quote,
      location: criticalIssue.location,
      problem_summary: criticalIssue.problem,
      diagnosis: issueSuggestion.diagnosis_summary || criticalIssue.diagnosis,
    },

    suggestions: {
      polished_original: suggestions.polished_original ? {
        text: suggestions.polished_original.text,
        rationale: suggestions.polished_original.rationale,
        what_changed: suggestions.polished_original.what_changed,
        safety_level: suggestions.polished_original.safety_level || 'safe',
        when_to_use: suggestions.polished_original.when_to_use ||
          'When you want a reliable improvement with minimal risk',
      } : undefined,

      voice_amplifier: suggestions.voice_amplifier ? {
        text: suggestions.voice_amplifier.text,
        rationale: suggestions.voice_amplifier.rationale,
        what_changed: suggestions.voice_amplifier.what_changed,
        why_authentic: suggestions.voice_amplifier.why_authentic ||
          'This version amplifies your unique voice',
        risk_level: suggestions.voice_amplifier.risk_level || 'medium',
        when_to_use: suggestions.voice_amplifier.when_to_use ||
          'When you want to take a creative risk that shows more personality',
      } : undefined,

      how_to_choose: teaching.how_to_choose ? {
        polished_when: teaching.how_to_choose.polished_when,
        voice_when: teaching.how_to_choose.voice_when,
        can_combine: teaching.how_to_choose.can_combine,
      } : undefined,
    },

    student_context: {
      essay_excerpt: options?.essayExcerpt || issueSuggestion.issue_quote || criticalIssue.quote,
      college: options?.collegeName,
      voice_markers: options?.voiceMarkers,
    },

    guardrails: {
      max_response_length: 300,
      must_reference_suggestion: true,
      must_explain_changes: true,
      encourage_adaptation: true,
    },
  };
}

/**
 * Create all SuggestionModeContexts from complete Stage 2 output
 *
 * Use this to create workshop contexts for ALL issues at once,
 * matching them with their corresponding Stage 1B critical issues.
 *
 * @param stage2Output - Complete Stage 2 TypeSpecificSuggestionOutput
 * @param criticalIssues - Array of Stage 1B CriticalIssue (must match by index/issue_number)
 * @param options - Additional context
 * @returns Map of issue_number → SuggestionModeContext
 */
export function createAllSuggestionContextsFromStage2(
  stage2Output: TypeSpecificSuggestionOutput,
  criticalIssues: CriticalIssue[],
  options?: {
    collegeName?: string;
    essayExcerpt?: string;
    voiceMarkers?: string[];
  }
): Map<number, SuggestionModeContext> {
  const contexts = new Map<number, SuggestionModeContext>();

  // Use college name from Stage 2 output if not provided
  const collegeName = options?.collegeName || stage2Output.college_name || undefined;

  for (const issueSuggestion of stage2Output.issues) {
    // Find matching critical issue by issue_id (which maps to issue_number)
    const issueNumber = parseInt(issueSuggestion.issue_id.replace(/\D/g, ''), 10) ||
                        stage2Output.issues.indexOf(issueSuggestion) + 1;

    const criticalIssue = criticalIssues.find(ci => ci.issue_number === issueNumber) ||
                          criticalIssues[stage2Output.issues.indexOf(issueSuggestion)];

    if (criticalIssue) {
      const context = createSuggestionContextFromStage2(
        issueSuggestion,
        criticalIssue,
        { ...options, collegeName }
      );
      contexts.set(criticalIssue.issue_number, context);
    }
  }

  return contexts;
}

/**
 * Workshop handoff package - everything needed to start a workshop session
 *
 * This is the complete handoff from Stage 1B + Stage 2 to Workshop Chat Mode.
 * Use this when the student clicks "Implement Suggestion" or "Learn More".
 */
export interface WorkshopHandoffPackage {
  /** The suggestion mode context for workshop chat */
  suggestionContext: SuggestionModeContext;

  /** The technique mode context (for universal learning) */
  techniqueContext: WorkshopModeContext | null;

  /** The welcome message to show immediately */
  suggestionWelcome: WorkshopChatMessage;

  /** The original critical issue for reference */
  originalIssue: CriticalIssue;

  /** The Stage 2 suggestion output for reference */
  stage2Suggestion: IssueSuggestion;

  /** College name if applicable */
  collegeName?: string;
}

/**
 * Create complete workshop handoff package
 *
 * This is the MAIN integration function to use when a student wants
 * to enter workshop mode from the feedback interface.
 *
 * @param issueSuggestion - Stage 2 suggestion for the specific issue
 * @param criticalIssue - Stage 1B diagnosis for the issue
 * @param options - Additional context
 * @returns Complete handoff package ready for workshop chat
 */
export function createWorkshopHandoffPackage(
  issueSuggestion: IssueSuggestion,
  criticalIssue: CriticalIssue,
  options?: {
    collegeName?: string;
    essayExcerpt?: string;
    voiceMarkers?: string[];
  }
): WorkshopHandoffPackage {
  // Create suggestion mode context from Stage 2 output
  const suggestionContext = createSuggestionContextFromStage2(
    issueSuggestion,
    criticalIssue,
    options
  );

  // Create technique mode context (for universal learning)
  const techniqueContext = workshopChatModeService.buildWorkshopContext(
    criticalIssue,
    options?.collegeName
  );

  // Get the welcome message
  const suggestionWelcome = workshopChatModeService.getSuggestionWelcomeMessage(suggestionContext);

  return {
    suggestionContext,
    techniqueContext,
    suggestionWelcome,
    originalIssue: criticalIssue,
    stage2Suggestion: issueSuggestion,
    collegeName: options?.collegeName,
  };
}
