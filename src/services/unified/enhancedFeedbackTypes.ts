/**
 * Enhanced Rubric Feedback Types
 *
 * Phase 17.5: Item 2 - Rich, Calibrated, Personalized Feedback
 *
 * These types support the user requirement:
 * "analyzers should return clear indepth feedback on why they got the score they did,
 * the context of how good that score is, and how to push their score further"
 */

// ============================================================================
// ENHANCED EVIDENCE STRUCTURE
// ============================================================================

export interface EnhancedDimensionEvidence {
  // ===== WHAT THEY WROTE =====
  quotes: string[]; // Key excerpts from their essay

  // ===== DEEP UNDERSTANDING =====
  what_we_see: string; // Personalized observation: "Looking at your essay, we see..."
  what_works_well: string[]; // Authentic praise for strengths (3-5 items)
  specific_opportunities: string[]; // Personalized growth areas (2-4 items)

  // ===== CALIBRATION CONTEXT =====
  score_context: {
    your_score: number; // Their actual score (e.g., 4.5)
    percentile_range: string; // "Bottom 30%", "Middle 50%", "Top 20%", "Top 5%"
    competitive_benchmark: string; // "Most admitted students score 7-9 on this dimension"
    what_this_means: string; // Plain English explanation of the score's implications
  };

  // ===== TIER NAVIGATION =====
  tier_breakdown: {
    current_tier_name: string; // "TIER 2: Linear Story"
    current_tier_description: string; // What defines this tier
    current_tier_range: string; // "4-6 points"

    next_tier_name: string; // "TIER 3: Engaging Story"
    next_tier_description: string; // What defines next tier
    next_tier_range: string; // "7-8 points"

    gap_analysis: string; // "To advance to Tier 3, you need to..."
    path_to_next_tier: string[]; // Concrete steps (2-3 items)
  };

  // ===== STRATEGIC GUIDANCE =====
  concrete_next_step: {
    diagnosis: string; // "Your opening starts with a generic statement"
    prescription: string; // "Start with a specific visual moment"
    essay_specific_example: string; // "Use YOUR Ninjago transformation from line 42"
    rewrite_suggestion: string; // Optional: Show them a rewrite
  };

  // ===== BACKWARDS COMPATIBILITY =====
  justification: string; // Legacy field - summary of why score was given
  constructive_feedback: string; // Legacy field - generic improvement suggestion
  anchors_met: number[]; // Legacy field - which rubric anchors were satisfied
}

// ============================================================================
// CALIBRATION DATA
// ============================================================================

export interface DimensionCalibration {
  dimension_name: string;

  // Percentile mapping
  percentile_map: {
    [score_range: string]: string; // "0-3": "Bottom 20%", "7-9": "Top 20%"
  };

  // Competitive benchmarks
  competitive_range: string; // "Most admitted students: 7-9"
  elite_threshold: number; // 8.5 - score that puts you in top tier

  // Tier definitions
  tiers: DimensionTier[];
}

export interface DimensionTier {
  tier_number: number; // 1, 2, 3, 4
  tier_name: string; // "Weak Opening", "Adequate Opening", "Strong Opening", "Exceptional Opening"
  score_range: string; // "0-3", "4-6", "7-8", "9-10"
  description: string; // What defines this tier
  examples: string[]; // Sample characteristics
  advancement_criteria: string[]; // What it takes to reach next tier
}

// ============================================================================
// FEEDBACK FORMATTING OPTIONS
// ============================================================================

export interface FeedbackFormattingOptions {
  include_rewrite_suggestions?: boolean; // Should we show rewrite examples?
  tone?: 'encouraging' | 'direct' | 'balanced'; // Feedback tone
  depth?: 'concise' | 'detailed' | 'comprehensive'; // How detailed?
  personalization_level?: 'low' | 'medium' | 'high'; // How essay-specific?
}

// ============================================================================
// LLM ANALYZER OUTPUT (For Reference)
// ============================================================================

/**
 * This is what our LLM analyzers ALREADY return (rich data).
 * We just need to SURFACE it better in the feedback.
 */
export interface RichLLMAnalysis {
  // Score
  score: number; // 0-10
  quality_level: string; // "compelling" | "engaging" | "linear" | "flat"

  // Tier evaluation
  tier_evaluation: {
    current_tier: string;
    next_tier: string;
    tier_reasoning: string;
  };

  // Deep reasoning
  reasoning: {
    [key: string]: string; // dimension-specific analysis
  };

  // Guidance
  strengths: string[];
  weaknesses: string[];
  strategic_pivot: string; // The specific fix needed

  // Evidence
  evidence_quotes: string[];
  evaluator_note: string;

  // Confidence
  confidence: number; // 0-1
}
