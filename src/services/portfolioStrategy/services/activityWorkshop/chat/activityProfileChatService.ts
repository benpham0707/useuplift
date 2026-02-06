/**
 * Activity Profile Chat Service
 *
 * Main orchestrator for the conversational activity profiling system.
 * Coordinates between:
 * - ConversationManager (state management)
 * - QuestionGenerator (what to ask)
 * - ResponseExtractor (parsing responses)
 * - ActivityProfileService (profile updates)
 *
 * PUBLIC API:
 * - startConversation(): Initialize a new chat session
 * - processUserResponse(): Handle student response and continue conversation
 * - getConversationSummary(): Get summary of what was learned
 * - endConversation(): Gracefully close and finalize profile
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRITICAL DESIGN PRINCIPLE: SCORING vs GUIDANCE SEPARATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SCORING = What admissions officers see (150-char description, title, hours)
 *   → Profiles do NOT inflate scores
 *   → Scores reflect application reality, not hidden depth
 *
 * GUIDANCE = What we help students with (using profile knowledge)
 *   → Profiles ENHANCE guidance quality
 *   → Better description rewrites, targeted suggestions, strategic advice
 *   → Gap analysis: "Your profile shows X, but your description doesn't mention it"
 *
 * WHY: A student might have an amazing untold story, but if it's not in their
 * description, the AO won't know. Our job is to help GET it into the description,
 * not to give inflated scores for invisible achievements.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PHILOSOPHY: Students should feel like they're having a conversation
 * with a thoughtful counselor, not filling out a form. The system
 * extracts structured data while maintaining natural dialogue flow.
 */

import {
  ConversationState,
  StartConversationInput,
  StartConversationOutput,
  ProcessResponseInput,
  ProcessResponseOutput,
  ConversationSummaryOutput,
  ConversationTrigger,
  ExtractionResult,
  ConversationDynamics,
} from './types';
import { ActivityProfile } from '../profile/types';
import { activityProfileService } from '../profile/activityProfileService';
import { conversationManager } from './conversationManager';
import { questionGeneratorService } from './questionGenerator';
import { responseExtractorService } from './responseExtractor';
import { conversationModeService } from './conversationModeService';
import { dynamicConversationEngine } from './dynamicConversationEngine';

// ============================================================================
// ACTIVITY PROFILE CHAT SERVICE
// ============================================================================

export class ActivityProfileChatService {
  /**
   * Start a new conversation about an activity
   *
   * This initializes the conversation state, generates an opening message,
   * and prepares the first question based on what we know (or don't know)
   * about the activity.
   */
  async startConversation(input: StartConversationInput): Promise<StartConversationOutput> {
    try {
      // Initialize conversation state
      let state = conversationManager.initializeConversation(
        input.activityId,
        input.activityTitle,
        input.trigger,
        {
          existingProfile: input.existingProfile,
          studentContext: input.studentContext,
          basicData: input.basicData,
        }
      );

      // Initialize conversation dynamics for adaptive mode selection
      state = {
        ...state,
        dynamics: conversationModeService.createInitialDynamics(),
      };

      // Generate personalized opening message
      const openingMessage = conversationManager.generateOpeningMessage(state);

      // Generate first question based on profile gaps
      const questionResult = questionGeneratorService.generateNextQuestion({
        state,
        maxQuestions: 3,
      });

      // Record the question in state
      const updatedState = conversationManager.recordQuestion(
        state,
        questionResult.nextQuestion.question,
        questionResult.nextQuestion.targetField,
        questionResult.nextQuestion.category
      );

      return {
        success: true,
        state: updatedState,
        openingMessage,
        firstQuestion: questionResult.nextQuestion.question,
      };
    } catch (error) {
      console.error('[ActivityProfileChatService] Start conversation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation',
      };
    }
  }

