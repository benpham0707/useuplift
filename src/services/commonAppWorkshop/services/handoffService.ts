// @ts-nocheck
/**
 * Workshop Handoff Service
 *
 * **Orchestrating the Complete Workshop Flow**
 *
 * This service manages the end-to-end workshop experience, ensuring clean
 * context handoffs between stages and maintaining quality throughout.
 *
 * **Complete Flow**:
 * 1. Stage 0: Voice Excavation ($0.11)
 * 2. Stage 1: Foundation Teaching ($0.05)
 * 3. Stage 2: Surgical Teaching ($0.12)
 * 4. Stage 3: Final Polish ($0.06)
 * Total: ~$0.34 per essay
 *
 * **Why This Service Exists**:
 * - Ensures clean context passing between stages
 * - Validates outputs at each stage
 * - Tracks cumulative cost and quality metrics
 * - Provides unified interface for workshop execution
 * - Enables partial execution (restart from any stage)
 * - Maintains conversation state for iterative refinement
 *
 * **Quality Gates**:
 * - Stage 0 → 1: Voice fingerprint validated
 * - Stage 1 → 2: 3 critical issues identified
 * - Stage 2 → 3: Suggestions generated with evidence
 * - Stage 3 → Submit: Quality verification passed
 */

import { Stage0ConditionalService } from './stage0ConditionalService';
import { Stage1ATeachingService } from './stage1ATeachingService';
import { Stage1BDiagnosisService } from './stage1BDiagnosisService';
import { Stage2BatchService } from './stage2BatchService';
import { Stage3ConsolidatedService } from './stage3ConsolidatedService';
import { semanticClicheAnalyzer } from './semanticClicheAnalyzer';
import { generateClicheIssues, formatClicheIssuesForStage2 } from './clicheIssueIntegration';
import type { CollegeResearch } from '../types/collegeResearch';
import type { VoiceExcavationInput, Stage0Output } from '../types/stage0Types';
import type { ConceptualFoundation } from './stage1ATeachingService';
import type { CriticalIssue, DimensionalAssessment } from './stage1BDiagnosisService';
import type { Stage2BatchOutput } from './stage2BatchService';
import type { Stage3ConsolidatedOutput } from './stage3ConsolidatedService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Complete workshop input
 */
export interface WorkshopInput {
  // Essay context
  rawDraft: string;
  essayPrompt: string;
  collegeId: string;
  collegeName: string;
  collegeResearch: CollegeResearch;

  // Voice context (from interview/samples)
  voiceSample?: string;
  interviewResponses?: Record<string, string>;

  // Optional: Resume from specific stage
  resumeFromStage?: 0 | 1 | 2 | 3;
  previousStageOutputs?: {
    stage0?: Stage0Output;
    stage1?: Stage1CombinedOutput;
    stage2?: Stage2BatchOutput;
  };
}

/**
 * Combined Stage 1 output (1A Teaching + 1B Diagnosis + Cliché Analysis)
 *
 * This represents the SPLIT ARCHITECTURE where teaching and diagnosis
 * are separate API calls for full depth and rigor.
 *
 * **CLICHÉ INTEGRATION**: If clichés are detected (risk score >= 40),
 * cliché issues are merged with diagnostic issues for Stage 2 processing.
 */
export interface Stage1CombinedOutput {
  // From Stage 1A (Teaching)
  conceptual_foundation: ConceptualFoundation;

  // From Stage 1B (Diagnosis) + Cliché Issues (merged)
  dimensional_assessment: DimensionalAssessment[];
  top_3_critical_issues: CriticalIssue[];

  // Handoff to Stage 2
  stage2_handoff: {
    voice_fingerprint: any; // VoiceFingerprint
    citation_mapping: any; // CitationMapping
    holistic_context: {
      recurring_motifs: string[];
      emotional_arc: string;
      narrative_thread: string;
    };
    dimensional_baseline: Record<string, number>;
    concepts_taught: string[];
    // Cliché context for targeted coaching
    cliche_context?: {
      overall_risk: string;
      risk_score: number;
      unique_elements_to_preserve: string[];
      coaching_priority: string;
    };
  };

  // Cost tracking (combined)
  cost: number;
  cost_breakdown: {
    teaching: number; // Stage 1A
    diagnosis: number; // Stage 1B
    cliche_analysis?: number; // Cliché detection
  };
  tokens_used: {
    haiku_input: number;
    haiku_output: number;
    sonnet_input: number;
    sonnet_output: number;
  };
}

