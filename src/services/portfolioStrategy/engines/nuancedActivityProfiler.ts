/**
 * Nuanced Activity Profiler Engine
 *
 * Professional-grade activity analysis that understands the subtleties and context
 * that elite admissions counselors use when evaluating extracurricular profiles.
 *
 * This engine provides:
 * 1. Field-specific analysis calibrated to intended major expectations
 * 2. Description quality analysis with specific coaching feedback
 * 3. Time commitment credibility and efficiency assessment
 * 4. Activity interconnection and narrative coherence detection
 * 5. Deep major-activity alignment with gap identification
 * 6. Authenticity signal detection
 *
 * @module nuancedActivityProfiler
 */

import {
  NuancedProfilingInput,
  NuancedActivityProfile,
  DescriptionQualityAnalysis,
  TimeCommitmentAnalysis,
  MajorAlignmentAnalysis,
  AuthenticityAnalysis,
  PortfolioInterconnectionAnalysis,
  ActivityInterconnection,
  FieldExpectations,
} from '../types/nuancedProfiling';
import {
  ActivityTier,
  ActivityCategory,
  RecognitionLevel,
} from '../types/activities';
import {
  MajorCategory,
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,
} from '../knowledge/majorActivityAlignment';
import {
  getFieldExpectations,
  normalizeMajor,
} from '../knowledge/fieldSpecificExpectations';

// ============================================================================
// TIME COMMITMENT BENCHMARKS BY CATEGORY
// ============================================================================

const CATEGORY_TIME_BENCHMARKS: Record<string, { minHours: number; maxHours: number; typicalWeeks: number }> = {
  academic_competition: { minHours: 3, maxHours: 15, typicalWeeks: 36 },
  research: { minHours: 5, maxHours: 20, typicalWeeks: 40 },
  stem_project: { minHours: 3, maxHours: 15, typicalWeeks: 40 },
  arts_performance: { minHours: 5, maxHours: 25, typicalWeeks: 45 },
  arts_visual: { minHours: 3, maxHours: 15, typicalWeeks: 45 },
  arts_literary: { minHours: 2, maxHours: 10, typicalWeeks: 40 },
  athletics: { minHours: 8, maxHours: 25, typicalWeeks: 30 },
  community_service: { minHours: 2, maxHours: 10, typicalWeeks: 45 },
  leadership_governance: { minHours: 3, maxHours: 12, typicalWeeks: 36 },
  entrepreneurship: { minHours: 5, maxHours: 25, typicalWeeks: 50 },
  work_experience: { minHours: 10, maxHours: 30, typicalWeeks: 50 },
  family_responsibilities: { minHours: 5, maxHours: 30, typicalWeeks: 52 },
  internship: { minHours: 20, maxHours: 40, typicalWeeks: 10 },
  summer_program: { minHours: 30, maxHours: 50, typicalWeeks: 6 },
  default: { minHours: 3, maxHours: 15, typicalWeeks: 36 },
};

// ============================================================================
// DESCRIPTION QUALITY PATTERNS
// ============================================================================

const STRONG_ACTION_VERBS = new Set([
  'led', 'founded', 'created', 'developed', 'designed', 'built', 'launched',
  'organized', 'managed', 'directed', 'coordinated', 'implemented', 'established',
  'initiated', 'pioneered', 'spearheaded', 'engineered', 'architected', 'authored',
  'published', 'presented', 'competed', 'won', 'achieved', 'earned', 'raised',
  'grew', 'expanded', 'scaled', 'transformed', 'revitalized', 'modernized',
]);

const WEAK_ACTION_VERBS = new Set([
  'helped', 'assisted', 'participated', 'worked', 'contributed', 'supported',
  'attended', 'learned', 'studied', 'observed', 'watched', 'followed',
]);

const VAGUE_TERMS = new Set([
  'various', 'multiple', 'many', 'several', 'some', 'different', 'lots',
  'stuff', 'things', 'etc', 'activities', 'responsibilities',
]);

const INFLATED_TERMS = new Set([
  'passionate', 'dedicated', 'committed', 'love', 'always wanted',
  'dream', 'lifetime', 'changed my life', 'inspired',
]);

// ============================================================================
// NUANCED ACTIVITY PROFILER CLASS
// ============================================================================

export class NuancedActivityProfiler {
  /**
   * Main entry point for nuanced activity profiling
   */
  async analyzeProfile(input: NuancedProfilingInput): Promise<NuancedActivityProfile> {
    const startTime = Date.now();

    // Normalize major
    const majorCategory = normalizeMajor(input.studentContext.intendedMajor);
    const fieldExpectations = getFieldExpectations(majorCategory);

    // Analyze each activity individually
    const activityProfiles = await Promise.all(
      input.activities.map(activity => this.analyzeActivity(activity, majorCategory, fieldExpectations, input))
    );

    // Portfolio-level analysis
    const majorAlignment = this.analyzeMajorAlignment(activityProfiles, majorCategory, fieldExpectations, input);
    const interconnections = this.analyzeInterconnections(activityProfiles, input);
    const totalTimeCredibility = this.analyzePortfolioTimeCredibility(activityProfiles, input);
    const narrativeStrength = this.analyzeNarrativeStrength(activityProfiles, interconnections, majorAlignment);

    // Field-specific assessment
    const fieldSpecificAssessment = this.assessAgainstFieldExpectations(activityProfiles, fieldExpectations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      activityProfiles,
      majorAlignment,
      interconnections,
      fieldSpecificAssessment,
      input
    );

    return {
      evaluatedAt: new Date().toISOString(),
      version: '2.0.0',

      studentContext: {
        intendedMajor: majorCategory,
        majorCertainty: input.studentContext.majorCertainty || 'likely',
        gradeLevel: input.studentContext.gradeLevel,
        constraints: this.extractConstraints(input.studentContext),
      },

      activityProfiles: activityProfiles.map(p => ({
        activityId: p.activityId,
        activityName: p.activityName,
        tier: p.tier,
        tierConfidence: p.tierConfidence,
        descriptionQuality: p.descriptionQuality,
        timeCommitment: p.timeCommitment,
        authenticity: p.authenticity,
        majorAlignment: {
          score: p.majorAlignmentScore,
          type: p.majorAlignmentType,
        },
        overallStrength: p.overallStrength,
        strategicValue: p.strategicValue,
        narrativeContribution: p.narrativeContribution,
        priorityImprovements: p.priorityImprovements,
      })),

      portfolioAnalysis: {
        majorAlignment,
        interconnections,
        totalTimeCredibility,
        narrativeStrength,
      },

      fieldSpecificAssessment,
      recommendations,

      analysisConfidence: {
        overallConfidence: this.calculateOverallConfidence(activityProfiles, input),
        caveats: this.identifyCaveats(activityProfiles, input),
        areasNeedingMoreInfo: this.identifyInfoGaps(activityProfiles, input),
      },
    };
  }

  /**
   * Analyze a single activity in depth
   */
  private async analyzeActivity(
    activity: NuancedProfilingInput['activities'][0],
    majorCategory: MajorCategory,
    fieldExpectations: FieldExpectations,
    input: NuancedProfilingInput
  ): Promise<ActivityAnalysisResult> {
    // Description quality analysis
    const descriptionQuality = this.analyzeDescriptionQuality(
      activity,
      majorCategory,
      fieldExpectations
    );

    // Time commitment analysis
    const timeCommitment = this.analyzeTimeCommitment(activity, input.activities);

    // Authenticity analysis
    const authenticity = this.analyzeAuthenticity(activity, input);

    // Major alignment
    const { score: majorAlignmentScore, type: majorAlignmentType } = this.calculateMajorAlignment(
      activity,
      majorCategory
    );

    // Calculate tier
    const tier = this.calculateActivityTier(
      activity,
      descriptionQuality,
      timeCommitment,
      majorCategory
    );

    // Overall assessment
    const overallStrength = this.assessOverallStrength(
      tier,
      descriptionQuality,
      timeCommitment,
      authenticity,
      majorAlignmentScore
    );

    const strategicValue = this.calculateStrategicValue(
      tier,
      majorAlignmentScore,
      descriptionQuality.overallScore,
      authenticity.overallScore
    );

    const narrativeContribution = this.determineNarrativeContribution(
      activity,
      majorCategory,
      majorAlignmentType
    );

    const priorityImprovements = this.identifyPriorityImprovements(
      descriptionQuality,
      timeCommitment,
      tier,
      majorAlignmentScore
    );

    return {
      activityId: activity.id,
      activityName: activity.name,
      tier,
      tierConfidence: this.calculateTierConfidence(activity, tier),
      descriptionQuality,
      timeCommitment,
      authenticity,
      majorAlignmentScore,
      majorAlignmentType,
      overallStrength,
      strategicValue,
      narrativeContribution,
      priorityImprovements,
    };
  }

  // ============================================================================
  // DESCRIPTION QUALITY ANALYSIS
  // ============================================================================

