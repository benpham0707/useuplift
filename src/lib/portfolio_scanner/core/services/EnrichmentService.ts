// src/core/services/EnrichmentService.ts

import { injectable, inject } from 'inversify';
import { 
  EnrichmentPriority,
  EnrichmentRequest,
  EnrichmentSession,
  DataCollectionStep,
  FieldDefinition,
  ProfileLevel,
  PROFILE_CONSTANTS
} from '../../shared/types/enhanced.types';
import { UserProfile, UserContext, ProfileStatus } from '../domain/entities/UserProfile';
import { IPortfolioRepository } from '../repositories/interfaces/IPortfolioRepository';
import { ProfileNotFoundError, ProfileIncompleteError } from '../../shared/errors/ProfileErrors';
import { EnrichmentQueue } from '../../infrastructure/queue/EnrichmentQueue';
import { RedisProfileCache, CacheKeyGenerator } from '../../infrastructure/cache/RedisProfileCache';
import { AnalyticsQueue } from '../../infrastructure/queue/AnalyticsQueue';
import { Logger } from '../../shared/utils/logger';

interface EnrichmentStrategy {
  profileId: string;
  currentLevel: ProfileLevel;
  priorities: EnrichmentPriority[];
  incentives: Map<string, string>;
  timeline: Date;
}

interface EnrichmentTemplate {
  id: string;
  name: string;
  description: string;
  steps: DataCollectionStep[];
  conditions?: {
    userContext?: UserContext[];
    minLevel?: string;
    goals?: string[];
  };
}

@injectable()
export class EnrichmentService {
  private readonly templates: Map<string, EnrichmentTemplate>;
  private readonly activeSessions: Map<string, EnrichmentSession>;

  constructor(
    @inject('IPortfolioRepository') private repository: IPortfolioRepository,
    @inject(EnrichmentQueue) private enrichmentQueue: EnrichmentQueue,
    @inject(RedisProfileCache) private cache: RedisProfileCache,
    @inject(AnalyticsQueue) private analyticsQueue: AnalyticsQueue,
    @inject(Logger) private logger: Logger
  ) {
    this.templates = this.initializeTemplates();
    this.activeSessions = new Map();
  }

  // Schedule Initial Enrichment

  public async scheduleInitialEnrichment(
    profileId: string,
    priorities?: EnrichmentPriority[]
  ): Promise<void> {
    try {
      const profile = await this.repository.getProfile(profileId);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Calculate priorities if not provided
      const enrichmentPriorities = priorities || profile.getEnrichmentPriorities();

      // Create enrichment strategy
      const strategy = this.createEnrichmentStrategy(profile, enrichmentPriorities);

      // Schedule high priority items immediately
      const highPriority = strategy.priorities.filter(p => p.priority === 'high');
      if (highPriority.length > 0) {
        await this.enrichmentQueue.scheduleEnrichment(
          profileId,
          highPriority,
          0 // No delay
        );
      }

      // Schedule medium priority items with delay
      const mediumPriority = strategy.priorities.filter(p => p.priority === 'medium');
      if (mediumPriority.length > 0) {
        await this.enrichmentQueue.scheduleEnrichment(
          profileId,
          mediumPriority,
          300000 // 5 minutes delay
        );
      }

      // Cache the strategy
      await this.cache.set(
        CacheKeyGenerator.enrichmentPriorities(profileId),
        strategy,
        PROFILE_CONSTANTS.CACHE_TTL.PROFILE
      );

      this.logger.info('Initial enrichment scheduled', {
        profileId,
        priorities: enrichmentPriorities.length
      });
    } catch (error) {
      this.logger.error('Failed to schedule initial enrichment', { error, profileId });
      throw error;
    }
  }

  // Get Next Enrichment Step

  public async getNextEnrichmentStep(profileId: string): Promise<DataCollectionStep | null> {
    try {
      const profile = await this.repository.getProfile(profileId);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Get current priorities
      const priorities = profile.getEnrichmentPriorities();
      if (priorities.length === 0) {
        return null;
      }

      // Get or create session
      let session = this.activeSessions.get(profileId);
      if (!session) {
        session = this.createEnrichmentSession(profileId, priorities[0]);
        this.activeSessions.set(profileId, session);
      }

      // Find the appropriate template
      const template = this.findTemplateForPriority(priorities[0], profile);
      if (!template) {
        return null;
      }

      // Get the next uncompleted step
      const nextStep = template.steps.find(step => 
        !session!.itemsCompleted.includes(step.id)
      );

      if (nextStep) {
        // Add context-specific information
        return this.enhanceStepWithContext(nextStep, profile);
      }

      // Mark session as complete
      session.endTime = new Date();
      session.completionRate = 1.0;
      
      // Move to next priority
      await this.moveToNextPriority(profileId);

      return this.getNextEnrichmentStep(profileId);
    } catch (error) {
      this.logger.error('Failed to get next enrichment step', { error, profileId });
      throw error;
    }
  }

