// src/core/domain/entities/UserProfile.ts

import { v4 as uuidv4 } from 'uuid';
import { AcademicRecord } from './AcademicRecord';
import { Experience } from './Experience';
import { Achievement } from './Achievement';
import { ProfileCompletionScore, ProfileValidationResult, EnrichmentPriority } from '../../shared/types/profile.types';

export enum UserContext {
  HIGH_SCHOOL_9TH = 'high_school_9th',
  HIGH_SCHOOL_10TH = 'high_school_10th',
  HIGH_SCHOOL_11TH = 'high_school_11th',
  HIGH_SCHOOL_12TH = 'high_school_12th',
  GAP_YEAR = 'gap_year',
  COLLEGE_FRESHMAN = 'college_freshman',
  COLLEGE_SOPHOMORE = 'college_sophomore',
  COLLEGE_JUNIOR = 'college_junior',
  COLLEGE_SENIOR = 'college_senior'
}

export enum ProfileStatus {
  INITIAL = 'initial',
  BASIC_COMPLETE = 'basic_complete',
  ENRICHED = 'enriched',
  VERIFIED = 'verified',
  ARCHIVED = 'archived'
}

export interface ProfileConstraints {
  needsFinancialAid: boolean;
  geographicLimitations?: 'local_only' | 'in_state' | 'regional' | 'anywhere';
  familyObligations?: boolean;
  workingWhileStudying?: boolean;
  disabilityAccommodations?: boolean;
}

export interface ProfileGoals {
  primaryGoal: 'college_admission' | 'career_prep' | 'skill_development' | 'exploring_options';
  targetColleges?: string[];
  targetCareers?: string[];
  timelineUrgency: 'immediate' | 'this_year' | 'next_year' | 'flexible';
  desiredOutcomes: string[];
}

export interface DemographicData {
  // Collected for bias prevention and accessibility, not for limiting options
  firstGenerationStudent?: boolean;
  englishSecondLanguage?: boolean;
  socioeconomicBackground?: 'low_income' | 'middle_income' | 'high_income' | 'prefer_not_say';
  race?: string; // Optional, for diversity programs only
  gender?: string; // Optional, for specific opportunities
}

export class UserProfile {
  public readonly id: string;
  public readonly userId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  
  // Core Identity
  public userContext: UserContext;
  public status: ProfileStatus;
  
  // Academic Information
  public academicRecord?: AcademicRecord;
  
  // Experiences & Achievements
  public experiences: Experience[] = [];
  public achievements: Achievement[] = [];
  
  // Goals & Constraints
  public goals: ProfileGoals;
  public constraints: ProfileConstraints;
  
  // Demographic Data (for opportunity matching, not limitation)
  public demographics: DemographicData;
  
  // Profile Metadata
  public completionScore: ProfileCompletionScore;
  public lastEnrichmentDate?: Date;
  public enrichmentPriorities: EnrichmentPriority[] = [];
  
  // AI-Generated Insights
  public extractedSkills: Map<string, number> = new Map(); // skill -> confidence score
  public hiddenStrengths: string[] = [];
  public narrativeSummary?: string;
  
  constructor(data: {
    userId: string;
    userContext: UserContext;
    goals: ProfileGoals;
    constraints: ProfileConstraints;
    demographics?: DemographicData;
  }) {
    this.id = uuidv4();
    this.userId = data.userId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.userContext = data.userContext;
    this.status = ProfileStatus.INITIAL;
    this.goals = data.goals;
    this.constraints = data.constraints;
    this.demographics = data.demographics || {};
    
    this.completionScore = this.calculateCompletionScore();
  }
  
  // Domain Methods
  
  public addAcademicRecord(record: AcademicRecord): void {
    this.academicRecord = record;
    this.updateStatus();
    this.recalculateCompletionScore();
  }
  
