// @ts-nocheck
/**
 * Stage 2 Batch Teaching Service
 *
 * **Surgical Teaching with Batch Generation**
 *
 * This service handles the most critical stage: addressing the 3 critical issues
 * identified in Stage 1 with PIQ-level depth and multimodal suggestions.
 *
 * **Architecture**:
 * 1. For each critical issue, run Haiku symptom diagnosis ($0.02 × 3 = $0.06)
 * 2. Assemble deterministic context bundles (no API cost)
 * 3. Generate ALL suggestions in SINGLE batch call ($0.06)
 * Total: $0.12 per essay
 *
 * **Why Batching Improves Quality**:
 * - Claude sees all 3 issues together → unified strategy
 * - Voice consistency across all suggestions
 * - No conflicting advice between issues
 * - Cohesive narrative improvements
 *
 * **Cost Comparison**:
 * - Sequential: 3 issues × $0.04 = $0.12 (per issue: diagnosis $0.02 + generation $0.02)
 * - Batched: Diagnosis $0.06 + Single generation $0.06 = $0.12
 * - Same cost, BETTER quality
 *
 * **What Stage 2 Accomplishes**:
 * - Student gets PIQ-level diagnosis for each critical issue
 * - Student gets 2 clear suggestions per issue (Polished Original + Voice Amplifier)
 * - Student understands WHY each suggestion works (evidence-based teaching)
 * - Student can choose the path that feels most authentic
 * - Student sees how all 3 fixes work together (coherent strategy)
 */

import Anthropic from '@anthropic-ai/sdk';
import { HaikuDiagnosisService } from './haikuDiagnosisService';
import { BatchGenerationService } from './batchGenerationService';
import type {
  VoiceFingerprint,
  CitationMapping,
  IssueSymptomDiagnosis,
} from '../types/stage0Types';
import type { Stage1CombinedOutput } from './handoffService';
import type { CriticalIssue } from './stage1BDiagnosisService';
import type {
  IssueContextBundle,
  HolisticContext,
  BatchGenerationOutput,
} from './batchGenerationService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Issue context (pre-diagnosis)
 */
export interface IssuePrepContext {
  issue: CriticalIssue;
  surrounding_context: string; // 500 chars before/after
  relevant_motifs: string[]; // From holistic context
  dimensional_impact: {
    dimension: string;
    current_score: number;
    target_score: number;
    gap: number;
  };
}

/**
 * Issue with full diagnosis (post-Haiku)
 */
export interface DiagnosedIssue {
  issue: CriticalIssue;
  symptom_diagnosis: IssueSymptomDiagnosis; // Haiku diagnosis
  context: IssuePrepContext;
  context_bundle: IssueContextBundle; // Ready for batch generation
}

/**
 * Stage 2 complete output
 */
export interface Stage2BatchOutput {
  // Progress assessment
  progress: {
    issues_addressed: number;
    total_issues: number;
    dimensions_improving: string[];
    estimated_score_lift: number; // Total across all dimensions
  };

  // Surgical teaching for all 3 issues
  surgical_teaching: BatchGenerationOutput;

  // Handoff to Stage 3
  stage3_handoff: {
    voice_fingerprint: VoiceFingerprint; // Preserved from Stage 1
    revised_draft: string; // Student's choice or original
    dimensional_scores: Record<string, number>; // Updated estimates
    concepts_reinforced: string[]; // From Stage 1 + Stage 2
    final_polish_priorities: string[]; // What Stage 3 should focus on
  };

  // Cost tracking
  cost: number;
  cost_breakdown: {
    haiku_diagnosis: number; // 3 issues
    batch_generation: number; // Single call
  };
  tokens_used: {
    haiku_total: number;
    sonnet_input: number;
    sonnet_output: number;
  };
}

/**
 * Dimensional feedback (summary across all issues)
 */
