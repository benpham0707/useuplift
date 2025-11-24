/**
 * UNIFIED PIQ ANALYSIS SYSTEM
 * Version: 2.0.0-unified
 *
 * World-class analysis combining the best of:
 * - Extracurricular Analysis (11-dimension activity rubric)
 * - Essay Analysis (12-dimension essay rubric)
 * - Narrative Workshop (5-stage pipeline insights)
 * - Session 19 breakthrough patterns
 * - Elite pattern detection from Harvard/Berkeley admits
 *
 * ADAPTIVE INTELLIGENCE:
 * - Auto-detects content type (leadership, creative, academic, challenge, etc.)
 * - Adjusts rubric weights dynamically based on content
 * - Provides prompt-specific guidance for all 8 UC PIQ prompts
 * - Synthesizes 20+ detection systems into unified result
 *
 * TRAINING SOURCES:
 * - 19 exemplar essays (Harvard/Princeton/MIT/Yale/Berkeley)
 * - 5 elite activity narratives (Harvard/UCLA/Berkeley Class of 2029)
 * - Session 19 angle quality validation insights
 * - Narrative Workshop 5-stage pipeline patterns
 *
 * DESIGNED FOR:
 * - UC PIQs (350 words, all 8 prompts)
 * - Extracurricular narratives (200-400 words)
 * - Personal stories, academic passions, creative expressions
 * - Challenges overcome, leadership experiences
 *
 * @module UnifiedPIQAnalysis
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { detectContentType } from './contentTypeDetector';
import { runUniversalFeatureDetection } from './universalFeatureDetector';
import { scoreWithAdaptiveRubric } from './adaptiveRubricScorer';
import { analyzePromptAlignment, type UCPromptID } from './promptIntelligence';
import { generateImprovementRoadmap } from './improvementRoadmap';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Content type classification for adaptive analysis
 */
export type PIQContentType =
  | 'activity_leadership'      // Prompts 1, 7: Leadership, community service
  | 'creative_expression'      // Prompt 2: Creative side
  | 'talent_skill'            // Prompt 3: Greatest talent/skill
  | 'educational_journey'     // Prompt 4: Educational opportunity/barrier
  | 'challenge_adversity'     // Prompt 5: Significant challenge
  | 'academic_passion'        // Prompt 6: Academic subject inspiration
  | 'personal_distinction'    // Prompt 8: What distinguishes you
  | 'general_narrative';      // Auto-detected fallback

/**
 * Input for unified PIQ analysis
 */
export interface UnifiedPIQInput {
  /** PIQ text (350 words max for UC PIQs) */
  text: string;

  /** UC PIQ prompt ID (1-8) or null for auto-detect */
  prompt_id?: number | null;

  /** Optional custom prompt text (if not standard UC prompt) */
  prompt_text?: string;

  /** Optional explicit content type (auto-detected if not provided) */
  content_type?: PIQContentType;

  /** Student context for personalized analysis */
  context?: {
    /** Intended major/field of study */
    intended_major?: string;

    /** Cultural/ethnic background */
    cultural_background?: string;

    /** Voice preference for suggestions */
    voice_preference?: 'concise' | 'warm' | 'understated';

    /** Activity category (if it's an extracurricular) */
    activity_category?: string;

    /** Target schools for calibration */
    target_schools?: string[];

    /** Years involved (for activity narratives) */
    years_involved?: number;

    /** Leadership role (if applicable) */
    role?: string;
  };

  /** Analysis options */
  options?: {
    /** Analysis depth */
    depth?: 'quick' | 'standard' | 'comprehensive';

    /** Include generation suggestions (for AI rewriting) */
    include_generation_suggestions?: boolean;

    /** Include exemplar comparisons */
    include_exemplar_comparisons?: boolean;

    /** Skip prompt alignment (for non-UC PIQs) */
    skip_prompt_alignment?: boolean;
  };
}

/**
 * Comprehensive unified analysis result
 */
export interface UnifiedPIQResult {
  // ============================================================================
  // CORE SCORING
  // ============================================================================

  /** PIQ Quality Index (0-100) - Primary score */
  piq_quality_index: number;

