/**
 * INTELLECTUAL VITALITY LLM ANALYZER
 *
 * Dimension: Intellectual Vitality (8% weight)
 *
 * Evaluates the depth of intellectual curiosity, self-directed learning,
 * and engagement with ideas beyond the classroom.
 *
 * - Does the student "geek out" about ideas?
 * - Is learning self-directed or assigned?
 * - Do they ask questions or just answer them?
 * - Are they consumers of knowledge or producers?
 *
 * Based on the v4 "Gold Standard" Architecture and the 5-Level Intellectual Depth Pyramid.
 */
export interface IntellectualVitalityAnalysis {
    score: number;
    quality_level: 'scholar' | 'explorer' | 'learner' | 'student';
    reasoning: {
        curiosity_analysis: string;
        depth_analysis: string;
        synthesis_analysis: string;
        vitality_signals: string;
    };
    tier_evaluation: {
        current_tier: 'student' | 'learner' | 'explorer' | 'scholar';
        next_tier: 'learner' | 'explorer' | 'scholar' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    curiosity_type: {
        type: 'active' | 'passive' | 'absent';
        examples: string[];
        description: string;
    };
    self_directed_learning: {
        present: boolean;
        examples: string[];
        description: string;
    };
    intellectual_depth: {
        level: 'high' | 'moderate' | 'low';
        concepts_cited: string[];
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
/**
 * Analyze Intellectual Vitality using LLM semantic understanding
 */
export declare function analyzeIntellectualVitality(essayText: string): Promise<IntellectualVitalityAnalysis>;
//# sourceMappingURL=intellectualVitalityAnalyzer_llm.d.ts.map