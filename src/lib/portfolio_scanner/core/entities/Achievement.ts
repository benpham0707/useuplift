// src/core/domain/entities/Achievement.ts

import { v4 as uuidv4 } from 'uuid';

export enum AchievementType {
  ACADEMIC = 'academic',
  ATHLETIC = 'athletic',
  ARTISTIC = 'artistic',
  LEADERSHIP = 'leadership',
  SERVICE = 'service',
  TECHNICAL = 'technical',
  ENTREPRENEURIAL = 'entrepreneurial',
  COMPETITION = 'competition',
  CERTIFICATION = 'certification',
  PUBLICATION = 'publication',
  PERSONAL = 'personal'
}

export enum AchievementScope {
  SCHOOL = 'school',
  LOCAL = 'local',
  REGIONAL = 'regional',
  STATE = 'state',
  NATIONAL = 'national',
  INTERNATIONAL = 'international'
}

export enum AchievementImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXCEPTIONAL = 'exceptional'
}

export interface AchievementMetrics {
  ranking?: string; // "1st place", "Top 10%", etc.
  participants?: number;
  selection_rate?: number; // For selective programs
  quantifiedImpact?: string; // "$1000 raised", "500 people reached"
}

export interface AchievementContext {
  backstory: string; // What led to this achievement
  effort: string; // What it took to achieve
  significance: string; // Why it matters
  growth: string; // What was learned
}

export class Achievement {
  public readonly id: string;
  public readonly profileId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  
  // Basic Information
  public title: string;
  public organization: string; // Who awarded/recognized it
  public type: AchievementType;
  public dateReceived: Date;
  
  // Scope & Impact
  public scope: AchievementScope;
  public impact: AchievementImpact;
  
  // Description
  public description: string;
  public criteria?: string; // What it took to earn this
  
  // Metrics & Evidence
  public metrics: AchievementMetrics;
  public verificationUrl?: string;
  public documentUrl?: string; // Certificate, article, etc.
  
  // Context for Storytelling
  public context: AchievementContext;
  
  // Skills & Qualities Demonstrated
  public skillsDemonstrated: string[] = [];
  public characterTraits: string[] = [];
  
  // AI Enhancement
  public enhancedDescription?: string;
  public relevanceScores: Map<string, number> = new Map(); // career path -> score
  public suggestedNarratives: string[] = [];
  
  // Hidden Achievement Flags
  public isUnderrecognized: boolean = false; // Achievements that sound small but aren't
  public requiresContext: boolean = false; // Needs explanation to understand value
  
  constructor(data: {
    profileId: string;
    title: string;
    organization: string;
    type: AchievementType;
    dateReceived: Date;
    scope: AchievementScope;
    description: string;
  }) {
    this.id = uuidv4();
    this.profileId = data.profileId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.title = data.title;
    this.organization = data.organization;
    this.type = data.type;
    this.dateReceived = data.dateReceived;
    this.scope = data.scope;
    this.description = data.description;
    
    this.impact = this.calculateInitialImpact();
    this.metrics = {};
    this.context = {
      backstory: '',
      effort: '',
      significance: '',
      growth: ''
    };
  }
  
  // Domain Methods
  
  public addMetric(key: keyof AchievementMetrics, value: string | number): void {
    this.metrics[key] = value as any;
    this.recalculateImpact();
    this.updatedAt = new Date();
  }
  
  public addContext(key: keyof AchievementContext, value: string): void {
    this.context[key] = value;
    this.updatedAt = new Date();
  }
  
  public demonstratesSkill(skill: string): void {
    if (!this.skillsDemonstrated.includes(skill)) {
      this.skillsDemonstrated.push(skill);
      this.updatedAt = new Date();
    }
  }
  
  public demonstratesTrait(trait: string): void {
    if (!this.characterTraits.includes(trait)) {
      this.characterTraits.push(trait);
      this.updatedAt = new Date();
    }
  }
  
  public setRelevanceScore(careerPath: string, score: number): void {
    this.relevanceScores.set(careerPath, Math.min(1, Math.max(0, score)));
    this.updatedAt = new Date();
  }
  
  public addSuggestedNarrative(narrative: string): void {
    if (!this.suggestedNarratives.includes(narrative)) {
      this.suggestedNarratives.push(narrative);
      this.updatedAt = new Date();
    }
  }
  
  public markAsUnderrecognized(reason: string): void {
    this.isUnderrecognized = true;
    this.requiresContext = true;
    this.context.significance = reason;
    this.updatedAt = new Date();
  }
  
  // Calculation Methods
  
