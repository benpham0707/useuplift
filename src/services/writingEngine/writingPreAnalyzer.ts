/**
 * Writing Pre-Analyzer
 *
 * Thin orchestrator that runs proven computational modules to produce
 * a PreAnalysisResult for essay text. Zero LLM calls, <30ms.
 *
 * Modules used:
 * - Register Analyzer: per-sentence formality, register shifts
 * - Information-Theoretic Analyzer: compression ratio, NCD
 * - AI Detector: 5 proven statistical signals
 * - Text Utils: word count, sentence count, vocabulary richness
 *
 * Feature flag: if ENABLE_COMPUTATIONAL_ENRICHMENT is false, returns null
 * and workshops proceed unchanged.
 */

import { analyzeRegister } from '../stylometrics/registerAnalyzer';
import { detectAIWriting } from '../stylometrics/aiDetector';
import { tokenize, splitSentences } from '../stylometrics/textUtils';
import { informationTheoreticAnalyzer } from '../../core/analysis/features/informationTheoreticAnalyzer';
import type {
  PreAnalysisResult,
  RegisterProfile,
  CompressionStats,
  AIDetectionFlags,
  TextStats,
  WritingEngineConfig,
} from './types';
import { DEFAULT_WRITING_ENGINE_CONFIG } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

function isEnabled(): boolean {
  const envFlag = process.env.ENABLE_COMPUTATIONAL_ENRICHMENT;
  if (envFlag === 'false' || envFlag === '0') return false;
  return DEFAULT_WRITING_ENGINE_CONFIG.enabled;
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================

export class WritingPreAnalyzer {
  /**
   * Analyze essay text using proven computational modules.
   *
   * @param text - Raw essay/description text
   * @returns PreAnalysisResult or null if feature is disabled
   */
  analyze(text: string): PreAnalysisResult | null {
    if (!isEnabled()) return null;

    const startTime = performance.now();

    // Guard: skip for very short text
    if (!text || text.trim().length < 20) {
      return this.createMinimalResult(text, startTime);
    }

    // Run register analysis
    const registerResult = analyzeRegister(text);
    const register: RegisterProfile = {
      primaryRegister: registerResult.primaryRegister,
      formalityScore: registerResult.formalityScore,
      internalConsistency: registerResult.internalConsistency,
      registerShifts: registerResult.registerShifts.map(s => ({
        sentenceIndex: s.sentenceIndex,
        from: s.from,
        to: s.to,
        severity: s.severity,
      })),
    };

    // Run compression analysis (only compression portion, skip full analysis for speed)
    let compression: CompressionStats;
    try {
      const itResult = informationTheoreticAnalyzer.analyze(text);
      compression = {
        overallRatio: itResult.compression.overallRatio,
        uniquenessScore: itResult.compression.uniquenessScore,
      };
    } catch {
      compression = { overallRatio: 0.5, uniquenessScore: 5 };
    }

    // Run AI detection
    const aiResult = detectAIWriting(text);
    const aiDetection: AIDetectionFlags = {
      aiProbability: aiResult.aiProbability,
      confidence: aiResult.confidence,
      riskLevel: classifyAIRisk(aiResult.aiProbability, aiResult.confidence),
      dominantSignals: aiResult.dominantSignals,
      signalSummary: {
        burstiness: aiResult.signals.burstiness.score,
        sentenceLengthVariance: aiResult.signals.sentenceLengthVariance.score,
        vocabularyUniformity: aiResult.signals.vocabularyUniformity.score,
        functionWordAnomaly: aiResult.signals.functionWordAnomaly.score,
        repetitionRegularity: aiResult.signals.repetitionRegularity.score,
      },
    };

    // Compute text stats
    const textStats = computeTextStats(text);

    const computeTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      register,
      compression,
      aiDetection,
      textStats,
      computeTimeMs,
    };
  }

  /**
   * Create a minimal result for very short text.
   */
  private createMinimalResult(text: string, startTime: number): PreAnalysisResult {
    const words = text ? tokenize(text) : [];
    const sentences = text ? splitSentences(text) : [];
    return {
      register: {
        primaryRegister: 'conversational',
        formalityScore: 0.5,
        internalConsistency: 1,
        registerShifts: [],
      },
      compression: { overallRatio: 0.5, uniquenessScore: 5 },
      aiDetection: {
        aiProbability: 0.5,
        confidence: 0.2,
        riskLevel: 'LOW',
        dominantSignals: ['Insufficient text for reliable assessment'],
        signalSummary: {
          burstiness: 0.5,
          sentenceLengthVariance: 0.5,
          vocabularyUniformity: 0.5,
          functionWordAnomaly: 0.5,
          repetitionRegularity: 0.5,
        },
      },
      textStats: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
        vocabularyRichness: words.length > 0 ? new Set(words).size / words.length : 0,
      },
      computeTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function classifyAIRisk(probability: number, confidence: number): 'LOW' | 'MODERATE' | 'HIGH' {
  if (confidence < 0.4) return 'LOW'; // Not enough data for reliable detection
  if (probability >= 0.7) return 'HIGH';
  if (probability >= 0.45) return 'MODERATE';
  return 'LOW';
}

function computeTextStats(text: string): TextStats {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const uniqueWords = new Set(words);

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0
      ? Math.round((words.length / sentences.length) * 10) / 10
      : 0,
    vocabularyRichness: words.length > 0
      ? Math.round((uniqueWords.size / words.length) * 100) / 100
      : 0,
  };
}

// ============================================================================
// SINGLETON
// ============================================================================

export const writingPreAnalyzer = new WritingPreAnalyzer();