  // Submit Enrichment Data

  public async submitEnrichmentData(
    profileId: string,
    stepId: string,
    data: Record<string, any>
  ): Promise<{
    success: boolean;
    nextStep?: DataCollectionStep;
    reward?: string;
  }> {
    try {
      const profile = await this.repository.getProfile(profileId);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Validate the submission
      const validation = await this.validateEnrichmentData(stepId, data);
      if (!validation.isValid) {
        return {
          success: false,
          nextStep: await this.getNextEnrichmentStep(profileId)
        };
      }

      // Process the data based on step type
      await this.processEnrichmentData(profile, stepId, data);

      // Update session
      const session = this.activeSessions.get(profileId);
      if (session) {
        session.itemsCompleted.push(stepId);
        session.completionRate = this.calculateSessionCompletion(session, profileId);
      }

      // Check for rewards/unlocks
      const reward = this.checkForRewards(profile, stepId);

      // Get next step
      const nextStep = await this.getNextEnrichmentStep(profileId);

      // Track analytics
      await this.analyticsQueue.push({
        profileId,
        eventType: 'enrichment_completed',
        timestamp: new Date(),
        metadata: {
          stepId,
          sessionId: session?.id,
          completionRate: session?.completionRate
        }
      });

      return {
        success: true,
        nextStep,
        reward
      };
    } catch (error) {
      this.logger.error('Failed to submit enrichment data', { error, profileId, stepId });
      throw error;
    }
  }

  // Smart Enrichment Suggestions

