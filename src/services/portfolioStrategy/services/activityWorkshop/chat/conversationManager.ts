/**
 * Conversation Manager
 *
 * Manages the state and flow of activity profile conversations.
 * Handles:
 * - State initialization and transitions
 * - Phase progression
 * - Profile updates from extractions
 * - Conversation lifecycle (start, process, end)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ConversationState,
  ConversationPhase,
  ConversationTurn,
  ConversationTrigger,
  AskedQuestion,
  ExtractedInformation,
  ExtractionResult,
  StudentContext,
  OPENING_TEMPLATES,
  CLOSING_TEMPLATES,
} from './types';
import { ActivityProfile, createEmptyProfile, createProfileFromBasicData } from '../profile/types';
import { activityProfileService } from '../profile/activityProfileService';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_TURNS_PER_PHASE = 4;
const MAX_TOTAL_TURNS = 20;
const MIN_TURNS_BEFORE_END = 3;

// ============================================================================
// CONVERSATION MANAGER
// ============================================================================

export class ConversationManager {
  /**
   * Initialize a new conversation
   */
  initializeConversation(
    activityId: string,
    activityTitle: string,
    trigger: ConversationTrigger,
    options?: {
      existingProfile?: ActivityProfile;
      studentContext?: StudentContext;
      basicData?: {
        description?: string;
        position?: string;
        hoursPerWeek?: number;
        weeksPerYear?: number;
        yearsInvolved?: number;
        activityType?: string;
      };
    }
  ): ConversationState {
    // Create or use existing profile
    let profile: ActivityProfile;
    if (options?.existingProfile) {
      profile = { ...options.existingProfile };
    } else if (options?.basicData) {
      profile = createProfileFromBasicData(activityId, activityTitle, options.basicData);
    } else {
      profile = createEmptyProfile(activityId, activityTitle);
    }

    const now = new Date().toISOString();

    return {
      conversationId: uuidv4(),
      activityId,
      activityTitle,
      phase: 'opening',
      profileBeforeConversation: JSON.parse(JSON.stringify(profile)), // Deep clone
      currentProfile: profile,
      questionsAsked: [],
      responsesReceived: [],
      extractedInfo: {
        fields: [],
        quotes: [],
        implicit: [],
        updateHistory: [],
      },
      gapsRemaining: this.identifyInitialGaps(profile),
      turnsInCurrentPhase: 0,
      maxTurnsPerPhase: DEFAULT_MAX_TURNS_PER_PHASE,
      totalTurns: 0,
      startedAt: now,
      lastActivityAt: now,
      triggerReason: trigger,
      studentContext: options?.studentContext,
    };
  }

  /**
   * Generate opening message based on trigger
   */
  generateOpeningMessage(state: ConversationState): string {
    const template = OPENING_TEMPLATES[state.triggerReason];
    let message = template.replace(/{activityTitle}/g, state.activityTitle);

    // Add time investment if available
    const hours = state.currentProfile.facts.duration.hoursPerWeek;
    const years = state.currentProfile.facts.duration.totalYears;
    if (hours > 0) {
      message = message.replace(/{hours}/g, String(hours * 40 * (years || 1)));
    }
    if (years > 0) {
      message = message.replace(/{years}/g, String(years));
    }

    return message;
  }

  /**
   * Record a question that was asked
   */
  recordQuestion(
    state: ConversationState,
    question: string,
    targetField: string,
    category: string
  ): ConversationState {
    const askedQuestion: AskedQuestion = {
      question,
      targetField,
      category: category as AskedQuestion['category'],
      askedAt: new Date().toISOString(),
      turnNumber: state.totalTurns + 1,
    };

    return {
      ...state,
      questionsAsked: [...state.questionsAsked, askedQuestion],
      lastActivityAt: new Date().toISOString(),
    };
  }

  /**
   * Process a response and update state
   */
  processResponse(
    state: ConversationState,
    response: string,
    extraction: ExtractionResult,
    question: string
  ): ConversationState {
    const turnNumber = state.totalTurns + 1;
    const now = new Date().toISOString();

    // Create turn record
    const turn: ConversationTurn = {
      turnNumber,
      question,
      response,
      extraction,
      timestamp: now,
    };

    // Update extracted info
    const updatedExtractedInfo = this.updateExtractedInfo(state.extractedInfo, extraction, turnNumber);

    // Update profile with extracted fields
    const updatedProfile = this.applyExtractionToProfile(state.currentProfile, extraction);

    // Update gaps
    const completeness = activityProfileService.calculateCompleteness(updatedProfile);
    const gapsRemaining = completeness.priorityFields
      .filter(f => !f.currentlyFilled && f.importance !== 'low')
      .map(f => f.field);

    return {
      ...state,
      responsesReceived: [...state.responsesReceived, turn],
      extractedInfo: updatedExtractedInfo,
      currentProfile: updatedProfile,
      gapsRemaining,
      turnsInCurrentPhase: state.turnsInCurrentPhase + 1,
      totalTurns: turnNumber,
      lastActivityAt: now,
    };
  }

  /**
   * Transition to a new phase
   */
  transitionPhase(state: ConversationState, newPhase: ConversationPhase): ConversationState {
    return {
      ...state,
      phase: newPhase,
      turnsInCurrentPhase: 0,
      lastActivityAt: new Date().toISOString(),
    };
  }

  /**
   * Check if conversation should end
   */
  shouldEndConversation(state: ConversationState): {
    shouldEnd: boolean;
    reason?: 'complete' | 'low_engagement' | 'max_turns';
  } {
    // Don't end before minimum turns
    if (state.totalTurns < MIN_TURNS_BEFORE_END) {
      return { shouldEnd: false };
    }

    // End if max turns reached
    if (state.totalTurns >= MAX_TOTAL_TURNS) {
      return { shouldEnd: true, reason: 'max_turns' };
    }

    // End if profile is sufficiently complete
    if (state.currentProfile.dataCompleteness >= 80) {
      return { shouldEnd: true, reason: 'complete' };
    }

    // End if in synthesis/complete phase
    if (state.phase === 'complete' || (state.phase === 'synthesis' && state.turnsInCurrentPhase >= 2)) {
      return { shouldEnd: true, reason: 'complete' };
    }

    // Check for low engagement (short responses)
    const recentTurns = state.responsesReceived.slice(-3);
    if (recentTurns.length >= 3) {
      const avgWordCount = recentTurns.reduce(
        (sum, turn) => sum + turn.response.split(' ').length,
        0
      ) / recentTurns.length;

      const allSparse = recentTurns.every(t => t.extraction.extractionQuality === 'sparse' || t.extraction.extractionQuality === 'empty');

      if (avgWordCount < 10 && allSparse) {
        return { shouldEnd: true, reason: 'low_engagement' };
      }
    }

    return { shouldEnd: false };
  }

  /**
   * Generate closing message
   */
  generateClosingMessage(
    state: ConversationState,
    reason: 'complete' | 'low_engagement' | 'user_requested' | 'max_turns'
  ): string {
    const template = CLOSING_TEMPLATES[reason];
    return template.replace(/{activityTitle}/g, state.activityTitle);
  }

  /**
   * Generate conversation summary
   */
  generateSummary(state: ConversationState): {
    whatWeLearned: string[];
    completenessBefore: number;
    completenessAfter: number;
    keyQuotes: string[];
    remainingGaps: string[];
    estimatedScoreImpact: { description: number; activity: number; portfolio: number };
  } {
    const completenessBefore = state.profileBeforeConversation.dataCompleteness;
    const completenessAfter = state.currentProfile.dataCompleteness;

    // Summarize what we learned
    const whatWeLearned: string[] = [];
    if (state.extractedInfo.fields.length > 0) {
      const fieldCategories = new Set(state.extractedInfo.fields.map(f => f.path.split('.')[0]));
      if (fieldCategories.has('facts')) whatWeLearned.push('Captured concrete details and metrics');
      if (fieldCategories.has('story')) whatWeLearned.push('Learned about key moments and experiences');
      if (fieldCategories.has('meaning')) whatWeLearned.push('Understood personal significance');
      if (fieldCategories.has('impact')) whatWeLearned.push('Documented impact on others');
      if (fieldCategories.has('connections')) whatWeLearned.push('Connected to broader narrative');
    }

    // Get key quotes
    const keyQuotes = state.extractedInfo.quotes
      .filter(q => q.potentialUse === 'description' || q.potentialUse === 'essay')
      .slice(0, 3)
      .map(q => q.quote);

    // Calculate score impact estimate
    const improvement = (completenessAfter - completenessBefore) / 100;
    const estimatedScoreImpact = {
      description: Math.round(improvement * 3 * 10) / 10,
      activity: Math.round(improvement * 1.5 * 10) / 10,
      portfolio: Math.round(improvement * 1 * 10) / 10,
    };

    return {
      whatWeLearned,
      completenessBefore,
      completenessAfter,
      keyQuotes,
      remainingGaps: state.gapsRemaining.slice(0, 5),
      estimatedScoreImpact,
    };
  }

  /**
   * Finalize the profile after conversation ends
   */
  finalizeProfile(state: ConversationState): ActivityProfile {
    // Add conversation record to profile metadata
    const conversationRecord = {
      timestamp: state.startedAt,
      questionsAsked: state.questionsAsked.map(q => q.question),
      newInfoExtracted: state.extractedInfo.fields.map(f => f.path),
      fieldsUpdated: [...new Set(state.extractedInfo.fields.map(f => f.path))],
      completenessBefore: state.profileBeforeConversation.dataCompleteness,
      completenessAfter: state.currentProfile.dataCompleteness,
    };

    const finalProfile = activityProfileService.updateProfile(
      state.currentProfile,
      {},
      conversationRecord
    );

    return finalProfile;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Identify initial gaps in the profile
   */
  private identifyInitialGaps(profile: ActivityProfile): string[] {
    const completeness = activityProfileService.calculateCompleteness(profile);
    return completeness.priorityFields
      .filter(f => !f.currentlyFilled && f.importance !== 'low')
      .map(f => f.field);
  }

  /**
   * Update extracted info with new extraction
   */
  private updateExtractedInfo(
    current: ExtractedInformation,
    extraction: ExtractionResult,
    turnNumber: number
  ): ExtractedInformation {
    return {
      fields: [...current.fields, ...extraction.extractedFields],
      quotes: [...current.quotes, ...extraction.authenticQuotes],
      implicit: [...current.implicit, ...extraction.implicitFindings],
      updateHistory: [
        ...current.updateHistory,
        {
          turnNumber,
          fieldsUpdated: extraction.extractedFields.map(f => f.path),
        },
      ],
    };
  }

  /**
   * Apply extraction results to the profile
   */
  private applyExtractionToProfile(
    profile: ActivityProfile,
    extraction: ExtractionResult
  ): ActivityProfile {
    let updatedProfile = { ...profile };

    for (const field of extraction.extractedFields) {
      updatedProfile = this.setProfileField(updatedProfile, field.path, field.value, field.updateType);
    }

    // Add authentic quotes
    for (const quote of extraction.authenticQuotes) {
      updatedProfile = activityProfileService.addAuthenticQuote(updatedProfile, {
        quote: quote.quote,
        context: quote.context,
        potentialUse: quote.potentialUse,
      });
    }

    // Apply implicit character traits if high confidence
    for (const implicit of extraction.implicitFindings) {
      if (implicit.confidence === 'high' && implicit.relatedField?.includes('characterTraits')) {
        // Extract trait from observation if possible
        const traitMatch = implicit.observation.match(/demonstrates?\s+(\w+)/i);
        if (traitMatch) {
          const trait = traitMatch[1].toLowerCase();
          const validTraits = ['leadership', 'innovation', 'resilience', 'curiosity', 'empathy', 'discipline', 'creativity', 'integrity', 'collaboration', 'initiative', 'perseverance'];
          if (validTraits.includes(trait)) {
            updatedProfile = activityProfileService.addCharacterTrait(updatedProfile, {
              trait: trait as any,
              howDemonstrated: implicit.basis,
            });
          }
        }
      }
    }

    return updatedProfile;
  }

  /**
   * Set a field in the profile by path
   */
  private setProfileField(
    profile: ActivityProfile,
    path: string,
    value: unknown,
    updateType: 'new' | 'update' | 'append'
  ): ActivityProfile {
    const parts = path.split('.');
    const result = JSON.parse(JSON.stringify(profile)); // Deep clone

    let current: unknown = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      }
    }

    if (current && typeof current === 'object') {
      const lastPart = parts[parts.length - 1];
      const obj = current as Record<string, unknown>;

      if (updateType === 'append' && Array.isArray(obj[lastPart])) {
        if (Array.isArray(value)) {
          obj[lastPart] = [...(obj[lastPart] as unknown[]), ...value];
        } else {
          (obj[lastPart] as unknown[]).push(value);
        }
      } else {
        obj[lastPart] = value;
      }
    }

    // Recalculate completeness
    const completeness = activityProfileService.calculateCompleteness(result);
    result.dataCompleteness = completeness.overall;
    result.lastUpdated = new Date().toISOString();
    result.profileVersion += 1;

    return result;
  }
}

// Export singleton
export const conversationManager = new ConversationManager();
