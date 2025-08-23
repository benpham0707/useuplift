// src/core/services/NarrativeGenerationService.ts

import { injectable, inject } from 'inversify';
import { 
  NarrativeGeneration,
  ProfileAnalysis,
  HiddenStrengthAnalysis
} from '../../shared/types/enhanced.types';
import { UserProfile } from '../domain/entities/UserProfile';
import { Experience } from '../domain/entities/Experience';
import { Achievement } from '../domain/entities/Achievement';
import { IPortfolioRepository } from '../repositories/interfaces/IPortfolioRepository';
import { AIServiceError, ProfileIncompleteError } from '../../shared/errors/ProfileErrors';
import { Logger } from '../../shared/utils/logger';
import { ConfigService } from '../../infrastructure/config/ConfigService';

interface NarrativeTheme {
  name: string;
  keywords: string[];
  structure: string[];
  tone: string;
}

interface StoryArc {
  setup: string;
  challenge: string;
  action: string;
  result: string;
  learning: string;
}

interface NarrativeComponents {
  hook: string;
  context: string;
  journey: string[];
  impact: string;
  future: string;
}

@injectable()
export class NarrativeGenerationService {
  private readonly narrativeThemes: Map<string, NarrativeTheme>;
  private readonly audienceProfiles: Map<string, any>;

  constructor(
    @inject('IPortfolioRepository') private repository: IPortfolioRepository,
    @inject(Logger) private logger: Logger,
    @inject(ConfigService) private config: ConfigService
  ) {
    this.narrativeThemes = this.initializeThemes();
    this.audienceProfiles = this.initializeAudienceProfiles();
  }

  // Generate Narrative

  public async generateNarrative(
    profileId: string,
    audience: 'college_admissions' | 'scholarship' | 'employer' | 'general',
    themes: string[],
    length: 'elevator' | 'short' | 'medium' | 'full',
    tone?: 'professional' | 'personal' | 'academic' | 'inspirational'
  ): Promise<NarrativeGeneration> {
    try {
      // Load complete profile data
      const profile = await this.loadCompleteProfile(profileId);
      
      // Validate profile completeness
      this.validateProfileForNarrative(profile, audience);

      // Identify key story elements
      const storyElements = await this.extractStoryElements(profile, themes);

      // Create narrative structure
      const structure = this.createNarrativeStructure(
        storyElements,
        audience,
        length,
        tone || 'personal'
      );

      // Generate primary narrative
      const primaryNarrative = await this.composeNarrative(structure, profile);

      // Generate alternative versions
      const alternatives = await this.generateAlternatives(
        structure,
        profile,
        audience,
        3 // Generate 3 alternatives
      );

      // Suggest applications
      const suggestedApplications = this.suggestApplications(audience, themes, profile);

      return {
        audience,
        tone: tone || 'personal',
        length,
        themes,
        generatedText: primaryNarrative,
        alternativeVersions: alternatives,
        suggestedApplications
      };
    } catch (error) {
      this.logger.error('Failed to generate narrative', { error, profileId, audience });
      throw new AIServiceError('narrative_generation', 'NarrativeGenerator', error.message);
    }
  }

  // Generate Profile Summary

  public async generateProfileSummary(profileId: string): Promise<string> {
    try {
      const profile = await this.loadCompleteProfile(profileId);
      
      // Extract key highlights
      const highlights = this.extractHighlights(profile);
      
      // Create concise summary
      const summary = this.composeSummary(highlights, profile);
      
      // Update profile with summary
      profile.setNarrativeSummary(summary);
      await this.repository.updateProfile(profile);
      
      return summary;
    } catch (error) {
      this.logger.error('Failed to generate profile summary', { error, profileId });
      throw error;
    }
  }

  // Story Arc Generation

