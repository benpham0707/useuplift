/**
 * Analysis Engine - Main Orchestrator
 *
 * Coordinates the multi-stage analysis pipeline:
 * Stage 1: Feature Extraction
 * Stage 2: Parallel Category Scoring
 * Stage 3: Conditional Deep Reflection (if needed)
 * Stage 4: NQI Calculation & Flag Generation
 *
 * This is the primary entry point for analyzing an experience entry.
 */

import {
  ExperienceEntry,
  ExtractedFeatures,
  AnalysisReport,
  RubricCategoryScore,
  AnalysisOptions,
  RubricCategory,
} from '../types/experience';
import { extractFeatures, validateFeatures } from './features/extractor';
import { analyzeAuthenticity, AuthenticityAnalysis } from './features/authenticityDetector';
import { scoreAllCategories, scoreSingleCategory, validateCategoryScores } from './scoring/categoryScorer';
import { calculateNQI, getReaderImpressionLabel, RUBRIC_WEIGHTS, RUBRIC_VERSION, RUBRIC_CATEGORIES_DEFINITIONS, getWeightsForCategory } from '../rubrics/v1.0.0';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisResult {
  report: AnalysisReport;
  analysis?: AnalysisReport; // Alias for backwards compatibility
  features: ExtractedFeatures;
  authenticity: AuthenticityAnalysis;
  coaching?: import('./coaching').CoachingOutput;  // Optional: included unless skip_coaching = true
  performance: {
    stage1_ms: number; // Feature extraction
    stage2_ms: number; // Category scoring
    stage3_ms: number; // Deep reflection (if applicable)
    stage4_ms: number; // NQI & flags
    total_ms: number;
  };
}

// ============================================================================
// QUIET EXCELLENCE BONUS
// ============================================================================

/**
 * Calculate "Quiet Excellence" bonus for essays that demonstrate profound simplicity
 *
 * Requirements (ALL must be met):
 * - Exceptional authenticity (7.5+)
 * - Strong voice (9.0+)
 * - Good reflection (7.5+)
 * - Sustained time investment (8.0+)
 *
 * Bonus: +1 to +3 points maximum (doesn't artificially inflate weak essays)
 */
function calculateQuietExcellenceBonus(
  scores: Record<string, number>,
  authenticity: AuthenticityAnalysis
): number {
  // Only apply if essay demonstrates strong fundamentals
  const voice = scores.voice_integrity;
  const reflection = scores.reflection_meaning;
  const time = scores.time_investment_consistency;
  const authScore = authenticity.authenticity_score;

  if (voice === undefined || reflection === undefined || time === undefined) {
    return 0;
  }

  // Must have exceptional voice and authenticity
  if (voice < 9.0) return 0;
  if (authScore < 7.5) return 0;

  // Must have good reflection (shows depth)
  if (reflection < 7.5) return 0;

  // Must show sustained commitment
  if (time < 8.0) return 0;

  // Calculate how many excellence markers are present
  let excellenceMarkers = 0;
  if (voice >= 9.5) excellenceMarkers++;
  if (authScore >= 8.0) excellenceMarkers++;
  if (reflection >= 8.5) excellenceMarkers++;
  if (time >= 9.0) excellenceMarkers++;

  // Conservative bonus: 1-3 points based on excellence markers
  // This helps "quiet" narratives without inflating scores artificially
  if (excellenceMarkers >= 4) return 3;  // All markers exceptional
  if (excellenceMarkers >= 3) return 2;  // Most markers exceptional
  if (excellenceMarkers >= 2) return 1;  // Some markers exceptional

  return 0;
}

// ============================================================================
// FLAG GENERATION
// ============================================================================

/**
 * Generate diagnostic flags based on scores and features
 */
