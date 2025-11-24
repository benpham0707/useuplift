/**
 * SPECIFICITY LLM ANALYZER
 *
 * Dimension: Specificity & Evidence
 *
 * Evaluates the use of concrete details to build credibility and immersion:
 * - Does the student use numbers, names, and specific examples?
 * - Do they "Show" (sensory details, scenes) or just "Tell" (summary)?
 * - Is the language precise or vague?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface SpecificityAnalysis {
    score: number;
    quality_level: 'vivid' | 'specific' | 'general' | 'vague';
    reasoning: {
        quantitative_analysis: string;
        qualitative_analysis: string;
        showing_vs_telling_analysis: string;
        precision_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'vague' | 'general' | 'specific' | 'vivid';
        next_tier: 'general' | 'specific' | 'vivid' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    details: {
        metrics_count: number;
        proper_nouns_count: number;
        sensory_details_count: number;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeSpecificity(essayText: string): Promise<SpecificityAnalysis>;
//# sourceMappingURL=specificityAnalyzer_llm.d.ts.map