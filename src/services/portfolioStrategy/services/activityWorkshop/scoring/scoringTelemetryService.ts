/**
 * Scoring Telemetry Service
 *
 * Fire-and-forget telemetry recorder for the scoring pipeline. Captures
 * detailed traces of every scoring decision (domain resolution, LLM adjustments,
 * tier classification) for:
 *
 *   1. Calibration drift detection — are LLM adjustments diverging from rules?
 *   2. Coverage gap analysis — which domains lack calibration data?
 *   3. Domain-level analytics — score distributions per category
 *
 * PERFORMANCE GUARANTEES:
 * - record() is synchronous and NON-BLOCKING — calls writeAsync().catch()
 * - Analytics methods (getDomainStats, detectCalibrationDrift, getCoverageGaps)
 *   are async and intended for admin dashboards, not the hot scoring path
 *
 * PRIVACY:
 * - Fingerprints are SHA-256 hashes — no user data is recoverable
 * - No user IDs stored
 * - Activity titles stored for debugging only (admin-only table)
 */

import type {
  ScoringTelemetryRecord,
  ScoringTelemetryRow,
  DomainStats,
  DriftReport,
  CoverageGapReport,
} from './scoringTelemetryTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_NAME = 'scoring_telemetry';
const DRIFT_THRESHOLD = 0.3;
const DRIFT_MIN_SAMPLES = 20;

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Scoring Telemetry Service
 *
 * Provides fire-and-forget recording + admin analytics queries.
 * Uses the same lazy Supabase import pattern as CrossUserCacheService
 * to avoid loading Supabase at module init time.
 */
export class ScoringTelemetryService {
  // ==========================================================================
  // RECORDING (fire-and-forget)
  // ==========================================================================

  /**
   * Record a telemetry entry for a scored activity.
   *
   * NON-BLOCKING: This method is synchronous. It kicks off an async write
   * and catches any errors internally. The scoring pipeline is never slowed
   * by telemetry failures.
   */
  record(record: ScoringTelemetryRecord): void {
    if (!this.isValid(record)) {
      console.warn('[ScoringTelemetry] Invalid record, skipping:', record.fingerprint?.substring(0, 12));
      return;
    }

    this.writeAsync(record).catch((error) => {
      console.error(
        '[ScoringTelemetry] Write failed (non-blocking):',
        error instanceof Error ? error.message : 'Unknown error'
      );
    });
  }

  // ==========================================================================
  // ANALYTICS QUERIES (admin dashboard, not hot path)
  // ==========================================================================

  /**
   * Get aggregate statistics for a specific domain/category.
   *
   * Fetches all records for the category and computes percentiles,
   * averages, and confidence breakdowns in JS. Acceptable for admin-only
   * use since this is not on the scoring hot path.
   */
  async getDomainStats(categoryId: string): Promise<DomainStats> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('*')
        .eq('activity_category', categoryId)
        .order('scored_at', { ascending: false })
        .limit(1000);

      if (error || !data || data.length === 0) {
        return this.emptyDomainStats(categoryId);
      }

