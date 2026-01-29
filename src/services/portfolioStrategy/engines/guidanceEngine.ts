/**
 * Guidance & Action Engine
 *
 * Transforms analysis into actionable recommendations with prioritized
 * action items, milestones, calendars, and progress tracking.
 *
 * QUALITY PRINCIPLES:
 * - Actions are specific and actionable
 * - Priorities reflect actual impact
 * - Timeline is realistic and adaptive
 * - Progress tracking enables accountability
 *
 * This is where analysis becomes transformation.
 */

import {
  GuidanceReport,
  ActionItem,
  ActionItemSummary,
  ActionPriority,
  ActionCategory,
  ActionEffort,
  ActionStatus,
  TimeHorizon,
  AcademicGuidance,
  ActivitiesGuidance,
  AwardsGuidance,
  EssayGuidance,
  SchoolListGuidance,
  Milestone,
  ProgressSummary,
  GuidanceGenerationConfig,
} from '../types/guidance';
import { HolisticProfileSynthesis, GoalsAspirations, ProfileTier } from '../types/synthesis';
import { SchoolFitOutput } from '../types/schoolFit';
import { generateInputHash } from '../utils/scoring';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: GuidanceGenerationConfig = {
  currentDate: new Date().toISOString().split('T')[0],
  currentGradeLevel: 11, // Junior year
  targetGraduationYear: new Date().getFullYear() + 2,
  preferences: {
    preferredPace: 'balanced',
    availableHoursPerWeek: 10,
    focusAreas: ['academic', 'activity', 'essay', 'school'],
  },
  priorityRules: [],
  deadlineBuffer: 14, // 2 weeks
};

// ============================================================================
// ACTION ID GENERATOR
// ============================================================================

let actionIdCounter = 0;
function generateActionId(category: ActionCategory): string {
  return `${category}_${Date.now()}_${++actionIdCounter}`;
}

// ============================================================================
// GUIDANCE ENGINE CLASS
// ============================================================================

export class GuidanceEngine {
  private config: GuidanceGenerationConfig;

  constructor(config?: Partial<GuidanceGenerationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate complete guidance report
   */
  async generateGuidance(
    synthesis: HolisticProfileSynthesis,
    schoolFit: SchoolFitOutput,
    goals: GoalsAspirations,
    config?: Partial<GuidanceGenerationConfig>
  ): Promise<GuidanceReport> {
    // Merge config
    const effectiveConfig = { ...this.config, ...config };

    // Generate all actions
    const allActions: ActionItem[] = [];

    // Generate category-specific guidance
    const academicGuidance = this.generateAcademicGuidance(synthesis, goals);
    allActions.push(...academicGuidance.improvements);
    allActions.push(...academicGuidance.testingStrategy.recommendations);

    const activitiesGuidance = this.generateActivitiesGuidance(synthesis, goals);
    for (const rec of activitiesGuidance.deepenRecommendations) {
      allActions.push(...rec.actions);
    }
    for (const rec of activitiesGuidance.addRecommendations) {
      allActions.push(rec.howToStart);
    }

    const awardsGuidance = this.generateAwardsGuidance(synthesis, goals);
    for (const rec of awardsGuidance.pursuerecommendations) {
      allActions.push(rec.howToPrepare);
    }

    const essayGuidance = this.generateEssayGuidance(synthesis, goals, effectiveConfig);
    allActions.push(...essayGuidance.preparationActions);

    const schoolListGuidance = this.generateSchoolListGuidance(synthesis, schoolFit, goals);
    allActions.push(...schoolListGuidance.strategyActions);

    // Sort all actions by priority
    const sortedActions = this.sortActionsByPriority(allActions);

    // Categorize by time horizon
    const priorityActions = this.categorizeByTimeHorizon(sortedActions);

    // Generate milestones
    const milestones = this.generateMilestones(effectiveConfig, sortedActions);

    // Generate progress summary
    const progress = this.generateProgressSummary(sortedActions, milestones);

    // Generate application calendar
    const applicationCalendar = this.generateApplicationCalendar(
      sortedActions,
      schoolFit,
      effectiveConfig
    );

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      synthesis,
      sortedActions,
      academicGuidance,
      activitiesGuidance
    );

    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(synthesis, schoolFit, sortedActions);

    // Build report
    const report: GuidanceReport = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      executiveSummary,
      priorityActions,
      categoryGuidance: {
        academic: academicGuidance,
        activities: activitiesGuidance,
        awards: awardsGuidance,
        essays: essayGuidance,
        schools: schoolListGuidance,
      },
      milestones,
      progress,
      applicationCalendar,
      riskAssessment,
      allActions: sortedActions,
      inputDataHash: generateInputHash({ synthesis: synthesis.inputDataHash, schoolFit: schoolFit.inputDataHash }),
      confidenceScore: synthesis.confidenceScore * 0.7 + schoolFit.confidenceScore * 0.3,
    };