  public addExperience(experience: Experience): void {
    // Prevent duplicates
    const exists = this.experiences.some(e => 
      e.title === experience.title && 
      e.organization === experience.organization
    );
    
    if (!exists) {
      this.experiences.push(experience);
      this.extractSkillsFromExperience(experience);
      this.updateStatus();
      this.recalculateCompletionScore();
    }
  }
  
  public addAchievement(achievement: Achievement): void {
    this.achievements.push(achievement);
    this.updateStatus();
    this.recalculateCompletionScore();
  }
  
  public updateGoals(goals: Partial<ProfileGoals>): void {
    this.goals = { ...this.goals, ...goals };
    this.updatedAt = new Date();
  }
  
  public updateConstraints(constraints: Partial<ProfileConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
    this.updatedAt = new Date();
  }
  
  public updateDemographics(demographics: Partial<DemographicData>): void {
    this.demographics = { ...this.demographics, ...demographics };
    this.updatedAt = new Date();
  }
  
  public markEnriched(priorities: EnrichmentPriority[]): void {
    this.lastEnrichmentDate = new Date();
    this.enrichmentPriorities = priorities;
    this.status = ProfileStatus.ENRICHED;
  }
  
  public addExtractedSkill(skill: string, confidence: number): void {
    const currentConfidence = this.extractedSkills.get(skill) || 0;
    this.extractedSkills.set(skill, Math.max(currentConfidence, confidence));
  }
  
  public addHiddenStrength(strength: string): void {
    if (!this.hiddenStrengths.includes(strength)) {
      this.hiddenStrengths.push(strength);
    }
  }
  
  public setNarrativeSummary(summary: string): void {
    this.narrativeSummary = summary;
    this.updatedAt = new Date();
  }
  
  // Validation Methods
  