  private analyzeDescriptionQuality(
    activity: NuancedProfilingInput['activities'][0],
    majorCategory: MajorCategory,
    fieldExpectations: FieldExpectations
  ): DescriptionQualityAnalysis {
    const description = activity.description || '';
    const words = description.toLowerCase().split(/\s+/);

    // Specificity analysis
    const specificity = this.analyzeSpecificity(description);

    // Impact clarity
    const impactClarity = this.analyzeImpactClarity(description);

    // Quantification
    const quantification = this.analyzeQuantification(description);

    // Action verbs
    const actionVerbs = this.analyzeActionVerbs(description);

    // Uniqueness
    const uniqueness = this.analyzeUniqueness(description, activity.category);

    // Field alignment
    const fieldAlignment = this.analyzeFieldAlignment(description, fieldExpectations);

    // Detect issues
    const issues = this.detectDescriptionIssues(description, activity);

    // Calculate overall score
    const overallScore = Math.round(
      specificity.score * 0.2 +
      impactClarity.score * 0.25 +
      quantification.score * 0.2 +
      actionVerbs.score * 0.15 +
      uniqueness.score * 0.1 +
      fieldAlignment.score * 0.1
    );

    const qualityLevel = this.getQualityLevel(overallScore);

    // Generate coaching feedback
    const coaching = this.generateDescriptionCoaching(
      description,
      activity,
      { specificity, impactClarity, quantification, actionVerbs, uniqueness, fieldAlignment },
      issues,
      fieldExpectations
    );

    // Generate optimized description
    const suggestedDescription = this.generateOptimizedDescription(
      activity,
      fieldExpectations,
      { specificity, impactClarity, quantification, actionVerbs }
    );

    return {
      activityId: activity.id,
      originalDescription: description,
      overallScore,
      qualityLevel,
      dimensions: {
        specificity,
        impactClarity,
        quantification,
        actionVerbs,
        uniqueness,
        fieldAlignment,
      },
      issues,
      coaching,
      suggestedDescription,
    };
  }

  private analyzeSpecificity(description: string): { score: number; evidence: string[]; issues: string[] } {
    const evidence: string[] = [];
    const issues: string[] = [];
    let score = 50; // Base score

    // Check for specific numbers
    const numberMatches = description.match(/\d+/g);
    if (numberMatches && numberMatches.length >= 2) {
      score += 20;
      evidence.push(`Contains ${numberMatches.length} specific numbers`);
    } else if (!numberMatches) {
      score -= 20;
      issues.push('No specific numbers or quantities');
    }

    // Check for specific names/organizations
    const properNouns = description.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (properNouns && properNouns.length >= 2) {
      score += 15;
      evidence.push('Contains specific names/organizations');
    }

    // Check for concrete details
    const concreteTerms = ['hours', 'weeks', 'months', 'years', 'dollars', '$', 'members', 'students', 'people'];
    const foundConcrete = concreteTerms.filter(t => description.toLowerCase().includes(t));
    if (foundConcrete.length >= 2) {
      score += 15;
      evidence.push(`Concrete terms: ${foundConcrete.join(', ')}`);
    }

    // Check for vague terms
    const words = description.toLowerCase().split(/\s+/);
    const vagueFound = words.filter(w => VAGUE_TERMS.has(w));
    if (vagueFound.length > 0) {
      score -= vagueFound.length * 10;
      issues.push(`Vague terms used: ${vagueFound.join(', ')}`);
    }

    return { score: Math.max(0, Math.min(100, score)), evidence, issues };
  }

  private analyzeImpactClarity(description: string): { score: number; evidence: string[]; issues: string[] } {
    const evidence: string[] = [];
    const issues: string[] = [];
    let score = 50;

    // Look for impact indicators
    const impactPatterns = [
      /(?:raised|generated|earned)\s*\$[\d,]+/i,
      /(?:served|helped|taught|mentored|reached)\s*\d+/i,
      /(?:increased|improved|reduced|grew)\s*(?:by\s*)?\d+/i,
      /(?:won|placed|ranked|selected)/i,
      /(?:published|presented|featured)/i,
      /(?:created|built|developed|launched|founded)\s+(?:a|an|the)?\s*\w+/i,
    ];

    const foundPatterns = impactPatterns.filter(p => p.test(description));
    if (foundPatterns.length >= 2) {
      score += 30;
      evidence.push('Multiple clear impact indicators');
    } else if (foundPatterns.length === 1) {
      score += 15;
      evidence.push('Contains impact indicator');
    } else {
      score -= 20;
      issues.push('No clear impact demonstrated');
    }

    // Check for outcome language
    const outcomeWords = ['resulting in', 'leading to', 'which', 'enabling', 'achieving'];
    if (outcomeWords.some(w => description.toLowerCase().includes(w))) {
      score += 10;
      evidence.push('Uses outcome-focused language');
    }

    // Penalize inflated language without substance
    const words = description.toLowerCase().split(/\s+/);
    const inflatedFound = words.filter(w => INFLATED_TERMS.has(w));
    if (inflatedFound.length > 0 && foundPatterns.length === 0) {
      score -= 15;
      issues.push('Emotional language without concrete impact');
    }

    return { score: Math.max(0, Math.min(100, score)), evidence, issues };
  }

  private analyzeQuantification(description: string): { score: number; metricsFound: string[]; missingMetrics: string[] } {
    const metricsFound: string[] = [];
    const missingMetrics: string[] = [];
    let score = 50;

    // Pattern matching for quantified achievements
    const quantPatterns = {
      money: /\$[\d,]+(?:k|K|m|M)?|\d+(?:,\d+)*\s*(?:dollars?|USD)/i,
      people: /\d+\s*(?:students?|people|members?|participants?|attendees?|users?|customers?)/i,
      time: /\d+\s*(?:hours?|weeks?|months?|years?)/i,
      percentage: /\d+(?:\.\d+)?%/,
      ranking: /(?:top|ranked?|placed?)\s*#?\d+|(?:first|second|third|\d+(?:st|nd|rd|th))\s+(?:place|out of)/i,
      scale: /\d+(?:,\d+)*\s*(?:views?|downloads?|followers?|subscribers?)/i,
    };

    for (const [type, pattern] of Object.entries(quantPatterns)) {
      const match = description.match(pattern);
      if (match) {
        metricsFound.push(`${type}: ${match[0]}`);
        score += 10;
      }
    }

    // Identify likely missing metrics based on activity type
    if (!quantPatterns.people.test(description)) {
      missingMetrics.push('Number of people impacted');
    }
    if (!quantPatterns.time.test(description) && !quantPatterns.ranking.test(description)) {
      missingMetrics.push('Duration or ranking');
    }

    if (metricsFound.length >= 3) {
      score = Math.min(100, score + 15);
    } else if (metricsFound.length === 0) {
      score = Math.max(0, score - 30);
    }

    return { score, metricsFound, missingMetrics };
  }

  private analyzeActionVerbs(description: string): { score: number; strongVerbs: string[]; weakVerbs: string[] } {
    const words = description.toLowerCase().split(/\s+/);
    const strongVerbs: string[] = [];
    const weakVerbs: string[] = [];

    for (const word of words) {
      const baseWord = word.replace(/(?:ed|ing|s)$/, '');
      if (STRONG_ACTION_VERBS.has(word) || STRONG_ACTION_VERBS.has(baseWord)) {
        strongVerbs.push(word);
      } else if (WEAK_ACTION_VERBS.has(word) || WEAK_ACTION_VERBS.has(baseWord)) {
        weakVerbs.push(word);
      }
    }

    let score = 50;
    score += strongVerbs.length * 15;
    score -= weakVerbs.length * 10;

    // Bonus for starting with strong verb
    const firstWord = words[0]?.replace(/(?:ed|ing|s)$/, '');
    if (STRONG_ACTION_VERBS.has(firstWord) || STRONG_ACTION_VERBS.has(words[0])) {
      score += 10;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      strongVerbs,
      weakVerbs,
    };
  }

