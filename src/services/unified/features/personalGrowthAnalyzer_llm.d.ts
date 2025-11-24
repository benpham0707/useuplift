/**
 * PERSONAL GROWTH LLM ANALYZER
 *
 * Dimension: Personal Growth
 *
 * Evaluates the student's maturity and development:
 * - How has the student matured?
 * - Have they developed self-awareness, resilience, or new perspectives?
 * - Is the growth internal (mindset) or just external (skills)?
 * - Do they demonstrate vulnerability and reflection?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface PersonalGrowthAnalysis {
    score: number;
    quality_level: 'transformative' | 'reflective' | 'reactive' | 'stagnant';
    reasoning: {
        initial_state: string;
        catalyst: string;
        internal_process: string;
        outcome_state: string;
    };
    tier_evaluation: {
        current_tier: 'stagnant' | 'reactive' | 'reflective' | 'transformative';
        next_tier: 'reactive' | 'reflective' | 'transformative' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    growth_type: {
        type: 'mindset' | 'perspective' | 'skill' | 'none';
        description: string;
    };
    catalyst_quality: {
        type: 'specific_event' | 'general_process' | 'vague';
        description: string;
    };
    reflection_depth: {
        level: 'deep' | 'surface' | 'none';
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
/**
 * Analyze Personal Growth using LLM semantic understanding
 */
export declare function analyzePersonalGrowth(essayText: string): Promise<PersonalGrowthAnalysis>;
//# sourceMappingURL=personalGrowthAnalyzer_llm.d.ts.map