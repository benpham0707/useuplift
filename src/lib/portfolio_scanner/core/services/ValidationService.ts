// src/core/services/ValidationService.ts

import { injectable, inject } from 'inversify';
import { 
  ValidationError, 
  DateRangeError, 
  BusinessRuleViolationError,
  DuplicateEntryError 
} from '../../shared/errors/ProfileErrors';
import { 
  ProfileDTO, 
  AcademicRecordDTO, 
  ExperienceDTO, 
  AchievementDTO,
  ValidationContext,
  FieldValidationRule,
  PROFILE_CONSTANTS
} from '../../shared/types/enhanced.types';
import { IPortfolioRepository } from '../repositories/interfaces/IPortfolioRepository';
import { UserProfile, UserContext } from '../domain/entities/UserProfile';
import { Experience, ExperienceType } from '../domain/entities/Experience';
import { Achievement } from '../domain/entities/Achievement';
import { Logger } from '../../shared/utils/logger';

interface ValidationIssue {
  field: string;
  message: string;
  value?: any;
}

@injectable()
export class ValidationService {
  private readonly validationRules: Map<string, FieldValidationRule[]>;

  constructor(
    @inject('IPortfolioRepository') private repository: IPortfolioRepository,
    @inject(Logger) private logger: Logger
  ) {
    this.validationRules = this.initializeValidationRules();
  }

  // Profile Validation
  
