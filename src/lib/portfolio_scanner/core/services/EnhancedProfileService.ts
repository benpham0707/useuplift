// src/core/services/EnhancedProfileService.ts

import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/types';
import { 
  IPortfolioRepository, 
  Transaction 
} from '../repositories/interfaces/IPortfolioRepository';
import { UserProfile, UserContext, ProfileStatus } from '../domain/entities/UserProfile';
import { AcademicRecord } from '../domain/entities/AcademicRecord';
import { Experience } from '../domain/entities/Experience';
import { Achievement } from '../domain/entities/Achievement';
import { ValidationService } from './ValidationService';
import { EnrichmentService } from './EnrichmentService';
import { 
  ProfileDTO,
  AcademicRecordDTO,
  ExperienceDTO,
  AchievementDTO,
  ProfileAnalysis,
  EnrichmentPriority
} from '../../shared/types/enhanced.types';
import { 
  ProfileNotFoundError, 
  ProfileAlreadyExistsError,
  ProfileIncompleteError,
  ValidationError 
} from '../../shared/errors/ProfileErrors';
import { RedisProfileCache, CacheKeyGenerator } from '../../infrastructure/cache/RedisProfileCache';
import { EventStore } from '../../infrastructure/events/EventStore';
import { AnalyticsQueue } from '../../infrastructure/events/EventStore';
import { Logger } from '../../shared/utils/logger';
import { PerformanceMonitor } from '../../shared/utils/logger';