  public async generateStoryArc(
    experience: Experience,
    theme: string
  ): Promise<StoryArc> {
    const arc: StoryArc = {
      setup: '',
      challenge: '',
      action: '',
      result: '',
      learning: ''
    };

    // Extract components from experience
    const components = this.extractExperienceComponents(experience);

    // Build story arc based on theme
    switch (theme) {
      case 'leadership':
        arc.setup = `When I took on the role of ${experience.title} at ${experience.organization}, I inherited a team facing ${components.challenge || 'significant challenges'}.`;
        arc.challenge = components.challenges[0] || 'The need to unite and motivate the team';
        arc.action = `I ${components.actions.join(', ')} to address these challenges.`;
        arc.result = components.achievements[0] || 'Successfully transformed the team dynamics';
        arc.learning = `This experience taught me that ${components.leadership || 'true leadership comes from empowering others'}.`;
        break;

      case 'problem_solving':
        arc.setup = `During my time as ${experience.title}, I encountered ${components.challenge || 'a complex problem'} that required innovative thinking.`;
        arc.challenge = `The main obstacle was ${components.technical || 'finding a solution that worked within constraints'}.`;
        arc.action = `I approached this by ${components.methodology || 'breaking down the problem and experimenting with solutions'}.`;
        arc.result = `This resulted in ${components.impact || 'a successful resolution that benefited many'}.`;
        arc.learning = `I learned that ${components.analytical || 'systematic problem-solving combined with creativity yields the best results'}.`;
        break;

      case 'growth':
        arc.setup = `When I started as ${experience.title}, I ${components.startingPoint || 'had limited experience in this area'}.`;
        arc.challenge = `The learning curve was steep, particularly with ${components.skillGaps || 'technical aspects'}.`;
        arc.action = `I dedicated myself to ${components.learningProcess || 'continuous learning and seeking mentorship'}.`;
        arc.result = `Over ${experience.calculateDuration()} months, I ${components.growth || 'became proficient and took on leadership responsibilities'}.`;
        arc.learning = `This journey showed me that ${components.growthMindset || 'persistence and curiosity can overcome any skill gap'}.`;
        break;

      default:
        // Generic story arc
        arc.setup = `My experience as ${experience.title} at ${experience.organization} began when...`;
        arc.challenge = experience.challenges[0] || 'I faced the challenge of...';
        arc.action = `I ${experience.responsibilities[0] || 'took action by...'}`;
        arc.result = experience.achievements[0] || 'This resulted in...';
        arc.learning = experience.lessonsLearned[0] || 'Through this, I learned...';
    }

    return arc;
  }

  // Theme-Based Narrative

  public async createThemedNarrative(
    profile: UserProfile,
    theme: 'overcoming_challenges' | 'leadership' | 'innovation' | 'service' | 'growth'
  ): Promise<string> {
    const themeConfig = this.narrativeThemes.get(theme);
    if (!themeConfig) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    // Find relevant experiences and achievements
    const relevantExperiences = await this.findThemeRelevantExperiences(profile, theme);
    const relevantAchievements = await this.findThemeRelevantAchievements(profile, theme);

    // Select the best story
    const primaryStory = this.selectBestStory(relevantExperiences, relevantAchievements, theme);

    // Build narrative components
    const components: NarrativeComponents = {
      hook: this.createHook(primaryStory, theme),
      context: this.createContext(profile, primaryStory),
      journey: this.createJourney(relevantExperiences, theme),
      impact: this.createImpact(relevantAchievements, profile),
      future: this.createFutureConnection(profile, theme)
    };

    // Compose final narrative
    return this.composeThemedNarrative(components, themeConfig);
  }

  // Multi-Audience Adaptation

  public async adaptNarrativeForAudience(
    baseNarrative: string,
    fromAudience: string,
    toAudience: string
  ): Promise<string> {
    const audienceProfile = this.audienceProfiles.get(toAudience);
    if (!audienceProfile) {
      return baseNarrative;
    }

    // Analyze base narrative
    const analysis = this.analyzeNarrative(baseNarrative);

    // Apply audience-specific transformations
    let adapted = baseNarrative;

    // Adjust tone
    adapted = this.adjustTone(adapted, audienceProfile.tone);

    // Adjust vocabulary
    adapted = this.adjustVocabulary(adapted, audienceProfile.vocabularyLevel);

    // Adjust focus
    adapted = this.adjustFocus(adapted, analysis, audienceProfile.priorities);

    // Adjust length
    adapted = this.adjustLength(adapted, audienceProfile.preferredLength);

    return adapted;
  }

  // Private Helper Methods

  private async loadCompleteProfile(profileId: string): Promise<UserProfile> {
    const profile = await this.repository.getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Load all related data
    const [experiences, achievements] = await Promise.all([
      this.repository.getExperiences(profileId),
      this.repository.getAchievements(profileId)
    ]);

    profile.experiences = experiences;
    profile.achievements = achievements;

    return profile;
  }

