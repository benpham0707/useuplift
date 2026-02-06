/**
 * Activity Profile Service
 *
 * Manages the lifecycle of Activity Profiles:
 * - Create new profiles from basic activity data
 * - Update profiles with extracted information
 * - Calculate profile completeness
 * - Identify gaps and prioritize follow-up questions
 * - Track profile evolution over conversations
 *
 * DESIGN: This service is stateless — it operates on profile objects
 * passed to it. Persistence is handled by the calling layer.
 */

import {
  ActivityProfile,
  ProfileCompleteness,
  PriorityField,
  ConversationRecord,
  KeyMoment,
  ActivityRecognition,
  ActivityArtifact,
  AuthenticQuote,
  Beneficiary,
  CharacterTraitDemonstration,
  createEmptyProfile,
  createProfileFromBasicData,
} from './types';

// ============================================================================
// COMPLETENESS CALCULATION
// ============================================================================

/**
 * Priority weights for different profile sections
 * Based on what matters most for scoring and narrative
 */
const SECTION_WEIGHTS = {
  facts: 0.30,      // Objective data is foundational
  story: 0.25,      // Narrative elements for essays/interviews
  meaning: 0.15,    // Reflection shows depth
  impact: 0.20,     // External validation is compelling
  connections: 0.10, // Helps with portfolio coherence
};

/**
 * Field importance by activity type
 * Different activities need different information
 */
const FIELD_PRIORITIES_BY_TYPE: Record<string, string[]> = {
  'leadership': [
    'facts.scale.teamSize',
    'facts.scale.peopleDirectlyImpacted',
    'story.keyMoments',
    'impact.beforeAfter',
    'meaning.skills',
  ],
  'research': [
    'facts.artifacts',
    'facts.recognition',
    'story.origin.howStarted',
    'connections.majorAlignment',
    'impact.externalAdoption',
  ],
  'service': [
    'facts.scale.peopleDirectlyImpacted',
    'impact.directBeneficiaries',
    'meaning.whyItMatters',
    'story.keyMoments',
    'connections.characterTraits',
  ],
  'athletics': [
    'facts.recognition',
    'facts.duration.totalYears',
    'story.keyMoments',
    'meaning.personalGrowth',
    'story.relationships',
  ],
  'arts': [
    'facts.artifacts',
    'facts.recognition',
    'story.origin.initialMotivation',
    'meaning.proudestMoment',
    'impact.testimonials',
  ],
  'entrepreneurship': [
    'facts.scale.revenueGenerated',
    'facts.scale.peopleIndirectlyReached',
    'facts.artifacts',
    'impact.beforeAfter',
    'story.keyMoments',
  ],
  'default': [
    'facts.scale.peopleDirectlyImpacted',
    'story.keyMoments',
    'meaning.whyItMatters',
    'impact.directBeneficiaries',
    'connections.spikeRelevance',
  ],
};

export class ActivityProfileService {
  /**
   * Create a new profile from basic activity data
   */
  createProfile(
    activityId: string,
    activityTitle: string,
    basicData?: {
      description?: string;
      position?: string;
      hoursPerWeek?: number;
      weeksPerYear?: number;
      yearsInvolved?: number;
      activityType?: string;
    }
  ): ActivityProfile {
    if (basicData) {
      return createProfileFromBasicData(activityId, activityTitle, basicData);
    }
    return createEmptyProfile(activityId, activityTitle);
  }

  /**
   * Calculate comprehensive profile completeness
   */
  calculateCompleteness(profile: ActivityProfile, activityType?: string): ProfileCompleteness {
    const sections = {
      facts: this.calculateFactsCompleteness(profile.facts),
      story: this.calculateStoryCompleteness(profile.story),
      meaning: this.calculateMeaningCompleteness(profile.meaning),
      impact: this.calculateImpactCompleteness(profile.impact),
      connections: this.calculateConnectionsCompleteness(profile.connections),
    };

    // Weighted overall score
    const overall =
      sections.facts * SECTION_WEIGHTS.facts +
      sections.story * SECTION_WEIGHTS.story +
      sections.meaning * SECTION_WEIGHTS.meaning +
      sections.impact * SECTION_WEIGHTS.impact +
      sections.connections * SECTION_WEIGHTS.connections;

    // Get priority fields for this activity type
    const priorityFields = this.getPriorityFields(profile, activityType);

    // Calculate potential score impact
    const potentialScoreImpact = this.estimateScoreImpact(profile, sections);

    // Generate recommended questions based on gaps
    const recommendedQuestions = this.generateRecommendedQuestions(profile, priorityFields);

    return {
      overall: Math.round(overall),
      sections,
      priorityFields,
      potentialScoreImpact,
      recommendedQuestions,
    };
  }

