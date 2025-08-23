// src/infrastructure/database/SupabasePortfolioRepository.ts

import { injectable, inject } from 'inversify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  IPortfolioRepository, 
  Transaction,
  QueryOptions,
  BatchResult,
  ProfileSearchCriteria,
  ExperiencePattern
} from '../../core/repositories/interfaces/IPortfolioRepository';
import { UserProfile, ProfileStatus } from '../../core/domain/entities/UserProfile';
import { AcademicRecord } from '../../core/domain/entities/AcademicRecord';
import { Experience } from '../../core/domain/entities/Experience';
import { Achievement } from '../../core/domain/entities/Achievement';
import { DatabaseError, ProfileNotFoundError } from '../../shared/errors/ProfileErrors';
import { Logger } from '../../shared/utils/logger';
import { ConfigService } from '../config/ConfigService';
import { TYPES } from '../di/types';

// Supabase Transaction Wrapper
class SupabaseTransaction implements Transaction {
  private isCommitted = false;
  private isRolledBack = false;
  private operations: Array<() => Promise<any>> = [];

  constructor(
    private supabase: SupabaseClient,
    private logger: Logger
  ) {}

  public async commit(): Promise<void> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction already completed');
    }

    try {
      // Execute all operations
      for (const operation of this.operations) {
        await operation();
      }
      this.isCommitted = true;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  public async rollback(): Promise<void> {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Transaction already completed');
    }
    
    this.isRolledBack = true;
    this.logger.info('Transaction rolled back');
  }

  public isActive(): boolean {
    return !this.isCommitted && !this.isRolledBack;
  }

  public addOperation(operation: () => Promise<any>): void {
    if (!this.isActive()) {
      throw new Error('Transaction is not active');
    }
    this.operations.push(operation);
  }
}