    return report;
  }

  // ============================================================================
  // ACADEMIC GUIDANCE
  // ============================================================================

  /**
   * Generate academic guidance
   */
  private generateAcademicGuidance(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): AcademicGuidance {
    const academic = synthesis.componentEvaluations.academic;

    // Determine current strength
    const currentStrength =
      academic.overallTier === 'exceptional' ? 'Exceptional academic foundation' :
      academic.overallTier === 'highly_competitive' ? 'Strong academic credentials' :
      academic.overallTier === 'competitive' ? 'Competitive academics with room for growth' :
      academic.overallTier === 'developing' ? 'Academic profile needs strengthening' :
      'Academic foundation requires significant development';

    // Generate course recommendations
    const courseRecommendations = this.generateCourseRecommendations(academic, goals);

    // GPA improvement
    const gpaImprovement = this.generateGPAImprovement(academic);

    // Testing strategy
    const testingStrategy = this.generateTestingStrategy(academic, goals);

    // Generate improvement actions
    const improvements = this.generateAcademicImprovements(academic, goals);

    return {
      currentStrength,
      overallAssessment: this.generateAcademicAssessment(academic),
      courseRecommendations,
      gpaImprovement,
      testingStrategy,
      improvements,
    };
  }

  /**
   * Generate course recommendations
   */
  private generateCourseRecommendations(
    academic: HolisticProfileSynthesis['componentEvaluations']['academic'],
    goals: GoalsAspirations
  ): AcademicGuidance['courseRecommendations'] {
    const forNextSemester: string[] = [];
    const forNextYear: string[] = [];

    // Based on intended major
    const major = goals.intendedMajor.toLowerCase();

    if (major.includes('computer') || major.includes('engineering') || major.includes('math')) {
      forNextSemester.push('Take most rigorous math course available');
      forNextSemester.push('Continue AP/IB science sequence');
      forNextYear.push('AP Computer Science A if not already taken');
      forNextYear.push('Multivariable Calculus/Linear Algebra if available');
    } else if (major.includes('bio') || major.includes('pre-med') || major.includes('chemistry')) {
      forNextSemester.push('AP/IB Biology and Chemistry');
      forNextSemester.push('Continue advanced math sequence');
      forNextYear.push('AP Physics C if available');
      forNextYear.push('Research opportunity if available');
    } else if (major.includes('english') || major.includes('history') || major.includes('political')) {
      forNextSemester.push('AP English Literature or Language');
      forNextSemester.push('AP/IB History course');
      forNextYear.push('Consider AP Seminar/Research if available');
      forNextYear.push('Advanced writing course');
    } else {
      forNextSemester.push('Continue most rigorous courses in areas of interest');
      forNextSemester.push('Maintain balance across subjects');
      forNextYear.push('Challenge yourself with new AP/IB courses');
    }

    // If rigor needs strengthening
    if (academic.courseRigor.rigorLevel === 'basic' || academic.courseRigor.rigorLevel === 'moderate') {
      forNextSemester.push('Add at least one more AP/IB course if possible');
    }

    return {
      forNextSemester,
      forNextYear,
      reasoning: `Course selection should demonstrate continued rigor aligned with ${goals.intendedMajor} interests.`,
    };
  }

  /**
   * Generate GPA improvement plan
   */
  private generateGPAImprovement(
    academic: HolisticProfileSynthesis['componentEvaluations']['academic']
  ): AcademicGuidance['gpaImprovement'] | undefined {
    const currentGPA = academic.gpa.unweightedGPA || academic.gpa.weightedGPA || 0;

    // Only suggest improvement if below competitive threshold
    if (currentGPA >= 3.85) {
      return undefined;
    }

    const targetGPA = Math.min(4.0, currentGPA + 0.15);

    const strategies: string[] = [];

    if (currentGPA < 3.5) {
      strategies.push('Focus on understanding core concepts, not just completing assignments');
      strategies.push('Attend office hours regularly');
      strategies.push('Form study groups for challenging subjects');
      strategies.push('Consider tutoring in weakest subjects');
    } else {
      strategies.push('Identify specific courses pulling down GPA and focus there');
      strategies.push('Work with teachers to understand areas for improvement');
      strategies.push('Start assignments early to allow for revision');
    }

    strategies.push('Prioritize sleep and health - they impact academic performance');

    return {
      needed: true,
      targetGPA,
      strategies,
    };
  }

  /**
   * Generate testing strategy
   */
  private generateTestingStrategy(
    academic: HolisticProfileSynthesis['componentEvaluations']['academic'],
    goals: GoalsAspirations
  ): AcademicGuidance['testingStrategy'] {
    const recommendations: ActionItem[] = [];

    // Determine current status
    let currentStatus = 'No test scores on file';
    let retakeAdvice: string | undefined;

    if (academic.testScores) {
      const { satScore, actScore, submissionDecision } = academic.testScores;

      if (satScore && satScore > 0) {
        currentStatus = `SAT: ${satScore}`;
        if (submissionDecision?.shouldSubmit === false) {
          currentStatus += ' (recommend not submitting)';
          retakeAdvice = submissionDecision.recommendation;
        }
      }
      if (actScore && actScore > 0) {
        currentStatus += satScore ? `, ACT: ${actScore}` : `ACT: ${actScore}`;
      }

      // Retake recommendation
      if (satScore && satScore < 1500) {
        recommendations.push(this.createActionItem({
          title: 'Consider SAT retake',
          description: `Current score of ${satScore} may benefit from retake. Target 1520+ for T20 schools.`,
          category: 'academic',
          priority: satScore < 1400 ? 'high' : 'medium',
          timeHorizon: 'short_term',
          impact: {
            description: 'Higher test scores can improve competitiveness',
            magnitude: 'moderate',
            affectedAreas: ['academic profile', 'school options'],
          },
          effort: { level: 'significant', hoursRequired: 40, complexity: 'moderate', dependencies: [] },
          steps: [
            { step: 'Identify weakest areas from score report' },
            { step: 'Create focused study plan' },
            { step: 'Use official practice tests' },
            { step: 'Register for next available test date' },
          ],
        }));

        retakeAdvice = `Score of ${satScore} is competitive but a retake targeting 1520+ could strengthen applications.`;
      }
    } else {
      // No scores - need to take tests
      recommendations.push(this.createActionItem({
        title: 'Take SAT or ACT',
        description: 'Many selective schools still value test scores. Take both to see which suits you better.',
        category: 'academic',
        priority: 'high',
        timeHorizon: 'short_term',
        impact: {
          description: 'Test scores provide another data point for admissions',
          magnitude: 'significant',
          affectedAreas: ['academic profile', 'school options'],
        },
        effort: { level: 'major', hoursRequired: 60, complexity: 'moderate', dependencies: [] },
        steps: [
          { step: 'Take practice test of both SAT and ACT' },
          { step: 'Choose primary test based on results' },
          { step: 'Create study plan' },
          { step: 'Register for test date' },
        ],
      }));
    }

    return {
      currentStatus,
      recommendations,
      retakeAdvice,
      superscoreStrategy: 'Many schools superscore. If retaking, focus on your weaker section.',
    };
  }

  /**
   * Generate academic improvement actions
   */
  private generateAcademicImprovements(
    academic: HolisticProfileSynthesis['componentEvaluations']['academic'],
    goals: GoalsAspirations
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    // GPA improvement action
    if (academic.overallTier === 'developing' || academic.overallTier === 'needs_improvement') {
      actions.push(this.createActionItem({
        title: 'Focus on GPA improvement',
        description: 'Dedicate additional time to academics to raise GPA.',
        category: 'academic',
        priority: 'critical',
        timeHorizon: 'ongoing',
        impact: {
          description: 'GPA is foundational for competitive applications',
          magnitude: 'significant',
          affectedAreas: ['academic profile', 'school options'],
          potentialScoreIncrease: 10,
        },
        effort: { level: 'major', hoursRequired: 100, complexity: 'moderate', dependencies: [] },
        steps: [
          { step: 'Identify courses where improvement is possible' },
          { step: 'Create weekly study schedule' },
          { step: 'Attend office hours for challenging subjects' },
          { step: 'Form study groups' },
          { step: 'Track grades weekly to monitor progress' },
        ],
      }));
    }

    // Course rigor action
    if (academic.courseRigor.rigorLevel !== 'exceptional' && academic.courseRigor.rigorLevel !== 'strong') {
      actions.push(this.createActionItem({
        title: 'Increase course rigor',
        description: 'Add more AP/IB/honors courses to strengthen academic profile.',
        category: 'academic',
        priority: 'high',
        timeHorizon: 'medium_term',
        impact: {
          description: 'Course rigor demonstrates readiness for college-level work',
          magnitude: 'moderate',
          affectedAreas: ['academic profile'],
        },
        effort: { level: 'significant', complexity: 'moderate', dependencies: ['course availability'] },
        steps: [
          { step: 'Review available AP/IB courses at your school' },
          { step: 'Discuss with counselor about adding rigor' },
          { step: 'Register for more challenging courses next semester' },
        ],
      }));
    }

    return actions;
  }

  /**
   * Generate academic assessment text
   */
  private generateAcademicAssessment(
    academic: HolisticProfileSynthesis['componentEvaluations']['academic']
  ): string {
    const tier = academic.overallTier;
    const gpa = academic.gpa.tier;
    const rigor = academic.courseRigor.rigorLevel;

    return `Academic profile is ${tier} with ${gpa} GPA and ${rigor} course rigor. ` +
           `${academic.gpa.narrative || ''} ` +
           `Course selection should continue to challenge while maintaining strong grades.`;
  }

  // ============================================================================
  // ACTIVITIES GUIDANCE
  // ============================================================================

  /**
   * Generate activities guidance
   */
  private generateActivitiesGuidance(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): ActivitiesGuidance {
    const activities = synthesis.componentEvaluations.activities;

    const currentStrength =
      activities.overallStrength === 'exceptional' ? 'Exceptional extracurricular portfolio' :
      activities.overallStrength === 'competitive' ? 'Strong activities with clear direction' :
      activities.overallStrength === 'developing' ? 'Activities need more depth or impact' :
      'Activity profile requires significant development';

    // Generate deepen recommendations
    const deepenRecommendations = this.generateDeepenRecommendations(activities, goals);

    // Generate add recommendations
    const addRecommendations = this.generateAddRecommendations(activities, goals, synthesis);

    // Generate positioning recommendations
    const positioningRecommendations = this.generatePositioningRecommendations(activities);

    // Time allocation advice
    const timeAllocationAdvice = this.generateTimeAllocationAdvice(activities, synthesis.profileStrength.tier);

    return {
      currentStrength,
      overallAssessment: this.generateActivitiesAssessment(activities),
      deepenRecommendations,
      addRecommendations,
      positioningRecommendations,
      timeAllocationAdvice,
    };
  }

  /**
   * Generate recommendations to deepen existing activities
   */
  private generateDeepenRecommendations(
    activities: HolisticProfileSynthesis['componentEvaluations']['activities'],
    goals: GoalsAspirations
  ): ActivitiesGuidance['deepenRecommendations'] {
    const recommendations: ActivitiesGuidance['deepenRecommendations'] = [];

    // Find activities that can be upgraded
    for (const assessment of activities.activityAssessments) {
      if (assessment.tier >= 3) {
        // Tier 3 or 4 activities can be upgraded
        const targetTier = Math.max(1, assessment.tier - 1);

        const actions: ActionItem[] = [];

        // Generate upgrade actions based on current tier
        if (assessment.tier === 4) {
          actions.push(this.createActionItem({
            title: `Take leadership role in ${assessment.activityName}`,
            description: 'Move from participant to leader to increase impact.',
            category: 'activity',
            priority: 'medium',
            timeHorizon: 'medium_term',
            impact: {
              description: 'Leadership demonstrates initiative',
              magnitude: 'moderate',
              affectedAreas: ['activities', 'leadership profile'],
            },
            effort: { level: 'moderate', complexity: 'moderate', dependencies: [] },
            steps: [
              { step: 'Identify leadership opportunities within the activity' },
              { step: 'Express interest to current leaders/advisors' },
              { step: 'Take on increasing responsibilities' },
              { step: 'Run for formal leadership position if available' },
            ],
          }));
        } else if (assessment.tier === 3) {
          actions.push(this.createActionItem({
            title: `Expand impact in ${assessment.activityName}`,
            description: 'Increase scope of involvement or achievement level.',
            category: 'activity',
            priority: 'medium',
            timeHorizon: 'medium_term',
            impact: {
              description: 'Greater impact makes activities more impressive',
              magnitude: 'moderate',
              affectedAreas: ['activities', 'spike development'],
            },
            effort: { level: 'significant', complexity: 'moderate', dependencies: [] },
            steps: [
              { step: 'Identify ways to compete at higher level or reach more people' },
              { step: 'Set specific goals for increased impact' },
              { step: 'Document your progress and achievements' },
            ],
          }));
        }

        if (actions.length > 0) {
          recommendations.push({
            activityId: assessment.activityId || assessment.activityName,
            activityName: assessment.activityName,
            currentTier: assessment.tier,
            targetTier,
            actions,
          });
        }
      }
    }

    return recommendations.slice(0, 3); // Top 3 upgrade opportunities
  }

  /**
   * Generate recommendations for new activities
   */
  private generateAddRecommendations(
    activities: HolisticProfileSynthesis['componentEvaluations']['activities'],
    goals: GoalsAspirations,
    synthesis: HolisticProfileSynthesis
  ): ActivitiesGuidance['addRecommendations'] {
    const recommendations: ActivitiesGuidance['addRecommendations'] = [];

    // If no spike, suggest developing one
    if (!activities.spikeAnalysis.hasClearSpike) {
      const major = goals.intendedMajor.toLowerCase();
      let suggestion = '';
      let rationale = '';

      if (major.includes('computer') || major.includes('engineering')) {
        suggestion = 'Start a coding project, join hackathons, or contribute to open source';
        rationale = 'Shows initiative and technical skills beyond coursework';
      } else if (major.includes('bio') || major.includes('pre-med')) {
        suggestion = 'Pursue research opportunity or clinical volunteering';
        rationale = 'Demonstrates genuine interest in medicine/science';
      } else if (major.includes('business') || major.includes('econ')) {
        suggestion = 'Start a small business, run investment club, or do FBLA/DECA';
        rationale = 'Shows practical business acumen';
      } else if (major.includes('art') || major.includes('music')) {
        suggestion = 'Create portfolio, perform/exhibit, or teach your craft';
        rationale = 'Builds demonstrable creative body of work';
      } else {
        suggestion = 'Find a cause you care about and create meaningful impact';
        rationale = 'Authentic passion is more compelling than resume-building';
      }

      recommendations.push({
        suggestion,
        rationale,
        fitWithProfile: `Aligns with ${goals.intendedMajor} interests`,
        howToStart: this.createActionItem({
          title: 'Develop signature activity',
          description: suggestion,
          category: 'activity',
          priority: 'high',
          timeHorizon: 'medium_term',
          impact: {
            description: 'Creates spike and differentiation',
            magnitude: 'significant',
            affectedAreas: ['activities', 'narrative'],
          },
          effort: { level: 'significant', complexity: 'moderate', dependencies: [] },
          steps: [
            { step: 'Identify specific opportunity aligned with interests' },
            { step: 'Set concrete goals for involvement' },
            { step: 'Dedicate consistent weekly time' },
            { step: 'Document achievements and impact' },
          ],
        }),
      });
    }

    // If no leadership, suggest finding leadership role
    if (activities.leadershipAnalysis.leadershipProfile === 'none') {
      recommendations.push({
        suggestion: 'Take on a leadership role in an existing activity',
        rationale: 'Leadership demonstrates ability to organize and inspire others',
        fitWithProfile: 'Leadership is valued across all fields',
        howToStart: this.createActionItem({
          title: 'Pursue leadership position',
          description: 'Run for officer position or take on leadership project in existing activity.',
          category: 'activity',
          priority: 'medium',
          timeHorizon: 'short_term',
          impact: {
            description: 'Fills leadership gap in profile',
            magnitude: 'moderate',
            affectedAreas: ['activities', 'leadership profile'],
          },
          effort: { level: 'moderate', complexity: 'simple', dependencies: [] },
          steps: [
            { step: 'Identify activity where you can lead' },
            { step: 'Express interest in leadership' },
            { step: 'Take initiative on a project' },
          ],
        }),
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Generate positioning recommendations
   */
  private generatePositioningRecommendations(
    activities: HolisticProfileSynthesis['componentEvaluations']['activities']
  ): ActivitiesGuidance['positioningRecommendations'] {
    const recommendations: ActivitiesGuidance['positioningRecommendations'] = [];

    // For top activities, suggest better positioning
    for (const assessment of activities.activityAssessments.filter(a => a.tier <= 2).slice(0, 3)) {
      recommendations.push({
        activityId: assessment.activityId || assessment.activityName,
        activityName: assessment.activityName,
        currentPositioning: `Tier ${assessment.tier} activity`,
        improvedPositioning: assessment.impactStatement || 'Lead with specific impact and achievement',
        actions: [
          'Quantify your impact (numbers, people reached, results)',
          'Lead with most impressive achievement',
          'Connect to larger narrative/themes in application',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate time allocation advice
   */
  private generateTimeAllocationAdvice(
    activities: HolisticProfileSynthesis['componentEvaluations']['activities'],
    tier: ProfileTier
  ): string[] {
    const advice: string[] = [];

    if (activities.commitmentAnalysis.depthVsBreadth === 'breadth_focused') {
      advice.push('Consider reducing number of activities to go deeper in fewer areas');
      advice.push('Quality > quantity - admissions values depth over breadth');
    }

    if (tier === 'developing' || tier === 'building') {
      advice.push('Balance activity time with academics - grades remain foundational');
    }

    advice.push('Reserve 5-10 hours/week for most important activity to build spike');
    advice.push('Avoid starting new activities senior year - deepen existing ones');

    return advice;
  }

  /**
   * Generate activities assessment text
   */
  private generateActivitiesAssessment(
    activities: HolisticProfileSynthesis['componentEvaluations']['activities']
  ): string {
    const spike = activities.spikeAnalysis.hasClearSpike
      ? `Clear spike in ${activities.spikeAnalysis.spikeArea}.`
      : 'No clear spike yet - consider deepening focus.';

    const leadership = activities.leadershipAnalysis.leadershipProfile !== 'none'
      ? `${activities.leadershipAnalysis.leadershipProfile.replace('_', ' ')} leadership profile.`
      : 'Leadership profile needs development.';

    return `Activities are ${activities.overallStrength}. ${spike} ${leadership}`;
  }

  // ============================================================================
  // AWARDS GUIDANCE
  // ============================================================================

  /**
   * Generate awards guidance
   */
  private generateAwardsGuidance(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): AwardsGuidance {
    const awards = synthesis.componentEvaluations.awards;

    const currentStrength =
      awards.overallStrength === 'exceptional' ? 'Exceptional awards and recognition' :
      awards.overallStrength === 'strong' ? 'Strong external validation' :
      awards.overallStrength === 'competitive' ? 'Competitive awards profile' :
      awards.overallStrength === 'developing' ? 'Awards section needs strengthening' :
      'Limited formal recognition';

    // Generate pursue recommendations
    const pursuerecommendations = this.generateAwardPursueRecommendations(awards, goals);

    // Generate highlight recommendations
    const highlightRecommendations = this.generateAwardHighlightRecommendations(awards);

    return {
      currentStrength,
      overallAssessment: awards.overallNarrative,
      pursuerecommendations,
      highlightRecommendations,
    };
  }

  /**
   * Generate recommendations for awards to pursue
   */
  private generateAwardPursueRecommendations(
    awards: HolisticProfileSynthesis['componentEvaluations']['awards'],
    goals: GoalsAspirations
  ): AwardsGuidance['pursuerecommendations'] {
    const recommendations: AwardsGuidance['pursuerecommendations'] = [];

    // Get gaps from award analysis
    for (const opportunity of awards.gapAnalysis.opportunitiesToPursue.slice(0, 3)) {
      recommendations.push({
        award: opportunity.opportunity,
        category: opportunity.category,
        deadline: opportunity.timeline,
        difficulty: opportunity.difficulty,
        potentialImpact: opportunity.potentialImpact,
        howToPrepare: this.createActionItem({
          title: `Pursue: ${opportunity.opportunity}`,
          description: opportunity.potentialImpact,
          category: 'award',
          priority: opportunity.difficulty === 'high' ? 'high' : 'medium',
          timeHorizon: 'medium_term',
          impact: {
            description: opportunity.potentialImpact,
            magnitude: opportunity.difficulty === 'high' ? 'significant' : 'moderate',
            affectedAreas: ['awards', 'competitive positioning'],
          },
          effort: {
            level: opportunity.difficulty === 'high' ? 'major' :
                   opportunity.difficulty === 'medium' ? 'significant' : 'moderate',
            complexity: opportunity.difficulty === 'high' ? 'complex' : 'moderate',
            dependencies: [],
          },
          steps: opportunity.howToApproach.map(step => ({ step })),
        }),
      });
    }

    // Add generic recommendations if no specific gaps
    if (recommendations.length === 0) {
      const major = goals.intendedMajor.toLowerCase();

      if (major.includes('math') || major.includes('computer') || major.includes('physics')) {
        recommendations.push({
          award: 'AMC/AIME pathway',
          category: 'academic_olympiad',
          deadline: 'November',
          difficulty: 'high',
          potentialImpact: 'National math recognition significantly strengthens STEM applications',
          howToPrepare: this.createActionItem({
            title: 'Prepare for AMC/AIME',
            description: 'Math competition pathway to national recognition',
            category: 'award',
            priority: 'medium',
            timeHorizon: 'medium_term',
            impact: {
              description: 'AIME qualification is impressive for math/CS applicants',
              magnitude: 'significant',
              affectedAreas: ['awards', 'academic profile'],
            },
            effort: { level: 'major', hoursRequired: 50, complexity: 'complex', dependencies: [] },
            steps: [
              { step: 'Take practice AMC tests to assess current level' },
              { step: 'Use Art of Problem Solving resources' },
              { step: 'Practice consistently for 3-6 months before test' },
              { step: 'Register for AMC by deadline' },
            ],
          }),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate highlight recommendations for current awards
   */
  private generateAwardHighlightRecommendations(
    awards: HolisticProfileSynthesis['componentEvaluations']['awards']
  ): AwardsGuidance['highlightRecommendations'] {
    const recommendations: AwardsGuidance['highlightRecommendations'] = [];

    // Use Common App optimization data
    const top5 = awards.commonAppOptimization.recommendedTop5.awards;

    for (const award of top5.slice(0, 3)) {
      if (award.commonAppOptimization.alternativeDescription &&
          award.commonAppOptimization.alternativeDescription !== award.commonAppOptimization.optimizedDescription) {
        recommendations.push({
          awardId: award.awardId,
          awardName: award.awardName,
          currentPresentation: award.awardName,
          improvedPresentation: award.commonAppOptimization.optimizedDescription,
        });
      }
    }

    return recommendations;
  }

  // ============================================================================
  // ESSAY GUIDANCE
  // ============================================================================

  /**
   * Generate essay guidance
   */
  private generateEssayGuidance(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations,
    config: GuidanceGenerationConfig
  ): EssayGuidance {
    const essays = synthesis.componentEvaluations.essays;

    // Determine readiness
    let readiness: EssayGuidance['readiness'];
    let readinessExplanation: string;

    if (essays.hasEssayAnalysis && essays.overallEssayScore && essays.overallEssayScore >= 80) {
      readiness = 'ready';
      readinessExplanation = 'Essays are strong and competitive.';
    } else if (essays.hasEssayAnalysis && essays.overallEssayScore && essays.overallEssayScore >= 60) {
      readiness = 'almost_ready';
      readinessExplanation = 'Essays have good foundation but could be strengthened.';
    } else if (essays.hasEssayAnalysis) {
      readiness = 'needs_preparation';
      readinessExplanation = 'Essays need significant revision before submission.';
    } else {
      readiness = 'not_ready';
      readinessExplanation = 'Essays have not been started or analyzed.';
    }

    // Generate preparation actions
    const preparationActions = this.generateEssayPreparationActions(synthesis, readiness);

    // Generate topic recommendations
    const topicRecommendations = this.generateTopicRecommendations(synthesis, goals);

    // Generate writing timeline
    const writingTimeline = this.generateWritingTimeline(config);

    return {
      readiness,
      readinessExplanation,
      preparationActions,
      topicRecommendations,
      writingTimeline,
    };
  }

  /**
   * Generate essay preparation actions
   */
  private generateEssayPreparationActions(
    synthesis: HolisticProfileSynthesis,
    readiness: EssayGuidance['readiness']
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    if (readiness === 'not_ready') {
      actions.push(this.createActionItem({
        title: 'Begin essay brainstorming',
        description: 'Start developing personal essay topics and themes.',
        category: 'essay',
        priority: 'high',
        timeHorizon: 'immediate',
        impact: {
          description: 'Essays are crucial for differentiation',
          magnitude: 'significant',
          affectedAreas: ['essays', 'overall narrative'],
        },
        effort: { level: 'moderate', hoursRequired: 5, complexity: 'moderate', dependencies: [] },
        steps: [
          { step: 'Reflect on meaningful experiences and turning points' },
          { step: 'List 5-10 potential topics' },
          { step: 'Discuss ideas with trusted adults or counselors' },
          { step: 'Choose 2-3 topics to develop further' },
        ],
      }));
    }

    if (readiness !== 'ready') {
      actions.push(this.createActionItem({
        title: 'Write Common App personal essay draft',
        description: 'Complete first draft of main personal essay.',
        category: 'essay',
        priority: 'high',
        timeHorizon: 'short_term',
        impact: {
          description: 'Personal essay is used for all Common App schools',
          magnitude: 'significant',
          affectedAreas: ['essays'],
        },
        effort: { level: 'significant', hoursRequired: 15, complexity: 'moderate', dependencies: ['brainstorming'] },
        steps: [
          { step: 'Outline your chosen topic' },
          { step: 'Write first draft (don\'t edit while writing)' },
          { step: 'Let it sit for a few days' },
          { step: 'Revise with fresh eyes' },
          { step: 'Get feedback from 2-3 readers' },
        ],
      }));

      actions.push(this.createActionItem({
        title: 'Get essay feedback',
        description: 'Have essays reviewed by teachers, counselors, or trusted adults.',
        category: 'essay',
        priority: 'medium',
        timeHorizon: 'short_term',
        impact: {
          description: 'External feedback reveals blind spots',
          magnitude: 'moderate',
          affectedAreas: ['essays'],
        },
        effort: { level: 'minimal', hoursRequired: 2, complexity: 'simple', dependencies: ['draft completion'] },
        steps: [
          { step: 'Identify 2-3 people to review essays' },
          { step: 'Ask for specific feedback on voice and clarity' },
          { step: 'Incorporate suggestions that feel authentic' },
        ],
      }));
    }

    return actions;
  }

  /**
   * Generate topic recommendations
   */
  private generateTopicRecommendations(
    synthesis: HolisticProfileSynthesis,
    goals: GoalsAspirations
  ): EssayGuidance['topicRecommendations'] {
    const recommendations: EssayGuidance['topicRecommendations'] = [];
    const archetype = synthesis.applicationBrand.primaryArchetype;
    const spike = synthesis.componentEvaluations.activities.spikeAnalysis.spikeArea;

    // Common App essay
    const potentialTopics: string[] = [];
    const topicsToAvoid: string[] = [];

    // Based on archetype
    if (archetype !== 'undefined') {
      potentialTopics.push(`A moment that crystallized your identity as "${archetype.replace('the_', '').replace('_', ' ')}"`);
    }

    // Based on spike
    if (spike) {
      potentialTopics.push(`Origin story of your passion for ${spike}`);
      potentialTopics.push(`A challenge or failure in ${spike} and what you learned`);
    }

    // Generic good topics
    potentialTopics.push('A moment of growth or changed perspective');
    potentialTopics.push('Something you created and why it matters to you');
    potentialTopics.push('A meaningful relationship that shaped you');

    // Topics to avoid
    topicsToAvoid.push('Rehashing achievements already listed elsewhere');
    topicsToAvoid.push('Trauma without showing growth or perspective');
    topicsToAvoid.push('Topics where you\'re not the main character');
    topicsToAvoid.push('Highly controversial political topics');
    topicsToAvoid.push('"Service trip that changed my life" cliché');

    recommendations.push({
      essayType: 'Common App Personal Essay',
      potentialTopics,
      topicsToAvoid,
      narrativeAdvice: `Connect essay to your "${archetype.replace('the_', '').replace('_', ' ')}" identity and ${spike || 'key interests'}.`,
    });

    // Why school essays
    recommendations.push({
      essayType: 'Why [School] Essays',
      potentialTopics: [
        'Specific programs, professors, or courses that excite you',
        'Campus resources that align with your interests',
        'How you\'d contribute to their community',
      ],
      topicsToAvoid: [
        'Generic praise that could apply to any school',
        'Just listing programs without personal connection',
        'Location, weather, or prestige as main reasons',
      ],
      narrativeAdvice: 'Research deeply and show genuine fit - admissions can tell who actually researched.',
    });

    return recommendations;
  }

  /**
   * Generate writing timeline
   */
  private generateWritingTimeline(config: GuidanceGenerationConfig): EssayGuidance['writingTimeline'] {
    // Generic timeline - would be customized based on current date and grade
    return [
      {
        phase: 'Brainstorming',
        deadline: 'End of June',
        tasks: ['Develop 5+ potential topics', 'Discuss with mentors', 'Choose top 2-3'],
      },
      {
        phase: 'First Drafts',
        deadline: 'End of July',
        tasks: ['Complete Common App essay draft', 'Start 2-3 supplemental drafts'],
      },
      {
        phase: 'Revision',
        deadline: 'End of August',
        tasks: ['Get feedback', 'Revise all essays', 'Let them rest, then revise again'],
      },
      {
        phase: 'Polish',
        deadline: 'Mid-September',
        tasks: ['Final revisions', 'Proofread carefully', 'Finalize for EA/ED deadlines'],
      },
      {
        phase: 'RD Supplements',
        deadline: 'December',
        tasks: ['Complete remaining supplements', 'Final review before RD deadlines'],
      },
    ];
  }

  // ============================================================================
  // SCHOOL LIST GUIDANCE
  // ============================================================================

  /**
   * Generate school list guidance
   */
  private generateSchoolListGuidance(
    synthesis: HolisticProfileSynthesis,
    schoolFit: SchoolFitOutput,
    goals: GoalsAspirations
  ): SchoolListGuidance {
    const listStrength = schoolFit.listAssessment.overallStrength;
    const listAssessment = schoolFit.listAssessment.narrative;

    // Generate modifications
    const modifications = this.generateListModifications(schoolFit, synthesis);

    // Generate strategy actions
    const strategyActions = this.generateSchoolStrategyActions(schoolFit, goals);

    return {
      listStrength,
      listAssessment,
      modifications,
      strategyActions,
    };
  }

  /**
   * Generate list modifications
   */
  private generateListModifications(
    schoolFit: SchoolFitOutput,
    synthesis: HolisticProfileSynthesis
  ): SchoolListGuidance['modifications'] {
    const add: SchoolListGuidance['modifications']['add'] = [];
    const remove: SchoolListGuidance['modifications']['remove'] = [];
    const recategorize: SchoolListGuidance['modifications']['recategorize'] = [];

    // Add suggestions from school fit
    for (const suggestion of schoolFit.suggestions.strategicAdds) {
      add.push({
        schoolId: suggestion.school.schoolId,
        schoolName: suggestion.school.schoolName,
        reason: suggestion.whatItAdds,
        category: suggestion.category,
      });
    }

    // Remove suggestions
    for (const suggestion of schoolFit.suggestions.reconsider) {
      remove.push({
        schoolId: suggestion.schoolId,
        schoolName: suggestion.schoolName,
        reason: suggestion.reason,
      });
    }

    return { add, remove, recategorize };
  }

  /**
   * Generate school strategy actions
   */
  private generateSchoolStrategyActions(
    schoolFit: SchoolFitOutput,
    goals: GoalsAspirations
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    // ED recommendation action
    if (schoolFit.strategy.earlyDecisionRecommendation) {
      actions.push(this.createActionItem({
        title: `Consider ED to ${schoolFit.strategy.earlyDecisionRecommendation.school}`,
        description: schoolFit.strategy.earlyDecisionRecommendation.reasoning,
        category: 'school',
        priority: 'high',
        timeHorizon: 'short_term',
        timeline: { deadline: 'November 1', isTimeSensitive: true, timeSensitiveReason: 'ED deadline' },
        impact: {
          description: 'ED significantly increases admission chances at many schools',
          magnitude: 'significant',
          affectedAreas: ['school strategy', 'admission probability'],
        },
        effort: { level: 'significant', complexity: 'moderate', dependencies: ['essay completion'] },
        steps: [
          { step: 'Confirm this is your top choice' },
          { step: 'Run net price calculator to verify affordability' },
          { step: 'Complete all application materials by October 25' },
          { step: 'Submit by November 1' },
        ],
      }));
    }

    // List balance action
    if (schoolFit.schoolList.summary.listBalance !== 'well_balanced') {
      actions.push(this.createActionItem({
        title: 'Balance school list',
        description: `Current list is ${schoolFit.schoolList.summary.listBalance.replace('_', ' ')}. ${schoolFit.listAssessment.recommendations[0] || 'Adjust categories for better balance.'}`,
        category: 'school',
        priority: 'medium',
        timeHorizon: 'short_term',
        impact: {
          description: 'Balanced list ensures options regardless of outcomes',
          magnitude: 'moderate',
          affectedAreas: ['school strategy'],
        },
        effort: { level: 'moderate', complexity: 'simple', dependencies: [] },
        steps: [
          { step: 'Review current list categorization' },
          { step: 'Research additional schools in underrepresented categories' },
          { step: 'Add schools to balance reach/target/likely ratio' },
        ],
      }));
    }

    return actions;
  }

  // ============================================================================
  // MILESTONES
  // ============================================================================

  /**
   * Generate milestones
   */
  private generateMilestones(
    config: GuidanceGenerationConfig,
    actions: ActionItem[]
  ): Milestone[] {
    const milestones: Milestone[] = [];
    const year = config.targetGraduationYear - 1; // Senior year

    // Key milestones
    milestones.push({
      id: 'finalize_school_list',
      title: 'Finalize School List',
      description: 'Complete research and finalize list of schools to apply to.',
      category: 'school',
      targetDate: `${year}-09-01`,
      isFlexible: true,
      flexibilityWindow: '2 weeks',
      dependencies: [],
      status: 'not_started',
      associatedActions: actions.filter(a => a.category === 'school').map(a => a.id),
      successCriteria: ['8-12 schools selected', 'Balanced reach/target/likely', 'All requirements researched'],
    });

    milestones.push({
      id: 'complete_common_app_essay',
      title: 'Complete Common App Essay',
      description: 'Finalize personal statement for Common App.',
      category: 'essay',
      targetDate: `${year}-09-15`,
      isFlexible: true,
      flexibilityWindow: '2 weeks',
      dependencies: [],
      status: 'not_started',
      associatedActions: actions.filter(a => a.category === 'essay').map(a => a.id),
      successCriteria: ['Essay is 650 words or less', 'Multiple revisions completed', 'Feedback incorporated'],
    });

    milestones.push({
      id: 'submit_ea_ed',
      title: 'Submit Early Applications',
      description: 'Submit all Early Decision and Early Action applications.',
      category: 'school',
      targetDate: `${year}-11-01`,
      isFlexible: false,
      dependencies: ['finalize_school_list', 'complete_common_app_essay'],
      status: 'not_started',
      associatedActions: [],
      successCriteria: ['All EA/ED applications submitted', 'Supplements complete', 'Recommendations requested'],
    });

    milestones.push({
      id: 'submit_rd',
      title: 'Submit Regular Decision Applications',
      description: 'Submit all Regular Decision applications.',
      category: 'school',
      targetDate: `${year + 1}-01-01`,
      isFlexible: false,
      dependencies: ['submit_ea_ed'],
      status: 'not_started',
      associatedActions: [],
      successCriteria: ['All RD applications submitted', 'All supplements complete', 'Financial aid applications submitted'],
    });

    return milestones;
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  /**
   * Generate progress summary
   */
  private generateProgressSummary(
    actions: ActionItem[],
    milestones: Milestone[]
  ): ProgressSummary {
    // Calculate overall progress
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const overallProgress = actions.length > 0
      ? Math.round((completedActions / actions.length) * 100)
      : 0;

    // Progress assessment
    let progressAssessment: ProgressSummary['progressAssessment'] = 'on_track';
    if (overallProgress < 30) progressAssessment = 'significantly_behind';
    else if (overallProgress < 50) progressAssessment = 'slightly_behind';
    else if (overallProgress > 80) progressAssessment = 'ahead';

    // Category breakdown
    const categories: ActionCategory[] = ['academic', 'activity', 'award', 'essay', 'school'];
    const categoryProgress = categories.map(category => {
      const categoryActions = actions.filter(a => a.category === category);
      const completed = categoryActions.filter(a => a.status === 'completed').length;
      const progress = categoryActions.length > 0
        ? Math.round((completed / categoryActions.length) * 100)
        : 0;

      return {
        category,
        totalActions: categoryActions.length,
        completedActions: completed,
        progress,
        status: progress >= 50 ? 'on_track' as const :
                progress >= 25 ? 'needs_attention' as const : 'at_risk' as const,
      };
    });

    // Milestone status
    const milestoneStatus = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      inProgress: milestones.filter(m => m.status === 'in_progress').length,
      upcoming: milestones.filter(m => m.status === 'not_started').length,
      atRisk: milestones.filter(m => m.status === 'at_risk').length,
    };

    // Next priorities
    const nextPriorities: ActionItemSummary[] = actions
      .filter(a => a.status !== 'completed')
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        priority: a.priority,
        effort: a.effort.level,
        deadline: a.timeline.deadline,
        status: a.status,
      }));

    // Alerts (simplified)
    const alerts: ProgressSummary['alerts'] = [];

    return {
      overallProgress,
      progressAssessment,
      categoryProgress,
      milestoneStatus,
      nextPriorities,
      alerts,
    };
  }

  // ============================================================================
  // CALENDAR
  // ============================================================================

  /**
   * Generate application calendar
   */
  private generateApplicationCalendar(
    actions: ActionItem[],
    schoolFit: SchoolFitOutput,
    config: GuidanceGenerationConfig
  ): GuidanceReport['applicationCalendar'] {
    const calendar: GuidanceReport['applicationCalendar'] = [];
    const year = config.targetGraduationYear - 1;

    // Summer
    calendar.push({
      month: 'June-August',
      focus: 'Essay Writing & Test Prep',
      keyDeadlines: [
        { date: 'End of July', item: 'Complete Common App essay draft' },
        { date: 'August', item: 'Final test date before early deadlines' },
      ],
      actions: actions
        .filter(a => a.timeHorizon === 'short_term' && a.category === 'essay')
        .map(this.toActionSummary),
    });

    // September
    calendar.push({
      month: 'September',
      focus: 'Finalize Essays & School List',
      keyDeadlines: [
        { date: 'September 1', item: 'Finalize school list' },
        { date: 'September 15', item: 'Request teacher recommendations' },
      ],
      actions: actions
        .filter(a => a.category === 'school' || a.category === 'essay')
        .slice(0, 3)
        .map(this.toActionSummary),
    });

    // October
    calendar.push({
      month: 'October',
      focus: 'Early Applications',
      keyDeadlines: [
        { date: 'October 15', item: 'Complete EA/ED supplementals' },
        { date: 'October 25', item: 'Final review before early deadlines' },
      ],
      actions: actions
        .filter(a => a.timeline?.isTimeSensitive)
        .map(this.toActionSummary),
    });

    // November
    calendar.push({
      month: 'November',
      focus: 'Submit Early & Start RD',
      keyDeadlines: [
        { date: 'November 1', item: 'EA/ED deadlines (most schools)' },
        { date: 'November 15', item: 'ED II schools deadline' },
      ],
      actions: [],
    });

    // December-January
    calendar.push({
      month: 'December-January',
      focus: 'Regular Decision',
      keyDeadlines: [
        { date: 'January 1-15', item: 'RD deadlines' },
        { date: 'January 1', item: 'FAFSA/CSS Profile deadlines' },
      ],
      actions: [],
    });

    return calendar;
  }

  /**
   * Convert action to summary
   */
  private toActionSummary(action: ActionItem): ActionItemSummary {
    return {
      id: action.id,
      title: action.title,
      category: action.category,
      priority: action.priority,
      effort: action.effort.level,
      deadline: action.timeline.deadline,
      status: action.status,
    };
  }

  // ============================================================================
  // EXECUTIVE SUMMARY
  // ============================================================================

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    synthesis: HolisticProfileSynthesis,
    actions: ActionItem[],
    academicGuidance: AcademicGuidance,
    activitiesGuidance: ActivitiesGuidance
  ): GuidanceReport['executiveSummary'] {
    const tier = synthesis.profileStrength.tier;

    let overallReadiness: GuidanceReport['executiveSummary']['overallReadiness'];
    switch (tier) {
      case 'exceptional':
      case 'highly_competitive':
        overallReadiness = 'strong';
        break;
      case 'competitive':
        overallReadiness = 'good';
        break;
      case 'developing':
        overallReadiness = 'developing';
        break;
      default:
        overallReadiness = 'needs_work';
    }

    // Key strengths
    const keyStrengths = synthesis.strengthsAndConcerns.majorStrengths
      .slice(0, 3)
      .map(s => s.strength);

    // Critical actions
    const criticalActions = actions
      .filter(a => a.priority === 'critical' || a.priority === 'high')
      .slice(0, 3)
      .map(a => a.title);

    // One line summary
    const oneLineSummary = `Profile is ${tier} with ${keyStrengths.length} key strengths. ` +
                          `Focus on ${criticalActions.length > 0 ? criticalActions[0].toLowerCase() : 'maintaining progress'}.`;

    // Full summary
    const fullSummary = synthesis.profileStrength.narrative + '\n\n' +
                       `Top priorities: ${criticalActions.join(', ') || 'Continue current trajectory'}.`;

    return {
      overallReadiness,
      keyStrengths,
      criticalActions,
      oneLineSummary,
      fullSummary,
    };
  }

  // ============================================================================
  // RISK ASSESSMENT
  // ============================================================================

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(
    synthesis: HolisticProfileSynthesis,
    schoolFit: SchoolFitOutput,
    actions: ActionItem[]
  ): GuidanceReport['riskAssessment'] {
    const risks: GuidanceReport['riskAssessment']['risks'] = [];

    // Academic risk
    if (synthesis.componentEvaluations.academic.overallTier === 'developing' ||
        synthesis.componentEvaluations.academic.overallTier === 'needs_improvement') {
      risks.push({
        risk: 'Academic profile may limit school options',
        likelihood: 'high',
        impact: 'high',
        mitigation: 'Focus on grade improvement and consider test-optional schools',
      });
    }

    // Activity risk
    if (!synthesis.componentEvaluations.activities.spikeAnalysis.hasClearSpike) {
      risks.push({
        risk: 'Lack of distinctive activity may hurt differentiation',
        likelihood: 'medium',
        impact: 'medium',
        mitigation: 'Deepen involvement in most promising activity area',
      });
    }

    // List balance risk
    if (schoolFit.schoolList.summary.listBalance === 'too_top_heavy') {
      risks.push({
        risk: 'Heavy reach list increases rejection risk',
        likelihood: 'high',
        impact: 'high',
        mitigation: 'Add more target and likely schools',
      });
    }

    // Essay risk
    if (!synthesis.componentEvaluations.essays.hasEssayAnalysis) {
      risks.push({
        risk: 'Essays not started or analyzed',
        likelihood: 'medium',
        impact: 'high',
        mitigation: 'Begin essay process immediately',
      });
    }

    // Determine overall risk level
    const highRisks = risks.filter(r => r.likelihood === 'high' && r.impact === 'high').length;
    let overallRiskLevel: GuidanceReport['riskAssessment']['overallRiskLevel'];

    if (highRisks >= 2) overallRiskLevel = 'high';
    else if (highRisks >= 1) overallRiskLevel = 'elevated';
    else if (risks.length >= 2) overallRiskLevel = 'moderate';
    else overallRiskLevel = 'low';

    return {
      risks,
      overallRiskLevel,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create action item with defaults
   */
  private createActionItem(params: {
    title: string;
    description: string;
    category: ActionCategory;
    priority: ActionPriority;
    timeHorizon: TimeHorizon;
    impact: ActionItem['impact'];
    effort: Partial<ActionItem['effort']>;
    steps: ActionItem['steps'];
    timeline?: Partial<ActionItem['timeline']>;
  }): ActionItem {
    return {
      id: generateActionId(params.category),
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      timeHorizon: params.timeHorizon,
      impact: params.impact,
      effort: {
        level: params.effort.level || 'moderate',
        hoursRequired: params.effort.hoursRequired,
        complexity: params.effort.complexity || 'moderate',
        dependencies: params.effort.dependencies || [],
      },
      timeline: {
        suggestedStart: params.timeline?.suggestedStart,
        deadline: params.timeline?.deadline,
        isTimeSensitive: params.timeline?.isTimeSensitive || false,
        timeSensitiveReason: params.timeline?.timeSensitiveReason,
      },
      steps: params.steps,
      status: 'not_started',
    };
  }

  /**
   * Sort actions by priority
   */
  private sortActionsByPriority(actions: ActionItem[]): ActionItem[] {
    const priorityOrder: Record<ActionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...actions].sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by time sensitivity
      if (a.timeline.isTimeSensitive && !b.timeline.isTimeSensitive) return -1;
      if (!a.timeline.isTimeSensitive && b.timeline.isTimeSensitive) return 1;

      return 0;
    });
  }

  /**
   * Categorize actions by time horizon
   */
  private categorizeByTimeHorizon(actions: ActionItem[]): GuidanceReport['priorityActions'] {
    return {
      immediate: actions.filter(a => a.timeHorizon === 'immediate'),
      shortTerm: actions.filter(a => a.timeHorizon === 'short_term'),
      mediumTerm: actions.filter(a => a.timeHorizon === 'medium_term'),
      ongoing: actions.filter(a => a.timeHorizon === 'ongoing'),
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const guidanceEngine = new GuidanceEngine();
