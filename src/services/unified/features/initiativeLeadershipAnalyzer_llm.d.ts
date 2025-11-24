/**
 * INITIATIVE & LEADERSHIP LLM ANALYZER
 *
 * Dimension: Initiative & Leadership (7% weight)
 *
 * Uses LLM-based semantic analysis to detect:
 * - Proactive problem identification (spotting gaps others miss)
 * - Self-directed learning and risk-taking
 * - Creating opportunities vs joining existing ones
 * - Evidence of independent action vs reactive participation
 * - Implicit/Narrative initiative (showing not just telling)
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface InitiativeLeadershipAnalysis {
    score: number;
    quality_level: 'exceptional_initiative' | 'strong_proactivity' | 'some_initiative' | 'reactive' | 'pure_participation';
    reasoning: {
        context_analysis: string;
        action_analysis: string;
        impact_analysis: string;
        voice_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'participant' | 'contributor' | 'transformer' | 'visionary';
        next_tier: 'contributor' | 'transformer' | 'visionary' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    problem_identification: {
        present: boolean;
        description: string;
    };
    self_directed_action: {
        present: boolean;
        description: string;
    };
    risk_taking: {
        present: boolean;
        description: string;
    };
    opportunity_creation: {
        present: boolean;
        description: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
export declare function analyzeInitiativeLeadership(essayText: string): Promise<InitiativeLeadershipAnalysis>;
//# sourceMappingURL=initiativeLeadershipAnalyzer_llm.d.ts.map