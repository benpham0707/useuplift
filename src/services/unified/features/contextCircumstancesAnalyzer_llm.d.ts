/**
 * CONTEXT & CIRCUMSTANCES LLM ANALYZER
 *
 * Dimension: Context & Circumstances (6% weight)
 *
 * Evaluates how students contextualize their experiences:
 * - Obstacles, constraints, or unique circumstances
 * - Resourcefulness and creative problem-solving
 * - Avoiding victimhood while acknowledging challenges
 * - Awareness of privilege/advantages vs. constraints
 *
 * This dimension is PIQ-specific (not in extracurricular workshop)
 * but follows the same depth and rigor standards.
 */
export interface ContextCircumstancesAnalysis {
    score: number;
    quality_level: 'alchemist' | 'navigator' | 'survivor' | 'victim_bystander';
    reasoning: {
        context_analysis: string;
        action_analysis: string;
        impact_analysis: string;
        voice_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'victim_bystander' | 'survivor' | 'navigator' | 'alchemist';
        next_tier: 'survivor' | 'navigator' | 'alchemist' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    obstacles_constraints: {
        present: boolean;
        types: string[];
        specificity: 'specific' | 'mentioned' | 'generic' | 'absent';
        examples: string[];
        description: string;
    };
    resourcefulness: {
        present: boolean;
        examples: string[];
        description: string;
    };
    tone_assessment: {
        victimhood: boolean;
        agency: boolean;
        privilege_awareness: boolean;
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
/**
 * Analyze Context & Circumstances using LLM semantic understanding
 */
export declare function analyzeContextCircumstances(essayText: string): Promise<ContextCircumstancesAnalysis>;
//# sourceMappingURL=contextCircumstancesAnalyzer_llm.d.ts.map