/**
 * Question Generator Service
 *
 * Intelligently selects the next question to ask based on:
 * - Current profile completeness
 * - What's been asked/answered already
 * - Conversation phase
 * - Scoring impact potential
 * - Natural conversation flow
 *
 * PHILOSOPHY: Questions should feel like talking to a skilled counselor,
 * not filling out a form. They should build naturally on what the student
 * has shared while systematically filling in the profile.
 */

import {
  ConversationState,
  ConversationPhase,
  QuestionCandidate,
  QuestionCategory,
  QuestionGenerationInput,
  QuestionGenerationOutput,
  WorkshopContextForChat,
} from './types';
import { ActivityProfile, ProfileCompleteness } from '../profile/types';
import { activityProfileService } from '../profile/activityProfileService';

/**
 * Extended state type that may carry workshop context.
 * Stored pragmatically on the state to avoid type conflicts with
 * the other agent editing types.ts. Access via type assertion.
 */
interface ConversationStateWithWorkshopContext extends ConversationState {
  workshopContext?: WorkshopContextForChat;
}

// ============================================================================
// QUESTION BANKS
// ============================================================================

/**
 * Base questions organized by profile field
 * These are templates that get customized with activity-specific details
 */
const QUESTION_TEMPLATES: Record<string, {
  questions: string[];
  category: QuestionCategory;
  phase: ConversationPhase;
  priority: 'critical' | 'high' | 'medium' | 'low';
}> = {
  // FACTS - Scale
  'facts.scale.peopleDirectlyImpacted': {
    questions: [
      "How many people did you directly work with or help through {activity}?",
      "Can you give me a sense of the scale? How many people were involved?",
      "When you think about who you directly impacted, roughly how many people would that be?",
    ],
    category: 'numeric_ask',
    phase: 'fact_gathering',
    priority: 'critical',
  },
  'facts.scale.teamSize': {
    questions: [
      "How many people were on your team or in your group?",
      "Can you tell me about the team you worked with?",
    ],
    category: 'numeric_ask',
    phase: 'fact_gathering',
    priority: 'high',
  },
  'facts.scale.budgetManaged': {
    questions: [
      "Did you manage any budget or resources? If so, how much?",
      "Were there financial aspects you were responsible for?",
    ],
    category: 'numeric_ask',
    phase: 'fact_gathering',
    priority: 'medium',
  },
  'facts.scale.resourcesCreated': {
    questions: [
      "Did you create any tangible resources — guides, videos, documents?",
      "What did you actually build or produce through {activity}?",
    ],
    category: 'specific_probe',
    phase: 'fact_gathering',
    priority: 'high',
  },

  // FACTS - Recognition
  'facts.recognition': {
    questions: [
      "Did you receive any awards, recognition, or selections related to {activity}?",
      "Were you recognized for your work in any way — awards, honors, media features?",
      "Any competitions or selections you participated in? How did you do?",
    ],
    category: 'specific_probe',
    phase: 'fact_gathering',
    priority: 'critical',
  },

  // FACTS - Artifacts
  'facts.artifacts': {
    questions: [
      "Did you create anything tangible through {activity} — like a guide, app, website, or resource?",
      "Is there something you made that you're particularly proud of?",
      "What exists now because of your work that didn't exist before?",
    ],
    category: 'specific_probe',
    phase: 'fact_gathering',
    priority: 'high',
  },

  // STORY - Origin
  'story.origin.howStarted': {
    questions: [
      "How did you first get involved in {activity}?",
      "What's the story of how you started with {activity}?",
      "Take me back to the beginning — how did this all start?",
    ],
    category: 'open_exploratory',
    phase: 'opening',
    priority: 'high',
  },
  'story.origin.whyJoined': {
    questions: [
      "What drew you to {activity} in the first place?",
      "Why did you decide to get involved?",
      "What was it about {activity} that appealed to you?",
    ],
    category: 'reflection_invite',
    phase: 'opening',
    priority: 'high',
  },

  // STORY - Key Moments
  'story.keyMoments': {
    questions: [
      "Was there a particular moment that stands out — maybe a breakthrough, a challenge you overcame, or something you're especially proud of?",
      "If you had to pick one moment from {activity} to tell someone about, what would it be?",
      "Was there a time when something just clicked, or when you realized how much you'd grown?",
      "What was the hardest moment in {activity}? How did you handle it?",
    ],
    category: 'story_prompt',
    phase: 'story_exploration',
    priority: 'critical',
  },

  // STORY - Relationships
  'story.relationships': {
    questions: [
      "Was there a mentor, coach, or teammate who had a significant impact on your experience?",
      "Did you form any important relationships through {activity}?",
      "Who influenced your journey in {activity}?",
    ],
    category: 'open_exploratory',
    phase: 'story_exploration',
    priority: 'medium',
  },

  // MEANING
  'meaning.whyItMatters': {
    questions: [
      "Why does {activity} matter to you personally?",
      "What makes {activity} meaningful beyond just participating?",
      "If you had to explain to someone why you care about {activity}, what would you say?",
    ],
    category: 'reflection_invite',
    phase: 'meaning_reflection',
    priority: 'critical',
  },
  'meaning.proudestMoment': {
    questions: [
      "What's the single moment in {activity} you're most proud of?",
      "If you could relive one moment from {activity}, what would it be?",
    ],
    category: 'reflection_invite',
    phase: 'meaning_reflection',
    priority: 'high',
  },
  'meaning.hardestChallenge': {
    questions: [
      "What was the hardest challenge you faced in {activity}?",
      "Was there a time when you wanted to give up? What kept you going?",
      "What obstacle did you have to overcome?",
    ],
    category: 'story_prompt',
    phase: 'meaning_reflection',
    priority: 'high',
  },
  'meaning.skills': {
    questions: [
      "What skills did you develop through {activity}?",
      "How did {activity} change what you're capable of?",
      "What can you do now that you couldn't before because of {activity}?",
    ],
    category: 'reflection_invite',
    phase: 'meaning_reflection',
    priority: 'medium',
  },
  'meaning.personalGrowth': {
    questions: [
      "How did {activity} change you as a person?",
      "What's different about you now compared to when you started?",
      "What did you learn about yourself through {activity}?",
    ],
    category: 'reflection_invite',
    phase: 'meaning_reflection',
    priority: 'medium',
  },

  // IMPACT
  'impact.directBeneficiaries': {
    questions: [
      "Who specifically benefited from your work in {activity}? Can you give me an example?",
      "Tell me about someone whose life was different because of what you did.",
      "How did your involvement help others?",
    ],
    category: 'specific_probe',
    phase: 'impact_assessment',
    priority: 'critical',
  },
  'impact.beforeAfter': {
    questions: [
      "What changed because of your involvement? What was the situation before and after?",
      "How were things different by the time you were done compared to when you started?",
      "Can you describe a before-and-after picture of your impact?",
    ],
    category: 'specific_probe',
    phase: 'impact_assessment',
    priority: 'high',
  },
  'impact.counterfactual': {
    questions: [
      "What wouldn't have happened if you hadn't been involved?",
      "What exists now that wouldn't exist without you?",
    ],
    category: 'reflection_invite',
    phase: 'impact_assessment',
    priority: 'medium',
  },

  // CONNECTIONS
  'connections.spikeRelevance': {
    questions: [
      "How does {activity} connect to your main interests or goals?",
      "Do you see {activity} as part of a bigger story about who you are?",
      "How does this fit with your other activities and interests?",
    ],
    category: 'connection_suggest',
    phase: 'connection_mapping',
    priority: 'high',
  },
  'connections.majorAlignment': {
    questions: [
      "How does {activity} relate to what you want to study in college?",
      "Is there a connection between {activity} and your intended major?",
      "What does {activity} show about your academic interests?",
    ],
    category: 'connection_suggest',
    phase: 'connection_mapping',
    priority: 'high',
  },
  'connections.characterTraits': {
    questions: [
      "What does {activity} show about who you are as a person?",
      "What character traits does {activity} demonstrate?",
      "If someone could only see {activity}, what would they learn about you?",
    ],
    category: 'reflection_invite',
    phase: 'connection_mapping',
    priority: 'medium',
  },
};