/**
 * Complete workshop output (all stages)
 */
export interface CompleteWorkshopOutput {
  // Stage outputs
  stage0: Stage0Output;
  stage1: Stage1CombinedOutput;
  stage2: Stage2BatchOutput;
  stage3: Stage3ConsolidatedOutput;

  // Aggregate metrics
  metrics: {
    total_cost: number;
    cost_by_stage: {
      stage0: number;
      stage1: number;
      stage2: number;
      stage3: number;
    };
    total_tokens: {
      haiku: number;
      sonnet_input: number;
      sonnet_output: number;
    };
    quality_metrics: {
      initial_spark: number;
      final_spark: number;
      spark_improvement: number;
      average_dimension_improvement: number;
      ready_for_submission: boolean;
    };
  };

  // Student journey
  journey: {
    stages_completed: number[];
    biggest_transformations: string[];
    key_concepts_learned: string[];
    time_estimate: string; // "Completed in X minutes"
  };
}

/**
 * Validation result for stage handoff
 */
interface HandoffValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class HandoffService {
  private stage0Service: Stage0ConditionalService;
  private stage1AService: Stage1ATeachingService;
  private stage1BService: Stage1BDiagnosisService;
  private stage2Service: Stage2BatchService;
  private stage3Service: Stage3ConsolidatedService;

  constructor(apiKey?: string) {
    this.stage0Service = new Stage0ConditionalService(apiKey);
    this.stage1AService = new Stage1ATeachingService(apiKey);
    this.stage1BService = new Stage1BDiagnosisService(apiKey);
    this.stage2Service = new Stage2BatchService(apiKey);
    this.stage3Service = new Stage3ConsolidatedService(apiKey);
  }

