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

// SECURITY: Import sanitization utilities for AI prompt injection prevention
import { sanitizeEssayContent, sanitizeChatMessage, logSecurityEvent } from '@/http/security';

// Research-backed technique selection
import {
  researchTechniqueSelector,
  detectIssueCategory,
  type IssueCategory,
  type ResearchTeachingApproach,
} from './researchTechniqueSelector';

// Citation system for research-backed credibility
import { CitationAttacher, CitationDisplayData } from './citationAttacher';
import { CitationTriggerDetector } from './citationTriggerDetector';

// Essay context system for holistic understanding
import {
  EssayContext,
  SectionRole,
  initializeEssayContext,
  accumulateContext,
  formatContextForPrompt,
  detectSectionRole,
  getSectionPurpose,
} from './essayContextService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Workshop phases in the decision tree architecture
 *
 * Each phase has its own focused prompt optimized for that specific task:
 * - DISCOVER: Help student find a specific moment to write about
 * - CRAFT: Teach writing techniques to turn the moment into prose
 * - ANALYZE: Deep analysis and feedback on their draft
 * - POLISH: Final sentence-level refinements
 */
export type WorkshopPhase = 'discover' | 'craft' | 'analyze' | 'polish';

/**
 * Result of phase detection from conversation history
 */
export interface PhaseDetectionResult {
  phase: WorkshopPhase;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  signals: string[];
}

/**
 * Summary of conversation state for phase-specific prompts
 * This prevents sending full history while maintaining context
 */