/**
 * Follow-up question templates based on response content
 */
const FOLLOW_UP_TEMPLATES: Record<string, string[]> = {
  mentioned_number: [
    "You mentioned {number}. Can you tell me more about that?",
    "That's interesting — {number}. How did you get to that point?",
  ],
  mentioned_challenge: [
    "You mentioned {topic} was challenging. How did you handle that?",
    "Tell me more about that difficulty with {topic}. What did you do?",
  ],
  mentioned_person: [
    "You mentioned {person}. What was their role in your experience?",
    "How did {person} influence your journey?",
  ],
  mentioned_achievement: [
    "That's impressive — {achievement}. Can you tell me more about how that came about?",
    "How did you achieve {achievement}? What was the process?",
  ],
  vague_response: [
    "Can you give me a specific example of that?",
    "Help me picture that — what did that actually look like?",
    "Can you be more specific about what you mean?",
  ],
  short_response: [
    "Tell me more about that.",
    "What else can you share about that?",
    "I'd love to hear more details.",
  ],
};

// ============================================================================
// QUESTION GENERATOR SERVICE
// ============================================================================

export class QuestionGeneratorService {
  /**
   * Generate the next question to ask
   */
  generateNextQuestion(input: QuestionGenerationInput): QuestionGenerationOutput {
    const { state, maxQuestions = 3, preferredCategories, priorityFields } = input;

    // Get current profile completeness
    const completeness = activityProfileService.calculateCompleteness(state.currentProfile);

    // Generate candidate questions
    let candidates = this.generateCandidates(state, completeness, preferredCategories, priorityFields);

    // Apply workshop-context-aware priority adjustments if available
    const workshopContext = (state as ConversationStateWithWorkshopContext).workshopContext;
    if (workshopContext) {
      candidates = this.adjustPrioritiesForWorkshopContext(candidates, workshopContext);
    }

    // Sort by priority
    candidates.sort((a, b) => b.priority - a.priority);

    // Check if we should transition phase
    const { shouldTransition, nextPhase } = this.checkPhaseTransition(state, completeness, candidates);

    // Select best question
    const nextQuestion = candidates[0];
    const alternatives = candidates.slice(1, maxQuestions);

    return {
      nextQuestion,
      alternatives,
      shouldTransitionPhase: shouldTransition,
      suggestedNextPhase: nextPhase,
      rationale: this.generateRationale(nextQuestion, state, completeness),
    };
  }

