// src/core/domain/entities/Experience.ts

import { v4 as uuidv4 } from 'uuid';

export enum ExperienceType {
  WORK = 'work',
  INTERNSHIP = 'internship',
  VOLUNTEER = 'volunteer',
  LEADERSHIP = 'leadership',
  PROJECT = 'project',
  RESEARCH = 'research',
  CREATIVE = 'creative',
  ATHLETIC = 'athletic',
  ENTREPRENEURIAL = 'entrepreneurial',
  CAREGIVING = 'caregiving',
  SELF_DIRECTED = 'self_directed'
}

export enum TimeCommitment {
  MINIMAL = 'minimal', // < 5 hrs/week
  PART_TIME = 'part_time', // 5-15 hrs/week
  SIGNIFICANT = 'significant', // 15-30 hrs/week
  FULL_TIME = 'full_time' // 30+ hrs/week
}

export interface ExperienceMetrics {
  // Quantifiable impact
  peopleImpacted?: number;
  moneyRaised?: number;
  moneyEarned?: number;
  hoursDedicated?: number;
  teamSize?: number;
  customMetrics?: Record<string, string | number>;
}

export interface SkillDemonstration {
  skill: string;
  context: string;
  evidence: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export class Experience {
  public readonly id: string;
  public readonly profileId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  
  // Basic Information
  public title: string;
  public organization: string;
  public type: ExperienceType;
  public startDate: Date;
  public endDate?: Date; // null if ongoing
  public isOngoing: boolean;
  
  // Time Investment
  public timeCommitment: TimeCommitment;
  public totalHours?: number;
  
  // Description & Impact
  public description: string;
  public responsibilities: string[];
  public achievements: string[];
  public challenges: string[];
  
  // Quantifiable Metrics
  public metrics: ExperienceMetrics;
  
  // Skills & Learning
  public skillsDemonstrated: SkillDemonstration[] = [];
  public lessonsLearned: string[] = [];
  public toolsUsed: string[] = [];
  
  // Hidden Value Extraction
  public transferableSkills: string[] = [];
  public leadershipExamples: string[] = [];
  public problemSolvingExamples: string[] = [];
  
  // Verification & References
  public verificationUrl?: string; // LinkedIn, GitHub, news article, etc.
  public supervisorName?: string;
  public canContact?: boolean;
  
  // AI Analysis Results
  public aiExtractedThemes: string[] = [];
  public narrativeSummary?: string;
  public collegeRelevanceScore?: number;
  
  constructor(data: {
    profileId: string;
    title: string;
    organization: string;
    type: ExperienceType;
    startDate: Date;
    endDate?: Date;
    timeCommitment: TimeCommitment;
    description: string;
  }) {
    this.id = uuidv4();
    this.profileId = data.profileId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.title = data.title;
    this.organization = data.organization;
    this.type = data.type;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.isOngoing = !data.endDate;
    this.timeCommitment = data.timeCommitment;
    this.description = data.description;
    
    this.responsibilities = [];
    this.achievements = [];
    this.challenges = [];
    this.metrics = {};
  }
  
  // Domain Methods
  
  public addResponsibility(responsibility: string): void {
    if (!this.responsibilities.includes(responsibility)) {
      this.responsibilities.push(responsibility);
      this.updatedAt = new Date();
    }
  }
  
  public addAchievement(achievement: string): void {
    if (!this.achievements.includes(achievement)) {
      this.achievements.push(achievement);
      this.updatedAt = new Date();
    }
  }
  
  public addChallenge(challenge: string): void {
    if (!this.challenges.includes(challenge)) {
      this.challenges.push(challenge);
      this.updatedAt = new Date();
    }
  }
  
  public addMetric(key: string, value: string | number): void {
    this.metrics.customMetrics = this.metrics.customMetrics || {};
    this.metrics.customMetrics[key] = value;
    this.updatedAt = new Date();
  }
  
  public demonstrateSkill(demonstration: SkillDemonstration): void {
    // Update if skill exists, otherwise add
    const existingIndex = this.skillsDemonstrated.findIndex(
      s => s.skill.toLowerCase() === demonstration.skill.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      this.skillsDemonstrated[existingIndex] = demonstration;
    } else {
      this.skillsDemonstrated.push(demonstration);
    }
    
    this.updatedAt = new Date();
  }
  
  public addTransferableSkill(skill: string): void {
    if (!this.transferableSkills.includes(skill)) {
      this.transferableSkills.push(skill);
      this.updatedAt = new Date();
    }
  }
  
  public addLeadershipExample(example: string): void {
    if (!this.leadershipExamples.includes(example)) {
      this.leadershipExamples.push(example);
      this.updatedAt = new Date();
    }
  }
  
  public addProblemSolvingExample(example: string): void {
    if (!this.problemSolvingExamples.includes(example)) {
      this.problemSolvingExamples.push(example);
      this.updatedAt = new Date();
    }
  }
  
  public setAIAnalysis(themes: string[], summary: string, relevanceScore: number): void {
    this.aiExtractedThemes = themes;
    this.narrativeSummary = summary;
    this.collegeRelevanceScore = relevanceScore;
    this.updatedAt = new Date();
  }
  
  // Calculation Methods
  
  public calculateDuration(): number {
    const end = this.endDate || new Date();
    const months = (end.getFullYear() - this.startDate.getFullYear()) * 12 + 
                  (end.getMonth() - this.startDate.getMonth());
    return Math.max(1, months);
  }
  
  public calculateCommitmentScore(): number {
    const durationScore = Math.min(this.calculateDuration() / 24, 1) * 0.3; // 2 years = max
    
    const intensityScore = {
      [TimeCommitment.MINIMAL]: 0.2,
      [TimeCommitment.PART_TIME]: 0.5,
      [TimeCommitment.SIGNIFICANT]: 0.8,
      [TimeCommitment.FULL_TIME]: 1.0
    }[this.timeCommitment] * 0.3;
    
    const impactScore = this.calculateImpactScore() * 0.4;
    
    return durationScore + intensityScore + impactScore;
  }
  
  public calculateImpactScore(): number {
    let score = 0;
    
    // Achievement count
    score += Math.min(this.achievements.length / 5, 1) * 0.3;
    
    // Metrics presence
    const metricCount = Object.keys(this.metrics).length + 
                       (this.metrics.customMetrics ? Object.keys(this.metrics.customMetrics).length : 0);
    score += Math.min(metricCount / 5, 1) * 0.3;
    
    // Leadership indicators
    if (this.leadershipExamples.length > 0) score += 0.2;
    
    // Problem-solving examples
    if (this.problemSolvingExamples.length > 0) score += 0.2;
    
    return score;
  }
  
  public getExperienceStrength(): {
    score: number;
    strengths: string[];
    improvements: string[];
  } {
    const score = this.calculateCommitmentScore();
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Identify strengths
    if (this.calculateDuration() >= 12) {
      strengths.push('Long-term commitment demonstrates dedication');
    }
    
    if (this.achievements.length >= 3) {
      strengths.push('Multiple achievements show impact');
    }
    
    if (this.leadershipExamples.length > 0) {
      strengths.push('Leadership experience is highly valued');
    }
    
    if (this.metrics.peopleImpacted && this.metrics.peopleImpacted > 50) {
      strengths.push('Significant community impact');
    }
    
    // Identify improvements
    if (this.achievements.length === 0) {
      improvements.push('Add specific achievements or accomplishments');
    }
    
    if (Object.keys(this.metrics).length === 0) {
      improvements.push('Quantify your impact with numbers');
    }
    
    if (this.skillsDemonstrated.length === 0) {
      improvements.push('Identify specific skills you developed');
    }
    
    if (!this.narrativeSummary) {
      improvements.push('Add a compelling story about this experience');
    }
    
    return { score, strengths, improvements };
  }
  
  // Story Generation Helpers
  
  public generateSTARStory(): {
    situation: string;
    task: string;
    action: string;
    result: string;
  } | null {
    if (this.challenges.length === 0 || this.achievements.length === 0) {
      return null;
    }
    
    return {
      situation: `While ${this.title} at ${this.organization}, ${this.challenges[0]}`,
      task: `I needed to ${this.responsibilities[0] || 'fulfill my role effectively'}`,
      action: this.description,
      result: this.achievements[0]
    };
  }
  
  public extractCollegeEssayTopics(): string[] {
    const topics: string[] = [];
    
    // Challenge-based topics
    this.challenges.forEach(challenge => {
      topics.push(`Overcoming ${challenge} through ${this.title}`);
    });
    
    // Growth-based topics
    if (this.lessonsLearned.length > 0) {
      topics.push(`How ${this.title} taught me ${this.lessonsLearned[0]}`);
    }
    
    // Impact-based topics
    if (this.metrics.peopleImpacted) {
      topics.push(`Making a difference: My impact on ${this.metrics.peopleImpacted} people`);
    }
    
    // Leadership topics
    this.leadershipExamples.forEach(example => {
      topics.push(`Leadership lessons from ${example}`);
    });
    
    return topics;
  }
  
  // Validation
  
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!this.title) errors.push('Experience title is required');
    if (!this.organization) errors.push('Organization name is required');
    if (!this.description) errors.push('Description is required');
    