  public async validateCreateProfileRequest(
    request: ProfileDTO.CreateRequest
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const issues: ValidationIssue[] = [];

    try {
      // Check for existing profile
      const existingProfile = await this.repository.getProfileByUserId(request.userId);
      if (existingProfile) {
        throw new DuplicateEntryError('Profile', 'userId', request.userId);
      }

      // Validate user context
      this.validateUserContext(request.userContext, issues);

      // Validate goals
      this.validateProfileGoals(request.goals, request.userContext, issues);

      // Validate constraints
      this.validateProfileConstraints(request.constraints, issues);

      // Validate demographics if provided
      if (request.demographics) {
        this.validateDemographics(request.demographics, issues);
      }

      if (issues.length > 0) {
        throw new ValidationError(issues);
      }

      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { 
          isValid: false, 
          errors: error.validationErrors.map(e => e.message) 
        };
      }
      throw error;
    }
  }

  public validateUpdateProfileRequest(
    request: ProfileDTO.UpdateRequest,
    currentProfile: UserProfile
  ): { isValid: boolean; errors: string[] } {
    const issues: ValidationIssue[] = [];

    // Validate state transitions
    if (request.updates.status) {
      this.validateStatusTransition(
        currentProfile.status, 
        request.updates.status, 
        issues
      );
    }

    // Validate user context change
    if (request.updates.userContext) {
      this.validateUserContextTransition(
        currentProfile.userContext,
        request.updates.userContext,
        issues
      );
    }

    // Validate updated goals
    if (request.updates.goals) {
      const mergedGoals = { ...currentProfile.goals, ...request.updates.goals };
      this.validateProfileGoals(
        mergedGoals as any, 
        currentProfile.userContext, 
        issues
      );
    }

    return {
      isValid: issues.length === 0,
      errors: issues.map(i => i.message)
    };
  }

  // Academic Record Validation

  public validateAcademicRecord(
    record: AcademicRecordDTO.CreateRequest,
    userContext: UserContext
  ): void {
    const issues: ValidationIssue[] = [];

    // Validate GPA
    if (record.gpa !== undefined) {
      this.validateGPA(record.gpa, record.gpaScale, record.weightedGPA, issues);
    }

    // Validate class rank
    if (record.classRank && record.classSize) {
      if (record.classRank > record.classSize) {
        issues.push({
          field: 'classRank',
          message: 'Class rank cannot exceed class size',
          value: record.classRank
        });
      }
    }

    // Business rule: High school students shouldn't have college-level data
    if (userContext.includes('high_school') && record.gpaScale === 'college') {
      issues.push({
        field: 'gpaScale',
        message: 'High school students should not use college GPA scale',
        value: record.gpaScale
      });
    }

    // Validate graduation year
    if (record.school.graduationYear) {
      const currentYear = new Date().getFullYear();
      const expectedGradYear = this.calculateExpectedGraduationYear(userContext);
      
      if (Math.abs(record.school.graduationYear - expectedGradYear) > 2) {
        issues.push({
          field: 'graduationYear',
          message: `Graduation year seems inconsistent with grade level. Expected around ${expectedGradYear}`,
          value: record.school.graduationYear
        });
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }

  // Experience Validation

  public async validateExperience(
    experience: ExperienceDTO.CreateRequest,
    profileId: string
  ): Promise<void> {
    const issues: ValidationIssue[] = [];

    // Validate dates
    const startDate = new Date(experience.startDate);
    const endDate = experience.endDate ? new Date(experience.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new DateRangeError(startDate, endDate, 'Experience');
    }

    if (startDate > new Date()) {
      issues.push({
        field: 'startDate',
        message: 'Start date cannot be in the future',
        value: experience.startDate
      });
    }

    // Check for duplicates
    const duplicate = await this.repository.findDuplicateExperience(
      profileId,
      experience.title,
      experience.organization
    );

    if (duplicate) {
      throw new DuplicateEntryError(
        'Experience',
        'title and organization',
        `${experience.title} at ${experience.organization}`
      );
    }

    // Validate description length
    if (experience.description.length < 20) {
      issues.push({
        field: 'description',
        message: 'Description should be at least 20 characters to be meaningful',
        value: experience.description
      });
    }

    if (experience.description.length > 2000) {
      issues.push({
        field: 'description',
        message: 'Description should not exceed 2000 characters',
        value: experience.description.length
      });
    }

    // Validate metrics if provided
    if (experience.metrics) {
      this.validateMetrics(experience.metrics, issues);
    }

    // Business rule: Validate time commitment consistency
    if (experience.timeCommitment === 'full_time' && endDate) {
      const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (durationMonths < 1) {
        issues.push({
          field: 'timeCommitment',
          message: 'Full-time commitment typically requires at least 1 month duration',
          value: experience.timeCommitment
        });
      }
    }

    // Validate array sizes
    if (experience.responsibilities && experience.responsibilities.length > 20) {
      issues.push({
        field: 'responsibilities',
        message: 'Maximum 20 responsibilities allowed',
        value: experience.responsibilities.length
      });
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }

  // Achievement Validation

  public async validateAchievement(
    achievement: AchievementDTO.CreateRequest,
    profileId: string
  ): Promise<void> {
    const issues: ValidationIssue[] = [];

    // Validate date
    const dateReceived = new Date(achievement.dateReceived);
    if (dateReceived > new Date()) {
      issues.push({
        field: 'dateReceived',
        message: 'Achievement date cannot be in the future',
        value: achievement.dateReceived
      });
    }

    // Check for duplicates
    const duplicate = await this.repository.findDuplicateAchievement(
      profileId,
      achievement.title,
      achievement.organization
    );

    if (duplicate) {
      throw new DuplicateEntryError(
        'Achievement',
        'title and organization',
        `${achievement.title} from ${achievement.organization}`
      );
    }

    // Validate metrics consistency
    if (achievement.metrics) {
      if (achievement.metrics.ranking && achievement.metrics.participants) {
        // Validate ranking format
        const rankingNumber = this.extractRankingNumber(achievement.metrics.ranking);
        if (rankingNumber && rankingNumber > achievement.metrics.participants) {
          issues.push({
            field: 'metrics.ranking',
            message: 'Ranking cannot exceed number of participants',
            value: achievement.metrics.ranking
          });
        }
      }

      if (achievement.metrics.selectionRate) {
        if (achievement.metrics.selectionRate < 0 || achievement.metrics.selectionRate > 1) {
          issues.push({
            field: 'metrics.selectionRate',
            message: 'Selection rate must be between 0 and 1',
            value: achievement.metrics.selectionRate
          });
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
  }

  // Field-level Validation

  public validateField(
    entity: string,
    field: string,
    value: any,
    context?: ValidationContext
  ): { isValid: boolean; error?: string } {
    const rules = this.validationRules.get(`${entity}.${field}`);
    if (!rules) {
      return { isValid: true };
    }

    for (const rule of rules) {
      for (const validation of rule.rules) {
        const result = this.applyValidationRule(validation, value, context);
        if (!result.isValid) {
          return result;
        }
      }
    }

    return { isValid: true };
  }

  // Private Helper Methods

  private validateUserContext(context: UserContext, issues: ValidationIssue[]): void {
    const validContexts = Object.values(UserContext);
    if (!validContexts.includes(context)) {
      issues.push({
        field: 'userContext',
        message: `Invalid user context. Must be one of: ${validContexts.join(', ')}`,
        value: context
      });
    }
  }

  private validateProfileGoals(goals: any, userContext: UserContext, issues: ValidationIssue[]): void {
    // Validate primary goal
    const validGoals = ['college_admission', 'career_prep', 'skill_development', 'exploring_options'];
    if (!validGoals.includes(goals.primaryGoal)) {
      issues.push({
        field: 'goals.primaryGoal',
        message: `Invalid primary goal. Must be one of: ${validGoals.join(', ')}`,
        value: goals.primaryGoal
      });
    }

    // Business rule: High school students typically focus on college admission
    if (userContext.includes('high_school') && goals.primaryGoal === 'career_prep') {
      issues.push({
        field: 'goals.primaryGoal',
        message: 'Consider "college_admission" as primary goal for high school students',
        value: goals.primaryGoal
      });
    }

    // Validate timeline
    const validTimelines = ['immediate', 'this_year', 'next_year', 'flexible'];
    if (!validTimelines.includes(goals.timelineUrgency)) {
      issues.push({
        field: 'goals.timelineUrgency',
        message: `Invalid timeline. Must be one of: ${validTimelines.join(', ')}`,
        value: goals.timelineUrgency
      });
    }

    // Validate arrays don't exceed limits
    if (goals.targetColleges && goals.targetColleges.length > 50) {
      issues.push({
        field: 'goals.targetColleges',
        message: 'Maximum 50 target colleges allowed',
        value: goals.targetColleges.length
      });
    }
  }

  private validateProfileConstraints(constraints: any, issues: ValidationIssue[]): void {
    // Validate geographic limitations
    if (constraints.geographicLimitations) {
      const validLimitations = ['local_only', 'in_state', 'regional', 'anywhere'];
      if (!validLimitations.includes(constraints.geographicLimitations)) {
        issues.push({
          field: 'constraints.geographicLimitations',
          message: `Invalid geographic limitation. Must be one of: ${validLimitations.join(', ')}`,
          value: constraints.geographicLimitations
        });
      }
    }
  }

  private validateDemographics(demographics: any, issues: ValidationIssue[]): void {
    // Validate socioeconomic background if provided
    if (demographics.socioeconomicBackground) {
      const validBackgrounds = ['low_income', 'middle_income', 'high_income', 'prefer_not_say'];
      if (!validBackgrounds.includes(demographics.socioeconomicBackground)) {
        issues.push({
          field: 'demographics.socioeconomicBackground',
          message: `Invalid socioeconomic background. Must be one of: ${validBackgrounds.join(', ')}`,
          value: demographics.socioeconomicBackground
        });
      }
    }
  }

  private validateGPA(gpa: number, scale: string, weightedGPA: number | undefined, issues: ValidationIssue[]): void {
    // Validate GPA based on scale
    const maxValues: Record<string, number> = {
      '4.0': 4.0,
      '5.0': 5.0,
      '100': 100,
      'international': 999 // No standard max
    };

    const maxGPA = maxValues[scale];
    if (maxGPA && gpa > maxGPA && !weightedGPA) {
      issues.push({
        field: 'gpa',
        message: `Unweighted GPA cannot exceed ${maxGPA} on ${scale} scale`,
        value: gpa
      });
    }

    // Validate weighted GPA is higher than unweighted
    if (weightedGPA && weightedGPA < gpa) {
      issues.push({
        field: 'weightedGPA',
        message: 'Weighted GPA should be equal to or higher than unweighted GPA',
        value: weightedGPA
      });
    }
  }

  private validateStatusTransition(current: string, next: string, issues: ValidationIssue[]): void {
    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      'initial': ['basic_complete'],
      'basic_complete': ['enriched', 'verified'],
      'enriched': ['verified'],
      'verified': ['archived'],
      'archived': [] // No transitions from archived
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BusinessRuleViolationError(
        'status_transition',
        `Cannot transition from ${current} to ${next}`,
        `Allowed transitions: ${allowed.join(', ')}`
      );
    }
  }

  private validateUserContextTransition(current: UserContext, next: UserContext, issues: ValidationIssue[]): void {
    // Extract grade levels
    const currentGrade = this.extractGradeLevel(current);
    const nextGrade = this.extractGradeLevel(next);

    // Validate progression
    if (currentGrade && nextGrade) {
      const validProgression = nextGrade >= currentGrade && nextGrade <= currentGrade + 2;
      if (!validProgression) {
        issues.push({
          field: 'userContext',
          message: 'Invalid grade progression. Students typically advance one grade per year',
          value: next
        });
      }
    }
  }

  private validateMetrics(metrics: Record<string, any>, issues: ValidationIssue[]): void {
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        // Validate MetricValue structure
        if (value.type === 'percentage' && (value.value < 0 || value.value > 100)) {
          issues.push({
            field: `metrics.${key}`,
            message: 'Percentage values must be between 0 and 100',
            value: value.value
          });
        }
        
        if (value.type === 'number' && value.value < 0) {
          issues.push({
            field: `metrics.${key}`,
            message: 'Numeric metrics cannot be negative',
            value: value.value
          });
        }
      }
    });
  }

  private calculateExpectedGraduationYear(userContext: UserContext): number {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYearOffset = currentMonth >= 8 ? 1 : 0; // After August, we're in next academic year

    const gradeYearsRemaining: Record<string, number> = {
      'high_school_9th': 4,
      'high_school_10th': 3,
      'high_school_11th': 2,
      'high_school_12th': 1,
      'college_freshman': 4,
      'college_sophomore': 3,
      'college_junior': 2,
      'college_senior': 1
    };

    const yearsRemaining = gradeYearsRemaining[userContext] || 0;
    return currentYear + yearsRemaining - academicYearOffset;
  }

  private extractGradeLevel(context: UserContext): number | null {
    const gradeLevels: Record<string, number> = {
      'high_school_9th': 9,
      'high_school_10th': 10,
      'high_school_11th': 11,
      'high_school_12th': 12,
      'college_freshman': 13,
      'college_sophomore': 14,
      'college_junior': 15,
      'college_senior': 16
    };

    return gradeLevels[context] || null;
  }

  private extractRankingNumber(ranking: string): number | null {
    const match = ranking.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private applyValidationRule(
    rule: any,
    value: any,
    context?: ValidationContext
  ): { isValid: boolean; error?: string } {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return { isValid: false, error: rule.message };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.params.min) {
          return { isValid: false, error: rule.message };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.params.max) {
          return { isValid: false, error: rule.message };
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.params.pattern).test(value)) {
          return { isValid: false, error: rule.message };
        }
        break;

      case 'custom':
        if (rule.params.validator && !rule.params.validator(value, context)) {
          return { isValid: false, error: rule.message };
        }
        break;
    }

    return { isValid: true };
  }

  private initializeValidationRules(): Map<string, FieldValidationRule[]> {
    const rules = new Map<string, FieldValidationRule[]>();

    // Profile rules
    rules.set('profile.userId', [{
      field: 'userId',
      rules: [
        { type: 'required', message: 'User ID is required' },
        { type: 'pattern', params: { pattern: '^[a-zA-Z0-9_-]+ }, message: 'Invalid user ID format' }
      ]
    }]);

    // Experience rules
    rules.set('experience.title', [{
      field: 'title',
      rules: [
        { type: 'required', message: 'Experience title is required' },
        { type: 'minLength', params: { min: 3 }, message: 'Title must be at least 3 characters' },
        { type: 'maxLength', params: { max: 100 }, message: 'Title cannot exceed 100 characters' }
      ]
    }]);

    rules.set('experience.description', [{
      field: 'description',
      rules: [
        { type: 'required', message: 'Description is required' },
        { type: 'minLength', params: { min: 20 }, message: 'Description must be at least 20 characters' },
        { type: 'maxLength', params: { max: 2000 }, message: 'Description cannot exceed 2000 characters' }
      ]
    }]);

    // Add more rules as needed...

    return rules;
  }
}

export default ValidationService;