export interface ConversationSummary {
  phase: WorkshopPhase;
  turnCount: number;
  studentMoment?: string;         // If discovered - the specific moment they shared
  studentDraft?: string;          // If written - their draft text
  keyDetails?: string[];          // Important details they've shared
  techniquesTaught?: string[];    // Techniques already covered
  feedbackGiven?: string[];       // Areas already addressed
  lastCoachAction?: string;       // What the coach did in the last turn
  essayContext?: EssayContext;    // Accumulated essay-level understanding
}

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

  // The PRIMARY technique being implemented
  technique: {
    issue_type: IssueType;
    technique_name: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_time: string;
  };

  // ALL available techniques (not just the first one)
  available_techniques: Array<{
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    steps: string[];
    common_mistakes: string[];
  }>;

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

    // Common mistakes to avoid (surfaced from technique bundle)
    common_mistakes?: string[];
  };

  // College-specific guidance (when available)
  college_guidance?: {
    college_name: string;
    emphasis: string;
    what_they_look_for: string;
    tip: string;
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

  // Optional citations for research-backed credibility
  // When present, content will contain <sup>N</sup> markers
  // and citations will have the corresponding display data
  citations?: Record<number, CitationDisplayData>;
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
    /** NEW: Current phase in the decision tree (discover, craft, analyze, polish) */
    current_phase?: WorkshopPhase;
    /** NEW: Confidence of phase detection */
    phase_confidence?: 'high' | 'medium' | 'low';
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

// ============================================================================
// PHASE DETECTION - Decision Tree State Management
// ============================================================================

/**
 * Detect if student message contains specific moment details
 * A specific moment has time, place, people, or actions
 */
function detectSpecificMoment(content: string): {
  hasSpecificMoment: boolean;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
} {
  const signals: string[] = [];
  let score = 0;

  // Time references
  const timePatterns = [
    /\b(last|this|one)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year|summer|fall|winter|spring|morning|afternoon|evening|night)\b/i,
    /\b(freshman|sophomore|junior|senior)\s+year\b/i,
    /\bin\s+\d+(st|nd|rd|th)\s+grade\b/i,
    /\bwhen\s+i\s+was\s+\d+\b/i,
    /\b(at|around)\s+\d+\s*(am|pm|o'clock)?\b/i,
    /\b(during|after|before)\s+(class|school|practice|dinner|lunch)\b/i,
  ];
  if (timePatterns.some(p => p.test(content))) {
    score++;
    signals.push('time_reference');
  }

  // Location references
  const locationPatterns = [
    /\bin\s+(my|the|our|his|her)\s+(room|house|kitchen|backyard|car|school|class|lab|office|bedroom|garage|basement)\b/i,
    /\bat\s+(the|my|our|a)\s+\w+/i,
    /\b(hospital|church|library|gym|park|store|restaurant|coffee shop|airport|beach)\b/i,
    /\b(standing|sitting|lying|walking)\s+(in|at|by|near)\b/i,
  ];
  if (locationPatterns.some(p => p.test(content))) {
    score++;
    signals.push('location_reference');
  }

  // Specific people
  const peoplePatterns = [
    /\b(my|our)\s+(mom|dad|mother|father|sister|brother|grandma|grandpa|grandmother|grandfather|aunt|uncle|cousin|friend|teacher|coach|boss)\b/i,
    /\b(mr|mrs|ms|dr|coach|professor)\.?\s+[A-Z]\w+/i,
    /\b[A-Z][a-z]+\s+(said|told|asked|looked)\b/,  // Named person doing action
  ];
  if (peoplePatterns.some(p => p.test(content))) {
    score++;
    signals.push('people_reference');
  }

  // Concrete actions (past tense, specific verbs)
  const actionPatterns = [
    /\bi\s+(picked up|looked at|walked|ran|sat|stood|grabbed|held|saw|heard|felt|said|asked|told|opened|closed|put|took|made|called|texted|sent|read|wrote)\b/i,
    /\b(she|he|they|we)\s+(said|asked|told|looked|handed|gave|showed|pointed|smiled|laughed|cried|shouted|whispered)\b/i,
    /\bmy\s+(hands|eyes|voice|heart|stomach|feet)\s+(were|was|started|began)\b/i,
  ];
  if (actionPatterns.some(p => p.test(content))) {
    score++;
    signals.push('action_reference');
  }

  // Sensory details
  const sensoryPatterns = [
    /\bi\s+(saw|heard|felt|smelled|tasted|noticed)\b/i,
    /\b(cold|warm|hot|bright|dark|loud|quiet|soft|hard|smooth|rough|wet|dry)\b/i,
    /\bthe\s+(sound|smell|feeling|sight|taste)\s+of\b/i,
    /\b(trembling|shaking|sweating|crying|laughing|smiling)\b/i,
  ];
  if (sensoryPatterns.some(p => p.test(content))) {
    score++;
    signals.push('sensory_detail');
  }

  // Dialogue or quoted speech
  const dialoguePatterns = [
    /[""'][^""']{5,}[""']/,  // Quoted text
    /\b(said|asked|told|replied|answered|shouted|whispered),?\s*[""']/i,
    /\b(she|he|they|my\s+\w+)\s+said\b/i,
  ];
  if (dialoguePatterns.some(p => p.test(content))) {
    score++;
    signals.push('dialogue');
  }

  return {
    hasSpecificMoment: score >= 2,  // Need at least 2 signals for confidence
    confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
    signals,
  };
}

/**
 * Detect if student message contains actual draft writing
 * (not just describing what they might write)
 */
function detectDraftWriting(message: string): {
  hasDraft: boolean;
  signals: string[];
  extractedDraft?: string;
} {
  const signals: string[] = [];

  // Look for draft indicators
  const draftIndicators = [
    /here'?s?\s+(what\s+i|my\s+(attempt|draft|version|try))/i,
    /i\s+(wrote|tried|attempted)/i,
    /my\s+(attempt|draft|version|try)/i,
    /^[""'].{20,}[""']/m,  // Starts with substantial quote
    /let\s+me\s+(try|write|share)/i,
  ];

  if (draftIndicators.some(p => p.test(message))) {
    signals.push('draft_indicator');
  }

  // Multiple complete sentences (not questions)
  const sentences = message.split(/[.!]+/).filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 15 && !trimmed.endsWith('?');
  });

  if (sentences.length >= 2) {
    signals.push('multiple_sentences');
  }

  // Past tense narrative voice
  const narrativePatterns = [
    /\bi\s+(walked|ran|said|looked|felt|thought|realized|noticed|heard|saw|sat|stood|picked|grabbed|opened)\b/i,
    /\bthe\s+\w+\s+(was|were)\s+\w+ing\b/i,  // "The room was glowing"
  ];
  if (narrativePatterns.some(p => p.test(message))) {
    signals.push('narrative_voice');
  }

  // Has written sensory/action details in prose form
  const proseDetails = [
    /\bmy\s+(hands|eyes|heart)\s+(were|was|began|started|felt)\b/i,
    /\b(the\s+)?(light|sound|smell|air|room|silence)\s+(was|felt|seemed)\b/i,
    /\b(trembling|shaking|breathing|whispering|staring)\b/i,
  ];
  if (proseDetails.some(p => p.test(message)) && sentences.length >= 1) {
    signals.push('prose_details');
  }

  // Extract the likely draft content
  let extractedDraft: string | undefined;
  const quoteMatch = message.match(/[""'](.{30,})[""']/);
  if (quoteMatch) {
    extractedDraft = quoteMatch[1];
  } else if (sentences.length >= 2 && signals.length >= 2) {
    extractedDraft = sentences.slice(0, 3).join('. ') + '.';
  }

  return {
    hasDraft: signals.length >= 2,
    signals,
    extractedDraft,
  };
}

/**
 * Check if conversation shows polish-ready signals
 * (strong content that just needs final refinement)
 */
function hasPolishSignals(history: WorkshopChatMessage[]): boolean {
  // Need at least 4 turns to be in polish phase
  if (history.length < 8) return false;

  // Get recent assistant messages
  const recentAssistant = history
    .filter(m => m.role === 'assistant')
    .slice(-3)
    .map(m => m.content.toLowerCase());

  // Look for polish indicators in coach feedback
  const polishIndicators = [
    /strong|working well|good job|excellent|nailed|captured/,
    /now let's|final|polish|refine|tweak/,
    /word choice|rhythm|precision|sentence-level/,
    /almost there|close to|nearly ready/,
  ];

  const polishMatches = recentAssistant.filter(content =>
    polishIndicators.some(p => p.test(content))
  );

  return polishMatches.length >= 2;
}

/**
 * Main phase detection function
 * Analyzes conversation history to determine current workshop phase
 */
export function detectWorkshopPhase(
  history: WorkshopChatMessage[],
  originalQuote: string
): PhaseDetectionResult {
  // Get student messages only
  const studentMessages = history.filter(m => m.role === 'user');
  const lastStudentMessage = studentMessages[studentMessages.length - 1]?.content || '';
  const allStudentContent = studentMessages.map(m => m.content).join('\n');

  const signals: string[] = [];

  // PHASE 4 CHECK (most specific first)
  if (hasPolishSignals(history)) {
    return {
      phase: 'polish',
      confidence: 'high',
      reasoning: 'Content is strong, ready for final refinement',
      signals: ['multiple_revisions', 'positive_feedback'],
    };
  }

  // PHASE 3 CHECK
  // Has the student written actual draft sentences?
  const draftSignals = detectDraftWriting(lastStudentMessage);
  if (draftSignals.hasDraft) {
    signals.push(...draftSignals.signals);
    return {
      phase: 'analyze',
      confidence: 'high',
      reasoning: 'Student has written draft content to analyze',
      signals,
    };
  }

  // PHASE 2 CHECK
  // Has the student shared a specific moment?
  const momentSignals = detectSpecificMoment(allStudentContent);
  if (momentSignals.hasSpecificMoment) {
    signals.push(...momentSignals.signals);
    return {
      phase: 'craft',
      confidence: momentSignals.confidence,
      reasoning: 'Student has shared specific moment, ready to teach craft',
      signals,
    };
  }

  // DEFAULT: PHASE 1
  return {
    phase: 'discover',
    confidence: 'high',
    reasoning: 'Student still needs to find a specific moment',
    signals: ['no_specific_moment_yet'],
  };
}

/**
 * Summarize conversation for phase-specific context
 * Extracts key information without sending full history
 * Also builds and accumulates essay context across turns
 */
export function summarizeConversation(
  history: WorkshopChatMessage[],
  phaseResult: PhaseDetectionResult,
  context?: WorkshopModeContext,
  existingEssayContext?: EssayContext
): ConversationSummary {
  const studentMessages = history.filter(m => m.role === 'user');
  const assistantMessages = history.filter(m => m.role === 'assistant');

  const summary: ConversationSummary = {
    phase: phaseResult.phase,
    turnCount: Math.floor(history.length / 2),
    keyDetails: [],
    techniquesTaught: [],
    feedbackGiven: [],
  };

  // Extract key student details mentioned
  const allStudentContent = studentMessages.map(m => m.content).join('\n');

  // Look for specific details they've shared
  const detailPatterns = [
    { pattern: /\b(my\s+\w+)\s+(said|told|asked)/gi, type: 'dialogue_mentioned' },
    { pattern: /\b(in|at)\s+(my|the|our)\s+\w+/gi, type: 'location_mentioned' },
    { pattern: /\b(last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|summer|year)/gi, type: 'time_mentioned' },
  ];

  for (const { pattern, type } of detailPatterns) {
    const matches = allStudentContent.match(pattern);
    if (matches) {
      summary.keyDetails!.push(`${type}: ${matches.slice(0, 2).join(', ')}`);
    }
  }

  // Check for draft content
  const lastStudent = studentMessages[studentMessages.length - 1]?.content || '';
  const draftCheck = detectDraftWriting(lastStudent);
  if (draftCheck.extractedDraft) {
    summary.studentDraft = draftCheck.extractedDraft.substring(0, 300);
  }

  // Check for techniques mentioned by coach
  const coachContent = assistantMessages.map(m => m.content).join('\n');
  const techniquePatterns = [
    { pattern: /\bpacing\b/i, technique: 'pacing' },
    { pattern: /\bsensory\b/i, technique: 'sensory layering' },
    { pattern: /\bdialogue\b/i, technique: 'dialogue' },
    { pattern: /\baction beats?\b/i, technique: 'action beats' },
    { pattern: /\bsentence rhythm\b/i, technique: 'sentence rhythm' },
    { pattern: /\bzoom in\b/i, technique: 'zoom in' },
  ];

  for (const { pattern, technique } of techniquePatterns) {
    if (pattern.test(coachContent)) {
      summary.techniquesTaught!.push(technique);
    }
  }

  // Last coach action summary
  const lastCoach = assistantMessages[assistantMessages.length - 1]?.content || '';
  if (lastCoach.includes('?')) {
    summary.lastCoachAction = 'asked_question';
  } else if (lastCoach.toLowerCase().includes('try writing') || lastCoach.toLowerCase().includes('write')) {
    summary.lastCoachAction = 'prompted_writing';
  } else if (lastCoach.toLowerCase().includes('this works because') || lastCoach.toLowerCase().includes('working')) {
    summary.lastCoachAction = 'gave_feedback';
  }

  // =========================================================================
  // BUILD/ACCUMULATE ESSAY CONTEXT
  // =========================================================================
  if (context) {
    // Initialize or update essay context
    let essayCtx = existingEssayContext;

    if (!essayCtx) {
      // First turn - initialize from issue data
      essayCtx = initializeEssayContext(
        context.technique.issue_type,
        context.student_context.location,
        context.student_context.quote,
        context.student_context.problem
      );
    }

    // Accumulate context from conversation turns
    if (history.length >= 2) {
      // Get the last exchange
      const lastStudentMsg = studentMessages[studentMessages.length - 1]?.content || '';
      const lastCoachMsg = assistantMessages[assistantMessages.length - 1]?.content || '';

      if (lastStudentMsg && lastCoachMsg) {
        essayCtx = accumulateContext(
          essayCtx,
          phaseResult.phase,
          lastStudentMsg,
          lastCoachMsg
        );
      }
    }

    summary.essayContext = essayCtx;
  }

  return summary;
}

// ============================================================================
// PHASE-SPECIFIC SYSTEM PROMPTS
// ============================================================================

/**
 * Build Phase 1 (DISCOVER) system prompt
 *
 * PURPOSE: Help student find a specific moment to write about
 * GOAL: Get them to share a concrete scene with time, place, people, actions
 * DON'T DO: Don't teach writing techniques yet, don't analyze draft
 */
function buildPhase1DiscoverPrompt(
  context: WorkshopModeContext,
  summary: ConversationSummary
): string {
  const { technique, universal_teaching, student_context, college_guidance } = context;

  // Sanitize user content
  const sanitizedQuote = sanitizeEssayContent(student_context.quote);

  // Get essay context for big-picture understanding
  const essayContextBlock = summary.essayContext
    ? formatContextForPrompt(summary.essayContext)
    : '';

  return `You are a supportive, expert college admissions essay coach.

# YOUR CURRENT TASK: DISCOVER A SPECIFIC MOMENT

**Phase:** DISCOVERY (1 of 4)
**Goal:** Help the student find ONE specific moment from their life that demonstrates the quality they're trying to show.

You are NOT teaching writing techniques yet. You are NOT analyzing a draft yet.
Your ONLY job right now is to help them surface a concrete, specific memory.

${essayContextBlock}

# THE ISSUE

**Student's Original Text:**
"${sanitizedQuote}"

**Why This Needs Work:**
${universal_teaching.why_explanation}
${college_guidance ? `\n**${college_guidance.college_name} values:** ${college_guidance.emphasis}` : ''}

# YOUR APPROACH

## What a "Specific Moment" Means
A specific moment has:
- A TIME (when did this happen?)
- A PLACE (where were you physically?)
- PEOPLE (who was there?)
- ACTIONS (what were you doing?)

Abstract claims like "I'm passionate about science" are NOT specific moments.
"Last summer in my garage, calibrating the pH sensor while my cat knocked over the beakers" IS a specific moment.

## How to Guide Discovery

**Anchoring Questions** (help them find the moment):
- "Think back to a time when this quality was VISIBLE in you. Where were you? What time of day was it?"
- "When did someone first NOTICE this about you? What were you actually doing?"
- "What's a moment when you surprised yourself with how much you cared?"

**Sensory Excavation** (once they have a moment):
- "Picture yourself there. What's the first small detail you see?"
- "What sounds were in the background?"
- "What were your hands doing?"

**Handling Thin Responses:**
If they give something generic like "I just really liked it":
→ "I believe you—but 'liked it' is invisible to readers. What did that look like in ACTION? What were you DOING because you liked it so much?"

If they give a generic moment that could be anyone's:
→ "That's a start, but what's the detail that makes this YOUR version? The thing you'd remember that no one else would know?"

## CRITICAL RULES

1. DO NOT write sentences for them
2. DO NOT suggest "try something like [example using their topic]"
3. DO NOT move to teaching writing craft yet—that's Phase 2
4. DO ask follow-up questions to deepen their discovery
5. DO acknowledge progress when they share something specific

## SUCCESS CRITERIA (When to signal readiness for Phase 2)

When their response contains 2+ of these:
- Specific time reference (day, year, time of day)
- Physical location
- Specific people named or referenced
- Concrete actions they took

Then acknowledge the progress: "Now we have something to work with!" and prepare to move to teaching CRAFT.

${summary.turnCount >= 2 ? `
## IMPORTANT: Don't Loop

This is turn ${summary.turnCount}. If they've given you ANYTHING specific (even if not perfect), acknowledge it and move forward.
Don't keep asking "can you be more specific?" indefinitely.
${summary.keyDetails && summary.keyDetails.length > 0 ? `They've already mentioned: ${summary.keyDetails.join(', ')}` : ''}
` : ''}

**Response Length:** 150 words maximum. Be focused.`;
}

/**
 * Build Phase 2 (CRAFT) system prompt
 *
 * PURPOSE: Teach ONE writing technique to turn their moment into prose
 * GOAL: Get them to write 1-2 sentences using the technique
 * DON'T DO: Don't keep asking for more backstory, don't analyze finished draft yet
 */
function buildPhase2CraftPrompt(
  context: WorkshopModeContext,
  summary: ConversationSummary
): string {
  const { technique, universal_teaching, student_context, college_guidance } = context;
  const sanitizedQuote = sanitizeEssayContent(student_context.quote);

  // Get essay context for big-picture understanding
  const essayContextBlock = summary.essayContext
    ? formatContextForPrompt(summary.essayContext)
    : '';

  // Pick which technique to teach (rotate through if multiple turns)
  const techniqueToTeach = summary.techniquesTaught && summary.techniquesTaught.length > 0
    ? getNextTechnique(summary.techniquesTaught)
    : 'pacing';

  return `You are a supportive, expert college admissions essay coach.

# YOUR CURRENT TASK: TEACH WRITING CRAFT

**Phase:** CRAFT (2 of 4)
**Goal:** Teach them ONE specific writing technique and get them to WRITE 1-2 sentences.

The student has already shared a specific moment. You do NOT need to ask for more details.
Your job now is to teach them HOW TO WRITE IT.

${essayContextBlock}

# WHAT WE'RE WORKING WITH

**Original Issue:**
"${sanitizedQuote}"

${summary.keyDetails && summary.keyDetails.length > 0 ? `**What they've shared:** ${summary.keyDetails.join(', ')}` : ''}
${summary.studentMoment ? `**Their moment:** ${summary.studentMoment}` : ''}

# THE WRITING TECHNIQUE: ${techniqueToTeach.toUpperCase()}

${getTechniqueInstructions(techniqueToTeach)}

# HOW TO TEACH THIS

1. **Name the technique:** "I want to teach you ${techniqueToTeach}."

2. **Explain why it works:** Brief, clear explanation (2-3 sentences max)

3. **Show an example NOT using their topic:**
   Give a before/after example from a completely different essay to illustrate the principle.
   This prevents them from copying your words.

4. **Prompt them to write:**
   "Now take your moment and write 1-2 sentences using this technique. Don't worry about perfect—just capture the moment using ${techniqueToTeach}."

# CRITICAL RULES

1. DO NOT write sentences using their specific topic/details
2. DO NOT keep asking for more backstory—they've given you a moment
3. DO NOT teach multiple techniques at once—pick ONE
4. DO provide a clear example from a DIFFERENT topic
5. DO end with a prompt to WRITE

## TECHNIQUES ALREADY TAUGHT
${summary.techniquesTaught && summary.techniquesTaught.length > 0
  ? `Already covered: ${summary.techniquesTaught.join(', ')}. Teach something NEW.`
  : 'No techniques taught yet. Start with pacing or sensory layering.'}

## SUCCESS CRITERIA

When they respond with actual written sentences (not just describing what they'll write):
→ Move to Phase 3 (ANALYZE) to give them feedback

**Response Length:** 200 words maximum. Teach one thing well.`;
}

/**
 * Build Phase 3 (ANALYZE) system prompt
 *
 * PURPOSE: Deep analysis of their draft writing
 * GOAL: Help them improve through specific, technique-based feedback
 * DON'T DO: Don't re-explain techniques from scratch, don't ask for more backstory
 */
function buildPhase3AnalyzePrompt(
  context: WorkshopModeContext,
  summary: ConversationSummary
): string {
  const { student_context, college_guidance } = context;

  // Get essay context for big-picture understanding
  const essayContextBlock = summary.essayContext
    ? formatContextForPrompt(summary.essayContext)
    : '';

  return `You are a supportive, expert college admissions essay coach.

# YOUR CURRENT TASK: ANALYZE THEIR WRITING

**Phase:** ANALYZE (3 of 4)
**Goal:** Give specific, actionable feedback on what they wrote.

The student has written draft content. Your job is to ANALYZE it thoughtfully.

${essayContextBlock}

# WHAT THEY WROTE

**Original Issue:** "${sanitizeEssayContent(student_context.quote)}"
${summary.studentDraft ? `\n**Their Draft:**\n"${summary.studentDraft}"` : ''}
${summary.techniquesTaught && summary.techniquesTaught.length > 0
  ? `\n**Techniques We've Covered:** ${summary.techniquesTaught.join(', ')}`
  : ''}

# HOW TO ANALYZE

## Step 1: Quote Their Exact Words
Show you read carefully by quoting specific phrases from their writing.

## Step 2: Celebrate What's Working (be specific)
NOT: "Good job!"
YES: "The phrase '[their exact words]' works because it [specific reason]."

## Step 3: Identify ONE Thing to Improve
Don't overwhelm them. Pick the single most impactful improvement.

## Step 4: Teach the Fix Through Technique
NOT: "Make it more specific"
YES: "Try the zoom-in technique: slow down this one moment. What happened in the 3 seconds before/after?"

## Step 5: Show Progression
"You went from [abstract claim] to [their new writing]. That's the shift we needed."

## Step 6: Prompt the Next Revision
"Take another pass focusing on [specific element]. I want to see [specific goal]."

# CRITICAL RULES

1. DO NOT give vague feedback like "make it better"
2. DO NOT introduce new backstory questions—focus on the writing
3. DO NOT rewrite it for them
4. DO quote their exact words
5. DO identify ONE improvement, not a list
6. DO explain HOW to fix it using a technique

${summary.feedbackGiven && summary.feedbackGiven.length > 0
  ? `## FEEDBACK ALREADY GIVEN\n${summary.feedbackGiven.join(', ')}\nDon't repeat yourself. Find something NEW to improve.`
  : ''}

## SUCCESS CRITERIA

When their writing is:
- Specific and grounded in a real moment
- Using strong techniques (sensory details, pacing, action)
- Authentic to their voice

→ Move to Phase 4 (POLISH) for final refinement

**Response Length:** 200 words maximum. Focused feedback.`;
}

/**
 * Build Phase 4 (POLISH) system prompt
 *
 * PURPOSE: Final sentence-level refinements
 * GOAL: Make it publication-ready
 * DON'T DO: Major structural changes, re-discovery
 */
function buildPhase4PolishPrompt(
  context: WorkshopModeContext,
  summary: ConversationSummary
): string {
  const { student_context, college_guidance } = context;

  // Get essay context for big-picture understanding
  const essayContextBlock = summary.essayContext
    ? formatContextForPrompt(summary.essayContext)
    : '';

  return `You are a supportive, expert college admissions essay coach.

# YOUR CURRENT TASK: FINAL POLISH

**Phase:** POLISH (4 of 4)
**Goal:** Sentence-level refinement. The content is strong—now make it shine.

${essayContextBlock}

# THEIR WRITING

"${summary.studentDraft || sanitizeEssayContent(student_context.quote)}"

${college_guidance ? `**${college_guidance.college_name} values:** ${college_guidance.emphasis}` : ''}

# POLISH TECHNIQUES

Focus on:
1. **Word Choice** - Is every word earning its place? Any weak verbs? Generic adjectives?
2. **Rhythm** - Read it aloud. Does it flow? Any awkward phrases?
3. **Precision** - Any vague words that could be more specific?
4. **Opening/Closing** - Does it start strong? End memorably?
5. **Authenticity Check** - Does this sound like THEM, not like an AI?

# HOW TO GIVE POLISH FEEDBACK

1. Read their draft holistically
2. Identify 1-2 sentence-level tweaks (not structural changes)
3. Explain WHY the tweak improves it
4. Affirm they now own strong writing

Example:
"The phrase 'walked quickly' could be sharper—try 'hurried' or better yet, show the hurry: 'my shoes squeaking on the tile.'"

# CRITICAL RULES

1. DO NOT make major structural changes—the content is solid
2. DO NOT reopen discovery questions
3. DO NOT rewrite whole sentences for them
4. DO focus on word-level and rhythm improvements
5. DO celebrate their journey from original to final

# COMPLETION

When the writing is:
- Authentic
- Specific
- Well-crafted at the sentence level
- Ready for their essay

→ Congratulate them! Show them the transformation from original to final.

**Response Length:** 150 words maximum. Light touch.`;
}

/**
 * Get technique-specific teaching instructions
 */
function getTechniqueInstructions(technique: string): string {
  const techniques: Record<string, string> = {
    'pacing': `**PACING** - Slow down the key moment

What it is: Taking a 2-second moment and stretching it across several sentences.

Why it works: When you slow time down, readers feel the weight of the moment.

Example (NOT their topic):
- Before: "I got the news and was shocked."
- After: "The email loaded. Subject line first. Then the first sentence. Then I stopped reading. I scrolled back up. Read it again. The words hadn't changed."

How to coach: "Slow this moment down. What happens second by second? What's happening in your body?"`,

    'sensory layering': `**SENSORY LAYERING** - Stack sight, sound, touch

What it is: Adding 2-3 sensory details that put the reader IN the scene.

Why it works: Sensory details activate the reader's brain like they're experiencing it.

Example (NOT their topic):
- Before: "The room was tense."
- After: "The fluorescent light buzzed. Someone's chair squeaked. I could smell the dry-erase marker from the whiteboard behind me."

How to coach: "What did you SEE first? Now add what you HEARD. Now what you FELT (temperature, texture, your own body)."`,

    'dialogue': `**DIALOGUE** - Let someone speak

What it is: Including actual words someone said (even just 3-5 words).

Why it works: Dialogue brings scenes alive instantly. One line of speech > paragraph of description.

Example (NOT their topic):
- Before: "My mom was worried about my decision."
- After: "My mom set down her coffee. 'Are you sure about this?' She wasn't really asking."

How to coach: "Can you remember ONE thing someone said in this moment? Even 3 words can change everything."`,

    'action beats': `**ACTION BEATS** - Show hands, eyes, movement

What it is: Describing small physical actions that reveal emotion without naming it.

Why it works: Actions show emotion more powerfully than stating "I felt nervous."

Example (NOT their topic):
- Before: "She was nervous during the interview."
- After: "She folded and unfolded the same corner of her resume. Twice. Three times."

How to coach: "What were your HANDS doing? What were your EYES looking at? Show me the movement."`,

    'sentence rhythm': `**SENTENCE RHYTHM** - Vary length for impact

What it is: Using short sentences for emphasis, longer ones for flow.

Why it works: Short sentences punch. Longer sentences carry the reader along until they land on something that—stops. Like that.

Example (NOT their topic):
- Before: "I realized that I had made a mistake and I felt terrible about it."
- After: "I realized what I'd done. The weight hit immediately. Not guilt—something heavier."

How to coach: "Where's the most important beat? Make that sentence SHORT. The others can breathe around it."`,

    'zoom in': `**ZOOM IN** - Microscope on 5 seconds

What it is: Taking ONE tiny moment and examining it in extreme close-up.

Why it works: Specific beats general. Always. A 5-second moment told well > a year summarized.

Example (NOT their topic):
- Before: "The concert was amazing and I'll never forget it."
- After: "The lights dropped. 40,000 phones went up. In the blue glow, my dad was crying. I'd never seen him cry at music before."

How to coach: "Pick the 5 seconds that mattered most. Now tell me ONLY those 5 seconds, in slow motion."`,
  };

  return techniques[technique] || techniques['pacing'];
}

/**
 * Get the next technique to teach based on what's already been covered
 */
function getNextTechnique(alreadyTaught: string[]): string {
  const order = ['pacing', 'sensory layering', 'dialogue', 'action beats', 'sentence rhythm', 'zoom in'];
  const taught = new Set(alreadyTaught.map(t => t.toLowerCase()));

  for (const technique of order) {
    if (!taught.has(technique)) {
      return technique;
    }
  }

  return 'pacing';  // Default if all taught
}

/**
 * Select the appropriate phase-specific prompt
 */
export function selectPhasePrompt(
  phase: WorkshopPhase,
  context: WorkshopModeContext,
  summary: ConversationSummary
): string {
  switch (phase) {
    case 'discover':
      return buildPhase1DiscoverPrompt(context, summary);
    case 'craft':
      return buildPhase2CraftPrompt(context, summary);
    case 'analyze':
      return buildPhase3AnalyzePrompt(context, summary);
    case 'polish':
      return buildPhase4PolishPrompt(context, summary);
    default:
      return buildPhase1DiscoverPrompt(context, summary);
  }
}

// ============================================================================
// LEGACY SYSTEM PROMPT (Kept for backwards compatibility)
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
  const { technique, universal_teaching, student_context, guardrails, available_techniques, college_guidance } = context;

  // SECURITY: Sanitize user-provided content to prevent prompt injection
  const sanitizedQuote = sanitizeEssayContent(student_context.quote);
  const sanitizedLocation = sanitizeChatMessage(student_context.location);
  const sanitizedProblem = sanitizeChatMessage(student_context.problem);
  const sanitizedCollege = student_context.college ? sanitizeChatMessage(student_context.college) : undefined;

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
${sanitizedQuote}

**Location:** ${sanitizedLocation}
${sanitizedCollege ? `**Target College:** ${sanitizedCollege}` : ''}
${college_guidance ? `
# COLLEGE-SPECIFIC GUIDANCE: ${college_guidance.college_name.toUpperCase()}

**What ${college_guidance.college_name} emphasizes:** ${college_guidance.emphasis}
**What they look for:** ${college_guidance.what_they_look_for}
**Specific tip:** ${college_guidance.tip}

Use this guidance to tailor your coaching. When appropriate, mention how the technique connects to what ${college_guidance.college_name} values.
` : ''}
${universal_teaching.common_mistakes && universal_teaching.common_mistakes.length > 0 ? `
# COMMON MISTAKES (Use ONLY when you observe them)

**IMPORTANT:** Do NOT warn about these preemptively. Only mention a mistake IF and WHEN you see the student actually making it in their writing. These are for reactive coaching, not preemptive warnings.

When you observe one of these patterns in their attempt, gently redirect:
${universal_teaching.common_mistakes.map((mistake, idx) => `${idx + 1}. ${mistake}`).join('\n')}
` : ''}
${available_techniques.length > 1 ? `
# ALTERNATIVE APPROACHES

If the primary technique isn't clicking for this student, you can pivot to one of these:
${available_techniques.slice(1, 3).map(t => `- **${t.name}** (${t.difficulty}): ${t.description}`).join('\n')}
` : ''}
# YOUR COACHING APPROACH

## Phase 1: TEACH (First interaction)
- Explain the PRINCIPLE behind ${technique.technique_name}
- Show WHY their current text isn't working (specifically)
- Use the examples to ILLUSTRATE the principle (not as templates)
- Ask them guiding questions to surface THEIR specific memories/details
- **End by asking them to WRITE a new version themselves**

## Phase 2: CRAFT (Once they share a specific moment)
**CRITICAL:** Once they give you specific details, STOP asking for more details. Move to teaching CRAFT.

When they share specific details or a memory:
- **Acknowledge the progress:** "This is exactly what we needed - a real moment we can work with."
- **Teach a WRITING TECHNIQUE:** Don't just say "add more details." Teach them HOW to write it:
  - **Pacing:** "Slow this moment down. What happens second by second?"
  - **Sensory layering:** "Start with what you SAW, then add what you HEARD or FELT."
  - **Sentence rhythm:** "Short sentences create tension. Try: 'The number flashed. Red. Three times the limit.'"
  - **Dialogue:** "Can you include one line someone said? Even 3 words can bring a scene alive."
  - **Action beats:** "What were your hands doing? Show the moment through movement."
- **Give a concrete example of the TECHNIQUE** (not using their topic):
  - "Watch how pacing works: 'The email loaded. Subject line first. Then the first sentence. Then I stopped breathing.'"
  - "See how action beats work: 'She said it was fine. Her hands said otherwise, folding the same napkin corner over and over.'"
- **Prompt them to apply the technique:** "Now try writing your moment using this technique."

## Phase 3: ANALYZE (After they write a draft)
When they share actual writing:
- **Quote exactly what they wrote** (shows you're reading carefully)
- **Celebrate specific wins:** "This line works because..." (be specific about WHY)
- **Identify ONE thing to improve** (not a list - focus matters)
- **Teach the fix through a TECHNIQUE, not just 'make it better':**
  - Instead of: "Add more sensory details"
  - Say: "Try the 'zoom in' technique - pick the most charged moment and describe it in slow motion"
- **Show them the progression:** "You went from claiming passion to showing me a real moment. That's major progress."

## Phase 4: POLISH (Final refinement)
Once the core content is strong:
- Sentence-level craft: word choice, rhythm, precision
- Opening/closing strength
- Connection to the rest of their essay
- Final read-through for authenticity check

## PROGRESS INDICATORS - Use these to know when to advance:

**Still in Phase 1 if:** They're giving abstract claims or summaries ("I've always loved...")
**Ready for Phase 2 if:** They've given you a SPECIFIC moment with concrete details
**Ready for Phase 3 if:** They've written actual sentences (not just described what they might write)
**Ready for Phase 4 if:** The content is authentic and specific, just needs polish

## DON'T GET STUCK IN A LOOP

**If you've asked for details twice and they've given you something, MOVE ON.**
- Don't keep asking "can you be more specific?" if they've given you a moment
- Teach them how to WRITE what they've given you
- Progress the conversation even if their details aren't perfect

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

# RESPONSE STRUCTURE BY PHASE

**Phase 1 Response (Teaching - First interaction):**
1. Explain the technique principle clearly
2. Show why their current text needs work
3. Ask 2-3 discovery questions about THEIR experience
4. End with a prompt to share a specific moment

**Phase 2 Response (Craft - After they share a moment):**
1. Acknowledge the progress: "Now we have something to work with."
2. Teach ONE specific writing technique (pacing, sensory layering, dialogue, action beats)
3. Show a quick example of the technique (not using their topic)
4. Prompt them to write 1-2 sentences using the technique

**Phase 3 Response (Analyze - After they write):**
1. Quote their exact words
2. Celebrate what's working and WHY it works
3. Identify ONE improvement area
4. Teach them the technique to fix it (don't just say "make it better")
5. Show their progression: "You went from X to Y - that's the shift we needed."

**Phase 4 Response (Polish - Final refinement):**
1. Read their draft holistically
2. Focus on sentence-level craft: word choice, rhythm
3. Suggest final tweaks
4. Affirm they now own a strong piece of writing

**Response Length:** ${guardrails.max_response_length} words maximum

Remember: Your job is to make them a BETTER WRITER, not to write for them. Every essay should be authentically theirs.`;
}

// ============================================================================
// WORKSHOP CHAT MODE SERVICE
// ============================================================================

export class WorkshopChatModeService {
  static readonly MODE_VERSION = '1.0.0';

  // Citation services for research-backed credibility
  private citationAttacher: CitationAttacher;
  private citationTriggerDetector: CitationTriggerDetector;

  constructor() {
    this.citationAttacher = new CitationAttacher();
    this.citationTriggerDetector = new CitationTriggerDetector();
  }

  /**
   * Attach citations to workshop response content
   *
   * Uses the citation system to:
   * 1. Detect triggers in the response (research claims, technique explanations)
   * 2. Select appropriate sources (college-specific or universal)
   * 3. Insert superscript markers and prepare display data
   */
  private attachCitationsToContent(
    content: string,
    context: {
      college_id?: string;
      issue_type: string;
    }
  ): { content: string; citations: Record<number, CitationDisplayData> } {
    // Detect citation triggers in the content
    const triggers = this.citationTriggerDetector.detectTriggers(
      { problem: content, why_matters: '', how_to_fix: '' },
      {
        college_id: context.college_id || 'unknown',
        essay_type: 'personal_statement',
        issue_type: context.issue_type,
      }
    );

    // If no triggers found, return original content
    if (triggers.length === 0) {
      return { content, citations: {} };
    }

    // Attach citations using the diverse source orchestrator
    const result = this.citationAttacher.attachCitations(
      { problem: content, why_matters: '', how_to_fix: '' },
      triggers,
      {
        college_id: context.college_id || 'unknown',
        essay_type: 'personal_statement',
        issue_type: context.issue_type,
        severity: 'major',
      }
    );

    return {
      content: result.problem, // Content with superscripts
      citations: result.citations,
    };
  }

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

    // Get primary technique (first one)
    const primaryTechnique = teaching.techniques[0];

    // Build the workshop context
    return {
      mode: 'workshop',
      mode_version: WorkshopChatModeService.MODE_VERSION,

      technique: {
        issue_type: issueType,
        technique_name: primaryTechnique?.name || 'Writing Improvement',
        difficulty: primaryTechnique?.difficulty || 'intermediate',
        estimated_time: this.estimateTime(primaryTechnique?.difficulty || 'intermediate'),
      },

      // NEW: Surface ALL available techniques
      available_techniques: teaching.techniques.map(t => ({
        name: t.name,
        description: t.description,
        difficulty: t.difficulty === 'simple' ? 'beginner' : t.difficulty === 'advanced' ? 'advanced' : 'intermediate',
        steps: t.steps,
        common_mistakes: t.common_mistakes,
      })),

      universal_teaching: {
        why_headline: teaching.why_section.summary,
        why_explanation: teaching.why_section.research_insight,
        // FIX: supporting_quotes is string[], extract quote from source_backing instead
        admissions_insight: primaryTechnique?.source_backing?.quote,
        admissions_source: primaryTechnique?.source_backing?.author,

        // FIX: TechniqueBundle.steps is string[], not objects with title/description
        // Map string steps to the expected format with common mistakes from the technique
        steps: primaryTechnique?.steps.map((step, idx) => ({
          step_number: idx + 1,
          name: `Step ${idx + 1}`,
          instruction: step, // step IS the instruction string
          tip: undefined,
          common_mistake: primaryTechnique?.common_mistakes[idx],
        })) || [],

        examples: teaching.transformations.map(t => ({
          before: t.before,
          after: t.after,
          principle: t.principle_applied, // FIX: correct property name
          why_it_works: t.why_it_works,   // FIX: correct property name
        })),

        sources: teaching.why_section.sources,

        // NEW: Surface common mistakes from primary technique
        common_mistakes: primaryTechnique?.common_mistakes,
      },

      // NEW: Include college-specific guidance when available
      college_guidance: collegeGuidance ? {
        college_name: collegeName!,
        emphasis: collegeGuidance.emphasis,
        what_they_look_for: collegeGuidance.what_to_emphasize,
        tip: collegeGuidance.specific_advice,
      } : undefined,

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
   * Send message in workshop mode using DECISION TREE ARCHITECTURE
   *
   * This uses phase-specific prompts instead of one monolithic prompt.
   * Each phase has its own focused prompt optimized for that task:
   * - DISCOVER: Help student find a specific moment
   * - CRAFT: Teach writing techniques
   * - ANALYZE: Give feedback on their draft
   * - POLISH: Final sentence-level refinements
   */
  async sendWorkshopMessage(request: WorkshopChatRequest): Promise<WorkshopChatResponse> {
    const { userMessage, context, conversationHistory = [] } = request;

    // SECURITY: Sanitize user message to prevent prompt injection
    const sanitizedUserMessage = sanitizeChatMessage(userMessage);

    // =====================================================================
    // DECISION TREE: Detect current phase based on conversation history
    // =====================================================================
    const phaseResult = detectWorkshopPhase(conversationHistory, context.student_context.quote);
    console.log(`[WorkshopChatMode] Phase detected: ${phaseResult.phase} (${phaseResult.confidence}) - ${phaseResult.reasoning}`);

    // Summarize conversation for phase-specific context
    // Pass context to build/accumulate essay context across turns
    const summary = summarizeConversation(conversationHistory, phaseResult, context);

    // Log essay context info
    if (summary.essayContext) {
      console.log(`[WorkshopChatMode] Section role: ${summary.essayContext.section_role} - ${summary.essayContext.section_purpose.headline}`);
    }

    // Select the phase-specific prompt (focused, not monolithic)
    const systemPrompt = selectPhasePrompt(phaseResult.phase, context, summary);

    // =====================================================================
    // Build user prompt - simplified since system prompt is now focused
    // =====================================================================

    // Include recent conversation (last 2-3 turns only for context)
    const recentHistory = conversationHistory.slice(-4);
    const historyText = recentHistory.length > 0
      ? recentHistory.map(msg =>
          `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.role === 'user' ? sanitizeChatMessage(msg.content) : msg.content}`
        ).join('\n\n')
      : '';

    // Build user prompt - simpler since system prompt handles the detail
    const userPrompt = `${historyText ? `## Recent Conversation\n${historyText}\n\n` : ''}## Student's Current Message
${sanitizedUserMessage}

## Your Response (${phaseResult.phase.toUpperCase()} phase)
Respond according to your current task. Stay focused on this phase.`;

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

      // =====================================================================
      // Map phase to step number for progress tracking
      // =====================================================================
      const phaseToStep: Record<WorkshopPhase, number> = {
        'discover': 1,
        'craft': 2,
        'analyze': 3,
        'polish': 4,
      };
      const currentStep = phaseToStep[phaseResult.phase];

      // Attach citations for research-backed credibility
      const citedContent = this.attachCitationsToContent(response.content, {
        college_id: context.student_context.college,
        issue_type: context.technique.issue_type,
      });

      const assistantMessage: WorkshopChatMessage = {
        role: 'assistant',
        content: citedContent.content,
        timestamp: Date.now(),
        mode: 'workshop',
        technique_step: currentStep,
        citations: Object.keys(citedContent.citations).length > 0
          ? citedContent.citations
          : undefined,
      };

      // Estimate cost (Sonnet pricing)
      const inputCost = response.usage.input_tokens * 0.003 / 1000;
      const outputCost = response.usage.output_tokens * 0.015 / 1000;

      // Generate phase-aware suggested next step
      const suggestedNextStep = this.getPhaseAwareSuggestedNextStep(phaseResult.phase, summary);

      return {
        message: assistantMessage,
        suggested_next_step: suggestedNextStep,
        progress: {
          current_step: currentStep,
          total_steps: 4,  // 4 phases: discover, craft, analyze, polish
          technique_complete: phaseResult.phase === 'polish',
          // NEW: Include phase info for frontend
          current_phase: phaseResult.phase,
          phase_confidence: phaseResult.confidence,
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
          content: `I'm having trouble connecting right now. Let's try again in a moment.`,
          timestamp: Date.now(),
          mode: 'workshop',
        },
        progress: {
          current_step: 1,
          total_steps: 4,
          technique_complete: false,
          current_phase: 'discover' as WorkshopPhase,
          phase_confidence: 'high' as const,
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
   * Get phase-aware suggested next step
   */
  private getPhaseAwareSuggestedNextStep(phase: WorkshopPhase, summary: ConversationSummary): string {
    switch (phase) {
      case 'discover':
        if (summary.turnCount >= 2) {
          return "Share any specific moment that comes to mind—even if it feels small. We can work with it.";
        }
        return "Think about a real moment when this quality was visible. What were you doing?";
      case 'craft':
        if (summary.techniquesTaught && summary.techniquesTaught.length > 0) {
          return `Try writing 1-2 sentences using ${summary.techniquesTaught[summary.techniquesTaught.length - 1]}. Don't aim for perfect.`;
        }
        return "Ready to try writing your moment? Give it a shot—even a rough version helps.";
      case 'analyze':
        return "Take another pass with the feedback in mind. I'll give you fresh notes.";
      case 'polish':
        return "Almost there! Any final tweaks you want to make before we wrap up?";
      default:
        return "What would you like to work on next?";
    }
  }

  /**
   * Get welcome message for workshop mode
   *
   * Strong hook → compelling insight → draw them into the process
   */
  getWelcomeMessage(context: WorkshopModeContext): WorkshopChatMessage {
    const { technique, universal_teaching, student_context, college_guidance } = context;

    // Generate issue-type-specific welcome message
    const content = this.generateIssueSpecificWelcome(
      technique.issue_type,
      student_context.quote,
      student_context.problem,
      college_guidance,
      universal_teaching
    );

    // Attach citations for research-backed credibility
    const citedContent = this.attachCitationsToContent(content, {
      college_id: student_context.college,
      issue_type: technique.issue_type,
    });

    return {
      role: 'assistant',
      content: citedContent.content,
      timestamp: Date.now(),
      mode: 'workshop',
      technique_step: 0,
      citations: Object.keys(citedContent.citations).length > 0
        ? citedContent.citations
        : undefined,
    };
  }

  /**
   * Generate issue-type-specific welcome message
   *
   * Each issue type has a different coaching approach:
   * - Storytelling issues (telling_not_showing): Find a specific moment
   * - Research issues (generic_why_us): Connect interests to school resources
   * - Structural issues (chronological_trudge): Reorder existing content
   * - Voice issues (cliche_language): Find authentic expression
   */
  private generateIssueSpecificWelcome(
    issueType: IssueType,
    quote: string,
    problem: string,
    collegeGuidance: WorkshopModeContext['college_guidance'],
    universalTeaching: WorkshopModeContext['universal_teaching']
  ): string {
    const truncatedQuote = quote.substring(0, 150) + (quote.length > 150 ? '...' : '');

    // Issue-type-specific welcome messages
    switch (issueType) {
      // ============================================
      // STORYTELLING ISSUES - Find a specific moment
      // ============================================
      case 'telling_not_showing':
        return this.buildWelcomeContent({
          hook: `**Real talk:** Admissions officers can smell this type of sentence from a mile away—and not in a good way.`,
          quote: truncatedQuote,
          explanation: `Here's what's actually happening: This sentence is doing the opposite of what you need. Instead of making an admissions officer *feel* something about you, it's asking them to take your word for it. And after reading their 500th essay that day, they're not in a trusting mood.

The interesting part? You almost certainly have a moment that proves this claim—a scene where someone could actually *see* this quality in you. That's the gold we need to find.`,
          whatMakesItTricky: `Your brain wants to summarize ("I'm passionate about learning"). But summaries are forgettable. What sticks is the weird specific moment—the time you chose to do something that revealed who you are without you having to explain it.`,
          example: {
            bad: `"I love astronomy"`,
            good: `"I spent every lunch period in 8th grade reading the same Hawking book while my friends ate without me"`,
            why: `The second one makes you *see* the person.`
          },
          closingQuestion: `Think back to a real moment when this quality was visible—not because you said it, but because of what you were *doing*. Don't worry about making it sound good yet. Just tell me: where were you, and what was happening?`,
          collegeGuidance,
          universalTeaching
        });

      // ============================================
      // RESEARCH ISSUES - Connect to specific resources
      // ============================================
      case 'generic_why_us':
        const collegeName = collegeGuidance?.college_name || 'this school';
        return this.buildWelcomeContent({
          hook: `**Here's the thing nobody tells you:** This sentence is actually working against you.`,
          quote: truncatedQuote,
          explanation: `Here's the problem: This could describe any top school. Try the "swap test"—if you can replace ${collegeName} with any other university name and the sentence still works, it's too generic.

Admissions officers read this and think: "They didn't actually research us. They're just flattering us." And that's not the vibe you want.`,
          whatMakesItTricky: `You DO like ${collegeName}. The prestige IS real. But every applicant knows about the rankings. What admissions officers want to see is: What specific thing at ${collegeName} connects to YOUR specific intellectual question?`,
          example: {
            bad: `"I want to attend ${collegeName} because of its prestigious reputation"`,
            good: `"Professor [Name]'s research on [specific topic] directly addresses the question I've been wrestling with since [your experience]"`,
            why: `The second shows you did real research AND have a genuine intellectual reason to be there.`
          },
          closingQuestion: `Let's start here: What's a question or topic you've been genuinely curious about? Not what sounds impressive—what actually keeps you thinking?`,
          collegeGuidance,
          universalTeaching
        });

      case 'generic_why_major':
        return this.buildWelcomeContent({
          hook: `**Let's be honest:** This reads like every other "why this major" essay.`,
          quote: truncatedQuote,
          explanation: `The problem isn't that you're not interested in this major—it's that you're describing the major instead of describing YOUR relationship to it. Admissions officers want to see the specific intellectual journey that led you here.`,
          whatMakesItTricky: `It feels natural to explain why the field is important. But they already know why it's important—they work there! What they don't know is YOUR story with this subject.`,
          example: {
            bad: `"Computer science is the future and I want to be part of it"`,
            good: `"When my app crashed for the 47th time, I realized I was more interested in WHY it crashed than in getting it to work"`,
            why: `The second shows genuine intellectual curiosity, not just career interest.`
          },
          closingQuestion: `What's a specific moment when this subject grabbed your attention? Not when you decided to study it—when it actually made you curious?`,
          collegeGuidance,
          universalTeaching
        });

      // ============================================
      // STRUCTURAL ISSUES - Reorder, don't add
      // ============================================
      case 'chronological_trudge':
      case 'weak_opening':
        return this.buildWelcomeContent({
          hook: `**Here's what's happening:** You're starting at the beginning. But the beginning isn't always the best place to start.`,
          quote: truncatedQuote,
          explanation: `You're telling your story in chronological order—which makes sense, because that's how it happened. But here's the thing: chronological order isn't the same as compelling order.

Right now, you're making the reader wait for the interesting part. And admissions officers don't have time to wait.`,
          whatMakesItTricky: `It feels wrong to start "in the middle." But the best stories often do. Think about movies—they rarely start with the character being born. They start at a moment of tension, then fill in the backstory.`,
          example: {
            bad: `"When I was six, I started piano. By ten, I was competing. At fourteen, I won regionals."`,
            good: `"My hands wouldn't stop shaking. In three minutes, I'd walk onto the stage in front of four hundred people."`,
            why: `The second drops you into the tension. NOW you want to know what happens—and how they got there.`
          },
          closingQuestion: `Think about your story: What's the most intense, interesting, or pivotal moment? That might be where we should actually START.`,
          collegeGuidance,
          universalTeaching
        });

      case 'weak_ending':
        return this.buildWelcomeContent({
          hook: `**Let's talk about endings:** Yours is fading out when it should be landing.`,
          quote: truncatedQuote,
          explanation: `Your ending is doing one of two things: either trailing off into vague "I learned..." language, or trying to wrap everything up too neatly. Neither leaves a lasting impression.

The best endings echo back to the beginning, or leave the reader with something unexpected to think about.`,
          whatMakesItTricky: `It's tempting to summarize what you learned or state your thesis again. But that's what you do in academic writing. Personal essays need a different kind of ending—one that resonates emotionally.`,
          example: {
            bad: `"This experience taught me the importance of perseverance and I will carry these lessons with me."`,
            good: `"Now when my hands shake before a performance, I remember: that's not fear. That's my body knowing this matters."`,
            why: `The second connects back to a specific image and reframes it. It lands.`
          },
          closingQuestion: `What image, moment, or detail from your essay could we return to at the end—but with new meaning?`,
          collegeGuidance,
          universalTeaching
        });

      // ============================================
      // VOICE ISSUES - Find authentic expression
      // ============================================
      case 'cliche_language':
      case 'cliche_ai_convergence':
      case 'cliche_inspirational':
        return this.buildWelcomeContent({
          hook: `**I'm going to be honest with you:** This reads like something an AI would write. And that's a problem.`,
          quote: truncatedQuote,
          explanation: `Here's the thing about clichés and generic phrasing: they're comfortable because everyone uses them. But that's exactly why they don't work. When admissions officers read "from a young age" or "I've always been passionate about," their eyes glaze over.

Your real voice—the way you actually think and talk—is more interesting than any polished phrase you think sounds "essay-like."`,
          whatMakesItTricky: `You've been trained to write formally. You think "essay voice" should sound a certain way. But the best college essays sound like a smart person talking, not a thesaurus exploding.`,
          example: {
            bad: `"From a young age, I have always been fascinated by the stars"`,
            good: `"My dad woke me up at 3am to see a meteor shower. We sat on the roof with hot chocolate. I was cold but didn't want to go inside."`,
            why: `The second is specific, sensory, and sounds like a real person. That's your voice.`
          },
          closingQuestion: `Forget how you think this should sound. If you were telling a friend about this, what would you actually say?`,
          collegeGuidance,
          universalTeaching
        });

      // ============================================
      // DEPTH ISSUES - Go deeper, not broader
      // ============================================
      case 'shallow_reflection':
      case 'premature_resolution':
      case 'false_epiphany':
        return this.buildWelcomeContent({
          hook: `**Here's what I'm noticing:** You're wrapping things up before you've really dug in.`,
          quote: truncatedQuote,
          explanation: `Your reflection is landing too quickly on a clean lesson. Real growth is messier than that. When you write "I learned that..." you're often skipping over the interesting part—the confusion, the doubt, the process of figuring it out.

Admissions officers are more interested in how you think than in what you concluded.`,
          whatMakesItTricky: `You want to show growth, so you jump to the "after." But the most interesting part is usually the "during"—when you didn't know what to do, when you were wrong, when things were complicated.`,
          example: {
            bad: `"I realized that failure is just another opportunity to learn"`,
            good: `"Three weeks after I failed, I still didn't know what I'd learned. Honestly, I'm still not sure I learned anything—except that I kept showing up anyway."`,
            why: `The second is honest and specific. It shows actual thinking, not a bumper sticker.`
          },
          closingQuestion: `What's something about this experience you still don't fully understand? Or something that was more complicated than your essay currently shows?`,
          collegeGuidance,
          universalTeaching
        });

      // ============================================
      // DEFAULT - Flexible approach
      // ============================================
      default:
        return this.buildWelcomeContent({
          hook: `**Let's work on this together.** I can see what you're trying to do, and I think we can make it stronger.`,
          quote: truncatedQuote,
          explanation: `Here's what I'm noticing: ${problem}

This is fixable. Let's figure out together what's underneath this sentence—the real experience or idea you're trying to convey.`,
          whatMakesItTricky: `Sometimes the first way we express something isn't the most powerful way. That's not a failure—it's just part of writing.`,
          example: {
            bad: `The generic version`,
            good: `The specific, personal version`,
            why: `Specificity and authenticity always beat polished generalities.`
          },
          closingQuestion: `What were you actually trying to say here? Don't worry about making it sound good—just tell me what you meant.`,
          collegeGuidance,
          universalTeaching
        });
    }
  }

  /**
   * Build welcome content from structured parts
   */
  private buildWelcomeContent(parts: {
    hook: string;
    quote: string;
    explanation: string;
    whatMakesItTricky: string;
    example: { bad: string; good: string; why: string };
    closingQuestion: string;
    collegeGuidance?: WorkshopModeContext['college_guidance'];
    universalTeaching: WorkshopModeContext['universal_teaching'];
  }): string {
    let content = `${parts.hook}

"${parts.quote}"

${parts.explanation}

**What makes this tricky:** ${parts.whatMakesItTricky}`;

    // Add college insight if available and defined
    if (parts.collegeGuidance?.emphasis && parts.collegeGuidance?.tip) {
      content += `\n\n**${parts.collegeGuidance.college_name} insight:** ${parts.collegeGuidance.emphasis} ${parts.collegeGuidance.tip}`;
    }

    // Add research insight if available
    if (parts.universalTeaching.admissions_insight) {
      content += `\n\n*"${parts.universalTeaching.admissions_insight}"*${parts.universalTeaching.admissions_source ? ` — ${parts.universalTeaching.admissions_source}` : ''}`;
    }

    content += `

Think about it: Which is more memorable?
- ${parts.example.bad}
- ${parts.example.good}

${parts.example.why} That's what we're going for.

**So here's my question:** ${parts.closingQuestion}`;

    return content;
  }

  /**
   * Generate a dynamic, attention-grabbing hook based on the issue
   * @deprecated Use generateIssueSpecificWelcome instead
   */
  private generateDynamicHook(problem: string, _quote: string): string {
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
    // SECURITY: Sanitize user message to prevent prompt injection
    const sanitizedUserMessage = sanitizeChatMessage(userMessage);

    // Build suggestion-specific system prompt
    const systemPrompt = this.buildSuggestionSystemPrompt(context);

    // Format conversation history with sanitization
    const historyText = conversationHistory.length > 0
      ? conversationHistory.map(msg =>
          `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.role === 'user' ? sanitizeChatMessage(msg.content) : msg.content}`
        ).join('\n\n')
      : '';

    // Build user prompt with sanitized content
    const userPrompt = `${historyText ? `## Previous Conversation\n${historyText}\n\n` : ''}## Student's Question
${sanitizedUserMessage}

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

      // Attach citations for research-backed credibility
      const citedContent = this.attachCitationsToContent(response.content, {
        college_id: context.student_context.college,
        issue_type: context.issue.problem_summary,
      });

      const assistantMessage: WorkshopChatMessage = {
        role: 'assistant',
        content: citedContent.content,
        timestamp: Date.now(),
        mode: 'workshop_suggestion',
        citations: Object.keys(citedContent.citations).length > 0
          ? citedContent.citations
          : undefined,
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

    // Section 1: Diagnosis - what's happening and why it matters
    content += `**The issue:** ${issue.diagnosis}\n\n`;

    // Section 2: The path forward - ADAPTIVE based on issue type (now research-backed)
    const fixApproach = this.getFixApproachForIssueType(issue.problem_summary);
    content += `**How we'll fix this:** ${fixApproach.description}\n\n`;

    // Add research insight if available (makes the coaching feel more credible)
    if (fixApproach.researchContext?.keyFinding) {
      content += `*Research insight:* ${fixApproach.researchContext.keyFinding}\n\n`;
    }

    content += `**Our approach:**\n`;
    content += `1. I'll show you two example revisions so you can see the technique in action\n`;
    content += `2. ${fixApproach.step2}\n`;
    content += `3. You'll write your version, and I'll give you specific feedback\n`;
    content += `4. We'll refine it together until it's strong\n\n`;

    if (suggestions.polished_original && suggestions.voice_amplifier) {
      content += `---\n\n`;

      // Section 3: Example suggestions with context
      content += `**Example revisions** (generated specifically for your text—not templates to copy):\n\n`;

      content += `**Version A** (clean and direct):\n`;
      content += `"${suggestions.polished_original.text}"\n\n`;
      content += `*Why this works:* ${suggestions.polished_original.rationale}\n\n`;

      content += `**Version B** (more personality, more risk):\n`;
      content += `"${suggestions.voice_amplifier.text}"\n\n`;
      content += `*Why this works:* ${suggestions.voice_amplifier.rationale}\n\n`;

      content += `---\n\n`;

      // Section 4: Key principles - ADAPTIVE to issue type
      content += `**The principles at work:**\n`;
      fixApproach.principles.forEach((principle: string) => {
        content += `- ${principle}\n`;
      });
      content += `\n`;

      // Section 5: Transition to their work
      content += `**Important:** These examples show the *direction*, but your final version needs to come from YOUR actual experience. Don't copy these—use them to understand the technique, then write your own.\n\n`;

      content += `Whenever you're ready to write—even a rough attempt—share it. I'll give you specific feedback on what's working and what to strengthen.\n\n`;

      content += `**Let's start:** ${fixApproach.startingQuestion}`;
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

    // Attach citations for research-backed credibility
    const citedContent = this.attachCitationsToContent(content, {
      college_id: context.student_context.college,
      issue_type: issue.problem_summary,
    });

    return {
      role: 'assistant',
      content: citedContent.content,
      timestamp: Date.now(),
      mode: 'workshop_suggestion',
      citations: Object.keys(citedContent.citations).length > 0
        ? citedContent.citations
        : undefined,
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

    // SECURITY: Sanitize all user-provided content
    const sanitizedQuote = sanitizeEssayContent(issue.original_quote);
    const sanitizedLocation = sanitizeChatMessage(issue.location);
    const sanitizedProblem = sanitizeChatMessage(issue.problem_summary);
    const sanitizedDiagnosis = sanitizeChatMessage(issue.diagnosis);
    const sanitizedCollege = student_context.college ? sanitizeChatMessage(student_context.college) : undefined;

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
${sanitizedQuote}

**Location in Essay:** ${sanitizedLocation}

**The Problem:**
${sanitizedProblem}

**Why This Matters:**
${sanitizedDiagnosis}
${sanitizedCollege ? `\n**Target College:** ${sanitizedCollege}` : ''}

# RESEARCH-BACKED TEACHING CONTEXT
${this.getResearchContextForPrompt(sanitizedProblem)}

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

# IMPROVEMENT PATHS: HOW TO STRENGTHEN THEIR WRITING

Students won't immediately know how to turn insights into strong sentences. They need multiple paths and concrete techniques. Share these as relevant:

## PATH 1: From Abstract Claim → Concrete Scene
**The problem:** "I'm passionate about helping others"
**The technique:** Ground abstract qualities in observable action
**Example transformation:**
- BEFORE: "I love helping people and making a difference"
- AFTER: "Every Tuesday I wheel Mrs. Chen's trash cans to the curb—her arthritis flares up on cold mornings, and she always waves from the window"

**Why it works:** The reader can SEE you helping. The specific details (Tuesday, Mrs. Chen, trash cans, arthritis, cold mornings, waving) create a complete scene that proves the claim without stating it.

**Coach the technique:** "What's a specific moment when someone could have SEEN you doing this? Who was there? What physical actions were you taking?"

## PATH 2: From Telling Emotion → Showing Through Body/Action
**The problem:** "I felt so nervous and scared"
**The technique:** Replace named emotions with physical sensations and behaviors
**Example transformation:**
- BEFORE: "I was terrified before my audition"
- AFTER: "My hands shook so badly I had to set down my sheet music. I counted the ceiling tiles—seventeen—waiting for them to call my name"

**Why it works:** We FEEL the nervousness through physical details. The counting ceiling tiles shows a coping mechanism that reveals character.

**Coach the technique:** "What was your body doing in that moment? What did you see/hear/touch? What small thing did you do to cope?"

## PATH 3: From Summary → Zoomed-In Moment
**The problem:** "Throughout high school I developed my leadership skills"
**The technique:** Pick ONE specific 5-minute window and expand it
**Example transformation:**
- BEFORE: "I learned to lead through my experience as team captain"
- AFTER: "Our setter was crying in the locker room, and everyone else had already left. I sat next to her on the bench—not saying anything at first, just tying and retying my shoelaces until she was ready to talk"

**Why it works:** One authentic 30-second moment reveals more about leadership than four years of claiming it.

**Coach the technique:** "If I were making a movie of your life, what's ONE 5-minute scene that would show this quality? Describe it like you're seeing it happen."

## PATH 4: From Cliché → Authentic Voice
**The problem:** "It taught me that hard work pays off"
**The technique:** Find what YOU specifically learned—not what anyone would learn
**Example transformation:**
- BEFORE: "This experience taught me the value of perseverance"
- AFTER: "I learned that I'm the kind of person who reorganizes her notes at 2am instead of admitting she doesn't understand something. That's not perseverance—that's stubbornness with a highlighter"

**Why it works:** Self-aware insight + specific authentic detail + slight humor = memorable. This could only be written by ONE person.

**Coach the technique:** "That's a universal lesson anyone could claim. What's the honest, slightly embarrassing truth about what YOU specifically learned about yourself?"

## PATH 5: Balancing Story + Insight
**The problem:** Either all storytelling (no meaning) OR all insight (no scene)
**The technique:** Ground insight in the specific moment; let insight emerge from action
**The structure:**
1. Scene with sensory details (2-3 sentences)
2. Micro-moment of realization (1 sentence)
3. What you understood that you didn't before (1 sentence)

**Example:**
- SCENE: "My mom gripping my hand, the doctor's mouth moving, and me—searching for the Vietnamese word for 'benign' before her grip got tighter"
- MOMENT: "When I finally found it, she laughed—not because it was funny, but because she could finally breathe"
- INSIGHT: "I realized I'd been holding my breath too" OR "I understood then that translation isn't just about words—it's about carrying someone's fear until you can release it together"

**CRITICAL:** Insights must be EARNED through the scene. A generic insight ("I learned to communicate") doesn't work. A specific insight grounded in the specific moment ("I learned that some words carry weight you can't find in dictionaries") resonates because only THIS person in THIS moment could have learned it.

**Coach the technique:** "Your storytelling is strong—I can see the scene. Now help me understand: what did THIS specific moment teach you that you couldn't have learned any other way?"

## HANDLING COMMON SITUATIONS

**If they ask "Can I just use Example A/B?"**
"I understand the temptation—those examples are good! But here's the thing: if you use them with just your details swapped in, your essay will sound like everyone else who does the same thing. Admissions officers read thousands of essays and can spot templates instantly. Let's find YOUR moment instead. What's a time when [quality they're trying to show] was visible in your life?"

**If they give a thin/generic response:**
"That's a starting point, but right now it could be anyone's story. What's the detail that makes it specifically YOURS? The thing you'd remember that no one else would know?"

**If they seem stuck:**
"Let's try a different angle. Forget the 'perfect' moment. What's a tiny moment—a single afternoon, a specific conversation, even a random Tuesday? Sometimes the small moments are more powerful than the big ones."

**When they share their attempt (THIS IS THE MOST IMPORTANT MOMENT):**
The student trusted you enough to write. Honor that with deep, specific analysis.

1. **Quote their exact words** - Show you read every word carefully
2. **Celebrate what's WORKING with specificity:**
   - "The phrase '[their exact words]' is powerful because it [specific reason]"
   - "This detail makes the scene vivid because [why it works]"
   - "The rhythm of this sentence creates [effect] which draws readers in"
3. **Identify growth opportunities with depth:**
   - Don't just say "this is abstract" - explain WHAT makes it abstract
   - Show them the specific gap: "Right now I can see [X] but I'm missing [Y]"
   - Connect it to what admissions officers are looking for
4. **Provide a concrete path forward:**
   - Give ONE specific technique to try: "Add [specific element] right after [their phrase]"
   - Show an example of what you mean (but don't write it FOR them)
   - Explain WHY this change will strengthen the impact
5. **Invite the next iteration:**
   - "Take another pass with that in mind"
   - "I'm curious to see how you'll solve this—write it out and I'll give you fresh feedback"

**CRITICAL:** Students may need 3-5 revisions to get it right. Each revision should build on the last. Never rush them to the finish—the learning happens in the revising.

**NEVER REPEAT YOURSELF:** If you gave feedback in a previous turn, do NOT give the same feedback again. Track what you've already said and BUILD on it. Each turn should introduce NEW insight, not rehash old points. If you already suggested a refinement (like word choice), mark it as addressed and move to the NEXT priority.

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
   * Get fix approach based on issue type - uses research-backed technique selector
   *
   * This method now leverages the deep research database to provide:
   * - Research-backed principles and approaches
   * - Expert quotes and key findings
   * - Contextual techniques based on issue category
   */
  private getFixApproachForIssueType(problemSummary: string): {
    description: string;
    step2: string;
    principles: string[];
    startingQuestion: string;
    researchContext?: {
      expertQuote?: string;
      expertSource?: string;
      keyFinding?: string;
    };
  } {
    // Use the research technique selector to get evidence-based guidance
    const category = detectIssueCategory(problemSummary);
    const approach = researchTechniqueSelector.getTeachingApproachForCategory(category);

    return {
      description: approach.description,
      step2: approach.step2,
      principles: approach.principles,
      startingQuestion: approach.startingQuestion,
      // Include research context for enhanced coaching
      researchContext: {
        expertQuote: approach.researchContext.expertQuote,
        expertSource: approach.researchContext.expertSource,
        keyFinding: approach.researchContext.keyFinding,
      },
    };
  }

  /**
   * Get research-backed techniques for a specific issue
   *
   * Use this when you need more detailed information about techniques,
   * including multiple approaches and red flags to avoid.
   */
  getResearchTechniquesForIssue(problemSummary: string): ResearchTeachingApproach {
    const category = detectIssueCategory(problemSummary);
    return researchTechniqueSelector.getTeachingApproachForCategory(category);
  }

  /**
   * Get an expert quote suitable for sharing with students
   */
  getStudentFacingQuote(problemSummary: string): { quote: string; source: string } | null {
    const category = detectIssueCategory(problemSummary);
    return researchTechniqueSelector.getStudentFacingQuote(category);
  }

  /**
   * Generate research context for system prompt
   *
   * This provides the AI with research-backed principles, expert quotes,
   * and techniques to use when coaching the student.
   */
  private getResearchContextForPrompt(problemSummary: string): string {
    const category = detectIssueCategory(problemSummary);
    const approach = researchTechniqueSelector.getTeachingApproachForCategory(category);

    let context = '';

    // Add expert quote if available
    if (approach.researchContext.expertQuote && approach.researchContext.expertSource) {
      context += `**Expert Insight:** "${approach.researchContext.expertQuote}" - ${approach.researchContext.expertSource}\n\n`;
    }

    // Add key finding
    if (approach.researchContext.keyFinding) {
      context += `**Key Finding:** ${approach.researchContext.keyFinding}\n\n`;
    }

    // Add reader effect (why this matters psychologically)
    if (approach.researchContext.readerEffect) {
      context += `**Reader Psychology:** ${approach.researchContext.readerEffect}\n\n`;
    }

    // Add techniques to use
    if (approach.techniques.length > 0) {
      context += `**Techniques to Teach:**\n`;
      approach.techniques.forEach(t => {
        context += `- **${t.name}**: ${t.description} (Use when: ${t.whenToUse})\n`;
      });
      context += '\n';
    }

    // Add misconceptions to correct
    if (approach.researchContext.misconceptions && approach.researchContext.misconceptions.length > 0) {
      context += `**Common Misconceptions to Address:**\n`;
      approach.researchContext.misconceptions.forEach(m => {
        context += `- ${m}\n`;
      });
      context += '\n';
    }

    // Add red flags to watch for
    if (approach.redFlags.length > 0) {
      context += `**Red Flags (If student does these, gently redirect):**\n`;
      approach.redFlags.forEach(r => {
        context += `- ${r}\n`;
      });
    }

    return context || 'Use the principles in the examples to guide your teaching.';
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

      // =======================================================================
      // NEW: Opening & Ending Issues
      // =======================================================================
      'weak_opening': 'weak_opening',
      'generic_opening': 'weak_opening',
      'dictionary_definition_opening': 'weak_opening',
      'famous_quote_opening': 'weak_opening',
      'childhood_opening_cliche': 'weak_opening',
      'rhetorical_question_flat': 'weak_opening',
      'thesis_statement_opening': 'weak_opening',
      'melodramatic_opening': 'weak_opening',
      'generic_scene_setting': 'weak_opening',

      'weak_ending': 'weak_ending',
      'generic_ending': 'weak_ending',
      'summary_conclusion': 'weak_ending',
      'abrupt_ending': 'weak_ending',
      'preachy_ending': 'weak_ending',
      'excited_to_attend_ending': 'weak_ending',
      'career_announcement_ending': 'weak_ending',
      'sudden_pivot_ending': 'weak_ending',
      'false_resolution_ending': 'weak_ending',
      'overexplained_ending': 'weak_ending',
      'anticlimactic_ending': 'weak_ending',
      'repetitive_ending': 'weak_ending',
      'abstract_ending': 'weak_ending',
      'academic_ending': 'weak_ending',

      // =======================================================================
      // NEW: "Why Us" / "Why Major" Essays
      // =======================================================================
      'generic_why_us': 'generic_why_us',
      'generic_research': 'generic_why_us',
      'swap_test_fail': 'generic_why_us',
      'surface_level_research': 'generic_why_us',
      'copy_paste_content': 'generic_why_us',
      'generic_praise': 'generic_why_us',

      'generic_why_major': 'generic_why_major',
      'field_description': 'generic_why_major',
      'wikipedia_summary': 'generic_why_major',
      'career_focused_only': 'generic_why_major',

      // =======================================================================
      // NEW: Extracurricular/Activity Essays
      // =======================================================================
      'activity_listing': 'activity_listing',
      'resume_in_prose': 'activity_listing',
      'title_focused': 'activity_listing',
      'accomplishment_list': 'activity_listing',
      'leadership_claims': 'activity_listing',

      // =======================================================================
      // NEW: Structure & Organization
      // =======================================================================
      'weak_structure': 'weak_structure',
      'chronological_trudge': 'weak_structure',
      'lack_of_focus': 'weak_structure',
      'random_tangents': 'weak_structure',
      'thesis_body_conclusion': 'weak_structure',

      'weak_transitions': 'weak_transitions',
      'forced_transitions': 'weak_transitions',
      'disconnected_paragraphs': 'weak_transitions',
      'signpost_overuse': 'weak_transitions',
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