  /**
   * Generate all candidate questions
   */
  private generateCandidates(
    state: ConversationState,
    completeness: ProfileCompleteness,
    preferredCategories?: QuestionCategory[],
    priorityFields?: string[]
  ): QuestionCandidate[] {
    const candidates: QuestionCandidate[] = [];
    const askedQuestions = new Set(state.questionsAsked.map(q => q.targetField));
    const activityTitle = state.activityTitle;

    // Build set of already extracted fields to avoid redundant questions
    const extractedFields = this.buildExtractedFieldsSet(state);

    // Generate questions from templates
    for (const [field, template] of Object.entries(QUESTION_TEMPLATES)) {
      // Skip if we've already asked about this field
      if (askedQuestions.has(field)) continue;

      // Skip if data for this field was already extracted from natural conversation
      if (this.isFieldSufficientlyExtracted(field, extractedFields, state.currentProfile)) continue;

      // Skip if not appropriate for current phase (allow some flexibility)
      if (!this.isPhaseAppropriate(state.phase, template.phase)) continue;

      // Calculate priority score
      let priority = this.getBasePriority(template.priority);

      // Boost if this is a priority field
      if (priorityFields?.includes(field)) priority += 30;

      // Boost if this is a preferred category
      if (preferredCategories?.includes(template.category)) priority += 20;

      // Boost if this field is critical for completeness
      const fieldPriority = completeness.priorityFields.find(f => f.field === field);
      if (fieldPriority && !fieldPriority.currentlyFilled) {
        if (fieldPriority.importance === 'critical') priority += 25;
        else if (fieldPriority.importance === 'high') priority += 15;
      }

      // Boost based on scoring impact
      priority += this.estimateImpact(field) * 2;

      // Select a question variant (randomize for variety)
      const questionText = this.selectQuestionVariant(template.questions, activityTitle);

      candidates.push({
        question: questionText,
        targetField: field,
        category: template.category,
        priority,
        phase: template.phase,
        isFollowUp: false,
        estimatedImpact: {
          descriptionScore: this.estimateDescriptionImpact(field),
          activityScore: this.estimateActivityImpact(field),
          narrativeValue: this.estimateNarrativeValue(field),
        },
      });
    }

    // Generate follow-up questions based on last response
    const followUps = this.generateFollowUps(state);
    candidates.push(...followUps);

    return candidates;
  }

