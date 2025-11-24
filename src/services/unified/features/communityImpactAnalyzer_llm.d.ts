/**
 * COMMUNITY IMPACT LLM ANALYZER
 *
 * Dimension: Community Impact (7% weight)
 *
 * Evaluates the tangible difference the student made:
 * - Did they identify a specific need and address it?
 * - Did they mobilize others or go it alone?
 * - Does the impact last beyond their presence?
 * - Who specifically benefited?
 *
 * Based on the v4 "Gold Standard" Architecture.
 */
export interface CommunityImpactAnalysis {
    score: number;
    quality_level: 'changemaker' | 'leader' | 'contributor' | 'participant';
    reasoning: {
        need_identification: string;
        beneficiary_analysis: string;
        scale_analysis: string;
        longevity_analysis: string;
    };
    tier_evaluation: {
        current_tier: 'participant' | 'contributor' | 'leader' | 'changemaker';
        next_tier: 'contributor' | 'leader' | 'changemaker' | 'max_tier';
        tier_reasoning: string;
    };
    evidence_quotes: string[];
    evaluator_note: string;
    impact_scope: {
        type: 'systemic' | 'group' | 'individual' | 'unclear';
        description: string;
    };
    beneficiary_clarity: {
        specific: boolean;
        identified_group: string;
    };
    sustainability: {
        lasting: boolean;
        mechanism: string;
    };
    strengths: string[];
    weaknesses: string[];
    strategic_pivot: string;
    writer_prompts: string[];
    confidence: number;
}
/**
 * Analyze Community Impact using LLM semantic understanding
 */
export declare function analyzeCommunityImpact(essayText: string): Promise<CommunityImpactAnalysis>;
//# sourceMappingURL=communityImpactAnalyzer_llm.d.ts.map