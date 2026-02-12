/**
 * Capability Conversation Engine
 *
 * The main orchestrator for conversational capability profiling.
 * Manages the conversation flow, extracts insights, and builds the qualitative profile.
 *
 * Philosophy:
 * - Guide the conversation intelligently based on quantitative analysis
 * - Extract insights conservatively and incrementally
 * - Build understanding through natural dialogue
 * - Synthesize quantitative + qualitative into a unified profile
 *
 * NEW: Dynamic conversation flow with engagement detection:
 * - Detect student engagement level and adapt responses
 * - Track progress granularly across categories
 * - Rephrase questions when student is confused
 * - Probe deeper when highly engaged
 * - Smart topic transitions based on engagement
 */

import { callClaude } from '../../../../../../lib/llm/claude';
import type { NuancedCapabilityAnalysis } from '../nuancedCapabilityAnalyzer';
import type { SubjectArea } from '../types';
import { GPA_TO_GRADE } from '../types';
import type { DeepAcademicReport } from '../deepAcademicReportTypes';

import {
  detectTopics,
  reprioritizeTopics,
  getNextTopic,
  completeTopicWithLearnings,
  formatSubject,
  // Cross-subject pattern detection
  detectCrossSubjectPatterns,
  crossSubjectPatternsToTopics,
  // Report-derived topics
  generateReportTopics,
} from './topicDetector';

import {
  extractInsights,
  calibrateConfidence,
  type ExtractionResult,
} from './insightExtractor';

import {
  synthesizeProfile,
  type SynthesizedCapabilityProfile,
} from './profileSynthesizer';

// NEW: Engagement detection system
import {
  assessEngagementHeuristic,
  assessEngagementWithLLM,
  analyzeEngagementTrend,
  getLowEngagementStreak,
  needsAdaptation,
} from './engagementDetector';

// NEW: Dynamic response generation
import {
  generateDynamicResponse,
  generateRephrasedQuestion,
  generateAcknowledgment,
  type GenerateResponseInput,
} from './dynamicResponseGenerator';

// NEW: Progress tracking
import {
  initializeProgress,
  updateProgress,
  summarizeUnderstanding,
} from './progressTracker';

import type {
  ConversationState,
  ConversationPhase,
  ConversationTopic,
  ConversationTurn,
  ConversationOpener,
  ConversationResponse,
  ResponseType,
  QualitativeInsights,
  CourseAnnotation,
  SubjectInsight,
  ExtractedInsight,
  StudentSelfAwareness,
  ProfileCompleteness,
  QualitativeAdjustment,
  RoadmapAdjustment,
  // NEW: Dynamic conversation types
  EngagementAssessment,
  ConversationFlowState,
  ConversationProgress,
  EnhancedConversationState,
  StudentConversationPreferences,
  ResponseStrategy,
} from './types';

// ============================================================================
// RESPONSE GENERATION PROMPTS
// ============================================================================

const RESPONSE_SYSTEM_PROMPT = `You are a friendly, empathetic academic advisor having a conversation with a high school student about their academic experiences. Your goal is to understand the CONTEXT behind their grades - effort, circumstances, feelings, and future intentions.

KEY PRINCIPLES:
1. Be conversational and warm, not clinical
2. Acknowledge what they share with genuine interest
3. Ask follow-up questions naturally, not like an interrogation
4. Show you've heard them by referencing what they said
5. Keep responses concise - 2-3 sentences max for most turns
6. Never judge or criticize - you're here to understand

TONE:
- Supportive and encouraging
- Curious without being invasive
- Casual but respectful
- Student-focused, not data-focused

When transitioning to a new topic, do so smoothly. Don't abruptly change subjects.
When acknowledging, be specific about what you heard.
When asking follow-ups, connect them to what they just said.`;

function buildResponsePrompt(
  context: {
    studentMessage: string;
    currentTopic: ConversationTopic | null;
    extractedInsights: ExtractedInsight[];
    nextTopic: ConversationTopic | null;
    conversationHistory: ConversationTurn[];
    phase: ConversationPhase;
    completionProgress: number;
  }
): string {
  const recentHistory = context.conversationHistory.slice(-6);
  const historyText = recentHistory
    .map((turn) => `${turn.role === 'ai' ? 'You' : 'Student'}: ${turn.message}`)
    .join('\n');

  return `CONVERSATION HISTORY:
${historyText || '(Start of conversation)'}

STUDENT'S LATEST MESSAGE:
"${context.studentMessage}"

INSIGHTS EXTRACTED:
${context.extractedInsights.length > 0
    ? context.extractedInsights.map((i) => `- ${i.type}: ${JSON.stringify(i.values)} (confidence: ${i.extractionConfidence}%)`).join('\n')
    : '(No clear insights extracted yet)'}

CURRENT TOPIC: ${context.currentTopic ? context.currentTopic.context : 'None'}
NEXT TOPIC TO EXPLORE: ${context.nextTopic ? context.nextTopic.primaryQuestion : 'None - wrapping up'}

CONVERSATION PHASE: ${context.phase}
COMPLETION PROGRESS: ${context.completionProgress}%

Generate a response that:
1. ${context.extractedInsights.length > 0 ? 'Acknowledges what they shared' : 'Encourages them to share more'}
2. ${context.nextTopic ? 'Naturally transitions to or asks about the next topic' : 'Wraps up the conversation warmly'}
3. Is 2-4 sentences maximum
4. Maintains a warm, conversational tone

If there are follow-up questions needed on the current topic, ask them. Otherwise, transition to the next topic.

Return ONLY your response message, nothing else.`;
}

// ============================================================================
// CONVERSATION ENGINE CLASS
// ============================================================================

export interface ConversationEngineOptions {
  maxTopics?: number;
  intendedMajor?: string;
  responseModel?: 'haiku' | 'sonnet';
  extractionModel?: 'haiku' | 'sonnet';
  /** NEW: Enable dynamic engagement-based adaptation */
  enableDynamicFlow?: boolean;
  /** NEW: Use LLM for engagement detection (more accurate but slower) */
  useLLMEngagement?: boolean;
  /** NEW: Enable cross-subject pattern detection */
  detectCrossSubjectPatterns?: boolean;
  /** Pre-generated deep academic report for context-rich coaching */
  deepAcademicReport?: DeepAcademicReport;
}

export interface ProcessTurnResult {
  success: boolean;
  response: ConversationResponse;
  state: ConversationState;
  qualitativeInsights: QualitativeInsights;
  /** NEW: Engagement assessment for this turn */
  engagement?: EngagementAssessment;
  /** NEW: Detailed progress tracking */
  progress?: ConversationProgress;
  /** NEW: Strategy used for response */
  responseStrategy?: ResponseStrategy;
  error?: string;
}

export interface InitializeResult {
  success: boolean;
  opener: ConversationOpener;
  state: ConversationState;
  qualitativeInsights: QualitativeInsights;
  /** NEW: Initial progress tracking */
  progress?: ConversationProgress;
  error?: string;
}

/**
 * Main conversation engine for capability profiling.
 * Now with dynamic engagement-based conversation flow.
 */