@injectable()
export class EnhancedProfileService {
  constructor(
    @inject(TYPES.IPortfolioRepository) private repository: IPortfolioRepository,
    @inject(TYPES.ValidationService) private validationService: ValidationService,
    @inject(TYPES.EnrichmentService) private enrichmentService: EnrichmentService,
    @inject(TYPES.RedisProfileCache) private cache: RedisProfileCache,
    @inject(TYPES.EventStore) private eventStore: EventStore,
    @inject(TYPES.AnalyticsQueue) private analyticsQueue: AnalyticsQueue,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.PerformanceMonitor) private performanceMonitor: PerformanceMonitor
  ) {}

  // Profile CRUD Operations

  public async createProfile(
    request: ProfileDTO.CreateRequest
  ): Promise<ProfileDTO.Response> {
    const timer = this.performanceMonitor.startTimer('createProfile', {
      userId: request.userId
    });

    try {
      // Validate request
      const validation = await this.validationService.validateCreateProfileRequest(request);
      if (!validation.isValid) {
        throw new ValidationError(
          validation.errors.map(e => ({ field: 'request', message: e }))
        );
      }

      // Check for existing profile
      const existingProfile = await this.repository.getProfileByUserId(request.userId);
      if (existingProfile) {
        throw new ProfileAlreadyExistsError(request.userId);
      }

      // Begin transaction
      const transaction = await this.repository.beginTransaction();

      try {
        // Create profile entity
        const profile = new UserProfile({
          userId: request.userId,
          userContext: request.userContext,
          goals: request.goals,
          constraints: request.constraints,
          demographics: request.demographics
        });

        // Save to repository
        const savedProfile = await this.repository.saveProfile(profile, transaction);

        // Schedule initial enrichment
        await this.enrichmentService.scheduleInitialEnrichment(savedProfile.id);

        // Commit transaction
        await transaction.commit();

        // Cache the profile
        await this.cache.set(
          CacheKeyGenerator.profile(savedProfile.id),
          savedProfile,
          3600
        );

        // Track analytics
        await this.analyticsQueue.push({
          profileId: savedProfile.id,
          eventType: 'profile_created',
          timestamp: new Date(),
          metadata: {
            userContext: savedProfile.userContext,
            primaryGoal: savedProfile.goals.primaryGoal
          }
        });

        // Store domain event
        await this.eventStore.store({
          eventId: `evt_${Date.now()}`,
          eventType: 'ProfileCreated',
          aggregateId: savedProfile.id,
          aggregateType: 'profile',
          eventData: {
            userId: savedProfile.userId,
            userContext: savedProfile.userContext
          },
          eventMetadata: {
            userId: request.userId,
            timestamp: new Date(),
            version: 1
          }
        });

        timer.end({ success: true });

        return this.mapToResponse(savedProfile);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to create profile', { error, request });
      throw error;
    }
  }

  public async getProfile(profileId: string): Promise<ProfileDTO.DetailedResponse> {
    const timer = this.performanceMonitor.startTimer('getProfile', { profileId });

    try {
      // Check cache first
      const cacheKey = CacheKeyGenerator.profile(profileId);
      let profile = await this.cache.get<UserProfile>(cacheKey);

      if (!profile) {
        // Load from repository
        profile = await this.repository.getProfile(profileId);
        
        if (!profile) {
          throw new ProfileNotFoundError(profileId);
        }

        // Cache for future requests
        await this.cache.set(cacheKey, profile, 3600);
      }

      // Load related data
      const [experiences, achievements, academicRecord] = await Promise.all([
        this.repository.getExperiences(profileId),
        this.repository.getAchievements(profileId),
        this.repository.getAcademicRecord(profileId)
      ]);

      // Attach to profile
      profile.experiences = experiences;
      profile.achievements = achievements;
      if (academicRecord) {
        profile.academicRecord = academicRecord;
      }

      timer.end({ success: true });

      return this.mapToDetailedResponse(profile);
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to get profile', { error, profileId });
      throw error;
    }
  }

  public async updateProfile(
    request: ProfileDTO.UpdateRequest
  ): Promise<ProfileDTO.Response> {
    const timer = this.performanceMonitor.startTimer('updateProfile', {
      profileId: request.profileId
    });

    try {
      // Get existing profile
      const profile = await this.repository.getProfile(request.profileId);
      if (!profile) {
        throw new ProfileNotFoundError(request.profileId);
      }

      // Validate update
      const validation = this.validationService.validateUpdateProfileRequest(request, profile);
      if (!validation.isValid) {
        throw new ValidationError(
          validation.errors.map(e => ({ field: 'request', message: e }))
        );
      }

      // Apply updates
      if (request.updates.userContext) {
        profile.userContext = request.updates.userContext;
      }
      if (request.updates.status) {
        profile.status = request.updates.status;
      }
      if (request.updates.goals) {
        profile.updateGoals(request.updates.goals);
      }
      if (request.updates.constraints) {
        profile.updateConstraints(request.updates.constraints);
      }
      if (request.updates.demographics) {
        profile.updateDemographics(request.updates.demographics);
      }

      // Save updates
      const updatedProfile = await this.repository.updateProfile(profile);

      // Invalidate cache
      await this.cache.delete(CacheKeyGenerator.profile(profile.id));

      // Track analytics
      await this.analyticsQueue.push({
        profileId: profile.id,
        eventType: 'profile_updated',
        timestamp: new Date(),
        metadata: {
          updatedFields: Object.keys(request.updates)
        }
      });

      timer.end({ success: true });

      return this.mapToResponse(updatedProfile);
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to update profile', { error, request });
      throw error;
    }
  }

  // Experience Management

  public async addExperience(
    profileId: string,
    experienceData: ExperienceDTO.CreateRequest
  ): Promise<ExperienceDTO.Response> {
    const timer = this.performanceMonitor.startTimer('addExperience', { profileId });

    try {
      // Validate profile exists
      const profile = await this.repository.getProfile(profileId);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Validate experience
      await this.validationService.validateExperience(experienceData, profileId);

      // Create experience entity
      const experience = new Experience({
        profileId,
        title: experienceData.title,
        organization: experienceData.organization,
        type: experienceData.type,
        startDate: new Date(experienceData.startDate),
        endDate: experienceData.endDate ? new Date(experienceData.endDate) : undefined,
        timeCommitment: experienceData.timeCommitment,
        description: experienceData.description
      });

      // Add additional data
      experienceData.responsibilities?.forEach(r => experience.addResponsibility(r));
      experienceData.achievements?.forEach(a => experience.addAchievement(a));
      
      if (experienceData.metrics) {
        Object.entries(experienceData.metrics).forEach(([key, value]) => {
          experience.addMetric(key, value);
        });
      }

      // Save experience
      const savedExperience = await this.repository.saveExperience(experience);

      // Update profile
      profile.addExperience(savedExperience);
      await this.repository.updateProfile(profile);

      // Invalidate cache
      await this.cache.delete(CacheKeyGenerator.profile(profileId));
      await this.cache.delete(CacheKeyGenerator.experiences(profileId));

      // Track analytics
      await this.analyticsQueue.push({
        profileId,
        eventType: 'experience_added',
        timestamp: new Date(),
        metadata: {
          experienceType: experience.type,
          duration: experience.calculateDuration()
        }
      });

      timer.end({ success: true });

      return this.mapExperienceToResponse(savedExperience);
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to add experience', { error, profileId });
      throw error;
    }
  }

  // Achievement Management

  public async addAchievement(
    profileId: string,
    achievementData: AchievementDTO.CreateRequest
  ): Promise<AchievementDTO.Response> {
    const timer = this.performanceMonitor.startTimer('addAchievement', { profileId });

    try {
      // Validate profile exists
      const profile = await this.repository.getProfile(profileId);
      if (!profile) {
        throw new ProfileNotFoundError(profileId);
      }

      // Validate achievement
      await this.validationService.validateAchievement(achievementData, profileId);

      // Create achievement entity
      const achievement = new Achievement({
        profileId,
        title: achievementData.title,
        organization: achievementData.organization,
        type: achievementData.type,
        dateReceived: new Date(achievementData.dateReceived),
        scope: achievementData.scope,
        description: achievementData.description
      });

      // Add metrics and context
      if (achievementData.metrics) {
        Object.entries(achievementData.metrics).forEach(([key, value]) => {
          achievement.addMetric(key as any, value);
        });
      }

      if (achievementData.context) {
        Object.entries(achievementData.context).forEach(([key, value]) => {
          achievement.addContext(key as any, value);
        });
      }

      // Save achievement
      const savedAchievement = await this.repository.saveAchievement(achievement);

      // Update profile
      profile.addAchievement(savedAchievement);
      await this.repository.updateProfile(profile);

      // Invalidate cache
      await this.cache.delete(CacheKeyGenerator.profile(profileId));
      await this.cache.delete(CacheKeyGenerator.achievements(profileId));

      // Track analytics
      await this.analyticsQueue.push({
        profileId,
        eventType: 'achievement_added',
        timestamp: new Date(),
        metadata: {
          achievementType: achievement.type,
          scope: achievement.scope,
          impact: achievement.impact
        }
      });

      timer.end({ success: true });

      return this.mapAchievementToResponse(savedAchievement);
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to add achievement', { error, profileId });
      throw error;
    }
  }

  // Profile Analysis

  public async analyzeProfile(
    profileId: string,
    options: {
      includeRecommendations?: boolean;
      includePeerComparison?: boolean;
    } = {}
  ): Promise<ProfileAnalysis> {
    const timer = this.performanceMonitor.startTimer('analyzeProfile', { profileId });

    try {
      // Get complete profile
      const profile = await this.getCompleteProfile(profileId);

      // Calculate portfolio strength
      const portfolioStrength = profile.getProfileStrength();

      // Get enrichment priorities
      const enrichmentPriorities = profile.getEnrichmentPriorities();

      // Build analysis
      const analysis: ProfileAnalysis = {
        overallStrength: portfolioStrength,
        strengths: this.identifyStrengths(profile),
        weaknesses: this.identifyWeaknesses(profile),
        uniqueValue: profile.hiddenStrengths,
        competitiveAdvantage: this.identifyCompetitiveAdvantages(profile),
        risks: this.identifyRisks(profile),
        recommendations: options.includeRecommendations 
          ? this.generateRecommendations(profile, enrichmentPriorities)
          : []
      };

      timer.end({ success: true });

      return analysis;
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.logger.error('Failed to analyze profile', { error, profileId });
      throw error;
    }
  }

  // Private Helper Methods

  private async getCompleteProfile(profileId: string): Promise<UserProfile> {
    const profile = await this.repository.getProfile(profileId);
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }

    // Load all related data
    const [experiences, achievements, academicRecord] = await Promise.all([
      this.repository.getExperiences(profileId),
      this.repository.getAchievements(profileId),
      this.repository.getAcademicRecord(profileId)
    ]);

    profile.experiences = experiences;
    profile.achievements = achievements;
    if (academicRecord) {
      profile.academicRecord = academicRecord;
    }

    return profile;
  }

  private identifyStrengths(profile: UserProfile): any[] {
    const strengths = [];

    // Academic strength
    if (profile.academicRecord) {
      const academicStrength = profile.academicRecord.getAcademicStrength();
      if (academicStrength.overall > 0.7) {
        strengths.push({
          area: 'Academic Excellence',
          score: academicStrength.overall,
          evidence: ['Strong GPA', 'Rigorous coursework'],
          improvements: profile.academicRecord.suggestImprovements()
        });
      }
    }

    // Experience diversity
    if (profile.experiences.length >= 3) {
      const types = new Set(profile.experiences.map(e => e.type));
      if (types.size >= 2) {
        strengths.push({
          area: 'Experience Diversity',
          score: 0.8,
          evidence: ['Multiple experience types', 'Well-rounded background'],
          improvements: []
        });
      }
    }

    // Achievement impact
    const highImpactAchievements = profile.achievements.filter(
      a => a.impact === 'high' || a.impact === 'exceptional'
    );
    if (highImpactAchievements.length > 0) {
      strengths.push({
        area: 'High-Impact Achievements',
        score: 0.9,
        evidence: highImpactAchievements.map(a => a.title),
        improvements: []
      });
    }

    return strengths;
  }

  private identifyWeaknesses(profile: UserProfile): any[] {
    const weaknesses = [];

    // Missing academic record
    if (!profile.academicRecord) {
      weaknesses.push({
        area: 'Academic Information',
        score: 0,
        evidence: ['No academic record provided'],
        improvements: ['Add GPA and coursework information']
      });
    }

    // Limited experiences
    if (profile.experiences.length < 2) {
      weaknesses.push({
        area: 'Limited Experiences',
        score: 0.3,
        evidence: ['Few experiences documented'],
        improvements: ['Add more experiences to showcase skills']
      });
    }

    // No test scores
    if (profile.academicRecord && (!profile.academicRecord.standardizedTests || 
        profile.academicRecord.standardizedTests.length === 0)) {
      weaknesses.push({
        area: 'Standardized Testing',
        score: 0,
        evidence: ['No test scores provided'],
        improvements: ['Add SAT/ACT scores if available']
      });
    }

    return weaknesses;
  }

  private identifyCompetitiveAdvantages(profile: UserProfile): string[] {
    const advantages = [];

    if (profile.demographics?.firstGenerationStudent) {
      advantages.push('First-generation college student status');
    }

    if (profile.hiddenStrengths.length > 0) {
      advantages.push(...profile.hiddenStrengths);
    }

    const underrecognized = profile.achievements.filter(a => a.isUnderrecognized);
    if (underrecognized.length > 0) {
      advantages.push('Unique achievements not typically recognized');
    }

    return advantages;
  }

  private identifyRisks(profile: UserProfile): string[] {
    const risks = [];

    if (profile.completionScore.overall < 0.4) {
      risks.push('Profile is less than 40% complete');
    }

    if (profile.goals.timelineUrgency === 'immediate' && 
        profile.completionScore.overall < 0.7) {
      risks.push('Urgent timeline with incomplete profile');
    }

    if (!profile.narrativeSummary) {
      risks.push('No narrative summary to tie experiences together');
    }

    return risks;
  }

  private generateRecommendations(
    profile: UserProfile,
    priorities: EnrichmentPriority[]
  ): string[] {
    const recommendations = [];

    // Add top 3 enrichment priorities
    priorities.slice(0, 3).forEach(priority => {
      recommendations.push(priority.reason);
    });

    // Add specific suggestions based on goals
    if (profile.goals.primaryGoal === 'college_admission') {
      if (!profile.academicRecord?.standardizedTests?.length) {
        recommendations.push('Register for and take the SAT or ACT');
      }
      if (profile.experiences.length < 3) {
        recommendations.push('Add more extracurricular experiences');
      }
    }

    return recommendations;
  }

  // Response Mapping

  private mapToResponse(profile: UserProfile): ProfileDTO.Response {
    return {
      id: profile.id,
      userId: profile.userId,
      userContext: profile.userContext,
      status: profile.status,
      completionScore: profile.completionScore,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      level: this.calculateProfileLevel(profile),
      nextEnrichmentPriorities: profile.getEnrichmentPriorities()
    };
  }

  private mapToDetailedResponse(profile: UserProfile): ProfileDTO.DetailedResponse {
    return {
      ...this.mapToResponse(profile),
      academicRecord: profile.academicRecord 
        ? this.mapAcademicRecordToResponse(profile.academicRecord)
        : undefined,
      experiences: profile.experiences.map(e => this.mapExperienceToResponse(e)),
      achievements: profile.achievements.map(a => this.mapAchievementToResponse(a)),
      extractedSkills: Array.from(profile.extractedSkills.entries()).map(([skill, confidence]) => ({
        skill,
        confidence,
        sources: [] // Would need to track sources
      })),
      hiddenStrengths: profile.hiddenStrengths,
      narrativeSummary: profile.narrativeSummary
    };
  }

  private mapAcademicRecordToResponse(record: AcademicRecord): AcademicRecordDTO.Response {
    return {
      id: record.id,
      profileId: record.profileId,
      school: record.school,
      currentGrade: record.currentGrade,
      gpa: record.gpa,
      gpaScale: record.gpaScale,
      weightedGPA: record.weightedGPA,
      classRank: record.classRank,
      classSize: record.classSize,
      strongSubjects: record.strongSubjects,
      strugglingSubjects: record.strugglingSubjects,
      academicStrength: record.getAcademicStrength(),
      suggestedImprovements: record.suggestImprovements()
    };
  }

  private mapExperienceToResponse(experience: Experience): ExperienceDTO.Response {
    return {
      id: experience.id,
      profileId: experience.profileId,
      title: experience.title,
      organization: experience.organization,
      type: experience.type,
      startDate: experience.startDate.toISOString(),
      endDate: experience.endDate?.toISOString(),
      timeCommitment: experience.timeCommitment,
      description: experience.description,
      responsibilities: experience.responsibilities,
      achievements: experience.achievements,
      skills: experience.transferableSkills,
      metrics: experience.metrics as any,
      duration: experience.calculateDuration(),
      extractedSkills: experience.skillsDemonstrated.map(s => ({
        skill: s.skill,
        proficiencyLevel: s.proficiencyLevel,
        evidence: s.evidence,
        professionalRelevance: ''
      })),
      hiddenStrengths: [],
      narrativeSummary: experience.narrativeSummary,
      collegeRelevanceScore: experience.collegeRelevanceScore,
      strengthAnalysis: experience.getExperienceStrength()
    };
  }

  private mapAchievementToResponse(achievement: Achievement): AchievementDTO.Response {
    const narratives = achievement.generateNarratives();
    
    return {
      id: achievement.id,
      profileId: achievement.profileId,
      title: achievement.title,
      organization: achievement.organization,
      type: achievement.type,
      dateReceived: achievement.dateReceived.toISOString(),
      scope: achievement.scope,
      description: achievement.description,
      metrics: achievement.metrics,
      context: achievement.context,
      impact: achievement.impact,
      isUnderrecognized: achievement.isUnderrecognized,
      enhancedDescription: achievement.enhancedDescription,
      prestigeScore: achievement.calculatePrestigeScore(),
      narratives
    };
  }

  private calculateProfileLevel(profile: UserProfile): any {
    const score = profile.completionScore.overall;
    
    if (score >= 0.95) {
      return {
        current: 'platinum',
        progress: 100,
        unlockedFeatures: ['all_features'],
        nextMilestone: null
      };
    } else if (score >= 0.8) {
      return {
        current: 'gold',
        progress: ((score - 0.8) / 0.15) * 100,
        unlockedFeatures: ['advanced_analytics', 'ai_coaching'],
        nextMilestone: {
          level: 'platinum',
          requirement: 'Complete all sections',
          reward: 'Priority support'
        }
      };
    } else if (score >= 0.6) {
      return {
        current: 'silver',
        progress: ((score - 0.6) / 0.2) * 100,
        unlockedFeatures: ['skill_analysis', 'narrative_guidance'],
        nextMilestone: {
          level: 'gold',
          requirement: 'Add 3 experiences',
          reward: 'Advanced analytics'
        }
      };
    } else {
      return {
        current: 'bronze',
        progress: (score / 0.6) * 100,
        unlockedFeatures: ['basic_features'],
        nextMilestone: {
          level: 'silver',
          requirement: 'Complete academic record',
          reward: 'Skill analysis'
        }
      };
    }
  }
}

export default EnhancedProfileService;