  private validateProfileForNarrative(profile: UserProfile, audience: string): void {
    const requirements: Record<string, string[]> = {
      college_admissions: ['academicRecord', 'experiences', 'goals'],
      scholarship: ['academicRecord', 'achievements', 'financialNeed'],
      employer: ['experiences', 'skills', 'careerGoals'],
      general: ['experiences']
    };

    const required = requirements[audience] || [];
    const missing: string[] = [];

    if (required.includes('academicRecord') && !profile.academicRecord) {
      missing.push('Academic record');
    }
    if (required.includes('experiences') && profile.experiences.length === 0) {
      missing.push('Experiences');
    }
    if (required.includes('achievements') && profile.achievements.length === 0) {
      missing.push('Achievements');
    }

    if (missing.length > 0) {
      throw new ProfileIncompleteError(
        profile.id,
        missing,
        `${audience} narrative`
      );
    }
  }

  private async extractStoryElements(
    profile: UserProfile,
    themes: string[]
  ): Promise<any> {
    const elements = {
      challenges: [],
      growth: [],
      impact: [],
      uniqueAspects: [],
      connections: []
    };

    // Extract from experiences
    for (const experience of profile.experiences) {
      if (experience.challenges.length > 0) {
        elements.challenges.push({
          source: experience,
          challenges: experience.challenges,
          howOvercome: experience.achievements
        });
      }

      if (experience.skillsDemonstrated.length > 0) {
        elements.growth.push({
          source: experience,
          skills: experience.skillsDemonstrated,
          progression: this.analyzeSkillProgression(experience)
        });
      }

      if (experience.metrics.peopleImpacted) {
        elements.impact.push({
          source: experience,
          impact: experience.metrics,
          significance: experience.calculateImpactScore()
        });
      }
    }

    // Extract from achievements
    for (const achievement of profile.achievements) {
      if (achievement.isUnderrecognized) {
        elements.uniqueAspects.push({
          source: achievement,
          why: achievement.context.significance,
          value: achievement.prestigeScore
        });
      }
    }

    // Find connections between elements
    elements.connections = this.findThematicConnections(elements, themes);

    return elements;
  }

  private createNarrativeStructure(
    elements: any,
    audience: string,
    length: string,
    tone: string
  ): any {
    const structure = {
      opening: this.selectOpening(elements, audience, tone),
      body: this.structureBody(elements, length),
      conclusion: this.createConclusion(elements, audience),
      transitions: this.generateTransitions(length),
      wordCount: this.calculateWordCount(length)
    };

    return structure;
  }

  private async composeNarrative(structure: any, profile: UserProfile): Promise<string> {
    let narrative = '';

    // Opening
    narrative += structure.opening + '\n\n';

    // Body paragraphs
    for (let i = 0; i < structure.body.length; i++) {
      const paragraph = structure.body[i];
      
      if (i > 0) {
        narrative += structure.transitions[i - 1] + ' ';
      }

      narrative += this.composeParagraph(paragraph, profile) + '\n\n';
    }

    // Conclusion
    narrative += structure.conclusion;

    // Polish and refine
    narrative = this.polishNarrative(narrative, structure.wordCount);

    return narrative;
  }

  private async generateAlternatives(
    structure: any,
    profile: UserProfile,
    audience: string,
    count: number
  ): Promise<string[]> {
    const alternatives: string[] = [];

    for (let i = 0; i < count; i++) {
      // Vary the structure
      const variedStructure = this.varyStructure(structure, i);
      
      // Generate alternative
      const alternative = await this.composeNarrative(variedStructure, profile);
      
      alternatives.push(alternative);
    }

    return alternatives;
  }

  private extractHighlights(profile: UserProfile): any {
    return {
      academic: profile.academicRecord?.getAcademicStrength(),
      topExperiences: profile.experiences
        .sort((a, b) => b.calculateCommitmentScore() - a.calculateCommitmentScore())
        .slice(0, 3),
      topAchievements: Achievement.rankAchievements(profile.achievements).slice(0, 3),
      uniqueStrengths: profile.hiddenStrengths,
      impactMetrics: this.aggregateImpactMetrics(profile)
    };
  }

