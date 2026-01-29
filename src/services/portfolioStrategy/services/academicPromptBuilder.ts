/**
 * Academic Prompt Builder Service
 *
 * Constructs carefully-crafted prompts for each stage of the multi-stage
 * academic analysis pipeline:
 *
 * Stage 2: Context Calibration (Haiku - fast)
 * Stage 3: Deep Pattern Analysis (Sonnet - quality)
 * Stage 4: Harvard Score Synthesis (Sonnet - quality)
 *
 * Each prompt is designed to:
 * - Include only relevant research context
 * - Produce structured, parseable JSON output
 * - Focus on teaching over pure assessment
 * - Maintain research citations throughout
 *
 * @version 1.0
 * @date January 2026
 */

import type { AcademicHistoryInput } from './academicHistoryAnalyzer';
import type { TrajectoryAnalysis as DetailedTrajectoryAnalysis } from './trajectoryAnalyzer';
import type { RedFlagReport } from './academicRedFlagDetector';
import type { CommitmentAnalysis } from './courseCommitmentAnalyzer';
import type { MajorAlignmentResult } from './majorAlignmentAnalyzer';
import {
  COURSE_LEVEL_HIERARCHY,
  AP_DIFFICULTY_TIERS,
  SCHOOL_CONTEXT_TIERS,
  GPA_EXPECTATIONS,
  ACADEMIC_RED_FLAGS,
  INTERNATIONAL_CURRICULA,
  HOMESCHOOL_VALIDATION,
} from './academicHistoryAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface Stage2ContextPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedOutput: 'ContextCalibration';
}

export interface Stage3DeepAnalysisPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedOutput: 'DeepPatternAnalysis';
}

export interface Stage4SynthesisPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedOutput: 'HarvardScoreSynthesis';
}

export interface ContextCalibration {
  school_tier: 'tier1_elite_prep' | 'tier2_competitive_magnet' | 'tier3_well_resourced' | 'tier4_average_public' | 'tier5_under_resourced' | 'tier6_rural_homeschool';
  grade_context: 'deflated' | 'neutral' | 'inflated' | 'unknown';
  curriculum_type: 'us_traditional' | 'ib_diploma' | 'a_levels' | 'other_international' | 'homeschool';
  rigor_availability: 'extensive' | 'moderate' | 'limited';
  special_contexts: string[];
  confidence: number;
}

export interface DeepPatternAnalysis {
  trajectory_assessment: {
    gpa_pattern: string;
    rigor_pattern: string;
    interaction_interpretation: string;
    heuristic_adjustments: string[];
  };
  major_alignment: {
    alignment_score: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  };
  commitment_analysis: {
    sustained_interests: string[];
    concerning_patterns: string[];
    depth_evidence: string[];
  };
  cross_validation: {
    gpa_test_consistency: 'consistent' | 'minor_discrepancy' | 'major_discrepancy';
    grade_exam_consistency: 'consistent' | 'minor_discrepancy' | 'major_discrepancy';
    anomalies: string[];
  };
  red_flag_assessment: {
    confirmed_flags: Array<{ flag: string; severity: string }>;
    dismissed_flags: Array<{ flag: string; reasoning: string }>;
    contextual_mitigations: string[];
  };
  preliminary_score_range: string;
  key_insights: string[];
  questions_for_synthesis: string[];
}

export interface HarvardScoreSynthesis {
  harvard_score: number;
  score_justification: {
    base_assessment: string;
    trajectory_adjustment: string;
    context_adjustment: string;
    red_flag_impact: string;
    final_calibration: string;
  };
  confidence: {
    level: 'high' | 'medium' | 'low';
    data_completeness: number;
    cross_validation_consistency: number;
    score_certainty_range: string;
  };
  teaching_summary: {
    what_admissions_sees: string;
    key_strength: string;
    primary_concern: string;
    strategic_recommendation: string;
  };
  citations: Array<{ claim: string; source: string }>;
}

