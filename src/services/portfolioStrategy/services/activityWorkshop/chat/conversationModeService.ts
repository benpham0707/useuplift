/**
 * Conversation Mode Service
 *
 * Dynamically manages conversation modes based on student response patterns.
 * Enables adaptive questioning strategies that respond to how each student
 * communicates, rather than following a rigid script.
 *
 * PHILOSOPHY:
 * - Quality over completeness: Focus on high-value data, not filling every field
 * - Student-centric: Adapt to their communication style
 * - Effectiveness tracking: If a mode isn't working, try something else
 *
 * MODES:
 * - standard: Template-based questioning (default)
 * - rescue_storytelling: Open-ended prompts when extraction is sparse
 * - targeted_completion: Focus on specific high-value missing fields
 * - recap_confirmation: Summarize back to confirm and prompt more detail
 * - emotional_validation: Validate feelings before probing deeper
 */

import { ConversationState } from './types';
import { ActivityProfile } from '../profile/types';

// ============================================================================
// TYPES
// ============================================================================

export type ConversationMode =
  | 'standard'
  | 'rescue_storytelling'
  | 'targeted_completion'
  | 'recap_confirmation'
  | 'emotional_validation';

export type StudentPattern =
  | 'engaged'      // Provides rich, relevant details
  | 'terse'        // Short answers, needs prompting
  | 'tangential'   // Goes off-topic, needs redirecting
  | 'reluctant'    // Hesitant to share, needs encouragement
  | 'humble'       // Undersells achievements, needs reframing
  | 'unknown';     // Not enough data to determine

export interface ModeEffectiveness {
  attempts: number;
  improvements: number; // Times extraction quality improved after mode activation
}

export interface ConversationDynamics {
  // Extraction patterns
  sparseExtractionStreak: number;
  richExtractionStreak: number;
  lastExtractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty';

  // Recap tracking
  lastRecapTurn: number | null;
  dataPointsSinceRecap: number;

  // Student pattern detection
  detectedPattern: StudentPattern;
  patternConfidence: number; // 0-1

  // High-value fields analysis
  priorityMissingFields: PriorityField[];

  // Mode effectiveness for this student
  modeEffectiveness: Map<ConversationMode, ModeEffectiveness>;

  // Currently active modes
  activeModes: ConversationMode[];
}

export interface PriorityField {
  field: string;
  importance: 'critical' | 'high' | 'medium';
  reason: string;
  suggestedQuestion?: string;
}

export interface QuestionComposition {
  prefix?: string;      // Recap or validation
  question: string;     // Main question
  suffix?: string;      // Encouragement or softener
  mode: ConversationMode;
  reasoning: string;    // Why this composition was chosen
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * High-value fields for activity descriptions (in priority order)
 */
const HIGH_VALUE_FIELDS: Array<{
  field: string;
  importance: 'critical' | 'high' | 'medium';
  reason: string;
}> = [
  { field: 'impact.beforeAfter', importance: 'critical', reason: 'Before/after metrics are gold for descriptions' },
  { field: 'facts.scale.peopleDirectlyImpacted', importance: 'critical', reason: 'Scale shows significance' },
  { field: 'facts.recognition', importance: 'critical', reason: 'External validation differentiates' },
  { field: 'facts.roles', importance: 'high', reason: 'Clarifies unique contribution' },
  { field: 'facts.scale.resourcesCreated', importance: 'high', reason: 'Tangible outputs are impressive' },
  { field: 'story.keyMoments', importance: 'medium', reason: 'Adds narrative depth' },
  { field: 'meaning.proudestMoment', importance: 'medium', reason: 'Shows authentic engagement' },
];

/**
 * Rescue storytelling questions - open-ended prompts that invite narrative
 */
const RESCUE_STORYTELLING_QUESTIONS: string[] = [
  "Can you walk me through what a typical day or week looked like when you were doing {activity}?",
  "Tell me about a specific moment that really stands out from your time with {activity}.",
  "If you were explaining {activity} to a friend who knows nothing about it, what would you tell them?",
  "What's something that happened during {activity} that you still think about?",
  "Take me back to when you first started {activity}. What was that like?",
  "What would surprise someone who doesn't know much about what you do in {activity}?",
];

/**
 * Smart recap templates
 */
const RECAP_TEMPLATES: string[] = [
  "Let me make sure I've got this right: {summary}. Does that capture it?",
  "So I'm hearing {summary} — did I miss anything?",
  "Just to recap what you've shared: {summary}. Anything you'd add?",
];

/**
 * Emotional validation templates
 */
const VALIDATION_TEMPLATES = {
  humble: [
    "I appreciate your humility — that says a lot about your character. But help me understand specifically what YOU did that made a difference?",
    "It sounds like you're being modest, which is admirable. Even so, I'd love to know what your unique contribution was.",
    "I can tell you value your team. And I also want to make sure admissions officers see what YOU brought to the table.",
  ],
  reluctant: [
    "I sense this might feel a bit uncomfortable to talk about yourself. Take your time — there's no rush.",
    "It's totally normal to find this kind of reflection challenging. Let's just have a conversation.",
    "I know talking about achievements can feel awkward. What if we just chatted about what you actually did day-to-day?",
  ],
  terse: [
    "I appreciate you sharing that. I'd love to hear more details if you're comfortable.",
    "That's helpful context. Can you paint a fuller picture for me?",
    "Thanks for that. Could you help me visualize what that actually looked like?",
  ],
};

/**
 * Encouragement suffixes
 */
const ENCOURAGEMENT_SUFFIXES: string[] = [
  "Take your time — I'm here to listen.",
  "Even small details can make a big difference in how we present this.",
  "There's no wrong answer here — I'm just trying to understand your experience.",
];

// ============================================================================
// SERVICE
// ============================================================================

export class ConversationModeService {
  /**
   * Create initial conversation dynamics
   */
  createInitialDynamics(): ConversationDynamics {
    return {
      sparseExtractionStreak: 0,
      richExtractionStreak: 0,
      lastExtractionQuality: 'empty',
      lastRecapTurn: null,
      dataPointsSinceRecap: 0,
      detectedPattern: 'unknown',
      patternConfidence: 0,
      priorityMissingFields: [],
      modeEffectiveness: new Map(),
      activeModes: ['standard'],
    };
  }