  private composeSummary(highlights: any, profile: UserProfile): string {
    const parts: string[] = [];

    // Opening
    parts.push(`${this.getProfileDescriptor(profile)} with a proven track record in ${this.getTopStrengths(profile).join(' and ')}.`);

    // Academic strength (if applicable)
    if (highlights.academic && highlights.academic.overall > 0.7) {
      parts.push(`Strong academic foundation with ${this.describeAcademicStrength(highlights.academic)}.`);
    }

    // Experience highlights
    if (highlights.topExperiences.length > 0) {
      const experienceDesc = highlights.topExperiences
        .map(exp => `${exp.title} at ${exp.organization}`)
        .join(', ');
      parts.push(`Key experiences include ${experienceDesc}.`);
    }

    // Impact statement
    if (highlights.impactMetrics.totalPeopleImpacted > 0) {
      parts.push(`Made a positive impact on ${highlights.impactMetrics.totalPeopleImpacted}+ people through various initiatives.`);
    }

    // Unique value
    if (profile.hiddenStrengths.length > 0) {
      parts.push(`Brings unique strengths in ${profile.hiddenStrengths.slice(0, 2).join(' and ')}.`);
    }

    // Future orientation
    parts.push(`Seeking opportunities to ${this.getFutureGoal(profile)}.`);

    return parts.join(' ');
  }

  private extractExperienceComponents(experience: Experience): any {
    return {
      challenge: experience.challenges[0],
      actions: experience.responsibilities,
      achievements: experience.achievements,
      impact: experience.metrics,
      leadership: experience.leadershipExamples[0],
      technical: experience.toolsUsed.join(', '),
      growth: experience.lessonsLearned[0]
    };
  }

  private createHook(story: any, theme: string): string {
    const hooks: Record<string, string[]> = {
      overcoming_challenges: [
        'The moment I realized failure was my greatest teacher',
        'When everything seemed impossible, I discovered',
        'The obstacle that changed my perspective forever'
      ],
      leadership: [
        'Leadership isn\'t about being in charge—it\'s about taking care of those in your charge',
        'I learned to lead by learning to listen',
        'The day I stopped managing and started inspiring'
      ],
      innovation: [
        'What if we tried it differently?',
        'The best solutions come from questioning everything',
        'Innovation begins where conventional thinking ends'
      ],
      service: [
        'Service taught me that small actions create lasting change',
        'I discovered my purpose in serving others',
        'The ripple effect of one act of kindness'
      ],
      growth: [
        'Every expert was once a beginner',
        'The journey from "I can\'t" to "I did"',
        'Growth happens outside the comfort zone'
      ]
    };

    const themeHooks = hooks[theme] || ['My story begins with...'];
    return themeHooks[Math.floor(Math.random() * themeHooks.length)];
  }

  private suggestApplications(
    audience: string,
    themes: string[],
    profile: UserProfile
  ): string[] {
    const suggestions: string[] = [];

    switch (audience) {
      case 'college_admissions':
        suggestions.push('Common App Personal Statement');
        if (themes.includes('leadership')) {
          suggestions.push('Leadership supplemental essays');
        }
        if (themes.includes('service')) {
          suggestions.push('Community service essays');
        }
        break;

      case 'scholarship':
        if (profile.demographics.firstGenerationStudent) {
          suggestions.push('First-generation scholarship essays');
        }
        if (themes.includes('overcoming_challenges')) {
          suggestions.push('Adversity scholarship applications');
        }
        if (profile.constraints.needsFinancialAid) {
          suggestions.push('Need-based scholarship essays');
        }
        break;

      case 'employer':
        suggestions.push('Cover letter introduction');
        suggestions.push('LinkedIn About section');
        suggestions.push('Interview "Tell me about yourself" response');
        break;
    }

    return suggestions;
  }

  private initializeThemes(): Map<string, NarrativeTheme> {
    const themes = new Map<string, NarrativeTheme>();

    themes.set('overcoming_challenges', {
      name: 'Overcoming Challenges',
      keywords: ['obstacle', 'challenge', 'overcome', 'persevere', 'resilient'],
      structure: ['challenge_intro', 'context', 'action', 'result', 'growth'],
      tone: 'inspirational'
    });

    themes.set('leadership', {
      name: 'Leadership',
      keywords: ['lead', 'inspire', 'guide', 'organize', 'influence'],
      structure: ['leadership_philosophy', 'example', 'impact', 'learning'],
      tone: 'confident'
    });

    themes.set('innovation', {
      name: 'Innovation',
      keywords: ['create', 'innovate', 'design', 'solve', 'improve'],
      structure: ['problem', 'ideation', 'implementation', 'impact'],
      tone: 'creative'
    });

    themes.set('service', {
      name: 'Service',
      keywords: ['serve', 'help', 'volunteer', 'community', 'impact'],
      structure: ['motivation', 'action', 'impact', 'reflection'],
      tone: 'compassionate'
    });

    themes.set('growth', {
      name: 'Personal Growth',
      keywords: ['learn', 'grow', 'develop', 'improve', 'evolve'],
      structure: ['starting_point', 'catalyst', 'journey', 'transformation'],
      tone: 'reflective'
    });

    return themes;
  }