// ============================================================================
// PROMPT BUILDER CLASS
// ============================================================================

export class AcademicPromptBuilder {
  // ========================================================================
  // STAGE 2: CONTEXT CALIBRATION
  // ========================================================================

  buildStage2Prompt(input: AcademicHistoryInput): Stage2ContextPrompt {
    const systemPrompt = `You are an expert college admissions analyst performing quick context classification for academic evaluation.

Your task is to classify the school and academic context to inform deeper analysis. Be concise and accurate.

SCHOOL CONTEXT REFERENCE (Section 6.5):
${JSON.stringify(SCHOOL_CONTEXT_TIERS, null, 2)}

OUTPUT REQUIREMENTS:
Return ONLY a JSON object with these exact fields:
{
  "school_tier": "tier1_elite_prep" | "tier2_competitive_magnet" | "tier3_well_resourced" | "tier4_average_public" | "tier5_under_resourced" | "tier6_rural_homeschool",
  "grade_context": "deflated" | "neutral" | "inflated" | "unknown",
  "curriculum_type": "us_traditional" | "ib_diploma" | "a_levels" | "other_international" | "homeschool",
  "rigor_availability": "extensive" | "moderate" | "limited",
  "special_contexts": ["list", "of", "relevant", "contexts"],
  "confidence": 0-100
}

CLASSIFICATION RULES:
- School tier: Based on school type, AP availability, and known characteristics
- Grade context: deflated = elite/magnet schools, inflated = schools with high avg GPAs
- Rigor availability: extensive = 15+ APs, moderate = 5-15 APs, limited = <5 APs
- Special contexts: Include any of ["dual_enrollment", "international", "homeschool", "military_family", "first_generation"]

Be decisive. This is a classification task, not analysis. Output ONLY the JSON.`;

    const userPrompt = `Classify this academic context:

SCHOOL INFORMATION:
- Type: ${input.school_context.type}
- Name: ${input.school_context.name || 'Not provided'}
- Tier (if known): ${input.school_context.tier || 'Unknown'}
- AP Courses Offered: ${input.school_context.ap_courses_offered || 'Unknown'}
- IB Program: ${input.school_context.ib_program || false}
- Curriculum: ${input.school_context.curriculum || 'us'}
- Location: ${input.school_context.state || ''}, ${input.school_context.country || 'USA'}

STUDENT DATA SUMMARY:
- GPA (UW): ${input.gpa.unweighted || 'N/A'}
- GPA (W): ${input.gpa.weighted || 'N/A'}
- Total Courses: ${input.courses.length}
- AP/IB Courses Taken: ${input.courses.filter(c => ['ap', 'ib_hl', 'ib_sl'].includes(c.level)).length}
- Has Dual Enrollment: ${input.courses.some(c => c.level === 'dual_enrollment')}

Return the JSON classification:`;

    return {
      systemPrompt,
      userPrompt,
      expectedOutput: 'ContextCalibration',
    };
  }

  // ========================================================================
  // STAGE 3: DEEP PATTERN ANALYSIS
  // ========================================================================

