/**
 * Trajectory Analyzer Service
 *
 * Comprehensive GPA and rigor trajectory analysis with:
 * - Year-weighted GPA calculation (Fr: 15%, So: 22%, Jr: 35%, Sr: 28%)
 * - Trajectory classification (ascending, descending, V-shape, etc.)
 * - Critical transition detection (Sophomore→Junior, Junior→Senior)
 * - GPA-Rigor interaction matrix
 * - Research-backed scoring adjustments
 *
 * @version 1.0
 * @date January 2026
 * @research Section 6.6: Grade Interpretation
 */

import type { AcademicHistoryInput, CourseRecord } from './academicHistoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export type TrajectoryType =
  | 'strong_ascending'    // Each year better than last
  | 'moderate_ascending'  // General improvement trend
  | 'high_plateau'        // Consistently high (3.8+)
  | 'mid_plateau'         // Consistently moderate (3.5-3.8)
  | 'v_shape_recovery'    // Dip then recovery
  | 'inverted_v'          // Peak then decline
  | 'senior_decline'      // Strong junior, weak senior (senioritis)
  | 'junior_dip'          // Dip specifically in junior year
  | 'descending'          // Getting worse over time
  | 'erratic';            // No clear pattern

export type RigorTrajectoryType =
  | 'increasing'          // Taking more challenging courses over time
  | 'maintaining_high'    // Consistently maximum rigor
  | 'maintaining_moderate'// Stable moderate rigor
  | 'retreating'          // Reducing rigor over time
  | 'senior_retreat';     // Rigor drop specifically in senior year

export type GPARigorInteraction =
  | 'ideal'               // GPA↑ + Rigor↑
  | 'good_growth'         // GPA→ + Rigor↑ (maintained grades while increasing challenge)
  | 'good_mastery'        // GPA↑ + Rigor→ (improving in same difficulty)
  | 'acceptable_courage'  // GPA↓ + Rigor↑ (intellectual courage)
  | 'neutral'             // GPA→ + Rigor→
  | 'suspect_protection'  // GPA↑ + Rigor↓ (GPA protection strategy)
  | 'concern_stagnant'    // GPA→ + Rigor↓ (coasting)
  | 'concern_struggle'    // GPA↓ + Rigor→ (struggling)
  | 'critical_decline';   // GPA↓ + Rigor↓ (disengagement)

export type TransitionQuality =
  | 'excellent_growth'    // Improved significantly
  | 'good_growth'         // Improved moderately
  | 'maintained'          // Stable
  | 'slight_dip'          // Minor decline (0.1-0.2)
  | 'significant_dip'     // Major decline (0.2-0.3)
  | 'critical_decline';   // Severe decline (0.3+)

export interface YearData {
  year: 9 | 10 | 11 | 12;
  gpa?: number;
  courseCount?: number;
  apCount: number;
  ibHlCount: number;
  ibSlCount: number;
  honorsCount: number;
  deCount: number;
  regularCount: number;
  rigorScore: number;        // 0-100 scale
  effectiveRigorCount: number; // Weighted count of advanced courses
}

export interface TrajectoryAnalysis {
  // Raw year data
  yearData: YearData[];

  // GPA Analysis
  gpa: {
    raw: {
      freshman?: number;
      sophomore?: number;
      junior?: number;
      senior?: number;
    };
    weighted_gpa: number;           // Year-weighted average
    trajectory_adjustment: number;  // Bonus/penalty for trajectory
    effective_gpa: number;          // Final adjusted GPA
    trajectory_type: TrajectoryType;
  };

  // Rigor Analysis
  rigor: {
    by_year: {
      freshman?: number;
      sophomore?: number;
      junior?: number;
      senior?: number;
    };
    trajectory_type: RigorTrajectoryType;
    maximization_percentage: number; // % of available rigor taken
  };

  // GPA-Rigor Interaction
  gpa_rigor_interaction: GPARigorInteraction;

