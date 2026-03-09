/**
 * Essay Understanding Service — CRUD for EssayUnderstanding (EUP)
 *
 * Manages the lifecycle of an essay's hierarchical understanding:
 *   buildInitial → Layer 1 deterministic analysis (features, narrative, paragraphs, sentences)
 *   load/save    → Supabase persistence (fire-and-forget writes)
 *   addConversationInsight → Enriches EUP at correct hierarchy level
 *   applyStaleness → Marks changed paragraphs/sentences stale after text edits
 *
 * Implements IEssayUnderstandingService from types.ts.
 */

import { randomUUID } from 'crypto';
import { splitParagraphs } from '../../workshop/scoring/featureExtractor';
import { featureExtractor } from '../../workshop/scoring/featureExtractor';
import { runNarrativeAnalysis } from '../../workshop/scoring/narrativeAnalyzers';
import { classifyParagraphFunctions } from '../../workshop/scoring/paragraphFunctionClassifier';
import { sentenceAnalyzer } from './sentenceAnalyzer';
import { diffEngine } from './diffEngine';

import type {
  IEssayUnderstandingService,
  AnalysisInput,
  EssayUnderstanding,
  ParagraphUnderstanding,
  ConversationInsight,
  DiffResult,
} from './types';
import type { ParagraphFunctionAnalysis } from '../../workshop/scoring/narrativeAnalyzerTypes';

// ============================================================================
// LAZY SUPABASE IMPORT (avoids circular deps at module load time)
// ============================================================================

let _supabaseAdmin: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

async function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const mod = await import('@/supabase/admin');
    _supabaseAdmin = mod.supabaseAdmin;
  }
  return _supabaseAdmin;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Determine paragraph specificity score from narrative analysis.
 */
function getSpecificityScore(
  narrativeResult: ReturnType<typeof runNarrativeAnalysis>,
  index: number,
): number {
  const paraScore = narrativeResult.specificity.paragraphScores.find(p => p.index === index);
  return paraScore?.score ?? 50;
}

/**
 * Map scene/summary classification from narrative analysis.
 */
function getSceneOrSummary(
  narrativeResult: ReturnType<typeof runNarrativeAnalysis>,
  index: number,
): 'scene' | 'summary' | 'mixed' {
  const para = narrativeResult.sceneVsSummary.paragraphs.find(p => p.index === index);
  return para?.classification ?? 'mixed';
}

// ============================================================================
// SERVICE
// ============================================================================

class EssayUnderstandingService implements IEssayUnderstandingService {
  /**
   * Create initial understanding with Layer 1 deterministic analysis.
   *
   * Runs: featureExtractor.extract(), runNarrativeAnalysis(),
   * classifyParagraphFunctions(), sentenceAnalyzer per paragraph,
   * then builds paragraph/sentence hierarchy.
   */
  async buildInitial(input: AnalysisInput): Promise<EssayUnderstanding> {
    const { essayId, userId, text, essayType, voiceProfile } = input;
    const now = new Date().toISOString();

    // Layer 1: Deterministic analysis
    const features = featureExtractor.extract(text);
    const narrativeAnalysis = runNarrativeAnalysis(text, features);
    const paragraphFunctions = classifyParagraphFunctions(text);

    // Split text into paragraphs and build hierarchy
    const paragraphTexts = splitParagraphs(text);
    const paragraphs = this.buildParagraphHierarchy(
      paragraphTexts,
      paragraphFunctions,
      narrativeAnalysis,
    );

    const understanding: EssayUnderstanding = {
      id: randomUUID(),
      essayId,
      userId,
      version: 1,
      essayType,
      textHash: diffEngine.hashText(text),
      createdAt: now,
      updatedAt: now,

      // Layer 1
      features,
      narrativeAnalysis,

      // Layers 2-5 populated by later passes
      structuralCartography: null,
      finalUnderstanding: null,
      essayDNA: null,
      paragraphScoreMatrix: null,
      annotations: [],

      // Paragraph hierarchy with Layer 1 data
      paragraphs,

      // Layer 6
      conversationInsights: [],

      voiceProfileSnapshot: voiceProfile ?? null,

      analysisPasses: [{
        id: randomUUID(),
        timestamp: now,
        layers: ['deterministic'],
        trigger: 'initial',
        editedParagraphIndex: null,
        paragraphsRewalked: 0,
        costUSD: 0,
        timingMs: {},
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
      }],

      totalCostUSD: 0,
    };

    return understanding;
  }