  private initializeAudienceProfiles(): Map<string, any> {
    const profiles = new Map();

    profiles.set('college_admissions', {
      tone: 'personal',
      vocabularyLevel: 'advanced',
      priorities: ['character', 'potential', 'fit'],
      preferredLength: 650,
      keyQualities: ['intellectual_curiosity', 'leadership', 'impact', 'growth']
    });

    profiles.set('scholarship', {
      tone: 'compelling',
      vocabularyLevel: 'accessible',
      priorities: ['need', 'merit', 'impact', 'goals'],
      preferredLength: 500,
      keyQualities: ['determination', 'achievement', 'financial_need', 'future_impact']
    });

    profiles.set('employer', {
      tone: 'professional',
      vocabularyLevel: 'business',
      priorities: ['skills', 'experience', 'results', 'fit'],
      preferredLength: 300,
      keyQualities: ['competence', 'reliability', 'innovation', 'teamwork']
    });

    return profiles;
  }

  // Additional helper methods...

  private analyzeSkillProgression(experience: Experience): string {
    const duration = experience.calculateDuration();
    const skillCount = experience.skillsDemonstrated.length;
    
    if (duration > 12 && skillCount > 5) {
      return 'advanced mastery through sustained practice';
    } else if (skillCount > 3) {
      return 'rapid skill acquisition and application';
    } else {
      return 'focused skill development';
    }
  }

  private findThematicConnections(elements: any, themes: string[]): any[] {
    // Implementation would find connections between different experiences/achievements
    // that reinforce the chosen themes
    return [];
  }

  private selectOpening(elements: any, audience: string, tone: string): string {
    // Implementation would select appropriate opening based on elements and audience
    return 'Opening paragraph...';
  }

  private structureBody(elements: any, length: string): any[] {
    // Implementation would structure body paragraphs based on length constraints
    return [];
  }

  private createConclusion(elements: any, audience: string): string {
    // Implementation would create appropriate conclusion
    return 'Conclusion paragraph...';
  }

  private generateTransitions(length: string): string[] {
    // Implementation would generate appropriate transitions
    return ['Furthermore', 'Additionally', 'Moreover'];
  }

  private calculateWordCount(length: string): number {
    const counts: Record<string, number> = {
      elevator: 50,
      short: 150,
      medium: 350,
      full: 650
    };
    return counts[length] || 350;
  }

  private composeParagraph(paragraph: any, profile: UserProfile): string {
    // Implementation would compose individual paragraph
    return 'Paragraph content...';
  }

  private polishNarrative(narrative: string, targetWordCount: number): string {
    // Implementation would polish and adjust narrative to target length
    return narrative;
  }

  private varyStructure(structure: any, variation: number): any {
    // Implementation would create structural variations
    return { ...structure };
  }

  private aggregateImpactMetrics(profile: UserProfile): any {
    let totalPeopleImpacted = 0;
    let totalMoneyRaised = 0;

    profile.experiences.forEach(exp => {
      if (exp.metrics.peopleImpacted?.value) {
        totalPeopleImpacted += exp.metrics.peopleImpacted.value as number;
      }
      if (exp.metrics.moneyRaised?.value) {
        totalMoneyRaised += exp.metrics.moneyRaised.value as number;
      }
    });

    return { totalPeopleImpacted, totalMoneyRaised };
  }

  private getProfileDescriptor(profile: UserProfile): string {
    const descriptors: Record<string, string> = {
      high_school_9th: 'Ambitious ninth-grade student',
      high_school_10th: 'Dedicated tenth-grade student',
      high_school_11th: 'Accomplished junior',
      high_school_12th: 'Graduating senior',
      college_freshman: 'First-year college student',
      college_sophomore: 'Second-year college student',
      college_junior: 'Third-year college student',
      college_senior: 'Graduating college senior'
    };

    return descriptors[profile.userContext] || 'Motivated individual';
  }

  private getTopStrengths(profile: UserProfile): string[] {
    const strengths: string[] = [];
    
    // Get top 3 skills by confidence
    const topSkills = Array.from(profile.extractedSkills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill.replace(/_/g, ' '));

    return topSkills.length > 0 ? topSkills : ['leadership', 'innovation', 'dedication'];
  }

