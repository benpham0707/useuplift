/**
 * CONTEXT & CIRCUMSTANCES ANALYZER
 *
 * Dimension 9: Context & Circumstances (6% weight)
 *
 * Detects how students navigate obstacles and demonstrate resourcefulness:
 * - Specific obstacles (financial, access, family, language, discrimination, disability)
 * - Resourcefulness patterns ("I used/built/made... instead of")
 * - Resilience markers (bouncing back after failure)
 * - Victimhood tone detection (penalty)
 * - Causal connection to choices (how circumstances shaped actions)
 *
 * Scoring Philosophy:
 * - Specific obstacles + resourcefulness + resilience = 9-10
 * - Vague "it was hard" + victimhood tone = 0-3
 */
export interface ContextCircumstancesAnalysis {
    context_score: number;
    context_quality: 'resourceful_resilience' | 'strong_navigation' | 'mixed_context' | 'vague_hardship' | 'victimhood_tone';
    has_specific_obstacles: boolean;
    obstacle_types: string[];
    obstacle_count: number;
    obstacle_examples: string[];
    shows_resourcefulness: boolean;
    resourcefulness_count: number;
    resourcefulness_examples: string[];
    shows_resilience: boolean;
    resilience_count: number;
    resilience_examples: string[];
    has_causal_connection: boolean;
    causal_connection_count: number;
    causal_examples: string[];
    victimhood_tone: boolean;
    victimhood_count: number;
    victimhood_examples: string[];
    vague_hardship_count: number;
    vague_hardship_examples: string[];
    strengths: string[];
    weaknesses: string[];
    quick_wins: string[];
}
/**
 * Analyze context and circumstances in an essay
 */
export declare function analyzeContextCircumstances(essayText: string): ContextCircumstancesAnalysis;
//# sourceMappingURL=contextCircumstancesAnalyzer.d.ts.map