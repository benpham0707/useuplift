// @ts-nocheck
/**
 * School Fit & Strategy Engine
 *
 * Analyzes student profiles against college admissions data to provide:
 * - Personalized fit assessments for each school
 * - Admission probability estimates
 * - Strategic application recommendations
 * - School list optimization
 *
 * QUALITY PRINCIPLES:
 * - Probability estimates are honest about uncertainty
 * - Fit analysis considers multiple dimensions
 * - Recommendations are actionable and personalized
 * - Uses real admissions data, not assumptions
 */

import {
  SchoolFitOutput,
  SchoolFitAnalysis,
  SchoolFitAssessment,
  CategorizedSchoolList,
  SchoolSuggestions,
  ApplicationStrategyRecommendations,
  CollegeAdmissionProfile,
  SchoolCategory,
  DecisionType,
  FitDimensionScore,
  ProbabilityFactors,
} from '../types/schoolFit';
import { HolisticProfileSynthesis, GoalsAspirations, ProfileTier } from '../types/synthesis';
import { AcademicEvaluation } from '../types/academic';
import { ActivityPortfolioAnalysis } from '../types/activities';
import { AwardEvaluation } from '../types/awards';
import {
  COLLEGE_PROFILES,
  getCollegeProfile,
  getAllCollegeProfiles,
  getCollegesWithEDAdvantage,
} from '../data/collegeAdmissionsData';
import {
  calculateWeightedScore,
  calculatePercentile,
  generateInputHash,
  WeightedScoreComponent,
} from '../utils/scoring';
import { schoolFitCache, generateHashedCacheKey } from '../utils/caching';

// ============================================================================
// PROBABILITY ESTIMATION CONFIGURATION
// ============================================================================

const PROBABILITY_CONFIG = {
  weights: {
    academic: 0.45,
    nonAcademic: 0.35,
    context: 0.20,
  },
  academicPercentileMultipliers: {
    above75th: 1.8,
    percentile50to75: 1.3,
    percentile25to50: 0.9,
    below25th: 0.5,
  },
  profileTierMultipliers: {
    exceptional: 1.4,
    highly_competitive: 1.15,
    competitive: 0.95,
    developing: 0.7,
    building: 0.4,
  } as Record<ProfileTier, number>,
  // Adjustment for specific contexts
  contextAdjustments: {
    hasNationalAward: 0.15,
    hasSpike: 0.10,
    strongLeadership: 0.05,
    firstGen: 0.08,
    underrepresented: 0.05,
    legacy: 0.12,
    athlete: 0.25,
  },
  // School type adjustments
  schoolTypeAdjustments: {
    ivy: 0.85,
    elite: 0.90,
    selective: 0.95,
    competitive: 1.0,
  },
};

// ============================================================================
// SCHOOL FIT ENGINE CLASS
// ============================================================================

export class SchoolFitEngine {
  /**
   * Analyze school fit and generate strategic recommendations
   */
  async analyze(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations,
    targetSchools?: string[]
  ): Promise<SchoolFitOutput> {
    // Check cache
    const { key, hash } = generateHashedCacheKey('schoolFit', 'analysis', {
      synthesis: synthesis.inputDataHash,
      goals,
      targetSchools,
    });
    const cached = schoolFitCache.get(key);
    if (cached) {
      return cached as SchoolFitOutput;
    }

    // Determine which schools to analyze
    const schoolsToAnalyze = this.determineSchoolsToAnalyze(targetSchools, goals);

    // Analyze each school
    const detailedAssessments: Record<string, SchoolFitAnalysis> = {};
    for (const schoolId of schoolsToAnalyze) {
      const profile = getCollegeProfile(schoolId);
      if (profile) {
        detailedAssessments[schoolId] = this.analyzeSchoolFit(
          profile,
          synthesis,
          goals
        );
      }
    }

    // Create categorized school list
    const schoolList = this.createCategorizedList(detailedAssessments);

    // Generate strategy recommendations
    const strategy = this.generateStrategyRecommendations(
      detailedAssessments,
      synthesis,
      goals,
      schoolList
    );

    // Generate school suggestions
    const suggestions = this.generateSchoolSuggestions(
      detailedAssessments,
      synthesis,
      goals,
      schoolList
    );

    // Generate list assessment
    const listAssessment = this.assessList(schoolList, synthesis.profileStrength.tier);

    // Find best matches
    const bestMatches = this.findBestMatches(detailedAssessments);

    // Build output
    const output: SchoolFitOutput = {
      analyzedAt: new Date().toISOString(),
      version: '1.0.0',
      schoolList,
      detailedAssessments,
      strategy,
      suggestions,
      listAssessment,
      bestMatches,
      inputDataHash: hash,
      confidenceScore: this.calculateConfidenceScore(detailedAssessments),
    };

    // Cache result
    schoolFitCache.set(key, output, hash);

    return output;
  }

  // ============================================================================
  // SCHOOL DETERMINATION
  // ============================================================================

  /**
   * Determine which schools to analyze
   */
  private determineSchoolsToAnalyze(
    targetSchools?: string[],
    goals?: GoalsAspirations
  ): string[] {
    // If specific schools provided, use those
    if (targetSchools && targetSchools.length > 0) {
      return targetSchools.map(s => s.toLowerCase());
    }

    // If goals include target schools, use those
    if (goals?.targetSchools && goals.targetSchools.length > 0) {
      return goals.targetSchools.map(s => s.toLowerCase());
    }

    // Default: analyze all available schools
    return Object.keys(COLLEGE_PROFILES);
  }

  // ============================================================================
  // FIT ANALYSIS
  // ============================================================================