  // Critical Transitions
  transitions: {
    freshman_to_sophomore: TransitionQuality;
    sophomore_to_junior: TransitionQuality;   // CRITICAL
    junior_to_senior: TransitionQuality;      // RED FLAG if decline
  };

  // Year Weights Applied
  year_weights: {
    freshman: number;
    sophomore: number;
    junior: number;
    senior: number;
  };

  // Insights
  strengths: string[];
  concerns: string[];
  teaching_insight: string;

  // Research Citation
  research_basis: string;
}

// ============================================================================
// CONSTANTS - Research-Based Year Weights
// ============================================================================

/**
 * Year weights based on Section 6.6 research:
 * - Junior year is "widely regarded as the most important year"
 * - Senior year matters for follow-through and rescission risk
 * - Freshman year weighted least due to adjustment period
 */
const YEAR_WEIGHTS = {
  freshman: 0.15,
  sophomore: 0.22,
  junior: 0.35,
  senior: 0.28,
};

/**
 * Trajectory adjustments based on research:
 * - "Admissions officers would much rather see [grades] on an upward trajectory"
 * - "22% of colleges rescind for senior year decline"
 */
const TRAJECTORY_ADJUSTMENTS: Record<TrajectoryType, number> = {
  strong_ascending: 0.10,
  moderate_ascending: 0.05,
  high_plateau: 0.00,
  mid_plateau: -0.02,
  v_shape_recovery: 0.05,
  inverted_v: -0.10,
  senior_decline: -0.15,
  junior_dip: -0.10,
  descending: -0.20,
  erratic: -0.08,
};

/**
 * Rigor score weights by course type
 */
const RIGOR_WEIGHTS = {
  ap: 1.0,
  ib_hl: 1.0,
  ib_sl: 0.6,
  honors: 0.4,
  dual_enrollment: 0.8,
  regular: 0.0,
};

// ============================================================================
// TRAJECTORY ANALYZER CLASS
// ============================================================================

export class TrajectoryAnalyzer {
  /**
   * Run comprehensive trajectory analysis on academic profile
   */
  analyze(input: AcademicHistoryInput): TrajectoryAnalysis {
    // Extract year-by-year data
    const yearData = this.extractYearData(input);

    // Calculate GPA trajectory
    const gpaAnalysis = this.analyzeGPATrajectory(input, yearData);

    // Calculate rigor trajectory
    const rigorAnalysis = this.analyzeRigorTrajectory(input, yearData);

    // Determine GPA-rigor interaction
    const interaction = this.determineGPARigorInteraction(gpaAnalysis, rigorAnalysis, yearData);

    // Analyze critical transitions
    const transitions = this.analyzeTransitions(input);

    // Generate insights
    const { strengths, concerns, teachingInsight } = this.generateInsights(
      gpaAnalysis,
      rigorAnalysis,
      interaction,
      transitions
    );

    return {
      yearData,
      gpa: gpaAnalysis,
      rigor: rigorAnalysis,
      gpa_rigor_interaction: interaction,
      transitions,
      year_weights: YEAR_WEIGHTS,
      strengths,
      concerns,
      teaching_insight: teachingInsight,
      research_basis: 'Section 6.6: Grade Interpretation - Junior year most important, upward trajectory preferred, senior decline is red flag.',
    };
  }

  // ========================================================================
  // DATA EXTRACTION
  // ========================================================================

