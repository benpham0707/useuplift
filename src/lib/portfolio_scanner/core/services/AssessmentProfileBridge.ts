// src/core/services/AssessmentProfileBridge.ts

import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/types';
import { 
  ProgressiveAssessmentEngine, 
  AssessmentSession,
  AssessmentCategory 
} from '../assessment/ProgressiveAssessmentEngine';
import { EnhancedProfileService } from './EnhancedProfileService';
import { AIIntegrationService } from '../../infrastructure/ai/AIIntegrationService';
import { UserProfile, UserContext, ProfileGoals, ProfileConstraints } from '../domain/entities/UserProfile';
import { AcademicRecord, GPAScale } from '../domain/entities/AcademicRecord';
import { Experience, ExperienceType, TimeCommitment } from '../domain/entities/Experience';
import { Logger } from '../../shared/utils/logger';

export interface ProfileBuildingStrategy {
  minimumDataThreshold: number; // Percentage of assessment needed
  enrichmentTriggers: Map<string, () => void>;
  valueUnlocks: Map<number, string>; // Progress percentage -> feature unlock
}

@injectable()
export class AssessmentProfileBridge {
  private buildingStrategies: Map<string, ProfileBuildingStrategy> = new Map();

  constructor(
    @inject(TYPES.ProgressiveAssessmentEngine) private assessmentEngine: ProgressiveAssessmentEngine,
    @inject(TYPES.EnhancedProfileService) private profileService: EnhancedProfileService,
    @inject(TYPES.AIIntegrationService) private aiService: AIIntegrationService,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Quick Start Strategy - Provide value immediately
    this.buildingStrategies.set('quick_start', {
      minimumDataThreshold: 100, // All 5 questions
      enrichmentTriggers: new Map([
        ['primary_goal', () => this.triggerGoalBasedEnrichment()],
        ['biggest_challenge', () => this.triggerChallengeBasedSupport()]
      ]),
      valueUnlocks: new Map([
        [100, 'basic_recommendations'],
        [100, 'goal_roadmap']
      ])
    });

    // Standard Strategy - Progressive value delivery
    this.buildingStrategies.set('standard', {
      minimumDataThreshold: 25,
      enrichmentTriggers: new Map([
        ['gpa_range', () => this.triggerAcademicEnrichment()],
        ['activities_quick', () => this.triggerExperienceEnrichment()],
        ['financial_aid_need', () => this.triggerFinancialEnrichment()]
      ]),
      valueUnlocks: new Map([
        [25, 'basic_recommendations'],
        [40, 'college_matching'],
        [60, 'skill_analysis'],
        [80, 'full_narrative_support'],
        [100, 'advanced_analytics']
      ])
    });
  }

  // Main conversion method - Transform assessment responses into profile data

  public async convertAssessmentToProfile(
    sessionId: string,
    profileId?: string
  ): Promise<{
    profile: UserProfile;
    completeness: number;
    unlockedFeatures: string[];
    nextSteps: string[];
  }> {
    const insights = this.assessmentEngine.getSessionInsights(sessionId);
    const responses = insights.responses;

    // Create or update profile
    let profile: UserProfile;
    
    if (profileId) {
      // Update existing profile
      profile = await this.updateProfileFromAssessment(profileId, responses);
    } else {
      // Create new profile
      profile = await this.createProfileFromAssessment(responses);
    }

    // Calculate completeness
    const completeness = this.calculateProfileCompleteness(profile, insights.completedCategories);

    // Determine unlocked features
    const unlockedFeatures = this.determineUnlockedFeatures(completeness, profile);

    // Generate next steps
    const nextSteps = await this.generatePersonalizedNextSteps(profile, insights);

    this.logger.info('Assessment converted to profile', {
      profileId: profile.id,
      completeness,
      unlockedFeatures: unlockedFeatures.length
    });

    return {
      profile,
      completeness,
      unlockedFeatures,
      nextSteps
    };
  }

