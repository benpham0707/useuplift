/**
 * Academic Analysis Pipeline
 *
 * Multi-stage orchestrator for comprehensive academic profile evaluation.
 *
 * Pipeline Stages:
 * - Stage 0: Data Validation (sync, no LLM)
 * - Stage 1: Heuristic Foundation (sync, no LLM)
 * - Stage 2: Context Calibration (Haiku, fast)
 * - Stage 3: Deep Pattern Analysis (Sonnet, quality)
 * - Stage 4: Harvard Score Synthesis (Sonnet, quality)
 *
 * Design Principles:
 * - Heuristics first, LLM enhances
 * - Each stage has fallback to previous
 * - Confidence scoring accompanies all assessments
 * - Full research context injection
 * - Teaching focus throughout
 *
 * @version 1.0
 * @date January 2026
 */

import { callClaude } from '../../../lib/llm/claude';
import type { AcademicHistoryInput, AcademicHistoryAnalysis } from './academicHistoryAnalyzer';
import { trajectoryAnalyzer, type TrajectoryAnalysis as DetailedTrajectoryAnalysis } from './trajectoryAnalyzer';
import { academicRedFlagDetector, type RedFlagReport } from './academicRedFlagDetector';
import { courseCommitmentAnalyzer, type CommitmentAnalysis } from './courseCommitmentAnalyzer';
import { majorAlignmentAnalyzer, type MajorAlignmentResult } from './majorAlignmentAnalyzer';
import { confidenceScorer, type ConfidenceBreakdown } from './confidenceScorer';
import {
  academicPromptBuilder,
  type ContextCalibration,
  type DeepPatternAnalysis,
  type HarvardScoreSynthesis,
} from './academicPromptBuilder';

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

// Model names following CLAUDE.md standards
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250514';

// Fallback chain for models - try multiple options
const HAIKU_FALLBACKS = [
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
];
const SONNET_FALLBACKS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-sonnet-20240229',
];

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineOptions {
  skipLLM?: boolean;           // Return heuristics only (for testing/cost saving)
  debug?: boolean;             // Include intermediate results
  maxRetries?: number;         // LLM retry count (default 2)
  costTracker?: CostTracker;   // Optional cost tracking
}

export interface CostTracker {
  addCost(model: string, inputTokens: number, outputTokens: number): void;
}

export interface FullAcademicAnalysis {
  // Stage 1: Heuristic results (always present)
  heuristics: {
    trajectory: DetailedTrajectoryAnalysis;
    redFlags: RedFlagReport;
    commitment: CommitmentAnalysis;
    majorAlignment: MajorAlignmentResult;
  };

  // Stage 2: Context calibration (if LLM stages run)
  context?: ContextCalibration;

  // Stage 3: Deep analysis (if LLM stages run)
  deepAnalysis?: DeepPatternAnalysis;

  // Stage 4: Harvard score synthesis (if LLM stages run)
  synthesis?: HarvardScoreSynthesis;

  // Final outputs
  harvardScore: number;
  confidence: ConfidenceBreakdown;

  // Teaching summary
  teachingSummary: {
    whatAdmissionsSees: string;
    keyStrength: string;
    primaryConcern: string;
    strategicRecommendation: string;
  };

  // All citations
  citations: Array<{ claim: string; source: string }>;

