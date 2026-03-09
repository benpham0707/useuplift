/**
 * Hybrid Scoring Pipeline — Orchestrates the full scoring flow
 *
 * Pipeline: Extract → Heuristic → Selective LLM → Fuse → EQI
 *
 * Smart cost allocation: LLM tokens are spent only where heuristics
 * are uncertain. Typical cost: $0.012-$0.022 per essay.
 */

import type {
  ExtractedFeatures,
  FinalDimensionScore,
  ScoringResult,
  HybridScoringConfig,
  WorkshopEssayType,
  HeuristicResult,
} from '../shared/types';
import { DEFAULT_SCORING_CONFIG } from '../shared/types';
import { dimensionRegistry } from '../registry/dimensionRegistry';
import { featureExtractor } from './featureExtractor';
import { eqiCalculator } from './eqiCalculator';
import { llmScoringService } from './llmScoringService';
import { validatePreAnalysis } from './preAnalysisValidator';
import { classifyParagraphFunctions } from './paragraphFunctionClassifier';
import { simpleHash } from './narrativeLLMTypes';

// ============================================================================
// PIPELINE
// ============================================================================

class HybridScoringPipeline {
  /**
   * Score an essay through the full hybrid pipeline.
   *
   * @param text - Full essay text
   * @param config - Pipeline configuration (optional)
   * @returns Complete scoring result with all dimensions, EQI, costs, and timing
   */
  async score(
    text: string,
    config: Partial<HybridScoringConfig> = {}
  ): Promise<ScoringResult> {
    const cfg = { ...DEFAULT_SCORING_CONFIG, ...config };
    const totalStart = Date.now();

    // Step 1: Feature extraction (deterministic, ~50ms)
    const extractStart = Date.now();
    const features = this.prepareFeatures(text, cfg.essayType);
    const extractTime = Date.now() - extractStart;

    // Essay hash — stable key for caching LLM insights across pipeline stages
    const essayHash = simpleHash(text);

    // Step 2: Heuristic pre-score all dimensions (deterministic, ~10ms each)
    const heuristicStart = Date.now();
    const dimensions = dimensionRegistry.getAll();

    if (dimensions.length === 0) {
      throw new Error('[HybridScoringPipeline] No dimensions registered. Did you import the dimension files?');
    }

    const heuristicResults = new Map<string, HeuristicResult>();
    for (const dim of dimensions) {
      heuristicResults.set(dim.id, dim.heuristicScore(features));
    }
    const heuristicTime = Date.now() - heuristicStart;

    // Step 3: Selective LLM scoring (only when confidence < threshold)
    const llmStart = Date.now();
    let llmCallCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Step 2.5: Pre-analysis for haiku+sonnet dimensions (Haiku reads essay first)
    let enrichedFeatures = features;
    const preAnalysisCalls: Array<{ dimId: string; input: { tier: 'haiku' | 'sonnet'; systemPrompt: string; userPrompt: string } }> = [];

    for (const dim of dimensions) {
      if (dim.scoringTier === 'haiku+sonnet' && dim.buildPreAnalysisPrompt) {
        const heuristic = heuristicResults.get(dim.id)!;
        if (dim.shouldTriggerLLM(heuristic)) {
          preAnalysisCalls.push({
            dimId: dim.id,
            input: {
              tier: 'haiku',
              systemPrompt: dim.preAnalysisSystemPrompt
                ?? 'You are a skilled reader of college application essays. Produce structured reading analysis.',
              userPrompt: dim.buildPreAnalysisPrompt(text, features),
            },
          });
        }
      }
    }

    if (preAnalysisCalls.length > 0) {
      const preResults = await llmScoringService.batchCall(preAnalysisCalls.map(c => c.input));
      const preAnalysis: Record<string, string> = {};
      preAnalysisCalls.forEach((call, i) => {
        if (preResults[i]) {
          totalInputTokens += preResults[i].tokenUsage.inputTokens;
          totalOutputTokens += preResults[i].tokenUsage.outputTokens;
          llmCallCount++;

          // Validate and reformat Haiku's JSON into clean text for Sonnet
          const validation = validatePreAnalysis(
            preResults[i].raw,
            call.dimId,
            features.paragraphCount
          );

          if (validation.valid) {
            preAnalysis[call.dimId] = validation.formatted;
          } else {
            // Invalid output — Sonnet will see "No pre-analysis available" fallback
            console.warn(
              `[HybridScoringPipeline] Pre-analysis validation failed for ${call.dimId}:`,
              validation.warnings
            );
          }

          if (validation.warnings.length > 0) {
            console.warn(
              `[HybridScoringPipeline] Pre-analysis warnings for ${call.dimId}:`,
              validation.warnings
            );
          }
        }
      });
      enrichedFeatures = { ...features, _preAnalysis: preAnalysis };
    }

    // Step 3 continued: Main LLM calls
    const llmCalls: Array<{
      dimId: string;
      tier: 'haiku' | 'sonnet';
      systemPrompt: string;
      userPrompt: string;
    }> = [];

    for (const dim of dimensions) {
      const heuristic = heuristicResults.get(dim.id)!;
      if (dim.shouldTriggerLLM(heuristic)) {
        const prompt = dim.buildLLMPrompt(text, enrichedFeatures);
        const tier: 'haiku' | 'sonnet' =
          dim.scoringTier === 'heuristic+sonnet' || dim.scoringTier === 'haiku+sonnet'
            ? 'sonnet' : 'haiku';
        llmCalls.push({
          dimId: dim.id,
          tier,
          systemPrompt: dim.systemPrompt
            ?? 'You are an expert essay evaluator. Score precisely and provide evidence.',
          userPrompt: prompt,
        });
      }
    }

    // Execute LLM calls with concurrency limit
    const llmResultMap = new Map<string, ReturnType<typeof dimensions[0]['parseLLMResponse']>>();

    if (llmCalls.length > 0) {
      const batchInputs = llmCalls.map(c => ({
        tier: c.tier,
        systemPrompt: c.systemPrompt,
        userPrompt: c.userPrompt,
      }));

      const batchResults = await llmScoringService.batchCall(batchInputs);

      for (let i = 0; i < llmCalls.length; i++) {
        const call = llmCalls[i];
        const result = batchResults[i];
        const dim = dimensions.find(d => d.id === call.dimId);
        if (dim && result) {
          const parsed = dim.parseLLMResponse(result.raw, essayHash);
          parsed.tokenUsage = result.tokenUsage;
          llmResultMap.set(call.dimId, parsed);
          totalInputTokens += result.tokenUsage.inputTokens;
          totalOutputTokens += result.tokenUsage.outputTokens;
          llmCallCount++;
        }
      }
    }
    const llmTime = Date.now() - llmStart;

    // Step 4: Score fusion
    const fusionStart = Date.now();
    const dimensionScores: FinalDimensionScore[] = [];

    for (const dim of dimensions) {
      const heuristic = heuristicResults.get(dim.id)!;
      const llmResult = llmResultMap.get(dim.id);
      const fused = dim.fuseScores(heuristic, llmResult);
      dimensionScores.push(fused);
    }
    const fusionTime = Date.now() - fusionStart;

    // Step 5: EQI calculation
    const eqiInputs = dimensions.map(dim => {
      const score = dimensionScores.find(d => d.dimensionId === dim.id)!;
      return {
        dimensionId: dim.id,
        score: score.score,
        weight: dim.weight,
      };
    });

    const eqiResult = eqiCalculator.calculate(eqiInputs, cfg.essayType);

    // Estimate cost
    const haikuCost = 0.00025; // per 1K input + output tokens (approximate)
    const sonnetCost = 0.003;
    const haikuCalls = llmCalls.filter(c => c.tier === 'haiku').length;
    const sonnetCalls = llmCalls.filter(c => c.tier === 'sonnet').length;
    const estimatedCost = (haikuCalls * 0.002) + (sonnetCalls * 0.01);

    return {
      dimensionScores,
      eqi: eqiResult.eqi,
      impressionLabel: eqiResult.impressionLabel,
      weightedScores: eqiResult.weightedScores,
      cost: {
        llmCallCount,
        totalInputTokens,
        totalOutputTokens,
        estimatedCostUSD: estimatedCost,
      },
      timingMs: {
        featureExtraction: extractTime,
        heuristicScoring: heuristicTime,
        llmScoring: llmTime,
        fusion: fusionTime,
        total: Date.now() - totalStart,
      },
    };
  }