  /**
   * Generate follow-up questions based on last response and extraction
   */
  private generateFollowUps(state: ConversationState): QuestionCandidate[] {
    const followUps: QuestionCandidate[] = [];

    if (state.responsesReceived.length === 0) return followUps;

    const lastTurn = state.responsesReceived[state.responsesReceived.length - 1];
    const lastResponse = lastTurn.response;
    const lastExtraction = lastTurn.extraction;

    // Generate follow-ups based on what was extracted
    followUps.push(...this.generateExtractionBasedFollowUps(lastExtraction, state));

    // Check for numbers that could be explored (only if not already extracted well)
    if (lastExtraction.extractionQuality !== 'rich') {
      const numberMatch = lastResponse.match(/\b(\d+(?:,\d{3})*(?:\.\d+)?)\b/);
      if (numberMatch) {
        const template = FOLLOW_UP_TEMPLATES.mentioned_number[0];
        followUps.push({
          question: template.replace('{number}', numberMatch[1]),
          targetField: 'follow_up_number',
          category: 'specific_probe',
          priority: 110, // Boost to beat most template questions
          phase: state.phase,
          isFollowUp: true,
          followsResponse: lastResponse,
          estimatedImpact: { descriptionScore: 1, activityScore: 0.5, narrativeValue: 0.5 },
        });
      }
    }

    // Check for challenge mentions (only if hardestChallenge not extracted)
    if (!state.currentProfile.meaning.hardestChallenge) {
      const challengePatterns = [/difficult|hard|challenging|struggle|obstacle/i];
      for (const pattern of challengePatterns) {
        if (pattern.test(lastResponse)) {
          followUps.push({
            question: "You mentioned that was challenging. How did you handle that?",
            targetField: 'story.keyMoments',
            category: 'story_prompt',
            priority: 120, // Boost - challenges are great for narrative
            phase: 'story_exploration',
            isFollowUp: true,
            followsResponse: lastResponse,
            estimatedImpact: { descriptionScore: 1, activityScore: 0.5, narrativeValue: 2 },
          });
          break;
        }
      }
    }

    // Check for short responses (might need prompting)
    // CRITICAL: Short responses with sparse extraction need HIGHEST priority probing
    if (lastResponse.split(' ').length < 15 && lastExtraction.extractionQuality === 'sparse') {
      followUps.push({
        question: "Tell me more about that — I'd love to hear more details.",
        targetField: 'follow_up_detail',
        category: 'open_exploratory',
        priority: 150, // Higher than critical questions to ensure probing happens
        phase: state.phase,
        isFollowUp: true,
        followsResponse: lastResponse,
        estimatedImpact: { descriptionScore: 0.5, activityScore: 0.5, narrativeValue: 0.5 },
      });
    }

    // Detect reluctance patterns and add gentle follow-ups
    const reluctancePatterns = [
      /just|nothing special|anyone could|i don't know|whatever|i guess/i,
      /not a big deal|not that important|doesn't matter/i,
    ];
    const isReluctant = reluctancePatterns.some(p => p.test(lastResponse));
    if (isReluctant && lastExtraction.extractionQuality !== 'rich') {
      followUps.push({
        question: "Even if it felt normal to you, I'm curious what you actually did day-to-day. Can you walk me through a typical experience?",
        targetField: 'follow_up_reluctance',
        category: 'open_exploratory',
        priority: 140, // High priority for reluctant students
        phase: state.phase,
        isFollowUp: true,
        followsResponse: lastResponse,
        estimatedImpact: { descriptionScore: 1, activityScore: 1, narrativeValue: 1 },
      });
    }

    // Detect underselling/humility patterns
    const humilityPatterns = [
      /i'm not that good|others are better|i didn't do much/i,
      /the team did|wasn't just me|others worked harder/i,
      /i don't deserve|don't think i|not sure i should/i,
    ];
    const isUnderselling = humilityPatterns.some(p => p.test(lastResponse));
    if (isUnderselling) {
      followUps.push({
        question: "I hear that you value your team. But specifically, what was YOUR unique contribution that others relied on?",
        targetField: 'follow_up_underselling',
        category: 'specific_probe',
        priority: 130,
        phase: state.phase,
        isFollowUp: true,
        followsResponse: lastResponse,
        estimatedImpact: { descriptionScore: 1.5, activityScore: 1, narrativeValue: 1 },
      });
    }

    return followUps;
  }