  /**
   * Update conversation dynamics after a turn
   */
  updateDynamics(
    currentDynamics: ConversationDynamics,
    extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty',
    dataPointsExtracted: number,
    response: string,
    profile: ActivityProfile,
    turnNumber: number
  ): ConversationDynamics {
    const dynamics = { ...currentDynamics };

    // Update extraction streaks
    if (extractionQuality === 'sparse' || extractionQuality === 'empty') {
      dynamics.sparseExtractionStreak++;
      dynamics.richExtractionStreak = 0;
    } else if (extractionQuality === 'rich') {
      dynamics.richExtractionStreak++;
      dynamics.sparseExtractionStreak = 0;
    } else {
      // moderate resets both
      dynamics.sparseExtractionStreak = 0;
      dynamics.richExtractionStreak = 0;
    }

    dynamics.lastExtractionQuality = extractionQuality;
    dynamics.dataPointsSinceRecap += dataPointsExtracted;

    // Detect student pattern
    dynamics.detectedPattern = this.detectStudentPattern(response, dynamics);
    dynamics.patternConfidence = this.calculatePatternConfidence(dynamics);

    // Update priority missing fields
    dynamics.priorityMissingFields = this.analyzeMissingFields(profile);

    // Determine which modes should be active
    dynamics.activeModes = this.determineActiveModes(dynamics, turnNumber);

    // Track mode effectiveness
    this.updateModeEffectiveness(dynamics, extractionQuality);

    return dynamics;
  }

  /**
   * Detect the student's communication pattern
   */
  private detectStudentPattern(response: string, dynamics: ConversationDynamics): StudentPattern {
    const wordCount = response.split(/\s+/).length;
    const lowercaseResponse = response.toLowerCase();

    // Check for humility patterns
    const humilityPatterns = [
      /anyone could/i, /not a big deal/i, /i just/i, /not that good/i,
      /others are better/i, /the team did/i, /wasn't just me/i,
      /i didn't do much/i, /don't deserve/i, /others worked harder/i,
    ];
    if (humilityPatterns.some(p => p.test(lowercaseResponse))) {
      return 'humble';
    }

    // Check for reluctance patterns
    const reluctancePatterns = [
      /i don't know/i, /nothing special/i, /whatever/i,
      /doesn't matter/i, /i guess/i, /not sure/i,
    ];
    if (reluctancePatterns.some(p => p.test(lowercaseResponse))) {
      return 'reluctant';
    }

    // Check word count for terse vs engaged
    if (wordCount < 15 && dynamics.sparseExtractionStreak >= 1) {
      return 'terse';
    }

    // Check for tangential content (many sentences but off-topic markers)
    const tangentialMarkers = [
      /speaking of which/i, /by the way/i, /anyway/i, /oh and/i,
      /reminded me of/i, /that reminds me/i,
    ];
    if (wordCount > 50 && tangentialMarkers.some(p => p.test(lowercaseResponse))) {
      return 'tangential';
    }

    // If rich extraction and good length, they're engaged
    if (dynamics.lastExtractionQuality === 'rich' || wordCount > 40) {
      return 'engaged';
    }

    // Default to previous pattern if uncertain
    return dynamics.detectedPattern !== 'unknown' ? dynamics.detectedPattern : 'terse';
  }

