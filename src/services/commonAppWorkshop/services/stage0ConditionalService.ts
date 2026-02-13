// @ts-nocheck
/**
 * Stage 0 Wrapper Service
 *
 * **UPDATED: Always Run Voice Excavation**
 *
 * Per user requirement: Voice excavation runs at ALL times for consistency
 * and quality. This service wraps the full Stage 0 multi-stage pipeline
 * and provides a consistent interface for the workshop flow.
 *
 * **Cost**: $0.11 per essay (5 Sonnet calls in multi-stage pipeline)
 *
 * **Quality Philosophy**:
 * Every essay benefits from voice excavation, even those with good initial voice.
 * The multi-stage pipeline:
 * 1. Identifies and preserves what's already working
 * 2. Strengthens authentic moments
 * 3. Removes essay mode artifacts
 * 4. Creates consistent 85/100 spark baseline for Stage 1
 *
 * **Why Always Run**:
 * - Consistency: Every essay goes through same quality process
 * - Quality: Even good essays have room for voice improvement
 * - Baseline: Creates reliable spark score for Stage 1 teaching
 * - Integration: Stage 1-3 expect voice-first draft as input
 */

import { HaikuDiagnosisService } from './haikuDiagnosisService';
import { Stage0MultiStageService } from './stage0MultiStageService';
import type {
  VoiceExcavationInput,
  Stage0MultiStageOutput,
  EmotionalRegister,
  VoiceFingerprint,
} from '../types/stage0Types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Quick triage result
 */
export interface SparkTriageResult {
  spark_score: number;
  decision: 'skip_stage0' | 'run_stage0';
  reasoning: string;
  voice_baseline: {
    register: EmotionalRegister;
    voice_qualities: string[];
    authentic_phrases: string[];
    preservation_warnings: string[];
  };
  estimated_savings: number;              // If skipped
  cost: number;                           // Cost of triage
}

/**
 * Conditional Stage 0 output
 */
export interface ConditionalStage0Output {
  path_taken: 'full_pipeline' | 'skipped_to_stage1';

  // If full pipeline run
  full_output?: Stage0MultiStageOutput;

  // If skipped
  triage_result?: SparkTriageResult;
  voice_baseline?: VoiceFingerprint;

  // Common
  draft_to_stage1: string;
  voice_context: {
    register: EmotionalRegister;
    spark_score: number;
    authentic_phrases: string[];
    voice_qualities: string[];
  };

  total_cost: number;
}

// ============================================================================
// QUICK SPARK TRIAGE PROMPT
// ============================================================================