  private async createProfileFromAssessment(responses: Map<string, any>): Promise<UserProfile> {
    // Extract core profile data
    const userContext = this.mapGradeToUserContext(responses.get('grade_level'));
    const goals = this.buildGoalsFromResponses(responses);
    const constraints = this.buildConstraintsFromResponses(responses);
    const demographics = this.buildDemographicsFromResponses(responses);

    // Create profile via service
    const createRequest = {
      userId: `user_${Date.now()}`, // This would come from auth
      userContext,
      goals,
      constraints,
      demographics
    };

    const profileResponse = await this.profileService.createProfile(createRequest);
    
    // Get the full profile
    const profile = await this.profileService.getProfile(profileResponse.id);

    // Add academic data if present
    if (responses.has('gpa_range')) {
      await this.addAcademicRecord(profile, responses);
    }

    // Add experiences if present
    if (responses.has('activities_quick')) {
      await this.addQuickExperiences(profile, responses);
    }

    return profile;
  }

  private async updateProfileFromAssessment(
    profileId: string,
    responses: Map<string, any>
  ): Promise<UserProfile> {
    const profile = await this.profileService.getProfile(profileId);

    // Update with new responses
    const updates: any = {};

    if (responses.has('grade_level')) {
      updates.userContext = this.mapGradeToUserContext(responses.get('grade_level'));
    }

    if (responses.has('primary_goal') || responses.has('career_interests')) {
      updates.goals = this.buildGoalsFromResponses(responses);
    }

    if (responses.has('financial_aid_need') || responses.has('responsibilities')) {
      updates.constraints = this.buildConstraintsFromResponses(responses);
    }

    if (Object.keys(updates).length > 0) {
      await this.profileService.updateProfile({
        profileId,
        updates
      });
    }

    return profile;
  }

  // Mapping Methods

  private mapGradeToUserContext(grade: string): UserContext {
    const mapping: Record<string, UserContext> = {
      'high_school_9th': UserContext.HIGH_SCHOOL_9TH,
      'high_school_10th': UserContext.HIGH_SCHOOL_10TH,
      'high_school_11th': UserContext.HIGH_SCHOOL_11TH,
      'high_school_12th': UserContext.HIGH_SCHOOL_12TH,
      'gap_year': UserContext.GAP_YEAR,
      'college_freshman': UserContext.COLLEGE_FRESHMAN,
      'college_sophomore': UserContext.COLLEGE_SOPHOMORE,
      'college_junior': UserContext.COLLEGE_JUNIOR,
      'college_senior': UserContext.COLLEGE_SENIOR
    };

    return mapping[grade] || UserContext.HIGH_SCHOOL_11TH;
  }

  private buildGoalsFromResponses(responses: Map<string, any>): ProfileGoals {
    return {
      primaryGoal: responses.get('primary_goal') || 'exploring_options',
      targetColleges: this.parseCollegeList(responses.get('dream_colleges')),
      targetCareers: this.mapCareerInterests(responses.get('career_interests')),
      timelineUrgency: responses.get('timeline_urgency') || 'flexible',
      desiredOutcomes: this.generateDesiredOutcomes(responses)
    };
  }

  private buildConstraintsFromResponses(responses: Map<string, any>): ProfileConstraints {
    return {
      needsFinancialAid: responses.get('financial_aid_need') !== 'no',
      geographicLimitations: this.inferGeographicLimitations(responses),
      familyObligations: this.hasSignificantResponsibilities(responses),
      workingWhileStudying: responses.get('work_experience') === 'job',
      disabilityAccommodations: false // Would need explicit question
    };
  }

  private buildDemographicsFromResponses(responses: Map<string, any>): any {
    return {
      firstGenerationStudent: responses.get('first_gen') === 'yes',
      englishSecondLanguage: responses.get('responsibilities')?.includes('translation'),
      socioeconomicBackground: this.inferSocioeconomicStatus(responses)
    };
  }

  // Enrichment Methods

  private async addAcademicRecord(profile: UserProfile, responses: Map<string, any>): Promise<void> {
    const gpaRange = responses.get('gpa_range');
    const gpa = this.estimateGPAFromRange(gpaRange);

    const academicRecord = new AcademicRecord({
      profileId: profile.id,
      school: {
        name: responses.get('school_name') || 'Unknown School',
        type: 'public', // Would need to infer or ask
        city: this.extractCity(responses.get('location')),
        state: this.extractState(responses.get('location')),
        country: 'USA',
        graduationYear: parseInt(responses.get('graduation_year')) || new Date().getFullYear() + 2
      },
      currentGrade: this.mapGradeLevel(responses.get('grade_level')),
      gpa: gpa.value,
      gpaScale: gpa.scale,
      weightedGPA: undefined // Would need more info
    });

    profile.addAcademicRecord(academicRecord);
  }