function generateFlags(
  scores: Record<RubricCategory, number>,
  features: ExtractedFeatures,
  authenticity: AuthenticityAnalysis
): string[] {
  const flags: string[] = [];

  // Authenticity flags (CRITICAL - check these first)
  if (authenticity.authenticity_score < 4) {
    flags.push('robotic_manufactured_voice');
  }
  if (authenticity.voice_type === 'essay' || authenticity.voice_type === 'robotic') {
    flags.push('essay_voice_detected');
  }
  if (authenticity.red_flags.length >= 3) {
    flags.push('multiple_authenticity_red_flags');
  }
  if (authenticity.manufactured_signals.length >= 5) {
    flags.push('excessive_manufactured_signals');
  }

  // Voice flags
  if (features.voice.passive_ratio > 0.5) {
    flags.push('excessive_passive_voice');
  }
  if (features.voice.buzzword_count >= 3) {
    flags.push('buzzword_heavy');
  }
  if (features.voice.sentence_variety_score < 4) {
    flags.push('low_sentence_variety');
  }

  // Evidence flags
  if (!features.evidence.has_concrete_numbers) {
    flags.push('no_metrics');
  }
  if (features.evidence.metric_specificity_score < 4) {
    flags.push('vague_outcomes');
  }

  // Arc flags
  if (!features.arc.has_stakes) {
    flags.push('no_stakes');
  }
  if (!features.arc.has_turning_point) {
    flags.push('no_turning_point');
  }
  if (features.arc.temporal_markers.length < 2) {
    flags.push('weak_narrative_structure');
  }

  // Collaboration flags
  if (features.collaboration.we_usage_count === 0 && features.voice.first_person_count > 5) {
    flags.push('excessive_individualism');
  }
  if (!features.collaboration.credit_given) {
    flags.push('no_credit_to_others');
  }

  // Reflection flags
  if (features.reflection.reflection_quality === 'none') {
    flags.push('no_reflection');
  }
  if (features.reflection.reflection_quality === 'superficial') {
    flags.push('superficial_reflection');
  }

  // Word count flags
  if (features.word_count < 80) {
    flags.push('too_short');
  }
  if (features.word_count < 150) {
    flags.push('underdeveloped');
  }

  // Category score flags
  if (scores.voice_integrity < 4) {
    flags.push('weak_voice');
  }
  if (scores.specificity_evidence < 4) {
    flags.push('weak_evidence');
  }
  if (scores.reflection_meaning < 5) {
    flags.push('needs_deeper_reflection');
  }

  return flags;
}

/**
 * Rank suggested fixes based on NQI impact simulation
 */
function rankSuggestedFixes(
  scores: Record<RubricCategory, number>,
  flags: string[]
): string[] {
  // Calculate marginal NQI gain for each category if improved by +2 points
  const gains: { category: RubricCategory; gain: number }[] = [];

  for (const category of Object.keys(scores) as RubricCategory[]) {
    const currentScore = scores[category];
    const weight = RUBRIC_WEIGHTS[category];

    // Can't improve beyond 10
    const improvedScore = Math.min(10, currentScore + 2);
    const scoreDelta = improvedScore - currentScore;
    const nqiGain = scoreDelta * weight * 10;

    gains.push({ category, gain: nqiGain });
  }

  // Sort by descending gain
  gains.sort((a, b) => b.gain - a.gain);

  // Map to human-readable fix suggestions
  const fixLabels: Record<RubricCategory, string> = {
    voice_integrity: 'Add authentic, specific voice (avoid templates)',
    specificity_evidence: 'Add concrete numbers and outcomes',
    transformative_impact: 'Show before/after change (self & others)',
    role_clarity_ownership: 'Clarify your specific decisions and actions',
    narrative_arc_stakes: 'Add stakes, obstacles, and turning points',
    initiative_leadership: 'Highlight where you created momentum',
    community_collaboration: 'Credit partners and show interdependence',
    reflection_meaning: 'Deepen reflection with transferable insights',
    craft_language_quality: 'Improve writing: active verbs, vivid details',
    fit_trajectory: 'Connect to broader interests and future learning',
    time_investment_consistency: 'Show sustained commitment over time',
  };

  // Return top 3-5 fixes
  return gains.slice(0, 5).map(g => fixLabels[g.category]);
}