  /** Reader impression label */
  impression_label:
    | 'arresting_deeply_human'     // 90-100: Harvard/Stanford/MIT level
    | 'compelling_clear_voice'     // 80-89: Top UC competitive
    | 'competent_needs_texture'    // 70-79: UCLA/Berkeley range
    | 'readable_but_generic'       // 60-69: Solid foundation, needs work
    | 'template_like_rebuild';     // <60: Significant gaps

  /** Tier classification */
  tier: 1 | 2 | 3 | 4;

  /** Tier description */
  tier_description: string;

  // ============================================================================
  // CONTENT CLASSIFICATION
  // ============================================================================

  /** Detected content type */
  detected_content_type: PIQContentType;

  /** Confidence in content type detection (0-1) */
  content_type_confidence: number;

  /** Alternative content types considered (with scores) */
  alternative_content_types?: Array<{
    type: PIQContentType;
    confidence: number;
  }>;

  // ============================================================================
  // ADAPTIVE DIMENSION SCORES (8-16 dimensions)
  // ============================================================================

  /**
   * Dimension scores with adaptive weighting
   * - Core 8 dimensions (ALL PIQs)
   * - +4 activity dimensions (when detected)
   * - +4 narrative dimensions (when appropriate)
   */
  dimension_scores: Array<{
    /** Internal dimension key */
    name: string;

    /** Display name for UI */
    display_name: string;

    /** Score 0-10 */
    score_0_to_10: number;

    /** Weight in overall PQI calculation (adjusted for content type) */
    weight: number;

    /** Evidence quotes from text */
    evidence_quotes: string[];

    /** Evaluator notes explaining score */
    evaluator_notes: string;

    /** Actionable suggestions for improvement */
    suggestions: string[];

    /** Whether dimension is relevant for this content type */
    relevant_for_content_type: boolean;

    /** Expected score for this tier */
    tier_benchmark?: number;

    /** Gap from benchmark */
    gap_from_benchmark?: number;
  }>;

  // ============================================================================
  // UNIVERSAL FEATURE DETECTIONS
  // ============================================================================