  /**
   * Analyze fit for a single school
   */
  private analyzeSchoolFit(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis {
    // Calculate fit dimensions
    const fitDimensions = this.calculateFitDimensions(school, synthesis, goals);

    // Calculate overall fit score
    const overallFitScore = this.calculateOverallFitScore(fitDimensions);

    // Estimate admission probability
    const admissionProbability = this.estimateAdmissionProbability(
      school,
      synthesis,
      goals
    );

    // Determine category
    const category = this.determineCategory(admissionProbability.estimate, school);

    // Generate college insights
    const collegeInsights = this.generateCollegeInsights(
      school,
      synthesis,
      fitDimensions
    );

    // Generate application strategy
    const applicationStrategy = this.generateApplicationStrategy(
      school,
      admissionProbability,
      synthesis,
      goals
    );

    // Generate demonstrated interest guidance
    const demonstratedInterestGuidance = this.generateDemonstratedInterestGuidance(school);

    // Generate supplemental essay strategy
    const supplementalEssayStrategy = this.generateSupplementalEssayStrategy(
      school,
      synthesis,
      goals
    );

    // Generate why this school reasons
    const whyThisSchool = this.generateWhyThisSchool(school, synthesis, goals);

    return {
      schoolId: school.collegeId,
      schoolName: school.collegeName,
      overallFitScore,
      category,
      admissionProbability,
      fitDimensions,
      collegeInsights,
      applicationStrategy,
      demonstratedInterestGuidance,
      supplementalEssayStrategy,
      whyThisSchool,
    };
  }

  /**
   * Calculate fit across dimensions
   */
  private calculateFitDimensions(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis['fitDimensions'] {
    const academic = this.calculateAcademicFit(school, synthesis);
    const activities = this.calculateActivitiesFit(school, synthesis);
    const values = this.calculateValuesFit(school, synthesis, goals);
    const culture = this.calculateCultureFit(school, goals);
    const program = this.calculateProgramFit(school, goals);
    const financial = this.calculateFinancialFit(school, goals);

    return {
      academic,
      activities,
      values,
      culture,
      program,
      financial,
    };
  }

  /**
   * Calculate academic fit
   */
  private calculateAcademicFit(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): FitDimensionScore {
    const academic = synthesis.componentEvaluations.academic;

    // Calculate GPA percentile position
    const gpaPercentile = calculatePercentile(
      academic.gpa.unweightedGPA || academic.gpa.weightedGPA || 0,
      school.academicBenchmarks.gpa.percentile25,
      school.academicBenchmarks.gpa.percentile50,
      school.academicBenchmarks.gpa.percentile75
    );

    // Calculate test score position if available
    let testPercentile = { position: 'at_median', exactPercentile: 50 };
    if (academic.testScores?.submissionDecision?.shouldSubmit) {
      const satScore = academic.testScores.satScore || 0;
      const actScore = academic.testScores.actScore || 0;

      if (satScore > 0 && school.academicBenchmarks.sat) {
        testPercentile = calculatePercentile(
          satScore,
          school.academicBenchmarks.sat.percentile25,
          school.academicBenchmarks.sat.percentile50,
          school.academicBenchmarks.sat.percentile75
        );
      } else if (actScore > 0 && school.academicBenchmarks.act) {
        testPercentile = calculatePercentile(
          actScore,
          school.academicBenchmarks.act.percentile25,
          school.academicBenchmarks.act.percentile50,
          school.academicBenchmarks.act.percentile75
        );
      }
    }

    // Course rigor assessment
    const rigorScore =
      academic.courseRigor.rigorLevel === 'exceptional' ? 95 :
      academic.courseRigor.rigorLevel === 'strong' ? 80 :
      academic.courseRigor.rigorLevel === 'moderate' ? 60 :
      academic.courseRigor.rigorLevel === 'basic' ? 40 : 20;

    // Calculate combined score
    const components: WeightedScoreComponent[] = [
      { value: gpaPercentile.exactPercentile, weight: 0.4 },
      { value: testPercentile.exactPercentile, weight: 0.35 },
      { value: rigorScore, weight: 0.25 },
    ];

    const { weightedScore } = calculateWeightedScore(components);
    const score = Math.round(weightedScore);

    // Determine assessment
    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    // Generate context and insights
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (gpaPercentile.position === 'above_75th') {
      strengths.push(`GPA above ${school.commonName}'s 75th percentile`);
    } else if (gpaPercentile.position === 'below_25th') {
      concerns.push(`GPA below ${school.commonName}'s 25th percentile`);
    }

    if (testPercentile.position === 'above_75th') {
      strengths.push('Test scores above 75th percentile');
    } else if (testPercentile.position === 'below_25th') {
      concerns.push('Test scores below 25th percentile');
    }

    if (academic.courseRigor.rigorLevel === 'exceptional') {
      strengths.push('Exceptional course rigor demonstrates readiness');
    } else if (academic.courseRigor.rigorLevel === 'basic') {
      concerns.push('Course rigor may be below typical admits');
    }

    return {
      score,
      weight: 35,
      assessment,
      context: this.generateAcademicFitContext(score, school, gpaPercentile, testPercentile),
      strengths,
      concerns,
    };
  }

  /**
   * Generate academic fit context
   */
  private generateAcademicFitContext(
    score: number,
    school: CollegeAdmissionProfile,
    gpaPercentile: { position: string; exactPercentile: number },
    testPercentile: { position: string; exactPercentile: number }
  ): string {
    if (score >= 80) {
      return `Academic profile is well-matched with ${school.commonName}'s admitted student profile.`;
    }
    if (score >= 60) {
      return `Academic profile is competitive for ${school.commonName}. Falls within the middle 50% of admitted students.`;
    }
    if (score >= 40) {
      return `Academic profile is below the median for ${school.commonName}. Will need strong extracurriculars and essays.`;
    }
    return `Academic profile is a significant reach for ${school.commonName}. Consider this a high reach.`;
  }

  /**
   * Calculate activities fit
   */
  private calculateActivitiesFit(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): FitDimensionScore {
    const activities = synthesis.componentEvaluations.activities;

    // Base score from activity strength
    const strengthScore =
      activities.overallStrength === 'exceptional' ? 95 :
      activities.overallStrength === 'competitive' ? 75 :
      activities.overallStrength === 'developing' ? 55 :
      activities.overallStrength === 'needs_work' ? 35 : 50;

    // Spike bonus - schools love depth
    const spikeBonus = activities.spikeAnalysis.hasClearSpike
      ? (activities.spikeAnalysis.spikeStrength === 'national_level' ? 15 :
         activities.spikeAnalysis.spikeStrength === 'regional_level' ? 10 : 5)
      : 0;

    // Leadership bonus
    const leadershipBonus =
      activities.leadershipAnalysis.leadershipProfile === 'strong_leader' ? 10 :
      activities.leadershipAnalysis.leadershipProfile === 'organizational_leader' ? 8 :
      activities.leadershipAnalysis.leadershipProfile === 'emerging_leader' ? 5 : 0;

    // Check alignment with school values
    const valuesAlignment = this.checkActivityValueAlignment(school, activities);

    const score = Math.min(100, strengthScore + spikeBonus + leadershipBonus + valuesAlignment);

    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (activities.spikeAnalysis.hasClearSpike) {
      strengths.push(`Clear spike in ${activities.spikeAnalysis.spikeArea}`);
    }
    if (activities.leadershipAnalysis.leadershipProfile !== 'none') {
      strengths.push('Demonstrated leadership');
    }
    if (!activities.spikeAnalysis.hasClearSpike) {
      concerns.push('No clear area of exceptional depth');
    }

    return {
      score,
      weight: 30,
      assessment,
      context: this.generateActivitiesFitContext(score, school, activities),
      strengths,
      concerns,
    };
  }

  /**
   * Check activity alignment with school values
   */
  private checkActivityValueAlignment(
    school: CollegeAdmissionProfile,
    activities: ActivityPortfolioAnalysis
  ): number {
    let bonus = 0;

    const schoolValues = school.institutionalValues.whatTheyLookFor.join(' ').toLowerCase();
    const spike = activities.spikeAnalysis.spikeArea?.toLowerCase() || '';

    // MIT/Caltech value hands-on building
    if ((school.collegeId === 'mit' || school.collegeId === 'caltech') &&
        (spike.includes('research') || spike.includes('engineering') || spike.includes('robotics'))) {
      bonus += 5;
    }

    // Stanford values innovation
    if (school.collegeId === 'stanford' &&
        (spike.includes('startup') || spike.includes('entrepreneur'))) {
      bonus += 5;
    }

    // Yale values arts/humanities
    if (school.collegeId === 'yale' &&
        (spike.includes('art') || spike.includes('theater') || spike.includes('writing'))) {
      bonus += 5;
    }

    // Princeton values service
    if (school.collegeId === 'princeton' &&
        (spike.includes('service') || spike.includes('nonprofit'))) {
      bonus += 5;
    }

    return bonus;
  }

  /**
   * Generate activities fit context
   */
  private generateActivitiesFitContext(
    score: number,
    school: CollegeAdmissionProfile,
    activities: ActivityPortfolioAnalysis
  ): string {
    if (score >= 80) {
      return `Extracurricular profile aligns well with what ${school.commonName} values in applicants.`;
    }
    if (score >= 60) {
      return `Activities are competitive for ${school.commonName}. Highlight depth and impact in essays.`;
    }
    if (score >= 40) {
      return `Activities could be stronger for ${school.commonName}. Essays must showcase meaningful involvement.`;
    }
    return `Activity profile is below typical ${school.commonName} admits. This is a significant reach.`;
  }

  /**
   * Calculate values fit
   */
  private calculateValuesFit(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): FitDimensionScore {
    // Match archetype to school values
    const archetype = synthesis.applicationBrand.primaryArchetype;
    let score = 50; // Base score

    // Check archetype alignment
    const archetypeAlignments: Record<string, string[]> = {
      harvard: ['the_leader', 'the_advocate', 'the_researcher'],
      stanford: ['the_innovator', 'the_researcher', 'the_builder'],
      mit: ['the_builder', 'the_researcher', 'the_specialist'],
      yale: ['the_artist', 'the_polymath', 'the_leader'],
      princeton: ['the_researcher', 'the_advocate', 'the_mentor'],
      caltech: ['the_researcher', 'the_specialist', 'the_builder'],
      columbia: ['the_polymath', 'the_innovator', 'the_researcher'],
      upenn: ['the_innovator', 'the_leader', 'the_connector'],
      duke: ['the_leader', 'the_athlete', 'the_advocate'],
      northwestern: ['the_polymath', 'the_connector', 'the_innovator'],
    };

    const alignedArchetypes = archetypeAlignments[school.collegeId] || [];
    if (alignedArchetypes.includes(archetype)) {
      score += 25;
    }

    // Check brand consistency
    score += (synthesis.applicationBrand.brandConsistency.score / 100) * 15;

    // Check theme alignment
    const hasRelevantThemes = synthesis.applicationBrand.keyThemes.some(
      t => school.institutionalValues.whatTheyLookFor.some(
        v => v.toLowerCase().includes(t.theme.toLowerCase())
      )
    );
    if (hasRelevantThemes) {
      score += 10;
    }

    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (alignedArchetypes.includes(archetype)) {
      strengths.push(`"${archetype.replace('the_', '').replace('_', ' ')}" profile aligns with school values`);
    } else {
      concerns.push('Application archetype may not align with typical admits');
    }

    return {
      score: Math.min(100, score),
      weight: 15,
      assessment,
      context: `${school.commonName} values: ${school.institutionalValues.coreValues.slice(0, 2).join(', ')}.`,
      strengths,
      concerns,
    };
  }

  /**
   * Calculate culture fit
   */
  private calculateCultureFit(
    school: CollegeAdmissionProfile,
    goals: GoalsAspirations
  ): FitDimensionScore {
    let score = 60; // Base neutral score

    // Size preference match
    if (goals.collegePreferences.size !== 'any') {
      if (goals.collegePreferences.size === school.size) {
        score += 15;
      } else {
        score -= 10;
      }
    }

    // Location preference match
    if (goals.collegePreferences.location !== 'any') {
      const isUrban = ['New York', 'Boston', 'Chicago', 'Los Angeles'].includes(school.location.city) ||
                      school.location.city === 'Cambridge'; // Near Boston
      const isSuburban = ['Stanford', 'Princeton', 'Evanston', 'Durham'].includes(school.location.city);
      const isRural = !isUrban && !isSuburban;

      if ((goals.collegePreferences.location === 'urban' && isUrban) ||
          (goals.collegePreferences.location === 'suburban' && isSuburban) ||
          (goals.collegePreferences.location === 'rural' && isRural)) {
        score += 15;
      }
    }

    // Region preference match
    if (goals.collegePreferences.region.length > 0) {
      if (goals.collegePreferences.region.includes(school.location.region)) {
        score += 10;
      }
    }

    // Public/private preference
    if (goals.collegePreferences.publicPrivate !== 'any') {
      if (goals.collegePreferences.publicPrivate === school.type) {
        score += 10;
      }
    }

    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (school.size === goals.collegePreferences.size || goals.collegePreferences.size === 'any') {
      strengths.push(`${school.size.charAt(0).toUpperCase() + school.size.slice(1)} school size matches preference`);
    }

    // Check for culture mismatches
    if (school.culture.notRightFor.length > 0) {
      concerns.push(`May not be right for: ${school.culture.notRightFor[0]}`);
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      weight: 10,
      assessment,
      context: `${school.commonName} vibe: ${school.culture.vibe.slice(0, 3).join(', ')}.`,
      strengths,
      concerns,
    };
  }

  /**
   * Calculate program fit
   */
  private calculateProgramFit(
    school: CollegeAdmissionProfile,
    goals: GoalsAspirations
  ): FitDimensionScore {
    let score = 50;

    const normalizedMajor = goals.intendedMajor.toLowerCase();

    // Check if major is a strong program
    const isStrongProgram = school.academicStrengths.strongMajors.some(
      m => m.toLowerCase().includes(normalizedMajor) || normalizedMajor.includes(m.toLowerCase())
    );

    // Check if major is competitive (harder admission)
    const isCompetitive = school.academicStrengths.competitiveMajors.some(
      m => m.toLowerCase().includes(normalizedMajor) || normalizedMajor.includes(m.toLowerCase())
    );

    if (isStrongProgram) {
      score += 30;
    }

    // Competitive majors are harder to get into but still a strength
    if (isCompetitive) {
      score += 10; // Good that it's strong, but more competitive
    }

    // Check lesser known strengths
    const isLesserKnown = school.academicStrengths.lesserKnownStrengths.some(
      m => m.toLowerCase().includes(normalizedMajor) || normalizedMajor.includes(m.toLowerCase())
    );
    if (isLesserKnown) {
      score += 20;
    }

    // Career alignment
    if (goals.careerInterests.length > 0) {
      // Schools have different career focuses
      const businessSchools = ['upenn', 'northwestern', 'duke'];
      const techSchools = ['mit', 'stanford', 'caltech', 'cmu'];
      const lawPolicySchools = ['yale', 'harvard', 'princeton', 'georgetown'];

      const careerLower = goals.careerInterests.map(c => c.toLowerCase());

      if (careerLower.some(c => c.includes('business') || c.includes('finance')) &&
          businessSchools.includes(school.collegeId)) {
        score += 10;
      }
      if (careerLower.some(c => c.includes('tech') || c.includes('engineer')) &&
          techSchools.includes(school.collegeId)) {
        score += 10;
      }
      if (careerLower.some(c => c.includes('law') || c.includes('policy')) &&
          lawPolicySchools.includes(school.collegeId)) {
        score += 10;
      }
    }

    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (isStrongProgram) {
      strengths.push(`${goals.intendedMajor} is a strong program at ${school.commonName}`);
    }
    if (isCompetitive) {
      concerns.push(`${goals.intendedMajor} is highly competitive for admission`);
    }

    return {
      score: Math.min(100, score),
      weight: 10,
      assessment,
      context: `Strong majors: ${school.academicStrengths.strongMajors.slice(0, 3).join(', ')}.`,
      strengths,
      concerns,
    };
  }

  /**
   * Calculate financial fit
   */
  private calculateFinancialFit(
    school: CollegeAdmissionProfile,
    goals: GoalsAspirations
  ): FitDimensionScore {
    let score = 50;

    // High need students need schools that meet full need
    if (goals.financialAidNeed === 'high') {
      if (school.financial.meetsFullNeed) {
        score += 40;
      } else {
        score -= 20;
      }
    } else if (goals.financialAidNeed === 'moderate') {
      if (school.financial.meetsFullNeed) {
        score += 25;
      }
      if (school.financial.meritAidAvailable) {
        score += 15;
      }
    } else if (goals.financialAidNeed === 'low' || goals.financialAidNeed === 'none') {
      score = 75; // Finance not a major factor
    }

    const assessment: FitDimensionScore['assessment'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'fair' : 'poor';

    const strengths: string[] = [];
    const concerns: string[] = [];

    if (school.financial.meetsFullNeed) {
      strengths.push('Meets 100% of demonstrated need');
    }
    if (!school.financial.meetsFullNeed && goals.financialAidNeed === 'high') {
      concerns.push('May not meet full financial need');
    }
    if (school.financial.meritAidAvailable) {
      strengths.push('Merit aid available');
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      weight: 0, // We don't factor this into overall fit, just report it
      assessment,
      context: `Average net price: $${school.financial.averageNetPrice.toLocaleString()}. ` +
               `${school.financial.meetsFullNeed ? 'Meets full need.' : 'Does not guarantee meeting full need.'}`,
      strengths,
      concerns,
    };
  }

  /**
   * Calculate overall fit score
   */
  private calculateOverallFitScore(
    fitDimensions: SchoolFitAnalysis['fitDimensions']
  ): number {
    const components: WeightedScoreComponent[] = [
      { value: fitDimensions.academic.score, weight: fitDimensions.academic.weight / 100 },
      { value: fitDimensions.activities.score, weight: fitDimensions.activities.weight / 100 },
      { value: fitDimensions.values.score, weight: fitDimensions.values.weight / 100 },
      { value: fitDimensions.culture.score, weight: fitDimensions.culture.weight / 100 },
      { value: fitDimensions.program.score, weight: fitDimensions.program.weight / 100 },
      // Financial not included in overall fit - reported separately
    ];

    const { weightedScore } = calculateWeightedScore(components);
    return Math.round(weightedScore);
  }

  // ============================================================================
  // PROBABILITY ESTIMATION
  // ============================================================================

  /**
   * Estimate admission probability
   */
  private estimateAdmissionProbability(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis['admissionProbability'] {
    const factors = this.calculateProbabilityFactors(school, synthesis);

    // Base rate from school's acceptance rate
    const baseRate = school.admissionStats.acceptanceRate / 100;

    // Apply multipliers
    let adjustedRate = baseRate;

    // Academic factor
    const academicMultiplier = this.getAcademicMultiplier(factors.academic.combinedAcademicScore);
    adjustedRate *= academicMultiplier;

    // Profile tier multiplier
    const tierMultiplier = PROBABILITY_CONFIG.profileTierMultipliers[synthesis.profileStrength.tier];
    adjustedRate *= tierMultiplier;

    // Non-academic factor
    const nonAcademicMultiplier = 0.7 + (factors.nonAcademic.combinedNonAcademicScore / 100) * 0.6;
    adjustedRate *= nonAcademicMultiplier;

    // Context adjustments
    let contextBoost = 0;
    if (synthesis.componentEvaluations.awards.distribution.summary.tier1Awards >= 1) {
      contextBoost += PROBABILITY_CONFIG.contextAdjustments.hasNationalAward;
    }
    if (synthesis.componentEvaluations.activities.spikeAnalysis.hasClearSpike) {
      contextBoost += PROBABILITY_CONFIG.contextAdjustments.hasSpike;
    }
    if (synthesis.personalContext.isFirstGeneration) {
      contextBoost += PROBABILITY_CONFIG.contextAdjustments.firstGen;
    }

    adjustedRate = Math.min(0.95, adjustedRate + contextBoost);

    // Convert to percentage
    const estimate = Math.min(95, Math.max(1, Math.round(adjustedRate * 100)));

    // Calculate range based on confidence
    const confidence = this.getConfidence(school, synthesis);
    const rangeWidth = confidence === 'high' ? 10 : confidence === 'medium' ? 20 : 30;

    return {
      estimate,
      range: {
        low: Math.max(1, estimate - rangeWidth / 2),
        high: Math.min(95, estimate + rangeWidth / 2),
      },
      confidence,
      explanation: this.generateProbabilityExplanation(estimate, school, synthesis),
    };
  }

  /**
   * Calculate probability factors
   */
  private calculateProbabilityFactors(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): ProbabilityFactors {
    const academic = synthesis.componentEvaluations.academic;
    const activities = synthesis.componentEvaluations.activities;
    const awards = synthesis.componentEvaluations.awards;

    // Academic factors
    const gpaFactor = this.calculateGPAFactor(academic, school);
    const testScoreFactor = this.calculateTestScoreFactor(academic, school);
    const rigorFactor = academic.courseRigor.rigorScore || 70;
    const trendFactor = academic.gradeTrend?.trendScore || 70;
    const combinedAcademicScore = (gpaFactor + testScoreFactor + rigorFactor + trendFactor) / 4;

    // Non-academic factors
    const activitiesFactor = activities.overallScore;
    const awardsFactor = awards.overallScore;
    const leadershipFactor =
      activities.leadershipAnalysis.leadershipProfile === 'strong_leader' ? 90 :
      activities.leadershipAnalysis.leadershipProfile === 'organizational_leader' ? 75 :
      activities.leadershipAnalysis.leadershipProfile === 'emerging_leader' ? 60 : 40;
    const spikeFactor = activities.spikeAnalysis.hasClearSpike
      ? (activities.spikeAnalysis.spikeStrength === 'national_level' ? 95 :
         activities.spikeAnalysis.spikeStrength === 'regional_level' ? 80 : 65)
      : 40;
    const combinedNonAcademicScore = (activitiesFactor + awardsFactor + leadershipFactor + spikeFactor) / 4;

    // Context factors (simplified for now)
    const combinedContextScore = 50; // Neutral

    return {
      academic: {
        gpaFactor,
        testScoreFactor,
        rigorFactor,
        trendFactor,
        combinedAcademicScore,
      },
      nonAcademic: {
        activitiesFactor,
        awardsFactor,
        essaysFactor: 50, // Essays not analyzed yet
        leadershipFactor,
        spikeFactor,
        combinedNonAcademicScore,
      },
      context: {
        demonstratedInterestFactor: 50,
        legacyFactor: 50,
        athleteFactor: 50,
        firstGenFactor: synthesis.personalContext.isFirstGeneration ? 60 : 50,
        geographicFactor: 50,
        majorCompetitivenessFactor: 50,
        combinedContextScore,
      },
      calculation: {
        baseRate: school.admissionStats.acceptanceRate,
        adjustedRate: 0, // Calculated above
        confidenceAdjustment: 0,
        finalEstimate: 0,
      },
    };
  }

  /**
   * Calculate GPA factor
   */
  private calculateGPAFactor(
    academic: AcademicEvaluation,
    school: CollegeAdmissionProfile
  ): number {
    const gpa = academic.gpa.unweightedGPA || academic.gpa.weightedGPA || 0;
    const { position, exactPercentile } = calculatePercentile(
      gpa,
      school.academicBenchmarks.gpa.percentile25,
      school.academicBenchmarks.gpa.percentile50,
      school.academicBenchmarks.gpa.percentile75
    );

    return exactPercentile;
  }

  /**
   * Calculate test score factor
   */
  private calculateTestScoreFactor(
    academic: AcademicEvaluation,
    school: CollegeAdmissionProfile
  ): number {
    if (!academic.testScores?.submissionDecision?.shouldSubmit) {
      return 50; // Neutral for test-optional
    }

    const satScore = academic.testScores.satScore || 0;
    const actScore = academic.testScores.actScore || 0;

    if (satScore > 0 && school.academicBenchmarks.sat) {
      return calculatePercentile(
        satScore,
        school.academicBenchmarks.sat.percentile25,
        school.academicBenchmarks.sat.percentile50,
        school.academicBenchmarks.sat.percentile75
      ).exactPercentile;
    }

    if (actScore > 0 && school.academicBenchmarks.act) {
      return calculatePercentile(
        actScore,
        school.academicBenchmarks.act.percentile25,
        school.academicBenchmarks.act.percentile50,
        school.academicBenchmarks.act.percentile75
      ).exactPercentile;
    }

    return 50;
  }

  /**
   * Get academic multiplier from score
   */
  private getAcademicMultiplier(combinedScore: number): number {
    if (combinedScore >= 75) return PROBABILITY_CONFIG.academicPercentileMultipliers.above75th;
    if (combinedScore >= 50) return PROBABILITY_CONFIG.academicPercentileMultipliers.percentile50to75;
    if (combinedScore >= 25) return PROBABILITY_CONFIG.academicPercentileMultipliers.percentile25to50;
    return PROBABILITY_CONFIG.academicPercentileMultipliers.below25th;
  }

  /**
   * Get confidence level
   */
  private getConfidence(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): 'high' | 'medium' | 'low' {
    // Lower confidence for very selective schools
    if (school.admissionStats.acceptanceRate < 10) {
      return 'low';
    }
    if (school.admissionStats.acceptanceRate < 20) {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Generate probability explanation
   */
  private generateProbabilityExplanation(
    estimate: number,
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): string {
    if (estimate >= 50) {
      return `Profile is competitive for ${school.commonName}. Strong academic and extracurricular credentials support a reasonable chance of admission.`;
    }
    if (estimate >= 25) {
      return `Profile is in range for ${school.commonName} but faces significant competition. Many qualified applicants are not admitted due to limited spots.`;
    }
    if (estimate >= 10) {
      return `${school.commonName} is a reach. With a ${school.admissionStats.acceptanceRate}% acceptance rate, even strong applicants face long odds.`;
    }
    return `${school.commonName} is a significant reach. Focus application effort on schools with higher probability while still applying here if it's a top choice.`;
  }

  /**
   * Determine school category
   */
  private determineCategory(
    probabilityEstimate: number,
    school: CollegeAdmissionProfile
  ): SchoolCategory {
    // Adjust thresholds for very selective schools
    if (school.admissionStats.acceptanceRate < 10) {
      // For highly selective schools, even 15% is a reach
      if (probabilityEstimate >= 25) return 'target';
      if (probabilityEstimate >= 8) return 'reach';
      return 'reach';
    }

    // Standard thresholds
    if (probabilityEstimate >= 70) return 'likely';
    if (probabilityEstimate >= 35) return 'target';
    return 'reach';
  }

  // ============================================================================
  // INSIGHT GENERATION
  // ============================================================================

  /**
   * Generate college-specific insights
   */
  private generateCollegeInsights(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    fitDimensions: SchoolFitAnalysis['fitDimensions']
  ): SchoolFitAnalysis['collegeInsights'] {
    const whatTheyValueThatYouHave: string[] = [];
    const whatYouOfferTheyNeed: string[] = [];
    const potentialConcerns: string[] = [];

    // Check archetype alignment
    if (synthesis.applicationBrand.primaryArchetype !== 'undefined') {
      whatYouOfferTheyNeed.push(
        `${synthesis.applicationBrand.primaryArchetype.replace('the_', '').replace('_', ' ')} perspective`
      );
    }

    // Check spike alignment
    if (synthesis.componentEvaluations.activities.spikeAnalysis.hasClearSpike) {
      whatTheyValueThatYouHave.push(
        `Demonstrated depth in ${synthesis.componentEvaluations.activities.spikeAnalysis.spikeArea}`
      );
    }

    // Check awards
    if (synthesis.componentEvaluations.awards.distribution.summary.tier1Awards >= 1) {
      whatTheyValueThatYouHave.push('National/international recognition validates achievement');
    }

    // Check concerns
    if (fitDimensions.academic.score < 60) {
      potentialConcerns.push('Academic profile may be below typical admits');
    }
    if (!synthesis.componentEvaluations.activities.spikeAnalysis.hasClearSpike) {
      potentialConcerns.push('Profile may lack distinctive depth');
    }

    // Generate how to stand out
    const howToStandOut = this.generateHowToStandOut(school, synthesis);

    // Generate differentiation strategy
    const differentiationStrategy = this.generateDifferentiationStrategy(school, synthesis);

    return {
      whatTheyValueThatYouHave,
      whatYouOfferTheyNeed,
      potentialConcerns,
      howToStandOut,
      differentiationStrategy,
    };
  }

  /**
   * Generate how to stand out advice
   */
  private generateHowToStandOut(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): string {
    const spike = synthesis.componentEvaluations.activities.spikeAnalysis.spikeArea;

    if (spike) {
      return `Lead with your expertise in ${spike}. Show how this passion would contribute to ${school.commonName}'s community and how their resources would help you go deeper.`;
    }

    if (synthesis.applicationBrand.primaryArchetype !== 'undefined') {
      return `Lean into your "${synthesis.applicationBrand.primaryArchetype.replace('the_', '').replace('_', ' ')}" identity. Make essays reflect this coherent narrative.`;
    }

    return `Focus on authentic storytelling. ${school.commonName} values genuine voice over polished perfection.`;
  }

  /**
   * Generate differentiation strategy
   */
  private generateDifferentiationStrategy(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis
  ): string {
    const strengths = synthesis.strengthsAndConcerns.majorStrengths;
    const differentiators = synthesis.competitivePositioning.differentiators;

    if (differentiators.length > 0) {
      return `Your key differentiator is: ${differentiators[0]}. Build your ${school.commonName} application around this.`;
    }

    if (strengths.length > 0) {
      return `Emphasize ${strengths[0].strength.toLowerCase()} throughout your application materials.`;
    }

    return 'Focus on authentic personal narrative and specific connection to school.';
  }

  /**
   * Generate application strategy
   */
  private generateApplicationStrategy(
    school: CollegeAdmissionProfile,
    probability: SchoolFitAnalysis['admissionProbability'],
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis['applicationStrategy'] {
    // Determine recommended decision type
    const { type: recommendedDecisionType, reasoning: decisionTypeReasoning } =
      this.recommendDecisionType(school, probability, goals);

    // Determine if should apply
    const shouldApply = probability.estimate >= 5 || goals.targetSchools?.includes(school.collegeId);
    const applyReasoning = shouldApply
      ? `${school.commonName} is a reasonable fit based on your profile and goals.`
      : `Very low probability of admission. Consider if application effort is worth it.`;

    // Determine priority
    const priority: 'high' | 'medium' | 'low' =
      probability.estimate >= 30 ? 'high' :
      probability.estimate >= 15 ? 'medium' : 'low';

    return {
      recommendedDecisionType,
      decisionTypeReasoning,
      shouldApply,
      applyReasoning,
      priority,
    };
  }

  /**
   * Recommend decision type (ED/EA/RD)
   */
  private recommendDecisionType(
    school: CollegeAdmissionProfile,
    probability: SchoolFitAnalysis['admissionProbability'],
    goals: GoalsAspirations
  ): { type: DecisionType; reasoning: string } {
    // If ED available and significant boost
    if (school.admissionStats.acceptanceRateED &&
        school.admissionStats.acceptanceRateED > school.admissionStats.acceptanceRate * 1.5) {
      if (goals.financialAidNeed !== 'high') {
        return {
          type: 'ED',
          reasoning: `ED acceptance rate (${school.admissionStats.acceptanceRateED}%) is significantly higher than RD. Strong choice if ${school.commonName} is your top choice.`,
        };
      } else {
        return {
          type: 'RD',
          reasoning: `ED is binding which limits ability to compare financial aid packages. Given high financial need, apply RD to compare offers.`,
        };
      }
    }

    // REA for schools like Harvard/Stanford/Princeton
    if (school.deadlines.REA) {
      return {
        type: 'REA',
        reasoning: `${school.commonName} offers Restrictive Early Action with slightly higher admission rate. No binding commitment allows comparing options.`,
      };
    }

    // EA if available
    if (school.deadlines.EA) {
      return {
        type: 'EA',
        reasoning: `Early Action gives earlier decision without binding commitment. Recommended if prepared by ${school.deadlines.EA}.`,
      };
    }

    // Default to RD
    return {
      type: 'RD',
      reasoning: 'Regular Decision is the standard option. Use additional time to strengthen application.',
    };
  }

  /**
   * Generate demonstrated interest guidance
   */
  private generateDemonstratedInterestGuidance(
    school: CollegeAdmissionProfile
  ): SchoolFitAnalysis['demonstratedInterestGuidance'] {
    const recommendedActions: string[] = [];
    const timeline: string[] = [];

    if (school.demonstratedInterest.tracksInterest) {
      recommendedActions.push(...school.demonstratedInterest.howToShow);
      recommendedActions.push('Attend information sessions (virtual or in-person)');
      recommendedActions.push('Visit campus if possible');
      recommendedActions.push('Engage with admissions emails and events');

      timeline.push('Sign up for mailing list immediately');
      timeline.push('Attend info session before application deadline');
      timeline.push('Visit campus before ED/EA if possible');
    } else {
      recommendedActions.push('Demonstrated interest is NOT tracked by this school');
      recommendedActions.push('Focus application effort on essay quality, not visits');
      recommendedActions.push('Research school thoroughly for "Why Us" essay');
    }

    return {
      tracksInterest: school.demonstratedInterest.tracksInterest,
      importance: school.demonstratedInterest.importance,
      recommendedActions,
      timeline,
    };
  }

  /**
   * Generate supplemental essay strategy
   */
  private generateSupplementalEssayStrategy(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis['supplementalEssayStrategy'] {
    const spike = synthesis.componentEvaluations.activities.spikeAnalysis.spikeArea;
    const archetype = synthesis.applicationBrand.primaryArchetype;

    // Generate narrative alignment advice
    let narrativeAlignment = '';
    if (archetype !== 'undefined') {
      narrativeAlignment = `Connect essays to your "${archetype.replace('the_', '').replace('_', ' ')}" identity. `;
    }
    if (spike) {
      narrativeAlignment += `Weave in your passion for ${spike} where relevant.`;
    }

    // Generate unique angle
    const uniqueAngle = synthesis.uniqueValue.primaryDifferentiator.what;

    // Common mistakes
    const commonMistakes = [
      'Generic "Why Us" essay that could apply to any school',
      'Listing programs/resources without explaining personal connection',
      'Repeating information from other parts of application',
      'Not answering the actual question asked',
    ];

    // Example approaches
    const exampleApproaches = [
      `Connect your ${spike || 'interests'} to specific ${school.commonName} resources`,
      `Mention professors whose research aligns with your interests`,
      `Reference unique programs or courses that attracted you`,
      `Show how you\'d contribute to campus community`,
    ];

    return {
      numberOfEssays: school.applicationRequirements.essayCount - 1, // Excluding common app essay
      keyPrompts: ['Why this school', 'Additional information', 'Community contribution'],
      narrativeAlignment,
      uniqueAngle,
      commonMistakes,
      exampleApproaches,
    };
  }

  /**
   * Generate why this school reasons
   */
  private generateWhyThisSchool(
    school: CollegeAdmissionProfile,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): SchoolFitAnalysis['whyThisSchool'] {
    const academicReasons: string[] = [];
    const cultureReasons: string[] = [];
    const careerReasons: string[] = [];
    const uniqueOpportunities: string[] = [];
    const potentialConcerns: string[] = [];

    // Academic reasons
    if (school.academicStrengths.strongMajors.some(m =>
      m.toLowerCase().includes(goals.intendedMajor.toLowerCase()) ||
      goals.intendedMajor.toLowerCase().includes(m.toLowerCase())
    )) {
      academicReasons.push(`Strong ${goals.intendedMajor} program`);
    }
    if (school.academicStrengths.lesserKnownStrengths.length > 0) {
      academicReasons.push(`Hidden gem programs: ${school.academicStrengths.lesserKnownStrengths[0]}`);
    }

    // Culture reasons
    cultureReasons.push(...school.culture.vibe.slice(0, 2).map(v => `${v} environment`));

    // Career reasons
    if (school.collegeId === 'upenn' || school.collegeId === 'northwestern') {
      careerReasons.push('Strong career services and recruiting presence');
    }
    if (school.location.city === 'New York' || school.location.city === 'Boston') {
      careerReasons.push(`${school.location.city} location for internship opportunities`);
    }

    // Unique opportunities
    uniqueOpportunities.push(...school.institutionalValues.coreValues.slice(0, 2));

    // Potential concerns
    potentialConcerns.push(...school.culture.notRightFor);

    return {
      academicReasons,
      cultureReasons,
      careerReasons,
      uniqueOpportunities,
      potentialConcerns,
    };
  }

  // ============================================================================
  // LIST MANAGEMENT
  // ============================================================================

  /**
   * Create categorized school list
   */
  private createCategorizedList(
    assessments: Record<string, SchoolFitAnalysis>
  ): CategorizedSchoolList {
    const reach: SchoolFitAssessment[] = [];
    const target: SchoolFitAssessment[] = [];
    const likely: SchoolFitAssessment[] = [];

    for (const analysis of Object.values(assessments)) {
      const assessment: SchoolFitAssessment = {
        schoolId: analysis.schoolId,
        schoolName: analysis.schoolName,
        fitScore: analysis.overallFitScore,
        category: analysis.category,
        probabilityEstimate: analysis.admissionProbability.estimate,
        oneLineSummary: this.generateOneLineSummary(analysis),
        topReasons: analysis.whyThisSchool.academicReasons.slice(0, 2),
        topConcerns: analysis.collegeInsights.potentialConcerns.slice(0, 2),
      };

      switch (analysis.category) {
        case 'reach':
          reach.push(assessment);
          break;
        case 'target':
          target.push(assessment);
          break;
        case 'likely':
          likely.push(assessment);
          break;
      }
    }

    // Sort by fit score within each category
    reach.sort((a, b) => b.fitScore - a.fitScore);
    target.sort((a, b) => b.fitScore - a.fitScore);
    likely.sort((a, b) => b.fitScore - a.fitScore);

    // Assess list balance
    const totalSchools = reach.length + target.length + likely.length;
    let listBalance: CategorizedSchoolList['summary']['listBalance'];

    if (totalSchools < 6) {
      listBalance = 'needs_more_schools';
    } else if (reach.length > target.length + likely.length) {
      listBalance = 'too_top_heavy';
    } else if (likely.length > reach.length + target.length) {
      listBalance = 'too_conservative';
    } else {
      listBalance = 'well_balanced';
    }

    return {
      reach,
      target,
      likely,
      summary: {
        totalSchools,
        reachCount: reach.length,
        targetCount: target.length,
        likelyCount: likely.length,
        listBalance,
        listAssessment: this.generateListAssessment(reach.length, target.length, likely.length),
      },
    };
  }

  /**
   * Generate one-line summary for assessment
   */
  private generateOneLineSummary(analysis: SchoolFitAnalysis): string {
    const probability = analysis.admissionProbability.estimate;
    const fit = analysis.overallFitScore;

    if (probability >= 40 && fit >= 70) {
      return `Strong match with good admission chances`;
    }
    if (probability >= 40) {
      return `Reasonable chances, decent fit`;
    }
    if (fit >= 70) {
      return `Great fit but competitive admission`;
    }
    if (probability < 15) {
      return `Significant reach - apply if top choice`;
    }
    return `Competitive reach worth considering`;
  }

  /**
   * Generate list assessment text
   */
  private generateListAssessment(reach: number, target: number, likely: number): string {
    const total = reach + target + likely;

    if (total < 6) {
      return 'List needs more schools. Aim for 8-12 total with balance across categories.';
    }

    if (reach > target + likely) {
      return 'List is top-heavy. Add more target and likely schools to ensure admission somewhere.';
    }

    if (likely > reach + target) {
      return 'List is conservative. Consider adding reaches if there are dream schools.';
    }

    return 'List has good balance. Ensure financial fit and demonstrated interest where tracked.';
  }

  // ============================================================================
  // STRATEGY RECOMMENDATIONS
  // ============================================================================

  /**
   * Generate strategy recommendations
   */
  private generateStrategyRecommendations(
    assessments: Record<string, SchoolFitAnalysis>,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations,
    schoolList: CategorizedSchoolList
  ): ApplicationStrategyRecommendations {
    // Recommend list size
    const recommendedListSize = this.recommendListSize(synthesis.profileStrength.tier);

    // ED recommendation
    const earlyDecisionRecommendation = this.generateEDRecommendation(
      assessments,
      goals
    );

    // EA recommendations
    const earlyActionRecommendations = this.generateEARecommendations(assessments);

    // Demonstrated interest priorities
    const demonstratedInterestPriorities = this.generateDIPriorities(assessments);

    // Essay priorities
    const supplementalEssayPriorities = this.generateEssayPriorities(assessments);

    // Timeline
    const applicationTimeline = this.generateTimeline();

    return {
      recommendedListSize,
      earlyDecisionRecommendation,
      earlyActionRecommendations,
      demonstratedInterestPriorities,
      supplementalEssayPriorities,
      applicationTimeline,
    };
  }

  /**
   * Recommend list size
   */
  private recommendListSize(tier: ProfileTier): ApplicationStrategyRecommendations['recommendedListSize'] {
    const recommendations: Record<ProfileTier, { total: number; reach: number; target: number; likely: number; reasoning: string }> = {
      exceptional: {
        total: 10,
        reach: 4,
        target: 4,
        likely: 2,
        reasoning: 'With an exceptional profile, you can afford more reaches. Still include safeties.',
      },
      highly_competitive: {
        total: 12,
        reach: 4,
        target: 5,
        likely: 3,
        reasoning: 'Balance reaches with solid targets. The target schools are your best opportunities.',
      },
      competitive: {
        total: 12,
        reach: 3,
        target: 5,
        likely: 4,
        reasoning: 'Focus on targets where you have competitive chances. Include realistic safeties.',
      },
      developing: {
        total: 10,
        reach: 2,
        target: 4,
        likely: 4,
        reasoning: 'Be realistic about reach chances. Ensure strong safety and target schools.',
      },
      building: {
        total: 8,
        reach: 1,
        target: 3,
        likely: 4,
        reasoning: 'Focus on match and safety schools. Include one dream reach if meaningful.',
      },
    };

    return recommendations[tier];
  }

  /**
   * Generate ED recommendation
   */
  private generateEDRecommendation(
    assessments: Record<string, SchoolFitAnalysis>,
    goals: GoalsAspirations
  ): ApplicationStrategyRecommendations['earlyDecisionRecommendation'] | undefined {
    // Don't recommend ED for high financial need
    if (goals.financialAidNeed === 'high') {
      return undefined;
    }

    // Find schools with significant ED boost
    const edSchools = Object.values(assessments).filter(a => {
      const school = getCollegeProfile(a.schoolId);
      return school?.admissionStats.acceptanceRateED &&
             school.admissionStats.acceptanceRateED > school.admissionStats.acceptanceRate * 1.5;
    });

    if (edSchools.length === 0) return undefined;

    // Sort by probability
    edSchools.sort((a, b) => b.admissionProbability.estimate - a.admissionProbability.estimate);

    const topED = edSchools[0];
    const school = getCollegeProfile(topED.schoolId)!;

    return {
      school: topED.schoolName,
      reasoning: `ED to ${topED.schoolName} offers ${school.admissionStats.acceptanceRateED}% acceptance rate vs ${school.admissionStats.acceptanceRate}% RD. Significant boost for committed applicants.`,
      riskAssessment: 'ED is binding - ensure this is your clear first choice and financials work.',
      alternatives: edSchools.slice(1, 3).map(s => s.schoolName),
      financialConsiderations: school.financial.meetsFullNeed
        ? 'School meets 100% of demonstrated need, reducing financial risk.'
        : 'May not meet full need. Run net price calculator before committing.',
    };
  }

  /**
   * Generate EA recommendations
   */
  private generateEARecommendations(
    assessments: Record<string, SchoolFitAnalysis>
  ): ApplicationStrategyRecommendations['earlyActionRecommendations'] {
    const eaSchools = Object.values(assessments).filter(a => {
      const school = getCollegeProfile(a.schoolId);
      return school?.deadlines.EA || school?.deadlines.REA;
    });

    // Sort by fit score
    eaSchools.sort((a, b) => b.overallFitScore - a.overallFitScore);

    return {
      schools: eaSchools.slice(0, 4).map(s => s.schoolName),
      reasoning: 'Early Action allows earlier decisions without binding commitment. Apply to top choices where EA is offered.',
      priorityOrder: eaSchools.slice(0, 4).map(s => s.schoolName),
    };
  }

  /**
   * Generate demonstrated interest priorities
   */
  private generateDIPriorities(
    assessments: Record<string, SchoolFitAnalysis>
  ): ApplicationStrategyRecommendations['demonstratedInterestPriorities'] {
    return Object.values(assessments)
      .filter(a => a.demonstratedInterestGuidance.tracksInterest)
      .sort((a, b) => b.admissionProbability.estimate - a.admissionProbability.estimate)
      .slice(0, 5)
      .map(a => ({
        schoolId: a.schoolId,
        schoolName: a.schoolName,
        importance: a.demonstratedInterestGuidance.importance,
        actionsToTake: a.demonstratedInterestGuidance.recommendedActions.slice(0, 3),
      }));
  }

  /**
   * Generate essay priorities
   */
  private generateEssayPriorities(
    assessments: Record<string, SchoolFitAnalysis>
  ): ApplicationStrategyRecommendations['supplementalEssayPriorities'] {
    return Object.values(assessments)
      .sort((a, b) => b.admissionProbability.estimate - a.admissionProbability.estimate)
      .slice(0, 8)
      .map(a => ({
        schoolId: a.schoolId,
        schoolName: a.schoolName,
        priority: a.applicationStrategy.priority,
        reasoning: `${a.supplementalEssayStrategy.numberOfEssays} supplemental essays needed`,
      }));
  }

  /**
   * Generate application timeline
   */
  private generateTimeline(): ApplicationStrategyRecommendations['applicationTimeline'] {
    return [
      {
        phase: 'Summer',
        deadline: 'August 31',
        tasks: [
          'Finalize school list',
          'Draft common app essay',
          'Research each school for supplementals',
          'Request teacher recommendations',
        ],
      },
      {
        phase: 'Early Fall',
        deadline: 'October 15',
        tasks: [
          'Complete ED/REA supplemental essays',
          'Finalize common app essay',
          'Have essays reviewed',
          'Submit ED/REA applications',
        ],
      },
      {
        phase: 'Late Fall',
        deadline: 'November 1-15',
        tasks: [
          'Submit ED/EA applications',
          'Begin RD supplementals',
          'Follow up on recommendations',
        ],
      },
      {
        phase: 'Winter',
        deadline: 'January 1-15',
        tasks: [
          'Submit all RD applications',
          'Send additional materials if requested',
          'Complete financial aid applications (FAFSA/CSS)',
        ],
      },
    ];
  }

  // ============================================================================
  // SUGGESTIONS
  // ============================================================================

  /**
   * Generate school suggestions
   */
  private generateSchoolSuggestions(
    assessments: Record<string, SchoolFitAnalysis>,
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations,
    schoolList: CategorizedSchoolList
  ): SchoolSuggestions {
    // Find underrated schools
    const underrated = this.findUnderratedSchools(assessments, goals);

    // Find strategic adds
    const strategicAdds = this.findStrategicAdds(assessments, schoolList, goals);

    // Find schools to reconsider
    const reconsider = this.findSchoolsToReconsider(assessments);

    return {
      underrated,
      strategicAdds,
      reconsider,
    };
  }

  /**
   * Find underrated schools
   */
  private findUnderratedSchools(
    assessments: Record<string, SchoolFitAnalysis>,
    goals: GoalsAspirations
  ): SchoolSuggestions['underrated'] {
    // Schools with high fit but not being considered
    return Object.values(assessments)
      .filter(a => a.overallFitScore >= 70 && a.admissionProbability.estimate >= 30)
      .sort((a, b) => b.overallFitScore - a.overallFitScore)
      .slice(0, 3)
      .map(a => ({
        school: {
          schoolId: a.schoolId,
          schoolName: a.schoolName,
          fitScore: a.overallFitScore,
          category: a.category,
          probabilityEstimate: a.admissionProbability.estimate,
          oneLineSummary: this.generateOneLineSummary(a),
          topReasons: a.whyThisSchool.academicReasons.slice(0, 2),
          topConcerns: [],
        },
        whyConsider: `Strong fit (${a.overallFitScore}) with reasonable admission chances (${a.admissionProbability.estimate}%)`,
        fitStrength: a.fitDimensions.program.strengths[0] || 'Good overall fit',
      }));
  }

  /**
   * Find strategic adds
   */
  private findStrategicAdds(
    assessments: Record<string, SchoolFitAnalysis>,
    schoolList: CategorizedSchoolList,
    goals: GoalsAspirations
  ): SchoolSuggestions['strategicAdds'] {
    const adds: SchoolSuggestions['strategicAdds'] = [];

    // If list is too top-heavy, suggest targets
    if (schoolList.summary.listBalance === 'too_top_heavy') {
      const targets = Object.values(assessments)
        .filter(a => a.category === 'target')
        .sort((a, b) => b.overallFitScore - a.overallFitScore);

      if (targets.length > 0) {
        adds.push({
          school: {
            schoolId: targets[0].schoolId,
            schoolName: targets[0].schoolName,
            fitScore: targets[0].overallFitScore,
            category: 'target',
            probabilityEstimate: targets[0].admissionProbability.estimate,
            oneLineSummary: this.generateOneLineSummary(targets[0]),
            topReasons: targets[0].whyThisSchool.academicReasons.slice(0, 2),
            topConcerns: [],
          },
          whatItAdds: 'Strong target to balance reach-heavy list',
          category: 'target',
        });
      }
    }

    return adds;
  }

  /**
   * Find schools to reconsider
   */
  private findSchoolsToReconsider(
    assessments: Record<string, SchoolFitAnalysis>
  ): SchoolSuggestions['reconsider'] {
    return Object.values(assessments)
      .filter(a =>
        a.admissionProbability.estimate < 5 &&
        a.overallFitScore < 50
      )
      .map(a => ({
        schoolId: a.schoolId,
        schoolName: a.schoolName,
        reason: `Low probability (${a.admissionProbability.estimate}%) and below-average fit (${a.overallFitScore})`,
        alternative: undefined,
      }));
  }

  // ============================================================================
  // ASSESSMENT
  // ============================================================================

  /**
   * Assess the overall list
   */
  private assessList(
    schoolList: CategorizedSchoolList,
    tier: ProfileTier
  ): SchoolFitOutput['listAssessment'] {
    const { reachCount, targetCount, likelyCount, totalSchools, listBalance } = schoolList.summary;

    let overallStrength: 'excellent' | 'good' | 'fair' | 'needs_work';
    const strengths: string[] = [];
    const gaps: string[] = [];
    const recommendations: string[] = [];

    // Assess overall strength
    if (listBalance === 'well_balanced' && totalSchools >= 8) {
      overallStrength = 'excellent';
      strengths.push('Well-balanced list across categories');
    } else if (totalSchools >= 6 && targetCount >= 3) {
      overallStrength = 'good';
      strengths.push('Solid target school representation');
    } else if (totalSchools >= 4) {
      overallStrength = 'fair';
    } else {
      overallStrength = 'needs_work';
    }

    // Identify gaps
    if (likelyCount < 2) {
      gaps.push('Not enough safety/likely schools');
      recommendations.push('Add 2-3 likely schools to ensure admission');
    }
    if (targetCount < 3) {
      gaps.push('Target schools need strengthening');
      recommendations.push('Add more target schools where you have competitive chances');
    }
    if (reachCount === 0) {
      gaps.push('No reach schools - may be too conservative');
      recommendations.push('Consider adding dream schools if they exist');
    }

    // Generate narrative
    const narrative = this.generateListNarrative(schoolList, tier, overallStrength);

    return {
      overallStrength,
      narrative,
      strengths,
      gaps,
      recommendations,
    };
  }

  /**
   * Generate list narrative
   */
  private generateListNarrative(
    schoolList: CategorizedSchoolList,
    tier: ProfileTier,
    strength: string
  ): string {
    const { reachCount, targetCount, likelyCount, totalSchools } = schoolList.summary;

    let narrative = `Your current list includes ${totalSchools} schools: ${reachCount} reaches, ${targetCount} targets, and ${likelyCount} likely/safety schools. `;

    switch (strength) {
      case 'excellent':
        narrative += 'The list is well-balanced and sets you up for success with options across selectivity levels.';
        break;
      case 'good':
        narrative += 'The list is solid but could be strengthened with adjustments to ensure coverage across categories.';
        break;
      case 'fair':
        narrative += 'The list needs some work. Focus on adding schools in the categories where you\'re lacking.';
        break;
      default:
        narrative += 'The list needs significant development. Build out each category before application season.';
    }

    return narrative;
  }

  /**
   * Find best matches
   */
  private findBestMatches(
    assessments: Record<string, SchoolFitAnalysis>
  ): SchoolFitOutput['bestMatches'] {
    return Object.values(assessments)
      .sort((a, b) => {
        // Sort by combination of fit and probability
        const scoreA = a.overallFitScore * 0.6 + a.admissionProbability.estimate * 0.4;
        const scoreB = b.overallFitScore * 0.6 + b.admissionProbability.estimate * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(a => ({
        schoolId: a.schoolId,
        schoolName: a.schoolName,
        fitScore: a.overallFitScore,
        whyBestMatch: `${a.overallFitScore} fit score with ${a.admissionProbability.estimate}% admission probability`,
      }));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(
    assessments: Record<string, SchoolFitAnalysis>
  ): number {
    // Confidence based on data completeness and school coverage
    const schoolCount = Object.keys(assessments).length;
    const avgConfidence = Object.values(assessments).reduce((sum, a) => {
      const conf = a.admissionProbability.confidence === 'high' ? 0.9 :
                   a.admissionProbability.confidence === 'medium' ? 0.7 : 0.5;
      return sum + conf;
    }, 0) / Math.max(1, schoolCount);

    return Math.round(avgConfidence * 100) / 100;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const schoolFitEngine = new SchoolFitEngine();