  /**
   * Generate smart follow-ups based on extraction results
   */
  private generateExtractionBasedFollowUps(
    extraction: import('./types').ExtractionResult,
    state: ConversationState
  ): QuestionCandidate[] {
    const followUps: QuestionCandidate[] = [];

    // If recognition was extracted, probe for more detail
    const recognitionExtracted = extraction.extractedFields.some(f => f.path.includes('recognition'));
    if (recognitionExtracted && state.currentProfile.facts.recognition.length > 0) {
      const recognition = state.currentProfile.facts.recognition[state.currentProfile.facts.recognition.length - 1];
      if (recognition && !recognition.selectivity) {
        followUps.push({
          question: `That ${recognition.name} sounds significant. How competitive was it to receive?`,
          targetField: 'facts.recognition',
          category: 'specific_probe',
          priority: 115, // Higher than critical template questions
          phase: 'fact_gathering',
          isFollowUp: true,
          estimatedImpact: { descriptionScore: 1.5, activityScore: 1.5, narrativeValue: 0.5 },
        });
      }
    }

    // If before/after was extracted, probe for specific metrics
    const beforeAfterExtracted = extraction.extractedFields.some(f => f.path.includes('beforeAfter'));
    if (beforeAfterExtracted && state.currentProfile.impact.beforeAfter) {
      const ba = state.currentProfile.impact.beforeAfter;
      if (ba.before && ba.after && !ba.yourRole) {
        followUps.push({
          question: `You mentioned the change from ${ba.before} to ${ba.after}. What specifically did you do to make that happen?`,
          targetField: 'impact.beforeAfter',
          category: 'specific_probe',
          priority: 125, // Very high - before/after is gold for descriptions
          phase: 'impact_assessment',
          isFollowUp: true,
          estimatedImpact: { descriptionScore: 2, activityScore: 1, narrativeValue: 1 },
        });
      }
    }

    // If clarification was flagged by extraction, ask about it
    for (const clarification of extraction.needsClarification) {
      if (clarification.priority === 'high') {
        followUps.push({
          question: clarification.suggestedFollowUp,
          targetField: `clarification.${clarification.topic}`,
          category: 'clarification',
          priority: 135, // High priority for clarifications
          phase: state.phase,
          isFollowUp: true,
          estimatedImpact: { descriptionScore: 1, activityScore: 1, narrativeValue: 0.5 },
        });
        break; // Only add one clarification at a time
      }
    }

    // Use suggested follow-ups from extraction if available
    for (const suggestedQ of extraction.suggestedFollowUps.slice(0, 2)) {
      if (suggestedQ && suggestedQ.length > 10) {
        followUps.push({
          question: suggestedQ,
          targetField: 'extraction_suggested',
          category: 'specific_probe',
          priority: 105, // Boost to compete with template questions
          phase: state.phase,
          isFollowUp: true,
          estimatedImpact: { descriptionScore: 0.5, activityScore: 0.5, narrativeValue: 1 },
        });
      }
    }

    return followUps;
  }

  /**
   * Build a set of fields that have been extracted from responses
   */
  private buildExtractedFieldsSet(state: ConversationState): Set<string> {
    const fields = new Set<string>();
    for (const turn of state.responsesReceived) {
      for (const extracted of turn.extraction.extractedFields) {
        fields.add(extracted.path);
        // Also mark parent fields as partially filled
        const parts = extracted.path.split('.');
        for (let i = 1; i < parts.length; i++) {
          fields.add(parts.slice(0, i).join('.'));
        }
      }
    }
    return fields;
  }