@injectable()
export class SupabasePortfolioRepository implements IPortfolioRepository {
  private supabase: SupabaseClient;

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ConfigService) private config: ConfigService
  ) {
    this.supabase = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_ANON_KEY'),
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  // Transaction Management
  
  public async beginTransaction(): Promise<Transaction> {
    return new SupabaseTransaction(this.supabase, this.logger);
  }

  // Profile Operations

  public async saveProfile(profile: UserProfile, transaction?: Transaction): Promise<UserProfile> {
    try {
      const profileData = this.serializeProfile(profile);
      
      if (transaction && transaction.isActive()) {
        (transaction as SupabaseTransaction).addOperation(async () => {
          await this.supabase.from('profiles').insert(profileData);
        });
        return profile;
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      this.logger.info('Profile saved', { profileId: profile.id });
      return this.deserializeProfile(data);
    } catch (error) {
      this.logger.error('Failed to save profile', { error, profileId: profile.id });
      throw new DatabaseError('save', 'profile', error as Error);
    }
  }

  public async getProfile(profileId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? this.deserializeProfile(data) : null;
    } catch (error) {
      this.logger.error('Failed to get profile', { error, profileId });
      throw new DatabaseError('get', 'profile', error as Error);
    }
  }

  public async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? this.deserializeProfile(data) : null;
    } catch (error) {
      this.logger.error('Failed to get profile by user ID', { error, userId });
      throw new DatabaseError('get', 'profile', error as Error);
    }
  }

  public async updateProfile(profile: UserProfile, transaction?: Transaction): Promise<UserProfile> {
    try {
      const profileData = this.serializeProfile(profile);
      
      if (transaction && transaction.isActive()) {
        (transaction as SupabaseTransaction).addOperation(async () => {
          await this.supabase
            .from('profiles')
            .update(profileData)
            .eq('id', profile.id);
        });
        return profile;
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      this.logger.info('Profile updated', { profileId: profile.id });
      return this.deserializeProfile(data);
    } catch (error) {
      this.logger.error('Failed to update profile', { error, profileId: profile.id });
      throw new DatabaseError('update', 'profile', error as Error);
    }
  }

  public async archiveProfile(profileId: string, transaction?: Transaction): Promise<void> {
    try {
      const operation = async () => {
        const { error } = await this.supabase
          .from('profiles')
          .update({ 
            status: ProfileStatus.ARCHIVED, 
            archived_at: new Date().toISOString() 
          })
          .eq('id', profileId);
        
        if (error) throw error;
      };

      if (transaction && transaction.isActive()) {
        (transaction as SupabaseTransaction).addOperation(operation);
      } else {
        await operation();
      }

      this.logger.info('Profile archived', { profileId });
    } catch (error) {
      this.logger.error('Failed to archive profile', { error, profileId });
      throw new DatabaseError('archive', 'profile', error as Error);
    }
  }

  public async deleteProfile(profileId: string, transaction?: Transaction): Promise<void> {
    try {
      const operation = async () => {
        const { error } = await this.supabase
          .from('profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', profileId);
        
        if (error) throw error;
      };

      if (transaction && transaction.isActive()) {
        (transaction as SupabaseTransaction).addOperation(operation);
      } else {
        await operation();
      }

      this.logger.info('Profile deleted', { profileId });
    } catch (error) {
      this.logger.error('Failed to delete profile', { error, profileId });
      throw new DatabaseError('delete', 'profile', error as Error);
    }
  }

  // Batch Operations

  public async batchSaveProfiles(
    profiles: UserProfile[], 
    transaction?: Transaction
  ): Promise<BatchResult<UserProfile>> {
    const results: BatchResult<UserProfile> = {
      successful: [],
      failed: []
    };

    const batchSize = 100;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      const serializedBatch = batch.map(p => this.serializeProfile(p));

      try {
        const { data, error } = await this.supabase
          .from('profiles')
          .insert(serializedBatch)
          .select();

        if (error) throw error;

        const savedProfiles = data.map(d => this.deserializeProfile(d));
        results.successful.push(...savedProfiles);
      } catch (error) {
        batch.forEach(profile => {
          results.failed.push({ item: profile, error: error as Error });
        });
      }
    }

    return results;
  }

  public async getProfiles(profileIds: string[]): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);

      if (error) throw error;

      return data.map(d => this.deserializeProfile(d));
    } catch (error) {
      this.logger.error('Failed to get profiles', { error, count: profileIds.length });
      throw new DatabaseError('get', 'profiles', error as Error);
    }
  }

  public async searchProfiles(
    criteria: ProfileSearchCriteria,
    options?: QueryOptions
  ): Promise<{ profiles: UserProfile[]; total: number }> {
    try {
      let query = this.supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.userContext) {
        query = query.eq('user_context', criteria.userContext);
      }
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      if (criteria.minCompletionScore) {
        query = query.gte('completion_score', criteria.minCompletionScore);
      }
      if (criteria.createdAfter) {
        query = query.gte('created_at', criteria.createdAfter.toISOString());
      }
      if (criteria.lastUpdatedAfter) {
        query = query.gte('updated_at', criteria.lastUpdatedAfter.toISOString());
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Apply sorting
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === 'ASC' });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        profiles: data.map(d => this.deserializeProfile(d)),
        total: count || 0
      };
    } catch (error) {
      this.logger.error('Failed to search profiles', { error, criteria });
      throw new DatabaseError('search', 'profiles', error as Error);
    }
  }

  // Achievement Operations

  public async saveAchievement(
    achievement: Achievement,
    transaction?: Transaction
  ): Promise<Achievement> {
    try {
      const achievementData = this.serializeAchievement(achievement);
      
      const { data, error } = await this.supabase
        .from('achievements')
        .insert(achievementData)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeAchievement(data);
    } catch (error) {
      this.logger.error('Failed to save achievement', { error });
      throw new DatabaseError('save', 'achievement', error as Error);
    }
  }

  public async getAchievement(achievementId: string): Promise<Achievement | null> {
    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? this.deserializeAchievement(data) : null;
    } catch (error) {
      this.logger.error('Failed to get achievement', { error, achievementId });
      throw new DatabaseError('get', 'achievement', error as Error);
    }
  }

  public async getAchievements(profileId: string, options?: QueryOptions): Promise<Achievement[]> {
    try {
      let query = this.supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', profileId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === 'ASC' });
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(d => this.deserializeAchievement(d));
    } catch (error) {
      this.logger.error('Failed to get achievements', { error, profileId });
      throw new DatabaseError('get', 'achievements', error as Error);
    }
  }

  public async updateAchievement(
    achievement: Achievement,
    transaction?: Transaction
  ): Promise<Achievement> {
    try {
      const achievementData = this.serializeAchievement(achievement);
      
      const { data, error } = await this.supabase
        .from('achievements')
        .update(achievementData)
        .eq('id', achievement.id)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeAchievement(data);
    } catch (error) {
      this.logger.error('Failed to update achievement', { error });
      throw new DatabaseError('update', 'achievement', error as Error);
    }
  }

  public async deleteAchievement(achievementId: string, transaction?: Transaction): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId);

      if (error) throw error;
    } catch (error) {
      this.logger.error('Failed to delete achievement', { error, achievementId });
      throw new DatabaseError('delete', 'achievement', error as Error);
    }
  }

  public async batchSaveAchievements(
    achievements: Achievement[],
    transaction?: Transaction
  ): Promise<BatchResult<Achievement>> {
    const results: BatchResult<Achievement> = {
      successful: [],
      failed: []
    };

    const serialized = achievements.map(a => this.serializeAchievement(a));

    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .insert(serialized)
        .select();

      if (error) throw error;

      results.successful = data.map(d => this.deserializeAchievement(d));
    } catch (error) {
      achievements.forEach(ach => {
        results.failed.push({ item: ach, error: error as Error });
      });
    }

    return results;
  }

  // Serialization Methods

  private serializeAchievement(achievement: Achievement): any {
    return {
      id: achievement.id,
      profile_id: achievement.profileId,
      title: achievement.title,
      organization: achievement.organization,
      type: achievement.type,
      date_received: achievement.dateReceived.toISOString(),
      scope: achievement.scope,
      impact: achievement.impact,
      description: achievement.description,
      criteria: achievement.criteria,
      metrics: achievement.metrics,
      verification_url: achievement.verificationUrl,
      document_url: achievement.documentUrl,
      context: achievement.context,
      skills_demonstrated: achievement.skillsDemonstrated,
      character_traits: achievement.characterTraits,
      enhanced_description: achievement.enhancedDescription,
      relevance_scores: Object.fromEntries(achievement.relevanceScores),
      suggested_narratives: achievement.suggestedNarratives,
      is_underrecognized: achievement.isUnderrecognized,
      requires_context: achievement.requiresContext,
      created_at: achievement.createdAt.toISOString(),
      updated_at: achievement.updatedAt.toISOString()
    };
  }

  private deserializeAchievement(data: any): Achievement {
    const achievement = new Achievement({
      profileId: data.profile_id,
      title: data.title,
      organization: data.organization,
      type: data.type,
      dateReceived: new Date(data.date_received),
      scope: data.scope,
      description: data.description
    });

    // Set additional properties
    Object.assign(achievement, {
      id: data.id,
      impact: data.impact,
      criteria: data.criteria,
      metrics: data.metrics || {},
      verificationUrl: data.verification_url,
      documentUrl: data.document_url,
      context: data.context || {
        backstory: '',
        effort: '',
        significance: '',
        growth: ''
      },
      skillsDemonstrated: data.skills_demonstrated || [],
      characterTraits: data.character_traits || [],
      enhancedDescription: data.enhanced_description,
      relevanceScores: new Map(Object.entries(data.relevance_scores || {})),
      suggestedNarratives: data.suggested_narratives || [],
      isUnderrecognized: data.is_underrecognized || false,
      requiresContext: data.requires_context || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });

    return achievement;
  }

  // Complete remaining interface methods...

  public async saveAcademicRecord(
    record: AcademicRecord,
    transaction?: Transaction
  ): Promise<AcademicRecord> {
    try {
      const recordData = this.serializeAcademicRecord(record);
      
      const { data, error } = await this.supabase
        .from('academic_records')
        .insert(recordData)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeAcademicRecord(data);
    } catch (error) {
      this.logger.error('Failed to save academic record', { error });
      throw new DatabaseError('save', 'academic_record', error as Error);
    }
  }

  public async getAcademicRecord(profileId: string): Promise<AcademicRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('academic_records')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? this.deserializeAcademicRecord(data) : null;
    } catch (error) {
      this.logger.error('Failed to get academic record', { error, profileId });
      throw new DatabaseError('get', 'academic_record', error as Error);
    }
  }

  public async updateAcademicRecord(
    record: AcademicRecord,
    transaction?: Transaction
  ): Promise<AcademicRecord> {
    try {
      const recordData = this.serializeAcademicRecord(record);
      
      const { data, error } = await this.supabase
        .from('academic_records')
        .update(recordData)
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeAcademicRecord(data);
    } catch (error) {
      this.logger.error('Failed to update academic record', { error });
      throw new DatabaseError('update', 'academic_record', error as Error);
    }
  }

  public async saveExperience(
    experience: Experience,
    transaction?: Transaction
  ): Promise<Experience> {
    try {
      const experienceData = this.serializeExperience(experience);
      
      const { data, error } = await this.supabase
        .from('experiences')
        .insert(experienceData)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeExperience(data);
    } catch (error) {
      this.logger.error('Failed to save experience', { error });
      throw new DatabaseError('save', 'experience', error as Error);
    }
  }

  public async getExperience(experienceId: string): Promise<Experience | null> {
    try {
      const { data, error } = await this.supabase
        .from('experiences')
        .select('*')
        .eq('id', experienceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ? this.deserializeExperience(data) : null;
    } catch (error) {
      this.logger.error('Failed to get experience', { error, experienceId });
      throw new DatabaseError('get', 'experience', error as Error);
    }
  }

  public async getExperiences(profileId: string, options?: QueryOptions): Promise<Experience[]> {
    try {
      let query = this.supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', profileId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === 'ASC' });
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(d => this.deserializeExperience(d));
    } catch (error) {
      this.logger.error('Failed to get experiences', { error, profileId });
      throw new DatabaseError('get', 'experiences', error as Error);
    }
  }

  public async updateExperience(
    experience: Experience,
    transaction?: Transaction
  ): Promise<Experience> {
    try {
      const experienceData = this.serializeExperience(experience);
      
      const { data, error } = await this.supabase
        .from('experiences')
        .update(experienceData)
        .eq('id', experience.id)
        .select()
        .single();

      if (error) throw error;

      return this.deserializeExperience(data);
    } catch (error) {
      this.logger.error('Failed to update experience', { error });
      throw new DatabaseError('update', 'experience', error as Error);
    }
  }

  public async deleteExperience(experienceId: string, transaction?: Transaction): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId);

      if (error) throw error;
    } catch (error) {
      this.logger.error('Failed to delete experience', { error, experienceId });
      throw new DatabaseError('delete', 'experience', error as Error);
    }
  }

  public async batchSaveExperiences(
    experiences: Experience[],
    transaction?: Transaction
  ): Promise<BatchResult<Experience>> {
    const results: BatchResult<Experience> = {
      successful: [],
      failed: []
    };

    const serialized = experiences.map(e => this.serializeExperience(e));

    try {
      const { data, error } = await this.supabase
        .from('experiences')
        .insert(serialized)
        .select();

      if (error) throw error;

      results.successful = data.map(d => this.deserializeExperience(d));
    } catch (error) {
      experiences.forEach(exp => {
        results.failed.push({ item: exp, error: error as Error });
      });
    }

    return results;
  }

  public async findDuplicateExperience(
    profileId: string,
    title: string,
    organization: string
  ): Promise<Experience | null> {
    try {
      const { data, error } = await this.supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', profileId)
        .eq('title', title)
        .eq('organization', organization)
        .maybeSingle();

      if (error) throw error;

      return data ? this.deserializeExperience(data) : null;
    } catch (error) {
      this.logger.error('Failed to find duplicate experience', { error });
      throw new DatabaseError('find', 'experience', error as Error);
    }
  }

  public async findDuplicateAchievement(
    profileId: string,
    title: string,
    organization: string
  ): Promise<Achievement | null> {
    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', profileId)
        .eq('title', title)
        .eq('organization', organization)
        .maybeSingle();

      if (error) throw error;

      return data ? this.deserializeAchievement(data) : null;
    } catch (error) {
      this.logger.error('Failed to find duplicate achievement', { error });
      throw new DatabaseError('find', 'achievement', error as Error);
    }
  }

  public async getProfileCompletionStats(profileIds: string[]): Promise<Map<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, completion_score')
        .in('id', profileIds);

      if (error) throw error;

      const stats = new Map<string, number>();
      data.forEach(d => stats.set(d.id, d.completion_score));
      return stats;
    } catch (error) {
      this.logger.error('Failed to get completion stats', { error });
      throw new DatabaseError('get', 'stats', error as Error);
    }
  }

  public async getSkillDistribution(profileIds: string[]): Promise<Map<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from('profile_skills')
        .select('skill, count')
        .in('profile_id', profileIds);

      if (error) throw error;

      const distribution = new Map<string, number>();
      data.forEach(d => {
        const current = distribution.get(d.skill) || 0;
        distribution.set(d.skill, current + d.count);
      });
      return distribution;
    } catch (error) {
      this.logger.error('Failed to get skill distribution', { error });
      throw new DatabaseError('get', 'skills', error as Error);
    }
  }

  public async getCommonExperiencePatterns(userContext: string): Promise<ExperiencePattern[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_experience_patterns', { context: userContext });

      if (error) throw error;

      return data || [];
    } catch (error) {
      this.logger.error('Failed to get experience patterns', { error });
      return [];
    }
  }

  public async cleanupOrphanedRecords(transaction?: Transaction): Promise<number> {
    let count = 0;
    
    try {
      // Clean up experiences without profiles
      const { data: orphanedExperiences } = await this.supabase
        .from('experiences')
        .select('id')
        .is('profile_id', null);

      if (orphanedExperiences && orphanedExperiences.length > 0) {
        const { error } = await this.supabase
          .from('experiences')
          .delete()
          .in('id', orphanedExperiences.map(e => e.id));
        
        if (!error) count += orphanedExperiences.length;
      }

      // Clean up achievements without profiles
      const { data: orphanedAchievements } = await this.supabase
        .from('achievements')
        .select('id')
        .is('profile_id', null);

      if (orphanedAchievements && orphanedAchievements.length > 0) {
        const { error } = await this.supabase
          .from('achievements')
          .delete()
          .in('id', orphanedAchievements.map(a => a.id));
        
        if (!error) count += orphanedAchievements.length;
      }

      this.logger.info('Cleaned up orphaned records', { count });
    } catch (error) {
      this.logger.error('Failed to cleanup orphaned records', { error });
    }
    
    return count;
  }

  public async optimizeIndices(): Promise<void> {
    // Supabase handles index optimization automatically
    this.logger.info('Index optimization requested - handled by Supabase');
  }

  // Serialization helpers

  private serializeProfile(profile: UserProfile): any {
    return {
      id: profile.id,
      user_id: profile.userId,
      user_context: profile.userContext,
      status: profile.status,
      goals: profile.goals,
      constraints: profile.constraints,
      demographics: profile.demographics,
      completion_score: profile.completionScore.overall,
      completion_details: profile.completionScore,
      extracted_skills: Object.fromEntries(profile.extractedSkills),
      hidden_strengths: profile.hiddenStrengths,
      narrative_summary: profile.narrativeSummary,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString()
    };
  }

  private deserializeProfile(data: any): UserProfile {
    const profile = new UserProfile({
      userId: data.user_id,
      userContext: data.user_context,
      goals: data.goals,
      constraints: data.constraints,
      demographics: data.demographics
    });

    // Set additional properties
    Object.assign(profile, {
      id: data.id,
      status: data.status,
      completionScore: data.completion_details,
      extractedSkills: new Map(Object.entries(data.extracted_skills || {})),
      hiddenStrengths: data.hidden_strengths || [],
      narrativeSummary: data.narrative_summary,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });

    return profile;
  }

  private serializeAcademicRecord(record: AcademicRecord): any {
    return {
      id: record.id,
      profile_id: record.profileId,
      school: record.school,
      current_grade: record.currentGrade,
      gpa: record.gpa,
      gpa_scale: record.gpaScale,
      weighted_gpa: record.weightedGPA,
      class_rank: record.classRank,
      class_size: record.classSize,
      coursework: record.coursework,
      planned_courses: record.plannedCourses,
      standardized_tests: record.standardizedTests,
      strong_subjects: record.strongSubjects,
      struggling_subjects: record.strugglingSubjects,
      academic_interests: record.academicInterests,
      academic_honors: record.academicHonors,
      summer_programs: record.summerPrograms,
      created_at: record.createdAt.toISOString(),
      updated_at: record.updatedAt.toISOString()
    };
  }

  private deserializeAcademicRecord(data: any): AcademicRecord {
    const record = new AcademicRecord({
      profileId: data.profile_id,
      school: data.school,
      currentGrade: data.current_grade,
      gpaScale: data.gpa_scale,
      gpa: data.gpa,
      weightedGPA: data.weighted_gpa
    });

    Object.assign(record, {
      id: data.id,
      classRank: data.class_rank,
      classSize: data.class_size,
      coursework: data.coursework || [],
      plannedCourses: data.planned_courses || [],
      standardizedTests: data.standardized_tests || [],
      strongSubjects: data.strong_subjects || [],
      strugglingSubjects: data.struggling_subjects || [],
      academicInterests: data.academic_interests || [],
      academicHonors: data.academic_honors || [],
      summerPrograms: data.summer_programs || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });

    return record;
  }

  private serializeExperience(experience: Experience): any {
    return {
      id: experience.id,
      profile_id: experience.profileId,
      title: experience.title,
      organization: experience.organization,
      type: experience.type,
      start_date: experience.startDate.toISOString(),
      end_date: experience.endDate?.toISOString(),
      is_ongoing: experience.isOngoing,
      time_commitment: experience.timeCommitment,
      total_hours: experience.totalHours,
      description: experience.description,
      responsibilities: experience.responsibilities,
      achievements: experience.achievements,
      challenges: experience.challenges,
      metrics: experience.metrics,
      skills_demonstrated: experience.skillsDemonstrated,
      lessons_learned: experience.lessonsLearned,
      tools_used: experience.toolsUsed,
      transferable_skills: experience.transferableSkills,
      leadership_examples: experience.leadershipExamples,
      problem_solving_examples: experience.problemSolvingExamples,
      verification_url: experience.verificationUrl,
      supervisor_name: experience.supervisorName,
      can_contact: experience.canContact,
      ai_extracted_themes: experience.aiExtractedThemes,
      narrative_summary: experience.narrativeSummary,
      college_relevance_score: experience.collegeRelevanceScore,
      created_at: experience.createdAt.toISOString(),
      updated_at: experience.updatedAt.toISOString()
    };
  }

  private deserializeExperience(data: any): Experience {
    const experience = new Experience({
      profileId: data.profile_id,
      title: data.title,
      organization: data.organization,
      type: data.type,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      timeCommitment: data.time_commitment,
      description: data.description
    });

    Object.assign(experience, {
      id: data.id,
      isOngoing: data.is_ongoing,
      totalHours: data.total_hours,
      responsibilities: data.responsibilities || [],
      achievements: data.achievements || [],
      challenges: data.challenges || [],
      metrics: data.metrics || {},
      skillsDemonstrated: data.skills_demonstrated || [],
      lessonsLearned: data.lessons_learned || [],
      toolsUsed: data.tools_used || [],
      transferableSkills: data.transferable_skills || [],
      leadershipExamples: data.leadership_examples || [],
      problemSolvingExamples: data.problem_solving_examples || [],
      verificationUrl: data.verification_url,
      supervisorName: data.supervisor_name,
      canContact: data.can_contact,
      aiExtractedThemes: data.ai_extracted_themes || [],
      narrativeSummary: data.narrative_summary,
      collegeRelevanceScore: data.college_relevance_score,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });

    return experience;
  }
}

export default SupabasePortfolioRepository;