  private async addQuickExperiences(profile: UserProfile, responses: Map<string, any>): Promise<void> {
    const activities = responses.get('activities_quick') || [];

    for (const activity of activities) {
      if (activity === 'none') continue;

      const experience = new Experience({
        profileId: profile.id,
        title: this.getActivityTitle(activity),
        organization: 'Various', // Would need more detail
        type: this.mapActivityToExperienceType(activity),
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago estimate
        timeCommitment: TimeCommitment.PART_TIME,
        description: `Actively involved in ${this.getActivityDescription(activity)}`
      });

      await this.profileService.addExperience(profile.id, experience);
    }
  }

  // Feature Unlocking

  private determineUnlockedFeatures(completeness: number, profile: UserProfile): string[] {
    const features: string[] = [];

    if (completeness >= 20) {
      features.push('basic_recommendations');
      features.push('goal_roadmap');
    }

    if (completeness >= 40 && profile.academicRecord) {
      features.push('college_matching');
      features.push('gpa_analysis');
    }

    if (completeness >= 50 && profile.experiences.length > 0) {
      features.push('skill_extraction');
      features.push('experience_enhancement');
    }

    if (completeness >= 60) {
      features.push('narrative_guidance');
      features.push('application_tracker');
    }

    if (completeness >= 80) {
      features.push('advanced_analytics');
      features.push('peer_comparison');
      features.push('ai_coaching');
    }

    return features;
  }

  private calculateProfileCompleteness(
    profile: UserProfile,
    completedCategories: AssessmentCategory[]
  ): number {
    let score = 0;
    const weights = {
      identity: 15,
      goals: 15,
      academic: 20,
      experiences: 20,
      achievements: 10,
      interests: 10,
      challenges: 5,
      reflection: 5
    };

    // Calculate based on completed categories
    completedCategories.forEach(category => {
      score += weights[category] || 0;
    });

    // Bonus for depth in certain areas
    if (profile.academicRecord?.gpa) score += 5;
    if (profile.experiences.length >= 3) score += 5;
    if (profile.achievements.length >= 2) score += 5;

    return Math.min(score, 100);
  }

  // Next Steps Generation

  private async generatePersonalizedNextSteps(
    profile: UserProfile,
    insights: any
  ): Promise<string[]> {
    const steps: string[] = [];

    // Immediate next data collection
    if (insights.dataGaps.length > 0) {
      steps.push(`Add your ${insights.dataGaps[0]} to unlock more personalized guidance`);
    }

    // Goal-specific next steps
    if (profile.goals.primaryGoal === 'college_admission') {
      if (!profile.academicRecord?.standardizedTests || profile.academicRecord.standardizedTests.length === 0) {
        steps.push('Schedule your SAT/ACT test dates');
      }
      if (!profile.goals.targetColleges || profile.goals.targetColleges.length === 0) {
        steps.push('Build your college list with our matching tool');
      }
      steps.push('Start working on your personal statement');
    }

    if (profile.goals.primaryGoal === 'career_prep') {
      steps.push('Complete the career interest assessment');
      steps.push('Find internship opportunities in your field');
      steps.push('Build your professional network');
    }

    // Experience-based suggestions
    if (profile.experiences.length === 0) {
      steps.push('Add your first experience to start building your story');
    } else if (profile.experiences.length < 3) {
      steps.push('Add more experiences to showcase your diverse skills');
    }

    // Time-sensitive suggestions
    if (profile.goals.timelineUrgency === 'immediate') {
      steps.unshift('🚨 Urgent: Complete your profile for immediate recommendations');
    }

    return steps.slice(0, 5); // Limit to 5 next steps
  }

  // Helper Methods