  private analyzeUniqueness(description: string, category: ActivityCategory): { score: number; uniqueElements: string[]; genericElements: string[] } {
    const uniqueElements: string[] = [];
    const genericElements: string[] = [];
    let score = 50;

    // Generic descriptions by category
    const genericPhrases: Record<string, string[]> = {
      community_service: ['helped others', 'gave back', 'made a difference', 'volunteered at'],
      leadership_governance: ['led meetings', 'organized events', 'managed team'],
      athletics: ['played on team', 'practiced regularly', 'competed in games'],
      arts_performance: ['performed in concerts', 'practiced daily', 'participated in shows'],
      default: ['participated in', 'was a member of', 'helped with', 'assisted in'],
    };

    const genericForCategory = [...(genericPhrases[category] || []), ...genericPhrases.default];
    const descLower = description.toLowerCase();

    for (const phrase of genericForCategory) {
      if (descLower.includes(phrase)) {
        genericElements.push(phrase);
        score -= 10;
      }
    }

    // Look for unique elements
    const uniqueIndicators = [
      /(?:first|only|youngest|sole)\s+\w+\s+to/i,
      /(?:created|invented|pioneered|designed)\s+(?:a\s+)?(?:new|unique|original)/i,
      /(?:my|own)\s+(?:approach|method|system|technique)/i,
    ];

    for (const pattern of uniqueIndicators) {
      const match = description.match(pattern);
      if (match) {
        uniqueElements.push(match[0]);
        score += 20;
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      uniqueElements,
      genericElements,
    };
  }

  private analyzeFieldAlignment(
    description: string,
    fieldExpectations: FieldExpectations
  ): { score: number; alignedTerms: string[]; misalignedTerms: string[] } {
    const descLower = description.toLowerCase();
    const alignedTerms: string[] = [];
    const misalignedTerms: string[] = [];
    let score = 50;

    // Check for field-specific key terms
    for (const term of fieldExpectations.descriptionExpectations.keyTerms) {
      if (descLower.includes(term.toLowerCase())) {
        alignedTerms.push(term);
        score += 5;
      }
    }

    // Check for field-specific action verbs
    for (const verb of fieldExpectations.descriptionExpectations.actionVerbs) {
      if (descLower.includes(verb.toLowerCase())) {
        alignedTerms.push(verb);
        score += 3;
      }
    }

    // Check for terms to avoid
    for (const term of fieldExpectations.descriptionExpectations.avoidTerms) {
      if (descLower.includes(term.toLowerCase())) {
        misalignedTerms.push(term);
        score -= 10;
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      alignedTerms,
      misalignedTerms,
    };
  }

  private detectDescriptionIssues(
    description: string,
    activity: NuancedProfilingInput['activities'][0]
  ): DescriptionQualityAnalysis['issues'] {
    const issues: DescriptionQualityAnalysis['issues'] = [];

    // Check length
    if (description.length < 30) {
      issues.push({
        type: 'vague',
        severity: 'critical',
        location: 'entire description',
        explanation: 'Description is too short to convey meaningful information',
        fix: 'Expand with specific achievements, numbers, and outcomes',
      });
    }

    // Check for passive voice
    const passivePatterns = [
      /was (?:given|assigned|selected|chosen)/i,
      /have been/i,
      /were (?:asked|invited)/i,
    ];
    for (const pattern of passivePatterns) {
      if (pattern.test(description)) {
        issues.push({
          type: 'passive',
          severity: 'minor',
          location: 'voice',
          explanation: 'Passive voice diminishes sense of ownership',
          fix: 'Rewrite with active voice: "I led..." instead of "was asked to lead..."',
        });
        break;
      }
    }

    // Check for inflated titles without substance
    if (/(CEO|President|Founder)/i.test(activity.role)) {
      const hasSubstance = /\d+/.test(description) || /(?:raised|grew|built|launched)/i.test(description);
      if (!hasSubstance) {
        issues.push({
          type: 'inflated',
          severity: 'major',
          location: 'role vs. description',
          explanation: 'Leadership title without concrete evidence of impact',
          fix: 'Add specific achievements: revenue, users, team size, outcomes',
        });
      }
    }

    // Check for generic opening
    if (/^(?:I am|As a|Being a)/i.test(description)) {
      issues.push({
        type: 'wrong_tone',
        severity: 'minor',
        location: 'opening',
        explanation: 'Generic opening wastes precious characters',
        fix: 'Start with strongest action verb and achievement',
      });
    }

    // Check for missing impact
    const impactIndicators = /(?:\d+|raised|grew|built|won|published|presented|created)/i;
    if (!impactIndicators.test(description)) {
      issues.push({
        type: 'missing_impact',
        severity: 'major',
        location: 'content',
        explanation: 'No clear evidence of impact or achievement',
        fix: 'Add quantified outcomes: numbers served, money raised, rankings achieved',
      });
    }

    return issues;
  }

  private generateDescriptionCoaching(
    description: string,
    activity: NuancedProfilingInput['activities'][0],
    dimensions: Record<string, { score: number; evidence?: string[]; issues?: string[] }>,
    issues: DescriptionQualityAnalysis['issues'],
    fieldExpectations: FieldExpectations
  ): DescriptionQualityAnalysis['coaching'] {
    const whatWorksWell: string[] = [];
    const priorityImprovements: string[] = [];
    const specificSuggestions: { current: string; suggested: string; reason: string }[] = [];

    // Identify what works
    if (dimensions.specificity.score >= 70) {
      whatWorksWell.push('Good use of specific details and numbers');
    }
    if (dimensions.impactClarity.score >= 70) {
      whatWorksWell.push('Clear demonstration of impact');
    }
    if (dimensions.actionVerbs.score >= 70) {
      whatWorksWell.push('Strong action verbs showing ownership');
    }
    if (dimensions.quantification.score >= 70) {
      whatWorksWell.push('Well-quantified achievements');
    }

    // Identify priority improvements
    const sortedDimensions = Object.entries(dimensions)
      .sort(([, a], [, b]) => a.score - b.score);

    for (const [dim, data] of sortedDimensions.slice(0, 2)) {
      if (data.score < 60) {
        switch (dim) {
          case 'specificity':
            priorityImprovements.push('Add more specific details: exact numbers, names, timeframes');
            break;
          case 'impactClarity':
            priorityImprovements.push('Clarify the outcome: what changed because of your work?');
            break;
          case 'quantification':
            priorityImprovements.push('Quantify achievements: people helped, dollars raised, rankings earned');
            break;
          case 'actionVerbs':
            priorityImprovements.push('Use stronger action verbs: "led" instead of "helped", "created" instead of "worked on"');
            break;
          case 'uniqueness':
            priorityImprovements.push('Highlight what makes YOUR contribution unique');
            break;
          case 'fieldAlignment':
            priorityImprovements.push(`Use field-specific language: ${fieldExpectations.descriptionExpectations.keyTerms.slice(0, 3).join(', ')}`);
            break;
        }
      }
    }

    // Generate specific rewrite suggestions
    const words = description.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (WEAK_ACTION_VERBS.has(word)) {
        const strongAlternatives: Record<string, string> = {
          helped: 'supported/enabled/facilitated',
          assisted: 'coordinated/managed',
          participated: 'contributed/engaged',
          worked: 'developed/executed/delivered',
        };
        if (strongAlternatives[word]) {
          specificSuggestions.push({
            current: words[i],
            suggested: strongAlternatives[word],
            reason: 'Stronger verb shows more ownership and impact',
          });
        }
      }
    }

    // Reframing advice based on major alignment
    const reframingAdvice = this.generateReframingAdvice(activity, fieldExpectations);

    return {
      whatWorksWell,
      priorityImprovements,
      specificSuggestions,
      reframingAdvice,
    };
  }

  private generateReframingAdvice(
    activity: NuancedProfilingInput['activities'][0],
    fieldExpectations: FieldExpectations
  ): string {
    // Provide advice on how to position this activity for the intended major
    const examples = fieldExpectations.descriptionExpectations.quantificationExamples;

    return `Frame this activity using language like: "${examples[0]?.split(',')[0] || 'Led initiative achieving measurable outcome'}"`;
  }

  private generateOptimizedDescription(
    activity: NuancedProfilingInput['activities'][0],
    fieldExpectations: FieldExpectations,
    dimensions: Record<string, { score: number }>
  ): DescriptionQualityAnalysis['suggestedDescription'] {
    // This would ideally use AI to generate, but for now provide template
    const template = this.getDescriptionTemplate(activity.category, fieldExpectations);

    return {
      text: template,
      characterCount: template.length,
      improvements: [
        'Start with strongest action verb',
        'Include quantified impact',
        'Use field-appropriate terminology',
      ],
    };
  }

  private getDescriptionTemplate(category: ActivityCategory, fieldExpectations: FieldExpectations): string {
    const templates: Record<string, string> = {
      research: '[Action verb] [research topic] in [lab/setting], [outcome: publication/presentation/discovery]',
      stem_project: '[Built/Developed/Engineered] [project] using [technologies], [impact: users/adoption/recognition]',
      community_service: '[Led/Organized] [program] serving [number] [beneficiaries], resulting in [measurable outcome]',
      leadership_governance: '[Led/Founded] [initiative] of [size], achieving [specific outcome or growth metric]',
      entrepreneurship: '[Launched/Scaled] [venture] to [revenue/users], [key achievement or recognition]',
      default: '[Strong verb] [specific activity], [quantified impact], [recognition or outcome]',
    };

    return templates[category] || templates.default;
  }

  private getQualityLevel(score: number): DescriptionQualityAnalysis['qualityLevel'] {
    if (score >= 85) return 'exceptional';
    if (score >= 70) return 'strong';
    if (score >= 55) return 'adequate';
    if (score >= 40) return 'weak';
    return 'problematic';
  }

  // ============================================================================
  // TIME COMMITMENT ANALYSIS
  // ============================================================================

  private analyzeTimeCommitment(
    activity: NuancedProfilingInput['activities'][0],
    allActivities: NuancedProfilingInput['activities']
  ): TimeCommitmentAnalysis {
    const benchmark = CATEGORY_TIME_BENCHMARKS[activity.category] || CATEGORY_TIME_BENCHMARKS.default;
    const totalHours = activity.hoursPerWeek * activity.weeksPerYear * activity.yearsInvolved;
    const totalWeeklyHours = allActivities.reduce((sum, a) => sum + a.hoursPerWeek, 0);

    // Credibility assessment
    const credibility = this.assessTimeCredibility(activity, benchmark);

    // Category benchmark comparison
    const categoryBenchmark = this.compareToCategoryBenchmark(activity, benchmark);

    // Efficiency analysis
    const efficiency = this.analyzeEfficiency(activity, totalHours);

    // Progression analysis
    const progression = this.analyzeProgression(activity);

    // Realism check
    const realismCheck = this.checkRealism(activity, totalHours);

    // Portfolio context
    const portfolioContext = {
      totalWeeklyHours,
      percentageOfTotal: (activity.hoursPerWeek / totalWeeklyHours) * 100,
      isSustainable: totalWeeklyHours <= 40,
      balanceAssessment: this.assessBalance(totalWeeklyHours),
    };

    return {
      activityId: activity.id,
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      yearsInvolved: activity.yearsInvolved,
      totalHours,
      gradeLevels: activity.gradeLevels || [],
      credibility,
      categoryBenchmark,
      efficiency,
      progression,
      realismCheck,
      portfolioContext,
    };
  }

  private assessTimeCredibility(
    activity: NuancedProfilingInput['activities'][0],
    benchmark: { minHours: number; maxHours: number; typicalWeeks: number }
  ): TimeCommitmentAnalysis['credibility'] {
    const concerns: string[] = [];
    let score = 100;

    // Check hours per week
    if (activity.hoursPerWeek > 40) {
      score -= 40;
      concerns.push('Weekly hours exceed full-time job (40+ hours)');
    } else if (activity.hoursPerWeek > benchmark.maxHours * 1.5) {
      score -= 20;
      concerns.push(`Hours per week unusually high for ${activity.category}`);
    } else if (activity.hoursPerWeek > benchmark.maxHours) {
      score -= 10;
      concerns.push(`Hours per week above typical for ${activity.category}`);
    }

    // Check weeks per year
    if (activity.weeksPerYear > 52) {
      score -= 30;
      concerns.push('Weeks per year exceeds calendar year');
    } else if (activity.weeksPerYear > 50 && activity.category !== 'work_experience') {
      score -= 10;
      concerns.push('Year-round commitment unusual for extracurricular');
    }

    // Check total plausibility
    const yearlyHours = activity.hoursPerWeek * activity.weeksPerYear;
    if (yearlyHours > 2000) {
      score -= 25;
      concerns.push('Annual hours equivalent to full-time job');
    }

    const level = score >= 80 ? 'highly_credible' :
                  score >= 60 ? 'credible' :
                  score >= 40 ? 'questionable' : 'implausible';

    return { score, level, concerns };
  }

  private compareToCategoryBenchmark(
    activity: NuancedProfilingInput['activities'][0],
    benchmark: { minHours: number; maxHours: number; typicalWeeks: number }
  ): TimeCommitmentAnalysis['categoryBenchmark'] {
    const isWithinNorms = activity.hoursPerWeek >= benchmark.minHours &&
                          activity.hoursPerWeek <= benchmark.maxHours;

    let deviation: 'normal' | 'high' | 'very_high' | 'implausible' = 'normal';
    if (activity.hoursPerWeek > benchmark.maxHours * 2) {
      deviation = 'implausible';
    } else if (activity.hoursPerWeek > benchmark.maxHours * 1.5) {
      deviation = 'very_high';
    } else if (activity.hoursPerWeek > benchmark.maxHours) {
      deviation = 'high';
    }

    return {
      typicalHoursPerWeek: { min: benchmark.minHours, max: benchmark.maxHours },
      typicalWeeksPerYear: { min: 20, max: benchmark.typicalWeeks },
      isWithinNorms,
      deviation,
    };
  }

  private analyzeEfficiency(
    activity: NuancedProfilingInput['activities'][0],
    totalHours: number
  ): TimeCommitmentAnalysis['efficiency'] {
    // This is a qualitative assessment based on achievements vs time
    const hasAchievements = (activity.achievements?.length || 0) > 0;
    const achievementLevel = activity.achievements?.[0]?.level || 'none';

    let score = 50;
    let level: 'exceptional' | 'high' | 'average' | 'low' | 'concerning' = 'average';

    // High achievement with lower hours = efficient
    if (achievementLevel === 'national' || achievementLevel === 'international') {
      if (totalHours < 500) {
        score = 95;
        level = 'exceptional';
      } else if (totalHours < 1000) {
        score = 80;
        level = 'high';
      } else {
        score = 65;
        level = 'average';
      }
    } else if (achievementLevel === 'state' || achievementLevel === 'regional') {
      if (totalHours < 300) {
        score = 85;
        level = 'high';
      } else if (totalHours < 600) {
        score = 70;
        level = 'average';
      } else {
        score = 55;
        level = 'low';
      }
    } else if (!hasAchievements && totalHours > 500) {
      score = 35;
      level = 'concerning';
    }

    return {
      score,
      level,
      impactPerHour: level === 'exceptional' ? 'Outstanding results relative to time invested' :
                     level === 'high' ? 'Strong results relative to time invested' :
                     level === 'average' ? 'Typical results for time invested' :
                     level === 'low' ? 'Limited results despite significant time' :
                     'Significant time with unclear outcomes',
      comparison: `${totalHours} total hours with ${achievementLevel} level recognition`,
    };
  }

  private analyzeProgression(
    activity: NuancedProfilingInput['activities'][0]
  ): TimeCommitmentAnalysis['progression'] {
    const gradeLevels = activity.gradeLevels || [];

    if (gradeLevels.length < 2) {
      return {
        hasProgression: false,
        pattern: 'unknown',
        significanceSignal: 'Single year involvement - insufficient data for progression analysis',
      };
    }

    // Check if sustained
    const isSequential = gradeLevels.every((g, i) =>
      i === 0 || g === gradeLevels[i-1] + 1
    );

    const hasProgression = gradeLevels.length >= 2;
    const pattern = isSequential ? 'stable' : 'fluctuating';

    return {
      hasProgression,
      pattern,
      significanceSignal: hasProgression && isSequential
        ? 'Sustained multi-year commitment signals genuine interest'
        : 'Inconsistent involvement may signal less authentic interest',
    };
  }

  private checkRealism(
    activity: NuancedProfilingInput['activities'][0],
    totalHours: number
  ): TimeCommitmentAnalysis['realismCheck'] {
    const achievementLevel = activity.achievements?.[0]?.level || 'none';
    const redFlags: string[] = [];

    // Expected minimums based on achievement level
    const minimumsByLevel: Record<string, number> = {
      international: 500,
      national: 300,
      regional: 150,
      state: 100,
      district: 50,
      school: 25,
      local: 25,
      none: 0,
    };

    const expectedMinimum = minimumsByLevel[achievementLevel] || 0;
    const expectedMaximum = expectedMinimum * 10; // Very rough upper bound

    if (totalHours < expectedMinimum * 0.5) {
      redFlags.push(`${achievementLevel}-level achievement unusual with only ${totalHours} hours`);
    }

    // Estimate tier based on achievements
    const claimedTier: ActivityTier = achievementLevel === 'international' || achievementLevel === 'national' ? 1 :
                                       achievementLevel === 'state' || achievementLevel === 'regional' ? 2 :
                                       achievementLevel === 'district' || achievementLevel === 'school' ? 3 : 4;

    return {
      claimedTier,
      expectedMinimumHours: expectedMinimum,
      expectedMaximumHours: expectedMaximum,
      isRealistic: redFlags.length === 0,
      redFlags,
    };
  }

  private assessBalance(totalWeeklyHours: number): string {
    if (totalWeeklyHours > 50) {
      return 'Overcommitted: claimed hours exceed realistic availability';
    } else if (totalWeeklyHours > 40) {
      return 'Heavy commitment: ensure hours are accurate and sustainable';
    } else if (totalWeeklyHours > 25) {
      return 'Strong engagement: demonstrates dedication while maintaining balance';
    } else if (totalWeeklyHours > 15) {
      return 'Moderate engagement: appropriate for depth-focused profile';
    } else {
      return 'Light engagement: consider whether activities represent full involvement';
    }
  }

  // ============================================================================
  // AUTHENTICITY ANALYSIS
  // ============================================================================

  private analyzeAuthenticity(
    activity: NuancedProfilingInput['activities'][0],
    input: NuancedProfilingInput
  ): AuthenticityAnalysis {
    const authenticitySignals: AuthenticityAnalysis['authenticitySignals'] = [];
    const concernSignals: AuthenticityAnalysis['concernSignals'] = [];
    let score = 50;

    // Check timing
    const gradeLevels = activity.gradeLevels || [];
    const startedEarly = gradeLevels.includes(9) || gradeLevels.includes(10);
    const startedLate = !startedEarly && (gradeLevels.includes(11) || gradeLevels.includes(12));

    if (startedEarly) {
      authenticitySignals.push({
        signal: 'Early start',
        evidence: `Began in grade ${Math.min(...gradeLevels)}`,
        strength: 'strong',
      });
      score += 15;
    }

    if (startedLate && gradeLevels.length === 1) {
      concernSignals.push({
        signal: 'Late start',
        evidence: 'Activity started in junior/senior year only',
        severity: 'medium',
        mitigation: 'If genuine, explain context in essay or additional info',
      });
      score -= 15;
    }

    // Check progression
    if (activity.yearsInvolved >= 3) {
      authenticitySignals.push({
        signal: 'Sustained commitment',
        evidence: `${activity.yearsInvolved} years of involvement`,
        strength: 'strong',
      });
      score += 15;
    }

    // Check for external validation
    if (activity.achievements && activity.achievements.length > 0) {
      const hasExternal = activity.achievements.some(a =>
        ['national', 'international', 'state', 'regional'].includes(a.level)
      );
      if (hasExternal) {
        authenticitySignals.push({
          signal: 'External validation',
          evidence: 'Recognized at state/national/international level',
          strength: 'strong',
        });
        score += 20;
      }
    }

    // Check for potential inflation
    if (/(CEO|President|Founder)/i.test(activity.role)) {
      const isRecent = !startedEarly;
      const hasUsers = /\d+.*(?:users?|members?|customers?)/.test(activity.description);

      if (isRecent && !hasUsers) {
        concernSignals.push({
          signal: 'Potential title inflation',
          evidence: 'Leadership title claimed without evidence of traction',
          severity: 'high',
          mitigation: 'Add specific metrics: users, revenue, team size, growth',
        });
        score -= 20;
      }
    }

    // Timeline assessment
    const timelineAssessment = {
      startTiming: startedEarly ? 'early' : startedLate ? 'late' : 'mid',
      progression: activity.yearsInvolved >= 3 ? 'natural' :
                   activity.yearsInvolved >= 2 ? 'moderate' : 'brief',
      longevity: activity.yearsInvolved >= 3 ? 'sustained' :
                 activity.yearsInvolved >= 2 ? 'moderate' : 'brief',
      overallImpression: this.getTimelineImpression(startedEarly, activity.yearsInvolved),
    };

    // Verification indicators
    const verificationIndicators = {
      hasExternalValidation: (activity.achievements?.length || 0) > 0,
      validationTypes: activity.achievements?.map(a => a.level) || [],
      verifiabilityLevel: this.getVerifiabilityLevel(activity),
    };

    const level = score >= 80 ? 'highly_authentic' :
                  score >= 60 ? 'authentic' :
                  score >= 40 ? 'neutral' :
                  score >= 20 ? 'questionable' : 'likely_manufactured';

    return {
      activityId: activity.id,
      overallScore: Math.max(0, Math.min(100, score)),
      level,
      authenticitySignals,
      concernSignals,
      timelineAssessment: timelineAssessment as AuthenticityAnalysis['timelineAssessment'],
      verificationIndicators: verificationIndicators as AuthenticityAnalysis['verificationIndicators'],
    };
  }

  private getTimelineImpression(startedEarly: boolean, years: number): string {
    if (startedEarly && years >= 3) {
      return 'Strong authenticity signal: early start with sustained commitment';
    } else if (startedEarly && years >= 2) {
      return 'Good authenticity signal: early start with moderate commitment';
    } else if (!startedEarly && years >= 2) {
      return 'Moderate authenticity: later start but sustained';
    } else if (!startedEarly && years === 1) {
      return 'Potential concern: late start with brief involvement';
    }
    return 'Insufficient timeline data for assessment';
  }

  private getVerifiabilityLevel(
    activity: NuancedProfilingInput['activities'][0]
  ): 'highly_verifiable' | 'verifiable' | 'somewhat_verifiable' | 'difficult_to_verify' {
    const hasAchievements = (activity.achievements?.length || 0) > 0;
    const hasOrg = !!activity.organization;

    if (hasAchievements && hasOrg) return 'highly_verifiable';
    if (hasAchievements || hasOrg) return 'verifiable';
    return 'somewhat_verifiable';
  }

  // ============================================================================
  // MAJOR ALIGNMENT ANALYSIS
  // ============================================================================

  private calculateMajorAlignment(
    activity: NuancedProfilingInput['activities'][0],
    majorCategory: MajorCategory
  ): { score: number; type: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned' } {
    // Get alignment from matrix
    const alignmentMatrix = MAJOR_ACTIVITY_ALIGNMENT_MATRIX[majorCategory];
    const categoryKey = this.mapActivityCategoryToAlignmentKey(activity.category);

    const score = alignmentMatrix?.[categoryKey] || 2;

    const type = score >= 5 ? 'core' :
                 score >= 4 ? 'supporting' :
                 score >= 3 ? 'complementary' :
                 score >= 2 ? 'neutral' : 'misaligned';

    return { score, type };
  }

  private mapActivityCategoryToAlignmentKey(category: ActivityCategory): string {
    const mapping: Record<string, string> = {
      academic_competition: 'academic_teams',
      research: 'stem_research',
      stem_project: 'stem_clubs',
      arts_performance: 'performing_arts_music',
      arts_visual: 'visual_arts',
      arts_literary: 'writing_journalism',
      athletics: 'athletics',
      community_service: 'nonprofit_service',
      leadership_governance: 'student_government',
      entrepreneurship: 'entrepreneurship',
      work_experience: 'work_experience',
      internship: 'internships',
      summer_program: 'internships',
      default: 'work_experience',
    };

    return mapping[category] || mapping.default;
  }

  private analyzeMajorAlignment(
    activityProfiles: ActivityAnalysisResult[],
    majorCategory: MajorCategory,
    fieldExpectations: FieldExpectations,
    input: NuancedProfilingInput
  ): MajorAlignmentAnalysis {
    const activityAlignments = activityProfiles.map(p => ({
      activityId: p.activityId,
      alignmentScore: p.majorAlignmentScore,
      alignmentType: p.majorAlignmentType,
      explanation: `${p.activityName} is ${p.majorAlignmentType} for ${majorCategory}`,
      howToStrengthen: p.majorAlignmentScore < 4 ?
        this.suggestAlignmentStrengthening(p, majorCategory) : undefined,
    }));

    // Calculate overall alignment
    const avgAlignment = activityProfiles.reduce((sum, p) => sum + p.majorAlignmentScore, 0) / activityProfiles.length;
    const overallScore = Math.round(avgAlignment * 20); // Scale 0-5 to 0-100

    const overallLevel = overallScore >= 80 ? 'exceptional' :
                         overallScore >= 65 ? 'strong' :
                         overallScore >= 50 ? 'adequate' :
                         overallScore >= 35 ? 'weak' : 'misaligned';

    // Strongly aligned activities
    const stronglyAligned = activityProfiles.filter(p =>
      p.majorAlignmentType === 'core' || p.majorAlignmentType === 'supporting'
    );

    // Gap analysis
    const gaps = this.identifyAlignmentGaps(activityProfiles, fieldExpectations, majorCategory);

    // Red flags
    const redFlags = this.identifyAlignmentRedFlags(activityProfiles, fieldExpectations, majorCategory);

    // Competitive assessment
    const competitiveAssessment = this.assessCompetitiveness(activityProfiles, fieldExpectations);

    // Recommendations
    const recommendations = this.generateAlignmentRecommendations(
      gaps, redFlags, activityProfiles, fieldExpectations
    );

    return {
      intendedMajor: majorCategory,
      majorCertainty: input.studentContext.majorCertainty || 'likely',

      overallAlignment: {
        score: overallScore,
        level: overallLevel,
        narrative: this.generateAlignmentNarrative(overallLevel, majorCategory, stronglyAligned.length),
      },

      activityAlignments,

      stronglyAligned: {
        activities: stronglyAligned.map(p => p.activityId),
        collectiveStrength: stronglyAligned.length >= 3 ? 'strong' : stronglyAligned.length >= 2 ? 'moderate' : 'developing',
        narrative: `${stronglyAligned.length} activities directly support ${majorCategory} interest`,
      },

      gaps,
      redFlags,
      competitiveAssessment,
      recommendations,
    };
  }

  private suggestAlignmentStrengthening(
    profile: ActivityAnalysisResult,
    majorCategory: MajorCategory
  ): string {
    const suggestions: Record<MajorCategory, string> = {
      computer_science: 'Connect to coding/tech aspects; highlight technical skills used',
      engineering: 'Emphasize building, design, or problem-solving components',
      pre_med: 'Connect to healthcare, service, or scientific inquiry',
      business_economics: 'Highlight leadership, financial, or organizational aspects',
      humanities: 'Connect to writing, research, or cultural dimensions',
      natural_sciences: 'Emphasize research, experimentation, or scientific thinking',
      law_policy: 'Highlight advocacy, argumentation, or policy impact',
      social_sciences: 'Connect to community impact or behavioral insights',
      visual_arts: 'Emphasize creative, design, or aesthetic elements',
      performing_arts: 'Highlight performance, artistic growth, or collaboration',
      architecture: 'Connect to design thinking and spatial problem-solving',
      journalism_communications: 'Emphasize communication, storytelling, or media creation',
      education: 'Highlight teaching, mentoring, or learning impact',
      environmental_studies: 'Connect to sustainability or environmental impact',
      international_relations: 'Emphasize cross-cultural or global dimensions',
    };

    return suggestions[majorCategory] || 'Highlight relevant skills and connections to your field of interest';
  }

  private identifyAlignmentGaps(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations,
    majorCategory: MajorCategory
  ): MajorAlignmentAnalysis['gaps'] {
    const gaps: MajorAlignmentAnalysis['gaps'] = [];

    const expectedActivities = fieldExpectations.tierExpectations.expectedActivities;
    const hasCore = profiles.some(p => p.majorAlignmentType === 'core');
    const tier1Count = profiles.filter(p => p.tier === 1).length;
    const tier2Count = profiles.filter(p => p.tier === 2).length;

    // Check for missing core activity
    if (!hasCore) {
      gaps.push({
        gapType: 'missing_depth',
        description: `No core activity directly aligned with ${majorCategory}`,
        severity: 'critical',
        recommendation: `Add a primary activity that directly demonstrates ${majorCategory} interest`,
        suggestedActivities: expectedActivities.slice(0, 2),
      });
    }

    // Check tier requirements
    if (tier1Count < fieldExpectations.tierExpectations.minimumTier1Count) {
      gaps.push({
        gapType: 'missing_depth',
        description: `Expected at least ${fieldExpectations.tierExpectations.minimumTier1Count} Tier 1 activity for competitive ${majorCategory} applicant`,
        severity: 'significant',
        recommendation: 'Elevate existing activity to national/international level or add high-achievement activity',
        suggestedActivities: fieldExpectations.tierExpectations.bonusActivities.slice(0, 2),
      });
    }

    if (tier2Count < fieldExpectations.tierExpectations.minimumTier2Count) {
      gaps.push({
        gapType: 'missing_breadth',
        description: `Expected at least ${fieldExpectations.tierExpectations.minimumTier2Count} Tier 2 activities`,
        severity: 'moderate',
        recommendation: 'Develop existing activities to state/regional recognition level',
        suggestedActivities: [],
      });
    }

    return gaps;
  }

  private identifyAlignmentRedFlags(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations,
    majorCategory: MajorCategory
  ): MajorAlignmentAnalysis['redFlags'] {
    const redFlags: MajorAlignmentAnalysis['redFlags'] = [];

    // Check for warning signals
    const warningActivities = fieldExpectations.tierExpectations.warningSignals;

    for (const profile of profiles) {
      // Check if any activities match warning patterns
      for (const warning of warningActivities) {
        if (profile.activityName.toLowerCase().includes(warning.toLowerCase()) ||
            profile.descriptionQuality.originalDescription.toLowerCase().includes(warning.toLowerCase())) {
          redFlags.push({
            issue: warning,
            severity: 'moderate',
            explanation: `This pattern is flagged as a concern for ${majorCategory} applicants`,
            mitigation: 'Address directly in additional information or pivot activity focus',
          });
        }
      }

      // Check for misaligned activities
      if (profile.majorAlignmentType === 'misaligned') {
        redFlags.push({
          issue: `${profile.activityName} appears misaligned with ${majorCategory}`,
          severity: 'minor',
          explanation: 'Activity doesn\'t support stated major interest',
          mitigation: 'Either reframe connection in description or consider for personality dimension',
        });
      }
    }

    return redFlags;
  }

  private assessCompetitiveness(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations
  ): MajorAlignmentAnalysis['competitiveAssessment'] {
    const tier1Count = profiles.filter(p => p.tier === 1).length;
    const tier2Count = profiles.filter(p => p.tier === 2).length;
    const coreActivities = profiles.filter(p => p.majorAlignmentType === 'core').length;

    // Compare to benchmarks
    const minTier1 = fieldExpectations.tierExpectations.minimumTier1Count;
    const minTier2 = fieldExpectations.tierExpectations.minimumTier2Count;

    let vsTypical: 'well_above' | 'above' | 'at_par' | 'below' | 'well_below' = 'at_par';

    if (tier1Count > minTier1 && tier2Count > minTier2 + 1) {
      vsTypical = 'well_above';
    } else if (tier1Count >= minTier1 && tier2Count >= minTier2) {
      vsTypical = 'above';
    } else if (tier1Count >= minTier1 - 1 && tier2Count >= minTier2 - 1) {
      vsTypical = 'at_par';
    } else if (tier1Count < minTier1 - 1 || tier2Count < minTier2 - 1) {
      vsTypical = 'below';
    }

    const vsTop = (tier1Count >= minTier1 && coreActivities >= 2) ? 'competitive' :
                  (tier2Count >= minTier2) ? 'developing' : 'needs_work';

    return {
      vsTypicalApplicant: vsTypical,
      vsTopApplicant: vsTop,
      strengthsForMajor: this.identifyStrengthsForMajor(profiles, fieldExpectations),
      weaknessesForMajor: this.identifyWeaknessesForMajor(profiles, fieldExpectations),
    };
  }

  private identifyStrengthsForMajor(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations
  ): string[] {
    const strengths: string[] = [];

    const tier1 = profiles.filter(p => p.tier === 1);
    const tier2 = profiles.filter(p => p.tier === 2);
    const core = profiles.filter(p => p.majorAlignmentType === 'core');

    if (tier1.length > 0) {
      strengths.push(`${tier1.length} exceptional (Tier 1) achievement(s)`);
    }
    if (tier2.length >= 2) {
      strengths.push(`${tier2.length} strong (Tier 2) activities showing depth`);
    }
    if (core.length >= 2) {
      strengths.push(`${core.length} activities directly aligned with major`);
    }

    // Check for bonus activities
    for (const bonus of fieldExpectations.tierExpectations.bonusActivities) {
      for (const profile of profiles) {
        if (profile.activityName.toLowerCase().includes(bonus.toLowerCase().split(' ')[0])) {
          strengths.push(`Has distinguishing activity: ${bonus}`);
          break;
        }
      }
    }

    return strengths;
  }

  private identifyWeaknessesForMajor(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations
  ): string[] {
    const weaknesses: string[] = [];

    const tier1Count = profiles.filter(p => p.tier === 1).length;
    const minTier1 = fieldExpectations.tierExpectations.minimumTier1Count;

    if (tier1Count < minTier1) {
      weaknesses.push(`Missing expected Tier 1 achievement for competitive applicants`);
    }

    const coreActivities = profiles.filter(p => p.majorAlignmentType === 'core');
    if (coreActivities.length === 0) {
      weaknesses.push('No activities directly demonstrate major-specific interest');
    }

    const avgDescriptionQuality = profiles.reduce((sum, p) => sum + p.descriptionQuality.overallScore, 0) / profiles.length;
    if (avgDescriptionQuality < 60) {
      weaknesses.push('Activity descriptions need improvement to convey impact');
    }

    return weaknesses;
  }

  private generateAlignmentNarrative(
    level: string,
    majorCategory: MajorCategory,
    stronglyAlignedCount: number
  ): string {
    switch (level) {
      case 'exceptional':
        return `Outstanding alignment with ${majorCategory}: activities clearly demonstrate deep, authentic interest with multiple strong connections.`;
      case 'strong':
        return `Good alignment with ${majorCategory}: ${stronglyAlignedCount} activities support the narrative, though there's room to strengthen connections.`;
      case 'adequate':
        return `Moderate alignment with ${majorCategory}: some relevant activities exist, but the profile would benefit from more depth or direct connections.`;
      case 'weak':
        return `Limited alignment with ${majorCategory}: activities don't strongly support the stated major interest. Consider adding field-specific activities.`;
      default:
        return `Significant misalignment: activities suggest different interests than ${majorCategory}. Either add relevant activities or reconsider major choice.`;
    }
  }

  private generateAlignmentRecommendations(
    gaps: MajorAlignmentAnalysis['gaps'],
    redFlags: MajorAlignmentAnalysis['redFlags'],
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations
  ): MajorAlignmentAnalysis['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const descriptionOptimizations: string[] = [];

    // Address critical gaps
    for (const gap of gaps.filter(g => g.severity === 'critical')) {
      immediate.push(gap.recommendation);
    }

    // Address moderate gaps
    for (const gap of gaps.filter(g => g.severity === 'significant' || g.severity === 'moderate')) {
      shortTerm.push(gap.recommendation);
    }

    // Description optimizations
    for (const profile of profiles) {
      if (profile.descriptionQuality.overallScore < 60) {
        descriptionOptimizations.push(
          `Improve ${profile.activityName} description: ${profile.descriptionQuality.coaching.priorityImprovements[0]}`
        );
      }
    }

    // Long-term suggestions from bonus activities
    for (const bonus of fieldExpectations.tierExpectations.bonusActivities.slice(0, 2)) {
      if (!profiles.some(p => p.activityName.toLowerCase().includes(bonus.toLowerCase().split(' ')[0]))) {
        longTerm.push(`Consider pursuing: ${bonus}`);
      }
    }

    return {
      immediate,
      shortTerm,
      longTerm,
      descriptionOptimizations,
    };
  }

  // ============================================================================
  // INTERCONNECTION ANALYSIS
  // ============================================================================

  private analyzeInterconnections(
    profiles: ActivityAnalysisResult[],
    input: NuancedProfilingInput
  ): PortfolioInterconnectionAnalysis {
    const connections: ActivityInterconnection[] = [];

    // Analyze pairwise connections
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const connection = this.analyzeConnection(
          profiles[i],
          profiles[j],
          input.activities[i],
          input.activities[j]
        );
        if (connection.connectionType !== 'none') {
          connections.push(connection);
        }
      }
    }