    // Date validation
    if (this.endDate && this.endDate < this.startDate) {
      errors.push('End date cannot be before start date');
    }
    
    if (this.startDate > new Date()) {
      errors.push('Start date cannot be in the future');
    }
    
    // Quality warnings
    if (this.description.length < 50) {
      warnings.push('Description is very short - add more detail for better impact');
    }
    
    if (this.achievements.length === 0) {
      warnings.push('No achievements listed - add accomplishments to strengthen this experience');
    }
    
    if (this.responsibilities.length === 0) {
      warnings.push('No responsibilities listed - describe what you did');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // High School Specific Helpers
  
  public translateForHighSchooler(): {
    enhancedTitle: string;
    professionalDescription: string;
    collegeAppVersion: string;
  } {
    const translations: Record<string, string> = {
      'babysitter': 'Childcare Provider',
      'lawn mowing': 'Landscaping Services',
      'tutoring friends': 'Peer Academic Mentor',
      'family helper': 'Family Business Contributor',
      'youtube creator': 'Digital Content Producer',
      'discord moderator': 'Online Community Manager',
      'minecraft server admin': 'Virtual Environment Administrator'
    };
    
    const enhancedTitle = translations[this.title.toLowerCase()] || this.title;
    
    const professionalDescription = this.description
      .replace(/helped out/gi, 'assisted')
      .replace(/did stuff/gi, 'performed various tasks')
      .replace(/hung out/gi, 'collaborated')
      .replace(/was in charge of/gi, 'managed');
    
    const collegeAppVersion = `As ${enhancedTitle} at ${this.organization}, I ${professionalDescription}. ` +
      `This experience taught me ${this.transferableSkills.slice(0, 3).join(', ')} ` +
      `while ${this.achievements.length > 0 ? this.achievements[0] : 'making a meaningful contribution'}.`;
    
    return {
      enhancedTitle,
      professionalDescription,
      collegeAppVersion
    };
  }
}

export default Experience;