  private extractYearData(input: AcademicHistoryInput): YearData[] {
    const years: (9 | 10 | 11 | 12)[] = [9, 10, 11, 12];
    const yearMap: Record<string, 9 | 10 | 11 | 12> = {
      freshman: 9,
      sophomore: 10,
      junior: 11,
      senior: 12,
    };

    return years.map((year) => {
      const yearCourses = input.courses.filter((c) => c.year === year);

      const apCount = yearCourses.filter((c) => c.level === 'ap').length;
      const ibHlCount = yearCourses.filter((c) => c.level === 'ib_hl').length;
      const ibSlCount = yearCourses.filter((c) => c.level === 'ib_sl').length;
      const honorsCount = yearCourses.filter((c) => c.level === 'honors').length;
      const deCount = yearCourses.filter((c) => c.level === 'dual_enrollment').length;
      const regularCount = yearCourses.filter((c) => c.level === 'regular').length;

      // Calculate effective rigor count (weighted)
      const effectiveRigorCount =
        apCount * RIGOR_WEIGHTS.ap +
        ibHlCount * RIGOR_WEIGHTS.ib_hl +
        ibSlCount * RIGOR_WEIGHTS.ib_sl +
        honorsCount * RIGOR_WEIGHTS.honors +
        deCount * RIGOR_WEIGHTS.dual_enrollment;

      // Calculate rigor score (0-100)
      const totalCourses = yearCourses.length || 1;
      const maxPossibleRigor = totalCourses * RIGOR_WEIGHTS.ap;
      const rigorScore = Math.round((effectiveRigorCount / maxPossibleRigor) * 100);

      // Get GPA for this year from grade_history
      const yearName = Object.keys(yearMap).find((k) => yearMap[k] === year) as keyof typeof input.grade_history;
      const gpa = input.grade_history?.[yearName]?.gpa;

      return {
        year,
        gpa,
        courseCount: yearCourses.length,
        apCount,
        ibHlCount,
        ibSlCount,
        honorsCount,
        deCount,
        regularCount,
        rigorScore: Math.min(100, rigorScore),
        effectiveRigorCount,
      };
    });
  }

  // ========================================================================
  // GPA TRAJECTORY ANALYSIS
  // ========================================================================

  private analyzeGPATrajectory(
    input: AcademicHistoryInput,
    yearData: YearData[]
  ): TrajectoryAnalysis['gpa'] {
    const gpas = {
      freshman: input.grade_history?.freshman?.gpa,
      sophomore: input.grade_history?.sophomore?.gpa,
      junior: input.grade_history?.junior?.gpa,
      senior: input.grade_history?.senior?.gpa,
    };

    // Calculate year-weighted GPA
    const weightedGpa = this.calculateWeightedGPA(gpas);

    // Classify trajectory type
    const trajectoryType = this.classifyGPATrajectory(gpas);

    // Get trajectory adjustment
    const adjustment = TRAJECTORY_ADJUSTMENTS[trajectoryType];

    // Calculate effective GPA
    const effectiveGpa = weightedGpa + adjustment;

    return {
      raw: gpas,
      weighted_gpa: Math.round(weightedGpa * 100) / 100,
      trajectory_adjustment: adjustment,
      effective_gpa: Math.round(effectiveGpa * 100) / 100,
      trajectory_type: trajectoryType,
    };
  }