  private calculateInitialImpact(): AchievementImpact {
    // Base impact on scope
    const scopeImpact: Record<AchievementScope, number> = {
      [AchievementScope.SCHOOL]: 1,
      [AchievementScope.LOCAL]: 2,
      [AchievementScope.REGIONAL]: 3,
      [AchievementScope.STATE]: 4,
      [AchievementScope.NATIONAL]: 5,
      [AchievementScope.INTERNATIONAL]: 6
    };
    
    const baseScore = scopeImpact[this.scope];
    
    if (baseScore >= 5) return AchievementImpact.EXCEPTIONAL;
    if (baseScore >= 4) return AchievementImpact.HIGH;
    if (baseScore >= 2) return AchievementImpact.MEDIUM;
    return AchievementImpact.LOW;
  }
  
  private recalculateImpact(): void {
    let impactScore = this.calculateInitialImpact();
    
    // Boost for competitive achievements
    if (this.metrics.selection_rate && this.metrics.selection_rate < 0.1) {
      impactScore = this.upgradeImpact(impactScore);
    }
    
    // Boost for high participation
    if (this.metrics.participants && this.metrics.participants > 1000) {
      impactScore = this.upgradeImpact(impactScore);
    }
    
    // Boost for top rankings
    if (this.metrics.ranking?.includes('1st') || this.metrics.ranking?.includes('first')) {
      impactScore = this.upgradeImpact(impactScore);
    }
    
    this.impact = impactScore;
  }
  
  private upgradeImpact(current: AchievementImpact): AchievementImpact {
    const upgrades: Record<AchievementImpact, AchievementImpact> = {
      [AchievementImpact.LOW]: AchievementImpact.MEDIUM,
      [AchievementImpact.MEDIUM]: AchievementImpact.HIGH,
      [AchievementImpact.HIGH]: AchievementImpact.EXCEPTIONAL,
      [AchievementImpact.EXCEPTIONAL]: AchievementImpact.EXCEPTIONAL
    };
    
    return upgrades[current];
  }
  
  public calculatePrestigeScore(): number {
    const impactScores: Record<AchievementImpact, number> = {
      [AchievementImpact.LOW]: 0.25,
      [AchievementImpact.MEDIUM]: 0.5,
      [AchievementImpact.HIGH]: 0.75,
      [AchievementImpact.EXCEPTIONAL]: 1.0
    };
    
    let score = impactScores[this.impact];
    
    // Boost for evidence
    if (this.verificationUrl || this.documentUrl) score *= 1.1;
    
    // Boost for complete context
    const contextComplete = Object.values(this.context).every(v => v.length > 0);
    if (contextComplete) score *= 1.1;
    
    // Boost for underrecognized achievements
    if (this.isUnderrecognized) score *= 1.2;
    
    return Math.min(1, score);
  }
  
  // Story Generation
  
  public generateNarratives(): {
    elevator: string; // 1 sentence
    short: string; // 2-3 sentences
    full: string; // Paragraph
  } {
    const elevator = `${this.getActionVerb()} ${this.title} ${this.getImpactPhrase()}.`;
    
    const short = `${elevator} ${this.context.effort || `This ${this.scope}-level achievement required ${this.getEffortDescription()}.`} ${this.context.growth || `Through this experience, I developed ${this.skillsDemonstrated.slice(0, 2).join(' and ')}.`}`;
    
    const full = `${this.context.backstory || `My journey to ${this.title} began when I recognized an opportunity to make a difference.`} ${short} ${this.context.significance || `This achievement is particularly meaningful because it demonstrates my ability to ${this.getSignificanceDescription()}.`} ${this.getSuitabilityStatement()}`;
    
    return { elevator, short, full };
  }
  
  private getActionVerb(): string {
    const verbs: Record<AchievementType, string> = {
      [AchievementType.ACADEMIC]: 'Earned',
      [AchievementType.ATHLETIC]: 'Won',
      [AchievementType.ARTISTIC]: 'Created',
      [AchievementType.LEADERSHIP]: 'Led',
      [AchievementType.SERVICE]: 'Organized',
      [AchievementType.TECHNICAL]: 'Developed',
      [AchievementType.ENTREPRENEURIAL]: 'Founded',
      [AchievementType.COMPETITION]: 'Placed in',
      [AchievementType.CERTIFICATION]: 'Achieved',
      [AchievementType.PUBLICATION]: 'Published',
      [AchievementType.PERSONAL]: 'Accomplished'
    };
    
    return verbs[this.type];
  }
  