// ============================================================================
// CONDITIONAL DEEP REFLECTION
// ============================================================================

/**
 * Run deep reflection analysis if initial score is low
 */
async function runDeepReflectionIfNeeded(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  authenticity: AuthenticityAnalysis,
  initialReflectionScore: number
): Promise<{ score: RubricCategoryScore | null; duration_ms: number }> {
  const startTime = Date.now();

  // Only run if reflection score < 6
  if (initialReflectionScore >= 6) {
    return { score: null, duration_ms: 0 };
  }

  console.log('Running deep reflection analysis (initial score < 6)...');

  const deepScore = await scoreSingleCategory('reflection_meaning', entry, features, authenticity);

  const duration = Date.now() - startTime;
  return { score: deepScore, duration_ms: duration };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze an experience entry and generate a complete report
 */
export async function analyzeEntry(
  entry: ExperienceEntry,
  options: AnalysisOptions = { depth: 'standard' }
): Promise<AnalysisResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANALYZING ENTRY: ${entry.title}`);
  console.log(`${'='.repeat(80)}\n`);

  const performanceTracking = {
    stage1_ms: 0,
    stage2_ms: 0,
    stage3_ms: 0,
    stage4_ms: 0,
    total_ms: 0,
  };

  const overallStart = Date.now();

  // ==========================================================================
  // STAGE 1: FEATURE EXTRACTION + AUTHENTICITY DETECTION
  // ==========================================================================

  const stage1Start = Date.now();
  console.log('Stage 1: Feature Extraction + Authenticity Detection...');

  const features = await extractFeatures(entry);

  const featureValidation = validateFeatures(features);
  if (!featureValidation.valid) {
    throw new Error(`Feature extraction failed: ${featureValidation.errors.join(', ')}`);
  }

  // Run authenticity detection
  const authenticity = analyzeAuthenticity(entry.description_original);

  performanceTracking.stage1_ms = Date.now() - stage1Start;
  console.log(`✓ Stage 1 complete (${performanceTracking.stage1_ms}ms)`);
  console.log(`  - Word count: ${features.word_count}`);
  console.log(`  - Active verbs: ${features.voice.active_verb_count}, Passive: ${features.voice.passive_verb_count}`);
  console.log(`  - Numbers found: ${features.evidence.number_count}`);
  console.log(`  - Reflection quality: ${features.reflection.reflection_quality}`);
  console.log(`  - Authenticity score: ${authenticity.authenticity_score}/10 (${authenticity.voice_type})`);
  console.log(`  - Red flags: ${authenticity.red_flags.length}, Green flags: ${authenticity.green_flags.length}\n`);

  // ==========================================================================
  // STAGE 2: PARALLEL CATEGORY SCORING
  // ==========================================================================

  const stage2Start = Date.now();
  console.log('Stage 2: Parallel Category Scoring (3 batches)...');

  const { scores: categoryScores, totalUsage } = await scoreAllCategories(entry, features, authenticity);

  const scoreValidation = validateCategoryScores(categoryScores);
  if (!scoreValidation.valid) {
    throw new Error(`Category scoring failed: ${scoreValidation.errors.join(', ')}`);
  }

  performanceTracking.stage2_ms = Date.now() - stage2Start;
  console.log(`✓ Stage 2 complete (${performanceTracking.stage2_ms}ms)`);
  console.log(`  - Scored ${categoryScores.length} categories in ${totalUsage.batches} parallel batches\n`);

  // ==========================================================================
  // STAGE 3: CONDITIONAL DEEP REFLECTION
  // ==========================================================================

  const stage3Start = Date.now();

  // Find initial reflection score
  const initialReflectionScore = categoryScores.find(s => s.name === 'reflection_meaning')?.score_0_to_10 || 0;

  const { score: deepReflectionScore, duration_ms: stage3Duration } = await runDeepReflectionIfNeeded(
    entry,
    features,
    authenticity,
    initialReflectionScore
  );

  // Replace reflection score if deep analysis was run
  if (deepReflectionScore) {
    const reflectionIndex = categoryScores.findIndex(s => s.name === 'reflection_meaning');
    if (reflectionIndex !== -1) {
      categoryScores[reflectionIndex] = deepReflectionScore;
      console.log(`✓ Deep reflection analysis updated score: ${initialReflectionScore} → ${deepReflectionScore.score_0_to_10}`);
    }
  } else {
    console.log(`⊘ Skipped deep reflection (initial score ${initialReflectionScore} ≥ 6)`);
  }

  performanceTracking.stage3_ms = stage3Duration;
  console.log();

  // ==========================================================================
  // STAGE 4: NQI CALCULATION & FLAG GENERATION
  // ==========================================================================

  const stage4Start = Date.now();
  console.log('Stage 4: NQI Calculation & Diagnostics...');

  // Build scores map - map display names to keys
  const scoresMap: Record<RubricCategory, number> = {} as any;
  for (const score of categoryScores) {
    // Find the category key from the name (which might be display name or key)
    let categoryKey: RubricCategory | undefined;

    // Try direct match first
    if (score.name in RUBRIC_WEIGHTS) {
      categoryKey = score.name as RubricCategory;
    } else {
      // Try to find by display name
      const catDef = Object.entries(RUBRIC_CATEGORIES_DEFINITIONS).find(
        ([_, def]) => def.display_name === score.name
      );
      if (catDef) {
        categoryKey = catDef[0] as RubricCategory;
      }
    }

    if (categoryKey) {
      scoresMap[categoryKey] = score.score_0_to_10;
    } else {
      console.warn(`Could not map category name "${score.name}" to a valid category key`);
    }
  }

  // Apply authenticity-based score adjustments
  console.log('Applying authenticity-based adjustments...');

  // Calculate adjustment based on authenticity score
  // Calibrated for extracurricular context (more forgiving than personal statement essays)
  let voiceIntegrityAdjustment = 0;
  let adjustmentReason = '';

  if (authenticity.authenticity_score >= 8) {
    voiceIntegrityAdjustment = +1.5;
    adjustmentReason = 'Highly authentic conversational voice (+1.5 boost)';
  } else if (authenticity.authenticity_score >= 6.5) {
    voiceIntegrityAdjustment = +0.5;
    adjustmentReason = 'Good authentic voice (+0.5 boost)';
  } else if (authenticity.authenticity_score >= 5) {
    voiceIntegrityAdjustment = 0;
    adjustmentReason = 'Acceptable voice (no adjustment)';
  } else if (authenticity.authenticity_score >= 3) {
    voiceIntegrityAdjustment = -0.5;
    adjustmentReason = 'Somewhat manufactured (-0.5 penalty)';
  } else {
    voiceIntegrityAdjustment = -2;
    adjustmentReason = 'CRITICAL: Robotic/essay voice (-2 major penalty)';
  }

  if (voiceIntegrityAdjustment !== 0) {
    const originalVoiceScore = scoresMap.voice_integrity;
    scoresMap.voice_integrity = Math.max(0, Math.min(10, scoresMap.voice_integrity + voiceIntegrityAdjustment));
    console.log(`  - Voice Integrity: ${originalVoiceScore} → ${scoresMap.voice_integrity} (${voiceIntegrityAdjustment > 0 ? '+' : ''}${voiceIntegrityAdjustment})`);
    console.log(`  - Reason: ${adjustmentReason}`);

    // Update the category score object as well
    const voiceScoreIdx = categoryScores.findIndex(s => s.name === 'voice_integrity' || s.name === 'Voice Integrity');
    if (voiceScoreIdx !== -1) {
      categoryScores[voiceScoreIdx].score_0_to_10 = scoresMap.voice_integrity;
      categoryScores[voiceScoreIdx].evaluator_notes += ` [AUTHENTICITY ADJUSTMENT: ${voiceIntegrityAdjustment > 0 ? '+' : ''}${voiceIntegrityAdjustment} - ${adjustmentReason}]`;
    }
  }

  // Calculate NQI with adjusted scores and adaptive weights based on activity category
  const adaptiveWeights = getWeightsForCategory(entry.category);
  let nqi = calculateNQI(scoresMap, adaptiveWeights);

  // Apply "Quiet Excellence" bonus if warranted
  // This recognizes essays that demonstrate profound simplicity and sustained authenticity
  // without traditional dramatic arcs, but ONLY if other fundamentals are strong
  const quietExcellenceBonus = calculateQuietExcellenceBonus(scoresMap, authenticity);
  if (quietExcellenceBonus > 0) {
    const originalNqi = nqi;
    nqi = Math.min(100, nqi + quietExcellenceBonus);
    console.log(`  - Quiet Excellence bonus: +${quietExcellenceBonus} (${originalNqi} → ${nqi}) - sustained authenticity with strong fundamentals`);
  }

  const readerLabel = getReaderImpressionLabel(nqi);
  console.log(`  - Using adaptive weights for category: ${entry.category}`);

  // Generate flags
  const flags = generateFlags(scoresMap, features, authenticity);

  // Rank fixes
  const suggestedFixes = rankSuggestedFixes(scoresMap, flags);

  performanceTracking.stage4_ms = Date.now() - stage4Start;
  console.log(`✓ Stage 4 complete (${performanceTracking.stage4_ms}ms)`);
  console.log(`  - NQI: ${nqi}/100`);
  console.log(`  - Label: ${readerLabel}`);
  console.log(`  - Flags: ${flags.length}\n`);

  // ==========================================================================
  // ASSEMBLE REPORT
  // ==========================================================================

  performanceTracking.total_ms = Date.now() - overallStart;

  const report: AnalysisReport = {
    id: uuidv4(),
    entry_id: entry.id,
    rubric_version: RUBRIC_VERSION,
    created_at: new Date().toISOString(),

    categories: categoryScores,
    weights: Object.fromEntries(
      Object.entries(RUBRIC_WEIGHTS).map(([k, v]) => [k, v])
    ),

    narrative_quality_index: nqi,
    reader_impression_label: readerLabel as any,

    flags,
    suggested_fixes_ranked: suggestedFixes,

    analysis_depth: options.depth,
  };

  // ==========================================================================
  // GENERATE COACHING (unless skip_coaching = true)
  // ==========================================================================

  let coaching;
  if (!options.skip_coaching) {
    const { generateCoaching } = await import('./coaching');
    coaching = generateCoaching(entry, report, authenticity, features);
    console.log(`✓ Coaching generated: ${coaching.overall.total_issues} issues detected\n`);
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`ANALYSIS COMPLETE`);
  console.log(`Total time: ${performanceTracking.total_ms}ms`);
  console.log(`${'='.repeat(80)}\n`);

  return {
    report,
    features,
    authenticity,
    coaching,
    performance: performanceTracking,
  };
}

/**
 * Quick analysis (feature extraction + scoring only, no deep dives)
 */
export async function quickAnalyze(entry: ExperienceEntry): Promise<AnalysisResult> {
  return analyzeEntry(entry, { depth: 'quick', skip_coaching: true });
}

/**
 * Comprehensive analysis (all stages including deep reflection)
 */
export async function comprehensiveAnalyze(entry: ExperienceEntry): Promise<AnalysisResult> {
  return analyzeEntry(entry, { depth: 'comprehensive' });
}