  private describeAcademicStrength(strength: any): string {
    if (strength.overall > 0.9) {
      return 'exceptional academic excellence';
    } else if (strength.overall > 0.8) {
      return 'strong academic performance';
    } else if (strength.overall > 0.7) {
      return 'solid academic foundation';
    } else {
      return 'growing academic achievement';
    }
  }

  private getFutureGoal(profile: UserProfile): string {
    const goalMap: Record<string, string> = {
      college_admission: 'pursue higher education and make a meaningful impact',
      career_prep: 'launch a successful career in my field of interest',
      skill_development: 'continue growing and mastering new capabilities',
      exploring_options: 'discover my passion and purpose'
    };

    return goalMap[profile.goals.primaryGoal] || 'achieve my goals';
  }

  private analyzeNarrative(narrative: string): any {
    // Simple analysis - would be more sophisticated in production
    return {
      wordCount: narrative.split(' ').length,
      sentenceCount: narrative.split(/[.!?]/).length,
      tone: 'personal',
      themes: []
    };
  }

  private adjustTone(narrative: string, targetTone: string): string {
    // Implementation would adjust tone
    return narrative;
  }

  private adjustVocabulary(narrative: string, level: string): string {
    // Implementation would adjust vocabulary complexity
    return narrative;
  }

  private adjustFocus(narrative: string, analysis: any, priorities: string[]): string {
    // Implementation would adjust focus based on priorities
    return narrative;
  }

  private adjustLength(narrative: string, targetLength: number): string {
    // Implementation would adjust length
    return narrative;
  }

  private async findThemeRelevantExperiences(
    profile: UserProfile,
    theme: string
  ): Promise<Experience[]> {
    const themeKeywords = this.narrativeThemes.get(theme)?.keywords || [];
    
    return profile.experiences.filter(exp => {
      const text = `${exp.description} ${exp.achievements.join(' ')} ${exp.challenges.join(' ')}`.toLowerCase();
      return themeKeywords.some(keyword => text.includes(keyword));
    });
  }

  private async findThemeRelevantAchievements(
    profile: UserProfile,
    theme: string
  ): Promise<Achievement[]> {
    const themeKeywords = this.narrativeThemes.get(theme)?.keywords || [];
    
    return profile.achievements.filter(ach => {
      const text = `${ach.description} ${ach.context.significance}`.toLowerCase();
      return themeKeywords.some(keyword => text.includes(keyword));
    });
  }

  private selectBestStory(
    experiences: Experience[],
    achievements: Achievement[],
    theme: string
  ): any {
    // Select the most impactful story for the theme
    let bestStory: any = null;
    let bestScore = 0;

    experiences.forEach(exp => {
      const score = exp.calculateCommitmentScore() * (exp.narrativeSummary ? 1.2 : 1);
      if (score > bestScore) {
        bestScore = score;
        bestStory = { type: 'experience', data: exp };
      }
    });

    achievements.forEach(ach => {
      const score = ach.calculatePrestigeScore() * (ach.isUnderrecognized ? 1.3 : 1);
      if (score > bestScore) {
        bestScore = score;
        bestStory = { type: 'achievement', data: ach };
      }
    });

    return bestStory;
  }

  private createContext(profile: UserProfile, story: any): string {
    // Create context based on profile and story
    return `As a ${this.getProfileDescriptor(profile)}, I have...`;
  }

  private createJourney(experiences: Experience[], theme: string): string[] {
    // Create journey narrative from experiences
    return experiences.map(exp => `Through ${exp.title}, I...`);
  }

  private createImpact(achievements: Achievement[], profile: UserProfile): string {
    // Create impact statement from achievements
    const totalImpact = this.aggregateImpactMetrics(profile);
    return `My efforts have impacted ${totalImpact.totalPeopleImpacted} people...`;
  }

  private createFutureConnection(profile: UserProfile, theme: string): string {
    // Connect narrative to future goals
    return `Looking forward, I aim to ${this.getFutureGoal(profile)}...`;
  }

  private composeThemedNarrative(
    components: NarrativeComponents,
    themeConfig: NarrativeTheme
  ): string {
    // Compose narrative from components
    return [
      components.hook,
      components.context,
      ...components.journey,
      components.impact,
      components.future
    ].join('\n\n');
  }
}

export default NarrativeGenerationService;