  /**
   * Calculate confidence in the detected pattern
   */
  private calculatePatternConfidence(dynamics: ConversationDynamics): number {
    // More turns = higher confidence
    const turnFactor = Math.min((dynamics.sparseExtractionStreak + dynamics.richExtractionStreak) / 3, 1);
    return turnFactor;
  }

  /**
   * Analyze which high-value fields are still missing
   */
  private analyzeMissingFields(profile: ActivityProfile): PriorityField[] {
    const missing: PriorityField[] = [];

    for (const fieldDef of HIGH_VALUE_FIELDS) {
      const isFilled = this.isFieldFilled(fieldDef.field, profile);
      if (!isFilled) {
        missing.push({
          field: fieldDef.field,
          importance: fieldDef.importance,
          reason: fieldDef.reason,
        });
      }
    }

    // Return top 3 most important
    return missing.slice(0, 3);
  }

  /**
   * Check if a field is filled
   */
  private isFieldFilled(field: string, profile: ActivityProfile): boolean {
    switch (field) {
      case 'impact.beforeAfter':
        return !!profile.impact.beforeAfter;
      case 'facts.scale.peopleDirectlyImpacted':
        return profile.facts.scale.peopleDirectlyImpacted > 0;
      case 'facts.recognition':
        return profile.facts.recognition.length > 0;
      case 'facts.roles':
        return profile.facts.roles.length > 1; // > 1 because initial role is always there
      case 'facts.scale.resourcesCreated':
        return profile.facts.scale.resourcesCreated > 0;
      case 'story.keyMoments':
        return profile.story.keyMoments.length > 0;
      case 'meaning.proudestMoment':
        return !!profile.meaning.proudestMoment;
      default:
        return false;
    }
  }

  /**
   * Determine which modes should be active
   */
  private determineActiveModes(dynamics: ConversationDynamics, turnNumber: number): ConversationMode[] {
    const modes: ConversationMode[] = ['standard'];

    // Rescue storytelling: when 2+ sparse extractions in a row
    if (dynamics.sparseExtractionStreak >= 2) {
      // Check if rescue mode has been effective for this student
      const rescueEffectiveness = dynamics.modeEffectiveness.get('rescue_storytelling');
      const rescueWorks = !rescueEffectiveness ||
        rescueEffectiveness.improvements >= rescueEffectiveness.attempts * 0.3;

      if (rescueWorks) {
        modes.push('rescue_storytelling');
      }
    }

    // Recap confirmation: when significant data extracted, haven't recapped recently,
    // AND student is NOT in an engaged flow (don't interrupt engaged students)
    const isEngaged = dynamics.detectedPattern === 'engaged' && dynamics.richExtractionStreak >= 2;
    if (dynamics.dataPointsSinceRecap >= 5 &&
        (dynamics.lastRecapTurn === null || turnNumber - dynamics.lastRecapTurn >= 3) &&
        !isEngaged) {
      modes.push('recap_confirmation');
    }

    // Emotional validation: when student shows reluctance or humility
    if (dynamics.detectedPattern === 'humble' || dynamics.detectedPattern === 'reluctant') {
      const validationEffectiveness = dynamics.modeEffectiveness.get('emotional_validation');
      const validationWorks = !validationEffectiveness ||
        validationEffectiveness.improvements >= validationEffectiveness.attempts * 0.3;

      if (validationWorks) {
        modes.push('emotional_validation');
      }
    }

    // Targeted completion: when we have specific high-value fields missing
    if (dynamics.priorityMissingFields.length > 0 && turnNumber >= 2) {
      modes.push('targeted_completion');
    }

    return modes;
  }

  /**
   * Update mode effectiveness based on extraction results
   */
  private updateModeEffectiveness(dynamics: ConversationDynamics, newQuality: 'rich' | 'moderate' | 'sparse' | 'empty'): void {
    // Track if extraction improved from previous turn
    const improved = (dynamics.lastExtractionQuality === 'sparse' || dynamics.lastExtractionQuality === 'empty') &&
      (newQuality === 'rich' || newQuality === 'moderate');

    for (const mode of dynamics.activeModes) {
      if (mode === 'standard') continue; // Don't track standard mode

      const current = dynamics.modeEffectiveness.get(mode) || { attempts: 0, improvements: 0 };
      current.attempts++;
      if (improved) {
        current.improvements++;
      }
      dynamics.modeEffectiveness.set(mode, current);
    }
  }