  // Pipeline metadata
  pipeline: {
    stagesCompleted: string[];
    llmStagesRun: boolean;
    totalCost?: number;
    errors?: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// ACADEMIC ANALYSIS PIPELINE CLASS
// ============================================================================

export class AcademicAnalysisPipeline {
  private options: Required<Omit<PipelineOptions, 'costTracker'>> & { costTracker?: CostTracker };

  constructor(options: PipelineOptions = {}) {
    this.options = {
      skipLLM: options.skipLLM ?? false,
      debug: options.debug ?? false,
      maxRetries: options.maxRetries ?? 2,
      costTracker: options.costTracker,
    };
  }

  /**
   * Run the full academic analysis pipeline
   */
  async analyze(input: AcademicHistoryInput): Promise<FullAcademicAnalysis> {
    const stagesCompleted: string[] = [];
    const errors: string[] = [];

    // ====================================================================
    // STAGE 0: Data Validation
    // ====================================================================
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      errors.push(...validation.warnings.map(w => `Warning: ${w}`));
    }
    stagesCompleted.push('stage0_validation');

    // ====================================================================
    // STAGE 1: Heuristic Foundation (No LLM)
    // ====================================================================
    const heuristics = this.runHeuristicStage(input);
    stagesCompleted.push('stage1_heuristics');

    // If skipLLM, return heuristics-only result
    if (this.options.skipLLM) {
      return this.buildHeuristicOnlyResult(input, heuristics, stagesCompleted, errors);
    }

    // ====================================================================
    // STAGE 2: Context Calibration (Haiku)
    // ====================================================================
    let context: ContextCalibration;
    try {
      context = await this.runStage2(input);
      stagesCompleted.push('stage2_context');
    } catch (error) {
      console.error('[Pipeline] Stage 2 failed, using heuristic fallback:', error);
      context = this.getDefaultContext(input);
      errors.push(`Stage 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // ====================================================================
    // STAGE 3: Deep Pattern Analysis (Sonnet)
    // ====================================================================
    let deepAnalysis: DeepPatternAnalysis | undefined;
    try {
      deepAnalysis = await this.runStage3(input, context, heuristics);
      stagesCompleted.push('stage3_deep_analysis');
    } catch (error) {
      console.error('[Pipeline] Stage 3 failed:', error);
      errors.push(`Stage 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // ====================================================================
    // STAGE 4: Harvard Score Synthesis (Sonnet)
    // ====================================================================
    let synthesis: HarvardScoreSynthesis | undefined;
    if (deepAnalysis) {
      try {
        synthesis = await this.runStage4(input, context, heuristics.trajectory, deepAnalysis);
        stagesCompleted.push('stage4_synthesis');
      } catch (error) {
        console.error('[Pipeline] Stage 4 failed:', error);
        errors.push(`Stage 4 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // ====================================================================
    // FINAL ASSEMBLY
    // ====================================================================
    return this.assembleFinalResult(
      input,
      heuristics,
      context,
      deepAnalysis,
      synthesis,
      stagesCompleted,
      errors
    );
  }

  // ========================================================================
  // STAGE 0: VALIDATION
  // ========================================================================

  private validateInput(input: AcademicHistoryInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required: GPA data
    if (!input.gpa) {
      errors.push('GPA data is required');
    } else if (!input.gpa.unweighted && !input.gpa.weighted) {
      warnings.push('Neither weighted nor unweighted GPA provided');
    }

    // Required: Courses
    if (!input.courses || input.courses.length === 0) {
      errors.push('At least one course record is required');
    }

    // Required: School context
    if (!input.school_context) {
      errors.push('School context is required');
    }

    // Warnings for better analysis
    if (!input.grade_history) {
      warnings.push('Grade history by year not provided - trajectory analysis limited');
    }

    if (!input.test_scores?.sat && !input.test_scores?.act) {
      warnings.push('No SAT/ACT scores - cross-validation limited');
    }

    if (!input.intended_major) {
      warnings.push('No intended major specified - major alignment analysis limited');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ========================================================================
  // STAGE 1: HEURISTICS
  // ========================================================================

  private runHeuristicStage(input: AcademicHistoryInput): FullAcademicAnalysis['heuristics'] {
    return {
      trajectory: trajectoryAnalyzer.analyze(input),
      redFlags: academicRedFlagDetector.detect(input),
      commitment: courseCommitmentAnalyzer.analyze(input),
      majorAlignment: majorAlignmentAnalyzer.analyze(input),
    };
  }

  // ========================================================================
  // STAGE 2: CONTEXT CALIBRATION
  // ========================================================================

  private async runStage2(input: AcademicHistoryInput): Promise<ContextCalibration> {
    const prompt = academicPromptBuilder.buildStage2Prompt(input);

    const response = await this.callLLM(
      'claude-haiku-4-5-20251001',
      prompt.systemPrompt,
      prompt.userPrompt,
      500
    );

    return this.parseJSON<ContextCalibration>(response);
  }

  private getDefaultContext(input: AcademicHistoryInput): ContextCalibration {
    // Heuristic-based context when LLM fails
    let schoolTier: ContextCalibration['school_tier'] = 'tier3_well_resourced';
    if (input.school_context.tier) {
      schoolTier = input.school_context.tier as ContextCalibration['school_tier'];
    } else if (input.school_context.type === 'magnet') {
      schoolTier = 'tier2_competitive_magnet';
    } else if (input.school_context.type === 'homeschool') {
      schoolTier = 'tier6_rural_homeschool';
    }

    const specialContexts: string[] = [];
    if (input.courses.some(c => c.level === 'dual_enrollment')) {
      specialContexts.push('dual_enrollment');
    }
    if (input.school_context.type === 'homeschool') {
      specialContexts.push('homeschool');
    }
    if (input.school_context.curriculum && input.school_context.curriculum !== 'us') {
      specialContexts.push('international');
    }

    return {
      school_tier: schoolTier,
      grade_context: 'neutral',
      curriculum_type: input.school_context.curriculum === 'ib' ? 'ib_diploma' : 'us_traditional',
      rigor_availability: (input.school_context.ap_courses_offered || 0) >= 15 ? 'extensive' :
                         (input.school_context.ap_courses_offered || 0) >= 5 ? 'moderate' : 'limited',
      special_contexts: specialContexts,
      confidence: 50,
    };
  }

  // ========================================================================
  // STAGE 3: DEEP ANALYSIS
  // ========================================================================

  private async runStage3(
    input: AcademicHistoryInput,
    context: ContextCalibration,
    heuristics: FullAcademicAnalysis['heuristics']
  ): Promise<DeepPatternAnalysis> {
    const prompt = academicPromptBuilder.buildStage3Prompt(
      input,
      context,
      heuristics.trajectory,
      heuristics.redFlags,
      heuristics.commitment,
      heuristics.majorAlignment
    );

    const response = await this.callLLM(
      'claude-sonnet-4-5-20250514',
      prompt.systemPrompt,
      prompt.userPrompt,
      3000
    );

    return this.parseJSON<DeepPatternAnalysis>(response);
  }

  // ========================================================================
  // STAGE 4: SYNTHESIS
  // ========================================================================

  private async runStage4(
    input: AcademicHistoryInput,
    context: ContextCalibration,
    trajectory: DetailedTrajectoryAnalysis,
    deepAnalysis: DeepPatternAnalysis
  ): Promise<HarvardScoreSynthesis> {
    const prompt = academicPromptBuilder.buildStage4Prompt(
      input,
      context,
      trajectory,
      deepAnalysis
    );

    const response = await this.callLLM(
      'claude-sonnet-4-5-20250514',
      prompt.systemPrompt,
      prompt.userPrompt,
      1500
    );

    return this.parseJSON<HarvardScoreSynthesis>(response);
  }

  // ========================================================================
  // RESULT ASSEMBLY
  // ========================================================================

  private buildHeuristicOnlyResult(
    input: AcademicHistoryInput,
    heuristics: FullAcademicAnalysis['heuristics'],
    stagesCompleted: string[],
    errors: string[]
  ): FullAcademicAnalysis {
    // Calculate preliminary Harvard score from heuristics
    const harvardScore = this.calculateHeuristicHarvardScore(heuristics);

    // Calculate confidence
    const confidence = confidenceScorer.calculate(
      input,
      heuristics.trajectory,
      heuristics.redFlags,
      heuristics.commitment,
      heuristics.majorAlignment,
      harvardScore
    );

    // Build teaching summary from heuristics
    const teachingSummary = this.buildHeuristicTeachingSummary(heuristics);

    return {
      heuristics,
      harvardScore,
      confidence,
      teachingSummary,
      citations: this.buildHeuristicCitations(heuristics),
      pipeline: {
        stagesCompleted,
        llmStagesRun: false,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  private assembleFinalResult(
    input: AcademicHistoryInput,
    heuristics: FullAcademicAnalysis['heuristics'],
    context: ContextCalibration,
    deepAnalysis: DeepPatternAnalysis | undefined,
    synthesis: HarvardScoreSynthesis | undefined,
    stagesCompleted: string[],
    errors: string[]
  ): FullAcademicAnalysis {
    // Use synthesis score if available, otherwise calculate from heuristics
    const harvardScore = synthesis?.harvard_score ??
                        this.calculateHeuristicHarvardScore(heuristics);

    // Calculate confidence
    const confidence = confidenceScorer.calculate(
      input,
      heuristics.trajectory,
      heuristics.redFlags,
      heuristics.commitment,
      heuristics.majorAlignment,
      harvardScore
    );

    // Build teaching summary
    const teachingSummary = synthesis ? {
      whatAdmissionsSees: synthesis.teaching_summary.what_admissions_sees,
      keyStrength: synthesis.teaching_summary.key_strength,
      primaryConcern: synthesis.teaching_summary.primary_concern,
      strategicRecommendation: synthesis.teaching_summary.strategic_recommendation,
    } : this.buildHeuristicTeachingSummary(heuristics);

    // Collect citations
    const citations = synthesis?.citations ?? this.buildHeuristicCitations(heuristics);

    return {
      heuristics,
      context,
      deepAnalysis,
      synthesis,
      harvardScore,
      confidence,
      teachingSummary,
      citations,
      pipeline: {
        stagesCompleted,
        llmStagesRun: stagesCompleted.includes('stage2_context'),
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  // ========================================================================
  // HEURISTIC SCORE CALCULATION
  // ========================================================================

  private calculateHeuristicHarvardScore(heuristics: FullAcademicAnalysis['heuristics']): number {
    let score = 3; // Start at middle

    const { trajectory, redFlags, commitment, majorAlignment } = heuristics;

    // GPA-based adjustment
    const effectiveGpa = trajectory.gpa.effective_gpa;
    if (effectiveGpa >= 3.95) score = 1.5;
    else if (effectiveGpa >= 3.85) score = 2;
    else if (effectiveGpa >= 3.75) score = 2.5;
    else if (effectiveGpa >= 3.6) score = 3;
    else if (effectiveGpa >= 3.4) score = 3.5;
    else if (effectiveGpa >= 3.2) score = 4;
    else score = 4.5;

    // Trajectory adjustments
    if (['strong_ascending', 'moderate_ascending'].includes(trajectory.gpa.trajectory_type)) {
      score = Math.max(1, score - 0.5);
    }
    if (trajectory.gpa.trajectory_type === 'senior_decline') {
      score = Math.max(score, 4); // Cap at 4
    }
    if (trajectory.gpa_rigor_interaction === 'suspect_protection') {
      score = Math.max(score, 3); // Cap at 3
    }
    if (trajectory.gpa_rigor_interaction === 'critical_decline') {
      score = Math.max(score, 5); // Cap at 5
    }
    if (trajectory.gpa_rigor_interaction === 'ideal') {
      score = Math.max(1, score - 0.5);
    }

    // Red flag adjustments
    if (redFlags.overall_risk_level === 'critical') {
      score = 6;
    } else if (redFlags.overall_risk_level === 'high') {
      score = Math.max(score, 4);
    } else if (redFlags.overall_risk_level === 'moderate') {
      score = Math.max(score, 3);
    }

    // Round to nearest 0.5
    return Math.round(score * 2) / 2;
  }

  private buildHeuristicTeachingSummary(heuristics: FullAcademicAnalysis['heuristics']): FullAcademicAnalysis['teachingSummary'] {
    const { trajectory, redFlags, commitment, majorAlignment } = heuristics;

    // What admissions sees
    let whatAdmissionsSees = `A ${trajectory.gpa.trajectory_type.replace(/_/g, ' ')} academic trajectory`;
    if (trajectory.gpa.effective_gpa >= 3.8) {
      whatAdmissionsSees += ' with strong grades';
    }
    if (trajectory.rigor.trajectory_type === 'increasing' || trajectory.rigor.trajectory_type === 'maintaining_high') {
      whatAdmissionsSees += ' and appropriate rigor';
    }

    // Key strength
    let keyStrength = 'No standout academic strength identified';
    if (trajectory.strengths.length > 0) {
      keyStrength = trajectory.strengths[0];
    } else if (commitment.signals.positive.length > 0) {
      keyStrength = commitment.signals.positive[0].signal;
    }

    // Primary concern
    let primaryConcern = 'No significant concerns';
    if (redFlags.flags_detected.length > 0) {
      primaryConcern = redFlags.flags_detected[0].description;
    } else if (trajectory.concerns.length > 0) {
      primaryConcern = trajectory.concerns[0];
    }

    // Strategic recommendation
    let strategicRecommendation = 'Continue current academic trajectory';
    if (majorAlignment.gapAreas.length > 0) {
      strategicRecommendation = `Address major alignment gaps: ${majorAlignment.gapAreas[0]}`;
    } else if (trajectory.gpa.trajectory_type === 'senior_decline') {
      strategicRecommendation = 'Focus on strong finish to address senior year concerns';
    }

    return {
      whatAdmissionsSees,
      keyStrength,
      primaryConcern,
      strategicRecommendation,
    };
  }

  private buildHeuristicCitations(heuristics: FullAcademicAnalysis['heuristics']): Array<{ claim: string; source: string }> {
    const citations: Array<{ claim: string; source: string }> = [];

    // Trajectory citation
    citations.push({
      claim: `Year-weighted GPA calculation with junior year at 35%`,
      source: 'Section 6.6: Junior year is "widely regarded as the most important year"',
    });

    // Add red flag citations
    for (const flag of heuristics.redFlags.flags_detected) {
      citations.push({
        claim: `${flag.flag_name} detected`,
        source: `Section 6.9: ${flag.severity} severity flag`,
      });
    }

    // Major alignment citation
    if (heuristics.majorAlignment.redFlagsTriggered.length > 0) {
      citations.push({
        claim: 'Major-course mismatch identified',
        source: 'Section 6.9: Major-Course Mismatch is a Tier 2 (Serious) red flag',
      });
    }

    return citations;
  }

  // ========================================================================
  // LLM HELPERS
  // ========================================================================

  private async callLLM(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<string> {
    // Determine fallback chain
    const fallbacks = model.includes('haiku') ? HAIKU_FALLBACKS : SONNET_FALLBACKS;
    const modelsToTry = [model, ...fallbacks];

    let lastError: Error | undefined;

    for (const currentModel of modelsToTry) {
      for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
        try {
          const response = await callClaude(userPrompt, {
            model: currentModel as any, // Type assertion needed for flexibility
            systemPrompt,
            maxTokens,
            temperature: 0.3,
          });

          // Track cost if tracker provided
          if (this.options.costTracker && response.usage) {
            this.options.costTracker.addCost(
              currentModel,
              response.usage.input_tokens,
              response.usage.output_tokens
            );
          }

          if (currentModel !== model) {
            console.log(`[Pipeline] Using fallback model: ${currentModel}`);
          }

          return response.content;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const errorMessage = lastError.message;

          // If model not found, try next model in chain (don't retry same model)
          if (errorMessage.includes('not_found') || errorMessage.includes('404')) {
            console.warn(`[Pipeline] Model ${currentModel} not available, trying next fallback...`);
            break; // Exit retry loop, try next model
          }

          console.warn(`[Pipeline] LLM call attempt ${attempt + 1} failed:`, errorMessage);

          // Wait before retry (exponential backoff)
          if (attempt < this.options.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }
    }

    throw lastError || new Error('LLM call failed after all retries and fallbacks');
  }

  private parseJSON<T>(response: string): T {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const academicAnalysisPipeline = new AcademicAnalysisPipeline();

/**
 * Convenience function for full pipeline analysis
 */
export async function analyzeAcademicHistoryFull(
  input: AcademicHistoryInput,
  options?: PipelineOptions
): Promise<FullAcademicAnalysis> {
  const pipeline = new AcademicAnalysisPipeline(options);
  return pipeline.analyze(input);
}

/**
 * Convenience function for heuristics-only analysis (no LLM cost)
 */
export function analyzeAcademicHistoryHeuristics(
  input: AcademicHistoryInput
): FullAcademicAnalysis {
  const pipeline = new AcademicAnalysisPipeline({ skipLLM: true });
  // Since skipLLM returns immediately, we can use a sync wrapper
  let result: FullAcademicAnalysis | undefined;
  pipeline.analyze(input).then(r => { result = r; });
  // In practice this is sync when skipLLM is true, but TypeScript doesn't know that
  // For a truly sync version, we'd need to refactor. For now, use the async version.
  throw new Error('Use analyzeAcademicHistoryFull with skipLLM: true for heuristics-only');
}
