/**
 * Award Analysis Orchestrator
 *
 * Multi-phase orchestration of award analysis following the PIQ workshop pattern.
 * Coordinates tier classification, authenticity detection, context analysis,
 * and synthesis into a comprehensive evaluation.
 *
 * Architecture:
 * - Phase 1: Tier Classification (parallel per-award)
 * - Phase 2: Authenticity Detection (parallel per-award)
 * - Phase 3: Context & School-Specific Analysis
 * - Phase 4: Portfolio Synthesis & Recommendations
 *
 * @module awardAnalysisOrchestrator
 */

import {
  EnhancedAwardsInput,
  EnhancedAwardEvaluation,
  EnhancedAwardInput,
} from '../types/awardsEnhanced';
import { enhancedAwardEvaluator } from '../engines/enhancedAwardEvaluator';
import { awardKnowledgeBase } from '../knowledge/awardKnowledgeBase';
import { awardTierEngine } from '../engines/awardTierEngine';
import { awardAuthenticityEngine } from '../engines/awardAuthenticityEngine';

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

/**
 * Analysis phase status
 */
export interface PhaseStatus {
  phase: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  itemsProcessed?: number;
  error?: string;
}

/**
 * Orchestration result with phase timings
 */
export interface OrchestratorResult {
  evaluation: EnhancedAwardEvaluation;
  phases: PhaseStatus[];
  totalDurationMs: number;
  researchModulesLoaded: string[];
  awardsAnalyzed: number;
}

/**
 * Progressive result callback for UI updates
 */
export type ProgressCallback = (
  phase: string,
  progress: number,
  message: string
) => void;

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

/**
 * Award Analysis Orchestrator
 *
 * Coordinates multi-phase award analysis with progress tracking
 * and phase-by-phase result delivery.
 */
export class AwardAnalysisOrchestrator {
  private phases: PhaseStatus[] = [];

  constructor() {}

  // ============================================================================
  // MAIN ORCHESTRATION METHOD
  // ============================================================================