  buildStage3Prompt(
    input: AcademicHistoryInput,
    context: ContextCalibration,
    trajectory: DetailedTrajectoryAnalysis,
    redFlags: RedFlagReport,
    commitment: CommitmentAnalysis,
    majorAlignment: MajorAlignmentResult
  ): Stage3DeepAnalysisPrompt {
    // Build dynamic research context
    const researchContext = this.buildResearchContext(input, context);

    const systemPrompt = `You are a senior college admissions officer with 20+ years of experience at Harvard, Stanford, and MIT. You deeply understand how academic profiles are evaluated at elite institutions.

Your task is to perform DEEP PATTERN ANALYSIS on an academic profile, validating heuristic findings and providing nuanced interpretation.

${researchContext}

ANALYSIS FRAMEWORK:
You will analyze through five critical lenses, then synthesize.

1. TRAJECTORY ANALYSIS
   - Validate or adjust the automated trajectory classification
   - Interpret what the GPA-Rigor interaction reveals about the student
   - Identify any nuances the heuristics missed

2. MAJOR ALIGNMENT ANALYSIS
   - Evaluate preparation for intended major: ${input.intended_major || 'Undeclared'}
   - Identify strengths and gaps
   - Assess demonstrated sustained interest

3. COMMITMENT & DEPTH ANALYSIS
   - Evaluate multi-year commitments
   - Look for evidence of deepening engagement
   - Flag concerning drops or avoidance patterns

4. CROSS-VALIDATION
   - Verify consistency between GPA, test scores, and AP exams
   - Identify any anomalies requiring explanation
   - Assess overall data reliability

5. RED FLAG ASSESSMENT
   - Confirm or dismiss detected red flags
   - Apply contextual mitigations
   - Determine actual severity in this student's context

OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "trajectory_assessment": {
    "gpa_pattern": "description and interpretation",
    "rigor_pattern": "description and interpretation",
    "interaction_interpretation": "what this combination reveals about the student",
    "heuristic_adjustments": ["any corrections to automated analysis"]
  },
  "major_alignment": {
    "alignment_score": 0-100,
    "strengths": ["list"],
    "gaps": ["list"],
    "recommendation": "text"
  },
  "commitment_analysis": {
    "sustained_interests": ["subject: years studied"],
    "concerning_patterns": ["list or empty"],
    "depth_evidence": ["evidence of genuine engagement"]
  },
  "cross_validation": {
    "gpa_test_consistency": "consistent" | "minor_discrepancy" | "major_discrepancy",
    "grade_exam_consistency": "consistent" | "minor_discrepancy" | "major_discrepancy",
    "anomalies": ["list with explanations"]
  },
  "red_flag_assessment": {
    "confirmed_flags": [{"flag": "name", "severity": "tier"}],
    "dismissed_flags": [{"flag": "name", "reasoning": "why dismissed"}],
    "contextual_mitigations": ["factors that reduce severity"]
  },
  "preliminary_score_range": "X-Y on Harvard 1-6 scale",
  "key_insights": ["3-5 most important observations"],
  "questions_for_synthesis": ["any unresolved questions"]
}

Be thorough but concise. Focus on INSIGHTS, not just observations.`;

    const userPrompt = `Analyze this academic profile in depth:

STUDENT PROFILE:
${JSON.stringify(input, null, 2)}

CONTEXT CALIBRATION (Stage 2):
${JSON.stringify(context, null, 2)}

HEURISTIC ANALYSIS RESULTS:

1. TRAJECTORY ANALYSIS:
${JSON.stringify(trajectory, null, 2)}

2. RED FLAGS DETECTED:
${JSON.stringify(redFlags, null, 2)}

3. COMMITMENT ANALYSIS:
${JSON.stringify(commitment, null, 2)}

4. MAJOR ALIGNMENT:
${JSON.stringify(majorAlignment, null, 2)}

Provide your deep pattern analysis as JSON:`;

    return {
      systemPrompt,
      userPrompt,
      expectedOutput: 'DeepPatternAnalysis',
    };
  }

  // ========================================================================
  // STAGE 4: HARVARD SCORE SYNTHESIS
  // ========================================================================