export interface DimensionalFeedbackSummary {
  dimension: string;
  issues_affecting_this: number;
  current_score: number;
  target_score: number;
  projected_score_after_fixes: number;
  key_improvements: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SURROUNDING_CONTEXT_CHARS = 500; // How much context around issue quote

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Stage2BatchService {
  private haikuService: HaikuDiagnosisService;
  private batchService: BatchGenerationService;

  constructor(apiKey?: string) {
    this.haikuService = new HaikuDiagnosisService(apiKey);
    this.batchService = new BatchGenerationService(apiKey);
  }

  /**
   * Generate complete Stage 2 surgical teaching (batched)
   *
   * This runs in 4 steps:
   * 1. Prep context for each issue (deterministic, no API)
   * 2. Haiku diagnosis for each issue ($0.02 × 3 = $0.06)
   * 3. Assemble context bundles (deterministic, no API)
   * 4. Batch generation for all issues ($0.06)
   * Total: ~$0.12
   */
  async generateStage2Teaching(
    essayDraft: string,
    stage1Output: Stage1CombinedOutput
  ): Promise<Stage2BatchOutput> {
    console.log('🔬 Stage 2: Running surgical teaching with batch generation...');

    const { top_3_critical_issues, stage2_handoff, dimensional_assessment } = stage1Output;

    // Step 1: Prep context for each issue
    console.log('  1/4: Preparing issue contexts...');
    const preppedIssues = top_3_critical_issues.map((issue) =>
      this.prepIssueContext(
        issue,
        essayDraft,
        stage2_handoff.holistic_context,
        dimensional_assessment
      )
    );

    // Step 2: Run Haiku diagnosis for each issue
    console.log('  2/4: Running Haiku diagnosis for all issues...');
    const diagnosedIssues = await this.diagnoseAllIssues(
      preppedIssues,
      stage2_handoff.voice_fingerprint,
      stage2_handoff.citation_mapping
    );

    // Step 3: Assemble context bundles
    console.log('  3/4: Assembling context bundles...');
    const contextBundles = diagnosedIssues.map((diagnosed) => diagnosed.context_bundle);

    // Step 4: Batch generation
    console.log('  4/4: Generating all suggestions in single batch...');
    const batchOutput = await this.batchService.generateBatchSuggestions(
      contextBundles,
      stage2_handoff.voice_fingerprint,
      {
        recurring_motifs: stage2_handoff.holistic_context.recurring_motifs,
        emotional_arc: stage2_handoff.holistic_context.emotional_arc,
        narrative_thread: stage2_handoff.holistic_context.narrative_thread,
        essay_full_text: essayDraft,
      }
    );

    // Calculate progress and dimensional improvements
    const progress = this.calculateProgress(diagnosedIssues, stage1Output);
    const dimensionalFeedback = this.summarizeDimensionalFeedback(
      diagnosedIssues,
      stage1Output
    );

    // Calculate costs
    const haikuCost = diagnosedIssues.reduce((sum, d) => sum + d.symptom_diagnosis.cost, 0);
    const batchCost = batchOutput.cost || 0; // Defensive default
    const totalCost = haikuCost + batchCost;

    console.log(`✓ Stage 2 complete`);
    console.log(`  3 issues addressed with 2 suggestions each`);
    console.log(`  Projected score lift: +${progress.estimated_score_lift}`);
    console.log(`  Cost: $${totalCost.toFixed(3)} (Haiku: $${haikuCost.toFixed(3)}, Batch: $${batchCost.toFixed(3)})`);

    return {
      progress,
      surgical_teaching: batchOutput,
      stage3_handoff: {
        voice_fingerprint: stage2_handoff.voice_fingerprint,
        revised_draft: essayDraft, // Will be updated if student applies suggestions
        dimensional_scores: this.estimateUpdatedScores(diagnosedIssues, stage1Output),
        concepts_reinforced: [
          ...stage2_handoff.concepts_taught,
          ...(batchOutput.strategic_summary?.unified_concepts || []),
        ],
        final_polish_priorities: this.identifyPolishPriorities(
          dimensionalFeedback,
          stage1Output
        ),
      },
      cost: totalCost,
      cost_breakdown: {
        haiku_diagnosis: haikuCost,
        batch_generation: batchOutput.cost,
      },
      tokens_used: {
        haiku_total: diagnosedIssues.reduce(
          (sum, d) => sum + (d.symptom_diagnosis.tokens_used?.input || 0),
          0
        ),
        sonnet_input: batchOutput.tokens_used.input,
        sonnet_output: batchOutput.tokens_used.output,
      },
    };
  }

  // ==========================================================================
  // STEP 1: PREP ISSUE CONTEXT
  // ==========================================================================

  /**
   * Prepare context for an issue (deterministic, no API call)
   *
   * PHASE 1A: Defensive defaults for missing_elements
   * PHASE 1B: Actual dimensional scores from Stage 1
   */
  private prepIssueContext(
    issue: CriticalIssue,
    essayDraft: string,
    holisticContext: {
      recurring_motifs: string[];
      emotional_arc: string;
      narrative_thread: string;
    },
    dimensionalAssessment: Array<{
      dimension: string;
      current_score: number;
      target_score: number;
      gap: number;
      strength: string;
    }>
  ): IssuePrepContext {
    // Find surrounding context (500 chars before/after the quote)
    const quote = issue.quote || '';
    const quoteIndex = essayDraft.indexOf(quote);
    const start = Math.max(0, quoteIndex - SURROUNDING_CONTEXT_CHARS);
    const end = Math.min(
      essayDraft.length,
      quoteIndex + quote.length + SURROUNDING_CONTEXT_CHARS
    );
    const surrounding_context = quoteIndex >= 0 ? essayDraft.substring(start, end) : essayDraft.substring(0, SURROUNDING_CONTEXT_CHARS * 2);

    // Identify relevant motifs (motifs that appear in surrounding context)
    const recurring_motifs = holisticContext.recurring_motifs || [];
    const relevant_motifs = recurring_motifs.filter((motif) =>
      surrounding_context.toLowerCase().includes(motif.toLowerCase())
    );

    // PHASE 1B: Find the dimensional assessment for this issue
    const matchingDimension = dimensionalAssessment.find(
      (da) => da.dimension === issue.college_value_impacted
    );

    // Extract dimensional impact from Stage 1 (with smart defaults)
    const dimensional_impact = {
      dimension: issue.college_value_impacted,
      current_score: matchingDimension?.current_score || 5, // Default to mid-range
      target_score: matchingDimension?.target_score || 8, // Default to strong target
      gap: matchingDimension?.gap || 3, // Default to moderate gap
    };

    // PHASE 1A: Ensure missing_elements has defensive defaults
    // This prevents Stage 2 crashes if Stage 1 doesn't populate this field
    const issueWithDefaults: CriticalIssue = {
      ...issue,
      missing_elements: issue.missing_elements || {
        sensory_details: [],
        concrete_objects: [],
        micro_moment: 'Not specified',
        emotional_truth: 'Not specified',
      },
    };

    return {
      issue: issueWithDefaults,
      surrounding_context,
      relevant_motifs,
      dimensional_impact,
    };
  }

  // ==========================================================================
  // STEP 2: DIAGNOSE ALL ISSUES
  // ==========================================================================

  /**
   * Run Haiku diagnosis for all issues in parallel
   */
  private async diagnoseAllIssues(
    preppedIssues: IssuePrepContext[],
    voiceFingerprint: VoiceFingerprint,
    citationMapping: CitationMapping
  ): Promise<DiagnosedIssue[]> {
    // Run all Haiku diagnoses in parallel
    const diagnosisPromises = preppedIssues.map(async (prep) => {
      // Find relevant values for this issue (with defensive defaults)
      const impactedValue = prep.issue.college_value_impacted || '';
      const relevantCoreValues = citationMapping.relevant_core_values || [];
      const relevantValues = relevantCoreValues.filter((cv) => {
        const valueName = cv?.core_value?.value_name || cv?.value_name || '';
        return impactedValue.toLowerCase().includes(valueName.toLowerCase());
      });

      // Run Haiku diagnosis
      const { diagnosis, cost } = await this.haikuService.diagnoseSymptom(
        prep.issue.quote,
        prep.surrounding_context,
        voiceFingerprint,
        relevantValues
      );

      // Add cost to diagnosis object for tracking
      const diagnosisWithCost = {
        ...diagnosis,
        cost,
        tokens_used: { input: 0, output: 0 }, // Haiku doesn't expose token breakdown easily
      };

      // Assemble context bundle (ready for batch generation)
      const contextBundle: IssueContextBundle = {
        issue_number: prep.issue.issue_number,
        quote: prep.issue.quote || '',
        location: prep.issue.location || '',
        surrounding_context: prep.surrounding_context,

        // Diagnosis from Haiku
        diagnosis: {
          problem: prep.issue.problem,
          symptom_type: prep.issue.symptom_type,
          diagnosis: diagnosis.diagnosis,
          prescription: diagnosis.prescription,
          missing_elements: diagnosis.missing_elements,
          voice_constraints: diagnosis.voice_constraints || [],
          college_alignment: diagnosis.college_alignment || '',
        },

        // Relevant evidence (defensive defaults)
        relevant_evidence: prep.issue.relevant_evidence || [],
      };

      return {
        issue: prep.issue,
        symptom_diagnosis: diagnosisWithCost,
        context: prep,
        context_bundle: contextBundle,
      };
    });

    return Promise.all(diagnosisPromises);
  }

  // ==========================================================================
  // STEP 4: PROGRESS CALCULATION
  // ==========================================================================

  /**
   * Calculate progress metrics
   */
  private calculateProgress(
    diagnosedIssues: DiagnosedIssue[],
    stage1Output: Stage1CombinedOutput
  ): {
    issues_addressed: number;
    total_issues: number;
    dimensions_improving: string[];
    estimated_score_lift: number;
  } {
    // Count unique dimensions affected
    const dimensionsAffected = new Set(
      diagnosedIssues.map((d) => d.issue.college_value_impacted)
    );

    // Calculate total score lift (sum of gaps)
    const totalGap = diagnosedIssues.reduce((sum, d) => {
      return sum + d.context.dimensional_impact.gap;
    }, 0);

    // Conservative estimate: fixing these issues closes 60% of the gap
    const estimatedLift = Math.round(totalGap * 0.6);

    return {
      issues_addressed: diagnosedIssues.length,
      total_issues: stage1Output.top_3_critical_issues.length,
      dimensions_improving: Array.from(dimensionsAffected),
      estimated_score_lift: estimatedLift,
    };
  }

  /**
   * Summarize dimensional feedback across all issues
   */
  private summarizeDimensionalFeedback(
    diagnosedIssues: DiagnosedIssue[],
    stage1Output: Stage1CombinedOutput
  ): DimensionalFeedbackSummary[] {
    // Group issues by dimension
    const dimensionGroups = new Map<string, DiagnosedIssue[]>();

    diagnosedIssues.forEach((issue) => {
      const dim = issue.issue.college_value_impacted;
      if (!dimensionGroups.has(dim)) {
        dimensionGroups.set(dim, []);
      }
      dimensionGroups.get(dim)!.push(issue);
    });

    // Create summary for each dimension
    return Array.from(dimensionGroups.entries()).map(([dimension, issues]) => {
      // Find dimension assessment from Stage 1
      const dimAssessment = stage1Output.dimensional_assessment.find(
        (da) => da.dimension === dimension
      );

      const current_score = dimAssessment?.current_score || 0;
      const target_score = dimAssessment?.target_score || 0;
      const gap = target_score - current_score;

      // Estimate score after fixes (60% of gap closed)
      const projected_score_after_fixes = current_score + Math.round(gap * 0.6);

      // Extract key improvements from diagnoses
      const key_improvements = issues.map((issue) => issue.symptom_diagnosis.prescription);

      return {
        dimension,
        issues_affecting_this: issues.length,
        current_score,
        target_score,
        projected_score_after_fixes,
        key_improvements,
      };
    });
  }

  /**
   * Estimate updated dimensional scores after fixes
   */
  private estimateUpdatedScores(
    diagnosedIssues: DiagnosedIssue[],
    stage1Output: Stage1CombinedOutput
  ): Record<string, number> {
    const updated = { ...stage1Output.stage2_handoff.dimensional_baseline };

    // For each dimension with issues, increase score by 60% of gap
    const dimensionalFeedback = this.summarizeDimensionalFeedback(
      diagnosedIssues,
      stage1Output
    );

    dimensionalFeedback.forEach((df) => {
      if (df.dimension) {
        const dimensionKey = df.dimension.toLowerCase().replace(/\s+/g, '_');
        updated[dimensionKey] = df.projected_score_after_fixes;
      }
    });

    return updated;
  }

  /**
   * Identify polish priorities for Stage 3
   */
  private identifyPolishPriorities(
    dimensionalFeedback: DimensionalFeedbackSummary[],
    stage1Output: Stage1CombinedOutput
  ): string[] {
    const priorities: string[] = [];

    // 1. Dimensions still below target
    dimensionalFeedback.forEach((df) => {
      if (df.dimension && df.projected_score_after_fixes < df.target_score) {
        const remaining_gap = df.target_score - df.projected_score_after_fixes;
        priorities.push(
          `${df.dimension}: Still ${remaining_gap} points below target after fixes`
        );
      }
    });

    // 2. Voice consistency (always important)
    priorities.push('Voice consistency across all edits');

    // 3. Narrative flow (if any structural issues)
    const hasStructuralIssues = stage1Output.dimensional_assessment.some(
      (da) => da.dimension === 'Narrative Quality' && da.strength === 'WEAK'
    );
    if (hasStructuralIssues) {
      priorities.push('Narrative flow and transitions');
    }

    // 4. Final authenticity check
    priorities.push('Authenticity and spark preservation');

    return priorities;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  IssuePrepContext,
  DiagnosedIssue,
  Stage2BatchOutput,
  DimensionalFeedbackSummary,
};