  /**
   * Run complete award analysis with phase tracking
   */
  async analyze(
    input: EnhancedAwardsInput,
    onProgress?: ProgressCallback
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    this.phases = [];

    try {
      // Validate input
      this.validateInput(input);

      // Phase 1: Initialize and load knowledge base
      await this.runPhase('initialization', async () => {
        onProgress?.('initialization', 10, 'Loading award knowledge base...');
        const stats = awardKnowledgeBase.getStatistics();
        onProgress?.('initialization', 100, `Loaded ${stats.totalAwards} known awards`);
        return stats;
      });

      // Phase 2: Tier Classification (parallel)
      const tierResults = await this.runPhase('tier_classification', async () => {
        onProgress?.('tier_classification', 0, 'Classifying award tiers...');

        const results = awardTierEngine.classifyAwards(input.awards, {
          state: input.studentContext.state,
          isFirstGen: input.studentContext.isFirstGen,
          isLowIncome: input.studentContext.isLowIncome,
          isRural: input.studentContext.isRural,
        });

        onProgress?.(
          'tier_classification',
          100,
          `Classified ${results.size} awards into tiers`
        );
        return results;
      });

      // Phase 3: Authenticity Detection (parallel)
      const authenticityResults = await this.runPhase('authenticity_detection', async () => {
        onProgress?.('authenticity_detection', 0, 'Running authenticity checks...');

        const results = new Map();
        let processed = 0;

        for (const award of input.awards) {
          const assessment = awardAuthenticityEngine.assessAuthenticity(
            award,
            input.relatedActivities || [],
            input.awards
          );
          results.set(award.id, assessment);
          processed++;
          onProgress?.(
            'authenticity_detection',
            (processed / input.awards.length) * 100,
            `Checked ${processed}/${input.awards.length} awards`
          );
        }

        return results;
      });

      // Phase 4: Full Evaluation
      const evaluation = await this.runPhase('full_evaluation', async () => {
        onProgress?.('full_evaluation', 0, 'Running comprehensive analysis...');

        const result = await enhancedAwardEvaluator.evaluate(input);

        onProgress?.('full_evaluation', 100, 'Analysis complete');
        return result;
      });

      // Phase 5: Synthesis
      await this.runPhase('synthesis', async () => {
        onProgress?.('synthesis', 50, 'Generating recommendations...');
        // Synthesis is already included in full_evaluation
        onProgress?.('synthesis', 100, 'Synthesis complete');
      });

      const totalDurationMs = Date.now() - startTime;

      return {
        evaluation,
        phases: this.phases,
        totalDurationMs,
        researchModulesLoaded: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'],
        awardsAnalyzed: input.awards.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Award analysis failed: ${errorMessage}`);
    }
  }

  // ============================================================================
  // PHASE EXECUTION
  // ============================================================================

  /**
   * Run a single phase with timing and error tracking
   */
  private async runPhase<T>(
    phaseName: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const phase: PhaseStatus = {
      phase: phaseName,
      status: 'running',
      startTime: Date.now(),
    };
    this.phases.push(phase);

    try {
      const result = await executor();

      phase.status = 'completed';
      phase.endTime = Date.now();
      phase.durationMs = phase.endTime - phase.startTime!;

      return result;
    } catch (error) {
      phase.status = 'error';
      phase.endTime = Date.now();
      phase.durationMs = phase.endTime - phase.startTime!;
      phase.error = error instanceof Error ? error.message : 'Unknown error';

      throw error;
    }
  }

  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================

  /**
   * Validate input before processing
   */
  private validateInput(input: EnhancedAwardsInput): void {
    if (!input.awards || !Array.isArray(input.awards)) {
      throw new Error('Awards array is required');
    }

    if (input.awards.length === 0) {
      throw new Error('At least one award is required for analysis');
    }

    if (!input.studentContext) {
      throw new Error('Student context is required');
    }

    // Validate each award
    for (const award of input.awards) {
      if (!award.id) {
        throw new Error('Each award must have an ID');
      }
      if (!award.name) {
        throw new Error(`Award ${award.id} must have a name`);
      }
      if (!award.category) {
        throw new Error(`Award ${award.id} must have a category`);
      }
    }
  }

  // ============================================================================
  // QUICK ANALYSIS METHODS
  // ============================================================================

  /**
   * Quick tier-only analysis (no full evaluation)
   */
  async quickTierAnalysis(
    awards: EnhancedAwardInput[],
    studentContext: EnhancedAwardsInput['studentContext']
  ): Promise<{
    classifications: Map<string, import('../types/awardsEnhanced').AwardContextAssessment>;
    summary: ReturnType<typeof awardTierEngine.calculateTierSummary>;
  }> {
    const classifications = awardTierEngine.classifyAwards(awards, {
      state: studentContext.state,
      isFirstGen: studentContext.isFirstGen,
      isLowIncome: studentContext.isLowIncome,
      isRural: studentContext.isRural,
    });

    const summary = awardTierEngine.calculateTierSummary(classifications);

    return { classifications, summary };
  }

  /**
   * Quick authenticity check (no full evaluation)
   */
  async quickAuthenticityCheck(
    awards: EnhancedAwardInput[]
  ): Promise<{
    assessments: Map<string, import('../types/awardsEnhanced').AwardAuthenticityAssessment>;
    flaggedAwards: string[];
    overallRisk: string;
  }> {
    const assessments = new Map();
    const flaggedAwards: string[] = [];

    for (const award of awards) {
      const assessment = awardAuthenticityEngine.assessAuthenticity(award, [], awards);
      assessments.set(award.id, assessment);

      if (assessment.riskLevel !== 'none' && assessment.riskLevel !== 'low') {
        flaggedAwards.push(award.id);
      }
    }

    // Determine overall risk
    let overallRisk = 'none';
    const riskOrder = ['none', 'low', 'medium', 'high', 'severe'];

    for (const assessment of assessments.values()) {
      if (riskOrder.indexOf(assessment.riskLevel) > riskOrder.indexOf(overallRisk)) {
        overallRisk = assessment.riskLevel;
      }
    }

    return { assessments, flaggedAwards, overallRisk };
  }

  /**
   * Single award lookup with research context
   */
  lookupAward(awardName: string): {
    found: boolean;
    profile: import('../types/awardsEnhanced').EnhancedKnownAwardProfile | null;
    tier: import('../types/awardsEnhanced').AwardTier | null;
    insight: import('../types/awardsEnhanced').ResearchBackedInsight | null;
  } {
    const profile = awardKnowledgeBase.lookupAward(awardName);

    if (!profile) {
      return {
        found: false,
        profile: null,
        tier: null,
        insight: null,
      };
    }

    const insight = awardKnowledgeBase.getInsight(profile.category);

    return {
      found: true,
      profile,
      tier: profile.tier,
      insight,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get phase timings summary
   */
  getPhaseTimings(): Record<string, number> {
    const timings: Record<string, number> = {};
    for (const phase of this.phases) {
      if (phase.durationMs !== undefined) {
        timings[phase.phase] = phase.durationMs;
      }
    }
    return timings;
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats(): ReturnType<typeof awardKnowledgeBase.getStatistics> {
    return awardKnowledgeBase.getStatistics();
  }

  /**
   * Search for relevant research modules
   */
  searchResearchModules(keyword: string): ReturnType<typeof awardKnowledgeBase.searchModules> {
    return awardKnowledgeBase.searchModules(keyword);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const awardAnalysisOrchestrator = new AwardAnalysisOrchestrator();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Analyze awards with full orchestration
 */
export async function analyzeAwards(
  input: EnhancedAwardsInput,
  onProgress?: ProgressCallback
): Promise<OrchestratorResult> {
  return awardAnalysisOrchestrator.analyze(input, onProgress);
}

/**
 * Quick tier classification
 */
export async function classifyAwardTiers(
  awards: EnhancedAwardInput[],
  studentContext: EnhancedAwardsInput['studentContext']
) {
  return awardAnalysisOrchestrator.quickTierAnalysis(awards, studentContext);
}

/**
 * Quick authenticity check
 */
export async function checkAwardAuthenticity(awards: EnhancedAwardInput[]) {
  return awardAnalysisOrchestrator.quickAuthenticityCheck(awards);
}

/**
 * Look up a single award
 */
export function lookupAward(awardName: string) {
  return awardAnalysisOrchestrator.lookupAward(awardName);
}
