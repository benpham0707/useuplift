// @ts-nocheck
/**
 * Quality Improvement Tracker
 *
 * Tracks generation quality over time and identifies systematic issues
 * for both the enhancement system and the scoring system.
 *
 * **Purpose**:
 * 1. Log enhancement results (success/failure, score changes)
 * 2. Identify patterns in failures (which test cases fail repeatedly?)
 * 3. Track scoring variance (same text, different scores)
 * 4. Generate improvement recommendations
 *
 * **Usage**:
 * - After each enhancement test, log the result
 * - Periodically analyze the log to find patterns
 * - Use insights to improve enhancement prompts and scoring rubric
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancementLogEntry {
  timestamp: Date;
  test_name: string;
  essay_type: string;
  college: string;

  // Enhancement details
  enhancement_attempted: boolean;
  enhancement_used: boolean;
  changes_made: number;
  validation_result: {
    voice_preserved: boolean;
    core_message_preserved: boolean;
    use_enhanced: boolean;
  };

  // Scoring results
  before_score: number;
  after_score: number;
  score_delta: number;

  // Dimension changes
  dimensions_improved: string[];
  dimensions_degraded: string[];

  // Costs
  cost: number;
  latency_ms: number;

  // Analysis
  failure_reason?: string;
  recommendation?: string;
}

export interface QualityMetrics {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  pass_rate: number;

  // Enhancement metrics
  enhancement_attempt_rate: number;
  enhancement_use_rate: number;
  average_changes_per_enhancement: number;

  // Score metrics
  average_before_score: number;
  average_after_score: number;
  average_improvement: number;
  max_improvement: number;
  max_degradation: number;

  // Dimension analysis
  most_improved_dimensions: Array<{ dimension: string; count: number }>;
  most_degraded_dimensions: Array<{ dimension: string; count: number }>;

  // Validation metrics
  voice_preservation_rate: number;
  core_message_preservation_rate: number;

  // Cost metrics
  total_cost: number;
  average_cost_per_test: number;
  average_latency_ms: number;
}

export interface ImprovementRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  area: 'enhancement' | 'scoring' | 'data' | 'validation';
  issue: string;
  recommendation: string;
  evidence: string;
}

// ============================================================================
// TRACKER CLASS
// ============================================================================

export class QualityImprovementTracker {
  private log: EnhancementLogEntry[] = [];

  /**
   * Log an enhancement test result
   */
  logResult(entry: Omit<EnhancementLogEntry, 'timestamp'>): void {
    this.log.push({
      ...entry,
      timestamp: new Date(),
    });
  }

  /**
   * Calculate quality metrics from the log
   */
  calculateMetrics(): QualityMetrics {
    if (this.log.length === 0) {
      return this.emptyMetrics();
    }

    const total = this.log.length;
    const passed = this.log.filter(e => e.score_delta > 0).length;
    const enhancementAttempts = this.log.filter(e => e.enhancement_attempted).length;
    const enhancementUsed = this.log.filter(e => e.enhancement_used).length;

    // Dimension tracking
    const dimensionImproved: Record<string, number> = {};
    const dimensionDegraded: Record<string, number> = {};

    for (const entry of this.log) {
      for (const dim of entry.dimensions_improved) {
        dimensionImproved[dim] = (dimensionImproved[dim] || 0) + 1;
      }
      for (const dim of entry.dimensions_degraded) {
        dimensionDegraded[dim] = (dimensionDegraded[dim] || 0) + 1;
      }
    }

    const voicePreserved = this.log.filter(e => e.validation_result.voice_preserved).length;
    const coreMessagePreserved = this.log.filter(e => e.validation_result.core_message_preserved).length;

    return {
      total_tests: total,
      passed_tests: passed,
      failed_tests: total - passed,
      pass_rate: (passed / total) * 100,

      enhancement_attempt_rate: (enhancementAttempts / total) * 100,
      enhancement_use_rate: enhancementAttempts > 0 ? (enhancementUsed / enhancementAttempts) * 100 : 0,
      average_changes_per_enhancement: enhancementUsed > 0
        ? this.log.filter(e => e.enhancement_used).reduce((sum, e) => sum + e.changes_made, 0) / enhancementUsed
        : 0,

      average_before_score: this.average(this.log.map(e => e.before_score)),
      average_after_score: this.average(this.log.map(e => e.after_score)),
      average_improvement: this.average(this.log.map(e => e.score_delta)),
      max_improvement: Math.max(...this.log.map(e => e.score_delta)),
      max_degradation: Math.min(...this.log.map(e => e.score_delta)),

      most_improved_dimensions: Object.entries(dimensionImproved)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([dimension, count]) => ({ dimension, count })),

      most_degraded_dimensions: Object.entries(dimensionDegraded)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([dimension, count]) => ({ dimension, count })),

      voice_preservation_rate: (voicePreserved / total) * 100,
      core_message_preservation_rate: (coreMessagePreserved / total) * 100,

      total_cost: this.log.reduce((sum, e) => sum + e.cost, 0),
      average_cost_per_test: this.average(this.log.map(e => e.cost)),
      average_latency_ms: this.average(this.log.map(e => e.latency_ms)),
    };
  }

  /**
   * Generate improvement recommendations based on the log
   */
  generateRecommendations(): ImprovementRecommendation[] {
    const recommendations: ImprovementRecommendation[] = [];
    const metrics = this.calculateMetrics();

    // Critical: Low pass rate
    if (metrics.pass_rate < 50) {
      recommendations.push({
        priority: 'critical',
        area: 'enhancement',
        issue: `Pass rate is only ${metrics.pass_rate.toFixed(1)}%`,
        recommendation: 'Review enhancement prompt and validation logic. Consider loosening voice preservation check or improving resource matching.',
        evidence: `${metrics.failed_tests} of ${metrics.total_tests} tests failed`,
      });
    }

    // High: Low enhancement use rate
    if (metrics.enhancement_attempt_rate > 50 && metrics.enhancement_use_rate < 30) {
      recommendations.push({
        priority: 'high',
        area: 'validation',
        issue: `Enhancements attempted but rejected ${(100 - metrics.enhancement_use_rate).toFixed(1)}% of the time`,
        recommendation: 'Validation is too strict. Consider allowing slightly longer enhanced text or relaxing word count checks.',
        evidence: `Voice preservation: ${metrics.voice_preservation_rate.toFixed(1)}%, Core message: ${metrics.core_message_preservation_rate.toFixed(1)}%`,
      });
    }

    // High: Consistent degradation in specific dimension
    for (const dim of metrics.most_degraded_dimensions) {
      if (dim.count >= 2) {
        recommendations.push({
          priority: 'high',
          area: 'enhancement',
          issue: `Dimension "${dim.dimension}" degraded in ${dim.count} tests`,
          recommendation: `Review enhancement logic for ${dim.dimension}. May need to preserve original patterns that score well.`,
          evidence: `This dimension appears in degraded list ${dim.count} times`,
        });
      }
    }

    // Medium: Low improvement delta even when enhancement used
    const usedEnhancements = this.log.filter(e => e.enhancement_used);
    if (usedEnhancements.length > 0) {
      const avgImprovement = this.average(usedEnhancements.map(e => e.score_delta));
      if (avgImprovement < 5) {
        recommendations.push({
          priority: 'medium',
          area: 'enhancement',
          issue: `Average improvement when enhancement used is only ${avgImprovement.toFixed(1)} points`,
          recommendation: 'Enhance more aggressively - add more specific resources, faculty names, or program references.',
          evidence: `Expected at least +5 points per successful enhancement`,
        });
      }
    }

    // Medium: Scoring variance (same text, different scores)
    const unchangedButDifferent = this.log.filter(
      e => !e.enhancement_used && Math.abs(e.score_delta) > 3
    );
    if (unchangedButDifferent.length > 0) {
      recommendations.push({
        priority: 'medium',
        area: 'scoring',
        issue: `${unchangedButDifferent.length} tests showed score variance > 3 points for unchanged text`,
        recommendation: 'Reduce scoring temperature or add calibration examples to reduce variance.',
        evidence: `Scoring should be deterministic for identical text`,
      });
    }

    // Low: Cost optimization
    if (metrics.average_cost_per_test > 0.10) {
      recommendations.push({
        priority: 'low',
        area: 'scoring',
        issue: `Average cost per test is $${metrics.average_cost_per_test.toFixed(4)}`,
        recommendation: 'Consider caching scoring for unchanged text or using Haiku for initial triage.',
        evidence: `Target cost should be < $0.05 per test`,
      });
    }

    return recommendations;
  }

  /**
   * Get detailed failure analysis
   */
  getFailureAnalysis(): Array<{
    test_name: string;
    essay_type: string;
    score_delta: number;
    dimensions_degraded: string[];
    failure_reason: string;
    suggested_fix: string;
  }> {
    return this.log
      .filter(e => e.score_delta < 0)
      .map(e => ({
        test_name: e.test_name,
        essay_type: e.essay_type,
        score_delta: e.score_delta,
        dimensions_degraded: e.dimensions_degraded,
        failure_reason: this.inferFailureReason(e),
        suggested_fix: this.suggestFix(e),
      }));
  }

  /**
   * Export log as JSON for persistence
   */
  exportLog(): string {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      entries: this.log,
      metrics: this.calculateMetrics(),
      recommendations: this.generateRecommendations(),
    }, null, 2);
  }

  /**
   * Import log from JSON
   */
  importLog(json: string): void {
    try {
      const data = JSON.parse(json);
      this.log = data.entries.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
    } catch (error) {
      console.error('[QualityImprovementTracker] Failed to import log:', error);
    }
  }

  /**
   * Clear the log
   */
  clearLog(): void {
    this.log = [];
  }

  /**
   * Get raw log entries
   */
  getLog(): EnhancementLogEntry[] {
    return [...this.log];
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private emptyMetrics(): QualityMetrics {
    return {
      total_tests: 0,
      passed_tests: 0,
      failed_tests: 0,
      pass_rate: 0,
      enhancement_attempt_rate: 0,
      enhancement_use_rate: 0,
      average_changes_per_enhancement: 0,
      average_before_score: 0,
      average_after_score: 0,
      average_improvement: 0,
      max_improvement: 0,
      max_degradation: 0,
      most_improved_dimensions: [],
      most_degraded_dimensions: [],
      voice_preservation_rate: 0,
      core_message_preservation_rate: 0,
      total_cost: 0,
      average_cost_per_test: 0,
      average_latency_ms: 0,
    };
  }

  private inferFailureReason(entry: EnhancementLogEntry): string {
    if (!entry.enhancement_attempted) {
      return 'No enhancement attempted - no matching resources found';
    }
    if (entry.enhancement_attempted && !entry.enhancement_used) {
      if (!entry.validation_result.voice_preserved) {
        return 'Enhancement rejected - voice preservation failed';
      }
      if (!entry.validation_result.core_message_preserved) {
        return 'Enhancement rejected - core message changed';
      }
      return 'Enhancement rejected by validation';
    }
    if (entry.score_delta < 0) {
      if (entry.dimensions_degraded.includes('tone_match')) {
        return 'Enhancement degraded tone - may have added overly formal language';
      }
      if (entry.dimensions_degraded.includes('cliche_avoidance')) {
        return 'Enhancement added clichéd patterns';
      }
      if (entry.dimensions_degraded.includes('elite_craft')) {
        return 'Enhancement reduced elite craft markers';
      }
      return 'Score degraded despite using enhancement';
    }
    return 'Unknown failure';
  }

  private suggestFix(entry: EnhancementLogEntry): string {
    if (!entry.enhancement_attempted) {
      return 'Add more resources to college data (programs, labs, faculty) with relevant keywords';
    }
    if (!entry.validation_result.voice_preserved) {
      return 'Relax voice preservation check - allow slightly longer text for additive enhancements';
    }
    if (entry.dimensions_degraded.includes('tone_match')) {
      return 'Review enhancement prompt - ensure it preserves conversational tone';
    }
    if (entry.dimensions_degraded.includes('cliche_avoidance')) {
      return 'Add cliché patterns to red flag list in enhancement prompt';
    }
    return 'Review enhancement and scoring prompts for this essay type';
  }
}

// Singleton export
export const qualityImprovementTracker = new QualityImprovementTracker();
