/**
 * ROLE CLARITY & OWNERSHIP LLM ANALYZER
 *
 * Dimension: Role Clarity & Ownership (7% weight)
 *
 * Uses LLM-based semantic analysis to detect:
 * - Individual agency vs team credit ambiguity ("I" vs "we")
 * - Specific role descriptions vs title-only mentions
 * - Differentiation of personal contribution from team's work
 * - Ownership of failures (not just successes)
 *
 * This analyzer uses Claude API for dynamic, semantic understanding
 * rather than rigid pattern matching. It follows the v4 "Gold Standard"
 * architecture.
 */
export interface RoleClarityAnalysis {
    score: number;
    quality_level: 'culture_setter' | 'outcome_owner' | 'task_owner' | 'passenger';
    reasoning: {
        context_analysis: string;
        action_analysis: string;
        impact_analysis: string;
        voice_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'passenger' | 'task_owner' | 'outcome_owner' | 'culture_setter';
        next_tier: 'task_owner' | 'outcome_owner' | 'culture_setter' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    agency_balance: {
        description: string;
        examples: string[];
    };
    role_description: {
        clarity: 'specific' | 'mentioned' | 'title_only' | 'absent';
        description: string;
    };
    differentiation_from_team: {
        present: boolean;
        description: string;
    };
    failure_ownership: {
        present: boolean;
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    confidence: number;
}
/**
 * Analyze Role Clarity & Ownership using LLM semantic understanding
 */
export declare function analyzeRoleClarity(essayText: string): Promise<RoleClarityAnalysis>;
//# sourceMappingURL=roleClarityAnalyzer_llm.d.ts.map