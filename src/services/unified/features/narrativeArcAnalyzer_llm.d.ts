/**
 * NARRATIVE ARC LLM ANALYZER
 *
 * Dimension: Narrative Arc & Stakes
 *
 * Evaluates the story structure and pacing:
 * - Does the story have a clear beginning, middle, and end?
 * - Is there tension/conflict?
 * - Is there a clear turning point?
 * - Are the stakes clear (what happens if they fail)?
 * - Does it use scenes (showing) vs summary (telling)?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface NarrativeArcAnalysis {
    score: number;
    quality_level: 'compelling' | 'engaging' | 'linear' | 'flat';
    reasoning: {
        structure_analysis: string;
        tension_analysis: string;
        stakes_analysis: string;
        pacing_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'flat' | 'linear' | 'engaging' | 'compelling';
        next_tier: 'linear' | 'engaging' | 'compelling' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    arc_components: {
        inciting_incident: {
            present: boolean;
            description: string;
        };
        rising_action: {
            present: boolean;
            description: string;
        };
        climax: {
            present: boolean;
            description: string;
        };
        falling_action: {
            present: boolean;
            description: string;
        };
        resolution: {
            present: boolean;
            description: string;
        };
    };
    pacing_check: {
        scene_count: number;
        summary_ratio: 'balanced' | 'too_much_summary' | 'too_much_detail';
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeNarrativeArc(essayText: string): Promise<NarrativeArcAnalysis>;
//# sourceMappingURL=narrativeArcAnalyzer_llm.d.ts.map