  private getImpactPhrase(): string {
    if (this.metrics.ranking) {
      return `achieving ${this.metrics.ranking}${this.metrics.participants ? ` among ${this.metrics.participants} participants` : ''}`;
    }
    
    if (this.metrics.quantifiedImpact) {
      return `resulting in ${this.metrics.quantifiedImpact}`;
    }
    
    return `at the ${this.scope} level`;
  }
  
  private getEffortDescription(): string {
    const efforts: Record<AchievementType, string> = {
      [AchievementType.ACADEMIC]: 'dedicated study and intellectual curiosity',
      [AchievementType.ATHLETIC]: 'consistent training and mental resilience',
      [AchievementType.ARTISTIC]: 'creative vision and technical skill',
      [AchievementType.LEADERSHIP]: 'strategic thinking and team coordination',
      [AchievementType.SERVICE]: 'empathy and organizational skills',
      [AchievementType.TECHNICAL]: 'problem-solving and technical expertise',
      [AchievementType.ENTREPRENEURIAL]: 'innovation and business acumen',
      [AchievementType.COMPETITION]: 'preparation and competitive spirit',
      [AchievementType.CERTIFICATION]: 'focused learning and skill mastery',
      [AchievementType.PUBLICATION]: 'research and communication skills',
      [AchievementType.PERSONAL]: 'self-discipline and perseverance'
    };
    
    return efforts[this.type];
  }
  
  private getSignificanceDescription(): string {
    const traits = this.characterTraits.length > 0 
      ? this.characterTraits.slice(0, 2).join(' and ')
      : 'excel in challenging situations';
    
    return `${traits} while making a meaningful impact`;
  }
  
  private getSuitabilityStatement(): string {
    const highestRelevance = Math.max(...Array.from(this.relevanceScores.values()));
    
    if (highestRelevance > 0.8) {
      return 'This achievement directly aligns with my career aspirations and demonstrates key competencies for my chosen field.';
    } else if (highestRelevance > 0.6) {
      return 'The skills developed through this achievement transfer directly to my professional goals.';
    } else {
      return 'This experience showcases my ability to excel across diverse challenges.';
    }
  }
  
  // High School Specific Methods
  
  public translateForHighSchooler(): {
    enhancedTitle: string;
    contextualizedDescription: string;
    collegeApplicationVersion: string;
  } {
    // Enhance common high school achievements
    const titleEnhancements: Record<string, string> = {
      'honor roll': 'Academic Excellence Recognition',
      'perfect attendance': 'Commitment to Educational Excellence',
      'student of the month': 'Peer and Faculty Recognition for Excellence',
      'team captain': 'Student Athletic Leadership Position',
      'club president': 'Student Organization Executive Leadership',
      'volunteer hours': 'Community Service Dedication Award',
      'science fair': 'STEM Research Competition',
      'hackathon': 'Technical Innovation Competition',
      'debate tournament': 'Forensics and Public Speaking Competition',
      'art show': 'Creative Arts Exhibition',
      'musical performance': 'Performing Arts Showcase'
    };
    
    const enhancedTitle = this.findEnhancement(this.title.toLowerCase(), titleEnhancements) || this.title;
    
    // Contextualize based on type
    const contextualizedDescription = this.contextualizeForCollege();
    
    // Create application-ready version
    const collegeApplicationVersion = `${enhancedTitle} (${this.dateReceived.getFullYear()}): ${contextualizedDescription} This ${this.scope}-level recognition ${this.getCollegeRelevance()}.`;
    
    return {
      enhancedTitle,
      contextualizedDescription,
      collegeApplicationVersion
    };
  }
  
  private findEnhancement(title: string, enhancements: Record<string, string>): string | null {
    for (const [key, value] of Object.entries(enhancements)) {
      if (title.includes(key)) {
        return value;
      }
    }
    return null;
  }
  
  private contextualizeForCollege(): string {
    const baseDescription = this.description;
    
    // Add context about difficulty/selectivity
    let enhanced = baseDescription;
    
    if (this.metrics.selection_rate) {
      enhanced += ` (${(this.metrics.selection_rate * 100).toFixed(1)}% acceptance rate)`;
    }
    
    if (this.metrics.participants) {
      enhanced += ` among ${this.metrics.participants} participants`;
    }
    
    if (this.context.effort) {
      enhanced += `, requiring ${this.context.effort}`;
    }
    
    return enhanced;
  }
  