  /**
   * Check if a field has already been sufficiently extracted
   */
  private isFieldSufficientlyExtracted(
    field: string,
    extractedFields: Set<string>,
    profile: ActivityProfile
  ): boolean {
    // Direct match - field was extracted
    if (extractedFields.has(field)) {
      // For array fields, check if we have at least 1 item
      if (field === 'facts.recognition' && profile.facts.recognition.length > 0) return true;
      if (field === 'story.keyMoments' && profile.story.keyMoments.length > 0) return true;
      if (field === 'impact.directBeneficiaries' && profile.impact.directBeneficiaries.length > 0) return true;
      if (field === 'facts.roles' && profile.facts.roles.length > 1) return true; // > 1 because initial role is always there
      if (field === 'facts.artifacts' && profile.facts.artifacts.length > 0) return true;

      // For scalar fields, check if filled
      if (field === 'facts.scale.peopleDirectlyImpacted' && profile.facts.scale.peopleDirectlyImpacted > 0) return true;
      if (field === 'facts.scale.resourcesCreated' && profile.facts.scale.resourcesCreated > 0) return true;
      if (field === 'story.origin.howStarted' && profile.story.origin.howStarted) return true;
      if (field === 'meaning.whyItMatters' && profile.meaning.whyItMatters) return true;
      if (field === 'meaning.proudestMoment' && profile.meaning.proudestMoment) return true;
      if (field === 'meaning.hardestChallenge' && profile.meaning.hardestChallenge) return true;
      if (field === 'impact.beforeAfter' && profile.impact.beforeAfter) return true;
    }

    return false;
  }

  /**
   * Check if current phase is appropriate for this question
   */
  private isPhaseAppropriate(currentPhase: ConversationPhase, questionPhase: ConversationPhase): boolean {
    const phaseOrder: ConversationPhase[] = [
      'opening',
      'fact_gathering',
      'story_exploration',
      'meaning_reflection',
      'impact_assessment',
      'connection_mapping',
      'synthesis',
      'complete',
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    const questionIndex = phaseOrder.indexOf(questionPhase);

    // Allow questions from current phase and one adjacent phase
    return Math.abs(currentIndex - questionIndex) <= 1;
  }

  /**
   * Check if we should transition to a new phase
   */
  private checkPhaseTransition(
    state: ConversationState,
    completeness: ProfileCompleteness,
    candidates: QuestionCandidate[]
  ): { shouldTransition: boolean; nextPhase?: ConversationPhase } {
    const phaseOrder: ConversationPhase[] = [
      'opening',
      'fact_gathering',
      'story_exploration',
      'meaning_reflection',
      'impact_assessment',
      'connection_mapping',
      'synthesis',
    ];

    const currentIndex = phaseOrder.indexOf(state.phase);

    // Transition if:
    // 1. We've hit max turns in this phase
    if (state.turnsInCurrentPhase >= state.maxTurnsPerPhase) {
      return {
        shouldTransition: true,
        nextPhase: phaseOrder[currentIndex + 1] || 'complete',
      };
    }

    // 2. No more high-priority questions for this phase
    const phaseQuestions = candidates.filter(c => c.phase === state.phase && c.priority > 50);
    if (phaseQuestions.length === 0 && state.turnsInCurrentPhase >= 2) {
      return {
        shouldTransition: true,
        nextPhase: phaseOrder[currentIndex + 1] || 'complete',
      };
    }

    // 3. Section completeness is high enough
    const sectionCompleteness = this.getSectionForPhase(state.phase, completeness);
    if (sectionCompleteness > 70 && state.turnsInCurrentPhase >= 2) {
      return {
        shouldTransition: true,
        nextPhase: phaseOrder[currentIndex + 1] || 'complete',
      };
    }

    return { shouldTransition: false };
  }

  /**
   * Get section completeness for a phase
   */
  private getSectionForPhase(phase: ConversationPhase, completeness: ProfileCompleteness): number {
    switch (phase) {
      case 'opening':
      case 'fact_gathering':
        return completeness.sections.facts;
      case 'story_exploration':
        return completeness.sections.story;
      case 'meaning_reflection':
        return completeness.sections.meaning;
      case 'impact_assessment':
        return completeness.sections.impact;
      case 'connection_mapping':
        return completeness.sections.connections;
      default:
        return completeness.overall;
    }
  }

  /**
   * Get base priority from string level
   */
  private getBasePriority(level: 'critical' | 'high' | 'medium' | 'low'): number {
    switch (level) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
    }
  }

  /**
   * Estimate overall impact of filling this field
   */
  private estimateImpact(field: string): number {
    const highImpactFields = [
      'facts.scale.peopleDirectlyImpacted',
      'facts.recognition',
      'story.keyMoments',
      'impact.directBeneficiaries',
      'meaning.whyItMatters',
    ];

    if (highImpactFields.includes(field)) return 10;
    if (field.startsWith('facts.')) return 7;
    if (field.startsWith('story.')) return 6;
    if (field.startsWith('impact.')) return 8;
    return 5;
  }

