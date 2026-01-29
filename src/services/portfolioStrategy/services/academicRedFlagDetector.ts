/**
 * Academic Red Flag Detector
 *
 * Comprehensive academic red flag detection using Section 6.9 patterns.
 * Identifies potential concerns in academic profiles with severity tiering
 * and mitigation guidance.
 *
 * 4-TIER SEVERITY SYSTEM:
 * - Tier 1: Disqualifying (academic dishonesty, falsification)
 * - Tier 2: Serious (senior decline, rigor avoidance, major mismatch)
 * - Tier 3: Moderate (GPA-test mismatch, single dip)
 * - Tier 4: Minor (outlier grade, unusual sequence)
 *
 * @version 1.0
 * @date January 2026
 */

import type { AcademicHistoryInput, CourseRecord } from './academicHistoryAnalyzer';
import { trajectoryAnalyzer, type GPARigorInteraction, type TrajectoryAnalysis } from './trajectoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export type RedFlagSeverity = 'tier1_disqualifying' | 'tier2_serious' | 'tier3_moderate' | 'tier4_minor';

export interface DetectedRedFlag {
  flag_id: string;
  flag_name: string;
  severity: RedFlagSeverity;
  category: 'integrity' | 'rigor' | 'performance' | 'trajectory' | 'testing' | 'documentation';
  description: string;
  evidence: string;
  impact: string;
  mitigation_guidance: string;
  addressable: boolean; // Can this be explained/mitigated?
  citation: {
    source: string;
    quote: string;
    module_reference: string;
  };
}

export interface RedFlagReport {
  overall_risk_level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  flags_detected: DetectedRedFlag[];
  flags_by_severity: {
    tier1: DetectedRedFlag[];
    tier2: DetectedRedFlag[];
    tier3: DetectedRedFlag[];
    tier4: DetectedRedFlag[];
  };
  summary: string;
  recommended_actions: string[];
  teaching_insight: string;
}

// ============================================================================
// RED FLAG DEFINITIONS
// Section 6.9 Research-Backed Patterns
// ============================================================================

interface RedFlagDefinition {
  id: string;
  name: string;
  severity: RedFlagSeverity;
  category: DetectedRedFlag['category'];
  description: string;
  detection_criteria: string;
  impact: string;
  mitigation: string;
  addressable: boolean;
  citation: {
    source: string;
    quote: string;
    module_reference: string;
  };
}