  /**
   * Prepare features for scoring — extract text features, classify paragraph functions,
   * and thread essay type context. Computed once, consumed by all dimension scorers.
   */
  private prepareFeatures(text: string, essayType?: WorkshopEssayType): ExtractedFeatures {
    const features = featureExtractor.extract(text);

    // Thread essay type for type-aware prompts (personal_statement, uc_piq, etc.)
    if (essayType) {
      features.essayType = essayType;
    }

    // Classify paragraph functions once — consumed by heuristic scorers and Haiku prompt builders.
    // Cannot live in featureExtractor due to circular dependency (paragraphFunctionClassifier
    // imports splitParagraphs/splitSentences/splitWords from featureExtractor).
    features.paragraphFunctionAnalysis = classifyParagraphFunctions(text);
    features.paragraphFunctions = features.paragraphFunctionAnalysis.map(p => p.detectedFunction);

    return features;
  }

  /**
   * Score using heuristics only (no LLM calls). Fast and free.
   * Useful for pre-analysis, quick snapshots, or cost-constrained scenarios.
   */
  scoreHeuristicOnly(text: string, essayType?: WorkshopEssayType): ScoringResult {
    const start = Date.now();
    const features = this.prepareFeatures(text, essayType);
    const dimensions = dimensionRegistry.getAll();

    if (dimensions.length === 0) {
      throw new Error('[HybridScoringPipeline] No dimensions registered.');
    }

    const dimensionScores: FinalDimensionScore[] = dimensions.map(dim => {
      const heuristic = dim.heuristicScore(features);
      return {
        dimensionId: dim.id,
        score: heuristic.score,
        source: 'heuristic_only' as const,
        heuristicResult: heuristic,
        evidence: heuristic.evidence,
      };
    });

    const eqiInputs = dimensions.map(dim => {
      const score = dimensionScores.find(d => d.dimensionId === dim.id)!;
      return { dimensionId: dim.id, score: score.score, weight: dim.weight };
    });

    const eqiResult = eqiCalculator.calculate(eqiInputs, essayType);
    const totalTime = Date.now() - start;

    return {
      dimensionScores,
      eqi: eqiResult.eqi,
      impressionLabel: eqiResult.impressionLabel,
      weightedScores: eqiResult.weightedScores,
      cost: { llmCallCount: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCostUSD: 0 },
      timingMs: {
        featureExtraction: totalTime,
        heuristicScoring: 0,
        llmScoring: 0,
        fusion: 0,
        total: totalTime,
      },
    };
  }
}

/** Singleton hybrid scoring pipeline */
export const hybridScoringPipeline = new HybridScoringPipeline();
export { HybridScoringPipeline };