  features: {
    /** Scene detection results */
    scenes: {
      has_scenes: boolean;
      count: number;
      quality_score: number; // 0-10: How vivid/effective are scenes?
      details: Array<{
        paragraph_index: number;
        sentence_range?: [number, number];
        temporal_anchor?: string; // "junior year", "3am", etc.
        spatial_anchor?: string; // "lab", "kitchen table", etc.
        sensory_details: string[]; // Visual, auditory, tactile, etc.
        vividness_score: number; // 0-10
      }>;
      missing_opportunities?: string[]; // Where scenes could be added
    };

    /** Dialogue extraction results */
    dialogue: {
      has_dialogue: boolean;
      count: number;
      quality_score: number; // 0-10: How effective is dialogue?
      quotes: Array<{
        text: string;
        speaker?: string;
        context?: string;
        narrative_function: string; // "reveals_character", "advances_plot", etc.
        authenticity_score: number; // 0-10: Does it sound natural?
      }>;
      missing_opportunities?: string[]; // Where dialogue could be added
    };

    /** Interiority detection results */
    interiority: {
      overall_score: number; // 0-10
      depth_level: 'none' | 'surface' | 'moderate' | 'deep' | 'profound';
      vulnerability_count: number;
      vulnerability_moments: Array<{
        text: string;
        type: 'physical' | 'emotional' | 'intellectual';
        specificity_score: number; // 0-10: How specific vs. generic?
        quote: string;
      }>;
      inner_debate_present: boolean;
      emotion_naming_count: number;
      emotion_examples: string[];
      introspection_depth: number; // 0-10
      missing_opportunities?: string[]; // Where to deepen interiority
    };

    /** Authenticity detection results */
    authenticity: {
      score: number; // 0-10
      voice_type: 'conversational' | 'essay' | 'robotic' | 'natural' | 'quirky';
      voice_consistency: number; // 0-10: How consistent is voice?
      red_flags: string[]; // Manufactured phrases, clichés
      green_flags: string[]; // Authentic markers
      manufactured_signals: Array<{
        phrase: string;
        type: 'buzzword' | 'cliché' | 'hedge_word' | 'passive_voice';
        severity: 'minor' | 'moderate' | 'severe';
      }>;
      authenticity_markers: Array<{
        phrase: string;
        type: 'conversational' | 'specific' | 'honest' | 'understated';
      }>;
    };

    /** Elite pattern detection results */
    elite_patterns: {
      overall_score: number; // 0-100
      tier: 1 | 2 | 3 | 4;
      patterns: {
        /** Vulnerability with physical symptoms */
        vulnerability: {
          score: number; // 0-10
          present: boolean;
          has_physical_symptoms: boolean;
          has_named_emotions: boolean;
          examples: string[];
        };

        /** Dialogue that reveals character */
        dialogue: {
          score: number; // 0-10
          present: boolean;
          is_conversational: boolean;
          reveals_character: boolean;
          examples: string[];
        };

        /** Community transformation (before/after) */
        community_transformation: {
          score: number; // 0-20
          present: boolean;
          has_before: boolean;
          has_after: boolean;
          before_state?: string;
          after_state?: string;
          scope: 'individual' | 'group' | 'community' | 'none';
        };

        /** Quantified impact with humanity */
        quantified_impact: {
          score: number; // 0-10
          present: boolean;
          metrics: string[];
          has_human_element: boolean;
          plausibility_score: number; // 0-10
        };

        /** Micro-to-macro (specific → universal insight) */
        micro_to_macro: {
          score: number; // 0-20
          present: boolean;
          has_universal_insight: boolean;
          transcends_activity: boolean;
          insight?: string;
        };

        /** Philosophical depth */
        philosophical_depth: {
          score: number; // 0-10
          present: boolean;
          depth_level: 'none' | 'surface' | 'moderate' | 'deep';
          examples: string[];
        };

        /** Counter-narrative (challenges assumptions) */
        counter_narrative: {
          score: number; // 0-10
          present: boolean;
          challenges_what: string[];
          nuance_present: boolean;
        };
      };
      strengths: string[];
      gaps: string[];
    };

    /** Literary sophistication results */
    literary_sophistication: {
      overall_score: number; // 0-100
      tier: 'S' | 'A' | 'B' | 'C';
      techniques_detected: Array<{
        name: string;
        score: number; // 0-10
        examples: string[];
      }>;
      memorable_moments: string[];
      craft_weaknesses: string[];
    };
  };

  // ============================================================================
  // ACTIVITY-SPECIFIC ANALYSIS (if applicable)
  // ============================================================================

  activity_analysis?: {
    /** Role clarity and specificity */
    role_clarity: {
      score: number; // 0-10
      role_mentioned: boolean;
      role_specific: boolean; // "President" vs. "member"
      role_quote?: string;
    };

    /** Initiative and leadership demonstrated */
    initiative: {
      score: number; // 0-10
      shows_initiative: boolean;
      leadership_demonstrated: boolean;
      examples: string[];
    };

    /** Time investment clarity */
    time_investment: {
      score: number; // 0-10
      duration_clear: boolean;
      frequency_clear: boolean; // Hours/week, years involved
      consistency_shown: boolean;
      time_markers: string[];
    };

    /** Impact quantification */
    impact_quantification: {
      score: number; // 0-10
      has_metrics: boolean;
      metrics: string[];
      plausibility: number; // 0-10
      human_element: boolean;
    };
  };

  // ============================================================================
  // PROMPT-SPECIFIC ANALYSIS
  // ============================================================================

  prompt_analysis: {
    /** Prompt ID (1-8) */
    prompt_id?: number;

    /** Prompt text */
    prompt_text: string;

    /** Alignment score (0-10): How well does essay address prompt? */
    alignment_score: number;

    /** Required elements for this prompt */
    required_elements: Array<{
      element: string;
      present: boolean;
      evidence?: string;
      importance: 'critical' | 'important' | 'optional';
    }>;

    /** Missing critical elements */
    missing_critical: string[];

    /** Strengths in prompt response */
    strengths: string[];

    /** Opportunities to better address prompt */
    opportunities: string[];
  };

  // ============================================================================
  // PRIORITIZED IMPROVEMENT ROADMAP
  // ============================================================================

