/**
 * Activity Workshop Stages - 4-Stage Pipeline (v4.0)
 *
 * This module exports all pipeline stages for the LLM-powered Activity Workshop.
 *
 * PIPELINE OVERVIEW:
 * ==================
 *
 * Stage 0: Story Detection (Haiku, ~$0.02)
 * - Identifies WHO the student is before analyzing WHAT they do
 * - Detects narrative threads, contextual factors, activity story roles
 * - Output: StoryContext
 *
 * Stage 1: Context-Aware Analysis (Sonnet, ~$0.15-0.20)
 * - Enriches batch analysis with story context
 * - Selects teaching candidates based on thresholds
 * - Prioritizes teaching order
 * - Output: AnalysisContext
 *
 * Stage 2: Conditional Teaching (Sonnet, ~$0.10-0.15)
 * - Deep teaching for high-potential activities only
 * - Quick encouragement for already-strong activities
 * - Matches Common App Workshop quality standards
 * - Output: TeachingContext
 *
 * Stage 3: Portfolio Synthesis (Haiku, ~$0.02-0.03)
 * - Final Harvard 1-6 assessment
 * - Ordered activity list with optimized descriptions
 * - Actionable plan (immediate, short-term, long-term)
 * - Output: SynthesisContext
 *
 * TOTAL COST: ~$0.28-0.40 (80%+ reduction from per-activity approach)
 */

// Stage 0: Story Detection
export {
  Stage0StoryDetectionService,
  stage0StoryDetectionService,
} from './stage0StoryDetectionService';

// Stage 1: Context-Aware Analysis
export {
  Stage1ContextAwareAnalysisService,
  stage1ContextAwareAnalysisService,
} from './stage1ContextAwareAnalysisService';

// Stage 2: Conditional Teaching
export {
  Stage2ConditionalTeachingService,
  stage2ConditionalTeachingService,
} from './stage2ConditionalTeachingService';

// Stage 3: Portfolio Synthesis
export {
  Stage3PortfolioSynthesisService,
  stage3PortfolioSynthesisService,
} from './stage3PortfolioSynthesisService';