const SPARK_TRIAGE_PROMPT = `You are performing QUICK triage to determine if this essay needs voice excavation.

ESSAY DRAFT:
{draft}

ESSAY PROMPT:
{prompt}

Your job: Quickly assess if this essay already has authentic voice.

Analyze:

1. SPARK SCORE (0-100)
   Critical thresholds:
   - 0-59: Needs voice work (essay mode, bland, generic)
   - 60-74: Borderline (some authenticity but inconsistent)
   - 75-100: Good voice (authentic, consistent, doesn't need excavation)

   Score based on:
   - Authentic moments vs essay mode
   - Specific details vs abstractions
   - Student personality vs generic voice
   - Sensory grounding vs pure conceptual
   - Genuine emotion vs performed vulnerability

2. EMOTIONAL REGISTER
   Which register does this essay naturally fit?
   - energetic_enthusiasm
   - quiet_intensity
   - melancholy_loss
   - defiant_irreverent
   - wonder_curiosity
   - warmth_connection

3. VOICE BASELINE (if spark ≥ 75)
   Capture what's already working:
   - Voice qualities (3-5 descriptive adjectives)
   - Authentic phrases (5-10 phrases that feel genuine)
   - Preservation warnings (what NOT to change)

4. DECISION
   - skip_stage0: Spark ≥ 75, voice is already good
   - run_stage0: Spark < 75, needs voice excavation

5. REASONING
   Explain the decision:
   - If skipping: What's already working well? What voice strengths exist?
   - If running: What's missing? Where does essay mode dominate?

OUTPUT FORMAT (JSON):
{
  "spark_score": number,
  "emotional_register": "energetic_enthusiasm" | ...,
  "voice_qualities": ["quality1", "quality2", ...],
  "authentic_phrases": ["phrase1", "phrase2", ...],
  "preservation_warnings": ["warning1", "warning2", ...],
  "decision": "skip_stage0" | "run_stage0",
  "reasoning": "string",
  "confidence": number (0-100, how confident in this decision)
}`;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Stage0ConditionalService {
  private haikuService: HaikuDiagnosisService;
  private stage0Service: Stage0MultiStageService;

  constructor(apiKey?: string) {
    this.haikuService = new HaikuDiagnosisService(apiKey);
    this.stage0Service = new Stage0MultiStageService(apiKey);
  }

  /**
   * Run Stage 0 voice excavation (ALWAYS runs full pipeline)
   *
   * This is the main entry point. It ALWAYS runs the full 5-stage voice
   * excavation pipeline for consistency and quality.
   *
   * Cost: $0.11 per essay
   */
  async runStage0(
    input: VoiceExcavationInput
  ): Promise<ConditionalStage0Output> {
    console.log('🎨 Stage 0: Running voice excavation pipeline...');

    // Run full Stage 0 multi-stage pipeline (always)
    const fullOutput = await this.stage0Service.runMultiStagePipeline(
      input,
      input.interviewResponses || [],
      250 // Default word limit
    );

    console.log(`✓ Voice excavation complete`);
    console.log(`  Spark: ${fullOutput.analysis.sparkScore}/100 → ${fullOutput.voiceFirstDraft.metrics.sparkScore}/100`);
    console.log(`  Register: ${fullOutput.voiceFirstDraft.register}`);
    console.log(`  Cost: $${fullOutput.costTracking.totalCost.toFixed(3)}`);

    return {
      path_taken: 'full_pipeline',
      full_output: fullOutput,
      draft_to_stage1: fullOutput.voiceFirstDraft.draft,
      voice_context: {
        register: fullOutput.voiceFirstDraft.register,
        spark_score: fullOutput.voiceFirstDraft.metrics.sparkScore,
        authentic_phrases: fullOutput.stage1Handoff.voiceContext.authenticPhrases,
        voice_qualities: fullOutput.stage1Handoff.voiceContext.voiceQuirks,
      },
      total_cost: fullOutput.costTracking.totalCost,
    };
  }

  /**
   * Quick spark triage using Haiku
   *
   * Fast, cheap analysis to determine if essay needs voice excavation.
   * Cost: ~$0.002
   */
  private async quickSparkTriage(
    draft: string,
    prompt: string
  ): Promise<SparkTriageResult> {
    const triagePrompt = SPARK_TRIAGE_PROMPT
      .replace('{draft}', draft)
      .replace('{prompt}', prompt);

    const response = await (this.haikuService as any).client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: 'user', content: triagePrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Haiku');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Haiku triage response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate cost
    const HAIKU_PRICING = {
      input: 0.25 / 1_000_000,
      output: 1.25 / 1_000_000,
    };
    const cost =
      response.usage.input_tokens * HAIKU_PRICING.input +
      response.usage.output_tokens * HAIKU_PRICING.output;

    // Estimated savings if we skip Stage 0
    const FULL_STAGE0_COST = 0.11;
    const estimated_savings = parsed.decision === 'skip_stage0'
      ? FULL_STAGE0_COST - cost
      : 0;

    return {
      spark_score: parsed.spark_score,
      decision: parsed.decision,
      reasoning: parsed.reasoning,
      voice_baseline: {
        register: parsed.emotional_register,
        voice_qualities: parsed.voice_qualities,
        authentic_phrases: parsed.authentic_phrases,
        preservation_warnings: parsed.preservation_warnings,
      },
      estimated_savings,
      cost,
    };
  }

  /**
   * Get statistics on triage decisions
   *
   * Useful for understanding skip rates and cost savings
   */
  static analyzeTriageStats(
    results: SparkTriageResult[]
  ): {
    total_essays: number;
    skipped_count: number;
    run_count: number;
    skip_rate: number;
    average_spark_score: number;
    total_savings: number;
    average_savings_per_essay: number;
  } {
    const total = results.length;
    const skipped = results.filter(r => r.decision === 'skip_stage0').length;
    const run = total - skipped;
    const skip_rate = skipped / total;

    const avg_spark = results.reduce((sum, r) => sum + r.spark_score, 0) / total;
    const total_savings = results.reduce((sum, r) => sum + r.estimated_savings, 0);
    const avg_savings = total_savings / total;

    return {
      total_essays: total,
      skipped_count: skipped,
      run_count: run,
      skip_rate,
      average_spark_score: avg_spark,
      total_savings,
      average_savings_per_essay: avg_savings,
    };
  }

  /**
   * Utility: Should we skip Stage 0 based on manual review?
   *
   * Sometimes you want to manually check before trusting the triage.
   * This provides a human-readable summary.
   */
  static shouldSkipStage0(sparkScore: number): {
    decision: 'skip' | 'run';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  } {
    if (sparkScore >= 80) {
      return {
        decision: 'skip',
        confidence: 'high',
        reasoning: 'Essay has strong authentic voice (spark ≥ 80). Stage 0 unnecessary and risks over-polishing.',
      };
    }

    if (sparkScore >= 75) {
      return {
        decision: 'skip',
        confidence: 'medium',
        reasoning: 'Essay has good voice (spark 75-79). Can skip Stage 0, but borderline.',
      };
    }

    if (sparkScore >= 60) {
      return {
        decision: 'run',
        confidence: 'medium',
        reasoning: 'Essay has inconsistent voice (spark 60-74). Stage 0 will help strengthen authenticity.',
      };
    }

    return {
      decision: 'run',
      confidence: 'high',
      reasoning: 'Essay lacks authentic voice (spark < 60). Definitely needs Stage 0 excavation.',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SparkTriageResult,
  ConditionalStage0Output,
};