    // Identify clusters
    const clusters = this.identifyClusters(profiles, connections);

    // Identify orphan activities
    const connectedActivities = new Set(
      connections.flatMap(c => [c.activity1Id, c.activity2Id])
    );
    const orphanActivities = profiles
      .filter(p => !connectedActivities.has(p.activityId))
      .map(p => ({
        activityId: p.activityId,
        reason: 'No thematic connection to other activities',
        suggestion: 'Consider if this activity adds to your narrative or is a distraction',
      }));

    // Overall connectivity
    const connectedCount = connectedActivities.size;
    const totalCount = profiles.length;
    const connectivityScore = Math.round((connectedCount / totalCount) * 100);

    const overallConnectivity = {
      score: connectivityScore,
      level: connectivityScore >= 80 ? 'highly_connected' :
             connectivityScore >= 60 ? 'well_connected' :
             connectivityScore >= 40 ? 'moderately_connected' :
             connectivityScore >= 20 ? 'loosely_connected' : 'disconnected',
      primaryThread: clusters[0]?.theme || 'No clear primary thread',
      secondaryThreads: clusters.slice(1).map(c => c.theme),
    };

    // Skill progression
    const skillProgression = this.identifySkillProgression(profiles, connections);

    // Narrative synthesis
    const narrativeSynthesis = this.synthesizeNarrative(profiles, clusters, connections);