  /**
   * Load existing understanding from Supabase.
   * Reconstitutes from stored JSONB.
   */
  async load(essayId: string, userId: string): Promise<EssayUnderstanding | null> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from('essay_understanding')
        .select('*')
        .eq('essay_id', essayId)
        .eq('user_id', userId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      // Reconstitute from stored JSONB
      const understanding = data.understanding_json as unknown as EssayUnderstanding;
      understanding.id = data.id;
      understanding.essayId = data.essay_id;
      understanding.userId = data.user_id;
      understanding.version = data.version;

      return understanding;
    } catch (err) {
      console.error(
        '[EssayUnderstandingService] Failed to load:',
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  /**
   * Save understanding to Supabase (upsert).
   * Extracts top-level fields (eqi, impression_label, readiness_level)
   * for query-able columns.
   */
  async save(understanding: EssayUnderstanding): Promise<void> {
    understanding.updatedAt = new Date().toISOString();

    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('essay_understanding')
      .upsert(
        {
          id: understanding.id,
          essay_id: understanding.essayId,
          user_id: understanding.userId,
          version: understanding.version,
          text_hash: understanding.textHash,
          eqi: understanding.essayDNA?.overallEQI ?? null,
          impression_label: understanding.essayDNA?.impressionLabel ?? null,
          readiness_level: understanding.essayDNA?.readinessLevel ?? null,
          understanding_json: understanding as unknown as Record<string, unknown>,
          updated_at: understanding.updatedAt,
        },
        { onConflict: 'id' },
      );

    if (error) {
      console.error(
        '[EssayUnderstandingService] Supabase upsert failed:',
        error.message,
      );
    }
  }

  /**
   * Add a conversation insight at the correct hierarchy level.
   * Returns a new EssayUnderstanding (immutable update).
   */
  addConversationInsight(
    understanding: EssayUnderstanding,
    level: 'essay' | 'paragraph' | 'sentence',
    index: number | null,
    sentenceIndex: number | null,
    insight: ConversationInsight,
  ): EssayUnderstanding {
    const updated = structuredClone(understanding);

    switch (level) {
      case 'essay':
        updated.conversationInsights.push(insight);
        break;

      case 'paragraph': {
        if (index === null || index < 0 || index >= updated.paragraphs.length) {
          console.warn(
            `[EssayUnderstandingService] Invalid paragraph index: ${index}`,
          );
          updated.conversationInsights.push(insight);
          break;
        }
        const para = updated.paragraphs[index];

        // Handle supersedes: remove the old insight if present
        if (insight.supersedes) {
          para.conversationInsights = para.conversationInsights.filter(
            ci => ci.id !== insight.supersedes,
          );
        }
        para.conversationInsights.push(insight);
        break;
      }

      case 'sentence': {
        if (index === null || index < 0 || index >= updated.paragraphs.length) {
          console.warn(
            `[EssayUnderstandingService] Invalid paragraph index for sentence insight: ${index}`,
          );
          updated.conversationInsights.push(insight);
          break;
        }
        const targetPara = updated.paragraphs[index];
        if (
          sentenceIndex === null ||
          sentenceIndex < 0 ||
          sentenceIndex >= targetPara.sentences.length
        ) {
          console.warn(
            `[EssayUnderstandingService] Invalid sentence index: ${sentenceIndex}`,
          );
          targetPara.conversationInsights.push(insight);
          break;
        }
        const sentence = targetPara.sentences[sentenceIndex];

        if (insight.supersedes) {
          sentence.conversationInsights = sentence.conversationInsights.filter(
            ci => ci.id !== insight.supersedes,
          );
        }
        sentence.conversationInsights.push(insight);
        break;
      }
    }

    return updated;
  }

  /**
   * Mark paragraphs and their sentences as stale based on DiffResult.
   * Returns a new EssayUnderstanding (immutable update).
   */
  applyStaleness(
    understanding: EssayUnderstanding,
    diff: DiffResult,
  ): EssayUnderstanding {
    if (!diff.hasChanges) return understanding;

    const updated = structuredClone(understanding);

    // Mark changed paragraphs as stale
    for (const changedIdx of diff.changedParagraphs) {
      if (changedIdx < updated.paragraphs.length) {
        updated.paragraphs[changedIdx].stale = true;
        for (const sentence of updated.paragraphs[changedIdx].sentences) {
          sentence.stale = true;
        }
      }
    }

    // If structural change, mark all paragraphs from firstChangedIndex onward as stale
    if (diff.structuralChange && diff.firstChangedIndex !== null) {
      for (let i = diff.firstChangedIndex; i < updated.paragraphs.length; i++) {
        updated.paragraphs[i].stale = true;
        for (const sentence of updated.paragraphs[i].sentences) {
          sentence.stale = true;
        }
      }
    }

    return updated;
  }

  // ==========================================================================
  // PRIVATE — Hierarchy builders
  // ==========================================================================

  /**
   * Build the paragraph -> sentence hierarchy from raw text + Layer 1 analysis.
   */
  private buildParagraphHierarchy(
    paragraphTexts: string[],
    paragraphFunctions: ParagraphFunctionAnalysis[],
    narrativeResult: ReturnType<typeof runNarrativeAnalysis>,
  ): ParagraphUnderstanding[] {
    return paragraphTexts.map((paraText, index) => {
      // Delegate sentence analysis to the dedicated sentenceAnalyzer
      const sentences = sentenceAnalyzer.analyzeParagraphSentences(paraText);

      const funcAnalysis = paragraphFunctions.find(pf => pf.index === index) ?? null;

      return {
        index,
        text: paraText,
        textHash: diffEngine.hashText(paraText),
        stale: false,

        functionAnalysis: funcAnalysis,
        specificityScore: getSpecificityScore(narrativeResult, index),
        sceneOrSummary: getSceneOrSummary(narrativeResult, index),

        // Layers 2-3 populated later
        structuralRole: null,
        deepAnalysis: null,
        runningUnderstandingSnapshot: null,

        // Layer 5
        annotations: [],

        // Sentences
        sentences,

        // Layer 6
        conversationInsights: [],
        studentIntent: null,
      };
    });
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const essayUnderstandingService = new EssayUnderstandingService();
export { EssayUnderstandingService };