  private getCollegeRelevance(): string {
    if (this.type === AchievementType.ACADEMIC) {
      return 'demonstrates my academic excellence and intellectual curiosity';
    } else if (this.type === AchievementType.LEADERSHIP) {
      return 'showcases my ability to inspire and guide others';
    } else if (this.type === AchievementType.SERVICE) {
      return 'reflects my commitment to community impact';
    } else if (this.type === AchievementType.TECHNICAL) {
      return 'highlights my technical skills and innovation';
    } else {
      return 'illustrates my diverse talents and dedication to excellence';
    }
  }
  
  // Underrecognized Achievement Detection
  
  public static identifyUnderrecognizedAchievements(achievements: Achievement[]): Achievement[] {
    const underrecognized: Achievement[] = [];
    
    achievements.forEach(achievement => {
      // Family responsibilities
      if (achievement.title.toLowerCase().includes('caregiver') || 
          achievement.title.toLowerCase().includes('family helper')) {
        achievement.markAsUnderrecognized(
          'Managing family responsibilities while excelling academically demonstrates exceptional time management and maturity'
        );
        underrecognized.push(achievement);
      }
      
      // Self-taught skills
      if (achievement.title.toLowerCase().includes('self-taught') ||
          achievement.description.toLowerCase().includes('taught myself')) {
        achievement.markAsUnderrecognized(
          'Self-directed learning shows initiative and intrinsic motivation valued by top institutions'
        );
        underrecognized.push(achievement);
      }
      
      // First-generation achievements
      if (achievement.description.toLowerCase().includes('first in my family') ||
          achievement.description.toLowerCase().includes('first generation')) {
        achievement.markAsUnderrecognized(
          'Breaking generational barriers demonstrates resilience and determination'
        );
        underrecognized.push(achievement);
      }
      
      // Community impact without formal recognition
      if (achievement.type === AchievementType.SERVICE && 
          achievement.scope === AchievementScope.LOCAL &&
          achievement.metrics.quantifiedImpact) {
        achievement.markAsUnderrecognized(
          'Grassroots community impact often exceeds formal awards in real-world significance'
        );
        underrecognized.push(achievement);
      }
    });
    
    return underrecognized;
  }
  
  // Validation
  
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!this.title) errors.push('Achievement title is required');
    if (!this.organization) errors.push('Awarding organization is required');
    if (!this.description) errors.push('Description is required');
    
    // Date validation
    if (this.dateReceived > new Date()) {
      errors.push('Achievement date cannot be in the future');
    }
    
    // Quality warnings
    if (this.description.length < 30) {
      warnings.push('Description is very brief - add more detail');
    }
    
    if (Object.keys(this.metrics).length === 0) {
      warnings.push('No metrics provided - quantify impact when possible');
    }
    
    if (this.skillsDemonstrated.length === 0) {
      warnings.push('No skills identified - consider what this achievement demonstrates');
    }
    
    if (!this.context.significance) {
      warnings.push('Add context about why this achievement matters to you');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // Comparison and Ranking
  
  public static rankAchievements(achievements: Achievement[], purpose: string = 'general'): Achievement[] {
    return achievements.sort((a, b) => {
      // First by impact
      const impactOrder = {
        [AchievementImpact.EXCEPTIONAL]: 4,
        [AchievementImpact.HIGH]: 3,
        [AchievementImpact.MEDIUM]: 2,
        [AchievementImpact.LOW]: 1
      };
      
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      
      // Then by relevance to purpose
      const aRelevance = a.relevanceScores.get(purpose) || 0;
      const bRelevance = b.relevanceScores.get(purpose) || 0;
      const relevanceDiff = bRelevance - aRelevance;
      if (relevanceDiff !== 0) return relevanceDiff;
      
      // Then by prestige score
      const prestigeDiff = b.calculatePrestigeScore() - a.calculatePrestigeScore();
      if (prestigeDiff !== 0) return prestigeDiff;
      
      // Finally by date (most recent first)
      return b.dateReceived.getTime() - a.dateReceived.getTime();
    });
  }
  
  // Application-Specific Formatting
  
  public formatForApplication(type: 'college' | 'scholarship' | 'job'): string {
    const narratives = this.generateNarratives();
    
    switch (type) {
      case 'college':
        return `${this.enhancedDescription || this.description} ${this.context.significance || ''}`.trim();
      
      case 'scholarship':
        return `${narratives.short} ${this.metrics.quantifiedImpact ? `Impact: ${this.metrics.quantifiedImpact}.` : ''}`.trim();
      
      case 'job':
        return `${this.title}: ${this.skillsDemonstrated.join(', ')} demonstrated through ${this.getImpactPhrase()}`;
      
      default:
        return narratives.short;
    }
  }
}

export default Achievement;