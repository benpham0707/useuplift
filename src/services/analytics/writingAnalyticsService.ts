/**
 * Writing Analytics Service
 *
 * Tracks writing improvement events (suggestions shown/accepted/rejected,
 * score changes, inline edits) and provides aggregation queries.
 *
 * All tracking is fire-and-forget with < 50ms overhead — never blocks
 * the primary request flow.
 */

import { supabaseAdmin } from '@/supabase/admin';
import { randomUUID } from 'crypto';
import type {
  WritingAnalyticsEvent,
  PromptEffectiveness,
  SuggestionData,
  DateRange,
} from './types';
import type { EditingCommand } from '../inlineEditor/types';

// ============================================================================
// TYPES (internal)
// ============================================================================

interface CommandUsageRow {
  command: string;
  count: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class WritingAnalyticsService {

  // ==========================================================================
  // EVENT TRACKING (fire-and-forget, < 50ms)
  // ==========================================================================

  /**
   * Track that a suggestion was shown to the user.
   */
  async trackSuggestionShown(
    userId: string,
    sessionId: string,
    suggestion: SuggestionData
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'suggestion_shown',
      eventData: {
        suggestionId: suggestion.suggestionId,
        workshop: suggestion.workshop,
        dimension: suggestion.dimension,
        promptHash: suggestion.promptHash,
        textLength: suggestion.generatedText.length,
      },
    });
  }

  /**
   * Track that a suggestion was accepted by the user.
   */
  async trackSuggestionAccepted(
    userId: string,
    sessionId: string,
    suggestionId: string,
    workshop?: string
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'suggestion_accepted',
      eventData: { suggestionId, workshop },
    });
  }

  /**
   * Track that a suggestion was rejected by the user.
   */
  async trackSuggestionRejected(
    userId: string,
    sessionId: string,
    suggestionId: string,
    workshop?: string
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'suggestion_rejected',
      eventData: { suggestionId, workshop },
    });
  }

  /**
   * Track a score change event (before/after analysis comparison).
   */
  async trackScoreChange(
    userId: string,
    sessionId: string,
    data: {
      before: number;
      after: number;
      dimension?: string;
      workshop?: string;
    }
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'score_change',
      eventData: {
        before: data.before,
        after: data.after,
        delta: data.after - data.before,
        dimension: data.dimension,
        workshop: data.workshop,
      },
    });
  }

  /**
   * Track an inline edit event.
   */
  async trackInlineEdit(
    userId: string,
    sessionId: string,
    data: {
      command: EditingCommand;
      accepted: boolean;
      cost?: number;
      alternative?: 'primary' | 'creative';
    }
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'inline_edit',
      eventData: {
        command: data.command,
        accepted: data.accepted,
        cost: data.cost,
        alternative: data.alternative,
      },
    });
  }

  /**
   * Track a generic command usage event.
   */
  async trackCommandUsed(
    userId: string,
    sessionId: string,
    command: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'command_used',
      eventData: { command, ...metadata },
    });
  }

  /**
   * Track a computational pre-analysis run.
   * Called by WritingPreAnalyzer when enrichment is computed.
   */
  async trackAnalysisRun(
    userId: string,
    sessionId: string,
    data: {
      essayId?: string;
      workshopType: 'common_app' | 'piq' | 'activity';
      preAnalysisMs: number;
      enrichmentTokens: number;
      constraintViolationsFound?: number;
      featureEnabled: boolean;
    }
  ): Promise<void> {
    await this.insertEvent({
      userId,
      sessionId,
      eventType: 'pre_analysis_run',
      eventData: {
        essayId: data.essayId,
        workshopType: data.workshopType,
        preAnalysisMs: data.preAnalysisMs,
        enrichmentTokens: data.enrichmentTokens,
        constraintViolationsFound: data.constraintViolationsFound,
        featureEnabled: data.featureEnabled,
      },
    });
  }

  // ==========================================================================
  // AGGREGATION QUERIES
  // ==========================================================================

  /**
   * Get suggestion acceptance rate for a workshop within a time range.
   */
  async getAcceptanceRate(
    workshop?: string,
    timeRange?: DateRange
  ): Promise<{ shown: number; accepted: number; rejected: number; rate: number }> {
    try {
      let shownQuery = supabaseAdmin
        .from('writing_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'suggestion_shown');

      let acceptedQuery = supabaseAdmin
        .from('writing_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'suggestion_accepted');

      let rejectedQuery = supabaseAdmin
        .from('writing_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'suggestion_rejected');

      if (workshop) {
        shownQuery = shownQuery.contains('event_data', { workshop });
        acceptedQuery = acceptedQuery.contains('event_data', { workshop });
        rejectedQuery = rejectedQuery.contains('event_data', { workshop });
      }

      if (timeRange) {
        shownQuery = shownQuery.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
        acceptedQuery = acceptedQuery.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
        rejectedQuery = rejectedQuery.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
      }

      const [shownResult, acceptedResult, rejectedResult] = await Promise.all([
        shownQuery,
        acceptedQuery,
        rejectedQuery,
      ]);

      const shown = shownResult.count ?? 0;
      const accepted = acceptedResult.count ?? 0;
      const rejected = rejectedResult.count ?? 0;
      const rate = shown > 0 ? accepted / shown : 0;

      return { shown, accepted, rejected, rate };
    } catch (error) {
      console.error('[WritingAnalytics] getAcceptanceRate failed:', error);
      return { shown: 0, accepted: 0, rejected: 0, rate: 0 };
    }
  }

  /**
   * Get most-used inline editing commands, ranked by frequency.
   */
  async getMostUsedCommands(
    timeRange?: DateRange,
    limit: number = 10
  ): Promise<CommandUsageRow[]> {
    try {
      let query = supabaseAdmin
        .from('writing_analytics')
        .select('event_data')
        .eq('event_type', 'inline_edit');

      if (timeRange) {
        query = query.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      // Aggregate command counts in-memory (lightweight for expected data volumes)
      const counts = new Map<string, number>();
      for (const row of data) {
        const cmd = (row.event_data as Record<string, unknown>)?.command as string;
        if (cmd) {
          counts.set(cmd, (counts.get(cmd) ?? 0) + 1);
        }
      }

      return Array.from(counts.entries())
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('[WritingAnalytics] getMostUsedCommands failed:', error);
      return [];
    }
  }

  /**
   * Get average score improvement across all score_change events.
   */
  async getAverageScoreImprovement(
    workshop?: string,
    timeRange?: DateRange
  ): Promise<{ averageDelta: number; totalEvents: number }> {
    try {
      let query = supabaseAdmin
        .from('writing_analytics')
        .select('event_data')
        .eq('event_type', 'score_change');

      if (workshop) {
        query = query.contains('event_data', { workshop });
      }

      if (timeRange) {
        query = query.gte('created_at', timeRange.start).lte('created_at', timeRange.end);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return { averageDelta: 0, totalEvents: 0 };
      }

      let totalDelta = 0;
      let count = 0;
      for (const row of data) {
        const delta = (row.event_data as Record<string, unknown>)?.delta;
        if (typeof delta === 'number') {
          totalDelta += delta;
          count++;
        }
      }

      return {
        averageDelta: count > 0 ? totalDelta / count : 0,
        totalEvents: count,
      };
    } catch (error) {
      console.error('[WritingAnalytics] getAverageScoreImprovement failed:', error);
      return { averageDelta: 0, totalEvents: 0 };
    }
  }

  /**
   * Get analytics summary for a specific user.
   */
  async getUserSummary(userId: string): Promise<{
    totalEvents: number;
    inlineEditsUsed: number;
    suggestionsAccepted: number;
    suggestionsRejected: number;
    averageScoreChange: number;
    topCommands: CommandUsageRow[];
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('writing_analytics')
        .select('event_type, event_data')
        .eq('user_id', userId);

      if (error || !data) {
        return {
          totalEvents: 0,
          inlineEditsUsed: 0,
          suggestionsAccepted: 0,
          suggestionsRejected: 0,
          averageScoreChange: 0,
          topCommands: [],
        };
      }

      let inlineEdits = 0;
      let accepted = 0;
      let rejected = 0;
      let scoreDeltas: number[] = [];
      const commandCounts = new Map<string, number>();

      for (const row of data) {
        const eventData = row.event_data as Record<string, unknown>;
        switch (row.event_type) {
          case 'inline_edit':
            inlineEdits++;
            if (eventData.command) {
              const cmd = eventData.command as string;
              commandCounts.set(cmd, (commandCounts.get(cmd) ?? 0) + 1);
            }
            break;
          case 'suggestion_accepted':
            accepted++;
            break;
          case 'suggestion_rejected':
            rejected++;
            break;
          case 'score_change':
            if (typeof eventData.delta === 'number') {
              scoreDeltas.push(eventData.delta as number);
            }
            break;
        }
      }

      const topCommands = Array.from(commandCounts.entries())
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalEvents: data.length,
        inlineEditsUsed: inlineEdits,
        suggestionsAccepted: accepted,
        suggestionsRejected: rejected,
        averageScoreChange: scoreDeltas.length > 0
          ? scoreDeltas.reduce((a, b) => a + b, 0) / scoreDeltas.length
          : 0,
        topCommands,
      };
    } catch (error) {
      console.error('[WritingAnalytics] getUserSummary failed:', error);
      return {
        totalEvents: 0,
        inlineEditsUsed: 0,
        suggestionsAccepted: 0,
        suggestionsRejected: 0,
        averageScoreChange: 0,
        topCommands: [],
      };
    }
  }

  /**
   * Get prompt effectiveness data for a specific prompt hash.
   */
  async getPromptEffectiveness(promptHash: string): Promise<PromptEffectiveness | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('prompt_effectiveness')
        .select('*')
        .eq('prompt_hash', promptHash)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        promptHash: data.prompt_hash,
        promptType: data.prompt_type,
        workshop: data.workshop,
        totalShown: data.total_shown,
        totalAccepted: data.total_accepted,
        avgScoreImprovement: data.avg_score_improvement,
        avgSatisfaction: data.avg_satisfaction,
        lastUpdated: data.last_updated,
      };
    } catch (error) {
      console.error('[WritingAnalytics] getPromptEffectiveness failed:', error);
      return null;
    }
  }

  /**
   * Update prompt effectiveness aggregation (call after tracking events).
   */
  async updatePromptEffectiveness(
    promptHash: string,
    promptType: string,
    workshop: string,
    accepted: boolean,
    scoreImprovement?: number
  ): Promise<void> {
    try {
      const existing = await this.getPromptEffectiveness(promptHash);

      if (existing) {
        const newShown = existing.totalShown + 1;
        const newAccepted = existing.totalAccepted + (accepted ? 1 : 0);
        const newAvgScore = scoreImprovement !== undefined
          ? (existing.avgScoreImprovement * existing.totalShown + scoreImprovement) / newShown
          : existing.avgScoreImprovement;

        await supabaseAdmin
          .from('prompt_effectiveness')
          .update({
            total_shown: newShown,
            total_accepted: newAccepted,
            avg_score_improvement: newAvgScore,
            last_updated: new Date().toISOString(),
          })
          .eq('prompt_hash', promptHash);
      } else {
        await supabaseAdmin
          .from('prompt_effectiveness')
          .insert({
            id: randomUUID(),
            prompt_hash: promptHash,
            prompt_type: promptType,
            workshop,
            total_shown: 1,
            total_accepted: accepted ? 1 : 0,
            avg_score_improvement: scoreImprovement ?? 0,
            avg_satisfaction: 0,
            last_updated: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('[WritingAnalytics] updatePromptEffectiveness failed:', error);
    }
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  /**
   * Insert an analytics event. Fire-and-forget — errors are logged, never thrown.
   */
  private async insertEvent(event: {
    userId: string;
    sessionId: string;
    eventType: string;
    eventData: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('writing_analytics')
        .insert({
          id: randomUUID(),
          user_id: event.userId,
          session_id: event.sessionId,
          event_type: event.eventType,
          event_data: event.eventData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[WritingAnalytics] Insert failed:', error.message);
      }
    } catch (error) {
      console.error('[WritingAnalytics] Insert error:', error instanceof Error ? error.message : error);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const writingAnalyticsService = new WritingAnalyticsService();