  /**
   * Compose a question with appropriate prefix/suffix based on active modes
   */
  composeQuestion(
    baseQuestion: string,
    dynamics: ConversationDynamics,
    activityTitle: string,
    recentExtractedData?: string[]
  ): QuestionComposition {
    let prefix: string | undefined;
    let suffix: string | undefined;
    let question = baseQuestion;
    let mode: ConversationMode = 'standard';
    const reasoning: string[] = [];

    // Priority 1: Emotional validation (if needed)
    if (dynamics.activeModes.includes('emotional_validation')) {
      const pattern = dynamics.detectedPattern;
      if (pattern === 'humble' || pattern === 'reluctant' || pattern === 'terse') {
        const templates = VALIDATION_TEMPLATES[pattern] || VALIDATION_TEMPLATES.reluctant;
        prefix = templates[Math.floor(Math.random() * templates.length)];
        mode = 'emotional_validation';
        reasoning.push(`Added validation for ${pattern} student pattern`);
      }
    }

    // Priority 2: Recap (if significant data and due for recap)
    // Skip recap for engaged students - don't interrupt their flow
    const isEngagedFlow = dynamics.detectedPattern === 'engaged' && dynamics.richExtractionStreak >= 2;
    if (dynamics.activeModes.includes('recap_confirmation') &&
        recentExtractedData &&
        recentExtractedData.length > 0 &&
        !isEngagedFlow) {
      const summary = recentExtractedData.slice(0, 3).join(', ');
      const recapTemplate = RECAP_TEMPLATES[Math.floor(Math.random() * RECAP_TEMPLATES.length)];

      // If we already have a prefix (validation), append recap after question
      if (prefix) {
        suffix = recapTemplate.replace('{summary}', summary);
      } else {
        prefix = recapTemplate.replace('{summary}', summary);
      }
      mode = prefix ? mode : 'recap_confirmation';
      reasoning.push('Added recap to confirm extracted data');
    }

    // Priority 3: Rescue storytelling (switch to open-ended question)
    if (dynamics.activeModes.includes('rescue_storytelling') && !reasoning.includes('Added validation')) {
      // Replace the base question with a storytelling prompt
      const rescueQuestion = RESCUE_STORYTELLING_QUESTIONS[
        Math.floor(Math.random() * RESCUE_STORYTELLING_QUESTIONS.length)
      ].replace('{activity}', activityTitle);

      question = rescueQuestion;
      mode = 'rescue_storytelling';
      reasoning.push('Switched to storytelling prompt due to sparse extraction streak');
    }

    // Add encouragement suffix for terse/reluctant students (if not already have suffix)
    if (!suffix && (dynamics.detectedPattern === 'terse' || dynamics.detectedPattern === 'reluctant')) {
      suffix = ENCOURAGEMENT_SUFFIXES[Math.floor(Math.random() * ENCOURAGEMENT_SUFFIXES.length)];
      reasoning.push('Added encouragement for reserved student');
    }

    return {
      prefix,
      question,
      suffix,
      mode,
      reasoning: reasoning.join('; ') || 'Standard questioning',
    };
  }

  /**
   * Format a composed question into a single string
   */
  formatComposedQuestion(composition: QuestionComposition): string {
    const parts: string[] = [];

    if (composition.prefix) {
      parts.push(composition.prefix);
    }

    parts.push(composition.question);

    if (composition.suffix) {
      parts.push(composition.suffix);
    }

    return parts.join(' ');
  }

  /**
   * Get storytelling questions for rescue mode
   */
  getStorytellingQuestions(activityTitle: string): string[] {
    return RESCUE_STORYTELLING_QUESTIONS.map(q => q.replace('{activity}', activityTitle));
  }

  /**
   * Generate a smart recap from extracted data
   */
  generateRecap(extractedData: string[]): string | null {
    if (extractedData.length === 0) return null;

    const summary = extractedData.slice(0, 4).join(', ');
    const template = RECAP_TEMPLATES[Math.floor(Math.random() * RECAP_TEMPLATES.length)];
    return template.replace('{summary}', summary);
  }

  /**
   * Check if a mode should be disabled due to poor effectiveness
   */
  shouldDisableMode(dynamics: ConversationDynamics, mode: ConversationMode): boolean {
    const effectiveness = dynamics.modeEffectiveness.get(mode);
    if (!effectiveness || effectiveness.attempts < 2) {
      return false; // Not enough data
    }

    // Disable if success rate < 25%
    return (effectiveness.improvements / effectiveness.attempts) < 0.25;
  }

  /**
   * Get a summary of active modes and reasoning
   */
  getModeStatus(dynamics: ConversationDynamics): {
    activeModes: ConversationMode[];
    pattern: StudentPattern;
    patternConfidence: number;
    sparseStreak: number;
    priorityFields: string[];
  } {
    return {
      activeModes: dynamics.activeModes,
      pattern: dynamics.detectedPattern,
      patternConfidence: dynamics.patternConfidence,
      sparseStreak: dynamics.sparseExtractionStreak,
      priorityFields: dynamics.priorityMissingFields.map(f => f.field),
    };
  }
}

// Export singleton
export const conversationModeService = new ConversationModeService();
