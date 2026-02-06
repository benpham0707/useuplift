/**
 * Activity Workshop Module - v4.0 PIPELINE
 *
 * 4-STAGE LLM-POWERED PIPELINE (Replaces rigid heuristics with nuanced analysis)
 *
 * ARCHITECTURE EVOLUTION:
 * ======================
 * v1.0 - Per-activity analysis: $1.60-2.40 for 10 activities
 * v2.0 - Batch processing: $0.35-0.55 (75-80% reduction)
 * v3.0 - Research-Backed Profiler integration
 * v4.0 - 4-STAGE PIPELINE with story context & conditional teaching
 *
 * NEW 4-STAGE PIPELINE (v4.0):
 * ============================
 *
 * Stage 0: Story Detection (Haiku, ~$0.02)
 *   - Identifies WHO the student is before analyzing WHAT they do
 *   - Detects narrative threads, contextual factors, activity story roles
 *   - Output: StoryContext
 *
 * Stage 1: Context-Aware Analysis (Sonnet, ~$0.15-0.20)
 *   - Enriches batch analysis with story context
 *   - Selects teaching candidates based on thresholds
 *   - Output: AnalysisContext (with teaching candidates)
 *
 * Stage 2: Conditional Teaching (Sonnet, ~$0.10-0.15)
 *   - DEEP teaching for activities that need it (max 5)
 *   - QUICK encouragement for already-strong activities
 *   - Matches Common App Workshop quality standards
 *   - Output: TeachingContext
 *
 * Stage 3: Portfolio Synthesis (Haiku, ~$0.02-0.03)
 *   - Final Harvard 1-6 assessment
 *   - Ordered activity list with optimized descriptions
 *   - Actionable plan (immediate, short-term, long-term)
 *   - Output: SynthesisContext
 *
 * TOTAL COST: ~$0.28-0.40 (maintains 80%+ cost reduction)
 *
 * Usage (v4.0):
 * ```typescript
 * import { activityWorkshopService } from '@services/portfolioStrategy/services/activityWorkshop';
 *
 * // Full 4-stage pipeline (recommended)
 * const result = await activityWorkshopService.runPipeline({
 *   activities: [...],
 *   studentContext: { intendedMajor: 'Computer Science', ... }
 * });
 *
 * // Access all stage outputs
 * console.log(result.stage0); // StoryContext
 * console.log(result.stage1); // AnalysisContext
 * console.log(result.stage2); // TeachingContext
 * console.log(result.stage3); // SynthesisContext
 *
 * // Or use legacy-compatible interface
 * const legacyResult = await activityWorkshopService.analyzePortfolio(input);
 * ```
 *
 * Direct Stage Access:
 * ```typescript
 * import {
 *   stage0StoryDetectionService,
 *   stage1ContextAwareAnalysisService,
 *   stage2ConditionalTeachingService,
 *   stage3PortfolioSynthesisService,
 * } from '@services/portfolioStrategy/services/activityWorkshop';
 *
 * // Run individual stages
 * const storyContext = await stage0StoryDetectionService.detectStory(input);
 * const analysisContext = await stage1ContextAwareAnalysisService.analyze(input, storyContext);
 * ```
 */

// Types
export * from './types';

// ============================================================================
// v4.1 HOLISTIC NARRATIVE (NEW - Beginning + End Analysis)
// ============================================================================

/**
 * Portfolio Narrative Service
 *
 * HOLISTIC STORY ANALYSIS that replaces rigid archetype detection.
 * - Uses SONNET for deep narrative understanding
 * - Runs at BEGINNING and END of analysis (with caching)
 * - Shows how activities ELEVATE each other
 * - Creates a cohesive "spike portfolio" presentation
 * - Updates dynamically based on improvements
 */
export {
  PortfolioNarrativeService,
  portfolioNarrativeService,
  type NarrativeElevation,
  type NarrativeThread,
  type SpikePresentation,
  type GapFraming,
  type PortfolioNarrative,
  type NarrativeProgression,
} from './stages/portfolioNarrativeService';

// ============================================================================
// v4.0 PIPELINE STAGES (Legacy Stage 0 kept for backwards compatibility)
// ============================================================================

// Stage 0: Story Detection (Haiku - legacy archetype detection)
// NOTE: Consider using PortfolioNarrativeService instead for holistic analysis
export {
  Stage0StoryDetectionService,
  stage0StoryDetectionService,
} from './stages/stage0StoryDetectionService';

// Stage 1: Context-Aware Analysis (Sonnet - understanding WHAT with context)
export {
  Stage1ContextAwareAnalysisService,
  stage1ContextAwareAnalysisService,
} from './stages/stage1ContextAwareAnalysisService';