  /**
   * Process a student's response
   *
   * This is the main turn-taking method. It:
   * 1. Extracts structured information from the response
   * 2. Updates the profile with new data
   * 3. Updates conversation dynamics for adaptive mode selection
   * 4. Decides whether to continue or end
   * 5. Generates the next question with mode-appropriate framing
   */
  async processUserResponse(input: ProcessResponseInput): Promise<ProcessResponseOutput> {
    try {
      const { state, response, metadata } = input;

      // Get the last question that was asked
      const lastQuestion = state.questionsAsked[state.questionsAsked.length - 1];
      if (!lastQuestion) {
        return {
          success: false,
          shouldEnd: false,
          error: 'No question found in conversation state',
        };
      }

      // Extract information from the response
      const extraction = await responseExtractorService.extractFromResponse(
        lastQuestion.question,
        response,
        state
      );

      // Process the response and update state
      let updatedState = conversationManager.processResponse(
        state,
        response,
        extraction,
        lastQuestion.question
      );

      // ════════════════════════════════════════════════════════════════════════
      // ADAPTIVE MODE SYSTEM: Update dynamics based on extraction results
      // ════════════════════════════════════════════════════════════════════════
      const currentDynamics = updatedState.dynamics || conversationModeService.createInitialDynamics();
      const extractionQuality = extraction.extractionQuality as 'rich' | 'moderate' | 'sparse' | 'empty';
      const dataPointsExtracted = extraction.extractedFields?.length || 0;

      // Update dynamics with new information
      const updatedDynamics = conversationModeService.updateDynamics(
        currentDynamics,
        extractionQuality,
        dataPointsExtracted,
        response,
        updatedState.currentProfile,
        updatedState.totalTurns
      );

      updatedState = {
        ...updatedState,
        dynamics: updatedDynamics,
      };

      // Check if we should transition to a new phase
      const questionResult = questionGeneratorService.generateNextQuestion({
        state: updatedState,
        maxQuestions: 3,
      });

      if (questionResult.shouldTransitionPhase && questionResult.suggestedNextPhase) {
        updatedState = conversationManager.transitionPhase(
          updatedState,
          questionResult.suggestedNextPhase
        );
      }

      // Check if conversation should end
      const endCheck = conversationManager.shouldEndConversation(updatedState);

      if (endCheck.shouldEnd) {
        // Generate closing message and finalize
        const closingMessage = conversationManager.generateClosingMessage(
          updatedState,
          endCheck.reason || 'complete'
        );

        // Finalize the profile
        const finalProfile = conversationManager.finalizeProfile(updatedState);
        updatedState = {
          ...updatedState,
          currentProfile: finalProfile,
          phase: 'complete',
        };

        // Accumulate token usage in state
        if (extraction.tokensUsed) {
          updatedState = this.accumulateTokenUsage(updatedState, extraction.tokensUsed);
        }

        return {
          success: true,
          state: updatedState,
          extraction,
          shouldEnd: true,
          endReason: endCheck.reason,
          closingMessage,
          tokensUsed: extraction.tokensUsed,
        };
      }

      // ════════════════════════════════════════════════════════════════════════
      // COMPOSE QUESTION: Use Dynamic Conversation Engine for high-quality output
      // ════════════════════════════════════════════════════════════════════════
      const baseQuestion = questionResult.nextQuestion.question;
      const recentExtractedData = extraction.extractedFields?.map(f => f.value as string) || [];

      // Determine if we should use dynamic engine (for challenging student patterns)
      // or fall back to template composition (for engaged students / simple cases)
      const useDynamicEngine = this.shouldUseDynamicEngine(updatedDynamics, extraction);

      let composedQuestion: string;
      let questionMode: string = 'standard';
      let questionReasoning: string = 'Standard questioning';
      let additionalTokensUsed: { inputTokens: number; outputTokens: number } | undefined;

      if (useDynamicEngine) {
        // Build conversation history for context
        const conversationHistory = updatedState.responsesReceived.map(turn => ({
          question: turn.question,
          response: turn.response,
          extraction: turn.extraction,
        }));

        // Build extracted highlights for teaching context
        const extractedHighlights = this.buildExtractedHighlights(updatedState);

        try {
          // Generate dynamic, contextual question
          const dynamicResult = await dynamicConversationEngine.generateDynamicQuestion({
            baseQuestion,
            targetField: questionResult.nextQuestion.targetField,
            activityTitle: state.activityTitle,
            dynamics: updatedDynamics,
            conversationHistory,
            profile: updatedState.currentProfile,
            extractedHighlights,
            turnNumber: updatedState.totalTurns,
          });

          composedQuestion = dynamicResult.question;
          questionMode = `dynamic_${dynamicResult.tone}`;
          questionReasoning = dynamicResult.reasoning;

          // Log teaching moment if included
          if (dynamicResult.teachingMoment) {
            console.log(`[ActivityProfileChatService] Teaching: ${dynamicResult.teachingMoment}`);
          }

          // Track dynamic engine token usage
          if (dynamicResult.tokensUsed) {
            additionalTokensUsed = {
              inputTokens: dynamicResult.tokensUsed.input,
              outputTokens: dynamicResult.tokensUsed.output,
            };
          }

          console.log(`[ActivityProfileChatService] Dynamic question (${dynamicResult.tone}): ${dynamicResult.reasoning}`);
        } catch (dynamicError) {
          console.warn('[ActivityProfileChatService] Dynamic engine failed, falling back to templates:', dynamicError);
          // Fall back to template-based composition
          const composition = conversationModeService.composeQuestion(
            baseQuestion,
            updatedDynamics,
            state.activityTitle,
            recentExtractedData
          );
          composedQuestion = conversationModeService.formatComposedQuestion(composition);
          questionMode = composition.mode;
          questionReasoning = composition.reasoning;
        }
      } else {
        // Use template-based composition for engaged students (keep momentum)
        const composition = conversationModeService.composeQuestion(
          baseQuestion,
          updatedDynamics,
          state.activityTitle,
          recentExtractedData
        );
        composedQuestion = conversationModeService.formatComposedQuestion(composition);
        questionMode = composition.mode;
        questionReasoning = composition.reasoning;

        // If we used recap mode, track it
        if (composition.mode === 'recap_confirmation') {
          updatedState = {
            ...updatedState,
            dynamics: {
              ...updatedState.dynamics!,
              lastRecapTurn: updatedState.totalTurns,
              dataPointsSinceRecap: 0,
            },
          };
        }

        if (questionMode !== 'standard') {
          console.log(`[ActivityProfileChatService] Mode adaptation: ${questionMode} | Reason: ${questionReasoning}`);
        }
      }

      // Record the next question with mode tracking
      updatedState = conversationManager.recordQuestion(
        updatedState,
        composedQuestion,
        questionResult.nextQuestion.targetField,
        questionResult.nextQuestion.category
      );

      // Mark the question with mode information
      const lastRecordedQuestion = updatedState.questionsAsked[updatedState.questionsAsked.length - 1];
      if (lastRecordedQuestion) {
        lastRecordedQuestion.mode = questionMode as any;
        lastRecordedQuestion.isFollowUp = questionMode !== 'standard';
      }

      // Accumulate token usage in state (extraction + dynamic engine if used)
      let totalTokens = extraction.tokensUsed;
      if (additionalTokensUsed) {
        totalTokens = {
          inputTokens: (extraction.tokensUsed?.inputTokens || 0) + additionalTokensUsed.inputTokens,
          outputTokens: (extraction.tokensUsed?.outputTokens || 0) + additionalTokensUsed.outputTokens,
        };
      }
      if (totalTokens) {
        updatedState = this.accumulateTokenUsage(updatedState, totalTokens);
      }

      return {
        success: true,
        state: updatedState,
        extraction,
        nextQuestion: composedQuestion,
        shouldEnd: false,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      console.error('[ActivityProfileChatService] Process response error:', error);
      return {
        success: false,
        shouldEnd: false,
        error: error instanceof Error ? error.message : 'Failed to process response',
      };
    }
  }

  /**
   * Get a summary of what was learned in the conversation
   */
  getConversationSummary(state: ConversationState): ConversationSummaryOutput {
    const summary = conversationManager.generateSummary(state);

    // Generate suggested next steps
    const suggestedNextSteps: string[] = [];

    if (summary.remainingGaps.length > 0) {
      suggestedNextSteps.push(
        `Continue developing your ${state.activityTitle} profile to fill in remaining details`
      );
    }

    if (summary.completenessAfter >= 70) {
      suggestedNextSteps.push(
        'Your profile is strong enough to generate an improved activity description'
      );
    }

    if (summary.keyQuotes.length > 0) {
      suggestedNextSteps.push(
        'Consider using some of your authentic quotes in your essays or description'
      );
    }

    if (summary.estimatedScoreImpact.description > 0.5) {
      suggestedNextSteps.push(
        'Regenerate your activity description to see significant improvements'
      );
    }

    return {
      ...summary,
      suggestedNextSteps,
    };
  }

  /**
   * End conversation early (user-requested)
   */
  endConversation(state: ConversationState): {
    finalProfile: ActivityProfile;
    summary: ConversationSummaryOutput;
    closingMessage: string;
  } {
    const closingMessage = conversationManager.generateClosingMessage(state, 'user_requested');
    const finalProfile = conversationManager.finalizeProfile(state);
    const summary = this.getConversationSummary({
      ...state,
      currentProfile: finalProfile,
    });

    return {
      finalProfile,
      summary,
      closingMessage,
    };
  }

  /**
   * Resume a paused conversation
   *
   * Useful when a student returns to continue a conversation
   * they started earlier.
   */
  resumeConversation(state: ConversationState): {
    welcomeBackMessage: string;
    nextQuestion: string;
    state: ConversationState;
  } {
    // Generate a welcome back message
    const welcomeBackMessage = `Welcome back! Let's continue where we left off with your ${state.activityTitle}. ` +
      `So far, we've learned a lot, but there's more to explore.`;

    // Generate next question
    const questionResult = questionGeneratorService.generateNextQuestion({
      state,
      maxQuestions: 3,
    });

    // Record the question
    const updatedState = conversationManager.recordQuestion(
      state,
      questionResult.nextQuestion.question,
      questionResult.nextQuestion.targetField,
      questionResult.nextQuestion.category
    );

    return {
      welcomeBackMessage,
      nextQuestion: questionResult.nextQuestion.question,
      state: updatedState,
    };
  }

  /**
   * Assess whether an activity needs a conversation
   *
   * Uses profile completeness and scoring potential to determine
   * if we should prompt the student to discuss this activity.
   */
  assessConversationNeed(
    profile: ActivityProfile,
    context?: {
      isSpike?: boolean;
      currentDescriptionScore?: number;
      portfolioRole?: 'highlight' | 'support' | 'filler';
    }
  ): {
    shouldInitiate: boolean;
    trigger: ConversationTrigger;
    urgency: 'high' | 'medium' | 'low';
    rationale: string;
  } {
    const priority = activityProfileService.assessDevelopmentPriority(profile, context);
    const completeness = activityProfileService.calculateCompleteness(profile);

    // Determine trigger and urgency
    if (context?.isSpike && completeness.overall < 60) {
      return {
        shouldInitiate: true,
        trigger: 'spike_candidate',
        urgency: 'high',
        rationale: `Your spike activity "${profile.activityTitle}" needs more depth to showcase its significance`,
      };
    }

    if (context?.portfolioRole === 'highlight' && completeness.overall < 50) {
      return {
        shouldInitiate: true,
        trigger: 'high_potential_activity',
        urgency: 'high',
        rationale: `"${profile.activityTitle}" is a portfolio highlight but needs more detail to shine`,
      };
    }

    // Time investment mismatch
    const hours = profile.facts.duration.hoursPerWeek;
    const years = profile.facts.duration.totalYears;
    const totalInvestment = hours * 40 * years;
    if (totalInvestment > 200 && completeness.overall < 40) {
      return {
        shouldInitiate: true,
        trigger: 'time_investment_mismatch',
        urgency: 'medium',
        rationale: `You've invested ${totalInvestment}+ hours in "${profile.activityTitle}" — let's capture what made it worthwhile`,
      };
    }

    // Description improvement opportunity
    if (context?.currentDescriptionScore && context.currentDescriptionScore < 6) {
      return {
        shouldInitiate: true,
        trigger: 'description_improvement',
        urgency: 'medium',
        rationale: `Your "${profile.activityTitle}" description could be stronger with more specific details`,
      };
    }

    // General gap detection
    if (completeness.overall < 30) {
      return {
        shouldInitiate: true,
        trigger: 'system_detected_gap',
        urgency: 'low',
        rationale: `We don't have much detail about "${profile.activityTitle}" yet`,
      };
    }

    // Scoring opportunity
    if (priority === 'high') {
      return {
        shouldInitiate: true,
        trigger: 'scoring_opportunity',
        urgency: 'medium',
        rationale: `Developing "${profile.activityTitle}" further could improve your portfolio scores`,
      };
    }

    return {
      shouldInitiate: false,
      trigger: 'system_detected_gap',
      urgency: 'low',
      rationale: `"${profile.activityTitle}" profile is sufficient for now`,
    };
  }

  /**
   * Get conversation analytics
   *
   * Useful for understanding engagement patterns and
   * optimizing the conversation flow.
   */
  getConversationAnalytics(state: ConversationState): {
    totalTurns: number;
    avgResponseLength: number;
    extractionQualityTrend: string[];
    phasesVisited: string[];
    fieldsPopulated: number;
    quotesCapture: number;
    engagementLevel: 'high' | 'medium' | 'low';
  } {
    const responses = state.responsesReceived;
    const avgResponseLength = responses.length > 0
      ? responses.reduce((sum, r) => sum + r.response.split(' ').length, 0) / responses.length
      : 0;

    const extractionQualityTrend = responses.map(r => r.extraction.extractionQuality);

    const phasesVisited = [...new Set([
      'opening',
      ...responses.map((_, i) => {
        // Estimate phase based on turn number
        const turnNum = i + 1;
        if (turnNum <= 2) return 'opening';
        if (turnNum <= 5) return 'fact_gathering';
        if (turnNum <= 8) return 'story_exploration';
        if (turnNum <= 11) return 'meaning_reflection';
        return 'impact_assessment';
      }),
    ])];

    const fieldsPopulated = state.extractedInfo.fields.length;
    const quotesCapture = state.extractedInfo.quotes.length;

    // Determine engagement level
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    if (avgResponseLength > 50 && extractionQualityTrend.filter(q => q === 'rich').length > responses.length / 2) {
      engagementLevel = 'high';
    } else if (avgResponseLength < 15 || extractionQualityTrend.filter(q => q === 'sparse' || q === 'empty').length > responses.length / 2) {
      engagementLevel = 'low';
    }

    return {
      totalTurns: state.totalTurns,
      avgResponseLength: Math.round(avgResponseLength),
      extractionQualityTrend,
      phasesVisited,
      fieldsPopulated,
      quotesCapture,
      engagementLevel,
    };
  }

  /**
   * Determine if we should use the dynamic conversation engine
   *
   * The dynamic engine provides better quality for challenging patterns,
   * but adds latency and cost. We use it when:
   * - Student shows challenging patterns (humble, reluctant, terse)
   * - Extraction quality is poor
   * - We're in rescue mode
   *
   * We DON'T use it when:
   * - Student is engaged (don't slow them down)
   * - Extraction is going well
   * - First 1-2 turns (not enough context yet)
   */
  private shouldUseDynamicEngine(
    dynamics: ConversationDynamics,
    extraction: ExtractionResult
  ): boolean {
    // Skip dynamic engine for engaged students in flow
    if (dynamics.detectedPattern === 'engaged' && dynamics.richExtractionStreak >= 1) {
      return false;
    }

    // Skip in first turn - not enough context
    if (dynamics.sparseExtractionStreak === 0 && dynamics.richExtractionStreak === 0) {
      return false;
    }

    // Use dynamic engine for challenging patterns
    if (['humble', 'reluctant', 'terse'].includes(dynamics.detectedPattern)) {
      return true;
    }

    // Use dynamic engine after sparse extractions
    if (dynamics.sparseExtractionStreak >= 1) {
      return true;
    }

    // Use dynamic engine if rescue mode is active
    if (dynamics.activeModes.includes('rescue_storytelling')) {
      return true;
    }

    // Use dynamic engine for emotional validation needs
    if (dynamics.activeModes.includes('emotional_validation')) {
      return true;
    }

    // Default: use template-based for efficiency
    return false;
  }

  /**
   * Build a list of key extracted highlights for context
   */
  private buildExtractedHighlights(state: ConversationState): string[] {
    const highlights: string[] = [];
    const profile = state.currentProfile;

    // Add scale highlights
    if (profile.facts.scale.peopleDirectlyImpacted > 0) {
      highlights.push(`Impacted ${profile.facts.scale.peopleDirectlyImpacted} people`);
    }
    if (profile.facts.scale.teamSize > 0) {
      highlights.push(`Team of ${profile.facts.scale.teamSize}`);
    }
    if (profile.facts.scale.resourcesCreated > 0) {
      highlights.push(`Created ${profile.facts.scale.resourcesCreated} resources`);
    }

    // Add roles
    if (profile.facts.roles.length > 0) {
      const roles = profile.facts.roles.map(r => r.role).join(', ');
      highlights.push(`Roles: ${roles}`);
    }

    // Add recognition
    if (profile.facts.recognition.length > 0) {
      const recognition = profile.facts.recognition.map(r => r.name).join(', ');
      highlights.push(`Recognition: ${recognition}`);
    }

    // Add before/after if present
    if (profile.impact.beforeAfter) {
      highlights.push(`Before/After: ${profile.impact.beforeAfter.before} → ${profile.impact.beforeAfter.after}`);
    }

    // Add key moments
    if (profile.story.keyMoments.length > 0) {
      highlights.push(`Key moment: ${profile.story.keyMoments[0].description}`);
    }

    return highlights;
  }

  /**
   * Accumulate token usage in conversation state
   * Uses Sonnet 4.5 pricing: $3/MTok input, $15/MTok output
   */
  private accumulateTokenUsage(
    state: ConversationState,
    tokens: { inputTokens: number; outputTokens: number }
  ): ConversationState {
    const currentUsage = state.tokenUsage || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCost: 0,
    };

    const newInputTotal = currentUsage.totalInputTokens + tokens.inputTokens;
    const newOutputTotal = currentUsage.totalOutputTokens + tokens.outputTokens;

    // Calculate cost: $3/MTok input, $15/MTok output for Sonnet 4.5
    const inputCost = (newInputTotal / 1_000_000) * 3;
    const outputCost = (newOutputTotal / 1_000_000) * 15;
    const totalCost = inputCost + outputCost;

    return {
      ...state,
      tokenUsage: {
        totalInputTokens: newInputTotal,
        totalOutputTokens: newOutputTotal,
        estimatedCost: totalCost,
      },
    };
  }
}

// Export singleton
export const activityProfileChatService = new ActivityProfileChatService();