    return {
      overallConnectivity: overallConnectivity as PortfolioInterconnectionAnalysis['overallConnectivity'],
      clusters,
      orphanActivities,
      connections,
      narrativeSynthesis,
      skillProgression,
    };
  }

  private analyzeConnection(
    profile1: ActivityAnalysisResult,
    profile2: ActivityAnalysisResult,
    activity1: NuancedProfilingInput['activities'][0],
    activity2: NuancedProfilingInput['activities'][0]
  ): ActivityInterconnection {
    // Check various connection types
    let connectionType: ActivityInterconnection['connectionType'] = 'none';
    let strength: ActivityInterconnection['strength'] = 'none';
    let explanation = '';

    // Thematic alignment (same category or related)
    if (activity1.category === activity2.category) {
      connectionType = 'thematic_alignment';
      strength = 'strong';
      explanation = `Both activities in ${activity1.category} category`;
    } else if (this.areRelatedCategories(activity1.category, activity2.category)) {
      connectionType = 'complementary';
      strength = 'moderate';
      explanation = 'Related activity categories';
    }

    // Same organization
    if (activity1.organization && activity1.organization === activity2.organization) {
      connectionType = 'resource_sharing';
      strength = 'strong';
      explanation = `Both through ${activity1.organization}`;
    }

    // Skill transfer (check description overlap)
    const keywords1 = new Set(activity1.description.toLowerCase().split(/\s+/));
    const keywords2 = new Set(activity2.description.toLowerCase().split(/\s+/));
    const overlap = [...keywords1].filter(w => keywords2.has(w) && w.length > 5).length;

    if (overlap >= 3 && connectionType === 'none') {
      connectionType = 'skill_transfer';
      strength = 'weak';
      explanation = 'Similar skills or themes mentioned';
    }

    return {
      activity1Id: profile1.activityId,
      activity2Id: profile2.activityId,
      connectionType,
      strength,
      explanation,
      narrativeValue: {
        storyPotential: strength === 'strong' ? 'high' : strength === 'moderate' ? 'medium' : 'low',
        suggestedNarrative: this.suggestNarrative(connectionType, activity1, activity2),
      },
    };
  }

  private areRelatedCategories(cat1: ActivityCategory, cat2: ActivityCategory): boolean {
    const relatedGroups = [
      ['academic_competition', 'research', 'stem_project'],
      ['arts_performance', 'arts_visual', 'arts_literary'],
      ['community_service', 'leadership_governance'],
      ['work_experience', 'internship', 'entrepreneurship'],
    ];

    return relatedGroups.some(group => group.includes(cat1) && group.includes(cat2));
  }

  private suggestNarrative(
    connectionType: ActivityInterconnection['connectionType'],
    activity1: NuancedProfilingInput['activities'][0],
    activity2: NuancedProfilingInput['activities'][0]
  ): string {
    switch (connectionType) {
      case 'thematic_alignment':
        return `Show how ${activity1.name} and ${activity2.name} both demonstrate your commitment to [theme]`;
      case 'skill_transfer':
        return `Highlight how skills from ${activity1.name} enhanced your work in ${activity2.name}`;
      case 'progression':
        return `Tell the story of how ${activity1.name} led naturally to ${activity2.name}`;
      case 'complementary':
        return `Show how ${activity1.name} and ${activity2.name} together give a complete picture of your interests`;
      default:
        return 'Activities can be connected through skills or values demonstrated';
    }
  }

  private identifyClusters(
    profiles: ActivityAnalysisResult[],
    connections: ActivityInterconnection[]
  ): PortfolioInterconnectionAnalysis['clusters'] {
    // Simple clustering based on strong connections
    const clusters: PortfolioInterconnectionAnalysis['clusters'] = [];
    const visited = new Set<string>();

    for (const profile of profiles) {
      if (visited.has(profile.activityId)) continue;

      const cluster: string[] = [profile.activityId];
      visited.add(profile.activityId);

      // Find connected activities
      for (const conn of connections) {
        if (conn.strength === 'strong' || conn.strength === 'moderate') {
          if (conn.activity1Id === profile.activityId && !visited.has(conn.activity2Id)) {
            cluster.push(conn.activity2Id);
            visited.add(conn.activity2Id);
          } else if (conn.activity2Id === profile.activityId && !visited.has(conn.activity1Id)) {
            cluster.push(conn.activity1Id);
            visited.add(conn.activity1Id);
          }
        }
      }

      if (cluster.length >= 2) {
        const clusterProfiles = profiles.filter(p => cluster.includes(p.activityId));
        clusters.push({
          id: `cluster-${clusters.length}`,
          activities: cluster,
          theme: this.determineClusterTheme(clusterProfiles),
          strength: cluster.length >= 3 ? 80 : 60,
          narrativePotential: `These ${cluster.length} activities together tell a story of [theme]`,
        });
      }
    }

    return clusters;
  }

  private determineClusterTheme(profiles: ActivityAnalysisResult[]): string {
    // Simple theme determination based on categories
    const categories = profiles.map(p =>
      (profiles[0] as unknown as { activityName: string }).activityName
    );

    if (profiles.some(p => p.majorAlignmentType === 'core')) {
      return 'Major-aligned activities';
    }

    return 'Related activities';
  }

  private identifySkillProgression(
    profiles: ActivityAnalysisResult[],
    connections: ActivityInterconnection[]
  ): PortfolioInterconnectionAnalysis['skillProgression'] {
    // Identify skills that appear to develop across activities
    return [
      {
        skill: 'Leadership',
        activities: profiles.filter(p =>
          p.descriptionQuality.originalDescription.toLowerCase().includes('led') ||
          p.descriptionQuality.originalDescription.toLowerCase().includes('founded')
        ).map(p => p.activityId),
        progressionEvidence: 'Leadership skills demonstrated across multiple activities',
      },
    ];
  }

  private synthesizeNarrative(
    profiles: ActivityAnalysisResult[],
    clusters: PortfolioInterconnectionAnalysis['clusters'],
    connections: ActivityInterconnection[]
  ): PortfolioInterconnectionAnalysis['narrativeSynthesis'] {
    const primaryCluster = clusters[0];

    return {
      primaryNarrative: primaryCluster
        ? `Activities cluster around ${primaryCluster.theme}`
        : 'No clear primary narrative thread identified',
      supportingNarratives: clusters.slice(1).map(c => c.theme),
      gaps: connections.length < profiles.length / 2
        ? ['Many activities are disconnected from main narrative']
        : [],
      strengtheningSuggestions: [
        'Highlight connections between activities in essays',
        'Emphasize how different activities develop the same skills or values',
      ],
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateActivityTier(
    activity: NuancedProfilingInput['activities'][0],
    descriptionQuality: DescriptionQualityAnalysis,
    timeCommitment: TimeCommitmentAnalysis,
    majorCategory: MajorCategory
  ): ActivityTier {
    // Get achievement level
    const achievementLevel = activity.achievements?.[0]?.level || 'none';

    // Base tier from achievement
    let tier: ActivityTier = achievementLevel === 'international' ? 1 :
                             achievementLevel === 'national' ? 1 :
                             achievementLevel === 'state' ? 2 :
                             achievementLevel === 'regional' ? 2 :
                             achievementLevel === 'district' ? 3 :
                             achievementLevel === 'school' ? 3 : 4;

    // Adjust for time commitment
    if (timeCommitment.credibility.level === 'implausible') {
      tier = Math.min(4, tier + 1) as ActivityTier;
    }

    // Adjust for description quality (poor descriptions can cap tier)
    if (descriptionQuality.overallScore < 40 && tier < 3) {
      tier = Math.min(3, tier + 1) as ActivityTier;
    }

    return tier;
  }

  private calculateTierConfidence(
    activity: NuancedProfilingInput['activities'][0],
    tier: ActivityTier
  ): number {
    let confidence = 70;

    // Higher confidence with external validation
    if (activity.achievements && activity.achievements.length > 0) {
      confidence += 15;
    }

    // Higher confidence with more years
    if (activity.yearsInvolved >= 3) {
      confidence += 10;
    }

    // Lower confidence with very high hours
    if (activity.hoursPerWeek > 25) {
      confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  private assessOverallStrength(
    tier: ActivityTier,
    descriptionQuality: DescriptionQualityAnalysis,
    timeCommitment: TimeCommitmentAnalysis,
    authenticity: AuthenticityAnalysis,
    majorAlignmentScore: number
  ): 'exceptional' | 'strong' | 'solid' | 'adequate' | 'weak' {
    const composite =
      (5 - tier) * 25 + // Tier contributes 0-100
      descriptionQuality.overallScore * 0.2 +
      timeCommitment.credibility.score * 0.1 +
      authenticity.overallScore * 0.2 +
      majorAlignmentScore * 10; // 0-50

    if (composite >= 85) return 'exceptional';
    if (composite >= 70) return 'strong';
    if (composite >= 55) return 'solid';
    if (composite >= 40) return 'adequate';
    return 'weak';
  }

  private calculateStrategicValue(
    tier: ActivityTier,
    majorAlignmentScore: number,
    descriptionScore: number,
    authenticityScore: number
  ): number {
    return Math.round(
      (5 - tier) * 15 +
      majorAlignmentScore * 10 +
      descriptionScore * 0.2 +
      authenticityScore * 0.15
    );
  }

  private determineNarrativeContribution(
    activity: NuancedProfilingInput['activities'][0],
    majorCategory: MajorCategory,
    alignmentType: string
  ): string {
    if (alignmentType === 'core') {
      return `Primary evidence of ${majorCategory} interest`;
    } else if (alignmentType === 'supporting') {
      return `Supports ${majorCategory} narrative with related skills`;
    } else if (alignmentType === 'complementary') {
      return 'Adds dimension to profile without direct major connection';
    } else {
      return 'Personality/character element';
    }
  }

  private identifyPriorityImprovements(
    descriptionQuality: DescriptionQualityAnalysis,
    timeCommitment: TimeCommitmentAnalysis,
    tier: ActivityTier,
    majorAlignmentScore: number
  ): string[] {
    const improvements: string[] = [];

    // Description improvements
    if (descriptionQuality.overallScore < 60) {
      improvements.push(descriptionQuality.coaching.priorityImprovements[0] || 'Improve description quality');
    }

    // Time concerns
    if (timeCommitment.credibility.level === 'questionable' || timeCommitment.credibility.level === 'implausible') {
      improvements.push('Verify and adjust time commitment to credible levels');
    }

    // Alignment improvements
    if (majorAlignmentScore < 3) {
      improvements.push('Reframe activity to highlight connection to intended major');
    }

    return improvements.slice(0, 3);
  }

  private analyzePortfolioTimeCredibility(
    profiles: ActivityAnalysisResult[],
    input: NuancedProfilingInput
  ): NuancedActivityProfile['portfolioAnalysis']['totalTimeCredibility'] {
    const totalHours = profiles.reduce((sum, p) => sum + p.timeCommitment.totalHours, 0);
    const totalWeeklyHours = input.activities.reduce((sum, a) => sum + a.hoursPerWeek, 0);

    const credibilityScore = totalWeeklyHours <= 30 ? 90 :
                             totalWeeklyHours <= 40 ? 70 :
                             totalWeeklyHours <= 50 ? 50 : 30;

    return {
      totalClaimedHours: totalHours,
      credibilityScore,
      sustainabilityAssessment: this.assessBalance(totalWeeklyHours),
    };
  }

  private analyzeNarrativeStrength(
    profiles: ActivityAnalysisResult[],
    interconnections: PortfolioInterconnectionAnalysis,
    majorAlignment: MajorAlignmentAnalysis
  ): NuancedActivityProfile['portfolioAnalysis']['narrativeStrength'] {
    const connectivityScore = interconnections.overallConnectivity.score;
    const alignmentScore = majorAlignment.overallAlignment.score;

    const score = Math.round((connectivityScore + alignmentScore) / 2);

    return {
      score,
      primaryStory: interconnections.narrativeSynthesis.primaryNarrative,
      supportingElements: interconnections.narrativeSynthesis.supportingNarratives,
      gaps: [
        ...interconnections.narrativeSynthesis.gaps,
        ...majorAlignment.gaps.map(g => g.description),
      ],
    };
  }

  private assessAgainstFieldExpectations(
    profiles: ActivityAnalysisResult[],
    fieldExpectations: FieldExpectations
  ): NuancedActivityProfile['fieldSpecificAssessment'] {
    const tier1Count = profiles.filter(p => p.tier === 1).length;
    const tier2Count = profiles.filter(p => p.tier === 2).length;

    const meetsExpectations =
      tier1Count >= fieldExpectations.tierExpectations.minimumTier1Count &&
      tier2Count >= fieldExpectations.tierExpectations.minimumTier2Count;

    const exceedsIn: string[] = [];
    const fallsShortIn: string[] = [];

    if (tier1Count > fieldExpectations.tierExpectations.minimumTier1Count) {
      exceedsIn.push('Tier 1 achievements');
    }
    if (tier1Count < fieldExpectations.tierExpectations.minimumTier1Count) {
      fallsShortIn.push('Tier 1 achievements');
    }

    return {
      expectations: fieldExpectations,
      meetsExpectations,
      exceedsIn,
      fallsShortIn,
      competitivePosition: meetsExpectations
        ? 'Profile meets baseline expectations for competitive applicants'
        : 'Profile needs development to be competitive',
    };
  }

  private generateRecommendations(
    profiles: ActivityAnalysisResult[],
    majorAlignment: MajorAlignmentAnalysis,
    interconnections: PortfolioInterconnectionAnalysis,
    fieldAssessment: NuancedActivityProfile['fieldSpecificAssessment'],
    input: NuancedProfilingInput
  ): NuancedActivityProfile['recommendations'] {
    // Description priorities
    const descriptionPriorities = profiles
      .filter(p => p.descriptionQuality.overallScore < 70)
      .sort((a, b) => a.descriptionQuality.overallScore - b.descriptionQuality.overallScore)
      .slice(0, 3)
      .map(p => ({
        activityId: p.activityId,
        currentDescription: p.descriptionQuality.originalDescription,
        suggestedDescription: p.descriptionQuality.suggestedDescription.text,
        improvementRationale: p.descriptionQuality.coaching.priorityImprovements[0] || 'Needs improvement',
      }));

    // Activity strategy
    const topActivities = profiles
      .sort((a, b) => b.strategicValue - a.strategicValue)
      .slice(0, 5);

    const activityStrategy = {
      activitiesToHighlight: topActivities.map(p => p.activityId),
      activitiesToDeemphasize: profiles
        .filter(p => p.overallStrength === 'weak' || p.overallStrength === 'adequate')
        .map(p => p.activityId),
      activitiesToExpand: majorAlignment.recommendations.shortTerm,
      newActivitiesSuggested: majorAlignment.gaps
        .flatMap(g => g.suggestedActivities)
        .slice(0, 3),
    };

    // Narrative strategy
    const narrativeStrategy = {
      primaryNarrative: interconnections.narrativeSynthesis.primaryNarrative,
      howToSupport: interconnections.narrativeSynthesis.strengtheningSuggestions,
      commonAppOrder: topActivities.map(p => p.activityId),
    };

    // Action plan
    const actionPlan = {
      immediate: [
        ...descriptionPriorities.slice(0, 2).map(d =>
          `Improve ${d.activityId} description`
        ),
        ...majorAlignment.recommendations.immediate.slice(0, 2),
      ],
      shortTerm: majorAlignment.recommendations.shortTerm.slice(0, 3),
      longTerm: majorAlignment.recommendations.longTerm.slice(0, 3),
    };

    return {
      descriptionPriorities,
      activityStrategy,
      narrativeStrategy,
      actionPlan,
    };
  }

  private extractConstraints(studentContext: NuancedProfilingInput['studentContext']): string[] {
    const constraints: string[] = [];

    if (studentContext.isFirstGen) constraints.push('first-generation');
    if (studentContext.isLowIncome) constraints.push('low-income');
    if (studentContext.isRural) constraints.push('rural');
    if (studentContext.isInternational) constraints.push('international');

    return constraints;
  }

  private calculateOverallConfidence(
    profiles: ActivityAnalysisResult[],
    input: NuancedProfilingInput
  ): number {
    let confidence = 70;

    // More activities = more confidence in pattern
    if (profiles.length >= 8) confidence += 10;
    else if (profiles.length < 4) confidence -= 15;

    // Higher description quality = more confidence
    const avgDescQuality = profiles.reduce((sum, p) => sum + p.descriptionQuality.overallScore, 0) / profiles.length;
    if (avgDescQuality >= 70) confidence += 10;
    else if (avgDescQuality < 50) confidence -= 15;

    // External validation boosts confidence
    const validatedActivities = profiles.filter(p => p.authenticity.verificationIndicators.hasExternalValidation).length;
    confidence += Math.min(10, validatedActivities * 3);

    return Math.max(0, Math.min(100, confidence));
  }

  private identifyCaveats(
    profiles: ActivityAnalysisResult[],
    input: NuancedProfilingInput
  ): string[] {
    const caveats: string[] = [];

    // Low description quality
    const avgDescQuality = profiles.reduce((sum, p) => sum + p.descriptionQuality.overallScore, 0) / profiles.length;
    if (avgDescQuality < 50) {
      caveats.push('Analysis limited by low-quality activity descriptions');
    }

    // Time credibility issues
    const totalWeekly = input.activities.reduce((sum, a) => sum + a.hoursPerWeek, 0);
    if (totalWeekly > 40) {
      caveats.push('Total weekly hours may be overstated');
    }

    // Few activities
    if (profiles.length < 4) {
      caveats.push('Limited activities make pattern detection less reliable');
    }

    return caveats;
  }

  private identifyInfoGaps(
    profiles: ActivityAnalysisResult[],
    input: NuancedProfilingInput
  ): string[] {
    const gaps: string[] = [];

    // Missing grade levels
    const missingGrades = profiles.filter(p => p.timeCommitment.gradeLevels.length === 0);
    if (missingGrades.length > 0) {
      gaps.push(`${missingGrades.length} activities missing grade level information`);
    }

    // Missing achievements
    const noAchievements = input.activities.filter(a => !a.achievements || a.achievements.length === 0);
    if (noAchievements.length === input.activities.length) {
      gaps.push('No achievements listed for any activity');
    }

    // Missing organizations
    const noOrg = input.activities.filter(a => !a.organization);
    if (noOrg.length > input.activities.length / 2) {
      gaps.push('Many activities missing organization information');
    }

    return gaps;
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface ActivityAnalysisResult {
  activityId: string;
  activityName: string;
  tier: ActivityTier;
  tierConfidence: number;
  descriptionQuality: DescriptionQualityAnalysis;
  timeCommitment: TimeCommitmentAnalysis;
  authenticity: AuthenticityAnalysis;
  majorAlignmentScore: number;
  majorAlignmentType: 'core' | 'supporting' | 'complementary' | 'neutral' | 'misaligned';
  overallStrength: 'exceptional' | 'strong' | 'solid' | 'adequate' | 'weak';
  strategicValue: number;
  narrativeContribution: string;
  priorityImprovements: string[];
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const nuancedActivityProfiler = new NuancedActivityProfiler();