// Stage 2: Conditional Teaching (Sonnet - teaching what needs it)
export {
  Stage2ConditionalTeachingService,
  stage2ConditionalTeachingService,
} from './stages/stage2ConditionalTeachingService';

// Stage 3: Portfolio Synthesis (Haiku - actionable strategy)
export {
  Stage3PortfolioSynthesisService,
  stage3PortfolioSynthesisService,
} from './stages/stage3PortfolioSynthesisService';

// ============================================================================
// ORCHESTRATOR (v4.0 - Uses 4-stage pipeline by default)
// ============================================================================

// Main Workshop Service (runs Stage 0 → 1 → 2 → 3)
export { ActivityWorkshopService, activityWorkshopService } from './activityWorkshopService';

// ============================================================================
// v3.0 BATCH SERVICES (Legacy - kept for fallback/comparison)
// ============================================================================

// Batch Analysis Service (single API call for all activities)
export { BatchActivityAnalysisService, batchActivityAnalysisService } from './batchActivityAnalysisService';

// Batch Teaching Service (single API call for all guidance)
export { BatchActivityTeachingService, batchActivityTeachingService } from './batchActivityTeachingService';

// ============================================================================
// SUPPORTING SERVICES
// ============================================================================

// Citation Service (links feedback to knowledge databases)
export { ActivityCitationService, activityCitationService } from './activityCitationService';

// Integration with existing PASS pipeline
export { stage1AIntegration } from './stage1AIntegration';

// ============================================================================
// SCORING SYSTEM (1-10 Rubric)
// ============================================================================

// All scoring types and services
export * from './scoring';

// ============================================================================
// LEGACY SERVICES (per-activity - deprecated)
// ============================================================================

// Legacy Stage 1: Per-activity Analysis (deprecated, use pipeline)
export { ActivityAnalysisService, activityAnalysisService } from './activityAnalysisService';

// Legacy Stage 2: Per-activity Teaching (deprecated, use pipeline)
export { ActivityTeachingService, activityTeachingService } from './activityTeachingService';

// Legacy Diagnosis Service (deprecated, use pipeline)
export { ActivityDiagnosisService, activityDiagnosisService } from './activityDiagnosisService';

// ============================================================================
// ENHANCED TEACHING SYSTEM (v5.1 - PIQ Workshop Style)
// ============================================================================

/**
 * Enhanced Activity Teaching Service
 *
 * Deep teaching following the PIQ Workshop pattern with:
 * - THE PROBLEM: Why issues matter for admissions
 * - WHY THIS WORKS: Psychology and research behind fixes
 * - WHAT DETAILS TO PRIORITIZE: Critical elements to include
 * - BEFORE/AFTER EXAMPLES: Concrete transformations
 */
export {
  EnhancedActivityTeachingService,
  enhancedActivityTeachingService,
  type EnhancedActivityTeaching,
  type EnhancedIssueTeaching,
  type DetailPriority,
  type InterviewGuidance,
  type UpgradePathway,
} from './enhancedActivityTeachingService';

// Activity Teaching Knowledge Base (research-backed teaching content)
export {
  ACTIVITY_TEACHING_KNOWLEDGE_BASE,
  getTeachingForIssue,
  getAllIssueTypes,
  searchTeachingBundles,
  getTransformationsForCategory,
  type ActivityIssueType,
  type ActivityTeachingBundle,
  type ActivityTransformation,
} from './activityTeachingKnowledgeBase';

// ============================================================================
// ACTIVITY PROFILE & CHAT SYSTEM (v5.0 - Deep Profile Building)
// ============================================================================

/**
 * Activity Profile System
 *
 * Conversational AI system that builds rich activity profiles through
 * natural dialogue with students. These profiles power improved analysis
 * across all services.
 *
 * Components:
 * - Profile: Type system and lifecycle management for activity profiles
 * - Chat: Conversational extraction with adaptive questioning
 *
 * Usage:
 * ```typescript
 * import {
 *   activityProfileChatService,
 *   activityProfileService,
 *   ActivityProfile,
 *   ConversationState,
 * } from './activityWorkshop';
 *
 * // Start conversation to build profile
 * const { state, openingMessage, firstQuestion } = await activityProfileChatService.startConversation({
 *   activityId: 'act-123',
 *   activityTitle: 'Science Olympiad',
 *   trigger: 'user_initiated',
 * });
 *
 * // Process responses iteratively
 * const result = await activityProfileChatService.processUserResponse({
 *   state,
 *   response: 'I joined freshman year because...',
 * });
 *
 * // Use enriched profile for better analysis
 * const profile = result.state.currentProfile;
 * ```
 */

// Profile Module (types and service for activity profiles)
export * from './profile';

// Chat Module (conversational extraction system)
export * from './chat';
