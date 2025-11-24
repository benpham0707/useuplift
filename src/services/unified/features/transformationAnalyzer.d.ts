/**
 * TRANSFORMATIVE IMPACT ANALYZER
 *
 * Dimension 6: Transformative Impact (10% weight)
 *
 * Detects genuine growth and change over time vs generic "learning experiences":
 * - Before/after belief shifts (specific thought changes)
 * - Concrete behavioral changes (what you do differently now)
 * - Impact on relationships or worldview
 * - Avoiding "I learned that..." statements
 * - Growth arc (earned through struggle, not instant epiphany)
 *
 * Works alongside vulnerabilityAnalyzer (transformation_credibility) to form
 * complete Transformation dimension score.
 */
export interface TransformationAnalysis {
    transformation_score: number;
    transformation_quality: 'world_class' | 'strong' | 'adequate' | 'stated' | 'absent';
    has_belief_shifts: boolean;
    belief_shift_count: number;
    belief_examples: string[];
    belief_specificity: 'concrete' | 'vague' | 'absent';
    has_behavioral_changes: boolean;
    behavior_change_count: number;
    behavior_examples: string[];
    actions_different_now: string[];
    growth_arc_present: boolean;
    growth_type: 'earned_through_struggle' | 'gradual_realization' | 'instant_epiphany' | 'stated_only' | 'none';
    arc_examples: string[];
    impact_on_relationships: boolean;
    impact_on_worldview: boolean;
    impact_on_identity: boolean;
    impact_examples: string[];
    has_i_learned_statements: boolean;
    generic_learning_count: number;
    generic_examples: string[];
    before_after_comparison: boolean;
    comparison_specificity: 'concrete_with_evidence' | 'stated_but_vague' | 'absent';
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze transformative impact in an essay
 */
export declare function analyzeTransformation(essayText: string): TransformationAnalysis;
//# sourceMappingURL=transformationAnalyzer.d.ts.map