  buildStage4Prompt(
    input: AcademicHistoryInput,
    context: ContextCalibration,
    trajectory: DetailedTrajectoryAnalysis,
    deepAnalysis: DeepPatternAnalysis
  ): Stage4SynthesisPrompt {
    const systemPrompt = `You are calibrating a final Harvard Academic Rating (1-6) with research-backed precision.

This is the FINAL synthesis stage. Your score must be:
1. Precisely calibrated to Harvard's scale
2. Justified with specific evidence
3. Adjusted for trajectory and context
4. Accompanied by teaching insights

HARVARD ACADEMIC RATING SCALE:
1 (Summa): Potential valedictorian at any school. Perfect/near-perfect grades in most demanding curriculum. Clear trajectory of intellectual growth. Genuine love of learning beyond grades.

2 (Magna): Top 5% academically. Excellent grades in highly demanding curriculum. Strong upward or sustained high trajectory. Minor imperfections acceptable if pattern is strong.

3 (Cum Laude): Strong academic record with good rigor. Some concerns may exist but addressable. Solid preparation for college work.

4 (Adequate): Satisfactory academic record. Concerns present but not disqualifying. May need support in college.

5 (Marginal): Significant academic concerns. Preparation gaps evident. High risk for college readiness.

6 (Below Standards): Serious academic deficiencies. Not prepared for selective college work.

TRAJECTORY ADJUSTMENTS (Section 6.6 - CRITICAL):
- strong_ascending: Can boost score by up to 0.5
- high_plateau (3.8+): Maintain score, no penalty
- acceptable_courage (GPA↓ + Rigor↑): Do NOT penalize; shows intellectual courage
- senior_decline: CAPS score at 4 regardless of prior performance
- suspect_protection (GPA↑ + Rigor↓): CAPS score at 3
- critical_decline (GPA↓ + Rigor↓): Automatic 5 or worse

CONTEXT ADJUSTMENTS:
- Elite prep/deflated grades: +0.3 effective GPA interpretation
- Under-resourced school maximizing available rigor: +0.2 to score
- High GPA with obvious rigor avoidance: -0.5 to score
- International IB 40+: Equivalent to top US student

RED FLAG IMPACT:
- Tier 1 (Disqualifying): Automatic 6
- Tier 2 (Serious): Caps at 4, often 5
- Tier 3 (Moderate): Caps at 3
- Tier 4 (Minor): Note but minimal impact

OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "harvard_score": 1-6 (use 0.5 increments if needed, e.g., 2.5),
  "score_justification": {
    "base_assessment": "Starting point based on GPA and rigor",
    "trajectory_adjustment": "+/- X because...",
    "context_adjustment": "+/- X because...",
    "red_flag_impact": "description of any caps or penalties",
    "final_calibration": "How arrived at final score"
  },
  "confidence": {
    "level": "high" | "medium" | "low",
    "data_completeness": 0-100,
    "cross_validation_consistency": 0-100,
    "score_certainty_range": "X to Y"
  },
  "teaching_summary": {
    "what_admissions_sees": "1-2 sentence summary from AO perspective",
    "key_strength": "The most compelling academic element",
    "primary_concern": "The biggest question mark (if any)",
    "strategic_recommendation": "What student should emphasize or address"
  },
  "citations": [
    {"claim": "specific claim", "source": "Section 6.X: ..."}
  ]
}

Be precise. Your score will guide student strategy.`;

    const userPrompt = `Synthesize the final Harvard Academic Rating:

STUDENT CONTEXT:
- Intended Major: ${input.intended_major || 'Undeclared'}
- School Tier: ${context.school_tier}
- Grade Context: ${context.grade_context}

GPA DATA:
- Unweighted: ${input.gpa.unweighted || 'N/A'}
- Weighted: ${input.gpa.weighted || 'N/A'}
- Year-Weighted GPA: ${trajectory.gpa.weighted_gpa}
- Trajectory Adjustment: ${trajectory.gpa.trajectory_adjustment}
- Effective GPA: ${trajectory.gpa.effective_gpa}

TRAJECTORY:
- GPA Pattern: ${trajectory.gpa.trajectory_type}
- Rigor Pattern: ${trajectory.rigor.trajectory_type}
- GPA-Rigor Interaction: ${trajectory.gpa_rigor_interaction}
- Key Transitions:
  - Sophomore→Junior: ${trajectory.transitions.sophomore_to_junior}
  - Junior→Senior: ${trajectory.transitions.junior_to_senior}

DEEP ANALYSIS FINDINGS:
${JSON.stringify(deepAnalysis, null, 2)}

Provide your final Harvard score synthesis as JSON:`;

    return {
      systemPrompt,
      userPrompt,
      expectedOutput: 'HarvardScoreSynthesis',
    };
  }