export class CapabilityConversationEngine {
  private options: Required<Omit<ConversationEngineOptions, 'deepAcademicReport'>> & { deepAcademicReport?: DeepAcademicReport };
  private engagementHistory: EngagementAssessment[] = [];
  private progress: ConversationProgress;
  private studentPreferences: StudentConversationPreferences;
  /** NEW: Track consecutive brief responses to avoid over-reacting to single brief answers */
  private consecutiveBriefResponses: number = 0;
  /** Pre-generated deep academic report for context-rich coaching */
  private deepAcademicReport?: DeepAcademicReport;

  constructor(options: ConversationEngineOptions = {}) {
    this.deepAcademicReport = options.deepAcademicReport;
    this.options = {
      maxTopics: options.maxTopics ?? 15,
      intendedMajor: options.intendedMajor ?? '',
      responseModel: options.responseModel ?? 'haiku',
      extractionModel: options.extractionModel ?? 'haiku',
      enableDynamicFlow: options.enableDynamicFlow ?? true, // Default to dynamic
      useLLMEngagement: options.useLLMEngagement ?? false, // Heuristic by default for speed
      detectCrossSubjectPatterns: options.detectCrossSubjectPatterns ?? true,
      deepAcademicReport: options.deepAcademicReport,
    };

    // Initialize progress tracking
    this.progress = initializeProgress();

    // Initialize student preferences (will be learned during conversation)
    this.studentPreferences = {
      questionStyle: 'mixed',
      exchangeLength: 'moderate',
      emotionalComfort: 'neutral',
      examplePreference: 'prefers_direct',
      validationNeed: 'moderate',
    };
  }

  // -------------------------------------------------------------------------
  // INITIALIZE CONVERSATION
  // -------------------------------------------------------------------------