  private calculateWeightedGPA(gpas: Record<string, number | undefined>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    if (gpas.freshman !== undefined) {
      weightedSum += gpas.freshman * YEAR_WEIGHTS.freshman;
      totalWeight += YEAR_WEIGHTS.freshman;
    }
    if (gpas.sophomore !== undefined) {
      weightedSum += gpas.sophomore * YEAR_WEIGHTS.sophomore;
      totalWeight += YEAR_WEIGHTS.sophomore;
    }
    if (gpas.junior !== undefined) {
      weightedSum += gpas.junior * YEAR_WEIGHTS.junior;
      totalWeight += YEAR_WEIGHTS.junior;
    }
    if (gpas.senior !== undefined) {
      weightedSum += gpas.senior * YEAR_WEIGHTS.senior;
      totalWeight += YEAR_WEIGHTS.senior;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private classifyGPATrajectory(gpas: Record<string, number | undefined>): TrajectoryType {
    const values = [gpas.freshman, gpas.sophomore, gpas.junior, gpas.senior].filter(
      (v): v is number => v !== undefined
    );

    if (values.length < 2) return 'high_plateau';

    // Check for senior decline (most critical)
    if (
      gpas.junior !== undefined &&
      gpas.senior !== undefined &&
      gpas.junior - gpas.senior >= 0.3
    ) {
      return 'senior_decline';
    }

    // Check for junior dip
    if (
      gpas.sophomore !== undefined &&
      gpas.junior !== undefined &&
      gpas.sophomore - gpas.junior >= 0.2
    ) {
      return 'junior_dip';
    }

    // Check for strong ascending (each year better)
    let isStrongAscending = true;
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) {
        isStrongAscending = false;
        break;
      }
    }
    if (isStrongAscending && values[values.length - 1] - values[0] >= 0.2) {
      return 'strong_ascending';
    }

    // Check for moderate ascending
    if (values[values.length - 1] - values[0] >= 0.1) {
      return 'moderate_ascending';
    }

    // Check for descending
    let isDescending = true;
    for (let i = 1; i < values.length; i++) {
      if (values[i] >= values[i - 1]) {
        isDescending = false;
        break;
      }
    }
    if (isDescending && values[0] - values[values.length - 1] >= 0.2) {
      return 'descending';
    }

    // Check for V-shape recovery
    if (values.length >= 3) {
      const midIndex = Math.floor(values.length / 2);
      const firstHalfMin = Math.min(...values.slice(0, midIndex + 1));
      const secondHalfMax = Math.max(...values.slice(midIndex));
      if (secondHalfMax - firstHalfMin >= 0.2) {
        return 'v_shape_recovery';
      }
    }

    // Check for inverted V (peak then decline)
    if (values.length >= 3) {
      const maxIndex = values.indexOf(Math.max(...values));
      if (maxIndex > 0 && maxIndex < values.length - 1) {
        const peakValue = values[maxIndex];
        const endValue = values[values.length - 1];
        if (peakValue - endValue >= 0.15) {
          return 'inverted_v';
        }
      }
    }

    // Check for high plateau (all 3.8+)
    if (values.every((v) => v >= 3.8)) {
      return 'high_plateau';
    }

    // Check for mid plateau
    const variance = this.calculateVariance(values);
    if (variance < 0.02) {
      return 'mid_plateau';
    }

    // Check for erratic
    if (variance > 0.08) {
      return 'erratic';
    }

    return 'mid_plateau';
  }

  // ========================================================================
  // RIGOR TRAJECTORY ANALYSIS
  // ========================================================================

  private analyzeRigorTrajectory(
    input: AcademicHistoryInput,
    yearData: YearData[]
  ): TrajectoryAnalysis['rigor'] {
    const rigorByYear = {
      freshman: yearData.find((y) => y.year === 9)?.effectiveRigorCount,
      sophomore: yearData.find((y) => y.year === 10)?.effectiveRigorCount,
      junior: yearData.find((y) => y.year === 11)?.effectiveRigorCount,
      senior: yearData.find((y) => y.year === 12)?.effectiveRigorCount,
    };

    // Calculate maximization percentage
    const apAvailable = input.school_context.ap_courses_offered || 10;
    const totalAdvanced = yearData.reduce((sum, y) => sum + y.effectiveRigorCount, 0);
    const expectedMaximum = Math.min(apAvailable * 0.6, 15); // Reasonable max
    const maximizationPercentage = Math.min(100, Math.round((totalAdvanced / expectedMaximum) * 100));

    // Classify rigor trajectory
    const trajectoryType = this.classifyRigorTrajectory(rigorByYear);

    return {
      by_year: rigorByYear,
      trajectory_type: trajectoryType,
      maximization_percentage: maximizationPercentage,
    };
  }