const RED_FLAG_DEFINITIONS: RedFlagDefinition[] = [
  // ========================================================================
  // TIER 1: DISQUALIFYING
  // ========================================================================
  {
    id: 'academic_dishonesty',
    name: 'Academic Dishonesty',
    severity: 'tier1_disqualifying',
    category: 'integrity',
    description: 'Documented cheating, plagiarism, or academic misconduct',
    detection_criteria: 'Disciplinary action noted; requires disclosure',
    impact: 'Likely rejection; admission offers may be rescinded',
    mitigation: 'Requires exceptional circumstances explanation and demonstrated growth',
    addressable: false,
    citation: {
      source: 'NACAC Ethical Standards',
      quote: 'Academic dishonesty is grounds for rescinding admission offers.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'transcript_falsification',
    name: 'Transcript Falsification',
    severity: 'tier1_disqualifying',
    category: 'integrity',
    description: 'Misrepresented courses, grades, or credentials',
    detection_criteria: 'Discrepancies between self-reported and official records',
    impact: 'Automatic rejection and possible reporting',
    mitigation: 'None - complete honesty is the only path',
    addressable: false,
    citation: {
      source: 'NACAC',
      quote: 'Any misrepresentation of academic credentials is grounds for immediate rejection.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },

  // ========================================================================
  // TIER 2: SERIOUS
  // ========================================================================
  {
    id: 'senior_year_decline',
    name: 'Senior Year Decline (Senioritis)',
    severity: 'tier2_serious',
    category: 'trajectory',
    description: 'Significant grade drop in senior year',
    detection_criteria: 'GPA drop of 0.3+ or multiple B/C grades after strong junior year',
    impact: 'Major concern; 22% of colleges rescind at least one admission annually',
    mitigation: 'Strong mid-year/final transcripts; explain circumstances if applicable',
    addressable: true,
    citation: {
      source: 'NACAC / Education Week',
      quote: '74.1% of colleges consider senior year grades important. 22% rescinded at least one admission per year.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'rigor_avoidance_high_gpa',
    name: 'Rigor Avoidance with High GPA',
    severity: 'tier2_serious',
    category: 'rigor',
    description: 'Perfect or near-perfect GPA with minimal advanced courses',
    detection_criteria: '<3 AP/IB courses with 3.9+ GPA when 10+ APs available',
    impact: 'Signals grade protection over intellectual curiosity',
    mitigation: 'Explain rationale; demonstrate intellectual curiosity elsewhere',
    addressable: true,
    citation: {
      source: 'CollegeVine / IvyWise',
      quote: 'Admissions officers assess whether a student challenged themselves with available rigor.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'major_course_mismatch',
    name: 'Major-Course Mismatch',
    severity: 'tier2_serious',
    category: 'rigor',
    description: 'Intended major without relevant advanced coursework',
    detection_criteria: 'STEM major without Calc BC/Physics; CS without CS A; etc.',
    impact: 'Questions authenticity of stated interest',
    mitigation: 'Summer programs, independent study, explain access limitations',
    addressable: true,
    citation: {
      source: 'MIT Admissions',
      quote: 'We expect students interested in STEM to have challenged themselves with advanced math and science.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'course_withdrawal_pattern',
    name: 'Pattern of Course Withdrawals',
    severity: 'tier2_serious',
    category: 'performance',
    description: 'Multiple withdrawals from challenging courses',
    detection_criteria: '2+ W grades on transcript, especially from AP/Honors',
    impact: 'Suggests inability to handle rigor',
    mitigation: 'Explain circumstances; show strong performance elsewhere',
    addressable: true,
    citation: {
      source: 'College Admission Research',
      quote: 'Multiple withdrawals, especially from advanced courses, raise questions about persistence.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },

  // ========================================================================
  // TIER 3: MODERATE
  // ========================================================================
  {
    id: 'gpa_test_mismatch',
    name: 'GPA-Test Score Mismatch',
    severity: 'tier3_moderate',
    category: 'testing',
    description: 'Significant divergence between GPA and standardized test scores',
    detection_criteria: '4.0 GPA with <1350 SAT, or 3.5 GPA with 1550+ SAT',
    impact: 'Creates uncertainty about actual academic level',
    mitigation: 'Test-optional if scores hurt; explain grade deflation if GPA low',
    addressable: true,
    citation: {
      source: 'Opportunity Insights Research',
      quote: 'Higher SAT scores correlate with college GPA more than high school GPA does.',
      module_reference: 'Section 6.6: Grade Interpretation',
    },
  },
  {
    id: 'ap_score_grade_mismatch',
    name: 'AP Score-Grade Mismatch',
    severity: 'tier3_moderate',
    category: 'testing',
    description: 'High course grade but low exam score',
    detection_criteria: 'A in AP course but 1-2 on exam',
    impact: 'Suggests grade inflation at school',
    mitigation: 'Consider not reporting low AP scores; address in additional info',
    addressable: true,
    citation: {
      source: 'College Board',
      quote: 'AP scores provide external validation of course grades.',
      module_reference: 'Section 6.2: AP Course Difficulty Tiers',
    },
  },
  {
    id: 'single_year_dip',
    name: 'Single Year Dip with Recovery',
    severity: 'tier3_moderate',
    category: 'trajectory',
    description: 'One semester/year of poor performance followed by recovery',
    detection_criteria: 'GPA drop of 0.3+ in one year, then recovery',
    impact: 'Context-dependent; recovery is positive',
    mitigation: 'Upward trajectory is positive; explain circumstances if applicable',
    addressable: true,
    citation: {
      source: 'CollegeVine',
      quote: 'An upward trend after difficulty shows resilience and growth capacity.',
      module_reference: 'Section 6.6: Grade Interpretation',
    },
  },
  {
    id: 'missing_core_rigor',
    name: 'Missing Core Subject Rigor',
    severity: 'tier3_moderate',
    category: 'rigor',
    description: 'No advanced coursework in a core academic area',
    detection_criteria: 'No Honors/AP in English, Math, Science, History, or Language',
    impact: 'Questions breadth of preparation',
    mitigation: 'Explain if not offered; show strength elsewhere',
    addressable: true,
    citation: {
      source: 'NACAC',
      quote: 'Colleges expect advanced work in core academic areas when available.',
      module_reference: 'Section 6.1: Course Level Hierarchy',
    },
  },
  {
    id: 'de_without_ap_available',
    name: 'Dual Enrollment Over Available APs',
    severity: 'tier3_moderate',
    category: 'rigor',
    description: 'Chose community college courses when APs were available',
    detection_criteria: 'CC dual enrollment in subjects where AP was offered',
    impact: 'May appear to be avoiding standardized AP exams',
    mitigation: 'Explain rationale; strong DE grades can help',
    addressable: true,
    citation: {
      source: 'CollegeVine',
      quote: 'At elite schools, dual enrollment works as evidence of rigor, not a replacement for AP.',
      module_reference: 'Section 6.3: Dual Enrollment Evaluation',
    },
  },

  // ========================================================================
  // TIER 4: MINOR
  // ========================================================================
  {
    id: 'single_outlier_grade',
    name: 'Single Outlier Grade',
    severity: 'tier4_minor',
    category: 'performance',
    description: 'One C or lower in otherwise strong transcript',
    detection_criteria: 'Single subject area weakness (e.g., C in AP Physics with all As elsewhere)',
    impact: 'Usually explainable; rarely decisive',
    mitigation: 'Often no explanation needed; brief note if relevant',
    addressable: true,
    citation: {
      source: 'Admissions Officers Survey',
      quote: 'Minor inconsistencies are rarely decisive factors in admission decisions.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'unusual_course_sequence',
    name: 'Unusual Course Sequence',
    severity: 'tier4_minor',
    category: 'rigor',
    description: 'Taking courses out of typical order',
    detection_criteria: 'AP Physics before Honors Physics, etc.',
    impact: 'Can be positive if shows initiative; may need explanation',
    mitigation: 'Can be positive; explain if concerning',
    addressable: true,
    citation: {
      source: 'College Counselor Consensus',
      quote: 'Non-traditional sequences can show initiative if successful.',
      module_reference: 'Section 6.4: Course Sequencing',
    },
  },
  {
    id: 'light_senior_schedule',
    name: 'Light Senior Schedule',
    severity: 'tier4_minor',
    category: 'rigor',
    description: 'Fewer courses or reduced rigor in senior year',
    detection_criteria: 'Dropping from 6 to 4 courses or significant rigor reduction',
    impact: 'May appear to be coasting',
    mitigation: 'Explain if pursuing meaningful activities or work',
    addressable: true,
    citation: {
      source: 'NACAC',
      quote: 'Light senior schedules should have justification beyond convenience.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'inconsistent_performance',
    name: 'Inconsistent Performance Pattern',
    severity: 'tier4_minor',
    category: 'trajectory',
    description: 'Grades vary significantly without clear pattern',
    detection_criteria: 'Mix of As and Cs without subject-specific explanation',
    impact: 'Raises questions about consistency and focus',
    mitigation: 'May indicate passion areas vs others; explain if applicable',
    addressable: true,
    citation: {
      source: 'Admissions Research',
      quote: 'Inconsistent grades may indicate engagement issues or external factors.',
      module_reference: 'Section 6.6: Grade Interpretation',
    },
  },

  // ========================================================================
  // TRAJECTORY-BASED FLAGS (GPA-Rigor Interaction Matrix)
  // ========================================================================
  {
    id: 'gpa_protection_strategy',
    name: 'GPA Protection Strategy',
    severity: 'tier2_serious',
    category: 'trajectory',
    description: 'GPA improved while course rigor decreased - classic GPA protection pattern',
    detection_criteria: 'GPA increased 0.1+ while rigor decreased significantly from sophomore to junior year',
    impact: 'Signals risk aversion over intellectual curiosity; elite schools prefer B in hard courses',
    mitigation: 'Explain rationale for course changes; demonstrate intellectual curiosity through other activities',
    addressable: true,
    citation: {
      source: 'MIT/Stanford Admissions Officers',
      quote: 'We would rather see a student struggle in challenging courses than coast in easier ones.',
      module_reference: 'Section 6.6: Grade Interpretation - GPA-Rigor Interaction',
    },
  },
  {
    id: 'junior_year_critical_decline',
    name: 'Junior Year Critical Performance',
    severity: 'tier2_serious',
    category: 'trajectory',
    description: 'Significant decline during the most heavily weighted year',
    detection_criteria: 'GPA dropped 0.2+ from sophomore to junior year (the most critical transition)',
    impact: 'Junior year carries 35% weight in academic evaluation; decline here is highly visible',
    mitigation: 'Strong senior year recovery; explain circumstances in Additional Information',
    addressable: true,
    citation: {
      source: 'College Admissions Research',
      quote: 'Junior year is widely regarded as the most important year for college admission.',
      module_reference: 'Section 6.6: Grade Interpretation - Year Weighting',
    },
  },
  {
    id: 'rigor_retreat_pattern',
    name: 'Rigor Retreat Pattern',
    severity: 'tier2_serious',
    category: 'rigor',
    description: 'Consistent reduction in course difficulty over time',
    detection_criteria: 'Course rigor decreased 30%+ from peak to current year',
    impact: 'Signals avoidance of challenge; may indicate burnout or strategic GPA protection',
    mitigation: 'Explain if pursuing specialized interests or external constraints',
    addressable: true,
    citation: {
      source: 'CollegeVine / IvyWise',
      quote: 'Elite colleges expect students to maintain or increase rigor, not retreat.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'senior_rigor_retreat',
    name: 'Senior Year Rigor Retreat',
    severity: 'tier3_moderate',
    category: 'rigor',
    description: 'Significant drop in course rigor specifically in senior year',
    detection_criteria: 'Senior year rigor 30%+ lower than junior year',
    impact: 'May appear as early senioritis or challenge avoidance',
    mitigation: 'Explain if pursuing college applications, work, or other meaningful activities',
    addressable: true,
    citation: {
      source: 'NACAC Guidelines',
      quote: 'Senior year course selection is evaluated for continued engagement.',
      module_reference: 'Section 6.9: Academic Red Flags',
    },
  },
  {
    id: 'critical_decline_pattern',
    name: 'Critical Decline Pattern',
    severity: 'tier2_serious',
    category: 'trajectory',
    description: 'Both GPA and course rigor declining simultaneously',
    detection_criteria: 'GPA dropped AND rigor decreased - signals disengagement',
    impact: 'Strongest negative signal - indicates academic disengagement',
    mitigation: 'Requires strong explanation; demonstrate re-engagement elsewhere',
    addressable: true,
    citation: {
      source: 'College Admissions Research',
      quote: 'Simultaneous GPA and rigor decline is the most concerning pattern.',
      module_reference: 'Section 6.6: Grade Interpretation - GPA-Rigor Matrix',
    },
  },
  {
    id: 'no_testing_data',
    name: 'No Standardized Testing',
    severity: 'tier4_minor',
    category: 'testing',
    description: 'No SAT, ACT, or AP exam scores available',
    detection_criteria: 'Complete absence of standardized test data',
    impact: 'Makes evaluation harder; may hurt in competitive pools',
    mitigation: 'Strong grades and external validation (competitions, DE grades)',
    addressable: true,
    citation: {
      source: 'NACAC',
      quote: 'While test-optional is widespread, having no external validation makes comparison harder.',
      module_reference: 'Section 6.6: Grade Interpretation',
    },
  },
];

// ============================================================================
// RED FLAG DETECTOR CLASS
// ============================================================================

export class AcademicRedFlagDetector {
  /**
   * Run comprehensive red flag detection on an academic profile
   * Now integrates with TrajectoryAnalyzer for GPA-Rigor interaction detection
   */
  detect(input: AcademicHistoryInput): RedFlagReport {
    const detectedFlags: DetectedRedFlag[] = [];

    // Run trajectory analysis first - provides data for interaction-based flags
    const trajectoryAnalysis = trajectoryAnalyzer.analyze(input);

    // Run all detection checks
    detectedFlags.push(...this.checkRigorFlags(input));
    detectedFlags.push(...this.checkTrajectoryFlags(input));
    detectedFlags.push(...this.checkTestingFlags(input));
    detectedFlags.push(...this.checkPerformanceFlags(input));

    // NEW: Check trajectory-based interaction flags (GPA-Rigor Matrix)
    detectedFlags.push(...this.checkTrajectoryInteractionFlags(input, trajectoryAnalysis));

    // Organize by severity
    const flagsBySeverity = {
      tier1: detectedFlags.filter((f) => f.severity === 'tier1_disqualifying'),
      tier2: detectedFlags.filter((f) => f.severity === 'tier2_serious'),
      tier3: detectedFlags.filter((f) => f.severity === 'tier3_moderate'),
      tier4: detectedFlags.filter((f) => f.severity === 'tier4_minor'),
    };

    // Calculate overall risk level
    const overallRisk = this.calculateOverallRisk(flagsBySeverity);

    // Generate summary and recommendations
    const summary = this.generateSummary(detectedFlags, overallRisk);
    const recommendations = this.generateRecommendations(detectedFlags);
    const teachingInsight = this.generateTeachingInsight(detectedFlags, overallRisk);

    return {
      overall_risk_level: overallRisk,
      flags_detected: detectedFlags,
      flags_by_severity: flagsBySeverity,
      summary,
      recommended_actions: recommendations,
      teaching_insight: teachingInsight,
    };
  }

  // ========================================================================
  // TRAJECTORY INTERACTION FLAGS (GPA-Rigor Matrix)
  // ========================================================================

  /**
   * Check for flags based on GPA-Rigor interaction patterns from TrajectoryAnalyzer
   * This is where we detect the sophisticated patterns:
   * - GPA protection strategy (GPA↑ + Rigor↓)
   * - Critical decline (GPA↓ + Rigor↓)
   * - Junior year specific issues
   * - Rigor retreat patterns
   */
  private checkTrajectoryInteractionFlags(
    input: AcademicHistoryInput,
    trajectory: TrajectoryAnalysis
  ): DetectedRedFlag[] {
    const flags: DetectedRedFlag[] = [];

    // Check 1: GPA Protection Strategy (suspect_protection)
    // GPA improved while rigor decreased - classic gaming behavior
    if (trajectory.gpa_rigor_interaction === 'suspect_protection') {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'gpa_protection_strategy')!;
      const gpaChange = this.getGpaChangeDescription(trajectory);
      const rigorChange = this.getRigorChangeDescription(trajectory);
      flags.push(
        this.createFlag(
          def,
          `${gpaChange} while ${rigorChange}. This suggests prioritizing grades over intellectual growth.`
        )
      );
    }

    // Check 2: Critical Decline Pattern (both declining)
    if (trajectory.gpa_rigor_interaction === 'critical_decline') {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'critical_decline_pattern')!;
      flags.push(
        this.createFlag(
          def,
          `Both GPA and course rigor are declining, signaling potential academic disengagement.`
        )
      );
    }

    // Check 3: Junior Year Critical Transition
    // The sophomore→junior transition is the MOST IMPORTANT
    if (
      trajectory.transitions.sophomore_to_junior === 'significant_dip' ||
      trajectory.transitions.sophomore_to_junior === 'critical_decline'
    ) {
      const soGpa = trajectory.gpa.raw.sophomore;
      const jrGpa = trajectory.gpa.raw.junior;
      if (soGpa !== undefined && jrGpa !== undefined) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'junior_year_critical_decline')!;
        flags.push(
          this.createFlag(
            def,
            `GPA dropped from ${soGpa.toFixed(2)} (sophomore) to ${jrGpa.toFixed(2)} (junior) - the most heavily weighted transition.`
          )
        );
      }
    }

    // Check 4: Rigor Retreat Pattern (overall retreat over time)
    if (trajectory.rigor.trajectory_type === 'retreating') {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'rigor_retreat_pattern')!;
      const peakYear = this.findPeakRigorYear(trajectory);
      flags.push(
        this.createFlag(
          def,
          `Course rigor peaked in ${peakYear} and has declined since. Pattern suggests avoiding academic challenge.`
        )
      );
    }

    // Check 5: Senior Rigor Retreat (specific to senior year)
    if (trajectory.rigor.trajectory_type === 'senior_retreat') {
      // Only flag if not already flagged for general retreat
      const hasGeneralRetreat = flags.some((f) => f.flag_id === 'rigor_retreat_pattern');
      if (!hasGeneralRetreat) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'senior_rigor_retreat')!;
        const jrRigor = trajectory.rigor.by_year.junior || 0;
        const srRigor = trajectory.rigor.by_year.senior || 0;
        flags.push(
          this.createFlag(
            def,
            `Senior year rigor (${srRigor.toFixed(1)}) is significantly lower than junior year (${jrRigor.toFixed(1)}).`
          )
        );
      }
    }

    // Check 6: Stagnation with reduced rigor (concern_stagnant)
    if (trajectory.gpa_rigor_interaction === 'concern_stagnant') {
      // This is less severe than GPA protection but still noteworthy
      // Only flag if we haven't already flagged rigor retreat
      const hasRigorFlag = flags.some(
        (f) => f.flag_id === 'rigor_retreat_pattern' || f.flag_id === 'senior_rigor_retreat'
      );
      if (!hasRigorFlag && trajectory.rigor.maximization_percentage < 50) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'light_senior_schedule')!;
        flags.push(
          this.createFlag(
            def,
            `Stable GPA with declining rigor suggests coasting. Only ${trajectory.rigor.maximization_percentage}% rigor maximization.`
          )
        );
      }
    }

    return flags;
  }

  /**
   * Generate human-readable GPA change description
   */
  private getGpaChangeDescription(trajectory: TrajectoryAnalysis): string {
    const soGpa = trajectory.gpa.raw.sophomore;
    const jrGpa = trajectory.gpa.raw.junior;

    if (soGpa !== undefined && jrGpa !== undefined) {
      const change = jrGpa - soGpa;
      if (change > 0.1) return `GPA improved from ${soGpa.toFixed(2)} to ${jrGpa.toFixed(2)}`;
      if (change > 0) return `GPA slightly improved to ${jrGpa.toFixed(2)}`;
    }

    return 'GPA improved';
  }

  /**
   * Generate human-readable rigor change description
   */
  private getRigorChangeDescription(trajectory: TrajectoryAnalysis): string {
    const soRigor = trajectory.rigor.by_year.sophomore;
    const jrRigor = trajectory.rigor.by_year.junior;

    if (soRigor !== undefined && jrRigor !== undefined && soRigor > 0) {
      const decrease = ((soRigor - jrRigor) / soRigor) * 100;
      if (decrease > 30) return `course rigor dropped ${decrease.toFixed(0)}%`;
      if (decrease > 0) return 'course rigor decreased';
    }

    return 'course rigor decreased';
  }

  /**
   * Find which year had peak rigor
   */
  private findPeakRigorYear(trajectory: TrajectoryAnalysis): string {
    const rigorByYear = trajectory.rigor.by_year;
    const years = [
      { name: 'freshman year', rigor: rigorByYear.freshman || 0 },
      { name: 'sophomore year', rigor: rigorByYear.sophomore || 0 },
      { name: 'junior year', rigor: rigorByYear.junior || 0 },
      { name: 'senior year', rigor: rigorByYear.senior || 0 },
    ];

    const peak = years.reduce((max, year) => (year.rigor > max.rigor ? year : max));
    return peak.name;
  }

  // ========================================================================
  // DETECTION METHODS
  // ========================================================================

  private checkRigorFlags(input: AcademicHistoryInput): DetectedRedFlag[] {
    const flags: DetectedRedFlag[] = [];

    // Count advanced courses - distinguish between "challenging" and "easy" APs
    const easyAPs = ['AP Environmental Science', 'AP Human Geography', 'AP Psychology'];
    const apCourses = input.courses.filter((c) => c.level === 'ap');
    const challengingApCount = apCourses.filter(
      (c) => !easyAPs.some((easy) => c.name.toLowerCase().includes(easy.toLowerCase().replace('ap ', '')))
    ).length;
    const easyApCount = apCourses.length - challengingApCount;
    const ibHlCount = input.courses.filter((c) => c.level === 'ib_hl').length;
    const ibSlCount = input.courses.filter((c) => c.level === 'ib_sl').length;
    const honorsCount = input.courses.filter((c) => c.level === 'honors').length;
    const deCount = input.courses.filter((c) => c.level === 'dual_enrollment').length;

    // For rigor assessment, IB HL counts as full, IB SL counts as half, easy APs count as 0.5
    const effectiveRigorCount = challengingApCount + ibHlCount + (ibSlCount * 0.5) + (easyApCount * 0.5) + (deCount * 0.8);
    const totalAdvanced = apCourses.length + ibHlCount + ibSlCount + honorsCount + deCount;

    // Get school AP availability
    const apAvailable = input.school_context.ap_courses_offered || 10; // Default assumption

    // Check if this is a homeschool student with external validation
    const isHomeschool = input.school_context.type === 'homeschool';
    const hasStrongExternalValidation = isHomeschool && this.hasStrongHomeschoolValidation(input);

    // Check: Rigor Avoidance with High GPA
    // Only flag if:
    // 1. High GPA with minimal challenging coursework
    // 2. School offers many APs (well-resourced)
    // 3. NOT a homeschool student with strong external validation
    const gpa = input.gpa.unweighted || input.gpa.weighted || 0;
    if (gpa >= 3.9 && effectiveRigorCount < 3 && apAvailable >= 10 && !hasStrongExternalValidation) {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'rigor_avoidance_high_gpa')!;
      flags.push(this.createFlag(def, `GPA of ${gpa.toFixed(2)} with only ${totalAdvanced} advanced courses when ${apAvailable} APs available`));
    }

    // Check: Major-Course Mismatch
    if (input.intended_major) {
      const majorMismatch = this.checkMajorMismatch(input.intended_major, input.courses);
      if (majorMismatch) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'major_course_mismatch')!;
        flags.push(this.createFlag(def, majorMismatch));
      }
    }

    // Check: Missing Core Subject Rigor
    // Skip this check for:
    // - IB students (they have a structured curriculum)
    // - Homeschool students with strong external validation
    // - Schools with limited AP offerings
    const isIBStudent = input.school_context.ib_program === true || input.school_context.curriculum === 'ib';
    if (!isIBStudent && !hasStrongExternalValidation && apAvailable >= 5) {
      const coreSubjects = ['math', 'science', 'english', 'social_studies', 'foreign_language'];
      for (const subject of coreSubjects) {
        const advancedInSubject = input.courses.filter(
          (c) => c.subject === subject && ['ap', 'ib_hl', 'ib_sl', 'honors', 'dual_enrollment'].includes(c.level)
        );
        if (advancedInSubject.length === 0) {
          const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'missing_core_rigor')!;
          flags.push(this.createFlag(def, `No advanced coursework in ${subject}`));
          break; // Only flag once
        }
      }
    }

    // Check: Light Senior Schedule
    const seniorCourses = input.courses.filter((c) => c.year === 12);
    const juniorCourses = input.courses.filter((c) => c.year === 11);
    if (seniorCourses.length > 0 && juniorCourses.length > 0) {
      if (seniorCourses.length <= juniorCourses.length - 2) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'light_senior_schedule')!;
        flags.push(this.createFlag(def, `${seniorCourses.length} senior courses vs ${juniorCourses.length} junior courses`));
      }
    }

    // Check: DE over available APs
    const ccDeCourses = input.courses.filter((c) => c.level === 'dual_enrollment' && c.de_type === 'community_college');
    const apCount = apCourses.length;
    if (ccDeCourses.length > 2 && apAvailable >= 10 && apCount < 5) {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'de_without_ap_available')!;
      flags.push(this.createFlag(def, `${ccDeCourses.length} CC dual enrollment courses with only ${apCount} APs taken`));
    }

    return flags;
  }

  private checkTrajectoryFlags(input: AcademicHistoryInput): DetectedRedFlag[] {
    const flags: DetectedRedFlag[] = [];

    if (!input.grade_history) return flags;

    const gpas = [
      input.grade_history.freshman?.gpa,
      input.grade_history.sophomore?.gpa,
      input.grade_history.junior?.gpa,
      input.grade_history.senior?.gpa,
    ].filter((g): g is number => g !== undefined);

    if (gpas.length < 3) return flags;

    // Check: Senior Year Decline
    if (gpas.length >= 4) {
      const juniorGpa = gpas[2];
      const seniorGpa = gpas[3];
      if (juniorGpa - seniorGpa >= 0.3) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'senior_year_decline')!;
        flags.push(
          this.createFlag(
            def,
            `GPA dropped from ${juniorGpa.toFixed(2)} (junior) to ${seniorGpa.toFixed(2)} (senior)`
          )
        );
      }
    }

    // Check: Single Year Dip with Recovery
    for (let i = 1; i < gpas.length - 1; i++) {
      const prev = gpas[i - 1];
      const current = gpas[i];
      const next = gpas[i + 1];

      if (prev - current >= 0.3 && next - current >= 0.2) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'single_year_dip')!;
        flags.push(
          this.createFlag(
            def,
            `GPA dipped to ${current.toFixed(2)} in year ${i + 1}, then recovered to ${next.toFixed(2)}`
          )
        );
        break; // Only flag once
      }
    }

    // Check: Inconsistent Performance
    const gpaVariance = this.calculateVariance(gpas);
    if (gpaVariance > 0.15) {
      // High variance
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'inconsistent_performance')!;
      flags.push(this.createFlag(def, `GPA variance of ${gpaVariance.toFixed(3)} across years`));
    }

    return flags;
  }

  private checkTestingFlags(input: AcademicHistoryInput): DetectedRedFlag[] {
    const flags: DetectedRedFlag[] = [];

    // Check: No Testing Data
    // Consider "no testing" if test_scores is undefined, null, or an empty object with no actual scores
    const hasSAT = input.test_scores?.sat?.total;
    const hasACT = input.test_scores?.act?.composite;
    const hasAPExams = input.test_scores?.ap_exams && input.test_scores.ap_exams.length > 0;
    const hasIBExams = input.test_scores?.ib_exams && input.test_scores.ib_exams.length > 0;
    const hasAnyTesting = hasSAT || hasACT || hasAPExams || hasIBExams;

    if (!hasAnyTesting) {
      const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'no_testing_data')!;
      flags.push(this.createFlag(def, 'No SAT, ACT, or AP exam scores available'));
      return flags;
    }

    // Check: GPA-Test Mismatch
    const gpa = input.gpa.unweighted || input.gpa.weighted || 0;
    const sat = input.test_scores.sat?.total;
    const act = input.test_scores.act?.composite;

    if (sat) {
      if (gpa >= 3.9 && sat < 1350) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'gpa_test_mismatch')!;
        flags.push(this.createFlag(def, `${gpa.toFixed(2)} GPA with ${sat} SAT`));
      } else if (gpa < 3.6 && sat >= 1500) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'gpa_test_mismatch')!;
        flags.push(this.createFlag(def, `${gpa.toFixed(2)} GPA with ${sat} SAT`));
      }
    }

    if (act) {
      if (gpa >= 3.9 && act < 28) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'gpa_test_mismatch')!;
        flags.push(this.createFlag(def, `${gpa.toFixed(2)} GPA with ${act} ACT`));
      } else if (gpa < 3.6 && act >= 33) {
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'gpa_test_mismatch')!;
        flags.push(this.createFlag(def, `${gpa.toFixed(2)} GPA with ${act} ACT`));
      }
    }

    // Check: AP Score-Grade Mismatch
    if (input.test_scores.ap_exams) {
      for (const exam of input.test_scores.ap_exams) {
        // Find corresponding course
        const course = input.courses.find(
          (c) => c.level === 'ap' && c.name.toLowerCase().includes(exam.subject.toLowerCase())
        );
        if (course && course.grade && exam.score <= 2) {
          const gradeValue = this.gradeToNumber(course.grade);
          if (gradeValue >= 3.7) {
            // A- or better
            const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'ap_score_grade_mismatch')!;
            flags.push(this.createFlag(def, `${course.grade} in AP ${exam.subject} but score of ${exam.score}`));
          }
        }
      }
    }

    return flags;
  }

  private checkPerformanceFlags(input: AcademicHistoryInput): DetectedRedFlag[] {
    const flags: DetectedRedFlag[] = [];

    // Check for outlier grades
    const courseGrades = input.courses.map((c) => ({
      course: c.name,
      grade: this.gradeToNumber(c.grade),
      subject: c.subject,
    }));

    const avgGrade = courseGrades.reduce((sum, c) => sum + c.grade, 0) / courseGrades.length;

    for (const course of courseGrades) {
      if (avgGrade - course.grade >= 1.5) {
        // C or lower when average is A/B
        const def = RED_FLAG_DEFINITIONS.find((d) => d.id === 'single_outlier_grade')!;
        flags.push(
          this.createFlag(
            def,
            `Low grade in ${course.course} (${this.numberToGrade(course.grade)}) compared to average (${this.numberToGrade(avgGrade)})`
          )
        );
        break; // Only flag once
      }
    }

    return flags;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private checkMajorMismatch(major: string, courses: CourseRecord[]): string | null {
    const majorLower = major.toLowerCase();

    // Helper: check if student has advanced coursework in a subject
    // Recognizes AP, IB HL, IB SL, and dual enrollment as valid advanced courses
    const hasAdvancedInSubject = (subjectKeywords: string[]): boolean => {
      return courses.some((c) => {
        const advancedLevels = ['ap', 'ib_hl', 'ib_sl', 'dual_enrollment'];
        if (!advancedLevels.includes(c.level)) return false;

        const courseName = c.name.toLowerCase();
        return subjectKeywords.some((keyword) => courseName.includes(keyword.toLowerCase()));
      });
    };

    // STEM majors (Engineering, Physics, Math, Computer Science)
    if (
      majorLower.includes('engineer') ||
      majorLower.includes('physics') ||
      majorLower.includes('math') ||
      majorLower.includes('computer')
    ) {
      const hasCalc = hasAdvancedInSubject(['calc', 'calculus', 'math aa', 'math analysis', 'mathematics']);
      const hasPhysics = hasAdvancedInSubject(['physics']);

      if (!hasCalc && !hasPhysics) {
        return `Intended major: ${major}, but no AP Calculus or Physics`;
      }
    }

    // CS majors specifically
    if (majorLower.includes('computer') || majorLower.includes('cs ') || majorLower.includes('software')) {
      const hasCS = hasAdvancedInSubject(['computer', 'cs ', 'programming', 'software']);
      const hasCalc = hasAdvancedInSubject(['calc', 'calculus', 'math aa', 'mathematics']);

      if (!hasCS && !hasCalc) {
        return `Intended major: ${major}, but no AP Computer Science or Calculus`;
      }
    }

    // Bio/Pre-med
    if (majorLower.includes('bio') || majorLower.includes('pre-med') || majorLower.includes('premed')) {
      const hasBio = hasAdvancedInSubject(['bio']);
      const hasChem = hasAdvancedInSubject(['chem']);

      if (!hasBio && !hasChem) {
        return `Intended major: ${major}, but no AP Biology or Chemistry`;
      }
    }

    return null;
  }

  private createFlag(definition: RedFlagDefinition, evidence: string): DetectedRedFlag {
    return {
      flag_id: definition.id,
      flag_name: definition.name,
      severity: definition.severity,
      category: definition.category,
      description: definition.description,
      evidence,
      impact: definition.impact,
      mitigation_guidance: definition.mitigation,
      addressable: definition.addressable,
      citation: definition.citation,
    };
  }

  private calculateOverallRisk(
    flagsBySeverity: RedFlagReport['flags_by_severity']
  ): RedFlagReport['overall_risk_level'] {
    if (flagsBySeverity.tier1.length > 0) return 'critical';
    if (flagsBySeverity.tier2.length >= 2) return 'high';
    if (flagsBySeverity.tier2.length === 1) return 'moderate';
    if (flagsBySeverity.tier3.length >= 2) return 'moderate';
    if (flagsBySeverity.tier3.length === 1 || flagsBySeverity.tier4.length >= 2) return 'low';
    return 'none';
  }

  private generateSummary(flags: DetectedRedFlag[], risk: RedFlagReport['overall_risk_level']): string {
    if (flags.length === 0) {
      return 'No significant academic red flags detected. Profile presents well for competitive admissions.';
    }

    const summaries: Record<RedFlagReport['overall_risk_level'], string> = {
      none: 'No significant concerns identified.',
      low: 'Minor concerns identified that can be easily addressed or explained.',
      moderate: 'Some concerns that should be proactively addressed in the application.',
      high: 'Significant concerns that need direct attention and strategic positioning.',
      critical: 'Critical issues that may require disclosure and extensive explanation.',
    };

    const flagSummary = flags.map((f) => f.flag_name).join(', ');
    return `${summaries[risk]} Issues detected: ${flagSummary}.`;
  }

  private generateRecommendations(flags: DetectedRedFlag[]): string[] {
    const recommendations: string[] = [];

    for (const flag of flags) {
      if (flag.addressable) {
        recommendations.push(flag.mitigation_guidance);
      }
    }

    // Add general recommendations based on flag types
    const hasTestingFlags = flags.some((f) => f.category === 'testing');
    const hasRigorFlags = flags.some((f) => f.category === 'rigor');
    const hasTrajectoryFlags = flags.some((f) => f.category === 'trajectory');

    if (hasTestingFlags) {
      recommendations.push('Review testing strategy - consider test-optional approach if scores create negative impression.');
    }
    if (hasRigorFlags) {
      recommendations.push('Use Additional Information section to explain course selection rationale if needed.');
    }
    if (hasTrajectoryFlags) {
      recommendations.push('Ensure counselor letter provides context for any grade trajectory concerns.');
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  private generateTeachingInsight(flags: DetectedRedFlag[], risk: RedFlagReport['overall_risk_level']): string {
    if (risk === 'none') {
      return "Your academic profile shows no concerning patterns. Focus on presenting your strengths and authentic interests.";
    }

    if (risk === 'critical') {
      return "Your profile has serious concerns that must be addressed directly and honestly. Work with your counselor to develop a disclosure strategy that emphasizes growth and accountability.";
    }

    if (risk === 'high' || risk === 'moderate') {
      return "Admissions officers will notice these patterns. The key is to address them proactively rather than hoping they'll be overlooked. Use your Additional Information section strategically to provide context.";
    }

    return "Minor concerns like these are common and rarely decisive. Ensure the rest of your application is strong and these won't hold you back.";
  }

  private gradeToNumber(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A+': 4.0,
      A: 4.0,
      'A-': 3.7,
      'B+': 3.3,
      B: 3.0,
      'B-': 2.7,
      'C+': 2.3,
      C: 2.0,
      'C-': 1.7,
      'D+': 1.3,
      D: 1.0,
      'D-': 0.7,
      F: 0.0,
    };
    return gradeMap[grade] || 3.0;
  }

  private numberToGrade(num: number): string {
    if (num >= 3.9) return 'A';
    if (num >= 3.7) return 'A-';
    if (num >= 3.3) return 'B+';
    if (num >= 3.0) return 'B';
    if (num >= 2.7) return 'B-';
    if (num >= 2.3) return 'C+';
    if (num >= 2.0) return 'C';
    return 'C-';
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Check if a homeschool student has strong external validation
   * Strong validation = SAT/ACT scores + AP exam scores + university-level DE coursework
   */
  private hasStrongHomeschoolValidation(input: AcademicHistoryInput): boolean {
    // Need standardized tests
    const hasStrongSAT = input.test_scores?.sat?.total && input.test_scores.sat.total >= 1400;
    const hasStrongACT = input.test_scores?.act?.composite && input.test_scores.act.composite >= 30;
    const hasStandardizedTests = hasStrongSAT || hasStrongACT;

    // Need AP exam validation
    const apExams = input.test_scores?.ap_exams || [];
    const strongApScores = apExams.filter((e) => e.score >= 4).length;
    const hasApValidation = strongApScores >= 2;

    // Need university-level DE
    const deCourses = input.courses.filter((c) => c.level === 'dual_enrollment');
    const universityDE = deCourses.filter(
      (c) => c.de_type === 'research_university' || c.de_type === 'regional_university'
    );
    const hasUniversityDE = universityDE.length >= 2;

    // Strong validation requires at least 2 of: standardized tests, AP validation, university DE
    const validationCount = [hasStandardizedTests, hasApValidation, hasUniversityDE].filter(Boolean).length;
    return validationCount >= 2;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicRedFlagDetector = new AcademicRedFlagDetector();

/**
 * Convenience function for red flag detection
 */
export function detectAcademicRedFlags(input: AcademicHistoryInput): RedFlagReport {
  return academicRedFlagDetector.detect(input);
}

/**
 * Get all red flag definitions (for reference/documentation)
 */
export function getRedFlagDefinitions(): RedFlagDefinition[] {
  return RED_FLAG_DEFINITIONS;
}