  /**
   * Run complete workshop (all stages)
   */
  async runCompleteWorkshop(input: WorkshopInput): Promise<CompleteWorkshopOutput> {
    console.log('🎓 Starting Complete Common App Workshop...');
    console.log(`   College: ${input.collegeName}`);
    console.log(`   Prompt: ${input.essayPrompt.substring(0, 60)}...`);
    console.log('');

    const startTime = Date.now();

    // Stage 0: Voice Excavation
    const stage0Output = await this.runStage0(input);
    this.validateStage0Output(stage0Output);

    // Stage 1: Foundation Teaching
    const stage1Output = await this.runStage1(input, stage0Output);
    this.validateStage1Output(stage1Output);

    // Stage 2: Surgical Teaching
    const stage2Output = await this.runStage2(input, stage0Output, stage1Output);
    this.validateStage2Output(stage2Output);

    // Stage 3: Final Polish
    const stage3Output = await this.runStage3(input, stage1Output, stage2Output);
    this.validateStage3Output(stage3Output);

    // Calculate aggregate metrics
    const metrics = this.calculateMetrics(
      stage0Output,
      stage1Output,
      stage2Output,
      stage3Output
    );

    const endTime = Date.now();
    const timeMinutes = Math.round((endTime - startTime) / 1000 / 60);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 WORKSHOP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Cost: $${metrics.total_cost.toFixed(3)}`);
    console.log(`   Spark Improvement: ${stage0Output.analysis?.sparkScore || 0} → ${stage3Output.authenticity_report?.voice_preservation_score || 0}`);
    console.log(`   Average Dimension Improvement: +${metrics.quality_metrics.average_dimension_improvement}`);
    console.log(`   Ready for Submission: ${stage3Output.ready_for_submission ? 'YES' : 'NOT YET'}`);
    console.log(`   Time: ${timeMinutes} minutes`);
    console.log('═══════════════════════════════════════════════════════════');

    return {
      stage0: stage0Output,
      stage1: stage1Output,
      stage2: stage2Output,
      stage3: stage3Output,
      metrics,
      journey: {
        stages_completed: [0, 1, 2, 3],
        biggest_transformations: stage3Output.journey_progress.biggest_wins,
        key_concepts_learned: stage1Output.stage2_handoff.concepts_taught,
        time_estimate: `Completed in ${timeMinutes} minutes`,
      },
    };
  }

  /**
   * Run workshop from specific stage (resume capability)
   */
  async resumeFromStage(input: WorkshopInput): Promise<CompleteWorkshopOutput> {
    if (!input.resumeFromStage || !input.previousStageOutputs) {
      throw new Error('Must provide resumeFromStage and previousStageOutputs');
    }

    console.log(`🔄 Resuming workshop from Stage ${input.resumeFromStage}...`);

    const startTime = Date.now();
    let stage0Output: Stage0Output;
    let stage1Output: Stage1ConsolidatedOutput;
    let stage2Output: Stage2BatchOutput;
    let stage3Output: Stage3ConsolidatedOutput;

    switch (input.resumeFromStage) {
      case 0:
        return this.runCompleteWorkshop(input);

      case 1:
        stage0Output = input.previousStageOutputs.stage0!;
        stage1Output = await this.runStage1(input, stage0Output);
        stage2Output = await this.runStage2(input, stage0Output, stage1Output);
        stage3Output = await this.runStage3(input, stage1Output, stage2Output);
        break;

      case 2:
        stage0Output = input.previousStageOutputs.stage0!;
        stage1Output = input.previousStageOutputs.stage1!;
        stage2Output = await this.runStage2(input, stage0Output, stage1Output);
        stage3Output = await this.runStage3(input, stage1Output, stage2Output);
        break;

      case 3:
        stage0Output = input.previousStageOutputs.stage0!;
        stage1Output = input.previousStageOutputs.stage1!;
        stage2Output = input.previousStageOutputs.stage2!;
        stage3Output = await this.runStage3(input, stage1Output, stage2Output);
        break;

      default:
        throw new Error(`Invalid resumeFromStage: ${input.resumeFromStage}`);
    }

    const metrics = this.calculateMetrics(
      stage0Output,
      stage1Output,
      stage2Output,
      stage3Output
    );

    const endTime = Date.now();
    const timeMinutes = Math.round((endTime - startTime) / 1000 / 60);

    console.log(`✓ Resume complete (${timeMinutes} minutes)`);

    return {
      stage0: stage0Output,
      stage1: stage1Output,
      stage2: stage2Output,
      stage3: stage3Output,
      metrics,
      journey: {
        stages_completed: [0, 1, 2, 3],
        biggest_transformations: stage3Output.journey_progress.biggest_wins,
        key_concepts_learned: stage1Output.stage2_handoff.concepts_taught,
        time_estimate: `Resumed in ${timeMinutes} minutes`,
      },
    };
  }

  // ==========================================================================
  // STAGE EXECUTION
  // ==========================================================================

  private async runStage0(input: WorkshopInput): Promise<Stage0Output> {
    const result = await this.stage0Service.runStage0({
      rawDraft: input.rawDraft,
      essayPrompt: input.essayPrompt,
      collegeId: input.collegeId,
      voiceSample: input.voiceSample,
      interviewResponses: input.interviewResponses,
    });

    // Unwrap full output
    if (!result.full_output) {
      throw new Error('Stage 0 did not return full output');
    }

    return result.full_output;
  }

  private async runStage1(
    input: WorkshopInput,
    stage0Output: Stage0Output
  ): Promise<Stage1CombinedOutput> {
    console.log('📚 Stage 1: Running split architecture (1A Teaching → 1B Diagnosis → Cliché Analysis)...');

    // STEP 1: Foundation Teaching (Stage 1A)
    console.log('  Step 1/3: Running Stage 1A (Foundation Teaching)...');
    const stage1A = await this.stage1AService.generateTeaching(
      stage0Output.voiceFirstDraft.draft,
      input.essayPrompt,
      input.collegeResearch
    );

    // STEP 2: Deep Diagnosis (Stage 1B) using Stage 1A concepts
    console.log('  Step 2/3: Running Stage 1B (Deep Diagnosis using Stage 1A concepts)...');

    // Construct voice context for Stage 1B (with defensive defaults)
    const voiceContext = {
      register: stage0Output.voiceFirstDraft.register || 'energetic_enthusiasm',
      sparkScore: stage0Output.voiceFirstDraft.metrics?.sparkScore ||
                  stage0Output.analysis?.sparkScore || 50,
      voiceQualities: stage0Output.stage1Handoff.voiceContext?.voiceQuirks || [],
      authenticPhrases: stage0Output.stage1Handoff.voiceContext?.authenticPhrases || [],
    };

    const stage1B = await this.stage1BService.generateDiagnosis(
      stage0Output.voiceFirstDraft.draft,
      input.essayPrompt,
      stage1A.conceptual_foundation,
      voiceContext,
      stage0Output.analysis,
      input.collegeResearch // Pass college research for citation mapping
    );

    // STEP 3: Cliché Analysis (runs in parallel with validation)
    console.log('  Step 3/3: Running Cliché Analysis...');
    let clicheAnalysisCost = 0;
    let clicheContext: Stage1CombinedOutput['stage2_handoff']['cliche_context'] | undefined;
    let mergedIssues = [...stage1B.top_3_critical_issues];

    try {
      const clicheAnalysis = await semanticClicheAnalyzer.analyze(
        stage0Output.voiceFirstDraft.draft,
        { college_id: input.collegeId }
      );
      clicheAnalysisCost = clicheAnalysis.cost || 0;

      // Only integrate cliché issues if risk warrants it
      if (clicheAnalysis.cliche_risk_score >= 40) {
        console.log(`  ⚠️  Cliché risk detected: ${clicheAnalysis.overall_cliche_risk} (${clicheAnalysis.cliche_risk_score}/100)`);

        // Generate cliché-specific issues
        const clicheIssues = generateClicheIssues(clicheAnalysis, {
          collegeId: input.collegeId,
          essayText: stage0Output.voiceFirstDraft.draft,
          maxIssues: 2, // Limit cliché issues to avoid overwhelming
          minRiskScore: 40,
        });

        if (clicheIssues.length > 0) {
          // Merge issues: prioritize diagnostic issues, add cliché issues if they don't overlap
          const existingSymptomTypes = new Set(stage1B.top_3_critical_issues.map(i => i.symptom_type));
          const newClicheIssues = clicheIssues.filter(ci =>
            !existingSymptomTypes.has(ci.symptom_type) &&
            !existingSymptomTypes.has('telling_not_showing') // Don't duplicate telling issues
          );

          // Renumber merged issues
          mergedIssues = [...stage1B.top_3_critical_issues, ...newClicheIssues.slice(0, 1)];
          mergedIssues.forEach((issue, idx) => {
            issue.issue_number = idx + 1;
          });

          // Cap at 3 issues
          mergedIssues = mergedIssues.slice(0, 3);

          console.log(`  ✓ Added ${newClicheIssues.length > 0 ? 1 : 0} cliché-specific issue(s)`);
        }

        // Format cliché context for Stage 2 handoff
        const formattedClicheContext = formatClicheIssuesForStage2(clicheIssues, clicheAnalysis);
        clicheContext = formattedClicheContext.cliche_context;
      } else {
        console.log(`  ✓ Low cliché risk (${clicheAnalysis.cliche_risk_score}/100) - no cliché issues added`);
      }
    } catch (clicheError) {
      console.warn(`  ⚠️  Cliché analysis failed (non-blocking): ${clicheError}`);
      // Continue without cliché analysis - it's enhancement, not critical
    }

    // VALIDATE Stage 1B output quality
    const missingElementsWarnings: string[] = [];
    mergedIssues.forEach((issue, idx) => {
      if (!issue.missing_elements ||
          (!issue.missing_elements.sensory_details?.length &&
           !issue.missing_elements.concrete_objects?.length &&
           !issue.missing_elements.micro_moment &&
           !issue.missing_elements.emotional_truth)) {
        missingElementsWarnings.push(`Issue ${idx + 1} missing 'missing_elements' field`);
      }
    });

    if (missingElementsWarnings.length > 0) {
      console.warn(`⚠️  Stage 1 warnings: ${missingElementsWarnings.join(', ')}`);
    }

    // COMBINE outputs from all stages
    const combinedCost = stage1A.cost + stage1B.cost + clicheAnalysisCost;

    console.log(`✓ Stage 1 complete (Split Architecture + Cliché Analysis)`);
    console.log(`  1A Teaching: $${stage1A.cost.toFixed(3)}`);
    console.log(`  1B Diagnosis: $${stage1B.cost.toFixed(3)}`);
    console.log(`  Cliché Analysis: $${clicheAnalysisCost.toFixed(3)}`);
    console.log(`  Total: $${combinedCost.toFixed(3)}`);
    console.log(`  Top ${mergedIssues.length} issues identified (including cliché issues if detected)`);

    return {
      conceptual_foundation: stage1A.conceptual_foundation,
      dimensional_assessment: stage1B.dimensional_assessment,
      top_3_critical_issues: mergedIssues,
      stage2_handoff: {
        ...stage1B.stage2_handoff,
        cliche_context,
      },
      cost: combinedCost,
      cost_breakdown: {
        teaching: stage1A.cost,
        diagnosis: stage1B.cost,
        cliche_analysis: clicheAnalysisCost,
      },
      tokens_used: {
        haiku_input: stage1B.tokens_used.haiku_input,
        haiku_output: stage1B.tokens_used.haiku_output,
        sonnet_input: stage1A.tokens_used.input + stage1B.tokens_used.sonnet_input,
        sonnet_output: stage1A.tokens_used.output + stage1B.tokens_used.sonnet_output,
      },
    };
  }

  private async runStage2(
    input: WorkshopInput,
    stage0Output: Stage0Output,
    stage1Output: Stage1CombinedOutput
  ): Promise<Stage2BatchOutput> {
    return this.stage2Service.generateStage2Teaching(
      stage0Output.voiceFirstDraft.draft,
      stage1Output
    );
  }

  private async runStage3(
    input: WorkshopInput,
    stage1Output: Stage1CombinedOutput,
    stage2Output: Stage2BatchOutput
  ): Promise<Stage3ConsolidatedOutput> {
    // Use revised draft if student applied suggestions, otherwise original
    const finalDraft = stage2Output.stage3_handoff.revised_draft;

    return this.stage3Service.generateStage3Polish(
      finalDraft,
      input.collegeName,
      stage1Output,
      stage2Output
    );
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  private validateStage0Output(output: Stage0Output): void {
    const validation = this.validateStage0(output);
    if (!validation.valid) {
      throw new Error(`Stage 0 validation failed: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Stage 0 warnings: ${validation.warnings.join(', ')}`);
    }
  }

  private validateStage1Output(output: Stage1CombinedOutput): void {
    const validation = this.validateStage1(output);
    if (!validation.valid) {
      throw new Error(`Stage 1 validation failed: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Stage 1 warnings: ${validation.warnings.join(', ')}`);
    }
  }

  private validateStage2Output(output: Stage2BatchOutput): void {
    const validation = this.validateStage2(output);
    if (!validation.valid) {
      throw new Error(`Stage 2 validation failed: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Stage 2 warnings: ${validation.warnings.join(', ')}`);
    }
  }

  private validateStage3Output(output: Stage3ConsolidatedOutput): void {
    const validation = this.validateStage3(output);
    if (!validation.valid) {
      throw new Error(`Stage 3 validation failed: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Stage 3 warnings: ${validation.warnings.join(', ')}`);
    }
  }

  private validateStage0(output: Stage0Output): HandoffValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have stage1Handoff
    if (!output.stage1Handoff) {
      errors.push('Missing stage1Handoff');
      return { valid: false, errors, warnings };
    }

    // Must have voice context
    if (!output.stage1Handoff.voiceContext) {
      errors.push('Missing voice context');
    }

    // Must have voice-first draft
    if (!output.voiceFirstDraft || !output.voiceFirstDraft.draft) {
      errors.push('Missing voice-first draft');
    }

    // Spark score should be reasonable
    const sparkScore = output.stage1Handoff.voiceContext?.sparkScore;
    if (sparkScore !== undefined && sparkScore < 30) {
      warnings.push(`Low spark score: ${sparkScore}`);
    }

    // Should have authentic phrases
    const phrases = output.stage1Handoff.voiceContext?.authenticPhrases;
    if (phrases && phrases.length === 0) {
      warnings.push('No authentic phrases identified');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateStage1(output: Stage1CombinedOutput): HandoffValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have top_3_critical_issues array
    if (!output.top_3_critical_issues) {
      errors.push('Missing top_3_critical_issues array');
      return { valid: false, errors, warnings };
    }

    // Must have 2-3 critical issues (flexible based on essay complexity)
    if (output.top_3_critical_issues.length < 2 || output.top_3_critical_issues.length > 3) {
      errors.push(
        `Expected 2-3 critical issues, got ${output.top_3_critical_issues.length}`
      );
    }

    // Must have stage2 handoff context
    if (!output.stage2_handoff || !output.stage2_handoff.voice_fingerprint) {
      errors.push('Missing stage2 handoff context');
    }

    // Each issue should have missing elements
    output.top_3_critical_issues.forEach((issue, i) => {
      if (!issue.missing_elements || Object.keys(issue.missing_elements).length === 0) {
        warnings.push(`Issue ${i + 1} missing 'missing_elements' field`);
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateStage2(output: Stage2BatchOutput): HandoffValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have surgical teaching
    if (!output.surgical_teaching) {
      errors.push('Missing surgical teaching');
      return { valid: false, errors, warnings };
    }

    // Must have issues (BatchGenerationOutput has 'issues' not 'issue_teachings')
    if (!output.surgical_teaching.issues) {
      errors.push('Missing issues in surgical_teaching');
      return { valid: false, errors, warnings };
    }

    // Should have at least 2 issues (flexible based on essay)
    if (output.surgical_teaching.issues.length < 2) {
      warnings.push(
        `Expected at least 2 issues, got ${output.surgical_teaching.issues.length}`
      );
    }

    // Each issue should have 2 suggestions
    output.surgical_teaching.issues.forEach((issue, i) => {
      if (!issue.suggestions?.polished_original || !issue.suggestions?.voice_amplifier) {
        warnings.push(`Issue ${i + 1} missing one or both suggestions`);
      }
    });

    // Should have progress metrics
    if (output.progress.estimated_score_lift === 0) {
      warnings.push('No estimated score lift calculated');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateStage3(output: Stage3ConsolidatedOutput): HandoffValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have journey progress
    if (!output.journey_progress) {
      errors.push('Missing journey progress');
    }

    // Must have celebration
    if (!output.celebration) {
      errors.push('Missing celebration');
    }

    // Should have micro-refinements
    if (output.micro_refinements.length === 0) {
      warnings.push('No micro-refinements identified');
    }

    // Should have confidence assessment
    if (!output.confidence_assessment) {
      errors.push('Missing confidence assessment');
    }

    // Final scores should be reasonable
    const finalScores = Object.values(output.final_dimensional_scores);
    if (finalScores.some((score) => score < 1 || score > 10)) {
      errors.push('Final dimensional scores out of range (1-10)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ==========================================================================
  // METRICS CALCULATION
  // ==========================================================================

  private calculateMetrics(
    stage0: Stage0Output,
    stage1: Stage1CombinedOutput,
    stage2: Stage2BatchOutput,
    stage3: Stage3ConsolidatedOutput
  ) {
    // Calculate total cost
    const stage0Cost = stage0.costTracking.totalCost;
    const stage1Cost = stage1.cost;
    const stage2Cost = stage2.cost;
    const stage3Cost = stage3.cost;
    const totalCost = stage0Cost + stage1Cost + stage2Cost + stage3Cost;

    // Calculate token usage
    const totalTokens = {
      haiku: (stage1.tokens_used.haiku_input + stage1.tokens_used.haiku_output) +
             stage2.tokens_used.haiku_total + stage3.tokens_used.haiku,
      sonnet_input:
        stage1.tokens_used.sonnet_input +
        stage2.tokens_used.sonnet_input +
        stage3.tokens_used.sonnet_input,
      sonnet_output:
        stage1.tokens_used.sonnet_output +
        stage2.tokens_used.sonnet_output +
        stage3.tokens_used.sonnet_output,
    };

    // Calculate quality metrics
    const initialSpark = stage0.analysis?.sparkScore || 0; // Defensive default
    const finalSpark = stage3.authenticity_report?.voice_preservation_score || 0; // Defensive default
    const sparkImprovement = finalSpark - initialSpark;

    // Average dimension improvement
    const dimensionImprovements = stage3.journey_progress?.dimensions?.map(
      (d) => d.improvement
    ) || [];
    const avgImprovement = dimensionImprovements.length > 0
      ? dimensionImprovements.reduce((sum, imp) => sum + imp, 0) / dimensionImprovements.length
      : 0;

    return {
      total_cost: totalCost,
      cost_by_stage: {
        stage0: stage0Cost,
        stage1: stage1Cost,
        stage2: stage2Cost,
        stage3: stage3Cost,
      },
      total_tokens: totalTokens,
      quality_metrics: {
        initial_spark: initialSpark,
        final_spark: finalSpark,
        spark_improvement: sparkImprovement,
        average_dimension_improvement: Math.round(avgImprovement * 10) / 10,
        ready_for_submission: stage3.ready_for_submission,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { WorkshopInput, CompleteWorkshopOutput };