  /**
   * Estimate description score impact
   */
  private estimateDescriptionImpact(field: string): number {
    if (field.includes('scale.people')) return 2;
    if (field.includes('recognition')) return 1.5;
    if (field.includes('artifacts')) return 1.5;
    if (field.includes('keyMoments')) return 1;
    return 0.5;
  }

  /**
   * Estimate activity score impact
   */
  private estimateActivityImpact(field: string): number {
    if (field.includes('recognition')) return 2;
    if (field.includes('directBeneficiaries')) return 1.5;
    if (field.includes('scale')) return 1;
    return 0.5;
  }

  /**
   * Estimate narrative value
   */
  private estimateNarrativeValue(field: string): number {
    if (field.includes('keyMoments')) return 2;
    if (field.includes('whyItMatters')) return 2;
    if (field.includes('origin')) return 1.5;
    if (field.includes('connections')) return 1.5;
    return 0.5;
  }

  /**
   * Select a question variant with activity name filled in
   */
  private selectQuestionVariant(questions: string[], activityTitle: string): string {
    const index = Math.floor(Math.random() * questions.length);
    return questions[index].replace(/{activity}/g, activityTitle);
  }

  /**
   * Generate explanation for why this question was chosen
   */
  private generateRationale(
    question: QuestionCandidate,
    state: ConversationState,
    completeness: ProfileCompleteness
  ): string {
    const parts: string[] = [];

    if (question.isFollowUp) {
      parts.push('Following up on what was just shared');
    } else {
      parts.push(`Targeting ${question.targetField.split('.').pop()}`);
    }

    if (question.estimatedImpact.descriptionScore > 1.5) {
      parts.push('high potential to improve description');
    }

    if (question.estimatedImpact.narrativeValue > 1.5) {
      parts.push('valuable for essays/interviews');
    }

    // Note workshop context influence in rationale
    const workshopContext = (state as ConversationStateWithWorkshopContext).workshopContext;
    if (workshopContext) {
      if (workshopContext.undersold && (question.category === 'story_prompt' || question.category === 'specific_probe')) {
        parts.push('workshop: activity appears undersold');
      }
      if (workshopContext.spikeCandidate && question.category === 'connection_suggest') {
        parts.push('workshop: spike candidate — mapping connections');
      }
      if (workshopContext.redFlags?.length && question.targetField.includes('impact')) {
        parts.push('workshop: addressing flagged impact gaps');
      }
    }

    return parts.join('; ');
  }

  // ============================================================================
  // WORKSHOP-CONTEXT-AWARE PRIORITIZATION
  // ============================================================================