      const rows = data as unknown as ScoringTelemetryRow[];
      return this.computeDomainStats(categoryId, rows);
    } catch (error) {
      console.error('[ScoringTelemetry] getDomainStats failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.emptyDomainStats(categoryId);
    }
  }

  /**
   * Detect calibration drift for a category.
   *
   * Compares the average LLM adjustment delta in a recent time window
   * against the all-time baseline. Flags drift when:
   *   |currentAvgDelta - baselineAvgDelta| > 0.3  AND  sampleCount >= 20
   */
  async detectCalibrationDrift(categoryId: string, windowDays: number): Promise<DriftReport> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      // Fetch all records for this category (up to 2000 for baseline)
      const { data: allData, error: allError } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('llm_adjustment_trace, scored_at')
        .eq('activity_category', categoryId)
        .order('scored_at', { ascending: false })
        .limit(2000);

      if (allError || !allData || allData.length === 0) {
        return this.emptyDriftReport(categoryId, windowDays);
      }

      const rows = allData as unknown as Array<{
        llm_adjustment_trace: ScoringTelemetryRow['llm_adjustment_trace'];
        scored_at: string;
      }>;

      // Split into recent (within window) and all (baseline)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - windowDays);
      const cutoffIso = cutoffDate.toISOString();

      const recentRows = rows.filter((r) => r.scored_at >= cutoffIso);
      const allRows = rows;

      // Compute average deltas
      const baselineAvgDelta = this.computeAvgDelta(allRows);
      const currentAvgDelta = this.computeAvgDelta(recentRows);

      const driftMagnitude = Math.abs(currentAvgDelta - baselineAvgDelta);
      const isDrifting = driftMagnitude > DRIFT_THRESHOLD && recentRows.length >= DRIFT_MIN_SAMPLES;

      let recommendation: string;
      if (recentRows.length < DRIFT_MIN_SAMPLES) {
        recommendation = `Insufficient samples (${recentRows.length}/${DRIFT_MIN_SAMPLES}). Continue collecting data.`;
      } else if (!isDrifting) {
        recommendation = `No significant drift detected. Delta difference: ${driftMagnitude.toFixed(3)}.`;
      } else if (currentAvgDelta > baselineAvgDelta) {
        recommendation = `LLM adjustments trending HIGHER than baseline by ${driftMagnitude.toFixed(3)}. Review rule scorer — may be under-scoring.`;
      } else {
        recommendation = `LLM adjustments trending LOWER than baseline by ${driftMagnitude.toFixed(3)}. Review rule scorer — may be over-scoring.`;
      }

      return {
        categoryId,
        windowDays,
        currentAvgDelta: Math.round(currentAvgDelta * 1000) / 1000,
        baselineAvgDelta: Math.round(baselineAvgDelta * 1000) / 1000,
        driftMagnitude: Math.round(driftMagnitude * 1000) / 1000,
        isDrifting,
        sampleCount: recentRows.length,
        recommendation,
      };
    } catch (error) {
      console.error('[ScoringTelemetry] detectCalibrationDrift failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.emptyDriftReport(categoryId, windowDays);
    }
  }

  /**
   * Get coverage gaps across all categories.
   *
   * Groups telemetry by category and calculates:
   * - Low confidence rate (resolution confidence === 'low')
   * - Proxy usage rate (resolution method === 'proxy')
   * - Universal fallback rate (resolution method === 'universal')
   *
   * Priority: high if >25% universal, medium if >15% proxy, low otherwise.
   */
  async getCoverageGaps(): Promise<CoverageGapReport> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('activity_category, domain_resolution')
        .limit(5000);

      if (error || !data || data.length === 0) {
        return { gaps: [] };
      }

      const rows = data as unknown as Array<{
        activity_category: string;
        domain_resolution: ScoringTelemetryRow['domain_resolution'];
      }>;

      // Group by category
      const categoryMap = new Map<string, {
        total: number;
        lowConfidence: number;
        proxy: number;
        universal: number;
      }>();

      for (const row of rows) {
        const cat = row.activity_category;
        const existing = categoryMap.get(cat) ?? { total: 0, lowConfidence: 0, proxy: 0, universal: 0 };

        existing.total++;
        if (row.domain_resolution?.resolutionConfidence === 'low') {
          existing.lowConfidence++;
        }
        if (row.domain_resolution?.resolutionMethod === 'proxy') {
          existing.proxy++;
        }
        if (row.domain_resolution?.resolutionMethod === 'universal') {
          existing.universal++;
        }

        categoryMap.set(cat, existing);
      }

      // Build gap report
      const gaps: CoverageGapReport['gaps'] = [];
      const categoryIds = Array.from(categoryMap.keys());

      for (const categoryId of categoryIds) {
        const stats = categoryMap.get(categoryId)!;
        const lowConfidenceRate = stats.total > 0 ? stats.lowConfidence / stats.total : 0;
        const proxyUsageRate = stats.total > 0 ? stats.proxy / stats.total : 0;
        const universalFallbackRate = stats.total > 0 ? stats.universal / stats.total : 0;

        let priority: 'high' | 'medium' | 'low';
        if (universalFallbackRate > 0.25) {
          priority = 'high';
        } else if (proxyUsageRate > 0.15) {
          priority = 'medium';
        } else {
          priority = 'low';
        }

        gaps.push({
          categoryId,
          totalScorings: stats.total,
          lowConfidenceRate: Math.round(lowConfidenceRate * 1000) / 1000,
          proxyUsageRate: Math.round(proxyUsageRate * 1000) / 1000,
          universalFallbackRate: Math.round(universalFallbackRate * 1000) / 1000,
          priority,
        });
      }

      // Sort by priority (high > medium > low), then by totalScorings descending
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      gaps.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return b.totalScorings - a.totalScorings;
      });

      return { gaps };
    } catch (error) {
      console.error('[ScoringTelemetry] getCoverageGaps failed:', error instanceof Error ? error.message : 'Unknown error');
      return { gaps: [] };
    }
  }

  /**
   * Fetch recent telemetry records.
   * Useful for debugging and admin inspection.
   */
  async getRecentTelemetry(limit: number = 50): Promise<ScoringTelemetryRecord[]> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('*')
        .order('scored_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error('[ScoringTelemetry] getRecentTelemetry failed:', error?.message);
        return [];
      }

      const rows = data as unknown as ScoringTelemetryRow[];
      return rows.map((row) => this.rowToRecord(row));
    } catch (error) {
      console.error('[ScoringTelemetry] getRecentTelemetry failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // ==========================================================================
  // INTERNAL HELPERS
  // ==========================================================================

  /**
   * Validate a telemetry record before writing.
   * Rejects records with missing/invalid required fields.
   */
  private isValid(record: ScoringTelemetryRecord): boolean {
    if (!record.fingerprint || typeof record.fingerprint !== 'string' || record.fingerprint.length < 16) {
      return false;
    }
    if (!record.activityCategory || typeof record.activityCategory !== 'string') {
      return false;
    }
    if (!record.kbVersion || typeof record.kbVersion !== 'string') {
      return false;
    }
    if (!record.modelVersion || typeof record.modelVersion !== 'string') {
      return false;
    }
    if (!Number.isFinite(record.internalTier) || record.internalTier < 1 || record.internalTier > 6) {
      return false;
    }
    if (!Number.isFinite(record.finalScoreTotal) || record.finalScoreTotal < 0 || record.finalScoreTotal > 10) {
      return false;
    }
    if (!record.domainResolution) {
      return false;
    }
    if (!record.llmAdjustmentTrace) {
      return false;
    }
    if (!record.overallSignalStrength || !['strong', 'moderate', 'weak'].includes(record.overallSignalStrength)) {
      return false;
    }
    return true;
  }

  /**
   * Async write to Supabase. Called from record() in fire-and-forget mode.
   * Uses upsert on fingerprint — re-scoring overwrites previous telemetry.
   */
  private async writeAsync(record: ScoringTelemetryRecord): Promise<void> {
    const { supabaseAdmin } = await this.getSupabaseAdmin();

    const row = {
      fingerprint: record.fingerprint,
      activity_category: record.activityCategory,
      activity_title: record.activityTitle || null,
      scored_at: record.scoredAt || new Date().toISOString(),
      kb_version: record.kbVersion,
      model_version: record.modelVersion,
      internal_tier: record.internalTier,
      domain_resolution: record.domainResolution,
      rule_score_total: record.ruleScoreTotal,
      llm_adjustment_trace: record.llmAdjustmentTrace,
      final_score_total: record.finalScoreTotal,
      description_score_total: record.descriptionScoreTotal ?? null,
      expertise_confidence: record.expertiseConfidence ?? null,
      expertise_domain: record.expertiseDomain ?? null,
      overall_signal_strength: record.overallSignalStrength,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert(row, { onConflict: 'fingerprint' });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }

  /**
   * Lazily import the Supabase admin client.
   * Uses dynamic import to avoid loading Supabase at module init time.
   */
  private async getSupabaseAdmin(): Promise<{ supabaseAdmin: import('@supabase/supabase-js').SupabaseClient }> {
    const { supabaseAdmin } = await import('@/supabase/admin');
    return { supabaseAdmin };
  }

  /**
   * Convert a Supabase row to a ScoringTelemetryRecord.
   */
  private rowToRecord(row: ScoringTelemetryRow): ScoringTelemetryRecord {
    return {
      fingerprint: row.fingerprint,
      activityTitle: row.activity_title ?? '',
      activityCategory: row.activity_category,
      scoredAt: row.scored_at,
      kbVersion: row.kb_version,
      modelVersion: row.model_version,
      internalTier: row.internal_tier,
      domainResolution: row.domain_resolution,
      ruleScoreTotal: row.rule_score_total,
      llmAdjustmentTrace: row.llm_adjustment_trace,
      finalScoreTotal: row.final_score_total,
      descriptionScoreTotal: row.description_score_total ?? 0,
      expertiseConfidence: row.expertise_confidence ?? null,
      expertiseDomain: row.expertise_domain ?? null,
      overallSignalStrength: row.overall_signal_strength ?? 'weak',
    };
  }

  /**
   * Compute aggregate domain stats from a list of telemetry rows.
   */
  private computeDomainStats(categoryId: string, rows: ScoringTelemetryRow[]): DomainStats {
    const n = rows.length;
    if (n === 0) return this.emptyDomainStats(categoryId);

    // Extract score arrays
    const finalScores = rows.map((r) => r.final_score_total).sort((a, b) => a - b);
    const ruleScores = rows.map((r) => r.rule_score_total);
    const deltas = rows.map((r) => r.llm_adjustment_trace?.delta ?? 0);

    // Confidence breakdown
    const confidenceBreakdown = { high: 0, medium: 0, low: 0 };
    let proxyCount = 0;
    let universalCount = 0;

    for (const row of rows) {
      const conf = row.domain_resolution?.resolutionConfidence;
      if (conf === 'high') confidenceBreakdown.high++;
      else if (conf === 'medium') confidenceBreakdown.medium++;
      else confidenceBreakdown.low++;

      const method = row.domain_resolution?.resolutionMethod;
      if (method === 'proxy') proxyCount++;
      if (method === 'universal') universalCount++;
    }

    return {
      categoryId,
      sampleCount: n,
      scoreDistribution: {
        p10: this.percentile(finalScores, 10),
        p25: this.percentile(finalScores, 25),
        p50: this.percentile(finalScores, 50),
        p75: this.percentile(finalScores, 75),
        p90: this.percentile(finalScores, 90),
      },
      avgLLMDelta: Math.round((deltas.reduce((s, d) => s + d, 0) / n) * 1000) / 1000,
      avgRuleScore: Math.round((ruleScores.reduce((s, d) => s + d, 0) / n) * 1000) / 1000,
      avgFinalScore: Math.round((finalScores.reduce((s, d) => s + d, 0) / n) * 1000) / 1000,
      confidenceBreakdown,
      proxyUsageRate: Math.round((proxyCount / n) * 1000) / 1000,
      universalFallbackRate: Math.round((universalCount / n) * 1000) / 1000,
    };
  }

  /**
   * Compute a percentile from a sorted array.
   * Uses nearest-rank method.
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)] * 100) / 100;
  }

  /**
   * Compute average LLM delta from rows with llm_adjustment_trace.
   */
  private computeAvgDelta(rows: Array<{ llm_adjustment_trace: ScoringTelemetryRow['llm_adjustment_trace'] }>): number {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + (r.llm_adjustment_trace?.delta ?? 0), 0);
    return sum / rows.length;
  }

  /**
   * Return empty domain stats for error/empty cases.
   */
  private emptyDomainStats(categoryId: string): DomainStats {
    return {
      categoryId,
      sampleCount: 0,
      scoreDistribution: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
      avgLLMDelta: 0,
      avgRuleScore: 0,
      avgFinalScore: 0,
      confidenceBreakdown: { high: 0, medium: 0, low: 0 },
      proxyUsageRate: 0,
      universalFallbackRate: 0,
    };
  }

  /**
   * Return empty drift report for error/empty cases.
   */
  private emptyDriftReport(categoryId: string, windowDays: number): DriftReport {
    return {
      categoryId,
      windowDays,
      currentAvgDelta: 0,
      baselineAvgDelta: 0,
      driftMagnitude: 0,
      isDrifting: false,
      sampleCount: 0,
      recommendation: 'No telemetry data available for this category.',
    };
  }
}

// Export singleton instance
export const scoringTelemetryService = new ScoringTelemetryService();