  // ========================================================================
  // RESEARCH CONTEXT BUILDER
  // ========================================================================

  private buildResearchContext(
    input: AcademicHistoryInput,
    context: ContextCalibration
  ): string {
    const sections: string[] = [];

    // Always include core frameworks
    sections.push(`
## Section 6.1: Course Level Hierarchy
${JSON.stringify(COURSE_LEVEL_HIERARCHY, null, 2)}

## Section 6.5: School Context - ${context.school_tier}
${JSON.stringify(SCHOOL_CONTEXT_TIERS[context.school_tier] || SCHOOL_CONTEXT_TIERS.tier3_well_resourced, null, 2)}

## Section 6.6: Year Weighting & Trajectory (CRITICAL)
Year Weights:
- Freshman: 15% (adjustment period)
- Sophomore: 22% (building foundation)
- Junior: 35% (MOST IMPORTANT)
- Senior: 28% (follow-through, rescission risk)

GPA-Rigor Interaction Matrix:
- IDEAL: GPA↑ + Rigor↑ = Best possible pattern
- good_growth: GPA stable + Rigor↑ = Maintained grades while increasing challenge
- acceptable_courage: GPA↓ + Rigor↑ = Intellectual courage (POSITIVE)
- suspect_protection: GPA↑ + Rigor↓ = GPA gaming (RED FLAG)
- critical_decline: GPA↓ + Rigor↓ = Disengagement (MAJOR FLAG)`);

    // Include AP tiers if student has APs
    if (input.courses.some(c => c.level === 'ap')) {
      sections.push(`
## Section 6.2: AP Difficulty Tiers
${JSON.stringify(AP_DIFFICULTY_TIERS, null, 2)}`);
    }

    // Include red flags if needed
    sections.push(`
## Section 6.9: Academic Red Flags (4-Tier System)
${JSON.stringify(ACADEMIC_RED_FLAGS, null, 2)}`);

    // Include international if applicable
    if (context.curriculum_type !== 'us_traditional') {
      sections.push(`
## Section 6.7: International Curriculum Conversions
${JSON.stringify(INTERNATIONAL_CURRICULA, null, 2)}`);
    }

    // Include homeschool if applicable
    if (context.curriculum_type === 'homeschool') {
      sections.push(`
## Section 6.8: Homeschool Validation Framework
${JSON.stringify(HOMESCHOOL_VALIDATION, null, 2)}`);
    }

    // Include GPA expectations
    sections.push(`
## Section 6.6: GPA Expectations by Selectivity
${JSON.stringify(GPA_EXPECTATIONS, null, 2)}`);

    return sections.join('\n\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicPromptBuilder = new AcademicPromptBuilder();

/**
 * Convenience functions for building prompts
 */
export function buildStage2Prompt(input: AcademicHistoryInput): Stage2ContextPrompt {
  return academicPromptBuilder.buildStage2Prompt(input);
}

export function buildStage3Prompt(
  input: AcademicHistoryInput,
  context: ContextCalibration,
  trajectory: DetailedTrajectoryAnalysis,
  redFlags: RedFlagReport,
  commitment: CommitmentAnalysis,
  majorAlignment: MajorAlignmentResult
): Stage3DeepAnalysisPrompt {
  return academicPromptBuilder.buildStage3Prompt(
    input, context, trajectory, redFlags, commitment, majorAlignment
  );
}

export function buildStage4Prompt(
  input: AcademicHistoryInput,
  context: ContextCalibration,
  trajectory: DetailedTrajectoryAnalysis,
  deepAnalysis: DeepPatternAnalysis
): Stage4SynthesisPrompt {
  return academicPromptBuilder.buildStage4Prompt(input, context, trajectory, deepAnalysis);
}