  public async getSmartSuggestions(
    profileId: string,
    context: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      const profile = await this.repository.getProfile(profileId);
      if (!profile) return suggestions;

      // Context-based suggestions
      switch (context) {
        case 'experiences':
          suggestions.push(...this.generateExperienceSuggestions(profile));
          break;
        
        case 'achievements':
          suggestions.push(...this.generateAchievementSuggestions(profile));
          break;
        
        case 'skills':
          suggestions.push(...this.generateSkillSuggestions(profile));
          break;
        
        case 'goals':
          suggestions.push(...this.generateGoalSuggestions(profile));
          break;
      }

      // AI-powered suggestions based on similar profiles
      const similarProfiles = await this.findSimilarProfiles(profile);
      suggestions.push(...this.extractSuggestionsFromSimilar(similarProfiles, context));

      return [...new Set(suggestions)]; // Remove duplicates
    } catch (error) {
      this.logger.error('Failed to generate smart suggestions', { error, profileId, context });
      return suggestions;
    }
  }

  // Gamification Methods

  public async getEnrichmentProgress(profileId: string): Promise<{
    level: ProfileLevel;
    points: number;
    nextMilestone: {
      name: string;
      description: string;
      pointsRequired: number;
      reward: string;
    };
    recentAchievements: string[];
  }> {
    const profile = await this.repository.getProfile(profileId);
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }

    const level = this.calculateProfileLevel(profile.completionScore.overall);
    const points = Math.floor(profile.completionScore.overall * 1000);

    const nextMilestone = this.getNextMilestone(level, points);
    const recentAchievements = await this.getRecentAchievements(profileId);

    return {
      level,
      points,
      nextMilestone,
      recentAchievements
    };
  }

  // Private Helper Methods

  private createEnrichmentStrategy(
    profile: UserProfile,
    priorities: EnrichmentPriority[]
  ): EnrichmentStrategy {
    const incentives = new Map<string, string>();

    // Create incentives for each priority
    priorities.forEach(priority => {
      const incentive = this.generateIncentive(priority, profile);
      incentives.set(priority.type, incentive);
    });

    return {
      profileId: profile.id,
      currentLevel: this.calculateProfileLevel(profile.completionScore.overall),
      priorities,
      incentives,
      timeline: this.calculateTimeline(profile)
    };
  }

  private generateIncentive(priority: EnrichmentPriority, profile: UserProfile): string {
    const incentiveMap: Record<string, string> = {
      'academic_record': 'Unlock personalized college recommendations and GPA analysis',
      'test_scores': 'Get custom test prep strategies and score improvement predictions',
      'experiences': 'Discover hidden skills and generate compelling narratives',
      'achievements': 'Highlight your unique value and stand out from other applicants',
      'skills': 'Get matched with opportunities that value your abilities',
      'narrative': 'Create a cohesive story that resonates with admissions officers'
    };

    return incentiveMap[priority.type] || 'Improve your profile completeness';
  }

  private createEnrichmentSession(
    profileId: string,
    priority: EnrichmentPriority
  ): EnrichmentSession {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      profileId,
      startTime: new Date(),
      itemsCompleted: [],
      completionRate: 0
    };
  }

  private findTemplateForPriority(
    priority: EnrichmentPriority,
    profile: UserProfile
  ): EnrichmentTemplate | null {
    // Find templates that match the priority type and user context
    for (const template of this.templates.values()) {
      if (template.id === priority.type) {
        // Check conditions
        if (template.conditions) {
          if (template.conditions.userContext && 
              !template.conditions.userContext.includes(profile.userContext)) {
            continue;
          }
          
          if (template.conditions.goals && 
              !template.conditions.goals.includes(profile.goals.primaryGoal)) {
            continue;
          }
        }
        
        return template;
      }
    }
    
    return null;
  }

  private enhanceStepWithContext(
    step: DataCollectionStep,
    profile: UserProfile
  ): DataCollectionStep {
    // Add personalized help text based on user context
    const enhancedStep = { ...step };

    if (profile.userContext.includes('high_school')) {
      enhancedStep.fields = enhancedStep.fields.map(field => ({
        ...field,
        helpText: this.getHighSchoolHelpText(field.name) || field.helpText
      }));
    }

    if (profile.demographics.firstGenerationStudent) {
      enhancedStep.description += ' As a first-generation student, this information is especially important for accessing opportunities designed for you.';
    }

    return enhancedStep;
  }

  private getHighSchoolHelpText(fieldName: string): string | null {
    const helpTexts: Record<string, string> = {
      'gpa': 'Enter your current GPA. If your school uses weighted GPA, you can enter that too.',
      'activities': 'Include clubs, sports, volunteer work, jobs, and family responsibilities.',
      'test_scores': 'Include SAT, ACT, AP scores if you have them. Leave blank if you haven\'t taken them yet.',
      'awards': 'Any recognition counts - honor roll, perfect attendance, team awards, etc.'
    };

    return helpTexts[fieldName] || null;
  }

  private async validateEnrichmentData(
    stepId: string,
    data: Record<string, any>
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    // Basic validation - would be enhanced with actual validation rules
    const errors: string[] = [];

    // Check required fields
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        errors.push(`${key} is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async processEnrichmentData(
    profile: UserProfile,
    stepId: string,
    data: Record<string, any>
  ): Promise<void> {
    // Process based on step type
    switch (stepId) {
      case 'basic_academic':
        await this.processAcademicData(profile, data);
        break;
      
      case 'test_scores':
        await this.processTestScores(profile, data);
        break;
      
      case 'experiences':
        await this.processExperiences(profile, data);
        break;
      
      case 'achievements':
        await this.processAchievements(profile, data);
        break;
      
      default:
        // Generic processing
        await this.repository.updateProfile(profile);
    }
  }

  private async processAcademicData(profile: UserProfile, data: any): Promise<void> {
    // Implementation would update academic record
    this.logger.info('Processing academic data', { profileId: profile.id });
  }

  private async processTestScores(profile: UserProfile, data: any): Promise<void> {
    // Implementation would add test scores
    this.logger.info('Processing test scores', { profileId: profile.id });
  }

  private async processExperiences(profile: UserProfile, data: any): Promise<void> {
    // Implementation would add experiences
    this.logger.info('Processing experiences', { profileId: profile.id });
  }

  private async processAchievements(profile: UserProfile, data: any): Promise<void> {
    // Implementation would add achievements
    this.logger.info('Processing achievements', { profileId: profile.id });
  }

  private calculateSessionCompletion(session: EnrichmentSession, profileId: string): number {
    // Calculate based on completed items vs total items
    const totalSteps = 10; // Would be dynamic based on template
    return session.itemsCompleted.length / totalSteps;
  }

  private checkForRewards(profile: UserProfile, stepId: string): string | undefined {
    // Check if completing this step unlocks any rewards
    const rewards: Record<string, string> = {
      'basic_academic': 'Unlocked: College Match Predictions',
      'test_scores': 'Unlocked: Test Prep Recommendations',
      'first_experience': 'Unlocked: Skill Analysis Dashboard',
      'first_achievement': 'Unlocked: Achievement Impact Scorer'
    };

    return rewards[stepId];
  }

  private async moveToNextPriority(profileId: string): Promise<void> {
    const profile = await this.repository.getProfile(profileId);
    if (!profile) return;

    // Mark current priority as complete and move to next
    profile.markEnriched(profile.getEnrichmentPriorities().slice(1));
    await this.repository.updateProfile(profile);
  }

  private calculateProfileLevel(completionScore: number): ProfileLevel {
    if (completionScore >= PROFILE_CONSTANTS.COMPLETION_THRESHOLDS.PLATINUM) {
      return {
        current: 'platinum',
        progress: 100,
        unlockedFeatures: ['all_features'],
        nextMilestone: {
          level: 'max',
          requirement: 'Profile complete',
          reward: 'Full platform access'
        }
      };
    }
    
    if (completionScore >= PROFILE_CONSTANTS.COMPLETION_THRESHOLDS.GOLD) {
      const progress = ((completionScore - 0.8) / 0.15) * 100;
      return {
        current: 'gold',
        progress,
        unlockedFeatures: ['advanced_analytics', 'priority_support'],
        nextMilestone: {
          level: 'platinum',
          requirement: 'Complete all sections',
          reward: 'Personalized counselor review'
        }
      };
    }
    
    if (completionScore >= PROFILE_CONSTANTS.COMPLETION_THRESHOLDS.SILVER) {
      const progress = ((completionScore - 0.6) / 0.2) * 100;
      return {
        current: 'silver',
        progress,
        unlockedFeatures: ['skill_analysis', 'basic_matching'],
        nextMilestone: {
          level: 'gold',
          requirement: 'Add 3 experiences and 2 achievements',
          reward: 'Advanced analytics dashboard'
        }
      };
    }
    
    const progress = (completionScore / 0.6) * 100;
    return {
      current: 'bronze',
      progress,
      unlockedFeatures: ['basic_features'],
      nextMilestone: {
        level: 'silver',
        requirement: 'Complete academic record and add first experience',
        reward: 'Skill analysis unlocked'
      }
    };
  }

  private getNextMilestone(level: ProfileLevel, points: number): any {
    const milestones = {
      bronze: { name: 'Rising Star', pointsRequired: 600, reward: 'Silver status + skill analysis' },
      silver: { name: 'Achiever', pointsRequired: 800, reward: 'Gold status + advanced features' },
      gold: { name: 'Expert', pointsRequired: 950, reward: 'Platinum status + priority support' },
      platinum: { name: 'Master', pointsRequired: 1000, reward: 'Exclusive opportunities' }
    };

    return {
      ...milestones[level.current],
      description: `Reach ${milestones[level.current].pointsRequired} points to unlock ${milestones[level.current].reward}`
    };
  }

  private async getRecentAchievements(profileId: string): Promise<string[]> {
    // Would fetch from analytics/event store
    return [
      'First experience added',
      'Profile 50% complete',
      'Skills identified: 10+'
    ];
  }

  private calculateTimeline(profile: UserProfile): Date {
    // Calculate deadline based on user's goals
    const baseDate = new Date();
    
    switch (profile.goals.timelineUrgency) {
      case 'immediate':
        return new Date(baseDate.setDate(baseDate.getDate() + 7));
      case 'this_year':
        return new Date(baseDate.setMonth(baseDate.getMonth() + 6));
      case 'next_year':
        return new Date(baseDate.setFullYear(baseDate.getFullYear() + 1));
      default:
        return new Date(baseDate.setFullYear(baseDate.getFullYear() + 2));
    }
  }

  private generateExperienceSuggestions(profile: UserProfile): string[] {
    const suggestions: string[] = [];

    if (profile.userContext.includes('high_school')) {
      suggestions.push(
        'Part-time job or internship',
        'School club leadership role',
        'Volunteer work in your community',
        'Personal projects or hobbies',
        'Family responsibilities'
      );
    }

    if (profile.goals.targetCareers?.includes('tech')) {
      suggestions.push(
        'Coding projects on GitHub',
        'Hackathon participation',
        'Tech blog or YouTube channel'
      );
    }

    return suggestions;
  }

  private generateAchievementSuggestions(profile: UserProfile): string[] {
    return [
      'Academic honors (Honor Roll, AP Scholar)',
      'Competition awards (Science Fair, Math Olympiad)',
      'Athletic achievements',
      'Community service recognition',
      'Creative accomplishments (art, music, writing)'
    ];
  }

  private generateSkillSuggestions(profile: UserProfile): string[] {
    const skills: string[] = [];

    // Based on experiences
    if (profile.experiences.some(e => e.type === 'leadership')) {
      skills.push('Team management', 'Communication', 'Decision making');
    }

    // Based on academic interests
    if (profile.academicRecord?.strongSubjects.includes('mathematics')) {
      skills.push('Analytical thinking', 'Problem solving', 'Data analysis');
    }

    return skills;
  }

  private generateGoalSuggestions(profile: UserProfile): string[] {
    const suggestions: string[] = [];

    if (profile.goals.primaryGoal === 'college_admission') {
      suggestions.push(
        'Target specific colleges or programs',
        'Identify scholarship opportunities',
        'Plan standardized test timeline',
        'Build relationships with recommenders'
      );
    }

    return suggestions;
  }

  private async findSimilarProfiles(profile: UserProfile): Promise<UserProfile[]> {
    // Would use vector similarity search in production
    return [];
  }

  private extractSuggestionsFromSimilar(
    similarProfiles: UserProfile[],
    context: string
  ): string[] {
    // Extract common patterns from similar successful profiles
    return [];
  }

  private initializeTemplates(): Map<string, EnrichmentTemplate> {
    const templates = new Map<string, EnrichmentTemplate>();

    // Academic Record Template
    templates.set('academic_record', {
      id: 'academic_record',
      name: 'Academic Information',
      description: 'Add your academic record to unlock college matching',
      steps: [
        {
          id: 'basic_academic',
          title: 'Basic Academic Info',
          description: 'Tell us about your academic performance',
          fields: [
            {
              name: 'gpa',
              type: 'number',
              label: 'Current GPA',
              placeholder: '3.5',
              validation: {
                required: true,
                min: 0,
                max: 5
              }
            },
            {
              name: 'gpaScale',
              type: 'select',
              label: 'GPA Scale',
              options: [
                { value: '4.0', label: '4.0 Scale' },
                { value: '5.0', label: '5.0 Scale' },
                { value: '100', label: '100 Point Scale' }
              ],
              validation: { required: true }
            },
            {
              name: 'classRank',
              type: 'number',
              label: 'Class Rank (optional)',
              placeholder: '25'
            },
            {
              name: 'classSize',
              type: 'number',
              label: 'Class Size (optional)',
              placeholder: '250'
            }
          ],
          required: true,
          estimatedTime: '5 minutes',
          completionIncentive: 'Unlock college matching algorithm'
        },
        {
          id: 'coursework',
          title: 'Coursework',
          description: 'Add your challenging courses',
          fields: [
            {
              name: 'courses',
              type: 'multiselect',
              label: 'AP/IB/Honors Courses',
              options: [
                { value: 'ap_calculus', label: 'AP Calculus' },
                { value: 'ap_biology', label: 'AP Biology' },
                { value: 'ap_english', label: 'AP English' },
                // ... more options
              ]
            }
          ],
          required: false,
          estimatedTime: '5 minutes'
        }
      ],
      conditions: {
        userContext: ['high_school_9th', 'high_school_10th', 'high_school_11th', 'high_school_12th']
      }
    });

    // Test Scores Template
    templates.set('test_scores', {
      id: 'test_scores',
      name: 'Standardized Test Scores',
      description: 'Add test scores for better college matching',
      steps: [
        {
          id: 'test_scores',
          title: 'Test Scores',
          description: 'Add your standardized test scores',
          fields: [
            {
              name: 'testType',
              type: 'select',
              label: 'Test Type',
              options: [
                { value: 'SAT', label: 'SAT' },
                { value: 'ACT', label: 'ACT' },
                { value: 'AP', label: 'AP Exam' }
              ]
            },
            {
              name: 'score',
              type: 'text',
              label: 'Score',
              placeholder: '1450 or 32'
            },
            {
              name: 'testDate',
              type: 'date',
              label: 'Test Date'
            }
          ],
          required: false,
          estimatedTime: '2 minutes'
        }
      ]
    });

    // Add more templates as needed...

    return templates;
  }
}

export default EnrichmentService;