  improvement_roadmap: {
    /** Quick wins (5-10 minutes, +1-3 points) */
    quick_wins: Array<{
      action: string;
      expected_impact: string; // "+1-3 points"
      how_to: string;
      dimension_affected: string[];
      priority: number; // 1-5
    }>;

    /** Strategic moves (20-30 minutes, +3-5 points) */
    strategic_moves: Array<{
      action: string;
      expected_impact: string; // "+3-5 points"
      how_to: string;
      dimension_affected: string[];
      priority: number; // 1-5
      example?: string;
    }>;

    /** Transformative changes (45-60 minutes, +5-10 points) */
    transformative_changes: Array<{
      action: string;
      expected_impact: string; // "+5-10 points"
      how_to: string;
      dimension_affected: string[];
      priority: number; // 1-5
      example?: string;
      difficulty: 'moderate' | 'challenging' | 'advanced';
    }>;

    /** Estimated score after all improvements */
    potential_score: number;
  };

  // ============================================================================
  // WORD COUNT ANALYSIS
  // ============================================================================

  word_count: {
    total: number;
    max: number; // 350 for UC PIQs
    within_limit: boolean;
    utilization: number; // Percentage
    recommendation?: string; // If too short or too long
  };

  // ============================================================================
  // FLAGS & WARNINGS
  // ============================================================================

  flags: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    actionable_fix?: string;
  }>;

  // ============================================================================
  // METADATA
  // ============================================================================

  /** Timestamp of analysis */
  analyzed_at: string;

  /** Analysis version */
  analysis_version: string;

  /** Rubric version used */
  rubric_version: string;

  /** Analysis depth performed */
  analysis_depth: 'quick' | 'standard' | 'comprehensive';

  /** Processing time in ms */
  processing_time_ms?: number;
}

// ============================================================================
// UC PIQ PROMPTS (Official)
// ============================================================================

export const UC_PIQ_PROMPTS: Record<number, string> = {
  1: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.",

  2: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.",

  3: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?",

  4: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.",

  5: "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?",

  6: "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.",

  7: "What have you done to make your school or your community a better place?",

  8: "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?"
};

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze PIQ with unified best-of-both-worlds approach
 *
 * This function orchestrates a comprehensive analysis combining:
 * - Activity rubric insights (11 dimensions)
 * - Essay rubric insights (12 dimensions)
 * - Universal feature detection (scene, dialogue, interiority, etc.)
 * - Adaptive weighting based on content type
 * - Prompt-specific guidance
 *
 * @param input - PIQ text and metadata
 * @returns Comprehensive analysis result
 */