  /**
   * Calculate facts section completeness
   */
  private calculateFactsCompleteness(facts: ActivityProfile['facts']): number {
    let score = 0;
    const maxScore = 100;

    // Duration (25 points)
    if (facts.duration.totalYears > 0) score += 5;
    if (facts.duration.hoursPerWeek > 0) score += 5;
    if (facts.duration.weeksPerYear > 0) score += 5;
    if (facts.duration.startDate) score += 5;
    if (facts.duration.frequency) score += 5;

    // Scale (25 points)
    if (facts.scale.peopleDirectlyImpacted) score += 10;
    if (facts.scale.budgetManaged || facts.scale.resourcesCreated) score += 10;
    if (facts.scale.geographicScope) score += 5;

    // Roles (20 points)
    if (facts.roles.length > 0) {
      score += 10;
      if (facts.roles.some(r => r.responsibilities.length > 0)) score += 10;
    }

    // Recognition (15 points)
    if (facts.recognition.length > 0) {
      score += 10;
      if (facts.recognition.some(r => r.selectivity)) score += 5;
    }

    // Artifacts (15 points)
    if (facts.artifacts.length > 0) {
      score += 10;
      if (facts.artifacts.some(a => a.impact)) score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate story section completeness
   */
  private calculateStoryCompleteness(story: ActivityProfile['story']): number {
    let score = 0;

    // Origin (30 points)
    if (story.origin.howStarted) score += 10;
    if (story.origin.whyJoined) score += 10;
    if (story.origin.initialMotivation) score += 10;

    // Key moments (40 points)
    const momentTypes = new Set(story.keyMoments.map(m => m.type));
    score += Math.min(40, story.keyMoments.length * 10);
    if (momentTypes.size >= 2) score += 10; // Variety bonus

    // Evolution (15 points)
    if (story.evolution.length > 0) score += 15;

    // Relationships (15 points)
    if (story.relationships.length > 0) score += 15;

    return Math.min(100, score);
  }

  /**
   * Calculate meaning section completeness
   */
  private calculateMeaningCompleteness(meaning: ActivityProfile['meaning']): number {
    let score = 0;

    // Core reflections (40 points)
    if (meaning.proudestMoment) score += 15;
    if (meaning.hardestChallenge) score += 15;
    if (meaning.whyItMatters) score += 10;

    // Skills (20 points)
    if (meaning.skills.length > 0) score += 10;
    if (meaning.skills.length >= 3) score += 10;

    // Values (15 points)
    if (meaning.values.length > 0) score += 15;

    // Growth (15 points)
    if (meaning.personalGrowth.length > 0) score += 15;

    // Authentic quotes (10 points)
    if (meaning.authenticQuotes.length > 0) score += 5;
    if (meaning.authenticQuotes.length >= 3) score += 5;

    return Math.min(100, score);
  }

  /**
   * Calculate impact section completeness
   */
  private calculateImpactCompleteness(impact: ActivityProfile['impact']): number {
    let score = 0;

    // Direct beneficiaries (35 points)
    if (impact.directBeneficiaries.length > 0) score += 20;
    if (impact.directBeneficiaries.some(b => b.measurableOutcome)) score += 15;

    // Before/after (25 points)
    if (impact.beforeAfter) score += 25;

    // Counterfactual (15 points)
    if (impact.counterfactual) score += 15;

    // Testimonials (15 points)
    if (impact.testimonials.length > 0) score += 15;

    // External adoption (10 points)
    if (impact.externalAdoption) score += 10;

    return Math.min(100, score);
  }

  /**
   * Calculate connections section completeness
   */
  private calculateConnectionsCompleteness(connections: ActivityProfile['connections']): number {
    let score = 0;

    // Spike relevance (30 points)
    if (connections.spikeRelevance.connectsToSpike) score += 15;
    if (connections.spikeRelevance.spikeConnection) score += 15;

    // Major alignment (25 points)
    if (connections.majorAlignment.relevantToMajor) score += 10;
    if (connections.majorAlignment.howRelevant) score += 15;

    // Character traits (25 points)
    if (connections.characterTraits.length > 0) score += 15;
    if (connections.characterTraits.length >= 2) score += 10;

    // Related activities (10 points)
    if (connections.relatedActivities.length > 0) score += 10;

    // Themes (10 points)
    if (connections.themes && connections.themes.length > 0) score += 10;

    return Math.min(100, score);
  }

  /**
   * Get priority fields based on activity type
   */
  private getPriorityFields(profile: ActivityProfile, activityType?: string): PriorityField[] {
    const type = activityType || 'default';
    const priorityPaths = FIELD_PRIORITIES_BY_TYPE[type] || FIELD_PRIORITIES_BY_TYPE['default'];

    return priorityPaths.map((path, index) => {
      const isFilled = this.isFieldFilled(profile, path);
      const importance = index < 2 ? 'critical' : index < 4 ? 'high' : 'medium';

      return {
        field: path,
        displayName: this.getFieldDisplayName(path),
        importance: importance as 'critical' | 'high' | 'medium' | 'low',
        currentlyFilled: isFilled,
        impactIfFilled: this.getFieldImpactDescription(path),
      };
    });
  }

  /**
   * Check if a nested field is filled
   */
  private isFieldFilled(profile: ActivityProfile, path: string): boolean {
    const parts = path.split('.');
    let current: unknown = profile;

    for (const part of parts) {
      if (current === null || current === undefined) return false;
      current = (current as Record<string, unknown>)[part];
    }

    if (Array.isArray(current)) return current.length > 0;
    if (typeof current === 'string') return current.length > 0;
    if (typeof current === 'number') return current > 0;
    if (typeof current === 'boolean') return current;
    if (typeof current === 'object') return Object.keys(current as object).length > 0;

    return false;
  }

  /**
   * Get human-readable field name
   */
  private getFieldDisplayName(path: string): string {
    const names: Record<string, string> = {
      'facts.scale.peopleDirectlyImpacted': 'People directly impacted',
      'facts.scale.teamSize': 'Team size',
      'facts.scale.budgetManaged': 'Budget managed',
      'facts.scale.resourcesCreated': 'Resources created',
      'facts.recognition': 'Recognition and awards',
      'facts.artifacts': 'Tangible artifacts created',
      'facts.duration.totalYears': 'Years involved',
      'story.keyMoments': 'Key moments and breakthroughs',
      'story.origin.howStarted': 'Origin story',
      'story.origin.initialMotivation': 'Initial motivation',
      'story.relationships': 'Important relationships',
      'meaning.whyItMatters': 'Why this matters to you',
      'meaning.skills': 'Skills developed',
      'meaning.proudestMoment': 'Proudest moment',
      'meaning.personalGrowth': 'Personal growth areas',
      'impact.directBeneficiaries': 'People you helped',
      'impact.beforeAfter': 'Before/after impact',
      'impact.testimonials': 'Testimonials from others',
      'impact.externalAdoption': 'External adoption of your work',
      'connections.spikeRelevance': 'Connection to your spike',
      'connections.majorAlignment': 'Alignment with intended major',
      'connections.characterTraits': 'Character traits demonstrated',
    };

    return names[path] || path.split('.').pop() || path;
  }

  /**
   * Get description of impact if field is filled
   */
  private getFieldImpactDescription(path: string): string {
    const impacts: Record<string, string> = {
      'facts.scale.peopleDirectlyImpacted': 'Adds quantification that strengthens impact claims',
      'facts.scale.teamSize': 'Shows leadership scope and responsibility',
      'facts.recognition': 'Provides external validation of achievement',
      'facts.artifacts': 'Demonstrates tangible output and initiative',
      'story.keyMoments': 'Provides stories for essays and interviews',
      'story.origin.howStarted': 'Shows authentic interest and initiative',
      'meaning.whyItMatters': 'Reveals genuine passion and reflection',
      'meaning.skills': 'Connects activity to capabilities',
      'impact.directBeneficiaries': 'Makes impact concrete and believable',
      'impact.beforeAfter': 'Shows measurable change you created',
      'connections.spikeRelevance': 'Strengthens narrative coherence',
      'connections.characterTraits': 'Reveals character beyond the activity',
    };

    return impacts[path] || 'Adds depth to your profile';
  }

  /**
   * Estimate potential score improvement from completing profile
   */
  private estimateScoreImpact(
    profile: ActivityProfile,
    sectionScores: Record<string, number>
  ): { description: number; activity: number; portfolio: number } {
    // Lower completeness = higher potential improvement
    const avgCompleteness = Object.values(sectionScores).reduce((a, b) => a + b, 0) / 5;
    const improvementPotential = (100 - avgCompleteness) / 100;

    return {
      // Description can improve significantly with more details
      description: Math.round(improvementPotential * 3 * 10) / 10,
      // Activity score improves moderately with verified facts
      activity: Math.round(improvementPotential * 1.5 * 10) / 10,
      // Portfolio improves with better connections
      portfolio: Math.round(improvementPotential * 1 * 10) / 10,
    };
  }

  /**
   * Generate recommended questions based on gaps
   */
  private generateRecommendedQuestions(
    profile: ActivityProfile,
    priorityFields: PriorityField[]
  ): string[] {
    const questions: string[] = [];
    const unfilled = priorityFields.filter(f => !f.currentlyFilled);

    for (const field of unfilled.slice(0, 5)) {
      const question = this.getQuestionForField(field.field, profile);
      if (question) questions.push(question);
    }

    return questions;
  }

  /**
   * Get a natural question for a specific field
   */
  private getQuestionForField(path: string, profile: ActivityProfile): string | null {
    const title = profile.activityTitle;
    const questions: Record<string, string> = {
      'facts.scale.peopleDirectlyImpacted': `How many people did you directly work with or help through ${title}?`,
      'facts.scale.teamSize': `How many people were on your team or in your group for ${title}?`,
      'facts.recognition': `Did you receive any awards, recognition, or selections related to ${title}?`,
      'facts.artifacts': `Did you create anything tangible through ${title} — like a guide, video, website, or resource?`,
      'story.keyMoments': `Was there a particular moment in ${title} that stands out — a breakthrough, a challenge you overcame, or something you're especially proud of?`,
      'story.origin.howStarted': `How did you first get involved in ${title}? What drew you to it?`,
      'story.relationships': `Was there a mentor, teammate, or other important relationship in ${title}?`,
      'meaning.whyItMatters': `Why does ${title} matter to you? What makes it meaningful beyond just participating?`,
      'meaning.proudestMoment': `What's the single moment in ${title} you're most proud of?`,
      'meaning.hardestChallenge': `What was the hardest challenge you faced in ${title}? How did you handle it?`,
      'impact.directBeneficiaries': `Who specifically benefited from your work in ${title}? Can you give me an example?`,
      'impact.beforeAfter': `What changed because of your involvement in ${title}? What was the situation before and after?`,
      'connections.spikeRelevance': `How does ${title} connect to your main interests or intended major?`,
      'connections.characterTraits': `What does ${title} show about who you are as a person?`,
    };

    return questions[path] || null;
  }

  // ============================================================================
  // PROFILE UPDATE METHODS
  // ============================================================================

  /**
   * Update profile with extracted information from conversation
   */
  updateProfile(
    profile: ActivityProfile,
    updates: Partial<{
      facts: Partial<ActivityProfile['facts']>;
      story: Partial<ActivityProfile['story']>;
      meaning: Partial<ActivityProfile['meaning']>;
      impact: Partial<ActivityProfile['impact']>;
      connections: Partial<ActivityProfile['connections']>;
    }>,
    conversationRecord?: Partial<ConversationRecord>
  ): ActivityProfile {
    const updatedProfile = { ...profile };

    // Deep merge updates
    if (updates.facts) {
      updatedProfile.facts = this.mergeSection(profile.facts, updates.facts);
    }
    if (updates.story) {
      updatedProfile.story = this.mergeSection(profile.story, updates.story);
    }
    if (updates.meaning) {
      updatedProfile.meaning = this.mergeSection(profile.meaning, updates.meaning);
    }
    if (updates.impact) {
      updatedProfile.impact = this.mergeSection(profile.impact, updates.impact);
    }
    if (updates.connections) {
      updatedProfile.connections = this.mergeSection(profile.connections, updates.connections);
    }

    // Update metadata
    updatedProfile.profileVersion = profile.profileVersion + 1;
    updatedProfile.lastUpdated = new Date().toISOString();

    // Record conversation if provided
    if (conversationRecord) {
      const record: ConversationRecord = {
        timestamp: new Date().toISOString(),
        questionsAsked: conversationRecord.questionsAsked || [],
        newInfoExtracted: conversationRecord.newInfoExtracted || [],
        fieldsUpdated: conversationRecord.fieldsUpdated || [],
        completenessBefore: profile.dataCompleteness,
        completenessAfter: 0, // Will be calculated
      };

      updatedProfile.metadata.conversationHistory.push(record);
    }

    // Recalculate completeness
    const completeness = this.calculateCompleteness(updatedProfile);
    updatedProfile.dataCompleteness = completeness.overall;
    updatedProfile.metadata.confidenceScores = {
      facts: completeness.sections.facts / 100,
      story: completeness.sections.story / 100,
      meaning: completeness.sections.meaning / 100,
      impact: completeness.sections.impact / 100,
      connections: completeness.sections.connections / 100,
    };
    updatedProfile.metadata.gapsIdentified = completeness.priorityFields
      .filter(f => !f.currentlyFilled && f.importance !== 'low')
      .map(f => f.displayName);
    updatedProfile.metadata.suggestedFollowUps = completeness.recommendedQuestions;
    updatedProfile.metadata.potentialScoreImpact = completeness.potentialScoreImpact;

    // Update conversation record completeness
    if (updatedProfile.metadata.conversationHistory.length > 0) {
      const lastRecord = updatedProfile.metadata.conversationHistory[
        updatedProfile.metadata.conversationHistory.length - 1
      ];
      lastRecord.completenessAfter = completeness.overall;
    }

    return updatedProfile;
  }

  /**
   * Deep merge two sections, handling arrays specially
   */
  private mergeSection<T extends object>(existing: T, updates: Partial<T>): T {
    const result = { ...existing };

    for (const key of Object.keys(updates) as Array<keyof T>) {
      const updateValue = updates[key];
      const existingValue = existing[key];

      if (Array.isArray(updateValue)) {
        // For arrays, append new items (avoiding duplicates by checking key fields)
        if (Array.isArray(existingValue)) {
          result[key] = this.mergeArrays(existingValue, updateValue) as T[keyof T];
        } else {
          result[key] = updateValue as T[keyof T];
        }
      } else if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
        // For nested objects, recursively merge
        if (existingValue && typeof existingValue === 'object') {
          result[key] = this.mergeSection(
            existingValue as object,
            updateValue as object
          ) as T[keyof T];
        } else {
          result[key] = updateValue as T[keyof T];
        }
      } else if (updateValue !== undefined && updateValue !== null && updateValue !== '') {
        // For primitives, update if new value is meaningful
        result[key] = updateValue as T[keyof T];
      }
    }

    return result;
  }

  /**
   * Merge arrays avoiding duplicates
   */
  private mergeArrays<T>(existing: T[], updates: T[]): T[] {
    // For simple deduplication, use JSON stringification
    // In production, you'd want smarter deduplication based on key fields
    const existingSet = new Set(existing.map(item => JSON.stringify(item)));
    const result = [...existing];

    for (const item of updates) {
      const key = JSON.stringify(item);
      if (!existingSet.has(key)) {
        result.push(item);
        existingSet.add(key);
      }
    }

    return result;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Add a key moment to the profile
   */
  addKeyMoment(profile: ActivityProfile, moment: KeyMoment): ActivityProfile {
    return this.updateProfile(profile, {
      story: {
        keyMoments: [...profile.story.keyMoments, moment],
      },
    });
  }

  /**
   * Add recognition to the profile
   */
  addRecognition(profile: ActivityProfile, recognition: ActivityRecognition): ActivityProfile {
    return this.updateProfile(profile, {
      facts: {
        recognition: [...profile.facts.recognition, recognition],
      },
    });
  }

  /**
   * Add an artifact to the profile
   */
  addArtifact(profile: ActivityProfile, artifact: ActivityArtifact): ActivityProfile {
    return this.updateProfile(profile, {
      facts: {
        artifacts: [...profile.facts.artifacts, artifact],
      },
    });
  }

  /**
   * Add an authentic quote
   */
  addAuthenticQuote(profile: ActivityProfile, quote: AuthenticQuote): ActivityProfile {
    return this.updateProfile(profile, {
      meaning: {
        authenticQuotes: [...profile.meaning.authenticQuotes, quote],
      },
    });
  }

  /**
   * Add a beneficiary
   */
  addBeneficiary(profile: ActivityProfile, beneficiary: Beneficiary): ActivityProfile {
    return this.updateProfile(profile, {
      impact: {
        directBeneficiaries: [...profile.impact.directBeneficiaries, beneficiary],
      },
    });
  }

  /**
   * Add a character trait demonstration
   */
  addCharacterTrait(profile: ActivityProfile, trait: CharacterTraitDemonstration): ActivityProfile {
    return this.updateProfile(profile, {
      connections: {
        characterTraits: [...profile.connections.characterTraits, trait],
      },
    });
  }

  /**
   * Determine priority for developing this profile
   */
  assessDevelopmentPriority(
    profile: ActivityProfile,
    context?: {
      activityScore?: number;
      descriptionScore?: number;
      isSpike?: boolean;
      hoursInvested?: number;
    }
  ): 'high' | 'medium' | 'low' {
    let priorityScore = 0;

    // Low completeness = higher priority
    if (profile.dataCompleteness < 30) priorityScore += 3;
    else if (profile.dataCompleteness < 60) priorityScore += 2;
    else if (profile.dataCompleteness < 80) priorityScore += 1;

    // Big gap between activity quality and description = high priority
    if (context?.activityScore && context?.descriptionScore) {
      const gap = context.activityScore - context.descriptionScore;
      if (gap > 3) priorityScore += 3;
      else if (gap > 2) priorityScore += 2;
      else if (gap > 1) priorityScore += 1;
    }

    // Spike activity = high priority
    if (context?.isSpike) priorityScore += 3;

    // High time investment = higher priority
    if (context?.hoursInvested) {
      if (context.hoursInvested > 500) priorityScore += 2;
      else if (context.hoursInvested > 200) priorityScore += 1;
    }

    if (priorityScore >= 6) return 'high';
    if (priorityScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get a summary of what we know vs don't know
   */
  getProfileSummary(profile: ActivityProfile): {
    known: string[];
    unknown: string[];
    completeness: number;
    priority: 'high' | 'medium' | 'low';
  } {
    const known: string[] = [];
    const unknown: string[] = [];

    // Check key fields
    if (profile.facts.duration.totalYears > 0) {
      known.push(`${profile.facts.duration.totalYears} years of involvement`);
    } else {
      unknown.push('Duration of involvement');
    }

    if (profile.facts.scale.peopleDirectlyImpacted) {
      known.push(`Impacted ${profile.facts.scale.peopleDirectlyImpacted} people directly`);
    } else {
      unknown.push('Number of people impacted');
    }

    if (profile.facts.recognition.length > 0) {
      known.push(`${profile.facts.recognition.length} recognition(s) received`);
    } else {
      unknown.push('Recognition or awards');
    }

    if (profile.story.keyMoments.length > 0) {
      known.push(`${profile.story.keyMoments.length} key moment(s) captured`);
    } else {
      unknown.push('Key moments or breakthroughs');
    }

    if (profile.meaning.whyItMatters) {
      known.push('Why it matters to them');
    } else {
      unknown.push('Personal significance');
    }

    if (profile.impact.directBeneficiaries.length > 0) {
      known.push(`${profile.impact.directBeneficiaries.length} beneficiary group(s)`);
    } else {
      unknown.push('Who specifically benefited');
    }

    return {
      known,
      unknown,
      completeness: profile.dataCompleteness,
      priority: this.assessDevelopmentPriority(profile),
    };
  }
}

// Export singleton
export const activityProfileService = new ActivityProfileService();
