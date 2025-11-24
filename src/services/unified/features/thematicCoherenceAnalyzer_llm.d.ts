/**
 * THEMATIC COHERENCE LLM ANALYZER
 *
 * Dimension: Thematic Coherence
 *
 * Evaluates how well the essay connects its parts:
 * - Is there a clear "Throughline" or central theme?
 * - Do paragraphs transition logically?
 * - Does the conclusion connect back to the introduction (Circle Back)?
 * - Is the essay focused or scattered?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface ThematicCoherenceAnalysis {
    score: number;
    quality_level: 'unified' | 'coherent' | 'loose' | 'fragmented';
    reasoning: {
        core_theme: string;
        flow_analysis: string;
        circle_back_analysis: string;
        cohesion_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'fragmented' | 'loose' | 'coherent' | 'unified';
        next_tier: 'loose' | 'coherent' | 'unified' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    structure: {
        has_clear_theme: boolean;
        has_logical_transitions: boolean;
        has_circle_back: boolean;
        paragraph_count: number;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeThematicCoherence(essayText: string): Promise<ThematicCoherenceAnalysis>;
//# sourceMappingURL=thematicCoherenceAnalyzer_llm.d.ts.map