export async function analyzeUnifiedPIQ(
  input: UnifiedPIQInput
): Promise<UnifiedPIQResult> {
  const startTime = Date.now();

  // ========================================================================
  // HEADER
  // ========================================================================
  console.log('');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(18) + '🎯 UNIFIED PIQ ANALYSIS SYSTEM 🎯' + ' '.repeat(18) + '║');
  console.log('║' + ' '.repeat(15) + 'Best of Both Worlds + Enhanced' + ' '.repeat(16) + '║');
  console.log('║' + ' '.repeat(25) + 'v2.0.0-unified' + ' '.repeat(26) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');
  console.log('📝 Input Analysis:');
  console.log(`   Text length: ${input.text.length} characters`);
  console.log(`   Word count: ${input.text.split(/\s+/).filter(w => w.length > 0).length} words`);
  console.log(`   Prompt ID: ${input.prompt_id || 'auto-detect'}`);
  console.log(`   Depth: ${input.options?.depth || 'standard'}`);
  console.log('');

  // ========================================================================
  // STEP 1: CONTENT TYPE DETECTION
  // ========================================================================
  console.log('🔍 STEP 1: Content Type Detection');
  console.log('─'.repeat(80));

  const contentTypeResult = await detectContentType(
    input.text,
    input.prompt_id,
    input.content_type
  );

  console.log(`   Detected: ${contentTypeResult.primary_type}`);
  console.log(`   Confidence: ${(contentTypeResult.confidence * 100).toFixed(1)}%`);
  if (contentTypeResult.alternatives.length > 0) {
    console.log(`   Alternatives:`);
    contentTypeResult.alternatives.forEach(alt => {
      console.log(`     - ${alt.type} (${(alt.confidence * 100).toFixed(1)}%)`);
    });
  }
  console.log('✅ Content type detected');
  console.log('');

  // ========================================================================
  // STEP 2: UNIVERSAL FEATURE DETECTION
  // ========================================================================
  console.log('🔬 STEP 2: Universal Feature Detection');
  console.log('─'.repeat(80));
  console.log('   Running parallel detections:');
  console.log('   - Scene detection (temporal/spatial/sensory)');
  console.log('   - Dialogue extraction (quoted speech analysis)');
  console.log('   - Interiority detection (vulnerability, emotion, inner debate)');
  console.log('   - Authenticity analysis (voice type, manufactured signals)');
  console.log('   - Elite pattern detection (7 Harvard/Berkeley patterns)');
  console.log('   - Literary sophistication (10 advanced techniques)');
  console.log('');

  const features = await runUniversalFeatureDetection(input.text, input.options?.depth || 'standard');

  console.log('📊 Detection Results:');
  console.log(`   Scenes: ${features.scenes?.scene_count || 0} detected (quality: ${features.scenes?.quality_score || 0}/10)`);
  console.log(`   Dialogue: ${features.dialogue?.dialogue_count || 0} instances (quality: ${features.dialogue?.quality_score || 0}/10)`);
  console.log(`   Interiority: ${features.interiority?.overall_score || 0}/10`);
  console.log(`   Authenticity: ${features.authenticity?.overall_voice_score || 0}/10`);
  console.log('✅ Feature detection complete');
  console.log('');

  // ========================================================================
  // STEP 3: ADAPTIVE RUBRIC SCORING
  // ========================================================================
  console.log('🎯 STEP 3: Adaptive Rubric Scoring');
  console.log('─'.repeat(80));
  console.log('   Applying content-aware dimension weights...');
  console.log(`   Content type: ${contentTypeResult.primary_type}`);
  console.log('   Scoring 8-16 dimensions with evidence...');
  console.log('');

  const rubricResult = await scoreWithAdaptiveRubric(
    input.text,
    contentTypeResult.primary_type,
    features,
    input.context
  );

  console.log('📈 Scoring Complete:');
  console.log(`   PQI Score: ${rubricResult.pqi_score}/100`);
  console.log(`   Tier: ${rubricResult.tier} (${rubricResult.tier_label})`);
  console.log(`   Active Dimensions: ${rubricResult.active_dimensions.length}`);
  console.log(`   Top Strengths: ${rubricResult.strengths.slice(0, 2).join(', ')}`);
  console.log('✅ Adaptive rubric scoring complete');
  console.log('');

  // ========================================================================
  // STEP 4: PROMPT ALIGNMENT ANALYSIS
  // ========================================================================
  let promptAnalysisResult = null;

  if (input.prompt_id && !input.options?.skip_prompt_alignment) {
    console.log('📋 STEP 4: Prompt Alignment Analysis');
    console.log('─'.repeat(80));
    console.log(`   Analyzing alignment with UC Prompt ${input.prompt_id}...`);
    console.log('');

    promptAnalysisResult = await analyzePromptAlignment(
      input.text,
      input.prompt_id as UCPromptID
    );

    console.log('📊 Prompt Analysis:');
    console.log(`   Alignment Score: ${promptAnalysisResult.alignment_score}/10 (${promptAnalysisResult.alignment_label})`);
    console.log(`   Requirements Met: ${promptAnalysisResult.requirements_met.filter(r => r.met).length}/${promptAnalysisResult.requirements_met.length}`);
    if (promptAnalysisResult.critical_missing.length > 0) {
      console.log(`   ⚠️  Critical Missing: ${promptAnalysisResult.critical_missing.join(', ')}`);
    }
    console.log('✅ Prompt alignment analysis complete');
    console.log('');
  } else {
    console.log('⏭️  STEP 4: Prompt Alignment (Skipped)');
    console.log('');
  }

  // ========================================================================
  // STEP 5: IMPROVEMENT ROADMAP GENERATION
  // ========================================================================
  console.log('🗺️  STEP 5: Improvement Roadmap Generation');
  console.log('─'.repeat(80));
  console.log('   Generating prioritized improvements...');
  console.log('   - Quick Wins (5-10 min, +1-3 points)');
  console.log('   - Strategic Moves (20-30 min, +3-5 points)');
  console.log('   - Transformative Changes (45-60 min, +5-10 points)');
  console.log('');

  const roadmap = await generateImprovementRoadmap(
    input.text,
    rubricResult.pqi_score,
    rubricResult.tier,
    rubricResult.dimension_scores,
    features,
    promptAnalysisResult || {
      prompt_id: input.prompt_id as UCPromptID,
      prompt_text: input.prompt_text || '',
      alignment_score: 0,
      alignment_label: 'Unknown',
      requirements_met: [],
      critical_missing: [],
      prompt_tailored_suggestions: [],
      exemplar_patterns: []
    },
    contentTypeResult.primary_type
  );

  console.log('📋 Roadmap Generated:');
  console.log(`   Quick Wins: ${roadmap.quick_wins.length} actions`);
  console.log(`   Strategic Moves: ${roadmap.strategic_moves.length} actions`);
  console.log(`   Transformative Changes: ${roadmap.transformative_changes.length} actions`);
  console.log(`   Estimated Gain: ${roadmap.estimated_total_gain}`);
  console.log(`   Target Tier: ${roadmap.target_tier}`);
  console.log('✅ Improvement roadmap generated');
  console.log('');

  // ========================================================================
  // STEP 6: WORD COUNT & FLAGS
  // ========================================================================
  console.log('📏 STEP 6: Word Count & Validation');
  console.log('─'.repeat(80));

  const words = input.text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const maxWords = 350; // UC PIQ limit
  const withinLimit = wordCount <= maxWords;
  const utilization = (wordCount / maxWords) * 100;

  console.log(`   Word Count: ${wordCount}/${maxWords}`);
  console.log(`   Utilization: ${utilization.toFixed(1)}%`);
  console.log(`   Status: ${withinLimit ? '✅ Within limit' : '⚠️  Over limit'}`);

  const flags: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    actionable_fix?: string;
  }> = [];

  // Word count flags
  if (!withinLimit) {
    flags.push({
      type: 'word_count_exceeded',
      severity: 'critical',
      message: `Essay exceeds ${maxWords}-word limit by ${wordCount - maxWords} words`,
      actionable_fix: `Cut ${wordCount - maxWords} words. Focus on removing: (1) redundant phrases, (2) generic adjectives, (3) unnecessary qualifiers like "very", "really", "quite"`
    });
  } else if (wordCount < 250) {
    flags.push({
      type: 'word_count_low',
      severity: 'warning',
      message: `Essay is only ${wordCount} words (under 75% utilization)`,
      actionable_fix: 'Add more specific details, sensory descriptions, or context to reach 300-350 words'
    });
  }

  // Content flags
  if (rubricResult.pqi_score < 60) {
    flags.push({
      type: 'low_quality_score',
      severity: 'critical',
      message: 'PIQ needs significant revision to be competitive',
      actionable_fix: 'Focus on transformative changes: restructure around a scene, add vulnerability, connect to universal insight'
    });
  }

  if (promptAnalysisResult && promptAnalysisResult.critical_missing.length > 0) {
    flags.push({
      type: 'missing_prompt_requirements',
      severity: 'critical',
      message: `Missing critical prompt requirements: ${promptAnalysisResult.critical_missing.join(', ')}`,
      actionable_fix: 'Address all required elements of the prompt explicitly'
    });
  }

  console.log(`   Flags: ${flags.length} (${flags.filter(f => f.severity === 'critical').length} critical)`);
  console.log('✅ Validation complete');
  console.log('');

  // ========================================================================
  // FINALIZATION
  // ========================================================================
  const processingTime = Date.now() - startTime;

  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(26) + '✅ ANALYSIS COMPLETE ✅' + ' '.repeat(26) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');
  console.log(`⏱️  Processing Time: ${processingTime}ms`);
  console.log(`🎯 Final Score: ${rubricResult.pqi_score}/100 (Tier ${rubricResult.tier})`);
  console.log(`📊 Overall: ${rubricResult.overall_evaluation}`);
  console.log('');

  // Map dimension scores to expected format
  const dimensionScores = rubricResult.dimension_scores.map(d => ({
    name: d.dimension_id,
    display_name: d.display_name,
    score_0_to_10: d.score_0_to_10,
    weight: d.weight,
    evidence_quotes: d.evidence_quotes,
    evaluator_notes: d.evaluator_notes,
    suggestions: d.suggestions,
    relevant_for_content_type: true,
    tier_benchmark: d.tier_benchmark?.tier_2_threshold,
    gap_from_benchmark: d.tier_benchmark ? d.score_0_to_10 - d.tier_benchmark.tier_2_threshold : undefined
  }));

  // Determine impression label
  const impressionLabel = getImpressionLabel(rubricResult.pqi_score);

  // Build final result
  const result: UnifiedPIQResult = {
    piq_quality_index: rubricResult.pqi_score,
    impression_label: impressionLabel,
    tier: rubricResult.tier,
    tier_description: rubricResult.tier_label,
    detected_content_type: contentTypeResult.primary_type,
    content_type_confidence: contentTypeResult.confidence,
    alternative_content_types: contentTypeResult.alternatives.map(alt => ({
      type: alt.type,
      confidence: alt.confidence
    })),
    dimension_scores: dimensionScores,
    features: features,
    prompt_analysis: promptAnalysisResult ? {
      prompt_id: input.prompt_id,
      prompt_text: promptAnalysisResult.prompt_text,
      alignment_score: promptAnalysisResult.alignment_score,
      required_elements: promptAnalysisResult.requirements_met.map(r => ({
        element: r.element,
        present: r.met,
        evidence: r.evidence,
        importance: 'important' as const
      })),
      missing_critical: promptAnalysisResult.critical_missing,
      strengths: [],
      opportunities: promptAnalysisResult.prompt_tailored_suggestions
    } : {
      prompt_text: input.prompt_text || '',
      alignment_score: 0,
      required_elements: [],
      missing_critical: [],
      strengths: [],
      opportunities: []
    },
    improvement_roadmap: {
      quick_wins: roadmap.quick_wins.map(qw => ({
        action: qw.action,
        expected_impact: qw.expected_impact,
        how_to: qw.how_to,
        dimension_affected: qw.affects_dimensions,
        priority: Math.ceil(qw.priority / 2)
      })),
      strategic_moves: roadmap.strategic_moves.map(sm => ({
        action: sm.action,
        expected_impact: sm.expected_impact,
        how_to: sm.how_to,
        dimension_affected: sm.affects_dimensions,
        priority: Math.ceil(sm.priority / 2),
        example: undefined
      })),
      transformative_changes: roadmap.transformative_changes.map(tc => ({
        action: tc.action,
        expected_impact: tc.expected_impact,
        how_to: tc.how_to,
        dimension_affected: tc.affects_dimensions,
        priority: Math.ceil(tc.priority / 2),
        example: undefined,
        difficulty: 'challenging' as const
      })),
      potential_score: rubricResult.pqi_score + 10 // Estimate
    },
    word_count: {
      total: wordCount,
      max: maxWords,
      within_limit: withinLimit,
      utilization: utilization,
      recommendation: !withinLimit ? `Cut ${wordCount - maxWords} words` :
                      wordCount < 250 ? `Add ${300 - wordCount} words for better utilization` :
                      undefined
    },
    flags: flags,
    analyzed_at: new Date().toISOString(),
    analysis_version: '2.0.0-unified',
    rubric_version: 'adaptive-v1.0.0',
    analysis_depth: input.options?.depth || 'standard',
    processing_time_ms: processingTime
  };

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getImpressionLabel(pqi: number): UnifiedPIQResult['impression_label'] {
  if (pqi >= 90) return 'arresting_deeply_human';
  if (pqi >= 80) return 'compelling_clear_voice';
  if (pqi >= 70) return 'competent_needs_texture';
  if (pqi >= 60) return 'readable_but_generic';
  return 'template_like_rebuild';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { analyzeUnifiedPIQ, UC_PIQ_PROMPTS };
export type { UnifiedPIQInput, UnifiedPIQResult, PIQContentType };