  private parseCollegeList(input?: string): string[] {
    if (!input) return [];
    return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  private mapCareerInterests(interests?: string[]): string[] {
    if (!interests) return [];
    
    const mapping: Record<string, string> = {
      'tech': 'Technology & Engineering',
      'health': 'Healthcare & Medicine',
      'business': 'Business & Finance',
      'creative': 'Arts & Design',
      'science': 'Science & Research',
      'education': 'Education & Teaching',
      'law': 'Law & Government',
      'social': 'Social Services',
      'trades': 'Skilled Trades'
    };

    return interests
      .filter(i => i !== 'unsure')
      .map(i => mapping[i] || i);
  }

  private generateDesiredOutcomes(responses: Map<string, any>): string[] {
    const outcomes: string[] = [];

    const primaryGoal = responses.get('primary_goal');
    const challenge = responses.get('biggest_challenge');

    if (primaryGoal === 'college_admission') {
      outcomes.push('Get into dream school');
      outcomes.push('Maximize scholarship opportunities');
    }

    if (challenge === 'grades') {
      outcomes.push('Improve academic performance');
    }

    if (challenge === 'finding_direction') {
      outcomes.push('Discover passion and purpose');
    }

    if (challenge === 'financial') {
      outcomes.push('Secure financial aid');
    }

    return outcomes;
  }

  private inferGeographicLimitations(responses: Map<string, any>): string | undefined {
    const responsibilities = responses.get('responsibilities');
    
    if (responsibilities?.includes('parent') || responsibilities?.includes('siblings')) {
      return 'local_only';
    }
    
    if (responses.get('financial_aid_need') === 'full') {
      return 'in_state'; // Likely need in-state tuition
    }

    return 'anywhere';
  }

  private hasSignificantResponsibilities(responses: Map<string, any>): boolean {
    const responsibilities = responses.get('responsibilities');
    if (!responsibilities || responsibilities.includes('none')) return false;
    
    return responsibilities.length >= 2 || 
           responsibilities.includes('parent') ||
           responsibilities.includes('work');
  }

  private inferSocioeconomicStatus(responses: Map<string, any>): string {
    const financialAid = responses.get('financial_aid_need');
    const workExperience = responses.get('work_experience');
    const responsibilities = responses.get('responsibilities');

    if (financialAid === 'full' || responsibilities?.includes('work')) {
      return 'low_income';
    }
    if (financialAid === 'partial') {
      return 'middle_income';
    }
    if (financialAid === 'no') {
      return 'high_income';
    }

    return 'prefer_not_say';
  }

  private estimateGPAFromRange(range?: string): { value: number; scale: GPAScale } {
    const gpaMap: Record<string, { value: number; scale: GPAScale }> = {
      '3.8+': { value: 3.9, scale: GPAScale.FOUR_POINT },
      '3.3-3.7': { value: 3.5, scale: GPAScale.FOUR_POINT },
      '2.8-3.2': { value: 3.0, scale: GPAScale.FOUR_POINT },
      '2.3-2.7': { value: 2.5, scale: GPAScale.FOUR_POINT },
      '<2.3': { value: 2.0, scale: GPAScale.FOUR_POINT }
    };

    return gpaMap[range || ''] || { value: 3.0, scale: GPAScale.FOUR_POINT };
  }

  private extractCity(location?: string): string {
    if (!location) return 'Unknown';
    const parts = location.split(',');
    return parts[0]?.trim() || 'Unknown';
  }

  private extractState(location?: string): string {
    if (!location) return 'Unknown';
    const parts = location.split(',');
    return parts[1]?.trim() || 'Unknown';
  }

  private mapGradeLevel(grade?: string): string {
    const mapping: Record<string, string> = {
      'high_school_9th': '9th',
      'high_school_10th': '10th',
      'high_school_11th': '11th',
      'high_school_12th': '12th'
    };

    return mapping[grade || ''] || '11th';
  }

  private getActivityTitle(activity: string): string {
    const titles: Record<string, string> = {
      'sports': 'Student Athlete',
      'clubs': 'Club Member',
      'volunteer': 'Community Volunteer',
      'arts': 'Creative Arts Participant',
      'work': 'Part-time Employee',
      'family': 'Family Support',
      'hobbies': 'Personal Projects'
    };

    return titles[activity] || 'General Activity';
  }

  private getActivityDescription(activity: string): string {
    const descriptions: Record<string, string> = {
      'sports': 'athletic training and team competition',
      'clubs': 'school clubs and organizations',
      'volunteer': 'community service and volunteer work',
      'arts': 'creative arts, music, or theater',
      'work': 'part-time employment',
      'family': 'family responsibilities and support',
      'hobbies': 'personal projects and self-directed learning'
    };

    return descriptions[activity] || 'various activities';
  }

  private mapActivityToExperienceType(activity: string): ExperienceType {
    const mapping: Record<string, ExperienceType> = {
      'sports': ExperienceType.ATHLETIC,
      'clubs': ExperienceType.LEADERSHIP,
      'volunteer': ExperienceType.VOLUNTEER,
      'arts': ExperienceType.CREATIVE,
      'work': ExperienceType.WORK,
      'family': ExperienceType.CAREGIVING,
      'hobbies': ExperienceType.SELF_DIRECTED
    };

    return mapping[activity] || ExperienceType.SELF_DIRECTED;
  }

  // Enrichment Triggers

  private async triggerGoalBasedEnrichment(): Promise<void> {
    this.logger.info('Triggering goal-based enrichment');
    // This would queue up specific follow-up questions based on their goal
  }

  private async triggerChallengeBasedSupport(): Promise<void> {
    this.logger.info('Triggering challenge-based support');
    // This would provide immediate resources for their biggest challenge
  }

  private async triggerAcademicEnrichment(): Promise<void> {
    this.logger.info('Triggering academic enrichment');
    // This would ask for more academic details
  }

  private async triggerExperienceEnrichment(): Promise<void> {
    this.logger.info('Triggering experience enrichment');
    // This would guide them through adding detailed experiences
  }

  private async triggerFinancialEnrichment(): Promise<void> {
    this.logger.info('Triggering financial enrichment');
    // This would provide scholarship matching and financial aid guidance
  }

  // Progressive Data Collection Throughout Journey

  public async suggestNextDataCollection(
    profileId: string,
    context: 'dashboard' | 'achievement_added' | 'goal_updated' | 'weekly_checkin'
  ): Promise<{
    question: AssessmentQuestion;
    reason: string;
    estimatedValue: string;
  } | null> {
    const profile = await this.profileService.getProfile(profileId);
    
    // Determine what would be most valuable to collect next
    const missingCriticalData = this.identifyMissingCriticalData(profile);
    
    if (missingCriticalData.length === 0) {
      return null; // Profile is complete enough
    }

    // Pick the highest priority missing data
    const nextDataPoint = missingCriticalData[0];
    
    // Generate a contextual question
    const question = this.assessmentEngine.generateContextualQuestions(
      nextDataPoint.category,
      {
        grade: profile.userContext,
        goals: [profile.goals.primaryGoal],
        previousAnswers: new Map() // Would need to track this
      }
    )[0];

    if (!question) return null;

    return {
      question,
      reason: nextDataPoint.reason,
      estimatedValue: nextDataPoint.value
    };
  }

  private identifyMissingCriticalData(profile: UserProfile): Array<{
    category: AssessmentCategory;
    field: string;
    reason: string;
    value: string;
    priority: number;
  }> {
    const missing: Array<any> = [];

    // Check for missing academic data
    if (!profile.academicRecord?.gpa) {
      missing.push({
        category: 'academic',
        field: 'gpa',
        reason: 'GPA is essential for college matching',
        value: 'Unlock 500+ college recommendations',
        priority: 9
      });
    }

    // Check for test scores if 11th/12th grade
    if (profile.userContext.includes('11th') || profile.userContext.includes('12th')) {
      if (!profile.academicRecord?.standardizedTests || profile.academicRecord.standardizedTests.length === 0) {
        missing.push({
          category: 'academic',
          field: 'test_scores',
          reason: 'Test scores improve college predictions',
          value: 'Get accurate admission chances',
          priority: 8
        });
      }
    }

    // Check for experiences
    if (profile.experiences.length === 0) {
      missing.push({
        category: 'experiences',
        field: 'first_experience',
        reason: 'Experiences showcase your skills',
        value: 'Discover hidden strengths',
        priority: 7
      });
    }

    // Check for career interests if not specified
    if (profile.goals.targetCareers?.length === 0) {
      missing.push({
        category: 'goals',
        field: 'career_interests',
        reason: 'Career interests guide your path',
        value: 'Get personalized career roadmap',
        priority: 6
      });
    }

    // Sort by priority
    return missing.sort((a, b) => b.priority - a.priority);
  }
}