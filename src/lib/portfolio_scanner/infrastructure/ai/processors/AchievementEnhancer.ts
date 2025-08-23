// src/infrastructure/ai/AchievementEnhancer.ts

import { injectable, inject } from 'inversify';
import { Achievement, AchievementType, AchievementScope } from '../../core/domain/entities/Achievement';
import { AIServiceError } from '../../shared/errors/ProfileErrors';
import { Logger } from '../../shared/utils/logger';
import { ConfigService } from '../config/ConfigService';

interface EnhancementResult {
  enhancedDescription: string;
  suggestedNarratives: string[];
  identifiedSkills: string[];
  contextualValue: {
    rarity: number;
    difficulty: number;
    impact: number;
    growth: number;
  };
  professionalFraming: string;
  hiddenValue: string[];
}

interface AchievementPattern {
  type: AchievementType;
  keywords: string[];
  valueIndicators: string[];
  typicalSkills: string[];
  enhancementStrategy: string;
}

@injectable()
export class AchievementEnhancer {
  private readonly achievementPatterns: Map<AchievementType, AchievementPattern>;
  private readonly underrecognizedIndicators: string[];
  private readonly impactAmplifiers: Map<string, number>;

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(ConfigService) private config: ConfigService
  ) {
    this.achievementPatterns = this.initializePatterns();
    this.underrecognizedIndicators = this.initializeUnderrecognizedIndicators();
    this.impactAmplifiers = this.initializeImpactAmplifiers();
  }

  // Main Enhancement Method

  public async enhance(achievement: Achievement): Promise<EnhancementResult> {
    try {
      // Analyze the achievement
      const analysis = await this.analyzeAchievement(achievement);

      // Generate enhanced description
      const enhancedDescription = await this.generateEnhancedDescription(achievement, analysis);

      // Create narrative suggestions
      const suggestedNarratives = await this.generateNarrativeSuggestions(achievement, analysis);

      // Extract skills demonstrated
      const identifiedSkills = await this.extractDemonstratedSkills(achievement);

      // Calculate contextual value
      const contextualValue = this.calculateContextualValue(achievement, analysis);

      // Create professional framing
      const professionalFraming = this.createProfessionalFraming(achievement, analysis);

      // Identify hidden value
      const hiddenValue = this.identifyHiddenValue(achievement, analysis);

      return {
        enhancedDescription,
        suggestedNarratives,
        identifiedSkills,
        contextualValue,
        professionalFraming,
        hiddenValue
      };
    } catch (error) {
      this.logger.error('Achievement enhancement failed', { error, achievementId: achievement.id });
      throw new AIServiceError('achievement_enhancement', 'AchievementEnhancer', error.message);
    }
  }

  // Underrecognized Achievement Detection

  public async identifyUnderrecognized(achievements: Achievement[]): Promise<{
    achievement: Achievement;
    reason: string;
    enhancedValue: string;
  }[]> {
    const underrecognized: any[] = [];

    for (const achievement of achievements) {
      const reasons = this.checkUnderrecognizedIndicators(achievement);
      
      if (reasons.length > 0) {
        const enhancedValue = await this.explainHiddenValue(achievement, reasons);
        
        underrecognized.push({
          achievement,
          reason: reasons[0], // Primary reason
          enhancedValue
        });
        
        // Mark the achievement
        achievement.markAsUnderrecognized(enhancedValue);
      }
    }

    return underrecognized;
  }

  // Batch Enhancement

  public async enhanceBatch(achievements: Achievement[]): Promise<Map<string, EnhancementResult>> {
    const results = new Map<string, EnhancementResult>();

    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < achievements.length; i += batchSize) {
      const batch = achievements.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(achievement => 
          this.enhance(achievement)
            .then(result => ({ id: achievement.id, result }))
            .catch(error => {
              this.logger.error('Batch enhancement failed for achievement', { 
                error, 
                achievementId: achievement.id 
              });
              return null;
            })
        )
      );

      batchResults.forEach(item => {
        if (item) {
          results.set(item.id, item.result);
        }
      });
    }

    return results;
  }

  // Context-Aware Enhancement

  public async enhanceWithContext(
    achievement: Achievement,
    context: {
      userAge?: number;
      userContext?: string;
      targetAudience?: string;
      competitionLevel?: string;
    }
  ): Promise<EnhancementResult> {
    const baseEnhancement = await this.enhance(achievement);

    // Adjust based on context
    if (context.userAge && context.userAge < 18) {
      baseEnhancement.enhancedDescription = this.adjustForYouthAchievement(
        baseEnhancement.enhancedDescription,
        context.userAge
      );
      baseEnhancement.hiddenValue.push('Exceptional achievement for age group');
    }

    if (context.targetAudience === 'college_admissions') {
      baseEnhancement.professionalFraming = this.frameForCollegeAdmissions(
        achievement,
        baseEnhancement
      );
    }

    if (context.competitionLevel) {
      baseEnhancement.contextualValue.difficulty *= this.getCompetitionMultiplier(
        context.competitionLevel
      );
    }

    return baseEnhancement;
  }

  // Private Analysis Methods

  private async analyzeAchievement(achievement: Achievement): Promise<any> {
    const analysis = {
      type: achievement.type,
      scope: achievement.scope,
      impact: achievement.impact,
      metrics: achievement.metrics,
      context: achievement.context,
      keywords: this.extractKeywords(achievement),
      themes: this.identifyThemes(achievement),
      uniqueAspects: this.findUniqueAspects(achievement)
    };

    // Enhance with AI analysis
    const aiAnalysis = await this.performAIAnalysis(achievement);
    
    return { ...analysis, ...aiAnalysis };
  }

  private async generateEnhancedDescription(
    achievement: Achievement,
    analysis: any
  ): Promise<string> {
    const pattern = this.achievementPatterns.get(achievement.type);
    if (!pattern) {
      return achievement.description;
    }

    // Build enhanced description
    let enhanced = achievement.description;

    // Add context about difficulty/selectivity
    if (achievement.metrics.selectionRate && achievement.metrics.selectionRate < 0.1) {
      const percentage = (achievement.metrics.selectionRate * 100).toFixed(1);
      enhanced = `${enhanced} This highly selective recognition (${percentage}% selection rate) ${pattern.enhancementStrategy}`;
    }

    // Add scope context
    enhanced = this.addScopeContext(enhanced, achievement.scope);

    // Add impact metrics
    if (achievement.metrics.participants && achievement.metrics.participants > 100) {
      enhanced = `${enhanced} Among ${achievement.metrics.participants} participants, this achievement demonstrates ${analysis.themes.join(' and ')}.`;
    }

    // Add skill demonstration
    if (analysis.uniqueAspects.length > 0) {
      enhanced = `${enhanced} This accomplishment uniquely showcases ${analysis.uniqueAspects.join(', ')}.`;
    }

    return enhanced;
  }

  private async generateNarrativeSuggestions(
    achievement: Achievement,
    analysis: any
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Challenge narrative
    if (achievement.context.backstory) {
      suggestions.push(
        `When I faced ${achievement.context.backstory}, I discovered that ${achievement.context.growth}. ` +
        `This led me to ${achievement.title}, which taught me ${analysis.themes[0] || 'the value of persistence'}.`
      );
    }

    // Impact narrative
    if (achievement.metrics.quantifiedImpact) {
      suggestions.push(
        `My ${achievement.title} didn't just earn recognition—it ${achievement.metrics.quantifiedImpact}. ` +
        `This experience showed me how ${analysis.themes.join(' and ')} can create real change.`
      );
    }

    // Growth narrative
    suggestions.push(
      `Earning ${achievement.title} was more than an accomplishment; it was a transformation. ` +
      `Through ${achievement.context.effort || 'dedicated effort'}, I developed ${analysis.identifiedSkills?.slice(0, 3).join(', ')}.`
    );

    // Underdog narrative (if applicable)
    if (this.isUnderdogStory(achievement, analysis)) {
      suggestions.push(
        `Despite ${analysis.challenges || 'limited resources'}, I achieved ${achievement.title}. ` +
        `This experience proved that ${achievement.context.significance || 'determination outweighs circumstances'}.`
      );
    }

    return suggestions;
  }

  private async extractDemonstratedSkills(achievement: Achievement): Promise<string[]> {
    const skills: Set<string> = new Set();

    // Get type-specific skills
    const pattern = this.achievementPatterns.get(achievement.type);
    if (pattern) {
      pattern.typicalSkills.forEach(skill => skills.add(skill));
    }

    // Extract from description and context
    const textToAnalyze = [
      achievement.description,
      achievement.context.effort,
      achievement.context.growth,
      ...achievement.skillsDemonstrated
    ].filter(Boolean).join(' ');

    const extractedSkills = await this.extractSkillsFromText(textToAnalyze);
    extractedSkills.forEach(skill => skills.add(skill));

    // Add scope-based skills
    const scopeSkills = this.getScopeBasedSkills(achievement.scope);
    scopeSkills.forEach(skill => skills.add(skill));

    return Array.from(skills);
  }

  private calculateContextualValue(achievement: Achievement, analysis: any): any {
    const value = {
      rarity: 0,
      difficulty: 0,
      impact: 0,
      growth: 0
    };

    // Calculate rarity
    if (achievement.metrics.selectionRate) {
      value.rarity = 1 - achievement.metrics.selectionRate;
    } else {
      value.rarity = this.estimateRarity(achievement.scope, achievement.type);
    }

    // Calculate difficulty
    value.difficulty = this.calculateDifficulty(achievement, analysis);

    // Calculate impact
    value.impact = this.calculateImpact(achievement);

    // Calculate growth
    value.growth = this.calculateGrowthValue(achievement, analysis);

    return value;
  }

  private createProfessionalFraming(achievement: Achievement, analysis: any): string {
    const framings: Record<string, string> = {
      academic: `Demonstrated exceptional ${analysis.themes.join(' and ')} through ${achievement.title}, ` +
                `placing in the top ${this.getPercentile(achievement)}% of participants.`,
      
      leadership: `Led initiative resulting in ${achievement.title}, showcasing ability to ` +
                  `${analysis.leadershipQualities || 'inspire and deliver results'}.`,
      
      technical: `Achieved ${achievement.title} by ${analysis.technicalApproach || 'applying innovative solutions'}, ` +
                 `demonstrating proficiency in ${analysis.technicalSkills?.join(' and ') || 'complex problem-solving'}.`,
      
      service: `Earned ${achievement.title} through sustained commitment to ${analysis.serviceArea || 'community impact'}, ` +
               `directly benefiting ${achievement.metrics.quantifiedImpact || 'numerous individuals'}.`,
      
      creative: `Created work recognized with ${achievement.title}, exhibiting ` +
                `${analysis.creativeQualities || 'originality and artistic excellence'}.`
    };

    return framings[achievement.type] || 
           `Earned ${achievement.title} through demonstration of ${analysis.themes.join(' and ')}.`;
  }

  private identifyHiddenValue(achievement: Achievement, analysis: any): string[] {
    const hiddenValues: string[] = [];

    // Age-relative achievement
    if (analysis.ageContext && analysis.ageContext.isYoung) {
      hiddenValues.push('Exceptional accomplishment for age group');
    }

    // Resource constraints overcome
    if (analysis.resourceConstraints) {
      hiddenValues.push('Achieved despite limited resources/support');
    }

    // First in category
    if (analysis.isFirst) {
      hiddenValues.push('Pioneering achievement in this context');
    }

    // Skill diversity
    if (analysis.identifiedSkills && analysis.identifiedSkills.length > 5) {
      hiddenValues.push('Demonstrates exceptional skill diversity');
    }

    // Leadership without authority
    if (achievement.type !== 'leadership' && analysis.leadershipQualities) {
      hiddenValues.push('Shows natural leadership beyond formal roles');
    }

    // Cross-domain excellence
    if (this.identifyCrossDomainExcellence(achievement, analysis)) {
      hiddenValues.push('Bridges multiple fields of expertise');
    }

    return hiddenValues;
  }

  // Helper Methods

  private checkUnderrecognizedIndicators(achievement: Achievement): string[] {
    const reasons: string[] = [];

    const description = achievement.description.toLowerCase();
    const title = achievement.title.toLowerCase();

    // Check for family responsibilities
    if (this.underrecognizedIndicators.some(indicator => 
        description.includes(indicator) || title.includes(indicator))) {
      reasons.push('Significant responsibility often overlooked in traditional achievements');
    }

    // Check for self-directed achievements
    if (description.includes('self-taught') || description.includes('independently')) {
      reasons.push('Self-directed achievement demonstrates exceptional initiative');
    }

    // Check for first-generation achievements
    if (description.includes('first in my family') || achievement.context.backstory?.includes('first generation')) {
      reasons.push('Breaking generational barriers is a profound achievement');
    }

    // Check for community impact without formal recognition
    if (achievement.type === 'service' && achievement.scope === 'local' && 
        !achievement.metrics.ranking) {
      reasons.push('Grassroots community impact often more meaningful than formal awards');
    }

    // Check for sustained effort
    const effortDuration = this.extractDuration(achievement.context.effort);
    if (effortDuration && effortDuration > 12) {
      reasons.push('Long-term dedication demonstrates exceptional commitment');
    }

    return reasons;
  }

  private async explainHiddenValue(achievement: Achievement, reasons: string[]): Promise<string> {
    const explanations: string[] = [];

    for (const reason of reasons) {
      switch (reason) {
        case 'Significant responsibility often overlooked in traditional achievements':
          explanations.push(
            `This achievement, while not a traditional award, demonstrates maturity, reliability, and real-world skills ` +
            `that many peers won't develop until much later in life.`
          );
          break;

        case 'Self-directed achievement demonstrates exceptional initiative':
          explanations.push(
            `Achieving this without formal instruction or support shows intrinsic motivation and learning ability ` +
            `that predicts success in challenging academic and professional environments.`
          );
          break;

        case 'Breaking generational barriers is a profound achievement':
          explanations.push(
            `As a first-generation achiever, this accomplishment represents not just personal success but ` +
            `the opening of new pathways for your family and community.`
          );
          break;

        case 'Grassroots community impact often more meaningful than formal awards':
          explanations.push(
            `While this may not have received formal recognition, the direct impact on real people's lives ` +
            `demonstrates values and effectiveness that prestigious awards often miss.`
          );
          break;

        case 'Long-term dedication demonstrates exceptional commitment':
          explanations.push(
            `The sustained effort over ${this.extractDuration(achievement.context.effort)} months shows a level of dedication ` +
            `and follow-through that is rare and highly valued in any field.`
          );
          break;
      }
    }

    return explanations.join(' ');
  }

  private extractKeywords(achievement: Achievement): string[] {
    const text = `${achievement.title} ${achievement.description} ${achievement.context.significance}`;
    
    // Simple keyword extraction - would use NLP in production
    const keywords = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isCommonWord(word));

    return [...new Set(keywords)];
  }

  private identifyThemes(achievement: Achievement): string[] {
    const themes: string[] = [];

    // Analyze achievement for common themes
    const text = `${achievement.description} ${achievement.context.significance}`.toLowerCase();

    if (text.includes('lead') || text.includes('organize') || text.includes('manage')) {
      themes.push('leadership');
    }
    if (text.includes('create') || text.includes('design') || text.includes('innovate')) {
      themes.push('innovation');
    }
    if (text.includes('help') || text.includes('serve') || text.includes('volunteer')) {
      themes.push('service');
    }
    if (text.includes('overcome') || text.includes('challenge') || text.includes('difficult')) {
      themes.push('perseverance');
    }

    return themes;
  }

  private findUniqueAspects(achievement: Achievement): string[] {
    const aspects: string[] = [];

    // Identify what makes this achievement unique
    if (achievement.metrics.participants && achievement.metrics.ranking?.includes('1')) {
      aspects.push('first-place distinction');
    }

    if (achievement.isUnderrecognized) {
      aspects.push('hidden excellence');
    }

    if (achievement.scope === 'international') {
      aspects.push('global perspective');
    }

    if (achievement.type === 'technical' && achievement.context.backstory?.includes('self')) {
      aspects.push('self-directed learning');
    }

    return aspects;
  }

  private async performAIAnalysis(achievement: Achievement): Promise<any> {
    // Simulated AI analysis - would call actual AI service
    const prompt = this.buildAnalysisPrompt(achievement);
    
    // Simulated response
    return {
      identifiedSkills: ['critical thinking', 'project management', 'communication'],
      leadershipQualities: achievement.leadershipExamples.length > 0 ? 'strategic thinking' : null,
      technicalSkills: achievement.type === 'technical' ? ['problem-solving', 'analytical thinking'] : [],
      creativeQualities: achievement.type === 'artistic' ? 'innovative expression' : null,
      serviceArea: achievement.type === 'service' ? 'community development' : null,
      challenges: 'resource constraints',
      ageContext: { isYoung: true },
      resourceConstraints: true,
      isFirst: false
    };
  }

  private buildAnalysisPrompt(achievement: Achievement): string {
    return `Analyze this achievement for hidden value and skills:
    Title: ${achievement.title}
    Type: ${achievement.type}
    Description: ${achievement.description}
    Context: ${JSON.stringify(achievement.context)}
    Metrics: ${JSON.stringify(achievement.metrics)}
    
    Identify:
    1. Skills demonstrated (both obvious and hidden)
    2. Unique aspects that make this stand out
    3. Professional value beyond the obvious
    4. Character traits revealed`;
  }

  private addScopeContext(description: string, scope: AchievementScope): string {
    const scopeDescriptions: Record<AchievementScope, string> = {
      school: 'within the school community',
      local: 'at the local/community level',
      regional: 'across the region',
      state: 'at the state level',
      national: 'nationally',
      international: 'on an international scale'
    };

    return `${description} This recognition ${scopeDescriptions[scope]} highlights exceptional achievement`;
  }

  private isUnderdogStory(achievement: Achievement, analysis: any): boolean {
    return analysis.resourceConstraints || 
           analysis.challenges?.includes('limited') ||
           achievement.context.backstory?.includes('despite') ||
           achievement.context.backstory?.includes('overcame');
  }

  private async extractSkillsFromText(text: string): Promise<string[]> {
    // Simple skill extraction - would use NLP
    const skillKeywords = [
      'organized', 'managed', 'led', 'created', 'developed',
      'analyzed', 'solved', 'communicated', 'collaborated', 'innovated'
    ];

    const skills: string[] = [];
    
    skillKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        skills.push(this.keywordToSkill(keyword));
      }
    });

    return skills;
  }

  private keywordToSkill(keyword: string): string {
    const mapping: Record<string, string> = {
      organized: 'organization',
      managed: 'management',
      led: 'leadership',
      created: 'creativity',
      developed: 'development',
      analyzed: 'analysis',
      solved: 'problem-solving',
      communicated: 'communication',
      collaborated: 'collaboration',
      innovated: 'innovation'
    };

    return mapping[keyword] || keyword;
  }

  private getScopeBasedSkills(scope: AchievementScope): string[] {
    const scopeSkills: Record<AchievementScope, string[]> = {
      school: ['community engagement', 'peer leadership'],
      local: ['community awareness', 'local impact'],
      regional: ['regional perspective', 'cross-community collaboration'],
      state: ['state-level competition', 'broad impact'],
      national: ['national perspective', 'competitive excellence'],
      international: ['global mindset', 'cultural awareness', 'international collaboration']
    };

    return scopeSkills[scope] || [];
  }

  private estimateRarity(scope: AchievementScope, type: AchievementType): number {
    // Base rarity by scope
    const scopeRarity: Record<AchievementScope, number> = {
      school: 0.3,
      local: 0.4,
      regional: 0.6,
      state: 0.7,
      national: 0.85,
      international: 0.95
    };

    // Adjust by type
    const typeMultiplier: Record<AchievementType, number> = {
      academic: 1.0,
      athletic: 0.9,
      artistic: 1.1,
      leadership: 1.0,
      service: 0.95,
      technical: 1.1,
      entrepreneurial: 1.2,
      competition: 1.0,
      certification: 0.8,
      publication: 1.2,
      personal: 1.0
    };

    return Math.min(scopeRarity[scope] * typeMultiplier[type], 1.0);
  }

  private calculateDifficulty(achievement: Achievement, analysis: any): number {
    let difficulty = 0.5;

    // Selection rate factor
    if (achievement.metrics.selectionRate) {
      difficulty = 1 - achievement.metrics.selectionRate;
    }

    // Participant count factor
    if (achievement.metrics.participants) {
      if (achievement.metrics.participants > 1000) difficulty += 0.2;
      if (achievement.metrics.participants > 5000) difficulty += 0.1;
    }

    // Effort duration factor
    const duration = this.extractDuration(achievement.context.effort);
    if (duration) {
      difficulty += Math.min(duration / 24, 0.3); // Max 0.3 for 2+ years
    }

    return Math.min(difficulty, 1.0);
  }

  private calculateImpact(achievement: Achievement): number {
    let impact = 0.3; // Base impact

    // Direct impact metrics
    if (achievement.metrics.quantifiedImpact) {
      impact += 0.3;
    }

    // Scope-based impact
    const scopeImpact: Record<AchievementScope, number> = {
      school: 0.1,
      local: 0.15,
      regional: 0.2,
      state: 0.25,
      national: 0.3,
      international: 0.4
    };

    impact += scopeImpact[achievement.scope];

    // Type-based impact
    if (achievement.type === 'service' || achievement.type === 'leadership') {
      impact += 0.1;
    }

    return Math.min(impact, 1.0);
  }

  private calculateGrowthValue(achievement: Achievement, analysis: any): number {
    let growth = 0;

    // Skills developed
    if (analysis.identifiedSkills) {
      growth += Math.min(analysis.identifiedSkills.length * 0.1, 0.4);
    }

    // Challenges overcome
    if (achievement.context.backstory && achievement.context.growth) {
      growth += 0.3;
    }

    // Learning documented
    if (achievement.context.growth) {
      growth += 0.2;
    }

    // First-time achievement
    if (analysis.isFirst) {
      growth += 0.1;
    }

    return Math.min(growth, 1.0);
  }

  private extractDuration(effortText?: string): number | null {
    if (!effortText) return null;

    // Extract months from text
    const monthMatch = effortText.match(/(\d+)\s*month/i);
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    }

    // Extract years and convert to months
    const yearMatch = effortText.match(/(\d+)\s*year/i);
    if (yearMatch) {
      return parseInt(yearMatch[1]) * 12;
    }

    return null;
  }

  private getPercentile(achievement: Achievement): string {
    if (achievement.metrics.ranking) {
      if (achievement.metrics.ranking.includes('1st') || achievement.metrics.ranking.includes('first')) {
        return '1';
      }
      if (achievement.metrics.ranking.includes('top 10')) {
        return '10';
      }
      if (achievement.metrics.ranking.includes('top 5%')) {
        return '5';
      }
    }

    if (achievement.metrics.selectionRate) {
      return (achievement.metrics.selectionRate * 100).toFixed(1);
    }

    return '10'; // Default estimate
  }

  private adjustForYouthAchievement(description: string, age: number): string {
    if (age < 15) {
      return `${description} This achievement is particularly notable given the young age at which it was earned, demonstrating exceptional early development.`;
    }
    if (age < 18) {
      return `${description} Achieving this while balancing academic responsibilities shows remarkable time management and dedication.`;
    }
    return description;
  }

  private frameForCollegeAdmissions(achievement: Achievement, enhancement: EnhancementResult): string {
    const qualities = enhancement.identifiedSkills.slice(0, 3).join(', ');
    
    return `This achievement demonstrates the ${qualities} that I will bring to your campus community. ` +
           `${enhancement.contextualValue.growth > 0.7 ? 'The growth from this experience has prepared me for the rigors of college-level challenges.' : ''} ` +
           `${enhancement.contextualValue.impact > 0.7 ? 'My proven ability to create meaningful impact will contribute to campus initiatives.' : ''}`;
  }

  private getCompetitionMultiplier(level: string): number {
    const multipliers: Record<string, number> = {
      local: 1.0,
      regional: 1.2,
      state: 1.4,
      national: 1.6,
      international: 2.0
    };

    return multipliers[level] || 1.0;
  }

  private identifyCrossDomainExcellence(achievement: Achievement, analysis: any): boolean {
    // Check if achievement bridges multiple domains
    const domains = new Set<string>();

    if (analysis.technicalSkills?.length > 0) domains.add('technical');
    if (analysis.creativeQualities) domains.add('creative');
    if (analysis.leadershipQualities) domains.add('leadership');
    if (analysis.serviceArea) domains.add('service');
    if (achievement.type === 'academic') domains.add('academic');

    return domains.size >= 2;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been',
      'were', 'which', 'their', 'would', 'there', 'could', 'when', 'what'
    ];
    
    return commonWords.includes(word);
  }

  private initializePatterns(): Map<AchievementType, AchievementPattern> {
    const patterns = new Map<AchievementType, AchievementPattern>();

    patterns.set('academic', {
      type: 'academic',
      keywords: ['gpa', 'honor', 'scholar', 'dean', 'valedictorian', 'summa'],
      valueIndicators: ['top', 'highest', 'exceptional', 'outstanding'],
      typicalSkills: ['analytical thinking', 'research', 'time management', 'discipline'],
      enhancementStrategy: 'demonstrates sustained academic excellence and intellectual capacity'
    });

    patterns.set('leadership', {
      type: 'leadership',
      keywords: ['president', 'captain', 'founder', 'chair', 'director', 'organized'],
      valueIndicators: ['led', 'managed', 'coordinated', 'initiated'],
      typicalSkills: ['team management', 'decision making', 'communication', 'strategic planning'],
      enhancementStrategy: 'showcases ability to inspire and guide others toward shared goals'
    });

    patterns.set('technical', {
      type: 'technical',
      keywords: ['developed', 'programmed', 'engineered', 'built', 'designed', 'invented'],
      valueIndicators: ['innovative', 'first', 'novel', 'patented'],
      typicalSkills: ['problem-solving', 'technical proficiency', 'innovation', 'analytical thinking'],
      enhancementStrategy: 'highlights technical expertise and innovative problem-solving capabilities'
    });

    patterns.set('service', {
      type: 'service',
      keywords: ['volunteer', 'community', 'helped', 'served', 'raised', 'donated'],
      valueIndicators: ['hours', 'people', 'funds', 'impact'],
      typicalSkills: ['empathy', 'community engagement', 'project management', 'social awareness'],
      enhancementStrategy: 'reflects deep commitment to positive social impact and community values'
    });

    patterns.set('artistic', {
      type: 'artistic',
      keywords: ['performed', 'exhibited', 'published', 'composed', 'directed', 'created'],
      valueIndicators: ['original', 'premiered', 'solo', 'featured'],
      typicalSkills: ['creativity', 'artistic expression', 'discipline', 'cultural awareness'],
      enhancementStrategy: 'demonstrates creative excellence and unique artistic perspective'
    });

    patterns.set('athletic', {
      type: 'athletic',
      keywords: ['champion', 'varsity', 'mvp', 'record', 'qualified', 'competed'],
      valueIndicators: ['state', 'national', 'ranked', 'recruited'],
      typicalSkills: ['discipline', 'teamwork', 'perseverance', 'leadership', 'time management'],
      enhancementStrategy: 'shows dedication, competitive excellence, and ability to perform under pressure'
    });

    return patterns;
  }

  private initializeUnderrecognizedIndicators(): string[] {
    return [
      'family responsibilities',
      'caregiver',
      'translated for',
      'first in my family',
      'self-taught',
      'without formal training',
      'despite limited resources',
      'working while',
      'supporting family',
      'overcame',
      'language barrier',
      'financial constraints',
      'rural',
      'immigrant',
      'first-generation'
    ];
  }

  private initializeImpactAmplifiers(): Map<string, number> {
    const amplifiers = new Map<string, number>();

    amplifiers.set('first', 2.0);
    amplifiers.set('only', 1.8);
    amplifiers.set('youngest', 1.7);
    amplifiers.set('pioneered', 1.6);
    amplifiers.set('founded', 1.5);
    amplifiers.set('transformed', 1.5);
    amplifiers.set('revolutionized', 1.5);

    return amplifiers;
  }
}

export default AchievementEnhancer;