  private classifyRigorTrajectory(
    rigorByYear: Record<string, number | undefined>
  ): RigorTrajectoryType {
    const values = [
      rigorByYear.freshman,
      rigorByYear.sophomore,
      rigorByYear.junior,
      rigorByYear.senior,
    ].filter((v): v is number => v !== undefined && v > 0);

    if (values.length < 2) {
      const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
      return avg >= 3 ? 'maintaining_high' : 'maintaining_moderate';
    }

    // Find peak rigor year to determine if this is a general retreat or senior-specific
    const allYears = [
      { name: 'freshman', rigor: rigorByYear.freshman || 0 },
      { name: 'sophomore', rigor: rigorByYear.sophomore || 0 },
      { name: 'junior', rigor: rigorByYear.junior || 0 },
      { name: 'senior', rigor: rigorByYear.senior || 0 },
    ];
    const peakYear = allYears.reduce((max, y) => (y.rigor > max.rigor ? y : max));
    const peakRigor = peakYear.rigor;
    const currentRigor = allYears[allYears.length - 1].rigor;

    // Check for GENERAL retreat first (pattern started before senior year)
    // If peak was in freshman or sophomore, and rigor has declined significantly, it's retreating
    if (
      (peakYear.name === 'freshman' || peakYear.name === 'sophomore') &&
      peakRigor > 0 &&
      currentRigor < peakRigor * 0.7
    ) {
      return 'retreating';
    }

    // Check for senior-specific retreat (only if rigor was maintained through junior year)
    // This is when rigor was strong in junior year but dropped specifically for senior year
    if (
      rigorByYear.junior !== undefined &&
      rigorByYear.senior !== undefined &&
      rigorByYear.junior > 0 &&
      rigorByYear.senior < rigorByYear.junior * 0.7 &&
      peakYear.name === 'junior' // Only senior retreat if junior was the peak
    ) {
      return 'senior_retreat';
    }

    // Check for general retreat (last value < first value * 0.7)
    if (values[values.length - 1] < values[0] * 0.7) {
      return 'retreating';
    }

    // Check for increasing
    let isIncreasing = true;
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        isIncreasing = false;
        break;
      }
    }
    if (isIncreasing && values[values.length - 1] > values[0] * 1.3) {
      return 'increasing';
    }

    // Check if maintaining high
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg >= 3) {
      return 'maintaining_high';
    }

    return 'maintaining_moderate';
  }

  // ========================================================================
  // GPA-RIGOR INTERACTION
  // ========================================================================

  private determineGPARigorInteraction(
    gpaAnalysis: TrajectoryAnalysis['gpa'],
    rigorAnalysis: TrajectoryAnalysis['rigor'],
    yearData: YearData[]
  ): GPARigorInteraction {
    // Compare sophomore to junior (most critical transition)
    const soGpa = gpaAnalysis.raw.sophomore;
    const jrGpa = gpaAnalysis.raw.junior;
    const soRigor = rigorAnalysis.by_year.sophomore;
    const jrRigor = rigorAnalysis.by_year.junior;

    // If we don't have both years, use overall trajectory
    if (
      soGpa === undefined ||
      jrGpa === undefined ||
      soRigor === undefined ||
      jrRigor === undefined
    ) {
      return this.inferInteractionFromTrajectory(gpaAnalysis.trajectory_type, rigorAnalysis.trajectory_type);
    }

    const gpaChange = jrGpa - soGpa;
    const rigorChange = jrRigor - soRigor;

    // Classify based on 3x3 matrix
    const gpaDirection = gpaChange > 0.05 ? 'up' : gpaChange < -0.05 ? 'down' : 'stable';
    const rigorDirection = rigorChange > 0.5 ? 'up' : rigorChange < -0.5 ? 'down' : 'stable';

    // Map to interaction type
    if (gpaDirection === 'up' && rigorDirection === 'up') return 'ideal';
    if (gpaDirection === 'stable' && rigorDirection === 'up') return 'good_growth';
    if (gpaDirection === 'up' && rigorDirection === 'stable') return 'good_mastery';
    if (gpaDirection === 'down' && rigorDirection === 'up') return 'acceptable_courage';
    if (gpaDirection === 'stable' && rigorDirection === 'stable') return 'neutral';
    if (gpaDirection === 'up' && rigorDirection === 'down') return 'suspect_protection';
    if (gpaDirection === 'stable' && rigorDirection === 'down') return 'concern_stagnant';
    if (gpaDirection === 'down' && rigorDirection === 'stable') return 'concern_struggle';
    if (gpaDirection === 'down' && rigorDirection === 'down') return 'critical_decline';

    return 'neutral';
  }

  private inferInteractionFromTrajectory(
    gpaTrajectory: TrajectoryType,
    rigorTrajectory: RigorTrajectoryType
  ): GPARigorInteraction {
    // Simplified inference when detailed year data isn't available
    if (rigorTrajectory === 'increasing') {
      if (['strong_ascending', 'moderate_ascending'].includes(gpaTrajectory)) return 'ideal';
      if (['high_plateau', 'mid_plateau'].includes(gpaTrajectory)) return 'good_growth';
      return 'acceptable_courage';
    }

    if (rigorTrajectory === 'retreating' || rigorTrajectory === 'senior_retreat') {
      if (['strong_ascending', 'moderate_ascending'].includes(gpaTrajectory)) return 'suspect_protection';
      if (['descending', 'senior_decline'].includes(gpaTrajectory)) return 'critical_decline';
      return 'concern_stagnant';
    }

    if (['descending', 'senior_decline'].includes(gpaTrajectory)) {
      return 'concern_struggle';
    }

    return 'neutral';
  }

  // ========================================================================
  // TRANSITION ANALYSIS
  // ========================================================================

  private analyzeTransitions(input: AcademicHistoryInput): TrajectoryAnalysis['transitions'] {
    const gpas = input.grade_history;

    return {
      freshman_to_sophomore: this.classifyTransition(
        gpas?.freshman?.gpa,
        gpas?.sophomore?.gpa,
        false // Not critical
      ),
      sophomore_to_junior: this.classifyTransition(
        gpas?.sophomore?.gpa,
        gpas?.junior?.gpa,
        true // CRITICAL
      ),
      junior_to_senior: this.classifyTransition(
        gpas?.junior?.gpa,
        gpas?.senior?.gpa,
        true // CRITICAL for decline
      ),
    };
  }

  private classifyTransition(
    fromGpa: number | undefined,
    toGpa: number | undefined,
    isCritical: boolean
  ): TransitionQuality {
    if (fromGpa === undefined || toGpa === undefined) return 'maintained';

    const change = toGpa - fromGpa;

    if (change >= 0.2) return 'excellent_growth';
    if (change >= 0.1) return 'good_growth';
    if (change >= -0.05) return 'maintained';
    if (change >= -0.15) return 'slight_dip';
    if (change >= -0.3) return 'significant_dip';
    return 'critical_decline';
  }

  // ========================================================================
  // INSIGHTS GENERATION
  // ========================================================================

  private generateInsights(
    gpaAnalysis: TrajectoryAnalysis['gpa'],
    rigorAnalysis: TrajectoryAnalysis['rigor'],
    interaction: GPARigorInteraction,
    transitions: TrajectoryAnalysis['transitions']
  ): { strengths: string[]; concerns: string[]; teachingInsight: string } {
    const strengths: string[] = [];
    const concerns: string[] = [];

    // GPA trajectory insights
    if (['strong_ascending', 'moderate_ascending'].includes(gpaAnalysis.trajectory_type)) {
      strengths.push('Upward GPA trajectory demonstrates growth and resilience');
    }
    if (gpaAnalysis.trajectory_type === 'high_plateau') {
      strengths.push('Consistently high performance across all years');
    }
    if (gpaAnalysis.trajectory_type === 'v_shape_recovery') {
      strengths.push('Strong recovery after initial challenges shows resilience');
    }

    if (gpaAnalysis.trajectory_type === 'senior_decline') {
      concerns.push('CRITICAL: Senior year decline ("senioritis") - 22% of colleges rescind for this');
    }
    if (gpaAnalysis.trajectory_type === 'junior_dip') {
      concerns.push('Junior year performance dropped - this is the most important year');
    }
    if (gpaAnalysis.trajectory_type === 'descending') {
      concerns.push('Declining trajectory over time raises serious concerns');
    }

    // Rigor trajectory insights
    if (rigorAnalysis.trajectory_type === 'increasing') {
      strengths.push('Progressively taking on more challenging coursework');
    }
    if (rigorAnalysis.trajectory_type === 'maintaining_high') {
      strengths.push('Maintaining maximum rigor throughout high school');
    }
    if (rigorAnalysis.trajectory_type === 'retreating') {
      concerns.push('Course rigor declining over time suggests avoiding challenge');
    }
    if (rigorAnalysis.trajectory_type === 'senior_retreat') {
      concerns.push('Senior year rigor reduction may appear as coasting');
    }

    // Interaction insights
    if (interaction === 'ideal') {
      strengths.push('Ideal pattern: GPA improving while rigor increases');
    }
    if (interaction === 'acceptable_courage') {
      strengths.push('Grade dip while increasing rigor shows intellectual courage');
    }
    if (interaction === 'suspect_protection') {
      concerns.push('GPA improved as rigor decreased - potential GPA protection strategy');
    }
    if (interaction === 'critical_decline') {
      concerns.push('Both GPA and rigor declining - signals disengagement');
    }

    // Transition insights
    if (transitions.sophomore_to_junior === 'critical_decline') {
      concerns.push('Major decline from sophomore to junior year - the most critical transition');
    }
    if (transitions.junior_to_senior === 'critical_decline') {
      concerns.push('Critical decline from junior to senior year - rescission risk');
    }
    if (['excellent_growth', 'good_growth'].includes(transitions.sophomore_to_junior)) {
      strengths.push('Strong improvement into junior year (most weighted year)');
    }

    // Generate teaching insight
    const teachingInsight = this.generateTeachingInsight(
      gpaAnalysis.trajectory_type,
      rigorAnalysis.trajectory_type,
      interaction,
      concerns.length > 0
    );

    return { strengths, concerns, teachingInsight };
  }

  private generateTeachingInsight(
    gpaTrajectory: TrajectoryType,
    rigorTrajectory: RigorTrajectoryType,
    interaction: GPARigorInteraction,
    hasConcerns: boolean
  ): string {
    if (gpaTrajectory === 'senior_decline') {
      return "Senior year grades are critical. 74.1% of colleges consider them important, and 22% rescind admissions annually for grade decline. If there are extenuating circumstances, explain them in the Additional Information section. Focus on strong mid-year grades to show recovery.";
    }

    if (interaction === 'suspect_protection') {
      return "Colleges notice when GPA improves as course rigor decreases. This 'GPA protection strategy' can signal risk aversion over intellectual curiosity. Elite schools prefer a B in AP Physics over an A in Regular Physics. If you have reasons for the course changes, explain them.";
    }

    if (interaction === 'acceptable_courage') {
      return "Your grades dipped as you took on more challenging courses - this is actually viewed positively. Colleges respect intellectual courage. A B+ in AP Calculus BC shows more than an A in Honors Pre-Calc. Your willingness to stretch yourself is a strength.";
    }

    if (['strong_ascending', 'moderate_ascending'].includes(gpaTrajectory)) {
      return "Your upward trajectory is exactly what colleges want to see. Growth over time signals maturity, improved work ethic, and college readiness. Admissions officers view freshman struggles differently when followed by strong improvement.";
    }

    if (gpaTrajectory === 'v_shape_recovery') {
      return "Your recovery from academic challenges demonstrates resilience - a quality colleges highly value. If there were circumstances behind the dip (health, family, adjustment), briefly explain in Additional Information. The recovery is the story here.";
    }

    if (!hasConcerns) {
      return "Your academic trajectory shows consistent performance. Continue maintaining strong grades and appropriate rigor through senior year. Colleges will see a reliable, steady profile.";
    }

    return "Review your academic patterns carefully. Junior year grades carry the most weight (35% of the academic evaluation), so focus efforts there. Avoid senior year decline at all costs - it's the top reason for rescinded admissions.";
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const trajectoryAnalyzer = new TrajectoryAnalyzer();

/**
 * Convenience function for trajectory analysis
 */
export function analyzeTrajectory(input: AcademicHistoryInput): TrajectoryAnalysis {
  return trajectoryAnalyzer.analyze(input);
}