  public validate(): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!this.userContext) {
      errors.push('User context is required');
    }
    
    if (!this.goals.primaryGoal) {
      errors.push('Primary goal must be specified');
    }
    
    // Logical validation
    if (this.userContext.includes('high_school') && this.academicRecord?.gpaScale === 'college') {
      warnings.push('GPA scale seems inconsistent with high school status');
    }
    
    // Completeness warnings
    if (this.experiences.length === 0) {
      warnings.push('No experiences added - profile may be too thin for strong recommendations');
    }
    
    if (this.constraints.needsFinancialAid && !this.demographics.socioeconomicBackground) {
      warnings.push('Consider adding socioeconomic info for better financial aid matching');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: this.completionScore
    };
  }
  
  // Computation Methods
  
  public getEnrichmentPriorities(): EnrichmentPriority[] {
    const priorities: EnrichmentPriority[] = [];
    
    // High priority: Missing critical data for goals
    if (this.goals.primaryGoal === 'college_admission') {
      if (!this.academicRecord) {
        priorities.push({
          type: 'academic_record',
          priority: 'high',
          reason: 'Academic record needed for college matching',
          estimatedImpact: 0.3
        });
      }
      
      if (!this.academicRecord?.standardizedTests) {
        priorities.push({
          type: 'test_scores',
          priority: 'high',
          reason: 'Test scores significantly impact college options',
          estimatedImpact: 0.25
        });
      }
    }
    
    // Medium priority: Enrichment opportunities
    if (this.experiences.length < 3) {
      priorities.push({
        type: 'experiences',
        priority: 'medium',
        reason: 'More experiences create stronger applications',
        estimatedImpact: 0.15
      });
    }
    
    // Low priority: Nice-to-haves
    if (this.achievements.length === 0) {
      priorities.push({
        type: 'achievements',
        priority: 'low',
        reason: 'Achievements help you stand out',
        estimatedImpact: 0.1
      });
    }
    
    return priorities.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }
  
  public getProfileStrength(): number {
    let strength = 0;
    
    // Base completeness (40%)
    strength += this.completionScore.overall * 0.4;
    
    // Experience diversity (20%)
    const experienceTypes = new Set(this.experiences.map(e => e.type));
    strength += Math.min(experienceTypes.size / 5, 1) * 0.2;
    
    // Skill breadth (20%)
    const skillCount = this.extractedSkills.size;
    strength += Math.min(skillCount / 20, 1) * 0.2;
    
    // Achievement impact (20%)
    const hasHighImpactAchievement = this.achievements.some(a => a.impact === 'high');
    strength += hasHighImpactAchievement ? 0.2 : this.achievements.length > 0 ? 0.1 : 0;
    
    return Math.round(strength * 100);
  }
  
  // Private Methods
  
  private calculateCompletionScore(): ProfileCompletionScore {
    const sections = {
      basic: this.calculateBasicCompletion(),
      academic: this.calculateAcademicCompletion(),
      experience: this.calculateExperienceCompletion(),
      goals: this.calculateGoalsCompletion(),
      enrichment: this.calculateEnrichmentCompletion()
    };
    
    const overall = Object.values(sections).reduce((a, b) => a + b, 0) / Object.keys(sections).length;
    
    return {
      overall,
      sections,
      nextMilestone: this.getNextMilestone(overall)
    };
  }
  
  private calculateBasicCompletion(): number {
    let score = 0;
    if (this.userContext) score += 0.5;
    if (this.goals.primaryGoal) score += 0.5;
    return score;
  }
  
  private calculateAcademicCompletion(): number {
    if (!this.academicRecord) return 0;
    
    let score = 0.5; // Has record
    if (this.academicRecord.gpa) score += 0.2;
    if (this.academicRecord.coursework.length > 0) score += 0.2;
    if (this.academicRecord.standardizedTests) score += 0.1;
    
    return score;
  }
  
  private calculateExperienceCompletion(): number {
    const experienceScore = Math.min(this.experiences.length / 5, 1) * 0.5;
    const achievementScore = Math.min(this.achievements.length / 3, 1) * 0.5;
    return experienceScore + achievementScore;
  }
  
  private calculateGoalsCompletion(): number {
    let score = 0;
    if (this.goals.primaryGoal) score += 0.3;
    if (this.goals.desiredOutcomes.length > 0) score += 0.3;
    if (this.goals.timelineUrgency) score += 0.2;
    if (this.goals.targetColleges?.length || this.goals.targetCareers?.length) score += 0.2;
    return score;
  }
  
  private calculateEnrichmentCompletion(): number {
    let score = 0;
    if (this.extractedSkills.size > 0) score += 0.3;
    if (this.hiddenStrengths.length > 0) score += 0.3;
    if (this.narrativeSummary) score += 0.4;
    return score;
  }
  
  private getNextMilestone(currentScore: number): string {
    if (currentScore < 0.4) return 'Complete basic profile for personalized recommendations';
    if (currentScore < 0.6) return 'Add academic information to unlock college matching';
    if (currentScore < 0.8) return 'Add experiences for stronger applications';
    return 'Profile complete! Keep it updated for best results';
  }
  
  private updateStatus(): void {
    if (this.completionScore.overall > 0.8) {
      this.status = ProfileStatus.ENRICHED;
    } else if (this.completionScore.overall > 0.4) {
      this.status = ProfileStatus.BASIC_COMPLETE;
    }
    this.updatedAt = new Date();
  }
  
  private recalculateCompletionScore(): void {
    this.completionScore = this.calculateCompletionScore();
  }
  
  private extractSkillsFromExperience(experience: Experience): void {
    // This would typically call an AI service
    // For now, using a simple mapping
    const skillMapping: Record<string, string[]> = {
      'leadership': ['communication', 'team_management', 'decision_making'],
      'technical': ['problem_solving', 'analytical_thinking', 'attention_to_detail'],
      'creative': ['innovation', 'design_thinking', 'artistic_expression'],
      'service': ['empathy', 'community_engagement', 'social_awareness'],
      'academic': ['research', 'critical_thinking', 'writing']
    };
    
    const skills = skillMapping[experience.type] || [];
    skills.forEach(skill => this.addExtractedSkill(skill, 0.7));
  }
}

export default UserProfile;