  /**
   * Initialize a new conversation from quantitative analysis.
   */
  async initialize(
    quantitativeAnalysis: NuancedCapabilityAnalysis
  ): Promise<InitializeResult> {
    try {
      // Detect initial topics to explore
      let topics = detectTopics(quantitativeAnalysis, {
        maxTopics: this.options.maxTopics,
        intendedMajor: this.options.intendedMajor || undefined,
        prioritizeAnomalies: true,
      });

      // NEW: Detect cross-subject patterns and add as topics
      if (this.options.detectCrossSubjectPatterns) {
        const crossSubjectPatterns = detectCrossSubjectPatterns(quantitativeAnalysis);
        if (crossSubjectPatterns.length > 0) {
          // Create a topic ID generator that continues from where detectTopics left off
          let patternTopicId = topics.length + 1;
          const makePatternTopicId = () => `topic_pattern_${patternTopicId++}`;
          const patternTopics = crossSubjectPatternsToTopics(crossSubjectPatterns, makePatternTopicId);
          // Interleave pattern topics with regular topics for variety
          topics = this.interleaveTopics(topics, patternTopics);
        }
      }

      // Generate topics from deep academic report (if available)
      if (this.deepAcademicReport) {
        let reportTopicId = topics.length + 1;
        const makeReportTopicId = () => `topic_report_${reportTopicId++}`;
        const reportTopics = generateReportTopics(this.deepAcademicReport, makeReportTopicId);
        if (reportTopics.length > 0) {
          topics = this.interleaveTopics(topics, reportTopics);
        }
      }

      // Create initial state with persisted fields initialized
      const state: ConversationState = {
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phase: 'introduction',
        pendingTopics: topics.slice(1), // All but the first
        currentTopic: topics[0] || null,
        completedTopics: [],
        turnCount: 0,
        lastActivityAt: new Date(),
        isComplete: false,
        completionProgress: 0,
        // PERSISTENCE: Initialize empty persisted state
        usedAcknowledgments: new Set(),
        askedQuestionKeys: new Set(),
        personalDisclosures: [],
        discussedSubjects: new Set(),
        roadmapAdjustments: [],
      };

      // Create empty qualitative insights
      const qualitativeInsights = this.createEmptyQualitativeInsights();

      // Generate conversation opener
      const opener = this.generateOpener(quantitativeAnalysis, topics);

      // Record the AI's opening turn
      qualitativeInsights.conversationHistory.push({
        id: `turn_${state.turnCount}`,
        timestamp: new Date(),
        role: 'ai',
        message: opener.message,
        topic: state.currentTopic || undefined,
      });

      state.turnCount++;

      // Initialize progress tracking
      this.progress = initializeProgress();

      return {
        success: true,
        opener,
        state,
        qualitativeInsights,
        progress: this.progress,
      };
    } catch (error) {
      console.error('[ConversationEngine] Initialize failed:', error);
      return {
        success: false,
        opener: {
          message: "Hi! I'd love to learn more about your academic experiences. What subjects or classes have been most interesting to you?",
          suggestedTopics: [],
          initialTopicQueue: [],
        },
        state: this.createDefaultState(),
        qualitativeInsights: this.createEmptyQualitativeInsights(),
        progress: initializeProgress(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Interleave cross-subject pattern topics with regular topics.
   */
  private interleaveTopics(
    regularTopics: ConversationTopic[],
    patternTopics: ConversationTopic[]
  ): ConversationTopic[] {
    const result: ConversationTopic[] = [];
    const patternInterval = Math.max(3, Math.floor(regularTopics.length / (patternTopics.length + 1)));

    let patternIndex = 0;
    for (let i = 0; i < regularTopics.length; i++) {
      result.push(regularTopics[i]);

      // Insert a pattern topic every few regular topics
      if ((i + 1) % patternInterval === 0 && patternIndex < patternTopics.length) {
        result.push(patternTopics[patternIndex++]);
      }
    }

    // Add remaining pattern topics
    while (patternIndex < patternTopics.length) {
      result.push(patternTopics[patternIndex++]);
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // PROCESS STUDENT TURN
  // -------------------------------------------------------------------------

  /**
   * Process a student's message and generate a response.
   * Now with dynamic engagement-based adaptation.
   */
  async processTurn(
    studentMessage: string,
    state: ConversationState,
    qualitativeInsights: QualitativeInsights,
    quantitativeAnalysis: NuancedCapabilityAnalysis
  ): Promise<ProcessTurnResult> {
    try {
      // Record student turn
      qualitativeInsights.conversationHistory.push({
        id: `turn_${state.turnCount}`,
        timestamp: new Date(),
        role: 'student',
        message: studentMessage,
        topic: state.currentTopic || undefined,
      });
      state.turnCount++;
      state.lastActivityAt = new Date();

      // NEW: Assess engagement first (this guides everything else)
      const engagement = await this.assessEngagement(
        studentMessage,
        qualitativeInsights.conversationHistory,
        state.currentTopic?.context
      );

      // Track engagement history
      this.engagementHistory.push(engagement);
      if (this.engagementHistory.length > 10) {
        this.engagementHistory.shift(); // Keep last 10
      }

      // NEW: Learn student preferences from engagement patterns
      this.updateStudentPreferences(engagement, studentMessage);

      // Extract insights from student message
      let extractionResult: ExtractionResult = { success: false, insights: [] };
      if (state.currentTopic) {
        extractionResult = await extractInsights(
          studentMessage,
          state.currentTopic,
          {
            previousContext: this.buildPreviousContext(qualitativeInsights.conversationHistory),
            existingInsights: this.summarizeExistingInsights(qualitativeInsights),
            model: this.options.extractionModel,
          }
        );
      }

      // Calibrate and store insights
      const calibratedInsights = extractionResult.insights.map((insight) => ({
        ...insight,
        extractionConfidence: calibrateConfidence(insight, studentMessage),
      }));

      qualitativeInsights.allExtractedInsights.push(...calibratedInsights);

      // Update course annotations and subject insights
      this.updateProfileFromInsights(calibratedInsights, qualitativeInsights);

      // Detect roadmap-relevant adjustments from student's message
      this.detectRoadmapAdjustments(studentMessage, state, state.currentTopic);

      // NEW: Update progress tracking with granular category tracking
      this.progress = updateProgress(
        this.progress,
        calibratedInsights,
        qualitativeInsights,
        engagement,
        state.completedTopics,
        state.pendingTopics
      );

      // Update topic status based on engagement and insights
      if (state.currentTopic) {
        // NEW: Topic completion is engagement-aware
        const shouldCompleteTopic = this.shouldCompleteTopic(
          state.currentTopic,
          calibratedInsights,
          engagement
        );

        if (shouldCompleteTopic) {
          const learnings = calibratedInsights
            .map((i) => i.supportingQuote || JSON.stringify(i.values))
            .join('; ');
          state.currentTopic = completeTopicWithLearnings(state.currentTopic, learnings);
          state.completedTopics.push(state.currentTopic);
        }
      }

      // NEW: Smart topic selection based on engagement
      let nextTopic: ConversationTopic | null = null;
      let offerTopicChoices = false; // NEW: Flag to offer choices instead of auto-switching

      // Check if this is a brief/low-effort response
      // This catches both 'disengaged' type AND 'neutral' with one_word_answers indicator
      const isBriefResponse = engagement.type === 'disengaged' ||
        (engagement.type === 'neutral' && engagement.indicators.some(i => i.type === 'one_word_answers'));

      // Track consecutive brief responses - only offer topic choices after 2+ in a row
      // This avoids over-reacting to single brief answers (student might be thinking, tired, or naturally concise)
      if (isBriefResponse) {
        this.consecutiveBriefResponses++;
      } else {
        this.consecutiveBriefResponses = 0; // Reset on engaged response
      }

      if (engagement.wantsTopicChange || engagement.type === 'resistant') {
        // Student explicitly wants to move on - skip to different topic type/subject
        nextTopic = this.findDifferentTopicType(state.pendingTopics, state.currentTopic);
        this.consecutiveBriefResponses = 0; // Reset counter
      } else if (isBriefResponse && this.consecutiveBriefResponses >= 2) {
        // CHANGED: Only offer topic choices after 2+ consecutive brief responses
        // First brief response: continue normally, give benefit of doubt
        // Second+ brief response: offer choices, student may want to change direction
        offerTopicChoices = true;
        // Still get the next topic for context, but we'll offer it as a choice
        nextTopic = getNextTopic(state.pendingTopics);
      } else if (isBriefResponse) {
        // First brief response - continue normally but probe gently
        // Don't assume disengagement from a single brief answer
        nextTopic = getNextTopic(state.pendingTopics);
      } else if (engagement.type === 'highly_engaged' && state.currentTopic) {
        // Highly engaged - maybe stay on this topic with follow-up
        const hasFollowUp = state.currentTopic.followUpQuestions.length > 0;
        if (hasFollowUp && calibratedInsights.length > 0) {
          // Create a follow-up topic instead of moving on
          nextTopic = this.createFollowUpTopic(state.currentTopic);
        } else {
          nextTopic = getNextTopic(state.pendingTopics);
        }
      } else {
        // Reprioritize remaining topics based on what was mentioned
        const mentionedSubjects = this.extractMentionedSubjects(studentMessage);
        state.pendingTopics = reprioritizeTopics(state.pendingTopics, {
          mentionedSubjects,
          lastTopicType: state.currentTopic?.type,
        });
        nextTopic = getNextTopic(state.pendingTopics);
      }

      // Update conversation phase
      state.phase = this.determinePhase(state);

      // Calculate completion progress using the new progress tracker
      const completionProgress = this.progress.overallProgress;
      state.completionProgress = completionProgress;

      // Check if conversation should end
      const shouldContinue = completionProgress < 85 && nextTopic !== null && state.turnCount < 30;

      // Generate dynamic response based on engagement
      let response: ConversationResponse;
      let responseStrategy: ResponseStrategy = 'continue_normally';

      if (this.options.enableDynamicFlow) {
        const generateInput: GenerateResponseInput = {
          studentMessage,
          engagement,
          extractedInsights: calibratedInsights,
          currentTopic: state.currentTopic,
          nextTopic,
          conversationHistory: qualitativeInsights.conversationHistory,
          progress: this.progress,
          studentPreferences: this.studentPreferences,
          shouldContinue,
          // Flag to offer topic choices instead of auto-switching
          // Used when we detect potential disengagement but want to give student agency
          offerTopicChoices,
          // CRITICAL: Pass conversation state for persistence
          conversationState: state,
          // Pass deep academic report for grounded coaching context
          deepAcademicReport: this.deepAcademicReport,
        };

        const dynamicResponse = await generateDynamicResponse(generateInput, {
          model: this.options.responseModel,
          useLLM: true,
        });

        // CRITICAL: Write back the updated persisted state
        if (dynamicResponse.updatedPersistedState) {
          state.usedAcknowledgments = dynamicResponse.updatedPersistedState.usedAcknowledgments;
          state.askedQuestionKeys = dynamicResponse.updatedPersistedState.askedQuestionKeys;
          state.personalDisclosures = dynamicResponse.updatedPersistedState.personalDisclosures;
          state.discussedSubjects = dynamicResponse.updatedPersistedState.discussedSubjects;
        }

        responseStrategy = dynamicResponse.strategy;
        response = {
          message: dynamicResponse.message,
          type: this.strategyToResponseType(dynamicResponse.strategy),
          extractedInsights: calibratedInsights,
          profileUpdates: [],
          nextTopic: nextTopic || undefined,
          shouldContinue,
          completionProgress,
          suggestedResponses: dynamicResponse.suggestedResponses,
        };
      } else {
        // Fallback to original response generation
        response = await this.generateResponse({
          studentMessage,
          currentTopic: state.currentTopic,
          extractedInsights: calibratedInsights,
          nextTopic,
          conversationHistory: qualitativeInsights.conversationHistory,
          phase: state.phase,
          completionProgress,
          shouldContinue,
        });
      }

      // Record AI turn
      qualitativeInsights.conversationHistory.push({
        id: `turn_${state.turnCount}`,
        timestamp: new Date(),
        role: 'ai',
        message: response.message,
        topic: nextTopic || undefined,
        extractedInsights: calibratedInsights,
      });
      state.turnCount++;

      // Update current topic
      if (nextTopic && shouldContinue) {
        // Mark as in_progress
        const pendingIndex = state.pendingTopics.findIndex((t) => t.id === nextTopic.id);
        if (pendingIndex >= 0) {
          state.pendingTopics[pendingIndex] = { ...nextTopic, status: 'in_progress' };
        }
        state.currentTopic = { ...nextTopic, status: 'in_progress' };
      } else {
        state.currentTopic = null;
      }

      // Update completeness metrics
      qualitativeInsights.completeness = this.calculateCompleteness(qualitativeInsights, state);

      // Mark complete if done
      if (!shouldContinue) {
        state.isComplete = true;
        state.phase = 'completion';
      }

      return {
        success: true,
        response,
        state,
        qualitativeInsights,
        engagement,
        progress: this.progress,
        responseStrategy,
      };
    } catch (error) {
      console.error('[ConversationEngine] ProcessTurn failed:', error);
      return {
        success: false,
        response: {
          message: "That's interesting! Tell me more about how you felt in that class.",
          type: 'encouragement',
          extractedInsights: [],
          profileUpdates: [],
          shouldContinue: true,
          completionProgress: state.completionProgress,
        },
        state,
        qualitativeInsights,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // -------------------------------------------------------------------------
  // NEW: ENGAGEMENT ASSESSMENT
  // -------------------------------------------------------------------------

  /**
   * Assess student engagement in the current message.
   */
  private async assessEngagement(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    currentTopic?: string
  ): Promise<EngagementAssessment> {
    if (this.options.useLLMEngagement) {
      return assessEngagementWithLLM(
        studentMessage,
        conversationHistory,
        currentTopic,
        { model: this.options.extractionModel }
      );
    }
    return assessEngagementHeuristic(studentMessage, conversationHistory, currentTopic);
  }

  /**
   * Learn student preferences from engagement patterns.
   */
  private updateStudentPreferences(
    engagement: EngagementAssessment,
    message: string
  ): void {
    // Update question style preference based on response quality
    if (engagement.depthLevel === 'deep') {
      this.studentPreferences.questionStyle = 'open_ended';
    } else if (engagement.indicators.some(i => i.type === 'one_word_answers')) {
      // They might need more specific questions
      this.studentPreferences.questionStyle = 'specific';
    }

    // Update emotional comfort
    if (engagement.emotionalTone === 'guarded') {
      this.studentPreferences.emotionalComfort = 'guarded';
    } else if (engagement.emotionalTone === 'positive' || engagement.emotionalTone === 'negative') {
      // Sharing emotions = comfortable
      this.studentPreferences.emotionalComfort = 'comfortable';
    }

    // Update validation need
    if (engagement.type === 'disengaged' || engagement.type === 'neutral') {
      this.studentPreferences.validationNeed = 'high';
    } else if (engagement.type === 'highly_engaged') {
      this.studentPreferences.validationNeed = 'low';
    }

    // Exchange length preference
    const wordCount = message.split(/\s+/).length;
    if (wordCount > 40) {
      this.studentPreferences.exchangeLength = 'extended';
    } else if (wordCount < 10) {
      this.studentPreferences.exchangeLength = 'brief';
    }
  }

  /**
   * Determine if current topic should be marked complete.
   */
  private shouldCompleteTopic(
    topic: ConversationTopic,
    insights: ExtractedInsight[],
    engagement: EngagementAssessment
  ): boolean {
    // Complete if we got insights
    if (insights.length > 0) {
      return true;
    }

    // Complete if student wants to move on
    if (engagement.wantsTopicChange || engagement.type === 'resistant') {
      return true;
    }

    // Don't complete if confused - we should retry
    if (engagement.isConfused) {
      return false;
    }

    // Complete if low engagement and we've tried
    if (engagement.level < 30) {
      return true;
    }

    return false;
  }

  /**
   * Detect roadmap-relevant adjustments from a student message.
   * Checks if the student's response relates to any roadmap recommendation
   * and detects sentiment toward recommended courses/priorities.
   */
  private detectRoadmapAdjustments(
    studentMessage: string,
    state: ConversationState,
    currentTopic: ConversationTopic | null
  ): void {
    if (!this.deepAcademicReport) return;

    const msg = studentMessage.toLowerCase();
    const roadmap = this.deepAcademicReport.strategicRoadmap;

    // Initialize if not present
    if (!state.roadmapAdjustments) {
      state.roadmapAdjustments = [];
    }

    // Check recommended courses
    for (const rec of roadmap.courseStrategy.recommended) {
      const courseLower = rec.course.toLowerCase();
      // Only match if the course name is actually in the message
      if (!msg.includes(courseLower) && !courseLower.split(' ').some(w => w.length > 3 && msg.includes(w))) {
        continue;
      }

      // Detect sentiment
      const positiveSignals = ['excited', 'interested', 'want to', 'looking forward', 'love', 'enjoy', 'sounds good', 'great idea'];
      const negativeSignals = ['worried', 'scared', 'nervous', 'don\'t want', 'hate', 'too hard', 'not sure', 'concerned', 'struggle'];

      const isPositive = positiveSignals.some(s => msg.includes(s));
      const isNegative = negativeSignals.some(s => msg.includes(s));

      const sentiment: RoadmapAdjustment['studentSentiment'] =
        isPositive && !isNegative ? 'positive' :
        isNegative && !isPositive ? 'negative' : 'uncertain';

      state.roadmapAdjustments.push({
        type: isPositive ? 'course_interest' : isNegative ? 'course_concern' : 'course_interest',
        description: `Student expressed ${sentiment} sentiment about recommended course: ${rec.course}`,
        originalRecommendation: `${rec.course} (risk: ${rec.risk})`,
        studentSentiment: sentiment,
        turnNumber: state.turnCount,
      });
    }

    // Check roadmap priorities
    for (const priority of roadmap.priorities) {
      const titleLower = priority.title.toLowerCase();
      const actionWords = priority.actionItems.flatMap(a => a.toLowerCase().split(' ').filter(w => w.length > 4));
      const isRelevant = msg.includes(titleLower) || actionWords.some(w => msg.includes(w));

      if (!isRelevant) continue;

      const rethinkSignals = ['actually', 'changed my mind', 'rethink', 'not sure anymore', 'different path', 'reconsidering'];
      const isRethink = rethinkSignals.some(s => msg.includes(s));

      if (isRethink) {
        state.roadmapAdjustments.push({
          type: 'priority_shift',
          description: `Student may be reconsidering priority: ${priority.title}`,
          originalRecommendation: `Priority #${priority.priority}: ${priority.title}`,
          studentSentiment: 'uncertain',
          turnNumber: state.turnCount,
        });
      }
    }

    // Check for major rethink signals
    const majorRethinkSignals = ['different major', 'change my major', 'not sure about my major', 'reconsidering', 'switch to'];
    if (majorRethinkSignals.some(s => msg.includes(s))) {
      state.roadmapAdjustments.push({
        type: 'major_rethink',
        description: 'Student expressed uncertainty about their intended major',
        studentSentiment: 'uncertain',
        turnNumber: state.turnCount,
      });
    }
  }

  /**
   * Find a topic with a different type AND subject than current (for variety).
   * Prioritizes subject diversity to avoid asking about the same subject twice in a row.
   */
  private findDifferentTopicType(
    pendingTopics: ConversationTopic[],
    currentTopic: ConversationTopic | null
  ): ConversationTopic | null {
    if (!currentTopic) {
      return getNextTopic(pendingTopics);
    }

    // PRIORITY 1: Find a topic with a different SUBJECT (most important for variety)
    const currentSubject = currentTopic.scope?.subject;
    if (currentSubject) {
      const differentSubjectTopic = pendingTopics.find(t =>
        t.scope?.subject && t.scope.subject !== currentSubject
      );
      if (differentSubjectTopic) {
        return differentSubjectTopic;
      }
    }

    // PRIORITY 2: Find a topic with a different TYPE
    const differentTypeTopic = pendingTopics.find(t => t.type !== currentTopic.type);
    if (differentTypeTopic) {
      return differentTypeTopic;
    }

    // FALLBACK: Just get the next available topic
    return getNextTopic(pendingTopics);
  }

  /**
   * Create a follow-up topic from current topic.
   */
  private createFollowUpTopic(currentTopic: ConversationTopic): ConversationTopic {
    const followUpQuestion = currentTopic.followUpQuestions[0] || currentTopic.primaryQuestion;

    return {
      id: `follow_up_${currentTopic.id}`,
      type: 'follow_up',
      priority: currentTopic.priority + 10, // Slightly higher priority
      scope: currentTopic.scope,
      context: `Follow-up on ${currentTopic.context}`,
      primaryQuestion: followUpQuestion,
      followUpQuestions: currentTopic.followUpQuestions.slice(1),
      targetInsights: currentTopic.targetInsights,
      status: 'pending',
    };
  }

  /**
   * Convert response strategy to response type.
   */
  private strategyToResponseType(strategy: ResponseStrategy): ResponseType {
    const mapping: Record<ResponseStrategy, ResponseType> = {
      continue_normally: 'follow_up',
      probe_deeper: 'follow_up',
      rephrase_question: 'clarification',
      share_observation: 'acknowledgment',
      validate_and_encourage: 'encouragement',
      offer_examples: 'clarification',
      change_topic: 'transition',
      take_a_break: 'summary',
      summarize_progress: 'summary',
      direct_question: 'follow_up',
      open_ended_invite: 'encouragement',
      offer_topic_choices: 'encouragement', // NEW: Offering choices is an encouraging, agency-giving response
    };
    return mapping[strategy] || 'follow_up';
  }

  // -------------------------------------------------------------------------
  // FINALIZE AND SYNTHESIZE
  // -------------------------------------------------------------------------

  /**
   * Finalize the conversation and synthesize the complete profile.
   */
  finalize(
    state: ConversationState,
    qualitativeInsights: QualitativeInsights,
    quantitativeAnalysis: NuancedCapabilityAnalysis
  ): SynthesizedCapabilityProfile {
    // Build self-awareness assessment
    qualitativeInsights.selfAwarenessAssessment = this.assessSelfAwareness(
      qualitativeInsights,
      quantitativeAnalysis
    );

    // Finalize subject insights
    this.finalizeSubjectInsights(qualitativeInsights);

    // Synthesize with quantitative data
    return synthesizeProfile(quantitativeAnalysis, qualitativeInsights);
  }

  // -------------------------------------------------------------------------
  // RESPONSE GENERATION
  // -------------------------------------------------------------------------

  private async generateResponse(context: {
    studentMessage: string;
    currentTopic: ConversationTopic | null;
    extractedInsights: ExtractedInsight[];
    nextTopic: ConversationTopic | null;
    conversationHistory: ConversationTurn[];
    phase: ConversationPhase;
    completionProgress: number;
    shouldContinue: boolean;
  }): Promise<ConversationResponse> {
    // For completion phase, generate a wrap-up
    if (!context.shouldContinue || context.phase === 'completion') {
      return this.generateCompletionResponse(context);
    }

    try {
      const prompt = buildResponsePrompt({
        studentMessage: context.studentMessage,
        currentTopic: context.currentTopic,
        extractedInsights: context.extractedInsights,
        nextTopic: context.nextTopic,
        conversationHistory: context.conversationHistory,
        phase: context.phase,
        completionProgress: context.completionProgress,
      });

      const model = this.options.responseModel === 'sonnet'
        ? 'claude-sonnet-4-20250514'
        : 'claude-haiku-4-5-20251001';

      const response = await callClaude({
        model,
        system: RESPONSE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.7,
      });

      const responseType = this.determineResponseType(
        context.extractedInsights,
        context.nextTopic,
        context.currentTopic
      );

      return {
        message: response.content.trim(),
        type: responseType,
        extractedInsights: context.extractedInsights,
        profileUpdates: [],
        nextTopic: context.nextTopic || undefined,
        shouldContinue: context.shouldContinue,
        completionProgress: context.completionProgress,
        suggestedResponses: this.generateSuggestedResponses(context.nextTopic),
      };
    } catch (error) {
      console.error('[ConversationEngine] Response generation failed:', error);
      // Fallback response
      return {
        message: context.nextTopic
          ? context.nextTopic.primaryQuestion
          : "That's really helpful to know. Is there anything else you'd like to share about your academic experiences?",
        type: context.nextTopic ? 'transition' : 'encouragement',
        extractedInsights: context.extractedInsights,
        profileUpdates: [],
        nextTopic: context.nextTopic || undefined,
        shouldContinue: context.shouldContinue,
        completionProgress: context.completionProgress,
      };
    }
  }

  private generateCompletionResponse(context: {
    extractedInsights: ExtractedInsight[];
    conversationHistory: ConversationTurn[];
    completionProgress: number;
  }): ConversationResponse {
    const insightCount = context.extractedInsights.length;
    const turnCount = context.conversationHistory.length;

    return {
      message: `Thanks so much for sharing all of this with me! I've learned a lot about your academic journey - your strengths, the challenges you've faced, and how you feel about different subjects. This will really help me give you more personalized guidance going forward. Is there anything else you'd like me to know before we wrap up?`,
      type: 'completion',
      extractedInsights: [],
      profileUpdates: [],
      shouldContinue: false,
      completionProgress: context.completionProgress,
    };
  }

  // -------------------------------------------------------------------------
  // OPENER GENERATION
  // -------------------------------------------------------------------------

  private generateOpener(
    analysis: NuancedCapabilityAnalysis,
    topics: ConversationTopic[]
  ): ConversationOpener {
    // Find notable aspects to mention
    const subjectPatterns = Object.entries(analysis.subjectPatterns);
    const strengths = subjectPatterns
      .filter(([, p]) => p.relativeStrength > 0.1)
      .map(([s]) => formatSubject(s));
    const challenges = subjectPatterns
      .filter(([, p]) => p.relativeStrength < -0.1)
      .map(([s]) => formatSubject(s));

    // Build personalized opener
    let message: string;

    if (strengths.length > 0 && topics.length > 0) {
      const firstTopicSubject = topics[0].scope.subject
        ? formatSubject(topics[0].scope.subject)
        : 'your classes';
      message = `Hi! I've been looking at your academic record and I can see you've had some interesting experiences. I'd love to understand more about the story behind your grades - like what was easy vs. hard, how much effort different classes took, and how you feel about different subjects. Let's start with ${firstTopicSubject}. ${topics[0].primaryQuestion}`;
    } else if (topics.length > 0) {
      message = `Hi! I'd love to learn more about your academic experiences - not just the grades, but how you felt about different classes, how hard you worked, and what you enjoyed or struggled with. ${topics[0].primaryQuestion}`;
    } else {
      message = `Hi! I'd love to understand your academic journey better. Beyond just grades, I'm curious about which classes you've enjoyed, which have been challenging, and how you feel about different subjects. What would you like to start with?`;
    }

    // Generate suggested topics
    const suggestedTopics = topics.slice(0, 3).map((t) => {
      if (t.scope.subject) {
        return `Talk about ${formatSubject(t.scope.subject)}`;
      }
      if (t.scope.course) {
        return `Discuss ${t.scope.course}`;
      }
      return t.context.substring(0, 40) + '...';
    });

    return {
      message,
      suggestedTopics,
      initialTopicQueue: topics,
    };
  }

  // -------------------------------------------------------------------------
  // PROFILE UPDATES
  // -------------------------------------------------------------------------

  private updateProfileFromInsights(
    insights: ExtractedInsight[],
    qualitativeInsights: QualitativeInsights
  ): void {
    for (const insight of insights) {
      // Update course annotation if course-specific
      if (insight.scope.course) {
        this.updateCourseAnnotation(insight, qualitativeInsights);
      }

      // Update subject insight if subject-specific
      if (insight.scope.subject) {
        this.updateSubjectInsight(insight, qualitativeInsights);
      }
    }
  }

  private updateCourseAnnotation(
    insight: ExtractedInsight,
    qualitativeInsights: QualitativeInsights
  ): void {
    const courseKey = insight.scope.course || 'unknown';
    let annotation = qualitativeInsights.courseAnnotations.get(courseKey);

    if (!annotation) {
      annotation = this.createEmptyCourseAnnotation(
        courseKey,
        insight.scope.subject as SubjectArea || 'other'
      );
      qualitativeInsights.courseAnnotations.set(courseKey, annotation);
    }

    // Update with extracted values
    const v = insight.values;
    if (v.effortLevel !== undefined) annotation.effortLevel = v.effortLevel;
    if (v.perceivedDifficulty !== undefined) annotation.perceivedDifficulty = v.perceivedDifficulty;
    if (v.enjoymentLevel !== undefined) annotation.enjoymentLevel = v.enjoymentLevel;
    if (v.engagementLevel !== undefined) annotation.engagementLevel = v.engagementLevel;
    if (v.confidenceLevel !== undefined) annotation.confidenceAfter = v.confidenceLevel;
    if (v.gradeReflectsAbility !== undefined) annotation.gradeReflectsAbility = v.gradeReflectsAbility;
    if (v.gradeReflectsEffort !== undefined) annotation.gradeReflectsEffort = v.gradeReflectsEffort;
    if (v.teacherQuality !== undefined) annotation.teacherQuality = v.teacherQuality;
    if (v.classEnvironment !== undefined) annotation.classEnvironment = v.classEnvironment;
    if (v.intrinsicInterest !== undefined) annotation.intrinsicInterest = v.intrinsicInterest;
    if (v.wouldTakeAgain !== undefined) annotation.wouldTakeAgain = v.wouldTakeAgain;
    if (v.wantsToContinue !== undefined) annotation.wantsToContinue = v.wantsToContinue;
    if (v.externalFactors) {
      annotation.externalCircumstances.push(...v.externalFactors);
    }
    if (insight.supportingQuote) {
      annotation.directQuotes.push(insight.supportingQuote);
    }
    if (v.keyStatements) {
      annotation.keyInsights.push(...v.keyStatements);
    }

    // Update reliability score based on extraction confidence
    annotation.reliabilityScore = Math.max(
      annotation.reliabilityScore,
      insight.extractionConfidence
    );
    annotation.updatedAt = new Date();
  }

  private updateSubjectInsight(
    insight: ExtractedInsight,
    qualitativeInsights: QualitativeInsights
  ): void {
    const subject = insight.scope.subject as SubjectArea;
    if (!subject) return;

    let subjectInsight = qualitativeInsights.subjectInsights.get(subject);

    if (!subjectInsight) {
      subjectInsight = this.createEmptySubjectInsight(subject);
      qualitativeInsights.subjectInsights.set(subject, subjectInsight);
    }

    // Update with extracted values (use weighted average for continuous values)
    const v = insight.values;
    const weight = insight.extractionConfidence / 100;

    if (v.confidenceLevel !== undefined) {
      const newConfidence = (v.confidenceLevel - 1) * 25; // Convert 1-5 to 0-100
      subjectInsight.overallConfidence = this.weightedUpdate(
        subjectInsight.overallConfidence,
        newConfidence,
        weight
      );
    }

    if (v.effortLevel !== undefined) {
      const newEffort = (v.effortLevel - 1) * 25;
      subjectInsight.overallEffort = this.weightedUpdate(
        subjectInsight.overallEffort,
        newEffort,
        weight
      );
    }

    if (v.perceivedDifficulty !== undefined) {
      const newDifficulty = (v.perceivedDifficulty - 1) * 25;
      subjectInsight.perceivedDifficulty = this.weightedUpdate(
        subjectInsight.perceivedDifficulty,
        newDifficulty,
        weight
      );
    }

    if (v.enjoymentLevel !== undefined || insight.sentiment) {
      let interestValue = subjectInsight.overallInterest;
      if (v.enjoymentLevel !== undefined) {
        interestValue = (v.enjoymentLevel - 1) * 25;
      } else if (insight.sentiment) {
        const sentimentMap: Record<string, number> = {
          very_positive: 90,
          positive: 70,
          neutral: 50,
          negative: 30,
          very_negative: 10,
        };
        interestValue = sentimentMap[insight.sentiment] || 50;
      }
      subjectInsight.overallInterest = this.weightedUpdate(
        subjectInsight.overallInterest,
        interestValue,
        weight
      );
    }

    if (v.selfAssessedStrength !== undefined) {
      subjectInsight.selfAssessedStrength = v.selfAssessedStrength;
    }

    if (v.selfAssessedChallenge !== undefined) {
      subjectInsight.selfAssessedChallenge = v.selfAssessedChallenge;
    }

    if (v.wantsToContinue !== undefined) {
      subjectInsight.intendsToContinue = v.wantsToContinue;
    }

    if (v.willingnessToChallenge !== undefined) {
      subjectInsight.willingnessToChallenge = v.willingnessToChallenge;
    }

    if (v.specificFutureCourses) {
      subjectInsight.specificFutureCourses.push(...v.specificFutureCourses);
    }

    if (insight.supportingQuote) {
      subjectInsight.keyStatements.push(insight.supportingQuote);
    }
  }

  private weightedUpdate(current: number, newValue: number, weight: number): number {
    if (current === 50) {
      // Default value - replace with new
      return newValue;
    }
    // Weighted average
    return current * (1 - weight) + newValue * weight;
  }

  // -------------------------------------------------------------------------
  // SELF-AWARENESS ASSESSMENT
  // -------------------------------------------------------------------------

  private assessSelfAwareness(
    qualitativeInsights: QualitativeInsights,
    quantitativeAnalysis: NuancedCapabilityAnalysis
  ): StudentSelfAwareness | null {
    if (qualitativeInsights.subjectInsights.size === 0) {
      return null;
    }

    const blindSpots: Array<{
      area: string;
      theyThink: string;
      dataSuggests: string;
      gapSize: 'small' | 'moderate' | 'large';
    }> = [];

    let overestimateCount = 0;
    let underestimateCount = 0;
    let alignedCount = 0;

    // Compare self-assessment with quantitative data
    for (const [subject, qualInsight] of qualitativeInsights.subjectInsights) {
      const quantPattern = quantitativeAnalysis.subjectPatterns[subject];
      if (!quantPattern) continue;

      const quantStrength = quantPattern.relativeStrength;
      const qualStrength = qualInsight.selfAssessedStrength;
      const qualChallenge = qualInsight.selfAssessedChallenge;

      // Check for mismatches
      if (qualStrength && quantStrength < -0.05) {
        overestimateCount++;
        blindSpots.push({
          area: formatSubject(subject),
          theyThink: 'This is a strength',
          dataSuggests: `Performance is ${(quantStrength * 100).toFixed(0)}% below their average`,
          gapSize: Math.abs(quantStrength) > 0.2 ? 'large' : 'moderate',
        });
      } else if (qualChallenge && quantStrength > 0.1) {
        underestimateCount++;
        blindSpots.push({
          area: formatSubject(subject),
          theyThink: 'This is a challenge',
          dataSuggests: `Performance is ${(quantStrength * 100).toFixed(0)}% above their average`,
          gapSize: quantStrength > 0.25 ? 'large' : 'moderate',
        });
      } else {
        alignedCount++;
      }

      // Check confidence vs performance
      if (qualInsight.overallConfidence < 40 && quantPattern.performanceHistory.avgGPA > 3.5) {
        underestimateCount++;
        blindSpots.push({
          area: `${formatSubject(subject)} confidence`,
          theyThink: `Low confidence (${qualInsight.overallConfidence}%)`,
          dataSuggests: `Grade: ${GPA_TO_GRADE(quantPattern.performanceHistory.avgGPA)}`,
          gapSize: 'moderate',
        });
      }
    }

    const totalComparisons = overestimateCount + underestimateCount + alignedCount;
    const selfPerceptionAccuracy = totalComparisons > 0
      ? Math.round((alignedCount / totalComparisons) * 100)
      : 50;

    let estimationTendency: 'overestimates' | 'underestimates' | 'accurate' | 'inconsistent';
    if (overestimateCount > underestimateCount + alignedCount) {
      estimationTendency = 'overestimates';
    } else if (underestimateCount > overestimateCount + alignedCount) {
      estimationTendency = 'underestimates';
    } else if (alignedCount >= overestimateCount + underestimateCount) {
      estimationTendency = 'accurate';
    } else {
      estimationTendency = 'inconsistent';
    }

    return {
      selfPerceptionAccuracy,
      effortPerceptionAccuracy: 60, // Harder to assess without direct verification
      performancePredictionAccuracy: selfPerceptionAccuracy, // Approximation
      estimationTendency,
      blindSpots,
      narrativeConsistency: 70, // Would require more sophisticated analysis
      explanationGradeAlignment: selfPerceptionAccuracy,
    };
  }

  // -------------------------------------------------------------------------
  // FINALIZATION
  // -------------------------------------------------------------------------

  private finalizeSubjectInsights(qualitativeInsights: QualitativeInsights): void {
    // Calculate effort-grade correlation for each subject
    for (const [subject, insight] of qualitativeInsights.subjectInsights) {
      const relevantAnnotations = Array.from(qualitativeInsights.courseAnnotations.values())
        .filter((a) => a.subject === subject && a.effortLevel !== null);

      if (relevantAnnotations.length >= 2) {
        // Simple correlation approximation
        // Would need actual grade data for true correlation
        const avgEffort = relevantAnnotations.reduce((sum, a) => sum + (a.effortLevel || 3), 0) / relevantAnnotations.length;
        const avgEngagement = relevantAnnotations.reduce((sum, a) => sum + (a.engagementLevel || 3), 0) / relevantAnnotations.length;

        // Effort-grade correlation estimate based on consistency
        insight.effortGradeCorrelation = avgEffort > 3.5 && avgEngagement > 3.5 ? 0.7 : 0.4;
      }

      // Build narrative summary
      insight.narrativeSummary = this.buildSubjectNarrative(insight, qualitativeInsights.courseAnnotations, subject);
    }
  }

  private buildSubjectNarrative(
    insight: SubjectInsight,
    courseAnnotations: Map<string, CourseAnnotation>,
    subject: SubjectArea
  ): string {
    const relevantAnnotations = Array.from(courseAnnotations.values())
      .filter((a) => a.subject === subject);

    const parts: string[] = [];

    // Confidence
    if (insight.overallConfidence > 70) {
      parts.push(`feels confident in ${formatSubject(subject)}`);
    } else if (insight.overallConfidence < 40) {
      parts.push(`feels uncertain about ${formatSubject(subject)}`);
    }

    // Interest
    if (insight.overallInterest > 70) {
      parts.push('genuinely interested in the subject');
    } else if (insight.overallInterest < 30) {
      parts.push('not particularly drawn to this subject');
    }

    // Effort
    if (insight.overallEffort > 70) {
      parts.push('works hard');
    } else if (insight.overallEffort < 30) {
      parts.push("doesn't put in much effort");
    }

    // Future intent
    if (insight.intendsToContinue) {
      parts.push('plans to continue');
    } else if (insight.intendsToContinue === false) {
      parts.push('may not continue');
    }

    if (parts.length === 0) {
      return 'Limited data available.';
    }

    return `Student ${parts.join(', ')}.`;
  }

  // -------------------------------------------------------------------------
  // UTILITY METHODS
  // -------------------------------------------------------------------------

  private createEmptyQualitativeInsights(): QualitativeInsights {
    return {
      courseAnnotations: new Map(),
      subjectInsights: new Map(),
      learningStyleIndicators: null,
      motivationProfile: null,
      selfAwarenessAssessment: null,
      globalCircumstances: [],
      conversationHistory: [],
      allExtractedInsights: [],
      completeness: {
        overallCompleteness: 0,
        subjectCompleteness: new Map(),
        topicsCovered: 0,
        topicsTotal: 0,
        coursesAnnotated: 0,
        coursesTotal: 0,
        missingAreas: ['No data collected yet'],
        recommendedNextTopics: [],
      },
    };
  }

  private createEmptyCourseAnnotation(courseId: string, subject: SubjectArea): CourseAnnotation {
    return {
      courseId,
      courseName: courseId,
      subject,
      year: 'unknown',
      effortLevel: null,
      perceivedDifficulty: null,
      gradeReflectsAbility: null,
      gradeReflectsEffort: null,
      teacherQuality: null,
      classEnvironment: null,
      externalCircumstances: [],
      enjoymentLevel: null,
      engagementLevel: null,
      intrinsicInterest: null,
      confidenceAfter: null,
      wouldTakeAgain: null,
      wantsToContinue: null,
      studentNarrative: '',
      keyInsights: [],
      directQuotes: [],
      reliabilityScore: 50,
      flags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createEmptySubjectInsight(subject: SubjectArea): SubjectInsight {
    return {
      subject,
      overallConfidence: 50,
      overallInterest: 50,
      overallEffort: 50,
      perceivedDifficulty: 50,
      effortGradeCorrelation: 0.5,
      consistencyWithPerformance: 50,
      selfAssessedStrength: false,
      selfAssessedChallenge: false,
      mismatchWithData: null,
      intendsToContinue: false,
      willingnessToChallenge: 3,
      specificFutureCourses: [],
      keyStatements: [],
      narrativeSummary: '',
    };
  }

  private createDefaultState(): ConversationState {
    return {
      conversationId: `conv_${Date.now()}`,
      phase: 'introduction',
      pendingTopics: [],
      currentTopic: null,
      completedTopics: [],
      turnCount: 0,
      lastActivityAt: new Date(),
      isComplete: false,
      completionProgress: 0,
      // PERSISTENCE: Initialize empty persisted state
      usedAcknowledgments: new Set(),
      askedQuestionKeys: new Set(),
      personalDisclosures: [],
      discussedSubjects: new Set(),
      roadmapAdjustments: [],
    };
  }

  private buildPreviousContext(history: ConversationTurn[]): string {
    const recent = history.slice(-4);
    return recent
      .map((t) => `${t.role === 'ai' ? 'AI' : 'Student'}: ${t.message.substring(0, 100)}...`)
      .join('\n');
  }

  private summarizeExistingInsights(qualitativeInsights: QualitativeInsights): string {
    const subjects = Array.from(qualitativeInsights.subjectInsights.entries());
    if (subjects.length === 0) return 'No prior insights';

    return subjects
      .map(([subj, ins]) => `${formatSubject(subj)}: conf=${ins.overallConfidence}%, interest=${ins.overallInterest}%`)
      .join('; ');
  }

  private extractMentionedSubjects(message: string): SubjectArea[] {
    const subjects: SubjectArea[] = [];
    const lower = message.toLowerCase();

    if (/math|algebra|calculus|geometry|statistics/i.test(lower)) subjects.push('math');
    if (/science|physics|chemistry|biology/i.test(lower)) subjects.push('science');
    if (/english|writing|literature|reading/i.test(lower)) subjects.push('english');
    if (/history|social|government|economics|politics/i.test(lower)) subjects.push('social_studies');
    if (/spanish|french|language|foreign|chinese|german/i.test(lower)) subjects.push('foreign_language');
    if (/art|music|theater|drama|band|orchestra/i.test(lower)) subjects.push('arts');
    if (/computer|programming|coding|cs|tech/i.test(lower)) subjects.push('computer_science');

    return subjects;
  }

  private determinePhase(state: ConversationState): ConversationPhase {
    if (state.turnCount <= 2) return 'introduction';
    if (state.completedTopics.length < 3) return 'discovery';
    if (state.completedTopics.length < 8) return 'deep_dive';
    if (state.pendingTopics.length > 0) return 'cross_reference';
    return 'synthesis';
  }

  private calculateProgress(state: ConversationState, qualitativeInsights: QualitativeInsights): number {
    const topicProgress = state.completedTopics.length /
      (state.completedTopics.length + state.pendingTopics.length + 1) * 50;

    const subjectProgress = qualitativeInsights.subjectInsights.size * 7; // Up to ~50%

    return Math.min(Math.round(topicProgress + subjectProgress), 100);
  }

  private calculateCompleteness(
    qualitativeInsights: QualitativeInsights,
    state: ConversationState
  ): ProfileCompleteness {
    const subjectCompleteness = new Map<SubjectArea, number>();

    for (const [subject, insight] of qualitativeInsights.subjectInsights) {
      let completeness = 0;
      if (insight.overallConfidence !== 50) completeness += 20;
      if (insight.overallInterest !== 50) completeness += 20;
      if (insight.overallEffort !== 50) completeness += 20;
      if (insight.selfAssessedStrength !== false || insight.selfAssessedChallenge !== false) completeness += 20;
      if (insight.keyStatements.length > 0) completeness += 20;
      subjectCompleteness.set(subject, completeness);
    }

    const avgSubjectCompleteness = subjectCompleteness.size > 0
      ? Array.from(subjectCompleteness.values()).reduce((a, b) => a + b, 0) / subjectCompleteness.size
      : 0;

    const missingAreas: string[] = [];
    if (qualitativeInsights.learningStyleIndicators === null) missingAreas.push('Learning style');
    if (qualitativeInsights.motivationProfile === null) missingAreas.push('Motivation profile');
    if (qualitativeInsights.globalCircumstances.length === 0) missingAreas.push('External circumstances');

    return {
      overallCompleteness: Math.round((avgSubjectCompleteness + state.completionProgress) / 2),
      subjectCompleteness,
      topicsCovered: state.completedTopics.length,
      topicsTotal: state.completedTopics.length + state.pendingTopics.length,
      coursesAnnotated: qualitativeInsights.courseAnnotations.size,
      coursesTotal: qualitativeInsights.courseAnnotations.size + 5, // Estimate
      missingAreas,
      recommendedNextTopics: state.pendingTopics.slice(0, 3).map((t) => t.context),
    };
  }

  private determineResponseType(
    extractedInsights: ExtractedInsight[],
    nextTopic: ConversationTopic | null,
    currentTopic: ConversationTopic | null
  ): ResponseType {
    if (!nextTopic) return 'summary';
    if (extractedInsights.length === 0) return 'encouragement';
    if (currentTopic && nextTopic.id !== currentTopic.id) return 'transition';
    return 'follow_up';
  }

  private generateSuggestedResponses(nextTopic: ConversationTopic | null): string[] | undefined {
    if (!nextTopic) return undefined;

    const suggestions: string[] = [];

    // Generate context-appropriate suggestions
    switch (nextTopic.type) {
      case 'grade_anomaly':
        suggestions.push(
          "It was actually harder than I expected",
          "I had a really good teacher",
          "I was dealing with some stuff at the time"
        );
        break;
      case 'difficulty_transition':
        suggestions.push(
          "The jump was challenging at first",
          "It wasn't as bad as I expected",
          "I'm still getting used to it"
        );
        break;
      case 'subject_overview':
        suggestions.push(
          "I really enjoy it",
          "It's not my favorite",
          "I'm pretty good at it"
        );
        break;
      default:
        suggestions.push(
          "I'd like to share more",
          "That's about it",
          "Can we talk about something else?"
        );
    }

    return suggestions;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const capabilityConversationEngine = new CapabilityConversationEngine();

export async function initializeCapabilityConversation(
  quantitativeAnalysis: NuancedCapabilityAnalysis,
  options?: ConversationEngineOptions
): Promise<InitializeResult> {
  const engine = options ? new CapabilityConversationEngine(options) : capabilityConversationEngine;
  return engine.initialize(quantitativeAnalysis);
}

export async function processCapabilityConversationTurn(
  studentMessage: string,
  state: ConversationState,
  qualitativeInsights: QualitativeInsights,
  quantitativeAnalysis: NuancedCapabilityAnalysis,
  options?: ConversationEngineOptions
): Promise<ProcessTurnResult> {
  const engine = options ? new CapabilityConversationEngine(options) : capabilityConversationEngine;
  return engine.processTurn(studentMessage, state, qualitativeInsights, quantitativeAnalysis);
}

export function finalizeCapabilityConversation(
  state: ConversationState,
  qualitativeInsights: QualitativeInsights,
  quantitativeAnalysis: NuancedCapabilityAnalysis
): SynthesizedCapabilityProfile {
  return capabilityConversationEngine.finalize(state, qualitativeInsights, quantitativeAnalysis);
}