  /**
   * Adjust question priorities based on workshop analysis results.
   * When we know what the pipeline found (red flags, score gaps, etc.),
   * we can ask smarter questions that address those specific issues.
   *
   * This does NOT sort — it only adjusts priority values so the
   * existing sort in generateNextQuestion() picks the right order.
   */
  adjustPrioritiesForWorkshopContext(
    candidates: QuestionCandidate[],
    workshopContext: WorkshopContextForChat
  ): QuestionCandidate[] {
    return candidates.map(candidate => {
      let priorityBoost = 0;

      // If red flags include "vague impact" → boost fact_gathering questions about scale
      if (workshopContext.redFlags?.some(f =>
        f.flag.toLowerCase().includes('vague') || f.flag.toLowerCase().includes('impact')
      )) {
        if (candidate.targetField.includes('scale') || candidate.targetField.includes('impact')) {
          priorityBoost += 30;
        }
      }

      // If undersold → boost story_exploration to surface hidden achievements
      if (workshopContext.undersold) {
        if (candidate.category === 'story_prompt' || candidate.category === 'specific_probe') {
          priorityBoost += 25;
        }
      }

      // If spike candidate → boost connection_mapping questions
      if (workshopContext.spikeCandidate) {
        if (
          candidate.targetField.includes('spike') ||
          candidate.targetField.includes('connection') ||
          candidate.category === 'connection_suggest'
        ) {
          priorityBoost += 20;
        }
      }

      // If description score is low → boost questions that surface description-worthy content
      if (workshopContext.descriptionScore !== undefined && workshopContext.descriptionScore < 50) {
        if (
          candidate.targetField.includes('facts') ||
          candidate.targetField.includes('recognition') ||
          candidate.targetField.includes('artifacts')
        ) {
          priorityBoost += 20;
        }
      }

      // If specific description issues identified → target those
      if (workshopContext.descriptionIssues?.length) {
        for (const issue of workshopContext.descriptionIssues) {
          if (issue.toLowerCase().includes('quantif') && candidate.targetField.includes('scale')) {
            priorityBoost += 25;
          }
          if (issue.toLowerCase().includes('leadership') && candidate.targetField.includes('role')) {
            priorityBoost += 25;
          }
          if (issue.toLowerCase().includes('specific') && candidate.category === 'specific_probe') {
            priorityBoost += 20;
          }
        }
      }

      // If teaching priorities are set, boost questions that align
      if (workshopContext.teachingPriorities?.length) {
        for (const priority of workshopContext.teachingPriorities) {
          const priorityLower = priority.toLowerCase();
          if (priorityLower.includes('impact') && candidate.targetField.includes('impact')) {
            priorityBoost += 15;
          }
          if (priorityLower.includes('story') && candidate.category === 'story_prompt') {
            priorityBoost += 15;
          }
          if (priorityLower.includes('recognition') && candidate.targetField.includes('recognition')) {
            priorityBoost += 15;
          }
          if (priorityLower.includes('scale') && candidate.targetField.includes('scale')) {
            priorityBoost += 15;
          }
        }
      }

      // If activity score is low overall, boost high-impact fact-based questions
      if (workshopContext.activityScore !== undefined && workshopContext.activityScore < 40) {
        if (candidate.targetField.startsWith('facts.') || candidate.targetField.startsWith('impact.')) {
          priorityBoost += 10;
        }
      }

      if (priorityBoost === 0) {
        return candidate;
      }

      return {
        ...candidate,
        priority: candidate.priority + priorityBoost,
      };
    });
  }

  /**
   * Generate a workshop-context-aware opening insight.
   * Returns a brief sentence that acknowledges what the pipeline found,
   * giving the student a sense that the system understands their activity.
   * Returns null if no meaningful insight is available.
   */
  generateWorkshopInsight(
    workshopContext: WorkshopContextForChat,
    activityTitle: string
  ): string | null {
    if (workshopContext.undersold) {
      return `Your analysis suggests "${activityTitle}" is stronger than your description shows. I'd love to help you uncover what's missing.`;
    }
    if (workshopContext.spikeCandidate) {
      return `"${activityTitle}" looks like it could be central to your application story. Let's make sure we capture everything important.`;
    }
    if (workshopContext.redFlags?.length) {
      return `I noticed some areas where "${activityTitle}" could be presented more effectively. Let me ask a few questions to help strengthen it.`;
    }
    if (workshopContext.greenFlags?.length && workshopContext.descriptionScore !== undefined && workshopContext.descriptionScore < 50) {
      return `There are some great things about "${activityTitle}" already — let's make sure they come through clearly in your description.`;
    }
    return null;
  }

  /**
   * Get opening question based on trigger and context
   */
  getOpeningQuestion(
    activityTitle: string,
    trigger: string,
    basicData?: { hoursPerWeek?: number; weeksPerYear?: number; yearsInvolved?: number }
  ): string {
    switch (trigger) {
      case 'time_investment_mismatch':
        if (basicData?.hoursPerWeek && basicData?.yearsInvolved) {
          const totalHours = basicData.hoursPerWeek * (basicData.weeksPerYear || 40) * basicData.yearsInvolved;
          return `You've invested about ${totalHours} hours in ${activityTitle} over ${basicData.yearsInvolved} years — that's a significant commitment. Can you tell me what a typical week looked like?`;
        }
        return `Tell me about ${activityTitle}. What was a typical week like?`;

      case 'spike_candidate':
        return `${activityTitle} looks like it could be central to your application. Let's make sure we capture the full story. How did you first get involved?`;

      case 'high_potential_activity':
        return `${activityTitle} seems like it has a lot of potential. I'd love to understand more about what made this experience meaningful. Can you tell me about your involvement?`;

      case 'user_initiated':
      case 'description_improvement':
        return `I'd be happy to help with ${activityTitle}. To write the best description, I need to understand the full picture. Can you start by telling me what you actually did?`;

      default:
        return `Tell me about ${activityTitle}. What was your involvement like?`;
    }
  }
}

// Export singleton
export const questionGeneratorService = new QuestionGeneratorService();
